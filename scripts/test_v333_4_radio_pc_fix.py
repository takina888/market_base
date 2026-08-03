from pathlib import Path

root = Path(__file__).resolve().parents[1]
player = (root / "world-radio/assets/world-radio-player.js").read_text()
dock_css = (root / "assets/css/market-base-dual-dock-v331.css").read_text()
pc_css = (root / "assets/css/market-base-pc-shell-alignment-v324-fix.css").read_text()
pc_js = (root / "assets/js/market-base-pc-unified-shell-r95-v1.js").read_text()
index = (root / "index.html").read_text()

assert "function confirmPlaybackFromMedia()" in player
for event in ("timeupdate", "canplay", "progress"):
    assert f"audio.addEventListener('{event}', confirmPlaybackFromMedia)" in player
assert '[data-state="loading"] .mb-radio-dock-tab' in dock_css
assert "@media (max-width:899px)" in pc_css
assert "overflow-x:clip!important" in pc_css
assert "body.mb-unified-main-page > main.app-shell#home" in pc_css
assert "document.documentElement.scrollLeft=0" in pc_js
assert "20260803-v333-4-radio-state-pc-shell-fix" in index
assert "MARKET_BASE_V333_4_RADIO_STATE_PC_SHELL_FIX_20260803" in index
print("PASS: V333.4 radio state and PC shell regression checks")
