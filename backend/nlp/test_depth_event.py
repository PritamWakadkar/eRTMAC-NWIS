from backend.nlp.nlp_engine import NLPEngine


def main():

    engine = NLPEngine()

    question = (
        "Was there any torque spike "
        "near 2465 m MD in W104?"
    )

    print("=" * 70)
    print("QUESTION:")
    print(question)
    print("=" * 70)

    result = engine.process(
        question=question
    )

    print("\nRESULT:")

    print(result)


if __name__ == "__main__":
    main()