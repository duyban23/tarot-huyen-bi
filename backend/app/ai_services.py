"""Registry dịch vụ AI "xem cùng My".

Mỗi dịch vụ khai báo:
- input_schema: frontend tự render form động (không cần sửa FE khi thêm món mới)
- compute(input): code tính toán XÁC ĐỊNH (số/lá/vị trí sao) — Gemini chỉ diễn giải
- prompts: giọng My, cấm chữ "AI"

Quy ước giọng văn (khóa): UI + prompt không bao giờ nhắc "AI/robot/tự động".
"""

from __future__ import annotations

import hashlib
import json
import random
import unicodedata
from datetime import date, datetime
from pathlib import Path
from typing import Any, Callable

from app.config import AI_CACHE_VERSION

# ---------- helpers ----------

# Giới hạn đầu vào theo loại field. Frontend đã chặn, nhưng API vẫn phải tự
# kiểm tra vì client khác có thể gọi thẳng.
_FIELD_MAX_LENGTH = {"text": 200, "textarea": 1000, "date": 10, "time": 5}

_VN_CANS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
_VN_CHIS = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
_VN_NGU_HANH = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"]

# Nạp âm 60 hoa giáp (tra theo can+chi) — bảng chuẩn.
_NAP_AM = {
    ("Giáp", "Tý"): "Hải Trung Kim", ("Ất", "Sửu"): "Hải Trung Kim",
    ("Bính", "Dần"): "Lư Trung Hỏa", ("Đinh", "Mão"): "Lư Trung Hỏa",
    ("Mậu", "Thìn"): "Đại Lâm Mộc", ("Kỷ", "Tỵ"): "Đại Lâm Mộc",
    ("Canh", "Ngọ"): "Lộ Bàng Thổ", ("Tân", "Mùi"): "Lộ Bàng Thổ",
    ("Nhâm", "Thân"): "Kiếm Phong Kim", ("Quý", "Dậu"): "Kiếm Phong Kim",
    ("Giáp", "Tuất"): "Sơn Đầu Hỏa", ("Ất", "Hợi"): "Sơn Đầu Hỏa",
    ("Bính", "Tý"): "Giản Hạ Thủy", ("Đinh", "Sửu"): "Giản Hạ Thủy",
    ("Mậu", "Dần"): "Thành Đầu Thổ", ("Kỷ", "Mão"): "Thành Đầu Thổ",
    ("Canh", "Thìn"): "Bạch Lạp Kim", ("Tân", "Tỵ"): "Bạch Lạp Kim",
    ("Nhâm", "Ngọ"): "Dương Liễu Mộc", ("Quý", "Mùi"): "Dương Liễu Mộc",
    ("Giáp", "Thân"): "Tuyền Trung Thủy", ("Ất", "Dậu"): "Tuyền Trung Thủy",
    ("Mậu", "Tuất"): "Bình Địa Mộc", ("Kỷ", "Hợi"): "Bình Địa Mộc",
    ("Bính", "Thân"): "Sơn Hạ Hỏa", ("Đinh", "Dậu"): "Sơn Hạ Hỏa",
    ("Canh", "Tý"): "Bích Thượng Thổ", ("Tân", "Sửu"): "Bích Thượng Thổ",
    ("Nhâm", "Dần"): "Kim Bạch Kim", ("Quý", "Mão"): "Kim Bạch Kim",
    ("Giáp", "Thìn"): "Phú Đăng Hỏa", ("Ất", "Tỵ"): "Phú Đăng Hỏa",
    ("Bính", "Ngọ"): "Thiên Hà Thủy", ("Đinh", "Mùi"): "Thiên Hà Thủy",
    ("Mậu", "Thân"): "Đại Trạch Thổ", ("Kỷ", "Dậu"): "Đại Trạch Thổ",
    ("Canh", "Tuất"): "Thoa Xuyến Kim", ("Tân", "Hợi"): "Thoa Xuyến Kim",
    ("Nhâm", "Tý"): "Tang Đố Mộc", ("Quý", "Sửu"): "Tang Đố Mộc",
    ("Giáp", "Dần"): "Đại Khê Thủy", ("Ất", "Mão"): "Đại Khê Thủy",
    ("Bính", "Thìn"): "Sa Trung Thổ", ("Đinh", "Tỵ"): "Sa Trung Thổ",
    ("Mậu", "Ngọ"): "Thiên Thượng Hỏa", ("Kỷ", "Mùi"): "Thiên Thượng Hỏa",
    ("Canh", "Thân"): "Thạch Lựu Mộc", ("Tân", "Dậu"): "Thạch Lựu Mộc",
    ("Nhâm", "Tuất"): "Đại Hải Thủy", ("Quý", "Hợi"): "Đại Hải Thủy",
}

# Tọa độ ~20 tỉnh/thành để tính bản đồ sao (lat, lng).
PROVINCES: dict[str, tuple[float, float]] = {
    "Hà Nội": (21.03, 105.85), "Hải Phòng": (20.86, 106.68),
    "Ninh Bình": (20.25, 105.97), "Nghệ An": (18.67, 105.69),
    "Huế": (16.46, 107.59), "Đà Nẵng": (16.05, 108.20),
    "TP. Hồ Chí Minh": (10.82, 106.63), "Cần Thơ": (10.03, 105.77),
    "Hải Dương": (20.94, 106.33), "Nam Định": (20.42, 106.17),
    "Thanh Hóa": (19.80, 105.77), "Quảng Ninh": (21.00, 107.00),
    "Bắc Ninh": (21.18, 106.08), "Vĩnh Phúc": (21.30, 105.60),
    "Hưng Yên": (20.65, 106.05), "Thái Bình": (20.45, 106.33),
    "Khánh Hòa": (12.24, 109.19), "Lâm Đồng": (11.94, 108.45),
    "Bình Dương": (11.00, 106.65), "Đồng Nai": (10.95, 106.82),
}

_SIGNS_VN = [
    "Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải", "Sư Tử", "Xử Nữ",
    "Thiên Bình", "Bọ Cạp", "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư",
]


def canonical_hash(service_type: str, data: dict) -> str:
    # Version nằm trong hash để đổi prompt/model/kho tri thức là cache cũ tự
    # miss, không phải xoá tay bảng ai_readings.
    raw = (
        f"{AI_CACHE_VERSION}|{service_type}|"
        + json.dumps(data, sort_keys=True, ensure_ascii=False)
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _strip_vn(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower()).replace("đ", "d")
    return "".join(c for c in s if c.isalpha())


def _reduce(n: int) -> int:
    while n > 9 and n not in (11, 22, 33):
        n = sum(int(c) for c in str(n))
    return n


def _letter_value(ch: str) -> int:
    return (ord(ch) - ord("a")) % 9 + 1


# ---------- Thần số học ----------

def compute_numerology(inp: dict) -> dict:
    # birth_date YYYY-MM-DD
    y, m, d = (int(x) for x in inp["birth_date"].split("-"))
    life = _reduce(sum(int(c) for c in f"{d:02d}{m:02d}{y}"))
    clean = _strip_vn(inp.get("full_name", ""))
    vals = [_letter_value(c) for c in clean]
    vowels = [_letter_value(c) for c in clean if c in "aeiou"]
    cons = [_letter_value(c) for c in clean if c not in "aeiou"]
    this_year = date.today().year
    personal_year = _reduce(sum(int(c) for c in f"{d:02d}{m:02d}{this_year}"))
    return {
        "so_chu_dao": life,
        "so_su_menh": _reduce(sum(vals)) if vals else None,
        "so_linh_hon": _reduce(sum(vowels)) if vowels else None,
        "so_nhan_cach": _reduce(sum(cons)) if cons else None,
        "nam_ca_nhan": personal_year,
        "nam_hien_tai": this_year,
    }


# ---------- Tarot The Lover / The Heart ----------

_DECK_PATH = Path(__file__).resolve().parent / "data" / "tarot_cards.json"
_DECK: list[dict] | None = None


def _deck() -> list[dict]:
    global _DECK
    if _DECK is None:
        _DECK = json.loads(_DECK_PATH.read_text(encoding="utf-8"))
    return _DECK


def compute_lover_heart(inp: dict) -> dict:
    cards = random.sample(_deck(), 3)
    positions = ["Quá khứ / nền tảng", "Hiện tại / điều đang diễn ra", "Lời nhắn cho bạn"]
    return {
        "cau_hoi": inp.get("question", ""),
        "doi_phuong": inp.get("partner_name") or None,
        "trai_bai": [
            {
                "vi_tri": positions[i],
                "la": c["name"],
                "y_nghia_goc": c.get("meaning", ""),
            }
            for i, c in enumerate(cards)
        ],
    }


# ---------- Bản đồ sao (thuật toán thuần Python: app/astro.py) ----------

def _chart_planets(birth_date: str, birth_time: str, province: str) -> dict | None:
    try:
        from app.astro import chart as astro_chart

        lat, lng = PROVINCES.get(province, PROVINCES["Hà Nội"])
        c = astro_chart(birth_date, birth_time or None, lat, lng)
        out: dict[str, dict] = dict(c["planets"])
        if c.get("ascendant"):
            out["ascendant"] = c["ascendant"]
        return out
    except Exception:
        return None

_ASPECTS = [(0, "trùng tụ"), (60, "lục hợp"), (90, "vuông góc"), (120, "tam hợp"), (180, "đối đỉnh")]


def _aspect_between(lon1: float, lon2: float) -> dict | None:
    diff = abs(lon1 - lon2) % 360
    if diff > 180:
        diff = 360 - diff
    for angle, name in _ASPECTS:
        if abs(diff - angle) <= 6:
            return {"goc": name, "sai_so": round(abs(diff - angle), 1)}
    return None


def compute_natal(inp: dict) -> dict:
    planets = _chart_planets(inp["birth_date"], inp.get("birth_time", "12:00"), inp.get("province", "Hà Nội"))
    return {
        "phuong_phap": "tinh-toan-thien-van" if planets else "cung-mat-troi-uoc-luong",
        "planets": planets,
        "gio_sinh_chinh_xac": bool(inp.get("birth_time")),
    }


def compute_transits_today(natal: dict) -> dict:
    """Transit hôm nay của Mộc/Tinh–Thổ so với natal (vận hạn gần)."""
    today = date.today().isoformat()
    cur = _chart_planets(today, "12:00", "Hà Nội")
    if not natal.get("planets") or not cur:
        return {"kha_dung": False}
    hits = []
    for outer in ("jupiter", "saturn"):
        for inner, label in (("sun", "Mặt Trời"), ("moon", "Mặt Trăng")):
            a = _aspect_between(cur[outer]["lon"], natal["planets"][inner]["lon"])
            if a:
                hits.append({
                    "hanh_tinh": "Sao Mộc" if outer == "jupiter" else "Sao Thổ",
                    "diem_natal": label,
                    **a,
                })
    return {"kha_dung": True, "transit": hits}


def compute_synastry(inp: dict) -> dict:
    a = _chart_planets(inp["a_birth_date"], inp.get("a_birth_time", "12:00"), inp.get("a_province", "Hà Nội"))
    b = _chart_planets(inp["b_birth_date"], inp.get("b_birth_time", "12:00"), inp.get("b_province", "Hà Nội"))
    pairs = []
    if a and b:
        for key, label in (("sun", "Mặt Trời"), ("moon", "Mặt Trăng"), ("venus", "Sao Kim"), ("mars", "Sao Hỏa")):
            asp = _aspect_between(a[key]["lon"], b[key]["lon"])
            pairs.append({
                "cap": f"{label} hai bạn",
                "a_sign": a[key]["sign"], "b_sign": b[key]["sign"],
                "aspect": asp["goc"] if asp else "không có góc chiếu chính",
            })
    return {
        "a": {"ten": inp.get("a_name", "Bạn"), "planets": a},
        "b": {"ten": inp.get("b_name", "Người ấy"), "planets": b},
        "tuong_hop": pairs,
    }


# ---------- Tử vi rút gọn ----------

def _can_chi(year: int) -> tuple[str, str]:
    return _VN_CANS[(year + 6) % 10], _VN_CHIS[(year + 8) % 12]


def compute_tuvi(inp: dict) -> dict:
    y, m, d = (int(x) for x in inp["birth_date"].split("-"))
    hh, mm = (int(x) for x in (inp.get("birth_time") or "12:00").split(":"))
    lunar_d = lunar_m = None
    try:
        from lunar_python import Solar

        lunar = Solar.fromYmdHms(y, m, d, hh, mm, 0).getLunar()
        lunar_d, lunar_m = lunar.getDay(), lunar.getMonth()
        lunar_leap = lunar.isLeapMonth()
    except Exception:
        lunar_leap = False
    can_y, chi_y = _can_chi(y)
    menh = _NAP_AM.get((can_y, chi_y), "")
    gio_chi = _VN_CHIS[((hh + 1) // 2) % 12]
    return {
        "duong_lich": inp["birth_date"],
        "am_lich": f"{lunar_d}/{lunar_m}" + (" (nhuận)" if lunar_leap else "") if lunar_d else "không xác định",
        "nam_can_chi": f"{can_y} {chi_y}",
        "tuoi": _VN_CHIS[(y + 8) % 12],
        "menh_nap_am": menh,
        "gio_sinh_chi": gio_chi,
        "gioi_tinh": inp.get("gender", ""),
    }


# ---------- Registry ----------

Field = dict[str, Any]
ServiceDef = dict[str, Any]

SERVICES: dict[str, ServiceDef] = {
    "ban-do-sao": {
        "name": "Bản đồ sao cùng My",
        "tagline": "Nhìn lên bầu trời ngày bạn chào đời — các vì sao đã sắp đặt điều gì?",
        "price_full": 50000,
        "compute": compute_natal,
        "fields": [
            {"key": "full_name", "label": "Tên của bạn", "type": "text", "required": True},
            {"key": "birth_date", "label": "Ngày sinh", "type": "date", "required": True},
            {"key": "birth_time", "label": "Giờ sinh (không nhớ thì bỏ qua)", "type": "time", "required": False},
            {"key": "province", "label": "Nơi sinh", "type": "select", "options": sorted(PROVINCES), "required": True},
        ],
    },
    "ban-do-sao-doi": {
        "name": "Bản đồ sao đôi cùng My",
        "tagline": "Hai bầu trời gặp nhau — hai bạn hợp nhau ở đâu, cần nhường nhau ở đâu?",
        "price_full": 50000,
        "compute": compute_synastry,
        "fields": [
            {"key": "a_name", "label": "Tên bạn", "type": "text", "required": True},
            {"key": "a_birth_date", "label": "Ngày sinh của bạn", "type": "date", "required": True},
            {"key": "a_birth_time", "label": "Giờ sinh của bạn", "type": "time", "required": False},
            {"key": "a_province", "label": "Nơi sinh của bạn", "type": "select", "options": sorted(PROVINCES), "required": True},
            {"key": "b_name", "label": "Tên người ấy", "type": "text", "required": True},
            {"key": "b_birth_date", "label": "Ngày sinh người ấy", "type": "date", "required": True},
            {"key": "b_birth_time", "label": "Giờ sinh người ấy", "type": "time", "required": False},
            {"key": "b_province", "label": "Nơi sinh người ấy", "type": "select", "options": sorted(PROVINCES), "required": True},
        ],
    },
}


def get_service(service_type: str) -> ServiceDef | None:
    return SERVICES.get(service_type)


def list_services() -> list[dict]:
    return [
        {
            "type": t,
            "name": s["name"],
            "tagline": s["tagline"],
            "price_full": s["price_full"],
            "fields": s["fields"],
        }
        for t, s in SERVICES.items()
    ]


def validate_input(service_type: str, data: dict) -> tuple[dict, str | None]:
    """Chuẩn hóa + kiểm tra input theo schema. Trả (cleaned, error)."""
    svc = get_service(service_type)
    if not svc:
        return {}, "Dịch vụ này My chưa mở — bạn chọn món khác nhé."
    cleaned: dict[str, Any] = {}
    for f in svc["fields"]:
        v = data.get(f["key"])
        if v is not None and not isinstance(v, (str, bool)):
            return {}, f"“{f['label']}” chưa đúng — bạn nhập lại giúp My nhé."
        if isinstance(v, str):
            v = v.strip()
        if f.get("required") and not v:
            return {}, f"My cần thêm “{f['label']}” để xem cho bạn."

        # Chặn payload quá dài / sai định dạng trước khi đưa vào prompt.
        if isinstance(v, str) and v:
            limit = f.get("max_length") or _FIELD_MAX_LENGTH.get(f["type"])
            if limit and len(v) > limit:
                return {}, f"“{f['label']}” hơi dài — bạn rút gọn giúp My nhé."
            if f["type"] == "date":
                try:
                    parsed = date.fromisoformat(v)
                except ValueError:
                    return {}, f"“{f['label']}” chưa đúng — bạn chọn lại ngày giúp My nhé."
                if parsed.year < 1900 or parsed > date.today():
                    return {}, f"“{f['label']}” chưa hợp lệ — bạn kiểm tra lại giúp My nhé."
            elif f["type"] == "time":
                try:
                    datetime.strptime(v, "%H:%M")
                except ValueError:
                    return {}, f"“{f['label']}” chưa đúng — bạn nhập giờ dạng HH:MM giúp My nhé."

        if f["type"] == "select" and v and f.get("options") and v not in f["options"]:
            return {}, f"“{f['label']}” chưa đúng — bạn chọn lại giúp My nhé."
        cleaned[f["key"]] = v if v != "" else None
    return cleaned, None


def describe_computed(service_type: str, computed: dict, level: str = "full") -> str:
    """Tóm tắt dữ liệu đã tính + tư liệu tra cứu cho Gemini diễn giải."""
    if service_type == "than-so-hoc":
        c = computed
        return (
            f"Số chủ đạo {c['so_chu_dao']}, số sứ mệnh {c['so_su_menh']}, "
            f"số linh hồn {c['so_linh_hon']}, số nhân cách {c['so_nhan_cach']}, "
            f"năm cá nhân {c['nam_ca_nhan']} (năm {c['nam_hien_tai']})."
        )
    if service_type == "the-lover-heart":
        lines = [
            f"- {t['vi_tri']}: lá {t['la']} (ý nghĩa gốc: {t['y_nghia_goc']})"
            for t in computed["trai_bai"]
        ]
        q = f"Câu hỏi: {computed['cau_hoi']}. " if computed.get("cau_hoi") else ""
        return q + "Trải 3 lá:\n" + "\n".join(lines)
    if service_type == "ban-do-sao":
        p = computed.get("planets") or {}
        if not p:
            return (
                "Không tính được vị trí sao từ ngày giờ đã nhập. "
                "Hãy nhẹ nhàng nói người dùng kiểm tra lại ngày/giờ sinh; "
                "không tự bịa vị trí sao hay nhà."
            )
        from app.sotrasao import build_natal, render

        return render(build_natal(p), level)
    if service_type == "ban-do-sao-doi":
        from app.sotrasao import build_synastry, render

        a = (computed.get("a") or {}).get("planets") or {}
        b = (computed.get("b") or {}).get("planets") or {}
        if not a or not b:
            return "Không tính được vị trí sao cho một trong hai người."
        return render(
            build_synastry(
                a,
                b,
                (computed.get("a") or {}).get("ten", "Bạn"),
                (computed.get("b") or {}).get("ten", "Người ấy"),
            ),
            level,
        )
    if service_type == "tu-vi":
        c = computed
        return (
            f"Năm sinh {c['nam_can_chi']} (tuổi {c['tuoi']}), mệnh {c['menh_nap_am']}, "
            f"giờ sinh chi {c['gio_sinh_chi']}, âm lịch {c['am_lich']}."
        )
    return json.dumps(computed, ensure_ascii=False)


def price_for(service_type: str, cleaned: dict) -> int:
    svc = get_service(service_type)
    assert svc
    return int(svc["price_full"])
