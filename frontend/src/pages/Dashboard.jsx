import {
    Activity,
    ArrowRight,
    BrainCircuit,
    Database,
    FileText,
    MapPin,
    Search,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import WellCard from "../components/analysis/WellCard";


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {

    const navigate = useNavigate();


    // ========================================================
    // SYSTEM CAPABILITIES
    // ========================================================

    const systemStats = [
        {
            label: "AI Analysis",
            value: "NLP + RAG",
            description:
                "Natural-language well intelligence",
            icon: BrainCircuit,
        },

        {
            label: "Well Intelligence",
            value: "Nearby Wells",
            description:
                "Spatial offset-well analysis",
            icon: MapPin,
        },

        {
            label: "Prediction",
            value: "ML Model",
            description:
                "Drilling event prediction",
            icon: Activity,
        },

        {
            label: "Knowledge Base",
            value: "RAG",
            description:
                "Historical drilling reports",
            icon: Database,
        },
    ];


    // ========================================================
    // QUICK ACCESS WELLS
    //
    // These are the current prototype wells.
    // ========================================================

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


    // ========================================================
    // SELECT WELL
    // ========================================================

    const handleSelectWell = (well) => {

        if (!well?.well_id) {
            return;
        }

        navigate(
            `/analysis?well=${encodeURIComponent(
                well.well_id
            )}`
        );
    };


    return (

        <div className="min-h-screen bg-slate-50">

            <main>

                <div className="mx-auto max-w-[1400px] px-6 py-8 max-sm:px-4">


                    {/* ==================================================
                        HERO
                    ================================================== */}

                    <section className="overflow-hidden rounded-3xl bg-[#172033] p-7 shadow-sm sm:p-9">

                        <div className="max-w-3xl">

                            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-300">
                                Smart Drilling Intelligence
                            </p>


                            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                eRTMAC-NWIS
                            </h1>


                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                                Nearby Wells Intelligence System for
                                AI-powered offset-well knowledge,
                                historical drilling analysis and
                                decision support.
                            </p>


                            {/* ACTIONS */}

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                                <Link
                                    to="/analysis"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-[#172033] transition hover:bg-slate-100"
                                >

                                    <Search className="h-4 w-4" />

                                    Start Well Analysis

                                    <ArrowRight className="h-4 w-4" />

                                </Link>


                                <Link
                                    to="/prediction"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 py-3 text-xs font-extrabold text-white transition hover:bg-slate-800"
                                >

                                    <BrainCircuit className="h-4 w-4" />

                                    Open Prediction

                                </Link>

                            </div>

                        </div>

                    </section>


                    {/* ==================================================
                        SYSTEM CAPABILITIES
                    ================================================== */}

                    <section className="mt-8">

                        <div className="mb-4">

                            <h2 className="text-lg font-extrabold text-[#172033]">
                                System Capabilities
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Core intelligence modules available
                                in the prototype.
                            </p>

                        </div>


                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                            {systemStats.map((stat) => {

                                const Icon = stat.icon;

                                return (

                                    <div
                                        key={stat.label}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                                    >

                                        <div className="flex items-start justify-between">

                                            <div>

                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {stat.label}
                                                </p>


                                                <p className="mt-2 text-base font-extrabold text-[#172033]">
                                                    {stat.value}
                                                </p>


                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    {stat.description}
                                                </p>

                                            </div>


                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">

                                                <Icon className="h-5 w-5 text-blue-600" />

                                            </div>

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    </section>


                    {/* ==================================================
                        QUICK ACCESS WELLS
                    ================================================== */}

                    <section className="mt-8">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                            <div>

                                <h2 className="text-lg font-extrabold text-[#172033]">
                                    Quick Access — Wells
                                </h2>


                                <p className="mt-1 text-xs text-slate-500">
                                    Wells currently available in the
                                    prototype dataset.
                                </p>

                            </div>


                            <Link
                                to="/analysis"
                                className="inline-flex w-fit items-center gap-2 text-xs font-extrabold text-blue-600 hover:text-blue-700"
                            >

                                Open Well Analysis

                                <ArrowRight className="h-3.5 w-3.5" />

                            </Link>

                        </div>


                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                            {quickWells.map((well) => (

                                <WellCard
                                    key={well.well_id}
                                    well={well}
                                    onSelect={() =>
                                        handleSelectWell(well)
                                    }
                                />

                            ))}

                        </div>

                    </section>


                    {/* ==================================================
                        DOCUMENT / KNOWLEDGE BASE
                    ================================================== */}

                    <section className="mt-8">

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                <div className="flex items-start gap-3">

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50">

                                        <FileText className="h-5 w-5 text-cyan-600" />

                                    </div>


                                    <div>

                                        <h2 className="text-lg font-extrabold text-[#172033]">
                                            Drilling Knowledge Base
                                        </h2>


                                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                                            Upload and process drilling
                                            reports through the RAG
                                            document intelligence
                                            pipeline.
                                        </p>

                                    </div>

                                </div>


                                <Link
                                    to="/documents"
                                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50"
                                >

                                    Manage Documents

                                    <ArrowRight className="h-3.5 w-3.5" />

                                </Link>

                            </div>

                        </div>

                    </section>


                    {/* ==================================================
                        INTELLIGENCE PIPELINE
                    ================================================== */}

                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-start gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">

                                <Database className="h-5 w-5 text-white" />

                            </div>


                            <div>

                                <h2 className="text-lg font-extrabold text-[#172033]">
                                    Intelligence Pipeline
                                </h2>


                                <p className="mt-1 text-xs text-slate-500">
                                    How the major modules work together.
                                </p>

                            </div>

                        </div>


                        <div className="mt-5 grid gap-3 md:grid-cols-4">

                            <PipelineStep
                                number="01"
                                title="User Query"
                                description="Natural-language drilling question"
                            />


                            <PipelineStep
                                number="02"
                                title="NLP + RAG"
                                description="Parse, retrieve and ground the answer in evidence"
                            />


                            <PipelineStep
                                number="03"
                                title="Nearby Wells"
                                description="Spatial and depth-based offset-well intelligence"
                            />


                            <PipelineStep
                                number="04"
                                title="Prediction"
                                description="Prototype ML-based drilling event estimation"
                            />

                        </div>

                    </section>


                    {/* ==================================================
                        PROJECT STATUS
                    ================================================== */}

                    <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">

                        <div className="flex items-start gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">

                                <Activity className="h-4 w-4 text-blue-600" />

                            </div>


                            <div>

                                <p className="text-xs font-extrabold text-blue-800">
                                    Prototype Status
                                </p>


                                <p className="mt-1 text-[11px] leading-5 text-blue-700">
                                    NLP routing, RAG retrieval,
                                    PostgreSQL/PostGIS nearby-well
                                    analysis, document processing
                                    and prototype drilling-event
                                    prediction are integrated in
                                    the current system.
                                </p>

                            </div>

                        </div>

                    </section>

                </div>

            </main>

        </div>
    );
}


// ============================================================
// PIPELINE STEP
// ============================================================

function PipelineStep({
    number,
    title,
    description,
}) {

    return (

        <div className="rounded-xl bg-slate-50 p-4 transition hover:bg-blue-50">

            <span className="text-[10px] font-extrabold tracking-wider text-blue-600">
                {number}
            </span>


            <h3 className="mt-2 text-sm font-extrabold text-slate-800">
                {title}
            </h3>


            <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {description}
            </p>

        </div>

    );
}


export default Dashboard;