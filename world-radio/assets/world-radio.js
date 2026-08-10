(() => {
  'use strict';

  const stations = Array.isArray(window.MarketBaseRadioStations) ? window.MarketBaseRadioStations : [];
  const STATE_KEY = 'market_base_radio_state_v1';
  const CHANNEL_NAME = 'market-base-radio-v1';
  const STATE_GRACE_MS = 12 * 60 * 60 * 1000;
  const grids = {
    english: document.getElementById('englishStationGrid'),
    'talk-music': document.getElementById('talkMusicStationGrid'),
    music: document.getElementById('musicStationGrid')
  };
  const nowPlaying = document.getElementById('nowPlaying');
  const nowDetail = document.getElementById('nowDetail');
  const offlineNotice = document.getElementById('radioOfflineNotice');
  let channel = null;

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  }
  function readState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch (_) { return null; }
  }
  function stateIsFresh(state) {
    return !!(state && state.stationId && Number.isFinite(Number(state.updatedAt)) &&
      (Number(state.validUntil || 0) > Date.now() || Date.now() - Number(state.updatedAt) < STATE_GRACE_MS));
  }
  function stationCards(rows) {
    return rows.map(station => `
      <article class="station-card" data-station-card="${escapeHtml(station.id)}">
        <p class="station-meta">${escapeHtml(station.place)}</p>
        <h3>${escapeHtml(station.name)}</h3>
        <p>${escapeHtml(station.description)}</p>
        ${station.note ? `<small class="station-note">${escapeHtml(station.note)}</small>` : ''}
        <a class="radio-open" data-radio-online-only href="player.html?id=${encodeURIComponent(station.id)}&amp;autoplay=1&amp;v=20260810-v333-18-cache-radio-navigation-stability" target="_blank" rel="noopener">
          <span aria-hidden="true">▶</span> 別タブで聴く
        </a>
      </article>`).join('');
  }
  function renderStations() {
    Object.entries(grids).forEach(([category, grid]) => {
      if (grid) grid.innerHTML = stationCards(stations.filter(station => station.category === category));
    });
    syncOnlineState();
  }
  function renderState(state = readState()) {
    document.querySelectorAll('[data-station-card]').forEach(card => {
      card.classList.toggle('is-playing', !!(navigator.onLine && stateIsFresh(state) && state.playing && card.dataset.stationCard === state.stationId));
    });
    if (!nowPlaying || !nowDetail) return;
    if (!navigator.onLine) {
      nowPlaying.textContent = 'オフライン';
      nowDetail.textContent = '世界のラジオはオンライン時に利用できます';
      return;
    }
    if (!stateIsFresh(state)) {
      nowPlaying.textContent = '停止中';
      nowDetail.textContent = '局を選び、別タブで再生ボタンを押してください';
      return;
    }
    const place = [state.city, state.country].filter(Boolean).join('・');
    nowPlaying.textContent = state.trackTitle || state.stationName || '世界のラジオ';
    if (state.trackTitle && state.trackArtist) {
      nowDetail.textContent = `${state.trackArtist}｜${state.stationName || place || 'LIVE'}`;
    } else if (state.playing) {
      nowDetail.textContent = `${place || 'LIVE'}｜再生中`;
    } else if (state.needsGesture) {
      nowDetail.textContent = `${place || 'LIVE'}｜プレイヤーで再生ボタンを押してください`;
    } else if (state.status === 'error') {
      nowDetail.textContent = `${place || 'LIVE'}｜直接再生できません`;
    } else {
      nowDetail.textContent = `${place || 'LIVE'}｜停止中`;
    }
  }
  function syncOnlineState() {
    const online = navigator.onLine;
    document.body.dataset.radioOnline = String(online);
    if (offlineNotice) offlineNotice.hidden = online;
    document.querySelectorAll('[data-radio-online-only]').forEach(link => {
      link.setAttribute('aria-disabled', online ? 'false' : 'true');
      link.tabIndex = online ? 0 : -1;
    });
    renderState();
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-radio-online-only]');
    if (!link || navigator.onLine) return;
    event.preventDefault();
    if (offlineNotice) {
      offlineNotice.hidden = false;
      offlineNotice.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, true);
  function initializeSignals() {
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.addEventListener('message', event => { if (event.data?.type === 'STATE') renderState(event.data.state); });
      } catch (_) {}
    }
    window.addEventListener('storage', event => { if (event.key === STATE_KEY) renderState(); });
    window.setInterval(() => renderState(), 30000);
  }
  renderStations();
  renderState();
  initializeSignals();
  window.addEventListener('online', syncOnlineState);
  window.addEventListener('offline', syncOnlineState);
  window.addEventListener('pagehide', () => { try { channel?.close(); } catch (_) {} }, { once: true });
})();
