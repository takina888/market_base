#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const stationsSource = read('world-radio/assets/world-radio-stations.js');
const playerSource = read('world-radio/assets/world-radio-player.js');
const STATE_KEY = 'market_base_radio_state_v1';

class StorageMock {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

class EventTargetMock {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, handler, options = {}) {
    const records = this.listeners.get(type) || [];
    records.push({ handler, once: options === true || !!options?.once });
    this.listeners.set(type, records);
  }
  dispatch(type, event = {}) {
    const records = [...(this.listeners.get(type) || [])];
    for (const record of records) {
      event.type ||= type;
      event.currentTarget ||= this;
      record.handler.call(this, event);
      if (record.once) {
        const active = this.listeners.get(type) || [];
        this.listeners.set(type, active.filter(item => item !== record));
      }
    }
  }
}

class ElementMock extends EventTargetMock {
  constructor() {
    super();
    this.attributes = new Map();
    this.dataset = {};
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.href = '';
    this.hidden = false;
    this.disabled = false;
    this.tabIndex = 0;
  }
  setAttribute(name, value) {
    this.attributes.set(String(name), String(value));
    if (name === 'href') this.href = String(value);
  }
  getAttribute(name) { return this.attributes.get(String(name)) ?? null; }
  removeAttribute(name) {
    this.attributes.delete(String(name));
    if (name === 'href') this.href = '';
  }
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

class AudioMock extends ElementMock {
  constructor() {
    super();
    this._src = '';
    this.srcAssignments = [];
    this.removeSrcCount = 0;
    this.loadCount = 0;
    this.pauseCount = 0;
    this.playCount = 0;
    this.playQueue = [];
    this.delayPauseEvents = false;
    this.delayedPauseEvents = [];
    this.paused = true;
    this.ended = false;
    this.readyState = 4;
    this.currentTime = 0;
    this.playbackRate = 4;
    this.defaultPlaybackRate = 4;
  }
  get src() { return this._src; }
  set src(value) {
    this._src = String(value || '');
    if (this._src) this.srcAssignments.push(this._src);
  }
  queuePlay() {
    const pending = deferred();
    this.playQueue.push(pending);
    return pending;
  }
  play() {
    this.playCount += 1;
    this.paused = false;
    const pending = this.playQueue.shift();
    assert.ok(pending, `unexpected audio.play() call #${this.playCount}`);
    return pending.promise;
  }
  pause() {
    this.pauseCount += 1;
    const wasPaused = this.paused;
    this.paused = true;
    if (!wasPaused) {
      if (this.delayPauseEvents) this.delayedPauseEvents.push(() => this.dispatch('pause', {}));
      else this.dispatch('pause', {});
    }
  }
  load() { this.loadCount += 1; }
  canPlayType() { return ''; }
  removeAttribute(name) {
    super.removeAttribute(name);
    if (name === 'src') {
      this._src = '';
      this.removeSrcCount += 1;
    }
  }
  externalPause() {
    this.paused = true;
    this.dispatch('pause', {});
  }
  flushDelayedPause() {
    const callback = this.delayedPauseEvents.shift();
    assert.ok(callback, 'no delayed pause event is queued');
    callback();
  }
}

function createRuntime() {
  let now = 1_800_000_000_000;
  let timerId = 0;
  const timers = new Map();
  const ids = [
    'stationName', 'stationPlace', 'stationDescription', 'stationSelect',
    'openOfficial', 'liveState', 'playerMessage', 'playPause', 'playIcon',
    'playLabel', 'previousStation', 'nextStation', 'windowClose',
    'nowPlayingMeta', 'nowPlayingTitle', 'nowPlayingArtist', 'nowPlayingSource'
  ];
  const elements = Object.fromEntries(ids.map(id => [id, new ElementMock()]));
  const audio = new AudioMock();
  elements.radioAudio = audio;
  const documentTarget = new EventTargetMock();
  const windowTarget = new EventTargetMock();
  const localStorage = new StorageMock();

  const document = {
    title: '',
    hidden: false,
    getElementById(id) { return elements[id] || null; },
    addEventListener: documentTarget.addEventListener.bind(documentTarget)
  };
  const location = {
    href: 'https://example.test/market-base/world-radio/player.html?id=wnyc',
    search: '?id=wnyc'
  };
  const runtime = {
    URL,
    URLSearchParams,
    TextDecoder,
    console,
    localStorage,
    location,
    navigator: { onLine: true },
    document,
    Date: { now: () => now },
    addEventListener: windowTarget.addEventListener.bind(windowTarget),
    setTimeout(callback, delay = 0) {
      const id = ++timerId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    setInterval() { return ++timerId; },
    clearInterval() {},
    close() {},
    closed: false
  };
  runtime.window = runtime;

  vm.createContext(runtime);
  vm.runInContext(stationsSource, runtime, { filename: 'world-radio-stations.js' });
  vm.runInContext(playerSource, runtime, { filename: 'world-radio-player.js' });

  return {
    runtime,
    elements,
    audio,
    localStorage,
    state() {
      const saved = localStorage.getItem(STATE_KEY);
      return saved ? JSON.parse(saved) : null;
    },
    advance(milliseconds) { now += milliseconds; },
    dispatchWindow(type, event = {}) { windowTarget.dispatch(type, event); },
    dispatchDocument(type, event = {}) { documentTarget.dispatch(type, event); },
    setHidden(hidden) { document.hidden = !!hidden; }
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));
}

async function confirmPlaying(harness, pending) {
  pending.resolve();
  await flushPromises();
  harness.audio.dispatch('playing', {});
  await flushPromises();
  assert.equal(harness.state()?.status, 'playing');
}

// A deliberate pause must tear down the live connection. A later play of the
// same station must assign the URL and load a brand-new transport rather than
// resuming a stale live buffer.
{
  const harness = createRuntime();
  const firstPlay = harness.audio.queuePlay();
  harness.elements.playPause.dispatch('click', {});
  await confirmPlaying(harness, firstPlay);

  const assignmentsAfterFirstPlay = harness.audio.srcAssignments.length;
  const loadsAfterFirstPlay = harness.audio.loadCount;
  assert.ok(assignmentsAfterFirstPlay >= 1, 'first play must assign a stream URL');

  harness.elements.playPause.dispatch('click', {});
  await flushPromises();
  assert.equal(harness.state()?.status, 'paused');
  assert.equal(harness.audio.src, '', 'pause must remove the live audio source');
  assert.ok(harness.audio.loadCount > loadsAfterFirstPlay, 'pause must load() after source removal');

  harness.advance(30 * 60 * 1000);
  const resumedPlay = harness.audio.queuePlay();
  harness.elements.playPause.dispatch('click', {});
  assert.ok(
    harness.audio.srcAssignments.length > assignmentsAfterFirstPlay,
    'same-station resume after time elapsed must assign a fresh stream URL'
  );
  assert.ok(harness.audio.loadCount > loadsAfterFirstPlay + 1, 'resume must load a fresh transport');
  assert.equal(harness.audio.playbackRate, 1, 'fresh connection must reset playbackRate');
  assert.equal(harness.audio.defaultPlaybackRate, 1, 'fresh connection must reset defaultPlaybackRate');
  await confirmPlaying(harness, resumedPlay);
}

// An old play Promise may settle after one or more newer user operations. Its
// resolve/reject path must never overwrite the final operation's state.
{
  const harness = createRuntime();

  const staleResolve = harness.audio.queuePlay();
  harness.elements.playPause.dispatch('click', {});
  harness.elements.playPause.dispatch('click', {});
  assert.equal(harness.state()?.status, 'paused', 'pause must win while play() is pending');
  staleResolve.resolve();
  await flushPromises();
  harness.audio.dispatch('playing', {});
  assert.equal(harness.state()?.status, 'paused', 'late resolve must not resurrect paused playback');
  assert.equal(harness.audio.src, '', 'late resolve must not restore the discarded source');

  const staleReject = harness.audio.queuePlay();
  harness.elements.playPause.dispatch('click', {});
  harness.elements.playPause.dispatch('click', {});
  const newestPlay = harness.audio.queuePlay();
  harness.elements.playPause.dispatch('click', {});
  await confirmPlaying(harness, newestPlay);

  const abort = new Error('superseded play');
  abort.name = 'AbortError';
  staleReject.reject(abort);
  await flushPromises();
  assert.equal(harness.state()?.status, 'playing', 'stale rejection must not stop the newest play');
  assert.equal(harness.state()?.playing, true);
  assert.equal(harness.elements.playPause.getAttribute('aria-pressed'), 'true');
}

// Some engines deliver the pause event caused by teardown after a new play
// generation has already started. That old event must be consumed, not treated
// as an external interruption of the new transport.
{
  const harness = createRuntime();
  const firstPlay = harness.audio.queuePlay();
  harness.elements.playPause.dispatch('click', {});
  await confirmPlaying(harness, firstPlay);

  harness.audio.delayPauseEvents = true;
  harness.elements.playPause.dispatch('click', {});
  assert.equal(harness.state()?.status, 'paused');
  const newPlay = harness.audio.queuePlay();
  harness.elements.playPause.dispatch('click', {});
  await confirmPlaying(harness, newPlay);

  harness.audio.flushDelayedPause();
  await flushPromises();
  assert.equal(harness.state()?.status, 'playing', 'old programmatic pause event must not poison new play');
  assert.equal(harness.state()?.interrupted, false);
}

// Merely becoming hidden is not an interruption. An actual media pause while
// hidden is, and it must discard the transport so foreground recovery is fresh.
{
  const harness = createRuntime();
  const initialPlay = harness.audio.queuePlay();
  harness.elements.playPause.dispatch('click', {});
  await confirmPlaying(harness, initialPlay);
  const removalsBeforeHidden = harness.audio.removeSrcCount;

  harness.setHidden(true);
  harness.dispatchDocument('visibilitychange', {});
  assert.equal(harness.state()?.interrupted, false, 'hidden alone must not claim an interruption');
  assert.equal(harness.state()?.resumeRequested, true);
  assert.equal(harness.audio.removeSrcCount, removalsBeforeHidden, 'hidden alone must keep an audible transport');

  harness.audio.externalPause();
  await flushPromises();
  assert.equal(harness.state()?.interrupted, true, 'actual hidden media pause must mark interruption');
  assert.equal(harness.audio.src, '', 'interrupted live transport must be discarded');

  const recoveryPlay = harness.audio.queuePlay();
  harness.setHidden(false);
  harness.dispatchDocument('visibilitychange', {});
  await confirmPlaying(harness, recoveryPlay);
  assert.equal(harness.state()?.interrupted, false);
}

// A persisted pagehide is a bfcache suspension, not a final close. The same
// listener must still handle a later non-persisted pagehide and release state.
{
  const harness = createRuntime();
  const initialPlay = harness.audio.queuePlay();
  harness.elements.playPause.dispatch('click', {});
  await confirmPlaying(harness, initialPlay);
  const instanceId = harness.state()?.instanceId;

  harness.dispatchWindow('pagehide', { persisted: true });
  assert.equal(harness.state()?.instanceId, instanceId, 'bfcache pagehide must preserve ownership state');
  assert.notEqual(harness.audio.src, '', 'bfcache pagehide must not destroy the live transport');

  harness.dispatchWindow('pageshow', { persisted: true });
  await flushPromises();
  harness.dispatchWindow('pagehide', { persisted: false });
  assert.equal(harness.localStorage.getItem(STATE_KEY), null, 'final pagehide must release the player state');
  assert.equal(harness.audio.src, '', 'final pagehide must tear down the transport');
}

assert.match(playerSource, /let playbackGeneration = 0;/);
assert.match(playerSource, /let activeMediaGeneration = 0;/);
assert.match(playerSource, /let playRequestedGeneration = 0;/);
assert.match(playerSource, /let ignoredPauseEvents = 0;/);
assert.doesNotMatch(
  playerSource.match(/window\.addEventListener\('pagehide',[\s\S]*?\n  \}\);/)?.[0] || '',
  /once\s*:\s*true/,
  'pagehide must survive a persisted bfcache event'
);

console.log('PASS — V333.16 radio transport teardown, generation guard, interruption, and bfcache lifecycle');
