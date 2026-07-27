#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILES = {
  data: 'embedded-country-profile-data-v273-r28.js',
  manifest: 'data/images/todays-journey-image-manifest-r11370.js',
  index: 'index.html',
  sw: 'sw.js',
  build: 'assets/js/market-base-build.js',
  app: 'assets/js/app-v273-country-profile-r28-refresh-route-header-r95.js',
  builder: 'scripts/build_todays_journey_image_manifest.mjs',
  self: 'scripts/test_todays_journey_images.mjs'
};
const BUILD_ID = 'MARKET_BASE_R113_79_RETAIL_LOGO_DIRECTORY_20260727';
const VERSION = '20260727-r11379';
const JOURNEY_VERSION = '20260726-r11370';
const COMMON_THUMB_WIDTHS = new Set([20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840]);
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function read(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  check(fs.existsSync(absolutePath), `missing file: ${relativePath}`);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function evaluate(relativePath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read(relativePath), context, { filename: relativePath });
  return context.window;
}

function validHttps(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

const embedded = evaluate(FILES.data).MARKET_BASE_TODAYS_JOURNEY?.data?.entries;
check(Array.isArray(embedded), 'embedded Today’s Journey data is not an array');
check(embedded?.length === 365, `embedded entry count must be 365; got ${embedded?.length ?? 0}`);

const manifest = evaluate(FILES.manifest).MARKET_BASE_TODAYS_JOURNEY_IMAGE_MANIFEST;
const rows = manifest?.entries || {};
const rowIds = Object.keys(rows);
check(manifest?.entry_count === 365, `manifest entry_count must be 365; got ${manifest?.entry_count ?? 0}`);
check(manifest?.resolved_count === 365, `manifest resolved_count must be 365; got ${manifest?.resolved_count ?? 0}`);
check(Array.isArray(manifest?.unresolved) && manifest.unresolved.length === 0,
  `manifest unresolved must be empty; got ${manifest?.unresolved?.length ?? 'invalid'}`);
check(rowIds.length === 365, `manifest entries must contain 365 keys; got ${rowIds.length}`);

const embeddedIds = new Set((embedded || []).map(entry => entry.id));
check(rowIds.every(id => embeddedIds.has(id)), 'manifest contains an ID absent from embedded data');
check((embedded || []).every(entry => rows[entry.id]), 'one or more embedded IDs are absent from manifest');

const nonRomanizedQueries = [];
const invalidCandidates = [];
for (const [id, row] of Object.entries(rows)) {
  const query = String(row?.query || '').trim();
  if (!query || /[\u3040-\u30ff\u3400-\u9fff]/u.test(query)) nonRomanizedQueries.push(id);
  if (!Array.isArray(row?.candidates) || row.candidates.length === 0) {
    invalidCandidates.push(`${id}: no candidate`);
    continue;
  }
  for (const [index, candidate] of row.candidates.entries()) {
    const prefix = `${id}[${index}]`;
    if (!validHttps(candidate?.image_url)
      || !String(candidate.image_url).startsWith('https://upload.wikimedia.org/')) {
      invalidCandidates.push(`${prefix}: invalid Wikimedia image_url`);
    }
    const thumbWidth = Number(String(candidate?.image_url || '').match(/\/(?:[^/]*-)?(\d+)px-[^/]+$/)?.[1] || 0);
    if (!COMMON_THUMB_WIDTHS.has(thumbWidth)) {
      invalidCandidates.push(`${prefix}: unsupported Wikimedia thumbnail width ${thumbWidth || 'missing'}`);
    }
    if (!validHttps(candidate?.source_page)
      || !String(candidate.source_page).startsWith('https://commons.wikimedia.org/wiki/File:')) {
      invalidCandidates.push(`${prefix}: invalid Commons source_page`);
    }
    if (!String(candidate?.license || '').trim()) invalidCandidates.push(`${prefix}: empty license`);
    if (!validHttps(candidate?.license_url)) invalidCandidates.push(`${prefix}: invalid license_url`);
    if (!String(candidate?.file_title || '').trim()) invalidCandidates.push(`${prefix}: empty file_title`);
  }
}
check(nonRomanizedQueries.length === 0,
  `queries must be non-empty English/romanized text: ${nonRomanizedQueries.join(', ')}`);
check(invalidCandidates.length === 0, `candidate metadata failures:\n${invalidCandidates.join('\n')}`);

const preferredFiles = {
  'EARTH-133': 'Dorudon atrox fossil at Wadi El-Hitan, Egypt, March 2008.jpg',
  'EARTH-310': 'TO-Mapu a Vaea.JPG',
  'EARTH-309': 'Interior de capilla en la roca, Geghard.jpg',
  'EARTH-294': 'Leil in an Estonian smoke sauna.jpg',
  'EARTH-192': 'Granite monolith.jpg',
  'EARTH-157': 'Kafue National Park.jpg',
  'EARTH-159': 'Lake Assal 1-Djibouti.jpg',
  'EARTH-322': '1 hallstatt austria.jpg',
  'EARTH-298': 'Nossa Sra. do Carmo.jpg',
  'EARTH-360': 'Iguazu Falls Brazilian Side 2019.jpg',
  'EARTH-067': 'Pentecost Land Diving.JPG',
  'EARTH-244': 'Trang An Landscape Complex, Ninh Binh Province, Vietnam, 20240202 1413 5245.jpg',
  'EARTH-027': 'Mosquito bay, Bioluminescent bay, Vieques - panoramio (1).jpg',
  'EARTH-073': 'Riisa Bog.jpg'
};
for (const [id, expected] of Object.entries(preferredFiles)) {
  check(rows[id]?.candidates?.[0]?.file_title === expected,
    `${id} preferred file must be "${expected}"; got "${rows[id]?.candidates?.[0]?.file_title || ''}"`);
}

const index = read(FILES.index);
const sw = read(FILES.sw);
const build = read(FILES.build);
const app = read(FILES.app);
const manifestTag = `data/images/todays-journey-image-manifest-r11370.js?v=${JOURNEY_VERSION}`;
const appTag = `${FILES.app}?v=${JOURNEY_VERSION}`;
check(index.includes(`content="${BUILD_ID}"`) || index.includes(`content='${BUILD_ID}'`),
  'index.html build meta is not R113.79');
check(index.includes(manifestTag), 'index.html does not load the R113.70 image manifest');
check(index.includes(appTag), 'index.html does not load the R113.70 app asset');
check(index.indexOf(manifestTag) < index.indexOf(appTag), 'image manifest must load before the app asset');
check(sw.includes(`const BUILD_ID='${BUILD_ID}'`), 'sw.js BUILD_ID is not R113.79');
check(sw.includes(`todays-journey-image-manifest-r11370.js?v=${JOURNEY_VERSION}`),
  'sw.js does not precache the R113.70 image manifest');
check(sw.includes(`${FILES.app}?v=${JOURNEY_VERSION}`), 'sw.js does not precache the R113.70 app asset');
check(sw.includes(`./manifest.json?v=${VERSION}`), 'sw.js does not precache the R113.79 web manifest');
const coreLiteral = sw.match(/const CORE=(\[[\s\S]*?\]);/)?.[1];
let coreMissing = ['unable to parse CORE'];
if (coreLiteral) {
  const core = vm.runInNewContext(coreLiteral);
  coreMissing = core
    .map(item => String(item).split('?')[0].replace(/^\.\//, ''))
    .filter(Boolean)
    .filter(item => !fs.existsSync(path.join(ROOT, item)));
}
check(coreMissing.length === 0, `service worker CORE files missing: ${coreMissing.join(', ')}`);
check(build.includes(`id: '${BUILD_ID}'`), 'market-base-build.js ID is not R113.79');
check(build.includes("release: 'R113.79'"), 'market-base-build.js release is not R113.79');
check(build.includes(`assetVersion: '${VERSION}'`), 'market-base-build.js assetVersion is not R113.79');
check(!app.includes('写真を再取得中') && !app.includes('写真を再取得しています'),
  'old automatic retry placeholder text remains in the app');
check(!app.includes('ja.wikipedia.org/w/api.php'),
  'the unrelated Japanese Wikipedia image-candidate route remains in the app');
check(app.includes('journeyImageQueryVariants(entry).slice(0,2)'),
  'runtime fallback search must be capped at two short-query attempts');

for (const relativePath of [
  FILES.data,
  FILES.manifest,
  FILES.sw,
  FILES.build,
  FILES.app,
  FILES.builder,
  FILES.self
]) {
  const result = spawnSync(process.execPath, ['--check', path.join(ROOT, relativePath)], {
    encoding: 'utf8'
  });
  check(result.status === 0, `node --check failed for ${relativePath}: ${(result.stderr || result.stdout).trim()}`);
}

if (failures.length) {
  console.error(`FAIL — ${failures.length}/${checks} checks failed`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exit(1);
}

console.log(`PASS — ${checks} checks`);
console.log(`365/365 entries resolved; ${manifest.candidate_count} candidates validated.`);
console.log('Preferred files, external URLs/credits, R113.79 wiring, retry UI, and JS syntax are valid.');
