'use strict';
const BUILD_ID='MARKET_BASE_V333_18_CACHE_RADIO_NAVIGATION_STABILITY_20260810';
const ASSET_VERSION='20260810-v333-18-cache-radio-navigation-stability';
importScripts(`./assets/js/market-base-offline-manifest-v335.js?v=${ASSET_VERSION}`);
// VERSION identifies the installed worker generation. Static asset immutability
// is deliberately tied to ASSET_VERSION instead of trusting an arbitrary ?v=20260810-v333-18-cache-radio-navigation-stability
const VERSION=(new URL(self.location.href)).searchParams.get('v')||BUILD_ID;
const CACHE_NAME=`market-base-${VERSION}`;
const OFFLINE_TEXT_CACHE='mb-user-offline-v324-text';
const OFFLINE_IMAGE_CACHE='mb-user-offline-v324-images';
const OFFLINE_STATE_CACHE='mb-user-offline-v324-state';
const OFFLINE_STATE_REQUEST=new URL('./__market_base_offline_mode__',self.location.href).href;
const MANUAL_REFRESH_CACHE='mb-update-state-v333-18';
const MANUAL_REFRESH_REQUEST=new URL('./__market_base_manual_refresh__',self.location.href).href;
const MANUAL_REFRESH_TTL_MS=2*60*1000;
const DOCUMENT_FRESH_MS=5000;
const TEMPORARY_DOCUMENT_PARAMS=new Set([
  'refresh','autoRefresh','mb-prefetch','check','manualCheck','_','cacheBust'
]);
// V333.16: bypass live audio/range requests and serve versioned static assets from exact cache keys.
// V333.15: one source-linked distinctive fact in every one of the 196 country/region profiles.
// V333.14: cache/update controller race removal, current Service Worker ownership, and lightweight activation shell.
// V333.11: V333.8 cumulative update with catering research, Cloudflare analytics, and plain-language UL Q&A workflow.
// V333.10: V333.8 cumulative update with V333.9 catering enrichment and Cloudflare Web Analytics on all public HTML pages.
// V333.9: V333.8 plus external-source catering DB enrichment, source links, and data-hygiene corrections.
const REQUIRED=[
  "./",
  "./index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./offline.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./version.txt?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-build-v335.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-runtime-v335.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-update-controller-v335.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-scroll-controls-v334.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-radio-dock-v333-16.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-tool-menu-v333.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-tool-menu-v333.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-radio-dock-v333-16.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-reading-half-pc-v3336.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-offline-manifest-v335.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-offline-status-badge-v324.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-offline-status-badge-v324.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./settings/index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./settings/assets/settings.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./settings/assets/offline-settings-v335.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/app-v273-country-profile-r28-refresh-route-header-r99.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-navigation-v333-18.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-home-deferred-v333-18.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-pc-unified-shell-v333-18.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-navigation-v333-18.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./embedded-country-profile-data-v273-r28.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./data/country-distinctive-facts-v333-15.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/country-distinctive-facts-v333-15.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./data/images/todays-journey-image-manifest-r11370.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./data/images/photo-registry-embedded.js?v=20260810-v333-18-cache-radio-navigation-stability"
];
const CORE=[
  "./assets/css/official-site-preview-v325.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/official-site-preview-allowlist-v325.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/official-site-preview-v325.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./cvs-vendor-v273-db-title-r27.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./gohan-food-manufacturers-v273-db-title-r27.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./imported-food-machinery-v273-db-title-r27.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./retail-sales-v273-db-title-r27.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./rail-food-kitchen-v273-db-title-r27.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./japan-food-machinery-v273-r58.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/v311-ui-fixes.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/app-v273-country-profile-r28-refresh-route-header-r99.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-navigation-v333-18.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-home-deferred-v333-18.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-pc-unified-shell-v333-18.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-navigation-v333-18.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-build-v335.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-update-controller-v335.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./embedded-country-profile-data-v273-r28.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./data/country-distinctive-facts-v333-15.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/country-distinctive-facts-v333-15.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-header-audit-v302.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/home-search-mode-v332.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/home-search-mode-v332.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/map-search-v301.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/map-search-v301.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/svg/world-countries-v301.svg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/market-base-world-wind-v301.webp?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/market-base-world-wind-v301.jpg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./",
  "./index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./version.txt?v=20260810-v333-18-cache-radio-navigation-stability",
  "./offline.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./news.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./market-base-v273-country-profile-r28.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./international-logistics/guide.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./international-logistics/assets/export-learning-structure-r11351.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./international-logistics/assets/export-learning-content-r11352.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./international-logistics/assets/export-learning-machinery-r11353.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./international-logistics/assets/export-learning-final-r11354.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./international-logistics/assets/export-learning-corrections-r11355.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./haccp-quiz/index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./haccp-quiz/assets/market-base-ui-base.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./haccp-quiz/assets/haccp-quiz.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./haccp-quiz/assets/haccp-market-base-r11356-tune.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./haccp-quiz/data/haccp-quiz-data.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./haccp-quiz/assets/market-base-ui-base.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./haccp-quiz/assets/haccp-quiz.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-reading-yellow-r11407.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-home-refinements-r11413.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./classic-move/index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./classic-move/styles.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./classic-move/app.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./classic-move/data/classics-reading.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./rakuda-no-me/index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./rakuda-no-me/assets/page.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./rakuda-no-me/assets/page.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./rakuda-no-me/data/stories.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./sutra-no-yoin/index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./sutra-no-yoin/assets/page.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./sutra-no-yoin/assets/page.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./sutra-no-yoin/assets/stories.json?v=20260810-v333-18-cache-radio-navigation-stability",
  "./british-jokes/index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./british-jokes/assets/page.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./british-jokes/assets/page.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./british-jokes/data/jokes-data.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-reading-cards-v331.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./kimochi-biyori/index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./kimochi-biyori/assets/page.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./kimochi-biyori/assets/page.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./kimochi-biyori/data/stories-data.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./hs-learning/index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./ul-ce-learning/index.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./world-compass.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/world-compass-ui-base-r11311.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/world-compass-r11311.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/world-compass-controls-r11357.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/world-compass-country-capitals-r11311.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/world-compass-r11311.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/maps/world-map.svg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./manifest.json?v=20260810-v333-18-cache-radio-navigation-stability",
  "./market-base-currency-converter-v273-r29.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./market-base-code-tool.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-code-tool-v332.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-code-tool-v332.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/vendor/market-base-qr-generator-v330.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/vendor/market-base-barcode-generator-v330.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-primary-components-r11326.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-bottom-nav-unified-r11409.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/currency-standard-shell-r11335.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/prism-calculator-integrated-r1136.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/prism-calculator-integrated-r1136.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-standard-shell-r11372.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "assets/css/market-base-daily-company-slot-r11361.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "assets/css/market-base-daily-fortune-r11362.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "data/market-base-daily-company-200-r11349.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "assets/js/market-base-daily-company-slot-r11361.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "assets/js/market-base-daily-fortune-r11363.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "assets/css/market-base-daily-company-target-r11349.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "assets/js/market-base-daily-company-target-r11349.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/market-base-world-wind-ogp.png?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/main-r11347/market-base-app-01-foundation-r11347.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/main-r11347/market-base-app-02-features-r11347.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/main-r11347/market-base-app-03-views-r11347.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/main-r11347/market-base-app-04-country-detail-r11347.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/r1137-ranking-compare-learn.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./icons/favicon-32.png?v=20260810-v333-18-cache-radio-navigation-stability",
  "./icons/apple-touch-icon-180.png?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/country-dialog-desktop-v273-r32.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-desktop-navigation-v273-r32.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/country-detail-blue-universal-v273-r32u.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/reading-highlights-v1.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/r93-daily-retail-and-pc-flag-fix.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/r94-country-route-and-list-header.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-pc-unified-shell-r95-v1.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-global-header-r1139.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/world-compass-integration-r11311.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/international-logistics-integration-r11313.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-learn-shell-r11314.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/upload-layout-fix-r11318.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/world-why-learn-r11327.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-scroll-controls-r11328.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/world-history-learn-r11330.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-desktop-icon-nav-r11337.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-weather-panel-v005.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-weather-home-compact-r11342.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-global-bottom-nav-r11345.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-bottom-press-feedback-r11367.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/market-base-reading-section-r11366.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-build-v335.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-runtime-r11348.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/flags/flag-svg-data.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/news.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./data/images/photo-registry-embedded.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./data/images/todays-journey-image-manifest-r11370.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/photo-registry-v1.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./retail-sales-v273-db-title-r27.html?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/retail-store-gallery-v2.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/retail-store-gallery-v2.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/daily-retail-showcase-v1.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/css/retail-logo-directory-r11379.css?v=20260810-v333-18-cache-radio-navigation-stability",
  "./data/retail-logo-directory-r11379.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/retail-logo-directory-r11379.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail-logo-directory/logo-sheet-01.jpg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail-logo-directory/logo-sheet-02.jpg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail-logo-directory/logo-sheet-03.jpg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail-logo-directory/logo-sheet-04.jpg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail-logo-directory/logo-sheet-05.jpg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail-logo-directory/logo-sheet-06.jpg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail-logo-directory/logo-sheet-07.jpg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail-logo-directory/logo-sheet-08.jpg?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail/big-c-thailand-ratchadamri-exterior.webp?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail/big-c-thailand-chaeng-watthana-interior-wide.webp?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail/big-c-thailand-chaeng-watthana-seafood.webp?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/images/retail/big-c-thailand-chaeng-watthana-exterior.webp?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/reading-highlights-v1.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./data/world-history-today-v028.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/world-history-learn-r11330.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/world-why-learn-r11327.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-scroll-controls-v334.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-desktop-icon-nav-r11337.js?v=20260810-v333-18-cache-radio-navigation-stability",
  "./assets/js/market-base-weather-panel-v005.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./work-basics/index.html?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./work-basics/assets/styles.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./work-basics/assets/app.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./work-basics/assets/data.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./work-basics/assets/icon.svg?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./work-basics/manifest.webmanifest?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-radio/index.html?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-radio/player.html?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-radio/assets/world-radio.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-radio/assets/world-radio-stations.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-radio/assets/world-radio.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-radio/assets/world-radio-player.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-radio/assets/world-radio-player.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./assets/css/world-radio-home-card-v307.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./assets/css/market-base-v324-addon-home-fixes.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./assets/js/market-base-radio-dock-v333-16.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./assets/css/market-base-radio-dock-v333-16.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-route.html?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-route/index.html?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-route/market-base-ui-base.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-route/market-base-ui-base.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-route/world-route.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-route/world-route-data.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./world-route/world-route.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./machine-container-packing/index.html?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./machine-container-packing/assets/market-base-ui-base.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./machine-container-packing/assets/market-base-ui-base.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./machine-container-packing/assets/machine-container-packing.css?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./machine-container-packing/assets/machine-container-packing.js?v=20260810-v333-18-cache-radio-navigation-stability"
  ,"./machine-container-packing/data/machine-container-packing-data.js?v=20260810-v333-18-cache-radio-navigation-stability"
];
async function cacheCoreSafely(){
  const stagingName=`${CACHE_NAME}-installing-${ASSET_VERSION}`;
  await caches.delete(stagingName);
  const cache=await caches.open(stagingName);
  const put=async(item,signal)=>{
    const request=new Request(item,{cache:'reload',signal});
    const response=await fetch(request);
    if(!response.ok)throw new Error(`precache ${response.status}: ${item}`);
    if(/(?:^|\/)version\.txt(?:\?|$)/.test(item)){
      const deployed=(await response.clone().text()).split(/\r?\n/)[0].trim();
      if(deployed!==BUILD_ID)throw new Error(`precache build mismatch: ${deployed}`);
    }
    if(/(?:^\.\/|\/)index\.html(?:\?|$)/.test(item)||/^\.\/$/.test(item)||/(?:^|\/)offline\.html(?:\?|$)/.test(item)){
      const shell=await response.clone().text();
      if(!shell.includes(BUILD_ID))throw new Error(`precache shell mismatch: ${item}`);
    }
    await cache.put(request,response.clone());
    if(/(?:^\.\/$|\.html(?:\?|$))/i.test(item)){
      await cache.put(canonicalDocumentRequest(new URL(request.url)),response.clone());
    }
  };
  // Only a lightweight recovery shell is installation-blocking.
  // Large databases, search indexes, radio assets and tools are cached on first
  // use or by the explicit offline save, so worker activation stays responsive.
  const installRequired=[...REQUIRED.slice(0,9)];
  const requiredController=new AbortController();
  const requiredTimeout=setTimeout(()=>requiredController.abort(),12000);
  try{
    await Promise.all(installRequired.map(item=>put(item,requiredController.signal)));
    const destination=await caches.open(CACHE_NAME);
    for(const request of await cache.keys()){
      const response=await cache.match(request);
      if(response)await destination.put(request,response);
    }
  }catch(error){
    // Never remove the active generation's recovery cache when a same-version
    // worker update or a partially uploaded release fails validation.
    await caches.delete(stagingName);
    throw error;
  }finally{
    clearTimeout(requiredTimeout);
    await caches.delete(stagingName);
  }
}
self.addEventListener('install',event=>{
  event.waitUntil(cacheCoreSafely().then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    if(self.registration.navigationPreload){
      // Canonical in-flight sharing below owns document networking. Browser
      // navigation preload would start a second request before the fetch event
      // can join a touch/focus prefetch already in progress.
      try{await self.registration.navigationPreload.disable()}catch(_e){}
    }
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
  if(event.data?.type==='GET_BUILD_INFO'){
    const payload={type:'MARKET_BASE_BUILD_INFO',buildId:BUILD_ID,version:VERSION,assetVersion:ASSET_VERSION,cacheName:CACHE_NAME};
    try{event.ports?.[0]?.postMessage(payload)}catch(_e){}
  }
  if(event.data?.type==='BEGIN_MANUAL_REFRESH'){
    const requestId=String(event.data?.requestId||'');
    const operation=(async()=>{
      // Persist the bounded repair window. iOS is free to terminate an idle
      // worker immediately after reload; a later worker must repair lazy data
      // and media using the same window rather than reverting to stale cache.
      const until=Math.max(forceNetworkUntil,Date.now()+MANUAL_REFRESH_TTL_MS);
      const cache=await caches.open(MANUAL_REFRESH_CACHE);
      await cache.put(MANUAL_REFRESH_REQUEST,new Response(JSON.stringify({
        buildId:BUILD_ID,
        assetVersion:ASSET_VERSION,
        until
      }),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));
      forceNetworkUntil=until;
      manualRefreshStateLoaded=true;
      replyToMessage(event,{
        type:'BEGIN_MANUAL_REFRESH_ACK',requestId,ok:true,until,
        buildId:BUILD_ID,assetVersion:ASSET_VERSION
      });
    })().catch(error=>{
      replyToMessage(event,{
        type:'BEGIN_MANUAL_REFRESH_ACK',requestId,ok:false,
        error:String(error?.message||error)
      });
      throw error;
    });
    event.waitUntil(operation);
  }
  if(event.data?.type==='OFFLINE_MODE_CHANGED'){
    // The page changes the authoritative sentinel before sending this message.
    // Update the memo synchronously, then acknowledge so saving, probing or
    // destructive cleanup cannot race the previous one-second value.
    const generation=String(event.data?.generation||'');
    const incomingOrder=offlineGenerationOrder(generation);
    const stale=!!(
      offlineModeGeneration&&
      incomingOrder>0&&
      offlineModeGenerationOrder>0&&
      incomingOrder<offlineModeGenerationOrder
    );
    if(!stale){
      offlineModeGeneration=generation;
      offlineModeGenerationOrder=incomingOrder;
      offlineModeMemo=!!event.data?.active;
      offlineModeCheckedAt=Date.now();
    }
    replyToMessage(event,{
      type:'OFFLINE_MODE_CHANGED_ACK',requestId:String(event.data?.requestId||''),
      generation,active:offlineModeMemo,ok:!stale,stale
    });
  }
  if(event.data?.type==='CLEAR_MARKET_BASE_CACHE') event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      if(
        key.startsWith('market-base-') &&
        key!==CACHE_NAME
      ) await caches.delete(key);
    }
  })());
  if(event.data?.type==='CLEAR_OFFLINE_CONTENT'){
    offlineModeMemo=false;
    offlineModeCheckedAt=Date.now();
    event.waitUntil(Promise.all([
      caches.delete(OFFLINE_TEXT_CACHE),
      caches.delete(OFFLINE_IMAGE_CACHE),
      caches.delete(OFFLINE_STATE_CACHE)
    ]));
  }
});

let forceNetworkUntil=0;
let manualRefreshStateLoaded=false;
let manualRefreshStatePromise=null;
let offlineModeMemo=false;
let offlineModeCheckedAt=0;
let offlineModeGeneration='';
let offlineModeGenerationOrder=0;

function replyToMessage(event,payload){
  try{event.ports?.[0]?.postMessage(payload)}catch(_e){}
}

function offlineGenerationOrder(generation){
  const value=Number(String(generation||'').split('-')[0]);
  return Number.isFinite(value)&&value>0?value:0;
}

async function manualRefreshUntil(){
  if(Date.now()<forceNetworkUntil)return forceNetworkUntil;
  if(manualRefreshStateLoaded)return forceNetworkUntil;
  if(!manualRefreshStatePromise){
    manualRefreshStatePromise=(async()=>{
      try{
        const cache=await caches.open(MANUAL_REFRESH_CACHE);
        const response=await cache.match(MANUAL_REFRESH_REQUEST);
        if(!response)return 0;
        const stored=await response.json();
        if(
          stored?.buildId===BUILD_ID&&
          stored?.assetVersion===ASSET_VERSION&&
          Number(stored?.until||0)>Date.now()
        ) forceNetworkUntil=Math.max(forceNetworkUntil,Number(stored.until));
      }catch(_e){}
      manualRefreshStateLoaded=true;
      return forceNetworkUntil;
    })().finally(()=>{manualRefreshStatePromise=null});
  }
  return manualRefreshStatePromise;
}

async function manualRepairIsActive(){
  return Date.now()<(await manualRefreshUntil());
}
async function offlineModeIsActive(){
  const now=Date.now();
  if(now-offlineModeCheckedAt<1000)return offlineModeMemo;
  try{
    const cache=await caches.open(OFFLINE_STATE_CACHE);
    offlineModeMemo=!!(await cache.match(OFFLINE_STATE_REQUEST));
  }catch(_e){
    offlineModeMemo=false;
  }
  offlineModeCheckedAt=now;
  return offlineModeMemo;
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
    const coreOffline=await core.match('./offline.html?v=20260810-v333-18-cache-radio-navigation-stability',{ignoreSearch:true});
    if(coreOffline)return coreOffline;
  }
  return Response.error();
}

function cacheResponseInBackground(backgroundTasks,cache,request,response){
  if(!response.ok)return;
  const copy=response.clone();
  backgroundTasks.push(
    Promise.resolve()
      .then(()=>cache.put(request,copy))
      .catch(()=>undefined)
  );
}

function isVersionProbe(url){
  return /(?:^|\/)version\.txt$/i.test(url.pathname);
}

function isDocumentRequest(request){
  return request.mode==='navigate'||request.destination==='document';
}

function canonicalDocumentRequest(url){
  const canonical=new URL(url.origin+url.pathname);
  const rootPath=new URL('./',self.location.href).pathname;
  if(canonical.pathname===rootPath)canonical.pathname=`${rootPath}index.html`;
  return new Request(canonical.href,{method:'GET'});
}

function hasTemporaryParams(url){
  for(const key of TEMPORARY_DOCUMENT_PARAMS){
    if(url.searchParams.has(key))return true;
  }
  return false;
}

function canonicalVersionedAssetRequest(url){
  const stable=new URL(url.href);
  for(const key of TEMPORARY_DOCUMENT_PARAMS)stable.searchParams.delete(key);
  return new Request(stable.href,{method:'GET'});
}

const documentNetworkInflight=new Map();
const documentFreshUntil=new Map();

function sharedDocumentNetwork(request,canonical,cache,backgroundTasks){
  const key=canonical.url;
  let entry=documentNetworkInflight.get(key);
  if(!entry){
    const responsePromise=fetch(request,{cache:'reload'});
    entry={responsePromise,completion:null};
    entry.completion=responsePromise.then(async response=>{
      if(!response.ok)return;
      await cache.put(canonical,response.clone());
      documentFreshUntil.set(key,Date.now()+DOCUMENT_FRESH_MS);
    }).finally(()=>{
      if(documentNetworkInflight.get(key)===entry)documentNetworkInflight.delete(key);
    });
    documentNetworkInflight.set(key,entry);
  }
  backgroundTasks.push(entry.completion.catch(()=>undefined));
  // Every caller receives its own body while sharing one actual fetch.
  return entry.responsePromise.then(response=>response.clone());
}

async function documentResponse(event,url,cache,backgroundTasks,repairWindow){
  const request=event.request;
  const canonical=canonicalDocumentRequest(url);
  const explicitRefresh=url.searchParams.has('refresh')||url.searchParams.has('autoRefresh');
  const isPrefetch=url.searchParams.has('mb-prefetch');
  if(explicitRefresh||repairWindow){
    forceNetworkUntil=Math.max(forceNetworkUntil,Date.now()+20000);
    try{
      return await sharedDocumentNetwork(request,canonical,cache,backgroundTasks);
    }catch(_e){
      return (await cache.match(canonical))||offlineFallback(request);
    }
  }
  const inflight=documentNetworkInflight.get(canonical.url);
  if(inflight){
    try{return await sharedDocumentNetwork(request,canonical,cache,backgroundTasks)}
    catch(_e){
      return (await cache.match(canonical))||offlineFallback(request);
    }
  }
  const cached=await cache.match(canonical);
  if(cached){
    if(Number(documentFreshUntil.get(canonical.url)||0)<=Date.now()){
      sharedDocumentNetwork(request,canonical,cache,backgroundTasks).catch(()=>undefined);
    }
    return cached;
  }
  try{
    return await sharedDocumentNetwork(request,canonical,cache,backgroundTasks);
  }catch(_e){
    if(isPrefetch)return Response.error();
    return offlineFallback(request);
  }
}

async function onlineSameOriginResponse(event,url,backgroundTasks){
  const request=event.request;
  const cache=await caches.open(CACHE_NAME);
  const isDocument=isDocumentRequest(request)||(
    url.searchParams.has('mb-prefetch')&&
    (/\/$/.test(url.pathname)||/\.html?$/i.test(url.pathname))
  );
  if(isVersionProbe(url)){
    // A version response doubles as the connectivity proof used before
    // deleting a user's offline snapshot. Never disguise network failure with
    // an installed or user-saved copy.
    try{return await fetch(request,{cache:'no-store'})}
    catch(_e){return Response.error()}
  }
  const repairWindow=await manualRepairIsActive();
  if(isDocument)return documentResponse(event,url,cache,backgroundTasks,repairWindow);
  // Explicit offline downloads own their dedicated cache. Avoid writing the
  // same 80MB-scale payload into the runtime cache a second time.
  if(url.searchParams.has('mb-offline-save')){
    try{return await fetch(request,{cache:'reload'})}
    catch(_e){return Response.error()}
  }
  // A caller that explicitly forbids storage must never create a unique
  // CacheStorage entry (notably timestamped probes and transient searches).
  if(request.cache==='no-store'){
    try{return await fetch(request,{cache:'no-store'})}
    catch(_e){return Response.error()}
  }
  const isVersionedStaticAsset=!isDocument&&
    (url.searchParams.has('v')||url.searchParams.has('mbv'));
  if(isVersionedStaticAsset){
    const token=url.searchParams.get('v')||url.searchParams.get('mbv');
    const isCurrentToken=token===ASSET_VERSION;
    const stableRequest=canonicalVersionedAssetRequest(url);
    if(isCurrentToken&&!repairWindow){
      const exactCached=await cache.match(stableRequest);
      if(exactCached)return exactCached;
    }
    try{
      const response=await fetch(request,{cache:'reload'});
      if(isCurrentToken)cacheResponseInBackground(backgroundTasks,cache,stableRequest,response);
      return response;
    }catch(_e){
      // A release token is an integrity boundary. In particular, an old image
      // or SVG must not satisfy the first render of the current release merely
      // because its pathname matches when the query is ignored.
      return (await cache.match(stableRequest))||Response.error();
    }
  }
  const isShellAsset=request.destination==='style'||request.destination==='script'||url.pathname.endsWith('.css')||url.pathname.endsWith('.js')||url.pathname.endsWith('/manifest.json')||url.pathname.endsWith('/manifest.webmanifest');
  const isFreshData=url.pathname.endsWith('.json')||url.pathname.endsWith('/assets/js/official-site-preview-allowlist-v325.js');
  const isHistoryAsset=url.pathname.endsWith('/data/world-history-today-v028.js')||url.pathname.endsWith('/assets/js/world-history-learn-r11330.js');
  const isWorldRoute=url.pathname.endsWith('/world-route.html')||url.pathname.includes('/world-route/')||url.pathname.includes('/assets/images/world-route/');
  if(isWorldRoute||isShellAsset||isFreshData||isHistoryAsset){
    try{
      const response=await fetch(request,{cache:'reload'});
      if(!hasTemporaryParams(url))cacheResponseInBackground(backgroundTasks,cache,request,response);
      return response;
    }catch(_e){
      const cached=await cache.match(request,{ignoreSearch:true});
      if(cached)return cached;
      return Response.error();
    }
  }
  const cached=(await cache.match(request))||
    (await cache.match(request,{ignoreSearch:true}));
  if(cached){
    backgroundTasks.push(
      fetch(request)
        .then(response=>response.ok?cache.put(request,response.clone()):undefined)
        .catch(()=>undefined)
    );
    return cached;
  }
  try{
    const response=await fetch(request);
    cacheResponseInBackground(backgroundTasks,cache,request,response);
    return response;
  }catch(_e){
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const accepts=event.request.headers.get('Accept')||'';
  const isLiveMedia=event.request.destination==='audio'||
    event.request.destination==='video'||
    event.request.headers.has('Range')||
    /(?:audio|video|mpegurl)/i.test(accepts)||
    /\.(?:m3u8|m4s|ts|aac|mp3|ogg|oga|opus|wav)(?:$|\?)/i.test(url.href);
  if(isLiveMedia)return;
  const sameOrigin=url.origin===self.location.origin;
  if(!sameOrigin&&event.request.destination!=='image')return;
  const backgroundTasks=[];
  let finishResponse;
  const responseFinished=new Promise(resolve=>{finishResponse=resolve});
  event.waitUntil(responseFinished.then(()=>Promise.all(backgroundTasks)));
  const responsePromise=(async()=>{
    // Connectivity/version probes must bypass offline memo and saved content.
    // The caller needs an actual origin response or a visible failure.
    if(sameOrigin&&isVersionProbe(url)){
      return onlineSameOriginResponse(event,url,backgroundTasks);
    }
    if(await offlineModeIsActive()){
      const cached=await offlineMatch(event.request,url);
      if(cached)return cached;
      return offlineFallback(event.request);
    }
    if(!sameOrigin){
      try{return await fetch(event.request)}
      catch(_e){return Response.error()}
    }
    return onlineSameOriginResponse(event,url,backgroundTasks);
  })();
  responsePromise.then(finishResponse,finishResponse);
  event.respondWith(responsePromise);
});
