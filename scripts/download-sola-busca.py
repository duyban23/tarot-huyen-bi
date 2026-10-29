"""Download Sola Busca tarot deck (1491, public domain).

Source: mixvlad/TarotCards on GitHub (sola-busca/720px, itself sourced from
Wikimedia Commons, Public Domain) — raw.githubusercontent.com is far more
reliable from here than direct Wikimedia fetches (proxy + 429 issues).

Numbering NN.jpg matches Commons Sola_Busca_tarot_card_NN.jpg:
  00        -> Mato (Fool)
  01 .. 21  -> trumps I .. XXI
  22 .. 35  -> Cups    (Ace, 2-10, Knave, Knight, Queen, King)
  36 .. 49  -> Coins
  50 .. 63  -> Batons
  64 .. 77  -> Swords

Mapping onto our ids (same order as RWS files being replaced):
  m00 .. m21, c01 .. c14, p01 .. p14, w01 .. w14, s01 .. s14

Run from the repo root:  python scripts/download-sola-busca.py
Output: frontend/public/images/cards/{id}.jpg + {id}.webp (overwrites RWS).
Old files are in git history, nothing else to back up.
"""
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from PIL import Image

BASE = "https://raw.githubusercontent.com/mixvlad/TarotCards/master/tarot/sola-busca/720px"
WIDTH = 720  # output width (source is already 720px)
QUALITY = 80
WORKERS = 8

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend", "public", "images", "cards",
)
TMP = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".tmp-sola-busca")


def commons_no(n: int) -> str:
    return f"{n:02d}.jpg"


def mapping():
    m = {}
    for i in range(22):
        m[commons_no(i)] = f"m{i:02d}"
    for prefix, start in (("c", 22), ("p", 36), ("w", 50), ("s", 64)):
        for k in range(14):
            m[commons_no(start + k)] = f"{prefix}{k + 1:02d}"
    return m


def main() -> None:
    files = mapping()
    assert len(files) == 78, f"expected 78, got {len(files)}"
    assert len(set(files.values())) == 78, "duplicate ids"
    os.makedirs(TMP, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    import threading
    local = threading.local()

    def get_session():
        s = getattr(local, "s", None)
        if s is None:
            s = requests.Session()
            s.trust_env = False  # ignore broken Windows system proxy; direct works
            s.headers["User-Agent"] = "tarot-booking/1.0"
            local.s = s
        return s

    def one(item):
        src, cid = item
        tmp_path = os.path.join(TMP, src)
        if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
            url = f"{BASE}/{src}"
            for attempt in range(4):
                try:
                    r = get_session().get(url, timeout=180)
                    if r.status_code == 429:
                        time.sleep(10 * (attempt + 1))
                        continue
                    r.raise_for_status()
                    with open(tmp_path, "wb") as f:
                        f.write(r.content)
                    break
                except Exception as e:
                    if attempt == 5:
                        return f"  FAIL {src}: {e}"
                    time.sleep(5)
            else:
                return f"  FAIL {src}: giving up"
            time.sleep(1)  # be polite: max ~1 req/s per worker
        try:
            im = Image.open(tmp_path)
            im.load()  # force full decode while tmp still exists
            if im.mode != "RGB":
                im = im.convert("RGB")
            if im.width > WIDTH:  # downscale originals to output width
                im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
            im.save(os.path.join(OUTPUT_DIR, f"{cid}.jpg"), "JPEG", quality=QUALITY)
            im.save(os.path.join(OUTPUT_DIR, f"{cid}.webp"), "WEBP", quality=QUALITY, method=6)
            return f"  OK {cid} <- {src}"
        except Exception as e:
            try:
                os.remove(tmp_path)  # corrupt partial -> retry next run
            except OSError:
                pass
            return f"  FAIL convert {src}: {e}"

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        results = list(pool.map(one, sorted(files.items())))

    ok = sum(1 for r in results if r.startswith("  OK"))
    print("\n".join(results))
    print(f"\nDone: {ok}/78 cards -> {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
