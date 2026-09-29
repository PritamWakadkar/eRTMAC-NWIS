import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import {
  RiMapPinRangeLine,
  RiSearchLine,
  RiCloseLine,
  RiFocus3Line,
  RiArrowRightLine,
  RiAlertLine,
} from "@remixicon/react";
import "leaflet/dist/leaflet.css";

const API_URL =
  import.meta.env.VITE_API_URL || "https://ertmac-nwis-4d1y.onrender.com";

const BLANK =
  /^\s*$|not\s+(specified|available|found|recorded)|unknown|^n\/?a$/i;

const formationLabel = (formation) =>
  !formation || BLANK.test(formation) ? "Formation not recorded" : formation;

const ACCENT = "#2563eb";
const ACCENT_SELECTED = "#dc2626";

/* Fits the map to all wells once, and flies to a well picked from the list. */
function MapController({ wells, selectedId, markerRefs, resetTrigger }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (wells.length === 0) return;
    if (!fitted.current) {
      fitted.current = true;
      if (wells.length === 1) {
        map.setView([wells[0].latitude, wells[0].longitude], 12);
      } else {
        map.fitBounds(
          wells.map((w) => [w.latitude, w.longitude]),
          { padding: [50, 50] }
        );
      }
    }
  }, [wells, map]);

  useEffect(() => {
    if (!resetTrigger || wells.length === 0) return;
    if (wells.length === 1) {
      map.setView([wells[0].latitude, wells[0].longitude], 12);
    } else {
      map.fitBounds(
        wells.map((w) => [w.latitude, w.longitude]),
        { padding: [50, 50] }
      );
    }
  }, [resetTrigger, wells, map]);

  useEffect(() => {
    if (!selectedId) return;
    const well = wells.find((w) => w.well_id === selectedId);
    if (!well) return;

    map.flyTo([well.latitude, well.longitude], Math.max(map.getZoom(), 12), {
      duration: 0.6,
    });

    const timer = setTimeout(() => {
      markerRefs.current[selectedId]?.openPopup();
    }, 650);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return null;
}

export default function WellMap() {
  const [wells, setWells] = useState([]);
  const [unmapped, setUnmapped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const markerRefs = useRef({});

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/api/well-map`)
      .then((response) => {
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setWells(data.wells || []);
        setUnmapped(data.wells_without_coordinates || []);
      })
      .catch((err) => !cancelled && setError(err.message))
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
        formationLabel(w.formation).toLowerCase().includes(q)
    );
  }, [wells, query]);

  const handleResetView = () => {
    setSelectedId(null);
    setQuery("");
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] flex flex-col gap-6">

        {/* ==================================================
            WELL MAP NAVBAR
        ================================================== */}
        <header className="rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-[#000] p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            {/* Title & Stats */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <RiMapPinRangeLine className="h-6 w-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Well Map
                  </h1>
                
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  {loading ? (
                    <span className="flex items-center gap-2 text-slate-400">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                      Loading wells from database…
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold text-white">
                        {wells.length} {wells.length === 1 ? "well" : "wells"} on the map
                      </span>
                      {query && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-blue-300">
                            {visibleWells.length} match filter
                          </span>
                        </>
                      )}
                      {unmapped.length > 0 && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-amber-400/90 font-medium">
                            {unmapped.length} without coordinates
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Controls & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 sm:w-80 sm:flex-none">
                <RiSearchLine className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by well or formation..."
                  aria-label="Search wells"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-9 text-xs font-medium text-white placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    aria-label="Clear search"
                  >
                    <RiCloseLine className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Reset View Button */}
              {wells.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetView}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white shrink-0"
                  title="Reset map view"
                >
                  <RiFocus3Line className="h-4 w-4 text-blue-400" />
                  <span className="hidden sm:inline">Reset View</span>
                </button>
              )}

              {/* Quick Link to Well Analysis */}
              <Link
                to="/analysis"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#172033] shadow-sm transition hover:bg-slate-100 shrink-0"
              >
                <RiSearchLine className="h-3.5 w-3.5" />
                <span>Well Analysis</span>
                <RiArrowRightLine className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800"
          >
            <RiAlertLine className="h-5 w-5 shrink-0 text-rose-600" />
            <div>
              Could not load wells: {error}. Check that the backend is running at{" "}
              <code className="font-semibold text-rose-900">{API_URL}</code>.
            </div>
          </div>
        )}

        {/* ==================================================
            MAP & WELL DIRECTORY
        ================================================== */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-230px)] min-h-[520px]">

          {/* Interactive Map */}
          <div className="flex-1 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[380px] relative">
            <MapContainer
              center={[26.5, 94.5]}
              zoom={7}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                wells={wells}
                selectedId={selectedId}
                markerRefs={markerRefs}
                resetTrigger={resetTrigger}
              />

              {visibleWells.map((well) => {
                const selected = well.well_id === selectedId;
                return (
                  <CircleMarker
                    key={well.well_id}
                    center={[well.latitude, well.longitude]}
                    radius={selected ? 11 : 8}
                    pathOptions={{
                      color: "#ffffff",
                      weight: 2,
                      fillColor: selected ? ACCENT_SELECTED : ACCENT,
                      fillOpacity: 0.95,
                    }}
                    ref={(ref) => {
                      if (ref) markerRefs.current[well.well_id] = ref;
                    }}
                    eventHandlers={{ click: () => setSelectedId(well.well_id) }}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <strong className="text-sm font-extrabold text-slate-900">
                          {well.well_id}
                        </strong>
                        <div className="text-slate-600 mt-1">
                          {formationLabel(well.formation)}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {well.total_depth_m != null
                            ? `Total depth: ${well.total_depth_m} m`
                            : "Total depth not recorded"}
                        </div>
                        <div className="text-slate-400 text-[10px] mt-1 font-mono">
                          {well.latitude.toFixed(4)}°N, {well.longitude.toFixed(4)}°E
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {/* Sidebar Well Directory */}
          <aside
            className="w-full lg:w-80 shrink-0 flex flex-col rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm p-4 overflow-hidden"
            aria-label="Wells"
          >
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Directory ({visibleWells.length})
              </span>
              {selectedId && (
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Wells list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {visibleWells.length === 0 && !loading && !error && (
                <p className="p-4 text-center text-xs text-slate-400">
                  {query.trim()
                    ? `No wells match “${query}”.`
                    : "No wells with coordinates yet."}
                </p>
              )}

              {visibleWells.map((well) => {
                const selected = well.well_id === selectedId;
                return (
                  <button
                    key={well.well_id}
                    type="button"
                    onClick={() => setSelectedId(well.well_id)}
                    className={`w-full rounded-xl p-3 text-left transition border ${
                      selected
                        ? "border-blue-300 bg-blue-50/80 shadow-xs"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-extrabold ${
                          selected ? "text-blue-700" : "text-slate-800"
                        }`}
                      >
                        {well.well_id}
                      </span>
                      {selected && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="truncate">{formationLabel(well.formation)}</span>
                      {well.total_depth_m != null && (
                        <span className="text-slate-400">• {well.total_depth_m} m</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Unmapped wells */}
            {unmapped.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="mb-1 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Not mapped ({unmapped.length})
                </div>
                <div className="max-h-24 overflow-y-auto text-[11px] text-slate-400 space-y-1">
                  {unmapped.map((well) => (
                    <div key={well.well_id} className="truncate">
                      {well.well_id} — no coordinates
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

        </div>

      </div>
    </div>
  );
}