import re


class QueryParser:

    def __init__(self):

        # ========================================================
        # EVENT KEYWORDS
        # ========================================================

        self.event_keywords = {
            "mud_loss": [
                "mud loss",
                "mud losses",
                "mud-loss",
                "mud-losses",
                "lost circulation",
                "lost-circulation",
                "losses",
            ],

            "torque_spike": [
                "torque spike",
                "torque spikes",
                "torque-spike",
                "torque spikes",
                "high torque",
                "high-torque",
                "torque increase",
                "torque increases",
                "torque-increase",
                "torque",
            ],

            "drag": [
                "drag",
                "high drag",
                "high-drag",
                "drag increase",
                "drag increases",
                "drag-increase",
                "drag-related",
                "drag related",
            ],

            "wiper_trip": [
                "wiper trip",
                "wiper trips",
                "wiper-trip",
                "wiper-trips",
            ],
        }

        # ========================================================
        # INTENT KEYWORDS
        # ========================================================

        self.intent_keywords = {

            "nearby_well_events": [
                "nearby",
                "near",
                "offset",
                "neighboring",
                "neighbouring",
            ],

            "historical_interval": [
                "historical interval",
                "problem interval",
                "problem zone",
                "historical problem",
                "problem depth",
            ],

            "formation_information": [
                "formation",
                "geological formation",
            ],

            "depth_events": [
                "depth",
                "at depth",
                "around depth",
                "between",
            ],

            "well_information": [
                "well information",
                "well details",
                "well data",
            ],
        }

    # ============================================================
    # NORMALIZE TEXT
    # ============================================================

    def normalize_text(self, text):

        if text is None:
            return ""

        text = str(text).lower().strip()

        # --------------------------------------------------------
        # Normalize different dash characters.
        #
        # IMPORTANT:
        # We do NOT replace normal "-" globally because
        # expressions such as:
        #
        # 2380-2470 m
        #
        # are valid depth ranges.
        # --------------------------------------------------------

        text = text.replace("–", "-")
        text = text.replace("—", "-")
        text = text.replace("-", "-")

        # --------------------------------------------------------
        # Normalize underscores between words.
        #
        # Example:
        #
        # mud_loss -> mud loss
        # torque_spike -> torque spike
        # --------------------------------------------------------

        text = re.sub(
            r"(?<=[a-z])_(?=[a-z])",
            " ",
            text
        )

        # --------------------------------------------------------
        # Normalize alphabetic hyphens.
        #
        # Example:
        #
        # mud-loss -> mud loss
        # torque-related -> torque related
        #
        # But:
        #
        # 2380-2470
        #
        # is NOT changed.
        # --------------------------------------------------------

        text = re.sub(
            r"(?<=[a-z])-(?=[a-z])",
            " ",
            text
        )

        # --------------------------------------------------------
        # Remove repeated whitespace
        # --------------------------------------------------------

        text = re.sub(
            r"\s+",
            " ",
            text
        )

        return text.strip()

    # ============================================================
    # EXTRACT WELL ID
    # ============================================================

    def extract_well_id(self, text):

        match = re.search(
            r"\bW\d+\b",
            text,
            flags=re.IGNORECASE
        )

        if match:

            return match.group(0).upper()

        return None

    # ============================================================
    # EXTRACT DEPTH RANGE
    # ============================================================

    def extract_depth_range(self, text):

        patterns = [

            # ----------------------------------------------------
            # Example:
            #
            # 2380 m MD and 2470 m MD
            # ----------------------------------------------------

            r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b.*?"
            r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b",

            # ----------------------------------------------------
            # Example:
            #
            # 2380 m to 2470 m
            # 2380 m - 2470 m
            # ----------------------------------------------------

            r"\b(\d+(?:\.\d+)?)\s*m\s*(?:to|-)\s*"
            r"(\d+(?:\.\d+)?)\s*m\b",

            # ----------------------------------------------------
            # Example:
            #
            # 2380-2470 m
            # ----------------------------------------------------

            r"\b(\d+(?:\.\d+)?)\s*-\s*"
            r"(\d+(?:\.\d+)?)\s*m\b",

            # ----------------------------------------------------
            # Example:
            #
            # 2380 to 2470 MD
            # ----------------------------------------------------

            r"\b(\d+(?:\.\d+)?)\s*(?:to|-)\s*"
            r"(\d+(?:\.\d+)?)\s*m\s*MD\b",
        ]

        for pattern in patterns:

            match = re.search(
                pattern,
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

                return {
                    "start": min(
                        start_depth,
                        end_depth
                    ),

                    "end": max(
                        start_depth,
                        end_depth
                    ),

                    "unit": "m MD"
                }

        return None

    # ============================================================
    # EXTRACT SINGLE DEPTH
    # ============================================================

    def extract_depth(self, text):

        match = re.search(
            r"\b(\d+(?:\.\d+)?)\s*m\s*(?:MD)?\b",
            text,
            flags=re.IGNORECASE
        )

        if not match:

            return None

        return {
            "value": float(
                match.group(1)
            ),

            "unit": "m MD"
        }

    # ============================================================
    # EXTRACT EVENT TYPE
    # ============================================================

    def extract_event_type(self, text):

        # --------------------------------------------------------
        # Create a special event-search version of the text.
        #
        # This handles:
        #
        # mud-loss
        # mud loss
        # torque-related
        # torque related
        #
        # without modifying the original text used for
        # depth-range extraction.
        # --------------------------------------------------------

        event_text = text.lower()

        # Normalize alphabetic hyphens only.
        event_text = re.sub(
            r"(?<=[a-z])-(?=[a-z])",
            " ",
            event_text
        )

        # Normalize underscores between words.
        event_text = re.sub(
            r"(?<=[a-z])_(?=[a-z])",
            " ",
            event_text
        )

        # Normalize repeated spaces.
        event_text = re.sub(
            r"\s+",
            " ",
            event_text
        ).strip()

        # --------------------------------------------------------
        # Check event keywords
        # --------------------------------------------------------

        for event_type, keywords in self.event_keywords.items():

            for keyword in keywords:

                keyword = keyword.lower()

                # Normalize keyword as well.
                keyword = re.sub(
                    r"(?<=[a-z])[-_](?=[a-z])",
                    " ",
                    keyword
                )

                if keyword in event_text:

                    return event_type

        return None

    # ============================================================
    # EXTRACT FORMATION
    # ============================================================

    def extract_formation(self, text):

        formations = [
            "barail formation"
        ]

        for formation in formations:

            if formation in text:

                return formation.title()

        return None

    # ============================================================
    # DETECT INTENT
    # ============================================================

    def detect_intent(self, text):

        # --------------------------------------------------------
        # Historical interval
        # --------------------------------------------------------

        historical_keywords = [
            "historical interval",
            "problem interval",
            "problem zone",
            "historical problem",
            "problem depth",
        ]

        for keyword in historical_keywords:

            if keyword in text:

                return "historical_interval"

        # --------------------------------------------------------
        # Formation
        # --------------------------------------------------------

        if "formation" in text:

            return "formation_information"

        # --------------------------------------------------------
        # Extract depth and event information
        # --------------------------------------------------------

        depth_range = self.extract_depth_range(
            text
        )

        depth = self.extract_depth(
            text
        )

        event_type = self.extract_event_type(
            text
        )

        # --------------------------------------------------------
        # Nearby well keywords
        # --------------------------------------------------------

        nearby_keywords = [
            "nearby",
            "near",
            "offset",
            "neighboring",
            "neighbouring",
        ]

        has_nearby_keyword = any(
            keyword in text
            for keyword in nearby_keywords
        )

        # --------------------------------------------------------
        # DEPTH RANGE
        # --------------------------------------------------------

        if depth_range is not None:

            return "depth_events"

        # --------------------------------------------------------
        # ANY EXPLICIT DEPTH
        # --------------------------------------------------------

        if depth is not None:

            return "depth_events"

        # --------------------------------------------------------
        # EVENT + NEARBY WELL
        # --------------------------------------------------------

        if (
            event_type
            and has_nearby_keyword
        ):

            return "event_information"

        # --------------------------------------------------------
        # NEARBY WELL QUERY
        # --------------------------------------------------------

        if has_nearby_keyword:

            return "nearby_well_events"

        # --------------------------------------------------------
        # EVENT QUERY
        #
        # This includes cross-well queries such as:
        #
        # Which wells had mud loss events?
        #
        # Which wells had mud-loss events?
        #
        # Which wells had torque-related events?
        # --------------------------------------------------------

        if event_type:

            return "event_information"

        # --------------------------------------------------------
        # WELL INFORMATION
        # --------------------------------------------------------

        well_keywords = [
            "well information",
            "well details",
            "well data",
            "details of",
            "details about",
            "information about",
            "information of",
        ]

        if any(
            keyword in text
            for keyword in well_keywords
        ):

            return "well_information"

        # --------------------------------------------------------
        # GENERAL QUERY
        # --------------------------------------------------------

        return "general_well_query"

    # ============================================================
    # PARSE QUESTION
    # ============================================================

    def parse(self, question):

        # --------------------------------------------------------
        # Normalize
        # --------------------------------------------------------

        text = self.normalize_text(
            question
        )

        # --------------------------------------------------------
        # Extract entities
        # --------------------------------------------------------

        well_id = self.extract_well_id(
            text
        )

        depth_range = self.extract_depth_range(
            text
        )

        depth = self.extract_depth(
            text
        )

        event_type = self.extract_event_type(
            text
        )

        formation = self.extract_formation(
            text
        )

        intent = self.detect_intent(
            text
        )

        # --------------------------------------------------------
        # Return parsed query
        # --------------------------------------------------------

        return {

            "original_question": question,

            "normalized_question": text,

            "intent": intent,

            "well_id": well_id,

            "depth": depth,

            "depth_range": depth_range,

            "event_type": event_type,

            "formation": formation,
        }


# ================================================================
# DIRECT TEST
# ================================================================

if __name__ == "__main__":

    parser = QueryParser()

    test_questions = [

        # --------------------------------------------------------
        # Cross-well event queries
        # --------------------------------------------------------

        "Which wells had mud-loss events?",

        "Which wells had mud loss events?",

        "Which wells had torque-related events?",

        "Which wells had torque related events?",

        "Which wells had drag-related events?",

        "Which wells had wiper-trip events?",

        # --------------------------------------------------------
        # Single-well event queries
        # --------------------------------------------------------

        "Which mud-loss events occurred in W104?",

        "Which torque-related events occurred in W105?",

        # --------------------------------------------------------
        # Depth queries
        # --------------------------------------------------------

        "What happened around 2465 m MD in W104?",

        "What happened between 2380 m MD and 2470 m MD in W104?",

        "What happened between 2380 m and 2470 m in W104?",

        "What happened between 2380-2470 m in W104?",

        "What happened at 2410 m MD in W104?",

        # --------------------------------------------------------
        # Nearby queries
        # --------------------------------------------------------

        "What happened near W104?",

        "Which nearby wells had mud-loss events?",

        # --------------------------------------------------------
        # Formation
        # --------------------------------------------------------

        "Which formation was used in W104?",

        # --------------------------------------------------------
        # Well information
        # --------------------------------------------------------

        "Tell me about W104",

        "Give me information about W105",
    ]

    for question in test_questions:

        print("\n" + "=" * 70)

        print("QUESTION:")
        print(question)

        print("\nPARSED RESULT:")

        result = parser.parse(
            question
        )

        print(result)