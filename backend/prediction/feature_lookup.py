from .dataset import load_dataset


class FeatureLookup:

    def __init__(self):
        self.dataframe = load_dataset()

    def get_features(self, well_id, depth_m):
        """
        Find the training-data record closest to the
        requested well and depth.
        """

        well_id = well_id.upper().strip()

        well_data = self.dataframe[
            self.dataframe["well_id"].str.upper() == well_id
        ]

        if well_data.empty:
            raise ValueError(
                f"No drilling data found for well {well_id}."
            )

        # Calculate absolute difference between
        # requested depth and available depths.
        well_data = well_data.copy()

        well_data["depth_difference"] = (
            well_data["depth_m"] - float(depth_m)
        ).abs()

        # Select the closest depth record.
        closest_row = well_data.loc[
            well_data["depth_difference"].idxmin()
        ]

        return {
            "well_id": well_id,
            "depth_m": float(closest_row["depth_m"]),
            "requested_depth_m": float(depth_m),
            "depth_difference_m": float(
                closest_row["depth_difference"]
            ),
            "rop_m_hr": float(closest_row["rop_m_hr"]),
            "mud_weight_sg": float(
                closest_row["mud_weight_sg"]
            ),
            "torque_knm": float(
                closest_row["torque_knm"]
            ),
            "ecd_sg": float(closest_row["ecd_sg"]),
            "pump_rate_l_min": float(
                closest_row["pump_rate_l_min"]
            ),
            "distance_km": float(
                closest_row["distance_km"]
            ),
            "source_event": closest_row["event"]
        }


if __name__ == "__main__":

    lookup = FeatureLookup()

    result = lookup.get_features(
        well_id="W105",
        depth_m=2600
    )

    print("\nFeature lookup result:")

    for key, value in result.items():
        print(f"{key}: {value}")