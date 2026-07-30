import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const routeDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.dirname(routeDir);
const buildId = 'MARKET_BASE_V324_OFFLINE_MUSIC_PRECISE_NUMBERS_20260730';

const dataSource = fs.readFileSync(path.join(routeDir, 'world-route-data.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(dataSource, sandbox, { filename: 'world-route-data.js' });
const data = sandbox.window.MB_WORLD_ROUTE_V323;

assert.equal(data.buildId, buildId);
assert.equal(data.countries.length, 20);
assert.equal(new Set(data.countries.map((country) => country.code)).size, 20);

const expectedCodes = [
  'TW', 'KR', 'CN', 'MN', 'VN', 'TH', 'SG', 'ID', 'IN', 'AE',
  'SA', 'TR', 'GB', 'NL', 'DE', 'US', 'CA', 'BR', 'AU', 'ZA'
];
assert.deepEqual(Array.from(data.countries, (country) => country.code), expectedCodes);

const forbiddenPublicTerms = [
  /\bWORK\b/i,
  /\bSRC-/i,
  /\bRT-/i,
  /\bRP-/i,
  /\bPT-/i,
  /\bLP-/i,
  /\bETA\b/i,
  /\bETD\b/i,
  /Cut-?off/i,
  /non-contractual/i,
  /\bmainline\b/i,
  /\bfeeder\b/i
];

for (const country of data.countries) {
  assert.ok(country.name);
  assert.ok(country.region);
  assert.ok(country.variants.length >= 1);
  assert.equal(
    new Set(country.variants.map((route) => route.key)).size,
    country.variants.length
  );

  for (const route of country.variants) {
    assert.ok(route.steps.length >= 2 && route.steps.length <= 5);
    assert.equal(route.steps[0].label, '日本');
    assert.ok(route.ports.length >= 1);
    assert.ok(!/(海峡|運河|太平洋|湾|喜望峰)$/.test(route.steps.at(-1).label));

    for (const step of route.steps) {
      assert.ok(Number.isFinite(step.lat) && step.lat >= -90 && step.lat <= 90);
      assert.ok(Number.isFinite(step.lon) && step.lon >= -180 && step.lon <= 180);
    }

    const publicText = [
      country.name,
      country.region,
      route.label,
      route.note,
      ...route.steps.map((step) => step.label),
      ...route.ports
    ].join(' ');
    forbiddenPublicTerms.forEach((pattern) => assert.doesNotMatch(publicText, pattern));
    assert.doesNotMatch(publicText, /\d+\s*日/);
  }

  for (const source of country.sources || []) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(source.label);
  }
}

const routesByCountry = Object.fromEntries(
  data.countries.map((country) => [country.code, country.variants])
);
assert.deepEqual(Array.from(routesByCountry.TW[0].steps, (step) => step.label), ['日本', '台北港']);
assert.deepEqual(Array.from(routesByCountry.CN[0].steps, (step) => step.label), ['日本', '上海港']);
assert.deepEqual(Array.from(routesByCountry.CN[1].steps, (step) => step.label), ['日本', '天津港']);
assert.deepEqual(Array.from(routesByCountry.CN[2].steps, (step) => step.label), ['日本', '塩田港']);
assert.deepEqual(Array.from(routesByCountry.AU[0].steps, (step) => step.label), ['日本', 'シドニー港']);
assert.equal(routesByCountry.US[1].steps.at(-1).label, 'ニューヨーク・ニュージャージー港');
assert.ok(!routesByCountry.US[1].steps.some((step) => step.label === 'サバンナ港'));
assert.deepEqual(
  Array.from(routesByCountry.ZA[1].steps, (step) => step.label),
  ['日本', 'シンガポール港', 'ケープタウン港']
);

function localReferences(htmlFile) {
  const htmlPath = path.join(siteDir, htmlFile);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const refs = [];
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:https?:|#|mailto:|tel:)/.test(value)) continue;
    refs.push(path.resolve(path.dirname(htmlPath), value.split(/[?#]/)[0]));
  }
  return { html, refs };
}

for (const htmlFile of ['world-route.html', 'world-route/index.html']) {
  const { html, refs } = localReferences(htmlFile);
  assert.match(html, new RegExp(buildId));
  assert.match(html, /data-mbx-refresh/);
  assert.match(html, /data-country-open/);
  assert.match(html, /data-route-map/);
  assert.match(html, /data-route-flow/);
  assert.match(html, /data-route-ports/);
  assert.match(html, /data-route-prev/);
  assert.match(html, /data-route-next/);
  assert.match(html, />戻る<\/a>/);
  assert.match(html, />メインページへ戻る<\/a>/);
  assert.doesNotMatch(html, /history\.back/);
  assert.doesNotMatch(html, /world-route\/images|images\/representative|images\/alternate/);
  assert.doesNotMatch(html, /mbx-tabs|role="tab"|data-tab/);
  assert.doesNotMatch(html, /\b(?:SRC|RT|RP|PT|LP)-/);
  refs.forEach((reference) => {
    assert.ok(fs.existsSync(reference), `${htmlFile}: missing ${reference}`);
  });
}

const routeCss = fs.readFileSync(path.join(routeDir, 'world-route.css'), 'utf8');
assert.match(routeCss, /\.\.\/assets\/maps\/world-map\.svg\?v=20260730-v324-simple-route/);
assert.ok(fs.existsSync(path.join(siteDir, 'assets/maps/world-map.svg')));

console.log('world-route v323 static checks: OK');
