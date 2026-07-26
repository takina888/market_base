(function(){
  'use strict';

  const MAIN_FILES=new Set(['','index.html','market-base-v273-country-profile-r28.html']);
  const file=(location.pathname.split('/').pop()||'').toLowerCase();
  const isMain=MAIN_FILES.has(file);
  document.body.classList.add(isMain?'mb-unified-main-page':'mb-unified-specialist-page');
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
    if(isMain && (target.matches('[data-view-back-home]') || target.matches('.mb-primary-bottom-tab[data-home], [data-home="true"]'))){
      goHome(event);
    }
  },true);

  const before=location.href;
  const url=cleanMalformedRefresh(new URL(before));
  if(url.toString()!==before)history.replaceState(history.state,'',url.toString());
})();
