"""Extract 514 thẻ từ "Sổ Tra Sao" HTML → backend/app/data/so_tra_sao.json.

Chỉ giữ các trường dùng cho v1:
  id, loai, the, the2, cung, nha, tieu_de, cot_loi,
  mat_sang, mat_toi, tinh_yeu, tien_viec, loi_khuyen,
  goc_hoi, goc_mem, goc_cung

Bỏ: cau_live, hoi_lai (có chữ "Vanh"), nguon/muc_nguon (bản quyền, nội bộ),
    pv/nong/kho/chu_de/tu_khoa/nam_sinh/ord/bidanh/nhom_nen (để sau).

Dùng:
  python scripts/extract_sotrasao.py --src "D:/tarot_AI/So_Tra_Sao_Live.html"
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Console Windows mặc định cp1252 → ép UTF-8 để in tiếng Việt không lỗi.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

KEEP = [
    "id", "loai", "the", "the2", "cung", "nha", "tieu_de", "cot_loi",
    "mat_sang", "mat_toi", "tinh_yeu", "tien_viec", "loi_khuyen",
    "goc_hoi", "goc_mem", "goc_cung",
]

DEFAULT_OUT = Path(__file__).resolve().parent.parent / "backend" / "app" / "data" / "so_tra_sao.json"


def extract_cards(html: str) -> list[dict]:
    marker = "const CARDS = "
    start = html.index(marker) + len(marker)
    end = html.index("const BODY", start)
    raw = html[start:end].strip()
    raw = raw[: raw.rindex("]") + 1]
    cards = json.loads(raw)
    if not isinstance(cards, list):
        raise ValueError("CARDS không phải mảng")
    return cards


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="Đường dẫn So_Tra_Sao_Live.html")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    args = ap.parse_args()

    html = Path(args.src).read_text(encoding="utf-8")
    cards = extract_cards(html)

    trimmed = []
    for card in cards:
        item = {k: card.get(k) for k in KEEP}
        # Bỏ key rỗng cho nhẹ file
        item = {k: v for k, v in item.items() if v not in ("", None, [], 0) or k == "nha"}
        trimmed.append(item)

    ids = [c["id"] for c in trimmed]
    if len(ids) != len(set(ids)):
        raise ValueError("Có id trùng trong CARDS")

    payload = {
        "meta": {
            "source": Path(args.src).name,
            "count": len(trimmed),
            "house_system": "whole_sign",
            "fields": KEEP,
        },
        "cards": trimmed,
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    by_loai: dict[str, int] = {}
    for c in trimmed:
        by_loai[c["loai"]] = by_loai.get(c["loai"], 0) + 1

    print(f"Đã ghi {out}")
    print(f"Tổng thẻ: {len(trimmed)} | theo loại: {by_loai}")
    print(f"Kích thước: {out.stat().st_size / 1024:.0f} KB")

    # Kiểm tra nhanh không còn chữ "Vanh"
    leaked = [c["id"] for c in trimmed if "Vanh" in json.dumps(c, ensure_ascii=False)]
    print(f"Thẻ còn chữ 'Vanh': {len(leaked)}")


if __name__ == "__main__":
    main()
