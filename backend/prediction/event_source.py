"""
Reads wells and the events extracted from uploaded PDFs, and packages
them into an in-memory snapshot used by BOTH training and prediction.
"""

import math
import re

from backend.db import get_connection


# ==========================================================
# HELPERS
# ==========================================================

def key_of(value):
    return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())


def to_number(value):
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, dict):
        return to_number(value.get("value"))
    match = re.search(r"-?\d[\d,]*\.?\d*", str(value))
    if not match:
        return None
    try:
        return float(match.group(0).replace(",", ""))
    except ValueError:
        return None


def normalize_event(value):
    return re.sub(r"[\s\-]+", "_", str(value or "").strip().lower())


def haversine_km(lat1, lon1, lat2, lon2):
    radius = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dlmb = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(a))


# ==========================================================
# SNAPSHOT
# ==========================================================

class EventSnapshot:
    """
    coords : key -> (lat, lon)               (None when unknown)
    events : key -> [(event_type, depth_m, raw_event_dict), ...]
    display: key -> well id as written in the database
    """

    def __init__(self):
        self.coords = {}
        self.events = {}
        self.display = {}

    def add_well(self, well_id, lat, lon):
        key = key_of(well_id)
        if not key:
            return
        self.display.setdefault(key, str(well_id))
        existing = self.coords.get(key)
        if existing is None or existing[0] is None:
            self.coords[key] = (lat, lon)


# ==========================================================
# SOURCE
# ==========================================================

class EventSource:

    def __init__(self, rag=None):
        self.rag = rag

    def _get_rag(self):
        if self.rag is None:
            from backend.nearby_rag import NearbyWellRAG
            self.rag = NearbyWellRAG()
        return self.rag

    def _load_wells(self):
        connection = None
        cursor = None
        try:
            connection = get_connection()
            cursor = connection.cursor()
            cursor.execute("SELECT well_id, latitude, longitude FROM wells")
            return [
                (str(r[0]), to_number(r[1]), to_number(r[2]))
                for r in cursor.fetchall()
                if r and r[0]
            ]
        except Exception as e:
            print("EventSource could not read wells:", e)
            return []
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def _event_depth(self, event):
        rag = self._get_rag()

        extractor = (
            getattr(rag, "extract_event_depth", None)
            or getattr(rag, "_extract_event_depth", None)
        )

        if callable(extractor):
            try:
                depth = to_number(extractor(event))
                if depth is not None:
                    return depth
            except Exception:
                pass

        for field in ("event_depth", "depth", "depth_m", "start_depth"):
            depth = to_number(event.get(field))
            if depth is not None:
                return depth

        return None

    def _events_for_well(self, well_id):
        rag = self._get_rag()

        variants = []
        for candidate in (str(well_id).upper().strip(), key_of(well_id)):
            if candidate and candidate not in variants:
                variants.append(candidate)

        events = []
        seen = set()

        for variant in variants:
            try:
                found = rag.get_well_events(variant) or []
            except Exception as e:
                print(f"Could not read events for {variant}: {e}")
                continue

            for event in found:
                if not isinstance(event, dict):
                    continue

                event_type = normalize_event(
                    event.get("event_type") or event.get("event")
                )
                depth = self._event_depth(event)

                fingerprint = (
                    event_type,
                    depth,
                    str(event.get("measurement") or "").strip().lower(),
                )

                if fingerprint in seen:
                    continue
                seen.add(fingerprint)

                events.append((event_type, depth, event))

        return events

    def snapshot(self, extra_well_ids=None):
        snap = EventSnapshot()

        for well_id, lat, lon in self._load_wells():
            snap.add_well(well_id, lat, lon)

        for extra in extra_well_ids or []:
            if key_of(extra) not in snap.display:
                snap.add_well(str(extra).upper().strip(), None, None)

        for key, display in snap.display.items():
            snap.events[key] = [
                (event_type, depth, event)
                for event_type, depth, event in self._events_for_well(display)
                if event_type and event_type != "normal"
            ]

        return snap