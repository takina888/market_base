#!/usr/bin/env python3
"""Static release-integrity audit for MARKET BASE V333.17.

The test intentionally audits release-facing references rather than every historical
file kept in the handoff.  It is safe to run before packaging and reports all
detected inconsistencies in one pass.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
BUILD_ID = "MARKET_BASE_V333_17_CACHE_COHERENCE_SMOOTH_NAVIGATION_20260810"
TOKEN = "20260810-v333-17-cache-coherence-smooth-navigation"
VERSION = "V333.17"
EXPECTED_HTML = 38
PLAYER = "world-radio/player.html"

CURRENT_APP = "assets/js/app-v273-country-profile-r28-refresh-route-header-r98.js"
CURRENT_NAVIGATION = "assets/js/market-base-navigation-v333-17.js"
CURRENT_DEFERRED = "assets/js/market-base-home-deferred-v333-17.js"
CURRENT_SHELL = "assets/js/market-base-pc-unified-shell-v333-17.js"
CURRENT_NAVIGATION_CSS = "assets/css/market-base-navigation-v333-17.css"
CURRENT_CONTROLLER = "assets/js/market-base-update-controller-v335.js"


class ReleaseHTMLParser(HTMLParser):
    """Collect ordered scripts, build metadata, and URL-bearing attributes."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, list[str]] = {}
        self.scripts: list[str] = []
        self.urls: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        lowered = tag.lower()
        data = {str(key).lower(): value or "" for key, value in attrs}
        if lowered == "meta" and data.get("name"):
            self.meta.setdefault(data["name"].lower(), []).append(data.get("content", ""))
        if lowered == "script" and data.get("src"):
            self.scripts.append(data["src"])

        for attribute in ("src", "href", "poster", "action"):
            if data.get(attribute):
                self.urls.append((f"{lowered}[{attribute}]", data[attribute]))
        if data.get("srcset"):
            for candidate in data["srcset"].split(","):
                url = candidate.strip().split(maxsplit=1)[0]
                if url:
                    self.urls.append((f"{lowered}[srcset]", url))


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def is_local_url(url: str) -> bool:
    value = url.strip()
    if not value or value.startswith(("#", "//")):
        return False
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc


def relative_url_path(url: str) -> str:
    return urlparse(url).path.removeprefix("/").removeprefix("./")


def cache_token_errors(label: str, urls: list[tuple[str, str]]) -> list[str]:
    errors: list[str] = []
    for origin, url in urls:
        if not is_local_url(url):
            continue
        query = parse_qs(urlparse(url).query, keep_blank_values=True)
        for key in ("v", "mbv"):
            if key in query and query[key] != [TOKEN]:
                errors.append(f"{label}: {origin} {url!r} has {key}={query[key]!r}")
    return errors


def extract_array(source: str, name: str) -> list[str]:
    match = re.search(rf"\bconst\s+{re.escape(name)}\s*=\s*\[(.*?)\];", source, re.S)
    if not match:
        return []
    return re.findall(r'''["']([^"']+)["']''', match.group(1))


def parse_offline_manifest(source: str) -> dict[str, object]:
    match = re.search(r"Object\.freeze\((\{.*\})\);", source, re.S)
    if not match:
        raise ValueError("Object.freeze JSON payload not found")
    return json.loads(match.group(1))


def main() -> int:
    failures: list[str] = []

    def check(condition: bool, message: str, details: list[str] | None = None) -> None:
        print(f"{'PASS' if condition else 'FAIL'}  {message}")
        if not condition:
            failures.append(message)
            failures.extend(details or [])

    html_files = sorted(
        path
        for path in ROOT.rglob("*.html")
        if "HANDOFF_DOCUMENTS" not in path.parts
    )
    check(len(html_files) == EXPECTED_HTML, f"public HTML pages = {EXPECTED_HTML}", [
        f"found {len(html_files)} public HTML files"
    ])

    metadata_errors: list[str] = []
    controller_errors: list[str] = []
    order_errors: list[str] = []
    token_errors: list[str] = []
    stale_release_errors: list[str] = []
    legacy_live_asset_errors: list[str] = []
    controller_pages: list[str] = []
    current_shell_pages: list[str] = []

    for page in html_files:
        relative = page.relative_to(ROOT).as_posix()
        body = page.read_text(encoding="utf-8")
        parser = ReleaseHTMLParser()
        parser.feed(body)

        for meta_name in ("market-base-build", "market-base-site-build"):
            actual = parser.meta.get(meta_name, [])
            if actual != [BUILD_ID]:
                metadata_errors.append(f"{relative}: {meta_name}={actual!r}")
        nav_build = parser.meta.get("market-base-nav-build", [])
        if nav_build and nav_build != [BUILD_ID]:
            metadata_errors.append(f"{relative}: market-base-nav-build={nav_build!r}")

        controllers = [
            (index, src)
            for index, src in enumerate(parser.scripts)
            if "market-base-update-controller" in urlparse(src).path
        ]
        if relative == PLAYER:
            if controllers:
                controller_errors.append(f"{relative}: player must omit controller: {controllers!r}")
        else:
            controller_pages.append(relative)
            if len(controllers) != 1:
                controller_errors.append(f"{relative}: controller count={len(controllers)}")
            else:
                controller_index, controller_url = controllers[0]
                if not urlparse(controller_url).path.endswith(CURRENT_CONTROLLER):
                    controller_errors.append(f"{relative}: wrong controller {controller_url!r}")
                query = parse_qs(urlparse(controller_url).query, keep_blank_values=True)
                if query.get("v") != [TOKEN]:
                    controller_errors.append(f"{relative}: controller token {controller_url!r}")

                # The controller owns update/navigation coordination and must start
                # after all page-local boot scripts.  A telemetry script may follow.
                later_local = [src for src in parser.scripts[controller_index + 1 :] if is_local_url(src)]
                if later_local:
                    order_errors.append(f"{relative}: local scripts follow controller: {later_local!r}")
                for prerequisite in ("market-base-build", "market-base-runtime"):
                    indices = [
                        index
                        for index, src in enumerate(parser.scripts)
                        if prerequisite in urlparse(src).path
                    ]
                    if indices and max(indices) > controller_index:
                        order_errors.append(
                            f"{relative}: {prerequisite} appears after update controller"
                        )

        token_errors.extend(cache_token_errors(relative, parser.urls))
        for _, url in parser.urls:
            asset_path = relative_url_path(url)
            if asset_path.endswith(CURRENT_SHELL):
                current_shell_pages.append(relative)
            if "market-base-pc-unified-shell-r95-v1.js" in asset_path:
                legacy_live_asset_errors.append(f"{relative}: old shell {url!r}")
            if re.search(
                r"app-v273-country-profile-r28-refresh-route-header-r(?:95|96|97)\.js$",
                asset_path,
            ):
                legacy_live_asset_errors.append(f"{relative}: old app {url!r}")
        if "MARKET_BASE_V333_16_RADIO_LIFECYCLE_UI_PERFORMANCE_20260810" in body:
            stale_release_errors.append(f"{relative}: stale V333.16 BUILD_ID")
        if "20260810-v333-16-radio-lifecycle-ui-performance" in body:
            stale_release_errors.append(f"{relative}: stale V333.16 asset token")

    check(not metadata_errors, "all public HTML has exact V333.17 build/site metadata", metadata_errors)
    check(
        len(controller_pages) == EXPECTED_HTML - 1 and not controller_errors,
        "37 pages use one current controller; radio player intentionally uses none",
        controller_errors,
    )
    check(not order_errors, "update controller is the final page-local boot script", order_errors)
    check(not token_errors, "all local HTML v/mbv cache queries use the V333.17 token", token_errors)
    check(not stale_release_errors, "no V333.16 build/token remains in public HTML", stale_release_errors)
    check(
        len(current_shell_pages) == 12 and not legacy_live_asset_errors,
        "12 shell pages use V333.17 JavaScript and no public HTML references old app/shell JavaScript",
        [f"current shell page count={len(current_shell_pages)}", *legacy_live_asset_errors],
    )

    check(read("version.txt").strip() == BUILD_ID, "version.txt matches V333.17 BUILD_ID")
    try:
        web_manifest = json.loads(read("manifest.json"))
    except (OSError, json.JSONDecodeError) as error:
        web_manifest = {}
        failures.append(f"manifest.json could not be parsed: {error}")
    check(web_manifest.get("version") == VERSION, "manifest version is V333.17")
    check(web_manifest.get("build_id") == BUILD_ID, "manifest build_id matches V333.17")
    check(
        TOKEN in str(web_manifest.get("start_url", ""))
        and TOKEN in str(web_manifest.get("id", "")),
        "manifest start_url and id use the V333.17 token",
    )

    current_assets = [
        CURRENT_APP,
        CURRENT_NAVIGATION,
        CURRENT_DEFERRED,
        CURRENT_SHELL,
        CURRENT_NAVIGATION_CSS,
    ]
    missing_assets = [relative for relative in current_assets if not (ROOT / relative).is_file()]
    check(not missing_assets, "all V333.17 navigation/performance assets exist", missing_assets)

    index = read("index.html")
    index_parser = ReleaseHTMLParser()
    index_parser.feed(index)
    index_urls = [url for _, url in index_parser.urls]
    missing_index_refs = [
        relative
        for relative in current_assets
        if not any(relative_url_path(url).endswith(relative) for url in index_urls)
    ]
    stale_index_refs = [
        url
        for url in index_urls
        if re.search(r"app-v273-country-profile-r28-refresh-route-header-r(?:95|96|97)\.js", url)
        or "market-base-pc-unified-shell-r95-v1.js" in url
    ]
    check(not missing_index_refs, "index.html references every V333.17 asset", missing_index_refs)
    check(not stale_index_refs, "index.html omits old app and old shell JavaScript", stale_index_refs)

    sw = read("sw.js")
    check(BUILD_ID in sw and TOKEN in sw, "Service Worker declares the V333.17 generation")
    required = extract_array(sw, "REQUIRED")
    core = extract_array(sw, "CORE")
    check(bool(required) and bool(core), "Service Worker REQUIRED and CORE arrays are parseable")

    sw_reference_errors: list[str] = []
    for url in dict.fromkeys(required + core):
        if not is_local_url(url):
            continue
        parsed = urlparse(url)
        relative = parsed.path
        if relative in ("", ".", "./", "/"):
            relative = "index.html"
        relative = relative.removeprefix("/").removeprefix("./")
        if not relative or not (ROOT / relative).is_file():
            sw_reference_errors.append(f"missing SW reference: {url}")
        query = parse_qs(parsed.query, keep_blank_values=True)
        for key in ("v", "mbv"):
            if key in query and query[key] != [TOKEN]:
                sw_reference_errors.append(f"stale SW token: {url}")
    sw_paths = {relative_url_path(url) for url in required + core}
    for asset in current_assets:
        if asset not in sw_paths:
            sw_reference_errors.append(f"current asset absent from SW shell: {asset}")
    check(not sw_reference_errors, "all local SW references exist and use the current token", sw_reference_errors)

    refresh_surfaces = [
        CURRENT_APP,
        CURRENT_NAVIGATION,
        CURRENT_SHELL,
        "assets/js/market-base-scroll-controls-v334.js",
        CURRENT_CONTROLLER,
        "flight-kitchen-v273-db-title-r27.html",
        "rail-food-kitchen-v273-db-title-r27.html",
    ]
    globally_unsafe_patterns = {
        "service-worker unregister": re.compile(r"\.unregister\s*\("),
        "broad cache enumeration": re.compile(r"caches\.keys\s*\("),
    }
    destructive_errors: list[str] = []
    for relative in refresh_surfaces:
        source = read(relative)
        for description, pattern in globally_unsafe_patterns.items():
            if pattern.search(source):
                destructive_errors.append(f"{relative}: {description}")

        # Page fallbacks have no reason to enumerate registrations or delete
        # caches.  The controller is different: it updates legacy nested
        # registrations and deletes only the three explicit user-offline
        # caches during the online/offline transition.
        if relative != CURRENT_CONTROLLER:
            if re.search(r"getRegistrations\s*\(", source):
                destructive_errors.append(f"{relative}: all-registration enumeration")
            if re.search(r"caches\.delete\s*\(", source):
                destructive_errors.append(f"{relative}: direct cache deletion")

    controller_source = read(CURRENT_CONTROLLER)
    controller_cache_deletes = re.findall(
        r"caches\.delete\s*\(([^)]+)\)", controller_source
    )
    if controller_cache_deletes != ["name", "OFFLINE_CACHE_NAMES[2]"]:
        destructive_errors.append(
            f"{CURRENT_CONTROLLER}: unexpected cache deletion targets "
            f"{controller_cache_deletes!r}"
        )
    if "OFFLINE_CACHE_NAMES.map(name => caches.delete(name))" not in controller_source:
        destructive_errors.append(
            f"{CURRENT_CONTROLLER}: offline allow-list cache deletion contract missing"
        )
    if re.search(r"registration\s*\.\s*unregister\s*\(", controller_source):
        destructive_errors.append(f"{CURRENT_CONTROLLER}: registration.unregister")
    check(not destructive_errors, "refresh/navigation surfaces contain no destructive cache reset", destructive_errors)

    offline_manifest_source = read("assets/js/market-base-offline-manifest-v335.js")
    try:
        offline_manifest = parse_offline_manifest(offline_manifest_source)
    except (ValueError, json.JSONDecodeError) as error:
        offline_manifest = {}
        failures.append(f"offline manifest could not be parsed: {error}")
    check(
        offline_manifest.get("version")
        == "MARKET_BASE_OFFLINE_MANIFEST_V333_17_CACHE_COHERENCE_SMOOTH_NAVIGATION_20260810"
        and offline_manifest.get("buildId") == BUILD_ID
        and offline_manifest.get("assetVersion") == TOKEN,
        "offline manifest metadata matches V333.17",
    )
    offline_assets = list(offline_manifest.get("textAssets", []))
    required_offline = [f"./{asset}" for asset in current_assets]
    missing_offline = [asset for asset in required_offline if asset not in offline_assets]
    check(not missing_offline, "offline manifest includes every V333.17 asset", missing_offline)

    obsolete_patterns = [
        re.compile(r"^\./assets/js/app-v273-country-profile-r28-refresh-route-header-r(?:95|96|97)\.js$"),
        re.compile(r"^\./assets/js/market-base-pc-unified-shell-r95-v1\.js$"),
        re.compile(r"^\./assets/js/market-base-update-controller-v(?:322|331|332|333|334)\.js$"),
        re.compile(r"^\./assets/js/market-base-radio-dock-v(?:323|330|331|332)\.js$"),
        re.compile(r"^\./assets/css/market-base-radio-dock-v323\.css$"),
        re.compile(r"^\./assets/js/market-base-tool-dock-"),
        re.compile(r"^\./assets/css/market-base-dual-dock-v(?:330|332)\.css$"),
    ]
    obsolete_offline = [
        str(asset)
        for asset in offline_assets
        if any(pattern.search(str(asset)) for pattern in obsolete_patterns)
    ]
    check(
        not obsolete_offline,
        "offline manifest omits old app/shell/controller/dock generations",
        obsolete_offline,
    )

    compatibility_groups = [
        (
            "assets/js/market-base-build-v335.js",
            "assets/js/market-base-build-v334.js",
            "assets/js/market-base-build.js",
        ),
        (
            "assets/js/market-base-runtime-v335.js",
            "assets/js/market-base-runtime-v334.js",
            "assets/js/market-base-runtime-r11348.js",
        ),
        (
            "assets/js/market-base-scroll-controls-v334.js",
            "assets/js/market-base-scroll-controls-r11328.js",
        ),
        (
            "assets/js/market-base-offline-manifest-v335.js",
            "assets/js/market-base-offline-manifest-v334.js",
            "assets/js/market-base-offline-manifest-v324.js",
        ),
        (
            "settings/assets/offline-settings-v335.js",
            "settings/assets/offline-settings-v334.js",
            "settings/assets/offline-settings.js",
        ),
    ]
    compatibility_errors: list[str] = []
    for group in compatibility_groups:
        missing = [relative for relative in group if not (ROOT / relative).is_file()]
        if missing:
            compatibility_errors.append(f"missing compatibility alias: {missing!r}")
            continue
        payloads = [(ROOT / relative).read_bytes() for relative in group]
        if any(payload != payloads[0] for payload in payloads[1:]):
            compatibility_errors.append(f"compatibility copies differ: {', '.join(group)}")
    check(not compatibility_errors, "compatibility aliases are byte-identical", compatibility_errors)

    syntax_targets = [
        "sw.js",
        CURRENT_APP,
        CURRENT_NAVIGATION,
        CURRENT_DEFERRED,
        CURRENT_SHELL,
        CURRENT_CONTROLLER,
    ]
    syntax_errors: list[str] = []
    for relative in syntax_targets:
        result = subprocess.run(
            ["node", "--check", str(ROOT / relative)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode:
            detail = (result.stderr or result.stdout).strip().splitlines()
            syntax_errors.append(f"{relative}: {detail[-1] if detail else 'node --check failed'}")
    check(not syntax_errors, "current Service Worker and JavaScript pass node --check", syntax_errors)

    print("\nSUMMARY")
    print(f"HTML pages: {len(html_files)}")
    print(f"Controller pages: {len(controller_pages)}")
    print(f"SW references: {len(set(required + core))}")
    print(f"Offline text assets: {len(offline_assets)}")
    if failures:
        print(f"FAILED: {len(failures)} issue(s)")
        for failure in failures:
            print(f" - {failure}")
        return 1
    print("PASSED: V333.17 release integrity")
    return 0


if __name__ == "__main__":
    sys.exit(main())
