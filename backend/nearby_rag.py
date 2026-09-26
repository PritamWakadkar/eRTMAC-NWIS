from backend.db import get_connection

from backend.ai.rag.vectorstore.metadata import load_metadata

from backend.ai.rag.retrieval.depth_matcher import (
    compare_event_to_target,
    compare_event_to_interval
)

from backend.ai.rag.retrieval.formation_matcher import (
    compare_formations
)

from backend.ai.rag.generation.llm import LLM

import re


class NearbyWellRAG:

    def __init__(self):

        print("\nInitializing Nearby Well RAG...")

        self.metadata = load_metadata()

        # Load LLM.
        # It is kept available for future natural-language generation.
        self.llm = LLM()

    # ================================================================
    # GET NEARBY WELLS
    # ================================================================

    def get_nearby_wells(self, well_id, radius_km=10):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            # ========================================================
            # GET TARGET WELL
            # ========================================================

            cursor.execute(
                """
                SELECT
                    well_id,
                    latitude,
                    longitude,
                    total_depth,
                    formation,
                    location
                FROM wells
                WHERE well_id = %s
                """,
                (well_id.upper(),)
            )

            target = cursor.fetchone()

            # ========================================================
            # TARGET WELL NOT FOUND
            # ========================================================

            if target is None:

                return {
                    "target_well": well_id.upper(),
                    "target_latitude": None,
                    "target_longitude": None,
                    "target_total_depth": None,
                    "target_formation": None,
                    "nearby_wells": []
                }

            # ========================================================
            # TARGET INFORMATION
            # ========================================================

            target_well_id = target[0]

            target_latitude = target[1]

            target_longitude = target[2]

            target_total_depth = target[3]

            target_formation = target[4]

            # ========================================================
            # FIND NEARBY WELLS USING POSTGIS
            # ========================================================

            cursor.execute(
                """
                SELECT
                    w.well_id,
                    w.latitude,
                    w.longitude,
                    w.total_depth,
                    w.formation,

                    ROUND(
                        (
                            ST_Distance(
                                w.location::geography,
                                target.location::geography
                            ) / 1000
                        )::numeric,
                        2
                    ) AS distance_km

                FROM wells w

                CROSS JOIN (
                    SELECT location
                    FROM wells
                    WHERE well_id = %s
                ) AS target

                WHERE w.well_id != %s

                  AND ST_DWithin(
                      w.location::geography,
                      target.location::geography,
                      %s
                  )

                ORDER BY distance_km;
                """,
                (
                    well_id.upper(),
                    well_id.upper(),
                    radius_km * 1000
                )
            )

            rows = cursor.fetchall()

            nearby_wells = []

            # ========================================================
            # BUILD NEARBY WELL LIST
            # ========================================================

            for row in rows:

                nearby_wells.append({

                    "well_id":
                        row[0],

                    "latitude":
                        float(row[1]),

                    "longitude":
                        float(row[2]),

                    "total_depth":
                        (
                            float(row[3])
                            if row[3] is not None
                            else None
                        ),

                    "formation":
                        row[4],

                    "distance_km":
                        float(row[5])
                })

            # ========================================================
            # RETURN TARGET + NEARBY WELLS
            # ========================================================

            return {

                "target_well":
                    target_well_id,

                "target_latitude":
                    float(target_latitude),

                "target_longitude":
                    float(target_longitude),

                "target_total_depth":
                    (
                        float(target_total_depth)
                        if target_total_depth is not None
                        else None
                    ),

                "target_formation":
                    target_formation,

                "nearby_wells":
                    nearby_wells
            }

        except Exception as e:

            print(
                f"Error finding nearby wells: {e}"
            )

            raise

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ================================================================
    # GET WELL EVENTS
    # ================================================================

    def get_well_events(
        self,
        well_id: str
    ):

        events = []

        for item in self.metadata:

            if item.get(
                "well_id"
            ) != well_id.upper():

                continue

            chunk_events = item.get(
                "events",
                []
            )

            for event in chunk_events:

                event_copy = event.copy()

                event_copy["document"] = item.get(
                    "document"
                )

                event_copy["page"] = item.get(
                    "page"
                )

                raw_evidence = event_copy.get(
                    "evidence",
                    ""
                )

                event_type = (
                    event_copy.get("event_type")
                    or event_copy.get("event")
                    or ""
                )

                event_copy["evidence"] = (
                    self._clean_event_evidence(
                        raw_evidence,
                        event_type,
                        event_copy.get("depth")
                    )
                )

                events.append(
                    event_copy
                )

        return events

    # ================================================================
    # CLEAN EVENT EVIDENCE
    # ================================================================

    def _clean_event_evidence(
        self,
        evidence,
        event_type,
        event_depth=None
    ):

        if not evidence:
            return ""

        evidence = str(
            evidence
        ).strip()

        if not evidence:
            return ""

        # Split combined evidence into individual statements.
        parts = [
            part.strip()
            for part in evidence.split("•")
            if part.strip()
        ]

        if not parts:
            parts = [evidence]

        normalized_type = str(
            event_type or ""
        ).lower().strip()

        event_keywords = {
            "mud_loss": [
                "mud loss",
                "mud losses",
                "lost circulation",
                "losses"
            ],
            "torque_spike": [
                "torque spike",
                "torque increased",
                "torque increase",
                "torque"
            ],
            "torque_increase": [
                "torque spike",
                "torque increased",
                "torque increase",
                "torque"
            ],
            "drag": [
                "drag",
                "drag increased",
                "drag increase"
            ],
            "drag_increase": [
                "drag",
                "drag increased",
                "drag increase"
            ],
            "wiper_trip": [
                "wiper trip"
            ]
        }

        keywords = event_keywords.get(
            normalized_type,
            []
        )

        # Prefer a statement containing both the event keyword
        # and the event's depth.
        target_depth = None

        if event_depth:

            depth_match = re.search(
                r"(\d+(?:\.\d+)?)\s*m",
                str(event_depth),
                flags=re.IGNORECASE
            )

            if depth_match:
                target_depth = depth_match.group(1)

        if target_depth:

            for part in parts:

                part_lower = part.lower()

                if target_depth not in part_lower:
                    continue

                for keyword in keywords:

                    if keyword in part_lower:
                        return part.strip()

        # Otherwise find a statement containing the event keyword.
        for part in parts:

            part_lower = part.lower()

            for keyword in keywords:

                if keyword in part_lower:
                    return part.strip()

        # Fallback when the event type is unknown or no keyword
        # could be matched.
        return parts[0].strip()

    # ================================================================
    # GET TARGET DEPTHS
    # ================================================================

    def get_target_depths(
        self,
        well_id: str
    ):

        depths = []

        for item in self.metadata:

            if item.get(
                "well_id"
            ) != well_id.upper():

                continue

            for depth in item.get(
                "depths",
                []
            ):

                depth = float(depth)

                if depth not in depths:

                    depths.append(
                        depth
                    )

        return sorted(depths)

    # ================================================================
    # GET WELL FORMATION
    # ================================================================

    def get_well_formation(
        self,
        well_id: str
    ):

        for item in self.metadata:

            if item.get(
                "well_id"
            ) != well_id.upper():

                continue

            formation = item.get(
                "formation",
                "Formation not specified"
            )

            return formation

        return "Formation not specified"

    # ================================================================
    # GET HISTORICAL PROBLEM INTERVALS
    # ================================================================

    def get_historical_intervals(
        self,
        well_id: str
    ):

        for item in self.metadata:

            if item.get(
                "well_id"
            ) != well_id.upper():

                continue

            return item.get(
                "historical_problem_intervals",
                []
            )

        return []

    # ================================================================
    # MATCH EVENTS WITH TARGET DEPTHS
    # ================================================================

    def match_events_to_target(
        self,
        target_well_id: str,
        events,
        tolerance: float = 200.0
    ):

        target_depths = self.get_target_depths(
            target_well_id
        )

        matches = []

        if not target_depths:

            return matches

        for event in events:

            best_match = None

            for target_depth in target_depths:

                comparison = compare_event_to_target(

                    target_depth=target_depth,

                    event=event,

                    tolerance=tolerance
                )

                if comparison is None:

                    continue

                if (
                    best_match is None
                    or
                    comparison["difference_m"]
                    <
                    best_match["difference_m"]
                ):

                    best_match = comparison

            if best_match is not None:

                matches.append(
                    best_match
                )

        return matches

    # ================================================================
    # MATCH EVENTS WITH HISTORICAL PROBLEM INTERVALS
    # ================================================================

    def match_events_to_historical_intervals(
        self,
        target_well_id: str,
        events,
        tolerance: float = 200.0
    ):

        intervals = self.get_historical_intervals(
            target_well_id
        )

        matches = []

        if not intervals:

            return matches

        for event in events:

            for interval in intervals:

                comparison = compare_event_to_interval(

                    event=event,

                    interval_start=interval[
                        "start_depth"
                    ],

                    interval_end=interval[
                        "end_depth"
                    ],

                    tolerance=tolerance
                )

                if comparison is None:

                    continue

                matches.append(
                    comparison
                )

        return matches

    # ================================================================
    # BUILD EVIDENCE CONTEXT
    # ================================================================

    def build_evidence_context(
        self,
        analysis_result
    ):

        lines = []

        target_well = analysis_result.get(
            "target_well"
        )

        target_formation = analysis_result.get(
            "target_formation"
        )

        historical_intervals = (
            analysis_result.get(
                "historical_problem_intervals",
                []
            )
        )

        radius_km = analysis_result.get(
            "radius_km"
        )

        depth_tolerance = analysis_result.get(
            "depth_tolerance_m"
        )

        # ============================================================
        # TARGET WELL
        # ============================================================

        lines.append(
            f"Target Well: {target_well}"
        )

        lines.append(
            f"Target Formation: {target_formation}"
        )

        lines.append(
            f"Search Radius: {radius_km} km"
        )

        lines.append(
            f"Depth Tolerance: {depth_tolerance} m"
        )

        # ============================================================
        # HISTORICAL INTERVALS
        # ============================================================

        lines.append(
            "\nHistorical Problem Intervals:"
        )

        if historical_intervals:

            for interval in historical_intervals:

                start = interval.get(
                    "start_depth"
                )

                end = interval.get(
                    "end_depth"
                )

                unit = interval.get(
                    "unit",
                    "m MD"
                )

                lines.append(
                    f"- {start} - {end} {unit}"
                )

        else:

            lines.append(
                "- None identified"
            )

        # ============================================================
        # NEARBY WELLS
        # ============================================================

        lines.append(
            "\nNearby Wells:"
        )

        nearby_wells = analysis_result.get(
            "nearby_wells",
            []
        )

        if not nearby_wells:

            lines.append(
                "- No nearby wells found"
            )

        # ============================================================
        # EACH NEARBY WELL
        # ============================================================

        for well in nearby_wells:

            well_id = well.get(
                "well_id"
            )

            distance = well.get(
                "distance_km"
            )

            formation = well.get(
                "formation"
            )

            total_depth = well.get(
                "total_depth"
            )

            formation_match = well.get(
                "formation_match",
                {}
            )

            # --------------------------------------------------------
            # WELL IDENTITY BOUNDARY
            # --------------------------------------------------------

            lines.append(
                "\n=================================================="
            )

            lines.append(
                f"NEARBY WELL RECORD: {well_id}"
            )

            lines.append(
                "All drilling events below belong ONLY to this well."
            )

            lines.append(
                f"Distance: {distance} km"
            )

            lines.append(
                f"Formation: {formation}"
            )

            lines.append(
                f"Total Depth: {total_depth} m"
            )

            lines.append(
                "Formation Match: "
                f"{formation_match.get('match', False)}"
            )

            # ========================================================
            # DRILLING EVENTS
            # ========================================================

            events = well.get(
                "events",
                []
            )

            lines.append(
                "\nDrilling Events:"
            )

            if events:

                for event in events:

                    event_type = event.get(
                        "event",
                        "unknown"
                    )

                    depth = event.get(
                        "depth",
                        "unknown"
                    )

                    measurement = event.get(
                        "measurement",
                        "not specified"
                    )

                    evidence = event.get(
                        "evidence",
                        ""
                    )

                    document = event.get(
                        "document",
                        "Unknown"
                    )

                    page = event.get(
                        "page",
                        "Unknown"
                    )

                    lines.append(
                        f"- {event_type} at {depth}"
                    )

                    lines.append(
                        f"  Measurement: {measurement}"
                    )

                    if evidence:

                        lines.append(
                            f"  Evidence: {evidence}"
                        )

                    lines.append(
                        f"  Source: {document}, Page {page}"
                    )

            else:

                lines.append(
                    "- No structured drilling events found"
                )

            # ========================================================
            # DEPTH MATCHES
            # ========================================================

            depth_matches = well.get(
                "depth_matches",
                []
            )

            lines.append(
                "\nDepth Matches:"
            )

            if depth_matches:

                for match in depth_matches:

                    lines.append(
                        f"- {match.get('event')} "
                        f"at {match.get('event_depth')} m "
                        f"vs target depth "
                        f"{match.get('target_depth')} m"
                    )

                    lines.append(
                        f"  Difference: "
                        f"{match.get('difference_m')} m"
                    )

                    lines.append(
                        f"  Within tolerance: "
                        f"{match.get('within_tolerance')}"
                    )

            else:

                lines.append(
                    "- No depth matches"
                )

            # ========================================================
            # HISTORICAL INTERVAL MATCHES
            # ========================================================

            interval_matches = well.get(
                "historical_interval_matches",
                []
            )

            lines.append(
                "\nHistorical Interval Matches:"
            )

            if interval_matches:

                for match in interval_matches:

                    event_name = match.get(
                        "event",
                        "unknown"
                    )

                    event_depth = match.get(
                        "event_depth"
                    )

                    interval_start = match.get(
                        "interval_start"
                    )

                    interval_end = match.get(
                        "interval_end"
                    )

                    difference = match.get(
                        "difference_m"
                    )

                    within_interval = match.get(
                        "within_interval"
                    )

                    within_tolerance = match.get(
                        "within_tolerance"
                    )

                    lines.append(
                        f"- {event_name} "
                        f"at {event_depth} m"
                    )

                    lines.append(
                        f"  Historical interval: "
                        f"{interval_start} - "
                        f"{interval_end} m"
                    )

                    lines.append(
                        f"  Difference from interval: "
                        f"{difference} m"
                    )

                    lines.append(
                        f"  Inside historical interval: "
                        f"{within_interval}"
                    )

                    lines.append(
                        f"  Within tolerance: "
                        f"{within_tolerance}"
                    )

            else:

                lines.append(
                    "- No events matched the "
                    "historical problem interval"
                )

        return "\n".join(lines)

    # ================================================================
    # GENERATE STRUCTURED SUMMARY
    # ================================================================

    def generate_structured_summary(
        self,
        analysis_result
    ):

        target_well = analysis_result.get(
            "target_well",
            "Unknown"
        )

        target_formation = analysis_result.get(
            "target_formation",
            "Not specified"
        )

        historical_intervals = analysis_result.get(
            "historical_problem_intervals",
            []
        )

        nearby_wells = analysis_result.get(
            "nearby_wells",
            []
        )

        lines = []

        # ------------------------------------------------------------
        # TARGET WELL
        # ------------------------------------------------------------

        lines.append(
            "Target Well:"
        )

        lines.append(
            str(target_well)
        )

        lines.append("")

        # ------------------------------------------------------------
        # TARGET FORMATION
        # ------------------------------------------------------------

        lines.append(
            "Target Formation:"
        )

        lines.append(
            str(target_formation)
        )

        lines.append("")

        # ------------------------------------------------------------
        # HISTORICAL INTERVAL
        # ------------------------------------------------------------

        lines.append(
            "Historical Problem Interval:"
        )

        if historical_intervals:

            for interval in historical_intervals:

                start = interval.get(
                    "start_depth"
                )

                end = interval.get(
                    "end_depth"
                )

                unit = interval.get(
                    "unit",
                    "m MD"
                )

                lines.append(
                    f"{start} - {end} {unit}"
                )

        else:

            lines.append(
                "None identified"
            )

        lines.append("")

        # ------------------------------------------------------------
        # NEARBY WELLS
        # ------------------------------------------------------------

        lines.append(
            "Nearby Well Findings:"
        )

        lines.append("")

        if not nearby_wells:

            lines.append(
                "No nearby wells found."
            )

        # ------------------------------------------------------------
        # EACH WELL
        # ------------------------------------------------------------

        for well in nearby_wells:

            well_id = well.get(
                "well_id",
                "Unknown"
            )

            distance = well.get(
                "distance_km",
                "Unknown"
            )

            formation = well.get(
                "formation",
                "Not specified"
            )

            formation_match = well.get(
                "formation_match",
                {}
            )

            match = formation_match.get(
                "match",
                False
            )

            lines.append(
                f"{well_id} — {distance} km"
            )

            lines.append(
                f"Formation: {formation}"
            )

            lines.append(
                f"Formation Match: {match}"
            )

            lines.append(
                "Events:"
            )

            events = well.get(
                "events",
                []
            )

            # --------------------------------------------------------
            # NO EVENTS
            # --------------------------------------------------------

            if not events:

                lines.append(
                    "No structured drilling events found."
                )

            # --------------------------------------------------------
            # EVENTS
            # --------------------------------------------------------

            else:

                for event in events:

                    event_name = event.get(
                        "event",
                        "Unknown event"
                    )

                    depth = event.get(
                        "depth",
                        "Depth not specified"
                    )

                    measurement = event.get(
                        "measurement",
                        "Measurement not specified"
                    )

                    lines.append(
                        f"- {event_name} at {depth}"
                    )

                    lines.append(
                        f"  Measurement: {measurement}"
                    )

                    # ------------------------------------------------
                    # FIND CORRESPONDING HISTORICAL MATCH
                    # ------------------------------------------------

                    interval_match = None

                    interval_matches = well.get(
                        "historical_interval_matches",
                        []
                    )

                    event_depth = self._extract_event_depth(
                        event
                    )

                    for candidate in interval_matches:

                        candidate_event = candidate.get(
                            "event"
                        )

                        candidate_depth = candidate.get(
                            "event_depth"
                        )

                        if (
                            candidate_event == event_name
                            and
                            candidate_depth == event_depth
                        ):

                            interval_match = candidate

                            break

                    # ------------------------------------------------
                    # HISTORICAL STATUS
                    # ------------------------------------------------

                    if interval_match:

                        inside = interval_match.get(
                            "within_interval",
                            False
                        )

                        within_tolerance = interval_match.get(
                            "within_tolerance",
                            False
                        )

                        if inside:

                            lines.append(
                                "  Historical Interval: Inside"
                            )

                        else:

                            lines.append(
                                "  Historical Interval: Outside"
                            )

                        if within_tolerance:

                            lines.append(
                                "  Tolerance: Within configured tolerance"
                            )

                        else:

                            lines.append(
                                "  Tolerance: Outside configured tolerance"
                            )

            lines.append("")

        return "\n".join(lines)

    # ================================================================
    # EXTRACT EVENT DEPTH
    # ================================================================

    def _extract_event_depth(
        self,
        event
    ):

        depth = event.get(
            "depth"
        )

        if depth is None:

            return None

        import re

        match = re.search(
            r"(\d+(?:\.\d+)?)",
            str(depth)
        )

        if not match:

            return None

        return float(
            match.group(1)
        )

    # ================================================================
    # GENERATE AI SUMMARY
    # ================================================================

    def generate_ai_summary(
        self,
        analysis_result
    ):
        """
        The structured Python summary is the authoritative
        evidence-grounded response.

        The LLM is intentionally not used for the final
        ai_summary here because Qwen may expose meta-reasoning
        or repeat prompt instructions.
        """

        structured_summary = (
            self.generate_structured_summary(
                analysis_result
            )
        )

        if not structured_summary:

            return "Insufficient evidence found."

        return structured_summary

    # ================================================================
    # MAIN ANALYSIS
    # ================================================================

    def analyze(
        self,
        well_id: str,
        radius_km: float = 10.0,
        depth_tolerance: float = 200.0
    ):

        # ============================================================
        # GET NEARBY WELL DATA
        # ============================================================

        nearby_data = self.get_nearby_wells(
            well_id,
            radius_km
        )

        # Extract nearby wells from dictionary
        nearby_wells = nearby_data.get(
            "nearby_wells",
            []
        )

        # ============================================================
        # TARGET WELL INFORMATION
        # ============================================================

        target_well_id = nearby_data.get(
            "target_well",
            well_id.upper()
        )

        target_latitude = nearby_data.get(
            "target_latitude"
        )

        target_longitude = nearby_data.get(
            "target_longitude"
        )

        target_total_depth = nearby_data.get(
            "target_total_depth"
        )

        # ============================================================
        # GET TARGET WELL FORMATION
        # ============================================================

        target_formation = (
            self.get_well_formation(
                well_id
            )
        )

        # ============================================================
        # GET TARGET HISTORICAL INTERVALS
        # ============================================================

        historical_intervals = (
            self.get_historical_intervals(
                well_id
            )
        )

        # ============================================================
        # NO NEARBY WELLS
        # ============================================================

        if not nearby_wells:

            result = {

                "target_well":
                    target_well_id,

                "target_latitude":
                    target_latitude,

                "target_longitude":
                    target_longitude,

                "target_total_depth":
                    target_total_depth,

                "target_formation":
                    target_formation,

                "historical_problem_intervals":
                    historical_intervals,

                "radius_km":
                    radius_km,

                "depth_tolerance_m":
                    depth_tolerance,

                "nearby_wells":
                    [],

                "analysis":
                    "No nearby wells found."
            }

            # --------------------------------------------------------
            # BUILD EVIDENCE
            # --------------------------------------------------------

            result["evidence_context"] = (
                self.build_evidence_context(
                    result
                )
            )

            # --------------------------------------------------------
            # STRUCTURED SUMMARY
            # --------------------------------------------------------

            result["structured_summary"] = (
                self.generate_structured_summary(
                    result
                )
            )

            # --------------------------------------------------------
            # AUTHORITATIVE AI SUMMARY
            # --------------------------------------------------------

            result["ai_summary"] = (
                self.generate_ai_summary(
                    result
                )
            )

            return result

        # ============================================================
        # ANALYZE EACH NEARBY WELL
        # ============================================================

        results = []

        for well in nearby_wells:

            nearby_well_id = well[
                "well_id"
            ]

            # --------------------------------------------------------
            # GET EVENTS
            # --------------------------------------------------------

            events = self.get_well_events(
                nearby_well_id
            )

            # --------------------------------------------------------
            # COMPARE EVENT DEPTHS
            # --------------------------------------------------------

            depth_matches = (
                self.match_events_to_target(

                    target_well_id=well_id,

                    events=events,

                    tolerance=depth_tolerance
                )
            )

            # --------------------------------------------------------
            # COMPARE HISTORICAL INTERVALS
            # --------------------------------------------------------

            historical_interval_matches = (

                self.match_events_to_historical_intervals(

                    target_well_id=well_id,

                    events=events,

                    tolerance=depth_tolerance
                )
            )

            # --------------------------------------------------------
            # COMPARE FORMATIONS
            # --------------------------------------------------------

            nearby_formation = well[
                "formation"
            ]

            formation_match = compare_formations(

                target_formation,

                nearby_formation
            )

            # --------------------------------------------------------
            # STORE COMPLETE RESULT
            # --------------------------------------------------------

            results.append({

                "well_id":
                    nearby_well_id,

                "latitude":
                    well.get("latitude"),

                "longitude":
                    well.get("longitude"),

                "distance_km":
                    well["distance_km"],

                "formation":
                    nearby_formation,

                "formation_match":
                    formation_match,

                "total_depth":
                    well["total_depth"],

                "events":
                    events,

                "depth_matches":
                    depth_matches,

                "historical_interval_matches":
                    historical_interval_matches
            })

        # ============================================================
        # FINAL RESULT
        # ============================================================

        result = {

            "target_well":
                target_well_id,

            "target_latitude":
                target_latitude,

            "target_longitude":
                target_longitude,

            "target_total_depth":
                target_total_depth,

            "target_formation":
                target_formation,

            "historical_problem_intervals":
                historical_intervals,

            "radius_km":
                radius_km,

            "depth_tolerance_m":
                depth_tolerance,

            "nearby_wells":
                results
        }

        # ============================================================
        # BUILD AI EVIDENCE CONTEXT
        # ============================================================

        result["evidence_context"] = (
            self.build_evidence_context(
                result
            )
        )

        # ============================================================
        # GENERATE STRUCTURED SUMMARY
        # ============================================================

        result["structured_summary"] = (
            self.generate_structured_summary(
                result
            )
        )

        # ============================================================
        # AUTHORITATIVE AI SUMMARY
        # ============================================================

        result["ai_summary"] = (
            self.generate_ai_summary(
                result
            )
        )

        return result