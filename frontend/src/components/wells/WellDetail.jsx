function WellDetail({ well }) {
    if (!well) {
        return null;
    }

    const events = Array.isArray(well?.events) ? well.events : [];

    const wellId = well?.well_id || "Unknown Well";

    const distance =
        well?.distance_km !== undefined &&
        well?.distance_km !== null
            ? Number(well.distance_km).toFixed(2)
            : null;

    const formation = well?.formation || "N/A";

    const totalDepth =
        well?.total_depth !== undefined &&
        well?.total_depth !== null
            ? Number(well.total_depth).toLocaleString()
            : null;

    /*
     * formation_match may be:
     *
     * { match: true }
     * { match: false }
     *
     * or directly:
     *
     * true / false
     */
    const formationMatch =
        typeof well?.formation_match === "object"
            ? Boolean(well?.formation_match?.match)
            : Boolean(well?.formation_match);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(15,23,42,0.08)]">

            {/* =====================================================
                HEADER
            ====================================================== */}
            <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-5 max-sm:flex-col">

                <div>
                    <span className="text-[10px] font-extrabold tracking-[1.5px] text-blue-600">
                        WELL INTELLIGENCE
                    </span>

                    <h2 className="mt-1.5 text-2xl font-extrabold text-[#172033]">
                        {wellId}
                    </h2>

                    <p className="mt-1 text-xs leading-6 text-slate-500">
                        Detailed drilling-event information
                        from retrieved evidence.
                    </p>
                </div>

                {/* Distance */}
                {distance !== null && (
                    <div className="min-w-[120px] rounded-xl bg-blue-50 px-4 py-3 text-center max-sm:w-full">

                        <strong className="block text-[17px] font-extrabold text-blue-600">
                            {distance} km
                        </strong>

                        <span className="mt-0.5 block text-[10px] text-slate-500">
                            from target well
                        </span>

                    </div>
                )}
            </div>


            {/* =====================================================
                WELL INFORMATION
            ====================================================== */}
            <div className="mt-5 grid grid-cols-4 gap-3 max-[850px]:grid-cols-2 max-sm:grid-cols-1">

                {/* Formation */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">

                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Formation
                    </span>

                    <strong className="mt-1.5 block text-[13px] font-bold text-slate-700">
                        {formation}
                    </strong>

                </div>


                {/* Total Depth */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">

                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Total Depth
                    </span>

                    <strong className="mt-1.5 block text-[13px] font-bold text-slate-700">
                        {totalDepth !== null
                            ? `${totalDepth} m`
                            : "N/A"}
                    </strong>

                </div>


                {/* Formation Match */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">

                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Formation Match
                    </span>

                    <strong
                        className={
                            formationMatch
                                ? "mt-1.5 block text-[13px] font-bold text-emerald-600"
                                : "mt-1.5 block text-[13px] font-bold text-slate-500"
                        }
                    >
                        {formationMatch
                            ? "Matched"
                            : "Not Matched"}
                    </strong>

                </div>


                {/* Events */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">

                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Events
                    </span>

                    <strong className="mt-1.5 block text-[13px] font-bold text-slate-700">
                        {events.length}
                    </strong>

                </div>

            </div>


            {/* =====================================================
                EVENT TIMELINE
            ====================================================== */}
            <div className="mt-7">

                <h3 className="mb-5 text-base font-extrabold text-[#172033]">
                    Drilling Event Timeline
                </h3>


                {/* No Events */}
                {events.length === 0 ? (

                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

                        <p className="text-xs leading-5 text-slate-400">
                            No drilling events were found
                            for this well in the retrieved
                            evidence.
                        </p>

                    </div>

                ) : (

                    /* Events */
                    <div>

                        {events.map((event, index) => {

                            const eventType =
                                event?.event ||
                                event?.event_type ||
                                "Unknown Event";

                            return (
                                <div
                                    className="relative flex gap-4 pb-5"
                                    key={`${eventType}-${event?.depth || index}-${index}`}
                                >

                                    {/* Timeline Line */}
                                    {index !== events.length - 1 && (
                                        <div className="absolute left-[14px] top-[30px] bottom-0 w-0.5 bg-blue-100"></div>
                                    )}


                                    {/* Timeline Number */}
                                    <div className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-extrabold text-white shadow-[0_0_0_5px_#eff6ff]">
                                        {index + 1}
                                    </div>


                                    {/* Event Content */}
                                    <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 transition duration-200 hover:translate-x-0.5 hover:border-blue-200 hover:bg-blue-50/30">

                                        {/* Event Title */}
                                        <div className="flex items-start justify-between gap-4 max-sm:flex-col max-sm:gap-2">

                                            <h4 className="text-[13px] font-extrabold capitalize text-slate-700">
                                                {formatEventName(eventType)}
                                            </h4>

                                            {event?.depth ? (
                                                <span className="whitespace-nowrap rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">
                                                    {event.depth}
                                                </span>
                                            ) : (
                                                <span className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
                                                    Depth N/A
                                                </span>
                                            )}

                                        </div>


                                        {/* Measurement */}
                                        {event?.measurement ? (

                                            <p className="mt-2 text-xs leading-5 text-slate-500">

                                                <strong className="font-bold text-slate-600">
                                                    Measurement:
                                                </strong>{" "}

                                                {event.measurement}

                                            </p>

                                        ) : (

                                            <p className="mt-2 text-xs leading-5 text-slate-400">
                                                Measurement: Not specified
                                            </p>

                                        )}


                                        {/* Evidence */}
                                        {event?.evidence && (

                                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                                                {event.evidence}
                                            </p>

                                        )}


                                        {/* Source */}
                                        {event?.document && (

                                            <div className="mt-2.5 border-t border-dashed border-slate-200 pt-2 text-[10px] font-semibold text-slate-400">

                                                Source: {event.document}

                                                {event?.page !== undefined &&
                                                    event?.page !== null && (
                                                        <>
                                                            {" "}• Page{" "}
                                                            {event.page}
                                                        </>
                                                    )}

                                            </div>

                                        )}

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

        </section>
    );
}


/* =========================================================
   HELPER
========================================================= */

function formatEventName(eventType) {
    if (!eventType) {
        return "Unknown Event";
    }

    return String(eventType)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}


export default WellDetail;