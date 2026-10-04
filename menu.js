(() => {
  const $ = (q) => document.querySelector(q);
  const panel = $('#panel'), list = $('#levels'), box = $('#dataBox'), status = $('#status');

  // Hold-to-open keeps little fingers out of the progress screen.
  const btn = $('#grownBtn'); let timer = null;
  const start = (e) => { e.preventDefault(); btn.classList.add('holding'); timer = setTimeout(open, 1500); };
  const stop = () => { btn.classList.remove('holding'); clearTimeout(timer); };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') open(); });

  function open() { stop(); status.textContent = ''; box.value = ''; draw(); panel.hidden = false; }
  $('#closePanel').addEventListener('click', () => { panel.hidden = true; });

  function draw() {
    const rows = MG.summary();
    const current = rows.find((r) => !r.mastered);
    list.innerHTML = rows.map((r) => `
      <li class="${current && r.id === current.id ? 'current' : ''}">
        <input type="checkbox" data-id="${r.id}" ${r.mastered ? 'checked' : ''} aria-label="${r.name} done">
        <span class="name">${r.id}. ${r.name}</span>
        <span class="stat">${r.recentTries ? `${r.recentCorrect}/${r.recentTries} recent` : ''}</span>
      </li>`).join('');
  }
  list.addEventListener('change', (e) => {
    const c = e.target.closest('input[data-id]');
    if (c) { MG.setMastered(Number(c.dataset.id), c.checked); draw(); }
  });

  $('#copyBtn').addEventListener('click', async () => {
    const data = MG.exportData();
    box.value = data;
    try { await navigator.clipboard.writeText(data); status.textContent = 'Copied. Paste it into a note to keep it safe.'; }
    catch (e) { box.select(); status.textContent = 'Select the text above and copy it.'; }
  });
  $('#loadBtn').addEventListener('click', () => {
    try { MG.importData(box.value.trim()); draw(); status.textContent = 'Progress restored.'; }
    catch (e) { status.textContent = 'That text isn\u2019t saved progress. Copy it again from the backup.'; }
  });
  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Erase all progress and start from level 1?')) { MG.reset(); draw(); status.textContent = 'Progress erased.'; }
  });
})();
