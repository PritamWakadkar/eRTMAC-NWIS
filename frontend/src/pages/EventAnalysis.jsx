import { useLocation, Link } from "react-router-dom";

import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Database,
    Gauge,
    MapPin,
    Sparkles,
    Target,
    Zap,
    CheckCircle2,
    Layers3,
    TrendingUp,
} from "lucide-react";

import SummaryCard from "../components/analysis/SummaryCard";
import EventAnalysisSection from "../components/analysis/EventAnalysis";
import DepthEventAnalysis from "../components/analysis/DepthEventAnalysis";
import HistoricalInterval from "../components/analysis/HistoricalInterval";

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
            .replace(/\b\w/g, (char) =>
                char.toUpperCase()
            )
    );
}

function EventAnalysis() {
    const location = useLocation();

    const analysis = location.state?.analysis || null;

    /* =========================================================
       NO DATA
    ========================================================= */

    if (!analysis) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">

                <main>
                    <div className="mx-auto flex min-h-[80vh] max-w-[1400px] items-center justify-center px-6 py-10">

                        <div className="w-full max-w-xl overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_25px_80px_rgba(37,99,235,0.12)]">

                            <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-violet-600" />

                            <div className="p-10 text-center">

                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg shadow-orange-100">
                                    <AlertCircle className="h-9 w-9 text-orange-500" />
                                </div>

                                <span className="mt-6 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">
                                    Analysis Required
                                </span>

                                <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
                                    No Analysis Data
                                </h1>

                                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                                    No analysis result was provided
                                    to this page. Run a well analysis
                                    first and then open the event
                                    analysis.
                                </p>

                                <Link
                                    to="/analysis"
                                    className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-200"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Analysis
                                </Link>

                            </div>
                        </div>

                    </div>
                </main>

            </div>
        );
    }

    /* =========================================================
       RESPONSE
    ========================================================= */

    const result =
        analysis.result &&
        typeof analysis.result === "object"
            ? analysis.result
            : analysis;

    /* =========================================================
       EVENTS
    ========================================================= */

    const events = Array.isArray(result.events)
        ? result.events
        : Array.isArray(result.matched_events)
        ? result.matched_events
        : [];

    /* =========================================================
       HISTORICAL INTERVALS
    ========================================================= */

    const historicalIntervals =
        Array.isArray(result.historical_intervals)
            ? result.historical_intervals
            : Array.isArray(result.historicalIntervals)
            ? result.historicalIntervals
            : [];

    /* =========================================================
       DEPTH
    ========================================================= */

    const depth =
        result.depth ??
        result.depth_m ??
        result.requested_depth ??
        result.requested_depth_m ??
        result.requested_depth_range ??
        null;

    /* =========================================================
       SUMMARY
    ========================================================= */

    const summary =
        result.summary ||
        result.answer ||
        result.response ||
        result.structured_summary ||
        result.ai_summary ||
        "";

    /* =========================================================
       NEARBY WELLS
    ========================================================= */

    const nearbyWells = Array.isArray(
        result.nearby_wells
    )
        ? result.nearby_wells
        : Array.isArray(result.nearbyWells)
        ? result.nearbyWells
        : [];

    /* =========================================================
       MATCHED WELLS
    ========================================================= */

    const matchedWells = Array.isArray(
        result.matched_wells
    )
        ? result.matched_wells
        : [];

    /* =========================================================
       QUERY
    ========================================================= */

    const query =
        analysis.query ||
        result.query ||
        {};

    const wellId =
        query.well_id ||
        result.well_id ||
        null;

    const eventType =
        query.event_type ||
        result.event_type ||
        null;

    /* =========================================================
       COUNTS
    ========================================================= */

    const eventCount =
        result.event_count ??
        events.length;

    const wellCount =
        result.well_count ??
        matchedWells.length;

    /* =========================================================
       PAGE
    ========================================================= */

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-violet-50/40">

            {/* Decorative background */}

            <div className="pointer-events-none fixed inset-0 overflow-hidden">

                <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

                <div className="absolute right-0 top-96 h-96 w-96 rounded-full bg-violet-300/10 blur-3xl" />

                <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

            </div>

            <main className="relative">

                <div className="mx-auto max-w-[1450px] px-6 py-8 max-sm:px-4">

                    {/* ================================================= */}
                    {/* HEADER */}
                    {/* ================================================= */}

                    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                        <div className="flex items-start gap-4">

                            <div className="relative">

                                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-xl shadow-indigo-200">

                                    <Activity className="h-7 w-7 text-white" />

                                </div>

                                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                </div>

                            </div>

                            <div>

                                <div className="flex flex-wrap items-center gap-2">

                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-blue-700">
                                        AI Drilling Intelligence
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Completed
                                    </span>

                                </div>

                                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                                    Event Analysis
                                </h1>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                    Explore drilling events, depth
                                    observations and historical
                                    intelligence extracted from
                                    nearby well records.
                                </p>

                            </div>

                        </div>

                        <Link
                            to="/analysis"
                            className="group inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-lg"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                            Back to Analysis
                        </Link>

                    </div>

                    {/* ================================================= */}
                    {/* HERO */}
                    {/* ================================================= */}

                    <div className="relative mb-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#08111f] via-[#102a56] to-[#312e81] p-7 shadow-[0_25px_70px_rgba(30,64,175,0.22)] sm:p-9">

                        {/* Glow */}

                        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

                        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />

                        <div className="pointer-events-none absolute right-1/3 top-1/2 h-60 w-60 rounded-full bg-violet-500/15 blur-3xl" />

                        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">

                            <div>

                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur">

                                    <Sparkles className="h-3.5 w-3.5 text-cyan-300" />

                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200">
                                        Intelligence Overview
                                    </span>

                                </div>

                                <h2 className="mt-5 text-2xl font-black text-white sm:text-3xl">

                                    {eventType
                                        ? formatEventType(
                                              eventType
                                          )
                                        : "Drilling Event Analysis"}

                                </h2>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/70">
                                    Structured drilling intelligence
                                    generated from retrieved well
                                    evidence and operational records.
                                </p>

                                {/* Query pill */}

                                <div className="mt-5 inline-flex max-w-full items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">

                                    <Target className="h-4 w-4 shrink-0 text-cyan-300" />

                                    <span className="truncate text-xs font-semibold text-blue-100">
                                        {wellId
                                            ? `Target Well: ${wellId}`
                                            : matchedWells.length
                                            ? `Matched Wells: ${matchedWells.join(
                                                  ", "
                                              )}`
                                            : "Cross-well analysis"}
                                    </span>

                                </div>

                            </div>

                            {/* Stats */}

                            <div className="grid grid-cols-3 gap-3">

                                <HeroStat
                                    value={eventCount}
                                    label="Events"
                                    icon={Activity}
                                    gradient="from-cyan-400 to-blue-500"
                                />

                                <HeroStat
                                    value={wellCount}
                                    label="Wells"
                                    icon={MapPin}
                                    gradient="from-violet-400 to-indigo-500"
                                />

                                <HeroStat
                                    value={
                                        historicalIntervals.length
                                    }
                                    label="Intervals"
                                    icon={Layers3}
                                    gradient="from-orange-400 to-rose-500"
                                />

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* QUICK METRICS */}
                    {/* ================================================= */}

                    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <MetricCard
                            icon={Activity}
                            title="Events Detected"
                            value={eventCount}
                            subtitle="Operational observations"
                            gradient="from-cyan-500 to-blue-600"
                            bg="bg-cyan-50"
                        />

                        <MetricCard
                            icon={MapPin}
                            title="Matched Wells"
                            value={wellCount}
                            subtitle="Relevant well records"
                            gradient="from-indigo-500 to-violet-600"
                            bg="bg-indigo-50"
                        />

                        <MetricCard
                            icon={Target}
                            title="Requested Depth"
                            value={
                                depth
                                    ? `${depth}`
                                    : "All"
                            }
                            subtitle="Depth scope"
                            gradient="from-orange-500 to-amber-500"
                            bg="bg-orange-50"
                        />

                        <MetricCard
                            icon={TrendingUp}
                            title="Evidence"
                            value={
                                events.length > 0
                                    ? "Found"
                                    : "None"
                            }
                            subtitle="Retrieved evidence"
                            gradient="from-emerald-500 to-teal-500"
                            bg="bg-emerald-50"
                        />

                    </div>

                    {/* ================================================= */}
                    {/* SUMMARY */}
                    {/* ================================================= */}

                    <div className="mb-8">

                        <SummaryCard
                            title="Event Analysis Summary"
                            summary={summary}
                            eventCount={eventCount}
                            nearbyWellCount={
                                nearbyWells.length
                            }
                            status="Completed"
                        />

                    </div>

                    {/* ================================================= */}
                    {/* QUERY CONTEXT */}
                    {/* ================================================= */}

                    <div className="mb-9 overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_15px_50px_rgba(15,23,42,0.07)]">

                        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 px-6 py-5">

                            <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200">
                                    <Database className="h-5 w-5 text-white" />
                                </div>

                                <div>

                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">
                                        Query Intelligence
                                    </p>

                                    <h3 className="mt-1 text-base font-black text-slate-900">
                                        Analysis Context
                                    </h3>

                                </div>

                            </div>

                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4">

                            <ContextCard
                                label="Target Well"
                                value={
                                    wellId ||
                                    (matchedWells.length
                                        ? matchedWells.join(
                                              ", "
                                          )
                                        : "All Wells")
                                }
                                icon={MapPin}
                                color="text-indigo-600"
                                bg="bg-indigo-50"
                            />

                            <ContextCard
                                label="Event Type"
                                value={formatEventType(eventType)}
                                icon={Activity}
                                color="text-orange-600"
                                bg="bg-orange-50"
                            />

                            <ContextCard
                                label="Depth"
                                value={
                                    depth ||
                                    "All Depths"
                                }
                                icon={Target}
                                color="text-cyan-600"
                                bg="bg-cyan-50"
                            />

                            <ContextCard
                                label="Nearby Wells"
                                value={`${nearbyWells.length}`}
                                icon={MapPin}
                                color="text-emerald-600"
                                bg="bg-emerald-50"
                            />

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* DRILLING EVENTS */}
                    {/* ================================================= */}

                    <div className="mb-10">

                        <SectionHeader
                            icon={Activity}
                            iconGradient="from-orange-500 via-amber-500 to-yellow-400"
                            eyebrow="Operational Evidence"
                            title="Drilling Events"
                            description="Detailed operational events retrieved from drilling records."
                            count={events.length}
                            label="Events"
                        />

                        <div className="mt-5 overflow-hidden rounded-[28px] border border-orange-100 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/40 p-1 shadow-[0_15px_45px_rgba(249,115,22,0.08)]">

                            <div className="rounded-[24px] bg-white p-2 sm:p-4">

                                <EventAnalysisSection
                                    events={events}
                                />

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* DEPTH EVENTS */}
                    {/* ================================================= */}

                    <div className="mb-10">

                        <SectionHeader
                            icon={Target}
                            iconGradient="from-cyan-500 via-blue-500 to-indigo-600"
                            eyebrow="Depth Intelligence"
                            title="Depth Event Analysis"
                            description="Events associated with the requested drilling depth."
                            count={depth ? 1 : 0}
                            label="Depth"
                        />

                        <div className="mt-5 overflow-hidden rounded-[28px] border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40 p-1 shadow-[0_15px_45px_rgba(6,182,212,0.08)]">

                            <div className="rounded-[24px] bg-white p-2 sm:p-4">

                                <DepthEventAnalysis
                                    events={events}
                                    depth={depth}
                                />

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* HISTORICAL */}
                    {/* ================================================= */}

                    <div className="mb-10">

                        <SectionHeader
                            icon={Database}
                            iconGradient="from-violet-500 via-purple-500 to-fuchsia-500"
                            eyebrow="Historical Intelligence"
                            title="Historical Intervals"
                            description="Previously identified drilling intervals relevant to this analysis."
                            count={
                                historicalIntervals.length
                            }
                            label="Intervals"
                        />

                        <div className="mt-5 overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-white via-violet-50/30 to-fuchsia-50/30 p-1 shadow-[0_15px_45px_rgba(139,92,246,0.08)]">

                            <div className="rounded-[24px] bg-white p-2 sm:p-4">

                                <HistoricalInterval
                                    intervals={
                                        historicalIntervals
                                    }
                                />

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* FOOTER */}
                    {/* ================================================= */}

                    <div className="relative overflow-hidden rounded-[26px] border border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 px-6 py-5">

                        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-200/20 blur-2xl" />

                        <div className="relative flex items-start gap-4">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                                <Sparkles className="h-5 w-5 text-indigo-600" />
                            </div>

                            <div>

                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-500">
                                    Evidence Grounding
                                </p>

                                <p className="mt-1 text-xs leading-6 text-slate-600">
                                    Event analysis is generated from
                                    the available indexed drilling
                                    evidence. Displayed observations
                                    should be interpreted within the
                                    scope of the available records.
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </main>
        </div>
    );
}

/* =============================================================
   HERO STAT
============================================================= */

function HeroStat({
    value,
    label,
    icon: Icon,
    gradient,
}) {
    return (
        <div className="min-w-[90px] rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-xl transition-all duration-300 hover:bg-white/15">

            <div
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
            >
                <Icon className="h-4 w-4 text-white" />
            </div>

            <p className="mt-2 text-2xl font-black text-white">
                {value}
            </p>

            <p className="text-[8px] font-black uppercase tracking-widest text-blue-200">
                {label}
            </p>

        </div>
    );
}

/* =============================================================
   METRIC CARD
============================================================= */

function MetricCard({
    icon: Icon,
    title,
    value,
    subtitle,
    gradient,
    bg,
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

            <div
                className={`absolute right-0 top-0 h-20 w-20 rounded-full ${bg} opacity-70 blur-2xl`}
            />

            <div className="relative flex items-start justify-between">

                <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                        {subtitle}
                    </p>

                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
                >
                    <Icon className="h-5 w-5 text-white" />
                </div>

            </div>

            <div
                className={`mt-4 h-1 w-12 rounded-full bg-gradient-to-r ${gradient} transition-all duration-300 group-hover:w-20`}
            />

        </div>
    );
}

/* =============================================================
   CONTEXT CARD
============================================================= */

function ContextCard({
    label,
    value,
    icon: Icon,
    color,
    bg,
}) {
    return (
        <div className="border-b border-slate-100 p-5 transition-all duration-300 hover:bg-slate-50 lg:border-b-0 lg:border-r last:border-r-0">

            <div className="flex items-start gap-3">

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}
                >
                    <Icon
                        className={`h-5 w-5 ${color}`}
                    />
                </div>

                <div className="min-w-0">

                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p
                        className={`mt-1 break-words text-sm font-black ${color}`}
                    >
                        {value}
                    </p>

                </div>

            </div>

        </div>
    );
}

/* =============================================================
   SECTION HEADER
============================================================= */

function SectionHeader({
    icon: Icon,
    iconGradient,
    eyebrow,
    title,
    description,
    count,
    label,
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div className="flex items-start gap-4">

                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${iconGradient} shadow-lg`}
                >
                    <Icon className="h-5 w-5 text-white" />
                </div>

                <div>

                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">
                        {eyebrow}
                    </p>

                    <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                        {title}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                    </p>

                </div>

            </div>

            {count > 0 && (
                <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-sm">

                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200" />

                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                        {count} {label}
                    </span>

                </div>
            )}

        </div>
    );
}

export default EventAnalysis;