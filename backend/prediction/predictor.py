import pandas as pd

from .model import DrillingEventModel
from .feature_lookup import FeatureLookup


class DrillingEventPredictor:

    def __init__(self):
        self.model = DrillingEventModel()
        self.model.load()

        self.feature_lookup = FeatureLookup()

    def predict(
        self,
        depth_m,
        rop_m_hr,
        mud_weight_sg,
        torque_knm,
        ecd_sg,
        pump_rate_l_min,
        distance_km
    ):
        """
        Predict drilling events using supplied
        drilling features.
        """

        data = pd.DataFrame([
            {
                "depth_m": depth_m,
                "rop_m_hr": rop_m_hr,
                "mud_weight_sg": mud_weight_sg,
                "torque_knm": torque_knm,
                "ecd_sg": ecd_sg,
                "pump_rate_l_min": pump_rate_l_min,
                "distance_km": distance_km
            }
        ])

        probabilities = (
            self.model.predict_probabilities(data)
        )

        probability_data = probabilities[0]

        predictions = []

        for event, probability in probability_data.items():

            predictions.append({
                "event": event,
                "probability": round(
                    probability,
                    4
                )
            })

        predictions.sort(
            key=lambda item: item["probability"],
            reverse=True
        )

        return predictions

    def predict_well(
        self,
        well_id,
        depth_m
    ):
        """
        Find drilling features for a well/depth
        and then run the ML prediction.
        """

        features = self.feature_lookup.get_features(
            well_id=well_id,
            depth_m=depth_m
        )

        predictions = self.predict(
            depth_m=features["depth_m"],
            rop_m_hr=features["rop_m_hr"],
            mud_weight_sg=features["mud_weight_sg"],
            torque_knm=features["torque_knm"],
            ecd_sg=features["ecd_sg"],
            pump_rate_l_min=features[
                "pump_rate_l_min"
            ],
            distance_km=features["distance_km"]
        )

        return {
            "well_id": features["well_id"],
            "requested_depth_m": features[
                "requested_depth_m"
            ],
            "used_depth_m": features[
                "depth_m"
            ],
            "depth_difference_m": features[
                "depth_difference_m"
            ],
            "features": {
                "rop_m_hr": features["rop_m_hr"],
                "mud_weight_sg": features[
                    "mud_weight_sg"
                ],
                "torque_knm": features["torque_knm"],
                "ecd_sg": features["ecd_sg"],
                "pump_rate_l_min": features[
                    "pump_rate_l_min"
                ],
                "distance_km": features[
                    "distance_km"
                ]
            },
            "predictions": predictions
        }


if __name__ == "__main__":

    predictor = DrillingEventPredictor()

    result = predictor.predict_well(
        well_id="W105",
        depth_m=2600
    )

    print("\nPrediction result:")
    print("=" * 55)

    print(
        f"Well: {result['well_id']}"
    )

    print(
        f"Requested depth: "
        f"{result['requested_depth_m']} m"
    )

    print(
        f"Used depth: "
        f"{result['used_depth_m']} m"
    )

    print(
        f"Depth difference: "
        f"{result['depth_difference_m']} m"
    )

    print("\nFeatures:")

    for name, value in result["features"].items():
        print(f"{name}: {value}")

    print("\nPredictions:")

    for prediction in result["predictions"]:
        print(
            f"{prediction['event']:15}"
            f" → "
            f"{prediction['probability']:.4f}"
        )