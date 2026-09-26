import {
    MapPin,
    Database,
    Ruler,
    Activity,
    Layers3,
    CalendarDays,
} from "lucide-react";

function WellInformation({ well = null }) {
    if (!well) {
        return (
            <section className="mt-8">
                <SectionHeader />

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <Database className="h-6 w-6 text-slate-400" />
                    </div>

                    <h3 className="mt-4 text-sm font-extrabold text-slate-800">
                        No Well Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        Well information is not available for this analysis.
                    </p>
                </div>
            </section>
        );
    }

    const wellId =
        well.well_id ||
        well.id ||
        well.name ||
        "Unknown Well";

    const latitude =
        well.latitude ??
        well.lat ??
        well.coordinates?.latitude ??
        null;

    const longitude =
        well.longitude ??
        well.lon ??
        well.coordinates?.longitude ??
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
        well.availability ||
        "Available";

    const date =
        well.date ||
        well.drilling_date ||
        well.completion_date ||
        null;

    return (
        <section className="mt-8">

            <SectionHeader />

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                {/* Well Identity */}

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                            <MapPin className="h-6 w-6 text-blue-600" />
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Well Identifier
                            </p>

                            <h3 className="mt-1 text-xl font-extrabold text-[#172033]">
                                {wellId}
                            </h3>
                        </div>

                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {formatText(status)}
                    </span>

                </div>


                {/* Information Grid */}

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    <InfoCard
                        icon={Ruler}
                        label="Depth"
                        value={
                            depth !== null
                                ? `${depth} m`
                                : "Not available"
                        }
                    />

                    <InfoCard
                        icon={Layers3}
                        label="Formation"
                        value={formation}
                    />

                    <InfoCard
                        icon={CalendarDays}
                        label="Date"
                        value={date || "Not available"}
                    />

                    <InfoCard
                        icon={MapPin}
                        label="Latitude"
                        value={
                            latitude !== null
                                ? latitude
                                : "Not available"
                        }
                    />

                    <InfoCard
                        icon={MapPin}
                        label="Longitude"
                        value={
                            longitude !== null
                                ? longitude
                                : "Not available"
                        }
                    />

                    <InfoCard
                        icon={Activity}
                        label="Status"
                        value={formatText(status)}
                    />

                </div>


                {/* Coordinates */}

                {latitude !== null && longitude !== null && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                        <div className="flex items-center gap-2">

                            <MapPin className="h-4 w-4 text-slate-500" />

                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Well Coordinates
                            </p>

                        </div>

                        <p className="mt-2 font-mono text-xs font-semibold text-slate-700">
                            {latitude}, {longitude}
                        </p>

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
                <Database className="h-5 w-5 text-white" />
            </div>

            <div>

                <h2 className="text-lg font-extrabold text-[#172033]">
                    Well Information
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                    Key metadata and operational information for the
                    analyzed well.
                </p>

            </div>

        </div>
    );
}


/* =========================================================
   INFORMATION CARD
========================================================= */

function InfoCard({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-4">

            <div className="flex items-center gap-2">

                <Icon className="h-4 w-4 text-slate-400" />

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </p>

            </div>

            <p className="mt-2 truncate text-sm font-extrabold text-slate-800">
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


export default WellInformation;