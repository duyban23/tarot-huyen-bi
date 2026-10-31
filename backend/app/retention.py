"""Dọn dữ liệu xem cũ: không giữ tên/ngày giờ sinh trong DB mãi mãi.

Chỉ xoá bản ghi AI cũ hơn hạn lưu trữ. Payment vẫn giữ nguyên để đối soát;
bản free/full cũ hơn hạn thì người dùng cũng đã hết cửa sổ khôi phục 7 ngày
ở frontend.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import AI_READING_RETENTION_DAYS
from app.models import AiReading

logger = logging.getLogger(__name__)

_last_purge_at = 0.0
_PURGE_INTERVAL_SECONDS = 60 * 60


def purge_old_ai_readings(db: Session, days: int) -> int:
    """Xoá reading cũ hơn `days` ngày. Trả về số bản ghi đã xoá."""
    if days <= 0:
        return 0
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    deleted = (
        db.query(AiReading)
        .filter(AiReading.created_at < cutoff)
        .delete(synchronize_session=False)
    )
    db.commit()
    return int(deleted or 0)


def maybe_purge_ai_readings(db: Session) -> None:
    """Chạy tối đa 1 lần/giờ cho mỗi instance, không chặn luồng xem."""
    global _last_purge_at
    now = time.monotonic()
    if now - _last_purge_at < _PURGE_INTERVAL_SECONDS:
        return
    _last_purge_at = now
    try:
        removed = purge_old_ai_readings(db, AI_READING_RETENTION_DAYS)
        if removed:
            logger.info("purged %d old ai_readings", removed)
    except Exception:
        db.rollback()
        logger.exception("ai_readings retention purge failed — skipping")
