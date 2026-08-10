#!/usr/bin/env python3
"""Cumulative content/data regression checks for MARKET BASE V333.14."""

from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "ulce-data-v075.json"
PREVIOUS = ROOT / "data" / "ulce-data-v074.json"
HTML = ROOT / "ul-ce-learning" / "index.html"
BUILD_ID = "MARKET_BASE_V333_14_CACHE_REFRESH_STABILIZATION_20260804"
TOKEN = "20260804-v333-14-cache-refresh-stabilization"
OFFLINE_ID = "MARKET_BASE_OFFLINE_MANIFEST_V333_14_CACHE_REFRESH_STABILIZATION_20260804"
CF_TOKEN = "8cd800af9e2541f2ba41adb0d3c46a75"
LEGACY_FIELDS = {
    "action",
    "actionLabel",
    "actionItems",
    "template",
    "completion",
    "caution",
}
EXPECTED_GUIDANCE = {
    "explanation": 20,
    "decision": 78,
    "check": 177,
    "omit": 28,
}


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    previous = json.loads(PREVIOUS.read_text(encoding="utf-8"))
    qas = data["qas"]
    by_id = {item["id"]: item for item in qas}
    original_ids = {item["id"] for item in previous["qas"]}
    official = [item for item in qas if item.get("officialFaqDerived")]
    reviewed = [item for item in qas if item.get("factualReview")]

    check(data["version"] == "v075 / 2026-08-04", "wrong v075 version")
    check(len(qas) == 315, "Q&A count must be 315")
    check(len(by_id) == 315, "duplicate Q&A IDs")
    check(len(original_ids) == 303, "v074 baseline count changed")
    check(original_ids <= set(by_id), "an existing Q&A was removed")
    check(len(official) == 12, "official-FAQ addition count must be 12")
    check(len(reviewed) == 51, "factual correction count must be 51")
    check(data["summary"]["qaCount"] == 315, "summary Q&A count mismatch")
    check(data["summary"]["officialFaqAddedCount"] == 12, "official summary mismatch")
    check(data["summary"]["correctedQaCount"] == 51, "correction summary mismatch")
    check(data["summary"]["legacyActionBlocksRemoved"] == 303, "legacy removal summary mismatch")

    for item in qas:
        check(not (LEGACY_FIELDS & set(item)), f"legacy action field remains: {item['id']}")
        check("reason" not in item and "factualIssue" not in item, f"internal audit note leaked: {item['id']}")
        check(bool(item.get("question")), f"question missing: {item['id']}")
        check(bool(item.get("shortAnswer")), f"short answer missing: {item['id']}")
        check(bool(item.get("answer")), f"answer missing: {item['id']}")
        check(bool(item.get("sources")), f"official sources missing: {item['id']}")

    guidance = Counter(by_id[item_id].get("guidanceType") for item_id in original_ids)
    check(dict(guidance) == EXPECTED_GUIDANCE, f"guidance classification mismatch: {dict(guidance)}")
    check(data["summary"]["guidanceClassCounts"] == EXPECTED_GUIDANCE, "guidance summary mismatch")
    for item_id in original_ids:
        item = by_id[item_id]
        kind = item["guidanceType"]
        if kind == "explanation":
            check(bool(item.get("whatItMeans")), f"meaning explanation missing: {item_id}")
        elif kind == "decision":
            check(bool(item.get("decisionPoint")), f"decision point missing: {item_id}")
        elif kind == "check":
            check(bool(item.get("nextCheck")), f"next check missing: {item_id}")
        else:
            check(
                not any(item.get(key) for key in ("whatItMeans", "decisionPoint", "nextCheck")),
                f"omitted guidance still displayed: {item_id}",
            )

    for item in official:
        check(item.get("status") == "公式FAQ照合済", f"official review status missing: {item['id']}")
        check(item.get("sourceNote"), f"official source note missing: {item['id']}")
        check(len(item["answer"]) >= 120, f"official answer too short: {item['id']}")
        check(
            any(item.get(key) for key in ("whatItMeans", "decisionPoint", "nextCheck")),
            f"official Q&A lacks a useful follow-up: {item['id']}",
        )

    for item in reviewed:
        check(item["factualReview"] == "2026-08-04 official-source review", f"review date mismatch: {item['id']}")
        check(len(item["answer"]) >= 150, f"corrected answer remains too short: {item['id']}")

    required_ids = {
        "QA-COM-021",
        "QA-COM-022",
        "QA-COM-023",
        "QA-COM-024",
        "QA-INT-020",
        "QA-INT-021",
        "QA-INT-022",
        "QA-LST-016",
        "QA-LST-017",
        "QA-FLD-014",
        "QA-CEB-015",
        "QA-CEB-016",
    }
    check({item["id"] for item in official} == required_ids, "official Q&A ID set changed")
    check("そのままでは使えません" in by_id["QA-PNL-008"]["shortAnswer"], "SCCR correction missing")
    check("CEマークはその代わりになりません" in by_id["QA-COM-014"]["shortAnswer"], "CE/NRTL correction missing")
    check("原則2027年1月20日" in by_id["QA-CEB-004"]["shortAnswer"], "Machinery Regulation date missing")
    check("PED対象外とSEPは同じではありません" in by_id["QA-STM-005"]["answer"], "PED scope correction missing")

    html = HTML.read_text(encoding="utf-8")
    check(BUILD_ID in html, "UL page build ID mismatch")
    check(TOKEN in html, "UL page cache token mismatch")
    check("UL_EU規格_実務Q&A_v075_公式FAQ照合修正_20260804" in html, "v075 source meta missing")
    check("公式FAQから追加" in html, "official FAQ filter missing")
    check("公式FAQを基に整理" in html, "official FAQ badge missing")
    for label in ("詳しい説明", "つまりどういうこと？", "判断するときのポイント", "次に確認すること"):
        check(label in html, f"Q&A UI label missing: {label}")
    check("実務で行うこと" not in html, "legacy uniform action label remains")
    for expression in ("q.action", "q.actionItems", "q.template", "q.completion", "q.caution"):
        check(expression not in html, f"legacy rendering code remains: {expression}")

    match = re.search(r"window\.MARKET_BASE_ULCE_DATA=(\{.*?\});\s*</script>", html, re.S)
    check(bool(match), "embedded UL data missing")
    embedded = json.loads(match.group(1))
    check(embedded == data, "embedded UL data differs from v075 JSON")

    html_files = sorted(ROOT.rglob("*.html"))
    check(len(html_files) == 38, "public HTML count changed")
    for path in html_files:
        text = path.read_text(encoding="utf-8")
        check(text.count("data-cf-beacon") == 1, f"Cloudflare block count: {path}")
        check(text.count(CF_TOKEN) == 1, f"Cloudflare token count: {path}")

    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    check(manifest["version"] == "V333.14", "manifest version mismatch")
    check(manifest["build_id"] == BUILD_ID, "manifest build ID mismatch")
    check(TOKEN in manifest["start_url"] and TOKEN in manifest["id"], "manifest cache token mismatch")

    active_files = [
        ROOT / "version.txt",
        ROOT / "manifest.json",
        ROOT / "sw.js",
        ROOT / "assets" / "js" / "market-base-build.js",
        ROOT / "assets" / "js" / "market-base-update-controller-v334.js",
        ROOT / "index.html",
        ROOT / "offline.html",
        ROOT / "japan-food-machinery-v273-r58.html",
        ROOT / "flight-kitchen-v273-db-title-r27.html",
        HTML,
    ]
    for path in active_files:
        text = path.read_text(encoding="utf-8")
        check(BUILD_ID in text, f"current build ID missing: {path}")
        check("MARKET_BASE_V333_13_UL_QA_OFFICIAL_FAQ_REVISION_20260804" not in text, f"old build ID in {path}")
        check("20260804-v333-13-ul-qa-official-faq-revision" not in text, f"old token in {path}")

    offline = (ROOT / "assets" / "js" / "market-base-offline-manifest-v324.js").read_text(encoding="utf-8")
    check(OFFLINE_ID in offline, "offline manifest version mismatch")
    check("./data/ulce-data-v075.json" in offline, "v075 not included offline")

    jfm_db = ROOT / "data" / "japan_food_machinery_db_v075.json"
    jfm_research = ROOT / "data" / "japan_food_machinery_export_research_v076.json"
    jfm = json.loads(jfm_db.read_text(encoding="utf-8"))
    check(len(jfm["manufacturers"]) == 112 and len(jfm["machines"]) == 485, "JFM DB regression")
    check(digest(jfm_db) == "f1a55fc8e73ac7246b0d37ba75053cfe00f765a210f372de543872c6b71ee6b9", "JFM DB hash changed")
    check(digest(jfm_research) == "ce8433b647628d12272c450c885d1feea9cf5ceeca0c24ccc20939f9f170287b", "JFM research hash changed")

    catering = json.loads((ROOT / "data" / "catering_company_db_v109.json").read_text(encoding="utf-8"))
    catering_research = json.loads((ROOT / "data" / "catering_external_research_v109.json").read_text(encoding="utf-8"))
    check(catering["total_companies"] == 247, "catering company count changed")
    check(catering["researched_companies"] == 81, "catering research count changed")
    check(catering["source_link_count"] == 311, "catering source count changed")
    check(catering_research["target_count"] == 81 and catering_research["source_link_count"] == 311, "catering research regression")


    controller = (ROOT / "assets" / "js" / "market-base-update-controller-v334.js").read_text(encoding="utf-8")
    check("controllerRevision: 'v334'" in controller, "V333.14 controller revision missing")
    check("pageShellIsCurrent" in controller, "stale HTML shell recovery missing")
    check("AUTO_REFRESH_STATE_KEY" in controller, "bounded automatic refresh guard missing")
    service_worker = (ROOT / "sw.js").read_text(encoding="utf-8")
    check("REQUIRED.slice(0,9)" in service_worker, "lightweight worker install set missing")
    check("market-base-update-controller-v334.js" in service_worker, "V333.14 controller missing from worker shell")

    print(
        json.dumps(
            {
                "version": data["version"],
                "qaCount": len(qas),
                "officialFaqAdded": len(official),
                "factuallyCorrected": len(reviewed),
                "guidance": EXPECTED_GUIDANCE,
                "htmlPagesWithAnalytics": len(html_files),
                "databaseRegressions": "PASS",
                "result": "PASS",
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
