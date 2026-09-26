from pathlib import Path

from backend.ai.rag.pipeline.ingest_pipeline import ingest_documents


# backend folder
BASE_DIR = Path(__file__).resolve().parents[2]

# PDF reports folder
REPORTS_DIR = BASE_DIR / "data" / "raw" / "reports"


def main():

    print("=" * 60)
    print("NWIS RAG DOCUMENT INGESTION")
    print("=" * 60)

    print(f"\nReports folder: {REPORTS_DIR}")

    pdf_files = list(REPORTS_DIR.glob("*.pdf"))

    if not pdf_files:

        print("\n❌ No PDF files found.")

        return

    print(f"\n✅ Found {len(pdf_files)} PDF file(s).")

    for pdf in pdf_files:
        print(f"   • {pdf.name}")

    # Ingest ALL PDFs together
    ingest_documents(pdf_files)


if __name__ == "__main__":
    main()