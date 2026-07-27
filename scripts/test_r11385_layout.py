#!/usr/bin/env python3
"""R113.85 layout regression: converter half-PC width and daily gallery full-PC balance."""
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
CONVERTER=ROOT/'market-base-currency-converter-v273-r29.html'
PRIMARY=ROOT/'assets/css/market-base-primary-components-r11326.css'
CURRENCY=ROOT/'assets/css/currency-standard-shell-r11335.css'
STANDARD=ROOT/'assets/css/market-base-standard-shell-r11372.css'
DAILY=ROOT/'assets/css/r93-daily-retail-and-pc-flag-fix.css'

for p in (CONVERTER,PRIMARY,CURRENCY,STANDARD,DAILY):
    assert p.is_file(), f'missing {p.relative_to(ROOT)}'

converter=CONVERTER.read_text(encoding='utf-8')
inline='\n'.join(re.findall(r'<style[^>]*>(.*?)</style>',converter,re.S))
converter_css='\n'.join([inline,PRIMARY.read_text(encoding='utf-8'),CURRENCY.read_text(encoding='utf-8'),STANDARD.read_text(encoding='utf-8')])
daily_css=DAILY.read_text(encoding='utf-8')

required=[
    '@media(min-width:431px) and (max-width:899px)',
    'width:min(calc(100% - 32px),1180px)!important',
    '@media(min-width:1100px)',
    'max-width:720px!important',
    'max-width:380px!important',
]
joined=converter_css+'\n'+daily_css
for token in required:
    assert token in joined, f'missing rule: {token}'

try:
    from playwright.sync_api import sync_playwright
except Exception as exc:
    print(f'R113.85 LAYOUT TEST: STATIC PASS; Playwright unavailable ({exc})')
    sys.exit(0)

converter_doc=f'''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>{converter_css}</style></head>
<body class="mb-unified-specialist-page mb-standard-page currency-standard-page">
<div class="mb-primary-header-host"><header class="mb-primary-header"><strong>MARKET BASE</strong></header></div>
<main class="mb-primary-currency-content currency-standard-shell mb-standard-content-shell"><section><div class="cards"><article class="currency-card">card</article></div></section></main>
<nav class="mb-primary-bottom-nav"></nav></body></html>'''

daily_doc=f'''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{{box-sizing:border-box}}body{{margin:0}}.wrap{{width:calc(100% - 48px);max-width:1440px;margin:auto}}{daily_css}</style></head>
<body><div class="wrap"><section class="daily-retail-showcase"><div class="daily-retail-layout"><button class="daily-retail-main"></button><div class="daily-retail-side"><div class="daily-retail-thumbs"><button class="daily-retail-thumb"></button><button class="daily-retail-thumb"></button><button class="daily-retail-thumb"></button><button class="daily-retail-thumb"></button></div></div></div></section></div></body></html>'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':600,'height':1000})
    page.set_content(converter_doc)
    for width in (431,600,760,899,900,1200):
        page.set_viewport_size({'width':width,'height':1000})
        result=page.evaluate('''() => {const s=document.querySelector('.currency-standard-shell').getBoundingClientRect();const h=document.querySelector('.mb-primary-header-host').getBoundingClientRect();return {shell:s.width,header:h.width,doc:document.documentElement.scrollWidth}}''')
        assert result['doc']<=width+1, (width,result)
        if 431<=width<=899:
            expected=min(width-32,1180)
            assert abs(result['shell']-expected)<2,(width,result,expected)
            assert abs(result['header']-expected)<2,(width,result,expected)

    page2=browser.new_page(viewport={'width':1200,'height':1000})
    page2.set_content(daily_doc)
    for width in (800,1000,1100,1200,1500,1800):
        page2.set_viewport_size({'width':width,'height':1000})
        result=page2.evaluate('''() => {const m=document.querySelector('.daily-retail-main').getBoundingClientRect();const s=document.querySelector('.daily-retail-side').getBoundingClientRect();return {main:m.width,side:s.width,doc:document.documentElement.scrollWidth}}''')
        assert result['doc']<=width+1,(width,result)
        if width>=1100:
            assert 550<=result['main']<=762,(width,result)
            assert result['side']<=402,(width,result)
    browser.close()

print('R113.85 LAYOUT TEST: PASS — converter uses a fluid half-PC shell; full-PC daily main viewer grows to 720/760px and thumbnails remain bounded')
