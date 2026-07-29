(function(){
  'use strict';

  var stories=Array.isArray(window.MARKET_BASE_RAKUDA_STORIES)?window.MARKET_BASE_RAKUDA_STORIES:[];
  var PAGE_SIZE=12;
  var READ_STORAGE_KEY='marketBaseRakudaReadStoriesV301';
  var state={
    currentIndex:0,
    filtered:stories.slice(),
    listPage:0,
    search:'',
    theme:'',
    readStories:loadReadStories()
  };

  var elements={
    refresh:document.getElementById('pageRefreshButton'),
    position:document.getElementById('storyPosition'),
    theme:document.getElementById('storyTheme'),
    title:document.getElementById('storyTitle'),
    card:document.getElementById('storyCard'),
    body:document.getElementById('storyBody'),
    final:document.getElementById('storyFinal'),
    business:document.getElementById('storyBusiness'),
    caution:document.getElementById('storyCaution'),
    reader:document.getElementById('storyReader'),
    previous:document.getElementById('previousStoryButton'),
    next:document.getElementById('nextStoryButton'),
    random:document.getElementById('randomStoryButton'),
    randomSide:document.getElementById('randomStorySideButton'),
    share:document.getElementById('shareStoryButton'),
    print:document.getElementById('printStoryButton'),
    actionStatus:document.getElementById('storyActionStatus'),
    sizeStandard:document.getElementById('textSizeStandard'),
    sizeLarge:document.getElementById('textSizeLarge'),
    search:document.getElementById('storySearchInput'),
    themeSelect:document.getElementById('storyThemeSelect'),
    clear:document.getElementById('clearSearchButton'),
    resultCount:document.getElementById('storyResultCount'),
    list:document.getElementById('storyList'),
    listPrevious:document.getElementById('previousListPageButton'),
    listNext:document.getElementById('nextListPageButton'),
    listStatus:document.getElementById('listPageStatus')
  };



  function loadReadStories(){
    try{
      var saved=JSON.parse(localStorage.getItem(READ_STORAGE_KEY)||'[]');
      if(Array.isArray(saved))return saved.filter(function(value){return stories.some(function(story){return story.id===value;});});
    }catch(error){}
    return [];
  }

  function saveReadStories(){
    try{localStorage.setItem(READ_STORAGE_KEY,JSON.stringify(state.readStories));}catch(error){}
  }

  function isRead(storyId){
    return state.readStories.indexOf(storyId)>=0;
  }

  function markRead(storyId){
    if(isRead(storyId))return false;
    state.readStories.push(storyId);
    saveReadStories();
    return true;
  }

  function normalise(value){
    return String(value||'').toLocaleLowerCase('ja-JP').replace(/\s+/g,' ').trim();
  }

  function storyFromLocation(){
    var params=new URLSearchParams(location.search);
    var hashMatch=location.hash.match(/^#story-(\d+)$/);
    var requested=params.get('story')||(hashMatch?hashMatch[1]:'');
    if(!requested){
      try{requested=localStorage.getItem('marketBaseRakudaCurrent')||'';}catch(error){}
    }
    if(!requested)return 0;
    var found=stories.findIndex(function(story){
      return story.id===requested || String(story.seq)===requested;
    });
    return found>=0?found:0;
  }

  function updateLocation(story){
    var url=new URL(location.href);
    url.searchParams.set('story',story.id);
    url.hash='story-'+story.seq;
    try{history.replaceState({story:story.id},'',url);}catch(error){}
    try{localStorage.setItem('marketBaseRakudaCurrent',story.id);}catch(error){}
  }

  function clearChildren(node){
    while(node&&node.firstChild)node.removeChild(node.firstChild);
  }

  function renderBody(text){
    clearChildren(elements.body);
    String(text||'').split(/\n{2,}/).forEach(function(block){
      var paragraph=document.createElement('p');
      paragraph.textContent=block.trim();
      elements.body.appendChild(paragraph);
    });
  }

  function setStory(index,options){
    if(!stories.length)return;
    var settings=options||{};
    state.currentIndex=Math.max(0,Math.min(index,stories.length-1));
    var story=stories[state.currentIndex];
    markRead(story.id);

    elements.position.textContent='第'+String(story.seq).padStart(2,'0')+'話 / '+stories.length;
    elements.theme.textContent=story.theme;
    elements.title.textContent=story.title;
    elements.card.textContent=story.card;
    renderBody(story.body);
    elements.final.textContent=story.final;
    elements.business.textContent=story.business;
    elements.caution.textContent=story.caution;
    elements.previous.disabled=state.currentIndex===0;
    elements.next.disabled=state.currentIndex===stories.length-1;
    elements.actionStatus.textContent='';

    updateLocation(story);
    renderList();

    if(settings.focus){
      elements.reader.scrollIntoView({behavior:'smooth',block:'start'});
      window.setTimeout(function(){elements.title.focus({preventScroll:true});},180);
    }
  }

  function previousStory(){
    if(state.currentIndex>0)setStory(state.currentIndex-1,{focus:true});
  }

  function nextStory(){
    if(state.currentIndex<stories.length-1)setStory(state.currentIndex+1,{focus:true});
  }

  function randomStory(){
    if(stories.length<2)return;
    var next=state.currentIndex;
    while(next===state.currentIndex){
      next=Math.floor(Math.random()*stories.length);
    }
    setStory(next,{focus:true});
  }

  function populateThemes(){
    var themes=[];
    stories.forEach(function(story){
      String(story.theme||'').split('／').forEach(function(theme){
        var clean=theme.trim();
        if(clean&&themes.indexOf(clean)===-1)themes.push(clean);
      });
    });
    themes.sort(function(a,b){return a.localeCompare(b,'ja');});
    themes.forEach(function(theme){
      var option=document.createElement('option');
      option.value=theme;
      option.textContent=theme;
      elements.themeSelect.appendChild(option);
    });
  }

  function applyFilters(){
    state.search=normalise(elements.search.value);
    state.theme=elements.themeSelect.value;
    state.filtered=stories.filter(function(story){
      var haystack=normalise([
        story.title,story.card,story.body,story.final,story.theme,story.business
      ].join(' '));
      var searchMatch=!state.search||haystack.indexOf(state.search)>=0;
      var themeMatch=!state.theme||String(story.theme).split('／').map(function(value){return value.trim();}).indexOf(state.theme)>=0;
      return searchMatch&&themeMatch;
    });
    state.listPage=0;
    renderList();
  }

  function createStoryChoice(story){
    var index=stories.findIndex(function(item){return item.id===story.id;});
    var button=document.createElement('button');
    button.type='button';
    button.className='rakuda-story-choice';
    if(index===state.currentIndex){
      button.classList.add('is-current');
      button.setAttribute('aria-current','true');
    }
    button.setAttribute('aria-label','第'+story.seq+'話「'+story.title+'」を読む');

    var top=document.createElement('span');
    top.className='rakuda-story-choice__top';

    var number=document.createElement('span');
    number.textContent='第'+String(story.seq).padStart(2,'0')+'話';
    top.appendChild(number);

    var stateWrap=document.createElement('span');
    stateWrap.className='rakuda-story-choice__state-group';

    if(isRead(story.id)){
      var readState=document.createElement('span');
      readState.className='rakuda-story-choice__state is-read';
      readState.textContent='読了';
      stateWrap.appendChild(readState);
    }

    if(index===state.currentIndex){
      var current=document.createElement('span');
      current.className='rakuda-story-choice__state is-current';
      current.textContent='読んでいる話';
      stateWrap.appendChild(current);
    }

    if(stateWrap.childNodes.length)top.appendChild(stateWrap);

    var title=document.createElement('span');
    title.className='rakuda-story-choice__title';
    title.textContent=story.title;

    var card=document.createElement('span');
    card.className='rakuda-story-choice__card';
    card.textContent=story.card;

    var theme=document.createElement('small');
    theme.textContent=story.theme;

    button.appendChild(top);
    button.appendChild(title);
    button.appendChild(card);
    button.appendChild(theme);
    button.addEventListener('click',function(){
      setStory(index,{focus:true});
    });
    return button;
  }

  function renderList(){
    if(!elements.list)return;
    clearChildren(elements.list);
    var total=state.filtered.length;
    var pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
    if(state.listPage>=pages)state.listPage=pages-1;
    var start=state.listPage*PAGE_SIZE;
    var pageStories=state.filtered.slice(start,start+PAGE_SIZE);

    if(!pageStories.length){
      var empty=document.createElement('p');
      empty.className='rakuda-empty-state';
      empty.textContent='条件に合う物語はありません。言葉やテーマを変えてお試しください。';
      elements.list.appendChild(empty);
    }else{
      pageStories.forEach(function(story){
        elements.list.appendChild(createStoryChoice(story));
      });
    }

    elements.resultCount.textContent=total+'話 / 読了'+state.readStories.length+'話';
    elements.listStatus.textContent=(state.listPage+1)+' / '+pages+'ページ';
    elements.listPrevious.disabled=state.listPage===0;
    elements.listNext.disabled=state.listPage>=pages-1;
  }

  function changeListPage(delta){
    var pages=Math.max(1,Math.ceil(state.filtered.length/PAGE_SIZE));
    state.listPage=Math.max(0,Math.min(state.listPage+delta,pages-1));
    renderList();
    document.getElementById('storyIndexTitle').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function setTextSize(size){
    var large=size==='large';
    document.body.classList.toggle('rakuda-text-large',large);
    elements.sizeStandard.setAttribute('aria-pressed',String(!large));
    elements.sizeLarge.setAttribute('aria-pressed',String(large));
    try{localStorage.setItem('marketBaseRakudaTextSize',large?'large':'standard');}catch(error){}
  }

  function restoreTextSize(){
    var size='standard';
    try{size=localStorage.getItem('marketBaseRakudaTextSize')||'standard';}catch(error){}
    setTextSize(size);
  }

  function shareCurrentStory(){
    var story=stories[state.currentIndex];
    var shareData={
      title:story.title+'｜ラクダの目',
      text:story.card,
      url:location.href
    };
    if(navigator.share){
      navigator.share(shareData).then(function(){
        elements.actionStatus.textContent='共有画面を開きました。';
      }).catch(function(error){
        if(error&&error.name!=='AbortError')elements.actionStatus.textContent='共有できませんでした。';
      });
      return;
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(location.href).then(function(){
        elements.actionStatus.textContent='この話のURLをコピーしました。';
      }).catch(function(){
        elements.actionStatus.textContent='URLをコピーできませんでした。';
      });
      return;
    }
    elements.actionStatus.textContent='ブラウザのアドレス欄からURLをコピーしてください。';
  }

  function bind(){
    elements.refresh.addEventListener('click',function(){location.reload();});
    elements.previous.addEventListener('click',previousStory);
    elements.next.addEventListener('click',nextStory);
    elements.random.addEventListener('click',randomStory);
    elements.randomSide.addEventListener('click',randomStory);
    elements.share.addEventListener('click',shareCurrentStory);
    elements.print.addEventListener('click',function(){window.print();});
    elements.sizeStandard.addEventListener('click',function(){setTextSize('standard');});
    elements.sizeLarge.addEventListener('click',function(){setTextSize('large');});
    elements.search.addEventListener('input',applyFilters);
    elements.themeSelect.addEventListener('change',applyFilters);
    elements.clear.addEventListener('click',function(){
      elements.search.value='';
      elements.themeSelect.value='';
      applyFilters();
      elements.search.focus();
    });
    elements.listPrevious.addEventListener('click',function(){changeListPage(-1);});
    elements.listNext.addEventListener('click',function(){changeListPage(1);});

    document.addEventListener('keydown',function(event){
      var target=event.target;
      var tag=target&&target.tagName?target.tagName.toLowerCase():'';
      if(['input','select','textarea','button','a','summary'].indexOf(tag)>=0||target.isContentEditable)return;
      if(event.key==='ArrowLeft'){
        event.preventDefault();
        previousStory();
      }else if(event.key==='ArrowRight'){
        event.preventDefault();
        nextStory();
      }
    });
  }

  function showDataError(){
    if(!elements.reader)return;
    elements.title.textContent='物語データを読み込めませんでした';
    elements.card.textContent='data/stories.js の配置と読み込み順を確認してください。';
    elements.previous.disabled=true;
    elements.next.disabled=true;
    elements.random.disabled=true;
    elements.randomSide.disabled=true;
  }

  if(!stories.length){
    showDataError();
    return;
  }

  populateThemes();
  restoreTextSize();
  bind();
  state.currentIndex=storyFromLocation();
  setStory(state.currentIndex,{focus:false});
})();
