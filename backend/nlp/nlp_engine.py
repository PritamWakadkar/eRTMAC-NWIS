import re

from backend.nlp.query_router import QueryRouter
from backend.nearby_rag import NearbyWellRAG
from backend.db import get_connection


class NLPEngine:
    """
    Orchestrates question routing, well lookup, and event analysis.

    Design rules in this version:
      * No event and no event field is ever dropped. Events are copied and
        only enriched with extra keys (well_id, event_depth_m, sources ...).
      * Exact duplicate events (same well/type/depth/measurement/evidence)
        are merged, but every document/page they came from is kept in
        `sources` and the merge count is kept in `duplicate_count`.
      * Events with no parseable depth are never discarded silently; depth
        queries report them in `events_without_depth`.
      * Well IDs like "W-104", "W104", "w 104" are treated as the same well.
    """

    # ==========================================================
    # EVENT TYPE ALIASES (keys and values are normalized names)
    # ==========================================================

    EVENT_ALIASES = {
        "torque_spike": {"torque_spike", "torque_increase"},
        "torque_increase": {"torque_spike", "torque_increase"},
        "mud_loss": {"mud_loss"},
        "drag": {"drag", "drag_increase"},
        "drag_increase": {"drag", "drag_increase"},
        "wiper_trip": {"wiper_trip"},
    }

    EVENT_DISPLAY_NAMES = {
        "mud_loss": "mud-loss",
        "torque_spike": "torque-related",
        "torque_increase": "torque-related",
        "drag": "drag-related",
        "drag_increase": "drag-related",
        "wiper_trip": "wiper-trip",
    }

    def __init__(self):
        print("Initializing NLP Engine...")
        self.router = QueryRouter()
        self.rag = NearbyWellRAG()

    # ==========================================================
    # SMALL HELPERS
    # ==========================================================

    @staticmethod
    def well_key(well_id):
        """Comparison key: 'W-104', 'w104', 'W 104' -> 'W104'."""
        return re.sub(r"[^A-Z0-9]", "", str(well_id or "").upper())

    @staticmethod
    def normalize_event_type(value):
        """'MUD_LOSS', 'Mud Loss', 'mud-loss' -> 'mud_loss'."""
        if value is None:
            return ""
        return re.sub(r"[\s\-]+", "_", str(value).strip().lower())

    @staticmethod
    def _plural(count, singular, plural=None):
        plural = plural or singular + "s"
        return singular if count == 1 else plural

    @staticmethod
    def _was_were(count):
        return "was" if count == 1 else "were"

    @staticmethod
    def _to_float(value):
        """Parse numbers from int/float/str/dict({'value': ..}). None if impossible."""
        if value is None or isinstance(value, bool):
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, dict):
            return NLPEngine._to_float(value.get("value"))

        match = re.search(r"-?\d[\d,]*\.?\d*", str(value))
        if not match:
            return None
        try:
            return float(match.group(0).replace(",", ""))
        except ValueError:
            return None

    def event_types_match(self, requested_type, actual_type):
        requested = self.normalize_event_type(requested_type)
        actual = self.normalize_event_type(actual_type)

        if not requested or not actual:
            return False

        allowed = self.EVENT_ALIASES.get(requested, {requested})
        return actual in allowed

    @staticmethod
    def _event_type_of(event):
        return event.get("event_type") or event.get("event")

    def _event_depth(self, event):
        """Depth in metres as float, or None. Uses the RAG extractor first."""
        depth = None

        extractor = (
            getattr(self.rag, "extract_event_depth", None)
            or getattr(self.rag, "_extract_event_depth", None)
        )

        if callable(extractor):
            try:
                depth = self._to_float(extractor(event))
            except Exception:
                depth = None

        if depth is None:
            for field in ("event_depth", "depth", "depth_m", "start_depth"):
                depth = self._to_float(event.get(field))
                if depth is not None:
                    break

        return depth

    def format_event_type(self, event_type):
        normalized = self.normalize_event_type(event_type)
        return self.EVENT_DISPLAY_NAMES.get(
            normalized, normalized.replace("_", "-")
        )

    @staticmethod
    def _source_of(event):
        document = event.get("document") or event.get("source_document")
        page = event.get("page") or event.get("source_page")

        if not document and not page:
            return None

        return {"document": document, "page": page}

    @staticmethod
    def _source_text(sources):
        parts = []
        for source in sources:
            document = source.get("document") or "unknown document"
            page = source.get("page")
            parts.append(f"{document}, p. {page}" if page else str(document))
        return "; ".join(parts)

    # ==========================================================
    # WELL ID HANDLING
    # ==========================================================

    def get_all_well_ids(self):
        """Unique well IDs from PostgreSQL and RAG metadata (raw formats kept)."""

        db_ids = set()
        connection = None
        cursor = None

        try:
            connection = get_connection()
            cursor = connection.cursor()
            cursor.execute("SELECT well_id FROM wells ORDER BY well_id")
            db_ids = {
                str(row[0]).upper().strip()
                for row in cursor.fetchall()
                if row and row[0]
            }
        except Exception as e:
            print("Error getting database well IDs:", e)
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

        rag_ids = set()

        try:
            for item in getattr(self.rag, "metadata", []) or []:
                if isinstance(item, dict) and item.get("well_id"):
                    rag_ids.add(str(item["well_id"]).upper().strip())
        except Exception as e:
            print("Error getting RAG well IDs:", e)

        self._db_well_ids = db_ids
        return sorted(db_ids | rag_ids)

    def _group_wells(self):
        """
        Returns {well_key: {"display": id, "variants": [ids...]}}.
        The display ID prefers the database format.
        """
        all_ids = self.get_all_well_ids()
        db_ids = getattr(self, "_db_well_ids", set())

        groups = {}
        for raw_id in all_ids:
            key = self.well_key(raw_id)
            group = groups.setdefault(key, {"display": None, "variants": []})
            group["variants"].append(raw_id)
            if raw_id in db_ids and group["display"] is None:
                group["display"] = raw_id

        for group in groups.values():
            if group["display"] is None:
                group["display"] = group["variants"][0]

        return groups

    def _resolve_well(self, well_id):
        """Return (display_id, variants) for any spelling of a well ID."""
        key = self.well_key(well_id)
        raw = str(well_id or "").upper().strip()

        group = self._group_wells().get(key)

        if not group:
            return raw, [raw]

        variants = list(group["variants"])
        if raw and raw not in variants:
            variants.append(raw)

        return group["display"], variants

    # ==========================================================
    # EVENT COLLECTION / MERGING
    # ==========================================================

    def _collect_events(self, well_id):
        """
        All events for a well across every ID spelling.
        Every event is copied (never mutated) and stamped with well_id.
        Nothing is filtered here.
        """
        display_id, variants = self._resolve_well(well_id)

        collected = []

        for variant in variants:
            try:
                events = self.rag.get_well_events(variant) or []
            except Exception as e:
                print(f"Error reading events for {variant}: {e}")
                continue

            for event in events:
                if not isinstance(event, dict):
                    continue

                event_copy = dict(event)
                original = event_copy.get("well_id")

                if original and self.well_key(original) != self.well_key(display_id):
                    # Event stamped with a different well: keep it as-is.
                    event_copy["well_id"] = str(original).upper().strip()
                else:
                    if original and str(original) != display_id:
                        event_copy["original_well_id"] = original
                    event_copy["well_id"] = display_id

                collected.append(event_copy)

        return display_id, collected

    def _merge_duplicates(self, events):
        """
        Merge exact duplicates only. All sources are preserved in `sources`
        and the number of merged copies is kept in `duplicate_count`.
        """
        merged = {}
        order = []

        for event in events:
            depth = self._event_depth(event)

            evidence = " ".join(
                str(
                    event.get("evidence")
                    or event.get("description")
                    or event.get("text")
                    or ""
                ).lower().split()
            )

            key = (
                self.well_key(event.get("well_id")),
                self.normalize_event_type(self._event_type_of(event)),
                depth if depth is not None else str(event.get("depth") or "").strip().lower(),
                str(event.get("measurement") or "").strip().lower(),
                evidence,
            )

            source = self._source_of(event)

            if key not in merged:
                entry = dict(event)
                entry["sources"] = [source] if source else []
                entry["duplicate_count"] = 1
                merged[key] = entry
                order.append(key)
                continue

            entry = merged[key]
            entry["duplicate_count"] += 1

            if source and source not in entry["sources"]:
                entry["sources"].append(source)

            # Fill fields the first copy did not have; never overwrite.
            for field, value in event.items():
                if field not in entry or entry[field] in (None, "", []):
                    entry[field] = value

        return [merged[key] for key in order]

    def _filter_by_type(self, events, event_type):
        if not event_type:
            return list(events)

        return [
            event
            for event in events
            if self.event_types_match(event_type, self._event_type_of(event))
        ]

    def _sort_key(self, event):
        depth = self._event_depth(event)
        return (
            self.well_key(event.get("well_id")),
            depth if depth is not None else float("inf"),
            self.normalize_event_type(self._event_type_of(event)),
        )

    # ==========================================================
    # MAIN ENTRY
    # ==========================================================

    def process(self, question, radius_km: float = 10.0, depth_tolerance: float = 200.0):

        routed_query = self.router.route(question)
        parsed_query = routed_query["query"]
        route = routed_query["route"]

        well_id = parsed_query.get("well_id")
        event_type = parsed_query.get("event_type")

        # "Which wells had mud-loss events?" is valid without a well ID.
        cross_well_event_query = (
            route == "event_analysis"
            and event_type is not None
            and not well_id
        )

        if not well_id and not cross_well_event_query:
            return {
                "success": False,
                "route": route,
                "error": "No well ID found in the question.",
                "query": parsed_query,
            }

        if cross_well_event_query:
            return self.cross_well_event_analysis(parsed_query, route)

        # Canonical spelling used consistently for every route.
        well_id, _ = self._resolve_well(well_id)

        if route == "nearby_well_analysis":
            result = self.rag.analyze(
                well_id=well_id,
                radius_km=radius_km,
                depth_tolerance=depth_tolerance,
            )
            return {
                "success": True,
                "route": route,
                "query": parsed_query,
                "result": result,
            }

        if route == "formation_analysis":
            return self.get_formation(well_id)

        if route == "historical_interval_analysis":
            return self.historical_interval_analysis(well_id, parsed_query, route)

        if route == "well_information":
            return self.get_well_information(well_id)

        if route == "event_analysis":
            return self.single_well_event_analysis(well_id, parsed_query, route)

        if route == "depth_event_analysis":
            return self.depth_event_analysis(
                well_id=well_id,
                parsed_query=parsed_query,
                route=route,
                depth_tolerance=depth_tolerance,
            )

        if route == "general_well_query":
            result = self.get_well_information(well_id)
            result["query"] = parsed_query
            return result

        return {
            "success": False,
            "route": route,
            "query": parsed_query,
            "error": f"Route '{route}' is not supported.",
        }

    # ==========================================================
    # HISTORICAL INTERVALS
    # ==========================================================

    def historical_interval_analysis(self, well_id, parsed_query, route):

        _, variants = self._resolve_well(well_id)

        intervals = []
        seen = set()

        for variant in variants:
            try:
                found = self.rag.get_historical_intervals(variant) or []
            except Exception as e:
                print(f"Error reading intervals for {variant}: {e}")
                continue

            for interval in found:
                fingerprint = repr(sorted(interval.items())) if isinstance(interval, dict) else repr(interval)
                if fingerprint in seen:
                    continue
                seen.add(fingerprint)
                intervals.append(interval)

        if intervals:
            texts = []
            for interval in intervals:
                unit = interval.get("unit", "m MD")
                texts.append(
                    f"{interval.get('start_depth')}–{interval.get('end_depth')} {unit}"
                )

            summary = (
                f"Well {well_id.upper()} has {len(intervals)} historical problem "
                f"{self._plural(len(intervals), 'interval')}: {', '.join(texts)}."
            )
        else:
            summary = (
                f"No historical problem intervals were identified for well "
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
                "ai_summary": summary,
            },
        }

    # ==========================================================
    # CROSS-WELL EVENT ANALYSIS
    # ==========================================================

    def cross_well_event_analysis(self, parsed_query, route):

        event_type = parsed_query.get("event_type")

        if not event_type:
            return {
                "success": False,
                "route": route,
                "query": parsed_query,
                "error": "No event type found in the question.",
            }

        groups = self._group_wells()

        raw_events = []
        wells_searched = 0

        for group in groups.values():
            wells_searched += 1
            _, events = self._collect_events(group["display"])
            raw_events.extend(self._filter_by_type(events, event_type))

        matched_events = self._merge_duplicates(raw_events)
        matched_events.sort(key=self._sort_key)

        matched_well_ids = sorted({event["well_id"] for event in matched_events})

        formatted = self.format_event_type(event_type)

        if matched_events:
            lines = []

            for event in matched_events:
                evidence = (
                    event.get("evidence")
                    or event.get("description")
                    or event.get("text")
                )

                depth = self._event_depth(event)

                if not evidence:
                    evidence = (
                        f"{formatted} event at "
                        f"{event.get('depth', 'unknown depth')}; "
                        f"measurement: {event.get('measurement', 'not specified')}."
                    )

                line = f"{event['well_id']} — {evidence}"

                if depth is not None:
                    line += f" [depth {depth:g} m]"

                if event["sources"]:
                    line += f" (source: {self._source_text(event['sources'])})"

                lines.append(line)

            summary = (
                f"{len(matched_well_ids)} {self._plural(len(matched_well_ids), 'well')} "
                f"had {formatted} events:\n" + "\n".join(lines)
            )
        else:
            summary = f"No wells were found with {formatted} events."

        return {
            "success": True,
            "route": route,
            "query": parsed_query,
            "result": {
                "scope": "all_wells",
                "event_type": event_type,
                "wells_searched": wells_searched,
                "matched_wells": matched_well_ids,
                "well_count": len(matched_well_ids),
                "event_count": len(matched_events),
                "raw_event_count_before_merge": len(raw_events),
                "matched_events": matched_events,
                "structured_summary": summary,
                "ai_summary": summary,
            },
        }

    # ==========================================================
    # SINGLE WELL EVENT ANALYSIS
    # ==========================================================

    def single_well_event_analysis(self, well_id, parsed_query, route):

        event_type = parsed_query.get("event_type")

        if not event_type:
            return {
                "success": False,
                "route": route,
                "query": parsed_query,
                "error": "No event type found in the question.",
            }

        display_id, events = self._collect_events(well_id)

        raw_matches = self._filter_by_type(events, event_type)
        matched_events = self._merge_duplicates(raw_matches)
        matched_events.sort(key=self._sort_key)

        formatted = self.format_event_type(event_type)
        count = len(matched_events)

        if matched_events:
            summary = (
                f"{count} {formatted} {self._plural(count, 'event')} "
                f"{self._was_were(count)} found in {display_id.upper()}."
            )
        else:
            summary = f"No {formatted} events were found in {display_id.upper()}."

        return {
            "success": True,
            "route": route,
            "query": parsed_query,
            "result": {
                "scope": "single_well",
                "well_id": display_id.upper(),
                "event_type": event_type,
                "matched_wells": [display_id.upper()] if matched_events else [],
                "well_count": 1 if matched_events else 0,
                "event_count": count,
                "raw_event_count_before_merge": len(raw_matches),
                "matched_events": matched_events,
                "structured_summary": summary,
                "ai_summary": summary,
            },
        }

    # ==========================================================
    # DEPTH EVENT ANALYSIS
    # ==========================================================

    def depth_event_analysis(self, well_id, parsed_query, route, depth_tolerance):

        depth_data = parsed_query.get("depth")
        depth_range = parsed_query.get("depth_range")
        event_type = parsed_query.get("event_type")

        display_id, events = self._collect_events(well_id)
        events = self._merge_duplicates(events)

        # Events with no usable depth are reported, never silently lost.
        events_without_depth = [e for e in events if self._event_depth(e) is None]

        # ---------------- CASE 1: DEPTH RANGE ----------------
        if depth_range:

            start_depth = self._to_float(depth_range.get("start"))
            end_depth = self._to_float(depth_range.get("end"))

            if start_depth is None or end_depth is None:
                return {
                    "success": False,
                    "route": route,
                    "query": parsed_query,
                    "error": "Depth range is invalid.",
                }

            if start_depth > end_depth:
                start_depth, end_depth = end_depth, start_depth

            matched_events = []

            for event in self._filter_by_type(events, event_type):
                event_depth = self._event_depth(event)

                if event_depth is None:
                    continue
                if event_depth < start_depth or event_depth > end_depth:
                    continue

                matched = dict(event)
                matched["event_depth_m"] = event_depth
                matched["range_start_m"] = start_depth
                matched["range_end_m"] = end_depth
                matched["within_range"] = True
                matched_events.append(matched)

            matched_events.sort(key=lambda e: e["event_depth_m"])

            count = len(matched_events)
            summary = (
                f"{count} {self._plural(count, 'event')} {self._was_were(count)} "
                f"found between {start_depth:g} m MD and {end_depth:g} m MD "
                f"in {display_id.upper()}."
            )

            return {
                "success": True,
                "route": route,
                "query": parsed_query,
                "result": {
                    "well_id": display_id.upper(),
                    "requested_depth_range": {
                        "start": start_depth,
                        "end": end_depth,
                        "unit": "m MD",
                    },
                    "event_type": event_type,
                    "matched_events": matched_events,
                    "event_count": count,
                    "events_without_depth": events_without_depth,
                    "events_without_depth_count": len(events_without_depth),
                    "structured_summary": summary,
                    "ai_summary": summary,
                },
            }

        # ---------------- CASE 2: SINGLE DEPTH ----------------
        target_depth = self._to_float(depth_data)

        if target_depth is None:
            return {
                "success": False,
                "route": route,
                "query": parsed_query,
                "error": "No depth found in the question.",
            }

        tolerance = self._to_float(depth_tolerance) or 0.0
        matched_events = []

        for event in self._filter_by_type(events, event_type):
            event_depth = self._event_depth(event)

            if event_depth is None:
                continue

            difference = abs(event_depth - target_depth)

            if difference > tolerance:
                continue

            matched = dict(event)
            matched["event_depth_m"] = event_depth
            matched["requested_depth_m"] = target_depth
            matched["difference_m"] = difference
            matched["within_tolerance"] = True
            matched_events.append(matched)

        matched_events.sort(key=lambda e: e["difference_m"])

        count = len(matched_events)
        summary = (
            f"{count} {self._plural(count, 'event')} {self._was_were(count)} "
            f"found around {target_depth:g} m MD in {display_id.upper()} "
            f"(±{tolerance:g} m)."
        )

        return {
            "success": True,
            "route": route,
            "query": parsed_query,
            "result": {
                "well_id": display_id.upper(),
                "requested_depth": depth_data,
                "event_type": event_type,
                "depth_tolerance_m": tolerance,
                "matched_events": matched_events,
                "event_count": count,
                "events_without_depth": events_without_depth,
                "events_without_depth_count": len(events_without_depth),
                "structured_summary": summary,
                "ai_summary": summary,
            },
        }

    # ==========================================================
    # FORMATION FALLBACK (documents -> events -> chunk text)
    # ==========================================================

    # Matches empty values AND placeholder text such as
    # "Formation not specified", "Not available", "Unknown", "N/A", "-".
    _BLANK_RE = re.compile(
        r"^\s*(?:|none|null|n/?a|na|unknown|-+)\s*$"
        r"|not\s+(?:specified|available|found|recorded|provided|applicable)"
        r"|\bunspecified\b|\bunknown\b",
        re.IGNORECASE,
    )

    # PostgreSQL version of _BLANK_RE, used to overwrite placeholder text in the DB.
    _PLACEHOLDER_SQL_REGEX = (
        "^(none|null|n/?a|na|unknown|-+)?$"
        "|not[[:space:]]+(specified|available|found|recorded|provided|applicable)"
        "|unspecified|unknown"
    )

    _FORMATION_RE = re.compile(
        r"Formation\s*:\s*(.+?)"
        r"(?=\s+(?:Location Name|Operator|Rig|Report Type|Report Date|Well ID|"
        r"Well Name|Latitude|Longitude|Total Depth|Depth at)\s*:|\s{2,}|\n|$)",
        re.IGNORECASE,
    )

    @classmethod
    def _is_blank(cls, value):
        return value is None or bool(cls._BLANK_RE.search(str(value)))

    def _formation_from_documents(self, well_id):
        """
        Look for the formation of a well in ingested documents.
        Order: structured `formation` fields in RAG metadata, event records,
        then 'Formation: X' text in chunks. The most frequent value wins.
        Returns (formation, source_dict) or (None, None).
        """
        key = self.well_key(well_id)
        votes = {}
        first_source = {}

        def vote(value, document=None, page=None):
            if self._is_blank(value):
                return
            name = " ".join(str(value).split()).strip(" .;,")
            if self._is_blank(name):
                return
            votes[name] = votes.get(name, 0) + 1
            first_source.setdefault(name, {"document": document, "page": page})

        # 1) RAG metadata (structured field, then chunk text)
        for item in getattr(self.rag, "metadata", []) or []:
            if not isinstance(item, dict):
                continue
            if self.well_key(item.get("well_id")) != key:
                continue

            document = item.get("document") or item.get("source") or item.get("source_document")
            page = item.get("page") or item.get("source_page")

            vote(item.get("formation"), document, page)

            for field in ("text", "chunk_text", "content", "chunk"):
                text = item.get(field)
                if isinstance(text, str):
                    for match in self._FORMATION_RE.finditer(text):
                        vote(match.group(1), document, page)

        # 2) Event records
        try:
            _, events = self._collect_events(well_id)
        except Exception:
            events = []

        for event in events:
            vote(
                event.get("formation"),
                event.get("document") or event.get("source_document"),
                event.get("page") or event.get("source_page"),
            )

        if not votes:
            return None, None

        best = max(votes, key=votes.get)
        return best, first_source.get(best)

    def _persist_formation(self, well_id, formation):
        """Self-heal: store a document-derived formation only if the DB value is blank."""
        connection = None
        cursor = None
        try:
            connection = get_connection()
            cursor = connection.cursor()
            cursor.execute(
                """
                UPDATE wells
                SET formation = %s
                WHERE REGEXP_REPLACE(UPPER(well_id), '[^A-Z0-9]', '', 'g') = %s
                  AND (
                        formation IS NULL
                        OR TRIM(formation) ~* %s
                      )
                """,
                (formation, self.well_key(well_id), self._PLACEHOLDER_SQL_REGEX),
            )
            connection.commit()
        except Exception as e:
            print("Could not persist formation:", e)
            if connection:
                try:
                    connection.rollback()
                except Exception:
                    pass
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def _resolve_formation(self, well_id, db_formation):
        """Returns (formation, origin, source). Database value wins if present."""
        if not self._is_blank(db_formation):
            return db_formation, "database", None

        formation, source = self._formation_from_documents(well_id)

        if formation:
            self._persist_formation(well_id, formation)
            return formation, "documents", source

        return None, None, None

    # ==========================================================
    # DATABASE LOOKUPS
    # ==========================================================

    def _fetch_well_row(self, columns, well_id):
        """Fetch one wells row, matching well IDs regardless of hyphens/spaces."""
        connection = None
        cursor = None

        try:
            connection = get_connection()
            cursor = connection.cursor()

            cursor.execute(
                f"""
                SELECT {columns}
                FROM wells
                WHERE REGEXP_REPLACE(UPPER(well_id), '[^A-Z0-9]', '', 'g') = %s
                """,
                (self.well_key(well_id),),
            )

            return cursor.fetchone(), None

        except Exception as e:
            return None, str(e)

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def get_formation(self, well_id):
        row, error = self._fetch_well_row("well_id, formation", well_id)

        if error:
            return {"success": False, "route": "formation_analysis", "error": error}

        db_id = row[0] if row else None
        db_formation = row[1] if row else None

        formation, origin, source = self._resolve_formation(well_id, db_formation)

        if row is None and not formation:
            return {
                "success": False,
                "route": "formation_analysis",
                "error": f"Well {well_id.upper()} not found.",
            }

        result = {
            "well_id": db_id or well_id.upper(),
            "formation": formation,
            "formation_source": origin,
        }

        if source:
            result["formation_evidence"] = source

        if formation:
            where = "the database" if origin == "database" else "the ingested reports"
            summary = f"Well {result['well_id']} is in the {formation} (from {where})."
        else:
            summary = (
                f"No formation is recorded for well {result['well_id']} in the "
                f"database or in the ingested documents."
            )

        result["structured_summary"] = summary
        result["ai_summary"] = summary

        return {"success": True, "route": "formation_analysis", "result": result}

    def get_well_information(self, well_id):
        row, error = self._fetch_well_row(
            "well_id, latitude, longitude, total_depth, formation", well_id
        )

        if error:
            return {"success": False, "route": "well_information", "error": error}

        if row is None:
            return {
                "success": False,
                "route": "well_information",
                "error": f"Well {well_id.upper()} not found.",
            }

        formation, origin, source = self._resolve_formation(row[0], row[4])

        result = {
            "well_id": row[0],
            "latitude": row[1],
            "longitude": row[2],
            "total_depth_m": row[3],
            "formation": formation,
            "formation_source": origin,
        }

        if source:
            result["formation_evidence"] = source

        return {"success": True, "route": "well_information", "result": result}