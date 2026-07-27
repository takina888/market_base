#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
css_files = [
    ROOT / 'assets/css/main-r11347/market-base-app-01-foundation-r11347.css',
    ROOT / 'assets/css/main-r11347/market-base-app-02-features-r11347.css',
    ROOT / 'assets/css/main-r11347/market-base-app-03-views-r11347.css',
    ROOT / 'assets/css/market-base-primary-components-r11326.css',
]
css = '\n'.join(path.read_text(encoding='utf-8') for path in css_files)
required = [
    '@media(min-width:431px) and (max-width:899px)',
    'width:min(calc(100% - 32px),760px)!important',
    'white-space:normal!important',
    'overflow-wrap:anywhere!important',
    '@media(min-width:900px) and (max-width:1099px)',
]
for token in required:
    assert token in css, f'missing responsive rule: {token}'

try:
    from playwright.sync_api import sync_playwright
except Exception as exc:  # pragma: no cover
    print(f'HALF-PC RESPONSIVE TEST: STATIC PASS; Playwright unavailable ({exc})')
    sys.exit(0)

html = f'''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>{css}</style></head>
<body class="mb-unified-main-page">
<main class="app-shell" id="home">
<section class="target-home-reference">
<div class="mb-global-header mb-primary-header"><strong class="mb-global-brand">MARKET BASE</strong><div class="mb-global-actions"><span class="mb-global-button">196</span><button class="mb-global-button">更新</button></div></div>
<div class="target-search-box"><b>国・地域・企業・ブランドを検索するための長い表示文字</b></div>
<div class="target-route-list"><button><span class="target-icon line-ui-icon"></span><span><strong>世界のコンテナ輸送ルートと国際物流情報</strong><em>長い補足説明も枠内に収める</em></span><span>›</span></button></div>
<div class="target-region-grid"><button>中東・アフリカ地域</button><button>ヨーロッパ地域</button><button>東南アジア地域</button></div>
<div class="target-recent-grid"><button><strong>非常に長い国・地域・企業名の表示確認</strong></button><button><strong>別の長い最近見た項目名</strong></button></div>
<div class="target-ranking-grid"><button><span class="ranking-line-icon"></span><b>海外在留日本人数ランキング</b></button><button><span class="ranking-line-icon"></span><b>日本食レストラン店舗数</b></button></div>
</section></main>
<nav class="mb-primary-bottom-nav"><a class="mb-primary-bottom-tab active"><span class="mb-primary-bottom-icon"></span><b>ホーム</b></a><a class="mb-primary-bottom-tab"><span class="mb-primary-bottom-icon"></span><b>ツール</b></a><a class="mb-primary-bottom-tab"><span class="mb-primary-bottom-icon"></span><b>学ぶ</b></a><a class="mb-primary-bottom-tab"><span class="mb-primary-bottom-icon"></span><b>ランキング</b></a></nav>
</body></html>'''

widths = [431, 500, 600, 620, 760, 899, 900, 1024, 1099]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': widths[0], 'height': 1100})
    page.set_content(html, wait_until='domcontentloaded')
    for width in widths:
        page.set_viewport_size({'width': width, 'height': 1100})
        page.wait_for_timeout(30)
        result = page.evaluate('''() => {
          const shell=document.querySelector('#home.app-shell');
          const nav=document.querySelector('.mb-primary-bottom-nav');
          const targets=[...document.querySelectorAll('.target-search-box,.target-route-list button,.target-region-grid button,.target-recent-grid button,.target-ranking-grid button,.mb-primary-bottom-tab')];
          const overflow=targets.filter(el=>el.scrollWidth>el.clientWidth+1 || el.scrollHeight>el.clientHeight+2).map(el=>({cls:el.className,sw:el.scrollWidth,cw:el.clientWidth,sh:el.scrollHeight,ch:el.clientHeight,text:el.textContent.trim()}));
          const sr=shell.getBoundingClientRect(); const nr=nav.getBoundingClientRect();
          return {overflow,shellWidth:sr.width,navWidth:nr.width,navDisplay:getComputedStyle(nav).display,bodyScroll:document.documentElement.scrollWidth,viewport:innerWidth};
        }''')
        assert result['bodyScroll'] <= result['viewport'] + 1, f'horizontal page overflow at {width}px: {result}'
        assert not result['overflow'], f'component overflow at {width}px: {result["overflow"]}'
        if width <= 899:
            assert result['navDisplay'] != 'none', f'bottom navigation hidden at {width}px'
            assert abs(result['shellWidth'] - result['navWidth']) <= 1.5, f'shell/nav width mismatch at {width}px: {result}'
        else:
            assert result['navDisplay'] == 'none', f'bottom navigation visible on desktop at {width}px'
    browser.close()

print('HALF-PC RESPONSIVE TEST: PASS — 431–1099px has no card/text overflow; shell and bottom navigation align through 899px')
