/* Shared skill engine: every game reads and writes the same progress. */
const MG = (() => {
  const KEY = 'mathgames.progress.v1';
  const WINDOW = 20; // look at the last 20 first tries
  const NEED = 18;   // 18 of 20 right (90%) unlocks the next level

  const LEVELS = [
    { id: 1,  name: 'Count to 120' },
    { id: 2,  name: 'Facts within 10' },
    { id: 3,  name: 'Make 10' },
    { id: 4,  name: 'Facts within 20' },
    { id: 5,  name: 'Speed facts' },
    { id: 6,  name: 'Missing numbers' },
    { id: 7,  name: 'Tens and ones' },
    { id: 8,  name: 'Hundreds' },
    { id: 9,  name: 'Skip counting' },
    { id: 10, name: 'Two-digit adding' },
    { id: 11, name: 'Adding with trading' },
    { id: 12, name: 'Word problems' },
    { id: 13, name: 'Money' },
    { id: 14, name: 'Time' },
    { id: 15, name: 'Arrays, odd and even' },
  ];

  const fresh = () => ({ v: 1, levels: {}, created: Date.now() });
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); }
    catch (e) { return fresh(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function lv(s, id) {
    if (!s.levels[id]) s.levels[id] = { recent: [], mastered: false, total: 0, correct: 0 };
    return s.levels[id];
  }
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  function levelName(id) { const l = LEVELS.find((x) => x.id === id); return l ? l.name : ''; }

  /* Record a first try. Returns whether this answer unlocked the level. */
  function record(id, ok) {
    const s = load(); const L = lv(s, id);
    L.recent.push(ok ? 1 : 0);
    if (L.recent.length > WINDOW) L.recent.shift();
    L.total++; if (ok) L.correct++;
    L.last = Date.now();
    let leveled = false;
    if (!L.mastered && L.recent.length >= WINDOW && sum(L.recent) >= NEED) {
      L.mastered = true; L.masteredAt = Date.now(); leveled = true;
    }
    save(s);
    return { leveled };
  }

  /* A game passes the levels it can teach; this picks the first unfinished one,
     with about 1 in 5 problems pulled from finished levels as review. */
  function pick(supported) {
    const s = load();
    const open = supported.filter((id) => !lv(s, id).mastered);
    const done = supported.filter((id) => lv(s, id).mastered);
    const any = (a) => a[Math.floor(Math.random() * a.length)];
    if (!open.length) return { id: any(done), review: true };
    if (done.length && Math.random() < 0.2) return { id: any(done), review: true };
    return { id: open[0], review: false };
  }

  function meter(id) {
    const L = lv(load(), id);
    return { correct: sum(L.recent), tries: L.recent.length, need: NEED, window: WINDOW, mastered: L.mastered };
  }

  function nextOpen(supported) {
    const s = load();
    return supported.find((id) => !lv(s, id).mastered) || null;
  }

  function setMastered(id, on) {
    const s = load(); const L = lv(s, id);
    L.mastered = !!on; if (on) L.masteredAt = Date.now();
    save(s);
  }

  function summary() {
    const s = load();
    return LEVELS.map((l) => {
      const L = lv(s, l.id);
      return { ...l, mastered: L.mastered, recentCorrect: sum(L.recent), recentTries: L.recent.length, total: L.total };
    });
  }

  function exportData() { return JSON.stringify(load()); }
  function importData(text) {
    const d = JSON.parse(text);
    if (!d || typeof d.levels !== 'object') throw new Error('That doesn\u2019t look like saved progress.');
    save(d);
  }
  function reset() { save(fresh()); }

  return { LEVELS, NEED, WINDOW, levelName, record, pick, meter, nextOpen, setMastered, summary, exportData, importData, reset };
})();
