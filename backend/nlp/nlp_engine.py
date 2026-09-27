from backend.nlp.query_router import QueryRouter
from backend.nearby_rag import NearbyWellRAG
from backend.db import get_connection


class NLPEngine:

    def __init__(self):

        print("Initializing NLP Engine...")

        self.router = QueryRouter()
        self.rag = NearbyWellRAG()

    # ==========================================================
    # EVENT TYPE MATCHING
    # ==========================================================

    def event_types_match(
        self,
        requested_type,
        actual_type
    ):

        if not requested_type or not actual_type:
            return False

        aliases = {

            "torque_spike": {
                "torque_spike",
                "torque_increase"
            },

            "torque_increase": {
                "torque_spike",
                "torque_increase"
            },

            "mud_loss": {
                "mud_loss"
            },

            "drag": {
                "drag",
                "drag_increase"
            },

            "drag_increase": {
                "drag",
                "drag_increase"
            },

            "wiper_trip": {
                "wiper_trip"
            }
        }

        allowed_types = aliases.get(
            requested_type,
            {requested_type}
        )

        return actual_type in allowed_types

    # ==========================================================
    # GET ALL WELL IDS
    # ==========================================================
    def get_all_well_ids(self):
        """Return unique well IDs from PostgreSQL and RAG metadata."""

        db_well_ids = set()
        connection = None
        cursor = None

        try:
            connection = get_connection()
            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT well_id
                FROM wells
                ORDER BY well_id
                """
            )

            rows = cursor.fetchall()

            db_well_ids = {
                str(row[0]).upper().strip()
                for row in rows
                if row and row[0]
            }

        except Exception as e:
            print("Error getting database well IDs:", e)

        finally:
            if cursor:
                cursor.close()

            if connection:
                connection.close()

        rag_well_ids = set()

        try:
            metadata = getattr(self.rag, "metadata", []) or []

            for item in metadata:
                if not isinstance(item, dict):
                    continue

                rag_well_id = item.get("well_id")

                if rag_well_id:
                    rag_well_ids.add(
                        str(rag_well_id).upper().strip()
                    )

        except Exception as e:
            print("Error getting RAG well IDs:", e)

        return sorted(db_well_ids | rag_well_ids)

    def process(
        self,
        question,
        radius_km: float = 10.0,
        depth_tolerance: float = 200.0
    ):

        # ------------------------------------------------------
        # NLP ROUTING
        # ------------------------------------------------------

        routed_query = self.router.route(
            question
        )

        parsed_query = routed_query["query"]

        route = routed_query["route"]

        well_id = parsed_query.get(
            "well_id"
        )

        event_type = parsed_query.get(
            "event_type"
        )

        # ======================================================
        # CROSS-WELL EVENT QUERY
        # ======================================================

        # Example:
        #
        # Which wells had mud-loss events?
        #
        # well_id = None
        # event_type = mud_loss
        #
        # This is a VALID query.

        cross_well_event_query = (
            route == "event_analysis"
            and event_type is not None
            and well_id is None
        )

        # ======================================================
        # WELL ID VALIDATION
        # ======================================================

        # Do NOT require a well ID for cross-well event queries.

        if (
            not well_id
            and not cross_well_event_query
        ):

            return {
                "success": False,
                "route": route,
                "error": "No well ID found in the question.",
                "query": parsed_query
            }

        # ======================================================
        # CROSS-WELL EVENT ANALYSIS
        # ======================================================

        if cross_well_event_query:

            return self.cross_well_event_analysis(
                parsed_query=parsed_query,
                route=route
            )

        # ======================================================
        # NEARBY WELL ANALYSIS
        # ======================================================

        if route == "nearby_well_analysis":

            result = self.rag.analyze(
                well_id=well_id,
                radius_km=radius_km,
                depth_tolerance=depth_tolerance
            )

            return {
                "success": True,
                "route": route,
                "query": parsed_query,
                "result": result
            }

        # ======================================================
        # FORMATION ANALYSIS
        # ======================================================

        if route == "formation_analysis":

            return self.get_formation(
                well_id
            )

        # ======================================================
        # HISTORICAL INTERVAL ANALYSIS
        # ======================================================

        if route == "historical_interval_analysis":

            intervals = (
                self.rag.get_historical_intervals(
                    well_id
                )
            )

            if intervals:

                interval_text = []

                for interval in intervals:

                    start_depth = interval.get(
                        "start_depth"
                    )

                    end_depth = interval.get(
                        "end_depth"
                    )

                    unit = interval.get(
                        "unit",
                        "m MD"
                    )

                    interval_text.append(
                        f"{start_depth}–{end_depth} {unit}"
                    )

                summary = (
                    f"Well {well_id.upper()} has "
                    f"{len(intervals)} historical problem "
                    f"interval"
                    f"{'s' if len(intervals) != 1 else ''}: "
                    f"{', '.join(interval_text)}."
                )

            else:

                summary = (
                    f"No historical problem intervals "
                    f"were identified for well "
                    f"{well_id.upper()}."
                )

            return {
                "success": True,
                "route": route,
                "query": parsed_query,
                "result": {
                    "well_id": well_id.upper(),
                    "historical_problem_intervals": intervals,
                    "structured_summary": summary,
                    "ai_summary": summary
                }
            }

        # ======================================================
        # WELL INFORMATION
        # ======================================================

        if route == "well_information":

            return self.get_well_information(
                well_id
            )

        # ======================================================
        # EVENT ANALYSIS
        # ======================================================

        if route == "event_analysis":

            return self.single_well_event_analysis(
                well_id=well_id,
                parsed_query=parsed_query,
                route=route
            )

        # ======================================================
        # DEPTH EVENT ANALYSIS
        # ======================================================

        if route == "depth_event_analysis":

            return self.depth_event_analysis(
                well_id=well_id,
                parsed_query=parsed_query,
                route=route,
                depth_tolerance=depth_tolerance
            )

        # ======================================================
        # GENERAL WELL QUERY
        # ======================================================

        if route == "general_well_query":

            result = self.get_well_information(
                well_id
            )

            result["query"] = parsed_query

            return result

        # ======================================================
        # UNKNOWN ROUTE
        # ======================================================

        return {
            "success": False,
            "route": route,
            "query": parsed_query,
            "error": (
                f"Route '{route}' is not supported."
            )
        }

    # ==========================================================
    # CROSS-WELL EVENT ANALYSIS
    # ==========================================================

    def cross_well_event_analysis(
        self,
        parsed_query,
        route
    ):

        event_type = parsed_query.get("event_type")

        if not event_type:
            return {
                "success": False,
                "route": route,
                "query": parsed_query,
                "error": "No event type found in the question."
            }

        # ------------------------------------------------------
        # GET ALL WELLS
        # ------------------------------------------------------

        well_ids = self.get_all_well_ids()

        matched_events = []
        matched_well_ids = set()
        seen_events = set()

        # ------------------------------------------------------
        # SEARCH EVERY WELL
        # ------------------------------------------------------

        for current_well_id in well_ids:
            current_well_id = str(current_well_id).upper().strip()

            try:
                events = self.rag.get_well_events(current_well_id) or []
            except Exception as e:
                print(
                    f"Error reading events for {current_well_id}: {e}"
                )
                continue

            for event in events:
                if not isinstance(event, dict):
                    continue

                actual_event_type = (
                    event.get("event_type")
                    or event.get("event")
                )

                if not self.event_types_match(
                    event_type,
                    actual_event_type
                ):
                    continue

                event_copy = dict(event)
                event_copy["well_id"] = str(
                    event_copy.get("well_id")
                    or current_well_id
                ).upper().strip()

                # --------------------------------------------------
                # NORMALIZED DEDUPLICATION KEY
                # --------------------------------------------------
                # RAG can return the same event from multiple chunks.
                # Deduplicate using the actual well, event, depth,
                # measurement and evidence. Document/page are kept
                # as fallback identity fields for genuinely different
                # source records.

                normalized_event = str(
                    event_copy.get("event_type")
                    or event_copy.get("event")
                    or ""
                ).strip().lower()

                normalized_depth = str(
                    event_copy.get("depth")
                    or event_copy.get("event_depth")
                    or ""
                ).strip().lower()

                normalized_measurement = str(
                    event_copy.get("measurement")
                    or ""
                ).strip().lower()

                normalized_evidence = " ".join(
                    str(
                        event_copy.get("evidence")
                        or event_copy.get("description")
                        or event_copy.get("text")
                        or ""
                    ).strip().lower().split()
                )

                normalized_document = str(
                    event_copy.get("document")
                    or ""
                ).strip().lower()

                normalized_page = str(
                    event_copy.get("page")
                    or ""
                ).strip()

                event_key = (
                    event_copy["well_id"],
                    normalized_event,
                    normalized_depth,
                    normalized_measurement,
                    normalized_evidence,
                    normalized_document,
                    normalized_page
                )

                if event_key in seen_events:
                    continue

                seen_events.add(event_key)
                matched_events.append(event_copy)
                matched_well_ids.add(event_copy["well_id"])

        # ------------------------------------------------------
        # SORT RESULTS
        # ------------------------------------------------------

        matched_well_ids = sorted(matched_well_ids)

        matched_events.sort(
            key=lambda event: (
                str(event.get("well_id", "")),
                str(event.get("depth", "")),
                str(
                    event.get("event_type")
                    or event.get("event")
                    or ""
                )
            )
        )

        # ------------------------------------------------------
        # BUILD CLEAN SUMMARY
        # ------------------------------------------------------

        formatted_event_type = self.format_event_type(event_type)

        if matched_events:
            summary_lines = []

            for event in matched_events:
                current_well = event.get("well_id", "Unknown")

                evidence = (
                    event.get("evidence")
                    or event.get("description")
                    or event.get("text")
                )

                if not evidence:
                    depth = event.get("depth", "Unknown depth")
                    measurement = event.get(
                        "measurement",
                        "Not specified"
                    )
                    evidence = (
                        f"{formatted_event_type} event at "
                        f"{depth}; measurement: {measurement}."
                    )

                summary_lines.append(
                    f"{current_well} — {evidence}"
                )

            summary = (
                f"{len(matched_well_ids)} well(s) had "
                f"{formatted_event_type} events:\n"
                + "\n".join(summary_lines)
            )

        else:
            summary = (
                f"No wells were found with "
                f"{formatted_event_type} events."
            )

        return {
            "success": True,
            "route": route,
            "query": parsed_query,
            "result": {
                "scope": "all_wells",
                "event_type": event_type,
                "matched_wells": matched_well_ids,
                "well_count": len(matched_well_ids),
                "event_count": len(matched_events),
                "matched_events": matched_events,
                "structured_summary": summary,
                "ai_summary": summary
            }
        }

    # ==========================================================
    # SINGLE WELL EVENT ANALYSIS
    # ==========================================================

    def single_well_event_analysis(
        self,
        well_id,
        parsed_query,
        route
    ):

        event_type = parsed_query.get(
            "event_type"
        )

        if not event_type:

            return {
                "success": False,
                "route": route,
                "query": parsed_query,
                "error": (
                    "No event type found in the question."
                )
            }

        # ------------------------------------------------------
        # GET EVENTS
        # ------------------------------------------------------

        events = self.rag.get_well_events(
            well_id
        )

        matched_events = []

        # ------------------------------------------------------
        # FILTER EVENTS
        # ------------------------------------------------------

        for event in events:

            actual_event_type = (
                event.get("event_type")
                or event.get("event")
            )

            if self.event_types_match(
                event_type,
                actual_event_type
            ):

                event_copy = dict(
                    event
                )

                event_copy["well_id"] = (
                    event_copy.get(
                        "well_id"
                    )
                    or well_id
                )

                matched_events.append(
                    event_copy
                )

        # ------------------------------------------------------
        # SUMMARY
        # ------------------------------------------------------

        if matched_events:

            summary = (
                f"{len(matched_events)} "
                f"{self.format_event_type(event_type)} "
                f"event"
                f"{'s' if len(matched_events) != 1 else ''} "
                f"were found in "
                f"{well_id.upper()}."
            )

        else:

            summary = (
                f"No {self.format_event_type(event_type)} "
                f"events were found in "
                f"{well_id.upper()}."
            )

        return {
            "success": True,
            "route": route,
            "query": parsed_query,
            "result": {
                "scope": "single_well",
                "well_id": well_id.upper(),
                "event_type": event_type,
                "matched_wells": (
                    [well_id.upper()]
                    if matched_events
                    else []
                ),
                "well_count": (
                    1
                    if matched_events
                    else 0
                ),
                "matched_events": matched_events,
                "structured_summary": summary,
                "ai_summary": summary
            }
        }

    # ==========================================================
    # DEPTH EVENT ANALYSIS
    # ==========================================================

    def depth_event_analysis(
        self,
        well_id,
        parsed_query,
        route,
        depth_tolerance
    ):

        depth_data = parsed_query.get(
            "depth"
        )

        depth_range = parsed_query.get(
            "depth_range"
        )

        event_type = parsed_query.get(
            "event_type"
        )

        # ------------------------------------------------------
        # GET EVENTS
        # ------------------------------------------------------

        events = self.rag.get_well_events(
            well_id
        )

        matched_events = []

        # ======================================================
        # CASE 1: DEPTH RANGE
        # ======================================================

        if depth_range:

            start_depth = float(
                depth_range["start"]
            )

            end_depth = float(
                depth_range["end"]
            )

            # Safety if entered in reverse order
            if start_depth > end_depth:

                start_depth, end_depth = (
                    end_depth,
                    start_depth
                )

            # --------------------------------------------------
            # CHECK EVENTS
            # --------------------------------------------------

            for event in events:

                event_depth = (
                    self.rag._extract_event_depth(
                        event
                    )
                )

                if event_depth is None:
                    continue

                # ------------------------------------------------
                # RANGE MATCH
                # ------------------------------------------------

                if (
                    event_depth < start_depth
                    or event_depth > end_depth
                ):
                    continue

                # ------------------------------------------------
                # EVENT TYPE FILTER
                # ------------------------------------------------

                if event_type:

                    actual_event_type = (
                        event.get(
                            "event_type"
                        )
                        or event.get(
                            "event"
                        )
                    )

                    if not self.event_types_match(
                        event_type,
                        actual_event_type
                    ):
                        continue

                # ------------------------------------------------
                # RESULT
                # ------------------------------------------------

                matched_event = dict(
                    event
                )

                matched_event[
                    "well_id"
                ] = (
                    matched_event.get(
                        "well_id"
                    )
                    or well_id
                )

                matched_event[
                    "event_depth_m"
                ] = event_depth

                matched_event[
                    "range_start_m"
                ] = start_depth

                matched_event[
                    "range_end_m"
                ] = end_depth

                matched_event[
                    "within_range"
                ] = True

                matched_events.append(
                    matched_event
                )

            # --------------------------------------------------
            # SORT BY DEPTH
            # --------------------------------------------------

            matched_events.sort(
                key=lambda event:
                event["event_depth_m"]
            )

            # --------------------------------------------------
            # SUMMARY
            # --------------------------------------------------

            summary = (
                f"{len(matched_events)} event"
                f"{'s' if len(matched_events) != 1 else ''} "
                f"were found between "
                f"{start_depth:g} m MD and "
                f"{end_depth:g} m MD in "
                f"{well_id.upper()}."
            )

            return {
                "success": True,
                "route": route,
                "query": parsed_query,
                "result": {
                    "well_id": well_id.upper(),
                    "requested_depth_range": {
                        "start": start_depth,
                        "end": end_depth,
                        "unit": "m MD"
                    },
                    "event_type": event_type,
                    "matched_events": matched_events,
                    "event_count": len(
                        matched_events
                    ),
                    "structured_summary": summary,
                    "ai_summary": summary
                }
            }

        # ======================================================
        # CASE 2: SINGLE DEPTH
        # ======================================================

        if not depth_data:

            return {
                "success": False,
                "route": route,
                "query": parsed_query,
                "error": (
                    "No depth found in the question."
                )
            }

        target_depth = float(
            depth_data["value"]
        )

        # ------------------------------------------------------
        # CHECK EVENTS
        # ------------------------------------------------------

        for event in events:

            event_depth = (
                self.rag._extract_event_depth(
                    event
                )
            )

            if event_depth is None:
                continue

            difference = abs(
                event_depth - target_depth
            )

            if (
                difference
                > float(depth_tolerance)
            ):
                continue

            # --------------------------------------------------
            # EVENT TYPE FILTER
            # --------------------------------------------------

            if event_type:

                actual_event_type = (
                    event.get(
                        "event_type"
                    )
                    or event.get(
                        "event"
                    )
                )

                if not self.event_types_match(
                    event_type,
                    actual_event_type
                ):
                    continue

            # --------------------------------------------------
            # CREATE RESULT
            # --------------------------------------------------

            matched_event = dict(
                event
            )

            matched_event[
                "well_id"
            ] = (
                matched_event.get(
                    "well_id"
                )
                or well_id
            )

            matched_event[
                "event_depth_m"
            ] = event_depth

            matched_event[
                "requested_depth_m"
            ] = target_depth

            matched_event[
                "difference_m"
            ] = difference

            matched_event[
                "within_tolerance"
            ] = True

            matched_events.append(
                matched_event
            )

        # ------------------------------------------------------
        # SORT CLOSEST FIRST
        # ------------------------------------------------------

        matched_events.sort(
            key=lambda event:
            event["difference_m"]
        )

        # ------------------------------------------------------
        # SUMMARY
        # ------------------------------------------------------

        summary = (
            f"{len(matched_events)} event"
            f"{'s' if len(matched_events) != 1 else ''} "
            f"were found around "
            f"{target_depth:g} m MD in "
            f"{well_id.upper()}."
        )

        return {
            "success": True,
            "route": route,
            "query": parsed_query,
            "result": {
                "well_id": well_id.upper(),
                "requested_depth": depth_data,
                "event_type": event_type,
                "depth_tolerance_m": depth_tolerance,
                "matched_events": matched_events,
                "event_count": len(
                    matched_events
                ),
                "structured_summary": summary,
                "ai_summary": summary
            }
        }

    # ==========================================================
    # FORMAT EVENT TYPE
    # ==========================================================

    def format_event_type(
        self,
        event_type
    ):

        names = {

            "mud_loss":
                "mud-loss",

            "torque_spike":
                "torque-related",

            "torque_increase":
                "torque-related",

            "drag":
                "drag-related",

            "drag_increase":
                "drag-related",

            "wiper_trip":
                "wiper-trip"
        }

        return names.get(
            event_type,
            event_type.replace(
                "_",
                "-"
            )
        )

    # ==========================================================
    # GET FORMATION
    # ==========================================================

    def get_formation(
        self,
        well_id
    ):

        connection = None
        cursor = None

        try:

            connection = get_connection()

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    well_id,
                    formation
                FROM wells
                WHERE well_id = %s
                """,
                (
                    well_id.upper(),
                )
            )

            row = cursor.fetchone()

            if row is None:

                return {
                    "success": False,
                    "route": "formation_analysis",
                    "error": (
                        f"Well {well_id.upper()} "
                        "not found."
                    )
                }

            return {
                "success": True,
                "route": "formation_analysis",
                "result": {
                    "well_id": row[0],
                    "formation": row[1]
                }
            }

        except Exception as e:

            return {
                "success": False,
                "route": "formation_analysis",
                "error": str(e)
            }

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ==========================================================
    # GET WELL INFORMATION
    # ==========================================================

    def get_well_information(
        self,
        well_id
    ):

        connection = None
        cursor = None

        try:

            connection = get_connection()

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    well_id,
                    latitude,
                    longitude,
                    total_depth,
                    formation
                FROM wells
                WHERE well_id = %s
                """,
                (
                    well_id.upper(),
                )
            )

            row = cursor.fetchone()

            if row is None:

                return {
                    "success": False,
                    "route": "well_information",
                    "error": (
                        f"Well {well_id.upper()} "
                        "not found."
                    )
                }

            return {
                "success": True,
                "route": "well_information",
                "result": {
                    "well_id": row[0],
                    "latitude": row[1],
                    "longitude": row[2],
                    "total_depth_m": row[3],
                    "formation": row[4]
                }
            }

        except Exception as e:

            return {
                "success": False,
                "route": "well_information",
                "error": str(e)
            }

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()