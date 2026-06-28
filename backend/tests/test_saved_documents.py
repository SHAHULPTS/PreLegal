from __future__ import annotations

from fastapi.testclient import TestClient

ALICE = {"email": "alice@example.com", "password": "correct-horse"}
BOB = {"email": "bob@example.com", "password": "correct-horse-2"}

PAYLOAD = {
    "documentType": "mutual-nda",
    "title": "Acme / Beta NDA",
    "fields": {"purpose": "Evaluate a deal", "governingLaw": "Delaware"},
}


def _signup(client: TestClient, creds: dict) -> None:
    assert client.post("/api/auth/signup", json=creds).status_code == 201


def test_saved_documents_require_authentication(client: TestClient) -> None:
    assert client.get("/api/saved-documents").status_code == 401
    assert client.post("/api/saved-documents", json=PAYLOAD).status_code == 401


def test_create_list_get_and_delete(client: TestClient) -> None:
    _signup(client, ALICE)

    created = client.post("/api/saved-documents", json=PAYLOAD)
    assert created.status_code == 201
    body = created.json()
    assert body["documentType"] == "mutual-nda"
    assert body["fields"]["governingLaw"] == "Delaware"
    doc_id = body["id"]

    listed = client.get("/api/saved-documents").json()
    assert [d["id"] for d in listed] == [doc_id]
    assert listed[0]["title"] == "Acme / Beta NDA"
    assert "fields" not in listed[0]  # summary view omits fields

    fetched = client.get(f"/api/saved-documents/{doc_id}").json()
    assert fetched["fields"]["purpose"] == "Evaluate a deal"

    assert client.delete(f"/api/saved-documents/{doc_id}").status_code == 204
    assert client.get("/api/saved-documents").json() == []


def test_update_replaces_fields_and_title(client: TestClient) -> None:
    _signup(client, ALICE)
    doc_id = client.post("/api/saved-documents", json=PAYLOAD).json()["id"]

    updated = client.put(
        f"/api/saved-documents/{doc_id}",
        json={
            "documentType": "mutual-nda",
            "title": "Renamed NDA",
            "fields": {"governingLaw": "California"},
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["title"] == "Renamed NDA"
    assert body["fields"] == {"governingLaw": "California"}


def test_rejects_unknown_document_type(client: TestClient) -> None:
    _signup(client, ALICE)
    response = client.post(
        "/api/saved-documents",
        json={"documentType": "not-real", "title": "x", "fields": {}},
    )
    assert response.status_code == 400


def test_users_cannot_access_each_others_documents(client: TestClient) -> None:
    _signup(client, ALICE)
    doc_id = client.post("/api/saved-documents", json=PAYLOAD).json()["id"]

    # Switch to a different user (cookie is replaced on signup).
    _signup(client, BOB)
    assert client.get("/api/saved-documents").json() == []
    assert client.get(f"/api/saved-documents/{doc_id}").status_code == 404
    assert client.delete(f"/api/saved-documents/{doc_id}").status_code == 404
