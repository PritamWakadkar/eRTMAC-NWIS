from pathlib import Path


# ==========================================================
# PREDICTION DIRECTORY
# ==========================================================

PREDICTION_DIR = Path(__file__).resolve().parent


# ==========================================================
# DATA DIRECTORY
# ==========================================================

DATA_DIR = PREDICTION_DIR / "data"

DATASET_FILE = DATA_DIR / "training_data.csv"


# ==========================================================
# MODEL DIRECTORY
# ==========================================================

MODEL_DIR = PREDICTION_DIR / "models"

MODEL_FILE = MODEL_DIR / "drilling_event_model.joblib"


# ==========================================================
# PREDICTION SETTINGS
# ==========================================================

TEST_SIZE = 0.20

RANDOM_STATE = 42


# ==========================================================
# SUPPORTED EVENTS
# ==========================================================

EVENT_TYPES = [
    "mud_loss",
    "torque_spike",
    "drag",
    "wiper_trip"
]


# ==========================================================
# CREATE DIRECTORIES
# ==========================================================

DATA_DIR.mkdir(
    parents=True,
    exist_ok=True
)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)