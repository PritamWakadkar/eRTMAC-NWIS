from pathlib import Path

import shutil
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

from backend.documents.document_service import DocumentService


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = (
    BASE_DIR
    / "data"
    / "raw"
    / "reports"
)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


document_service = DocumentService()


# ============================================================
# PROCESSING PROGRESS
# ============================================================

STATUS_PROGRESS = {
    "uploaded": 0,
    "extracting": 15,
    "cleaning": 30,
    "metadata_extraction": 45,
    "chunking": 60,
    "embedding": 75,
    "indexing": 90,
    "processed": 100,
    "failed": 0,
}


def get_progress(status):
    return STATUS_PROGRESS.get(
        status,
        0
    )


def serialize_document(document):
    return {
        "document_id": document.document_id,
        "file_name": document.file_name,
        "well_id": document.well_id,
        "document_type": document.document_type,
        "status": document.status,

        # Frontend-friendly fields
        "processing_stage": document.status,

        "progress_percent": get_progress(
            document.status
        ),

        "page_count": document.page_count,
        "chunk_count": document.chunk_count,
        "embedding_count": document.embedding_count,

        "error_message": document.error_message,

        "created_at": document.created_at,
        "processed_at": document.processed_at,
    }


# ============================================================
# UPLOAD DOCUMENT
# ============================================================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file name provided."
        )

    file_name = Path(
        file.filename
    ).name

    if not file_name.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF documents are "
                "currently supported."
            )
        )

    # Create unique stored filename
    unique_prefix = uuid.uuid4().hex[:8]

    stored_file_name = (
        f"{unique_prefix}_{file_name}"
    )

    file_path = (
        UPLOAD_DIR
        / stored_file_name
    )

    # --------------------------------------------------------
    # SAVE FILE
    # --------------------------------------------------------

    try:

        with file_path.open("wb") as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to save document: "
                f"{error}"
            )
        )

    # --------------------------------------------------------
    # REGISTER DOCUMENT IN DATABASE
    # --------------------------------------------------------

    try:

        metadata = (
            document_service.register_document(
                file_path
            )
        )

    except Exception as error:

        # Rollback uploaded file if
        # database registration fails

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to register document: "
                f"{error}"
            )
        )

    return {
        "success": True,

        "message": (
            "Document uploaded successfully."
        ),

        "document": {
            **serialize_document(metadata),

            "stored_file_name":
                stored_file_name,

            "file_path":
                str(file_path),
        }
    }


# ============================================================
# GET ALL DOCUMENTS
# ============================================================

@router.get("")
async def get_documents():

    documents = (
        document_service
        .get_all_documents()
    )

    return {
        "success": True,

        "count": len(documents),

        "documents": [
            serialize_document(document)
            for document in documents
        ]
    }


# ============================================================
# GET SINGLE DOCUMENT
# ============================================================

@router.get("/{document_id}")
async def get_document(
    document_id: str
):

    document = (
        document_service
        .get_document(document_id)
    )

    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    return {
        "success": True,

        "document":
            serialize_document(document)
    }


# ============================================================
# PROCESS DOCUMENT
# ============================================================

@router.post("/{document_id}/process")
async def process_document(
    document_id: str
):

    document = (
        document_service
        .get_document(document_id)
    )

    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    result = (
        document_service
        .process_document(document_id)
    )

    document = (
        document_service
        .get_document(document_id)
    )

    return {
        "success": result.success,

        "message": result.message,

        "document": (
            serialize_document(document)

            if document

            else {
                "document_id":
                    result.document_id,

                "status":
                    result.status,

                "processing_stage":
                    result.status,

                "progress_percent":
                    get_progress(
                        result.status
                    ),
            }
        )
    }


# ============================================================
# DELETE DOCUMENT
# ============================================================

@router.delete("/{document_id}")
async def delete_document(
    document_id: str
):

    # --------------------------------------------------------
    # CHECK DOCUMENT
    # --------------------------------------------------------

    document = (
        document_service
        .get_document(document_id)
    )

    if document is None:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    # --------------------------------------------------------
    # DELETE DOCUMENT
    # --------------------------------------------------------

    try:

        result = (
            document_service
            .delete_document(document_id)
        )

        if not result.get("success"):

            raise HTTPException(
                status_code=404,
                detail=result.get(
                    "message",
                    "Document not found."
                )
            )

        return result

    except HTTPException:

        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to delete document: "
                f"{error}"
            )
        )