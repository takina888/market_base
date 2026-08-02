from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
checks=[]
def ok(name,cond):
 checks.append((name,bool(cond)))
 if not cond: print('FAIL',name)
ctrl=(root/'assets/js/market-base-update-controller-v333.js').read_text(encoding='utf-8')
menu=(root/'assets/js/market-base-tool-menu-v333.js').read_text(encoding='utf-8')
menucss=(root/'assets/css/market-base-tool-menu-v333.css').read_text(encoding='utf-8')
radio=(root/'assets/js/market-base-radio-dock-v333.js').read_text(encoding='utf-8')
player=(root/'world-radio/assets/world-radio-player.js').read_text(encoding='utf-8')
sw=(root/'sw.js').read_text(encoding='utf-8')
ok('controller loads menu', 'market-base-tool-menu-v333.js' in ctrl and 'market-base-tool-dock-v332.js' not in ctrl)
ok('controller loads radio only', 'market-base-radio-dock-v333.js' in ctrl)
ok('legacy tool hidden', '#marketBaseSecondaryDock' in menucss and 'display:none!important' in menucss)
ok('bottom nav menu binding', '.mb-primary-bottom-nav' in menu and 'marketBaseToolMenu' in menu)
ok('work photo construction', "id:'workphoto'" in menu and "disabled:true" in menu and "badge:'作成中'" in menu)
ok('menu tools', all(x in menu for x in ['計算機・単位換算','為替換算','WORK CODE']))
ok('no workphoto external url', 'takina888.github.io/workphoto' not in menu)
ok('radio no dock resume command', "sendCommand('resume')" not in radio)
ok('radio named player', 'marketBaseWorldRadioPlayer' in radio)
ok('player exclusive owner', "OWNER_KEY = 'market_base_radio_owner_v1'" in player and 'ownerIsFresh' in player)
ok('player rate lock', "audio.addEventListener('ratechange'" in player and 'ensureNormalRate' in player)
ok('player play lock', 'playbackPromise' in player and "status === 'playing' && !audio.paused" in player)
ok('actual interruption only', "document.hidden && playIntent" in player and "if (document.hidden) publishState();" in player)
ok('sw no tool dock', 'market-base-tool-dock-v332.js' not in sw and 'market-base-tool-menu-v333.js' in sw)
ok('version', (root/'version.txt').read_text().strip()=='MARKET_BASE_V333_BOTTOM_TOOL_MENU_RADIO_SINGLETON_20260803')
htmls=[p for p in root.rglob('*.html') if p.relative_to(root).as_posix()!='world-radio/player.html']
ok('controller all html', all(p.read_text(encoding='utf-8',errors='replace').count('market-base-update-controller-v333.js')==1 for p in htmls))
failed=[n for n,v in checks if not v]
print(f'PASS {len(checks)-len(failed)} / {len(checks)}')
raise SystemExit(1 if failed else 0)
