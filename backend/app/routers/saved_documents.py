"""Saved-document endpoints (auth required).

Lets a signed-in user store the documents they generate and re-open them later.
Every entry is scoped to the owning user; the temporary database means saved
documents are wiped whenever the server restarts (by design for V1).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import documents
from ..database import get_db
from ..models import SavedDocument, User
from ..schemas import SavedDocumentPublic, SavedDocumentSummary, SavedDocumentWrite
from .auth import get_current_user

router = APIRouter(prefix="/api/saved-documents", tags=["saved-documents"])


def _get_owned(db: Session, user: User, doc_id: int) -> SavedDocument:
    saved = db.get(SavedDocument, doc_id)
    if saved is None or saved.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Saved document not found."
        )
    return saved


def _validate_type(document_type: str) -> None:
    if not documents.is_supported(document_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown document type: {document_type}.",
        )


@router.get("", response_model=list[SavedDocumentSummary])
def list_saved(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[SavedDocument]:
    return list(
        db.scalars(
            select(SavedDocument)
            .where(SavedDocument.user_id == user.id)
            .order_by(SavedDocument.updated_at.desc())
        )
    )


@router.post("", response_model=SavedDocumentPublic, status_code=status.HTTP_201_CREATED)
def create_saved(
    payload: SavedDocumentWrite,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SavedDocument:
    _validate_type(payload.documentType)
    saved = SavedDocument(
        user_id=user.id,
        document_type=payload.documentType,
        title=payload.title,
        fields=payload.fields,
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved


@router.get("/{doc_id}", response_model=SavedDocumentPublic)
def get_saved(
    doc_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SavedDocument:
    return _get_owned(db, user, doc_id)


@router.put("/{doc_id}", response_model=SavedDocumentPublic)
def update_saved(
    doc_id: int,
    payload: SavedDocumentWrite,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SavedDocument:
    _validate_type(payload.documentType)
    saved = _get_owned(db, user, doc_id)
    saved.document_type = payload.documentType
    saved.title = payload.title
    saved.fields = payload.fields
    db.commit()
    db.refresh(saved)
    return saved


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved(
    doc_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    saved = _get_owned(db, user, doc_id)
    db.delete(saved)
    db.commit()
