#!/usr/bin/env python3
"""Static release-integrity audit for MARKET BASE V333.16."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD_ID = "MARKET_BASE_V333_16_RADIO_LIFECYCLE_UI_PERFORMANCE_20260810"
TOKEN = "20260810-v333-16-radio-lifecycle-ui-performance"
VERSION = "V333.16"


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def require_file(relative: str) -> None:
    path = ROOT / relative
    assert path.is_file() and path.stat().st_size > 0, f"missing release file: {relative}"


manifest = json.loads(read("manifest.json"))
assert read("version.txt").strip() == BUILD_ID
assert manifest["name"] == "MARKET BASE V.333.16"
assert manifest["version"] == VERSION
assert manifest["build_id"] == BUILD_ID
assert TOKEN in manifest["start_url"] and TOKEN in manifest["id"]

current_assets = [
    "assets/css/market-base-radio-dock-v333-16.css",
    "assets/js/market-base-radio-dock-v333-16.js",
    "assets/js/app-v273-country-profile-r28-refresh-route-header-r97.js",
    "embedded-cross-db-search-summary-v333-16.js",
    "scripts/build_cross_db_search_summary_v333_16.mjs",
    "scripts/test_v333_16_radio_lifecycle.mjs",
    "scripts/test_v333_16_radio_dock_contract.mjs",
    "scripts/test_v333_16_sw_boot_performance.mjs",
]
for relative in current_assets:
    require_file(relative)

index = read("index.html")
for expected in (
    BUILD_ID,
    TOKEN,
    "market-base-radio-dock-v333-16.css",
    "market-base-radio-dock-v333-16.js",
    "embedded-cross-db-search-summary-v333-16.js",
    "app-v273-country-profile-r28-refresh-route-header-r97.js",
):
    assert expected in index, f"index.html missing {expected}"
assert not re.search(
    r'<script\b[^>]*\bsrc=["\'][^"\']*embedded-cross-db-search-index-v273-db-title-r27\.js',
    index,
    flags=re.I,
), "full cross-DB index must not be parser blocking"

html_files = sorted(
    path for path in ROOT.rglob("*.html")
    if "HANDOFF_DOCUMENTS" not in path.parts
)
assert len(html_files) == 38, f"expected 38 public HTML files, found {len(html_files)}"
for path in html_files:
    body = path.read_text(encoding="utf-8")
    relative = path.relative_to(ROOT).as_posix()
    assert BUILD_ID in body, f"{relative}: current build metadata missing"
    if relative == "world-radio/player.html":
        assert "market-base-update-controller" not in body, (
            "radio player must stay outside the global auto-refresh controller"
        )
    else:
        assert "market-base-update-controller-v335.js" in body, (
            f"{relative}: current update controller missing"
        )

controller = read("assets/js/market-base-update-controller-v335.js")
for expected in (BUILD_ID, TOKEN, "market-base-radio-dock-v333-16.js"):
    assert expected in controller
assert re.search(r"validUntil\s*>\s*0\s*\?\s*validUntil\s*>\s*now", controller)

sw = read("sw.js")
assert BUILD_ID in sw and TOKEN in sw
required_match = re.search(r"const REQUIRED=(\[[\s\S]*?\]);", sw)
assert required_match, "service-worker REQUIRED array missing"
required = json.loads(required_match.group(1).replace("'", '"'))
for relative in required:
    local_path = relative.split("?", 1)[0].removeprefix("./")
    if local_path:
        require_file(local_path)

offline_manifest = read("assets/js/market-base-offline-manifest-v335.js")
assert "MARKET_BASE_OFFLINE_MANIFEST_V333_16_RADIO_LIFECYCLE_UI_PERFORMANCE_20260810" in offline_manifest
assert "market-base-radio-dock-v333-16.js" in offline_manifest
assert "market-base-radio-dock-v333-16.css" in offline_manifest

byte_identical_groups = [
    (
        "assets/js/market-base-runtime-v335.js",
        "assets/js/market-base-runtime-v334.js",
        "assets/js/market-base-runtime-r11348.js",
    ),
    (
        "assets/js/market-base-scroll-controls-v334.js",
        "assets/js/market-base-scroll-controls-r11328.js",
    ),
    (
        "assets/js/market-base-offline-manifest-v335.js",
        "assets/js/market-base-offline-manifest-v334.js",
        "assets/js/market-base-offline-manifest-v324.js",
    ),
]
for group in byte_identical_groups:
    payloads = [(ROOT / relative).read_bytes() for relative in group]
    assert all(payload == payloads[0] for payload in payloads[1:]), (
        f"compatibility copies differ: {', '.join(group)}"
    )

print("PASS — V333.16 build metadata, public pages, current assets, SW shell, and compatibility copies")
