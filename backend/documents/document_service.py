from pathlib import Path
import re

from backend.db import get_connection

from backend.ai.rag.ingestion.document_loader import load_pdf
from backend.ai.rag.pipeline.ingest_pipeline import ingest_documents
from backend.ai.rag.embeddings.embedding_model import EmbeddingModel
from backend.ai.rag.vectorstore.faiss_store import FAISSStore
from backend.ai.rag.ingestion.metadata_extractor import extract_metadata

from .document_models import (
    DocumentMetadata,
    DocumentProcessingResult,
)


class DocumentService:

    # ============================================================
    # INITIALIZATION
    # ============================================================

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

    # ============================================================
    # REGISTER DOCUMENT
    # ============================================================

    def register_document(self, file_path):

        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(
                f"Document not found: {file_path}"
            )

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

    # ============================================================
    # EXTRACT WELL ID
    # ============================================================

    def extract_well_id(self, file_name):

        match = re.search(
            r"\b(W\d+)\b",
            file_name.upper()
        )

        if match:
            return match.group(1)

        return None

    # ============================================================
    # EXTRACT DOCUMENT TYPE
    # ============================================================

    def extract_document_type(self, file_name):

        name = file_name.upper()

        if "DDR" in name:
            return "DDR"

        if "WCR" in name:
            return "WCR"

        if "DPR" in name:
            return "DPR"

        if "WELL_REPORT" in name:
            return "WELL_REPORT"

        return None

    # ============================================================
    # EXTRACT WELL METADATA FROM PDF
    # ============================================================

    def extract_well_metadata(
        self,
        pages,
        file_name
    ):
        """
        Extract well information from the PDF.

        Returns:

        {
            well_id,
            formation,
            total_depth,
            latitude,
            longitude,
            location_name
        }
        """

        # --------------------------------------------------------
        # Combine all extracted PDF text
        # --------------------------------------------------------

        text_parts = []

        for page in pages:

            if not isinstance(page, dict):
                continue

            page_text = page.get(
                "text",
                ""
            )

            if page_text:
                text_parts.append(
                    str(page_text)
                )

        full_text = "\n".join(
            text_parts
        )

        # --------------------------------------------------------
        # Existing metadata extractor
        # --------------------------------------------------------

        try:

            metadata = extract_metadata(
                full_text,
                file_name
            )

        except Exception:

            metadata = {}

        # --------------------------------------------------------
        # WELL ID
        # --------------------------------------------------------

        well_id = (
            metadata.get("well_id")
            or self.extract_well_id(
                file_name
            )
        )

        if well_id:
            well_id = str(
                well_id
            ).upper().strip()

        # --------------------------------------------------------
        # FORMATION
        # --------------------------------------------------------

        formation = (
            metadata.get("formation")
            or self.extract_formation(
                full_text
            )
        )

        if formation:
            formation = str(
                formation
            ).strip()

        # --------------------------------------------------------
        # TOTAL DEPTH
        # --------------------------------------------------------

        total_depth = (
            self.extract_total_depth(
                full_text
            )
        )

        # --------------------------------------------------------
        # LATITUDE
        # --------------------------------------------------------

        latitude = (
            self.extract_latitude(
                full_text
            )
        )

        # --------------------------------------------------------
        # LONGITUDE
        # --------------------------------------------------------

        longitude = (
            self.extract_longitude(
                full_text
            )
        )

        # --------------------------------------------------------
        # LOCATION NAME
        # --------------------------------------------------------

        location_name = (
            self.extract_location_name(
                full_text
            )
        )

        return {
            "well_id": well_id,
            "formation": formation,
            "total_depth": total_depth,
            "latitude": latitude,
            "longitude": longitude,
            "location_name": location_name,
        }

    # ============================================================
    # EXTRACT FORMATION
    # ============================================================

    def extract_formation(self, text):

        patterns = [

            r"(?:Primary\s+)?Formation\s*:\s*([^\n]+)",

            r"Formation\s*[-:]\s*([^\n]+)",

            r"Geological\s+Formation\s*[-:]\s*([^\n]+)",

        ]

        for pattern in patterns:

            match = re.search(
                pattern,
                text,
                flags=re.IGNORECASE
            )

            if match:

                value = match.group(1).strip()

                value = re.sub(
                    r"\s+",
                    " ",
                    value
                )

                # Remove accidental trailing labels
                value = re.split(
                    r"\s+(?:Drilling|Total Depth|Depth|Mud|ECD)\b",
                    value,
                    flags=re.IGNORECASE
                )[0]

                if value:
                    return value

        return None

    # ============================================================
    # EXTRACT TOTAL DEPTH
    # ============================================================

    def extract_total_depth(self, text):

        patterns = [

            r"Total\s+Depth\s*[:\-]\s*"
            r"(\d+(?:\.\d+)?)\s*m",

            r"TD\s*[:\-]\s*"
            r"(\d+(?:\.\d+)?)\s*m",

            r"Total\s+Depth\s*[:\-]\s*"
            r"(\d+(?:\.\d+)?)",

        ]

        for pattern in patterns:

            match = re.search(
                pattern,
                text,
                flags=re.IGNORECASE
            )

            if match:

                try:
                    return float(
                        match.group(1)
                    )

                except ValueError:
                    pass

        return None

    # ============================================================
    # EXTRACT LATITUDE
    # ============================================================

    def extract_latitude(self, text):

        patterns = [

            r"Latitude\s*[:\-]\s*"
            r"([+-]?\d+(?:\.\d+)?)",

            r"Lat(?:itude)?\s*[:\-]\s*"
            r"([+-]?\d+(?:\.\d+)?)",

        ]

        for pattern in patterns:

            match = re.search(
                pattern,
                text,
                flags=re.IGNORECASE
            )

            if match:

                try:

                    value = float(
                        match.group(1)
                    )

                    if -90 <= value <= 90:
                        return value

                except ValueError:
                    pass

        return None

    # ============================================================
    # EXTRACT LONGITUDE
    # ============================================================

    def extract_longitude(self, text):

        patterns = [

            r"Longitude\s*[:\-]\s*"
            r"([+-]?\d+(?:\.\d+)?)",

            r"Long(?:itude)?\s*[:\-]\s*"
            r"([+-]?\d+(?:\.\d+)?)",

        ]

        for pattern in patterns:

            match = re.search(
                pattern,
                text,
                flags=re.IGNORECASE
            )

            if match:

                try:

                    value = float(
                        match.group(1)
                    )

                    if -180 <= value <= 180:
                        return value

                except ValueError:
                    pass

        return None

    # ============================================================
    # EXTRACT LOCATION NAME
    # ============================================================

    def extract_location_name(self, text):

        patterns = [

            r"(?:Village|Village\s+Name)\s*[:\-]\s*([^\n]+)",

            r"(?:City|City\s+Name)\s*[:\-]\s*([^\n]+)",

            r"(?:Town|Town\s+Name)\s*[:\-]\s*([^\n]+)",

            r"(?:District)\s*[:\-]\s*([^\n]+)",

            r"(?:Field|Field\s+Name)\s*[:\-]\s*([^\n]+)",

            r"(?:Location|Location\s+Name)\s*[:\-]\s*([^\n]+)",

            r"(?:Surface\s+Location)\s*[:\-]\s*([^\n]+)",

        ]

        for pattern in patterns:

            match = re.search(
                pattern,
                text,
                flags=re.IGNORECASE
            )

            if match:

                value = match.group(1).strip()

                value = re.sub(
                    r"\s+",
                    " ",
                    value
                )

                if value:
                    return value

        return None

    # ============================================================
    # UPSERT WELL INTO POSTGRESQL
    # ============================================================

    def upsert_well(
        self,
        well_metadata
    ):
        """
        Automatically create/update a record in the PostgreSQL wells table.

        IMPORTANT:
        - Latitude/longitude are optional because many drilling reports do
          not contain coordinates.
        - Missing coordinates are stored as NULL.
        - If a well already exists, existing coordinates are preserved when
          the current PDF does not contain them.
        - The PostGIS `location` geometry is created only when both
          coordinates are available.
        """

        well_id = well_metadata.get("well_id")

        if not well_id:
            raise ValueError(
                "Unable to determine well ID from document."
            )

        well_id = str(well_id).upper().strip()

        latitude = self._normalize_latitude(
            well_metadata.get("latitude")
        )

        longitude = self._normalize_longitude(
            well_metadata.get("longitude")
        )

        total_depth = well_metadata.get("total_depth")
        formation = well_metadata.get("formation")
        location_name = well_metadata.get("location_name")

        connection = None
        cursor = None

        try:
            connection = get_connection()
            cursor = connection.cursor()

            # --------------------------------------------------------
            # IMPORTANT:
            # Do not use fake values such as 0 for missing coordinates.
            # PostgreSQL should store missing coordinates as NULL.
            #
            # The wells.latitude and wells.longitude columns therefore
            # need to allow NULL:
            #
            # ALTER TABLE wells ALTER COLUMN latitude DROP NOT NULL;
            # ALTER TABLE wells ALTER COLUMN longitude DROP NOT NULL;
            # --------------------------------------------------------

            cursor.execute(
                """
                INSERT INTO wells (
                    well_id,
                    latitude,
                    longitude,
                    total_depth,
                    formation,
                    location,
                    location_name
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    CASE
                        WHEN %s IS NOT NULL
                         AND %s IS NOT NULL
                        THEN ST_SetSRID(
                            ST_MakePoint(%s, %s),
                            4326
                        )::geometry
                        ELSE NULL
                    END,
                    %s
                )

                ON CONFLICT (well_id)
                DO UPDATE SET
                    latitude = COALESCE(
                        EXCLUDED.latitude,
                        wells.latitude
                    ),

                    longitude = COALESCE(
                        EXCLUDED.longitude,
                        wells.longitude
                    ),

                    total_depth = COALESCE(
                        EXCLUDED.total_depth,
                        wells.total_depth
                    ),

                    formation = COALESCE(
                        EXCLUDED.formation,
                        wells.formation
                    ),

                    location = COALESCE(
                        EXCLUDED.location,
                        wells.location
                    ),

                    location_name = COALESCE(
                        EXCLUDED.location_name,
                        wells.location_name
                    )
                """,
                (
                    well_id,
                    latitude,
                    longitude,
                    total_depth,
                    formation,

                    # Used by CASE to determine whether a geometry
                    # should be created.
                    latitude,
                    longitude,

                    # ST_MakePoint(longitude, latitude)
                    longitude,
                    latitude,

                    location_name
                )
            )

            connection.commit()

            print(
                "\n✅ WELL DATABASE SYNCHRONIZED"
            )

            print(
                f"Well ID       : {well_id}"
            )

            print(
                f"Formation     : {formation}"
            )

            print(
                f"Total depth   : {total_depth}"
            )

            print(
                f"Latitude      : {latitude}"
            )

            print(
                f"Longitude     : {longitude}"
            )

            print(
                f"Location name : {location_name}"
            )

            return {
                "success": True,
                "well_id": well_id,
                "latitude": latitude,
                "longitude": longitude,
                "total_depth": total_depth,
                "formation": formation,
                "location_name": location_name,
            }

        except Exception:

            if connection:
                connection.rollback()

            raise

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ============================================================
    # NORMALIZE LATITUDE
    # ============================================================

    def _normalize_latitude(self, value):
        """
        Convert latitude to float when valid.

        Returns None when the document does not provide a valid
        latitude. Never replaces missing coordinates with 0.
        """

        if value is None:
            return None

        try:
            value = float(value)
        except (TypeError, ValueError):
            return None

        if -90 <= value <= 90:
            return value

        return None

    # ============================================================
    # NORMALIZE LONGITUDE
    # ============================================================

    def _normalize_longitude(self, value):
        """
        Convert longitude to float when valid.

        Returns None when the document does not provide a valid
        longitude. Never replaces missing coordinates with 0.
        """

        if value is None:
            return None

        try:
            value = float(value)
        except (TypeError, ValueError):
            return None

        if -180 <= value <= 180:
            return value

        return None

    # ============================================================
    # UPDATE DOCUMENT STATUS
    # ============================================================

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

    # ============================================================
    # UPDATE PROCESSING COUNTS
    # ============================================================

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
                    page_count =
                        COALESCE(
                            %s,
                            page_count
                        ),

                    chunk_count =
                        COALESCE(
                            %s,
                            chunk_count
                        ),

                    embedding_count =
                        COALESCE(
                            %s,
                            embedding_count
                        )

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

    # ============================================================
    # PROCESS DOCUMENT
    # ============================================================

    def process_document(
        self,
        document_id
    ):

        document = self.get_document(
            document_id
        )

        if document is None:

            return self.build_result(
                document_id,
                False,
                "Document not found.",
                "Document does not exist."
            )

        pdf_path = (
            self.reports_dir
            / document.file_name
        )

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

            return self.build_result(
                document_id,
                False,
                "PDF file not found.",
                error_message
            )

        try:

            print(
                "\n" + "=" * 70
            )

            print(
                "PROCESSING DOCUMENT"
            )

            print(
                "=" * 70
            )

            print(
                f"File: {document.file_name}"
            )

            # ====================================================
            # 1. EXTRACT PDF
            # ====================================================

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

            print(
                f"Pages detected: {page_count}"
            )

            # ====================================================
            # 2. EXTRACT WELL INFORMATION
            # ====================================================

            self.update_status(
                document_id,
                "metadata_extraction"
            )

            well_metadata = (
                self.extract_well_metadata(
                    pages,
                    document.file_name
                )
            )

            print(
                "\nExtracted well metadata:"
            )

            print(
                well_metadata
            )

            extracted_well_id = (
                well_metadata.get(
                    "well_id"
                )
            )

            # ====================================================
            # 3. VERIFY WELL ID
            # ====================================================

            if not extracted_well_id:

                raise ValueError(
                    "Well ID could not be extracted "
                    "from the PDF."
                )

            # ====================================================
            # 4. SYNCHRONIZE WELL TABLE
            # ====================================================

            self.update_status(
                document_id,
                "metadata_extraction"
            )

            well_database_result = (
                self.upsert_well(
                    well_metadata
                )
            )

            # ====================================================
            # 5. PROGRESS CALLBACK
            # ====================================================

            def progress_callback(
                file_name,
                status
            ):

                if (
                    file_name
                    == document.file_name
                ):

                    self.update_status(
                        document_id,
                        status
                    )

                print(
                    f"[{file_name}] → {status}"
                )

            # ====================================================
            # 6. GET ALL PDFs
            # ====================================================

            pdf_files = sorted(
                self.reports_dir.glob(
                    "*.pdf"
                )
            )

            if not pdf_files:

                raise ValueError(
                    "No PDF documents found."
                )

            # ====================================================
            # 7. RAG INGESTION
            # ====================================================

            print(
                "\nStarting RAG ingestion..."
            )

            ingestion_result = (
                ingest_documents(
                    pdf_files,
                    progress_callback=(
                        progress_callback
                    )
                )
            )

            # ====================================================
            # 8. FIND CURRENT DOCUMENT STATS
            # ====================================================

            current_stats = None

            for item in (
                ingestion_result.get(
                    "documents",
                    []
                )
            ):

                if (
                    item.get(
                        "file_name"
                    )
                    == document.file_name
                ):

                    current_stats = item
                    break

            # ====================================================
            # 9. UPDATE COUNTS
            # ====================================================

            if current_stats:

                self.update_processing_counts(
                    document_id,

                    page_count=current_stats.get(
                        "pages",
                        page_count
                    ),

                    chunk_count=current_stats.get(
                        "chunks",
                        0
                    ),

                    embedding_count=current_stats.get(
                        "embeddings",
                        0
                    )
                )

            # ====================================================
            # 10. PROCESSED
            # ====================================================

            self.update_status(
                document_id,
                "processed"
            )

            print(
                "\n" + "=" * 70
            )

            print(
                "DOCUMENT PROCESSING COMPLETE"
            )

            print(
                "=" * 70
            )

            print(
                f"Well synchronized: "
                f"{well_database_result['well_id']}"
            )

            print(
                f"RAG chunks: "
                f"{ingestion_result.get('chunks', 0)}"
            )

            print(
                f"FAISS vectors: "
                f"{ingestion_result.get('faiss_vectors', 0)}"
            )

            return self.build_result(
                document_id,
                True,
                (
                    "Document processed successfully "
                    "and well data synchronized."
                )
            )

        except Exception as error:

            error_message = str(
                error
            )

            print(
                "\n❌ DOCUMENT PROCESSING ERROR"
            )

            print(
                error_message
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
                False,
                "Document processing failed.",
                error_message
            )

    # ============================================================
    # DELETE DOCUMENT
    # ============================================================

    def delete_document(
        self,
        document_id
    ):

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

            cursor.close()
            connection.close()

            # ----------------------------------------------------
            # Delete PDF
            # ----------------------------------------------------

            file_deleted = False

            if pdf_path.exists():

                pdf_path.unlink()

                file_deleted = True

            # ----------------------------------------------------
            # Rebuild RAG
            # ----------------------------------------------------

            remaining_files = sorted(
                self.reports_dir.glob(
                    "*.pdf"
                )
            )

            if remaining_files:

                ingestion_result = (
                    ingest_documents(
                        remaining_files
                    )
                )

                rag_index_rebuilt = True

            else:

                self.clear_faiss_index()

                rag_index_rebuilt = True

                ingestion_result = {
                    "faiss_vectors": 0
                }

            # ----------------------------------------------------
            # OPTIONAL WELL CLEANUP
            # ----------------------------------------------------

            well_deleted = False

            if document.well_id:

                connection = None
                cursor = None

                try:

                    connection = get_connection()
                    cursor = connection.cursor()

                    # Only delete the well if no remaining
                    # document references that well.

                    cursor.execute(
                        """
                        SELECT COUNT(*)
                        FROM documents
                        WHERE UPPER(well_id) = %s
                        """,
                        (
                            document.well_id.upper(),
                        )
                    )

                    remaining_documents = (
                        cursor.fetchone()[0]
                    )

                    if remaining_documents == 0:

                        cursor.execute(
                            """
                            DELETE FROM wells
                            WHERE UPPER(well_id) = %s
                            """,
                            (
                                document.well_id.upper(),
                            )
                        )

                        well_deleted = (
                            cursor.rowcount > 0
                        )

                        connection.commit()

                except Exception:

                    if connection:
                        connection.rollback()

                finally:

                    if cursor:
                        cursor.close()

                    if connection:
                        connection.close()

            return {
                "success": (
                    deleted_rows > 0
                ),
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
                "well_record_deleted": well_deleted,
                "remaining_pdf_count": len(
                    remaining_files
                ),
                "rag_index_rebuilt": (
                    rag_index_rebuilt
                ),
                "faiss_vectors": (
                    ingestion_result.get(
                        "faiss_vectors",
                        0
                    )
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

    # ============================================================
    # CLEAR FAISS
    # ============================================================

    def clear_faiss_index(self):

        embedding_model = (
            EmbeddingModel()
        )

        dimension = (
            embedding_model
            .model
            .get_embedding_dimension()
        )

        vector_store = (
            FAISSStore(
                dimension
            )
        )

        vector_store.clear()

    # ============================================================
    # GET DOCUMENT
    # ============================================================

    def get_document(
        self,
        document_id
    ):

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

    # ============================================================
    # GET ALL DOCUMENTS
    # ============================================================

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
                self.row_to_metadata(
                    row
                )
                for row in rows
            ]

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ============================================================
    # DATABASE ROW → MODEL
    # ============================================================

    def row_to_metadata(
        self,
        row
    ):

        return DocumentMetadata(

            document_id=row[0],

            file_name=row[1],

            well_id=row[2],

            document_type=row[3],

            page_count=(
                row[4] or 0
            ),

            chunk_count=(
                row[5] or 0
            ),

            embedding_count=(
                row[6] or 0
            ),

            status=row[7],

            created_at=row[8],

            processed_at=row[9],

            error_message=row[10]
        )

    # ============================================================
    # BUILD RESULT
    # ============================================================

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
                status=(
                    "failed"
                    if not success
                    else "processed"
                ),
                message=message,
                error_message=error_message
            )

        return DocumentProcessingResult(

            success=success,

            document_id=(
                document.document_id
            ),

            file_name=(
                document.file_name
            ),

            status=(
                document.status
            ),

            well_id=(
                document.well_id
            ),

            document_type=(
                document.document_type
            ),

            page_count=(
                document.page_count
            ),

            chunk_count=(
                document.chunk_count
            ),

            embedding_count=(
                document.embedding_count
            ),

            message=message,

            error_message=error_message
        )