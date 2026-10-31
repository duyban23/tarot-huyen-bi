"""Chặn dò mật khẩu admin bằng giới hạn số lần sai theo IP.

State nằm trong RAM nên mỗi instance đếm riêng; đây là lớp chặn tối thiểu,
không thay thế được rate-limit phân tán khi chạy nhiều instance.
"""

from __future__ import annotations

import time
from collections import deque
from threading import Lock

MAX_FAILURES = 5
WINDOW_SECONDS = 15 * 60
BLOCK_SECONDS = 15 * 60
MAX_TRACKED_KEYS = 10_000


class FailureThrottle:
    def __init__(
        self,
        max_failures: int = MAX_FAILURES,
        window_seconds: int = WINDOW_SECONDS,
        block_seconds: int = BLOCK_SECONDS,
    ) -> None:
        self.max_failures = max_failures
        self.window_seconds = window_seconds
        self.block_seconds = block_seconds
        self._failures: dict[str, deque[float]] = {}
        self._blocked_until: dict[str, float] = {}
        self._lock = Lock()

    def retry_after(self, key: str) -> int:
        """Số giây còn bị chặn; 0 nếu được thử."""
        now = time.monotonic()
        with self._lock:
            until = self._blocked_until.get(key, 0.0)
            if until > now:
                return max(1, int(until - now + 0.999))
            if until:
                self._blocked_until.pop(key, None)
                self._failures.pop(key, None)
            return 0

    def fail(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            hits = self._failures.setdefault(key, deque())
            cutoff = now - self.window_seconds
            while hits and hits[0] <= cutoff:
                hits.popleft()
            hits.append(now)
            if len(hits) >= self.max_failures:
                self._blocked_until[key] = now + self.block_seconds
            self._prune(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)
            self._blocked_until.pop(key, None)

    def clear(self) -> None:
        """Chỉ dùng trong test."""
        with self._lock:
            self._failures.clear()
            self._blocked_until.clear()

    def _prune(self, now: float) -> None:
        # IP giả có thể làm dict phình; cắt bớt entry đã hết hạn.
        if len(self._failures) <= MAX_TRACKED_KEYS:
            return
        cutoff = now - self.window_seconds
        stale = [
            key
            for key, hits in self._failures.items()
            if (not hits or hits[-1] <= cutoff)
            and self._blocked_until.get(key, 0.0) <= now
        ]
        for key in stale:
            self._failures.pop(key, None)
            self._blocked_until.pop(key, None)


login_throttle = FailureThrottle()
