from .dataset import load_dataset
from .features import prepare_features
from .model import DrillingEventModel


def train_model():

    print("=" * 50)
    print("eRTMAC-NWIS Prediction Model Training")
    print("=" * 50)

    # Load dataset
    print("\nLoading training dataset...")

    dataframe = load_dataset()

    print(
        f"Training records: {len(dataframe)}"
    )

    # Prepare features
    print("\nPreparing features...")

    X, y = prepare_features(dataframe)

    print(
        f"Number of features: {X.shape[1]}"
    )

    print(
        f"Number of samples: {X.shape[0]}"
    )

    print("\nFeatures:")

    for feature in X.columns:
        print(f"  - {feature}")

    # Train model
    print("\nTraining Random Forest model...")

    model = DrillingEventModel()

    model.train(X, y)

    print("Training completed.")

    # Display classes
    print("\nDetected event classes:")

    for event, class_id in model.class_mapping.items():
        print(
            f"  {class_id}: {event}"
        )

    # Save model
    print("\nSaving model...")

    model.save()

    print("\n" + "=" * 50)
    print("Training completed successfully.")
    print("=" * 50)


if __name__ == "__main__":
    train_model()