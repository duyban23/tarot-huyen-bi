import os
from contextlib import asynccontextmanager
from pathlib import Path

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

from app.config import ADMIN_PASSWORD_HASH, CORS_ORIGINS, SECRET_KEY
from app.database import Base, SessionLocal, engine
from app.routers import admin, bookings, contact, recruit, services
from app.seed import seed_services

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# On Vercel the SPA is served from the CDN (outputDirectory), not from here;
# this is the fallback for running `uvicorn app.main:app` directly.
FRONTEND_DIST = _REPO_ROOT / "frontend" / "dist"

logger = logging.getLogger(__name__)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup checks
    if not ADMIN_PASSWORD_HASH:
        logger.warning(
            "ADMIN_PASSWORD_HASH is empty! Admin login will fail until you set it. "
            "See backend/.env.example for instructions."
        )
    if SECRET_KEY == "dev-secret-change-in-production":
        logger.warning(
            "SECRET_KEY is set to the default value! Change it in production. "
            "See backend/.env.example"
        )

    # create_all chỉ chạy khi được bật rõ ràng (local dev). Trên Vercel schema
    # do Alembic quản lý, và DDL reflection tốn thời gian ở mỗi cold start.
    if os.getenv("RUN_STARTUP_TASKS", "1" if not os.getenv("VERCEL") else "0") == "1":
        try:
            Base.metadata.create_all(bind=engine)
        except Exception:
            # Serverless (Vercel) cold-start: DB (Neon) có thể lag/timeout.
            # Không crash app — request tiếp theo sẽ thử lại.
            # Local dev: kiểm tra Postgres đã chạy chưa (docker compose up).
            logger.exception(
                "Database create_all failed — check DATABASE_URL and DB availability"
            )

    # seed chạy CẢ trên Vercel: đây là cách duy nhất giữ menu trong code khớp DB
    # production. Nếu bỏ, DB cũ vẫn còn bộ tên cũ → link `/booking?service=<tên
    # mới>` không khớp service nào, trang đặt lịch không nhảy sang bước chọn giờ.
    # seed idempotent (1 SELECT + chỉ insert phần thiếu / tắt phần bỏ), chi phí
    # thấp hơn hẳn create_all nên chấp nhận được ở cold start.
    db = SessionLocal()
    try:
        seed_services(db)
    except Exception:
        logger.exception("seed_services failed — skipping")
    finally:
        db.close()
    yield


app = FastAPI(title="Tarot Booking API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(contact.router)
app.include_router(recruit.router)
app.include_router(admin.router)

class _ImmutableStaticFiles(StaticFiles):
    """Vite emits content-hashed filenames under /assets, so they can be
    cached forever. StaticFiles alone only sets ETag/Last-Modified."""

    def file_response(self, full_path, stat_result, scope, status_code=200):
        response = super().file_response(full_path, stat_result, scope, status_code)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


class _SPAStaticFiles(StaticFiles):
    """Static files with a fallback to index.html for client-side routes.

    Deep links like /booking have no file behind them, so plain StaticFiles
    would 404 them — hand back the SPA shell instead. /api/* is excluded
    because those misses are real 404s, not SPA routes.

    Serving through StaticFiles also keeps path normalisation and the
    containment check inside the library instead of reimplementing them.
    """

    async def get_response(self, path: str, scope) -> Response:
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code != 404 or scope["path"].startswith("/api/"):
                raise
            return await super().get_response("index.html", scope)


# ── Serve frontend static files ──
_INDEX_HTML = FRONTEND_DIST / "index.html"

if _INDEX_HTML.is_file():
    # Mount assets explicitly so they get immutable caching. Guarded on the
    # directory existing: StaticFiles raises at import time otherwise, which
    # would take down the whole app rather than just the static route.
    _ASSETS_DIR = FRONTEND_DIST / "assets"
    if _ASSETS_DIR.is_dir():
        app.mount("/assets", _ImmutableStaticFiles(directory=str(_ASSETS_DIR)), name="assets")

    # Registered after the /assets mount and the API routers so those win.
    app.mount("/", _SPAStaticFiles(directory=str(FRONTEND_DIST), html=True), name="spa")

    logger.info("Frontend static files mounted from %s", FRONTEND_DIST)
else:
    logger.warning("Frontend dist not found at %s — run 'npm run build' in frontend/", FRONTEND_DIST)
