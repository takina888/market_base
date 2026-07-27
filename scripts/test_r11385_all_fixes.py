#!/usr/bin/env python3
"""R113.85 regression checks for converter width, retail gallery, flags and geolocation UI."""
from __future__ import annotations
from pathlib import Path
import re
import json

ROOT=Path(__file__).resolve().parents[1]

def require(path:str)->Path:
    p=ROOT/path
    assert p.is_file(), f'missing: {path}'
    return p

# Static contracts first.
currency_css=require('assets/css/currency-standard-shell-r11335.css').read_text(encoding='utf-8')
standard_css=require('assets/css/market-base-standard-shell-r11372.css').read_text(encoding='utf-8')
prism_css=require('assets/css/prism-calculator-integrated-r1136.css').read_text(encoding='utf-8')
daily_css=require('assets/css/r93-daily-retail-and-pc-flag-fix.css').read_text(encoding='utf-8')
compass_js=require('assets/js/world-compass-r11311.js').read_text(encoding='utf-8')
compass_html=require('world-compass.html').read_text(encoding='utf-8')
flag_data=require('assets/flags/flag-svg-data.js').read_text(encoding='utf-8')
capitals=require('assets/js/world-compass-country-capitals-r11311.js').read_text(encoding='utf-8')

assert '@media(min-width:431px) and (max-width:1199px)' in currency_css
assert 'width:min(calc(100% - 32px),1180px)!important' in currency_css
assert 'R113.85b — final converter half-PC override' in standard_css
assert 'R113.85b — tablet workspace' in prism_css
assert 'max-width:720px!important' in daily_css
assert 'flagEmoji(' not in compass_js
assert 'flagSvgMarkup(' in compass_js
assert 'locationStatus' in compass_html and 'wc-visually-hidden" id="sensorStatus' not in compass_html
assert 'flag-svg-data.js?v=20260727-r11385-flaglock' in compass_html
assert 'MARKET_BASE_FLAG_SVG_DATA' in flag_data
assert 'MB_COUNTRY_CAPITALS' in capitals

try:
    from playwright.sync_api import sync_playwright
except Exception as exc:
    print(f'R113.85 ALL FIXES TEST: STATIC PASS; Playwright unavailable ({exc})')
    raise SystemExit(0)

results={}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    # Currency/unit computed widths using actual CSS and no network navigation.
    css='\n'.join([require('assets/css/market-base-primary-components-r11326.css').read_text(encoding='utf-8'),currency_css,standard_css,prism_css])
    html=f'''<!doctype html><style>{css}</style><body class="mb-unified-specialist-page mb-standard-page currency-standard-page"><div class="mb-primary-header-host"><header class="mb-primary-header"></header></div><main class="currency-standard-shell mb-standard-content-shell"><section id="prismToolPanel"><div class="mb-ui-grid prism-workspace"><div class="mb-ui-card">A</div><div class="mb-ui-card">B</div></div></section></main></body>'''
    page=browser.new_page(viewport={'width':600,'height':800});page.set_content(html)
    for width,min_expected in [(600,560),(800,760),(960,920),(1100,1060)]:
        page.set_viewport_size({'width':width,'height':800});page.wait_for_timeout(20)
        data=page.evaluate('''() => {const s=document.querySelector('.currency-standard-shell').getBoundingClientRect();const h=document.querySelector('.mb-primary-header-host').getBoundingClientRect();return {shell:s.width,header:h.width}}''')
        assert data['shell']>=min_expected, (width,data)
        assert abs(data['shell']-data['header'])<=1, (width,data)
        results[f'currency_{width}']=data
    page.close()

    # Full PC gallery must be about twice the old 360px viewer; half PC remains compact.
    html=f'''<!doctype html><style>*{{box-sizing:border-box}}body{{margin:0}}{daily_css}</style><section class="daily-retail-showcase"><div class="daily-retail-layout"><button class="daily-retail-main"></button><div class="daily-retail-side"><div class="daily-retail-thumbs"><button class="daily-retail-thumb"></button><button class="daily-retail-thumb"></button><button class="daily-retail-thumb"></button><button class="daily-retail-thumb"></button></div></div></div></section>'''
    page=browser.new_page(viewport={'width':1400,'height':900});page.set_content(html)
    main=page.locator('.daily-retail-main').bounding_box();side=page.locator('.daily-retail-side').bounding_box()
    assert 700<=main['width']<=725, main
    assert side['width']<=385, side
    results['daily_full']={'main':main['width'],'side':side['width']}
    page.set_viewport_size({'width':900,'height':900});page.wait_for_timeout(20)
    half=page.locator('.daily-retail-main').bounding_box();assert half['width']<=370,half
    results['daily_half']={'main':half['width']}
    page.close()

    # Inline full compass so JS, 196 SVG flags and geolocation status can execute without HTTP.
    html=compass_html
    all_css='\n'.join(require(x).read_text(encoding='utf-8') for x in ['assets/css/world-compass-ui-base-r11311.css','assets/css/world-compass-r11311.css','assets/css/world-compass-controls-r11357.css','assets/css/market-base-primary-components-r11326.css','assets/css/market-base-standard-shell-r11372.css'])
    html=re.sub(r'<link\b[^>]*>','',html)
    html=re.sub(r'<script\s+src="[^"]+"[^>]*></script>','',html)
    all_js='\n'.join([flag_data,capitals,compass_js])
    html=html.replace('</head>',f'<style>{all_css}</style></head>').replace('</body>',f'<script>{all_js}</script></body>')
    page=browser.new_page(viewport={'width':390,'height':900});page.set_content(html);page.wait_for_timeout(100)
    data=page.evaluate('''() => ({buttons:document.querySelectorAll('.wc-country-flag-button').length,svgs:document.querySelectorAll('.wc-country-flag-button svg').length,emoji:document.querySelectorAll('.wc-country-flag-button__emoji').length,statusDisplay:getComputedStyle(document.getElementById('locationStatus')).display})''')
    assert data['buttons']==196 and data['svgs']==196 and data['emoji']==0,data
    assert data['statusDisplay']!='none',data
    page.evaluate("""() => Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(ok)=>setTimeout(()=>ok({coords:{latitude:25.0478,longitude:121.5319,accuracy:12}}),20)}})""")
    page.click('#locationButton');page.wait_for_timeout(100)
    geo=page.evaluate('''() => ({status:locationStatus.innerText,button:locationButtonLabel.innerText,current:mapCurrentName.innerText})''')
    assert '取得完了' in geo['status'] and geo['button']=='現在地を再取得' and geo['current']=='端末の現在地',geo
    results['flags']=data;results['geolocation']=geo
    page.close();browser.close()

print('R113.85 ALL FIXES TEST: PASS')
print(json.dumps(results,ensure_ascii=False,indent=2))
