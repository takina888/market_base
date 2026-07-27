#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
CSS = (ROOT / 'assets/css/market-base-news-tabs-v1.css').read_text(encoding='utf-8')
JS = (ROOT / 'assets/js/market-base-news-tabs-v1.js').read_text(encoding='utf-8')

checks = {
    'news section uses compact modifier': 'mbn-news--home-compact' in HTML,
    'title and pause are in same head': '<div class="mbn-news__head">' in HTML and 'data-mbn-pause' in HTML,
    'R113.78 patch exists': 'R113.78 — home news controls' in CSS,
    'mobile head is flex': 'display:flex!important' in CSS,
    'mobile head prevents wrapping': 'flex-wrap:nowrap!important' in CSS,
    'six-column balancing grid exists': 'grid-template-columns:repeat(6,minmax(0,1fr))!important' in CSS,
    'first three tabs span two columns': '.mbn-tab:nth-child(-n+3){grid-column:span 2!important}' in CSS,
    'last two tabs span three columns': '.mbn-tab:nth-child(n+4){grid-column:span 3!important}' in CSS,
    'pause label remains single line': 'white-space:nowrap!important' in CSS,
    'five category labels exist': all(label in JS for label in ('海外ニュース','食品機械','食品工場','小売店','規制関連')),
    'new CSS version is wired': 'market-base-news-tabs-v1.css?v=20260727-r11378' in HTML,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('NEWS HOME COMPACT LAYOUT TEST: FAIL\n- ' + '\n- '.join(failed))
print(f'NEWS HOME COMPACT LAYOUT TEST: PASS — {len(checks)}/{len(checks)}')
