#!/usr/bin/env python3
"""Static release audit for MARKET BASE V333.15 country distinctive facts."""
from __future__ import annotations

import hashlib
import json
import re
import runpy
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
BUILD_ID = "MARKET_BASE_V333_15_COUNTRY_DISTINCTIVE_FACTS_20260809"
TOKEN = "20260809-v333-15-country-distinctive-facts"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def embedded_entity_codes() -> list[str]:
    text = read("embedded-data.js")
    prefix = "window.MARKET_BASE_EMBEDDED_DATA = "
    if not text.startswith(prefix):
        raise AssertionError("embedded-data.js assignment format changed")
    data = json.loads(text[len(prefix):].rstrip().rstrip(";"))
    return [row["entity_id"] for row in data["entities"]["entities"]]


def js_object_keys(path: str, global_name: str) -> list[str]:
    script = f"""
      global.window={{}};
      require({json.dumps(str((ROOT / path).resolve()))});
      const value=window[{json.dumps(global_name)}];
      const obj=value?.items || value || {{}};
      process.stdout.write(JSON.stringify(Object.keys(obj)));
    """
    result = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def extract_sw_array(sw: str, name: str) -> list[str]:
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*\[(.*?)\];", sw, re.S)
    if not match:
        return []
    return re.findall(r"['\"]([^'\"]+)['\"]", match.group(1))


def local_path(asset: str) -> Path | None:
    if asset.startswith(("http://", "https://")):
        return None
    clean = asset.split("?", 1)[0].split("#", 1)[0]
    if clean.startswith("./"):
        clean = clean[2:]
    return ROOT / clean


def main() -> int:
    failures: list[str] = []
    details: dict[str, object] = {}

    entity_codes = embedded_entity_codes()
    builder = runpy.run_path(str(ROOT / "scripts/build_country_distinctive_facts_v333_15.py"))
    facts: dict[str, dict[str, str]] = builder["FACTS"]
    profile_codes = js_object_keys(
        "embedded-country-profile-data-v273-r28.js", "MARKET_BASE_COUNTRY_PROFILES"
    )
    fact_codes = js_object_keys(
        "data/country-distinctive-facts-v333-15.js", "MARKET_BASE_COUNTRY_DISTINCTIVE_FACTS"
    )

    require(len(entity_codes) == 196, f"entity master count is {len(entity_codes)}, expected 196", failures)
    require(len(profile_codes) == 196, f"profile count is {len(profile_codes)}, expected 196", failures)
    require(len(fact_codes) == 196, f"distinctive fact count is {len(fact_codes)}, expected 196", failures)
    require(set(entity_codes) == set(profile_codes), "profile keys do not match entity master", failures)
    require(entity_codes == fact_codes, "fact order/keys do not match entity master", failures)
    require(entity_codes == list(facts), "builder fact order/keys do not match entity master", failures)

    malformed: list[str] = []
    unsafe_markup: list[str] = []
    source_domains: dict[str, int] = {}
    title_lengths: list[int] = []
    body_lengths: list[int] = []
    for code in entity_codes:
        fact = facts.get(code, {})
        for field in ("category", "title", "body", "source_name", "source_url"):
            if not isinstance(fact.get(field), str) or not fact[field].strip():
                malformed.append(f"{code}:{field}")
        url = fact.get("source_url", "")
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            malformed.append(f"{code}:source_url")
        else:
            source_domains[parsed.netloc.lower()] = source_domains.get(parsed.netloc.lower(), 0) + 1
        combined = " ".join(str(fact.get(key, "")) for key in ("category", "title", "body", "source_name"))
        if re.search(r"<\/?[a-z][^>]*>|javascript:", combined, re.I):
            unsafe_markup.append(code)
        title_lengths.append(len(fact.get("title", "")))
        body_lengths.append(len(fact.get("body", "")))
    require(not malformed, f"malformed fact fields: {malformed[:20]}", failures)
    require(not unsafe_markup, f"unsafe markup in fact text: {unsafe_markup}", failures)
    require(min(title_lengths, default=0) >= 4, "one or more fact titles are too short", failures)
    require(max(title_lengths, default=0) <= 45, "one or more fact titles are too long", failures)
    require(min(body_lengths, default=0) >= 25, "one or more fact bodies are too short", failures)
    require(max(body_lengths, default=0) <= 230, "one or more fact bodies are too long", failures)

    require(facts["ET"]["title"] == "1年が13か月ある", "Ethiopia title changed", failures)
    require("第13月" in facts["ET"]["body"], "Ethiopia body does not explain the 13th month", failures)
    require("トラック" not in json.dumps(facts["PK"], ensure_ascii=False), "Pakistan still uses truck-art topic", failures)
    require("ウルドゥー語" in facts["PK"]["title"] and "na.gov.pk" in facts["PK"]["source_url"], "Pakistan replacement topic is not the language-system fact", failures)

    index = read("index.html")
    required_index_markers = [
        "assets/css/country-distinctive-facts-v333-15.css",
        "data/country-distinctive-facts-v333-15.js",
        "assets/js/app-v273-country-profile-r28-refresh-route-header-r96.js",
        "assets/js/market-base-build-v335.js",
        "assets/js/market-base-runtime-v335.js",
        "assets/js/market-base-update-controller-v335.js",
    ]
    for marker in required_index_markers:
        require(marker in index, f"index.html is missing {marker}", failures)
    require(
        index.index("embedded-country-profile-data-v273-r28.js")
        < index.index("data/country-distinctive-facts-v333-15.js")
        < index.index("assets/js/app-v273-country-profile-r28-refresh-route-header-r96.js"),
        "country profile/fact/renderer script order is incorrect",
        failures,
    )

    renderer = read("assets/js/app-v273-country-profile-r28-refresh-route-header-r96.js")
    require("function countryDistinctiveFactHtml" in renderer, "renderer helper is missing", failures)
    require("MARKET_BASE_COUNTRY_DISTINCTIVE_FACTS?.items" in renderer, "renderer does not read fact data", failures)
    placement = re.search(
        r'<div class="country-profile-facts">\$\{facts\}</div>\s*\$\{countryDistinctiveFactHtml\(e\)\}\s*\$\{countryBasicStatsHtml\(e\)\}',
        renderer,
    )
    require(bool(placement), "distinctive fact is not placed after profile facts and before basic statistics", failures)
    for marker in (
        'class="country-distinctive-fact"',
        'aria-label="この国ならでは"',
        'rel="noopener noreferrer"',
        'target="_blank"',
        "safe(fact.title",
        "safe(fact.body",
    ):
        require(marker in renderer, f"renderer safety/UI marker missing: {marker}", failures)

    css = read("assets/css/country-distinctive-facts-v333-15.css")
    for marker in (
        "#detailContent .country-distinctive-fact",
        "#detailContent .country-distinctive-fact h4",
        "#detailContent .country-distinctive-fact p",
        "@media(max-width:560px)",
    ):
        require(marker in css, f"distinctive-fact CSS marker missing: {marker}", failures)

    html_files = sorted(ROOT.rglob("*.html"))
    controller_pages: list[str] = []
    stale_controller_pages: list[str] = []
    build_mismatch_pages: list[str] = []
    duplicate_controller_pages: list[str] = []
    for path in html_files:
        rel = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8")
        if BUILD_ID not in text:
            build_mismatch_pages.append(rel)
        refs = re.findall(r'<script[^>]+src=["\']([^"\']*market-base-update-controller[^"\']*)["\']', text)
        if refs:
            controller_pages.append(rel)
            if len(refs) != 1:
                duplicate_controller_pages.append(rel)
            if any("market-base-update-controller-v335.js" not in ref or TOKEN not in ref for ref in refs):
                stale_controller_pages.append(rel)
    require(len(html_files) == 38, f"HTML page count is {len(html_files)}, expected 38", failures)
    require(len(controller_pages) == 37, f"controller page count is {len(controller_pages)}, expected 37", failures)
    require("world-radio/player.html" not in controller_pages, "radio player must stay isolated from global refresh", failures)
    require(not build_mismatch_pages, f"pages with stale build identity: {build_mismatch_pages}", failures)
    require(not stale_controller_pages, f"pages with stale controller reference: {stale_controller_pages}", failures)
    require(not duplicate_controller_pages, f"pages with duplicate controllers: {duplicate_controller_pages}", failures)

    compatibility_pairs = [
        ("assets/js/market-base-build.js", "assets/js/market-base-build-v335.js"),
        ("assets/js/market-base-build-v334.js", "assets/js/market-base-build-v335.js"),
        ("assets/js/market-base-runtime-r11348.js", "assets/js/market-base-runtime-v335.js"),
        ("assets/js/market-base-runtime-v334.js", "assets/js/market-base-runtime-v335.js"),
        ("assets/js/market-base-offline-manifest-v324.js", "assets/js/market-base-offline-manifest-v335.js"),
        ("assets/js/market-base-offline-manifest-v334.js", "assets/js/market-base-offline-manifest-v335.js"),
        ("settings/assets/offline-settings.js", "settings/assets/offline-settings-v335.js"),
        ("settings/assets/offline-settings-v334.js", "settings/assets/offline-settings-v335.js"),
    ]
    for legacy, current in compatibility_pairs:
        require((ROOT / legacy).read_bytes() == (ROOT / current).read_bytes(), f"compatibility copy differs: {legacy}", failures)
    for legacy in (
        "assets/js/market-base-update-controller-v322.js",
        "assets/js/market-base-update-controller-v331.js",
        "assets/js/market-base-update-controller-v332.js",
        "assets/js/market-base-update-controller-v333.js",
        "assets/js/market-base-update-controller-v334.js",
    ):
        text = read(legacy)
        require("market-base-update-controller-v335.js" in text and TOKEN in text, f"legacy controller does not migrate: {legacy}", failures)

    manifest = json.loads(read("manifest.json"))
    require(manifest.get("version") == "V333.15", "manifest version is not V333.15", failures)
    require(manifest.get("build_id") == BUILD_ID, "manifest build ID mismatch", failures)
    require(TOKEN in manifest.get("start_url", ""), "manifest start_url token mismatch", failures)
    require(read("version.txt").strip() == BUILD_ID, "version.txt build ID mismatch", failures)

    sw = read("sw.js")
    require(f"const BUILD_ID='{BUILD_ID}'" in sw, "Service Worker build ID mismatch", failures)
    require("market-base-offline-manifest-v335.js" in sw.splitlines()[1], "Service Worker does not import v335 manifest", failures)
    require("REQUIRED.slice(0,9)" in sw, "Service Worker install-blocking limit changed", failures)
    required_assets = extract_sw_array(sw, "REQUIRED")
    core_assets = extract_sw_array(sw, "CORE")
    for marker in (
        "app-v273-country-profile-r28-refresh-route-header-r96.js",
        "data/country-distinctive-facts-v333-15.js",
        "assets/css/country-distinctive-facts-v333-15.css",
        "market-base-build-v335.js",
        "market-base-update-controller-v335.js",
    ):
        require(any(marker in item for item in required_assets), f"Service Worker REQUIRED misses {marker}", failures)
        require(any(marker in item for item in core_assets), f"Service Worker CORE misses {marker}", failures)
    missing_assets = []
    for item in required_assets + core_assets:
        path = local_path(item)
        if path is not None and not path.exists():
            missing_assets.append(item)
    require(not missing_assets, f"Service Worker references missing files: {missing_assets[:20]}", failures)

    offline_manifest = read("assets/js/market-base-offline-manifest-v335.js")
    for marker in (
        "country-distinctive-facts-v333-15.css",
        "country-distinctive-facts-v333-15.js",
        "app-v273-country-profile-r28-refresh-route-header-r96.js",
        "market-base-build-v335.js",
        "market-base-runtime-v335.js",
        "market-base-update-controller-v335.js",
    ):
        require(marker in offline_manifest, f"offline manifest misses {marker}", failures)

    forbidden_leftovers = [
        "data/country-distinctive-facts-v33315.js",
        "assets/css/country-distinctive-facts-v33315.css",
        "assets/js/app-v273-country-profile-r28-refresh-route-header-r95-v33315.js",
    ]
    for rel in forbidden_leftovers:
        require(not (ROOT / rel).exists(), f"obsolete duplicate release asset remains: {rel}", failures)

    js_paths = [
        "assets/js/app-v273-country-profile-r28-refresh-route-header-r96.js",
        "assets/js/market-base-build-v335.js",
        "assets/js/market-base-runtime-v335.js",
        "assets/js/market-base-update-controller-v335.js",
        "assets/js/market-base-offline-manifest-v335.js",
        "data/country-distinctive-facts-v333-15.js",
        "settings/assets/offline-settings-v335.js",
        "sw.js",
    ] + [pair[0] for pair in compatibility_pairs if pair[0].endswith(".js")] + [
        f"assets/js/market-base-update-controller-v{version}.js" for version in (322, 331, 332, 333, 334)
    ]
    syntax_errors: list[str] = []
    for relative in dict.fromkeys(js_paths):
        result = subprocess.run(["node", "--check", str(ROOT / relative)], capture_output=True, text=True)
        if result.returncode:
            syntax_errors.append(f"{relative}: {result.stderr.strip()}")
    require(not syntax_errors, f"JavaScript syntax errors: {syntax_errors}", failures)

    details.update(
        {
            "status": "FAIL" if failures else "PASS",
            "release": "V333.15",
            "buildId": BUILD_ID,
            "entityCount": len(entity_codes),
            "profileCount": len(profile_codes),
            "factCount": len(fact_codes),
            "htmlPages": len(html_files),
            "controllerPages": len(controller_pages),
            "sourceDomainCount": len(source_domains),
            "mostUsedSourceDomains": sorted(source_domains.items(), key=lambda item: (-item[1], item[0]))[:15],
            "titleLength": {"min": min(title_lengths), "max": max(title_lengths)},
            "bodyLength": {"min": min(body_lengths), "max": max(body_lengths)},
            "dataSha256": sha256(ROOT / "data/country-distinctive-facts-v333-15.js"),
            "rendererSha256": sha256(ROOT / "assets/js/app-v273-country-profile-r28-refresh-route-header-r96.js"),
            "failures": failures,
        }
    )
    print(json.dumps(details, ensure_ascii=False, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
