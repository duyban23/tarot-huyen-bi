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
_DEFAULT_SECRET_KEY = "dev-secret-change-in-production"
_UNSAFE_SECRET_KEYS = {
    _DEFAULT_SECRET_KEY,
    "change-this-to-a-random-secret-key-in-production",
}
SECRET_KEY = os.getenv("SECRET_KEY", _DEFAULT_SECRET_KEY)


def _is_unsafe_secret(secret: str) -> bool:
    return secret in _UNSAFE_SECRET_KEYS or len(secret) < 32


# Prod mà dùng secret mặc định/ngắn thì JWT admin có thể bị giả. Fail-fast còn
# hơn âm thầm chạy với khóa ai cũng biết. Preview/local vẫn cho chạy để test.
if os.getenv("VERCEL_ENV") == "production" and _is_unsafe_secret(SECRET_KEY):
    raise RuntimeError(
        "SECRET_KEY must be set to a random value of at least 32 characters "
        "for production deployments."
    )
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:80").split(",")

WORK_START = 0  # 00:00 — full time
WORK_END = 24  # 24:00 — full time
SLOT_INTERVAL = 30  # minutes

# ---------- AI (Gemini) ----------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
# Model chính bị quá tải (503) thì tự chuyển sang các model này, theo thứ tự.
GEMINI_FALLBACK_MODELS = [
    m.strip()
    for m in os.getenv(
        "GEMINI_FALLBACK_MODELS", "gemini-3.6-flash,gemini-3.5-flash"
    ).split(",")
    if m.strip()
]
# Giữ dưới maxDuration 60s của Vercel để kịp trả lỗi thân thiện thay vì bị cắt.
# 30s là đủ: bản full thực tế ~8-15s, còn dư thời gian cho model dự phòng.
GEMINI_TIMEOUT_SECONDS = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "30"))
# Lượt xem free tối đa mỗi IP / mỗi dịch vụ / mỗi ngày (chống cháy tiền).
AI_FREE_PER_DAY = int(os.getenv("AI_FREE_PER_DAY", "5"))
# Bump khi đổi prompt/model/kho tri thức để bỏ cache kết quả cũ.
AI_CACHE_VERSION = os.getenv("AI_CACHE_VERSION", "2026-10-31.4")
# Tự xoá bản xem AI cũ hơn số ngày này (giới hạn lưu tên/ngày giờ sinh).
AI_READING_RETENTION_DAYS = int(os.getenv("AI_READING_RETENTION_DAYS", "90"))

# ---------- SePay ----------
SEPAY_WEBHOOK_SECRET = os.getenv("SEPAY_WEBHOOK_SECRET", "")
# Bật chế độ thanh toán demo: khách bấm xác nhận là đơn tự thành paid,
# không gọi SePay và không hiện STK/QR thật. Tắt = quay lại luồng thật.
PAYMENT_DEMO_MODE = os.getenv("PAYMENT_DEMO_MODE", "0") == "1"
# Mở bản đầy đủ cho mọi người xem thử, KHÔNG cần thanh toán. Vẫn chặn quota
# theo IP + tổng lượt/ngày bên dưới vì Gemini tốn phí thật. Đặt 0 để đóng lại.
AI_FULL_DEMO_OPEN = os.getenv("AI_FULL_DEMO_OPEN", "1") == "1"
# Tiền là giả nhưng Gemini vẫn tốn phí thật → vẫn phải chặn quota bản full.
AI_DEMO_FULL_PER_DAY = int(os.getenv("AI_DEMO_FULL_PER_DAY", "2"))
AI_DEMO_FULL_GLOBAL_PER_DAY = int(os.getenv("AI_DEMO_FULL_GLOBAL_PER_DAY", "30"))
# Thông tin tài khoản nhận tiền để sinh VietQR (demo trước, STK thật sau).
SEPAY_BANK = os.getenv("SEPAY_BANK", "MB")
SEPAY_ACCOUNT = os.getenv("SEPAY_ACCOUNT", "0343993456")
SEPAY_ACCOUNT_NAME = os.getenv("SEPAY_ACCOUNT_NAME", "HEALING WITH MY")
PAYMENT_CODE_PREFIX = os.getenv("PAYMENT_CODE_PREFIX", "HWM")
