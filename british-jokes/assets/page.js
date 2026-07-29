(function(){
  'use strict';

  var jokes=Array.isArray(window.MB_BRITISH_JOKES)?window.MB_BRITISH_JOKES:[];
  var readKey='mbBritishJokesReadV1';
  var englishKey='mbBritishJokesEnglishVisibleV1';
  var currentId='';
  var query='';
  var category='';
  var unreadOnly=false;
  var validIds=new Set(jokes.map(function(joke){return joke.id;}));
  var readIds=new Set(loadJson(readKey,[]).filter(function(id){return validIds.has(id);}));
  var englishVisible=loadJson(englishKey,true)!==false;

  var elements={
    refresh:document.getElementById('pageRefreshButton'),
    search:document.getElementById('searchInput'),
    category:document.getElementById('categorySelect'),
    jump:document.getElementById('jumpSelect'),
    random:document.getElementById('randomButton'),
    clear:document.getElementById('clearButton'),
    unreadOnly:document.getElementById('unreadOnlyInput'),
    list:document.getElementById('storyList'),
    filteredCount:document.getElementById('filteredCount'),
    totalCount:document.getElementById('totalCount'),
    categoryCount:document.getElementById('categoryCount'),
    readCountHero:document.getElementById('readCountHero'),
    readProgressText:document.getElementById('readProgressText'),
    filterStatus:document.getElementById('filterStatus'),
    progressBar:document.getElementById('readProgressBar'),
    progressFill:document.getElementById('readProgressFill'),
    id:document.getElementById('storyId'),
    categoryLabel:document.getElementById('storyCategory'),
    titleJa:document.getElementById('storyTitleJa'),
    titleEn:document.getElementById('storyTitleEn'),
    bodyJa:document.getElementById('storyBodyJa'),
    bodyEn:document.getElementById('storyBodyEn'),
    englishSection:document.getElementById('englishSection'),
    englishToggle:document.getElementById('englishToggleButton'),
    explanation:document.getElementById('explanationDetails'),
    explanationText:document.getElementById('explanationText'),
    readButton:document.getElementById('readButton'),
    previous:document.getElementById('previousButton'),
    next:document.getElementById('nextButton'),
    position:document.getElementById('storyPosition'),
    liveStatus:document.getElementById('liveStatus'),
    reader:document.getElementById('storyReader')
  };

  function loadJson(key,fallback){
    try{
      var value=localStorage.getItem(key);
      return value===null?fallback:JSON.parse(value);
    }catch(error){return fallback;}
  }

  function saveRead(){
    try{localStorage.setItem(readKey,JSON.stringify(Array.from(readIds)));}catch(error){}
  }

  function saveEnglish(){
    try{localStorage.setItem(englishKey,JSON.stringify(englishVisible));}catch(error){}
  }

  function normalize(value){
    return String(value||'').toLocaleLowerCase('ja-JP').normalize('NFKC');
  }

  function getFiltered(){
    var needle=normalize(query).trim();
    return jokes.filter(function(joke){
      if(category&&joke.category!==category){return false;}
      if(unreadOnly&&readIds.has(joke.id)){return false;}
      if(!needle){return true;}
      var haystack=normalize([
        joke.id,joke.category,joke.titleJa,joke.titleEn,
        joke.bodyJa,joke.bodyEn,joke.explanationJa,joke.humourCore
      ].join(' '));
      return haystack.indexOf(needle)!==-1;
    });
  }

  function paragraphs(target,text){
    target.textContent='';
    String(text||'').split(/\n\s*\n/).forEach(function(block){
      var p=document.createElement('p');
      p.textContent=block.trim();
      target.appendChild(p);
    });
  }

  function populateCategories(){
    var categories=Array.from(new Set(jokes.map(function(joke){return joke.category;}))).sort(function(a,b){return a.localeCompare(b,'ja');});
    categories.forEach(function(value){
      var option=document.createElement('option');
      option.value=value;
      option.textContent=value;
      elements.category.appendChild(option);
    });
    elements.categoryCount.textContent=String(categories.length);
  }

  function renderJump(filtered){
    var previous=elements.jump.value;
    elements.jump.textContent='';
    filtered.forEach(function(joke){
      var option=document.createElement('option');
      option.value=joke.id;
      option.textContent=joke.id.replace('BJ-','')+'｜'+joke.titleJa;
      elements.jump.appendChild(option);
    });
    if(filtered.some(function(joke){return joke.id===currentId;})){
      elements.jump.value=currentId;
    }else if(filtered.some(function(joke){return joke.id===previous;})){
      elements.jump.value=previous;
    }
  }

  function renderList(filtered){
    elements.list.textContent='';
    if(!filtered.length){
      var empty=document.createElement('p');
      empty.className='bj-empty-list';
      empty.textContent='条件に合う話がありません。';
      elements.list.appendChild(empty);
      return;
    }
    var fragment=document.createDocumentFragment();
    filtered.forEach(function(joke){
      var button=document.createElement('button');
      button.type='button';
      button.className='bj-story-item';
      button.dataset.storyId=joke.id;
      button.setAttribute('aria-current',joke.id===currentId?'true':'false');
      button.setAttribute('aria-label',joke.id+' '+joke.titleJa+'を読む');

      var number=document.createElement('span');
      number.className='bj-story-number';
      number.textContent=joke.id.replace('BJ-','');

      var copy=document.createElement('span');
      copy.className='bj-story-copy';
      var title=document.createElement('strong');
      title.textContent=joke.titleJa;
      var categoryText=document.createElement('small');
      categoryText.textContent=joke.category;
      copy.appendChild(title);
      copy.appendChild(categoryText);

      var badge=document.createElement('span');
      badge.className='bj-read-badge'+(readIds.has(joke.id)?' is-read':'');
      badge.textContent=readIds.has(joke.id)?'読了':'未読';

      button.appendChild(number);
      button.appendChild(copy);
      button.appendChild(badge);
      button.addEventListener('click',function(){selectStory(joke.id,true);});
      fragment.appendChild(button);
    });
    elements.list.appendChild(fragment);
  }

  function ensureCurrent(filtered){
    if(filtered.some(function(joke){return joke.id===currentId;})){return;}
    if(filtered.length){currentId=filtered[0].id;}
  }

  function currentStory(){
    return jokes.find(function(joke){return joke.id===currentId;})||jokes[0]||null;
  }

  function renderStory(filtered){
    var joke=currentStory();
    if(!joke){return;}
    elements.id.textContent=joke.id;
    elements.categoryLabel.textContent=joke.category;
    elements.titleJa.textContent=joke.titleJa;
    elements.titleEn.textContent=joke.titleEn;
    paragraphs(elements.bodyJa,joke.bodyJa);
    paragraphs(elements.bodyEn,joke.bodyEn);

    var hasExplanation=joke.needsExplanation&&joke.explanationJa.trim();
    elements.explanation.hidden=!hasExplanation;
    elements.explanation.open=false;
    elements.explanationText.textContent=hasExplanation?joke.explanationJa:'';

    var isRead=readIds.has(joke.id);
    elements.readButton.setAttribute('aria-pressed',isRead?'true':'false');
    elements.readButton.textContent=isRead?'読了済み':'読了にする';

    elements.englishSection.classList.toggle('is-collapsed',!englishVisible);
    elements.englishToggle.setAttribute('aria-expanded',englishVisible?'true':'false');
    elements.englishToggle.textContent=englishVisible?'英語を隠す':'英語を表示';

    var index=filtered.findIndex(function(item){return item.id===joke.id;});
    if(index<0){index=0;}
    elements.position.textContent=(filtered.length?index+1:0)+' / '+filtered.length;
    elements.previous.disabled=filtered.length<2;
    elements.next.disabled=filtered.length<2;
    elements.jump.value=joke.id;

    document.querySelectorAll('.bj-story-item').forEach(function(button){
      button.setAttribute('aria-current',button.dataset.storyId===joke.id?'true':'false');
    });

    var active=document.querySelector('.bj-story-item[aria-current="true"]');
    if(active&&window.matchMedia('(min-width:900px)').matches){
      active.scrollIntoView({block:'nearest'});
    }
  }

  function renderProgress(filtered){
    var count=readIds.size;
    var total=jokes.length||1;
    elements.totalCount.textContent=String(jokes.length);
    elements.readCountHero.textContent=String(count);
    elements.readProgressText.textContent=count+' / '+jokes.length+'話 読了';
    elements.progressBar.setAttribute('aria-valuemax',String(jokes.length));
    elements.progressBar.setAttribute('aria-valuenow',String(count));
    elements.progressFill.style.width=Math.min(100,(count/total)*100)+'%';
    elements.filteredCount.textContent=String(filtered.length);
    elements.filterStatus.textContent=filtered.length+'話を表示中';
  }

  function renderAll(){
    var filtered=getFiltered();
    ensureCurrent(filtered);
    renderJump(filtered);
    renderList(filtered);
    renderProgress(filtered);
    elements.reader.hidden=!filtered.length;
    if(filtered.length){renderStory(filtered);}
    else{
      elements.position.textContent='0 / 0';
      elements.previous.disabled=true;
      elements.next.disabled=true;
    }
  }

  function selectStory(id,announce){
    if(!jokes.some(function(joke){return joke.id===id;})){return;}
    currentId=id;
    history.replaceState(null,'','#'+id);
    var filtered=getFiltered();
    renderList(filtered);
    renderStory(filtered);
    if(announce){
      elements.liveStatus.textContent=currentStory().titleJa+'を表示しました。';
      document.getElementById('storyReader').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
    }
  }

  function move(step){
    var filtered=getFiltered();
    if(!filtered.length){return;}
    var index=filtered.findIndex(function(joke){return joke.id===currentId;});
    if(index<0){index=0;}
    var nextIndex=(index+step+filtered.length)%filtered.length;
    selectStory(filtered[nextIndex].id,true);
  }

  function toggleRead(){
    var joke=currentStory();
    if(!joke){return;}
    if(readIds.has(joke.id)){readIds.delete(joke.id);}else{readIds.add(joke.id);}
    saveRead();
    renderAll();
    elements.liveStatus.textContent=readIds.has(joke.id)?joke.titleJa+'を読了にしました。':joke.titleJa+'を未読に戻しました。';
  }

  function randomStory(){
    var filtered=getFiltered();
    if(!filtered.length){return;}
    var candidates=filtered.filter(function(joke){return joke.id!==currentId;});
    var pool=candidates.length?candidates:filtered;
    var joke=pool[Math.floor(Math.random()*pool.length)];
    selectStory(joke.id,true);
  }

  function initialId(){
    var hash=decodeURIComponent(location.hash.replace(/^#/,''));
    return jokes.some(function(joke){return joke.id===hash;})?hash:(jokes[0]?jokes[0].id:'');
  }

  if(elements.refresh){elements.refresh.addEventListener('click',function(){location.reload();});}
  elements.search.addEventListener('input',function(){query=this.value;renderAll();});
  elements.category.addEventListener('change',function(){category=this.value;renderAll();});
  elements.jump.addEventListener('change',function(){selectStory(this.value,true);});
  elements.random.addEventListener('click',randomStory);
  elements.clear.addEventListener('click',function(){
    query='';category='';unreadOnly=false;
    elements.search.value='';elements.category.value='';elements.unreadOnly.checked=false;
    renderAll();
    elements.liveStatus.textContent='絞り込みを解除しました。';
  });
  elements.unreadOnly.addEventListener('change',function(){unreadOnly=this.checked;renderAll();});
  elements.readButton.addEventListener('click',toggleRead);
  elements.previous.addEventListener('click',function(){move(-1);});
  elements.next.addEventListener('click',function(){move(1);});
  elements.englishToggle.addEventListener('click',function(){
    englishVisible=!englishVisible;
    saveEnglish();
    renderStory(getFiltered());
  });
  window.addEventListener('hashchange',function(){
    var id=initialId();
    if(id&&id!==currentId){currentId=id;renderAll();}
  });
  document.addEventListener('keydown',function(event){
    var tag=(document.activeElement&&document.activeElement.tagName)||'';
    if(['INPUT','SELECT','TEXTAREA','BUTTON'].indexOf(tag)!==-1){return;}
    if(event.key==='ArrowLeft'){move(-1);}
    if(event.key==='ArrowRight'){move(1);}
  });

  populateCategories();
  currentId=initialId();
  renderAll();
})();
