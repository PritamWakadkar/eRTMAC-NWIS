import {
    RiAlertLine as AlertTriangle,
    RiCheckboxCircleLine as CheckCircle2,
    RiTimeLine as Clock3,
    RiPulseLine as Activity,
} from "@remixicon/react";

function DepthEventAnalysis({ events = [], depth = null }) {
    if (!events || events.length === 0) {
        return (
            <section className="mt-8">

                <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">
                        <Activity className="h-5 w-5 text-white" />
                    </div>

                    <div>
                        <h2 className="text-lg font-extrabold text-[#172033]">
                            Depth Event Analysis
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Drilling events identified around the analyzed
                            depth.
                        </p>
                    </div>

                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>

                    <h3 className="mt-4 text-sm font-extrabold text-slate-800">
                        No depth events detected
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        No drilling events were returned for this depth.
                    </p>

                </div>

            </section>
        );
    }

    return (
        <section className="mt-8">

            {/* Section Header */}

            <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">
                    <Activity className="h-5 w-5 text-white" />
                </div>

                <div>
                    <h2 className="text-lg font-extrabold text-[#172033]">
                        Depth Event Analysis
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Drilling events identified around the analyzed
                        depth.
                    </p>
                </div>

            </div>


            {/* Depth Information */}

            {depth !== null && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">

                    <Clock3 className="h-4 w-4 text-blue-600" />

                    <span className="text-xs font-bold text-blue-700">
                        Analysis Depth:
                    </span>

                    <span className="text-xs font-extrabold text-blue-900">
                        {depth} m
                    </span>

                </div>
            )}


            {/* Events */}

            <div className="mt-4 space-y-3">

                {events.map((event, index) => {

                    const eventName =
                        event.event ||
                        event.event_type ||
                        event.type ||
                        "Unknown Event";

                    const eventDepth =
                        event.depth_m ??
                        event.depth ??
                        event.start_depth ??
                        null;

                    const description =
                        event.description ||
                        event.details ||
                        event.explanation ||
                        "No additional information available.";

                    const severity =
                        event.severity ||
                        event.risk ||
                        "Detected";

                    const isNormal =
                        String(eventName).toLowerCase() === "normal";

                    return (
                        <div
                            key={index}
                            className={`rounded-2xl border bg-white p-5 shadow-sm ${
                                isNormal
                                    ? "border-emerald-200"
                                    : "border-amber-200"
                            }`}
                        >

                            <div className="flex items-start justify-between gap-4">

                                {/* Event information */}

                                <div className="flex items-start gap-3">

                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                            isNormal
                                                ? "bg-emerald-50"
                                                : "bg-amber-50"
                                        }`}
                                    >
                                        {isNormal ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                                        )}
                                    </div>


                                    <div>

                                        <h3 className="text-sm font-extrabold capitalize text-slate-900">
                                            {formatEventName(eventName)}
                                        </h3>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            {description}
                                        </p>

                                    </div>

                                </div>


                                {/* Severity */}

                                <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                                        isNormal
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-amber-50 text-amber-700"
                                    }`}
                                >
                                    {severity}
                                </span>

                            </div>


                            {/* Event Metadata */}

                            <div className="mt-5 grid grid-cols-2 gap-3">

                                <div className="rounded-xl bg-slate-50 p-3">

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Event Depth
                                    </p>

                                    <p className="mt-1 text-sm font-extrabold text-slate-800">
                                        {eventDepth !== null
                                            ? `${eventDepth} m`
                                            : "—"}
                                    </p>

                                </div>


                                <div className="rounded-xl bg-slate-50 p-3">

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Status
                                    </p>

                                    <p className="mt-1 text-sm font-extrabold capitalize text-slate-800">
                                        {severity}
                                    </p>

                                </div>

                            </div>

                        </div>
                    );
                })}

            </div>

        </section>
    );
}


/* =========================================================
   FORMAT EVENT NAME
========================================================= */

function formatEventName(name) {
    return String(name)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}


export default DepthEventAnalysis;