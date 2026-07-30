#!/usr/bin/env python3
"""V324 local HTTP and common-update coverage smoke test."""
from __future__ import annotations

from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
BUILD_ID = "MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730"


def fail(message: str) -> None:
    raise SystemExit(f"V324 HTTP SMOKE: FAIL — {message}")


class Parser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[str] = []

    def handle_starttag(
        self,
        _tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append(value)


html_files = sorted(ROOT.rglob("*.html"))
if len(html_files) != 36:
    fail(f"expected 36 HTML pages, found {len(html_files)}")

for html_file in html_files:
    source = html_file.read_text(encoding="utf-8")
    relative = html_file.relative_to(ROOT).as_posix()
    if (
        f'name="market-base-site-build" content="{BUILD_ID}"' not in source
        and f'content="{BUILD_ID}" name="market-base-site-build"' not in source
    ):
        fail(f"{relative}: current site-build meta is missing")
    if (
        "market-base-update-controller-v322.js?v=20260730-v324" not in source
        and "market-base-scroll-controls-r11328.js?v=20260730-v324" not in source
    ):
        fail(f"{relative}: common update controller coverage is missing")

changed_pages = [
    ROOT / "index.html",
    ROOT / "world-radio" / "index.html",
    ROOT / "world-radio" / "player.html",
    ROOT / "world-route.html",
    ROOT / "world-route" / "index.html",
    ROOT / "machine-container-packing" / "index.html",
    ROOT / "settings" / "index.html",
]
for html_file in changed_pages:
    parser = Parser()
    parser.feed(html_file.read_text(encoding="utf-8"))
    for reference in parser.references:
        if reference.startswith(("http:", "https:", "#", "mailto:", "tel:", "data:")):
            continue
        local = (html_file.parent / reference.split("?", 1)[0].split("#", 1)[0]).resolve()
        if not local.exists():
            fail(f"{html_file.relative_to(ROOT)}: missing {reference}")


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, _format: str, *_args: object) -> None:
        return


handler = partial(Quiet, directory=str(ROOT))
server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    base = f"http://127.0.0.1:{server.server_port}/"
    urls = [
        "index.html",
        "world-radio/index.html",
        "world-radio/player.html",
        "assets/js/market-base-radio-dock-v323.js",
        "assets/css/market-base-radio-dock-v323.css",
        "world-route/index.html",
        "world-route.html",
        "machine-container-packing/index.html",
        "settings/index.html",
        "assets/js/market-base-update-controller-v322.js",
        "version.txt",
        "sw.js",
    ]
    for relative in urls:
        with urlopen(base + relative, timeout=5) as response:
            body = response.read()
            if response.status != 200 or not body:
                fail(f"HTTP failed: {relative}")
finally:
    server.shutdown()
    server.server_close()
    thread.join(timeout=5)

print(
    "V324 HTTP SMOKE: PASS — 36-page update coverage, changed-page references, "
    "and 12 important HTTP endpoints verified"
)
