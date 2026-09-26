function WellCard({ well }) {
    const events = Array.isArray(well?.events) ? well.events : [];

    const wellId = well?.well_id || "Unknown Well";
    const distance =
        well?.distance_km !== undefined && well?.distance_km !== null
            ? Number(well.distance_km).toFixed(2)
            : null;

    const formation = well?.formation || "Not specified";

    const totalDepth =
        well?.total_depth !== undefined && well?.total_depth !== null
            ? Number(well.total_depth).toLocaleString()
            : null;

    /*
     * formation_match can be:
     *
     * { match: true, ... }
     * { match: false, ... }
     *
     * or simply true / false.
     */
    const formationMatch =
        typeof well?.formation_match === "object"
            ? Boolean(well?.formation_match?.match)
            : Boolean(well?.formation_match);

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_25px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]">

            {/* =====================================================
                WELL HEADER
            ====================================================== */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">

                {/* Well title */}
                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033] text-sm font-extrabold text-white">
                        W
                    </div>

                    <div>
                        <h3 className="text-base font-extrabold text-[#172033]">
                            {wellId}
                        </h3>

                        {distance !== null ? (
                            <span className="mt-0.5 block text-xs font-medium text-slate-400">
                                {distance} km away
                            </span>
                        ) : (
                            <span className="mt-0.5 block text-xs font-medium text-slate-400">
                                Distance unavailable
                            </span>
                        )}
                    </div>
                </div>

                {/* Formation match badge */}
                <div
                    className={
                        formationMatch
                            ? "rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold text-emerald-600"
                            : "rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold text-slate-500"
                    }
                >
                    {formationMatch
                        ? "Formation Match"
                        : "Different Formation"}
                </div>
            </div>

            {/* =====================================================
                WELL DETAILS
            ====================================================== */}
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">

                {/* Formation */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Formation
                    </span>

                    <strong className="mt-1.5 block text-sm font-bold text-slate-700">
                        {formation}
                    </strong>
                </div>

                {/* Total depth */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Total Depth
                    </span>

                    <strong className="mt-1.5 block text-sm font-bold text-slate-700">
                        {totalDepth !== null
                            ? `${totalDepth} m`
                            : "N/A"}
                    </strong>
                </div>
            </div>

            {/* =====================================================
                DRILLING EVENTS
            ====================================================== */}
            <div className="border-t border-slate-100 px-5 pb-5">

                <div className="flex items-center justify-between py-4">

                    <h4 className="text-sm font-extrabold text-[#172033]">
                        Drilling Events
                    </h4>

                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-50 px-2 text-[10px] font-extrabold text-blue-600">
                        {events.length}
                    </span>
                </div>

                {/* No events */}
                {events.length === 0 ? (

                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs font-medium text-slate-400">
                        No structured drilling events found.
                    </div>

                ) : (

                    /* Events */
                    <div className="space-y-3">

                        {events.map((event, index) => (

                            <div
                                key={`${event?.event || "event"}-${event?.depth || index}-${index}`}
                                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 transition duration-200 hover:border-blue-200 hover:bg-blue-50/30"
                            >

                                {/* Event marker */}
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-extrabold text-red-500">
                                    !
                                </div>

                                {/* Event body */}
                                <div className="min-w-0 flex-1">

                                    <div className="flex items-start justify-between gap-3">

                                        <strong className="text-xs font-extrabold capitalize text-slate-700">
                                            {formatEventName(event?.event)}
                                        </strong>

                                        {event?.depth ? (
                                            <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">
                                                {event.depth}
                                            </span>
                                        ) : (
                                            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
                                                Depth N/A
                                            </span>
                                        )}
                                    </div>

                                    {/* Measurement */}
                                    {event?.measurement ? (
                                        <p className="mt-2 text-xs leading-5 text-slate-500">
                                            Measurement:{" "}
                                            <strong className="font-bold text-slate-600">
                                                {event.measurement}
                                            </strong>
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-xs leading-5 text-slate-400">
                                            Measurement: Not specified
                                        </p>
                                    )}

                                    {/* Evidence */}
                                    {event?.evidence ? (
                                        <p className="mt-2 border-l-2 border-blue-200 pl-3 text-xs leading-5 text-slate-500">
                                            {event.evidence}
                                        </p>
                                    ) : null}

                                    {/* Source */}
                                    {event?.document ? (
                                        <small className="mt-3 block border-t border-dashed border-slate-200 pt-2 text-[10px] font-semibold text-slate-400">
                                            Source: {event.document}

                                            {event?.page !== undefined &&
                                                event?.page !== null
                                                ? ` — Page ${event.page}`
                                                : ""}
                                        </small>
                                    ) : null}

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}


/* =========================================================
   HELPERS
========================================================= */

function formatEventName(eventName) {
    if (!eventName) {
        return "Unknown Event";
    }

    return String(eventName)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}


export default WellCard;