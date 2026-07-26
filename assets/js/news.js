
(function(global){
  'use strict';

  const DATA_URL='data/news.json';
  const ENTITY_URL='data/market_base_entities_basic_stats_full196_rc.json';
  const DEFAULT_CATEGORIES={
    all:'すべて',
    overseas:'海外ニュース',
    food_machinery:'食品機械',
    food_factory:'食品工場',
    retail:'小売店',
    regulations:'規制関連'
  };
  const DEFAULT_REGION_LABELS={
    east_asia:'東アジア',southeast_asia:'東南アジア',south_asia:'南アジア',
    europe:'ヨーロッパ',north_america:'北米',latin_america:'中南米',
    middle_east:'中東',africa:'アフリカ',oceania:'オセアニア',global:'世界'
  };
  let dataPromise=null;
  let entityPromise=null;
  let activeDataset=null;
  let popupLastTrigger=null;
  const mountStates=new WeakMap();

  function loadFallbackScript(path,globalName){
    if(global[globalName]) return Promise.resolve(global[globalName]);
    if(global.MarketBaseRuntime?.loadScript) return global.MarketBaseRuntime.loadScript(path,globalName);
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=path+(path.includes('?')?'&':'?')+'v=20260725-r11348';
      script.async=false;
      script.onload=()=>resolve(global[globalName]);
      script.onerror=()=>reject(new Error(`script load failed: ${path}`));
      document.head.append(script);
    });
  }
  function esc(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function safeUrl(value){
    try{
      const u=new URL(String(value||''),global.location?.href||'https://example.invalid/');
      return /^(https?):$/.test(u.protocol) ? u.href : '';
    }catch(_){ return ''; }
  }
  function cleanText(value,limit){
    const s=String(value??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    return typeof limit==='number' && s.length>limit ? `${s.slice(0,limit)}…` : s;
  }
  function validDate(value){
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return null;
    if(d.getTime()>Date.now()+86400000) return null;
    return d;
  }
  function categoryLabels(data){
    return Object.assign({},DEFAULT_CATEGORIES,data?.categories||{});
  }
  function regionLabels(data){
    return Object.assign({},DEFAULT_REGION_LABELS,data?.regions||{});
  }
  function categoryLabel(code,data){ return categoryLabels(data)[code]||code||'未分類'; }
  function regionLabel(code,data){ return regionLabels(data)[code]||code||'地域'; }
  function formatDate(value){
    const d=validDate(value);
    if(!d) return '日時不明';
    return new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'numeric',day:'numeric'}).format(d);
  }
  function normalizeArticle(raw){
    if(!raw || typeof raw!=='object') return null;
    const id=cleanText(raw.id,180);
    const title=cleanText(raw.title_ja,240);
    const summary=cleanText(raw.summary_ja,500);
    const sourceName=cleanText(raw.source_name,160);
    const sourceUrl=safeUrl(raw.source_url);
    const date=validDate(raw.published_at);
    const category=cleanText(raw.category,80);
    const scope=['country','region','global'].includes(raw.scope)?raw.scope:'country';
    const codes=Array.isArray(raw.country_codes)?[...new Set(raw.country_codes.map(x=>cleanText(x,12).toUpperCase()).filter(Boolean))]:[];
    if(!id||!title||!sourceName||!sourceUrl||!date||!DEFAULT_CATEGORIES[category]) return null;
    return {
      id,title_ja:title,summary_ja:summary,country_codes:codes,
      region_code:cleanText(raw.region_code,60),category,
      published_at:date.toISOString(),source_name:sourceName,source_url:sourceUrl,
      source_language:cleanText(raw.source_language,30),scope,
      importance:Number.isFinite(Number(raw.importance))?Number(raw.importance):0,
      classification_confidence:Number.isFinite(Number(raw.classification_confidence))?Number(raw.classification_confidence):0,
      source_id:cleanText(raw.source_id,100),retrieved_via:cleanText(raw.retrieved_via,30),
      auto_generated:raw.auto_generated===true,is_test_data:raw.is_test_data===true,
      published_at_estimated:raw.published_at_estimated===true
    };
  }
  function normalizeDataset(raw){
    const seen=new Set();
    const articles=[];
    (Array.isArray(raw?.articles)?raw.articles:[]).slice(0,1000).forEach(item=>{
      const article=normalizeArticle(item);
      if(!article) return;
      const key=article.id||`${article.source_url}|${article.title_ja}`;
      if(seen.has(key)) return;
      seen.add(key);articles.push(article);
    });
    return {
      schema_version:cleanText(raw?.schema_version,30)||'1.0',
      dataset_status:cleanText(raw?.dataset_status,80),
      generated_at:cleanText(raw?.generated_at,80),
      phase:Number.isFinite(Number(raw?.phase))?Number(raw.phase):0,
      phase_label:cleanText(raw?.phase_label,80),
      auto_update_status:cleanText(raw?.auto_update_status,100),
      live_country_codes:Array.isArray(raw?.live_country_codes)?raw.live_country_codes.map(x=>cleanText(x,12).toUpperCase()).filter(Boolean):[],
      notice_ja:cleanText(raw?.notice_ja,420),
      categories:Object.assign({},raw?.categories||{}),
      regions:Object.assign({},raw?.regions||{}),
      pilot_countries:raw?.pilot_countries||{},
      articles
    };
  }
  function loadData(){
    if(!dataPromise){
      const fromEmbedded=()=>loadFallbackScript('data/news.js','MARKET_BASE_NEWS_DATA').then(raw=>{
        if(!raw) throw new Error('embedded news data is unavailable');
        return raw;
      });
      const source=global.location?.protocol==='file:'
        ? fromEmbedded()
        : fetch(DATA_URL,{cache:'no-store'}).then(res=>{
            if(!res.ok) throw new Error(`news.json ${res.status}`);
            return res.json();
          }).catch(err=>{
            console.warn('Current news JSON could not be loaded; synchronized JS fallback will be used.',err);
            return fromEmbedded();
          });
      dataPromise=source.then(normalizeDataset).then(data=>{ activeDataset=data; return data; }).catch(err=>{ dataPromise=null; throw err; });
    }
    return dataPromise;
  }
  function loadEntities(){
    if(!entityPromise){
      const fromEmbedded=()=>loadFallbackScript('embedded-data.js','MARKET_BASE_EMBEDDED_DATA').then(raw=>Array.isArray(raw?.entities?.entities)?raw.entities.entities:[]);
      const source=global.location?.protocol==='file:'
        ? fromEmbedded()
        : fetch(ENTITY_URL,{cache:'no-store'}).then(res=>{
            if(!res.ok) throw new Error(`country master ${res.status}`);
            return res.json();
          }).then(raw=>Array.isArray(raw?.entities)?raw.entities:[]).catch(err=>{
            console.warn('Current country JSON could not be loaded; synchronized JS fallback will be used.',err);
            return fromEmbedded();
          });
      entityPromise=source.catch(err=>{entityPromise=null;throw err;});
    }
    return entityPromise;
  }
  function regionCodeForEntity(entity){
    const region=String(entity?.region||'');
    const sub=String(entity?.subregion||'');
    if(sub==='Eastern Asia') return 'east_asia';
    if(sub==='South-eastern Asia') return 'southeast_asia';
    if(sub==='Southern Asia') return 'south_asia';
    if(region==='Europe') return 'europe';
    if(sub==='Northern America') return 'north_america';
    if(region==='Americas') return 'latin_america';
    if(sub==='Western Asia') return 'middle_east';
    if(region==='Africa') return 'africa';
    if(region==='Oceania') return 'oceania';
    return '';
  }
  function sortArticles(list){
    return [...list].sort((a,b)=>b.importance-a.importance || new Date(b.published_at)-new Date(a.published_at) || a.id.localeCompare(b.id));
  }
  function articleMatchesCategory(article,category){ return !category||category==='all'||article.category===category; }
  function uniquePush(target,items,limit,scopeLabel){
    const ids=new Set(target.map(x=>x.article.id));
    for(const article of items){
      if(target.length>=limit) break;
      if(ids.has(article.id)) continue;
      ids.add(article.id);target.push({article,scopeLabel});
    }
  }
  function countryFeed(data,{countryCode,regionCode,category='all',limit=3,includeFallback=true}){
    const code=String(countryCode||'').toUpperCase();
    const all=sortArticles(data.articles.filter(a=>articleMatchesCategory(a,category)));
    const direct=all.filter(a=>a.country_codes.includes(code));
    const regional=all.filter(a=>a.scope==='region'&&a.region_code===regionCode);
    const worldwide=all.filter(a=>a.scope==='global');
    const result=[];
    uniquePush(result,direct,limit,'');
    if(includeFallback){
      uniquePush(result,regional,limit,`${regionLabel(regionCode,data)}の関連ニュース`);
      uniquePush(result,worldwide,limit,'世界の関連ニュース');
    }
    return result;
  }
  function articleCardHtml(article,data,scopeLabel='',options={}){
    const url=safeUrl(article.source_url);
    const countries=(article.country_codes||[]).map(code=>{
      const label=options.countryNames?.[code]||data?.pilot_countries?.[code]?.name_ja||code;
      const href=`index.html?open_country=${encodeURIComponent(code)}&from=news`;
      return `<a class="mb-news-country-chip" href="${href}">${esc(label)}</a>`;
    }).join('');
    const category=categoryLabel(article.category,data);
    const testBadge=article.is_test_data?'<span class="mb-news-test-badge">試験データ</span>':'';
    const liveBadge=article.auto_generated?'<span class="mb-news-live-badge">公式取得</span>':'';
    const lang=String(article.source_language||'').trim();
    const languageBadge=lang&&!/^ja(?:-|$)/i.test(lang)?`<span class="mb-news-language-badge">原文 ${esc(lang.toUpperCase())}</span>`:'';
    const scope=scopeLabel?`<span class="mb-news-scope-badge">${esc(scopeLabel)}</span>`:'';
    const dateNote=article.published_at_estimated?'（取得日）':'';
    return `<article class="mb-news-card" data-news-id="${esc(article.id)}">
      <div class="mb-news-card-badges">${testBadge}${liveBadge}<span class="mb-news-category-badge" data-category="${esc(article.category)}">${esc(category)}</span>${languageBadge}${scope}</div>
      <h4>${esc(article.title_ja)}</h4>
      <div class="mb-news-card-meta"><time datetime="${esc(article.published_at)}">${esc(formatDate(article.published_at))}${esc(dateNote)}</time><span>${esc(article.source_name)}</span></div>
      ${countries?`<div class="mb-news-country-chips">${countries}</div>`:''}
      ${article.summary_ja?`<p>${esc(article.summary_ja)}</p>`:''}
      <a class="mb-news-source-link" href="${esc(url)}" data-news-popup-id="${esc(article.id)}" aria-haspopup="dialog">記事をポップアップで見る <span aria-hidden="true">↗</span></a>
    </article>`;
  }

  function ensureNewsPopup(){
    let dialog=document.getElementById('mbNewsArticleDialog');
    if(dialog) return dialog;
    dialog=document.createElement('dialog');
    dialog.id='mbNewsArticleDialog';
    dialog.className='mb-news-popup-dialog';
    dialog.setAttribute('aria-labelledby','mbNewsPopupTitle');
    dialog.innerHTML=`
      <button class="mb-news-popup-close" type="button" data-news-popup-close aria-label="ニュースを閉じる">×</button>
      <div class="mb-news-popup-shell">
        <header class="mb-news-popup-header">
          <span>NEWS PREVIEW</span>
          <h2 id="mbNewsPopupTitle"></h2>
          <div class="mb-news-popup-meta" id="mbNewsPopupMeta"></div>
        </header>
        <div class="mb-news-popup-summary" id="mbNewsPopupSummary"></div>
        <div class="mb-news-popup-frame-wrap">
          <div class="mb-news-popup-frame-note">記事ページをポップアップ内に表示します。表示されない場合は下の「元の記事を開く」を使用してください。</div>
          <iframe class="mb-news-popup-frame" id="mbNewsPopupFrame" title="ニュース記事" loading="eager" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
        </div>
        <footer class="mb-news-popup-actions">
          <a id="mbNewsPopupExternal" href="#" target="_blank" rel="noopener noreferrer">元の記事を開く ↗</a>
          <button type="button" data-news-popup-close>閉じる</button>
        </footer>
      </div>`;
    document.body.appendChild(dialog);
    const close=()=>closeNewsPopup(dialog);
    dialog.querySelectorAll('[data-news-popup-close]').forEach(button=>button.addEventListener('click',close));
    dialog.addEventListener('click',event=>{ if(event.target===dialog) close(); });
    dialog.addEventListener('close',()=>{
      const frame=dialog.querySelector('#mbNewsPopupFrame');
      if(frame) frame.src='about:blank';
      document.body.classList.remove('mb-news-popup-open');
      if(popupLastTrigger && popupLastTrigger.isConnected) popupLastTrigger.focus({preventScroll:true});
      popupLastTrigger=null;
    });
    return dialog;
  }
  function closeNewsPopup(dialog=ensureNewsPopup()){
    const frame=dialog.querySelector('#mbNewsPopupFrame');
    if(frame) frame.src='about:blank';
    if(typeof dialog.close==='function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('mb-news-popup-open');
  }
  function openNewsPopup(article,trigger){
    if(!article) return;
    const url=safeUrl(article.source_url);
    if(!url) return;
    const dialog=ensureNewsPopup();
    popupLastTrigger=trigger||document.activeElement;
    const title=dialog.querySelector('#mbNewsPopupTitle');
    const meta=dialog.querySelector('#mbNewsPopupMeta');
    const summary=dialog.querySelector('#mbNewsPopupSummary');
    const frame=dialog.querySelector('#mbNewsPopupFrame');
    const external=dialog.querySelector('#mbNewsPopupExternal');
    if(title) title.textContent=article.title_ja||'ニュース記事';
    if(meta) meta.innerHTML=`<span>${esc(categoryLabel(article.category,activeDataset))}</span><time datetime="${esc(article.published_at)}">${esc(formatDate(article.published_at))}</time><strong>${esc(article.source_name)}</strong>`;
    if(summary) summary.innerHTML=article.summary_ja?`<p>${esc(article.summary_ja)}</p>`:'<p>概要は登録されていません。記事本文をご確認ください。</p>';
    if(external) external.href=url;
    if(frame){ frame.title=`${article.title_ja||'ニュース記事'}｜${article.source_name||''}`; frame.src=url; }
    document.body.classList.add('mb-news-popup-open');
    if(typeof dialog.showModal==='function'){ if(!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open','');
    requestAnimationFrame(()=>dialog.querySelector('[data-news-popup-close]')?.focus({preventScroll:true}));
  }
  function installNewsPopupDelegation(){
    if(document.documentElement.dataset.newsPopupReady==='1') return;
    document.documentElement.dataset.newsPopupReady='1';
    document.addEventListener('click',event=>{
      const link=event.target.closest?.('[data-news-popup-id]');
      if(!link) return;
      const article=activeDataset?.articles?.find(item=>item.id===link.dataset.newsPopupId);
      if(!article) return;
      event.preventDefault();
      openNewsPopup(article,link);
    });
  }
  function categoryButtonsHtml(active,data,compact=false){
    const labels=categoryLabels(data);
    return Object.keys(DEFAULT_CATEGORIES).map(code=>`<button type="button" class="mb-news-category-button${active===code?' active':''}" data-news-category="${esc(code)}" aria-pressed="${active===code?'true':'false'}">${esc(labels[code]||DEFAULT_CATEGORIES[code])}</button>`).join('');
  }
  function countryBlockHtml(state,data){
    const feed=countryFeed(data,state);
    const list=feed.length?feed.map(item=>articleCardHtml(item.article,data,item.scopeLabel)).join(''):`<div class="mb-news-empty"><strong>該当するニュースはありません</strong><p>現在、この国・地域に直接関係する新しいニュースはありません。</p></div>`;
    const allLink=`news.html?country=${encodeURIComponent(state.countryCode)}`;
    const phaseLabel=data.phase_label||'ニュース';
    return `<div class="mb-country-news-heading"><div><span>COUNTRY NEWS</span><h3>${esc(state.countryName)}の最新ニュース</h3></div><em>${esc(phaseLabel)}</em></div>
      <p class="mb-news-test-notice">${esc(data.notice_ja||'表示確認用の試験データです。')}</p>
      <div class="mb-news-category-row" role="group" aria-label="ニュースカテゴリー">${categoryButtonsHtml(state.category,data,true)}</div>
      <div class="mb-country-news-list" aria-live="polite">${list}</div>
      <a class="mb-country-news-all-link" href="${allLink}">${esc(state.countryName)}のニュースをすべて見る <span aria-hidden="true">›</span></a>`;
  }
  async function mountCountryNews(options){
    const container=typeof options?.container==='string'?document.querySelector(options.container):options?.container;
    if(!container) return;
    const state={
      countryCode:String(options.countryCode||'').toUpperCase(),
      countryName:String(options.countryName||options.countryCode||'国・地域'),
      regionCode:String(options.regionCode||''),category:'all',limit:Number(options.limit)||3,includeFallback:false
    };
    mountStates.set(container,state);
    container.hidden=true;
    container.innerHTML='<div class="mb-news-loading" role="status">ニュースを読み込んでいます…</div>';
    try{
      const data=await loadData();
      if(!container.isConnected||mountStates.get(container)!==state) return;
      const directAll=countryFeed(data,{...state,category:'all',limit:Math.max(state.limit,100),includeFallback:false});
      if(!directAll.length){ container.remove(); return; }
      const render=()=>{
        container.hidden=false;
        container.innerHTML=countryBlockHtml(state,data);
        container.querySelectorAll('[data-news-category]').forEach(button=>button.addEventListener('click',()=>{
          state.category=button.dataset.newsCategory||'all';render();
        }));
      };
      render();
    }catch(err){
      if(container.isConnected) container.remove();
      console.warn('MARKET BASE news load failed',err);
    }
  }
  function countryNamesFromEntities(entities){
    const out={};
    entities.forEach(e=>{ const code=String(e.entity_id||e.iso2||'').toUpperCase(); if(code) out[code]=e.names?.ja||e.names?.short_ja||e.names?.en||code; });
    return out;
  }
  function periodCutoff(period){
    if(period==='7d') return Date.now()-7*86400000;
    if(period==='30d') return Date.now()-30*86400000;
    if(period==='90d') return Date.now()-90*86400000;
    return 0;
  }
  function sourceDiverse(list){
    const pending=[...list],out=[];
    while(pending.length){
      const last=out.at(-1)?.source_name;
      let idx=pending.findIndex(x=>x.source_name!==last);
      if(idx<0) idx=0;
      out.push(pending.splice(idx,1)[0]);
    }
    return out;
  }
  function pageFilteredArticles(data,state,entities){
    let list=data.articles.filter(a=>articleMatchesCategory(a,state.category));
    const cutoff=periodCutoff(state.period);
    if(cutoff) list=list.filter(a=>new Date(a.published_at).getTime()>=cutoff);
    const q=String(state.keyword||'').trim().toLowerCase();
    if(q) list=list.filter(a=>[a.title_ja,a.summary_ja,a.source_name,categoryLabel(a.category,data)].join(' ').toLowerCase().includes(q));
    if(state.country){
      const direct=list.filter(a=>a.country_codes.includes(state.country));
      if(direct.length) list=direct;
      else{
        const entity=entities.find(e=>String(e.entity_id||e.iso2||'').toUpperCase()===state.country);
        const regionCode=regionCodeForEntity(entity);
        const regional=list.filter(a=>a.scope==='region'&&a.region_code===regionCode);
        list=regional.length?regional:list.filter(a=>a.scope==='global');
      }
    }else if(state.region){
      list=list.filter(a=>a.region_code===state.region || (state.region==='global'&&a.scope==='global'));
    }
    return sourceDiverse(sortArticles(list));
  }
  function readPageState(root){
    const p=new URLSearchParams(location.search);
    return {
      country:(p.get('country')||'').toUpperCase(),region:p.get('region')||'',category:p.get('category')||'all',
      period:p.get('period')||'all',keyword:p.get('q')||''
    };
  }
  function writePageState(state){
    const url=new URL(location.href);
    [['country',state.country],['region',state.region],['category',state.category==='all'?'':state.category],['period',state.period==='all'?'':state.period],['q',state.keyword]].forEach(([key,value])=>{
      if(value) url.searchParams.set(key,value); else url.searchParams.delete(key);
    });
    history.replaceState(null,'',url);
  }
  function renderNewsPage(root,data,entities,state){
    const countryNames=countryNamesFromEntities(entities);
    const list=pageFilteredArticles(data,state,entities);
    const status=root.querySelector('[data-news-results-status]');
    const container=root.querySelector('[data-news-results]');
    const scopeLabel=state.country?(countryNames[state.country]||state.country):state.region?regionLabel(state.region,data):'注目ニュース';
    if(status) status.innerHTML=`<strong>${esc(scopeLabel)}</strong><span>${list.length.toLocaleString()}件</span>`;
    if(container){
      container.innerHTML=list.length?list.map(a=>articleCardHtml(a,data,'',{countryNames})).join(''):`<div class="mb-news-empty"><strong>該当するニュースはありません</strong><p>条件を変えてもう一度お試しください。</p></div>`;
    }
    root.querySelectorAll('[data-news-category]').forEach(btn=>{
      const active=btn.dataset.newsCategory===state.category;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
    });
    writePageState(state);
  }
  async function initNewsPage(root=document.querySelector('[data-news-page]')){
    if(!root) return;
    const results=root.querySelector('[data-news-results]');
    if(results) results.innerHTML='<div class="mb-news-loading" role="status">ニュースを読み込んでいます…</div>';
    try{
      const [data,entities]=await Promise.all([loadData(),loadEntities()]);
      const state=readPageState(root);
      const countrySelect=root.querySelector('[data-news-country-filter]');
      const regionSelect=root.querySelector('[data-news-region-filter]');
      const periodSelect=root.querySelector('[data-news-period-filter]');
      const keywordInput=root.querySelector('[data-news-keyword-filter]');
      if(!DEFAULT_CATEGORIES[state.category]) state.category='all';
      const names=countryNamesFromEntities(entities);
      if(countrySelect){
        const options=[...entities].sort((a,b)=>(names[a.entity_id]||'').localeCompare(names[b.entity_id]||'','ja')).map(e=>`<option value="${esc(e.entity_id)}">${esc(names[e.entity_id]||e.entity_id)}</option>`).join('');
        countrySelect.innerHTML=`<option value="">すべての国・地域</option>${options}`;countrySelect.value=state.country;
      }
      if(regionSelect){
        const labels=regionLabels(data);
        const codes=['east_asia','southeast_asia','south_asia','europe','north_america','latin_america','middle_east','africa','oceania','global'];
        regionSelect.innerHTML='<option value="">すべての地域</option>'+codes.map(code=>`<option value="${code}">${esc(labels[code]||code)}</option>`).join('');regionSelect.value=state.region;
      }
      if(periodSelect) periodSelect.value=state.period;
      if(keywordInput) keywordInput.value=state.keyword;
      const render=()=>renderNewsPage(root,data,entities,state);
      countrySelect?.addEventListener('change',()=>{state.country=countrySelect.value; if(state.country){state.region='';if(regionSelect)regionSelect.value='';}render();});
      regionSelect?.addEventListener('change',()=>{state.region=regionSelect.value;if(state.region){state.country='';if(countrySelect)countrySelect.value='';}render();});
      periodSelect?.addEventListener('change',()=>{state.period=periodSelect.value;render();});
      keywordInput?.addEventListener('input',()=>{state.keyword=keywordInput.value;render();});
      root.querySelectorAll('[data-news-category]').forEach(btn=>btn.addEventListener('click',()=>{state.category=btn.dataset.newsCategory||'all';render();}));
      root.querySelector('[data-news-reset]')?.addEventListener('click',()=>{
        state.country='';state.region='';state.category='all';state.period='all';state.keyword='';
        if(countrySelect)countrySelect.value='';if(regionSelect)regionSelect.value='';if(periodSelect)periodSelect.value='all';if(keywordInput)keywordInput.value='';render();
      });
      const notice=root.querySelector('[data-news-dataset-notice]');if(notice) notice.textContent=data.notice_ja||'';
      render();
    }catch(err){
      if(results) results.innerHTML='<div class="mb-news-empty mb-news-load-error"><strong>ニュースデータを読み込めませんでした</strong><p>既存のMARKET BASEページへ戻ってください。</p></div>';
      console.warn('MARKET BASE news page load failed',err);
    }
  }

  global.MarketBaseNews={loadData,loadEntities,mountCountryNews,initNewsPage,regionCodeForEntity,countryFeed,categoryLabel,regionLabel,openNewsPopup};
  installNewsPopupDelegation();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>initNewsPage()); else initNewsPage();
})(window);
