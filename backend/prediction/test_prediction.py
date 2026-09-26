from .predictor import DrillingEventPredictor


def print_predictions(title, predictions):
    print("\n" + "=" * 55)
    print(title)
    print("=" * 55)

    for prediction in predictions:
        event = prediction["event"]
        probability = prediction["probability"]

        print(
            f"{event:15} → {probability:.4f}"
        )


def main():

    predictor = DrillingEventPredictor()

    # Test 1: Conditions similar to W104 torque event
    torque_test = predictor.predict(
        depth_m=2465,
        rop_m_hr=17.2,
        mud_weight_sg=1.18,
        torque_knm=14.0,
        ecd_sg=1.23,
        pump_rate_l_min=1850,
        distance_km=0.0
    )

    print_predictions(
        "TEST 1 — W104 Torque Event Conditions",
        torque_test
    )

    # Test 2: Conditions similar to W105 mud-loss event
    mud_loss_test = predictor.predict(
        depth_m=2580,
        rop_m_hr=16.2,
        mud_weight_sg=1.19,
        torque_knm=12.0,
        ecd_sg=1.25,
        pump_rate_l_min=1900,
        distance_km=2.67
    )

    print_predictions(
        "TEST 2 — W105 Mud-Loss Conditions",
        mud_loss_test
    )

    # Test 3: Normal drilling conditions
    normal_test = predictor.predict(
        depth_m=2300,
        rop_m_hr=17.2,
        mud_weight_sg=1.18,
        torque_knm=10.5,
        ecd_sg=1.22,
        pump_rate_l_min=1880,
        distance_km=2.67
    )

    print_predictions(
        "TEST 3 — Normal Drilling Conditions",
        normal_test
    )


if __name__ == "__main__":
    main()