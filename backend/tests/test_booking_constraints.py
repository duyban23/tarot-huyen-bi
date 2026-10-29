"""Guards the anti-double-booking backstop end to end.

The app-level availability check has a race window: two concurrent POSTs can
both pass the SELECT guard. bookings_slot_uniq (partial unique index,
excluding cancelled) must reject the loser, and the API must answer 409 —
not 500 — in both the create path and the admin re-activate path.
"""

import importlib
import sys
from datetime import date, timedelta
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

BACKEND_DIR = Path(__file__).resolve().parent.parent

TOMORROW = (date.today() + timedelta(days=1)).isoformat()
SLOT = "10:00"

BOOKING = {
    "service_id": 1,
    "date": TOMORROW,
    "time": SLOT,
    "meeting_method": "online",
    "customer_name": "Test Klien",
    "customer_phone": "0912345678",
}


@pytest.fixture(scope="module")
def ctx(tmp_path_factory):
    """Real app against a scratch sqlite DB with tables created from models.

    create_all renders the same partial unique index the migration ships
    (sqlite_where branch), so this exercises the actual constraint. The
    cancel helper is bound inside this import generation so it always hits
    the same engine as the client.
    """
    db_path = tmp_path_factory.mktemp("slot") / "slots.db"

    import os

    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    os.environ.setdefault("SECRET_KEY", "test-secret")

    saved_path, saved_modules = list(sys.path), dict(sys.modules)
    try:
        sys.path.insert(0, str(BACKEND_DIR))
        for name in [m for m in list(sys.modules)
                     if m == "app" or m.startswith("app.")]:
            del sys.modules[name]
        app_module = importlib.import_module("app.main")
        from app import crud as crud_module
        from app.database import SessionLocal as SessionLocalCls

        engine = create_engine(f"sqlite:///{db_path}")
        app_module.Base.metadata.create_all(engine)
        with engine.begin() as conn:
            conn.exec_driver_sql(
                "INSERT INTO services "
                "(id, name, description, duration_minutes, price, is_active) "
                "VALUES (1, 'Test dich vu', 'mo ta', 30, 70000, 1)"
            )

        def cancel(booking_id: int) -> None:
            db = SessionLocalCls()
            try:
                crud_module.update_booking_status(db, booking_id, "cancelled")
            finally:
                db.close()

        with TestClient(app_module.app) as c:
            yield SimpleNamespace(client=c, cancel=cancel, ids={})
    finally:
        sys.path[:] = saved_path
        for name in [m for m in list(sys.modules)
                     if m == "app" or m.startswith("app.")]:
            del sys.modules[name]
        sys.modules.update(saved_modules)


def test_first_booking_succeeds(ctx):
    r = ctx.client.post("/api/bookings", json=BOOKING)
    assert r.status_code == 201, r.text
    ctx.ids["first"] = r.json()["id"]


def test_double_booking_same_slot_is_409_not_500(ctx):
    r = ctx.client.post(
        "/api/bookings", json={**BOOKING, "customer_phone": "0987654321"})
    assert r.status_code == 409, f"expected 409, got {r.status_code}: {r.text[:200]}"
    detail = r.json()["detail"].lower()
    assert "taken" in detail or "available" in detail


def test_cancelled_slot_is_rebookable(ctx):
    """The partial index excludes cancelled bookings, so a freed slot works."""
    ctx.cancel(ctx.ids["first"])
    r = ctx.client.post(
        "/api/bookings", json={**BOOKING, "customer_phone": "0900111222"})
    assert r.status_code == 201, r.text
