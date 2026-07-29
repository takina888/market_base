/* MARKET BASE V.301 | Map Search Intro */
(function(){
  'use strict';
  const ROOT_SELECTOR = '#mbMapSearchV301';
  const SESSION_KEY = 'market_base_map_intro_seen_v301';

  function q(root, sel){ return root.querySelector(sel); }
  function qa(root, sel){ return Array.from(root.querySelectorAll(sel)); }

  function init(root){
    if(!root || root.dataset.mapReady === '1') return;
    root.dataset.mapReady = '1';

    const stage = q(root,'[data-map-stage]');
    const intro = q(root,'[data-map-intro]');
    const card = q(root,'[data-map-card]');
    const openBtn = q(root,'[data-open-map]');
    const loading = q(root,'[data-map-loading]');
    const dialog = q(root,'[data-map-dialog]');
    const modal = q(root,'[data-map-modal]');
    const viewport = q(root,'[data-map-viewport]');
    const searchForm = q(root,'[data-country-search-form]');
    const searchInput = q(root,'[data-country-search]');
    const toast = q(root,'[data-map-toast]');
    const mapSrc = root.dataset.mapSrc || 'assets/svg/world-countries-v301.svg';
    const delay = Math.max(0, Number(root.dataset.introDelay || 2000));
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let mapText = '';
    let mapPromise = null;
    let switched = false;
    let introTimer = 0;
    let toastTimer = 0;
    let lastFocused = null;
    let modalSvg = null;
    let suppressCountryClick = false;

    const view = {x:0,y:0,w:1000,h:500};
    const pointers = new Map();
    let dragStart = null;
    let pinchStart = null;

    function showToast(message){
      if(!toast) return;
      toast.textContent = message;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(()=>{toast.hidden=true;},2300);
    }

    function loadMap(){
      if(mapPromise) return mapPromise;
      if(loading) loading.hidden = false;
      mapPromise = fetch(mapSrc,{cache:'force-cache'})
        .then(res=>{ if(!res.ok) throw new Error('map fetch failed'); return res.text(); })
        .then(text=>{
          mapText = text;
          if(card && !card.firstElementChild) card.innerHTML = text;
          if(loading) loading.hidden = true;
          return text;
        })
        .catch(err=>{
          console.warn('[V.301] world map could not load',err);
          if(loading){loading.textContent='地図を読み込めませんでした';loading.hidden=false;}
          throw err;
        });
      return mapPromise;
    }

    function revealMap(){
      if(switched) return;
      switched = true;
      loadMap().then(()=>{
        if(openBtn) openBtn.hidden = false;
        requestAnimationFrame(()=>stage && stage.classList.add('is-map-visible'));
        try{ sessionStorage.setItem(SESSION_KEY,'1'); }catch(_){ }
      }).catch(()=>{});
    }

    function startIntroCountdown(){
      if(switched || introTimer) return;
      loadMap().catch(()=>{});
      let seen = false;
      try{ seen = sessionStorage.getItem(SESSION_KEY)==='1'; }catch(_){ }
      const wait = reducedMotion ? 0 : (seen ? 250 : delay);
      introTimer = window.setTimeout(()=>{introTimer=0;revealMap();},wait);
    }

    function cancelIntroCountdown(){
      if(switched) return;
      if(introTimer){ clearTimeout(introTimer); introTimer=0; }
    }

    function setPaused(paused){ if(stage) stage.classList.toggle('is-paused',paused); }

    if('IntersectionObserver' in window){
      const observer = new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(entry.target!==root) continue;
          if(entry.intersectionRatio>=0.65){ startIntroCountdown(); setPaused(false); }
          else { cancelIntroCountdown(); if(switched) setPaused(true); }
        }
      },{threshold:[0,0.2,0.65,1]});
      observer.observe(root);
    }else{
      startIntroCountdown();
    }

    function openDialog(){
      lastFocused = document.activeElement;
      loadMap().then(text=>{
        if(!modal.firstElementChild) modal.innerHTML = text;
        modalSvg = q(modal,'svg');
        resetView();
        bindModalMap();
        dialog.hidden = false;
        document.documentElement.classList.add('mb-map-dialog-open');
        document.body.classList.add('mb-map-dialog-open');
        window.setTimeout(()=>{ const close=q(dialog,'[data-close-map].mb-map-dialog__close'); if(close) close.focus(); },30);
      }).catch(()=>showToast('地図を読み込めませんでした'));
    }

    function closeDialog(){
      if(!dialog || dialog.hidden) return;
      dialog.hidden = true;
      document.documentElement.classList.remove('mb-map-dialog-open');
      document.body.classList.remove('mb-map-dialog-open');
      pointers.clear(); dragStart=null; pinchStart=null;
      if(lastFocused && typeof lastFocused.focus==='function') lastFocused.focus();
    }

    if(openBtn) openBtn.addEventListener('click',openDialog);
    qa(root,'[data-close-map]').forEach(btn=>btn.addEventListener('click',e=>{
      if(btn.matches('[data-jump]')) return;
      e.preventDefault(); closeDialog();
    }));
    if(dialog) dialog.addEventListener('keydown',e=>{ if(e.key==='Escape'){e.preventDefault();closeDialog();} });

    function applyView(){
      if(modalSvg) modalSvg.setAttribute('viewBox',`${view.x.toFixed(2)} ${view.y.toFixed(2)} ${view.w.toFixed(2)} ${view.h.toFixed(2)}`);
    }
    function clampView(){
      view.w = Math.max(166.67,Math.min(1000,view.w));
      view.h = view.w/2;
      view.x = Math.max(0,Math.min(1000-view.w,view.x));
      view.y = Math.max(0,Math.min(500-view.h,view.y));
    }
    function resetView(){ view.x=0;view.y=0;view.w=1000;view.h=500;applyView(); }
    function pointToMap(clientX,clientY){
      const r=viewport.getBoundingClientRect();
      return {x:view.x+(clientX-r.left)/r.width*view.w,y:view.y+(clientY-r.top)/r.height*view.h};
    }
    function zoomAt(factor,clientX,clientY){
      if(!modalSvg) return;
      const anchor = pointToMap(clientX,clientY);
      const oldW=view.w, oldH=view.h;
      view.w/=factor; view.h=view.w/2; clampView();
      const rx=(anchor.x-view.x)/oldW, ry=(anchor.y-view.y)/oldH;
      view.x=anchor.x-rx*view.w; view.y=anchor.y-ry*view.h;
      clampView(); applyView();
    }
    function viewportCenter(){ const r=viewport.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}; }

    qa(root,'[data-map-zoom]').forEach(btn=>btn.addEventListener('click',()=>{
      const action=btn.dataset.mapZoom;
      if(action==='reset'){resetView();return;}
      const c=viewportCenter();zoomAt(action==='in'?1.45:1/1.45,c.x,c.y);
    }));

    function pointerDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
    function pointerMid(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};}

    function onPointerDown(e){
      if(e.button!==undefined && e.button!==0) return;
      viewport.setPointerCapture && viewport.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      suppressCountryClick=false;
      if(pointers.size===1){
        dragStart={clientX:e.clientX,clientY:e.clientY,x:view.x,y:view.y,moved:false};
      }else if(pointers.size===2){
        const [a,b]=Array.from(pointers.values());
        pinchStart={distance:pointerDistance(a,b),mid:pointerMid(a,b),w:view.w,h:view.h,x:view.x,y:view.y};
        dragStart=null;
      }
    }
    function onPointerMove(e){
      if(!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===1 && dragStart){
        const dx=e.clientX-dragStart.clientX,dy=e.clientY-dragStart.clientY;
        if(Math.hypot(dx,dy)>5){dragStart.moved=true;suppressCountryClick=true;viewport.classList.add('is-dragging');}
        const r=viewport.getBoundingClientRect();
        view.x=dragStart.x-dx/r.width*view.w;view.y=dragStart.y-dy/r.height*view.h;clampView();applyView();
      }else if(pointers.size===2 && pinchStart){
        const [a,b]=Array.from(pointers.values());
        const dist=pointerDistance(a,b); const mid=pointerMid(a,b);
        const ratio=Math.max(.5,Math.min(2,dist/pinchStart.distance));
        const old={x:view.x,y:view.y,w:view.w,h:view.h};
        view.w=pinchStart.w/ratio;view.h=view.w/2;
        const r=viewport.getBoundingClientRect();
        const anchorX=pinchStart.x+(pinchStart.mid.x-r.left)/r.width*pinchStart.w;
        const anchorY=pinchStart.y+(pinchStart.mid.y-r.top)/r.height*pinchStart.h;
        view.x=anchorX-(mid.x-r.left)/r.width*view.w;
        view.y=anchorY-(mid.y-r.top)/r.height*view.h;
        clampView();applyView();suppressCountryClick=true;
      }
    }
    function onPointerUp(e){
      pointers.delete(e.pointerId);
      viewport.classList.remove('is-dragging');
      if(pointers.size===1){
        const p=Array.from(pointers.values())[0];
        dragStart={clientX:p.x,clientY:p.y,x:view.x,y:view.y,moved:false};
        pinchStart=null;
      }else if(pointers.size===0){
        dragStart=null;pinchStart=null;
        window.setTimeout(()=>{suppressCountryClick=false;},80);
      }
    }

    function navigateToCountry(path){
      if(!path) return;
      const iso=path.dataset.mapEntity||'';
      const name=path.dataset.countryJa||iso;
      closeDialog();
      if(typeof window.openEntityByAnyCode==='function'){
        window.openEntityByAnyCode(iso);
        return;
      }
      // Bridge to an existing delegated MARKET BASE click handler when the function is not global.
      const bridge=document.createElement('button');
      bridge.type='button';bridge.hidden=true;bridge.dataset.openEntity=iso;
      document.body.appendChild(bridge);
      const bridgeEvent=new MouseEvent('click',{bubbles:true,cancelable:true,view:window});
      const notHandled=bridge.dispatchEvent(bridgeEvent);
      bridge.remove();
      if(!notHandled) return;
      const template=window.MARKET_BASE_COUNTRY_URL_TEMPLATE;
      if(typeof template==='string' && template.includes('{iso3}')){
        location.href=template.replace('{iso3}',encodeURIComponent(iso));
        return;
      }
      showToast(`${name}を選択しました（${iso}）`);
    }

    function bindModalMap(){
      if(!modalSvg || modalSvg.dataset.bound==='1') return;
      modalSvg.dataset.bound='1';
      modalSvg.addEventListener('click',e=>{
        const path=e.target.closest && e.target.closest('[data-map-entity]');
        if(!path || suppressCountryClick || e.defaultPrevented) return;
        navigateToCountry(path);
      });
      modalSvg.addEventListener('keydown',e=>{
        const path=e.target.closest && e.target.closest('[data-map-entity]');
        if(path && (e.key==='Enter'||e.key===' ')){e.preventDefault();navigateToCountry(path);}
      });
    }

    if(viewport){
      viewport.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.deltaY<0?1.18:1/1.18,e.clientX,e.clientY);},{passive:false});
      viewport.addEventListener('pointerdown',onPointerDown);
      viewport.addEventListener('pointermove',onPointerMove);
      viewport.addEventListener('pointerup',onPointerUp);
      viewport.addEventListener('pointercancel',onPointerUp);
    }

    if(searchForm){
      searchForm.addEventListener('submit',e=>{
        e.preventDefault();
        if(!modalSvg) return;
        const term=(searchInput.value||'').trim().toLowerCase();
        if(!term){showToast('国・地域名を入力してください');return;}
        const paths=qa(modalSvg,'[data-map-entity]');
        let hit=paths.find(p=>(p.dataset.countryJa||'').toLowerCase()===term || (p.dataset.countryEn||'').toLowerCase()===term || (p.dataset.mapEntity||'').toLowerCase()===term);
        if(!hit) hit=paths.find(p=>(p.dataset.countryJa||'').toLowerCase().includes(term) || (p.dataset.countryEn||'').toLowerCase().includes(term));
        if(hit) navigateToCountry(hit); else showToast('該当する国・地域が見つかりません');
      });
    }

    const listBtn=q(root,'[data-country-list]');
    if(listBtn) listBtn.addEventListener('click',()=>{
      closeDialog();
      if(typeof window.switchView==='function'){ window.switchView('countries'); return; }
      const bridge=document.createElement('button');
      bridge.type='button';bridge.hidden=true;bridge.dataset.jump='countries';
      document.body.appendChild(bridge);
      const notHandled=bridge.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
      bridge.remove();
      if(notHandled) location.href='?view=countries';
    });
  }

  function boot(){ document.querySelectorAll(ROOT_SELECTOR).forEach(init); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
