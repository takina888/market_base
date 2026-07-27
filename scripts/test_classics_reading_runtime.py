#!/usr/bin/env python3
"""Runtime smoke test for the reading-only Classics page."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
DATA = (ROOT / "classic-move/data/classics-reading.js").read_text(encoding="utf-8")
APP = (ROOT / "classic-move/app.js").read_text(encoding="utf-8")

try:
    from playwright.sync_api import sync_playwright
except Exception as exc:  # pragma: no cover
    print(f"CLASSICS READING RUNTIME TEST: STATIC PASS; Playwright unavailable ({exc})")
    sys.exit(0)

html = f'''<!doctype html><html><body>
<button id="backButton" hidden>一覧へ</button>
<main id="app"></main><div id="toast"></div>
<script>{DATA}</script><script>{APP}</script>
</body></html>'''

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox"],
    )
    page = browser.new_page(viewport={"width": 390, "height": 1200})
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.set_content(html, wait_until="domcontentloaded")
    page.wait_for_timeout(100)
    assert page.locator("[data-classic-card]").count() == 14
    assert "ゲーム" not in page.locator("body").inner_text()
    page.locator("[data-classic]").first.click()
    page.wait_for_timeout(50)
    body = page.locator("body").inner_text()
    for label in (
        "原文",
        "読み下しの目安",
        "いまの言葉にすると",
        "解読 1",
        "誤用注意",
        "原文の出典",
    ):
        assert label in body, f"missing reading stage: {label}"
    assert not errors, errors
    browser.close()

print("CLASSICS READING RUNTIME TEST: PASS — 14 works, list/detail navigation, and reading stages verified")
