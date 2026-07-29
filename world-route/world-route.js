(() => {
  'use strict';

  const data = window.WBR_DATA;
  if (!data) return;

  const tables = data.tables;
  const countries = [...tables.countries].sort((a, b) => a.display_order - b.display_order);
  const byCountry = Object.fromEntries(countries.map((item) => [item.country_id, item]));
  const routesByCountry = group(tables.routes, 'country_id');
  const portsByCountry = group(tables.ports, 'country_id');
  const lessonsByCountry = group(tables.lessons, 'country_id');
  const durationsByCountry = group(tables.durations, 'country_id');
  const pointsByRoute = group(tables.route_points, 'route_id');
  const sourcesById = Object.fromEntries(tables.sources.map((item) => [item.source_id, item]));
  const cards = data.route_cards;
  const regions = ['すべて', ...new Set(countries.map((item) => item.region))];
  const state = { countryId: 'TW', mode: 'representative', region: 'すべて', search: '' };

  function group(items, key) {
    return items.reduce((acc, item) => {
      (acc[item[key]] ||= []).push(item);
      return acc;
    }, {});
  }

  function el(selector, root = document) { return root.querySelector(selector); }
  function els(selector, root = document) { return [...root.querySelectorAll(selector)]; }
  const portNameMap = new Map(
    [...tables.ports, ...(tables.points || [])]
      .map((item) => [item.name_en, item.name_ja])
      .filter(([en, ja]) => en && ja)
  );
  const countryNameMap = new Map(countries.map((item) => [item.country_name_en, item.country_name_ja]).filter(([en]) => en));
  function replaceKnownNames(text) {
    let result = text;
    [...portNameMap, ...countryNameMap]
      .sort((a, b) => String(b[0]).length - String(a[0]).length)
      .forEach(([english, japanese]) => {
        const escaped = String(english).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(^|[^A-Za-z])${escaped}(?![A-Za-z])`, 'g');
        result = result.replace(pattern, (_, prefix) => `${prefix}${japanese}`);
      });
    return result;
  }
  function publicText(value = '') {
    let text = replaceKnownNames(String(value));
    const monthMap = {
      january: '1', february: '2', march: '3', april: '4', may: '5', june: '6',
      july: '7', august: '8', september: '9', october: '10', november: '11', december: '12'
    };
    text = text.replace(/Effective from\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
      (_, month, year) => `${year}年${monthMap[month.toLowerCase()]}月から適用`);
    text = text.replace(/operator naming on page should be rechecked in WORK\s*\d+/gi, '運営者名は公式ページで再確認する');
    text = text.replace(/latest PDFをWORK\s*\d+で再確認/gi, '最新版のPDFを再確認する');
    text = text.replace(/WORK\s*\d+\s*オンライン再確認[：:]?/gi, '');
    text = text.replace(/\bWORK\s*\d+\b/gi, '');
    text = text.replace(/\bSRC-[A-Z0-9-]+\b/g, '公式資料');

    const rules = [
      [/New Service\s*-\s*(?:Japan|日本)\s+(?:Taiwan|台湾)\s+Cat Lai\s*\(JTC\)/gi, '日本・台湾・カットライ新航路（JTC）'],
      [/(\d{4})\s+East Asia\s*-\s*Japan Service/gi, '$1年 東アジア・日本航路'],
      [/Port of (.+?)\s*-\s*Port Information/gi, '$1港の公式情報'],
      [/(.+?)\s*-\s*Port Information/gi, '$1の公式情報'],
      [/Port Information/gi, '港湾情報'],
      [/New Service/gi, '新航路'],
      [/Cat Lai/gi, 'カットライ'],
      [/North 中国/gi, '中国北部'],
      [/East 中国/gi, '中国東部'],
      [/South 中国/gi, '中国南部'],
      [/South East Asia|Southeast Asia/gi, '東南アジア'],
      [/East Asia/gi, '東アジア'],
      [/South America/gi, '南米'],
      [/North America/gi, '北米'],
      [/Middle East/gi, '中東'],
      [/Pacific Ocean/gi, '太平洋'],
      [/Atlantic Ocean/gi, '大西洋'],
      [/Indian Ocean/gi, 'インド洋'],
      [/Arabian Sea/gi, 'アラビア海'],
      [/Caribbean Sea/gi, 'カリブ海'],
      [/South Atlantic/gi, '南大西洋'],
      [/Red Sea/gi, '紅海'],
      [/Arabian Gulf/gi, 'アラビア湾'],
      [/Marmara Sea/gi, 'マルマラ海'],
      [/Aegean Sea/gi, 'エーゲ海'],
      [/Black Sea/gi, '黒海'],
      [/Bay of Bengal/gi, 'ベンガル湾'],
      [/Strait of Hormuz/gi, 'ホルムズ海峡'],
      [/Hormuz/gi, 'ホルムズ海峡'],
      [/Bab el-Mandeb/gi, 'バブ・エル・マンデブ海峡'],
      [/Suez Canal/gi, 'スエズ運河'],
      [/Suez transit suspension/gi, 'スエズ経由の一時停止'],
      [/trans-Suez/gi, 'スエズ経由'],
      [/Suez/gi, 'スエズ'],
      [/Cape of Good Hope/gi, '喜望峰'],
      [/Cape rerouting/gi, '喜望峰経由への変更'],
      [/Cape route/gi, '喜望峰経由'],
      [/\bCape\b/gi, '喜望峰'],
      [/Operational Rerouting/gi, '運航経路の変更'],
      [/Short-sea shipping/gi, '近距離海上輸送'],
      [/Rail gauge break/gi, '軌間変更'],
      [/Non contractual|non-contractual/gi, '非契約の参考値'],
      [/booking restriction/gi, '予約制限'],
      [/\bBooking\b/gi, '予約'],
      [/service code/gi, '航路サービス名'],
      [/dynamic service page/gi, '随時更新される航路案内ページ'],
      [/service update/gi, '航路の更新情報'],
      [/service PDF/gi, '航路資料（PDF）'],
      [/service page/gi, '航路案内ページ'],
      [/carrier service/gi, '船会社の航路'],
      [/current service/gi, '現在の航路'],
      [/\bservice\b/gi, '航路サービス'],
      [/\bcarrier\b/gi, '船会社'],
      [/vessel schedule/gi, '運航予定'],
      [/vessel\s*\/\s*voyage/gi, '本船・航海番号'],
      [/\bvessel\b/gi, '本船'],
      [/\bvoyage\b/gi, '航海番号'],
      [/\bschedule\b/gi, '運航予定'],
      [/port rotation/gi, '寄港順'],
      [/\brotation(?:s)?\b/gi, '寄港順'],
      [/\broute point\b/gi, '経由地点'],
      [/\ball-water route\b/gi, '全区間海上輸送'],
      [/\ball-water\b/gi, '全区間海上輸送'],
      [/\bLandbridge\b/gi, '大陸横断輸送'],
      [/\broute\b/gi, '航路'],
      [/\bcontainers\b/gi, 'コンテナ'],
      [/\bcontainer\b/gi, 'コンテナ'],
      [/\bsurcharge\b/gi, '追加料金'],
      [/Cut-off/gi, '搬入締切'],
      [/\bETA\b/g, '到着予定日'],
      [/\bETD\b/g, '出港予定日'],
      [/\bcall\b/gi, '寄港'],
      [/\bfeeder\b/gi, '接続船'],
      [/\bmainline\b/gi, '本船航路'],
      [/\btransshipment\b/gi, '積み替え'],
      [/on-dock\s*\/\s*near-dock rail/gi, '港内・港近接の鉄道'],
      [/\bon-dock\b/gi, '港内'],
      [/\bnear-dock\b/gi, '港近接'],
      [/\bdirect\b/gi, '直結'],
      [/\bRail Terminal\b/gi, '鉄道ターミナル'],
      [/\bon-dock rail\b/gi, '港内鉄道'],
      [/\bship-to-rail\b/gi, '船から鉄道への積み替え'],
      [/\bdirect rail access\b/gi, '鉄道へ直接接続'],
      [/\bterminals\b/gi, 'ターミナル'],
      [/\bterminal\b/gi, 'ターミナル'],
      [/\bintermodal\b/gi, '複合輸送'],
      [/\brail\b/gi, '鉄道'],
      [/\broad\b/gi, '道路'],
      [/\bcustoms\b/gi, '通関'],
      [/\bdelivery\b/gi, '配送'],
      [/\bdestination\b/gi, '最終目的地'],
      [/\bgateway\b/gi, '玄関港'],
      [/\bhub\b/gi, '中継拠点'],
      [/\bcurrent\b/gi, '現在の'],
      [/\blatest version\b/gi, '最新版'],
      [/\blatest\b/gi, '最新の'],
      [/\bactual\b/gi, '実際の'],
      [/\bsubject to change\b/gi, '変更される場合がある'],
      [/\bmust be checked\b/gi, '確認が必要'],
      [/\bshould be checked\b/gi, '確認が必要'],
      [/\bshould be rechecked\b/gi, '再確認する'],
      [/\bsource year\b/gi, '資料年'],
      [/\bweekly\b/gi, '週1便'],
      [/\bfixed-day\b/gi, '曜日固定'],
      [/\bexamples?\b/gi, '例'],
      [/\bupdate\b/gi, '更新'],
      [/\bproduct\b/gi, 'サービス資料'],
      [/\bmap\b/gi, '航路図'],
      [/\bconnections?\b/gi, '接続'],
      [/\baccess\b/gi, '接続'],
      [/\bhinterland\b/gi, '後背地'],
      [/\btruck\b/gi, 'トラック'],
      [/\bintegrated\b/gi, '統合された'],
      [/\bselection\b/gi, '選定'],
      [/\boperator\b/gi, '運営者'],
      [/\bnaming\b/gi, '名称'],
      [/\bFree Zone\b/gi, '自由貿易地域'],
      [/\bnetwork\b/gi, 'ネットワーク'],
      [/\bloop\b/gi, '周回航路'],
      [/\bDoor-to-Door\b/gi, '集荷から納品まで'],
      [/\bNorth China\b/gi, '中国北部'],
      [/\bEast China\b/gi, '中国東部'],
      [/\bSouth China\b/gi, '中国南部'],
      [/\bUS\b/g, '米国'],
      [/\bUSA\b/g, '米国'],
      [/Panama Canal/gi, 'パナマ運河'],
      [/\bPanama\b/gi, 'パナマ'],
      [/\bJapan\b/gi, '日本'],
      [/\bTaiwan\b/gi, '台湾'],
      [/\bChina\b/gi, '中国'],
      [/\bKorea\b/gi, '韓国'],
      [/\bAustralia\b/gi, 'オーストラリア'],
      [/\bBrazil\b/gi, 'ブラジル'],
      [/\bCanada\b/gi, 'カナダ'],
      [/\bIndia\b/gi, 'インド'],
      [/\bIndonesia\b/gi, 'インドネシア'],
      [/\bSingapore\b/gi, 'シンガポール'],
      [/\bThailand\b/gi, 'タイ'],
      [/\bVietnam\b/gi, 'ベトナム'],
      [/\bSaudi\b/gi, 'サウジアラビア'],
      [/\bUAE\b/g, 'アラブ首長国連邦'],
      [/\bNorth Europe\b/gi, '北欧州'],
      [/\bEurope\b/gi, '欧州'],
      [/\bAsia\b/gi, 'アジア'],
      [/\bUS Midwest\b/gi, '米国中西部'],
      [/\bMidwest\b/gi, '中西部'],
      [/\bWest Coast\b/gi, '西岸'],
      [/\bEast Coast\b/gi, '東岸'],
      [/\bSouth Africa\b/gi, '南アフリカ'],
      [/太平洋\s+Ocean/gi, '太平洋'],
      [/\bPacific\b/gi, '太平洋'],
      [/\bGulf\b/gi, '湾岸地域'],
      [/\bpurpose-built\b/gi, '専用設計'],
      [/\byards\b/gi, 'ヤード'],
      [/\balternative\b/gi, '代替経路'],
      [/\band\b/gi, '・'],
      [/\bvia\b/gi, '経由'],
      [/\bto\b/gi, 'から'],
      [/\bor\b/gi, 'または'],
      [/\bofficial\b/gi, '公式'],
      [/\bpage\b/gi, '案内ページ'],
      [/\bPDF\b/g, 'PDF'],
      [/\bOcean\b/gi, '海洋'],
      [/\s*\/\s*/g, '・'],
      [/・{2,}/g, '・'],
      [/\s{2,}/g, ' ']
    ];
    rules.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); });
    return text.replace(/^[・：\s]+|[・：\s]+$/g, '').trim();
  }
  function escapeDisplay(value = '') { return escapeHtml(publicText(value)); }
  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[ch]);
  }
  function short(value = '', max = 44) {
    const text = String(value);
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }
  function hasLooseEnglish(value = '') {
    return /[A-Z]?[a-z]{2,}/.test(String(value)) || /(?:WORK\s*\d+|SRC-[A-Z0-9-]+)/i.test(String(value));
  }
  function isInternalSource(source = {}) {
    return /内部|internal derived|構造監査|内部派生/i.test([
      source.title, source.publisher, source.source_type, source.primary_source_status
    ].filter(Boolean).join(' '));
  }
  function sourceTypeDisplay(source = {}) {
    const converted = publicText(source.source_type || '公式資料');
    if (!hasLooseEnglish(converted)) return converted;
    const raw = String(source.source_type || '');
    if (/船会社/.test(raw)) return '船会社の公式資料';
    if (/港湾|港|ターミナル/.test(raw)) return '港湾の公式資料';
    if (/税関|政府|省|当局/.test(raw)) return '政府・税関の公式資料';
    if (/鉄道/.test(raw)) return '鉄道事業者の公式資料';
    return '公式資料';
  }
  function sourceTargetDisplay(source = {}) {
    const converted = publicText(source.target || '');
    return converted && !hasLooseEnglish(converted) ? converted : '';
  }
  function sourceDisplayTitle(source = {}) {
    const converted = publicText(source.title || source.publisher || '公式資料');
    if (!hasLooseEnglish(converted)) return converted;
    const type = sourceTypeDisplay(source);
    const target = sourceTargetDisplay(source);
    return target ? `${type}｜${short(target, 34)}` : type;
  }
  function sourceVerifiedDisplay(source = {}) {
    const converted = publicText(source.verified_item || '');
    if (converted && !hasLooseEnglish(converted)) return converted;
    const target = sourceTargetDisplay(source);
    return target ? `${target}に関する公式情報` : '航路・港湾・輸送条件に関する公式情報';
  }
  function sourceNoteDisplay(source = {}) {
    const converted = publicText(source.notes || '');
    if (!converted) return '';
    if (hasLooseEnglish(converted)) return '内容は更新されるため、利用時に最新の公式資料を確認してください。';
    return converted;
  }
  function getCountry() { return byCountry[state.countryId] || countries[0]; }
  function currentIndex() { return countries.findIndex((item) => item.country_id === state.countryId); }
  function switchTab(name) {
    const button = el(`[data-mbx-tab="${name}"]`);
    if (button) button.click();
  }
  function countryName(id) { return byCountry[id]?.country_name_ja || id; }
  function formatDate(value) { return value || '未設定'; }
  function formatInformationClass(value) {
    const labels = {
      guidance: '参考値',
      verify_before_shipping: '出荷前確認',
      reference: '基礎情報'
    };
    return labels[value] || value || '参考情報';
  }
  function routeModeLabel() { return state.mode === 'representative' ? '代表ルート' : '別ルート'; }

  function updateUrl() {
    const url = new URL(location.href);
    url.searchParams.set('country', state.countryId);
    url.searchParams.set('mode', state.mode);
    try { history.replaceState(null, '', url); } catch (_) { /* URL更新不可でも画面操作は継続 */ }
  }

  function activeRouteIds(countryId) {
    const card = cards[countryId] || {};
    const key = state.mode === 'representative' ? 'representative_route_ids' : 'alternate_route_ids';
    const ids = Array.isArray(card[key]) ? card[key] : [];
    if (ids.length) return ids;
    const allRows = routesByCountry[countryId] || [];
    if (state.mode === 'alternate') {
      return allRows.filter((row) => ['代替', '特殊', '陸上接続'].includes(row.route_type)).map((row) => row.route_id);
    }
    return allRows.filter((row) => row.route_type === '標準').map((row) => row.route_id);
  }

  function sourceLinkList(ids = []) {
    const rows = ids.map((id) => sourcesById[id]).filter((source) => source && !isInternalSource(source));
    if (!rows.length) return '';
    return `<div class="wbr-inline-sources">${rows.map((source) => (
      source.url
        ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceDisplayTitle(source))}</a>`
        : `<span>${escapeHtml(sourceDisplayTitle(source))}</span>`
    )).join('')}</div>`;
  }

  function durationExample(rows = []) {
    const priority = { '港から港': 0, '総日数': 1, '鉄道区間': 2, '内陸区間': 3 };
    const candidates = rows.filter((item) => item.min_days !== null && item.min_days !== '' && item.max_days !== null && item.max_days !== '')
      .sort((a, b) => (priority[a.duration_type] ?? 9) - (priority[b.duration_type] ?? 9));
    const item = candidates[0];
    if (!item) return '固定値なし';
    const value = Number(item.min_days) === Number(item.max_days) ? `${item.min_days}日` : `${item.min_days}〜${item.max_days}日`;
    return `${value}（${publicText(item.duration_type || '参考')}）`;
  }

  function renderQuickRoute(activeRoutes, durations) {
    const route = activeRoutes[0];
    const connection = route?.direct_or_transshipment || getCountry().direct_or_transshipment || '出荷前に確認';
    el('[data-wbr-connection]').textContent = short(publicText(connection), 34);
    el('[data-wbr-duration-example]').textContent = durationExample(durations);

    const flowTitle = el('[data-wbr-flow-title]');
    const flowRoot = el('[data-wbr-flow]');
    const flowNote = el('[data-wbr-flow-note]');
    if (!route) {
      flowTitle.textContent = 'この表示モードの経路は未設定';
      flowRoot.innerHTML = '<span class="wbr-route-flow-chip">経路詳細で確認</span>';
      flowNote.textContent = '船会社・サービス・出港日によって実際の経路は変わります。';
      return;
    }
    const pointRows = (pointsByRoute[route.route_id] || []).sort((a, b) => a.sequence - b.sequence);
    const labels = pointRows.map((item) => item.label).filter(Boolean);
    flowTitle.textContent = short(publicText(route.route_name), 48);
    flowRoot.innerHTML = labels.length
      ? labels.map((label, index) => `${index ? '<span class="wbr-route-flow-arrow" aria-hidden="true">→</span>' : ''}<span class="wbr-route-flow-chip">${escapeDisplay(label)}</span>`).join('')
      : '<span class="wbr-route-flow-chip">経由地点は経路詳細で確認</span>';
    flowNote.textContent = activeRoutes.length > 1
      ? `表示中の先頭ルートです。ほか${activeRoutes.length - 1}ルートは「経路詳細」で比較できます。`
      : '実際の寄港順・積み替え・搬入締切は予約前に確認してください。';
  }

  function renderCountry() {
    const country = getCountry();
    const allRoutes = routesByCountry[country.country_id] || [];
    const activeIds = activeRouteIds(country.country_id);
    const activeRoutes = activeIds.map((id) => allRoutes.find((route) => route.route_id === id)).filter(Boolean);
    const ports = portsByCountry[country.country_id] || [];
    const lessons = lessonsByCountry[country.country_id] || [];
    const allDurations = durationsByCountry[country.country_id] || [];
    const durations = allDurations.filter((item) => !item.route_id || activeIds.includes(item.route_id));
    const card = cards[country.country_id];
    const imagePath = card?.[state.mode] || '';
    const modeLabel = routeModeLabel();

    el('[data-wbr-current-code]').textContent = country.country_id;
    el('[data-wbr-current-country]').textContent = country.country_name_ja;
    el('[data-wbr-hero-code]').textContent = country.country_id;
    el('[data-wbr-region]').textContent = country.region;
    el('[data-wbr-title]').textContent = publicText(country.title);
    el('[data-wbr-theme]').textContent = publicText(`${country.main_theme}｜${country.sub_theme}`);
    el('[data-wbr-verified]').textContent = country.last_verified || '確認日未設定';
    el('[data-wbr-basis-date]').textContent = country.last_verified || data.metadata.release_date || '未設定';
    el('[data-wbr-image-label]').textContent = modeLabel;

    const image = el('[data-wbr-route-image]');
    image.src = imagePath;
    image.alt = `${publicText(country.title)}の${modeLabel}図`;
    const lightboxImage = el('[data-wbr-lightbox-image]');
    lightboxImage.src = imagePath;
    lightboxImage.alt = image.alt;

    el('[data-wbr-position]').textContent = currentIndex() + 1;
    el('[data-wbr-summary-title]').textContent = publicText(country.title);
    el('[data-wbr-overview]').textContent = publicText(country.overview);
    el('[data-wbr-transport]').textContent = short(publicText(country.transport_type), 38);
    el('[data-wbr-main-theme]').textContent = publicText(country.main_theme);
    el('[data-wbr-route-count]').textContent = `現在${activeRoutes.length}経路・全${allRoutes.length}経路`;
    el('[data-wbr-port-count]').textContent = `${ports.length}港`;
    el('[data-wbr-route-short]').textContent = short(
      publicText(state.mode === 'representative' ? country.primary_route_summary : country.alternative_route_summary),
      34
    );
    el('[data-wbr-after-short]').textContent = short(publicText(country.after_arrival_summary), 32);
    el('[data-wbr-direct]').textContent = publicText(country.direct_or_transshipment);
    el('[data-wbr-after]').textContent = publicText(country.after_arrival_summary);
    renderQuickRoute(activeRoutes, durations);

    renderRoutes(activeRoutes);
    renderPorts(ports);
    renderDurations(durations, country);
    renderLessons(lessons);
    renderSources(country, activeRoutes, durations, lessons);
    renderRelated(country.related_country_ids || []);


    const riskRows = tables.route_risk_context || [];
    const riskRelevant = riskRows.some((row) => (row.related_country_ids || []).includes(country.country_id));
    const riskNotice = el('[data-wbr-risk-country]');
    if (riskNotice) {
      riskNotice.hidden = !riskRelevant;
      if (riskRelevant) {
        const directRisk = riskRows.filter((row) => (row.related_country_ids || []).includes(country.country_id) && ['geography', 'mechanism', 'impact'].includes(row.category));
        el('[data-wbr-risk-country-text]').textContent = directRisk.length
          ? `${directRisk.map((row) => publicText(row.title)).slice(0, 3).join('・')}を確認してください。船会社・航路サービス・出港日によって実際の経路は変わります。`
          : '船会社・航路サービス・出港日によって実際の経路は変わります。';
      }
    }

    els('[data-wbr-mode]').forEach((button) => {
      const active = button.dataset.wbrMode === state.mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    els('.wbr-dialog-country-button').forEach((button) => {
      button.classList.toggle('is-current', button.dataset.countryId === country.country_id);
    });
    updateUrl();
  }

  function renderRoutes(rows) {
    const root = el('[data-wbr-route-list]');
    root.innerHTML = rows.map((route) => {
      const pointRows = (pointsByRoute[route.route_id] || []).sort((a, b) => a.sequence - b.sequence);
      const points = pointRows.map((item) => `<span class="wbr-point-chip">${escapeDisplay(item.label)}</span>`).join('');
      const alt = ['代替', '特殊', '陸上接続'].includes(route.route_type);
      const metadata = [
        route.service_code ? `航路名：${route.service_code}` : '',
        route.direct_or_transshipment ? `接続：${route.direct_or_transshipment}` : '',
        route.route_basis ? `確認資料：${route.route_basis}` : '',
        route.validity_note ? `利用時の注意：${route.validity_note}` : ''
      ].filter(Boolean);
      return `<article class="wbr-route-row">
        <div class="wbr-row-top">
          <span class="wbr-row-badge ${alt ? 'is-alt' : ''}">${escapeDisplay(route.route_type)}</span>
          <h4>${escapeDisplay(route.route_name)}</h4>
        </div>
        <p>${escapeDisplay(route.description)}</p>
        ${metadata.length ? `<dl class="wbr-metadata-list">${metadata.map((item) => `<div><dt>${escapeHtml(item.split('：')[0])}</dt><dd>${escapeDisplay(item.slice(item.indexOf('：') + 1))}</dd></div>`).join('')}</dl>` : ''}
        <div class="wbr-point-line">${points || '<span class="wbr-point-chip is-empty">経由地点は本文で確認</span>'}</div>
        ${sourceLinkList(route.source_ids || [])}
      </article>`;
    }).join('') || '<p>この表示モードに対応するルート情報はありません。</p>';
  }

  function renderPorts(rows) {
    el('[data-wbr-port-list]').innerHTML = rows.map((port) => `<article class="wbr-port-card">
      <strong>${escapeDisplay(port.name_ja)} <small>${escapeDisplay(port.name_en)}</small></strong>
      <span>${escapeDisplay(port.port_role)}｜${escapeDisplay(port.main_regions || '地域情報は出荷前に確認')}</span>
      ${sourceLinkList(port.source_ids || [])}
    </article>`).join('') || '<p>港情報はありません。</p>';
  }

  function renderDurations(rows, country) {
    el('[data-wbr-duration-list]').innerHTML = rows.map((item) => {
      let value = '出荷前に確認';
      if (item.min_days !== null && item.min_days !== '' && item.max_days !== null && item.max_days !== '') {
        value = Number(item.min_days) === Number(item.max_days)
          ? `${item.min_days}日`
          : `${item.min_days}〜${item.max_days}日`;
      }
      const warning = item.information_class === 'verify_before_shipping' || /未確定|非契約|出荷前/i.test(`${item.confidence || ''} ${item.scope || ''} ${item.note || ''}`)
        ? '出荷前確認'
        : '非契約の参考値';
      return `<article class="wbr-duration-row">
        <div class="wbr-row-top">
          <span class="wbr-duration-value">${escapeHtml(value)}</span>
          <span class="wbr-duration-warning">${escapeHtml(warning)}</span>
          <span class="wbr-duration-meta">${escapeDisplay(item.duration_type)}</span>
        </div>
        <p><strong>${escapeDisplay(item.origin)} → ${escapeDisplay(item.destination)}</strong></p>
        <dl class="wbr-metadata-list">
          <div><dt>船会社・航路</dt><dd>${escapeDisplay(item.service_type || '個別確認')}</dd></div>
          <div><dt>基準日</dt><dd>${escapeHtml(formatDate(item.reference_date || country.last_verified))}</dd></div>
          <div><dt>情報区分</dt><dd>${escapeDisplay(`${formatInformationClass(item.information_class)}${item.confidence ? `／${item.confidence}` : ''}`)}</dd></div>
          <div><dt>対象範囲</dt><dd>${escapeDisplay(item.scope || '対象区間を出荷前に確認')}</dd></div>
        </dl>
        <p>${escapeDisplay(item.note || '船便・通関・配送条件で変動します。')}</p>
        ${sourceLinkList(item.source_ids || [])}
      </article>`;
    }).join('') || '<p>固定日数は表示していません。実際の船便・カットオフ・通関条件で確認してください。</p>';
  }

  function renderLessons(rows) {
    el('[data-wbr-lesson-list]').innerHTML = rows
      .sort((a, b) => a.display_order - b.display_order)
      .map((item) => `<article class="wbr-lesson-row">
        <h4>${escapeDisplay(item.title)}</h4>
        <p>${escapeDisplay(item.body)}</p>
        ${sourceLinkList(item.source_ids || [])}
      </article>`).join('') || '<p>学習項目はありません。</p>';
  }

  function renderSources(country, activeRoutes, durations, lessons) {
    const ids = new Set(country.source_ids || []);
    activeRoutes.forEach((route) => (route.source_ids || []).forEach((id) => ids.add(id)));
    durations.forEach((duration) => (duration.source_ids || []).forEach((id) => ids.add(id)));
    lessons.forEach((lesson) => (lesson.source_ids || []).forEach((id) => ids.add(id)));
    const rows = [...ids].map((id) => sourcesById[id]).filter((source) => source && !isInternalSource(source));
    el('[data-wbr-source-list]').innerHTML = rows.map((source) => `<article class="wbr-source-row">
      <div class="wbr-row-top">
        <span class="wbr-row-badge">${escapeHtml(sourceTypeDisplay(source))}</span>
        <h4>${escapeHtml(sourceDisplayTitle(source))}</h4>
      </div>
      <dl class="wbr-metadata-list">
        <div><dt>発行元</dt><dd>${escapeHtml(source.publisher || '未設定')}</dd></div>
        <div><dt>確認項目</dt><dd>${escapeHtml(sourceVerifiedDisplay(source))}</dd></div>
        <div><dt>発行・更新</dt><dd>${escapeHtml(formatDate(source.published_or_revised))}</dd></div>
        <div><dt>確認日</dt><dd>${escapeHtml(formatDate(source.verified_date || country.last_verified))}</dd></div>
        <div><dt>資料の種類</dt><dd>${escapeDisplay(source.primary_source_status || '要確認')}</dd></div>
        <div><dt>利用時の確認</dt><dd>${escapeDisplay(source.validity || '要確認')}</dd></div>
      </dl>
      ${sourceNoteDisplay(source) ? `<div class="wbr-source-note"><strong>利用時の注意</strong><p>${escapeHtml(sourceNoteDisplay(source))}</p></div>` : ''}
      ${source.url ? `<p><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">公式資料を開く</a></p>` : ''}
    </article>`).join('') || '<p>出典情報はありません。</p>';
  }

  function renderRelated(ids) {
    el('[data-wbr-related-list]').innerHTML = ids.map((id) => {
      const country = byCountry[id];
      if (!country) return '';
      return `<button class="wbr-related-button" type="button" data-country-id="${id}">
        <span><strong>${escapeDisplay(country.country_name_ja)}</strong><small>${escapeDisplay(country.main_theme)}</small></span>
      </button>`;
    }).join('') || '<p>関連国はありません。</p>';
    els('.wbr-related-button').forEach((button) => button.addEventListener('click', () => selectCountry(button.dataset.countryId, true)));
  }

  function renderRegionChips() {
    el('[data-wbr-region-chips]').innerHTML = regions.map((region) => `<button type="button" class="wbr-region-chip ${region === state.region ? 'is-active' : ''}" data-region="${escapeHtml(region)}">${escapeHtml(region)}</button>`).join('');
    els('[data-region]').forEach((button) => button.addEventListener('click', () => {
      state.region = button.dataset.region;
      renderRegionChips();
      renderCountryGrid();
    }));
  }

  function filteredCountries(search = state.search) {
    const query = search.trim().toLowerCase();
    return countries.filter((country) => {
      const regionOk = state.region === 'すべて' || country.region === state.region;
      const haystack = [country.country_name_ja, country.country_name_en, country.region, country.main_theme, country.sub_theme, country.country_id].join(' ').toLowerCase();
      return regionOk && (!query || haystack.includes(query));
    });
  }

  function renderCountryGrid() {
    const rows = filteredCountries();
    el('[data-wbr-list-count]').textContent = `${rows.length}カ国・地域`;
    el('[data-wbr-country-grid]').innerHTML = rows.map((country) => `<button type="button" class="wbr-country-card" data-country-id="${country.country_id}">
      <span class="wbr-country-card-code">${country.country_id}</span>
      <span><span class="wbr-country-card-region">${escapeDisplay(country.region)}</span><h3>${escapeDisplay(country.country_name_ja)}</h3><p>${escapeDisplay(country.main_theme)}｜${escapeDisplay(country.sub_theme)}</p></span>
      <span class="wbr-country-card-arrow">›</span>
    </button>`).join('') || '<div class="mbx-info">条件に合う国・地域はありません。</div>';
    els('.wbr-country-card').forEach((button) => button.addEventListener('click', () => selectCountry(button.dataset.countryId, true)));
  }

  function renderDialogCountries(search = '') {
    const query = search.trim().toLowerCase();
    const matching = countries.filter((country) => !query || [country.country_name_ja, country.country_name_en, country.country_id].join(' ').toLowerCase().includes(query));
    const grouped = matching.reduce((acc, country) => {
      (acc[country.region] ||= []).push(country);
      return acc;
    }, {});
    el('[data-wbr-dialog-country-list]').innerHTML = Object.entries(grouped).map(([region, rows]) => `<section class="wbr-dialog-region">
      <h3>${escapeHtml(region)}</h3>
      <div class="wbr-dialog-region-grid">${rows.map((country) => `<button type="button" class="wbr-dialog-country-button ${country.country_id === state.countryId ? 'is-current' : ''}" data-country-id="${country.country_id}"><span>${country.country_id}</span><strong>${escapeDisplay(country.country_name_ja)}</strong></button>`).join('')}</div>
    </section>`).join('');
    els('.wbr-dialog-country-button').forEach((button) => button.addEventListener('click', () => {
      selectCountry(button.dataset.countryId, true);
      el('[data-wbr-country-dialog]').close();
    }));
  }


  function renderRiskContext() {
    const rows = [...(tables.route_risk_context || [])].sort((a, b) => a.display_order - b.display_order);
    const category = (name) => rows.filter((row) => row.category === name);
    const renderCard = (row) => `<article class="wbr-risk-card is-${escapeHtml(row.severity || 'info')}">
      <span class="wbr-risk-card-no">${String(row.display_order).padStart(2, '0')}</span>
      <h4>${escapeDisplay(row.title)}</h4>
      <p>${escapeDisplay(row.body)}</p>
      <div class="wbr-risk-card-meta"><span>確認日 ${escapeHtml(formatDate(row.last_verified))}</span></div>
      ${sourceLinkList(row.source_ids || [])}
    </article>`;

    const geography = el('[data-wbr-risk-geography]');
    const mechanism = el('[data-wbr-risk-mechanism]');
    const examples = el('[data-wbr-risk-examples]');
    const checklist = el('[data-wbr-risk-checklist]');

    if (geography) geography.innerHTML = category('geography').map(renderCard).join('');
    if (mechanism) mechanism.innerHTML = [...category('mechanism'), ...category('impact')].map(renderCard).join('');
    if (examples) examples.innerHTML = category('carrier_example').map((row) => `<article class="wbr-risk-example">
      <div class="wbr-risk-example-head"><span>${escapeDisplay(row.title)}</span><strong>${escapeHtml(formatDate(row.last_verified))}</strong></div>
      <p>${escapeDisplay(row.body)}</p>
      ${sourceLinkList(row.source_ids || [])}
    </article>`).join('');
    if (checklist) checklist.innerHTML = category('verification').map((row, index) => `<li>
      <span>${index + 1}</span><div><strong>${escapeDisplay(row.title)}</strong><p>${escapeDisplay(row.body)}</p>${sourceLinkList(row.source_ids || [])}</div>
    </li>`).join('');
  }

  function renderLearn() {
    renderRiskContext();
    el('[data-wbr-family-grid]').innerHTML = tables.route_families.map((family, index) => `<article class="wbr-family-card">
      <span class="wbr-family-no">${String(index + 1).padStart(2, '0')}</span><h3>${escapeDisplay(family.route_family_name)}</h3><p>${escapeDisplay(family.learning_focus)}</p>
      <div class="wbr-family-countries">${(family.country_ids || []).map((id) => `<button type="button" data-country-id="${id}">${escapeHtml(countryName(id))}</button>`).join('')}</div>
    </article>`).join('');
    el('[data-wbr-shared-grid]').innerHTML = tables.shared_points.map((item) => `<article class="wbr-shared-card">
      <span class="wbr-family-no">${escapeHtml(item.point_id.replace('PT-', ''))}</span><h3>${escapeDisplay(item.point_name)}</h3><p>${escapeDisplay(item.shared_reason)}</p>
      <div class="wbr-family-countries">${(item.country_ids || []).slice(0, 6).map((id) => `<button type="button" data-country-id="${id}">${escapeHtml(countryName(id))}</button>`).join('')}</div>
    </article>`).join('');
    el('[data-wbr-common-count]').textContent = `${tables.common_lessons.length}件すべて表示`;
    el('[data-wbr-common-list]').innerHTML = tables.common_lessons.map((item) => `<details class="wbr-common-item">
      <summary>${escapeDisplay(item.title)}</summary>
      <div class="wbr-common-body">
        <p>${escapeDisplay(item.body)}</p>
        ${item.formal_topic ? `<dl class="wbr-metadata-list"><div><dt>正式な用語</dt><dd>${escapeDisplay(item.formal_topic)}</dd></div><div><dt>実務で使う場面</dt><dd>${escapeDisplay(item.practical_use || item.learning_reason || '')}</dd></div><div><dt>確認日</dt><dd>${escapeHtml(formatDate(item.last_verified))}</dd></div></dl>` : ''}
        ${sourceLinkList(item.source_ids || [])}
      </div>
    </details>`).join('');
    els('.wbr-family-countries button').forEach((button) => button.addEventListener('click', () => selectCountry(button.dataset.countryId, true)));
  }

  function selectCountry(id, goRoute = false) {
    if (!byCountry[id]) return;
    state.countryId = id;
    renderCountry();
    renderDialogCountries(el('[data-wbr-dialog-search]').value || '');
    if (goRoute) {
      switchTab('route');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  function moveCountry(step) {
    const next = (currentIndex() + step + countries.length) % countries.length;
    selectCountry(countries[next].country_id);
  }
  function setMode(mode) {
    if (!['representative', 'alternate'].includes(mode)) return;
    state.mode = mode;
    renderCountry();
  }

  function bind() {
    els('[data-wbr-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.wbrMode)));
    el('[data-wbr-prev]').addEventListener('click', () => moveCountry(-1));
    el('[data-wbr-next]').addEventListener('click', () => moveCountry(1));
    el('[data-wbr-image-open]').addEventListener('click', () => el('[data-wbr-lightbox]').showModal());
    el('[data-wbr-lightbox-close]').addEventListener('click', () => el('[data-wbr-lightbox]').close());
    el('[data-wbr-lightbox]').addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
    el('[data-wbr-country-dialog-open]').addEventListener('click', () => el('[data-wbr-country-dialog]').showModal());
    el('[data-wbr-country-dialog-close]').addEventListener('click', () => el('[data-wbr-country-dialog]').close());
    el('[data-wbr-country-dialog]').addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
    el('[data-wbr-dialog-search]').addEventListener('input', (event) => renderDialogCountries(event.target.value));
    el('[data-wbr-search]').addEventListener('input', (event) => { state.search = event.target.value; renderCountryGrid(); });
    el('[data-wbr-risk-learn]')?.addEventListener('click', () => {
      switchTab('learn');
      requestAnimationFrame(() => el('#wbr-middle-east-context')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });
    els('[data-wbr-open-detail]').forEach((button) => button.addEventListener('click', () => {
      const selector = {
        route: '[data-wbr-route-detail]',
        duration: '[data-wbr-duration-detail]',
        arrival: '[data-wbr-arrival-detail]'
      }[button.dataset.wbrOpenDetail];
      const detail = selector ? el(selector) : null;
      if (!detail) return;
      detail.open = true;
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    el('[data-wbr-source-jump]').addEventListener('click', () => {
      const detail = el('[data-wbr-source-detail]');
      detail.open = true;
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const topButton = el('[data-wbr-page-top]');
    if (topButton) {
      window.addEventListener('scroll', () => topButton.classList.toggle('is-visible', scrollY > 500), { passive: true });
      topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' && !event.target.matches('input,textarea')) moveCountry(-1);
      if (event.key === 'ArrowRight' && !event.target.matches('input,textarea')) moveCountry(1);
    });
  }

  function init() {
    const url = new URL(location.href);
    const requested = url.searchParams.get('country');
    const mode = url.searchParams.get('mode');
    if (byCountry[requested]) state.countryId = requested;
    if (['representative', 'alternate'].includes(mode)) state.mode = mode;

    renderRegionChips();
    renderCountryGrid();
    renderDialogCountries();
    renderLearn();
    bind();
    renderCountry();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
