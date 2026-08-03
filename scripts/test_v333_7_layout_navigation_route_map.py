#!/usr/bin/env python3
"""Static regression checks for the MARKET BASE V333.7 patch."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOKEN = "20260803-v333-7-2-work-code-controls"
BUILD = "MARKET_BASE_V333_7_2_WORK_CODE_CONTROLS_20260803"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    build = read("assets/js/market-base-build.js")
    manifest = json.loads(read("manifest.json"))
    require(BUILD in build and TOKEN in build, "current build metadata is missing")
    require(manifest["version"] == "V333.7.2", "manifest version is not V333.7.2")
    require(manifest["build_id"] == BUILD, "manifest build ID mismatch")
    require(TOKEN in manifest["start_url"] and TOKEN in manifest["id"], "manifest cache token mismatch")

    radio = read("assets/js/market-base-radio-dock-v331.js")
    require("document.documentElement?.clientWidth" in radio, "radio dock must use the scrollbar-safe viewport width")
    require("HORIZONTAL_EDGE_GAP" not in radio, "a fixed mobile edge gap must not return")
    require("currentState?.playing || currentState?.status === 'playing'" in radio,
            "radio playing state must force the green tab")
    dock_css = read("assets/css/market-base-dual-dock-v331.css")
    require("html body .mb-radio-dock .mb-radio-dock-tab" in dock_css, "radio tab typography isolation is missing")

    shell = read("assets/css/market-base-standard-shell-r11372.css")
    require("@media(min-width:431px) and (max-width:899px)" in shell, "half-PC shell breakpoint is missing")
    require("width:min(calc(100% - 32px),760px)!important" in shell, "half-PC shell width is missing")
    require("main.guide-page .guide-section" in shell, "logistics guide selector is missing")
    require("margin-left:0!important" in shell and "margin-right:0!important" in shell, "logistics nested margin was not removed")

    reading_pages = [
        "british-jokes/index.html",
        "classic-move/index.html",
        "kimochi-biyori/index.html",
        "rakuda-no-me/index.html",
        "sutra-no-yoin/index.html",
    ]
    for path in reading_pages:
        page = read(path)
        require(page.count("mb-primary-bottom-tab active") == 1, f"{path}: expected one active bottom tab")
        active = re.search(r'<a class="mb-primary-bottom-tab active"[^>]*href="([^"]+)"', page)
        require(bool(active) and active.group(1).startswith("../index.html"), f"{path}: Home must be active")
        require('data-mb-active="home"' in page, f"{path}: desktop Home state is missing")
        require(re.search(r'<a class="mb-global-button"[^>]*href="\.\./index\.html(?:[?#][^"]*)?"[^>]*>\s*戻る', page) is not None,
                f"{path}: header Back must return to Home")

    controls = read("assets/js/market-base-scroll-controls-r11328.js")
    for prefix in ["british-jokes/", "classic-move/", "kimochi-biyori/", "rakuda-no-me/", "sutra-no-yoin/"]:
        require(prefix in controls, f"scroll BACK route missing: {prefix}")
    require(controls.index("if(HOME_RETURN_PREFIXES") < controls.index("if(LEARN_FILES[file]||LEARN_PREFIXES"),
            "reading Home routing must run before generic Learn routing")

    for path in ["world-route.html", "world-route/index.html"]:
        page = read(path)
        require("route-primary-header-host" in page and "mb-primary-header" in page, f"{path}: shared header missing")
        require("mbx-header-shell" not in page, f"{path}: obsolete header remains")
        require("market-base-ui-base.js" in page, f"{path}: refresh controller missing")
        require(f"world-route.js?v={TOKEN}" in page, f"{path}: route script cache token is stale")

    route_js = read("world-route/world-route.js")
    for marker in ["REGION_VIEWPORTS", "WORLD_MAP_URL", "route-map-base", "setAttribute(\n      'viewBox'", "viewport.label"]:
        require(marker in route_js, f"world route map feature missing: {marker}")
    route_css = read("world-route/world-route.css")
    require(".route-primary-header-host" in route_css, "route header geometry is missing")

    for html in ROOT.rglob("*.html"):
        text = html.read_text(encoding="utf-8", errors="ignore")
        if "market-base-standard-shell-r11372.css" in text:
            require(f"market-base-standard-shell-r11372.css?v={TOKEN}" in text,
                    f"{html.relative_to(ROOT)}: shared shell cache token is stale")

    sw = read("sw.js")
    require(TOKEN in sw and BUILD in sw, "service worker build metadata mismatch")
    require("work-code-share-guide-work-code-share-guide" not in sw, "duplicated cache token found")
    offline = read("assets/js/market-base-offline-manifest-v324.js")
    require("MARKET_BASE_OFFLINE_MANIFEST_V333_7_1_WORK_CODE_SHARE_GUIDE_20260803" in offline,
            "offline manifest version mismatch")

    subprocess.run(["node", str(ROOT / "scripts/test_v333_7_route_viewports.mjs")], check=True)
    print("V333.7.2 layout/navigation/route-map regression checks passed")


if __name__ == "__main__":
    main()
