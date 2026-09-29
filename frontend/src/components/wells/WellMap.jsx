import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = import.meta.env.VITE_API_URL || "https://ertmac-nwis-4d1y.onrender.com";

const BLANK = /^\s*$|not\s+(specified|available|found|recorded)|unknown|^n\/?a$/i;

const formationLabel = (formation) =>
  !formation || BLANK.test(formation) ? "Formation not recorded" : formation;

const ACCENT = "#2563eb";
const ACCENT_SELECTED = "#dc2626";

/* Fits the map to all wells once, and flies to a well picked from the list. */
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
        { padding: [40, 40] }
      );
    }
  }, [wells, map]);

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

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Well Map</h1>
          <p style={styles.subtitle}>
            {loading
              ? "Loading wells…"
              : `${wells.length} ${wells.length === 1 ? "well" : "wells"} on the map` +
                (unmapped.length ? `, ${unmapped.length} without coordinates` : "")}
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by well or formation"
          aria-label="Search wells"
          style={styles.search}
        />
      </header>

      {error && (
        <div role="alert" style={styles.error}>
          Could not load wells: {error}. Check that the backend is running at{" "}
          {API_URL} and that <code>/api/well-map</code> is registered.
        </div>
      )}

      <div style={styles.body}>
        <div style={styles.mapCard}>
          <MapContainer
            center={[26.5, 94.5]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController
              wells={wells}
              selectedId={selectedId}
              markerRefs={markerRefs}
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
                    <strong>{well.well_id}</strong>
                    <br />
                    {formationLabel(well.formation)}
                    <br />
                    {well.total_depth_m != null
                      ? `Total depth: ${well.total_depth_m} m`
                      : "Total depth not recorded"}
                    <br />
                    {well.latitude.toFixed(4)}°N, {well.longitude.toFixed(4)}°E
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <aside style={styles.list} aria-label="Wells">
          {visibleWells.length === 0 && !loading && !error && (
            <p style={styles.empty}>
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
                style={{
                  ...styles.row,
                  ...(selected ? styles.rowSelected : null),
                }}
              >
                <span style={styles.rowId}>{well.well_id}</span>
                <span style={styles.rowMeta}>
                  {formationLabel(well.formation)}
                  {well.total_depth_m != null && ` · ${well.total_depth_m} m`}
                </span>
              </button>
            );
          })}

          {unmapped.length > 0 && (
            <div style={styles.unmapped}>
              <div style={styles.unmappedTitle}>Not shown on the map</div>
              {unmapped.map((well) => (
                <div key={well.well_id} style={styles.unmappedRow}>
                  {well.well_id} — no valid coordinates
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    height: "100%",
    minHeight: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: "#0f172a" },
  subtitle: { margin: "4px 0 0", fontSize: 14, color: "#64748b" },
  search: {
    width: 280,
    maxWidth: "100%",
    padding: "10px 14px",
    fontSize: 14,
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#ffffff",
    color: "#0f172a",
    outlineColor: ACCENT,
  },
  error: {
    padding: "12px 16px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    borderRadius: 12,
    fontSize: 14,
  },
  body: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    height: "calc(100vh - 190px)",
    minHeight: 480,
  },
  mapCard: {
    flex: "1 1 520px",
    minHeight: 360,
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    background: "#f1f5f9",
  },
  list: {
    flex: "0 0 300px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto",
    padding: 8,
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    background: "#ffffff",
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "10px 12px",
    textAlign: "left",
    border: "1px solid transparent",
    borderRadius: 12,
    background: "transparent",
    cursor: "pointer",
    font: "inherit",
  },
  rowSelected: { background: "#eff6ff", borderColor: "#bfdbfe" },
  rowId: { fontWeight: 700, fontSize: 15, color: "#0f172a" },
  rowMeta: { fontSize: 13, color: "#64748b" },
  empty: { margin: 12, fontSize: 14, color: "#64748b" },
  unmapped: {
    marginTop: 8,
    padding: 12,
    borderTop: "1px solid #e2e8f0",
    fontSize: 13,
    color: "#64748b",
  },
  unmappedTitle: { fontWeight: 600, marginBottom: 4, color: "#334155" },
  unmappedRow: { padding: "2px 0" },
};