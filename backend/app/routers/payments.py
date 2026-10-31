"""Thanh toán SePay: tạo đơn + VietQR → webhook đối soát → poll trạng thái."""

import random
import re
from datetime import datetime, timezone
from urllib.parse import quote

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.ai_services import get_service, price_for, validate_input
from app.config import (
    PAYMENT_CODE_PREFIX,
    SEPAY_ACCOUNT,
    SEPAY_ACCOUNT_NAME,
    SEPAY_BANK,
    SEPAY_WEBHOOK_SECRET,
)
from app.database import get_db
from app.models import Payment, PaymentStatus

router = APIRouter(prefix="/api/payments", tags=["payments"])

_CODE_RE = re.compile(r"HWM\d{6}", re.IGNORECASE)


def _new_code(db: Session) -> str:
    for _ in range(20):
        code = f"{PAYMENT_CODE_PREFIX}{random.randint(100000, 999999)}"
        if not db.query(Payment).filter(Payment.code == code).first():
            return code
    raise RuntimeError("cannot allocate payment code")


def _qr_url(amount: int, content: str) -> str:
    # Ảnh VietQR chuẩn NAPAS (không cần API key) — demo trước, STK thật sau.
    return (
        f"https://img.vietqr.io/image/{SEPAY_BANK}-{SEPAY_ACCOUNT}-compact2.png"
        f"?amount={amount}&addInfo={quote(content)}"
        f"&accountName={quote(SEPAY_ACCOUNT_NAME)}"
    )


@router.post("")
def create_payment(body: dict, db: Session = Depends(get_db)):
    service_type = str(body.get("service", ""))
    svc = get_service(service_type)
    if not svc:
        return JSONResponse({"detail": "Dịch vụ này My chưa mở — bạn chọn món khác nhé."}, status_code=404)
    cleaned, err = validate_input(service_type, body.get("input") or {})
    if err:
        return JSONResponse({"detail": err}, status_code=422)
    amount = price_for(service_type, cleaned)
    code = _new_code(db)
    payment = Payment(
        service_type=service_type, code=code, amount=amount,
        status=PaymentStatus.pending,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {
        "code": code,
        "service": service_type,
        "amount": amount,
        "status": payment.status.value,
        "transfer_content": code,
        "qr_url": _qr_url(amount, code),
        "account_name": SEPAY_ACCOUNT_NAME,
        "bank": SEPAY_BANK,
        "account": SEPAY_ACCOUNT,
    }


@router.get("/{code}")
def payment_status(code: str, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.code == code.upper()).first()
    if not payment:
        return JSONResponse({"detail": "Không tìm thấy đơn này."}, status_code=404)
    return {"code": payment.code, "status": payment.status.value, "amount": payment.amount}


def _webhook_authorized(request: Request) -> bool:
    """Không cấu hình secret (demo local) → chấp nhận; có secret → phải khớp."""
    if not SEPAY_WEBHOOK_SECRET:
        return True
    auth = request.headers.get("authorization", "")
    if SEPAY_WEBHOOK_SECRET in auth:
        return True
    for h in ("x-api-key", "x-sepay-key", "x-webhook-secret"):
        if request.headers.get(h) == SEPAY_WEBHOOK_SECRET:
            return True
    return False


def _extract_tx(body: dict) -> tuple[str | None, int | None, str | None]:
    """Trả (code, amount, sepay_id) — chịu được nhiều biến thể field của SePay."""
    text = " ".join(
        str(body.get(k, "")) for k in ("content", "description", "transferContent", "code")
    )
    m = _CODE_RE.search(text)
    code = m.group(0).upper() if m else None
    amount = None
    for k in ("transferAmount", "amount", "transfer_amount", "money"):
        try:
            if body.get(k) is not None:
                amount = int(float(str(body[k]).replace(",", "")))
                break
        except (ValueError, TypeError):
            continue
    tx_id = body.get("referenceCode") or body.get("reference_code") or body.get("id")
    return code, amount, str(tx_id) if tx_id is not None else None


@router.post("/sepay-webhook")
async def sepay_webhook(request: Request, db: Session = Depends(get_db)):
    if not _webhook_authorized(request):
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"detail": "Bad payload"}, status_code=400)
    if isinstance(body, list):
        body = body[0] if body else {}

    code, amount, tx_id = _extract_tx(body if isinstance(body, dict) else {})
    if not code:
        # Không có mã HWM (giao dịch khác) → 200 để SePay khỏi retry vô ích.
        return {"ok": True, "ignored": True}

    payment = db.query(Payment).filter(Payment.code == code).first()
    if not payment:
        return {"ok": True, "ignored": True}
    if payment.status == PaymentStatus.paid:
        return {"ok": True, "duplicate": True}  # idempotent — SePay retry 7 lần
    if amount is not None and amount != payment.amount:
        payment.status = PaymentStatus.failed
        db.commit()
        return JSONResponse({"detail": "Sai số tiền — My giữ đơn để bạn đối soát."}, status_code=200)

    payment.status = PaymentStatus.paid
    payment.sepay_tx_id = tx_id
    payment.paid_at = datetime.now(timezone.utc)
    # Chống trùng transaction SePay (unique) — trùng thì coi như đã xử lý.
    try:
        db.commit()
    except Exception:
        db.rollback()
        return {"ok": True, "duplicate": True}
    db.refresh(payment)
    return {"ok": True, "code": code, "status": "paid"}
