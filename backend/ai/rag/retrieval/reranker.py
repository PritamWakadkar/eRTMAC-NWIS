def rerank(results):
    """
    Currently sorts retrieved documents by
    semantic similarity score.

    Metadata-aware reranking will be added next.
    """

    results.sort(
        key=lambda x: x.get("score", 0),
        reverse=True
    )

    return results