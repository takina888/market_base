(function(){
  'use strict';

  const MAIN_FILES=new Set(['','index.html','market-base-v273-country-profile-r28.html']);
  const file=(location.pathname.split('/').pop()||'').toLowerCase();
  const isMain=MAIN_FILES.has(file);
  document.body.classList.add(isMain?'mb-unified-main-page':'mb-unified-specialist-page');
  if(file==='market-base-currency-converter-v273-r29.html')document.body.classList.add('mb-unified-wide-page');
  const legacyHeader=document.querySelector('.mbu-header');
  if(legacyHeader)legacyHeader.style.setProperty('margin-top','0px','important');

  function cleanMalformedRefresh(url){
    const v=url.searchParams.get('v');
    if(v && v.includes('?refresh=')){
      const parts=v.split('?refresh=');
      url.searchParams.set('v',parts[0]);
      if(parts[1])url.searchParams.set('refresh',parts[1].split('&')[0]);
    }
    return url;
  }

  function currentView(){
    if(file==='market-base-currency-converter-v273-r29.html')return 'currency';
    if(!isMain)return '';
    const url=cleanMalformedRefresh(new URL(location.href));
    const fromUrl=url.searchParams.get('view')||'';
    if(fromUrl)return fromUrl;
    const active=document.querySelector('#home>.view.active');
    return active?.id||'';
  }

  const items=[
    ['countries','国・地域','index.html?view=countries'],
    ['rice','米データ','index.html?view=rice'],
    ['currency','為替換算','market-base-currency-converter-v273-r29.html'],
    ['global-search','検索','index.html?view=global-search'],
    ['rankings','ランキング','index.html?view=rankings'],
    ['compare','比較','index.html?view=compare']
  ];

  function createDesktopTabs(){
    if(document.querySelector('.mb-unified-desktop-tabs'))return;
    const nav=document.createElement('nav');
    nav.className='mb-unified-desktop-tabs';
    nav.setAttribute('aria-label','MARKET BASE PC用メインナビゲーション');
    const active=currentView();
    items.forEach(([key,label,href])=>{
      const a=document.createElement('a');
      a.href=href;
      a.dataset.mbUnifiedView=key;
      a.textContent=label;
      if(key===active){a.classList.add('is-active');a.setAttribute('aria-current','page');}
      if(key==='global-search'){
        a.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg><span>検索</span>';
      }
      nav.appendChild(a);
    });
    const anchor=isMain?document.querySelector('main#home'):document.querySelector('.mbu-header,header,main');
    if(anchor?.parentNode)anchor.parentNode.insertBefore(nav,anchor);
    else document.body.insertBefore(nav,document.body.firstChild);
  }

  function syncActive(){
    const active=currentView();
    document.querySelectorAll('.mb-unified-desktop-tabs a').forEach(a=>{
      const on=a.dataset.mbUnifiedView===active;
      a.classList.toggle('is-active',on);
      if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
  }

  function goHome(event){
    if(!isMain)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const url=cleanMalformedRefresh(new URL(location.href));
    url.searchParams.delete('view');
    url.searchParams.delete('from');
    url.searchParams.set('refresh',Date.now().toString());
    location.assign(url.toString());
  }

  document.addEventListener('click',function(event){
    const target=event.target.closest('button,a');
    if(!target)return;

    // R113.1: update controls are intentionally not intercepted here.
    // Main page clears app caches, currency updates rates, and specialist pages reload themselves.

    if(isMain && (target.matches('[data-view-back-home]') || target.matches('.bottom-tab[data-home], [data-home="true"]'))){
      goHome(event);return;
    }



    if(target.matches('[data-view]'))setTimeout(syncActive,0);

  },true);

  function normalizeUrl(){
    const before=location.href;
    const url=cleanMalformedRefresh(new URL(before));
    if(url.toString()!==before)history.replaceState(history.state,'',url.toString());
  }

  normalizeUrl();
  createDesktopTabs();
  window.addEventListener('popstate',syncActive);
  const home=document.getElementById('home');
  if(home)new MutationObserver(syncActive).observe(home,{subtree:true,attributes:true,attributeFilter:['class']});
})();
