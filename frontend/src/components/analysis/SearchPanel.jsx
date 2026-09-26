import {
    Search,
    SlidersHorizontal,
    MapPin,
    Ruler,
    RotateCcw,
    Sparkles,
    Database,
    ArrowUpRight,
    Zap,
} from "lucide-react";

function SearchPanel({
    question,
    setQuestion,
    radiusKm,
    setRadiusKm,
    depthTolerance,
    setDepthTolerance,
    onAnalyze,
    loading = false,
}) {
    const handleSubmit = (event) => {
        event.preventDefault();

        if (!question.trim() || loading) {
            return;
        }

        onAnalyze();
    };

    const handleReset = () => {
        setQuestion("");
        setRadiusKm(10);
        setDepthTolerance(200);
    };

    const exampleQuestions = [
        {
            label: "Mud Loss",
            question: "Which wells had mud-loss events?",
            icon: Database,
        },
        {
            label: "Torque",
            question: "Which wells had torque-related events?",
            icon: Zap,
        },
        {
            label: "Depth",
            question:
                "What happened between 2380 m and 2470 m in W104?",
            icon: Ruler,
        },
        {
            label: "Formation",
            question:
                "Which formation was used in W104?",
            icon: MapPin,
        },
        {
            label: "Well Info",
            question: "Tell me about W104",
            icon: Search,
        },
    ];

    return (
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">

            {/* ================================================= */}
            {/* DECORATIVE BACKGROUND */}
            {/* ================================================= */}

            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#172554] to-blue-900 px-6 py-7 sm:px-8">

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-start gap-4">

                        {/* Icon */}

                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/10 backdrop-blur">

                            <Search className="h-6 w-6 text-white" />

                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#172554] bg-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            </span>

                        </div>

                        {/* Heading */}

                        <div>

                            <div className="flex flex-wrap items-center gap-2">

                                <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-blue-200">
                                    NLP + RAG
                                </span>

                                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
                                    Intelligence Search
                                </span>

                            </div>

                            <h2 className="mt-3 text-xl font-black tracking-tight text-white sm:text-2xl">
                                Well Intelligence Search
                            </h2>

                            <p className="mt-2 max-w-2xl text-xs leading-6 text-blue-100/70 sm:text-sm">
                                Ask questions in natural language about wells,
                                drilling events, depths, formations and
                                historical observations.
                            </p>

                        </div>

                    </div>

                    {/* Technology indicators */}

                    <div className="hidden shrink-0 items-center gap-2 lg:flex">

                        <TechBadge
                            icon={Sparkles}
                            label="NLP"
                        />

                        <TechBadge
                            icon={Database}
                            label="FAISS"
                        />

                        <TechBadge
                            icon={Zap}
                            label="RAG"
                        />

                    </div>

                </div>

            </div>

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <form
                onSubmit={handleSubmit}
                className="relative p-6 sm:p-8"
            >

                {/* ================================================= */}
                {/* QUESTION */}
                {/* ================================================= */}

                <div>

                    <div className="mb-3 flex items-center justify-between gap-3">

                        <label
                            htmlFor="well-question"
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"
                        >

                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50">
                                <Search className="h-3.5 w-3.5 text-blue-600" />
                            </span>

                            Your Question

                        </label>

                        <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-400 sm:block">
                            Natural Language
                        </span>

                    </div>

                    <div className="group relative">

                        <textarea
                            id="well-question"
                            value={question}
                            onChange={(event) =>
                                setQuestion(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" &&
                                    (event.ctrlKey || event.metaKey)
                                ) {
                                    event.preventDefault();

                                    if (
                                        question.trim() &&
                                        !loading
                                    ) {
                                        onAnalyze();
                                    }
                                }
                            }}
                            placeholder="Example: Which wells had mud-loss events?"
                            rows={4}
                            disabled={loading}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pr-24 text-sm font-medium leading-6 text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 shadow-sm ring-1 ring-slate-100">

                            <Sparkles className="h-3 w-3 text-blue-500" />

                            AI Query

                        </div>

                    </div>

                    {/* Keyboard hint */}

                    <div className="mt-2 flex items-center justify-between">

                        <p className="text-[10px] font-medium text-slate-400">
                            Ask naturally — no special syntax required.
                        </p>

                        <p className="hidden text-[10px] font-semibold text-slate-400 sm:block">
                            Ctrl + Enter to analyze
                        </p>

                    </div>

                </div>

                {/* ================================================= */}
                {/* QUICK QUESTIONS */}
                {/* ================================================= */}

                <div className="mt-6">

                    <div className="mb-3 flex items-center justify-between">

                        <div className="flex items-center gap-2">

                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                            </div>

                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                                Try an Example
                            </p>

                        </div>

                        <span className="text-[9px] font-bold text-slate-400">
                            Quick queries
                        </span>

                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">

                        {exampleQuestions.map(
                            (example) => {
                                const Icon = example.icon;

                                const active =
                                    question ===
                                    example.question;

                                return (
                                    <button
                                        key={example.label}
                                        type="button"
                                        disabled={loading}
                                        onClick={() =>
                                            setQuestion(
                                                example.question
                                            )
                                        }
                                        className={`group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-300 ${
                                            active
                                                ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                                                : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700"
                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >

                                        <Icon
                                            className={`h-3.5 w-3.5 ${
                                                active
                                                    ? "text-blue-600"
                                                    : "text-slate-400 group-hover:text-blue-500"
                                            }`}
                                        />

                                        <span className="text-[10px] font-black whitespace-nowrap">
                                            {example.label}
                                        </span>

                                    </button>
                                );
                            }
                        )}

                    </div>

                </div>

                {/* ================================================= */}
                {/* PARAMETERS */}
                {/* ================================================= */}

                <div className="mt-7">

                    <div className="mb-4 flex items-center justify-between">

                        <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                                <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                            </div>

                            <div>

                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                                    Analysis Parameters
                                </p>

                                <p className="mt-0.5 text-[10px] text-slate-400">
                                    Adjust spatial and depth matching
                                </p>

                            </div>

                        </div>

                        <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-bold text-slate-500 sm:block">
                            Optional
                        </div>

                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">

                        {/* ================================================= */}
                        {/* RADIUS */}
                        {/* ================================================= */}

                        <ParameterCard
                            icon={MapPin}
                            iconClass="bg-indigo-50 text-indigo-600"
                            title="Search Radius"
                            value={`${radiusKm} km`}
                            description="Maximum spatial distance for nearby well analysis"
                        >

                            <input
                                id="radius-km"
                                type="range"
                                min="1"
                                max="100"
                                step="1"
                                value={radiusKm}
                                onChange={(event) =>
                                    setRadiusKm(
                                        Number(
                                            event.target.value
                                        )
                                    )
                                }
                                disabled={loading}
                                className="mt-5 w-full cursor-pointer accent-indigo-600 disabled:cursor-not-allowed"
                            />

                            <div className="mt-2 flex justify-between text-[9px] font-bold text-slate-400">

                                <span>1 km</span>

                                <span>100 km</span>

                            </div>

                        </ParameterCard>

                        {/* ================================================= */}
                        {/* DEPTH */}
                        {/* ================================================= */}

                        <ParameterCard
                            icon={Ruler}
                            iconClass="bg-cyan-50 text-cyan-600"
                            title="Depth Tolerance"
                            value={`±${depthTolerance} m`}
                            description="Depth window used when matching drilling events"
                        >

                            <input
                                id="depth-tolerance"
                                type="range"
                                min="50"
                                max="1000"
                                step="50"
                                value={depthTolerance}
                                onChange={(event) =>
                                    setDepthTolerance(
                                        Number(
                                            event.target.value
                                        )
                                    )
                                }
                                disabled={loading}
                                className="mt-5 w-full cursor-pointer accent-cyan-600 disabled:cursor-not-allowed"
                            />

                            <div className="mt-2 flex justify-between text-[9px] font-bold text-slate-400">

                                <span>±50 m</span>

                                <span>±1000 m</span>

                            </div>

                        </ParameterCard>

                    </div>

                </div>

                {/* ================================================= */}
                {/* ACTIONS */}
                {/* ================================================= */}

                <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">

                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={loading}
                        className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-[-90deg]" />

                        Reset

                    </button>

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            !question.trim()
                        }
                        className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-7 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >

                        <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />

                        <span className="relative flex items-center gap-2">

                            {loading ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />

                                    Analyze Well Data

                                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </>
                            )}

                        </span>

                    </button>

                </div>

            </form>

        </section>
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
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">

            <Icon className="h-3.5 w-3.5 text-blue-200" />

            <span className="text-[9px] font-black uppercase tracking-wider text-white/80">
                {label}
            </span>

        </div>
    );
}

// ============================================================
// PARAMETER CARD
// ============================================================

function ParameterCard({
    icon: Icon,
    iconClass,
    title,
    value,
    description,
    children,
}) {
    return (
        <div className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/40">

            <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">

                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>

                    <div>

                        <p className="text-xs font-black text-slate-800">
                            {title}
                        </p>

                        <p className="mt-1 max-w-xs text-[10px] leading-5 text-slate-400">
                            {description}
                        </p>

                    </div>

                </div>

                <span className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-blue-600 shadow-sm ring-1 ring-slate-100">
                    {value}
                </span>

            </div>

            {children}

        </div>
    );
}

export default SearchPanel;