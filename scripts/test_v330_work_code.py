#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
BUILD = 'MARKET_BASE_V330_WORK_CODE_LATE_TOOL_ORDER_20260802'
TOKEN = '20260802-v330-work-code-late-order'
OFFLINE_BUILD = 'MARKET_BASE_OFFLINE_MANIFEST_V330_WORK_CODE_20260802'
passes: list[str] = []
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    (passes if condition else failures).append(label)


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding='utf-8', errors='replace')


def main() -> int:
    required = [
        'market-base-code-tool.html',
        'assets/css/home-search-mode-v330.css',
        'assets/js/home-search-mode-v330.js',
        'assets/css/market-base-code-tool-v330.css',
        'assets/js/market-base-code-tool-v330.js',
        'assets/css/market-base-dual-dock-v330.css',
        'assets/js/market-base-radio-dock-v330.js',
        'assets/js/market-base-tool-dock-v330.js',
        'assets/vendor/market-base-qr-generator-v330.js',
        'assets/vendor/market-base-barcode-generator-v330.js',
        'assets/vendor/LICENSE_QR_APACHE_2_0.txt',
        'assets/vendor/LICENSE_REPORTLAB_CODE128_NOTICE.txt',
        'world-radio/assets/world-radio-player.js',
        'manifest.json', 'version.txt', 'sw.js'
    ]
    for rel in required:
        check((ROOT / rel).is_file(), f'required file: {rel}')

    removed = [
        'assets/css/home-search-mode-v302.css',
        'assets/js/home-search-mode-v302.js',
        'assets/css/market-base-dual-dock-v328.css',
        'assets/js/market-base-radio-dock-v328.js',
        'assets/js/market-base-tool-dock-v328.js',
        'assets/css/home-search-mode-v329.css',
        'assets/js/home-search-mode-v329.js',
        'assets/css/market-base-code-tool-v329.css',
        'assets/js/market-base-code-tool-v329.js',
        'assets/css/market-base-dual-dock-v329.css',
        'assets/js/market-base-radio-dock-v329.js',
        'assets/js/market-base-tool-dock-v329.js',
        'assets/vendor/market-base-qr-generator-v329.js',
        'assets/vendor/market-base-barcode-generator-v329.js',
        'scripts/test_v328_tool_launcher.py'
    ]
    for rel in removed:
        check(not (ROOT / rel).exists(), f'old replaced file removed: {rel}')

    manifest = json.loads(read('manifest.json'))
    check(manifest.get('name') == 'MARKET BASE V.330', 'manifest display name')
    check(manifest.get('version') == 'V.330', 'manifest version')
    check(manifest.get('build_id') == BUILD, 'manifest build ID')
    check(TOKEN in manifest.get('start_url', ''), 'manifest cache token')
    check(read('version.txt').strip() == BUILD, 'version.txt build ID')
    build_js = read('assets/js/market-base-build.js')
    check(BUILD in build_js and "release: 'V.330'" in build_js, 'runtime build label')

    html_files = sorted(ROOT.rglob('*.html'))
    missing_meta = []
    for path in html_files:
        page = path.read_text(encoding='utf-8', errors='replace')
        if BUILD not in page:
            missing_meta.append(path.relative_to(ROOT).as_posix())
    check(not missing_meta, 'all HTML pages use V330 build metadata')

    index = read('index.html')
    search_js = read('assets/js/home-search-mode-v330.js')
    search_css = read('assets/css/home-search-mode-v330.css')
    check(index.count('home-search-mode-tab') >= 3, 'home has three search controls')
    check('data-home-search-action="chatgpt"' in index, 'home has ChatGPT button')
    check("window.open('https://chatgpt.com/','_blank','noopener,noreferrer')" in search_js,
          'ChatGPT opens in separate browser context')
    check('grid-template-columns:repeat(3,minmax(0,1fr))' in search_css,
          'three search controls share equal width')

    dock = read('assets/js/market-base-tool-dock-v330.js')
    dock_css = read('assets/css/market-base-dual-dock-v330.css')
    check("id: 'calculator'" in dock and "id: 'currency'" in dock and "id: 'code'" in dock,
          'tool launcher has calculator, currency and code')
    order = [dock.index("id: 'calculator'"), dock.index("id: 'currency'"), dock.index("id: 'code'")]
    check(order == sorted(order), 'tool launcher source order')
    check("label: 'WORK CODE'" in dock and 'order: 900' in dock, 'WORK CODE named and reserved toward the back')
    check('.sort((a, b) => a.order - b.order)' in dock, 'tool launcher sorts by order')
    check('計算機・単位換算' in dock, 'calculator retains unit conversion')
    check("const LAST_TOOL_KEY = 'market_base_last_tool_v1'" in dock, 'last-used tool memory')
    check("link.innerHTML = iconSvg(item.icon)" in dock, 'launcher items are icon-only')
    check("link.setAttribute('aria-label', item.label)" in dock, 'icon-only launcher remains accessible')
    check('supplied.slice(0, 24)' in dock, 'launcher supports future tools')
    check('grid-auto-flow: column' in dock_css and 'overflow-x: auto' in dock_css,
          'fifth and later tools scroll horizontally')
    check('grid-auto-columns: 43px' in dock_css and 'max-width: 187px' in dock_css,
          'four square icons fit before scrolling')
    check('--dock-panel-height: 108px' in dock_css, 'dock height fixed to radio size')
    check('border-radius: 16px 16px 16px 0' in dock_css,
          'white panel connection-side lower corner is square')
    check("const EDGE_GAP = 0" in dock, 'magnetic seam has no gap')
    check('maximumWithoutOverlap' in dock, 'tool and radio panels cannot overlap')

    code_html = read('market-base-code-tool.html')
    code_js = read('assets/js/market-base-code-tool-v330.js')
    check(code_html.count('data-code-tab=') == 3, 'code tool has scan/create/history tabs')
    check('<h1>WORK CODE</h1>' in code_html and '<title>WORK CODE｜MARKET BASE</title>' in code_html, 'WORK CODE branding')
    check('.mb-code-form[hidden]{display:none!important}' in read('assets/css/market-base-code-tool-v330.css'), 'QR and barcode forms do not overlap')
    for option in ('url','text','phone','email','wifi','vcard','geo','sms'):
        check(f'<option value="{option}"' in code_html, f'QR type: {option}')
    for fmt in ('EAN13','EAN8','CODE128','CODE39','ITF','UPCA'):
        check(f'<option value="{fmt}"' in code_html, f'barcode format: {fmt}')
    check("const MAX_HISTORY=20" in code_js, 'history limited to 20')
    check("sensitive:/^WIFI:/i.test(lastResult)" in code_js, 'scanned Wi-Fi passwords excluded from history')
    check("sensitive:true" in code_js and '内容非保存' in code_js, 'generated Wi-Fi passwords excluded from history')
    check('PNGを保存しました' in code_js and 'navigator.share' in code_js and 'window.print()' in code_js,
          'PNG save/share/print actions')
    check('html5-qrcode@2.3.8' in code_js and "'BarcodeDetector'in window" in code_js,
          'camera scanner and native fallback')
    check('market-base-update-controller-v322.js' in code_html, 'code page participates in global updates')
    check('market-base-radio-dock-v330.js' in code_html and 'market-base-tool-dock-v330.js' in code_html,
          'code page has both magnetic docks')

    qr = read('assets/vendor/market-base-qr-generator-v330.js')
    barcode = read('assets/vendor/market-base-barcode-generator-v330.js')
    check('global.MarketBaseQR' in qr, 'local QR generator export')
    check('global.MarketBaseBarcode' in barcode, 'local barcode generator export')
    check('encodeEAN13' in barcode and 'encodeCode128' in barcode and 'encodeITF' in barcode,
          'barcode generator implements required formats')

    radio_dock = read('assets/js/market-base-radio-dock-v330.js')
    player = read('world-radio/assets/world-radio-player.js')
    check('外部アプリで中断されました。▶を押して再開してください。' in radio_dock,
          'dock explains interrupted playback')
    check("sendCommand('resume')" in radio_dock, 'dock requests recovery on return')
    check("document.addEventListener('visibilitychange'" in radio_dock and "global.addEventListener('pageshow'" in radio_dock,
          'dock listens for app return')
    check('resumeAfterInterruption' in player and 'recoverAfterExternalApp' in player,
          'player retains and recovers playback intent')
    check("needsGesture = true" in player and '再生ボタンを押してください' in player,
          'player falls back to user gesture when iOS blocks autoplay')

    sw = read('sw.js')
    offline = read('assets/js/market-base-offline-manifest-v324.js')
    check(BUILD in sw and TOKEN in sw, 'service worker V330 build/token')
    check(OFFLINE_BUILD in offline, 'offline manifest version')
    for rel in (
        'market-base-code-tool.html',
        'assets/css/market-base-code-tool-v330.css',
        'assets/js/market-base-code-tool-v330.js',
        'assets/vendor/market-base-qr-generator-v330.js',
        'assets/vendor/market-base-barcode-generator-v330.js',
        'assets/css/home-search-mode-v330.css',
        'assets/js/home-search-mode-v330.js',
        'assets/css/market-base-dual-dock-v330.css',
        'assets/js/market-base-radio-dock-v330.js',
        'assets/js/market-base-tool-dock-v330.js',
    ):
        check(rel in sw, f'service worker contains {rel}')
        check('./' + rel in offline, f'offline manifest contains {rel}')

    # JavaScript syntax for every V330-edited runtime file.
    js_targets = [
        'assets/js/home-search-mode-v330.js',
        'assets/js/market-base-code-tool-v330.js',
        'assets/js/market-base-radio-dock-v330.js',
        'assets/js/market-base-tool-dock-v330.js',
        'assets/vendor/market-base-qr-generator-v330.js',
        'assets/vendor/market-base-barcode-generator-v330.js',
        'assets/js/market-base-build.js',
        'assets/js/market-base-desktop-icon-nav-r11337.js',
        'assets/js/market-base-scroll-controls-r11328.js',
        'assets/js/market-base-update-controller-v322.js',
        'world-radio/assets/world-radio-player.js',
        'world-radio/assets/world-radio.js',
        'sw.js',
    ]
    for rel in js_targets:
        proc = subprocess.run(['node', '--check', str(ROOT / rel)], capture_output=True, text=True)
        check(proc.returncode == 0, f'JavaScript syntax: {rel}')

    bad_json = []
    for path in ROOT.rglob('*.json'):
        try:
            json.loads(path.read_text(encoding='utf-8-sig'))
        except Exception as exc:
            bad_json.append(f'{path.relative_to(ROOT)}: {exc}')
    check(not bad_json, 'all JSON files parse')

    # Check local href/src references from HTML. Ignore fragments, data/blob URLs, templates and external links.
    missing_refs = []
    attr_re = re.compile(r'''(?:href|src)\s*=\s*["']([^"']+)["']''', re.I)
    for path in html_files:
        page = path.read_text(encoding='utf-8', errors='replace')
        for raw in attr_re.findall(page):
            if not raw or '${' in raw or raw.startswith(('#','data:','blob:','javascript:','mailto:','tel:','sms:','geo:','{{')):
                continue
            parts = urlsplit(raw)
            if parts.scheme or parts.netloc:
                continue
            target = (path.parent / parts.path).resolve()
            try:
                target.relative_to(ROOT.resolve())
            except ValueError:
                continue
            if parts.path.endswith('/'):
                target = target / 'index.html'
            if not target.exists():
                missing_refs.append(f'{path.relative_to(ROOT)} -> {raw}')
    check(not missing_refs, 'HTML local references exist')

    # Live source should not reference replaced V328 assets/build IDs.
    live_ext = {'.html','.js','.css','.json','.txt','.md','.mjs','.webmanifest'}
    stale = []
    for path in ROOT.rglob('*'):
        if not path.is_file() or path.suffix.lower() not in live_ext or path.name == Path(__file__).name:
            continue
        text = path.read_text(encoding='utf-8', errors='replace')
        if re.search(r'market-base-(?:dual-dock|radio-dock|tool-dock|code-tool)-v329|home-search-mode-v329|MARKET_BASE_V329_|V\.329|market-base-(?:dual-dock|radio-dock|tool-dock)-v328|home-search-mode-v302|MARKET_BASE_V328_|V\.328', text):
            stale.append(path.relative_to(ROOT).as_posix())
    check(not stale, 'no stale V328/V329 live references')

    print(f'V330 QA: {len(passes)} passed, {len(failures)} failed')
    for label in passes:
        print('PASS ', label)
    for label in failures:
        print('FAIL ', label)
    if missing_meta:
        print('Missing build metadata:', *missing_meta, sep='\n  ')
    if bad_json:
        print('Invalid JSON:', *bad_json, sep='\n  ')
    if missing_refs:
        print('Missing refs:', *missing_refs[:30], sep='\n  ')
    if stale:
        print('Stale refs:', *stale, sep='\n  ')
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
