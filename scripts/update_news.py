#!/usr/bin/env python3
"""Update MARKET BASE country news from official RSS/Atom/HTML sources.

Design goals:
- standard library only (GitHub-hosted Python is sufficient)
- one shared data/news.json, never one file per country
- official-source allow-list, URL/date/text validation, bounded downloads
- per-source failure isolation; failed or empty fetches preserve previous data
- atomic writes and no commit churn when article content is unchanged
- built-in offline self-test for RSS, Atom, HTML, sanitisation and deduplication
"""

from __future__ import annotations

import argparse
import copy
import email.utils
import hashlib
import html
import json
import re
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

CATEGORIES = {
    "food",
    "food_machinery",
    "trade_logistics",
    "regulation_food_safety",
}
TRACKING_KEYS = {
    "fbclid",
    "gclid",
    "dclid",
    "msclkid",
    "yclid",
    "mc_cid",
    "mc_eid",
    "ref",
    "ref_src",
}
MAX_ARTICLES_HARD = 1000
DEFAULT_MAX_RESPONSE_BYTES = 5 * 1024 * 1024
DEFAULT_TIMEOUT = 25
DEFAULT_RETENTION_DAYS = 180
USER_AGENT = "MARKET-BASE-News-Updater/1.0 (+GitHub Actions; official-source aggregator)"

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "regulation_food_safety": [
        "regulation", "regulatory", "law", "rules", "standard", "compliance",
        "food safety", "recall", "withdrawal", "inspection", "label", "labelling",
        "labeling", "haccp", "allergen", "additive", "contaminant", "sanitary",
        "hygiene", "quarantine", "border inspection", "notification", "consultation",
        "規制", "法令", "省令", "告示", "基準", "食品安全", "回収", "検査", "表示",
        "衛生", "添加物", "アレルゲン", "検疫", "食中毒", "リコール",
        "法規", "食安", "標示", "稽查", "回收", "邊境", "農藥", "衛生",
        "法规", "食品安全", "标示", "召回", "检查", "卫生", "添加剂",
        "식품안전", "회수", "표시", "위생", "검사", "규정", "법령", "기준",
        "เรียกคืน", "ความปลอดภัยอาหาร", "มาตรฐาน", "กฎหมาย",
    ],
    "food_machinery": [
        "food machinery", "food equipment", "processing machine", "packaging machine",
        "automation", "robot", "robotics", "production line", "filling machine",
        "freezer", "refrigeration equipment", "cooking equipment", "rice cooker",
        "食品機械", "加工機械", "包装機械", "製造装置", "自動化", "ロボット",
        "生産ライン", "充填機", "冷凍機", "炊飯機", "設備投資",
        "食品機械", "加工設備", "包裝機械", "自動化", "機器人", "生產線",
        "食品机械", "加工设备", "包装机械", "自动化", "机器人", "生产线",
        "식품기계", "가공기계", "포장기계", "자동화", "로봇", "생산설비",
    ],
    "trade_logistics": [
        "import", "export", "trade", "tariff", "customs", "logistics", "port",
        "shipping", "freight", "cargo", "supply chain", "warehouse", "cold chain",
        "market access", "tranship", "transshipment",
        "輸入", "輸出", "貿易", "関税", "税関", "物流", "港湾", "海運",
        "航空貨物", "通関", "サプライチェーン", "倉庫", "コールドチェーン",
        "進口", "出口", "貿易", "關稅", "海關", "物流", "港口", "冷鏈",
        "进口", "出口", "贸易", "关税", "海关", "物流", "港口", "冷链",
        "수입", "수출", "무역", "관세", "통관", "물류", "항만", "콜드체인",
    ],
    "food": [
        "food", "foods", "beverage", "agri-food", "restaurant", "retail", "frozen",
        "rice", "ready meal", "processed food", "ingredient", "nutrition", "catering",
        "食品", "食料", "飲料", "外食", "小売", "冷凍食品", "米", "米飯",
        "惣菜", "加工食品", "原料", "栄養", "給食", "農林水産物",
        "食品", "飲料", "餐飲", "零售", "冷凍", "米飯", "加工食品", "原料",
        "食品", "饮料", "餐饮", "零售", "冷冻", "米饭", "加工食品", "原料",
        "식품", "음료", "외식", "소매", "냉동", "쌀", "가공식품", "급식",
        "อาหาร", "เครื่องดื่ม", "ข้าว", "อาหารแช่แข็ง",
    ],
}

THAI_MONTHS = {
    "ม.ค.": 1,
    "ก.พ.": 2,
    "มี.ค.": 3,
    "เม.ย.": 4,
    "พ.ค.": 5,
    "มิ.ย.": 6,
    "ก.ค.": 7,
    "ส.ค.": 8,
    "ก.ย.": 9,
    "ต.ค.": 10,
    "พ.ย.": 11,
    "ธ.ค.": 12,
}


class UpdateError(RuntimeError):
    pass


@dataclass
class FetchResult:
    source_id: str
    articles: list[dict[str, Any]]
    parsed_count: int
    filtered_count: int


class AnchorCollector(HTMLParser):
    """Collect anchor text and href without executing or interpreting scripts."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._current: dict[str, Any] | None = None
        self._ignored_depth = 0
        self.anchors: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "template", "noscript"}:
            self._ignored_depth += 1
            return
        if self._ignored_depth:
            return
        if tag == "a" and self._current is None:
            attr_map = {str(k).lower(): (v or "") for k, v in attrs}
            self._current = {"href": attr_map.get("href", ""), "text": []}

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "template", "noscript"} and self._ignored_depth:
            self._ignored_depth -= 1
            return
        if self._ignored_depth:
            return
        if tag == "a" and self._current is not None:
            text = clean_text(" ".join(self._current["text"]), 600)
            href = str(self._current["href"])
            if text and href:
                self.anchors.append({"href": href, "text": text})
            self._current = None

    def handle_data(self, data: str) -> None:
        if not self._ignored_depth and self._current is not None:
            self._current["text"].append(data)


def eprint(*args: Any) -> None:
    print(*args, file=sys.stderr)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def clean_text(value: Any, limit: int | None = None) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"(?is)<(script|style|template|noscript)\b[^>]*>.*?</\1>", " ", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = text.replace("\x00", " ")
    text = re.sub(r"\s+", " ", text).strip()
    if limit is not None and len(text) > limit:
        return text[: max(0, limit - 1)].rstrip() + "…"
    return text


def local_name(tag: str) -> str:
    return str(tag).rsplit("}", 1)[-1].split(":")[-1].lower()


def parse_timezone(value: str | None) -> timezone:
    match = re.fullmatch(r"([+-])(\d{2}):(\d{2})", str(value or "+00:00"))
    if not match:
        return timezone.utc
    minutes = int(match.group(2)) * 60 + int(match.group(3))
    if match.group(1) == "-":
        minutes *= -1
    return timezone(timedelta(minutes=minutes))


def _finalise_date(dt: datetime, default_tz: timezone, reference: datetime | None = None) -> datetime | None:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=default_tz)
    dt = dt.astimezone(timezone.utc)
    reference = reference or now_utc()
    if dt.year < 2000 or dt > reference + timedelta(days=1):
        return None
    return dt


def parse_date(value: Any, default_tz: timezone = timezone.utc, reference: datetime | None = None) -> datetime | None:
    raw = clean_text(value, 220)
    if not raw:
        return None

    try:
        dt = email.utils.parsedate_to_datetime(raw)
        if dt:
            return _finalise_date(dt, default_tz, reference)
    except (TypeError, ValueError, OverflowError):
        pass

    iso = raw.replace("Z", "+00:00")
    try:
        return _finalise_date(datetime.fromisoformat(iso), default_tz, reference)
    except ValueError:
        pass

    thai = re.search(
        r"(?P<day>\d{1,2})\s*(?P<month>ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(?P<year>\d{2,4})",
        raw,
    )
    if thai:
        year = int(thai.group("year"))
        if year < 100:
            year += 2500
        if year >= 2400:
            year -= 543
        try:
            return _finalise_date(
                datetime(year, THAI_MONTHS[thai.group("month")], int(thai.group("day")), 12, 0),
                default_tz,
                reference,
            )
        except ValueError:
            return None

    patterns = [
        (r"(?P<y>20\d{2})[年./-](?P<m>\d{1,2})[月./-](?P<d>\d{1,2})日?", "ymd"),
        (r"(?P<d>\d{1,2})[./-](?P<m>\d{1,2})[./-](?P<y>20\d{2})", "dmy"),
    ]
    for pattern, _ in patterns:
        match = re.search(pattern, raw)
        if match:
            try:
                return _finalise_date(
                    datetime(int(match.group("y")), int(match.group("m")), int(match.group("d")), 12, 0),
                    default_tz,
                    reference,
                )
            except ValueError:
                return None

    english_match = re.search(
        r"(?P<d>\d{1,2})\s+(?P<m>January|February|March|April|May|June|July|August|September|October|November|December)\s+(?P<y>20\d{2})",
        raw,
        re.IGNORECASE,
    )
    if english_match:
        try:
            dt = datetime.strptime(
                f"{english_match.group('d')} {english_match.group('m')} {english_match.group('y')}",
                "%d %B %Y",
            ).replace(hour=12)
            return _finalise_date(dt, default_tz, reference)
        except ValueError:
            return None

    compact_match = re.search(r"(?P<y>20\d{2})(?P<m>\d{2})(?P<d>\d{2})", raw)
    if compact_match:
        try:
            return _finalise_date(
                datetime(int(compact_match.group("y")), int(compact_match.group("m")), int(compact_match.group("d")), 12, 0),
                default_tz,
                reference,
            )
        except ValueError:
            return None
    return None


def host_allowed(host: str, allowed_hosts: Iterable[str]) -> bool:
    host = host.lower().rstrip(".")
    for allowed in allowed_hosts:
        allowed = str(allowed).lower().rstrip(".")
        if host == allowed or host.endswith("." + allowed):
            return True
    return False


def safe_http_url(value: Any, base_url: str, allowed_hosts: Iterable[str]) -> str:
    raw = clean_text(value, 2000)
    if not raw:
        return ""
    absolute = urljoin(base_url, raw)
    try:
        parts = urlsplit(absolute)
    except ValueError:
        return ""
    if parts.scheme.lower() not in {"http", "https"} or not parts.hostname or parts.username or parts.password:
        return ""
    if not host_allowed(parts.hostname, allowed_hosts):
        return ""
    query = []
    for key, val in parse_qsl(parts.query, keep_blank_values=True):
        low = key.lower()
        if low.startswith("utm_") or low in TRACKING_KEYS:
            continue
        query.append((key, val))
    path = re.sub(r"/{2,}", "/", parts.path or "/")
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, urlencode(query, doseq=True), ""))


def canonical_url(value: str) -> str:
    try:
        parts = urlsplit(value)
    except ValueError:
        return value
    path = parts.path.rstrip("/") or "/"
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, parts.query, ""))


def text_relevant(text: str, source: dict[str, Any]) -> bool:
    folded = text.casefold()
    include = [str(x).casefold() for x in source.get("include_keywords", []) if str(x).strip()]
    exclude = [str(x).casefold() for x in source.get("exclude_keywords", []) if str(x).strip()]
    if include and not any(word in folded for word in include):
        return False
    if exclude and any(word in folded for word in exclude):
        # A positive food keyword in the same title may override broad medical exclusions.
        if not any(word.casefold() in folded for word in CATEGORY_KEYWORDS["food"]):
            return False
    return True


def classify_category(text: str, source: dict[str, Any]) -> str:
    forced = str(source.get("forced_category", ""))
    if forced in CATEGORIES:
        return forced
    folded = text.casefold()
    custom = source.get("category_keywords", {})
    priority = ["regulation_food_safety", "food_machinery", "trade_logistics", "food"]
    for category in priority:
        terms = list(CATEGORY_KEYWORDS.get(category, [])) + list(custom.get(category, []))
        if any(str(term).casefold() in folded for term in terms if str(term).strip()):
            return category
    default = str(source.get("default_category", "food"))
    return default if default in CATEGORIES else "food"


def first_text(element: ET.Element, names: set[str]) -> str:
    for child in element.iter():
        if child is element:
            continue
        if local_name(child.tag) in names:
            value = "".join(child.itertext()).strip()
            if value:
                return value
    return ""


def feed_link(element: ET.Element) -> str:
    for child in element.iter():
        if child is element or local_name(child.tag) != "link":
            continue
        href = child.attrib.get("href", "")
        rel = child.attrib.get("rel", "alternate")
        if href and rel in {"", "alternate"}:
            return href
        value = "".join(child.itertext()).strip()
        if value:
            return value
    guid = first_text(element, {"guid", "id"})
    return guid if guid.startswith(("http://", "https://")) else ""


def parse_xml_candidates(payload: bytes) -> list[dict[str, str]]:
    upper = payload[:20000].upper()
    if b"<!DOCTYPE" in upper or b"<!ENTITY" in upper:
        raise UpdateError("DTD/ENTITY declarations are not accepted")
    try:
        root = ET.fromstring(payload)
    except ET.ParseError as exc:
        raise UpdateError(f"invalid XML: {exc}") from exc
    nodes = [node for node in root.iter() if local_name(node.tag) in {"item", "entry"}]
    candidates: list[dict[str, str]] = []
    for node in nodes:
        candidates.append(
            {
                "title": first_text(node, {"title"}),
                "url": feed_link(node),
                "published": first_text(node, {"pubdate", "published", "updated", "date", "issued"}),
                "summary": first_text(node, {"description", "summary", "content", "encoded"}),
            }
        )
    return candidates


def parse_html_candidates(payload: bytes, source: dict[str, Any]) -> list[dict[str, str]]:
    encoding = str(source.get("encoding", "utf-8"))
    try:
        text = payload.decode(encoding, errors="replace")
    except LookupError:
        text = payload.decode("utf-8", errors="replace")
    parser = AnchorCollector()
    parser.feed(text)
    link_pattern = re.compile(str(source.get("link_include_regex", ".*")), re.IGNORECASE)
    out: list[dict[str, str]] = []
    for anchor in parser.anchors:
        absolute = urljoin(str(source.get("url", "")), anchor["href"])
        if not link_pattern.search(absolute):
            continue
        raw_text = clean_text(anchor["text"], 600)
        date_text = raw_text
        title = re.sub(r"\s*Publish\s+Date\s+.*$", "", raw_text, flags=re.IGNORECASE).strip()
        title = re.sub(r"^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}\s+", "", title).strip()
        out.append({"title": title, "url": absolute, "published": date_text, "summary": ""})
    return out


def make_article(candidate: dict[str, str], source: dict[str, Any], reference: datetime) -> dict[str, Any] | None:
    title = clean_text(candidate.get("title", ""), 240)
    summary_original = clean_text(candidate.get("summary", ""), 400)
    if not title:
        return None
    allowed_hosts = source.get("allowed_hosts", [])
    url = safe_http_url(candidate.get("url", ""), str(source.get("url", "")), allowed_hosts)
    if not url:
        return None
    tz = parse_timezone(str(source.get("timezone", "+00:00")))
    published = parse_date(candidate.get("published", ""), tz, reference)
    if not published:
        return None
    retention = int(source.get("retention_days", DEFAULT_RETENTION_DAYS))
    if published < reference - timedelta(days=max(1, retention)):
        return None
    combined = f"{title} {summary_original}"
    if not text_relevant(combined, source):
        return None
    category = classify_category(combined, source)
    source_language = clean_text(source.get("source_language", ""), 30)
    source_name = clean_text(source.get("source_name", ""), 160)
    if not source_name:
        return None
    if source_language.lower().startswith("ja") and summary_original:
        summary_ja = clean_text(summary_original, 260)
    else:
        summary_ja = f"{source_name}が公開した公式情報です。見出しは原文です。詳細は元記事で確認してください。"
    source_id = clean_text(source.get("id", ""), 100)
    digest = hashlib.sha256(f"{source_id}|{canonical_url(url)}".encode("utf-8")).hexdigest()[:22]
    return {
        "id": f"news_auto_{digest}",
        "title_ja": title,
        "summary_ja": summary_ja,
        "country_codes": [clean_text(code, 12).upper() for code in source.get("country_codes", []) if clean_text(code, 12)],
        "region_code": clean_text(source.get("region_code", ""), 60),
        "category": category,
        "published_at": published.isoformat(),
        "source_name": source_name,
        "source_url": url,
        "source_language": source_language,
        "scope": "country",
        "importance": int(source.get("importance", 80)),
        "classification_confidence": int(source.get("classification_confidence", 90)),
        "source_id": source_id,
        "retrieved_via": clean_text(source.get("type", "rss"), 20),
        "auto_generated": True,
        "is_test_data": False,
        "published_at_estimated": False,
    }


def fetch_bytes(source: dict[str, Any], max_bytes: int, timeout: int) -> bytes:
    url = str(source.get("url", ""))
    allowed_hosts = source.get("allowed_hosts", [])
    if not safe_http_url(url, url, allowed_hosts):
        raise UpdateError("source URL is not an allowed HTTP(S) URL")
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.2",
                    "Accept-Language": "ja,en;q=0.8,zh;q=0.6,ko;q=0.5,th;q=0.4",
                },
            )
            with urlopen(request, timeout=timeout) as response:  # noqa: S310 - strict allow-list above
                final_url = response.geturl()
                if not safe_http_url(final_url, url, allowed_hosts):
                    raise UpdateError("redirected outside the source host allow-list")
                declared = response.headers.get("Content-Length")
                if declared and int(declared) > max_bytes:
                    raise UpdateError("response exceeds the configured size limit")
                payload = response.read(max_bytes + 1)
                if len(payload) > max_bytes:
                    raise UpdateError("response exceeds the configured size limit")
                return payload
        except (HTTPError, URLError, TimeoutError, OSError, ValueError, UpdateError) as exc:
            last_error = exc
            if attempt == 0:
                time.sleep(1.0)
    raise UpdateError(str(last_error or "fetch failed"))


def process_source(source: dict[str, Any], policy: dict[str, Any], reference: datetime) -> FetchResult:
    source_id = str(source.get("id", ""))
    max_bytes = int(policy.get("max_response_bytes", DEFAULT_MAX_RESPONSE_BYTES))
    timeout = int(policy.get("per_source_timeout_seconds", DEFAULT_TIMEOUT))
    payload = fetch_bytes(source, max_bytes, timeout)
    source_type = str(source.get("type", "rss"))
    if source_type in {"rss", "atom", "xml"}:
        candidates = parse_xml_candidates(payload)
    elif source_type == "html":
        candidates = parse_html_candidates(payload, source)
    else:
        raise UpdateError(f"unsupported source type: {source_type}")
    articles: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for candidate in candidates:
        article = make_article(candidate, source, reference)
        if not article:
            continue
        key = canonical_url(article["source_url"])
        if key in seen_urls:
            continue
        seen_urls.add(key)
        articles.append(article)
    articles.sort(key=lambda a: (-int(a["importance"]), a["published_at"], a["id"]), reverse=False)
    articles.sort(key=lambda a: a["published_at"], reverse=True)
    max_items = max(1, min(100, int(source.get("max_items", 15))))
    return FetchResult(source_id, articles[:max_items], len(candidates), len(articles))


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise UpdateError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise UpdateError(f"{path} must contain a JSON object")
    return value


def article_sort_key(article: dict[str, Any]) -> tuple[float, float, str]:
    try:
        stamp = datetime.fromisoformat(str(article.get("published_at", "")).replace("Z", "+00:00")).timestamp()
    except ValueError:
        stamp = 0.0
    return (float(article.get("importance", 0)), stamp, str(article.get("id", "")))


def merge_articles(
    existing: list[dict[str, Any]],
    fetched_by_source: dict[str, list[dict[str, Any]]],
    max_total: int,
) -> list[dict[str, Any]]:
    replacing_sources = {source_id for source_id, items in fetched_by_source.items() if items}
    live_country_codes = {
        code
        for items in fetched_by_source.values()
        for article in items
        for code in article.get("country_codes", [])
    }
    merged: list[dict[str, Any]] = []
    for article in existing:
        if not isinstance(article, dict):
            continue
        if article.get("auto_generated") and article.get("source_id") in replacing_sources:
            continue
        if article.get("is_test_data") and set(article.get("country_codes", [])) & live_country_codes:
            continue
        merged.append(copy.deepcopy(article))
    for items in fetched_by_source.values():
        merged.extend(copy.deepcopy(items))

    # Prefer live official records over test records, then the newest/highest-importance item.
    merged.sort(key=lambda a: (bool(a.get("is_test_data")), -article_sort_key(a)[0], -article_sort_key(a)[1]))
    by_url: dict[str, dict[str, Any]] = {}
    by_id: set[str] = set()
    result: list[dict[str, Any]] = []
    for article in merged:
        article_id = clean_text(article.get("id", ""), 180)
        url = canonical_url(str(article.get("source_url", "")))
        is_test = article.get("is_test_data") is True
        if not article_id or not url or article_id in by_id or (not is_test and url in by_url):
            continue
        by_id.add(article_id)
        if not is_test:
            by_url[url] = article
        result.append(article)
    result.sort(key=article_sort_key, reverse=True)
    return result[:max(1, min(MAX_ARTICLES_HARD, max_total))]


def stable_article_view(articles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return a deterministic article-only view for no-change detection."""
    return [copy.deepcopy(item) for item in sorted(articles, key=lambda a: str(a.get("id", "")))]


def validate_source_registry(registry: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    sources = registry.get("sources")
    if not isinstance(sources, list) or not sources:
        return ["news_sources.json: sources must be a non-empty array"]
    ids: set[str] = set()
    for index, source in enumerate(sources):
        prefix = f"sources[{index}]"
        if not isinstance(source, dict):
            errors.append(f"{prefix}: must be an object")
            continue
        source_id = clean_text(source.get("id", ""), 100)
        if not source_id:
            errors.append(f"{prefix}: id is required")
        elif source_id in ids:
            errors.append(f"{prefix}: duplicate id {source_id}")
        ids.add(source_id)
        if source.get("enabled") is True:
            if source.get("type") not in {"rss", "atom", "xml", "html"}:
                errors.append(f"{prefix}: unsupported type")
            if not clean_text(source.get("source_name", ""), 160):
                errors.append(f"{prefix}: source_name is required")
            allowed = source.get("allowed_hosts", [])
            if not isinstance(allowed, list) or not allowed:
                errors.append(f"{prefix}: allowed_hosts is required")
            elif not safe_http_url(source.get("url", ""), source.get("url", ""), allowed):
                errors.append(f"{prefix}: source url is not in allowed_hosts")
            codes = source.get("country_codes", [])
            if not isinstance(codes, list) or not codes:
                errors.append(f"{prefix}: country_codes is required")
    return errors


def validate_dataset(dataset: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    articles = dataset.get("articles")
    if not isinstance(articles, list):
        return ["news.json: articles must be an array"]
    if len(articles) > MAX_ARTICLES_HARD:
        errors.append(f"news.json: article count exceeds {MAX_ARTICLES_HARD}")
    ids: set[str] = set()
    urls: set[str] = set()
    reference = now_utc()
    for index, article in enumerate(articles):
        prefix = f"articles[{index}]"
        if not isinstance(article, dict):
            errors.append(f"{prefix}: must be an object")
            continue
        article_id = clean_text(article.get("id", ""), 180)
        if not article_id:
            errors.append(f"{prefix}: id is required")
        elif article_id in ids:
            errors.append(f"{prefix}: duplicate id {article_id}")
        ids.add(article_id)
        title = clean_text(article.get("title_ja", ""), 240)
        source_name = clean_text(article.get("source_name", ""), 160)
        if not title:
            errors.append(f"{prefix}: title_ja is required")
        if not source_name:
            errors.append(f"{prefix}: source_name is required")
        url = str(article.get("source_url", ""))
        try:
            parts = urlsplit(url)
        except ValueError:
            parts = None
        if not parts or parts.scheme not in {"http", "https"} or not parts.hostname:
            errors.append(f"{prefix}: invalid source_url")
        else:
            canonical = canonical_url(url)
            if article.get("is_test_data") is not True:
                if canonical in urls:
                    errors.append(f"{prefix}: duplicate source_url")
                urls.add(canonical)
        category = str(article.get("category", ""))
        if category not in CATEGORIES:
            errors.append(f"{prefix}: invalid category {category}")
        published = parse_date(article.get("published_at", ""), timezone.utc, reference)
        if not published:
            errors.append(f"{prefix}: invalid/future published_at")
        codes = article.get("country_codes", [])
        if not isinstance(codes, list):
            errors.append(f"{prefix}: country_codes must be an array")
    return errors


def atomic_json_write(path: Path, value: dict[str, Any]) -> None:
    text = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(text, encoding="utf-8")
    # Validate the exact bytes before replacing the current good file.
    json.loads(temporary.read_text(encoding="utf-8"))
    temporary.replace(path)


def run_update(registry_path: Path, output_path: Path, dry_run: bool = False) -> int:
    registry = load_json(registry_path)
    registry_errors = validate_source_registry(registry)
    if registry_errors:
        raise UpdateError("\n".join(registry_errors))
    existing = load_json(output_path)
    dataset_errors = validate_dataset(existing)
    if dataset_errors:
        raise UpdateError("existing news.json failed validation:\n" + "\n".join(dataset_errors))

    policy = registry.get("policy", {}) if isinstance(registry.get("policy"), dict) else {}
    reference = now_utc()
    fetched_by_source: dict[str, list[dict[str, Any]]] = {}
    failures: list[str] = []
    empty_sources: list[str] = []
    for source in registry.get("sources", []):
        if source.get("enabled") is not True:
            continue
        source_id = str(source.get("id", ""))
        try:
            result = process_source(source, policy, reference)
            if result.articles:
                fetched_by_source[source_id] = result.articles
                print(
                    f"OK  {source_id}: parsed={result.parsed_count} valid={result.filtered_count} selected={len(result.articles)}"
                )
            else:
                empty_sources.append(source_id)
                print(f"KEEP {source_id}: fetched successfully but no valid relevant articles; previous data preserved")
        except Exception as exc:  # Per-source isolation is deliberate.
            failures.append(f"{source_id}: {exc}")
            print(f"KEEP {source_id}: {exc}; previous data preserved")

    if not fetched_by_source:
        print("No source produced valid articles. Existing news.json was preserved unchanged.")
        if failures:
            print("Source failures:")
            for failure in failures:
                print(f"- {failure}")
        return 0

    max_total = int(policy.get("max_total_articles", 300))
    new_articles = merge_articles(existing.get("articles", []), fetched_by_source, max_total)
    if stable_article_view(new_articles) == stable_article_view(existing.get("articles", [])):
        print("No article changes detected. Existing news.json was preserved unchanged.")
        return 0

    current_success_codes = {
        code
        for items in fetched_by_source.values()
        for article in items
        for code in article.get("country_codes", [])
    }
    enabled_sources = [source for source in registry.get("sources", []) if source.get("enabled") is True]
    configured_codes = {
        clean_text(code, 12).upper()
        for source in enabled_sources
        for code in source.get("country_codes", [])
        if clean_text(code, 12)
    }
    previous_live_codes = {
        clean_text(code, 12).upper()
        for code in existing.get("live_country_codes", [])
        if clean_text(code, 12)
    }
    live_codes = sorted((previous_live_codes | current_success_codes) & configured_codes)
    enabled_source_ids = {clean_text(source.get("id", ""), 100) for source in enabled_sources}
    previous_success_ids = {
        clean_text(source_id, 100)
        for source_id in existing.get("successful_source_ids", [])
        if clean_text(source_id, 100)
    }
    successful_source_ids = sorted((previous_success_ids | set(fetched_by_source)) & enabled_source_ids)
    country_status = registry.get("pilot_country_status", {}) if isinstance(registry.get("pilot_country_status"), dict) else {}
    pending_codes = sorted(
        clean_text(code, 12).upper()
        for code, status in country_status.items()
        if isinstance(status, dict) and status.get("status") != "connected"
    )
    target_count = len(country_status)
    configured_count = len(configured_codes)
    updated = copy.deepcopy(existing)
    updated.update(
        {
            "schema_version": "1.1",
            "dataset_status": "phase2_auto_update_expansion",
            "generated_at": reference.isoformat(timespec="seconds"),
            "last_successful_update_at": reference.isoformat(timespec="seconds"),
            "phase": 2,
            "phase_label": "自動更新拡張試験",
            "notice_ja": f"公式RSS・公式更新情報の自動取得拡張版です。{target_count}カ国を表示対象とし、うち{configured_count}カ国は自動取得元を設定済みです。日本語以外の見出しは原文で表示します。取得未接続または取得失敗中の国では明示された試験データを保持します。",
            "auto_update_status": "active_partial",
            "connected_country_codes": sorted(configured_codes),
            "pending_country_codes": pending_codes,
            "live_country_codes": live_codes,
            "successful_source_ids": successful_source_ids,
            "articles": new_articles,
        }
    )
    updated_errors = validate_dataset(updated)
    if updated_errors:
        raise UpdateError("generated news.json failed validation:\n" + "\n".join(updated_errors))
    if dry_run:
        print(f"DRY RUN: would write {len(new_articles)} articles to {output_path}")
        return 0
    atomic_json_write(output_path, updated)
    print(f"UPDATED {output_path}: {len(existing.get('articles', []))} -> {len(new_articles)} articles")
    if failures:
        print("Partial failures (old data retained):")
        for failure in failures:
            print(f"- {failure}")
    if empty_sources:
        print("Fetched but empty after validation/filtering (old data retained):")
        for source_id in empty_sources:
            print(f"- {source_id}")
    return 0


def run_self_test() -> int:
    reference = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)
    source = {
        "id": "selftest_rss",
        "type": "rss",
        "url": "https://official.example/feed.xml",
        "allowed_hosts": ["official.example"],
        "source_name": "Official Food Authority",
        "source_language": "en",
        "country_codes": ["SG"],
        "region_code": "southeast_asia",
        "timezone": "+08:00",
        "default_category": "food",
        "include_keywords": ["food", "import"],
        "max_items": 10,
        "retention_days": 180,
        "importance": 85,
        "classification_confidence": 98,
    }
    rss = b"""<?xml version='1.0' encoding='UTF-8'?>
    <rss version='2.0'><channel><title>Official</title>
      <item><title>Food import safety rules updated</title><link>https://official.example/news/1?utm_source=x</link><pubDate>Fri, 17 Jul 2026 02:00:00 +0000</pubDate><description><![CDATA[<b>Short</b> summary<script>alert(1)</script>]]></description></item>
      <item><title>Unrelated medical device event</title><link>https://official.example/news/2</link><pubDate>Fri, 17 Jul 2026 02:00:00 +0000</pubDate></item>
      <item><title>Food future item</title><link>https://official.example/news/3</link><pubDate>Fri, 30 Jul 2026 02:00:00 +0000</pubDate></item>
      <item><title>Food bad URL</title><link>javascript:alert(1)</link><pubDate>Fri, 17 Jul 2026 02:00:00 +0000</pubDate></item>
    </channel></rss>"""
    candidates = parse_xml_candidates(rss)
    articles = [make_article(item, source, reference) for item in candidates]
    articles = [item for item in articles if item]
    assert len(articles) == 1, articles
    assert articles[0]["category"] == "regulation_food_safety"
    assert "utm_source" not in articles[0]["source_url"]
    assert "script" not in articles[0]["summary_ja"].lower()

    atom = b"""<?xml version='1.0' encoding='utf-8'?>
    <feed xmlns='http://www.w3.org/2005/Atom'><title>Feed</title>
      <entry><title>Food machinery automation project</title><link href='https://official.example/news/a'/><updated>2026-07-16T08:30:00+08:00</updated><summary>Automation for a food factory.</summary></entry>
    </feed>"""
    atom_article = make_article(parse_xml_candidates(atom)[0], source, reference)
    assert atom_article and atom_article["category"] == "food_machinery"

    thai_source = {
        **source,
        "id": "selftest_th_html",
        "type": "html",
        "url": "https://en.fda.moph.go.th/news/",
        "allowed_hosts": ["en.fda.moph.go.th"],
        "source_name": "Thai Food and Drug Administration",
        "country_codes": ["TH"],
        "timezone": "+07:00",
        "link_include_regex": r"^https://en\.fda\.moph\.go\.th/news/[a-z0-9]",
    }
    html_payload = """<html><body><a href='/news/food-export-success'>Thai FDA Supports Food Exporters Publish Date 10 ก.ค. 69</a><script><a href='/news/bad'>Food bad</a></script></body></html>""".encode()
    thai_candidates = parse_html_candidates(html_payload, thai_source)
    assert len(thai_candidates) == 1
    thai_article = make_article(thai_candidates[0], thai_source, reference)
    assert thai_article and thai_article["published_at"].startswith("2026-07-10")

    existing = [
        {**articles[0], "id": "old-live", "source_id": "selftest_rss", "auto_generated": True},
        {
            "id": "test_sg", "title_ja": "test", "summary_ja": "test", "country_codes": ["SG"],
            "region_code": "southeast_asia", "category": "food", "published_at": "2026-07-17T00:00:00+00:00",
            "source_name": "test", "source_url": "https://test.example/sg", "source_language": "ja", "scope": "country",
            "importance": 1, "classification_confidence": 100, "is_test_data": True,
        },
        {
            "id": "test_jp", "title_ja": "test", "summary_ja": "test", "country_codes": ["JP"],
            "region_code": "east_asia", "category": "food", "published_at": "2026-07-17T00:00:00+00:00",
            "source_name": "test", "source_url": "https://test.example/jp", "source_language": "ja", "scope": "country",
            "importance": 1, "classification_confidence": 100, "is_test_data": True,
        },
    ]
    merged = merge_articles(existing, {"selftest_rss": articles}, 30)
    assert not any(item["id"] == "old-live" for item in merged)
    assert not any(item["id"] == "test_sg" for item in merged)
    assert any(item["id"] == "test_jp" for item in merged)
    live_urls = [canonical_url(item["source_url"]) for item in merged if item.get("is_test_data") is not True]
    assert len(set(live_urls)) == len(live_urls)
    print("SELF-TEST PASS: RSS, Atom, HTML, Thai date, sanitisation, URL policy, classification, replacement and fallback")
    return 0


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    root = script_dir.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", type=Path, default=root / "data" / "news_sources.json")
    parser.add_argument("--output", type=Path, default=root / "data" / "news.json")
    parser.add_argument("--check", action="store_true", help="validate source registry and current news.json without fetching")
    parser.add_argument("--self-test", action="store_true", help="run deterministic offline parser/security tests")
    parser.add_argument("--dry-run", action="store_true", help="fetch and build data but do not write news.json")
    args = parser.parse_args()
    try:
        if args.self_test:
            return run_self_test()
        if args.check:
            registry = load_json(args.sources)
            dataset = load_json(args.output)
            errors = validate_source_registry(registry) + validate_dataset(dataset)
            if errors:
                eprint("CHECK FAILED")
                for error in errors:
                    eprint(f"- {error}")
                return 1
            print(
                f"CHECK PASS: {len(registry.get('sources', []))} sources, "
                f"{sum(1 for s in registry.get('sources', []) if s.get('enabled') is True)} enabled, "
                f"{len(dataset.get('articles', []))} articles"
            )
            return 0
        return run_update(args.sources, args.output, args.dry_run)
    except (UpdateError, AssertionError) as exc:
        eprint(f"ERROR: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
