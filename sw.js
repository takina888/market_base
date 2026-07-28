'use strict';
const BUILD_ID='MARKET_BASE_R114_11_NEWS_MOVED_TO_HOME_BOTTOM_20260728';
const VERSION=(new URL(self.location.href)).searchParams.get('v')||'20260728-r11411';
const CACHE_NAME=`market-base-${VERSION}`;
const CORE=[
  "./",
  "./index.html?v=20260728-r11411",
  "./version.txt?v=20260728-r11411",
  "./offline.html?v=20260727-r11372",
  "./international-logistics/guide.html?v=20260727-r11372",
  "./international-logistics/assets/export-learning-structure-r11351.css?v=20260726-r11369",
  "./international-logistics/assets/export-learning-content-r11352.css?v=20260726-r11369",
  "./international-logistics/assets/export-learning-machinery-r11353.css?v=20260726-r11369",
  "./international-logistics/assets/export-learning-final-r11354.css?v=20260726-r11369",
  "./international-logistics/assets/export-learning-corrections-r11355.css?v=20260726-r11369",
  "./haccp-quiz/index.html?v=20260727-r11372",
  "./haccp-quiz/assets/market-base-ui-base.css?v=20260726-r11369",
  "./haccp-quiz/assets/haccp-quiz.css?v=20260726-r11369",
  "./haccp-quiz/assets/haccp-market-base-r11356-tune.css?v=20260726-r11369",
  "./haccp-quiz/data/haccp-quiz-data.js?v=20260726-r11369",
  "./haccp-quiz/assets/market-base-ui-base.js?v=20260726-r11369",
  "./haccp-quiz/assets/haccp-quiz.js?v=20260726-r11369",
  "./material-check/index.html?v=20260727-r11372",
  "./material-check/assets/app.css?v=20260726-r11369",
  "./material-check/assets/market-base-learning-r1131.css?v=20260726-r11369",
  "./material-check/data/material-check-data.js?v=20260726-r11369",
  "./material-check/assets/app.js?v=20260726-r11369",
  "./assets/css/market-base-reading-yellow-r11407.css?v=20260728-r11407",
  "./classic-move/index.html?v=20260728-r11406",
  "./classic-move/styles.css?v=20260728-r11406",
  "./classic-move/app.js?v=20260728-r11406",
  "./classic-move/data/classics-reading.js?v=20260728-r11406",
  "./rakuda-no-me/index.html?v=20260728-r11392",
  "./rakuda-no-me/assets/page.css?v=20260728-r11392",
  "./rakuda-no-me/assets/page.js?v=20260728-r11392",
  "./rakuda-no-me/data/stories.js?v=20260728-r11392",
  "./sutra-no-yoin/index.html?v=20260728-r11391",
  "./sutra-no-yoin/assets/page.css?v=20260728-r11391",
  "./sutra-no-yoin/assets/page.js?v=20260728-r11391",
  "./sutra-no-yoin/assets/stories.json?v=20260728-r11391",
  "./machine-container-packing/index.html?v=20260727-r11372",
  "./hs-learning/index.html?v=20260727-r11372",
  "./ul-ce-learning/index.html?v=20260727-r11372",
  "./world-route.html?v=20260727-r11381",
  "./world-route/index.html?v=20260727-r11381",
  "./assets/images/world-route/representative/01-tw.png?v=20260727-r11381",
  "./world-compass.html?v=20260727-r11385",
  "./assets/css/world-compass-ui-base-r11311.css?v=20260727-r11385-status",
  "./assets/css/world-compass-r11311.css?v=20260727-r11385-flaglock",
  "./assets/css/world-compass-controls-r11357.css?v=20260727-r11385-status",
  "./assets/js/world-compass-country-capitals-r11311.js?v=20260727-r11385-flaglock",
  "./assets/js/world-compass-r11311.js?v=20260727-r11385-flaglock",
  "./assets/maps/world-map.svg?v=20260726-r11369",
  "./manifest.json?v=20260727-r11390",
  "./market-base-currency-converter-v273-r29.html?v=20260727-r11385",
  "./assets/css/market-base-primary-components-r11326.css?v=20260727-r11373",
  "./assets/css/market-base-bottom-nav-unified-r11409.css?v=20260728-r11409",
  "./assets/css/currency-standard-shell-r11335.css?v=20260727-r11385-halfpc",
  "./assets/css/prism-calculator-integrated-r1136.css?v=20260727-r11385-halfpc",
  "./assets/css/market-base-standard-shell-r11372.css?v=20260727-r11385-halfpc",
  "assets/css/market-base-daily-company-slot-r11361.css?v=20260726-r11369",
  "assets/css/market-base-daily-fortune-r11362.css?v=20260726-r11369",
  "data/market-base-daily-company-200-r11349.js?v=20260726-r11369",
  "assets/js/market-base-daily-company-slot-r11361.js?v=20260726-r11369",
  "assets/js/market-base-daily-fortune-r11363.js?v=20260726-r11369",
  "assets/css/market-base-daily-company-target-r11349.css?v=20260726-r11369",
  "assets/js/market-base-daily-company-target-r11349.js?v=20260726-r11369",
  "./assets/images/market-base-world-wind-ogp.png?v=20260727-r11387",
  "./assets/css/main-r11347/market-base-app-01-foundation-r11347.css?v=20260726-r11369",
  "./assets/css/main-r11347/market-base-app-02-features-r11347.css?v=20260726-r11369",
  "./assets/css/main-r11347/market-base-app-03-views-r11347.css?v=20260727-r11390-rank-yellow",
  "./assets/css/main-r11347/market-base-app-04-country-detail-r11347.css?v=20260727-r11390-journey-history",
  "./assets/css/r1137-ranking-compare-learn.css?v=20260726-r11369",
  "./icons/favicon-32.png?v=20260726-r11369",
  "./icons/apple-touch-icon-180.png?v=20260726-r11369",
  "./assets/css/country-dialog-desktop-v273-r32.css?v=20260726-r11369",
  "./assets/css/market-base-desktop-navigation-v273-r32.css?v=20260726-r11369",
  "./assets/css/country-detail-blue-universal-v273-r32u.css?v=20260726-r11369",
  "./assets/css/reading-highlights-v1.css?v=20260726-r11369",
  "./assets/css/r93-daily-retail-and-pc-flag-fix.css?v=20260727-r11385-fullpc",
  "./assets/css/r94-country-route-and-list-header.css?v=20260726-r11369",
  "./assets/css/market-base-pc-unified-shell-r95-v1.css?v=20260726-r11369",
  "./assets/css/market-base-global-header-r1139.css?v=20260726-r11369",
  "./assets/css/world-compass-integration-r11311.css?v=20260726-r11369",
  "./assets/css/international-logistics-integration-r11313.css?v=20260726-r11369",
  "./assets/css/market-base-learn-shell-r11314.css?v=20260726-r11369",
  "./assets/css/upload-layout-fix-r11318.css?v=20260726-r11369",
  "./assets/css/world-why-learn-r11327.css?v=20260727-r11377",
  "./assets/css/market-base-scroll-controls-r11328.css?v=20260727-r11376",
  "./assets/css/world-history-learn-r11330.css?v=20260727-r11383",
  "./assets/css/market-base-desktop-icon-nav-r11337.css?v=20260727-r11371",
  "./assets/css/market-base-news-tabs-v1.css?v=20260727-r11386-mobile-font",
  "./assets/css/market-base-weather-panel-v005.css?v=20260726-r11369",
  "./assets/css/market-base-weather-home-compact-r11342.css?v=20260726-r11369",
  "./assets/css/market-base-global-bottom-nav-r11345.css?v=20260726-r11369",
  "./assets/css/market-base-bottom-press-feedback-r11367.css?v=20260726-r11369",
  "./assets/css/market-base-reading-section-r11366.css?v=20260727-r11383",
  "./assets/js/market-base-build.js?v=20260727-r11387",
  "./assets/js/market-base-runtime-r11348.js?v=20260726-r11369",
  "./assets/flags/flag-svg-data.js?v=20260727-r11385-flaglock",
  "./assets/js/news.js?v=20260726-r11369",
  "./data/images/photo-registry-embedded.js?v=20260727-r11390-vanuatu",
    "./data/images/todays-journey-image-manifest-r11370.js?v=20260727-r11390",
  "./assets/js/photo-registry-v1.js?v=20260727-r11373-photo-final",
  "./assets/js/app-v273-country-profile-r28-refresh-route-header-r95.js?v=20260726-r11370",
  "./retail-sales-v273-db-title-r27.html?v=20260727-r11373-photo-final",
  "./assets/css/retail-store-gallery-v2.css?v=20260725-r11348",
  "./assets/js/retail-store-gallery-v2.js?v=20260727-r11373-photo-final",
  "./assets/js/daily-retail-showcase-v1.js?v=20260727-r11383-home-reading",
  "./assets/css/retail-logo-directory-r11379.css?v=20260727-r11384-compact",
  "./data/retail-logo-directory-r11379.js?v=20260727-r11382-gridfix",
  "./assets/js/retail-logo-directory-r11379.js?v=20260727-r11382-gridfix",
  "./assets/images/retail-logo-directory/logo-sheet-01.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-02.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-03.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-04.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-05.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-06.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-07.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-08.jpg?v=20260727-r11379",
  "./assets/js/market-base-pc-unified-shell-r95-v1.js?v=20260726-r11369",
  "./assets/js/reading-highlights-v1.js?v=20260726-r11369",
  "./data/world-history-today-v028.js?v=20260728-r11410-history-v044",
  "./assets/js/world-history-learn-r11330.js?v=20260727-r11383",
  "./assets/js/world-why-learn-r11327.js?v=20260726-r11369",
  "./assets/js/market-base-scroll-controls-r11328.js?v=20260727-r11376",
  "./assets/js/market-base-desktop-icon-nav-r11337.js?v=20260727-r11371",
  "./assets/js/market-base-news-tabs-v1.js?v=20260726-r11369",
  "./assets/js/market-base-weather-panel-v005.js?v=20260726-r11369"
];
async function cacheCoreSafely(){
  const cache=await caches.open(CACHE_NAME);
  await Promise.allSettled(CORE.map(async item=>{
    try{
      const request=new Request(item,{cache:'reload'});
      const response=await fetch(request);
      if(response.ok)await cache.put(request,response.clone());
    }catch(_e){/* one missing optional asset must not abort the whole service worker */}
  }));
}
self.addEventListener('install',event=>{
  event.waitUntil(cacheCoreSafely().then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('market-base-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
  if(event.data?.type==='CLEAR_MARKET_BASE_CACHE') event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('market-base-'))await caches.delete(key)})());
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  const isDocument=event.request.mode==='navigate'||event.request.destination==='document';
  const isFreshData=url.pathname.endsWith('.json')||url.pathname.endsWith('version.txt');
  const isWorldRoute=url.pathname.endsWith('/world-route.html')||url.pathname.includes('/world-route/')||url.pathname.includes('/assets/images/world-route/');
  if(isWorldRoute){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response.ok)(await caches.open(CACHE_NAME)).put(event.request,response.clone());
        return response;
      }catch(_e){
        return (await caches.match(event.request))||Response.error();
      }
    })());
    return;
  }
  if(isDocument||isFreshData){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response.ok)(await caches.open(CACHE_NAME)).put(event.request,response.clone());
        return response;
      }catch(_e){
        const cached=await caches.match(event.request);
        if(cached)return cached;
      return isDocument?(await caches.match('./offline.html?v=20260727-r11372')):Response.error();
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(event.request);
    if(cached){
      event.waitUntil(fetch(event.request).then(async response=>{if(response.ok)(await caches.open(CACHE_NAME)).put(event.request,response.clone())}).catch(()=>undefined));
      return cached;
    }
    try{
      const response=await fetch(event.request);
      if(response.ok)(await caches.open(CACHE_NAME)).put(event.request,response.clone());
      return response;
    }catch(_e){return Response.error()}
  })());
});
