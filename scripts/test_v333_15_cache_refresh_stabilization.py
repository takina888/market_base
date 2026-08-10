#!/usr/bin/env python3
"""Static regression audit for MARKET BASE V333.15 cache/refresh stabilization."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
BUILD_ID = "MARKET_BASE_V333_15_COUNTRY_DISTINCTIVE_FACTS_20260809"
TOKEN = "20260809-v333-15-country-distinctive-facts"
EXPECTED_HTML = 38
EXPECTED_CONTROLLER_PAGES = 37
EXPECTED_SCROLL_PAGES = 32


class HeadAssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, list[str]] = {}
        self.scripts: list[str] = []
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {str(k).lower(): (v or "") for k, v in attrs}
        if tag.lower() == "meta" and data.get("name"):
            self.meta.setdefault(data["name"].lower(), []).append(data.get("content", ""))
        elif tag.lower() == "script" and data.get("src"):
            self.scripts.append(data["src"])
        elif tag.lower() == "link" and data.get("href"):
            self.links.append(data["href"])


def check(condition: bool, message: str, failures: list[str]) -> None:
    if condition:
        print(f"PASS  {message}")
    else:
        print(f"FAIL  {message}")
        failures.append(message)


def version_query(url: str) -> str:
    return parse_qs(urlparse(url).query).get("v", [""])[0]


def path_ends(url: str, suffix: str) -> bool:
    return urlparse(url).path.endswith(suffix)


def extract_required(sw_text: str) -> list[str]:
    match = re.search(r"const REQUIRED=\[(.*?)\];\s*const CORE=", sw_text, re.S)
    if not match:
        return []
    return re.findall(r'["\']([^"\']+)["\']', match.group(1))


def local_path_from_sw(item: str) -> Path | None:
    parsed = urlparse(item)
    if parsed.scheme or parsed.netloc:
        return None
    path = parsed.path
    if path in {"", ".", "./", "/"}:
        path = "index.html"
    path = path.lstrip("./")
    return ROOT / path


def main() -> int:
    failures: list[str] = []
    html_files = sorted(ROOT.rglob("*.html"))
    check(len(html_files) == EXPECTED_HTML, f"HTML pages = {EXPECTED_HTML}", failures)

    controller_pages: list[str] = []
    scroll_pages: list[str] = []
    stale_refs: list[str] = []
    bad_build_meta: list[str] = []
    bad_site_meta: list[str] = []
    duplicate_controller_refs: list[str] = []

    for page in html_files:
        rel = page.relative_to(ROOT).as_posix()
        text = page.read_text(encoding="utf-8")
        parser = HeadAssetParser()
        parser.feed(text)
        builds = parser.meta.get("market-base-build", [])
        if builds != [BUILD_ID]:
            bad_build_meta.append(f"{rel}: {builds}")
        site_builds = parser.meta.get("market-base-site-build", [])
        if site_builds and any(item != BUILD_ID for item in site_builds):
            bad_site_meta.append(f"{rel}: {site_builds}")

        controllers = [src for src in parser.scripts if "market-base-update-controller" in src]
        if len(controllers) > 1:
            duplicate_controller_refs.append(f"{rel}: {controllers}")
        if controllers:
            controller_pages.append(rel)
            controller = controllers[0]
            if not path_ends(controller, "assets/js/market-base-update-controller-v335.js"):
                stale_refs.append(f"{rel}: controller={controller}")
            if version_query(controller) != TOKEN:
                stale_refs.append(f"{rel}: controller token={controller}")

        scrolls = [src for src in parser.scripts if "market-base-scroll-controls" in src]
        if scrolls:
            scroll_pages.append(rel)
            if len(scrolls) != 1:
                stale_refs.append(f"{rel}: scroll count={len(scrolls)}")
            for scroll in scrolls:
                if not path_ends(scroll, "assets/js/market-base-scroll-controls-v334.js"):
                    stale_refs.append(f"{rel}: scroll={scroll}")
                if version_query(scroll) != TOKEN:
                    stale_refs.append(f"{rel}: scroll token={scroll}")

        if "20260803-v333-7-2-work-code-controls" in text:
            stale_refs.append(f"{rel}: stale V333.7.2 token")
        if "20260804-v333-13-ul-qa-official-faq-revision" in text:
            stale_refs.append(f"{rel}: stale V333.13 token")

    check(not bad_build_meta, "all HTML market-base-build metadata is V333.15", failures)
    if bad_build_meta:
        failures.extend(bad_build_meta)
    check(not bad_site_meta, "all optional market-base-site-build metadata is V333.15", failures)
    if bad_site_meta:
        failures.extend(bad_site_meta)
    check(len(controller_pages) == EXPECTED_CONTROLLER_PAGES,
          f"controller pages = {EXPECTED_CONTROLLER_PAGES}", failures)
    check("world-radio/player.html" not in controller_pages,
          "radio player intentionally omits global controller", failures)
    check(len(scroll_pages) == EXPECTED_SCROLL_PAGES,
          f"scroll-control pages = {EXPECTED_SCROLL_PAGES}", failures)
    check(not duplicate_controller_refs, "no page has competing controller tags", failures)
    if duplicate_controller_refs:
        failures.extend(duplicate_controller_refs)
    check(not stale_refs, "HTML boot references use only V333.15 physical files/tokens", failures)
    if stale_refs:
        failures.extend(stale_refs)

    version = (ROOT / "version.txt").read_text(encoding="utf-8").strip()
    check(version == BUILD_ID, "version.txt matches V333.15 build ID", failures)

    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    check(manifest.get("version") == "V333.15", "manifest version is V333.15", failures)
    check(manifest.get("build_id") == BUILD_ID, "manifest build_id matches version.txt", failures)
    check(TOKEN in manifest.get("start_url", "") and TOKEN in manifest.get("id", ""),
          "manifest start_url and id use V333.15 token", failures)

    canonical = {
        "assets/js/market-base-build-v335.js": [BUILD_ID, TOKEN],
        "assets/js/market-base-runtime-v335.js": [BUILD_ID],
        "assets/js/market-base-scroll-controls-v334.js": [TOKEN, "scheduleUpdateControllerFallback();"],
        "assets/js/market-base-update-controller-v335.js": [BUILD_ID, "controllerRevision: 'v335'", "pageShellIsCurrent", "AUTO_REFRESH_STATE_KEY"],
        "assets/js/market-base-offline-manifest-v335.js": ["MARKET_BASE_OFFLINE_MANIFEST_V333_15_COUNTRY_DISTINCTIVE_FACTS_20260809"],
        "settings/assets/offline-settings-v335.js": [BUILD_ID],
    }
    for rel, needles in canonical.items():
        path = ROOT / rel
        check(path.exists(), f"canonical file exists: {rel}", failures)
        if path.exists():
            text = path.read_text(encoding="utf-8")
            for needle in needles:
                check(needle in text, f"{rel} contains {needle}", failures)

    runtime = (ROOT / "assets/js/market-base-runtime-v335.js").read_text(encoding="utf-8")
    check("serviceWorker.register" not in runtime,
          "shared runtime no longer competes for root Service Worker", failures)

    scroll = (ROOT / "assets/js/market-base-scroll-controls-v334.js").read_text(encoding="utf-8")
    check("DOMContentLoaded',loadUpdateController" in scroll,
          "scroll fallback waits for DOMContentLoaded", failures)
    check("loadUpdateController();" not in scroll,
          "scroll script has no immediate parser-time controller injection", failures)

    controller = (ROOT / "assets/js/market-base-update-controller-v335.js").read_text(encoding="utf-8")
    for needle in [
        "VISIBLE_WORKER_WAIT_MS = 1200",
        "global.addEventListener('pageshow', finishRefreshUi)",
        "Number(previous.attempts || 0) >= 2",
        "url.searchParams.delete('refresh')",
        "rootRegistration.update()",
    ]:
        check(needle in controller, f"controller recovery guard present: {needle}", failures)

    offline_settings = (ROOT / "settings/assets/offline-settings-v335.js").read_text(encoding="utf-8")
    check("MARKET_BASE_V325" not in offline_settings,
          "offline settings no longer hard-code V325", failures)
    check("navigator.serviceWorker.register(swUrl.href" in offline_settings,
          "offline settings register the computed current worker URL", failures)

    compatibility_pairs = [
        ("assets/js/market-base-build.js", "assets/js/market-base-build-v335.js"),
        ("assets/js/market-base-runtime-r11348.js", "assets/js/market-base-runtime-v335.js"),
        ("assets/js/market-base-scroll-controls-r11328.js", "assets/js/market-base-scroll-controls-v334.js"),
        ("assets/js/market-base-offline-manifest-v324.js", "assets/js/market-base-offline-manifest-v335.js"),
        ("settings/assets/offline-settings.js", "settings/assets/offline-settings-v335.js"),
    ]
    for legacy, current in compatibility_pairs:
        check((ROOT / legacy).read_bytes() == (ROOT / current).read_bytes(),
              f"legacy compatibility copy matches {current}", failures)

    for legacy in [
        "assets/js/market-base-update-controller-v322.js",
        "assets/js/market-base-update-controller-v331.js",
        "assets/js/market-base-update-controller-v332.js",
        "assets/js/market-base-update-controller-v333.js",
        "assets/js/market-base-update-controller-v334.js",
    ]:
        text = (ROOT / legacy).read_text(encoding="utf-8")
        check("market-base-update-controller-v335.js" in text and TOKEN in text,
              f"legacy controller shim migrates to V333.15: {legacy}", failures)

    sw_path = ROOT / "sw.js"
    sw = sw_path.read_text(encoding="utf-8")
    check(f"const BUILD_ID='{BUILD_ID}'" in sw, "Service Worker build ID is V333.15", failures)
    check("market-base-offline-manifest-v335.js" in sw and TOKEN in sw.splitlines()[1],
          "Service Worker imports the new physical offline manifest", failures)
    check("REQUIRED.slice(0,9)" in sw,
          "Service Worker installation blocks on only nine shell requests", failures)
    required = extract_required(sw)
    install_required = required[:9]
    check(len(install_required) == 9, "nine install-blocking requests parsed", failures)
    check(not any("embedded-cross-db-search-index" in item or "flight-kitchen" in item for item in install_required),
          "large search/flight databases are not install-blocking", failures)
    transfer_bytes = 0
    missing_required: list[str] = []
    for item in install_required:
        local = local_path_from_sw(item)
        if local is None:
            continue
        if not local.exists():
            missing_required.append(item)
        else:
            transfer_bytes += local.stat().st_size
    check(not missing_required, "all install-blocking shell files exist", failures)
    if missing_required:
        failures.extend(f"missing required: {item}" for item in missing_required)
    check(transfer_bytes < 300_000,
          f"install-blocking payload is lightweight ({transfer_bytes:,} bytes)", failures)

    deployable_suffixes = {".html", ".js", ".css", ".json", ".webmanifest"}
    stale_deployable: list[str] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in deployable_suffixes:
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith("HANDOFF_DOCUMENTS/") or Path(rel).name.startswith("HANDOFF_"):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if "20260803-v333-7-2-work-code-controls" in text or "20260804-v333-13-ul-qa-official-faq-revision" in text:
            stale_deployable.append(rel)
    check(not stale_deployable, "no prior release token remains in deployable shell files", failures)
    if stale_deployable:
        failures.extend(stale_deployable)

    js_to_check = [ROOT / rel for rel in canonical if rel.endswith(".js")]
    js_to_check += [ROOT / "sw.js"]
    js_to_check += [ROOT / legacy for legacy, _ in compatibility_pairs if legacy.endswith(".js")]
    js_to_check += [ROOT / f"assets/js/market-base-update-controller-v{version}.js" for version in (322, 331, 332, 333, 334)]
    syntax_errors: list[str] = []
    for path in dict.fromkeys(js_to_check):
        result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
        if result.returncode:
            syntax_errors.append(f"{path.relative_to(ROOT)}: {result.stderr.strip()}")
    check(not syntax_errors, "modified JavaScript passes node --check", failures)
    if syntax_errors:
        failures.extend(syntax_errors)

    print("\nSUMMARY")
    print(f"HTML pages: {len(html_files)}")
    print(f"Controller pages: {len(controller_pages)}")
    print(f"Scroll-control pages: {len(scroll_pages)}")
    print(f"Install-blocking transfer: {transfer_bytes:,} bytes")
    if failures:
        print(f"FAILED: {len(failures)} issue(s)")
        for failure in failures:
            print(f" - {failure}")
        return 1
    print("PASSED: V333.15 cache/refresh static audit")
    return 0


if __name__ == "__main__":
    sys.exit(main())
