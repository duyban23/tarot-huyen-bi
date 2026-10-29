from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import create_contact_message
from app.database import get_db
from app.schemas import ContactMessageCreate, ContactMessageOut

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", response_model=ContactMessageOut, status_code=201)
def submit_contact_message(body: ContactMessageCreate, db: Session = Depends(get_db)):
    msg = create_contact_message(
        db,
        {
            "name": body.name,
            "email": body.email,
            "phone": body.phone,
            "message": body.message,
            "is_read": False,
        },
    )
    return msg
