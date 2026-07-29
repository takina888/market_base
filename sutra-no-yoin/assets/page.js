(function(){
  'use strict';
  var stories=[];
  var currentIndex=0;
  var READ_STORAGE_KEY='sutraReadStoriesV301';
  var readStories=[];
  var bodySize=16;
  var numberNames=['零','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','二十一','二十二','二十三','二十四','二十五','二十六','二十七','二十八','二十九','三十','三十一','三十二','三十三','三十四','三十五','三十六','三十七','三十八','三十九','四十','四十一','四十二','四十三','四十四','四十五','四十六','四十七','四十八','四十九','五十'];
  var el={
    position:document.getElementById('storyPosition'),bar:document.getElementById('storyProgressBar'),number:document.getElementById('storyNumber'),title:document.getElementById('storyTitle'),body:document.getElementById('storyBody'),closing:document.getElementById('storyClosing'),previous:document.getElementById('previousStory'),next:document.getElementById('nextStory'),random:document.getElementById('randomStory'),openList:document.getElementById('openList'),closeList:document.getElementById('closeList'),panel:document.getElementById('storyListPanel'),list:document.getElementById('storyList'),search:document.getElementById('storySearch'),empty:document.getElementById('storyEmpty'),fontDecrease:document.getElementById('fontDecrease'),fontIncrease:document.getElementById('fontIncrease'),refresh:document.getElementById('pageRefreshButton')
  };
  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}

  function loadReadStories(){
    try{
      var saved=JSON.parse(localStorage.getItem(READ_STORAGE_KEY)||'[]');
      if(Array.isArray(saved))return saved.map(function(value){return Number(value);}).filter(function(value){return Number.isFinite(value);});
    }catch(error){}
    return [];
  }
  function saveReadStories(){try{localStorage.setItem(READ_STORAGE_KEY,JSON.stringify(readStories));}catch(error){}}
  function isRead(number){return readStories.indexOf(Number(number))>=0;}
  function markRead(number){number=Number(number);if(isRead(number))return false;readStories.push(number);saveReadStories();return true;}
  function paragraphHtml(text){return text.split(/\n\s*\n/).map(function(p){return '<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>';}).join('');}
  function updateUrl(){var url=new URL(location.href);url.searchParams.set('story',stories[currentIndex].number);history.replaceState(null,'',url);}
  function renderStory(shouldFocus){
    if(!stories.length)return;
    var story=stories[currentIndex];
    markRead(story.number);
    el.position.textContent=story.number+' / '+stories.length+' ・ 読了 '+readStories.length+'話';
    el.bar.style.width=((story.number/stories.length)*100)+'%';
    el.number.textContent='第'+(numberNames[story.number]||story.number)+'話';
    el.title.textContent=story.title;
    el.body.innerHTML=paragraphHtml(story.body);
    el.closing.textContent=story.closing;
    el.previous.disabled=currentIndex===0;
    el.next.disabled=currentIndex===stories.length-1;
    document.querySelectorAll('.sutra-list-button').forEach(function(btn){btn.classList.toggle('active',Number(btn.dataset.index)===currentIndex);btn.setAttribute('aria-current',Number(btn.dataset.index)===currentIndex?'true':'false');});
    localStorage.setItem('sutraCurrentStory',String(story.number));
    updateUrl();
    if(shouldFocus){el.title.setAttribute('tabindex','-1');el.title.focus({preventScroll:true});document.querySelector('.sutra-reader').scrollIntoView({behavior:'smooth',block:'start'});}
  }
  function renderList(filter){
    var q=(filter||'').trim().toLowerCase();
    var html='';var shown=0;
    stories.forEach(function(story,index){
      if(q && story.title.toLowerCase().indexOf(q)===-1 && story.body.toLowerCase().indexOf(q)===-1)return;
      shown++;
      html+='<button type="button" class="sutra-list-button'+(index===currentIndex?' active':'')+'" data-index="'+index+'"><span class="sutra-list-number">'+String(story.number).padStart(2,'0')+'</span><span class="sutra-list-title">'+escapeHtml(story.title)+'</span>'+ (isRead(story.number)?'<span class="sutra-read-badge">読了</span>':'') +'</button>';
    });
    el.list.innerHTML=html;
    el.empty.hidden=shown!==0;
    el.list.querySelectorAll('button').forEach(function(btn){btn.addEventListener('click',function(){currentIndex=Number(btn.dataset.index);renderStory(true);closeList();});});
  }
  function openList(){el.panel.hidden=false;el.openList.setAttribute('aria-expanded','true');renderList(el.search.value);el.panel.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(function(){el.search.focus();},200);}
  function closeList(){el.panel.hidden=true;el.openList.setAttribute('aria-expanded','false');el.openList.focus();}
  function changeStory(delta){var next=currentIndex+delta;if(next<0||next>=stories.length)return;currentIndex=next;renderStory(true);}
  function setFontSize(size){bodySize=Math.max(15,Math.min(21,size));document.documentElement.style.setProperty('--sutra-body-size',bodySize+'px');localStorage.setItem('sutraBodySize',String(bodySize));}
  fetch('assets/stories.json').then(function(res){if(!res.ok)throw new Error('stories.json');return res.json();}).then(function(data){
    stories=data;
    readStories=loadReadStories();
    var params=new URLSearchParams(location.search);var requested=Number(params.get('story'));var saved=Number(localStorage.getItem('sutraCurrentStory'));
    var initial=requested||saved||1;currentIndex=Math.max(0,Math.min(stories.length-1,initial-1));
    var savedSize=Number(localStorage.getItem('sutraBodySize'));if(savedSize)setFontSize(savedSize);
    renderList('');renderStory(false);
  }).catch(function(){el.body.innerHTML='<p>読み物データを読み込めませんでした。ページを更新してください。</p>';});
  el.previous.addEventListener('click',function(){changeStory(-1);});
  el.next.addEventListener('click',function(){changeStory(1);});
  el.random.addEventListener('click',function(){if(stories.length<2)return;var next=currentIndex;while(next===currentIndex){next=Math.floor(Math.random()*stories.length);}currentIndex=next;renderStory(true);});
  el.openList.addEventListener('click',function(){if(el.panel.hidden)openList();else closeList();});
  el.closeList.addEventListener('click',closeList);
  el.search.addEventListener('input',function(){renderList(el.search.value);});
  el.fontDecrease.addEventListener('click',function(){setFontSize(bodySize-1);});
  el.fontIncrease.addEventListener('click',function(){setFontSize(bodySize+1);});
  el.refresh.addEventListener('click',function(){location.reload();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!el.panel.hidden)closeList();if(e.target===document.body||e.target===el.title){if(e.key==='ArrowLeft')changeStory(-1);if(e.key==='ArrowRight')changeStory(1);}});
})();
