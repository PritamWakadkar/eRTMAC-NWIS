from backend.ai.rag.retrieval.depth_matcher import (
    compare_depth_to_interval,
    compare_event_to_interval
)


def main():

    print("=" * 60)
    print("INTERVAL DEPTH MATCHING TEST")
    print("=" * 60)

    # --------------------------------
    # Test 1: Event outside interval
    # --------------------------------

    result = compare_depth_to_interval(
        event_depth=2580,
        interval_start=2410,
        interval_end=2470,
        tolerance=200
    )

    print("\nTest 1:")
    print(
        f"Interval: "
        f"{result['interval_start']} - "
        f"{result['interval_end']} m"
    )

    print(
        f"Event depth: "
        f"{result['event_depth']} m"
    )

    print(
        f"Difference: "
        f"{result['difference_m']} m"
    )

    print(
        f"Within interval: "
        f"{result['within_interval']}"
    )

    print(
        f"Within tolerance: "
        f"{result['within_tolerance']}"
    )

    # --------------------------------
    # Test 2: Event inside interval
    # --------------------------------

    result = compare_depth_to_interval(
        event_depth=2450,
        interval_start=2410,
        interval_end=2470,
        tolerance=200
    )

    print("\nTest 2:")
    print(
        f"Interval: "
        f"{result['interval_start']} - "
        f"{result['interval_end']} m"
    )

    print(
        f"Event depth: "
        f"{result['event_depth']} m"
    )

    print(
        f"Difference: "
        f"{result['difference_m']} m"
    )

    print(
        f"Within interval: "
        f"{result['within_interval']}"
    )

    print(
        f"Within tolerance: "
        f"{result['within_tolerance']}"
    )

    # --------------------------------
    # Test 3: Actual W105 event
    # --------------------------------

    event = {

        "event": "mud_loss",

        "depth": "2580 m MD",

        "measurement": "3 m³/hr",

        "evidence": (
            "At 2580 m MD, a 3 m³/hr "
            "increase in mud losses was "
            "recorded."
        ),

        "document": "W105_DDR.pdf",

        "page": 1
    }

    result = compare_event_to_interval(
        event=event,
        interval_start=2410,
        interval_end=2470,
        tolerance=200
    )

    print("\nTest 3: W105 Mud Loss")

    print(
        f"Event: "
        f"{result['event']}"
    )

    print(
        f"Event depth: "
        f"{result['event_depth']} m"
    )

    print(
        f"Target interval: "
        f"{result['interval_start']} - "
        f"{result['interval_end']} m"
    )

    print(
        f"Difference from interval: "
        f"{result['difference_m']} m"
    )

    print(
        f"Within interval: "
        f"{result['within_interval']}"
    )

    print(
        f"Within tolerance: "
        f"{result['within_tolerance']}"
    )


if __name__ == "__main__":
    main()