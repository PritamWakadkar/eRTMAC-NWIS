"""
Compatibility shim.

The old prepare_features() (one multiclass label per row) is gone.
Feature engineering now lives in event_features.py and the training
table is built in pdf_dataset.py. This module only re-exports the new
names so old imports do not break.
"""

from .event_features import (  # noqa: F401
    PARAM_COLUMNS,
    compute_features,
    feature_names,
)
from .pdf_dataset import build_training_frame  # noqa: F401