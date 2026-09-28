"""
Extract drilling parameters from a report and store them.

    python -m backend.prediction.extract_parameters path/to/W101_DDR.pdf --well W101
    python -m backend.prediction.extract_parameters path/to/W101_DDR.pdf --well W101 --dry-run

--dry-run prints what would be stored without touching the database.
Scanned PDFs: run your OCR step first and call
parameter_extractor.extract_parameters(well_id, document, pages) yourself.
"""

import argparse

from .parameter_extractor import extract_parameters, pages_from_pdf
from .parameter_store import save_parameters


def run(pdf_path, well_id, dry_run=False):

    pages = pages_from_pdf(pdf_path)

    if not any(text.strip() for _, text in pages):
        print("No text layer found (scanned PDF?). Use OCR first.")
        return []

    rows = extract_parameters(well_id, pdf_path, pages)

    print(f"Found {len(rows)} parameter values.")

    for row in rows[:25]:
        print(
            f"  {row['parameter']:16} {row['value']:>10} "
            f"@ {row['depth_m']} m  (p.{row['source_page']})  "
            f"'{row['original_text']}'"
        )

    if len(rows) > 25:
        print(f"  ... and {len(rows) - 25} more")

    if not dry_run and rows:
        save_parameters(rows)
        print("Saved to drilling_parameters.")

    return rows


if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument("pdf")
    parser.add_argument("--well", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    run(args.pdf, args.well, args.dry_run)