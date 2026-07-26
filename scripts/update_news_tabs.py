#!/usr/bin/env python3
"""MARKET BASE 日本語ニュース5タブ更新スクリプト。"""
from __future__ import annotations

import argparse
import datetime as dt
import email.utils
import hashlib
import html
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "scripts" / "news_tab_sources.json"
JSON_PATH = ROOT / "data" / "news-tabs-ja.json"
JS_PATH = ROOT / "data" / "news-tabs-ja.js"
USER_AGENT = "MARKET-BASE-News/2.0 (+scheduled RSS reader)"


def now_utc() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def now_iso() -> str:
    return now_utc().replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def canonical_title(title: str, source: str) -> str:
    title = html.unescape(re.sub(r"\s+", " ", title or "")).strip()
    if source and title.endswith(" - " + source):
        title = title[: -(len(source) + 3)].rstrip()
    return title


def is_japanese(text: str) -> bool:
    if re.search(r"[ぁ-んァ-ヶー]", text):
        return True
    return bool(re.search(r"(?:の|に|は|を|が|で|と|へ|から|より)", text))


def parse_date(value: str) -> str:
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    except Exception:
        return ""


def parse_iso(value: str) -> dt.datetime | None:
    if not value:
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc)
    except (ValueError, TypeError):
        return None


def title_fingerprint(title: str) -> str:
    return re.sub(r"[^0-9A-Za-zぁ-んァ-ヶ一-龠]", "", title).lower()


def url_fingerprint(url: str) -> str:
    try:
        return urllib.parse.urlsplit(url)._replace(query="", fragment="").geturl()
    except Exception:
        return url


def article_id(title: str, url: str) -> str:
    raw = title_fingerprint(title) + "|" + url_fingerprint(url)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def rss_url(query: str) -> str:
    params = {"q": query, "hl": "ja", "gl": "JP", "ceid": "JP:ja"}
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode(params)


def fetch_xml(url: str, timeout: int) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.5",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def contains_any(text: str, terms: list[str]) -> bool:
    return not terms or any(term.lower() in text.lower() for term in terms)


def contains_excluded(text: str, terms: list[str]) -> bool:
    return any(term.lower() in text.lower() for term in terms)


def preferred_source(source: str, preferred: list[str]) -> bool:
    normalized = source.lower()
    return any(item.lower() in normalized for item in preferred)


def recent_enough(published_at: str, max_age_days: int, reference: dt.datetime) -> bool:
    parsed = parse_iso(published_at)
    if parsed is None:
        return True
    return parsed >= reference - dt.timedelta(days=max_age_days)


def parse_feed(
    payload: bytes,
    category: dict[str, Any],
    scan_limit: int,
    preferred_sources: list[str],
    used_urls: set[str] | None = None,
    used_titles: set[str] | None = None,
    reference: dt.datetime | None = None,
) -> list[dict[str, str]]:
    root = ET.fromstring(payload)
    used_urls = used_urls or set()
    used_titles = used_titles or set()
    reference = reference or now_utc()
    category_id = str(category["id"])
    required = [str(item) for item in category.get("required_terms_any", [])]
    excluded = [str(item) for item in category.get("excluded_terms", [])]
    max_age_days = int(category.get("max_age_days", 90))

    preferred_items: list[dict[str, str]] = []
    other_items: list[dict[str, str]] = []
    local_urls: set[str] = set()
    local_titles: set[str] = set()

    for node in root.findall("./channel/item")[:scan_limit]:
        source_node = node.find("source")
        source = (source_node.text or "").strip() if source_node is not None else ""
        title = canonical_title(node.findtext("title", ""), source)
        url = (node.findtext("link", "") or "").strip()
        published_at = parse_date(node.findtext("pubDate", ""))
        searchable = title + " " + source
        if not title or not url or not is_japanese(title):
            continue
        if required and not contains_any(searchable, required):
            continue
        if contains_excluded(searchable, excluded):
            continue
        if not recent_enough(published_at, max_age_days, reference):
            continue

        url_key = url_fingerprint(url)
        title_key = title_fingerprint(title)
        if not title_key or url_key in used_urls or title_key in used_titles:
            continue
        if url_key in local_urls or title_key in local_titles:
            continue
        local_urls.add(url_key)
        local_titles.add(title_key)

        item = {
            "id": article_id(title, url),
            "title": title,
            "url": url,
            "source": source or "Google ニュース",
            "published_at": published_at,
            "language": "ja",
            "category": category_id,
            "link_provider": "google_news_rss",
        }
        (preferred_items if preferred_source(source, preferred_sources) else other_items).append(item)

    def sort_key(article: dict[str, str]) -> str:
        return article.get("published_at", "")

    preferred_items.sort(key=sort_key, reverse=True)
    other_items.sort(key=sort_key, reverse=True)
    return preferred_items + other_items


def merge_articles(
    fresh: list[dict[str, str]],
    previous: list[dict[str, Any]],
    category: dict[str, Any],
    limit: int,
    used_urls: set[str],
    used_titles: set[str],
    reference: dt.datetime,
) -> list[dict[str, str]]:
    """新着を優先し、不足分だけ期限内の前回記事で補完する。"""
    merged: list[dict[str, str]] = []
    local_urls: set[str] = set()
    local_titles: set[str] = set()
    retention_days = int(category.get("max_age_days", 90)) * 2
    category_id = str(category["id"])

    for article in [*fresh, *previous]:
        if not isinstance(article, dict):
            continue
        title = str(article.get("title", "")).strip()
        url = str(article.get("url", "")).strip()
        if not title or not url or not is_japanese(title):
            continue
        if article in previous and not recent_enough(str(article.get("published_at", "")), retention_days, reference):
            continue
        url_key = url_fingerprint(url)
        title_key = title_fingerprint(title)
        if not title_key or url_key in used_urls or title_key in used_titles:
            continue
        if url_key in local_urls or title_key in local_titles:
            continue
        local_urls.add(url_key)
        local_titles.add(title_key)
        normalized = {str(k): str(v) for k, v in article.items()}
        normalized["id"] = normalized.get("id") or article_id(title, url)
        normalized["language"] = "ja"
        normalized["category"] = category_id
        merged.append(normalized)
        if len(merged) >= limit:
            break
    return merged


def validate_dataset(data: dict[str, Any], expected_ids: list[str]) -> list[str]:
    errors: list[str] = []
    categories = data.get("categories")
    if not isinstance(categories, dict):
        return ["categories is not an object"]
    all_urls: set[str] = set()
    all_titles: set[str] = set()
    for category_id in expected_ids:
        entry = categories.get(category_id)
        if not isinstance(entry, dict):
            errors.append(f"missing category: {category_id}")
            continue
        articles = entry.get("articles")
        if not isinstance(articles, list):
            errors.append(f"articles is not a list: {category_id}")
            continue
        if len(articles) != 3:
            errors.append(f"article count must be 3: {category_id} ({len(articles)})")
        for index, article in enumerate(articles):
            if not isinstance(article, dict):
                errors.append(f"invalid article: {category_id}[{index}]")
                continue
            for field in ("title", "url", "source", "language", "category"):
                if not article.get(field):
                    errors.append(f"missing {field}: {category_id}[{index}]")
            title = str(article.get("title", ""))
            url = str(article.get("url", ""))
            if article.get("language") != "ja" or not is_japanese(title):
                errors.append(f"not Japanese: {category_id}[{index}]")
            if article.get("category") != category_id:
                errors.append(f"category mismatch: {category_id}[{index}]")
            if not url.startswith(("http://", "https://")):
                errors.append(f"invalid url: {category_id}[{index}]")
            url_key = url_fingerprint(url)
            title_key = title_fingerprint(title)
            if url_key in all_urls or title_key in all_titles:
                errors.append(f"cross-category duplicate: {category_id}[{index}]")
            all_urls.add(url_key)
            all_titles.add(title_key)
    return errors



def detailed_dataset(data: dict[str, Any]) -> dict[str, Any]:
    """Create the detailed news page data from the same five-tab source."""
    status = str(data.get("status") or "sample")
    generated_at = str(data.get("generated_at") or now_iso())
    labels = {
        category_id: str(entry.get("label") or category_id)
        for category_id, entry in (data.get("categories") or {}).items()
        if isinstance(entry, dict)
    }
    notices = {
        "live": "5カテゴリーの日本語ニュースを自動取得しています。記事は外部サイトで更新・削除される場合があります。",
        "partial": "一部カテゴリーは前回取得データを保持しています。最終更新状態と情報源を確認してください。",
        "sample": "表示確認用のサンプルデータです。自動取得の本番成功前であり、最新ニュースとしては扱わないでください。",
        "error": "自動取得に失敗したため、保存済みデータを表示しています。最新性を確認してください。",
        "stale": "全ニュース取得に失敗しました。前回成功時の記事を保持しています。最終成功日時を確認してください。",
    }
    articles: list[dict[str, Any]] = []
    for category_id, entry in (data.get("categories") or {}).items():
        if not isinstance(entry, dict):
            continue
        for rank, article in enumerate(entry.get("articles") or []):
            if not isinstance(article, dict):
                continue
            published = str(article.get("published_at") or generated_at)
            estimated = not bool(article.get("published_at"))
            articles.append({
                "id": str(article.get("id") or article_id(str(article.get("title", "")), str(article.get("url", "")))),
                "title_ja": str(article.get("title") or ""),
                "summary_ja": "",
                "country_codes": [],
                "region_code": "global",
                "category": str(category_id),
                "published_at": published,
                "source_name": str(article.get("source") or "情報源確認中"),
                "source_url": str(article.get("url") or ""),
                "source_language": "ja",
                "scope": "global",
                "importance": max(1, 5-rank),
                "classification_confidence": 1.0,
                "source_id": str(article.get("source") or ""),
                "retrieved_via": str(article.get("link_provider") or "direct"),
                "auto_generated": status in {"live", "partial"},
                "is_test_data": status in {"sample", "error"},
                "published_at_estimated": estimated,
            })
    phase_labels = {"live": "自動更新", "partial": "一部前回データ", "sample": "表示確認用", "error": "更新失敗・保存データ"}
    return {
        "schema_version": "2.0",
        "dataset_status": status,
        "generated_at": generated_at,
        "phase": 1,
        "phase_label": phase_labels.get(status, status),
        "auto_update_status": status,
        "notice_ja": notices.get(status, notices["sample"]),
        "categories": labels,
        "regions": {
            "east_asia": "東アジア", "southeast_asia": "東南アジア", "south_asia": "南アジア",
            "europe": "ヨーロッパ", "north_america": "北米", "latin_america": "中南米",
            "middle_east": "中東", "africa": "アフリカ", "oceania": "オセアニア", "global": "世界"
        },
        "pilot_countries": {},
        "live_country_codes": [],
        "successful_categories": list(data.get("successful_categories") or []),
        "retained_categories": list(data.get("retained_categories") or []),
        "failed_categories": dict(data.get("failed_categories") or {}),
        "articles": articles,
    }

def write_outputs(data: dict[str, Any]) -> None:
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    JSON_PATH.write_text(text, encoding="utf-8")
    JS_PATH.write_text(
        "window.MARKET_BASE_JA_NEWS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    detailed = detailed_dataset(data)
    detail_json = JSON_PATH.with_name("news.json")
    detail_js = JSON_PATH.with_name("news.js")
    detail_json.write_text(json.dumps(detailed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    detail_js.write_text(
        "window.MARKET_BASE_NEWS_DATA = " + json.dumps(detailed, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )


def self_test() -> None:
    sample = '''<?xml version="1.0"?><rss><channel><item><title>食品工場の自動化を発表 - 例新聞</title><link>https://example.com/a</link><pubDate>Fri, 24 Jul 2026 01:00:00 GMT</pubDate><source url="https://example.com">例新聞</source></item></channel></rss>'''.encode("utf-8")
    category = {
        "id": "food_factory",
        "required_terms_any": ["食品工場"],
        "excluded_terms": [],
        "max_age_days": 90,
    }
    parsed = parse_feed(sample, category, 20, [], reference=dt.datetime(2026, 7, 24, tzinfo=dt.timezone.utc))
    assert len(parsed) == 1, parsed
    assert parsed[0]["title"] == "食品工場の自動化を発表"
    assert parsed[0]["language"] == "ja"
    print("SELF TEST: PASS")


def update(dry_run: bool = False) -> dict[str, Any]:
    config = load_json(CONFIG_PATH, {})
    categories_config = config.get("categories", [])
    limit = int(config.get("limit_per_category", 3))
    scan_limit = int(config.get("feed_scan_limit", 50))
    timeout = int(config.get("timeout_seconds", 20))
    preferred_sources = [str(item) for item in config.get("preferred_sources", [])]
    old = load_json(JSON_PATH, {"categories": {}})
    reference = now_utc()

    output_categories: dict[str, Any] = {}
    successes: list[str] = []
    retained_categories: list[str] = []
    failures: dict[str, str] = {}
    used_urls: set[str] = set()
    used_titles: set[str] = set()

    processing_order = sorted(categories_config, key=lambda item: int(item.get("priority", 100)))
    for category in processing_order:
        category_id = str(category["id"])
        label = str(category["label"])
        try:
            payload = fetch_xml(rss_url(str(category["query"])), timeout)
            candidates = parse_feed(
                payload,
                category,
                scan_limit,
                preferred_sources,
                used_urls,
                used_titles,
                reference,
            )
            fresh_articles = candidates[:limit]
            if not fresh_articles:
                raise RuntimeError("条件に合う日本語記事を取得できませんでした")
            previous_entry = (old.get("categories") or {}).get(category_id)
            previous_articles = previous_entry.get("articles", []) if isinstance(previous_entry, dict) else []
            articles = merge_articles(
                fresh_articles,
                previous_articles,
                category,
                limit,
                used_urls,
                used_titles,
                reference,
            )
            if len(articles) < limit:
                raise RuntimeError(f"重複を除いて表示に必要な{limit}件を確保できませんでした")
            if len(fresh_articles) < limit:
                retained_categories.append(category_id)
            output_categories[category_id] = {"label": label, "articles": articles}
            successes.append(category_id)
            for article in articles:
                used_urls.add(url_fingerprint(article["url"]))
                used_titles.add(title_fingerprint(article["title"]))
        except Exception as exc:
            failures[category_id] = f"{type(exc).__name__}: {exc}"
            previous = (old.get("categories") or {}).get(category_id)
            if isinstance(previous, dict):
                output_categories[category_id] = previous
                for article in previous.get("articles", []):
                    if isinstance(article, dict):
                        used_urls.add(url_fingerprint(str(article.get("url", ""))))
                        used_titles.add(title_fingerprint(str(article.get("title", ""))))
            else:
                output_categories[category_id] = {"label": label, "articles": []}

    # JSON上のカテゴリー順は画面のタブ順へ戻す。
    ordered_categories = {
        str(item["id"]): output_categories.get(str(item["id"]), {"label": str(item["label"]), "articles": []})
        for item in categories_config
    }
    status = "live" if len(successes) == len(categories_config) and not retained_categories else ("partial" if successes else "error")
    data = {
        "schema_version": 2,
        "status": status,
        "language": "ja",
        "generated_at": now_iso(),
        "successful_categories": successes,
        "retained_categories": retained_categories,
        "failed_categories": failures,
        "categories": ordered_categories,
    }
    expected = [str(item["id"]) for item in categories_config]
    errors = validate_dataset(data, expected)
    if errors:
        raise SystemExit("VALIDATION FAILED:\n- " + "\n- ".join(errors))

    if not dry_run:
        old_has_articles = any(
            ((value or {}).get("articles") or [])
            for value in (old.get("categories") or {}).values()
            if isinstance(value, dict)
        )
        if status == "error" and old_has_articles:
            prior_failures = int(old.get("consecutive_failure_count") or 0)
            data["status"] = "stale"
            data["last_attempt_at"] = data["generated_at"]
            data["last_success_at"] = str(old.get("last_success_at") or old.get("generated_at") or "")
            data["consecutive_failure_count"] = prior_failures + 1
            data["categories"] = old.get("categories", data["categories"])
            print("All sources failed; previous articles retained with stale status.")
        else:
            data["last_attempt_at"] = data["generated_at"]
            data["last_success_at"] = data["generated_at"]
            data["consecutive_failure_count"] = 0
        write_outputs(data)
    return data


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    config = load_json(CONFIG_PATH, {})
    ids = [str(item["id"]) for item in config.get("categories", [])]
    if args.self_test:
        self_test()
        return 0
    if args.check:
        data = load_json(JSON_PATH, {})
        errors = validate_dataset(data, ids)
        detail_path = JSON_PATH.with_name("news.json")
        detail_js_path = JSON_PATH.with_name("news.js")
        expected_detail = detailed_dataset(data)
        actual_detail = load_json(detail_path, {})
        if actual_detail != expected_detail:
            errors.append("news.json is not synchronized with news-tabs-ja.json")
        try:
            js_text = detail_js_path.read_text(encoding="utf-8")
            expected_js = "window.MARKET_BASE_NEWS_DATA = " + json.dumps(expected_detail, ensure_ascii=False, separators=(",", ":")) + ";\n"
            if js_text != expected_js:
                errors.append("news.js is not synchronized with news.json")
        except OSError:
            errors.append("news.js is missing")
        if errors:
            print("CHECK: FAIL")
            print("\n".join("- " + item for item in errors))
            return 1
        print("CHECK: PASS")
        return 0
    data = update(dry_run=args.dry_run)
    print(
        json.dumps(
            {
                "status": data.get("status"),
                "successful_categories": data.get("successful_categories", []),
                "retained_categories": data.get("retained_categories", []),
                "failed_categories": data.get("failed_categories", {}),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
