(() => {
  const summary = window.MB_RETAIL_COUNTRY_CARD_SUMMARY_DATA || { entities: [], totals: {} };
  const presence = window.MB_RETAIL_PRESENCE_DATA || { entities: [] };
  const profiles = window.MB_RETAIL_DATA || { profiles: [] };
  const entities = summary.entities || [];
  const presenceMap = new Map((presence.entities || []).map(e => [e.entity_id, e]));

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt = (n) => {
    if (n === null || n === undefined || n === '') return '-';
    const num = Number(String(n).replace(/,/g,''));
    return Number.isFinite(num) ? num.toLocaleString('ja-JP') : esc(n);
  };
  const text = (v) => (v === null || v === undefined || v === '') ? '-' : esc(v);
  const norm = (v) => String(v || '').toLowerCase();
  const safeUrl = (url) => {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^(https?:)?\/\//i.test(raw) || /^[\w./?=&%#:+-]+$/i.test(raw)) return raw.replace(/"/g,'%22');
    return '';
  };

  function profileCount(entityId){
    const list = profiles.profiles || profiles.entities || [];
    return Array.isArray(list) ? list.filter(p => p.entity_id === entityId && p.profile_text).length : 0;
  }
  function getSourceType(c){ return String(c.store_count_source_type || c.source_type || c.metadata_source_type || '').toLowerCase(); }
  function sourceGroup(c){
    const s = getSourceType(c);
    if (!s || s.includes('pending') || s.includes('discovery')) return 'pending';
    if (s.includes('historical') || s.includes('seed')) return 'historical';
    if (s.includes('reference') || s.includes('news') || s.includes('media')) return 'reference';
    if (s.includes('official') || s.includes('annual') || s.includes('ir')) return 'official';
    return 'reference';
  }
  function statusClass(c){
    const st = norm(c.store_count_status || c.auto_update_current_step || '');
    if (st.includes('review') || st.includes('hold')) return 'review';
    if (c.store_count_available || c.store_count || c.store_count_normalized) return 'available';
    return 'pending';
  }
  function countValue(c){
    const raw = c.store_count_normalized || c.store_count || '';
    const n = Number(String(raw).replace(/,/g,''));
    return Number.isFinite(n) ? n : null;
  }
  function updateUrl(entityId){
    if (!entityId || !history.replaceState) return;
    const params = new URLSearchParams(location.search);
    params.set('entity', entityId);
    history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
  }

  function initStats(){
    $('statCountries').textContent = fmt(summary.summary_count || entities.length);
    $('statChains').textContent = fmt(summary.totals?.retail_presence_total || 0);
    $('statCounts').textContent = fmt(summary.totals?.store_count_available_total || 0);
    $('statQueue').textContent = fmt(summary.totals?.quarterly_update_queue_total || 0);
  }
  function fillSelect(){
    const q = norm(($('countrySearch').value || '').trim());
    const selected = $('countrySelect').value;
    const filtered = entities.filter(e => !q || [e.entity_id,e.name_ja,e.name_en].some(v => norm(v).includes(q)));
    $('countrySelect').innerHTML = filtered.map(e => `<option value="${esc(e.entity_id)}">${esc(e.entity_id)} / ${text(e.name_ja)} / ${text(e.name_en)}</option>`).join('');
    const params = new URLSearchParams(location.search);
    const target = selected || params.get('entity') || 'JP';
    if (filtered.some(e => e.entity_id === target)) $('countrySelect').value = target;
    else if (filtered[0]) $('countrySelect').value = filtered[0].entity_id;
  }
  function fillQuickMarkets(){
    const top = [...entities].filter(e => (e.retail_chain_count || 0) > 0).sort((a,b) => (b.retail_chain_count || 0) - (a.retail_chain_count || 0)).slice(0, 10);
    $('quickMarketButtons').innerHTML = top.map(e => `<button type="button" data-entity="${esc(e.entity_id)}">${esc(e.entity_id)} ${text(e.name_ja)}</button>`).join('');
    $('quickMarketButtons').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
      $('countrySearch').value = '';
      fillSelect();
      $('countrySelect').value = btn.dataset.entity;
      renderCountry(true);
    }));
  }
  function fillFormatFilter(entityId){
    const entity = presenceMap.get(entityId) || { chains: [] };
    const current = $('formatFilter').value;
    const formats = [...new Set((entity.chains || []).map(c => c.retail_format_display_ja || c.channel_type).filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b),'ja'));
    $('formatFilter').innerHTML = '<option value="all">すべて</option>' + formats.map(f => `<option value="${esc(f)}">${text(f)}</option>`).join('');
    if (formats.includes(current)) $('formatFilter').value = current;
  }
  function activeFilterText(){
    const parts = [];
    if ($('chainSearch').value.trim()) parts.push(`チェーン検索: ${esc($('chainSearch').value.trim())}`);
    if ($('countFilter').value !== 'all') parts.push(`店舗数: ${esc($('countFilter').selectedOptions[0].textContent)}`);
    if ($('formatFilter').value !== 'all') parts.push(`業態: ${esc($('formatFilter').value)}`);
    if ($('sourceTypeFilter').value !== 'all') parts.push(`出典: ${esc($('sourceTypeFilter').selectedOptions[0].textContent)}`);
    return parts.length ? parts.join(' / ') : 'フィルターなし';
  }
  function renderCountry(syncUrl=false){
    const entityId = $('countrySelect').value || 'JP';
    const s = entities.find(e => e.entity_id === entityId) || entities[0];
    if (!s) {
      $('chainList').innerHTML = '<div class="empty">小売市場データを読み込めませんでした。</div>';
      return;
    }
    if (syncUrl) updateUrl(s.entity_id);
    fillFormatFilter(s.entity_id);
    $('countryTitle').textContent = `${s.name_ja || s.entity_id} / ${s.name_en || ''}`;
    $('countryFormats').innerHTML = `主な業態: ${text(s.primary_formats_label)} / 詳細リンク: ${text(s.detail_link_query || 'retail-market.html?entity=' + s.entity_id)}`;
    const total = Number(s.retail_chain_count || 0);
    const available = Number(s.store_count_available_count || 0);
    const official = Number(s.store_count_official_count || 0);
    const coverage = total ? Math.round((available / total) * 100) : 0;
    const officialShare = available ? Math.round((official / available) * 100) : 0;
    $('countryQuality').innerHTML = [`店舗数カバー率 ${coverage}%`, `公式値比率 ${officialShare}%`, `四半期更新 ${fmt(s.quarterly_update_queue_count)}`].map(t => `<span class="quality-pill">${esc(t)}</span>`).join('');
    $('countryMetrics').innerHTML = [['チェーン', s.retail_chain_count], ['店舗数あり', s.store_count_available_count], ['店舗数なし', s.store_count_pending_count], ['公式値', s.store_count_official_count], ['範囲確認', s.scope_or_source_review_count], ['プロフィール', s.profile_text_count || profileCount(s.entity_id)]].map(([label,value]) => `<div class="metric"><span>${esc(label)}</span><strong>${fmt(value)}</strong></div>`).join('');
    renderChains(s.entity_id);
  }
  function renderChains(entityId){
    const entity = presenceMap.get(entityId) || { chains: [] };
    let chains = [...(entity.chains || [])];
    const q = norm(($('chainSearch').value || '').trim());
    const filter = $('countFilter').value;
    const format = $('formatFilter').value;
    const source = $('sourceTypeFilter').value;
    const sort = $('sortMode').value;
    const limit = $('limitMode').value;
    chains = chains.filter(c => !q || [c.chain_name,c.chain_id,c.operator_company,c.parent_company,c.brand_group,c.channel_type,c.retail_format_display_ja].some(v => norm(v).includes(q)));
    if (filter !== 'all') chains = chains.filter(c => statusClass(c) === filter);
    if (format !== 'all') chains = chains.filter(c => (c.retail_format_display_ja || c.channel_type) === format);
    if (source !== 'all') chains = chains.filter(c => sourceGroup(c) === source);
    chains.sort((a,b) => {
      if (sort === 'count_desc') return (countValue(b) || -1) - (countValue(a) || -1);
      if (sort === 'count_asc') return (countValue(a) ?? 999999999) - (countValue(b) ?? 999999999);
      if (sort === 'status') return statusClass(a).localeCompare(statusClass(b),'ja') || String(a.chain_name || '').localeCompare(String(b.chain_name || ''),'ja');
      return String(a.chain_name || '').localeCompare(String(b.chain_name || ''),'ja');
    });
    const totalMatched = chains.length;
    const shown = limit === 'all' ? chains : chains.slice(0, Number(limit));
    $('resultCount').textContent = `${fmt(shown.length)}件表示 / ${fmt(totalMatched)}件該当`;
    $('activeFilters').innerHTML = activeFilterText();
    if (!shown.length){ $('chainList').innerHTML = '<div class="empty">表示がありません。検索条件を変更してください。</div>'; return; }
    $('chainList').innerHTML = shown.map(c => {
      const count = c.store_count_normalized || c.store_count || c.ui_store_count_label || '-';
      const src = safeUrl(c.store_count_source_url || c.source_url || c.metadata_source_url || c.official_or_corporate_source_url || '');
      const st = statusClass(c);
      const badge = st === 'available' ? '店舗数あり' : st === 'review' ? '範囲確認' : '更新待ち';
      return `<article class="chain-card">
        <div class="chain-title"><h3>${text(c.chain_name)}</h3><span class="badge ${esc(st)}">${esc(badge)}</span></div>
        <div class="chain-details">
          <div class="field"><span>店舗数</span><strong>${fmt(count)}</strong></div>
          <div class="field"><span>時点</span><strong>${text(c.store_count_as_of || c.as_of_date || c.metadata_as_of)}</strong></div>
          <div class="field"><span>業態</span><strong>${text(c.retail_format_display_ja || c.channel_type)}</strong></div>
          <div class="field"><span>運営会社</span><strong>${text(c.operator_company || c.operator_local_name || c.operator)}</strong></div>
          <div class="field"><span>親会社</span><strong>${text(c.parent_company || c.brand_group)}</strong></div>
          <div class="field"><span>出典区分</span><strong>${text(c.store_count_source_type || c.source_type || c.metadata_source_type)}</strong></div>
          <div class="field"><span>更新状態</span><strong>${text(c.ui_store_count_status_label || c.store_count_status || c.auto_update_current_step)}</strong></div>
          <div class="field"><span>範囲</span><strong>${text(c.count_scope || c.market_scope)}</strong></div>
        </div>
        ${src ? `<a class="source-link" href="${esc(src)}" target="_blank" rel="noopener">出典を開く</a>` : ''}
      </article>`;
    }).join('');
  }
  function resetFilters(){
    $('chainSearch').value = '';
    $('countFilter').value = 'all';
    $('formatFilter').value = 'all';
    $('sourceTypeFilter').value = 'all';
    $('sortMode').value = 'name';
    $('limitMode').value = '50';
    renderCountry(true);
  }
  document.addEventListener('DOMContentLoaded', () => {
    initStats(); fillSelect(); fillQuickMarkets(); renderCountry(false);
    $('countrySearch').addEventListener('input', () => { fillSelect(); renderCountry(true); });
    $('countrySelect').addEventListener('change', () => renderCountry(true));
    ['chainSearch','countFilter','formatFilter','sourceTypeFilter','sortMode','limitMode'].forEach(id => $(id).addEventListener('input', () => renderCountry(false)));
    $('resetFilters').addEventListener('click', resetFilters);
  });
})();




// V232: Safe automatic version check for GitHub Pages / PWA cache drift.
const MARKET_BASE_APP_VERSION = 'MARKET_BASE_PUBLIC_DEPLOY_V233_COMPARE_DEFAULT_US_JP_20260705';
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

// V230: Cache refresh button for GitHub Pages / PWA cache drift.
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
    url.searchParams.set('v','233');
    url.searchParams.set('refresh',Date.now().toString());
    window.location.replace(url.toString());
    if(btn){ btn.disabled=false; btn.textContent=original || '更新'; }
  }
}

document.getElementById('cacheRefreshBtn')?.addEventListener('click', refreshMarketBaseCache);

try{ checkMarketBaseVersion(); }catch(_){ }
