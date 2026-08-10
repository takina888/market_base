#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const app=read('assets/js/app-v273-country-profile-r28-refresh-route-header-r99.js');
const html=read('index.html');
const fullSearchPath='embedded-cross-db-search-index-v273-db-title-r27.js';

// The home boot may await only the three compact core files. All ten former
// optional files must be addressable by deduplicated, first-use groups without
// an idle/boot sweep.
const boot=app.slice(app.indexOf('async function boot()'),app.indexOf('function openEntityByAnyCode'));
assert(!boot.includes('optionalSpecs'),'boot must not construct the former ten-file optional batch');
assert(!boot.includes('Promise.allSettled'),'boot must not start an optional all-at-once sweep');
assert.match(app,/const OPTIONAL_DATA_SPECS=Object\.freeze\(\{/);
assert.match(app,/const OPTIONAL_DATA_GROUPS=Object\.freeze\(\{/);
for(const group of ['rice','school','japan','rankings','compare','detail','staging']){
  assert.match(app,new RegExp(`\\n  ${group}:\\[`),`missing optional group: ${group}`);
}
for(const key of [
  'rice_data','rice_rankings','school_meals_data','school_meals_rankings',
  'priority4_ready','wdi_country_metadata','japan_related_data',
  'japan_related_rankings','japanese_restaurants_overview',
  'overseas_japanese_residents_overview'
]){
  assert.match(app,new RegExp(`\\n  ${key}:'data/`),`missing optional data path: ${key}`);
}
assert.match(app,/const optionalDataPromises=new Map\(\);/,'optional requests must deduplicate in-flight route intents');
assert.match(app,/applyOptionalMarketBaseDataset\(\{\[key\]:value\}\)/,'each arriving file must update the current UI independently');
assert.match(app,/\.finally\(\(\)=>optionalDataPromises\.delete\(key\)\)/,'failed requests must be retryable');
assert.match(app,/ensureOptionalDataForView\(requestedCompare\?'compare':targetView/,'view navigation must request only its own optional group');
assert.match(app,/function setRankingCompareTab[\s\S]{0,700}ensureOptionalDataForView\(next,\{reason:'ranking-compare-tab'\}\)/,'direct compare/rankings routes must load the sibling data only when its tab is first used');
assert.match(app,/compare:\['rice_data','school_meals_data','japan_related_data','rice_rankings','school_meals_rankings','japan_related_rankings'\]/,'direct compare must load both its fixed metrics and sibling ranking choices');
assert.match(app,/const COMPARE_RICE_METRICS=\[/);
assert.match(app,/const COMPARE_SCHOOL_METRICS=\[/);
assert.match(app,/const COMPARE_JAPAN_METRICS=\[/);
const optionalLoader=app.slice(app.indexOf('const OPTIONAL_DATA_SPECS'),app.indexOf('function showMarketBaseLoadError'));
assert(!optionalLoader.includes('requestIdleCallback'),'optional JSON must have no idle warmup path');

// A direct route can race core boot. Applying the core result must preserve an
// optional group that completed first.
const coreApply=app.slice(app.indexOf('function applyMarketBaseDataset'),app.indexOf('function applyOptionalMarketBaseDataset'));
assert.match(coreApply,/Object\.keys\(OPTIONAL_DATA_SPECS\)[\s\S]*?optionalDataReady\.add\(key\)/,'embedded fallback data must suppress duplicate route downloads');
assert.match(coreApply,/riceData=bundle\.rice_data\|\|riceData;/);
assert.match(coreApply,/japanRelatedData=bundle\.japan_related_data\|\|japanRelatedData;/);

// The 5 MB cross-database index is loaded only after explicit search intent,
// never merely because an input received focus. Loading state remains exposed
// while the browser downloads/parses the script.
const scriptSources=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match=>match[1].split(/[?#]/)[0]);
assert(!scriptSources.includes(fullSearchPath),'full search index must not be an initial script');
assert(fs.statSync(path.join(root,fullSearchPath)).size>4_500_000,'fixture must retain the large-index regression scale');
assert.match(app,/function openGlobalSearch\(query\)[\s\S]*?refreshGlobalSearchAfterIndex\(q,\{explicit:true\}\)/);
assert.match(app,/setCrossDbSearchBusy\(true\)/);
assert.match(app,/results\.dataset\.mbSearchIndexLoading='true'/);
assert(!/addEventListener\(['"]focus['"][\s\S]{0,180}ensureCrossDbSearchIndex/.test(app),'focus must not request the full search index');

// Country cards and their inline SVG flags are now bounded on the first frame,
// then appended in small idle/frame chunks. A new render generation cancels
// stale work from rapid filter or route changes.
assert.match(app,/const COUNTRY_INITIAL_RENDER_LIMIT=30;/);
assert.match(app,/const COUNTRY_RENDER_CHUNK_SIZE=24;/);
assert.match(app,/rows\.slice\(0,initialEnd\)\.map\(countryCardHtml\)/);
assert.match(app,/progress\.insertAdjacentHTML\('beforebegin',rows\.slice\(cursor,end\)\.map\(countryCardHtml\)\.join\(''\)\)/);
assert.match(app,/if\(generation!==countryRenderGeneration\)return;/);
assert.match(app,/new CustomEvent\('marketbase:countries-rendered'/);
const countryPresetRoute=app.slice(app.indexOf('function openCountriesWithCurrentFilters'),app.indexOf('function handleAppNavigationClick'));
assert(!countryPresetRoute.includes('renderCountries()'),'home presets must leave country-card construction to the post-paint route renderer');
assert.match(countryPresetRoute,/renderedPrimaryViews\.delete\('countries'\);[\s\S]*?switchView\('countries'\);/);

// When the separately deferred country scripts recover after a transient
// failure, an already-open detail dialog must be refreshed in place.
assert.match(app,/event\.detail\?\.group==='country'[\s\S]{0,260}renderDetailContent\(entity\)/);

console.log('V333.18 main optional-data, search-intent, and progressive-country contracts passed.');
