#!/usr/bin/env python3
import json
import hashlib
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD_ID = "MARKET_BASE_V333_10_CLOUDFLARE_WEB_ANALYTICS_20260803"
ASSET_VERSION = "20260803-v333-10-cloudflare-web-analytics"
errors = []


def check(condition, message):
    if not condition:
        errors.append(message)


def read(relative):
    return (ROOT / relative).read_text(encoding="utf-8")


db = json.loads(read("data/catering_company_db_v109.json"))
research = json.loads(read("data/catering_external_research_v109.json"))
page = read("flight-kitchen-v273-db-title-r27.html")
cross_index = read("embedded-cross-db-search-index-v273-db-title-r27.js")
manifest = json.loads(read("manifest.json"))
offline_manifest = read("assets/js/market-base-offline-manifest-v324.js")
jfm_db_bytes = (ROOT / "data/japan_food_machinery_db_v075.json").read_bytes()
jfm_research_bytes = (ROOT / "data/japan_food_machinery_export_research_v076.json").read_bytes()
jfm_db = json.loads(jfm_db_bytes)
jfm_research = json.loads(jfm_research_bytes)

check(read("version.txt").strip() == BUILD_ID, "version.txt build ID mismatch")
check(manifest.get("version") == "V333.10", "manifest version mismatch")
check(manifest.get("build_id") == BUILD_ID, "manifest build ID mismatch")
check(ASSET_VERSION in manifest.get("start_url", ""), "manifest start_url lacks asset version")
for relative in [
    "index.html",
    "offline.html",
    "sw.js",
    "assets/js/market-base-build.js",
    "assets/js/market-base-update-controller-v333.js",
    "assets/js/market-base-offline-manifest-v324.js",
]:
    value = read(relative)
    expected_token = "V333_10_CLOUDFLARE_WEB_ANALYTICS_20260803" if relative == "assets/js/market-base-offline-manifest-v324.js" else BUILD_ID
    check(expected_token in value, f"{relative} lacks current build token")
    check("MARKET_BASE_V333_8_JFM_EXPORT_DB_20260803" not in value, f"{relative} retains stale build ID")

check(db.get("database_name") == "ケータリング・機内食業者DB", "canonical DB name mismatch")
check(db.get("total_companies") == 247, "canonical DB must contain 247 companies")
check(len(db.get("companies", [])) == 247, "canonical company array count mismatch")
check(len({row.get("company_id") for row in db.get("companies", [])}) == 247, "company IDs are not unique")
check(db.get("researched_companies") == 81, "priority research set must contain 81 companies")
check(db.get("researched_companies") == research.get("target_count"), "research target count mismatch")
check(len(research.get("records", [])) == research.get("target_count"), "research record count mismatch")
check(db.get("source_link_count") == research.get("source_link_count"), "source link count mismatch")
check(db.get("source_link_count") == sum(len(row.get("sources", [])) for row in research.get("records", [])), "source link metadata is not derived from records")
check(db.get("confirmed_field_count") == sum(len(row.get("confirmed_fields", {})) for row in research.get("records", [])), "confirmed field metadata is not derived from records")
check(db.get("source_link_count", 0) > 0, "no external source links recorded")
check(db.get("confirmed_field_count", 0) > 0, "no confirmed fields recorded")
check("./data/catering_company_db_v109.json" in offline_manifest, "canonical catering DB missing from offline manifest")
check("./data/catering_external_research_v109.json" in offline_manifest, "catering research log missing from offline manifest")
check(len({row.get("company_id") for row in research.get("records", [])}) == research.get("target_count"), "research company IDs are not unique")

expected_research_ids = {
    *(f"COM_{value:06d}" for value in range(1, 30)),
    *(f"COM_{value:06d}" for value in [36, 41, 42, 43, 44, 46, 47, 51, 58, 60, 68, 69, 70, 75, 76, 77, 78]),
    *(f"COM_{value:06d}" for value in [144, 145, 152, 160, 181, 183, 184, 185, 186, 187, 191, 192, 194, 198, 205, 207, 220, 221]),
    *(f"COM_{value:06d}" for value in range(231, 248)),
}
db_ids = {row.get("company_id") for row in db.get("companies", [])}
research_ids = {row.get("company_id") for row in research.get("records", [])}
check(research_ids == expected_research_ids, "priority research company ID set changed")
check(research_ids <= db_ids, "research contains company IDs absent from canonical DB")

for row in research.get("records", []):
    check(re.fullmatch(r"COM_\d{6}", row.get("company_id", "")) is not None, "invalid research company ID")
    check(row.get("identity_status") in {"core_confirmed", "edge", "private", "retail", "historical", "unconfirmed"}, f"invalid identity status: {row.get('company_id')}")
    check(row.get("checked_date") == "2026-08-03", f"checked date mismatch: {row.get('company_id')}")
    for source in row.get("sources", []):
        check(re.match(r"^https?://", source.get("url", "")) is not None, f"invalid source URL: {row.get('company_id')}")
        check(bool(source.get("title")), f"source title missing: {row.get('company_id')}")
        check(bool(source.get("source_type")), f"source type missing: {row.get('company_id')}")
        check(bool(source.get("confirmed_fact")), f"source confirmed fact missing: {row.get('company_id')}")
    for project in row.get("projects", []):
        check(bool(project.get("fact")), f"project fact missing: {row.get('company_id')}")
        check(bool(project.get("source_urls")), f"project source URL missing: {row.get('company_id')}")

check("<title>ケータリング・機内食業者DB</title>" in page, "page title mismatch")
check('<h1 class="title">ケータリング・機内食業者DB</h1>' in page, "page H1 mismatch")
check("世界フライトキッチン・航空ケータリングDB" not in page, "old page title remains")
check(len(re.findall(r'<article class="card"', page)) == 247, "page card count mismatch")
check(len(re.findall(r'data-entity-id="COM_\d{6}"', page)) == 247, "page entity ID count mismatch")
check(len(re.findall(r'data-researched="true"', page)) == research.get("target_count"), "researched card count mismatch")
page_ids = set(re.findall(r'data-entity-id="(COM_\d{6})"', page))
researched_page_ids = set(re.findall(r'<article class="card"[^>]*data-researched="true"[^>]*data-entity-id="(COM_\d{6})"', page))
check(page_ids == db_ids, "page company ID set differs from canonical DB")
check(researched_page_ids == research_ids, "page researched company set differs from research log")
check(BUILD_ID in page, "flight-kitchen page lacks current build ID")
check(ASSET_VERSION in page, "flight-kitchen page lacks current cache-buster")
check("HNA LSG a a" not in page, "corrupted generated fragment remains")
check("ブルネイ、s a 施設" not in page, "corrupted Brunei fragment remains")
check("公開情報では具体的な拡張計画を確認できません" not in page, "explicit non-finding remains as expansion fact")
check("時点時点" not in page and "website check時点" not in page, "duplicated or malformed as-of suffix remains")

companies_by_id = {row["company_id"]: row for row in db["companies"]}
check(not companies_by_id["COM_000001"]["fields"].get("社員数"), "unverified COM_000001 employee count remains")
check(not companies_by_id["COM_000002"]["fields"].get("売上高"), "group revenue remains on COM_000002")
check("77,000" in companies_by_id["COM_000003"]["fields"].get("生産能力・規模", ""), "COM_000003 capacity correction missing")
check("60,000" in companies_by_id["COM_000015"]["fields"].get("生産能力・規模", ""), "COM_000015 current capacity correction missing")
check(companies_by_id["COM_000043"]["external_research"]["identity_status"] == "retail", "COM_000043 retail classification missing")
check(companies_by_id["COM_000245"]["external_research"]["identity_status"] == "core_confirmed", "COM_000245 core classification correction missing")
check(companies_by_id["COM_000246"]["external_research"]["identity_status"] == "edge", "COM_000246 edge classification correction missing")
check(not companies_by_id["COM_000246"]["fields"].get("生産能力・規模"), "unverified COM_000246 production capacity remains")

check(len(jfm_db.get("manufacturers", [])) == 112, "V333.8 JFM manufacturer regression")
check(len(jfm_db.get("machines", [])) == 485, "V333.8 JFM machine regression")
check(jfm_research.get("target_count") == 74 and len(jfm_research.get("records", [])) == 74, "V333.8 JFM external research regression")
check(hashlib.sha256(jfm_db_bytes).hexdigest() == "f1a55fc8e73ac7246b0d37ba75053cfe00f765a210f372de543872c6b71ee6b9", "V333.8 JFM DB content changed")
check(hashlib.sha256(jfm_research_bytes).hexdigest() == "ce8433b647628d12272c450c885d1feea9cf5ceeca0c24ccc20939f9f170287b", "V333.8 JFM research content changed")

match = re.search(r"window\.MARKET_BASE_CROSS_DB_SEARCH_INDEX=(\{.*?\});", cross_index, re.DOTALL)
check(match is not None, "cross-DB index JSON not found")
if match:
    index = json.loads(match.group(1))
    catering = next((item for item in index.get("dbs", []) if item.get("id") == "flight_kitchen"), None)
    check(catering is not None, "flight_kitchen DB missing from cross index")
    if catering:
        check(catering.get("title") == "ケータリング・機内食業者DB", "cross-index DB title mismatch")
        check(catering.get("record_count") == 247, "cross-index catering count mismatch")
        check(len(catering.get("records", [])) == 247, "cross-index catering records mismatch")
        check({row.get("target") for row in catering.get("records", [])} == db_ids, "cross-index catering ID set mismatch")

jfm_match = re.search(r"window\.MARKET_BASE_JAPAN_FOOD_MACHINERY_SEARCH=(\{.*?\});", cross_index, re.DOTALL)
check(jfm_match is not None, "V333.8 JFM search index missing")
if jfm_match:
    jfm_index = json.loads(jfm_match.group(1))
    check(jfm_index.get("record_count") == 597 and len(jfm_index.get("records", [])) == 597, "V333.8 JFM search index regression")

if errors:
    for error in errors:
        print(f"FAIL: {error}")
    sys.exit(1)

print(json.dumps({
    "status": "ok",
    "companies": db["total_companies"],
    "researched_companies": db["researched_companies"],
    "confirmed_fields": db["confirmed_field_count"],
    "blank_fields_filled": db["blank_fields_filled"],
    "cleared_invalid_values": db["invalid_or_non_fact_values_cleared"],
    "source_links": db["source_link_count"],
}, ensure_ascii=False))
