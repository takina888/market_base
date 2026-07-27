#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import importlib.util
import json
import tempfile
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("news_updater", HERE / "update_news_tabs.py")
assert SPEC and SPEC.loader
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)

REFERENCE = dt.datetime(2026, 7, 24, 4, 30, tzinfo=dt.timezone.utc)
LIMIT = 7
CATEGORY_META = {
    "overseas": ("海外ニュース", "海外経済と貿易の日本語ニュース"),
    "food_machinery": ("食品機械", "食品機械の新型選別機ニュース"),
    "food_factory": ("食品工場", "食品工場の新工場と設備投資ニュース"),
    "retail": ("小売店", "食品スーパーの新店舗ニュース"),
    "regulations": ("規制関連", "食品表示基準の改正ニュース"),
}


def rss(items: list[dict[str, str]]) -> bytes:
    body = []
    for item in items:
        body.append(
            "<item>"
            f"<title>{item['title']} - {item['source']}</title>"
            f"<link>{item['url']}</link>"
            f"<pubDate>{item['date']}</pubDate>"
            f"<source url=\"https://example.com\">{item['source']}</source>"
            "</item>"
        )
    return ("<?xml version=\"1.0\"?><rss><channel>" + "".join(body) + "</channel></rss>").encode("utf-8")


def category_from_url(url: str) -> str:
    query = urllib.parse.parse_qs(urllib.parse.urlsplit(url).query).get("q", [""])[0]
    if "食品表示" in query or "規制" in query:
        return "regulations"
    if "食品機械" in query or "FOOMA" in query:
        return "food_machinery"
    if "食品工場" in query or "新工場" in query:
        return "food_factory"
    if "食品スーパー" in query or "コンビニ" in query:
        return "retail"
    return "overseas"


def feed_for(category_id: str, count: int, *, shared: bool = False) -> bytes:
    _, phrase = CATEGORY_META[category_id]
    items: list[dict[str, str]] = []
    if shared:
        items.append(
            {
                "title": "食品工場と食品機械の共通ニュース",
                "url": "https://example.com/shared",
                "date": "Fri, 24 Jul 2026 03:50:00 GMT",
                "source": "例新聞",
            }
        )
    for index in range(count):
        items.append(
            {
                "title": f"{phrase}{index + 1}",
                "url": f"https://example.com/{category_id}/fresh-{index + 1}",
                "date": f"Fri, 24 Jul 2026 0{index}:00:00 GMT",
                "source": "ジェトロ" if index == count - 1 else "例新聞",
            }
        )
    return rss(items)


def synthetic_seed(config: dict) -> dict:
    categories = {}
    for category in config["categories"]:
        category_id = category["id"]
        label, phrase = CATEGORY_META[category_id]
        categories[category_id] = {
            "label": label,
            "articles": [
                {
                    "id": f"old-{category_id}-{index}",
                    "title": f"{phrase}の前回記事{index}",
                    "url": f"https://old.example.com/{category_id}/{index}",
                    "source": "前回媒体",
                    "published_at": "2026-07-20T00:00:00Z",
                    "language": "ja",
                    "category": category_id,
                    "link_provider": "direct",
                }
                for index in range(1, LIMIT + 1)
            ],
        }
    return {
        "schema_version": 2,
        "status": "sample",
        "language": "ja",
        "generated_at": "2026-07-20T00:00:00Z",
        "successful_categories": [],
        "retained_categories": [],
        "failed_categories": {},
        "categories": categories,
    }


def run() -> None:
    source_config = json.loads((HERE / "news_tab_sources.json").read_text(encoding="utf-8"))
    seed = synthetic_seed(source_config)
    original_now_utc = mod.now_utc
    mod.now_utc = lambda: REFERENCE

    try:
        # 単体フィルター：古い記事・求人を除外し、優先媒体を先にする。
        category = next(item for item in source_config["categories"] if item["id"] == "food_machinery")
        filter_payload = rss(
            [
                {
                    "title": "食品機械の求人情報",
                    "url": "https://example.com/job",
                    "date": "Fri, 24 Jul 2026 03:00:00 GMT",
                    "source": "例新聞",
                },
                {
                    "title": "食品機械の旧型装置ニュース",
                    "url": "https://example.com/old",
                    "date": "Mon, 01 Jan 2024 03:00:00 GMT",
                    "source": "例新聞",
                },
                {
                    "title": "食品機械の新型装置ニュース",
                    "url": "https://example.com/new",
                    "date": "Fri, 24 Jul 2026 01:00:00 GMT",
                    "source": "例新聞",
                },
                {
                    "title": "食品機械の公式発表ニュース",
                    "url": "https://example.com/preferred",
                    "date": "Thu, 23 Jul 2026 01:00:00 GMT",
                    "source": "日本食品機械工業会",
                },
            ]
        )
        parsed = mod.parse_feed(filter_payload, category, 50, source_config["preferred_sources"], reference=REFERENCE)
        assert [item["url"] for item in parsed] == ["https://example.com/preferred", "https://example.com/new"]

        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "scripts").mkdir()
            (root / "data").mkdir()
            config_path = root / "scripts" / "news_tab_sources.json"
            json_path = root / "data" / "news-tabs-ja.json"
            js_path = root / "data" / "news-tabs-ja.js"
            config_path.write_text(json.dumps(source_config, ensure_ascii=False), encoding="utf-8")
            json_path.write_text(json.dumps(seed, ensure_ascii=False), encoding="utf-8")
            mod.CONFIG_PATH, mod.JSON_PATH, mod.JS_PATH = config_path, json_path, js_path

            def all_success(url: str, timeout: int) -> bytes:
                return feed_for(category_from_url(url), LIMIT)

            mod.fetch_xml = all_success
            live = mod.update(dry_run=True)
            assert live["status"] == "live"
            assert not live["failed_categories"]
            assert all(len(value["articles"]) == LIMIT for value in live["categories"].values())

            def sparse(url: str, timeout: int) -> bytes:
                return feed_for(category_from_url(url), 1)

            mod.fetch_xml = sparse
            partial = mod.update(dry_run=True)
            assert partial["status"] == "partial"
            assert set(partial["retained_categories"]) == set(CATEGORY_META)
            assert all(len(value["articles"]) == LIMIT for value in partial["categories"].values())

            # 複数カテゴリーに同じ記事が来ても、全体で重複させない。
            def with_shared(url: str, timeout: int) -> bytes:
                category_id = category_from_url(url)
                return feed_for(category_id, LIMIT, shared=category_id in {"food_machinery", "food_factory"})

            mod.fetch_xml = with_shared
            deduped = mod.update(dry_run=True)
            errors = mod.validate_dataset(deduped, list(CATEGORY_META), LIMIT)
            assert not errors, errors
            urls = [article["url"] for value in deduped["categories"].values() for article in value["articles"]]
            assert urls.count("https://example.com/shared") <= 1

            # 全取得失敗では記事を保持し、状態をstaleへ更新する。
            original_json = json.loads(json_path.read_text(encoding="utf-8"))
            original_categories = original_json["categories"]

            def all_fail(url: str, timeout: int) -> bytes:
                raise OSError("offline")

            mod.fetch_xml = all_fail
            preserved = mod.update(dry_run=False)
            assert preserved["status"] == "stale"
            assert preserved["categories"] == original_categories
            assert preserved["failed_categories"]
            assert preserved["consecutive_failure_count"] >= 1
            stored = json.loads(json_path.read_text(encoding="utf-8"))
            assert stored["status"] == "stale"
            assert stored["categories"] == original_categories
    finally:
        mod.now_utc = original_now_utc

    print("NEWS TAB TESTS: PASS")


if __name__ == "__main__":
    run()
