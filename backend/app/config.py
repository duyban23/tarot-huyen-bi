import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://tarot_user:tarot_pass@localhost:5432/tarot_db",
)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
# Docker Compose dùng `$$` để escape `$` trong env_file, còn bcrypt cần `$` đơn.
# .replace() để chạy được cả local (uvicorn) lẫn Docker.
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "").replace("$$", "$")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:80").split(",")

WORK_START = 0  # 00:00 — full time
WORK_END = 24  # 24:00 — full time
SLOT_INTERVAL = 30  # minutes
