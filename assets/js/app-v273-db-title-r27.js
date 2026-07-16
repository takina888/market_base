// V127: unified rankings include basic stats, rice, school meals, and Japan-related metrics
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
    rice:{title:'米データ', lead:'', icon:'🍚', items:[['rice_production','米生産量'],['rice_import','米輸入量'],['rice_export','米輸出量'],['rice_food_supply','1人当たり米供給量']]},
  school:{title:'学校給食', lead:'', icon:'🏫', items:[['school_meal_system','学校給食制度'],['school_meal_target','対象'],['rice_school_meal','米飯給食'],['policy_note','制度メモ']]},
  japan:{title:'日本関連', lead:'', icon:'🇯🇵', items:[['japanese_residents','在留邦人数'],['japanese_restaurants','日本食レストラン'],['favorability_japan','対日好感度'],['trust_japan','日本への信頼度']]}
};
const I18N = {
  ja:{heroTitle:'196の国・地域を、ひと目で比較。',heroText:'基本統計を入口に、米データ、学校給食、日本関連情報を国・地域ごとに見られます。',heroSearch:'国・地域を探す',heroQa:'データ状態を見る',kpiEntities:'国・地域',kpiMetrics:'基本指標',kpiGdp:'GDP系',kpiRelease:'データ',scopeTitle:'196枠は維持',scopeText:'台湾・香港（中国）・マカオ（中国）を含む',rankTitle:'ランキングは採用値のみ',rankText:'欠損値は順位から除外',gapTitle:'GDP未完5地域',gapText:'国・地域ページには残し、未採用として表示',tabCountries:'国・地域',tabRankings:'ランキング',tabCompare:'比較',tabSources:'出典',tabQA:'データ状態',countriesTitle:'国・地域一覧',countriesLead:'検索・地域フィルタから詳細を開けます。',rankingsTitle:'ランキング',rankingsLead:'採用済みデータだけで順位を作成しています。',compareTitle:'比較',compareLead:'2つの国・地域を選び、基本統計・米データ・学校給食・日本関連を横並びで見られます。',sourcesTitle:'出典',sourcesLead:'各データの年・出典を見られます。',qaTitle:'データ状態',qaLead:'データの収録状況を見られます。',rankingNotice:'人口・面積・人口密度は196/196、GDP系は191/196です。',sourceNotice:'未採用・欠損値は — と 状態を添えて表示し、ランキングには入れません。',qaNotice:'196枠は維持し、GDP系5地域は未完として扱います。一部のGDP指標は未取得として表示します。',detail:'詳細',search:'国・地域を検索',allRegions:'すべての地域',allMetrics:'すべての指標',allStatus:'すべての状態',missingOnly:'未取得のみ',readyOnly:'取得済みのみ',coverage:'対象',adoptedOnly:'採用済みデータのみ',missing:'未採用・未取得',noResults:'該当なし',source:'出典',overviewTitle:'基本指標のカバー状況',overviewLead:'カードを押すと、その指標のランキングへ移動します。',gapPanelTitle:'未完5地域の扱い',gapPanelText:'196枠から外さず、GDP系だけ未採用・ランキング対象外として表示します。',quickCompareTitle:'すぐ比較',quickCompareText:'代表的な組み合わせで比較画面を開きます。',rcNoticeTitle:'支援196個國家／地區',rcNoticeText:'196の国・地域を対象に、基本統計・市場情報・出典を見られます。GDP系の一部は未取得として表示します。',workflowTitle:'迷わず使う',workflowLead:'探す・比べる・見る導線を短くしました。',workflowStep1:'国・地域を探す',workflowStep2:'ランキングを見る',workflowStep3:'2地域を比較',workflowStep4:'出典を見る',workflowStep5:'出典を見る',gdpGapOnly:'GDP未完のみ',clearSearch:'検索解除',rankLimit20:'上位20件',rankLimit50:'上位50件',rankLimitAll:'全件表示',sourceLimit60:'60件まで',sourceLimit200:'200件まで',sourceLimitAll:'全件表示',showingLimited:'一部表示中'},
  en:{heroTitle:'Compare 196 countries and areas at a glance.',heroText:'Use core statistics as the entry point to review rice, school meals, and Japan-related information by country or area.',heroSearch:'Find countries/areas',heroQa:'View data status',kpiEntities:'countries/areas',kpiMetrics:'metrics',kpiGdp:'GDP metrics',kpiRelease:'data',scopeTitle:'196 scope kept',scopeText:'Includes Taiwan, Hong Kong (China), and Macao (China)',rankTitle:'Rankings use adopted values',rankText:'Missing values are excluded from ranks',gapTitle:'5 GDP gaps',gapText:'Kept in entity pages and shown as not adopted',tabCountries:'Countries/Areas',tabRankings:'Rankings',tabCompare:'Compare',tabSources:'Sources',tabQA:'Data status',countriesTitle:'Countries / Areas',countriesLead:'Search and filter by region to open details.',rankingsTitle:'Rankings',rankingsLead:'Ranks are built only from adopted values.',compareTitle:'Compare',compareLead:'Select two countries/areas and compare core stats, rice, school meals, and Japan-related data.',sourcesTitle:'Sources',sourcesLead:'Check year, source, and status for each data point.',qaTitle:'Data status',qaLead:'Data coverage summary for the 196-country/area dataset.',rankingNotice:'Population, area, and density are 196/196. GDP metrics are 191/196.',sourceNotice:'Missing or not-adopted values are shown with — and status, and are excluded from rankings.',qaNotice:'The 196 scope is kept. GDP metrics for 5 areas remain incomplete. Some GDP metrics remain marked as missing.',detail:'Detail',search:'Search country/area',allRegions:'All regions',allMetrics:'All metrics',allStatus:'All status',missingOnly:'Missing only',readyOnly:'Ready only',coverage:'Coverage',adoptedOnly:'adopted values only',missing:'missing / not adopted',noResults:'No results',source:'source',overviewTitle:'Basic metric coverage',overviewLead:'Tap a card to open that metric ranking.',gapPanelTitle:'How the 5 gaps are handled',gapPanelText:'They remain in the 196 scope, with GDP metrics shown as not adopted and excluded from affected rankings.',quickCompareTitle:'Quick compare',quickCompareText:'Open representative country/area pairs in the compare view.',rcNoticeTitle:'196 countries and areas',rcNoticeText:'Covers 196 countries and areas. Some GDP metrics are shown as missing when not available.',workflowTitle:'Fast flow',workflowLead:'Shorter path for search, ranking, comparison, and sources.',workflowStep1:'Find countries/areas',workflowStep2:'View rankings',workflowStep3:'Compare two areas',workflowStep4:'Check sources',workflowStep5:'Check sources',gdpGapOnly:'GDP gaps only',clearSearch:'Clear search',rankLimit20:'Top 20',rankLimit50:'Top 50',rankLimitAll:'Show all',sourceLimit60:'Show 60',sourceLimit200:'Show 200',sourceLimitAll:'Show all',showingLimited:'showing limited results'},
  zh_tw:{heroTitle:'一眼比較196個國家／地區。',heroText:'以基本統計為入口，依國家・地區查看市場・零售、稻米、學校供餐與日本相關資訊。',heroSearch:'搜尋國家／地區',heroQa:'查看資料狀態',kpiEntities:'國家／地區',kpiMetrics:'基本指標',kpiGdp:'GDP指標',kpiRelease:'資料',scopeTitle:'維持196範圍',scopeText:'包含台灣、香港（中國）、澳門（中國）',rankTitle:'排名只用採用值',rankText:'缺漏值不進入排名',gapTitle:'5個GDP未完',gapText:'保留於頁面並顯示為未採用',tabCountries:'國家／地區',tabRankings:'排名',tabCompare:'比較',tabSources:'來源',tabQA:'資料狀態',countriesTitle:'國家／地區列表',countriesLead:'可搜尋並依地區篩選。',rankingsTitle:'排名',rankingsLead:'僅以已採用資料建立排名。',compareTitle:'比較',compareLead:'選擇兩個國家／地區，橫向比較基本統計、稻米、零售、學校供餐與日本相關資料。',sourcesTitle:'來源',sourcesLead:'查看各資料的年份、來源與狀態。',qaTitle:'資料狀態',qaLead:'資料收錄狀況摘要。',rankingNotice:'人口、面積、人口密度為196/196，GDP指標為191/196。',sourceNotice:'未採用或缺漏值以 — 與狀態顯示，不進入排名。',qaNotice:'維持196範圍，GDP指標有5個地區未完。部分GDP指標以未取得顯示。',detail:'詳情',search:'搜尋國家／地區',allRegions:'所有地區',allMetrics:'所有指標',allStatus:'所有狀態',missingOnly:'僅未取得',readyOnly:'僅已取得',coverage:'對象',adoptedOnly:'僅已採用資料',missing:'未採用／未取得',noResults:'無結果',source:'來源',overviewTitle:'基本指標覆蓋狀態',overviewLead:'點選卡片即可切換到該指標排名。',gapPanelTitle:'5個未完地區的處理',gapPanelText:'不從196範圍移除，GDP指標顯示為未採用並排除於相關排名。',quickCompareTitle:'快速比較',quickCompareText:'用代表性組合開啟比較畫面。',rcNoticeTitle:'支援196個國家／地區',rcNoticeText:'支援196個國家／地區。部分GDP資料以未取得顯示。',workflowTitle:'快速使用流程',workflowLead:'縮短搜尋、排名、比較與來源的動線。',workflowStep1:'搜尋國家／地區',workflowStep2:'查看排名',workflowStep3:'比較兩個地區',workflowStep4:'查看來源',workflowStep5:'查看來源',gdpGapOnly:'僅GDP未完',clearSearch:'清除搜尋',rankLimit20:'前20筆',rankLimit50:'前50筆',rankLimitAll:'顯示全部',sourceLimit60:'最多60筆',sourceLimit200:'最多200筆',sourceLimitAll:'顯示全部',showingLimited:'部分顯示中'},
  zh_cn:{heroTitle:'一眼比较196个国家／地区。',heroText:'以基本统计为入口，按国家／地区确认市场零售、稻米、学校供餐与日本相关信息。',heroSearch:'搜索国家／地区',heroQa:'查看数据状态',kpiEntities:'国家／地区',kpiMetrics:'基本指标',kpiGdp:'GDP指标',kpiRelease:'数据',scopeTitle:'维持196范围',scopeText:'包含台湾、香港（中国）、澳门（中国）',rankTitle:'排名只用采用值',rankText:'缺漏值不进入排名',gapTitle:'5个GDP未完',gapText:'保留于页面并显示为未采用',tabCountries:'国家／地区',tabRankings:'排名',tabCompare:'比较',tabSources:'来源',tabQA:'数据状态',countriesTitle:'国家／地区列表',countriesLead:'可搜索并按地区筛选。',rankingsTitle:'排名',rankingsLead:'仅以已采用数据建立排名。',compareTitle:'比较',compareLead:'选择两个国家／地区，横向比较基本统计、稻米、零售、学校供餐与日本相关数据。',sourcesTitle:'来源',sourcesLead:'确认各数据的年份、来源与状态。',qaTitle:'数据状态',qaLead:'数据收录状况摘要。',rankingNotice:'人口、面积、人口密度为196/196，GDP指标为191/196。',sourceNotice:'未采用或缺漏值以 — 和状态显示，不进入排名。',qaNotice:'维持196范围，GDP指标有5个地区未完。部分GDP指标以未取得显示。',detail:'详情',search:'搜索国家／地区',allRegions:'所有地区',allMetrics:'所有指标',allStatus:'所有状态',missingOnly:'仅未取得',readyOnly:'仅已取得',coverage:'对象',adoptedOnly:'仅已采用数据',missing:'未采用／未取得',noResults:'无结果',source:'来源',overviewTitle:'基本指标覆盖状态',overviewLead:'点击卡片即可切换到该指标排名。',gapPanelTitle:'5个未完地区的处理',gapPanelText:'不从196范围移除，GDP指标显示为未采用并排除于相关排名。',quickCompareTitle:'快速比较',quickCompareText:'用代表性组合打开比较画面。',rcNoticeTitle:'支持196个国家／地区',rcNoticeText:'支持196个国家／地区。部分GDP数据以未取得显示。',workflowTitle:'快速使用流程',workflowLead:'缩短搜索、排名、比较与来源的动线。',workflowStep1:'搜索国家／地区',workflowStep2:'查看排名',workflowStep3:'比较两个地区',workflowStep4:'确认来源',workflowStep5:'确认来源',gdpGapOnly:'仅GDP未完',clearSearch:'清除搜索',rankLimit20:'前20条',rankLimit50:'前50条',rankLimitAll:'显示全部',sourceLimit60:'最多60条',sourceLimit200:'最多200条',sourceLimitAll:'显示全部',showingLimited:'部分显示中'}
};
const lang='ja';
let entities=[];
const prefectureReferences=Array.isArray(window.MARKET_BASE_PREFECTURE_REFERENCE_DATA?.prefectures)
  ? window.MARKET_BASE_PREFECTURE_REFERENCE_DATA.prefectures
  : [];
const crossDbSearchIndex=window.MARKET_BASE_CROSS_DB_SEARCH_INDEX || {dbs:[]};
let rankings={};
let retailData=null;
let retailPresenceData=null;
let retailProfilesData=null;
let retailCountryCardSummaryData=null;
const RETAIL_DETAIL_DATA_IN_MAIN=false;
let riceData=null;
let riceRankings={};
let schoolMealsData=null;
let schoolMealRankings={};
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
let marketFilters={q:'', region:'all', entity:'all', category:'all', info:'all', count:'all'};
let companyHomeFilters={region:'all', entity:'all'};
let marketVisibleLimit=36;
let schoolVisibleLimit=24;
let schoolFilters={q:'', region:'all'};
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
function isPrefectureReference(entity){ return entity?.entity_type==='prefecture_reference' || entity?.reference_only===true; }
function comparisonEntities(){ return entities.concat(prefectureReferences); }
function nameOf(e){ return e.names?.[lang] || e.names?.ja || e.names?.en || e.entity_id; }
function metricName(m){ return METRICS[m]?.label?.[lang] || METRICS[m]?.label?.ja || m; }
function sourceLine(stat){ return `${stat?.data_year || '—'} / ${stat?.source_name || stat?.source_id || '出典未入力'}`; }
function fmtJapaneseIntegerUnit(n, unit){
  const rounded=Math.round(Math.abs(n));
  const sign=n<0?'-':'';
  const cho=Math.floor(rounded/1e12);
  const oku=Math.floor((rounded%1e12)/1e8);
  const man=Math.floor((rounded%1e8)/1e4);
  const rest=rounded%1e4;
  const parts=[];
  if(cho) parts.push(`${cho.toLocaleString('ja-JP')}兆`);
  if(oku) parts.push(`${oku.toLocaleString('ja-JP')}億`);
  if(man) parts.push(`${man.toLocaleString('ja-JP')}万`);
  if(rest || !parts.length) parts.push(rest.toLocaleString('ja-JP'));
  return `${sign}${parts.join('')}${unit}`;
}
function fmtJapaneseGdp(n){
  const sign=n<0?'-':'';
  const abs=Math.abs(n);
  if(abs>=1e8){
    const roundedOku=Math.round(abs/1e8);
    const cho=Math.floor(roundedOku/10000);
    const oku=roundedOku%10000;
    const parts=[];
    if(cho) parts.push(`${cho.toLocaleString('ja-JP')}兆`);
    if(oku) parts.push(`${oku.toLocaleString('ja-JP')}億`);
    return `${sign}${parts.join('')}米ドル`;
  }
  return fmtJapaneseIntegerUnit(n,'米ドル');
}
function fmt(v, metric){
  if(v===null || v===undefined || v==='') return '—';
  const n=Number(v);
  if(!Number.isFinite(n)) return safe(v);
  if(lang==='ja'){
    if(metric==='population') return fmtJapaneseIntegerUnit(n,'人');
    if(metric==='area_land_km2') return fmtJapaneseIntegerUnit(n,'km²');
    if(metric==='gdp_current_usd') return fmtJapaneseGdp(n);
    if(metric==='gdp_pc_current_usd') return `${fmtJapaneseIntegerUnit(n,'米ドル')}／人`;
    if(metric==='population_density') return `${n.toLocaleString('ja-JP',{maximumFractionDigits:1})}人／km²`;
  }
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
function metricWorldRank(entity, metric){
  const current=Number(getStat(entity,metric)?.value);
  if(!Number.isFinite(current)) return null;
  const values=entities.map(e=>Number(getStat(e,metric)?.value)).filter(Number.isFinite);
  if(!values.length) return null;
  return {rank:1+values.filter(v=>v>current).length,total:values.length};
}
function rankingKey(metric){ return METRICS[metric]?.ranking || metric; }
function getRanking(metric){
  const key=rankingKey(metric);
  if(rankings[key]) return rankings[key];
  for(const a of (METRICS[metric]?.aliases||[])) if(rankings[a]) return rankings[a];
  return null;
}
function coverageText(metric){ return (metric==='gdp_current_usd'||metric==='gdp_pc_current_usd') ? '191 / 196' : '196 / 196'; }

function rankingSelection(raw){
  const value=String(raw || 'population');
  if(value.includes(':')){
    const [domain, ...rest]=value.split(':');
    return {domain, metric:rest.join(':')};
  }
  return {domain:'basic', metric:value};
}
function rankingSelectValue(domain, metric){ return domain==='basic' ? metric : `${domain}:${metric}`; }
function rankingLabel(domain, metric){
  if(domain==='basic') return metricName(metric);
  if(domain==='rice') return riceMetricLabel(metric);
  if(domain==='school') return SCHOOL_METRICS[metric]?.label || metric;
  if(domain==='japan') return japanMetricLabel(metric);
  return metric;
}
function rankingItemsFor(domain, metric){
  if(domain==='basic'){ const r=getRanking(metric); return r ? {items:r.items || [], ranking:r} : null; }
  if(domain==='rice'){ const r=riceRankings?.[metric] || riceRankings?.rankings?.[metric]; return r ? {items:r.items || [], ranking:r} : null; }
  if(domain==='school'){ const r=schoolMealRankings?.[metric] || schoolMealRankings?.rankings?.[metric]; return r ? {items:r.items || [], ranking:r} : null; }
  if(domain==='japan'){ const r=japanRelatedRankings?.[metric] || japanRelatedRankings?.rankings?.[metric]; return r ? {items:r.items || [], ranking:r} : null; }
  return null;
}
function rankingCoverageText(domain, metric){
  const data=rankingItemsFor(domain, metric);
  const count=data?.items?.length || 0;
  return `${count} / ${entities.length || 196}`;
}
function formatUnifiedRankingValue(item, domain, metric){
  if(domain==='basic') return `${fmt(item.value, metric)} ${item.display_unit_ja || item.unit || ''}`.trim();
  if(domain==='rice') return fmtRiceValue(item, metric);
  if(domain==='school') return fmtSchoolValue(item, metric);
  if(domain==='japan') return formatJapanRankingValue(item, metric);
  return item?.value ?? '—';
}
function unifiedRankingSourceLine(item, domain, metric){
  if(domain==='basic') return `${item?.data_year || '—'} / ${item?.source_name || '出典未入力'}`;
  if(domain==='rice') return `${item?.year || '—'} / ${item?.source || 'FAOSTAT'}`;
  if(domain==='school') return `${item?.year || '—'} / ${item?.source || 'WFP/GCNF/UNESCO'}`;
  if(domain==='japan') return japanRankingSubline(item, metric);
  return '';
}
function schoolRankingKeys(){
  return SCHOOL_RANKING_PRIORITY.slice();
}
function rankingOptionGroupsHtml(){
  const basicOptions=UI_METRICS.map(m=>`<option value="${safe(rankingSelectValue('basic',m))}">${safe(rankingLabel('basic',m))}</option>`).join('');
  const riceKeys=Object.keys(riceRankings || {}).filter(k=>(riceRankings[k]?.items || []).length);
  const riceOptions=riceKeys.map(m=>`<option value="${safe(rankingSelectValue('rice',m))}">${safe(rankingLabel('rice',m))}</option>`).join('');
  const schoolKeys=schoolRankingKeys();
  const schoolOptions=schoolKeys.map(m=>`<option value="${safe(rankingSelectValue('school',m))}">${safe(rankingLabel('school',m))}</option>`).join('');
  const japanKeys=publicJapanRankingKeys();
  const japanOptions=japanKeys.map(m=>`<option value="${safe(rankingSelectValue('japan',m))}">${safe(rankingLabel('japan',m))}</option>`).join('');
  return `<optgroup label="基本統計">${basicOptions}</optgroup>`
    + (riceOptions ? `<optgroup label="米データ">${riceOptions}</optgroup>` : '')
    + (schoolOptions ? `<optgroup label="学校給食">${schoolOptions}</optgroup>` : '')
    + (japanOptions ? `<optgroup label="日本関連">${japanOptions}</optgroup>` : '');
}

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
function incomeSourceLine(r){ return r ? `${r.fiscal_year || '—'} / ${r.source_name || '出典未入力'}` : '—'; }

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
function recentEntitiesForDisplay(){
  const ids=getRecentEntityIds();
  const recent=ids.map(id=>entities.find(e=>e.entity_id===id)).filter(Boolean);
  if(recent.length) return recent;
  return ['TW','JP','US'].map(id=>entities.find(e=>e.entity_id===id)).filter(Boolean);
}
function bindRecentOpen(container){
  if(!container) return;
  container.querySelectorAll('[data-recent-open]').forEach(btn=>btn.addEventListener('click',()=>openDetail(btn.dataset.recentOpen)));
}
function renderTargetRecentEntities(){
  const el=document.getElementById('targetRecentGrid'); if(!el) return;
  const recent=recentEntitiesForDisplay().slice(0,3);
  el.innerHTML=recent.map(e=>`<button type="button" data-recent-open="${safe(e.entity_id)}"><span class="target-recent-flag">${flagMarkup(e,'flag-img-target-recent')}</span><strong>${safe(nameOf(e))}</strong></button>`).join('');
  bindRecentOpen(el);
}
function renderRecentEntities(){
  renderTargetRecentEntities();
  const el=document.getElementById('recentEntityGrid'); if(!el) return;
  const ids=getRecentEntityIds();
  const recent=ids.map(id=>entities.find(e=>e.entity_id===id)).filter(Boolean);
  if(!recent.length){
    el.innerHTML=`<article class="recent-empty-card"><strong>まだ履歴はありません</strong><span>国・地域の詳細を開くと、ここに最大6件まで表示されます。</span></article>`;
    return;
  }
  el.innerHTML=recent.map((e,i)=>`<button class="visual-card ${i===0?'visual-card-main':''}" data-recent-open="${safe(e.entity_id)}"><span class="${i===0?'big-flag':''}">${flagMarkup(e, i===0?'flag-img-hero':'flag-img-card')}</span><strong>${safe(nameOf(e))}</strong><em>最近見た</em></button>`).join('');
  bindRecentOpen(el);
}
const GLOBAL_DB_ICONS={
  imported_food_machinery:'機',retail_sales:'店',flight_kitchen:'空',rail_food_kitchen:'駅',
  cvs_vendor:'CVS',gohan_food_manufacturers:'食',school_meal_center:'給'
};
let globalSearchScope='all';
const GLOBAL_SEARCH_SCOPE_LABELS={all:'すべて',countries:'国・地域',companies:'企業・ブランド',content:'商品・本文'};
function updateGlobalSearchScopeButtons(){
  document.querySelectorAll('[data-global-search-scope]').forEach(button=>{
    const active=button.dataset.globalSearchScope===globalSearchScope;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
}
function globalSearchCountryMatches(query){
  const nq=normalizeSearchText(query);
  if(!nq) return [];
  return entities.filter(e=>queryMatchesEntity(e,query)).map(e=>{
    const names=[nameOf(e),e.names?.ja,e.names?.en,aliasTextForEntity(e)].map(normalizeSearchText);
    const exact=names.some(x=>x===nq);
    return {entity:e,score:exact?0:(entitySearchText(e).split(' ').includes(nq)?1:2)};
  }).sort((a,b)=>a.score-b.score || nameOf(a.entity).localeCompare(nameOf(b.entity),'ja')).slice(0,8);
}
function globalSearchDbMatches(query,scope=globalSearchScope){
  const nq=normalizeSearchText(query);
  if(!nq) return [];
  return (crossDbSearchIndex.dbs||[]).map(db=>{
    const countryMatches=scope==='all' ? (db.countries||[]).filter(x=>normalizeSearchText(x).includes(nq) || nq.includes(normalizeSearchText(x))) : [];
    const recordMatches=(db.records||[]).filter(record=>{
      const title=normalizeSearchText(record?.title ?? record);
      const fulltext=normalizeSearchText(record?.search ?? record);
      if(scope==='companies') return title.includes(nq);
      return fulltext.includes(nq);
    });
    return {...db,countryMatches,recordMatches};
  }).filter(x=>x.countryMatches.length || x.recordMatches.length);
}
function globalDbLinkHref(db,query=''){
  const q=String(query||'').trim();
  return q ? `${db.url}?q=${encodeURIComponent(q)}` : db.url;
}
function renderGlobalDbLinks(){
  const el=document.getElementById('globalSearchDbLinks'); if(!el) return;
  el.innerHTML=(crossDbSearchIndex.dbs||[]).map(db=>`<a class="global-db-link-card" href="${safe(globalDbLinkHref(db))}"><span>${safe(GLOBAL_DB_ICONS[db.id]||'DB')}</span><strong>${safe(db.title)}</strong><em>DBを見る ›</em></a>`).join('');
}
function renderGlobalSearch(query){
  const el=document.getElementById('globalSearchResults'); if(!el) return;
  const q=String(query||'').trim();
  const countries=(globalSearchScope==='all'||globalSearchScope==='countries') ? globalSearchCountryMatches(q) : [];
  const dbs=globalSearchScope==='countries' ? [] : globalSearchDbMatches(q,globalSearchScope);
  const countryHtml=countries.length ? `<section class="global-result-section"><h3>国・地域</h3><div class="global-country-results">${countries.map(({entity:e})=>`<button type="button" onclick="openDetail('${safe(e.entity_id)}')"><span>${flagMarkup(e,'flag-img-table')}</span><span><strong>${safe(nameOf(e))}</strong><em>${safe(e.region||'')} / ${safe(e.subregion||'')}</em></span><b>詳細を見る ›</b></button>`).join('')}</div></section>` : '';
  const dbHtml=dbs.length ? `<section class="global-result-section"><h3>専門データベース</h3><div class="global-db-results">${dbs.map(db=>{
    const samples=db.recordMatches.slice(0,4);
    const countryNote=db.countryMatches.length ? `${db.countryMatches.slice(0,3).join('・')}の収録あり` : '';
    const countLabel=globalSearchScope==='companies'?'名称一致':'本文・商品を含む一致';
    const countNote=db.recordMatches.length ? `${countLabel} ${db.recordMatches.length}件` : '関連データあり';
    return `<article class="global-db-result-card"><div class="global-db-result-head"><span>${safe(GLOBAL_DB_ICONS[db.id]||'DB')}</span><div><strong>${safe(db.title)}</strong><em>${safe(db.category)}｜${safe(countryNote||countNote)}</em></div></div>${samples.length?`<div class="global-db-match-list">${samples.map(record=>`<span>${safe(record?.title ?? record)}</span>`).join('')}</div>`:''}<a href="${safe(globalDbLinkHref(db,q))}">「${safe(q)}」をDBで見る ›</a></article>`;
  }).join('')}</div></section>` : '';
  const empty=(!countries.length&&!dbs.length) ? `<div class="global-search-empty"><strong>「${safe(q)}」の一致はありません</strong><span>表記を短くして再検索してください。</span></div>` : '';
  el.innerHTML=q ? `<div class="global-search-summary"><strong>「${safe(q)}」の検索結果</strong><span>${safe(GLOBAL_SEARCH_SCOPE_LABELS[globalSearchScope])}｜国・地域 ${countries.length}件 / 専門DB ${dbs.length}件</span></div>${countryHtml}${dbHtml}${empty}` : '<div class="global-search-empty"><strong>検索語を入力してください</strong><span>国名、地域名、企業名、ブランド名、商品名、本文を同じ窓で検索できます。</span></div>';
}
function setGlobalSearchScope(scope){
  if(!Object.prototype.hasOwnProperty.call(GLOBAL_SEARCH_SCOPE_LABELS,scope)) return;
  globalSearchScope=scope;
  updateGlobalSearchScopeButtons();
  renderGlobalSearch(document.getElementById('globalSearchInput')?.value || '');
}
function openGlobalSearch(query){
  const q=String(query||'').trim();
  const input=document.getElementById('globalSearchInput'); if(input) input.value=q;
  renderGlobalSearch(q);
  updateGlobalSearchScopeButtons();
  renderGlobalDbLinks();
  switchView('global-search');
  document.querySelector('.bottom-tab[data-home="true"]')?.classList.add('active');
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
  if(view==='compare'){
    setTimeout(()=>renderCompare(), 0);
  }
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

function retailCategoryKey(record){
  const raw=String(record.channel_type || record.retail_format_id || record.retail_format_display_ja || '').toLowerCase();
  if(raw.includes('convenience') || raw==='cvs' || raw.includes('コンビニ')) return 'convenience_store';
  if(raw.includes('hypermarket') || raw.includes('ハイパー')) return 'hypermarket';
  if(raw.includes('warehouse') || raw.includes('club') || raw.includes('cash') || raw.includes('gms') || raw.includes('department') || raw.includes('量販') || raw.includes('大型') || raw.includes('倉庫')) return 'gms';
  if(raw.includes('supermarket') || raw.includes('grocery') || raw.includes('food') || raw.includes('market') || raw.includes('スーパー') || raw.includes('スーパーマーケット') || raw.includes('食品')) return 'supermarket';
  return 'other';
}
function retailCategoryLabel(key){
  return ({convenience_store:'コンビニ', supermarket:'スーパー', gms:'GMS・会員制/大型店', hypermarket:'ハイパーマーケット', other:'その他小売'})[key] || 'その他小売';
}
function retailCountNumber(v){
  if(v===null || v===undefined || v==='') return null;
  const n=Number(String(v).replace(/[,，\s店店舗約超+]/g,''));
  return Number.isFinite(n) ? n : null;
}
function retailCountFromItem(item){
  const counts=(item.store_counts || []).map(c=>retailCountNumber(c.store_count)).filter(n=>Number.isFinite(n));
  if(counts.length) return counts.reduce((a,b)=>a+b,0);
  const n=retailCountNumber(item.store_count);
  return Number.isFinite(n) ? n : null;
}

function retailIsAggregateCountRecord(item){
  const idName=[
    item?.chain_id,
    item?.chain_name,
    item?.channel_type,
    item?.retail_format_display_ja,
    item?.source_name
  ].filter(Boolean).join(' ').toLowerCase();
  const note=String(item?.note || '').toLowerCase();
  if(/\baggregate\b|合計|総数|\bcombined\b|four major|convenience store total|chains aggregate|major convenience-store chains/.test(idName)) return true;
  if(/franchise association|industry association|jfa/.test(idName) && /\btotal\b|合計|総数/.test(idName + ' ' + note)) return true;
  if(/combined store count|combined stores|four major chains|aggregate only|not split by chain|combined store count of/.test(note)) return true;
  return false;
}

function retailAggregate(items){
  const order=['convenience_store','supermarket','gms','hypermarket','other'];
  const result=Object.fromEntries(order.map(k=>[k,{key:k, chains:0, withCounts:0, stores:0, aggregateStores:[], individualStores:0, examples:[], aggregateExamples:[], aggregateMode:false}]));
  (items||[]).forEach(item=>{
    const key=retailCategoryKey(item);
    const bucket=result[key] || result.other;
    bucket.chains += 1;
    const n=retailCountFromItem(item);
    const name=item.chain_name || item.retail_format_display_ja || item.channel_type;
    if(name && bucket.examples.length<4) bucket.examples.push(name);
    if(Number.isFinite(n)){
      const isAggregate=retailIsAggregateCountRecord(item);
      if(isAggregate){
        bucket.aggregateStores.push(n);
        if(name && bucket.aggregateExamples.length<3) bucket.aggregateExamples.push(name);
      }else{
        bucket.withCounts += 1;
        bucket.individualStores += n;
      }
    }
  });
  order.forEach(k=>{
    const bucket=result[k];
    if(bucket.aggregateStores.length){
      bucket.aggregateMode=true;
      bucket.stores=Math.max(...bucket.aggregateStores);
      bucket.withCounts=bucket.aggregateStores.length;
    }else{
      bucket.stores=bucket.individualStores;
    }
  });
  return order.map(k=>result[k]).filter(x=>x.chains>0);
}
function retailAggregateCards(items, scopeLabel='収録チェーン集計'){
  const groups=retailAggregate(items);
  if(!groups.length) return '';
  const cards=groups.map(g=>{
    const value=g.withCounts ? `${Math.round(g.stores).toLocaleString()}店` : '店舗数未集計';
    const quality=g.withCounts
      ? (g.aggregateMode ? `合計値${g.withCounts}件を使用・個別チェーンは重複除外` : `${g.withCounts}/${g.chains}件に店舗数`)
      : `${g.chains}チェーン・展開情報`;
    const examples=g.aggregateMode && g.aggregateExamples.length
      ? `<small>合計元：${safe(g.aggregateExamples.join(' / '))}</small>`
      : (g.examples.length ? `<small>${safe(g.examples.join(' / '))}</small>` : '');
    return `<article class="retail-aggregate-card retail-aggregate-${safe(g.key)}"><strong>${safe(retailCategoryLabel(g.key))}</strong><span>${safe(value)}</span><em>${safe(quality)}</em>${examples}</article>`;
  }).join('');
  return `<div class="retail-aggregate-block"><div class="retail-aggregate-head"><strong>${safe(scopeLabel)}</strong></div><div class="retail-aggregate-grid">${cards}</div></div>`;
}
function storeCountText(record){
  const n=Number(record.store_count);
  const value=Number.isFinite(n) ? n.toLocaleString() : safe(record.store_count);
  const unitRaw=String(record.unit || '').trim();
  if(/^stores\+$/i.test(unitRaw)) return `${value}店舗以上`;
  if(/^stores?$/i.test(unitRaw) || /^outlets?$/i.test(unitRaw)) return `${value}店`;
  if(/^warehouses?$/i.test(unitRaw)) return `${value}倉庫店`;
  return `${value}${unitRaw || '店'}`;
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

function retailChannelLabel(raw){
  const t=String(raw||'').toLowerCase();
  if(t.includes('convenience')) return 'コンビニ';
  if(t.includes('hypermarket')) return 'ハイパーマーケット';
  if(t.includes('warehouse') || t.includes('membership') || t.includes('cash') || t.includes('gms') || t.includes('department')) return 'GMS・大型店';
  if(t.includes('express')) return '小型スーパー';
  if(t.includes('supermarket') || t.includes('grocery') || t.includes('market') || t.includes('food')) return 'スーパー';
  if(t.includes('discount')) return 'ディスカウント';
  return raw ? String(raw).replaceAll('_','・') : '小売';
}
function retailInfoLabel(record){
  const raw=String(record.display_info_type || record.source_type || '');
  if(raw.includes('公式') || raw==='official') return '公式情報';
  if(raw.includes('準公式') || raw==='semi_official') return '準公式情報';
  if(raw.includes('参考') || raw==='reference') return '参考情報';
  if(raw.includes('過去')) return '過去情報';
  if(raw.includes('確'+'認')) return '展開情報';
  return '展開情報';
}
function retailDataDateLabel(record){
  const raw=String(record.data_date || record.as_of_date || record.found_date || '').trim();
  if(!raw) return '時点未設定';
  return raw.replace(/^current page\s*/i,'現行ページ ').replace(/^checked\s*/i,'掲載 ').replace(/^market overview\s*/i,'市場概況 ');
}
function retailJapaneseNote(record){
  const note=String(record.note || '').trim();
  if(!note) return '';
  if(/[ぁ-んァ-ン一-龥]/.test(note)) return note;
  const lower=note.toLowerCase();
  const countMatch=note.match(/(\d[\d,]*)\s+(?:stores|outlets|branches|supermarkets|express stores)/i);
  const countText=countMatch ? `${countMatch[1]}店` : '';
  if(lower.includes('reference market overview')) return `${countText?`参考資料では${countText}。`:''}公式の現行店舗数ではないため、参考情報として載せています。`;
  if(lower.includes('official site confirms')) return `公式サイトの展開情報。${countText?`店舗数は${countText}です。`:'店舗数は無理に補っていません。'}`;
  if(lower.includes('company page says') || lower.includes('company page confirms')) return `会社ページの展開情報。${countText?`店舗数は${countText}です。`:'店舗数は未確定です。'}`;
  if(lower.includes('official page confirms')) return `公式ページの展開情報。${countText?`店舗数は${countText}です。`:'国別店舗数が未確定のため、展開情報として載せています。'}`;
  if(lower.includes('store count not fixed') || lower.includes('not directly confirmed') || lower.includes('not attached')) return '展開情報あり。公式の現行店舗数が固定できないため、店舗数は未確定として扱います。';
  if(lower.includes('presence')) return '展開情報あり。店舗数が未確定の場合は、参考情報として表示しています。';
  return '出典ページに掲載される展開情報です。店舗数が未確定の場合は、参考情報として載せています。';
}
function storeCountsFromChain(chain){
  return (chain.store_counts || []).filter(r=>r && r.store_count !== null && r.store_count !== undefined && r.store_count !== '');
}
function retailStoreCountLine(record){
  const info=retailInfoLabel(record);
  const date=retailDataDateLabel(record);
  return `<em>${storeCountText(record)}</em><span class="retail-info-chip">${safe(date)}・${safe(info)}</span>`;
}

function openRetailRecordDetail(encodedChainName, encodedEntityId){
  const chainName=decodeURIComponent(encodedChainName || '');
  const entityId=decodeURIComponent(encodedEntityId || '');
  const records=(retailData?.records || []);
  const record=records.find(r=>String(r.chain_name||'')===chainName && (!entityId || String(r.entity_id||'')===entityId));
  if(!record) return;
  const e=entities.find(x=>x.entity_id===record.entity_id);
  const link=sourceLink(retailSourceUrl(record), '出典');
  const note=retailJapaneseNote(record);
  const count=retailStoreCountLine(record);
  const rows=[
    ['国・地域', e ? `${flagText(e)} ${safe(nameOf(e))}` : safe(record.entity_id || '')],
    ['業態・カテゴリ', safe(retailChannelLabel(record.retail_format_display_ja || record.channel_type || record.retail_format_id || '小売'))],
    ['店舗数', count],
    ['情報区分', safe(retailInfoLabel(record))],
    ['ブランド発祥', brandOriginText(record) || ''],
    ['出典', link]
  ].filter(r=>r[1]!=='' && r[1]!==undefined && r[1]!==null).map(r=>`<div class="profile-info-row"><span>${r[0]}</span><strong>${r[1]}</strong></div>`).join('');
  document.getElementById('detailContent').innerHTML=`<div class="detail-header retail-profile-detail-header"><div class="detail-flag retail-profile-initial">${safe((record.chain_name||'小売').slice(0,2))}</div><div class="detail-title-block"><h2>${safe(record.chain_name || '小売データ')}</h2><p class="country-sub">${e?`${flagText(e)} ${safe(nameOf(e))}`:''}｜${safe(retailChannelLabel(record.retail_format_display_ja || record.channel_type || '小売'))}</p><div class="detail-mini-tabs"><span>小売データ</span><span>店舗数</span><span>出典</span></div></div></div><section class="detail-section retail-profile-detail"><h3>${safe(record.chain_name || '小売データ')}</h3>${rows}<article class="market-note-card retail-profile-body"><h4>店舗本文</h4><p>${note?safe(note):'小売データとして登録されています。'}</p></article></section>`;
  const dialog=document.getElementById('detailDialog');
  if(!dialog.open) dialog.showModal();
}

function retailRecordCard(record){
  const origin=brandOriginText(record);
  const link=sourceLink(retailSourceUrl(record), '出典');
  const chainName=encodeURIComponent(record.chain_name || record.retail_format_display_ja || '小売データ');
  const entityId=encodeURIComponent(record.entity_id || '');
  return `<article class="market-data-card retail-record-card ${retailInfoClass(record)}" role="button" tabindex="0" onclick="openRetailRecordDetail('${chainName}','${entityId}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openRetailRecordDetail('${chainName}','${entityId}')}"><div class="retail-card-head"><strong>${safe(record.chain_name || record.retail_format_display_ja || '小売データ')}</strong><span>${safe(retailChannelLabel(record.retail_format_display_ja || record.channel_type || record.retail_format_id || '小売'))}</span></div>${retailStoreCountLine(record)}${origin?`<span class="retail-origin-chip">${origin}</span>`:''}<p class="retail-note">${safe(retailJapaneseNote(record))}</p><div class="retail-source-line" onclick="event.stopPropagation()">${link}</div><div class="retail-source-line"><button class="retail-more-button" type="button" onclick="event.stopPropagation();openRetailRecordDetail('${chainName}','${entityId}')">詳細を開く</button></div></article>`;
}
function retailPresenceCard(chain){
  const counts=storeCountsFromChain(chain);
  const info=retailInfoLabel(chain);
  const countText=counts.length
    ? counts.map(c=>storeCountText({...c, chain_name:chain.chain_name, brand_origin_country:chain.brand_origin_country})).filter(Boolean).join(' / ')
    : '進出情報';
  const date=retailDataDateLabel(chain);
  const origin=brandOriginText(chain);
  const country=chain.entity_id ? entities.find(e=>e.entity_id===chain.entity_id) : null;
  const countryLine=country ? `<span class="retail-country-chip">${flagText(country)} ${safe(nameOf(country))}</span>` : '';
  const link=sourceLink(retailSourceUrl(chain), '出典');
  const note=retailJapaneseNote(chain);
  const chainId=encodeURIComponent(chain.chain_id || '');
  const chainName=encodeURIComponent(chain.chain_name || '');
  return `<article class="market-data-card retail-presence-card retail-compact-card ${retailInfoClass(chain)}" role="button" tabindex="0" onclick="openRetailChainDetail('${safe(chain.entity_id||'')}','${chainId}','${chainName}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openRetailChainDetail('${safe(chain.entity_id||'')}','${chainId}','${chainName}')}"><div class="retail-card-top"><div><strong>${safe(chain.chain_name || '小売チェーン')}</strong>${countryLine}</div><span class="retail-category-pill">${safe(retailChannelLabel(chain.channel_type || '小売'))}</span></div><div class="retail-card-facts"><span class="retail-store-pill">${safe(countText)}</span><span class="retail-info-chip">${safe(date)}・${safe(info)}</span>${origin?`<span class="retail-origin-chip">${origin}</span>`:''}</div>${note?`<p class="retail-note retail-note-compact">${safe(note)}</p>`:''}<div class="retail-source-line" onclick="event.stopPropagation()">${link}</div><div class="retail-source-line"><button class="retail-more-button" type="button" onclick="event.stopPropagation();openRetailChainDetail('${safe(chain.entity_id||'')}','${chainId}','${chainName}')">詳細を開く</button></div></article>`;
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
  const state=expanded ? '全件表示中' : '詳細データ保持済み';
  return visible + `<article class="market-data-card retail-more-card"><strong>${expanded ? `${items.length} 件表示中` : `ほか ${remaining} 件`}</strong><button class="retail-more-button" type="button" onclick="toggleRetailMore('${safe(scopeId)}')">${label}</button><em>${state}</em></article>`;
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

function allRetailProfiles(){
  return (retailProfilesData?.profiles || []).filter(p=>String(p?.profile_text || '').trim());
}
function retailProfilesForEntity(entityId){
  return allRetailProfiles().filter(p=>p.entity_id===entityId);
}
function retailProfileCategoryKey(profile){
  return retailCategoryKey({channel_type:profile.category_ja || '', retail_format_display_ja:profile.category_ja || ''});
}
function retailProfileSearchText(profile){
  const e=entities.find(x=>x.entity_id===profile.entity_id);
  return [profile.display_name_ja,profile.original_name,profile.name_kana,profile.sub_name_ja,profile.category_ja,profile.profile_text,profile.operator,profile.parent_company,profile.headquarters_location,profile.headquarters_address,e?.entity_id,e?nameOf(e):'',e?.region,e?.subregion].filter(Boolean).join(' ').toLowerCase();
}
function filteredRetailProfiles(){
  let items=allRetailProfiles();
  const q=String(marketFilters.q||'').trim().toLowerCase();
  if(q) items=items.filter(x=>retailProfileSearchText(x).includes(q));
  if(marketFilters.region && marketFilters.region!=='all') items=items.filter(x=>entityForRetailItem(x)?.region===marketFilters.region);
  if(marketFilters.entity && marketFilters.entity!=='all') items=items.filter(x=>x.entity_id===marketFilters.entity);
  if(marketFilters.category && marketFilters.category!=='all') items=items.filter(x=>retailProfileCategoryKey(x)===marketFilters.category);
  return items.sort((a,b)=>{
    const ea=entityForRetailItem(a), eb=entityForRetailItem(b);
    const ca=nameOf(ea||{}), cb=nameOf(eb||{});
    if(ca!==cb) return ca.localeCompare(cb,'ja');
    return String(a.display_name_ja||a.original_name||'').localeCompare(String(b.display_name_ja||b.original_name||''),'ja');
  });
}
function linkedStoreCountLine(profile){
  const link=profile?.linked_retail_presence;
  const counts=link?.store_counts || [];
  if(!counts.length){
    const hasCompanyInfo = !!String(profile?.profile_text || profile?.operator || profile?.official_website || '').trim();
    const label = hasCompanyInfo ? '店舗情報あり' : '店舗数未登録';
    return `<span class="retail-store-pill profile-store-unlinked">${label}</span>`;
  }
  const text=counts.map(c=>storeCountText({store_count:c.store_count, unit:c.unit})).join(' / ');
  const date=counts.map(c=>c.data_date).find(Boolean) || link.as_of_date || '時点未設定';
  const info=counts.map(c=>c.display_info_type || c.source_type).find(Boolean) || link.display_info_type || '掲載データ';
  return `<span class="retail-store-pill">${safe(text)}</span><span class="retail-info-chip">${safe(date)}・${safe(info)}</span>`;
}
function retailProfileCard(profile, compact=false){
  const e=entities.find(x=>x.entity_id===profile.entity_id);
  const subtitle=profile.sub_name_ja ? `<span class="retail-profile-subname">${safe(profile.sub_name_ja)}</span>` : '';
  const country=e ? `<span class="retail-country-chip">${flagText(e)} ${safe(nameOf(e))}</span>` : '';
  const text=String(profile.profile_text || '').replace(/\s+/g,' ').trim();
  const excerpt=text ? `<p class="retail-note retail-profile-excerpt">${safe(text.length>90 ? text.slice(0,90)+'…' : text)}</p>` : `<p class="retail-note retail-profile-excerpt">詳細本文は未登録です。</p>`;
  const linkStatus=profile.linked_retail_presence ? '店舗数リンクあり' : '本文のみ';
  return `<article class="market-data-card retail-profile-card ${compact?'retail-profile-card-compact':''}"><div class="retail-card-top"><div><strong>${safe(profile.display_name_ja || profile.original_name || '小売店')}</strong>${subtitle}${country}</div><span class="retail-category-pill">${safe(profile.category_ja || '小売')}</span></div><div class="retail-card-facts">${linkedStoreCountLine(profile)}<span class="retail-info-chip">${safe(linkStatus)}</span></div>${excerpt}<div class="retail-source-line"><button class="retail-more-button" type="button" onclick="openRetailProfile('${safe(profile.profile_id)}')">詳細プロフィール</button></div></article>`;
}
function retailProfileSummaryBlock(){
  const profiles=filteredRetailProfiles();
  if(!profiles.length) return '';
  const hasFilter=Object.values(marketFilters).some(v=>v && v!=='all');
  const visible=profiles.slice(0, Math.min(16, marketVisibleLimit));
  const textProfiles=profiles.filter(p=>p.profile_text).length;
  return `<section class="retail-profile-section"><div class="retail-profile-section-head"><strong>小売店プロフィール</strong><span>${profiles.length.toLocaleString()}件${hasFilter?' / 条件に一致':''}・本文あり ${textProfiles.toLocaleString()}件</span></div><div class="market-data-grid compact">${visible.map(p=>retailProfileCard(p,true)).join('')}</div>${profiles.length>visible.length?`<div class="market-filter-actions"><button onclick="marketVisibleLimit+=24; renderMarketScope();">プロフィールをさらに表示</button></div>`:''}</section>`;
}
function retailProfileCardsForEntity(e){
  const profiles=retailProfilesForEntity(e.entity_id);
  if(!profiles.length) return '';
  const visible=profiles.slice(0, retailExpanded[`profile:entity:${e.entity_id}`] ? profiles.length : 6);
  const body=visible.map(p=>retailProfileCard(p,true)).join('');
  const remaining=profiles.length-visible.length;
  const more=remaining>0 ? `<article class="market-data-card retail-more-card"><strong>ほか ${remaining} 件</strong><button class="retail-more-button" type="button" onclick="retailExpanded['profile:entity:${safe(e.entity_id)}']=true; renderDetailContent(entities.find(x=>x.entity_id==='${safe(e.entity_id)}'))">もっと見る</button><em>プロフィール保持済み</em></article>` : '';
  return `<div class="retail-profile-country-head"><strong>小売店プロフィール</strong><span>Excel本文を店舗メモ・歴史情報として表示</span></div>${body}${more}`;
}
function profileInfoRows(profile){
  const rows=[
    ['国・地域', profile.country_area_ja],
    ['業態・カテゴリ', profile.category_ja],
    ['運営会社', profile.operator],
    ['親会社', profile.parent_company],
    ['本社所在地', profile.headquarters_location],
    ['本社住所', profile.headquarters_address],
    ['設立年', profile.founded_year],
    ['公式サイト', profile.official_website]
  ].filter(x=>x[1]);
  if(!rows.length) return '';
  return `<div class="retail-profile-info-grid">${rows.map(([k,v])=>`<div><span>${safe(k)}</span><strong>${safe(v)}</strong></div>`).join('')}</div>`;
}

function openRetailChainDetail(entityId, encodedChainId, encodedChainName){
  const chainId=decodeURIComponent(encodedChainId || '');
  const chainName=decodeURIComponent(encodedChainName || '');
  const chains=allRetailPresenceChains();
  const chain=chains.find(c=>String(c.entity_id||'')===String(entityId||'') && (
    (chainId && String(c.chain_id||'')===chainId) ||
    (chainName && String(c.chain_name||'')===chainName)
  ));
  if(!chain) return;
  const e=entities.find(x=>x.entity_id===chain.entity_id);
  const counts=storeCountsFromChain(chain);
  const countLine=counts.length
    ? counts.map(c=>storeCountText({...c, chain_name:chain.chain_name, brand_origin_country:chain.brand_origin_country})).filter(Boolean).join(' / ')
    : '店舗数未収録';
  const info=retailInfoLabel(chain);
  const date=retailDataDateLabel(chain);
  const origin=brandOriginText(chain);
  const note=retailJapaneseNote(chain);
  const link=sourceLink(retailSourceUrl(chain), '出典');
  const rows=[
    ['国・地域', e ? `${flagText(e)} ${safe(nameOf(e))}` : safe(chain.entity_id || '')],
    ['業態・カテゴリ', safe(retailChannelLabel(chain.channel_type || chain.retail_format_display_ja || chain.retail_format_id || '小売'))],
    ['店舗数', safe(countLine)],
    ['情報区分', safe(info)],
    ['時点', safe(date)],
    ['運営会社', safe(chain.operator_local_name || '')],
    ['ブランド発祥', origin || ''],
    ['出典', link]
  ].filter(r=>r[1]!=='' && r[1]!==undefined && r[1]!==null).map(r=>`<div class="profile-info-row"><span>${r[0]}</span><strong>${r[1]}</strong></div>`).join('');
  const body=note ? safe(note).replace(/\n/g,'<br>') : 'このチェーンは小売存在データとして登録されています。企業プロフィール本文は未登録ですが、店舗数・業態・出典情報を表示しています。';
  document.getElementById('detailContent').innerHTML=`<div class="detail-header retail-profile-detail-header"><div class="detail-flag retail-profile-initial">${safe((chain.chain_name||'小売').slice(0,2))}</div><div class="detail-title-block"><h2>${safe(chain.chain_name || '小売チェーン')}</h2><p class="country-sub">${e?`${flagText(e)} ${safe(nameOf(e))}`:''}｜${safe(retailChannelLabel(chain.channel_type || '小売'))}</p><div class="detail-mini-tabs"><span>チェーン情報</span><span>店舗数</span><span>出典</span></div></div></div><section class="detail-section retail-profile-detail"><h3>${e?`${flagText(e)} ${safe(nameOf(e))}`:'国・地域'}｜${safe(retailChannelLabel(chain.channel_type || '小売'))}</h3>${rows}<article class="market-note-card retail-profile-body"><h4>店舗本文</h4><p>${body}</p></article><p class="source-line">店舗数・業態・出典情報を表示します。</p></section>`;
  const dialog=document.getElementById('detailDialog');
  if(!dialog.open) dialog.showModal();
}

function openRetailProfile(profileId){
  const profile=allRetailProfiles().find(p=>p.profile_id===profileId);
  if(!profile) return;
  const e=entities.find(x=>x.entity_id===profile.entity_id);
  const body=profile.profile_text ? safe(profile.profile_text).replace(/\n/g,'<br>') : '詳細本文は未登録です。';
  const linked=profile.linked_retail_presence;
  const linkedSource=linked?.source_url ? sourceLink(linked.source_url,'店舗数出典') : '<span class="url disabled">店舗数リンク未設定</span>';
  const subtitle=[profile.original_name,profile.name_kana].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i && v!==profile.display_name_ja).join(' / ');
  document.getElementById('detailContent').innerHTML=`<div class="detail-header retail-profile-detail-header"><div class="detail-flag retail-profile-initial">${safe((profile.display_name_ja||profile.original_name||'小').slice(0,2))}</div><div class="detail-title-block"><h2>${safe(profile.display_name_ja || profile.original_name || '小売店プロフィール')}</h2>${subtitle?`<p class="country-sub">${safe(subtitle)}</p>`:''}<div class="detail-mini-tabs"><span>プロフィール</span><span>店舗本文</span><span>店舗数リンク</span></div></div></div><section class="detail-section retail-profile-detail"><h3>${e?`${flagText(e)} ${safe(nameOf(e))}`:'小売店'}｜${safe(profile.category_ja || '小売')}</h3>${profileInfoRows(profile)}<div class="retail-card-facts retail-profile-linked-line">${linkedStoreCountLine(profile)}${linkedSource}</div><article class="market-note-card retail-profile-body"><h4>店舗本文</h4><p>${body}</p></article><p class="source-line">店舗数は上部の店舗数欄で表示します。</p></section>`;
  const dialog=document.getElementById('detailDialog');
  if(!dialog.open) dialog.showModal();
}
function entityForRetailItem(item){
  return entities.find(e=>e.entity_id===item.entity_id) || null;
}
function marketSearchText(item){
  const e=entityForRetailItem(item);
  return [item.chain_name,item.channel_type,item.retail_format_display_ja,item.brand_origin_country,item.operator_local_name,item.note,item.source_name,e?.entity_id,e?nameOf(e):'',e?.region,e?.subregion].filter(Boolean).join(' ').toLowerCase();
}
function marketFilterOptions(){
  const chains=allRetailPresenceChains();
  const profiles=allRetailProfiles();
  const allEntityIds=[...new Set([...chains.map(x=>x.entity_id), ...profiles.map(x=>x.entity_id)].filter(Boolean))]
    .sort((a,b)=>nameOf(entities.find(e=>e.entity_id===a)||{}).localeCompare(nameOf(entities.find(e=>e.entity_id===b)||{}),'ja'));
  const regions=[...new Set(allEntityIds.map(id=>entities.find(e=>e.entity_id===id)?.region).filter(Boolean))].sort();
  const regionFilteredEntityIds=allEntityIds.filter(id=>{
    const e=entities.find(x=>x.entity_id===id);
    return !marketFilters.region || marketFilters.region==='all' || e?.region===marketFilters.region;
  });
  const scopedChains=chains.filter(x=>regionFilteredEntityIds.includes(x.entity_id));
  const scopedProfiles=profiles.filter(x=>regionFilteredEntityIds.includes(x.entity_id));
  const cats=[...new Set([
    ...scopedChains.map(x=>retailCategoryKey(x)),
    ...scopedProfiles.map(x=>retailProfileCategoryKey(x))
  ].filter(Boolean))];
  return {entityIds:regionFilteredEntityIds, regions, cats};
}
function retailFilteredChains(includeAggregates=false){
  let items=allRetailPresenceChains();
  if(!includeAggregates) items=items.filter(x=>!retailIsAggregateCountRecord(x));
  const q=String(marketFilters.q||'').trim().toLowerCase();
  if(q) items=items.filter(x=>marketSearchText(x).includes(q));
  if(marketFilters.region && marketFilters.region!=='all') items=items.filter(x=>entityForRetailItem(x)?.region===marketFilters.region);
  if(marketFilters.entity && marketFilters.entity!=='all') items=items.filter(x=>x.entity_id===marketFilters.entity);
  if(marketFilters.category && marketFilters.category!=='all') items=items.filter(x=>retailCategoryKey(x)===marketFilters.category);
  if(marketFilters.info && marketFilters.info!=='all'){
    items=items.filter(x=>{
      const label=retailInfoLabel(x);
      if(marketFilters.info==='official') return label.includes('公式');
      if(marketFilters.info==='reference') return label.includes('参考');
      if(marketFilters.info==='presence') return label.includes('展開');
      return true;
    });
  }
  if(marketFilters.count && marketFilters.count!=='all'){
    items=items.filter(x=>{
      const has=Number.isFinite(retailCountFromItem(x));
      return marketFilters.count==='with' ? has : !has;
    });
  }
  return items.sort((a,b)=>{
    const ea=entityForRetailItem(a), eb=entityForRetailItem(b);
    const ca=nameOf(ea||{}), cb=nameOf(eb||{});
    if(ca!==cb) return ca.localeCompare(cb,'ja');
    const na=retailCountFromItem(a), nb=retailCountFromItem(b);
    if(Number.isFinite(na) && Number.isFinite(nb) && na!==nb) return nb-na;
    if(Number.isFinite(na)) return -1;
    if(Number.isFinite(nb)) return 1;
    return String(a.chain_name||'').localeCompare(String(b.chain_name||''),'ja');
  });
}
function marketFilterControls(){
  const {entityIds, regions, cats}=marketFilterOptions();
  const regionOpts='<option value="all">地域すべて</option>'+regions.map(r=>`<option value="${safe(r)}" ${marketFilters.region===r?'selected':''}>${safe(r)}</option>`).join('');
  const entityOpts='<option value="all">国・地域すべて</option>'+entityIds.map(id=>{ const e=entities.find(x=>x.entity_id===id); return `<option value="${safe(id)}" ${marketFilters.entity===id?'selected':''}>${flagText(e)} ${safe(nameOf(e))}</option>`; }).join('');
  const catOpts='<option value="all">カテゴリすべて</option>'+['convenience_store','supermarket','gms','hypermarket','other'].filter(c=>cats.includes(c)).map(c=>`<option value="${safe(c)}" ${marketFilters.category===c?'selected':''}>${safe(retailCategoryLabel(c))}</option>`).join('');
  const activeChips=[];
  if(marketFilters.region && marketFilters.region!=='all') activeChips.push(`地域：${safe(marketFilters.region)}`);
  if(marketFilters.entity && marketFilters.entity!=='all'){ const e=entities.find(x=>x.entity_id===marketFilters.entity); activeChips.push(`国：${safe(e?nameOf(e):marketFilters.entity)}`); }
  if(marketFilters.category && marketFilters.category!=='all') activeChips.push(`カテゴリ：${safe(retailCategoryLabel(marketFilters.category))}`);
  if(marketFilters.info && marketFilters.info!=='all') activeChips.push(`出典：${marketFilters.info==='official'?'公式・準公式':marketFilters.info==='reference'?'参考情報':'展開情報'}`);
  if(marketFilters.count && marketFilters.count!=='all') activeChips.push(marketFilters.count==='with'?'店舗数あり':'店舗数未確定');
  const activeHtml=activeChips.length?`<div class="market-active-filter-row">${activeChips.map(x=>`<span>${x}</span>`).join('')}</div>`:'';
  return `<section class="market-filter-card market-filter-card-v119"><div class="market-filter-title"><strong>市場・小売を探す</strong></div><label class="market-search-wrap"><span>⌕</span><input class="market-search-input" value="${safe(marketFilters.q||'')}" placeholder="例：Carrefour / 台湾 / コンビニ" oninput="updateMarketFilter('q', this.value)"></label><div class="market-filter-grid"><select onchange="updateMarketFilter('region', this.value)">${regionOpts}</select><select onchange="updateMarketFilter('entity', this.value)">${entityOpts}</select><select onchange="updateMarketFilter('category', this.value)">${catOpts}</select><select onchange="updateMarketFilter('info', this.value)"><option value="all">出典区分すべて</option><option value="official" ${marketFilters.info==='official'?'selected':''}>公式・準公式</option><option value="reference" ${marketFilters.info==='reference'?'selected':''}>参考情報</option><option value="presence" ${marketFilters.info==='presence'?'selected':''}>展開情報</option></select><select onchange="updateMarketFilter('count', this.value)"><option value="all">店舗数の有無すべて</option><option value="with" ${marketFilters.count==='with'?'selected':''}>店舗数あり</option><option value="without" ${marketFilters.count==='without'?'selected':''}>店舗数未確定</option></select></div>${activeHtml}<div class="market-filter-actions"><button onclick="resetMarketFilters()">条件をクリア</button><button onclick="marketVisibleLimit+=48; renderMarketScope();">さらに表示</button></div></section>`;
}
function updateMarketFilter(key,value){
  marketFilters[key]=value;
  if(key==='region') marketFilters.entity='all';
  marketVisibleLimit=36;
  renderMarketScope();
}
function resetMarketFilters(){
  marketFilters={q:'', region:'all', entity:'all', category:'all', info:'all', count:'all'};
  marketVisibleLimit=36;
  renderMarketScope();
}

function retailCountrySummaryOverviewCards(){
  const list=(retailCountryCardSummaryData?.entities || window.MB_RETAIL_COUNTRY_CARD_SUMMARY_DATA?.entities || []).filter(x=>(x.retail_chain_count||0)>0);
  if(!list.length) return '';
  let items=[...list];
  const q=String(marketFilters.q||'').trim().toLowerCase();
  if(q) items=items.filter(x=>[x.entity_id,x.name_ja,x.name_en,x.primary_formats_label].filter(Boolean).join(' ').toLowerCase().includes(q));
  if(marketFilters.region && marketFilters.region!=='all') items=items.filter(x=>entities.find(e=>e.entity_id===x.entity_id)?.region===marketFilters.region);
  if(marketFilters.entity && marketFilters.entity!=='all') items=items.filter(x=>x.entity_id===marketFilters.entity);
  items.sort((a,b)=>(b.retail_chain_count||0)-(a.retail_chain_count||0) || String(a.name_ja||a.entity_id).localeCompare(String(b.name_ja||b.entity_id),'ja'));
  const shown=items.slice(0, Math.max(24, marketVisibleLimit));
  const totalChains=list.reduce((a,b)=>a+Number(b.retail_chain_count||0),0);
  const totalCounts=list.reduce((a,b)=>a+Number(b.store_count_available_count||0),0);
  const head=`<section class="market-filter-card retail-light-load-card"><div class="market-filter-title"><strong>小売市場データベース</strong></div><p class="retail-note">国別要約からチェーン一覧・店舗数詳細へ進めます。</p><div class="retail-summary-metrics"><span><b>${Number(totalChains).toLocaleString()}</b>チェーン</span><span><b>${Number(totalCounts).toLocaleString()}</b>店舗数あり</span><span><b>${Number(list.length).toLocaleString()}</b>国・地域</span></div><div class="market-filter-actions"></div></section>`;
  const resultHead=`<div class="market-result-head market-result-head-v119"><strong>${items.length.toLocaleString()}件</strong><span>国別小売サマリー / ${shown.length.toLocaleString()}件を表示</span></div>`;
  const cards=shown.map(s=>{
    const e=entities.find(x=>x.entity_id===s.entity_id) || {entity_id:s.entity_id,name_ja:s.name_ja,name_en:s.name_en};
    const review=s.scope_or_source_review_count || 0;
    const link='';
    return `<article class="market-data-card retail-country-summary-card"><div class="retail-card-head"><strong>${flagText(e)} ${safe(s.name_ja || nameOf(e) || s.entity_id)}</strong><span>${safe(s.entity_id||'')}</span></div><div class="retail-summary-metrics"><span><b>${Number(s.retail_chain_count||0).toLocaleString()}</b>チェーン</span><span><b>${Number(s.store_count_available_count||0).toLocaleString()}</b>店舗数あり</span><span><b>${Number(s.store_count_pending_count||0).toLocaleString()}</b>更新待ち</span></div><p class="retail-note">主な業態：${safe(s.primary_formats_label || '小売チェーン')}</p><p class="retail-note">企業本文：${Number(s.profile_text_count||0).toLocaleString()}件 / 四半期更新キュー：${Number(s.quarterly_update_queue_count||0).toLocaleString()}件${review?` / 範囲調整中：${Number(review).toLocaleString()}件`:''}</p></article>`;
  }).join('');
  const more=items.length>shown.length ? `<article class="market-data-card retail-more-card"><strong>ほか ${(items.length-shown.length).toLocaleString()}件</strong><button class="retail-more-button" type="button" onclick="marketVisibleLimit+=40; renderMarketScope();">もっと見る</button><em>国別サマリー保持済み</em></article>` : '';
  return head + resultHead + cards + more;
}

function retailSummaryCards(){
  const all=allRetailPresenceChains();
  if(all.length){
    const aggregateFiltered=retailFilteredChains(true);
    const filtered=retailFilteredChains(false);
    const hasFilter=Object.values(marketFilters).some(v=>v && v!=='all');
    const shown=filtered.slice(0, marketVisibleLimit);
    const resultHead=`<div class="market-result-head market-result-head-v119"><strong>${filtered.length.toLocaleString()}件</strong><span>${hasFilter?'条件に合うチェーン':'収録チェーン'} / 全${all.length.toLocaleString()}件中 ${shown.length.toLocaleString()}件を表示</span></div>`;
    const more=filtered.length>shown.length ? `<article class="market-data-card retail-more-card"><strong>ほか ${(filtered.length-shown.length).toLocaleString()}件</strong><button class="retail-more-button" type="button" onclick="marketVisibleLimit+=40; renderMarketScope();">もっと見る</button><em>詳細データ保持済み</em></article>` : '';
    return marketFilterControls() + retailAggregateCards(aggregateFiltered,'絞り込み範囲の小売集計') + retailCompactSummary(filtered) + retailProfileSummaryBlock() + resultHead + shown.map(retailPresenceCard).join('') + more;
  }
  const lightSummary=retailCountrySummaryOverviewCards();
  if(lightSummary) return lightSummary;
  const records=(retailData?.records || []).filter(r=>r.store_count !== null && r.store_count !== undefined && r.store_count !== '');
  if(!records.length) return MARKET_DOMAINS.market.items.map(x=>notCollectedCard(x[0],x[1])).join('');
  return retailAggregateCards(records,'全体の小売集計') + retailCompactSummary(records) + retailLimitedCards(records, retailRecordCard, 20, 'retail:summary');
}

function retailCountryCardSummaryForEntity(entityId){
  const list=retailCountryCardSummaryData?.entities || window.MB_RETAIL_COUNTRY_CARD_SUMMARY_DATA?.entities || [];
  return list.find(x=>x.entity_id===entityId) || null;
}
function retailEntitySummaryLink(entity, summary){
  const entityId=entity?.entity_id || summary?.entity_id || '';
  const href='';
  return `<a class="retail-summary-link" href="${safe(href)}">小売市場DBで詳細を見る</a>`;
}
function retailEntitySummaryCard(entity){
  const summary=retailCountryCardSummaryForEntity(entity.entity_id);
  const chains=summary?.retail_chain_count ?? retailChainsForEntity(entity.entity_id).filter(x=>!retailIsAggregateCountRecord(x)).length;
  const available=summary?.store_count_available_count ?? retailChainsForEntity(entity.entity_id).filter(x=>Number.isFinite(retailCountFromItem(x))).length;
  const pending=summary?.store_count_pending_count ?? Math.max(0, chains-available);
  const formats=summary?.primary_formats_label || '小売チェーン';
  const profiles=summary?.profile_text_count ?? retailProfilesForEntity(entity.entity_id).length;
  const queue=summary?.quarterly_update_queue_count ?? chains;
  const review=summary?.scope_or_source_review_count || 0;
  return `<article class="market-data-card retail-country-summary-card"><div class="retail-card-head"><strong>小売市場データベース</strong><span>要約表示</span></div><div class="retail-summary-metrics"><span><b>${Number(chains||0).toLocaleString()}</b>チェーン</span><span><b>${Number(available||0).toLocaleString()}</b>店舗数あり</span><span><b>${Number(pending||0).toLocaleString()}</b>更新待ち</span></div><p class="retail-note">主な業態：${safe(formats)}</p><p class="retail-note">企業本文：${Number(profiles||0).toLocaleString()}件 / 四半期更新キュー：${Number(queue||0).toLocaleString()}件${review?` / 範囲調整中：${Number(review).toLocaleString()}件`:''}</p>${retailEntitySummaryLink(entity, summary)}</article>`;
}

function retailEntityCards(entity){
  if(retailEntityHasData(entity.entity_id)){
    return retailEntitySummaryCard(entity);
  }
  return MARKET_DOMAINS.market.items.map(x=>notCollectedCard(x[0],x[1])).join('');
}
function retailEntityHasData(entityId){
  const summary=retailCountryCardSummaryForEntity(entityId);
  return !!((summary && (summary.retail_chain_count || summary.profile_text_count || summary.quarterly_update_queue_count)) || retailChainsForEntity(entityId).length || retailRecordsForEntity(entityId).length);
}

function notCollectedCard(key,label){
  return `<article class="market-data-card not-ready-card"><div><strong>${safe(label)}</strong><span>準備中</span></div><em>データ整理中</em></article>`;
}

const RICE_VALUE_USD_JPY_RATE = 150;
const RICE_VALUE_USD_TO_OKU_JPY = RICE_VALUE_USD_JPY_RATE / 100000;
const RICE_METRICS = {
  rice_production_paddy_tonnes:{label:'米生産量', short:'生産', unit:'t', group:'生産'},
  rice_area_harvested_ha:{label:'米収穫面積', short:'面積', unit:'ha', group:'生産'},
  rice_yield_kg_per_ha:{label:'米単収', short:'単収', unit:'kg/ha', group:'生産'},
  rice_import_quantity_tonnes:{label:'米輸入量', short:'輸入', unit:'t', group:'貿易'},
  rice_export_quantity_tonnes:{label:'米輸出量', short:'輸出', unit:'t', group:'貿易'},
  rice_import_value_1000_usd:{label:'米輸入額', short:'輸入額', unit:'1000 USD', group:'貿易'},
  rice_export_value_1000_usd:{label:'米輸出額', short:'輸出額', unit:'1000 USD', group:'貿易'},
  rice_domestic_supply_tonnes:{label:'国内供給量', short:'供給', unit:'t', group:'供給・用途'},
  rice_food_use_tonnes:{label:'食品用途量', short:'食品', unit:'t', group:'供給・用途'},
  rice_feed_use_tonnes:{label:'飼料用途量', short:'飼料', unit:'t', group:'供給・用途'},
  rice_processing_use_tonnes:{label:'加工用途量', short:'加工', unit:'t', group:'供給・用途'},
  rice_seed_use_tonnes:{label:'種子用途量', short:'種子', unit:'t', group:'供給・用途'},
  rice_losses_tonnes:{label:'損失量', short:'損失', unit:'t', group:'供給・用途'},
  rice_stock_variation_tonnes:{label:'在庫変動量', short:'在庫', unit:'t', group:'供給・用途'},
  rice_other_uses_tonnes:{label:'その他用途量', short:'その他', unit:'t', group:'供給・用途'},
  rice_food_supply_kg_capita_year:{label:'1人当たり米供給量', short:'供給/人', unit:'kg/人/年', group:'1人当たり・栄養'},
  rice_kcal_supply_capita_day:{label:'1人当たりカロリー供給', short:'kcal', unit:'kcal/人/日', group:'1人当たり・栄養'},
  rice_protein_supply_g_capita_day:{label:'1人当たりタンパク質供給', short:'たんぱく質', unit:'g/人/日', group:'1人当たり・栄養'},
  rice_fat_supply_g_capita_day:{label:'1人当たり脂質供給', short:'脂質', unit:'g/人/日', group:'1人当たり・栄養'}
};
const SCHOOL_METRICS = {
  school_meals_total_children:{label:'提供児童数ランキング', short:'提供児童数', unit:'人', priority:'main', emptyNote:'学校給食を受けている児童数です。'},
  school_meals_total_schools:{label:'提供学校数ランキング', short:'提供学校数', unit:'校', priority:'main', emptyNote:'提供学校数データがありません。'},
  school_meals_annual_serving_days:{label:'年間提供日数ランキング', short:'提供日数', unit:'日', priority:'main', emptyNote:'年間提供日数データがありません。'}
};
const SCHOOL_RANKING_PRIORITY = ['school_meals_total_children','school_meals_total_schools','school_meals_annual_serving_days'];
const SCHOOL_DETAIL_METRICS = ['school_meals_total_children','school_meals_total_schools','school_meals_coverage_pct','school_meals_annual_serving_days'];
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
  const unit=(RICE_METRICS[metric]?.unit || obj.unit || '');
  if(unit.includes('kg/人/年')) return `${n.toLocaleString(undefined,{maximumFractionDigits:1})} kg/年`;
  if(unit.includes('kcal')) return `${n.toLocaleString(undefined,{maximumFractionDigits:1})} kcal/日`;
  if(unit.includes('g/人/日')) return `${n.toLocaleString(undefined,{maximumFractionDigits:2})} g/日`;
  if(unit==='kg/ha') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})} kg/ha`;
  if(unit==='ha') return `${Math.round(n).toLocaleString()} ha`;
  if(unit==='1000 USD') return `約${(n * RICE_VALUE_USD_TO_OKU_JPY).toLocaleString(undefined,{maximumFractionDigits:0})}億円`;
  if(unit==='%') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})}%`;
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
  if(v===null || v===undefined || v==='') return '情報なし';
  const n=Number(v);
  const unit=row.unit || '';
  if(Number.isFinite(n)){
    if(unit==='kg_per_person_per_year') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})} kg/人/年`;
    if(unit==='hectares') return `${Math.round(n).toLocaleString()} ha`;
    if(unit==='metric_tonnes' || unit==='tonnes') return `${Math.round(n).toLocaleString()} t`;
    if(unit==='kg') return `${Math.round(n).toLocaleString()} kg`;
    if(unit==='stores') return `${Math.round(n).toLocaleString()} 店`;
    if(unit==='children' || unit==='# of children') return `${Math.round(n).toLocaleString()} 人`;
    if(unit==='score' || unit==='Nutritional Score') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})} 点`;
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
  const period=row.period || '時点未入力';
  const src=row.source_name || row.source_id || '資料未入力';
  const note=row.qa_note ? `<p class="retail-note">${safe(row.qa_note)}</p>` : '';
  const link=row.source_url ? `<a class="url" href="${safe(row.source_url)}" target="_blank" rel="noreferrer">出典</a>` : '';
  return `<article class="market-data-card ${cls}"><div class="retail-card-head"><strong>${safe(label)}</strong><span></span></div><em>${safe(value)}</em><span class="retail-info-chip">${safe(period)}・${safe(src)}</span>${note}<div class="retail-source-line">${link}</div></article>`;
}
function ricePriority4CardsForEntity(entity){
  return '';
}

function schoolRecordForEntity(entityId){
  return (schoolMealsData?.records || []).find(r=>r.entity_id===entityId) || null;
}
function fmtSchoolValue(obj, metric){
  if(!obj || obj.value===null || obj.value===undefined) return '未収録';
  const n=Number(obj.value);
  if(!Number.isFinite(n)) return safe(obj.value);
  const unit=SCHOOL_METRICS[metric]?.unit || obj.unit || '';
  if(unit==='%') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})}%`;
  if(unit==='点' || unit==='score') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})} 点`;
  if(unit==='校' || unit==='schools') return `${Math.round(n).toLocaleString()} 校`;
  if(unit==='日' || unit==='days') return `${Math.round(n).toLocaleString()} 日`;
  return `${Math.round(n).toLocaleString()} 人`;
}
function schoolSourceLine(obj){
  if(!obj) return '学校給食データ整理中';
  const year=obj.year ? `${obj.year}年` : '年不明';
  const src=obj.source || 'WFP/GCNF/UNESCO';
  return `${year} / ${src}`;
}
function schoolDataCard(metric, obj){
  const label=SCHOOL_METRICS[metric]?.label || metric;
  const value=fmtSchoolValue(obj, metric);
  return `<article class="market-data-card school-data-card ${obj?'school-loaded':'school-empty'}"><strong>${safe(label)}</strong><span>${safe(value)}</span><em>${safe(schoolSourceLine(obj))}</em></article>`;
}
function schoolCardsFromData(entity){
  const rec=schoolRecordForEntity(entity.entity_id);
  if(!rec) return '';
  return SCHOOL_DETAIL_METRICS.map(metric=>schoolDataCard(metric, rec?.[metric])).join('');
}
function schoolStatusSummary(){
  const records=schoolMealsData?.records || [];
  if(!records.length) return {total:196, any:0, complete:0, partial:0, notLoaded:196};
  let any=0, complete=0, partial=0, notLoaded=0;
  records.forEach(r=>{
    const loaded=SCHOOL_DETAIL_METRICS.filter(k=>r[k]).length;
    if(loaded) any++;
    if(loaded===SCHOOL_DETAIL_METRICS.length) complete++;
    else if(loaded>0) partial++;
    else notLoaded++;
  });
  return {total:records.length, any, complete, partial, notLoaded};
}
function renderSchoolRanking(){
  const select=document.getElementById('schoolMetricSelect');
  const list=document.getElementById('schoolRankingList');
  if(!list) return;
  const keys=schoolRankingKeys();
  if(select){
    const current=select.value;
    select.innerHTML=(keys.length?keys:['school_meals_total_schools']).map(k=>`<option value="${safe(k)}">${safe(SCHOOL_METRICS[k]?.label || k)}</option>`).join('');
    select.value=keys.includes(current) ? current : (keys[0] || 'school_meals_total_schools');
  }
  const metric=select?.value || keys[0] || 'school_meals_total_schools';
  const ranking=schoolMealRankings?.[metric] || schoolMealRankings?.rankings?.[metric] || null;
  const items=ranking?.items || [];
  if(!items.length){
    list.innerHTML=`<article class="market-note-card school-empty-note"><h4>${safe(SCHOOL_METRICS[metric]?.label || metric)}</h4><p>${safe(SCHOOL_METRICS[metric]?.emptyNote || 'この指標はデータ取得中です。')}</p></article>`;
    return;
  }
  const viewItems=items.slice(0,20);
  const barMax=rankingBarMax(viewItems);
  list.innerHTML=viewItems.map(item=>`<article class="ranking-row has-rank-bar"${rankingBarStyle(item, barMax)}><div class="rank">#${safe(item.rank)}</div><div class="flag">${flagMarkup(entities.find(e=>e.entity_id===item.entity_id) || {}, 'flag-img-table')}</div><div class="rank-bar-cell"><div class="rank-bar-bg" aria-hidden="true"></div><div class="rank-bar-main"><div class="country-name">${safe(item.name_ja || item.name_en || item.entity_id)}</div><div class="value">${safe(fmtSchoolValue(item, metric))}</div></div><div class="source-line">${safe(item.year)} / ${safe(item.source || 'WFP/GCNF/UNESCO')}</div></div></article>`).join('');
}
function schoolMealCardsForEntity(entity){
  const dataCards=schoolCardsFromData(entity);
  if(dataCards) return dataCards;
  return MARKET_DOMAINS.school.items.map(x=>notCollectedCard(x[0],x[1])).join('');
}
function priority4DomainSummary(domain){
  const rows=(priority4ReadyData?.rows || []).filter(r=>r.domain===domain && r.import_decision==='READY_FOR_STAGING_IMPORT');
  const ents=new Set(rows.map(r=>r.entity_id));
  return {rows:rows.length, entities:ents.size};
}
function schoolSummaryCards(){
  const s=schoolStatusSummary();
  const status=s.any ? `値あり ${s.any}/${s.total}` : '準備中';
  return `<article class="market-data-card school-summary-card"><strong>学校給食</strong><span>${safe(status)}</span></article>
  <article class="market-data-card school-summary-card"><strong>ランキング</strong><span>提供児童数・学校数・提供日数</span></article>`;
}
function schoolMealRecordForEntity(entityId){
  return (schoolMealsData?.records || []).find(r=>r.entity_id===entityId) || null;
}
function schoolMetricValueText(obj, metric){
  if(!obj || obj.value===null || obj.value===undefined) return '未収録';
  const n=Number(obj.value);
  if(!Number.isFinite(n)) return safe(obj.value);
  const unit=SCHOOL_METRICS[metric]?.unit || obj.unit || '';
  if(unit==='%') return `${n.toLocaleString(undefined,{maximumFractionDigits:1})}%`;
  if(unit==='校' || unit==='schools') return `${Math.round(n).toLocaleString()}校`;
  if(unit==='日' || unit==='days') return `${Math.round(n).toLocaleString()}日`;
  if(unit==='点' || unit==='score') return n.toLocaleString(undefined,{maximumFractionDigits:1});
  return `${Math.round(n).toLocaleString()}人`;
}
function schoolMetricSourceText(obj){
  if(!obj) return '';
  const bits=[];
  if(obj.year) bits.push(`${obj.year}年`);
  if(obj.source) bits.push(obj.source);
  return bits.join(' / ');
}
function schoolSearchText(rec){
  const e=entities.find(x=>x.entity_id===rec.entity_id) || {};
  return [rec.name_ja,rec.name_en,rec.entity_id,rec.iso3,e.region,e.subregion].filter(Boolean).join(' ').toLowerCase();
}
function filteredSchoolRecords(){
  let rows=(schoolMealsData?.records || []).slice();
  const q=String(schoolFilters.q||'').trim().toLowerCase();
  if(q) rows=rows.filter(r=>schoolSearchText(r).includes(q));
  if(schoolFilters.region && schoolFilters.region!=='all') rows=rows.filter(r=>{
    const e=entities.find(x=>x.entity_id===r.entity_id);
    return e?.region===schoolFilters.region;
  });
  return rows.sort((a,b)=>String(a.name_ja||a.name_en||a.entity_id).localeCompare(String(b.name_ja||b.name_en||b.entity_id),'ja'));
}
function updateSchoolFilter(kind, value){
  schoolFilters[kind]=value || 'all';
  schoolVisibleLimit=24;
  renderSchoolPanel();
}
function schoolInfoRows(rec){
  const e=entities.find(x=>x.entity_id===rec.entity_id) || {};
  const rows=[
    ['国・地域', rec.name_ja || nameOf(e)],
    ['学校給食を受けている児童数', schoolMetricValueText(rec.school_meals_total_children,'school_meals_total_children')],
    ['学校給食を提供している学校数', schoolMetricValueText(rec.school_meals_total_schools,'school_meals_total_schools')],
    ['学校給食カバー率', schoolMetricValueText(rec.school_meals_coverage_pct,'school_meals_coverage_pct')],
    ['年間給食提供日数', schoolMetricValueText(rec.school_meals_annual_serving_days,'school_meals_annual_serving_days')]
  ].filter(x=>x[1] && x[1]!=='未収録');
  if(!rows.length) return '';
  return `<div class="retail-profile-info-grid">${rows.map(([k,v])=>`<div><span>${safe(k)}</span><strong>${safe(v)}</strong></div>`).join('')}</div>`;
}
function schoolRecordCard(rec){
  const e=entities.find(x=>x.entity_id===rec.entity_id) || {};
  const main=schoolMetricValueText(rec.school_meals_total_children,'school_meals_total_children');
  const schools=schoolMetricValueText(rec.school_meals_total_schools,'school_meals_total_schools');
  const coverage=schoolMetricValueText(rec.school_meals_coverage_pct,'school_meals_coverage_pct');
  const days=schoolMetricValueText(rec.school_meals_annual_serving_days,'school_meals_annual_serving_days');
  const has=rec.school_meals_total_children || rec.school_meals_total_schools || rec.school_meals_coverage_pct || rec.school_meals_annual_serving_days;
  const extra=[schools!=='未収録'?`提供学校：${schools}`:'', coverage!=='未収録'?`カバー率：${coverage}`:'', days!=='未収録'?`提供日数：${days}`:''].filter(Boolean).join(' / ');
  const excerpt=has ? `<p class="retail-note retail-profile-excerpt">${safe(main!=='未収録'?`提供児童数：${main}`:'学校給食データあり')}${extra?` / ${safe(extra)}`:''}</p>` : `<p class="retail-note retail-profile-excerpt">詳細データは未収録です。</p>`;
  return `<article class="market-data-card retail-profile-card school-profile-card"><div class="retail-card-top"><div><strong>${flagText(e)} ${safe(rec.name_ja || nameOf(e) || rec.entity_id)}</strong><span class="retail-profile-subname">${safe(rec.name_en || rec.iso3 || '')}</span></div><span class="retail-category-pill">学校給食</span></div><div class="retail-card-facts"><span class="retail-store-pill">${safe(main)}</span>${schools!=='未収録'?`<span class="retail-info-chip">${safe(schools)}</span>`:''}${coverage!=='未収録'?`<span class="retail-info-chip">${safe(coverage)}</span>`:''}${days!=='未収録'?`<span class="retail-info-chip">${safe(days)}</span>`:''}</div>${excerpt}<div class="retail-source-line"><button class="retail-more-button" type="button" onclick="openSchoolProfile('${safe(rec.entity_id)}')">詳細</button></div></article>`;
}
function renderSchoolPanel(){
  const panel=document.getElementById('schoolPanel');
  if(!panel) return;
  const regions=[...new Set(entities.map(e=>e.region).filter(Boolean))].sort();
  const rows=filteredSchoolRecords();
  const visible=rows.slice(0, schoolVisibleLimit);
  panel.innerHTML=`<section class="retail-profile-section school-profile-section">
    <div class="retail-profile-section-head"><strong>国・地域別</strong><span>${rows.length.toLocaleString()}件</span></div>
    <div class="company-home-filter-row school-filter-row">
      <label class="company-search-box"><span>⌕</span><input type="search" value="${safe(schoolFilters.q==='all'?'':schoolFilters.q)}" placeholder="国・地域を検索" oninput="updateSchoolFilter('q', this.value)"></label>
      <select onchange="updateSchoolFilter('region', this.value)"><option value="all">地域すべて</option>${regions.map(r=>`<option value="${safe(r)}" ${schoolFilters.region===r?'selected':''}>${safe(REGION_LABELS[r] || r)}</option>`).join('')}</select>
    </div>
    <div class="market-data-grid compact">${visible.map(schoolRecordCard).join('')}</div>
    ${rows.length>visible.length?`<div class="market-filter-actions"><button onclick="schoolVisibleLimit+=24; renderSchoolPanel();">さらに表示</button></div>`:''}
  </section>`;
}
function openSchoolProfile(entityId){
  const rec=schoolMealRecordForEntity(entityId);
  const e=entities.find(x=>x.entity_id===entityId) || {};
  if(!rec) return;
  const sources=[rec.school_meals_total_children,rec.school_meals_total_schools,rec.school_meals_coverage_pct,rec.school_meals_annual_serving_days].map(schoolMetricSourceText).filter(Boolean);
  const sourceText=[...new Set(sources)].slice(0,3).join('<br>') || '出典未設定';
  document.getElementById('detailContent').innerHTML=`<div class="detail-header retail-profile-detail-header"><div class="detail-flag">${flagMarkup(e,'flag-img-detail')}</div><div class="detail-title-block"><h2>${safe(nameOf(e) || rec.name_ja || '学校給食')}</h2><p class="country-sub">学校給食</p><div class="detail-mini-tabs"><span>基本情報</span><span>学校給食</span><span>出典</span></div></div></div><section class="detail-section retail-profile-detail"><h3>${flagText(e)} ${safe(nameOf(e) || rec.name_ja)}｜学校給食</h3>${schoolInfoRows(rec)}<article class="market-note-card retail-profile-body"><h4>学校給食データ</h4><p>提供児童数、提供学校数、カバー率、年間提供日数を表示します。未取得の指標は推測せず、データ取得中として扱います。</p></article><article class="market-note-card retail-profile-body"><h4>出典</h4><p>${sourceText}</p></article></section>`;
  const dialog=document.getElementById('detailDialog');
  if(!dialog.open) dialog.showModal();
}
function riceSummaryCards(){
  const summary=riceStatusSummary();
  const statusText=summary.any ? `値あり ${summary.any}/${summary.total}` : '準備中';
  return `<article class="market-data-card rice-summary-card"><strong>米データ</strong><span>${safe(statusText)}</span></article>
    <article class="market-data-card rice-summary-card"><strong>ランキング</strong><span>生産・貿易・供給</span></article>`;
}
function renderRiceRanking(){
  const select=document.getElementById('riceMetricSelect');
  const list=document.getElementById('riceRankingList');
  if(!list) return;
  const metric=select?.value || 'rice_production_paddy_tonnes';
  const ranking=riceRankings?.[metric] || riceRankings?.rankings?.[metric] || null;
  const items=ranking?.items || [];
  if(!items.length){
    list.innerHTML=`<article class="market-note-card rice-empty-note"><h4>${safe(riceMetricLabel(metric))}</h4><p>この指標は該当する公開値がありません。</p></article>`;
    return;
  }
  const viewItems=items.slice(0,20);
  const barMax=rankingBarMax(viewItems);
  list.innerHTML=viewItems.map(item=>`<article class="ranking-row has-rank-bar"${rankingBarStyle(item, barMax)}><div class="rank">#${safe(item.rank)}</div><div class="flag">${flagMarkup(entities.find(e=>e.entity_id===item.entity_id) || {}, 'flag-img-table')}</div><div class="rank-bar-cell"><div class="rank-bar-bg" aria-hidden="true"></div><div class="rank-bar-main"><div class="country-name">${safe(item.name_ja || item.name_en || item.entity_id)}</div><div class="value">${safe(fmtRiceValue(item, metric))}</div></div><div class="source-line">${safe(item.year)} / ${safe(item.source || 'FAOSTAT')}</div></div></article>`).join('');
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
const JAPAN_RANKING_PUBLIC_KEYS = [
  'japan_relation_summary',
  'overseas_japanese_residents_total',
  'overseas_japanese_long_term_residents',
  'overseas_japanese_permanent_residents',
  'overseas_japanese_residents_yoy_rate',
  'japanese_restaurants_count'
];
function publicJapanRankingKeys(){
  const src=japanRelatedRankings || {};
  return JAPAN_RANKING_PUBLIC_KEYS.filter(k=>(src[k]?.items || []).length >= 50);
}
function normalizeJapanRankingMetric(metric){
  const keys=publicJapanRankingKeys();
  if(keys.includes(metric)) return metric;
  return keys[0] || 'japan_relation_summary';
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
  const metric=normalizeJapanRankingMetric(sel.value || 'japan_relation_summary');
  if(sel.value !== metric) sel.value = metric;
  const ranking=japanRelatedRankings?.[metric];
  const items=(ranking?.items || []).slice(0,20);
  if(!items.length){
    list.innerHTML=`<article class="empty-state"><strong>${safe(japanMetricLabel(metric))}</strong><p>この項目はまだ実値がありません。</p></article>`;
    return;
  }
  const barMax=rankingBarMax(items);
  list.innerHTML=items.map(item=>{
    const e=entities.find(x=>x.entity_id===item.entity_id) || {};
    return `<button class="ranking-row japan-ranking-row has-rank-bar"${rankingBarStyle(item, barMax)} onclick="openDetail('${safe(item.entity_id)}')">
      <span class="rank-num">${safe(item.rank || '')}</span>
      <span class="rank-bar-cell"><span class="rank-bar-bg" aria-hidden="true"></span><span class="rank-bar-main"><span class="rank-country">${flagText(e)} ${safe(item.name_ja || nameOf(e) || item.entity_id)}</span><span class="rank-value">${safe(formatJapanRankingValue(item, metric))}</span></span><small>${safe(japanRankingSubline(item, metric))}</small></span>
    </button>`;
  }).join('');
}

function renderRicePanel(){
  const panel=document.getElementById('ricePanel');
  if(!panel) return;
  const summary=riceStatusSummary();
  const chip=document.getElementById('riceCoverage');
  if(chip) chip.textContent=summary.any ? `${summary.any}/${summary.total}` : '準備中';
  panel.innerHTML=`<div class="market-data-grid">${riceSummaryCards()}</div>`;
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
  if(!items.length) return `<article class="market-data-card japan-data-card japan-empty"><strong>日系小売・外食</strong><span>未収録</span><em>存在情報未収録</em></article>`;
  return `<article class="market-data-card japan-data-card japan-loaded"><strong>日系小売・外食</strong><span>${items.length}件</span><em>${items.map(x=>x.brand || x.name).filter(Boolean).slice(0,3).join(' / ')}</em></article>`;
}

function japanRelationLevelLabel(level){
  const map={very_high:'非常に強い', high:'強い', medium:'中程度', low:'接点あり', not_loaded:'未収録'};
  return map[level] || '未収録';
}
function japanRelationSummaryCard(rec){
  const s=rec?.japan_relation_summary;
  if(!s || !s.japan_relation_score) return `<article class="market-data-card japan-relation-card japan-empty"><strong>日本との関係まとめ</strong><span>未収録</span><em>在留邦人・日本食データの取得待ち</em></article>`;
  const signals=(s.signals||[]).join(' / ') || '取得済み指標なし';
  return `<article class="market-data-card japan-relation-card japan-loaded"><strong>日本との関係まとめ</strong><span>${safe(japanRelationLevelLabel(s.japan_relation_level))}</span><em>${safe(signals)}</em></article>`;
}

function japanRelatedCardsForEntity(entity){
  const rec=japanRelatedRecordForEntity(entity.entity_id);
  return japanRelationSummaryCard(rec) + Object.keys(JAPAN_RELATED_METRICS).map(metric=>japanRelatedCard(metric, rec?.[metric])).join('');
}
function japanRelatedSummary(){
  const records=japanRelatedData?.records || [];
  const any=records.filter(r=>Object.keys(JAPAN_RELATED_METRICS).some(k=>r[k])).length;
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
  const status=s.any ? `値あり ${s.any}/${s.total}` : '準備中';
  return `<article class="market-data-card japan-summary-card"><strong>日本関連データ</strong><span>${safe(status)}</span></article>`;
}

function renderDomainPanel(domainKey, targetId){
  if(domainKey==='school'){
    renderSchoolPanel();
    return;
  }
  const d=MARKET_DOMAINS[domainKey];
  const sampleEntities=['JP','TW','KR','HK','SG','TH','US','CN'].filter(id=>entities.some(e=>e.entity_id===id));
  const chips=sampleEntities.map(id=>{
    const e=entities.find(x=>x.entity_id===id);
    return `<button onclick="openDetail('${safe(id)}')">${flagText(e)} ${safe(nameOf(e))}</button>`;
  }).join('');
  const dataCards = domainKey==='market' ? retailSummaryCards() : (domainKey==='rice' ? riceSummaryCards() : (domainKey==='japan' ? japanRelatedSummaryCards() : d.items.map(x=>notCollectedCard(x[0],x[1])).join('')));
  const targetEl=document.getElementById(targetId); if(!targetEl) return; targetEl.innerHTML=`<div class="market-data-grid">${dataCards}</div><article class="market-note-card market-note-card-v119"><h4>国・地域</h4><div class="quick-chip-row">${chips}</div></article>`;
}
function renderMarketScope(){
  renderDomainPanel('rice','ricePanel');
  renderRicePanel();
  renderDomainPanel('school','schoolPanel');
  renderSchoolRanking();
  renderDomainPanel('japan','japanPanel');
  renderJapanRanking();
}
function marketSummaryBlock(e){
  const blocks=Object.entries(MARKET_DOMAINS).filter(([key])=>key!=='market').map(([key,d])=>{
    const cards = key==='market' ? (retailEntityCards(e) + retailProfileCardsForEntity(e)) : (key==='rice' ? (riceCardsForEntity(e) + ricePriority4CardsForEntity(e)) : (key==='school' ? schoolMealCardsForEntity(e) : (key==='japan' ? japanRelatedCardsForEntity(e) : d.items.map(x=>notCollectedCard(x[0],x[1])).join(''))));
    const lead = d.lead ? `<p>${safe(d.lead)}</p>` : '';
    return `<section class="detail-market-block"><h3>${d.icon} ${safe(d.title)}</h3>${lead}<div class="market-data-grid compact">${cards}</div></section>`;
  }).join('');
  return blocks;
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

function rankingBarValue(item){
  const n=Number(item?.value);
  return Number.isFinite(n) && n>0 ? n : 0;
}
function rankingBarMax(items){
  return Math.max(0, ...items.map(rankingBarValue));
}
function rankingBarStyle(item, max){
  const v=rankingBarValue(item);
  if(!max || !v) return ' style="--rank-bar:0%"';
  const pct=Math.max(0, Math.min(100, (v/max)*100));
  return ` style="--rank-bar:${pct.toFixed(2)}%"`;
}

function renderRankings(){
  const raw=document.getElementById('metricSelect').value;
  const sel=rankingSelection(raw);
  const data=rankingItemsFor(sel.domain, sel.metric);
  document.getElementById('rankingCoverage').textContent=`${t('coverage')}: ${rankingCoverageText(sel.domain, sel.metric)}`;
  const list=document.getElementById('rankingList');
  if(!data || !data.items.length){ list.innerHTML=`<p class="notice">${t('noResults')}</p>`; return; }
  const limit=document.getElementById('rankLimit')?.value || '20';
  const items=limit==='all' ? data.items : data.items.slice(0, Number(limit));
  const barMax=rankingBarMax(items);
  const more=(limit!=='all' && data.items.length>items.length) ? `<p class="list-more-note">${t('showingLimited')}: ${items.length} / ${data.items.length}</p>` : '';
  list.innerHTML=items.map(item=>{
    const e=entities.find(x=>x.entity_id===item.entity_id) || item;
    const eid=safe(item.entity_id || e.entity_id || '');
    const name=safe(lang==='en' ? (item.name_en || e.names?.en || item.entity_id) : (item.name_ja || e.names?.ja || nameOf(e) || item.entity_id));
    const value=safe(formatUnifiedRankingValue(item, sel.domain, sel.metric));
    const source=safe(unifiedRankingSourceLine(item, sel.domain, sel.metric));
    return `<article class="ranking-row has-rank-bar ${item.rank<=3?'top-rank':''}"${rankingBarStyle(item, barMax)}><div class="rank">#${safe(item.rank)}</div><button type="button" class="flag flag-open" data-open-entity="${eid}" aria-label="${name}の詳細を開く">${flagMarkup(e, 'flag-img-table')}</button><div class="rank-bar-cell"><div class="rank-bar-bg" aria-hidden="true"></div><div class="rank-bar-main"><div class="country-name">${name}</div><div class="value">${value}</div></div><div class="source-line">${source}</div></div></article>`;
  }).join('') + more;
}

const COMPARE_RICE_METRICS=['rice_production_paddy_tonnes','rice_import_quantity_tonnes','rice_export_quantity_tonnes','rice_food_supply_kg_capita_year','rice_area_harvested_ha','rice_yield_kg_per_ha'];
const COMPARE_SCHOOL_METRICS=['school_meals_total_children','school_meals_total_schools','school_meals_coverage_pct','school_meals_annual_serving_days'];
const COMPARE_JAPAN_METRICS=['overseas_japanese_residents_total','japanese_restaurants_count','overseas_japanese_long_term_residents','overseas_japanese_permanent_residents','overseas_japanese_residents_yoy_rate','japan_food_exports_value_jpy','japan_favorability_or_trust_score'];
function compareMissingCell(){
  return {value:'未収録', sub:'比較対象データなし', missing:true};
}
function compareBasicCell(entity, metric){
  const s=getStat(entity, metric);
  const reference=isPrefectureReference(entity);
  const equivalentRank=reference && !isMissing(s) ? metricWorldRank(entity,metric) : null;
  return {value:fmt(s.value,metric), sub:sourceLine(s), missing:isMissing(s), reference, equivalentRank};
}
function compareRiceCell(entity, metric){
  const rec=riceRecordForEntity(entity.entity_id);
  const obj=rec?.[metric];
  if(!obj) return compareMissingCell();
  return {value:fmtRiceValue(obj,metric), sub:`${obj.year || '年不明'} / ${obj.source || 'FAOSTAT'}`, missing:false};
}
function compareSchoolCell(entity, metric){
  const rec=schoolRecordForEntity(entity.entity_id);
  const obj=rec?.[metric];
  if(!obj) return compareMissingCell();
  return {value:fmtSchoolValue(obj,metric), sub:schoolSourceLine(obj), missing:false};
}
function compareJapanCell(entity, metric){
  const rec=japanRelatedRecordForEntity(entity.entity_id);
  const obj=rec?.[metric];
  if(!obj) return compareMissingCell();
  return {value:fmtJapanRelatedValue(obj,metric), sub:japanRelatedSourceLine(obj), missing:false};
}
function retailSummaryForCompare(entity){
  const chains=retailChainsForEntity(entity.entity_id);
  const groups=retailAggregate(chains);
  const byKey=Object.fromEntries(groups.map(g=>[g.key,g]));
  const totalStores=groups.reduce((sum,g)=>sum+(Number(g.stores)||0),0);
  const withCounts=groups.reduce((sum,g)=>sum+(Number(g.withCounts)||0),0);
  return {chains, groups, byKey, totalStores, withCounts};
}
function compareRetailCell(entity, key){
  const s=retailSummaryForCompare(entity);
  if(key==='retail_chains'){
    if(!s.chains.length) return compareMissingCell();
    return {value:`${s.chains.length.toLocaleString()}チェーン`, sub:`店舗数あり ${s.withCounts.toLocaleString()}件`, missing:false};
  }
  if(key==='retail_total_stores'){
    if(!s.withCounts) return {value:'店舗数未集計', sub:`${s.chains.length.toLocaleString()}チェーンは保持`, missing:s.chains.length===0};
    return {value:`${Math.round(s.totalStores).toLocaleString()}店`, sub:`収録チェーンの店舗数合計 / ${s.withCounts}/${s.chains.length}件`, missing:false};
  }
  const g=s.byKey[key];
  if(!g) return compareMissingCell();
  const value=g.withCounts ? `${Math.round(g.stores).toLocaleString()}店` : `${g.chains.toLocaleString()}チェーン`;
  const sub=g.withCounts ? `${retailCategoryLabel(key)} / 店舗数あり ${g.withCounts}/${g.chains}件` : `${retailCategoryLabel(key)} / 店舗数未収録`;
  return {value, sub, missing:false};
}
function compareCellHtml(cell){
  const cls=cell?.missing ? 'compare-value-card is-missing' : 'compare-value-card';
  const missing=cell?.missing ? `<span class="compare-missing-pill">${t('missing')}</span>` : '';
  const reference=cell?.reference ? '<span class="compare-reference-pill">参考値</span>' : '';
  const equivalentRank=cell?.equivalentRank ? `<span class="compare-equivalent-rank">世界${safe(cell.equivalentRank.rank)}位相当 <small>（${safe(cell.equivalentRank.total)}か国・地域との参考比較）</small></span>` : '';
  return `<div class="${cls}${cell?.reference?' is-reference':''}"><strong>${safe(cell?.value || '—')}</strong>${missing}${reference}${equivalentRank}<span>${safe(cell?.sub || '')}</span></div>`;
}
function compareEntityHero(entity, sideLabel){
  const pop=compareBasicCell(entity,'population');
  const gdp=compareBasicCell(entity,'gdp_current_usd');
  const third=isPrefectureReference(entity) ? compareBasicCell(entity,'area_land_km2') : compareRiceCell(entity,'rice_production_paddy_tonnes');
  const thirdLabel=isPrefectureReference(entity) ? '面積' : '米生産';
  const reference=isPrefectureReference(entity) ? '<span class="compare-prefecture-badge">都道府県・参考</span>' : '';
  return `<article class="compare-country-card">
    <div class="compare-country-top"><div class="compare-flag-wrap">${flagMarkup(entity, 'compare-flag-img')}</div><div><span class="compare-side-label">${safe(sideLabel)}</span><h4>${safe(nameOf(entity))}</h4><p>${safe(entity.region || '')} / ${safe(entity.subregion || '')}</p>${reference}</div></div>
    <div class="compare-mini-grid">
      <span><b>人口</b><em>${safe(pop.value)}</em></span>
      <span><b>GDP</b><em>${safe(gdp.value)}</em></span>
      <span><b>${safe(thirdLabel)}</b><em>${safe(third.value)}</em></span>
    </div>
  </article>`;
}
function compareMetricCard(row){
  return `<article class="compare-metric-card"><div class="compare-metric-label">${safe(row.label)}</div><div class="compare-two-values">${compareCellHtml(row.a)}${compareCellHtml(row.b)}</div></article>`;
}
function compareColumnGuide(a,b){
  const side=(entity,label)=>`<div class="compare-column-country"><span class="compare-column-side">${safe(label)}</span><span class="compare-column-flag">${flagMarkup(entity,'flag-img-table')}</span><strong>${safe(nameOf(entity))}</strong></div>`;
  return `<div class="compare-column-guide"><div class="compare-column-guide-spacer" aria-hidden="true"></div>${side(a,'左')}${side(b,'右')}</div>`;
}
function compareSection(title, icon, rows, a, b){
  if(!rows.length) return '';
  const missingCount=rows.reduce((n,r)=>n+(r.a?.missing?1:0)+(r.b?.missing?1:0),0);
  const note=missingCount ? `未収録 ${missingCount}項目` : '比較データあり';
  return `<section class="compare-section-card"><div class="compare-section-head"><div><span>${safe(icon)}</span><h4>${safe(title)}</h4></div><em>${safe(note)}</em></div>${compareColumnGuide(a,b)}<div class="compare-metric-list">${rows.map(compareMetricCard).join('')}</div></section>`;
}
function renderCompare(){
  const choices=comparisonEntities();
  const a=choices.find(e=>e.entity_id===document.getElementById('compareA').value) || entities[0];
  const b=choices.find(e=>e.entity_id===document.getElementById('compareB').value) || entities[1];
  const hasPrefecture=isPrefectureReference(a) || isPrefectureReference(b);
  const basicRows=UI_METRICS.map(m=>({label:metricName(m), a:compareBasicCell(a,m), b:compareBasicCell(b,m)}));
  const riceRows=COMPARE_RICE_METRICS.map(m=>({label:riceMetricLabel(m), a:compareRiceCell(a,m), b:compareRiceCell(b,m)}));
  const schoolRows=COMPARE_SCHOOL_METRICS.map(m=>({label:SCHOOL_METRICS[m]?.label || m, a:compareSchoolCell(a,m), b:compareSchoolCell(b,m)}));
  const japanRows=COMPARE_JAPAN_METRICS.map(m=>({label:JAPAN_RELATED_METRICS[m]?.label || m, a:compareJapanCell(a,m), b:compareJapanCell(b,m)}));
  document.getElementById('compareTable').innerHTML=`<div class="compare-ui-shell">
    <section class="compare-hero-card">
      <div class="compare-hero-text"><span class="compare-kicker">COMPARE</span><h3>国・地域と都道府県を比較</h3><p>${hasPrefecture?'都道府県は比較専用の参考値です。国一覧・196件表示・世界ランキングには含まれません。':'基本統計、米、学校給食、日本関連をカードで整理します。'}</p></div>
      <div class="compare-country-pair">${compareEntityHero(a,'比較A')}<div class="compare-vs-pill">VS</div>${compareEntityHero(b,'比較B')}</div>
    </section>
    <div class="compare-category-strip"><span>🌐 基本統計</span>${hasPrefecture?'<span>※ 年度・定義の異なる参考比較</span>':'<span>🍚 米</span><span>🏫 学校給食</span><span>🇯🇵 日本関連</span>'}</div>
    ${compareSection('基本統計','🌐',basicRows,a,b)}
    ${hasPrefecture?'':compareSection('米データ','🍚',riceRows,a,b)}
    ${hasPrefecture?'':compareSection('学校給食','🏫',schoolRows,a,b)}
    ${hasPrefecture?'':compareSection('日本関連','🇯🇵',japanRows,a,b)}
  </div>`;
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
  const currency=String(m?.currency_unit || '').trim();
  if(!currency) return '';
  return `<section class="detail-section wdi-currency-section"><h3>通貨</h3><div class="stats-grid"><div class="stat-card wdi-meta-card"><div class="stat-label">通貨単位</div><div class="stat-value">${safe(currency)}</div></div></div></section>`;
}


function detailContentHtml(e){
  const inc=incomeRecord(e);
  const incomeCard=`<div class="stat-card income-stat-card"><div class="stat-label">所得分類</div><div class="stat-value">${safe(incomeLabel(e))}</div><span class="stat-source-label">${safe(incomeSourceLine(inc))}</span>${sourceLink(inc?.source_url, t('source'))}</div>`;
  const statsHtml=`<section class="detail-section"><h3>概要・基本統計</h3><div class="stats-grid">${incomeCard}${UI_METRICS.map(m=>{
    const s=getStat(e,m); const missing=isMissing(s);
    const worldRank=metricWorldRank(e,m);
    const rankBadge=worldRank?`<span class="stat-world-rank">世界${safe(worldRank.rank)}位</span>`:'';
    return `<div class="stat-card ${missing?'missing-value':''}"><div class="stat-label-row"><div class="stat-label">${safe(metricName(m))}</div>${rankBadge}</div><div class="stat-value">${fmt(s.value,m)}</div>${missing?`<div class="missing-chip">${t('missing')}</div>`:''}<span class="stat-source-label">${safe(sourceLine(s))}</span>${sourceLink(s.source_url, t('source'))}</div>`;
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
  document.getElementById('metricSelect').innerHTML=rankingOptionGroupsHtml();
  document.getElementById('sourceMetricFilter').innerHTML=`<option value="all">${t('allMetrics')}</option>`+metricOpts;
  document.getElementById('sourceStatusFilter').innerHTML=`<option value="all">${t('allStatus')}</option><option value="missing">${t('missingOnly')}</option><option value="ready">${t('readyOnly')}</option>`;
  const countryOpts=entities.map(e=>`<option value="${safe(e.entity_id)}">${flagText(e)} ${safe(nameOf(e))}</option>`).join('');
  const prefectureOpts=prefectureReferences.map(e=>`<option value="${safe(e.entity_id)}">${safe(nameOf(e))}（参考）</option>`).join('');
  const opts=`<optgroup label="国・地域（196）">${countryOpts}</optgroup><optgroup label="日本の都道府県（参考・比較のみ）">${prefectureOpts}</optgroup>`;
  document.getElementById('compareA').innerHTML=opts; document.getElementById('compareB').innerHTML=opts;
  document.getElementById('compareA').value=entities.some(e=>e.entity_id==='US')?'US':entities[0]?.entity_id;
  document.getElementById('compareB').value=entities.some(e=>e.entity_id==='JP')?'JP':entities[1]?.entity_id;
  // V233: 比較タブは初期状態から「アメリカ × 日本」の結果を表示する。
  renderCompare();
}

function companySearchRecordText(obj){
  return [obj.display_name_ja,obj.original_name,obj.name_kana,obj.sub_name_ja,obj.chain_name,obj.category_ja,obj.channel_type,obj.operator,obj.parent_company,obj.profile_text].filter(Boolean).join(' ').toLowerCase();
}
function companyStoreTextFromProfile(profile){
  const link=profile?.linked_retail_presence;
  const counts=link?.store_counts || [];
  if(!counts.length){
    const hasCompanyInfo = !!String(profile?.profile_text || profile?.operator || profile?.official_website || '').trim();
    return hasCompanyInfo ? '店舗情報あり' : '店舗数未登録';
  }
  return counts.map(c=>storeCountText({store_count:c.store_count, unit:c.unit})).join(' / ');
}
function companyStoreTextFromChain(chain){
  const counts=storeCountsFromChain(chain);
  if(counts.length){
    return counts.map(c=>storeCountText({...c, chain_name:chain.chain_name, brand_origin_country:chain.brand_origin_country})).filter(Boolean).join(' / ');
  }
  const n=retailCountFromItem(chain);
  if(Number.isFinite(n)) return `${Math.round(n).toLocaleString()}店`;
  return '店舗数未収録';
}
function companySearchEntityAllowed(entityId){
  const e=entities.find(x=>x.entity_id===entityId);
  if(companyHomeFilters.region && companyHomeFilters.region!=='all' && e?.region!==companyHomeFilters.region) return false;
  if(companyHomeFilters.entity && companyHomeFilters.entity!=='all' && entityId!==companyHomeFilters.entity) return false;
  return true;
}
function companyHomeFilterOptions(){
  const ids=[...new Set([
    ...allRetailProfiles().map(x=>x.entity_id),
    ...allRetailPresenceChains().map(x=>x.entity_id)
  ].filter(Boolean))];
  const regions=[...new Set(ids.map(id=>entities.find(e=>e.entity_id===id)?.region).filter(Boolean))].sort();
  const scopedIds=ids.filter(id=>{
    const e=entities.find(x=>x.entity_id===id);
    return !companyHomeFilters.region || companyHomeFilters.region==='all' || e?.region===companyHomeFilters.region;
  }).sort((a,b)=>nameOf(entities.find(e=>e.entity_id===a)||{}).localeCompare(nameOf(entities.find(e=>e.entity_id===b)||{}),'ja'));
  return {regions, entityIds:scopedIds};
}
function updateCompanyHomeFilter(key,value){
  companyHomeFilters[key]=value || 'all';
  if(key==='region') companyHomeFilters.entity='all';
  renderCompanyHomeSearch();
}
function companySearchResults(qRaw){
  const q=String(qRaw||'').trim().toLowerCase();
  const hasTextQuery=q.length>=2;
  const hasFilter=(companyHomeFilters.region && companyHomeFilters.region!=='all') || (companyHomeFilters.entity && companyHomeFilters.entity!=='all');
  if(!hasTextQuery && !hasFilter) return [];
  const results=[];
  const seen=new Set();
  allRetailProfiles().forEach(p=>{
    if(!companySearchEntityAllowed(p.entity_id)) return;
    if(hasTextQuery && !companySearchRecordText(p).includes(q)) return;
    const e=entities.find(x=>x.entity_id===p.entity_id);
    const key=`p:${p.profile_id}`;
    if(seen.has(key)) return; seen.add(key);
    results.push({kind:'profile', id:p.profile_id, entity_id:p.entity_id, country:e?nameOf(e):p.country_area_ja, flag:e?flagText(e):'', name:p.display_name_ja || p.original_name || '小売店', sub:p.sub_name_ja || p.original_name || '', category:p.category_ja || '小売', storeText:companyStoreTextFromProfile(p), hasText:!!p.profile_text, score:hasTextQuery?((String(p.display_name_ja||'').toLowerCase()===q||String(p.sub_name_ja||'').toLowerCase()===q)?0:1):1});
  });
  allRetailPresenceChains().forEach(c=>{
    if(retailIsAggregateCountRecord(c)) return;
    if(!companySearchEntityAllowed(c.entity_id)) return;
    if(hasTextQuery && !companySearchRecordText(c).includes(q)) return;
    const e=entities.find(x=>x.entity_id===c.entity_id);
    const p=allRetailProfiles().find(x=>x.entity_id===c.entity_id && companySearchRecordText(x).includes(String(c.chain_name||'').toLowerCase()));
    const key=`c:${c.entity_id}:${c.chain_id||c.chain_name}`;
    if(seen.has(key)) return; seen.add(key);
    results.push({kind:p?'profile':'chain', id:p?.profile_id || c.chain_id || '', chain_name:c.chain_name || c.source_name || '小売チェーン', entity_id:c.entity_id, country:e?nameOf(e):c.country_area, flag:e?flagText(e):'', name:c.chain_name || c.source_name || '小売チェーン', sub:p?.display_name_ja || '', category:retailCategoryLabel(retailCategoryKey(c)), storeText:companyStoreTextFromChain(c), hasText:!!p?.profile_text, score:hasTextQuery?(String(c.chain_name||'').toLowerCase()===q?0:2):2});
  });
  return results.sort((a,b)=>a.score-b.score || String(a.country).localeCompare(String(b.country),'ja') || String(a.name).localeCompare(String(b.name),'ja')).slice(0,18);
}
function openCompanySearchResult(kind, id, entityId, query, chainName){
  if(kind==='profile' && id){ openRetailProfile(id); return; }
  if(kind==='chain'){
    openRetailChainDetail(entityId || '', encodeURIComponent(id || ''), encodeURIComponent(chainName || query || ''));
    return;
  }
  marketFilters.q=query || '';
  marketFilters.entity=entityId || 'all';
  marketVisibleLimit=36;
  renderMarketScope();
  switchView('market');
}
function renderCompanyHomeSearch(){
  const input=document.getElementById('homeCompanySearchInput');
  const el=document.getElementById('homeCompanySearchResults');
  const regionSel=document.getElementById('homeCompanyRegionFilter');
  const entitySel=document.getElementById('homeCompanyEntityFilter');
  if(!input || !el) return;
  const opts=companyHomeFilterOptions();
  if(regionSel){
    regionSel.innerHTML='<option value="all">地域すべて</option>'+opts.regions.map(r=>`<option value="${safe(r)}" ${companyHomeFilters.region===r?'selected':''}>${safe(r)}</option>`).join('');
  }
  if(entitySel){
    if(companyHomeFilters.entity!=='all' && !opts.entityIds.includes(companyHomeFilters.entity)) companyHomeFilters.entity='all';
    entitySel.innerHTML='<option value="all">国・地域すべて</option>'+opts.entityIds.map(id=>{ const e=entities.find(x=>x.entity_id===id); return `<option value="${safe(id)}" ${companyHomeFilters.entity===id?'selected':''}>${e?flagText(e):''} ${safe(e?nameOf(e):id)}</option>`; }).join('');
  }
  const q=input.value || '';
  const results=companySearchResults(q);
  const hasFilter=(companyHomeFilters.region&&companyHomeFilters.region!=='all')||(companyHomeFilters.entity&&companyHomeFilters.entity!=='all');
  if(String(q).trim().length<2 && !hasFilter){
    el.innerHTML='<div class="company-search-empty">企業名を2文字以上入力、または地域・国で絞り込み</div>';
    return;
  }
  if(!results.length){
    el.innerHTML='<div class="company-search-empty">該当なし</div>';
    return;
  }
  el.innerHTML=results.map(r=>`<button type="button" class="company-result-card" onclick="openCompanySearchResult('${safe(r.kind)}','${safe(r.id)}','${safe(r.entity_id)}','${safe(q)}','${safe(r.chain_name||r.name||'')}')"><strong>${safe(r.name)}</strong><span>${safe(r.flag)} ${safe(r.country)}｜${safe(r.category)}</span><em>${safe(r.storeText)}${r.hasText?'｜企業情報あり':''}</em></button>`).join('');
}

function renderAll(){
  applyI18n(); initControls(); renderMetricOverview(); renderKnownGaps(); renderRecentEntities(); renderCompanyHomeSearch(); renderMarketScope(); renderCountries(); renderRankings(); renderCompare(); renderSources(); renderQA(); renderGlobalDbLinks();
  document.getElementById('entityCount').textContent=entities.length;
}
async function boot(){
  try{
    const [e,r,retailCountrySummary,rice,riceRanks,schoolMeals,schoolRanks,priority4,wdiMeta,japanRel,japanRanks,jpRestaurantOverview,jpResidentsOverview]=await Promise.all([
      fetch('data/market_base_entities_basic_stats_full196_rc.json').then(x=>x.json()),
      fetch('data/market_base_rankings_basic_stats_full196_rc.json').then(x=>x.json()),
      fetch('data/market_base_retail_country_card_summary_CURRENT.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_rice_data_CURRENT.json').then(x=>x.json()).catch(()=>fetch('data/market_base_rice_data_v2.json').then(x=>x.json()).catch(()=>fetch('data/market_base_rice_data_v1.json').then(x=>x.json()).catch(()=>null))),
      fetch('data/market_base_rice_rankings_CURRENT.json').then(x=>x.json()).catch(()=>fetch('data/market_base_rice_rankings_v2.json').then(x=>x.json()).catch(()=>fetch('data/market_base_rice_rankings_v1.json').then(x=>x.json()).catch(()=>null))),
      fetch('data/market_base_school_meals_data_CURRENT.json').then(x=>x.json()).catch(()=>fetch('data/market_base_school_meals_data_v1.json').then(x=>x.json()).catch(()=>fetch('data/market_base_school_meals_data_v94.json').then(x=>x.json()).catch(()=>null))),
      fetch('data/market_base_school_meals_rankings_CURRENT.json').then(x=>x.json()).catch(()=>fetch('data/market_base_school_meals_rankings_v1.json').then(x=>x.json()).catch(()=>null)),
      fetch('data/market_base_priority4_ready_staging_v92.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_wdi_country_metadata_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_japan_related_data_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_japan_related_rankings_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_japanese_restaurants_overview_v1.json').then(x=>x.json()).catch(()=>null),
      fetch('data/market_base_overseas_japanese_residents_overview_v1.json').then(x=>x.json()).catch(()=>null)
    ]);
    entities=e.entities||[]; rankings=r.rankings||{};
    // V227: MARKET BASE本体は小売詳細JSONを起動時に読まない。国別カード用サマリーだけを使う。
    retailData=null; retailPresenceData=null; retailProfilesData=null;
    retailCountryCardSummaryData=retailCountrySummary || window.MB_RETAIL_COUNTRY_CARD_SUMMARY_DATA || null; riceData=rice || null; riceRankings=riceRanks?.rankings || {}; schoolMealsData=schoolMeals || null; schoolMealRankings=schoolRanks?.rankings || {}; priority4ReadyData=priority4 || null; wdiCountryMetadata=wdiMeta || null; japanRelatedData=japanRel || null; japanRelatedRankings=japanRanks?.rankings || {}; japaneseRestaurantsOverview=jpRestaurantOverview || null; overseasJapaneseResidentsOverview=jpResidentsOverview || null; renderAll();
  }catch(err){
    if(window.MARKET_BASE_EMBEDDED_DATA){
      const emb=window.MARKET_BASE_EMBEDDED_DATA;
      entities=emb.entities?.entities||[];
      rankings=emb.rankings?.rankings||{};
      // V227: 本体では小売詳細JSONを展開しない。
      retailData=null;
      retailPresenceData=null;
      retailProfilesData=null;
      retailCountryCardSummaryData=window.MB_RETAIL_COUNTRY_CARD_SUMMARY_DATA || emb.retail_country_card_summary || null;
      riceData=emb.rice_data || null;
      riceRankings=emb.rice_rankings?.rankings || {};
      schoolMealsData=emb.school_meals_data || null;
      schoolMealRankings=emb.school_meals_rankings?.rankings || {};
      priority4ReadyData=emb.priority4_ready || null;
      wdiCountryMetadata=emb.wdi_country_metadata || null;
      japanRelatedData=emb.japan_related_data || null;
      japanRelatedRankings=emb.japan_related_rankings?.rankings || {};
      japaneseRestaurantsOverview=emb.japanese_restaurants_overview || null;
      overseasJapaneseResidentsOverview=emb.overseas_japanese_residents_overview || null;
      renderAll();
      
    }else{
      document.querySelector('main').insertAdjacentHTML('afterbegin', `<div class="error-box">Data load failed. ローカルで開く場合は簡易サーバー経由で開いてください。<br>${safe(err.message)}</div>`);
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





// V232: Safe automatic version check for GitHub Pages / PWA cache.
const MARKET_BASE_APP_VERSION = 'V258_FLIGHT_RAIL_BACK_BUTTON_NO_BOTTOM_NAV_20260713';
function marketBaseVersionToken(text){
  return String(text || '').split(/\r?\n/)[0].trim();
}
async function purgeMarketBaseLocalCache(){
  const scopePath='/market_base/';
  if('caches' in window){
    const keys=await caches.keys();
    await Promise.all(keys.map(async key=>{
      const keyLooksLocal=String(key).includes('market_base') || String(key).includes('MARKET_BASE');
      if(keyLooksLocal) return caches.delete(key);
      try{
        const cache=await caches.open(key);
        const requests=await cache.keys();
        await Promise.all(requests.filter(req=>{
          const u=new URL(req.url);
          return u.pathname.startsWith(scopePath);
        }).map(req=>cache.delete(req)));
      }catch(_){ /* keep unrelated caches untouched */ }
    }));
  }
  if('serviceWorker' in navigator){
    const regs=await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter(reg=>{
      try{ return new URL(reg.scope).pathname.startsWith(scopePath); }
      catch(_){ return false; }
    }).map(reg=>reg.unregister()));
  }
}
async function checkMarketBaseVersion(){
  try{
    const res=await fetch('version.txt?check='+Date.now(), {cache:'no-store'});
    if(!res.ok) return;
    const remote=marketBaseVersionToken(await res.text());
    const current=marketBaseVersionToken(MARKET_BASE_APP_VERSION);
    if(!remote || remote===current) return;
    const last=localStorage.getItem('market_base_last_auto_refresh_version');
    const running=sessionStorage.getItem('market_base_auto_refresh_running');
    if(last===remote || running==='1') return;
    sessionStorage.setItem('market_base_auto_refresh_running','1');
    const btn=document.getElementById('cacheRefreshBtn');
    if(btn){ btn.textContent='更新中'; btn.disabled=true; }
    await purgeMarketBaseLocalCache();
    localStorage.setItem('market_base_last_auto_refresh_version', remote);
    localStorage.setItem('market_base_last_cache_refresh', new Date().toISOString());
    const url=new URL(window.location.href);
    url.searchParams.set('v', remote.replace(/[^A-Za-z0-9_-]/g,'_'));
    url.searchParams.set('autoRefresh', Date.now().toString());
    window.location.replace(url.toString());
  }catch(err){
    console.warn('MARKET BASE version check skipped', err);
    sessionStorage.removeItem('market_base_auto_refresh_running');
  }
}

// V230: Cache refresh button for GitHub Pages / PWA cache.
async function refreshMarketBaseCache(){
  const btn=document.getElementById('cacheRefreshBtn');
  const original=btn ? btn.textContent : '';
  if(btn){ btn.disabled=true; btn.textContent='更新中'; }
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.filter(reg=>String(reg.scope||'').includes('/market_base/')).map(reg=>reg.unregister()));
    }
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(async key=>{
        const keyLooksLocal=/market[_-]?base|marketbase|mb-|mb_|retail/i.test(key);
        if(keyLooksLocal){ return caches.delete(key); }
        try{
          const cache=await caches.open(key);
          const requests=await cache.keys();
          await Promise.all(requests.filter(req=>{
            try{ return new URL(req.url).pathname.startsWith('/market_base/'); }
            catch(_){ return false; }
          }).map(req=>cache.delete(req)));
        }catch(_){/* keep unrelated caches untouched */}
      }));
    }
    localStorage.setItem('market_base_last_cache_refresh', new Date().toISOString());
  }catch(err){
    console.warn('MARKET BASE cache refresh failed', err);
  }finally{
    const url=new URL(window.location.href);
    url.searchParams.set('v','256');
    url.searchParams.set('refresh',Date.now().toString());
    window.location.replace(url.toString());
    if(btn){ btn.disabled=false; btn.textContent=original || '更新'; }
  }
}

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
document.getElementById('cacheRefreshBtn')?.addEventListener('click', refreshMarketBaseCache);
document.getElementById('globalCacheRefreshBtn')?.addEventListener('click',()=>document.getElementById('cacheRefreshBtn')?.click());
document.getElementById('homeGlobalSearchForm')?.addEventListener('submit',event=>{
  event.preventDefault();
  openGlobalSearch(document.getElementById('homeGlobalSearchInput')?.value || '');
});
document.getElementById('globalSearchForm')?.addEventListener('submit',event=>{
  event.preventDefault();
  openGlobalSearch(document.getElementById('globalSearchInput')?.value || '');
});
document.querySelectorAll('[data-global-search-scope]').forEach(button=>button.addEventListener('click',()=>setGlobalSearchScope(button.dataset.globalSearchScope)));


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
document.getElementById('schoolMetricSelect')?.addEventListener('change', renderSchoolRanking);
boot();

document.getElementById('japanMetricSelect')?.addEventListener('change',renderJapanRanking);


// V134: short app-like splash screen.
(function(){
  const splash=document.getElementById('appSplash');
  if(!splash) return;
  const hide=()=>{
    splash.classList.add('is-hidden');
    window.setTimeout(()=>splash.remove(),420);
  };
  window.setTimeout(hide,760);
})();

try{ checkMarketBaseVersion(); }catch(_){ }
