import json

from ..config import CHUNKS_DIR


METADATA_FILE = CHUNKS_DIR / "metadata.json"


def save_metadata(metadata):

    with open(
        METADATA_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metadata,
            file,
            indent=4,
            ensure_ascii=False
        )


def load_metadata():

    if not METADATA_FILE.exists():

        return []

    with open(
        METADATA_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)