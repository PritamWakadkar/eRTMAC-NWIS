import {
    Activity,
    Database,
    ShieldCheck,
} from "lucide-react";

function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white">

            <div className="mx-auto max-w-[1400px] px-6 py-8 max-sm:px-4">

                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                    {/* Brand */}

                    <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">
                            <Database className="h-5 w-5 text-white" />
                        </div>

                        <div>

                            <h2 className="text-sm font-extrabold text-[#172033]">
                                eRTMAC-NWIS
                            </h2>

                            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                                Nearby Wells Intelligence System for
                                AI-powered drilling knowledge and
                                decision support.
                            </p>

                        </div>

                    </div>


                    {/* System Modules */}

                    <div className="flex flex-wrap gap-2">

                        <StatusItem
                            icon={Activity}
                            label="NLP + RAG"
                        />

                        <StatusItem
                            icon={Database}
                            label="Well Intelligence"
                        />

                        <StatusItem
                            icon={ShieldCheck}
                            label="Prediction"
                        />

                    </div>

                </div>


                {/* Bottom */}

                <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">

                    <p>
                        eRTMAC-NWIS • Smart Drilling Intelligence
                    </p>

                    <div className="flex items-center gap-2">

                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                        <span className="font-semibold">
                            System Online
                        </span>

                    </div>

                </div>

            </div>

        </footer>
    );
}


/* =========================================================
   STATUS ITEM
========================================================= */

function StatusItem({
    icon: Icon,
    label,
}) {
    return (
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">

            <Icon className="h-3.5 w-3.5 text-slate-500" />

            <span className="text-[10px] font-bold text-slate-600">
                {label}
            </span>

        </div>
    );
}

export default Footer;