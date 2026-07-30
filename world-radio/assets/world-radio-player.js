(() => {
  'use strict';

  const stations = Array.isArray(window.MarketBaseRadioStations)
    ? window.MarketBaseRadioStations
    : [];
  const STATE_KEY = 'market_base_radio_state_v1';
  const COMMAND_KEY = 'market_base_radio_command_v1';
  const LAST_ACTIVE_KEY = 'market_base_last_active_at_v1';
  const CHANNEL_NAME = 'market-base-radio-v1';
  const HEARTBEAT_MS = 15000;
  const STATE_GRACE_MS = 12 * 60 * 60 * 1000;
  const instanceId = `radio-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const audio = document.getElementById('radioAudio');
  const stationName = document.getElementById('stationName');
  const stationPlace = document.getElementById('stationPlace');
  const stationDescription = document.getElementById('stationDescription');
  const stationSelect = document.getElementById('stationSelect');
  const officialLink = document.getElementById('openOfficial');
  const liveState = document.getElementById('liveState');
  const playerMessage = document.getElementById('playerMessage');
  const playPause = document.getElementById('playPause');
  const playIcon = document.getElementById('playIcon');
  const playLabel = document.getElementById('playLabel');
  const previousStation = document.getElementById('previousStation');
  const nextStation = document.getElementById('nextStation');
  const closeButton = document.getElementById('windowClose');

  if (!stations.length || !audio) {
    if (playerMessage) {
      playerMessage.textContent = '放送局データを読み込めませんでした。ページを更新してください。';
    }
    return;
  }

  let currentIndex = 0;
  let channel = null;
  let status = 'paused';
  let playIntent = false;
  let needsGesture = false;
  let shuttingDown = false;
  let ownsState = true;
  let suppressPauseEvent = false;
  let lastCommandId = '';

  function storageGet(key) {
    try { return localStorage.getItem(key); }
    catch (_) { return null; }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function storageRemove(key) {
    try { localStorage.removeItem(key); }
    catch (_) {}
  }

  function readJson(key) {
    try { return JSON.parse(storageGet(key) || 'null'); }
    catch (_) { return null; }
  }

  function currentStation() {
    return stations[currentIndex] || stations[0];
  }

  function markActive() {
    storageSet(LAST_ACTIVE_KEY, String(Date.now()));
  }

  function statePayload() {
    const station = currentStation();
    const now = Date.now();
    return {
      version: 2,
      instanceId,
      stationId: station.id,
      stationName: station.name,
      country: station.country,
      city: station.city,
      playing: status === 'playing' || (status === 'loading' && playIntent),
      status,
      needsGesture,
      updatedAt: now,
      validUntil: now + STATE_GRACE_MS
    };
  }

  function publishState() {
    const state = statePayload();
    if (!ownsState) return state;
    storageSet(STATE_KEY, JSON.stringify(state));
    try { channel?.postMessage({ type: 'STATE', state }); } catch (_) {}
    return state;
  }

  function publishRelease() {
    const stored = readJson(STATE_KEY);
    if (stored?.instanceId !== instanceId) return;
    status = 'paused';
    playIntent = false;
    needsGesture = false;
    storageRemove(STATE_KEY);
    try {
      channel?.postMessage({
        type: 'STATE',
        state: null,
        releasedInstanceId: instanceId
      });
    } catch (_) {}
  }

  function setMessage(message) {
    if (playerMessage) playerMessage.textContent = message;
  }

  function statusCopy() {
    if (needsGesture) {
      return {
        label: '操作が必要',
        message: 'iPhoneでは、この画面の再生ボタンを押してください。'
      };
    }
    if (status === 'playing') {
      return { label: '再生中', message: `${currentStation().name}を再生しています` };
    }
    if (status === 'loading') {
      return { label: '接続中', message: '放送局へ接続しています…' };
    }
    if (status === 'error') {
      return {
        label: '接続できません',
        message: '直接再生できません。下の公式ページをお試しください。'
      };
    }
    return { label: '停止中', message: '再生ボタンを押してください' };
  }

  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const station = currentStation();
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: `${station.city}・${station.country}`,
        album: 'MARKET BASE 世界のラジオ',
        artwork: [
          {
            src: new URL('../icons/market-base-icon-192.png', location.href).href,
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: new URL('../icons/market-base-icon-512.png', location.href).href,
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      });
      navigator.mediaSession.playbackState = status === 'playing'
        ? 'playing'
        : status === 'loading'
          ? 'none'
          : 'paused';
    } catch (_) {}
  }

  function render() {
    const station = currentStation();
    const copy = statusCopy();
    stationName.textContent = station.name;
    stationPlace.textContent = `${station.city.toUpperCase()} · ${station.country.toUpperCase()}`;
    stationDescription.textContent = station.description;
    stationSelect.value = station.id;
    officialLink.href = station.official;
    document.title = `${station.name}｜世界のラジオ｜MARKET BASE`;

    liveState.textContent = copy.label;
    liveState.dataset.state = needsGesture ? 'gesture' : status;
    setMessage(copy.message);

    const active = status === 'playing' || status === 'loading';
    playPause.setAttribute('aria-pressed', String(active));
    playPause.setAttribute('aria-label', active ? '再生を停止する' : '再生する');
    playIcon.textContent = active ? 'Ⅱ' : '▶';
    playLabel.textContent = active ? '停止' : '再生';
    updateMediaSession();
  }

  function claimPlayer() {
    ownsState = true;
    const message = {
      type: 'CLAIM',
      instanceId,
      id: `${instanceId}-claim-${Date.now()}`,
      sentAt: Date.now()
    };
    try { channel?.postMessage(message); } catch (_) {}
    storageSet(COMMAND_KEY, JSON.stringify(message));
  }

  function pauseForNewPlayer() {
    ownsState = false;
    playIntent = false;
    status = 'paused';
    needsGesture = false;
    suppressPauseEvent = true;
    if (!audio.paused) audio.pause();
    suppressPauseEvent = false;
    render();
    publishRelease();
  }

  function setStation(index, options = {}) {
    const normalized = (index + stations.length) % stations.length;
    const shouldResume = !!options.resume;
    if (options.markActivity) claimPlayer();
    currentIndex = normalized;
    playIntent = false;
    needsGesture = false;
    status = 'paused';
    audio.pause();
    audio.src = currentStation().stream;
    audio.load();
    render();
    publishState();
    if (options.markActivity) markActive();
    if (shouldResume) playCurrent(options.origin || 'station-change');
  }

  async function playCurrent(origin = 'button') {
    claimPlayer();
    if (origin === 'button' || origin === 'select' || origin === 'step') markActive();
    needsGesture = false;
    playIntent = true;
    status = 'loading';
    render();
    publishState();
    try {
      const result = audio.play();
      if (result && typeof result.then === 'function') await result;
    } catch (error) {
      playIntent = false;
      status = 'paused';
      needsGesture = error?.name === 'NotAllowedError';
      render();
      publishState();
    }
  }

  function pauseCurrent(markActivity = false) {
    playIntent = false;
    needsGesture = false;
    audio.pause();
    status = 'paused';
    if (markActivity) markActive();
    render();
    publishState();
  }

  function stepStation(offset, origin = 'step') {
    const resume = playIntent || status === 'playing' || status === 'loading';
    setStation(currentIndex + offset, {
      resume,
      origin,
      markActivity: origin === 'step'
    });
  }

  function acknowledge(command) {
    const state = publishState();
    try {
      channel?.postMessage({
        type: 'ACK',
        commandId: command.id || '',
        instanceId,
        state
      });
    } catch (_) {}
  }

  function handleSignal(message) {
    if (!message || message.instanceId === instanceId) return;
    if (message.type === 'CLAIM') {
      pauseForNewPlayer();
      return;
    }
    if (message.type !== 'COMMAND') return;
    if (message.targetInstanceId && message.targetInstanceId !== instanceId) return;
    if (message.id && message.id === lastCommandId) return;
    lastCommandId = message.id || '';

    if (message.action === 'pause' || message.action === 'stop') {
      pauseCurrent(false);
    } else if (message.action === 'previous') {
      stepStation(-1, 'remote');
    } else if (message.action === 'next') {
      stepStation(1, 'remote');
    } else if (message.action === 'toggle') {
      if (status === 'playing' || status === 'loading') pauseCurrent(false);
      else playCurrent('remote');
    }
    acknowledge(message);
  }

  function initializeSignals() {
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.addEventListener('message', event => handleSignal(event.data));
      } catch (_) {}
    }
    window.addEventListener('storage', event => {
      if (event.key === COMMAND_KEY && event.newValue) {
        try { handleSignal(JSON.parse(event.newValue)); } catch (_) {}
      }
      if (event.key === STATE_KEY && event.newValue) {
        try {
          const state = JSON.parse(event.newValue);
          if (state?.instanceId && state.instanceId !== instanceId && state.playing) {
            pauseForNewPlayer();
          }
        } catch (_) {}
      }
    });
  }

  function initializeMediaSessionActions() {
    if (!('mediaSession' in navigator)) return;
    const actions = {
      play: () => playCurrent('media-session'),
      pause: () => pauseCurrent(false),
      stop: () => pauseCurrent(false),
      previoustrack: () => stepStation(-1, 'media-session'),
      nexttrack: () => stepStation(1, 'media-session')
    };
    Object.entries(actions).forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) {}
    });
  }

  stationSelect.innerHTML = stations.map(station => (
    `<option value="${station.id}">${station.name}｜${station.country}</option>`
  )).join('');

  playPause.addEventListener('click', () => {
    if (status === 'playing' || status === 'loading') pauseCurrent(true);
    else playCurrent('button');
  });
  previousStation.addEventListener('click', () => stepStation(-1, 'step'));
  nextStation.addEventListener('click', () => stepStation(1, 'step'));
  stationSelect.addEventListener('change', () => {
    const nextIndex = stations.findIndex(station => station.id === stationSelect.value);
    if (nextIndex < 0) return;
    const resume = playIntent || status === 'playing' || status === 'loading';
    setStation(nextIndex, { resume, origin: 'select', markActivity: true });
  });
  closeButton.addEventListener('click', () => {
    shuttingDown = true;
    pauseCurrent(true);
    publishRelease();
    window.close();
    window.setTimeout(() => {
      if (!window.closed) setMessage('ブラウザのタブを閉じてください。');
    }, 150);
  });

  audio.addEventListener('playing', () => {
    playIntent = true;
    needsGesture = false;
    status = 'playing';
    render();
    publishState();
  });
  audio.addEventListener('waiting', () => {
    if (!playIntent) return;
    status = 'loading';
    render();
    publishState();
  });
  audio.addEventListener('stalled', () => {
    if (!playIntent) return;
    status = 'loading';
    render();
    publishState();
  });
  audio.addEventListener('pause', () => {
    if (shuttingDown || suppressPauseEvent) return;
    playIntent = false;
    status = 'paused';
    render();
    publishState();
  });
  audio.addEventListener('ended', () => {
    playIntent = false;
    status = 'paused';
    render();
    publishState();
  });
  audio.addEventListener('error', () => {
    if (shuttingDown) return;
    playIntent = false;
    needsGesture = false;
    status = 'error';
    render();
    publishState();
  });

  initializeSignals();
  initializeMediaSessionActions();

  const requestedId = new URLSearchParams(location.search).get('id');
  const autoplayRequested = new URLSearchParams(location.search).get('autoplay') === '1';
  const requestedIndex = stations.findIndex(station => station.id === requestedId);
  setStation(requestedIndex >= 0 ? requestedIndex : 0);
  claimPlayer();
  publishState();
  if (autoplayRequested) {
    playCurrent('button');
  }

  window.setInterval(() => {
    if (!shuttingDown && ownsState) publishState();
  }, HEARTBEAT_MS);

  document.addEventListener('visibilitychange', () => {
    // Do not pause when the user locks the screen or opens another app.
    // Refresh the state just before suspension and again on return.
    if (!shuttingDown && ownsState) publishState();
  });

  window.addEventListener('pagehide', event => {
    if (event.persisted) {
      if (ownsState) publishState();
      return;
    }
    shuttingDown = true;
    publishRelease();
    try { channel?.close(); } catch (_) {}
  }, { once: true });
})();
