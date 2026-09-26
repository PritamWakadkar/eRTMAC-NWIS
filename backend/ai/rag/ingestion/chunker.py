from ..config import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_text(text):
    """
    Split document text into overlapping word-based chunks.

    The chunker first tries to preserve paragraph/sentence boundaries
    before falling back to the configured word limit.
    """

    if not text or not text.strip():
        return []

    # Normalize whitespace
    text = " ".join(text.split())

    # Split into sentences while preserving the sentence text.
    sentences = []

    current = ""

    for part in text.replace("?", ".").replace("!", ".").split("."):
        part = part.strip()

        if not part:
            continue

        sentence = part + "."

        if current:
            candidate = current + " " + sentence
        else:
            candidate = sentence

        # Keep sentences together while possible.
        if len(candidate.split()) <= CHUNK_SIZE:
            current = candidate
        else:
            if current:
                sentences.append(current)

            current = sentence

    if current:
        sentences.append(current)

    # If the document is small, keep it as one chunk.
    if len(sentences) == 1:
        return sentences

    chunks = []
    current_chunk = []
    current_word_count = 0

    for sentence in sentences:
        sentence_words = sentence.split()
        sentence_length = len(sentence_words)

        # Sentence itself is larger than the chunk size.
        if sentence_length > CHUNK_SIZE:

            if current_chunk:
                chunks.append(
                    " ".join(current_chunk)
                )

                current_chunk = []
                current_word_count = 0

            words = sentence_words
            start = 0

            while start < len(words):

                end = start + CHUNK_SIZE

                chunk = " ".join(
                    words[start:end]
                )

                if chunk.strip():
                    chunks.append(chunk)

                start += max(
                    1,
                    CHUNK_SIZE - CHUNK_OVERLAP
                )

            continue

        # Adding the sentence would exceed the chunk size.
        if (
            current_word_count + sentence_length
            > CHUNK_SIZE
        ):

            if current_chunk:
                chunks.append(
                    " ".join(current_chunk)
                )

            # Keep overlap from previous chunk.
            overlap_words = []

            if CHUNK_OVERLAP > 0 and current_chunk:

                overlap_words = current_chunk[
                    -CHUNK_OVERLAP:
                ]

            current_chunk = (
                overlap_words + sentence_words
            )

            current_word_count = len(
                current_chunk
            )

        else:

            current_chunk.extend(
                sentence_words
            )

            current_word_count += (
                sentence_length
            )

    if current_chunk:
        chunks.append(
            " ".join(current_chunk)
        )

    return [
        chunk.strip()
        for chunk in chunks
        if chunk.strip()
    ]


if __name__ == "__main__":

    sample_text = """
    Well W104 was drilled in the Barail Formation.
    At 2410 m MD, partial mud loss was observed
    at an estimated 4–6 m³/hr.
    At 2465 m MD, torque increased from 9 kN·m
    to 14 kN·m.
    A short wiper trip was performed from
    2470 m to 2380 m MD.
    """

    chunks = chunk_text(sample_text)

    print("\nChunking Test")
    print("=" * 50)

    for index, chunk in enumerate(chunks, start=1):
        print(f"\nChunk {index}:")
        print(chunk)
        print(
            f"Words: {len(chunk.split())}"
        )

    print(
        f"\nTotal chunks: {len(chunks)}"
    )