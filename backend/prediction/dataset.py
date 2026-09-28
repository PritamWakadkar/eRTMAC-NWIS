import pandas as pd

from .config import (
    DATASET_FILE,
    EVENT_TYPES
)


# ==========================================================
# SYNTHETIC DRILLING-PARAMETER TABLE
# (same records as before, written in compact form)
#
# Used by FeatureLookup to fetch drilling parameters for a
# well/depth. It is NOT the training data any more: the model
# is trained from PDF events (see pdf_dataset.py).
# ==========================================================

FORMATION = "Barail Formation"

WELL_DISTANCE_KM = {
    "W104": 0.0,
    "W105": 2.67,
    "W106": 6.81,
}

# (well_id, depth_m, rop_m_hr, mud_weight_sg, torque_knm,
#  ecd_sg, pump_rate_l_min, event)
RAW_RECORDS = [

    # W104
    ("W104", 2350, 18.0, 1.16, 10.5, 1.21, 1850, "normal"),
    ("W104", 2410, 17.5, 1.16, 11.2, 1.23, 1850, "mud_loss"),
    ("W104", 2440, 17.3, 1.18, 12.0, 1.23, 1850, "normal"),
    ("W104", 2465, 17.2, 1.18, 14.0, 1.23, 1850, "torque_spike"),
    ("W104", 2470, 17.0, 1.18, 13.5, 1.23, 1850, "wiper_trip"),

    # W105
    ("W105", 2500, 16.5, 1.19, 12.0, 1.25, 1900, "normal"),
    ("W105", 2580, 16.2, 1.19, 12.0, 1.25, 1900, "mud_loss"),
    ("W105", 2600, 16.0, 1.19, 13.0, 1.25, 1900, "normal"),
    ("W105", 2630, 15.8, 1.19, 16.0, 1.25, 1900, "torque_spike"),
    ("W105", 2642, 15.7, 1.19, 15.5, 1.25, 1900, "drag"),

    # W106
    ("W106", 2500, 17.0, 1.18, 11.0, 1.22, 1880, "normal"),
    ("W106", 2580, 16.8, 1.18, 11.5, 1.23, 1880, "normal"),
    ("W106", 2630, 16.7, 1.18, 12.0, 1.23, 1880, "normal"),
    ("W106", 2650, 16.5, 1.18, 12.5, 1.23, 1880, "normal"),

    # Additional normal conditions
    ("W104", 2200, 18.5, 1.15, 9.5, 1.20, 1800, "normal"),
    ("W105", 2300, 17.2, 1.18, 10.5, 1.22, 1880, "normal"),
    ("W106", 2400, 17.4, 1.17, 10.8, 1.22, 1850, "normal"),
    ("W104", 2520, 16.8, 1.18, 12.5, 1.24, 1860, "normal"),
    ("W105", 2700, 15.5, 1.20, 13.5, 1.26, 1920, "normal"),
    ("W106", 2750, 16.2, 1.19, 12.8, 1.25, 1900, "normal"),
]


# ==========================================================
# CREATE RECORDS
# ==========================================================

def create_training_data():

    records = []

    for (
        well_id,
        depth_m,
        rop,
        mud_weight,
        torque,
        ecd,
        pump_rate,
        event
    ) in RAW_RECORDS:

        records.append({
            "well_id": well_id,
            "depth_m": depth_m,
            "rop_m_hr": rop,
            "mud_weight_sg": mud_weight,
            "torque_knm": torque,
            "ecd_sg": ecd,
            "pump_rate_l_min": pump_rate,
            "distance_km": WELL_DISTANCE_KM[well_id],
            "formation": FORMATION,
            "event": event
        })

    return records


# ==========================================================
# CONVERT RECORDS TO DATAFRAME
# ==========================================================

def build_dataframe():

    return pd.DataFrame(create_training_data())


# ==========================================================
# VALIDATE DATASET
# ==========================================================

def validate_dataset(dataframe):

    required_columns = [
        "well_id",
        "depth_m",
        "rop_m_hr",
        "mud_weight_sg",
        "torque_knm",
        "ecd_sg",
        "pump_rate_l_min",
        "distance_km",
        "formation",
        "event"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing dataset columns: {missing_columns}"
        )

    allowed_events = set(EVENT_TYPES) | {"normal"}

    invalid_events = set(dataframe["event"]) - allowed_events

    if invalid_events:
        raise ValueError(
            f"Invalid event labels: {invalid_events}"
        )

    if dataframe.isnull().any().any():
        raise ValueError(
            "Dataset contains missing values."
        )

    return True


# ==========================================================
# SAVE / LOAD
# ==========================================================

def save_dataset():

    dataframe = build_dataframe()

    validate_dataset(dataframe)

    DATASET_FILE.parent.mkdir(parents=True, exist_ok=True)

    dataframe.to_csv(DATASET_FILE, index=False)

    print(f"Dataset saved to: {DATASET_FILE}")
    print(f"Total records: {len(dataframe)}")
    print("\nEvent distribution:")
    print(dataframe["event"].value_counts())

    return dataframe


def load_dataset():

    if not DATASET_FILE.exists():

        print("Dataset not found. Creating it...")

        return save_dataset()

    dataframe = pd.read_csv(DATASET_FILE)

    validate_dataset(dataframe)

    return dataframe


if __name__ == "__main__":

    dataframe = save_dataset()

    print("\nFirst five records:")
    print(dataframe.head())