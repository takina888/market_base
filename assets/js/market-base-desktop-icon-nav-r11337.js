(function(){
  'use strict';
  var script=document.currentScript;
  var root=(script&&script.dataset.mbRoot)||'';
  var explicit=(script&&script.dataset.mbActive||'').toLowerCase();
  var path=(location.pathname||'').toLowerCase();
  var file=(path.split('/').pop()||'index.html').toLowerCase();
  var valid=['home','countries','rice','tools','search','rankings','compare','learn'];

  function href(target){return root+target;}
  function icon(name){
    var icons={
      home:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z"></path><path d="M9 21v-7h6v7"></path></svg>',
      countries:'<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.3 2.45 3.5 5.45 3.5 9S14.3 18.55 12 21M12 3C9.7 5.45 8.5 8.45 8.5 12s1.2 6.55 3.5 9"></path></svg>',
      rice:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 13h16c-.4 4.7-3 7-8 7s-7.6-2.3-8-7Z"></path><path d="M7.5 11.2c.6-4 2.2-6.5 5-8M11 11.2c.7-3.7 2.5-6.2 5.2-7.5M14.5 11.2c.6-2.9 2-4.8 4.2-5.8"></path></svg>',
      tools:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14.2 5.1a4.4 4.4 0 0 0 4.7 5.8l-7.7 7.7a2.1 2.1 0 1 1-3-3l7.7-7.7a4.4 4.4 0 0 0-5.8-4.7l2.6 2.6-2.9 2.9-2.6-2.6"></path><path d="m14.8 14.8 4.1 4.1"></path></svg>',
      search:'<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg>',
      rankings:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 21v-7h4v7M10 21V9h4v12M16 21V4h4v17M2.5 21.5h19"></path></svg>',
      compare:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 4v16M17 4v16M4 7l3-3 3 3M14 17l3 3 3-3"></path></svg>',
      learn:'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3.5 4.5h6.2c1.2 0 2.2.4 3.3 1.3 1.1-.9 2.1-1.3 3.3-1.3h4.2v15h-4.2c-1.2 0-2.2.4-3.3 1.3-1.1-.9-2.1-1.3-3.3-1.3H3.5Z"></path><path d="M13 5.8v15"></path></svg>'
    };
    return icons[name]||'';
  }

  var items=[
    ['home','ホーム','index.html'],
    ['countries','国・地域','index.html?view=countries'],
    ['rice','米データ','index.html?view=rice'],
    ['tools','ツール','market-base-currency-converter-v273-r29.html'],
    ['search','検索','index.html?view=global-search'],
    ['rankings','ランキング','index.html?view=rankings'],
    ['compare','比較','index.html?view=compare'],
    ['learn','学ぶ','index.html?view=learn']
  ];

  function normalize(value){
    value=(value||'').toLowerCase();
    return valid.indexOf(value)>=0?value:'';
  }
  function liveIndexActive(){
    var viewEl=document.querySelector('#home > .view.active, main#home > .view.active, .view.active');
    if(viewEl){
      var id=(viewEl.id||'').toLowerCase();
      if(id==='global-search')return 'search';
      if(id==='rankings'){
        var comparePanel=document.querySelector('[data-ranking-compare-panel="compare"]');
        var compareTab=document.querySelector('[data-ranking-compare-tab="compare"]');
        var compareOn=!!(
          comparePanel && (!comparePanel.hidden || comparePanel.classList.contains('active')) ||
          compareTab && (compareTab.classList.contains('active') || compareTab.getAttribute('aria-selected')==='true')
        );
        return compareOn?'compare':'rankings';
      }
      if(['countries','rice','learn'].indexOf(id)>=0)return id;
    }
    return document.body&&document.body.classList.contains('mb-view-active')?'':'home';
  }
  function detectActive(){
    var query=new URLSearchParams(location.search);
    var view=(query.get('view')||'').toLowerCase();
    var isMainIndex=file==='index.html' && !/\/(ul-ce-learning|hs-learning|international-logistics)\//.test(path);
    if(isMainIndex){
      var live=liveIndexActive();
      if(live)return live;
      if(view==='global-search')return 'search';
      if(['countries','rice','rankings','compare','learn'].indexOf(view)>=0)return view;
      return 'home';
    }
    var chosen=normalize(explicit);
    if(chosen)return chosen;
    if(file==='market-base-currency-converter-v273-r29.html')return 'tools';
    if(file==='market-base-v273-country-profile-r28.html'||file==='world-compass.html')return 'countries';
    if(file==='world-history-today.html'||/\/(ul-ce-learning|hs-learning)\//.test(path))return 'learn';
    if(/\/international-logistics\//.test(path))return file==='guide.html'?'learn':'tools';
    if(file==='news.html')return 'home';
    if(/(retail-sales|cvs-vendor|flight-kitchen|gohan-food-manufacturers|imported-food-machinery|food-machinery-import|japan-food-machinery|rail-food-kitchen|rice-additive-products|school-meal-center)/.test(file))return 'search';
    return 'home';
  }

  function removeLegacy(){
    document.querySelectorAll('.mb-unified-desktop-tabs,.wc-desktop-tabs,nav[aria-label="MARKET BASE PC用メインナビゲーション"]:not(.mb-global-icon-band)').forEach(function(el){el.remove();});
  }
  function create(){
    if(document.querySelector('.mb-global-icon-band')){sync();return;}
    removeLegacy();
    var nav=document.createElement('nav');
    nav.className='mb-global-icon-band';
    nav.setAttribute('aria-label','MARKET BASE PC共通ナビゲーション');
    items.forEach(function(item){
      var a=document.createElement('a');
      a.dataset.mbGlobalNav=item[0];
      a.href=href(item[2]);
      a.innerHTML=icon(item[0])+'<span>'+item[1]+'</span>';
      nav.appendChild(a);
    });
    document.body.insertBefore(nav,document.body.firstChild);
    sync();
  }
  function sync(){
    var active=detectActive();
    document.querySelectorAll('.mb-global-icon-band a').forEach(function(a){
      var on=a.dataset.mbGlobalNav===active;
      a.classList.toggle('is-active',on);
      if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
  }
  create();
  document.addEventListener('click',function(e){
    if(e.target.closest('[data-view],[data-jump],[data-home],[data-ranking-compare-tab]'))setTimeout(sync,0);
  },true);
  window.addEventListener('popstate',sync);
  window.addEventListener('hashchange',sync);
  var home=document.getElementById('home');
  if(home)new MutationObserver(function(){setTimeout(sync,0);}).observe(home,{subtree:true,attributes:true,attributeFilter:['class','hidden','aria-selected']});
})();
