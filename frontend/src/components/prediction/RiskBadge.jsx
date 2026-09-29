import {
    RiAlertLine as AlertTriangle,
    RiCheckboxCircleLine as CheckCircle2,
    RiInformationLine as Info,
} from "@remixicon/react";


// ============================================================
// NORMALIZE PROBABILITY
//
// Supports both:
//
// 0.81  -> 81%
// 81    -> 81%
//
// ============================================================

function normalizeProbability(probability) {
    const numericValue = Number(probability);

    if (!Number.isFinite(numericValue)) {
        return 0;
    }

    if (numericValue > 1) {
        return Math.min(
            100,
            Math.max(0, numericValue)
        );
    }

    return Math.min(
        100,
        Math.max(0, numericValue * 100)
    );
}


// ============================================================
// NORMALIZE EVENT
// ============================================================

function normalizeEvent(event) {
    return String(event || "")
        .trim()
        .toLowerCase()
        .replaceAll(" ", "_");
}


// ============================================================
// RISK / MODEL OUTPUT BADGE
// ============================================================

function RiskBadge({
    probability = 0,
    event = "",
}) {
    const percentage =
        normalizeProbability(probability);

    const normalizedEvent =
        normalizeEvent(event);

    const isNormal =
        normalizedEvent === "normal";

    const status =
        getStatus(
            percentage,
            isNormal
        );

    const Icon =
        status.icon;

    return (
        <span
            className={`
                inline-flex
                items-center
                gap-1.5
                rounded-full
                px-2.5
                py-1.5
                text-[10px]
                font-extrabold
                uppercase
                tracking-wide
                ${status.className}
            `}
            title="Prototype model output"
        >

            <Icon className="h-3.5 w-3.5" />

            {status.label}

        </span>
    );
}


// ============================================================
// STATUS LOGIC
//
// These categories describe the model output only.
// They are NOT validated field-risk classifications.
// ============================================================

function getStatus(
    percentage,
    isNormal
) {
    if (isNormal) {
        return {
            label: "Normal Output",
            icon: CheckCircle2,
            className:
                "bg-emerald-50 text-emerald-600",
        };
    }


    if (percentage >= 70) {
        return {
            label: "High Model Output",
            icon: AlertTriangle,
            className:
                "bg-red-50 text-red-600",
        };
    }


    if (percentage >= 40) {
        return {
            label: "Moderate Model Output",
            icon: AlertTriangle,
            className:
                "bg-amber-50 text-amber-700",
        };
    }


    return {
        label: "Low Model Output",
        icon: Info,
        className:
            "bg-slate-100 text-slate-500",
    };
}


export default RiskBadge;