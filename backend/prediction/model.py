from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestClassifier

from .config import MODEL_FILE, RANDOM_STATE
from .dataset import load_dataset
from .features import prepare_features, encode_target


class DrillingEventModel:

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=RANDOM_STATE,
            class_weight="balanced",
        )

        self.class_mapping = {}
        self.reverse_mapping = {}

    def train(self, X, y):
        """
        Train the Random Forest model.
        """

        encoded_y, class_mapping = encode_target(y)

        self.class_mapping = class_mapping

        self.reverse_mapping = {
            value: key
            for key, value in class_mapping.items()
        }

        self.model.fit(X, encoded_y)

        return self

    def predict(self, X):
        """
        Predict event classes.
        """

        predictions = self.model.predict(X)

        return [
            self.reverse_mapping[int(prediction)]
            for prediction in predictions
        ]

    def predict_probabilities(self, X):
        """
        Return probability for every event class.
        """

        probabilities = self.model.predict_proba(X)

        results = []

        for row in probabilities:

            prediction = {}

            for class_id, probability in zip(
                self.model.classes_,
                row
            ):
                event_name = self.reverse_mapping[int(class_id)]

                prediction[event_name] = float(probability)

            results.append(prediction)

        return results

    def save(self):
        """
        Save trained model to disk.
        """

        MODEL_FILE.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        model_data = {
            "model": self.model,
            "class_mapping": self.class_mapping,
            "reverse_mapping": self.reverse_mapping
        }

        joblib.dump(
            model_data,
            MODEL_FILE
        )

        print(
            f"Model saved to: {MODEL_FILE}"
        )

    def load(self):
        """
        Load trained model from disk.
        """

        if not MODEL_FILE.exists():
            raise FileNotFoundError(
                "Trained model not found. "
                "Run training first."
            )

        model_data = joblib.load(MODEL_FILE)

        self.model = model_data["model"]
        self.class_mapping = model_data["class_mapping"]
        self.reverse_mapping = model_data["reverse_mapping"]

        print(
            f"Model loaded from: {MODEL_FILE}"
        )

        return self


if __name__ == "__main__":

    print("Loading training dataset...")

    dataframe = load_dataset()

    print(
        f"Dataset contains "
        f"{len(dataframe)} records."
    )

    X, y = prepare_features(dataframe)

    print("\nTraining Random Forest model...")

    model = DrillingEventModel()

    model.train(X, y)

    print("\nModel training completed.")

    print("\nClass mapping:")

    print(model.class_mapping)

    model.save()

    print("\nModel is ready.")