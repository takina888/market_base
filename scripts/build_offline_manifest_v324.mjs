import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'assets/js/market-base-offline-manifest-v324.js');
const textExtensions = new Set([
  '.html', '.js', '.css', '.json', '.csv', '.txt', '.xml', '.svg', '.webmanifest'
]);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const excludedDirectories = new Set([
  '.git', '.agents', '.codex', 'HANDOFF_DOCUMENTS', 'research', '__pycache__'
]);

function wikimediaRedirectFilename(source) {
  try {
    const url = new URL(source);
    if (url.hostname !== 'commons.wikimedia.org') return '';
    if (url.pathname === '/w/index.php') {
      const title = url.searchParams.get('title') || '';
      return title.replace(/^Special:Redirect\/file\//i, '').replace(/ /g, '_');
    }
    const decodedPath = decodeURIComponent(url.pathname);
    const matched = decodedPath.match(/^\/wiki\/Special:Redirect\/file\/(.+)$/i);
    return matched ? matched[1].replace(/ /g, '_') : '';
  } catch (_) {
    return '';
  }
}

function directWikimediaThumbnail(source, width = 960) {
  const filename = wikimediaRedirectFilename(source);
  // TIFF thumbnail paths need page/output-format metadata. Leave those URLs
  // untouched so the runtime can use its original-image fallback.
  if (!filename || /\.(?:tif|tiff)$/i.test(filename)) return '';
  const hash = crypto.createHash('md5').update(filename).digest('hex');
  const encoded = filename.split('/').map(encodeURIComponent).join('/');
  const outputSuffix = /\.svg$/i.test(filename) ? '.png' : '';
  return [
    'https://upload.wikimedia.org/wikipedia/commons/thumb',
    hash[0],
    hash.slice(0, 2),
    encoded,
    `${width}px-${encoded}${outputSuffix}`
  ].join('/');
}

function readBrowserData(relative) {
  const filename = path.join(root, relative);
  if (!fs.existsSync(filename)) return {};
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  return context.window;
}

function buildRemotePhotoAliases() {
  const sources = new Set();
  const journeyData = readBrowserData('data/images/todays-journey-image-manifest-r11370.js');
  const journey = journeyData.MARKET_BASE_TODAYS_JOURNEY_IMAGE_MANIFEST;
  for (const entry of Object.values(journey?.entries || {})) {
    for (const candidate of entry?.candidates || []) {
      if (candidate?.image_url) sources.add(candidate.image_url);
    }
  }

  const historyData = readBrowserData('data/world-history-today-v028.js');
  const history = historyData.MARKET_BASE_WORLD_HISTORY;
  for (const article of Object.values(history?.articles || {})) {
    if (article?.photo?.imageUrl) sources.add(article.photo.imageUrl);
  }

  return Object.fromEntries(
    [...sources]
      .map(source => [source, directWikimediaThumbnail(source)])
      .filter(([, target]) => !!target)
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function publicPath(file) {
  return `./${path.relative(root, file).split(path.sep).join('/')}`;
}

function shouldSkip(file) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const parts = relative.split('/');
  if (parts.some(part => excludedDirectories.has(part))) return true;
  if (relative.startsWith('scripts/')) return true;
  if (/(?:^|\/)test[-_].*\.(?:js|mjs|py)$/i.test(relative)) return true;
  if (/\.pyc$/i.test(relative)) return true;
  return false;
}

function walk(directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) walk(target, result);
    } else if (entry.isFile() && !shouldSkip(target)) {
      result.push(target);
    }
  }
  return result;
}

const files = walk(root);
const textAssets = [];
const supportAssets = [];
const localPhotoAssets = [];
const remotePhotoAliases = buildRemotePhotoAliases();

for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const extension = path.extname(file).toLowerCase();
  if (textExtensions.has(extension)) {
    if (relative !== 'assets/js/market-base-offline-manifest-v324.js') {
      textAssets.push(publicPath(file));
    }
    continue;
  }
  if (extension === '.woff2' || relative.startsWith('icons/')) {
    supportAssets.push(publicPath(file));
    continue;
  }
  if (!imageExtensions.has(extension)) continue;
  if (!relative.startsWith('assets/images/')) continue;
  if (
    relative.includes('/world-route/') ||
    relative.endsWith('market-base-world-wind-original.png') ||
    relative.endsWith('market-base-world-wind-ogp.png')
  ) continue;
  localPhotoAssets.push(publicPath(file));
}

textAssets.push('./assets/js/market-base-offline-manifest-v324.js');
textAssets.sort();
supportAssets.sort();
localPhotoAssets.sort();

const payload = {
  version: 'MARKET_BASE_OFFLINE_MANIFEST_V333_14_CACHE_REFRESH_STABILIZATION_20260804',
  generatedAt: '2026-08-04T13:30:00+08:00',
  datePhotoWindowDays: 10,
  textAssets,
  supportAssets,
  localPhotoAssets,
  remotePhotoAliases
};

const content = [
  '(function (global) {',
  "  'use strict';",
  `  global.MARKET_BASE_OFFLINE_MANIFEST = Object.freeze(${JSON.stringify(payload)});`,
  '})(self);',
  ''
].join('\n');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, content);
console.log(JSON.stringify({
  output: publicPath(output),
  textAssets: textAssets.length,
  supportAssets: supportAssets.length,
  localPhotoAssets: localPhotoAssets.length,
  remotePhotoAliases: Object.keys(remotePhotoAliases).length
}, null, 2));
