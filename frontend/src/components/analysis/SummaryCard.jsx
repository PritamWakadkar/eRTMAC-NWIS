import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    FileSearch,
    Info,
} from "lucide-react";

function SummaryCard({
    title = "Analysis Summary",
    summary = "",
    eventCount = 0,
    nearbyWellCount = 0,
    status = "Completed",
}) {
    const hasEvents = eventCount > 0;

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div className="flex items-start gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <FileSearch className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            AI Analysis
                        </p>

                        <h2 className="mt-1 text-lg font-extrabold text-[#172033]">
                            {title}
                        </h2>
                    </div>

                </div>


                {/* Status */}

                <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase ${
                        status.toLowerCase() === "completed"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-700"
                    }`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            status.toLowerCase() === "completed"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                        }`}
                    />

                    {status}
                </div>

            </div>


            {/* Summary */}

            <div className="mt-5 rounded-xl bg-slate-50 p-4">

                <div className="flex items-start gap-3">

                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Summary
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {summary || "No summary information is available."}
                        </p>

                    </div>

                </div>

            </div>


            {/* Metrics */}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">

                <SummaryMetric
                    icon={hasEvents ? AlertTriangle : CheckCircle2}
                    label="Events"
                    value={eventCount}
                    active={hasEvents}
                />

                <SummaryMetric
                    icon={Activity}
                    label="Nearby Wells"
                    value={nearbyWellCount}
                />

                <SummaryMetric
                    icon={FileSearch}
                    label="Analysis Status"
                    value={status}
                />

            </div>

        </section>
    );
}


/* =========================================================
   SUMMARY METRIC
========================================================= */

function SummaryMetric({
    icon: Icon,
    label,
    value,
    active = false,
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">

            <div className="flex items-center justify-between gap-3">

                <div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 truncate text-lg font-extrabold text-slate-800">
                        {value}
                    </p>

                </div>

                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        active
                            ? "bg-amber-50"
                            : "bg-slate-100"
                    }`}
                >
                    <Icon
                        className={`h-4 w-4 ${
                            active
                                ? "text-amber-600"
                                : "text-slate-500"
                        }`}
                    />
                </div>

            </div>

        </div>
    );
}


export default SummaryCard;