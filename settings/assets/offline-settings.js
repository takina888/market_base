(function (global) {
  'use strict';

  const STATE_KEY = 'market_base_offline_mode_v1';
  const TEXT_CACHE = 'mb-user-offline-v324-text';
  const IMAGE_CACHE = 'mb-user-offline-v324-images';
  const STATE_CACHE = 'mb-user-offline-v324-state';
  const STATE_REQUEST = new URL('../__market_base_offline_mode__', global.location.href).href;
  const SITE_ROOT = new URL('../', global.location.href);
  const MANIFEST = global.MARKET_BASE_OFFLINE_MANIFEST || {
    datePhotoWindowDays: 10,
    textAssets: [],
    supportAssets: [],
    localPhotoAssets: [],
    remotePhotoAliases: {}
  };
  const BUILD_ID = 'MARKET_BASE_V324_OFFLINE_RELIABLE_SAVE_20260730';
  const MAX_IMAGE_EDGE = 960;
  const IMAGE_QUALITY = 0.64;
  const MIN_FREE_BYTES = 8 * 1024 * 1024;

  const elements = {};
  let working = false;

  function $(id) {
    return document.getElementById(id);
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY) || 'null') || {
        enabled: false,
        pendingCleanup: false,
        phase: 'online'
      };
    } catch (_) {
      return { enabled: false, pendingCleanup: false, phase: 'online' };
    }
  }

  function writeState(next) {
    const state = { ...readState(), ...next, updatedAt: Date.now() };
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
    return state;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '—';
    try {
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(timestamp));
    } catch (_) {
      return '—';
    }
  }

  function formatBytes(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return '確認できません';
    if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB`;
    if (value >= 1024 ** 2) return `${Math.round(value / 1024 ** 2).toLocaleString('ja-JP')} MB`;
    return `${Math.round(value / 1024).toLocaleString('ja-JP')} KB`;
  }

  async function storageEstimate() {
    if (!navigator.storage?.estimate) {
      elements.storageSummary.textContent = '端末により確認できません';
      return null;
    }
    try {
      const estimate = await navigator.storage.estimate();
      const quota = Number(estimate.quota || 0);
      const usage = Number(estimate.usage || 0);
      const free = Math.max(0, quota - usage);
      elements.storageSummary.textContent = quota
        ? `${formatBytes(free)}（使用中 ${formatBytes(usage)}）`
        : '端末により確認できません';
      return { quota, usage, free };
    } catch (_) {
      elements.storageSummary.textContent = '端末により確認できません';
      return null;
    }
  }

  function setProgress(label, current, total, detail) {
    elements.saveProgress.hidden = false;
    elements.progressLabel.textContent = label;
    elements.progressCount.textContent = `${current.toLocaleString('ja-JP')} / ${total.toLocaleString('ja-JP')}`;
    elements.progressBar.max = Math.max(1, total);
    elements.progressBar.value = Math.min(Math.max(0, current), Math.max(1, total));
    elements.progressDetail.textContent = detail;
  }

  function updateUi(state = readState()) {
    const offline = !!state.enabled;
    const waiting = !!state.pendingCleanup;
    elements.modeBadge.classList.toggle('is-offline', offline || waiting);
    elements.switchOnlineButton.hidden = !(offline || waiting);
    elements.saveOfflineButton.hidden = waiting;

    if (working) {
      elements.saveOfflineButton.disabled = true;
      elements.switchOnlineButton.disabled = true;
    } else {
      elements.saveOfflineButton.disabled = false;
      elements.switchOnlineButton.disabled = false;
    }

    if (waiting) {
      elements.modeBadge.textContent = '接続待ち';
      elements.phaseLabel.textContent = 'オンライン接続を待っています';
      elements.phaseDetail.textContent = '接続を確認すると、保存データを整理して最新版へ更新します。';
    } else if (offline) {
      elements.modeBadge.textContent = state.phase === 'complete'
        ? 'オフライン'
        : state.phase === 'partial'
          ? '一部保存'
          : '保存中';
      if (state.phase === 'complete') {
        elements.phaseLabel.textContent = '保存完了';
        const textSaved = Number(state.textSaved || 0);
        const textTotal = Number(state.textTotal || 0);
        const supportSaved = Number(state.supportSaved || 0);
        const supportTotal = Number(state.supportTotal || 0);
        const supportFailed = Number(state.supportFailed || 0);
        const imageSaved = Number(state.imageSaved || 0);
        const imageTotal = Number(state.imageTotal || 0);
        const imageSkipped = Number(state.imageSkipped || 0);
        const supportNote = supportFailed
          ? ` 画面表示用の任意ファイルは${supportSaved.toLocaleString('ja-JP')} / ` +
            `${supportTotal.toLocaleString('ja-JP')}件です。未保存でも文章の閲覧には影響しません。`
          : '';
        if (imageTotal && imageSaved < imageTotal) {
          const reason = imageSkipped
            ? '端末の空き容量を守るため、残りの写真は保存していません。'
            : '保存できない写真は、オンライン接続時のみ表示されます。';
          elements.phaseDetail.textContent =
            `文章は${textSaved.toLocaleString('ja-JP')} / ${textTotal.toLocaleString('ja-JP')}件、` +
            `写真は${imageSaved.toLocaleString('ja-JP')} / ${imageTotal.toLocaleString('ja-JP')}件を保存しました。` +
            `${reason}${supportNote}`;
        } else {
          elements.phaseDetail.textContent =
            `文章と、保存対象の圧縮写真をすべて保存しました。${supportNote}`;
        }
      } else if (state.phase === 'partial') {
        elements.phaseLabel.textContent = '一部を保存しました';
        elements.phaseDetail.textContent =
          `文章に${Number(state.textFailed || 0).toLocaleString('ja-JP')}件の未保存があります。` +
          '保存済みデータは残るため、通信状態を確認して再実行できます。';
      } else {
        elements.phaseLabel.textContent = 'オフライン用データを保存中';
        elements.phaseDetail.textContent = 'この画面を閉じずにお待ちください。';
      }
    } else {
      elements.modeBadge.textContent = 'オンライン';
      elements.phaseLabel.textContent = 'オンラインモード';
      elements.phaseDetail.textContent = '必要なデータは通常どおり更新されます。';
      elements.saveProgress.hidden = true;
    }

    elements.textSummary.textContent = state.textTotal
      ? `${Number(state.textSaved || 0).toLocaleString('ja-JP')} / ${Number(state.textTotal).toLocaleString('ja-JP')}件`
      : '未保存';
    if (state.supportTotal) {
      const supportSaved = Number(state.supportSaved || 0);
      const supportTotal = Number(state.supportTotal || 0);
      const supportFailed = Number(state.supportFailed || 0);
      elements.supportSummary.textContent =
        `${supportSaved.toLocaleString('ja-JP')} / ${supportTotal.toLocaleString('ja-JP')}件` +
        (supportFailed ? `（任意・未保存 ${supportFailed.toLocaleString('ja-JP')}件）` : '（任意）');
    } else {
      elements.supportSummary.textContent = '未保存';
    }
    if (state.imageTotal) {
      const originalCount = Number(state.imageOriginal || 0);
      const suffix = originalCount
        ? `（圧縮、原寸${originalCount.toLocaleString('ja-JP')}件を含む）`
        : '（圧縮）';
      elements.imageSummary.textContent =
        `${Number(state.imageSaved || 0).toLocaleString('ja-JP')} / ` +
        `${Number(state.imageTotal).toLocaleString('ja-JP')}件 ${suffix}`;
    } else {
      elements.imageSummary.textContent = '未保存';
    }
    elements.savedAtSummary.textContent = formatDate(state.savedAt);
  }

  function absoluteAsset(asset) {
    return new URL(String(asset || '').replace(/^\.\//, ''), SITE_ROOT).href;
  }

  function dateKey(date) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function visibleDateKeys() {
    const count = Math.max(1, Number(MANIFEST.datePhotoWindowDays || 10));
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    const keys = [];
    for (let offset = 0; offset < count; offset += 1) {
      const target = new Date(base);
      target.setDate(base.getDate() - offset);
      let key = dateKey(target);
      if (key === '02-29') key = '02-28';
      keys.push(key);
    }
    return new Set(keys);
  }

  function collectDatedImages() {
    const keys = visibleDateKeys();
    const urls = [];
    const journey = global.MARKET_BASE_TODAYS_JOURNEY_IMAGE_MANIFEST;
    Object.values(journey?.entries || {}).forEach(entry => {
      if (!keys.has(entry?.display_date)) return;
      const image = entry?.candidates?.find(candidate => /^https?:/i.test(candidate?.image_url || ''));
      if (image?.image_url) urls.push(image.image_url);
    });

    const history = global.MARKET_BASE_WORLD_HISTORY;
    keys.forEach(key => {
      const day = history?.days?.[key];
      (day?.articleIds || []).forEach(articleId => {
        const url = history?.articles?.[articleId]?.photo?.imageUrl;
        if (/^https?:/i.test(url || '')) urls.push(url);
      });
    });
    return urls;
  }

  function imageTargets() {
    const urls = [
      ...(MANIFEST.localPhotoAssets || []).map(absoluteAsset),
      ...collectDatedImages()
    ];
    return [...new Set(urls.filter(url => /^https?:/i.test(url || '')))];
  }

  function imageFetchUrl(cacheUrl) {
    return MANIFEST.remotePhotoAliases?.[cacheUrl] || cacheUrl;
  }

  async function enableOfflineSentinel(state) {
    const cache = await caches.open(STATE_CACHE);
    await cache.put(STATE_REQUEST, new Response(JSON.stringify({
      enabled: true,
      buildId: BUILD_ID,
      savedAt: state.savedAt || null
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }));
  }

  async function disableOfflineSentinel() {
    await caches.delete(STATE_CACHE);
  }

  async function cacheOneStaticAsset(cache, asset) {
    const url = absoluteAsset(asset);
    const cached = await cache.match(url, { ignoreSearch: true });
    try {
      const response = await fetch(url, {
        cache: 'reload',
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await cache.put(url, response.clone());
      return { saved: true, refreshed: true };
    } catch (error) {
      if (cached) {
        return {
          saved: true,
          refreshed: false,
          reused: true,
          message: String(error?.message || error)
        };
      }
      return {
        saved: false,
        refreshed: false,
        message: String(error?.message || error)
      };
    }
  }

  async function cacheStaticAssets(assets) {
    const cache = await caches.open(TEXT_CACHE);
    let completed = 0;
    let saved = 0;
    let reused = 0;
    const failures = [];
    const queue = [...assets];

    async function worker() {
      while (queue.length) {
        const asset = queue.shift();
        const result = await cacheOneStaticAsset(cache, asset);
        if (result.saved) saved += 1;
        if (result.reused) reused += 1;
        if (!result.saved) failures.push({ asset, message: result.message });
        completed += 1;
        setProgress(
          '文章を保存中',
          completed,
          assets.length,
          `${saved.toLocaleString('ja-JP')}件を保存しました。`
        );
        if (completed % 12 === 0) {
          writeState({
            enabled: true,
            phase: 'saving-text',
            textSaved: saved,
            textTotal: assets.length,
            textFailed: failures.length
          });
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(4, assets.length) }, worker));
    return { saved, reused, failures };
  }

  async function cacheOptionalAssets(assets) {
    const cache = await caches.open(TEXT_CACHE);
    const queue = [...assets];
    let saved = 0;
    let completed = 0;
    const failures = [];

    async function worker() {
      while (queue.length) {
        const asset = queue.shift();
        const result = await cacheOneStaticAsset(cache, asset);
        if (result.saved) saved += 1;
        if (!result.saved) failures.push({ asset, message: result.message });
        completed += 1;
        setProgress(
          '画面表示用ファイルを保存中',
          completed,
          assets.length,
          `${saved.toLocaleString('ja-JP')}件を保存しました（任意）。`
        );
        if (completed % 4 === 0) {
          writeState({
            enabled: true,
            phase: 'saving-support',
            supportSaved: saved,
            supportTotal: assets.length,
            supportFailed: failures.length
          });
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(4, assets.length) }, worker));
    return { saved, failures };
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
  }

  async function decodeBlob(blob) {
    if ('createImageBitmap' in global) {
      const bitmap = await createImageBitmap(blob);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close?.()
      };
    }
    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = objectUrl;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('画像を読み込めません'));
      });
      return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => undefined
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function compressImage(url) {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'reload',
      referrerPolicy: 'no-referrer'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const sourceBlob = await response.blob();
    if (!sourceBlob.type.startsWith('image/')) throw new Error('画像形式ではありません');
    const decoded = await decodeBlob(sourceBlob);
    try {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(decoded.width, decoded.height));
      const width = Math.max(1, Math.round(decoded.width * scale));
      const height = Math.max(1, Math.round(decoded.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) throw new Error('写真を圧縮できません');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(decoded.source, 0, 0, width, height);
      let blob = await canvasBlob(canvas, 'image/webp', IMAGE_QUALITY);
      if (!blob) blob = await canvasBlob(canvas, 'image/jpeg', IMAGE_QUALITY);
      if (!blob) throw new Error('写真を圧縮できません');
      return blob;
    } finally {
      decoded.close();
    }
  }

  async function cacheCompressedImages(urls) {
    const cache = await caches.open(IMAGE_CACHE);
    let saved = 0;
    let compressed = 0;
    let original = 0;
    let skipped = 0;
    const failures = [];

    for (let index = 0; index < urls.length; index += 1) {
      const cacheUrl = urls[index];
      try {
        const cached = await cache.match(cacheUrl);
        if (cached) {
          saved += 1;
          if (cached.headers.get('X-Market-Base-Offline-Compressed') === '1') {
            compressed += 1;
          } else {
            original += 1;
          }
        } else {
          const estimate = index % 5 === 0 ? await navigator.storage?.estimate?.() : null;
          if (
            estimate?.quota &&
            Math.max(0, Number(estimate.quota) - Number(estimate.usage || 0)) < MIN_FREE_BYTES
          ) {
            skipped = urls.length - index;
            break;
          }
          // Cache under the URL used by the page, while fetching a direct
          // Wikimedia thumbnail when the source is a CORS-incompatible
          // Special:Redirect URL.
          const blob = await compressImage(imageFetchUrl(cacheUrl));
          await cache.put(cacheUrl, new Response(blob, {
            headers: {
              'Content-Type': blob.type || 'image/webp',
              'Cache-Control': 'public, max-age=31536000, immutable',
              'X-Market-Base-Offline-Compressed': '1'
            }
          }));
          saved += 1;
          compressed += 1;
        }
      } catch (error) {
        failures.push({ url: cacheUrl, message: String(error?.message || error) });
      }
      const current = index + 1;
      const unavailable = failures.length + skipped;
      setProgress(
        '写真を圧縮して保存中',
        current,
        urls.length,
        `${saved.toLocaleString('ja-JP')}件を保存中` +
          (unavailable ? `（未保存 ${unavailable.toLocaleString('ja-JP')}件）` : '')
      );
      if (current % 5 === 0) {
        writeState({
          enabled: true,
          phase: 'saving-images',
          imageSaved: saved,
          imageTotal: urls.length,
          imageCompressed: compressed,
          imageOriginal: original,
          imageFailed: failures.length,
          imageSkipped: skipped
        });
        await storageEstimate();
      }
    }
    return { saved, compressed, original, skipped, failures };
  }

  async function saveOffline() {
    if (working) return;
    if (!navigator.onLine) {
      elements.phaseLabel.textContent = '通信を確認してください';
      elements.phaseDetail.textContent = 'データ保存は、オンラインの状態で開始してください。';
      return;
    }
    if (!('caches' in global) || !('serviceWorker' in navigator)) {
      elements.phaseLabel.textContent = 'この端末では保存できません';
      elements.phaseDetail.textContent = '通常のブラウザまたはホーム画面から、もう一度お試しください。';
      return;
    }

    working = true;
    writeState({
      enabled: true,
      pendingCleanup: false,
      phase: 'preparing',
      buildId: BUILD_ID,
      textSaved: 0,
      textTotal: 0,
      textFailed: 0,
      imageSaved: 0,
      imageTotal: 0,
      imageCompressed: 0,
      imageOriginal: 0,
      imageFailed: 0,
      imageSkipped: 0,
      supportSaved: 0,
      supportTotal: 0,
      supportFailed: 0
    });
    updateUi();
    setProgress('保存準備中', 0, 1, '保存する文章と写真を確認しています。');

    try {
      await navigator.storage?.persist?.();
      // A previous snapshot may already be active. Keep its text/photos, but
      // briefly release cache-first mode so missing items can be downloaded.
      await disableOfflineSentinel();
      const registration = await navigator.serviceWorker.register('../sw.js?v=20260730-v324-offline-save-fix', {
        scope: '../',
        updateViaCache: 'none'
      });
      await registration.update().catch(() => undefined);
      await navigator.serviceWorker.ready;

      const textAssets = [...new Set(MANIFEST.textAssets || [])];
      const supportAssets = [...new Set(MANIFEST.supportAssets || [])];
      const photoUrls = imageTargets();
      writeState({
        enabled: true,
        phase: 'saving-text',
        textTotal: textAssets.length,
        supportTotal: supportAssets.length,
        imageTotal: photoUrls.length
      });
      const textResult = await cacheStaticAssets(textAssets);
      // Fonts and app icons improve appearance, but they are not article data.
      // Cache them best-effort without making the offline snapshot "partial".
      const supportResult = await cacheOptionalAssets(supportAssets);
      writeState({
        enabled: true,
        phase: 'saving-images',
        textSaved: textResult.saved,
        textTotal: textAssets.length,
        textFailed: textResult.failures.length,
        supportSaved: supportResult.saved,
        supportTotal: supportAssets.length,
        supportFailed: supportResult.failures.length
      });

      const imageResult = await cacheCompressedImages(photoUrls);
      // Text is required for offline reading. Photos are explicitly best-effort:
      // unavailable remote images or the device's free-space guard must not
      // cause an endless "partial" result when all reading data is ready.
      const complete = textResult.failures.length === 0;
      const finished = writeState({
        enabled: true,
        pendingCleanup: false,
        phase: complete ? 'complete' : 'partial',
        buildId: BUILD_ID,
        savedAt: Date.now(),
        textSaved: textResult.saved,
        textTotal: textAssets.length,
        textFailed: textResult.failures.length,
        textReused: textResult.reused,
        supportSaved: supportResult.saved,
        supportTotal: supportAssets.length,
        supportFailed: supportResult.failures.length,
        imageSaved: imageResult.saved,
        imageTotal: photoUrls.length,
        imageCompressed: imageResult.compressed,
        imageOriginal: imageResult.original,
        imageFailed: imageResult.failures.length,
        imageSkipped: imageResult.skipped,
        imageUnavailable: imageResult.failures.length + imageResult.skipped,
        imageFailureSamples: imageResult.failures.slice(0, 5),
        compressedImages: imageResult.original === 0
      });
      await enableOfflineSentinel(finished);
      const processedTotal = textAssets.length + supportAssets.length + photoUrls.length;
      setProgress(
        complete ? '保存処理が完了しました' : '保存処理が完了しました（文章に未保存あり）',
        processedTotal,
        processedTotal,
        `文章 ${textResult.saved.toLocaleString('ja-JP')} / ${textAssets.length.toLocaleString('ja-JP')}件、` +
          `画面表示用 ${supportResult.saved.toLocaleString('ja-JP')} / ${supportAssets.length.toLocaleString('ja-JP')}件、` +
          `写真 ${imageResult.saved.toLocaleString('ja-JP')} / ${photoUrls.length.toLocaleString('ja-JP')}件を保存しました。`
      );
    } catch (error) {
      console.warn('MARKET BASE offline save failed', error);
      const partial = writeState({
        enabled: true,
        phase: 'partial',
        lastError: String(error?.message || error)
      });
      try { await enableOfflineSentinel(partial); } catch (_) {}
      elements.phaseLabel.textContent = '保存を完了できませんでした';
      elements.phaseDetail.textContent = '保存済みの項目は残っています。通信状態を確認して、もう一度保存してください。';
    } finally {
      working = false;
      updateUi();
      await storageEstimate();
    }
  }

  async function finishOnlineTransition() {
    const state = readState();
    if (!state.pendingCleanup || !navigator.onLine || working) return false;
    working = true;
    updateUi(state);
    elements.phaseLabel.textContent = 'オンライン用に更新しています';
    elements.phaseDetail.textContent = '保存データを残したまま、最新版と接続状態を確認しています。';
    setProgress('最新版を確認中', 0, 1, '更新完了後にオフライン保存データを整理します。');
    try {
      if (!global.MarketBaseUpdate?.finishPendingOnlineTransition) {
        throw new Error('更新機能を読み込めません');
      }
      const finished = await global.MarketBaseUpdate.finishPendingOnlineTransition();
      const next = readState();
      updateUi(next);
      if (!next.pendingCleanup) {
        setProgress('オンラインへ切り替えました', 1, 1, '最新版の利用準備ができました。');
      } else if (next.phase === 'updating-online') {
        setProgress('最新版を反映中', 0, 1, '更新後に自動で保存データを整理します。');
      }
      return finished;
    } catch (error) {
      console.warn('MARKET BASE offline cleanup failed', error);
      writeState({ enabled: false, pendingCleanup: true, phase: 'waiting-online' });
      elements.phaseLabel.textContent = '切り替えを完了できませんでした';
      elements.phaseDetail.textContent = '接続を確認すると、もう一度自動で処理します。';
      return false;
    } finally {
      working = false;
      updateUi();
    }
  }

  async function switchOnline() {
    if (working) return;
    const state = writeState({
      enabled: false,
      pendingCleanup: true,
      phase: 'waiting-online',
      requestedOnlineAt: Date.now()
    });
    updateUi(state);
    if (navigator.onLine) {
      await finishOnlineTransition();
    } else {
      elements.phaseLabel.textContent = 'オンライン接続を待っています';
      elements.phaseDetail.textContent = '接続した時点で保存データを整理し、最新版へ更新します。';
    }
  }

  function bindElements() {
    [
      'modeBadge', 'phaseLabel', 'phaseDetail', 'saveProgress', 'progressLabel',
      'progressCount', 'progressBar', 'progressDetail', 'textSummary',
      'supportSummary', 'imageSummary', 'savedAtSummary', 'storageSummary', 'saveOfflineButton',
      'switchOnlineButton'
    ].forEach(id => { elements[id] = $(id); });
  }

  function init() {
    bindElements();
    updateUi();
    storageEstimate();
    elements.saveOfflineButton.addEventListener('click', saveOffline);
    elements.switchOnlineButton.addEventListener('click', switchOnline);
    global.addEventListener('online', finishOnlineTransition);
    global.addEventListener('marketbase:offline-state-changed', event => {
      updateUi(event.detail || readState());
    });
    if (readState().pendingCleanup && navigator.onLine) finishOnlineTransition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
