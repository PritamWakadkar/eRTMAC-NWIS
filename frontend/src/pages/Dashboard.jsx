import { useEffect, useMemo, useRef, useState } from "react";

import {
    RiPulseLine as Activity,
    RiArrowRightLine as ArrowRight,
    RiBrainLine as BrainCircuit,
    RiCheckboxCircleLine as CheckCircle2,
    RiDatabase2Line as Database,
    RiFileTextLine as FileText,
    RiLoader4Line as Loader2,
    RiMapPinLine as MapPin,
    RiRefreshLine as RefreshCw,
    RiSearchLine as Search,
    RiSparklingLine as Sparkles,
    RiUpload2Line as Upload,
    RiCloseCircleLine as XCircle,
} from "@remixicon/react";

import { Link, useNavigate } from "react-router-dom";

import {
    analyzeWell,
    getDocuments,
    processDocument,
    uploadDocument,
} from "../services/api";
import TechText from "../components/common/TechText";


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {
    const navigate = useNavigate();

    const fileInputRef = useRef(null);

    // ========================================================
    // STATE
    // ========================================================

    const [documents, setDocuments] = useState([]);

    const [loadingDocuments, setLoadingDocuments] =
        useState(true);

    const [uploading, setUploading] =
        useState(false);

    const [processingId, setProcessingId] =
        useState(null);

    const [analyzingId, setAnalyzingId] =
        useState(null);

    const [selectedDocument, setSelectedDocument] =
        useState(null);

    const [selectedAnalysis, setSelectedAnalysis] =
        useState(null);

    const [error, setError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    // ========================================================
    // SYSTEM CAPABILITIES
    // ========================================================

    const systemStats = [
        {
            label: "AI Analysis",
            value: "NLP + RAG",
            description:
                "Natural-language well intelligence",
            icon: BrainCircuit,
        },

        {
            label: "Well Intelligence",
            value: "Nearby Wells",
            description:
                "Spatial offset-well analysis",
            icon: MapPin,
        },

        {
            label: "Prediction",
            value: "ML Model",
            description:
                "Drilling event prediction",
            icon: Activity,
        },

        {
            label: "Knowledge Base",
            value: "RAG",
            description:
                "Historical drilling reports",
            icon: Database,
        },
    ];

    // ========================================================
    // LOAD DOCUMENTS
    // ========================================================

    const loadDocuments = async () => {
        try {
            setLoadingDocuments(true);
            setError("");

            const response = await getDocuments();

            if (!response?.success) {
                throw new Error(
                    response?.error ||
                    response?.message ||
                    "Unable to load documents."
                );
            }

            setDocuments(
                Array.isArray(response.documents)
                    ? response.documents
                    : []
            );
        } catch (err) {
            console.error(
                "Dashboard document loading error:",
                err
            );

            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                err?.message ||
                "Unable to load well reports.";

            setError(message);
        } finally {
            setLoadingDocuments(false);
        }
    };

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        loadDocuments();
    }, []);

    // ========================================================
    // UPLOAD WELL REPORT
    // ========================================================

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");
        setSuccessMessage("");

        // ----------------------------------------------------
        // Validate PDF
        // ----------------------------------------------------

        if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            setError(
                "Only PDF well reports are supported."
            );

            event.target.value = "";
            return;
        }

        try {
            setUploading(true);

            const response =
                await uploadDocument(file);

            if (!response?.success) {
                throw new Error(
                    response?.error ||
                    response?.message ||
                    "Document upload failed."
                );
            }

            const uploadedDocument =
                response.document;

            setSuccessMessage(
                `${uploadedDocument?.file_name || file.name} uploaded successfully.`
            );

            // ------------------------------------------------
            // Refresh document list
            // ------------------------------------------------

            await loadDocuments();

            // ------------------------------------------------
            // Automatically process the uploaded report
            // ------------------------------------------------

            if (
                uploadedDocument?.document_id
            ) {
                await handleProcessDocument(
                    uploadedDocument.document_id
                );
            }
        } catch (err) {
            console.error(
                "Well report upload error:",
                err
            );

            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                err?.message ||
                "Failed to upload the well report.";

            setError(message);
        } finally {
            setUploading(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // ========================================================
    // PROCESS DOCUMENT
    // ========================================================

    const handleProcessDocument = async (
        documentId
    ) => {
        if (!documentId) {
            return;
        }

        try {
            setProcessingId(documentId);

            setError("");
            setSuccessMessage("");

            const response =
                await processDocument(
                    documentId
                );

            if (!response?.success) {
                throw new Error(
                    response?.error ||
                    response?.message ||
                    "Document processing failed."
                );
            }

            const processedDocument =
                response.document;

            // ------------------------------------------------
            // Refresh documents
            // ------------------------------------------------

            await loadDocuments();

            setSelectedDocument(
                processedDocument || null
            );

            setSuccessMessage(
                processedDocument?.file_name
                    ? `${processedDocument.file_name} processed successfully.`
                    : "Well report processed successfully."
            );

            // ------------------------------------------------
            // Automatically generate AI well information
            // ------------------------------------------------

            const wellId =
                processedDocument?.well_id ||
                extractWellIdFromDocument(
                    processedDocument
                );

            if (wellId) {
                await generateWellAnalysis(
                    wellId,
                    processedDocument
                );
            }
        } catch (err) {
            console.error(
                "Document processing error:",
                err
            );

            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                err?.message ||
                "Failed to process the well report.";

            setError(message);
        } finally {
            setProcessingId(null);
        }
    };

    // ========================================================
    // EXTRACT WELL ID
    // ========================================================

    const extractWellIdFromDocument = (
        document
    ) => {
        if (!document) {
            return null;
        }

        if (document.well_id) {
            return String(
                document.well_id
            ).toUpperCase();
        }

        const source =
            document.file_name ||
            document.document_id ||
            "";

        const match =
            String(source).match(
                /\bW\d+\b/i
            );

        return match
            ? match[0].toUpperCase()
            : null;
    };

    // ========================================================
    // GENERATE AI WELL ANALYSIS
    // ========================================================

    const generateWellAnalysis = async (
        wellId,
        document = null
    ) => {
        if (!wellId) {
            setError(
                "Well ID could not be detected from the processed document."
            );

            return;
        }

        try {
            setAnalyzingId(
                document?.document_id ||
                wellId
            );

            setError("");

            // ------------------------------------------------
            // IMPORTANT
            // Use the same analysis endpoint already used
            // by the Well Analysis page.
            // ------------------------------------------------

            const response =
                await analyzeWell(
                    `Tell me about ${wellId}`,
                    10,
                    200
                );

            if (!response?.success) {
                throw new Error(
                    response?.error ||
                    response?.message ||
                    `AI analysis failed for ${wellId}.`
                );
            }

            // ------------------------------------------------
            // Store COMPLETE backend response.
            // ------------------------------------------------

            setSelectedAnalysis(response);

            setSelectedDocument(
                document || null
            );

        } catch (err) {
            console.error(
                "AI well analysis error:",
                err
            );

            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                err?.message ||
                `Unable to generate AI information for ${wellId}.`;

            setError(message);
        } finally {
            setAnalyzingId(null);
        }
    };

    // ========================================================
    // SELECT EXISTING DOCUMENT
    // ========================================================

    const handleSelectDocument = async (
        document
    ) => {
        if (!document) {
            return;
        }

        setSelectedDocument(document);
        setSelectedAnalysis(null);
        setError("");
        setSuccessMessage("");

        const wellId =
            extractWellIdFromDocument(
                document
            );

        if (!wellId) {
            setError(
                "Well ID could not be detected from this document."
            );

            return;
        }

        // ----------------------------------------------------
        // Only analyze processed documents.
        // ----------------------------------------------------

        if (
            document.status !== "processed"
        ) {
            setError(
                `This document is currently "${document.status}". Process it before requesting AI analysis.`
            );

            return;
        }

        await generateWellAnalysis(
            wellId,
            document
        );
    };

    // ========================================================
    // NAVIGATE TO WELL ANALYSIS
    // ========================================================

    const handleOpenAnalysis = () => {
        const wellId =
            selectedAnalysis?.result?.well_id ||
            selectedDocument?.well_id ||
            extractWellIdFromDocument(
                selectedDocument
            );

        if (!wellId) {
            navigate("/analysis");
            return;
        }

        navigate(
            `/analysis?well=${encodeURIComponent(
                wellId
            )}`
        );
    };

    // ========================================================
    // PROCESSED DOCUMENTS
    // ========================================================

    const processedDocuments = useMemo(
        () =>
            documents.filter(
                (document) =>
                    document.status ===
                    "processed"
            ),
        [documents]
    );

    // ========================================================
    // RECENT DOCUMENTS
    // ========================================================

    const recentDocuments = useMemo(() => {
        return [...documents].sort(
            (a, b) => {
                const dateA =
                    new Date(
                        a.created_at || 0
                    ).getTime();

                const dateB =
                    new Date(
                        b.created_at || 0
                    ).getTime();

                return dateB - dateA;
            }
        );
    }, [documents]);

    // ========================================================
    // AI RESULT
    // ========================================================

    const aiResult =
        selectedAnalysis?.result || null;

    const wellEvents =
        Array.isArray(aiResult?.events)
            ? aiResult.events
            : [];

    const aiSummary =
        aiResult?.ai_summary ||
        aiResult?.structured_summary ||
        "";

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">

            <main>

                <div className="mx-auto max-w-[1400px] px-6 py-8 max-sm:px-4">

                    {/* ==================================================
                        DASHBOARD NAVBAR
                    ================================================== */}

                    <nav className="mb-8 rounded-2xl border border-slate-800/80 bg-[#000] px-6 py-5 shadow-lg sm:rounded-3xl sm:px-8">

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            {/* Brand & Subtitle */}
                            <div className="max-w-3xl">

                                <h1 className="sr-only">eRTMAC-NWIS</h1>

                                <div className="h-10 w-56 sm:h-12 sm:w-72">
                                    <TechText
                                        text="eRTMAC-NWIS"
                                        fontWeight={900}
                                        fontSize={60}
                                        color="#ffffff"
                                        accentColor="#38bdf8"
                                        reveal="letter"
                                        dashLength={4}
                                        dashGap={2}
                                        specks={15}
                                    />
                                </div>

                            </div>

                            {/* Nav Buttons */}
                            <div className="flex flex-wrap items-center gap-3 shrink-0">

                                <Link
                                    to="/analysis"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-[#172033] shadow-sm transition hover:bg-slate-100"
                                >
                                    <Search className="h-4 w-4" />

                                    <span>Start Well Analysis</span>

                                    <ArrowRight className="h-4 w-4" />
                                </Link>

                                <Link
                                    to="/prediction"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white/5 px-5 py-2.5 text-xs font-extrabold text-white backdrop-blur transition hover:border-slate-500 hover:bg-white/10"
                                >
                                    <BrainCircuit className="h-4 w-4" />

                                    <span>Open Prediction</span>
                                </Link>

                            </div>

                        </div>

                    </nav>


                    {/* ==================================================
                        SYSTEM CAPABILITIES
                    ================================================== */}

                    <section className="mt-8">

                        <div className="mb-4">

                            <h2 className="text-lg font-extrabold text-[#172033]">
                                System Capabilities
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Core intelligence modules
                                available in the system.
                            </p>

                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                            {systemStats.map(
                                (stat) => {

                                    const Icon =
                                        stat.icon;

                                    return (
                                        <div
                                            key={stat.label}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                        >

                                            <div className="flex items-start justify-between">

                                                <div>

                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        {stat.label}
                                                    </p>

                                                    <p className="mt-2 text-base font-extrabold text-[#172033]">
                                                        {stat.value}
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                                        {stat.description}
                                                    </p>

                                                </div>

                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">

                                                    <Icon className="h-5 w-5 text-blue-600" />

                                                </div>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </section>


                    {/* ==================================================
                        UPLOAD WELL REPORT
                    ================================================== */}

                    <section className="mt-8">

                        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

                            <div className="border-b border-slate-100 p-6">

                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                                    <div className="flex items-start gap-3">

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">

                                            <Upload className="h-5 w-5 text-blue-600" />

                                        </div>

                                        <div>

                                            <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-blue-600">
                                                WELL REPORT INGESTION
                                            </p>

                                            <h2 className="mt-1 text-xl font-extrabold text-[#172033]">
                                                Add New Well Report
                                            </h2>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Upload a PDF report. The system
                                                extracts the well information,
                                                processes it through RAG and
                                                generates AI-powered well
                                                intelligence.
                                            </p>

                                        </div>

                                    </div>

                                    <Link
                                        to="/documents"
                                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Manage Documents

                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>

                                </div>

                            </div>

                            <div className="p-6">

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={
                                        handleFileSelect
                                    }
                                    className="hidden"
                                />

                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-9 w-9 animate-spin text-blue-600" />

                                            <p className="mt-3 text-sm font-extrabold text-slate-800">
                                                Uploading and processing...
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Please wait while the
                                                document intelligence
                                                pipeline runs.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">

                                                <Upload className="h-6 w-6 text-blue-600" />

                                            </div>

                                            <p className="mt-4 text-sm font-extrabold text-slate-800">
                                                Upload Well Report PDF
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Click here to select a
                                                drilling report.
                                            </p>

                                            <span className="mt-4 rounded-lg bg-white px-4 py-2 text-[11px] font-bold text-blue-600 shadow-sm">
                                                Select PDF
                                            </span>
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </section>


                    {/* ==================================================
                        STATUS MESSAGES
                    ================================================== */}

                    {successMessage && (
                        <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                            <div>

                                <p className="text-sm font-extrabold text-emerald-800">
                                    Success
                                </p>

                                <p className="mt-1 text-xs text-emerald-700">
                                    {successMessage}
                                </p>

                            </div>

                        </div>
                    )}


                    {error && (
                        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                            <div className="flex-1">

                                <p className="text-sm font-extrabold text-red-800">
                                    Dashboard Error
                                </p>

                                <p className="mt-1 text-xs text-red-700">
                                    {error}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setError("")
                                }
                                className="rounded-lg p-1 text-red-500 hover:bg-red-100"
                            >
                                <XCircle className="h-4 w-4" />
                            </button>

                        </div>
                    )}


                    {/* ==================================================
                        AI WELL INTELLIGENCE
                    ================================================== */}

                    {selectedAnalysis && aiResult && (

                        <section className="mt-8">

                            <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                                {/* HEADER */}

                                <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-6">

                                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                                        <div className="flex items-start gap-3">

                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600">

                                                <Sparkles className="h-5 w-5 text-white" />

                                            </div>

                                            <div>

                                                <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-indigo-600">
                                                    AI WELL INTELLIGENCE
                                                </p>

                                                <h2 className="mt-1 text-xl font-extrabold text-[#172033]">
                                                    {aiResult.well_id ||
                                                        selectedDocument?.well_id ||
                                                        "Well Information"}
                                                </h2>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    AI-generated analysis
                                                    grounded in processed
                                                    well evidence.
                                                </p>

                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            onClick={
                                                handleOpenAnalysis
                                            }
                                            className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#172033] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800"
                                        >
                                            Open Full Analysis

                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </button>

                                    </div>

                                </div>


                                {/* WELL INFORMATION */}

                                <div className="p-6">

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                        <WellInformationCard
                                            label="Well ID"
                                            value={
                                                aiResult.well_id ||
                                                selectedDocument?.well_id ||
                                                "N/A"
                                            }
                                        />

                                        <WellInformationCard
                                            label="Formation"
                                            value={
                                                aiResult.formation ||
                                                "N/A"
                                            }
                                        />

                                        <WellInformationCard
                                            label="Total Depth"
                                            value={
                                                aiResult.total_depth_m !=
                                                null
                                                    ? `${aiResult.total_depth_m} m`
                                                    : "N/A"
                                            }
                                        />

                                        <WellInformationCard
                                            label="Location"
                                            value={
                                                formatCoordinates(
                                                    aiResult.latitude,
                                                    aiResult.longitude
                                                )
                                            }
                                        />

                                    </div>


                                    {/* ==================================================
                                        EVENT SUMMARY
                                    ================================================== */}

                                    <div className="mt-5 grid gap-4 sm:grid-cols-2">

                                        <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5">

                                            <div className="flex items-center gap-2">

                                                <Activity className="h-5 w-5 text-orange-600" />

                                                <p className="text-xs font-extrabold uppercase tracking-wide text-orange-700">
                                                    Drilling Events
                                                </p>

                                            </div>

                                            <p className="mt-2 text-2xl font-extrabold text-slate-900">
                                                {aiResult.event_count ??
                                                    wellEvents.length}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Recorded operational events
                                            </p>

                                        </div>


                                        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">

                                            <div className="flex items-center gap-2">

                                                <Database className="h-5 w-5 text-blue-600" />

                                                <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">
                                                    Evidence Source
                                                </p>

                                            </div>

                                            <p className="mt-2 text-sm font-extrabold text-slate-900">
                                                {selectedDocument?.file_name ||
                                                    "Processed well report"}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                RAG knowledge base
                                            </p>

                                        </div>

                                    </div>


                                    {/* ==================================================
                                        AI GENERATED RESPONSE
                                    ================================================== */}

                                    {aiSummary && (

                                        <div className="mt-5 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-blue-50/60 p-5">

                                            <div className="flex items-center gap-2">

                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">

                                                    <Sparkles className="h-4 w-4 text-white" />

                                                </div>

                                                <div>

                                                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-violet-600">
                                                        AI GENERATED RESPONSE
                                                    </p>

                                                    <h3 className="text-base font-extrabold text-slate-900">
                                                        Well Intelligence Summary
                                                    </h3>

                                                </div>

                                            </div>

                                            <div className="mt-4 whitespace-pre-line rounded-xl border border-white/80 bg-white p-5 text-sm leading-7 text-slate-700 shadow-sm">
                                                {aiSummary}
                                            </div>

                                        </div>

                                    )}


                                    {/* ==================================================
                                        EVENT DETAILS
                                    ================================================== */}

                                    {wellEvents.length > 0 && (

                                        <div className="mt-5">

                                            <div className="mb-3 flex items-center justify-between">

                                                <div>

                                                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                                        DRILLING EVIDENCE
                                                    </p>

                                                    <h3 className="mt-1 text-base font-extrabold text-slate-900">
                                                        Recorded Events
                                                    </h3>

                                                </div>

                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                                                    {wellEvents.length} events
                                                </span>

                                            </div>


                                            <div className="space-y-3">

                                                {wellEvents.map(
                                                    (
                                                        event,
                                                        index
                                                    ) => (

                                                        <div
                                                            key={`${event.event}-${event.depth}-${index}`}
                                                            className="rounded-xl border border-slate-200 bg-white p-4"
                                                        >

                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                                                <div>

                                                                    <p className="text-sm font-extrabold capitalize text-slate-900">
                                                                        {formatEventName(
                                                                            event.event
                                                                        )}
                                                                    </p>

                                                                    <p className="mt-1 text-xs font-bold text-blue-600">
                                                                        {event.depth ||
                                                                            "Depth not specified"}
                                                                    </p>

                                                                </div>

                                                                {event.measurement && (
                                                                    <span className="w-fit rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700">
                                                                        {
                                                                            event.measurement
                                                                        }
                                                                    </span>
                                                                )}

                                                            </div>

                                                            {event.evidence && (
                                                                <p className="mt-3 text-xs leading-5 text-slate-600">
                                                                    {
                                                                        event.evidence
                                                                    }
                                                                </p>
                                                            )}

                                                            {event.document && (
                                                                <p className="mt-2 text-[10px] font-medium text-slate-400">
                                                                    Source:{" "}
                                                                    {
                                                                        event.document
                                                                    }

                                                                    {event.page
                                                                        ? ` • Page ${event.page}`
                                                                        : ""}
                                                                </p>
                                                            )}

                                                        </div>

                                                    )
                                                )}

                                            </div>

                                        </div>

                                    )}

                                </div>

                            </div>

                        </section>
                    )}


                    {/* ==================================================
                        PROCESSED WELL REPORTS
                    ================================================== */}

                    <section className="mt-8">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                            <div>

                                <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-blue-600">
                                    KNOWLEDGE BASE
                                </p>

                                <h2 className="mt-1 text-lg font-extrabold text-[#172033]">
                                    Processed Well Reports
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Reports currently available
                                    for AI analysis.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    loadDocuments
                                }
                                disabled={
                                    loadingDocuments
                                }
                                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 ${
                                        loadingDocuments
                                            ? "animate-spin"
                                            : ""
                                    }`}
                                />

                                Refresh
                            </button>

                        </div>


                        {loadingDocuments ? (

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-10 text-center">

                                <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

                                <p className="mt-3 text-sm font-bold text-slate-700">
                                    Loading well reports...
                                </p>

                            </div>

                        ) : recentDocuments.length === 0 ? (

                            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

                                <FileText className="mx-auto h-8 w-8 text-slate-300" />

                                <p className="mt-3 text-sm font-extrabold text-slate-700">
                                    No well reports found
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Upload a PDF above to add
                                    a well to the intelligence
                                    system.
                                </p>

                            </div>

                        ) : (

                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                                {recentDocuments.map(
                                    (document) => {

                                        const wellId =
                                            extractWellIdFromDocument(
                                                document
                                            );

                                        const isProcessing =
                                            processingId ===
                                            document.document_id;

                                        const isAnalyzing =
                                            analyzingId ===
                                            document.document_id;

                                        return (

                                            <div
                                                key={
                                                    document.document_id
                                                }
                                                className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                                                    selectedDocument?.document_id ===
                                                    document.document_id
                                                        ? "border-blue-400 ring-2 ring-blue-100"
                                                        : "border-slate-200"
                                                }`}
                                            >

                                                <div className="flex items-start justify-between gap-3">

                                                    <div className="flex items-start gap-3">

                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">

                                                            <FileText className="h-5 w-5 text-blue-600" />

                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="text-sm font-extrabold text-slate-900">
                                                                {wellId ||
                                                                    "Unknown Well"}
                                                            </p>

                                                            <p className="mt-1 truncate text-[11px] text-slate-500">
                                                                {
                                                                    document.file_name
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>


                                                    <StatusBadge
                                                        status={
                                                            document.status
                                                        }
                                                    />

                                                </div>


                                                <div className="mt-4 grid grid-cols-3 gap-2">

                                                    <MiniStat
                                                        label="Pages"
                                                        value={
                                                            document.page_count ??
                                                            0
                                                        }
                                                    />

                                                    <MiniStat
                                                        label="Chunks"
                                                        value={
                                                            document.chunk_count ??
                                                            0
                                                        }
                                                    />

                                                    <MiniStat
                                                        label="Embeddings"
                                                        value={
                                                            document.embedding_count ??
                                                            0
                                                        }
                                                    />

                                                </div>


                                                <div className="mt-4 flex flex-wrap gap-2">

                                                    {document.status ===
                                                        "processed" ? (

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isAnalyzing
                                                            }
                                                            onClick={() =>
                                                                handleSelectDocument(
                                                                    document
                                                                )
                                                            }
                                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#172033] px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                                        >

                                                            {isAnalyzing ? (
                                                                <>
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />

                                                                    Analyzing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles className="h-3.5 w-3.5" />

                                                                    AI Analyze
                                                                </>
                                                            )}

                                                        </button>

                                                    ) : (

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            onClick={() =>
                                                                handleProcessDocument(
                                                                    document.document_id
                                                                )
                                                            }
                                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                                        >

                                                            {isProcessing ? (
                                                                <>
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />

                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <RefreshCw className="h-3.5 w-3.5" />

                                                                    Process
                                                                </>
                                                            )}

                                                        </button>
                                                    )}

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </section>


                    {/* ==================================================
                        INTELLIGENCE PIPELINE
                    ================================================== */}

                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-start gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033]">

                                <Database className="h-5 w-5 text-white" />

                            </div>

                            <div>

                                <h2 className="text-lg font-extrabold text-[#172033]">
                                    Intelligence Pipeline
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    From uploaded drilling report
                                    to AI-powered well intelligence.
                                </p>

                            </div>

                        </div>


                        <div className="mt-5 grid gap-3 md:grid-cols-5">

                            <PipelineStep
                                number="01"
                                title="Upload"
                                description="Upload drilling report PDF"
                            />

                            <PipelineStep
                                number="02"
                                title="Process"
                                description="Extract and index report evidence"
                            />

                            <PipelineStep
                                number="03"
                                title="RAG"
                                description="Retrieve evidence from the knowledge base"
                            />

                            <PipelineStep
                                number="04"
                                title="AI Analysis"
                                description="Generate well intelligence"
                            />

                            <PipelineStep
                                number="05"
                                title="Decision"
                                description="Use well and offset-well intelligence"
                            />

                        </div>

                    </section>


                    {/* ==================================================
                        PROJECT STATUS
                    ================================================== */}

                   

                </div>

            </main>

        </div>
    );
}


// ============================================================
// WELL INFORMATION CARD
// ============================================================

function WellInformationCard({
    label,
    value,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-slate-400">
                {label}
            </p>

            <p className="mt-2 break-words text-base font-extrabold text-slate-900">
                {value}
            </p>

        </div>
    );
}


// ============================================================
// MINI STAT
// ============================================================

function MiniStat({
    label,
    value,
}) {
    return (
        <div className="rounded-lg bg-slate-50 p-2.5 text-center">

            <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-extrabold text-slate-800">
                {value}
            </p>

        </div>
    );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
    status,
}) {
    const normalized =
        String(status || "")
            .toLowerCase();

    if (
        normalized ===
        "processed"
    ) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-700">

                <CheckCircle2 className="h-3 w-3" />

                Processed

            </span>
        );
    }

    if (
        normalized ===
        "failed"
    ) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-red-700">

                <XCircle className="h-3 w-3" />

                Failed

            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-amber-700">

            <Loader2 className="h-3 w-3" />

            {status || "Pending"}

        </span>
    );
}


// ============================================================
// PIPELINE STEP
// ============================================================

function PipelineStep({
    number,
    title,
    description,
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 transition hover:bg-blue-50">

            <span className="text-[10px] font-extrabold tracking-wider text-blue-600">
                {number}
            </span>

            <h3 className="mt-2 text-sm font-extrabold text-slate-800">
                {title}
            </h3>

            <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {description}
            </p>

        </div>
    );
}


// ============================================================
// FORMAT COORDINATES
// ============================================================

function formatCoordinates(
    latitude,
    longitude
) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {
        return "Not available";
    }

    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}


// ============================================================
// FORMAT EVENT NAME
// ============================================================

function formatEventName(
    event
) {
    if (!event) {
        return "Unknown Event";
    }

    return String(event)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
}


// ============================================================
// EXPORT
// ============================================================

export default Dashboard;