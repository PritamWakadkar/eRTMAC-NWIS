"""
Run from the project root:

    python -m backend.prediction.test_prediction

Steps 1-4 use an in-memory fake snapshot (no database needed).
Step 5 uses your real database and is skipped if it is unavailable.
"""

import pandas as pd

from .dataset import load_dataset
from .event_features import compute_features, feature_names
from .event_source import EventSnapshot
from .feature_lookup import FeatureLookup
from .model import DrillingEventModel
from .pdf_dataset import build_pdf_rows


def fake_snapshot():
    """Four nearby wells with mud_loss and torque_spike around 2400-2600 m."""

    snap = EventSnapshot()

    layout = {
        "W1": (27.50, 95.20, [("mud_loss", 2410), ("torque_spike", 2560)]),
        "W2": (27.52, 95.22, [("mud_loss", 2430), ("torque_spike", 2580)]),
        "W3": (27.54, 95.24, [("mud_loss", 2390), ("torque_spike", 2540)]),
        "W4": (27.56, 95.26, [("mud_loss", 2420), ("torque_spike", 2570)]),
    }

    for well_id, (lat, lon, events) in layout.items():
        snap.add_well(well_id, lat, lon)
        snap.events[well_id] = [
            (event_type, float(depth), {"document": f"{well_id}.pdf", "page": 1})
            for event_type, depth in events
        ]

    return snap


def test_synthetic_dataset():
    df = load_dataset()
    assert len(df) > 0
    print(f"[1] synthetic dataset OK ({len(df)} rows)")


def test_feature_lookup():
    result = FeatureLookup().get_features("W105", 2600)
    assert result["well_id"] == "W105"
    print("[2] feature lookup OK")


def test_no_leakage():
    snap = fake_snapshot()
    types = ["mud_loss", "torque_spike"]

    # W1's own mud_loss is at 2410. Evaluating W1 at 2400 must NOT count it.
    at_2400 = compute_features(snap, "W1", 2400, types)
    assert at_2400["own_prior_events"] == 0

    # After 2410 it has happened, so it may count as prior.
    at_2500 = compute_features(snap, "W1", 2500, types)
    assert at_2500["own_prior_events"] == 1

    # Offset score comes only from OTHER wells and must be > 0 here.
    assert at_2400["offset_score_mud_loss"] > 0
    print("[3] leakage rules OK")


def test_training():
    snap = fake_snapshot()
    types = ["mud_loss", "torque_spike"]

    rows = pd.DataFrame(build_pdf_rows(snap, types))
    assert not rows.empty

    model = DrillingEventModel()
    metrics = model.train(
        rows, types, feature_names(types), min_positives=3
    )

    assert set(metrics) == set(types)
    print("[4] training ran. Per-event metrics:")
    for event_type, report in metrics.items():
        print("   ", event_type, report)

    if model.is_ready:
        sample = rows[feature_names(types)].head(2)
        print("    sample probabilities:", model.predict_probabilities(sample))


def test_predictor_with_database():
    try:
        from .predictor import DrillingEventPredictor
        predictor = DrillingEventPredictor()
        result = predictor.predict_well("W105", 2600)
    except Exception as e:
        print(f"[5] skipped (database/RAG not available): {e}")
        return

    print(f"[5] predictor OK, method = {result['method']}")
    for item in result["predictions"]:
        print(f"    {item['event']:20} {item['probability']:.4f}")


if __name__ == "__main__":
    test_synthetic_dataset()
    test_feature_lookup()
    test_no_leakage()
    test_training()
    test_predictor_with_database()
    print("\nAll checks finished.")