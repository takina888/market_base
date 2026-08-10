#!/usr/bin/env python3
"""Contract checks for V333.19 Samsung Internet install guidance.

The PWA id deliberately keeps the V333.10 production value.  It is an app
identity, not a release cache token, and changing it would create a second PWA
instead of updating the installed production app.
"""

from __future__ import annotations

import json
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOKEN = "20260810-v333-19-android-install-stability"
BUILD_ID = "MARKET_BASE_V333_19_ANDROID_INSTALL_STABILITY_20260810"
PRODUCTION_PWA_ID = "./?v=20260803-v333-10-cloudflare-web-analytics"
HELPER_JS = "assets/js/market-base-install-helper-v333-19.js"
HELPER_CSS = "assets/css/market-base-install-helper-v333-19.css"
SHORTCUT = "install/samsung-shortcut.htm"
ANDROID_APK = "downloads/android/MARKET_BASE_V333_19_ANDROID_API36_RELEASE_20260810.apk"


class TagCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tags: list[tuple[str, dict[str, str]]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.tags.append((tag.lower(), {key.lower(): value or "" for key, value in attrs}))


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def check(condition: bool, message: str, errors: list[str]) -> None:
    print(f"{'PASS' if condition else 'FAIL'}  {message}")
    if not condition:
        errors.append(message)


def main() -> int:
    errors: list[str] = []

    manifest = json.loads(read("manifest.json"))
    check(manifest.get("id") == PRODUCTION_PWA_ID,
          "PWA id preserves the deployed V333.10 app identity", errors)
    check(manifest.get("version") == "V333.19", "manifest version is V333.19", errors)
    check(manifest.get("build_id") == BUILD_ID, "manifest build id is V333.19", errors)
    check(TOKEN in str(manifest.get("start_url", "")),
          "manifest start_url uses the V333.19 release token", errors)
    check(TOKEN not in str(manifest.get("id", "")),
          "PWA id is independent from the V333.19 release token", errors)

    index = read("index.html")
    parser = TagCollector()
    parser.feed(index)
    android_meta = [
        attrs.get("content", "")
        for tag, attrs in parser.tags
        if tag == "meta" and attrs.get("name") == "market-base-android-package-url"
    ]
    check(android_meta == [ANDROID_APK] and (ROOT / ANDROID_APK).is_file(),
          "official signed Android package URL is configured and present", errors)
    check(index.count(HELPER_CSS) == 1, "index loads helper CSS exactly once", errors)
    check(index.count(HELPER_JS) == 1, "index loads helper JavaScript exactly once", errors)
    check(
        index.find(HELPER_JS) < index.find("market-base-update-controller-v335.js"),
        "helper loads before the final update controller",
        errors,
    )

    helper = read(HELPER_JS)
    check("/SamsungBrowser\\//i" in helper,
          "helper targets Samsung Internet by its SamsungBrowser user agent", errors)
    check("window.addEventListener('beforeinstallprompt'" in helper,
          "helper observes Samsung beforeinstallprompt", errors)
    check("event.preventDefault();" in helper,
          "Samsung beforeinstallprompt is not automatically launched", errors)
    check(".prompt(" not in helper,
          "helper never calls the browser WebAPK prompt", errors)
    check("if (!isSamsungInternet) return;" in helper,
          "non-Samsung browsers keep their normal install behavior", errors)
    check("if (packageUrl)" in helper and "packageAction.hidden = false" in helper,
          "official package action appears only after an HTTPS URL is configured", errors)
    check("url.protocol === 'https:'" in helper and "/^(https?):$/" not in helper,
          "official Android package configuration rejects HTTP URLs", errors)
    check("data-mb-install-action=\"android-package\" hidden" in helper,
          "helper remains fail-closed if a future package URL is missing", errors)
    check("data-mb-android-install-steps hidden" in helper and
          "packageSteps.hidden = false" in helper,
          "signed APK settings guidance appears only with an official package", errors)
    check("この提供元を許可" in helper and "不明なアプリをインストール" in helper and
          "允許此來源" in helper,
          "Samsung source-permission steps cover Japanese and Traditional Chinese labels", errors)
    check("Google Play Protectは無効にしないでください" in helper,
          "guidance keeps Google Play Protect enabled", errors)
    check("packageAction.download = 'MARKET_BASE_V333_19_ANDROID_API36_RELEASE_20260810.apk'" in helper,
          "official APK action provides a stable download filename", errors)
    check("data-mb-install-action=\"samsung-shortcut\"" in helper and SHORTCUT in helper,
          "Samsung shortcut fallback is wired", errors)
    check("data-mb-install-action=\"chrome\"" in helper and "package=com.android.chrome" in helper,
          "Chrome PWA fallback is wired", errors)
    check("完全には非表示にできません" in helper,
          "copy does not claim control over Samsung's own install icon", errors)
    check("window.MarketBaseInstallHelp" in helper and "open: showDialog" in helper,
          "install guidance can be reopened by the app", errors)

    shortcut = read(SHORTCUT)
    shortcut_parser = TagCollector()
    shortcut_parser.feed(shortcut)
    manifest_links = [
        attrs
        for tag, attrs in shortcut_parser.tags
        if tag == "link" and attrs.get("rel", "").lower() == "manifest"
    ]
    check(not manifest_links,
          "Samsung shortcut page intentionally has no PWA manifest", errors)
    check("#open-market-base" in shortcut and "window.location.replace('../index.html?from=samsung-shortcut')" in shortcut,
          "home-screen shortcut redirects to MARKET BASE on later launches", errors)
    check(not (ROOT / "install/samsung-shortcut.html").exists(),
          "there is only one canonical Samsung shortcut page", errors)

    node_check = subprocess.run(
        ["node", "--check", str(ROOT / HELPER_JS)],
        capture_output=True,
        text=True,
        check=False,
    )
    check(node_check.returncode == 0,
          f"helper JavaScript syntax is valid{': ' + node_check.stderr.strip() if node_check.stderr else ''}",
          errors)

    if errors:
        print(f"\n{len(errors)} failure(s)")
        return 1
    print("\nSamsung Internet install-helper contract: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
