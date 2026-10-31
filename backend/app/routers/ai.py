"""Dịch vụ xem cùng My: form động → kết quả free → SePay → bản full."""

import json
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app import ai
from app.ai_services import (
    canonical_hash,
    describe_computed,
    get_service,
    list_services,
    price_for,
    validate_input,
)
from app.config import AI_FREE_PER_DAY
from app.database import get_db
from app.models import AiReading, Payment, PaymentStatus
from app.net import client_ip, client_key
from app.retention import maybe_purge_ai_readings

router = APIRouter(prefix="/api/ai", tags=["ai"])

logger = logging.getLogger(__name__)


@router.get("/services")
def ai_services():
    return list_services()


@router.post("/reading")
async def ai_reading_free(body: dict, request: Request, db: Session = Depends(get_db)):
    service_type = str(body.get("service", ""))
    svc = get_service(service_type)
    if not svc:
        return JSONResponse({"detail": "Dịch vụ này My chưa mở — bạn chọn món khác nhé."}, status_code=404)
    cleaned, err = validate_input(service_type, body.get("input") or {})
    if err:
        return JSONResponse({"detail": err}, status_code=422)

    maybe_purge_ai_readings(db)

    ip_key = client_key(client_ip(request))
    ihash = canonical_hash(service_type, cleaned)
    # Chỉ lấy bản free đã có nội dung: bản full cùng input lưu basic_result="" nên
    # nếu lấy theo id desc thì sẽ "che" mất bản free cũ → gọi Gemini lại mỗi lần.
    cached = (
        db.query(AiReading)
        .filter(
            AiReading.service_type == service_type,
            AiReading.input_hash == ihash,
            AiReading.basic_result != "",
        )
        .order_by(AiReading.id.desc())
        .first()
    )
    from_cache = bool(cached and cached.basic_result)

    # Cache hit không tính quota: khách xem lại bài cũ không tốn lượt/Gemini.
    # Đếm trong DB để mọi instance/serverless dùng chung một quota.
    if not from_cache:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        used = (
            db.query(AiReading)
            .filter(
                AiReading.client_ip_hash == ip_key,
                AiReading.service_type == service_type,
                AiReading.basic_result != "",
                AiReading.created_at >= cutoff,
            )
            .count()
        )
        if used >= AI_FREE_PER_DAY:
            logger.info(
                "ai.free quota blocked service=%s used=%d limit=%d",
                service_type, used, AI_FREE_PER_DAY,
            )
            return JSONResponse(
                {"detail": "Hôm nay bạn đã xem free món này đủ lượt rồi — hẹn bạn ngày mai nhé."},
                status_code=429,
            )
    try:
        computed = svc["compute"](cleaned)
    except Exception:
        return JSONResponse(
            {"detail": "Thông tin này My xem chưa ra — bạn kiểm tra lại ngày giờ giúp My nhé."},
            status_code=422,
        )
    summary = describe_computed(service_type, computed, level="free")

    if cached and cached.basic_result:
        reading = cached
        from_cache = True
        # Dùng lại đúng lá bài của lần xem trước (tránh lệch với bản đã luận).
        try:
            computed = json.loads(cached.computed_json)
            summary = describe_computed(service_type, computed, level="free")
        except Exception:
            pass
    else:
        text, err = await ai.interpret(summary, full=False)
        if err:
            return JSONResponse({"detail": err}, status_code=502)
        reading = AiReading(
            service_type=service_type,
            input_json=json.dumps(cleaned, ensure_ascii=False),
            input_hash=ihash,
            computed_json=json.dumps(computed, ensure_ascii=False),
            basic_result=text,
            client_ip_hash=ip_key,
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)
        from_cache = False

    logger.info(
        "ai.free %s service=%s id=%s chars=%d",
        "cache-hit" if from_cache else "generated",
        service_type, reading.id, len(reading.basic_result or ""),
    )

    return {
        "id": reading.id,
        "service": service_type,
        "computed_summary": summary,
        "basic_result": reading.basic_result,
        "cached": from_cache,
        # Lá bài đã rút (kèm ảnh) để frontend lật tương tác — chỉ tarot có.
        "cards": computed.get("trai_bai"),
        "spread_label": computed.get("kieu_trai"),
    }


@router.post("/reading/full")
async def ai_reading_full(body: dict, db: Session = Depends(get_db)):
    service_type = str(body.get("service", ""))
    svc = get_service(service_type)
    if not svc:
        return JSONResponse({"detail": "Dịch vụ này My chưa mở — bạn chọn món khác nhé."}, status_code=404)
    cleaned, err = validate_input(service_type, body.get("input") or {})
    if err:
        return JSONResponse({"detail": err}, status_code=422)

    maybe_purge_ai_readings(db)

    code = str(body.get("payment_code", "")).strip()
    payment = db.query(Payment).filter(Payment.code == code).first()
    if not payment or payment.status != PaymentStatus.paid:
        return JSONResponse(
            {"detail": "My chưa nhận được phí trà của đơn này — bạn quét QR thanh toán trước nhé."},
            status_code=402,
        )
    if payment.service_type != service_type:
        return JSONResponse({"detail": "Đơn này không khớp món bạn đang xem."}, status_code=422)

    # Đơn đã dùng để mở 1 bản full rồi → trả lại bản cũ (không gọi AI lại).
    existing = (
        db.query(AiReading)
        .filter(AiReading.payment_id == payment.id, AiReading.full_result.is_not(None))
        .first()
    )
    if existing and existing.full_result:
        logger.info(
            "ai.full reused service=%s payment_id=%s id=%s",
            service_type, payment.id, existing.id,
        )
        return {"id": existing.id, "service": service_type, "full_result": existing.full_result}

    try:
        computed = svc["compute"](cleaned)
    except Exception:
        return JSONResponse({"detail": "Thông tin này My xem chưa ra — bạn kiểm tra lại giúp My nhé."}, status_code=422)
    summary = describe_computed(service_type, computed, level="full")
    text, err = await ai.interpret(summary, full=True)
    if err:
        return JSONResponse({"detail": err}, status_code=502)

    reading = AiReading(
        service_type=service_type,
        input_json=json.dumps(cleaned, ensure_ascii=False),
        input_hash=canonical_hash(service_type, cleaned),
        computed_json=json.dumps(computed, ensure_ascii=False),
        basic_result="",
        full_result=text,
        payment_id=payment.id,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    logger.info(
        "ai.full generated service=%s payment_id=%s id=%s chars=%d",
        service_type, payment.id, reading.id, len(text),
    )
    return {"id": reading.id, "service": service_type, "full_result": text}
