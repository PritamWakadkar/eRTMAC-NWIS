from backend.nlp.query_parser import QueryParser


def main():

    parser = QueryParser()

    questions = [

        "What drilling events were observed near W104?",

        "What mud loss events occurred around W105?",

        "Was there any torque spike near 2500 m MD in W104?",

        "What is the formation of W104?",

        "What is the historical problem interval of W104?"

    ]

    for question in questions:

        print("=" * 70)

        print("QUESTION:")
        print(question)

        result = parser.parse(
            question
        )

        print("\nNLP RESULT:")

        for key, value in result.items():

            print(
                f"{key}: {value}"
            )


if __name__ == "__main__":

    main()
    