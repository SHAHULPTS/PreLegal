"""AI chat endpoint for the multi-document intake conversation (auth required)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..llm import LlmError, LlmNotConfigured, run_chat
from ..models import User
from ..schemas import ChatRequest, ChatResult
from .auth import get_current_user

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResult)
def chat(
    request: ChatRequest, _user: User = Depends(get_current_user)
) -> ChatResult:
    try:
        return run_chat(request.messages, request.documentType, request.fields)
    except LlmNotConfigured as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI chat is not configured (missing OPENROUTER_API_KEY).",
        ) from exc
    except LlmError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service could not complete the request. Please retry.",
        ) from exc
