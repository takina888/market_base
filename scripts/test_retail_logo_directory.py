#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image
import json, re

ROOT=Path(__file__).resolve().parents[1]

def fail(msg):
    print('FAIL:',msg)
    raise SystemExit(1)

def main():
    data_path=ROOT/'data/retail-logo-directory-r11379.js'
    match=re.fullmatch(r'window\.MARKET_BASE_RETAIL_LOGO_DIRECTORY = (.*);\s*',data_path.read_text(encoding='utf-8'),re.S)
    if not match: fail('logo data wrapper')
    data=json.loads(match.group(1))
    boards=data.get('boards',[])
    if len(boards)!=8: fail(f'board count {len(boards)}')
    if any(len(b.get('cells',[]))!=16 for b in boards): fail('one or more boards are not 16 cells')
    if sum(len(b['cells']) for b in boards)!=128: fail('total cell count')

    retail=BeautifulSoup((ROOT/'retail-sales-v273-db-title-r27.html').read_text(encoding='utf-8'),'html.parser')
    ids={x.get('id') for x in retail.select('article.card[id]')}
    search_count=0
    direct_count=0
    for board in boards:
        image=ROOT/board['image']
        if not image.exists(): fail(f'missing image {board["image"]}')
        with Image.open(image) as im:
            if im.size!=(1055,1491): fail(f'unexpected image size {board["image"]}: {im.size}')
        for cell in board['cells']:
            if cell.get('target_id'):
                direct_count+=1
                if cell['target_id'] not in ids: fail(f'missing retailer id {cell["target_id"]}')
            elif cell.get('query'):
                search_count+=1
            else:
                fail(f'link target missing for {cell.get("label")}')
    if direct_count!=124 or search_count!=4: fail(f'link counts direct={direct_count}, search={search_count}')

    index=(ROOT/'index.html').read_text(encoding='utf-8')
    refs=[
      'assets/css/retail-logo-directory-r11379.css?v=20260727-r11379',
      'data/retail-logo-directory-r11379.js?v=20260727-r11379',
      'assets/js/retail-logo-directory-r11379.js?v=20260727-r11379'
    ]
    for ref in refs:
        if ref not in index: fail(f'index missing {ref}')
    js=(ROOT/'assets/js/retail-logo-directory-r11379.js').read_text(encoding='utf-8')
    if "daily.insertAdjacentElement('afterend',section)" not in js: fail('directory not inserted after daily gallery')
    if "?focus=" not in js or "?q=" not in js: fail('detail/search-link builders missing')
    css=(ROOT/'assets/css/retail-logo-directory-r11379.css').read_text(encoding='utf-8')
    for marker in ['grid-template-columns:repeat(4','grid-template-rows:repeat(4','scroll-snap-type:x mandatory']:
        if marker not in css: fail(f'CSS missing {marker}')
    sw=(ROOT/'sw.js').read_text(encoding='utf-8')
    required=['assets/css/retail-logo-directory-r11379.css','data/retail-logo-directory-r11379.js','assets/js/retail-logo-directory-r11379.js']+[f'assets/images/retail-logo-directory/logo-sheet-{i:02d}.jpg' for i in range(1,9)]
    for ref in required:
        if ref not in sw: fail(f'SW missing {ref}')
    print('RETAIL LOGO DIRECTORY TEST: PASS — boards=8, cells=128, direct=124, search=4, images=8')

if __name__=='__main__': main()
