from datetime import date, datetime, time
import re

from pydantic import BaseModel, Field, field_validator


def _normalize_phone(v: str | None) -> str | None:
    if v is None:
        return v
    cleaned = re.sub(r"[\s.\-()]", "", v)
    return cleaned


EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


# ---------- Service ----------
class ServiceOut(BaseModel):
    id: int
    name: str
    description: str
    duration_minutes: int
    price: int
    is_active: bool

    model_config = {"from_attributes": True}


class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    duration_minutes: int = Field(..., gt=0)
    price: int = Field(..., ge=0)
    is_active: bool = True


class ServiceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    duration_minutes: int | None = Field(None, gt=0)
    price: int | None = Field(None, ge=0)
    is_active: bool | None = None


# ---------- Booking ----------
class BookingCreate(BaseModel):
    service_id: int
    date: date
    time: str = Field(..., description="HH:MM format")
    meeting_method: str = Field(
        ...,
        pattern=r"^(online|offline)$",
        description="Hình thức xem: online (gọi video) hoặc offline (gặp trực tiếp)",
    )
    customer_name: str = Field(..., min_length=1, max_length=200)
    customer_phone: str = Field(
        ...,
        min_length=10,
        max_length=20,
        description="Phone number: 10-15 digits, optional leading +, spaces/dashes/dots allowed",
    )
    customer_email: str | None = Field(None, pattern=EMAIL_PATTERN)
    note: str | None = None

    @field_validator("customer_phone")
    @classmethod
    def normalize_customer_phone(cls, v: str) -> str:
        cleaned = _normalize_phone(v)
        assert cleaned is not None
        if not re.fullmatch(r"^\+?\d{10,15}$", cleaned):
            raise ValueError("Phone number must be 10-15 digits, optional leading +")
        return cleaned

    @field_validator("customer_email")
    @classmethod
    def normalize_customer_email(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        return v.strip()


class BookingOut(BaseModel):
    id: int
    service_id: int
    customer_name: str
    customer_phone: str
    customer_email: str | None
    appointment_date: date
    appointment_time: time
    status: str
    meeting_method: str
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(confirmed|cancelled)$")


# ---------- Idol applications ----------
class IdolApplicationCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(
        ...,
        min_length=10,
        max_length=20,
        description="Phone number: 10-15 digits, optional leading +, spaces/dashes/dots allowed",
    )
    email: str | None = Field(None, pattern=EMAIL_PATTERN)
    social_link: str | None = None
    reason: str = Field(..., min_length=1, max_length=4000)
    experience: str | None = None

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        cleaned = _normalize_phone(v)
        assert cleaned is not None
        if not re.fullmatch(r"^\+?\d{10,15}$", cleaned):
            raise ValueError("Phone number must be 10-15 digits, optional leading +")
        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        return v.strip()


class IdolApplicationOut(BaseModel):
    id: int
    full_name: str
    phone: str
    email: str | None
    social_link: str | None
    reason: str
    experience: str | None
    status: str
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class IdolApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(contacted|accepted|rejected)$")


# ---------- Contact messages ----------
class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., min_length=3, max_length=200, pattern=EMAIL_PATTERN)
    phone: str | None = Field(None, max_length=20)
    message: str = Field(..., min_length=1, max_length=4000)

    @field_validator("phone")
    @classmethod
    def normalize_contact_phone(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        cleaned = _normalize_phone(v)
        assert cleaned is not None
        if not re.fullmatch(r"^\+?\d{10,15}$", cleaned):
            raise ValueError("Phone number must be 10-15 digits, optional leading +")
        return cleaned


class ContactMessageOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Admin auth ----------
class AdminLogin(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
