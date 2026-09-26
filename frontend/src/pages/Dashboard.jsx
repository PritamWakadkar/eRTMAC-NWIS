import {
    Activity,
    ArrowRight,
    BrainCircuit,
    CheckCircle2,
    Database,
    Gauge,
    Layers3,
    MapPin,
    Radar,
    Sparkles,
    Target,
    Zap,
} from "lucide-react";

import { Link } from "react-router-dom";

import WellCard from "../components/analysis/WellCard";

function Dashboard() {
    const systemStats = [
        {
            label: "AI Analysis",
            value: "NLP + RAG",
            description: "Natural-language well intelligence",
            icon: BrainCircuit,
            gradient: "from-blue-500 to-indigo-600",
            soft: "bg-blue-50",
            text: "text-blue-600",
        },
        {
            label: "Well Intelligence",
            value: "Nearby Wells",
            description: "Spatial offset-well analysis",
            icon: MapPin,
            gradient: "from-cyan-500 to-blue-600",
            soft: "bg-cyan-50",
            text: "text-cyan-600",
        },
        {
            label: "Prediction",
            value: "ML Model",
            description: "Drilling event prediction",
            icon: Activity,
            gradient: "from-orange-500 to-rose-500",
            soft: "bg-orange-50",
            text: "text-orange-600",
        },
        {
            label: "Knowledge Base",
            value: "RAG",
            description: "Historical drilling reports",
            icon: Database,
            gradient: "from-violet-500 to-purple-600",
            soft: "bg-violet-50",
            text: "text-violet-600",
        },
    ];

    const quickWells = [
        {
            well_id: "W104",
            distance_km: 0,
            depth_m: 2500,
            formation: "Available",
            status: "Available",
        },
        {
            well_id: "W105",
            distance_km: 2.67,
            depth_m: 2600,
            formation: "Available",
            status: "Available",
        },
        {
            well_id: "W106",
            distance_km: 4.12,
            depth_m: 2700,
            formation: "Available",
            status: "Available",
        },
    ];

    return (
        <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">

            {/* =====================================================
                BACKGROUND GLOW
            ====================================================== */}

            <div className="pointer-events-none fixed inset-0 overflow-hidden">

                <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />

                <div className="absolute right-0 top-80 h-[500px] w-[500px] rounded-full bg-violet-300/10 blur-3xl" />

                <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

            </div>

            <main className="relative">

                <div className="mx-auto max-w-[1450px] px-6 py-8 max-sm:px-4">

                    {/* =================================================
                        HERO
                    ================================================= */}

                    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#071426] via-[#102b59] to-[#312e81] p-7 shadow-[0_25px_70px_rgba(30,64,175,0.22)] sm:p-10">

                        {/* Decorative glow */}

                        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-400/20 blur-3xl" />

                        <div className="pointer-events-none absolute bottom-[-180px] left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-400/10 blur-3xl" />

                        <div className="pointer-events-none absolute right-1/4 top-1/2 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

                        {/* Grid pattern */}

                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage:
                                    "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                                backgroundSize: "40px 40px",
                            }}
                        />

                        <div className="relative grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">

                            {/* Left */}

                            <div>

                                <div className="flex flex-wrap items-center gap-2">

                                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                                        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />

                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100">
                                            Smart Drilling Intelligence
                                        </span>
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

                                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                                            System Online
                                        </span>
                                    </span>

                                </div>

                                <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                                    eRTMAC-
                                    <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                                        NWIS
                                    </span>
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/70 sm:text-base">
                                    Nearby Wells Intelligence System for
                                    AI-powered offset-well knowledge,
                                    historical drilling analysis and
                                    decision support.
                                </p>

                                {/* Buttons */}

                                <div className="mt-7 flex flex-col gap-3 sm:flex-row">

                                    <Link
                                        to="/analysis"
                                        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-slate-900 shadow-xl shadow-blue-950/20 transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-50 hover:shadow-2xl"
                                    >
                                        <Radar className="h-4 w-4 text-blue-600" />

                                        Start Well Analysis

                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>

                                    <Link
                                        to="/prediction"
                                        className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-xs font-black text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                                    >
                                        <BrainCircuit className="h-4 w-4 text-cyan-300" />

                                        Open Prediction

                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>

                                </div>

                            </div>

                            {/* Hero visual */}

                            <div className="relative hidden lg:block">

                                <div className="relative mx-auto h-[270px] w-[270px]">

                                    {/* Rings */}

                                    <div className="absolute inset-0 rounded-full border border-blue-300/10" />

                                    <div className="absolute inset-7 rounded-full border border-blue-300/10" />

                                    <div className="absolute inset-14 rounded-full border border-cyan-300/10" />

                                    {/* Glow */}

                                    <div className="absolute inset-16 rounded-full bg-blue-500/20 blur-2xl" />

                                    {/* Center */}

                                    <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">

                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/40">

                                            <BrainCircuit className="h-8 w-8 text-white" />

                                        </div>

                                    </div>

                                    {/* Nodes */}

                                    <Node
                                        className="left-1/2 top-0 -translate-x-1/2"
                                        icon={Database}
                                        color="from-violet-400 to-purple-600"
                                    />

                                    <Node
                                        className="right-0 top-1/2 -translate-y-1/2"
                                        icon={MapPin}
                                        color="from-cyan-400 to-blue-600"
                                    />

                                    <Node
                                        className="bottom-0 left-1/2 -translate-x-1/2"
                                        icon={Activity}
                                        color="from-orange-400 to-rose-500"
                                    />

                                    <Node
                                        className="left-0 top-1/2 -translate-y-1/2"
                                        icon={Zap}
                                        color="from-emerald-400 to-teal-600"
                                    />

                                </div>

                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        SYSTEM STATUS
                    ================================================= */}

                    <section className="mt-9">

                        <SectionHeading
                            eyebrow="SYSTEM OVERVIEW"
                            title="Intelligence Modules"
                            description="Core AI and drilling intelligence capabilities available in the prototype."
                        />

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                            {systemStats.map((stat) => {

                                const Icon = stat.icon;

                                return (
                                    <div
                                        key={stat.label}
                                        className="group relative overflow-hidden rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                    >

                                        <div
                                            className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${stat.soft} opacity-70 blur-2xl`}
                                        />

                                        <div className="relative">

                                            <div className="flex items-start justify-between">

                                                <div
                                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                                                >
                                                    <Icon className="h-5 w-5 text-white" />
                                                </div>

                                                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-600">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Ready
                                                </span>

                                            </div>

                                            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                                {stat.label}
                                            </p>

                                            <p className="mt-1 text-lg font-black tracking-tight text-slate-900">
                                                {stat.value}
                                            </p>

                                            <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                                {stat.description}
                                            </p>

                                            <div
                                                className={`mt-4 h-1 w-10 rounded-full bg-gradient-to-r ${stat.gradient} transition-all duration-500 group-hover:w-full`}
                                            />

                                        </div>

                                    </div>
                                );
                            })}

                        </div>

                    </section>

                    {/* =================================================
                        QUICK WELLS
                    ================================================= */}

                    <section className="mt-10">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                            <SectionHeading
                                eyebrow="WELL INTELLIGENCE"
                                title="Quick Access Wells"
                                description="Wells currently available in the prototype dataset."
                            />

                            <Link
                                to="/analysis"
                                className="group inline-flex w-fit items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-blue-600 transition-all hover:bg-blue-100"
                            >
                                Open Analysis

                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>

                        </div>

                        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                            {quickWells.map((well) => (
                                <div
                                    key={well.well_id}
                                    className="group relative overflow-hidden rounded-[26px] border border-white/80 bg-white p-1 shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >

                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

                                    <div className="rounded-[22px] bg-gradient-to-br from-white to-blue-50/30 p-3">

                                        <WellCard
                                            well={well}
                                            onSelect={() => {
                                                window.location.href =
                                                    `/analysis?well=${well.well_id}`;
                                            }}
                                        />

                                    </div>

                                </div>
                            ))}

                        </div>

                    </section>

                    {/* =================================================
                        INTELLIGENCE PIPELINE
                    ================================================= */}

                    <section className="relative mt-10 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_15px_50px_rgba(15,23,42,0.06)] sm:p-8">

                        <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-blue-100/30 blur-3xl" />

                        <div className="relative">

                            <div className="flex items-start gap-4">

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 shadow-lg">
                                    <Layers3 className="h-5 w-5 text-white" />
                                </div>

                                <SectionHeading
                                    eyebrow="SYSTEM ARCHITECTURE"
                                    title="Intelligence Pipeline"
                                    description="How the major intelligence modules work together."
                                />

                            </div>

                            <div className="relative mt-8 grid gap-4 md:grid-cols-4">

                                {/* Connector */}

                                <div className="absolute left-[12%] right-[12%] top-9 hidden h-px bg-gradient-to-r from-blue-200 via-indigo-300 to-violet-200 md:block" />

                                <PipelineStep
                                    number="01"
                                    title="User Query"
                                    description="Natural-language drilling question"
                                    icon={Target}
                                    gradient="from-blue-500 to-indigo-600"
                                />

                                <PipelineStep
                                    number="02"
                                    title="NLP + RAG"
                                    description="Parse, retrieve and generate evidence"
                                    icon={BrainCircuit}
                                    gradient="from-indigo-500 to-violet-600"
                                />

                                <PipelineStep
                                    number="03"
                                    title="Nearby Wells"
                                    description="Spatial and depth-based intelligence"
                                    icon={MapPin}
                                    gradient="from-cyan-500 to-blue-600"
                                />

                                <PipelineStep
                                    number="04"
                                    title="Prediction"
                                    description="ML-based drilling event estimation"
                                    icon={Activity}
                                    gradient="from-orange-500 to-rose-500"
                                />

                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        BOTTOM STATUS
                    ================================================= */}

                    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>

                            <div>

                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                                    Platform Status
                                </p>

                                <p className="mt-0.5 text-xs font-semibold text-emerald-800">
                                    All prototype intelligence modules are available.
                                </p>

                            </div>

                        </div>

                        <span className="w-fit rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 shadow-sm">
                            System Online
                        </span>

                    </div>

                </div>

            </main>

        </div>
    );
}

/* =============================================================
   SECTION HEADING
============================================================= */

function SectionHeading({
    eyebrow,
    title,
    description,
}) {
    return (
        <div>

            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">
                {eyebrow}
            </p>

            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                {title}
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                {description}
            </p>

        </div>
    );
}

/* =============================================================
   HERO NODE
============================================================= */

function Node({
    className,
    icon: Icon,
    color,
}) {
    return (
        <div
            className={`absolute flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${color} shadow-xl ${className}`}
        >
            <Icon className="h-5 w-5 text-white" />
        </div>
    );
}

/* =============================================================
   PIPELINE STEP
============================================================= */

function PipelineStep({
    number,
    title,
    description,
    icon: Icon,
    gradient,
}) {
    return (
        <div className="group relative z-10 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl">

            <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
            >
                <Icon className="h-6 w-6 text-white" />
            </div>

            <span className="mt-4 inline-block rounded-full bg-white px-2.5 py-1 text-[8px] font-black tracking-[0.16em] text-slate-400 shadow-sm">
                STEP {number}
            </span>

            <h3 className="mt-3 text-sm font-black text-slate-900">
                {title}
            </h3>

            <p className="mt-1 text-[10px] leading-5 text-slate-500">
                {description}
            </p>

        </div>
    );
}

export default Dashboard;