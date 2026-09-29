import {
    RiErrorWarningLine,
    RiRefreshLine,
} from "@remixicon/react";

function ErrorState({
    title = "Something Went Wrong",
    message = "We could not complete the requested operation.",
    onRetry = null,
}) {
    return (
        <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">

            {/* Error Icon */}

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                <RiErrorWarningLine className="h-7 w-7 text-red-500" />
            </div>


            {/* Error Message */}

            <h3 className="mt-4 text-sm font-extrabold text-slate-800">
                {title}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                {message}
            </p>


            {/* Retry */}

            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#172033] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800"
                >
                    <RiRefreshLine className="h-4 w-4" />
                    Try Again
                </button>
            )}

        </div>
    );
}

export default ErrorState;