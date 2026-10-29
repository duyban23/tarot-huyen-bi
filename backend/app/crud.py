from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session, joinedload

from app.config import SLOT_INTERVAL, WORK_END, WORK_START

VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def _now_vn() -> datetime:
    return datetime.now(VN_TZ)
from app.models import (
    ApplicationStatus,
    Booking,
    BookingStatus,
    ContactMessage,
    IdolApplication,
    Service,
)


# ---------- Service ----------
def get_active_services(db: Session) -> list[Service]:
    return db.query(Service).filter(Service.is_active.is_(True)).all()


def get_all_services(db: Session) -> list[Service]:
    return db.query(Service).order_by(Service.id).all()


def get_service(db: Session, service_id: int) -> Service | None:
    return db.query(Service).filter(Service.id == service_id).first()


def create_service(db: Session, data: dict) -> Service:
    svc = Service(**data)
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc


def update_service(db: Session, service_id: int, data: dict) -> Service | None:
    svc = get_service(db, service_id)
    if not svc:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(svc, k, v)
    db.commit()
    db.refresh(svc)
    return svc


def delete_service(db: Session, service_id: int) -> bool:
    svc = get_service(db, service_id)
    if not svc:
        return False
    try:
        db.delete(svc)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise


# ---------- Availability ----------
def _generate_slots() -> list[time]:
    slots = []
    start = WORK_START * 60  # minutes from midnight
    end = WORK_END * 60
    for m in range(start, end, SLOT_INTERVAL):
        slots.append(time(hour=m // 60, minute=m % 60))
    return slots


def _interval_overlaps(
    a_start: time, a_dur: int, b_start: time, b_dur: int
) -> bool:
    """Check if [a_start, a_start + a_dur) overlaps [b_start, b_start + b_dur)."""
    a_begin = a_start.hour * 60 + a_start.minute
    a_end = a_begin + a_dur
    b_begin = b_start.hour * 60 + b_start.minute
    b_end = b_begin + b_dur
    return a_begin < b_end and b_begin < a_end


def get_available_slots(
    db: Session, service_id: int, target_date: date
) -> list[str]:
    service = get_service(db, service_id)
    if not service:
        return []

    # find all non-cancelled bookings for that date
    booked = (
        db.query(Booking)
        .options(joinedload(Booking.service))
        .filter(
            Booking.appointment_date == target_date,
            Booking.status != BookingStatus.cancelled,
        )
        .all()
    )

    result: list[str] = []
    now = _now_vn().replace(tzinfo=None)
    for slot in _generate_slots():
        slot_dt = datetime.combine(target_date, slot)
        # skip past slots
        if slot_dt <= now:
            continue
        # check work-hours boundary
        slot_start_minutes = slot.hour * 60 + slot.minute
        if slot_start_minutes + service.duration_minutes > WORK_END * 60:
            continue
        # check overlap with existing bookings
        overlaps = False
        for b in booked:
            if _interval_overlaps(
                slot, service.duration_minutes,
                b.appointment_time, b.service.duration_minutes,
            ):
                overlaps = True
                break
        if not overlaps:
            result.append(slot.strftime("%H:%M"))
    return result


# ---------- Booking ----------
def create_booking(db: Session, data: dict) -> Booking:
    booking = Booking(**data)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def get_bookings(
    db: Session, status_filter: str | None = None, date_filter: date | None = None
) -> list[Booking]:
    q = db.query(Booking)
    if status_filter:
        q = q.filter(Booking.status == status_filter)
    if date_filter:
        q = q.filter(Booking.appointment_date == date_filter)
    return q.order_by(Booking.appointment_date.desc(), Booking.appointment_time).all()


def update_booking_status(db: Session, booking_id: int, status: str) -> Booking | None:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        return None
    booking.status = BookingStatus(status)
    db.commit()
    db.refresh(booking)
    return booking


def delete_booking(db: Session, booking_id: int) -> bool:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        return False
    db.delete(booking)
    db.commit()
    return True


# ---------- Idol applications ----------
def create_idol_application(db: Session, data: dict) -> IdolApplication:
    app = IdolApplication(**data)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def get_idol_applications(
    db: Session, status_filter: str | None = None
) -> list[IdolApplication]:
    q = db.query(IdolApplication)
    if status_filter:
        q = q.filter(IdolApplication.status == status_filter)
    return q.order_by(IdolApplication.created_at.desc()).all()


def update_idol_application_status(
    db: Session, application_id: int, status: str
) -> IdolApplication | None:
    app = db.query(IdolApplication).filter(IdolApplication.id == application_id).first()
    if not app:
        return None
    app.status = ApplicationStatus(status)
    db.commit()
    db.refresh(app)
    return app


def delete_idol_application(db: Session, application_id: int) -> bool:
    app = db.query(IdolApplication).filter(IdolApplication.id == application_id).first()
    if not app:
        return False
    db.delete(app)
    db.commit()
    return True


# ---------- Contact messages ----------
def create_contact_message(db: Session, data: dict) -> ContactMessage:
    msg = ContactMessage(**data)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_contact_messages(
    db: Session, unread_only: bool = False
) -> list[ContactMessage]:
    q = db.query(ContactMessage)
    if unread_only:
        q = q.filter(ContactMessage.is_read.is_(False))
    return q.order_by(ContactMessage.created_at.desc()).all()


def mark_contact_message_read(
    db: Session, message_id: int
) -> ContactMessage | None:
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        return None
    msg.is_read = True
    db.commit()
    db.refresh(msg)
    return msg


def delete_contact_message(db: Session, message_id: int) -> bool:
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        return False
    db.delete(msg)
    db.commit()
    return True
