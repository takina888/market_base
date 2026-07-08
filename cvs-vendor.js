window.CVSVendorRefresh=async function(){
  try{
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.includes('market_base')||k.includes('MARKET_BASE')||k.toLowerCase().includes('cvs')).map(k=>caches.delete(k)));
    }
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.filter(r=>(r.scope||'').includes('/market_base/')).map(r=>r.update().catch(()=>r.unregister())));
    }
  }catch(e){console.warn('refresh skipped',e)}
  const u=new URL(location.href);u.searchParams.set('v','243');u.searchParams.set('refresh',Date.now());location.href=u.toString();
};

const CVS_VERSION='V243_CVS_PASS53_RC_V5_DISPLAY_REPLACE_20260707';
const state={companies:[]};
const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const norm=v=>String(v??'').toLowerCase();
const count=a=>Array.isArray(a)?a.length:0;
const wordsToHide=['要'+'確認','候'+'補','参'+'考'+'値','参'+'考','表示'+'対象','UI'+'表示','残'+'課'+'題','内部'+'メモ','配置'+'指示','後日'+'調査'];
function cleanText(v){
  let s=String(v??'').trim();
  if(!s)return '';
  wordsToHide.forEach(w=>{s=s.split(w).join('')});
  s=s.replace(/\b[A-D][+-]?(?:_[0-9_]+[A-Za-z_]+)?\b/g,'');
  s=s.replace(/\b(?:factory_identified|customer_linked|company_level|company_record|factory_record)\b/gi,'');
  s=s.replace(/\s*\/\s*(\/\s*)+/g,' / ')
     .replace(/\s*;\s*(;\s*)+/g,'; ')
     .replace(/(?:^|[\/;|、，])\s*(?:[\/;|、，]\s*)+/g,'')
     .replace(/\s{2,}/g,' ')
     .replace(/^[\s\/;|、，.。]+|[\s\/;|、，.。]+$/g,'');
  return s;
}
function show(v,empty='情報なし'){const s=cleanText(v);return s?esc(s):`<span class="muted">${esc(empty)}</span>`}
function kpis(){
  const c=state.companies;
  const facilities=c.reduce((a,x)=>a+count(x.facilities),0);
  const relationships=c.reduce((a,x)=>a+count(x.chain_relationships),0);
  const products=c.reduce((a,x)=>a+count(x.product_label_references),0);
  const countries=new Set(c.map(x=>cleanText(x.country_region)).filter(Boolean)).size;
  document.getElementById('kpis').innerHTML=[['会社',c.length],['工場・拠点',facilities],['チェーン関係',relationships],['商品情報',products],['国・地域',countries]].map(([k,v])=>`<div class="kpi"><strong>${esc(v)}</strong><span>${esc(k)}</span></div>`).join('');
}
function setupFilters(){
  const countries=[...new Set(state.companies.map(c=>cleanText(c.country_region)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja'));
  document.getElementById('country').innerHTML='<option value="all">国・地域すべて</option>'+countries.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
}
function table(rows,cols,limit=10){
  if(!rows||!rows.length)return '<p class="empty">情報なし</p>';
  const visible=rows.slice(0,limit);
  const body=visible.map(r=>`<tr>${cols.map(c=>`<td>${show(r[c[1]],'')}</td>`).join('')}</tr>`).join('');
  const more=rows.length>limit?`<p class="tableMore">ほか ${rows.length-limit} 件</p>`:'';
  return `<table class="miniTable"><thead><tr>${cols.map(c=>`<th>${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>${more}`;
}
function card(c){
  const fac=count(c.facilities), rel=count(c.chain_relationships), lab=count(c.product_label_references);
  const summary=cleanText(c.company_summary_public)||[cleanText(c.business_category_ja),cleanText(c.product_category_ja),cleanText(c.main_locations)].filter(Boolean).join('。');
  return `<article class="card">
    <h2>${esc(c.company_name||c.company_name_ja||'会社名未入力')}</h2>
    <div class="meta"><span class="pill strong">${show(c.country_region,'国・地域')}</span><span class="pill">工場 ${fac}</span><span class="pill">チェーン ${rel}</span><span class="pill">商品 ${lab}</span></div>
    <p class="summary">${show(summary)}</p>
    <div class="section"><h3>主な分野</h3><p>${show(c.business_category_ja||c.product_category_ja)}</p></div>
    <div class="section"><h3>関連チェーン</h3><p>${show(c.related_cvs_chains)}</p></div>
    <div class="section"><h3>関連工場・拠点</h3>${table(c.facilities,[['拠点名','facility_name'],['地域','city_area'],['主な品目','main_products_ja']],8)}</div>
    <div class="section"><h3>商品情報</h3>${table(c.product_label_references,[['商品名','product_name'],['カテゴリ','product_category_ja'],['製造者','manufacturer_name']],8)}</div>
    <div class="actions"><button data-id="${esc(c.company_id)}">関連リンク</button></div>
  </article>`;
}
function searchable(c){return norm([c.company_name,c.company_name_ja,c.company_name_local,c.country_region,c.related_cvs_chains,c.business_category_ja,c.product_category_ja,c.main_locations,c.factory_names_summary,JSON.stringify(c.facilities||[]),JSON.stringify(c.product_label_references||[])].join(' '));}
function render(){
  const q=norm(document.getElementById('search').value);
  const country=document.getElementById('country').value;
  const hf=document.getElementById('hasFacility').value;
  const hp=document.getElementById('hasProduct').value;
  let rows=state.companies.filter(c=>!q||searchable(c).includes(q));
  if(country!=='all')rows=rows.filter(c=>cleanText(c.country_region)===country);
  if(hf!=='all')rows=rows.filter(c=>(count(c.facilities)>0)===(hf==='yes'));
  if(hp!=='all')rows=rows.filter(c=>(count(c.product_label_references)>0)===(hp==='yes'));
  document.getElementById('resultCount').textContent=`${rows.length}社`;
  document.getElementById('companyList').innerHTML=rows.map(card).join('')||'<p class="empty">該当なし</p>';
}
function showDrawer(id){
  const c=state.companies.find(x=>x.company_id===id);
  const rows=(c?.source_drawer||[]).filter(s=>s&&s.url).slice(0,30);
  document.getElementById('drawerBody').innerHTML=`<h2>${esc(c?.company_name||'関連リンク')}</h2>`+(rows.length?rows.map(s=>`<div class="sourceItem"><strong>${show(s.title,'リンク')}</strong><p>${show(s.country_region,'')}</p><a href="${esc(s.url)}" target="_blank" rel="noopener">リンクを開く</a></div>`).join(''):'<p class="empty">リンクなし</p>');
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer').setAttribute('aria-hidden','false');
}
async function init(){
  state.companies=await fetch('./data/cvs_vendor/company_details.json?v=243',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('company_details');return r.json()});
  setupFilters();kpis();render();
  document.querySelectorAll('#search,#country,#hasFacility,#hasProduct').forEach(el=>el.addEventListener('input',render));
  document.getElementById('companyList').addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(b)showDrawer(b.dataset.id)});
  document.getElementById('closeDrawer').onclick=()=>{document.getElementById('drawer').classList.remove('open');document.getElementById('drawer').setAttribute('aria-hidden','true')};
}
init().catch(e=>{document.getElementById('companyList').innerHTML='<p class="empty">データを読み込めませんでした。</p>';console.error(e)});
