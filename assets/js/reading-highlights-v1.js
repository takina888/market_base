(() => {
  'use strict';

  const SKIP_TAGS = new Set(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT','SELECT','OPTION','BUTTON','SVG','CODE','PRE','A']);
  const SKIP_SELECTORS = [
    'header','nav','footer','form','summary','h1','h2','h3','h4','h5','h6',
    '.mbu-brand','.mbu-meta','.toolbar','.tabs','.filter','.filters','.search-area',
    '.label','.k','.meta','.eyebrow','.badge','.badge-row','.tag','.chip','.pill',
    '.card-title','.card-sub','.section-title','.hero-badge','.stat','.count','.pagination'
  ].join(',');
  const SCAN_ROOTS = ['main','.country-profile-dialog','.country-detail-panel','.modal','.dialog','.drawer'];

  const redTerms = [
    '持ち込み禁止','使用不可','法令上必須','設備導入前に確認','現地確認が必要',
    '必ず確認','禁止','警告','危険','違反','罰則','適用対象外','対象外',
    '未登録','未公表','公開情報では確認できません','確認できません','未確認','要確認','確認が必要','メーカーへ確認','仕様確認が必要','地域差があります','工場ごとに異なります'
  ];
  const yellowTerms = [
    '最重要','特に確認','海外展開','海外事業','導入実績','販売実績','輸出実績',
    '設備投資','生産能力','主な強み','代表商品','看板商品','海外代理店','海外拠点',
    '省人化','省力化','自動化','品質安定','品質向上','衛生・洗浄性','洗浄性','丸洗い可能','自動洗浄','サニタリー','ライン接続',
    '多品種対応','段取り替え','歩留まり向上','歩留まり改善','省スペース','省エネ','作業標準化','海外販売','海外市場','海外導入','処理能力','高精度'
  ];
  const boldTerms = [
    '該当なし','PSE','CE','CCC','KC','BSMI','UL','NRTL','HACCP','GMP',
    'FSSC 22000','ISO 22000','ISO 9001','ISO 14001','ISO 45001','ISO 50001',
    'JIS','IEC','公式PDF','カタログPDF','公式カタログ','製品詳細は未登録','能力数値あり','三相200V','三相400V'
  ];

  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const terms = [
    ...redTerms.map(text => ({ text, cls: 'mb-reading-red', priority: 3 })),
    ...yellowTerms.map(text => ({ text, cls: 'mb-reading-yellow', priority: 2 })),
    ...boldTerms.map(text => ({ text, cls: 'mb-reading-bold', priority: 1 }))
  ].sort((a,b) => b.text.length - a.text.length || b.priority - a.priority);
  const termMap = new Map(terms.map(item => [item.text, item.cls]));
  const termPattern = terms.map(item => escapeRegExp(item.text)).join('|');
  const electricalPattern = '(?:(?:単相|三相)\\s*)?\\d{2,4}(?:/\\d{2,4})?\\s*V(?:\\s*[・/,]\\s*(?:50|60)(?:/60)?\\s*Hz)?';
  const capacityPattern = '(?:\\d{1,3}(?:,\\d{3})+|\\d+(?:\\.\\d+)?)(?:\\s*(?:%|％|人|社|件|か所|箇所|店舗|台|基|ライン|トン|t/時|kg/時|kg/h|kg|g|kW|L|個/時|個/分|袋/分|食/日|万円|億円|兆円|米ドル|バーツ|ユーロ|ポンド))';
  const combined = new RegExp(`(${termPattern}|${electricalPattern}|${capacityPattern})`, 'g');
  const MAX_MARKS_PER_TEXT_NODE = 5;

  function classFor(text) {
    if (termMap.has(text)) return termMap.get(text);
    return 'mb-reading-bold';
  }
  function eligible(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue || !node.nodeValue.trim()) return false;
    const parent = node.parentElement;
    if (!parent || SKIP_TAGS.has(parent.tagName)) return false;
    if (parent.closest('.mb-reading-bold,.mb-reading-red,.mb-reading-yellow')) return false;
    if (parent.closest(SKIP_SELECTORS)) return false;
    return true;
  }
  function processTextNode(node) {
    if (!eligible(node)) return;
    const text = node.nodeValue;
    combined.lastIndex = 0;
    let match, cursor = 0, count = 0;
    const fragment = document.createDocumentFragment();
    while ((match = combined.exec(text)) !== null && count < MAX_MARKS_PER_TEXT_NODE) {
      if (match.index > cursor) fragment.append(document.createTextNode(text.slice(cursor, match.index)));
      const span = document.createElement('span');
      span.className = classFor(match[0]);
      span.textContent = match[0];
      fragment.append(span);
      cursor = match.index + match[0].length;
      count += 1;
    }
    if (!count) return;
    if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
  function processSubtree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { processTextNode(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(processTextNode);
  }
  function scanInitial() {
    const roots = [];
    SCAN_ROOTS.forEach(selector => document.querySelectorAll(selector).forEach(node => roots.push(node)));
    if (!roots.length && document.body) roots.push(document.body);
    [...new Set(roots)].forEach(processSubtree);
  }
  function start() {
    scanInitial();
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) processSubtree(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

/* R62: apply country context from country profile deep links on specialist DB pages. */
(() => {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const country = params.get('mb_country');
  const code = params.get('mb_country_code') || '';
  if (!country) return;

  const aliasMap = {
    US: ['アメリカ合衆国','アメリカ','米国','USA','United States'],
    GB: ['イギリス','英国','UK','United Kingdom'],
    CN: ['中国','中華人民共和国'],
    HK: ['香港','中華人民共和国香港特別行政区'],
    MO: ['マカオ','中華人民共和国マカオ特別行政区'],
    KR: ['韓国','大韓民国'],
    TW: ['台湾','台灣','臺灣'],
    RU: ['ロシア','ロシア連邦'],
    AE: ['アラブ首長国連邦','UAE'],
    CZ: ['チェコ','チェコ共和国'],
    MM: ['ミャンマー','ミャンマー (ビルマ)','ビルマ'],
    TL: ['東ティモール','ティモール・レステ'],
    CI: ['コートジボワール','象牙海岸'],
    CD: ['コンゴ民主共和国','コンゴ民主共和国(キンシャサ)'],
    CG: ['コンゴ共和国','コンゴ共和国(ブラザビル)']
  };
  const norm = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[\s・･／/()（）._-]+/g, '');
  const aliases = [country, ...(aliasMap[code] || [])].filter(Boolean);
  const allCountryValues = [...document.querySelectorAll('[data-country]')].map(node => node.dataset.country).filter(Boolean);
  const dataAlias = aliases.find(alias => allCountryValues.some(value => {
    const a = norm(alias), v = norm(value);
    return v === a || v.includes(a) || a.includes(v);
  }));
  const chosen = dataAlias || country;

  function neutralizeOtherFilters() {
    document.querySelectorAll('select').forEach(select => {
      const key = `${select.id || ''} ${select.name || ''}`;
      if (/year|sort|scope|language|lang/i.test(key)) return;
      if (/country/i.test(key)) return;
      const neutral = [...select.options].find(option => option.value === '' || option.value === 'all' || /すべて|全地域|全件/.test(option.textContent || ''));
      if (neutral && select.value !== neutral.value) {
        select.value = neutral.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
  function setCountrySelect() {
    const selects = [...document.querySelectorAll('select')].filter(select => {
      const key = `${select.id || ''} ${select.name || ''}`;
      return /country/i.test(key) || /国|地域/.test(select.getAttribute('aria-label') || '');
    });
    for (const select of selects) {
      const option = [...select.options].find(item => aliases.some(alias => {
        const a = norm(alias), t = norm(item.textContent), v = norm(item.value);
        return t === a || v === a || t.includes(a) || a.includes(t);
      }));
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }
  function setSearch() {
    const input = document.getElementById('q') || document.querySelector('input[type="search"],input[placeholder*="検索"],input[placeholder*="会社名"]');
    if (!input) return false;
    if (input.value !== chosen) {
      input.value = chosen;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }
  function apply() {
    neutralizeOtherFilters();
    window.setTimeout(() => {
      setCountrySelect();
      setSearch();
    }, 40);
  }
  function addBanner() {
    if (document.querySelector('.mb-country-context-banner')) return;
    const style = document.createElement('style');
    style.textContent = '.mb-country-context-banner{margin:12px auto 18px;max-width:960px;padding:13px 16px;border:2px solid #b9daf7;border-radius:16px;background:#eef7ff;color:#153e67;display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:800}.mb-country-context-banner div{display:flex;gap:10px;flex-wrap:wrap}.mb-country-context-banner a{color:#086bc7;text-decoration:none;background:#fff;border:1px solid #bdd9f2;border-radius:999px;padding:6px 10px;font-size:.82rem}@media(max-width:640px){.mb-country-context-banner{display:block;margin:10px 14px 16px}.mb-country-context-banner div{margin-top:10px}}';
    document.head.append(style);
    const banner = document.createElement('aside');
    banner.className = 'mb-country-context-banner';
    const returnUrl = `index.html?open_country=${encodeURIComponent(code)}`;
    const clear = new URL(window.location.href);
    ['mb_country','mb_country_code','mb_from'].forEach(key => clear.searchParams.delete(key));
    const clearHref = `${clear.pathname.split('/').pop()}${clear.search}`;
    banner.innerHTML = `<span>${country}のデータを表示中</span><div><a href="${returnUrl}">国情報へ戻る</a><a href="${clearHref}">条件を解除</a></div>`;
    const host = document.querySelector('main') || document.querySelector('.wrap') || document.body;
    host.insertAdjacentElement('afterbegin', banner);
  }
  function start() {
    addBanner();
    apply();
    [200, 700, 1500].forEach(ms => window.setTimeout(apply, ms));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();


/* R83: shared basic-link, target-scroll and return-position behavior. */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  let hashTarget='';
  try{hashTarget=decodeURIComponent(location.hash.replace(/^#/,''));}catch(_){hashTarget=location.hash.replace(/^#/,'');}
  const explicitTarget=(params.get('mb_target')||params.get('target')||hashTarget||'').trim();
  const country=(params.get('mb_country')||'').trim();
  const scrollKey=`mb-scroll:${location.pathname}`;
  const attrEscape=value=>String(value).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  const visible=node=>!!node && !node.hidden && getComputedStyle(node).display!=='none' && node.getClientRects().length>0;
  let targetResolved=false;
  const candidates=()=>{
    const list=[];
    if(explicitTarget){
      list.push(document.getElementById(explicitTarget));
      ['data-entity-id','data-company-id','data-store-id','data-place-id','data-target-id'].forEach(attr=>{
        try{list.push(document.querySelector(`[${attr}="${attrEscape(explicitTarget)}"]`));}catch(_){ }
      });
    }
    if(country){
      const norm=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/[\s・･／/()（）._-]+/g,'');
      const wanted=norm(country);
      document.querySelectorAll('[data-country]').forEach(node=>{
        const got=norm(node.dataset.country);
        if(got===wanted||got.includes(wanted)||wanted.includes(got)) list.push(node);
      });
    }
    return [...new Set(list.filter(Boolean))];
  };
  const reveal=node=>{
    if(!node) return;
    let current=node;
    while(current && current!==document.documentElement){
      if(current.tagName==='DETAILS') current.open=true;
      current.hidden=false;
      current.classList?.remove('hidden','is-hidden','filtered-out');
      if(current.classList?.contains('manufacturer-card')) current.classList.add('open');
      if(current.style?.display==='none') current.style.display='';
      current=current.parentElement;
    }
  };
  const flashAndScroll=node=>{
    if(!node) return false;
    reveal(node);
    if(!visible(node)) return false;
    node.classList.add('mb-link-target-flash');
    const hadTabindex=node.hasAttribute('tabindex');
    if(!hadTabindex) node.setAttribute('tabindex','-1');
    node.scrollIntoView({block:'start',behavior:'auto'});
    try{node.focus({preventScroll:true});}catch(_){ }
    window.setTimeout(()=>{
      node.classList.remove('mb-link-target-flash');
      if(!hadTabindex) node.removeAttribute('tabindex');
    },2800);
    targetResolved=true;
    document.dispatchEvent(new CustomEvent('mb:target-resolved',{detail:{target:explicitTarget||country}}));
    return true;
  };
  const applyTarget=()=>{
    const target=candidates().find(node=>{reveal(node);return visible(node);});
    return flashAndScroll(target);
  };
  const safeFallback=()=>{
    if(targetResolved||(!explicitTarget&&!country)) return;
    const host=document.querySelector('main')||document.querySelector('.wrap')||document.body;
    if(host && host!==document.body) host.scrollIntoView({block:'start',behavior:'auto'});
    else window.scrollTo({top:0,behavior:'auto'});
  };
  const restore=()=>{
    if(explicitTarget||country) return;
    const nav=performance.getEntriesByType?.('navigation')?.[0];
    if(nav?.type!=='back_forward') return;
    const y=Number(sessionStorage.getItem(scrollKey));
    if(Number.isFinite(y)&&y>0) window.scrollTo({top:y,behavior:'auto'});
  };
  addEventListener('pagehide',()=>{try{sessionStorage.setItem(scrollKey,String(scrollY||0));}catch(_){}});
  if(explicitTarget||country){
    try{history.scrollRestoration='manual';}catch(_){ }
    [30,100,220,460,820,1300,2000,3000].forEach(ms=>setTimeout(applyTarget,ms));
    setTimeout(safeFallback,3300);
  }else{
    setTimeout(restore,80);
  }
})();
