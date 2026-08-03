#!/usr/bin/env python3
import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD_ID = "MARKET_BASE_V333_10_CLOUDFLARE_WEB_ANALYTICS_20260803"
ASSET_VERSION = "20260803-v333-10-cloudflare-web-analytics"
TOKEN = "8cd800af9e2541f2ba41adb0d3c46a75"
BEACON_URL = "https://static.cloudflareinsights.com/beacon.min.js"
BLOCK_PATTERN = re.compile(
    r"<!-- Cloudflare Web Analytics --><script type=\"module\" "
    r"src=\"https://static\.cloudflareinsights\.com/beacon\.min\.js\" "
    r"data-cf-beacon='\{\"token\":\"8cd800af9e2541f2ba41adb0d3c46a75\"\}'></script>"
    r"<!-- End Cloudflare Web Analytics -->"
)
errors = []


def check(condition, message):
    if not condition:
        errors.append(message)


def read(relative):
    return (ROOT / relative).read_text(encoding="utf-8")


catering_test = subprocess.run(
    [sys.executable, str(ROOT / "scripts/test_v333_9_catering_external_source.py")],
    capture_output=True,
    text=True,
)
check(catering_test.returncode == 0, f"catering/JFM regression failed: {catering_test.stdout}{catering_test.stderr}")

manifest = json.loads(read("manifest.json"))
check(read("version.txt").strip() == BUILD_ID, "version.txt build ID mismatch")
check(manifest.get("version") == "V333.10", "manifest version mismatch")
check(manifest.get("build_id") == BUILD_ID, "manifest build ID mismatch")
check(ASSET_VERSION in manifest.get("start_url", ""), "manifest start URL cache-buster mismatch")

html_files = sorted(ROOT.rglob("*.html"))
check(len(html_files) == 38, f"public HTML count changed: {len(html_files)}")
for html_file in html_files:
    relative = html_file.relative_to(ROOT).as_posix()
    html = html_file.read_text(encoding="utf-8")
    blocks = BLOCK_PATTERN.findall(html)
    check(len(blocks) == 1, f"{relative}: expected one canonical analytics block, found {len(blocks)}")
    check(html.count(BEACON_URL) == 1, f"{relative}: beacon URL count mismatch")
    check(html.count(TOKEN) == 1, f"{relative}: analytics token count mismatch")
    block_position = html.find("<!-- Cloudflare Web Analytics -->")
    body_position = html.lower().rfind("</body>")
    check(block_position >= 0 and body_position >= 0 and block_position < body_position, f"{relative}: analytics block is not before closing body")

for relative in [
    "assets/js/market-base-build.js",
    "assets/js/market-base-update-controller-v333.js",
    "sw.js",
    "index.html",
    "offline.html",
]:
    value = read(relative)
    check(BUILD_ID in value, f"{relative}: current build ID missing")

offline_manifest = read("assets/js/market-base-offline-manifest-v324.js")
check("MARKET_BASE_OFFLINE_MANIFEST_V333_10_CLOUDFLARE_WEB_ANALYTICS_20260803" in offline_manifest, "offline manifest version mismatch")
service_worker = read("sw.js")
check("if(!sameOrigin&&event.request.destination!=='image')return;" in service_worker, "external analytics script is no longer bypassed by service worker")

if errors:
    for error in errors:
        print(f"FAIL: {error}")
    sys.exit(1)

print(json.dumps({
    "status": "ok",
    "build_id": BUILD_ID,
    "html_pages": len(html_files),
    "analytics_blocks": sum(BLOCK_PATTERN.search(path.read_text(encoding="utf-8")) is not None for path in html_files),
    "base_release": "V333.8",
    "includes_catering_v333_9": True,
}, ensure_ascii=False))
