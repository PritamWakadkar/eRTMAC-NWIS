"""
GET /api/well-map  ->  every well in the database, ready for the map page.

Wells with missing or invalid coordinates are NOT dropped: they are returned
in `wells_without_coordinates` so the UI can still list them.
If database is unreachable or empty, authentic Northeast India (OIL & ONGC)
sample wells are returned as a fallback.
"""
from fastapi import APIRouter
import logging

from backend.db import get_connection

router = APIRouter()
logger = logging.getLogger(__name__)

# Sample wells in Northeast India (Assam & Arunachal Pradesh)
NORTHEAST_SAMPLE_WELLS = [
    {"well_id": "W-104", "latitude": 27.2892, "longitude": 95.3421, "total_depth_m": 3850.0, "formation": "Barail Sandstone"},
    {"well_id": "W-105", "latitude": 27.2985, "longitude": 95.3564, "total_depth_m": 3920.0, "formation": "Tipam Sandstone"},
    {"well_id": "W-106", "latitude": 27.3541, "longitude": 95.3188, "total_depth_m": 4100.0, "formation": "Kopili Formation"},
    {"well_id": "DIG-089", "latitude": 27.3884, "longitude": 95.6291, "total_depth_m": 2450.0, "formation": "Tipam Sandstone"},
    {"well_id": "DIG-112", "latitude": 27.4012, "longitude": 95.6425, "total_depth_m": 2780.0, "formation": "Surma Group"},
    {"well_id": "MOR-045", "latitude": 27.1824, "longitude": 94.9312, "total_depth_m": 3740.0, "formation": "Barail Main Sand"},
    {"well_id": "MOR-062", "latitude": 27.1510, "longitude": 94.9085, "total_depth_m": 3890.0, "formation": "Barail Coal-Shale"},
    {"well_id": "BAGH-007", "latitude": 27.6045, "longitude": 95.4128, "total_depth_m": 4250.0, "formation": "Barail Sandstone"},
    {"well_id": "HAP-024", "latitude": 27.4312, "longitude": 95.2284, "total_depth_m": 3620.0, "formation": "Girujan Clay / Tipam"},
    {"well_id": "TEN-008", "latitude": 27.3620, "longitude": 95.1850, "total_depth_m": 3710.0, "formation": "Tipam Sandstone"},
    {"well_id": "KUM-003", "latitude": 27.3245, "longitude": 96.0289, "total_depth_m": 4400.0, "formation": "Girujan / Tipam"},
    {"well_id": "BOR-019", "latitude": 26.4715, "longitude": 93.9240, "total_depth_m": 3210.0, "formation": "Sylhet Limestone"},
    {"well_id": "LAK-078", "latitude": 27.0241, "longitude": 94.8825, "total_depth_m": 3550.0, "formation": "Barail Sandstone"},
    {"well_id": "GEL-032", "latitude": 26.8512, "longitude": 94.7562, "total_depth_m": 4120.0, "formation": "Tipam Sandstone"},
    {"well_id": "RUD-015", "latitude": 26.9890, "longitude": 94.6321, "total_depth_m": 3380.0, "formation": "Barail Main Sand"},
    {"well_id": "KUS-011", "latitude": 27.5120, "longitude": 95.4215, "total_depth_m": 3790.0, "formation": "Barail Sandstone"},
    {"well_id": "JRH-005", "latitude": 26.7580, "longitude": 94.2150, "total_depth_m": 4350.0, "formation": "Basement / Kopili"},
]

NORTHEAST_UNMAPPED_SAMPLE = [
    {"well_id": "DUL-EXP-01", "latitude": None, "longitude": None, "total_depth_m": None, "formation": "Tipam Sandstone"},
    {"well_id": "BOR-OLD-04", "latitude": None, "longitude": None, "total_depth_m": None, "formation": "Kopili Formation"},
]


def _number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


@router.get("/api/well-map")
def get_well_map():
    connection = None
    cursor = None
    rows = []

    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT well_id, latitude, longitude, total_depth, formation
            FROM wells
            ORDER BY well_id
            """
        )
        rows = cursor.fetchall()
    except Exception as e:
        logger.warning(f"Could not load wells from DB, using Northeast sample wells: {e}")
        rows = []
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

    if not rows:
        return {
            "count": len(NORTHEAST_SAMPLE_WELLS),
            "wells": NORTHEAST_SAMPLE_WELLS,
            "wells_without_coordinates": NORTHEAST_UNMAPPED_SAMPLE,
            "source": "northeast_sample",
        }

    mapped = []
    unmapped = []

    for well_id, latitude, longitude, total_depth, formation in rows:
        lat = _number(latitude)
        lon = _number(longitude)

        item = {
            "well_id": str(well_id),
            "latitude": lat,
            "longitude": lon,
            "total_depth_m": _number(total_depth),
            "formation": formation,
        }

        valid = (
            lat is not None
            and lon is not None
            and -90 <= lat <= 90
            and -180 <= lon <= 180
        )

        (mapped if valid else unmapped).append(item)

    return {
        "count": len(rows),
        "wells": mapped,
        "wells_without_coordinates": unmapped,
        "source": "database",
    }