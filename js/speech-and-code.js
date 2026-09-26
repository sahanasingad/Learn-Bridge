"use strict";
/* Timed speech studio and Python code runner */
/* ============================================================
   SPEECH STUDIO
   Shows the paragraph or topic, counts down a preparation time, then records
   (audio or video) for the speaking time and stops automatically when time
   is up. Uses browser speech recognition (Chrome, Edge) when available to
   show a transcript, speaking speed, filler words and reading accuracy.
   ============================================================ */
const FILLERS = ["um", "uh", "erm", "ah", "like", "basically", "actually", "literally", "so", "you know"];
const normWords = (s) => (s || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

function speechStudioHTML(o) {
  const prompts = o.prompts && o.prompts.length ? o.prompts : [o.paragraph || "Speak about the topic your mentor gave you."];
  return `<div class="speech" data-speech data-prep="${o.prep ?? 10}" data-speak="${o.speak ?? 60}" data-mode="${o.mode || "speak"}">
    <div class="prompt-card">
      <div class="row" style="justify-content:space-between"><span class="chip speaking">${o.mode === "read" ? "📄 Read this aloud" : "🎯 Speak on this"}</span>
        ${prompts.length > 1 ? `<button type="button" class="btn ghost sm" data-sp="next">🔀 Another one</button>` : ""}</div>
      <p class="prompt" data-sp="prompt" data-i="0">${esc(prompts[0])}</p>
      <script type="application/json" data-sp="prompts">${JSON.stringify(prompts).replace(/</g, "\\u003c")}</script>
    </div>
    <div class="speech-grid">
      <div class="sp-ring" data-sp="ring"><div><b data-sp="count">${o.prep ?? 10}</b><span data-sp="phase">Ready</span></div></div>
      <div style="flex:1;min-width:230px">
        <div class="formgrid">
          <label class="f">Preparation time (seconds)<input class="input" type="number" min="0" max="300" value="${o.prep ?? 10}" data-sp="prep"></label>
          <label class="f">Speaking time (seconds)<input class="input" type="number" min="5" max="600" value="${o.speak ?? 60}" data-sp="speak"></label>
        </div>
        <div class="row" style="margin-bottom:10px">
          <label class="mini">Record <select data-sp="media"><option value="audio">🎙️ Audio</option><option value="video">🎥 Video</option></select></label>
          <label class="mini">Accent <select data-sp="lang"><option value="en-IN">English (India)</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option></select></label>
        </div>
        <div class="row"><button type="button" class="btn" data-sp="start">▶ Start</button><button type="button" class="btn danger hide" data-sp="stop">■ Stop now</button><button type="button" class="btn ghost hide" data-sp="skip">Start speaking now</button></div>
        <p class="small muted" data-sp="status" style="margin:8px 0 0">Press Start. You get a short time to prepare, then the timer records you and stops automatically when time is up.</p>
      </div>
    </div>
    <video class="sp-video hide" data-sp="preview" muted playsinline></video>
    <div class="transcript hide" data-sp="live"></div>
    <div class="sp-result hide" data-sp="result"></div>
    <div class="row small" style="margin-top:10px">
      <span class="muted">Microphone or camera blocked?</span>
      <label class="linkbtn" style="cursor:pointer">🎥 Use phone camera<input type="file" accept="video/*" capture="user" class="hide" data-sp="file"></label>
      <label class="linkbtn" style="cursor:pointer">🎙️ Use phone recorder<input type="file" accept="audio/*" capture class="hide" data-sp="file"></label>
    </div>
  </div>`;
}

function mountSpeech(el) {
  const $s = (k) => $(`[data-sp="${k}"]`, el);
  const prompts = JSON.parse($s("prompts").textContent || "[]");
  const mode = el.dataset.mode;
  const st = { phase: "idle", stream: null, mr: null, chunks: [], rec: null, iv: null, t0: 0, transcript: "", interim: "", take: null, info: null };
  el._speech = st;
  const ring = $s("ring"), count = $s("count"), phaseEl = $s("phase"), status = $s("status");
  const btnStart = $s("start"), btnStop = $s("stop"), btnSkip = $s("skip");
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function setRing(v, total, label, cls) { count.textContent = Math.ceil(v); phaseEl.textContent = label; ring.style.setProperty("--p", total ? (1 - v / total) * 100 : 0); ring.className = "sp-ring " + (cls || ""); }
  function currentPrompt() { return $s("prompt").textContent; }
  $s("next")?.addEventListener("click", () => {
    if (st.phase !== "idle") return;
    const p = $s("prompt"); let i = (+p.dataset.i + 1) % prompts.length; p.dataset.i = i; p.textContent = prompts[i];
  });

  async function start() {
    if (st.phase !== "idle") return;
    const video = $s("media").value === "video";
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { status.textContent = "Recording is not supported here. Use the phone camera or recorder links below."; return; }
    try { st.stream = await navigator.mediaDevices.getUserMedia(video ? { audio: true, video: { facingMode: "user", width: { ideal: 1280 } } } : { audio: true }); }
    catch (e) { status.textContent = (video ? "Camera" : "Microphone") + " access was blocked. Allow it in the browser's address bar, or use the phone links below."; return; }
    const pv = $s("preview");
    if (video) { pv.srcObject = st.stream; pv.classList.remove("hide"); pv.play().catch(() => {}); } else pv.classList.add("hide");
    $s("result").classList.add("hide"); $s("live").classList.add("hide");
    btnStart.classList.add("hide"); btnStop.classList.remove("hide");
    const prep = Math.max(0, +$s("prep").value || 0);
    if (prep > 0) {
      st.phase = "prep"; btnSkip.classList.remove("hide");
      status.textContent = "Get ready. Recording starts when the countdown ends.";
      const end = Date.now() + prep * 1000;
      st.iv = setInterval(() => { const left = (end - Date.now()) / 1000; if (left <= 0) { clearInterval(st.iv); speak(); } else setRing(left, prep, "Get ready", "prep"); }, 100);
      setRing(prep, prep, "Get ready", "prep");
    } else speak();
  }
  function speak() {
    clearInterval(st.iv); btnSkip.classList.add("hide");
    st.phase = "speak"; Sound.beep(988, 0.15);
    const total = Math.max(5, +$s("speak").value || 60);
    const video = $s("media").value === "video", mime = pickMimeFor(video);
    st.chunks = [];
    st.mr = new MediaRecorder(st.stream, mime ? { mimeType: mime } : undefined);
    st.mr.ondataavailable = (e) => e.data.size && st.chunks.push(e.data);
    st.mr.onstop = finish;
    st.mr.start(250); st.t0 = Date.now();
    st.transcript = ""; st.interim = "";
    if (SR) {
      try {
        st.rec = new SR(); st.rec.lang = $s("lang").value; st.rec.continuous = true; st.rec.interimResults = true;
        st.rec.onresult = (e) => { let fin = "", inter = ""; for (let i = 0; i < e.results.length; i++) (e.results[i].isFinal ? (fin += e.results[i][0].transcript + " ") : (inter += e.results[i][0].transcript)); st.transcript = fin; st.interim = inter; const lv = $s("live"); lv.classList.remove("hide"); lv.innerHTML = `<b>Heard so far:</b> ${esc(fin)}<span class="muted">${esc(inter)}</span>`; };
        st.restarts = 0;
        st.rec.onend = () => { if (st.phase === "speak" && st.restarts++ < 30) setTimeout(() => { try { st.rec.start(); } catch (e) {} }, 250); };
        st.rec.start();
      } catch (e) { st.rec = null; }
    }
    status.innerHTML = `<span class="recdot"></span> Recording. It stops automatically when the timer reaches zero.`;
    const end = Date.now() + total * 1000;
    st.iv = setInterval(() => { const left = (end - Date.now()) / 1000; if (left <= 0) { clearInterval(st.iv); stopNow(true); } else setRing(left, total, left <= 5 ? "Finish up!" : "Speaking", left <= 5 ? "last" : "live"); }, 100);
    setRing(total, total, "Speaking", "live");
  }
  function stopNow(timeUp) {
    clearInterval(st.iv);
    if (st.phase === "prep") { cleanupStream(); reset("Stopped before recording started."); return; }
    if (st.phase !== "speak") return;
    st.phase = "stopping"; st.timeUp = !!timeUp;
    Sound.beep(660, 0.25);
    try { st.rec?.stop(); } catch (e) {}
    if (st.mr?.state === "recording") st.mr.stop();
  }
  function cleanupStream() { st.stream?.getTracks().forEach(t => t.stop()); st.stream = null; const pv = $s("preview"); pv.srcObject = null; pv.classList.add("hide"); }
  function reset(msg) { st.phase = "idle"; btnStart.classList.remove("hide"); btnStart.textContent = "↺ Try again"; btnStop.classList.add("hide"); btnSkip.classList.add("hide"); status.textContent = msg; setRing(+$s("prep").value || 0, 0, "Ready", ""); }
  function finish() {
    const secs = Math.round((Date.now() - st.t0) / 1000), video = $s("media").value === "video";
    const blob = new Blob(st.chunks, { type: st.mr.mimeType || (video ? "video/webm" : "audio/webm") });
    cleanupStream();
    setTimeout(() => { analyse(blob, secs, video); }, 400);   // give speech recognition a moment to deliver its last words
  }
  function analyse(blob, secs, video) {
    const heard = (st.transcript + " " + st.interim).trim(), words = normWords(heard);
    const wpm = secs > 3 && words.length ? Math.round(words.length / (secs / 60)) : null;
    const text = " " + words.join(" ") + " ";
    const fillers = FILLERS.reduce((n, f) => n + (text.split(" " + f + " ").length - 1), 0);
    let accuracy = null, marked = "";
    if (mode === "read" && words.length) {
      const bag = {}; words.forEach(w => bag[w] = (bag[w] || 0) + 1);
      const parts = currentPrompt().split(/(\s+)/); let total = 0, hit = 0;
      marked = parts.map(p => { const w = normWords(p)[0]; if (!w) return esc(p); total++; if (bag[w] > 0) { bag[w]--; hit++; return `<span class="w-ok">${esc(p)}</span>`; } return `<span class="w-miss">${esc(p)}</span>`; }).join("");
      accuracy = total ? Math.round(hit / total * 100) : null;
    }
    const ext = /mp4/.test(blob.type) ? ".mp4" : ".webm";
    st.take = { blob, name: (video ? "speech-video-" : "speech-audio-") + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-") + ext };
    st.info = { prompt: currentPrompt(), seconds: secs, words: words.length || null, wpm, fillers: words.length ? fillers : null, accuracy, transcript: heard, mode, timeUp: st.timeUp };
    el._onResult?.({ kind: "speech", score: accuracy ?? null, total: accuracy !== null ? 100 : null, seconds: secs, wpm });
    const url = URL.createObjectURL(blob);
    onCleanup(() => URL.revokeObjectURL(url));
    const res = $s("result");
    res.innerHTML = `<div class="row" style="justify-content:space-between"><b>${st.timeUp ? "⏰ Time's up! Recording stopped automatically." : "■ Recording stopped."}</b><span class="small muted">${mmss(secs)} recorded</span></div>
      ${video ? `<video controls playsinline src="${url}" class="sp-video"></video>` : `<audio controls src="${url}" style="width:100%;margin-top:8px"></audio>`}
      <div class="statrow" style="margin-top:10px">
        <div class="stat"><b>${mmss(secs)}</b><span class="small muted">length</span></div>
        <div class="stat"><b>${wpm ?? "–"}</b><span class="small muted">words per minute ${wpm ? (wpm < 110 ? "(slow)" : wpm > 170 ? "(fast)" : "(good pace)") : ""}</span></div>
        <div class="stat"><b>${words.length ? fillers : "–"}</b><span class="small muted">filler words</span></div>
        ${mode === "read" ? `<div class="stat"><b>${accuracy !== null ? accuracy + "%" : "–"}</b><span class="small muted">words read correctly</span></div>` : ""}
      </div>
      ${marked ? `<p class="small" style="margin:10px 0 4px"><b>Reading check</b> (green = heard, red = missed or unclear):</p><p class="marked-text">${marked}</p>` : ""}
      ${heard ? `<p class="small" style="margin:8px 0 0"><b>Transcript:</b> ${esc(heard)}</p>` : `<p class="small muted" style="margin:8px 0 0">${SR ? "No words were recognised. Speak closer to the microphone." : "Live transcript works in Chrome and Edge. Your recording is still saved."}</p>`}
      <div class="row small" style="margin-top:8px">✅ Attached to what you send your mentor.
        <button type="button" class="linkbtn" data-sp="dl">⬇ Download</button><button type="button" class="linkbtn" data-sp="discard" style="color:var(--danger)">Discard</button></div>`;
    res.classList.remove("hide"); $s("live").classList.add("hide");
    reset(st.timeUp ? "Time's up. Listen back, then try again or send it to your mentor." : "Stopped. Listen back, then try again or send it.");
  }
  btnStart.addEventListener("click", () => { Sound.init(); start(); });
  btnStop.addEventListener("click", () => stopNow(false));
  btnSkip.addEventListener("click", () => { if (st.phase === "prep") speak(); });
  el.addEventListener("click", (e) => {
    const a = e.target.closest("[data-sp]")?.dataset.sp;
    if (a === "dl" && st.take) offerDownload(st.take.name, st.take.blob);
    if (a === "discard") { st.take = null; st.info = null; $s("result").classList.add("hide"); }
  });
  $$(`[data-sp="file"]`, el).forEach(inp => inp.addEventListener("change", () => {
    const f = inp.files[0]; if (!f) return;
    st.take = { blob: f, name: f.name }; st.info = { prompt: currentPrompt(), seconds: null, mode, uploaded: true };
    const url = URL.createObjectURL(f), res = $s("result");
    res.innerHTML = `<b>📎 ${esc(f.name)}</b>${/^video/.test(f.type) ? `<video controls playsinline src="${url}" class="sp-video"></video>` : `<audio controls src="${url}" style="width:100%;margin-top:8px"></audio>`}<p class="small" style="margin:6px 0 0">✅ Attached to what you send your mentor. <button type="button" class="linkbtn" data-sp="discard" style="color:var(--danger)">Discard</button></p>`;
    res.classList.remove("hide");
  }));
  onCleanup(() => { clearInterval(st.iv); try { st.rec?.stop(); } catch (e) {} if (st.mr?.state === "recording") { st.mr.onstop = null; st.mr.stop(); } cleanupStream(); });
}
function pickMimeFor(video) {
  if (!window.MediaRecorder) return "";
  const list = video ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"] : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return list.find(m => MediaRecorder.isTypeSupported?.(m)) || "";
}

/* ============================================================
   PYTHON CODE STUDIO
   Real Python (Pyodide) running in a background worker, so a program that
   never ends can be stopped. The first run downloads Python (about 10 MB)
   from the jsDelivr CDN, so an internet connection is needed once.
   ============================================================ */
const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const PY_TIME_LIMIT = 10000;
const PY_WORKER = `
let py = null;
const boot = (async () => {
  importScripts(${JSON.stringify(PYODIDE_BASE)} + "pyodide.js");
  py = await loadPyodide({ indexURL: ${JSON.stringify(PYODIDE_BASE)} });
  self.postMessage({ type: "ready" });
})().catch(e => self.postMessage({ type: "loadfail", msg: String((e && e.message) || e) }));
function clean(msg) {
  const lines = String(msg || "").split("\\n");
  const i = lines.findIndex(l => l.includes('File "<exec>"'));
  const keep = i >= 0 ? ["Traceback (most recent call last):"].concat(lines.slice(i)) : lines.filter(l => !/_pyodide|\\/lib\\/python/.test(l));
  return keep.join("\\n").trim();
}
function lastLine(msg) { const l = String(msg || "").trim().split("\\n").filter(Boolean); return l[l.length - 1] || "Check failed"; }
self.onmessage = async (ev) => {
  const { id, code, stdin, check } = ev.data;
  await boot;
  if (!py) { self.postMessage({ type: "done", id, ok: false, error: "Python could not load." }); return; }
  const lines = stdin ? stdin.split("\\n") : []; let i = 0;
  py.setStdout({ batched: (s) => self.postMessage({ type: "out", id, text: s }) });
  py.setStderr({ batched: (s) => self.postMessage({ type: "err", id, text: s }) });
  py.setStdin({ stdin: () => (i < lines.length ? lines[i++] : null) });
  const ns = py.globals.get("dict")();
  let res;
  try { await py.loadPackagesFromImports(code); } catch (e) {}
  try {
    await py.runPythonAsync(code, { globals: ns });
    res = { type: "done", id, ok: true };
    if (check) { try { await py.runPythonAsync(check, { globals: ns }); res.check = { ok: true }; } catch (e) { res.check = { ok: false, msg: lastLine(e.message) }; } }
  } catch (e) { res = { type: "done", id, ok: false, error: clean(e.message) }; }
  try { ns.destroy(); } catch (e) {}
  self.postMessage(res);
};`;
const PyRunner = (() => {
  let worker = null, ready = null, seq = 0, loaded = false, rejReady = null;
  const pending = new Map();
  function start() {
    worker = new Worker(URL.createObjectURL(new Blob([PY_WORKER], { type: "text/javascript" })));
    ready = new Promise((res, rej) => {
      rejReady = rej;
      worker.onmessage = (e) => {
        const m = e.data;
        if (m.type === "ready") { loaded = true; res(); }
        else if (m.type === "loadfail") { rej(new Error(m.msg)); kill(); }
        else pending.get(m.id)?.(m);
      };
      worker.onerror = (e) => { rej(new Error(e.message || "Python worker failed")); kill(); };
    });
    ready.catch(() => {});
  }
  function ensure() { if (!worker) start(); return ready; }
  function kill() { if (!loaded) rejReady?.(new Error("loading was stopped")); rejReady = null; try { worker?.terminate(); } catch (e) {} worker = null; ready = null; loaded = false; for (const [id, fn] of pending) fn({ type: "done", id, ok: false, killed: true }); pending.clear(); }
  async function run(code, stdin, check, onOut) {
    await ensure();
    const id = ++seq;
    return new Promise((res) => {
      pending.set(id, (m) => { if (m.type === "done") { pending.delete(id); res(m); } else onOut(m); });
      worker.postMessage({ id, code, stdin, check: check || "" });
    });
  }
  return { ensure, run, kill, get loaded() { return loaded; } };
})();
const PY_TIPS = {
  SyntaxError: "Python could not read a line. Check for a missing colon (:), bracket, quote, or a line left unfinished like \"x = \".",
  IndentationError: "The spaces at the start of a line are wrong. Code inside if, for, def and class must be indented by 4 spaces.",
  NameError: "You used a name that does not exist yet. Check the spelling, and make sure the variable is created before it is used.",
  TypeError: "An operation got the wrong type of value, for example adding text to a number. Convert with int(), float() or str().",
  ValueError: "A value had the right type but a wrong value, for example int(\"abc\").",
  ZeroDivisionError: "You divided by zero. Check the value before dividing.",
  IndexError: "You asked for a list position that does not exist. Lists start at 0 and end at len(list) - 1.",
  KeyError: "That key is not in the dictionary. Check the spelling or use dict.get(key).",
  AttributeError: "That object does not have this attribute or method. Check the spelling and that it was set in __init__.",
  EOFError: "Your program called input() but there was nothing left in the Input box. Add one value per line.",
  AssertionError: "A check did not pass. Read the message and compare it with the task."
};

function codeStudioHTML(o) {
  const code = o.code ?? "";
  return `<div class="code-studio" data-code>
    <div class="cs-bar">
      <button type="button" class="btn ok sm" data-c="run">▶ Run</button>
      ${o.check ? `<button type="button" class="btn sm" data-c="check">✔ Check my answer</button>` : ""}
      <button type="button" class="btn danger sm hide" data-c="stop">■ Stop</button>
      <button type="button" class="btn ghost sm" data-c="reset">↺ Reset code</button>
      <span class="spacer"></span><span class="small muted" data-c="status">Ctrl + Enter to run</span>
    </div>
    <div class="editor"><pre class="gutter" aria-hidden="true" data-c="gutter"></pre><textarea class="code-ta" data-f="code" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" aria-label="Python code editor">${esc(code)}</textarea></div>
    <script type="text/plain" data-c="orig">${esc(o.starter ?? code)}</script>
    <details class="stdin" ${o.stdin ? "open" : ""}><summary class="small">⌨️ Input for input() (one value per line)</summary><textarea class="input" data-c="stdin" rows="3" placeholder="Values your program reads with input()">${esc(o.stdin || "")}</textarea></details>
    <div class="console" data-c="out" aria-live="polite"><span class="muted">Output appears here after you press Run.</span></div>
    <div data-c="checkres"></div>
  </div>`;
}
function mountCode(el, check) {
  const ta = $("textarea.code-ta", el), gutter = $("[data-c=gutter]", el), out = $("[data-c=out]", el), status = $("[data-c=status]", el);
  const st = { lastRun: null, check: check || "" };
  el._code = st;
  const decode = (s) => { const t = document.createElement("textarea"); t.innerHTML = s; return t.value; };
  const orig = decode($("[data-c=orig]", el).innerHTML);
  function paintGutter(errLine) { const n = ta.value.split("\n").length; gutter.innerHTML = Array.from({ length: n }, (_, i) => `<span class="${i + 1 === errLine ? "err" : ""}">${i + 1}</span>`).join("\n"); gutter.scrollTop = ta.scrollTop; }
  paintGutter();
  ta.addEventListener("input", () => paintGutter());
  ta.addEventListener("scroll", () => gutter.scrollTop = ta.scrollTop);
  ta.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); go(false); return; }
    if (e.key === "Tab") { e.preventDefault(); const s = ta.selectionStart; if (e.shiftKey) { const ls = ta.value.lastIndexOf("\n", s - 1) + 1; if (ta.value.slice(ls, ls + 4) === "    ") { ta.setRangeText("", ls, ls + 4, "end"); } } else ta.setRangeText("    ", s, ta.selectionEnd, "end"); paintGutter(); }
    if (e.key === "Enter") {
      const s = ta.selectionStart, ls = ta.value.lastIndexOf("\n", s - 1) + 1, line = ta.value.slice(ls, s);
      let ind = line.match(/^\s*/)[0]; if (/:\s*$/.test(line)) ind += "    ";
      e.preventDefault(); ta.setRangeText("\n" + ind, s, ta.selectionEnd, "end"); paintGutter();
    }
  });
  function write(text, cls) { const s = document.createElement("span"); if (cls) s.className = cls; s.textContent = text; out.appendChild(s); out.scrollTop = out.scrollHeight; }
  let running = false, killTimer = null;
  async function go(withCheck) {
    if (running) return;
    running = true; out.innerHTML = ""; $("[data-c=checkres]", el).innerHTML = ""; paintGutter();
    $("[data-c=stop]", el).classList.remove("hide");
    status.textContent = PyRunner.loaded ? "Running…" : "Loading Python (first run only, needs internet)…";
    const t0 = performance.now(); let text = "";
    killTimer = setTimeout(() => { PyRunner.kill(); }, PY_TIME_LIMIT + (PyRunner.loaded ? 0 : 60000));
    let m;
    try {
      m = await PyRunner.run(ta.value, $("[data-c=stdin]", el).value, withCheck ? st.check : "", (msg) => { text += msg.text + "\n"; write(msg.text + "\n", msg.type === "err" ? "c-err" : ""); });
    } catch (err) {
      m = { ok: false, error: "Python could not start here (" + err.message + ").\nRunning code needs an internet connection the first time, because the browser downloads Python from cdn.jsdelivr.net. If this page is open inside the Claude app, use the VS Code version (Live Server) to run code; you can still write code and send it to your mentor here.", loadfail: true };
    }
    clearTimeout(killTimer); running = false; $("[data-c=stop]", el).classList.add("hide");
    const ms = Math.round(performance.now() - t0);
    if (m.killed) { m = { ok: false, error: "⏱ Stopped: the program ran for more than " + PY_TIME_LIMIT / 1000 + " seconds. Is there a loop that never ends, or an input() waiting for a value?" }; }
    if (!m.ok) {
      write((text ? "\n" : "") + m.error + "\n", "c-err");
      const lastL = m.error.trim().split("\n").pop() || "", type = (lastL.match(/^(\w+)/) || [])[1];
      const lines = [...m.error.matchAll(/File "<exec>", line (\d+)/g)]; const errLine = lines.length ? +lines[lines.length - 1][1] : null;
      if (errLine) paintGutter(errLine);
      if (type && PY_TIPS[type]) write("\n💡 " + PY_TIPS[type] + (errLine ? " (look at line " + errLine + ")" : "") + "\n", "c-tip");
      status.textContent = "Error" + (errLine ? " on line " + errLine : "");
    } else {
      if (!text) write("(Program finished with no output. Use print() to show results.)\n", "muted");
      status.textContent = "Finished in " + (ms / 1000).toFixed(2) + " s";
    }
    st.lastRun = { output: (text + (m.ok ? "" : m.error)).slice(0, 6000), ok: !!m.ok, error: m.ok ? "" : m.error, at: Date.now(), check: null };
    if (withCheck) {
      const box = $("[data-c=checkres]", el);
      const passed = m.ok && m.check?.ok;
      st.lastRun.check = { ok: !!passed, msg: passed ? "" : (m.ok ? m.check?.msg : "Fix the error first, then check again.") };
      box.innerHTML = passed ? `<div class="check ok">✅ All checks passed. Great work! Send it to your mentor for review.</div>` : `<div class="check bad">❌ Not yet: ${esc(st.lastRun.check.msg || "")}</div>`;
      el._onResult?.({ kind: "check", score: passed ? 1 : 0, total: 1 });
    }
  }
  el.addEventListener("click", (e) => {
    const a = e.target.closest("[data-c]")?.dataset.c;
    if (a === "run") go(false);
    if (a === "check") go(true);
    if (a === "stop") { clearTimeout(killTimer); PyRunner.kill(); }
    if (a === "reset" && confirm("Replace your code with the starting code?")) { ta.value = orig; paintGutter(); }
  });
  PyRunner.ensure()?.catch(() => {});   // start downloading Python in the background
}
