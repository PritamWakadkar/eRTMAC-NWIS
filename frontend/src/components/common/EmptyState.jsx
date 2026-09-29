import {
    RiInboxLine,
    RiSearchLine,
} from "@remixicon/react";

function EmptyState({
    title = "No Data Available",
    message = "There is no information available to display.",
    actionLabel = null,
    onAction = null,
}) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

            {/* Icon */}

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <RiInboxLine className="h-7 w-7 text-slate-400" />
            </div>

            {/* Content */}

            <h3 className="mt-4 text-sm font-extrabold text-slate-800">
                {title}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                {message}
            </p>

            {/* Optional Action */}

            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#172033] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800"
                >
                    <RiSearchLine className="h-4 w-4" />
                    {actionLabel}
                </button>
            )}

        </div>
    );
}

export default EmptyState;