"""Hạn lưu trữ bản xem AI: dữ liệu cũ phải bị xoá, dữ liệu mới phải còn."""

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import AiReading
from app.retention import purge_old_ai_readings


@pytest.fixture()
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def _reading(created_at: datetime) -> AiReading:
    return AiReading(
        service_type="ban-do-sao",
        input_json='{"full_name": "An"}',
        input_hash="a" * 64,
        computed_json="{}",
        basic_result="Bài xem thử.",
        created_at=created_at,
    )


def test_purge_removes_only_expired_readings(db):
    now = datetime.now(timezone.utc)
    old = _reading(now - timedelta(days=91))
    fresh = _reading(now - timedelta(days=89))
    db.add_all([old, fresh])
    db.commit()

    removed = purge_old_ai_readings(db, 90)

    assert removed == 1
    remaining = db.scalars(select(AiReading)).all()
    assert [r.id for r in remaining] == [fresh.id]


def test_purge_disabled_for_non_positive_days(db):
    db.add(_reading(datetime.now(timezone.utc) - timedelta(days=3650)))
    db.commit()

    assert purge_old_ai_readings(db, 0) == 0
    assert db.scalar(select(func.count()).select_from(AiReading)) == 1
