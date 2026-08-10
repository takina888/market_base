#!/usr/bin/env node

/**
 * V333.19 Samsung Internet / PWA / TWA release contract.
 *
 * Default mode validates the source and Android build templates without
 * requiring a private signing key or a built APK:
 *   node scripts/test_v333_19_android_install_contract.mjs
 *
 * Release-ready mode additionally requires a configured public APK URL, a
 * signed APK, and the final Digital Asset Links file:
 *   node scripts/test_v333_19_android_install_contract.mjs \
 *     --release-ready --apk /path/to/app-release.apk \
 *     --assetlinks /path/to/assetlinks.json
 *
 * The device checks printed at the end are deliberately manual. A source-only
 * test cannot truthfully promise how a specific Play Protect build will score
 * an APK downloaded outside a store.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_ROOT = path.resolve(ROOT, '..', 'V333_18_source');
const ANDROID_ROOT = path.join(ROOT, 'android', 'market-base-twa');
const PUBLIC_BASE = new URL('https://takina888.github.io/market_base/');
const EXPECTED_PACKAGE = 'io.github.takina888.marketbase';
const EXPECTED_STABLE_PWA_ID =
  'https://takina888.github.io/market_base/?v=20260803-v333-10-cloudflare-web-analytics';
const RELEASE_TOKEN = '20260810-v333-19-android-install-stability';
const RELEASE_BUILD_ID = 'MARKET_BASE_V333_19_ANDROID_INSTALL_STABILITY_20260810';
const EXPECTED_NORMALIZED_RADIO_SHA256 = Object.freeze({
  'assets/css/market-base-dual-dock-v331.css': 'a4b1c9f69593fd93ca99c4d22505c5f4b3abfb0c7b4c60fb3866f643660fc3ec',
  'assets/css/market-base-radio-dock-v333-16.css': '878cac37613d28904f0879b1155e7d217fa8a4385f49c8a33bfe5f956d4a0d7b',
  'assets/css/market-base-scroll-controls-r11328.css': '56ba041685cab1c43920af7ac0464f2529b09d15bcd0920716307330deeee131',
  'assets/js/market-base-radio-dock-v333-16.js': 'a470a60481f5e9576b222b9d580172a027cfb39ebfb37c8f9ddadee47b0300e0',
  'assets/js/market-base-scroll-controls-r11328.js': '49071cb4f594d6d2704a0aa17a7628d4ee9158af2d8061c84ec993b990a6a817',
  'world-radio/assets/world-radio-player.css': 'c7cfb33102a70a5c785ff0bcbbe2e81c2aadc7ee6ecc04851860c6599ba7e21d',
  'world-radio/assets/world-radio-player.js': '0160747331db624fb71a9c3008844b51d8bd8fba2ec28448648c5047f5278830',
  'world-radio/assets/world-radio-stations.js': 'ff2c2e9f49f2628363f1de4d4109fd8021c73eac2dd5c4015490c8dc46636b5f',
  'world-radio/assets/world-radio.css': 'c0ab4b83676366a3b527d961c74f72416bcd4f7eb4e9a59e80d74c9f19e54980',
  'world-radio/assets/world-radio.js': '760fe03077063471867501a0a8feb10f9e2e2137fd69156875168fb9ccfe5169',
  'world-radio/index.html': 'e71e68ae63b7d6221e78e3ff49cfdc67ee4243d3ce6bb9d3d8e372629d796e3d',
  'world-radio/player.html': 'a09d2b412375eed950111939fa99e7e77172a9861075d15af5a9c82dea3e6eaf'
});

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv.includes('--help')) {
  console.log([
    'Usage:',
    '  node scripts/test_v333_19_android_install_contract.mjs',
    '  node scripts/test_v333_19_android_install_contract.mjs --release-ready',
    '    --apk /absolute/path/app-release.apk',
    '    --assetlinks /absolute/path/assetlinks.json'
  ].join('\n'));
  process.exit(0);
}

const releaseReady = process.argv.includes('--release-ready');
const apkPath = argumentValue('--apk');
const finalAssetLinksPath = argumentValue('--assetlinks');
const passes = [];
const failures = [];
const warnings = [];

function relative(filename) {
  return path.relative(ROOT, filename).replaceAll(path.sep, '/');
}

function read(relativePath, encoding = 'utf8') {
  return fs.readFileSync(path.join(ROOT, relativePath), encoding);
}

function readAbsolute(filename, encoding = 'utf8') {
  return fs.readFileSync(filename, encoding);
}

function requireFile(relativePath) {
  const filename = path.join(ROOT, relativePath);
  assert.ok(fs.existsSync(filename), `required file is missing: ${relativePath}`);
  assert.ok(fs.statSync(filename).isFile(), `expected a file: ${relativePath}`);
  return filename;
}

function contract(name, callback) {
  try {
    const detail = callback();
    passes.push({ name, ...(detail === undefined ? {} : { detail }) });
  } catch (error) {
    failures.push({ name, error: error?.message || String(error) });
  }
}

function warn(name, detail) {
  warnings.push({ name, detail });
}

function sha256(filename) {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

function sha256Value(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function pngDimensions(filename) {
  const bytes = fs.readFileSync(filename);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(bytes.length >= 24, `${relative(filename)} is too small to be a PNG`);
  assert.ok(bytes.subarray(0, 8).equals(pngSignature), `${relative(filename)} has no PNG signature`);
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR', `${relative(filename)} has no IHDR`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function extractTagAttributes(tag) {
  const attributes = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attributes;
}

function findCommand(candidates) {
  return candidates.find(command =>
    spawnSync(command, ['--version'], { encoding: 'utf8' }).status === 0
  );
}

function findPresentCommand(candidates) {
  return candidates.find(command => {
    const probe = spawnSync(command, [], { encoding: 'utf8' });
    return probe.error?.code !== 'ENOENT';
  });
}

function parseXmlPermissions(xml) {
  return [...xml.matchAll(/<uses-permission\b[^>]*android:name=["']([^"']+)["'][^>]*>/g)]
    .map(match => match[1]);
}

const manifest = JSON.parse(read('manifest.json'));
const indexHtml = read('index.html');
const helperSource = read('assets/js/market-base-install-helper-v333-19.js');
const shortcutHtml = read('install/samsung-shortcut.htm');
const swSource = read('sw.js');

contract('PWA identity stays compatible with the already-distributed V333.10 identity', () => {
  const resolved = new URL(manifest.id, PUBLIC_BASE).href;
  assert.equal(resolved, EXPECTED_STABLE_PWA_ID);
  assert.equal(
    manifest.id,
    './?v=20260803-v333-10-cloudflare-web-analytics',
    'the frozen legacy ID must not be replaced by the V333.19 cache token'
  );
  assert.ok(!manifest.id.includes('v333-19'), 'release tokens must never become a new PWA identity');
  return resolved;
});

contract('web app manifest remains installable and release-coherent', () => {
  assert.equal(manifest.version, 'V333.19');
  assert.equal(manifest.build_id, RELEASE_BUILD_ID);
  assert.ok(String(manifest.start_url).includes(RELEASE_TOKEN));
  assert.equal(new URL(manifest.scope, PUBLIC_BASE).href, PUBLIC_BASE.href);
  const startUrl = new URL(manifest.start_url, PUBLIC_BASE);
  assert.equal(startUrl.origin, PUBLIC_BASE.origin);
  assert.ok(startUrl.pathname.startsWith(PUBLIC_BASE.pathname));
  assert.ok(['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display));
  assert.ok(String(manifest.name || '').trim().length > 0);
  assert.ok(String(manifest.short_name || '').trim().length > 0);
  assert.notEqual(manifest.prefer_related_applications, true);
  return { startUrl: startUrl.href, scope: PUBLIC_BASE.href, display: manifest.display };
});

contract('PWA icons contain real 192px and 512px PNGs', () => {
  assert.ok(Array.isArray(manifest.icons), 'manifest icons must be an array');
  const requiredSizes = [192, 512];
  const found = [];
  for (const requiredSize of requiredSizes) {
    const icon = manifest.icons.find(item =>
      String(item.sizes || '').split(/\s+/).includes(`${requiredSize}x${requiredSize}`)
    );
    assert.ok(icon, `${requiredSize}x${requiredSize} icon is missing`);
    assert.equal(icon.type, 'image/png');
    assert.ok(/(?:^|\s)(?:any|maskable)(?:\s|$)/.test(icon.purpose || 'any'));
    const iconUrl = new URL(icon.src, PUBLIC_BASE);
    assert.equal(iconUrl.origin, PUBLIC_BASE.origin);
    assert.ok(iconUrl.pathname.startsWith(PUBLIC_BASE.pathname));
    const iconFile = requireFile(iconUrl.pathname.slice(PUBLIC_BASE.pathname.length));
    const dimensions = pngDimensions(iconFile);
    assert.deepEqual(dimensions, { width: requiredSize, height: requiredSize });
    assert.ok(fs.statSync(iconFile).size > 1024, `${relative(iconFile)} looks empty`);
    found.push({ size: requiredSize, file: relative(iconFile) });
  }
  return found;
});

contract('index links one same-origin V333.19 manifest and the install helper assets', () => {
  const manifestTags = [...indexHtml.matchAll(/<link\b[^>]*\brel=["'][^"']*manifest[^"']*["'][^>]*>/gi)]
    .map(match => match[0]);
  assert.equal(manifestTags.length, 1, 'index.html must link exactly one web app manifest');
  const manifestHref = extractTagAttributes(manifestTags[0]).href;
  const linkedManifest = new URL(manifestHref, PUBLIC_BASE);
  assert.equal(linkedManifest.origin, PUBLIC_BASE.origin);
  assert.equal(linkedManifest.pathname, `${PUBLIC_BASE.pathname}manifest.json`);
  assert.equal(linkedManifest.searchParams.get('v'), RELEASE_TOKEN);
  assert.match(indexHtml, /assets\/css\/market-base-install-helper-v333-19\.css\?v=20260810-v333-19-android-install-stability/);
  assert.match(indexHtml, /assets\/js\/market-base-install-helper-v333-19\.js\?v=20260810-v333-19-android-install-stability/);
});

let configuredPackageUrl = '';
contract('Samsung Internet suppresses only its generated WebAPK prompt', () => {
  const guard = helperSource.indexOf('if (!isSamsungInternet) return;');
  const listener = helperSource.indexOf("window.addEventListener('beforeinstallprompt'");
  assert.ok(guard >= 0 && listener > guard, 'Samsung UA guard must run before installing the prompt handler');
  assert.match(helperSource, /var SAMSUNG_UA = \/SamsungBrowser\\\//i);
  assert.match(helperSource, /beforeinstallprompt[\s\S]*?event\.preventDefault\(\)/);
  assert.ok(!/\bevent\.prompt\s*\(/.test(helperSource), 'the Samsung WebAPK prompt must never be invoked');
  assert.match(helperSource, /dialog\.id = 'mbInstallHelpDialog'/);
  for (const action of ['android-package', 'samsung-shortcut', 'chrome']) {
    assert.ok(helperSource.includes(`data-mb-install-action="${action}"`), `missing ${action} action`);
  }
  assert.ok(helperSource.includes('install/samsung-shortcut.htm'));
  assert.match(helperSource, /package=com\.android\.chrome/);
  assert.match(helperSource, /window\.MarketBaseInstallHelp = Object\.freeze/);
});

contract('official APK action is fail-closed until an HTTPS package is configured', () => {
  const metaTags = [...indexHtml.matchAll(/<meta\b[^>]*\bname=["']market-base-android-package-url["'][^>]*>/gi)]
    .map(match => match[0]);
  assert.equal(metaTags.length, 1, 'one Android package URL meta tag is required');
  configuredPackageUrl = String(extractTagAttributes(metaTags[0]).content || '').trim();
  assert.match(helperSource, /data-mb-install-action="android-package" hidden/);
  assert.match(helperSource, /if \(packageUrl\) \{[\s\S]*?packageAction\.hidden = false;/);
  assert.match(helperSource, /url\.protocol\s*===\s*'https:'/, 'helper must reject non-HTTPS APK URLs');
  assert.ok(!/\^\(https\?\)/.test(helperSource), 'helper must not allow insecure HTTP APK URLs');
  if (configuredPackageUrl) {
    const url = new URL(configuredPackageUrl, PUBLIC_BASE);
    assert.equal(url.protocol, 'https:', 'official APK downloads must use HTTPS');
    assert.ok(/\.apk(?:$|[?#])/i.test(url.href), 'configured package URL must identify an APK');
    return url.href;
  }
  warn(
    'APK distribution is staged, not yet active',
    'market-base-android-package-url is empty; the source intentionally hides the APK button until a signed release URL exists'
  );
  if (releaseReady) assert.fail('release-ready mode requires a configured HTTPS APK URL');
  return 'hidden';
});

contract('Samsung shortcut page cannot trigger PWA/WebAPK installation', () => {
  assert.ok(!/<link\b[^>]*\brel=["'][^"']*manifest/i.test(shortcutHtml));
  assert.ok(!/beforeinstallprompt|\.prompt\s*\(/.test(shortcutHtml));
  assert.match(shortcutHtml, /ページを追加/);
  assert.match(shortcutHtml, /ホーム画面/);
  assert.match(shortcutHtml, /#open-market-base/);
  assert.match(shortcutHtml, /\.\.\/index\.html\?from=samsung-shortcut/);
});

contract('radio implementation matches the frozen V333.18 contract except for the release token', () => {
  const fixedFiles = [
    'assets/js/market-base-radio-dock-v333-16.js',
    'assets/css/market-base-radio-dock-v333-16.css',
    'assets/css/market-base-dual-dock-v331.css',
    'assets/js/market-base-scroll-controls-r11328.js',
    'assets/css/market-base-scroll-controls-r11328.css'
  ];
  const radioDirectory = path.join(ROOT, 'world-radio');
  const queue = [radioDirectory];
  while (queue.length) {
    const directory = queue.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) queue.push(absolute);
      else if (entry.isFile()) fixedFiles.push(relative(absolute));
    }
  }
  const sortedFiles = fixedFiles.sort();
  assert.deepEqual(
    sortedFiles,
    Object.keys(EXPECTED_NORMALIZED_RADIO_SHA256).sort(),
    'the frozen radio file inventory changed'
  );
  for (const relativePath of sortedFiles) {
    const current = requireFile(relativePath);
    const baseline = path.join(BASELINE_ROOT, relativePath);
    const extension = path.extname(relativePath).toLowerCase();
    if (['.js', '.css', '.html', '.json'].includes(extension)) {
      const normalizeReleaseIdentity = source => source
        .replaceAll('20260810-v333-18-cache-radio-navigation-stability', '__RELEASE_TOKEN__')
        .replaceAll('20260810-v333-19-android-install-stability', '__RELEASE_TOKEN__')
        .replaceAll('MARKET_BASE_V333_18_CACHE_RADIO_NAVIGATION_STABILITY_20260810', '__BUILD_ID__')
        .replaceAll('MARKET_BASE_V333_19_ANDROID_INSTALL_STABILITY_20260810', '__BUILD_ID__');
      const normalizedCurrent = normalizeReleaseIdentity(fs.readFileSync(current, 'utf8'));
      assert.equal(sha256Value(normalizedCurrent), EXPECTED_NORMALIZED_RADIO_SHA256[relativePath],
        `frozen radio hash mismatch: ${relativePath}`);
      if (fs.existsSync(baseline)) {
        assert.equal(
          normalizedCurrent,
          normalizeReleaseIdentity(fs.readFileSync(baseline, 'utf8')),
          `radio regression beyond the mechanical release token: ${relativePath}`
        );
      }
    } else {
      assert.equal(sha256(current), EXPECTED_NORMALIZED_RADIO_SHA256[relativePath],
        `frozen radio binary hash mismatch: ${relativePath}`);
      if (fs.existsSync(baseline)) {
        assert.equal(sha256(current), sha256(baseline), `radio binary changed: ${relativePath}`);
      }
    }
  }
  return { files: fixedFiles.length, externalBaselineCompared: fs.existsSync(BASELINE_ROOT) };
});

contract('existing radio drag, collision, lifetime, and viewport contract still passes', () => {
  const test = path.join(ROOT, 'scripts', 'test_v333_16_radio_dock_contract.mjs');
  const result = spawnSync(process.execPath, [test], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout || ''}\n${result.stderr || ''}`.trim());
  assert.match(result.stdout, /PASS/);
  return result.stdout.trim().split(/\r?\n/).at(-1);
});

contract('offline manifest generation is coherent with V333.19 and includes install guidance', () => {
  const currentPath = requireFile('assets/js/market-base-offline-manifest-v335.js');
  const previousAliasPath = requireFile('assets/js/market-base-offline-manifest-v334.js');
  const compatibilityPath = requireFile('assets/js/market-base-offline-manifest-v324.js');
  assert.equal(
    sha256(currentPath),
    sha256(previousAliasPath),
    'previous offline manifest alias must remain byte-identical'
  );
  assert.equal(
    sha256(currentPath),
    sha256(compatibilityPath),
    'offline manifest compatibility alias must remain byte-identical'
  );
  const context = { self: {} };
  vm.runInNewContext(fs.readFileSync(currentPath, 'utf8'), context, {
    filename: 'market-base-offline-manifest-v335.js'
  });
  const offlineManifest = context.self.MARKET_BASE_OFFLINE_MANIFEST;
  assert.ok(offlineManifest, 'offline manifest global was not initialized');
  assert.equal(
    offlineManifest.version,
    'MARKET_BASE_OFFLINE_MANIFEST_V333_19_ANDROID_INSTALL_STABILITY_20260810'
  );
  assert.equal(offlineManifest.buildId, RELEASE_BUILD_ID);
  assert.equal(offlineManifest.assetVersion, RELEASE_TOKEN);
  const textAssets = Array.from(offlineManifest.textAssets || []);
  for (const asset of [
    './assets/js/market-base-install-helper-v333-19.js',
    './assets/css/market-base-install-helper-v333-19.css',
    './install/samsung-shortcut.htm',
    './manifest.json'
  ]) {
    assert.ok(textAssets.includes(asset), `offline manifest is missing ${asset}`);
  }
  return { textAssets: textAssets.length };
});

contract('service worker keeps live radio outside CacheStorage and ships the install helper', () => {
  assert.match(swSource, new RegExp(`const BUILD_ID='${RELEASE_BUILD_ID}'`));
  assert.match(swSource, new RegExp(`const ASSET_VERSION='${RELEASE_TOKEN}'`));
  assert.match(swSource, /const isLiveMedia=event\.request\.destination==='audio'[\s\S]*?event\.request\.headers\.has\('Range'\)/);
  const bypass = swSource.indexOf('if(isLiveMedia)return;');
  const respondWith = swSource.indexOf('event.respondWith', bypass);
  assert.ok(bypass >= 0 && respondWith > bypass, 'live media must bypass before respondWith');
  const requiredLiteral = swSource.match(/const REQUIRED=(\[[\s\S]*?\]);/)?.[1];
  assert.ok(requiredLiteral, 'service worker REQUIRED list is missing');
  const required = vm.runInNewContext(requiredLiteral);
  assert.ok(Array.isArray(required));
  for (const asset of required) {
    assert.ok(
      !/\.(?:m3u8|m4s|ts|aac|mp3|ogg|oga|opus|wav)(?:$|[?#])/i.test(String(asset)),
      `live media must not be pre-cached: ${asset}`
    );
  }
  for (const asset of [
    'assets/js/market-base-install-helper-v333-19.js',
    'assets/css/market-base-install-helper-v333-19.css',
    'install/samsung-shortcut.htm',
    'manifest.json'
  ]) {
    assert.ok(swSource.includes(asset), `service worker release shell is missing ${asset}`);
  }
  assert.match(swSource, /manifest\.json\?v=20260810-v333-19-android-install-stability/);
  return { requiredAssets: required.length, mediaAssets: 0 };
});

const androidFiles = {
  settings: 'android/market-base-twa/settings.gradle.kts',
  rootBuild: 'android/market-base-twa/build.gradle.kts',
  appBuild: 'android/market-base-twa/app/build.gradle.kts',
  manifest: 'android/market-base-twa/app/src/main/AndroidManifest.xml',
  strings: 'android/market-base-twa/app/src/main/res/values/strings.xml',
  assetLinksTemplate: 'android/market-base-twa/digital-asset-links/assetlinks.json.template',
  workflowTemplate: 'android/market-base-twa/github-actions/build-market-base-android.yml',
  readme: 'android/market-base-twa/README.md'
};

contract('Android wrapper is a TWA project targeting Android API 36', () => {
  Object.values(androidFiles).forEach(requireFile);
  const settings = read(androidFiles.settings);
  const rootBuild = read(androidFiles.rootBuild);
  const appBuild = read(androidFiles.appBuild);
  const androidManifest = read(androidFiles.manifest);
  const strings = read(androidFiles.strings);
  const launcherPath = 'android/market-base-twa/app/src/main/java/io/github/takina888/marketbase/LauncherActivity.java';
  const launcher = read(launcherPath);
  const allProjectText = [settings, rootBuild, appBuild, androidManifest, strings, launcher].join('\n');
  assert.match(appBuild, /compileSdk\s*=\s*36\b/);
  assert.match(appBuild, /targetSdk\s*=\s*36\b/);
  const minSdk = Number(appBuild.match(/minSdk\s*=\s*(\d+)/)?.[1]);
  assert.ok(Number.isInteger(minSdk) && minSdk >= 23 && minSdk <= 36, `unexpected minSdk: ${minSdk}`);
  assert.match(appBuild, new RegExp(`(?:applicationId|namespace)\\s*=\\s*"${EXPECTED_PACKAGE.replaceAll('.', '\\.')}"`));
  assert.match(allProjectText, /com\.google\.androidbrowserhelper:androidbrowserhelper/);
  assert.match(launcher, /extends\s+com\.google\.androidbrowserhelper\.trusted\.LauncherActivity/);
  assert.ok(!/android\.webkit\.WebView|\bWebView\s*\(/.test(allProjectText), 'wrapper must be TWA, not WebView');
  assert.match(appBuild, /versionCode\s*=\s*[1-9]\d*/);
  assert.match(appBuild, /versionName\s*=\s*"333\.19(?:\.\d+)?"/);
  return { packageName: EXPECTED_PACKAGE, compileSdk: 36, targetSdk: 36, minSdk };
});

contract('Android manifest exposes only the HTTPS MARKET BASE route with minimal permissions', () => {
  const androidManifest = read(androidFiles.manifest);
  const strings = read(androidFiles.strings);
  assert.match(androidManifest, /android:exported=["']true["']/);
  assert.match(androidManifest, /android:scheme=["']https["']/);
  assert.match(androidManifest, /takina888\.github\.io/);
  assert.match(androidManifest, /\/market_base\/?/);
  assert.match([androidManifest, strings].join('\n'), /https:\/\/takina888\.github\.io\/market_base\//);
  assert.match(androidManifest, /android:usesCleartextTraffic=["']false["']/);
  assert.ok(!/android:requestLegacyExternalStorage=["']true["']/.test(androidManifest));
  const permissions = parseXmlPermissions(androidManifest);
  const allowedPermissions = new Set([
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE'
  ]);
  for (const permission of permissions) {
    assert.ok(allowedPermissions.has(permission), `unnecessary Android permission: ${permission}`);
  }
  const forbidden = [
    'CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'WRITE_CONTACTS',
    'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION',
    'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'MANAGE_EXTERNAL_STORAGE',
    'REQUEST_INSTALL_PACKAGES', 'QUERY_ALL_PACKAGES', 'READ_PHONE_STATE'
  ];
  for (const name of forbidden) {
    assert.ok(!androidManifest.includes(`android.permission.${name}`), `forbidden permission: ${name}`);
  }
  return { permissions };
});

let assetLinksTemplate;
contract('Digital Asset Links template binds the release package at the origin root', () => {
  assetLinksTemplate = JSON.parse(read(androidFiles.assetLinksTemplate));
  assert.ok(Array.isArray(assetLinksTemplate) && assetLinksTemplate.length === 1);
  const statement = assetLinksTemplate[0];
  assert.ok(statement.relation.includes('delegate_permission/common.handle_all_urls'));
  assert.equal(statement.target.namespace, 'android_app');
  assert.equal(statement.target.package_name, EXPECTED_PACKAGE);
  assert.ok(Array.isArray(statement.target.sha256_cert_fingerprints));
  assert.equal(statement.target.sha256_cert_fingerprints.length, 1);
  const templateFingerprint = statement.target.sha256_cert_fingerprints[0];
  assert.match(templateFingerprint, /REPLACE|PLACEHOLDER|SHA256/i, 'template must not pretend to contain a release certificate');
  assert.ok(
    !fs.existsSync(path.join(ROOT, '.well-known', 'assetlinks.json')),
    'placing assetlinks.json inside this project would publish /market_base/.well-known, not the required origin-root path'
  );
  const readme = read(androidFiles.readme);
  assert.ok(readme.includes('https://takina888.github.io/.well-known/assetlinks.json'));
  assert.ok(!readme.includes('https://takina888.github.io/market_base/.well-known/assetlinks.json'));
  return 'https://takina888.github.io/.well-known/assetlinks.json';
});

contract('release signing is secret-backed, stable across updates, and never publishes debug APKs', () => {
  const appBuild = read(androidFiles.appBuild);
  const workflow = read(androidFiles.workflowTemplate);
  const readme = read(androidFiles.readme);
  assert.match(appBuild, /signingConfigs/);
  assert.match(appBuild, /signingConfig\s*=\s*signingConfigs/);
  assert.ok(/System\.getenv|providers\.environmentVariable|gradleProperty/.test(appBuild));
  assert.ok(!/storePassword\s*=\s*"(?!\$|REPLACE|PLACEHOLDER)[^"]+"/.test(appBuild));
  assert.ok(!/keyPassword\s*=\s*"(?!\$|REPLACE|PLACEHOLDER)[^"]+"/.test(appBuild));
  assert.match(workflow, /secrets\.[A-Z0-9_]+/);
  assert.match(workflow, /assembleRelease/);
  assert.match(workflow, /verify --verbose --print-certs/);
  assert.match(workflow, /APKSIGNER/);
  assert.match(workflow, /upload-artifact/);
  assert.ok(!/app-debug\.apk/.test(workflow), 'debug APK must never be an uploaded artifact');
  assert.ok(/versionCode/i.test(readme));
  assert.ok(/same|同じ|保存|紛失|keep/i.test(readme), 'README must explain keeping the signing identity');
  const secretFiles = [];
  const queue = [ANDROID_ROOT];
  while (queue.length) {
    const directory = queue.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) queue.push(absolute);
      else if (/\.(?:jks|keystore|p12|pfx|pem|key)$/i.test(entry.name)) secretFiles.push(relative(absolute));
    }
  }
  assert.deepEqual(secretFiles, [], `private signing material must not be committed: ${secretFiles.join(', ')}`);
});

contract('GitHub build template installs API 36 and preserves a verifiable release artifact', () => {
  const workflow = read(androidFiles.workflowTemplate);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /java-version:\s*["']?17/);
  assert.match(workflow, /android-36|compileSdk\s*36|API 36/i);
  assert.match(workflow, /gradlew[^\n]*assembleRelease/);
  assert.match(workflow, /app-release\.apk/);
  assert.match(workflow, /sha256sum|Get-FileHash/i);
  assert.match(workflow, /permissions:\s*[\s\S]*?contents:\s*read/);
});

contract('documentation does not claim that a web manifest can fix Samsung-generated WebAPK targetSdk', () => {
  const readme = read(androidFiles.readme);
  assert.match(readme, /Samsung Internet/i);
  assert.match(readme, /targetSdk|対象API|API 36/i);
  assert.match(readme, /Play Protect/i);
  assert.match(readme, /提供元|unknown source|不明なアプリ|source/i);
  assert.ok(!/Play Protect.{0,20}(?:off|disable|無効|切る)/i.test(readme));
  assert.ok(!/(?:off|disable|無効|切る).{0,20}Play Protect/i.test(readme));
});

let verifiedApkFingerprint = '';
if (releaseReady) {
  contract('release APK exists and passes Android signature verification', () => {
    assert.ok(apkPath, '--release-ready requires --apk');
    const absoluteApk = path.resolve(apkPath);
    assert.ok(fs.existsSync(absoluteApk), `APK does not exist: ${absoluteApk}`);
    assert.ok(fs.statSync(absoluteApk).size > 50_000, 'APK is unexpectedly small');
    const apksigner = findCommand(['apksigner']);
    assert.ok(apksigner, 'apksigner is required for --release-ready verification');
    const verify = spawnSync(apksigner, ['verify', '--verbose', '--print-certs', absoluteApk], {
      encoding: 'utf8'
    });
    assert.equal(verify.status, 0, `${verify.stdout}\n${verify.stderr}`.trim());
    const signatureOutput = `${verify.stdout}\n${verify.stderr}`;
    assert.match(signatureOutput, /Verified|Signer #1 certificate SHA-256 digest/i);
    const rawFingerprint = signatureOutput.match(
      /Signer #1 certificate SHA-256 digest:\s*([0-9a-f]{64})/i
    )?.[1];
    assert.ok(rawFingerprint, 'apksigner did not report the release certificate SHA-256 digest');
    verifiedApkFingerprint = rawFingerprint
      .toUpperCase()
      .match(/.{2}/g)
      .join(':');

    const manifestTool = findPresentCommand(['apkanalyzer', 'aapt2', 'aapt']);
    assert.ok(manifestTool, 'apkanalyzer, aapt2, or aapt is required to inspect the built APK targetSdk');
    let packageName;
    let versionCode;
    let versionName;
    let minSdk;
    let targetSdk;
    let permissions;
    if (manifestTool === 'apkanalyzer') {
      const analyzerValue = verb => {
        const output = spawnSync(manifestTool, ['manifest', verb, absoluteApk], { encoding: 'utf8' });
        assert.equal(output.status, 0, `${output.stdout}\n${output.stderr}`.trim());
        return String(output.stdout).trim();
      };
      packageName = analyzerValue('application-id');
      versionCode = Number(analyzerValue('version-code'));
      versionName = analyzerValue('version-name');
      minSdk = Number(analyzerValue('min-sdk'));
      targetSdk = Number(analyzerValue('target-sdk'));
      permissions = analyzerValue('permissions').split(/\r?\n/).filter(Boolean);
      const printedManifest = analyzerValue('print');
      assert.match(
        printedManifest,
        /io\.github\.takina888\.marketbase\.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION[\s\S]*?android:protectionLevel="0x2"|android:protectionLevel="0x2"[\s\S]*?io\.github\.takina888\.marketbase\.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION/,
        'AndroidX receiver guard must remain a signature-level app-local permission'
      );
    } else {
      const badging = spawnSync(manifestTool, ['dump', 'badging', absoluteApk], { encoding: 'utf8' });
      assert.equal(badging.status, 0, `${badging.stdout}\n${badging.stderr}`.trim());
      const output = String(badging.stdout);
      packageName = output.match(/^package: name='([^']+)'/m)?.[1];
      versionCode = Number(output.match(/^package:[^\n]*versionCode='(\d+)'/m)?.[1]);
      versionName = output.match(/^package:[^\n]*versionName='([^']+)'/m)?.[1];
      minSdk = Number(output.match(/^sdkVersion:'(\d+)'/m)?.[1]);
      targetSdk = Number(output.match(/^targetSdkVersion:'(\d+)'/m)?.[1]);
      const permissionDump = spawnSync(manifestTool, ['dump', 'permissions', absoluteApk], {
        encoding: 'utf8'
      });
      assert.equal(permissionDump.status, 0, `${permissionDump.stdout}\n${permissionDump.stderr}`.trim());
      permissions = [...String(permissionDump.stdout).matchAll(/uses-permission: name='([^']+)'/g)]
        .map(match => match[1]);
    }
    assert.equal(packageName, EXPECTED_PACKAGE);
    assert.equal(versionCode, 33319);
    assert.equal(versionName, '333.19');
    assert.equal(minSdk, 23);
    assert.equal(targetSdk, 36, 'the built APK itself must target API 36');
    const expectedPermissions = new Set([
      'android.permission.INTERNET',
      `${EXPECTED_PACKAGE}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`
    ]);
    assert.ok(permissions.includes('android.permission.INTERNET'));
    for (const permission of permissions) {
      assert.ok(expectedPermissions.has(permission), `built APK contains an unexpected permission: ${permission}`);
    }

    const checksumFile = path.join(
      path.dirname(absoluteApk),
      'MARKET_BASE_V333_19_ANDROID_SHA256_20260810.txt'
    );
    assert.ok(fs.existsSync(checksumFile), `APK checksum file is missing: ${checksumFile}`);
    const expectedApkSha256 = fs.readFileSync(checksumFile, 'utf8').trim().split(/\s+/, 1)[0];
    assert.match(expectedApkSha256, /^[0-9a-f]{64}$/i);
    assert.equal(expectedApkSha256.toLowerCase(), sha256(absoluteApk));

    return {
      apk: absoluteApk,
      bytes: fs.statSync(absoluteApk).size,
      sha256: sha256(absoluteApk),
      certificateSha256: verifiedApkFingerprint,
      packageName,
      versionCode,
      versionName,
      minSdk,
      targetSdk,
      permissions
    };
  });

  contract('final origin-root assetlinks contains the real APK signing fingerprint', () => {
    assert.ok(finalAssetLinksPath, '--release-ready requires --assetlinks');
    const absoluteAssetLinks = path.resolve(finalAssetLinksPath);
    const document = JSON.parse(readAbsolute(absoluteAssetLinks));
    assert.ok(Array.isArray(document) && document.length >= 1);
    const statement = document.find(item => item?.target?.package_name === EXPECTED_PACKAGE);
    assert.ok(statement, `assetlinks has no ${EXPECTED_PACKAGE} statement`);
    assert.ok(statement.relation?.includes('delegate_permission/common.handle_all_urls'));
    const fingerprints = statement.target.sha256_cert_fingerprints;
    assert.ok(Array.isArray(fingerprints) && fingerprints.length >= 1);
    for (const fingerprint of fingerprints) {
      assert.match(fingerprint, /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/i);
      assert.ok(!/REPLACE|PLACEHOLDER|SHA256/i.test(fingerprint));
    }
    assert.ok(verifiedApkFingerprint, 'APK fingerprint must be verified before assetlinks');
    assert.ok(
      fingerprints.map(value => value.toUpperCase()).includes(verifiedApkFingerprint),
      'origin-root assetlinks fingerprint does not match the signed APK'
    );
    return { file: absoluteAssetLinks, fingerprints: fingerprints.length };
  });
}

const manualDeviceContract = [
  {
    id: 'SAMSUNG-WEB-01',
    device: 'Samsung Internet, current stable',
    action: 'Open /market_base/?install=samsung',
    expected: 'No browser-generated WebAPK prompt is invoked; the MARKET BASE guidance dialog opens.'
  },
  {
    id: 'SAMSUNG-SHORTCUT-02',
    device: 'Samsung Internet, current stable',
    action: 'Open the shortcut page and use Page to add > Home screen',
    expected: 'A browser shortcut is created without an APK and opens MARKET BASE on the next launch.'
  },
  {
    id: 'SAMSUNG-APK-03',
    device: 'Samsung phone with Play Protect enabled',
    action: 'Download the signed release APK from the configured HTTPS link and open it',
    expected: 'The package installer opens. A per-source install permission and/or Play Protect scan may still appear for direct distribution.'
  },
  {
    id: 'TARGET-SDK-04',
    device: 'Current Android / Samsung phone',
    action: 'Install the API 36 release APK',
    expected: 'The specific “built for an older version of Android” target-SDK warning does not appear.'
  },
  {
    id: 'DAL-TWA-05',
    device: 'Online device with a browser that supports TWA',
    action: 'Launch the installed package after origin-root assetlinks is live',
    expected: 'MARKET BASE opens at /market_base/ as a verified TWA without a browser URL bar.'
  },
  {
    id: 'UPDATE-06',
    device: 'Device with the immediately previous signed MARKET BASE APK',
    action: 'Install a higher-versionCode APK signed by the same release key',
    expected: 'Android accepts it as an in-place update and retains app identity/data.'
  },
  {
    id: 'RADIO-SW-07',
    device: 'Samsung and non-Samsung Android phones',
    action: 'Play radio, background/foreground the app, wait, change pages, then stop/restart',
    expected: 'No catch-up/fast-forward playback; drag still works; live audio and Range requests bypass the service worker.'
  }
];

const result = {
  ok: failures.length === 0,
  mode: releaseReady ? 'release-ready' : 'source-template',
  root: ROOT,
  passes,
  warnings,
  failures,
  releaseState: {
    pwaIdentity: 'frozen-v333.10-compatible',
    androidPackageUrlConfigured: Boolean(configuredPackageUrl),
    staticTargetSdk: 36,
    apkSignatureVerified: releaseReady && Boolean(apkPath) && failures.every(item => item.name !== 'release APK exists and passes Android signature verification'),
    deviceChecksRequired: true
  },
  manualDeviceContract
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
