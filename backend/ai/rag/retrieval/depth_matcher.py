import re


def compare_depths(
    target_depth,
    event_depth,
    tolerance=100
):
    """
    Compare a target depth with an event depth.
    """

    target_depth = float(target_depth)
    event_depth = float(event_depth)

    difference = abs(
        target_depth - event_depth
    )

    return {
        "target_depth": target_depth,
        "event_depth": event_depth,
        "difference_m": difference,
        "tolerance_m": tolerance,
        "within_tolerance": difference <= tolerance
    }


def extract_depth_value(depth_text):
    """
    Extract the first numerical depth from text.

    Example:
        '2630 m MD' -> 2630.0
    """

    if depth_text is None:
        return None

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*m",
        str(depth_text),
        flags=re.IGNORECASE
    )

    if not match:
        return None

    return float(
        match.group(1)
    )


def extract_depth_interval(depth_text):
    """
    Extract a depth interval.

    Examples:
        '2410–2470 m MD'
        '2410-2470 m MD'
        '2410 m MD to 2470 m MD'

    Returns:
        (2410.0, 2470.0)
    """

    if depth_text is None:
        return None

    text = str(depth_text)

    # Example:
    # 2410–2470 m MD
    match = re.search(
        r"(\d+(?:\.\d+)?)"
        r"\s*(?:-|–|—|to)\s*"
        r"(\d+(?:\.\d+)?)"
        r"\s*m",
        text,
        flags=re.IGNORECASE
    )

    if match:

        start_depth = float(
            match.group(1)
        )

        end_depth = float(
            match.group(2)
        )

        return (
            start_depth,
            end_depth
        )

    return None


def compare_depth_to_interval(
    event_depth,
    interval_start,
    interval_end,
    tolerance=100
):
    """
    Compare an event depth against
    a target depth interval.

    If the event is inside the interval,
    distance is 0.

    Otherwise, distance is measured
    from the nearest interval boundary.
    """

    event_depth = float(event_depth)
    interval_start = float(interval_start)
    interval_end = float(interval_end)

    # Make sure start <= end
    if interval_start > interval_end:

        interval_start, interval_end = (
            interval_end,
            interval_start
        )

    # Event is inside the interval
    if (
        interval_start
        <= event_depth
        <= interval_end
    ):

        difference = 0.0
        within_interval = True

    # Event is above the interval
    elif event_depth < interval_start:

        difference = (
            interval_start - event_depth
        )

        within_interval = False

    # Event is below the interval
    else:

        difference = (
            event_depth - interval_end
        )

        within_interval = False

    return {

        "event_depth": event_depth,

        "interval_start": interval_start,

        "interval_end": interval_end,

        "difference_m": difference,

        "tolerance_m": tolerance,

        "within_interval": within_interval,

        "within_tolerance": (
            difference <= tolerance
        )

    }


def compare_event_to_interval(
    event,
    interval_start,
    interval_end,
    tolerance=100
):
    """
    Compare a drilling event with
    a target depth interval.
    """

    event_depth = extract_depth_value(
        event.get("depth")
    )

    if event_depth is None:
        return None

    comparison = compare_depth_to_interval(
        event_depth=event_depth,
        interval_start=interval_start,
        interval_end=interval_end,
        tolerance=tolerance
    )

    comparison["event"] = event.get(
        "event"
    )

    comparison["measurement"] = event.get(
        "measurement"
    )

    comparison["evidence"] = event.get(
        "evidence"
    )

    comparison["document"] = event.get(
        "document"
    )

    comparison["page"] = event.get(
        "page"
    )

    return comparison


def compare_event_to_target(
    target_depth,
    event,
    tolerance=100
):
    """
    Backward-compatible comparison between
    one target depth and one event.
    """

    event_depth = extract_depth_value(
        event.get("depth")
    )

    if event_depth is None:
        return None

    comparison = compare_depths(
        target_depth,
        event_depth,
        tolerance
    )

    comparison["event"] = event.get(
        "event"
    )

    comparison["measurement"] = event.get(
        "measurement"
    )

    comparison["evidence"] = event.get(
        "evidence"
    )

    comparison["document"] = event.get(
        "document"
    )

    comparison["page"] = event.get(
        "page"
    )

    return comparison