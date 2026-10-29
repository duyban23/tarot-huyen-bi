"""Generate grid thumbnails for feedback screenshots.

The originals are 540-1152px wide portrait screenshots (2.9 MB total) shown
in small grid cells. Thumbs are 480px wide JPEGs (~35-60 KB each) used by
the grid; the lightbox keeps loading the full originals.

Run from the repo root:  python scripts/optimize_feedbacks.py
Output: frontend/public/images/feedbacks/thumbs/fb_N.jpg (committed).
"""
from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "frontend" / "public" / "images" / "feedbacks"
DEST = SRC / "thumbs"
WIDTH = 480


def main() -> None:
    DEST.mkdir(exist_ok=True)
    total_src = total_dst = 0
    n = 0
    for src in sorted(SRC.glob("fb_*.jpg")):
        im = Image.open(src).convert("RGB")
        w, h = im.size
        thumb = im.resize((WIDTH, round(h * WIDTH / w)), Image.LANCZOS)
        dest = DEST / src.name
        thumb.save(dest, "JPEG", quality=72, optimize=True, progressive=True)
        total_src += src.stat().st_size
        total_dst += dest.stat().st_size
        n += 1
    print(f"{n} thumbs: {total_src / 1024:.0f} KB -> {total_dst / 1024:.0f} KB")


if __name__ == "__main__":
    main()
