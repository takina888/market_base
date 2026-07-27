(()=>{
'use strict';
const registry=window.MARKET_BASE_PHOTO_REGISTRY;
if(!registry||window.MARKET_BASE_DAILY_RETAIL_SHOWCASE)return;
window.MARKET_BASE_DAILY_RETAIL_SHOWCASE=true;

const RETAIL_PAGE='retail-sales-v273-db-title-r27.html';
const ROTATE_INTERVAL=12000;
const HISTORY_DAYS=14;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let dailyRotationTimer=null;
const stopRotation=()=>{if(dailyRotationTimer){clearInterval(dailyRotationTimer);dailyRotationTimer=null;}};
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
const dayParts=(date=new Date())=>({y:date.getFullYear(),m:date.getMonth(),d:date.getDate()});
const localDayKey=(date=new Date())=>{const p=dayParts(date);return `${p.y}-${String(p.m+1).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`;};
const dayNumber=(date=new Date())=>{const p=dayParts(date);return Math.floor(Date.UTC(p.y,p.m,p.d)/86400000);};
const dateFromOffset=(offset=0)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d;};
const formatDayLabel=(date)=>localDayKey(date).replaceAll('-', '.');
const safeHash=value=>{let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const photoSrc=photo=>registry.getImageUrl(photo,{thumbnail:true});
const placeholder=()=>registry.getPlaceholderUrl();

function setSafeImage(img,photo){
  const candidates=[photoSrc(photo),photo?.image_url,photo?.thumbnail_url].filter(Boolean).filter((value,index,array)=>array.indexOf(value)===index);
  let cursor=0;
  img.alt=photo.alt_ja||photo.caption_ja||`${photo.company_name_ja||'店舗'}の写真`;
  img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.classList.remove('is-placeholder');
  const loadNext=()=>{
    if(cursor<candidates.length){img.src=candidates[cursor++];return;}
    img.src=placeholder();img.classList.add('is-placeholder');
  };
  img.onerror=()=>loadNext();
  loadNext();
}
function creditDetails(photo){
  const details=el('details','daily-retail-credit');
  const summary=el('summary',null,'出典情報を見る');
  const body=el('div','daily-retail-credit-body');
  if(photo.photographer)body.append(el('span',null,`撮影：${photo.photographer}`));
  if(photo.license){
    const license=el('a',null,`ライセンス：${photo.license}`);
    license.href=photo.license_url||photo.source_page_url||'#';license.target='_blank';license.rel='noopener noreferrer';body.append(license);
  }
  if(photo.modification_note_ja)body.append(el('span',null,`加工：${photo.modification_note_ja}`));
  if(photo.source_page_url){
    const source=el('a',null,`${photo.source_provider||'写真提供元'}を開く ↗`);
    source.href=photo.source_page_url;source.target='_blank';source.rel='noopener noreferrer';body.append(source);
  }
  details.append(summary,body);return details;
}
function groupPhotos(photos){
  const groups=new Map();
  photos.forEach(photo=>{
    if(!photo.company_id)return;
    if(!groups.has(photo.company_id))groups.set(photo.company_id,[]);
    groups.get(photo.company_id).push(photo);
  });
  return [...groups.entries()].map(([company_id,items])=>({
    company_id,
    photos:items.sort((a,b)=>(a.display_order||9999)-(b.display_order||9999)),
    local_count:items.filter(item=>item.local_path).length,
    name:items[0]?.company_name_ja||company_id,
    country:items[0]?.country_name_ja||'',
    gallery_id:items[0]?.gallery_id||company_id
  })).filter(group=>group.photos.length).sort((a,b)=>{
    if(Boolean(b.local_count)!==Boolean(a.local_count))return Number(Boolean(b.local_count))-Number(Boolean(a.local_count));
    return String(a.gallery_id).localeCompare(String(b.gallery_id));
  });
}
function chooseGroup(groups,dateOffset=0){
  if(!groups.length)return null;
  const pool=groups.filter(group=>group.photos.length>=2);
  if(!pool.length)return groups[0]||null;
  const date=dateFromOffset(dateOffset);
  const index=(dayNumber(date)+safeHash('MARKET-BASE-DAILY-RETAIL'))%pool.length;
  return pool[(index+pool.length)%pool.length];
}
function targetHref(companyId){
  const onRetail=document.body.dataset.dailyRetailPage==='retail'||/retail-sales-v273-db-title-r27\.html$/i.test(location.pathname);
  return onRetail?`#${encodeURIComponent(companyId)}`:`${RETAIL_PAGE}?focus=${encodeURIComponent(companyId)}#${encodeURIComponent(companyId)}`;
}
function revealRetailCard(companyId){
  const card=document.getElementById(companyId)||document.querySelector(`[data-entity-id="${CSS.escape(companyId)}"]`);
  if(!card)return false;
  ['q','region','country','chain','format'].forEach(id=>{const control=document.getElementById(id);if(control)control.value='';});
  card.classList.remove('hidden');card.style.removeProperty('display');
  if(typeof window.applyFilters==='function')window.applyFilters();
  card.classList.remove('hidden');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    card.scrollIntoView({behavior:'smooth',block:'start'});
    card.classList.add('mb-link-target-flash');
    setTimeout(()=>card.classList.remove('mb-link-target-flash'),2600);
  }));
  return true;
}

let dialog=null;
function ensureDialog(){
  if(dialog&&dialog.root.isConnected)return dialog;
  const root=el('dialog','daily-retail-dialog');
  const closeX=el('button','daily-retail-dialog-close','×');closeX.type='button';closeX.setAttribute('aria-label','写真を閉じる');
  const figure=el('figure');const img=el('img');const caption=el('figcaption');const title=el('strong');const credit=el('div');caption.append(title,credit);figure.append(img,caption);
  const closeBottom=el('button','daily-retail-dialog-bottom','閉じる');closeBottom.type='button';
  root.append(closeX,figure,closeBottom);document.body.append(root);
  const close=()=>{if(root.open)root.close();};closeX.addEventListener('click',close);closeBottom.addEventListener('click',close);root.addEventListener('click',event=>{if(event.target===root)close();});
  dialog={root,img,title,credit};return dialog;
}
function openPhoto(photo){
  const d=ensureDialog();setSafeImage(d.img,photo);d.title.textContent=photo.caption_ja||photo.alt_ja||photo.company_name_ja||'店舗写真';d.credit.replaceChildren(creditDetails(photo));if(!d.root.open)d.root.showModal();
}
function mountHost(){
  let host=document.getElementById('dailyRetailShowcase');
  if(host)return host;
  host=el('section','daily-retail-showcase');host.id='dailyRetailShowcase';host.hidden=true;host.setAttribute('aria-label','コンビニ・スーパー紹介画像集');
  const retailMain=document.querySelector('main.page');
  if(retailMain&&/retail-sales-v273-db-title-r27\.html$/i.test(location.pathname)){
    document.body.dataset.dailyRetailPage='retail';
    retailMain.append(host);
    return host;
  }
  const home=document.getElementById('home')||document.querySelector('main');
  if(home){
    const reading=document.getElementById('homeReadingSection');
    if(reading&&reading.parentNode===home)home.insertBefore(host,reading);
    else home.append(host);
    return host;
  }
  return null;
}
const dailyRetailState={dateOffset:0};
function clampHistoryOffset(offset){return Math.max(-(HISTORY_DAYS-1),Math.min(0,offset));}
function render(dateOffset=dailyRetailState.dateOffset){
  dateOffset=clampHistoryOffset(dateOffset);
  dailyRetailState.dateOffset=dateOffset;
  stopRotation();
  const host=mountHost();if(!host)return;
  const photos=registry.query({database_id:'retail_sales_db',display_location:'photo_gallery'});
  const groups=groupPhotos(photos);
  const selectedDate=dateFromOffset(dateOffset);
  const group=chooseGroup(groups,dateOffset);
  document.documentElement.dataset.dailyRetailGroups=String(groups.length);
  document.documentElement.dataset.dailyRetailPhotos=String(photos.length);
  if(!group){host.hidden=true;host.replaceChildren();document.documentElement.dataset.dailyRetailGallery='empty';return;}
  host.hidden=false;host.dataset.companyId=group.company_id;host.dataset.day=localDayKey(selectedDate);host.dataset.dayOffset=String(dateOffset);host.replaceChildren();
  const galleryPhotos=group.photos.slice(0,4);
  const first=galleryPhotos[0];
  const heading=el('div','daily-retail-heading');
  const titleWrap=el('div');titleWrap.append(el('span',null,'DAILY STORE GALLERY'),el('h2',null,'コンビニ・スーパー紹介画像集'));
  const dateMeta=el('div','daily-retail-date-meta');
  const date=el('em',null,formatDayLabel(selectedDate));
  const range=el('small',null,'過去2週間の紹介を表示');
  dateMeta.append(date,range);heading.append(titleWrap,dateMeta);host.append(heading);
  const intro=el('div','daily-retail-intro');
  const names=el('div');names.append(el('strong',null,group.name),el('p',null,[group.country,first.store_name_ja,first.city_ja].filter(Boolean).join('｜')));
  intro.append(names);host.append(intro);
  const layout=el('div','daily-retail-layout');
  const mainButton=el('button','daily-retail-main');mainButton.type='button';mainButton.setAttribute('aria-label','写真を拡大表示');
  const mainImg=el('img');const badge=el('span','daily-retail-badge');mainButton.append(mainImg,badge);layout.append(mainButton);
  const side=el('div','daily-retail-side');const thumbs=el('div','daily-retail-thumbs');const caption=el('div','daily-retail-caption');side.append(thumbs,caption);layout.append(side);host.append(layout);
  const dayNav=el('div','daily-retail-day-nav');
  const prevDay=el('button','daily-retail-day-button is-prev','← 前日');prevDay.type='button';prevDay.disabled=dateOffset<=-(HISTORY_DAYS-1);prevDay.addEventListener('click',()=>render(dateOffset-1));
  const dayStatus=el('div','daily-retail-day-status');
  const dayStatusLabel=el('small',null,'表示日');
  const dayStatusValue=el('strong',null,formatDayLabel(selectedDate));
  dayStatus.append(dayStatusLabel,dayStatusValue);
  const nextDay=el('button','daily-retail-day-button is-next','翌日 →');nextDay.type='button';nextDay.disabled=dateOffset>=0;nextDay.addEventListener('click',()=>render(dateOffset+1));
  dayNav.append(prevDay,dayStatus,nextDay);
  host.append(dayNav);
  const link=el('a','daily-retail-company-link','小売業リストの登録情報を見る');link.href=targetHref(group.company_id);
  link.addEventListener('click',event=>{if(document.body.dataset.dailyRetailPage==='retail'){event.preventDefault();revealRetailCard(group.company_id);history.replaceState(null,'',`#${group.company_id}`);}});host.append(link);
  let current=first;let activeIndex=0;const buttons=[];
  const startRotation=()=>{stopRotation();if(galleryPhotos.length<2||reduceMotion.matches||document.hidden)return;dailyRotationTimer=setInterval(()=>{activeIndex=(activeIndex+1)%galleryPhotos.length;apply(galleryPhotos[activeIndex],buttons[activeIndex],activeIndex,false);},ROTATE_INTERVAL);};
  function apply(photo,button,index,manual=false){
    current=photo;activeIndex=index;buttons.forEach(item=>item.classList.toggle('is-active',item===button));setSafeImage(mainImg,photo);badge.textContent=photo.photo_category_ja||'店舗写真';
    caption.replaceChildren(el('strong',null,photo.caption_ja||photo.alt_ja||''),creditDetails(photo));
    if(manual)startRotation();
  }
  galleryPhotos.forEach((photo,index)=>{
    const button=el('button','daily-retail-thumb');button.type='button';button.setAttribute('aria-label',`${photo.photo_category_ja||'写真'}を表示`);
    const img=el('img');img.alt='';setSafeImage(img,photo);button.append(img);button.addEventListener('click',()=>apply(photo,button,index,true));thumbs.append(button);buttons.push(button);if(index===0)apply(photo,button,index,false);
  });
  startRotation();
  mainButton.addEventListener('click',()=>current&&openPhoto(current));
  document.documentElement.dataset.dailyRetailGallery='ready';
  document.documentElement.dataset.dailyRetailCompany=group.company_id;
}
function focusFromUrl(){
  if(document.body.dataset.dailyRetailPage!=='retail')return;
  const params=new URLSearchParams(location.search);const id=(params.get('focus')||decodeURIComponent(location.hash.slice(1)||'')).trim();
  if(id)setTimeout(()=>revealRetailCard(id),120);
}
registry.subscribe(()=>{render();focusFromUrl();});
registry.load({reason:'daily-retail-gallery'}).then(()=>{render();focusFromUrl();});
window.addEventListener('hashchange',focusFromUrl);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRotation();else render();});
})();
