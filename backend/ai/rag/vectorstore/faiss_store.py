import faiss
import numpy as np

from ..config import INDEX_DIR


# =========================================================
# FAISS Index File
# =========================================================

INDEX_FILE = INDEX_DIR / "faiss.index"


class FAISSStore:

    # =====================================================
    # Initialize
    # =====================================================

    def __init__(self, dimension):
        """
        Create an empty FAISS inner-product index.

        Args:
            dimension: Embedding vector dimension.
        """

        self.dimension = dimension

        self.index = faiss.IndexFlatIP(
            dimension
        )

    # =====================================================
    # Add Embeddings
    # =====================================================

    def add(self, embeddings):
        """
        Add embedding vectors to the FAISS index.

        Args:
            embeddings: List or NumPy array of embeddings.
        """

        embeddings = np.asarray(
            embeddings,
            dtype="float32"
        )

        # Validate dimensions
        if embeddings.ndim != 2:
            raise ValueError(
                "Embeddings must be a 2D array."
            )

        if embeddings.shape[1] != self.dimension:
            raise ValueError(
                f"Embedding dimension mismatch. "
                f"Expected {self.dimension}, "
                f"got {embeddings.shape[1]}."
            )

        # Do nothing for empty input
        if embeddings.shape[0] == 0:
            return

        self.index.add(
            embeddings
        )

    # =====================================================
    # Search
    # =====================================================

    def search(self, query_embedding, top_k=5):
        """
        Search the FAISS index.

        Args:
            query_embedding: Single embedding vector.
            top_k: Number of results to return.

        Returns:
            scores, indexes
        """

        # No vectors available
        if self.index.ntotal == 0:
            return (
                np.array([], dtype="float32"),
                np.array([], dtype="int64")
            )

        query_embedding = np.asarray(
            query_embedding,
            dtype="float32"
        )

        # Convert:
        #
        # [dimension]
        #
        # into:
        #
        # [1, dimension]

        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(
                1,
                -1
            )

        if query_embedding.ndim != 2:
            raise ValueError(
                "Query embedding must be a 1D or 2D array."
            )

        if query_embedding.shape[1] != self.dimension:
            raise ValueError(
                f"Query embedding dimension mismatch. "
                f"Expected {self.dimension}, "
                f"got {query_embedding.shape[1]}."
            )

        # Never request more vectors than actually exist
        top_k = min(
            int(top_k),
            self.index.ntotal
        )

        if top_k <= 0:
            return (
                np.array([], dtype="float32"),
                np.array([], dtype="int64")
            )

        scores, indexes = self.index.search(
            query_embedding,
            top_k
        )

        return (
            scores[0],
            indexes[0]
        )

    # =====================================================
    # Save Index
    # =====================================================

    def save(self):
        """
        Save the FAISS index to disk.
        """

        # Make sure the directory exists
        INDEX_DIR.mkdir(
            parents=True,
            exist_ok=True
        )

        faiss.write_index(
            self.index,
            str(INDEX_FILE)
        )

    # =====================================================
    # Load Index
    # =====================================================

    def load(self):
        """
        Load a previously saved FAISS index.
        """

        if not INDEX_FILE.exists():
            raise FileNotFoundError(
                "FAISS index does not exist. "
                "Run the ingestion pipeline first."
            )

        self.index = faiss.read_index(
            str(INDEX_FILE)
        )

        # Validate embedding dimension
        if self.index.d != self.dimension:
            raise ValueError(
                f"FAISS index dimension mismatch. "
                f"Expected {self.dimension}, "
                f"got {self.index.d}."
            )

    # =====================================================
    # Count
    # =====================================================

    def count(self):
        """
        Return the number of vectors currently
        stored in the FAISS index.
        """

        return self.index.ntotal

    # =====================================================
    # Clear Index
    # =====================================================

    def clear(self):
        """
        Clear the current FAISS index and remove
        the saved index from disk.
        """

        # Create a fresh empty index
        self.index = faiss.IndexFlatIP(
            self.dimension
        )

        # Delete saved FAISS index if it exists
        if INDEX_FILE.exists():
            INDEX_FILE.unlink()