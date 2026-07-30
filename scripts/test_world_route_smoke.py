#!/usr/bin/env python3
"""Local smoke test for the simplified V323 World Route page."""
from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import subprocess
import threading
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
VERSION = "20260730-v324"
BUILD_ID = "MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730"


def fail(message: str) -> None:
    raise SystemExit(f"WORLD ROUTE SMOKE TEST: FAIL — {message}")


files = [
    ROOT / "world-route.html",
    ROOT / "world-route" / "index.html",
    ROOT / "world-route" / "world-route.css",
    ROOT / "world-route" / "world-route.js",
    ROOT / "world-route" / "world-route-data.js",
    ROOT / "assets" / "maps" / "world-map.svg",
]
for file in files:
    if not file.is_file() or file.stat().st_size == 0:
        fail(f"missing: {file.relative_to(ROOT)}")

for relative in ("world-route.html", "world-route/index.html"):
    html = (ROOT / relative).read_text(encoding="utf-8")
    for marker in (
        BUILD_ID,
        "data-country-open",
        "data-route-map",
        "data-route-flow",
        "data-route-ports",
        ">戻る</a>",
        ">メインページへ戻る</a>",
    ):
        if marker not in html:
            fail(f"{relative}: missing {marker}")
    for removed in ("history.back", 'role="tab"', "data-tab", "world-route/images"):
        if removed in html:
            fail(f"{relative}: obsolete UI remains: {removed}")

node_test = subprocess.run(
    ["node", str(ROOT / "world-route" / "test-world-route-v323.mjs")],
    capture_output=True,
    text=True,
    check=False,
)
if node_test.returncode:
    fail((node_test.stderr or node_test.stdout).strip())

index = (ROOT / "index.html").read_text(encoding="utf-8")
if f'world-route/index.html?v={VERSION}' not in index:
    fail("main-page World Route card is not enabled")

sw = (ROOT / "sw.js").read_text(encoding="utf-8")
for marker in (
    f"./world-route/index.html?v={VERSION}",
    f"./world-route/world-route-data.js?v={VERSION}",
    "const isWorldRoute=",
):
    if marker not in sw:
        fail(f"service worker marker missing: {marker}")


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, _format: str, *_args: object) -> None:
        return


handler = partial(Quiet, directory=str(ROOT))
server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    base = f"http://127.0.0.1:{server.server_port}/"
    for relative in (
        f"world-route.html?v={VERSION}",
        f"world-route/index.html?v={VERSION}",
        f"world-route/world-route-data.js?v={VERSION}",
        f"world-route/world-route.js?v={VERSION}",
        f"world-route/world-route.css?v={VERSION}",
        "assets/maps/world-map.svg",
    ):
        with urlopen(base + relative, timeout=5) as response:
            content = response.read()
            if response.status != 200 or not content:
                fail(f"HTTP failed: {relative}")
finally:
    server.shutdown()
    server.server_close()
    thread.join(timeout=5)

print(
    "WORLD ROUTE SMOKE TEST: PASS — 20-country simplified routes, "
    "main-page returns, local assets, and HTTP delivery verified"
)
