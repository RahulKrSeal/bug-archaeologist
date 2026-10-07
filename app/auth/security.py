# app/ Backend application
# auth/ Authentication + JWT logic
# security.py Password hashing + JWT functions

# app/auth/security.py 
'''
│
├── Password hashing
│     ├── hash_password()
│     └── verify_password()
│
└── JWT
      ├── create_access_token()
      └── create_refresh_token()
'''

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings


# =========================================================
# PASSWORD HASHING
# =========================================================

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password.
    """

    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain-text password against its stored hash.
    """

    return password_hash.verify(
        password,
        hashed_password,
    )


# =========================================================
# ACCESS TOKEN
# =========================================================

def create_access_token(user_id: int) -> str:
    """
    Create a short-lived JWT access token.
    """

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


# =========================================================
# REFRESH TOKEN
# =========================================================

def create_refresh_token(user_id: int) -> str:
    """
    Create a longer-lived JWT refresh token.
    """

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    )

    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


# =========================================================
# EMAIL VERIFICATION TOKEN
# =========================================================

def create_email_verification_token(
    email: str,
) -> str:
    """
    Create a short-lived JWT used only for
    email verification.

    The email is stored in the 'sub' claim because
    a User does not exist yet at this stage.
    """

    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=30)
    )

    payload = {
        "sub": email,
        "type": "email_verification",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


# =========================================================
# DECODE TOKEN
# =========================================================

def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT.

    PyJWT automatically checks the expiration time
    when the 'exp' claim is present.
    """

    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[
            settings.JWT_ALGORITHM
        ],
    )


# =========================================================
# GET USER ID FROM ACCESS TOKEN
# =========================================================

def get_user_id_from_token(
    token: str,
) -> int:
    """
    Extract the User ID from a valid access token.
    """

    payload = decode_token(token)

    if payload.get("type") != "access":
        raise ValueError(
            "Invalid access token"
        )

    return int(
        payload["sub"]
    )