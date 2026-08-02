from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
checks=[]
def ok(name,cond):
    checks.append((name,bool(cond)))
    if not cond: print('FAIL',name)

tool=(root/'assets/js/market-base-tool-dock-v332.js').read_text(encoding='utf-8')
radio=(root/'assets/js/market-base-radio-dock-v332.js').read_text(encoding='utf-8')
css=(root/'assets/css/market-base-dual-dock-v332.css').read_text(encoding='utf-8')
code=(root/'market-base-code-tool.html').read_text(encoding='utf-8')
ctrl=(root/'assets/js/market-base-update-controller-v332.js').read_text(encoding='utf-8')
sw=(root/'sw.js').read_text(encoding='utf-8')
ok('tool camera workphoto', 'https://takina888.github.io/workphoto/' in tool and "icon:'camera'" in tool and "target:'_blank'" in tool)
ok('tool icon launcher', 'grid-auto-columns:48px' in css and 'mb-tool-picker-trigger{display:none' in css)
ok('work code late', "id:'code',order:900" in tool)
ok('pc right gap tool', 'PC_RIGHT_GAP=18' in tool)
ok('pc right gap radio', 'global.innerWidth >= 900 ? 18 : 0' in radio)
ok('radio startup not dismissed', 'storageRemove(DISMISSED_KEY)' in radio and 'dock.hidden = dismissed;' in radio)
ok('radio metadata', 'mbRadioDockTrackTitle' in radio and 'trackArtist' in radio)
ok('code canonical shell', 'mb-standard-page mb-code-page' in code and 'mb-global-header mb-primary-header' in code)
ok('code line guide', 'LINEでも使えます' in code and 'value="line"' in code)
ok('code docks enabled', 'market-base-update-controller-v332.js' in code)
ok('controller loads docks on code', 'isRadioPlayerPage() || isStandaloneCodePage()' not in ctrl)
ok('network first shell', "request.destination==='style'" in sw and "request.destination==='script'" in sw)
ok('chatgpt removed', 'chatgpt.com' not in (root/'index.html').read_text(encoding='utf-8').lower() and 'data-home-search-action="chatgpt"' not in (root/'index.html').read_text(encoding='utf-8'))
ok('search two modes', 'repeat(2,minmax(0,1fr))' in (root/'assets/css/home-search-mode-v332.css').read_text(encoding='utf-8') and 'home-search-mode-v332.js' in (root/'index.html').read_text(encoding='utf-8'))
ok('currency split', 'rateRefreshButton' in (root/'market-base-currency-converter-v273-r29.html').read_text(encoding='utf-8') and 'pageRefreshButton' in (root/'market-base-currency-converter-v273-r29.html').read_text(encoding='utf-8'))
htmls=[p for p in root.rglob('*.html') if p.relative_to(root).as_posix()!='world-radio/player.html']
ok('controller all html exactly once', all(p.read_text(encoding='utf-8',errors='replace').count('market-base-update-controller-v332.js')==1 for p in htmls))
failed=[n for n,v in checks if not v]
print(f'PASS {len(checks)-len(failed)} / {len(checks)}')
raise SystemExit(1 if failed else 0)
