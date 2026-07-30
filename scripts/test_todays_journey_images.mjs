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
  updateController: 'assets/js/market-base-update-controller-v322.js',
  scrollController: 'assets/js/market-base-scroll-controls-r11328.js',
  workBasicsSw: 'work-basics/sw.js',
  registry: 'data/images/photo-registry-embedded.js',
  builder: 'scripts/build_todays_journey_image_manifest.mjs',
  self: 'scripts/test_todays_journey_images.mjs'
};
const BUILD_ID = 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730';
const VERSION = '20260730-v324-offline-music-precise-numbers';
const JOURNEY_VERSION = '20260730-v324';
const COMMON_THUMB_WIDTHS = new Set([20, 40, 60, 120, 250, 330, 500, 960, 1200, 1280, 1920, 3840]);
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
check(new Set((embedded || []).map(entry => entry.id)).size === 365, 'Today’s Journey IDs must be unique');
check(new Set((embedded || []).map(entry => entry.display_date)).size === 365,
  'Today’s Journey display dates must be unique');
check((embedded || []).every(entry => entry.text.startsWith(`${entry.title}。`)),
  'every Today’s Journey title must match the opening sentence');

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
check((embedded || []).every(entry => {
  const row = rows[entry.id];
  return row?.display_date === entry.display_date &&
    row?.country === entry.country &&
    row?.title === entry.title &&
    row?.candidates?.every(candidate =>
      candidate.caption === entry.title &&
      candidate.alt === `${entry.country}・${entry.title}`
    );
}), 'manifest article metadata does not match the embedded Journey master');

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
    const imageUrl = String(candidate?.image_url || '');
    const isUploadThumb = imageUrl.startsWith('https://upload.wikimedia.org/');
    const isCommonsRedirect = imageUrl.startsWith('https://commons.wikimedia.org/wiki/Special:Redirect/file/');
    if (!validHttps(candidate?.image_url)
      || (!isUploadThumb && !isCommonsRedirect)) {
      invalidCandidates.push(`${prefix}: invalid Wikimedia image_url`);
    }
    const thumbWidth = Number(
      imageUrl.match(/\/(?:[^/]*-)?(\d+)px-[^/]+$/)?.[1] ||
      new URL(imageUrl).searchParams.get('width') ||
      0
    );
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
const updateController = read(FILES.updateController);
const scrollController = read(FILES.scrollController);
const workBasicsSw = read(FILES.workBasicsSw);
const registry = evaluate(FILES.registry).MARKET_BASE_PHOTO_REGISTRY_EMBEDDED;
const manifestTag = `data/images/todays-journey-image-manifest-r11370.js?v=${JOURNEY_VERSION}`;
const appTag = `${FILES.app}?v=${JOURNEY_VERSION}`;
check(index.includes(`content="${BUILD_ID}"`) || index.includes(`content='${BUILD_ID}'`),
  'index.html build meta is not V323');
check(index.includes(manifestTag), 'index.html does not load the V323 image manifest');
check(index.includes(appTag), 'index.html does not load the V323 app asset');
check(index.indexOf(manifestTag) < index.indexOf(appTag), 'image manifest must load before the app asset');
check(sw.includes(`const BUILD_ID='${BUILD_ID}'`), 'sw.js BUILD_ID is not V323');
check(sw.includes(`todays-journey-image-manifest-r11370.js?v=${JOURNEY_VERSION}`),
  'sw.js does not precache the V323 image manifest');
check(sw.includes(`${FILES.app}?v=${JOURNEY_VERSION}`), 'sw.js does not precache the V323 app asset');
check(sw.includes(`./manifest.json?v=${JOURNEY_VERSION}`), 'sw.js does not precache the V323 web manifest');
check(sw.includes(`./assets/js/market-base-update-controller-v322.js?v=${JOURNEY_VERSION}`),
  'sw.js does not precache the common V323 update controller');
check(sw.includes(`./assets/js/market-base-scroll-controls-r11328.js?v=${JOURNEY_VERSION}`),
  'sw.js does not precache the V323 controller loader');
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
check(build.includes(`id: '${BUILD_ID}'`), 'market-base-build.js ID is not V323');
check(build.includes("release: 'V.324'"), 'market-base-build.js release is not V.324');
check(build.includes(`assetVersion: '${VERSION}'`), 'market-base-build.js assetVersion is not V323');
check(!app.includes('写真を再取得中') && !app.includes('写真を再取得しています'),
  'old automatic retry placeholder text remains in the app');
check(!app.includes('ja.wikipedia.org/w/api.php'),
  'the unrelated Japanese Wikipedia image-candidate route remains in the app');
check(app.includes('journeyImageQueryVariants(entry).slice(0,2)'),
  'runtime fallback search must be capped at two short-query attempts');
check(app.includes('todaysJourneySessionBaseDate'),
  'Today’s Journey must pin its base date for the page session');
check(!app.includes('Promise.any('),
  'Today’s Journey image selection must not depend on response-race order');
check(app.includes('const checks=await Promise.all(') &&
  app.includes('const selected=checks.find(item=>item.working);'),
  'Today’s Journey must choose the first working manifest candidate in configured order');
check(app.includes('if(!image&&options.forceSearch){'),
  'runtime image search must only run after an explicit manual retry');

const embeddedById = new Map((embedded || []).map(entry => [entry.id, entry]));
const linkedPhotos = (registry?.photos || []).filter(photo => photo.article_id);
check(linkedPhotos.length === 91, `photo registry must contain 91 linked Journey rows; got ${linkedPhotos.length}`);
check(linkedPhotos.every(photo => {
  const entry = embeddedById.get(photo.article_id);
  return entry &&
    photo.article_title_ja === entry.title &&
    photo.display_date === entry.display_date &&
    photo.country_name_ja === entry.country;
}), 'photo registry Journey metadata does not match the embedded master');

check(updateController.includes(`const BUILD_ID = '${BUILD_ID}'`),
  'common update controller BUILD_ID is not V323');
check(updateController.includes('meta[name="market-base-site-build"]') &&
  !updateController.includes('meta[name="market-base-build"]'),
  'common update controller must not compare legacy page-specific build metadata');
check(updateController.includes("cache: 'no-store'") &&
  updateController.includes("'Cache-Control': 'no-cache'"),
  'automatic version checks must bypass HTTP caches');
check(updateController.includes("startsWith('market-base-')"),
  'manual update must clear all MARKET BASE caches');
check(updateController.includes('BroadcastChannel') && updateController.includes('MARKET_BASE_RELOAD'),
  'manual update must notify other open MARKET BASE tabs');
check(scrollController.includes(`market-base-update-controller-v322.js?v=${JOURNEY_VERSION}`),
  'scroll controller must load the V323 common update controller');
check(workBasicsSw.includes('registration.unregister()') &&
  /startsWith\(["']market-base-work-basics-["']\)/.test(workBasicsSw),
  'legacy Work Basics service worker must clean up its cache and unregister');
check(!sw.includes('caches.match('),
  'root service worker must not use an unscoped match across old caches');
check(/\.filter\(key=>key!==CACHE_NAME\)\s*\.map\(key=>caches\.delete\(key\)\)/.test(sw),
  'root service worker must delete every prior MARKET BASE cache on activate');

function allFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? allFiles(absolute) : [absolute];
  });
}
const htmlFiles = allFiles(ROOT).filter(file => file.endsWith('.html'));
const uncoveredHtml = [];
const staleScrollTags = [];
const staleSiteBuildMeta = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(ROOT, file);
  const direct = html.includes(`market-base-update-controller-v322.js?v=${JOURNEY_VERSION}`);
  const viaLoader = html.includes(`market-base-scroll-controls-r11328.js?v=${JOURNEY_VERSION}`);
  if (!direct && !viaLoader) uncoveredHtml.push(relative);
  if (/market-base-scroll-controls-r11328\.js\?v=(?!20260730-v324)/.test(html)) {
    staleScrollTags.push(relative);
  }
  if (!html.includes(
    `<meta name="market-base-site-build" content="${BUILD_ID}">`
  )) {
    staleSiteBuildMeta.push(relative);
  }
}
check(htmlFiles.length === 36, `expected 36 HTML pages; got ${htmlFiles.length}`);
check(uncoveredHtml.length === 0,
  `HTML pages missing common update coverage: ${uncoveredHtml.join(', ')}`);
check(staleScrollTags.length === 0,
  `HTML pages retaining stale update-loader versions: ${staleScrollTags.join(', ')}`);
check(staleSiteBuildMeta.length === 0,
  `HTML pages missing the V323 site-build marker: ${staleSiteBuildMeta.join(', ')}`);

for (const relativePath of [
  FILES.data,
  FILES.manifest,
  FILES.sw,
  FILES.build,
  FILES.app,
  FILES.updateController,
  FILES.scrollController,
  FILES.workBasicsSw,
  FILES.registry,
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
console.log('V324 update coverage, Journey stability, registry synchronization, external credits, and JS syntax are valid.');
