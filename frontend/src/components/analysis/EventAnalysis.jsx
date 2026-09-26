import {
    AlertTriangle,
    CheckCircle2,
    Activity,
} from "lucide-react";

function formatEventName(eventName) {
    if (!eventName) {
        return "Unknown Event";
    }

    return eventName
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getEventDepth(event) {
    return (
        event.depth_m ??
        event.depth ??
        event.event_depth ??
        event.md ??
        event.measured_depth ??
        null
    );
}

function getEventMeasurement(event) {
    return (
        event.measurement ??
        event.value ??
        event.description ??
        event.details ??
        null
    );
}

function EventAnalysis({ events = [] }) {

    if (!events.length) {
        return (
            <section className="mt-8">

                <div className="mb-5 flex items-start gap-3">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#172033] text-white">
                        <Activity size={22} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-[#172033]">
                            Event Analysis
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Drilling events identified from historical well
                            information and analysis results.
                        </p>
                    </div>

                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

                    <Activity
                        size={38}
                        className="mx-auto text-slate-300"
                    />

                    <h3 className="mt-4 text-base font-extrabold text-[#172033]">
                        No Drilling Events Found
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                        No structured drilling events were returned for
                        this analysis.
                    </p>

                </div>

            </section>
        );
    }

    return (
        <section className="mt-8">

            {/* =====================================================
                SECTION HEADER
            ===================================================== */}

            <div className="mb-5 flex items-start gap-3">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#172033] text-white">
                    <Activity size={22} />
                </div>

                <div className="flex-1">

                    <div className="flex items-center justify-between gap-4">

                        <div>

                            <h2 className="text-2xl font-extrabold tracking-tight text-[#172033]">
                                Event Analysis
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Drilling events identified from historical
                                well information and analysis results.
                            </p>

                        </div>

                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-600">
                            {events.length} EVENT{events.length !== 1 ? "S" : ""}
                        </span>

                    </div>

                </div>

            </div>


            {/* =====================================================
                EVENTS
            ===================================================== */}

            <div className="space-y-4">

                {events.map((event, index) => {

                    const eventName =
                        event.event ||
                        event.event_type ||
                        event.type ||
                        event.name;

                    const depth =
                        getEventDepth(event);

                    const measurement =
                        getEventMeasurement(event);

                    const wellId =
                        event.well_id ||
                        event.well ||
                        event.source_well ||
                        null;

                    const distance =
                        event.distance_km ??
                        event.distance ??
                        null;

                    return (
                        <div
                            key={`${eventName || "event"}-${index}`}
                            className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"
                        >

                            {/* =================================================
                                EVENT HEADER
                            ================================================= */}

                            <div className="flex items-start gap-4">

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                                    <AlertTriangle size={22} />

                                </div>


                                <div className="min-w-0 flex-1">

                                    <div className="flex items-start justify-between gap-4">

                                        <div>

                                            <h3 className="text-lg font-extrabold text-[#172033]">
                                                {formatEventName(eventName)}
                                            </h3>

                                            {wellId && (
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Source Well:{" "}
                                                    <span className="font-bold text-slate-700">
                                                        {wellId}
                                                    </span>

                                                    {distance !== null && (
                                                        <>
                                                            {" • "}
                                                            {distance} km
                                                        </>
                                                    )}
                                                </p>
                                            )}

                                        </div>


                                        <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold uppercase text-amber-700">
                                            Detected
                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                EVENT DETAILS
                            ================================================= */}

                            <div className="mt-5 grid gap-4 md:grid-cols-2">

                                {/* DEPTH */}

                                <div className="rounded-xl bg-slate-50 p-4">

                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                                        Event Depth
                                    </p>

                                    <p className="mt-2 text-base font-extrabold text-[#172033]">

                                        {depth !== null && depth !== undefined
                                            ? `${depth} m MD`
                                            : "Not specified"
                                        }

                                    </p>

                                </div>


                                {/* MEASUREMENT */}

                                <div className="rounded-xl bg-slate-50 p-4">

                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                                        Measurement
                                    </p>

                                    <p className="mt-2 text-base font-extrabold text-[#172033]">

                                        {measurement
                                            ? measurement
                                            : "Not specified"
                                        }

                                    </p>

                                </div>

                            </div>


                            {/* =================================================
                                EXTRA DESCRIPTION
                            ================================================= */}

                            {(event.description ||
                                event.details ||
                                event.note) && (

                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                                        Observation
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {event.description ||
                                            event.details ||
                                            event.note}
                                    </p>

                                </div>

                            )}

                        </div>
                    );
                })}

            </div>


            {/* =====================================================
                COMPLETION
            ===================================================== */}

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-600">

                <CheckCircle2 size={15} />

                Structured drilling events identified from available data.

            </div>

        </section>
    );
}

export default EventAnalysis;