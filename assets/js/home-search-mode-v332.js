(function(){
  'use strict';
  var form=document.getElementById('homeGlobalSearchForm');
  var input=document.getElementById('homeGlobalSearchInput');
  var tabs=Array.prototype.slice.call(document.querySelectorAll('[data-home-search-mode]'));
  if(!form||!input||!tabs.length)return;
  var mode='internal';
  function setMode(next,focus){
    mode=next==='google'?'google':'internal';
    form.dataset.searchMode=mode;
    tabs.forEach(function(tab){var active=tab.dataset.homeSearchMode===mode;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    input.placeholder=mode==='google'?'Googleでキーワードを検索':'国・地域・企業・ブランドを検索';
    input.setAttribute('aria-label',mode==='google'?'Googleで検索':'国・地域・企業・ブランドを内部検索');
    if(focus)input.focus();
  }
  tabs.forEach(function(tab,index){
    tab.addEventListener('click',function(){setMode(tab.dataset.homeSearchMode,true);});
    tab.addEventListener('keydown',function(event){if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();var next=(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;setMode(tabs[next].dataset.homeSearchMode,true);});
  });
  form.addEventListener('submit',function(event){if(mode!=='google')return;event.preventDefault();event.stopImmediatePropagation();var query=input.value.trim();if(!query){input.focus();return;}var opened=window.open('https://www.google.com/search?q='+encodeURIComponent(query),'_blank','noopener,noreferrer');if(opened)opened.opener=null;},true);
  setMode('internal',false);
})();
