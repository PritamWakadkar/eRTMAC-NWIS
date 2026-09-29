import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  RiDatabase2Line,
  RiRefreshLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiFilter3Line,
} from "@remixicon/react";
import "leaflet/dist/leaflet.css";

import {
  NORTHEAST_SAMPLE_WELLS,
  NORTHEAST_UNMAPPED_SAMPLE,
} from "./northeastWells";
import SpecularButton from "../common/SpecularButton";

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
  const navigate = useNavigate();

  // Pre-populated with authentic Northeast India wells (Assam-Arakan basin)
  const [wells, setWells] = useState(NORTHEAST_SAMPLE_WELLS);
  const [unmapped, setUnmapped] = useState(NORTHEAST_UNMAPPED_SAMPLE);
  const [loading, setLoading] = useState(false);
  const [backendSync, setBackendSync] = useState("local"); // 'local' | 'synced' | 'connecting'
  const [query, setQuery] = useState("");
  const [selectedField, setSelectedField] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const markerRefs = useRef({});

  // Fetch backend wells if available, merge or supplement
  const loadBackendWells = () => {
    setBackendSync("connecting");
    let cancelled = false;

    fetch(`${API_URL}/api/well-map`)
      .then((response) => {
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const remoteWells = data.wells || [];
        const remoteUnmapped = data.wells_without_coordinates || [];

        if (remoteWells.length > 0) {
          // Merge remote wells with local Northeast dataset by well_id
          const mergedMap = new Map();
          NORTHEAST_SAMPLE_WELLS.forEach((w) => mergedMap.set(w.well_id, w));
          remoteWells.forEach((w) => mergedMap.set(w.well_id, { ...mergedMap.get(w.well_id), ...w }));
          setWells(Array.from(mergedMap.values()));
          if (remoteUnmapped.length > 0) setUnmapped(remoteUnmapped);
          setBackendSync("synced");
        } else {
          setBackendSync("local");
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Gracefully maintain local Northeast wells
          setBackendSync("local");
        }
      });

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    const cleanup = loadBackendWells();
    return cleanup;
  }, []);

  // Distinct field names for quick filtering
  const fields = useMemo(() => {
    const list = new Set();
    wells.forEach((w) => {
      if (w.field) list.add(w.field);
    });
    return ["all", ...Array.from(list).sort()];
  }, [wells]);

  const visibleWells = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wells.filter((w) => {
      if (selectedField !== "all" && w.field !== selectedField) {
        return false;
      }
      if (!q) return true;
      return (
        w.well_id.toLowerCase().includes(q) ||
        (w.name && w.name.toLowerCase().includes(q)) ||
        (w.field && w.field.toLowerCase().includes(q)) ||
        (w.district && w.district.toLowerCase().includes(q)) ||
        formationLabel(w.formation).toLowerCase().includes(q)
      );
    });
  }, [wells, query, selectedField]);

  const handleResetView = () => {
    setSelectedId(null);
    setQuery("");
    setSelectedField("all");
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
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Northeast India (Upper Assam Basin)
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="font-semibold text-white">
                    {wells.length} wells in Northeast region
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-medium">
                    {visibleWells.length} on display
                  </span>
                  {selectedField !== "all" && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-blue-300">Field: {selectedField}</span>
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
                  placeholder="Search well, field or formation..."
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
              <SpecularButton
                type="button"
                onClick={handleResetView}
                size="sm"
                radius={12}
                tint="#0f172a"
                tintOpacity={0.9}
                textColor="#e2e8f0"
                lineColor="#38bdf8"
                baseColor="#334155"
                intensity={1.2}
                className="border border-slate-700 font-bold shrink-0"
                title="Reset map to Northeast India region"
              >
                <RiFocus3Line className="h-4 w-4 text-blue-400" />
                <span className="hidden sm:inline">Reset View</span>
              </SpecularButton>

              {/* Quick Link to Well Analysis */}
              <SpecularButton
                size="sm"
                radius={12}
                tint="#ffffff"
                tintOpacity={1}
                textColor="#172033"
                lineColor="#38bdf8"
                baseColor="#cbd5e1"
                intensity={1.2}
                onClick={() => navigate("/analysis")}
                className="font-extrabold shadow-sm shrink-0"
              >
                <RiSearchLine className="h-3.5 w-3.5" />
                <span>Well Analysis</span>
                <RiArrowRightLine className="h-3.5 w-3.5" />
              </SpecularButton>
            </div>

          </div>
        </header>

        {/* Region & Field Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            <RiFilter3Line className="h-3.5 w-3.5" />
            Field Filter:
          </span>
          {fields.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedField(f)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition whitespace-nowrap ${
                selectedField === f
                  ? "bg-[#172033] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {f === "all" ? `All Northeast Fields (${wells.length})` : f}
            </button>
          ))}
        </div>

        {/* ==================================================
            MAP & WELL DIRECTORY
        ================================================== */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-260px)] min-h-[540px]">

          {/* Interactive Map */}
          <div className="flex-1 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[380px] relative">
            <MapContainer
              center={[27.25, 95.20]}
              zoom={8}
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
                    radius={selected ? 12 : 8}
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
                      <div className="text-xs p-1 max-w-[240px]">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                          <strong className="text-sm font-extrabold text-[#172033]">
                            {well.well_id}
                          </strong>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-black text-blue-700">
                            {well.field || "Assam Shelf"}
                          </span>
                        </div>

                        <div className="mt-1.5 space-y-1 text-slate-600">
                          {well.name && (
                            <div className="font-semibold text-slate-800">
                              {well.name}
                            </div>
                          )}
                          <div>
                            <span className="text-slate-400">Formation:</span>{" "}
                            <span className="font-medium text-slate-700">
                              {formationLabel(well.formation)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Depth:</span>{" "}
                            <span className="font-medium text-slate-700">
                              {well.total_depth_m != null
                                ? `${well.total_depth_m} m MD`
                                : "Not recorded"}
                            </span>
                          </div>
                          {well.district && (
                            <div>
                              <span className="text-slate-400">Location:</span>{" "}
                              <span className="text-slate-700 font-medium">
                                {well.district}
                              </span>
                            </div>
                          )}
                          {well.operator && (
                            <div className="text-[10px] text-slate-500">
                              Operator: {well.operator}
                            </div>
                          )}
                          {well.notes && (
                            <div className="mt-1 rounded bg-slate-50 p-1.5 text-[10px] italic text-slate-600 border border-slate-100">
                              {well.notes}
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="font-mono text-[9px] text-slate-400">
                            {well.latitude.toFixed(4)}°N, {well.longitude.toFixed(4)}°E
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate("/analysis")}
                            className="inline-flex items-center gap-1 rounded bg-[#172033] px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-600 transition"
                          >
                            Analyze
                            <RiArrowRightLine className="h-3 w-3" />
                          </button>
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
            className="w-full lg:w-84 shrink-0 flex flex-col rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm p-4 overflow-hidden"
            aria-label="Wells Directory"
          >
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                  Northeast Wells ({visibleWells.length})
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  OIL &amp; ONGC Historical Dataset
                </p>
              </div>
              {selectedId && (
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Wells list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {visibleWells.length === 0 && (
                <p className="p-4 text-center text-xs text-slate-400">
                  {query.trim()
                    ? `No wells match “${query}”.`
                    : "No wells found for this field."}
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
                        ? "border-blue-300 bg-blue-50/90 shadow-xs ring-1 ring-blue-300"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-black ${
                          selected ? "text-blue-700" : "text-slate-800"
                        }`}
                      >
                        {well.well_id}
                      </span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                        {well.field || "Assam"}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate font-medium text-slate-700">
                        {formationLabel(well.formation)}
                      </span>
                      {well.total_depth_m != null && (
                        <span className="text-slate-400 shrink-0 font-mono text-[11px]">
                          {well.total_depth_m} m
                        </span>
                      )}
                    </div>

                    {well.district && (
                      <div className="mt-1 text-[10px] text-slate-400 truncate">
                        {well.district}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Unmapped wells */}
            {unmapped.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-2.5">
                <div className="mb-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Unmapped records ({unmapped.length})
                </div>
                <div className="max-h-20 overflow-y-auto text-[10px] text-slate-400 space-y-1">
                  {unmapped.map((well) => (
                    <div key={well.well_id} className="truncate">
                      {well.well_id} — {well.reason || "no valid coordinates"}
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