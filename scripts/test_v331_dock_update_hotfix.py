from pathlib import Path
import re,json,sys,subprocess
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(n,c): checks.append((n,bool(c))); print(('PASS ' if c else 'FAIL ')+n)
def read(p): return (ROOT/p).read_text(encoding='utf-8',errors='ignore')
tool=read('assets/js/market-base-tool-dock-v331.js')
radio=read('assets/js/market-base-radio-dock-v331.js')
css=read('assets/css/market-base-dual-dock-v331.css')
controller=read('assets/js/market-base-update-controller-v331.js')
index=read('index.html')
code=read('market-base-code-tool.html')
sw=read('sw.js')
scroll=read('assets/js/market-base-scroll-controls-r11328.js')
check('build V331',read('version.txt').strip()=='MARKET_BASE_V331_DOCK_LIST_UPDATE_HOTFIX_20260802')
check('tool independent init','DOMContentLoaded\', init' in tool and 'waitForRadio' not in tool)
check('tool visible default',"storageGet(COLLAPSED_KEY) === '1'" in tool)
check('text picker','ツールを選択' in tool and 'role="menu"' in tool)
check('tool labels',all(x in tool for x in ['計算機・単位換算','為替換算','WORK CODE']))
check('work code last order','order: 900' in tool)
check('panel left straight','border-radius: 0 17px 17px 0' in css)
check('tab full height','bottom: 0' in css and 'height: auto' in css)
check('track metadata DOM','mbRadioDockTrackTitle' in radio and 'renderTrack(currentState)' in radio)
check('chatgpt direct anchor','href="https://chatgpt.com/"' in index and 'target="_blank"' in index)
check('update nonblocking','service worker soft timeout' in controller and '9000' in controller)
check('code page no duplicate docks','market-base-radio-dock-v331' not in code and 'market-base-tool-dock-v331' not in code)
check('code page no desktop injector','market-base-desktop-icon-nav' not in code and 'market-base-pc-unified-shell' not in code)
check('scroll loader V331','market-base-update-controller-v331.js' in scroll)
check('SW V331 assets',all(x in sw for x in ['market-base-update-controller-v331.js','market-base-radio-dock-v331.js','market-base-tool-dock-v331.js','market-base-dual-dock-v331.css']))
# Local refs
missing=[]
for f in ROOT.rglob('*.html'):
 t=f.read_text(encoding='utf-8',errors='ignore')
 for u in re.findall(r'(?:src|href)=["\']([^"\']+)["\']',t):
  if '${' in u or u.startswith(('http:','https:','mailto:','tel:','data:','#','javascript:')): continue
  p=u.split('?',1)[0].split('#',1)[0]
  if not p or p.endswith('/'): continue
  target=(f.parent/p).resolve()
  try: target.relative_to(ROOT.resolve())
  except ValueError: continue
  if not target.exists(): missing.append((f.relative_to(ROOT),u))
check('local references',not missing)
if missing: print(missing[:10])
failed=[n for n,c in checks if not c]
print(f'RESULT {len(checks)-len(failed)}/{len(checks)}')
sys.exit(1 if failed else 0)
