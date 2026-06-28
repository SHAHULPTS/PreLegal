from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import documents, llm
from app.schemas import ChatMessage, ChatResult

CREDENTIALS = {"email": "alice@example.com", "password": "correct-horse"}


def _sign_in(client: TestClient) -> None:
    client.post("/api/auth/signup", json=CREDENTIALS)


def test_chat_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/chat", json={"messages": []})
    assert response.status_code == 401


def test_chat_selects_a_document(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _sign_in(client)

    def fake_run_chat(messages, document_type, fields):  # noqa: ANN001
        return ChatResult(
            reply="Great — let's create a Mutual NDA.",
            documentType="mutual-nda",
            fields=documents.empty_values("mutual-nda"),
        )

    monkeypatch.setattr("app.routers.chat.run_chat", fake_run_chat)

    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "I need an NDA"}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] == "mutual-nda"
    assert "purpose" in body["fields"]


def test_chat_extracts_fields(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _sign_in(client)

    def fake_run_chat(messages, document_type, fields):  # noqa: ANN001
        return ChatResult(
            reply="Thanks! Which state's law should govern?",
            documentType="mutual-nda",
            fields={**fields, "governingLaw": "Delaware"},
        )

    monkeypatch.setattr("app.routers.chat.run_chat", fake_run_chat)

    response = client.post(
        "/api/chat",
        json={
            "messages": [{"role": "user", "content": "Use Delaware law"}],
            "documentType": "mutual-nda",
            "fields": {"purpose": "Evaluating a deal"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["fields"]["governingLaw"] == "Delaware"
    assert body["fields"]["purpose"] == "Evaluating a deal"


def test_chat_reports_when_not_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _sign_in(client)

    def boom(messages, document_type, fields):  # noqa: ANN001
        raise llm.LlmNotConfigured("missing key")

    monkeypatch.setattr("app.routers.chat.run_chat", boom)

    response = client.post("/api/chat", json={"messages": []})
    assert response.status_code == 503


def test_chat_reports_upstream_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _sign_in(client)

    def boom(messages, document_type, fields):  # noqa: ANN001
        raise llm.LlmError("upstream exploded")

    monkeypatch.setattr("app.routers.chat.run_chat", boom)

    response = client.post("/api/chat", json={"messages": []})
    assert response.status_code == 502


def test_merge_fields_prefers_new_but_keeps_prior() -> None:
    current = {"purpose": "Old purpose", "governingLaw": "Delaware"}
    returned = {"purpose": "", "governingLaw": "California", "jurisdiction": "LA, CA"}

    merged = llm._merge_fields(current, returned)

    assert merged["purpose"] == "Old purpose"  # blank in returned -> keep prior
    assert merged["governingLaw"] == "California"  # overwritten
    assert merged["jurisdiction"] == "LA, CA"  # newly added


def test_run_chat_routes_to_selection_then_extraction(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """run_chat picks the selection vs extraction phase by documentType."""
    monkeypatch.setattr(llm, "_ensure_api_key", lambda: None)
    calls: dict[str, bool] = {}

    def fake_select(messages):  # noqa: ANN001
        calls["select"] = True
        return ChatResult(reply="pick one", documentType="")

    def fake_extract(messages, document_type, fields):  # noqa: ANN001
        calls["extract"] = True
        return ChatResult(reply="extracting", documentType=document_type, fields=fields)

    monkeypatch.setattr(llm, "_run_select", fake_select)
    monkeypatch.setattr(llm, "_run_extract", fake_extract)

    msgs = [ChatMessage(role="user", content="hi")]
    llm.run_chat(msgs, "", {})
    llm.run_chat(msgs, "mutual-nda", {"purpose": "x"})
    llm.run_chat(msgs, "not-a-real-doc", {})  # unsupported -> selection phase

    assert calls == {"select": True, "extract": True}
