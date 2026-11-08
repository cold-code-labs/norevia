// Search and filter the hypothesis board without changing its canonical order.
const tools = $('[data-board-tools]');
if (tools) {
  const q = $('[data-board-q]', tools), count = $('[data-board-count]', tools);
  const tiles = $$('[data-text]', $('.board'));
  tools.hidden = false;
  const apply = () => {
    const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0;
    for (const tile of tiles) {
      const ok = words.every((w) => tile.dataset.text.includes(w));
      tile.hidden = !ok;
      if (ok) n++;
    }
    for (const col of $$('.board .col')) {
      const visible = [...col.querySelectorAll('li')].some((li) => !li.hidden);
      col.classList.toggle('col-empty-filter', !visible && words.length > 0);
    }
    count.textContent = words.length ? `${n} of ${tiles.length} hypotheses match` : `${tiles.length} hypotheses`;
    const params = new URLSearchParams(location.search);
    q.value.trim() ? params.set('q', q.value.trim()) : params.delete('q');
    history.replaceState(null, '', location.pathname + (params.toString() ? `?${params}` : '') + location.hash);
  };
  q.addEventListener('input', apply);
  q.value = new URLSearchParams(location.search).get('q') || '';
  apply();
}
