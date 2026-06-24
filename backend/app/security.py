"""Password hashing and session-cookie signing.

Uses only the standard library for password hashing (PBKDF2-HMAC-SHA256) to
avoid fragile native dependencies in the container, and ``itsdangerous`` to
sign the session cookie with ``SESSION_SECRET``.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .config import settings

_PBKDF2_ROUNDS = 240_000
_SALT_BYTES = 16

_serializer = URLSafeTimedSerializer(settings.session_secret, salt="prelegal-session")


def hash_password(password: str) -> tuple[str, str]:
    """Return ``(salt_hex, hash_hex)`` for a new password."""
    salt = secrets.token_hex(_SALT_BYTES)
    return salt, _derive(password, salt)


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    """Constant-time check of ``password`` against a stored salt and hash."""
    return hmac.compare_digest(_derive(password, salt), expected_hash)


def _derive(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), _PBKDF2_ROUNDS
    ).hex()


def create_session_token(user_id: int) -> str:
    """Create a signed, timestamped token carrying the user id."""
    return _serializer.dumps({"user_id": user_id})


def read_session_token(token: str) -> int | None:
    """Return the user id from a valid token, or ``None`` if invalid/expired."""
    try:
        data = _serializer.loads(token, max_age=settings.session_max_age)
    except (BadSignature, SignatureExpired):
        return None
    user_id = data.get("user_id")
    return user_id if isinstance(user_id, int) else None
