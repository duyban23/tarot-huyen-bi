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
from app.config import (
    AI_DEMO_FULL_GLOBAL_PER_DAY,
    AI_DEMO_FULL_PER_DAY,
    AI_FREE_PER_DAY,
    AI_FULL_DEMO_OPEN,
    PAYMENT_DEMO_MODE,
)
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


@router.get("/config")
def ai_config():
    """Cờ cấu hình cho frontend: bản đầy đủ có đang mở thử nghiệm không."""
    return {
        "full_demo_open": AI_FULL_DEMO_OPEN,
        "free_per_day": AI_FREE_PER_DAY,
        "full_demo_per_day": AI_DEMO_FULL_PER_DAY,
    }


@router.post("/reading/full")
async def ai_reading_full(body: dict, request: Request, db: Session = Depends(get_db)):
    service_type = str(body.get("service", ""))
    svc = get_service(service_type)
    if not svc:
        return JSONResponse({"detail": "Dịch vụ này My chưa mở — bạn chọn món khác nhé."}, status_code=404)
    cleaned, err = validate_input(service_type, body.get("input") or {})
    if err:
        return JSONResponse({"detail": err}, status_code=422)

    maybe_purge_ai_readings(db)

    ip_key = client_key(client_ip(request))
    code = str(body.get("payment_code", "")).strip()
    payment = db.query(Payment).filter(Payment.code == code).first() if code else None
    paid = bool(payment and payment.status == PaymentStatus.paid)

    if paid and payment.service_type != service_type:
        return JSONResponse({"detail": "Đơn này không khớp món bạn đang xem."}, status_code=422)

    # Chưa trả phí: chỉ mở khi đang bật chế độ xem thử (vẫn chặn quota bên dưới).
    if not paid and not AI_FULL_DEMO_OPEN:
        return JSONResponse(
            {"detail": "My chưa nhận được phí trà của đơn này — bạn quét QR thanh toán trước nhé."},
            status_code=402,
        )

    # Đơn đã dùng để mở 1 bản full rồi → trả lại bản cũ (không gọi AI lại).
    if paid:
        existing = (
            db.query(AiReading)
            .filter(AiReading.payment_id == payment.id, AiReading.full_result.is_not(None))
            .first()
        )
    else:
        # Xem thử mở tự do: cùng lá số thì trả lại bản đã viết, không tốn thêm lượt.
        existing = (
            db.query(AiReading)
            .filter(
                AiReading.service_type == service_type,
                AiReading.input_hash == canonical_hash(service_type, cleaned),
                AiReading.full_result.is_not(None),
            )
            .order_by(AiReading.id.desc())
            .first()
        )
    if existing and existing.full_result:
        logger.info(
            "ai.full reused service=%s payment_id=%s id=%s demo=%s",
            service_type, payment.id if paid else None, existing.id, not paid,
        )
        return {
            "id": existing.id,
            "service": service_type,
            "full_result": existing.full_result,
            "demo": not paid,
        }

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    # Demo thanh toán: tiền là giả nhưng Gemini vẫn tốn phí thật → chặn theo IP
    # và tổng lượt/ngày. Đặt sau cache để xem lại/retry không bị trừ lượt.
    if paid and PAYMENT_DEMO_MODE:
        used = (
            db.query(AiReading)
            .filter(
                AiReading.client_ip_hash == ip_key,
                AiReading.full_result.is_not(None),
                AiReading.created_at >= cutoff,
            )
            .count()
        )
        if used >= AI_DEMO_FULL_PER_DAY:
            logger.info(
                "ai.demo quota blocked ip_service=%s used=%d limit=%d",
                service_type, used, AI_DEMO_FULL_PER_DAY,
            )
            return JSONResponse(
                {"detail": "Hôm nay bạn đã xem hết lượt bản đầy đủ trong đợt thử nghiệm — hẹn bạn ngày mai nhé."},
                status_code=429,
            )
        total = (
            db.query(AiReading)
            .filter(
                AiReading.full_result.is_not(None),
                AiReading.created_at >= cutoff,
            )
            .count()
        )
        if total >= AI_DEMO_FULL_GLOBAL_PER_DAY:
            logger.info(
                "ai.demo global cap blocked total=%d limit=%d",
                total, AI_DEMO_FULL_GLOBAL_PER_DAY,
            )
            return JSONResponse(
                {"detail": "My đã nhận đủ lượt xem thử nghiệm hôm nay — bạn quay lại ngày mai nhé."},
                status_code=429,
            )

    # Mở thử nghiệm không cần thanh toán: quota riêng, chỉ đếm các bản demo.
    if not paid:
        used = (
            db.query(AiReading)
            .filter(
                AiReading.client_ip_hash == ip_key,
                AiReading.payment_id.is_(None),
                AiReading.full_result.is_not(None),
                AiReading.created_at >= cutoff,
            )
            .count()
        )
        if used >= AI_DEMO_FULL_PER_DAY:
            logger.info(
                "ai.open-demo quota blocked service=%s used=%d limit=%d",
                service_type, used, AI_DEMO_FULL_PER_DAY,
            )
            return JSONResponse(
                {"detail": "Hôm nay bạn đã xem hết lượt bản đầy đủ miễn phí — hẹn bạn ngày mai nhé."},
                status_code=429,
            )
        total = (
            db.query(AiReading)
            .filter(
                AiReading.payment_id.is_(None),
                AiReading.full_result.is_not(None),
                AiReading.created_at >= cutoff,
            )
            .count()
        )
        if total >= AI_DEMO_FULL_GLOBAL_PER_DAY:
            logger.info(
                "ai.open-demo global cap blocked total=%d limit=%d",
                total, AI_DEMO_FULL_GLOBAL_PER_DAY,
            )
            return JSONResponse(
                {"detail": "My đã nhận đủ lượt xem miễn phí hôm nay — bạn quay lại ngày mai nhé."},
                status_code=429,
            )

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
        payment_id=payment.id if paid else None,
        # Giữ hash IP cho bản thử nghiệm để đếm quota; flow trả tiền thật thì không lưu.
        client_ip_hash=ip_key if (not paid or PAYMENT_DEMO_MODE) else None,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    logger.info(
        "ai.full generated service=%s payment_id=%s id=%s demo=%s chars=%d",
        service_type, payment.id if paid else None, reading.id, not paid, len(text),
    )
    return {
        "id": reading.id,
        "service": service_type,
        "full_result": text,
        "demo": not paid,
    }
