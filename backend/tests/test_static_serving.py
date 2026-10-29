"""Two things that broke production, in this order:

1. Under the FastAPI framework preset Vercel never publishes outputDirectory,
   so frontend/dist never reached the CDN. Every /assets/*.js request fell
   through to whatever served index.html, which returned Content-Type:
   text/html. The browser enforces strict MIME checking on module scripts and
   threw "Expected a JavaScript-or-Wasm module script", so React never mounted
   and the site rendered blank.

2. The static fallback in backend/app/main.py was reachable via the raw path
   join, so "/../../../../etc/passwd" served files from outside the bundle.

No network, no database, no Vercel account required.
"""

import importlib
import json
import shutil
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
VERCEL_JSON = REPO_ROOT / "vercel.json"

SAMPLE_JS = b"console.log('huyenbi');"
SAMPLE_HTML = b'<!DOCTYPE html><html><body><div id="root"></div></body></html>'


# --------------------------------------------------------------------------
# vercel.json contract
# --------------------------------------------------------------------------

@pytest.fixture(scope="module")
def vercel_config() -> dict:
    return json.loads(VERCEL_JSON.read_text(encoding="utf-8"))


def test_include_files_is_a_string(vercel_config):
    """The Vercel schema requires a glob *string* here, not an array.

    Shipping an array fails the build with:
      functions.api/index.py.includeFiles should be string
    """
    include = vercel_config["functions"]["api/index.py"]["includeFiles"]
    assert isinstance(include, str), (
        f"includeFiles must be a glob string, got {type(include).__name__}: {include!r}"
    )


def test_include_files_still_covers_backend(vercel_config):
    include = vercel_config["functions"]["api/index.py"]["includeFiles"]
    assert "backend" in include, f"includeFiles {include!r} dropped the backend package"


def test_framework_preset_is_disabled(vercel_config):
    """The whole bug. Under the FastAPI preset Vercel never publishes
    outputDirectory, so frontend/dist never reached the CDN and every
    /assets/*.js fell through to a text/html response."""
    assert vercel_config.get("framework", "unset") is None, (
        "framework must be null so Vercel publishes outputDirectory; a backend "
        "framework preset silently swallows it"
    )


def test_output_directory_is_the_frontend_build(vercel_config):
    assert vercel_config["outputDirectory"] == "frontend/dist"


def test_build_copies_nothing_into_the_function(vercel_config):
    """Static assets must be published by Vercel, not bundled into the Lambda.
    Copying dist into the function makes every asset request pay a cold start."""
    assert "cp " not in vercel_config["buildCommand"], (
        "buildCommand copies the SPA into the function; static assets belong "
        "in outputDirectory so the CDN serves them"
    )


def test_python_version_is_pinned(vercel_config):
    """Without .python-version Vercel picks its own default, which moved to
    3.14. psycopg2-binary 2.9.10 ships no 3.14 wheels, so the build falls
    back to compiling from source and dies on a missing pg_config."""
    pinned = (REPO_ROOT / ".python-version").read_text(encoding="utf-8").strip()
    assert pinned == "3.12", (
        f".python-version is {pinned!r}; expected 3.12, otherwise the Lambda "
        "build cannot resolve psycopg2-binary"
    )
    assert vercel_config.get("framework", "unset") is None, (
        "the FastAPI preset used to pin Python implicitly; with it disabled the "
        ".python-version file is the only thing holding the version steady"
    )


def test_api_is_routed_to_the_function(vercel_config):
    api_rewrites = [r for r in vercel_config["rewrites"] if r["source"] == "/api/(.*)"]
    assert api_rewrites, f"no /api rewrite in {vercel_config['rewrites']}"
    assert api_rewrites[0]["destination"] == "/api/index.py"


def test_spa_fallback_rewrites_to_index_html(vercel_config):
    """Client-side routes like /booking must resolve to the shell. This is
    safe because Vercel gives the filesystem precedence over rewrites, so real
    files under /assets are served before this rule is ever considered."""
    fallback = [r for r in vercel_config["rewrites"] if r["source"] == "/(.*)"]
    assert fallback, f"no SPA fallback in {vercel_config['rewrites']}"
    assert fallback[-1]["destination"] == "/index.html"
    # The /api rule must come first, otherwise /api/* would be swallowed.
    sources = [r["source"] for r in vercel_config["rewrites"]]
    assert sources.index("/api/(.*)") < sources.index("/(.*)")


# --------------------------------------------------------------------------
# The SPA the function actually serves
# --------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client(tmp_path_factory) -> TestClient:
    """Build a throwaway copy of the repo layout that main.py expects.

    main.py resolves FRONTEND_DIST relative to its own file, so the only way
    to exercise the real mount code is to give it a real tree to find.
    """
    root = tmp_path_factory.mktemp("layout")
    shutil.copytree(
        BACKEND_DIR / "app", root / "backend" / "app",
        ignore=shutil.ignore_patterns("__pycache__"),
    )

    dist = root / "frontend" / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "logo").mkdir(parents=True)
    (dist / "assets" / "index-test.js").write_bytes(SAMPLE_JS)
    (dist / "assets" / "index-test.css").write_bytes(b"body{color:red}")
    (dist / "logo" / "favicon-32.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 8)
    (dist / "index.html").write_bytes(SAMPLE_HTML)

    sys.path.insert(0, str(root / "backend"))
    for name in [m for m in list(sys.modules) if m == "app" or m.startswith("app.")]:
        del sys.modules[name]
    app_module = importlib.import_module("app.main")

    with TestClient(app_module.app) as c:
        yield c

    sys.path.remove(str(root / "backend"))


def test_javascript_is_served_as_javascript(client):
    """The original production bug, verbatim.

    Returning text/html for a module script makes the browser throw
    "Expected a JavaScript-or-Wasm module script" and the app never boots.
    """
    r = client.get("/assets/index-test.js")
    assert r.status_code == 200
    assert "javascript" in r.headers["content-type"], (
        f"/assets/*.js came back as {r.headers['content-type']!r}"
    )
    assert r.content == SAMPLE_JS


def test_css_is_served_as_css(client):
    r = client.get("/assets/index-test.css")
    assert r.status_code == 200
    assert "css" in r.headers["content-type"]


def test_png_is_served_as_png(client):
    r = client.get("/logo/favicon-32.png")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")


def test_root_serves_the_spa_shell(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]
    assert b'id="root"' in r.content


def test_client_side_route_falls_back_to_the_shell(client):
    r = client.get("/booking")
    assert r.status_code == 200
    assert b'id="root"' in r.content


def test_unknown_api_path_is_json_404_not_the_spa(client):
    r = client.get("/api/definitely-not-a-route")
    assert r.status_code == 404
    assert "application/json" in r.headers["content-type"]


def test_path_traversal_does_not_escape_the_bundle(client):
    """`FRONTEND_DIST / full_path` used to be joined unchecked, so
    /../../../../etc/passwd served files from outside the function bundle."""
    for evil in ("../../../../../../etc/passwd", "..%2f..%2f..%2fetc/passwd"):
        r = client.get(f"/{evil}")
        assert r.status_code == 200
        assert b"root:" not in r.content, f"{evil} escaped the dist directory"
        assert b'id="root"' in r.content, f"{evil} should fall back to the SPA shell"


def test_hashed_assets_are_immutably_cached(client):
    """Vite content-hashes filenames under /assets, so they can be cached
    forever. Without this every visit re-downloads the bundle."""
    r = client.get("/assets/index-test.js")
    assert "immutable" in r.headers.get("cache-control", "")


def test_html_shell_is_not_immutably_cached(client):
    r = client.get("/")
    assert "immutable" not in r.headers.get("cache-control", "")


def test_app_still_imports_when_dist_has_no_assets_dir(tmp_path):
    """StaticFiles(directory=...) raises at import time if the directory is
    missing, which previously turned a partial build into a total outage."""
    root = tmp_path / "layout"
    shutil.copytree(
        BACKEND_DIR / "app", root / "backend" / "app",
        ignore=shutil.ignore_patterns("__pycache__"),
    )
    dist = root / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_bytes(SAMPLE_HTML)  # deliberately no assets/

    saved_path, saved_modules = list(sys.path), dict(sys.modules)
    try:
        sys.path.insert(0, str(root / "backend"))
        for name in [m for m in list(sys.modules) if m == "app" or m.startswith("app.")]:
            del sys.modules[name]
        mod = importlib.import_module("app.main")
        with TestClient(mod.app) as c:
            assert c.get("/").status_code == 200
    finally:
        sys.path[:] = saved_path
        for name in [m for m in list(sys.modules) if m == "app" or m.startswith("app.")]:
            del sys.modules[name]
        sys.modules.update(saved_modules)