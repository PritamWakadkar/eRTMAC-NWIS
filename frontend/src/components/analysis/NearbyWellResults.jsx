import {
    MapPin,
    SearchX,
} from "lucide-react";

import WellCard from "./WellCard";

function NearbyWellResults({
    wells = [],
    onSelectWell,
}) {
    return (
        <section className="mt-8">

            {/* Section Header */}

            <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">
                        <MapPin className="h-5 w-5 text-white" />
                    </div>

                    <div>

                        <h2 className="text-lg font-extrabold text-[#172033]">
                            Nearby Wells
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Offset wells identified within the configured
                            search radius.
                        </p>

                    </div>

                </div>


                {/* Result Count */}

                <div className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5">

                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
                        {wells.length}{" "}
                        {wells.length === 1 ? "Well" : "Wells"}
                    </span>

                </div>

            </div>


            {/* Empty State */}

            {wells.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <SearchX className="h-6 w-6 text-slate-400" />
                    </div>

                    <h3 className="mt-4 text-sm font-extrabold text-slate-800">
                        No Nearby Wells Found
                    </h3>

                    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                        No offset wells were returned for the selected
                        search parameters.
                    </p>

                </div>
            ) : (

                /* Well Grid */

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {wells.map((well, index) => (

                        <WellCard
                            key={
                                well.well_id ||
                                well.id ||
                                index
                            }
                            well={well}
                            onSelect={onSelectWell}
                        />

                    ))}

                </div>
            )}

        </section>
    );
}

export default NearbyWellResults;