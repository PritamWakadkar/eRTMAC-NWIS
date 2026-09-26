import re


def clean_text(text):

    # Remove unnecessary spaces
    text = re.sub(r"\s+", " ", text)

    # Remove leading/trailing spaces
    text = text.strip()

    return text