/* Shared sound, speech, and offline setup. */
const Common = (() => {
  let ctx = null;

  /* iPhone only allows sound and speech after a tap, so call this from a tap. */
  function unlock() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
    try { speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch (e) {}
  }

  function tone(freq, dur, when = 0, type = 'triangle', vol = 0.15) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const sfx = {
    pop()    { tone(700, 0.07); },
    unpop()  { tone(420, 0.07); },
    soft()   { tone(240, 0.18, 0, 'sine', 0.12); },
    bundle() { tone(440, 0.06); tone(880, 0.14, 0.07); },
    good()   { [523, 659, 784].forEach((f, i) => tone(f, 0.2, i * 0.09)); },
    level()  { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, i * 0.12)); },
  };

  let voice = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /Samantha/.test(v.name)) || vs.find((v) => v.lang === 'en-US') || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  function say(text) {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.9; u.pitch = 1.05;
    if (voice) u.voice = voice;
    setTimeout(() => speechSynthesis.speak(u), 60);
  }

  if ('serviceWorker' in navigator) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  return { unlock, sfx, say };
})();
