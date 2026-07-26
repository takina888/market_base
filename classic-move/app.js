(() => {
  "use strict";
  const D = window.GAME_CORE_REDESIGN;
  const R = window.CLASSICS_READING;
  if (!D) throw new Error("GAME_CORE_REDESIGN is missing.");
  if (!R) throw new Error("CLASSICS_READING is missing.");

  const STORAGE_KEY = "classic-one-narrative-v021";
  const LEGACY_STORAGE_KEYS = ["classic-one-narrative-v020", "classic-one-narrative-v019", "classic-one-narrative-v018", "classic-one-narrative-v017", "classic-one-narrative-v016", "classic-one-narrative-v015", "classic-one-narrative-v014", "classic-one-narrative-v013", "classic-one-narrative-v012", "classic-one-narrative-v011", "classic-one-narrative-v010", "classic-one-narrative-v009", "classic-one-narrative-v008", "classic-one-narrative-v007"];
  const LOG_KEY = "classic-one-playlog-v021";
  const LEGACY_LOG_KEYS = ["classic-one-playlog-v020", "classic-one-playlog-v019", "classic-one-playlog-v018", "classic-one-playlog-v017", "classic-one-playlog-v016", "classic-one-playlog-v015", "classic-one-playlog-v014", "classic-one-playlog-v013", "classic-one-playlog-v012", "classic-one-playlog-v011", "classic-one-playlog-v010", "classic-one-playlog-v009", "classic-one-playlog-v008", "classic-one-playlog-v007"];
  const app = document.getElementById("app");
  const backButton = document.getElementById("backButton");
  const settingsButton = document.getElementById("settingsButton");
  const settingsDialog = document.getElementById("settingsDialog");
  const timerOffSetting = document.getElementById("timerOffSetting");
  const reduceMotionSetting = document.getElementById("reduceMotionSetting");
  const participantCodeSetting = document.getElementById("participantCodeSetting");
  const toast = document.getElementById("toast");

  const defaultPersisted = () => ({
    version: "v021",
    readClassics: [],
    seenVariants: {},
    endings: {},
    completedCases: [],
    feedback: [],
    settings: { timerOff: false, reduceMotion: false, participantCode: "" }
  });

  function loadState() {
    try {
      const legacyState = LEGACY_STORAGE_KEYS.map(key => localStorage.getItem(key)).find(Boolean);
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || legacyState || "null");
      const merged = { ...defaultPersisted(), ...(parsed || {}), settings: { ...defaultPersisted().settings, ...((parsed || {}).settings || {}) } };
      merged.version = "v021";
      if (!Array.isArray(merged.readClassics)) merged.readClassics = [];
      return merged;
    } catch {
      return defaultPersisted();
    }
  }
  let persisted = loadState();
  let session = null;
  let timerId = null;
  let toastId = null;
  let homeFilters = { query: "", category: "all", unfinishedOnly: false };
  let classicFilters = { query: "" };
  let pageMode = "home";
  let currentClassicId = null;

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)); } catch {}
  }
  saveState(); // v020以前から読み込んだ状態もv021キーへ即時移行する。
  function appendLog(event, details = {}) {
    const item = { at: new Date().toISOString(), participantCode: persisted.settings.participantCode || "", event, ...details };
    try {
      const logs = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
      logs.push(item);
      localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-500)));
    } catch {}
  }
  function upsertLog(event, matcher, details = {}) {
    const item = { at: new Date().toISOString(), participantCode: persisted.settings.participantCode || "", event, ...details };
    try {
      const logs = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
      const index = logs.findIndex(x => x.event === event && matcher(x));
      if (index >= 0) logs[index] = item;
      else logs.push(item);
      localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-500)));
    } catch {}
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
  }
  function withInstantScroll(action, duration = 220) {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    action();
    requestAnimationFrame(action);
    setTimeout(action, 70);
    setTimeout(() => { root.style.scrollBehavior = previous; }, duration);
  }
  function resetView() {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    withInstantScroll(() => window.scrollTo(0, 0));
  }
  function restoreCardView(viewState) {
    if (!viewState) return resetView();
    const apply = () => {
      const target = document.querySelector(`[data-card="${viewState.cardId}"]`);
      if (target) window.scrollBy(0, target.getBoundingClientRect().top - viewState.top);
      else window.scrollTo(0, viewState.scrollY);
    };
    withInstantScroll(apply);
  }
  function showToast(message) {
    clearTimeout(toastId);
    toast.textContent = message;
    toast.classList.add("show");
    toastId = setTimeout(() => toast.classList.remove("show"), 2400);
  }
  function getCase(caseId) { return D.cases.find(x => x.caseId === caseId); }
  function getVariants(caseId) { return D.variants.filter(x => x.caseId === caseId); }
  function getCards(caseId, variantId) { return D.informationCards.filter(x => x.caseId === caseId && x.variantId === variantId); }
  function getBranches(caseId, variantId) { return D.branches.filter(x => x.caseId === caseId && x.variantId === variantId); }
  function getCrisisFollowUps(variantId) {
    return (D.crisisFollowUps || []).filter(x => x.caseId === "CAS-012" && x.variantId === variantId).sort((a,b) => a.order-b.order);
  }
  function getMessages(caseId, variantId, timing) {
    return D.messages.filter(x => x.caseId === caseId && (x.variantId === "共通" || x.variantId === variantId) && (!timing || x.timing === timing));
  }
  function getDebriefs(caseId) { return D.classicDebriefs.filter(x => x.caseId === caseId).sort((a,b) => a.order-b.order); }
  function getClassic(classicId) { return R.works.find(x => x.classicId === classicId); }
  function getClassicDebriefs(classicName) { return D.classicDebriefs.filter(x => x.classic === classicName); }
  function isClassicRead(classicId) { return (persisted.readClassics || []).includes(classicId); }
  function playedCount(caseId) { return (persisted.seenVariants[caseId] || []).length; }
  function endingCount(caseId) { return Object.keys(persisted.endings[caseId] || {}).length; }

  function chooseVariant(caseId) {
    const variants = getVariants(caseId);
    const seen = persisted.seenVariants[caseId] || [];
    const unseen = variants.filter(v => !seen.includes(v.variantId));
    const pool = unseen.length ? unseen : variants.filter(v => v.variantId !== seen.at(-1));
    const candidates = pool.length ? pool : variants;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function newSession(caseId) {
    const caseData = getCase(caseId);
    const variant = chooseVariant(caseId);
    return {
      caseId, caseData, variant,
      phase: "opening",
      selectedCards: [],
      selectedChoiceId: null,
      timer: parseInt(caseData.softTimer, 10) || 60,
      timerInitial: parseInt(caseData.softTimer, 10) || 60,
      timerRunning: false,
      timedOut: false,
      storyIndex: 0,
      selectedFollowUpId: null,
      feedbackRating: 0,
      feedbackSurprise: null,
      feedbackReplayIntent: null,
      feedbackLength: null,
      actualReplay: false,
      firstDecisionAt: null,
      playId: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      startedAt: Date.now()
    };
  }

  function markFirstDecision(action) {
    if (!session || session.firstDecisionAt) return;
    session.firstDecisionAt = Date.now();
    appendLog("first_decision", {
      caseId: session.caseId,
      variantId: session.variant.variantId,
      action,
      elapsedSeconds: Math.round((session.firstDecisionAt - session.startedAt) / 1000)
    });
  }

  function cardTimeCost(card) {
    return Math.max(0, parseInt(card?.timeCost, 10) || 0);
  }

  function feedbackItem() {
    if (!session) return null;
    return {
      at: new Date().toISOString(),
      participantCode: persisted.settings.participantCode || "",
      playId: session.playId,
      caseId: session.caseId,
      variantId: session.variant.variantId,
      choiceId: session.selectedChoiceId,
      followUpId: session.selectedFollowUpId,
      rating: session.feedbackRating || null,
      surprise: session.feedbackSurprise,
      replayIntent: session.feedbackReplayIntent,
      length: session.feedbackLength,
      actualReplay: !!session.actualReplay,
      elapsedSeconds: Math.round((Date.now() - session.startedAt) / 1000)
    };
  }

  function saveFeedback() {
    const item = feedbackItem();
    if (!item) return;
    const feedbackIndex = persisted.feedback.findIndex(x => x.playId === session.playId);
    if (feedbackIndex >= 0) persisted.feedback[feedbackIndex] = item;
    else persisted.feedback.push(item);
    saveState();
    upsertLog("play_feedback", x => x.playId === session.playId, item);
  }

  function timerMarkup() {
    if (!session || persisted.settings.timerOff) return "";
    const urgent = session.timer <= Math.max(10, Math.round(session.timerInitial * .2));
    const min = Math.floor(session.timer / 60);
    const sec = String(session.timer % 60).padStart(2,"0");
    return `<div class="timer-wrap ${urgent ? "is-urgent" : ""}" aria-label="残り時間">
      <div><div class="timer-value">${min}:${sec}</div><div class="timer-caption">ソフトタイマー</div></div>
      <div class="timer-controls">
        <button type="button" data-action="timer-pause">${session.timerRunning ? "停止" : "再開"}</button>
        <button type="button" data-action="timer-extend">+30秒</button>
      </div>
    </div>`;
  }

  function clearTimerInterval() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }
  function syncTimerControls() {
    const button = document.querySelector('[data-action="timer-pause"]');
    if (button && session) button.textContent = session.timerRunning ? "停止" : "再開";
  }
  function setSessionTimer(seconds) {
    if (!session) return;
    session.timer = seconds;
    session.timerInitial = seconds;
    session.timerRunning = false;
    session.timedOut = false;
  }
  function startTimer() {
    clearTimerInterval();
    if (persisted.settings.timerOff || !session || session.timer <= 0) {
      if (session) session.timerRunning = false;
      syncTimerControls();
      return;
    }
    session.timerRunning = true;
    syncTimerControls();
    timerId = setInterval(() => {
      if (!session || !session.timerRunning) return;
      session.timer = Math.max(0, session.timer - 1);
      const value = document.querySelector(".timer-value");
      if (value) {
        const min = Math.floor(session.timer / 60);
        const sec = String(session.timer % 60).padStart(2,"0");
        value.textContent = `${min}:${sec}`;
        const wrap = value.closest(".timer-wrap");
        if (wrap) wrap.classList.toggle("is-urgent", session.timer <= Math.max(10, Math.round(session.timerInitial * .2)));
      }
      if (session.timer === 0 && !session.timedOut) {
        session.timedOut = true;
        session.timerRunning = false;
        syncTimerControls();
        appendLog("timer_expired", { caseId: session.caseId, variantId: session.variant.variantId, phase: session.phase });
        showTimeoutMessage();
      }
    }, 1000);
  }
  function stopTimer() {
    clearTimerInterval();
    if (session) session.timerRunning = false;
    syncTimerControls();
  }
  function showTimeoutMessage() {
    const text = session?.caseData?.timeoutMessage || "追加の催促が入りました。時間は過ぎましたが、判断は続けられます。";
    const html = `<article class="message alert visible"><span class="speaker">追加メッセージ</span><p>${esc(text)}</p></article>`;
    const stack = document.querySelector(".message-stack");
    if (stack) stack.insertAdjacentHTML("beforeend", html);
    else {
      const head = document.querySelector(".screen-head");
      if (head && !document.querySelector("[data-timeout-message]")) {
        head.insertAdjacentHTML("afterend", html.replace("<article ", "<article data-timeout-message=\"true\" "));
      }
    }
    showToast("時間は過ぎましたが、失敗にはなりません。判断を続けてください。");
  }

  function categoryList() {
    return [...new Set(D.cases.map(c => c.category).filter(Boolean))];
  }
  function homeSearchText(caseData) {
    return [caseData.prototypeTitle, caseData.genre, caseData.playerRole, caseData.category, ...(caseData.searchTags || [])]
      .join(" ").toLocaleLowerCase("ja");
  }
  function applyHomeFilters() {
    const query = homeFilters.query.trim().toLocaleLowerCase("ja");
    let visible = 0;
    document.querySelectorAll("[data-case-card]").forEach(card => {
      const caseData = getCase(card.dataset.caseCard);
      const matchesQuery = !query || homeSearchText(caseData).includes(query);
      const matchesCategory = homeFilters.category === "all" || caseData.category === homeFilters.category;
      const matchesProgress = !homeFilters.unfinishedOnly || playedCount(caseData.caseId) < getVariants(caseData.caseId).length;
      const show = matchesQuery && matchesCategory && matchesProgress;
      card.hidden = !show;
      if (show) visible += 1;
    });
    const count = document.querySelector("[data-home-result-count]");
    if (count) count.textContent = `${visible}件を表示`;
    const empty = document.querySelector("[data-home-empty]");
    if (empty) empty.hidden = visible !== 0;
  }
  function startRandomVisibleCase() {
    const visibleIds = [...document.querySelectorAll("[data-case-card]:not([hidden])")].map(x => x.dataset.caseCard);
    if (!visibleIds.length) return showToast("条件に合うケースがありません。");
    const minimum = Math.min(...visibleIds.map(playedCount));
    const priority = visibleIds.filter(id => playedCount(id) === minimum);
    const id = priority[Math.floor(Math.random() * priority.length)];
    appendLog("random_case_selected", { caseId:id, visibleCount:visibleIds.length });
    startCase(id);
  }

  function renderHome() {
    stopTimer();
    session = null;
    pageMode = "home";
    currentClassicId = null;
    backButton.hidden = true;
    const categories = categoryList();
    const completedCases = D.cases.filter(c => playedCount(c.caseId) >= getVariants(c.caseId).length).length;
    const experiencedVariants = D.cases.reduce((sum,c) => sum + Math.min(playedCount(c.caseId), getVariants(c.caseId).length), 0);
    const cards = D.cases.map((c, i) => `
      <article class="case-card" data-case-card="${c.caseId}">
        <div class="case-card-head"><span class="case-no">CASE ${String(i+1).padStart(2,"0")}</span><span class="case-category">${esc(c.category)}</span></div>
        <span class="genre">${esc(c.genre)}</span>
        <div>
          <h2>${esc(c.prototypeTitle)}</h2>
          <p>${esc(c.openingPressure)}</p>
        </div>
        <div class="card-stats">
          <span class="stat-chip">展開 3種類</span>
          <span class="stat-chip">目安 ${esc(c.targetPlayTime)}</span>
          <span class="stat-chip">体験済み ${playedCount(c.caseId)}/3</span>
        </div>
        <button class="primary-btn card-action" type="button" data-case="${c.caseId}">${playedCount(c.caseId) ? "別の展開を遊ぶ" : "事件を始める"}</button>
      </article>`).join("");
    app.innerHTML = `
      <nav class="learning-mode" aria-label="学び方を選ぶ">
        <button class="mode-btn selected" type="button" aria-current="page">遊んで学ぶ</button>
        <button class="mode-btn" type="button" data-action="classics-library">古典を読んで学ぶ</button>
      </nav>
      <section class="hero">
        <p class="eyebrow">NARRATIVE DECISION GAME</p>
        <h1>説明を読む前に、事件が始まります。</h1>
        <p class="lead">限られた情報から一手を選び、相手や現場の反応を見届けます。正解当てではなく、何を守り、何を支払うかを考える48の判断ケースです。</p>
        <div class="notice"><strong>遊び方：</strong> 情報は一度開くと戻せず、確認には表示された秒数を使います。古典の解説は結末後に任意で開けます。</div>
        <div class="progress-overview" aria-label="プレイ進捗">
          <div><strong>${completedCases}</strong><span>完了ケース / 48</span></div>
          <div><strong>${experiencedVariants}</strong><span>体験した展開 / 144</span></div>
          <div><strong>${(persisted.readClassics || []).length}</strong><span>読んだ古典 / ${R.works.length}</span></div>
        </div>
        ${persisted.settings.participantCode ? `<div class="completed-strip"><span class="completed-pill">試遊ID ${esc(persisted.settings.participantCode)}</span></div>` : ""}
      </section>
      <section class="case-browser" aria-label="ケースを探す">
        <div class="browser-head"><div><h2>ケースを選ぶ</h2><p class="lead" data-home-result-count>48件を表示</p></div><button class="primary-btn random-btn" type="button" data-action="random-case">おまかせで始める</button></div>
        <div class="filter-grid">
          <label class="filter-field"><span>キーワード</span><input type="search" data-home-search placeholder="例：品質、AI、交渉" value="${esc(homeFilters.query)}"></label>
          <label class="filter-field"><span>カテゴリー</span><select data-home-category><option value="all">すべて</option>${categories.map(x=>`<option value="${esc(x)}" ${homeFilters.category===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
          <label class="filter-check"><input type="checkbox" data-home-unfinished ${homeFilters.unfinishedOnly?'checked':''}><span>未体験の展開があるケースだけ</span></label>
          <button class="secondary-btn filter-reset" type="button" data-action="reset-home-filters">条件をリセット</button>
        </div>
      </section>
      <section class="case-grid">${cards}</section>
      <section class="screen-card empty-state" data-home-empty hidden><h2>該当するケースがありません</h2><p class="lead">キーワードかカテゴリーを変えてください。</p></section>
      <section class="screen-card" style="margin-top:20px">
        <h2>プレイログ</h2>
        <p class="lead">ログはこの端末内だけに保存され、外部へ送信されません。</p>
        <div class="action-row">
          <button class="secondary-btn" type="button" data-action="export-log">JSONを書き出す</button>
          <button class="danger-btn" type="button" data-action="reset-prototype">履歴を消す</button>
        </div>
      </section>`;
    applyHomeFilters();
    resetView();
  }


  function classicSearchText(item) {
    return [item.classic, item.reading, item.label, item.intro, item.chapter, item.plain, item.decode, item.aha, item.workplace, ...(item.keywords || [])]
      .join(" ").toLocaleLowerCase("ja");
  }

  function applyClassicFilters() {
    const query = classicFilters.query.trim().toLocaleLowerCase("ja");
    let visible = 0;
    document.querySelectorAll("[data-classic-card]").forEach(card => {
      const item = getClassic(card.dataset.classicCard);
      const show = !query || classicSearchText(item).includes(query);
      card.hidden = !show;
      if (show) visible += 1;
    });
    const count = document.querySelector("[data-classic-result-count]");
    if (count) count.textContent = `${visible}作品を表示`;
    const empty = document.querySelector("[data-classic-empty]");
    if (empty) empty.hidden = visible !== 0;
  }

  function renderClassicsLibrary() {
    stopTimer();
    session = null;
    pageMode = "classics-library";
    currentClassicId = null;
    backButton.hidden = true;
    const cards = R.works.map(item => {
      const related = getClassicDebriefs(item.classic).length;
      return `<article class="classic-card" data-classic-card="${esc(item.classicId)}">
        <div class="classic-card-head"><span class="classic-name">${esc(item.classic)}</span>${isClassicRead(item.classicId) ? '<span class="read-badge">読了</span>' : ''}</div>
        <p class="classic-reading">${esc(item.reading)}・${esc(item.chapter)}</p>
        <h2>${esc(item.label)}</h2>
        <p>${esc(item.intro)}</p>
        <div class="card-stats"><span class="stat-chip">原文と解読</span><span class="stat-chip">関連する一手 ${related}件</span></div>
        <button class="primary-btn card-action" type="button" data-classic="${esc(item.classicId)}">この古典を読む</button>
      </article>`;
    }).join("");
    app.innerHTML = `
      <nav class="learning-mode" aria-label="学び方を選ぶ">
        <button class="mode-btn" type="button" data-action="home">遊んで学ぶ</button>
        <button class="mode-btn selected" type="button" aria-current="page">古典を読んで学ぶ</button>
      </nav>
      <section class="hero classic-hero">
        <p class="eyebrow">CLASSICS READING</p>
        <h1>原文を読み、仕事の言葉までほどく。</h1>
        <p class="lead">有名な一文を眺めるだけではなく、何を言っているのか、なぜそう考えるのか、現代の仕事に当てはめるとどうなるのかを順番に読み解きます。</p>
        <div class="notice"><strong>読み方：</strong> 原文 → 読み下しの目安 → 現代語訳 → 解読 → 仕事での使い方 → 誤用注意。原文には複数の読み方や解釈があるため、本ページでは仕事に応用するための一つの読み方を示します。</div>
        <div class="progress-overview"><div><strong>${(persisted.readClassics || []).length}</strong><span>読了 / ${R.works.length}作品</span></div><div><strong>${D.classicDebriefs.length}</strong><span>ゲーム内の応用原則</span></div></div>
      </section>
      <section class="case-browser" aria-label="古典を探す">
        <div class="browser-head"><div><h2>古典を選ぶ</h2><p class="lead" data-classic-result-count>${R.works.length}作品を表示</p></div></div>
        <label class="filter-field"><span>作品名・テーマ・仕事の悩みから検索</span><input type="search" data-classic-search placeholder="例：信頼、ルール、異論、教育" value="${esc(classicFilters.query)}"></label>
      </section>
      <section class="classic-grid">${cards}</section>
      <section class="screen-card empty-state" data-classic-empty hidden><h2>該当する古典がありません</h2><p class="lead">別の言葉で検索してください。</p></section>`;
    applyClassicFilters();
    resetView();
  }

  function renderClassicDetail(classicId) {
    stopTimer();
    session = null;
    const item = getClassic(classicId);
    if (!item) return renderClassicsLibrary();
    pageMode = "classic-detail";
    currentClassicId = classicId;
    backButton.hidden = false;
    if (!isClassicRead(classicId)) {
      persisted.readClassics.push(classicId);
      saveState();
      appendLog("classic_read", { classicId, classic:item.classic });
    }
    const related = getClassicDebriefs(item.classic);
    const relatedHtml = related.map(d => {
      const caseData = getCase(d.caseId);
      const caseIndex = D.cases.findIndex(c => c.caseId === d.caseId) + 1;
      return `<article class="related-principle">
        <div><span class="case-no">CASE ${String(caseIndex).padStart(2,"0")}</span><span class="principle-classic">${esc(caseData?.prototypeTitle || d.caseId)}</span></div>
        <h3>${esc(d.heading)}</h3>
        <p>${esc(d.oneLine)}</p>
        <button class="secondary-btn" type="button" data-case="${esc(d.caseId)}">ゲームで確かめる</button>
      </article>`;
    }).join("");
    app.innerHTML = `
      <article class="classic-reader">
        <header class="classic-reader-head">
          <p class="eyebrow">${esc(item.reading)}・${esc(item.chapter)}</p>
          <h1>${esc(item.classic)}｜${esc(item.label)}</h1>
          <p class="lead">${esc(item.intro)}</p>
        </header>

        <section class="passage-panel" aria-labelledby="original-heading">
          <div class="section-kicker">原文</div>
          <h2 id="original-heading">まず、古典の言葉をそのまま読む</h2>
          <blockquote class="classic-original" lang="zh-Hant">${esc(item.original)}</blockquote>
          <details class="reading-help" open>
            <summary>読み下しの目安</summary>
            <p>${esc(item.kundoku)}</p>
          </details>
          <div class="plain-translation"><span>いまの言葉にすると</span><p>${esc(item.plain)}</p></div>
        </section>

        <section class="decode-panel">
          <div class="section-kicker">解読 1</div>
          <h2>${esc(item.decodeTitle)}</h2>
          <p>${esc(item.decode)}</p>
        </section>

        <section class="aha-panel">
          <div class="section-kicker">解読 2</div>
          <h2>なるほど、ここが仕事につながる</h2>
          <p>${esc(item.aha)}</p>
        </section>

        <section class="work-panel">
          <div class="two-column-reading">
            <div><div class="section-kicker">仕事で使う</div><h2>現代の職場に当てはめると</h2><p>${esc(item.workplace)}</p></div>
            <div><div class="section-kicker warning-kicker">誤用注意</div><h2>こう使うと危ない</h2><p>${esc(item.misuse)}</p></div>
          </div>
          <div class="reflection-question"><span>自分への問い</span><p>${esc(item.question)}</p></div>
        </section>

        <details class="related-debriefs">
          <summary>この古典をゲームで確かめる（${related.length}件）</summary>
          <div class="related-grid">${relatedHtml}</div>
        </details>

        <section class="source-panel">
          <h2>原文の出典</h2>
          <p>${esc(item.sourceName)}</p>
          <a class="source-link" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">出典を別タブで開く</a>
          <p class="source-note">読み下し・現代語訳・仕事への応用解釈は本コンテンツ独自の説明です。原典には異なる校訂・読み・解釈があります。</p>
        </section>

        <div class="action-row">
          <button class="secondary-btn" type="button" data-action="classics-library">古典一覧へ戻る</button>
          ${related[0] ? `<button class="primary-btn" type="button" data-case="${esc(related[0].caseId)}">この考え方をゲームで試す</button>` : ''}
        </div>
      </article>`;
    resetView();
  }

  function startCase(caseId) {
    pageMode = "game";
    currentClassicId = null;
    session = newSession(caseId);
    backButton.hidden = false;
    appendLog("case_started", { caseId, variantId: session.variant.variantId });
    renderOpening();
  }

  function messageClass(message) {
    if (message.presentation?.includes("赤") || message.speakerType === "生産部長") return "message alert";
    if (message.speakerType === "送信プレビュー" || message.speakerType === "設備監視") return "message system";
    return "message";
  }

  function renderOpening() {
    stopTimer();
    session.phase = "opening";
    const msgs = getMessages(session.caseId, session.variant.variantId, "開始");
    app.innerHTML = `
      <section class="screen-card">
        <div class="screen-head">
          <div>
            <p class="progress-label">事件発生</p>
            <h1>${esc(session.caseData.prototypeTitle)}</h1>
            <p class="lead">あなたは${esc(session.caseData.playerRole)}です。</p>
          </div>
        </div>
        <div class="message-stack">
          ${msgs.map((m,i) => `<article class="${messageClass(m)}" data-message-index="${i}">
            <span class="speaker">${esc(m.speaker)}</span><p>${esc(m.text)}</p>
          </article>`).join("")}
        </div>
        <div class="action-row">
          <button class="primary-btn" type="button" data-action="opening-next">最初の一手を決める</button>
          <button class="secondary-btn" type="button" data-action="home">別の事件を選ぶ</button>
        </div>
      </section>`;
    resetView();
    const delay = persisted.settings.reduceMotion ? 40 : 420;
    document.querySelectorAll("[data-message-index]").forEach((el,i) => setTimeout(() => el.classList.add("visible"), i * delay));
  }

  function renderInvestigation(afterInitialChoice = false, viewState = null) {
    session.phase = "investigation";
    const cards = getCards(session.caseId, session.variant.variantId);
    const limit = Number(cards[0]?.selectionLimit || session.caseData.informationLimit);
    app.innerHTML = `
      <section class="screen-card">
        <div class="screen-head">
          <div>
            <p class="progress-label">${afterInitialChoice ? "初動後の確認" : "限られた情報"}</p>
            <h1>${afterInitialChoice ? "原因と範囲を絞る" : "何を先に確かめる？"}</h1>
            <p class="lead">${afterInitialChoice ? "すでに最初の指示は現場へ届いています。" : "すべてを見る時間はありません。"} ${limit}枚まで開けます。</p>
          </div>
          ${timerMarkup()}
        </div>
        <div class="info-summary"><strong>開いた情報 ${session.selectedCards.length}/${limit}</strong>　開く前の状態には戻せません。確認時間はタイマーから差し引かれます。</div>
        <div class="info-grid">
          ${cards.map(card => {
            const selected = session.selectedCards.includes(card.cardId);
            const disabled = !selected && session.selectedCards.length >= limit;
            return `<button class="info-card ${selected ? "selected locked" : ""} ${disabled ? "disabled" : ""}" type="button"
              data-card="${card.cardId}" ${disabled ? "disabled" : ""} aria-pressed="${selected}">
              <span class="info-card-top"><span class="source">${esc(card.source)}</span><span class="time-cost">${selected ? "確認済み" : `確認 ${esc(card.timeCost)}`}</span></span>
              <span class="label">${esc(card.label)}</span>
              ${selected ? `<span class="reveal">${esc(card.reveal)}</span><span class="unknown">まだ不明：${esc(card.stillUnknown)}</span><span class="locked-note">この情報は確認済みです</span>` : ""}
            </button>`;
          }).join("")}
        </div>
        <div class="action-row">
          <button class="primary-btn" type="button" data-action="${afterInitialChoice ? "show-follow-up" : "show-choices"}" ${session.selectedCards.length < 1 ? "disabled" : ""}>
            ${afterInitialChoice ? "再開条件と役割を決める" : "この情報で決断する"}
          </button>
        </div>
      </section>`;
    if (viewState) restoreCardView(viewState);
    else resetView();
    startTimer();
  }

  function uniqueChoices() {
    const branches = getBranches(session.caseId, session.variant.variantId);
    const seen = new Set();
    return branches.filter(b => !seen.has(b.choiceId) && seen.add(b.choiceId));
  }

  function renderChoices(isInitial = false) {
    stopTimer();
    session.phase = "choice";
    const branches = uniqueChoices();
    app.innerHTML = `
      <section class="screen-card">
        <div class="screen-head">
          <div>
            <p class="progress-label">${isInitial ? "20秒の初動" : "決断"}</p>
            <h1>${isInitial ? "現場へ最初の指示を出す" : "この一手を実行する"}</h1>
            <p class="lead">${isInitial ? "原因はまだ分かりません。安全と指揮をどう扱うか決めてください。" : "危険度や正解は表示されません。見えている情報から一つ選びます。"}</p>
          </div>
          ${timerMarkup()}
        </div>
        ${session.selectedCards.length ? `<div class="info-summary"><strong>見えている情報：</strong> ${session.selectedCards.map(id => esc(getCards(session.caseId, session.variant.variantId).find(c=>c.cardId===id)?.label || id)).join("／")}</div>` : ""}
        <div class="choice-list">
          ${branches.map((b,i) => `<button class="choice-btn" type="button" data-choice="${b.choiceId}">
            <span class="choice-number">${i+1}</span>
            <span class="choice-copy">${esc(b.action)}<small>選んだ後は取り消せません。</small></span>
          </button>`).join("")}
        </div>
      </section>`;
    resetView();
    startTimer();
  }

  function selectChoice(choiceId) {
    stopTimer();
    markFirstDecision("choice_selected");
    session.selectedChoiceId = choiceId;
    appendLog("choice_selected", {
      caseId: session.caseId, variantId: session.variant.variantId,
      choiceId, selectedCards: [...session.selectedCards], secondsRemaining: session.timer
    });
    if (session.caseId === "CAS-012" && session.phase === "choice" && session.selectedCards.length === 0) {
      const branch = getBranches(session.caseId, session.variant.variantId).find(b => b.choiceId === choiceId);
      app.innerHTML = `<section class="screen-card">
        <p class="progress-label">指示が現場へ届く</p>
        <h1>${esc(branch.action)}</h1>
        <div class="story-step"><div class="step-label">即時反応</div><p>${esc(branch.immediateReaction)}</p></div>
        <div class="action-row"><button class="primary-btn" type="button" data-action="investigate-after-choice">原因と影響を調べる</button></div>
      </section>`;
      resetView();
      return;
    }
    renderStory();
  }

  function renderFollowUpChoices(resetTimer = false) {
    stopTimer();
    if (resetTimer) setSessionTimer(30);
    session.phase = "followup";
    const followUps = getCrisisFollowUps(session.variant.variantId);
    const initial = getBranches(session.caseId, session.variant.variantId).find(b => b.choiceId === session.selectedChoiceId);
    app.innerHTML = `
      <section class="screen-card">
        <div class="screen-head">
          <div>
            <p class="progress-label">調査後の二段目判断</p>
            <h1>誰が、どの条件で再開を決める？</h1>
            <p class="lead">最初の指示は取り消せません。開いた情報を使い、停止後の役割と再開条件を決めます。</p>
          </div>
          ${timerMarkup()}
        </div>
        <div class="info-summary"><strong>最初の指示：</strong>${esc(initial?.action || "未確認")}<br><strong>確認した情報：</strong>${session.selectedCards.map(id => esc(getCards(session.caseId, session.variant.variantId).find(c=>c.cardId===id)?.label || id)).join("／")}</div>
        <div class="choice-list">
          ${followUps.map((f,i) => `<button class="choice-btn" type="button" data-followup="${f.followUpId}">
            <span class="choice-number">${i+1}</span>
            <span class="choice-copy">${esc(f.action)}<small>初動の結果を引き継ぎ、次の判断によって復旧の進み方が変わります。</small></span>
          </button>`).join("")}
        </div>
      </section>`;
    resetView();
    startTimer();
  }

  function selectFollowUp(followUpId) {
    stopTimer();
    session.selectedFollowUpId = followUpId;
    appendLog("followup_selected", {
      caseId:session.caseId, variantId:session.variant.variantId, choiceId:session.selectedChoiceId,
      followUpId, selectedCards:[...session.selectedCards], secondsRemaining:session.timer
    });
    renderStory();
  }

  function resolveOutcome(baseBranch) {
    if (session.caseId !== "CAS-012") return baseBranch;
    const follow = getCrisisFollowUps(session.variant.variantId).find(x => x.followUpId === session.selectedFollowUpId);
    if (!follow) return baseBranch;
    const safeInitial = baseBranch.choiceId === "CHO-058";
    return {
      ...baseBranch,
      followUpId: follow.followUpId,
      followUpAction: follow.action,
      followUpReaction: follow.reaction,
      delayedChange: follow.delayedChange,
      hiddenReveal: session.variant.hiddenTruth,
      endingTitle: !safeInitial && follow.followUpId === "FUP-012-SAFE" ? "遅れた停止でも、二次被害は止めた" : follow.endingTitle,
      protected: follow.protected,
      cost: safeInitial ? follow.cost : `${baseBranch.cost}。その後、${follow.cost}`,
      unresolved: safeInitial ? follow.unresolved : `${baseBranch.unresolved}／${follow.unresolved}`,
      replayQuestion: follow.replayQuestion
    };
  }

  function pickedClueReview() {
    const cards = getCards(session.caseId, session.variant.variantId);
    const picked = cards.filter(c => session.selectedCards.includes(c.cardId));
    const strongPicked = picked.filter(c => c.clueStrength === "強");
    if (strongPicked.length) {
      return `<div class="clue-review"><strong>判断材料になった手掛かり</strong><br>${strongPicked.map(c => esc(c.label)).join("／")}</div>`;
    }
    const missed = cards.find(c => c.clueStrength === "強" && !session.selectedCards.includes(c.cardId));
    return missed ? `<div class="clue-review missed"><strong>別の判断につながった可能性のある情報</strong><br>${esc(missed.label)} - ${esc(missed.reveal)}</div>` : "";
  }

  function buildStorySteps(baseBranch) {
    const outcome = resolveOutcome(baseBranch);
    if (session.caseId === "CAS-012") return [
      {label:"初動の影響", text:baseBranch.delayedChange, cls:""},
      {label:"調査後の判断", text:outcome.followUpReaction, cls:""},
      {label:"復旧まで", text:outcome.delayedChange, cls:""},
      {label:"隠れていた事実", text:outcome.hiddenReveal, cls:"truth"},
      {label:"結末", text:outcome.endingTitle, cls:"ending"}
    ];
    return [
      {label:"即時反応", text:outcome.immediateReaction, cls:""},
      {label:session.caseData.delayedLabel || "その後", text:outcome.delayedChange, cls:""},
      {label:"隠れていた事実", text:outcome.hiddenReveal, cls:"truth"},
      {label:"結末", text:outcome.endingTitle, cls:"ending"}
    ];
  }

  function renderStory() {
    stopTimer();
    session.phase = "story";
    const branch = getBranches(session.caseId, session.variant.variantId).find(b => b.choiceId === session.selectedChoiceId);
    const steps = buildStorySteps(branch);
    session.storyIndex = 0;
    app.innerHTML = `
      <section class="screen-card">
        <p class="progress-label">状況が進む</p>
        <h1>${session.caseId === "CAS-012" ? "二つの判断の、その後" : "選んだ一手の、その後"}</h1>
        <div id="storySteps" class="story-steps"></div>
        <div id="storyActions" class="action-row">
          <button class="advance-btn primary-btn" type="button" data-action="advance-story">次の反応を見る</button>
          <button class="secondary-btn" type="button" data-action="reveal-all-story">まとめて見る</button>
        </div>
      </section>`;
    resetView();
    revealNextStoryStep(steps, branch);
  }

  function revealNextStoryStep(steps, branch) {
    const container = document.getElementById("storySteps");
    if (!container) return;
    if (session.storyIndex < steps.length) {
      const step = steps[session.storyIndex++];
      container.insertAdjacentHTML("beforeend", `<article class="story-step ${step.cls}"><div class="step-label">${esc(step.label)}</div><${step.cls === "ending" ? "h2" : "p"}>${esc(step.text)}</${step.cls === "ending" ? "h2" : "p"}></article>`);
      container.lastElementChild.scrollIntoView({behavior:persisted.settings.reduceMotion ? "auto" : "smooth", block:"nearest"});
    }
    const action = document.getElementById("storyActions");
    if (session.storyIndex >= steps.length) {
      action.innerHTML = `<button class="primary-btn" type="button" data-action="show-outcome">結末を整理する</button>`;
    }
  }

  function revealAllStorySteps() {
    const branch = getBranches(session.caseId, session.variant.variantId).find(b => b.choiceId === session.selectedChoiceId);
    const steps = buildStorySteps(branch);
    while (session.storyIndex < steps.length) revealNextStoryStep(steps, branch);
    appendLog("story_revealed_all", { caseId: session.caseId, variantId: session.variant.variantId });
  }

  function commitOutcome(branch) {
    const seen = persisted.seenVariants[session.caseId] || [];
    if (!seen.includes(session.variant.variantId)) seen.push(session.variant.variantId);
    persisted.seenVariants[session.caseId] = seen;
    persisted.endings[session.caseId] = persisted.endings[session.caseId] || {};
    const endingKey = session.caseId === "CAS-012"
      ? `${session.variant.variantId}|${branch.choiceId}|${session.selectedFollowUpId}`
      : `${session.variant.variantId}|${branch.choiceId}`;
    persisted.endings[session.caseId][endingKey] = true;
    if (!persisted.completedCases.includes(session.caseId)) persisted.completedCases.push(session.caseId);
    saveState();
    appendLog("outcome_viewed", {
      caseId: session.caseId, variantId: session.variant.variantId,
      choiceId: branch.choiceId, followUpId: session.selectedFollowUpId, selectedCards: [...session.selectedCards],
      elapsedSeconds: Math.round((Date.now() - session.startedAt)/1000)
    });
  }

  function renderOutcome() {
    const baseBranch = getBranches(session.caseId, session.variant.variantId).find(b => b.choiceId === session.selectedChoiceId);
    const branch = resolveOutcome(baseBranch);
    commitOutcome(branch);
    const debriefs = getDebriefs(session.caseId);
    const chosenCards = getCards(session.caseId, session.variant.variantId).filter(c => session.selectedCards.includes(c.cardId));
    const missed = getCards(session.caseId, session.variant.variantId).filter(c => !session.selectedCards.includes(c.cardId));
    app.innerHTML = `
      <section class="screen-card">
        <p class="progress-label">結末</p>
        <h1>${esc(branch.endingTitle)}</h1>
        <p class="lead">勝敗ではなく、何を守り、何を支払ったかを確認します。</p>
        ${session.caseId === "CAS-012" ? `<div class="info-summary"><strong>初動：</strong>${esc(baseBranch.action)}<br><strong>調査後：</strong>${esc(branch.followUpAction || "未選択")}</div>` : ""}
        ${pickedClueReview()}
        <div class="outcome-grid">
          <div class="outcome-item"><span>守れたもの</span>${esc(branch.protected)}</div>
          <div class="outcome-item"><span>支払った代償</span>${esc(branch.cost)}</div>
          <div class="outcome-item"><span>残る課題</span>${esc(branch.unresolved)}</div>
        </div>
        <div class="info-summary" style="margin-top:15px">
          <strong>あなたが開いた情報：</strong> ${chosenCards.map(c=>esc(c.label)).join("／") || "なし"}<br>
          <strong>まだ見ていない情報：</strong> ${missed.slice(0,2).map(c=>esc(c.label)).join("／") || "なし"}
        </div>
        <details class="debrief compact-debrief">
          <summary>古典で振り返る（任意） - ${esc(debriefs[0].classic)}</summary>
          <h2>${esc(debriefs[0].heading)}</h2>
          <div class="classic-interpretation"><span>現代的な応用解釈</span>${esc(debriefs[0].oneLine)}</div>
          <div class="source-guide"><span>${esc(debriefs[0].sourceLevel)}</span>${esc(debriefs[0].sourceGuide)}</div>
          <p><strong>問い：</strong>${esc(debriefs[0].question)}</p>
          <p>${esc(debriefs[0].connection)}</p>
          <p><strong>誤用注意：</strong>${esc(debriefs[0].misuseWarning)}</p>
          <p class="source-note">${esc(debriefs[0].sourceNote || debriefs[0].details)}</p>
        </details>
        ${debriefs.slice(1).map(d => `<details class="debrief compact-debrief">
          <summary>別の見方 - ${esc(d.classic)}：${esc(d.heading)}</summary>
          <div class="classic-interpretation"><span>現代的な応用解釈</span>${esc(d.oneLine)}</div>
          <div class="source-guide"><span>${esc(d.sourceLevel)}</span>${esc(d.sourceGuide)}</div>
          <p><strong>問い：</strong>${esc(d.question)}</p>
          <p>${esc(d.connection)}</p>
          <p><strong>誤用注意：</strong>${esc(d.misuseWarning)}</p>
          <p class="source-note">${esc(d.sourceNote || d.details)}</p>
        </details>`).join("")}
        <div class="feedback-box">
          <h2>試遊後の感想</h2>
          <div class="feedback-question"><strong>面白さ</strong><div class="rating-row" aria-label="5段階評価">
            ${[1,2,3,4,5].map(n => `<button class="rating-btn ${session.feedbackRating === n ? "selected" : ""}" type="button" data-rating="${n}" aria-label="${n}点">${n}</button>`).join("")}
          </div></div>
          <div class="feedback-question"><strong>予想外の展開があった</strong><div class="chip-row">
            <button class="feedback-chip ${session.feedbackSurprise === true ? "selected" : ""}" type="button" data-feedback-key="surprise" data-feedback-value="true">はい</button>
            <button class="feedback-chip ${session.feedbackSurprise === false ? "selected" : ""}" type="button" data-feedback-key="surprise" data-feedback-value="false">いいえ</button>
          </div></div>
          <div class="feedback-question"><strong>もう一度、別の事情で遊びたい</strong><div class="chip-row">
            <button class="feedback-chip ${session.feedbackReplayIntent === true ? "selected" : ""}" type="button" data-feedback-key="replayIntent" data-feedback-value="true">はい</button>
            <button class="feedback-chip ${session.feedbackReplayIntent === false ? "selected" : ""}" type="button" data-feedback-key="replayIntent" data-feedback-value="false">いいえ</button>
          </div></div>
          <div class="feedback-question"><strong>長さ</strong><div class="chip-row">
            ${[["short","短い"],["just","ちょうどよい"],["long","長い"]].map(([value,label]) => `<button class="feedback-chip ${session.feedbackLength === value ? "selected" : ""}" type="button" data-feedback-key="length" data-feedback-value="${value}">${label}</button>`).join("")}
          </div></div>
          <p class="lead" style="margin-top:10px">回答はこの端末内の試遊ログにだけ保存されます。</p>
        </div>
        <div class="notice"><strong>再挑戦の問い：</strong>${esc(branch.replayQuestion)}</div>
        <div class="action-row">
          <button class="primary-btn" type="button" data-action="replay">${playedCount(session.caseId) < 3 ? `未体験の展開で再挑戦（あと${3-playedCount(session.caseId)}）` : "別の事情で再挑戦"}</button>
          <button class="secondary-btn" type="button" data-action="home">${D.cases.length}ケースへ戻る</button>
        </div>
      </section>`;
    resetView();
  }

  function toggleCard(cardId, cardElement) {
    const viewState = cardElement ? { cardId, top:cardElement.getBoundingClientRect().top, scrollY:window.scrollY } : null;
    const cards = getCards(session.caseId, session.variant.variantId);
    const card = cards.find(x => x.cardId === cardId);
    const limit = Number(cards[0]?.selectionLimit || session.caseData.informationLimit);
    if (session.selectedCards.includes(cardId)) return showToast("一度確認した情報は戻せません。");
    if (session.selectedCards.length >= limit) return showToast(`開ける情報は${limit}枚までです。`);
    markFirstDecision("information_opened");
    session.selectedCards.push(cardId);
    const cost = persisted.settings.timerOff ? 0 : cardTimeCost(card);
    const before = session.timer;
    if (cost) session.timer = Math.max(0, session.timer - cost);
    const expiredByCost = session.timer === 0 && !session.timedOut;
    if (expiredByCost) {
      session.timedOut = true;
      session.timerRunning = false;
    }
    appendLog("information_opened", {
      caseId: session.caseId, variantId: session.variant.variantId, cardId,
      timeCostSeconds: cost, secondsBefore: before, secondsRemaining: session.timer
    });
    renderInvestigation(session.caseId === "CAS-012" && !!session.selectedChoiceId, viewState);
    if (expiredByCost) requestAnimationFrame(showTimeoutMessage);
  }

  if (window.__KOTEN_TEST_MODE__) {
    window.__KOTEN_TEST__ = {
      renderPath(caseId, variantId, choiceId, followUpId = null) {
        const variant = getVariants(caseId).find(v => v.variantId === variantId);
        const baseBranch = getBranches(caseId, variantId).find(b => b.choiceId === choiceId);
        if (!variant || !baseBranch) throw new Error(`Invalid test path: ${caseId}|${variantId}|${choiceId}`);
        session = newSession(caseId);
        session.variant = variant;
        session.selectedCards = getCards(caseId, variantId).slice(0, 1).map(c => c.cardId);
        session.selectedChoiceId = choiceId;
        session.selectedFollowUpId = followUpId;
        persisted.settings.timerOff = true;
        const steps = buildStorySteps(baseBranch);
        const resolved = resolveOutcome(baseBranch);
        renderOutcome();
        return {
          title: resolved.endingTitle,
          protected: resolved.protected,
          cost: resolved.cost,
          unresolved: resolved.unresolved,
          stepCount: steps.length,
          emptyStepCount: steps.filter(x => !x.label || !x.text).length,
          outcomeItems: document.querySelectorAll('.outcome-item').length,
          ratings: document.querySelectorAll('[data-rating]').length,
          followUpShown: caseId !== 'CAS-012' || document.body.innerText.includes('調査後：')
        };
      }
    };
  }

  function exportLogs() {
    let logs = [];
    try {
      const legacyLog = LEGACY_LOG_KEYS.map(key => localStorage.getItem(key)).find(Boolean);
      logs = JSON.parse(localStorage.getItem(LOG_KEY) || legacyLog || "[]");
    } catch {}
    const payload = {
      exportedAt: new Date().toISOString(),
      prototypeVersion: "v020",
      state: persisted,
      logs
    };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `classic-one-playlog-${Date.now()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function resetPrototype() {
    if (!confirm("試作のプレイ履歴と評価をすべて削除しますか？")) return;
    try {
      localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LOG_KEY);
      LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
      LEGACY_LOG_KEYS.forEach(key => localStorage.removeItem(key));
    } catch {}
    persisted = defaultPersisted();
    renderHome();
    showToast("試作履歴を削除しました。");
  }

  app.addEventListener("input", (event) => {
    if (event.target.matches("[data-home-search]")) {
      homeFilters.query = event.target.value;
      applyHomeFilters();
    }
    if (event.target.matches("[data-classic-search]")) {
      classicFilters.query = event.target.value;
      applyClassicFilters();
    }
  });
  app.addEventListener("change", (event) => {
    if (event.target.matches("[data-home-category]")) {
      homeFilters.category = event.target.value;
      applyHomeFilters();
    }
    if (event.target.matches("[data-home-unfinished]")) {
      homeFilters.unfinishedOnly = event.target.checked;
      applyHomeFilters();
    }
  });

  app.addEventListener("click", (event) => {
    const classicButton = event.target.closest("[data-classic]");
    if (classicButton) return renderClassicDetail(classicButton.dataset.classic);

    const caseButton = event.target.closest("[data-case]");
    if (caseButton) return startCase(caseButton.dataset.case);

    const card = event.target.closest("[data-card]");
    if (card) return toggleCard(card.dataset.card, card);

    const choice = event.target.closest("[data-choice]");
    if (choice) return selectChoice(choice.dataset.choice);

    const followUp = event.target.closest("[data-followup]");
    if (followUp) return selectFollowUp(followUp.dataset.followup);

    const rating = event.target.closest("[data-rating]");
    if (rating && session) {
      session.feedbackRating = Number(rating.dataset.rating);
      document.querySelectorAll("[data-rating]").forEach(x => x.classList.toggle("selected", x === rating));
      saveFeedback();
      return showToast(`${session.feedbackRating}点を端末内に保存しました。`);
    }

    const feedback = event.target.closest("[data-feedback-key]");
    if (feedback && session) {
      const key = feedback.dataset.feedbackKey;
      const raw = feedback.dataset.feedbackValue;
      const value = raw === "true" ? true : raw === "false" ? false : raw;
      if (key === "surprise") session.feedbackSurprise = value;
      if (key === "replayIntent") session.feedbackReplayIntent = value;
      if (key === "length") session.feedbackLength = value;
      document.querySelectorAll(`[data-feedback-key="${key}"]`).forEach(x => x.classList.toggle("selected", x === feedback));
      saveFeedback();
      return showToast("試遊後の感想を保存しました。");
    }

    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === "home") renderHome();
    if (action === "classics-library") renderClassicsLibrary();
    if (action === "random-case") startRandomVisibleCase();
    if (action === "reset-home-filters") { homeFilters = { query:"", category:"all", unfinishedOnly:false }; renderHome(); }
    if (action === "opening-next") {
      if (session.caseId === "CAS-012") { setSessionTimer(20); renderChoices(true); }
      else renderInvestigation(false);
    }
    if (action === "investigate-after-choice") { setSessionTimer(45); renderInvestigation(true); }
    if (action === "show-choices") renderChoices(false);
    if (action === "show-follow-up") renderFollowUpChoices(true);
    if (action === "show-story") renderStory();
    if (action === "advance-story") {
      const branch = getBranches(session.caseId, session.variant.variantId).find(b => b.choiceId === session.selectedChoiceId);
      revealNextStoryStep(buildStorySteps(branch), branch);
    }
    if (action === "reveal-all-story") revealAllStorySteps();
    if (action === "show-outcome") renderOutcome();
    if (action === "replay") {
      const id = session.caseId;
      session.actualReplay = true;
      saveFeedback();
      appendLog("actual_replay", { caseId:session.caseId, variantId:session.variant.variantId, playId:session.playId });
      startCase(id);
    }
    if (action === "timer-pause" && session) {
      session.timerRunning = !session.timerRunning;
      actionEl.textContent = session.timerRunning ? "停止" : "再開";
    }
    if (action === "timer-extend" && session) {
      session.timer += 30;
      session.timerRunning = true;
      syncTimerControls();
      appendLog("timer_extended", { caseId:session.caseId, variantId:session.variant.variantId, phase:session.phase, secondsRemaining:session.timer });
      showToast("30秒延長しました。");
    }
    if (action === "export-log") exportLogs();
    if (action === "reset-prototype") resetPrototype();
  });

  backButton.addEventListener("click", () => {
    if (!session && pageMode === "classic-detail") return renderClassicsLibrary();
    if (!session && pageMode === "classics-library") return renderHome();
    if (!session) return renderHome();
    if (session.phase === "opening") return renderHome();
    if (session.phase === "investigation" || session.phase === "choice") return renderOpening();
    if (session.phase === "followup") return renderInvestigation(true);
    if (session.phase === "story") return session.caseId === "CAS-012" ? renderFollowUpChoices(false) : renderChoices(false);
    renderHome();
  });

  settingsButton.addEventListener("click", () => {
    timerOffSetting.checked = persisted.settings.timerOff;
    reduceMotionSetting.checked = persisted.settings.reduceMotion;
    participantCodeSetting.value = persisted.settings.participantCode || "";
    settingsDialog.showModal();
  });
  timerOffSetting.addEventListener("change", () => {
    persisted.settings.timerOff = timerOffSetting.checked; saveState();
    if (session && (session.phase === "investigation" || session.phase === "choice" || session.phase === "followup")) {
      session.timerRunning = false;
      if (session.phase === "investigation") renderInvestigation(session.caseId === "CAS-012" && !!session.selectedChoiceId);
      else if (session.phase === "followup") renderFollowUpChoices(false);
      else renderChoices(session.caseId === "CAS-012");
    }
  });
  reduceMotionSetting.addEventListener("change", () => {
    persisted.settings.reduceMotion = reduceMotionSetting.checked; saveState();
  });
  participantCodeSetting.addEventListener("input", () => {
    persisted.settings.participantCode = participantCodeSetting.value.trim().slice(0, 20);
    saveState();
  });

  window.addEventListener("beforeunload", stopTimer);
  renderHome();
})();
