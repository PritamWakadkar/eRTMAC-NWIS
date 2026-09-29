import { useState } from "react";
import {
    RiBrainLine as BrainCircuit,
    RiInformationLine as Info,
    RiDatabase2Line as Database,
    RiDashboard3Line as Gauge,
    RiPulseLine as Activity,
    RiCheckboxCircleLine as CheckCircle2,
    RiSparklingLine as Sparkles,
    RiTargetLine as Target,
    RiFlashlightLine as Zap,
    RiLineChartLine as TrendingUp,
    RiAlertLine as AlertTriangle,
} from "@remixicon/react";
import { toast } from "react-toastify";

import PredictionPanel from "../components/prediction/PredictionPanel";
import PredictionCard from "../components/prediction/PredictionCard";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";

import { predictWell } from "../services/api";


// ============================================================
// MAIN PREDICTION PAGE
// ============================================================

function Prediction() {

    const [wellId, setWellId] = useState("");
    const [depth, setDepth] = useState("");

    const [prediction, setPrediction] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    // =========================================================
    // HANDLE PREDICTION
    // =========================================================

    const handlePredict = async () => {

        const cleanWellId =
            wellId.trim().toUpperCase();

        const numericDepth = Number(depth);


        // -----------------------------------------------------
        // VALIDATE WELL ID
        // -----------------------------------------------------

        if (!cleanWellId) {

            toast.error(
                "Please enter a well ID."
            );

            return;
        }


        // -----------------------------------------------------
        // VALIDATE DEPTH
        // -----------------------------------------------------

        if (
            depth === "" ||
            !Number.isFinite(numericDepth) ||
            numericDepth < 0
        ) {

            toast.error(
                "Please enter a valid drilling depth."
            );

            return;
        }


        try {

            setLoading(true);
            setError("");
            setPrediction(null);


            // -------------------------------------------------
            // CALL BACKEND API
            // -------------------------------------------------

            const response =
                await predictWell(
                    cleanWellId,
                    numericDepth
                );


            console.log(
                "PREDICTION API RESPONSE:",
                response
            );


            // -------------------------------------------------
            // VALIDATE RESPONSE
            // -------------------------------------------------

            if (!response) {

                throw new Error(
                    "No response was received from the prediction API."
                );

            }


            if (!response.success) {

                throw new Error(
                    response.error ||
                    response.detail ||
                    "Prediction failed."
                );

            }


            if (!response.result) {

                throw new Error(
                    "Prediction API returned no result."
                );

            }


            // -------------------------------------------------
            // STORE RESULT
            // -------------------------------------------------

            setPrediction(
                response.result
            );


            toast.success(
                "Drilling event prediction completed."
            );

        } catch (err) {

            console.error(
                "Prediction error:",
                err
            );


            const message =
                err?.response?.data?.error ||
                err?.response?.data?.detail ||
                err?.message ||
                "Unable to generate prediction.";


            setError(message);

            toast.error(message);

        } finally {

            setLoading(false);

        }

    };


    // =========================================================
    // RETRY
    // =========================================================

    const handleRetry = () => {

        handlePredict();

    };


    // =========================================================
    // RESET
    // =========================================================

    const handleReset = () => {

        setWellId("");
        setDepth("");
        setPrediction(null);
        setError("");

    };


    // =========================================================
    // UI
    // =========================================================

    return (

        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">

            <div className="mx-auto max-w-[1400px] px-6 py-8 max-sm:px-4">


                {/* =================================================
                    PAGE HEADER
                ================================================= */}


                {/* =================================================
                    PREDICTION INPUT
                ================================================= */}

                <div className="relative">

                    <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-200/20 via-indigo-200/20 to-purple-200/20 blur-xl" />

                    <div className="relative">

                        <PredictionPanel
                            wellId={wellId}
                            setWellId={setWellId}
                            depth={depth}
                            setDepth={setDepth}
                            onPredict={handlePredict}
                            loading={loading}
                        />

                    </div>

                </div>


                {/* =================================================
                    QUICK INFORMATION
                ================================================= */}

                {!loading &&
                    !error &&
                    !prediction && (

                        <div className="mt-5 grid grid-cols-3 gap-4 max-md:grid-cols-1">


                            {/* WELL */}

                            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">

                                        <Target className="h-5 w-5 text-blue-600" />

                                    </div>

                                    <div>

                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-500">

                                            Target Well

                                        </p>

                                        <p className="mt-1 text-xs font-bold text-slate-700">

                                            Select a drilling well

                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* DEPTH */}

                            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">

                                        <Gauge className="h-5 w-5 text-indigo-600" />

                                    </div>

                                    <div>

                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-500">

                                            Target Depth

                                        </p>

                                        <p className="mt-1 text-xs font-bold text-slate-700">

                                            Enter depth in metres

                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* MODEL */}

                            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">

                                        <Zap className="h-5 w-5 text-purple-600" />

                                    </div>

                                    <div>

                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-500">

                                            Prediction Engine

                                        </p>

                                        <p className="mt-1 text-xs font-bold text-slate-700">

                                            ML event probability

                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (

                    <div className="relative mt-8 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_15px_45px_rgba(37,99,235,0.08)]">

                        <div className="h-1 w-full animate-pulse bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                        <div className="p-2">

                            <Loading
                                message="Generating drilling event prediction..."
                            />

                        </div>


                        <div className="flex flex-wrap items-center justify-center gap-3 pb-6">

                            <span className="rounded-full bg-blue-50 px-4 py-2 text-[9px] font-bold text-blue-600">

                                🔍 Reading well data

                            </span>

                            <span className="rounded-full bg-indigo-50 px-4 py-2 text-[9px] font-bold text-indigo-600">

                                🧠 Processing features

                            </span>

                            <span className="rounded-full bg-purple-50 px-4 py-2 text-[9px] font-bold text-purple-600">

                                ✨ Running ML model

                            </span>

                        </div>

                    </div>

                )}


                {/* =================================================
                    ERROR
                ================================================= */}

                {!loading && error && (

                    <div className="mt-8 overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/50 to-orange-50/40 shadow-[0_15px_40px_rgba(239,68,68,0.08)]">

                        <div className="h-1 w-full bg-gradient-to-r from-red-500 to-orange-500" />

                        <div className="p-2">

                            <ErrorState
                                title="Prediction Failed"
                                message={error}
                                onRetry={handleRetry}
                            />

                        </div>

                    </div>

                )}


                {/* =================================================
                    RESULTS
                ================================================= */}

                {!loading &&
                    !error &&
                    prediction && (

                        <PredictionResults
                            prediction={prediction}
                        />

                    )}


                {/* =================================================
                    INITIAL INFORMATION
                ================================================= */}

                {!loading &&
                    !error &&
                    !prediction && (

                        <div className="relative mt-8 overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_15px_45px_rgba(79,70,229,0.07)]">

                            {/* Gradient header */}

                            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50" />

                            <div className="relative p-7">


                                {/* HEADER */}

                                <div className="flex items-start gap-4">

                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 shadow-sm">

                                        <Info className="h-6 w-6 text-indigo-600" />

                                    </div>


                                    <div>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h3 className="text-base font-black text-[#172033]">

                                                How Prediction Works

                                            </h3>

                                       

                                        </div>


                                        <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-600">

                                            Enter a well ID and target depth.
                                            The system retrieves the nearest
                                            available drilling features and
                                            passes them through the trained
                                            prediction model.

                                        </p>

                                    </div>

                                </div>


                                {/* PIPELINE */}

                                <div className="mt-7 grid grid-cols-3 gap-4 max-md:grid-cols-1">


                                    {/* STEP 1 */}

                                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white shadow-md shadow-blue-200">

                                                01

                                            </div>

                                            <div>

                                                <p className="text-[9px] font-black uppercase tracking-wider text-blue-500">

                                                    Input

                                                </p>

                                                <p className="text-xs font-bold text-slate-700">

                                                    Well + Depth

                                                </p>

                                            </div>

                                        </div>

                                    </div>


                                    {/* STEP 2 */}

                                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-md shadow-indigo-200">

                                                02

                                            </div>

                                            <div>

                                                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-500">

                                                    Features

                                                </p>

                                                <p className="text-xs font-bold text-slate-700">

                                                    Historical Parameters

                                                </p>

                                            </div>

                                        </div>

                                    </div>


                                    {/* STEP 3 */}

                                    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-xs font-black text-white shadow-md shadow-purple-200">

                                                03

                                            </div>

                                            <div>

                                                <p className="text-[9px] font-black uppercase tracking-wider text-purple-500">

                                                    Prediction

                                                </p>

                                                <p className="text-xs font-bold text-slate-700">

                                                    Event Probabilities

                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                {/* STATUS */}

                                <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">

                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                                    <p className="text-[10px] font-bold text-emerald-700">

                                        Prediction engine ready for analysis

                                    </p>

                                </div>

                            </div>

                        </div>

                    )}

            </div>

        </main>

    );
}


// =============================================================
// PREDICTION RESULTS
// =============================================================

function PredictionResults({
    prediction,
}) {

    const predictions = Array.isArray(
        prediction?.predictions
    )
        ? prediction.predictions
        : [];


    const wellId =
        prediction?.well_id ||
        prediction?.wellId ||
        "Unknown Well";


    const requestedDepth =
        prediction?.requested_depth_m ??
        prediction?.requested_depth ??
        null;


    const usedDepth =
        prediction?.used_depth_m ??
        prediction?.used_depth ??
        prediction?.feature_lookup_depth_m ??
        prediction?.feature_lookup_depth ??
        null;


    const depthDifference =
        prediction?.depth_difference_m ??
        prediction?.depth_difference ??
        prediction?.feature_depth_difference_m ??
        prediction?.feature_depth_difference ??
        null;


    const features =
        prediction?.features || {};


    return (

        <section className="mt-8">


            {/* =================================================
                RESULT HEADER
            ================================================= */}

            <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 p-6 shadow-[0_15px_45px_rgba(37,99,235,0.08)]">

                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />


                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">


                    {/* WELL */}

                    <div>

                        <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200">

                                <Activity className="h-6 w-6 text-white" />

                            </div>


                            <div>

                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">

                                    Prediction Result

                                </p>

                                <h2 className="mt-1 text-2xl font-black text-[#172033]">

                                    {wellId}

                                </h2>

                            </div>

                        </div>


                        <p className="mt-4 text-xs font-medium text-slate-500">

                            Requested depth:{" "}

                            <span className="font-black text-blue-700">

                                {formatNumber(requestedDepth)} m

                            </span>

                        </p>

                    </div>


                    {/* FEATURE DEPTH */}

                    <div className="min-w-[240px] rounded-2xl border border-indigo-100 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm">

                        <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">

                                <Gauge className="h-4 w-4 text-indigo-600" />

                            </div>

                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-indigo-500">

                                Feature Lookup Depth

                            </p>

                        </div>


                        <p className="mt-2 text-2xl font-black text-indigo-700">

                            {formatNumber(usedDepth)} m

                        </p>


                        <p className="mt-1 text-[10px] font-semibold text-slate-400">

                            Difference:{" "}

                            <span className="font-black text-slate-600">

                                {formatNumber(depthDifference)} m

                            </span>

                        </p>

                    </div>

                </div>

            </div>


            {/* =================================================
                INPUT FEATURES
            ================================================= */}

            {Object.keys(features).length > 0 && (

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">


                    <div className="mb-5 flex items-start gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">

                            <Database className="h-5 w-5 text-blue-600" />

                        </div>


                        <div>

                            <h3 className="text-sm font-black text-[#172033]">

                                Input Features

                            </h3>

                            <p className="mt-1 text-xs text-slate-500">

                                Drilling parameters used by the prediction model.

                            </p>

                        </div>

                    </div>


                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">


                        <Feature
                            label="Depth"
                            value={
                                features.depth_m ??
                                usedDepth
                            }
                            unit="m"
                            color="blue"
                        />


                        <Feature
                            label="ROP"
                            value={
                                features.rop_m_hr
                            }
                            unit="m/hr"
                            color="indigo"
                        />


                        <Feature
                            label="Mud Weight"
                            value={
                                features.mud_weight_sg
                            }
                            unit="SG"
                            color="purple"
                        />


                        <Feature
                            label="Torque"
                            value={
                                features.torque_knm
                            }
                            unit="kN·m"
                            color="orange"
                        />


                        <Feature
                            label="ECD"
                            value={
                                features.ecd_sg
                            }
                            unit="SG"
                            color="cyan"
                        />


                        <Feature
                            label="Pump Rate"
                            value={
                                features.pump_rate_l_min
                            }
                            unit="L/min"
                            color="emerald"
                        />


                        <Feature
                            label="Distance"
                            value={
                                features.distance_km
                            }
                            unit="km"
                            color="pink"
                        />

                    </div>

                </div>

            )}


            {/* =================================================
                EVENT PROBABILITIES
            ================================================= */}

            <div className="mt-7">


                <div className="mb-4 flex items-end justify-between gap-4">

                    <div>

                        <div className="flex items-center gap-2">

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">

                                <TrendingUp className="h-4 w-4 text-purple-600" />

                            </div>

                            <h3 className="text-sm font-black text-[#172033]">

                                Event Probabilities

                            </h3>

                        </div>


                        <p className="mt-2 text-xs text-slate-500">

                            Model output for the available drilling event classes.

                        </p>

                    </div>


                    {predictions.length > 0 && (

                        <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-black text-emerald-700 sm:flex">

                            <CheckCircle2 className="h-3.5 w-3.5" />

                            Prediction Available

                        </div>

                    )}

                </div>


                {predictions.length === 0 ? (

                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">

                        <Activity className="mx-auto h-8 w-8 text-slate-300" />

                        <p className="mt-3 text-sm font-black text-slate-700">

                            No prediction results available.

                        </p>

                        <p className="mt-1 text-xs text-slate-400">

                            The prediction model did not return any event probabilities.

                        </p>

                    </div>

                ) : (

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                        {predictions.map(
                            (item, index) => (

                                <PredictionCard
                                    key={`${item?.event || "event"}-${index}`}
                                    event={
                                        item?.event ||
                                        "Unknown Event"
                                    }
                                    probability={
                                        item?.probability ??
                                        0
                                    }
                                />

                            )
                        )}

                    </div>

                )}

            </div>


            {/* =================================================
                PROTOTYPE MODEL NOTICE
            ================================================= */}

            <div className="mt-7 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">

                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />

                <div className="p-5">

                    <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">

                            <AlertTriangle className="h-4 w-4 text-amber-600" />

                        </div>


                        <div>

                            <p className="text-[11px] font-black uppercase tracking-wide text-amber-900">

                                Prototype Model Notice

                            </p>

                            <p className="mt-1 text-[11px] leading-5 text-amber-800">

                                These probabilities are generated from the
                                current prototype training model and should not
                                be interpreted as validated field-risk
                                probabilities.

                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </section>

    );
}


// =============================================================
// FEATURE CARD
// =============================================================

function Feature({
    label,
    value,
    unit,
    color = "blue",
}) {

    const displayValue =
        value === null ||
        value === undefined ||
        value === ""
            ? "N/A"
            : formatNumber(value);


    const styles = {

        blue: {
            wrapper:
                "border-blue-100 bg-gradient-to-br from-blue-50 to-white",
            label:
                "text-blue-500",
            value:
                "text-blue-800",
        },

        indigo: {
            wrapper:
                "border-indigo-100 bg-gradient-to-br from-indigo-50 to-white",
            label:
                "text-indigo-500",
            value:
                "text-indigo-800",
        },

        purple: {
            wrapper:
                "border-purple-100 bg-gradient-to-br from-purple-50 to-white",
            label:
                "text-purple-500",
            value:
                "text-purple-800",
        },

        orange: {
            wrapper:
                "border-orange-100 bg-gradient-to-br from-orange-50 to-white",
            label:
                "text-orange-500",
            value:
                "text-orange-800",
        },

        cyan: {
            wrapper:
                "border-cyan-100 bg-gradient-to-br from-cyan-50 to-white",
            label:
                "text-cyan-500",
            value:
                "text-cyan-800",
        },

        emerald: {
            wrapper:
                "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
            label:
                "text-emerald-500",
            value:
                "text-emerald-800",
        },

        pink: {
            wrapper:
                "border-pink-100 bg-gradient-to-br from-pink-50 to-white",
            label:
                "text-pink-500",
            value:
                "text-pink-800",
        },

    };


    const current =
        styles[color] ||
        styles.blue;


    return (

        <div
            className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${current.wrapper}`}
        >

            <p
                className={`text-[9px] font-black uppercase tracking-[0.15em] ${current.label}`}
            >
                {label}
            </p>


            <p
                className={`mt-2 text-lg font-black ${current.value}`}
            >

                {displayValue}


                {displayValue !== "N/A" && (

                    <span className="ml-1 text-[10px] font-bold text-slate-400">

                        {unit}

                    </span>

                )}

            </p>

        </div>

    );
}


// =============================================================
// NUMBER FORMATTER
// =============================================================

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "N/A";

    }


    const number =
        Number(value);


    if (!Number.isFinite(number)) {

        return String(value);

    }


    return Number.isInteger(number)

        ? number.toLocaleString()

        : number.toLocaleString(
            undefined,
            {
                maximumFractionDigits: 2,
            }
        );

}


export default Prediction;