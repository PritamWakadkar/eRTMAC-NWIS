import {
    Activity,
    CheckCircle2,
    Database,
    FileSearch,
    Gauge,
    Info,
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
// FORMAT EVENT CATEGORY
// ============================================================

function formatEventCategory(eventType) {
    if (!eventType) {
        return "drilling";
    }

    const value = String(eventType).toLowerCase();

    if (value.includes("mud")) {
        return "mud-loss";
    }

    if (value.includes("torque")) {
        return "torque-related";
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
        if (
            depth.start !== undefined &&
            depth.end !== undefined
        ) {
            return `${Number(depth.start).toLocaleString()}–${Number(
                depth.end
            ).toLocaleString()} ${depth.unit || "m MD"}`;
        }

        if (
            depth.start_depth !== undefined &&
            depth.end_depth !== undefined
        ) {
            return `${Number(
                depth.start_depth
            ).toLocaleString()}–${Number(
                depth.end_depth
            ).toLocaleString()} m MD`;
        }

        if (depth.value !== undefined) {
            return `${Number(depth.value).toLocaleString()} ${depth.unit || "m MD"
                }`;
        }

        if (depth.depth !== undefined) {
            return `${depth.depth} m MD`;
        }
    }

    return String(depth);
}


// ============================================================
// GET EVENT DEPTH
// ============================================================

function getEventDepth(event) {
    if (!event) {
        return null;
    }

    return (
        event.event_depth_m ??
        event.depth ??
        event.requested_depth_m ??
        null
    );
}


// ============================================================
// GET EVENT WELL ID
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
// GET EVENT TYPE
// ============================================================

function getEventRawType(event) {
    if (!event) {
        return "";
    }

    return String(
        event.event_type ||
        event.event ||
        ""
    )
        .trim()
        .toLowerCase();
}


function getEventType(event) {
    return formatEventType(getEventRawType(event));
}


// ============================================================
// GET EVENT MEASUREMENT
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
// GET EVENT EVIDENCE
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
// NORMALIZE TEXT
// ============================================================

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


// ============================================================
// UNIQUE EVENT KEY
// ============================================================
//
// IMPORTANT:
// Same well + same event + same depth = same drilling event.
//
// We intentionally do NOT use the complete evidence text in the
// key because the backend may return the same event with slightly
// different evidence text.
//

function getEventUniqueKey(event) {
    const wellId = normalizeText(
        getEventWellId(event)
    );

    const eventType = normalizeText(
        getEventRawType(event)
    );

    const depth = normalizeText(
        getEventDepth(event)
    );

    return [
        wellId,
        eventType,
        depth,
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
        if (!event || typeof event !== "object") {
            continue;
        }

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
// EVENT STYLE
// ============================================================

function getEventStyle(event) {
    const value = getEventRawType(event);

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
        historical_interval_analysis: "Historical Interval Analysis",
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
            "Detailed well intelligence retrieved from the available records.",

        nearby_well_analysis:
            "Nearby wells and their relevant drilling information.",

        historical_interval_analysis:
            "Historical drilling interval information retrieved from available evidence.",

        general_well_query:
            "Information retrieved from the available well intelligence.",
    };

    return (
        descriptions[route] ||
        "Information retrieved from the available well intelligence."
    );
}


// ============================================================
// BUILD EVENT AI SUMMARY
// ============================================================
//
// THIS IS THE IMPORTANT FIX.
//
// For event_analysis we NEVER display the backend ai_summary.
// Instead we generate the visible summary from unique events.
//

function buildEventAISummary(
    events,
    eventType
) {
    const uniqueEvents = getUniqueEvents(events);

    if (uniqueEvents.length === 0) {
        return (
            `No ${formatEventCategory(eventType)} events ` +
            "were found in the available drilling evidence."
        );
    }

    const uniqueWellIds = [
        ...new Set(
            uniqueEvents
                .map(getEventWellId)
                .filter(Boolean)
        ),
    ];

    const category = formatEventCategory(
        eventType
    );

    const lines = uniqueEvents
        .map((event) => {
            const wellId =
                getEventWellId(event);

            const evidence =
                getEvidence(event);

            if (wellId && evidence) {
                return `${wellId} — ${evidence}`;
            }

            return evidence;
        })
        .filter(Boolean);

    return [
        `${uniqueWellIds.length} well(s) had ${category} events:`,
        ...lines,
    ].join("\n\n");
}


// ============================================================
// GET GENERAL AI SUMMARY
// ============================================================

function getGeneralAISummary(
    result,
    analysis
) {
    const candidates = [
        result?.ai_summary,
        analysis?.ai_summary,
        result?.structured_summary,
        result?.summary,
        analysis?.summary,
    ];

    for (const value of candidates) {
        if (
            typeof value === "string" &&
            value.trim()
        ) {
            return value.trim();
        }
    }

    return "";
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
        "general_well_query";


    // ========================================================
    // EVENTS
    // ========================================================

    const rawEvents =
        Array.isArray(result.matched_events)
            ? result.matched_events
            : Array.isArray(result.events)
                ? result.events
                : [];

    const matchedEvents =
        getUniqueEvents(rawEvents);


    // ========================================================
    // MATCHED WELLS
    // ========================================================

    const matchedWells = [
        ...new Set(
            (
                Array.isArray(result.matched_wells)
                    ? result.matched_wells
                    : []
            ).filter(Boolean)
        ),
    ];


    // ========================================================
    // NEARBY WELLS
    // ========================================================

    const nearbyWellsRaw =
        result.nearby_wells ||
        result.nearbyWells ||
        result.nearby ||
        [];

    const nearbyWells =
        Array.isArray(nearbyWellsRaw)
            ? nearbyWellsRaw
            : [];


    // ========================================================
    // QUERY PARAMETERS
    // ========================================================

    const queryWell =
        query.well_id ||
        result.well_id ||
        result.target_well ||
        null;

    const queryDepth =
        query.depth ||
        query.depth_range ||
        result.requested_depth ||
        result.requested_depth_range ||
        null;

    const eventType =
        query.event_type ||
        result.event_type ||
        null;


    // ========================================================
    // WELL INFORMATION
    // ========================================================

    const wellInformation =
        result.well_information ||
        result.well ||
        result;

    const wellInformationId =
        wellInformation?.well_id ||
        queryWell ||
        null;

    const latitude =
        result.latitude ??
        result.target_latitude ??
        wellInformation?.latitude ??
        wellInformation?.lat ??
        null;

    const longitude =
        result.longitude ??
        result.target_longitude ??
        wellInformation?.longitude ??
        wellInformation?.lon ??
        null;

    const totalDepth =
        result.total_depth_m ??
        result.total_depth ??
        result.target_total_depth ??
        wellInformation?.total_depth_m ??
        wellInformation?.total_depth ??
        null;

    const formation =
        result.formation ||
        result.formation_name ||
        result.formation_used ||
        result.target_formation ||
        wellInformation?.formation ||
        null;


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
    // WELL COUNT
    // ========================================================

    let wellCount =
        displayWellIds.length;

    if (
        route === "well_information" &&
        wellInformationId
    ) {
        wellCount = 1;
    }

    if (
        route === "formation_analysis" &&
        queryWell
    ) {
        wellCount = 1;
    }

    if (
        route === "nearby_well_analysis" &&
        nearbyWells.length > 0
    ) {
        wellCount = nearbyWells.length;
    }


    // ========================================================
    // EVENT COUNT
    // ========================================================

    const eventCount =
        matchedEvents.length;


    // ========================================================
    // DISPLAY WELL
    // ========================================================

    let displayWell = "N/A";

    if (queryWell) {
        displayWell = queryWell;
    } else if (displayWellIds.length > 0) {
        displayWell =
            displayWellIds.join(", ");
    }


    // ========================================================
    // DISPLAY DEPTH
    // ========================================================

    let displayDepth = "N/A";

    if (queryDepth) {
        displayDepth =
            formatDepth(queryDepth) ||
            "N/A";
    } else if (matchedEvents.length > 0) {
        const depths =
            matchedEvents
                .map((event) =>
                    formatDepth(
                        getEventDepth(event)
                    )
                )
                .filter(Boolean);

        if (depths.length > 0) {
            displayDepth =
                depths.join(" • ");
        }
    }


    // ========================================================
    // AI SUMMARY
    // ========================================================
    //
    // IMPORTANT:
    //
    // EVENT ANALYSIS:
    //     Build from unique events.
    //
    // OTHER ROUTES:
    //     Use backend AI summary.
    //

    let aiSummary = "";

    if (
        route === "event_analysis" ||
        route === "depth_event_analysis" ||
        route === "historical_interval_analysis"
    ) {
        aiSummary =
            buildEventAISummary(
                matchedEvents,
                eventType
            );
    } else {
        aiSummary =
            getGeneralAISummary(
                result,
                analysis
            );
    }


    // ========================================================
    // FALLBACK SUMMARY
    // ========================================================

    let summaryText =
        aiSummary;

    if (
        !summaryText &&
        route === "formation_analysis" &&
        formation
    ) {
        summaryText =
            `${queryWell || "The well"} used ${formation}.`;
    }

    if (
        !summaryText &&
        route === "well_information" &&
        wellInformationId
    ) {
        summaryText =
            `${wellInformationId} well information was retrieved successfully.`;
    }

    if (
        !summaryText &&
        matchedEvents.length > 0
    ) {
        summaryText =
            `${matchedEvents.length} drilling event(s) were found.`;
    }

    if (!summaryText) {
        summaryText =
            "No matching evidence was found for the requested analysis.";
    }


    // ========================================================
    // EVIDENCE STATUS
    // ========================================================

    const hasEvidence =
        Boolean(summaryText) ||
        Boolean(formation) ||
        Boolean(wellInformationId) ||
        matchedEvents.length > 0 ||
        matchedWells.length > 0 ||
        nearbyWells.length > 0;


    // ========================================================
    // EVENT ROUTES
    // ========================================================

    const isEventRoute =
        route === "event_analysis" ||
        route === "depth_event_analysis" ||
        route === "historical_interval_analysis";


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <section className="mt-10">

            {/* ==================================================
                PAGE HEADER
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
                            {analysis.success === false
                                ? "Failed"
                                : "Completed"}
                        </p>

                    </div>

                </div>

            </div>


            {/* ==================================================
                MAIN CARD
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

                            <div className="max-w-4xl">

                                <div className="flex items-center gap-2">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                                        <FileSearch className="h-4 w-4 text-blue-200" />
                                    </div>

                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">
                                        Intelligence Summary
                                    </span>

                                </div>

                              
                            </div>

                            

                        </div>

                    </div>

                </div>

                {/* ==================================================
                    STATISTICS
                ================================================== */}

                <div className="grid border-b border-slate-100 sm:grid-cols-3">

                    <StatCard
                        icon={Activity}
                        label="Events Detected"
                        value={
                            isEventRoute
                                ? eventCount
                                : "—"
                        }
                        description={
                            isEventRoute
                                ? "Operational events"
                                : "Not applicable"
                        }
                        iconClass="bg-cyan-50 text-cyan-600"
                        valueClass="text-cyan-700"
                    />

                    <StatCard
                        icon={MapPin}
                        label="Wells"
                        value={wellCount}
                        description="Relevant wells"
                        iconClass="bg-indigo-50 text-indigo-600"
                        valueClass="text-indigo-700"
                    />

                    <StatCard
                        icon={Search}
                        label="Evidence Status"
                        value={
                            hasEvidence
                                ? "Found"
                                : "None"
                        }
                        description="Retrieved evidence"
                        iconClass={
                            hasEvidence
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-slate-100 text-slate-500"
                        }
                        valueClass={
                            hasEvidence
                                ? "text-emerald-700"
                                : "text-slate-500"
                        }
                    />

                </div>


                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="p-6 sm:p-8">


                    {/* ==================================================
                        AI RESPONSE
                    ================================================== */}

                    {aiSummary && (
                        <AIResponseSection
                            summary={aiSummary}
                        />
                    )}


                    {/* ==================================================
                        FORMATION
                    ================================================== */}

                    {route === "formation_analysis" && (
                        <FormationSection
                            wellId={queryWell}
                            formation={formation}
                            source={result.source}
                        />
                    )}


                    {/* ==================================================
                        WELL INFORMATION
                    ================================================== */}

                    {route === "well_information" && (
                        <WellInformationSection
                            wellId={wellInformationId}
                            formation={formation}
                            latitude={latitude}
                            longitude={longitude}
                            totalDepth={totalDepth}
                            result={result}
                        />
                    )}


                    {/* ==================================================
                        EVENT ANALYSIS
                    ================================================== */}

                    {isEventRoute && (
                        <EventSection
                            events={matchedEvents}
                            eventCount={eventCount}
                            onSelectWell={onSelectWell}
                        />
                    )}


                    {/* ==================================================
                        NEARBY WELL ANALYSIS
                    ================================================== */}

                    {route === "nearby_well_analysis" && (
                        <NearbyWellSection
                            nearbyWells={nearbyWells}
                            matchedWells={matchedWells}
                            events={matchedEvents}
                            onSelectWell={onSelectWell}
                        />
                    )}


                    {/* ==================================================
                        GENERAL ANALYSIS
                    ================================================== */}

                    {route === "general_well_query" && (
                        <GeneralAnalysisSection
                            result={result}
                            formation={formation}
                            wellId={queryWell}
                            events={matchedEvents}
                            nearbyWells={nearbyWells}
                        />
                    )}


                    {/* ==================================================
                        NEARBY WELLS FOR WELL INFORMATION
                    ================================================== */}

                    {route === "well_information" &&
                        nearbyWells.length > 0 && (
                            <div className="mt-8">

                                <NearbyWellCards
                                    nearbyWells={nearbyWells}
                                    onSelectWell={onSelectWell}
                                />

                            </div>
                        )}


                    {/* ==================================================
                        QUERY CONTEXT
                    ================================================== */}

                    <QueryContext
                        route={route}
                        displayWell={displayWell}
                        displayDepth={displayDepth}
                        eventType={eventType}
                    />

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
                    Results are generated from indexed drilling
                    evidence and available well records. AI summaries
                    remain grounded in retrieved evidence.
                </p>

            </div>

        </section>
    );
}


// ============================================================
// AI RESPONSE SECTION
// ============================================================

function AIResponseSection({
    summary,
}) {
    return (
        <section className="mb-8 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">

            <div className="border-b border-indigo-100 bg-white/70 px-5 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-100">

                        <Sparkles className="h-5 w-5 text-white" />

                    </div>

                    <div>

                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600">
                            AI Intelligence
                        </p>

                        <h3 className="mt-1 text-lg font-black text-slate-900">
                            AI Generated Response
                        </h3>

                    </div>

                </div>

            </div>


            <div className="p-6">

                <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">

                    <p className="whitespace-pre-line text-sm font-medium leading-8 text-slate-700">
                        {summary}
                    </p>

                </div>

            </div>

        </section>
    );
}


// ============================================================
// FORMATION SECTION
// ============================================================

function FormationSection({
    wellId,
    formation,
    source,
}) {
    return (
        <section>

            <div className="mb-5 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">

                    <Target className="h-5 w-5 text-white" />

                </div>

                <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-500">
                        Geological Information
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                        Formation Information
                    </h3>

                </div>

            </div>


            {formation ? (

                <div className="grid gap-5 md:grid-cols-2">

                    <InfoCard
                        label="Well"
                        value={wellId || "N/A"}
                    />

                    <InfoCard
                        label="Formation"
                        value={formation}
                    />

                    {source && (
                        <InfoCard
                            label="Source"
                            value={source}
                        />
                    )}

                </div>

            ) : (

                <EmptyState
                    title="Formation Not Available"
                    description="No formation information was found for this well."
                />

            )}

        </section>
    );
}


// ============================================================
// WELL INFORMATION SECTION
// ============================================================

function WellInformationSection({
    wellId,
    formation,
    latitude,
    longitude,
    totalDepth,
    result,
}) {
    const events = getUniqueEvents(
        Array.isArray(result?.events)
            ? result.events
            : Array.isArray(result?.matched_events)
                ? result.matched_events
                : []
    );

    return (
        <section>

            <div className="mb-5 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-100">

                    <Info className="h-5 w-5 text-white" />

                </div>

                <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-500">
                        Well Record
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                        Well Information
                    </h3>

                </div>

            </div>


            <p className="mb-5 text-sm text-slate-500">
                Detailed information retrieved from available
                well records and drilling evidence.
            </p>


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <InfoCard
                    label="Well ID"
                    value={wellId || "N/A"}
                />

                <InfoCard
                    label="Formation"
                    value={formation || "N/A"}
                />

                <InfoCard
                    label="Total Depth"
                    value={
                        totalDepth !== null &&
                            totalDepth !== undefined
                            ? `${Number(totalDepth).toLocaleString()} m`
                            : "N/A"
                    }
                />

                <InfoCard
                    label="Coordinates"
                    value={
                        latitude !== null &&
                            latitude !== undefined &&
                            longitude !== null &&
                            longitude !== undefined
                            ? `${latitude}, ${longitude}`
                            : "N/A"
                    }
                />

            </div>


            {(latitude !== null ||
                longitude !== null) && (

                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">

                                <MapPin className="h-5 w-5 text-blue-600" />

                            </div>

                            <div>

                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                                    Well Location
                                </p>

                                <p className="mt-1 text-sm font-black text-slate-800">
                                    {latitude}, {longitude}
                                </p>

                            </div>

                        </div>

                    </div>
                )}


            {events.length > 0 && (

                <div className="mt-8">

                    <div className="mb-4">

                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-500">
                            Drilling Evidence
                        </p>

                        <h4 className="mt-1 text-lg font-black text-slate-900">
                            Recorded Drilling Events
                        </h4>

                    </div>

                    <EventMiniList events={events} />

                </div>
            )}

        </section>
    );
}


// ============================================================
// EVENT MINI LIST
// ============================================================

function EventMiniList({
    events,
}) {
    return (
        <div className="space-y-3">

            {events.map((event, index) => {

                const style =
                    getEventStyle(event);

                const EventIcon =
                    style.icon;

                return (
                    <div
                        key={
                            getEventUniqueKey(event) ||
                            `well-event-${index}`
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                    >

                        <div className="flex items-start gap-4">

                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
                            >

                                <EventIcon
                                    className={`h-5 w-5 ${style.iconColor}`}
                                />

                            </div>


                            <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-2">

                                    <span
                                        className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase ${style.badge}`}
                                    >
                                        {getEventType(event)}
                                    </span>

                                    <span className="text-xs font-bold text-slate-500">
                                        {formatDepth(
                                            getEventDepth(event)
                                        ) || "Depth N/A"}
                                    </span>

                                </div>


                                <p className="mt-3 text-sm leading-6 text-slate-700">
                                    {getEvidence(event)}
                                </p>


                                <p className="mt-2 text-xs font-bold text-slate-500">
                                    Measurement:{" "}
                                    {getMeasurement(event)}
                                </p>

                            </div>

                        </div>

                    </div>
                );
            })}

        </div>
    );
}


// ============================================================
// EVENT SECTION
// ============================================================

function EventSection({
    events,
    eventCount,
    onSelectWell,
}) {
    return (
        <section>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                <div>

                    <div className="flex items-center gap-2">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400">

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


                {eventCount > 0 && (
                    <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-600">
                        {eventCount}{" "}
                        {eventCount === 1
                            ? "Event"
                            : "Events"}
                    </span>
                )}

            </div>


            {eventCount > 0 ? (

                <div className="space-y-4">

                    {events.map((event, index) => {

                        const wellId =
                            getEventWellId(event);

                        const depth =
                            formatDepth(
                                getEventDepth(event)
                            );

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
                                    getEventUniqueKey(event) ||
                                    `event-${index}`
                                }
                                className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-lg"
                            >

                                <div className="flex flex-col gap-5 sm:flex-row">

                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.iconBg}`}
                                    >

                                        <EventIcon
                                            className={`h-5 w-5 ${style.iconColor}`}
                                        />

                                    </div>


                                    <div className="min-w-0 flex-1">

                                        <div className="flex flex-wrap items-center gap-2">

                                            {wellId && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onSelectWell?.({
                                                            well_id: wellId,
                                                        })
                                                    }
                                                    className="rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white hover:bg-slate-700"
                                                >
                                                    {wellId}
                                                </button>
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

                                                <div className="my-3 h-px bg-slate-200" />

                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Measurement
                                                </p>

                                                <p className="mt-1 text-xs font-bold text-slate-700">
                                                    {measurement}
                                                </p>

                                            </div>


                                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

                                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                                                    Evidence
                                                </p>

                                                <p className="mt-3 text-sm leading-7 text-slate-700">
                                                    {evidence}
                                                </p>

                                                {event.document && (
                                                    <p className="mt-3 text-[10px] font-bold text-slate-400">
                                                        Source:{" "}
                                                        {event.document}
                                                        {event.page
                                                            ? ` • Page ${event.page}`
                                                            : ""}
                                                    </p>
                                                )}

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>
                        );
                    })}

                </div>

            ) : (

                <EmptyState
                    title="No Matching Events"
                    description="The available drilling evidence did not contain an event matching this query."
                />

            )}

        </section>
    );
}


// ============================================================
// NEARBY WELL SECTION
// ============================================================

function NearbyWellSection({
    nearbyWells,
    matchedWells,
    events,
    onSelectWell,
}) {
    const hasNearby =
        nearbyWells.length > 0;

    const hasMatched =
        matchedWells.length > 0;

    return (
        <section>

            <div className="mb-5 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500">

                    <MapPin className="h-5 w-5 text-white" />

                </div>

                <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-500">
                        Spatial Analysis
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                        Nearby Wells
                    </h3>

                </div>

            </div>


            {hasNearby ? (

                <NearbyWellCards
                    nearbyWells={nearbyWells}
                    onSelectWell={onSelectWell}
                />

            ) : hasMatched ? (

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                    {matchedWells.map((wellId) => (

                        <button
                            key={wellId}
                            type="button"
                            onClick={() =>
                                onSelectWell?.({
                                    well_id: wellId,
                                })
                            }
                            className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-5 text-left transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
                        >

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">

                                <MapPin className="h-5 w-5 text-indigo-600" />

                            </div>

                            <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                Nearby Well
                            </p>

                            <p className="mt-1 text-xl font-black text-indigo-800">
                                {wellId}
                            </p>

                        </button>

                    ))}

                </div>

            ) : events.length > 0 ? (

                <EventSection
                    events={events}
                    eventCount={events.length}
                    onSelectWell={onSelectWell}
                />

            ) : (

                <EmptyState
                    title="No Nearby Wells Found"
                    description="The backend did not return any nearby well records for this analysis."
                />

            )}

        </section>
    );
}


// ============================================================
// NEARBY WELL CARDS
// ============================================================

function NearbyWellCards({
    nearbyWells,
    onSelectWell,
}) {
    return (
        <div>

            <div className="mb-4 flex items-center justify-between">

                <div>

                    <p className="text-sm font-black text-slate-800">
                        Nearby Well Records
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Spatially related wells returned by PostGIS.
                    </p>

                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-black text-indigo-600">
                    {nearbyWells.length} wells
                </span>

            </div>


            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {nearbyWells.map((well, index) => {

                    const wellId =
                        well.well_id ||
                        well.id ||
                        well.name ||
                        `Well ${index + 1}`;

                    const distance =
                        well.distance_km ??
                        well.distance ??
                        null;

                    const wellFormation =
                        well.formation ||
                        well.target_formation ||
                        "N/A";

                    const depth =
                        well.total_depth ??
                        well.total_depth_m ??
                        null;

                    const lat =
                        well.latitude ??
                        well.lat ??
                        null;

                    const lng =
                        well.longitude ??
                        well.lon ??
                        null;

                    return (

                        <button
                            key={`${wellId}-${index}`}
                            type="button"
                            onClick={() =>
                                onSelectWell?.(well)
                            }
                            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50"
                        >

                            <div className="flex items-start justify-between">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">

                                    <MapPin className="h-5 w-5 text-indigo-600" />

                                </div>

                                <span className="text-indigo-300 transition-transform group-hover:translate-x-1">
                                    →
                                </span>

                            </div>


                            <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                Nearby Well
                            </p>

                            <p className="mt-1 text-xl font-black text-slate-900">
                                {wellId}
                            </p>


                            <div className="mt-4 space-y-2">

                                <NearbyValue
                                    label="Distance"
                                    value={
                                        distance !== null
                                            ? `${distance} km`
                                            : "N/A"
                                    }
                                />

                                <NearbyValue
                                    label="Formation"
                                    value={wellFormation}
                                />

                                <NearbyValue
                                    label="Total Depth"
                                    value={
                                        depth !== null
                                            ? `${depth} m`
                                            : "N/A"
                                    }
                                />

                                {lat !== null &&
                                    lng !== null && (
                                        <NearbyValue
                                            label="Coordinates"
                                            value={`${lat}, ${lng}`}
                                        />
                                    )}

                            </div>

                        </button>
                    );
                })}

            </div>

        </div>
    );
}


// ============================================================
// NEARBY VALUE
// ============================================================

function NearbyValue({
    label,
    value,
}) {
    return (
        <div className="flex items-start justify-between gap-3 border-t border-slate-100 pt-2">

            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                {label}
            </span>

            <span className="max-w-[65%] text-right text-xs font-bold text-slate-700">
                {value}
            </span>

        </div>
    );
}


// ============================================================
// GENERAL ANALYSIS
// ============================================================

function GeneralAnalysisSection({
    result,
    formation,
    wellId,
    events,
    nearbyWells,
}) {
    const hasInformation =
        formation ||
        wellId ||
        events.length > 0 ||
        nearbyWells.length > 0 ||
        result?.summary ||
        result?.ai_summary ||
        result?.structured_summary;

    if (!hasInformation) {
        return (
            <EmptyState
                title="No Matching Evidence"
                description="The available drilling evidence did not contain information matching this query."
            />
        );
    }

    return (
        <section>

            <div className="mb-5 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">

                    <Database className="h-5 w-5 text-white" />

                </div>

                <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-500">
                        Well Intelligence
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                        Retrieved Information
                    </h3>

                </div>

            </div>


            <div className="grid gap-4 sm:grid-cols-2">

                {wellId && (
                    <InfoCard
                        label="Well"
                        value={wellId}
                    />
                )}

                {formation && (
                    <InfoCard
                        label="Formation"
                        value={formation}
                    />
                )}

            </div>


            {events.length > 0 && (
                <div className="mt-6">

                    <EventMiniList
                        events={events}
                    />

                </div>
            )}


            {nearbyWells.length > 0 && (
                <div className="mt-6">

                    <NearbyWellCards
                        nearbyWells={nearbyWells}
                    />

                </div>
            )}

        </section>
    );
}


// ============================================================
// QUERY CONTEXT
// ============================================================

function QueryContext({
    route,
    displayWell,
    displayDepth,
    eventType,
}) {
    return (
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
    );
}


// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
    label,
    value,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                {label}
            </p>

            <p className="mt-2 break-words text-lg font-black text-slate-900">
                {value || "N/A"}
            </p>

        </div>
    );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
    title,
    description,
}) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 px-6 py-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">

                <Search className="h-7 w-7 text-slate-300" />

            </div>

            <h4 className="mt-5 text-base font-black text-slate-800">
                {title}
            </h4>

            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                {description}
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


// ============================================================
// EXPORT
// ============================================================

export default AnalysisResults;