import pandas as pd


FEATURE_COLUMNS = [
    "depth_m",
    "rop_m_hr",
    "mud_weight_sg",
    "torque_knm",
    "ecd_sg",
    "pump_rate_l_min",
    "distance_km"
]


def prepare_features(dataframe):
    """
    Convert the training dataframe into numerical
    features and target labels.
    """

    missing_columns = [
        column
        for column in FEATURE_COLUMNS + ["event"]
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    X = dataframe[FEATURE_COLUMNS].copy()

    y = dataframe["event"].copy()

    return X, y


def get_feature_columns():
    """
    Return the list of numerical feature columns.
    """

    return FEATURE_COLUMNS.copy()


def encode_target(y):
    """
    Convert event labels into numerical class IDs.
    """

    classes = sorted(y.unique())

    class_to_id = {
        class_name: index
        for index, class_name in enumerate(classes)
    }

    encoded = y.map(class_to_id)

    return encoded, class_to_id


if __name__ == "__main__":

    from .dataset import load_dataset

    dataframe = load_dataset()

    X, y = prepare_features(dataframe)

    encoded_y, class_mapping = encode_target(y)

    print("\nFeature columns:")
    print(X.columns.tolist())

    print("\nFeature shape:")
    print(X.shape)

    print("\nFirst five feature rows:")
    print(X.head())

    print("\nOriginal event labels:")
    print(y.head())

    print("\nEncoded event labels:")
    print(encoded_y.head())

    print("\nClass mapping:")
    print(class_mapping)