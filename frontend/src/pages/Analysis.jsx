import { useState } from "react";
import { toast } from "react-toastify";

import {
    Activity,
    ArrowRight,
    BrainCircuit,
    CheckCircle2,
    Database,
    Gauge,
    MapPin,
    Radar,
    Search,
    Sparkles,
    Zap,
} from "lucide-react";

import SearchPanel from "../components/analysis/SearchPanel";
import AnalysisResults from "../components/analysis/AnalysisResults";
import ErrorState from "../components/common/ErrorState";

import { analyzeWell } from "../services/api";


// ============================================================
// EXTRACT API ERROR
// ============================================================

const getApiError = (
    error,
    fallbackMessage
) => {
    return (
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        fallbackMessage
    );
};


// ============================================================
// MAIN COMPONENT
// ============================================================

function Analysis() {

    // ========================================================
    // QUERY STATE
    // ========================================================

    const [question, setQuestion] =
        useState("");

    const [radiusKm, setRadiusKm] =
        useState(10);

    const [depthTolerance, setDepthTolerance] =
        useState(200);


    // ========================================================
    // RESULT STATE
    // ========================================================

    const [analysis, setAnalysis] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    // ========================================================
    // ANALYZE QUESTION
    // ========================================================

    const handleAnalyze = async () => {

        const trimmedQuestion =
            question.trim();


        // ----------------------------------------------------
        // EMPTY QUESTION
        // ----------------------------------------------------

        if (!trimmedQuestion) {

            toast.error(
                "Please enter a question."
            );

            return;
        }


        // ----------------------------------------------------
        // PREVENT DUPLICATE REQUEST
        // ----------------------------------------------------

        if (loading) {
            return;
        }


        // ----------------------------------------------------
        // VALIDATE PARAMETERS
        // ----------------------------------------------------

        const numericRadius =
            Number(radiusKm);

        const numericDepthTolerance =
            Number(depthTolerance);


        if (
            !Number.isFinite(
                numericRadius
            ) ||
            numericRadius <= 0
        ) {

            const message =
                "Radius must be greater than 0 km.";

            setError(message);

            toast.error(message);

            return;
        }


        if (
            !Number.isFinite(
                numericDepthTolerance
            ) ||
            numericDepthTolerance < 0
        ) {

            const message =
                "Depth tolerance cannot be negative.";

            setError(message);

            toast.error(message);

            return;
        }


        try {

            // ------------------------------------------------
            // START
            // ------------------------------------------------

            setLoading(true);

            setError("");

            setAnalysis(null);


            // ------------------------------------------------
            // BACKEND REQUEST
            // ------------------------------------------------

            const response =
                await analyzeWell(
                    trimmedQuestion,
                    numericRadius,
                    numericDepthTolerance
                );


            console.log(
                "Analyze API Response:",
                response
            );


            // ------------------------------------------------
            // CHECK BACKEND SUCCESS
            // ------------------------------------------------

            if (
                !response ||
                response.success !== true
            ) {

                throw new Error(
                    response?.error ||
                    response?.message ||
                    response?.detail ||
                    "Unable to analyze the well data."
                );
            }


            // ------------------------------------------------
            // IMPORTANT
            //
            // Keep COMPLETE backend response.
            //
            // Expected:
            //
            // {
            //     success: true,
            //     route: "...",
            //     query: {...},
            //     result: {...}
            // }
            // ------------------------------------------------

            setAnalysis(response);


            toast.success(
                "Well analysis completed successfully."
            );

        } catch (err) {

            console.error(
                "Well analysis error:",
                err
            );


            const message =
                getApiError(
                    err,
                    "Unable to connect to the analysis service."
                );


            setError(message);

            setAnalysis(null);

            toast.error(message);

        } finally {

            setLoading(false);
        }
    };


    // ========================================================
    // SELECT NEARBY WELL
    // ========================================================

    const handleSelectWell = (
        well
    ) => {

        if (!well) {
            return;
        }


        const wellId =
            well.well_id ||
            well.id ||
            well.name ||
            null;


        console.log(
            "Selected nearby well:",
            well
        );


        if (wellId) {

            toast.info(
                `Selected well: ${wellId}`
            );

        }
    };


    // ========================================================
    // RETRY
    // ========================================================

    const handleRetry = () => {

        if (!question.trim()) {

            toast.error(
                "Please enter a question first."
            );

            return;
        }


        handleAnalyze();
    };


    // ========================================================
    // LOAD EXAMPLE
    // ========================================================

    const useExample = (
        value
    ) => {

        setQuestion(value);

        setError("");

        setAnalysis(null);

        toast.info(
            "Example question loaded."
        );
    };


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">


            {/* ==================================================
                BACKGROUND EFFECTS
            ================================================== */}

            <div className="pointer-events-none fixed inset-0 overflow-hidden">

                <div className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-blue-300/10 blur-3xl" />

                <div className="absolute right-[-150px] top-[420px] h-[500px] w-[500px] rounded-full bg-violet-300/10 blur-3xl" />

                <div className="absolute bottom-[-150px] left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-300/10 blur-3xl" />

            </div>


            {/* ==================================================
                MAIN
            ================================================== */}

            <main className="relative">

                <div className="mx-auto max-w-[1450px] px-6 py-8 max-sm:px-4">


                    {/* ==================================================
                        HERO
                    ================================================== */}

                    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#071426] via-[#102b59] to-[#312e81] p-7 shadow-[0_25px_70px_rgba(30,64,175,0.20)] sm:p-10">


                        {/* GRID BACKGROUND */}

                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage:
                                    "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                                backgroundSize:
                                    "40px 40px",
                            }}
                        />


                        {/* GLOWS */}

                        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-400/20 blur-3xl" />

                        <div className="pointer-events-none absolute bottom-[-180px] left-1/3 h-[400px] w-[400px] rounded-full bg-violet-400/10 blur-3xl" />


                        <div className="relative grid gap-10 lg:grid-cols-[1fr_320px] lg:items-center">


                            {/* ==================================================
                                HERO LEFT
                            ================================================== */}

                            <div>

                                <div className="flex flex-wrap items-center gap-2">

                                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-white/10 px-3.5 py-1.5 backdrop-blur">

                                        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />

                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100">
                                            AI Drilling Intelligence
                                        </span>

                                    </span>


                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5">

                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

                                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                                            Engine Online
                                        </span>

                                    </span>

                                </div>


                                <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">

                                    Well{" "}

                                    <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                                        Analysis
                                    </span>

                                </h1>


                                <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/70 sm:text-base">
                                    Ask natural-language questions
                                    about drilling events, nearby
                                    wells, formations, historical
                                    observations and depth-specific
                                    intelligence.
                                </p>


                                {/* TECHNOLOGIES */}

                                <div className="mt-6 flex flex-wrap gap-2">

                                    <TechBadge
                                        icon={BrainCircuit}
                                        label="NLP"
                                    />

                                    <TechBadge
                                        icon={Database}
                                        label="RAG"
                                    />

                                    <TechBadge
                                        icon={MapPin}
                                        label="Spatial Intelligence"
                                    />

                                    <TechBadge
                                        icon={Activity}
                                        label="Drilling Analytics"
                                    />

                                </div>

                            </div>


                            {/* ==================================================
                                HERO RIGHT
                            ================================================== */}

                            <div className="relative hidden lg:block">

                                <div className="relative mx-auto h-[250px] w-[250px]">

                                    <div className="absolute inset-0 rounded-full border border-blue-300/10" />

                                    <div className="absolute inset-8 rounded-full border border-cyan-300/10" />

                                    <div className="absolute inset-16 rounded-full border border-violet-300/10" />

                                    <div className="absolute inset-16 rounded-full bg-blue-500/20 blur-2xl" />


                                    {/* CENTER */}

                                    <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">

                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/40">

                                            <Search className="h-8 w-8 text-white" />

                                        </div>

                                    </div>


                                    <HeroNode
                                        className="left-1/2 top-0 -translate-x-1/2"
                                        icon={BrainCircuit}
                                    />

                                    <HeroNode
                                        className="right-0 top-1/2 -translate-y-1/2"
                                        icon={Database}
                                    />

                                    <HeroNode
                                        className="bottom-0 left-1/2 -translate-x-1/2"
                                        icon={MapPin}
                                    />

                                    <HeroNode
                                        className="left-0 top-1/2 -translate-y-1/2"
                                        icon={Zap}
                                    />

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* ==================================================
                        SEARCH SECTION
                    ================================================== */}

                    <section className="mt-8">

                        <div className="mb-4 flex items-end justify-between">

                            <div>

                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">
                                    STEP 01
                                </p>

                                <h2 className="mt-1 text-xl font-black text-slate-900">
                                    Ask the Intelligence Engine
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Enter a natural-language drilling question.
                                </p>

                            </div>


                            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 sm:flex">

                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />

                                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                    NLP + RAG Ready
                                </span>

                            </div>

                        </div>


                        <div className="relative">

                            <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-r from-blue-300/20 via-indigo-300/20 to-violet-300/20 blur-xl" />

                            <div className="relative">

                                <SearchPanel
                                    question={
                                        question
                                    }
                                    setQuestion={
                                        setQuestion
                                    }
                                    radiusKm={
                                        radiusKm
                                    }
                                    setRadiusKm={
                                        setRadiusKm
                                    }
                                    depthTolerance={
                                        depthTolerance
                                    }
                                    setDepthTolerance={
                                        setDepthTolerance
                                    }
                                    onAnalyze={
                                        handleAnalyze
                                    }
                                    loading={
                                        loading
                                    }
                                />

                            </div>

                        </div>

                    </section>


                    {/* ==================================================
                        PARAMETERS
                    ================================================== */}

                    {!loading &&
                        !error &&
                        !analysis && (

                            <section className="mt-6">

                                <div className="grid gap-4 md:grid-cols-3">

                                    <ParameterCard
                                        icon={MapPin}
                                        title="Spatial Search"
                                        value={`${radiusKm} km radius`}
                                        description="Nearby well intelligence"
                                        gradient="from-cyan-500 to-blue-600"
                                        bg="from-white to-cyan-50"
                                    />

                                    <ParameterCard
                                        icon={Gauge}
                                        title="Depth Matching"
                                        value={`±${depthTolerance} m`}
                                        description="Historical depth tolerance"
                                        gradient="from-blue-500 to-indigo-600"
                                        bg="from-white to-blue-50"
                                    />

                                    <ParameterCard
                                        icon={Database}
                                        title="Evidence Engine"
                                        value="FAISS + RAG"
                                        description="Evidence-grounded retrieval"
                                        gradient="from-violet-500 to-purple-600"
                                        bg="from-white to-violet-50"
                                    />

                                </div>

                            </section>

                        )}


                    {/* ==================================================
                        LOADING
                    ================================================== */}

                    {loading && (

                        <section className="mt-8 overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_15px_50px_rgba(37,99,235,0.10)]">

                            <div className="h-1.5 w-full animate-pulse bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />

                            <div className="p-8">

                                <div className="mx-auto max-w-2xl text-center">

                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100">

                                        <BrainCircuit className="h-9 w-9 animate-pulse text-blue-600" />

                                    </div>


                                    <h3 className="mt-5 text-xl font-black text-slate-900">
                                        Analyzing Well Intelligence
                                    </h3>


                                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                        The intelligence pipeline is processing
                                        your question and retrieving relevant
                                        evidence.
                                    </p>

                                </div>


                                <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">

                                    <ProcessingStep
                                        icon={Search}
                                        label="Searching"
                                        text="Finding evidence"
                                    />

                                    <ProcessingStep
                                        icon={BrainCircuit}
                                        label="Processing"
                                        text="Understanding query"
                                    />

                                    <ProcessingStep
                                        icon={Database}
                                        label="Retrieving"
                                        text="Matching documents"
                                    />

                                </div>


                                <div className="mx-auto mt-6 h-1.5 max-w-2xl overflow-hidden rounded-full bg-slate-100">

                                    <div className="h-full w-1/2 animate-[loading_1.8s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />

                                </div>

                            </div>

                        </section>

                    )}


                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {!loading && error && (

                        <section className="mt-8 overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-[0_15px_50px_rgba(239,68,68,0.08)]">

                            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-orange-500" />

                            <div className="p-2">

                                <ErrorState
                                    title="Well Analysis Failed"
                                    message={error}
                                    onRetry={
                                        handleRetry
                                    }
                                />

                            </div>

                        </section>

                    )}


                    {/* ==================================================
                        RESULTS
                    ================================================== */}

                    {!loading &&
                        !error &&
                        analysis && (

                            <section className="mt-10">

                                <div className="mb-5 flex items-end justify-between">

                                    <div>

                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">
                                            STEP 03
                                        </p>

                                        <h2 className="mt-1 text-xl font-black text-slate-900">
                                            Intelligence Results
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Evidence retrieved from the analysis pipeline.
                                        </p>

                                    </div>


                                    <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 sm:flex">

                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />

                                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                            Analysis Complete
                                        </span>

                                    </div>

                                </div>


                                <AnalysisResults
                                    analysis={
                                        analysis
                                    }
                                    onSelectWell={
                                        handleSelectWell
                                    }
                                />

                            </section>

                        )}


                    {/* ==================================================
                        EXAMPLE QUESTIONS
                    ================================================== */}

                    {!loading &&
                        !analysis && (

                            <section className="mt-10">

                                <div className="mb-5">

                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-500">
                                        QUERY LIBRARY
                                    </p>

                                    <h2 className="mt-1 text-xl font-black text-slate-900">
                                        Explore the Intelligence Engine
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Try one of these supported drilling questions.
                                    </p>

                                </div>


                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                                    <ExampleCard
                                        icon={Activity}
                                        title="Mud Loss Events"
                                        question="Which wells had mud-loss events?"
                                        description="Find wells with recorded mud-loss observations."
                                        gradient="from-blue-500 to-cyan-500"
                                        onClick={() =>
                                            useExample(
                                                "Which wells had mud-loss events?"
                                            )
                                        }
                                    />


                                    <ExampleCard
                                        icon={Zap}
                                        title="Torque Events"
                                        question="Which wells had torque-related events?"
                                        description="Identify wells with torque increases or spikes."
                                        gradient="from-indigo-500 to-violet-500"
                                        onClick={() =>
                                            useExample(
                                                "Which wells had torque-related events?"
                                            )
                                        }
                                    />


                                    <ExampleCard
                                        icon={Gauge}
                                        title="Depth Analysis"
                                        question="What happened between 2380 m and 2470 m in W104?"
                                        description="Analyze drilling events inside a depth interval."
                                        gradient="from-violet-500 to-purple-600"
                                        onClick={() =>
                                            useExample(
                                                "What happened between 2380 m and 2470 m in W104?"
                                            )
                                        }
                                    />


                                    <ExampleCard
                                        icon={Database}
                                        title="Formation"
                                        question="Which formation was used in W104?"
                                        description="Retrieve geological formation information."
                                        gradient="from-cyan-500 to-blue-600"
                                        onClick={() =>
                                            useExample(
                                                "Which formation was used in W104?"
                                            )
                                        }
                                    />


                                    <ExampleCard
                                        icon={MapPin}
                                        title="Well Information"
                                        question="Tell me about W104"
                                        description="Retrieve information about a specific well."
                                        gradient="from-emerald-500 to-teal-600"
                                        onClick={() =>
                                            useExample(
                                                "Tell me about W104"
                                            )
                                        }
                                    />


                                    <ExampleCard
                                        icon={Radar}
                                        title="Operational Search"
                                        question="Which wells had drag-related events?"
                                        description="Search historical drilling events across wells."
                                        gradient="from-orange-500 to-rose-500"
                                        onClick={() =>
                                            useExample(
                                                "Which wells had drag-related events?"
                                            )
                                        }
                                    />

                                </div>

                            </section>

                        )}


                    {/* ==================================================
                        PIPELINE
                    ================================================== */}

                    <section className="mt-10 overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_15px_50px_rgba(15,23,42,0.05)] sm:p-8">

                        <div className="flex items-start gap-4">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 shadow-lg">

                                <Database className="h-5 w-5 text-white" />

                            </div>


                            <div>

                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">
                                    AI WORKFLOW
                                </p>

                                <h2 className="mt-1 text-xl font-black text-slate-900">
                                    From Question to Evidence
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    How your query moves through the eRTMAC-NWIS intelligence pipeline.
                                </p>

                            </div>

                        </div>


                        <div className="mt-8 grid gap-4 md:grid-cols-4">

                            <PipelineStep
                                number="01"
                                icon={Search}
                                title="Query"
                                description="Natural-language drilling question"
                                gradient="from-blue-500 to-cyan-500"
                            />

                            <PipelineStep
                                number="02"
                                icon={BrainCircuit}
                                title="NLP"
                                description="Intent, event and depth extraction"
                                gradient="from-indigo-500 to-blue-600"
                            />

                            <PipelineStep
                                number="03"
                                icon={Database}
                                title="RAG"
                                description="Retrieve evidence from reports"
                                gradient="from-violet-500 to-purple-600"
                            />

                            <PipelineStep
                                number="04"
                                icon={CheckCircle2}
                                title="Answer"
                                description="Evidence-grounded result"
                                gradient="from-emerald-500 to-teal-600"
                            />

                        </div>

                    </section>


                    {/* ==================================================
                        FOOTER STATUS
                    ================================================== */}

                    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">

                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                            </div>


                            <div>

                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                                    Intelligence Engine
                                </p>

                                <p className="mt-0.5 text-xs font-semibold text-emerald-800">
                                    NLP, RAG and evidence retrieval services are ready.
                                </p>

                            </div>

                        </div>


                        <div className="flex flex-wrap gap-2">

                            <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-blue-600 shadow-sm">
                                PostgreSQL
                            </span>

                            <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-violet-600 shadow-sm">
                                FAISS
                            </span>

                            <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-emerald-600 shadow-sm">
                                RAG
                            </span>

                        </div>

                    </div>

                </div>

            </main>


            {/* ==================================================
                ANIMATION
            ================================================== */}

            <style>
                {`
                    @keyframes loading {
                        0% {
                            transform: translateX(-100%);
                        }

                        50% {
                            transform: translateX(100%);
                        }

                        100% {
                            transform: translateX(220%);
                        }
                    }
                `}
            </style>

        </div>
    );
}


// ============================================================
// TECH BADGE
// ============================================================

function TechBadge({
    icon: Icon,
    label,
}) {

    return (

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[9px] font-bold text-blue-100 backdrop-blur">

            <Icon className="h-3 w-3 text-cyan-300" />

            {label}

        </span>
    );
}


// ============================================================
// HERO NODE
// ============================================================

function HeroNode({
    className,
    icon: Icon,
}) {

    return (

        <div
            className={`absolute flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-xl backdrop-blur ${className}`}
        >

            <Icon className="h-4 w-4 text-cyan-200" />

        </div>
    );
}


// ============================================================
// PARAMETER CARD
// ============================================================

function ParameterCard({
    icon: Icon,
    title,
    value,
    description,
    gradient,
    bg,
}) {

    return (

        <div
            className={`group relative overflow-hidden rounded-[22px] border border-white/80 bg-gradient-to-br ${bg} p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
        >

            <div className="flex items-center justify-between">

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
                >

                    <Icon className="h-5 w-5 text-white" />

                </div>


                <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-slate-400 shadow-sm">
                    Active
                </span>

            </div>


            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                {title}
            </p>


            <p className="mt-1 text-base font-black text-slate-900">
                {value}
            </p>


            <p className="mt-1 text-[10px] text-slate-500">
                {description}
            </p>

        </div>
    );
}


// ============================================================
// PROCESSING STEP
// ============================================================

function ProcessingStep({
    icon: Icon,
    label,
    text,
}) {

    return (

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">

                <Icon className="h-4 w-4 animate-pulse text-blue-600" />

            </div>


            <div>

                <p className="text-[10px] font-black text-slate-800">
                    {label}
                </p>

                <p className="mt-0.5 text-[9px] text-slate-500">
                    {text}
                </p>

            </div>

        </div>
    );
}


// ============================================================
// EXAMPLE CARD
// ============================================================

function ExampleCard({
    icon: Icon,
    title,
    question,
    description,
    gradient,
    onClick,
}) {

    return (

        <button
            type="button"
            onClick={onClick}
            disabled={false}
            className="group relative overflow-hidden rounded-[24px] border border-white bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

            <div
                className={`absolute right-[-30px] top-[-30px] h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] blur-xl`}
            />


            <div className="relative">

                <div className="flex items-start justify-between">

                    <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
                    >

                        <Icon className="h-5 w-5 text-white" />

                    </div>


                    <ArrowRight className="h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-500" />

                </div>


                <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {title}
                </p>


                <p className="mt-1 text-sm font-black leading-5 text-slate-800 group-hover:text-blue-700">
                    {question}
                </p>


                <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    {description}
                </p>

            </div>

        </button>
    );
}


// ============================================================
// PIPELINE STEP
// ============================================================

function PipelineStep({
    number,
    icon: Icon,
    title,
    description,
    gradient,
}) {

    return (

        <div className="group rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl">

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


export default Analysis;