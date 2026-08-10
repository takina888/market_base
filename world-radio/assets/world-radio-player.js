(() => {
  'use strict';

  const stations = Array.isArray(window.MarketBaseRadioStations) ? window.MarketBaseRadioStations : [];
  const STATE_KEY = 'market_base_radio_state_v1';
  const COMMAND_KEY = 'market_base_radio_command_v1';
  const LAST_ACTIVE_KEY = 'market_base_last_active_at_v1';
  const CHANNEL_NAME = 'market-base-radio-v1';
  const HEARTBEAT_MS = 15000;
  const STATE_TTL_MS = 180000;
  const HLS_LIBRARY_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.16/dist/hls.min.js';
  const HLS_LIBRARY_TIMEOUT_MS = 12000;
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
  let ignoredPauseEvents = 0;
  let pauseSuppressionHandle = 0;
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
  let playbackGeneration = 0;
  let activeMediaGeneration = 0;
  let playRequestedGeneration = 0;
  let hlsLibraryPromise = null;
  let hlsLibraryLoadingGeneration = 0;

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

  function nextPlaybackGeneration() {
    playbackGeneration += 1;
    activeMediaGeneration = 0;
    playRequestedGeneration = 0;
    return playbackGeneration;
  }
  function playbackIsCurrent(generation) {
    return !!(
      generation &&
      generation === playbackGeneration &&
      generation === activeMediaGeneration &&
      !shuttingDown
    );
  }
  function resetPlaybackRate() {
    try { audio.defaultPlaybackRate = 1; } catch (_) {}
    try { audio.playbackRate = 1; } catch (_) {}
  }
  function loadHlsLibrary() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsLibraryPromise) return hlsLibraryPromise;
    hlsLibraryPromise = new Promise((resolve, reject) => {
      const stale = document.querySelector?.('script[data-market-base-hls-runtime]');
      stale?.remove?.();
      const script = document.createElement('script');
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        script.onload = null;
        script.onerror = null;
        if (error) {
          script.remove?.();
          reject(error);
          return;
        }
        if (!window.Hls) {
          script.remove?.();
          reject(new Error('hls.js loaded without exposing Hls'));
          return;
        }
        resolve(window.Hls);
      };
      const timeout = window.setTimeout(
        () => finish(new Error('hls.js load timed out')),
        HLS_LIBRARY_TIMEOUT_MS
      );
      script.src = HLS_LIBRARY_URL;
      script.async = true;
      script.dataset.marketBaseHlsRuntime = 'true';
      script.onload = () => finish();
      script.onerror = () => finish(new Error('hls.js could not be loaded'));
      (document.head || document.documentElement).appendChild(script);
    }).catch(error => {
      hlsLibraryPromise = null;
      throw error;
    });
    return hlsLibraryPromise;
  }
  function destroyHls() {
    window.clearTimeout(streamWatchdog);
    streamWatchdog = 0;
    if (hls) { try { hls.destroy(); } catch (_) {} hls = null; }
    preparedStationId = '';
    hlsRecoveryCount = 0;
    hlsLibraryLoadingGeneration = 0;
    audio.removeAttribute('src');
    try { audio.load(); } catch (_) {}
    lastConfirmedMediaTime = 0;
    resetPlaybackRate();
  }
  function disconnectLiveTransport() {
    const pauseWasRequested = !audio.paused;
    if (pauseWasRequested) {
      ignoredPauseEvents += 1;
      window.clearTimeout(pauseSuppressionHandle);
      pauseSuppressionHandle = window.setTimeout(() => {
        ignoredPauseEvents = 0;
        pauseSuppressionHandle = 0;
      }, 1000);
      try {
        audio.pause();
      } catch (_) {
        ignoredPauseEvents = Math.max(0, ignoredPauseEvents - 1);
      }
    }
    destroyHls();
  }
  function stopLiveTransport() {
    nextPlaybackGeneration();
    playIntent = false;
    recoveryInFlight = false;
    disconnectLiveTransport();
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
  function armStreamWatchdog(generation) {
    window.clearTimeout(streamWatchdog);
    streamWatchdog = window.setTimeout(() => {
      if (playbackIsCurrent(generation) && playIntent && status === 'loading') {
        tryNextStream('timeout', generation);
      }
    }, 18000);
  }
  function tryNextStream(_reason = 'error', expectedGeneration = playbackGeneration) {
    if (!playbackIsCurrent(expectedGeneration)) return false;
    const station = currentStation();
    const candidates = streamCandidates(station);
    if (!playIntent || activeStreamIndex + 1 >= candidates.length) {
      stopLiveTransport(); needsGesture = false; status = navigator.onLine ? 'error' : 'offline';
      render(); publishState();
      return false;
    }
    activeStreamIndex += 1;
    const generation = nextPlaybackGeneration();
    playIntent = false;
    recoveryInFlight = false;
    disconnectLiveTransport();
    activeMediaGeneration = generation;
    playIntent = true;
    status = 'loading'; render(); publishState();
    if (!prepareStream(station, generation)) { tryNextStream('unsupported', generation); return false; }
    const candidate = activeStream(station);
    if (!hlsPlaybackStartsFromTransport(candidate, generation)) startAudioPlayback(generation);
    return true;
  }
  function prepareRegular(station, generation) {
    if (!playbackIsCurrent(generation)) return;
    const candidate = activeStream(station);
    if (!candidate) return;
    if (preparedStationId === preparedKey(station) && audio.src) return;
    destroyHls();
    audio.src = candidate.url;
    audio.load();
    preparedStationId = preparedKey(station);
    resetPlaybackRate();
    armStreamWatchdog(generation);
  }
  function prepareHls(station, generation) {
    if (!playbackIsCurrent(generation)) return false;
    const candidate = activeStream(station);
    if (!candidate) return false;
    if (preparedStationId === preparedKey(station) && (hls || audio.src)) return true;
    destroyHls();
    const nativeHls = audio.canPlayType('application/vnd.apple.mpegurl') || audio.canPlayType('application/x-mpegURL');
    if (nativeHls) {
      audio.src = candidate.url;
      audio.load();
      preparedStationId = preparedKey(station);
      resetPlaybackRate();
      armStreamWatchdog(generation);
      return true;
    }
    if (!window.Hls) {
      hlsLibraryLoadingGeneration = generation;
      armStreamWatchdog(generation);
      loadHlsLibrary().then(() => {
        if (!playbackIsCurrent(generation) || hlsLibraryLoadingGeneration !== generation) return;
        hlsLibraryLoadingGeneration = 0;
        if (!prepareHls(station, generation)) tryNextStream('hls-library-unsupported', generation);
      }).catch(error => {
        if (!playbackIsCurrent(generation) || hlsLibraryLoadingGeneration !== generation) return;
        hlsLibraryLoadingGeneration = 0;
        console.warn('MARKET BASE radio could not load hls.js; trying the next stream.', error);
        tryNextStream('hls-library-error', generation);
      });
      return true;
    }
    if (!window.Hls.isSupported()) return false;
    const transport = new window.Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 30 });
    hls = transport;
    transport.attachMedia(audio);
    transport.on(window.Hls.Events.MEDIA_ATTACHED, () => {
      if (hls === transport && playbackIsCurrent(generation)) transport.loadSource(candidate.url);
    });
    transport.on(window.Hls.Events.MANIFEST_PARSED, () => {
      if (hls === transport && playbackIsCurrent(generation) && playIntent && navigator.onLine) {
        startAudioPlayback(generation);
      }
    });
    transport.on(window.Hls.Events.FRAG_PARSING_METADATA, (_event, data) => {
      if (hls !== transport || !playbackIsCurrent(generation)) return;
      (data?.samples || []).forEach(sample => {
        const parsed = parseId3(sample.data);
        if (parsed.title) normalizeMetadata(parsed.title, parsed.artist, '放送ストリームの曲名情報');
      });
    });
    transport.on(window.Hls.Events.ERROR, (_event, data) => {
      if (hls !== transport || !playbackIsCurrent(generation) || !data?.fatal) return;
      if (hlsRecoveryCount < 2 && data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
        hlsRecoveryCount += 1; transport.startLoad(); return;
      }
      if (hlsRecoveryCount < 2 && data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
        hlsRecoveryCount += 1; transport.recoverMediaError(); return;
      }
      tryNextStream('hls-fatal', generation);
    });
    preparedStationId = preparedKey(station);
    resetPlaybackRate();
    armStreamWatchdog(generation);
    return true;
  }
  function hlsPlaybackStartsFromTransport(candidate, generation) {
    return candidate?.type === 'hls' && (!!hls || hlsLibraryLoadingGeneration === generation);
  }
  function prepareStream(station, generation) {
    const candidate = activeStream(station);
    if (!candidate) return false;
    return candidate.type === 'hls'
      ? prepareHls(station, generation)
      : (prepareRegular(station, generation), playbackIsCurrent(generation));
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
    if (
      !playbackIsCurrent(activeMediaGeneration) ||
      !playIntent ||
      audio.paused ||
      audio.ended ||
      !navigator.onLine
    ) return false;
    const mediaTime = Number(audio.currentTime || 0);
    const hasMedia = audio.readyState >= 2 || mediaTime > lastConfirmedMediaTime;
    if (!hasMedia) return false;
    resetPlaybackRate();
    lastConfirmedMediaTime = Math.max(lastConfirmedMediaTime, mediaTime);
    if (
      status !== 'playing' ||
      needsGesture ||
      interrupted ||
      (resumeAfterInterruption && !document.hidden)
    ) {
      status = 'playing';
      needsGesture = false;
      interrupted = false;
      resumeAfterInterruption = document.hidden;
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
    ownsState = false; needsGesture = false; interrupted = false; resumeAfterInterruption = false;
    stopLiveTransport(); status = navigator.onLine ? 'paused' : 'offline';
    render(); publishRelease();
  }
  function setStation(index, options = {}) {
    const normalized = (index + stations.length) % stations.length;
    const shouldResume = !!options.resume;
    if (options.markActivity) claimPlayer();
    stopLiveTransport();
    currentIndex = normalized; needsGesture = false; interrupted = false; resumeAfterInterruption = false;
    activeStreamIndex = 0;
    status = navigator.onLine ? 'paused' : 'offline';
    clearMetadata(); render(); publishState();
    if (options.markActivity) markActive();
    if (shouldResume && navigator.onLine) playCurrent(options.origin || 'station-change');
  }
  async function startAudioPlayback(generation) {
    if (!playbackIsCurrent(generation) || !playIntent || !navigator.onLine) return false;
    resetPlaybackRate();
    try {
      playRequestedGeneration = generation;
      const result = audio.play();
      if (result && typeof result.then === 'function') await result;
      if (!playbackIsCurrent(generation) || !playIntent) return false;
      resetPlaybackRate();
      return !audio.paused;
    } catch (error) {
      if (!playbackIsCurrent(generation) || !playIntent) return false;
      const gestureRequired = error?.name === 'NotAllowedError';
      stopLiveTransport();
      status = navigator.onLine ? 'paused' : 'offline';
      needsGesture = gestureRequired; render(); publishState();
      return false;
    }
  }
  async function playCurrent(origin = 'button') {
    if (!navigator.onLine) {
      interrupted = false; resumeAfterInterruption = false; needsGesture = false;
      stopLiveTransport(); status = 'offline'; render(); publishState(); return false;
    }
    if (
      playIntent &&
      status === 'playing' &&
      !audio.paused &&
      !interrupted &&
      playbackIsCurrent(activeMediaGeneration)
    ) {
      resetPlaybackRate();
      return true;
    }
    const generation = nextPlaybackGeneration();
    playIntent = false;
    recoveryInFlight = false;
    disconnectLiveTransport();
    activeMediaGeneration = generation;
    claimPlayer();
    if (['button','select','step'].includes(origin)) markActive();
    needsGesture = false; interrupted = false; resumeAfterInterruption = document.hidden;
    playIntent = true; status = 'loading'; render(); publishState();
    const station = currentStation();
    if (!prepareStream(station, generation)) {
      if (!playbackIsCurrent(generation)) return false;
      stopLiveTransport(); status = 'error'; render(); publishState(); return false;
    }
    const candidate = activeStream(station);
    if (!hlsPlaybackStartsFromTransport(candidate, generation)) return startAudioPlayback(generation);
    return true;
  }
  function pauseCurrent(markActivity = false) {
    resumeAfterInterruption = false; interrupted = false; needsGesture = false;
    stopLiveTransport(); status = navigator.onLine ? 'paused' : 'offline';
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
    else if (message.action === 'resume' && resumeAfterInterruption) recoverAfterExternalApp();
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
    const actions = {
      play: () => playCurrent('media-session'),
      pause: () => pauseCurrent(false),
      stop: () => pauseCurrent(false),
      previoustrack: () => stepStation(-1, 'media-session'),
      nexttrack: () => stepStation(1, 'media-session'),
      /* iOS commonly renders live web audio with ±10-second controls instead
         of previous/next. Seeking has no useful meaning for a live station,
         so treat those Media Session commands as station navigation too. */
      seekbackward: () => stepStation(-1, 'media-session'),
      seekforward: () => stepStation(1, 'media-session')
    };
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
    shuttingDown = true; pauseCurrent(true); publishRelease(); window.close();
    window.setTimeout(() => { if (!window.closed) setMessage('ブラウザのタブを閉じてください。'); }, 150);
  });
  audio.addEventListener('playing', () => {
    if (
      !playbackIsCurrent(activeMediaGeneration) ||
      playRequestedGeneration !== activeMediaGeneration ||
      !playIntent ||
      audio.paused ||
      audio.ended ||
      !navigator.onLine
    ) return;
    window.clearTimeout(streamWatchdog); streamWatchdog = 0;
    resetPlaybackRate();
    playIntent = true; needsGesture = false; interrupted = false;
    resumeAfterInterruption = document.hidden; recoveryInFlight = false; status = 'playing';
    lastConfirmedMediaTime = Math.max(lastConfirmedMediaTime, Number(audio.currentTime || 0));
    render(); publishState();
  });
  audio.addEventListener('timeupdate', confirmPlaybackFromMedia);
  audio.addEventListener('canplay', confirmPlaybackFromMedia);
  audio.addEventListener('progress', confirmPlaybackFromMedia);
  audio.addEventListener('waiting', () => {
    if (playbackIsCurrent(activeMediaGeneration) && playIntent) {
      status = 'loading'; render(); publishState();
    }
  });
  audio.addEventListener('stalled', () => {
    if (playbackIsCurrent(activeMediaGeneration) && playIntent) {
      status = 'loading'; render(); publishState();
    }
  });
  audio.addEventListener('pause', () => {
    if (ignoredPauseEvents > 0) {
      ignoredPauseEvents -= 1;
      if (ignoredPauseEvents === 0) {
        window.clearTimeout(pauseSuppressionHandle);
        pauseSuppressionHandle = 0;
      }
      return;
    }
    if (
      shuttingDown ||
      !audio.paused ||
      !playbackIsCurrent(activeMediaGeneration)
    ) return;
    if (document.hidden && resumeAfterInterruption && playIntent) {
      nextPlaybackGeneration();
      disconnectLiveTransport();
      playIntent = true;
      recoveryInFlight = false;
      interrupted = true;
      status = navigator.onLine ? 'interrupted' : 'offline';
    } else {
      stopLiveTransport();
      resumeAfterInterruption = false;
      interrupted = false;
      status = navigator.onLine ? 'paused' : 'offline';
    }
    render(); publishState();
  });
  audio.addEventListener('ended', () => {
    if (!audio.ended || !playbackIsCurrent(activeMediaGeneration)) return;
    stopLiveTransport(); interrupted = false; resumeAfterInterruption = false;
    status = navigator.onLine ? 'paused' : 'offline'; render(); publishState();
  });
  audio.addEventListener('error', () => {
    const generation = activeMediaGeneration;
    if (!hls && playbackIsCurrent(generation) && playIntent) {
      tryNextStream('audio-error', generation);
    }
  });
  officialLink.addEventListener('click', event => { if (!navigator.onLine) event.preventDefault(); });

  function handleOffline() {
    needsGesture = false; interrupted = false; resumeAfterInterruption = false;
    stopLiveTransport(); clearMetadata(); status = 'offline'; render(); publishState();
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
    if (
      playIntent &&
      !audio.paused &&
      !audio.ended &&
      playbackIsCurrent(activeMediaGeneration)
    ) {
      resetPlaybackRate();
      interrupted = false;
      resumeAfterInterruption = document.hidden;
      status = 'playing';
      render(); publishState();
      return;
    }
    const generation = nextPlaybackGeneration();
    playIntent = false;
    disconnectLiveTransport();
    activeMediaGeneration = generation;
    playIntent = true;
    recoveryInFlight = true; interrupted = true; status = 'loading'; render(); publishState();
    try {
      const station = currentStation();
      if (!prepareStream(station, generation)) throw new Error('stream-unavailable');
      const candidate = activeStream(station);
      const started = hlsPlaybackStartsFromTransport(candidate, generation)
        ? true
        : await startAudioPlayback(generation);
      if (!playbackIsCurrent(generation)) return;
      if (started && !audio.paused) {
        resetPlaybackRate();
        interrupted = false;
        resumeAfterInterruption = document.hidden;
      }
    } catch (_) {
      if (!playbackIsCurrent(generation)) return;
      interrupted = true; needsGesture = true; status = 'paused';
    } finally {
      if (playbackIsCurrent(generation)) {
        recoveryInFlight = false; render(); publishState();
      }
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (shuttingDown || !ownsState) return;
    if (document.hidden) {
      resumeAfterInterruption = !!(playIntent || status === 'playing' || status === 'loading');
      publishState();
    } else {
      recoverAfterExternalApp();
      publishState();
    }
  });
  window.addEventListener('pageshow', () => recoverAfterExternalApp());
  window.addEventListener('pagehide', event => {
    if (event.persisted) {
      if (ownsState) {
        resumeAfterInterruption = !!(
          resumeAfterInterruption ||
          playIntent ||
          status === 'playing' ||
          status === 'loading'
        );
        publishState();
      }
      return;
    }
    shuttingDown = true;
    stopLiveTransport();
    publishRelease();
    try { channel?.close(); } catch (_) {}
    channel = null;
  });
})();
