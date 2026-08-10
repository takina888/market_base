#!/usr/bin/env python3
"""Regression checks for the V333.12 UL Q&A explanation expansion."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "ulce-data-v074.json"
HTML = ROOT / "ul-ce-learning" / "index.html"
BUILD_ID = "MARKET_BASE_V333_12_UL_QA_EXPLANATION_DEPTH_20260803"
TOKEN = "20260803-v333-12-ul-qa-explanation-depth"
CF_TOKEN = "8cd800af9e2541f2ba41adb0d3c46a75"


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    qas = data["qas"]
    starters = [item for item in qas if item.get("starter")]
    featured = [item for item in qas if item.get("featured")]

    check(data["version"] == "v074 / 2026-08-03", "wrong v074 version")
    check(len(qas) == 303, "Q&A count changed")
    check(len({item["id"] for item in qas}) == 303, "duplicate Q&A IDs")
    check(len(starters) == 38, "starter count changed")
    check(len(featured) == 8, "featured count changed")
    check(data["summary"]["expandedQaCount"] == 38, "expanded count missing")

    for item in starters:
        check(item.get("explanationDepth") == "detailed", f"{item['id']} not marked detailed")
        check(len(item.get("answer", "")) >= 220, f"{item['id']} answer is still too short")
        check(len(item.get("example", "")) >= 55, f"{item['id']} example is too short")
        check(len(item.get("misunderstanding", "")) >= 40, f"{item['id']} misunderstanding is too short")
        check(len(item.get("actionItems", [])) >= 3, f"{item['id']} lacks concrete actions")
        check(item.get("completion"), f"{item['id']} lacks completion condition")

    by_id = {item["id"]: item for item in qas}
    check("部品の認証マークを足し算" in by_id["QA-COM-006"]["misunderstanding"], "component scope explanation regressed")
    check("盤が接続するモーター" in by_id["QA-PNL-001"]["answer"], "UL 508A scope explanation regressed")
    check("通常運転電流やブレーカー単体" in by_id["QA-PNL-007"]["answer"], "SCCR explanation regressed")
    check("OSHAが認めた機関はほかにも" in by_id["QA-COM-003"]["answer"], "NRTL explanation regressed")

    html = HTML.read_text(encoding="utf-8")
    check(BUILD_ID in html, "UL page build ID mismatch")
    check(TOKEN in html, "UL page cache token mismatch")
    check("UL_EU規格_実務Q&A_v074_説明拡充_20260803" in html, "v074 source meta missing")
    for phrase in ("背景と仕組みをわかりやすく説明", "具体例", "よくある誤解", "関連する詳しい解説"):
        check(phrase in html, f"UI block missing: {phrase}")
    check("function qaRelatedHtml" in html, "related long-form article links missing")

    match = re.search(r"window\.MARKET_BASE_ULCE_DATA=(\{.*?\});\s*</script>", html, re.S)
    check(bool(match), "embedded UL data missing")
    embedded = json.loads(match.group(1))
    check(embedded == data, "embedded UL data differs from v074 JSON")

    html_files = sorted(ROOT.rglob("*.html"))
    check(len(html_files) == 38, "public HTML count changed")
    for path in html_files:
        text = path.read_text(encoding="utf-8")
        check(text.count("data-cf-beacon") == 1, f"Cloudflare block count: {path}")
        check(text.count(CF_TOKEN) == 1, f"Cloudflare token count: {path}")

    active_files = [
        ROOT / "version.txt",
        ROOT / "manifest.json",
        ROOT / "sw.js",
        ROOT / "assets" / "js" / "market-base-build.js",
        ROOT / "assets" / "js" / "market-base-update-controller-v333.js",
        ROOT / "index.html",
        ROOT / "offline.html",
        ROOT / "japan-food-machinery-v273-r58.html",
        ROOT / "flight-kitchen-v273-db-title-r27.html",
        HTML,
    ]
    for path in active_files:
        text = path.read_text(encoding="utf-8")
        check("MARKET_BASE_V333_11_UL_QA_PLAIN_LANGUAGE_20260803" not in text, f"old build ID in {path}")
        check("20260803-v333-11-ul-qa-plain-language" not in text, f"old token in {path}")

    offline = (ROOT / "assets" / "js" / "market-base-offline-manifest-v324.js").read_text(encoding="utf-8")
    check("MARKET_BASE_OFFLINE_MANIFEST_V333_12_UL_QA_EXPLANATION_DEPTH_20260803" in offline, "offline version mismatch")
    check("./data/ulce-data-v074.json" in offline, "v074 not included offline")

    lengths = [len(item["answer"]) for item in starters]
    print(
        json.dumps(
            {
                "version": data["version"],
                "qaCount": len(qas),
                "expanded": len(starters),
                "answerChars": {"min": min(lengths), "max": max(lengths)},
                "htmlPagesWithAnalytics": len(html_files),
                "result": "PASS",
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
