(() => {
  'use strict';

  const stations = Array.isArray(window.MarketBaseRadioStations) ? window.MarketBaseRadioStations : [];
  const STATE_KEY = 'market_base_radio_state_v1';
  const COMMAND_KEY = 'market_base_radio_command_v1';
  const LAST_ACTIVE_KEY = 'market_base_last_active_at_v1';
  const CHANNEL_NAME = 'market-base-radio-v1';
  const HEARTBEAT_MS = 15000;
  const STATE_TTL_MS = 45000;
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
  const nowPlayingMeta = document.getElementById('nowPlayingMeta');
  const nowPlayingTitle = document.getElementById('nowPlayingTitle');
  const nowPlayingArtist = document.getElementById('nowPlayingArtist');
  const nowPlayingSource = document.getElementById('nowPlayingSource');

  if (!stations.length || !audio) {
    if (playerMessage) playerMessage.textContent = '放送局データを読み込めませんでした。ページを更新してください。';
    return;
  }

  let currentIndex = 0;
  let channel = null;
  let hls = null;
  let status = navigator.onLine ? 'paused' : 'offline';
  let playIntent = false;
  let needsGesture = false;
  let shuttingDown = false;
  let ownsState = true;
  let suppressPauseEvent = false;
  let lastCommandId = '';
  let preparedStationId = '';
  let activeStreamIndex = 0;
  let streamWatchdog = 0;
  let trackTitle = '';
  let trackArtist = '';
  let metadataSource = '';
  let hlsRecoveryCount = 0;
  let resumeAfterInterruption = false;
  let interrupted = false;
  let recoveryInFlight = false;
  let lastConfirmedMediaTime = 0;

  function storageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function storageSet(key, value) { try { localStorage.setItem(key, value); return true; } catch (_) { return false; } }
  function storageRemove(key) { try { localStorage.removeItem(key); } catch (_) {} }
  function currentStation() { return stations[currentIndex] || stations[0]; }
  function markActive() { storageSet(LAST_ACTIVE_KEY, String(Date.now())); }

  function statePayload() {
    const station = currentStation();
    const now = Date.now();
    return {
      version: 3, instanceId, stationId: station.id, stationName: station.name,
      country: station.country, city: station.city,
      playing: status === 'playing', status, needsGesture, interrupted,
      resumeRequested: resumeAfterInterruption,
      trackTitle, trackArtist, metadataSource,
      updatedAt: now, validUntil: now + STATE_TTL_MS
    };
  }
  function publishState() {
    if (!ownsState || shuttingDown) return statePayload();
    const state = statePayload();
    storageSet(STATE_KEY, JSON.stringify(state));
    try { channel?.postMessage({ type: 'STATE', state }); } catch (_) {}
    return state;
  }
  function publishRelease() {
    const saved = (() => { try { return JSON.parse(storageGet(STATE_KEY) || 'null'); } catch (_) { return null; } })();
    if (saved?.instanceId === instanceId) storageRemove(STATE_KEY);
    try { channel?.postMessage({ type: 'STATE', state: null, releasedInstanceId: instanceId }); } catch (_) {}
  }
  function setMessage(message) { if (playerMessage) playerMessage.textContent = message; }

  function clearMetadata() {
    trackTitle = ''; trackArtist = ''; metadataSource = '';
    if (nowPlayingMeta) nowPlayingMeta.hidden = true;
  }
  function normalizeMetadata(title, artist, source = '放送局から受け取った情報') {
    const clean = value => String(value || '').replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
    let nextTitle = clean(title);
    let nextArtist = clean(artist);
    if (!nextArtist && nextTitle.includes(' - ')) {
      const parts = nextTitle.split(' - ');
      if (parts.length >= 2) { nextArtist = parts.shift().trim(); nextTitle = parts.join(' - ').trim(); }
    }
    if (!nextTitle || /^unknown(?: track)?$/i.test(nextTitle)) return;
    trackTitle = nextTitle.slice(0, 180);
    trackArtist = nextArtist.slice(0, 120);
    metadataSource = source;
    renderMetadata();
    publishState();
  }
  function renderMetadata() {
    if (!nowPlayingMeta) return;
    const visible = !!trackTitle;
    nowPlayingMeta.hidden = !visible;
    if (!visible) return;
    nowPlayingTitle.textContent = trackTitle;
    nowPlayingArtist.textContent = trackArtist || currentStation().name;
    nowPlayingSource.textContent = metadataSource || '放送局から受け取った情報';
  }

  function decodeText(bytes, encoding = 3) {
    try {
      const body = bytes[0] <= 3 ? bytes.slice(1) : bytes;
      if (encoding === 1 || encoding === 2) return new TextDecoder('utf-16').decode(body).replace(/^\uFEFF/, '');
      return new TextDecoder('utf-8').decode(body);
    } catch (_) { return ''; }
  }
  function syncSafe(bytes, offset) { return ((bytes[offset]&0x7f)<<21)|((bytes[offset+1]&0x7f)<<14)|((bytes[offset+2]&0x7f)<<7)|(bytes[offset+3]&0x7f); }
  function parseId3(data) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data || []);
    let title = '', artist = '';
    for (let pos = 0; pos + 10 <= bytes.length; pos += 1) {
      if (bytes[pos] !== 0x49 || bytes[pos+1] !== 0x44 || bytes[pos+2] !== 0x33) continue;
      const end = Math.min(bytes.length, pos + 10 + syncSafe(bytes, pos + 6));
      let frame = pos + 10;
      while (frame + 10 <= end) {
        const id = String.fromCharCode(...bytes.slice(frame, frame + 4));
        const size = (bytes[frame+4]<<24)|(bytes[frame+5]<<16)|(bytes[frame+6]<<8)|bytes[frame+7];
        if (!/^[A-Z0-9]{4}$/.test(id) || size <= 0 || frame + 10 + size > end) break;
        const payload = bytes.slice(frame + 10, frame + 10 + size);
        const text = decodeText(payload, payload[0]).replace(/\u0000/g, '').trim();
        if (id === 'TIT2') title = text;
        if (id === 'TPE1') artist = text;
        if (id === 'TXXX' && !title && /streamtitle|title/i.test(text)) title = text.split(/\u0000|=/).pop().trim();
        frame += 10 + size;
      }
      break;
    }
    return { title, artist };
  }

  function destroyHls() {
    window.clearTimeout(streamWatchdog);
    streamWatchdog = 0;
    if (hls) { try { hls.destroy(); } catch (_) {} hls = null; }
    preparedStationId = '';
    hlsRecoveryCount = 0;
    audio.removeAttribute('src');
    try { audio.load(); } catch (_) {}
  }
  function streamCandidates(station) {
    const configured = Array.isArray(station.streams) ? station.streams : [];
    const normalized = configured.map(item => typeof item === 'string' ? { url: item, type: station.streamType || 'audio' } : item)
      .filter(item => item && item.url);
    if (!normalized.length && station.stream) normalized.push({ url: station.stream, type: station.streamType || 'audio' });
    return normalized;
  }
  function activeStream(station) {
    const candidates = streamCandidates(station);
    return candidates[Math.min(activeStreamIndex, Math.max(0, candidates.length - 1))] || null;
  }
  function preparedKey(station) { return `${station.id}:${activeStreamIndex}`; }
  function armStreamWatchdog() {
    window.clearTimeout(streamWatchdog);
    streamWatchdog = window.setTimeout(() => {
      if (playIntent && status === 'loading' && !shuttingDown) tryNextStream('timeout');
    }, 18000);
  }
  function tryNextStream(_reason = 'error') {
    const station = currentStation();
    const candidates = streamCandidates(station);
    if (!playIntent || activeStreamIndex + 1 >= candidates.length) {
      playIntent = false; needsGesture = false; status = navigator.onLine ? 'error' : 'offline';
      destroyHls(); render(); publishState();
      return false;
    }
    activeStreamIndex += 1;
    destroyHls();
    status = 'loading'; render(); publishState();
    if (!prepareStream(station)) { tryNextStream('unsupported'); return false; }
    const candidate = activeStream(station);
    if (candidate?.type !== 'hls' || audio.src) startAudioPlayback();
    return true;
  }
  function prepareRegular(station) {
    const candidate = activeStream(station);
    if (!candidate) return;
    if (preparedStationId === preparedKey(station) && audio.src) return;
    destroyHls();
    audio.src = candidate.url;
    audio.load();
    preparedStationId = preparedKey(station);
    armStreamWatchdog();
  }
  function prepareHls(station) {
    const candidate = activeStream(station);
    if (!candidate) return false;
    if (preparedStationId === preparedKey(station) && (hls || audio.src)) return true;
    destroyHls();
    const nativeHls = audio.canPlayType('application/vnd.apple.mpegurl') || audio.canPlayType('application/x-mpegURL');
    if (nativeHls) {
      audio.src = candidate.url;
      audio.load();
      preparedStationId = preparedKey(station);
      armStreamWatchdog();
      return true;
    }
    if (!window.Hls || !window.Hls.isSupported()) return false;
    hls = new window.Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 30 });
    hls.attachMedia(audio);
    hls.on(window.Hls.Events.MEDIA_ATTACHED, () => hls?.loadSource(candidate.url));
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => { if (playIntent && navigator.onLine) startAudioPlayback(); });
    hls.on(window.Hls.Events.FRAG_PARSING_METADATA, (_event, data) => {
      (data?.samples || []).forEach(sample => {
        const parsed = parseId3(sample.data);
        if (parsed.title) normalizeMetadata(parsed.title, parsed.artist, '放送ストリームの曲名情報');
      });
    });
    hls.on(window.Hls.Events.ERROR, (_event, data) => {
      if (!data?.fatal || shuttingDown) return;
      if (hlsRecoveryCount < 2 && data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
        hlsRecoveryCount += 1; hls.startLoad(); return;
      }
      if (hlsRecoveryCount < 2 && data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
        hlsRecoveryCount += 1; hls.recoverMediaError(); return;
      }
      tryNextStream('hls-fatal');
    });
    preparedStationId = preparedKey(station);
    armStreamWatchdog();
    return true;
  }
  function prepareStream(station) {
    const candidate = activeStream(station);
    if (!candidate) return false;
    return candidate.type === 'hls' ? prepareHls(station) : (prepareRegular(station), true);
  }

  function statusCopy() {
    if (!navigator.onLine || status === 'offline') return { label: 'オフライン', message: 'オンラインへ戻ると再生できます。' };
    if (needsGesture && interrupted) return { label: '再開してください', message: '外部アプリで再生が中断されました。再生ボタンを押してください。' };
    if (needsGesture) return { label: '操作が必要', message: 'iPhoneでは、この画面の再生ボタンを押してください。' };
    if (interrupted) return { label: '再開中', message: '外部アプリから戻りました。ラジオを再開しています…' };
    if (status === 'playing') return { label: '再生中', message: `${currentStation().name}を再生しています` };
    if (status === 'loading') return { label: '接続中', message: '放送局へ接続しています…' };
    if (status === 'error') return { label: '接続できません', message: '直接再生できません。オンライン状態を確認し、公式ページをお試しください。' };
    return { label: '停止中', message: '再生ボタンを押してください' };
  }
  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const station = currentStation();
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackTitle || station.name,
        artist: trackArtist || `${station.city}・${station.country}`,
        album: trackTitle ? `${station.name}｜MARKET BASE 世界のラジオ` : 'MARKET BASE 世界のラジオ',
        artwork: [
          { src: new URL('../icons/market-base-icon-192.png', location.href).href, sizes: '192x192', type: 'image/png' },
          { src: new URL('../icons/market-base-icon-512.png', location.href).href, sizes: '512x512', type: 'image/png' }
        ]
      });
      navigator.mediaSession.playbackState = status === 'playing' ? 'playing' : status === 'loading' ? 'none' : 'paused';
    } catch (_) {}
  }
  function render() {
    const station = currentStation();
    const copy = statusCopy();
    stationName.textContent = station.name;
    stationPlace.textContent = `${station.city.toUpperCase()} · ${station.country.toUpperCase()}`;
    stationDescription.textContent = station.description;
    stationSelect.value = station.id;
    document.title = `${station.name}｜世界のラジオ｜MARKET BASE`;
    const online = navigator.onLine;
    if (online) {
      officialLink.href = station.official;
      officialLink.removeAttribute('aria-disabled');
      officialLink.tabIndex = 0;
      officialLink.textContent = '直接再生できない場合は公式ページを開く';
    } else {
      officialLink.removeAttribute('href');
      officialLink.setAttribute('aria-disabled', 'true');
      officialLink.tabIndex = -1;
      officialLink.textContent = '公式ページはオンライン時に利用できます';
    }
    liveState.textContent = copy.label;
    liveState.dataset.state = !online ? 'offline' : needsGesture ? 'gesture' : status;
    setMessage(copy.message);
    const active = status === 'playing' || status === 'loading';
    playPause.disabled = !online;
    playPause.setAttribute('aria-pressed', String(active));
    playPause.setAttribute('aria-label', active ? '再生を停止する' : '再生する');
    playIcon.textContent = active ? 'Ⅱ' : '▶';
    playLabel.textContent = online ? (active ? '停止' : '再生') : 'オフライン';
    renderMetadata();
    updateMediaSession();
  }
  function confirmPlaybackFromMedia() {
    if (!playIntent || audio.paused || audio.ended || !navigator.onLine) return false;
    const mediaTime = Number(audio.currentTime || 0);
    const hasMedia = audio.readyState >= 2 || mediaTime > lastConfirmedMediaTime;
    if (!hasMedia) return false;
    lastConfirmedMediaTime = Math.max(lastConfirmedMediaTime, mediaTime);
    if (status !== 'playing' || needsGesture || interrupted || resumeAfterInterruption) {
      status = 'playing';
      needsGesture = false;
      interrupted = false;
      resumeAfterInterruption = false;
      recoveryInFlight = false;
      render();
      publishState();
    }
    return true;
  }
  function claimPlayer() {
    ownsState = true;
    const message = { type: 'CLAIM', instanceId, id: `${instanceId}-claim-${Date.now()}`, sentAt: Date.now() };
    try { channel?.postMessage(message); } catch (_) {}
    storageSet(COMMAND_KEY, JSON.stringify(message));
  }
  function pauseForNewPlayer() {
    ownsState = false; playIntent = false; status = navigator.onLine ? 'paused' : 'offline'; needsGesture = false;
    suppressPauseEvent = true; if (!audio.paused) audio.pause(); suppressPauseEvent = false;
    destroyHls(); render(); publishRelease();
  }
  function setStation(index, options = {}) {
    const normalized = (index + stations.length) % stations.length;
    const shouldResume = !!options.resume;
    if (options.markActivity) claimPlayer();
    currentIndex = normalized; playIntent = false; needsGesture = false;
    activeStreamIndex = 0;
    status = navigator.onLine ? 'paused' : 'offline';
    suppressPauseEvent = true; audio.pause(); suppressPauseEvent = false;
    destroyHls(); clearMetadata(); render(); publishState();
    if (options.markActivity) markActive();
    if (shouldResume && navigator.onLine) playCurrent(options.origin || 'station-change');
  }
  async function startAudioPlayback() {
    try {
      const result = audio.play();
      if (result && typeof result.then === 'function') await result;
    } catch (error) {
      playIntent = false; status = navigator.onLine ? 'paused' : 'offline';
      needsGesture = error?.name === 'NotAllowedError'; render(); publishState();
    }
  }
  async function playCurrent(origin = 'button') {
    if (!navigator.onLine) { status = 'offline'; playIntent = false; render(); publishState(); return; }
    claimPlayer();
    if (['button','select','step'].includes(origin)) markActive();
    needsGesture = false; interrupted = false; resumeAfterInterruption = false; playIntent = true; status = 'loading'; render(); publishState();
    const station = currentStation();
    if (!prepareStream(station)) {
      playIntent = false; status = 'error'; render(); publishState(); return;
    }
    const candidate = activeStream(station);
    if (candidate?.type !== 'hls' || audio.src) await startAudioPlayback();
  }
  function pauseCurrent(markActivity = false) {
    resumeAfterInterruption = false; interrupted = false; playIntent = false; needsGesture = false; audio.pause(); status = navigator.onLine ? 'paused' : 'offline';
    if (markActivity) markActive(); render(); publishState();
  }
  function stepStation(offset, origin = 'step') {
    const resume = playIntent || status === 'playing' || status === 'loading';
    setStation(currentIndex + offset, { resume, origin, markActivity: origin === 'step' });
  }
  function acknowledge(command) {
    const state = publishState();
    try { channel?.postMessage({ type: 'ACK', commandId: command.id || '', instanceId, state }); } catch (_) {}
  }
  function handleSignal(message) {
    if (!message || message.instanceId === instanceId) return;
    if (message.type === 'CLAIM') { pauseForNewPlayer(); return; }
    if (message.type !== 'COMMAND') return;
    if (message.targetInstanceId && message.targetInstanceId !== instanceId) return;
    if (message.id && message.id === lastCommandId) return;
    lastCommandId = message.id || '';
    if (!navigator.onLine) { status = 'offline'; render(); acknowledge(message); return; }
    if (message.action === 'pause' || message.action === 'stop') pauseCurrent(false);
    else if (message.action === 'previous') stepStation(-1, 'remote');
    else if (message.action === 'next') stepStation(1, 'remote');
    else if (message.action === 'resume' || message.action === 'play') playCurrent('recovery');
    else if (message.action === 'toggle') (status === 'playing' || status === 'loading') ? pauseCurrent(false) : playCurrent('remote');
    acknowledge(message);
  }
  function initializeSignals() {
    if ('BroadcastChannel' in window) {
      try { channel = new BroadcastChannel(CHANNEL_NAME); channel.addEventListener('message', event => handleSignal(event.data)); } catch (_) {}
    }
    window.addEventListener('storage', event => {
      if (event.key === COMMAND_KEY && event.newValue) { try { handleSignal(JSON.parse(event.newValue)); } catch (_) {} }
      if (event.key === STATE_KEY && event.newValue) {
        try { const state = JSON.parse(event.newValue); if (state?.instanceId && state.instanceId !== instanceId && state.playing) pauseForNewPlayer(); } catch (_) {}
      }
    });
  }
  function initializeMediaSessionActions() {
    if (!('mediaSession' in navigator)) return;
    const actions = { play: () => playCurrent('media-session'), pause: () => pauseCurrent(false), stop: () => pauseCurrent(false), previoustrack: () => stepStation(-1, 'media-session'), nexttrack: () => stepStation(1, 'media-session') };
    Object.entries(actions).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) {} });
  }

  stationSelect.innerHTML = stations.map(station => `<option value="${station.id}">${station.name}｜${station.country}</option>`).join('');
  playPause.addEventListener('click', () => (status === 'playing' || status === 'loading') ? pauseCurrent(true) : playCurrent('button'));
  previousStation.addEventListener('click', () => stepStation(-1, 'step'));
  nextStation.addEventListener('click', () => stepStation(1, 'step'));
  stationSelect.addEventListener('change', () => {
    const nextIndex = stations.findIndex(station => station.id === stationSelect.value);
    if (nextIndex < 0) return;
    const resume = playIntent || status === 'playing' || status === 'loading';
    setStation(nextIndex, { resume, origin: 'select', markActivity: true });
  });
  closeButton.addEventListener('click', () => {
    shuttingDown = true; pauseCurrent(true); destroyHls(); publishRelease(); window.close();
    window.setTimeout(() => { if (!window.closed) setMessage('ブラウザのタブを閉じてください。'); }, 150);
  });
  audio.addEventListener('playing', () => {
    window.clearTimeout(streamWatchdog); streamWatchdog = 0;
    playIntent = true; needsGesture = false; interrupted = false;
    resumeAfterInterruption = false; recoveryInFlight = false; status = 'playing';
    lastConfirmedMediaTime = Math.max(lastConfirmedMediaTime, Number(audio.currentTime || 0));
    render(); publishState();
  });
  audio.addEventListener('timeupdate', confirmPlaybackFromMedia);
  audio.addEventListener('canplay', confirmPlaybackFromMedia);
  audio.addEventListener('progress', confirmPlaybackFromMedia);
  audio.addEventListener('waiting', () => { if (playIntent) { status = 'loading'; render(); publishState(); } });
  audio.addEventListener('stalled', () => { if (playIntent) { status = 'loading'; render(); publishState(); } });
  audio.addEventListener('pause', () => { if (!shuttingDown && !suppressPauseEvent) { if (document.hidden && resumeAfterInterruption) { interrupted = true; status = navigator.onLine ? 'interrupted' : 'offline'; } else { playIntent = false; status = navigator.onLine ? 'paused' : 'offline'; } render(); publishState(); } });
  audio.addEventListener('ended', () => { playIntent = false; status = navigator.onLine ? 'paused' : 'offline'; render(); publishState(); });
  audio.addEventListener('error', () => { if (!shuttingDown && !hls && playIntent) tryNextStream('audio-error'); });
  officialLink.addEventListener('click', event => { if (!navigator.onLine) event.preventDefault(); });

  function handleOffline() {
    playIntent = false; needsGesture = false; suppressPauseEvent = true; audio.pause(); suppressPauseEvent = false;
    destroyHls(); clearMetadata(); status = 'offline'; render(); publishState();
  }
  function handleOnline() { status = 'paused'; render(); publishState(); }
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);

  initializeSignals(); initializeMediaSessionActions();
  const params = new URLSearchParams(location.search);
  const requestedIndex = stations.findIndex(station => station.id === params.get('id'));
  setStation(requestedIndex >= 0 ? requestedIndex : 0);
  claimPlayer(); publishState();
  if (params.get('autoplay') === '1' && navigator.onLine) playCurrent('button');
  window.setInterval(() => {
    if (!shuttingDown && ownsState) {
      if (!confirmPlaybackFromMedia()) publishState();
    }
  }, HEARTBEAT_MS);
  async function recoverAfterExternalApp() {
    if (recoveryInFlight || shuttingDown || !ownsState || !navigator.onLine || !resumeAfterInterruption) return;
    recoveryInFlight = true; interrupted = true; status = 'loading'; render(); publishState();
    try {
      const station = currentStation();
      if (!prepareStream(station)) throw new Error('stream-unavailable');
      await startAudioPlayback();
      if (!audio.paused) { interrupted = false; resumeAfterInterruption = false; }
    } catch (_) {
      interrupted = true; needsGesture = true; status = 'paused';
    } finally {
      recoveryInFlight = false; render(); publishState();
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (shuttingDown || !ownsState) return;
    if (document.hidden) {
      resumeAfterInterruption = !!(playIntent || status === 'playing' || status === 'loading');
      if (resumeAfterInterruption) interrupted = true;
      publishState();
    } else {
      recoverAfterExternalApp();
      publishState();
    }
  });
  window.addEventListener('pageshow', () => recoverAfterExternalApp());
  window.addEventListener('pagehide', event => {
    if (event.persisted) { if (ownsState) publishState(); return; }
    shuttingDown = true; destroyHls(); publishRelease(); try { channel?.close(); } catch (_) {}
  }, { once: true });
})();
