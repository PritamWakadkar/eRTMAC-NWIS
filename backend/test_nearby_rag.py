from backend.nearby_rag import NearbyWellRAG


def main():

    print("=" * 70)
    print("NWIS NEARBY WELL RAG TEST")
    print("=" * 70)

    # ------------------------------------------------------------
    # CREATE RAG SYSTEM
    # ------------------------------------------------------------

    rag = NearbyWellRAG()

    # ------------------------------------------------------------
    # TARGET WELL
    # ------------------------------------------------------------

    well_id = "W104"

    print("\nTarget Well:")
    print(well_id)

    # ------------------------------------------------------------
    # RUN ANALYSIS
    # ------------------------------------------------------------

    result = rag.analyze(
        well_id=well_id,
        radius_km=10,
        depth_tolerance=200
    )

    # ------------------------------------------------------------
    # STRUCTURED PYTHON SUMMARY
    # ------------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("STRUCTURED EVIDENCE SUMMARY")
    print("=" * 70)

    print(
        result.get(
            "structured_summary",
            "No structured summary generated."
        )
    )

    # ------------------------------------------------------------
    # AI SUMMARY
    # ------------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("AI SUMMARY — OPTIONAL")
    print("=" * 70)

    print(
        result.get(
            "ai_summary",
            "No AI summary generated."
        )
    )

    # ------------------------------------------------------------
    # RAW EVIDENCE
    # ------------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("RAW EVIDENCE CONTEXT")
    print("=" * 70)

    print(
        result.get(
            "evidence_context",
            "No evidence context."
        )
    )


if __name__ == "__main__":

    main()