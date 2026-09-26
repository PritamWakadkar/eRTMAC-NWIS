import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    CircleAlert,
    Gauge,
    TrendingUp,
    Zap,
} from "lucide-react";

function formatEventName(event) {
    if (!event) return "Unknown Event";

    return event
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getEventConfig(event, probability) {
    const normalized = event?.toLowerCase();

    if (normalized === "normal") {
        return {
            icon: CheckCircle2,
            label: "Normal",
            accent: "emerald",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            text: "text-emerald-700",
            bar: "bg-emerald-500",
            glow: "shadow-emerald-100",
        };
    }

    if (
        normalized === "mud_loss" ||
        normalized === "mud loss"
    ) {
        return {
            icon: Activity,
            label: "Mud Loss",
            accent: "blue",
            bg: "bg-blue-50",
            border: "border-blue-200",
            text: "text-blue-700",
            bar: "bg-blue-500",
            glow: "shadow-blue-100",
        };
    }

    if (
        normalized === "torque_spike" ||
        normalized === "torque increase"
    ) {
        return {
            icon: Zap,
            label: "Torque Spike",
            accent: "orange",
            bg: "bg-orange-50",
            border: "border-orange-200",
            text: "text-orange-700",
            bar: "bg-orange-500",
            glow: "shadow-orange-100",
        };
    }

    if (
        normalized === "drag" ||
        normalized === "drag_increase"
    ) {
        return {
            icon: TrendingUp,
            label: "Drag Increase",
            accent: "rose",
            bg: "bg-rose-50",
            border: "border-rose-200",
            text: "text-rose-700",
            bar: "bg-rose-500",
            glow: "shadow-rose-100",
        };
    }

    if (normalized === "wiper_trip") {
        return {
            icon: Gauge,
            label: "Wiper Trip",
            accent: "violet",
            bg: "bg-violet-50",
            border: "border-violet-200",
            text: "text-violet-700",
            bar: "bg-violet-500",
            glow: "shadow-violet-100",
        };
    }

    return {
        icon: CircleAlert,
        label: formatEventName(event),
        accent: "indigo",
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        text: "text-indigo-700",
        bar: "bg-indigo-500",
        glow: "shadow-indigo-100",
    };
}

function getRiskLevel(event, probability) {
    const normalized = event?.toLowerCase();

    if (normalized === "normal") {
        return {
            label: "Normal",
            text: "text-emerald-600",
            bg: "bg-emerald-50",
        };
    }

    if (probability >= 0.7) {
        return {
            label: "High",
            text: "text-red-600",
            bg: "bg-red-50",
        };
    }

    if (probability >= 0.4) {
        return {
            label: "Moderate",
            text: "text-amber-600",
            bg: "bg-amber-50",
        };
    }

    return {
        label: "Low",
        text: "text-slate-500",
        bg: "bg-slate-100",
    };
}

function PredictionCard({ event, probability }) {
    const probabilityValue =
        typeof probability === "number"
            ? probability
            : Number(probability) || 0;

    const percentage = Math.min(
        100,
        Math.max(0, probabilityValue * 100)
    );

    const config = getEventConfig(
        event,
        probabilityValue
    );

    const risk = getRiskLevel(
        event,
        probabilityValue
    );

    const Icon = config.icon;

    return (
        <div
            className={`
                group relative overflow-hidden
                rounded-3xl
                border
                ${config.border}
                bg-white
                p-5
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-xl
                ${config.glow}
            `}
        >
            {/* Decorative glow */}
            <div
                className={`
                    pointer-events-none
                    absolute
                    -right-10
                    -top-10
                    h-28
                    w-28
                    rounded-full
                    ${config.bg}
                    opacity-70
                    blur-2xl
                `}
            />

            {/* Header */}
            <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-2xl
                            ${config.bg}
                            ${config.text}
                        `}
                    >
                        <Icon className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Event Type
                        </p>

                        <h3 className="mt-1 text-sm font-extrabold text-slate-900">
                            {config.label}
                        </h3>
                    </div>
                </div>

                {/* Risk badge */}
                <span
                    className={`
                        rounded-full
                        px-3
                        py-1.5
                        text-[10px]
                        font-black
                        uppercase
                        tracking-wider
                        ${risk.bg}
                        ${risk.text}
                    `}
                >
                    {risk.label}
                </span>
            </div>

            {/* Probability */}
            <div className="relative mt-6 flex items-end justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                        Probability
                    </p>

                    <div className="mt-1 flex items-baseline gap-1">
                        <span
                            className={`
                                text-3xl
                                font-black
                                tracking-tight
                                ${config.text}
                            `}
                        >
                            {percentage.toFixed(0)}
                        </span>

                        <span className="text-lg font-bold text-slate-400">
                            %
                        </span>
                    </div>
                </div>

                {/* Mini percentage circle */}
                <div className="relative flex h-14 w-14 items-center justify-center">
                    <svg
                        className="h-14 w-14 -rotate-90"
                        viewBox="0 0 36 36"
                    >
                        <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-slate-100"
                        />

                        <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${percentage * 0.942} 100`}
                            className={config.text}
                        />
                    </svg>

                    <span className="absolute text-[9px] font-black text-slate-500">
                        AI
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative mt-5">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400">
                        Confidence level
                    </span>

                    <span
                        className={`text-[10px] font-black ${config.text}`}
                    >
                        {percentage.toFixed(1)}%
                    </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`
                            h-full
                            rounded-full
                            ${config.bar}
                            transition-all
                            duration-700
                            ease-out
                        `}
                        style={{
                            width: `${percentage}%`,
                        }}
                    />
                </div>
            </div>

            {/* Bottom indicator */}
            <div className="relative mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                <div
                    className={`
                        h-2
                        w-2
                        rounded-full
                        ${config.bar}
                        shadow-sm
                    `}
                />

                <span className="text-[10px] font-semibold text-slate-400">
                    Model prediction
                </span>

                <span className="ml-auto text-[10px] font-bold text-slate-500">
                    {probabilityValue >= 0.7
                        ? "Strong signal"
                        : probabilityValue >= 0.4
                        ? "Possible signal"
                        : "Weak signal"}
                </span>
            </div>
        </div>
    );
}

export default PredictionCard;