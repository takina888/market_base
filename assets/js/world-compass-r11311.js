(() => {
  'use strict';

  const FLAG_BASE = 'assets/flags/';
  const FLAG_SVG_DATA = window.MARKET_BASE_FLAG_SVG_DATA || {};
  const countryCapitals = Array.isArray(window.MB_COUNTRY_CAPITALS) ? window.MB_COUNTRY_CAPITALS : [];
  const countryByCode = new Map(countryCapitals.map(country => [country.code, country]));
  const locations = [
    {id:'aichi', category:'cities', nameJa:'愛知', nameEn:'AICHI, JAPAN', country:'日本', flag:'jp', lat:35.1815, lon:136.9066, description:'愛知県・名古屋市中心部', tags:'名古屋 日本 初期地点'},
    {id:'north', category:'direction', nameJa:'北', nameEn:'NORTH', country:'基準方位', special:'north', description:'真北を示す標準方位', tags:'北 真北 方位', isDirectionOnly:true},
    {id:'mecca', category:'sacred', nameJa:'メッカ', nameEn:'QIBLA / MECCA', country:'サウジアラビア', special:'kaaba', lat:21.4225, lon:39.8262, description:'カアバ神殿の方向（キブラ）', tags:'キブラ カアバ イスラム'},
    {id:'shanghai', category:'cities', nameJa:'上海', nameEn:'SHANGHAI', country:'中国', flag:'cn', lat:31.2304, lon:121.4737, description:'中国・上海市', tags:'中国 華東'},
    {id:'taipei', category:'cities', nameJa:'台北', nameEn:'TAIPEI', country:'台湾', flag:'tw', lat:25.0330, lon:121.5654, description:'台湾・台北市', tags:'台湾'},
    {id:'tokyo', category:'cities', nameJa:'東京', nameEn:'TOKYO', country:'日本', flag:'jp', lat:35.6762, lon:139.6503, description:'日本・東京都', tags:'日本 関東'},
    {id:'beijing', category:'cities', nameJa:'北京', nameEn:'BEIJING', country:'中国', flag:'cn', lat:39.9042, lon:116.4074, description:'中国・北京市', tags:'中国'},
    {id:'guangzhou', category:'cities', nameJa:'広州', nameEn:'GUANGZHOU', country:'中国', flag:'cn', lat:23.1291, lon:113.2644, description:'中国・広東省', tags:'中国 華南'},
    {id:'shenzhen', category:'cities', nameJa:'深圳', nameEn:'SHENZHEN', country:'中国', flag:'cn', lat:22.5431, lon:114.0579, description:'中国・広東省', tags:'中国 華南'},
    {id:'hongkong', category:'cities', nameJa:'香港', nameEn:'HONG KONG', country:'香港', flag:'hk', lat:22.3193, lon:114.1694, description:'香港', tags:'中国'},
    {id:'kaohsiung', category:'cities', nameJa:'高雄', nameEn:'KAOHSIUNG', country:'台湾', flag:'tw', lat:22.6273, lon:120.3014, description:'台湾・高雄市', tags:'台湾'},
    {id:'seoul', category:'cities', nameJa:'ソウル', nameEn:'SEOUL', country:'韓国', flag:'kr', lat:37.5665, lon:126.9780, description:'韓国・ソウル特別市', tags:'韓国'},
    {id:'singapore', category:'cities', nameJa:'シンガポール', nameEn:'SINGAPORE', country:'シンガポール', flag:'sg', lat:1.3521, lon:103.8198, description:'シンガポール', tags:'東南アジア'},
    {id:'bangkok', category:'cities', nameJa:'バンコク', nameEn:'BANGKOK', country:'タイ', flag:'th', lat:13.7563, lon:100.5018, description:'タイ・バンコク', tags:'タイ 東南アジア'},
    {id:'london', category:'cities', nameJa:'ロンドン', nameEn:'LONDON', country:'イギリス', flag:'gb', lat:51.5072, lon:-0.1276, description:'イギリス・ロンドン', tags:'欧州'},
    {id:'paris', category:'cities', nameJa:'パリ', nameEn:'PARIS', country:'フランス', flag:'fr', lat:48.8566, lon:2.3522, description:'フランス・パリ', tags:'欧州'},
    {id:'newyork', category:'cities', nameJa:'ニューヨーク', nameEn:'NEW YORK', country:'アメリカ', flag:'us', lat:40.7128, lon:-74.0060, description:'アメリカ・ニューヨーク', tags:'北米'},
    {id:'dubai', category:'cities', nameJa:'ドバイ', nameEn:'DUBAI', country:'アラブ首長国連邦', flag:'ae', lat:25.2048, lon:55.2708, description:'アラブ首長国連邦・ドバイ', tags:'中東'},
    {id:'machupicchu', category:'mystic', nameJa:'マチュピチュ', nameEn:'MACHU PICCHU', country:'ペルー', flag:'pe', lat:-13.1631, lon:-72.5450, description:'アンデス山中に残るインカ帝国の都市遺跡', tags:'遺跡 世界遺産 神秘'},
    {id:'uyuni', category:'mystic', nameJa:'ウユニ塩湖', nameEn:'SALAR DE UYUNI', country:'ボリビア', flag:'bo', lat:-20.1338, lon:-67.4891, description:'空を映す世界最大級の塩原', tags:'絶景 塩湖'},
    {id:'giza', category:'mystic', nameJa:'ギザのピラミッド', nameEn:'GIZA PYRAMIDS', country:'エジプト', flag:'eg', lat:29.9792, lon:31.1342, description:'古代エジプトを象徴する巨大建造物群', tags:'古代 遺跡 ピラミッド'},
    {id:'stonehenge', category:'mystic', nameJa:'ストーンヘンジ', nameEn:'STONEHENGE', country:'イギリス', flag:'gb', lat:51.1789, lon:-1.8262, description:'英国平原に立つ先史時代の環状列石', tags:'遺跡 神秘'},
    {id:'angkor', category:'mystic', nameJa:'アンコール・ワット', nameEn:'ANGKOR WAT', country:'カンボジア', flag:'kh', lat:13.4125, lon:103.8670, description:'森と水に囲まれたクメール建築の大寺院', tags:'遺跡 世界遺産'},
    {id:'petra', category:'mystic', nameJa:'ペトラ遺跡', nameEn:'PETRA', country:'ヨルダン', flag:'jo', lat:30.3285, lon:35.4444, description:'岩山を削り出して築かれた古代都市', tags:'遺跡 世界遺産'},
    {id:'easter', category:'mystic', nameJa:'イースター島', nameEn:'EASTER ISLAND', country:'チリ', flag:'cl', lat:-27.1127, lon:-109.3497, description:'太平洋の孤島に立つモアイ像の島', tags:'モアイ 神秘'},
    {id:'uluru', category:'mystic', nameJa:'ウルル', nameEn:'ULURU', country:'オーストラリア', flag:'au', lat:-25.3444, lon:131.0369, description:'先住民文化と結びつく巨大な一枚岩', tags:'自然 神聖'},
    {id:'cappadocia', category:'mystic', nameJa:'カッパドキア', nameEn:'CAPPADOCIA', country:'トルコ', flag:'tr', lat:38.6431, lon:34.8289, description:'奇岩と地下都市が広がる大地', tags:'絶景 世界遺産'},
    {id:'vatican', category:'sacred', nameJa:'バチカン', nameEn:'VATICAN CITY', country:'バチカン市国', flag:'va', lat:41.9029, lon:12.4534, description:'カトリック教会の中心地', tags:'キリスト教 聖地'},
    {id:'jerusalem', category:'sacred', nameJa:'エルサレム', nameEn:'JERUSALEM', country:'イスラエル', flag:'il', lat:31.7683, lon:35.2137, description:'複数の宗教にとって重要な聖地', tags:'ユダヤ教 キリスト教 イスラム教'},
    {id:'bodhgaya', category:'sacred', nameJa:'ブッダガヤ', nameEn:'BODH GAYA', country:'インド', flag:'in', lat:24.6950, lon:84.9914, description:'釈迦が悟りを開いたとされる仏教聖地', tags:'仏教 聖地'},
    {id:'varanasi', category:'sacred', nameJa:'バラナシ', nameEn:'VARANASI', country:'インド', flag:'in', lat:25.3176, lon:82.9739, description:'ガンジス川沿いに広がるヒンドゥー教の聖地', tags:'ヒンドゥー教 聖地'},
    {id:'lumbini', category:'sacred', nameJa:'ルンビニ', nameEn:'LUMBINI', country:'ネパール', flag:'np', lat:27.4833, lon:83.2767, description:'釈迦の生誕地とされる仏教聖地', tags:'仏教 聖地'},
    {id:'ise', category:'sacred', nameJa:'伊勢神宮', nameEn:'ISE JINGU', country:'日本', flag:'jp', lat:34.4550, lon:136.7258, description:'日本を代表する神社の一つ', tags:'神道 聖地 三重'},
    {id:'koyasan', category:'sacred', nameJa:'高野山', nameEn:'MOUNT KOYA', country:'日本', flag:'jp', lat:34.2125, lon:135.5863, description:'真言密教の聖地として知られる山上の町', tags:'仏教 聖地 和歌山'},
    {id:'kailash', category:'sacred', nameJa:'カイラス山', nameEn:'MOUNT KAILASH', country:'中国', flag:'cn', lat:31.0675, lon:81.3119, description:'複数の宗教で神聖視される未踏峰', tags:'チベット 聖山'}
  ];

  const state = {
    current: {lat:25.0330, lon:121.5654, label:'台北（デモ地点）'},
    target: locations[0],
    heading: 0,
    distance: 0,
    bearing: 0,
    mode: 'walk',
    category: 'cities',
    customLocations: readStore('wcCustomLocations', []),
    favorites: readStore('wcFavorites', []),
    recent: readStore('wcRecent', []),
    selectedCountryCode: null,
    countryRegion: 'all',
    countryQuery: ''
  };

  const $ = (id) => document.getElementById(id);
  const dom = {
    targetName:$('targetName'), targetDescription:$('targetDescription'), targetIcon:$('targetIcon'),
    bearingValue:$('bearingValue'), directionValue:$('directionValue'), bearingReadout:$('bearingReadout'), distanceReadout:$('distanceReadout'),
    compassDial:$('compassDial'), targetNeedle:$('targetNeedle'), sensorStatus:$('sensorStatus'), locationStatus:$('locationStatus'),
    orientationButton:$('orientationButton'), orientationButtonLabel:$('orientationButtonLabel'), locationButton:$('locationButton'), locationButtonLabel:$('locationButtonLabel'),
    travelModeLabel:$('travelModeLabel'), travelTime:$('travelTime'), locationList:$('locationList'),
    recentList:$('recentList'), favoriteButton:$('favoriteButton'), favoriteQuickButton:$('favoriteQuickButton'), favoriteQuickLabel:$('favoriteQuickLabel'),
    searchResults:$('searchResults'), locationSearch:$('locationSearch'), locationCount:$('locationCount'),
    headingPreview:$('headingPreview'), headingPreviewValue:$('headingPreviewValue'),
    routeLinePath:$('routeLinePath'), routeLineHalo:$('routeLineHalo'), mapCurrentMarker:$('mapCurrentMarker'), mapTargetMarker:$('mapTargetMarker'),
    mapCurrentName:$('mapCurrentName'), mapTargetName:$('mapTargetName'), mapDistance:$('mapDistance'), mapCard:$('routeMapCard'), travelSection:$('travelSection'), distanceReadoutCard:$('distanceReadoutCard'),
    countryDetailButton:$('countryDetailButton'), countryDetailLabel:$('countryDetailLabel'),
    countryTools:$('countryTools'), countryFlagGrid:$('countryFlagGrid'), countrySearchInput:$('countrySearchInput'),
    countryResult:$('countryResult'), countryResultFlag:$('countryResultFlag'), countryResultType:$('countryResultType'), countryResultName:$('countryResultName'), countryResultBearing:$('countryResultBearing'), countryResultDistance:$('countryResultDistance'),
    countryDetailDialog:$('countryDetailDialog'), countryDialogFlag:$('countryDialogFlag'), countryDialogName:$('countryDialogName'), countryDialogCapital:$('countryDialogCapital'), countryDialogBearing:$('countryDialogBearing'), countryDialogDistance:$('countryDialogDistance'), countryDetailDemoLink:$('countryDetailDemoLink')
  };

  function readStore(key, fallback){
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; }
  }
  function writeStore(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function allLocations(){ return [...locations, ...state.customLocations]; }
  function flagSvgMarkup(code='', countryName='', className='wc-inline-flag'){
    const key=String(code).toUpperCase();
    const svg=FLAG_SVG_DATA[key];
    const label=countryName ? `${countryName}の国旗` : '国旗';
    if(svg) return `<span class="${className}" role="img" aria-label="${escapeHtml(label)}" data-flag-code="${escapeHtml(key)}">${svg}</span>`;
    return `<span class="${className} is-missing" role="img" aria-label="${escapeHtml(label)}">${escapeHtml(key)}</span>`;
  }
  function setStatus(element,kind,title,detail){
    if(!element)return;
    element.className=`wc-status ${kind?`is-${kind}`:''}`.trim();
    element.innerHTML=`<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
  }
  function toRad(deg){ return deg * Math.PI / 180; }
  function toDeg(rad){ return rad * 180 / Math.PI; }

  function calculateRoute(from, to){
    const r = 6371.0088;
    const p1 = toRad(from.lat), p2 = toRad(to.lat);
    const dLat = toRad(to.lat - from.lat), dLon = toRad(to.lon - from.lon);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon/2) ** 2;
    const distance = 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const y = Math.sin(dLon) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    return {distance, bearing};
  }

  const directionLabels = ['北','北北東','北東','東北東','東','東南東','南東','南南東','南','南南西','南西','西南西','西','西北西','北西','北北西'];
  function directionName(degrees){ return directionLabels[Math.round(degrees / 22.5) % 16]; }
  function formatDistance(km){
    if(km < .1) return '現在地付近';
    if(km < 1) return `${Math.round(km*1000)}m`;
    if(km < 100) return `${km.toFixed(1)}km`;
    return `${Math.round(km).toLocaleString('ja-JP')}km`;
  }
  function travelHours(mode, km){
    if(mode === 'walk') return km / 4.8;
    if(mode === 'car') return km / 80;
    if(mode === 'train') return km / 160;
    if(mode === 'plane') return 2 + (km / 820);
    if(mode === 'spaceship') return km / 28000;
    return km;
  }
  function formatDuration(hours){
    const seconds = Math.max(1, Math.round(hours * 3600));
    if(seconds < 60) return `約${seconds}秒`;
    const minutes = Math.round(seconds / 60);
    if(minutes < 60) return `約${minutes}分`;
    if(hours < 24){
      const h = Math.floor(hours), m = Math.round((hours-h)*60);
      return m ? `約${h}時間${m}分` : `約${h}時間`;
    }
    const days = hours / 24;
    if(days < 365) return `約${Math.round(days).toLocaleString('ja-JP')}日`;
    const years = days / 365.25;
    return `約${years.toFixed(years < 10 ? 1 : 0)}年`;
  }
  const modeLabels = {walk:'徒歩なら',car:'車なら',train:'電車なら',plane:'飛行機なら',spaceship:'宇宙船なら'};

  function iconMarkup(location, size='normal'){
    if(location.special === 'north') return '<span class="wc-north-icon" aria-hidden="true"><i></i><em>N</em></span>';
    if(location.special === 'kaaba') return '<span class="wc-kaaba" aria-hidden="true"><i></i></span>';
    if(location.flagCode) return flagSvgMarkup(location.flagCode,location.country,'wc-location-inline-flag');
    if(location.flag) return `<img src="${FLAG_BASE}${location.flag}.svg" alt="${escapeHtml(location.country)}の国旗">`;
    return `<span class="wc-custom-pin" aria-hidden="true">●</span>`;
  }
  function escapeHtml(value=''){ return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }


  function projectToWorldMap(location){
    return {
      x: ((location.lon + 180) / 360) * 1000,
      y: ((90 - location.lat) / 180) * 500
    };
  }

  function straightWorldLinePath(fromLocation, toLocation){
    const from = projectToWorldMap(fromLocation);
    const target = projectToWorldMap(toLocation);
    let adjustedTargetX = target.x;
    const rawDelta = target.x - from.x;
    if(rawDelta > 500) adjustedTargetX -= 1000;
    else if(rawDelta < -500) adjustedTargetX += 1000;

    const segments = [[from.x, from.y, adjustedTargetX, target.y]];
    if(adjustedTargetX < 0) segments.push([from.x + 1000, from.y, adjustedTargetX + 1000, target.y]);
    else if(adjustedTargetX > 1000) segments.push([from.x - 1000, from.y, adjustedTargetX - 1000, target.y]);

    return {
      path: segments.map(([x1,y1,x2,y2]) => `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`).join(' '),
      from,
      target
    };
  }

  function countryToLocation(country){
    return {
      id:`capital-${country.code}`,
      category:'capital',
      nameJa:country.capitalJa,
      nameEn:`${country.capitalEn}, ${country.countryEn}`.toUpperCase(),
      country:country.countryJa,
      countryCode:country.code,
      flagCode:country.code,
      lat:country.lat,
      lon:country.lon,
      description:`${country.countryJa}の${country.targetType}・${country.capitalJa}`,
      isCountryCapital:true
    };
  }

  function selectedCountry(){ return state.selectedCountryCode ? countryByCode.get(state.selectedCountryCode) : null; }

  function renderCountryFlags(){
    let list = [...countryCapitals];
    const query = state.countryQuery.trim().toLowerCase();
    if(state.countryRegion !== 'all') list = list.filter(country => country.region === state.countryRegion);
    if(query) list = list.filter(country => `${country.countryJa} ${country.countryEn} ${country.capitalJa} ${country.capitalEn}`.toLowerCase().includes(query));
    dom.countryFlagGrid.innerHTML = list.length ? list.map(country => `
      <button class="wc-country-flag-button${country.code===state.selectedCountryCode?' is-selected':''}" type="button" data-country-code="${country.code}" aria-label="${escapeHtml(country.countryJa)}の${escapeHtml(country.targetType)}${escapeHtml(country.capitalJa)}を目的地にする">
        ${flagSvgMarkup(country.code,country.countryJa,'wc-country-flag-button__flag')}
        <b>${escapeHtml(country.countryJa)}</b>
        <small>${escapeHtml(country.capitalJa)}</small>
      </button>`).join('') : '<p class="wc-empty-text">該当する国・地域が見つかりません。</p>';
  }

  function updateCountrySelectionUI(){
    const country = selectedCountry();
    if(!country){
      dom.countryResult.hidden = true;
      dom.countryDetailButton.hidden = true;
      document.querySelectorAll('.wc-country-flag-button').forEach(button => button.classList.remove('is-selected'));
      return;
    }
    const bearingText = `${directionName(state.bearing)} ${Math.round(state.bearing)}°`;
    const distanceText = formatDistance(state.distance);
    dom.countryResult.hidden = false;
    dom.countryResultFlag.innerHTML = flagSvgMarkup(country.code,country.countryJa,'wc-country-result__flag-inner');
    dom.countryResultFlag.setAttribute('aria-label',`${country.countryJa}の国旗`);
    dom.countryResultType.textContent = country.targetType;
    dom.countryResultName.textContent = `${country.countryJa}・${country.capitalJa}`;
    dom.countryResultBearing.textContent = bearingText;
    dom.countryResultDistance.textContent = distanceText;
    dom.countryDetailButton.hidden = false;
    dom.countryDetailLabel.textContent = `${country.countryJa}の詳細ページを見る`;
    document.querySelectorAll('.wc-country-flag-button').forEach(button => button.classList.toggle('is-selected', button.dataset.countryCode===country.code));
  }

  function selectCountryCapital(code){
    const country = countryByCode.get(code);
    if(!country) return;
    state.selectedCountryCode = code;
    state.target = countryToLocation(country);
    updateCompass();
    renderCountryFlags();
  }

  function openCountryDetail(){
    const country = selectedCountry();
    if(!country) return;
    dom.countryDialogFlag.innerHTML = flagSvgMarkup(country.code,country.countryJa,'wc-country-dialog__flag-inner');
    dom.countryDialogFlag.setAttribute('aria-label',`${country.countryJa}の国旗`);
    dom.countryDialogName.textContent = country.countryJa;
    dom.countryDialogCapital.textContent = `${country.targetType}：${country.capitalJa}`;
    dom.countryDialogBearing.textContent = `${directionName(state.bearing)} ${Math.round(state.bearing)}°`;
    dom.countryDialogDistance.textContent = formatDistance(state.distance);
    dom.countryDetailDemoLink.href = `index.html?open_country=${encodeURIComponent(country.code)}&from=world-compass`;
    if(typeof dom.countryDetailDialog.showModal === 'function') dom.countryDetailDialog.showModal();
    else dom.countryDetailDialog.setAttribute('open','');
  }

  function updateWorldMap(){
    const line = straightWorldLinePath(state.current, state.target);
    dom.routeLinePath.setAttribute('d', line.path);
    dom.routeLineHalo.setAttribute('d', line.path);
    dom.mapCurrentMarker.setAttribute('transform', `translate(${line.from.x.toFixed(2)} ${line.from.y.toFixed(2)})`);
    dom.mapTargetMarker.setAttribute('transform', `translate(${line.target.x.toFixed(2)} ${line.target.y.toFixed(2)})`);
    dom.mapCurrentName.textContent = state.current.label;
    dom.mapTargetName.textContent = state.target.nameJa;
    dom.mapDistance.textContent = formatDistance(state.distance);
  }

  function updateCompass(){
    const directionOnly = Boolean(state.target.isDirectionOnly);
    if(directionOnly){
      state.distance = 0;
      state.bearing = 0;
    } else {
      const route = calculateRoute(state.current, state.target);
      state.distance = route.distance;
      state.bearing = route.bearing;
    }
    const relative = (state.bearing - state.heading + 360) % 360;
    dom.compassDial.style.transform = `rotate(${-state.heading}deg)`;
    dom.targetNeedle.style.transform = `rotate(${relative}deg)`;
    dom.bearingValue.textContent = `${Math.round(state.bearing)}°`;
    dom.directionValue.textContent = directionOnly ? '北' : directionName(state.bearing);
    dom.bearingReadout.textContent = directionOnly ? '北 0°' : `${directionName(state.bearing)} ${Math.round(state.bearing)}°`;
    dom.distanceReadout.textContent = directionOnly ? '—' : formatDistance(state.distance);
    dom.distanceReadoutCard.classList.toggle('is-direction-only', directionOnly);
    dom.targetName.textContent = state.target.nameEn;
    dom.targetDescription.textContent = state.target.description;
    dom.targetIcon.innerHTML = iconMarkup(state.target);
    dom.mapCard.hidden = directionOnly;
    dom.travelSection.hidden = directionOnly;
    if(!directionOnly){
      dom.travelModeLabel.textContent = modeLabels[state.mode];
      dom.travelTime.textContent = formatDuration(travelHours(state.mode, state.distance));
      updateWorldMap();
    }
    updateFavoritesUI();
    updateSelectedButtons();
    updateCountrySelectionUI();
  }

  function selectLocation(location, addRecent=true){
    state.target = location;
    if(!location.isCountryCapital) state.selectedCountryCode = null;
    if(addRecent && !location.isDirectionOnly){
      state.recent = [location.id, ...state.recent.filter(id => id !== location.id)].slice(0,6);
      writeStore('wcRecent', state.recent);
    }
    updateCompass();
    renderLocationList();
    renderRecent();
    dom.searchResults.hidden = true;
  }

  function updateSelectedButtons(){
    document.querySelectorAll('[data-location-id]').forEach(button => {
      const active = button.dataset.locationId === state.target.id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.wc-location-button').forEach(button => button.classList.toggle('is-selected', button.dataset.locationId === state.target.id));
  }

  function renderLocationList(){
    let list;
    if(state.category === 'saved'){
      const ids = new Set(state.favorites);
      list = allLocations().filter(l => ids.has(l.id) || l.category === 'custom');
    } else {
      list = allLocations().filter(l => l.category === state.category);
    }
    dom.locationCount.textContent = `${allLocations().length}地点`;
    if(!list.length){
      dom.locationList.innerHTML = '<p class="wc-empty-text">登録地点またはお気に入りはまだありません。</p>';
      return;
    }
    dom.locationList.innerHTML = list.map(location => `
      <button class="wc-location-button${location.id===state.target.id?' is-selected':''}" type="button" data-location-id="${escapeHtml(location.id)}">
        ${iconMarkup(location)}
        <span><b>${escapeHtml(location.nameJa)}</b><small>${escapeHtml(location.country)}</small></span>
      </button>`).join('');
  }

  function renderRecent(){
    const map = new Map(allLocations().map(l => [l.id,l]));
    const list = state.recent.map(id => map.get(id)).filter(Boolean);
    dom.recentList.innerHTML = list.length ? list.map(l => `<button type="button" data-location-id="${escapeHtml(l.id)}">${escapeHtml(l.nameJa)}</button>`).join('') : '<span class="wc-empty-text">まだ履歴はありません</span>';
  }

  function updateFavoritesUI(){
    const isCountryCapital = Boolean(state.target.isCountryCapital);
    const isDirectionOnly = Boolean(state.target.isDirectionOnly);
    const disabled = isCountryCapital || isDirectionOnly;
    const active = !disabled && state.favorites.includes(state.target.id);
    dom.favoriteButton.disabled = disabled;
    dom.favoriteButton.setAttribute('aria-pressed', String(active));
    dom.favoriteButton.setAttribute('aria-label', isCountryCapital ? '国旗から選んだ首都は国別詳細から確認できます' : (isDirectionOnly ? '北は基準方位のためお気に入り登録できません' : (active ? '現在の地点をお気に入りから外す' : '現在の地点をお気に入りへ追加')));
    const favoriteLocations = state.favorites.map(id => allLocations().find(l => l.id===id)).filter(Boolean);
    dom.favoriteQuickLabel.textContent = favoriteLocations.length ? favoriteLocations[0].nameJa : 'お気に入りを選択';
    dom.favoriteQuickButton.dataset.locationId = favoriteLocations[0]?.id || '';
  }

  function toggleFavorite(){
    if(state.favorites.includes(state.target.id)) state.favorites = state.favorites.filter(id => id !== state.target.id);
    else state.favorites = [state.target.id, ...state.favorites].slice(0,20);
    writeStore('wcFavorites', state.favorites);
    updateFavoritesUI();
    if(state.category==='saved') renderLocationList();
  }

  function findLocation(id){ return allLocations().find(l => l.id === id); }

  function setMode(mode){
    state.mode = mode;
    document.querySelectorAll('.wc-mode-tabs [data-mode]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.mode===mode)));
    updateCompass();
  }

  function setCategory(category){
    state.category = category;
    document.querySelectorAll('.wc-category-tabs [data-category]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.category===category)));
    renderLocationList();
  }

  async function searchLocations(query){
    const normalized = query.trim().toLowerCase();
    if(!normalized) return;
    const localMatches = allLocations().filter(l => `${l.nameJa} ${l.nameEn} ${l.country} ${l.description} ${l.tags||''}`.toLowerCase().includes(normalized)).slice(0,8);
    showSearchResults(localMatches, localMatches.length ? '登録済みの候補' : '住所を検索しています…');
    if(localMatches.length) return;
    try{
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ja&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {headers:{'Accept':'application/json'}});
      if(!response.ok) throw new Error('search failed');
      const results = await response.json();
      const converted = results.map((item,index) => ({
        id:`custom-${Date.now()}-${index}`,
        category:'custom',
        nameJa:item.name || item.display_name.split(',')[0],
        nameEn:(item.name || item.display_name.split(',')[0]).toUpperCase(),
        country:'住所検索',
        lat:Number(item.lat), lon:Number(item.lon),
        description:item.display_name,
        tags:query,
        isSearchResult:true
      }));
      showSearchResults(converted, converted.length ? '住所検索の候補' : '候補が見つかりませんでした');
    }catch{
      dom.searchResults.hidden = false;
      dom.searchResults.innerHTML = '<p class="wc-search-results__title">住所検索を利用できません</p><p class="wc-empty-text">オンライン環境またはHTTPSで開いてください。主要都市・聖地の選択はそのまま使えます。</p>';
    }
  }

  function showSearchResults(results, title){
    dom.searchResults.hidden = false;
    dom.searchResults.innerHTML = `<p class="wc-search-results__title">${escapeHtml(title)}</p>` + (results.length ? results.map((l,index) => `
      <button class="wc-search-result" type="button" data-search-index="${index}">
        ${iconMarkup(l)}<span><b>${escapeHtml(l.nameJa)}</b><small>${escapeHtml(l.description)}</small></span>
      </button>`).join('') : '<p class="wc-empty-text">候補が見つかりませんでした。</p>');
    dom.searchResults._results = results;
  }

  function registerSearchResult(location){
    if(location.isSearchResult){
      const custom = {...location, id:`custom-${Date.now()}`, isSearchResult:false};
      state.customLocations = [custom, ...state.customLocations].slice(0,30);
      writeStore('wcCustomLocations', state.customLocations);
      state.category = 'saved';
      document.querySelectorAll('.wc-category-tabs [data-category]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.category==='saved')));
      selectLocation(custom);
    } else selectLocation(location);
  }

  function handleOrientation(event){
    let heading = null;
    if(typeof event.webkitCompassHeading === 'number') heading = event.webkitCompassHeading;
    else if(typeof event.alpha === 'number') heading = (360 - event.alpha) % 360;
    if(heading === null) return;
    state.heading = heading;
    dom.headingPreview.value = String(Math.round(heading));
    dom.headingPreviewValue.textContent = `${Math.round(heading)}°`;
    setStatus(dom.sensorStatus,'success','方位磁針：動作中',`端末方位 ${Math.round(heading)}° を取得中です。`);
    updateCompass();
  }

  async function startOrientation(){
    try{
      if(typeof DeviceOrientationEvent === 'undefined') throw new Error('unsupported');
      if(typeof DeviceOrientationEvent.requestPermission === 'function'){
        const permission = await DeviceOrientationEvent.requestPermission();
        if(permission !== 'granted') throw new Error('denied');
      }
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
      dom.orientationButton.classList.add('is-success');
      dom.orientationButtonLabel.textContent='方位磁針を使用中';
      setStatus(dom.sensorStatus,'success','方位磁針：開始済み','端末を8の字に動かすと精度が安定します。');
    }catch{
      dom.orientationButton.classList.remove('is-success');
      dom.orientationButtonLabel.textContent='方位磁針を再試行';
      setStatus(dom.sensorStatus,'error','方位磁針：開始できません','iPhoneではHTTPS上で許可してください。PCでは固定方位表示を利用できます。');
    }
  }

  function getCurrentLocation(){
    if(!navigator.geolocation){
      dom.locationButtonLabel.textContent='現在地を利用できません';
      setStatus(dom.locationStatus,'error','現在地：取得不可','この端末またはブラウザでは位置情報を利用できません。台北のデモ地点を使用中です。');
      return;
    }
    dom.locationButton.disabled=true;
    dom.locationButton.setAttribute('aria-busy','true');
    dom.locationButton.classList.remove('is-success','is-error');
    dom.locationButtonLabel.textContent='取得中…';
    setStatus(dom.locationStatus,'loading','現在地：取得中','端末の位置情報を確認しています。許可画面が出た場合は「許可」を選んでください。');
    navigator.geolocation.getCurrentPosition(position => {
      const latitude=position.coords.latitude;
      const longitude=position.coords.longitude;
      const accuracy=Math.round(position.coords.accuracy);
      state.current = {lat:latitude, lon:longitude, label:'端末の現在地'};
      dom.locationButton.disabled=false;
      dom.locationButton.removeAttribute('aria-busy');
      dom.locationButton.classList.add('is-success');
      dom.locationButtonLabel.textContent='現在地を再取得';
      setStatus(dom.locationStatus,'success','現在地：取得完了',`端末の現在地へ更新しました（精度 約${accuracy}m）。緯度 ${latitude.toFixed(4)}、経度 ${longitude.toFixed(4)}。`);
      updateCompass();
    }, error => {
      dom.locationButton.disabled=false;
      dom.locationButton.removeAttribute('aria-busy');
      dom.locationButton.classList.add('is-error');
      dom.locationButtonLabel.textContent='現在地を再試行';
      const reason=error&&error.code===1?'位置情報の許可が拒否されています。ブラウザ設定で許可してください。':error&&error.code===3?'位置情報の取得が時間切れになりました。通信状態を確認して再試行してください。':'現在地を取得できませんでした。HTTPS環境と位置情報設定を確認してください。';
      setStatus(dom.locationStatus,'error','現在地：更新されていません',`${reason} 現在は台北のデモ地点を使用しています。`);
    }, {enableHighAccuracy:true, timeout:15000, maximumAge:30000});
  }

  document.addEventListener('click', event => {
    const countryButton = event.target.closest('[data-country-code]');
    if(countryButton){
      event.preventDefault();
      selectCountryCapital(countryButton.dataset.countryCode);
      return;
    }
    const regionButton = event.target.closest('[data-country-region]');
    if(regionButton){
      state.countryRegion = regionButton.dataset.countryRegion;
      document.querySelectorAll('[data-country-region]').forEach(button => button.setAttribute('aria-selected', String(button===regionButton)));
      renderCountryFlags();
      return;
    }
    const locationButton = event.target.closest('[data-location-id]');
    if(locationButton && locationButton.dataset.locationId){
      event.preventDefault();
      const location = findLocation(locationButton.dataset.locationId);
      if(location) selectLocation(location);
      return;
    }
    const modeButton = event.target.closest('[data-mode]');
    if(modeButton){ setMode(modeButton.dataset.mode); return; }
    const categoryButton = event.target.closest('[data-category]');
    if(categoryButton){ setCategory(categoryButton.dataset.category); return; }
    const searchButton = event.target.closest('[data-search-index]');
    if(searchButton){
      const result = dom.searchResults._results?.[Number(searchButton.dataset.searchIndex)];
      if(result) registerSearchResult(result);
    }
  });

  $('locationSearchForm').addEventListener('submit', event => { event.preventDefault(); searchLocations(dom.locationSearch.value); });
  dom.countrySearchInput.addEventListener('input', () => { state.countryQuery=dom.countrySearchInput.value; renderCountryFlags(); });
  $('scrollToCompassButton').addEventListener('click', () => document.querySelector('.wc-compass-card')?.scrollIntoView({behavior:'smooth',block:'start'}));
  $('countryResultDetailButton').addEventListener('click', openCountryDetail);
  dom.countryDetailButton.addEventListener('click', openCountryDetail);
  $('countryDialogClose').addEventListener('click', () => dom.countryDetailDialog.close());
  dom.countryDetailDialog.addEventListener('click', event => { if(event.target===dom.countryDetailDialog) dom.countryDetailDialog.close(); });
  $('orientationButton').addEventListener('click', startOrientation);
  $('locationButton').addEventListener('click', getCurrentLocation);
  dom.favoriteButton.addEventListener('click', toggleFavorite);
  $('clearRecentButton').addEventListener('click', () => { state.recent=[]; writeStore('wcRecent',[]); renderRecent(); });
  dom.headingPreview.addEventListener('input', () => { state.heading=Number(dom.headingPreview.value); dom.headingPreviewValue.textContent=`${state.heading}°`; updateCompass(); });
  $('backButton').addEventListener('click', () => { if(history.length>1) history.back(); else window.location.href='index.html'; });
  $('compassRefreshButton')?.addEventListener('click', () => {
    const button=$('compassRefreshButton');
    if(button?.disabled) return;
    if(button){ button.disabled=true; button.textContent='更新中'; }
    state.heading = 0;
    state.current = {lat:25.0330, lon:121.5654, label:'台北（デモ地点）'};
    state.selectedCountryCode = '';
    state.target = findLocation('aichi') || state.target;
    state.mode = 'walk';
    dom.headingPreview.value = '0';
    dom.headingPreviewValue.textContent='0°';
    dom.countrySearchInput.value='';
    state.countryQuery='';
    updateCompass();
    renderCountryFlags();
    window.setTimeout(()=>{ if(button){ button.disabled=false; button.textContent='更新'; } },260);
  });

  renderLocationList();
  renderRecent();
  renderCountryFlags();
  updateCompass();
})();
