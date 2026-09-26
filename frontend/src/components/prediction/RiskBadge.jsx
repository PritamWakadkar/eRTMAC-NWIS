import {
    AlertTriangle,
    CheckCircle2,
    Info,
} from "lucide-react";

function RiskBadge({
    probability = 0,
    event = "",
}) {
    const percentage = Math.max(
        0,
        Math.min(100, Number(probability) * 100)
    );

    const isNormal =
        String(event).toLowerCase() === "normal";

    const status = getStatus(
        percentage,
        isNormal
    );

    const Icon = status.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide ${status.className}`}
        >
            <Icon className="h-3.5 w-3.5" />

            {status.label}
        </span>
    );
}


/* =========================================================
   STATUS LOGIC
========================================================= */

function getStatus(percentage, isNormal) {

    if (isNormal) {
        return {
            label: "Normal",
            icon: CheckCircle2,
            className:
                "bg-emerald-50 text-emerald-600",
        };
    }

    if (percentage >= 70) {
        return {
            label: "High",
            icon: AlertTriangle,
            className:
                "bg-red-50 text-red-600",
        };
    }

    if (percentage >= 40) {
        return {
            label: "Moderate",
            icon: AlertTriangle,
            className:
                "bg-amber-50 text-amber-700",
        };
    }

    return {
        label: "Low",
        icon: Info,
        className:
            "bg-slate-100 text-slate-500",
    };
}

export default RiskBadge;