from hashlib import sha256
from pathlib import Path


root = Path(__file__).resolve().parents[1]
checks = []


def ok(name, condition):
    checks.append((name, bool(condition)))
    if not condition:
        print("FAIL", name)


def text(path):
    return (root / path).read_text(encoding="utf-8")


def digest(path):
    return sha256((root / path).read_bytes()).hexdigest()


build_id = "MARKET_BASE_V333_3_RADIO_RESTORE_V331_CURRENCY_RUNTIME_FIX_20260803"
token = "20260803-v333-3-radio-restore-v331-currency-runtime-fix"

controller = text("assets/js/market-base-update-controller-v333.js")
sw = text("sw.js")
offline_manifest = text("assets/js/market-base-offline-manifest-v324.js")
currency = text("market-base-currency-converter-v273-r29.html")
radio_index = text("world-radio/index.html")

stable_hashes = {
    "assets/js/market-base-radio-dock-v331.js": "a2709ed7dbcf20fd8bb0aee4c66ee68a3a95dcddd89e2a1019cf367705808ef7",
    "assets/css/market-base-dual-dock-v331.css": "15952975a88e05c36143bb7af446baab0565d3a5ec743474e9af3f44395032a1",
    "world-radio/assets/world-radio.js": "ce4f384f4c9baf1c6a4550eb4683cb9aec56bd453713e679a66d2d4e205f88ba",
    "world-radio/assets/world-radio-player.js": "433eb8c53b8fa8b6fee814e48224a8e970296bb20da53c5dcef7126d49c57f56",
}

ok("version build", text("version.txt").strip() == build_id)
ok("controller build", build_id in controller)
ok("controller loads V331 radio", f"market-base-radio-dock-v331.js?v={token}" in controller)
ok("controller does not load V333 radio", "market-base-radio-dock-v333.js" not in controller)
ok("bottom tool menu preserved", f"market-base-tool-menu-v333.js?v={token}" in controller)
ok("right TOOLS dock not restored", "market-base-tool-dock-v331.js" not in controller)

for path, expected in stable_hashes.items():
    ok(f"V331 byte match: {path}", digest(path) == expected)

ok("radio list opens an independent tab", 'target="_blank" rel="noopener"' in radio_index)
ok("radio named-window singleton removed", "marketBaseWorldRadioPlayer" not in radio_index)
ok("radio list uses restored runtime", f"world-radio.js?v={token}" in radio_index)
ok("radio player uses restored runtime", f"world-radio-player.js?v={token}" in text("world-radio/player.html"))

ok("service worker build", build_id in sw)
ok("service worker V331 radio", f"market-base-radio-dock-v331.js?v={token}" in sw)
ok("service worker V331 radio CSS", f"market-base-dual-dock-v331.css?v={token}" in sw)
ok("service worker excludes V333 radio", "market-base-radio-dock-v333" not in sw)
ok("offline manifest V331 radio", "market-base-radio-dock-v331.js" in offline_manifest)
ok("offline manifest V331 radio CSS", "market-base-dual-dock-v331.css" in offline_manifest)
ok("offline manifest excludes V333 radio", "market-base-radio-dock-v333" not in offline_manifest)

ok("currency page included", bool(currency))
ok("currency missing button guarded", "const rateRefreshButton=$('#rateRefreshButton');" in currency)
ok("currency unsafe direct bind removed", "$('#rateRefreshButton').addEventListener" not in currency)
ok("currency controller current", f"market-base-update-controller-v333.js?v={token}" in currency)
ok("currency flags current", f"flag-svg-data.js?v={token}" in currency)
ok("calculator CSS current", f"prism-calculator-integrated-r1136.css?v={token}" in currency)
ok("calculator JS current", f"prism-calculator-integrated-r1136.js?v={token}" in currency)
ok("controller clears old rate cache", "startsWith('mb_rates_')" in controller)

all_text = "\n".join(
    path.read_text(encoding="utf-8", errors="ignore")
    for path in root.rglob("*")
    if path.is_file() and path.suffix.lower() in {".html", ".js", ".json", ".txt"}
)
ok("V333.2 cache token removed", "20260803-v333-2-bottom-tool-menu-radio-currency-runtime-fix" not in all_text)

failed = [name for name, passed in checks if not passed]
print(f"PASS {len(checks) - len(failed)} / {len(checks)}")
raise SystemExit(1 if failed else 0)
