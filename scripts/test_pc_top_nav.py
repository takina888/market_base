#!/usr/bin/env python3
"""Regression checks for the MARKET BASE PC global icon navigation."""

from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
NAV_JS = ROOT / "assets/js/market-base-desktop-icon-nav-r11337.js"
NAV_CSS = ROOT / "assets/css/market-base-desktop-icon-nav-r11337.css"
INDEX = ROOT / "index.html"
VERSION = "20260727-r11371"


def fail(message: str) -> None:
    raise SystemExit(f"PC TOP NAV TEST: FAIL — {message}")


nav_js = NAV_JS.read_text(encoding="utf-8")
nav_css = NAV_CSS.read_text(encoding="utf-8")
index = INDEX.read_text(encoding="utf-8")

items_match = re.search(r"var items=\[(.*?)\n  \];", nav_js, re.S)
if not items_match:
    fail("items definition was not found")

items = re.findall(r"\['([^']+)','([^']+)','([^']+)'\]", items_match.group(1))
labels = [label for _key, label, _href in items]
expected = ["ホーム", "国・地域", "ツール", "検索", "ランキング", "比較", "学ぶ"]

if labels != expected:
    fail(f"unexpected PC tab order: {labels}")
if any(key == "rice" or label == "米データ" for key, label, _href in items):
    fail("the 米データ item remains in the PC navigation")
if "grid-template-columns:repeat(7,var(--mb-pc-icon-nav-button-width));" not in nav_css:
    fail("the PC navigation grid is not seven columns")
if "@media (min-width:900px)" not in nav_css:
    fail("the PC-only display breakpoint is missing")

html_files = sorted(ROOT.rglob("*.html"))
referencing_pages = [
    path for path in html_files
    if "market-base-desktop-icon-nav-r11337.js" in path.read_text(encoding="utf-8")
]
if not referencing_pages:
    fail("no HTML page loads the shared PC navigation")

expected_reference = (
    f"market-base-desktop-icon-nav-r11337.js?v={VERSION}"
)
stale_pages = [
    path.relative_to(ROOT).as_posix()
    for path in referencing_pages
    if expected_reference not in path.read_text(encoding="utf-8")
]
if stale_pages:
    fail(f"stale navigation asset version: {', '.join(stale_pages)}")

# Only the PC shortcut is removed. The rice data view must remain available.
if 'data-view="rice"' not in index or 'id="rice"' not in index:
    fail("the rice data feature itself was removed")

print(
    "PC TOP NAV TEST: PASS — "
    f"{len(items)} tabs, 米データ shortcut removed, "
    f"{len(referencing_pages)} page references current"
)
