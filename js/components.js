"use strict";
/* Shared components: recorder, file attachments, media viewer */
/* ============================================================
   COMPONENTS: practice timer, recorder + live waveform, pitch tone
   ============================================================ */
let cleanups = [];
let mounts = [];
function onMount(fn) { mounts.push(fn); }
function onCleanup(fn) { cleanups.push(fn); }
function runCleanups() { cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = []; }

let audioCtx = null;
function actx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); return audioCtx; }

/* ---- Practice timer ---- */
function timerHTML(key, targetMin = 10) {
  return `<div class="timer" data-timer="${key}">
    <div class="ring"><div class="tt" aria-live="off">00:00</div></div>
    <div style="flex:1;min-width:200px">
      <label class="f">Target practice duration (minutes)
        <input class="input" type="number" min="1" max="240" value="${targetMin || 10}" data-t="target"></label>
      <div class="row">
        <button type="button" class="btn ok sm" data-t="start">▶ Start</button>
        <button type="button" class="btn ghost sm" data-t="pause">⏸ Pause</button>
        <button type="button" class="btn ghost sm" data-t="reset">↺ Reset</button>
      </div>
      <p class="small muted tstat" style="margin:8px 0 0">Not started</p>
    </div></div>`;
}
function mountTimer(el) {
  const st = { elapsed: 0, startedAt: null, iv: null, hit: false };
  el._timer = st;
  const tt = $(".tt", el), ring = $(".ring", el), stat = $(".tstat", el), target = $("[data-t=target]", el);
  const seconds = () => st.elapsed + (st.startedAt ? (Date.now() - st.startedAt) / 1000 : 0);
  st.seconds = seconds;
  function paint() {
    const s = seconds(), tgt = Math.max(1, +target.value || 1) * 60;
    tt.textContent = mmss(s);
    ring.style.setProperty("--p", Math.min(100, s / tgt * 100));
    if (!st.hit && s >= tgt) { st.hit = true; toast("🎉 Target practice time reached!"); stat.textContent = "Target reached. Keep going or save your session."; }
  }
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    const a = b.dataset.t;
    if (a === "start" && !st.startedAt) { st.startedAt = Date.now(); st.iv = setInterval(paint, 250); stat.textContent = "Practising…"; }
    if (a === "pause" && st.startedAt) { st.elapsed = seconds(); st.startedAt = null; clearInterval(st.iv); stat.textContent = "Paused at " + mmss(st.elapsed); }
    if (a === "reset") { clearInterval(st.iv); st.elapsed = 0; st.startedAt = null; st.hit = false; stat.textContent = "Not started"; }
    paint();
  });
  target.addEventListener("input", () => { st.hit = false; paint(); });
  onCleanup(() => clearInterval(st.iv));
  paint();
}

/* ---- Recorder: in-app mic, device camera/recorder, or upload ---- */
function recorderHTML(key, label = "Record audio") {
  return `<div class="recorder" data-rec="${key}">
    <canvas class="wave" height="110" aria-label="Audio waveform"></canvas>
    <div class="row" style="margin-top:10px">
      <button type="button" class="btn" data-r="start">🎙️ ${esc(label)}</button>
      <button type="button" class="btn danger hide" data-r="stop">■ Stop</button>
      <label class="btn ghost" style="cursor:pointer">🎥 Record video<input type="file" accept="video/*" capture="user" class="hide" data-r="cam"></label>
      <label class="btn ghost" style="cursor:pointer">📎 Upload audio/video<input type="file" accept="audio/*,video/*" class="hide" data-r="file"></label>
    </div>
    <p class="rstat muted small" style="margin:8px 0 0"></p>
    <div class="rprev" style="margin-top:8px"></div>
    <button type="button" class="linkbtn hide small" data-r="discard" style="color:var(--danger);margin-top:6px">Remove this recording</button>
  </div>`;
}
function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#5B3DF5"; }
function drawIdle(canvas, text) {
  const c = canvas.getContext("2d"), w = canvas.width, h = canvas.height, dpr = window.devicePixelRatio || 1;
  c.clearRect(0, 0, w, h);
  c.strokeStyle = css("--line"); c.lineWidth = 2 * dpr; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  if (text) { c.fillStyle = css("--muted"); c.font = "600 " + Math.round(13 * dpr) + "px Figtree, sans-serif"; c.textAlign = "center"; c.fillText(text, w / 2, h / 2 - 12 * dpr); }
}
async function drawPeaks(canvas, blob) {
  try {
    const buf = await actx().decodeAudioData(await blob.arrayBuffer());
    const data = buf.getChannelData(0), c = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
    const bars = 120, step = Math.floor(data.length / bars) || 1, bw = w / bars;
    c.clearRect(0, 0, w, h); c.fillStyle = css("--violet");
    for (let i = 0; i < bars; i++) {
      let peak = 0; for (let j = 0; j < step; j += 16) { const v = Math.abs(data[i * step + j] || 0); if (v > peak) peak = v; }
      const bh = Math.max(3, peak * h * 0.95);
      c.fillRect(i * bw + 1, (h - bh) / 2, Math.max(2, bw - 2), bh);
    }
  } catch (e) { drawIdle(canvas, "Recording attached"); }
}
function pickMime() {
  if (!window.MediaRecorder) return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "video/webm"]) if (MediaRecorder.isTypeSupported?.(m)) return m;
  return "";
}
async function previewInto(box, blob) {
  const isVideo = /^video\//.test(blob.type) && !/audio/.test(blob.type);
  const src = await blobToDataUrl(blob);
  box.innerHTML = isVideo ? `<video controls playsinline style="width:100%;max-height:320px;border-radius:12px" src="${src}"></video>` : `<audio controls style="width:100%" src="${src}"></audio>`;
}
function mountRecorder(el) {
  const st = { blob: null, name: "", stream: null, mr: null, chunks: [], raf: 0, t0: 0, iv: null };
  el._rec = st;
  const canvas = $("canvas", el), stat = $(".rstat", el), prev = $(".rprev", el);
  const bStart = $("[data-r=start]", el), bStop = $("[data-r=stop]", el), bDiscard = $("[data-r=discard]", el);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(300, canvas.clientWidth * dpr); canvas.height = (canvas.clientHeight || 110) * dpr;
  drawIdle(canvas, "Your waveform appears here");

  function setBlob(blob, name) {
    st.blob = blob; st.name = name || "";
    if (blob) {
      bDiscard.classList.remove("hide");
      stat.textContent = "✅ Recording ready to send (" + (blob.size > 1048576 ? (blob.size / 1048576).toFixed(1) + " MB" : Math.round(blob.size / 1024) + " KB") + "). Play it below to check.";
      previewInto(prev, blob); drawPeaks(canvas, blob);
    } else { prev.innerHTML = ""; bDiscard.classList.add("hide"); stat.textContent = ""; drawIdle(canvas, "Your waveform appears here"); }
  }
  function stopAll() { cancelAnimationFrame(st.raf); clearInterval(st.iv); st.stream?.getTracks().forEach(t => t.stop()); st.stream = null; }
  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { stat.textContent = "In-app recording is not available here. Tap “Record video” to use your camera app, or upload a recording."; return; }
    try { st.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { stat.innerHTML = "🎙️ The microphone is blocked for this page. Allow microphone access in your browser's site settings, or tap <b>Record video</b> (opens your phone camera) or <b>Upload</b> instead."; return; }
    const mime = pickMime();
    try { st.mr = new MediaRecorder(st.stream, mime ? { mimeType: mime } : undefined); } catch (e) { st.mr = new MediaRecorder(st.stream); }
    st.chunks = [];
    st.mr.ondataavailable = (e) => e.data.size && st.chunks.push(e.data);
    st.mr.onstop = () => {
      stopAll();
      const type = (st.mr.mimeType || "audio/webm").split(";")[0];
      setBlob(new Blob(st.chunks, { type }), "recording-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-") + (/mp4/.test(type) ? ".mp4" : ".webm"));
      bStart.classList.remove("hide"); bStop.classList.add("hide");
    };
    st.mr.start(250);
    const ctx = actx(), src = ctx.createMediaStreamSource(st.stream), an = ctx.createAnalyser();
    an.fftSize = 2048; src.connect(an);
    const data = new Uint8Array(an.fftSize), c = canvas.getContext("2d"), w = canvas.width, h = canvas.height, col = css("--music");
    (function draw() {
      an.getByteTimeDomainData(data);
      c.clearRect(0, 0, w, h); c.lineWidth = 2 * dpr; c.strokeStyle = col; c.beginPath();
      for (let i = 0; i < data.length; i++) { const x = i / data.length * w, y = data[i] / 255 * h; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); st.raf = requestAnimationFrame(draw);
    })();
    st.t0 = Date.now();
    st.iv = setInterval(() => { stat.innerHTML = `<span class="recdot"></span> Recording ${mmss((Date.now() - st.t0) / 1000)}. Tap Stop when done.`; }, 300);
    bStart.classList.add("hide"); bStop.classList.remove("hide");
  }
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    if (b.dataset.r === "start") start();
    if (b.dataset.r === "stop" && st.mr?.state === "recording") st.mr.stop();
    if (b.dataset.r === "discard") setBlob(null);
  });
  $$("input[type=file]", el).forEach(inp => inp.addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 60 * 1024 * 1024) { stat.textContent = "That file is over 60 MB. Record a shorter clip."; return; }
    setBlob(f, f.name); e.target.value = "";
  }));
  onCleanup(() => { if (st.mr?.state === "recording") { st.mr.onstop = null; st.mr.stop(); } stopAll(); });
}

/* ---- File attachments (photos, PDFs, notes, media) ---- */
function filesHTML(key, label = "Attach photos, notes or files") {
  return `<div data-files="${key}">
    <label class="btn ghost" style="cursor:pointer">📎 ${esc(label)}<input type="file" multiple accept="image/*,video/*,audio/*,application/pdf,text/plain,.txt,.md,.csv,.py,.json" class="hide"></label>
    <label class="btn ghost" style="cursor:pointer">📷 Take photo<input type="file" accept="image/*" capture="environment" class="hide"></label>
    <div class="files"></div></div>`;
}
function mountFiles(el) {
  el._files = [];
  const list = $(".files", el);
  function paint() {
    list.innerHTML = el._files.map((f, i) => `<div class="file"><span class="fn">${/^image\//.test(f.type) ? "🖼️" : /^video\//.test(f.type) ? "🎬" : /^audio\//.test(f.type) ? "🎧" : "📄"} ${esc(f.name)} <span class="muted small">(${Math.max(1, Math.round(f.size / 1024))} KB)</span></span><button type="button" class="linkbtn small" data-rm="${i}" style="color:var(--danger)">Remove</button></div>`).join("");
  }
  $$("input[type=file]", el).forEach(inp => inp.addEventListener("change", () => {
    for (const f of inp.files) { if (f.size > 60 * 1024 * 1024) { toast(f.name + " is over 60 MB and was skipped."); continue; } el._files.push(f); }
    inp.value = ""; paint();
  }));
  list.addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (b) { el._files.splice(+b.dataset.rm, 1); paint(); } });
}

/* ---- Showing stored media with view + download ---- */
function mediaListHTML(ids) {
  if (!ids || !ids.length) return "";
  return `<div class="files">${ids.map(id => `<div class="file" data-media="${id}"><span class="fn">Loading…</span></div>`).join("")}</div>`;
}
async function hydrateMediaEl(el) {
  const meta = mediaMeta(el.dataset.media);
  if (!meta) { el.innerHTML = `<span class="fn muted">File is stored on another device.</span>`; return; }
  const m = meta.mime;
  const kind = /^image\//.test(m) ? "image" : /^video\//.test(m) ? "video" : /^audio\//.test(m) ? "audio" : m === "application/pdf" ? "pdf" : /^text\/|json/.test(m) ? "text" : "file";
  const icon = { image: "🖼️", video: "🎬", audio: "🎧", pdf: "📕", text: "📝", file: "📄" }[kind];
  const btns = `<button type="button" class="btn ghost sm" data-act="view-media" data-id="${meta.id}">👁 View</button><button type="button" class="btn ghost sm" data-act="dl-media" data-id="${meta.id}">⬇ Download</button>`;
  let player = "";
  try {
    if (kind === "audio" || kind === "video" || kind === "image") {
      const src = await mediaSrc(meta);
      if (!src) throw new Error("missing");
      if (kind === "image") player = `<img class="thumb" src="${src}" alt="" data-act="view-media" data-id="${meta.id}">`;
      else if (kind === "audio") player = `<audio controls preload="metadata" src="${src}"></audio>`;
      else player = `<video controls playsinline preload="metadata" src="${src}"></video>`;
    }
  } catch (e) { player = `<span class="small muted">Could not load this file on this device.</span>`; }
  el.innerHTML = `${kind === "image" ? player : ""}<span class="fn">${icon} ${esc(meta.name)}</span>${btns}${kind !== "image" ? `<div style="flex-basis:100%">${player}</div>` : ""}`;
}
function hydrateMedia() { onMount(() => $$("[data-media]").forEach(hydrateMediaEl)); }
async function viewMedia(id) {
  const meta = mediaMeta(id); if (!meta) return;
  modal(`<div class="viewer"><h3 style="word-break:break-word">${esc(meta.name)}</h3><div data-vbody class="muted">Loading…</div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="dl-media" data-id="${id}">⬇ Download</button><button class="btn ghost" data-act="close-modal">Close</button></div></div>`);
  const body = $("[data-vbody]");
  try {
    if (/^image\//.test(meta.mime)) body.innerHTML = `<img src="${await mediaSrc(meta)}" alt="">`;
    else if (/^video\//.test(meta.mime)) body.innerHTML = `<video controls playsinline src="${await mediaSrc(meta)}"></video>`;
    else if (/^audio\//.test(meta.mime)) body.innerHTML = `<audio controls style="width:100%" src="${await mediaSrc(meta)}"></audio>`;
    else if (/^text\/|json/.test(meta.mime)) { const b = await mediaBlob(meta); body.innerHTML = `<pre>${esc(await b.text())}</pre>`; }
    else if (meta.mime === "application/pdf" && meta.store === "asset") body.innerHTML = `<iframe src="/_blob/${meta.assetId}" style="width:100%;height:60vh;border:0;border-radius:12px" title="PDF"></iframe>`;
    else body.textContent = "This file cannot be previewed here. Use Download to open it.";
  } catch (e) { body.textContent = "Could not load this file."; }
}
function viewText(title, text, filename) {
  modal(`<div class="viewer"><h3>${esc(title)}</h3><pre>${esc(text)}</pre>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="dl-text">⬇ Download</button><button class="btn ghost" data-act="close-modal">Close</button></div></div>`);
  $("[data-act=dl-text]").onclick = () => offerDownload(filename, text);
}

/* ---- Reference pitch (Sa + Pa drone) ---- */
function pitchHTML(key, value) {
  return `<div class="formgrid" data-pitch="${key}">
    <label class="f">Target pitch (sruti)
      <select class="input" data-p="pitch">${PITCHES.map(([n]) => `<option ${n === value ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
    <div style="align-self:end;margin-bottom:12px"><button type="button" class="btn ghost" data-p="tone" style="width:100%">🔊 Play reference Sa + Pa</button></div>
  </div>`;
}
function mountPitch(el) {
  let nodes = null;
  const btn = $("[data-p=tone]", el), sel = $("[data-p=pitch]", el);
  function stop() { if (!nodes) return; const t = actx().currentTime; nodes.g.gain.setTargetAtTime(0, t, .08); const n = nodes; setTimeout(() => n.oscs.forEach(o => o.stop()), 300); nodes = null; btn.textContent = "🔊 Play reference Sa + Pa"; }
  function play() {
    const ctx = actx(), f = (PITCHES.find(p => p[0] === sel.value) || PITCHES[0])[1];
    const g = ctx.createGain(); g.gain.value = 0; g.connect(ctx.destination);
    const oscs = [[f, .5], [f * 1.5, .25], [f / 2, .3]].map(([fr, v]) => { const o = ctx.createOscillator(); const og = ctx.createGain(); o.type = "triangle"; o.frequency.value = fr; og.gain.value = v; o.connect(og).connect(g); o.start(); return o; });
    g.gain.setTargetAtTime(.12, ctx.currentTime, .1);
    nodes = { g, oscs }; btn.textContent = "⏹ Stop reference tone";
  }
  btn.addEventListener("click", () => nodes ? stop() : play());
  sel.addEventListener("change", () => { if (nodes) { stop(); setTimeout(play, 320); } });
  onCleanup(stop);
}

function ragaTalaHTML(raga, tala) {
  const tl = TALAS.find(t => t[0] === tala);
  return `<div class="formgrid">
    <label class="f">Raga
      <select class="input" data-f="raga"><option value="">Not applicable</option>${RAGAS.map(r => `<option ${r === raga ? "selected" : ""}>${r}</option>`).join("")}</select></label>
    <label class="f">Tala
      <select class="input" data-f="tala" onchange="this.closest('.formgrid').querySelector('.talahint').textContent=(TALAS.find(t=>t[0]===this.value)||['',''])[1]"><option value="">Not applicable</option>${TALAS.map(([t]) => `<option ${t === tala ? "selected" : ""}>${t}</option>`).join("")}</select>
      <span class="hint talahint">${esc(tl ? tl[1] : "")}</span></label>
  </div>`;
}

function topicHTML() {
  return `<div data-topic>
    <div class="topic" data-tt>Tap “New topic” to get a surprise topic</div>
    <div class="row" style="margin-top:10px"><button type="button" class="btn ghost sm" data-act="new-topic">🎲 New topic</button>
    <span class="small muted">Think for 15 seconds, then speak.</span></div></div>`;
}
