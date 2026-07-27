(() => {
  "use strict";

  const DATA = window.CLASSICS_READING;
  if (!DATA || !Array.isArray(DATA.works)) {
    throw new Error("CLASSICS_READING is missing.");
  }

  const STORAGE_KEY = "market-base-classics-reading-v022";
  const LEGACY_KEY = "classic-one-narrative-v021";
  const app = document.getElementById("app");
  const backButton = document.getElementById("backButton");
  const toast = document.getElementById("toast");
  let toastTimer = 0;
  let query = "";
  let currentClassicId = null;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function loadProgress() {
    let readClassics = [];
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(saved?.readClassics)) readClassics = saved.readClassics;
      if (!readClassics.length) {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
        if (Array.isArray(legacy?.readClassics)) readClassics = legacy.readClassics;
      }
    } catch (_) {}
    return { readClassics: [...new Set(readClassics.filter(Boolean))] };
  }

  let progress = loadProgress();

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) {}
  }

  function isRead(classicId) {
    return progress.readClassics.includes(classicId);
  }

  function markRead(classicId) {
    if (!isRead(classicId)) {
      progress.readClassics.push(classicId);
      saveProgress();
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function scrollTopInstant() {
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
    window.setTimeout(() => { document.documentElement.style.scrollBehavior = previous; }, 160);
  }

  function replaceUrl(value) {
    try { history.replaceState(null, "", value); } catch (_) {}
  }

  function searchableText(item) {
    return [
      item.classic, item.reading, item.chapter, item.label, item.intro,
      item.decodeTitle, item.decode, item.aha, item.workplace, item.misuse,
      ...(item.keywords || [])
    ].join(" ").toLowerCase();
  }

  function renderLibrary() {
    currentClassicId = null;
    backButton.hidden = true;
    const cards = DATA.works.map(item => `
      <article class="classic-card" data-classic-card="${escapeHtml(item.classicId)}" data-search="${escapeHtml(searchableText(item))}">
        <div class="classic-card-head">
          <span class="classic-name">${escapeHtml(item.classic)}</span>
          ${isRead(item.classicId) ? '<span class="read-badge">読了</span>' : ''}
        </div>
        <p class="classic-reading">${escapeHtml(item.reading)}・${escapeHtml(item.chapter)}</p>
        <h2>${escapeHtml(item.label)}</h2>
        <p>${escapeHtml(item.intro)}</p>
        <div class="card-stats"><span class="stat-chip">原文</span><span class="stat-chip">読み下し</span><span class="stat-chip">現代語訳と解読</span></div>
        <button class="primary-btn card-action" type="button" data-classic="${escapeHtml(item.classicId)}">この古典を読む</button>
      </article>`).join("");

    app.innerHTML = `
      <section class="hero classic-hero">
        <p class="eyebrow">CLASSICS READING</p>
        <h1>古典を読み、いまの仕事につなげる。</h1>
        <p class="lead">論語・孫子・韓非子など14作品を、原文、読み下し、現代語訳、解読の順に、文章を落ち着いて読み進めます。</p>
        <div class="notice"><strong>読み方：</strong> 原文 → 読み下しの目安 → 現代語訳 → 解読 → 仕事での使い方 → 誤用注意。原文には複数の校訂・読み・解釈があるため、本ページでは仕事に応用するための一つの読み方を示します。</div>
        <div class="progress-overview" aria-label="読書進捗"><div><strong>${progress.readClassics.length}</strong><span>読了 / ${DATA.works.length}作品</span></div><div><strong>${DATA.works.length}</strong><span>収録作品</span></div></div>
      </section>
      <section class="case-browser" aria-label="古典を探す">
        <div class="browser-head"><div><h2>古典を選ぶ</h2><p class="lead" data-result-count>${DATA.works.length}作品を表示</p></div></div>
        <label class="filter-field"><span>作品名・テーマ・仕事の悩みから検索</span><input type="search" data-search-input placeholder="例：信頼、ルール、異論、教育" value="${escapeHtml(query)}"></label>
      </section>
      <section class="classic-grid">${cards}</section>
      <section class="screen-card empty-state" data-empty hidden><h2>該当する古典がありません</h2><p class="lead">別の言葉で検索してください。</p></section>`;

    applyFilter();
    replaceUrl(location.pathname + location.search);
    scrollTopInstant();
  }

  function applyFilter() {
    const normalized = query.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll("[data-classic-card]").forEach(card => {
      const match = !normalized || card.dataset.search.includes(normalized);
      card.hidden = !match;
      if (match) visible += 1;
    });
    const count = document.querySelector("[data-result-count]");
    if (count) count.textContent = `${visible}作品を表示`;
    const empty = document.querySelector("[data-empty]");
    if (empty) empty.hidden = visible !== 0;
  }

  function renderDetail(classicId) {
    const item = DATA.works.find(work => work.classicId === classicId);
    if (!item) return renderLibrary();
    currentClassicId = classicId;
    backButton.hidden = false;
    markRead(classicId);
    const index = DATA.works.findIndex(work => work.classicId === classicId);
    const previous = index > 0 ? DATA.works[index - 1] : null;
    const next = index < DATA.works.length - 1 ? DATA.works[index + 1] : null;

    app.innerHTML = `
      <article class="classic-reader">
        <header class="classic-reader-head">
          <p class="eyebrow">${escapeHtml(item.reading)}・${escapeHtml(item.chapter)}</p>
          <h1>${escapeHtml(item.classic)}｜${escapeHtml(item.label)}</h1>
          <p class="lead">${escapeHtml(item.intro)}</p>
        </header>

        <section class="passage-panel" aria-labelledby="original-heading">
          <div class="section-kicker">原文</div>
          <h2 id="original-heading">まず、古典の言葉をそのまま読む</h2>
          <blockquote class="classic-original" lang="zh-Hant">${escapeHtml(item.original)}</blockquote>
          <details class="reading-help" open>
            <summary>読み下しの目安</summary>
            <p>${escapeHtml(item.kundoku)}</p>
          </details>
          <div class="plain-translation"><span>いまの言葉にすると</span><p>${escapeHtml(item.plain)}</p></div>
        </section>

        <section class="decode-panel">
          <div class="section-kicker">解読 1</div>
          <h2>${escapeHtml(item.decodeTitle)}</h2>
          <p>${escapeHtml(item.decode)}</p>
        </section>

        <section class="aha-panel">
          <div class="section-kicker">解読 2</div>
          <h2>なるほど、ここが仕事につながる</h2>
          <p>${escapeHtml(item.aha)}</p>
        </section>

        <section class="work-panel">
          <div class="two-column-reading">
            <div><div class="section-kicker">仕事で使う</div><h2>現代の職場に当てはめると</h2><p>${escapeHtml(item.workplace)}</p></div>
            <div><div class="section-kicker warning-kicker">誤用注意</div><h2>こう使うと危ない</h2><p>${escapeHtml(item.misuse)}</p></div>
          </div>
          <div class="reflection-question"><span>自分への問い</span><p>${escapeHtml(item.question)}</p></div>
        </section>

        <section class="source-panel">
          <h2>原文の出典</h2>
          <p>${escapeHtml(item.sourceName)}</p>
          <a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">出典を別タブで開く</a>
          <p class="source-note">読み下し・現代語訳・仕事への応用解釈は本コンテンツ独自の説明です。原典には異なる校訂・読み・解釈があります。</p>
        </section>

        <div class="action-row classic-reader-nav">
          ${previous ? `<button class="secondary-btn" type="button" data-classic="${escapeHtml(previous.classicId)}">← ${escapeHtml(previous.classic)}</button>` : '<span></span>'}
          <button class="secondary-btn" type="button" data-action="library">古典一覧へ戻る</button>
          ${next ? `<button class="primary-btn" type="button" data-classic="${escapeHtml(next.classicId)}">${escapeHtml(next.classic)} →</button>` : '<span></span>'}
        </div>
      </article>`;

    replaceUrl(`#${encodeURIComponent(classicId)}`);
    scrollTopInstant();
    showToast(`${item.classic}を読了として記録しました。`);
  }

  app.addEventListener("input", event => {
    if (!event.target.matches("[data-search-input]")) return;
    query = event.target.value;
    applyFilter();
  });

  app.addEventListener("click", event => {
    const classicButton = event.target.closest("[data-classic]");
    if (classicButton) return renderDetail(classicButton.dataset.classic);
    const actionButton = event.target.closest("[data-action]");
    if (actionButton?.dataset.action === "library") renderLibrary();
  });

  backButton.addEventListener("click", renderLibrary);
  window.addEventListener("hashchange", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && id !== currentClassicId) renderDetail(id);
    if (!id && currentClassicId) renderLibrary();
  });

  const initialId = decodeURIComponent(location.hash.slice(1));
  if (initialId && DATA.works.some(work => work.classicId === initialId)) renderDetail(initialId);
  else renderLibrary();
})();
