"""Security utilities — password hashing and JWT creation/validation."""

from datetime import datetime, timedelta, timezone
import hashlib
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(plain: str) -> str:
    """Return bcrypt hash of the given plain-text password.

    The password is pre-hashed with SHA-256 (hexdigest) to avoid bcrypt's 72-byte limit
    and potential NULL byte truncation issues in passlib/bcrypt.
    """
    pre_hashed = hashlib.sha256(plain.encode("utf-8")).hexdigest()
    return bcrypt.hashpw(pre_hashed.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored bcrypt hash."""
    pre_hashed = hashlib.sha256(plain.encode("utf-8")).hexdigest()
    return bcrypt.checkpw(pre_hashed.encode("utf-8"), hashed.encode("utf-8"))


def _make_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str) -> str:
    """Create a short-lived JWT access token."""
    return _make_token(
        {"sub": user_id, "type": "access"},
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(user_id: str) -> str:
    """Create a long-lived JWT refresh token."""
    return _make_token(
        {"sub": user_id, "type": "refresh"},
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token.

    Raises:
        JWTError: If the token is invalid, expired, or tampered.
    """
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
