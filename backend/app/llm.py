"""AI chat backend for the multi-document intake conversation.

Uses LiteLLM to call OpenRouter's ``gpt-oss-120b`` with Cerebras as the
inference provider (per the project's AI design), requesting Structured Outputs
so the assistant's reply and any extracted fields come back together.

The conversation runs in two phases:

1. **Document selection** — until a document is chosen, the assistant helps the
   user pick one of the supported documents, or (for an unsupported request)
   explains we can't generate it and suggests the closest supported match. It
   sets ``documentType`` once the user settles on a document.
2. **Field extraction** — once a document is chosen, the assistant collects that
   document's fields (see :mod:`app.documents`) over the chat.
"""

from __future__ import annotations

import os

from litellm import completion
from pydantic import BaseModel, create_model

from . import documents
from .config import settings
from .schemas import ChatMessage, ChatResult

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class DocumentChoice(BaseModel):
    """Structured output for the document-selection phase."""

    reply: str
    documentType: str = ""


SELECT_SYSTEM_PROMPT = """\
You are a friendly legal intake assistant for PreLegal. You help users draft a \
legal agreement by chatting with them instead of filling in a form.

Your first job is to work out which document the user needs. These are the \
documents you can generate:

{catalog}

Have a natural, concise, warm conversation. When the user's need clearly maps to \
one of the documents above, set `documentType` to that document's id and briefly \
confirm what you'll help them create. If the user asks for a document that is \
NOT in the list above, explain that you can't generate that one, then suggest \
the closest document you CAN generate from the list and ask if that works. Only \
set `documentType` once the user has settled on one of the supported ids; \
otherwise leave it as an empty string and keep helping them choose.

Put your message to the user in `reply`. Never put ids or JSON in `reply`."""

EXTRACT_SYSTEM_PROMPT = """\
You are a friendly legal intake assistant for PreLegal, helping the user fill in \
a {name} by chatting with them.

{description}

Have a natural conversation. Ask about the agreement and the people involved, a \
few questions at a time — never dump every question at once. Briefly explain \
terms if the user seems unsure. Be concise and warm.

You are collecting these fields:
{fields}

Rules:
- Never invent names, dates, addresses, amounts, or other specifics the user did \
not give.
- Convert any date the user mentions into ISO yyyy-mm-dd.
- For a "select" field, use exactly one of its listed option values.
- In every response, return the complete `fields` object reflecting everything \
known so far. Carry forward values already captured; only add or correct fields \
based on the latest message. Use "" for anything still unknown.
- Put your conversational message to the user in `reply`. Do not put JSON or \
field names in `reply`.
- Set `complete` to true only once every field needed for the document has been \
captured, and let the user know they can review the live preview and download \
the PDF."""


class LlmNotConfigured(RuntimeError):
    """Raised when no OpenRouter API key is available."""


class LlmError(RuntimeError):
    """Raised when the model call fails or returns unusable output."""


def run_chat(
    messages: list[ChatMessage], document_type: str, fields: dict[str, str]
) -> ChatResult:
    """Run one chat turn and return the assistant reply plus any extracted state."""
    _ensure_api_key()

    if documents.is_supported(document_type):
        return _run_extract(messages, document_type, fields)
    return _run_select(messages)


def _run_select(messages: list[ChatMessage]) -> ChatResult:
    choice = _complete(
        system=SELECT_SYSTEM_PROMPT.format(catalog=_catalog_block()),
        messages=messages,
        response_format=DocumentChoice,
        model_cls=DocumentChoice,
    )
    document_type = choice.documentType if documents.is_supported(choice.documentType) else ""
    fields = documents.empty_values(document_type) if document_type else {}
    return ChatResult(reply=choice.reply, documentType=document_type, fields=fields)


def _run_extract(
    messages: list[ChatMessage], document_type: str, fields: dict[str, str]
) -> ChatResult:
    spec = documents.get_document(document_type)
    assert spec is not None  # guarded by is_supported in run_chat
    fields_model = documents.build_fields_model(document_type)
    turn_model = create_model(
        "ChatTurn",
        reply=(str, ...),
        fields=(fields_model, ...),
        complete=(bool, False),
    )

    known = {**documents.empty_values(document_type), **fields}
    turn = _complete(
        system=EXTRACT_SYSTEM_PROMPT.format(
            name=spec.name,
            description=spec.description,
            fields=_fields_block(document_type),
        ),
        messages=messages,
        response_format=turn_model,
        model_cls=turn_model,
        extra_system="Current known fields (JSON):\n"
        + fields_model.model_validate(known).model_dump_json(),
    )

    merged = _merge_fields(known, turn.fields.model_dump())
    return ChatResult(
        reply=turn.reply, documentType=document_type, fields=merged, complete=bool(turn.complete)
    )


def _complete(
    *,
    system: str,
    messages: list[ChatMessage],
    response_format: type[BaseModel],
    model_cls: type[BaseModel],
    extra_system: str | None = None,
):
    built: list[dict[str, str]] = [{"role": "system", "content": system}]
    if extra_system:
        built.append({"role": "system", "content": extra_system})
    built.extend({"role": m.role, "content": m.content} for m in messages)

    try:
        response = completion(
            model=MODEL,
            messages=built,
            response_format=response_format,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
        )
        content = response.choices[0].message.content
        return model_cls.model_validate_json(content)
    except Exception as exc:  # noqa: BLE001 — surface any LiteLLM/parse failure
        raise LlmError(str(exc)) from exc


def _ensure_api_key() -> None:
    key = os.environ.get("OPENROUTER_API_KEY") or settings.openrouter_api_key
    if not key:
        raise LlmNotConfigured("OPENROUTER_API_KEY is not set.")
    os.environ.setdefault("OPENROUTER_API_KEY", key)


def _catalog_block() -> str:
    return "\n".join(
        f"- id: {doc.id} — {doc.name}: {doc.description}" for doc in documents.list_documents()
    )


def _fields_block(document_type: str) -> str:
    spec = documents.get_document(document_type)
    assert spec is not None
    lines: list[str] = []
    for field in spec.fields:
        parts = [f"- {field.key} ({field.type}): {field.label}"]
        if field.hint:
            parts.append(f"— {field.hint}")
        if field.type == "select" and field.options:
            opts = ", ".join(f'"{o.value}" ({o.label})' for o in field.options)
            parts.append(f"[options: {opts}]")
        lines.append(" ".join(parts))
    return "\n".join(lines)


def _merge_fields(current: dict[str, str], returned: dict[str, str]) -> dict[str, str]:
    """Prefer the model's non-empty values, keeping prior ones it left blank."""
    merged = dict(current)
    for key, value in returned.items():
        if str(value).strip():
            merged[key] = value
    return merged
