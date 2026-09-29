import { useState } from "react";
import {
    RiBrainLine,
    RiRulerLine,
    RiSearchLine,
    RiRestartLine,
    RiMapPinLine,
} from "@remixicon/react";


// Manual parameter fields (label, key, unit, example)
const PARAMETER_FIELDS = [
    { key: "rop_m_hr", label: "ROP", unit: "m/hr", example: "13" },
    { key: "mud_weight_sg", label: "Mud Weight", unit: "SG", example: "1.20" },
    { key: "torque_knm", label: "Torque", unit: "kN·m", example: "17" },
    { key: "ecd_sg", label: "ECD", unit: "SG", example: "1.25" },
    { key: "pump_rate_l_min", label: "Pump Rate", unit: "L/min", example: "2200" },
];

const EMPTY_PARAMS = {
    rop_m_hr: "",
    mud_weight_sg: "",
    torque_knm: "",
    ecd_sg: "",
    pump_rate_l_min: "",
    distance_km: "",
};

const isNumber = (value) =>
    value !== "" && Number.isFinite(Number(value));


function PredictionPanel({
    wellId,
    setWellId,
    depth,
    setDepth,
    onPredict,
    onReset,
    loading = false,
}) {

    const [useManual, setUseManual] = useState(false);
    const [params, setParams] = useState(EMPTY_PARAMS);

    const updateParam = (key, value) =>
        setParams((current) => ({ ...current, [key]: value }));

    const numericDepth = Number(depth);

    const isDepthValid =
        depth !== "" &&
        Number.isFinite(numericDepth) &&
        numericDepth >= 0;

    // All five model inputs are required in manual mode.
    // Distance is optional (calculated from the nearest well when empty).
    const areParamsValid =
        PARAMETER_FIELDS.every((field) => isNumber(params[field.key])) &&
        (params.distance_km === "" ||
            (isNumber(params.distance_km) &&
                Number(params.distance_km) >= 0));

    const canPredict =
        !loading &&
        wellId.trim() !== "" &&
        isDepthValid &&
        (!useManual || areParamsValid);

    const buildManualParams = () => ({
        rop_m_hr: Number(params.rop_m_hr),
        mud_weight_sg: Number(params.mud_weight_sg),
        torque_knm: Number(params.torque_knm),
        ecd_sg: Number(params.ecd_sg),
        pump_rate_l_min: Number(params.pump_rate_l_min),
        distance_km:
            params.distance_km === ""
                ? null
                : Number(params.distance_km),
    });

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!canPredict) {
            return;
        }

        // null = look up parameters in the dataset (normal mode)
        onPredict(useManual ? buildManualParams() : null);
    };

    const handleReset = () => {
        setUseManual(false);
        setParams(EMPTY_PARAMS);

        if (onReset) {
            onReset();
            return;
        }

        setWellId("");
        setDepth("");
    };

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            {/* =====================================================
                HEADER
            ====================================================== */}

            <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">
                    <RiBrainLine className="h-5 w-5 text-white" />
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

                            <RiMapPinLine
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

                            <RiRulerLine
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


                        {isDepthValid && !useManual && (
                            <p className="mt-2 text-[10px] text-slate-400">
                                Prediction features are selected
                                using the nearest available depth.
                            </p>
                        )}

                    </div>

                </div>


                {/* =====================================================
                    MANUAL PARAMETERS
                ====================================================== */}

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <label className="flex cursor-pointer items-start gap-3">

                        <input
                            type="checkbox"
                            checked={useManual}
                            onChange={(event) =>
                                setUseManual(event.target.checked)
                            }
                            disabled={loading}
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                        />

                        <span>

                            <span className="block text-xs font-extrabold text-slate-800">
                                Enter drilling parameters manually
                            </span>

                            <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                                Use this for a well with no parameter
                                data in the dataset, for example a well
                                added from an uploaded report. The model
                                will run on the values you enter.
                            </span>

                        </span>

                    </label>


                    {useManual && (

                        <div className="mt-4">

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                                {PARAMETER_FIELDS.map((field) => (

                                    <div key={field.key}>

                                        <label
                                            htmlFor={`param-${field.key}`}
                                            className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500"
                                        >
                                            {field.label}
                                        </label>

                                        <div className="relative">

                                            <input
                                                id={`param-${field.key}`}
                                                type="number"
                                                step="any"
                                                value={params[field.key]}
                                                onChange={(event) =>
                                                    updateParam(
                                                        field.key,
                                                        event.target.value
                                                    )
                                                }
                                                placeholder={`e.g. ${field.example}`}
                                                disabled={loading}
                                                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-16 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                                            />

                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                                {field.unit}
                                            </span>

                                        </div>

                                    </div>

                                ))}


                                <div>

                                    <label
                                        htmlFor="param-distance_km"
                                        className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500"
                                    >
                                        Distance (optional)
                                    </label>

                                    <div className="relative">

                                        <input
                                            id="param-distance_km"
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={params.distance_km}
                                            onChange={(event) =>
                                                updateParam(
                                                    "distance_km",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="auto"
                                            disabled={loading}
                                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                                        />

                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                            km
                                        </span>

                                    </div>

                                </div>

                            </div>


                            <p className="mt-3 text-[10px] leading-5 text-slate-400">
                                All five parameters are required. If the
                                distance is left empty, it is calculated as
                                the distance from this well to the nearest
                                other well.
                            </p>

                        </div>

                    )}

                </div>


                {/* =====================================================
                    INFORMATION
                ====================================================== */}

                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                    <div className="flex items-start gap-3">

                        <RiBrainLine className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

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

                        <RiRestartLine className="h-4 w-4" />

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
                                <RiSearchLine className="h-4 w-4" />

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