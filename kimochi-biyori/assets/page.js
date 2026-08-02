(() => {
  'use strict';
  const stories = Array.isArray(window.KIMOCHI_BIYORI_STORIES) ? window.KIMOCHI_BIYORI_STORIES : [];
  const LANG_KEY = 'mb_kimochi_biyori_language_v1';
  const FONT_KEY = 'mb_kimochi_biyori_font_v1';
  const READ_KEY = 'mb_kimochi_biyori_read_v1';
  const INDEX_KEY = 'mb_kimochi_biyori_index_v1';
  const copy = {
    ja:{title:'気持ち日和',subtitle:'今日の気持ちが、少し軽くなる物語',count:'全30話',language:'言語',font:'文字サイズ',jump:'話を選ぶ',index:'全30話',read:'読了にする',readDone:'読了済み',previous:'前の話',next:'次の話',status:'表示を変更しました'},
    en:{title:'A Brighter Day',subtitle:'Stories to Make You Feel a Little Lighter Today',count:'All 30 stories',language:'Language',font:'Text size',jump:'Choose a story',index:'All 30 stories',read:'Mark as read',readDone:'Read',previous:'Previous',next:'Next',status:'Display updated'},
    zh:{title:'心情放晴',subtitle:'让今天的心情轻一点的故事',count:'全部30篇',language:'语言',font:'文字大小',jump:'选择故事',index:'全部30篇',read:'标为已读',readDone:'已读',previous:'上一篇',next:'下一篇',status:'显示已更新'}
  };
  const fontSizes={small:'16px',normal:'18px',large:'20px',xlarge:'22px'};
  const el={
    seriesTitle:document.getElementById('seriesTitle'),seriesSubtitle:document.getElementById('seriesSubtitle'),storyCountLabel:document.getElementById('storyCountLabel'),languageLabel:document.getElementById('languageLabel'),fontLabel:document.getElementById('fontLabel'),jumpLabel:document.getElementById('jumpLabel'),storyIndexTitle:document.getElementById('storyIndexTitle'),storySelect:document.getElementById('storySelect'),storyList:document.getElementById('storyList'),storyNumber:document.getElementById('storyNumber'),storyLocation:document.getElementById('storyLocation'),storyTitle:document.getElementById('storyTitle'),storyBody:document.getElementById('storyBody'),readButton:document.getElementById('readButton'),readProgress:document.getElementById('readProgress'),previousButton:document.getElementById('previousButton'),nextButton:document.getElementById('nextButton'),previousLabel:document.getElementById('previousLabel'),nextLabel:document.getElementById('nextLabel'),storyPosition:document.getElementById('storyPosition'),liveStatus:document.getElementById('liveStatus'),refresh:document.getElementById('pageRefreshButton')
  };
  let lang = localStorage.getItem(LANG_KEY) || 'ja';
  if(!copy[lang]) lang='ja';
  let font = localStorage.getItem(FONT_KEY) || 'normal';
  if(!fontSizes[font]) font='normal';
  let index = Math.min(Math.max(Number(localStorage.getItem(INDEX_KEY)) || 0,0),Math.max(0,stories.length-1));
  let readSet = new Set();
  try { readSet = new Set(JSON.parse(localStorage.getItem(READ_KEY)||'[]').map(Number)); } catch (_) {}

  function t(){return copy[lang]||copy.ja;}
  function storyText(story){return story?.[lang] || story?.ja || {title:'',location:'',body:''};}
  function escapeText(value){return String(value??'');}
  function saveRead(){localStorage.setItem(READ_KEY,JSON.stringify([...readSet].sort((a,b)=>a-b)));}
  function announce(message){el.liveStatus.textContent=message; window.clearTimeout(announce.timer); announce.timer=window.setTimeout(()=>{el.liveStatus.textContent='';},1800);}
  function applyFont(){document.documentElement.style.setProperty('--kb-reader-size',fontSizes[font]);document.querySelectorAll('#fontSwitch button').forEach(btn=>btn.classList.toggle('active',btn.dataset.font===font));}
  function renderStatic(){
    const c=t(); document.documentElement.lang=lang==='zh'?'zh-CN':lang;
    document.title=`${c.title}｜MARKET BASE`; el.seriesTitle.textContent=c.title; el.seriesSubtitle.textContent=c.subtitle; el.storyCountLabel.textContent=c.count; el.languageLabel.textContent=c.language; el.fontLabel.textContent=c.font; el.jumpLabel.textContent=c.jump; el.storyIndexTitle.textContent=c.index; el.previousLabel.textContent=c.previous; el.nextLabel.textContent=c.next;
    document.querySelectorAll('#languageSwitch button').forEach(btn=>btn.classList.toggle('active',btn.dataset.lang===lang));
  }
  function renderSelect(){
    el.storySelect.replaceChildren(); stories.forEach((story,i)=>{const text=storyText(story);const option=document.createElement('option');option.value=String(i);option.textContent=`${String(story.id).padStart(2,'0')}　${text.title}`;el.storySelect.appendChild(option);});el.storySelect.value=String(index);
  }
  function renderList(){
    el.storyList.replaceChildren(); stories.forEach((story,i)=>{const text=storyText(story);const button=document.createElement('button');button.type='button';button.className='kb-story-item';button.classList.toggle('active',i===index);button.dataset.index=String(i);button.innerHTML=`<span class="no">${String(story.id).padStart(2,'0')}</span><span><b></b><small></small></span><span class="check">${readSet.has(story.id)?'✓':''}</span>`;button.querySelector('b').textContent=text.title;button.querySelector('small').textContent=text.location;button.addEventListener('click',()=>setIndex(i,true));el.storyList.appendChild(button);});
    el.readProgress.textContent=`${readSet.size} / ${stories.length}`;
  }
  function renderStory(scroll=false){
    const story=stories[index]; if(!story)return; const text=storyText(story); const c=t();
    el.storyNumber.textContent=String(story.id).padStart(2,'0');el.storyLocation.textContent=text.location;el.storyTitle.textContent=text.title;el.storyBody.replaceChildren();
    escapeText(text.body).split(/\n\s*\n/).filter(Boolean).forEach(paragraph=>{const p=document.createElement('p');p.textContent=paragraph;el.storyBody.appendChild(p);});
    const read=readSet.has(story.id);el.readButton.setAttribute('aria-pressed',String(read));el.readButton.textContent=read?c.readDone:c.read;el.storyPosition.textContent=`${index+1} / ${stories.length}`;el.previousButton.disabled=index===0;el.nextButton.disabled=index===stories.length-1;el.storySelect.value=String(index);localStorage.setItem(INDEX_KEY,String(index));
    renderList(); if(scroll)document.getElementById('reader').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function setIndex(next,scroll=false){index=Math.min(Math.max(next,0),stories.length-1);renderStory(scroll);}
  function renderAll(){renderStatic();applyFont();renderSelect();renderStory(false);}
  document.getElementById('languageSwitch').addEventListener('click',event=>{const btn=event.target.closest('button[data-lang]');if(!btn)return;lang=btn.dataset.lang;localStorage.setItem(LANG_KEY,lang);renderAll();announce(t().status);});
  document.getElementById('fontSwitch').addEventListener('click',event=>{const btn=event.target.closest('button[data-font]');if(!btn)return;font=btn.dataset.font;localStorage.setItem(FONT_KEY,font);applyFont();announce(t().status);});
  el.storySelect.addEventListener('change',()=>setIndex(Number(el.storySelect.value),true));el.previousButton.addEventListener('click',()=>setIndex(index-1,true));el.nextButton.addEventListener('click',()=>setIndex(index+1,true));
  el.readButton.addEventListener('click',()=>{const story=stories[index];if(!story)return;if(readSet.has(story.id))readSet.delete(story.id);else readSet.add(story.id);saveRead();renderStory(false);});
  el.refresh.addEventListener('click',()=>window.location.reload());
  renderAll();
})();
