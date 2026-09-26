"use strict";
/* Music practice studio: piano, guitar, violin, drum kit, drills, metronome */
/* ============================================================
   MUSIC PRACTICE STUDIO
   Virtual piano, guitar, violin and drum kit, played with mouse, touch or
   computer keyboard. Record what you play (5 min max), mark notes and play
   them together, keep time with a metronome, and do note / drum drills.
   All sound is synthesised in the browser with the Web Audio API.
   ============================================================ */
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLAT_NAMES = { 1: "D♭", 3: "E♭", 6: "G♭", 8: "A♭", 10: "B♭" };
const pcOf = (m) => ((m % 12) + 12) % 12;
const noteName = (m, oct) => NOTE_NAMES[pcOf(m)] + (oct ? Math.floor(m / 12) - 1 : "");
const pcLabel = (pc) => FLAT_NAMES[pc] ? NOTE_NAMES[pc] + " / " + FLAT_NAMES[pc] : NOTE_NAMES[pc];
const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- sound engine ---------- */
const Sound = (() => {
  let ctx = null, master = null, dest = null, noise = null;
  const ks = new Map();
  function init() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.8;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
      dest = ctx.createMediaStreamDestination(); comp.connect(dest);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function noiseBuf() {
    if (noise) return noise;
    const c = init(), len = c.sampleRate * 2; noise = c.createBuffer(1, len, c.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noise;
  }
  function env(g, t, peak, attack, decayTo, decayTime) {
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(Math.max(decayTo, 0.0001), t + attack + decayTime);
  }
  function release(g, stopAt, oscs, time = 0.3) {
    const c = init(), t = c.currentTime;
    try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t); g.gain.exponentialRampToValueAtTime(0.0001, t + time); } catch (e) {}
    oscs.forEach(o => { try { o.stop(t + time + 0.05); } catch (e) {} });
  }
  /* piano: a few harmonics with a percussive envelope */
  function piano(m) {
    const c = init(), t = c.currentTime, f = midiFreq(m);
    const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = Math.min(9000, f * 8);
    env(g, t, 0.35, 0.004, 0.001, 2.6); g.connect(lp).connect(master);
    const oscs = [[1, 1, "triangle"], [2, 0.35, "sine"], [3, 0.12, "sine"], [4, 0.06, "sine"]].map(([h, a, type]) => {
      const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = f * h * (1 + (h - 1) * 0.0007); og.gain.value = a;
      o.connect(og).connect(g); o.start(t); o.stop(t + 2.8); return o;
    });
    return { release: () => release(g, 0, oscs, 0.9) };
  }
  /* guitar: Karplus-Strong plucked string */
  function pluckBuffer(m) {
    if (ks.has(m)) return ks.get(m);
    const c = init(), sr = c.sampleRate, len = Math.floor(sr * 2.4), f = midiFreq(m), N = Math.max(2, Math.round(sr / f));
    const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0), ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0; const decay = 0.996 - Math.max(0, (m - 60)) * 0.00008;
    for (let i = 0; i < len; i++) { const a = ring[idx], b = ring[(idx + 1) % N]; d[i] = a; ring[idx] = (a + b) * 0.5 * decay; idx = (idx + 1) % N; }
    ks.set(m, buf); return buf;
  }
  function guitar(m, when = 0) {
    const c = init(), t = c.currentTime + when, src = c.createBufferSource(), g = c.createGain(), lp = c.createBiquadFilter();
    src.buffer = pluckBuffer(m); lp.type = "lowpass"; lp.frequency.value = 3800; g.gain.value = 0.55;
    src.connect(lp).connect(g).connect(master); src.start(t);
    return { release: () => {} };
  }
  /* violin: bowed sawtooth with vibrato, held until released */
  function violin(m) {
    const c = init(), t = c.currentTime, f = midiFreq(m);
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(), pk = c.createBiquadFilter();
    o.type = "sawtooth"; o2.type = "sawtooth"; o.frequency.value = f; o2.frequency.value = f * 1.003;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.007, t + 0.45);
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    lp.type = "lowpass"; lp.frequency.value = 3000; lp.Q.value = 0.8; pk.type = "peaking"; pk.frequency.value = 2800; pk.gain.value = 5;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.12);
    o.connect(lp); o2.connect(lp); lp.connect(pk).connect(g).connect(master);
    [o, o2, lfo].forEach(x => x.start(t));
    const h = { release: () => release(g, 0, [o, o2, lfo], 0.25) };
    setTimeout(h.release, 6000);
    return h;
  }
  /* drum kit */
  function drum(name, when = 0) {
    const c = init(), t = c.currentTime + when;
    const out = c.createGain(); out.connect(master);
    const tone = (f0, f1, dur, vol, type = "sine") => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6); env(g, t, vol, 0.002, 0.001, dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05); };
    const hiss = (type, freq, dur, vol, q = 0.7) => { const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q; env(g, t, vol, 0.002, 0.001, dur); s.connect(fl).connect(g).connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.05); };
    switch (name) {
      case "kick": tone(150, 42, 0.45, 1.1); break;
      case "snare": hiss("highpass", 1400, 0.22, 0.55); tone(210, 160, 0.12, 0.35, "triangle"); break;
      case "hihat": hiss("highpass", 7500, 0.06, 0.32); break;
      case "ohat": hiss("highpass", 7000, 0.45, 0.28); break;
      case "tom1": tone(240, 170, 0.35, 0.75); break;
      case "tom2": tone(180, 125, 0.4, 0.75); break;
      case "ftom": tone(120, 80, 0.55, 0.85); break;
      case "crash": hiss("highpass", 4500, 1.6, 0.35); hiss("bandpass", 9000, 1.2, 0.18, 1); break;
      case "ride": hiss("bandpass", 8500, 0.9, 0.2, 2); tone(3200, 3100, 0.8, 0.05, "square"); break;
    }
    return { release: () => {} };
  }
  function beep(freq = 880, dur = 0.12, vol = 0.25) {
    const c = init(), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = freq; env(g, t, vol, 0.005, 0.001, dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  return {
    init, piano, guitar, violin, drum, beep,
    get ctx() { return init(); },
    get stream() { init(); return dest.stream; },
    setVolume(v) { init(); master.gain.value = v; }
  };
})();

/* ---------- instrument definitions ---------- */
const PIANO_KEYS = { q: 0, 2: 1, w: 2, 3: 3, e: 4, r: 5, 5: 6, t: 7, 6: 8, y: 9, 7: 10, u: 11, i: 12, 9: 13, o: 14, 0: 15, p: 16, "[": 17, "=": 18, "]": 19 };
const GUITAR_TUNING = [40, 45, 50, 55, 59, 64];               // low E to high E
const GUITAR_STRING_NAMES = ["E", "A", "D", "G", "B", "e"];
const GUITAR_CHORDS = { G: [3, 2, 0, 0, 0, 3], C: [-1, 3, 2, 0, 1, 0], D: [-1, -1, 0, 2, 3, 2], Em: [0, 2, 2, 0, 0, 0], Am: [-1, 0, 2, 2, 1, 0], E: [0, 2, 2, 1, 0, 0], A: [-1, 0, 2, 2, 2, 0], Dm: [-1, -1, 0, 2, 3, 1], F: [1, 3, 3, 2, 1, 1] };
const GUITAR_CHORD_KEYS = { q: "G", w: "C", e: "D", r: "Em", t: "Am", y: "E", u: "A", i: "Dm", o: "F" };
const VIOLIN_TUNING = [55, 62, 69, 76];                         // G D A E
const VIOLIN_STRING_NAMES = ["G", "D", "A", "E"];
const VIOLIN_ROWS = ["zxcvbnm,", "asdfghjk", "qwertyui", "12345678"]; // one keyboard row per string, open + 7 positions
const DRUM_PADS = [
  { id: "crash", name: "Crash", key: "q" }, { id: "ohat", name: "Open hi-hat", key: "w" }, { id: "tom1", name: "Tom 1", key: "j" }, { id: "tom2", name: "Tom 2", key: "k" }, { id: "ride", name: "Ride", key: "o" },
  { id: "hihat", name: "Hi-hat", key: "a" }, { id: "snare", name: "Snare", key: "s" }, { id: "ftom", name: "Floor tom", key: "l" }, { id: "kick", name: "Kick", key: " " }
];
const INSTRUMENTS = { piano: "Piano", guitar: "Guitar", violin: "Violin", drums: "Drum kit" };
const INSTRUMENT_OF = (topicId) => INSTRUMENTS[topicId] ? topicId : "piano";

/* ---------- studio markup ---------- */
function studioHTML(inst, ex) {
  const drill = ex?.drill;
  return `<div class="studio" data-studio="${inst}" ${ex ? `data-ex="${ex.id}"` : ""}>
    ${drill ? `<div class="drill" data-drill></div>` : ""}
    <div class="studio-bar">
      <b class="studio-name">${esc(INSTRUMENTS[inst])}</b>
      ${inst !== "drums" ? `<label class="mini">Labels <select data-s="labels"><option value="notes">Note names</option><option value="keys">Keyboard keys</option><option value="none">Off</option></select></label>`
        : `<label class="mini">Labels <select data-s="labels"><option value="notes">Drum names</option><option value="keys">Keyboard keys</option><option value="none">Off</option></select></label>`}
      ${inst === "piano" ? `<label class="mini">Octave <select data-s="octave"><option value="3">Low</option><option value="4" selected>Middle</option><option value="5">High</option></select></label>` : ""}
      <label class="mini">Volume <input type="range" min="0" max="100" value="80" data-s="volume"></label>
      <span class="spacer"></span>
      <button type="button" class="btn ghost sm" data-s="rec">⏺ Record</button>
      ${inst !== "drums" ? `<button type="button" class="btn ghost sm" data-s="mark" aria-pressed="false">✎ Mark</button>
        <button type="button" class="btn ghost sm hide" data-s="playmarked">▶ Play marked</button>
        <button type="button" class="btn ghost sm hide" data-s="clearmarks">Clear marks</button>` : ""}
    </div>
    <div class="studio-stage" data-stage></div>
    <p class="small muted studio-hint" data-hint></p>
    <div class="take hide" data-take>
      <div class="row" style="justify-content:space-between"><b>🎧 Your recording</b><span class="small muted" data-take-info></span></div>
      <audio controls style="width:100%;margin-top:8px"></audio>
      <div class="row small" style="margin-top:6px">✅ This take is attached to what you send.
        <button type="button" class="linkbtn" data-s="dltake">⬇ Download</button>
        <button type="button" class="linkbtn" data-s="discard" style="color:var(--danger)">Discard</button></div>
    </div>
    <details class="metro" data-metro><summary>🥁 Metronome</summary>
      <div class="row" style="margin-top:10px">
        <label class="mini">Tempo <input type="range" min="40" max="200" value="80" data-m="bpm"> <b data-m="bpmv">80</b> bpm</label>
        <label class="mini">Beats <select data-m="beats"><option>2</option><option>3</option><option selected>4</option><option>6</option></select></label>
        <button type="button" class="btn ok sm" data-m="toggle">▶ Start</button>
        <span class="beats" data-m="dots"></span>
      </div></details>
  </div>`;
}

function pianoStageHTML(octave) {
  const start = (octave + 1) * 12, whites = [], blacks = [];
  for (let m = start; m <= start + 24; m++) { if ([1, 3, 6, 8, 10].includes(pcOf(m))) blacks.push(m); else whites.push(m); }
  const W = whites.length, keyOf = {}; Object.entries(PIANO_KEYS).forEach(([k, off]) => keyOf[start + off] = k);
  const wHTML = whites.map(m => `<button type="button" class="pk white" data-midi="${m}" aria-label="${noteName(m, true)}"><span class="lb" data-n="${noteName(m) + (pcOf(m) === 0 ? Math.floor(m / 12) - 1 : "")}" data-k="${(keyOf[m] || "").toUpperCase()}"></span></button>`).join("");
  const bHTML = blacks.map(m => { const wi = whites.indexOf(m - 1); return `<button type="button" class="pk black" data-midi="${m}" style="left:calc(${(wi + 1) * 100 / W}% - ${100 / W * 0.31}%);width:${100 / W * 0.62}%" aria-label="${noteName(m, true)}"><span class="lb" data-n="${NOTE_NAMES[pcOf(m)]}" data-k="${(keyOf[m] || "").toUpperCase()}"></span></button>`; }).join("");
  return `<div class="piano-wrap"><div class="piano" style="--w:${W}">${wHTML}${bHTML}</div></div>`;
}
function fretStageHTML(inst) {
  const tuning = inst === "guitar" ? GUITAR_TUNING : VIOLIN_TUNING, frets = inst === "guitar" ? 12 : 7;
  const names = inst === "guitar" ? GUITAR_STRING_NAMES : VIOLIN_STRING_NAMES;
  const rows = tuning.map((open, s) => ({ open, s })).reverse();
  const keyFor = (s, f) => inst === "violin" ? (VIOLIN_ROWS[s][f] || "") : (f === 0 ? String(s + 1) : "");
  const inlay = inst === "guitar" ? [3, 5, 7, 9, 12] : [];
  return `<div class="fret-wrap"><div class="fretboard ${inst}" style="--frets:${frets + 1}">
    ${rows.map(({ open, s }) => `<div class="fret-row"><span class="sname">${names[s]}</span>${Array.from({ length: frets + 1 }, (_, f) => { const m = open + f; return `<button type="button" class="fret ${f === 0 ? "open" : ""}" data-midi="${m}" data-s="${s}" data-f="${f}" aria-label="${names[s]} string, ${f === 0 ? "open" : "fret " + f}, ${noteName(m, true)}"><span class="lb" data-n="${noteName(m)}" data-k="${keyFor(s, f).toUpperCase()}"></span></button>`; }).join("")}</div>`).join("")}
    <div class="fret-row nums"><span class="sname"></span>${Array.from({ length: frets + 1 }, (_, f) => `<span class="fnum">${f === 0 ? (inst === "guitar" ? "open" : "0") : f}${inlay.includes(f) ? (f === 12 ? " ••" : " •") : ""}</span>`).join("")}</div>
  </div></div>
  ${inst === "guitar" ? `<div class="chords"><span class="small muted">Strum a chord:</span>${Object.keys(GUITAR_CHORDS).map(c => `<button type="button" class="chordbtn" data-chord="${c}"><b>${c}</b><span class="lb" data-n="" data-k="${Object.keys(GUITAR_CHORD_KEYS).find(k => GUITAR_CHORD_KEYS[k] === c).toUpperCase()}"></span></button>`).join("")}</div>` : ""}`;
}
function drumStageHTML() {
  return `<div class="kit">${DRUM_PADS.map(p => `<button type="button" class="pad ${p.id}" data-pad="${p.id}" aria-label="${p.name}"><span class="lb" data-n="${p.name}" data-k="${p.key === " " ? "Space" : p.key.toUpperCase()}"></span></button>`).join("")}</div>`;
}
const STUDIO_HINTS = {
  piano: "Click or tap keys, or use your keyboard: the letter row Q W E R T Y U I O P plays white keys and the number row plays black keys. With Mark on, click keys to mark them and press Space to play them together.",
  guitar: "Tap any string and fret. Keys 1 to 6 play the open strings; Q W E R T Y U I O strum the chords G C D Em Am E A Dm F.",
  violin: "Press and hold to bow a note. Keyboard: Z row = G string, A row = D string, Q row = A string, number row = E string (first key is the open string).",
  drums: "Tap the pads or use the keyboard: A hi-hat, S snare, Space kick, Q crash, W open hi-hat, J K L toms, O ride."
};

/* ---------- studio behaviour ---------- */
function mountStudio(el) {
  const inst = el.dataset.studio, stage = $("[data-stage]", el);
  const st = { inst, labels: "notes", mark: false, marked: new Set(), held: new Map(), take: null, rec: null, drill: null, octave: 4, playedSeconds: 0, t0: Date.now() };
  el._studio = st;
  $("[data-hint]", el).textContent = STUDIO_HINTS[inst];

  function drawStage() {
    stage.innerHTML = inst === "piano" ? pianoStageHTML(st.octave) : inst === "drums" ? drumStageHTML() : fretStageHTML(inst);
    stage.dataset.labels = st.labels;
    st.marked.forEach(k => $(`[data-midi="${k}"]`, stage)?.classList.add("marked"));
  }
  drawStage();
  const elOf = (target) => target.closest("[data-midi],[data-pad],[data-chord]");

  function sound(target) {
    if (target.dataset.pad) return Sound.drum(target.dataset.pad);
    const m = +target.dataset.midi;
    return inst === "piano" ? Sound.piano(m) : inst === "guitar" ? Sound.guitar(m) : Sound.violin(m);
  }
  function flash(target, cls = "on", ms = 160) { target.classList.add(cls); setTimeout(() => target.classList.remove(cls), ms); }
  function press(target, id) {
    if (target.dataset.chord) return strum(target.dataset.chord, target);
    if (st.mark && target.dataset.midi) {
      const k = target.dataset.midi;
      if (st.marked.has(k)) { st.marked.delete(k); target.classList.remove("marked"); } else { st.marked.add(k); target.classList.add("marked"); }
      updateMarkButtons();
    }
    const h = sound(target); target.classList.add("on");
    st.held.set(id, { h, target });
    st.drill?.input(target);
    if (!target.dataset.midi || inst !== "violin") setTimeout(() => { if (!st.held.has(id)) target.classList.remove("on"); }, 180);
  }
  function lift(id) {
    const x = st.held.get(id); if (!x) return;
    st.held.delete(id); x.h?.release?.(); x.target.classList.remove("on");
  }
  function strum(chord, btn) {
    const shape = GUITAR_CHORDS[chord]; if (!shape) return;
    if (btn) flash(btn);
    shape.forEach((f, s) => { if (f < 0) return; const m = GUITAR_TUNING[s] + f; Sound.guitar(m, s * 0.028); const cell = $(`[data-s="${s}"][data-f="${f}"]`, stage); if (cell) setTimeout(() => flash(cell, "on", 260), s * 28); });
  }
  function updateMarkButtons() {
    $("[data-s=playmarked]", el)?.classList.toggle("hide", !st.marked.size);
    $("[data-s=clearmarks]", el)?.classList.toggle("hide", !st.marked.size);
  }
  function playMarked() {
    [...st.marked].map(Number).sort((a, b) => a - b).forEach((m, i) => {
      const t = $(`[data-midi="${m}"]`, stage); const h = inst === "piano" ? Sound.piano(m) : inst === "guitar" ? Sound.guitar(m, i * 0.02) : Sound.violin(m);
      if (t) flash(t, "on", 500); if (inst === "violin") setTimeout(() => h.release(), 900);
    });
  }
  st.playMarked = playMarked;
  st.clearMarks = () => { st.marked.clear(); $$(".marked", stage).forEach(x => x.classList.remove("marked")); updateMarkButtons(); };
  st.setMark = (on) => { st.mark = on; const b = $("[data-s=mark]", el); if (b) { b.setAttribute("aria-pressed", on); b.classList.toggle("on", on); } };
  st.stage = stage; st.strum = strum; st.flash = flash;
  st.setLabels = (v) => { st.labels = v; stage.dataset.labels = v; const s = $("[data-s=labels]", el); if (s) s.value = v; $$(".chords", el).forEach(c => c.dataset.labels = v); };

  /* pointer input */
  let pid = 0;
  stage.addEventListener("pointerdown", (e) => {
    const t = elOf(e.target); if (!t) return;
    e.preventDefault(); Sound.init();
    const id = "p" + e.pointerId + "_" + (++pid); t._pid = id; press(t, id);
    const up = () => { lift(id); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  });

  /* keyboard input */
  const keyTarget = (k) => {
    if (inst === "piano") { const off = PIANO_KEYS[k]; return off === undefined ? null : $(`[data-midi="${(st.octave + 1) * 12 + off}"]`, stage); }
    if (inst === "drums") { const p = DRUM_PADS.find(x => x.key === k); return p ? $(`[data-pad="${p.id}"]`, stage) : null; }
    if (inst === "guitar") { if (/^[1-6]$/.test(k)) return $(`[data-s="${+k - 1}"][data-f="0"]`, stage); if (GUITAR_CHORD_KEYS[k]) return $(`[data-chord="${GUITAR_CHORD_KEYS[k]}"]`, el); return null; }
    for (let s = 0; s < 4; s++) { const f = VIOLIN_ROWS[s].indexOf(k); if (f >= 0) return $(`[data-s="${s}"][data-f="${f}"]`, stage); }
    return null;
  };
  const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "") && document.activeElement.type !== "range";
  const onKey = (e) => {
    if (typing() || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === " " && inst !== "drums") { if (st.marked.size) { e.preventDefault(); if (!e.repeat) playMarked(); } return; }
    const t = keyTarget(k); if (!t) return;
    e.preventDefault(); if (e.repeat) return; Sound.init();
    press(t, "k" + k);
  };
  const onKeyUp = (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; lift("k" + k); };
  window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKeyUp);
  onCleanup(() => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp); st.held.forEach((x) => x.h?.release?.()); });

  /* toolbar */
  el.addEventListener("change", (e) => {
    const s = e.target.dataset.s;
    if (s === "labels") { st.labels = e.target.value; stage.dataset.labels = st.labels; $$(".chords", el).forEach(c => c.dataset.labels = st.labels); }
    if (s === "octave") { st.octave = +e.target.value; st.clearMarks(); drawStage(); }
  });
  el.addEventListener("input", (e) => { if (e.target.dataset.s === "volume") Sound.setVolume(+e.target.value / 100); });
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-s]"); if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return;
    const s = b.dataset.s;
    if (b.dataset.chord) return;
    if (s === "mark") { st.setMark(!st.mark); }
    if (s === "playmarked") playMarked();
    if (s === "clearmarks") st.clearMarks();
    if (s === "rec") toggleRecord(b);
    if (s === "discard") { st.take = null; $("[data-take]", el).classList.add("hide"); }
    if (s === "dltake" && st.take) offerDownload(st.take.name, st.take.blob);
  });
  // chord buttons live outside the stage for the guitar
  el.addEventListener("pointerdown", (e) => { const c = e.target.closest("[data-chord]"); if (c) { e.preventDefault(); Sound.init(); strum(c.dataset.chord, c); } });

  /* record what is played (straight from the instrument, no microphone needed) */
  function toggleRecord(btn) {
    if (st.rec) { st.rec.mr.stop(); return; }
    if (!window.MediaRecorder) { toast("Recording is not supported in this browser."); return; }
    const mime = pickMime(), chunks = [];
    const mr = new MediaRecorder(Sound.stream, mime ? { mimeType: mime } : undefined);
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const t0 = Date.now();
    const iv = setInterval(() => { const s = (Date.now() - t0) / 1000; btn.innerHTML = `<span class="recdot"></span> Stop ${mmss(s)}`; if (s >= 300) mr.stop(); }, 250);
    mr.onstop = () => {
      clearInterval(iv); btn.textContent = "⏺ Record"; btn.classList.remove("danger");
      const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" }), secs = Math.round((Date.now() - t0) / 1000);
      st.rec = null; st.playedSeconds += secs;
      st.take = { blob, name: inst + "-take-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-") + (/(mp4)/.test(blob.type) ? ".mp4" : ".webm"), seconds: secs };
      const box = $("[data-take]", el), au = $("audio", box);
      if (au.src) URL.revokeObjectURL(au.src);
      au.src = URL.createObjectURL(blob); $("[data-take-info]", box).textContent = mmss(secs);
      box.classList.remove("hide");
    };
    mr.start(250); st.rec = { mr };
    btn.classList.add("danger");
  }
  onCleanup(() => { if (st.rec) { st.rec.mr.onstop = null; st.rec.mr.stop(); } });

  mountMetronome($("[data-metro]", el));
  const dEl = $("[data-drill]", el);
  if (dEl) st.drill = createDrill(dEl, st, EXERCISE(el.dataset.ex), el);
}

/* ---------- metronome (not included in recordings) ---------- */
function mountMetronome(el) {
  if (!el) return;
  let timer = null, next = 0, beat = 0;
  const bpm = $("[data-m=bpm]", el), bpmv = $("[data-m=bpmv]", el), beats = $("[data-m=beats]", el), dots = $("[data-m=dots]", el), btn = $("[data-m=toggle]", el);
  const drawDots = () => { dots.innerHTML = Array.from({ length: +beats.value }, (_, i) => `<i data-b="${i}"></i>`).join(""); };
  drawDots();
  bpm.addEventListener("input", () => bpmv.textContent = bpm.value);
  beats.addEventListener("change", () => { drawDots(); beat = 0; });
  function tick() {
    const c = Sound.ctx;
    while (next < c.currentTime + 0.12) {
      const b = beat, t = next, o = c.createOscillator(), g = c.createGain();
      o.type = "square"; o.frequency.value = b === 0 ? 1500 : 1000;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.06);
      setTimeout(() => { $$("i", dots).forEach((d, i) => d.classList.toggle("on", i === b)); }, Math.max(0, (t - c.currentTime) * 1000));
      next += 60 / +bpm.value; beat = (beat + 1) % +beats.value;
    }
  }
  function stop() { clearInterval(timer); timer = null; btn.textContent = "▶ Start"; $$("i", dots).forEach(d => d.classList.remove("on")); }
  btn.addEventListener("click", () => { if (timer) return stop(); next = Sound.ctx.currentTime + 0.05; beat = 0; timer = setInterval(tick, 25); btn.textContent = "■ Stop"; });
  onCleanup(stop);
}

/* ============================================================
   DRILLS (note reading, key finding, chords, note naming, drum ear training)
   ============================================================ */
function staffSVG(midi) {
  const letter = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pcOf(midi)];
  const d = (Math.floor(midi / 12) - 1) * 7 + letter;       // diatonic step; E4 = 30 is the bottom line
  const gap = 12, bottom = 110, y = bottom - (d - 30) * gap / 2, x = 160;
  let ledgers = "";
  for (let s = 28; s >= d; s -= 2) ledgers += `<line x1="${x - 18}" x2="${x + 18}" y1="${bottom - (s - 30) * gap / 2}" y2="${bottom - (s - 30) * gap / 2}" class="st-line"/>`;
  for (let s = 40; s <= d; s += 2) ledgers += `<line x1="${x - 18}" x2="${x + 18}" y1="${bottom - (s - 30) * gap / 2}" y2="${bottom - (s - 30) * gap / 2}" class="st-line"/>`;
  const lines = [0, 1, 2, 3, 4].map(i => `<line x1="20" x2="300" y1="${bottom - i * gap}" y2="${bottom - i * gap}" class="st-line"/>`).join("");
  const stemUp = d < 34, stem = stemUp ? `<line x1="${x + 8.5}" x2="${x + 8.5}" y1="${y}" y2="${y - 36}" class="st-stem"/>` : `<line x1="${x - 8.5}" x2="${x - 8.5}" y1="${y}" y2="${y + 36}" class="st-stem"/>`;
  return `<svg class="staff" viewBox="0 0 320 170" role="img" aria-label="A note on the treble staff">
    ${lines}<text x="26" y="${bottom + 9}" class="st-clef">𝄞</text>${ledgers}
    <ellipse cx="${x}" cy="${y}" rx="9.5" ry="6.8" transform="rotate(-20 ${x} ${y})" class="st-note"/>${stem}</svg>`;
}

function createDrill(el, st, ex, studioEl) {
  const spec = ex.drill, total = ex.questions || 10;
  const D = { q: 0, right: 0, wrong: 0, cur: null, busy: true, seq: [], done: false, result: null };
  const answerNames = (naturals) => (naturals ? [0, 2, 4, 5, 7, 9, 11] : [...Array(12).keys()]);

  function shell(inner) { el.innerHTML = inner; }
  function intro() {
    D.q = 0; D.right = 0; D.wrong = 0; D.done = false; D.busy = true;
    shell(`<div class="drill-head"><div><span class="chip music">Exercise</span><h3 style="margin:6px 0 2px">${esc(ex.title)}</h3><p class="small muted" style="margin:0">${esc(ex.desc)} ${total} questions.</p></div>
      <button type="button" class="btn" data-d="start">▶ Start exercise</button></div>`);
  }
  function header() {
    return `<div class="drill-top"><b>Question ${Math.min(D.q + 1, total)} of ${total}</b><span class="ok-c">✓ ${D.right}</span><span class="bad-c">✗ ${D.wrong}</span>
      <div class="progress" style="flex:1;min-width:120px"><i style="width:${D.q / total * 100}%"></i></div></div>`;
  }
  function clearTargets() { $$(".target,.good,.bad", st.stage).forEach(x => x.classList.remove("target", "good", "bad")); }

  function nextQ() {
    clearTargets(); D.seq = [];
    if (D.q >= total) return finish();
    const prev = D.cur;
    let q;
    do {
      if (spec.type === "read") q = { midi: rnd(spec.notes) };
      else if (spec.type === "find" && st.inst === "piano") q = { pc: rnd(spec.pcs) };
      else if (spec.type === "chord") q = { root: rnd(spec.chords) };
      else if (spec.type === "name" || spec.type === "find") {
        const tuning = st.inst === "guitar" ? GUITAR_TUNING : VIOLIN_TUNING, s = rnd(spec.strings);
        const opts = []; for (let f = spec.frets[0]; f <= spec.frets[1]; f++) { const m = tuning[s] + f; if (!spec.naturals || ![1, 3, 6, 8, 10].includes(pcOf(m))) opts.push(f); }
        const f = rnd(opts); q = { s, f, midi: tuning[s] + f };
      }
      else if (spec.type === "listen") q = { pad: rnd(spec.pads) };
      else if (spec.type === "copy") { const seq = []; while (seq.length < spec.len) { const p = rnd(spec.pads); if (seq.length >= 2 && seq[seq.length - 1] === p && seq[seq.length - 2] === p) continue; seq.push(p); } q = { seq }; }
    } while (prev && JSON.stringify(prev) === JSON.stringify(q) && spec.type !== "copy");
    D.cur = q; D.busy = false;
    render();
  }
  function prompt() {
    const q = D.cur, strN = st.inst === "guitar" ? GUITAR_STRING_NAMES : VIOLIN_STRING_NAMES;
    switch (spec.type) {
      case "read": return `<div class="drill-q">${staffSVG(q.midi)}<p>Play this note on the ${st.inst}.</p></div>`;
      case "find": return st.inst === "piano" ? `<div class="drill-q"><div class="big-note">${pcLabel(q.pc)}</div><p>Play this key.</p></div>`
        : `<div class="drill-q"><div class="big-note">${NOTE_NAMES[pcOf(q.midi)]}</div><p>Find it on the <b>${strN[q.s]}</b> string.</p></div>`;
      case "chord": return `<div class="drill-q"><div class="big-note">${pcLabel(q.root)} major</div><p>Mark the three keys of the chord, then press Check.</p>
        <div class="row" style="justify-content:center"><button type="button" class="btn ok" data-d="check">✔ Check</button><button type="button" class="btn ghost" data-d="clear">Clear</button></div></div>`;
      case "name": return `<div class="drill-q"><p>What note is highlighted?</p><div class="choices">${answerNames(spec.naturals).map(pc => `<button type="button" class="choice" data-d="ans" data-pc="${pc}">${pcLabel(pc)}</button>`).join("")}</div></div>`;
      case "listen": return `<div class="drill-q"><div class="big-note">🔊</div><p>Which drum was that? Tap it on the kit.</p><button type="button" class="btn ghost sm" data-d="replay">🔁 Play again</button></div>`;
      case "copy": return `<div class="drill-q"><div class="big-note">${D.cur.seq.map((_, i) => `<span class="seqdot ${i < D.seq.length ? "on" : ""}"></span>`).join("")}</div><p>Listen, then play the ${spec.len} hits back in order.</p><button type="button" class="btn ghost sm" data-d="replay">🔁 Play again</button></div>`;
    }
  }
  function render(fb = "") {
    shell(header() + prompt() + `<div class="drill-fb" aria-live="polite">${fb}</div>`);
    const q = D.cur;
    if ((spec.type === "name" || spec.type === "find") && st.inst !== "piano" && spec.type === "name") {
      const cell = $(`[data-s="${q.s}"][data-f="${q.f}"]`, st.stage); cell?.classList.add("target");
      if (!fb) setTimeout(() => (st.inst === "guitar" ? Sound.guitar(q.midi) : (() => { const h = Sound.violin(q.midi); setTimeout(h.release, 700); })()), 150);
    }
    if (spec.type === "listen" && !fb) setTimeout(() => Sound.drum(q.pad), 350);
    if (spec.type === "copy" && !fb && !D.seq.length) playSeq();
  }
  function playSeq() { D.busy = true; D.cur.seq.forEach((p, i) => setTimeout(() => Sound.drum(p), 400 + i * 480)); setTimeout(() => D.busy = false, 400 + D.cur.seq.length * 480); }

  function judge(ok, showCorrect, label) {
    D.busy = true;
    if (ok) D.right++; else D.wrong++;
    D.q++;
    render(ok ? `<span class="ok-c">✓ Correct! ${esc(label)}</span>` : `<span class="bad-c">✗ Not quite. ${esc(label)}</span>`);
    if (!ok && showCorrect) showCorrect();
    setTimeout(nextQ, ok ? 900 : 1900);
  }
  const markCorrectPc = (pc) => $$("[data-midi]", st.stage).filter(k => pcOf(+k.dataset.midi) === pc).forEach(k => k.classList.add("good"));

  D.input = (target) => {
    if (D.busy || D.done || !D.cur) return;
    const q = D.cur, m = +target.dataset.midi;
    switch (spec.type) {
      case "read":
        if (target.dataset.midi === undefined) return;
        if (st.inst === "piano") judge(pcOf(m) === pcOf(q.midi), () => markCorrectPc(pcOf(q.midi)), "It was " + noteName(q.midi) + ".");
        else judge(m === q.midi, () => $$("[data-midi]", st.stage).filter(k => +k.dataset.midi === q.midi).forEach(k => k.classList.add("good")), "It was " + noteName(q.midi, true) + ".");
        target.classList.add(pcOf(m) === pcOf(q.midi) ? "good" : "bad"); break;
      case "find":
        if (target.dataset.midi === undefined) return;
        if (st.inst === "piano") { const ok = pcOf(m) === q.pc; target.classList.add(ok ? "good" : "bad"); judge(ok, () => markCorrectPc(q.pc), "That key is " + noteName(m) + "."); }
        else { const ok = +target.dataset.s === q.s && pcOf(m) === pcOf(q.midi); target.classList.add(ok ? "good" : "bad");
          judge(ok, () => $$(`[data-s="${q.s}"]`, st.stage).filter(k => pcOf(+k.dataset.midi) === pcOf(q.midi)).forEach(k => k.classList.add("good")), ok ? "" : "You played " + noteName(m) + " on the " + (st.inst === "guitar" ? GUITAR_STRING_NAMES : VIOLIN_STRING_NAMES)[+target.dataset.s] + " string."); }
        break;
      case "listen": { if (!target.dataset.pad) return; const ok = target.dataset.pad === q.pad; target.classList.add(ok ? "good" : "bad");
        judge(ok, () => $(`[data-pad="${q.pad}"]`, st.stage)?.classList.add("good"), "It was the " + DRUM_PADS.find(p => p.id === q.pad).name.toLowerCase() + "."); break; }
      case "copy": { if (!target.dataset.pad) return; D.seq.push(target.dataset.pad);
        $$(".seqdot", el).forEach((d, i) => d.classList.toggle("on", i < D.seq.length));
        const i = D.seq.length - 1;
        if (D.seq[i] !== q.seq[i]) judge(false, null, "The pattern was: " + q.seq.map(p => DRUM_PADS.find(x => x.id === p).name).join(", ") + ".");
        else if (D.seq.length === q.seq.length) judge(true, null, "");
        break; }
    }
  };
  function checkChord() {
    const want = new Set([D.cur.root, (D.cur.root + 4) % 12, (D.cur.root + 7) % 12]);
    const got = new Set([...st.marked].map(k => pcOf(+k)));
    const ok = got.size === 3 && [...want].every(p => got.has(p)) && st.marked.size === 3;
    const names = [...want].map(p => NOTE_NAMES[p]).join(", ");
    st.clearMarks();
    judge(ok, () => [...want].forEach(markCorrectPc), ok ? "" : "The chord is " + names + ".");
  }
  function finish() {
    D.done = true; D.busy = true; st.setMark && spec.type === "chord" && st.setMark(false);
    if (D.savedLabels !== undefined) { st.setLabels(D.savedLabels); D.savedLabels = undefined; }
    const pct = Math.round(D.right / total * 100);
    D.result = { title: ex.title, score: D.right, total, exId: ex.id };
    st.drillResult = D.result;
    studioEl._onResult?.({ kind: "drill", exId: ex.id, score: D.right, total });
    shell(`<div class="drill-end"><div class="big-note">${pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"} ${D.right} / ${total}</div>
      <p>${pct >= 80 ? "Excellent work!" : pct >= 50 ? "Good effort. Try again to beat your score." : "Keep practising; you will get there."} Your score is attached to what you send your mentor.</p>
      <div class="row" style="justify-content:center"><button type="button" class="btn" data-d="start">↺ Try again</button></div></div>`);
  }
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    Sound.init();
    const a = b.dataset.d;
    if (a === "start") { if (spec.type === "chord") st.setMark(true);
      if (["read", "find", "name", "chord"].includes(spec.type)) { if (D.savedLabels === undefined) D.savedLabels = st.labels; st.setLabels("none"); } D.q = 0; D.right = 0; D.wrong = 0; D.done = false; D.cur = null; nextQ(); }
    if (a === "ans" && !D.busy) { const pc = +b.dataset.pc, ok = pc === pcOf(D.cur.midi); b.classList.add(ok ? "good" : "bad"); judge(ok, () => $$(`[data-pc="${pcOf(D.cur.midi)}"]`, el).forEach(x => x.classList.add("good")), "It was " + NOTE_NAMES[pcOf(D.cur.midi)] + "."); }
    if (a === "check" && !D.busy) checkChord();
    if (a === "clear") st.clearMarks();
    if (a === "replay" && !D.busy) { if (spec.type === "listen") Sound.drum(D.cur.pad); else { D.seq = []; $$(".seqdot", el).forEach(d => d.classList.remove("on")); playSeq(); } }
  });
  intro();
  return D;
}
