"""Authentication endpoints: sign up, sign in, sign out, and current user.

These exercise the temporary users table end-to-end. No frontend auth UI ships
in this foundation milestone; these are the backend plumbing for it.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import Credentials, UserPublic
from ..security import (
    create_session_token,
    hash_password,
    read_session_token,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_session_cookie(response: Response, user_id: int) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=create_session_token(user_id),
        max_age=settings.session_max_age,
        httponly=True,
        samesite="lax",
    )


def get_current_user(
    db: Session = Depends(get_db),
    session: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> User:
    """Dependency resolving the signed session cookie to a ``User``."""
    user_id = read_session_token(session) if session else None
    user = db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated."
        )
    return user


@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def signup(
    credentials: Credentials, response: Response, db: Session = Depends(get_db)
) -> User:
    existing = db.scalar(select(User).where(User.email == credentials.email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    salt, password_hash = hash_password(credentials.password)
    user = User(
        email=credentials.email, password_salt=salt, password_hash=password_hash
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _set_session_cookie(response, user.id)
    return user


@router.post("/signin", response_model=UserPublic)
def signin(
    credentials: Credentials, response: Response, db: Session = Depends(get_db)
) -> User:
    user = db.scalar(select(User).where(User.email == credentials.email))
    if user is None or not verify_password(
        credentials.password, user.password_salt, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    _set_session_cookie(response, user.id)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(settings.session_cookie_name)


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)) -> User:
    return user
