import re

from ..generation.llm import LLM
from ..generation.prompt import build_prompt
from ..embeddings.embedding_model import EmbeddingModel
from ..retrieval.retriever import Retriever
from ..models.rag_response import RAGResponse


class QueryPipeline:

    def __init__(self):

        print("\nInitializing NWIS Query Pipeline...")

        self.embedding_model = EmbeddingModel()

        self.retriever = Retriever(
            self.embedding_model
        )

        self.llm = LLM()

        print("Query Pipeline initialized successfully.")

    # ============================================================
    # Extract Well ID
    # ============================================================

    def extract_well_id(self, question):

        match = re.search(
            r"\bW\d+\b",
            question,
            flags=re.IGNORECASE
        )

        if match:
            return match.group(0).upper()

        return None

    # ============================================================
    # Extract Single Depth
    #
    # Example:
    # 2410 m MD
    # 2630 m MD
    # ============================================================

    def extract_depth(self, question):

        match = re.search(
            r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b",
            question,
            flags=re.IGNORECASE
        )

        if match:

            return float(
                match.group(1)
            )

        return None

    # ============================================================
    # Extract Depth Range
    #
    # Supported examples:
    #
    # 2380 m MD to 2470 m MD
    # 2380 m MD - 2470 m MD
    # 2380 m MD → 2470 m MD
    # between 2380 m MD and 2470 m MD
    # 2380-2470 m MD
    # ============================================================

    def extract_depth_range(self, question):

        patterns = [

            # --------------------------------------------
            # 2380 m MD to 2470 m MD
            # 2380 m MD - 2470 m MD
            # 2380 m MD → 2470 m MD
            # --------------------------------------------

            r"\b"
            r"(\d+(?:\.\d+)?)"
            r"\s*m\s*MD"
            r"\s*(?:to|between|-|–|—|→)"
            r"\s*"
            r"(\d+(?:\.\d+)?)"
            r"\s*m\s*MD"
            r"\b",

            # --------------------------------------------
            # between 2380 m MD and 2470 m MD
            # --------------------------------------------

            r"\bbetween\s+"
            r"(\d+(?:\.\d+)?)"
            r"\s*m\s*MD\s+"
            r"and\s+"
            r"(\d+(?:\.\d+)?)"
            r"\s*m\s*MD"
            r"\b",

            # --------------------------------------------
            # 2380-2470 m MD
            # --------------------------------------------

            r"\b"
            r"(\d+(?:\.\d+)?)"
            r"\s*"
            r"(?:-|–|—|to)"
            r"\s*"
            r"(\d+(?:\.\d+)?)"
            r"\s*m\s*MD"
            r"\b"
        ]

        for pattern in patterns:

            match = re.search(
                pattern,
                question,
                flags=re.IGNORECASE
            )

            if match:

                depth_1 = float(
                    match.group(1)
                )

                depth_2 = float(
                    match.group(2)
                )

                start_depth = min(
                    depth_1,
                    depth_2
                )

                end_depth = max(
                    depth_1,
                    depth_2
                )

                return (
                    start_depth,
                    end_depth
                )

        return None

    # ============================================================
    # Check Event Near Single Depth
    # ============================================================

    def event_is_near_depth(
        self,
        event_depth,
        requested_depth,
        tolerance=20
    ):

        if not event_depth:
            return False

        depth_matches = re.findall(
            r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b",
            str(event_depth),
            flags=re.IGNORECASE
        )

        if not depth_matches:
            return False

        event_depths = [
            float(depth)
            for depth in depth_matches
        ]

        for depth in event_depths:

            if abs(
                depth - requested_depth
            ) <= tolerance:

                return True

        return False

    # ============================================================
    # Check Event Overlaps Depth Range
    #
    # Point event:
    #
    # 2410 m MD
    #
    # Range event:
    #
    # 2470 m MD → 2380 m MD
    #
    # Requested:
    #
    # 2400 m MD → 2500 m MD
    #
    # The wiper-trip event overlaps this range.
    # ============================================================

    def event_overlaps_depth_range(
        self,
        event_depth,
        range_start,
        range_end
    ):

        if not event_depth:
            return False

        depth_matches = re.findall(
            r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b",
            str(event_depth),
            flags=re.IGNORECASE
        )

        if not depth_matches:
            return False

        event_depths = [
            float(depth)
            for depth in depth_matches
        ]

        # --------------------------------------------------------
        # Single point event
        # --------------------------------------------------------

        if len(event_depths) == 1:

            event_depth_value = (
                event_depths[0]
            )

            return (
                range_start
                <= event_depth_value
                <= range_end
            )

        # --------------------------------------------------------
        # Range event
        # --------------------------------------------------------

        event_start = min(
            event_depths
        )

        event_end = max(
            event_depths
        )

        # Two ranges overlap if:
        #
        # event_start <= requested_end
        #
        # AND
        #
        # event_end >= requested_start
        #

        return (
            event_start <= range_end
            and
            event_end >= range_start
        )

    # ============================================================
    # Get Event Evidence
    # ============================================================

    def get_event_evidence(self, event):

        evidence = event.get(
            "evidence",
            ""
        )

        if evidence:
            return evidence.strip()

        event_name = event.get(
            "event",
            "Unknown event"
        )

        depth = event.get(
            "depth",
            "unknown depth"
        )

        measurement = event.get(
            "measurement",
            "not specified"
        )

        return (
            f"{event_name} at "
            f"{depth} "
            f"({measurement})"
        )

    # ============================================================
    # Detect Event Type
    # ============================================================

    def detect_event_type(self, question):

        question_lower = (
            question.lower()
        )

        # --------------------------------------------------------
        # Torque
        # --------------------------------------------------------

        torque_phrases = [

            "torque",

            "torque-related",

            "high torque",

            "torque increase",

            "torque increases",

            "torque increased",

            "torque spike",

            "torque spikes",

            "torque problem",

            "torque problems"
        ]

        for phrase in torque_phrases:

            if phrase in question_lower:

                return "torque"

        # --------------------------------------------------------
        # Mud Loss
        # --------------------------------------------------------

        mud_loss_phrases = [

            "mud loss",

            "mud-loss",

            "mud losses",

            "mud-loss events",

            "mud loss events",

            "lost circulation",

            "loss of mud",

            "mud leakage"
        ]

        for phrase in mud_loss_phrases:

            if phrase in question_lower:

                return "mud_loss"

        # --------------------------------------------------------
        # Wiper Trip
        # --------------------------------------------------------

        wiper_trip_phrases = [

            "wiper trip",

            "wiper trips",

            "wiper-trip",

            "wiper-trip event",

            "wiper-trip events"
        ]

        for phrase in wiper_trip_phrases:

            if phrase in question_lower:

                return "wiper_trip"

        # --------------------------------------------------------
        # Drag
        # --------------------------------------------------------

        drag_phrases = [

            "drag",

            "drag increase",

            "drag increase event",

            "drag events",

            "drag problem",

            "drag problems"
        ]

        for phrase in drag_phrases:

            if phrase in question_lower:

                return "drag"

        # --------------------------------------------------------
        # Stuck Pipe
        # --------------------------------------------------------

        stuck_pipe_phrases = [

            "stuck pipe",

            "stuck-pipe",

            "stuck-pipe event",

            "stuck-pipe events",

            "pipe sticking",

            "sticking pipe",

            "stuck drill pipe",

            "pipe got stuck"
        ]

        for phrase in stuck_pipe_phrases:

            if phrase in question_lower:

                return "stuck_pipe"

        return None

    # ============================================================
    # Check Whether Event Matches Requested Event Type
    # ============================================================

    def event_matches_type(
        self,
        event,
        event_type
    ):

        if not event_type:
            return False

        event_name = str(
            event.get(
                "event",
                ""
            )
        ).lower()

        evidence = str(
            event.get(
                "evidence",
                ""
            )
        ).lower()

        combined_text = (
            event_name
            + " "
            + evidence
        )

        # --------------------------------------------------------
        # Torque
        # --------------------------------------------------------

        if event_type == "torque":

            return (
                "torque" in combined_text
            )

        # --------------------------------------------------------
        # Mud Loss
        # --------------------------------------------------------

        if event_type == "mud_loss":

            return (
                "mud_loss" in event_name
                or
                "mud loss" in combined_text
                or
                "mud-loss" in combined_text
                or
                "lost circulation" in combined_text
            )

        # --------------------------------------------------------
        # Wiper Trip
        # --------------------------------------------------------

        if event_type == "wiper_trip":

            return (
                "wiper_trip" in event_name
                or
                "wiper trip" in combined_text
                or
                "wiper-trip" in combined_text
            )

        # --------------------------------------------------------
        # Drag
        # --------------------------------------------------------

        if event_type == "drag":

            return (
                "drag" in combined_text
            )

        # --------------------------------------------------------
        # Stuck Pipe
        # --------------------------------------------------------

        if event_type == "stuck_pipe":

            return (
                "stuck pipe" in combined_text
                or
                "stuck-pipe" in combined_text
                or
                "sticking pipe" in combined_text
                or
                "pipe sticking" in combined_text
            )

        return False

    # ============================================================
    # Remove Duplicate Events
    # ============================================================

    def deduplicate_events(
        self,
        events
    ):

        unique_events = []

        seen = set()

        for event in events:

            key = (

                event.get(
                    "well_id"
                ),

                event.get(
                    "event"
                ),

                event.get(
                    "depth"
                ),

                event.get(
                    "document"
                ),

                event.get(
                    "page"
                )
            )

            if key in seen:
                continue

            seen.add(key)

            unique_events.append(
                event
            )

        return unique_events

    # ============================================================
    # Search Structured Events
    # ============================================================

    def search_events(
        self,
        results,
        event_type=None,
        requested_depth=None,
        requested_depth_range=None
    ):

        matched_events = []

        for result in results:

            well_id = result.get(
                "well_id"
            )

            events = result.get(
                "events",
                []
            )

            if not events:
                continue

            for event in events:

                if not isinstance(
                    event,
                    dict
                ):
                    continue

                # ------------------------------------------------
                # Event type filter
                # ------------------------------------------------

                if event_type:

                    if not self.event_matches_type(
                        event,
                        event_type
                    ):

                        continue

                # ------------------------------------------------
                # Depth range filter
                # ------------------------------------------------

                if requested_depth_range:

                    range_start, range_end = (
                        requested_depth_range
                    )

                    if not self.event_overlaps_depth_range(
                        event.get(
                            "depth",
                            ""
                        ),
                        range_start,
                        range_end
                    ):

                        continue

                # ------------------------------------------------
                # Single depth filter
                # ------------------------------------------------

                elif requested_depth is not None:

                    if not self.event_is_near_depth(
                        event.get(
                            "depth",
                            ""
                        ),
                        requested_depth
                    ):

                        continue

                matched_events.append({

                    "well_id": well_id,

                    "event": event.get(
                        "event",
                        "Unknown"
                    ),

                    "depth": event.get(
                        "depth",
                        "Not specified"
                    ),

                    "measurement": event.get(
                        "measurement",
                        "Not specified"
                    ),

                    "evidence": event.get(
                        "evidence",
                        ""
                    ),

                    "document": result.get(
                        "document",
                        "Unknown"
                    ),

                    "page": result.get(
                        "page",
                        "Unknown"
                    ),

                    "score": result.get(
                        "score"
                    )
                })

        return self.deduplicate_events(
            matched_events
        )

    # ============================================================
    # Build Deterministic Event Answer
    # ============================================================

    def build_event_answer(
        self,
        matched_events,
        event_type=None,
        requested_depth=None,
        requested_depth_range=None
    ):

        if not matched_events:

            # ----------------------------------------------------
            # Unsupported / unavailable event
            # ----------------------------------------------------

            if event_type == "stuck_pipe":

                return (
                    "The available evidence does not "
                    "contain stuck-pipe events."
                )

            if event_type:

                event_label = event_type.replace(
                    "_",
                    " "
                )

                return (
                    "The available evidence does not "
                    f"contain {event_label} events."
                )

            # ----------------------------------------------------
            # Depth range with no events
            # ----------------------------------------------------

            if requested_depth_range:

                range_start, range_end = (
                    requested_depth_range
                )

                return (
                    "The available evidence does not "
                    f"contain events between "
                    f"{range_start:g} m MD and "
                    f"{range_end:g} m MD."
                )

            # ----------------------------------------------------
            # Single depth with no event
            # ----------------------------------------------------

            if requested_depth is not None:

                return (
                    "The available evidence does not "
                    f"contain an event near "
                    f"{requested_depth:g} m MD."
                )

            return (
                "The available evidence does not "
                "contain this information."
            )

        # ========================================================
        # Depth Range Answer
        # ========================================================

        if requested_depth_range:

            range_start, range_end = (
                requested_depth_range
            )

            answer_lines = [

                f"Events observed between "
                f"{range_start:g} m MD and "
                f"{range_end:g} m MD:"
            ]

            for event in matched_events:

                evidence = self.get_event_evidence(
                    event
                )

                answer_lines.append(
                    f"{event['well_id']} — "
                    f"{evidence}"
                )

            return "\n".join(
                answer_lines
            )

        # ========================================================
        # Single Depth Answer
        # ========================================================

        if requested_depth is not None:

            answer_lines = []

            for event in matched_events:

                evidence = self.get_event_evidence(
                    event
                )

                answer_lines.append(
                    f"{event['well_id']} — "
                    f"{evidence}"
                )

            return "\n".join(
                answer_lines
            )

        # ========================================================
        # Event Type Answer
        # ========================================================

        if event_type:

            event_label = event_type.replace(
                "_",
                " "
            )

            # ----------------------------------------------------
            # Group wells
            # ----------------------------------------------------

            wells = []

            for event in matched_events:

                well_id = event[
                    "well_id"
                ]

                if well_id not in wells:

                    wells.append(
                        well_id
                    )

            answer_lines = [

                f"{', '.join(wells)} had "
                f"{event_label} events."
            ]

            for event in matched_events:

                evidence = self.get_event_evidence(
                    event
                )

                answer_lines.append(
                    f"{event['well_id']} — "
                    f"{evidence}"
                )

            return "\n".join(
                answer_lines
            )

        return (
            "The available evidence does not "
            "contain this information."
        )

    # ============================================================
    # Main Query Function
    # ============================================================

    def ask(self, question):

        question = question.strip()

        if not question:

            return RAGResponse(
                answer=(
                    "Please enter a question."
                ),
                sources=[]
            )

        print("\n")
        print("=" * 60)
        print("NWIS QUERY")
        print("=" * 60)

        print(
            f"\nQuestion: {question}"
        )

        # ========================================================
        # Extract Query Information
        # ========================================================

        requested_well = (
            self.extract_well_id(
                question
            )
        )

        requested_depth_range = (
            self.extract_depth_range(
                question
            )
        )

        requested_depth = (
            self.extract_depth(
                question
            )
        )

        event_type = (
            self.detect_event_type(
                question
            )
        )

        print(
            f"\nDetected Well: "
            f"{requested_well}"
        )

        print(
            f"Detected Depth: "
            f"{requested_depth}"
        )

        print(
            f"Detected Depth Range: "
            f"{requested_depth_range}"
        )

        print(
            f"Detected Event Type: "
            f"{event_type}"
        )

        # ========================================================
        # IMPORTANT
        #
        # If a depth range exists, don't treat the first depth
        # as a single-depth question.
        # ========================================================

        if requested_depth_range:

            requested_depth = None

        # ========================================================
        # Detect Query Type
        # ========================================================

        question_lower = (
            question.lower()
        )

        # --------------------------------------------------------
        # Event question
        # --------------------------------------------------------

        known_event_question = (
            event_type is not None
        )

        # --------------------------------------------------------
        # Specific depth question
        # --------------------------------------------------------

        specific_depth_question = (

            requested_depth is not None

            and

            any(
                phrase in question_lower
                for phrase in [

                    "what happened",

                    "what occurred",

                    "what event",

                    "what was observed",

                    "which event",

                    "which events"
                ]
            )
        )

        # --------------------------------------------------------
        # Specific depth-range question
        # --------------------------------------------------------

        specific_depth_range_question = (

            requested_depth_range is not None

            and

            any(
                phrase in question_lower
                for phrase in [

                    "what happened",

                    "what occurred",

                    "what event",

                    "what was observed",

                    "what events",

                    "which events"
                ]
            )
        )

        # --------------------------------------------------------
        # Deterministic structured event query
        # --------------------------------------------------------

        deterministic_event_query = (

            known_event_question

            or

            specific_depth_question

            or

            specific_depth_range_question
        )

        # ========================================================
        # Retrieve Documents
        # ========================================================

        print(
            "\nRetrieving relevant documents..."
        )

        results = self.retriever.search(
            question
        )

        print(
            f"Retrieved results: "
            f"{len(results)}"
        )

        # ========================================================
        # Deterministic Event Processing
        # ========================================================

        if deterministic_event_query:

            print(
                "\nUsing structured event matching..."
            )

            matched_events = (
                self.search_events(

                    results=results,

                    event_type=event_type,

                    requested_depth=requested_depth,

                    requested_depth_range=(
                        requested_depth_range
                    )
                )
            )

            print(
                f"Matched events: "
                f"{len(matched_events)}"
            )

            # ----------------------------------------------------
            # Build deterministic answer
            # ----------------------------------------------------

            answer = (
                self.build_event_answer(

                    matched_events=matched_events,

                    event_type=event_type,

                    requested_depth=requested_depth,

                    requested_depth_range=(
                        requested_depth_range
                    )
                )
            )

            # ====================================================
            # Build sources only from wells that actually
            # contributed matching events.
            # ====================================================

            contributing_wells = {

                event[
                    "well_id"
                ]

                for event in matched_events
            }

            sources = []

            seen_sources = set()

            for event in matched_events:

                source_key = (

                    event.get(
                        "well_id"
                    ),

                    event.get(
                        "document"
                    ),

                    event.get(
                        "page"
                    )
                )

                if source_key in seen_sources:

                    continue

                seen_sources.add(
                    source_key
                )

                sources.append({

                    "well_id": event.get(
                        "well_id"
                    ),

                    "document": event.get(
                        "document"
                    ),

                    "page": event.get(
                        "page"
                    ),

                    "score": event.get(
                        "score"
                    )
                })

            print(
                "\nDeterministic answer generated."
            )

            return RAGResponse(

                answer=answer,

                sources=sources
            )

        # ========================================================
        # Normal RAG Query
        # ========================================================

        print(
            "\nUsing normal RAG generation..."
        )

        if not results:

            return RAGResponse(

                answer=(
                    "The available evidence does not "
                    "contain this information."
                ),

                sources=[]
            )

        # ========================================================
        # Build LLM Prompt
        # ========================================================

        prompt = build_prompt(
            question,
            results
        )

        # ========================================================
        # Generate LLM Answer
        # ========================================================

        answer = self.llm.generate(
            prompt
        )

        # ========================================================
        # Build Sources
        # ========================================================

        sources = []

        seen_sources = set()

        for result in results:

            source_key = (

                result.get(
                    "well_id"
                ),

                result.get(
                    "document"
                ),

                result.get(
                    "page"
                )
            )

            if source_key in seen_sources:

                continue

            seen_sources.add(
                source_key
            )

            sources.append({

                "well_id": result.get(
                    "well_id"
                ),

                "document": result.get(
                    "document"
                ),

                "page": result.get(
                    "page"
                ),

                "score": result.get(
                    "score"
                )
            })

        # ========================================================
        # Final Response
        # ========================================================

        return RAGResponse(

            answer=answer,

            sources=sources
        )


# ================================================================
# Standalone Testing
# ================================================================

if __name__ == "__main__":

    pipeline = QueryPipeline()

    while True:

        try:

            question = input(
                "\nAsk NWIS: "
            ).strip()

            if question.lower() in [
                "exit",
                "quit"
            ]:

                break

            response = pipeline.ask(
                question
            )

            print(
                "\nAI ANSWER"
            )

            print(
                response.answer
            )

            print(
                "\nSOURCES"
            )

            for source in response.sources:

                print(
                    f"Well: "
                    f"{source.get('well_id')}"
                )

                print(
                    f"Document: "
                    f"{source.get('document')}"
                )

                print(
                    f"Page: "
                    f"{source.get('page')}"
                )

                print(
                    f"Similarity: "
                    f"{source.get('score')}"
                )

                print()

        except KeyboardInterrupt:

            print(
                "\n\nExiting..."
            )

            break

        except Exception as e:

            print(
                f"\nError: {e}"
            )