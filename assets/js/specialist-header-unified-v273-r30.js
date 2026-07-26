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
    button.addEventListener('click',function(event){
      event.preventDefault();
      if(button.disabled)return;
      button.disabled=true;
      button.textContent='更新中';
      button.setAttribute('aria-busy','true');
      var url=new URL(window.location.href);
      url.searchParams.set('v','MARKET_BASE_R113_1_UPDATE_BUTTON_FIX_20260721');
      url.searchParams.set('refresh',Date.now().toString());
      window.location.replace(url.toString());
    });
  });

  /* R113.28: page movement is provided by market-base-scroll-controls-r11328.js.
     Do not create the retired one-way .mbu-top-button here. */
})();
