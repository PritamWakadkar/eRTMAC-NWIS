import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Circle,
    Polyline,
    useMap,
} from "react-leaflet";

import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";


/* =========================================================
   FIX DEFAULT LEAFLET MARKER ICONS
========================================================= */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


/* =========================================================
   TARGET WELL ICON
========================================================= */

const targetIcon = new L.Icon({
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

    shadowSize: [41, 41],
});


/* =========================================================
   NEARBY WELL ICON
========================================================= */

const nearbyIcon = new L.Icon({
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

    shadowSize: [41, 41],
});


/* =========================================================
   MAP UPDATER
========================================================= */

function MapUpdater({ target }) {
    const map = useMap();

    useEffect(() => {
        if (
            target?.latitude != null &&
            target?.longitude != null
        ) {
            const latitude = Number(target.latitude);
            const longitude = Number(target.longitude);

            if (
                Number.isFinite(latitude) &&
                Number.isFinite(longitude)
            ) {
                map.setView(
                    [latitude, longitude],
                    12
                );
            }
        }
    }, [
        map,
        target?.latitude,
        target?.longitude,
    ]);

    return null;
}


/* =========================================================
   WELL MAP
========================================================= */

function WellMap({
    targetWell,
    nearbyWells = [],
    radiusKm = 10,
}) {
    /* -----------------------------------------------------
       Validate target well
    ----------------------------------------------------- */

    if (
        !targetWell ||
        targetWell.latitude == null ||
        targetWell.longitude == null
    ) {
        return (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm font-medium text-red-500">
                    Location data for the target well is not available.
                </p>
            </div>
        );
    }


    /* -----------------------------------------------------
       Validate coordinates
    ----------------------------------------------------- */

    const targetLatitude = Number(targetWell.latitude);
    const targetLongitude = Number(targetWell.longitude);

    if (
        !Number.isFinite(targetLatitude) ||
        !Number.isFinite(targetLongitude)
    ) {
        return (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm font-medium text-red-500">
                    Invalid location coordinates for the target well.
                </p>
            </div>
        );
    }


    /* -----------------------------------------------------
       Normalize nearby wells
    ----------------------------------------------------- */

    const safeNearbyWells = Array.isArray(nearbyWells)
        ? nearbyWells
        : [];


    /* -----------------------------------------------------
       Target position
    ----------------------------------------------------- */

    const targetPosition = [
        targetLatitude,
        targetLongitude,
    ];


    /* -----------------------------------------------------
       Radius
    ----------------------------------------------------- */

    const safeRadiusKm =
        Number.isFinite(Number(radiusKm)) && Number(radiusKm) > 0
            ? Number(radiusKm)
            : 10;


    return (
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">

            {/* =================================================
                MAP HEADER
            ================================================== */}

            <div className="flex items-start justify-between gap-6 border-b border-slate-100 pb-5 max-sm:flex-col">

                <div>
                    <span className="text-[10px] font-extrabold tracking-[1.5px] text-blue-600">
                        POSTGIS LOCATION
                    </span>

                    <h2 className="mt-1.5 text-2xl font-extrabold text-[#172033]">
                        Nearby Wells Map
                    </h2>

                    <p className="mt-1.5 text-xs leading-6 text-slate-500">
                        Spatial relationship between the target
                        well and nearby wells.
                    </p>
                </div>


                {/* Map information */}

                <div className="flex shrink-0 flex-col items-end gap-2 text-xs text-slate-500 max-sm:w-full max-sm:items-start">

                    <span>
                        Target:{" "}
                        <strong className="font-extrabold text-slate-700">
                            {targetWell.well_id || "Unknown"}
                        </strong>
                    </span>

                    <span>
                        Radius:{" "}
                        <strong className="font-extrabold text-blue-600">
                            {safeRadiusKm} km
                        </strong>
                    </span>

                </div>

            </div>


            {/* =================================================
                MAP
            ================================================== */}

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">

                <MapContainer
                    center={targetPosition}
                    zoom={12}
                    scrollWheelZoom={true}
                    style={{
                        height: "500px",
                        width: "100%",
                    }}
                >

                    {/* OpenStreetMap */}

                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />


                    {/* Automatically center map */}

                    <MapUpdater
                        target={targetWell}
                    />


                    {/* Search radius */}

                    <Circle
                        center={targetPosition}
                        radius={safeRadiusKm * 1000}
                        pathOptions={{
                            fillOpacity: 0.08,
                        }}
                    />


                    {/* =================================================
                        TARGET WELL
                    ================================================== */}

                    <Marker
                        position={targetPosition}
                        icon={targetIcon}
                    >
                        <Popup>

                            <div className="min-w-[180px] p-1">

                                <h3 className="mb-2 text-base font-extrabold text-[#172033]">
                                    🎯 {targetWell.well_id || "Unknown Well"}
                                </h3>

                                <p className="text-xs leading-6 text-slate-600">
                                    <strong className="font-bold text-slate-800">
                                        Target Well
                                    </strong>
                                </p>


                                {targetWell.formation && (
                                    <p className="text-xs leading-6 text-slate-600">
                                        Formation:{" "}
                                        {targetWell.formation}
                                    </p>
                                )}


                                {targetWell.total_depth != null && (
                                    <p className="text-xs leading-6 text-slate-600">
                                        Total Depth:{" "}
                                        {targetWell.total_depth} m
                                    </p>
                                )}


                                <p className="text-xs leading-6 text-slate-600">
                                    Latitude:{" "}
                                    {targetLatitude}
                                </p>


                                <p className="text-xs leading-6 text-slate-600">
                                    Longitude:{" "}
                                    {targetLongitude}
                                </p>

                            </div>

                        </Popup>
                    </Marker>


                    {/* =================================================
                        NEARBY WELLS
                    ================================================== */}

                    {safeNearbyWells.map((well, index) => {

                        if (
                            !well ||
                            well.latitude == null ||
                            well.longitude == null
                        ) {
                            return null;
                        }


                        const latitude = Number(well.latitude);
                        const longitude = Number(well.longitude);


                        if (
                            !Number.isFinite(latitude) ||
                            !Number.isFinite(longitude)
                        ) {
                            return null;
                        }


                        const nearbyPosition = [
                            latitude,
                            longitude,
                        ];


                        const distance =
                            well.distance_km != null
                                ? Number(well.distance_km).toFixed(2)
                                : "N/A";


                        return (
                            <Marker
                                key={
                                    well.well_id ||
                                    `nearby-${index}`
                                }
                                position={nearbyPosition}
                                icon={nearbyIcon}
                            >

                                <Popup>

                                    <div className="min-w-[180px] p-1">

                                        <h3 className="mb-2 text-base font-extrabold text-[#172033]">
                                            🔵{" "}
                                            {well.well_id ||
                                                "Unknown Well"}
                                        </h3>


                                        <p className="text-xs leading-6 text-slate-600">
                                            <strong className="font-bold text-slate-800">
                                                Nearby Well
                                            </strong>
                                        </p>


                                        <p className="text-xs leading-6 text-slate-600">
                                            Distance:{" "}
                                            {distance} km
                                        </p>


                                        {well.formation && (
                                            <p className="text-xs leading-6 text-slate-600">
                                                Formation:{" "}
                                                {well.formation}
                                            </p>
                                        )}


                                        {well.total_depth != null && (
                                            <p className="text-xs leading-6 text-slate-600">
                                                Total Depth:{" "}
                                                {well.total_depth} m
                                            </p>
                                        )}


                                        <p className="text-xs leading-6 text-slate-600">
                                            Latitude:{" "}
                                            {latitude}
                                        </p>


                                        <p className="text-xs leading-6 text-slate-600">
                                            Longitude:{" "}
                                            {longitude}
                                        </p>

                                    </div>

                                </Popup>

                            </Marker>
                        );
                    })}


                    {/* =================================================
                        TARGET → NEARBY CONNECTIONS
                    ================================================== */}

                    {safeNearbyWells.map((well, index) => {

                        if (
                            !well ||
                            well.latitude == null ||
                            well.longitude == null
                        ) {
                            return null;
                        }


                        const latitude = Number(well.latitude);
                        const longitude = Number(well.longitude);


                        if (
                            !Number.isFinite(latitude) ||
                            !Number.isFinite(longitude)
                        ) {
                            return null;
                        }


                        return (
                            <Polyline
                                key={
                                    `line-${well.well_id || index}`
                                }
                                positions={[
                                    targetPosition,
                                    [
                                        latitude,
                                        longitude,
                                    ],
                                ]}
                                pathOptions={{
                                    dashArray: "6 8",
                                }}
                            />
                        );
                    })}

                </MapContainer>

            </div>


            {/* =================================================
                MAP LEGEND
            ================================================== */}

            <div className="mt-4 flex flex-wrap items-center gap-5">

                {/* Target */}

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">

                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
                        🎯
                    </span>

                    <span>
                        Target Well
                    </span>

                </div>


                {/* Nearby */}

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">

                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                        🔵
                    </span>

                    <span>
                        Nearby Well
                    </span>

                </div>


                {/* Relationship */}

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">

                    <span className="h-0.5 w-8 border-t-2 border-dashed border-blue-400"></span>

                    <span>
                        Distance Relationship
                    </span>

                </div>

            </div>

        </section>
    );
}


export default WellMap;