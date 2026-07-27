#!/usr/bin/env python3
"""R113.85 regression: converter width, full-PC retail gallery, SVG flags, geolocation status."""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    raise SystemExit(f"R113.85 REPAIR TEST: FAIL — {message}")


def strip_external_links(markup: str) -> str:
    return re.sub(r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*>', '', markup, flags=re.I)


def strip_external_scripts(markup: str) -> str:
    return re.sub(r'<script\b[^>]*src=["\'][^"\']+["\'][^>]*>\s*</script>', '', markup, flags=re.I)

# Static contract first, so the test remains useful without Playwright.
currency = (ROOT / 'market-base-currency-converter-v273-r29.html').read_text(encoding='utf-8')
index = (ROOT / 'index.html').read_text(encoding='utf-8')
compass = (ROOT / 'world-compass.html').read_text(encoding='utf-8')
compass_js = (ROOT / 'assets/js/world-compass-r11311.js').read_text(encoding='utf-8')
compass_css = (ROOT / 'assets/css/world-compass-r11311.css').read_text(encoding='utf-8')
daily_css = (ROOT / 'assets/css/r93-daily-retail-and-pc-flag-fix.css').read_text(encoding='utf-8')
currency_css = (ROOT / 'assets/css/currency-standard-shell-r11335.css').read_text(encoding='utf-8')
flag_data = (ROOT / 'assets/flags/flag-svg-data.js').read_text(encoding='utf-8')

required = {
    'converter current link': 'market-base-currency-converter-v273-r29.html?v=20260727-r11385',
    'compass current link': 'world-compass.html?v=20260727-r11385',
    'converter half-PC CSS': '@media(min-width:431px) and (max-width:1199px)',
    'converter fluid half-PC width': 'width:min(calc(100% - 32px),1180px)!important',
    'full-PC gallery 720px viewer': 'max-width:720px!important',
    'official SVG flag data': 'MARKET_BASE_FLAG_SVG_DATA',
    'flag lock function': 'flagSvgMarkup',
    'visible location success': '現在地：取得完了',
    'visible location error': '現在地：更新されていません',
    'location status block': 'id="locationStatus"',
}
for label, token in required.items():
    haystack = (
        index if label in {'converter current link', 'compass current link'} else
        currency_css if label.startswith('converter ') else
        daily_css if label.startswith('full-PC') else
        flag_data if label == 'official SVG flag data' else
        compass_js if label in {'flag lock function', 'visible location success', 'visible location error'} else
        compass
    )
    if token not in haystack:
        fail(f'missing {label}: {token}')

if 'emojiFlag' in compass_js or 'String.fromCodePoint' in compass_js:
    fail('emoji flag generator remains in the compass runtime')

try:
    from playwright.sync_api import sync_playwright
except Exception as exc:  # pragma: no cover
    print(f'R113.85 REPAIR TEST: STATIC PASS; Playwright unavailable ({exc})')
    sys.exit(0)

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path='/usr/bin/chromium',
        args=['--no-sandbox'],
    )

    # Converter and unit-converter share the fluid shell at half-PC widths.
    markup = currency
    styles = '\n'.join((ROOT / path).read_text(encoding='utf-8') for path in (
        'assets/css/market-base-primary-components-r11326.css',
        'assets/css/currency-standard-shell-r11335.css',
        'assets/css/market-base-desktop-icon-nav-r11337.css',
        'assets/css/market-base-standard-shell-r11372.css',
        'assets/css/prism-calculator-integrated-r1136.css',
    ))
    markup = strip_external_scripts(strip_external_links(markup)).replace(
        '</head>', f'<style>{styles}</style></head>'
    )
    page = browser.new_page(viewport={'width': 700, 'height': 1000})
    page.set_content(markup, wait_until='domcontentloaded')
    page.wait_for_timeout(150)
    for width in (500, 700, 899, 900, 1024, 1199, 1400):
        page.set_viewport_size({'width': width, 'height': 1000})
        page.wait_for_timeout(30)
        values = page.evaluate('''() => {
          const shell=document.querySelector('.currency-standard-shell').getBoundingClientRect();
          const header=document.querySelector('.mb-primary-header-host').getBoundingClientRect();
          return {shell:shell.width,header:header.width,scroll:document.documentElement.scrollWidth,viewport:innerWidth};
        }''')
        if values['scroll'] > width + 1:
            fail(f'horizontal converter overflow at {width}px: {values}')
        if width >= 431 and values['shell'] <= 430:
            fail(f'converter fell back to phone width at {width}px: {values}')
        if width <= 899 and abs(values['shell'] - values['header']) > 2:
            fail(f'converter header/body width mismatch at {width}px: {values}')
    page.set_viewport_size({'width': 700, 'height': 1000})
    page.click('[data-tool-tab="prism"]')
    unit = page.evaluate('''() => ({
      hidden:document.querySelector('#prismToolPanel').hidden,
      panel:document.querySelector('#prismToolPanel').getBoundingClientRect().width,
      shell:document.querySelector('.currency-standard-shell').getBoundingClientRect().width
    })''')
    if unit['hidden'] or unit['panel'] <= 430 or unit['panel'] > unit['shell'] + 1:
        fail(f'unit converter did not inherit fluid shell: {unit}')
    page.close()

    # Full-PC daily gallery keeps a larger main viewer and bounded thumbnails.
    gallery_markup = f'''<!doctype html><html><head><style>*{{box-sizing:border-box}}body{{margin:0}}.host{{width:1360px;margin:auto}}{daily_css}</style></head><body><div class="host"><section class="daily-retail-showcase"><div class="daily-retail-layout"><button class="daily-retail-main"><img></button><div class="daily-retail-side"><div class="daily-retail-thumbs">{''.join('<button class="daily-retail-thumb"><img></button>' for _ in range(4))}</div></div></div></section></div></body></html>'''
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.set_content(gallery_markup)
    gallery = page.evaluate('''() => ({
      main:document.querySelector('.daily-retail-main').getBoundingClientRect().width,
      side:document.querySelector('.daily-retail-side').getBoundingClientRect().width,
      thumbs:document.querySelectorAll('.daily-retail-thumb').length
    })''')
    if gallery['main'] < 650 or gallery['side'] > 410 or gallery['thumbs'] != 4:
        fail(f'full-PC gallery balance is wrong: {gallery}')
    page.close()

    # Compass uses all 196 inline SVG flags and reports mocked geolocation status.
    markup = compass
    styles = '\n'.join((ROOT / path).read_text(encoding='utf-8') for path in (
        'assets/css/world-compass-ui-base-r11311.css',
        'assets/css/world-compass-r11311.css',
        'assets/css/world-compass-controls-r11357.css',
        'assets/css/market-base-primary-components-r11326.css',
        'assets/css/market-base-standard-shell-r11372.css',
    ))
    scripts = '\n'.join((ROOT / path).read_text(encoding='utf-8') for path in (
        'assets/flags/flag-svg-data.js',
        'assets/js/world-compass-country-capitals-r11311.js',
        'assets/js/world-compass-r11311.js',
    ))
    markup = strip_external_scripts(strip_external_links(markup))
    markup = markup.replace('</head>', f'<style>{styles}</style></head>')
    markup = markup.replace('</body>', f'<script>{scripts}</script></body>')
    context = browser.new_context(viewport={'width': 390, 'height': 1000})
    context.add_init_script('''Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(success){setTimeout(()=>success({coords:{latitude:25.0478,longitude:121.5319,accuracy:12}}),20)}}});''')
    page = context.new_page()
    page.set_content(markup, wait_until='domcontentloaded')
    page.wait_for_timeout(180)
    flags = page.evaluate('''() => {
      const buttons=[...document.querySelectorAll('.wc-country-flag-button')];
      return {count:buttons.length,svg:buttons.filter(b=>b.querySelector('.wc-country-flag-button__flag svg')).length,missing:buttons.filter(b=>b.querySelector('.is-missing')).length};
    }''')
    if flags != {'count': 196, 'svg': 196, 'missing': 0}:
        fail(f'official SVG flags are incomplete: {flags}')
    page.click('#locationButton')
    page.wait_for_timeout(80)
    location = page.evaluate('''() => ({
      text:document.querySelector('#locationStatus').textContent.trim(),
      button:document.querySelector('#locationButtonLabel').textContent.trim(),
      display:getComputedStyle(document.querySelector('#locationStatus')).display
    })''')
    if '取得完了' not in location['text'] or '精度' not in location['text']:
        fail(f'geolocation success is not visible: {location}')
    if location['button'] != '現在地を再取得' or location['display'] == 'none':
        fail(f'geolocation status/button state is wrong: {location}')
    context.close()
    browser.close()

print('R113.85 REPAIR TEST: PASS — converter widths, unit panel, full-PC gallery, 196 SVG flags and visible geolocation status verified')
