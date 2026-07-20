(()=>{
'use strict';
const registry=window.MARKET_BASE_PHOTO_REGISTRY;
if(!registry||window.MARKET_BASE_DAILY_RETAIL_SHOWCASE)return;
window.MARKET_BASE_DAILY_RETAIL_SHOWCASE=true;

const RETAIL_PAGE='retail-sales-v273-db-title-r27.html';
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
const localDayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const dayNumber=()=>{const d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);};
const safeHash=value=>{let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const photoSrc=photo=>registry.getImageUrl(photo,{thumbnail:true});
const placeholder=()=>registry.getPlaceholderUrl();

function setSafeImage(img,photo){
  img.src=photoSrc(photo);
  img.alt=photo.alt_ja||photo.caption_ja||`${photo.company_name_ja||'店舗'}の写真`;
  img.loading='lazy';img.decoding='async';
  img.addEventListener('error',()=>{if(img.src.endsWith('photo-placeholder.webp'))return;img.src=placeholder();img.classList.add('is-placeholder');},{once:true});
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
    const source=el('a',null,'Wikimedia Commonsの写真ページを開く ↗');
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
function chooseGroup(groups,offset=0){
  if(!groups.length)return null;
  const dependable=groups.filter(group=>group.local_count===group.photos.length&&group.photos.length>=2);
  const pool=dependable.length?dependable:groups;
  const index=(dayNumber()+safeHash('MARKET-BASE-DAILY-RETAIL')+offset)%pool.length;
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
  host=el('section','daily-retail-showcase');host.id='dailyRetailShowcase';host.hidden=true;host.setAttribute('aria-label','日替わりコンビニ・スーパー紹介画像集');
  const retailFilters=document.querySelector('main.page .filters');
  if(retailFilters){
    document.body.dataset.dailyRetailPage='retail';
    retailFilters.insertAdjacentElement('afterend',host);
    return host;
  }
  const journey=document.getElementById('todaysJourney');
  if(journey){journey.insertAdjacentElement('afterend',host);return host;}
  const home=document.getElementById('home')||document.querySelector('main');
  if(home){home.insertBefore(host,home.children[Math.min(2,home.children.length)]||null);return host;}
  return null;
}
function render(offset=0){
  const host=mountHost();if(!host)return;
  const photos=registry.query({database_id:'retail_sales_db',display_location:'photo_gallery'});
  const groups=groupPhotos(photos);
  const group=chooseGroup(groups,offset);
  document.documentElement.dataset.dailyRetailGroups=String(groups.length);
  document.documentElement.dataset.dailyRetailPhotos=String(photos.length);
  if(!group){host.hidden=true;host.replaceChildren();document.documentElement.dataset.dailyRetailGallery='empty';return;}
  host.hidden=false;host.dataset.companyId=group.company_id;host.dataset.day=localDayKey();host.replaceChildren();
  const first=group.photos[0];
  const heading=el('div','daily-retail-heading');
  const titleWrap=el('div');titleWrap.append(el('span',null,'DAILY STORE GALLERY'),el('h2',null,'今日のコンビニ・スーパー紹介画像集'));
  const date=el('em',null,localDayKey().replaceAll('-','.'));heading.append(titleWrap,date);host.append(heading);
  const intro=el('div','daily-retail-intro');
  const names=el('div');names.append(el('strong',null,group.name),el('p',null,[group.country,first.store_name_ja,first.city_ja].filter(Boolean).join('｜')));
  const next=el('button','daily-retail-next','別の店舗を見る');next.type='button';next.addEventListener('click',()=>render(offset+1));intro.append(names,next);host.append(intro);
  const layout=el('div','daily-retail-layout');
  const mainButton=el('button','daily-retail-main');mainButton.type='button';mainButton.setAttribute('aria-label','写真を拡大表示');
  const mainImg=el('img');const badge=el('span','daily-retail-badge');mainButton.append(mainImg,badge);layout.append(mainButton);
  const side=el('div','daily-retail-side');const thumbs=el('div','daily-retail-thumbs');const caption=el('div','daily-retail-caption');side.append(thumbs,caption);layout.append(side);host.append(layout);
  const link=el('a','daily-retail-company-link','小売業リストの登録情報を見る');link.href=targetHref(group.company_id);
  link.addEventListener('click',event=>{if(document.body.dataset.dailyRetailPage==='retail'){event.preventDefault();revealRetailCard(group.company_id);history.replaceState(null,'',`#${group.company_id}`);}});host.append(link);
  let current=first;const buttons=[];
  function apply(photo,button){
    current=photo;buttons.forEach(item=>item.classList.toggle('is-active',item===button));setSafeImage(mainImg,photo);badge.textContent=photo.photo_category_ja||'店舗写真';
    caption.replaceChildren(el('strong',null,photo.caption_ja||photo.alt_ja||''),creditDetails(photo));
  }
  group.photos.slice(0,6).forEach((photo,index)=>{
    const button=el('button','daily-retail-thumb');button.type='button';button.setAttribute('aria-label',`${photo.photo_category_ja||'写真'}を表示`);
    const img=el('img');img.alt='';setSafeImage(img,photo);button.append(img);button.addEventListener('click',()=>apply(photo,button));thumbs.append(button);buttons.push(button);if(index===0)apply(photo,button);
  });
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
})();
