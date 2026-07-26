(() => {
  "use strict";

  const root = document.querySelector('[data-mbdc-app="daily-company"]');
  if (!root) return;

  const databases = Array.isArray(window.MARKET_BASE_DATABASES) ? window.MARKET_BASE_DATABASES : [];
  const companies = Array.isArray(window.MARKET_BASE_COMPANIES) ? window.MARKET_BASE_COMPANIES : [];
  const STORAGE_KEY = "market_base_daily_company_draw_r11349_v1";
  const DRAW_LOCK_NAME = "market-base-daily-company-draw-r11349";
  const CHANNEL_NAME = "market-base-daily-company-sync-r11349";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animationDuration = reducedMotion ? 0 : 1700;
  const storageFallback = new Map();

  const byId = (id) => root.querySelector(`#${id}`);
  const el = {
    status: byId("mbdcDailyStatus"),
    slotWindow: byId("mbdcSlotWindow"),
    slotReel: byId("mbdcSlotReel"),
    slotCurrent: byId("mbdcSlotCurrent"),
    spinButton: byId("mbdcSpinButton"),
    companyLink: byId("mbdcHomeCompanyLink"),
    resultMeta: byId("mbdcHomeResultMeta"),
    resetNote: byId("mbdcResetNote"),
    debugResetButton: byId("mbdcDebugResetButton")
  };

  const required = ["status", "slotWindow", "slotReel", "spinButton", "companyLink", "resultMeta", "resetNote"];
  const missing = required.filter((key) => !el[key]);
  if (missing.length) {
    console.error(`企業スロットを初期化できません。不足要素: ${missing.join(", ")}`);
    return;
  }

  let isSpinning = false;
  let activeDayKey = localDayKey();
  let midnightTimer = 0;
  let syncChannel = null;

  function localDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function nextLocalMidnight(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("端末内保存を利用できないため、このタブ内だけで結果を保持します。", error);
      return storageFallback.get(key) || null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      storageFallback.set(key, value);
      console.warn("端末内保存を利用できないため、このタブ内だけで結果を保持します。", error);
    }
  }

  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (_error) {
      storageFallback.delete(key);
    }
  }

  function readSavedDraw({ cleanInvalid = true } = {}) {
    try {
      const raw = storageGet(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const validCompany = companies.some((company) => company.id === parsed.companyId);
      const validDay = parsed.dayKey === localDayKey();
      if (!validCompany || !validDay) {
        if (cleanInvalid) storageRemove(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch (error) {
      if (cleanInvalid) storageRemove(STORAGE_KEY);
      console.warn("企業スロットの保存結果を読み込めませんでした。", error);
      return null;
    }
  }

  function announceSync(value) {
    try {
      syncChannel?.postMessage({ type: "draw-saved", value });
    } catch (error) {
      console.warn("タブ間同期メッセージを送信できませんでした。", error);
    }
  }

  function getCompany(companyId) {
    return companies.find((company) => company.id === companyId);
  }

  function getDatabase(databaseId) {
    return databases.find((database) => database.id === databaseId);
  }

  function companyLink(company) {
    const pageWithoutHash = String(company.page || "").split("#", 1)[0];
    return `${pageWithoutHash}#${encodeURIComponent(company.targetId)}`;
  }

  function secureRandomIndex(length) {
    if (length <= 0) throw new Error("企業候補がありません。");
    if (!window.crypto?.getRandomValues) return Math.floor(Math.random() * length);
    const maxUint = 0xFFFFFFFF;
    const limit = maxUint - (maxUint % length);
    const values = new Uint32Array(1);
    do {
      crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % length;
  }

  function makeClaimId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function saveDraw(company, claimId) {
    const value = {
      version: 3,
      dayKey: localDayKey(),
      drawnAt: new Date().toISOString(),
      companyId: company.id,
      filters: { databaseIds: databases.map((database) => database.id), country: "" },
      claimId
    };
    storageSet(STORAGE_KEY, JSON.stringify(value));
    announceSync(value);
    return value;
  }

  function itemClass(name) {
    const length = [...String(name || "")].length;
    if (length >= 23) return "daily-slot-item is-very-long";
    if (length >= 16) return "daily-slot-item is-long";
    return "daily-slot-item";
  }

  function itemMarkup(name, isFinal = false) {
    const item = document.createElement("div");
    item.className = `${itemClass(name)}${isFinal ? " is-final" : ""}`;
    item.textContent = name;
    item.title = name;
    return item;
  }

  function setSingleSlotText(text, isFinal = false) {
    el.slotWindow.setAttribute("aria-busy", "false");
    el.slotWindow.setAttribute("aria-live", "polite");
    el.slotReel.style.transition = "none";
    el.slotReel.style.transform = "translateY(0)";
    el.slotReel.replaceChildren(itemMarkup(text, isFinal));
    el.slotWindow.setAttribute("aria-label", text);
  }

  function showUndrawnState() {
    setSingleSlotText("企業名を選ぶ");
    el.status.textContent = "本日の1社";
    el.spinButton.hidden = false;
    el.spinButton.disabled = companies.length === 0;
    el.spinButton.textContent = "1社選ぶ";
    el.companyLink.hidden = true;
    el.resultMeta.hidden = true;
    el.resultMeta.textContent = "";
    el.resetNote.textContent = "選んだ結果は本日中この端末に保存されます。";
  }

  function showResult(company) {
    const database = getDatabase(company.databaseId);
    setSingleSlotText(company.name, true);
    el.status.textContent = "本日の1社";
    el.spinButton.disabled = true;
    el.spinButton.hidden = true;
    el.companyLink.href = companyLink(company);
    el.companyLink.hidden = false;
    el.resultMeta.textContent = `${company.country}｜${database?.shortName || database?.name || company.region}`;
    el.resultMeta.hidden = false;
    el.resetNote.textContent = "次の企業は端末の現地日付が変わると選べます。";
  }

  function makeAnimationSequence(winner) {
    const sequence = [];
    const steps = 22;
    for (let index = 0; index < steps; index += 1) {
      sequence.push(companies[secureRandomIndex(companies.length)]);
    }
    sequence.push(winner);
    return sequence;
  }

  function animateToCompany(company) {
    if (reducedMotion) {
      showResult(company);
      return Promise.resolve();
    }
    const sequence = makeAnimationSequence(company);
    el.slotWindow.setAttribute("aria-busy", "true");
    el.slotWindow.setAttribute("aria-live", "off");
    el.slotReel.style.transition = "none";
    el.slotReel.style.transform = "translateY(0)";
    el.slotReel.replaceChildren(...sequence.map((item) => itemMarkup(item.name)));
    const rowHeight = el.slotWindow.clientHeight;
    void el.slotReel.offsetHeight;
    el.slotReel.style.transition = `transform ${animationDuration}ms cubic-bezier(.12,.72,.12,1)`;
    el.slotReel.style.transform = `translateY(-${(sequence.length - 1) * rowHeight}px)`;
    return new Promise((resolve) => {
      window.setTimeout(() => {
        showResult(company);
        resolve();
      }, animationDuration + 60);
    });
  }

  function claimDrawWithoutWebLock() {
    const existing = readSavedDraw();
    if (existing) return { saved: existing, company: getCompany(existing.companyId), created: false };
    if (!companies.length) return null;
    const company = companies[secureRandomIndex(companies.length)];
    const claimId = makeClaimId();
    const saved = saveDraw(company, claimId);
    const winner = readSavedDraw({ cleanInvalid: false });
    return winner?.claimId === claimId
      ? { saved, company, created: true }
      : { saved: winner, company: winner && getCompany(winner.companyId), created: false };
  }

  async function claimDraw() {
    if (navigator.locks?.request) {
      return navigator.locks.request(DRAW_LOCK_NAME, async () => claimDrawWithoutWebLock());
    }
    return claimDrawWithoutWebLock();
  }

  async function spin() {
    if (isSpinning || readSavedDraw() || !companies.length) return;
    isSpinning = true;
    el.spinButton.hidden = false;
    el.spinButton.disabled = true;
    el.spinButton.textContent = "選択中…";
    el.companyLink.hidden = true;
    el.resultMeta.hidden = true;

    let claim;
    try {
      claim = await claimDraw();
    } catch (error) {
      console.error("企業を選べませんでした。", error);
      isSpinning = false;
      showUndrawnState();
      return;
    }

    if (!claim?.company) {
      isSpinning = false;
      showUndrawnState();
      return;
    }

    if (!claim.created) {
      isSpinning = false;
      showResult(claim.company);
      return;
    }

    await animateToCompany(claim.company);
    isSpinning = false;
  }

  function applyDailyState() {
    const saved = readSavedDraw();
    const company = saved && getCompany(saved.companyId);
    if (company) showResult(company);
    else showUndrawnState();
  }

  function checkDayBoundary() {
    const today = localDayKey();
    if (today !== activeDayKey) {
      activeDayKey = today;
      isSpinning = false;
      readSavedDraw();
      applyDailyState();
    }
    scheduleMidnightReset();
  }

  function scheduleMidnightReset() {
    window.clearTimeout(midnightTimer);
    const delay = Math.max(250, nextLocalMidnight().getTime() - Date.now() + 150);
    midnightTimer = window.setTimeout(checkDayBoundary, Math.min(delay, 2147483647));
  }

  function handleExternalSync() {
    if (!isSpinning) applyDailyState();
  }

  function configureCrossTabSync() {
    if ("BroadcastChannel" in window) {
      syncChannel = new BroadcastChannel(CHANNEL_NAME);
      syncChannel.addEventListener("message", (event) => {
        if (event.data?.type !== "draw-saved") return;
        if (event.data.value) storageFallback.set(STORAGE_KEY, JSON.stringify(event.data.value));
        else storageFallback.delete(STORAGE_KEY);
        handleExternalSync();
      });
    }
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) handleExternalSync();
    });
  }

  function isLocalDevelopmentHost() {
    return location.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]", "::1"].includes(location.hostname);
  }

  function configureDebugMode() {
    if (!el.debugResetButton) return;
    const params = new URLSearchParams(location.search);
    if (params.get("debug") === "1" && isLocalDevelopmentHost()) {
      el.debugResetButton.hidden = false;
      el.debugResetButton.addEventListener("click", () => {
        storageRemove(STORAGE_KEY);
        announceSync(null);
        applyDailyState();
      });
    }
  }

  function registerServiceWorker() {
    if (root.dataset.registerServiceWorker !== "true") return;
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("service-worker.js", { scope: "./" }).catch((error) => {
        console.warn("Service Workerを登録できませんでした。", error);
      });
    }
  }

  function initialize() {
    applyDailyState();
    configureDebugMode();
    configureCrossTabSync();
    registerServiceWorker();
    scheduleMidnightReset();
    el.spinButton.addEventListener("click", spin);
    window.addEventListener("focus", checkDayBoundary);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkDayBoundary();
    });
  }

  initialize();
})();
