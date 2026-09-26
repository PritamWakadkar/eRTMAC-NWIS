from backend.nlp.query_parser import QueryParser


class QueryRouter:

    def __init__(self):

        self.parser = QueryParser()

    def route(self, question):

        parsed_query = self.parser.parse(
            question
        )

        intent = parsed_query["intent"]

        event_type = parsed_query.get(
            "event_type"
        )

        depth = parsed_query.get(
            "depth"
        )

        # ======================================================
        # DEPTH EVENT ANALYSIS
        # ======================================================

        if (
            intent == "depth_events"
        ):

            return {
                "route": "depth_event_analysis",
                "query": parsed_query
            }

        # ======================================================
        # SPECIFIC EVENT ANALYSIS
        # ======================================================

        if (
            intent == "nearby_well_events"
            and event_type
            and depth is None
        ):

            return {
                "route": "event_analysis",
                "query": parsed_query
            }

        # ======================================================
        # NEARBY WELL ANALYSIS
        # ======================================================

        if (
            intent == "nearby_well_events"
        ):

            return {
                "route": "nearby_well_analysis",
                "query": parsed_query
            }

        # ======================================================
        # HISTORICAL INTERVAL
        # ======================================================

        if (
            intent == "historical_interval"
        ):

            return {
                "route": "historical_interval_analysis",
                "query": parsed_query
            }

        # ======================================================
        # FORMATION
        # ======================================================

        if (
            intent == "formation_information"
        ):

            return {
                "route": "formation_analysis",
                "query": parsed_query
            }

        # ======================================================
        # EVENT INFORMATION
        # ======================================================

        if (
            intent == "event_information"
        ):

            return {
                "route": "event_analysis",
                "query": parsed_query
            }

        # ======================================================
        # WELL INFORMATION
        # ======================================================

        if (
            intent == "well_information"
        ):

            return {
                "route": "well_information",
                "query": parsed_query
            }

        # ======================================================
        # GENERAL QUERY
        # ======================================================

        return {
            "route": "general_well_query",
            "query": parsed_query
        }