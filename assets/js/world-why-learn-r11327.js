(function(){
  'use strict';
  const section=document.getElementById('worldWhyLearning');
  if(!section)return;
  const dataset=window.MARKET_BASE_WORLD_WHY_QA;
  const list=document.getElementById('worldWhyList');
  const search=document.getElementById('worldWhySearch');
  const category=document.getElementById('worldWhyCategory');
  const count=document.getElementById('worldWhyCount');
  const empty=document.getElementById('worldWhyEmpty');
  if(!dataset||!Array.isArray(dataset.items)){
    list.textContent='データを読み込めませんでした。';
    return;
  }

  dataset.categories.forEach(function(item){
    const option=document.createElement('option');
    option.value=item.name;
    option.textContent=item.name+'（'+item.count+'問）';
    category.appendChild(option);
  });

  const normalize=function(value){return String(value||'').toLocaleLowerCase('ja-JP').replace(/\s+/g,' ')};
  let timer=0;

  function createItem(item){
    const details=document.createElement('details');
    details.className='world-why-item';
    details.dataset.qaId=item.id;

    const summary=document.createElement('summary');
    summary.textContent=item.question;
    details.appendChild(summary);

    const answer=document.createElement('div');
    answer.className='world-why-answer';
    const paragraph=document.createElement('p');
    paragraph.textContent=item.answer;
    answer.appendChild(paragraph);

    const meta=document.createElement('div');
    meta.className='world-why-answer-meta';
    [item.category,item.subcategory,item.id].filter(Boolean).forEach(function(text){
      const chip=document.createElement('span');
      chip.textContent=text;
      meta.appendChild(chip);
    });
    answer.appendChild(meta);

    if(Array.isArray(item.sources)&&item.sources.length){
      const sources=document.createElement('nav');
      sources.className='world-why-sources';
      sources.setAttribute('aria-label','出典');
      item.sources.forEach(function(url,index){
        const link=document.createElement('a');
        link.href=url;
        link.target='_blank';
        link.rel='noopener noreferrer';
        link.textContent='出典'+(index+1)+' ↗';
        sources.appendChild(link);
      });
      answer.appendChild(sources);
    }

    details.appendChild(answer);
    return details;
  }

  function render(){
    const query=normalize(search.value);
    const selected=category.value;
    const filtered=dataset.items.filter(function(item){
      if(selected&&item.category!==selected)return false;
      if(!query)return true;
      return normalize(item.question+' '+item.answer+' '+item.category+' '+item.subcategory).includes(query);
    });
    const fragment=document.createDocumentFragment();
    filtered.forEach(function(item){fragment.appendChild(createItem(item))});
    list.replaceChildren(fragment);
    count.textContent=filtered.length+'問';
    empty.hidden=filtered.length!==0;
  }

  search.addEventListener('input',function(){
    window.clearTimeout(timer);
    timer=window.setTimeout(render,120);
  });
  category.addEventListener('change',render);
  render();
})();
