#!/usr/bin/env python3
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "japan_food_machinery_db_v075.json"
DATA_JS_PATH = ROOT / "data" / "japan_food_machinery_db_v075.js"
RESEARCH_PATH = ROOT / "data" / "japan_food_machinery_export_research_v076.json"
PAGE_PATH = ROOT / "japan-food-machinery-v273-r58.html"
CROSS_INDEX_PATH = ROOT / "embedded-cross-db-search-index-v273-db-title-r27.js"

VALID_STATUSES = {
    "export_confirmed",
    "overseas_network_confirmed",
    "overseas_support_only",
    "no_export",
    "not_publicly_confirmed",
}
OVERSEAS_STATUSES = {
    "export_confirmed",
    "overseas_network_confirmed",
    "overseas_support_only",
}
REQUIRED_FIELDS = {
    "輸出・海外展開区分",
    "輸出先国・地域",
    "国・地域の扱い",
    "輸出実績の確認範囲",
    "海外拠点・代理店",
    "輸出情報要約",
    "輸出情報出典URL",
    "輸出情報源種別",
    "輸出情報確認日",
    "輸出情報調査注記",
    "export_status",
    "export_country_regions",
    "export_source_urls",
    "export_source_types",
    "has_export_evidence",
    "external_source_enriched",
}


def compact_hash(value):
    payload = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()
    return hashlib.sha256(payload).hexdigest()


def unknown_count(manufacturers, field):
    pattern = re.compile(r"^(確認できず|確認できません|公開情報では確認できません|未確認|非公開|不明)(?:$|[（(])")
    return sum(bool(pattern.search(str(row.get(field, "")).strip())) for row in manufacturers)


def main():
    db = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    research = json.loads(RESEARCH_PATH.read_text(encoding="utf-8"))
    assert db["version"].startswith("v076-r59"), db["version"]
    assert db["updated"] == "2026-08-03"
    assert len(db["manufacturers"]) == 112
    assert len(db["machines"]) == 485
    assert db["counts"]["manufacturers"] == 112
    assert db["counts"]["machines"] == 485
    assert compact_hash(db["machines"]) == "a0235387fb4f78afad92b499a3195b9e86745e2a54dfddc20b34e26012e58d75"

    names = [row["メーカー"] for row in db["manufacturers"]]
    machine_ids = [row["id"] for row in db["machines"]]
    assert len(names) == len(set(names))
    assert len(machine_ids) == len(set(machine_ids))

    status_counts = {status: 0 for status in VALID_STATUSES}
    for row in db["manufacturers"]:
        missing = REQUIRED_FIELDS - set(row)
        assert not missing, (row["メーカー"], sorted(missing))
        assert row["export_status"] in VALID_STATUSES, (row["メーカー"], row["export_status"])
        assert isinstance(row["export_country_regions"], list)
        assert isinstance(row["export_source_urls"], list)
        assert isinstance(row["export_source_types"], list)
        assert row["has_export_evidence"] == (row["export_status"] == "export_confirmed")
        assert row["has_overseas"] == (row["export_status"] in OVERSEAS_STATUSES)
        for url in row["export_source_urls"]:
            assert re.match(r"^https?://", url), (row["メーカー"], url)
            assert not re.search(r"[\s　]", url), (row["メーカー"], url)
        status_counts[row["export_status"]] += 1

    assert sum(status_counts.values()) == 112
    assert db["counts"]["manufacturers_with_export_evidence"] == status_counts["export_confirmed"]
    assert db["counts"]["manufacturers_with_overseas_network"] == status_counts["overseas_network_confirmed"]
    assert db["counts"]["manufacturers_with_overseas_support_only"] == status_counts["overseas_support_only"]
    assert db["counts"]["manufacturers_no_export_or_domestic_spec"] == status_counts["no_export"]
    assert db["counts"]["manufacturers_export_unconfirmed"] == status_counts["not_publicly_confirmed"]

    assert unknown_count(db["manufacturers"], "売上高") == 41
    assert unknown_count(db["manufacturers"], "社員数") == 6
    assert unknown_count(db["manufacturers"], "設立・創業") == 0

    assert research["version"] == "v076"
    assert research["target_count"] == 74, research["target_count"]
    assert len(research["records"]) == 74, len(research["records"])
    research_names = [row["メーカー"] for row in research["records"]]
    assert len(research_names) == len(set(research_names))
    assert set(research_names).issubset(set(names))

    data_js = DATA_JS_PATH.read_text(encoding="utf-8").strip()
    prefix = "window.MARKET_BASE_JAPAN_FOOD_MACHINERY_DATA = "
    assert data_js.startswith(prefix) and data_js.endswith(";")
    mirror = json.loads(data_js[len(prefix):-1])
    assert mirror == db

    cross_text = CROSS_INDEX_PATH.read_text(encoding="utf-8")
    marker = "window.MARKET_BASE_JAPAN_FOOD_MACHINERY_SEARCH="
    assert marker in cross_text
    specific = json.loads(cross_text.split(marker, 1)[1].strip()[:-1])
    assert specific["record_count"] == 597
    assert len(specific["records"]) == 597
    assert sum(record["target"].startswith("jfm-maker-") for record in specific["records"]) == 112
    assert any("輸出実績確認" in record["search"] for record in specific["records"])

    page = PAGE_PATH.read_text(encoding="utf-8")
    for token in (
        "輸出・海外情報あり",
        "輸出・海外展開区分",
        "海外関連国・地域",
        "輸出実績の確認範囲",
        "輸出情報の出典",
        "20260803-v333-8-jfm-export-db",
    ):
        assert token in page, token

    print(json.dumps({
        "manufacturers": 112,
        "machines": 485,
        "research_records": len(research["records"]),
        "status_counts": status_counts,
        "unknown_sales": unknown_count(db["manufacturers"], "売上高"),
        "unknown_employees": unknown_count(db["manufacturers"], "社員数"),
        "unknown_founded": unknown_count(db["manufacturers"], "設立・創業"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
