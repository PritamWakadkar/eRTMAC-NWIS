class RAGResponse:

    def __init__(
        self,
        answer,
        sources
    ):

        self.answer = answer

        self.sources = sources


    def to_dict(self):

        return {
            "answer": self.answer,
            "sources": self.sources
        }