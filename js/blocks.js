/* Block Builder: place value, make 10, and adding with trading, all on one mat. */
(() => {
  // Levels from the shared plan that this game can teach.
  const LEVELS_HERE = [1, 3, 7, 8, 10, 11];
  const CAP = { h: 9, t: 19, o: 19 };
  const KIND_CLASS = { h: 'hun', t: 'ten', o: 'one' };

  const $ = (q) => document.querySelector(q);
  const el = {
    mat: $('#mat'), task: $('#task'), hint: $('#hint'),
    levelName: $('#levelName'), meter: $('#meter'),
    tray: $('#tray'), choices: $('#choices'),
    feedback: $('#feedback'), fbMsg: $('#fbMsg'), fbBtns: $('#fbBtns'),
  };

  let s = { h: 0, t: 0, o: 0, lh: 0, lt: 0, lo: 0 }; // counts + locked (pre-placed) counts
  let p = null;          // current problem
  let popKind = null;    // block kind to animate on next render
  let pendingLevelUp = null;

  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const split = (n) => ({ h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 });
  const value = () => s.h * 100 + s.t * 10 + s.o;
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  function parts(n) {
    const { h, t, o } = split(n);
    return h ? `${plural(h, 'hundred')}, ${plural(t, 'ten')}, and ${plural(o, 'one')}`
             : `${plural(t, 'ten')} and ${plural(o, 'one')}`;
  }

  /* ---------- Problems ---------- */
  function newProblem() {
    const pick = MG.pick(LEVELS_HERE);
    const L = pick.id;
    p = { level: L, review: pick.review, recorded: false, misses: 0, revealed: false, solved: false };

    const build = (n) => Object.assign(p, {
      mode: 'build', target: n, preset: { h: 0, t: 0, o: 0 }, text: String(n),
      say: `Build ${n}.`, hint: 'Tap the blocks to add them.',
    });
    const read = (n) => Object.assign(p, {
      mode: 'read', target: n, preset: split(n), text: 'How many?', hint: '',
      say: n >= 100 ? 'How many? Count the hundreds, then the tens, then the ones.'
                    : 'How many? Count the tens, then the ones.',
    });
    const add = (a, b) => Object.assign(p, {
      mode: 'add', a, b, target: a + b, preset: split(a), text: `${a} + ${b}`,
      say: `${a} is on the mat. Add ${b}.` + (b >= 10 ? ` That's ${parts(b)}.` : ''),
      hint: b >= 10 ? `Add ${parts(b)}.` : `Add ${plural(b, 'one')}.`,
    });

    switch (L) {
      case 1: read(rnd(5, 49)); break;
      case 3: {
        const n = rnd(1, 9);
        Object.assign(p, {
          mode: 'make10', target: 10, preset: { h: 0, t: 0, o: n }, text: `${n} + ? = 10`,
          say: `There are ${n}. Add cubes to make 10.`, hint: 'Fill both rows to make 10.',
        });
        break;
      }
      case 7: { const n = rnd(11, 99); Math.random() < 0.35 ? read(n) : build(n); break; }
      case 8: { const n = rnd(100, 999); Math.random() < 0.3 ? read(n) : build(n); break; }
      case 10: { // no trading
        const t1 = rnd(1, 7), o1 = rnd(0, 8), t2 = rnd(0, 8 - t1), o2 = rnd(t2 ? 0 : 1, 9 - o1);
        add(t1 * 10 + o1, t2 * 10 + o2); break;
      }
      case 11: { // ones add up past 10, so he has to trade
        const o1 = rnd(2, 9), o2 = rnd(10 - o1, 9), t1 = rnd(1, 7), t2 = rnd(0, 8 - t1);
        add(t1 * 10 + o1, t2 * 10 + o2); break;
      }
    }

    s = { ...p.preset, lh: p.preset.h, lt: p.preset.t, lo: p.preset.o };
    if (p.mode === 'read') buildChoices();
    render();
    showControls();
    Common.say(p.say);
  }

  /* ---------- Drawing ---------- */
  function renderMeter() {
    const m = MG.meter(p.level);
    const on = m.mastered ? m.need : Math.min(m.correct, m.need);
    el.meter.innerHTML = Array.from({ length: m.need }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('');
    el.meter.setAttribute('aria-label', `${on} of ${m.need} toward the next level`);
    el.levelName.textContent = (p.review ? 'Review: ' : '') + MG.levelName(p.level);
  }

  function render() {
    const showH = p.level === 8;
    el.task.textContent = p.text;
    el.hint.textContent = p.hint;
    renderMeter();

    for (const k of ['h', 't', 'o']) {
      const col = el.mat.querySelector(`.col[data-kind="${k}"]`);
      col.hidden = k === 'h' && !showH;
      const n = s[k], locked = s['l' + k];
      let html = '';
      for (let i = 0; i < n; i++) {
        const cls = ['blk', KIND_CLASS[k]];
        if (i < locked) cls.push('locked');
        if (popKind === k && i === n - 1) cls.push('pop');
        html += `<span class="${cls.join(' ')}"></span>`;
      }
      col.querySelector('.col-body').innerHTML = html;

      const count = col.querySelector('.col-count');
      const hideCount = p.mode === 'read' && !p.revealed;
      count.textContent = hideCount ? '' : String(n);
      count.classList.toggle('over', n >= 10);

      const bundle = col.querySelector('.bundle');
      if (bundle) {
        const can = (k === 'o' && s.o >= 10) || (k === 't' && showH && s.t >= 10);
        bundle.hidden = !can || p.mode === 'read' || p.mode === 'make10' || p.solved;
      }
    }
    popKind = null;
    el.tray.querySelector('[data-add="h"]').hidden = !showH;
    el.tray.style.setProperty('--bins', showH ? 3 : 2);
  }

  function showControls() {
    el.feedback.hidden = true;
    el.tray.hidden = p.mode === 'read';
    el.choices.hidden = p.mode !== 'read';
  }

  function showFeedback(kind, msg, buttons) {
    el.tray.hidden = true; el.choices.hidden = true;
    el.feedback.hidden = false;
    el.feedback.className = 'feedback ' + kind;
    el.fbMsg.textContent = msg;
    el.fbBtns.innerHTML = '';
    buttons.forEach(([label, fn, primary]) => {
      const b = document.createElement('button');
      b.className = 'press' + (primary ? ' primary' : '');
      b.textContent = label;
      b.addEventListener('click', fn);
      el.fbBtns.appendChild(b);
    });
  }

  /* ---------- Read mode choices ---------- */
  function buildChoices() {
    const n = p.target, { h, t, o } = split(n);
    const out = new Set([n]);
    const ok = (v) => v > 0 && v <= 999 && v !== n;
    const swap = n >= 100 ? h * 100 + o * 10 + t : o * 10 + t;
    if (ok(swap)) out.add(swap); // the classic mix-up: tens and ones flipped
    const near = shuffle(n >= 100 ? [n + 100, n - 100, n + 10, n - 10, n + 1, n - 1] : [n + 10, n - 10, n + 1, n - 1]);
    for (const v of near) { if (out.size >= 3) break; if (ok(v)) out.add(v); }
    el.choices.innerHTML = shuffle([...out]).map((v) => `<button class="choice press" data-v="${v}">${v}</button>`).join('');
  }

  el.choices.addEventListener('click', (e) => {
    const b = e.target.closest('.choice');
    if (!b || p.solved) return;
    const v = Number(b.dataset.v);
    el.choices.querySelectorAll('.choice').forEach((c) => {
      if (Number(c.dataset.v) === p.target) c.classList.add('right');
      else if (c === b) c.classList.add('wrong');
    });
    p.revealed = true; p.solved = true;
    render();
    if (v === p.target) {
      win(`Yes! ${parts(p.target)} is ${p.target}.`, true);
    } else {
      recordOnce(false);
      Common.sfx.soft();
      const msg = `That's ${parts(p.target)}. That makes ${p.target}.`;
      Common.say(msg);
      setTimeout(() => showFeedback('', msg, [['Next', next, true]]), 900);
    }
  });

  /* ---------- Building ---------- */
  el.tray.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const k = b.dataset.add;
    if (s[k] >= CAP[k]) { Common.sfx.soft(); return; }
    s[k]++; popKind = k;
    Common.sfx.pop();
    el.hint.textContent = p.hint;
    render();
  });

  el.mat.addEventListener('click', (e) => {
    const bundle = e.target.closest('[data-bundle]');
    if (bundle) return doBundle(bundle.dataset.bundle);
    const blk = e.target.closest('.blk');
    if (!blk || blk.classList.contains('locked') || p.mode === 'read' || p.solved) return;
    const k = blk.closest('.col').dataset.kind;
    if (s[k] > s['l' + k]) { s[k]--; Common.sfx.unpop(); render(); }
  });

  function doBundle(k) {
    if (k === 'o' && s.o >= 10) {
      s.o -= 10; s.lo = Math.min(s.lo, s.o); s.t++; popKind = 't';
      Common.say('10 ones make 1 ten!');
    } else if (k === 't' && s.t >= 10) {
      s.t -= 10; s.lt = Math.min(s.lt, s.t); s.h++; popKind = 'h';
      Common.say('10 tens make 1 hundred!');
    } else return;
    Common.sfx.bundle();
    render();
  }

  $('#checkBtn').addEventListener('click', check);

  function check() {
    const v = value();
    if (p.mode === 'make10') {
      const n = p.preset.o;
      if (v === 10) return win(`${n} and ${10 - n} make 10!`);
      if (v < 10) return miss(`That's ${v}. Keep adding until you have 10.`);
      return miss(`That's ${v}. Too many! Tap a cube to take it away.`);
    }
    if (v === p.target) {
      // Right amount but not written the way numbers work: teach the trade, no penalty.
      if (s.o >= 10) return nudge('Right amount! Now trade 10 ones for a ten.');
      if (s.t >= 10) return nudge('Right amount! Now trade 10 tens for a hundred.');
      return win(p.mode === 'add' ? `${p.a} plus ${p.b} is ${p.target}!` : `Yes! ${p.target} is ${parts(p.target)}.`);
    }
    if (p.mode === 'add') {
      const added = v - p.a;
      return miss(added < p.b
        ? `You added ${added}. We need to add ${p.b}. Add some more.`
        : `You added ${added}. That's more than ${p.b}. Tap a block to take it away.`);
    }
    return miss(`You built ${v}. ${p.target} is ${parts(p.target)}.`);
  }

  /* ---------- Results ---------- */
  function recordOnce(ok) {
    if (p.recorded) return;
    p.recorded = true;
    const res = MG.record(p.level, ok);
    if (res.leveled) pendingLevelUp = p.level;
    renderMeter();
  }

  function win(msg, fromChoice) {
    recordOnce(true);
    p.solved = true;
    Common.sfx.good();
    Common.say(msg);
    if (p.mode === 'make10') el.task.textContent = `${p.preset.o} + ${10 - p.preset.o} = 10`;
    if (p.mode === 'add') el.task.textContent = `${p.a} + ${p.b} = ${p.target}`;
    el.hint.textContent = '';
    render();
    const show = () => showFeedback('good', msg, [['Next', next, true]]);
    fromChoice ? setTimeout(show, 700) : show();
  }

  function miss(msg) {
    recordOnce(false);
    p.misses++;
    Common.sfx.soft();
    Common.say(msg);
    const btns = [['Try again', showControls, true]];
    if (p.misses >= 2) btns.push(['Show me', showMe]);
    showFeedback('', msg, btns);
  }

  function nudge(msg) {
    Common.sfx.soft();
    Common.say(msg);
    el.hint.textContent = msg;
  }

  function showMe() {
    const t = split(p.target);
    s = { ...t, lh: t.h, lt: t.t, lo: t.o };
    p.solved = true;
    const msg = p.mode === 'make10'
      ? `${p.preset.o} and ${10 - p.preset.o} make 10.`
      : p.mode === 'add' ? `${p.a} plus ${p.b} is ${p.target}. That's ${parts(p.target)}.`
      : `Here's ${p.target}. ${parts(p.target)}.`;
    render();
    Common.say(msg);
    showFeedback('', msg, [['Next', next, true]]);
  }

  function next() {
    if (pendingLevelUp) {
      const done = pendingLevelUp; pendingLevelUp = null;
      const up = MG.nextOpen(LEVELS_HERE);
      $('#luTitle').textContent = `${MG.levelName(done)}: done!`;
      $('#luText').textContent = up ? `Next up: ${MG.levelName(up)}` : 'You finished every Block Builder level!';
      $('#levelUp').hidden = false;
      Common.sfx.level();
      Common.say(`You did it! ${MG.levelName(done)} is done!`);
      return;
    }
    newProblem();
  }

  $('#luBtn').addEventListener('click', () => { $('#levelUp').hidden = true; newProblem(); });
  $('#sayBtn').addEventListener('click', () => { if (p) Common.say(p.say); });
  $('#startBtn').addEventListener('click', () => {
    Common.unlock();
    $('#startScreen').hidden = true;
    newProblem();
  });
})();
