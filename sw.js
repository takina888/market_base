'use strict';
const BUILD_ID='MARKET_BASE_V322_GLOBAL_UPDATE_JOURNEY_STABILITY_20260730';
const VERSION=(new URL(self.location.href)).searchParams.get('v')||'20260730-v322-global-update-journey-stability';
const CACHE_NAME=`market-base-${VERSION}`;
const REQUIRED=[
  "./",
  "./index.html?v=20260730-v322-global-update-journey-stability",
  "./offline.html?v=20260730-v322",
  "./version.txt?v=20260730-v322-global-update-journey-stability",
  "./assets/js/market-base-build.js?v=20260730-v322-global-update-journey-stability",
  "./assets/js/market-base-update-controller-v322.js?v=20260730-v322",
  "./assets/js/market-base-scroll-controls-r11328.js?v=20260730-v322",
  "./assets/js/app-v273-country-profile-r28-refresh-route-header-r95.js?v=20260730-v322",
  "./embedded-country-profile-data-v273-r28.js?v=20260730-v322",
  "./data/images/todays-journey-image-manifest-r11370.js?v=20260730-v322",
  "./data/images/photo-registry-embedded.js?v=20260730-v322"
];
const CORE=[
  "./assets/css/v311-ui-fixes.css?v=20260729-v318",
  "./assets/js/app-v273-country-profile-r28-refresh-route-header-r95.js?v=20260730-v322",
  "./assets/js/market-base-build.js?v=20260730-v322-global-update-journey-stability",
  "./assets/js/market-base-update-controller-v322.js?v=20260730-v322",
  "./embedded-country-profile-data-v273-r28.js?v=20260730-v322",
  "./assets/css/market-base-header-audit-v302.css?v=20260728-v302",
  "./assets/css/home-search-mode-v302.css?v=20260728-v302",
  "./assets/js/home-search-mode-v302.js?v=20260728-v302",
  "./assets/css/map-search-v301.css?v=20260729-v318",
  "./assets/js/map-search-v301.js?v=20260728-v303",
  "./assets/svg/world-countries-v301.svg?v=20260728-v303",
  "./assets/images/market-base-world-wind-v301.webp?v=20260728-v303",
  "./assets/images/market-base-world-wind-v301.jpg?v=20260728-v303",
  "./",
  "./index.html?v=20260730-v322-global-update-journey-stability",
  "./version.txt?v=20260730-v322-global-update-journey-stability",
  "./offline.html?v=20260730-v322",
  "./news.html?v=20260728-v303-final",
  "./market-base-v273-country-profile-r28.html?v=20260728-v303-final",
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
  "./haccp-quiz/assets/market-base-ui-base.js?v=20260729-v319-public-text",
  "./haccp-quiz/assets/haccp-quiz.js?v=20260726-r11369",
  "./assets/css/market-base-reading-yellow-r11407.css?v=20260728-r11413-pastel-lemon",
  "./assets/css/market-base-home-refinements-r11413.css?v=20260728-r11413",
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
  "./british-jokes/index.html?v=20260728-v303",
  "./british-jokes/assets/page.css?v=20260728-v303",
  "./british-jokes/assets/page.js?v=20260728-v303",
  "./british-jokes/data/jokes-data.js?v=20260728-v303",
  "./hs-learning/index.html?v=20260727-r11372",
  "./ul-ce-learning/index.html?v=20260727-r11372",
  "./world-compass.html?v=20260727-r11385",
  "./assets/css/world-compass-ui-base-r11311.css?v=20260727-r11385-status",
  "./assets/css/world-compass-r11311.css?v=20260727-r11385-flaglock",
  "./assets/css/world-compass-controls-r11357.css?v=20260727-r11385-status",
  "./assets/js/world-compass-country-capitals-r11311.js?v=20260727-r11385-flaglock",
  "./assets/js/world-compass-r11311.js?v=20260729-v319-public-text",
  "./assets/maps/world-map.svg?v=20260726-r11369",
  "./manifest.json?v=20260730-v322",
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
  "./assets/css/market-base-scroll-controls-r11328.css?v=20260728-v302-back",
  "./assets/css/world-history-learn-r11330.css?v=20260729-v318",
  "./assets/css/market-base-desktop-icon-nav-r11337.css?v=20260727-r11371",
  "./assets/css/market-base-weather-panel-v005.css?v=20260726-r11369",
  "./assets/css/market-base-weather-home-compact-r11342.css?v=20260726-r11369",
  "./assets/css/market-base-global-bottom-nav-r11345.css?v=20260726-r11369",
  "./assets/css/market-base-bottom-press-feedback-r11367.css?v=20260726-r11369",
  "./assets/css/market-base-reading-section-r11366.css?v=20260727-r11383",
  "./assets/js/market-base-build.js?v=20260730-v322-global-update-journey-stability",
  "./assets/js/market-base-runtime-r11348.js?v=20260726-r11369",
  "./assets/flags/flag-svg-data.js?v=20260727-r11385-flaglock",
  "./assets/js/news.js?v=20260726-r11369",
  "./data/images/photo-registry-embedded.js?v=20260730-v322",
  "./data/images/todays-journey-image-manifest-r11370.js?v=20260730-v322",
  "./assets/js/photo-registry-v1.js?v=20260727-r11373-photo-final",
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
  "./data/world-history-today-v028.js?v=20260728-r11413-ui-refine",
  "./assets/js/world-history-learn-r11330.js?v=20260728-r11414",
  "./assets/js/world-why-learn-r11327.js?v=20260726-r11369",
  "./assets/js/market-base-scroll-controls-r11328.js?v=20260730-v322",
  "./assets/js/market-base-desktop-icon-nav-r11337.js?v=20260727-r11371",
  "./assets/js/market-base-weather-panel-v005.js?v=20260726-r11369"
  ,"./work-basics/index.html?v=20260730-v322"
  ,"./work-basics/assets/styles.css?v=20260730-v322"
  ,"./work-basics/assets/app.js?v=20260730-v322"
  ,"./work-basics/assets/data.js?v=20260730-v322"
  ,"./work-basics/assets/icon.svg?v=20260730-v322"
  ,"./work-basics/manifest.webmanifest?v=20260730-v322"
  ,"./world-radio/index.html?v=20260730-v322"
  ,"./world-radio/player.html?v=20260730-v322"
  ,"./world-radio/assets/world-radio.css?v=20260730-v322"
  ,"./world-radio/assets/world-radio.js?v=20260730-v322"
  ,"./world-radio/assets/world-radio-player.css?v=20260730-v322"
  ,"./world-radio/assets/world-radio-player.js?v=20260730-v322"
];
async function cacheCoreSafely(){
  const cache=await caches.open(CACHE_NAME);
  const put=async(item,signal)=>{
    const request=new Request(item,{cache:'reload',signal});
    const response=await fetch(request);
    if(!response.ok)throw new Error(`precache ${response.status}: ${item}`);
    await cache.put(request,response.clone());
  };
  const requiredController=new AbortController();
  const requiredTimeout=setTimeout(()=>requiredController.abort(),15000);
  try{
    await Promise.all(REQUIRED.map(item=>put(item,requiredController.signal)));
  }catch(error){
    await caches.delete(CACHE_NAME);
    throw error;
  }finally{
    clearTimeout(requiredTimeout);
  }
  const required=new Set(REQUIRED);
  const optionalController=new AbortController();
  const optionalTimeout=setTimeout(()=>optionalController.abort(),8000);
  try{
    await Promise.allSettled(CORE.filter(item=>!required.has(item)).map(async item=>{
      try{
        await put(item,optionalController.signal);
      }catch(_e){/* one missing optional asset must not abort the whole service worker */}
    }));
  }finally{
    clearTimeout(optionalTimeout);
  }
}
self.addEventListener('install',event=>{
  event.waitUntil(cacheCoreSafely().then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const marketBaseKeys=keys.filter(key=>key.startsWith('market-base-'));
    await Promise.all(marketBaseKeys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
  if(event.data?.type==='CLEAR_MARKET_BASE_CACHE') event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('market-base-')&&key!==CACHE_NAME)await caches.delete(key)})());
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  const isDocument=event.request.mode==='navigate'||event.request.destination==='document';
  const isFreshData=url.pathname.endsWith('.json')||url.pathname.endsWith('version.txt');
  const isHistoryAsset=url.pathname.endsWith('/data/world-history-today-v028.js')||url.pathname.endsWith('/assets/js/world-history-learn-r11330.js');
  const isWorldRoute=url.pathname.endsWith('/world-route.html')||url.pathname.includes('/world-route/')||url.pathname.includes('/assets/images/world-route/');
  if(isWorldRoute){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response.ok)await cache.put(event.request,response.clone());
        return response;
      }catch(_e){
        return (await cache.match(event.request,{ignoreSearch:true}))||Response.error();
      }
    })());
    return;
  }
  if(isDocument||isFreshData||isHistoryAsset){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response.ok)await cache.put(event.request,response.clone());
        return response;
      }catch(_e){
        const cached=await cache.match(event.request,{ignoreSearch:true});
        if(cached)return cached;
      return isDocument?(await cache.match('./offline.html?v=20260730-v322',{ignoreSearch:true})):Response.error();
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=(await cache.match(event.request))||
      (await cache.match(event.request,{ignoreSearch:true}));
    if(cached){
      event.waitUntil(fetch(event.request).then(async response=>{if(response.ok)await cache.put(event.request,response.clone())}).catch(()=>undefined));
      return cached;
    }
    try{
      const response=await fetch(event.request);
      if(response.ok)await cache.put(event.request,response.clone());
      return response;
    }catch(_e){return Response.error()}
  })());
});
