from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
stations = (ROOT / "world-radio/assets/world-radio-stations.js").read_text(encoding="utf-8")
player = (ROOT / "world-radio/assets/world-radio-player.js").read_text(encoding="utf-8")
build = (ROOT / "assets/js/market-base-build.js").read_text(encoding="utf-8")
manifest = (ROOT / "manifest.json").read_text(encoding="utf-8")
service_worker = (ROOT / "sw.js").read_text(encoding="utf-8")

token = "20260803-v333-6-radio-dock-reading-half-pc-unification"
build_id = "MARKET_BASE_V333_6_RADIO_DOCK_READING_HALF_PC_UNIFICATION_20260803"

assert "airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio005/hlspbaudio005_Auto.m3u8" in stations
assert "airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudioragam/hlspbaudioragam_Auto.m3u8" in stations
assert "air.pc.cdn.bitgravity.com/air/live/pbaudio005" not in stations
assert "air.pc.cdn.bitgravity.com/air/live/pbaudio139" not in stations

assert "🇪🇸 スペイン｜Flamenco Radio" in stations
assert "rtva-live-radio.flumotion.com/rtva/flamenco.mp3" in stations
assert "LOUNGE-RADIO.COM" not in stations
assert "lounge-radio.com" not in stations

assert "2794_64.aac" in stations
assert "2794_128.mp3" in stations
assert "function tryNextStream" in player
assert "activeStreamIndex += 1" in player
assert "18000" in player

assert build_id in build
assert token in build
assert 'V.333.6' in build
assert build_id in service_worker
assert token in service_worker
assert '"version": "V333.6"' in manifest

print("PASS: V333.6 radio stream refresh and fallback checks")
