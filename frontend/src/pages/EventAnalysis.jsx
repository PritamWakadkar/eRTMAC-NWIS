import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
    Activity,
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Database,
    FileSearch,
    Filter,
    MapPin,
    Search,
    Sparkles,
    Target,
    Waves,
    Zap,
    Gauge,
    FileText,
    Loader2,
    X,
} from "lucide-react";

import { analyzeWell } from "../services/api";
import { loadAnalysis, saveAnalysis } from "../services/analisisStorage";


// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_RADIUS_KM = 10;
const DEFAULT_DEPTH_TOLERANCE = 200;

// Quick-start questions. These are only question text sent to the
// backend; no well IDs or results are hardcoded in the UI logic.
const QUICK_QUESTIONS = [
    { label: "Mud loss", question: "Which wells had mud loss events?" },
    { label: "Torque", question: "Which wells had torque-related events?" },
    { label: "Drag", question: "Which wells had drag-related events?" },
    { label: "Wiper trip", question: "Which wells had wiper trip events?" },
];


// ============================================================
// EVENT NAME NORMALIZATION
// ============================================================

function normalizeEventName(eventName) {
    if (!eventName) return "Unknown Event";

    const value = String(eventName).trim().toLowerCase().replace(/-/g, "_");

    const eventMap = {
        mud_loss: "Mud Loss",
        mudloss: "Mud Loss",
        lost_circulation: "Mud Loss",
        torque_spike: "Torque Spike",
        torque_increase: "Torque Increase",
        drag: "Drag",
        drag_increase: "Drag Increase",
        wiper_trip: "Wiper Trip",
        normal: "Normal",
    };

    if (eventMap[value]) return eventMap[value];

    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}


// ============================================================
// EVENT CATEGORY / ICON / STYLE
// ============================================================

function getEventCategory(eventName) {
    const value = String(eventName || "").toLowerCase();

    if (value.includes("mud") || value.includes("lost_circ")) return "mud_loss";
    if (value.includes("torque")) return "torque";
    if (value.includes("drag")) return "drag";
    if (value.includes("wiper")) return "wiper_trip";

    return "other";
}

function getEventIcon(eventName) {
    const category = getEventCategory(eventName);

    if (category === "mud_loss") return Waves;
    if (category === "torque") return Zap;
    if (category === "drag") return Gauge;
    if (category === "wiper_trip") return Target;

    return Activity;
}

const EVENT_STYLES = {
    mud_loss: {
        iconBg: "bg-cyan-100",
        iconColor: "text-cyan-700",
        badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    torque: {
        iconBg: "bg-orange-100",
        iconColor: "text-orange-700",
        badge: "border-orange-200 bg-orange-50 text-orange-700",
    },
    drag: {
        iconBg: "bg-purple-100",
        iconColor: "text-purple-700",
        badge: "border-purple-200 bg-purple-50 text-purple-700",
    },
    wiper_trip: {
        iconBg: "bg-violet-100",
        iconColor: "text-violet-700",
        badge: "border-violet-200 bg-violet-50 text-violet-700",
    },
    other: {
        iconBg: "bg-blue-100",
        iconColor: "text-blue-700",
        badge: "border-blue-200 bg-blue-50 text-blue-700",
    },
};

function getEventStyle(eventName) {
    return EVENT_STYLES[getEventCategory(eventName)] || EVENT_STYLES.other;
}


// ============================================================
// FIELD ACCESSORS
// ============================================================

function getWellId(event, parentWell = null) {
    if (!event) return parentWell || null;

    return (
        event.well_id ||
        event.wellId ||
        event.well ||
        event.well_name ||
        parentWell ||
        null
    );
}

function getEventName(event) {
    if (!event) return "Unknown Event";

    return (
        event.event_type ||
        event.event ||
        event.type ||
        event.event_name ||
        "Unknown Event"
    );
}

function getDepth(event) {
    if (!event) return null;

    return (
        event.depth ??
        event.depth_m ??
        event.event_depth ??
        event.event_depth_m ??
        event.measured_depth ??
        event.md ??
        event.requested_depth ??
        event.requested_depth_m ??
        null
    );
}

function formatDepth(depth) {
    if (depth === null || depth === undefined || depth === "") {
        return "Not specified";
    }

    if (typeof depth === "number") {
        return `${depth.toLocaleString()} m MD`;
    }

    if (typeof depth === "object") {
        if (depth.start !== undefined && depth.end !== undefined) {
            return `${Number(depth.start).toLocaleString()}–${Number(
                depth.end
            ).toLocaleString()} m MD`;
        }

        if (depth.start_depth !== undefined && depth.end_depth !== undefined) {
            return `${Number(depth.start_depth).toLocaleString()}–${Number(
                depth.end_depth
            ).toLocaleString()} m MD`;
        }

        if (depth.value !== undefined) {
            return `${Number(depth.value).toLocaleString()} m MD`;
        }

        if (depth.depth !== undefined) {
            return `${depth.depth} m MD`;
        }
    }

    return String(depth);
}

function getMeasurement(event) {
    if (!event) return "Not specified";

    return (
        event.measurement ||
        event.value ||
        event.measurement_value ||
        "Not specified"
    );
}

function getEvidence(event) {
    if (!event) return "No evidence available.";

    return (
        event.evidence ||
        event.description ||
        event.text ||
        event.details ||
        "No evidence available."
    );
}

function getDocument(event) {
    if (!event) return null;

    return (
        event.document ||
        event.document_name ||
        event.file_name ||
        event.source ||
        null
    );
}

function getPage(event) {
    if (!event) return null;

    return event.page || event.page_number || event.source_page || null;
}


// ============================================================
// UNIQUE KEY (front-end safety net only; the backend must
// deduplicate before generating summaries)
// ============================================================

function getEventUniqueKey(event, parentWell = null) {
    const norm = (value) => String(value ?? "").trim().toLowerCase();
    const depth = getDepth(event);

    return [
        norm(getWellId(event, parentWell)),
        norm(getEventCategory(getEventName(event))),
        norm(typeof depth === "object" ? JSON.stringify(depth) : depth),
        norm(getDocument(event)),
        norm(getPage(event)),
    ].join("|");
}


// ============================================================
// EVENT COLLECTION
// ============================================================

const NESTED_EVENT_KEYS = [
    "events",
    "matched_events",
    "event_results",
    "nearby_events",
    "drilling_events",
    "recorded_events",
    "historical_events",
    "results",
];

function looksLikeEvent(source) {
    return Boolean(
        source.event ||
            source.event_type ||
            source.event_name
    );
}

function collectEvents(source, output, parentWell = null) {
    if (!source) return;

    if (Array.isArray(source)) {
        source.forEach((item) => {
            if (item && typeof item === "object") {
                collectEvents(item, output, parentWell);
            }
        });
        return;
    }

    if (typeof source !== "object") return;

    const ownWell = source.well_id || source.wellId || parentWell;

    if (looksLikeEvent(source)) {
        output.push({
            ...source,
            well_id: source.well_id || source.wellId || parentWell || undefined,
        });
    }

    NESTED_EVENT_KEYS.forEach((key) => {
        if (Array.isArray(source[key])) {
            collectEvents(source[key], output, ownWell);
        }
    });

    if (Array.isArray(source.nearby_wells)) {
        collectEvents(source.nearby_wells, output, ownWell);
    }
}

function extractAllEvents(result) {
    if (!result) return [];

    const collected = [];
    const parentWell = result.well_id || null;

    // A top-level object with nested containers is handled by the
    // recursive collector.
    collectEvents(result, collected, parentWell);

    if (result.well_information) {
        collectEvents(result.well_information, collected, parentWell);
    }

    const seen = new Set();
    const unique = [];

    collected.forEach((event) => {
        const key = getEventUniqueKey(event);
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(event);
    });

    return unique;
}


// ============================================================
// SUMMARY TEXT
// ============================================================

// The one canonical AI response is result.ai_summary.
function getAISummary(analysis, result) {
    const candidates = [
        result?.ai_summary,
        result?.ai_response,
        result?.generated_response,
        analysis?.ai_summary,
        analysis?.ai_response,
        analysis?.generated_response,
    ];

    for (const value of candidates) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }

    return "";
}

function getStructuredSummary(result) {
    const value = result?.structured_summary;
    return typeof value === "string" && value.trim() ? value.trim() : "";
}

// Builds ONE line per well from the structured event records, e.g.
// "Mud Loss @ 2,410 m MD (4–6 m³/hr); Torque Increase @ 2,465 m MD (9 → 14 kN·m)"
function buildWellLines(events) {
    const byWell = new Map();

    events.forEach((event) => {
        const well = String(getWellId(event) || "Unknown").toUpperCase();
        if (!byWell.has(well)) byWell.set(well, []);
        byWell.get(well).push(event);
    });

    const depthOf = (event) => {
        const depth = getDepth(event);

        if (typeof depth === "number") return depth;

        if (depth && typeof depth === "object") {
            return Number(depth.start ?? depth.start_depth ?? depth.value ?? 0);
        }

        return Number(depth) || 0;
    };

    return Array.from(byWell.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([well, list]) => {
            const parts = [...list]
                .sort((a, b) => depthOf(a) - depthOf(b))
                .map((event) => {
                    const depth = getDepth(event);
                    const measurement = getMeasurement(event);
                    let text = normalizeEventName(getEventName(event));

                    if (depth !== null && depth !== undefined && depth !== "") {
                        text += ` @ ${formatDepth(depth)}`;
                    }

                    if (measurement && measurement !== "Not specified") {
                        text += ` (${measurement})`;
                    }

                    return text;
                });

            return { well, count: list.length, line: parts.join("; ") };
        });
}

function summaryLines(summary) {
    if (!summary) return [];

    return String(summary)
        .split("\n")
        .map((line) => line.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim())
        .filter(Boolean);
}

// Accept only objects that really look like an /analyze response.
function isAnalysisResponse(value) {
    return Boolean(
        value &&
            typeof value === "object" &&
            (value.result || value.data?.result || value.success !== undefined)
    );
}

function getApiError(error, fallbackMessage) {
    return (
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        fallbackMessage
    );
}


// ============================================================
// MAIN PAGE
// ============================================================

export default function EventAnalysis() {
    const navigate = useNavigate();
    const location = useLocation();

    // ---------------- request state ----------------
    const [question, setQuestion] = useState("");
    const [radiusKm] = useState(DEFAULT_RADIUS_KM);
    const [depthTolerance] = useState(DEFAULT_DEPTH_TOLERANCE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ---------------- analysis state ----------------
    // Priority: router state -> sessionStorage -> nothing (initial state).
    const [analysisData, setAnalysisData] = useState(() => {
        const passed = location.state?.analysis ?? location.state;
        if (isAnalysisResponse(passed)) return passed;
        return loadAnalysis();
    });

    // ---------------- explorer state ----------------
    const [searchText, setSearchText] = useState("");
    const [eventFilter, setEventFilter] = useState("all");
    const [expandedEvents, setExpandedEvents] = useState({});

    // When the user navigates here with fresh router state, adopt and
    // persist it.
    useEffect(() => {
        const passed = location.state?.analysis ?? location.state;

        if (isAnalysisResponse(passed)) {
            setAnalysisData(passed);
            saveAnalysis(passed);
        }
    }, [location.state]);

    // Restore the original question text for display, if the backend
    // echoed it.
    useEffect(() => {
        const original = analysisData?.query?.original_question;
        if (original && !question) setQuestion(original);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analysisData]);


    // ========================================================
    // RUN ANALYSIS FROM THIS PAGE
    // ========================================================

    const runAnalysis = useCallback(
        async (questionOverride) => {
            const text = String(questionOverride ?? question).trim();

            if (!text) {
                toast.error("Please enter a question.");
                return;
            }

            if (loading) return;

            try {
                setLoading(true);
                setError("");

                const response = await analyzeWell(
                    text,
                    radiusKm,
                    depthTolerance
                );

                if (!response || response.success !== true) {
                    throw new Error(
                        response?.error ||
                            response?.message ||
                            response?.detail ||
                            "Unable to analyze the well data."
                    );
                }

                setQuestion(text);
                setAnalysisData(response);
                saveAnalysis(response);

                setSearchText("");
                setEventFilter("all");
                setExpandedEvents({});
            } catch (err) {
                console.error("Event analysis error:", err);

                const message = getApiError(
                    err,
                    "Unable to connect to the analysis service."
                );

                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        },
        [question, loading, radiusKm, depthTolerance]
    );

    const runQuickQuestion = (text) => {
        setQuestion(text);
        runAnalysis(text);
    };


    // ========================================================
    // NORMALIZE RESPONSE
    // ========================================================

    const result = useMemo(() => {
        if (!analysisData) return null;

        if (analysisData.result && typeof analysisData.result === "object") {
            return analysisData.result;
        }

        if (
            analysisData.data?.result &&
            typeof analysisData.data.result === "object"
        ) {
            return analysisData.data.result;
        }

        if (analysisData.data && typeof analysisData.data === "object") {
            return analysisData.data;
        }

        return analysisData;
    }, [analysisData]);

    const route =
        analysisData?.route ||
        result?.route ||
        analysisData?.query?.intent ||
        "event_analysis";

    const allEvents = useMemo(() => extractAllEvents(result), [result]);

    const eventTypes = useMemo(() => {
        const map = new Map();

        allEvents.forEach((event) => {
            const raw = getEventName(event);
            const key = getEventCategory(raw);

            if (!map.has(key)) map.set(key, normalizeEventName(raw));
        });

        return Array.from(map.entries()).map(([key, label]) => ({
            key,
            label,
        }));
    }, [allEvents]);

    const categoryCounts = useMemo(() => {
        const counts = {
            mud_loss: 0,
            torque: 0,
            drag: 0,
            wiper_trip: 0,
            other: 0,
        };

        allEvents.forEach((event) => {
            const category = getEventCategory(getEventName(event));
            counts[category] = (counts[category] || 0) + 1;
        });

        return counts;
    }, [allEvents]);

    const filteredEvents = useMemo(() => {
        const search = searchText.trim().toLowerCase();

        return allEvents.filter((event) => {
            const eventName = getEventName(event);

            if (
                eventFilter !== "all" &&
                getEventCategory(eventName) !== eventFilter
            ) {
                return false;
            }

            if (!search) return true;

            const haystack = [
                getWellId(event),
                eventName,
                formatDepth(getDepth(event)),
                getMeasurement(event),
                getEvidence(event),
                getDocument(event),
                getPage(event),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(search);
        });
    }, [allEvents, eventFilter, searchText]);

    const uniqueWells = useMemo(() => {
        const wells = new Set();

        allEvents.forEach((event) => {
            const wellId = getWellId(event);
            if (wellId) wells.add(String(wellId).toUpperCase());
        });

        if (result?.well_id) wells.add(String(result.well_id).toUpperCase());

        if (Array.isArray(result?.matched_wells)) {
            result.matched_wells.forEach((well) => {
                if (well) wells.add(String(well).toUpperCase());
            });
        }

        return Array.from(wells).sort();
    }, [allEvents, result]);

    const documentCount = useMemo(() => {
        const documents = new Set();

        allEvents.forEach((event) => {
            const document = getDocument(event);
            if (document) documents.add(document);
        });

        return documents.size;
    }, [allEvents]);

    const aiSummary = getAISummary(analysisData, result);
    const structuredSummary = getStructuredSummary(result);

    // One canonical response card: AI summary when present, otherwise the
    // deterministic summary clearly labelled as such.
    const summaryText = aiSummary || structuredSummary;
    const summaryIsAI = Boolean(aiSummary);
    const summaryLinesList = summaryLines(summaryText);

    const wellLines = useMemo(() => buildWellLines(allEvents), [allEvents]);

    const toggleEvent = (key) => {
        setExpandedEvents((previous) => ({
            ...previous,
            [key]: !previous[key],
        }));
    };

    const clearFilters = () => {
        setSearchText("");
        setEventFilter("all");
    };

    const hasAnalysis = Boolean(analysisData && result);


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="min-h-screen bg-[#f4f7fc] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* HEADER */}
                <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[1.5px] text-blue-700">
                                <Activity size={13} />
                                Event Intelligence
                            </span>

                            {hasAnalysis && !loading && (
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[1.5px] text-emerald-700">
                                    <CheckCircle2 size={13} />
                                    Analysis Complete
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Event Analysis
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            Ask about drilling events across wells, or review
                            the last analysis. Results show wells, event types,
                            depths, measurements, evidence and source
                            documents.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/analysis")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <ArrowLeft size={17} />
                        Back to Analysis
                    </button>
                </div>


                {/* QUERY PANEL (always visible, so the page never dead-ends) */}
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-2">
                        <Search size={18} className="text-indigo-600" />
                        <h2 className="text-lg font-black text-slate-900">
                            Ask about drilling events
                        </h2>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") runAnalysis();
                            }}
                            disabled={loading}
                            placeholder="e.g. Which wells had mud loss events?"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                        />

                        <button
                            type="button"
                            onClick={() => runAnalysis()}
                            disabled={loading}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Analyzing
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Run analysis
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {QUICK_QUESTIONS.map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                disabled={loading}
                                onClick={() => runQuickQuestion(item.question)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>


                {/* ERROR */}
                {error && !loading && (
                    <div
                        role="alert"
                        className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
                    >
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0 text-red-600"
                        />

                        <div className="flex-1">
                            <p className="text-sm font-black text-red-800">
                                The analysis failed
                            </p>
                            <p className="mt-1 text-sm text-red-700">{error}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => runAnalysis()}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-black text-red-700 hover:bg-red-100"
                        >
                            Try again
                        </button>
                    </div>
                )}


                {/* LOADING */}
                {loading && (
                    <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-10 text-center shadow-sm">
                        <Loader2
                            size={32}
                            className="mx-auto animate-spin text-blue-600"
                        />
                        <p className="mt-4 text-base font-black text-slate-900">
                            Retrieving drilling events
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Searching the well reports for matching evidence.
                        </p>
                    </div>
                )}


                {/* INITIAL (no analysis yet) */}
                {!loading && !hasAnalysis && !error && (
                    <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            <FileSearch size={28} />
                        </div>

                        <h2 className="mt-5 text-xl font-black text-slate-900">
                            No analysis yet
                        </h2>

                        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                            Type a question above or pick one of the quick
                            questions to see drilling events from your well
                            reports.
                        </p>
                    </div>
                )}


                {/* RESULTS */}
                {hasAnalysis && !loading && (
                    <>
                        {/* SUMMARY */}
                        <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#101d4e] via-[#17377d] to-[#24469b] text-white shadow-xl">
                            <div className="relative p-6 sm:p-8">
                                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

                                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="max-w-4xl">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                                <FileSearch size={18} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[2px] text-blue-200">
                                                Intelligence Summary
                                            </span>
                                        </div>

                                        <h2 className="mt-5 text-2xl font-black leading-tight sm:text-3xl">
                                            {allEvents.length > 0
                                                ? `${allEvents.length} drilling event${
                                                      allEvents.length === 1 ? "" : "s"
                                                  } identified`
                                                : "No drilling events identified"}
                                        </h2>

                                        <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100">
                                            {uniqueWells.length > 0
                                                ? `${uniqueWells.length} well${
                                                      uniqueWells.length === 1 ? "" : "s"
                                                  } and ${documentCount} source document${
                                                      documentCount === 1 ? "" : "s"
                                                  } contributed to this analysis.`
                                                : "No well-specific event records were returned."}
                                        </p>
                                    </div>

                                    <div className="shrink-0 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">
                                            Query Route
                                        </p>
                                        <p className="mt-1 text-sm font-black text-white">
                                            {route}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid border-t border-white/10 sm:grid-cols-4">
                                <SummaryStat
                                    label="Events"
                                    value={allEvents.length}
                                    icon={Activity}
                                />
                                <SummaryStat
                                    label="Wells"
                                    value={uniqueWells.length}
                                    icon={MapPin}
                                />
                                <SummaryStat
                                    label="Documents"
                                    value={documentCount}
                                    icon={FileText}
                                />
                                <SummaryStat
                                    label="Evidence"
                                    value={allEvents.length > 0 ? "Found" : "None"}
                                    icon={Search}
                                />
                            </div>
                        </section>


                        {/* SUMMARY BY WELL (one line per well) */}
                        {wellLines.length > 0 && (
                            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-black text-slate-900">
                                    Summary by well
                                </h2>

                                <ul className="mt-4 divide-y divide-slate-100">
                                    {wellLines.map((item) => (
                                        <li
                                            key={item.well}
                                            className="flex items-baseline gap-3 py-3"
                                        >
                                            <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black text-white">
                                                {item.well}
                                            </span>

                                            <span
                                                className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700"
                                                title={item.line}
                                            >
                                                {item.line}
                                            </span>

                                            <span className="shrink-0 text-xs font-bold text-slate-400">
                                                {item.count}{" "}
                                                {item.count === 1 ? "event" : "events"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}


                        {/* ONE CANONICAL RESPONSE CARD */}
                        {summaryText && (
                            <section className="mt-8 overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
                                <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-cyan-50 px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-100">
                                            <Sparkles size={20} className="text-white" />
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[1.8px] text-indigo-500">
                                                {summaryIsAI
                                                    ? "AI Intelligence"
                                                    : "Structured Summary"}
                                            </p>
                                            <h2 className="mt-1 text-xl font-black text-slate-900">
                                                {summaryIsAI
                                                    ? "AI Generated Response"
                                                    : "Summary of Retrieved Events"}
                                            </h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                        <p className="text-sm leading-7 text-slate-700">
                                            {summaryLinesList.join(" ")}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                                        <FileSearch
                                            size={16}
                                            className="mt-0.5 shrink-0 text-blue-600"
                                        />
                                        <p className="text-[10px] leading-5 text-blue-700">
                                            {summaryIsAI
                                                ? "This response is grounded in retrieved drilling evidence from the indexed well reports."
                                                : "This summary is generated from the retrieved event records, not by the language model."}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}


                        {/* FILTER PANEL */}
                        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Filter size={18} className="text-indigo-600" />
                                            <h2 className="text-lg font-black text-slate-900">
                                                Event Explorer
                                            </h2>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Search and filter the retrieved drilling events.
                                        </p>
                                    </div>

                                    {(searchText || eventFilter !== "all") && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                                        >
                                            <X size={14} />
                                            Clear filters
                                        </button>
                                    )}
                                </div>

                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="text"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        placeholder="Search well, event, depth, measurement, evidence or document..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <FilterButton
                                        active={eventFilter === "all"}
                                        onClick={() => setEventFilter("all")}
                                        label={`All Events (${allEvents.length})`}
                                    />

                                    {eventTypes.map((item) => (
                                        <FilterButton
                                            key={item.key}
                                            active={eventFilter === item.key}
                                            onClick={() => setEventFilter(item.key)}
                                            label={`${item.label} (${
                                                categoryCounts[item.key] || 0
                                            })`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>


                        {/* EVENT LIST */}
                        <section className="mt-8">
                            <div className="mb-5">
                                <p className="text-[9px] font-black uppercase tracking-[1.8px] text-indigo-500">
                                    Retrieved Evidence
                                </p>
                                <h2 className="mt-1 text-2xl font-black text-slate-900">
                                    Drilling Events
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Showing <strong>{filteredEvents.length}</strong> of{" "}
                                    <strong>{allEvents.length}</strong> unique events.
                                </p>
                            </div>

                            {filteredEvents.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                                        <Search size={28} className="text-slate-300" />
                                    </div>

                                    <h3 className="mt-5 text-lg font-black text-slate-900">
                                        {allEvents.length === 0
                                            ? "No events were returned"
                                            : "No events match the filter"}
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                                        {allEvents.length === 0
                                            ? "The analysis finished but returned no drilling events. Try a different question."
                                            : "Change or clear the search and filter to see events again."}
                                    </p>

                                    {allEvents.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white hover:bg-slate-800"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredEvents.map((event, index) => {
                                        const eventName = getEventName(event);
                                        const formattedName = normalizeEventName(eventName);
                                        const wellId = getWellId(event);
                                        const depth = formatDepth(getDepth(event));
                                        const measurement = getMeasurement(event);
                                        const evidence = getEvidence(event);
                                        const document = getDocument(event);
                                        const page = getPage(event);
                                        const style = getEventStyle(eventName);
                                        const EventIcon = getEventIcon(eventName);

                                        const eventKey =
                                            getEventUniqueKey(event) || `event-${index}`;
                                        const isExpanded = Boolean(expandedEvents[eventKey]);

                                        return (
                                            <article
                                                key={eventKey}
                                                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-lg"
                                            >
                                                <button
                                                    type="button"
                                                    aria-expanded={isExpanded}
                                                    onClick={() => toggleEvent(eventKey)}
                                                    className="w-full p-5 text-left sm:p-6"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div
                                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.iconBg}`}
                                                        >
                                                            <EventIcon
                                                                size={21}
                                                                className={style.iconColor}
                                                            />
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
                                                                    {formattedName}
                                                                </span>
                                                            </div>

                                                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                                <h3 className="text-base font-black text-slate-900 sm:text-lg">
                                                                    {formattedName}
                                                                    <span className="ml-2 text-sm font-bold text-slate-400">
                                                                        {depth}
                                                                    </span>
                                                                </h3>

                                                                <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                                    <span>
                                                                        {isExpanded
                                                                            ? "Hide details"
                                                                            : "View details"}
                                                                    </span>
                                                                    {isExpanded ? (
                                                                        <ChevronUp size={16} />
                                                                    ) : (
                                                                        <ChevronDown size={16} />
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-6">
                                                        <div className="grid gap-4 lg:grid-cols-3">
                                                            <DetailBox label="Depth" value={depth} />
                                                            <DetailBox
                                                                label="Measurement"
                                                                value={measurement}
                                                            />
                                                            <DetailBox
                                                                label="Well"
                                                                value={wellId || "Not specified"}
                                                            />
                                                        </div>

                                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                                                <p className="text-[9px] font-black uppercase tracking-[1.6px] text-blue-600">
                                                                    Evidence
                                                                </p>
                                                            </div>

                                                            <p className="mt-3 text-sm leading-7 text-slate-700">
                                                                {evidence}
                                                            </p>
                                                        </div>

                                                        {(document || page) && (
                                                            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <FileText
                                                                        size={15}
                                                                        className="text-blue-600"
                                                                    />
                                                                    <p className="text-xs font-bold text-blue-700">
                                                                        Source document
                                                                    </p>
                                                                </div>

                                                                <p className="text-xs font-semibold text-blue-600">
                                                                    {document}
                                                                    {document && page && " • "}
                                                                    {page && `Page ${page}`}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>


                        {/* WELL SUMMARY */}
                        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                                    <MapPin size={19} className="text-indigo-600" />
                                </div>

                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[1.8px] text-indigo-500">
                                        Wells Involved
                                    </p>
                                    <h2 className="mt-1 text-xl font-black text-slate-900">
                                        Event Distribution by Well
                                    </h2>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                                {uniqueWells.length > 0 ? (
                                    uniqueWells.map((wellId) => {
                                        const wellEventCount = allEvents.filter(
                                            (event) =>
                                                String(getWellId(event)).toUpperCase() ===
                                                String(wellId).toUpperCase()
                                        ).length;

                                        return (
                                            <button
                                                key={wellId}
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/analysis?well=${encodeURIComponent(
                                                            wellId
                                                        )}`
                                                    )
                                                }
                                                className="group flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left transition hover:border-indigo-300 hover:bg-white hover:shadow-md"
                                            >
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
                                                    <MapPin size={16} className="text-indigo-600" />
                                                </div>

                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-wider text-indigo-400">
                                                        Well
                                                    </p>
                                                    <p className="text-sm font-black text-indigo-900">
                                                        {wellId}
                                                    </p>
                                                </div>

                                                <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-indigo-600">
                                                    {wellEventCount}{" "}
                                                    {wellEventCount === 1 ? "event" : "events"}
                                                </span>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        No well identifiers were returned with the events.
                                    </p>
                                )}
                            </div>
                        </section>


                        {/* FOOTER */}
                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                            <Database
                                size={16}
                                className="mt-0.5 shrink-0 text-blue-600"
                            />
                            <p className="text-[10px] leading-5 text-blue-700">
                                Event records come from the backend analysis
                                response and indexed drilling evidence. The
                                backend removes duplicate events; the page
                                also skips exact repeats as a safety net.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


// ============================================================
// SUB-COMPONENTS
// ============================================================

function SummaryStat({ label, value, icon: Icon }) {
    return (
        <div className="border-t border-white/10 p-5 sm:border-r last:border-r-0">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[1.5px] text-blue-200">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">{value}</p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Icon size={18} className="text-blue-100" />
                </div>
            </div>
        </div>
    );
}

function FilterButton({ active, onClick, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                active
                    ? "rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-100"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            }
        >
            {label}
        </button>
    );
}

function DetailBox({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-black uppercase tracking-[1.5px] text-slate-400">
                {label}
            </p>
            <p className="mt-2 break-words text-sm font-black text-slate-900">
                {typeof value === "object" && value !== null
                    ? JSON.stringify(value)
                    : value || "Not specified"}
            </p>
        </div>
    );
}