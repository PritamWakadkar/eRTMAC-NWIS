import re

from ..config import TOP_K
from ..vectorstore.faiss_store import FAISSStore
from ..vectorstore.metadata import load_metadata


class Retriever:

    def __init__(self, embedding_model):

        self.embedding_model = embedding_model

        # -------------------------------------------------
        # Load metadata
        # -------------------------------------------------

        self.metadata = load_metadata()

        if not self.metadata:
            raise ValueError(
                "No metadata found. Run ingestion first."
            )

        # -------------------------------------------------
        # Get embedding dimension
        # -------------------------------------------------

        dimension = (
            embedding_model.model.get_embedding_dimension()
        )

        # -------------------------------------------------
        # Create FAISS store
        # -------------------------------------------------

        self.vector_store = FAISSStore(dimension)

        # -------------------------------------------------
        # Load saved FAISS index
        # -------------------------------------------------

        self.vector_store.load()

    # =====================================================
    # Extract Well ID
    # =====================================================

    def extract_well_id(self, question):

        match = re.search(
            r"\bW\d+\b",
            question,
            flags=re.IGNORECASE
        )

        if match:

            return match.group(0).upper()

        return None

    # =====================================================
    # Extract Depth
    # =====================================================

    def extract_depth(self, question):
        """
        Extract a single drilling depth from the question.

    Supports:
        2580 m MD
        2580m MD
        2580 m
        """

        match = re.search(
            r"\b(\d+(?:\.\d+)?)\s*m\s*MD\b",
            question,
            flags=re.IGNORECASE
        )

        if match:

            return float(
                match.group(1)
            )

        return None

    # =====================================================
    # Search
    # =====================================================

    def search(self, question, top_k=TOP_K):

        # -------------------------------------------------
        # 1. Extract metadata constraints
        # -------------------------------------------------

        requested_well = self.extract_well_id(
            question
        )

        requested_depth = self.extract_depth(
            question
        )

        print(
            f"\nDetected Well: {requested_well}"
        )

        print(
            f"Detected Depth: {requested_depth}"
        )

        # -------------------------------------------------
        # 2. Determine candidate metadata
        # -------------------------------------------------

        candidates = self.metadata

        # -------------------------------------------------
        # Filter by Well ID
        # -------------------------------------------------

        if requested_well:

            well_candidates = [

                item

                for item in self.metadata

                if item.get("well_id") == requested_well

            ]

            if well_candidates:

                candidates = well_candidates

        # -------------------------------------------------
        # 3. Filter/prioritize by depth
        # -------------------------------------------------

        if requested_depth is not None:

            depth_candidates = []

            for item in candidates:

                depths = item.get(
                    "depths",
                    []
                )

                # Check whether requested depth is
                # explicitly present in metadata.

                if any(
                    abs(float(depth) - requested_depth) <= 20
                    for depth in depths
                ):

                    depth_candidates.append(item)

            if depth_candidates:

                candidates = depth_candidates

        # -------------------------------------------------
        # 4. If metadata filtering found candidates,
        #    search only those candidates semantically.
        # -------------------------------------------------

        if candidates:

            candidate_indexes = []

            metadata_ids = {
                id(item): index
                for index, item in enumerate(
                    self.metadata
                )
            }

            for item in candidates:

                candidate_indexes.append(
                    metadata_ids[id(item)]
                )

        else:

            candidate_indexes = list(
                range(len(self.metadata))
            )

        # -------------------------------------------------
        # 5. Convert question into embedding
        # -------------------------------------------------

        query_embedding = (
            self.embedding_model.encode(
                [question]
            )[0]
        )

        # -------------------------------------------------
        # 6. Search FAISS
        #
        # Search more results than TOP_K because we
        # will filter them afterward.
        # -------------------------------------------------

        search_k = max(
            top_k,
            len(self.metadata)
        )

        scores, indexes = (
            self.vector_store.search(
                query_embedding,
                search_k
            )
        )

        # -------------------------------------------------
        # 7. Combine FAISS results with metadata
        #    while respecting metadata filters
        # -------------------------------------------------

        results = []

        candidate_set = set(
            candidate_indexes
        )

        for score, index in zip(
            scores,
            indexes
        ):

            if index < 0:
                continue

            if index >= len(
                self.metadata
            ):
                continue

            # Ignore documents that don't satisfy
            # the detected well/depth constraint.

            if index not in candidate_set:
                continue

            result = self.metadata[
                index
            ].copy()

            result["score"] = float(
                score
            )

            results.append(
                result
            )

            # Stop after TOP_K relevant results.

            if len(results) >= top_k:
                break

        # -------------------------------------------------
        # 8. Return results
        # -------------------------------------------------

        return results