import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const TOKEN='20260810-v333-19-android-install-stability';
const html=read('index.html');
const app=read('assets/js/app-v273-country-profile-r28-refresh-route-header-r99.js');
const deferred=read('assets/js/market-base-home-deferred-v333-18.js');
const navigation=read('assets/js/market-base-navigation-v333-18.js');
const shell=read('assets/js/market-base-pc-unified-shell-v333-18.js');
const scroll=read('assets/js/market-base-scroll-controls-v334.js');
const desktop=read('assets/js/market-base-desktop-icon-nav-r11337.js');
const css=read('assets/css/market-base-navigation-v333-18.css');

const scriptSources=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match=>match[1]);
const initialPaths=scriptSources.map(source=>source.split(/[?#]/)[0]);
const deferredOnly=[
  'embedded-country-profile-data-v273-r28.js',
  'data/country-distinctive-facts-v333-15.js',
  'data/country-local-rules.js',
  'data/world-history-today-v028.js',
  'assets/js/world-history-learn-r11330.js',
  'data/world-why-365-v015.js',
  'assets/js/world-why-learn-r11327.js',
  'data/images/todays-journey-image-manifest-r11370.js',
  'data/images/photo-registry-embedded.js',
  'assets/js/photo-registry-v1.js',
  'assets/js/daily-retail-showcase-v1.js',
  'food-machinery-import-search-v273-r32u.js',
  'rice-additive-products-search-v273-r33.js'
];

assert(scriptSources.some(source=>source.includes(`app-v273-country-profile-r28-refresh-route-header-r99.js?v=${TOKEN}`)),'index must load app R99 with the V333.19 token');
assert(!scriptSources.some(source=>source.includes('refresh-route-header-r97.js')),'index must not load the R97 compatibility shim');
assert(!html.includes("link.rel='prefetch'"),'legacy all-at-once idle prefetch activation must be removed');
for(const relative of deferredOnly)assert(!initialPaths.includes(relative),`${relative} must not block the initial page`);
for(const relative of deferredOnly.slice(0,11))assert(deferred.includes(relative),`${relative} must be owned by the deferred loader`);
assert(!deferred.includes('food-machinery-import-search-v273-r32u.js'),'retired food import search must remain unloaded');
assert(!deferred.includes('rice-additive-products-search-v273-r33.js'),'retired rice additive search must remain unloaded');

const localInitial=initialPaths.filter(relative=>!/^https?:/i.test(relative));
const initialBytes=localInitial.reduce((total,relative)=>{
  const file=path.join(root,relative);
  assert(fs.existsSync(file),`initial script is missing: ${relative}`);
  return total+fs.statSync(file).size;
},0);
assert(initialBytes<1_100_000,`initial raw JavaScript must stay below 1.1 MB (actual ${initialBytes})`);

assert(app.includes('window.MarketBaseInPageRouter=Object.freeze'),'app must expose the common in-page router');
assert(app.includes('window.history.pushState'),'route changes must create traversable History entries');
assert(app.includes("window.addEventListener('popstate'"),'browser Back/Forward must restore in-page views');
assert(app.includes("typeof document.startViewTransition!=='function'"),'View Transitions must remain feature-detected');
assert(app.includes("'(prefers-reduced-motion: reduce)'"),'in-page transitions must honor reduced motion');
assert(!/initializeMarketBase\(\)\s*\{[\s\S]{0,180}checkMarketBaseVersion\(/.test(app),'boot must not await the legacy version probe');
assert(app.includes('await boot();'),'boot must start directly');
assert(app.includes('MarketBaseHomeDeferred?.ensureCountryDetail'),'country detail rendering must await its deferred data group');
assert(app.includes('window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{'),'first heavy view render must yield one painted frame after selection feedback');
assert(app.includes("new CustomEvent('marketbase:viewrendered'"),'deferred view rendering must expose a completion event');
assert(app.includes('const OPTIONAL_DATA_GROUPS=Object.freeze'),'optional JSON must be split into first-use route groups');
assert(app.includes('applyOptionalMarketBaseDataset({[key]:value})'),'each optional JSON must update the visible surface as soon as it arrives');
assert(!app.includes('Promise.allSettled(optionalSpecs.map'),'boot must not immediately request all optional JSON files');
assert(!app.includes('purgeMarketBaseLocalCache'),'main app fallback must never delete the shared runtime cache');
assert(!app.includes('navigator.serviceWorker.getRegistrations'),'main app must leave worker ownership to the controller');

const goHome=shell.slice(shell.indexOf('function goHome(event)'),shell.indexOf("document.addEventListener('click'"));
assert(goHome.includes('MarketBaseInPageRouter'),'unified shell Home must use the in-page router');
assert(!goHome.includes('location.assign')&&!goHome.includes("searchParams.set('refresh'"),'unified shell Home must not force a timestamp reload');
assert(scroll.includes('MarketBaseInPageRouter.navigate'),'main-page safe Back must use the in-page router');
assert(scroll.includes("'(prefers-reduced-motion: reduce)'"),'scroll controls must honor reduced motion');
assert(desktop.includes("router.navigate(key==='search'?'global-search':key"),'desktop icon navigation must route main views in place');

assert(navigation.includes("searchParams.set('mb-prefetch','1')"),'document intent prefetch must use the SW prefetch marker');
assert(navigation.includes('connection.saveData'),'prefetch must honor Save-Data');
assert(navigation.includes('radioPlaybackActive()'),'prefetch must pause while a fresh radio session is playing');
assert(navigation.includes('LEGACY_RADIO_GRACE_MS=90*1000'),'legacy radio state may only suppress prefetch for a short grace period');
assert(navigation.includes("event.persisted"),'page lifecycle must be bfcache-aware');
assert(!navigation.includes("addEventListener('unload'"),'navigation must not disable bfcache');
assert(css.includes('@view-transition'),'cross-document transition opt-in must be present');
assert(css.includes('@media (prefers-reduced-motion: reduce)'),'transition CSS must disable motion when requested');

console.log(`V333.19 navigation/performance contracts passed (${initialBytes} initial raw JS bytes).`);
