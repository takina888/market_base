(function(global){
  'use strict';
  if(global.MarketBaseNavigation)return;

  var TOKEN='20260810-v333-19-android-install-stability';
  var script=document.currentScript;
  var scriptUrl=script&&script.src?new URL(script.src):new URL('assets/js/market-base-navigation-v333-18.js',location.href);
  var siteRoot=new URL('../../',scriptUrl);
  var prefetched=new Set();
  var pending=new Map();
  var RADIO_STATE_KEY='market_base_radio_state_v1';
  var LEGACY_RADIO_GRACE_MS=90*1000;
  var initialRevealDone=false;
  var revealTimer=0;
  var scrollSaveFrame=0;
  var pendingScrollRestore=null;
  var scrollRestoreTimer=0;
  var scrollRestoreSequence=0;
  var traversingHistory=false;
  var initialEntryScrollY=(function(){
    try{
      var value=Number(global.history&&global.history.state&&global.history.state.mbScrollY);
      return Number.isFinite(value)?Math.max(0,value):null;
    }catch(_){return null;}
  })();

  function normalizedIndexPath(path){return String(path||'').replace(/\/index\.html$/i,'/');}
  function isMainDocument(){return normalizedIndexPath(location.pathname)===normalizedIndexPath(new URL('index.html',siteRoot).pathname);}
  function constrainedConnection(){
    var connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    return !!(connection&&(connection.saveData||/(?:^|-)2g$/.test(connection.effectiveType||'')));
  }
  function radioPlaybackActive(){
    try{
      var state=JSON.parse(localStorage.getItem(RADIO_STATE_KEY)||'null');
      if(!state||!(state.playing||state.status==='playing'))return false;
      var now=Date.now();
      var validUntil=Number(state.validUntil);
      if(Number.isFinite(validUntil)&&validUntil>0)return validUntil>now;
      var updatedAt=Number(state.updatedAt);
      return Number.isFinite(updatedAt)&&updatedAt<=now&&now-updatedAt<LEGACY_RADIO_GRACE_MS;
    }catch(_){return false;}
  }
  function ensureStyles(){
    if(document.querySelector('link[data-mb-navigation-style]'))return;
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href=new URL('assets/css/market-base-navigation-v333-18.css?v='+encodeURIComponent(TOKEN),siteRoot).href;
    link.dataset.mbNavigationStyle='';
    document.head.appendChild(link);
  }
  function routeForMainUrl(url){
    if(!isMainDocument()||url.origin!==location.origin)return null;
    if(normalizedIndexPath(url.pathname)!==normalizedIndexPath(new URL('index.html',siteRoot).pathname))return null;
    if(url.searchParams.has('open_country')||url.searchParams.has('open_section')||url.hash)return null;
    var view=(url.searchParams.get('view')||'').toLowerCase();
    if(view==='search')view='global-search';
    return ['', 'countries','global-search','rankings','compare','learn','rice','school','japan'].indexOf(view)>=0?view:null;
  }
  function eligibleAnchor(target){
    var anchor=target&&target.closest?target.closest('a[href]'):null;
    if(!anchor||anchor.hasAttribute('download')||anchor.target&&anchor.target!=='_self')return null;
    if(anchor.getAttribute('rel')&&/\bexternal\b/i.test(anchor.getAttribute('rel')))return null;
    var url;
    try{url=new URL(anchor.href,location.href);}catch(_){return null;}
    if(url.origin!==location.origin||!/^https?:$/.test(url.protocol))return null;
    return {anchor:anchor,url:url};
  }
  function documentUrlForPrefetch(url){
    if(routeForMainUrl(url)!==null)return null;
    var pathname=url.pathname.toLowerCase();
    if(!(/\/$/.test(pathname)||/\.html?$/.test(pathname)))return null;
    var next=new URL(url.href);
    next.hash='';
    next.searchParams.set('mb-prefetch','1');
    return next;
  }
  function prefetch(rawUrl){
    if(constrainedConnection()||radioPlaybackActive()||document.visibilityState==='hidden'||!navigator.onLine)return Promise.resolve(false);
    var url;
    try{url=rawUrl instanceof URL?rawUrl:new URL(rawUrl,location.href);}catch(_){return Promise.resolve(false);}
    url=documentUrlForPrefetch(url);
    if(!url)return Promise.resolve(false);
    var key=url.origin+url.pathname+url.search;
    if(prefetched.has(key))return pending.get(key)||Promise.resolve(true);
    prefetched.add(key);
    var job=fetch(url.href,{credentials:'same-origin',cache:'force-cache',priority:'low'}).then(function(response){
      if(!response.ok)throw new Error('prefetch '+response.status);
      return response.arrayBuffer();
    }).then(function(){pending.delete(key);return true;}).catch(function(){pending.delete(key);prefetched.delete(key);return false;});
    pending.set(key,job);
    return job;
  }

  var hoverTimer=0;
  var lastPointerAt=0;
  function scheduleFromEvent(event){
    var match=eligibleAnchor(event.target);
    if(!match)return;
    global.clearTimeout(hoverTimer);
    hoverTimer=global.setTimeout(function(){prefetch(match.url);},90);
  }
  document.addEventListener('pointerdown',function(){lastPointerAt=Date.now();},{passive:true});
  document.addEventListener('pointerover',function(event){
    // A finger resting on a link is normally the beginning of a scroll. Only
    // devices with a real hover pointer may prefetch before activation.
    if(event.pointerType&&event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
    scheduleFromEvent(event);
  },{passive:true});
  document.addEventListener('pointerout',function(event){
    var match=eligibleAnchor(event.target);
    if(!match)return;
    if(event.relatedTarget&&match.anchor.contains&&match.anchor.contains(event.relatedTarget))return;
    global.clearTimeout(hoverTimer);
  },{passive:true});
  document.addEventListener('focusin',function(event){
    // Pointer-generated focus (notably an iPhone tap) must not race the real
    // navigation. Keyboard focus remains a useful desktop intent signal.
    if(Date.now()-lastPointerAt<700)return;
    scheduleFromEvent(event);
  });

  document.addEventListener('click',function(event){
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    var match=eligibleAnchor(event.target);
    if(!match)return;
    var route=routeForMainUrl(match.url);
    var router=global.MarketBaseInPageRouter;
    if(route!==null&&router&&typeof router.navigate==='function'){
      event.preventDefault();
      event.stopImmediatePropagation();
      router.navigate(route||'home',{source:'link'});
      return;
    }
  },true);

  function currentScrollY(){
    return Math.max(0,Math.round(global.scrollY||document.documentElement.scrollTop||0));
  }
  function saveCurrentScroll(){
    scrollSaveFrame=0;
    if(!isMainDocument()||traversingHistory)return false;
    try{
      var current=(global.history.state&&typeof global.history.state==='object')?global.history.state:{};
      var y=currentScrollY();
      if(Number(current.mbScrollY)===y)return true;
      global.history.replaceState(Object.assign({},current,{mbScrollY:y}),'',global.location.href);
      return true;
    }catch(_){return false;}
  }
  function scheduleScrollSave(){
    if(scrollSaveFrame||!isMainDocument())return;
    scrollSaveFrame=global.requestAnimationFrame(saveCurrentScroll);
  }
  function applyPendingScrollRestore(finalize){
    if(!pendingScrollRestore)return;
    var pendingState=pendingScrollRestore;
    global.scrollTo({top:pendingState.y,left:0,behavior:'auto'});
    if(finalize&&pendingScrollRestore===pendingState){
      pendingScrollRestore=null;
      global.clearTimeout(scrollRestoreTimer);
      scrollRestoreTimer=0;
    }
  }
  function restoreAfterStableLayout(finalize){
    if(!pendingScrollRestore)return;
    var sequence=pendingScrollRestore.sequence;
    global.requestAnimationFrame(function(){
      global.requestAnimationFrame(function(){
        if(!pendingScrollRestore||pendingScrollRestore.sequence!==sequence)return;
        applyPendingScrollRestore(!!finalize);
      });
    });
  }
  function beginHistoryRestore(state){
    if(!isMainDocument())return;
    var y=Number(state&&state.mbScrollY);
    pendingScrollRestore={
      y:Number.isFinite(y)?Math.max(0,y):0,
      sequence:++scrollRestoreSequence
    };
    global.clearTimeout(scrollRestoreTimer);
    restoreAfterStableLayout(false);
    // Already-rendered views do not emit viewrendered. This fallback runs
    // after their layout and never interrupts the first two paint frames.
    scrollRestoreTimer=global.setTimeout(function(){applyPendingScrollRestore(true);},220);
  }
  function finishReveal(){
    global.clearTimeout(revealTimer);
    revealTimer=0;
    document.documentElement.classList.remove('mb-page-entering','mb-page-restored');
  }
  function revealPage(event){
    var restored=!!(event&&event.persisted);
    if(initialRevealDone&&!restored)return;
    initialRevealDone=true;
    global.clearTimeout(revealTimer);
    document.documentElement.classList.add('mb-page-entering');
    if(restored){
      document.documentElement.classList.add('mb-page-restored');
      beginHistoryRestore(global.history&&global.history.state);
    }else if(isMainDocument()&&initialEntryScrollY!==null&&initialEntryScrollY>0){
      // A non-bfcache Back/Forward or reload creates a new Document. Preserve
      // the entry value captured before the main app normalizes history.state.
      beginHistoryRestore({mbScrollY:initialEntryScrollY});
    }
    // The opacity animation is 160ms. Keep the class through its full duration
    // instead of cutting it off after two animation frames.
    revealTimer=global.setTimeout(finishReveal,220);
  }
  if(isMainDocument()){
    try{if('scrollRestoration'in global.history)global.history.scrollRestoration='manual';}catch(_){}
    global.addEventListener('scroll',scheduleScrollSave,{passive:true});
    global.addEventListener('scrollend',saveCurrentScroll,{passive:true});
    global.addEventListener('popstate',function(event){
      traversingHistory=true;
      beginHistoryRestore(event.state);
    });
    document.addEventListener('marketbase:before-viewchange',saveCurrentScroll);
    document.addEventListener('marketbase:viewchange',function(){
      if(pendingScrollRestore)restoreAfterStableLayout(false);
      traversingHistory=false;
    });
    document.addEventListener('marketbase:viewrendered',function(){
      if(pendingScrollRestore)restoreAfterStableLayout(true);
    });
  }
  global.addEventListener('pageshow',revealPage);
  global.addEventListener('pagehide',function(){
    saveCurrentScroll();
    global.clearTimeout(revealTimer);
    document.documentElement.classList.remove('mb-page-entering','mb-page-restored');
  });
  ensureStyles();
  // pageshow is the single normal entry signal. This fallback only covers a
  // dynamically injected module whose document has already been shown.
  if(document.readyState==='complete')global.setTimeout(function(){
    if(!initialRevealDone)revealPage({persisted:false});
  },0);

  global.MarketBaseNavigation=Object.freeze({
    prefetch:prefetch,
    isMainDocument:isMainDocument,
    isConstrained:constrainedConnection,
    isRadioPlaying:radioPlaybackActive,
    saveScrollPosition:saveCurrentScroll
  });
})(window);
