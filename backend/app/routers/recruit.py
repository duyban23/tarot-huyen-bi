from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import create_idol_application
from app.database import get_db
from app.models import ApplicationStatus
from app.schemas import IdolApplicationCreate, IdolApplicationOut

router = APIRouter(prefix="/api/recruit", tags=["recruit"])


@router.post("", response_model=IdolApplicationOut, status_code=201)
def submit_idol_application(body: IdolApplicationCreate, db: Session = Depends(get_db)):
    app = create_idol_application(
        db,
        {
            "full_name": body.full_name,
            "phone": body.phone,
            "email": body.email,
            "social_link": body.social_link,
            "reason": body.reason,
            "experience": body.experience,
            "status": ApplicationStatus.pending,
        },
    )
    return app
