"""
Feature engineering from historical events.

The SAME function is used for training rows and for live prediction,
so the model sees identical features in both places.

Leakage rules:
  * Offset features use only OTHER wells' events.
  * The well's own events are used only if they are SHALLOWER than the
    depth being evaluated (they have already happened while drilling).
"""

from .config import (
    FEATURE_WINDOW_M,
    FEATURE_RADIUS_KM,
    OFFSET_STRENGTH,
)
from .event_source import haversine_km

PARAM_COLUMNS = [
    "rop_m_hr",
    "mud_weight_sg",
    "torque_knm",
    "ecd_sg",
    "pump_rate_l_min",
]


def feature_names(event_types):
    names = ["depth_m"] + PARAM_COLUMNS + ["own_prior_events"]
    for event_type in event_types:
        names.append(f"offset_score_{event_type}")
        names.append(f"offset_count_{event_type}")
        names.append(f"offset_gap_{event_type}")
    return names


def compute_features(
    snapshot,
    well_key,
    depth_m,
    event_types,
    window_m=FEATURE_WINDOW_M,
    radius_km=FEATURE_RADIUS_KM,
):
    depth_m = float(depth_m)
    gap_cap = window_m * 5.0

    target_lat, target_lon = snapshot.coords.get(well_key, (None, None))

    remaining = {et: 1.0 for et in event_types}
    counts = {et: 0 for et in event_types}
    nearest = {et: gap_cap for et in event_types}

    for other_key, events in snapshot.events.items():

        if other_key == well_key:
            continue

        lat, lon = snapshot.coords.get(other_key, (None, None))

        if (
            target_lat is not None and target_lon is not None
            and lat is not None and lon is not None
        ):
            distance = haversine_km(target_lat, target_lon, lat, lon)
            if distance > radius_km:
                continue
            distance_factor = max(0.1, 1.0 - distance / radius_km)
        else:
            # Location unknown: treat as a weak offset.
            distance_factor = 0.5

        for event_type, event_depth, _ in events:

            if event_type not in remaining or event_depth is None:
                continue

            difference = abs(event_depth - depth_m)
            nearest[event_type] = min(nearest[event_type], difference)

            if difference > window_m:
                continue

            depth_factor = 1.0 - difference / window_m
            remaining[event_type] *= (
                1.0 - OFFSET_STRENGTH * depth_factor * distance_factor
            )
            counts[event_type] += 1

    own_prior = sum(
        1
        for _, event_depth, _ in snapshot.events.get(well_key, [])
        if event_depth is not None and event_depth < depth_m
    )

    features = {"own_prior_events": own_prior}

    for event_type in event_types:
        features[f"offset_score_{event_type}"] = round(
            1.0 - remaining[event_type], 6
        )
        features[f"offset_count_{event_type}"] = counts[event_type]
        features[f"offset_gap_{event_type}"] = round(
            min(nearest[event_type], gap_cap), 3
        )

    return features