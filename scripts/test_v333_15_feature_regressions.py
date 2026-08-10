#!/usr/bin/env python3
"""Cumulative feature regression checks retained by V333.15."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = "MARKET_BASE_V333_15_COUNTRY_DISTINCTIVE_FACTS_20260809"
TOKEN = "20260809-v333-15-country-distinctive-facts"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def main() -> None:
    # WORK CODE controls introduced before V333.15 must remain intact.
    code_html = read("market-base-code-tool.html")
    code_js_path = ROOT / "assets/js/market-base-code-tool-v332.js"
    code_js = code_js_path.read_text(encoding="utf-8")
    code_css = read("assets/css/market-base-code-tool-v332.css")
    for control in (
        "mbCodeHelp", "mbCodeHelpModal", "mbCodeFullscreen", "mbCodeFullscreenModal",
        "mbCodeResultShare", "mbCodeCameraTools", "mbCodeTorch", "mbCodeZoom",
    ):
        require(f'id="{control}"' in code_html, f"WORK CODE control missing: {control}")
    for marker in (
        "openHelp", "closeOverlay", "canvas.toDataURL('image/png')",
        "async function shareScanResult", "navigator.share", "getCapabilities",
        "torchButton.hidden=!hasTorch", "zoomWrap.hidden=!hasZoom", "applyConstraints",
    ):
        require(marker in code_js, f"WORK CODE behavior missing: {marker}")
    require(".mb-code-modal,.mb-code-fullscreen{position:fixed" in code_css,
            "WORK CODE fullscreen viewport CSS missing")
    require('<option value="vcard">名刺（vCard）</option>' in code_html,
            "existing vCard option removed")
    require("LINEなどで使えます" in code_html, "LINE usage guide missing")
    require(BUILD in code_html and TOKEN in code_html, "WORK CODE shell identity is stale")

    # World radio stream/fallback controls and dock behavior.
    stations = read("world-radio/assets/world-radio-stations.js")
    player = read("world-radio/assets/world-radio-player.js")
    dock = read("assets/js/market-base-radio-dock-v331.js")
    for marker in (
        "airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio005/hlspbaudio005_Auto.m3u8",
        "airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudioragam/hlspbaudioragam_Auto.m3u8",
        "🇪🇸 スペイン｜Flamenco Radio",
        "rtva-live-radio.flumotion.com/rtva/flamenco.mp3",
        "2794_64.aac",
        "2794_128.mp3",
    ):
        require(marker in stations, f"radio station/fallback missing: {marker}")
    for marker in (
        "function tryNextStream", "activeStreamIndex += 1",
        "seekbackward: () => stepStation(-1", "seekforward: () => stepStation(1",
    ):
        require(marker in player, f"radio player behavior missing: {marker}")
    require("document.documentElement?.clientWidth" in dock,
            "radio dock no longer uses scrollbar-safe viewport width")
    require("currentState?.playing || currentState?.status === 'playing'" in dock,
            "radio playing state indicator regressed")

    # Route map and responsive reading shells.
    route_js = read("world-route/world-route.js")
    for marker in ("REGION_VIEWPORTS", "WORLD_MAP_URL", "route-map-base", "viewport.label"):
        require(marker in route_js, f"world route map feature missing: {marker}")
    for page in ("world-route.html", "world-route/index.html"):
        html = read(page)
        require("route-primary-header-host" in html and "mb-primary-header" in html,
                f"{page}: shared route header missing")
        require(f"world-route.js?v={TOKEN}" in html, f"{page}: current route token missing")
    half_pc = read("assets/css/market-base-reading-half-pc-v3336.css")
    require("(min-width:431px) and (max-width:899px)" in half_pc,
            "half-PC reading breakpoint missing")
    require("width:min(calc(100% - 32px),760px)!important" in half_pc,
            "half-PC reading width missing")

    # Release and Service Worker retain all major feature assets.
    manifest = json.loads(read("manifest.json"))
    require(manifest.get("version") == "V333.15", "manifest version mismatch")
    require(manifest.get("build_id") == BUILD, "manifest build mismatch")
    require(TOKEN in manifest.get("start_url", ""), "manifest token mismatch")
    sw = read("sw.js")
    for marker in (
        "market-base-code-tool-v332.js", "market-base-code-tool-v332.css",
        "market-base-radio-dock-v331.js", "market-base-dual-dock-v331.css",
        "world-radio-player.js", "world-route/world-route.js",
    ):
        require(marker in sw, f"Service Worker feature asset missing: {marker}")

    for path in (
        code_js_path,
        ROOT / "world-radio/assets/world-radio-player.js",
        ROOT / "world-radio/assets/world-radio-stations.js",
        ROOT / "world-route/world-route.js",
        ROOT / "assets/js/market-base-radio-dock-v331.js",
    ):
        subprocess.run(["node", "--check", str(path)], check=True)

    print(json.dumps({
        "status": "PASS",
        "workCode": "PASS",
        "worldRadio": "PASS",
        "worldRoute": "PASS",
        "halfPcReading": "PASS",
        "release": "V333.15",
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
