import re


# ============================================================
# WELL ID
# ============================================================

def extract_well_id(text, document_name=None):

    patterns = [
        r"\bWell\s+ID\s*:\s*(W\d+)\b",
        r"\bWell\s*:\s*(W\d+)\b",
        r"\bWell\s+(W\d+)\b",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE
        )

        if match:
            return match.group(1).upper()

    # Fallback: extract well ID from filename

    if document_name:

        match = re.search(
            r"\b(W\d+)\b",
            document_name,
            flags=re.IGNORECASE
        )

        if match:
            return match.group(1).upper()

    return None


# ============================================================
# DEPTH EXTRACTION
# ============================================================

def extract_depths(text):
    """
    Extract drilling depths from the report.

    Supports:

        2410 m MD
        2465 m MD
        2470 m to 2380 m MD
        2470 m → 2380 m MD
        2470-2380 m MD
    """

    depths = []

    # --------------------------------------------------------
    # 1. Extract depth ranges first
    # --------------------------------------------------------

    range_matches = re.findall(
        r"\b"
        r"(\d+(?:\.\d+)?)\s*m"
        r"\s*(?:to|→|-|–|—)"
        r"\s*"
        r"(\d+(?:\.\d+)?)\s*m\s*MD"
        r"\b",
        text,
        flags=re.IGNORECASE
    )

    for start_depth, end_depth in range_matches:

        start_value = float(start_depth)
        end_value = float(end_depth)

        if start_value not in depths:
            depths.append(start_value)

        if end_value not in depths:
            depths.append(end_value)

    # --------------------------------------------------------
    # 2. Extract normal depths
    # --------------------------------------------------------

    normal_matches = re.findall(
        r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b",
        text,
        flags=re.IGNORECASE
    )

    for depth in normal_matches:

        value = float(depth)

        if value not in depths:
            depths.append(value)

    return depths


# ============================================================
# FORMATION
# ============================================================

def extract_formation(text):

    match = re.search(
        r"(?:Primary\s+)?Formation\s*:\s*"
        r"([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*)"
        r"(?=\s+(?:Drilling|Historical|Well|Total|Average|Mud|"
        r"Maximum|Pump|ECD|Depth)\b|$)",
        text,
        flags=re.IGNORECASE
    )

    if match:
        return match.group(1).strip()

    return "Formation not specified"


# ============================================================
# CLEAN EVENT SENTENCE
# ============================================================

def clean_event_sentence(sentence):

    # Remove bullets / markdown markers

    sentence = re.sub(
        r"^[\s•\-\*]+",
        "",
        sentence
    )

    # Normalize whitespace

    sentence = re.sub(
        r"\s+",
        " ",
        sentence
    )

    return sentence.strip()


# ============================================================
# HISTORICAL EVENT SENTENCES
# ============================================================

def extract_event_sentences(text):
    """
    Extract individual historical event statements.

    The PDF text may contain bullet points where only the
    first bullet starts with a depth. Therefore we split
    every bullet into a separate statement before extracting
    event-specific evidence.
    """

    text = re.sub(r"\s+", " ", text).strip()

    # -----------------------------------------------------
    # 1. Locate Historical Drilling Events section
    # -----------------------------------------------------

    match = re.search(
        r"Historical\s+Drilling\s+Events"
        r"(.*?)(?:Synthetic\s+prototype|"
        r"Operational\s+Conclusions|$)",
        text,
        flags=re.IGNORECASE
    )

    if match:
        events_text = match.group(1)
    else:
        events_text = text

    # -----------------------------------------------------
    # 2. Normalize bullet characters
    # -----------------------------------------------------

    events_text = re.sub(
        r"[•●▪◦]",
        "\n• ",
        events_text
    )

    # -----------------------------------------------------
    # 3. Split numbered/bulleted statements
    # -----------------------------------------------------

    events_text = re.sub(
        r"\s*•\s*",
        "\n",
        events_text
    )

    # Also split before "At <depth>" when PDF extraction
    # has removed the bullet character.
    events_text = re.sub(
        r"(?<!^)"
        r"\s+(?=At\s+"
        r"\d+(?:\.\d+)?\s*m)",
        "\n",
        events_text,
        flags=re.IGNORECASE
    )

    # -----------------------------------------------------
    # 4. Split sentences when a new depth statement starts
    # -----------------------------------------------------

    events_text = re.sub(
        r"(?<=[.!?])\s+"
        r"(?=At\s+\d+(?:\.\d+)?\s*m)",
        "\n",
        events_text,
        flags=re.IGNORECASE
    )

    # -----------------------------------------------------
    # 5. Clean and collect statements
    # -----------------------------------------------------

    lines = events_text.split("\n")

    sentences = []

    for line in lines:

        line = clean_event_sentence(line)

        if not line:
            continue

        # Ignore section headings and unrelated text.
        if re.match(
            r"At\s+\d+(?:\.\d+)?\s*m",
            line,
            flags=re.IGNORECASE
        ):
            sentences.append(line)
            continue

        # Keep explicit event statements even when the
        # sentence does not begin with "At".
        lower_line = line.lower()

        if any(
            keyword in lower_line
            for keyword in [
                "wiper trip",
                "mud loss",
                "mud losses",
                "torque",
                "drag"
            ]
        ):
            sentences.append(line)

    return sentences
# ============================================================
# MUD LOSS
# ============================================================

def extract_mud_loss_events(text):

    events = []

    sentences = extract_event_sentences(text)

    for sentence in sentences:

        sentence_lower = sentence.lower()

        if (
            "mud loss" not in sentence_lower
            and
            "mud losses" not in sentence_lower
        ):
            continue

        # ----------------------------------------------------
        # DEPTH
        # ----------------------------------------------------

        depth_match = re.search(
            r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b",
            sentence,
            flags=re.IGNORECASE
        )

        if not depth_match:
            continue

        depth = depth_match.group(1)

        # ----------------------------------------------------
        # RANGE MEASUREMENT
        #
        # Example:
        # 4–6 m³/hr
        # ----------------------------------------------------

        measurement_match = re.search(
            r"(\d+(?:\.\d+)?)"
            r"\s*[–—-]\s*"
            r"(\d+(?:\.\d+)?)"
            r"\s*m³/hr",
            sentence,
            flags=re.IGNORECASE
        )

        if measurement_match:

            measurement = (
                f"{measurement_match.group(1)}–"
                f"{measurement_match.group(2)} m³/hr"
            )

        else:

            # ------------------------------------------------
            # SINGLE VALUE
            #
            # Example:
            # 3 m³/hr
            # ------------------------------------------------

            value_match = re.search(
                r"(\d+(?:\.\d+)?)\s*m³/hr",
                sentence,
                flags=re.IGNORECASE
            )

            if value_match:

                measurement = (
                    f"{value_match.group(1)} m³/hr"
                )

            else:

                measurement = "Not specified"

        events.append({

            "event": "mud_loss",

            "depth": f"{depth} m MD",

            "measurement": measurement,

            "evidence": sentence
        })

    return events


# ============================================================
# TORQUE
# ============================================================

def extract_torque_events(text):

    events = []

    sentences = extract_event_sentences(text)

    for sentence in sentences:

        sentence_lower = sentence.lower()

        if not any(
            phrase in sentence_lower
            for phrase in [
                "torque increased",
                "torque increase",
                "torque spike",
                "torque spiked",
                "torque rose"
            ]
        ):
            continue

        # ----------------------------------------------------
        # DEPTH
        # ----------------------------------------------------

        depth_match = re.search(
            r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b",
            sentence,
            flags=re.IGNORECASE
        )

        if not depth_match:
            continue

        depth = depth_match.group(1)

        # ----------------------------------------------------
        # TORQUE RANGE
        #
        # Examples:
        #
        # 9 to 14 kN·m
        # 9 → 14 kN·m
        # 9-14 kN·m
        # ----------------------------------------------------

        range_match = re.search(
            r"(\d+(?:\.\d+)?)"
            r"\s*kN[·.]?m"
            r"\s*(?:to|→|-)"
            r"\s*"
            r"(\d+(?:\.\d+)?)"
            r"\s*kN[·.]?m",
            sentence,
            flags=re.IGNORECASE
        )

        if range_match:

            start = range_match.group(1)

            end = range_match.group(2)

            measurement = (
                f"{start} → {end} kN·m"
            )

            event_type = "torque_increase"

        else:

            # ------------------------------------------------
            # SINGLE TORQUE VALUE
            #
            # Example:
            # reached 16 kN·m
            # ------------------------------------------------

            value_match = re.search(
                r"(\d+(?:\.\d+)?)"
                r"\s*kN[·.]?m",
                sentence,
                flags=re.IGNORECASE
            )

            if not value_match:
                continue

            measurement = (
                f"{value_match.group(1)} kN·m"
            )

            event_type = "torque_spike"

        events.append({

            "event": event_type,

            "depth": f"{depth} m MD",

            "measurement": measurement,

            "evidence": sentence
        })

    return events


# ============================================================
# DRAG
# ============================================================

def extract_drag_events(text):

    events = []

    sentences = extract_event_sentences(text)

    for sentence in sentences:

        sentence_lower = sentence.lower()

        if not any(
            phrase in sentence_lower
            for phrase in [
                "drag increased",
                "drag increase",
                "drag rose",
                "drag spike",
                "drag increased while"
            ]
        ):
            continue

        # ----------------------------------------------------
        # DEPTH
        # ----------------------------------------------------

        depth_match = re.search(
            r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b",
            sentence,
            flags=re.IGNORECASE
        )

        if not depth_match:
            continue

        depth = depth_match.group(1)

        events.append({

            "event": "drag_increase",

            "depth": f"{depth} m MD",

            "measurement": "Not specified",

            "evidence": sentence
        })

    return events


# ============================================================
# WIPER TRIP
# ============================================================

def extract_wiper_trip_events(text):

    events = []

    sentences = extract_event_sentences(text)

    for sentence in sentences:

        if "wiper trip" not in sentence.lower():
            continue

        # ----------------------------------------------------
        # FORMAT 1
        #
        # from 2470 m to 2380 m MD
        # ----------------------------------------------------

        depth_match = re.search(
            r"from\s+"
            r"(\d+(?:\.\d+)?)\s*m"
            r"\s*(?:to|→|-|–|—)\s*"
            r"(\d+(?:\.\d+)?)\s*m\s*MD",
            sentence,
            flags=re.IGNORECASE
        )

        # ----------------------------------------------------
        # FORMAT 2
        #
        # At 2470 m MD → 2380 m MD
        # ----------------------------------------------------

        if not depth_match:

            depth_match = re.search(
                r"(\d+(?:\.\d+)?)\s*m\s*MD"
                r"\s*(?:to|→|-|–|—)\s*"
                r"(\d+(?:\.\d+)?)\s*m\s*MD",
                sentence,
                flags=re.IGNORECASE
            )

        if not depth_match:
            continue

        start_depth = depth_match.group(1)

        end_depth = depth_match.group(2)

        events.append({

            "event": "wiper_trip",

            "depth": (
                f"{start_depth} m MD → "
                f"{end_depth} m MD"
            ),

            "measurement": "Not specified",

            "evidence": sentence
        })

    return events


# ============================================================
# ALL EVENT DETAILS
# ============================================================

def extract_event_details(text):

    events = []

    events.extend(
        extract_mud_loss_events(text)
    )

    events.extend(
        extract_torque_events(text)
    )

    events.extend(
        extract_drag_events(text)
    )

    events.extend(
        extract_wiper_trip_events(text)
    )

    # --------------------------------------------------------
    # Remove duplicate events
    # --------------------------------------------------------

    unique_events = []

    seen = set()

    for event in events:

        key = (
            event.get("event"),
            event.get("depth"),
            event.get("measurement"),
            event.get("evidence")
        )

        if key in seen:
            continue

        seen.add(key)

        unique_events.append(event)

    return unique_events


# ============================================================
# EXPLICIT HISTORICAL INTERVALS
# ============================================================

def extract_historical_problem_intervals(text):
    """
    Extract ONLY explicitly mentioned historical
    problem intervals.

    IMPORTANT:

    An individual event such as:

        At 2410 m MD, mud loss occurred.

    is NOT automatically converted into a historical
    problem interval.

    Only explicit interval/range statements are extracted.

    Examples:

        problem interval 2500 to 2600 m MD

        historical interval: 2400–2500 m MD

        interval around 2580-2630 m MD
    """

    intervals = []

    # --------------------------------------------------------
    # Normalize whitespace
    # --------------------------------------------------------

    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    # --------------------------------------------------------
    # Explicit interval pattern
    # --------------------------------------------------------

    pattern = re.compile(

        r"\b"

        r"(?:historical\s+)?"

        r"(?:problem\s+)?"

        r"(?:interval|range)"

        r"\s*"

        r"(?:around|between|from|:)?"

        r"\s*"

        r"(\d+(?:\.\d+)?)"

        r"\s*"

        r"(?:-|–|—|to)"

        r"\s*"

        r"(\d+(?:\.\d+)?)"

        r"\s*m\s*MD"

        r"\b",

        flags=re.IGNORECASE
    )

    matches = pattern.findall(text)

    for start_depth, end_depth in matches:

        start_depth = float(
            start_depth
        )

        end_depth = float(
            end_depth
        )

        # ----------------------------------------------------
        # Normalize depth order
        # ----------------------------------------------------

        if start_depth > end_depth:

            start_depth, end_depth = (
                end_depth,
                start_depth
            )

        interval = {

            "start_depth": start_depth,

            "end_depth": end_depth,

            "unit": "m MD"
        }

        if interval not in intervals:

            intervals.append(
                interval
            )

    return intervals


# ============================================================
# COMPLETE METADATA EXTRACTION
# ============================================================

def extract_metadata(
    text,
    document_name
):

    # --------------------------------------------------------
    # Well
    # --------------------------------------------------------

    well_id = extract_well_id(
        text,
        document_name
    )

    # --------------------------------------------------------
    # Depths
    # --------------------------------------------------------

    depths = extract_depths(
        text
    )

    # --------------------------------------------------------
    # Formation
    # --------------------------------------------------------

    formation = extract_formation(
        text
    )

    # --------------------------------------------------------
    # Drilling events
    # --------------------------------------------------------

    events = extract_event_details(
        text
    )

    # --------------------------------------------------------
    # Explicit historical intervals ONLY
    # --------------------------------------------------------

    historical_problem_intervals = (
        extract_historical_problem_intervals(
            text
        )
    )

    # --------------------------------------------------------
    # Return metadata
    # --------------------------------------------------------

    return {

        "well_id": well_id,

        "depths": depths,

        "formation": formation,

        "events": events,

        "historical_problem_intervals":
            historical_problem_intervals
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    sample_text = """

    Well ID: W105

    Primary Formation: Barail Formation

    Historical Drilling Events

    • At 2580 m MD, a 3 m³/hr increase in mud losses
      was recorded for approximately 25 minutes.

    • At 2630 m MD, a transient torque spike reached
      16 kN·m.

    • At 2642 m MD, drag increased while pulling out of hole.

    • At 2470 m MD → 2380 m MD, a wiper trip was performed.

    """

    result = extract_metadata(
        sample_text,
        "W105_DDR.pdf"
    )

    print("\n" + "=" * 70)

    print(
        "METADATA EXTRACTION TEST"
    )

    print(
        "=" * 70
    )

    # --------------------------------------------------------
    # Well ID
    # --------------------------------------------------------

    print("\nWell ID:")

    print(
        result["well_id"]
    )

    # --------------------------------------------------------
    # Formation
    # --------------------------------------------------------

    print("\nFormation:")

    print(
        result["formation"]
    )

    # --------------------------------------------------------
    # Depths
    # --------------------------------------------------------

    print("\nDepths:")

    for depth in result["depths"]:

        print(
            f"  - {depth} m MD"
        )

    # --------------------------------------------------------
    # Events
    # --------------------------------------------------------

    print("\nEvents:")

    for event in result["events"]:

        print(
            f"  - {event['event']}"
            f" | {event['depth']}"
            f" | {event['measurement']}"
        )

        print(
            f"    Evidence: "
            f"{event['evidence']}"
        )

    # --------------------------------------------------------
    # Historical intervals
    # --------------------------------------------------------

    print(
        "\nHistorical Problem Intervals:"
    )

    for interval in result[
        "historical_problem_intervals"
    ]:

        print(
            f"  - "
            f"{interval['start_depth']} → "
            f"{interval['end_depth']} "
            f"{interval['unit']}"
        )