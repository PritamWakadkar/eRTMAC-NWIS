import {
    Activity,
    CheckCircle2,
    Database,
    FileSearch,
    Gauge,
    MapPin,
    Search,
    Sparkles,
    Target,
    Zap,
} from "lucide-react";


// ============================================================
// FORMAT EVENT TYPE
// ============================================================

function formatEventType(eventType) {
    if (!eventType) {
        return "All Events";
    }

    const names = {
        mud_loss: "Mud Loss",
        torque_spike: "Torque Spike",
        torque_increase: "Torque Increase",
        drag: "Drag",
        drag_increase: "Drag Increase",
        wiper_trip: "Wiper Trip",
    };

    return (
        names[eventType] ||
        String(eventType)
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
    );
}


// ============================================================
// FORMAT EVENT CATEGORY FOR SUMMARY
// ============================================================

function formatEventCategory(eventType) {
    if (!eventType) {
        return "drilling";
    }

    const value = String(eventType).toLowerCase();

    if (value.includes("torque")) {
        return "torque-related";
    }

    if (value.includes("mud")) {
        return "mud-loss-related";
    }

    if (value.includes("drag")) {
        return "drag-related";
    }

    if (value.includes("wiper")) {
        return "wiper-trip";
    }

    return formatEventType(eventType).toLowerCase();
}


// ============================================================
// FORMAT DEPTH
// ============================================================

function formatDepth(depth) {
    if (
        depth === null ||
        depth === undefined ||
        depth === ""
    ) {
        return null;
    }

    if (typeof depth === "number") {
        return `${depth.toLocaleString()} m MD`;
    }

    if (typeof depth === "object") {
        if (depth.value !== undefined) {
            return `${Number(depth.value).toLocaleString()} ${
                depth.unit || "m MD"
            }`;
        }

        if (
            depth.start !== undefined &&
            depth.end !== undefined
        ) {
            return `${Number(depth.start).toLocaleString()}–${Number(
                depth.end
            ).toLocaleString()} ${depth.unit || "m MD"}`;
        }
    }

    return String(depth);
}


// ============================================================
// EVENT DEPTH
// ============================================================

function formatEventDepth(event) {
    if (!event) {
        return null;
    }

    if (event.event_depth_m !== undefined) {
        return formatDepth(event.event_depth_m);
    }

    if (event.depth !== undefined) {
        return formatDepth(event.depth);
    }

    if (event.requested_depth_m !== undefined) {
        return formatDepth(event.requested_depth_m);
    }

    return null;
}


// ============================================================
// EVENT WELL ID
// ============================================================

function getEventWellId(event) {
    if (!event) {
        return null;
    }

    return (
        event.well_id ||
        event.well ||
        event.wellId ||
        null
    );
}


// ============================================================
// EVENT TYPE
// ============================================================

function getEventType(event) {
    if (!event) {
        return "Unknown Event";
    }

    return formatEventType(
        event.event_type ||
            event.event ||
            "Unknown Event"
    );
}


// ============================================================
// MEASUREMENT
// ============================================================

function getMeasurement(event) {
    if (!event) {
        return "Not specified";
    }

    return (
        event.measurement ||
        event.value ||
        event.measurement_value ||
        "Not specified"
    );
}


// ============================================================
// EVIDENCE
// ============================================================

function getEvidence(event) {
    if (!event) {
        return "No evidence available.";
    }

    return (
        event.evidence ||
        event.description ||
        event.text ||
        "No evidence available."
    );
}


// ============================================================
// EVENT STYLE
// ============================================================

function getEventStyle(event) {
    const value = String(
        event?.event_type ||
            event?.event ||
            ""
    ).toLowerCase();

    if (value.includes("mud")) {
        return {
            icon: Activity,
            iconBg: "bg-cyan-100",
            iconColor: "text-cyan-600",
            badge:
                "bg-cyan-50 text-cyan-700 border-cyan-200",
        };
    }

    if (value.includes("torque")) {
        return {
            icon: Zap,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            badge:
                "bg-orange-50 text-orange-700 border-orange-200",
        };
    }

    if (value.includes("drag")) {
        return {
            icon: Gauge,
            iconBg: "bg-rose-100",
            iconColor: "text-rose-600",
            badge:
                "bg-rose-50 text-rose-700 border-rose-200",
        };
    }

    if (value.includes("wiper")) {
        return {
            icon: Target,
            iconBg: "bg-violet-100",
            iconColor: "text-violet-600",
            badge:
                "bg-violet-50 text-violet-700 border-violet-200",
        };
    }

    return {
        icon: Activity,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        badge:
            "bg-blue-50 text-blue-700 border-blue-200",
    };
}


// ============================================================
// CREATE UNIQUE EVENT KEY
//
// Prevents duplicate events from being displayed.
//
// Example:
//
// W105 + torque_spike + 2630 m MD + 16 kN·m
//
// is treated as one event.
// ============================================================

function getEventUniqueKey(event) {
    const wellId = String(
        getEventWellId(event) || ""
    )
        .trim()
        .toLowerCase();

    const eventType = String(
        event?.event_type ||
            event?.event ||
            ""
    )
        .trim()
        .toLowerCase();

    const depth = String(
        event?.event_depth_m ??
            event?.depth ??
            event?.requested_depth_m ??
            ""
    )
        .trim()
        .toLowerCase();

    const measurement = String(
        event?.measurement ||
            event?.value ||
            event?.measurement_value ||
            ""
    )
        .trim()
        .toLowerCase();

    const evidence = String(
        event?.evidence ||
            event?.description ||
            event?.text ||
            ""
    )
        .trim()
        .toLowerCase();

    return [
        wellId,
        eventType,
        depth,
        measurement,
        evidence,
    ].join("|");
}


// ============================================================
// REMOVE DUPLICATE EVENTS
// ============================================================

function getUniqueEvents(events) {
    if (!Array.isArray(events)) {
        return [];
    }

    const seen = new Set();
    const uniqueEvents = [];

    for (const event of events) {
        const key = getEventUniqueKey(event);

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        uniqueEvents.push(event);
    }

    return uniqueEvents;
}


// ============================================================
// MAIN COMPONENT
// ============================================================

function AnalysisResults({
    analysis,
    onSelectWell,
}) {
    if (!analysis) {
        return null;
    }


    // ========================================================
    // RESPONSE DATA
    // ========================================================

    const result =
        analysis.result &&
        typeof analysis.result === "object"
            ? analysis.result
            : analysis;


    const query =
        analysis.query ||
        result.query ||
        {};


    const route =
        analysis.route ||
        result.route ||
        query.intent ||
        "analysis";


    // ========================================================
    // RAW EVENTS
    // ========================================================

    const rawMatchedEvents =
        Array.isArray(result.matched_events)
            ? result.matched_events
            : [];


    // ========================================================
    // UNIQUE EVENTS
    // ========================================================

    const matchedEvents =
        getUniqueEvents(rawMatchedEvents);


    // ========================================================
    // RAW MATCHED WELLS
    // ========================================================

    const rawMatchedWells =
        Array.isArray(result.matched_wells)
            ? result.matched_wells
            : [];


    // ========================================================
    // UNIQUE MATCHED WELLS
    // ========================================================

    const matchedWells = [
        ...new Set(
            rawMatchedWells.filter(Boolean)
        ),
    ];


    // ========================================================
    // EVENT WELL IDS
    // ========================================================

    const eventWellIds = [
        ...new Set(
            matchedEvents
                .map(getEventWellId)
                .filter(Boolean)
        ),
    ];


    // ========================================================
    // DISPLAY WELL IDS
    // ========================================================

    const displayWellIds =
        eventWellIds.length > 0
            ? eventWellIds
            : matchedWells;


    // ========================================================
    // EVENT COUNT
    // ========================================================

    const eventCount =
        matchedEvents.length;


    // ========================================================
    // WELL COUNT
    // ========================================================

    const wellCount =
        displayWellIds.length;


    // ========================================================
    // QUERY WELL
    // ========================================================

    const queryWell =
        query.well_id ||
        result.well_id ||
        null;


    // ========================================================
    // QUERY DEPTH
    // ========================================================

    const queryDepth =
        query.depth ||
        result.requested_depth ||
        result.requested_depth_range ||
        null;


    // ========================================================
    // EVENT TYPE
    // ========================================================

    const eventType =
        query.event_type ||
        result.event_type ||
        null;


    // ========================================================
    // DISPLAY WELL
    // ========================================================

    let displayWell = "N/A";

    if (queryWell) {
        displayWell = queryWell;
    } else if (displayWellIds.length > 0) {
        displayWell = displayWellIds.join(", ");
    }


    // ========================================================
    // DISPLAY DEPTH
    // ========================================================

    let displayDepth = "N/A";

    if (queryDepth) {
        const formatted =
            formatDepth(queryDepth);

        if (formatted) {
            displayDepth = formatted;
        }
    } else {
        const eventDepths =
            matchedEvents
                .map((event) =>
                    formatEventDepth(event)
                )
                .filter(Boolean);

        if (eventDepths.length > 0) {
            displayDepth =
                eventDepths.join(" • ");
        }
    }


    // ========================================================
    // INTELLIGENCE SUMMARY
    //
    // IMPORTANT:
    //
    // For event_analysis we DO NOT directly display:
    //
    // result.structured_summary
    //
    // because that summary can contain duplicate events.
    //
    // Instead, we rebuild the summary using the already
    // deduplicated matchedEvents array.
    // ========================================================

    let summaryText = "";

    if (
        route === "event_analysis" &&
        matchedEvents.length > 0
    ) {
        const uniqueWellIds = [
            ...new Set(
                matchedEvents
                    .map(getEventWellId)
                    .filter(Boolean)
            ),
        ];

        const eventCategory =
            formatEventCategory(eventType);


        summaryText =
            `${uniqueWellIds.length} well(s) had ${eventCategory} events`;


        // Add each unique event exactly once.
        const summaryLines =
            matchedEvents
                .map((event) => {
                    const wellId =
                        getEventWellId(event);

                    const evidence =
                        getEvidence(event);

                    if (wellId) {
                        return `${wellId} — ${evidence}`;
                    }

                    return evidence;
                })
                .filter(Boolean);


        if (summaryLines.length > 0) {
            summaryText +=
                "\n\n" +
                summaryLines.join("\n");
        }
    } else {
        // For non-event routes, preserve the backend summary.
        summaryText =
            result.structured_summary ||
            result.ai_summary ||
            analysis.summary ||
            "No matching evidence was found for the requested analysis.";
    }


    // ========================================================
    // STATUS
    // ========================================================

    const status =
        analysis.success === false
            ? "Failed"
            : "Completed";


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <section className="mt-10">


            {/* ==================================================
                TOP HEADER
            ================================================== */}

            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <div className="flex items-start gap-4">

                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 shadow-xl shadow-blue-200">

                        <Sparkles className="h-6 w-6 text-white" />

                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />

                    </div>


                    <div>

                        <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-indigo-600">
                                AI Intelligence
                            </span>

                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                                Live Result
                            </span>

                        </div>


                        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                            Analysis Results
                        </h2>


                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                            AI-retrieved drilling intelligence
                            from the available well evidence.
                        </p>

                    </div>

                </div>


                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">

                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                    </div>


                    <div>

                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Analysis Status
                        </p>

                        <p className="mt-0.5 text-sm font-black text-emerald-600">
                            {status}
                        </p>

                    </div>

                </div>

            </div>


            {/* ==================================================
                MAIN RESULT CARD
            ================================================== */}

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">


                {/* ==================================================
                    INTELLIGENCE SUMMARY
                ================================================== */}

                <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#172554] to-blue-900 p-6 sm:p-8">

                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

                    <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />


                    <div className="relative">

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">


                            {/* SUMMARY */}

                            <div className="max-w-4xl">

                                <div className="flex items-center gap-2">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">

                                        <FileSearch className="h-4 w-4 text-blue-200" />

                                    </div>

                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">
                                        Intelligence Summary
                                    </span>

                                </div>


                                <div className="mt-5 text-lg font-bold leading-8 text-white sm:text-xl">

                                    {summaryText
                                        .split("\n")
                                        .map(
                                            (
                                                line,
                                                index
                                            ) => {

                                                if (
                                                    !line.trim()
                                                ) {
                                                    return (
                                                        <div
                                                            key={
                                                                index
                                                            }
                                                            className="h-2"
                                                        />
                                                    );
                                                }


                                                return (
                                                    <p
                                                        key={
                                                            index
                                                        }
                                                        className={
                                                            index ===
                                                            0
                                                                ? "font-black"
                                                                : "mt-1"
                                                        }
                                                    >
                                                        {
                                                            line
                                                        }
                                                    </p>
                                                );
                                            }
                                        )}

                                </div>

                            </div>


                            {/* ROUTE */}

                            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">

                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">
                                    Query Route
                                </p>

                                <p className="mt-1 text-sm font-black text-white">
                                    {route}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    STATISTICS
                ================================================== */}

                <div className="grid border-b border-slate-100 sm:grid-cols-3">


                    {/* EVENTS */}

                    <StatCard
                        icon={Activity}
                        label="Events Detected"
                        value={eventCount}
                        description="Operational events"
                        iconClass="bg-cyan-50 text-cyan-600"
                        valueClass="text-cyan-700"
                    />


                    {/* WELLS */}

                    <StatCard
                        icon={MapPin}
                        label="Wells"
                        value={wellCount}
                        description="Relevant wells"
                        iconClass="bg-indigo-50 text-indigo-600"
                        valueClass="text-indigo-700"
                    />


                    {/* EVIDENCE */}

                    <StatCard
                        icon={Search}
                        label="Evidence Status"
                        value={
                            eventCount > 0 ||
                            result.formation ||
                            result.well_id
                                ? "Found"
                                : "None"
                        }
                        description="Retrieved evidence"
                        iconClass="bg-emerald-50 text-emerald-600"
                        valueClass="text-emerald-700"
                    />

                </div>


                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="p-6 sm:p-8">


                    {/* ==================================================
                        RELEVANT WELLS
                    ================================================== */}

                    {displayWellIds.length > 0 && (

                        <div className="mb-8">

                            <div className="mb-4 flex items-center justify-between">

                                <div>

                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-500">
                                        Relevant Wells
                                    </p>

                                    <h3 className="mt-1 text-lg font-black text-slate-900">
                                        Wells Matching Your Query
                                    </h3>

                                </div>


                                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-black text-indigo-600">

                                    {displayWellIds.length}{" "}

                                    {displayWellIds.length === 1
                                        ? "Well"
                                        : "Wells"}

                                </span>

                            </div>


                            <div className="flex flex-wrap gap-3">

                                {displayWellIds.map(
                                    (wellId) => (

                                        <button
                                            key={wellId}
                                            type="button"
                                            onClick={() =>
                                                onSelectWell?.({
                                                    well_id:
                                                        wellId,
                                                })
                                            }
                                            className="group flex items-center gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 text-left transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100"
                                        >

                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">

                                                <MapPin className="h-4 w-4 text-indigo-600" />

                                            </div>


                                            <div>

                                                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-400">
                                                    Well
                                                </p>

                                                <p className="text-sm font-black text-indigo-800">
                                                    {wellId}
                                                </p>

                                            </div>


                                            <span className="ml-2 text-indigo-300 transition-transform group-hover:translate-x-1">
                                                →
                                            </span>

                                        </button>

                                    )
                                )}

                            </div>

                        </div>

                    )}


                    {/* ==================================================
                        DRILLING EVENTS
                    ================================================== */}

                    <div>

                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                            <div>

                                <div className="flex items-center gap-2">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-md shadow-orange-100">

                                        <Activity className="h-4 w-4 text-white" />

                                    </div>


                                    <h3 className="text-lg font-black text-slate-900">
                                        Drilling Events
                                    </h3>

                                </div>


                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Operational observations
                                    retrieved from drilling
                                    evidence.
                                </p>

                            </div>


                            {eventCount > 0 && (

                                <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-600">

                                    {eventCount}{" "}
                                    {eventCount === 1
                                        ? "Event"
                                        : "Events"}

                                </span>

                            )}

                        </div>


                        {/* ==================================================
                            EVENT CARDS
                        ================================================== */}

                        {eventCount > 0 ? (

                            <div className="relative space-y-4">


                                {/* TIMELINE */}

                                <div className="absolute bottom-5 left-[21px] top-5 hidden w-px bg-gradient-to-b from-blue-200 via-indigo-200 to-transparent sm:block" />


                                {matchedEvents.map(
                                    (
                                        event,
                                        index
                                    ) => {

                                        const wellId =
                                            getEventWellId(
                                                event
                                            );

                                        const depth =
                                            formatEventDepth(
                                                event
                                            );

                                        const type =
                                            getEventType(
                                                event
                                            );

                                        const measurement =
                                            getMeasurement(
                                                event
                                            );

                                        const evidence =
                                            getEvidence(
                                                event
                                            );

                                        const style =
                                            getEventStyle(
                                                event
                                            );

                                        const EventIcon =
                                            style.icon;


                                        return (

                                            <div
                                                key={
                                                    getEventUniqueKey(
                                                        event
                                                    ) ||
                                                    `event-${index}`
                                                }
                                                className="group relative"
                                            >

                                                <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50">


                                                    <div className="flex flex-col gap-5 sm:flex-row">


                                                        {/* EVENT ICON */}

                                                        <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-4 ring-white">

                                                            <div
                                                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.iconBg}`}
                                                            >

                                                                <EventIcon
                                                                    className={`h-5 w-5 ${style.iconColor}`}
                                                                />

                                                            </div>

                                                        </div>


                                                        {/* EVENT CONTENT */}

                                                        <div className="min-w-0 flex-1">


                                                            {/* BADGES */}

                                                            <div className="flex flex-wrap items-center gap-2">

                                                                {wellId && (

                                                                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                                                                        {wellId}
                                                                    </span>

                                                                )}


                                                                <span
                                                                    className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${style.badge}`}
                                                                >
                                                                    {type}
                                                                </span>

                                                            </div>


                                                            {/* DETAILS */}

                                                            <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">


                                                                {/* DEPTH */}

                                                                <div className="rounded-xl bg-slate-50 p-4">

                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                        Depth
                                                                    </p>


                                                                    <p className="mt-2 text-sm font-black text-slate-900">
                                                                        {depth ||
                                                                            "N/A"}
                                                                    </p>


                                                                    <div className="mt-3 h-px bg-slate-200" />


                                                                    <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                        Measurement
                                                                    </p>


                                                                    <p className="mt-1 text-xs font-bold text-slate-700">
                                                                        {measurement}
                                                                    </p>

                                                                </div>


                                                                {/* EVIDENCE */}

                                                                <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">

                                                                    <div className="flex items-center gap-2">

                                                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />

                                                                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-500">
                                                                            Evidence
                                                                        </p>

                                                                    </div>


                                                                    <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
                                                                        {evidence}
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>

                                        );

                                    }
                                )}

                            </div>

                        ) : (

                            /* ==================================================
                                NO EVENTS
                            ================================================== */

                            <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 px-6 py-12 text-center">

                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">

                                    <Search className="h-7 w-7 text-slate-300" />

                                </div>


                                <h4 className="mt-5 text-base font-black text-slate-800">
                                    No Matching Events
                                </h4>


                                <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                                    The available drilling evidence
                                    did not contain an event matching
                                    this query.
                                </p>

                            </div>

                        )}

                    </div>


                    {/* ==================================================
                        QUERY CONTEXT
                    ================================================== */}

                    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">


                        {/* HEADER */}

                        <div className="border-b border-white/10 px-5 py-4">

                            <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">

                                    <Database className="h-4 w-4 text-blue-300" />

                                </div>


                                <div>

                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-300">
                                        Query Context
                                    </p>

                                    <p className="mt-0.5 text-xs font-semibold text-white">
                                        How the NLP engine interpreted
                                        your request
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* CONTEXT ITEMS */}

                        <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">

                            <ContextItem
                                label="Route"
                                value={route}
                                color="text-blue-300"
                            />


                            <ContextItem
                                label="Well"
                                value={displayWell}
                                color="text-indigo-300"
                            />


                            <ContextItem
                                label="Depth"
                                value={displayDepth}
                                color="text-cyan-300"
                            />


                            <ContextItem
                                label="Event Type"
                                value={formatEventType(
                                    eventType
                                )}
                                color="text-orange-300"
                            />

                        </div>

                    </div>

                </div>

            </div>


            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">

                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">

                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />

                </div>


                <p className="text-[10px] leading-5 text-blue-700">
                    Results are generated from the available indexed
                    drilling evidence. Event details shown above are
                    grounded in retrieved well records.
                </p>

            </div>

        </section>
    );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
    icon: Icon,
    label,
    value,
    description,
    iconClass,
    valueClass,
}) {
    return (

        <div className="group border-b border-slate-100 p-5 transition-colors hover:bg-slate-50 sm:border-b-0 sm:border-r last:border-r-0">

            <div className="flex items-center justify-between">

                <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>


                    <p
                        className={`mt-2 text-2xl font-black tracking-tight ${valueClass}`}
                    >
                        {value}
                    </p>


                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                        {description}
                    </p>

                </div>


                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
                >

                    <Icon className="h-5 w-5" />

                </div>

            </div>

        </div>

    );
}


// ============================================================
// QUERY CONTEXT ITEM
// ============================================================

function ContextItem({
    label,
    value,
    color,
}) {
    return (

        <div className="bg-slate-950 p-4">

            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                {label}
            </p>


            <p
                className={`mt-2 break-words text-xs font-black ${color}`}
            >
                {value || "N/A"}
            </p>

        </div>

    );
}


// ============================================================
// EXPORT
// ============================================================

export default AnalysisResults;