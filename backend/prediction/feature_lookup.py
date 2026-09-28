from .dataset import load_dataset
from .event_features import PARAM_COLUMNS
from .event_source import EventSource, haversine_km, key_of
from .parameter_store import load_parameters, nearest_parameters


class FeatureLookup:
    """
    1. Parameters extracted from uploaded reports (drilling_parameters table)
    2. Otherwise the synthetic table (W104, W105, W106)
    Raises ValueError when neither has data for the well.
    """

    MAX_GAP_M = 150.0

    def __init__(self):
        self.dataframe = load_dataset()

    # ------------------------------------------------------
    # MAIN
    # ------------------------------------------------------

    def get_features(self, well_id, depth_m):

        from_reports = self._from_reports(well_id, depth_m)

        if from_reports is not None:
            return from_reports

        return self._from_synthetic(well_id, depth_m)

    # ------------------------------------------------------
    # REPORTS
    # ------------------------------------------------------

    def _from_reports(self, well_id, depth_m):

        rows = load_parameters(well_id)

        if not rows:
            return None

        found = nearest_parameters(rows, depth_m, self.MAX_GAP_M)

        if not found:
            return None

        closest = min(found.values(), key=lambda item: item["gap"])

        result = {
            "well_id": str(well_id).upper().strip(),
            "depth_m": closest["depth_m"],
            "requested_depth_m": float(depth_m),
            "depth_difference_m": closest["gap"],
            "distance_km": self._nearest_offset_km(well_id),
            "source": "reports",
            "sources": {},
        }

        for column in PARAM_COLUMNS:
            item = found.get(column)
            result[column] = item["value"] if item else None
            if item:
                result["sources"][column] = {
                    "depth_m": item["depth_m"],
                    "document": item["document"],
                    "page": item["page"],
                }

        return result

    def _nearest_offset_km(self, well_id):
        """Distance to the closest other well (None if coordinates unknown)."""
        try:
            wells = EventSource()._load_wells()
        except Exception:
            return None

        key = key_of(well_id)
        target = next((w for w in wells if key_of(w[0]) == key), None)

        if not target or target[1] is None or target[2] is None:
            return None

        distances = [
            haversine_km(target[1], target[2], lat, lon)
            for other_id, lat, lon in wells
            if key_of(other_id) != key and lat is not None and lon is not None
        ]

        return round(min(distances), 2) if distances else None

    # ------------------------------------------------------
    # SYNTHETIC FALLBACK
    # ------------------------------------------------------

    def _from_synthetic(self, well_id, depth_m):

        well_id = str(well_id).upper().strip()

        well_data = self.dataframe[
            self.dataframe["well_id"].str.upper() == well_id
        ]

        if well_data.empty:
            raise ValueError(
                f"No drilling data found for well {well_id}."
            )

        well_data = well_data.copy()

        well_data["depth_difference"] = (
            well_data["depth_m"] - float(depth_m)
        ).abs()

        closest_row = well_data.loc[
            well_data["depth_difference"].idxmin()
        ]

        return {
            "well_id": well_id,
            "depth_m": float(closest_row["depth_m"]),
            "requested_depth_m": float(depth_m),
            "depth_difference_m": float(closest_row["depth_difference"]),
            "rop_m_hr": float(closest_row["rop_m_hr"]),
            "mud_weight_sg": float(closest_row["mud_weight_sg"]),
            "torque_knm": float(closest_row["torque_knm"]),
            "ecd_sg": float(closest_row["ecd_sg"]),
            "pump_rate_l_min": float(closest_row["pump_rate_l_min"]),
            "distance_km": float(closest_row["distance_km"]),
            "source_event": closest_row["event"],
            "source": "synthetic",
            "sources": {},
        }


if __name__ == "__main__":

    lookup = FeatureLookup()

    result = lookup.get_features(well_id="W105", depth_m=2600)

    print("\nFeature lookup result:")

    for key, value in result.items():
        print(f"{key}: {value}")