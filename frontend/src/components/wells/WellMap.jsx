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
import { useEffect, useMemo } from "react";

import "leaflet/dist/leaflet.css";


// ============================================================
// LEAFLET DEFAULT ICONS
// ============================================================

// Import Leaflet images directly from the installed package.
// This avoids depending on an external CDN.

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";


// ============================================================
// TARGET WELL ICON - RED
// ============================================================

const targetIcon = L.divIcon({

    className: "target-well-marker",

    html: `
        <div style="
            position: relative;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">

            <!-- Outer glow -->

            <div style="
                position: absolute;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: rgba(220, 38, 38, 0.20);
                animation: targetPulse 2s infinite;
            "></div>


            <!-- Red pin -->

            <div style="
                position: relative;
                width: 30px;
                height: 30px;
                background: #dc2626;
                border: 3px solid #ffffff;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow:
                    0 3px 10px rgba(0, 0, 0, 0.40);
                z-index: 2;
            ">

                <!-- White center -->

                <div style="
                    position: absolute;
                    width: 9px;
                    height: 9px;
                    background: #ffffff;
                    border-radius: 50%;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                "></div>

            </div>

        </div>
    `,

    iconSize: [38, 38],

    iconAnchor: [19, 38],

    popupAnchor: [0, -38],

});


// ============================================================
// NEARBY WELL ICON
// ============================================================

const nearbyIcon = new L.Icon({

    iconRetinaUrl: markerIcon2x,

    iconUrl: markerIcon,

    shadowUrl: markerShadow,

    iconSize: [25, 41],

    iconAnchor: [12, 41],

    popupAnchor: [1, -34],

    shadowSize: [41, 41],

});


// ============================================================
// MAP VIEW UPDATER
// ============================================================

function MapUpdater({
    latitude,
    longitude,
}) {

    const map = useMap();


    useEffect(() => {

        const lat =
            Number(latitude);

        const lng =
            Number(longitude);


        if (
            Number.isFinite(lat) &&
            Number.isFinite(lng)
        ) {

            map.setView(
                [lat, lng],
                12,
                {
                    animate: true,
                }
            );

        }

    }, [
        map,
        latitude,
        longitude,
    ]);


    return null;
}


// ============================================================
// FIT MAP TO ALL WELLS
// ============================================================

function MapBoundsUpdater({
    targetPosition,
    nearbyWells,
}) {

    const map = useMap();


    useEffect(() => {

        const positions = [
            targetPosition,
        ];


        nearbyWells.forEach(
            (well) => {

                const lat =
                    Number(
                        well.latitude
                    );

                const lng =
                    Number(
                        well.longitude
                    );


                if (
                    Number.isFinite(lat) &&
                    Number.isFinite(lng)
                ) {

                    positions.push([
                        lat,
                        lng,
                    ]);

                }

            }
        );


        if (positions.length > 1) {

            const bounds =
                L.latLngBounds(
                    positions
                );


            map.fitBounds(
                bounds,
                {
                    padding: [50, 50],

                    maxZoom: 12,

                }
            );

        }

    }, [
        map,
        targetPosition,
        nearbyWells,
    ]);


    return null;
}


// ============================================================
// WELL MAP
// ============================================================

function WellMap({

    targetWell,

    nearbyWells = [],

    radiusKm = 10,

}) {

    // ========================================================
    // VALIDATE TARGET
    // ========================================================

    if (!targetWell) {

        return (

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">

                <p className="text-sm font-semibold text-slate-500">
                    No target well selected.
                </p>

            </div>

        );

    }


    // ========================================================
    // TARGET COORDINATES
    // ========================================================

    const latitude =
        Number(
            targetWell.latitude
        );


    const longitude =
        Number(
            targetWell.longitude
        );


    // ========================================================
    // INVALID COORDINATES
    // ========================================================

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        return (

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-8">

                <div className="text-center">

                    <p className="text-base font-extrabold text-amber-800">
                        Map location unavailable
                    </p>


                    <p className="mt-2 text-sm text-amber-700">

                        Coordinates for{" "}

                        {targetWell.well_id || "the target well"}

                        {" "}were not returned by the backend.

                    </p>

                </div>

            </div>

        );

    }


    // ========================================================
    // TARGET POSITION
    // ========================================================

    const targetPosition = useMemo(
        () => [
            latitude,
            longitude,
        ],
        [
            latitude,
            longitude,
        ]
    );


    // ========================================================
    // VALID NEARBY WELLS
    // ========================================================

    const validNearbyWells =
        nearbyWells.filter(
            (well) => {

                const lat =
                    Number(
                        well.latitude
                    );

                const lng =
                    Number(
                        well.longitude
                    );


                return (
                    Number.isFinite(lat) &&
                    Number.isFinite(lng)
                );

            }
        );


    // ========================================================
    // MAP KEY
    // ========================================================

    const mapKey =
        `${targetWell.well_id}-${latitude}-${longitude}`;


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="border-b border-slate-100 p-6">

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                    <div>

                        <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-blue-600">
                            POSTGIS LOCATION
                        </p>


                        <h2 className="mt-1.5 text-2xl font-extrabold text-[#172033]">
                            Nearby Wells Map
                        </h2>


                        <p className="mt-1.5 text-sm text-slate-500">
                            Spatial relationship between the target
                            well and nearby wells.
                        </p>

                    </div>


                    {/* ==================================================
                        MAP INFO
                    ================================================== */}

                    <div className="flex flex-wrap gap-2">

                        {/* TARGET */}

                        <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">

                            <span className="h-2.5 w-2.5 rounded-full bg-red-600"></span>

                            Target:

                            {targetWell.well_id}

                        </span>


                        {/* RADIUS */}

                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">

                            Radius:

                            {" "}

                            {radiusKm} km

                        </span>


                        {/* NEARBY */}

                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">

                            {validNearbyWells.length} nearby

                        </span>

                    </div>

                </div>

            </div>


            {/* ==================================================
                MAP
            ================================================== */}

            <div className="relative h-[520px] w-full bg-slate-100">

                <MapContainer

                    key={mapKey}

                    center={targetPosition}

                    zoom={12}

                    scrollWheelZoom={true}

                    zoomControl={true}

                    className="h-full w-full"

                >

                    {/* ==================================================
                        OPEN STREET MAP
                    ================================================== */}

                    <TileLayer

                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

                    />


                    {/* ==================================================
                        MAP VIEW UPDATE
                    ================================================== */}

                    <MapUpdater

                        latitude={latitude}

                        longitude={longitude}

                    />


                    {/* ==================================================
                        FIT ALL WELLS
                    ================================================== */}

                    <MapBoundsUpdater

                        targetPosition={
                            targetPosition
                        }

                        nearbyWells={
                            validNearbyWells
                        }

                    />


                    {/* ==================================================
                        SEARCH RADIUS
                    ================================================== */}

                    <Circle

                        center={
                            targetPosition
                        }

                        radius={
                            Number(radiusKm) * 1000
                        }

                        pathOptions={{

                            fillOpacity: 0.08,

                            weight: 2,

                        }}

                    />


                    {/* ==================================================
                        TARGET WELL - RED MARKER
                    ================================================== */}

                    <Marker

                        position={
                            targetPosition
                        }

                        icon={
                            targetIcon
                        }

                    >

                        <Popup>

                            <div className="min-w-[200px]">

                                <div className="flex items-center gap-2">

                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">

                                        🎯

                                    </span>


                                    <div>

                                        <h3 className="text-base font-extrabold text-slate-900">

                                            {targetWell.well_id}

                                        </h3>


                                        <p className="text-xs font-bold text-red-600">

                                            Target Well

                                        </p>

                                    </div>

                                </div>


                                {targetWell.formation && (

                                    <p className="mt-3 text-xs text-slate-600">

                                        <strong>
                                            Formation:
                                        </strong>

                                        {" "}

                                        {targetWell.formation}

                                    </p>

                                )}


                                {targetWell.total_depth != null && (

                                    <p className="mt-1 text-xs text-slate-600">

                                        <strong>
                                            Total Depth:
                                        </strong>

                                        {" "}

                                        {targetWell.total_depth} m

                                    </p>

                                )}


                                <p className="mt-1 text-xs text-slate-500">

                                    <strong>
                                        Coordinates:
                                    </strong>

                                    {" "}

                                    {latitude.toFixed(5)},

                                    {" "}

                                    {longitude.toFixed(5)}

                                </p>

                            </div>

                        </Popup>

                    </Marker>


                    {/* ==================================================
                        NEARBY WELLS
                    ================================================== */}

                    {validNearbyWells.map(
                        (well) => {

                            const wellPosition = [

                                Number(
                                    well.latitude
                                ),

                                Number(
                                    well.longitude
                                ),

                            ];


                            return (

                                <Marker

                                    key={
                                        `well-${well.well_id}`
                                    }

                                    position={
                                        wellPosition
                                    }

                                    icon={
                                        nearbyIcon
                                    }

                                >

                                    <Popup>

                                        <div className="min-w-[190px]">

                                            <div className="flex items-center gap-2">

                                                <span className="text-lg">
                                                    📍
                                                </span>


                                                <div>

                                                    <h3 className="text-base font-extrabold text-slate-900">

                                                        {well.well_id}

                                                    </h3>


                                                    <p className="text-xs font-bold text-emerald-600">

                                                        Nearby Well

                                                    </p>

                                                </div>

                                            </div>


                                            {well.distance_km != null && (

                                                <p className="mt-3 text-xs text-slate-600">

                                                    <strong>
                                                        Distance:
                                                    </strong>

                                                    {" "}

                                                    {well.distance_km} km

                                                </p>

                                            )}


                                            {well.formation && (

                                                <p className="mt-1 text-xs text-slate-600">

                                                    <strong>
                                                        Formation:
                                                    </strong>

                                                    {" "}

                                                    {well.formation}

                                                </p>

                                            )}


                                            {well.total_depth != null && (

                                                <p className="mt-1 text-xs text-slate-600">

                                                    <strong>
                                                        Total Depth:
                                                    </strong>

                                                    {" "}

                                                    {well.total_depth} m

                                                </p>

                                            )}

                                        </div>

                                    </Popup>

                                </Marker>

                            );

                        }
                    )}


                    {/* ==================================================
                        CONNECTION LINES
                    ================================================== */}

                    {validNearbyWells.map(
                        (well) => {

                            const nearbyPosition = [

                                Number(
                                    well.latitude
                                ),

                                Number(
                                    well.longitude
                                ),

                            ];


                            return (

                                <Polyline

                                    key={
                                        `line-${well.well_id}`
                                    }

                                    positions={[
                                        targetPosition,
                                        nearbyPosition,
                                    ]}

                                    pathOptions={{

                                        dashArray:
                                            "6 8",

                                        weight: 2,

                                    }}

                                />

                            );

                        }
                    )}

                </MapContainer>


                {/* ==================================================
                    MAP LEGEND
                ================================================== */}

                <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

                    <div className="flex items-center gap-4">

                        {/* RED TARGET */}

                        <div className="flex items-center gap-2">

                            <span className="h-3 w-3 rounded-full border-2 border-white bg-red-600 shadow"></span>

                            <span className="text-xs font-bold text-slate-700">

                                Target Well

                            </span>

                        </div>


                        {/* BLUE NEARBY */}

                        <div className="flex items-center gap-2">

                            <span className="h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow"></span>

                            <span className="text-xs font-bold text-slate-700">

                                Nearby Well

                            </span>

                        </div>

                    </div>

                </div>

            </div>


            {/* ==================================================
                COORDINATE INFORMATION
            ================================================== */}

            <div className="grid border-t border-slate-100 bg-slate-50 sm:grid-cols-3">

                {/* TARGET */}

                <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">

                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">

                        Target Well

                    </p>


                    <p className="mt-1 text-sm font-extrabold text-red-600">

                        {targetWell.well_id}

                    </p>

                </div>


                {/* COORDINATES */}

                <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">

                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">

                        Coordinates

                    </p>


                    <p className="mt-1 text-xs font-bold text-slate-700">

                        {latitude.toFixed(5)},

                        {" "}

                        {longitude.toFixed(5)}

                    </p>

                </div>


                {/* RADIUS */}

                <div className="p-4">

                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">

                        Search Radius

                    </p>


                    <p className="mt-1 text-sm font-extrabold text-blue-600">

                        {radiusKm} km

                    </p>

                </div>

            </div>

        </section>

    );
}


export default WellMap;