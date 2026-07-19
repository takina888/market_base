(() => {
  'use strict';

  const SKIP_TAGS = new Set(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT','SELECT','OPTION','BUTTON','SVG','CODE','PRE','A']);
  const SKIP_SELECTORS = [
    'header','nav','footer','form','h1','h2','h3','h4','h5','h6','summary',
    '.mbu-brand','.mbu-meta','.toolbar','.tabs','.filter','.filters','.search-area',
    '.label','.k','.meta','.eyebrow','.badge','.badge-row','.tag','.chip','.pill',
    '.card-title','.card-sub','.section-title','.hero-badge','.stat','.count','.pagination',
    '.source-line','.data-source','.citation','.retail-note','.result-meta','.maker-products',
    '.official-homepage-bar','.external-db-card-note','.links','.sources','.source-row'
  ].join(',');
  const SCAN_ROOTS = ['main','#detailContent','.country-profile-dialog','.country-detail-panel','.modal','.dialog','.drawer'];
  const NARRATIVE_BLOCKS = [
    '[data-thesis-highlight]',
    'p.overview','.overview-text','p.summary','.summary:not(summary)','p.lead','.lead',
    '.country-overview','.value.prose'
  ].join(',');
  const CARD_CONTAINERS = [
    'article.card','article.company','details.company','details.product-card','.manufacturer-card'
  ].join(',');

  const dangerTerms = [
    '持ち込み禁止','使用不可','法令上必須','設備導入前に確認','現地確認が必要',
    '必ず確認','禁止','警告','危険','違反','罰則','適用対象外','対象外',
    '未登録','未公表','公開情報では確認できません','確認できません','未確認',
    '要確認','確認が必要','メーカーへ確認','仕様確認が必要','地域差があります','工場ごとに異なります'
  ];
  const memorizationTerms = [
    'ハラール対応','コーシャ対応','独立宣言','独立を宣言','主権移譲','民主化','地方分権',
    '日本企業の進出','食品・外食・小売','食品、外食、小売','米を主食',
    '輸入規制','食品安全','法規制','関税','許可制','認証取得','学校給食',
    '在留邦人数','日本食レストラン','看板商品','代表機種','主力製品','海外代理店',
    '海外拠点','海外展開','輸出実績','販売実績','導入実績','省人化','省力化',
    '自動化','品質安定','品質向上','衛生・洗浄性','自動洗浄','サニタリー',
    '処理能力','生産能力','調理済み米飯','冷凍米飯',
    'HACCP','GMP','FSSC 22000','ISO 22000','ISO 9001','ISO 14001','ISO 45001',
    'PSE','CE','CCC','KC','BSMI','UL','NRTL','JIS','IEC'
  ];
  const boldTerms = [
    '該当なし','公式PDF','カタログPDF','公式カタログ','製品詳細は未登録','能力数値あり',
    'HACCP','GMP','FSSC 22000','ISO 22000','ISO 9001','ISO 14001','ISO 45001',
    'PSE','CE','CCC','KC','BSMI','UL','NRTL','JIS','IEC'
  ];

  const strongCues = [
    '最も重要','特に重要','重要です','重要となります','必要です','必要があります','注意が必要',
    '確認が必要','必ず確認','主な特徴','最大の特徴','強みは','主な強み','代表的','主力',
    '中心に','支えています','直接関係します','適しています','向いています','有効です','有用です',
    '優先されます','ポイントは','要点は','結論として','つまり','そのため','したがって',
    'ハラール','独立','主権移譲','日本企業','主食','市場を形成','経済の柱','食文化'
  ];
  const actionCues = [
    '製造・販売しています','製造しています','販売しています','供給しています','展開しています',
    '提供しています','対応しています','保有しています','運営しています','採用しています',
    '利用されています','活用されています','実現します','実現できます','可能です','できます',
    '位置付けられます','占めています','関係します','特徴があります','強みがあります',
    '改善します','向上します','抑えます','減らします','進出しています','進出が見られます',
    '宣言しました','実現しました','進みました','担っています','支えています'
  ];
  const subjectCues = [
    '食品','外食','小売','日本企業','ハラール','コーシャ','主食','米飯','独立','主権移譲',
    '輸出','輸入','工場','製造','販売','供給','認証','規制','学校給食','在留邦人',
    'レストラン','代表機種','看板商品','処理能力','生産能力','省人化','自動化','衛生','洗浄',
    '本拠','統合型','グループ','会社','企業','機内食','駅弁','惣菜','弁当','おにぎり','中央厨房','共同調理場','代理店'
  ];

  const labelWeights = [
    [/^(?:重要ポイント|注意事項|注意点|主な歴史|日本との関係|食文化・主食)$/,4.5],
    [/^(?:会社特徴|特徴|企業説明|会社概要|会社・ブランド概要)$/,3.8],
    [/^(?:販売・導入内容|日本製品への対応|ご飯との関係|鉄道・駅向けの内容)$/,3.7],
    [/^(?:主な効果|概要|中央厨房・製造内容|製造・供給内容)$/,3.4],
    [/^(?:海外展開|設備投資|工場・施設|代表商品|主力製品|米飯関連)$/,2.6]
  ];
  const labelReject = /(?:URL|出典|参照|所在地|住所|国・地域|都市・地域|英語名|現地語名|会社名|ブランド名|対象年|期間|更新日|確認日|売上高$|従業員数$|店舗数$|分類$|業態$|カテゴリー$|カテゴリ$)/;
  const uiInstructionPattern = /^(?:カード|ボタン|タブ|検索|フィルタ|更新|戻る|閉じる|タップ|クリック|選択|入力|画面|一覧から|ここから|代表的な組み合わせ)/;
  const sourcePattern = /(?:出典|参照先|公式ページ|公式サイト|確認日|更新日|FAOSTAT|World Bank|Global Survey|データ整理中)/i;
  const statsPattern = /(?:提供児童数|提供学校|カバー率|提供日数|人口・面積|件表示|一部表示中)\s*[：:]/;
  const placeholderPattern = /^(?:確認できません|情報はありません|詳細データは未収録です|未登録です|該当なし|—|－|-)+[。.]?$/;
  const endingPattern = /(?:です|ます|でした|ました|となります|があります|できます|しています|されます|されている|関係します|持ちます|占めます|必要です|重要です|可能です|適しています|向いています|実現しました|進みました|担います|担っています|支えています)[。！？!?]?$/;
  const weakGenericPattern = /^(?:都市型の)?(?:食品小売|食品スーパー|スーパーマーケット|コンビニ|企業|会社|メーカー)(?:です|を展開しています)[。.]?$/;
  const branchGenericPattern = /(?:で展開する(?:会員制ホールセール|.+国別小売事業|コンビニ|食品スーパー)|(?:食品スーパー|生活用品小売)です)[。.]?$/;

  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const outsideDangerTerms = ['持ち込み禁止','使用不可','法令上必須','必ず確認','禁止','警告','危険','違反','罰則'];
  const outsideItems = [
    ...outsideDangerTerms.map(text => ({ text, cls: 'mb-reading-red', priority: 3 })),
    ...boldTerms.map(text => ({ text, cls: 'mb-reading-bold', priority: 1 }))
  ].sort((a,b) => b.text.length - a.text.length || b.priority - a.priority);
  const outsideMap = new Map(outsideItems.map(item => [item.text,item.cls]));
  const outsidePattern = outsideItems.map(item => escapeRegExp(item.text)).join('|');
  const outsideCombined = outsidePattern ? new RegExp(`(${outsidePattern})`,'g') : null;

  const yearPattern = '(?:(?:18|19|20)\\d{2}年|令和\\d+年|平成\\d+年|昭和\\d+年)';
  const quantityPattern = '(?:\\d{1,3}(?:,\\d{3})+|\\d+(?:\\.\\d+)?)(?:\\s*(?:%|％|人|社|件|か所|箇所|店舗|台|基|ライン|トン|t/時|kg/時|kg/h|kg|g|kW|L|個/時|個/分|袋/分|食/日|万円|億円|兆円|米ドル|バーツ|ユーロ|ポンド))';
  const electricalPattern = '(?:(?:単相|三相)\\s*)?\\d{2,4}(?:/\\d{2,4})?\\s*V(?:\\s*[・/,]\\s*(?:50|60)(?:/60)?\\s*Hz)?';
  const factParts = [...memorizationTerms,...dangerTerms].sort((a,b)=>b.length-a.length).map(escapeRegExp);
  const thesisFactCombined = new RegExp(`(${factParts.join('|')}|${yearPattern}|${electricalPattern}|${quantityPattern}|HS\\s*\\d{4}(?:\\.\\d{2})?)`,'g');
  const MAX_FACTS_PER_THESIS = 4;
  const MAX_OUTSIDE_MARKS = 3;

  function normalize(text){ return String(text||'').replace(/\s+/g,' ').trim(); }
  function baseEligible(node){
    if(!node||node.nodeType!==Node.TEXT_NODE||!node.nodeValue||!node.nodeValue.trim()) return false;
    const parent=node.parentElement;
    if(!parent||SKIP_TAGS.has(parent.tagName)) return false;
    if(parent.closest('.mb-reading-bold,.mb-reading-red,.mb-reading-yellow')) return false;
    if(parent.closest(SKIP_SELECTORS)) return false;
    return true;
  }
  function splitSentences(text){
    const out=[]; const regex=/[^。！？!?\n]+[。！？!?]?/g; let match;
    while((match=regex.exec(text))!==null){
      const raw=match[0]; const lead=(raw.match(/^\s*/)?.[0].length)||0; const trail=(raw.match(/\s*$/)?.[0].length)||0;
      const start=match.index+lead,end=match.index+raw.length-trail;
      if(end>start) out.push({start,end,text:text.slice(start,end)});
    }
    return out;
  }
  function labelWeight(label){
    const text=normalize(label);
    if(!text||labelReject.test(text)) return -Infinity;
    for(const [pattern,weight] of labelWeights){ if(pattern.test(text)) return weight; }
    return -Infinity;
  }
  function scoreSentence(sentence,index,total,context={}){
    const text=normalize(sentence).replace(/^[-・●▪︎■□]\s*/, '');
    const len=[...text].length;
    if(len<18||len>240) return -Infinity;
    if(!/[ぁ-んァ-ヶ一-龠]/.test(text)) return -Infinity;
    if(placeholderPattern.test(text)||statsPattern.test(text)||uiInstructionPattern.test(text)) return -Infinity;
    if(sourcePattern.test(text)&&!/(重要|必要|注意|特徴|強み)/.test(text)) return -Infinity;
    if((text.match(/[／/]/g)||[]).length>=3&&!/[。！？!?]/.test(text)) return -Infinity;
    if(/^[\d\s,，.．%％年月日:/／()（）・—－-]+$/.test(text)) return -Infinity;
    if(weakGenericPattern.test(text)) return -Infinity;
    if(/で展開する.*(?:国別小売事業|会員制ホールセール)(?:です|となります)?[。.]?$/.test(text)) return -Infinity;
    if(/^(?:香港|日本|台湾|中国|韓国|タイ|アメリカ|米国|欧州|アジア).{0,18}(?:食品スーパー|生活用品小売)[。.]?$/.test(text)) return -Infinity;
    if(/関連素材に関連する[。.]?$/.test(text)) return -Infinity;

    let score=context.preferred?2.1:0;
    score+=context.labelBoost||0;
    if(index===0) score+=0.75;
    if(index===total-1&&total>1) score+=0.35;
    if(len>=28&&len<=150) score+=1.15;
    if(/[。！？!?]$/.test(text)) score+=0.65;
    if(endingPattern.test(text)) score+=1.3;
    strongCues.forEach(cue=>{if(text.includes(cue)) score+=1.8;});
    actionCues.forEach(cue=>{if(text.includes(cue)) score+=0.8;});
    let subjects=0; subjectCues.forEach(cue=>{if(text.includes(cue)) subjects+=1;});
    score+=Math.min(subjects,4)*0.65;
    if(/(?:(?:18|19|20)\d{2}年|令和\d+年|平成\d+年|昭和\d+年)/.test(text)) score+=1.0;
    if(/(?:一方|ただし|特に|主に|中心|直接|最適|代表|主力|特徴|強み|重要|必要|注意|課題|本拠|統合型)/.test(text)) score+=0.75;
    if((text.match(/[、，]/g)||[]).length>=2&&/(?:製造|販売|供給|運営|展開|対応|利用|実施)/.test(text)) score+=0.65;
    if((text.match(/[、，]/g)||[]).length>=3&&/(?:取り扱っています|扱っています|販売しています|製造しています)[。.]?$/.test(text)&&!/(?:以上|か国|全国|輸出|供給|主力|代表)/.test(text)) score-=1.55;
    if(branchGenericPattern.test(text)) score-=3.1;
    if(/関連する[。.]?$/.test(text)&&!/(重要|主な|具体|直接)/.test(text)) score-=1.4;
    if(/^(?:.+は、?)?(?:日本|台湾|中国|香港|韓国|タイ|米国|アメリカ)?で展開する(?:コンビニ|スーパー|食品小売)(?:です|チェーンです)[。.]?$/.test(text)) score-=2.4;
    if(/(?:扱っています|販売しています)[。.]?$/.test(text)&&subjects<2&&(text.match(/[、，]/g)||[]).length<2) score-=1.6;
    return score;
  }
  function decorateThesisSpan(span){
    const nodes=[]; const walker=document.createTreeWalker(span,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) nodes.push(walker.currentNode);
    let remaining=MAX_FACTS_PER_THESIS;
    nodes.forEach(node=>{
      if(remaining<=0) return;
      const text=node.nodeValue; thesisFactCombined.lastIndex=0; let match,cursor=0,count=0;
      const fragment=document.createDocumentFragment();
      while((match=thesisFactCombined.exec(text))!==null&&remaining>0){
        if(match.index>cursor) fragment.append(document.createTextNode(text.slice(cursor,match.index)));
        const red=document.createElement('span'); red.className='mb-reading-red'; red.textContent=match[0]; fragment.append(red);
        cursor=match.index+match[0].length; count+=1; remaining-=1;
      }
      if(!count) return;
      if(cursor<text.length) fragment.append(document.createTextNode(text.slice(cursor)));
      node.replaceWith(fragment);
    });
  }
  function wrapRange(node,start,end){
    const text=node.nodeValue,fragment=document.createDocumentFragment();
    if(start>0) fragment.append(document.createTextNode(text.slice(0,start)));
    const span=document.createElement('span'); span.className='mb-reading-yellow'; span.textContent=text.slice(start,end); decorateThesisSpan(span); fragment.append(span);
    if(end<text.length) fragment.append(document.createTextNode(text.slice(end)));
    node.replaceWith(fragment);
  }
  function bestCandidateInBlock(block,context={}){
    const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT),candidates=[];
    while(walker.nextNode()){
      const node=walker.currentNode;
      if(!baseEligible(node)) continue;
      const nested=node.parentElement.closest(NARRATIVE_BLOCKS);
      if(nested&&nested!==block) continue;
      const segments=splitSentences(node.nodeValue);
      segments.forEach((segment,index)=>{
        const score=scoreSentence(segment.text,index,segments.length,context);
        if(Number.isFinite(score)) candidates.push({node,segment,score});
      });
      if(context.allowPair) for(let i=0;i<segments.length-1;i+=1){
        const combined=node.nodeValue.slice(segments[i].start,segments[i+1].end);
        if([...normalize(combined)].length>210) continue;
        const a=scoreSentence(segments[i].text,i,segments.length,context);
        const b=scoreSentence(segments[i+1].text,i+1,segments.length,context);
        if(Number.isFinite(a)&&Number.isFinite(b)&&a>=4.3&&b>=4.3){
          candidates.push({node,segment:{start:segments[i].start,end:segments[i+1].end,text:combined},score:Math.max(a,b)+Math.min(a,b)*0.4+0.4});
        }
      }
    }
    candidates.sort((a,b)=>b.score-a.score||(b.segment.end-b.segment.start)-(a.segment.end-a.segment.start));
    return candidates[0]||null;
  }
  function processNarrativeBlock(block){
    if(!block||block.dataset.mbThesisScanned==='1') return;
    block.dataset.mbThesisScanned='1';
    if(block.matches(SKIP_SELECTORS)||block.closest('header,nav,footer,form')) return;
    const explicit=block.matches('[data-thesis-highlight]');
    const inContent=explicit||block.closest('.country-profile-dialog,.country-detail-panel,#detailContent,'+CARD_CONTAINERS);
    if(!inContent) return;
    const allowPair=explicit||block.matches('p.overview,.value.prose');
    const best=bestCandidateInBlock(block,{preferred:true,allowPair});
    if(!best) return;
    const threshold=explicit?4.0:5.15;
    if(best.score<threshold) return;
    wrapRange(best.node,best.segment.start,best.segment.end);
  }
  function rowLabelAndValue(row){
    if(!row) return null;
    if(row.tagName==='TR'){
      const label=row.querySelector('th'); const value=row.querySelector('td');
      return label&&value?{label:label.textContent,value}:null;
    }
    const label=row.querySelector(':scope > .label,:scope > .k,:scope > .detail-label');
    if(!label) return null;
    let value=row.querySelector(':scope > .value,:scope > .v');
    if(!value){
      const children=[...row.children].filter(child=>child!==label);
      value=children[children.length-1]||null;
    }
    return value?{label:label.textContent,value}:null;
  }
  function collectLabeledRows(card){
    const rows=[];
    card.querySelectorAll('.row,.detail-row,tr').forEach(row=>{
      if(row.closest(CARD_CONTAINERS)!==card) return;
      const pair=rowLabelAndValue(row); if(pair) rows.push(pair);
    });
    card.querySelectorAll('.grid > .k').forEach(label=>{
      if(label.closest(CARD_CONTAINERS)!==card) return;
      const value=label.nextElementSibling;
      if(value?.classList.contains('v')) rows.push({label:label.textContent,value});
    });
    return rows;
  }
  function processBestLabeledField(card){
    if(!card||card.dataset.mbCardThesisScanned==='1') return;
    card.dataset.mbCardThesisScanned='1';
    if(card.querySelector('.mb-reading-yellow')) return;
    const candidates=[];
    collectLabeledRows(card).forEach(({label,value})=>{
      const boost=labelWeight(label); if(!Number.isFinite(boost)) return;
      const best=bestCandidateInBlock(value,{preferred:false,labelBoost:boost});
      if(best) candidates.push({...best,label:normalize(label)});
    });
    candidates.sort((a,b)=>b.score-a.score||(b.segment.end-b.segment.start)-(a.segment.end-a.segment.start));
    const best=candidates[0];
    if(!best||best.score<6.25) return;
    wrapRange(best.node,best.segment.start,best.segment.end);
  }
  function processNarratives(root){
    if(!root||(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)) return;
    const blocks=[];
    if(root.nodeType===Node.ELEMENT_NODE&&root.matches(NARRATIVE_BLOCKS)) blocks.push(root);
    root.querySelectorAll?.(NARRATIVE_BLOCKS).forEach(block=>blocks.push(block));
    [...new Set(blocks)].forEach(processNarrativeBlock);
    const cards=[];
    if(root.nodeType===Node.ELEMENT_NODE&&root.matches(CARD_CONTAINERS)) cards.push(root);
    root.querySelectorAll?.(CARD_CONTAINERS).forEach(card=>cards.push(card));
    [...new Set(cards)].forEach(processBestLabeledField);
  }
  function processOutsideNode(node){
    if(!outsideCombined||!baseEligible(node)) return;
    const text=node.nodeValue; outsideCombined.lastIndex=0; let match,cursor=0,count=0;
    const fragment=document.createDocumentFragment();
    while((match=outsideCombined.exec(text))!==null&&count<MAX_OUTSIDE_MARKS){
      if(match.index>cursor) fragment.append(document.createTextNode(text.slice(cursor,match.index)));
      const span=document.createElement('span'); span.className=outsideMap.get(match[0])||'mb-reading-bold'; span.textContent=match[0]; fragment.append(span);
      cursor=match.index+match[0].length; count+=1;
    }
    if(!count) return;
    if(cursor<text.length) fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
  function processOutsideEmphasis(root){
    if(!root) return;
    if(root.nodeType===Node.TEXT_NODE){processOutsideNode(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(processOutsideNode);
  }
  function processSubtree(root){
    if(!root) return;
    if(root.nodeType===Node.TEXT_NODE){processOutsideNode(root);return;}
    processNarratives(root);
    processOutsideEmphasis(root);
  }
  function scanInitial(){
    const roots=[]; SCAN_ROOTS.forEach(selector=>document.querySelectorAll(selector).forEach(node=>roots.push(node)));
    if(!roots.length&&document.body) roots.push(document.body);
    [...new Set(roots)].forEach(processSubtree);
  }
  function clearScanFlags(node){
    if(node?.nodeType!==Node.ELEMENT_NODE) return;
    const block=node.closest?.(NARRATIVE_BLOCKS); if(block) delete block.dataset.mbThesisScanned;
    const card=node.closest?.(CARD_CONTAINERS); if(card) delete card.dataset.mbCardThesisScanned;
  }
  function start(){
    scanInitial();
    const observer=new MutationObserver(mutations=>{
      const roots=new Set();
      for(const mutation of mutations){
        clearScanFlags(mutation.target);
        roots.add(mutation.target.nodeType===Node.ELEMENT_NODE?mutation.target:mutation.target.parentElement);
        for(const node of mutation.addedNodes){
          if(node.nodeType===Node.TEXT_NODE){clearScanFlags(node.parentElement); roots.add(node.parentElement);}
          else if(node.nodeType===Node.ELEMENT_NODE){clearScanFlags(node); roots.add(node);}
        }
      }
      roots.forEach(processSubtree);
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();

/* Apply country context from country profile deep links on specialist DB pages. */
(() => {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const country = params.get('mb_country');
  const code = params.get('mb_country_code') || '';
  if (!country) return;

  const aliasMap = {
    US: ['アメリカ合衆国','アメリカ','米国','USA','United States'],
    GB: ['イギリス','英国','UK','United Kingdom'],
    CN: ['中国','中華人民共和国'],
    HK: ['香港','中華人民共和国香港特別行政区'],
    MO: ['マカオ','中華人民共和国マカオ特別行政区'],
    KR: ['韓国','大韓民国'],
    TW: ['台湾','台灣','臺灣'],
    RU: ['ロシア','ロシア連邦'],
    AE: ['アラブ首長国連邦','UAE'],
    CZ: ['チェコ','チェコ共和国'],
    MM: ['ミャンマー','ミャンマー (ビルマ)','ビルマ'],
    TL: ['東ティモール','ティモール・レステ'],
    CI: ['コートジボワール','象牙海岸'],
    CD: ['コンゴ民主共和国','コンゴ民主共和国(キンシャサ)'],
    CG: ['コンゴ共和国','コンゴ共和国(ブラザビル)']
  };
  const norm = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[\s・･／/()（）._-]+/g, '');
  const aliases = [country, ...(aliasMap[code] || [])].filter(Boolean);
  const allCountryValues = [...document.querySelectorAll('[data-country]')].map(node => node.dataset.country).filter(Boolean);
  const dataAlias = aliases.find(alias => allCountryValues.some(value => {
    const a = norm(alias), v = norm(value);
    return v === a || v.includes(a) || a.includes(v);
  }));
  const chosen = dataAlias || country;

  function neutralizeOtherFilters() {
    document.querySelectorAll('select').forEach(select => {
      const key = `${select.id || ''} ${select.name || ''}`;
      if (/year|sort|scope|language|lang/i.test(key)) return;
      if (/country/i.test(key)) return;
      const neutral = [...select.options].find(option => option.value === '' || option.value === 'all' || /すべて|全地域|全件/.test(option.textContent || ''));
      if (neutral && select.value !== neutral.value) {
        select.value = neutral.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
  function setCountrySelect() {
    const selects = [...document.querySelectorAll('select')].filter(select => {
      const key = `${select.id || ''} ${select.name || ''}`;
      return /country/i.test(key) || /国|地域/.test(select.getAttribute('aria-label') || '');
    });
    for (const select of selects) {
      const option = [...select.options].find(item => aliases.some(alias => {
        const a = norm(alias), t = norm(item.textContent), v = norm(item.value);
        return t === a || v === a || t.includes(a) || a.includes(t);
      }));
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }
  function setSearch() {
    const input = document.getElementById('q') || document.querySelector('input[type="search"],input[placeholder*="検索"],input[placeholder*="会社名"]');
    if (!input) return false;
    if (input.value !== chosen) {
      input.value = chosen;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }
  function apply() {
    neutralizeOtherFilters();
    window.setTimeout(() => {
      setCountrySelect();
      setSearch();
    }, 40);
  }
  function addBanner() {
    if (document.querySelector('.mb-country-context-banner')) return;
    const style = document.createElement('style');
    style.textContent = '.mb-country-context-banner{margin:12px auto 18px;max-width:960px;padding:13px 16px;border:2px solid #b9daf7;border-radius:16px;background:#eef7ff;color:#153e67;display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:800}.mb-country-context-banner div{display:flex;gap:10px;flex-wrap:wrap}.mb-country-context-banner a{color:#086bc7;text-decoration:none;background:#fff;border:1px solid #bdd9f2;border-radius:999px;padding:6px 10px;font-size:.82rem}@media(max-width:640px){.mb-country-context-banner{display:block;margin:10px 14px 16px}.mb-country-context-banner div{margin-top:10px}}';
    document.head.append(style);
    const banner = document.createElement('aside');
    banner.className = 'mb-country-context-banner';
    const returnUrl = `index.html?open_country=${encodeURIComponent(code)}`;
    const clear = new URL(window.location.href);
    ['mb_country','mb_country_code','mb_from'].forEach(key => clear.searchParams.delete(key));
    const clearHref = `${clear.pathname.split('/').pop()}${clear.search}`;
    banner.innerHTML = `<span>${country}のデータを表示中</span><div><a href="${returnUrl}">国情報へ戻る</a><a href="${clearHref}">条件を解除</a></div>`;
    const host = document.querySelector('main') || document.querySelector('.wrap') || document.body;
    host.insertAdjacentElement('afterbegin', banner);
  }
  function start() {
    addBanner();
    apply();
    [200, 700, 1500].forEach(ms => window.setTimeout(apply, ms));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
