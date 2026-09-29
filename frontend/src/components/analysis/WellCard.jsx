import {
    RiMapPinLine as MapPin,
    RiRulerLine as Ruler,
    RiPulseLine as Activity,
    RiArrowRightLine as ArrowRight,
} from "@remixicon/react";

function WellCard({
    well,
    onSelect,
}) {
    if (!well) {
        return null;
    }

    const wellId =
        well.well_id ||
        well.id ||
        well.name ||
        "Unknown Well";

    const distance =
        well.distance_km ??
        well.distance ??
        null;

    const depth =
        well.depth_m ??
        well.depth ??
        null;

    const formation =
        well.formation ||
        well.formation_name ||
        "Not available";

    const status =
        well.status ||
        "Available";

    return (
        <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">

            {/* Header */}

            <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <MapPin className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Nearby Well
                        </p>

                        <h3 className="mt-1 text-base font-extrabold text-[#172033]">
                            {wellId}
                        </h3>

                    </div>

                </div>


                {/* Status */}

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-600">

                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                    {status}

                </span>

            </div>


            {/* Information */}

            <div className="mt-5 grid grid-cols-2 gap-3">

                <InfoItem
                    icon={MapPin}
                    label="Distance"
                    value={
                        distance !== null
                            ? `${distance} km`
                            : "—"
                    }
                />

                <InfoItem
                    icon={Ruler}
                    label="Depth"
                    value={
                        depth !== null
                            ? `${depth} m`
                            : "—"
                    }
                />

            </div>


            {/* Formation */}

            <div className="mt-3 rounded-xl bg-slate-50 p-3">

                <div className="flex items-center gap-2">

                    <Activity className="h-3.5 w-3.5 text-slate-400" />

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Formation
                    </p>

                </div>

                <p className="mt-1 truncate text-sm font-extrabold text-slate-700">
                    {formation}
                </p>

            </div>


            {/* Action */}

            {onSelect && (
                <button
                    type="button"
                    onClick={() => onSelect(well)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                    View Well Details

                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
            )}

        </article>
    );
}


/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
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


export default WellCard;