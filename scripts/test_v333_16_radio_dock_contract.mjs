#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const dock = read('assets/js/market-base-radio-dock-v333-16.js');
const dockCss = read('assets/css/market-base-radio-dock-v333-16.css');
const scrollCss = read('assets/css/market-base-scroll-controls-r11328.css');
const player = read('world-radio/assets/world-radio-player.js');

// First-frame gate: the dock is created hidden, its collision-safe coordinates
// are applied after the real stylesheet is available, and only the following
// animation frame is allowed to expose it. This prevents the old right-edge FOUC.
assert.match(dock, /node\.dataset\.styleReady = 'false';/);
assert.match(dock, /addBootstrapStyle\(\);[\s\S]*?addStylesheet\(\);[\s\S]*?createDock\(\);/);
assert.match(
  dock,
  /function markDockStyleReady\(\)[\s\S]*?requestAnimationFrame\(\(\) => \{[\s\S]*?restorePosition\(\);[\s\S]*?requestAnimationFrame\(\(\) => \{[\s\S]*?dock\.dataset\.styleReady = 'true';/
);
assert.match(
  dockCss,
  /\.mb-radio-dock\.is-positioned\[data-style-ready="false"\]\s*\{\s*visibility:\s*hidden;/,
  'even a positioned dock must remain invisible until the ready gate opens'
);
assert.match(dock, /else collapsed = !currentState;/, 'no live state must initially select the collapsed tab');
assert.match(
  dockCss,
  /\.mb-radio-dock\[data-collapsed="true"\] \.mb-radio-dock-tab\s*\{\s*transform:\s*translateX\(var\(--dock-panel-width\)\);/,
  'collapsed tab must translate to the viewport edge before it becomes visible'
);

// The whole visible tab, not just the small grip, is a pointer drag surface.
assert.match(dock, /const DRAG_THRESHOLD_PX = 6;/);
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
  assert.match(
    dock,
    new RegExp(`dockTab\\.addEventListener\\('${type}', \\w+Drag\\);`),
    `radio tab is missing ${type} drag handling`
  );
}
assert.match(dockCss, /\.mb-radio-dock-tab\s*\{[\s\S]*?touch-action:\s*none;/);
assert.match(dock, /Math\.hypot\(deltaX, deltaY\) < DRAG_THRESHOLD_PX/);
assert.match(dock, /captureTarget:\s*event\.currentTarget/);

// Collision and restoration hooks must use the visible UP button as the hard
// ceiling and recompute ratios after viewport or control-rail changes.
const obstacleSelector =
  '[data-mb-scroll-controls]:not([hidden]) .mb-scroll-control-up:not([hidden])';
assert.ok(dock.includes(`'${obstacleSelector}'`), 'dock must query the visible UP control');
assert.match(dock, /const SCROLL_CONTROL_GAP = 10;/);
assert.match(dock, /scrollControlTop - SCROLL_CONTROL_GAP - panelHeight/);
assert.match(dock, /function savedPosition\(\)/);
assert.match(dock, /function positionFromRatio\(position, bounds\)/);
assert.match(dock, /global\.addEventListener\('resize', schedulePositionRestore/);
assert.match(dock, /global\.addEventListener\('orientationchange', schedulePositionRestore/);
assert.match(dock, /ResizeObserver/);
assert.match(dock, /MutationObserver/);

// Keep this arithmetic independent of browser layout availability. It mirrors
// positionBounds/defaultPosition for the four requested iPhone-size contracts,
// including restored ratios and a resize/rotation recomputation.
assert.match(scrollCss, /@media\(max-width:430px\)[\s\S]*?bottom:calc\(103px \+ env\(safe-area-inset-bottom\)\)/);
assert.match(scrollCss, /@media\(max-width:430px\)[\s\S]*?\.mb-scroll-control\{width:54px;height:54px/);
assert.match(scrollCss, /\.mb-scroll-controls\{[\s\S]*?gap:10px;/);

const viewports = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 }
];
const scrollBottom = 103;
const scrollButtonHeight = 54;
const scrollButtonGap = 10;
const dockPanelHeight = 132;
const radioTabHeight = 108;
const collisionGap = 10;
const edgeGap = 10;

function contractBounds({ width, height }) {
  const panelWidth = Math.min(300, width - 72);
  const upButtonTop = height - scrollBottom - (3 * scrollButtonHeight + 2 * scrollButtonGap);
  const minimumY = edgeGap;
  const edgeMaximumY = height - edgeGap - dockPanelHeight;
  const collisionMaximumY = upButtonTop - collisionGap - dockPanelHeight;
  return {
    panelWidth,
    minimumX: 36,
    maximumX: width - panelWidth,
    minimumY,
    maximumY: Math.max(minimumY, Math.min(edgeMaximumY, collisionMaximumY)),
    upButtonTop
  };
}

function restoredPosition(ratio, bounds) {
  return {
    x: bounds.minimumX + ratio.xRatio * (bounds.maximumX - bounds.minimumX),
    y: bounds.minimumY + ratio.yRatio * (bounds.maximumY - bounds.minimumY)
  };
}

for (const viewport of viewports) {
  const bounds = contractBounds(viewport);
  const initial = restoredPosition({ xRatio: 1, yRatio: 1 }, bounds);
  const collapsedTabLeft = initial.x - 36 + bounds.panelWidth;
  assert.equal(
    collapsedTabLeft + 36,
    viewport.width,
    `${viewport.width}px first visible collapsed frame must be flush with the right edge`
  );
  assert.ok(
    initial.y + radioTabHeight + collisionGap <= bounds.upButtonTop,
    `${viewport.width}px initial tab must be at least 10px above the UP button`
  );

  for (const savedRatio of [
    { xRatio: 0, yRatio: 0 },
    { xRatio: 0.42, yRatio: 0.63 },
    { xRatio: 1, yRatio: 1 }
  ]) {
    const restored = restoredPosition(savedRatio, bounds);
    assert.ok(restored.y >= bounds.minimumY);
    assert.ok(
      restored.y + dockPanelHeight + collisionGap <= bounds.upButtonTop,
      `${viewport.width}px restored dock must not overlap the UP button`
    );
  }
}

// Simulate preserving one saved ratio while every requested viewport is used
// as the post-rotation/resize destination.
const rotatedSavedRatio = { xRatio: 0.73, yRatio: 0.88 };
for (const destination of viewports) {
  const bounds = contractBounds(destination);
  const restored = restoredPosition(rotatedSavedRatio, bounds);
  assert.ok(restored.y + dockPanelHeight + collisionGap <= bounds.upButtonTop);
}

// Exercise the actual freshness function extracted from the dock. validUntil
// must override the legacy 12-hour grace window when the v3 player supplies it.
const freshnessSource = dock.match(/function stateIsFresh\(state\) \{[\s\S]*?\n  \}/)?.[0];
assert.ok(freshnessSource, 'stateIsFresh implementation is missing');
let now = 1_800_000_000_000;
const stateIsFresh = vm.runInNewContext(
  `(() => { const LEGACY_STATE_GRACE_MS = 12 * 60 * 60 * 1000; return ${freshnessSource}; })()`,
  { Date: { now: () => now } }
);
const baseState = { version: 3, stationId: 'wnyc', updatedAt: now - 1_000 };
assert.equal(stateIsFresh({ ...baseState, validUntil: now + 1 }), true);
assert.equal(
  stateIsFresh({ ...baseState, validUntil: now - 1 }),
  false,
  'an expired validUntil must not be revived by a recent updatedAt'
);
assert.equal(stateIsFresh({ ...baseState, validUntil: now + 180_000 }), true);
assert.equal(stateIsFresh({ ...baseState, validUntil: 0 }), true, 'legacy state remains compatible');
assert.equal(
  stateIsFresh({ ...baseState, validUntil: 0, updatedAt: now - 12 * 60 * 60 * 1000 }),
  false
);
assert.match(player, /const STATE_TTL_MS = 180000;/);
assert.match(player, /validUntil:\s*now \+ STATE_TTL_MS/);

const browserCommands = ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'];
const browser = browserCommands.find(command =>
  spawnSync(command, ['--version'], { encoding: 'utf8' }).status === 0
);
if (!browser) {
  console.log('SKIP — browser visual smoke: no Chromium executable; static first-frame and viewport contracts ran instead');
} else {
  console.log(`INFO — browser executable detected (${browser}); this contract test remains DOM-independent`);
}

console.log('PASS — V333.16 radio dock ready gate, whole-tab drag, validUntil, and four-viewport collision contract');
