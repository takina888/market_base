(() => {
  const back = document.getElementById('backButton');
  const refresh = document.getElementById('refreshButton');
  back?.addEventListener('click', () => {
    const fallback = document.body.dataset.marketBaseHome || '../index.html?view=learn';
    if (document.referrer && history.length > 1) history.back(); else location.href = fallback;
  });
  refresh?.addEventListener('click', () => location.reload());
  document.querySelectorAll('[data-page-action="top"]').forEach((button) => {
    button.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
  });
})();
