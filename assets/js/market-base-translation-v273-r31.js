(function(){
  'use strict';
  var SOURCE_LANG='ja';
  var LANG_PARAM='mb_lang';
  var CANONICAL_ORIGIN='https://takina888.github.io';
  var BASE_PATH='/market_base/';
  var STORAGE_KEY='market_base_language_v1';
  var TRANSLATE_ENDPOINT='https://translate.google.com/translate';
  var LANGUAGES=[
    {code:'ja',short:'JA',label:'日本語'},
    {code:'en',short:'EN',label:'English'},
    {code:'zh-TW',short:'繁中',label:'繁體中文'},
    {code:'zh-CN',short:'简中',label:'简体中文'},
    {code:'ko',short:'KO',label:'한국어'},
    {code:'th',short:'TH',label:'ไทย'},
    {code:'vi',short:'VI',label:'Tiếng Việt'}
  ];
  var translationHost=/\.translate\.goog$/i.test(location.hostname);

  function validLanguage(value){
    var normalized=String(value||'').trim();
    for(var i=0;i<LANGUAGES.length;i++) if(LANGUAGES[i].code.toLowerCase()===normalized.toLowerCase()) return LANGUAGES[i].code;
    return '';
  }
  function readStoredLanguage(){
    try{return validLanguage(localStorage.getItem(STORAGE_KEY));}catch(_){return '';}
  }
  function storeLanguage(lang){
    try{if(lang===SOURCE_LANG)localStorage.removeItem(STORAGE_KEY);else localStorage.setItem(STORAGE_KEY,lang);}catch(_){}
  }
  function currentLanguage(){
    var query=new URLSearchParams(location.search);
    return validLanguage(query.get('_x_tr_tl'))||validLanguage(query.get(LANG_PARAM))||readStoredLanguage()||SOURCE_LANG;
  }
  function stripTranslationParams(url){
    ['_x_tr_sl','_x_tr_tl','_x_tr_hl','_x_tr_pto','_x_tr_hist'].forEach(function(key){url.searchParams.delete(key);});
    return url;
  }
  function deployedPathFromLocal(url){
    var name=(url.pathname.split('/').pop()||'').trim();
    if(!name||name==='index.html') return BASE_PATH;
    return BASE_PATH+name;
  }
  function canonicalUrl(input){
    var resolved;
    try{resolved=new URL(input||location.href,location.href);}catch(_){resolved=new URL(CANONICAL_ORIGIN+BASE_PATH);}
    var out;
    if(resolved.hostname==='takina888.github.io'){
      out=new URL(resolved.toString());
    }else if(/\.translate\.goog$/i.test(resolved.hostname)){
      out=new URL(resolved.pathname+resolved.search+resolved.hash,CANONICAL_ORIGIN);
    }else{
      out=new URL(deployedPathFromLocal(resolved)+resolved.search+resolved.hash,CANONICAL_ORIGIN);
    }
    stripTranslationParams(out);
    return out;
  }
  function withLanguage(input,lang){
    var url=canonicalUrl(input);
    if(lang===SOURCE_LANG)url.searchParams.delete(LANG_PARAM);else url.searchParams.set(LANG_PARAM,lang);
    return url;
  }
  function buildTranslateUrl(input,lang){
    var original=withLanguage(input,lang);
    var endpoint=new URL(TRANSLATE_ENDPOINT);
    endpoint.searchParams.set('sl',SOURCE_LANG);
    endpoint.searchParams.set('tl',lang);
    endpoint.searchParams.set('u',original.toString());
    return endpoint.toString();
  }
  function isInternalUrl(input){
    try{
      var url=new URL(input,location.href);
      if(url.protocol!=='http:'&&url.protocol!=='https:')return false;
      return url.hostname==='takina888.github.io'||/\.translate\.goog$/i.test(url.hostname)||url.origin===location.origin;
    }catch(_){return false;}
  }
  function japaneseUrl(){
    var url=withLanguage(location.href,SOURCE_LANG);
    url.searchParams.set(LANG_PARAM,SOURCE_LANG);
    return url.toString();
  }
  function navigateLanguage(lang){
    lang=validLanguage(lang)||SOURCE_LANG;
    storeLanguage(lang);
    if(lang===SOURCE_LANG){location.href=japaneseUrl();return;}
    location.href=buildTranslateUrl(location.href,lang);
  }
  function makeButton(){
    var button=document.createElement('button');
    button.type='button';
    button.className='mb-translation-button';
    button.setAttribute('data-mb-translation-button','');
    button.setAttribute('aria-label','表示言語を選択');
    button.setAttribute('aria-haspopup','menu');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('translate','no');
    button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.25"></circle><path d="M2.75 12h18.5M12 2.75c2.35 2.53 3.55 5.61 3.55 9.25S14.35 18.72 12 21.25M12 2.75C9.65 5.28 8.45 8.36 8.45 12s1.2 6.72 3.55 9.25"></path></svg><span>翻訳</span><small class="mbt-code" aria-hidden="true">JA</small>';
    return button;
  }
  function languageInfo(lang){for(var i=0;i<LANGUAGES.length;i++)if(LANGUAGES[i].code===lang)return LANGUAGES[i];return LANGUAGES[0];}
  function updateButtons(){
    var lang=currentLanguage(),info=languageInfo(lang);
    document.documentElement.setAttribute('data-mb-language',lang);
    document.querySelectorAll('[data-mb-translation-button]').forEach(function(button){
      var code=button.querySelector('.mbt-code');if(code)code.textContent=info.short;
      button.setAttribute('aria-label','表示言語を選択。現在は'+info.label);
      button.title='現在の表示言語：'+info.label;
    });
  }
  function closeMenu(){
    document.querySelectorAll('.mb-translation-menu,.mb-translation-backdrop').forEach(function(node){node.remove();});
    document.querySelectorAll('[data-mb-translation-button]').forEach(function(button){button.setAttribute('aria-expanded','false');});
  }
  function openMenu(button){
    closeMenu();
    var lang=currentLanguage();
    var backdrop=document.createElement('div');backdrop.className='mb-translation-backdrop';backdrop.setAttribute('aria-hidden','true');
    var menu=document.createElement('div');menu.className='mb-translation-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','表示言語');
    menu.innerHTML='<div class="mb-translation-menu-head"><strong>表示言語</strong><button class="mb-translation-menu-close" type="button" aria-label="閉じる">×</button></div><div class="mb-translation-options"></div><p class="mb-translation-note">Google翻訳で表示します。会社名・型式などは原文のままになる場合があります。</p>';
    var options=menu.querySelector('.mb-translation-options');
    LANGUAGES.forEach(function(item){
      var option=document.createElement('button');option.type='button';option.className='mb-translation-option';option.setAttribute('role','menuitemradio');option.setAttribute('aria-checked',String(item.code===lang));option.dataset.language=item.code;
      option.innerHTML='<span class="mb-translation-check">'+(item.code===lang?'✓':'')+'</span><span>'+item.label+'</span><small class="mb-translation-lang-code">'+item.code+'</small>';
      options.appendChild(option);
    });
    document.body.appendChild(backdrop);document.body.appendChild(menu);button.setAttribute('aria-expanded','true');
    var rect=button.getBoundingClientRect();var top=rect.bottom+8;var left=Math.min(window.innerWidth-menu.offsetWidth-14,Math.max(14,rect.right-menu.offsetWidth));
    menu.style.top=Math.max(14,top)+'px';menu.style.left=left+'px';
    backdrop.addEventListener('click',closeMenu);menu.querySelector('.mb-translation-menu-close').addEventListener('click',closeMenu);
    menu.addEventListener('click',function(event){var option=event.target.closest('[data-language]');if(!option)return;var selected=option.dataset.language;closeMenu();if(selected!==lang)navigateLanguage(selected);});
    var active=menu.querySelector('[aria-checked="true"]')||menu.querySelector('.mb-translation-option');if(active)active.focus();
  }
  function ensureButtons(){
    document.querySelectorAll('.mbu-brand,.topbar-inner .brand,.target-title-row h2').forEach(function(brand){brand.setAttribute('translate','no');});
    document.querySelectorAll('.mbu-actions').forEach(function(actions){if(!actions.querySelector('[data-mb-translation-button]'))actions.appendChild(makeButton());});
    document.querySelectorAll('.target-title-actions').forEach(function(actions){if(!actions.querySelector('[data-mb-translation-button]'))actions.appendChild(makeButton());});
    document.querySelectorAll('.topbar-inner .header-actions').forEach(function(actions){if(!actions.querySelector('[data-mb-translation-button]'))actions.appendChild(makeButton());});
    updateButtons();
  }
  function redirectFromOriginalWhenNeeded(){
    if(translationHost)return false;
    if(location.hostname!=='takina888.github.io')return false;
    var params=new URLSearchParams(location.search);var explicit=validLanguage(params.get(LANG_PARAM));
    if(explicit===SOURCE_LANG){
      storeLanguage(SOURCE_LANG);
      var clean=new URL(location.href);clean.searchParams.delete(LANG_PARAM);
      history.replaceState(null,'',clean.toString());
      return false;
    }
    var requested=explicit||readStoredLanguage();
    if(!requested||requested===SOURCE_LANG)return false;
    storeLanguage(requested);location.replace(buildTranslateUrl(location.href,requested));return true;
  }
  function handleInternalClick(event){
    var lang=currentLanguage();if(lang===SOURCE_LANG)return;
    var anchor=event.target.closest&&event.target.closest('a[href]');if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download'))return;
    var raw=anchor.getAttribute('href')||'';if(!raw||raw.charAt(0)==='#'||!isInternalUrl(anchor.href))return;
    event.preventDefault();location.href=buildTranslateUrl(anchor.href,lang);
  }
  function showTranslatedFallback(){
    if(!translationHost)return;
    var box=document.createElement('div');box.className='mb-translation-fallback';box.innerHTML='<span>翻訳表示を終了する場合は日本語版へ戻れます。</span><a href="'+japaneseUrl()+'">日本語版</a>';document.body.appendChild(box);
    window.setTimeout(function(){if(box&&box.parentNode)box.remove();},9000);
  }
  function boot(){
    if(redirectFromOriginalWhenNeeded())return;
    ensureButtons();
    document.addEventListener('click',function(event){var button=event.target.closest&&event.target.closest('[data-mb-translation-button]');if(button){event.preventDefault();openMenu(button);}},false);
    document.addEventListener('click',handleInternalClick,true);
    document.addEventListener('keydown',function(event){if(event.key==='Escape')closeMenu();});
    showTranslatedFallback();
  }
  window.MarketBaseTranslation={currentLanguage:currentLanguage,withLanguage:withLanguage,buildTranslateUrl:buildTranslateUrl,navigateLanguage:navigateLanguage};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
