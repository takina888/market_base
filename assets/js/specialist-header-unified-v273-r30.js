(function(){
  'use strict';
  var header=document.querySelector('.mbu-header');
  if(header && header.parentElement!==document.body){
    header.parentElement.classList.add('mbu-header-original-host');
    document.body.insertBefore(header,document.body.firstChild);
  }
  if(header){
    /* R32U8N: neutralize each legacy DB's body top padding so every header
       starts at the same viewport position as the food-machinery page. */
    var bodyPaddingTop=parseFloat(window.getComputedStyle(document.body).paddingTop)||0;
    header.style.setProperty('margin-top',(-bodyPaddingTop)+'px','important');
  }
  document.querySelectorAll('[data-mbu-refresh]').forEach(function(button){
    button.addEventListener('click',function(){
      var url=new URL(window.location.href);
      url.searchParams.set('refresh',Date.now().toString());
      window.location.replace(url.toString());
    });
  });

  /* R32U8L: restore one shared round back-to-top button on every specialist DB. */
  document.querySelectorAll('.topbtn,.back-to-top,.to-top,.scroll-top').forEach(function(oldButton){
    oldButton.remove();
  });
  var topButton=document.createElement('button');
  topButton.type='button';
  topButton.className='mbu-top-button';
  topButton.setAttribute('aria-label','ページ上部へ戻る');
  topButton.setAttribute('title','ページ上部へ戻る');
  topButton.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 11 7-7 7 7"></path><path d="M12 4v16"></path></svg>';
  topButton.addEventListener('click',function(){
    window.scrollTo({top:0,left:0,behavior:'smooth'});
  });
  document.body.appendChild(topButton);
})();
