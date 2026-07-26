(function(){
  'use strict';
  var LEGACY_SELECTOR='.mbu-top-button,.topbtn,.top-anchor,.back-to-top,.to-top,.scroll-top,.page-top';

  function removeLegacyControls(){
    document.querySelectorAll(LEGACY_SELECTOR).forEach(function(node){node.remove();});
  }

  function mountScrollControls(){
    if(document.querySelector('[data-mb-scroll-controls]'))return;
    removeLegacyControls();

    if(document.querySelector('.mb-primary-bottom-nav')){
      document.body.classList.add('mb-has-primary-bottom-nav');
    }

    var rail=document.createElement('nav');
    rail.className='mb-scroll-controls';
    rail.setAttribute('data-mb-scroll-controls','');
    rail.setAttribute('aria-label','ページ内移動');

    var up=document.createElement('button');
    up.type='button';
    up.className='mb-scroll-control mb-scroll-control-up';
    up.setAttribute('aria-label','ページ上部へ移動');
    up.setAttribute('title','ページ上部へ移動');
    up.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 11 7-7 7 7"></path><path d="M12 4v16"></path></svg>';

    var down=document.createElement('button');
    down.type='button';
    down.className='mb-scroll-control mb-scroll-control-down';
    down.setAttribute('aria-label','ページ下部へ移動');
    down.setAttribute('title','ページ下部へ移動');
    down.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 13 7 7 7-7"></path><path d="M12 20V4"></path></svg>';

    up.addEventListener('click',function(){
      window.scrollTo({top:0,left:0,behavior:'smooth'});
    });
    down.addEventListener('click',function(){
      var end=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);
      window.scrollTo({top:end,left:0,behavior:'smooth'});
    });

    rail.appendChild(up);
    rail.appendChild(down);
    document.body.appendChild(rail);

    var ticking=false;
    function update(){
      ticking=false;
      var doc=document.documentElement;
      var top=Math.max(window.scrollY||0,doc.scrollTop||0);
      var viewport=window.innerHeight||doc.clientHeight||0;
      var height=Math.max(doc.scrollHeight,document.body.scrollHeight);
      var max=Math.max(0,height-viewport);
      var scrollable=max>80;
      rail.hidden=!scrollable;
      up.disabled=!scrollable||top<=24;
      down.disabled=!scrollable||top>=max-24;
    }
    function requestUpdate(){
      if(ticking)return;
      ticking=true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll',requestUpdate,{passive:true});
    window.addEventListener('resize',requestUpdate,{passive:true});
    window.addEventListener('load',requestUpdate,{once:true});
    if('ResizeObserver' in window){
      new ResizeObserver(requestUpdate).observe(document.body);
    }
    requestUpdate();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mountScrollControls,{once:true});
  }else{
    mountScrollControls();
  }
})();
