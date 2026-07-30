import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'assets/js/market-base-offline-manifest-v324.js');
const textExtensions = new Set([
  '.html', '.js', '.css', '.json', '.csv', '.txt', '.xml', '.svg', '.webmanifest'
]);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const excludedDirectories = new Set([
  '.git', '.agents', '.codex', 'HANDOFF_DOCUMENTS', '__pycache__'
]);

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
  version: 'MARKET_BASE_OFFLINE_MANIFEST_V324_20260730',
  generatedAt: '2026-07-30T00:00:00+08:00',
  datePhotoWindowDays: 10,
  textAssets,
  supportAssets,
  localPhotoAssets
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
  localPhotoAssets: localPhotoAssets.length
}, null, 2));
