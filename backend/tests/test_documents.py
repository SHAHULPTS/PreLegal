from __future__ import annotations

from fastapi.testclient import TestClient

from app import documents

SUPPORTED = {"mutual-nda", "data-processing-agreement", "pilot-agreement", "cloud-service-agreement"}


def test_registry_lists_supported_documents() -> None:
    ids = {doc.id for doc in documents.list_documents()}
    assert ids == SUPPORTED


def test_templates_resolve_and_load() -> None:
    for doc in documents.list_documents():
        markdown = documents.template_markdown(doc.id)
        assert markdown.strip(), f"empty template for {doc.id}"


def test_build_fields_model_select_uses_first_option_default() -> None:
    model = documents.build_fields_model("mutual-nda")
    instance = model()
    dumped = instance.model_dump()
    assert dumped["mndaTermType"] == "fixed"  # first select option
    assert dumped["purpose"] == ""  # text default


def test_empty_values_covers_every_field() -> None:
    spec = documents.get_document("pilot-agreement")
    assert spec is not None
    values = documents.empty_values("pilot-agreement")
    assert set(values) == {field.key for field in spec.fields}


def test_list_documents_endpoint(client: TestClient) -> None:
    response = client.get("/api/documents")
    assert response.status_code == 200
    ids = {doc["id"] for doc in response.json()}
    assert ids == SUPPORTED


def test_get_document_returns_spec_and_template(client: TestClient) -> None:
    response = client.get("/api/documents/mutual-nda")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "mutual-nda"
    assert body["name"] == "Mutual Non-Disclosure Agreement"
    assert any(field["key"] == "purpose" for field in body["fields"])
    assert "Standard Terms" in body["template"]


def test_get_unknown_document_404(client: TestClient) -> None:
    assert client.get("/api/documents/nope").status_code == 404
