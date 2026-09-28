"""
MERGE these names into your existing config.py (keep DATASET_FILE and
EVENT_TYPES as you already have them if they differ).
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Synthetic parameter table (still used by FeatureLookup)
DATASET_FILE = DATA_DIR / "training_dataset.csv"

# Legacy list, still used by dataset.validate_dataset()
EVENT_TYPES = [
    "mud_loss",
    "torque_spike",
    "wiper_trip",
    "drag",
    "stuck_pipe",
    "kick",
    "overpressure",
    "cementing_issue",
]

# ---------------- NEW: PDF-based training ----------------
MODEL_FILE = MODEL_DIR / "drilling_event_model.joblib"
PDF_DATASET_FILE = DATA_DIR / "pdf_training_frame.csv"

BIN_M = 25.0            # depth bin size used to build training rows
PAD_M = 100.0           # depth padding around the first/last event of a well
FEATURE_WINDOW_M = 200.0
FEATURE_RADIUS_KM = 10.0
OFFSET_STRENGTH = 0.60

# Retraining gates
MIN_BINS = 200          # minimum training rows
MIN_POSITIVES = 20      # minimum positive rows per event type
MIN_PR_LIFT = 1.2       # PR-AUC must beat prevalence * this value
MAX_CV_SPLITS = 5
RANDOM_STATE = 42