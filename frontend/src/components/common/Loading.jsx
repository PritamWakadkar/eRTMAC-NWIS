import { RiLoader4Line } from "@remixicon/react";

function Loading({
    message = "Analyzing well data...",
}) {
    return (
        <div className="flex min-h-[260px] items-center justify-center">

            <div className="flex flex-col items-center text-center">

                {/* Spinner */}

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">

                    <RiLoader4Line className="h-7 w-7 animate-spin text-blue-600" />

                </div>


                {/* Message */}

                <h3 className="mt-4 text-sm font-extrabold text-slate-800">
                    {message}
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Processing NLP, RAG retrieval and nearby-well
                    intelligence. Please wait.
                </p>

            </div>

        </div>
    );
}

export default Loading;