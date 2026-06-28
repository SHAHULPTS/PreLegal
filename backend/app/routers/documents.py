"""Document catalog endpoints.

Exposes the supported documents (so the frontend can show what's available) and,
per document, its field spec + markdown template (so the frontend can render the
cover page of key terms and the standard terms).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from .. import documents
from ..documents import FieldSpec

router = APIRouter(prefix="/api/documents", tags=["documents"])


class DocumentSummary(BaseModel):
    id: str
    name: str
    description: str


class DocumentDetail(DocumentSummary):
    fields: list[FieldSpec]
    template: str


@router.get("", response_model=list[DocumentSummary])
def list_documents() -> list[DocumentSummary]:
    return [
        DocumentSummary(id=doc.id, name=doc.name, description=doc.description)
        for doc in documents.list_documents()
    ]


@router.get("/{doc_id}", response_model=DocumentDetail)
def get_document(doc_id: str) -> DocumentDetail:
    spec = documents.get_document(doc_id)
    if spec is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown document.")
    return DocumentDetail(
        id=spec.id,
        name=spec.name,
        description=spec.description,
        fields=spec.fields,
        template=documents.template_markdown(spec.id),
    )
