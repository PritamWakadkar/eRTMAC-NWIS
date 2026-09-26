from pathlib import Path

import fitz  # PyMuPDF


# ---------------------------------------------------------
# Project paths
# ---------------------------------------------------------

DOCUMENT_LOADER_DIR = Path(__file__).resolve().parent

RAG_DIR = DOCUMENT_LOADER_DIR.parent

BACKEND_DIR = RAG_DIR.parent.parent

REPORTS_DIR = (
    BACKEND_DIR
    / "data"
    / "raw"
    / "reports"
)


# ---------------------------------------------------------
# Load one PDF
# ---------------------------------------------------------

def load_pdf(pdf_path):
    """
    Load a single PDF and extract text page by page.

    Returns:
        list of dictionaries:
        [
            {
                "text": "...",
                "page": 1,
                "document": "W104_DDR.pdf"
            }
        ]
    """

    pdf_path = Path(pdf_path)

    if not pdf_path.exists():
        raise FileNotFoundError(
            f"PDF file not found: {pdf_path}"
        )

    if pdf_path.suffix.lower() != ".pdf":
        raise ValueError(
            f"Expected a PDF file, got: {pdf_path}"
        )

    documents = []

    with fitz.open(pdf_path) as pdf:

        for page_number, page in enumerate(
            pdf,
            start=1
        ):

            text = page.get_text("text")

            if not text:
                continue

            text = text.strip()

            if not text:
                continue

            documents.append(
                {
                    "text": text,
                    "page": page_number,
                    "document": pdf_path.name,
                }
            )

    return documents


# ---------------------------------------------------------
# Load all PDFs
# ---------------------------------------------------------

def load_documents(pdf_directory=None):
    """
    Load all PDF files from the reports directory.

    Returns:
        list of page-level document dictionaries.
    """

    if pdf_directory is None:
        pdf_directory = REPORTS_DIR

    pdf_directory = Path(pdf_directory)

    if not pdf_directory.exists():
        raise FileNotFoundError(
            f"PDF directory not found: {pdf_directory}"
        )

    if not pdf_directory.is_dir():
        raise ValueError(
            f"Expected a directory: {pdf_directory}"
        )

    pdf_files = sorted(
        pdf_directory.glob("*.pdf")
    )

    if not pdf_files:
        raise FileNotFoundError(
            f"No PDF files found in: {pdf_directory}"
        )

    documents = []

    for pdf_path in pdf_files:

        pages = load_pdf(pdf_path)

        documents.extend(pages)

    return documents


# ---------------------------------------------------------
# Get complete text from one PDF
# ---------------------------------------------------------

def get_pdf_text(pdf_path):
    """
    Extract complete text from one PDF.
    """

    pages = load_pdf(pdf_path)

    return "\n\n".join(
        page["text"]
        for page in pages
    )


# ---------------------------------------------------------
# Test
# ---------------------------------------------------------

if __name__ == "__main__":

    print("=" * 70)
    print("NWIS PDF DOCUMENT LOADER TEST")
    print("=" * 70)

    print(
        f"\nReports directory:\n"
        f"{REPORTS_DIR}"
    )

    documents = load_documents()

    print(
        f"\nTotal pages loaded: "
        f"{len(documents)}"
    )

    for document in documents:

        print("\n" + "-" * 70)

        print(
            f"Document: "
            f"{document['document']}"
        )

        print(
            f"Page: "
            f"{document['page']}"
        )

        print(
            f"Characters: "
            f"{len(document['text'])}"
        )

        print("\nText preview:")

        print(
            document["text"][:500]
        )