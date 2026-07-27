#!/usr/bin/env python3
"""End-to-end local smoke test for the standalone World Route entry."""
from __future__ import annotations
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json, re, threading
from pathlib import Path
from urllib.request import urlopen

ROOT=Path(__file__).resolve().parent.parent
VERSION='20260727-r11381'
ENTRY=ROOT/'world-route.html'
REDIRECT=ROOT/'world-route'/'index.html'

def fail(message:str)->None:
    raise SystemExit(f'WORLD ROUTE SMOKE TEST: FAIL — {message}')

for path in (ENTRY,REDIRECT):
    if not path.is_file() or path.stat().st_size==0: fail(f'missing: {path.relative_to(ROOT)}')
html=ENTRY.read_text(encoding='utf-8')
for marker in ('window.WBR_DATA = ','data-wbr-country-grid','data-wbr-route-image',"dataset.wbrReady='1'",'wbrRuntimeError'):
    if marker not in html: fail(f'standalone entry lost marker: {marker}')
if '<script src=' in html or 'rel="stylesheet"' in html: fail('standalone entry still depends on external runtime CSS/JS')
match=re.search(r'window\.WBR_DATA = (\{.*?\});</script>',html,re.S)
if not match: fail('embedded WBR_DATA not found')
try:data=json.loads(match.group(1))
except json.JSONDecodeError as error:fail(f'embedded data invalid: {error}')
if len(data.get('tables',{}).get('countries',[]))!=20:fail('country count is not 20')
if len(data.get('tables',{}).get('routes',[]))!=63:fail('route count is not 63')
if len(data.get('route_cards',{}))!=20:fail('route card count is not 20')
paths=[]
for cid,card in data['route_cards'].items():
    for mode in ('representative','alternate'):
        rel=card.get(mode,'')
        if not rel or any(ord(ch)>127 for ch in rel): fail(f'{cid} {mode}: path is empty or non-ASCII: {rel}')
        p=ROOT/rel
        if not p.is_file() or p.stat().st_size==0:fail(f'{cid} {mode}: image missing: {rel}')
        paths.append(rel)
if len(set(paths))!=40:fail(f'expected 40 images, got {len(set(paths))}')
index=(ROOT/'index.html').read_text(encoding='utf-8')
if f'world-route.html?v={VERSION}' not in index:fail('home link is not standalone R113.81')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
for marker in (f'./world-route.html?v={VERSION}','cacheCoreSafely','const isWorldRoute='):
    if marker not in sw:fail(f'service worker marker missing: {marker}')

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,_format:str,*_args:object)->None:return
handler=partial(Quiet,directory=str(ROOT))
server=ThreadingHTTPServer(('127.0.0.1',0),handler)
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
    base=f'http://127.0.0.1:{server.server_port}/'
    urls=['world-route.html?v='+VERSION,'world-route/index.html?v='+VERSION,paths[0]]
    for rel in urls:
        with urlopen(base+rel,timeout=5) as response:
            content=response.read()
            if response.status!=200 or not content:fail(f'HTTP failed: {rel}')
finally:
    server.shutdown();server.server_close();thread.join(timeout=5)
print('WORLD ROUTE SMOKE TEST: PASS — standalone entry, redirect, 20 countries, 63 routes, 40 ASCII image paths, robust service-worker recovery and local HTTP delivery verified')
