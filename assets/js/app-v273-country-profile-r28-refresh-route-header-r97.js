(function(){
  'use strict';
  if(window.MarketBaseInPageRouter)return;
  var current=document.currentScript;
  var src=current&&current.src?new URL(current.src):new URL('assets/js/app-v273-country-profile-r28-refresh-route-header-r97.js',location.href);
  src.pathname=src.pathname.replace(/r97\.js$/,'r99.js');
  src.search='?v=20260810-v333-18-cache-radio-navigation-stability';
  var script=document.createElement('script');
  script.src=src.href;
  script.async=false;
  script.dataset.mbAppCompatibility='r97-r99';
  document.head.appendChild(script);
})();
