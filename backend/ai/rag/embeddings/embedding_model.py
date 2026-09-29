from ..config import EMBEDDING_MODEL


class EmbeddingModel:

    def __init__(self):
        self._model = None

    def _get_model(self):
        if self._model is None:
            # Import here so PyTorch is not loaded at startup
            from sentence_transformers import SentenceTransformer

            print(f"Loading embedding model: {EMBEDDING_MODEL}")
            self._model = SentenceTransformer(EMBEDDING_MODEL)

        return self._model

    def encode(self, texts):
        embeddings = self._get_model().encode(
            texts,
            normalize_embeddings=True
        )

        return embeddings