from sentence_transformers import SentenceTransformer

from ..config import EMBEDDING_MODEL


class EmbeddingModel:

    def __init__(self):

        print(
            f"Loading embedding model: {EMBEDDING_MODEL}"
        )

        self.model = SentenceTransformer(
            EMBEDDING_MODEL
        )


    def encode(self, texts):

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True
        )

        return embeddings