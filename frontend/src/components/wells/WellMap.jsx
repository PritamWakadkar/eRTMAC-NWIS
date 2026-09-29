import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  RiMapPinLine,
  RiSearchLine,
  RiCompass3Line,
} from "@remixicon/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* Fits map bounds cleanly */
function MapController({ wells, selectedId, markerRefs }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || wells.length === 0) return;
    fitted.current = true;

    if (wells.length === 1) {
      map.setView([wells[0].latitude, wells[0].longitude], 12);
    } else {
      map.fitBounds(
        wells.map((w) => [w.latitude, w.longitude]),
        { padding: [50, 50] }
      );
    }
  }, [wells, map]);

  useEffect(() => {
    if (!selectedId) return;
    const well = wells.find((w) => w.well_id === selectedId);
    if (!well) return;

    map.flyTo([well.latitude, well.longitude], 12, { duration: 0.8 });

    const timer = setTimeout(() => {
      markerRefs.current[selectedId]?.openPopup();
    }, 850);

    return () => clearTimeout(timer);
  }, [selectedId, wells, map, markerRefs]);

  return null;
}

export default function WellMap() {
  const [wells, setWells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/api/well-map`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setWells(data.wells || []);
      })
      .catch(() => {
        if (cancelled) return;
        // Mock fallback wells for display
        setWells([
          { well_id: "W-101", latitude: 26.8467, longitude: 94.2389, formation: "Barail Sandstone", total_depth_m: 2450 },
          { well_id: "W-102", latitude: 26.7500, longitude: 94.1500, formation: "Tipam Group", total_depth_m: 1890 },
          { well_id: "W-103", latitude: 26.9100, longitude: 94.3200, formation: "Kopili Shale", total_depth_m: 3100 },
          { well_id: "W-104", latitude: 26.6800, longitude: 94.4100, formation: "Girujan Clay", total_depth_m: 2150 }
        ]);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleWells = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wells;
    return wells.filter(
      (w) =>
        w.well_id.toLowerCase().includes(q) ||
        (w.formation && w.formation.toLowerCase().includes(q))
    );
  }, [wells, query]);

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-50 min-h-[calc(100vh-64px)]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <RiCompass3Line className="h-6 w-6 text-blue-600" />
            Interactive Well Map
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Click on any marker on the map or select a well from the list to view details.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search well name (e.g. W-101)..."
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
        {/* Map */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <MapContainer
            center={[26.8, 94.2]}
            zoom={8}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController
              wells={wells}
              selectedId={selectedId}
              markerRefs={markerRefs}
            />

            {visibleWells.map((well) => {
              const isSelected = well.well_id === selectedId;
              return (
                <CircleMarker
                  key={well.well_id}
                  center={[well.latitude, well.longitude]}
                  radius={isSelected ? 11 : 8}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: isSelected ? "#ef4444" : "#2563eb",
                    fillOpacity: 0.9,
                  }}
                  ref={(ref) => {
                    if (ref) markerRefs.current[well.well_id] = ref;
                  }}
                  eventHandlers={{ click: () => setSelectedId(well.well_id) }}
                >
                  <Popup>
                    <div className="p-2 text-xs font-sans text-slate-900">
                      <strong className="text-sm text-blue-600">{well.well_id}</strong>
                      <p className="mt-1"><strong>Formation:</strong> {well.formation || "Not specified"}</p>
                      <p><strong>Depth:</strong> {well.total_depth_m ? `${well.total_depth_m} meters` : "N/A"}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Simple List */}
        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl p-4 overflow-hidden shadow-sm">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 pb-2 border-b border-slate-100">
            Wells List ({visibleWells.length})
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading && <p className="text-xs text-slate-400">Loading list...</p>}
            {visibleWells.map((well) => {
              const isSelected = well.well_id === selectedId;
              return (
                <button
                  key={well.well_id}
                  onClick={() => setSelectedId(well.well_id)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    isSelected
                      ? "bg-blue-50 border-blue-500 text-blue-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1.5">
                      <RiMapPinLine className="h-4 w-4 text-blue-500" />
                      {well.well_id}
                    </span>
                    {well.total_depth_m && (
                      <span className="text-[11px] text-slate-500">
                        {well.total_depth_m}m
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}