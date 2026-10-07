# app/ Backend application
# auth/ Authentication + JWT logic
# router.py Register/login/refresh/logout endpoints
'''
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /auth/verify-email
GET  /auth/me
POST /auth/logout
'''

import hashlib
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.email import send_verification_email
from app.auth.security import (
    create_access_token,
    create_email_verification_token,
    create_refresh_token,
    decode_token,
    get_user_id_from_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import EmailVerification, User
from app.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

bearer_scheme = HTTPBearer()


# =========================================================
# EMAIL VERIFICATION HELPERS
# =========================================================

def hash_verification_token(token: str) -> str:
    """
    Create a SHA-256 hash of the verification token.

    We store the hash rather than the original token
    in the database.
    """

    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


# =========================================================
# REQUEST EMAIL VERIFICATION
# =========================================================

@router.post("/request-verification")
def request_verification(
    data: dict,
    db: Session = Depends(get_db),
):
    """
    Start the email verification process.

    No User is created at this stage.
    """

    email = data.get(
        "email",
        "",
    ).strip().lower()

    if not email:

        raise HTTPException(
            status_code=400,
            detail="Email is required",
        )

    # -----------------------------------------------------
    # Check whether this email already belongs to a User.
    # -----------------------------------------------------

    existing_user = db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="This email is already registered",
        )

    # -----------------------------------------------------
    # Create a JWT verification token.
    # -----------------------------------------------------

    verification_token = create_email_verification_token(
        email
    )

    token_hash = hash_verification_token(
        verification_token
    )

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=30)
    )

    # -----------------------------------------------------
    # Check whether this email already has a pending
    # verification request.
    # -----------------------------------------------------

    verification = db.scalar(
        select(EmailVerification).where(
            EmailVerification.email == email
        )
    )

    if verification:

        verification.token_hash = token_hash
        verification.expires_at = expires_at
        verification.verified = False

    else:

        verification = EmailVerification(
            email=email,
            token_hash=token_hash,
            expires_at=expires_at,
            verified=False,
        )

        db.add(verification)

    db.commit()

    # -----------------------------------------------------
    # Create the link that will be sent through Gmail.
    # -----------------------------------------------------

    verification_link = (
        "http://127.0.0.1:8000/verify"
        f"?token={verification_token}"
    )

    try:

        send_verification_email(
            recipient_email=email,
            verification_link=verification_link,
        )

    except Exception as exc:

        print(
            "Verification email error:",
            exc,
        )

        db.delete(verification)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail=(
                "Verification email could not be sent. "
                "Please check the email configuration."
            ),
        )

    return {
        "message": (
            "Verification link sent successfully. "
            "Please check your email."
        )
    }


# =========================================================
# VERIFY EMAIL
# =========================================================

@router.get("/verify-email")
def verify_email(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Verify the email using the JWT received by email.
    """

    try:

        payload = decode_token(token)

        if payload.get("type") != "email_verification":

            raise HTTPException(
                status_code=400,
                detail="Invalid verification token",
            )

        email = payload["sub"]

    except (
        jwt.InvalidTokenError,
        KeyError,
        ValueError,
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification token",
        )

    # -----------------------------------------------------
    # Find the temporary verification record.
    # -----------------------------------------------------

    verification = db.scalar(
        select(EmailVerification).where(
            EmailVerification.email == email
        )
    )

    if not verification:

        raise HTTPException(
            status_code=404,
            detail="Verification request not found",
        )

    # -----------------------------------------------------
    # Compare the token received from the email with the
    # hashed token stored in the database.
    # -----------------------------------------------------

    token_hash = hash_verification_token(
        token
    )

    if token_hash != verification.token_hash:

        raise HTTPException(
            status_code=400,
            detail="Invalid verification token",
        )

    # -----------------------------------------------------
    # Check expiration.
    # -----------------------------------------------------

    if (
        verification.expires_at
        < datetime.now(timezone.utc)
    ):

        db.delete(verification)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Verification token has expired",
        )

    # -----------------------------------------------------
    # Mark the email as verified.
    # -----------------------------------------------------

    verification.verified = True

    db.commit()

    return {
        "message": "Email verified successfully",
        "email": email,
    }


# =========================================================
# REGISTER
# =========================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Create the actual User account.

    The email must have been verified first.
    """

    email = str(
        data.email
    ).strip().lower()

    # -----------------------------------------------------
    # Check username.
    # -----------------------------------------------------

    existing_username = db.scalar(
        select(User).where(
            User.username == data.username
        )
    )

    if existing_username:

        raise HTTPException(
            status_code=400,
            detail="Username already exists",
        )

    # -----------------------------------------------------
    # Check email.
    # -----------------------------------------------------

    existing_email = db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    # -----------------------------------------------------
    # Find the email verification record.
    # -----------------------------------------------------

    verification = db.scalar(
        select(EmailVerification).where(
            EmailVerification.email == email
        )
    )

    if not verification:

        raise HTTPException(
            status_code=403,
            detail=(
                "Please verify your email before "
                "creating an account."
            ),
        )

    # -----------------------------------------------------
    # Make sure the email was actually verified.
    # -----------------------------------------------------

    if not verification.verified:

        raise HTTPException(
            status_code=403,
            detail=(
                "Please verify your email before "
                "creating an account."
            ),
        )

    # -----------------------------------------------------
    # Make sure the verification has not expired.
    # -----------------------------------------------------

    if (
        verification.expires_at
        < datetime.now(timezone.utc)
    ):

        db.delete(verification)
        db.commit()

        raise HTTPException(
            status_code=403,
            detail=(
                "Email verification has expired. "
                "Please request a new verification email."
            ),
        )

    # -----------------------------------------------------
    # Hash the password.
    # -----------------------------------------------------

    hashed_password = hash_password(
        data.password
    )

    # -----------------------------------------------------
    # Create the REAL User.
    # -----------------------------------------------------

    user = User(
        username=data.username,
        email=email,
        password_hash=hashed_password,
        email_verified=True,
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    # -----------------------------------------------------
    # Verification record is no longer required.
    # -----------------------------------------------------

    db.delete(verification)

    db.commit()

    return user


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate an existing verified user.
    """

    email = str(
        data.email
    ).strip().lower()

    user = db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        data.password,
        user.password_hash,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # -----------------------------------------------------
    # Only verified accounts can sign in.
    # -----------------------------------------------------

    if not user.email_verified:

        raise HTTPException(
            status_code=403,
            detail=(
                "Please verify your email before "
                "signing in."
            ),
        )

    # -----------------------------------------------------
    # Create JWT tokens.
    # -----------------------------------------------------

    access_token = create_access_token(
        user.id
    )

    refresh_token = create_refresh_token(
        user.id
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


# =========================================================
# REFRESH TOKEN
# =========================================================

@router.post("/refresh")
def refresh_token(
    data: RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Create a new access token using a valid
    refresh token.
    """

    try:

        payload = decode_token(
            data.refresh_token
        )

        if payload.get("type") != "refresh":

            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token",
            )

        user_id = int(
            payload["sub"]
        )

    except (
        jwt.InvalidTokenError,
        KeyError,
        ValueError,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token",
        )

    user = db.get(
        User,
        user_id,
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    access_token = create_access_token(
        user.id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# =========================================================
# CURRENT USER
# =========================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
):
    """
    Return the currently authenticated user.
    """

    token = credentials.credentials

    try:

        user_id = get_user_id_from_token(
            token
        )

    except (
        jwt.InvalidTokenError,
        KeyError,
        ValueError,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token",
        )

    user = db.get(
        User,
        user_id,
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


# =========================================================
# LOGOUT
# =========================================================

@router.post("/logout")
def logout():
    """
    JWT logout is handled by the frontend by removing
    the stored access and refresh tokens.
    """

    return {
        "message": "Logged out successfully"
    }