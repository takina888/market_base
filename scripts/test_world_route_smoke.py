#!/usr/bin/env python3
"""End-to-end local smoke test for the World Route learning entry."""

from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
from urllib.parse import quote
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parent.parent
ROUTE = ROOT / "world-route"
VERSION = "20260727-r11372"
FIRST_IMAGE = "images/representative/01_TW_日本から台湾.png"
CRITICAL = (
    "index.html",
    "market-base-ui-base.css",
    "world-route.css",
    "world-route-integration-r11340.css",
    "world-route-data.js",
    "market-base-ui-base.js",
    "world-route.js",
    FIRST_IMAGE,
)


def fail(message: str) -> None:
    raise SystemExit(f"WORLD ROUTE SMOKE TEST: FAIL — {message}")


for relative in CRITICAL:
    path = ROUTE / relative
    if not path.is_file() or path.stat().st_size == 0:
        fail(f"critical file is missing or empty: world-route/{relative}")

data_source = (ROUTE / "world-route-data.js").read_text(encoding="utf-8")
prefix = "window.WBR_DATA = "
if not data_source.startswith(prefix):
    fail("world-route-data.js does not expose window.WBR_DATA")
payload = data_source[len(prefix) :].strip()
if payload.endswith(";"):
    payload = payload[:-1]
try:
    data = json.loads(payload)
except json.JSONDecodeError as error:
    fail(f"world-route-data.js JSON is invalid: {error}")

counts = data.get("metadata", {}).get("counts", {})
if counts.get("countries") != 20 or counts.get("routes") != 63:
    fail(f"unexpected data counts: {counts}")
if len(data.get("tables", {}).get("countries", [])) != 20:
    fail("country table does not contain 20 countries")
if len(data.get("tables", {}).get("routes", [])) != 63:
    fail("route table does not contain 63 routes")

route_cards = data.get("route_cards", {})
if len(route_cards) != 20:
    fail(f"expected 20 route cards, found {len(route_cards)}")
declared_images: set[str] = set()
for country_id, card in route_cards.items():
    for variant in ("representative", "alternate"):
        relative = card.get(variant, "")
        if not relative:
            fail(f"{country_id}: {variant} route image is not declared")
        declared_images.add(relative)
        image_path = ROUTE / relative
        if not image_path.is_file() or image_path.stat().st_size == 0:
            fail(f"{country_id}: route image is missing: {relative}")
if len(declared_images) != 40:
    fail(f"expected 40 unique route images, found {len(declared_images)}")

html = (ROUTE / "index.html").read_text(encoding="utf-8")
for marker in (
    "data-wbr-country-grid",
    "data-wbr-route-image",
    "world-route-data.js",
    "world-route.js",
    "mb-learning-content-shell",
):
    if marker not in html:
        fail(f"entry HTML lost required marker: {marker}")

index = (ROOT / "index.html").read_text(encoding="utf-8")
if f"world-route/index.html?v={VERSION}" not in index:
    fail("home Learn link is not on the current World Route version")

sw = (ROOT / "sw.js").read_text(encoding="utf-8")
for relative in CRITICAL:
    expected = f"./world-route/{relative}?v={VERSION}"
    if expected not in sw:
        fail(f"service-worker critical cache entry is missing: {expected}")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format: str, *_args: object) -> None:
        return


handler = partial(QuietHandler, directory=str(ROOT))
server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    base = f"http://127.0.0.1:{server.server_port}/world-route/"
    for relative in CRITICAL:
        url = base + quote(relative)
        try:
            with urlopen(url, timeout=5) as response:
                payload_bytes = response.read()
                if response.status != 200 or not payload_bytes:
                    fail(
                        f"HTTP smoke failed for {relative}: "
                        f"status={response.status}, bytes={len(payload_bytes)}"
                    )
        except OSError as error:
            fail(f"HTTP smoke failed for {relative}: {error}")
finally:
    server.shutdown()
    server.server_close()
    thread.join(timeout=5)

print(
    "WORLD ROUTE SMOKE TEST: PASS — entry, 20 countries, 63 routes, "
    "40 images, service-worker entries and local HTTP delivery verified"
)
