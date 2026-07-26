(() => {
  'use strict';
  const DATA = window.HACCP_QUIZ_DATA;
  if (!DATA || !Array.isArray(DATA.questions)) {
    document.getElementById('app').innerHTML = '<div class="hq-empty">教材データを読み込めませんでした。</div>';
    return;
  }
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const storageKey = 'market_base_haccp_quiz_v014_progress';
  const questions = DATA.questions;
  const byId = new Map(questions.map(q => [q.id, q]));
  let session = null;
  let toastTimer = null;


  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const norm = (value) => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  const splitTerms = (value) => String(value || '').split(/[、,／/]/).map(v => v.trim()).filter(Boolean);
  const showToast = (message) => {
    toast.textContent = message; toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 2300);
  };
  const readProgress = () => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {items:{}}; }
    catch (_) { return {items:{}}; }
  };
  const writeProgress = progress => {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); }
    catch (_) { showToast('端末へ学習履歴を保存できませんでした。'); }
  };
  const getStats = () => {
    const p = readProgress();
    const entries = Object.entries(p.items || {}).filter(([id]) => byId.has(id));
    const answered = entries.length;
    const lastCorrect = entries.filter(([,x]) => x.lastCorrect).length;
    const weakIds = entries.filter(([,x]) => !x.lastCorrect || (x.wrongCount || 0) > (x.correctCount || 0)).map(([id]) => id);
    return {progress:p, answered, lastCorrect, weakIds};
  };
  const rotate = (list, count) => {
    if (!list.length) return [];
    const day = Math.floor(Date.now() / 86400000);
    const start = day % list.length;
    const out = [];
    for (let i=0; i<Math.min(count,list.length); i++) out.push(list[(start+i)%list.length]);
    return out;
  };
  const publicCategoryNames = Object.freeze({
    A:'HACCPの基本', B:'工場の衛生管理', C:'危害を見つけて評価する', D:'重要な管理と異常時対応',
    E:'工程ごとの実務', F:'食品機械・設備', G:'海外対応・監査', H:'食品別の危害',
    I:'工程トラブルの判断', J:'洗浄・衛生設計', K:'微生物・アレルゲン・異物',
    L:'管理方法と記録の確認', M:'追跡・回収・仕入先・物流', N:'海外対応の総合問題'
  });
  const categoryLabel = code => publicCategoryNames[code] || DATA.categories.find(c => c.code === code)?.name || 'HACCP実務';
  const correctText = q => q.correct.map(k => `${k}. ${q.options.find(o=>o.key===k)?.text || ''}`).join(' / ');
  const sourceLink = q => {
    const urls = String(q.sourceUrl || '').split(/\s+/).map(v => v.trim()).filter(v => /^https?:\/\//i.test(v));
    const links = urls.map((url, index) => `<a class="hq-source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">根拠資料${urls.length > 1 ? ` ${index + 1}` : ''}を開く</a>`).join('');
    return `<div class="hq-source-meta"><span>確認日：${esc(q.checkedDate || '確認できず')}</span></div><div class="hq-source-links">${links || '<span>確認できず</span>'}</div>`;
  };
  const detailHtml = q => `<details class="hq-details">
      <summary>詳しい解説・現場例・根拠を確認</summary>
      <div class="hq-details-body">
        <div class="hq-answer-line">正解：${esc(correctText(q))}</div>
        <section class="hq-detail-block"><h3>なぜそう判断するか</h3><p>${esc(q.explanation || '確認できず')}</p></section>
        <section class="hq-detail-block"><h3>ほかの選択肢が違う理由</h3><p>${esc(q.wrongReason || '確認できず')}</p></section>
        <section class="hq-detail-block"><h3>現場での具体例</h3><p>${esc(q.example || '確認できず')}</p></section>
        <div class="hq-facts">
          <div class="hq-fact"><span>対象工程</span><strong>${esc(q.process || '確認できず')}</strong></div>
          <div class="hq-fact"><span>危害分類</span><strong>${esc(q.hazard || '確認できず')}</strong></div>
          <div class="hq-fact"><span>適用範囲</span><strong>${esc(q.scope || '確認できず')}</strong></div>
          <div class="hq-fact"><span>関連用語</span><strong>${esc(q.terms || '確認できず')}</strong></div>
        </div>
        <section class="hq-detail-block"><h3>根拠資料</h3><p>${sourceLink(q)}</p></section>
      </div>
    </details>`;

  const replaceUrl = (value) => { try { history.replaceState(null, '', value); } catch (_) {} };

  function renderHome() {
    session = null;
    const stats = getStats();
    const pct = stats.answered ? Math.round(stats.lastCorrect / stats.answered * 100) : 0;
    const actions = [
      ['today','今','今日の1問','毎日1問だけ確認します。'],
      ['basic','基','基本から始める','基本問題20問。'],
      ['field','現','現場判断に挑戦','実務問題20問。'],
      ['machine','機','食品機械編','設備・洗浄・センサーの問題。'],
      ['weak','復','苦手問題',stats.weakIds.length ? `${stats.weakIds.length}問を復習できます。` : '間違えた問題を表示します。'],
      ['list','覧','全問題一覧','200問から検索できます。']
    ];
    app.innerHTML = `<section class="hq-card hq-hero hq-hero-compact">
      <div class="hq-stat-grid">
        <div class="hq-stat"><strong>${DATA.meta.questionCount}</strong><span>問題</span></div>
        <div class="hq-stat"><strong>${DATA.meta.categoryCount}</strong><span>カテゴリー</span></div>
        <div class="hq-stat"><strong>${stats.answered}</strong><span>回答済み</span></div>
        <div class="hq-stat"><strong>${pct}%</strong><span>直近正解率</span></div>
      </div>
    </section>
    <section class="hq-section"><div class="hq-section-head"><h2>始める</h2></div>
      <div class="hq-action-grid">${actions.map(a => `<button class="hq-action-card" type="button" data-home-action="${a[0]}" ${a[0]==='weak'&&!stats.weakIds.length?'disabled':''}><span class="hq-action-icon">${a[1]}</span><span><strong>${a[2]}</strong><small>${a[3]}</small></span><span class="hq-arrow" aria-hidden="true">›</span></button>`).join('')}</div>
    </section>
    <section class="hq-section"><div class="hq-section-head"><h2>カテゴリー</h2></div>
      <div class="hq-category-grid">${DATA.categories.map(c => `<button class="hq-category-card" type="button" data-start-category="${esc(c.code)}"><span><strong>${esc(categoryLabel(c.code))}</strong></span><span class="hq-count">${c.count}問</span></button>`).join('')}</div>
    </section>`;
    replaceUrl(location.pathname);
    scrollTop();
  }

  function homeAction(action) {
    const stats = getStats();
    if (action === 'today') {
      const day = Math.floor(Date.now()/86400000); startQuiz([questions[day % questions.length].id], '今日の1問');
    } else if (action === 'basic') {
      startQuiz(questions.filter(q => ['A','B','C','D'].includes(q.categoryCode) && ['レベル1','レベル2'].includes(q.difficulty)).slice(0,20).map(q=>q.id), '基本から始める');
    } else if (action === 'field') {
      startQuiz(rotate(questions.filter(q => q.format === '現場判断' || ['レベル3','レベル4'].includes(q.difficulty)).map(q=>q.id),20), '現場判断に挑戦');
    } else if (action === 'machine') {
      startQuiz(questions.filter(q => ['F','J'].includes(q.categoryCode)).map(q=>q.id), '食品機械編');
    } else if (action === 'weak') {
      if (stats.weakIds.length) startQuiz(stats.weakIds, '苦手問題'); else showToast('苦手問題はまだありません。');
    } else if (action === 'list') renderList();
  }

  function startQuiz(ids, title) {
    const valid = ids.filter(id => byId.has(id));
    if (!valid.length) { showToast('対象の問題がありません。'); return; }
    session = {ids:valid, index:0, correct:0, answered:false, title};
    renderQuestion();
  }

  function renderQuestion() {
    const q = byId.get(session.ids[session.index]);
    const multiple = q.correct.length > 1;
    const progress = Math.round((session.index / session.ids.length) * 100);
    app.innerHTML = `<section class="hq-quiz-shell">
      <div class="hq-card hq-quiz-status"><div class="hq-status-copy"><strong>${esc(session.title)}</strong><span>${session.index+1} / ${session.ids.length}問</span></div><div class="hq-score">正解 ${session.correct}</div><div class="hq-progress-track" aria-label="進捗"><span style="width:${progress}%"></span></div></div>
      <article class="hq-card hq-question-card" data-question-id="${esc(q.id)}">
        <div class="hq-question-meta"><span class="hq-chip">${esc(categoryLabel(q.categoryCode))}</span><span class="hq-chip">${esc(q.difficulty)}</span><span class="hq-chip is-format">${esc(q.format)}</span></div>
        <h2 class="hq-question-title">${esc(q.question)}</h2>${multiple?'<p class="hq-multiple-note">当てはまるものをすべて選んでください。</p>':''}
        <form id="answerForm"><div class="hq-options">${q.options.map(o => `<label class="hq-option" data-option="${o.key}"><input type="${multiple?'checkbox':'radio'}" name="answer" value="${o.key}"><span class="hq-option-key">${o.key}</span><span class="hq-option-text">${esc(o.text)}</span></label>`).join('')}</div>
          <div class="hq-actions"><button class="hq-button hq-button-primary" type="submit">回答する</button><button class="hq-button" type="button" data-quiz-action="quit">トップへ戻る</button></div>
        </form><div id="feedback"></div>
      </article>
    </section>`;
    replaceUrl(`${location.pathname}?id=${encodeURIComponent(q.id)}`);
    scrollTop();
  }

  function submitAnswer(form) {
    if (!session || session.answered) return;
    const q = byId.get(session.ids[session.index]);
    const selected = [...form.querySelectorAll('input[name="answer"]:checked')].map(el=>el.value).sort();
    if (!selected.length) { showToast('選択肢を選んでください。'); return; }
    const correct = [...q.correct].sort();
    const ok = selected.length === correct.length && selected.every((v,i)=>v===correct[i]);
    session.answered = true; if (ok) session.correct += 1;
    const p = readProgress(); const old = p.items[q.id] || {};
    p.items[q.id] = {attempts:(old.attempts||0)+1,correctCount:(old.correctCount||0)+(ok?1:0),wrongCount:(old.wrongCount||0)+(ok?0:1),lastCorrect:ok,lastAnswer:selected,updated:new Date().toISOString()};
    writeProgress(p);
    form.querySelectorAll('input').forEach(i=>i.disabled=true);
    form.querySelectorAll('.hq-option').forEach(label=>{ const key=label.dataset.option; label.classList.add('is-disabled'); if(q.correct.includes(key)) label.classList.add('is-correct'); else if(selected.includes(key)) label.classList.add('is-wrong'); });
    form.querySelector('button[type="submit"]').disabled=true;
    document.getElementById('feedback').innerHTML = `<div class="hq-feedback ${ok?'is-correct':'is-wrong'}"><strong>${ok?'正解です':'今回は不正解です'}</strong><p>${esc(q.conclusion)}</p></div>${detailHtml(q)}<div class="hq-actions"><button class="hq-button hq-button-primary" type="button" data-quiz-action="next">${session.index+1<session.ids.length?'次の問題':'結果を見る'}</button><button class="hq-button" type="button" data-quiz-action="list">全問題一覧</button></div>`;
  }

  function nextQuestion() {
    if (!session?.answered) return;
    if (session.index + 1 < session.ids.length) { session.index++; session.answered=false; renderQuestion(); }
    else renderSessionResult();
  }
  function renderSessionResult() {
    const pct = Math.round(session.correct/session.ids.length*100);
    const band = scoreBand(pct);
    app.innerHTML = `<section class="hq-card hq-result-hero"><div class="hq-result-score"><strong>${pct}%</strong><span>${session.correct}/${session.ids.length}問</span></div><div><h2>${esc(band.label)}</h2><p>${esc(band.meaning)} ${esc(band.note)}</p><div class="hq-actions"><button class="hq-button hq-button-primary" type="button" data-result-action="retry">同じ問題をもう一度</button><button class="hq-button" type="button" data-result-action="home">トップへ</button><button class="hq-button" type="button" data-result-action="all">全体結果</button></div></div></section>`;
    replaceUrl(`${location.pathname}?view=session-result`); scrollTop();
  }
  function scoreBand(pct) {
    const sentence = value => /[。.!！?？]$/.test(String(value || '')) ? String(value || '') : `${String(value || '')}。`;
    const bands = (DATA.scoreBands || []).map(band => ({...band, min:Number(String(band.range || '').match(/^\d+/)?.[0] || 0)})).sort((a,b)=>b.min-a.min);
    const selected = bands.find(band => pct >= band.min) || {label:'基礎から確認',meaning:'HACCPの基本から確認する',note:'段階的に進める'};
    return {label:selected.label, meaning:sentence(selected.meaning), note:sentence(selected.note)};
  }

  function renderList() {
    session = null;
    const cats = DATA.categories.map(c=>`<option value="${esc(c.code)}">${esc(categoryLabel(c.code))}</option>`).join('');
    const difficulties = [...new Set(questions.map(q=>q.difficulty))].map(x=>`<option>${esc(x)}</option>`).join('');
    const formats = [...new Set(questions.map(q=>q.format))].map(x=>`<option>${esc(x)}</option>`).join('');
    app.innerHTML = `<section class="hq-card hq-filter-card"><div class="hq-filter-grid">
      <label class="hq-field"><span>問題・用語・工程を検索</span><input id="listSearch" type="search" placeholder="例：冷却、アレルゲン、校正" autocomplete="off"></label>
      <label class="hq-field"><span>カテゴリー</span><select id="listCategory"><option value="">すべて</option>${cats}</select></label>
      <label class="hq-field"><span>難易度</span><select id="listDifficulty"><option value="">すべて</option>${difficulties}</select></label>
      <label class="hq-field"><span>出題形式</span><select id="listFormat"><option value="">すべて</option>${formats}</select></label>
    </div></section>
    <div class="hq-list-summary"><strong><span id="visibleCount">${questions.length}</span>問</strong></div>
    <section class="hq-question-list" id="questionList">${questions.map(q=>listCard(q)).join('')}</section><div class="hq-empty" id="listEmpty" hidden>条件に一致する問題がありません。</div>`;
    replaceUrl(`${location.pathname}?view=list`); scrollTop();
  }
  function listCard(q) {
    const search = norm([q.id,q.category,q.subtheme,q.question,q.conclusion,q.explanation,q.terms,q.process,q.hazard].join(' '));
    return `<article class="hq-card hq-list-card" data-search="${esc(search)}" data-category="${esc(q.categoryCode)}" data-difficulty="${esc(q.difficulty)}" data-format="${esc(q.format)}">
      <div class="hq-chip-row"><span class="hq-chip">${esc(categoryLabel(q.categoryCode))}</span><span class="hq-chip">${esc(q.subtheme)}</span><span class="hq-chip">${esc(q.difficulty)}</span><span class="hq-chip is-format">${esc(q.format)}</span></div>
      <h2>${esc(q.question)}</h2><div class="hq-list-actions"><button class="hq-button hq-button-primary" type="button" data-solve-id="${esc(q.id)}">この問題を解く</button></div>
      <div class="hq-list-details">${detailHtml(q)}</div></article>`;
  }
  function applyListFilter() {
    const q = norm(document.getElementById('listSearch')?.value || '');
    const c = document.getElementById('listCategory')?.value || '';
    const d = document.getElementById('listDifficulty')?.value || '';
    const f = document.getElementById('listFormat')?.value || '';
    let n=0;
    document.querySelectorAll('.hq-list-card').forEach(card=>{ const show=(!q||card.dataset.search.includes(q))&&(!c||card.dataset.category===c)&&(!d||card.dataset.difficulty===d)&&(!f||card.dataset.format===f); card.hidden=!show; if(show)n++; });
    document.getElementById('visibleCount').textContent=n; document.getElementById('listEmpty').hidden=!!n;
  }

  function renderResults() {
    session = null;
    const {progress, answered, lastCorrect, weakIds} = getStats();
    const pct = answered ? Math.round(lastCorrect/answered*100) : 0; const band=scoreBand(pct);
    const rows = DATA.categories.map(c=>{
      const ids=questions.filter(q=>q.categoryCode===c.code).map(q=>q.id); const done=ids.filter(id=>progress.items[id]).length; const ok=ids.filter(id=>progress.items[id]?.lastCorrect).length; const rate=done?Math.round(ok/done*100):0;
      return `<article class="hq-card hq-result-row"><div class="hq-result-row-head"><strong>${esc(categoryLabel(c.code))}</strong><span>${done}/${ids.length}問・正解率 ${rate}%</span></div><div class="hq-result-bar"><i style="width:${rate}%"></i></div></article>`;
    }).join('');
    app.innerHTML = `<section class="hq-card hq-result-hero"><div class="hq-result-score"><strong>${pct}%</strong><span>直近正解率</span></div><div><h2>${answered?esc(band.label):'まだ回答履歴がありません'}</h2><p>${answered?`${esc(band.meaning)} 回答済み ${answered}問、苦手 ${weakIds.length}問です。`:'「今日の1問」または「基本から始める」から回答すると、分野別結果が表示されます。'}</p><div class="hq-actions"><button class="hq-button hq-button-primary" type="button" data-result-action="weak" ${weakIds.length?'':'disabled'}>苦手問題を復習</button><button class="hq-button" type="button" data-result-action="home">トップへ</button><button class="hq-button" type="button" data-result-action="reset" ${answered?'':'disabled'}>履歴を消去</button></div></div></section><section class="hq-result-grid">${rows}</section>`;
    replaceUrl(`${location.pathname}?view=results`); scrollTop();
  }

  function scrollTop(){ window.scrollTo({top:0,behavior:'auto'}); }

  document.addEventListener('click', event => {
    const home = event.target.closest('[data-home-action]'); if(home){homeAction(home.dataset.homeAction);return;}
    const cat = event.target.closest('[data-start-category]'); if(cat){const code=cat.dataset.startCategory;startQuiz(questions.filter(q=>q.categoryCode===code).map(q=>q.id),categoryLabel(code));return;}
    const solve = event.target.closest('[data-solve-id]'); if(solve){startQuiz([solve.dataset.solveId],solve.dataset.solveId);return;}
    const qa = event.target.closest('[data-quiz-action]'); if(qa){ if(qa.dataset.quizAction==='next')nextQuestion(); else if(qa.dataset.quizAction==='quit')renderHome(); else if(qa.dataset.quizAction==='list')renderList(); return; }
    const ra = event.target.closest('[data-result-action]'); if(ra){ const a=ra.dataset.resultAction; if(a==='home')renderHome(); else if(a==='all')renderResults(); else if(a==='retry'&&session)startQuiz(session.ids,session.title); else if(a==='weak'){const s=getStats();if(s.weakIds.length)startQuiz(s.weakIds,'苦手問題');} else if(a==='reset'){ if(confirm('この端末に保存したHACCPクイズの回答履歴を消去しますか？')){localStorage.removeItem(storageKey);renderResults();showToast('回答履歴を消去しました。');}} return; }
    const page = event.target.closest('[data-page-action]'); if(page){ const a=page.dataset.pageAction; if(a==='home')renderHome(); else if(a==='list')renderList(); else if(a==='weak'){const s=getStats();s.weakIds.length?startQuiz(s.weakIds,'苦手問題'):showToast('苦手問題はまだありません。');} else if(a==='results')renderResults(); return; }
  });
  document.addEventListener('submit', event => { if(event.target.id==='answerForm'){event.preventDefault();submitAnswer(event.target);} });
  document.addEventListener('input', event => { if(['listSearch','listCategory','listDifficulty','listFormat'].includes(event.target.id)) applyListFilter(); });
  document.addEventListener('change', event => { if(['listCategory','listDifficulty','listFormat'].includes(event.target.id)) applyListFilter(); });

  const params = new URLSearchParams(location.search);
  const directId = params.get('id');
  const view = params.get('view');
  if (directId && byId.has(directId)) startQuiz([directId], directId);
  else if (view === 'list') renderList();
  else if (view === 'results') renderResults();
  else renderHome();
})();
