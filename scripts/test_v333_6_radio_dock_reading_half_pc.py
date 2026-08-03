#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
TOKEN = "20260803-v333-6-radio-dock-reading-half-pc-unification"
BUILD = "MARKET_BASE_V333_6_RADIO_DOCK_READING_HALF_PC_UNIFICATION_20260803"

def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

scroll = read("assets/js/market-base-scroll-controls-r11328.js")
controller = read("assets/js/market-base-update-controller-v333.js")
dock = read("assets/js/market-base-radio-dock-v331.js")
player = read("world-radio/assets/world-radio-player.js")
css = read("assets/css/market-base-reading-half-pc-v3336.css")

assert "market-base-update-controller-v333.js" in scroll
assert "market-base-update-controller-v331.js" not in scroll
assert "market-base-tool-menu-v333.js" in controller
assert "market-base-tool-dock-v331.js" not in controller
assert TOKEN in scroll and TOKEN in controller
assert "document.documentElement?.clientWidth" in dock
assert "HORIZONTAL_EDGE_GAP = 8" in dock
assert "seekbackward: () => stepStation(-1" in player
assert "seekforward: () => stepStation(1" in player

assert "(min-width:431px) and (max-width:899px)" in css
assert "width:min(calc(100% - 32px),760px)!important" in css
for marker in ("british-jokes-page", "classic-move-page", "kb-page", "sutra-page", "world-radio-page"):
    assert marker in css

for page in (
    "british-jokes/index.html",
    "classic-move/index.html",
    "kimochi-biyori/index.html",
    "sutra-no-yoin/index.html",
    "world-radio/index.html",
):
    html = read(page)
    assert "market-base-reading-half-pc-v3336.css" in html
    assert TOKEN in html
    assert BUILD in html

manifest = json.loads(read("manifest.json"))
assert manifest["version"] == "V333.6"
assert manifest["build_id"] == BUILD
assert TOKEN in manifest["start_url"]

offline = read("assets/js/market-base-offline-manifest-v324.js")
match = re.search(r"Object\.freeze\((\{.*\})\);", offline)
assert match
offline_data = json.loads(match.group(1))
assert "./assets/css/market-base-reading-half-pc-v3336.css" in offline_data["textAssets"]
assert "V333_6" in offline_data["version"]

assert read("version.txt").strip() == BUILD
assert TOKEN in read("sw.js")

print("V333.6 radio dock and half-PC reading regression checks passed")
