import {
    AlertTriangle,
    CheckCircle2,
    FileText,
    Activity,
    MapPin,
} from "lucide-react";


// ============================================================
// EVENT NAME
// ============================================================

function formatEventName(eventName) {
    if (!eventName) {
        return "Unknown Event";
    }

    return String(eventName)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}


// ============================================================
// DEPTH
// ============================================================

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


// ============================================================
// MEASUREMENT
// ============================================================

function getEventMeasurement(event) {
    return (
        event.measurement ??
        event.value ??
        null
    );
}


// ============================================================
// EVIDENCE
// ============================================================

function getEventEvidence(event) {
    return (
        event.evidence ??
        event.description ??
        event.details ??
        event.note ??
        null
    );
}


// ============================================================
// DOCUMENT
// ============================================================

function getDocumentName(event) {
    return (
        event.document ??
        event.document_name ??
        event.file_name ??
        event.source_document ??
        null
    );
}


// ============================================================
// PAGE
// ============================================================

function getPageNumber(event) {
    return (
        event.page ??
        event.page_number ??
        null
    );
}


// ============================================================
// WELL
// ============================================================

function getWellId(event) {
    return (
        event.well_id ??
        event.well ??
        event.source_well ??
        null
    );
}


// ============================================================
// DISTANCE
// ============================================================

function getDistance(event) {
    return (
        event.distance_km ??
        event.distance ??
        null
    );
}


// ============================================================
// EVENT ANALYSIS
// ============================================================

function EventAnalysis({ events = [] }) {

    // ========================================================
    // EMPTY STATE
    // ========================================================

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
                            Drilling events identified from historical
                            well information and analysis results.
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
                        No structured drilling events were returned
                        for this analysis.
                    </p>

                </div>

            </section>
        );
    }


    return (
        <section className="mt-8">

            {/* ====================================================
                HEADER
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


                        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-600">
                            {events.length} EVENT
                            {events.length !== 1 ? "S" : ""}
                        </span>

                    </div>

                </div>

            </div>


            {/* ====================================================
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


                    const evidence =
                        getEventEvidence(event);


                    const wellId =
                        getWellId(event);


                    const distance =
                        getDistance(event);


                    const document =
                        getDocumentName(event);


                    const page =
                        getPageNumber(event);


                    return (

                        <div
                            key={`${eventName || "event"}-${wellId || "well"}-${depth || index}`}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        >

                            {/* =================================================
                                EVENT HEADER
                            ================================================== */}

                            <div className="border-b border-slate-100 p-6">

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
                                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">

                                                        <MapPin
                                                            size={14}
                                                            className="text-slate-400"
                                                        />

                                                        Source Well:

                                                        <span className="font-bold text-slate-700">
                                                            {wellId}
                                                        </span>

                                                        {distance !== null && (
                                                            <>
                                                                <span>•</span>
                                                                <span>
                                                                    {distance} km
                                                                </span>
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

                            </div>


                            {/* =================================================
                                EVENT DETAILS
                            ================================================== */}

                            <div className="p-6">

                                <div className="grid gap-4 md:grid-cols-2">

                                    {/* DEPTH */}

                                    <div className="rounded-xl bg-slate-50 p-4">

                                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                                            Event Depth
                                        </p>

                                        <p className="mt-2 text-base font-extrabold text-[#172033]">

                                            {depth !== null &&
                                            depth !== undefined
                                                ? `${depth} m MD`
                                                : "Not specified"}

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
                                                : "Not specified"}

                                        </p>

                                    </div>

                                </div>


                                {/* =================================================
                                    EVIDENCE
                                ================================================== */}

                                {evidence && (
                                    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-5">

                                        <div className="flex items-start gap-3">

                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">

                                                <FileText size={17} />

                                            </div>


                                            <div className="min-w-0">

                                                <p className="text-[11px] font-extrabold uppercase tracking-wide text-blue-600">
                                                    Evidence
                                                </p>


                                                <p className="mt-2 text-sm leading-6 text-blue-900">
                                                    {evidence}
                                                </p>

                                            </div>

                                        </div>

                                    </div>
                                )}


                                {/* =================================================
                                    SOURCE
                                ================================================== */}

                                {(document || page) && (
                                    <div className="mt-4 flex flex-wrap items-center gap-2">

                                        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">

                                            <FileText
                                                size={14}
                                                className="text-slate-500"
                                            />

                                            <span className="text-[11px] font-bold text-slate-600">

                                                {document || "Source document"}

                                            </span>

                                        </div>


                                        {page && (
                                            <span className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-600">

                                                Page {page}

                                            </span>
                                        )}

                                    </div>
                                )}

                            </div>

                        </div>
                    );
                })}

            </div>


            {/* ====================================================
                COMPLETION
            ===================================================== */}

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-600">

                <CheckCircle2 size={15} />

                Structured drilling events identified from
                available data.

            </div>

        </section>
    );
}


export default EventAnalysis;