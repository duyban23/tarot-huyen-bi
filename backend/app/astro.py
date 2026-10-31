"""Vị trí hành tinh thuần Python (không cần thư viện native).

Độ chính xác ~1-3 độ — đủ để xác định CUNG (mỗi cung 30 độ), kèm disclaimer
tham khảo. Dựa trên:
- Mặt Trời/Mặt Trăng: thuật toán rút gọn (Schlyter).
- Kim/Thủy/Hỏa/Mộc/Thổ: phần tử Kepler JPL (epoch J2000 + tốc độ/thế kỷ).
- Cung Mọc (ASC): công thức RAMC + vĩ độ (cần giờ sinh).
"""

from __future__ import annotations

import math
from datetime import date, datetime, timezone

SIGNS_VN = [
    "Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải", "Sư Tử", "Xử Nữ",
    "Thiên Bình", "Bọ Cạp", "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư",
]

# a(AU), e, I(deg), L(deg), long.peri(deg), long.node(deg) + rates/century (JPL).
_ELEMENTS = {
    "mercury": ((0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593),
                (0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081)),
    "venus": ((0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255),
              (0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418)),
    "earth": ((1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0),
              (0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0)),
    "mars": ((1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891),
             (0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343)),
    "jupiter": ((5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909),
                (-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106)),
    "saturn": ((9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448),
               (-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794)),
    "uranus": ((19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.96427630, 74.01692503),
               (-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589)),
    "neptune": ((30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574),
                (0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664)),
}


def _julian_day(dt: datetime) -> float:
    dt = dt.replace(tzinfo=timezone.utc)
    return dt.timestamp() / 86400.0 + 2440587.5


def _norm360(x: float) -> float:
    return x % 360.0


def _kepler_lon(key: str, jd: float) -> float:
    """Kinh độ nhật tâm của hành tinh (độ)."""
    (a0, e0, i0, l0, p0, n0), (da, de, di, dl, dp, dn) = _ELEMENTS[key]
    t = (jd - 2451545.0) / 36525.0
    a = a0 + da * t
    e = e0 + de * t
    i = math.radians(i0 + di * t)
    lng_peri = math.radians(p0 + dp * t)
    node = math.radians(n0 + dn * t)
    m = math.radians(_norm360(l0 + dl * t) - math.degrees(lng_peri))
    # Giải Kepler E - e*sinE = M
    e_star = math.degrees(e)
    e_an = m + e_star * math.sin(m) * (1.0 + e * math.cos(m))
    for _ in range(6):
        e_an = e_an - (e_an - e_star * math.sin(math.radians(e_an)) - math.degrees(m)) / (
            1.0 - e * math.cos(math.radians(e_an)))
    e_an = math.radians(e_an)
    x = a * (math.cos(e_an) - e)
    y = a * (math.sqrt(1 - e * e) * math.sin(e_an))
    v = math.atan2(y, x)
    r = math.hypot(x, y)
    xh = r * (math.cos(node) * math.cos(v + lng_peri - node)
              - math.sin(node) * math.sin(v + lng_peri - node) * math.cos(i))
    yh = r * (math.sin(node) * math.cos(v + lng_peri - node)
              + math.cos(node) * math.sin(v + lng_peri - node) * math.cos(i))
    return xh, yh


def _earth_heliocentric(jd: float) -> tuple[float, float]:
    return _kepler_lon("earth", jd)


def planet_geocentric_lon(key: str, jd: float) -> float:
    """Kinh độ địa tâm biểu kiến rút gọn (độ, 0-360)."""
    xh, yh = _kepler_lon(key, jd)
    xe, ye = _earth_heliocentric(jd)
    return _norm360(math.degrees(math.atan2(yh - ye, xh - xe)))


def sun_lon(jd: float) -> float:
    xe, ye = _earth_heliocentric(jd)
    return _norm360(math.degrees(math.atan2(-ye, -xe)))


def moon_lon(jd: float) -> float:
    """Mặt Trăng rút gọn (Schlyter, sai số ~2 độ — vẫn an toàn cho cung)."""
    d = jd - 2451543.5
    n_deg = _norm360(125.1228 - 0.0529538083 * d)       # node lên (độ)
    n = math.radians(n_deg)
    i = math.radians(5.1454)
    w = _norm360(318.0634 + 0.1643573223 * d)         # cận điểm
    m = math.radians(_norm360(115.3654 + 13.0649929509 * d))  # dị thường (mod 360 TRƯỚC khi đổi rad)
    e_an = m + math.radians(6.289) * math.sin(m)
    for _ in range(3):
        e_an = e_an - (e_an - math.radians(6.289) * math.sin(e_an) - m) / (
            1 - 0.0549 * math.cos(e_an))
    x = math.cos(e_an) - 0.0549
    y = 0.9985 * math.sin(e_an)
    v = math.atan2(y, x)
    # Kinh độ trên hoàng đạo
    xh = math.cos(n) * math.cos(v + math.radians(w)) - math.sin(n) * math.sin(v + math.radians(w)) * math.cos(i)
    yh = math.sin(n) * math.cos(v + math.radians(w)) + math.cos(n) * math.sin(v + math.radians(w)) * math.cos(i)
    lon = math.degrees(math.atan2(yh, xh))
    # Nhiễu loạn chính (evection + phương trình trung tâm lớn)
    ms = _norm360(356.0470 + 0.9856002585 * d)        # dị thường Mặt Trời
    mm = _norm360(115.3654 + 13.0649929509 * d)       # dị thường Mặt Trăng
    lm = _norm360(n_deg + w + mm)                   # kinh độ trung bình Trăng
    ls = _norm360(282.9404 + ms)                    # kinh độ trung bình Trời
    dm = _norm360(lm - ls)                           # elong trung bình
    if dm > 180:
        dm -= 360
    lon += -1.274 * math.sin(math.radians(mm - 2 * dm)) + 0.658 * math.sin(math.radians(2 * dm))
    lon += -0.186 * math.sin(math.radians(ms)) - 0.114 * math.sin(math.radians(2 * (lm - (282.9404))))
    return _norm360(lon)


def ascendant_lon(jd: float, lat: float, lng: float) -> float:
    """Cung Mọc rút gọn từ giờ sao + vĩ độ."""
    d = jd - 2451543.5
    # Giờ sao Greenwich (độ) + kinh độ địa phương
    gmst = _norm360(280.46061837 + 360.98564736629 * d)
    ramc = math.radians(_norm360(gmst + lng))
    eps = math.radians(23.4393 - 3.563e-7 * d)
    phi = math.radians(lat)
    asc = math.degrees(math.atan2(math.cos(ramc), -(math.sin(ramc) * math.cos(eps) + math.tan(phi) * math.sin(eps))))
    return _norm360(asc)


def sign_of(lon: float) -> str:
    return SIGNS_VN[int(_norm360(lon) // 30) % 12]


# Khóa tiếng Anh để tra thẻ trong "Sổ Tra Sao" (id dạng cung-sun-aries).
SIGNS_KEY = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]


def sign_key_of(lon: float) -> str:
    return SIGNS_KEY[int(_norm360(lon) // 30) % 12]


def house_of(lon: float, asc_lon: float) -> int:
    """Whole-sign: nhà 1 = cung chứa Cung Mọc, mỗi cung = 1 nhà."""
    return ((int(_norm360(lon) // 30) - int(_norm360(asc_lon) // 30)) % 12) + 1


def chart(birth_date: str, birth_time: str | None, lat: float, lng: float) -> dict:
    y, mo, d = (int(x) for x in birth_date.split("-"))
    hh, mm = (int(x) for x in (birth_time or "12:00").split(":"))
    jd = _julian_day(datetime(y, mo, d, hh, mm))
    planets: dict[str, dict] = {}
    planets["sun"] = {"sign": sign_of(sun_lon(jd)), "sign_key": sign_key_of(sun_lon(jd)),
                      "lon": round(sun_lon(jd), 2)}
    planets["moon"] = {"sign": sign_of(moon_lon(jd)), "sign_key": sign_key_of(moon_lon(jd)),
                       "lon": round(moon_lon(jd), 2)}
    for key, label in (("mercury", "mercury"), ("venus", "venus"), ("mars", "mars"),
                       ("jupiter", "jupiter"), ("saturn", "saturn"),
                       ("uranus", "uranus"), ("neptune", "neptune")):
        lon = planet_geocentric_lon(key, jd)
        planets[label] = {"sign": sign_of(lon), "sign_key": sign_key_of(lon),
                          "lon": round(lon, 2)}
    out: dict = {"planets": planets}
    if birth_time:
        asc = ascendant_lon(jd, lat, lng)
        out["ascendant"] = {"sign": sign_of(asc), "sign_key": sign_key_of(asc),
                            "lon": round(asc, 2)}
        # Chỉ tính nhà khi có giờ sinh (không có giờ thì không có Cung Mọc).
        for p in planets.values():
            p["house"] = house_of(p["lon"], asc)
        out["ascendant"]["house"] = 1
        out["house_system"] = "whole_sign"
    return out


if __name__ == "__main__":
    # Tự kiểm tra: 14/05/1998 07:30 Hà Nội → Sun Kim Ngưu, Moon? (đối chiếu astro.com)
    c = chart("1998-05-14", "07:30", 21.03, 105.85)
    for k, v in c["planets"].items():
        print(k, v)
    print("ASC:", c.get("ascendant"))
