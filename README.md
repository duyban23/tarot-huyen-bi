# Tarot Huyền Bí 🔮 — Website đặt lịch Tarot

Full-stack website đặt lịch hẹn bói Tarot với **Sola Busca (1491)** 78 lá bài public-domain, hiệu ứng 3D flip và floating animation.

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL (NeonDB)
- **Frontend:** React 18 + TypeScript + Vite + Tailwind v4 + animejs
- **CI/CD:** GitHub Actions (build check + security scan)

## ✨ Highlights

| Tính năng | |
|---|---|
| 🃏 **78 lá Sola Busca** | 22 Major Arcana + 56 Minor Arcana, ảnh JPG/WebP 640px |
| 🔄 **Card flip 3D** | Click lật ngửa/úp, double-click đổi bài, auto-flip mỗi 10s |
| 🎨 **Dark theme** | Bảng màu: void, velvet, arcane, lilac, candle-gold |
| 🧭 **Multi-page** | Home, About, Services, Booking, Contact, Admin |
| 🔐 **Admin panel** | JWT auth, CRUD bookings + services |
| 📱 **Responsive** | Mobile-first, floating CTA bar |

## 🚀 Quick start

### Yêu cầu

- Python 3.12+
- Node 20+
- UV (`pip install uv`)

### 1. Clone & cài đặt

```bash
git clone https://github.com/Naab2k3/tarot-huyen-bi.git
cd tarot-huyen-bi

# Backend
cd backend
python -m uv venv .venv
.venv/Scripts/python -m uv pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Cấu hình

```bash
cp backend/.env.example backend/.env
```

Sửa `backend/.env`:

| Biến | Mô tả |
|---|---|
| `DATABASE_URL` | **Bắt buộc.** PostgreSQL URL (VD: NeonDB) |
| `ADMIN_USERNAME` | Tên đăng nhập admin (default: `admin`) |
| `ADMIN_PASSWORD_HASH` | **Bắt buộc.** bcrypt hash của mật khẩu admin |
| `SECRET_KEY` | Khóa JWT — đổi thành chuỗi ngẫu nhiên |
| `CORS_ORIGINS` | Origin được phép CORS |

> Tạo hash: `python -c "import sys; sys.path.insert(0, 'backend'); from app.auth import hash_password; print(hash_password('mat-khau-cua-ban'))"`

### 3. Database

```bash
cd backend
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -c "from app.seed import seed_services; from app.database import SessionLocal; seed_services(SessionLocal())"
```

### 4. Build frontend + chạy

```bash
cd frontend
npm run build

cd ../backend
.venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Mở **http://localhost:8000**

> FastAPI serve cả API lẫn frontend static — không cần 2 server.

## 🃏 Tarot Cards

78 lá **Sola Busca (1491, public-domain)** trong `frontend/public/images/cards/` — tải bằng `scripts/download-sola-busca.py` (nguồn: mixvlad/TarotCards, gốc Wikimedia Commons):

| Bộ | Số lượng | File |
|---|---|---|
| Major Arcana | 22 | `m00.jpg`–`m21.jpg` |
| Cups (Cốc) | 14 | `c01.jpg`–`c14.jpg` |
| Pentacles (Tiền) | 14 | `p01.jpg`–`p14.jpg` |
| Swords (Kiếm) | 14 | `s01.jpg`–`s14.jpg` |
| Wands (Gậy) | 14 | `w01.jpg`–`w14.jpg` |

Dữ liệu (tên, ý nghĩa tiếng Việt): `frontend/public/data/tarot-cards.json` — load dynamic, không hardcode.

## 🔌 API

### Public

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/services` | Dịch vụ đang active |
| GET | `/api/bookings/availability?service_id=&date_str=YYYY-MM-DD` | Khung giờ trống (full-time 0-24, giờ VN) |
| POST | `/api/bookings` | Tạo booking (race-condition guard → 409) |
| POST | `/api/contact` | Gửi tin nhắn liên hệ |
| POST | `/api/recruit` | Gửi đơn ứng tuyển idol |

### Admin (Bearer JWT)

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/admin/login` | Đăng nhập → token |
| GET | `/api/admin/bookings` | Danh sách booking |
| PATCH | `/api/admin/bookings/{id}` | Cập nhật trạng thái |
| DELETE | `/api/admin/bookings/{id}` | Xóa booking |
| GET | `/api/admin/services` | Tất cả dịch vụ |
| POST | `/api/admin/services` | Thêm dịch vụ |
| PUT | `/api/admin/services/{id}` | Sửa dịch vụ |
| DELETE | `/api/admin/services/{id}` | Xóa dịch vụ |
| GET | `/api/admin/applications` | Danh sách đơn ứng tuyển |
| PATCH | `/api/admin/applications/{id}` | Cập nhật trạng thái đơn |
| DELETE | `/api/admin/applications/{id}` | Xóa đơn |
| GET | `/api/admin/messages` | Danh sách tin nhắn liên hệ |
| PATCH | `/api/admin/messages/{id}` | Đánh dấu đã đọc |
| DELETE | `/api/admin/messages/{id}` | Xóa tin nhắn |

## 🎨 Design System

- **Colors:** `#0d0812` (void), `#2a1830` (velvet), `#a07392` (arcane), `#cfa4ba` (lilac), `#d4a843` (candle-gold), `#f0e8ed` (mist)
- **Fonts:** Playfair Display (headings), Cormorant Garamond (body)
- **Animations:** StarField canvas, FloatingTarotCards (float + flip + swap), CountUp, SparkleButton, HeroTextReveal

## 📁 Project structure

```
tarot-huyen-bi/
├── .github/workflows/ci.yml   # CI: build + sec scan
├── frontend/
│   ├── public/
│   │   ├── data/tarot-cards.json   # 78 cards data
│   │   └── images/cards/           # 78 Sola Busca JPGs + WebPs
│   ├── src/
│   │   ├── components/             # StarField, FloatingTarotCards, Navbar, …
│   │   ├── pages/                  # Home, About, Services, Booking, Contact, Admin
│   │   └── styles/index.css        # Tailwind v4 + tokens
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI + static serving
│   │   ├── models.py               # Service, Booking ORM
│   │   ├── schemas.py              # Pydantic v2
│   │   ├── auth.py                 # JWT + bcrypt
│   │   ├── crud.py                 # Booking logic
│   │   └── seed.py                 # Seed data
│   ├── alembic/                    # Migrations
│   └── requirements.txt
└── scripts/download-sola-busca.py  # Tải 78 Sola Busca cards (Wikimedia Commons)
```

## 🔒 CI/CD

GitHub Actions chạy khi push/PR vào `main`:

| Job | Check |
|---|---|
| **Frontend build** | `tsc` + `vite build` + `npm audit` |
| **Backend import** | `pip install` + `bandit` scan + app load verify |
| **Tarot JSON** | Validate 78 cards, no dupes, fields complete |

## 📝 Ghi chú

- Admin mặc định: `admin` / hash từ `ADMIN_PASSWORD_HASH`
- Booking có race-condition guard (HTTP 409 nếu slot vừa bị đặt)
- Chạy local không cần Docker — FastAPI serve luôn frontend static
