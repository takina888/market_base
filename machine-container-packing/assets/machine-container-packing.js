/* MACHINE CONTAINER PACKING — application behavior. */
(() => {
  'use strict';

  const DATA = window.MCP_DATA;
  if (!DATA) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const escapeHTML = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const normalize = (value = '') => String(value)
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(/[\s　・／/、,。！？!?（）()「」『』【】\-_:：]+/g, '');

  const publicText = (value = '') => String(value)
    .replace(/\bCORE-\d{3}\b/g, '')
    .replace(/\bSPEC-\d{3}\b/g, '')
    .replace(/\bSRC-\d{3}\b/g, '')
    .replace(/STOP・専門家境界/g, '作業を止め、専門家へ確認する場合')
    .replace(/STOP条件/g, '作業を止める条件')
    .replace(/\bSTOP\b/g, '作業停止')
    .replace(/専門家へ移す境界を明記/g, '専門家へ確認する条件を明確にする')
    .replace(/専門家へ移す境界/g, '専門家への確認が必要な場合')
    .replace(/編集・適用上の注意/g, '実務での注意')
    .replace(/個別設計の完成保証はしない/g, '案件ごとの設計条件は専門家と確認する')
    .replace(/実航路・荷役条件は都度確認/g, '実際の航路と荷役条件は案件ごとに確認する')
    .replace(/契約・法的責任判断は対象外/g, '契約や法的責任は担当部門へ確認する')
    .replace(/梱包会社への丸投げを前提にしない/g, '梱包会社へ依頼する場合も、機械側の条件と責任分担を確認する')
    .replace(/全5層/g, '全工程')
    .replace(/本編/g, '基本')
    .replace(/専門編/g, '詳しく確認')
    .replace(/最優先/g, '重要')
    .replace(/構成確定/g, '内容確認済み')
    .replace(/一次確認/g, '確認中')
    .replace(/回答完成/g, '内容確認済み')
    .replace(/監視対象/g, '更新を継続確認')
    .replace(/The packer may screen and stop but does not become the authorized officer, owner, repairer or Administration making the structural fitness decision/gi, '梱包担当者は異常を確認して作業を止められますが、構造上の使用可否は権限を持つ担当者が判断します')
    .replace(/個別輸送設計へ移す/g, '案件ごとの輸送設計を専門家と確認する')
    .replace(/個別許容値は船社・技術者確認/g, '許容値は船会社と技術担当者へ確認する')
    .replace(/船社承認・個別手配が必要/g, '船会社の承認と個別手配を確認する')
    .replace(/メーカー保全手順を優先/g, 'メーカーの保全手順を優先する')
    .replace(/危険物の正式分類は専門部署へ/g, '危険物の分類は専門部署へ確認する')
    .replace(/運賃・納期は変動情報/g, '運賃と納期は最新情報を確認する')
    .replace(/最終寸法は実測確認/g, '最終寸法は実測する')
    .replace(/計量方法・許容差を確認/g, '計量方法と許容差を確認する')
    .replace(/識別不能なら梱包を閉じない/g, '識別できない部品がある場合は梱包を完了しない')
    .replace(/\s*・\s*・+/g, '・')
    .replace(/^[・：\s]+|[・：\s]+$/g, '')
    .replace(/\s{2,}/g, ' ');

  const escapeDisplay = (value = '') => escapeHTML(publicText(value));
  const nl2br = (value = '') => escapeDisplay(value).replace(/\n/g, '<br>');
  const uniq = (items) => [...new Set(items.filter(Boolean))];
  const sourceMap = new Map(DATA.sources.map((item) => [item.id, item]));
  const chapterMap = new Map(DATA.chapters.map((item) => [item.id, item]));
  const cardMap = new Map(DATA.cards.map((item) => [item.id, item]));

  const toast = (message) => {
    const el = $('#mcpToast');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => { el.hidden = true; }, 2200);
  };

  const activateTab = (name, scroll = true) => {
    const button = $(`[data-mbx-tab="${CSS.escape(name)}"]`);
    if (!button) return;
    button.click();
    if (scroll) {
      window.setTimeout(() => $('.mcp-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    }
  };

  const exactRelatedCardIds = (value = '') => {
    const ids = [];
    String(value).split(/[、,]/).map((part) => part.trim()).filter(Boolean).forEach((part) => {
      const range = part.match(/^(CORE|SPEC)-(\d{3})\s*[〜～~-]\s*(?:(CORE|SPEC)-)?(\d{3})$/);
      if (range && (!range[3] || range[1] === range[3])) {
        const start = Number(range[2]);
        const end = Number(range[4]);
        const step = start <= end ? 1 : -1;
        for (let valueNumber = start; valueNumber !== end + step; valueNumber += step) {
          ids.push(`${range[1]}-${String(valueNumber).padStart(3, '0')}`);
        }
        return;
      }
      ids.push(...(part.match(/(?:CORE|SPEC)-\d{3}/g) || []));
    });
    return uniq(ids).filter((id) => cardMap.has(id));
  };

  const renderRelatedCards = (value = '') => {
    const ids = exactRelatedCardIds(value);
    if (!ids.length) return '<p>関連する内容はありません。</p>';
    const buttons = ids.map((id) => {
      const card = cardMap.get(id);
      const title = card?.title || '関連する内容';
      return `<button class="mcp-related-id" type="button" data-open-card="${escapeHTML(id)}">${escapeDisplay(title)}</button>`;
    }).join('');
    return `<div class="mcp-source-list mcp-related-list">${buttons}</div>`;
  };

  const formatExcelDate = (value) => {
    const serial = Number(value);
    if (!Number.isFinite(serial)) return value ? String(value) : '確認日なし';
    const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(date);
  };

  const exactSourceIds = (values = []) => {
    const rawValues = Array.isArray(values) ? values : [values];
    const ids = [];
    rawValues.forEach((rawValue) => {
      String(rawValue || '').split(/[、,]/).map((part) => part.trim()).filter(Boolean).forEach((part) => {
        const range = part.match(/^SRC-(\d{3})\s*[〜～~-]\s*(?:SRC-)?(\d{3})$/);
        if (range) {
          const start = Number(range[1]);
          const end = Number(range[2]);
          const step = start <= end ? 1 : -1;
          for (let valueNumber = start; valueNumber !== end + step; valueNumber += step) {
            ids.push(`SRC-${String(valueNumber).padStart(3, '0')}`);
          }
          return;
        }
        ids.push(...(part.match(/SRC-\d{3}/g) || []));
      });
    });
    return uniq(ids).filter((id) => sourceMap.has(id));
  };

  const renderSources = (ids = []) => {
    const valid = exactSourceIds(ids).map((id) => sourceMap.get(id)).filter(Boolean);
    if (!valid.length) return '';
    return `<div class="mcp-source-list">${valid.map((source) => (
      `<button class="mcp-source-link" type="button" data-source-id="${escapeHTML(source.id)}" title="${escapeDisplay(source.issuer || '参考資料')}">${escapeDisplay(source.name || source.issuer || '参考資料')}</button>`
    )).join('')}</div>`;
  };

  const sourceDialog = $('#mcpSourceDialog');
  const openSourceDialog = (id) => {
    const source = sourceMap.get(id);
    if (!source || !sourceDialog) return;
    $('#mcpSourceDialogId').textContent = '参考資料';
    $('#mcpSourceDialogTitle').textContent = publicText(source.name);
    $('#mcpSourceDialogIssuer').textContent = publicText(source.issuer || '確認できず');
    $('#mcpSourceDialogStatus').textContent = publicText(source.status || '確認できず');
    $('#mcpSourceDialogUse').textContent = publicText(source.use || '確認できず');
    $('#mcpSourceDialogCaution').textContent = publicText(source.caution || '確認できず');
    $('#mcpSourceDialogChecked').textContent = formatExcelDate(source.checked);
    $('#mcpSourceDialogState').textContent = publicText(source.state || '確認できず');
    const link = $('#mcpSourceDialogLink');
    link.href = source.url || '#';
    link.hidden = !source.url;
    if (typeof sourceDialog.showModal === 'function') sourceDialog.showModal();
    else sourceDialog.setAttribute('open', '');
  };

  const fillCounts = () => {
    const counts = DATA.meta.counts;
    const pairs = [
      ['statChapters', counts.chapters],
      ['statCases', counts.cases],
      ['statQa', counts.qa],
      ['statChecklist', counts.checklist],
      ['statTerms', counts.terms],
    ];
    pairs.forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
    const version = $('#mcpVersion');
    if (version) version.textContent = DATA.meta.version;
  };

  // ── Global search ─────────────────────────────────────────────
  const searchIndex = [
    ...DATA.chapters.map((item) => ({
      type: '章', tab: 'learn', id: item.id, chapterId: item.id,
      title: `第${item.order}章 ${item.title}`,
      description: item.intro,
      search: normalize([item.id, item.title, item.intro, item.goal, item.layer, item.applicability, item.priority, item.source, item.note].join(' ')),
    })),
    ...DATA.cards.map((item) => ({
      type: '教材', tab: 'learn', id: item.id, chapterId: item.chapterId,
      title: item.title,
      description: item.question || item.answer,
      search: normalize([item.id, item.title, item.question, item.answer, item.layer, item.type, item.applicability, item.expertBoundary, item.sourceIds, item.priority].join(' ')),
    })),
    ...DATA.cases.map((item) => ({
      type: 'ケース', tab: 'cases', id: item.id,
      title: item.title,
      description: item.firstJudgment,
      search: normalize([item.id, item.title, item.category, item.situation, item.firstJudgment, item.checkOrder, item.adoption, item.rejection, item.stop, item.evidence, item.handoff, item.goal, item.relatedCardIds, item.sourceIds].join(' ')),
    })),
    ...DATA.qa.map((item) => ({
      type: 'Q&A', tab: 'qa', id: item.id,
      title: item.question,
      description: item.shortAnswer,
      search: normalize([item.id, item.category, item.question, item.shortAnswer, item.reason, item.decisionOrder, item.check, item.stop, item.fullAnswer, item.relatedCardIds, item.sourceIds].join(' ')),
    })),
    ...DATA.checklist.map((item) => ({
      type: 'チェック', tab: 'check', id: item.id,
      title: item.item,
      description: item.evidence || item.why,
      search: normalize([item.id, item.section, item.item, item.timing, item.owner, item.approver, item.criteria, item.why, item.evidence, item.applicability, item.stop, item.relatedCardIds, item.recheck].join(' ')),
    })),
    ...DATA.terms.map((item) => ({
      type: '用語', tab: 'terms', id: item.id,
      title: item.term,
      description: item.plain,
      search: normalize([item.id, item.term, item.official, item.plain, item.practical, item.confusion, item.related, item.sourceIds].join(' ')),
    })),
    ...DATA.sources.map((item) => ({
      type: '公式出典', tab: 'source', id: item.id,
      title: item.name,
      description: item.issuer,
      search: normalize([item.id, item.name, item.issuer, item.status, item.use, item.caution, item.state].join(' ')),
    })),
  ];

  const globalInput = $('#mcpGlobalSearch');
  const globalResults = $('#mcpGlobalResults');
  const globalClear = $('#mcpGlobalClear');

  const rankSearchResult = (item, query) => {
    const title = normalize(item.title);
    const id = normalize(item.id);
    if (id === query || title === query) return 0;
    if (id.startsWith(query) || title.startsWith(query)) return 1;
    if (title.includes(query)) return 2;
    return 3;
  };

  const renderGlobalResults = () => {
    if (!globalInput || !globalResults) return;
    const raw = globalInput.value.trim();
    const query = normalize(raw);
    globalClear.hidden = !raw;
    if (!query) {
      globalResults.hidden = true;
      globalResults.innerHTML = '';
      return;
    }
    const allResults = searchIndex
      .filter((item) => item.search.includes(query))
      .sort((a, b) => rankSearchResult(a, query) - rankSearchResult(b, query));
    const results = allResults.slice(0, 14);

    if (!results.length) {
      globalResults.innerHTML = '<div class="mcp-search-empty">該当する内容が見つかりません。言葉を短くしてお試しください。</div>';
      globalResults.hidden = false;
      return;
    }
    globalResults.innerHTML = results.map((item, index) => (
      `<button class="mcp-search-result" type="button" data-global-result="${index}">
        <span class="mcp-result-type">${escapeHTML(item.type)}</span>
        <span><strong>${escapeDisplay(item.title)}</strong><small>${escapeDisplay(item.description)}</small></span>
        <span aria-hidden="true">›</span>
      </button>`
    )).join('') + (allResults.length > results.length
      ? `<div class="mcp-search-more">全${allResults.length}件のうち上位${results.length}件を表示しています。言葉を追加すると絞り込めます。</div>`
      : `<div class="mcp-search-more">全${allResults.length}件</div>`);
    globalResults.dataset.items = JSON.stringify(results);
    globalResults.hidden = false;
  };

  const openSearchResult = (item) => {
    globalResults.hidden = true;
    if (item.tab === 'learn') {
      activateTab('learn', false);
      $('#chapterSelect').value = item.chapterId || 'all';
      $('#learnSearch').value = item.type === '教材' ? item.id : '';
      renderChapters();
      window.setTimeout(() => {
        const chapter = document.getElementById(`chapter-${item.chapterId}`);
        if (chapter) chapter.open = true;
        const card = document.getElementById(`card-${item.id}`);
        if (card) card.open = true;
        (card || chapter)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
    if (item.tab === 'cases') {
      activateTab('cases', false);
      $('#caseSearch').value = item.id;
      $('#caseCategory').value = 'all';
      caseVisible = 18;
      renderCases();
      openAndScroll(`case-${item.id}`);
    }
    if (item.tab === 'qa') {
      activateTab('qa', false);
      $('#qaSearch').value = item.id;
      $('#qaCategory').value = 'all';
      qaVisible = DATA.qa.length;
      renderQa();
      openAndScroll(`qa-${item.id}`);
    }
    if (item.tab === 'check') {
      activateTab('check', false);
      checkFilter = 'all';
      $('#checkSearch').value = item.id;
      $('#checkSection').value = 'all';
      renderChecks();
      openAndScroll(`check-${item.id}`);
    }
    if (item.tab === 'terms') {
      activateTab('terms', false);
      $('#termSearch').value = item.id;
      renderTerms();
      openAndScroll(`term-${item.id}`);
    }
    if (item.tab === 'source') {
      openSourceDialog(item.id);
    }
  };

  globalInput?.addEventListener('input', renderGlobalResults);
  globalInput?.addEventListener('focus', renderGlobalResults);
  globalClear?.addEventListener('click', () => {
    globalInput.value = '';
    globalInput.focus();
    renderGlobalResults();
  });
  globalResults?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-global-result]');
    if (!button) return;
    const items = JSON.parse(globalResults.dataset.items || '[]');
    const item = items[Number(button.dataset.globalResult)];
    if (item) openSearchResult(item);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.mcp-global-search-wrap') && globalResults) globalResults.hidden = true;
  });

  // ── Learn / chapters ──────────────────────────────────────────
  const chapterSelect = $('#chapterSelect');
  const learnSearch = $('#learnSearch');
  const chapterList = $('#chapterList');
  const chapterCount = $('#chapterResultCount');

  const buildSelectOptions = (select, values, labeler = (value) => value) => {
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = labeler(value);
      select.append(option);
    });
  };

  DATA.chapters.forEach((chapter) => {
    const option = document.createElement('option');
    option.value = chapter.id;
    option.textContent = `第${chapter.order}章 ${publicText(chapter.title)}`;
    chapterSelect?.append(option);
  });

  const renderLearningCard = (card) => (
    `<details class="mcp-learning-card" id="card-${escapeHTML(card.id)}">
      <summary>
        <span>
          <strong>${escapeDisplay(card.title)}</strong>
          <p>${escapeDisplay(card.question)}</p>
        </span>
        <span class="mcp-chevron" aria-hidden="true"></span>
      </summary>
      <div class="mcp-learning-body">
        <div class="mcp-answer-box">${escapeDisplay(card.answer)}</div>
        <div class="mcp-detail-grid mcp-detail-grid-2">
          <div class="mcp-detail-block"><h4>対象となる場面</h4><p>${escapeDisplay(card.applicability || '案件の条件に応じて確認します')}</p></div>
          <div class="mcp-detail-block is-warning"><h4>専門家への確認が必要な場合</h4><p>${escapeDisplay(card.expertBoundary || '案件の条件に応じて専門家へ確認します')}</p></div>
        </div>
        ${renderSources(card.sourceIds)}
      </div>
    </details>`
  );

  function renderChapters() {
    if (!chapterList) return;
    const selected = chapterSelect?.value || 'all';
    const query = normalize(learnSearch?.value || '');
    const chapters = DATA.chapters.filter((chapter) => selected === 'all' || chapter.id === selected);
    const rendered = [];

    chapters.forEach((chapter) => {
      const allCards = DATA.cards.filter((card) => card.chapterId === chapter.id);
      const chapterHit = !query || normalize([chapter.id, chapter.title, chapter.intro, chapter.goal].join(' ')).includes(query);
      const matchingCards = query
        ? allCards.filter((card) => normalize([card.id, card.title, card.question, card.answer, card.layer, card.type, card.applicability, card.expertBoundary, card.sourceIds, card.priority].join(' ')).includes(query))
        : allCards;
      if (query && !chapterHit && !matchingCards.length) return;
      const shownCards = chapterHit && query ? allCards : matchingCards;
      const open = selected !== 'all' || Boolean(query);
      rendered.push(
        `<details class="mcp-chapter" id="chapter-${escapeHTML(chapter.id)}" ${open ? 'open' : ''}>
          <summary class="mcp-chapter-summary">
            <span class="mcp-chapter-number">${String(chapter.order).padStart(2, '0')}</span>
            <span>
              <strong>${escapeDisplay(chapter.title)}</strong>
              <p>${escapeDisplay(chapter.intro)}</p>
              <small>${shownCards.length}項目</small>
            </span>
            <span class="mcp-chevron" aria-hidden="true"></span>
          </summary>
          <div class="mcp-chapter-body">
            <div class="mcp-chapter-goal"><strong>この章で分かること：</strong>${escapeDisplay(chapter.goal)}</div>
            <div class="mcp-detail-grid mcp-detail-grid-2 mcp-chapter-notes">
              <div class="mcp-detail-block"><h4>主な参考資料</h4><p>${escapeDisplay(chapter.source || '確認できず')}</p></div>
              <div class="mcp-detail-block is-warning"><h4>実務での注意</h4><p>${escapeDisplay(chapter.note || '案件の条件に応じて確認します')}</p></div>
            </div>
            <div class="mcp-learning-cards">${shownCards.map(renderLearningCard).join('')}</div>
          </div>
        </details>`
      );
    });

    chapterList.innerHTML = rendered.length ? rendered.join('') : '<div class="mcp-empty">該当する章・カードがありません。</div>';
    if (chapterCount) chapterCount.textContent = `${rendered.length}章`;
  }

  chapterSelect?.addEventListener('change', renderChapters);
  learnSearch?.addEventListener('input', renderChapters);
  $('#openAllChapters')?.addEventListener('click', (event) => {
    const details = $$('.mcp-chapter', chapterList);
    const shouldOpen = details.some((item) => !item.open);
    details.forEach((item) => { item.open = shouldOpen; });
    event.currentTarget.textContent = shouldOpen ? 'すべて閉じる' : 'すべて開く';
  });

  const pathMap = {
    start: 'CH01', planning: 'CH04', securing: 'CH07', rules: 'CH10', arrival: 'CH12',
  };
  $('#mcpPathGrid')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-path]');
    if (!button) return;
    chapterSelect.value = pathMap[button.dataset.path] || 'all';
    learnSearch.value = '';
    renderChapters();
    window.setTimeout(() => document.getElementById(`chapter-${chapterSelect.value}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  });

  // ── Cases ────────────────────────────────────────────────────
  const caseSearch = $('#caseSearch');
  const caseCategory = $('#caseCategory');
  const caseList = $('#caseList');
  const caseResultCount = $('#caseResultCount');
  const caseLoadMore = $('#caseLoadMore');
  let caseVisible = 18;

  buildSelectOptions(caseCategory, uniq(DATA.cases.map((item) => item.category)).sort());

  const renderCase = (item) => (
    `<details class="mcp-case" id="case-${escapeHTML(item.id)}">
      <summary class="mcp-case-summary">
        <span>
          <span class="mcp-badge-row"><span class="mcp-badge">${escapeDisplay(item.category)}</span></span>
          <strong>${escapeDisplay(item.title)}</strong>
          <p>${escapeDisplay(item.firstJudgment)}</p>
        </span>
        <span class="mcp-chevron" aria-hidden="true"></span>
      </summary>
      <div class="mcp-case-body">
        <div class="mcp-case-judgment">${escapeDisplay(item.firstJudgment)}</div>
        <div class="mcp-detail-grid">
          <div class="mcp-detail-block"><h4>想定状況</h4><p>${nl2br(item.situation)}</p></div>
          <div class="mcp-detail-block"><h4>確認順序</h4><p>${nl2br(item.checkOrder)}</p></div>
          <div class="mcp-detail-grid mcp-detail-grid-2">
            <div class="mcp-detail-block is-good"><h4>採用案・実行方法</h4><p>${nl2br(item.adoption)}</p></div>
            <div class="mcp-detail-block is-warning"><h4>不採用案</h4><p>${nl2br(item.rejection)}</p></div>
          </div>
          <div class="mcp-detail-block is-stop"><h4>作業を止める条件</h4><p>${nl2br(item.stop)}</p></div>
          <div class="mcp-detail-grid mcp-detail-grid-2">
            <div class="mcp-detail-block"><h4>必要証拠</h4><p>${nl2br(item.evidence)}</p></div>
            <div class="mcp-detail-block"><h4>現地引継ぎ</h4><p>${nl2br(item.handoff)}</p></div>
          </div>
          <div class="mcp-detail-block"><h4>学習到達点</h4><p>${nl2br(item.goal)}</p></div>
          <div class="mcp-detail-block"><h4>関連する内容</h4>${renderRelatedCards(item.relatedCardIds)}</div>
        </div>
        ${renderSources(item.sourceIds)}
      </div>
    </details>`
  );

  function filteredCases() {
    const query = normalize(caseSearch?.value || '');
    const category = caseCategory?.value || 'all';
    return DATA.cases.filter((item) => {
      const categoryHit = category === 'all' || item.category === category;
      const queryHit = !query || normalize([item.id, item.title, item.category, item.situation, item.firstJudgment, item.checkOrder, item.adoption, item.rejection, item.stop, item.evidence, item.handoff, item.goal, item.relatedCardIds, item.sourceIds].join(' ')).includes(query);
      return categoryHit && queryHit;
    });
  }

  function renderCases() {
    const items = filteredCases();
    const shown = items.slice(0, caseVisible);
    caseList.innerHTML = shown.length ? shown.map(renderCase).join('') : '<div class="mcp-empty">該当するケースがありません。</div>';
    caseResultCount.textContent = `${items.length}件`;
    caseLoadMore.hidden = shown.length >= items.length;
  }

  caseSearch?.addEventListener('input', () => { caseVisible = 18; renderCases(); });
  caseCategory?.addEventListener('change', () => { caseVisible = 18; renderCases(); });
  caseLoadMore?.addEventListener('click', () => { caseVisible += 18; renderCases(); });
  $('#caseReset')?.addEventListener('click', () => {
    caseSearch.value = ''; caseCategory.value = 'all'; caseVisible = 18; renderCases();
  });

  // ── Q&A ──────────────────────────────────────────────────────
  const qaSearch = $('#qaSearch');
  const qaCategory = $('#qaCategory');
  const qaList = $('#qaList');
  const qaResultCount = $('#qaResultCount');
  const qaLoadMore = $('#qaLoadMore');
  let qaVisible = DATA.qa.length;

  buildSelectOptions(qaCategory, uniq(DATA.qa.map((item) => item.category)).sort());

  const renderQaItem = (item) => (
    `<details class="mcp-qa" id="qa-${escapeHTML(item.id)}">
      <summary class="mcp-qa-summary">
        <span>
          <span class="mcp-badge-row"><span class="mcp-badge">${escapeDisplay(item.category)}</span></span>
          <strong>${escapeDisplay(item.question)}</strong>
          <p>${escapeDisplay(item.shortAnswer)}</p>
        </span>
        <span class="mcp-chevron" aria-hidden="true"></span>
      </summary>
      <div class="mcp-qa-body">
        <div class="mcp-qa-answer">${escapeDisplay(item.shortAnswer)}</div>
        <div class="mcp-detail-grid">
          <div class="mcp-detail-block"><h4>なぜ</h4><p>${nl2br(item.reason)}</p></div>
          <div class="mcp-detail-block"><h4>判断順</h4><p>${nl2br(item.decisionOrder)}</p></div>
          <div class="mcp-detail-block"><h4>実務で確認すること</h4><p>${nl2br(item.check)}</p></div>
          <div class="mcp-detail-block is-stop"><h4>作業を止め、専門家へ確認する場合</h4><p>${nl2br(item.stop)}</p></div>
          <div class="mcp-detail-block"><h4>関連する内容</h4>${renderRelatedCards(item.relatedCardIds)}</div>
        </div>
        ${renderSources(item.sourceIds)}
      </div>
    </details>`
  );

  function filteredQa() {
    const query = normalize(qaSearch?.value || '');
    const category = qaCategory?.value || 'all';
    return DATA.qa.filter((item) => {
      const categoryHit = category === 'all' || item.category === category;
      const queryHit = !query || normalize([item.id, item.category, item.question, item.shortAnswer, item.reason, item.decisionOrder, item.check, item.stop, item.fullAnswer, item.relatedCardIds, item.sourceIds].join(' ')).includes(query);
      return categoryHit && queryHit;
    });
  }

  function renderQa() {
    const items = filteredQa();
    const shown = items.slice(0, qaVisible);
    qaList.innerHTML = shown.length ? shown.map(renderQaItem).join('') : '<div class="mcp-empty">該当するQ&Aがありません。</div>';
    qaResultCount.textContent = `${items.length}問`;
    qaLoadMore.hidden = shown.length >= items.length;
  }

  qaSearch?.addEventListener('input', () => { qaVisible = DATA.qa.length; renderQa(); });
  qaCategory?.addEventListener('change', () => { qaVisible = DATA.qa.length; renderQa(); });
  qaLoadMore?.addEventListener('click', () => { qaVisible = DATA.qa.length; renderQa(); });
  $('#qaReset')?.addEventListener('click', () => {
    qaSearch.value = ''; qaCategory.value = 'all'; qaVisible = DATA.qa.length; renderQa();
  });

  // ── Checklist ────────────────────────────────────────────────
  const CHECK_KEY = 'marketBaseMachineContainerPackingChecklist_v1';
  const checkSearch = $('#checkSearch');
  const checkSection = $('#checkSection');
  const checkList = $('#checkList');
  const checkSummary = $('#checkSummary');
  let checkFilter = 'all';
  let checkState = {};

  try { checkState = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}') || {}; } catch { checkState = {}; }

  const getCheckRecord = (item) => ({
    status: checkState[item.id]?.status || item.defaultStatus || '未確認',
    evidence: checkState[item.id]?.evidence ?? item.evidenceLink ?? '',
    operator: checkState[item.id]?.operator ?? item.operator ?? '',
    date: checkState[item.id]?.date ?? item.date ?? '',
    comment: checkState[item.id]?.comment ?? item.comment ?? '',
    updated: checkState[item.id]?.updated || '',
  });

  const saveCheckState = () => {
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(checkState)); } catch { toast('端末へ保存できませんでした'); }
  };

  const statusLabel = (status) => ({
    '未確認': '未確認',
    'OK': '問題なし',
    'STOP': '作業停止',
    'N/A': '対象外',
    '要再確認': '要再確認',
  })[status] || publicText(status);

  const statusKey = (status) => {
    if (status === 'OK') return 'ok';
    if (status === 'STOP') return 'stop';
    if (status === '要再確認') return 'recheck';
    if (status === 'N/A') return 'na';
    return 'unconfirmed';
  };

  const checkSections = uniq(DATA.checklist.map((item) => item.section));
  buildSelectOptions(checkSection, checkSections);

  const updateCheckSummary = () => {
    const counts = { all: DATA.checklist.length, unconfirmed: 0, ok: 0, stop: 0, recheck: 0, na: 0 };
    DATA.checklist.forEach((item) => { counts[statusKey(getCheckRecord(item).status)] += 1; });
    $$('[data-check-filter]', checkSummary).forEach((button) => {
      const key = button.dataset.checkFilter;
      const strong = $('strong', button);
      if (strong) strong.textContent = counts[key] ?? 0;
      button.classList.toggle('is-active', key === checkFilter);
    });
    const completed = counts.ok + counts.na;
    const percent = Math.round((completed / DATA.checklist.length) * 100);
    $('#checkDoneCount').textContent = completed;
    $('#checkProgressPercent').textContent = `${percent}%`;
    $('#checkProgressRing').style.setProperty('--mcp-progress', `${percent * 3.6}deg`);
  };

  const matchesCheckFilter = (item) => {
    const key = statusKey(getCheckRecord(item).status);
    return checkFilter === 'all' || key === checkFilter;
  };

  const renderCheckItem = (item) => {
    const record = getCheckRecord(item);
    const statuses = ['未確認', 'OK', 'STOP', 'N/A', '要再確認'];
    return `<article class="mcp-check-item" id="check-${escapeHTML(item.id)}" data-check-id="${escapeHTML(item.id)}" data-status="${escapeHTML(record.status)}">
      <div class="mcp-check-item-head">
        <span><strong>${escapeDisplay(item.item)}</strong></span>
        <label class="mcp-visually-hidden" for="status-${escapeHTML(item.id)}">判定</label>
        <select class="mbx-select mcp-status-select" id="status-${escapeHTML(item.id)}" data-check-status>
          ${statuses.map((status) => `<option value="${status}" ${status === record.status ? 'selected' : ''}>${escapeHTML(statusLabel(status))}</option>`).join('')}
        </select>
      </div>
      <div class="mcp-check-item-meta">
        <span class="mcp-badge">${escapeDisplay(item.timing)}</span>
        <span class="mcp-badge">担当候補：${escapeDisplay(item.owner)}</span>
        <span class="mcp-badge">確認者候補：${escapeDisplay(item.approver)}</span>
        <span class="mcp-badge">適用：${escapeDisplay(item.applicability || '案件条件で確認')}</span>
      </div>
      <div class="mcp-detail-grid mcp-detail-grid-2">
        <div class="mcp-detail-block"><h4>判定基準</h4><p>${escapeDisplay(item.criteria)}</p></div>
        <div class="mcp-detail-block"><h4>なぜ必要か</h4><p>${escapeDisplay(item.why)}</p></div>
        <div class="mcp-detail-block"><h4>必要証拠</h4><p>${escapeDisplay(item.evidence || '案件条件で確認')}</p></div>
        <div class="mcp-detail-block is-warning"><h4>変更時の再確認</h4><p>${escapeDisplay(item.recheck || '関連カードと証拠へ戻る')}</p></div>
      </div>
      <div class="mcp-detail-block is-stop"><h4>作業を止める条件</h4><p>${escapeDisplay(item.stop)}</p></div>
      <div class="mcp-check-fields">
        <div class="mbx-field"><label class="mbx-label" for="evidence-${escapeHTML(item.id)}">証拠・ファイル名・URL</label><input class="mbx-input" id="evidence-${escapeHTML(item.id)}" data-check-evidence value="${escapeHTML(record.evidence)}" placeholder="例：${escapeDisplay(item.evidence || '証拠名')}"></div>
        <div class="mbx-field"><label class="mbx-label" for="operator-${escapeHTML(item.id)}">実施者</label><input class="mbx-input" id="operator-${escapeHTML(item.id)}" data-check-operator value="${escapeHTML(record.operator)}" autocomplete="name" placeholder="実施者名"></div>
        <div class="mbx-field"><label class="mbx-label" for="date-${escapeHTML(item.id)}">実施日</label><input class="mbx-input" id="date-${escapeHTML(item.id)}" data-check-date type="date" value="${escapeHTML(record.date)}"></div>
        <div class="mbx-field mcp-check-comment-field"><label class="mbx-label" for="comment-${escapeHTML(item.id)}">コメント・未解決事項</label><textarea class="mbx-textarea" id="comment-${escapeHTML(item.id)}" data-check-comment placeholder="差異、未解決事項、承認待ちなど">${escapeHTML(record.comment)}</textarea></div>
      </div>
      <div class="mcp-check-related"><h4>関連する内容</h4>${renderRelatedCards(item.relatedCardIds)}</div>
    </article>`;
  };

  function filteredChecks() {
    const query = normalize(checkSearch?.value || '');
    const section = checkSection?.value || 'all';
    return DATA.checklist.filter((item) => {
      const sectionHit = section === 'all' || item.section === section;
      const queryHit = !query || normalize([item.id, item.section, item.item, item.timing, item.owner, item.approver, item.criteria, item.why, item.evidence, item.applicability, item.stop, item.relatedCardIds, item.recheck].join(' ')).includes(query);
      return sectionHit && queryHit && matchesCheckFilter(item);
    });
  }

  function renderChecks() {
    const items = filteredChecks();
    const groups = new Map();
    items.forEach((item) => {
      if (!groups.has(item.section)) groups.set(item.section, []);
      groups.get(item.section).push(item);
    });
    const autoOpen = Boolean(normalize(checkSearch?.value || '')) || checkFilter !== 'all' || (checkSection?.value || 'all') !== 'all';
    checkList.innerHTML = groups.size ? [...groups.entries()].map(([section, sectionItems], index) => (
      `<details class="mcp-check-section" ${autoOpen || index === 0 ? 'open' : ''}>
        <summary class="mcp-check-section-summary">
          <strong>${escapeHTML(section)}</strong><small>${sectionItems.length}項目</small><span class="mcp-chevron" aria-hidden="true"></span>
        </summary>
        <div class="mcp-check-section-body">${sectionItems.map(renderCheckItem).join('')}</div>
      </details>`
    )).join('') : '<div class="mcp-empty">条件に一致するチェック項目がありません。</div>';
    updateCheckSummary();
  }

  checkSummary?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-check-filter]');
    if (!button) return;
    checkFilter = button.dataset.checkFilter;
    renderChecks();
  });
  checkSearch?.addEventListener('input', renderChecks);
  checkSection?.addEventListener('change', renderChecks);
  checkList?.addEventListener('change', (event) => {
    const itemEl = event.target.closest('[data-check-id]');
    if (!itemEl) return;
    const id = itemEl.dataset.checkId;
    const item = DATA.checklist.find((entry) => entry.id === id);
    if (!item) return;
    const record = getCheckRecord(item);
    if (event.target.matches('[data-check-status]')) record.status = event.target.value;
    record.evidence = $('[data-check-evidence]', itemEl)?.value ?? record.evidence;
    record.operator = $('[data-check-operator]', itemEl)?.value ?? record.operator;
    record.date = $('[data-check-date]', itemEl)?.value ?? record.date;
    record.comment = $('[data-check-comment]', itemEl)?.value ?? record.comment;
    record.updated = new Date().toISOString();
    checkState[id] = record;
    saveCheckState();
    itemEl.dataset.status = record.status;
    updateCheckSummary();
  });
  checkList?.addEventListener('input', (event) => {
    if (!event.target.matches('[data-check-evidence], [data-check-operator], [data-check-date], [data-check-comment]')) return;
    const itemEl = event.target.closest('[data-check-id]');
    const id = itemEl?.dataset.checkId;
    const item = DATA.checklist.find((entry) => entry.id === id);
    if (!item) return;
    const record = getCheckRecord(item);
    record.evidence = $('[data-check-evidence]', itemEl)?.value || '';
    record.operator = $('[data-check-operator]', itemEl)?.value || '';
    record.date = $('[data-check-date]', itemEl)?.value || '';
    record.comment = $('[data-check-comment]', itemEl)?.value || '';
    record.updated = new Date().toISOString();
    checkState[id] = record;
    window.clearTimeout(saveCheckState.timer);
    saveCheckState.timer = window.setTimeout(saveCheckState, 250);
  });

  const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const localDateStamp = () => {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  $('#checkExport')?.addEventListener('click', () => {
    const header = [
      '項目ID', '区分', '確認項目', '実施タイミング', '主担当候補', '承認者候補',
      '判定基準', 'なぜ必要か', '必要証拠', '適用', '停止条件', '変更時再確認', '関連カードID',
      '判定', '証拠・ファイル', '実施者', '実施日', 'コメント', '更新日時',
    ];
    const lines = [header.map(csvEscape).join(',')];
    DATA.checklist.forEach((item) => {
      const record = getCheckRecord(item);
      lines.push([
        item.id, item.section, item.item, item.timing, item.owner, item.approver,
        item.criteria, item.why, item.evidence, item.applicability, item.stop, item.recheck, item.relatedCardIds,
        record.status, record.evidence, record.operator, record.date, record.comment, record.updated,
      ].map(csvEscape).join(','));
    });
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `machine-container-packing-check-${localDateStamp()}.csv`;
    document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    toast('チェック結果をCSVで書き出しました');
  });
  $('#checkReset')?.addEventListener('click', () => {
    if (!window.confirm('この端末に保存した判定・証拠・実施者・日付・コメントをすべて消去しますか？')) return;
    checkState = {};
    try { localStorage.removeItem(CHECK_KEY); } catch { /* no-op */ }
    checkFilter = 'all';
    checkSearch.value = '';
    checkSection.value = 'all';
    renderChecks();
    toast('チェック記録をリセットしました');
  });

  // ── Terms ────────────────────────────────────────────────────
  const termSearch = $('#termSearch');
  const termList = $('#termList');
  const termResultCount = $('#termResultCount');

  const renderTerm = (item) => (
    `<details class="mcp-term" id="term-${escapeHTML(item.id)}">
      <summary class="mcp-term-summary">
        <span>
          <strong>${escapeDisplay(item.term)}</strong>
          <p>${escapeDisplay(item.plain)}</p>
        </span>
        <span class="mcp-chevron" aria-hidden="true"></span>
      </summary>
      <div class="mcp-term-body">
        <div class="mcp-term-plain">${escapeDisplay(item.plain)}</div>
        <p class="mcp-term-official">${escapeDisplay(item.official)}</p>
        <div class="mcp-detail-grid">
          <div class="mcp-detail-block"><h4>実務での意味</h4><p>${escapeDisplay(item.practical)}</p></div>
          <div class="mcp-detail-block is-warning"><h4>混同しやすい点</h4><p>${escapeDisplay(item.confusion)}</p></div>
          <div class="mcp-detail-block"><h4>関連する内容</h4><p>${escapeDisplay(item.related)}</p></div>
        </div>
        ${renderSources(item.sourceIds)}
        ${item.url ? `<a class="mcp-official-button" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">公式資料を開く</a>` : ''}
      </div>
    </details>`
  );

  function renderTerms() {
    const query = normalize(termSearch?.value || '');
    const items = DATA.terms.filter((item) => !query || normalize([item.id, item.term, item.official, item.plain, item.practical, item.confusion, item.related, item.sourceIds].join(' ')).includes(query));
    termList.innerHTML = items.length ? items.map(renderTerm).join('') : '<div class="mcp-empty">該当する用語がありません。</div>';
    termResultCount.textContent = `${items.length}語`;
  }

  termSearch?.addEventListener('input', renderTerms);
  $('#termReset')?.addEventListener('click', () => { termSearch.value = ''; renderTerms(); });

  // ── Cross navigation ─────────────────────────────────────────
  document.addEventListener('click', (event) => {
    const sourceButton = event.target.closest('[data-source-id]');
    if (sourceButton) {
      openSourceDialog(sourceButton.dataset.sourceId);
      return;
    }
    const button = event.target.closest('[data-open-card]');
    if (!button) return;
    const id = button.dataset.openCard;
    const card = cardMap.get(id);
    if (!card) return;
    activateTab('learn', false);
    chapterSelect.value = card.chapterId;
    learnSearch.value = id;
    renderChapters();
    window.setTimeout(() => {
      const chapter = document.getElementById(`chapter-${card.chapterId}`);
      const cardEl = document.getElementById(`card-${id}`);
      if (chapter) chapter.open = true;
      if (cardEl) cardEl.open = true;
      (cardEl || chapter)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  });

  const openAndScroll = (id) => window.setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    if ('open' in el) el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);

  // ── Init ─────────────────────────────────────────────────────
  const init = () => {
    fillCounts();
    renderChapters();
    renderCases();
    renderQa();
    renderChecks();
    renderTerms();
    document.querySelectorAll('.mcp-source-dialog-head #mcpSourceDialogId').forEach((node) => { node.textContent = '参考資料'; });
const openHashTarget = () => {
      const hash = decodeURIComponent(location.hash.replace('#', ''));
      if (!hash) return;
      if (hash.startsWith('case-')) {
        const id = hash.slice(5);
        if (!DATA.cases.some((item) => item.id === id)) return;
        activateTab('cases', false);
        caseSearch.value = id;
        caseCategory.value = 'all';
        caseVisible = 18;
        renderCases();
        openAndScroll(hash);
        return;
      }
      if (hash.startsWith('qa-')) {
        const id = hash.slice(3);
        if (!DATA.qa.some((item) => item.id === id)) return;
        activateTab('qa', false);
        qaSearch.value = id;
        qaCategory.value = 'all';
        qaVisible = DATA.qa.length;
        renderQa();
        openAndScroll(hash);
        return;
      }
      if (hash.startsWith('term-')) {
        const id = hash.slice(5);
        if (!DATA.terms.some((item) => item.id === id)) return;
        activateTab('terms', false);
        termSearch.value = id;
        renderTerms();
        openAndScroll(hash);
        return;
      }
      if (hash.startsWith('check-')) {
        const id = hash.slice(6);
        if (!DATA.checklist.some((item) => item.id === id)) return;
        activateTab('check', false);
        checkFilter = 'all';
        checkSearch.value = id;
        checkSection.value = 'all';
        renderChecks();
        openAndScroll(hash);
        return;
      }
      if (hash.startsWith('card-')) {
        const id = hash.slice(5);
        const card = cardMap.get(id);
        if (!card) return;
        activateTab('learn', false);
        chapterSelect.value = card.chapterId;
        learnSearch.value = id;
        renderChapters();
        openAndScroll(hash);
      }
    };
    openHashTarget();
    window.addEventListener('hashchange', openHashTarget);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
