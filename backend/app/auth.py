from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import ADMIN_PASSWORD_HASH, ADMIN_USERNAME, SECRET_KEY

bearer_scheme = HTTPBearer()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours


def verify_password(plain: str) -> bool:
    if not ADMIN_PASSWORD_HASH:
        raise RuntimeError(
            "ADMIN_PASSWORD_HASH is not configured. "
            "Generate a bcrypt hash and set it in backend/.env"
        )
    # Same $2b$ algorithm as before, so existing hashes keep working.
    return bcrypt.checkpw(
        plain.encode("utf-8"), ADMIN_PASSWORD_HASH.encode("utf-8")
    )


def hash_password(plain: str) -> str:
    """Generate a hash for ADMIN_PASSWORD_HASH (run once, store the output)."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token() -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": ADMIN_USERNAME, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub", "")
        if username != ADMIN_USERNAME:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
