(()=>{
'use strict';
if(window.MARKET_BASE_PHOTO_REGISTRY) return;

const REGISTRY_PATH='data/images/photo_registry.json';
const CACHE_KEY='market_base_photo_registry_cache_v1';
const VERSION_KEY='market_base_photo_registry_version_v1';
const MIN_RELOAD_INTERVAL=60*1000;
const PERIODIC_RELOAD_INTERVAL=4*60*60*1000;
const PLACEHOLDER_PATH="data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 800 500\"><rect width=\"800\" height=\"500\" fill=\"%23eef4fa\"/><path d=\"M250 340l105-120 75 85 55-60 85 95H250z\" fill=\"%23c8d9e9\"/><circle cx=\"315\" cy=\"160\" r=\"36\" fill=\"%23c8d9e9\"/><text x=\"400\" y=\"420\" text-anchor=\"middle\" font-family=\"sans-serif\" font-size=\"30\" fill=\"%2368798f\">写真を読み込めません</text></svg>');

let registry={schema_version:'1.0',registry_version:'',updated_at:'',photos:[]};
let signature='';
let lastFetchAt=0;
let loadPromise=null;
let midnightTimer=null;
const subscribers=new Set();

const now=()=>Date.now();
const isPublished=photo=>photo&&photo.status==='published'&&photo.license_review_status!=='要確認';
const hasLocation=(photo,location)=>!location||Array.isArray(photo.display_locations)&&photo.display_locations.includes(location);
const orderPhotos=list=>list.slice().sort((a,b)=>(Number(a.display_order)||9999)-(Number(b.display_order)||9999)||String(a.photo_id||'').localeCompare(String(b.photo_id||'')));
function normalizePayload(payload){
  const base=Array.isArray(payload)?{schema_version:'1.0',registry_version:'legacy-array',updated_at:'',photos:payload}:payload;
  if(!base||!Array.isArray(base.photos)) throw new Error('photo_registry.json の形式が正しくありません。');
  return {
    schema_version:String(base.schema_version||'1.0'),
    registry_version:String(base.registry_version||''),
    updated_at:String(base.updated_at||''),
    update_rule:String(base.update_rule||''),
    photos:base.photos.filter(item=>item&&item.photo_id).map(item=>({
      ...item,
      display_locations:Array.isArray(item.display_locations)?item.display_locations:[],
      database_ids:Array.isArray(item.database_ids)?item.database_ids:[],
      display_order:Number(item.display_order)||9999,
      is_primary:item.is_primary===true,
      status:String(item.status||'draft')
    }))
  };
}
function simpleHash(value){
  let h=2166136261;
  for(let i=0;i<value.length;i++){
    h^=value.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return (h>>>0).toString(16).padStart(8,'0');
}
function payloadSignature(next){
  return simpleHash(JSON.stringify({version:next.registry_version,updated:next.updated_at,photos:next.photos}));
}
function saveCache(next,nextSignature){
  try{
    localStorage.setItem(CACHE_KEY,JSON.stringify({saved_at:now(),registry:next}));
    localStorage.setItem(VERSION_KEY,nextSignature||payloadSignature(next));
  }catch(_){ }
}
function restoreCache(){
  try{
    const raw=localStorage.getItem(CACHE_KEY);
    if(!raw) return false;
    const cached=JSON.parse(raw);
    const next=normalizePayload(cached.registry);
    registry=next;
    signature=payloadSignature(next);
    document.documentElement.dataset.photoRegistry='cached';
    document.documentElement.dataset.photoRegistryVersion=next.registry_version||'';
    return true;
  }catch(_){ return false; }
}
function registryUrl(){
  const url=new URL(REGISTRY_PATH,document.baseURI);
  url.searchParams.set('mb_registry_check',String(now()));
  return url.href;
}
function notify(reason,changed){
  const detail={registry,reason,changed,version:registry.registry_version,updated_at:registry.updated_at,photo_count:registry.photos.length};
  window.dispatchEvent(new CustomEvent('marketbase:photo-registry-updated',{detail}));
  subscribers.forEach(fn=>{try{fn(detail);}catch(error){console.error(error);}});
}
async function fetchRegistry(reason){
  const controller=typeof AbortController==='function'?new AbortController():null;
  const timeout=controller?window.setTimeout(()=>controller.abort(),15000):null;
  try{
    const response=await fetch(registryUrl(),{
      cache:'no-store',
      credentials:'same-origin',
      headers:{'Accept':'application/json'},
      signal:controller?.signal
    });
    if(!response.ok) throw new Error(`photo registry ${response.status}`);
    const next=normalizePayload(await response.json());
    const nextSignature=payloadSignature(next);
    const changed=nextSignature!==signature;
    registry=next;
    signature=nextSignature;
    lastFetchAt=now();
    saveCache(next,nextSignature);
    document.documentElement.dataset.photoRegistry='ready';
    document.documentElement.dataset.photoRegistryVersion=next.registry_version||'';
    document.documentElement.dataset.photoRegistryCount=String(next.photos.length);
    if(changed||reason==='initial') notify(reason,changed);
    return registry;
  }finally{
    if(timeout) clearTimeout(timeout);
  }
}
async function load(options={}){
  const force=options.force===true;
  const reason=String(options.reason||'manual');
  if(loadPromise) return loadPromise;
  if(!force&&lastFetchAt&&now()-lastFetchAt<MIN_RELOAD_INTERVAL) return registry;
  loadPromise=fetchRegistry(reason).catch(error=>{
    console.warn('写真一覧を更新できませんでした。前回取得分を使用します。',error);
    document.documentElement.dataset.photoRegistry=registry.photos.length?'stale':'error';
    if(!registry.photos.length) restoreCache();
    if(registry.photos.length&&reason==='initial') notify('cached-fallback',true);
    return registry;
  }).finally(()=>{loadPromise=null;});
  return loadPromise;
}
function query(filters={}){
  const status=filters.status===undefined?'published':filters.status;
  return orderPhotos(registry.photos.filter(photo=>{
    if(status&&photo.status!==status) return false;
    if(status==='published'&&!isPublished(photo)) return false;
    if(filters.company_id&&photo.company_id!==filters.company_id) return false;
    if(filters.store_id&&photo.store_id!==filters.store_id) return false;
    if(filters.article_id&&photo.article_id!==filters.article_id) return false;
    if(filters.country_code&&photo.country_code!==filters.country_code) return false;
    if(filters.photo_type&&photo.photo_type!==filters.photo_type) return false;
    if(filters.database_id&&!photo.database_ids.includes(filters.database_id)) return false;
    if(filters.display_location&&!hasLocation(photo,filters.display_location)) return false;
    return true;
  }));
}
function imageUrl(photo,options={}){
  if(!photo) return PLACEHOLDER_PATH;
  if(options.thumbnail!==false&&photo.thumbnail_url) return photo.thumbnail_url;
  return photo.image_url||photo.thumbnail_url||PLACEHOLDER_PATH;
}
function representative(options={}){
  const location=options.display_location||'database_card';
  const company=options.company_id?query({company_id:options.company_id,display_location:location}):[];
  const primaryCompany=company.find(photo=>photo.is_primary);
  if(primaryCompany) return primaryCompany;
  if(company.length) return company[0];
  const country=options.country_code?query({country_code:options.country_code,display_location:location}):[];
  const primaryCountry=country.find(photo=>photo.is_primary);
  return primaryCountry||country[0]||null;
}
function subscribe(handler){
  if(typeof handler!=='function') return ()=>{};
  subscribers.add(handler);
  if(registry.photos.length) queueMicrotask(()=>handler({registry,reason:'subscribe',changed:false,version:registry.registry_version,updated_at:registry.updated_at,photo_count:registry.photos.length}));
  return ()=>subscribers.delete(handler);
}
function scheduleMidnightReload(){
  if(midnightTimer) clearTimeout(midnightTimer);
  const d=new Date();
  const next=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1,0,0,5,0);
  midnightTimer=window.setTimeout(()=>{
    load({force:true,reason:'date-change'}).finally(scheduleMidnightReload);
  },Math.max(1000,next.getTime()-d.getTime()));
}

if(window.MARKET_BASE_PHOTO_REGISTRY_EMBEDDED){
  try{
    registry=normalizePayload(window.MARKET_BASE_PHOTO_REGISTRY_EMBEDDED);
    signature=payloadSignature(registry);
    document.documentElement.dataset.photoRegistry='embedded';
    document.documentElement.dataset.photoRegistryVersion=registry.registry_version||'';
  }catch(error){ console.warn('埋め込み写真一覧を読み込めませんでした。',error); }
}
if(!registry.photos.length) restoreCache();
window.MARKET_BASE_PHOTO_REGISTRY={
  load,
  reload:reason=>load({force:true,reason:reason||'explicit-reload'}),
  query,
  getAll:()=>registry.photos.slice(),
  getByCompanyId:(companyId,displayLocation)=>query({company_id:companyId,display_location:displayLocation}),
  getByStoreId:(storeId,displayLocation)=>query({store_id:storeId,display_location:displayLocation}),
  getByArticleId:(articleId,displayLocation)=>query({article_id:articleId,display_location:displayLocation}),
  getByCountryCode:(countryCode,displayLocation)=>query({country_code:countryCode,display_location:displayLocation}),
  getRepresentativePhoto:representative,
  getImageUrl:imageUrl,
  getPlaceholderUrl:()=>PLACEHOLDER_PATH,
  getVersion:()=>registry.registry_version,
  getUpdatedAt:()=>registry.updated_at,
  subscribe
};

const start=()=>{
  if(window.location.protocol==='file:'){
    if(registry.photos.length) notify('embedded-file-mode',true);
    scheduleMidnightReload();
    return;
  }
  load({force:true,reason:'initial'});
  scheduleMidnightReload();
  window.setInterval(()=>load({force:true,reason:'periodic'}),PERIODIC_RELOAD_INTERVAL);
};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
window.addEventListener('pageshow',event=>load({force:event.persisted||now()-lastFetchAt>MIN_RELOAD_INTERVAL,reason:'pageshow'}));
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible') load({force:now()-lastFetchAt>MIN_RELOAD_INTERVAL,reason:'visibility-return'});
});
window.addEventListener('online',()=>load({force:true,reason:'online'}));
window.addEventListener('storage',event=>{
  if(event.key===VERSION_KEY&&event.newValue&&event.newValue!==signature) load({force:true,reason:'other-tab-update'});
});
})();
