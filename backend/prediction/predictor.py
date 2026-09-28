import pandas as pd

from .model import DrillingEventModel
from .feature_lookup import FeatureLookup
from .event_source import EventSource, key_of, haversine_km
from .event_features import PARAM_COLUMNS, compute_features


class DrillingEventPredictor:

    DEFAULT_WINDOW_M = 200.0
    DEFAULT_RADIUS_KM = 10.0
    OWN_WELL_STRENGTH = 0.90
    OFFSET_WELL_STRENGTH = 0.60

    def __init__(self, rag=None):
        """
        rag: optional NearbyWellRAG instance to reuse (pass nlp_engine.rag).
        """

        self.model = DrillingEventModel()
        self.model.load()

        try:
            self.feature_lookup = FeatureLookup()
        except Exception as e:
            print("FeatureLookup unavailable:", e)
            self.feature_lookup = None

        self.source = EventSource(rag=rag)

    def reload_model(self):
        """Call after retraining so the new model is used without restart."""
        return self.model.load()

    # ==========================================================
    # MAIN ENTRY
    # ==========================================================

    def predict_well(self, well_id, depth_m):
        """
        1. Always compute event-based evidence from PDF-derived events.
        2. If a validated ML model exists, also run it.
        The ML result is the primary output when available; the event
        evidence is always attached.
        """

        depth_m = float(depth_m)

        snapshot = self.source.snapshot(extra_well_ids=[well_id])

        event_result = self.predict_from_events(
            well_id, depth_m, snapshot=snapshot
        )

        ml_result = self._predict_ml(well_id, depth_m, snapshot)

        lookup = self._lookup(well_id, depth_m)

        if ml_result is None and event_result is not None:
            self._attach_parameters(event_result, lookup)

        if ml_result is None and event_result is None:
            raise ValueError(
                f"No drilling data or historical events found "
                f"for well {well_id}."
            )

        if ml_result is None:
            return event_result

        if event_result is not None:
            ml_result["event_predictions"] = event_result["predictions"]
            ml_result["evidence"] = event_result["evidence"]
            ml_result["note"] = event_result["note"]
        else:
            ml_result["event_predictions"] = []
            ml_result["evidence"] = []

        return ml_result

    # ==========================================================
    # PARAMETER LOOKUP HELPERS
    # ==========================================================

    def _lookup(self, well_id, depth_m):
        if self.feature_lookup is None:
            return None
        try:
            return self.feature_lookup.get_features(
                well_id=well_id, depth_m=depth_m
            )
        except ValueError:
            return None

    @staticmethod
    def _attach_parameters(result, found):
        """Show recorded parameters on an event-based result."""
        if not found:
            return

        features = {c: found.get(c) for c in PARAM_COLUMNS}
        features["depth_m"] = found.get("depth_m")
        features["distance_km"] = found.get("distance_km")

        result["features"] = features
        result["parameter_sources"] = found.get("sources", {})
        result["parameter_source"] = found.get("source")

    # ==========================================================
    # ML PATH
    # ==========================================================

    def _predict_ml(self, well_id, depth_m, snapshot):

        if not self.model.is_ready:
            return None

        params = {}
        used_depth = depth_m
        depth_difference = 0.0
        distance_km = None

        if self.feature_lookup is not None:
            try:
                found = self.feature_lookup.get_features(
                    well_id=well_id, depth_m=depth_m
                )
                params = {c: found[c] for c in PARAM_COLUMNS}
                used_depth = found["depth_m"]
                depth_difference = found["depth_difference_m"]
                distance_km = found["distance_km"]
            except ValueError:
                pass  # well has no parameter rows; PDF-only features

        row = {"depth_m": depth_m}
        for column in PARAM_COLUMNS:
            row[column] = params.get(column)

        row.update(
            compute_features(
                snapshot,
                key_of(well_id),
                depth_m,
                self.model.feature_event_types,
            )
        )

        data = pd.DataFrame([row]).apply(pd.to_numeric, errors="coerce")

        probabilities = self.model.predict_probabilities(data)[0]

        if not probabilities:
            return None

        predictions = sorted(
            (
                {"event": event, "probability": round(p, 4)}
                for event, p in probabilities.items()
            ),
            key=lambda item: item["probability"],
            reverse=True,
        )

        display_id = snapshot.display.get(
            key_of(well_id), str(well_id).upper().strip()
        )

        return {
            "method": "ml_model",
            "model_version": self.model.version,
            "well_id": display_id,
            "requested_depth_m": depth_m,
            "used_depth_m": used_depth,
            "depth_difference_m": depth_difference,
            "features": {
                "rop_m_hr": params.get("rop_m_hr"),
                "mud_weight_sg": params.get("mud_weight_sg"),
                "torque_knm": params.get("torque_knm"),
                "ecd_sg": params.get("ecd_sg"),
                "pump_rate_l_min": params.get("pump_rate_l_min"),
                "distance_km": distance_km,
            },
            "predictions": predictions,
            "disclaimer": (
                "Uncalibrated model trained on a small set of historical "
                "reports. Human review required."
            ),
        }

    # ==========================================================
    # EVENT-BASED PATH
    # ==========================================================

    def predict_from_events(
        self,
        well_id,
        depth_m,
        depth_window_m=None,
        radius_km=None,
        snapshot=None,
    ):
        """
        Evidence = 1 - product(1 - contribution) over historical events near
        the depth, in this well and in offset wells. NOT calibrated
        probabilities. Returns None when no events exist at all.
        """

        depth_m = float(depth_m)
        window = float(depth_window_m or self.DEFAULT_WINDOW_M)
        radius = float(radius_km or self.DEFAULT_RADIUS_KM)

        snap = snapshot or self.source.snapshot(extra_well_ids=[well_id])

        target_key = key_of(well_id)
        display_id = snap.display.get(
            target_key, str(well_id).upper().strip()
        )
        t_lat, t_lon = snap.coords.get(target_key, (None, None))

        candidates = [(target_key, 0.0, True)]

        if t_lat is not None and t_lon is not None:
            for other_key, (lat, lon) in snap.coords.items():
                if other_key == target_key or lat is None or lon is None:
                    continue
                distance = haversine_km(t_lat, t_lon, lat, lon)
                if distance <= radius:
                    candidates.append((other_key, distance, False))

        remaining = {}
        evidence = []
        event_types_seen = set()
        total_events = 0

        for candidate_key, distance, is_own in candidates:
            for event_type, event_depth, event in snap.events.get(
                candidate_key, []
            ):
                total_events += 1
                event_types_seen.add(event_type)

                if event_depth is None:
                    continue

                difference = abs(event_depth - depth_m)
                if difference > window:
                    continue

                depth_factor = 1.0 - difference / window

                if is_own:
                    strength = self.OWN_WELL_STRENGTH
                    distance_factor = 1.0
                else:
                    strength = self.OFFSET_WELL_STRENGTH
                    distance_factor = max(0.1, 1.0 - distance / radius)

                contribution = strength * depth_factor * distance_factor

                remaining[event_type] = (
                    remaining.get(event_type, 1.0) * (1.0 - contribution)
                )

                evidence.append({
                    "well_id": snap.display.get(candidate_key, candidate_key),
                    "event": event_type,
                    "event_depth_m": event_depth,
                    "depth_difference_m": round(difference, 1),
                    "distance_km": round(distance, 2),
                    "measurement": event.get("measurement"),
                    "document": (
                        event.get("document") or event.get("source_document")
                    ),
                    "page": event.get("page") or event.get("source_page"),
                })

        if total_events == 0:
            return None

        predictions = sorted(
            (
                {
                    "event": event_type,
                    "probability": round(
                        1.0 - remaining.get(event_type, 1.0), 4
                    ),
                }
                for event_type in event_types_seen
            ),
            key=lambda item: item["probability"],
            reverse=True,
        )

        evidence.sort(key=lambda item: item["depth_difference_m"])

        if evidence:
            note = (
                f"Risk for {display_id} is estimated from {len(evidence)} "
                f"historical event{'s' if len(evidence) != 1 else ''} within "
                f"±{window:g} m of {depth_m:g} m in this well and offset "
                f"wells within {radius:g} km."
            )
        else:
            note = (
                f"No historical events lie within ±{window:g} m of "
                f"{depth_m:g} m for {display_id} or its offset wells."
            )

        return {
            "method": "event_based",
            "well_id": display_id,
            "requested_depth_m": depth_m,
            "used_depth_m": depth_m,
            "depth_difference_m": 0.0,
            "features": {
                "rop_m_hr": None,
                "mud_weight_sg": None,
                "torque_knm": None,
                "ecd_sg": None,
                "pump_rate_l_min": None,
                "distance_km": None,
            },
            "predictions": predictions,
            "evidence": evidence,
            "depth_window_m": window,
            "radius_km": radius,
            "note": note,
            "disclaimer": (
                "Event-based scores from historical reports, not calibrated "
                "model probabilities. Human review required."
            ),
        }


if __name__ == "__main__":

    predictor = DrillingEventPredictor()
    result = predictor.predict_well(well_id="W105", depth_m=2600)

    print(f"Method: {result['method']}")
    print(f"Well: {result['well_id']}  Depth: {result['requested_depth_m']} m")
    for item in result["predictions"]:
        print(f"{item['event']:20} -> {item['probability']:.4f}")