"""Chặn dò mật khẩu admin: đếm lỗi theo IP và mở khóa sau khi đăng nhập đúng."""

from app.throttle import FailureThrottle


def test_blocks_after_max_failures():
    throttle = FailureThrottle(max_failures=3, window_seconds=60, block_seconds=60)
    ip = "203.0.113.9"

    throttle.fail(ip)
    throttle.fail(ip)
    assert throttle.retry_after(ip) == 0

    throttle.fail(ip)
    assert throttle.retry_after(ip) > 0


def test_other_ip_not_blocked():
    throttle = FailureThrottle(max_failures=1, window_seconds=60, block_seconds=60)
    throttle.fail("203.0.113.9")
    assert throttle.retry_after("203.0.113.9") > 0
    assert throttle.retry_after("198.51.100.7") == 0


def test_success_resets_failures():
    throttle = FailureThrottle(max_failures=2, window_seconds=60, block_seconds=60)
    ip = "203.0.113.9"

    throttle.fail(ip)
    throttle.reset(ip)
    throttle.fail(ip)
    assert throttle.retry_after(ip) == 0
