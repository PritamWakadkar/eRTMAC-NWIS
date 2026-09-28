"""
Train the drilling-event model from events extracted from uploaded PDFs.

Run from the project root (adjust the package path to yours):

    python -m backend.prediction.train
    python -m backend.prediction.train --min-positives 10 --min-bins 100
    python -m backend.prediction.train --with-synthetic
"""

import argparse
import json

from .config import BIN_M, MIN_BINS, MIN_POSITIVES
from .model import DrillingEventModel
from .pdf_dataset import build_training_frame


def train_model(
    bin_m=BIN_M,
    min_bins=MIN_BINS,
    min_positives=MIN_POSITIVES,
    with_synthetic=False,
    verbose=True,
):
    """
    Returns a report dict. The saved model is only replaced when at least
    one event type passes the quality gate.
    """

    def log(*args):
        if verbose:
            print(*args)

    log("=" * 50)
    log("eRTMAC-NWIS training from PDF events")
    log("=" * 50)

    frame, event_types, columns = build_training_frame(
        bin_m=bin_m,
        with_synthetic=with_synthetic,
    )

    log(f"Rows: {len(frame)}   Wells: {frame['well_id'].nunique()}")
    log(f"Event types: {event_types}")

    if len(frame) < min_bins:
        message = (
            f"Only {len(frame)} rows (< {min_bins}). Not enough data; "
            "keeping event-based scoring. Upload more reports or lower "
            "--min-bins."
        )
        log(message)
        return {"trained": False, "reason": message}

    model = DrillingEventModel()
    metrics = model.train(
        frame,
        event_types,
        columns,
        min_positives=min_positives,
    )

    log("\nPer-event results (validated leave-wells-out):")
    log(json.dumps(metrics, indent=2))

    if not model.is_ready:
        message = (
            "No event type passed the quality gate. Model NOT saved; "
            "event-based scoring stays active."
        )
        log(message)
        return {"trained": False, "reason": message, "metrics": metrics}

    model.save()

    log(f"\nSaved model version {model.version} "
        f"({len(model.pipelines)} event types).")

    return {
        "trained": True,
        "version": model.version,
        "modelled_events": sorted(model.pipelines),
        "metrics": metrics,
    }


if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument("--bin-m", type=float, default=BIN_M)
    parser.add_argument("--min-bins", type=int, default=MIN_BINS)
    parser.add_argument("--min-positives", type=int, default=MIN_POSITIVES)
    parser.add_argument("--with-synthetic", action="store_true")
    args = parser.parse_args()

    train_model(
        bin_m=args.bin_m,
        min_bins=args.min_bins,
        min_positives=args.min_positives,
        with_synthetic=args.with_synthetic,
    )