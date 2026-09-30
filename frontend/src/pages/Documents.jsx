import { useEffect, useRef, useState } from "react";

import {
    RiFileTextLine as FileText,
    RiUpload2Line as Upload,
    RiRefreshLine as RefreshCw,
    RiPlayFill as Play,
    RiCheckboxCircleLine as CheckCircle2,
    RiTimeLine as Clock3,
    RiErrorWarningLine as AlertCircle,
    RiLoader4Line as Loader2,
    RiDatabase2Line as Database,
    RiStackLine as Layers3,
    RiBrainLine as BrainCircuit,
    RiStackLine as FileStack,
    RiDeleteBinLine as Trash2,
    RiCloseLine as X,
} from "@remixicon/react";

import {
    getDocuments,
    uploadDocument,
    processDocument,
    deleteDocument,
} from "../services/api";


// ============================================================
// STATUS CONFIG
// ============================================================

const STATUS_CONFIG = {
    uploaded: {
        label: "Uploaded",
        icon: Clock3,
    },

    extracting: {
        label: "Extracting",
        icon: Loader2,
    },

    cleaning: {
        label: "Cleaning",
        icon: Loader2,
    },

    metadata_extraction: {
        label: "Metadata Extraction",
        icon: Loader2,
    },

    chunking: {
        label: "Chunking",
        icon: Loader2,
    },

    embedding: {
        label: "Embedding",
        icon: Loader2,
    },

    indexing: {
        label: "Indexing",
        icon: Loader2,
    },

    processed: {
        label: "Processed",
        icon: CheckCircle2,
    },

    failed: {
        label: "Failed",
        icon: AlertCircle,
    },
};


// ============================================================
// FALLBACK PROGRESS
// ============================================================

const PROGRESS_MAP = {
    uploaded: 0,
    extracting: 15,
    cleaning: 30,
    metadata_extraction: 45,
    chunking: 60,
    embedding: 75,
    indexing: 90,
    processed: 100,
    failed: 0,
};


// ============================================================
// FORMAT STATUS
// ============================================================

const formatStatus = (status) => {
    return STATUS_CONFIG[status]?.label || "Unknown";
};


// ============================================================
// GET PROGRESS
// ============================================================

const getProgress = (document) => {
    if (
        typeof document?.progress_percent === "number"
    ) {
        return Math.max(
            0,
            Math.min(
                100,
                document.progress_percent
            )
        );
    }

    return PROGRESS_MAP[
        document?.status
    ] ?? 0;
};


// ============================================================
// EXTRACT API ERROR
// ============================================================

const getApiError = (
    error,
    fallbackMessage
) => {
    return (
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        fallbackMessage
    );
};


// ============================================================
// DOCUMENTS PAGE
// ============================================================

const Documents = () => {

    const [documents, setDocuments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [uploading, setUploading] = useState(false);

    const [processingId, setProcessingId] =
        useState(null);

    const [deletingId, setDeletingId] =
        useState(null);

    const [error, setError] = useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const fileInputRef = useRef(null);


    // ========================================================
    // LOAD DOCUMENTS
    // ========================================================

    const loadDocuments = async (
        showLoader = true
    ) => {

        try {

            if (showLoader) {
                setLoading(true);
            }

            setError("");

            const response =
                await getDocuments();

            setDocuments(
                Array.isArray(
                    response?.documents
                )
                    ? response.documents
                    : []
            );

        } catch (err) {

            console.error(
                "Load documents error:",
                err
            );

            setError(
                getApiError(
                    err,
                    "Failed to load documents."
                )
            );

        } finally {

            if (showLoader) {
                setLoading(false);
            }
        }
    };


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        loadDocuments();

    }, []);


    // ========================================================
    // UPLOAD DOCUMENT
    // ========================================================

    const handleFileUpload = async (
        event
    ) => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }


        // ----------------------------------------------------
        // PDF VALIDATION
        // ----------------------------------------------------

        const isPdf =
            file.type === "application/pdf" ||
            file.name
                .toLowerCase()
                .endsWith(".pdf");

        if (!isPdf) {

            setError(
                "Only PDF files are supported."
            );

            event.target.value = "";

            return;
        }


        try {

            setUploading(true);

            setError("");

            setSuccessMessage("");


            const response =
                await uploadDocument(file);


            if (!response?.success) {

                throw new Error(
                    response?.message ||
                    response?.error ||
                    "Failed to upload document."
                );
            }


            setSuccessMessage(
                `"${file.name}" uploaded successfully.`
            );


            await loadDocuments(false);

        } catch (err) {

            console.error(
                "Upload document error:",
                err
            );

            setError(
                getApiError(
                    err,
                    "Failed to upload document."
                )
            );

        } finally {

            setUploading(false);

            event.target.value = "";
        }
    };


    // ========================================================
    // PROCESS DOCUMENT
    // ========================================================

    const handleProcess = async (
        documentId
    ) => {

        if (
            processingId ||
            deletingId
        ) {
            return;
        }


        try {

            setProcessingId(
                documentId
            );

            setError("");

            setSuccessMessage("");


            const response =
                await processDocument(
                    documentId
                );


            if (!response?.success) {

                const message =
                    response?.document
                        ?.error_message ||
                    response?.error_message ||
                    response?.message ||
                    "Document processing failed.";

                throw new Error(message);
            }


            setSuccessMessage(
                "Document processed successfully."
            );


            await loadDocuments(false);

        } catch (err) {

            console.error(
                "Process document error:",
                err
            );

            setError(
                getApiError(
                    err,
                    "Failed to process document."
                )
            );


            await loadDocuments(false);

        } finally {

            setProcessingId(null);
        }
    };


    // ========================================================
    // DELETE DOCUMENT
    // ========================================================

    const handleDelete = async (
        documentId,
        fileName
    ) => {

        if (
            processingId ||
            deletingId
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                "This will permanently remove the PDF and " +
                "update the report database."
            );


        if (!confirmed) {
            return;
        }


        try {

            setDeletingId(
                documentId
            );

            setError("");

            setSuccessMessage("");


            const response =
                await deleteDocument(
                    documentId
                );


            if (!response?.success) {

                throw new Error(
                    response?.message ||
                    response?.error ||
                    "Failed to delete document."
                );
            }


            const remainingCount =
                response?.remaining_pdf_count;


            if (
                response?.rag_index_rebuilt
            ) {

                setSuccessMessage(
                    `"${fileName}" deleted successfully. ` +
                    `Report database updated${
                        typeof remainingCount === "number"
                            ? ` with ${remainingCount} remaining PDF(s).`
                            : "."
                    }`
                );

            } else {

                setSuccessMessage(
                    `"${fileName}" deleted successfully.`
                );
            }


            await loadDocuments(false);

        } catch (err) {

            console.error(
                "Delete document error:",
                err
            );

            setError(
                getApiError(
                    err,
                    "Failed to delete document."
                )
            );


            await loadDocuments(false);

        } finally {

            setDeletingId(null);
        }
    };


    // ========================================================
    // CLEAR MESSAGES
    // ========================================================

    const clearMessages = () => {

        setError("");

        setSuccessMessage("");
    };


    // ========================================================
    // REFRESH
    // ========================================================

    const handleRefresh = async () => {

        setSuccessMessage("");

        await loadDocuments();
    };


    // ========================================================
    // SUMMARY VALUES
    // ========================================================

    const processedCount =
        documents.filter(
            (document) =>
                document.status ===
                "processed"
        ).length;


    const totalChunks =
        documents.reduce(
            (total, document) =>
                total +
                Number(
                    document.chunk_count || 0
                ),
            0
        );


    const totalEmbeddings =
        documents.reduce(
            (total, document) =>
                total +
                Number(
                    document.embedding_count || 0
                ),
            0
        );


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="min-h-screen text-slate-900">

            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xl">

                <div className="mx-auto max-w-7xl px-6 py-8">

                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                        {/* PAGE TITLE */}

                        <div>

                            <div className="mb-3 flex items-center gap-3">

                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 ring-1 ring-cyan-100">

                                    <FileStack
                                        className="h-6 w-6 text-cyan-600"
                                    />

                                </div>

                                <div>

                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                                        NWIS Knowledge Base
                                    </p>

                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                        Documents
                                    </h1>

                                </div>

                            </div>

                            <p className="max-w-2xl text-sm leading-6 text-slate-500">
                                Upload drilling reports and
                                process them to enable
                                instant search and insights.
                            </p>

                        </div>


                        {/* UPLOAD */}

                        <div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={
                                    handleFileUpload
                                }
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                disabled={
                                    uploading ||
                                    processingId !== null ||
                                    deletingId !== null
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {uploading ? (

                                    <Loader2
                                        className="h-5 w-5 animate-spin"
                                    />

                                ) : (

                                    <Upload
                                        className="h-5 w-5"
                                    />

                                )}

                                {uploading
                                    ? "Uploading..."
                                    : "Upload PDF"}

                            </button>

                        </div>

                    </div>

                </div>

            </header>


            {/* ==================================================
                MAIN
            ================================================== */}

            <main className="mx-auto max-w-7xl px-6 py-8">


                {/* ==================================================
                    SUCCESS MESSAGE
                ================================================== */}

                {successMessage && (

                    <MessageBox
                        type="success"
                        message={successMessage}
                        onClose={clearMessages}
                    />

                )}


                {/* ==================================================
                    ERROR MESSAGE
                ================================================== */}

                {error && (

                    <MessageBox
                        type="error"
                        message={error}
                        onClose={clearMessages}
                    />

                )}


                {/* ==================================================
                    SUMMARY
                ================================================== */}

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <SummaryCard
                        title="Documents"
                        value={
                            documents.length
                        }
                        icon={FileText}
                    />

                    <SummaryCard
                        title="Processed"
                        value={
                            processedCount
                        }
                        icon={CheckCircle2}
                    />

                    <SummaryCard
                        title="Total Chunks"
                        value={
                            totalChunks
                        }
                        icon={Layers3}
                    />

                    <SummaryCard
                        title="Embeddings"
                        value={
                            totalEmbeddings
                        }
                        icon={BrainCircuit}
                    />

                </div>


                {/* ==================================================
                    LIBRARY HEADER
                ================================================== */}

                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h2 className="text-xl font-semibold text-slate-900">
                            Document Library
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage uploaded drilling
                            reports and RAG processing.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleRefresh
                        }
                        disabled={
                            loading ||
                            uploading ||
                            processingId !== null ||
                            deletingId !== null
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <RefreshCw
                            className={`h-4 w-4 ${
                                loading
                                    ? "animate-spin"
                                    : ""
                            }`}
                        />

                        Refresh

                    </button>

                </div>


                {/* ==================================================
                    INITIAL LOADING
                ================================================== */}

                {loading ? (

                    <LoadingState />

                ) : documents.length === 0 ? (

                    <EmptyState
                        onUpload={() =>
                            fileInputRef.current?.click()
                        }
                    />

                ) : (

                    <DocumentTable
                        documents={documents}
                        processingId={
                            processingId
                        }
                        deletingId={
                            deletingId
                        }
                        onProcess={
                            handleProcess
                        }
                        onDelete={
                            handleDelete
                        }
                    />

                )}

            </main>

        </div>
    );
};


// ============================================================
// MESSAGE BOX
// ============================================================

const MessageBox = ({
    type,
    message,
    onClose,
}) => {

    const isSuccess =
        type === "success";

    return (

        <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-4 ${
                isSuccess
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
            }`}
        >

            {isSuccess ? (

                <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                />

            ) : (

                <AlertCircle
                    className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                />

            )}


            <div className="flex-1">

                <p
                    className={`font-medium ${
                        isSuccess
                            ? "text-emerald-800"
                            : "text-red-800"
                    }`}
                >
                    {isSuccess
                        ? "Success"
                        : "Error"}
                </p>

                <p
                    className={`mt-1 text-sm ${
                        isSuccess
                            ? "text-emerald-700"
                            : "text-red-700"
                    }`}
                >
                    {message}
                </p>

            </div>


            <button
                type="button"
                onClick={onClose}
                className={
                    isSuccess
                        ? "text-emerald-500 hover:text-emerald-700"
                        : "text-red-500 hover:text-red-700"
                }
            >

                <X className="h-4 w-4" />

            </button>

        </div>
    );
};


// ============================================================
// SUMMARY CARD
// ============================================================

const SummaryCard = ({
    title,
    value,
    icon: Icon,
}) => {

    return (

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

                <div>

                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {value}
                    </p>

                </div>


                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">

                    <Icon
                        className="h-5 w-5 text-cyan-600"
                    />

                </div>

            </div>

        </div>
    );
};


// ============================================================
// LOADING STATE
// ============================================================

const LoadingState = () => {

    return (

        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="text-center">

                <Loader2
                    className="mx-auto h-8 w-8 animate-spin text-cyan-600"
                />

                <p className="mt-4 text-sm text-slate-500">
                    Loading documents...
                </p>

            </div>

        </div>
    );
};


// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = ({
    onUpload,
}) => {

    return (

        <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white">

            <div className="max-w-md px-6 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50">

                    <Database
                        className="h-8 w-8 text-cyan-600"
                    />

                </div>


                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    No documents yet
                </h3>


                <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upload a drilling report PDF
                    to add it to the NWIS
                    knowledge base.
                </p>


                <button
                    type="button"
                    onClick={onUpload}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700"
                >

                    <Upload className="h-4 w-4" />

                    Upload PDF

                </button>

            </div>

        </div>
    );
};


// ============================================================
// DOCUMENT TABLE
// ============================================================

const DocumentTable = ({
    documents,
    processingId,
    deletingId,
    onProcess,
    onDelete,
}) => {

    return (

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

                <table className="w-full min-w-[1100px]">

                    <thead className="border-b border-slate-200 bg-slate-50">

                        <tr>

                            <TableHeader>
                                Document
                            </TableHeader>

                            <TableHeader>
                                Well
                            </TableHeader>

                            <TableHeader>
                                Type
                            </TableHeader>

                            <TableHeader>
                                Processing
                            </TableHeader>

                            <TableHeader>
                                Statistics
                            </TableHeader>

                            <TableHeader>
                                Actions
                            </TableHeader>

                        </tr>

                    </thead>


                    <tbody className="divide-y divide-slate-100">

                        {documents.map(
                            (document) => (

                                <DocumentRow
                                    key={
                                        document.document_id
                                    }
                                    document={
                                        document
                                    }
                                    processing={
                                        processingId ===
                                        document.document_id
                                    }
                                    deleting={
                                        deletingId ===
                                        document.document_id
                                    }
                                    anotherOperationRunning={
                                        processingId !==
                                            null ||
                                        deletingId !==
                                            null
                                    }
                                    onProcess={
                                        onProcess
                                    }
                                    onDelete={
                                        onDelete
                                    }
                                />

                            )
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
};


// ============================================================
// TABLE HEADER
// ============================================================

const TableHeader = ({
    children,
}) => {

    return (

        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">

            {children}

        </th>
    );
};


// ============================================================
// DOCUMENT ROW
// ============================================================

const DocumentRow = ({
    document,
    processing,
    deleting,
    anotherOperationRunning,
    onProcess,
    onDelete,
}) => {

    const status =
        document.status ||
        "uploaded";


    const config =
        STATUS_CONFIG[status] ||
        STATUS_CONFIG.uploaded;


    const StatusIcon =
        config.icon;


    const progress =
        getProgress(document);


    const isProcessed =
        status === "processed";


    const isFailed =
        status === "failed";


    const actionDisabled =
        anotherOperationRunning &&
        !processing &&
        !deleting;


    return (

        <tr className="transition hover:bg-slate-50">


            {/* ==================================================
                DOCUMENT
            ================================================== */}

            <td className="px-5 py-5">

                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50">

                        <FileText
                            className="h-5 w-5 text-cyan-600"
                        />

                    </div>


                    <div className="min-w-0">

                        <p className="max-w-[280px] truncate font-medium text-slate-800">
                            {document.file_name}
                        </p>

                        <p className="mt-1 max-w-[280px] truncate text-xs text-slate-400">
                            ID: {document.document_id}
                        </p>

                    </div>

                </div>

            </td>


            {/* ==================================================
                WELL
            ================================================== */}

            <td className="px-5 py-5">

                <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">

                    {document.well_id ||
                        "Unknown"}

                </span>

            </td>


            {/* ==================================================
                TYPE
            ================================================== */}

            <td className="px-5 py-5">

                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">

                    {document.document_type ||
                        "Unknown"}

                </span>

            </td>


            {/* ==================================================
                PROCESSING
            ================================================== */}

            <td className="min-w-[240px] px-5 py-5">

                <div className="space-y-2">

                    <div className="flex items-center justify-between gap-3">

                        <div className="flex items-center gap-2">

                            <StatusIcon
                                className={`h-4 w-4 ${
                                    isProcessed
                                        ? "text-emerald-600"
                                        : isFailed
                                            ? "text-red-600"
                                            : "text-cyan-600"
                                } ${
                                    !isProcessed &&
                                    !isFailed &&
                                    status !==
                                        "uploaded"
                                        ? "animate-spin"
                                        : ""
                                }`}
                            />


                            <span
                                className={`text-sm font-medium ${
                                    isProcessed
                                        ? "text-emerald-700"
                                        : isFailed
                                            ? "text-red-700"
                                            : "text-slate-700"
                                }`}
                            >

                                {formatStatus(
                                    status
                                )}

                            </span>

                        </div>


                        <span className="text-xs text-slate-400">
                            {progress}%
                        </span>

                    </div>


                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                isProcessed
                                    ? "bg-emerald-500"
                                    : isFailed
                                        ? "bg-red-500"
                                        : "bg-cyan-500"
                            }`}
                            style={{
                                width: `${progress}%`,
                            }}
                        />

                    </div>


                    {isFailed &&
                        document.error_message && (

                            <p className="max-w-[260px] truncate text-xs text-red-500">
                                {document.error_message}
                            </p>

                        )}

                </div>

            </td>


            {/* ==================================================
                STATISTICS
            ================================================== */}

            <td className="px-5 py-5">

                <div className="grid grid-cols-3 gap-4 text-center">

                    <Stat
                        label="Pages"
                        value={
                            document.page_count ??
                            0
                        }
                    />

                    <Stat
                        label="Chunks"
                        value={
                            document.chunk_count ??
                            0
                        }
                    />

                    <Stat
                        label="Embeddings"
                        value={
                            document.embedding_count ??
                            0
                        }
                    />

                </div>

            </td>


            {/* ==================================================
                ACTIONS
            ================================================== */}

            <td className="px-5 py-5">

                <div className="flex items-center justify-end gap-2">


                    {/* ==================================================
                        PROCESS / READY
                    ================================================== */}

                    {isProcessed ? (

                        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">

                            <CheckCircle2
                                className="h-4 w-4"
                            />

                            Ready

                        </div>

                    ) : (

                        <button
                            type="button"
                            onClick={() =>
                                onProcess(
                                    document.document_id
                                )
                            }
                            disabled={
                                processing ||
                                deleting ||
                                actionDisabled
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            {processing ? (

                                <>
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                    />

                                    Processing...
                                </>

                            ) : (

                                <>
                                    <Play
                                        className="h-4 w-4"
                                    />

                                    {isFailed
                                        ? "Retry"
                                        : "Process"}
                                </>

                            )}

                        </button>

                    )}


                    {/* ==================================================
                        DELETE
                    ================================================== */}

                    <button
                        type="button"
                        onClick={() =>
                            onDelete(
                                document.document_id,
                                document.file_name
                            )
                        }
                        disabled={
                            processing ||
                            deleting ||
                            actionDisabled
                        }
                        title="Delete document"
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        {deleting ? (

                            <Loader2
                                className="h-4 w-4 animate-spin"
                            />

                        ) : (

                            <Trash2
                                className="h-4 w-4"
                            />

                        )}

                    </button>

                </div>

            </td>

        </tr>
    );
};


// ============================================================
// STAT
// ============================================================

const Stat = ({
    label,
    value,
}) => {

    return (

        <div>

            <p className="text-sm font-semibold text-slate-700">
                {value}
            </p>

            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                {label}
            </p>

        </div>
    );
};


export default Documents;
