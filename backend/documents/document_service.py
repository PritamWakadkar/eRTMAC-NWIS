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

        if file_path.suffix.lower() != ".pdf":
            raise ValueError(
                "Only PDF documents are supported."
            )

        file_name = file_path.name
        document_id = file_path.stem

        # Try filename first.
        well_id = self.extract_well_id(file_name)

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
                    well_id = COALESCE(
                        EXCLUDED.well_id,
                        documents.well_id
                    ),
                    document_type = COALESCE(
                        EXCLUDED.document_type,
                        documents.document_type
                    ),
                    status = EXCLUDED.status,
                    page_count = 0,
                    chunk_count = 0,
                    embedding_count = 0,
                    error_message = NULL,
                    processed_at = NULL
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

        if not file_name:
            return None

        name = Path(
            str(file_name)
        ).stem.upper()

        patterns = [

            # Example:
            # W107
            r"(?<![A-Z0-9])W(\d+)(?![A-Z0-9])",

            # Example:
            # _W107_
            r"(?:^|[_\-\s.])W(\d+)(?:[_\-\s.]|$)",

        ]

        for pattern in patterns:

            match = re.search(
                pattern,
                name
            )

            if match:

                return (
                    f"W{match.group(1)}"
                ).upper()

        return None

    # ============================================================
    # EXTRACT WELL ID FROM PDF TEXT
    # ============================================================

    def extract_well_id_from_text(
        self,
        text
    ):

        if not text:
            return None

        patterns = [

            r"(?:Well\s*ID|Well\s*Name|Well\s*No\.?|Well\s*Number)"
            r"\s*[:\-]?\s*(W\d+)",

            r"\b(W\d+)\b",

        ]

        for pattern in patterns:

            matches = re.findall(
                pattern,
                text,
                flags=re.IGNORECASE
            )

            if matches:

                for match in matches:

                    if isinstance(
                        match,
                        tuple
                    ):
                        match = match[-1]

                    value = str(
                        match
                    ).upper().strip()

                    if re.fullmatch(
                        r"W\d+",
                        value
                    ):
                        return value

        return None

    # ============================================================
    # EXTRACT DOCUMENT TYPE
    # ============================================================

    def extract_document_type(
        self,
        file_name
    ):

        name = str(
            file_name
        ).upper()

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

        text_parts = []

        for page in pages:

            if not isinstance(
                page,
                dict
            ):
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

            if not isinstance(
                metadata,
                dict
            ):
                metadata = {}

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
            or self.extract_well_id_from_text(
                full_text
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

        total_depth = self.extract_total_depth(
            full_text
        )

        # --------------------------------------------------------
        # LATITUDE
        # --------------------------------------------------------

        latitude = self.extract_latitude(
            full_text
        )

        # --------------------------------------------------------
        # LONGITUDE
        # --------------------------------------------------------

        longitude = self.extract_longitude(
            full_text
        )

        # --------------------------------------------------------
        # LOCATION
        # --------------------------------------------------------

        location_name = self.extract_location_name(
            full_text
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

    def extract_formation(
        self,
        text
    ):

        if not text:
            return None

        patterns = [

            r"(?:Primary\s+)?Formation\s*[:\-]\s*([^\n]+)",

            r"Geological\s+Formation\s*[:\-]\s*([^\n]+)",

            r"Formation\s*[:\-]\s*([^\n]+)",

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

                value = re.split(
                    r"\s+(?:Drilling|Total\s+Depth|Depth|Mud|ECD|Recorded)\b",
                    value,
                    flags=re.IGNORECASE
                )[0].strip()

                if value:
                    return value

        return None

    # ============================================================
    # EXTRACT TOTAL DEPTH
    # ============================================================

    def extract_total_depth(
        self,
        text
    ):

        if not text:
            return None

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

                    value = float(
                        match.group(1)
                    )

                    if value > 0:
                        return value

                except (
                    TypeError,
                    ValueError
                ):
                    pass

        return None

    # ============================================================
    # EXTRACT LATITUDE
    # ============================================================

    def extract_latitude(
        self,
        text
    ):

        if not text:
            return None

        patterns = [

            r"Latitude\s*[:\-]\s*"
            r"([+-]?\d+(?:\.\d+)?)",

            r"\bLat(?:itude)?\s*[:\-]\s*"
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

                except (
                    TypeError,
                    ValueError
                ):
                    pass

        return None

    # ============================================================
    # EXTRACT LONGITUDE
    # ============================================================

    def extract_longitude(
        self,
        text
    ):

        if not text:
            return None

        patterns = [

            r"Longitude\s*[:\-]\s*"
            r"([+-]?\d+(?:\.\d+)?)",

            r"\bLong(?:itude)?\s*[:\-]\s*"
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

                except (
                    TypeError,
                    ValueError
                ):
                    pass

        return None

    # ============================================================
    # EXTRACT LOCATION NAME
    # ============================================================

    def extract_location_name(
        self,
        text
    ):

        if not text:
            return None

        patterns = [

            r"(?:Village|Village\s+Name)"
            r"\s*[:\-]\s*([^\n]+)",

            r"(?:City|City\s+Name)"
            r"\s*[:\-]\s*([^\n]+)",

            r"(?:Town|Town\s+Name)"
            r"\s*[:\-]\s*([^\n]+)",

            r"(?:District)"
            r"\s*[:\-]\s*([^\n]+)",

            r"(?:Field|Field\s+Name)"
            r"\s*[:\-]\s*([^\n]+)",

            r"(?:Location|Location\s+Name)"
            r"\s*[:\-]\s*([^\n]+)",

            r"(?:Surface\s+Location)"
            r"\s*[:\-]\s*([^\n]+)",

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
    # UPDATE DOCUMENT WELL METADATA
    # ============================================================

    def update_document_metadata(
        self,
        document_id,
        well_id=None,
        document_type=None
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
                    well_id = COALESCE(
                        %s,
                        well_id
                    ),
                    document_type = COALESCE(
                        %s,
                        document_type
                    )
                WHERE document_id = %s
                """,
                (
                    well_id,
                    document_type,
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
    # UPSERT WELL
    # ============================================================

    def upsert_well(
        self,
        well_metadata
    ):

        well_id = well_metadata.get(
            "well_id"
        )

        if not well_id:

            raise ValueError(
                "Unable to determine well ID from document."
            )

        well_id = str(
            well_id
        ).upper().strip()

        latitude = self._normalize_latitude(
            well_metadata.get(
                "latitude"
            )
        )

        longitude = self._normalize_longitude(
            well_metadata.get(
                "longitude"
            )
        )

        total_depth = well_metadata.get(
            "total_depth"
        )

        formation = well_metadata.get(
            "formation"
        )

        location_name = well_metadata.get(
            "location_name"
        )

        connection = None
        cursor = None

        try:

            connection = get_connection()
            cursor = connection.cursor()

            # ----------------------------------------------------
            # Check existing well
            # ----------------------------------------------------

            cursor.execute(
                """
                SELECT
                    latitude,
                    longitude,
                    total_depth,
                    formation,
                    location_name
                FROM wells
                WHERE UPPER(well_id) = %s
                """,
                (
                    well_id,
                )
            )

            existing = cursor.fetchone()

            # ----------------------------------------------------
            # Existing well
            # ----------------------------------------------------

            if existing:

                existing_latitude = existing[0]
                existing_longitude = existing[1]
                existing_total_depth = existing[2]
                existing_formation = existing[3]
                existing_location_name = existing[4]

                final_latitude = (
                    latitude
                    if latitude is not None
                    else existing_latitude
                )

                final_longitude = (
                    longitude
                    if longitude is not None
                    else existing_longitude
                )

                final_total_depth = (
                    total_depth
                    if total_depth is not None
                    else existing_total_depth
                )

                final_formation = (
                    formation
                    if formation
                    else existing_formation
                )

                final_location_name = (
                    location_name
                    if location_name
                    else existing_location_name
                )

                # ----------------------------------------------
                # Existing well WITH coordinates
                # ----------------------------------------------

                if (
                    final_latitude is not None
                    and final_longitude is not None
                ):

                    cursor.execute(
                        """
                        UPDATE wells
                        SET
                            latitude = %s,
                            longitude = %s,
                            total_depth = %s,
                            formation = %s,
                            location = ST_SetSRID(
                                ST_MakePoint(
                                    %s,
                                    %s
                                ),
                                4326
                            )::geometry,
                            location_name = %s
                        WHERE UPPER(well_id) = %s
                        """,
                        (
                            final_latitude,
                            final_longitude,
                            final_total_depth,
                            final_formation,
                            final_longitude,
                            final_latitude,
                            final_location_name,
                            well_id
                        )
                    )

                # ----------------------------------------------
                # Existing well WITHOUT coordinates
                # ----------------------------------------------

                else:

                    cursor.execute(
                        """
                        UPDATE wells
                        SET
                            total_depth = %s,
                            formation = %s,
                            location_name = %s
                        WHERE UPPER(well_id) = %s
                        """,
                        (
                            final_total_depth,
                            final_formation,
                            final_location_name,
                            well_id
                        )
                    )

            # ----------------------------------------------------
            # New well
            # ----------------------------------------------------

            else:

                # ----------------------------------------------
                # New well WITH coordinates
                # ----------------------------------------------

                if (
                    latitude is not None
                    and longitude is not None
                ):

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
                            ST_SetSRID(
                                ST_MakePoint(
                                    %s,
                                    %s
                                ),
                                4326
                            )::geometry,
                            %s
                        )
                        """,
                        (
                            well_id,
                            latitude,
                            longitude,
                            total_depth,
                            formation,
                            longitude,
                            latitude,
                            location_name
                        )
                    )

                # ----------------------------------------------
                # New well WITHOUT coordinates
                # ----------------------------------------------

                else:

                    cursor.execute(
                        """
                        INSERT INTO wells (
                            well_id,
                            latitude,
                            longitude,
                            total_depth,
                            formation,
                            location_name
                        )
                        VALUES (
                            %s,
                            NULL,
                            NULL,
                            %s,
                            %s,
                            %s
                        )
                        """,
                        (
                            well_id,
                            total_depth,
                            formation,
                            location_name
                        )
                    )

            connection.commit()

            return {
                "success": True,
                "well_id": well_id,
                "latitude": latitude,
                "longitude": longitude,
                "total_depth": total_depth,
                "formation": formation,
                "location_name": location_name
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

    def _normalize_latitude(
        self,
        value
    ):

        if value is None:
            return None

        try:

            value = float(value)

        except (
            TypeError,
            ValueError
        ):

            return None

        if -90 <= value <= 90:
            return value

        return None

    # ============================================================
    # NORMALIZE LONGITUDE
    # ============================================================

    def _normalize_longitude(
        self,
        value
    ):

        if value is None:
            return None

        try:

            value = float(value)

        except (
            TypeError,
            ValueError
        ):

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
                    page_count = COALESCE(
                        %s,
                        page_count
                    ),
                    chunk_count = COALESCE(
                        %s,
                        chunk_count
                    ),
                    embedding_count = COALESCE(
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
            # 2. EXTRACT WELL METADATA
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
                    "Well ID could not be detected "
                    "from the filename or PDF content."
                )

            # ====================================================
            # 4. IMPORTANT:
            #    UPDATE documents.well_id
            # ====================================================

            self.update_document_metadata(
                document_id=document_id,
                well_id=extracted_well_id,
                document_type=(
                    self.extract_document_type(
                        document.file_name
                    )
                )
            )

            print(
                f"\n✅ Document well ID updated: "
                f"{extracted_well_id}"
            )

            # ====================================================
            # 5. SYNCHRONIZE WELLS TABLE
            # ====================================================

            well_database_result = (
                self.upsert_well(
                    well_metadata
                )
            )

            print(
                "\n✅ Well table synchronized."
            )

            print(
                f"Well ID: "
                f"{well_database_result['well_id']}"
            )

            # ====================================================
            # 6. RAG PROGRESS CALLBACK
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
                    f"[{file_name}] -> {status}"
                )

            # ====================================================
            # 7. GET ALL PDF DOCUMENTS
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
            # 8. RAG INGESTION
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
            # 9. FIND CURRENT DOCUMENT STATS
            # ====================================================

            current_stats = None

            for item in (
                ingestion_result.get(
                    "documents",
                    []
                )
            ):

                if (
                    item.get("file_name")
                    == document.file_name
                ):

                    current_stats = item
                    break

            # ====================================================
            # 10. UPDATE PROCESSING COUNTS
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
            # 11. FINAL DOCUMENT STATUS
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
                f"Well synchronized : "
                f"{well_database_result['well_id']}"
            )

            print(
                f"RAG chunks        : "
                f"{ingestion_result.get('chunks', 0)}"
            )

            print(
                f"FAISS vectors     : "
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
            # Delete physical PDF
            # ----------------------------------------------------

            file_deleted = False

            if pdf_path.exists():

                pdf_path.unlink()

                file_deleted = True

            # ----------------------------------------------------
            # Rebuild RAG index
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

            else:

                self.clear_faiss_index()

                ingestion_result = {
                    "faiss_vectors": 0
                }

            # ----------------------------------------------------
            # Remove well only if no document references it
            # ----------------------------------------------------

            well_deleted = False

            if document.well_id:

                connection = None
                cursor = None

                try:

                    connection = get_connection()
                    cursor = connection.cursor()

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
                "success": deleted_rows > 0,
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
                "rag_index_rebuilt": True,
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
    # CLEAR FAISS INDEX
    # ============================================================

    def clear_faiss_index(self):

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
    # DATABASE ROW -> MODEL
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
    # BUILD PROCESSING RESULT
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