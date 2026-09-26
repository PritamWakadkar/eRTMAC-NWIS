import pandas as pd

from .config import (
    DATASET_FILE,
    EVENT_TYPES
)


# ==========================================================
# CREATE SYNTHETIC TRAINING DATA
# ==========================================================

def create_training_data():

    records = [

        # ==================================================
        # W104
        # ==================================================

        {
            "well_id": "W104",
            "depth_m": 2350,
            "rop_m_hr": 18.0,
            "mud_weight_sg": 1.16,
            "torque_knm": 10.5,
            "ecd_sg": 1.21,
            "pump_rate_l_min": 1850,
            "distance_km": 0.0,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W104",
            "depth_m": 2410,
            "rop_m_hr": 17.5,
            "mud_weight_sg": 1.16,
            "torque_knm": 11.2,
            "ecd_sg": 1.23,
            "pump_rate_l_min": 1850,
            "distance_km": 0.0,
            "formation": "Barail Formation",
            "event": "mud_loss"
        },

        {
            "well_id": "W104",
            "depth_m": 2440,
            "rop_m_hr": 17.3,
            "mud_weight_sg": 1.18,
            "torque_knm": 12.0,
            "ecd_sg": 1.23,
            "pump_rate_l_min": 1850,
            "distance_km": 0.0,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W104",
            "depth_m": 2465,
            "rop_m_hr": 17.2,
            "mud_weight_sg": 1.18,
            "torque_knm": 14.0,
            "ecd_sg": 1.23,
            "pump_rate_l_min": 1850,
            "distance_km": 0.0,
            "formation": "Barail Formation",
            "event": "torque_spike"
        },

        {
            "well_id": "W104",
            "depth_m": 2470,
            "rop_m_hr": 17.0,
            "mud_weight_sg": 1.18,
            "torque_knm": 13.5,
            "ecd_sg": 1.23,
            "pump_rate_l_min": 1850,
            "distance_km": 0.0,
            "formation": "Barail Formation",
            "event": "wiper_trip"
        },

        # ==================================================
        # W105
        # ==================================================

        {
            "well_id": "W105",
            "depth_m": 2500,
            "rop_m_hr": 16.5,
            "mud_weight_sg": 1.19,
            "torque_knm": 12.0,
            "ecd_sg": 1.25,
            "pump_rate_l_min": 1900,
            "distance_km": 2.67,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W105",
            "depth_m": 2580,
            "rop_m_hr": 16.2,
            "mud_weight_sg": 1.19,
            "torque_knm": 12.0,
            "ecd_sg": 1.25,
            "pump_rate_l_min": 1900,
            "distance_km": 2.67,
            "formation": "Barail Formation",
            "event": "mud_loss"
        },

        {
            "well_id": "W105",
            "depth_m": 2600,
            "rop_m_hr": 16.0,
            "mud_weight_sg": 1.19,
            "torque_knm": 13.0,
            "ecd_sg": 1.25,
            "pump_rate_l_min": 1900,
            "distance_km": 2.67,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W105",
            "depth_m": 2630,
            "rop_m_hr": 15.8,
            "mud_weight_sg": 1.19,
            "torque_knm": 16.0,
            "ecd_sg": 1.25,
            "pump_rate_l_min": 1900,
            "distance_km": 2.67,
            "formation": "Barail Formation",
            "event": "torque_spike"
        },

        {
            "well_id": "W105",
            "depth_m": 2642,
            "rop_m_hr": 15.7,
            "mud_weight_sg": 1.19,
            "torque_knm": 15.5,
            "ecd_sg": 1.25,
            "pump_rate_l_min": 1900,
            "distance_km": 2.67,
            "formation": "Barail Formation",
            "event": "drag"
        },

        # ==================================================
        # W106
        # ==================================================

        {
            "well_id": "W106",
            "depth_m": 2500,
            "rop_m_hr": 17.0,
            "mud_weight_sg": 1.18,
            "torque_knm": 11.0,
            "ecd_sg": 1.22,
            "pump_rate_l_min": 1880,
            "distance_km": 6.81,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W106",
            "depth_m": 2580,
            "rop_m_hr": 16.8,
            "mud_weight_sg": 1.18,
            "torque_knm": 11.5,
            "ecd_sg": 1.23,
            "pump_rate_l_min": 1880,
            "distance_km": 6.81,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W106",
            "depth_m": 2630,
            "rop_m_hr": 16.7,
            "mud_weight_sg": 1.18,
            "torque_knm": 12.0,
            "ecd_sg": 1.23,
            "pump_rate_l_min": 1880,
            "distance_km": 6.81,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W106",
            "depth_m": 2650,
            "rop_m_hr": 16.5,
            "mud_weight_sg": 1.18,
            "torque_knm": 12.5,
            "ecd_sg": 1.23,
            "pump_rate_l_min": 1880,
            "distance_km": 6.81,
            "formation": "Barail Formation",
            "event": "normal"
        },

        # ==================================================
        # ADDITIONAL SYNTHETIC NORMAL CONDITIONS
        # ==================================================

        {
            "well_id": "W104",
            "depth_m": 2200,
            "rop_m_hr": 18.5,
            "mud_weight_sg": 1.15,
            "torque_knm": 9.5,
            "ecd_sg": 1.20,
            "pump_rate_l_min": 1800,
            "distance_km": 0.0,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W105",
            "depth_m": 2300,
            "rop_m_hr": 17.2,
            "mud_weight_sg": 1.18,
            "torque_knm": 10.5,
            "ecd_sg": 1.22,
            "pump_rate_l_min": 1880,
            "distance_km": 2.67,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W106",
            "depth_m": 2400,
            "rop_m_hr": 17.4,
            "mud_weight_sg": 1.17,
            "torque_knm": 10.8,
            "ecd_sg": 1.22,
            "pump_rate_l_min": 1850,
            "distance_km": 6.81,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W104",
            "depth_m": 2520,
            "rop_m_hr": 16.8,
            "mud_weight_sg": 1.18,
            "torque_knm": 12.5,
            "ecd_sg": 1.24,
            "pump_rate_l_min": 1860,
            "distance_km": 0.0,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W105",
            "depth_m": 2700,
            "rop_m_hr": 15.5,
            "mud_weight_sg": 1.20,
            "torque_knm": 13.5,
            "ecd_sg": 1.26,
            "pump_rate_l_min": 1920,
            "distance_km": 2.67,
            "formation": "Barail Formation",
            "event": "normal"
        },

        {
            "well_id": "W106",
            "depth_m": 2750,
            "rop_m_hr": 16.2,
            "mud_weight_sg": 1.19,
            "torque_knm": 12.8,
            "ecd_sg": 1.25,
            "pump_rate_l_min": 1900,
            "distance_km": 6.81,
            "formation": "Barail Formation",
            "event": "normal"
        }
    ]

    return records


# ==========================================================
# CONVERT RECORDS TO DATAFRAME
# ==========================================================

def build_dataframe():

    records = create_training_data()

    dataframe = pd.DataFrame(records)

    return dataframe


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

    # Check event labels
    allowed_events = set(EVENT_TYPES) | {"normal"}

    invalid_events = set(
        dataframe["event"]
    ) - allowed_events

    if invalid_events:

        raise ValueError(
            f"Invalid event labels: {invalid_events}"
        )

    # Check missing values
    if dataframe.isnull().any().any():

        raise ValueError(
            "Dataset contains missing values."
        )

    return True


# ==========================================================
# SAVE DATASET
# ==========================================================

def save_dataset():

    dataframe = build_dataframe()

    validate_dataset(dataframe)

    dataframe.to_csv(
        DATASET_FILE,
        index=False
    )

    print(
        f"Training dataset saved to: {DATASET_FILE}"
    )

    print(
        f"Total records: {len(dataframe)}"
    )

    print(
        "\nEvent distribution:"
    )

    print(
        dataframe["event"].value_counts()
    )

    return dataframe


# ==========================================================
# LOAD DATASET
# ==========================================================

def load_dataset():

    if not DATASET_FILE.exists():

        print(
            "Training dataset not found."
        )

        print(
            "Creating training dataset..."
        )

        return save_dataset()

    dataframe = pd.read_csv(
        DATASET_FILE
    )

    validate_dataset(dataframe)

    return dataframe


# ==========================================================
# MAIN
# ==========================================================

if __name__ == "__main__":

    dataframe = save_dataset()

    print(
        "\nFirst five records:"
    )

    print(
        dataframe.head()
    )