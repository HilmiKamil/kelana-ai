import os
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Generator

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import SessionLocal
from models.user import User

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration — loaded from environment, never hard-coded
# ---------------------------------------------------------------------------

SECRET_KEY  = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM   = os.getenv("ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

# ---------------------------------------------------------------------------
# Dependency: DB session generator
# FastAPI calls this per-request via Depends(); the finally block guarantees
# the session is always closed, even if an exception is raised.
# ---------------------------------------------------------------------------

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """
    Return a salted bcrypt hash of the plain-text password.

    - gensalt() generates a unique random salt on every call, so two
      identical passwords always produce different hashes.
    - The cost factor (default 12) makes brute-force attacks expensive.
    - Decoded to str for VARCHAR storage.
    """
    return bcrypt.hashpw(
        bytes(password, encoding="utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if plain_password matches the stored bcrypt hash."""
    return bcrypt.checkpw(
        bytes(plain_password, encoding="utf-8"),
        bytes(hashed_password, encoding="utf-8"),
    )

# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

def register_user(db: Session, name: str, email: str, password: str) -> User:
    """
    Create and persist a new User.

    Raises ValueError if the email is already registered.
    The plain-text password is NEVER stored — only its bcrypt hash.
    """
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError(f"Email '{email}' is already registered.")

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# ---------------------------------------------------------------------------
# Login + JWT generation
# ---------------------------------------------------------------------------

def login_user(db: Session, email: str, password: str) -> dict:
    """
    Authenticate a user and return a signed JWT access token.

    Raises ValueError on any credential failure (generic message to
    prevent user enumeration).
    Returns OAuth2-compatible dict: {"access_token": token, "token_type": "bearer"}.
    Stateless — no session is stored server-side.
    """
    # ── 1. Look up by email ──────────────────────────────────────────────
    user = db.query(User).filter(User.email == email).first()

    # ── 2. Verify credentials (generic error for both not-found & bad pw) ─
    if user is None or not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password.")

    # ── 3. Build JWT payload ─────────────────────────────────────────────
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),  # subject — uniquely identifies the user
        "exp": expire,        # expiry — jose converts datetime → epoch int
    }

    # ── 4. Sign and return ───────────────────────────────────────────────
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

# ---------------------------------------------------------------------------
# Current-user dependency (protects routes)
# ---------------------------------------------------------------------------

_bearer = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that decodes the Bearer JWT and returns the
    authenticated User object.

    Raises HTTPException 401 if:
    - The Authorization header is missing or malformed.
    - The token signature is invalid.
    - The token has expired.
    - The `sub` claim does not match any user in the database.
    """
    _401 = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise _401
    except JWTError:
        raise _401

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise _401

    return user
