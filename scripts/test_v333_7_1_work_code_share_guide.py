#!/usr/bin/env python3
"""WORK CODE sharing/help regression checks for MARKET BASE V333.7.1."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD = "MARKET_BASE_V333_7_2_WORK_CODE_CONTROLS_20260803"
TOKEN = "20260803-v333-7-2-work-code-controls"


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8", errors="replace")


def require(value: bool, message: str) -> None:
    if not value:
        raise AssertionError(message)


def main() -> None:
    manifest = json.loads(read("manifest.json"))
    require(manifest["version"] == "V333.7.2", "manifest version mismatch")
    require(manifest["build_id"] == BUILD, "manifest build mismatch")
    require(TOKEN in manifest["start_url"] and TOKEN in manifest["id"], "manifest token mismatch")
    require(read("version.txt").strip() == BUILD, "version.txt mismatch")

    html = read("market-base-code-tool.html")
    css = read("assets/css/market-base-code-tool-v332.css")
    js = read("assets/js/market-base-code-tool-v332.js")
    menu = read("assets/js/market-base-tool-menu-v333.js")

    require(BUILD in html and TOKEN in html, "WORK CODE page build metadata is stale")
    require("読み取り・作成・保存・共有できます" in html, "hero sharing description missing")
    require('<aside class="mb-code-share-guide"' in html, "visible LINE sharing guide missing")
    require("共有（LINEなど）" in html, "share button does not mention LINE")
    require(html.index("mb-code-share-guide") < html.index("mb-code-tabs"), "LINE guide must be visible before the tabs")
    require("端末の共有メニューに表示されるアプリ" in html, "share-sheet explanation missing")
    require(".mb-code-share-guide" in css, "visible guide styling missing")

    for option in ("url", "text", "phone", "email", "wifi", "vcard", "geo", "sms", "line"):
        require(f'<option value="{option}"' in html, f"QR type missing: {option}")
    for barcode in ("EAN13", "EAN8", "CODE128", "CODE39", "ITF", "UPCA"):
        require(f'<option value="{barcode}"' in html, f"barcode type missing: {barcode}")
    require("その他のLINEリンク" in html, "generic LINE-link option missing")
    require("文章・URLをLINEで共有" not in html, "inconsistent LINE-issued-link option remains")

    for marker in (
        "navigator.share", "new File([blob]", "PNGを保存しました", "window.print()",
        "const MAX_HISTORY=20", "sensitive:true", "scanFile(file)", "startScanner",
    ):
        require(marker in js, f"WORK CODE runtime capability missing: {marker}")
    require("カメラ映像は端末内で処理します" in html, "on-device camera note missing")
    require("最大20件をこの端末に保存します" in html, "history storage note missing")
    require("Wi-Fiのパスワードは履歴へ保存しません" in html, "Wi-Fi privacy note missing")

    positions = [menu.index("id:'calculator'"), menu.index("id:'currency'"), menu.index("id:'workphoto'"), menu.index("id:'code'")]
    require(positions == sorted(positions), "WORK CODE is not toward the back of the tool menu")
    require("読取・作成・共有" in menu, "tool-menu capability summary missing")

    sw = read("sw.js")
    require(BUILD in sw and TOKEN in sw, "service-worker build/token mismatch")
    require(f"market-base-code-tool.html?v={TOKEN}" in sw, "WORK CODE page is not refreshed by the service worker")
    require(f"market-base-code-tool-v332.css?v={TOKEN}" in sw, "WORK CODE CSS is not refreshed")
    require(f"market-base-code-tool-v332.js?v={TOKEN}" in sw, "WORK CODE JS is not refreshed")

    for path in [
        "assets/js/market-base-code-tool-v332.js",
        "assets/js/market-base-tool-menu-v333.js",
        "assets/js/market-base-build.js",
        "sw.js",
    ]:
        subprocess.run(["node", "--check", str(ROOT / path)], check=True)

    print("V333.7.1 WORK CODE sharing/help checks passed")


if __name__ == "__main__":
    main()
