from __future__ import annotations

from fastapi.testclient import TestClient

CREDENTIALS = {"email": "alice@example.com", "password": "correct-horse"}


def test_signup_creates_user_and_sets_cookie(client: TestClient) -> None:
    response = client.post("/api/auth/signup", json=CREDENTIALS)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == CREDENTIALS["email"]
    assert "id" in body
    assert "password" not in body and "password_hash" not in body
    assert client.cookies.get("prelegal_session")


def test_signup_rejects_duplicate_email(client: TestClient) -> None:
    client.post("/api/auth/signup", json=CREDENTIALS)
    response = client.post("/api/auth/signup", json=CREDENTIALS)

    assert response.status_code == 409


def test_signup_rejects_short_password(client: TestClient) -> None:
    response = client.post(
        "/api/auth/signup", json={"email": "bob@example.com", "password": "short"}
    )

    assert response.status_code == 422


def test_signin_succeeds_with_correct_password(client: TestClient) -> None:
    client.post("/api/auth/signup", json=CREDENTIALS)
    client.cookies.clear()

    response = client.post("/api/auth/signin", json=CREDENTIALS)

    assert response.status_code == 200
    assert response.json()["email"] == CREDENTIALS["email"]
    assert client.cookies.get("prelegal_session")


def test_signin_fails_with_wrong_password(client: TestClient) -> None:
    client.post("/api/auth/signup", json=CREDENTIALS)

    response = client.post(
        "/api/auth/signin",
        json={"email": CREDENTIALS["email"], "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_signin_fails_for_unknown_user(client: TestClient) -> None:
    response = client.post("/api/auth/signin", json=CREDENTIALS)

    assert response.status_code == 401


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_returns_current_user_when_authenticated(client: TestClient) -> None:
    client.post("/api/auth/signup", json=CREDENTIALS)

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == CREDENTIALS["email"]


def test_logout_clears_session(client: TestClient) -> None:
    client.post("/api/auth/signup", json=CREDENTIALS)

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 204

    client.cookies.clear()
    assert client.get("/api/auth/me").status_code == 401
