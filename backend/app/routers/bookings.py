from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import create_booking, get_available_slots
from app.database import get_db
from app.models import Booking, BookingStatus, MeetingMethod, Service
from app.schemas import BookingCreate, BookingOut

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("/availability", response_model=list[str])
def check_availability(
    service_id: int,
    date_str: str,
    db: Session = Depends(get_db),
):
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format (use YYYY-MM-DD)")

    slots = get_available_slots(db, service_id, target_date)
    return slots


@router.post("", response_model=BookingOut, status_code=201)
def create_new_booking(body: BookingCreate, db: Session = Depends(get_db)):
    # validate service
    service = db.query(Service).filter(Service.id == body.service_id).first()
    if not service or not service.is_active:
        raise HTTPException(status_code=404, detail="Service not found or inactive")

    # validate date
    try:
        appointment_date = body.date
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid date")

    # validate time
    try:
        appointment_time = time.fromisoformat(body.time)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid time format")

    now = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).replace(tzinfo=None)
    slot_dt = datetime.combine(appointment_date, appointment_time)
    if slot_dt <= now:
        raise HTTPException(status_code=400, detail="Cannot book in the past")

    # re-check availability (race-condition guard)
    available = get_available_slots(db, body.service_id, appointment_date)
    if body.time not in available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time slot is no longer available. Please choose another time.",
        )

    try:
        booking = create_booking(
            db,
            {
                "service_id": body.service_id,
                "customer_name": body.customer_name,
                "customer_phone": body.customer_phone,
                "customer_email": body.customer_email,
                "appointment_date": appointment_date,
                "appointment_time": appointment_time,
                "meeting_method": MeetingMethod(body.meeting_method),
                "note": body.note,
                "status": BookingStatus.pending,
            },
        )
    except IntegrityError:
        # Lost the race: another request booked this exact slot between our
        # availability check and this insert. The partial unique index
        # bookings_slot_uniq is the backstop. Same 409 as the app guard.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time slot was just taken. Please choose another time.",
        )
    return booking
