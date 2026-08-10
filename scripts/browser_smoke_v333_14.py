#!/usr/bin/env python3
"""Headless Chromium smoke test for MARKET BASE V333.14 refresh/cache behavior."""
from __future__ import annotations

import json
import os
import sys
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

os.environ.setdefault("TERM", "xterm")

ROOT = Path(__file__).resolve().parents[1]
BUILD_ID = "MARKET_BASE_V333_14_CACHE_REFRESH_STABILIZATION_20260804"
TOKEN = "20260804-v333-14-cache-refresh-stabilization"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format: str, *_args: object) -> None:
        return

    def end_headers(self) -> None:
        # Keep the local smoke test deterministic and cache-safe.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def start_server() -> tuple[ThreadingHTTPServer, str]:
    handler = partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address
    return server, f"http://{host}:{port}/"


def wait_for_controller(page: Page, timeout_ms: int = 12_000) -> dict[str, Any]:
    page.wait_for_function(
        """() => window.MarketBaseUpdate &&
          window.MarketBaseUpdate.controllerRevision === 'v334'""",
        timeout=timeout_ms,
    )
    return page.evaluate(
        """() => ({
          buildId: window.MarketBaseUpdate.buildId,
          revision: window.MarketBaseUpdate.controllerRevision,
          meta: document.querySelector('meta[name="market-base-build"]')?.content || '',
          controllerScripts: [...document.scripts]
            .filter(s => s.src.includes('market-base-update-controller')).map(s => s.src),
          scrollScripts: [...document.scripts]
            .filter(s => s.src.includes('market-base-scroll-controls')).map(s => s.src)
        })"""
    )


def wait_for_current_worker(page: Page, timeout_s: float = 14.0) -> list[dict[str, Any]]:
    deadline = time.monotonic() + timeout_s
    last: list[dict[str, Any]] = []
    while time.monotonic() < deadline:
        last = page.evaluate(
            """async () => (await navigator.serviceWorker.getRegistrations()).map(reg => ({
              scope: reg.scope,
              active: reg.active?.scriptURL || '',
              activeState: reg.active?.state || '',
              waiting: reg.waiting?.scriptURL || '',
              installing: reg.installing?.scriptURL || ''
            }))"""
        )
        if any(
            item.get("activeState") == "activated"
            and f"v={BUILD_ID}" in item.get("active", "")
            for item in last
        ):
            return last
        time.sleep(0.15)
    raise AssertionError(f"current Service Worker did not activate: {last}")


def install_local_failure_capture(context: BrowserContext, base: str) -> list[str]:
    failures: list[str] = []

    def on_response(response: Any) -> None:
        if response.url.startswith(base) and response.status >= 400:
            failures.append(f"HTTP {response.status}: {response.url}")

    def on_failed(request: Any) -> None:
        if request.url.startswith(base):
            reason = str(request.failure or "")
            # Page-to-page smoke navigation intentionally cancels late data requests.
            if "ERR_ABORTED" in reason:
                return
            failures.append(f"FAILED: {request.url} ({reason})")

    context.on("response", on_response)
    context.on("requestfailed", on_failed)
    return failures


def assert_controller_state(path: str, state: dict[str, Any], expect_scroll: bool | None = None) -> None:
    assert state["buildId"] == BUILD_ID, f"{path}: wrong controller build {state}"
    assert state["revision"] == "v334", f"{path}: wrong controller revision {state}"
    assert state["meta"] == BUILD_ID, f"{path}: wrong shell meta {state}"
    assert len(state["controllerScripts"]) == 1, f"{path}: competing controllers {state['controllerScripts']}"
    assert "market-base-update-controller-v334.js" in state["controllerScripts"][0]
    assert TOKEN in state["controllerScripts"][0]
    if expect_scroll is True:
        assert len(state["scrollScripts"]) == 1, f"{path}: missing/duplicate scroll script"
        assert "market-base-scroll-controls-v334.js" in state["scrollScripts"][0]
        assert TOKEN in state["scrollScripts"][0]
    if expect_scroll is False:
        assert not state["scrollScripts"], f"{path}: unexpected scroll script"


def run_smoke(browser: Browser, base: str) -> dict[str, Any]:
    results: dict[str, Any] = {"base": base, "pages": {}}
    context = browser.new_context()
    local_failures = install_local_failure_capture(context, base)

    # External analytics/images are not needed for this local functional test.
    def route_handler(route: Any) -> None:
        if route.request.url.startswith(base):
            route.continue_()
        else:
            route.abort()

    context.route("**/*", route_handler)
    page = context.new_page()
    page_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))

    page.goto(base + "index.html", wait_until="domcontentloaded", timeout=30_000)
    state = wait_for_controller(page)
    assert_controller_state("index.html", state, expect_scroll=True)
    results["pages"]["index.html"] = state

    registrations = wait_for_current_worker(page)
    results["serviceWorkers"] = registrations
    cache_state = page.evaluate(
        """async () => {
          const names = await caches.keys();
          const details = {};
          for (const name of names) {
            const cache = await caches.open(name);
            details[name] = (await cache.keys()).map(req => req.url);
          }
          return { names, details };
        }"""
    )
    current_cache = f"market-base-{BUILD_ID}"
    assert current_cache in cache_state["names"], cache_state
    assert not any(name.startswith("market-base-") and name != current_cache for name in cache_state["names"]), cache_state
    results["cacheAfterInstall"] = {
        "names": cache_state["names"],
        "currentEntries": len(cache_state["details"].get(current_cache, [])),
        "currentUrls": cache_state["details"].get(current_cache, []),
    }

    started = time.monotonic()
    with page.expect_navigation(wait_until="domcontentloaded", timeout=20_000):
        page.locator("#cacheRefreshBtn").click()
    elapsed = time.monotonic() - started
    refreshed = wait_for_controller(page)
    assert_controller_state("index.html after manual refresh", refreshed, expect_scroll=True)
    page.wait_for_function(
        """() => {
          const button = document.querySelector('#cacheRefreshBtn');
          return button && button.textContent.trim() === '更新' && !button.disabled;
        }""",
        timeout=8_000,
    )
    clean_url = page.url
    assert "refresh=" not in clean_url and "autoRefresh=" not in clean_url and "?v=" not in clean_url, clean_url
    results["manualRefresh"] = {
        "elapsedSeconds": round(elapsed, 3),
        "finalUrl": clean_url,
        "buttonText": page.locator("#cacheRefreshBtn").inner_text(),
        "buttonDisabled": page.locator("#cacheRefreshBtn").is_disabled(),
    }

    for path, expect_scroll in [
        ("market-base-currency-converter-v273-r29.html", True),
        ("international-logistics/guide.html", True),
        ("ul-ce-learning/index.html", True),
        ("settings/index.html", False),
    ]:
        page.goto(base + path, wait_until="domcontentloaded", timeout=30_000)
        state = wait_for_controller(page)
        assert_controller_state(path, state, expect_scroll=expect_scroll)
        results["pages"][path] = state

    # Player is intentionally isolated so radio playback is not interrupted by global reloads.
    page.goto(base + "world-radio/player.html", wait_until="domcontentloaded", timeout=30_000)
    player_state = page.evaluate(
        """() => ({
          hasController: !!window.MarketBaseUpdate,
          meta: document.querySelector('meta[name="market-base-build"]')?.content || '',
          controllerScripts: [...document.scripts].filter(s => s.src.includes('market-base-update-controller')).length
        })"""
    )
    assert player_state["hasController"] is False, player_state
    assert player_state["controllerScripts"] == 0, player_state
    assert player_state["meta"] == BUILD_ID, player_state
    results["pages"]["world-radio/player.html"] = player_state

    results["localFailures"] = sorted(set(local_failures))
    results["pageErrors"] = sorted(set(page_errors))
    assert not local_failures, local_failures
    assert not page_errors, page_errors
    context.close()

    # Verify that a current controller can recover an HTML shell whose metadata is stale.
    recovery_context = browser.new_context()
    recovery_failures = install_local_failure_capture(recovery_context, base)
    recovery_context.route("**/*", route_handler)
    recovery = recovery_context.new_page()
    recovery_errors: list[str] = []
    recovery.on("pageerror", lambda error: recovery_errors.append(str(error)))
    recovery.goto(base + "news.html", wait_until="domcontentloaded", timeout=30_000)
    before = wait_for_controller(recovery)
    assert_controller_state("news.html before shell recovery", before, expect_scroll=True)
    recovery.evaluate(
        """() => {
          document.querySelector('meta[name="market-base-build"]').content = 'MARKET_BASE_STALE_SHELL';
        }"""
    )
    with recovery.expect_navigation(wait_until="domcontentloaded", timeout=20_000):
        recovery.evaluate("() => setTimeout(() => window.MarketBaseUpdate.checkOnOpen(), 0)")
    after = wait_for_controller(recovery)
    assert_controller_state("news.html after shell recovery", after, expect_scroll=True)
    recovery.wait_for_function(
        """() => !location.search.includes('autoRefresh=') &&
          document.querySelector('meta[name="market-base-build"]')?.content.includes('V333_14')""",
        timeout=8_000,
    )
    results["staleShellRecovery"] = {
        "beforeMeta": "MARKET_BASE_STALE_SHELL",
        "afterMeta": after["meta"],
        "finalUrl": recovery.url,
    }
    assert not recovery_failures, recovery_failures
    assert not recovery_errors, recovery_errors
    recovery_context.close()
    return results


def main() -> int:
    server, base = start_server()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path="/usr/bin/chromium",
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            try:
                results = run_smoke(browser, base)
            finally:
                browser.close()
        print(json.dumps(results, ensure_ascii=False, indent=2))
        print("PASSED: V333.14 headless browser smoke test")
        return 0
    except Exception as error:
        print(f"FAILED: {error}", file=sys.stderr)
        return 1
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    sys.exit(main())
