(()=>{
'use strict';
const registry=window.MARKET_BASE_PHOTO_REGISTRY;
if(!registry) return;

const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
const placeholder=()=>registry.getPlaceholderUrl();
const ROTATE_INTERVAL=12000;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const rotators=new Set();
function clearRotators(){rotators.forEach(rotator=>rotator.stop());rotators.clear();}
document.addEventListener('visibilitychange',()=>rotators.forEach(rotator=>document.hidden?rotator.stop():rotator.start()));
const imageUrl=photo=>registry.getImageUrl(photo,{thumbnail:true});
const sourceUrl=photo=>photo.source_page_url||photo.image_url||'#';
function creditDetails(photo){
  const details=el('details','retail-gallery-credit');
  const summary=el('summary',null,'出典情報を見る');
  const body=el('div','retail-gallery-credit-body');
  if(photo.photographer) body.append(el('span',null,`撮影：${photo.photographer}`));
  if(photo.license){
    const license=el('a',null,`ライセンス：${photo.license}`);
    license.href=photo.license_url||sourceUrl(photo);license.target='_blank';license.rel='noopener noreferrer';body.append(license);
  }
  if(sourceUrl(photo)!=='#'){
    const source=el('a',null,`${photo.source_provider||'写真提供元'}を開く ↗`);
    source.href=sourceUrl(photo);source.target='_blank';source.rel='noopener noreferrer';body.append(source);
  }
  if(photo.modification_note_ja) body.append(el('span',null,`画像加工：${photo.modification_note_ja}`));
  details.append(summary,body);
  return details;
}
let active={group:null,photo:null};
const dialog=el('dialog','retail-gallery-dialog');dialog.id='retailGalleryDialog';
const closeX=el('button','retail-gallery-dialog-close','×');closeX.type='button';closeX.setAttribute('aria-label','写真を閉じる');dialog.append(closeX);
const figure=el('figure');const dialogImg=el('img');dialogImg.alt='';const caption=el('figcaption');const dialogTitle=el('strong');const dialogCredit=el('div');caption.append(dialogTitle,dialogCredit);figure.append(dialogImg,caption);dialog.append(figure);
const actions=el('div','retail-gallery-dialog-actions');const companyLink=el('a',null,'この企業の登録情報を見る');companyLink.href='#';const closeBtn=el('button',null,'閉じる');closeBtn.type='button';actions.append(companyLink,closeBtn);dialog.append(actions);
function ensureDialog(){if(!dialog.isConnected)document.body.append(dialog);}
function close(){if(dialog.open)dialog.close();}
closeX.addEventListener('click',close);closeBtn.addEventListener('click',close);dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
function jumpToCard(companyId){
  close();
  const card=document.getElementById(companyId)||document.querySelector(`[data-company-id="${CSS.escape(companyId)}"],[data-entity-id="${CSS.escape(companyId)}"]`);
  if(!card)return;
  card.classList.remove('hidden');
  card.classList.add('mb-link-target-flash');
  card.scrollIntoView({behavior:'smooth',block:'start'});
  window.setTimeout(()=>card.classList.remove('mb-link-target-flash'),2600);
}
companyLink.addEventListener('click',event=>{event.preventDefault();if(active.group)jumpToCard(active.group.company_id);});
function setSafeImage(img,photo){
  const candidates=[registry.getImageUrl(photo,{thumbnail:true}),photo?.image_url,photo?.thumbnail_url].filter(Boolean).filter((value,index,array)=>array.indexOf(value)===index);
  let cursor=0;
  img.alt=photo.alt_ja||photo.caption_ja||`${photo.company_name_ja||'店舗'}の写真`;
  img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.classList.remove('is-placeholder');
  const loadNext=()=>{
    if(cursor<candidates.length){img.src=candidates[cursor++];return;}
    img.src=registry.getPlaceholderUrl();img.classList.add('is-placeholder');
  };
  img.onerror=()=>loadNext();
  loadNext();
}
function openDialog(group,photo){
  ensureDialog();active={group,photo};setSafeImage(dialogImg,photo);dialogImg.alt=photo.alt_ja||photo.caption_ja||'';
  dialogTitle.textContent=`${photo.photo_category_ja||'写真'}｜${photo.caption_ja||photo.alt_ja||''}`;
  dialogCredit.replaceChildren(creditDetails(photo));
  if(!dialog.open)dialog.showModal();
}
function groupPhotos(photos){
  const map=new Map();
  photos.forEach(photo=>{
    if(!photo.company_id)return;
    if(!map.has(photo.company_id))map.set(photo.company_id,[]);
    map.get(photo.company_id).push(photo);
  });
  return [...map.entries()].map(([company_id,items])=>({company_id,photos:items.sort((a,b)=>a.display_order-b.display_order)}));
}
function renderGroup(group){
  const card=document.getElementById(group.company_id);
  if(!card||!group.photos.length)return false;
  card.dataset.companyId=group.company_id;
  const galleryPhotos=group.photos.slice(0,4);
  const first=galleryPhotos[0];
  const section=el('section','retail-store-gallery');section.dataset.retailGallery=first.gallery_id||group.company_id;section.setAttribute('aria-label',`${first.company_name_ja||card.querySelector('h2')?.textContent||''} 店舗・売場ギャラリー`);
  const heading=el('div','retail-gallery-heading');const left=el('div');left.append(el('span',null,'STORE GALLERY'),el('h3',null,'店舗・売場ギャラリー'));
  const location=el('em',null,[first.store_name_ja,first.city_ja].filter(Boolean).join('｜'));heading.append(left,location);section.append(heading);
  const stage=el('div','retail-gallery-stage');section.append(stage);
  const main=el('button','retail-gallery-main');main.type='button';main.setAttribute('aria-label','写真を拡大表示');const mainImg=el('img');mainImg.loading='lazy';mainImg.decoding='async';const category=el('span','retail-gallery-category');main.append(mainImg,category);stage.append(main);
  const thumbs=el('div','retail-gallery-thumbs');thumbs.setAttribute('role','group');thumbs.setAttribute('aria-label','ギャラリー写真');stage.append(thumbs);
  const expand=el('button','retail-gallery-expand','写真をすべて見る');expand.type='button';section.append(expand);
  const meta=el('div','retail-gallery-meta');section.append(meta);
  const jump=el('a','retail-gallery-company-link','この企業の登録情報を見る');jump.href=`#${group.company_id}`;jump.addEventListener('click',event=>{event.preventDefault();jumpToCard(group.company_id);});section.append(jump);
  let current=null;let expanded=false;let activeIndex=0;
  const buttons=[];
  const rotator={timer:null,stop(){if(this.timer){clearInterval(this.timer);this.timer=null;}},start(){this.stop();if(galleryPhotos.length<2||reduceMotion.matches||document.hidden)return;this.timer=setInterval(()=>{activeIndex=(activeIndex+1)%galleryPhotos.length;apply(galleryPhotos[activeIndex],buttons[activeIndex],activeIndex,false);},ROTATE_INTERVAL);}};
  function apply(photo,button,index,manual=false){
    current=photo;activeIndex=index;
    buttons.forEach(item=>item.classList.toggle('is-active',item===button));
    setSafeImage(mainImg,photo);mainImg.alt=photo.alt_ja||photo.caption_ja||'';category.textContent=photo.photo_category_ja||'写真';
    meta.replaceChildren(el('strong',null,photo.caption_ja||photo.alt_ja||''),creditDetails(photo));
    if(manual)rotator.start();
  }
  galleryPhotos.forEach((photo,index)=>{
    const button=el('button','retail-gallery-thumb');button.type='button';button.setAttribute('aria-label',`${photo.photo_category_ja||'写真'}を表示`);
    const img=el('img');img.loading='lazy';img.decoding='async';img.alt='';setSafeImage(img,photo);button.append(img);button.addEventListener('click',()=>apply(photo,button,index,true));thumbs.append(button);buttons.push(button);if(index===0)apply(photo,button,index,false);
  });
  const visibleLimit=()=>window.matchMedia('(min-width:900px)').matches?4:6;
  const updateVisibility=()=>{const limit=visibleLimit();buttons.forEach((button,index)=>{button.hidden=!expanded&&index>=limit;});expand.hidden=buttons.length<=limit;expand.textContent=expanded?'写真を閉じる':'写真をすべて見る';};
  expand.addEventListener('click',()=>{expanded=!expanded;updateVisibility();});
  window.addEventListener('resize',updateVisibility,{passive:true});
  updateVisibility();
  rotators.add(rotator);rotator.start();
  main.addEventListener('click',()=>current&&openDialog(group,current));
  card.append(section);return true;
}
function render(){
  ensureDialog();
  clearRotators();
  document.querySelectorAll('.retail-store-gallery').forEach(node=>node.remove());
  const photos=registry.query({database_id:'retail_sales_db',display_location:'photo_gallery'});
  let count=0;groupPhotos(photos).forEach(group=>{if(renderGroup(group))count++;});
  document.documentElement.dataset.retailGalleryCount=String(count);
  document.documentElement.dataset.retailGalleryPhotoCount=String(photos.length);
}
registry.subscribe(()=>render());
registry.load({reason:'retail-gallery'}).then(render);
})();
