(function(){
  'use strict';
  function boot(){
    if(document.querySelector('.mb-desktop-navigation'))return;
    var nav=document.createElement('nav');
    nav.className='mb-desktop-navigation';
    nav.setAttribute('aria-label','PC用ページナビゲーション');
    nav.setAttribute('translate','no');
    nav.innerHTML='<a class="mb-desktop-home" href="index.html?from=desktop-nav" aria-label="MARKET BASEのホームへ戻る"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z"></path><path d="M9 21v-7h6v7"></path></svg><span>ホーム</span></a><a class="mb-desktop-currency" href="market-base-currency-converter-v273-r29.html" aria-label="為替換算を開く"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="12" r="5.5"></circle><circle cx="15" cy="12" r="5.5"></circle><path d="M6.5 9h5M9 6.5v11M13 9h5M13 15h5"></path></svg><span>為替換算</span></a><button class="mb-desktop-top" type="button" aria-label="ページ上部へ戻る"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 11 7-7 7 7"></path><path d="M12 4v16"></path></svg><span>上へ</span></button>';
    document.body.appendChild(nav);
    nav.querySelector('.mb-desktop-top').addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
    nav.querySelector('.mb-desktop-home').addEventListener('click',function(event){
      if(event.defaultPrevented)return;
      if(typeof window.showHome==='function'){event.preventDefault();window.showHome();}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
