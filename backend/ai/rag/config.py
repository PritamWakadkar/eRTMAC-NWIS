from pathlib import Path


# --------------------------------------------------
# Base directories
# --------------------------------------------------

RAG_DIR = Path(__file__).resolve().parent

STORAGE_DIR = RAG_DIR / "storage"

DOCUMENTS_DIR = STORAGE_DIR / "documents"

CHUNKS_DIR = STORAGE_DIR / "chunks"

INDEX_DIR = STORAGE_DIR / "index"


# --------------------------------------------------
# Model configuration
# --------------------------------------------------

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

LLM_MODEL = "llama3.2"


# --------------------------------------------------
# RAG configuration
# --------------------------------------------------

CHUNK_SIZE = 500

CHUNK_OVERLAP = 100

TOP_K = 5


# --------------------------------------------------
# Create directories
# --------------------------------------------------

DOCUMENTS_DIR.mkdir(
    parents=True,
    exist_ok=True
)

CHUNKS_DIR.mkdir(
    parents=True,
    exist_ok=True
)

INDEX_DIR.mkdir(
    parents=True,
    exist_ok=True
)