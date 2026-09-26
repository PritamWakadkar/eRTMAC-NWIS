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
    Layers3,
    Navigation,
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
            badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
        };
    }

    if (value.includes("torque")) {
        return {
            icon: Zap,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            badge: "bg-orange-50 text-orange-700 border-orange-200",
        };
    }

    if (value.includes("drag")) {
        return {
            icon: Gauge,
            iconBg: "bg-rose-100",
            iconColor: "text-rose-600",
            badge: "bg-rose-50 text-rose-700 border-rose-200",
        };
    }

    if (value.includes("wiper")) {
        return {
            icon: Target,
            iconBg: "bg-violet-100",
            iconColor: "text-violet-600",
            badge: "bg-violet-50 text-violet-700 border-violet-200",
        };
    }

    return {
        icon: Activity,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
    };
}

// ============================================================
// ROUTE TITLE
// ============================================================

function getRouteTitle(route) {
    const titles = {
        event_analysis: "Drilling Event Analysis",
        depth_event_analysis: "Depth Event Analysis",
        formation_analysis: "Formation Information",
        well_information: "Well Information",
        nearby_well_analysis: "Nearby Well Analysis",
        general_well_query: "Well Analysis",
    };

    return titles[route] || "Well Analysis";
}

// ============================================================
// ROUTE DESCRIPTION
// ============================================================

function getRouteDescription(route) {
    const descriptions = {
        event_analysis:
            "Operational events identified from retrieved drilling evidence.",

        depth_event_analysis:
            "Drilling events identified around the requested depth.",

        formation_analysis:
            "Formation information retrieved for the requested well.",

        well_information:
            "Well information retrieved from the available well records.",

        nearby_well_analysis:
            "Nearby wells and their relevant drilling information.",

        general_well_query:
            "Information retrieved from the available well intelligence.",
    };

    return (
        descriptions[route] ||
        "Information retrieved from the available well intelligence."
    );
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
    // RESPONSE STRUCTURE
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
    // EVENTS
    // ========================================================

    const matchedEvents = Array.isArray(
        result.matched_events
    )
        ? result.matched_events
        : [];

    // ========================================================
    // MATCHED WELLS
    // ========================================================

    const matchedWells = Array.isArray(
        result.matched_wells
    )
        ? result.matched_wells
        : [];

    // ========================================================
    // COUNTS
    // ========================================================

    const eventCount =
        result.event_count ??
        matchedEvents.length;

    const wellCount =
        result.well_count ??
        matchedWells.length;

    // ========================================================
    // QUERY PARAMETERS
    // ========================================================

    const queryWell =
        query.well_id ||
        result.well_id ||
        null;

    const queryDepth =
        query.depth ||
        result.requested_depth ||
        result.requested_depth_range ||
        null;

    const eventType =
        query.event_type ||
        result.event_type ||
        null;

    // ========================================================
    // FORMATION
    // ========================================================

    const formation =
        result.formation ||
        result.formation_name ||
        result.formation_used ||
        result.well?.formation ||
        result.well_information?.formation ||
        null;

    // ========================================================
    // WELL INFORMATION
    // ========================================================

    const wellInformation =
        result.well_information ||
        result.well ||
        result;

    const latitude =
        result.latitude ??
        wellInformation?.latitude ??
        wellInformation?.lat ??
        null;

    const longitude =
        result.longitude ??
        wellInformation?.longitude ??
        wellInformation?.lon ??
        null;

    const totalDepth =
        result.total_depth_m ??
        result.total_depth ??
        wellInformation?.total_depth_m ??
        wellInformation?.total_depth ??
        null;

    // ========================================================
    // SUMMARY
    // ========================================================

    let summary =
        result.structured_summary ||
        result.ai_summary ||
        result.summary ||
        analysis.summary ||
        null;

    // Route-specific fallback summaries
    if (!summary && route === "formation_analysis") {
        summary = formation
            ? `${queryWell || "The requested well"} was drilled in the ${formation}.`
            : `No formation information was found for ${
                  queryWell || "the requested well"
              }.`;
    }

    if (!summary && route === "well_information") {
        summary = queryWell
            ? `Well information for ${queryWell} was retrieved from the available well records.`
            : "Well information was retrieved from the available records.";
    }

    if (!summary && route === "event_analysis") {
        summary =
            "No matching drilling event evidence was found for the requested analysis.";
    }

    if (!summary && route === "depth_event_analysis") {
        summary =
            "No drilling event evidence was found around the requested depth.";
    }

    if (!summary) {
        summary =
            "Information was retrieved from the available well intelligence.";
    }

    // ========================================================
    // EVENT WELLS
    // ========================================================

    const eventWellIds = [
        ...new Set(
            matchedEvents
                .map(getEventWellId)
                .filter(Boolean)
        ),
    ];

    const displayWellIds =
        eventWellIds.length > 0
            ? eventWellIds
            : matchedWells;

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

    const eventDepths = matchedEvents
        .map((event) => {
            const depth = formatEventDepth(event);

            if (!depth) {
                return null;
            }

            const wellId = getEventWellId(event);

            if (wellId) {
                return `${wellId}: ${depth}`;
            }

            return depth;
        })
        .filter(Boolean);

    let displayDepth = "N/A";

    if (queryDepth) {
        const formatted = formatDepth(queryDepth);

        if (formatted) {
            displayDepth = formatted;
        }
    } else if (eventDepths.length > 0) {
        displayDepth = eventDepths.join(" • ");
    }

    // ========================================================
    // STATUS
    // ========================================================

    const status =
        analysis.success === false
            ? "Failed"
            : "Completed";

    // ========================================================
    // IS EVENT ROUTE?
    // ========================================================

    const isEventRoute =
        route === "event_analysis" ||
        route === "depth_event_analysis";

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <section className="mt-10">

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

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
                            {getRouteTitle(route)}
                        </h2>

                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                            {getRouteDescription(route)}
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

            {/* ================================================= */}
            {/* MAIN CARD */}
            {/* ================================================= */}

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">

                {/* ================================================= */}
                {/* SUMMARY HERO */}
                {/* ================================================= */}

                <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#172554] to-blue-900 p-6 sm:p-8">

                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

                    <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

                    <div className="relative">

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                            <div className="max-w-3xl">

                                <div className="flex items-center gap-2">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                                        <FileSearch className="h-4 w-4 text-blue-200" />
                                    </div>

                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">
                                        Intelligence Summary
                                    </span>

                                </div>

                                <p className="mt-5 text-lg font-bold leading-8 text-white sm:text-xl">
                                    {summary}
                                </p>

                            </div>

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

                {/* ================================================= */}
                {/* STATISTICS */}
                {/* ================================================= */}

                <div className="grid border-b border-slate-100 sm:grid-cols-3">

                    <StatCard
                        icon={isEventRoute ? Activity : Target}
                        label={
                            isEventRoute
                                ? "Events Detected"
                                : "Information Items"
                        }
                        value={
                            isEventRoute
                                ? eventCount
                                : "✓"
                        }
                        description={
                            isEventRoute
                                ? "Operational events"
                                : "Relevant information"
                        }
                        iconClass="bg-cyan-50 text-cyan-600"
                        valueClass="text-cyan-700"
                    />

                    <StatCard
                        icon={MapPin}
                        label="Well"
                        value={displayWell}
                        description="Requested well"
                        iconClass="bg-indigo-50 text-indigo-600"
                        valueClass="text-indigo-700"
                    />

                    <StatCard
                        icon={Search}
                        label="Evidence Status"
                        value={
                            isEventRoute
                                ? matchedEvents.length > 0
                                    ? "Found"
                                    : "None"
                                : "Available"
                        }
                        description={
                            isEventRoute
                                ? "Retrieved evidence"
                                : "Retrieved information"
                        }
                        iconClass="bg-emerald-50 text-emerald-600"
                        valueClass="text-emerald-700"
                    />

                </div>

                <div className="p-6 sm:p-8">

                    {/* ================================================= */}
                    {/* FORMATION ANALYSIS */}
                    {/* ================================================= */}

                    {route === "formation_analysis" && (
                        <FormationInformation
                            wellId={queryWell}
                            formation={formation}
                        />
                    )}

                    {/* ================================================= */}
                    {/* WELL INFORMATION */}
                    {/* ================================================= */}

                    {route === "well_information" && (
                        <WellInformation
                            wellId={queryWell}
                            formation={formation}
                            latitude={latitude}
                            longitude={longitude}
                            totalDepth={totalDepth}
                        />
                    )}

                    {/* ================================================= */}
                    {/* EVENT ANALYSIS */}
                    {/* ================================================= */}

                    {isEventRoute && (
                        <EventAnalysisSection
                            matchedEvents={matchedEvents}
                        />
                    )}

                    {/* ================================================= */}
                    {/* NEARBY WELLS */}
                    {/* ================================================= */}

                    {route === "nearby_well_analysis" && (
                        <NearbyWellInformation
                            matchedWells={matchedWells}
                            result={result}
                            onSelectWell={onSelectWell}
                        />
                    )}

                    {/* ================================================= */}
                    {/* RELEVANT WELLS */}
                    {/* ================================================= */}

                    {displayWellIds.length > 0 &&
                        route !== "formation_analysis" &&
                        route !== "well_information" && (
                            <div className="mt-8">

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
                                        (wellId, index) => (
                                            <button
                                                key={`${wellId}-${index}`}
                                                type="button"
                                                onClick={() =>
                                                    onSelectWell?.(
                                                        wellId
                                                    )
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

                    {/* ================================================= */}
                    {/* QUERY CONTEXT */}
                    {/* ================================================= */}

                    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">

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
                                        How the NLP engine interpreted your request
                                    </p>

                                </div>

                            </div>

                        </div>

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
                                value={formatEventType(eventType)}
                                color="text-orange-300"
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">

                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                </div>

                <p className="text-[10px] leading-5 text-blue-700">
                    Results are generated from the available indexed
                    drilling evidence and structured well records.
                    Event details are grounded in retrieved well
                    evidence.
                </p>

            </div>

        </section>
    );
}

// ============================================================
// FORMATION INFORMATION
// ============================================================

function FormationInformation({
    wellId,
    formation,
}) {
    return (
        <div>

            <div className="mb-5 flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-100">
                    <Layers3 className="h-5 w-5 text-white" />
                </div>

                <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-500">
                        Formation Analysis
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                        Formation Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        Geological formation associated with the requested well.
                    </p>

                </div>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

                <InfoCard
                    label="Well ID"
                    value={wellId || "N/A"}
                    icon={MapPin}
                    iconClass="bg-indigo-100 text-indigo-600"
                />

                <InfoCard
                    label="Formation"
                    value={formation || "No formation information available"}
                    icon={Layers3}
                    iconClass="bg-violet-100 text-violet-600"
                    large
                />

            </div>

            {!formation && (
                <EmptyInformation
                    title="Formation Not Found"
                    message="No formation information was returned for this well."
                />
            )}

        </div>
    );
}

// ============================================================
// WELL INFORMATION
// ============================================================

function WellInformation({
    wellId,
    formation,
    latitude,
    longitude,
    totalDepth,
}) {
    return (
        <div>

            <div className="mb-5 flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-100">
                    <Database className="h-5 w-5 text-white" />
                </div>

                <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-500">
                        Well Information
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                        {wellId || "Requested Well"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        Structured information retrieved for this well.
                    </p>

                </div>

            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <InfoCard
                    label="Well ID"
                    value={wellId || "N/A"}
                    icon={Target}
                    iconClass="bg-indigo-100 text-indigo-600"
                />

                <InfoCard
                    label="Formation"
                    value={formation || "N/A"}
                    icon={Layers3}
                    iconClass="bg-violet-100 text-violet-600"
                />

                <InfoCard
                    label="Total Depth"
                    value={
                        totalDepth !== null &&
                        totalDepth !== undefined
                            ? `${Number(totalDepth).toLocaleString()} m`
                            : "N/A"
                    }
                    icon={Gauge}
                    iconClass="bg-cyan-100 text-cyan-600"
                />

                <InfoCard
                    label="Latitude"
                    value={
                        latitude !== null &&
                        latitude !== undefined
                            ? latitude
                            : "N/A"
                    }
                    icon={Navigation}
                    iconClass="bg-emerald-100 text-emerald-600"
                />

                <InfoCard
                    label="Longitude"
                    value={
                        longitude !== null &&
                        longitude !== undefined
                            ? longitude
                            : "N/A"
                    }
                    icon={Navigation}
                    iconClass="bg-orange-100 text-orange-600"
                />

            </div>

        </div>
    );
}

// ============================================================
// EVENT ANALYSIS
// ============================================================

function EventAnalysisSection({
    matchedEvents,
}) {
    return (
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
                        Operational observations retrieved from drilling evidence.
                    </p>

                </div>

                {matchedEvents.length > 0 && (
                    <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-600">
                        {matchedEvents.length} Events
                    </span>
                )}

            </div>

            {matchedEvents.length > 0 ? (

                <div className="relative space-y-4">

                    <div className="absolute bottom-5 left-[21px] top-5 hidden w-px bg-gradient-to-b from-blue-200 via-indigo-200 to-transparent sm:block" />

                    {matchedEvents.map(
                        (event, index) => {

                            const wellId =
                                getEventWellId(event);

                            const depth =
                                formatEventDepth(event);

                            const type =
                                getEventType(event);

                            const measurement =
                                getMeasurement(event);

                            const evidence =
                                getEvidence(event);

                            const style =
                                getEventStyle(event);

                            const EventIcon =
                                style.icon;

                            return (
                                <div
                                    key={
                                        event.id ||
                                        `${wellId || "event"}-${index}`
                                    }
                                    className="group relative"
                                >

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50">

                                        <div className="flex flex-col gap-5 sm:flex-row">

                                            <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-4 ring-white">

                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.iconBg}`}
                                                >
                                                    <EventIcon
                                                        className={`h-5 w-5 ${style.iconColor}`}
                                                    />
                                                </div>

                                            </div>

                                            <div className="min-w-0 flex-1">

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

                                                <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">

                                                    <div className="rounded-xl bg-slate-50 p-4">

                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Depth
                                                        </p>

                                                        <p className="mt-2 text-sm font-black text-slate-900">
                                                            {depth || "N/A"}
                                                        </p>

                                                        <div className="mt-3 h-px bg-slate-200" />

                                                        <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Measurement
                                                        </p>

                                                        <p className="mt-1 text-xs font-bold text-slate-700">
                                                            {measurement}
                                                        </p>

                                                    </div>

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

                <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 px-6 py-12 text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                        <Search className="h-7 w-7 text-slate-300" />
                    </div>

                    <h4 className="mt-5 text-base font-black text-slate-800">
                        No Matching Events
                    </h4>

                    <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                        The available drilling evidence did not contain
                        an event matching this query.
                    </p>

                </div>
            )}

        </div>
    );
}

// ============================================================
// NEARBY WELL INFORMATION
// ============================================================

function NearbyWellInformation({
    matchedWells,
    result,
    onSelectWell,
}) {
    const nearbyWells =
        Array.isArray(result.nearby_wells)
            ? result.nearby_wells
            : matchedWells;

    return (
        <div>

            <div className="mb-5">

                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-500">
                    Nearby Intelligence
                </p>

                <h3 className="mt-1 text-xl font-black text-slate-900">
                    Nearby Wells
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                    Wells identified within the requested spatial context.
                </p>

            </div>

            {nearbyWells.length > 0 ? (

                <div className="grid gap-4 md:grid-cols-2">

                    {nearbyWells.map((well, index) => {

                        const wellId =
                            typeof well === "string"
                                ? well
                                : well.well_id ||
                                  well.id ||
                                  `Well ${index + 1}`;

                        const distance =
                            typeof well === "object"
                                ? well.distance_km ??
                                  well.distance ??
                                  null
                                : null;

                        return (
                            <button
                                key={`${wellId}-${index}`}
                                type="button"
                                onClick={() =>
                                    onSelectWell?.(wellId)
                                }
                                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl"
                            >

                                <div className="flex items-center justify-between">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                                            <MapPin className="h-5 w-5 text-indigo-600" />
                                        </div>

                                        <div>

                                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                Well
                                            </p>

                                            <p className="text-base font-black text-slate-900">
                                                {wellId}
                                            </p>

                                        </div>

                                    </div>

                                    <span className="text-indigo-300 transition-transform group-hover:translate-x-1">
                                        →
                                    </span>

                                </div>

                                {distance !== null && (
                                    <p className="mt-4 text-xs font-bold text-slate-500">
                                        Distance:{" "}
                                        <span className="text-indigo-600">
                                            {distance} km
                                        </span>
                                    </p>
                                )}

                            </button>
                        );
                    })}

                </div>

            ) : (

                <EmptyInformation
                    title="No Nearby Wells"
                    message="No nearby well information was returned for this query."
                />

            )}

        </div>
    );
}

// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
    label,
    value,
    icon: Icon,
    iconClass,
    large = false,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p
                        className={`mt-2 break-words font-black ${
                            large
                                ? "text-xl text-violet-700"
                                : "text-base text-slate-900"
                        }`}
                    >
                        {value}
                    </p>

                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon className="h-5 w-5" />
                </div>

            </div>

        </div>
    );
}

// ============================================================
// EMPTY INFORMATION
// ============================================================

function EmptyInformation({
    title,
    message,
}) {
    return (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 px-6 py-10 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Search className="h-6 w-6 text-slate-300" />
            </div>

            <h4 className="mt-4 text-base font-black text-slate-800">
                {title}
            </h4>

            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                {message}
            </p>

        </div>
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

            <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">

                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p
                        className={`mt-2 break-words text-xl font-black tracking-tight ${valueClass}`}
                    >
                        {value}
                    </p>

                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                        {description}
                    </p>

                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon className="h-5 w-5" />
                </div>

            </div>

        </div>
    );
}

// ============================================================
// CONTEXT ITEM
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

export default AnalysisResults;