/* 機械コンテナ梱包 — Q&A中心の簡潔な画面 */
(() => {
  'use strict';

  const data = window.MCP_PACKING_DATA;
  if (!data) return;

  const searchInput = document.getElementById('packingSearch');
  const clearButton = document.getElementById('packingSearchClear');
  const categoryList = document.getElementById('packingCategories');
  const questionList = document.getElementById('packingQuestions');
  const resultText = document.getElementById('packingResultText');
  const noResults = document.getElementById('packingNoResults');
  const topicList = document.getElementById('packingTopics');
  let selectedCategory = 'すべて';

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const normalize = (value = '') => String(value)
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(/[\s　、。・！？!?（）()「」『』【】/／\-ー]+/g, '');

  const renderCategories = () => {
    const categories = ['すべて', ...data.categories];
    categoryList.innerHTML = categories.map((category) => {
      const active = category === selectedCategory;
      return `<button class="mcp-category${active ? ' is-active' : ''}" type="button" data-category="${escapeHtml(category)}" aria-pressed="${active}">${escapeHtml(category)}</button>`;
    }).join('');
  };

  const renderQuestions = () => {
    const query = normalize(searchInput.value);
    const questions = data.qa.filter((item) => {
      const categoryMatch = selectedCategory === 'すべて' || item.category === selectedCategory;
      const textMatch = !query || normalize(`${item.question} ${item.answer} ${item.category}`).includes(query);
      return categoryMatch && textMatch;
    });

    questionList.innerHTML = questions.map((item, index) => (
      `<details class="mcp-question"${query && index === 0 ? ' open' : ''}>
        <summary>
          <span class="mcp-question-category">${escapeHtml(item.category)}</span>
          <span class="mcp-question-title">${escapeHtml(item.question)}</span>
          <span class="mcp-question-mark" aria-hidden="true"></span>
        </summary>
        <div class="mcp-answer"><p>${escapeHtml(item.answer)}</p></div>
      </details>`
    )).join('');

    noResults.hidden = questions.length > 0;
    resultText.textContent = query || selectedCategory !== 'すべて'
      ? `${questions.length}件見つかりました`
      : 'よくある質問を選んでください';
    clearButton.hidden = !searchInput.value;
  };

  const renderTopics = () => {
    topicList.innerHTML = data.topics.map((topic) => (
      `<article class="mcp-topic">
        <h3>${escapeHtml(topic.title)}</h3>
        <p>${escapeHtml(topic.summary)}</p>
        <ul>${topic.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>
      </article>`
    )).join('');
  };

  categoryList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    selectedCategory = button.dataset.category;
    renderCategories();
    renderQuestions();
  });

  searchInput.addEventListener('input', renderQuestions);
  searchInput.addEventListener('search', renderQuestions);
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    renderQuestions();
  });

  renderCategories();
  renderQuestions();
  renderTopics();
})();
