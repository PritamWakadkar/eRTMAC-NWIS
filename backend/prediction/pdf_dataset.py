"""
Turns events extracted from uploaded PDFs into a labelled training table.

One row = one depth bin of one well.
  label  y_<event> = 1 if an event of that type occurs inside [start, start+bin)
  features are evaluated at the bin START (see event_features.py)

Coverage assumption: the report covers the well between its first and last
event, padded by PAD_M. If you know each well's true drilled interval
(e.g. from the wells table), replace that range in build_pdf_rows().
"""

import math

import numpy as np
import pandas as pd

from .config import BIN_M, PAD_M, PDF_DATASET_FILE
from .event_features import PARAM_COLUMNS, compute_features, feature_names
from .event_source import EventSource
from .parameter_store import load_parameters, nearest_parameters


def build_pdf_rows(snapshot, event_types, bin_m=BIN_M, pad_m=PAD_M):
    rows = []

    for well_key, events in snapshot.events.items():

        depths = [d for _, d, _ in events if d is not None]
        if not depths:
            if events:
                print(
                    f"Skipping {snapshot.display[well_key]}: "
                    f"{len(events)} events but none has a usable depth."
                )
            continue

        param_rows = load_parameters(snapshot.display[well_key])

        first = math.floor((min(depths) - pad_m) / bin_m) * bin_m
        last = max(depths) + pad_m
        start = max(0.0, first)

        while start <= last:

            row = {
                "well_id": snapshot.display[well_key],
                "source": "pdf",
                "depth_m": start,
            }

            found = nearest_parameters(param_rows, start)

            for column in PARAM_COLUMNS:
                row[column] = (
                    found[column]["value"] if column in found else np.nan
                )

            row.update(
                compute_features(snapshot, well_key, start, event_types)
            )

            for event_type in event_types:
                row[f"y_{event_type}"] = int(any(
                    t == event_type
                    and d is not None
                    and start <= d < start + bin_m
                    for t, d, _ in events
                ))

            rows.append(row)
            start += bin_m

    return rows


def synthetic_rows(event_types):
    """Optional: convert the old synthetic table to the new layout."""
    from .dataset import load_dataset

    df = load_dataset()
    out = pd.DataFrame({
        "well_id": df["well_id"],
        "source": "synthetic",
        "depth_m": df["depth_m"],
    })

    for column in PARAM_COLUMNS:
        out[column] = df[column]

    for column in feature_names(event_types):
        if column not in out.columns:
            out[column] = np.nan

    for event_type in event_types:
        out[f"y_{event_type}"] = (df["event"] == event_type).astype(int)

    return out


def build_training_frame(
    source=None,
    bin_m=BIN_M,
    pad_m=PAD_M,
    with_synthetic=False,
    save=True,
):
    """
    Returns (frame, event_types, feature_columns).
    Synthetic rows are OFF by default: they have no offset features while
    PDF rows have no parameters, so mixing them lets the model learn
    "which source is this row from" instead of drilling behaviour.
    """

    source = source or EventSource()
    snapshot = source.snapshot()

    event_types = sorted({
        t
        for events in snapshot.events.values()
        for t, _, _ in events
        if t and t != "normal"
    })

    if with_synthetic:
        from .dataset import load_dataset
        event_types = sorted(
            set(event_types)
            | (set(load_dataset()["event"]) - {"normal"})
        )

    if not event_types:
        raise ValueError(
            "No events found. Upload and process PDF reports first."
        )

    frame = pd.DataFrame(
        build_pdf_rows(snapshot, event_types, bin_m, pad_m)
    )

    if with_synthetic:
        frame = pd.concat(
            [frame, synthetic_rows(event_types)],
            ignore_index=True
        )

    if frame.empty:
        raise ValueError(
            "Events were found but none has a usable depth."
        )

    columns = feature_names(event_types)

    if save:
        frame.to_csv(PDF_DATASET_FILE, index=False)

    return frame, event_types, columns