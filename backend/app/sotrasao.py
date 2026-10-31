"""Tra cứu 514 thẻ "Sổ Tra Sao" để làm nền cho phần diễn giải của My.

Chỉ dùng dữ liệu có trong tài liệu:
- cung-<body>-<sign>   → hành tinh ở cung
- nha-<body>-<house>   → hành tinh ở nhà (chỉ khi có giờ sinh)
- goc-<a>-<b>          → góc chiếu, chọn goc_hoi/goc_mem/goc_cung
- nen-*                → nền tảng (dùng khi cần giải thích khái niệm)

Không dùng cau_live/hoi_lai (có chữ "Vanh"), nguon (nội bộ), pv/nong/kho (để sau).
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent / "data" / "so_tra_sao.json"

BODY_VN = {
    "sun": "Mặt Trời",
    "moon": "Mặt Trăng",
    "mercury": "Sao Thủy",
    "venus": "Sao Kim",
    "mars": "Sao Hỏa",
    "jupiter": "Sao Mộc",
    "saturn": "Sao Thổ",
    "uranus": "Thiên Vương",
    "neptune": "Hải Vương",
    "ascendant": "Cung Mọc",
}

# Thứ tự thẻ trong id góc chiếu của tài liệu.
ASPECT_ORDER = [
    "sun", "moon", "mercury", "venus", "mars", "jupiter",
    "saturn", "uranus", "neptune", "ascendant",
]

# Thứ tự ưu tiên khi chọn thẻ cho bài đọc.
PLAN_ORDER = [
    "sun", "moon", "ascendant", "venus", "mars",
    "mercury", "jupiter", "saturn", "uranus", "neptune",
]

FREE_BODIES = ["sun", "moon", "ascendant", "venus", "mars"]

ASPECTS = [
    (0, "goc_hoi", "trùng tụ"),
    (60, "goc_mem", "lục hợp"),
    (90, "goc_cung", "vuông góc"),
    (120, "goc_mem", "tam hợp"),
    (180, "goc_cung", "đối đỉnh"),
]
ASPECT_ORB = 6.0

# id dùng "asc", không dùng "ascendant".
CARD_KEY = {"ascendant": "asc"}


@lru_cache(maxsize=1)
def load_index() -> dict[str, dict]:
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    return {c["id"]: c for c in payload["cards"]}


def _key(body: str) -> str:
    return CARD_KEY.get(body, body)


def _aspect_between(lon1: float, lon2: float) -> tuple[str, str, float] | None:
    diff = abs(lon1 - lon2) % 360
    if diff > 180:
        diff = 360 - diff
    for angle, field, name in ASPECTS:
        if abs(diff - angle) <= ASPECT_ORB:
            return field, name, round(abs(diff - angle), 1)
    return None


def _placement_cards(index: dict, body: str, p: dict, with_houses: bool) -> list[str]:
    sign_key = p.get("sign_key")
    if not sign_key:
        return []
    ids: list[str] = []
    cid = f"cung-{_key(body)}-{sign_key}"
    if cid in index:
        ids.append(cid)
    if with_houses and body != "ascendant" and p.get("house"):
        hid = f"nha-{body}-{p['house']}"
        if hid in index:
            ids.append(hid)
    return ids


def build_natal(planets: dict) -> dict:
    """planets: dict từ astro.chart['planets'] + 'ascendant' (nếu có giờ sinh)."""
    index = load_index()
    with_houses = any(p.get("house") for p in planets.values())

    placements = []
    full_cards: list[str] = []
    free_cards: list[str] = []

    for body in PLAN_ORDER:
        p = planets.get(body)
        if not p:
            continue
        ids = _placement_cards(index, body, p, with_houses)
        if not ids:
            continue
        placements.append({
            "body": body,
            "label": BODY_VN.get(body, body),
            "sign": p.get("sign"),
            "sign_key": p.get("sign_key"),
            "house": p.get("house") if with_houses else None,
            "cards": ids,
        })
        full_cards.extend(ids)
        if body in FREE_BODIES:
            # Bản free chỉ lấy thẻ cung (không lấy nhà) cho gọn.
            free_cards.append(ids[0])

    aspects = []
    for i, a in enumerate(ASPECT_ORDER):
        pa = planets.get(a)
        if not pa:
            continue
        for b in ASPECT_ORDER[i + 1:]:
            pb = planets.get(b)
            if not pb:
                continue
            found = _aspect_between(pa["lon"], pb["lon"])
            if not found:
                continue
            field, name, orb = found
            cid = f"goc-{_key(a)}-{_key(b)}"
            if cid not in index:
                continue
            aspects.append({
                "a": a,
                "b": b,
                "a_label": BODY_VN.get(a, a),
                "b_label": BODY_VN.get(b, b),
                "name": name,
                "field": field,
                "orb": orb,
                "cards": [cid],
            })
            full_cards.append(cid)

    if aspects:
        free_cards.append(aspects[0]["cards"][0])

    return {
        "service": "ban-do-sao",
        "with_houses": with_houses,
        "placements": placements,
        "aspects": aspects,
        "cards": list(dict.fromkeys(full_cards)),
        "free_cards": list(dict.fromkeys(free_cards)),
    }


CROSS_BODIES = ["sun", "moon", "venus", "mars", "mercury", "saturn"]
SYN_BODIES = ["sun", "moon", "ascendant", "venus", "mars", "mercury", "saturn"]


def build_synastry(a: dict, b: dict, a_name: str = "Bạn", b_name: str = "Người ấy") -> dict:
    """a/b: dict planets (đã gồm 'ascendant' nếu có giờ sinh)."""
    index = load_index()
    a_has_houses = any(p.get("house") for p in a.values())
    b_has_houses = any(p.get("house") for p in b.values())
    with_houses = a_has_houses and b_has_houses

    def placements_for(planets: dict, has_houses: bool) -> list[dict]:
        out = []
        for body in SYN_BODIES:
            p = planets.get(body)
            if not p:
                continue
            ids = _placement_cards(index, body, p, has_houses)
            if not ids:
                continue
            out.append({
                "body": body,
                "label": BODY_VN.get(body, body),
                "sign": p.get("sign"),
                "sign_key": p.get("sign_key"),
                "house": p.get("house") if has_houses else None,
                "cards": ids,
            })
        return out

    a_placements = placements_for(a, a_has_houses)
    b_placements = placements_for(b, b_has_houses)

    cross = []
    for ab in CROSS_BODIES:
        pa = a.get(ab)
        if not pa:
            continue
        for bb in CROSS_BODIES:
            if ab == bb:
                continue  # tài liệu không có thẻ cùng hành tinh (goc-sun-sun...)
            pb = b.get(bb)
            if not pb:
                continue
            found = _aspect_between(pa["lon"], pb["lon"])
            if not found:
                continue
            field, name, orb = found
            ia, ib = ASPECT_ORDER.index(ab), ASPECT_ORDER.index(bb)
            if ia < ib:
                cid = f"goc-{_key(ab)}-{_key(bb)}"
            else:
                cid = f"goc-{_key(bb)}-{_key(ab)}"
            if cid not in index:
                continue
            cross.append({
                "a": ab,
                "b": bb,
                "a_label": BODY_VN.get(ab, ab),
                "b_label": BODY_VN.get(bb, bb),
                "name": name,
                "field": field,
                "orb": orb,
                "cards": [cid],
            })

    cross.sort(key=lambda x: x["orb"])
    cross = cross[:12]

    full_cards: list[str] = []
    for p in a_placements + b_placements:
        full_cards.extend(p["cards"])
    for x in cross:
        full_cards.extend(x["cards"])

    free_cards: list[str] = []
    for p in a_placements + b_placements:
        if p["body"] in ("sun", "moon", "venus"):
            free_cards.append(p["cards"][0])
    for x in cross[:2]:
        free_cards.append(x["cards"][0])

    return {
        "service": "ban-do-sao-doi",
        "a_name": a_name,
        "b_name": b_name,
        "with_houses": with_houses,
        "a_has_houses": a_has_houses,
        "b_has_houses": b_has_houses,
        "a_placements": a_placements,
        "b_placements": b_placements,
        "cross": cross,
        "cards": list(dict.fromkeys(full_cards)),
        "free_cards": list(dict.fromkeys(free_cards)),
    }


def _card_text(card: dict, level: str) -> str:
    lines = [f"[{card['tieu_de']}]"]
    if card.get("cot_loi"):
        lines.append(card["cot_loi"])
    if level == "free":
        if card.get("mat_sang"):
            lines.append("Mặt sáng: " + card["mat_sang"][0])
        if card.get("mat_toi"):
            lines.append("Mặt tối: " + card["mat_toi"][0])
        return "\n".join(lines)

    if card.get("mat_sang"):
        lines.append("Mặt sáng: " + "; ".join(card["mat_sang"][:2]))
    if card.get("mat_toi"):
        lines.append("Mặt tối: " + "; ".join(card["mat_toi"][:2]))
    for key, label in (
        ("tinh_yeu", "Tình yêu"),
        ("tien_viec", "Tiền/sự nghiệp"),
        ("loi_khuyen", "Lời khuyên"),
    ):
        if card.get(key):
            lines.append(f"{label}: {card[key]}")
    return "\n".join(lines)


def _aspect_text(card: dict, x: dict, level: str) -> str:
    text = card.get(x["field"]) or card.get("cot_loi") or ""
    return f"[{card['tieu_de']} — {x['name']}]\n{text}"


def render(plan: dict, level: str = "full") -> str:
    """Trả đoạn text đưa vào prompt: dữ liệu đã tính + tư liệu tra cứu."""
    index = load_index()
    with_houses = plan.get("with_houses", False)

    def placement_line(p: dict, show_house: bool = True) -> str:
        line = f"- {p['label']}: {p['sign']}"
        if show_house and p.get("house"):
            line += f", nhà {p['house']}"
        return line

    free = level == "free"
    lines: list[str] = ["Vị trí các hành tinh:"]
    if plan["service"] == "ban-do-sao":
        placements = [p for p in plan["placements"] if not free or p["body"] in FREE_BODIES]
        lines.extend(placement_line(p, not free) for p in placements)
        aspects = plan["aspects"][:1] if free else plan["aspects"]
        if aspects:
            lines.append("Góc chiếu:")
            for x in aspects:
                lines.append(
                    f"- {x['a_label']} — {x['b_label']}: {x['name']} (lệch {x['orb']}°)"
                )
    else:
        a_pl = plan["a_placements"]
        b_pl = plan["b_placements"]
        if free:
            keep = ("sun", "moon", "venus")
            a_pl = [p for p in a_pl if p["body"] in keep]
            b_pl = [p for p in b_pl if p["body"] in keep]
        lines.append(f"{plan['a_name']}:")
        lines.extend(placement_line(p, not free) for p in a_pl)
        lines.append(f"{plan['b_name']}:")
        lines.extend(placement_line(p, not free) for p in b_pl)
        cross = plan["cross"][:2] if free else plan["cross"]
        if cross:
            lines.append("Góc chiếu chéo:")
            for x in cross:
                lines.append(
                    f"- {x['a_label']} của {plan['a_name']} — "
                    f"{x['b_label']} của {plan['b_name']}: {x['name']} (lệch {x['orb']}°)"
                )

    lines.append("")
    lines.append("TƯ LIỆU TRA CỨU (chỉ diễn giải từ đây, không bịa thêm):")
    lines.append("")

    cards = plan["free_cards"] if free else plan["cards"]
    if free:
        cards = cards[:8]

    # Góc chiếu: render theo đúng field biến thể.
    aspect_by_card: dict[str, dict] = {}
    for x in plan.get("aspects", []) + plan.get("cross", []):
        aspect_by_card[x["cards"][0]] = x

    seen: set[str] = set()
    blocks: list[str] = []
    for cid in cards:
        if cid in seen:
            continue
        seen.add(cid)
        card = index.get(cid)
        if not card:
            continue
        x = aspect_by_card.get(cid)
        if x and card.get("loai") == "goc":
            blocks.append(_aspect_text(card, x, level))
        else:
            blocks.append(_card_text(card, level))

    lines.append("\n\n".join(blocks))
    note = None
    if plan["service"] == "ban-do-sao":
        if with_houses and free:
            note = (
                "dữ liệu đã có giờ sinh và Cung Mọc; bản ngắn chỉ luận theo cung "
                "— không nhắc số nhà, và tuyệt đối không nói thiếu giờ sinh"
            )
        elif with_houses:
            note = (
                "dữ liệu đã có giờ sinh, Cung Mọc và nhà — hãy luận đầy đủ, "
                "tuyệt đối không nói thiếu giờ sinh/Cung Mọc/nhà"
            )
        else:
            note = (
                "khách không nhập giờ sinh nên KHÔNG có Cung Mọc và nhà — tuyệt đối "
                "không nhắc tới nhà/Cung Mọc, chỉ luận theo cung; hãy nói rõ điều này "
                "một cách nhẹ nhàng ở đầu bài"
            )
    elif plan["service"] == "ban-do-sao-doi":
        a_ok = bool(plan.get("a_has_houses"))
        b_ok = bool(plan.get("b_has_houses"))
        if a_ok and b_ok and free:
            note = (
                "cả hai đã có giờ sinh; bản ngắn chỉ luận theo cung — không nhắc "
                "nhà/Cung Mọc, và tuyệt đối không nói thiếu giờ sinh"
            )
        elif a_ok and b_ok:
            note = (
                "cả hai đã có giờ sinh, Cung Mọc và nhà — hãy luận đầy đủ, "
                "tuyệt đối không nói thiếu giờ sinh/Cung Mọc/nhà"
            )
        elif not a_ok or not b_ok:
            missing = []
            if not a_ok:
                missing.append("người thứ nhất")
            if not b_ok:
                missing.append("người thứ hai")
            note = (
                f"{' và '.join(missing)} thiếu giờ sinh nên không có đủ Cung Mọc/nhà "
                "— chỗ thiếu chỉ luận theo cung"
            )
    if note:
        lines.append(f"\n(Lưu ý: {note}.)")
    return "\n".join(lines)
