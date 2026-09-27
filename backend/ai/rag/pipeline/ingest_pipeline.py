from pathlib import Path

from ..ingestion.document_loader import load_pdf
from ..ingestion.text_cleaner import clean_text
from ..ingestion.chunker import chunk_text
from ..ingestion.metadata_extractor import extract_metadata
from ..config import CHUNKS_DIR
from ..vectorstore.metadata import save_metadata
from ..embeddings.embedding_model import EmbeddingModel
from ..vectorstore.faiss_store import FAISSStore


def ingest_documents(pdf_files, progress_callback=None):
    """
    Ingest PDF documents into the RAG pipeline.

    The pipeline is:

        PDF
         ↓
        Text Extraction
         ↓
        Text Cleaning
         ↓
        Metadata Extraction
         ↓
        Chunking
         ↓
        Embeddings
         ↓
        FAISS Index
         ↓
        Metadata Storage

    Every call rebuilds the FAISS index from the supplied
    PDF files.

    Args:
        pdf_files:
            List of PDF paths.

        progress_callback:
            Optional callback:

                progress_callback(
                    file_name,
                    status
                )

            Example:

                progress_callback(
                    "W105_DDR.pdf",
                    "extracting"
                )

    Returns:
        dict containing overall ingestion statistics and
        per-document statistics.
    """

    print("\n" + "=" * 60)
    print("NWIS RAG DOCUMENT INGESTION")
    print("=" * 60)

    # =========================================================
    # VALIDATE INPUT
    # =========================================================

    if not pdf_files:
        raise ValueError(
            "No PDF files were supplied for ingestion."
        )

    # Convert everything to Path objects
    pdf_files = [
        Path(pdf_file)
        for pdf_file in pdf_files
    ]

    # Validate files
    missing_files = [
        str(pdf_file)
        for pdf_file in pdf_files
        if not pdf_file.exists()
    ]

    if missing_files:
        raise FileNotFoundError(
            "The following PDF files do not exist: "
            + ", ".join(missing_files)
        )

    print(
        f"\nProcessing {len(pdf_files)} PDF file(s)."
    )

    # =========================================================
    # PREPARE STORAGE
    # =========================================================

    CHUNKS_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    # =========================================================
    # GLOBAL STORAGE
    # =========================================================

    all_chunks = []
    metadata_records = []

    global_chunk_index = 0

    # Statistics for every PDF
    document_statistics = []

    # =========================================================
    # PROCESS EACH PDF
    # =========================================================

    for pdf_path in pdf_files:

        print("\n" + "-" * 60)
        print(
            f"Processing: {pdf_path.name}"
        )
        print("-" * 60)

        # -----------------------------------------------------
        # INITIAL DOCUMENT STATISTICS
        # -----------------------------------------------------

        document_page_count = 0
        document_chunk_count = 0

        # -----------------------------------------------------
        # STATUS: EXTRACTING
        # -----------------------------------------------------

        if progress_callback:
            progress_callback(
                pdf_path.name,
                "extracting"
            )

        pages = load_pdf(
            pdf_path
        )

        # -----------------------------------------------------
        # EMPTY PDF
        # -----------------------------------------------------

        if not pages:

            print(
                "⚠️ No text found in this PDF."
            )

            document_statistics.append(
                {
                    "file_name": pdf_path.name,
                    "pages": 0,
                    "chunks": 0,
                    "embeddings": 0
                }
            )

            continue

        document_page_count = len(
            pages
        )

        # =====================================================
        # PROCESS EACH PAGE
        # =====================================================

        for page_data in pages:

            raw_text = page_data.get(
                "text",
                ""
            )

            page_number = page_data.get(
                "page",
                1
            )

            document_name = page_data.get(
                "document",
                pdf_path.name
            )

            # -------------------------------------------------
            # Ignore empty pages
            # -------------------------------------------------

            if not raw_text.strip():
                continue

            # -------------------------------------------------
            # STATUS: CLEANING
            # -------------------------------------------------

            if progress_callback:
                progress_callback(
                    pdf_path.name,
                    "cleaning"
                )

            cleaned_text = clean_text(
                raw_text
            )

            if not cleaned_text.strip():
                continue

            # -------------------------------------------------
            # STATUS: METADATA EXTRACTION
            # -------------------------------------------------

            if progress_callback:
                progress_callback(
                    pdf_path.name,
                    "metadata_extraction"
                )

            metadata = extract_metadata(
                cleaned_text,
                document_name
            )

            # -------------------------------------------------
            # METADATA
            # -------------------------------------------------

            well_id = metadata.get(
                "well_id"
            )

            formation = metadata.get(
                "formation",
                "Formation not specified"
            )

            depths = metadata.get(
                "depths",
                []
            )

            events = metadata.get(
                "events",
                []
            )

            historical_problem_intervals = metadata.get(
                "historical_problem_intervals",
                []
            )

            print(
                f"\nPage {page_number}"
            )

            print(
                f"Well ID: {well_id}"
            )

            print(
                f"Formation: {formation}"
            )

            print(
                f"Events extracted: {len(events)}"
            )

            for event in events:

                print(
                    f"  • "
                    f"{event.get('event')} "
                    f"| "
                    f"{event.get('depth')}"
                )

                print(
                    f"    Evidence: "
                    f"{event.get('evidence')}"
                )

            # -------------------------------------------------
            # STATUS: CHUNKING
            # -------------------------------------------------

            if progress_callback:
                progress_callback(
                    pdf_path.name,
                    "chunking"
                )

            chunks = chunk_text(
                cleaned_text
            )

            print(
                f"Chunks created: {len(chunks)}"
            )

            # -------------------------------------------------
            # STORE ONLY VALID CHUNKS
            # -------------------------------------------------

            valid_chunks_for_page = 0

            for chunk_index, chunk in enumerate(
                chunks
            ):

                chunk = chunk.strip()

                if not chunk:
                    continue

                record = {
                    "text": chunk,
                    "document": document_name,
                    "page": page_number,
                    "chunk_index": chunk_index,
                    "global_chunk_index": global_chunk_index,
                    "well_id": well_id,
                    "depths": depths,
                    "formation": formation,
                    "events": events,
                    "historical_problem_intervals": (
                        historical_problem_intervals
                    )
                }

                # Store chunk
                all_chunks.append(
                    chunk
                )

                # Store metadata
                metadata_records.append(
                    record
                )

                global_chunk_index += 1

                valid_chunks_for_page += 1

            document_chunk_count += (
                valid_chunks_for_page
            )

        # =====================================================
        # PER-DOCUMENT STATISTICS
        # =====================================================

        document_statistics.append(
            {
                "file_name": pdf_path.name,
                "pages": document_page_count,
                "chunks": document_chunk_count,
                "embeddings": 0
            }
        )

        print(
            "\nDocument statistics:"
        )

        print(
            f"  Pages      : "
            f"{document_page_count}"
        )

        print(
            f"  Chunks     : "
            f"{document_chunk_count}"
        )

    # =========================================================
    # VALIDATION
    # =========================================================

    print("\n" + "=" * 60)
    print("VALIDATION")
    print("=" * 60)

    if not all_chunks:

        raise ValueError(
            "No valid chunks were created "
            "from the supplied PDFs."
        )

    if len(all_chunks) != len(
        metadata_records
    ):

        raise ValueError(
            "Number of chunks and metadata records "
            "do not match."
        )

    print(
        f"Total chunks: "
        f"{len(all_chunks)}"
    )

    print(
        f"Total metadata records: "
        f"{len(metadata_records)}"
    )

    # =========================================================
    # SAVE METADATA
    # =========================================================

    print(
        "\nSaving metadata..."
    )

    save_metadata(
        metadata_records
    )

    print(
        "✅ Metadata saved."
    )

    # =========================================================
    # EMBEDDINGS
    # =========================================================

    if progress_callback:

        for document in document_statistics:

            progress_callback(
                document["file_name"],
                "embedding"
            )

    print(
        "\nCreating embeddings..."
    )

    embedding_model = EmbeddingModel()

    embeddings = embedding_model.encode(
        all_chunks
    )

    print(
        f"Embeddings created: "
        f"{len(embeddings)}"
    )

    # =========================================================
    # EMBEDDING VALIDATION
    # =========================================================

    if len(embeddings) != len(
        all_chunks
    ):

        raise ValueError(
            "Number of embeddings does not "
            "match number of chunks."
        )

    # =========================================================
    # UPDATE PER-DOCUMENT EMBEDDING COUNTS
    # =========================================================

    for document in document_statistics:

        document["embeddings"] = (
            document["chunks"]
        )

    # =========================================================
    # FAISS INDEX
    # =========================================================

    if progress_callback:

        for document in document_statistics:

            progress_callback(
                document["file_name"],
                "indexing"
            )

    print(
        "\nCreating new FAISS index..."
    )

    # ---------------------------------------------------------
    # Get embedding dimension
    # ---------------------------------------------------------

    dimension = (
        embedding_model
        .model
        .get_embedding_dimension()
    )

    print(
        f"Embedding dimension: {dimension}"
    )

    # ---------------------------------------------------------
    # IMPORTANT:
    #
    # Creating a NEW FAISSStore here means the old index
    # is NOT reused.
    #
    # Therefore every ingestion completely rebuilds
    # the vector index from the currently supplied PDFs.
    # ---------------------------------------------------------

    vector_store = FAISSStore(
        dimension
    )

    # ---------------------------------------------------------
    # Add all embeddings
    # ---------------------------------------------------------

    vector_store.add(
        embeddings
    )

    print(
        f"Vectors stored: "
        f"{vector_store.count()}"
    )

    # ---------------------------------------------------------
    # Validate FAISS count
    # ---------------------------------------------------------

    if vector_store.count() != len(
        all_chunks
    ):

        raise ValueError(
            "FAISS vector count does not "
            "match chunk count."
        )

    # ---------------------------------------------------------
    # Save FAISS index
    # ---------------------------------------------------------

    vector_store.save()

    print(
        "✅ FAISS index saved."
    )

    # =========================================================
    # COMPLETED
    # =========================================================

    if progress_callback:

        for document in document_statistics:

            progress_callback(
                document["file_name"],
                "processed"
            )

    print("\n" + "=" * 60)
    print("INGESTION COMPLETED")
    print("=" * 60)

    print(
        f"PDF files       : "
        f"{len(pdf_files)}"
    )

    print(
        f"Chunks          : "
        f"{len(all_chunks)}"
    )

    print(
        f"Embeddings      : "
        f"{len(embeddings)}"
    )

    print(
        f"Metadata records: "
        f"{len(metadata_records)}"
    )

    print(
        f"FAISS vectors   : "
        f"{vector_store.count()}"
    )

    print("=" * 60)

    # =========================================================
    # RETURN RESULT
    # =========================================================

    return {
        "pdf_files": len(pdf_files),

        "chunks": len(all_chunks),

        "embeddings": len(embeddings),

        "metadata_records": len(
            metadata_records
        ),

        "faiss_vectors": vector_store.count(),

        "documents": document_statistics
    }