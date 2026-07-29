(function(){
  'use strict';
  var DATA=window.MARKET_BASE_WORLD_HISTORY;
  if(!DATA||!DATA.days||!DATA.articles)return;

  var dayOrder=DATA.dayOrder||Object.keys(DATA.days);
  var articleList=Object.keys(DATA.articles).map(function(id){return DATA.articles[id];});
  var dayIndex={};
  dayOrder.forEach(function(key,index){dayIndex[key]=index;});
  var storageKey='market_base_world_history_selected_date_v028';

  function text(value){return value==null?'':String(value);}
  function el(tag,className,content){
    var node=document.createElement(tag);
    if(className)node.className=className;
    if(content!=null)node.textContent=content;
    return node;
  }
  function append(parent){
    for(var i=1;i<arguments.length;i++)if(arguments[i])parent.appendChild(arguments[i]);
    return parent;
  }
  function monthDayLabel(key){
    var p=key.split('-');
    return Number(p[0])+'/'+Number(p[1]);
  }
  function currentKey(){
    var d=new Date();
    var key=String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    if(DATA.days[key])return key;
    return key==='02-29'?'02-28':dayOrder[0];
  }
  function validKey(key){return key&&DATA.days[key]?key:null;}
  function offsetKey(key,offset){
    var i=dayIndex[key];
    if(i==null)i=0;
    return dayOrder[(i+offset+dayOrder.length)%dayOrder.length];
  }
  var THEME_GROUPS=['政治・国家','戦争・紛争','独立・植民地','人権・社会','外交・平和','科学・宇宙','技術・産業','医学・公衆衛生','文化・芸術','スポーツ','探検・交通','災害・環境','宗教・思想','経済・貿易','人物','その他'];
  var REGION_GROUPS=['東アジア','東南アジア','南アジア','中央アジア','中東・西アジア','ヨーロッパ','北米','中南米・カリブ','アフリカ','オセアニア','極地・海洋','宇宙','世界・複数地域','その他'];
  function themeGroup(article){
    var c=[article.category,(article.tags||[]).join(' ')].join(' ');
    if(article.slot==='人物'||/^人物/.test(article.category||''))return '人物';
    if(/宇宙|天文|科学|物理|化学|数学|発見|研究/.test(c))return '科学・宇宙';
    if(/医学|医療|公衆衛生|病院|ワクチン|感染症|生殖|薬学/.test(c))return '医学・公衆衛生';
    if(/人権|女性|公民権|差別|奴隷|先住民|障害|社会運動|LGBTQ|労働運動|包摂/.test(c))return '人権・社会';
    if(/独立|植民地|脱植民地|建国|主権回復/.test(c))return '独立・植民地';
    if(/戦争|紛争|内戦|侵攻|侵略|軍事|戦闘|テロ|虐殺|ホロコースト|占領|抵抗/.test(c))return '戦争・紛争';
    if(/外交|平和|停戦|休戦|条約|国際機関|国際連合|安全保障/.test(c))return '外交・平和';
    if(/政治|革命|王政|共和|憲法|選挙|議会|政権|国家|法制度|裁判/.test(c))return '政治・国家';
    if(/文化|芸術|音楽|文学|映画|テレビ|写真|デザイン|建築|演劇|出版|メディア|アニメ|ゲーム/.test(c))return '文化・芸術';
    if(/スポーツ|オリンピック|サッカー|野球|競技|ボクシング|チェス/.test(c))return 'スポーツ';
    if(/技術|産業|企業|コンピュー|インターネット|通信|エネルギー|原子力|発明|工業/.test(c))return '技術・産業';
    if(/探検|航海|航空|交通|鉄道|自動車|船|飛行|登山|旅行/.test(c))return '探検・交通';
    if(/災害|地震|火山|気象|環境|自然|台風|ハリケーン|洪水|飢饉/.test(c))return '災害・環境';
    if(/宗教|思想|哲学|信仰|教会|仏教|イスラム|キリスト/.test(c))return '宗教・思想';
    if(/経済|貿易|金融|通貨|市場|国有化|税|企業史/.test(c))return '経済・貿易';
    return 'その他';
  }
  function regionGroup(article){
    var r=[article.region,article.countries].join(' ');
    if(/宇宙|月|火星|金星|土星|小惑星/.test(r))return '宇宙';
    if(/東南アジア/.test(r))return '東南アジア';
    if(/東アジア|北東アジア/.test(r))return '東アジア';
    if(/南アジア/.test(r))return '南アジア';
    if(/中央アジア/.test(r))return '中央アジア';
    if(/中東|西アジア|ペルシャ湾/.test(r))return '中東・西アジア';
    if(/ヨーロッパ|欧州|北欧|バルカン/.test(r))return 'ヨーロッパ';
    if(/北米/.test(r))return '北米';
    if(/中南米|南米|中米|中央アメリカ|カリブ|ラテン/.test(r))return '中南米・カリブ';
    if(/アフリカ/.test(r))return 'アフリカ';
    if(/オセアニア|太平洋/.test(r))return 'オセアニア';
    if(/南極|北極|海洋|大西洋|インド洋|地中海|黒海/.test(r))return '極地・海洋';
    if(/世界|国際社会|ユーラシア/.test(r)||/／/.test(article.region||''))return '世界・複数地域';
    return 'その他';
  }
  function articleByAnchor(anchor){
    if(!anchor)return null;
    var raw=anchor.replace(/^#/,'');
    for(var i=0;i<articleList.length;i++){
      if(articleList[i].anchor===raw||articleList[i].id.toLowerCase()===raw)return articleList[i];
    }
    return null;
  }
  function paragraphNodes(value){
    var frag=document.createDocumentFragment();
    text(value).split(/\n\s*\n/).filter(Boolean).forEach(function(part){
      var p=el('p','',part.trim());
      frag.appendChild(p);
    });
    return frag;
  }
  function commonsFileName(photo){
    var page=text(photo&&photo.pageUrl);
    var image=text(photo&&photo.imageUrl);
    var raw='';
    var i=page.indexOf('File:');
    if(i!==-1)raw=page.slice(i+5);
    if(!raw){
      var marker='/file/';
      i=image.indexOf(marker);
      if(i!==-1)raw=image.slice(i+marker.length).split('?')[0];
    }
    if(!raw)return '';
    try{raw=decodeURIComponent(raw);}catch(_){ }
    return raw.replace(/ /g,'_');
  }
  function photoCandidates(photo){
    var candidates=[];
    var fileName=commonsFileName(photo);
    if(fileName){
      var encoded=encodeURIComponent(fileName);
      candidates.push('https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/'+encoded+'&width=1600');
      candidates.push('https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/'+encoded);
    }
    if(photo&&photo.imageUrl)candidates.push(photo.imageUrl);
    return candidates.filter(function(url,index,list){return url&&list.indexOf(url)===index;});
  }
  function photoNode(article,loading){
    var wrap=el('div','history-photo');
    var photo=article.photo||{};
    var candidates=photoCandidates(photo);
    if(candidates.length){
      var img=document.createElement('img');
      var current=0;
      img.alt=article.title+'に関する写真';
      img.decoding='async';
      img.loading='eager';
      img.fetchPriority='high';
      img.referrerPolicy='no-referrer';
      img.addEventListener('error',function(){
        current+=1;
        if(current<candidates.length){
          img.src=candidates[current];
          return;
        }
        wrap.replaceChildren(photoPlaceholder(article));
      });
      img.src=candidates[current];
      wrap.appendChild(img);
    }else{
      wrap.appendChild(photoPlaceholder(article));
    }
    return wrap;
  }
  function photoPlaceholder(article){
    var box=el('div','history-photo-placeholder');
    box.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="7" y="11" width="50" height="42" rx="6"></rect><circle cx="23" cy="26" r="5"></circle><path d="m12 47 13-13 9 8 7-7 11 12"></path></svg>';
    box.appendChild(el('strong','', '写真準備中'));
    var subject=article.photo&&article.photo.subject?article.photo.subject:'この記事に合う歴史資料・写真を確認しています。';
    box.appendChild(el('small','',subject));
    return box;
  }
  function metaNode(article,includeDate){
    var meta=el('div',includeDate?'history-main-meta':'history-detail-meta');
    if(includeDate)meta.appendChild(el('span','history-meta-chip is-date',monthDayLabel(article.date)));
    if(article.year)meta.appendChild(el('span','history-meta-chip',article.year+'年'));
    if(article.slot)meta.appendChild(el('span','history-meta-chip',article.slot));
    if(article.region)meta.appendChild(el('span','history-meta-chip',article.region));
    if(article.countries)meta.appendChild(el('span','history-meta-chip',article.countries));
    if(article.category)meta.appendChild(el('span','history-meta-chip',article.category));
    return meta;
  }
  function sourceDetails(article){
    var ids=article.sourceIds||[];
    if(!ids.length)return null;
    var details=el('details','history-disclosure');
    details.appendChild(el('summary','', '出典を見る'));
    var body=el('div','history-disclosure-body');
    ids.forEach(function(id){
      var src=DATA.sources[id];
      if(!src)return;
      var node;
      if(src.url){
        node=el('a','history-source-link');
        node.href=src.url;
        node.target='_blank';
        node.rel='noopener noreferrer';
      }else node=el('div','history-source-link');
      node.appendChild(el('span','',src.title||src.organization||id));
      var sub=[src.organization,src.type].filter(Boolean).join('｜');
      if(sub)node.appendChild(el('small','',sub));
      body.appendChild(node);
    });
    if(!body.children.length)return null;
    details.appendChild(body);
    return details;
  }
  function photoCreditDetails(article){
    var p=article.photo||{};
    if(!p.imageUrl||!(p.credit||p.author||p.license||p.pageUrl))return null;
    var details=el('details','history-disclosure');
    details.appendChild(el('summary','', '写真クレジット・ライセンス'));
    var body=el('div','history-disclosure-body');
    if(p.credit)body.appendChild(el('div','history-source-link',p.credit));
    else if(p.author)body.appendChild(el('div','history-source-link','撮影・制作：'+p.author));
    if(p.pageUrl){
      var link=el('a','history-source-link','写真の出典ページを見る');
      link.href=p.pageUrl;link.target='_blank';link.rel='noopener noreferrer';body.appendChild(link);
    }
    if(p.license){
      if(p.licenseUrl){
        var lic=el('a','history-source-link','ライセンス：'+p.license);
        lic.href=p.licenseUrl;lic.target='_blank';lic.rel='noopener noreferrer';body.appendChild(lic);
      }else body.appendChild(el('div','history-source-link','ライセンス：'+p.license));
    }
    details.appendChild(body);
    return details;
  }
  function articleCopy(article,headingTag,withPhoto){
    var copy=el('div',headingTag==='h2'?'history-detail-copy':'history-main-copy');
    copy.appendChild(el(headingTag,'',article.title));
    if(article.subtitle)copy.appendChild(el('p','history-subtitle',article.subtitle));
    if(withPhoto)copy.appendChild(photoNode(article,headingTag==='h2'?'lazy':null));

    var explanation=el('div','history-explanation-disclosure is-always-open');
    var explanationBody=el('div','history-explanation-body');
    if(article.intro)explanationBody.appendChild(el('p','history-intro',article.intro));
    var body=el('div','history-body');
    body.appendChild(paragraphNodes(article.body));
    explanationBody.appendChild(body);
    if(article.significance){
      var sig=el('aside','history-significance');
      sig.appendChild(el('strong','', '歴史的意味'));
      sig.appendChild(el('p','',article.significance));
      explanationBody.appendChild(sig);
    }
    if(article.people){
      var people=el('p','history-people');
      people.appendChild(el('strong','', '関連人物：'));
      people.appendChild(document.createTextNode(article.people));
      explanationBody.appendChild(people);
    }
    var src=sourceDetails(article);if(src)explanationBody.appendChild(src);
    var credit=photoCreditDetails(article);if(credit)explanationBody.appendChild(credit);
    explanation.appendChild(explanationBody);
    copy.appendChild(explanation);
    return copy;
  }
  function fullDateLabel(key){
    var p=key.split('-');
    return Number(p[0])+'月'+Number(p[1])+'日';
  }
  function relativeDateLabel(key){
    var today=currentKey();
    if(key===today)return '今日';
    if(key===offsetKey(today,-1))return '昨日';
    if(key===offsetKey(today,1))return '明日';
    return '選択日';
  }
  function dateAxis(selectedKey,onSelect,isBottom){
    var nav=el('nav','history-date-axis'+(isBottom?' is-bottom':' is-top'));
    nav.setAttribute('aria-label',isBottom?'下側の日付切替':'上側の日付切替');
    var prevKey=offsetKey(selectedKey,-1);
    var nextKey=offsetKey(selectedKey,1);
    var prev=el('button','history-date-step is-prev');
    prev.type='button';
    prev.setAttribute('aria-label',fullDateLabel(prevKey)+'へ移動');
    prev.innerHTML='<span aria-hidden="true">←</span><strong>前日</strong><small>'+monthDayLabel(prevKey)+'</small>';
    prev.addEventListener('click',function(){onSelect(prevKey,!!isBottom);});
    var current=el('div','history-date-current');
    current.setAttribute('aria-live','polite');
    current.appendChild(el('small','',relativeDateLabel(selectedKey)));
    current.appendChild(el('strong','',fullDateLabel(selectedKey)));
    current.appendChild(el('span','', '左右で切替'));
    var next=el('button','history-date-step is-next');
    next.type='button';
    next.setAttribute('aria-label',fullDateLabel(nextKey)+'へ移動');
    next.innerHTML='<strong>翌日</strong><small>'+monthDayLabel(nextKey)+'</small><span aria-hidden="true">→</span>';
    next.addEventListener('click',function(){onSelect(nextKey,!!isBottom);});
    append(nav,prev,current,next);
    return nav;
  }
  function articleAxis(index,count,onMove,isBottom){
    var nav=el('nav','history-article-axis'+(isBottom?' is-bottom':' is-top'));
    nav.setAttribute('aria-label',isBottom?'下側の記事切替':'上側の記事切替');
    var up=el('button','history-article-step is-up');
    up.type='button';up.disabled=index<=0;
    up.setAttribute('aria-label','同じ日の前の記事へ');
    up.innerHTML='<span aria-hidden="true">↑</span><strong>前の記事</strong>';
    up.addEventListener('click',function(){onMove(index-1,!!isBottom);});
    var status=el('div','history-article-position');
    status.setAttribute('aria-live','polite');
    status.appendChild(el('small','', '同じ日の5記事'));
    status.appendChild(el('strong','',(index+1)+' / '+count));
    status.appendChild(el('span','', '上下で切替'));
    var down=el('button','history-article-step is-down');
    down.type='button';down.disabled=index>=count-1;
    down.setAttribute('aria-label','同じ日の次の記事へ');
    down.innerHTML='<strong>次の記事</strong><span aria-hidden="true">↓</span>';
    down.addEventListener('click',function(){onMove(index+1,!!isBottom);});
    append(nav,up,status,down);
    return nav;
  }
  function mainArticleNode(article,headingTag,standalone){
    var wrap=el('article','history-main-article');
    wrap.id=standalone?article.anchor:'historyLearnMainArticle';
    wrap.dataset.historyRecord=article.id;
    wrap.dataset.historyAnchor=article.anchor;
    wrap.appendChild(metaNode(article,true));
    wrap.appendChild(articleCopy(article,headingTag||'h5',true));
    return wrap;
  }
  function articleShortList(day,index,onSelect){
    var block=el('section','history-article-list-block');
    var head=el('div','history-article-list-head');
    head.appendChild(el('h5','', 'この日の5記事'));
    head.appendChild(el('span','', '見たい記事を直接選べます'));
    block.appendChild(head);
    var list=el('div','history-article-list');
    day.articleIds.forEach(function(id,i){
      var article=DATA.articles[id];
      var b=el('button','history-article-list-button'+(i===index?' is-selected':''));
      b.type='button';
      b.setAttribute('aria-pressed',i===index?'true':'false');
      b.setAttribute('aria-label',(i+1)+'番目、'+article.title+'を表示');
      b.appendChild(el('span','history-article-list-number',String(i+1).padStart(2,'0')));
      var copy=el('span','history-article-list-copy');
      copy.appendChild(el('small','',article.slot||'記事'));
      copy.appendChild(el('strong','',article.title));
      b.appendChild(copy);
      b.addEventListener('click',function(){onSelect(i,true);});
      list.appendChild(b);
    });
    block.appendChild(list);
    return block;
  }
  function scrollArticleIntoView(id){
    setTimeout(function(){
      var target=document.getElementById(id);
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    },0);
  }

  function initLearn(){
    var mount=document.getElementById('historyLearningMount');
    if(!mount)return;
    var selectedKey=validKey(new URLSearchParams(location.search).get('historyDate'));
    if(!selectedKey){try{selectedKey=validKey(sessionStorage.getItem(storageKey));}catch(_){}}
    if(!selectedKey)selectedKey=currentKey();
    var selectedIndex=0;
    var initial=articleByAnchor(location.hash);
    if(initial){
      selectedKey=initial.date;
      selectedIndex=Math.max(0,DATA.days[selectedKey].articleIds.indexOf(initial.id));
    }
    function remember(){
      try{
        sessionStorage.setItem(storageKey,selectedKey);
        sessionStorage.setItem(storageKey+'_article',String(selectedIndex));
      }catch(_){}
    }
    function render(scrollBack){
      var day=DATA.days[selectedKey];
      selectedIndex=Math.max(0,Math.min(day.articleIds.length-1,selectedIndex));
      var article=DATA.articles[day.articleIds[selectedIndex]];
      mount.replaceChildren();
      var section=el('section','history-learning');
      section.id='historyLearning';section.setAttribute('aria-labelledby','historyLearnTitle');
      var head=el('header','history-section-head');
      var headCopy=el('div','');
      headCopy.appendChild(el('p','history-kicker','WORLD HISTORY TODAY'));
      var h=el('h4','', '歴史を学ぶ');h.id='historyLearnTitle';headCopy.appendChild(h);
      headCopy.appendChild(el('p','', '左右で日付を切り替え、上下で同じ日の5記事を1本ずつ全文で読めます。'));
      head.appendChild(headCopy);section.appendChild(head);
      section.appendChild(dateAxis(selectedKey,selectDate,false));
      section.appendChild(articleAxis(selectedIndex,day.articleIds.length,selectArticle,false));
      section.appendChild(mainArticleNode(article,'h5',false));
      section.appendChild(articleAxis(selectedIndex,day.articleIds.length,selectArticle,true));
      section.appendChild(articleShortList(day,selectedIndex,selectArticle));
      section.appendChild(dateAxis(selectedKey,selectDate,true));
      var actions=el('div','history-more-actions');
      var full=el('a','history-more-action is-primary','歴史専用ページで読む');
      full.href='world-history-today.html?date='+selectedKey+'#'+article.anchor;
      var byDate=el('a','history-more-action','日付から探す');byDate.href='world-history-today.html?mode=date&date='+selectedKey;
      var byTheme=el('a','history-more-action','テーマ・人物から探す');byTheme.href='world-history-today.html?mode=search&date='+selectedKey;
      append(actions,full,byDate,byTheme);section.appendChild(actions);
      mount.appendChild(section);
      remember();
      if(scrollBack)scrollArticleIntoView('historyLearnMainArticle');
    }
    function selectDate(key,fromBottom){
      selectedKey=key;selectedIndex=0;render(!!fromBottom);
    }
    function selectArticle(index,scrollBack){
      var count=DATA.days[selectedKey].articleIds.length;
      if(index<0||index>=count)return;
      selectedIndex=index;render(!!scrollBack);
    }
    render(false);
    if(location.hash==='#historyLearning'||initial){
      var learnButton=document.querySelector('[data-view="learn"]');
      if(learnButton&&document.getElementById('learn')&&!document.getElementById('learn').classList.contains('active'))learnButton.click();
      setTimeout(function(){var section=document.getElementById('historyLearning');if(section)section.scrollIntoView({block:'start'});},0);
    }
  }

  function initStandalone(){
    var mount=document.getElementById('historyStandaloneMount')||document.getElementById('historyDayArticles');
    if(!mount)return;
    var params=new URLSearchParams(location.search);
    var selectedKey=validKey(params.get('date'))||currentKey();
    var selectedIndex=0;
    var initial=articleByAnchor(location.hash);
    if(initial){
      selectedKey=initial.date;
      selectedIndex=Math.max(0,DATA.days[selectedKey].articleIds.indexOf(initial.id));
    }
    var dateInput=document.getElementById('historyDateInput');
    var searchInput=document.getElementById('historySearchInput');
    var categorySelect=document.getElementById('historyCategorySelect');
    var regionSelect=document.getElementById('historyRegionSelect');
    var results=document.getElementById('historySearchResults');
    var status=document.getElementById('historyResultsStatus');
    var dayTitle=document.getElementById('historySelectedDayTitle');
    var dayTheme=document.getElementById('historySelectedDayTheme');
    var dayArticles=document.getElementById('historyDayArticles');

    function fillSelect(select,values,label){
      select.replaceChildren();var opt=el('option','',label);opt.value='';select.appendChild(opt);
      values.forEach(function(v){var o=el('option','',v);o.value=v;select.appendChild(o);});
    }
    fillSelect(categorySelect,THEME_GROUPS,'すべてのテーマ');
    fillSelect(regionSelect,REGION_GROUPS,'すべての地域');

    function updateUrl(){
      var day=DATA.days[selectedKey];
      var article=DATA.articles[day.articleIds[selectedIndex]];
      var q=new URLSearchParams(location.search);q.set('date',selectedKey);q.delete('mode');
      try{history.replaceState({},'',location.pathname+'?'+q.toString()+'#'+article.anchor);}catch(_){ }
    }
    function renderDay(scrollBack){
      var day=DATA.days[selectedKey];
      selectedIndex=Math.max(0,Math.min(day.articleIds.length-1,selectedIndex));
      var article=DATA.articles[day.articleIds[selectedIndex]];
      dayTitle.textContent=fullDateLabel(selectedKey)+'の5記事';
      if(dayTheme)dayTheme.textContent='';
      dayArticles.replaceChildren();
      dayArticles.appendChild(dateAxis(selectedKey,selectDate,false));
      dayArticles.appendChild(articleAxis(selectedIndex,day.articleIds.length,selectArticle,false));
      dayArticles.appendChild(mainArticleNode(article,'h2',true));
      dayArticles.appendChild(articleAxis(selectedIndex,day.articleIds.length,selectArticle,true));
      dayArticles.appendChild(articleShortList(day,selectedIndex,selectArticle));
      dayArticles.appendChild(dateAxis(selectedKey,selectDate,true));
      dateInput.value='2025-'+selectedKey;
      updateUrl();
      try{sessionStorage.setItem(storageKey,selectedKey);}catch(_){ }
      if(scrollBack)scrollArticleIntoView(article.anchor);
    }
    function selectDate(key,scrollBack){selectedKey=key;selectedIndex=0;renderDay(!!scrollBack);}
    function selectArticle(index,scrollBack){
      var count=DATA.days[selectedKey].articleIds.length;
      if(index<0||index>=count)return;
      selectedIndex=index;renderDay(!!scrollBack);
    }
    function selectDateFromInput(){
      var v=dateInput.value;if(!v)return;var key=v.slice(5);
      if(!DATA.days[key])key=key==='02-29'?'02-28':currentKey();
      selectedKey=key;selectedIndex=0;renderDay(true);
    }
    dateInput.addEventListener('change',selectDateFromInput);

    var timer=null;
    function runSearch(){
      clearTimeout(timer);timer=setTimeout(function(){
        var q=text(searchInput.value).trim().toLowerCase();
        var cat=categorySelect.value;var region=regionSelect.value;
        if(!q&&!cat&&!region){results.replaceChildren();status.textContent='検索語・テーマ・地域を指定すると記事を探せます。';return;}
        var found=articleList.filter(function(a){
          if(cat&&themeGroup(a)!==cat)return false;
          if(region&&regionGroup(a)!==region)return false;
          if(!q)return true;
          var hay=[a.title,a.subtitle,a.intro,a.body,a.significance,a.countries,a.people,a.category,a.region,(a.tags||[]).join(' ')].join(' ').toLowerCase();
          return hay.indexOf(q)!==-1;
        });
        status.textContent=found.length+'件見つかりました'+(found.length>80?'（先頭80件を表示）':'');
        results.replaceChildren();
        found.slice(0,80).forEach(function(a){
          var b=el('button','history-result-button');b.type='button';
          b.appendChild(el('span','history-result-date',monthDayLabel(a.date)));
          var c=el('span','history-result-copy');c.appendChild(el('strong','',a.title));c.appendChild(el('small','',[a.year?a.year+'年':'',a.region,a.category].filter(Boolean).join('｜')));b.appendChild(c);
          b.appendChild(el('span','history-result-arrow','›'));
          b.addEventListener('click',function(){
            selectedKey=a.date;
            selectedIndex=Math.max(0,DATA.days[selectedKey].articleIds.indexOf(a.id));
            renderDay(true);
          });
          results.appendChild(b);
        });
      },120);
    }
    searchInput.addEventListener('input',runSearch);categorySelect.addEventListener('change',runSearch);regionSelect.addEventListener('change',runSearch);
    renderDay(false);
    var mode=params.get('mode');
    if(mode==='date')setTimeout(function(){dateInput.focus();},50);
    if(mode==='search')setTimeout(function(){searchInput.focus();searchInput.scrollIntoView({block:'center'});},50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){initLearn();initStandalone();},{once:true});
  else{initLearn();initStandalone();}
})();
