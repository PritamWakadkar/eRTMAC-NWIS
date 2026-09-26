from backend.nlp.nlp_engine import NLPEngine


def main():

    engine = NLPEngine()

    question = (
        "What is the historical problem interval of W104?"
    )

    print("=" * 70)
    print("QUESTION:")
    print(question)
    print("=" * 70)

    result = engine.process(question)

    print("\nRESULT:")
    print(result)


if __name__ == "__main__":
    main()