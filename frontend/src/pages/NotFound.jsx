import { Link } from "react-router-dom";
import {
    RiErrorWarningLine,
    RiArrowLeftLine,
    RiHome4Line,
} from "@remixicon/react";


function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50">

           

            <main className="flex min-h-[calc(100vh-76px)] items-center justify-center px-6 py-12 max-sm:px-4">

                <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">

                    {/* Icon */}

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                        <RiErrorWarningLine className="h-8 w-8 text-slate-400" />
                    </div>


                    {/* Error Code */}

                    <p className="mt-6 text-5xl font-extrabold tracking-tight text-[#172033]">
                        404
                    </p>


                    {/* Title */}

                    <h1 className="mt-3 text-lg font-extrabold text-slate-800">
                        Page Not Found
                    </h1>


                    {/* Description */}

                    <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                        The page you are trying to access does not exist
                        or the requested route is unavailable.
                    </p>


                    {/* Actions */}

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">

                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172033] px-5 py-3 text-xs font-extrabold text-white transition hover:bg-slate-800"
                        >
                            <RiHome4Line className="h-4 w-4" />
                            Dashboard
                        </Link>

                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                            <RiArrowLeftLine className="h-4 w-4" />
                            Go Back
                        </button>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default NotFound;