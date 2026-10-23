import hmac
import hashlib
import binascii
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from app.core.config import settings

# Attempt to load argon2-cffi PasswordHasher
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHash
    _hasher: Optional[PasswordHasher] = PasswordHasher()
except ImportError:
    _hasher = None


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using Argon2id by default.
    Falls back to PBKDF2-SHA256 if Argon2 is unavailable in the environment.
    """
    if _hasher is not None:
        try:
            return _hasher.hash(password)
        except Exception:
            pass

    # High-iteration PBKDF2 fallback
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200000)
    return "pbkdf2:sha256:200000$" + binascii.hexlify(salt).decode("ascii") + "$" + binascii.hexlify(dk).decode("ascii")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against an Argon2id or PBKDF2 hash.
    """
    if not hashed_password or not plain_password:
        return False

    # Check for Argon2 hash format ($argon2id$, $argon2i$, etc.)
    if hashed_password.startswith("$argon2"):
        if _hasher is not None:
            try:
                return _hasher.verify(hashed_password, plain_password)
            except (VerifyMismatchError, VerificationError, InvalidHash):
                return False
            except Exception:
                return False
        return False

    # Check for PBKDF2 format: pbkdf2:sha256:iterations$salt$hash
    if hashed_password.startswith("pbkdf2:"):
        try:
            parts = hashed_password.split("$")
            if len(parts) != 3:
                return False
            header, salt_hex, hash_hex = parts
            iterations = int(header.split(":")[2])
            salt = binascii.unhexlify(salt_hex)
            expected_dk = binascii.unhexlify(hash_hex)
            actual_dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
            return hmac.compare_digest(actual_dk, expected_dk)
        except Exception:
            return False

    return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a signed JSON Web Token (JWT) with user identity and claims.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "iat": now,
        "exp": expire,
        "nbf": now
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT access token. Returns payload or None if invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.PyJWTError:
        return None
