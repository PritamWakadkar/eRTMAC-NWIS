import {
    Layers3,
    Mountain,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";

function FormationAnalysis({ formation = null }) {

    // Support both:
    // formation = "Sandstone"
    // OR
    // formation = { name, description, depth, events }

    if (!formation) {
        return (
            <section className="mt-8">

                <SectionHeader />

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <Layers3 className="h-6 w-6 text-slate-400" />
                    </div>

                    <h3 className="mt-4 text-sm font-extrabold text-slate-800">
                        No Formation Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        No formation information was returned for this
                        analysis.
                    </p>

                </div>

            </section>
        );
    }

    /*
     * Normalize formation data.
     */

    const formationName =
        typeof formation === "string"
            ? formation
            : formation.name ||
              formation.formation ||
              formation.formation_name ||
              "Unknown Formation";

    const description =
        typeof formation === "object"
            ? formation.description ||
              formation.details ||
              formation.summary ||
              "No additional formation information available."
            : "Formation identified from the available well information.";

    const topDepth =
        typeof formation === "object"
            ? formation.top_depth ??
              formation.start_depth ??
              formation.depth_from ??
              null
            : null;

    const bottomDepth =
        typeof formation === "object"
            ? formation.bottom_depth ??
              formation.end_depth ??
              formation.depth_to ??
              null
            : null;

    const events =
        typeof formation === "object"
            ? formation.events || []
            : [];

    return (
        <section className="mt-8">

            {/* Section Header */}

            <SectionHeader />


            {/* Main Formation Card */}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                    {/* Formation Identity */}

                    <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                            <Mountain className="h-6 w-6 text-emerald-600" />
                        </div>

                        <div>

                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Identified Formation
                            </p>

                            <h3 className="mt-1 text-xl font-extrabold text-[#172033]">
                                {formationName}
                            </h3>

                            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
                                {description}
                            </p>

                        </div>

                    </div>


                    {/* Status */}

                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">

                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                        <span className="text-xs font-bold text-emerald-700">
                            Formation Identified
                        </span>

                    </div>

                </div>


                {/* Depth Information */}

                {(topDepth !== null || bottomDepth !== null) && (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">

                        <DepthCard
                            label="Top Depth"
                            value={
                                topDepth !== null
                                    ? `${topDepth} m`
                                    : "—"
                            }
                        />

                        <DepthCard
                            label="Bottom Depth"
                            value={
                                bottomDepth !== null
                                    ? `${bottomDepth} m`
                                    : "—"
                            }
                        />

                    </div>
                )}


                {/* Formation Events */}

                {events.length > 0 && (
                    <div className="mt-6">

                        <div className="mb-3 flex items-center gap-2">

                            <AlertTriangle className="h-4 w-4 text-amber-500" />

                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                                Events Associated With Formation
                            </h4>

                        </div>

                        <div className="grid gap-3 md:grid-cols-2">

                            {events.map((event, index) => {

                                const eventName =
                                    event.event ||
                                    event.event_type ||
                                    event.type ||
                                    "Unknown Event";

                                const eventDepth =
                                    event.depth ??
                                    event.depth_m ??
                                    null;

                                return (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                    >

                                        <div className="flex items-center justify-between gap-3">

                                            <p className="text-sm font-extrabold capitalize text-slate-800">
                                                {formatText(eventName)}
                                            </p>

                                            {eventDepth !== null && (
                                                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
                                                    {eventDepth} m
                                                </span>
                                            )}

                                        </div>

                                        {event.description && (
                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                {event.description}
                                            </p>
                                        )}

                                    </div>
                                );
                            })}

                        </div>

                    </div>
                )}

            </div>

        </section>
    );
}


/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader() {
    return (
        <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">
                <Layers3 className="h-5 w-5 text-white" />
            </div>

            <div>

                <h2 className="text-lg font-extrabold text-[#172033]">
                    Formation Analysis
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                    Geological formation information associated with
                    the analyzed well interval.
                </p>

            </div>

        </div>
    );
}


/* =========================================================
   DEPTH CARD
========================================================= */

function DepthCard({
    label,
    value,
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-4">

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
            </p>

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


export default FormationAnalysis;