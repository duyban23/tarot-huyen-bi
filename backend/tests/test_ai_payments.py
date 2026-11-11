"""Luồng xem cùng My: validate input, tạo đơn, webhook paid, mở bản full."""

import importlib
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

BACKEND_DIR = Path(__file__).resolve().parent.parent

NATAL = {
    "service": "ban-do-sao",
    "input": {
        "full_name": "Nguyen Thi An",
        "birth_date": "1998-05-14",
        "birth_time": "07:30",
        "province": "Hà Nội",
    },
}


@pytest.fixture(scope="module")
def app_client(tmp_path_factory):
    db_path = tmp_path_factory.mktemp("ai") / "ai.db"
    import os

    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ["GEMINI_API_KEY"] = ""  # không gọi AI thật trong test

    saved_path, saved_modules = list(sys.path), dict(sys.modules)
    try:
        sys.path.insert(0, str(BACKEND_DIR))
        for name in [m for m in list(sys.modules) if m == "app" or m.startswith("app.")]:
            del sys.modules[name]
        app_module = importlib.import_module("app.main")

        engine = create_engine(f"sqlite:///{db_path}")
        app_module.Base.metadata.create_all(engine)

        with TestClient(app_module.app) as c:
            yield c
    finally:
        sys.path[:] = saved_path
        for name in [m for m in list(sys.modules) if m == "app" or m.startswith("app.")]:
            del sys.modules[name]
        sys.modules.update(saved_modules)


def test_list_ai_services(app_client):
    r = app_client.get("/api/ai/services")
    assert r.status_code == 200, r.text
    types = {s["type"] for s in r.json()}
    assert {"ban-do-sao", "ban-do-sao-doi"} == types


def test_reading_missing_field_is_422(app_client):
    r = app_client.post(
        "/api/ai/reading",
        json={
            "service": "ban-do-sao",
            "input": {"full_name": "", "birth_date": "1998-05-14", "province": "Hà Nội"},
        },
    )
    assert r.status_code == 422, r.text
    assert "Tên của bạn" in r.json()["detail"]


def test_reading_rejects_overlong_name(app_client):
    payload = {
        "service": "ban-do-sao",
        "input": {**NATAL["input"], "full_name": "x" * 201},
    }
    r = app_client.post("/api/ai/reading", json=payload)
    assert r.status_code == 422, r.text
    assert "dài" in r.json()["detail"]


def test_reading_rejects_bad_date(app_client):
    payload = {
        "service": "ban-do-sao",
        "input": {**NATAL["input"], "birth_date": "14/05/1998"},
    }
    r = app_client.post("/api/ai/reading", json=payload)
    assert r.status_code == 422, r.text
    assert "ngày" in r.json()["detail"]


def test_reading_rejects_bad_time(app_client):
    payload = {
        "service": "ban-do-sao",
        "input": {**NATAL["input"], "birth_time": "25:99"},
    }
    r = app_client.post("/api/ai/reading", json=payload)
    assert r.status_code == 422, r.text
    assert "giờ" in r.json()["detail"]


def test_reading_unknown_service_is_404(app_client):
    r = app_client.post("/api/ai/reading", json={"service": "xem-boi-kieu-moi", "input": {}})
    assert r.status_code == 404


def test_reading_without_gemini_key_is_502_friendly(app_client):
    r = app_client.post("/api/ai/reading", json=NATAL)
    # Chưa cấu hình key → 502 với lời nhắn giọng My, không crash 500.
    assert r.status_code == 502, r.text
    assert "My" in r.json()["detail"]


def test_payment_full_flow_via_webhook(app_client, monkeypatch):
    import app.routers.ai as ai_router

    # Tắt chế độ mở thử để kiểm tra đúng luồng trả phí.
    monkeypatch.setattr(ai_router, "AI_FULL_DEMO_OPEN", False)

    # 1. Tạo đơn
    r = app_client.post("/api/payments", json=NATAL)
    assert r.status_code == 200, r.text
    order = r.json()
    assert order["code"].startswith("HWM") and order["amount"] == 50000
    assert "qr_url" in order and order["code"] in order["qr_url"]

    code = order["code"]
    # 2. Chưa CK → pending
    assert app_client.get(f"/api/payments/{code}").json()["status"] == "pending"
    # 3. Bản full khi chưa paid → 402
    r = app_client.post(
        "/api/ai/reading/full",
        json={**NATAL, "payment_code": code},
    )
    assert r.status_code == 402, r.text
    # 4. SePay webhook báo CK đúng mã + đúng tiền
    r = app_client.post(
        "/api/payments/sepay-webhook",
        json={"content": f"Chuyen tien {code}", "transferAmount": 50000, "referenceCode": "SEPAY1"},
    )
    assert r.status_code == 200, r.text
    assert app_client.get(f"/api/payments/{code}").json()["status"] == "paid"
    # 5. Webhook retry trùng → idempotent, vẫn 200
    r = app_client.post(
        "/api/payments/sepay-webhook",
        json={"content": code, "transferAmount": 50000, "referenceCode": "SEPAY1"},
    )
    assert r.status_code == 200


def test_webhook_wrong_amount_fails_order(app_client):
    r = app_client.post("/api/payments", json=NATAL)
    code = r.json()["code"]
    r = app_client.post(
        "/api/payments/sepay-webhook",
        json={"content": code, "transferAmount": 1000, "referenceCode": "SEPAY2"},
    )
    assert r.status_code == 200
    assert app_client.get(f"/api/payments/{code}").json()["status"] == "failed"


def test_webhook_without_code_ignored(app_client):
    r = app_client.post(
        "/api/payments/sepay-webhook",
        json={"content": "Nap tien dien thoai", "transferAmount": 50000},
    )
    assert r.status_code == 200
    assert r.json().get("ignored") is True


def _clear_full_readings():
    from app.database import SessionLocal
    from app.models import AiReading

    db = SessionLocal()
    try:
        db.query(AiReading).delete()
        db.commit()
    finally:
        db.close()


def test_demo_confirm_disabled_returns_404(app_client, monkeypatch):
    import app.routers.payments as payments_router

    monkeypatch.setattr(payments_router, "PAYMENT_DEMO_MODE", False)
    r = app_client.post("/api/payments", json=NATAL)
    assert r.status_code == 200, r.text
    order = r.json()
    assert order["demo"] is False
    assert order["qr_url"].startswith("https://")

    r = app_client.post(f"/api/payments/{order['code']}/demo-confirm")
    assert r.status_code == 404, r.text
    assert app_client.get(f"/api/payments/{order['code']}").json()["status"] == "pending"


def test_demo_payment_flow_and_quota(app_client, monkeypatch):
    import app.routers.ai as ai_router
    import app.routers.payments as payments_router

    async def fake_interpret(summary, full):
        return f"Bản demo {'đầy đủ' if full else 'ngắn'}.", None

    monkeypatch.setattr(payments_router, "PAYMENT_DEMO_MODE", True)
    monkeypatch.setattr(ai_router, "PAYMENT_DEMO_MODE", True)
    monkeypatch.setattr(ai_router, "AI_DEMO_FULL_PER_DAY", 2)
    monkeypatch.setattr(ai_router, "AI_DEMO_FULL_GLOBAL_PER_DAY", 30)
    monkeypatch.setattr(ai_router.ai, "interpret", fake_interpret)
    _clear_full_readings()

    headers = {"X-Forwarded-For": "203.0.113.50"}

    def order_for(name):
        r = app_client.post(
            "/api/payments",
            json={
                "service": "ban-do-sao",
                "input": {**NATAL["input"], "full_name": name},
            },
        )
        assert r.status_code == 200, r.text
        return r.json()

    first = order_for("Demo Một")
    # Demo không trả QR/STK thật để tránh khách chuyển tiền ngoài đời.
    assert first["demo"] is True
    assert first["qr_url"] == ""
    assert first["bank"] == "DEMO" and first["account"] == "DEMO"
    assert first["amount"] == 50000

    # Mã sai → 404.
    assert app_client.post("/api/payments/HWM000000/demo-confirm").status_code == 404

    r = app_client.post(f"/api/payments/{first['code'].lower()}/demo-confirm")
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "paid"
    # Bấm lại (idempotent) vẫn 200, không lỗi.
    assert app_client.post(f"/api/payments/{first['code']}/demo-confirm").status_code == 200

    r = app_client.post(
        "/api/ai/reading/full",
        json={**NATAL, "payment_code": first["code"]},
        headers=headers,
    )
    assert r.status_code == 200, r.text

    # Dùng lại đúng đơn → trả bản cũ, không tính thêm lượt.
    r = app_client.post(
        "/api/ai/reading/full",
        json={**NATAL, "payment_code": first["code"]},
        headers=headers,
    )
    assert r.status_code == 200, r.text

    second = order_for("Demo Hai")
    app_client.post(f"/api/payments/{second['code']}/demo-confirm")
    r = app_client.post(
        "/api/ai/reading/full",
        json={
            "service": "ban-do-sao",
            "input": {**NATAL["input"], "full_name": "Demo Hai"},
            "payment_code": second["code"],
        },
        headers=headers,
    )
    assert r.status_code == 200, r.text

    # Đã dùng 2/2 lượt/24h của IP này → lượt thứ 3 bị chặn.
    third = order_for("Demo Ba")
    app_client.post(f"/api/payments/{third['code']}/demo-confirm")
    r = app_client.post(
        "/api/ai/reading/full",
        json={
            "service": "ban-do-sao",
            "input": {**NATAL["input"], "full_name": "Demo Ba"},
            "payment_code": third["code"],
        },
        headers=headers,
    )
    assert r.status_code == 429, r.text
    assert "hết lượt" in r.json()["detail"]

    # IP khác vẫn còn quota riêng (global cap 30 chưa chạm).
    fourth = order_for("Demo Bốn")
    app_client.post(f"/api/payments/{fourth['code']}/demo-confirm")
    r = app_client.post(
        "/api/ai/reading/full",
        json={
            "service": "ban-do-sao",
            "input": {**NATAL["input"], "full_name": "Demo Bốn"},
            "payment_code": fourth["code"],
        },
        headers={"X-Forwarded-For": "203.0.113.51"},
    )
    assert r.status_code == 200, r.text


def test_demo_global_cap_blocks_all_ips(app_client, monkeypatch):
    import app.routers.ai as ai_router
    import app.routers.payments as payments_router

    async def fake_interpret(summary, full):
        return "Bản demo đầy đủ.", None

    monkeypatch.setattr(payments_router, "PAYMENT_DEMO_MODE", True)
    monkeypatch.setattr(ai_router, "PAYMENT_DEMO_MODE", True)
    monkeypatch.setattr(ai_router, "AI_DEMO_FULL_PER_DAY", 10)
    monkeypatch.setattr(ai_router, "AI_DEMO_FULL_GLOBAL_PER_DAY", 1)
    monkeypatch.setattr(ai_router.ai, "interpret", fake_interpret)
    _clear_full_readings()

    def full_for(name, ip):
        r = app_client.post(
            "/api/payments",
            json={
                "service": "ban-do-sao",
                "input": {**NATAL["input"], "full_name": name},
            },
        )
        code = r.json()["code"]
        app_client.post(f"/api/payments/{code}/demo-confirm")
        return app_client.post(
            "/api/ai/reading/full",
            json={
                "service": "ban-do-sao",
                "input": {**NATAL["input"], "full_name": name},
                "payment_code": code,
            },
            headers={"X-Forwarded-For": ip},
        )

    assert full_for("Global Một", "203.0.113.60").status_code == 200
    r = full_for("Global Hai", "203.0.113.61")
    assert r.status_code == 429, r.text
    assert "đủ lượt" in r.json()["detail"]


def test_full_open_demo_without_payment_and_quota(app_client, monkeypatch):
    import app.routers.ai as ai_router

    async def fake_interpret(summary, full):
        return "Bản đầy đủ miễn phí.", None

    monkeypatch.setattr(ai_router, "AI_FULL_DEMO_OPEN", True)
    monkeypatch.setattr(ai_router, "AI_DEMO_FULL_PER_DAY", 2)
    monkeypatch.setattr(ai_router, "AI_DEMO_FULL_GLOBAL_PER_DAY", 30)
    monkeypatch.setattr(ai_router.ai, "interpret", fake_interpret)
    _clear_full_readings()

    headers = {"X-Forwarded-For": "203.0.113.70"}

    def payload(name):
        return {
            "service": "ban-do-sao",
            "input": {**NATAL["input"], "full_name": name},
        }

    # Không cần payment_code vẫn mở được bản đầy đủ.
    r = app_client.post("/api/ai/reading/full", json=payload("Open Một"), headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["demo"] is True
    first_text = r.json()["full_result"]

    # Gọi lại cùng input → dùng lại bản cũ, không tốn thêm lượt.
    r = app_client.post("/api/ai/reading/full", json=payload("Open Một"), headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["full_result"] == first_text

    # Lượt thứ 2 trong ngày vẫn được.
    r = app_client.post("/api/ai/reading/full", json=payload("Open Hai"), headers=headers)
    assert r.status_code == 200, r.text

    # Lượt thứ 3 bị chặn theo IP.
    r = app_client.post("/api/ai/reading/full", json=payload("Open Ba"), headers=headers)
    assert r.status_code == 429, r.text
    assert "hết lượt" in r.json()["detail"]

    # IP khác vẫn còn lượt riêng.
    r = app_client.post(
        "/api/ai/reading/full",
        json=payload("Open Bốn"),
        headers={"X-Forwarded-For": "203.0.113.71"},
    )
    assert r.status_code == 200, r.text

    # Tắt cờ → quay lại yêu cầu thanh toán như cũ.
    monkeypatch.setattr(ai_router, "AI_FULL_DEMO_OPEN", False)
    r = app_client.post("/api/ai/reading/full", json=payload("Open Năm"), headers=headers)
    assert r.status_code == 402, r.text


def test_free_quota_is_shared_via_db(app_client, monkeypatch):
    import app.routers.ai as ai_router

    async def fake_interpret(summary, full):
        return "Một lời nhắn thử cho quota.", None

    monkeypatch.setattr(ai_router.ai, "interpret", fake_interpret)
    monkeypatch.setattr(ai_router, "AI_FREE_PER_DAY", 2)
    headers = {"X-Forwarded-For": "198.51.100.201"}

    def payload(name):
        return {
            "service": "ban-do-sao",
            "input": {**NATAL["input"], "full_name": name},
        }

    for i in range(2):
        r = app_client.post("/api/ai/reading", json=payload(f"Quota {i}"), headers=headers)
        assert r.status_code == 200, r.text

    # Lượt thứ 3 bị chặn dù request trước đã xong (quota nằm trong DB).
    r = app_client.post("/api/ai/reading", json=payload("Quota 3"), headers=headers)
    assert r.status_code == 429, r.text

    # Bài đã cache vẫn xem lại được, không tốn thêm lượt.
    r = app_client.post("/api/ai/reading", json=payload("Quota 0"), headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["cached"] is True

    # IP khác có quota riêng.
    r = app_client.post(
        "/api/ai/reading",
        json=payload("Quota IP khác"),
        headers={"X-Forwarded-For": "198.51.100.202"},
    )
    assert r.status_code == 200, r.text

