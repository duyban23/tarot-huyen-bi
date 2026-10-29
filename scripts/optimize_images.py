"""Generate web-optimised logo assets from the 1.3 MB master PNG.

Source lives in frontend/assets-src/ (NOT public/, so it is never copied into
dist/ and never deployed). Run from the repo root:

    python scripts/optimize_images.py

Output lands in frontend/public/logo/ and is committed.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "frontend" / "assets-src" / "logo-master.png"
PUB = ROOT / "frontend" / "public" / "logo"
BG = (13, 8, 18)  # --color-void, matches index.html theme-color


def main() -> None:
    im = Image.open(SRC)
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    w, h = im.size
    src_kb = SRC.stat().st_size / 1024
    print(f"source: {w}x{h}  ratio={w / h:.4f}  {src_kb:.0f} KB")

    # Widths cover every rendered size in the app (40px nav .. 240px hero).
    # 128 -> navbar / CTA / footer, 192 -> mobile hero, 512 -> retina hero.
    for target_w, quality in ((128, 82), (192, 76), (512, 72)):
        target_h = round(h * target_w / w)
        out = im.resize((target_w, target_h), Image.LANCZOS)
        dest = PUB / f"logo-{target_w}.webp"
        out.save(dest, "WEBP", quality=quality, method=6)
        kb = dest.stat().st_size / 1024
        print(f"  {dest.name:<20} {target_w}x{target_h}  {kb:.1f} KB  (was {src_kb:.0f} KB)")

    # Favicon: square, logo letterboxed and centred on the brand background so
    # the transparency does not render as a black box on dark browser chrome.
    fav = Image.new("RGB", (32, 32), BG)
    logo = im.copy()
    logo.thumbnail((28, 28), Image.LANCZOS)
    fav.paste(logo, ((32 - logo.width) // 2, (32 - logo.height) // 2), logo)
    fav_path = PUB / "favicon-32.png"
    fav.save(fav_path, "PNG", optimize=True)
    print(f"  {fav_path.name:<20} 32x32  {fav_path.stat().st_size / 1024:.2f} KB")

    # Open Graph / Twitter card: scrapers want >=600px wide, ideally 1200x630.
    og = Image.new("RGB", (1200, 630), BG)
    big = im.copy()
    big.thumbnail((300, 470), Image.LANCZOS)
    og.paste(big, ((1200 - big.width) // 2, (630 - big.height) // 2), big)
    og_path = PUB / "logo-og.webp"
    og.save(og_path, "WEBP", quality=88, method=6)
    print(f"  {og_path.name:<20} 1200x630  {og_path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()