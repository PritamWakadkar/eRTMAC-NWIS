"""
GET /api/well-map  ->  every well in the database, ready for the map page.

Wells with missing or invalid coordinates are NOT dropped: they are returned
in `wells_without_coordinates` so the UI can still list them.
"""
from fastapi import APIRouter, HTTPException

from backend.db import get_connection

router = APIRouter()


def _number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


@router.get("/api/well-map")
def get_well_map():
    connection = None
    cursor = None

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
        raise HTTPException(status_code=500, detail=f"Could not load wells: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

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
    }