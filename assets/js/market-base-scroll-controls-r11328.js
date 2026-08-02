(function(){
  'use strict';
  var LEGACY_SELECTOR='.mbu-top-button,.topbtn,.top-anchor,.back-to-top,.to-top,.scroll-top,.page-top';
  var BOTTOM_NAV_SELECTOR='.mb-primary-bottom-nav,.mb-global-bottom-nav,.mbx-bottom-nav,.bottom-nav';
  var SCRIPT_URL=(document.currentScript&&document.currentScript.src)?document.currentScript.src:'';
  var SITE_ROOT;
  try{SITE_ROOT=SCRIPT_URL?new URL('../../',SCRIPT_URL):new URL('./',location.href);}catch(_e){SITE_ROOT=new URL('./',location.href);}
  var HOME_URL=new URL('index.html',SITE_ROOT);
  var UPDATE_CONTROLLER_URL=new URL('assets/js/market-base-update-controller-v331.js?v=20260802-v331-dock-list-update-hotfix',SITE_ROOT);
  var LEARN_PREFIXES=['british-jokes/','classic-move/','haccp-quiz/','hs-learning/','international-logistics/','material-check/','rakuda-no-me/','sutra-no-yoin/','ul-ce-learning/','work-basics/'];
  var LEARN_FILES={'world-history-today.html':true};
  var COUNTRY_FILES={'market-base-v273-country-profile-r28.html':true};
  var TOOL_FILES={'market-base-currency-converter-v273-r29.html':true,'market-base-code-tool.html':true,'world-compass.html':true};
  var MOBILE_QUERY=window.matchMedia('(max-width:760px)');
  var IDLE_DELAY=1500;
  var PASS_THROUGH_MS=420;

  function removeLegacyControls(){document.querySelectorAll(LEGACY_SELECTOR).forEach(function(node){node.remove();});}
  function loadUpdateController(){
    if(window.MarketBaseUpdate||document.querySelector('script[data-mb-update-controller]'))return;
    var script=document.createElement('script');script.src=UPDATE_CONTROLLER_URL.href;script.async=false;script.dataset.mbUpdateController='';document.head.appendChild(script);
  }
  function hasBottomNav(){return document.body.classList.contains('mb-has-global-bottom-nav')||document.body.classList.contains('mb-has-primary-bottom-nav')||!!document.querySelector(BOTTOM_NAV_SELECTOR);}
  function normalizedIndexPath(pathname){return String(pathname||'').replace(/\/index\.html$/i,'/');}
  function siteRelativePath(){var rootPath=SITE_ROOT.pathname;var currentPath=location.pathname;if(currentPath.indexOf(rootPath)===0)return currentPath.slice(rootPath.length).replace(/^\/+/, '');return currentPath.replace(/^\/+/, '');}
  function explicitTarget(control){if(!control)return '';var raw=control.getAttribute('data-mbx-back')||control.getAttribute('data-mb-back-href')||'';if(!raw&&control.id==='backButton')raw=document.body.dataset.marketBaseHome||'';if(!raw&&control.hasAttribute('data-mb-back'))raw=control.getAttribute('data-mb-back')||'';if(!raw)return '';try{return new URL(raw,location.href).href;}catch(_e){return '';}}
  function homeTarget(view){var url=new URL(HOME_URL.href);if(view)url.searchParams.set('view',view);return url.href;}
  function safeBackTarget(control){
    var explicit=explicitTarget(control);if(explicit&&normalizedIndexPath(new URL(explicit).pathname)!==normalizedIndexPath(location.pathname))return explicit;
    var rel=siteRelativePath();var file=rel.split('/').filter(Boolean).pop()||'index.html';var currentIsHome=normalizedIndexPath(location.pathname)===normalizedIndexPath(HOME_URL.pathname);
    if(currentIsHome){var view=new URL(location.href).searchParams.get('view');if(view||location.hash)return homeTarget('');return '';}
    if(LEARN_FILES[file]||LEARN_PREFIXES.some(function(prefix){return rel.indexOf(prefix)===0;}))return homeTarget('learn');
    if(COUNTRY_FILES[file])return homeTarget('countries');
    if(TOOL_FILES[file]||rel.indexOf('world-radio/')===0)return homeTarget('');
    return homeTarget('');
  }
  function goSafeBack(control){var target=safeBackTarget(control);if(!target)return false;try{if(new URL(target).href===location.href)return false;}catch(_e){return false;}window.location.replace(target);return true;}
  function interceptPageBack(event){var control=event.target.closest('[data-mbx-back],[data-mb-back],#backButton');if(!control)return;event.preventDefault();event.stopImmediatePropagation();if(!goSafeBack(control)){control.disabled=true;control.setAttribute('aria-disabled','true');control.title='これ以上戻る画面はありません';}}

  function mountScrollControls(){
    if(document.querySelector('[data-mb-scroll-controls]'))return;
    removeLegacyControls();if(hasBottomNav())document.body.classList.add('mb-has-page-bottom-nav');
    var rail=document.createElement('nav');rail.className='mb-scroll-controls';rail.setAttribute('data-mb-scroll-controls','');rail.setAttribute('aria-label','ページ内移動');
    var up=document.createElement('button');up.type='button';up.className='mb-scroll-control mb-scroll-control-up';up.setAttribute('aria-label','ページ上部へ移動');up.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 11 7-7 7 7"></path><path d="M12 4v16"></path></svg>';
    var back=document.createElement('button');back.type='button';back.className='mb-scroll-control mb-scroll-control-back';back.setAttribute('aria-label','前の画面へ戻る');back.innerHTML='<span class="mb-scroll-control-back-label" aria-hidden="true">BACK</span>';
    var down=document.createElement('button');down.type='button';down.className='mb-scroll-control mb-scroll-control-down';down.setAttribute('aria-label','ページ下部へ移動');down.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 13 7 7 7-7"></path><path d="M12 20V4"></path></svg>';
    var wake=document.createElement('button');wake.type='button';wake.className='mb-scroll-control-wake';wake.setAttribute('aria-label','ページ移動ボタンを表示');wake.setAttribute('title','ページ移動ボタンを表示');wake.innerHTML='<span aria-hidden="true">‹</span>';wake.hidden=true;
    up.addEventListener('click',function(){window.scrollTo({top:0,left:0,behavior:'smooth'});});back.addEventListener('click',function(){goSafeBack(back);});down.addEventListener('click',function(){var end=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);window.scrollTo({top:end,left:0,behavior:'smooth'});});
    rail.append(up,back,down);document.body.append(rail,wake);

    var ticking=false,idleTimer=0,passTimer=0,pointerActive=false;
    function isFormActive(){var el=document.activeElement;return !!(el&&el.matches&&el.matches('input,textarea,select,[contenteditable="true"]'));}
    function clearIdle(){window.clearTimeout(idleTimer);idleTimer=0;}
    function armIdle(){
      clearIdle();if(!MOBILE_QUERY.matches||rail.hidden||pointerActive||isFormActive())return;
      idleTimer=window.setTimeout(function(){if(pointerActive||isFormActive()||rail.hidden)return;rail.classList.add('is-idle');wake.hidden=false;},IDLE_DELAY);
    }
    function showRail(passThrough){
      clearIdle();wake.hidden=true;rail.classList.remove('is-idle');
      window.clearTimeout(passTimer);
      if(passThrough){rail.classList.add('is-pass-through');passTimer=window.setTimeout(function(){rail.classList.remove('is-pass-through');armIdle();},PASS_THROUGH_MS);}else{rail.classList.remove('is-pass-through');armIdle();}
    }
    wake.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();showRail(false);});
    function activity(event){
      if(!MOBILE_QUERY.matches)return;
      var wasIdle=rail.classList.contains('is-idle');
      if(event.type==='pointerdown'||event.type==='touchstart')pointerActive=true;
      showRail(wasIdle&&event.target!==wake);
    }
    function activityEnd(){pointerActive=false;armIdle();}
    ['pointerdown','touchstart','touchmove','scroll','keydown','input','focusin'].forEach(function(type){document.addEventListener(type,activity,{capture:true,passive:type!=='keydown'&&type!=='input'&&type!=='focusin'});});
    ['pointerup','pointercancel','touchend','touchcancel','focusout'].forEach(function(type){document.addEventListener(type,activityEnd,{capture:true,passive:true});});
    MOBILE_QUERY.addEventListener?.('change',function(){if(MOBILE_QUERY.matches)armIdle();else{clearIdle();wake.hidden=true;rail.classList.remove('is-idle','is-pass-through');}});

    var update=function(){
      ticking=false;var doc=document.documentElement;var top=Math.max(window.scrollY||0,doc.scrollTop||0);var viewport=window.innerHeight||doc.clientHeight||0;var height=Math.max(doc.scrollHeight,document.body.scrollHeight);var max=Math.max(0,height-viewport);var scrollable=max>80;var hasBack=!!safeBackTarget(back);
      rail.hidden=!scrollable&&!hasBack;wake.hidden=rail.hidden||!MOBILE_QUERY.matches||!rail.classList.contains('is-idle');up.hidden=!scrollable;down.hidden=!scrollable;up.disabled=!scrollable||top<=24;down.disabled=!scrollable||top>=max-24;back.hidden=!hasBack;back.disabled=!hasBack;back.setAttribute('aria-disabled',hasBack?'false':'true');if(!rail.hidden)armIdle();
    };
    function requestUpdate(){if(ticking)return;ticking=true;window.requestAnimationFrame(update);}
    window.addEventListener('scroll',requestUpdate,{passive:true});window.addEventListener('resize',requestUpdate,{passive:true});window.addEventListener('load',requestUpdate,{once:true});window.addEventListener('popstate',requestUpdate);window.addEventListener('hashchange',requestUpdate);if('ResizeObserver'in window)new ResizeObserver(requestUpdate).observe(document.body);requestUpdate();
  }
  window.MarketBaseSafeBack=Object.freeze({target:safeBackTarget,go:goSafeBack});document.addEventListener('click',interceptPageBack,true);loadUpdateController();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountScrollControls,{once:true});else mountScrollControls();
})();
