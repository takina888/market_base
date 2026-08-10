#!/usr/bin/env python3
"""Headless Chromium UI smoke test for V333.15 distinctive country facts.

The managed Chromium in this environment blocks URL navigation. This test therefore
uses Playwright's set_content/add_script_tag/add_style_tag APIs and executes the
actual V333.15 data file, renderer helper functions, and CSS without navigating.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/country-distinctive-facts-v333-15.js"
RENDERER = ROOT / "assets/js/app-v273-country-profile-r28-refresh-route-header-r96.js"
CSS = ROOT / "assets/css/country-distinctive-facts-v333-15.css"


def renderer_helpers() -> str:
    text = RENDERER.read_text(encoding="utf-8")
    safe_line = next((line for line in text.splitlines() if line.startswith("const safe = v =>")), "")
    start = text.index("function countryDistinctiveFactForEntity")
    end = text.index("function countryProfileSourcesHtml", start)
    if not safe_line:
        raise AssertionError("safe() helper not found")
    return safe_line + "\n" + text[start:end]


def prepare_page(page: Page, entity_id: str) -> None:
    page.set_content(
        """<!doctype html><html lang="ja"><head><meta charset="utf-8"></head><body>
        <main id="detailContent">
          <section class="detail-section country-profile-section">
            <div class="country-profile-facts"><div>既存の基本4項目</div></div>
            <div id="factMount"></div>
            <section class="detail-section country-profile-basic-stats" id="country-basic-stats">概要・基本統計</section>
          </section>
        </main>
        </body></html>"""
    )
    page.add_style_tag(path=str(CSS))
    page.add_script_tag(path=str(DATA))
    page.add_script_tag(content=renderer_helpers())
    page.evaluate(
        """entityId => {
          const mount=document.querySelector('#factMount');
          mount.insertAdjacentHTML('beforebegin', countryDistinctiveFactHtml({entity_id:entityId}));
          mount.remove();
        }""",
        entity_id,
    )


def inspect(page: Page) -> dict[str, Any]:
    return page.evaluate(
        """() => {
          const article=document.querySelector('.country-distinctive-fact');
          const facts=document.querySelector('.country-profile-facts');
          const stats=document.querySelector('.country-profile-basic-stats');
          const source=article?.querySelector('.country-distinctive-fact-source');
          const title=article?.querySelector('h4');
          const body=article?.querySelector('p');
          const rect=article?.getBoundingClientRect();
          const parentRect=article?.parentElement?.getBoundingClientRect();
          return {
            heading:article?.querySelector('.country-distinctive-fact-heading > span')?.textContent.trim() || '',
            category:article?.querySelector('.country-distinctive-fact-heading > em')?.textContent.trim() || '',
            title:title?.textContent.trim() || '',
            body:body?.textContent.trim() || '',
            sourceText:source?.textContent.replace(/\\s+/g,' ').trim() || '',
            sourceHref:source?.href || '',
            sourceTarget:source?.target || '',
            sourceRel:source?.rel || '',
            orderAfterFacts:!!(facts && article && (facts.compareDocumentPosition(article) & Node.DOCUMENT_POSITION_FOLLOWING)),
            orderBeforeStats:!!(article && stats && (article.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING)),
            widthRatio:rect && parentRect ? rect.width/parentRect.width : 0,
            leftOverflow:rect ? Math.max(0,-rect.left) : -1,
            rightOverflow:rect ? Math.max(0,rect.right-innerWidth) : -1,
            display:article ? getComputedStyle(article).display : '',
            titleFont:title ? parseFloat(getComputedStyle(title).fontSize) : 0,
            bodyFont:body ? parseFloat(getComputedStyle(body).fontSize) : 0,
            lineHeight:body ? parseFloat(getComputedStyle(body).lineHeight) : 0
          };
        }"""
    )


def assert_common(result: dict[str, Any]) -> None:
    assert result["heading"] == "この国ならでは", result
    assert result["sourceTarget"] == "_blank", result
    assert "noopener" in result["sourceRel"] and "noreferrer" in result["sourceRel"], result
    assert result["orderAfterFacts"] and result["orderBeforeStats"], result
    assert result["widthRatio"] > 0.95, result
    assert result["leftOverflow"] == 0 and result["rightOverflow"] == 0, result
    assert result["display"] == "grid", result
    assert result["titleFont"] >= 20 and result["bodyFont"] >= 16, result
    assert result["lineHeight"] > result["bodyFont"] * 1.6, result


def run_context(browser: Browser, viewport: dict[str, int], entity_id: str) -> dict[str, Any]:
    context: BrowserContext = browser.new_context(viewport=viewport)
    page = context.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    prepare_page(page, entity_id)
    result = inspect(page)
    assert_common(result)
    assert not errors, errors
    context.close()
    return result


def main() -> int:
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path="/usr/bin/chromium",
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            try:
                desktop = run_context(browser, {"width": 1280, "height": 900}, "ET")
                assert desktop["category"] == "暦・時間", desktop
                assert desktop["title"] == "1年が13か月ある", desktop
                assert "第13月" in desktop["body"], desktop

                mobile = run_context(browser, {"width": 390, "height": 844}, "PK")
                assert mobile["category"] == "言語・制度", mobile
                assert "ウルドゥー語" in mobile["title"], mobile

                # Verify the actual safe() renderer escapes future edited text.
                context = browser.new_context(viewport={"width": 390, "height": 844})
                page = context.new_page()
                prepare_page(page, "ET")
                escaped = page.evaluate(
                    """() => {
                      window.MARKET_BASE_COUNTRY_DISTINCTIVE_FACTS.items.ZZ={
                        category:'検証', title:'<img src=x onerror=alert(1)>',
                        body:'A & B <script>bad</script>', source_name:'検証',
                        source_url:'javascript:alert(1)'
                      };
                      const html=countryDistinctiveFactHtml({entity_id:'ZZ'});
                      const host=document.createElement('div'); host.innerHTML=html;
                      return {
                        html,
                        images:host.querySelectorAll('img').length,
                        scripts:host.querySelectorAll('script').length,
                        sourceLinks:host.querySelectorAll('a').length,
                        title:host.querySelector('h4')?.textContent || '',
                        body:host.querySelector('p')?.textContent || ''
                      };
                    }"""
                )
                assert escaped["images"] == 0 and escaped["scripts"] == 0, escaped
                assert escaped["sourceLinks"] == 0, escaped
                assert "<img" in escaped["title"] and "<script>" in escaped["body"], escaped
                context.close()
            finally:
                browser.close()
        output = {
            "status": "PASS",
            "desktopEthiopia": desktop,
            "mobilePakistan": mobile,
            "escaping": escaped,
            "note": "Executed with Chromium set_content because managed URL navigation is blocked in the test environment.",
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
        print("PASSED: V333.15 country distinctive fact Chromium UI smoke")
        return 0
    except Exception as error:
        print(f"FAILED: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
