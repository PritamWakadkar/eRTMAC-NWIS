import {
    RiHistoryLine as History,
    RiCalendarLine as CalendarDays,
    RiArrowDownLine as ArrowDown,
    RiArrowUpLine as ArrowUp,
    RiFileTextLine as FileText,
} from "@remixicon/react";

function HistoricalInterval({ intervals = [] }) {
    if (!intervals || intervals.length === 0) {
        return (
            <section className="mt-8">

                {/* Header */}

                <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">
                        <History className="h-5 w-5 text-white" />
                    </div>

                    <div>
                        <h2 className="text-lg font-extrabold text-[#172033]">
                            Historical Intervals
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Historical drilling intervals relevant to the
                            current analysis.
                        </p>
                    </div>

                </div>


                {/* Empty State */}

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <History className="h-6 w-6 text-slate-400" />
                    </div>

                    <h3 className="mt-4 text-sm font-extrabold text-slate-800">
                        No historical intervals found
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        No relevant historical interval data was returned
                        for this analysis.
                    </p>

                </div>

            </section>
        );
    }


    return (
        <section className="mt-8">

            {/* Header */}

            <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">
                    <History className="h-5 w-5 text-white" />
                </div>

                <div>
                    <h2 className="text-lg font-extrabold text-[#172033]">
                        Historical Intervals
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Historical drilling intervals relevant to the
                        current analysis.
                    </p>
                </div>

            </div>


            {/* Interval Cards */}

            <div className="mt-4 space-y-4">

                {intervals.map((interval, index) => {

                    const wellId =
                        interval.well_id ||
                        interval.well ||
                        interval.well_name ||
                        "Unknown Well";

                    const startDepth =
                        interval.start_depth ??
                        interval.depth_from ??
                        interval.from_depth ??
                        null;

                    const endDepth =
                        interval.end_depth ??
                        interval.depth_to ??
                        interval.to_depth ??
                        null;

                    const description =
                        interval.description ||
                        interval.details ||
                        interval.summary ||
                        "No additional historical information available.";

                    const event =
                        interval.event ||
                        interval.event_type ||
                        interval.type ||
                        "Historical Event";

                    const formation =
                        interval.formation ||
                        interval.formations ||
                        "Not available";

                    return (
                        <article
                            key={index}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                        >

                            {/* Top */}

                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                                <div className="flex items-start gap-3">

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>

                                    <div>

                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Historical Well
                                        </p>

                                        <h3 className="mt-1 text-sm font-extrabold text-slate-900">
                                            {wellId}
                                        </h3>

                                    </div>

                                </div>


                                {/* Event Badge */}

                                <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                                    {formatText(event)}
                                </span>

                            </div>


                            {/* Depth Information */}

                            <div className="mt-5 grid gap-3 sm:grid-cols-3">

                                <DepthBox
                                    icon={ArrowDown}
                                    label="Start Depth"
                                    value={
                                        startDepth !== null
                                            ? `${startDepth} m`
                                            : "—"
                                    }
                                />

                                <DepthBox
                                    icon={ArrowUp}
                                    label="End Depth"
                                    value={
                                        endDepth !== null
                                            ? `${endDepth} m`
                                            : "—"
                                    }
                                />

                                <DepthBox
                                    icon={CalendarDays}
                                    label="Formation"
                                    value={formation}
                                />

                            </div>


                            {/* Description */}

                            <div className="mt-4 rounded-xl bg-slate-50 p-4">

                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Historical Observation
                                </p>

                                <p className="mt-2 text-xs leading-6 text-slate-600">
                                    {description}
                                </p>

                            </div>

                        </article>
                    );
                })}

            </div>

        </section>
    );
}


/* =========================================================
   DEPTH BOX
========================================================= */

function DepthBox({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">

            <div className="flex items-center gap-2">

                <Icon className="h-3.5 w-3.5 text-slate-400" />

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </p>

            </div>

            <p className="mt-1 text-sm font-extrabold text-slate-800">
                {value}
            </p>

        </div>
    );
}


/* =========================================================
   FORMAT TEXT
========================================================= */

function formatText(value) {
    return String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}


export default HistoricalInterval;