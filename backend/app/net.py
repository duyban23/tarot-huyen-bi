"""Tiện ích HTTP dùng chung cho các router."""

import hashlib
import hmac

from fastapi import Request

from app.config import SECRET_KEY


def client_ip(request: Request) -> str:
    """IP dùng cho rate-limit.

    Chỉ tin hop cuối của X-Forwarded-For: nginx/Vercel append IP thật vào cuối,
    còn các entry bên trái do client tự gửi nên có thể giả. Trước đây lấy entry
    đầu nên chỉ cần chèn header là bypass quota.
    """
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def client_key(ip: str) -> str:
    """Khóa quota ổn định, không lưu IP thô vào DB."""
    return hmac.new(
        SECRET_KEY.encode("utf-8"), ip.encode("utf-8"), hashlib.sha256
    ).hexdigest()
