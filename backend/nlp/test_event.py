from backend.nlp.nlp_engine import NLPEngine


def main():

    engine = NLPEngine()

    question = (
        "What mud loss events occurred around W105?"
    )

    print("=" * 70)
    print("QUESTION:")
    print(question)
    print("=" * 70)

    result = engine.process(
        question
    )

    print("\nRESULT:")

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

    print("\nEVENT RESULT:")

    event_result = result.get(
        "result"
    )

    print(
        event_result
    )


if __name__ == "__main__":
    main()