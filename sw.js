'use strict';
importScripts('./assets/js/market-base-offline-manifest-v324.js?v=20260803-v333-8-jfm-export-db');
const BUILD_ID='MARKET_BASE_V333_8_JFM_EXPORT_DB_20260803';
const VERSION=(new URL(self.location.href)).searchParams.get('v')||'20260803-v333-8-jfm-export-db';
const CACHE_NAME=`market-base-${VERSION}`;
const OFFLINE_TEXT_CACHE='mb-user-offline-v324-text';
const OFFLINE_IMAGE_CACHE='mb-user-offline-v324-images';
const OFFLINE_STATE_CACHE='mb-user-offline-v324-state';
const OFFLINE_STATE_REQUEST=new URL('./__market_base_offline_mode__',self.location.href).href;
// V333.8: V333.7.2 plus externally sourced Japan food-machinery export and overseas-network enrichment.
const REQUIRED=[
  "./",
  "./index.html?v=20260803-v333-8-jfm-export-db",
  "./offline.html?v=20260803-v333-8-jfm-export-db",
  "./version.txt?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-build.js?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-update-controller-v333.js?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-scroll-controls-r11328.js?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-radio-dock-v331.js?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-tool-menu-v333.js?v=20260803-v333-8-jfm-export-db",
  "./assets/css/market-base-tool-menu-v333.css?v=20260803-v333-8-jfm-export-db",
  "./assets/css/market-base-dual-dock-v331.css?v=20260803-v333-8-jfm-export-db",
  "./assets/css/market-base-reading-half-pc-v3336.css?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-offline-manifest-v324.js?v=20260803-v333-8-jfm-export-db",
  "./assets/css/market-base-offline-status-badge-v324.css?v=20260730-v324-offline-save-fix",
  "./assets/js/market-base-offline-status-badge-v324.js?v=20260730-v324-offline-save-fix",
  "./settings/index.html?v=20260730-v324",
  "./settings/assets/settings.css?v=20260730-v324",
  "./settings/assets/offline-settings.js?v=20260730-v324-offline-save-fix",
  "./assets/js/app-v273-country-profile-r28-refresh-route-header-r95.js?v=20260730-v324",
  "./embedded-country-profile-data-v273-r28.js?v=20260730-v324",
  "./data/images/todays-journey-image-manifest-r11370.js?v=20260730-v324",
  "./data/images/photo-registry-embedded.js?v=20260730-v324-big-c-hotfix"
];
const CORE=[
  "./assets/css/official-site-preview-v325.css?v=20260801-v325-tall-rect",
  "./assets/js/official-site-preview-allowlist-v325.js?v=20260801-v325-tall-rect",
  "./assets/js/official-site-preview-v325.js?v=20260801-v325-tall-rect",
  "./cvs-vendor-v273-db-title-r27.html?v=20260801-v325-tall-rect",
  "./gohan-food-manufacturers-v273-db-title-r27.html?v=20260801-v325-tall-rect",
  "./imported-food-machinery-v273-db-title-r27.html?v=20260801-v325-tall-rect",
  "./retail-sales-v273-db-title-r27.html?v=20260801-v325-tall-rect",
  "./rail-food-kitchen-v273-db-title-r27.html?v=20260801-v325-tall-rect",
  "./japan-food-machinery-v273-r58.html?v=20260803-v333-8-jfm-export-db",
  "./assets/css/v311-ui-fixes.css?v=20260729-v318",
  "./assets/js/app-v273-country-profile-r28-refresh-route-header-r95.js?v=20260730-v324",
  "./assets/js/market-base-build.js?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-update-controller-v333.js?v=20260803-v333-8-jfm-export-db",
  "./embedded-country-profile-data-v273-r28.js?v=20260730-v324",
  "./assets/css/market-base-header-audit-v302.css?v=20260728-v302",
  "./assets/css/home-search-mode-v332.css?v=20260803-v333-8-jfm-export-db",
  "./assets/js/home-search-mode-v332.js?v=20260803-v333-8-jfm-export-db",
  "./assets/css/map-search-v301.css?v=20260729-v318",
  "./assets/js/map-search-v301.js?v=20260728-v303",
  "./assets/svg/world-countries-v301.svg?v=20260728-v303",
  "./assets/images/market-base-world-wind-v301.webp?v=20260728-v303",
  "./assets/images/market-base-world-wind-v301.jpg?v=20260728-v303",
  "./",
  "./index.html?v=20260803-v333-8-jfm-export-db",
  "./version.txt?v=20260803-v333-8-jfm-export-db",
  "./offline.html?v=20260803-v333-8-jfm-export-db",
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
  "./assets/css/market-base-reading-cards-v331.css?v=20260802-v331",
  "./kimochi-biyori/index.html?v=20260802-v331",
  "./kimochi-biyori/assets/page.css?v=20260802-v331",
  "./kimochi-biyori/assets/page.js?v=20260802-v331",
  "./kimochi-biyori/data/stories-data.js?v=20260802-v331",
  "./hs-learning/index.html?v=20260727-r11372",
  "./ul-ce-learning/index.html?v=20260727-r11372",
  "./world-compass.html?v=20260727-r11385",
  "./assets/css/world-compass-ui-base-r11311.css?v=20260727-r11385-status",
  "./assets/css/world-compass-r11311.css?v=20260727-r11385-flaglock",
  "./assets/css/world-compass-controls-r11357.css?v=20260727-r11385-status",
  "./assets/js/world-compass-country-capitals-r11311.js?v=20260727-r11385-flaglock",
  "./assets/js/world-compass-r11311.js?v=20260729-v319-public-text",
  "./assets/maps/world-map.svg?v=20260726-r11369",
  "./manifest.json?v=20260803-v333-8-jfm-export-db",
  "./market-base-currency-converter-v273-r29.html?v=20260803-v333-8-jfm-export-db",
  "./market-base-code-tool.html?v=20260803-v333-8-jfm-export-db",
  "./assets/css/market-base-code-tool-v332.css?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-code-tool-v332.js?v=20260803-v333-8-jfm-export-db",
  "./assets/vendor/market-base-qr-generator-v330.js?v=20260803-v333-8-jfm-export-db",
  "./assets/vendor/market-base-barcode-generator-v330.js?v=20260803-v333-8-jfm-export-db",
  "./assets/css/market-base-primary-components-r11326.css?v=20260727-r11373",
  "./assets/css/market-base-bottom-nav-unified-r11409.css?v=20260728-r11409",
  "./assets/css/currency-standard-shell-r11335.css?v=20260803-v333-8-jfm-export-db",
  "./assets/css/prism-calculator-integrated-r1136.css?v=20260803-v333-8-jfm-export-db",
  "./assets/js/prism-calculator-integrated-r1136.js?v=20260803-v333-8-jfm-export-db",
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
  "./assets/css/market-base-scroll-controls-r11328.css?v=20260803-v333-8-jfm-export-db",
  "./assets/css/world-history-learn-r11330.css?v=20260729-v318",
  "./assets/css/market-base-desktop-icon-nav-r11337.css?v=20260727-r11371",
  "./assets/css/market-base-weather-panel-v005.css?v=20260726-r11369",
  "./assets/css/market-base-weather-home-compact-r11342.css?v=20260726-r11369",
  "./assets/css/market-base-global-bottom-nav-r11345.css?v=20260726-r11369",
  "./assets/css/market-base-bottom-press-feedback-r11367.css?v=20260726-r11369",
  "./assets/css/market-base-reading-section-r11366.css?v=20260727-r11383",
  "./assets/js/market-base-build.js?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-runtime-r11348.js?v=20260726-r11369",
  "./assets/flags/flag-svg-data.js?v=20260803-v333-8-jfm-export-db",
  "./assets/js/news.js?v=20260726-r11369",
  "./data/images/photo-registry-embedded.js?v=20260730-v324-big-c-hotfix",
  "./data/images/todays-journey-image-manifest-r11370.js?v=20260730-v324",
  "./assets/js/photo-registry-v1.js?v=20260727-r11373-photo-final",
  "./retail-sales-v273-db-title-r27.html?v=20260727-r11373-photo-final",
  "./assets/css/retail-store-gallery-v2.css?v=20260725-r11348",
  "./assets/js/retail-store-gallery-v2.js?v=20260727-r11373-photo-final",
  "./assets/js/daily-retail-showcase-v1.js?v=20260730-v324-home-headings",
  "./assets/css/retail-logo-directory-r11379.css?v=20260727-r11384-compact",
  "./data/retail-logo-directory-r11379.js?v=20260727-r11382-gridfix",
  "./assets/js/retail-logo-directory-r11379.js?v=20260730-v324-home-headings",
  "./assets/images/retail-logo-directory/logo-sheet-01.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-02.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-03.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-04.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-05.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-06.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-07.jpg?v=20260727-r11379",
  "./assets/images/retail-logo-directory/logo-sheet-08.jpg?v=20260727-r11379",
  "./assets/images/retail/big-c-thailand-ratchadamri-exterior.webp?v=20260730-v324-big-c-hotfix",
  "./assets/images/retail/big-c-thailand-chaeng-watthana-interior-wide.webp?v=20260730-v324-big-c-hotfix",
  "./assets/images/retail/big-c-thailand-chaeng-watthana-seafood.webp?v=20260730-v324-big-c-hotfix",
  "./assets/images/retail/big-c-thailand-chaeng-watthana-exterior.webp?v=20260730-v324-big-c-hotfix",
  "./assets/js/market-base-pc-unified-shell-r95-v1.js?v=20260726-r11369",
  "./assets/js/reading-highlights-v1.js?v=20260726-r11369",
  "./data/world-history-today-v028.js?v=20260730-v324-history-photo-json",
  "./assets/js/world-history-learn-r11330.js?v=20260730-v324-home-headings",
  "./assets/js/world-why-learn-r11327.js?v=20260726-r11369",
  "./assets/js/market-base-scroll-controls-r11328.js?v=20260803-v333-8-jfm-export-db",
  "./assets/js/market-base-desktop-icon-nav-r11337.js?v=20260727-r11371",
  "./assets/js/market-base-weather-panel-v005.js?v=20260726-r11369"
  ,"./work-basics/index.html?v=20260730-v324"
  ,"./work-basics/assets/styles.css?v=20260730-v324"
  ,"./work-basics/assets/app.js?v=20260730-v324"
  ,"./work-basics/assets/data.js?v=20260730-v324"
  ,"./work-basics/assets/icon.svg?v=20260730-v324"
  ,"./work-basics/manifest.webmanifest?v=20260730-v324"
  ,"./world-radio/index.html?v=20260803-v333-8-jfm-export-db"
  ,"./world-radio/player.html?v=20260803-v333-8-jfm-export-db"
  ,"./world-radio/assets/world-radio.css?v=20260803-v333-8-jfm-export-db"
  ,"./world-radio/assets/world-radio-stations.js?v=20260803-v333-8-jfm-export-db"
  ,"./world-radio/assets/world-radio.js?v=20260803-v333-8-jfm-export-db"
  ,"./world-radio/assets/world-radio-player.css?v=20260803-v333-8-jfm-export-db"
  ,"./world-radio/assets/world-radio-player.js?v=20260803-v333-8-jfm-export-db"
  ,"./assets/css/world-radio-home-card-v307.css?v=20260730-v324"
  ,"./assets/css/market-base-v324-addon-home-fixes.css?v=20260730-v324-home-headings-edge"
  ,"./assets/js/market-base-radio-dock-v331.js?v=20260803-v333-8-jfm-export-db"
  ,"./assets/css/market-base-dual-dock-v331.css?v=20260803-v333-8-jfm-export-db"
  ,"./world-route.html?v=20260803-v333-8-jfm-export-db"
  ,"./world-route/index.html?v=20260803-v333-8-jfm-export-db"
  ,"./world-route/market-base-ui-base.css?v=20260803-v333-8-jfm-export-db"
  ,"./world-route/market-base-ui-base.js?v=20260803-v333-8-jfm-export-db"
  ,"./world-route/world-route.css?v=20260803-v333-8-jfm-export-db"
  ,"./world-route/world-route-data.js?v=20260803-v333-8-jfm-export-db"
  ,"./world-route/world-route.js?v=20260803-v333-8-jfm-export-db"
  ,"./machine-container-packing/index.html?v=20260730-v324"
  ,"./machine-container-packing/assets/market-base-ui-base.css?v=20260730-v324"
  ,"./machine-container-packing/assets/market-base-ui-base.js?v=20260730-v324"
  ,"./machine-container-packing/assets/machine-container-packing.css?v=20260730-v324"
  ,"./machine-container-packing/assets/machine-container-packing.js?v=20260730-v324"
  ,"./machine-container-packing/data/machine-container-packing-data.js?v=20260730-v324"
];
async function cacheCoreSafely(){
  const cache=await caches.open(CACHE_NAME);
  const put=async(item,signal)=>{
    const request=new Request(item,{cache:'reload',signal});
    const response=await fetch(request);
    if(!response.ok)throw new Error(`precache ${response.status}: ${item}`);
    await cache.put(request,response.clone());
  };
  // Only the shell required to recover and navigate is installation-blocking.
  // The large CORE set is cached on first use or by the explicit offline save.
  const installRequired=[
    ...REQUIRED.slice(0,9),
    "./flight-kitchen-v273-db-title-r27.html?v=20260803-v333-8-jfm-export-db",
    "./embedded-cross-db-search-index-v273-db-title-r27.js?v=20260803-v333-8-jfm-export-db",
    "./world-radio/index.html?v=20260803-v333-8-jfm-export-db",
    "./world-radio/player.html?v=20260803-v333-8-jfm-export-db",
    "./world-radio/assets/world-radio-stations.js?v=20260803-v333-8-jfm-export-db",
    "./world-radio/assets/world-radio.js?v=20260803-v333-8-jfm-export-db",
    "./world-radio/assets/world-radio-player.js?v=20260803-v333-8-jfm-export-db",
    "./assets/css/market-base-dual-dock-v331.css?v=20260803-v333-8-jfm-export-db",
    "./market-base-code-tool.html?v=20260803-v333-8-jfm-export-db",
    "./assets/css/market-base-code-tool-v332.css?v=20260803-v333-8-jfm-export-db",
    "./assets/js/market-base-code-tool-v332.js?v=20260803-v333-8-jfm-export-db",
    "./assets/vendor/market-base-qr-generator-v330.js?v=20260803-v333-8-jfm-export-db",
    "./assets/vendor/market-base-barcode-generator-v330.js?v=20260803-v333-8-jfm-export-db"
  ];
  const requiredController=new AbortController();
  const requiredTimeout=setTimeout(()=>requiredController.abort(),12000);
  try{
    await Promise.all(installRequired.map(item=>put(item,requiredController.signal)));
  }catch(error){
    await caches.delete(CACHE_NAME);
    throw error;
  }finally{
    clearTimeout(requiredTimeout);
  }
}
self.addEventListener('install',event=>{
  event.waitUntil(cacheCoreSafely().then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const marketBaseKeys=keys.filter(key=>key.startsWith('market-base-'));
    await Promise.all(
      marketBaseKeys
        .filter(key=>key!==CACHE_NAME)
        .map(key=>caches.delete(key))
    );
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
  if(event.data?.type==='CLEAR_MARKET_BASE_CACHE') event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      if(
        key.startsWith('market-base-') &&
        key!==CACHE_NAME
      ) await caches.delete(key);
    }
  })());
  if(event.data?.type==='CLEAR_OFFLINE_CONTENT') event.waitUntil(
    Promise.all([
      caches.delete(OFFLINE_TEXT_CACHE),
      caches.delete(OFFLINE_IMAGE_CACHE),
      caches.delete(OFFLINE_STATE_CACHE)
    ])
  );
});

async function offlineModeIsActive(){
  try{
    const cache=await caches.open(OFFLINE_STATE_CACHE);
    return !!(await cache.match(OFFLINE_STATE_REQUEST));
  }catch(_e){
    return false;
  }
}

async function offlineMatch(request,url){
  const imageCache=await caches.open(OFFLINE_IMAGE_CACHE);
  const exactImage=await imageCache.match(request);
  if(exactImage)return exactImage;
  if(url.origin===self.location.origin){
    const localImage=await imageCache.match(request,{ignoreSearch:true});
    if(localImage)return localImage;
    const textCache=await caches.open(OFFLINE_TEXT_CACHE);
    const text=(await textCache.match(request))||
      (await textCache.match(request,{ignoreSearch:true}));
    if(text)return text;
    const core=await caches.open(CACHE_NAME);
    return (await core.match(request))||
      (await core.match(request,{ignoreSearch:true}))||
      null;
  }
  return null;
}

async function offlineFallback(request){
  if(request.destination==='image'){
    const imageCache=await caches.open(OFFLINE_IMAGE_CACHE);
    const placeholder=new URL('./assets/images/photo-placeholder.webp',self.location.href).href;
    const savedPlaceholder=await imageCache.match(placeholder,{ignoreSearch:true});
    if(savedPlaceholder)return savedPlaceholder;
  }
  if(request.mode==='navigate'||request.destination==='document'){
    const textCache=await caches.open(OFFLINE_TEXT_CACHE);
    const offlinePage=new URL('./offline.html',self.location.href).href;
    const savedOffline=(await textCache.match(offlinePage,{ignoreSearch:true}));
    if(savedOffline)return savedOffline;
    const core=await caches.open(CACHE_NAME);
    const coreOffline=await core.match('./offline.html?v=20260730-v324',{ignoreSearch:true});
    if(coreOffline)return coreOffline;
  }
  return Response.error();
}

async function onlineSameOriginResponse(event,url){
  const request=event.request;
  const cache=await caches.open(CACHE_NAME);
  const forceRefresh=request.cache==='reload'||
    request.cache==='no-store'||
    url.searchParams.has('mb-offline-save');
  if(forceRefresh){
    try{
      const response=await fetch(request,{cache:'reload'});
      if(response.ok)await cache.put(request,response.clone());
      return response;
    }catch(_e){
      const cached=await cache.match(request,{ignoreSearch:true});
      if(cached)return cached;
      return Response.error();
    }
  }
  const isDocument=request.mode==='navigate'||request.destination==='document';
  const isShellAsset=isDocument||request.destination==='style'||request.destination==='script'||url.pathname.endsWith('.css')||url.pathname.endsWith('.js')||url.pathname.endsWith('/manifest.json')||url.pathname.endsWith('/manifest.webmanifest');
  const isFreshData=url.pathname.endsWith('.json')||url.pathname.endsWith('version.txt')||url.pathname.endsWith('/assets/js/official-site-preview-allowlist-v325.js');
  const isHistoryAsset=url.pathname.endsWith('/data/world-history-today-v028.js')||url.pathname.endsWith('/assets/js/world-history-learn-r11330.js');
  const isWorldRoute=url.pathname.endsWith('/world-route.html')||url.pathname.includes('/world-route/')||url.pathname.includes('/assets/images/world-route/');
  if(isWorldRoute||isShellAsset||isFreshData||isHistoryAsset){
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response.ok)await cache.put(request,response.clone());
      return response;
    }catch(_e){
      const cached=await cache.match(request,{ignoreSearch:true});
      if(cached)return cached;
      return isDocument
        ? (await cache.match('./offline.html?v=20260730-v324',{ignoreSearch:true}))||Response.error()
        : Response.error();
    }
  }
  const cached=(await cache.match(request))||
    (await cache.match(request,{ignoreSearch:true}));
  if(cached){
    event.waitUntil(
      fetch(request)
        .then(async response=>{if(response.ok)await cache.put(request,response.clone())})
        .catch(()=>undefined)
    );
    return cached;
  }
  try{
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }catch(_e){
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const sameOrigin=url.origin===self.location.origin;
  if(!sameOrigin&&event.request.destination!=='image')return;
  event.respondWith((async()=>{
    if(await offlineModeIsActive()){
      const cached=await offlineMatch(event.request,url);
      if(cached)return cached;
      return offlineFallback(event.request);
    }
    if(!sameOrigin){
      try{return await fetch(event.request)}
      catch(_e){return Response.error()}
    }
    return onlineSameOriginResponse(event,url);
  })());
});
