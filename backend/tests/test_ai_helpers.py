"""Unit tests cho helper nhỏ, không cần DB/AI."""

from starlette.requests import Request

from app.ai import ensure_disclaimer
from app.config import _is_unsafe_secret
from app.net import client_ip, client_key


def _request(headers: dict[str, str] | None = None) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [
            (k.lower().encode(), v.encode()) for k, v in (headers or {}).items()
        ],
        "client": ("198.51.100.7", 12345),
    }
    return Request(scope)


def test_client_ip_prefers_last_forwarded_hop():
    # Entry đầu do client tự gửi, entry cuối do proxy thêm vào.
    req = _request({"X-Forwarded-For": "1.2.3.4, 203.0.113.9"})
    assert client_ip(req) == "203.0.113.9"


def test_client_ip_single_forwarded_value():
    req = _request({"X-Forwarded-For": "203.0.113.9"})
    assert client_ip(req) == "203.0.113.9"


def test_client_ip_falls_back_to_socket_peer():
    assert client_ip(_request()) == "198.51.100.7"


def test_client_key_is_stable_and_not_raw_ip():
    key = client_key("203.0.113.9")
    assert key == client_key("203.0.113.9")
    assert key != client_key("203.0.113.10")
    assert "203.0.113.9" not in key
    assert len(key) == 64


def test_ensure_disclaimer_appends_when_missing():
    text = "Một lời nhắn nhẹ nhàng."
    assert ensure_disclaimer(text).endswith("không phải lời khuyên y tế, pháp lý hay tài chính.")


def test_ensure_disclaimer_does_not_duplicate():
    text = (
        "Một lời nhắn nhẹ nhàng.\n\n"
        "Những dòng này là góc nhìn tham khảo, để bạn hiểu mình hơn — "
        "không phải lời khuyên y tế, pháp lý hay tài chính."
    )
    assert ensure_disclaimer(text) == text


def test_unsafe_secret_detection():
    assert _is_unsafe_secret("dev-secret-change-in-production")
    assert _is_unsafe_secret("change-this-to-a-random-secret-key-in-production")
    assert _is_unsafe_secret("too-short")
    assert not _is_unsafe_secret("x" * 64)
