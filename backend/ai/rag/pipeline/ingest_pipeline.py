from pathlib import Path

from ..ingestion.document_loader import load_pdf
from ..ingestion.text_cleaner import clean_text
from ..ingestion.chunker import chunk_text
from ..ingestion.metadata_extractor import extract_metadata

from ..config import CHUNKS_DIR

from ..vectorstore.metadata import save_metadata
from ..embeddings.embedding_model import EmbeddingModel
from ..vectorstore.faiss_store import FAISSStore


# ============================================================
# INGEST DOCUMENTS
# ============================================================

def ingest_documents(pdf_files):
    """
    Ingest the supplied PDF files into the NWIS RAG system.

    Pipeline:

        PDF
         ↓
        PDF text extraction
         ↓
        Text cleaning
         ↓
        Metadata extraction
         ↓
        Chunking
         ↓
        Embeddings
         ↓
        FAISS
         ↓
        metadata.json
    """

    print("\n" + "=" * 60)
    print("NWIS RAG DOCUMENT INGESTION")
    print("=" * 60)

    # --------------------------------------------------------
    # Validate PDF list
    # --------------------------------------------------------

    if not pdf_files:
        raise ValueError(
            "No PDF files were supplied for ingestion."
        )

    print(
        f"\nProcessing {len(pdf_files)} PDF file(s)."
    )

    # --------------------------------------------------------
    # Prepare storage
    # --------------------------------------------------------

    CHUNKS_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    all_chunks = []
    metadata_records = []

    global_chunk_index = 0

    # ========================================================
    # PROCESS EACH PDF
    # ========================================================

    for pdf_path in pdf_files:

        pdf_path = Path(pdf_path)

        print("\n" + "-" * 60)
        print(
            f"Processing: {pdf_path.name}"
        )
        print("-" * 60)

        # ----------------------------------------------------
        # Load PDF page by page
        # ----------------------------------------------------

        pages = load_pdf(
            pdf_path
        )

        if not pages:
            print(
                "⚠️ No text found in this PDF."
            )
            continue

        # ----------------------------------------------------
        # Process each page
        # ----------------------------------------------------

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

            if not raw_text.strip():
                continue

            # ------------------------------------------------
            # Clean text
            # ------------------------------------------------

            cleaned_text = clean_text(
                raw_text
            )

            if not cleaned_text.strip():
                continue

            # ------------------------------------------------
            # Extract metadata
            # ------------------------------------------------

            metadata = extract_metadata(
                cleaned_text,
                document_name
            )

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

            historical_problem_intervals = (
                metadata.get(
                    "historical_problem_intervals",
                    []
                )
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

            # ------------------------------------------------
            # Print events for verification
            # ------------------------------------------------

            for event in events:

                print(
                    f"  • {event.get('event')}"
                    f" | {event.get('depth')}"
                )

                print(
                    f"    Evidence: "
                    f"{event.get('evidence')}"
                )

            # ------------------------------------------------
            # Chunk text
            # ------------------------------------------------

            chunks = chunk_text(
                cleaned_text
            )

            print(
                f"Chunks created: {len(chunks)}"
            )

            # ------------------------------------------------
            # Store chunks + metadata
            # ------------------------------------------------

            for chunk_index, chunk in enumerate(
                chunks
            ):

                chunk = chunk.strip()

                if not chunk:
                    continue

                record = {
                    "text": chunk,

                    "document":
                        document_name,

                    "page":
                        page_number,

                    "chunk_index":
                        chunk_index,

                    "global_chunk_index":
                        global_chunk_index,

                    "well_id":
                        well_id,

                    "depths":
                        depths,

                    "formation":
                        formation,

                    # Keep each event as an
                    # individual structured object.
                    "events":
                        events,

                    # Only explicitly extracted
                    # intervals are stored.
                    "historical_problem_intervals":
                        historical_problem_intervals
                }

                all_chunks.append(
                    chunk
                )

                metadata_records.append(
                    record
                )

                global_chunk_index += 1

    # ========================================================
    # VALIDATION
    # ========================================================

    print("\n" + "=" * 60)
    print("VALIDATION")
    print("=" * 60)

    if not all_chunks:
        raise ValueError(
            "No chunks were created from the supplied PDFs."
        )

    if len(all_chunks) != len(
        metadata_records
    ):
        raise ValueError(
            "Number of chunks and metadata records do not match."
        )

    print(
        f"Total chunks: "
        f"{len(all_chunks)}"
    )

    print(
        f"Total metadata records: "
        f"{len(metadata_records)}"
    )

    # ========================================================
    # SAVE METADATA
    # ========================================================

    print("\nSaving metadata...")

    save_metadata(
        metadata_records
    )

    print(
        "✅ Metadata saved."
    )

    # ========================================================
    # CREATE EMBEDDINGS
    # ========================================================

    print("\nCreating embeddings...")

    embedding_model = EmbeddingModel()

    embeddings = embedding_model.encode(
        all_chunks
    )

    print(
        f"Embeddings created: "
        f"{len(embeddings)}"
    )

    # ========================================================
    # CREATE FAISS INDEX
    # ========================================================

    print("\nCreating FAISS index...")

    dimension = (
        embedding_model.model
        .get_embedding_dimension()
    )

    vector_store = FAISSStore(
        dimension
    )

    # IMPORTANT:
    # FAISSStore uses add(), not build().

    vector_store.add(
        embeddings
    )

    print(
        f"Vectors stored: "
        f"{vector_store.count()}"
    )

    vector_store.save()

    print(
        "✅ FAISS index saved."
    )

    # ========================================================
    # FINAL SUMMARY
    # ========================================================

    print("\n" + "=" * 60)
    print("INGESTION COMPLETED")
    print("=" * 60)

    print(
        f"PDF files       : {len(pdf_files)}"
    )

    print(
        f"Chunks          : {len(all_chunks)}"
    )

    print(
        f"Embeddings      : {len(embeddings)}"
    )

    print(
        f"Metadata records: {len(metadata_records)}"
    )

    print(
        f"FAISS vectors   : {vector_store.count()}"
    )

    print("=" * 60)

    return {
        "pdf_files": len(pdf_files),
        "chunks": len(all_chunks),
        "embeddings": len(embeddings),
        "metadata_records": len(metadata_records),
        "faiss_vectors": vector_store.count()
    }