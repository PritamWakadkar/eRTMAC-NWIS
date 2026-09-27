import {
    BrainCircuit,
    Ruler,
    Search,
    RotateCcw,
    MapPin,
} from "lucide-react";

function PredictionPanel({
    wellId,
    setWellId,
    depth,
    setDepth,
    onPredict,
    onReset,
    loading = false,
}) {
    const handleSubmit = (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        const cleanWellId = wellId.trim();
        const numericDepth = Number(depth);

        // Validate Well ID
        if (!cleanWellId) {
            return;
        }

        // Validate depth
        if (
            depth === "" ||
            !Number.isFinite(numericDepth) ||
            numericDepth < 0
        ) {
            return;
        }

        onPredict();
    };

    const handleReset = () => {
        if (onReset) {
            onReset();
            return;
        }

        setWellId("");
        setDepth("");
    };

    const numericDepth = Number(depth);

    const isDepthValid =
        depth !== "" &&
        Number.isFinite(numericDepth) &&
        numericDepth >= 0;

    const canPredict =
        !loading &&
        wellId.trim() !== "" &&
        isDepthValid;

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            {/* =====================================================
                HEADER
            ====================================================== */}

            <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">
                    <BrainCircuit className="h-5 w-5 text-white" />
                </div>

                <div>
                    <h2 className="text-lg font-extrabold text-[#172033]">
                        Drilling Event Prediction
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        Enter a well and drilling depth to generate
                        predicted event probabilities from the
                        prediction model.
                    </p>
                </div>

            </div>


            {/* =====================================================
                FORM
            ====================================================== */}

            <form
                onSubmit={handleSubmit}
                className="mt-5"
            >

                <div className="grid gap-4 md:grid-cols-2">

                    {/* =================================================
                        WELL ID
                    ================================================== */}

                    <div>

                        <label
                            htmlFor="prediction-well-id"
                            className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500"
                        >
                            Well ID
                        </label>

                        <div className="relative">

                            <MapPin
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="prediction-well-id"
                                type="text"
                                value={wellId}
                                onChange={(event) =>
                                    setWellId(
                                        event.target.value
                                    )
                                }
                                placeholder="Example: W105"
                                disabled={loading}
                                autoComplete="off"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                            />

                        </div>

                        <p className="mt-2 text-[10px] text-slate-400">
                            Enter the well identifier available in
                            the dataset.
                        </p>

                    </div>


                    {/* =================================================
                        DEPTH
                    ================================================== */}

                    <div>

                        <label
                            htmlFor="prediction-depth"
                            className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500"
                        >
                            Drilling Depth
                        </label>

                        <div className="relative">

                            <Ruler
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="prediction-depth"
                                type="number"
                                min="0"
                                step="1"
                                value={depth}
                                onChange={(event) =>
                                    setDepth(
                                        event.target.value
                                    )
                                }
                                placeholder="Example: 2600"
                                disabled={loading}
                                className={`w-full rounded-xl border bg-slate-50 py-3 pl-10 pr-14 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                                    depth !== "" &&
                                    !isDepthValid
                                        ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-50"
                                }`}
                            />

                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                m
                            </span>

                        </div>


                        {depth !== "" &&
                            !isDepthValid && (
                                <p className="mt-2 text-[10px] font-semibold text-red-500">
                                    Enter a valid non-negative
                                    drilling depth.
                                </p>
                            )}


                        {isDepthValid && (
                            <p className="mt-2 text-[10px] text-slate-400">
                                Prediction features are selected
                                using the nearest available depth.
                            </p>
                        )}

                    </div>

                </div>


                {/* =====================================================
                    INFORMATION
                ====================================================== */}

                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                    <div className="flex items-start gap-3">

                        <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                        <div>

                            <p className="text-xs font-extrabold text-blue-800">
                                Prediction Model
                            </p>

                            <p className="mt-1 text-[11px] leading-5 text-blue-700">
                                The system evaluates drilling
                                parameters such as ROP, mud weight,
                                torque, ECD, pump rate and distance
                                to estimate event probabilities.
                            </p>

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    PROTOTYPE NOTICE
                ====================================================== */}

                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-4">

                    <div className="flex items-start gap-3">

                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-black text-amber-700">
                            !
                        </div>

                        <div>

                            <p className="text-xs font-extrabold text-amber-800">
                                Prototype Prediction
                            </p>

                            <p className="mt-1 text-[11px] leading-5 text-amber-700">
                                Current predictions are generated
                                from the project's prototype
                                training dataset and should be
                                treated as demonstration outputs,
                                not calibrated field-risk
                                probabilities.
                            </p>

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    ACTIONS
                ====================================================== */}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                    {/* RESET */}

                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <RotateCcw className="h-4 w-4" />

                        Reset

                    </button>


                    {/* PREDICT */}

                    <button
                        type="submit"
                        disabled={!canPredict}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172033] px-6 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        {loading ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                Predicting...
                            </>
                        ) : (
                            <>
                                <Search className="h-4 w-4" />

                                Generate Prediction
                            </>
                        )}

                    </button>

                </div>

            </form>

        </section>
    );
}

export default PredictionPanel;