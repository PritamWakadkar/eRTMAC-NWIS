from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class DocumentMetadata:
    """
    Metadata extracted from an uploaded drilling document.
    """

    document_id: str
    file_name: str

    well_id: Optional[str] = None
    document_type: Optional[str] = None

    page_count: int = 0
    chunk_count: int = 0
    embedding_count: int = 0

    status: str = "uploaded"

    created_at: datetime = field(
        default_factory=datetime.utcnow
    )

    processed_at: Optional[datetime] = None

    error_message: Optional[str] = None


@dataclass
class DocumentProcessingResult:
    """
    Result returned after document processing.
    """

    success: bool

    document_id: str
    file_name: str

    status: str

    well_id: Optional[str] = None
    document_type: Optional[str] = None

    page_count: int = 0
    chunk_count: int = 0
    embedding_count: int = 0

    message: str = ""

    error_message: Optional[str] = None