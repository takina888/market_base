#!/usr/bin/env python3
"""Regression test for R113.74 Learn ordering and reading-only classics."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
index = (ROOT / "index.html").read_text(encoding="utf-8")
classic = (ROOT / "classic-move/index.html").read_text(encoding="utf-8")
app = (ROOT / "classic-move/app.js").read_text(encoding="utf-8")
sw = (ROOT / "sw.js").read_text(encoding="utf-8")

def fail(message: str) -> None:
    raise SystemExit(f"LEARN READING ORDER TEST: FAIL — {message}")

for forbidden in ("work-basics/index.html", "仕事の基本（番外編）"):
    if forbidden in index:
        fail(f"unused Work Basics reference remains in index: {forbidden}")
if (ROOT / "work-basics").exists():
    fail("work-basics public folder still exists")
if "work-basics/" in sw:
    fail("Service Worker still caches Work Basics")

home_reading_pos = index.find('id="homeReadingSection"')
classic_pos = index.find('id="classic-move-home"')
history_pos = index.find('id="historyLearningMount"')
main_tabs_pos = index.find('<nav aria-label="メインナビゲーション" class="tabs">')
learn_pos = index.find('<section class="view learn-view" id="learn">')
world_pos = index.find('id="worldWhyLearning"')
learn_end = index.find('<section class="view" id="sources">')
if min(home_reading_pos, classic_pos, history_pos, main_tabs_pos, learn_pos, world_pos, learn_end) < 0:
    fail("one or more home/Learn section markers are missing")
if not home_reading_pos < classic_pos < history_pos < main_tabs_pos < learn_pos < world_pos < learn_end:
    fail("expected Home Reading (Classics -> History) before navigation, and World Q&A inside Learn")
learn_markup = index[learn_pos:learn_end]
if 'classic-move-home' in learn_markup or 'historyLearningMount' in learn_markup:
    fail("Classics or History is duplicated inside Learn")

if "ゲーム" in classic or "プレイ設定" in classic or "game-core-redesign" in classic:
    fail("Classic entry still exposes game UI")
for forbidden in ("GAME_CORE_REDESIGN", "data-case", "startCase(", "ゲームで", "遊んで学ぶ"):
    if forbidden in app:
        fail(f"reading-only app contains game path: {forbidden}")
for required in ("原文", "読み下し", "現代語訳", "解読", "仕事での使い方", "誤用注意"):
    if required not in classic + app:
        fail(f"reading stage is missing: {required}")
for removed in (
    ROOT / "classic-move/data/game-core-redesign.js",
    ROOT / "classic-move/data/game-core-redesign.json",
    ROOT / "classic-move/index_standalone.html",
):
    if removed.exists():
        fail(f"game-only public file remains: {removed.relative_to(ROOT)}")

print("LEARN READING ORDER TEST: PASS — Home Reading contains Classics then History; Learn retains World Q&A; Work Basics removed; Classics is reading-only")
