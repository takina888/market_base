(function(){
'use strict';
const payload=window.MB_HS_PAYLOAD||{};
const data=payload.data||{};
const extra=payload.extra||{};
const allParts=[...(data.parts||[]),...(extra.supplementParts||[])];
const allCodes=[...(data.codes||[]),...(extra.supplementCodes||[])];
const deepCases=extra.deepCases||[];
const countryGuides=extra.countryGuides||[];
const referenceChecklists=extra.referenceChecklists||[];
const productById=new Map((data.products||[]).map(x=>[x.id,x]));
const deepItems=deepCases.map(detail=>({detail,product:productById.get(detail.productId)})).filter(x=>x.product);
const countryGuideById=new Map(countryGuides.map(x=>[x.countryId,x]));
const panel=document.getElementById('hsPanel');
const state={
  tab:'learn',learnView:'sequence',stage:1,cardIndex:0,expert:false,learnQuery:'',learnStage:'すべて',
  qaKind:'core',qaQuery:'',qaStage:'すべて',
  caseView:'products',caseQuery:'',caseCategory:'すべて',caseLimit:10,
  referenceView:'parts',referenceQuery:''
};

function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function norm(value){return String(value??'').toLowerCase().normalize('NFKC');}
function includes(values,query){if(!query)return true;const q=norm(query);return values.flat(Infinity).some(v=>norm(v).includes(q));}
function arrayList(value){
  const a=Array.isArray(value)?value:(value?String(value).split(/\n|・(?=\S)/).filter(Boolean):[]);
  if(!a.length)return '';
  return '<ul class="hs-static-array">'+a.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>';
}
function detailRows(rows){
  const visible=rows.filter(([,v])=>Array.isArray(v)?v.length:String(v??'').trim());
  if(!visible.length)return '';
  return '<dl class="hsn-detail-list">'+visible.map(([label,value])=>{
    const body=Array.isArray(value)?arrayList(value):esc(value);
    return '<div class="hsn-detail-row"><dt>'+esc(label)+'</dt><dd>'+body+'</dd></div>';
  }).join('')+'</dl>';
}
function sourceBlock(title,url,context){
  if(!url&&!title)return '';
  return '<footer class="hs-static-source"><div><strong>'+esc(title||'出典')+'</strong>'+(context?'<br><span>'+esc(context)+'</span>':'')+'</div>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">公式資料を見る</a>':'')+'</footer>';
}
function tags(value){
  const a=Array.isArray(value)?value:String(value||'').split(/[、,]/).filter(Boolean);
  return a.length?'<div class="hs-static-tags">'+a.map(x=>'<span>'+esc(x.trim())+'</span>').join('')+'</div>':'';
}
function answerBlock(item){
  return '<div class="hsn-qa-answer">'+
    '<p>'+esc(item.full||item.short||'')+'</p>'+
    (item.example?'<div><strong>具体例</strong><span>'+esc(item.example)+'</span></div>':'')+
    (item.action?'<div><strong>実務で確認すること</strong><span>'+esc(item.action)+'</span></div>':'')+
    tags(item.tags)+sourceBlock('',item.sourceUrl,'')+
  '</div>';
}
function currentStageCards(){
  let cards=(data.cards||[]).filter(c=>Number(c.stage)===Number(state.stage)&&(state.expert||c.category==='本編に残す')).sort((a,b)=>a.order-b.order);
  if(!cards.length)cards=(data.cards||[]).filter(c=>Number(c.stage)===Number(state.stage)).sort((a,b)=>a.order-b.order);
  return cards;
}
function stageOptions(selected){return (data.stageNames||[]).map(s=>'<option value="'+s.stage+'" '+(String(selected)===String(s.stage)?'selected':'')+'>段階'+s.stage+'：'+esc(s.title)+'</option>').join('');}

function renderLearn(){
  const cards=currentStageCards();
  if(state.cardIndex>=cards.length)state.cardIndex=Math.max(0,cards.length-1);
  const card=cards[state.cardIndex];
  const coreCount=(data.cards||[]).filter(c=>c.category==='本編に残す').length;
  const available=state.expert?(data.cards||[]).length:coreCount;
  let html='<section class="mbx-tab-panel hsn-learn-panel" role="tabpanel">'+
    '<div class="hsn-learn-topline"><div><h2>10段階で読む</h2><p>順番でも、気になる段階からでも開けます。</p></div>'+
    '<label class="hsn-expert-toggle"><input id="hsExpertToggle" type="checkbox" '+(state.expert?'checked':'')+'><span aria-hidden="true"></span>専門カードも含める</label></div>'+
    '<div class="hsn-mode-switch hsn-learn-view-switch" aria-label="学習内容の表示方法">'+
    '<button class="'+(state.learnView==='sequence'?'is-active':'')+'" data-learn-view="sequence" type="button">順番に読む</button>'+
    '<button class="'+(state.learnView==='index'?'is-active':'')+'" data-learn-view="index" type="button">項目一覧から選ぶ<span>'+available+'</span></button></div>';
  if(state.learnView==='sequence'){
    html+='<div class="hsn-stage-nav" role="tablist">'+(data.stageNames||[]).map(s=>'<button class="'+(Number(state.stage)===Number(s.stage)?'is-active':'')+'" data-stage="'+s.stage+'" type="button"><span>'+s.stage+'</span><small>'+esc(s.title)+'</small></button>').join('')+'</div>'+
      '<label class="mbx-field hsn-stage-select"><span class="mbx-label">段階を選ぶ</span><select class="mbx-select" id="hsStageSelect">'+stageOptions(state.stage)+'</select></label>';
    const stageName=(data.stageNames||[]).find(s=>Number(s.stage)===Number(state.stage));
    html+='<div class="hsn-stage-head"><span>段階 '+state.stage+' / 10</span><div><h2>'+esc(stageName?.title||'')+'</h2><p>'+cards.length+'カード'+(state.expert?'（本編＋専門）':'（本編）')+'</p></div></div>';
    if(card){
      html+='<article class="hsn-study-card"><div class="hsn-study-card-meta"><span>'+esc(card.type)+'</span><small>'+(state.cardIndex+1)+' / '+cards.length+'</small></div><h3>'+esc(card.title)+'</h3><p class="hsn-study-lead">'+esc(card.short)+'</p>'+(card.explanation?'<p class="hsn-study-explanation">'+esc(card.explanation)+'</p>':'')+(card.action?'<div class="hsn-study-note"><strong>実務メモ</strong><p>'+esc(card.action)+'</p></div>':'')+
      '<div class="hsn-study-footer"><span>段階'+state.stage+'・'+esc(card.category||'')+'</span><div><button data-card-move="-1" '+(state.stage===1&&state.cardIndex===0?'disabled':'')+' type="button">‹ 前へ</button><button data-card-move="1" '+(state.stage===10&&state.cardIndex===cards.length-1?'disabled':'')+' type="button">'+(state.cardIndex===cards.length-1&&state.stage<10?'次の段階へ ›':'次へ ›')+'</button></div></div></article>';
    }
    const related=(data.qa||[]).filter(q=>q.kind==='core'&&Number(q.stage)===Number(state.stage)).slice(0,6);
    html+='<section class="hsn-related-section"><div class="hsn-subheading"><div><h3>この段階のQ&amp;A</h3></div><button data-open-qa="1" type="button">Q&amp;A一覧</button></div><div class="hsn-qa-list">'+related.map(q=>qaDetails(q,false)).join('')+'</div></section>';
  }else{
    const q=state.learnQuery.trim();
    const filtered=(data.cards||[]).filter(c=>(state.expert||c.category==='本編に残す')&&(state.learnStage==='すべて'||Number(c.stage)===Number(state.learnStage))&&includes([c.stage,c.stageTitle,c.type,c.title,c.short,c.explanation,c.action,c.audience,c.keywords],q)).sort((a,b)=>a.stage-b.stage||a.order-b.order);
    html+='<div class="hsn-learning-index"><p class="hsn-inline-note">10段階を順番に進めず、必要な項目だけ直接開けます。</p><div class="hsn-filter-row hsn-learn-index-filter">'+
      '<label class="mbx-field"><span class="mbx-label">項目名・内容から探す</span><input class="mbx-input" id="hsLearnQuery" placeholder="例：モーター、部品、事前教示、製造ライン" type="search" value="'+esc(state.learnQuery)+'"></label>'+
      '<label class="mbx-field"><span class="mbx-label">段階</span><select class="mbx-select" id="hsLearnStage"><option>すべて</option>'+stageOptions(state.learnStage)+'</select></label></div><p class="hsn-result-count">'+filtered.length+'項目'+(state.expert?'（本編＋専門）':'（本編）')+'</p>';
    (data.stageNames||[]).forEach(stage=>{
      const group=filtered.filter(c=>Number(c.stage)===Number(stage.stage));
      if(!group.length)return;
      html+='<section class="hsn-learn-index-group"><header><div><span>'+stage.stage+'</span><h3>'+esc(stage.title)+'</h3></div><small>'+group.length+'項目</small></header><div class="hsn-learn-index-list">'+group.map(c=>'<details class="hsn-learn-index-item"><summary><div class="hsn-learn-index-meta"><span>'+esc(c.type)+'</span><small>'+(c.category==='専門編へ移す'?'専門':'本編')+'</small></div><h4>'+esc(c.title)+'</h4><p>'+esc(c.short)+'</p><i aria-hidden="true">＋</i></summary><div class="hsn-learn-index-content"><p class="hsn-study-lead">'+esc(c.short)+'</p>'+(c.explanation?'<p class="hsn-study-explanation">'+esc(c.explanation)+'</p>':'')+(c.action?'<div class="hsn-study-note"><strong>実務メモ</strong><p>'+esc(c.action)+'</p></div>':'')+'</div></details>').join('')+'</div></section>';
    });
    if(!filtered.length)html+='<div class="hs-static-empty"><strong>該当する学習項目がありません</strong><p>別の言葉に変えるか、段階を「すべて」にしてください。</p></div>';
    html+='</div>';
  }
  return html+'</section>';
}

function qaDetails(q,large=true){
  return '<details class="hsn-qa-item"><summary><span>Q</span><div>'+(large?'<small>段階'+esc(q.stage)+' ・ '+esc(q.difficulty)+'</small>':'')+'<h3>'+esc(q.question)+'</h3></div><i aria-hidden="true">＋</i></summary>'+answerBlock(q)+'</details>';
}
function renderQa(){
  const filtered=(data.qa||[]).filter(q=>q.kind===state.qaKind&&(state.qaStage==='すべて'||Number(q.stage)===Number(state.qaStage))&&includes([q.question,q.short,q.full,q.example,q.action,q.tags,q.id],state.qaQuery.trim()));
  return '<section class="mbx-tab-panel" role="tabpanel"><div class="hsn-section-head"><div><p class="hsn-section-kicker">Q&amp;A</p><h2>質問から読む</h2><p>段階やキーワードで、収録Q&amp;Aを絞り込めます。</p></div><span>'+filtered.length+'問</span></div>'+
  '<div class="hsn-mode-switch"><button class="'+(state.qaKind==='core'?'is-active':'')+'" data-qa-kind="core" type="button">本編<span>'+esc(data.counts?.coreQa||0)+'</span></button><button class="'+(state.qaKind==='expert'?'is-active':'')+'" data-qa-kind="expert" type="button">専門編<span>'+esc(data.counts?.expertQa||0)+'</span></button></div>'+
  (state.qaKind==='expert'?'<p class="hsn-inline-note">専門編では、複数の機能を持つ機械や、国ごとに追加される番号まで扱います。</p>':'')+
  '<div class="hsn-filter-row"><label class="mbx-field"><span class="mbx-label">質問・キーワード</span><input class="mbx-input" id="hsQaQuery" value="'+esc(state.qaQuery)+'" placeholder="例：世界共通の6桁番号、交換部品、輸入前の税関確認" type="search"></label><label class="mbx-field"><span class="mbx-label">段階</span><select class="mbx-select" id="hsQaStage"><option>すべて</option>'+stageOptions(state.qaStage)+'</select></label></div>'+
  '<div class="hsn-qa-list hsn-qa-list-large">'+filtered.map(q=>qaDetails(q,true)).join('')+'</div>'+
  (!filtered.length?'<div class="hs-static-empty">該当する質問がありません。</div>':'')+'</section>';
}

function productDetails(p){
  return '<details class="hsn-case-item"><summary><div><span>'+esc(p.category)+'</span><small>'+esc(p.level||'')+'</small></div><h3>'+esc(p.name)+'</h3><p>'+esc(p.function)+'</p><div class="hsn-case-code"><small>最初に確認する候補</small><strong>HS '+esc(p.primaryHs)+'</strong></div><i aria-hidden="true">＋</i></summary><div class="hsn-case-content"><p class="hsn-case-reason">'+esc(p.reason||'')+'</p>'+detailRows([
    ['別名・呼び方',p.aliases],['比較する別のHS番号',p.alternateHs],['番号が変わる条件',p.changes],['確認する質問',p.questions],['必要な資料',p.documents],['実務メモ',p.memo],['よくある勘違い',p.mistake],['補足',p.note],['調査状態',p.researchStatus],['確認日',p.checked]
  ])+sourceBlock('',p.sourceUrl,'')+'</div></details>';
}
function deepDetails(item){const d=item.detail,p=item.product;return '<details class="hsn-case-item"><summary><div><span>深掘りケース</span><small>'+esc(p.category)+'</small></div><h3>'+esc(p.name)+'</h3><p>'+esc(d.scenario)+'</p><div class="hsn-case-code"><small>仮の結論</small><strong>'+esc(p.primaryHs)+'</strong></div><i aria-hidden="true">＋</i></summary><div class="hsn-case-content"><h4>想定仕様</h4>'+arrayList(d.assumedSpecs)+'<h4>比較候補</h4>'+detailRows((d.compareCandidates||[]).map(c=>['HS '+c.code+' '+c.label,c.point]))+'<h4>判断の順序</h4>'+arrayList(d.decisionSteps)+detailRows([['除外した考え方',d.excludedReasons],['仮の結論',d.provisionalConclusion],['未確認事項',d.unresolvedChecks]])+sourceBlock(d.sourceTitle,d.sourceUrl,d.sourceContext)+'</div></details>'}
function branchDetails(b){return '<details class="hsn-case-item hsn-branch-item"><summary><div><span>分類の分かれ目</span></div><h3>'+esc(b.theme)+'</h3><p>'+esc(b.question)+'</p><i aria-hidden="true">＋</i></summary><div class="hsn-case-content"><p class="hsn-case-reason">'+esc(b.importance)+'</p><div class="hsn-branch-directions"><div><strong>A</strong><p>'+esc(b.directionA)+'</p></div><div><strong>B</strong><p>'+esc(b.directionB)+'</p></div></div>'+detailRows([['確認に必要な資料',b.documents],['製品例',b.examples],['注意点',b.caution],['判断の根拠',b.basis],['確認状態',b.status]])+'</div></details>'}
function renderCases(){
  const categories=[...new Set((data.products||[]).map(p=>p.category))].sort((a,b)=>a.localeCompare(b,'ja'));
  let items=[];
  if(state.caseView==='products')items=(data.products||[]).filter(p=>(state.caseCategory==='すべて'||p.category===state.caseCategory)&&includes([p.name,p.aliases,p.category,p.function,p.primaryHs,p.alternateHs,p.reason,p.changes,p.questions,p.documents,p.memo,p.mistake,p.note],state.caseQuery));
  if(state.caseView==='deep')items=deepItems.filter(x=>(state.caseCategory==='すべて'||x.product.category===state.caseCategory)&&includes([x.product.name,x.product.aliases,x.product.category,x.product.function,x.product.primaryHs,x.detail.scenario,x.detail.assumedSpecs,(x.detail.compareCandidates||[]).map(c=>[c.code,c.label,c.point]),x.detail.decisionSteps,x.detail.excludedReasons,x.detail.provisionalConclusion,x.detail.unresolvedChecks],state.caseQuery));
  if(state.caseView==='branches')items=(data.branches||[]).filter(b=>includes([b.theme,b.question,b.directionA,b.directionB,b.importance,b.documents,b.examples,b.caution,b.basis],state.caseQuery));
  const title=state.caseView==='products'?'製品・部品から見る':state.caseView==='deep'?'代表ケースを深く見る':'分類の分かれ目から見る';
  return '<section class="mbx-tab-panel" role="tabpanel"><div class="hsn-section-head"><div><p class="hsn-section-kicker">CASES</p><h2>'+title+'</h2><p>製品名だけでなく、機能・提示状態・構成から候補を比較します。</p></div><span>'+items.length+'件</span></div>'+
  '<div class="hsn-mode-switch hsn-case-switch"><button class="'+(state.caseView==='products'?'is-active':'')+'" data-case-view="products" type="button">製品ケース<span>'+esc(data.products?.length||0)+'</span></button><button class="'+(state.caseView==='deep'?'is-active':'')+'" data-case-view="deep" type="button">深掘り<span>'+deepItems.length+'</span></button><button class="'+(state.caseView==='branches'?'is-active':'')+'" data-case-view="branches" type="button">分岐<span>'+esc(data.branches?.length||0)+'</span></button></div>'+
  '<div class="hsn-filter-row"><label class="mbx-field"><span class="mbx-label">製品名・機能・HS番号</span><input class="mbx-input" id="hsCaseQuery" value="'+esc(state.caseQuery)+'" placeholder="例：炊飯機、モーター、搬送、8419" type="search"></label>'+(state.caseView!=='branches'?'<label class="mbx-field"><span class="mbx-label">カテゴリー</span><select class="mbx-select" id="hsCaseCategory"><option>すべて</option>'+categories.map(c=>'<option '+(state.caseCategory===c?'selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label>':'')+'</div>'+
  '<div class="hsn-case-list">'+items.slice(0,state.caseLimit).map(x=>state.caseView==='products'?productDetails(x):state.caseView==='deep'?deepDetails(x):branchDetails(x)).join('')+'</div>'+
  (state.caseLimit<items.length?'<button class="hsn-load-more" data-load-case type="button">続きを表示 <span>残り'+(items.length-state.caseLimit)+'件</span></button>':'')+(!items.length?'<div class="hs-static-empty">該当するケースがありません。</div>':'')+'</section>';
}

function partDetails(p){return '<details class="hsn-reference-item"><summary><div><h3>'+esc(p.name)+'</h3><p>'+esc(p.question)+'</p></div><div class="hsn-reference-code"><span>最初に確認するHS番号</span><strong>HS '+esc(p.primaryHs)+'</strong></div><i aria-hidden="true">＋</i></summary>'+detailRows([['比較する別のHS番号',p.alternateHs],['番号を分けるポイント',p.rule],['確認に必要な資料',p.documents],['この考え方を使う場面',p.shipment],['よくある勘違い',p.caution],['確認状態',p.status]])+sourceBlock(p.sourceTitle,p.sourceUrl,p.sourceContext)+'</details>'}
function codeDetails(c){return '<details class="hsn-code-item"><summary><small>日本の細分例：'+esc(c.heading)+'</small><strong>HS '+esc(c.code6)+'</strong><h3>'+esc(c.label)+'</h3><i aria-hidden="true">＋</i></summary><div><p>'+esc(c.plain)+'</p>'+detailRows([['含まれる例',c.includes],['除外・比較するもの',c.excludes],['確認する質問',c.question],['確認状態',c.status]])+sourceBlock(c.sourceTitle,c.sourceUrl,c.sourceContext)+'</div></details>'}
function countryCard(c){const g=countryGuideById.get(c.id);return '<article class="hsn-country-card"><div><small>'+esc(c.id)+'</small><h3>'+esc(c.name)+'</h3><span>'+esc(c.codeSystem)+'</span></div>'+detailRows([['分類の基礎',c.basis],['事前回答制度',c.advanceRuling]])+'<p>'+esc(c.memo)+'</p>'+(g?'<h4>確認の流れ</h4><ol class="hs-static-country-workflow">'+g.workflow.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>'+detailRows([['注意点',g.limitations],['確認日',g.checked]]):'')+'<div class="hsn-country-links">'+(c.tariffUrl?'<a class="hsn-source-link" href="'+esc(c.tariffUrl)+'" target="_blank" rel="noopener">関税率表</a>':'')+(c.rulingUrl?'<a class="hsn-source-link" href="'+esc(c.rulingUrl)+'" target="_blank" rel="noopener">事前回答制度</a>':'')+(g?.sourceUrl?'<a class="hsn-source-link" href="'+esc(g.sourceUrl)+'" target="_blank" rel="noopener">公式案内</a>':'')+'</div></article>'}
function renderReference(){
  let filtered=[];
  if(state.referenceView==='parts')filtered=allParts.filter(p=>includes([p.name,p.question,p.primaryHs,p.alternateHs,p.rule,p.documents,p.shipment,p.caution],state.referenceQuery));
  if(state.referenceView==='codes')filtered=allCodes.filter(c=>includes([c.code6,c.heading,c.label,c.plain,c.includes,c.excludes,c.question],state.referenceQuery));
  return '<section class="mbx-tab-panel" role="tabpanel"><div class="hsn-section-head"><div><p class="hsn-section-kicker">REFERENCE</p><h2>部品・HS番号・国別情報</h2><p>部品を別送するケース、HS番号の具体例、国ごとの確認先をまとめています。</p></div></div>'+
  '<div class="hsn-mode-switch hsn-reference-switch"><button class="'+(state.referenceView==='parts'?'is-active':'')+'" data-reference-view="parts" type="button">部品ケース<span>'+allParts.length+'</span></button><button class="'+(state.referenceView==='codes'?'is-active':'')+'" data-reference-view="codes" type="button">番号から見る<span>'+allCodes.length+'</span></button><button class="'+(state.referenceView==='countries'?'is-active':'')+'" data-reference-view="countries" type="button">国別の確認先<span>'+esc(data.countries?.length||0)+'</span></button><button class="'+(state.referenceView==='checklists'?'is-active':'')+'" data-reference-view="checklists" type="button">実務チェック<span>'+referenceChecklists.length+'</span></button></div>'+
  ((state.referenceView==='parts'||state.referenceView==='codes')?'<label class="mbx-field hsn-single-filter"><span class="mbx-label">'+(state.referenceView==='parts'?'掲載ケースを絞り込む':'HS番号・品名で絞り込む')+'</span><input class="mbx-input" id="hsReferenceQuery" value="'+esc(state.referenceQuery)+'" placeholder="例：交換刃、センサー、制御盤" type="search"></label>':'')+
  (state.referenceView==='parts'?'<p class="hsn-result-count">'+filtered.length+'件の部品ケース</p><div class="hsn-case-list">'+filtered.map(partDetails).join('')+'</div>':'')+
  (state.referenceView==='codes'?'<p class="hsn-inline-note">ここでは、食品機械や部品に関係する'+allCodes.length+'件のHS番号例を確認できます。</p><p class="hsn-result-count">'+filtered.length+'件の番号例</p><div class="hsn-code-grid">'+filtered.map(codeDetails).join('')+'</div>':'')+
  (state.referenceView==='countries'?'<div class="hsn-country-grid">'+(data.countries||[]).map(countryCard).join('')+'</div>':'')+
  (state.referenceView==='checklists'?'<div class="hsn-case-list">'+referenceChecklists.map(c=>'<details class="hsn-reference-item"><summary><div><h3>'+esc(c.title)+'</h3><p>'+esc(c.lead)+'</p></div><i aria-hidden="true">＋</i></summary><ul class="hs-static-checklist">'+c.items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>').join('')+'</div>':'')+'</section>';
}

function render(){
  document.querySelectorAll('[data-main-tab]').forEach(btn=>{const active=btn.dataset.mainTab===state.tab;btn.classList.toggle('is-active',active);btn.setAttribute('aria-selected',active?'true':'false');});
  panel.innerHTML=state.tab==='learn'?renderLearn():state.tab==='qa'?renderQa():state.tab==='cases'?renderCases():renderReference();
  bindDynamic();
  updateScrollControls();
}
function keepFocus(id,fn){const el=document.getElementById(id);const pos=el&&typeof el.selectionStart==='number'?el.selectionStart:null;fn();render();requestAnimationFrame(()=>{const next=document.getElementById(id);if(next){next.focus();if(pos!==null&&next.setSelectionRange)next.setSelectionRange(pos,pos);}})}
function bindDynamic(){
  panel.querySelectorAll('[data-learn-view]').forEach(b=>b.addEventListener('click',()=>{state.learnView=b.dataset.learnView;render();}));
  panel.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{state.stage=Number(b.dataset.stage);state.cardIndex=0;render();}));
  panel.querySelectorAll('[data-card-move]').forEach(b=>b.addEventListener('click',()=>moveCard(Number(b.dataset.cardMove))));
  panel.querySelectorAll('[data-open-qa]').forEach(b=>b.addEventListener('click',()=>{state.tab='qa';state.qaStage=String(state.stage);state.qaKind='core';render();window.scrollTo({top:72,behavior:'smooth'});}));
  panel.querySelectorAll('[data-qa-kind]').forEach(b=>b.addEventListener('click',()=>{state.qaKind=b.dataset.qaKind;render();}));
  panel.querySelectorAll('[data-case-view]').forEach(b=>b.addEventListener('click',()=>{state.caseView=b.dataset.caseView;state.caseLimit=10;state.caseQuery='';render();}));
  panel.querySelectorAll('[data-reference-view]').forEach(b=>b.addEventListener('click',()=>{state.referenceView=b.dataset.referenceView;state.referenceQuery='';render();}));
  panel.querySelector('[data-load-case]')?.addEventListener('click',()=>{state.caseLimit+=10;render();});
  const expert=document.getElementById('hsExpertToggle');if(expert)expert.addEventListener('change',()=>{state.expert=expert.checked;state.cardIndex=0;render();});
  const stage=document.getElementById('hsStageSelect');if(stage)stage.addEventListener('change',()=>{state.stage=Number(stage.value);state.cardIndex=0;render();});
  const learnStage=document.getElementById('hsLearnStage');if(learnStage)learnStage.addEventListener('change',()=>{state.learnStage=learnStage.value;render();});
  const qaStage=document.getElementById('hsQaStage');if(qaStage)qaStage.addEventListener('change',()=>{state.qaStage=qaStage.value;render();});
  const caseCategory=document.getElementById('hsCaseCategory');if(caseCategory)caseCategory.addEventListener('change',()=>{state.caseCategory=caseCategory.value;state.caseLimit=10;render();});
  const inputs=[['hsLearnQuery','learnQuery'],['hsQaQuery','qaQuery'],['hsCaseQuery','caseQuery'],['hsReferenceQuery','referenceQuery']];
  inputs.forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.addEventListener('input',()=>keepFocus(id,()=>{state[key]=el.value;if(key==='caseQuery')state.caseLimit=10;}));});
}
function moveCard(direction){
  const cards=currentStageCards();const next=state.cardIndex+direction;
  if(next>=0&&next<cards.length){state.cardIndex=next;render();return;}
  if(direction===1&&state.stage<10){state.stage++;state.cardIndex=0;render();return;}
  if(direction===-1&&state.stage>1){state.stage--;const prev=currentStageCards();state.cardIndex=Math.max(0,prev.length-1);render();}
}

document.querySelectorAll('[data-main-tab]').forEach(btn=>btn.addEventListener('click',()=>{state.tab=btn.dataset.mainTab;state.caseLimit=10;render();window.scrollTo({top:72,behavior:'smooth'});}));
document.getElementById('hsRefreshButton').addEventListener('click',function(){this.disabled=true;this.textContent='更新中';const u=new URL(location.href);u.searchParams.set('_',Date.now());location.replace(u.href);});
document.getElementById('hsDisclaimer').textContent=data.meta?.disclaimer||'';
const up=document.getElementById('hsScrollUp'),down=document.getElementById('hsScrollDown'),rail=document.getElementById('hsScrollControls');
up.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
down.addEventListener('click',()=>window.scrollTo({top:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight),behavior:'smooth'}));
let ticking=false;function updateScrollControls(){ticking=false;const doc=document.documentElement,top=Math.max(window.scrollY||0,doc.scrollTop||0),view=innerHeight||doc.clientHeight,height=Math.max(doc.scrollHeight,document.body.scrollHeight),max=Math.max(0,height-view),scrollable=max>80;rail.hidden=!scrollable;up.disabled=!scrollable||top<=24;down.disabled=!scrollable||top>=max-24;}
function requestUpdate(){if(ticking)return;ticking=true;requestAnimationFrame(updateScrollControls)}
addEventListener('scroll',requestUpdate,{passive:true});addEventListener('resize',requestUpdate,{passive:true});if('ResizeObserver'in window)new ResizeObserver(requestUpdate).observe(document.body);
render();
})();
