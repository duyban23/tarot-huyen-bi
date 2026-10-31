"""Kiểm tra lớp tra cứu \"Sổ Tra Sao\": dữ liệu sạch, thẻ tra được, ngân sách chữ."""

from app.astro import chart
from app.sotrasao import (
    BODY_VN,
    _aspect_between,
    build_natal,
    build_synastry,
    load_index,
    render,
)

DEMO = dict(birth_date="1998-05-14", birth_time="07:30", lat=21.03, lng=105.85)


def test_index_has_all_cards_and_no_internal_fields():
    index = load_index()
    assert len(index) == 514
    for card in index.values():
        assert "cau_live" not in card
        assert "hoi_lai" not in card
        assert "nguon" not in card
        assert "muc_nguon" not in card
        assert "Vanh" not in str(card)


def test_whole_sign_houses_match_demo_chart():
    c = chart(**DEMO)
    planets = {**c["planets"], "ascendant": c["ascendant"]}
    assert c["house_system"] == "whole_sign"
    assert planets["ascendant"]["sign"] == "Bạch Dương"
    assert planets["sun"]["house"] == 2
    assert planets["moon"]["house"] == 9
    assert planets["mercury"]["house"] == 1
    assert planets["venus"]["house"] == 1
    assert planets["mars"]["house"] == 2
    assert planets["jupiter"]["house"] == 12
    assert planets["saturn"]["house"] == 1
    assert planets["uranus"]["house"] == 11
    assert planets["neptune"]["house"] == 11


def test_natal_plan_only_uses_existing_cards():
    index = load_index()
    cases = [
        ("1998-05-14", "07:30"),
        ("2000-01-01", "00:05"),
        ("1985-11-23", "18:45"),
    ]
    for birth_date, birth_time in cases:
        c = chart(birth_date, birth_time, 21.03, 105.85)
        planets = {**c["planets"], "ascendant": c["ascendant"]}
        plan = build_natal(planets)

        assert plan["service"] == "ban-do-sao"
        assert plan["with_houses"] is True
        assert plan["placements"]
        for cid in plan["cards"] + plan["free_cards"]:
            assert cid in index, cid
        # free: chỉ thẻ cung + 1 góc chiếu, không thẻ nhà
        assert all(not cid.startswith("nha-") for cid in plan["free_cards"])
        # full: có thẻ nhà khi có giờ sinh
        assert any(cid.startswith("nha-") for cid in plan["cards"])


def test_natal_render_budget_and_no_leak():
    c = chart(**DEMO)
    planets = {**c["planets"], "ascendant": c["ascendant"]}
    plan = build_natal(planets)
    free = render(plan, "free")
    full = render(plan, "full")

    assert 500 < len(free) < 4000
    assert len(full) < 25000
    assert len(free) < len(full)
    assert "TƯ LIỆU TRA CỨU" in free
    assert "Vanh" not in free and "Vanh" not in full
    assert "Mặt Trời: Kim Ngưu, nhà 2" in full
    # Có giờ sinh thì phải nói rõ là đã có nhà/Cung Mọc, tránh model mở bài
    # bằng câu "thiếu giờ sinh" rồi vẫn dùng Cung Mọc.
    assert "đã có giờ sinh, Cung Mọc và nhà" in full
    assert "không nhập giờ sinh" not in full
    # Bản free cố ý bỏ số nhà → note phải nói rõ, không xui model bịa nhà.
    assert "bản ngắn chỉ luận theo cung" in free
    assert "không nhắc số nhà" in free


def test_natal_without_birth_time_has_no_houses_or_ascendant():
    c = chart("1998-05-14", None, 21.03, 105.85)
    plan = build_natal(c["planets"])
    full = render(plan, "full")

    assert plan["with_houses"] is False
    assert all(p["body"] != "ascendant" for p in plan["placements"])
    assert all(not cid.startswith("nha-") for cid in plan["cards"])
    assert "- Cung Mọc:" not in full
    assert "không nhập giờ sinh" in full


def test_synastry_uses_cross_aspects_and_valid_cards():
    a = chart("1998-05-14", "07:30", 21.03, 105.85)
    b = chart("1995-08-20", "14:00", 21.03, 105.85)
    pa = {**a["planets"], "ascendant": a["ascendant"]}
    pb = {**b["planets"], "ascendant": b["ascendant"]}
    plan = build_synastry(pa, pb, "An", "Bình")
    index = load_index()

    assert plan["service"] == "ban-do-sao-doi"
    assert plan["cross"]
    for x in plan["cross"]:
        assert x["a"] != x["b"]  # tài liệu không có thẻ cùng hành tinh
        assert x["cards"][0] in index
    for cid in plan["cards"] + plan["free_cards"]:
        assert cid in index
    free = render(plan, "free")
    full = render(plan, "full")
    assert 500 < len(free) < 5000
    assert len(full) < 30000
    assert "Góc chiếu chéo" in full
    assert "An" in full and "Bình" in full
    assert "cả hai đã có giờ sinh, Cung Mọc và nhà" in full
    assert "bản ngắn chỉ luận theo cung" in free


def test_synastry_without_one_birth_time_flags_only_that_person():
    a = chart("1998-05-14", "07:30", 21.03, 105.85)
    b = chart("1995-08-20", None, 21.03, 105.85)
    pa = {**a["planets"], "ascendant": a["ascendant"]}
    pb = b["planets"]
    plan = build_synastry(pa, pb, "An", "Bình")
    full = render(plan, "full")

    assert "người thứ hai thiếu giờ sinh" in full
    assert "người thứ nhất thiếu giờ sinh" not in full


def test_aspect_fields_match_document_variants():
    assert _aspect_between(10, 12)[0] == "goc_hoi"
    assert _aspect_between(10, 70)[0] == "goc_mem"    # 60°
    assert _aspect_between(10, 100)[0] == "goc_cung"  # 90°
    assert _aspect_between(10, 130)[0] == "goc_mem"   # 120°
    assert _aspect_between(10, 190)[0] == "goc_cung"  # 180°
    assert _aspect_between(10, 200) is None


def test_body_labels_cover_all_computable_bodies():
    assert set(BODY_VN) == {
        "sun", "moon", "mercury", "venus", "mars", "jupiter",
        "saturn", "uranus", "neptune", "ascendant",
    }
