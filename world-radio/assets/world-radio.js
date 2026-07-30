(() => {
  'use strict';

  const stations = Array.isArray(window.MarketBaseRadioStations)
    ? window.MarketBaseRadioStations
    : [];
  const STATE_KEY = 'market_base_radio_state_v1';
  const CHANNEL_NAME = 'market-base-radio-v1';
  const STATE_GRACE_MS = 12 * 60 * 60 * 1000;
  const englishGrid = document.getElementById('englishStationGrid');
  const musicGrid = document.getElementById('musicStationGrid');
  const nowPlaying = document.getElementById('nowPlaying');
  const nowDetail = document.getElementById('nowDetail');
  let channel = null;

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function stateIsFresh(state) {
    return !!(
      state &&
      state.stationId &&
      Number.isFinite(Number(state.updatedAt)) &&
      (
        Number(state.validUntil || 0) > Date.now() ||
        Date.now() - Number(state.updatedAt) < STATE_GRACE_MS
      )
    );
  }

  function stationCards(rows) {
    return rows.map(station => `
      <article class="station-card" data-station-card="${escapeHtml(station.id)}">
        <p class="station-meta">${escapeHtml(station.place)}</p>
        <h3>${escapeHtml(station.name)}</h3>
        <p>${escapeHtml(station.description)}</p>
        <a class="radio-open" href="player.html?id=${encodeURIComponent(station.id)}&amp;autoplay=1&amp;v=20260730-v324-radio-recovery" target="_blank" rel="noopener">
          <span aria-hidden="true">▶</span> 別タブで聴く
        </a>
      </article>
    `).join('');
  }

  function renderStations() {
    if (englishGrid) {
      englishGrid.innerHTML = stationCards(
        stations.filter(station => station.category !== 'music')
      );
    }
    if (musicGrid) {
      musicGrid.innerHTML = stationCards(
        stations.filter(station => station.category === 'music')
      );
    }
  }

  function renderState(state = readState()) {
    document.querySelectorAll('[data-station-card]').forEach(card => {
      card.classList.toggle(
        'is-playing',
        !!(stateIsFresh(state) && state.playing && card.dataset.stationCard === state.stationId)
      );
    });

    if (!nowPlaying || !nowDetail) return;
    if (!stateIsFresh(state)) {
      nowPlaying.textContent = '停止中';
      nowDetail.textContent = '局を選び、別タブで再生ボタンを押してください';
      return;
    }

    const place = [state.city, state.country].filter(Boolean).join('・');
    nowPlaying.textContent = state.stationName || '世界のラジオ';
    if (state.playing) {
      nowDetail.textContent = `${place || 'LIVE'}｜再生中`;
    } else if (state.needsGesture) {
      nowDetail.textContent = `${place || 'LIVE'}｜プレイヤーで再生ボタンを押してください`;
    } else {
      nowDetail.textContent = `${place || 'LIVE'}｜停止中`;
    }
  }

  function initializeSignals() {
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.addEventListener('message', event => {
          if (event.data?.type === 'STATE') renderState(event.data.state);
        });
      } catch (_) {}
    }
    window.addEventListener('storage', event => {
      if (event.key !== STATE_KEY) return;
      renderState();
    });
    window.setInterval(() => renderState(), 30000);
  }

  renderStations();
  renderState();
  initializeSignals();

  window.addEventListener('pagehide', () => {
    try { channel?.close(); } catch (_) {}
  }, { once: true });
})();
