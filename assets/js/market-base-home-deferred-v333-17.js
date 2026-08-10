(function(global){
  'use strict';
  if(global.MarketBaseHomeDeferred)return;

  var TOKEN='20260810-v333-18-cache-radio-navigation-stability';
  var promises=Object.create(null);
  var failures=Object.create(null);
  var states=Object.create(null);
  var RADIO_STATE_KEY='market_base_radio_state_v1';
  var LEGACY_RADIO_GRACE_MS=90*1000;
  var groups=Object.freeze({
    country:[
      ['embedded-country-profile-data-v273-r28.js','MARKET_BASE_COUNTRY_PROFILES'],
      ['data/country-distinctive-facts-v333-15.js','MARKET_BASE_COUNTRY_DISTINCTIVE_FACTS'],
      ['data/country-local-rules.js','MARKET_BASE_COUNTRY_LOCAL_RULES']
    ],
    history:[
      ['data/world-history-today-v028.js','MARKET_BASE_WORLD_HISTORY'],
      ['assets/js/world-history-learn-r11330.js','']
    ],
    why:[
      ['data/world-why-365-v015.js','MARKET_BASE_WORLD_WHY_QA'],
      ['assets/js/world-why-learn-r11327.js','']
    ],
    journey:[
      ['embedded-country-profile-data-v273-r28.js','MARKET_BASE_COUNTRY_PROFILES'],
      ['data/images/todays-journey-image-manifest-r11370.js','MARKET_BASE_TODAYS_JOURNEY_IMAGE_MANIFEST']
    ],
    photos:[
      ['data/images/photo-registry-embedded.js','MARKET_BASE_PHOTO_REGISTRY_EMBEDDED'],
      ['assets/js/photo-registry-v1.js','MARKET_BASE_PHOTO_REGISTRY'],
      ['assets/js/daily-retail-showcase-v1.js','MARKET_BASE_DAILY_RETAIL_SHOWCASE']
    ]
  });

  function connectionIsConstrained(){
    var connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    return !!(connection&&(connection.saveData||/(?:^|-)2g$/.test(connection.effectiveType||'')));
  }
  function radioPlaybackActive(){
    try{
      if(global.MarketBaseNavigation&&typeof global.MarketBaseNavigation.isRadioPlaying==='function'){
        return !!global.MarketBaseNavigation.isRadioPlaying();
      }
      var state=JSON.parse(global.localStorage?.getItem(RADIO_STATE_KEY)||'null');
      if(!state||!(state.playing||state.status==='playing'))return false;
      var now=Date.now();
      var validUntil=Number(state.validUntil);
      if(Number.isFinite(validUntil)&&validUntil>0)return validUntil>now;
      var updatedAt=Number(state.updatedAt);
      return Number.isFinite(updatedAt)&&updatedAt<=now&&now-updatedAt<LEGACY_RADIO_GRACE_MS;
    }catch(_){return false;}
  }
  function optionalWarmupAllowed(){
    return navigator.onLine!==false&&
      document.visibilityState!=='hidden'&&
      !connectionIsConstrained()&&
      !radioPlaybackActive();
  }

  function assetUrl(path){
    var url=new URL(path,document.baseURI);
    url.searchParams.set('v',TOKEN);
    return url.href;
  }
  function fallbackLoad(path,globalName){
    if(globalName&&global[globalName])return Promise.resolve(global[globalName]);
    return new Promise(function(resolve,reject){
      var existing=document.querySelector('script[data-mb-deferred-path="'+path.replace(/"/g,'')+'"]');
      if(existing){
        if(existing.dataset.mbDeferredState==='loaded'){resolve(globalName?global[globalName]:true);return;}
        if(existing.dataset.mbDeferredState==='error')existing.remove();
        else{
          existing.addEventListener('load',function(){resolve(globalName?global[globalName]:true);},{once:true});
          existing.addEventListener('error',function(){reject(new Error('script load failed: '+path));},{once:true});
          return;
        }
      }
      var script=document.createElement('script');
      script.src=assetUrl(path);
      script.async=false;
      script.dataset.mbDeferredPath=path;
      script.dataset.mbDeferredState='loading';
      script.onload=function(){script.dataset.mbDeferredState='loaded';resolve(globalName?global[globalName]:true);};
      script.onerror=function(){
        script.dataset.mbDeferredState='error';
        script.remove();
        reject(new Error('script load failed: '+path));
      };
      document.head.appendChild(script);
    });
  }
  function loadOne(item){
    var path=item[0],globalName=item[1];
    if(globalName&&global[globalName])return Promise.resolve(global[globalName]);
    if(global.MarketBaseRuntime&&typeof global.MarketBaseRuntime.loadScript==='function'){
      return global.MarketBaseRuntime.loadScript(path,globalName||undefined);
    }
    return fallbackLoad(path,globalName);
  }
  function setBusy(group,busy,message){
    var target=group==='history'?document.getElementById('historyLearningMount'):
      group==='why'?document.getElementById('worldWhyLearning'):
      group==='journey'?document.querySelector('[data-mb-journey-sentinel]'):
      group==='photos'?document.getElementById('retailDiscoveryHomeMount'):document.getElementById('detailContent');
    if(!target)return;
    if(busy){
      target.querySelectorAll('[data-mb-deferred-status],.mb-deferred-status.is-error').forEach(function(node){node.remove();});
      if(group==='journey')target.removeAttribute('aria-hidden');
      target.dataset.mbDeferredLoading='true';
      target.setAttribute('aria-busy','true');
      if((group==='history'||group==='journey'||group==='photos')&&!target.querySelector('[data-mb-deferred-status]')){
        var status=document.createElement('p');
        status.dataset.mbDeferredStatus='';
        status.className='mb-deferred-status';
        status.setAttribute('role','status');
        status.textContent=message;
        target.appendChild(status);
      }
      if(group==='why'){
        var list=document.getElementById('worldWhyList');
        if(list&&!list.textContent.trim())list.innerHTML='<p class="mb-deferred-status" data-mb-deferred-status role="status">'+message+'</p>';
      }
    }else{
      delete target.dataset.mbDeferredLoading;
      target.removeAttribute('aria-busy');
      target.querySelectorAll('[data-mb-deferred-status]').forEach(function(node){node.remove();});
      if(group==='journey')target.setAttribute('aria-hidden','true');
    }
  }
  function reportFailure(group,error){
    failures[group]=error;
    states[group]='error';
    console.warn('MARKET BASE deferred '+group+' assets failed to load.',error);
    document.dispatchEvent(new CustomEvent('marketbase:deferred-error',{detail:{group:group,error:error}}));
    var target=group==='history'?document.getElementById('historyLearningMount'):
      group==='why'?document.getElementById('worldWhyList'):
      group==='journey'?document.querySelector('[data-mb-journey-sentinel]'):
      group==='photos'?document.getElementById('retailDiscoveryHomeMount'):null;
    if(target&&!target.children.length){
      if(group==='journey')target.removeAttribute('aria-hidden');
      var note=document.createElement('p');
      note.dataset.mbDeferredStatus='';
      note.className='mb-deferred-status is-error';
      note.textContent='この内容を読み込めませんでした。通信状態を確認して、もう一度お試しください。';
      target.appendChild(note);
    }
    return false;
  }
  function ensure(group){
    if(promises[group])return promises[group];
    delete failures[group];
    states[group]='loading';
    var message=group==='country'?'国別情報を準備しています…':group==='history'?'歴史の記事を準備しています…':
      group==='why'?'世界の「なぜ？」を準備しています…':group==='journey'?'Today’s Journeyを準備しています…':'世界の店舗写真を準備しています…';
    setBusy(group,true,message);
    var list=groups[group]||[];
    var job;
    if(group==='country'||group==='journey'){
      job=Promise.all(list.map(loadOne));
    }else{
      job=list.reduce(function(chain,item){return chain.then(function(){return loadOne(item);});},Promise.resolve());
    }
    promises[group]=job.then(function(){
      states[group]='ready';
      delete failures[group];
      setBusy(group,false,message);
      document.dispatchEvent(new CustomEvent('marketbase:deferred-ready',{detail:{group:group}}));
      return true;
    }).catch(function(error){
      setBusy(group,false,message);
      var result=reportFailure(group,error);
      // Cache only an in-flight or successful load. A transient offline/CDN
      // failure must be retryable from the next explicit user intent.
      delete promises[group];
      return result;
    });
    return promises[group];
  }
  function ensureCountryDetail(){return ensure('country');}
  function ensureHistory(){return ensure('history');}
  function ensureWhy(){return ensure('why');}
  function ensureJourney(){return ensure('journey');}
  function ensurePhotos(){return ensure('photos');}

  var api=Object.freeze({
    ensureCountryDetail:ensureCountryDetail,
    ensureHistory:ensureHistory,
    ensureWhy:ensureWhy,
    ensureJourney:ensureJourney,
    ensurePhotos:ensurePhotos,
    status:function(group){return states[group]||'idle';}
  });
  global.MarketBaseHomeDeferred=api;

  document.addEventListener('marketbase:prepare-country-detail',ensureCountryDetail);
  document.addEventListener('marketbase:before-viewchange',function(event){
    if(event.detail&&event.detail.to==='learn')ensureWhy();
  });
  document.addEventListener('focusin',function(event){
    if(event.target&&event.target.closest&&event.target.closest('#worldWhyLearning'))ensureWhy();
  },true);

  var observed=[];
  var historyMount=document.getElementById('historyLearningMount');
  var whySection=document.getElementById('worldWhyLearning');
  var journey=document.getElementById('todaysJourney');
  var journeySentinel=null;
  if(journey){
    journeySentinel=document.createElement('div');
    journeySentinel.dataset.mbJourneySentinel='';
    journeySentinel.className='mb-deferred-sentinel';
    journeySentinel.setAttribute('aria-hidden','true');
    journey.before(journeySentinel);
  }
  var photosMount=document.getElementById('retailDiscoveryHomeMount');
  function ensureObservedTarget(target){
    if(!optionalWarmupAllowed())return Promise.resolve(false);
    if(target===historyMount)return ensureHistory();
    if(target===whySection)return ensureWhy();
    if(target===journeySentinel)return ensureJourney();
    if(target===photosMount)return ensurePhotos();
    return Promise.resolve(false);
  }
  if('IntersectionObserver'in global){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        if(!optionalWarmupAllowed())return;
        observer.unobserve(entry.target);
        ensureObservedTarget(entry.target);
      });
    },{rootMargin:'900px 0px'});
    if(historyMount){observer.observe(historyMount);observed.push(historyMount);}
    if(whySection){observer.observe(whySection);observed.push(whySection);}
    if(journeySentinel){observer.observe(journeySentinel);observed.push(journeySentinel);}
    if(photosMount){observer.observe(photosMount);observed.push(photosMount);}
  }

  var params=new URLSearchParams(location.search);
  if(params.get('view')==='learn')ensureWhy();
  if(/^#(?:historyLearning|world-history-|HIST-)/i.test(location.hash||''))ensureHistory();
  if(params.has('journey_date')||params.has('journey_offset'))ensureJourney();

  // Never warm the 1.25 MB country-detail group merely because the home page
  // became idle. Visible reading groups may warm only when they cannot compete
  // with offline recovery, a constrained connection, a hidden tab, or radio.
  function targetIsNearViewport(target){
    var rect=target.getBoundingClientRect();
    return rect.top<global.innerHeight*2&&rect.bottom>-global.innerHeight;
  }
  function warmVisibleTargets(){
    if(!optionalWarmupAllowed())return false;
    observed.forEach(function(target){
      if(!targetIsNearViewport(target))return;
      if(target===historyMount&&states.history!=='ready'&&states.history!=='loading')ensureHistory();
      else if(target===whySection&&states.why!=='ready'&&states.why!=='loading')ensureWhy();
      else if(target===journeySentinel&&states.journey!=='ready'&&states.journey!=='loading')ensureJourney();
      else if(target===photosMount&&states.photos!=='ready'&&states.photos!=='loading')ensurePhotos();
    });
    return true;
  }
  function retryVisibleDemandFailures(){
    if(navigator.onLine===false||document.visibilityState==='hidden')return;
    var dialog=document.getElementById('detailDialog');
    if(dialog&&dialog.open&&states.country==='error')ensureCountryDetail();
    if(document.body?.classList.contains('mb-view-active')&&document.querySelector('.view.active')?.id==='learn'&&states.why==='error')ensureWhy();
  }
  function resumeDeferredWork(){
    retryVisibleDemandFailures();
    warmVisibleTargets();
  }
  global.addEventListener('online',resumeDeferredWork,{passive:true});
  global.addEventListener('storage',function(event){
    if(event.key===RADIO_STATE_KEY&&!radioPlaybackActive())resumeDeferredWork();
  });
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState!=='hidden')resumeDeferredWork();
  });
})(window);
