from backend.nlp.nlp_engine import NLPEngine


def main():

    engine = NLPEngine()

    question = (
        "What drilling events were observed "
        "near W104?"
    )

    print("=" * 70)

    print("USER QUESTION:")
    print(question)

    print("=" * 70)

    result = engine.process(
        question=question,
        radius_km=10,
        depth_tolerance=200
    )

    print("\nNLP ENGINE RESULT:")

    print(
        "Success:",
        result.get("success")
    )

    print(
        "Route:",
        result.get("route")
    )

    print(
        "Query:",
        result.get("query")
    )

    print("\nRAG RESULT:")

    rag_result = result.get(
        "result"
    )

    if rag_result:

        print(
            rag_result.get(
                "structured_summary"
            )
        )


if __name__ == "__main__":

    main()