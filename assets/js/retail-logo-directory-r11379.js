
(function(){
  'use strict';
  if(window.MARKET_BASE_RETAIL_LOGO_DIRECTORY_READY)return;
  window.MARKET_BASE_RETAIL_LOGO_DIRECTORY_READY=true;
  var DATA=window.MARKET_BASE_RETAIL_LOGO_DIRECTORY;
  if(!DATA||!Array.isArray(DATA.boards)||!DATA.boards.length)return;
  var RETAIL_PAGE='retail-sales-v273-db-title-r27.html';

  function el(tag,className,text){
    var node=document.createElement(tag);
    if(className)node.className=className;
    if(text!=null)node.textContent=text;
    return node;
  }
  function hrefFor(cell){
    if(cell.target_id){
      return RETAIL_PAGE+'?focus='+encodeURIComponent(cell.target_id)+'#'+encodeURIComponent(cell.target_id);
    }
    return RETAIL_PAGE+'?q='+encodeURIComponent(cell.query||cell.label||'');
  }
  function createBoard(board,index){
    var figure=el('figure','retail-logo-board');
    figure.dataset.logoBoard=board.id||String(index+1);
    var image=el('img');
    image.src=board.image;
    image.alt=board.title+'の小売企業ロゴ一覧';
    image.loading=index<2?'eager':'lazy';
    image.decoding='async';
    var links=el('div','retail-logo-board__links');
    links.setAttribute('aria-label',board.title+'の企業詳細リンク');
    (board.cells||[]).slice(0,16).forEach(function(cell){
      var link=el('a','retail-logo-board__link');
      link.href=hrefFor(cell);
      link.setAttribute('aria-label',cell.label+'の詳細情報を開く');
      link.title=cell.label+'の詳細情報';
      link.appendChild(el('span','',cell.label));
      links.appendChild(link);
    });
    var caption=el('figcaption');
    caption.appendChild(el('span','',board.title));
    caption.appendChild(el('small','',String(index+1).padStart(2,'0')+' / '+String(DATA.boards.length).padStart(2,'0')));
    figure.append(image,links,caption);
    return figure;
  }
  function mount(){
    if(document.getElementById('retailLogoDirectory'))return true;
    var daily=document.getElementById('dailyRetailShowcase');
    var home=document.getElementById('home')||document.querySelector('main');
    if(!home)return false;
    var section=el('section','retail-logo-directory');
    section.id='retailLogoDirectory';
    section.setAttribute('aria-labelledby','retailLogoDirectoryTitle');
    var head=el('div','retail-logo-directory__head');
    var copy=el('div','retail-logo-directory__copy');
    copy.appendChild(el('span','retail-logo-directory__eyebrow','RETAIL LOGO DIRECTORY'));
    var title=el('h2','', '世界の小売ロゴから探す');
    title.id='retailLogoDirectoryTitle';copy.appendChild(title);
    copy.appendChild(el('p','retail-logo-directory__lead','ロゴを選ぶと、小売業データベースの企業詳細へ移動します。'));
    var controls=el('div','retail-logo-directory__controls');
    var prev=el('button','retail-logo-directory__button','‹');prev.type='button';prev.setAttribute('aria-label','前のロゴ一覧へ');
    var status=el('span','retail-logo-directory__status','1 / '+DATA.boards.length);status.setAttribute('aria-live','polite');
    var next=el('button','retail-logo-directory__button','›');next.type='button';next.setAttribute('aria-label','次のロゴ一覧へ');
    controls.append(prev,status,next);head.append(copy,controls);section.appendChild(head);
    var viewport=el('div','retail-logo-directory__viewport');
    viewport.setAttribute('tabindex','0');viewport.setAttribute('aria-label','小売企業ロゴ一覧。横方向にスクロールできます');
    DATA.boards.forEach(function(board,index){viewport.appendChild(createBoard(board,index));});
    section.appendChild(viewport);
    if(daily&&daily.parentNode){daily.insertAdjacentElement('afterend',section);}else{home.appendChild(section);}
    var cards=[].slice.call(viewport.children);
    function currentIndex(){
      var left=viewport.scrollLeft;var best=0;var dist=Infinity;
      cards.forEach(function(card,index){var d=Math.abs(card.offsetLeft-left);if(d<dist){dist=d;best=index;}});
      return best;
    }
    function update(){status.textContent=(currentIndex()+1)+' / '+cards.length;}
    function move(delta){
      var index=Math.max(0,Math.min(cards.length-1,currentIndex()+delta));
      cards[index].scrollIntoView({behavior:'smooth',block:'nearest',inline:'start'});
      window.setTimeout(update,320);
    }
    prev.addEventListener('click',function(){move(-1);});
    next.addEventListener('click',function(){move(1);});
    var ticking=false;
    viewport.addEventListener('scroll',function(){if(ticking)return;ticking=true;requestAnimationFrame(function(){ticking=false;update();});},{passive:true});
    update();
    return true;
  }
  function start(){
    if(mount())return;
    var home=document.getElementById('home')||document.body;
    var observer=new MutationObserver(function(){if(mount())observer.disconnect();});
    observer.observe(home,{childList:true,subtree:true});
    window.setTimeout(function(){mount();observer.disconnect();},12000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
