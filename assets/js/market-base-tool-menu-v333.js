(function(global){
'use strict';
if(global.MarketBaseToolMenu)return;
if(/\/world-radio\/player\.html$/i.test(global.location.pathname))return;
const LAST_TOOL_KEY='market_base_last_tool_v1';
const scriptNode=document.currentScript||document.querySelector('script[data-mb-tool-menu]');
let siteRoot;try{siteRoot=scriptNode?.src?new URL('../../',scriptNode.src):new URL('./',global.location.href)}catch(_){siteRoot=new URL('./',global.location.href)}
const tools=[
 {id:'calculator',label:'計算機・単位換算',note:'計算と各種換算',icon:'calculator',href:'market-base-currency-converter-v273-r29.html?tool=calculator&v=20260803-v333-3-radio-restore-v331-currency-runtime-fix'},
 {id:'currency',label:'為替換算',note:'通貨レートを換算',icon:'currency',href:'market-base-currency-converter-v273-r29.html?tool=currency&v=20260803-v333-3-radio-restore-v331-currency-runtime-fix'},
 {id:'workphoto',label:'WORK PHOTO',note:'写真撮影・加工',icon:'camera',disabled:true,badge:'作成中'},
 {id:'code',label:'WORK CODE',note:'QR・バーコード',icon:'code',href:'market-base-code-tool.html?v=20260803-v333-3-radio-restore-v331-currency-runtime-fix'}
];
let backdrop=null,dialog=null,closeButton=null,lastFocused=null,observer=null;
function storageSet(k,v){try{localStorage.setItem(k,v)}catch(_){}}
function safeHref(href){try{return new URL(href,siteRoot).href}catch(_){return new URL('index.html',siteRoot).href}}
function iconSvg(name){const icons={
 calculator:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="5" width="28" height="38" rx="7"></rect><rect x="15" y="10" width="18" height="8" rx="2"></rect><path d="M16 25h3M24 25h3M32 25h1M16 31h3M24 31h3M32 31h1M16 37h3M24 37h3M31 35v4M29 37h4"></path></svg>',
 currency:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="16" cy="18" r="10"></circle><circle cx="32" cy="30" r="10"></circle><path d="M12 13l4 5 4-5M16 18v7M12 20h8M29 25h6M32 22v16M28 34h8M9 34c3 4 8 6 13 6M39 14c-3-4-8-6-13-6"></path></svg>',
 code:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 8h12v12H8zM28 8h12v12H28zM8 28h12v12H8zM29 29h4v4h-4zM36 28v6M28 38h6M38 36v4M35 35h5"></path></svg>',
 camera:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 15h8l3-5h10l3 5h8a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V19a4 4 0 0 1 4-4Z"></path><circle cx="24" cy="28" r="9"></circle><circle cx="24" cy="28" r="4.5"></circle><path d="M36 21h2"></path></svg>'
};return icons[name]||icons.code}
function addStylesheet(){if(document.querySelector('link[data-mb-tool-menu-style]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('assets/css/market-base-tool-menu-v333.css?v=20260803-v333-3-radio-restore-v331-currency-runtime-fix',siteRoot).href;link.dataset.mbToolMenuStyle='';document.head.appendChild(link)}
function removeLegacyDock(){document.querySelectorAll('#marketBaseSecondaryDock,.mb-secondary-dock,.mb-tool-dock').forEach(node=>node.remove())}
function createMenu(){
 const node=document.createElement('div');node.className='mb-tool-menu-backdrop';node.id='marketBaseToolMenu';node.hidden=true;
 node.innerHTML='<section class="mb-tool-menu-dialog" role="dialog" aria-modal="true" aria-labelledby="mbToolMenuTitle"><header class="mb-tool-menu-head"><div><p class="mb-tool-menu-kicker">MARKET BASE</p><h2 class="mb-tool-menu-title" id="mbToolMenuTitle">ツール</h2></div><button class="mb-tool-menu-close" type="button" aria-label="ツールメニューを閉じる">×</button></header><div class="mb-tool-menu-grid" role="list"></div></section>';
 const grid=node.querySelector('.mb-tool-menu-grid');
 tools.forEach(tool=>{
  const item=document.createElement(tool.disabled?'button':'a');
  item.className='mb-tool-menu-item';item.dataset.toolId=tool.id;item.setAttribute('role','listitem');
  if(tool.disabled){item.type='button';item.setAttribute('aria-disabled','true');item.disabled=true}
  else{item.href=safeHref(tool.href);item.addEventListener('click',()=>storageSet(LAST_TOOL_KEY,tool.id))}
  item.innerHTML='<span class="mb-tool-menu-icon">'+iconSvg(tool.icon)+'</span><span class="mb-tool-menu-copy"><strong>'+tool.label+'</strong><small>'+tool.note+'</small>'+(tool.badge?'<span class="mb-tool-menu-badge">'+tool.badge+'</span>':'')+'</span>';
  grid.appendChild(item);
 });
 document.body.appendChild(node);return node;
}
function directTabs(nav){return Array.from(nav.children).filter(node=>node.matches?.('a,button'))}
function isToolTab(node,index){const label=String(node.textContent||'').replace(/\s+/g,'').trim();return node.matches?.('[data-mb-global-nav="tools"],[data-mb-tool-menu-trigger]')||label==='ツール'||index===1}
function decorateNavs(){
 removeLegacyDock();
 document.querySelectorAll('.mb-primary-bottom-nav').forEach(nav=>{
  directTabs(nav).forEach((node,index)=>{
   if(!isToolTab(node,index))return;
   if(node.dataset.mbToolMenuBound==='1')return;
   node.dataset.mbToolMenuBound='1';node.dataset.mbToolMenuTrigger='';node.classList.add('mb-tool-menu-trigger');
   node.setAttribute('role','button');node.setAttribute('aria-haspopup','dialog');node.setAttribute('aria-controls','marketBaseToolMenu');
   if(node.tagName==='A'){node.dataset.mbToolFallbackHref=node.getAttribute('href')||'';node.setAttribute('href','#marketBaseToolMenu')}
   node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openMenu(node)});
   node.addEventListener('keydown',event=>{if(event.key===' '){event.preventDefault();openMenu(node)}});
  });
 });
}
function openMenu(trigger){lastFocused=trigger||document.activeElement;backdrop.hidden=false;document.documentElement.classList.add('mb-tool-menu-open');requestAnimationFrame(()=>closeButton?.focus())}
function closeMenu(){if(backdrop.hidden)return;backdrop.hidden=true;document.documentElement.classList.remove('mb-tool-menu-open');lastFocused?.focus?.();lastFocused=null}
function init(){addStylesheet();removeLegacyDock();backdrop=createMenu();dialog=backdrop.querySelector('.mb-tool-menu-dialog');closeButton=backdrop.querySelector('.mb-tool-menu-close');closeButton.addEventListener('click',closeMenu);backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeMenu()});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!backdrop.hidden)closeMenu()});decorateNavs();observer=new MutationObserver(decorateNavs);observer.observe(document.body,{childList:true,subtree:true})}
global.MarketBaseToolMenu=Object.freeze({open:()=>openMenu(null),close:closeMenu,refresh:decorateNavs,tools:tools.map(({id,label,disabled})=>({id,label,disabled:!!disabled}))});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
