#!/usr/bin/env python3
"""Build a conservative iframe allowlist for MARKET BASE official-site previews.

Two different checks are intentionally separated:
1. Candidate selection: only URLs already identified as an official company/site URL.
2. Frameability audit: only candidates with no known browser framing restriction.

Unknown, related/reference-only, social-platform, news, timed-out, document,
authentication/challenge, and framing-restricted URLs remain hidden in the UI.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import json
import re
import sys
import threading
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable
from urllib.parse import urlsplit, urlunsplit

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install dependencies: pip install requests beautifulsoup4") from exc

VERSION = "V325"
DEFAULT_PARENT_ORIGIN = "https://takina888.github.io"
HTML_PAGES = (
    "cvs-vendor-v273-db-title-r27.html",
    "gohan-food-manufacturers-v273-db-title-r27.html",
    "imported-food-machinery-v273-db-title-r27.html",
    "retail-sales-v273-db-title-r27.html",
    "rail-food-kitchen-v273-db-title-r27.html",
    "japan-food-machinery-v273-r58.html",
)
BLOCKED_EXTENSIONS = re.compile(r"\.(?:pdf|zip|xlsx?|docx?|pptx?|csv)(?:$|[?#])", re.I)
FRAME_BUSTER_PATTERNS = (
    re.compile(r"if\s*\(\s*(?:window\.)?top\s*!={0,2}\s*(?:window\.)?self\s*\)\s*\{?\s*(?:window\.)?top\.location", re.I),
    re.compile(r"if\s*\(\s*(?:window\.)?self\s*!={0,2}\s*(?:window\.)?top\s*\)\s*\{?\s*(?:window\.)?top\.location", re.I),
    re.compile(r"(?:window\.)?top\.location\s*=\s*(?:window\.)?(?:self\.)?location", re.I),
)
CHALLENGE_MARKERS = (
    "cf-chl-", "cloudflare ray id", "checking your browser", "attention required!",
    "enable javascript and cookies to continue", "access denied", "request unsuccessful",
)

# These are platforms/reference publishers, not a company's own web domain.
# An official social account can still be opened by the existing external link,
# but it is deliberately excluded from the embedded official-site preview.
NON_COMPANY_HOSTS = {
    "104.com.tw", "1111.com.tw", "apnews.com", "apps.apple.com", "archive.org",
    "bbc.com", "bloomberg.com", "businesswire.com", "cnn.com", "crunchbase.com",
    "dnb.com", "facebook.com", "forbes.com", "ft.com", "glassdoor.com",
    "globenewswire.com", "goodinfo.tw", "indeed.com", "instagram.com",
    "jobstreet.com", "linkedin.com", "marketscreener.com", "nytimes.com",
    "panjiva.com", "pitchbook.com", "prnewswire.com", "researchgate.net",
    "reuters.com", "scribd.com", "set.or.th", "slideshare.net", "statista.com",
    "stockanalysis.com", "theorg.com", "tiktok.com", "tradeimex.in", "trademo.com",
    "twitter.com", "volza.com", "wikipedia.org", "wsj.com", "x.com", "youtube.com",
    "youtu.be", "zoominfo.com", "bestfoodimporters.com", "importgenius.com",
}
_thread_local = threading.local()


@dataclass(frozen=True)
class Candidate:
    url: str
    source_page: str
    entity_id: str
    label: str
    kind: str


@dataclass
class Audit:
    url: str
    final_url: str = ""
    allowed: bool = False
    reason: str = "unknown"
    status_code: int | None = None
    content_type: str = ""
    x_frame_options: str = ""
    frame_ancestors: str = ""
    source_pages: list[str] | None = None
    entity_ids: list[str] | None = None


def compact(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_url(raw: object) -> str:
    value = compact(raw)
    if not value:
        return ""
    value = re.split(r"\s+(?=https?://)", value, maxsplit=1)[0]
    try:
        parts = urlsplit(value)
    except ValueError:
        return ""
    if parts.scheme.lower() not in {"http", "https"} or not parts.netloc:
        return ""
    host = parts.hostname.lower() if parts.hostname else ""
    port = parts.port
    netloc = host
    if port and not ((parts.scheme.lower() == "https" and port == 443) or (parts.scheme.lower() == "http" and port == 80)):
        netloc = f"{host}:{port}"
    path = parts.path or "/"
    return urlunsplit((parts.scheme.lower(), netloc, path, parts.query, ""))


def normalized_host(raw_url: object) -> str:
    url = normalize_url(raw_url)
    if not url:
        return ""
    host = (urlsplit(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def is_non_company_host(host: str) -> bool:
    return any(host == blocked or host.endswith(f".{blocked}") for blocked in NON_COMPANY_HOSTS)


def host_related(left: str, right: str) -> bool:
    if not left or not right:
        return False
    return left == right or left.endswith(f".{right}") or right.endswith(f".{left}")


def add_candidate(items: list[Candidate], raw_url: object, source: str, entity: str, label: str, kind: str) -> None:
    url = normalize_url(raw_url)
    host = normalized_host(url)
    if not url or BLOCKED_EXTENSIONS.search(url) or not host or is_non_company_host(host):
        return
    items.append(Candidate(url, source, compact(entity), compact(label), kind))


def first_official_gohan_link(card) -> object | None:
    links = card.select("a[href]")
    priorities = (
        "公式ホームページ", "公式サイト", "会社HP", "公式ページ",
        "公式サイト・製品情報", "公式商品ページ",
    )
    for label in priorities:
        found = next((a for a in links if compact(a.get_text(" ", strip=True)) == label), None)
        if found:
            return found
    return next((a for a in links if compact(a.get_text(" ", strip=True)).startswith("公式")), None)


def imported_official_link(card) -> object | None:
    for row in card.select("tr"):
        cells = row.find_all(["th", "td"], recursive=False)
        if cells and compact(cells[0].get_text(" ", strip=True)) == "公式URL":
            return row.select_one("a[href]")
    return None


def rail_card_has_official_company_page(card) -> bool:
    cells = card.select(".grid > .k, .grid > .v")
    for index in range(0, len(cells) - 1, 2):
        key, value = cells[index], cells[index + 1]
        if "k" not in (key.get("class") or []) or "v" not in (value.get("class") or []):
            continue
        if compact(key.get_text(" ", strip=True)) == "主な内容" and "公式会社ページ" in compact(value.get_text(" ", strip=True)):
            return True
    return False


def collect_retail_official_hosts(root: Path) -> set[str]:
    hosts: set[str] = set()
    files = (
        root / "data/market_base_retail_channels_full196_rc.json",
        root / "data/market_base_retail_presence_master_CURRENT.json",
    )

    def walk(value: object) -> None:
        if isinstance(value, dict):
            source_type = compact(value.get("source_type")).lower()
            store_source_type = compact(value.get("store_count_source_type")).lower()
            pairs = (
                (source_type, value.get("source_url")),
                (store_source_type, value.get("store_count_source_url")),
            )
            for kind, raw_url in pairs:
                if kind != "official":
                    continue
                host = normalized_host(raw_url)
                if host and not is_non_company_host(host):
                    hosts.add(host)
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    for path in files:
        if path.exists():
            try:
                walk(json.loads(path.read_text(encoding="utf-8")))
            except (OSError, json.JSONDecodeError):
                continue
    return hosts


def extract_html_candidates(root: Path) -> list[Candidate]:
    items: list[Candidate] = []
    retail_official_hosts = collect_retail_official_hosts(root)

    for page_name in HTML_PAGES:
        path = root / page_name
        if not path.exists():
            continue
        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")

        if page_name.startswith("cvs-"):
            for card in soup.select("[data-entity-id]"):
                link = next(
                    (a for a in card.select("a[href]") if "公式" in compact(a.get("title", ""))),
                    None,
                )
                if link:
                    add_candidate(items, link.get("href"), page_name, card.get("data-entity-id", ""), link.get("title", "公式サイト"), "cvs_explicit_official")

        elif page_name.startswith("gohan-food"):
            for card in soup.select("[data-entity-id]"):
                link = first_official_gohan_link(card)
                if link:
                    add_candidate(items, link.get("href"), page_name, card.get("data-entity-id", ""), link.get_text(" ", strip=True), "gohan_explicit_official")

        elif page_name.startswith("imported-food-machinery"):
            for card in soup.select("[data-entity-id]"):
                link = imported_official_link(card)
                if link:
                    add_candidate(items, link.get("href"), page_name, card.get("data-entity-id", ""), "公式URL", "imported_machinery_official_row")

        elif page_name.startswith("retail-sales"):
            for card in soup.select("[data-entity-id]"):
                for row in card.select(".source-row"):
                    label = row.select_one(".label")
                    if not label or compact(label.get_text(" ", strip=True)) != "主要URL":
                        continue
                    link = row.select_one("a[href]")
                    if not link:
                        break
                    url = normalize_url(link.get("href"))
                    host = normalized_host(url)
                    # A retail "main URL" is treated as official only when its
                    # web host agrees with an official-source host in the retail masters.
                    if host and not is_non_company_host(host) and any(host_related(host, official) for official in retail_official_hosts):
                        add_candidate(items, url, page_name, card.get("data-entity-id", ""), "主要URL（公式ホスト確認済み）", "retail_official_master_host_match")
                    break

        elif page_name.startswith("rail-food"):
            for card in soup.select("[data-entity-id]"):
                if not rail_card_has_official_company_page(card):
                    continue
                link = card.select_one(".links a[href]")
                if link:
                    add_candidate(items, link.get("href"), page_name, card.get("data-entity-id", ""), "公式会社ページ", "rail_explicit_official")

    return items


def extract_json_candidates(root: Path) -> list[Candidate]:
    items: list[Candidate] = []
    machinery = root / "data/japan_food_machinery_db_v075.json"
    if machinery.exists():
        data = json.loads(machinery.read_text(encoding="utf-8"))
        for index, maker in enumerate(data.get("manufacturers", []), start=1):
            add_candidate(
                items,
                maker.get("会社概要URL"),
                "japan-food-machinery-v273-r58.html",
                maker.get("_target_id") or f"maker-{index:04d}",
                "会社HP",
                "japan_machinery_company_home",
            )

    imported = root / "data/imported-food-machinery-distributors-v324.json"
    if imported.exists():
        data = json.loads(imported.read_text(encoding="utf-8"))
        for record in data.get("records", []):
            add_candidate(
                items,
                record.get("official_url"),
                "imported-food-machinery-v273-db-title-r27.html",
                record.get("entity_id") or record.get("id", ""),
                "公式URL",
                "imported_machinery_official_json",
            )
    return items


def deduplicate(candidates: Iterable[Candidate]) -> tuple[list[Candidate], dict[str, list[Candidate]]]:
    grouped: dict[str, list[Candidate]] = {}
    for candidate in candidates:
        grouped.setdefault(candidate.url, []).append(candidate)
    unique = [entries[0] for entries in grouped.values()]
    unique.sort(key=lambda item: item.url)
    return unique, grouped


def _session() -> requests.Session:
    session = getattr(_thread_local, "session", None)
    if session is None:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; MARKET-BASE-Iframe-Audit/1.1; +https://takina888.github.io/market_base/)",
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.2",
            "Accept-Language": "ja,en-US;q=0.7,en;q=0.5",
            "Cache-Control": "no-cache",
        })
        _thread_local.session = session
    return session


def effective_port(parts) -> int | None:
    if parts.port is not None:
        return parts.port
    if parts.scheme == "https":
        return 443
    if parts.scheme == "http":
        return 80
    return None


def origin_matches_source(parent_origin: str, protected_origin: str, token: str) -> bool:
    token = token.strip().strip('"')
    parent = urlsplit(parent_origin)
    protected = urlsplit(protected_origin)
    if token == "*":
        return True
    if token == "https:":
        return parent.scheme == "https"
    if token == "http:":
        return parent.scheme == "http"
    if token in {"'none'", "none"}:
        return False
    if token in {"'self'", "self"}:
        return (
            parent.scheme == protected.scheme
            and (parent.hostname or "").lower() == (protected.hostname or "").lower()
            and effective_port(parent) == effective_port(protected)
        )
    if "://" not in token:
        return False
    try:
        source = urlsplit(token)
    except ValueError:
        return False
    if source.scheme and source.scheme != parent.scheme:
        return False
    source_host = (source.hostname or "").lower()
    parent_host = (parent.hostname or "").lower()
    if source_host.startswith("*."):
        suffix = source_host[1:]
        host_matches = parent_host.endswith(suffix) and parent_host != suffix.lstrip(".")
    else:
        host_matches = source_host == parent_host
    return host_matches and effective_port(source) == effective_port(parent)


def frame_ancestors_allows(csp: str, parent_origin: str, protected_origin: str) -> tuple[bool, str]:
    # Requests may combine multiple CSP response headers with commas. Every
    # enforced policy applies, so each policy containing frame-ancestors must allow.
    policies = [part.strip() for part in csp.split(",") if part.strip()]
    shown: list[str] = []
    found = False
    for policy in policies or [csp]:
        directives = re.findall(r"(?:^|;)\s*frame-ancestors\s+([^;]+)", policy, flags=re.I)
        for directive in directives:
            found = True
            clean = compact(directive)
            shown.append(clean)
            tokens = directive.split()
            if any(token.strip().strip('"') in {"'none'", "none"} for token in tokens):
                return False, " | ".join(shown)
            if not any(origin_matches_source(parent_origin, protected_origin, token) for token in tokens):
                return False, " | ".join(shown)
    return (True, " | ".join(shown)) if found else (True, "")


def audit_url(url: str, parent_origin: str, timeout: float, max_bytes: int) -> Audit:
    audit = Audit(url=url)
    if urlsplit(parent_origin).scheme == "https" and urlsplit(url).scheme == "http":
        audit.reason = "mixed_content_http"
        return audit
    try:
        response = _session().get(url, timeout=(min(timeout, 8.0), timeout), allow_redirects=True, stream=True)
        audit.status_code = response.status_code
        audit.final_url = normalize_url(response.url)
        audit.content_type = compact(response.headers.get("content-type", "")).lower()
        audit.x_frame_options = compact(response.headers.get("x-frame-options", ""))
        csp = compact(response.headers.get("content-security-policy", ""))

        if response.status_code < 200 or response.status_code >= 400:
            audit.reason = f"http_{response.status_code}"
            response.close()
            return audit
        if BLOCKED_EXTENSIONS.search(audit.final_url or url):
            audit.reason = "document_not_html"
            response.close()
            return audit
        if audit.content_type and not any(kind in audit.content_type for kind in ("text/html", "application/xhtml+xml")):
            audit.reason = "content_type_not_html"
            response.close()
            return audit

        xfo = audit.x_frame_options.lower()
        if re.search(r"(?:^|[,\s])(deny|sameorigin)(?:$|[,\s])", xfo):
            audit.reason = "x_frame_options_blocks"
            response.close()
            return audit
        if "allow-from" in xfo and parent_origin.lower() not in xfo:
            audit.reason = "x_frame_options_allow_from_other_origin"
            response.close()
            return audit

        allowed_by_csp, ancestors = frame_ancestors_allows(csp, parent_origin, audit.final_url or url)
        audit.frame_ancestors = ancestors
        if not allowed_by_csp:
            audit.reason = "csp_frame_ancestors_blocks"
            response.close()
            return audit

        body = bytearray()
        for chunk in response.iter_content(chunk_size=16384):
            if not chunk:
                continue
            body.extend(chunk)
            if len(body) >= max_bytes:
                break
        response.close()
        text = body[:max_bytes].decode(response.encoding or "utf-8", errors="ignore").lower()

        if not audit.content_type and not re.search(r"<!doctype\s+html|<html[\s>]", text, flags=re.I):
            audit.reason = "body_not_html"
            return audit
        if any(marker in text for marker in CHALLENGE_MARKERS):
            audit.reason = "challenge_or_access_denied"
            return audit
        if any(pattern.search(text) for pattern in FRAME_BUSTER_PATTERNS):
            audit.reason = "javascript_frame_buster"
            return audit

        audit.allowed = True
        audit.reason = "verified_no_known_frame_block"
        return audit
    except requests.exceptions.SSLError:
        audit.reason = "ssl_error"
    except requests.exceptions.Timeout:
        audit.reason = "timeout"
    except requests.exceptions.TooManyRedirects:
        audit.reason = "too_many_redirects"
    except requests.RequestException as exc:
        audit.reason = f"request_error:{type(exc).__name__}"
    except Exception as exc:  # pragma: no cover
        audit.reason = f"unexpected_error:{type(exc).__name__}"
    return audit


def write_candidates(path: Path, unique: list[Candidate], grouped: dict[str, list[Candidate]]) -> None:
    payload = {
        "version": VERSION,
        "selection_policy": "Only explicitly identified official company URLs. Retail main URLs additionally require a host match against a retail master source marked official. Related/reference/news/social links are excluded before frameability testing.",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "unique_url_count": len(unique),
        "reference_count": sum(len(entries) for entries in grouped.values()),
        "candidates": [
            {
                **asdict(candidate),
                "source_pages": sorted({item.source_page for item in grouped[candidate.url]}),
                "entity_ids": sorted({item.entity_id for item in grouped[candidate.url] if item.entity_id}),
            }
            for candidate in unique
        ],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_allowlist(path: Path, audits: list[Audit], parent_origin: str, candidate_count: int) -> None:
    # The browser uses the original exact candidate URL that appears in the page.
    urls = sorted({audit.url for audit in audits if audit.allowed})
    blocked = sum(1 for audit in audits if not audit.allowed)
    generated = dt.datetime.now(dt.timezone.utc).isoformat()
    js_urls = json.dumps(urls, ensure_ascii=False, indent=2)
    content = f"""/* Auto-generated. Do not edit by hand. */
window.MB_OFFICIAL_SITE_PREVIEW_ALLOWLIST = Object.freeze({{
  version: '{VERSION}',
  generatedAt: {json.dumps(generated)},
  status: 'verified',
  marketBaseOrigin: {json.dumps(parent_origin)},
  candidateCount: {candidate_count},
  verifiedCount: {len(urls)},
  blockedCount: {blocked},
  urls: Object.freeze({js_urls})
}});
"""
    path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--parent-origin", default=DEFAULT_PARENT_ORIGIN)
    parser.add_argument("--workers", type=int, default=24)
    parser.add_argument("--timeout", type=float, default=14.0)
    parser.add_argument("--max-bytes", type=int, default=262144)
    parser.add_argument("--candidates-only", action="store_true")
    args = parser.parse_args()

    root = args.root.resolve()
    candidates = extract_html_candidates(root) + extract_json_candidates(root)
    unique, grouped = deduplicate(candidates)
    candidates_path = root / "data/official-site-preview-candidates-v325.json"
    audit_path = root / "data/official-site-preview-audit-v325.json"
    allowlist_path = root / "assets/js/official-site-preview-allowlist-v325.js"
    write_candidates(candidates_path, unique, grouped)
    print(f"Candidates: {len(unique)} unique URLs ({len(candidates)} references)")

    if args.candidates_only:
        return 0

    audits: list[Audit] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        future_map = {
            pool.submit(audit_url, candidate.url, args.parent_origin, args.timeout, args.max_bytes): candidate.url
            for candidate in unique
        }
        total = len(future_map)
        for index, future in enumerate(concurrent.futures.as_completed(future_map), start=1):
            url = future_map[future]
            try:
                audit = future.result()
            except Exception as exc:  # pragma: no cover
                audit = Audit(url=url, reason=f"worker_error:{type(exc).__name__}")
            refs = grouped.get(url, [])
            audit.source_pages = sorted({item.source_page for item in refs})
            audit.entity_ids = sorted({item.entity_id for item in refs if item.entity_id})
            audits.append(audit)
            if index % 50 == 0 or index == total:
                print(f"Audited {index}/{total}")

    audits.sort(key=lambda item: item.url)
    allowed_count = sum(1 for item in audits if item.allowed)
    audit_payload = {
        "version": VERSION,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "parent_origin": args.parent_origin,
        "candidate_count": len(unique),
        "allowed_count": allowed_count,
        "blocked_or_unverified_count": len(audits) - allowed_count,
        "candidate_policy": "Only official-company URL candidates selected before technical frameability testing.",
        "frame_policy": "Exact URL allowlist. Any timeout, error, non-HTML response, X-Frame-Options restriction, CSP frame-ancestors restriction, challenge page, or strong JavaScript frame-buster signal is excluded.",
        "audits": [asdict(item) for item in audits],
    }
    audit_path.write_text(json.dumps(audit_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_allowlist(allowlist_path, audits, args.parent_origin, len(unique))
    print(f"Allowed: {allowed_count}; excluded: {len(audits) - allowed_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
