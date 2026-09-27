from pathlib import Path
import re

from backend.db import get_connection

from backend.ai.rag.ingestion.document_loader import load_pdf
from backend.ai.rag.pipeline.ingest_pipeline import ingest_documents
from backend.ai.rag.embeddings.embedding_model import EmbeddingModel
from backend.ai.rag.vectorstore.faiss_store import FAISSStore

from .document_models import (
    DocumentMetadata,
    DocumentProcessingResult
)


class DocumentService:

    # =========================================================
    # INITIALIZATION
    # =========================================================

    def __init__(self):

        self.reports_dir = (
            Path(__file__).resolve().parent.parent
            / "data"
            / "raw"
            / "reports"
        )

        self.reports_dir.mkdir(
            parents=True,
            exist_ok=True
        )

    # =========================================================
    # REGISTER DOCUMENT
    # =========================================================

    def register_document(self, file_path):

        file_path = Path(file_path)

        file_name = file_path.name

        document_id = file_path.stem

        well_id = self.extract_well_id(
            file_name
        )

        document_type = self.extract_document_type(
            file_name
        )

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            cursor.execute(
                """
                INSERT INTO documents (
                    document_id,
                    file_name,
                    well_id,
                    document_type,
                    status,
                    page_count,
                    chunk_count,
                    embedding_count,
                    error_message
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                ON CONFLICT (document_id)
                DO UPDATE SET
                    file_name = EXCLUDED.file_name,
                    well_id = EXCLUDED.well_id,
                    document_type = EXCLUDED.document_type,
                    status = EXCLUDED.status,
                    error_message = EXCLUDED.error_message
                """,
                (
                    document_id,
                    file_name,
                    well_id,
                    document_type,
                    "uploaded",
                    0,
                    0,
                    0,
                    None
                )
            )

            connection.commit()

            return self.get_document(
                document_id
            )

        except Exception:

            if connection:
                connection.rollback()

            raise

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # =========================================================
    # EXTRACT WELL ID
    # =========================================================

    def extract_well_id(self, file_name):

        match = re.search(
            r"(W\d+)",
            file_name.upper()
        )

        if match:
            return match.group(1)

        return None

    # =========================================================
    # EXTRACT DOCUMENT TYPE
    # =========================================================

    def extract_document_type(self, file_name):

        file_name_upper = file_name.upper()

        if "DDR" in file_name_upper:
            return "DDR"

        if "WCR" in file_name_upper:
            return "WCR"

        if "DPR" in file_name_upper:
            return "DPR"

        if "WELL_REPORT" in file_name_upper:
            return "WELL_REPORT"

        return None

    # =========================================================
    # UPDATE STATUS
    # =========================================================

    def update_status(
        self,
        document_id,
        status,
        error_message=None
    ):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            if status == "processed":

                cursor.execute(
                    """
                    UPDATE documents
                    SET
                        status = %s,
                        error_message = %s,
                        processed_at = CURRENT_TIMESTAMP
                    WHERE document_id = %s
                    """,
                    (
                        status,
                        error_message,
                        document_id
                    )
                )

            else:

                cursor.execute(
                    """
                    UPDATE documents
                    SET
                        status = %s,
                        error_message = %s
                    WHERE document_id = %s
                    """,
                    (
                        status,
                        error_message,
                        document_id
                    )
                )

            connection.commit()

        except Exception:

            if connection:
                connection.rollback()

            raise

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # =========================================================
    # UPDATE PROCESSING COUNTS
    # =========================================================

    def update_processing_counts(
        self,
        document_id,
        page_count=None,
        chunk_count=None,
        embedding_count=None
    ):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            cursor.execute(
                """
                UPDATE documents
                SET
                    page_count = COALESCE(%s, page_count),
                    chunk_count = COALESCE(%s, chunk_count),
                    embedding_count = COALESCE(%s, embedding_count)
                WHERE document_id = %s
                """,
                (
                    page_count,
                    chunk_count,
                    embedding_count,
                    document_id
                )
            )

            connection.commit()

        except Exception:

            if connection:
                connection.rollback()

            raise

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # =========================================================
    # PROCESS DOCUMENT
    # =========================================================

    def process_document(self, document_id):

        document = self.get_document(
            document_id
        )

        if document is None:

            return DocumentProcessingResult(
                success=False,
                document_id=document_id,
                file_name="",
                status="failed",
                message="Document not found.",
                error_message="Document not found."
            )

        pdf_path = (
            self.reports_dir
            / document.file_name
        )

        # -----------------------------------------------------
        # Check physical file
        # -----------------------------------------------------

        if not pdf_path.exists():

            error_message = (
                f"PDF file not found: "
                f"{pdf_path}"
            )

            self.update_status(
                document_id,
                "failed",
                error_message
            )

            return DocumentProcessingResult(
                success=False,
                document_id=document_id,
                file_name=document.file_name,
                status="failed",
                well_id=document.well_id,
                document_type=document.document_type,
                message="PDF file not found.",
                error_message=error_message
            )

        try:

            # -------------------------------------------------
            # EXTRACTING
            # -------------------------------------------------

            self.update_status(
                document_id,
                "extracting"
            )

            pages = load_pdf(
                pdf_path
            )

            page_count = len(
                pages
            )

            self.update_processing_counts(
                document_id,
                page_count=page_count
            )

            # -------------------------------------------------
            # PROGRESS CALLBACK
            # -------------------------------------------------

            def progress_callback(
                file_name,
                status
            ):

                # Only update the selected document
                if file_name == document.file_name:

                    self.update_status(
                        document_id,
                        status
                    )

            # -------------------------------------------------
            # GET ALL PDF FILES
            # -------------------------------------------------

            pdf_files = sorted(
                self.reports_dir.glob("*.pdf")
            )

            if not pdf_files:

                raise ValueError(
                    "No PDF files are available "
                    "for ingestion."
                )

            # -------------------------------------------------
            # REBUILD RAG INDEX
            # -------------------------------------------------

            ingestion_result = ingest_documents(
                pdf_files,
                progress_callback=progress_callback
            )

            # -------------------------------------------------
            # FIND CURRENT DOCUMENT STATISTICS
            # -------------------------------------------------

            selected_statistics = None

            for document_statistics in (
                ingestion_result.get(
                    "documents",
                    []
                )
            ):

                if (
                    document_statistics.get(
                        "file_name"
                    )
                    == document.file_name
                ):

                    selected_statistics = (
                        document_statistics
                    )

                    break

            # -------------------------------------------------
            # UPDATE COUNTS
            # -------------------------------------------------

            if selected_statistics:

                self.update_processing_counts(
                    document_id,
                    page_count=selected_statistics.get(
                        "pages",
                        page_count
                    ),
                    chunk_count=selected_statistics.get(
                        "chunks",
                        0
                    ),
                    embedding_count=selected_statistics.get(
                        "embeddings",
                        0
                    )
                )

            # -------------------------------------------------
            # PROCESSED
            # -------------------------------------------------

            self.update_status(
                document_id,
                "processed"
            )

            return self.build_result(
                document_id,
                success=True,
                message=(
                    "Document processed successfully."
                )
            )

        except Exception as error:

            error_message = str(
                error
            )

            try:

                self.update_status(
                    document_id,
                    "failed",
                    error_message
                )

            except Exception:
                pass

            return self.build_result(
                document_id,
                success=False,
                message="Document processing failed.",
                error_message=error_message
            )

    # =========================================================
    # DELETE DOCUMENT
    # =========================================================

    def delete_document(self, document_id):

        document = self.get_document(
            document_id
        )

        if document is None:

            return {
                "success": False,
                "message": "Document not found."
            }

        pdf_path = (
            self.reports_dir
            / document.file_name
        )

        try:

            # =================================================
            # STEP 1 — DELETE DATABASE RECORD
            # =================================================

            connection = None
            cursor = None

            try:

                connection = get_connection()
                cursor = connection.cursor()

                cursor.execute(
                    """
                    DELETE FROM documents
                    WHERE document_id = %s
                    """,
                    (
                        document_id,
                    )
                )

                deleted_rows = cursor.rowcount

                connection.commit()

            except Exception:

                if connection:
                    connection.rollback()

                raise

            finally:

                if cursor:
                    cursor.close()

                if connection:
                    connection.close()

            # =================================================
            # STEP 2 — DELETE PHYSICAL PDF
            # =================================================

            file_deleted = False

            if pdf_path.exists():

                pdf_path.unlink()

                file_deleted = True

            # =================================================
            # STEP 3 — FIND REMAINING PDFs
            # =================================================

            remaining_pdf_files = sorted(
                self.reports_dir.glob("*.pdf")
            )

            # =================================================
            # STEP 4 — REBUILD FAISS
            # =================================================

            rag_index_rebuilt = False
            remaining_pdf_count = len(
                remaining_pdf_files
            )

            if remaining_pdf_files:

                print(
                    "\nRebuilding RAG index "
                    "after document deletion..."
                )

                ingestion_result = ingest_documents(
                    remaining_pdf_files
                )

                rag_index_rebuilt = True

                print(
                    "RAG index rebuilt successfully."
                )

                print(
                    f"Remaining PDFs: "
                    f"{remaining_pdf_count}"
                )

                print(
                    f"FAISS vectors: "
                    f"{ingestion_result.get(
                        'faiss_vectors',
                        0
                    )}"
                )

            # =================================================
            # STEP 5 — NO PDF FILES LEFT
            # =================================================

            else:

                print(
                    "\nNo PDF files remain."
                )

                self.clear_faiss_index()

                rag_index_rebuilt = True

            # =================================================
            # RESULT
            # =================================================

            return {
                "success": True,
                "message": (
                    "Document deleted successfully."
                ),
                "document_id": document_id,
                "file_name": document.file_name,
                "well_id": document.well_id,
                "database_record_deleted": (
                    deleted_rows > 0
                ),
                "file_deleted": file_deleted,
                "remaining_pdf_count": (
                    remaining_pdf_count
                ),
                "rag_index_rebuilt": (
                    rag_index_rebuilt
                )
            }

        except Exception as error:

            return {
                "success": False,
                "message": (
                    "Document deletion failed."
                ),
                "document_id": document_id,
                "error": str(error)
            }

    # =========================================================
    # CLEAR FAISS INDEX
    # =========================================================

    def clear_faiss_index(self):

        try:

            embedding_model = EmbeddingModel()

            dimension = (
                embedding_model
                .model
                .get_embedding_dimension()
            )

            vector_store = FAISSStore(
                dimension
            )

            vector_store.clear()

            print(
                "✅ FAISS index cleared."
            )

        except Exception as error:

            print(
                "⚠️ Failed to clear FAISS index:"
            )

            print(
                str(error)
            )

            raise

    # =========================================================
    # GET DOCUMENT
    # =========================================================

    def get_document(self, document_id):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    document_id,
                    file_name,
                    well_id,
                    document_type,
                    page_count,
                    chunk_count,
                    embedding_count,
                    status,
                    created_at,
                    processed_at,
                    error_message
                FROM documents
                WHERE document_id = %s
                """,
                (
                    document_id,
                )
            )

            row = cursor.fetchone()

            if row is None:
                return None

            return self.row_to_metadata(
                row
            )

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # =========================================================
    # GET ALL DOCUMENTS
    # =========================================================

    def get_all_documents(self):

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    document_id,
                    file_name,
                    well_id,
                    document_type,
                    page_count,
                    chunk_count,
                    embedding_count,
                    status,
                    created_at,
                    processed_at,
                    error_message
                FROM documents
                ORDER BY created_at DESC
                """
            )

            rows = cursor.fetchall()

            return [
                self.row_to_metadata(row)
                for row in rows
            ]

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # =========================================================
    # DATABASE ROW → MODEL
    # =========================================================

    def row_to_metadata(self, row):

        return DocumentMetadata(
            document_id=row[0],
            file_name=row[1],
            well_id=row[2],
            document_type=row[3],
            page_count=row[4] or 0,
            chunk_count=row[5] or 0,
            embedding_count=row[6] or 0,
            status=row[7],
            created_at=row[8],
            processed_at=row[9],
            error_message=row[10]
        )

    # =========================================================
    # BUILD RESULT
    # =========================================================

    def build_result(
        self,
        document_id,
        success,
        message,
        error_message=None
    ):

        document = self.get_document(
            document_id
        )

        if document is None:

            return DocumentProcessingResult(
                success=success,
                document_id=document_id,
                file_name="",
                status="failed" if not success else "processed",
                message=message,
                error_message=error_message
            )

        return DocumentProcessingResult(
            success=success,
            document_id=document.document_id,
            file_name=document.file_name,
            status=document.status,
            well_id=document.well_id,
            document_type=document.document_type,
            page_count=document.page_count,
            chunk_count=document.chunk_count,
            embedding_count=document.embedding_count,
            message=message,
            error_message=error_message
        )