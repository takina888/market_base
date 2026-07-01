// V92 internal history reflected: keeps V85-V91 UI/link fixes, uses internal-file recovered retail master, and displays Priority4 READY rice/school staging rows
// V87: navigation/home view hardening + normalized non-cropped inline SVG flags.
const FLAG_SVG_DIR_MAP = {};
const METRICS = {
  population:{label:{ja:'人口',en:'Population',zh_tw:'人口',zh_cn:'人口'}, unit:'people', ranking:'population'},
  area_land_km2:{label:{ja:'面積',en:'Land area',zh_tw:'面積',zh_cn:'面积'}, unit:'km²', ranking:'area_land_km2', aliases:['area']},
  gdp_current_usd:{label:{ja:'GDP（名目）',en:'GDP, current USD',zh_tw:'GDP（名目）',zh_cn:'GDP（名义）'}, unit:'USD', ranking:'gdp_current_usd'},
  gdp_pc_current_usd:{label:{ja:'1人当たりGDP',en:'GDP per capita',zh_tw:'人均GDP',zh_cn:'人均GDP'}, unit:'USD/person', ranking:'gdp_pc_current_usd', aliases:['gdp_per_capita_current_usd']},
  population_density:{label:{ja:'人口密度',en:'Population density',zh_tw:'人口密度',zh_cn:'人口密度'}, unit:'people/km²', ranking:'population_density'}
};
const UI_METRICS = Object.keys(METRICS);
const MARKET_DOMAINS = {
  market:{title:'市場・小売', lead:'コンビニ・スーパーマーケット・GMS・ハイパーマーケットを、国別市場の見え方として整理します。', icon:'🏪', items:[['convenience_store','コンビニ'],['supermarket','スーパーマーケット'],['gms','GMS'],['hypermarket','ハイパーマーケット']]},
  rice:{title:'米データ', lead:'米生産量・輸入量・輸出量・1人当たり供給量を国別に整理するカテゴリです。', icon:'🍚', items:[['rice_production','米生産量'],['rice_import','米輸入量'],['rice_export','米輸出量'],['rice_food_supply','1人当たり米供給量']]},
  school:{title:'学校給食', lead:'学校給食データは整理中です。公開用の確認済みデータのみ表示します。', icon:'🏫', items:[['school_meal_system','学校給食制度'],['school_meal_target','対象'],['rice_school_meal','米飯給食'],['policy_note','制度メモ']]},
  japan:{title:'日本関連', lead:'在留邦人数、日本食レストラン、日本への信頼度・好感度などを整理します。', icon:'🇯🇵', items:[['japanese_residents','在留邦人数'],['japanese_restaurants','日本食レストラン'],['favorability_japan','対日好感度'],['trust_japan','日本への信頼度']]}
};
const I18N = {
  ja:{heroTitle:'196の国・地域を、ひと目で比較。',heroText:'基本統計を入口に、市場・小売、米データ、学校給食、日本関連情報を国・地域ごとに確認できます。',heroSearch:'国・地域を探す',heroQa:'データ状態を見る',kpiEntities:'国・地域',kpiMetrics:'基本指標',kpiGdp:'GDP系',kpiRelease:'データ',scopeTitle:'196枠は維持',scopeText:'台湾・香港（中国）・マカオ（中国）を含む',rankTitle:'ランキングは採用値のみ',rankText:'欠損値は順位から除外',gapTitle:'GDP未完5地域',gapText:'国・地域ページには残し、未採用として表示',tabCountries:'国・地域',tabRankings:'ランキング',tabCompare:'比較',tabSources:'出典',tabQA:'データ状態',countriesTitle:'国・地域一覧',countriesLead:'検索・地域フィルタから詳細を確認できます。',rankingsTitle:'ランキング',rankingsLead:'採用済みデータだけで順位を作成しています。',compareTitle:'比較',compareLead:'2つの国・地域を選び、5つの基本指標を横並びで確認します。',sourcesTitle:'出典',sourcesLead:'各データの年・出典・状態を確認できます。',qaTitle:'データ状態',qaLead:'データの収録状況と未取得項目を確認できます。',rankingNotice:'人口・面積・人口密度は196/196、GDP系は191/196です。',sourceNotice:'未採用・欠損値は — と status で表示し、ランキングには入れません。',qaNotice:'196枠は維持し、GDP系5地域は未完として扱います。一部のGDP指標は未取得として表示します。',detail:'詳細',search:'国・地域を検索',allRegions:'All regions',allMetrics:'All metrics',allStatus:'All status',missingOnly:'Missing only',readyOnly:'Ready only',coverage:'対象',adoptedOnly:'採用済みデータのみ',missing:'未採用・未取得',noResults:'該当なし',source:'出典',overviewTitle:'基本指標のカバー状況',overviewLead:'カードを押すと、その指標のランキングへ移動します。',gapPanelTitle:'未完5地域の扱い',gapPanelText:'196枠から外さず、GDP系だけ未採用・ランキング対象外として表示します。',quickCompareTitle:'すぐ比較',quickCompareText:'代表的な組み合わせで比較画面を開きます。',rcNoticeTitle:'支援196個國家／地區',rcNoticeText:'196の国・地域を対象に、基本統計・市場情報・出典を確認できます。GDP系の一部は未取得として表示します。',workflowTitle:'迷わず使う',workflowLead:'探す・比べる・確認する導線を短くしました。',workflowStep1:'国・地域を探す',workflowStep2:'ランキングを見る',workflowStep3:'2地域を比較',workflowStep4:'出典を確認',workflowStep5:'出典を確認',gdpGapOnly:'GDP未完のみ',clearSearch:'検索解除',rankLimit20:'上位20件',rankLimit50:'上位50件',rankLimitAll:'全件表示',sourceLimit60:'60件まで',sourceLimit200:'200件まで',sourceLimitAll:'全件表示',showingLimited:'一部表示中'},
  en:{heroTitle:'Compare 196 countries and areas at a glance.',heroText:'Use core statistics as the entry point to review market/retail, rice, school meals, and Japan-related information by country or area.',heroSearch:'Find countries/areas',heroQa:'View data status',kpiEntities:'countries/areas',kpiMetrics:'metrics',kpiGdp:'GDP metrics',kpiRelease:'data',scopeTitle:'196 scope kept',scopeText:'Includes Taiwan, Hong Kong (China), and Macao (China)',rankTitle:'Rankings use adopted values',rankText:'Missing values are excluded from ranks',gapTitle:'5 GDP gaps',gapText:'Kept in entity pages and shown as not adopted',tabCountries:'Countries/Areas',tabRankings:'Rankings',tabCompare:'Compare',tabSources:'Sources',tabQA:'データ状態',countriesTitle:'Countries / Areas',countriesLead:'Search and filter by region to open details.',rankingsTitle:'Rankings',rankingsLead:'Ranks are built only from adopted values.',compareTitle:'Compare',compareLead:'Select two countries/areas and compare the five basic metrics.',sourcesTitle:'Sources',sourcesLead:'Check year, source, and status for each data point.',qaTitle:'Data status',qaLead:'Data coverage summary for the 196-country/area dataset.',rankingNotice:'Population, area, and density are 196/196. GDP metrics are 191/196.',sourceNotice:'Missing or not-adopted values are shown with — and status, and are excluded from rankings.',qaNotice:'The 196 scope is kept. GDP metrics for 5 areas remain incomplete. Some GDP metrics remain marked as missing.',detail:'Detail',search:'Search country/area',allRegions:'All regions',allMetrics:'All metrics',allStatus:'All status',missingOnly:'Missing only',readyOnly:'Ready only',coverage:'Coverage',adoptedOnly:'adopted values only',missing:'missing / not adopted',noResults:'No results',source:'source',overviewTitle:'Basic metric coverage',overviewLead:'Tap a card to open that metric ranking.',gapPanelTitle:'How the 5 gaps are handled',gapPanelText:'They remain in the 196 scope, with GDP metrics shown as not adopted and excluded from affected rankings.',quickCompareTitle:'Quick compare',quickCompareText:'Open representative country/area pairs in the compare view.',rcNoticeTitle:'196 countries and areas',rcNoticeText:'Covers 196 countries and areas. Some GDP metrics are shown as missing when not available.',workflowTitle:'Fast flow',workflowLead:'Shorter path for search, ranking, comparison, and sources.',workflowStep1:'Find countries/areas',workflowStep2:'View rankings',workflowStep3:'Compare two areas',workflowStep4:'Check sources',workflowStep5:'Check sources',gdpGapOnly:'GDP gaps only',clearSearch:'Clear search',rankLimit20:'Top 20',rankLimit50:'Top 50',rankLimitAll:'Show all',sourceLimit60:'Show 60',sourceLimit200:'Show 200',sourceLimitAll:'Show all',showingLimited:'showing limited results'},
  zh_tw:{heroTitle:'一眼比較196個國家／地區。',heroText:'以基本統計為入口，依國家・地區確認市場・零售、稻米、學校供餐與日本相關資訊。',heroSearch:'搜尋國家／地區',heroQa:'查看資料狀態',kpiEntities:'國家／地區',kpiMetrics:'基本指標',kpiGdp:'GDP指標',kpiRelease:'資料',scopeTitle:'維持196範圍',scopeText:'包含台灣、香港（中國）、澳門（中國）',rankTitle:'排名只用採用值',rankText:'缺漏值不進入排名',gapTitle:'5個GDP未完',gapText:'保留於頁面並顯示為未採用',tabCountries:'國家／地區',tabRankings:'排名',tabCompare:'比較',tabSources:'來源',tabQA:'データ状態',countriesTitle:'國家／地區列表',countriesLead:'可搜尋並依地區篩選。',rankingsTitle:'排名',rankingsLead:'僅以已採用資料建立排名。',compareTitle:'比較',compareLead:'選擇兩個國家／地區，橫向比較5個基本指標。',sourcesTitle:'來源',sourcesLead:'確認各資料的年份、來源與狀態。',qaTitle:'資料狀態',qaLead:'資料收錄狀況摘要。',rankingNotice:'人口、面積、人口密度為196/196，GDP指標為191/196。',sourceNotice:'未採用或缺漏值以 — 與status顯示，不進入排名。',qaNotice:'維持196範圍，GDP指標有5個地區未完。部分GDP指標以未取得顯示。',detail:'詳情',search:'搜尋國家／地區',allRegions:'All regions',allMetrics:'All metrics',allStatus:'All status',missingOnly:'Missing only',readyOnly:'Ready only',coverage:'對象',adoptedOnly:'僅已採用資料',missing:'未採用／未取得',noResults:'無結果',source:'來源',overviewTitle:'基本指標覆蓋狀態',overviewLead:'點選卡片即可切換到該指標排名。',gapPanelTitle:'5個未完地區的處理',gapPanelText:'不從196範圍移除，GDP指標顯示為未採用並排除於相關排名。',quickCompareTitle:'快速比較',quickCompareText:'用代表性組合開啟比較畫面。',rcNoticeTitle:'支援196個國家／地區',rcNoticeText:'支援196個國家／地區。部分GDP資料以未取得顯示。',workflowTitle:'快速使用流程',workflowLead:'縮短搜尋、排名、比較與來源的動線。',workflowStep1:'搜尋國家／地區',workflowStep2:'查看排名',workflowStep3:'比較兩個地區',workflowStep4:'確認來源',workflowStep5:'確認來源',gdpGapOnly:'僅GDP未完',clearSearch:'清除搜尋',rankLimit20:'前20筆',rankLimit50:'前50筆',rankLimitAll:'顯示全部',sourceLimit60:'最多60筆',sourceLimit200:'最多200筆',sourceLimitAll:'顯示全部',showingLimited:'部分顯示中'},
  zh_cn:{heroTitle:'一眼比较196个国家／地区。',heroText:'以基本统计为入口，按国家／地区确认市场零售、稻米、学校供餐与日本相关信息。',heroSearch:'搜索国家／地区',heroQa:'查看数据状态',kpiEntities:'国家／地区',kpiMetrics:'基本指标',kpiGdp:'GDP指标',kpiRelease:'数据',scopeTitle:'维持196范围',scopeText:'包含台湾、香港（中国）、澳门（中国）',rankTitle:'排名只用采用值',rankText:'缺漏值不进入排名',gapTitle:'5个GDP未完',gapText:'保留于页面并显示为未采用',tabCountries:'国家／地区',tabRankings:'排名',tabCompare:'比较',tabSources:'来源',tabQA:'データ状態',countriesTitle:'国家／地区列表',countriesLead:'可搜索并按地区筛选。',rankingsTitle:'排名',rankingsLead:'仅以已采用数据建立排名。',compareTitle:'比较',compareLead:'选择两个国家／地区，横向比较5个基本指标。',sourcesTitle:'来源',sourcesLead:'确认各数据的年份、来源与状态。',qaTitle:'数据状态',qaLead:'数据收录状况摘要。',rankingNotice:'人口、面积、人口密度为196/196，GDP指标为191/196。',sourceNotice:'未采用或缺漏值以 — 和status显示，不进入排名。',qaNotice:'维持196范围，GDP指标有5个地区未完。部分GDP指标以未取得显示。',detail:'详情',search:'搜索国家／地区',allRegions:'All regions',allMetrics:'All metrics',allStatus:'All status',missingOnly:'Missing only',readyOnly:'Ready only',coverage:'对象',adoptedOnly:'仅已采用数据',missing:'未采用／未取得',noResults:'无结果',source:'来源',overviewTitle:'基本指标覆盖状态',overviewLead:'点击卡片即可切换到该指标排名。',gapPanelTitle:'5个未完地区的处理',gapPanelText:'不从196范围移除，GDP指标显示为未采用并排除于相关排名。',quickCompareTitle:'快速比较',quickCompareText:'用代表性组合打开比较画面。',rcNoticeTitle:'支持196个国家／地区',rcNoticeText:'支持196个国家／地区。部分GDP数据以未取得显示。',workflowTitle:'快速使用流程',workflowLead:'缩短搜索、排名、比较与来源的动线。',workflowStep1:'搜索国家／地区',workflowStep2:'查看排名',workflowStep3:'比较两个地区',workflowStep4:'确认来源',workflowStep5:'确认来源',gdpGapOnly:'仅GDP未完',clearSearch:'清除搜索',rankLimit20:'前20条',rankLimit50:'前50条',rankLimitAll:'显示全部',sourceLimit60:'最多60条',sourceLimit200:'最多200条',sourceLimitAll:'显示全部',showingLimited:'部分显示中'}
};
let lang='ja';
let entities=[];
let rankings={};
let retailData=null;
let retailPresenceData=null;
let riceData=null;
let riceRankings={};
let priority4ReadyData=null;
let wdiCountryMetadata=null;
let japanRelatedData=null;
let japanRelatedRankings={};

const SEARCH_ALIASES={
  JP:['日本','日本国','japan','nihon','nippon','jpn','jp'],
  US:['米国','アメリカ','アメリカ合衆国','usa','u.s.','u.s.a.','united states','united states of america','america','us'],
  GB:['英国','イギリス','uk','u.k.','great britain','britain','united kingdom','gb'],
  CN:['中国','中華人民共和国','china','prc','cn'],
  TW:['台湾','臺灣','台灣','taiwan','tw','roc'],
  HK:['香港','香港（中国）','hong kong','hongkong','hk'],
  MO:['マカオ','澳門','澳门','macao','macau','mo'],
  KR:['韓国','大韓民国','south korea','korea republic','republic of korea','korea','kr'],
  KP:['北朝鮮','朝鮮民主主義人民共和国','north korea','dprk','korea dem. people','kp'],
  RU:['ロシア','ロシア連邦','russia','russian federation','ru'],
  VN:['ベトナム','越南','vietnam','viet nam','vn'],
  TH:['タイ','タイ王国','thailand','thai','th'],
  SG:['シンガポール','singapore','sg'],
  ID:['インドネシア','indonesia','id'],
  MY:['マレーシア','malaysia','my'],
  PH:['フィリピン','philippines','ph'],
  MM:['ミャンマー','ビルマ','myanmar','burma','mm'],
  LA:['ラオス','laos','lao pdr','la'],
  KH:['カンボジア','cambodia','kh'],
  IN:['インド','india','in'],
  AE:['アラブ首長国連邦','uae','u.a.e.','emirates','united arab emirates','ae'],
  TR:['トルコ','turkey','turkiye','türkiye','tr'],
  CZ:['チェコ','czech','czechia','czech republic','cz'],
  CI:['コートジボワール','象牙海岸','cote d ivoire','côte d’ivoire','ivory coast','ci'],
  VA:['バチカン','vatican','holy see','va'],
  PS:['パレスチナ','palestine','west bank and gaza','ps'],

  AU:['オーストラリア','australia','au'],
  CA:['カナダ','canada','ca'],
  MX:['メキシコ','mexico','mx'],
  BR:['ブラジル','brazil','br'],
  AR:['アルゼンチン','argentina','ar'],
  DE:['ドイツ','germany','deutschland','de'],
  FR:['フランス','france','fr'],
  IT:['イタリア','italy','it'],
  ES:['スペイン','spain','es'],
  NL:['オランダ','netherlands','holland','nl'],
  CH:['スイス','switzerland','ch'],
  SE:['スウェーデン','sweden','se'],
  NO:['ノルウェー','norway','no'],
  FI:['フィンランド','finland','fi'],
  DK:['デンマーク','denmark','dk'],
  PL:['ポーランド','poland','pl'],
  UA:['ウクライナ','ukraine','ua'],
  SA:['サウジアラビア','saudi arabia','saudi','sa'],
  QA:['カタール','qatar','qa'],
  IL:['イスラエル','israel','il'],
  EG:['エジプト','egypt','eg'],
  ZA:['南アフリカ','south africa','za'],
  NG:['ナイジェリア','nigeria','ng'],
  KE:['ケニア','kenya','ke'],
  NZ:['ニュージーランド','new zealand','nz'],
};
const SUBREGION_PRESET_LABELS={
  'Eastern Asia':'東アジア', 'South-eastern Asia':'東南アジア', 'Southern Asia':'南アジア', 'Central Asia':'中央アジア', 'Western Asia':'中東・西アジア',
  'Northern Europe':'北欧', 'Western Europe':'西欧', 'Eastern Europe':'東欧', 'Southern Europe':'南欧',
  'Northern America':'北米', 'Central America':'中米', 'South America':'南米', 'Caribbean':'カリブ',
  'Northern Africa':'北アフリカ', 'Western Africa':'西アフリカ', 'Middle Africa':'中部アフリカ', 'Eastern Africa':'東アフリカ', 'Southern Africa':'南部アフリカ',
  'Australia and New Zealand':'豪州・NZ', 'Melanesia':'メラネシア', 'Micronesia':'ミクロネシア', 'Polynesia':'ポリネシア'
};
let activeSubregionPreset='all';
function normalizeSearchText(v){
  return String(v||'')
    .toLowerCase()
    .normalize('NFKC')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[’‘`]/g,"'")
    .replace(/[&＋+]/g,' and ')
    .replace(/[\.。・,，、（）()\[\]／\/\-_]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function aliasTextForEntity(e){
  const ids=[e.entity_id,e.iso2,e.iso3].filter(Boolean).map(x=>String(x).toUpperCase());
  const aliases=[];
  ids.forEach(id=>{ if(SEARCH_ALIASES[id]) aliases.push(...SEARCH_ALIASES[id]); });
  return aliases.join(' ');
}
function entitySearchText(e){
  const incCode=incomeCode(e);
  const incLabel=incomeLabel(e);
  return normalizeSearchText([
    e.entity_id,e.iso2,e.iso3,e.numeric_code,flagText(e),nameOf(e),
    e.names?.ja,e.names?.short_ja,e.names?.en,e.names?.zh_tw,e.names?.zh_cn,
    e.region,e.subregion,SUBREGION_PRESET_LABELS[e.subregion],incCode,incLabel,aliasTextForEntity(e)
  ].join(' '));
}
function queryMatchesEntity(e, q){
  const nq=normalizeSearchText(q);
  if(!nq) return true;
  const text=entitySearchText(e);
  const textTokens=text.split(' ').filter(Boolean);
  if(/^[a-z0-9]{1,3}$/.test(nq)) return textTokens.includes(nq);
  if(textTokens.includes(nq)) return true;
  if(text.includes(nq)) return true;
  return nq.split(' ').filter(Boolean).every(token=>textTokens.includes(token) || text.includes(token));
}
function subregionMatches(e, preset){
  if(!preset || preset==='all') return true;
  return String(preset).split('|').filter(Boolean).includes(e.subregion);
}
function setSubregionPreset(value){
  activeSubregionPreset=value || 'all';
  const sub=document.getElementById('subregionFilter');
  if(sub) sub.value=activeSubregionPreset;
}
function updateSubregionOptions(){
  const sub=document.getElementById('subregionFilter');
  if(!sub) return;
  const region=document.getElementById('regionFilter')?.value || 'all';
  const subs=[...new Set(entities.filter(e=>region==='all'||e.region===region).map(e=>e.subregion).filter(Boolean))].sort();
  const current=sub.value || activeSubregionPreset || 'all';
  sub.innerHTML='<option value="all">小地域すべて</option>'+subs.map(sr=>`<option value="${safe(sr)}">${safe(SUBREGION_PRESET_LABELS[sr] || sr)}</option>`).join('');
  sub.value=subs.includes(current) ? current : 'all';
  activeSubregionPreset=sub.value;
}
let japaneseRestaurantsOverview=null;
let overseasJapaneseResidentsOverview=null;
let retailExpanded={};
let currentDetailEntityId=null;
const t = key => (I18N[lang] && I18N[lang][key]) || I18N.ja[key] || key;
const safe = v => String(v ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const usableUrl = v => /^https?:\/\/[^\s<>"']+$/i.test(String(v || '').trim());
function sourceLink(url, label='出典'){
  const u=String(url || '').trim();
  if(!usableUrl(u)) return `<span class="url disabled" aria-disabled="true">出典リンク未設定</span>`;
  return `<a class="url" href="${safe(u)}" target="_blank" rel="noreferrer">${safe(label)}</a>`;
}
function retailSourceUrl(record){
  if(usableUrl(record?.source_url)) return record.source_url;
  const counts=record?.store_counts || [];
  const hit=counts.find(c=>usableUrl(c?.source_url));
  return hit?.source_url || '';
}
function getStat(entity, metric){
  const stats = entity.basic_stats || {};
  if(stats[metric]) return stats[metric];
  for(const a of (METRICS[metric]?.aliases || [])) if(stats[a]) return stats[a];
  return {};
}
function isMissing(stat){ return !stat || stat.value===null || stat.value===undefined || stat.value===''; }
function nameOf(e){ return e.names?.[lang] || e.names?.ja || e.names?.en || e.entity_id; }
function metricName(m){ return METRICS[m]?.label?.[lang] || METRICS[m]?.label?.ja || m; }
function sourceLine(stat){ return `${stat?.data_year || '—'} / ${stat?.source_name || stat?.source_id || '出典確認中'}`; }
function fmt(v, metric){
  if(v===null || v===undefined || v==='') return '—';
  const n=Number(v);
  if(!Number.isFinite(n)) return safe(v);
  if(metric==='gdp_current_usd'){
    if(Math.abs(n)>=1e12) return '$' + (n/1e12).toFixed(2) + 'T';
    if(Math.abs(n)>=1e9) return '$' + (n/1e9).toFixed(2) + 'B';
    if(Math.abs(n)>=1e6) return '$' + (n/1e6).toFixed(2) + 'M';
    return '$' + Math.round(n).toLocaleString();
  }
  if(metric==='gdp_pc_current_usd') return '$' + Math.round(n).toLocaleString();
  if(metric==='population_density') return n.toLocaleString(undefined,{maximumFractionDigits:1});
  return Math.round(n).toLocaleString();
}
function rankingKey(metric){ return METRICS[metric]?.ranking || metric; }
function getRanking(metric){
  const key=rankingKey(metric);
  if(rankings[key]) return rankings[key];
  for(const a of (METRICS[metric]?.aliases||[])) if(rankings[a]) return rankings[a];
  return null;
}
function coverageText(metric){ return (metric==='gdp_current_usd'||metric==='gdp_pc_current_usd') ? '191 / 196' : '196 / 196'; }

function coverageClass(metric){ return (metric==='gdp_current_usd'||metric==='gdp_pc_current_usd') ? 'partial' : 'complete'; }
function metricShortNote(metric){ return (metric==='gdp_current_usd'||metric==='gdp_pc_current_usd') ? '5 areas not adopted' : 'complete'; }
function hasAnyGap(entity){ return UI_METRICS.some(m=>isMissing(getStat(entity,m))); }
function hasGdpGap(entity){ return isMissing(getStat(entity,'gdp_current_usd')) || isMissing(getStat(entity,'gdp_pc_current_usd')); }
function sourceYear(stat){ return stat?.data_year || '—'; }

function incomeRecord(e){ return e?.income_classification || null; }
function incomeLabel(e){
  const r=incomeRecord(e); if(!r) return '—';
  if(lang==='en') return r.income_group_en || r.income_group_ja || '—';
  if(lang==='zh_tw') return r.income_group_zh_tw || r.income_group_ja || '—';
  if(lang==='zh_cn') return r.income_group_zh_cn || r.income_group_ja || '—';
  return r.income_group_ja || r.income_group_en || '—';
}
function incomeSourceLine(r){ return r ? `${r.fiscal_year || '—'} / ${r.source_name || '出典確認中'}` : '—'; }

function incomeCode(entity){
  return entity?.income_classification?.income_group_code || entity?.income_group_code || 'UNCLASSIFIED';
}

function incomeCodeLabel(code){
  const map={LIC:'低所得国',LMC:'下位中所得国',UMC:'上位中所得国',HIC:'高所得国',UNCLASSIFIED:'未分類'};
  return map[code] || code || '—';
}

function flagBoxSize(cls){
  const c=String(cls||'');
  if(c.includes('detail')) return {w:32,h:22};
  if(c.includes('hero')) return {w:48,h:34};
  if(c.includes('table') || c.includes('inline')) return {w:36,h:25};
  return {w:56,h:39};
}
function flagMarkup(e, cls='flag-img'){
  const id = safe(e?.entity_id || '');
  const emoji = safe(e?.flag_emoji || '');
  const name = safe(nameOf(e || {}));
  const size=flagBoxSize(cls);
  const boxStyle=`width:${size.w}px;height:${size.h}px;min-width:${size.w}px;min-height:${size.h}px;max-width:${size.w}px;max-height:${size.h}px;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;border-radius:5px;box-shadow:0 0 0 1px rgba(15,23,42,.14);line-height:1;vertical-align:middle;`;
  if(!id) return `<span class="flag-fallback-only ${safe(cls)}" style="${boxStyle}font-size:${Math.max(18, Math.round(size.h*.72))}px;box-shadow:none;background:transparent;">${emoji}</span>`;
  const key=String(id).toUpperCase();
  const rawSvg = window.MARKET_BASE_FLAG_SVG_DATA && window.MARKET_BASE_FLAG_SVG_DATA[key];
  if(rawSvg){
    const svg = String(rawSvg)
      .replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;max-width:100%;max-height:100%;display:block;object-fit:contain;flex:0 0 auto;" ')
      .replace('class="flag-inline-svg"', 'class="flag-inline-svg flag-svg-contained"');
    return `<span class="flag-asset ${safe(cls)}" role="img" aria-label="${name} flag" style="${boxStyle}">${svg}<span class="flag-emoji-fallback">${emoji}</span></span>`;
  }
  return `<span class="flag-fallback-only ${safe(cls)}" role="img" aria-label="${name} flag" style="${boxStyle}font-size:${Math.max(18, Math.round(size.h*.72))}px;box-shadow:none;background:transparent;">${emoji}</span>`;
}
function flagText(e){ return e?.flag_emoji || ''; }

function renderMetricOverview(){
  const el=document.getElementById('metricOverview'); if(!el) return;
  el.innerHTML=UI_METRICS.map(m=>`<button class="metric-tile ${coverageClass(m)}" data-metric-jump="${safe(m)}"><span class="metric-label">${safe(metricName(m))}</span><span class="metric-count">${coverageText(m)}</span><span class="metric-note">${safe(metricShortNote(m))}</span></button>`).join('');
  el.querySelectorAll('[data-metric-jump]').forEach(btn=>btn.addEventListener('click',()=>{ document.getElementById('metricSelect').value=btn.dataset.metricJump; renderRankings(); switchView('rankings'); }));
}
function renderKnownGaps(){
  const el=document.getElementById('knownGapList'); if(!el) return;
  const gaps=entities.filter(e=>hasGdpGap(e));
  el.innerHTML=gaps.map(e=>`<span class="gap-pill">${flagText(e)} ${safe(nameOf(e))}</span>`).join('') || '<span class="gap-pill">none</span>';
}
function getRecentEntityIds(){
  try{
    const raw=localStorage.getItem('market_base_recent_entities_v1');
    const arr=JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr.filter(Boolean).slice(0,6) : [];
  }catch(e){ return []; }
}
function setRecentEntityIds(ids){
  try{ localStorage.setItem('market_base_recent_entities_v1', JSON.stringify(ids.slice(0,6))); }catch(e){}
}
function rememberEntity(id){
  if(!id) return;
  const ids=[id, ...getRecentEntityIds().filter(x=>x!==id)].slice(0,6);
  setRecentEntityIds(ids);
  renderRecentEntities();
}
function renderRecentEntities(){
  const el=document.getElementById('recentEntityGrid'); if(!el) return;
  const ids=getRecentEntityIds();
  const recent=ids.map(id=>entities.find(e=>e.entity_id===id)).filter(Boolean);
  if(!recent.length){
    el.innerHTML=`<article class="recent-empty-card"><strong>まだ履歴はありません</strong><span>国・地域の詳細を開くと、ここに最大6件まで表示されます。固定の注目国やおすすめ国は表示しません。</span></article>`;
    return;
  }
  el.innerHTML=recent.map((e,i)=>`<button class="visual-card ${i===0?'visual-card-main':''}" data-recent-open="${safe(e.entity_id)}"><span class="${i===0?'big-flag':''}">${flagMarkup(e, i===0?'flag-img-hero':'flag-img-card')}</span><strong>${safe(nameOf(e))}</strong><em>最近見た</em></button>`).join('');
  el.querySelectorAll('[data-recent-open]').forEach(btn=>btn.addEventListener('click',()=>openDetail(btn.dataset.recentOpen)));
}
function applyPreset(pair){
  const [a,b]=pair.split(',');
  if(entities.some(e=>e.entity_id===a)) document.getElementById('compareA').value=a;
  if(entities.some(e=>e.entity_id===b)) document.getElementById('compareB').value=b;
  renderCompare(); switchView('compare');
}
function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent=t(el.dataset.i18n); });
  document.getElementById('searchInput').placeholder=t('search');
  document.querySelector('#regionFilter option[value="all"]').textContent=t('allRegions');
  document.querySelector('#sourceMetricFilter option[value="all"]').textContent=t('allMetrics');
  document.querySelector('#sourceStatusFilter option[value="all"]').textContent=t('allStatus');
  document.querySelector('#sourceStatusFilter option[value="missing"]').textContent=t('missingOnly');
  document.querySelector('#sourceStatusFilter option[value="ready"]').textContent=t('readyOnly');
}
function switchView(view, opts={}){
  const target=document.getElementById(view);
  if(!target) return;
  document.body.classList.add('mb-view-active');
  document.querySelectorAll('.tab,.bottom-tab,.view').forEach(x=>x.classList.remove('active'));
  document.querySelector(`.tab[data-view="${view}"]`)?.classList.add('active');
  document.querySelector(`.bottom-tab[data-view="${view}"]`)?.classList.add('active');
  target.classList.add('active');
  const shouldScroll = opts.scroll !== false;
  if(shouldScroll){
    setTimeout(()=>target.scrollIntoView({behavior:'smooth', block:'start'}), 30);
  }
}
function showHome(){
  document.body.classList.remove('mb-view-active');
  document.querySelectorAll('.tab,.bottom-tab,.view').forEach(x=>x.classList.remove('active'));
  document.querySelector('.bottom-tab[data-home="true"]')?.classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
}


function getRetailEntity(entityId){
  const list = retailData?.entities || [];
  return list.find(x=>x.entity_id===entityId) || {retail_channels:[], retail_record_count:0};
}
function getRetailPresenceEntity(entityId){
  const list = retailPresenceData?.entities || [];
  return list.find(x=>x.entity_id===entityId) || {chains:[], chain_record_count:0};
}
function retailRecordsForEntity(entityId){
  return (getRetailEntity(entityId).retail_channels || []).filter(r=>r && r.store_count !== null && r.store_count !== undefined && r.store_count !== '');
}
function retailChainsForEntity(entityId){
  return (getRetailPresenceEntity(entityId).chains || []).filter(c=>c && c.presence_status !== 'absent');
}
function storeCountText(record){
  const n=Number(record.store_count);
  const value=Number.isFinite(n) ? n.toLocaleString() : safe(record.store_count);
  const unitRaw=record.unit || '';
  const unit=(unitRaw==='stores' || unitRaw==='outlets') ? '店' : (unitRaw || '');
  return `${value}${unit}`;
}
function retailInfoClass(record){
  const t=record.display_info_type || '';
  if(t.includes('公式')) return 'retail-official';
  if(t.includes('準公式')) return 'retail-semi';
  if(t.includes('参考')) return 'retail-reference';
  if(t.includes('過去')) return 'retail-history';
  return 'retail-reference';
}
function brandOriginText(record){
  return record.brand_origin_country ? `ブランド出身国：${safe(record.brand_origin_country)}` : '';
}
function storeCountsFromChain(chain){
  return (chain.store_counts || []).filter(r=>r && r.store_count !== null && r.store_count !== undefined && r.store_count !== '');
}
function retailStoreCountLine(record){
  const info=record.display_info_type || (record.source_type==='official'?'公式情報':record.source_type==='semi_official'?'準公式情報':'参考値');
  const date=record.data_date || record.as_of_date || '時点未設定';
  return `<em>${storeCountText(record)}</em><span class="retail-info-chip">${safe(date)}・${safe(info)}</span>`;
}
function retailRecordCard(record){
  const origin=brandOriginText(record);
  const link=sourceLink(retailSourceUrl(record), '出典');
  return `<article class="market-data-card retail-record-card ${retailInfoClass(record)}"><div class="retail-card-head"><strong>${safe(record.chain_name || record.retail_format_display_ja || '小売データ')}</strong><span>${safe(record.retail_format_display_ja || record.channel_type || record.retail_format_id || 'retail')}</span></div>${retailStoreCountLine(record)}${origin?`<span class="retail-origin-chip">${origin}</span>`:''}<p class="retail-note">${safe(record.note || '')}</p><div class="retail-source-line">${link}</div></article>`;
}
function retailPresenceCard(chain){
  const counts=storeCountsFromChain(chain);
  const info=chain.display_info_type || (chain.source_type==='official'?'公式情報':chain.source_type==='semi_official'?'準公式情報':'参考値');
  const countHtml=counts.length
    ? counts.map(c=>retailStoreCountLine({...c, chain_name:chain.chain_name, brand_origin_country:chain.brand_origin_country})).join('')
    : `<em>進出確認あり</em><span class="retail-info-chip">${safe(chain.as_of_date || '時点未設定')}・${safe(info)}</span>`;
  const origin=brandOriginText(chain);
  const link=sourceLink(retailSourceUrl(chain), '出典');
  return `<article class="market-data-card retail-presence-card ${retailInfoClass(chain)}"><div class="retail-card-head"><strong>${safe(chain.chain_name || '小売チェーン')}</strong><span>${safe(chain.channel_type || 'retail')}</span></div>${countHtml}${origin?`<span class="retail-origin-chip">${origin}</span>`:''}<p class="retail-note">${safe(chain.note || '')}</p><div class="retail-source-line">${link}</div></article>`;
}
function retailCompactSummary(items){
  const total=items.length;
  const withCounts=items.filter(x=>(x.store_counts||[]).length || (x.store_count !== undefined && x.store_count !== null && x.store_count !== '')).length;
  const official=items.filter(x=>((x.display_info_type||'') + (x.source_type||'')).includes('公式') || (x.source_type||'').includes('official')).length;
  return `<div class="retail-compact-summary"><span>${total}チェーン</span><span>${withCounts}件に店舗数</span><span>${official}件が公式/準公式</span></div>`;
}
function retailLimitedCards(items, renderer, limit=4, scopeId='retail:summary'){
  const expanded=!!retailExpanded[scopeId];
  const visibleItems=expanded ? items : items.slice(0, limit);
  const visible=visibleItems.map(renderer).join('');
  if(items.length<=limit) return visible;
  const remaining=items.length-limit;
  const label=expanded ? '閉じる' : `もっと見る（ほか ${remaining} 件）`;
  const note=expanded ? '初期表示へ戻して、国詳細を軽く表示します。' : '初期表示は要点だけ。必要な時だけ全チェーンを展開します。';
  const state=expanded ? '全件表示中' : '小売JSONには保持済み';
  return visible + `<article class="market-data-card retail-more-card"><strong>${expanded ? `${items.length} 件表示中` : `ほか ${remaining} 件`}</strong><span>${note}</span><button class="retail-more-button" type="button" onclick="toggleRetailMore('${safe(scopeId)}')">${label}</button><em>${state}</em></article>`;
}
function toggleRetailMore(scopeId){
  retailExpanded[scopeId]=!retailExpanded[scopeId];
  if(scopeId==='retail:summary'){ renderMarketScope(); return; }
  if(scopeId.startsWith('retail:entity:')){
    const id=scopeId.split(':').pop();
    const e=entities.find(x=>x.entity_id===id);
    if(e){ renderDetailContent(e); }
  }
}
function allRetailPresenceChains(){
  return (retailPresenceData?.entities || []).flatMap(e=>(e.chains||[]).map(c=>({...c, entity_id:e.entity_id, country_area:e.country_area})));
}
function retailSummaryCards(){
  const chains=allRetailPresenceChains();
  if(chains.length) return retailCompactSummary(chains) + retailLimitedCards(chains, retailPresenceCard, 6, 'retail:summary');
  const records=(retailData?.records || []).filter(r=>r.store_count !== null && r.store_count !== undefined && r.store_count !== '');
  if(!records.length) return MARKET_DOMAINS.market.items.map(x=>notCollectedCard(x[0],x[1])).join('');
  return retailCompactSummary(records) + retailLimitedCards(records, retailRecordCard, 6, 'retail:summary');
}
function retailEntityCards(entity){
  const chains=retailChainsForEntity(entity.entity_id);
  if(chains.length) return retailCompactSummary(chains) + retailLimitedCards(chains, retailPresenceCard, 4, `retail:entity:${entity.entity_id}`);
  const records=retailRecordsForEntity(entity.entity_id);
  if(!records.length) return MARKET_DOMAINS.market.items.map(x=>notCollectedCard(x[0],x[1])).join('');
  return retailCompactSummary(records) + retailLimitedCards(records, retailRecordCard, 4, `retail:entity:${entity.entity_id}`);
}
function retailEntityHasData(entityId){
  return retailChainsForEntity(entityId).length || retailRecordsForEntity(entityId).length;
}

function notCollectedCard(key,label){
  return `<article class="market-data-card not-ready-card"><div><strong>${safe(label)}</strong><span>準備中</span></div><em>データ整理中</em></article>`;
}

const RICE_METRICS = {
  rice_production_paddy_tonnes:{label:'米生産量', short:'生産', unit:'t'},
  rice_import_quantity_tonnes:{label:'米輸入量', short:'輸入', unit:'t'},
  rice_export_quantity_tonnes:{label:'米輸出量', short:'輸出', unit:'t'},
  rice_food_supply_kg_capita_year:{label:'1人当たり米供給量', short:'供給', unit:'kg/人/年'}
};
function riceRecordForEntity(entityId){
  return (riceData?.records || []).find(r=>r.entity_id===entityId) || null;
}
function riceMetricLabel(metric){
  return RICE_METRICS[metric]?.label || metric;
}
function fmtRiceValue(obj, metric){
  if(!obj || obj.value===null || obj.value===undefined) return '未収録';
  const n=Number(obj.value);
  if(!Number.isFinite(n)) return safe(obj.value);
  if(metric==='rice_food_supply_kg_capita_year') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})} kg/年`;
  return `${Math.round(n).toLocaleString()} t`;
}
function riceSourceLine(obj){
  if(!obj) return 'FAOSTAT自動更新待ち';
  const year=obj.year ? `${obj.year}年` : '年不明';
  const src=obj.source || 'FAOSTAT';
  return `${year} / ${src}`;
}
function riceStatusSummary(){
  const records=riceData?.records || [];
  if(!records.length) return {total:196, any:0, complete:0, partial:0, notLoaded:196};
  let any=0, complete=0, partial=0, notLoaded=0;
  records.forEach(r=>{
    const loaded=Object.keys(RICE_METRICS).filter(k=>r[k]).length;
    if(loaded) any++;
    if(loaded===4) complete++;
    else if(loaded>0) partial++;
    else notLoaded++;
  });
  return {total:records.length, any, complete, partial, notLoaded};
}
function riceDataCard(metric, obj){
  const label=riceMetricLabel(metric);
  const value=fmtRiceValue(obj, metric);
  const loaded=!!obj;
  return `<article class="market-data-card rice-data-card ${loaded?'rice-loaded':'rice-empty'}"><strong>${safe(label)}</strong><span>${safe(value)}</span><em>${safe(riceSourceLine(obj))}</em></article>`;
}
function riceCardsForEntity(entity){
  const rec=riceRecordForEntity(entity.entity_id);
  return Object.keys(RICE_METRICS).map(metric=>riceDataCard(metric, rec?.[metric])).join('');
}

function priority4RowsFor(entityId, domain){
  const rows=priority4ReadyData?.rows || [];
  const seen=new Set();
  return rows.filter(r=>r.entity_id===entityId && r.domain===domain && r.import_decision==='READY_FOR_STAGING_IMPORT').filter(r=>{
    const key=[r.metric_id,r.value,r.source_id,r.period].join('|');
    if(seen.has(key)) return false;
    seen.add(key); return true;
  });
}
function priority4ValueText(row){
  const v=row?.value;
  if(v===null || v===undefined || v==='') return '確認済み候補';
  const n=Number(v);
  const unit=row.unit || '';
  if(Number.isFinite(n)){
    if(unit==='kg_per_person_per_year') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})} kg/人/年`;
    if(unit==='hectares') return `${Math.round(n).toLocaleString()} ha`;
    if(unit==='metric_tonnes' || unit==='tonnes') return `${Math.round(n).toLocaleString()} t`;
    if(unit==='kg') return `${Math.round(n).toLocaleString()} kg`;
    if(unit==='stores') return `${Math.round(n).toLocaleString()} 店`;
  }
  if(unit==='category'){
    const map={yes_targeted_low_income_primary:'対象者向け制度あり',guidelines_exist:'ガイドラインあり',project_exists:'プロジェクトあり'};
    return map[v] || String(v).replace(/_/g,' ');
  }
  return `${safe(v)}${unit ? ' '+safe(unit) : ''}`;
}
function priority4Card(row, cls='priority4-card'){
  const label=row.metric_label_ja || row.metric_id || '掘り起こしデータ';
  const value=priority4ValueText(row);
  const period=row.period || '時点確認中';
  const src=row.source_name || row.source_id || '内部ステージング資料';
  const note=row.qa_note ? `<p class="retail-note">${safe(row.qa_note)}</p>` : '';
  const link=row.source_url ? `<a class="url" href="${safe(row.source_url)}" target="_blank" rel="noreferrer">出典</a>` : '';
  return `<article class="market-data-card ${cls}"><div class="retail-card-head"><strong>${safe(label)}</strong><span>READY候補</span></div><em>${safe(value)}</em><span class="retail-info-chip">${safe(period)}・${safe(src)}</span>${note}<div class="retail-source-line">${link}</div></article>`;
}
function ricePriority4CardsForEntity(entity){
  const rows=priority4RowsFor(entity.entity_id,'rice_stats');
  if(!rows.length) return '';
  return `<article class="market-data-card priority4-section-note"><strong>内部履歴から復元</strong><span>Priority4 READY候補 ${rows.length}件</span><em>FAOSTAT本体値とは分けて表示</em></article>` + rows.map(r=>priority4Card(r,'priority4-card rice-ready-card')).join('');
}
function schoolMealCardsForEntity(entity){
  const rows=priority4RowsFor(entity.entity_id,'school_meals');
  if(!rows.length) return MARKET_DOMAINS.school.items.map(x=>notCollectedCard(x[0],x[1])).join('');
  return `<article class="market-data-card priority4-section-note"><strong>学校給食データ</strong><span>内部履歴READY候補 ${rows.length}件</span><em>HOLD/RECHECKは非表示</em></article>` + rows.map(r=>priority4Card(r,'priority4-card school-ready-card')).join('');
}
function priority4DomainSummary(domain){
  const rows=(priority4ReadyData?.rows || []).filter(r=>r.domain===domain && r.import_decision==='READY_FOR_STAGING_IMPORT');
  const ents=new Set(rows.map(r=>r.entity_id));
  return {rows:rows.length, entities:ents.size};
}
function schoolSummaryCards(){
  const s=priority4DomainSummary('school_meals');
  if(!s.rows) return MARKET_DOMAINS.school.items.map(x=>notCollectedCard(x[0],x[1])).join('');
  return `<article class="market-data-card school-summary-card"><strong>学校給食</strong><span>READY候補 ${s.rows}件</span><em>${s.entities}地域 / 内部履歴から復元</em></article>
  <article class="market-data-card school-summary-card"><strong>表示方針</strong><span>確認済み候補のみ表示</span><em>HOLD/RECHECKは非表示</em></article>
  <article class="market-data-card school-summary-card"><strong>対象例</strong><span>日本・台湾・香港</span><em>Priority4 Ready_All</em></article>
  <article class="market-data-card school-summary-card"><strong>注意</strong><span>全国カバー率とは限らない</span><em>制度・ガイドライン行を含む</em></article>`;
}
function riceSummaryCards(){
  const summary=riceStatusSummary();
  const meta=riceData?.meta || {};
  const statusText=summary.any ? `値あり ${summary.any}/${summary.total}` : `自動更新待ち ${summary.total}地域`;
  return `<article class="market-data-card rice-summary-card"><strong>米データ v1</strong><span>${safe(statusText)}</span><em>${safe(meta.source_primary || 'FAOSTAT')} / ${safe(meta.update_policy || '月次更新想定')}</em></article>
    <article class="market-data-card rice-summary-card"><strong>対象指標</strong><span>生産・輸入・輸出・1人当たり供給量</span><em>Food Balanceは供給ベース</em></article>
    <article class="market-data-card rice-summary-card"><strong>Full196維持</strong><span>値がなくても国・地域は削除しない</span><em>未収録として表示</em></article>
    <article class="market-data-card rice-summary-card"><strong>更新方法</strong><span>FAOSTAT取得スクリプトでJSON生成</span><em>scripts/update_rice_data_faostat.py</em></article>`;
}
function renderRiceRanking(){
  const select=document.getElementById('riceMetricSelect');
  const list=document.getElementById('riceRankingList');
  if(!list) return;
  const metric=select?.value || 'rice_production_paddy_tonnes';
  const ranking=riceRankings?.[metric] || riceRankings?.rankings?.[metric] || null;
  const items=ranking?.items || [];
  if(!items.length){
    list.innerHTML=`<article class="market-note-card rice-empty-note"><h4>${safe(riceMetricLabel(metric))}</h4><p>米データは現在整理中です。公開値が入った後にランキングを表示します。</p></article>`;
    return;
  }
  list.innerHTML=items.slice(0,20).map(item=>`<article class="ranking-row"><div class="rank">#${safe(item.rank)}</div><div class="flag">${flagMarkup(entities.find(e=>e.entity_id===item.entity_id) || {}, 'flag-img-table')}</div><div><div class="country-name">${safe(item.name_ja || item.name_en || item.entity_id)}</div><div class="value">${safe(fmtRiceValue(item, metric))}</div><div class="source-line">${safe(item.year)} / ${safe(item.source || 'FAOSTAT')}</div></div></article>`).join('');
}

function japanMetricLabel(metric){
  const labels={
    japan_relation_summary:'日本との関係まとめ',
    overseas_japanese_residents_total:'在留邦人数',
    japanese_restaurants_count:'日本食レストラン数',
    overseas_japanese_long_term_residents:'長期滞在者数',
    overseas_japanese_permanent_residents:'永住者数',
    overseas_japanese_residents_yoy_rate:'在留邦人数 前年比',
    japanese_retail_foodservice_presence:'日系小売・外食の存在',
    japanese_restaurants_app_region_totals:'日本食レストラン数 地域合計',
    overseas_japanese_residents_mofa_region_totals:'在留邦人数 地域合計'
  };
  return labels[metric] || metric;
}
function formatJapanRankingValue(item, metric){
  const v=item?.value;
  if(v===null || v===undefined) return '—';
  if(metric==='japan_relation_summary'){
    const level=item.level ? ` / ${japanRelationLevelLabel(item.level)}` : '';
    return `${Number(v).toLocaleString()}${level}`;
  }
  if(metric==='overseas_japanese_residents_total') return `${Number(v).toLocaleString()}人`;
  if(metric==='overseas_japanese_residents_mofa_region_totals') return `${Number(v).toLocaleString()}人`;
  if(metric==='overseas_japanese_long_term_residents') return `${Number(v).toLocaleString()}人`;
  if(metric==='overseas_japanese_permanent_residents') return `${Number(v).toLocaleString()}人`;
  if(metric==='overseas_japanese_residents_yoy_rate') return `${(Number(v)*100).toLocaleString(undefined,{maximumFractionDigits:1})}%`;
  if(metric==='japanese_restaurants_count') return `${Number(v).toLocaleString()}店`;
  if(metric==='japanese_restaurants_app_region_totals') return `${Number(v).toLocaleString()}店`;
  if(metric==='japanese_retail_foodservice_presence'){
    const brands=(item.brands||[]).filter(Boolean).join(' / ');
    return `${Number(v).toLocaleString()}件${brands ? ` / ${brands}` : ''}`;
  }
  return Number(v).toLocaleString();
}
function japanRankingSubline(item, metric){
  if(metric==='japan_relation_summary'){
    const signals=(item.signals||[]).join(' / ') || '取得済み指標なし';
    return signals;
  }
  if(metric==='japanese_retail_foodservice_presence'){
    const store=item.numeric_store_count_sum ? `店舗数参考 ${Number(item.numeric_store_count_sum).toLocaleString()}` : '存在情報';
    return store;
  }
  const bits=[];
  if(item.year) bits.push(`${item.year}年`);
  if(item.source) bits.push(item.source);
  return bits.join(' / ') || '出典情報あり';
}
function renderJapanRanking(){
  const sel=document.getElementById('japanMetricSelect');
  const list=document.getElementById('japanRankingList');
  if(!sel || !list) return;
  const metric=sel.value || 'japan_relation_summary';
  const ranking=japanRelatedRankings?.[metric];
  const items=(ranking?.items || []).slice(0,20);
  if(!items.length){
    list.innerHTML=`<article class="empty-state"><strong>${safe(japanMetricLabel(metric))}</strong><p>この項目はまだ実値がありません。</p></article>`;
    return;
  }
  list.innerHTML=items.map(item=>{
    const e=entities.find(x=>x.entity_id===item.entity_id) || {};
    return `<button class="ranking-row japan-ranking-row" onclick="openDetail('${safe(item.entity_id)}')">
      <span class="rank-num">${safe(item.rank || '')}</span>
      <span class="rank-country">${flagText(e)} ${safe(item.name_ja || nameOf(e) || item.entity_id)}</span>
      <span class="rank-value">${safe(formatJapanRankingValue(item, metric))}</span>
      <small>${safe(japanRankingSubline(item, metric))}</small>
    </button>`;
  }).join('');
}

function renderRicePanel(){
  const panel=document.getElementById('ricePanel');
  if(!panel) return;
  const summary=riceStatusSummary();
  const chip=document.getElementById('riceCoverage');
  if(chip) chip.textContent=summary.any ? `${summary.any}/${summary.total}` : '自動更新待ち';
  const p4=priority4DomainSummary('rice_stats');
  panel.innerHTML=`<article class="market-scope-hero rice-hero"><div class="domain-icon-large">🍚</div><div><h4>米データ</h4><p>FAOSTAT本体値は整理中ですが、内部履歴からREADY候補を一部復元しました。</p><span class="market-state-chip">${p4.rows ? `Priority4 READY ${p4.rows}件` : (summary.any ? `値あり ${summary.any}/${summary.total}` : 'データ整理中')}</span></div></article><div class="market-data-grid">${riceSummaryCards()}</div><article class="market-note-card"><h4>表示ルール</h4><p>Priority4 READY候補は、FAOSTAT本体の標準4指標とは分けて表示します。HS100630など定義が限定される値は、総量と混同しません。</p></article>`;
  renderRiceRanking();
}


const JAPAN_RELATED_METRICS = {
  overseas_japanese_residents_total:{label:'在留邦人数', unit:'人'},
  overseas_japanese_long_term_residents:{label:'長期滞在者数', unit:'人'},
  overseas_japanese_permanent_residents:{label:'永住者数', unit:'人'},
  overseas_japanese_residents_yoy_rate:{label:'在留邦人数 前年比', unit:'%'},
  japanese_restaurants_count:{label:'日本食レストラン数', unit:'店'},
  japan_food_exports_value_jpy:{label:'日本からの食品輸出額', unit:'円'},
  japan_favorability_or_trust_score:{label:'対日好感度・信頼度', unit:'%'}
};
function japanRelatedRecordForEntity(entityId){
  return (japanRelatedData?.records || []).find(r=>r.entity_id===entityId) || null;
}
function fmtJapanRelatedValue(obj, metric){
  if(!obj || obj.value===null || obj.value===undefined) return '未収録';
  const n=Number(obj.value);
  if(!Number.isFinite(n)) return safe(obj.value);
  if(metric==='japan_favorability_or_trust_score') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})}%`;
  if(metric==='overseas_japanese_residents_yoy_rate') return `${(n*100).toLocaleString(undefined,{maximumFractionDigits:1})}%`;
  if(metric==='japan_food_exports_value_jpy') return `¥${Math.round(n).toLocaleString()}`;
  return `${Math.round(n).toLocaleString()} ${JAPAN_RELATED_METRICS[metric]?.unit || ''}`.trim();
}
function japanRelatedSourceLine(obj){
  if(!obj) return '取得待ち';
  const year=obj.year ? `${obj.year}年` : '年不明';
  return `${year} / ${obj.source || 'source pending'}`;
}
function japanRelatedCard(metric, obj){
  const label=JAPAN_RELATED_METRICS[metric]?.label || metric;
  return `<article class="market-data-card japan-data-card ${obj?'japan-loaded':'japan-empty'}"><strong>${safe(label)}</strong><span>${safe(fmtJapanRelatedValue(obj, metric))}</span><em>${safe(japanRelatedSourceLine(obj))}</em></article>`;
}
function japanPresenceCard(rec){
  const items=rec?.japanese_retail_foodservice_presence || [];
  if(!items.length) return `<article class="market-data-card japan-data-card japan-empty"><strong>日系小売・外食</strong><span>未収録</span><em>存在情報の確認待ち</em></article>`;
  return `<article class="market-data-card japan-data-card japan-loaded"><strong>日系小売・外食</strong><span>${items.length}件</span><em>${items.map(x=>x.brand || x.name).filter(Boolean).slice(0,3).join(' / ')}</em></article>`;
}

function japanRelationLevelLabel(level){
  const map={very_high:'非常に強い', high:'強い', medium:'中程度', low:'接点あり', not_loaded:'未収録'};
  return map[level] || '未収録';
}
function japanRelationSummaryCard(rec){
  const s=rec?.japan_relation_summary;
  if(!s || !s.japan_relation_score) return `<article class="market-data-card japan-relation-card japan-empty"><strong>日本との関係まとめ</strong><span>未収録</span><em>在留邦人・日本食・日系小売データの取得待ち</em></article>`;
  const signals=(s.signals||[]).join(' / ') || '取得済み指標なし';
  return `<article class="market-data-card japan-relation-card japan-loaded"><strong>日本との関係まとめ</strong><span>${safe(japanRelationLevelLabel(s.japan_relation_level))}</span><em>${safe(signals)}</em></article>`;
}

function japanRelatedCardsForEntity(entity){
  const rec=japanRelatedRecordForEntity(entity.entity_id);
  return japanRelationSummaryCard(rec) + Object.keys(JAPAN_RELATED_METRICS).map(metric=>japanRelatedCard(metric, rec?.[metric])).join('') + japanPresenceCard(rec);
}
function japanRelatedSummary(){
  const records=japanRelatedData?.records || [];
  const any=records.filter(r=>Object.keys(JAPAN_RELATED_METRICS).some(k=>r[k]) || (r.japanese_retail_foodservice_presence||[]).length).length;
  return {total: records.length || 196, any};
}


function overseasJapaneseResidentsOverviewCard(){
  const o=overseasJapaneseResidentsOverview?.overview || japanRelatedData?.meta?.overseas_japanese_residents_overview;
  if(!o) return '';
  const global=o.official_global_total?.value;
  const count=o.mapped_full196_total?.country_region_count;
  const longTerm=o.mapped_full196_breakdown?.long_term?.value;
  const permanent=o.mapped_full196_breakdown?.permanent?.value;
  return `<article class="japan-summary-card resident-overview-card">
    <strong>在留邦人数 概要</strong>
    <span>${global ? Number(global).toLocaleString()+'人' : '未収録'}</span>
    <em>突合 ${count || 0}件 / 長期 ${longTerm ? Number(longTerm).toLocaleString()+'人' : '—'} / 永住 ${permanent ? Number(permanent).toLocaleString()+'人' : '—'}</em>
  </article>`;
}

function japaneseRestaurantsOverviewCard(){
  const o=japaneseRestaurantsOverview?.overview || japanRelatedData?.meta?.japanese_restaurants_overview;
  if(!o) return '';
  const global=o.global_total?.value;
  const mapped=o.mapped_country_region_total?.value;
  const count=o.mapped_country_region_total?.country_region_count;
  return `<article class="japan-summary-card restaurant-overview-card">
    <strong>日本食レストラン数 概要</strong>
    <span>${global ? Number(global).toLocaleString()+'店' : '未収録'}</span>
    <em>国・地域別掲載 ${count || 0}件 / 掲載分合計 ${mapped ? Number(mapped).toLocaleString()+'店' : '—'}</em>
  </article>`;
}

function japanRelatedSummaryCards(){
  const s=japanRelatedSummary();
  const relationCount=(japanRelatedData?.records || []).filter(r=>r.japan_relation_summary?.japan_relation_score>0).length;
  const status=s.any ? `値あり ${s.any}/${s.total} / まとめ ${relationCount}地域` : `取得枠 ${s.total}地域 / 実値取得待ち`;
  return `<article class="market-data-card japan-summary-card"><strong>日本関連データ v1</strong><span>${safe(status)}</span><em>在留邦人・日本食・輸出・対日感情</em></article>
  <article class="market-data-card japan-summary-card"><strong>主ソース</strong><span>外務省・農水省・財務省貿易統計</span><em>公式/準公式を優先</em></article>
  <article class="market-data-card japan-summary-card"><strong>表示方針</strong><span>未確認値は出さない</span><em>欠損は未収録</em></article>
  <article class="market-data-card japan-summary-card"><strong>Full196</strong><span>値がなくても国・地域は保持</span><em>台湾・香港・マカオ維持</em></article>`;
}

function renderDomainPanel(domainKey, targetId){
  const d=MARKET_DOMAINS[domainKey];
  const sampleEntities=['JP','TW','KR','HK','SG','TH','US','CN'].filter(id=>entities.some(e=>e.entity_id===id));
  const chips=sampleEntities.map(id=>{
    const e=entities.find(x=>x.entity_id===id);
    return `<button onclick="openDetail('${safe(id)}')">${flagText(e)} ${safe(nameOf(e))}</button>`;
  }).join('');
  const dataCards = domainKey==='market' ? retailSummaryCards() : (domainKey==='rice' ? riceSummaryCards() : (domainKey==='school' ? schoolSummaryCards() : (domainKey==='japan' ? japanRelatedSummaryCards() : d.items.map(x=>notCollectedCard(x[0],x[1])).join(''))));
  const riceSummary=riceStatusSummary();
  const japanSummary=japanRelatedSummary();
  let stateChip='市場情報は段階的に拡張中';
  if(domainKey==='market' && (retailPresenceData || retailData)){
    stateChip=`小売データ：内部ファイル復元 / ${safe(retailPresenceData?.coverage?.chain_presence_records || retailPresenceData?.coverage?.record_count || retailData?.coverage?.retail_records_with_store_count || 0)}件`;
  }else if(domainKey==='rice'){
    stateChip=riceSummary.any ? `米データ：値あり ${riceSummary.any}/${riceSummary.total}` : '米データ：準備中';
  }else if(domainKey==='school'){
    const s=priority4DomainSummary('school_meals');
    stateChip=s.rows ? `学校給食：READY候補 ${s.rows}件` : '学校給食：準備中';
  }else if(domainKey==='japan'){
    stateChip=japanSummary.any ? `日本関連：値あり ${japanSummary.any}/${japanSummary.total}` : '日本関連：取得枠作成済み';
  }
  document.getElementById(targetId).innerHTML=`<article class="market-scope-hero"><div class="domain-icon-large">${d.icon}</div><div><h4>${safe(d.title)}</h4><p>${safe(d.lead)}</p><span class="market-state-chip">${stateChip}</span></div></article><div class="market-data-grid">${dataCards}</div><article class="market-note-card"><h4>主要国・地域から段階投入</h4><p>v3.1では入口と表示構造を先に固定します。公式情報・準公式情報・参考値を区別し、未収録は空欄にせず分かるように表示します。</p><div class="quick-chip-row">${chips}</div></article>`;
}
function renderMarketScope(){
  renderDomainPanel('market','marketPanel');
  renderDomainPanel('rice','ricePanel');
  renderRicePanel();
  renderDomainPanel('school','schoolPanel');
  renderDomainPanel('japan','japanPanel');
  renderJapanRanking();
}
function marketSummaryBlock(e){
  const blocks=Object.entries(MARKET_DOMAINS).map(([key,d])=>{
    const cards = key==='market' ? retailEntityCards(e) : (key==='rice' ? (riceCardsForEntity(e) + ricePriority4CardsForEntity(e)) : (key==='school' ? schoolMealCardsForEntity(e) : (key==='japan' ? japanRelatedCardsForEntity(e) : d.items.map(x=>notCollectedCard(x[0],x[1])).join(''))));
    const addNote = key==='market' && retailEntityHasData(e.entity_id) ? '<p class="source-line">小売は「その国・地域に存在するチェーン」を表示し、店舗数が分かる場合だけ数字を添えます。ブランド出身国は補助情報です。</p>' : (key==='rice' ? '<p class="source-line">米データは公開用データを整理中です。未確定値や内部更新メモは表示しません。</p>' : (key==='japan' ? '<p class="source-line">日本関連は外務省・農水省・財務省等の確認済みデータを優先します。未取得値は未収録として表示します。</p>' : ''));
    return `<section class="detail-market-block"><h3>${d.icon} ${safe(d.title)}</h3><p>${safe(d.lead)}</p>${addNote}<div class="market-data-grid compact">${cards}</div></section>`;
  }).join('');
  return `<div class="detail-tab-note"><strong>MARKET BASE範囲</strong><span>基本統計に加え、市場・米・学校給食・日本関連を同じ国・地域詳細の中で確認する設計です。</span></div>${blocks}`;
}
function renderCountries(){
  const q=document.getElementById('searchInput').value.trim();
  const region=document.getElementById('regionFilter').value;
  const subregion=document.getElementById('subregionFilter')?.value || activeSubregionPreset || 'all';
  const income=document.getElementById('incomeFilter')?.value || 'all';
  const gapOnly=document.getElementById('gapOnlyToggle')?.checked || false;
  const rows=entities.filter(e=>{
    const incCode=incomeCode(e);
    return queryMatchesEntity(e,q) && (region==='all' || e.region===region) && subregionMatches(e,subregion) && (income==='all' || incCode===income) && (!gapOnly || hasGdpGap(e));
  });
  document.getElementById('countryCount').textContent=`${rows.length} / ${entities.length}`;
  document.getElementById('countryList').innerHTML=rows.map(e=>{
    const g=getStat(e,'gdp_current_usd'); const p=getStat(e,'population'); const d=getStat(e,'population_density');
    const missing=isMissing(g)?` <span class="missing-chip">${t('missing')}</span>`:'';
    const gapClass=hasAnyGap(e)?' has-gap':'';
    return `<article class="country-card${gapClass}" data-card-entity="${safe(e.entity_id)}"><button type="button" class="flag flag-open" data-open-entity="${safe(e.entity_id)}" aria-label="${safe(nameOf(e))}の詳細を開く">${flagMarkup(e, 'flag-img-card')}</button><div><div class="country-name">${safe(nameOf(e))}</div><div class="country-sub">${safe(e.region)} / ${safe(e.subregion)}</div><div class="mini-stat">GDP: ${fmt(g.value,'gdp_current_usd')}${missing} · Pop: ${fmt(p.value,'population')}</div><div class="card-meta"><span class="meta-chip">${safe(e.entity_id)} / ${safe(e.iso3)}</span><span class="meta-chip">${safe(incomeLabel(e))}</span><span class="meta-chip">GDP year ${safe(sourceYear(g))}</span><span class="meta-chip">Density ${fmt(d.value,'population_density')}</span></div></div><button class="open-btn" data-open-entity="${safe(e.entity_id)}">${t('detail')}</button></article>`;
  }).join('') || `<p class="notice">${t('noResults')}</p>`;
}
function renderRankings(){
  const metric=document.getElementById('metricSelect').value;
  const data=getRanking(metric);
  document.getElementById('rankingCoverage').textContent=`${t('coverage')}: ${coverageText(metric)}`;
  const list=document.getElementById('rankingList');
  if(!data){ list.innerHTML=`<p class="notice">${t('noResults')}</p>`; return; }
  const limit=document.getElementById('rankLimit')?.value || '20';
  const items=limit==='all' ? data.items : data.items.slice(0, Number(limit));
  const more=(limit!=='all' && data.items.length>items.length) ? `<p class="list-more-note">${t('showingLimited')}: ${items.length} / ${data.items.length}</p>` : '';
  list.innerHTML=items.map(item=>{ const e=entities.find(x=>x.entity_id===item.entity_id) || item; const eid=safe(item.entity_id || e.entity_id || ''); return `<article class="ranking-row ${item.rank<=3?'top-rank':''}"><div class="rank">#${item.rank}</div><button type="button" class="flag flag-open" data-open-entity="${eid}" aria-label="${safe(lang==='en'?item.name_en:item.name_ja)}の詳細を開く">${flagMarkup(e, 'flag-img-table')}</button><div><div class="country-name">${safe(lang==='en'?item.name_en:item.name_ja)}</div><div class="value">${fmt(item.value,metric)} <span class="country-sub">${safe(item.display_unit_ja||item.unit||'')}</span></div><div class="source-line">${safe(item.data_year)} / ${safe(item.source_name || '出典確認中')}</div></div></article>`; }).join('') + more;
}
function renderCompare(){
  const a=entities.find(e=>e.entity_id===document.getElementById('compareA').value) || entities[0];
  const b=entities.find(e=>e.entity_id===document.getElementById('compareB').value) || entities[1];
  document.getElementById('compareTable').innerHTML=`<table><thead><tr><th>項目</th><th>${flagText(a)} ${safe(nameOf(a))}</th><th>${flagText(b)} ${safe(nameOf(b))}</th></tr></thead><tbody>${UI_METRICS.map(m=>{
    const sa=getStat(a,m), sb=getStat(b,m);
    return `<tr><th>${safe(metricName(m))}</th><td class="${isMissing(sa)?'missing-value':''}"><strong>${fmt(sa.value,m)}</strong>${isMissing(sa)?`<span class="missing-chip">${t('missing')}</span>`:''}<br><span class="source-line">${safe(sourceLine(sa))}</span></td><td class="${isMissing(sb)?'missing-value':''}"><strong>${fmt(sb.value,m)}</strong>${isMissing(sb)?`<span class="missing-chip">${t('missing')}</span>`:''}<br><span class="source-line">${safe(sourceLine(sb))}</span></td></tr>`;
  }).join('')}</tbody></table>`;
}
function renderSources(){
  const metricFilter=document.getElementById('sourceMetricFilter').value;
  const statusFilter=document.getElementById('sourceStatusFilter').value;
  const metrics=metricFilter==='all'?UI_METRICS:[metricFilter];
  const rows=[];
  entities.forEach(e=>metrics.forEach(m=>{
    const s=getStat(e,m); const missing=isMissing(s);
    if(statusFilter==='missing' && !missing) return;
    if(statusFilter==='ready' && missing) return;
    const status=s.update_status||'missing_or_not_adopted';
    rows.push({
      area:`${e.flag_emoji||''} ${nameOf(e)}`,
      code:e.entity_id||'',
      metric:metricName(m),
      value:fmt(s.value,m),
      unit:s.display_unit_ja||s.unit||'',
      year:s.data_year||'—',
      status,
      missing,
      source:s.source_name || s.source_id || t('source'),
      url:s.source_url||''
    });
  }));
  const limit=document.getElementById('sourceLimit')?.value || '60';
  const shown=limit==='all' ? rows : rows.slice(0, Number(limit));
  const more=(limit!=='all' && rows.length>shown.length) ? `<p class="list-more-note">${t('showingLimited')}: ${shown.length} / ${rows.length}</p>` : '';
  if(!shown.length){ document.getElementById('sourceList').innerHTML=`<p class="notice">${t('noResults')}</p>`; return; }
  const body=shown.map(r=>`<tr class="${r.missing?'missing-value':''}"><td><strong>${safe(r.area)}</strong><br><span class="source-mini">${safe(r.code)}</span></td><td>${safe(r.metric)}</td><td><strong>${safe(r.value)}</strong> <span class="source-mini">${safe(r.unit)}</span>${r.missing?`<br><span class="missing-chip">${t('missing')}</span>`:''}</td><td>${safe(r.year)}</td><td><span class="status-pill ${r.missing?'status-missing':'status-ready'}">${safe(r.status)}</span></td><td>${sourceLink(r.url, r.source)}</td></tr>`).join('');
  document.getElementById('sourceList').innerHTML=`<div class="source-table-wrap"><table class="source-table"><thead><tr><th>国・地域</th><th>項目</th><th>値</th><th>年</th><th>収録</th><th>出典</th></tr></thead><tbody>${body}</tbody></table></div>${more}`;
}
function renderQA(){
  let total=0, withValue=0, withYear=0, withSource=0;
  const missingEntities=new Map();
  entities.forEach(e=>UI_METRICS.forEach(m=>{
    const s=getStat(e,m); total++;
    if(!isMissing(s)){ withValue++; if(s.data_year) withYear++; if(s.source_url && (s.source_name||s.source_id)) withSource++; }
    else missingEntities.set(e.entity_id, `${e.flag_emoji} ${nameOf(e)}`);
  }));
  const rankingLoaded=UI_METRICS.filter(m=>!!getRanking(m)).length;
  const rows=[
    ['収録対象', `${entities.length} / 196`, entities.length===196?'qa-ok':'qa-bad'],
    ['国・地域ID', `${new Set(entities.map(e=>e.entity_id)).size} / ${entities.length}`, new Set(entities.map(e=>e.entity_id)).size===entities.length?'qa-ok':'qa-bad'],
    ['指標値', `${withValue} / ${total}`, withValue===total?'qa-ok':'qa-warn'],
    ['年の表示', `${withYear} / ${withValue}`, withYear===withValue?'qa-ok':'qa-warn'],
    ['出典の表示', `${withSource} / ${withValue}`, withSource===withValue?'qa-ok':'qa-warn'],
    ['ランキング指標', `${rankingLoaded} / 5`, rankingLoaded===5?'qa-ok':'qa-bad'],
    ['所得分類', `${entities.filter(e=>e.income_classification).length} / ${entities.length}`, entities.filter(e=>e.income_classification).length===entities.length?'qa-ok':'qa-warn'],
    ['更新状況', '収録済み', 'qa-ok']
  ];
  const gaps=[...missingEntities.values()].join(' / ') || 'none';
  document.getElementById('qaPanel').innerHTML=`<article class="qa-card"><h4>収録状況</h4>${rows.map(r=>`<div class="qa-row"><span>${safe(r[0])}</span><strong class="${r[2]}">${safe(r[1])}</strong></div>`).join('')}</article><article class="qa-card"><h4>未収録の項目</h4><p class="source-line">GDP系指標の一部は、国・地域ページに残したまま該当ランキングからは外しています。</p><p><strong>${safe(gaps)}</strong></p></article>`;
}

function wdiMetadataForEntity(entityId){
  return (wdiCountryMetadata?.records || []).find(r=>r.entity_id===entityId) || null;
}
function compactWdiNote(text, limit=130){
  const s=String(text || '').replace(/\s+/g,' ').trim();
  if(!s) return '—';
  return s.length>limit ? `${s.slice(0, limit)}…` : s;
}
function wdiMetadataBlock(e){
  const m=wdiMetadataForEntity(e.entity_id);
  if(!m || m.metadata_status!=='available'){
    return `<section class="detail-section"><h3>WDI国別メタデータ</h3><div class="stats-grid"><div class="stat-card missing-value"><div class="stat-label">WDI metadata</div><div class="stat-value">未収録</div><span class="stat-source-label">WDI Country metadataに対応レコードなし</span></div></div></section>`;
  }
  const cards=[
    ['通貨単位', m.currency_unit],
    ['貸出区分', m.lending_category],
    ['最新人口センサス', m.latest_population_census],
    ['最新世帯調査', m.latest_household_survey],
    ['最新貿易データ', m.latest_trade_data],
    ['貿易制度', m.system_of_trade]
  ].map(([label,value])=>`<div class="stat-card wdi-meta-card ${value?'':'missing-value'}"><div class="stat-label">${safe(label)}</div><div class="stat-value">${safe(value || '—')}</div><span class="stat-source-label">World Bank WDI Country Metadata</span></div>`).join('');
  const note=m.special_notes ? `<article class="market-note-card wdi-special-note"><h4>Special Notes</h4><p>${safe(compactWdiNote(m.special_notes, 220))}</p></article>` : '';
  return `<section class="detail-section"><h3>WDI国別メタデータ</h3><div class="stats-grid">${cards}</div>${note}</section>`;
}

function detailContentHtml(e){
  const inc=incomeRecord(e);
  const incomeCard=`<div class="stat-card income-stat-card"><div class="stat-label">所得分類</div><div class="stat-value">${safe(incomeLabel(e))}</div><span class="stat-source-label">${safe(incomeSourceLine(inc))}</span>${sourceLink(inc?.source_url, t('source'))}</div>`;
  const statsHtml=`<section class="detail-section"><h3>概要・基本統計</h3><div class="stats-grid">${incomeCard}${UI_METRICS.map(m=>{
    const s=getStat(e,m); const missing=isMissing(s);
    return `<div class="stat-card ${missing?'missing-value':''}"><div class="stat-label">${safe(metricName(m))}</div><div class="stat-value">${fmt(s.value,m)}</div>${missing?`<div class="missing-chip">${t('missing')}</div>`:''}<span class="stat-source-label">${safe(sourceLine(s))}</span>${sourceLink(s.source_url, t('source'))}</div>`;
  }).join('')}</div></section>`;
  return `<div class="detail-header"><div class="detail-flag">${flagMarkup(e, 'flag-img-detail')}</div><div class="detail-title-block"><h2>${safe(nameOf(e))}</h2><p class="country-sub">${safe(e.entity_id)} / ${safe(e.iso3)} / ${safe(e.region)} / ${safe(e.subregion)}</p><div class="detail-mini-tabs"><span>概要</span><span>市場</span><span>米</span><span>学校給食</span><span>日本関連</span><span>WDI</span><span>出典</span></div></div></div>${statsHtml}${wdiMetadataBlock(e)}<section class="detail-section">${marketSummaryBlock(e)}</section>`;
}
function renderDetailContent(e){
  document.getElementById('detailContent').innerHTML=detailContentHtml(e);
}
function openDetail(id){
  const e=entities.find(x=>x.entity_id===id); if(!e) return;
  currentDetailEntityId=id;
  rememberEntity(e.entity_id);
  renderDetailContent(e);
  const dialog=document.getElementById('detailDialog');
  if(!dialog.open) dialog.showModal();
}

function initControls(){
  const regions=[...new Set(entities.map(e=>e.region).filter(Boolean))].sort();
  document.getElementById('regionFilter').innerHTML=`<option value="all">${t('allRegions')}</option>`+regions.map(r=>`<option value="${safe(r)}">${safe(r)}</option>`).join('');
  updateSubregionOptions();
  const incomeOrder=['HIC','UMC','LMC','LIC','UNCLASSIFIED'];
  const incomeFilter=document.getElementById('incomeFilter');
  if(incomeFilter) incomeFilter.innerHTML='<option value="all">所得分類すべて</option>'+incomeOrder.map(c=>`<option value="${safe(c)}">${safe(incomeCodeLabel(c))}</option>`).join('');
  const metricOpts=UI_METRICS.map(m=>`<option value="${m}">${safe(metricName(m))}</option>`).join('');
  document.getElementById('metricSelect').innerHTML=metricOpts;
  document.getElementById('sourceMetricFilter').innerHTML=`<option value="all">${t('allMetrics')}</option>`+metricOpts;
  document.getElementById('sourceStatusFilter').innerHTML=`<option value="all">${t('allStatus')}</option><option value="missing">${t('missingOnly')}</option><option value="ready">${t('readyOnly')}</option>`;
  const opts=entities.map(e=>`<option value="${safe(e.entity_id)}">${flagText(e)} ${safe(nameOf(e))}</option>`).join('');
  document.getElementById('compareA').innerHTML=opts; document.getElementById('compareB').innerHTML=opts;
  document.getElementById('compareA').value=entities.some(e=>e.entity_id==='TW')?'TW':entities[0]?.entity_id;
  document.getElementById('compareB').value=entities.some(e=>e.entity_id==='JP')?'JP':entities[1]?.entity_id;
}
function renderAll(){
  applyI18n(); initControls(); renderMetricOverview(); renderKnownGaps(); renderRecentEntities(); renderMarketScope(); renderCountries(); renderRankings(); renderCompare(); renderSources(); renderQA();
  document.getElementById('entityCount').textContent=entities.length;
}
async function boot(){
  try{
    const [e,r,retail,retailPresence,rice,riceRanks,priority4,wdiMeta,japanRel,japanRanks,jpRestaurantOverview,jpResidentsOverview]=await Promise.all([
      fetch('data/market_base_entities_basic_stats_full196_rc.json').then(x=>x.json()),
      fetch('data/market_base_rankings_basic_stats_full196_rc.json').then(x=>x.json()),
      fetch('data/market_base_retail_channels_full196_rc.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_retail_market_presence_master_v91_internal_recovered.json').then(x=>x.json()).catch(()=>fetch('data/market_base_retail_market_presence_master_v90.json').then(x=>x.json()).catch(()=>fetch('data/market_base_retail_market_presence_v42_asia_rc.json').then(x=>x.json()).catch(()=>null))),
      fetch('data/market_base_rice_data_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_rice_rankings_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_priority4_ready_staging_v92.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_wdi_country_metadata_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_japan_related_data_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_japan_related_rankings_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_japanese_restaurants_overview_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_overseas_japanese_residents_overview_v1.json').then(x=>x.json()).catch(()=>null)
    ]);
    entities=e.entities||[]; rankings=r.rankings||{}; retailData=retail || window.MARKET_BASE_RETAIL_DATA?.retail || null; retailPresenceData=retailPresence || window.MARKET_BASE_RETAIL_PRESENCE_DATA?.retail_presence || null; riceData=rice || null; riceRankings=riceRanks?.rankings || {}; priority4ReadyData=priority4 || null; wdiCountryMetadata=wdiMeta || null; japanRelatedData=japanRel || null; japanRelatedRankings=japanRanks?.rankings || {}; japaneseRestaurantsOverview=jpRestaurantOverview || null; overseasJapaneseResidentsOverview=jpResidentsOverview || null; renderAll();
  }catch(err){
    if(window.MARKET_BASE_EMBEDDED_DATA){
      entities=window.MARKET_BASE_EMBEDDED_DATA.entities.entities||[];
      rankings=window.MARKET_BASE_EMBEDDED_DATA.rankings.rankings||{};
      retailData=window.MARKET_BASE_RETAIL_DATA?.retail || null;
      retailPresenceData=window.MARKET_BASE_RETAIL_PRESENCE_DATA?.retail_presence || null;
      riceData=null; riceRankings={}; priority4ReadyData=null; wdiCountryMetadata=null; japanRelatedData=null; japanRelatedRankings={};
      renderAll();
      
    }else{
      document.querySelector('main').insertAdjacentHTML('afterbegin', `<div class="error-box">Data load failed. ローカルで開く場合は簡易サーバー経由で確認してください。<br>${safe(err.message)}</div>`);
    }
  }
}

function openEntityByAnyCode(id){
  const key=String(id||'').trim();
  if(!key) return false;
  const upper=key.toUpperCase();
  const e=entities.find(x=>String(x.entity_id).toUpperCase()===upper || String(x.iso2).toUpperCase()===upper || String(x.iso3).toUpperCase()===upper);
  if(e){ openDetail(e.entity_id); return true; }
  return false;
}
function handleAppNavigationClick(btn, event){
  if(!btn) return false;
  if(btn.dataset.openEntity){
    event.preventDefault(); event.stopPropagation();
    if(!openEntityByAnyCode(btn.dataset.openEntity)){
      const input=document.getElementById('searchInput');
      if(input) input.value=btn.dataset.openEntity;
      renderCountries();
      switchView('countries');
    }
    return true;
  }
  if(btn.dataset.searchPreset){
    event.preventDefault(); event.stopPropagation();
    const input=document.getElementById('searchInput');
    if(input) input.value=btn.dataset.searchPreset;
    const gap=document.getElementById('gapOnlyToggle'); if(gap) gap.checked=false;
    renderCountries(); switchView('countries');
    return true;
  }
  if(btn.dataset.regionPreset){
    event.preventDefault(); event.stopPropagation();
    const filter=document.getElementById('regionFilter');
    if(filter) filter.value=btn.dataset.regionPreset || 'all';
    updateSubregionOptions();
    if(btn.dataset.subregionPreset) setSubregionPreset(btn.dataset.subregionPreset);
    else if(btn.dataset.subregionsPreset) setSubregionPreset(btn.dataset.subregionsPreset);
    else setSubregionPreset('all');
    const input=document.getElementById('searchInput'); if(input) input.value='';
    renderCountries(); switchView('countries');
    return true;
  }
  if(btn.dataset.jump){
    event.preventDefault(); event.stopPropagation();
    switchView(btn.dataset.jump);
    return true;
  }
  return false;
}
document.addEventListener('click', function(event){
  const btn=event.target.closest('[data-open-entity],[data-search-preset],[data-region-preset],[data-jump]');
  if(btn) handleAppNavigationClick(btn, event);
}, true);

// Make the whole country/ranking card a safe target, not only the small arrow.
document.addEventListener('click', function(event){
  if(event.target.closest('[data-open-entity],[data-search-preset],[data-region-preset],[data-jump],select,input,label')) return;
  const card=event.target.closest('[data-card-entity]');
  if(card){
    event.preventDefault();
    openEntityByAnyCode(card.dataset.cardEntity);
  }
});

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
document.querySelectorAll('.bottom-tab[data-view]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
document.querySelectorAll('.bottom-tab[data-home]').forEach(btn=>btn.addEventListener('click',()=>showHome()));
document.querySelectorAll('[data-jump]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.jump)));
document.querySelectorAll('[data-region-preset]').forEach(btn=>btn.addEventListener('click',()=>{
  const filter=document.getElementById('regionFilter');
  if(filter){ filter.value=btn.dataset.regionPreset || 'all'; }
  updateSubregionOptions();
  if(btn.dataset.subregionPreset){ setSubregionPreset(btn.dataset.subregionPreset); }
  else if(btn.dataset.subregionsPreset){ setSubregionPreset(btn.dataset.subregionsPreset); }
  else { setSubregionPreset('all'); }
  document.getElementById('searchInput').value='';
  switchView('countries');
  renderCountries();
  document.getElementById('countries')?.scrollIntoView({behavior:'smooth', block:'start'});
}));
document.getElementById('langSelect').addEventListener('change',e=>{lang=e.target.value; renderAll();});

document.querySelectorAll('[data-lang-button]').forEach(btn=>btn.addEventListener('click',()=>{
  lang=btn.dataset.langButton;
  const select=document.getElementById('langSelect');
  if(select) select.value=lang;
  document.querySelectorAll('[data-lang-button]').forEach(x=>x.classList.toggle('active', x===btn));
  renderAll();
}));

document.getElementById('searchInput').addEventListener('input',renderCountries);
document.getElementById('regionFilter').addEventListener('change',()=>{ setSubregionPreset('all'); updateSubregionOptions(); renderCountries(); });
document.getElementById('subregionFilter')?.addEventListener('change',e=>{ activeSubregionPreset=e.target.value || 'all'; renderCountries(); });
document.getElementById('incomeFilter')?.addEventListener('change',renderCountries);
document.getElementById('gapOnlyToggle')?.addEventListener('change',renderCountries);
document.getElementById('metricSelect').addEventListener('change',renderRankings);
document.getElementById('rankLimit')?.addEventListener('change',renderRankings);
document.getElementById('compareA').addEventListener('change',renderCompare);
document.getElementById('compareB').addEventListener('change',renderCompare);
document.getElementById('sourceMetricFilter').addEventListener('change',renderSources);
document.getElementById('sourceStatusFilter').addEventListener('change',renderSources);
document.getElementById('sourceLimit')?.addEventListener('change',renderSources);
document.getElementById('closeDialog').addEventListener('click',()=>document.getElementById('detailDialog').close());
document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));
document.querySelectorAll('[data-search-preset]').forEach(btn=>btn.addEventListener('click',()=>{document.getElementById('searchInput').value=btn.dataset.searchPreset; document.getElementById('gapOnlyToggle').checked=false; renderCountries(); switchView('countries');}));
document.querySelector('[data-clear-search]')?.addEventListener('click',()=>{document.getElementById('searchInput').value=''; document.getElementById('regionFilter').value='all'; setSubregionPreset('all'); updateSubregionOptions();
  const incomeFilter=document.getElementById('incomeFilter'); if(incomeFilter) incomeFilter.value='all'; document.getElementById('gapOnlyToggle').checked=false; renderCountries(); switchView('countries');});
document.querySelectorAll('[data-open-entity]').forEach(btn=>btn.addEventListener('click',()=>{ const id=btn.dataset.openEntity; const e=entities.find(x=>x.entity_id===id || x.iso2===id || x.iso3===id); if(e){ openDetail(e.entity_id); } else { document.getElementById('searchInput').value=id; renderCountries(); switchView('countries'); }}));
document.querySelector('[data-clear-recent]')?.addEventListener('click',()=>{ setRecentEntityIds([]); renderRecentEntities(); });
document.getElementById('riceMetricSelect')?.addEventListener('change', renderRiceRanking);
boot();

document.getElementById('japanMetricSelect')?.addEventListener('change',renderJapanRanking);
