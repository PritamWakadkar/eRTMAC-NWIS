"""
Stores extracted drilling parameters and finds the nearest value per
parameter for a well and depth.

PLACEHOLDER: "%s" works for PostgreSQL / MySQL. Change it to "?" if your
backend.db.get_connection() returns a SQLite connection.
"""

from backend.db import get_connection

from .event_source import key_of

PLACEHOLDER = "%s"

CREATE_SQL = """
CREATE TABLE IF NOT EXISTS drilling_parameters (
    well_key VARCHAR(64) NOT NULL,
    well_id VARCHAR(64) NOT NULL,
    depth_m DOUBLE PRECISION NOT NULL,
    parameter VARCHAR(32) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    original_text VARCHAR(255),
    source_document VARCHAR(255),
    source_page INTEGER
)
"""


def ensure_table():
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(CREATE_SQL)
        connection.commit()
    finally:
        cursor.close()
        connection.close()


def save_parameters(rows):
    """Replaces previously stored rows of the same well + document."""
    if not rows:
        return 0

    ensure_table()

    p = PLACEHOLDER
    connection = get_connection()
    cursor = connection.cursor()

    try:
        for well_key, document in {
            (r["well_key"], r["source_document"]) for r in rows
        }:
            cursor.execute(
                f"DELETE FROM drilling_parameters "
                f"WHERE well_key = {p} AND source_document = {p}",
                (well_key, document),
            )

        cursor.executemany(
            f"INSERT INTO drilling_parameters "
            f"(well_key, well_id, depth_m, parameter, value, "
            f"original_text, source_document, source_page) "
            f"VALUES ({p},{p},{p},{p},{p},{p},{p},{p})",
            [
                (
                    r["well_key"], r["well_id"], r["depth_m"], r["parameter"],
                    r["value"], r["original_text"], r["source_document"],
                    r["source_page"],
                )
                for r in rows
            ],
        )
        connection.commit()
    finally:
        cursor.close()
        connection.close()

    return len(rows)


def load_parameters(well_id):
    """All stored parameter rows for a well. Empty list on any problem."""
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            f"SELECT depth_m, parameter, value, source_document, source_page "
            f"FROM drilling_parameters WHERE well_key = {PLACEHOLDER}",
            (key_of(well_id),),
        )
        return [
            {
                "depth_m": float(r[0]),
                "parameter": r[1],
                "value": float(r[2]),
                "document": r[3],
                "page": r[4],
            }
            for r in cursor.fetchall()
        ]
    except Exception as e:
        print("Could not read drilling_parameters:", e)
        return []
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def nearest_parameters(rows, depth_m, max_gap_m=150.0):
    """parameter -> closest row (with 'gap') within max_gap_m of depth_m."""
    best = {}
    for row in rows:
        gap = abs(row["depth_m"] - float(depth_m))
        if gap > max_gap_m:
            continue
        current = best.get(row["parameter"])
        if current is None or gap < current["gap"]:
            best[row["parameter"]] = {**row, "gap": gap}
    return best