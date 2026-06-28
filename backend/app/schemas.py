"""Pydantic request/response models for the API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Credentials(BaseModel):
    """Sign up / sign in payload."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserPublic(BaseModel):
    """User fields safe to return to clients."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime


# ---------------------------------------------------------------------------
# AI chat — multi-document intake
# ---------------------------------------------------------------------------
# The chat runs in two phases. Until a ``documentType`` is chosen, the assistant
# helps the user pick a supported document (or suggests the closest match for an
# unsupported request). Once chosen, it extracts that document's fields. Fields
# are a flat ``{key: value}`` map matching the document's spec (see
# ``app.documents``); empty strings mean "not yet known".


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    documentType: str = ""
    fields: dict[str, str] = Field(default_factory=dict)


class ChatResult(BaseModel):
    """Assistant turn (also the API response shape)."""

    reply: str
    documentType: str = ""
    fields: dict[str, str] = Field(default_factory=dict)
    complete: bool = False
