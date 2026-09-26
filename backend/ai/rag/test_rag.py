from backend.ai.rag.pipeline.query_pipeline import RAGPipeline


def main():

    print("=" * 60)
    print("NWIS RAG AI ASSISTANT")
    print("=" * 60)

    rag = RAGPipeline()

    while True:

        question = input("\nAsk NWIS: ")

        if question.lower() in ["exit", "quit"]:
            print("\nExiting NWIS...")
            break

        try:

            response = rag.ask(question)

            print("\n")
            print("=" * 60)
            print("AI ANSWER")
            print("=" * 60)

            print(response.answer)

            print("\n")
            print("=" * 60)
            print("SOURCES")
            print("=" * 60)

            for source in response.sources:

                print(
                    f"""
Well: {source['well_id']}
Document: {source['document']}
Page: {source['page']}
Similarity: {source['score']:.4f}
"""
                )

        except Exception as e:

            print("\n❌ Error:")
            print(e)


if __name__ == "__main__":
    main()