(function(){
  'use strict';

  const ROOT_SELECTOR='[data-mbn-news]';
  const DEFAULT_SWITCH_MS=60000;
  const ARTICLES_PER_CATEGORY=7;
  const PAUSE_KEY='market_base_news_tabs_paused_v1';
  const ORDER=['overseas','food_machinery','food_factory','retail','regulations'];
  const LABELS={
    overseas:'海外ニュース',
    food_machinery:'食品機械',
    food_factory:'食品工場',
    retail:'小売店',
    regulations:'規制関連'
  };
  let instanceCounter=0;

  function safeText(value){return String(value==null?'':value)}
  function escapeHtml(value){
    return safeText(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function validUrl(url){
    try{
      const parsed=new URL(url,location.href);
      return /^https?:$/.test(parsed.protocol)?parsed.href:'';
    }catch(_){return ''}
  }
  function fmtDate(value){
    if(!value)return '日付確認中';
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return safeText(value);
    return new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'numeric',day:'numeric'}).format(d);
  }
  function fmtUpdated(value){
    if(!value)return '';
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return '';
    return '最終更新 '+new Intl.DateTimeFormat('ja-JP',{
      year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'
    }).format(d);
  }
  function pickRandom(exclude,pool){
    const source=(Array.isArray(pool)&&pool.length?pool:ORDER).filter(function(id){return id!==exclude});
    const fallback=(Array.isArray(pool)&&pool.length?pool:ORDER);
    return source[Math.floor(Math.random()*source.length)]||fallback[0]||ORDER[0];
  }
  function getData(){
    const raw=window.MARKET_BASE_JA_NEWS||{};
    return {
      status:raw.status||'sample',
      generated_at:raw.generated_at||'',
      categories:raw.categories||{}
    };
  }

  function init(root){
    if(root.dataset.mbnReady==='1')return;
    root.dataset.mbnReady='1';

    const instanceId=++instanceCounter;
    const tabsEl=root.querySelector('[data-mbn-tabs]');
    const panel=root.querySelector('[data-mbn-panel]');
    const pauseBtn=root.querySelector('[data-mbn-pause]');
    const pauseLabel=root.querySelector('[data-mbn-pause-label]');
    const pauseIcon=root.querySelector('[data-mbn-pause-icon]');
    const progress=root.querySelector('[data-mbn-progress]');
    const countdown=root.querySelector('[data-mbn-countdown]');
    const statusEl=root.querySelector('[data-mbn-status]');
    const updatedEl=root.querySelector('[data-mbn-updated]');
    if(!tabsEl||!panel)return;

    const data=getData();
    const available=ORDER.filter(function(id){
      const articles=data.categories[id]&&data.categories[id].articles;
      return Array.isArray(articles)&&articles.length>0;
    });
    const switchPool=available.length?available:ORDER;
    const requestedMs=Number(root.dataset.mbnSwitchMs);
    const switchMs=Number.isFinite(requestedMs)&&requestedMs>=250?requestedMs:DEFAULT_SWITCH_MS;
    const panelId='mbn-panel-'+instanceId;
    panel.id=panelId;

    let active=pickRandom('',switchPool);
    let manualPaused=false;
    try{manualPaused=localStorage.getItem(PAUSE_KEY)==='1'}catch(_){}
    let hiddenPaused=document.hidden;
    let hoverPaused=false;
    let interactionPaused=false;
    let remaining=switchMs;
    let lastTick=performance.now();
    let intervalId=0;

    tabsEl.innerHTML=ORDER.map(function(id){
      const tabId='mbn-tab-'+instanceId+'-'+id;
      return '<button type="button" id="'+tabId+'" class="mbn-tab" role="tab" aria-controls="'+panelId+'" aria-selected="false" tabindex="-1" data-mbn-tab="'+id+'">'+escapeHtml(LABELS[id])+'</button>';
    }).join('');

    function isPaused(){return manualPaused||hiddenPaused||hoverPaused||interactionPaused}

    function updatePauseUi(){
      if(!pauseBtn)return;
      pauseBtn.setAttribute('aria-pressed',manualPaused?'true':'false');
      pauseBtn.setAttribute('aria-label',manualPaused?'自動切替を再開':'自動切替を停止');
      if(pauseLabel)pauseLabel.textContent=manualPaused?'自動切替を再開':'自動切替を停止';
      if(pauseIcon)pauseIcon.textContent=manualPaused?'▶':'Ⅱ';
    }

    function render(){
      let selectedButton=null;
      tabsEl.querySelectorAll('[data-mbn-tab]').forEach(function(btn){
        const selected=btn.dataset.mbnTab===active;
        btn.setAttribute('aria-selected',selected?'true':'false');
        btn.tabIndex=selected?0:-1;
        if(selected)selectedButton=btn;
      });
      if(selectedButton)panel.setAttribute('aria-labelledby',selectedButton.id);

      const category=data.categories[active]||{};
      const articles=Array.isArray(category.articles)?category.articles.slice(0,ARTICLES_PER_CATEGORY):[];
      panel.setAttribute('aria-label',LABELS[active]+'の記事');
      if(!articles.length){
        panel.innerHTML='<div class="mbn-empty"><div><strong>'+escapeHtml(LABELS[active])+'は取得準備中です</strong><span>前回データがある場合は、更新処理で自動的に復元されます。</span></div></div>';
        return;
      }
      panel.innerHTML='<div class="mbn-list">'+articles.map(function(article){
        const url=validUrl(article.url);
        if(!url)return '';
        return '<a class="mbn-card" href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer" data-mbn-article>'+
          '<div class="mbn-card__top"><span class="mbn-card__source">'+escapeHtml(article.source||'情報源確認中')+'</span><span class="mbn-card__external" aria-hidden="true">↗</span></div>'+
          '<h3>'+escapeHtml(article.title||'見出し確認中')+'</h3>'+
          '<div class="mbn-card__meta"><span>'+escapeHtml(fmtDate(article.published_at))+'</span><span class="mbn-card__category">'+escapeHtml(LABELS[active])+'</span></div>'+
        '</a>';
      }).join('')+'</div>';
    }

    function select(id,reset){
      if(!ORDER.includes(id))return;
      active=id;
      if(reset)remaining=switchMs;
      render();
      updateClock(true);
    }

    function switchRandom(){select(pickRandom(active,switchPool),true)}

    function updateClock(force){
      const seconds=Math.max(0,Math.ceil(remaining/1000));
      const text=isPaused()
        ?(manualPaused?'自動切替は停止中':'操作中は一時停止')
        :'次の切替まで '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
      if(countdown&&(force||countdown.textContent!==text))countdown.textContent=text;
      if(progress){
        const width=Math.max(0,Math.min(100,(1-remaining/switchMs)*100));
        progress.style.width=width.toFixed(2)+'%';
      }
    }

    function tick(){
      const now=performance.now();
      const elapsed=Math.max(0,Math.min(2000,now-lastTick));
      lastTick=now;
      if(!isPaused()){
        remaining-=elapsed;
        if(remaining<=0)switchRandom();
      }
      updateClock(false);
    }

    function startTimer(){
      if(intervalId)return;
      lastTick=performance.now();
      intervalId=window.setInterval(tick,250);
    }

    function stopTimer(){
      if(!intervalId)return;
      window.clearInterval(intervalId);
      intervalId=0;
    }

    tabsEl.addEventListener('click',function(event){
      const btn=event.target.closest('[data-mbn-tab]');
      if(!btn)return;
      select(btn.dataset.mbnTab,true);
    });

    tabsEl.addEventListener('keydown',function(event){
      const current=event.target.closest('[data-mbn-tab]');
      if(!current)return;
      const idx=ORDER.indexOf(current.dataset.mbnTab);
      let next=-1;
      if(event.key==='ArrowRight')next=(idx+1)%ORDER.length;
      if(event.key==='ArrowLeft')next=(idx-1+ORDER.length)%ORDER.length;
      if(event.key==='Home')next=0;
      if(event.key==='End')next=ORDER.length-1;
      if(next>=0){
        event.preventDefault();
        select(ORDER[next],true);
        const nextButton=tabsEl.querySelector('[data-mbn-tab="'+ORDER[next]+'"]');
        if(nextButton)nextButton.focus();
      }
    });

    if(pauseBtn)pauseBtn.addEventListener('click',function(){
      manualPaused=!manualPaused;
      try{localStorage.setItem(PAUSE_KEY,manualPaused?'1':'0')}catch(_){}
      updatePauseUi();
      lastTick=performance.now();
      updateClock(true);
    });

    panel.addEventListener('pointerenter',function(event){
      if(event.pointerType==='mouse'){
        hoverPaused=true;
        updateClock(true);
      }
    });
    panel.addEventListener('pointerleave',function(event){
      if(event.pointerType==='mouse'){
        hoverPaused=false;
        lastTick=performance.now();
        updateClock(true);
      }
    });
    panel.addEventListener('focusin',function(){
      hoverPaused=true;
      updateClock(true);
    });
    panel.addEventListener('focusout',function(event){
      if(!panel.contains(event.relatedTarget)){
        hoverPaused=false;
        lastTick=performance.now();
        updateClock(true);
      }
    });

    root.addEventListener('pointerdown',function(event){
      if(event.pointerType!=='mouse'){
        interactionPaused=true;
        remaining=switchMs;
        lastTick=performance.now();
        updateClock(true);
      }
    },{passive:true});
    root.addEventListener('pointerup',function(event){
      if(event.pointerType!=='mouse'){
        interactionPaused=false;
        lastTick=performance.now();
        updateClock(true);
      }
    },{passive:true});
    root.addEventListener('pointercancel',function(){
      interactionPaused=false;
      lastTick=performance.now();
      updateClock(true);
    },{passive:true});
    root.addEventListener('wheel',function(){
      remaining=switchMs;
      lastTick=performance.now();
      updateClock(true);
    },{passive:true});

    document.addEventListener('visibilitychange',function(){
      hiddenPaused=document.hidden;
      lastTick=performance.now();
      updateClock(true);
    });
    window.addEventListener('pagehide',stopTimer);
    window.addEventListener('pageshow',function(){
      hiddenPaused=document.hidden;
      startTimer();
      updateClock(true);
    });

    if(statusEl){
      const map={
        live:'日本語ニュースを自動取得',
        partial:'一部取得・前回データを保持',
        sample:'表示確認用データ（自動更新前）',
        error:'前回データを表示'
      };
      statusEl.textContent=map[data.status]||'ニュースデータ';
    }
    if(updatedEl){
      updatedEl.textContent=data.status==='sample'?'':fmtUpdated(data.generated_at);
      updatedEl.hidden=data.status==='sample'||!updatedEl.textContent;
    }

    updatePauseUi();
    render();
    updateClock(true);
    startTimer();
  }

  function boot(){document.querySelectorAll(ROOT_SELECTOR).forEach(init)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
