import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    roc_auc_score,
)
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline

from .config import (
    MODEL_FILE,
    MAX_CV_SPLITS,
    MIN_POSITIVES,
    MIN_PR_LIFT,
    RANDOM_STATE,
)


def _make_pipeline():
    return Pipeline([
        ("impute", SimpleImputer(strategy="median", add_indicator=True)),
        ("forest", RandomForestClassifier(
            n_estimators=300,
            min_samples_leaf=2,
            class_weight="balanced_subsample",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )),
    ])


class DrillingEventModel:
    """One binary classifier per event type (multi-label)."""

    def __init__(self):
        self.pipelines = {}
        self.feature_columns = []
        self.feature_event_types = []
        self.metrics = {}
        self.version = None

    @property
    def is_ready(self):
        return bool(self.pipelines)

    # ------------------------------------------------------
    # TRAIN + EVALUATE (grouped by well, never by row)
    # ------------------------------------------------------

    def train(
        self,
        frame,
        event_types,
        feature_columns,
        min_positives=MIN_POSITIVES,
        min_lift=MIN_PR_LIFT,
    ):
        # Drop columns that are entirely missing (e.g. parameters that
        # PDF events do not contain).
        columns = [c for c in feature_columns if frame[c].notna().any()]

        X = frame[columns]
        groups = frame["well_id"]

        n_wells = groups.nunique()
        if n_wells < 2:
            raise ValueError(
                "Need events from at least 2 wells to validate by well."
            )

        cv = GroupKFold(n_splits=min(MAX_CV_SPLITS, n_wells))

        self.pipelines = {}
        self.metrics = {}
        self.feature_columns = columns
        self.feature_event_types = list(event_types)

        for event_type in event_types:

            y = frame[f"y_{event_type}"].astype(int)
            positives = int(y.sum())
            prevalence = float(y.mean())

            report = {
                "rows": int(len(y)),
                "positives": positives,
                "prevalence": round(prevalence, 4),
                "accepted": False,
            }

            if positives < min_positives:
                report["reason"] = (
                    f"only {positives} positives (< {min_positives})"
                )
                self.metrics[event_type] = report
                continue

            if positives == len(y):
                report["reason"] = "all rows positive"
                self.metrics[event_type] = report
                continue

            oof = np.zeros(len(y), dtype=float)

            for train_idx, test_idx in cv.split(X, y, groups):

                y_train = y.iloc[train_idx]

                if y_train.nunique() < 2:
                    oof[test_idx] = float(y_train.mean())
                    continue

                pipeline = _make_pipeline()
                pipeline.fit(X.iloc[train_idx], y_train)
                oof[test_idx] = pipeline.predict_proba(
                    X.iloc[test_idx]
                )[:, 1]

            pr_auc = float(average_precision_score(y, oof))
            report.update({
                "pr_auc": round(pr_auc, 4),
                "baseline_pr_auc": round(prevalence, 4),
                "roc_auc": round(float(roc_auc_score(y, oof)), 4),
                "brier": round(float(brier_score_loss(y, oof)), 4),
            })

            if pr_auc < prevalence * min_lift:
                report["reason"] = "does not beat the prevalence baseline"
                self.metrics[event_type] = report
                continue

            final = _make_pipeline()
            final.fit(X, y)

            self.pipelines[event_type] = final
            report["accepted"] = True
            self.metrics[event_type] = report

        self.version = pd.Timestamp.utcnow().strftime("%Y%m%d%H%M%S")

        return self.metrics

    # ------------------------------------------------------
    # PREDICT
    # ------------------------------------------------------

    def predict_probabilities(self, data):
        """Returns [{event: probability}, ...], one dict per input row."""

        X = data.reindex(columns=self.feature_columns)

        results = [dict() for _ in range(len(X))]

        for event_type, pipeline in self.pipelines.items():
            probabilities = pipeline.predict_proba(X)[:, 1]
            for i, value in enumerate(probabilities):
                results[i][event_type] = float(value)

        return results

    # ------------------------------------------------------
    # SAVE / LOAD
    # ------------------------------------------------------

    def save(self, path=MODEL_FILE):
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            "pipelines": self.pipelines,
            "feature_columns": self.feature_columns,
            "feature_event_types": self.feature_event_types,
            "metrics": self.metrics,
            "version": self.version,
        }, path)

    def load(self, path=MODEL_FILE):
        """Returns True if a trained model was loaded."""
        if not path.exists():
            return False
        try:
            payload = joblib.load(path)
        except Exception as e:
            print("Could not load model:", e)
            return False

        self.pipelines = payload.get("pipelines", {})
        self.feature_columns = payload.get("feature_columns", [])
        self.feature_event_types = payload.get("feature_event_types", [])
        self.metrics = payload.get("metrics", {})
        self.version = payload.get("version")
        return self.is_ready