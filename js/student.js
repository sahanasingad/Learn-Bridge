"use strict";
/* Student portal */
/* ============================================================
   STUDENT PORTAL
   ============================================================ */
let learnTab = "music";
function taskChip(t) { const map = { assigned: ["pending", "To do"], submitted: ["", "Sent, waiting for review"], reviewed: ["active", "Reviewed"] }; const [c, l] = map[t.status] || ["", t.status]; return `<span class="chip ${c}">${l}</span>`; }
function studentMs(s) { return db().mentorships.filter(m => m.studentId === s.id); }

function viewStudentHome(s) {
  const d = db(), mss = studentMs(s).sort((a, b) => b.updatedAt - a.updatedAt);
  const activeIds = mss.filter(m => m.status === "active").map(m => m.id);
  const todo = d.tasks.filter(t => activeIds.includes(t.mentorshipId) && t.status === "assigned").sort((a, b) => b.createdAt - a.createdAt);
  const subs = d.submissions.filter(x => mss.some(m => m.id === x.mentorshipId));
  const reviewed = subs.filter(x => x.reviewedAt).sort((a, b) => b.reviewedAt - a.reviewedAt);
  const scores = reviewed.map(x => x.score).filter(n => typeof n === "number");
  const mats = d.materials.filter(mt => mt.mentorshipIds.some(id => mss.some(m => m.id === id))).sort((a, b) => b.createdAt - a.createdAt);
  const mins = Math.round((subs.reduce((a, x) => a + (x.practiceSeconds || 0), 0) + d.practice.filter(p => p.studentId === s.id).reduce((a, p) => a + (p.seconds || 0), 0)) / 60);
  const c = CATS[learnTab];
  return `<section class="section">
      <h1>Hi ${esc(s.name.split(" ")[0])} 👋</h1>
      <div class="statrow">
        <div class="stat"><b>${activeIds.length}</b><span class="small muted">active mentors</span></div>
        <div class="stat"><b>${todo.length}</b><span class="small muted">tasks from mentors</span></div>
        <div class="stat"><b>${mins}</b><span class="small muted">minutes practised</span></div>
        <div class="stat"><b>${scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "–"}</b><span class="small muted">average score / 10</span></div>
      </div>
    </section>
    <section class="section">
      <h2>What you can learn</h2>
      <p class="muted">Pick a subject, then a topic. Each topic has a short lesson and exercises you can practise and send to a mentor for review.</p>
      <div class="tabs" role="tablist">${Object.values(CATS).map(x => `<button class="tab ${x.key === learnTab ? "on" : ""}" data-act="learn-tab" data-cat="${x.key}" role="tab" aria-selected="${x.key === learnTab}">${x.emoji} ${esc(x.short || x.name)} <span class="muted">(${topicsOf(x.key).length})</span></button>`).join("")}</div>
      <p class="small muted" style="margin-top:-4px">${esc(c.blurb)}</p>
      <div class="topics">${topicsOf(learnTab).map(t => `<a class="topic-card" href="#/s/learn/${t.id}"><span class="te">${t.emoji}</span><span class="chip ${t.cat}" style="align-self:flex-start">${esc(t.level)}</span><h3>${esc(t.name)}</h3><p>${esc(t.summary)}</p><span class="go">${t.ex.length} exercises, start learning</span></a>`).join("")}</div>
    </section>
    <section class="panel section">
      <h2>My learning progress</h2>
      <p class="small muted">Exercises, code checks and timed speeches you have completed, plus mentor scores.</p>
      ${progressHTML(s.id)}
    </section>
    <div class="split section">
      <section class="panel">
        <h2>Tasks from your mentors</h2>
        ${todo.length ? `<div class="list">${todo.map(t => { const m = getMentor(getMs(t.mentorshipId).mentorId); return `<a class="item" href="#/s/task/${t.id}" style="text-decoration:none;color:inherit;display:block"><div class="row" style="justify-content:space-between"><h4>${CATS[t.category].emoji} ${esc(t.title)}</h4><span class="chip">${esc(t.kind)}</span></div><p class="small muted" style="margin:0">From ${esc(m?.name)}, ${ago(t.createdAt)}</p></a>`; }).join("")}</div>`
          : `<div class="empty">No tasks waiting. Choose a topic above and send your work to a mentor.</div>`}
        <h2 style="margin-top:24px">Latest feedback</h2>
        ${reviewed.length ? `<div class="list">${reviewed.slice(0, 4).map(x => { const t = getTask(x.taskId); return `<a class="item" href="#/s/task/${x.taskId}" style="text-decoration:none;color:inherit;display:block"><h4>${esc(t?.title)} <span class="chip active">${x.score}/10</span></h4><p class="small" style="margin:0">${esc((x.feedback?.next || x.feedback?.good || "").slice(0, 140))}</p></a>`; }).join("")}</div>` : `<div class="empty">Mentor feedback on your work shows up here.</div>`}
        <h2 style="margin-top:24px">Notes & media from mentors</h2>
        ${mats.length ? `<div class="list">${mats.slice(0, 5).map(mt => `<a class="item" href="#/s/ms/${mt.mentorshipIds.find(id => mss.some(m => m.id === id))}" style="text-decoration:none;color:inherit;display:block"><h4>📎 ${esc(mt.title)}</h4><p class="small muted" style="margin:0">${esc(getMentor(mt.mentorId)?.name)}, ${ago(mt.createdAt)}, ${mt.files.length} file${mt.files.length === 1 ? "" : "s"}</p></a>`).join("")}</div>` : `<div class="empty">Photos, notes and recordings your mentors share appear here.</div>`}
      </section>
      <aside class="panel" style="align-self:start">
        <h2>My mentors</h2>
        ${mss.length ? `<div class="list">${mss.map(ms => { const m = getMentor(ms.mentorId); const t = TOPIC(ms.topicId); return `<a class="item" href="#/s/ms/${ms.id}" style="text-decoration:none;color:inherit;display:flex;gap:12px;align-items:center">${avatar(m)}<div style="min-width:0"><h4>${esc(m?.name)}</h4><div class="row" style="gap:6px">${statusChip(ms.status)}<span class="chip ${ms.category}">${t ? t.emoji + " " + esc(t.name) : esc(catName(ms.category))}</span></div></div></a>`; }).join("")}</div>` : `<div class="empty">No mentors yet. Open a topic and book one at the bottom of the page.</div>`}
      </aside>
    </div>`;
}

function lessonHTML(t) {
  return `<div class="panel flat"><h3>📘 Lesson: key points</h3><ul class="keypoints">${t.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
    <p class="small" style="margin:10px 0 0"><b>Further reading:</b> ${REFS[t.cat].map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(n)}</a>`).join(", ")}</p></div>`;
}

function viewTopic(s, id) {
  const t = TOPIC(id); if (!t) return `<div class="empty section">Topic not found.</div>`;
  const ms = db().mentors.filter(m => m.category === t.cat).sort((a, b) => ((b.topics || []).includes(id) ? 1 : 0) - ((a.topics || []).includes(id) ? 1 : 0));
  const mine = studentMs(s).filter(x => x.category === t.cat && x.status === "active");
  return `<div class="section">
      <div class="row" style="gap:8px"><span class="chip ${t.cat}">${CATS[t.cat].emoji} ${esc(catName(t.cat))}</span><span class="chip">${esc(t.level)}</span></div>
      <h1 style="margin-top:8px">${t.emoji} ${esc(t.name)}</h1>
      <p style="max-width:72ch;font-size:1.05rem">${esc(t.about)}</p>
    </div>
    ${lessonHTML(t)}
    <h2 style="margin-top:26px">Exercises</h2>
    <p class="muted small">Choose one, work on it, then send it to ${mine.length ? "your mentor" : "a mentor"}. Your mentor points out mistakes and guides you.</p>
    <div class="list">${t.ex.map((e, i) => `<a class="item" href="#/s/ex/${e.id}" style="text-decoration:none;color:inherit;display:block">
      <div class="row" style="justify-content:space-between"><h4>${i + 1}. ${esc(e.title)}</h4><span class="row" style="gap:6px">${bestChip(s.id, e)}<span class="chip ${t.cat}">${esc(e.kind)}</span></span></div>
      <p class="small" style="margin:0 0 6px">${esc(e.desc)}</p><span class="small" style="font-weight:700;color:var(--violet)">${e.free ? "Open" : e.drill ? "Start exercise" : e.cat === "speaking" ? "Start timed practice" : e.check ? "Solve and check" : "Start"}</span></a>`).join("")}</div>
    <h2 style="margin-top:34px" id="mentors">Mentors for ${esc(catName(t.cat))}</h2>
    <p class="muted small">${mine.length ? "You already have a mentor for this subject. You can book another as well." : "Book a mentor so you can send your exercises for review."}</p>
    <div class="grid g2">${ms.map(m => {
      const ex = db().mentorships.find(x => x.studentId === s.id && x.mentorId === m.id && (x.status === "pending" || x.status === "active"));
      const teaches = (m.topics || []).includes(id);
      return mentorCard(m, { badge: teaches ? `<span class="chip active" style="align-self:flex-start">✓ Teaches ${esc(t.name)}</span>` : "", action: ex ? `<a class="btn sm ok" href="#/s/ms/${ex.id}">${ex.status === "active" ? "Your mentor" : "Request sent"}</a>` : `<button class="btn sm" data-act="request" data-id="${m.id}" data-topic="${id}">Book this mentor</button>` });
    }).join("")}</div>`;
}

function openRequestModal(mentorId, topicId) {
  const s = session.get("student"), m = getMentor(mentorId);
  if (!s) { go("/s/login"); return; }
  const ex = db().mentorships.find(x => x.studentId === s.id && x.mentorId === m.id && (x.status === "pending" || x.status === "active"));
  if (ex) { toast("You already have a " + ex.status + " booking with " + m.name + "."); go("/s/ms/" + ex.id); return; }
  const tops = topicsOf(m.category).sort((a, b) => ((m.topics || []).includes(b.id) ? 1 : 0) - ((m.topics || []).includes(a.id) ? 1 : 0));
  modal(`<h2>Book ${esc(m.name)}</h2>
    <p class="small muted">${CATS[m.category].emoji} ${esc(CATS[m.category].name)}, ${m.mode === "online" ? "online" : "offline"}, ${esc(m.availability)}</p>
    <form data-form="request" data-id="${m.id}">
      <label class="f">What do you want to learn?
        <select class="input" name="topic">${tops.map(t => `<option value="${t.id}" ${t.id === topicId ? "selected" : ""}>${t.emoji} ${esc(t.name)}${(m.topics || []).includes(t.id) ? "" : " (not a main topic)"}</option>`).join("")}</select></label>
      <label class="f">Preferred class time<input class="input" name="slot" placeholder="e.g. Saturday 5 pm"></label>
      <label class="f">What problem are you facing?<textarea class="input" name="message" required placeholder="e.g. I lose pitch on higher notes / I freeze when speaking / loops confuse me"></textarea></label>
      <p class="err" data-err></p>
      <div class="row"><button class="btn" type="submit">Send booking request</button><button class="btn ghost" type="button" data-act="close-modal">Cancel</button></div>
    </form>`);
}
function handleRequest(form) {
  const s = session.get("student"), m = getMentor(form.dataset.id), f = Object.fromEntries(new FormData(form).entries());
  if (!f.message.trim()) { $("[data-err]", form).textContent = "Tell your mentor a little about what you need."; return; }
  const t = TOPIC(f.topic);
  const ms = { id: uid("ms"), studentId: s.id, mentorId: m.id, category: m.category, topicId: t.id, focus: t.name, slot: f.slot.trim(), message: f.message.trim(), status: "pending", createdAt: Date.now(), updatedAt: Date.now() };
  db().mentorships.push(ms);
  notify("mentor", m.id, `🔔 New booking from ${s.name}: ${t.name}`, "/m/s/" + ms.id);
  save(); closeModal(); toast("Booking sent. " + m.name.split(" ")[0] + " has been notified.");
  go("/s/ms/" + ms.id);
}

/* ---------- workspace (used for exercises and mentor tasks) ---------- */
function workspaceOpts(cat, topicId, ex, task, lastCode) {
  if (cat === "music") return { topicId, ex };
  if (cat === "speaking") return { prompts: ex?.prompts || [task?.paragraph || task?.desc || ""], mode: ex?.mode || task?.mode || "speak", prep: ex?.prep ?? task?.prep ?? 10, speak: ex?.speak ?? task?.speak ?? 60 };
  const starter = ex?.starter ?? task?.starter ?? "";
  return { code: lastCode ?? starter, starter, stdin: ex?.stdin || "", check: ex?.check || "" };
}
function workspaceHTML(cat, o = {}) {
  const parts = [];
  if (cat === "music") {
    const inst = INSTRUMENT_OF(o.topicId);
    parts.push(`<div class="panel flat"><h3>${TOPIC(inst)?.emoji || "🎵"} ${esc(INSTRUMENTS[inst])} studio</h3>${studioHTML(inst, o.ex && o.ex.drill ? o.ex : null)}</div>`);
    parts.push(`<details class="panel flat"><summary style="cursor:pointer;font-weight:700">🎙️ Playing a real ${esc(INSTRUMENTS[inst].toLowerCase())}? Record it with your microphone or camera</summary><div style="margin-top:12px">${recorderHTML("w")}</div></details>`);
  } else if (cat === "speaking") {
    parts.push(`<div class="panel flat"><h3>🎤 Timed speaking practice</h3>${speechStudioHTML(o)}</div>`);
  } else {
    parts.push(`<div class="panel flat"><h3>🐍 Python editor</h3>${codeStudioHTML(o)}</div>`);
  }
  parts.push(`<div class="panel flat"><h3>📝 Notes for your mentor</h3><textarea class="input" data-f="notes" placeholder="${cat === "python" ? "What you tried, what the error said, where you got stuck" : "What went well, what felt hard, questions for your mentor"}">${esc(o.notes || "")}</textarea>
    <div class="row" style="margin-top:10px">${filesHTML("w", "Attach photos, notes or files")}</div></div>`);
  return `<div class="grid" style="gap:14px">${parts.join("")}</div>`;
}
function recordResult(r) {
  const s = session.get("student"); if (!s || r.noRecord) return;
  db().results.push({ id: uid("r"), studentId: s.id, topicId: r.topicId || null, exId: r.exId || null, kind: r.kind, score: r.score, total: r.total, seconds: r.seconds || null, wpm: r.wpm || null, createdAt: Date.now() });
  save();
}
function mountAll(ctx = {}) {
  onMount(() => {
    $$("[data-timer]").forEach(mountTimer);
    $$("[data-rec]").forEach(mountRecorder);
    $$("[data-pitch]").forEach(mountPitch);
    $$("[data-files]").forEach(mountFiles);
    $$("[data-studio]").forEach(el => { el._onResult = (r) => recordResult({ ...ctx, ...r }); mountStudio(el); });
    $$("[data-speech]").forEach(el => { el._onResult = (r) => recordResult({ ...ctx, ...r }); mountSpeech(el); });
    $$("[data-code]").forEach(el => { el._onResult = (r) => recordResult({ ...ctx, ...r }); mountCode(el, ctx.check); });
    $$("textarea.code").forEach(ta => ta.addEventListener("keydown", e => { if (e.key === "Tab") { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText("    ", s, ta.selectionEnd, "end"); } }));
  });
  hydrateMedia();
}
function readWorkspace(root = document) {
  const r = $("[data-rec]", root)?._rec, fl = $("[data-files=w]", root)?._files || [];
  const studio = $("[data-studio]", root)?._studio, speech = $("[data-speech]", root)?._speech, code = $("[data-code]", root)?._code;
  const take = studio?.take || speech?.take || null;
  return {
    seconds: studio ? Math.max(studio.playedSeconds, studio.take?.seconds || 0) : speech?.info?.seconds || 0,
    rec: r?.blob ? { blob: r.blob, name: r.name || "recording.webm" } : null, take, files: fl.slice(),
    drill: studio?.drillResult || null, speech: speech?.info || null, run: code?.lastRun || null,
    code: $("[data-f=code]", root)?.value || "", notes: $("[data-f=notes]", root)?.value.trim() || ""
  };
}
const hasWork = (w) => !!(w.rec || w.take || w.files.length || w.code.trim() || w.notes || w.drill);
async function saveWorkMedia(w, owner) {
  const recId = w.rec ? await storeFile(w.rec.blob, w.rec.name, owner) : null;
  const takeId = w.take ? await storeFile(w.take.blob, w.take.name, owner) : null;
  const files = await storeFiles(w.files, owner);
  return { recId, files: takeId ? [takeId, ...files] : files };
}

/* ---------- learning progress (student dashboard and mentor view) ---------- */
function progressHTML(studentId, cat) {
  const res = db().results.filter(r => r.studentId === studentId);
  const subs = db().submissions.filter(x => x.studentId === studentId);
  const tops = TOPICS.filter(t => (!cat || t.cat === cat) && (res.some(r => r.topicId === t.id) || subs.some(x => getTask(x.taskId)?.topicId === t.id)));
  if (!tops.length) return `<div class="empty">No practice yet. Results from exercises, code checks and timed speeches appear here.</div>`;
  return `<div class="list">${tops.map(t => {
    const r = res.filter(x => x.topicId === t.id), graded = t.ex.filter(e => e.drill || e.check);
    const doneEx = new Set(r.filter(x => x.kind === "drill" || (x.kind === "check" && x.score === 1)).map(x => x.exId));
    const drills = r.filter(x => x.kind === "drill"), best = {};
    drills.forEach(x => best[x.exId] = Math.max(best[x.exId] || 0, x.score / x.total));
    const bestAvg = Object.values(best).length ? Math.round(Object.values(best).reduce((a, b) => a + b, 0) / Object.values(best).length * 100) : null;
    const speeches = r.filter(x => x.kind === "speech"), checksPassed = new Set(r.filter(x => x.kind === "check" && x.score === 1).map(x => x.exId)).size;
    const sent = subs.filter(x => getTask(x.taskId)?.topicId === t.id), scored = sent.filter(x => typeof x.score === "number");
    const pct = graded.length ? Math.round(doneEx.size / graded.length * 100) : Math.min(100, speeches.length * 20);
    const bits = [];
    if (t.cat === "music") bits.push(`${Object.keys(best).length}/${graded.length} exercises done`, bestAvg !== null ? `best scores average ${bestAvg}%` : "");
    if (t.cat === "python") bits.push(`${checksPassed}/${graded.length} problems passed`);
    if (t.cat === "speaking") { const w = speeches.filter(x => x.wpm).map(x => x.wpm); bits.push(`${speeches.length} timed speech${speeches.length === 1 ? "" : "es"}`, w.length ? `pace ${Math.round(w.reduce((a, b) => a + b, 0) / w.length)} wpm` : ""); }
    bits.push(`${sent.length} sent to mentor`, scored.length ? `mentor average ${(scored.reduce((a, x) => a + x.score, 0) / scored.length).toFixed(1)}/10` : "");
    return `<div class="item"><div class="row" style="justify-content:space-between"><h4>${t.emoji} ${esc(t.name)}</h4><span class="small muted">${pct}%</span></div>
      <div class="progress" style="margin:6px 0"><i style="width:${pct}%"></i></div><p class="small muted" style="margin:0">${bits.filter(Boolean).join(" · ")}</p></div>`;
  }).join("")}</div>`;
}
function bestChip(studentId, e) {
  const r = db().results.filter(x => x.studentId === studentId && x.exId === e.id);
  if (!r.length) return "";
  if (e.drill) { const b = Math.max(...r.filter(x => x.kind === "drill").map(x => x.score)); return isFinite(b) ? `<span class="chip active">Best ${b}/${e.questions || 10}</span>` : ""; }
  if (e.check) return r.some(x => x.kind === "check" && x.score === 1) ? `<span class="chip active">✓ Passed</span>` : `<span class="chip pending">Tried</span>`;
  const sp = r.filter(x => x.kind === "speech").length; return sp ? `<span class="chip active">${sp} attempt${sp === 1 ? "" : "s"}</span>` : "";
}

/* ---------- one piece of submitted work, with mentor feedback ---------- */
function subHTML(x, forMentor) {
  const bits = [];
  if (x.drill) bits.push(`<p class="small" style="margin:0 0 4px"><span class="chip music">🎯 ${esc(x.drill.title)}: ${x.drill.score}/${x.drill.total}</span></p>`);
  if (x.speech) { const s = x.speech; bits.push(`<div class="note small" style="margin-bottom:6px"><b>${s.mode === "read" ? "Read aloud" : "Spoke on"}:</b> ${esc(s.prompt || "")}<br>${[s.seconds ? "Length " + mmss(s.seconds) : "", s.wpm ? s.wpm + " words/min" : "", s.fillers !== null && s.fillers !== undefined ? s.fillers + " filler words" : "", s.accuracy !== null && s.accuracy !== undefined ? s.accuracy + "% words read correctly" : "", s.timeUp ? "stopped by timer" : ""].filter(Boolean).join(" · ")}${s.transcript ? `<br><span class="muted">Transcript: ${esc(s.transcript)}</span>` : ""}</div>`); }
  if (x.practiceSeconds && !x.speech) bits.push(`<p class="small" style="margin:0 0 4px"><b>Practice time:</b> ${mmss(x.practiceSeconds)}</p>`);
  if (x.notes) bits.push(`<p class="small" style="margin:0 0 4px"><b>Student notes:</b> ${nl2br(x.notes)}</p>`);
  if (x.code) bits.push(`<pre class="code">${esc(x.code)}</pre>`);
  if (x.run) bits.push(`<details class="small"><summary style="cursor:pointer"><b>Last run:</b> ${x.run.ok ? "✅ ran without errors" : "❌ ended with an error"}${x.run.check ? (x.run.check.ok ? " · ✅ checks passed" : " · ❌ checks not passed") : ""}</summary><pre class="console small-console">${esc(x.run.output || "(no output)")}</pre></details>`);
  const media = [x.recId, ...(x.files || [])].filter(Boolean);
  if (media.length) bits.push(mediaListHTML(media));
  let fb = "";
  if (x.reviewedAt) {
    const f = x.feedback || {};
    fb = `<div style="margin-top:10px"><b class="small">Mentor feedback: ${x.score}/10</b> <span class="small muted">${fmtDate(x.reviewedAt)}</span>
      <div class="fb-grid">${f.good ? `<div class="fb good small"><b>✅ What went well</b>${nl2br(f.good)}</div>` : ""}${f.mistakes ? `<div class="fb bad small"><b>⚠️ Mistakes found</b>${nl2br(f.mistakes)}</div>` : ""}${f.next ? `<div class="fb next small"><b>➡️ How to improve</b>${nl2br(f.next)}</div>` : ""}</div>
      ${f.code ? `<p class="small" style="margin:8px 0 0"><b>🛠️ Corrected code from your mentor:</b></p><pre class="code">${esc(f.code)}</pre>` : ""}
      ${(x.fbMedia || []).length ? `<p class="small" style="margin:8px 0 0"><b>Files and recordings from the mentor:</b></p>${mediaListHTML(x.fbMedia)}` : ""}</div>`;
  } else fb = forMentor ? `<div class="row" style="margin-top:10px"><a class="btn ok sm" href="#/m/review/${x.id}">🔍 Review and give feedback</a></div>` : `<p class="small muted" style="margin:8px 0 0">⏳ Waiting for your mentor's review.</p>`;
  return `<div class="item"><p class="small muted" style="margin:0 0 6px">Sent ${fmtDate(x.createdAt)}</p>${bits.join("")}${fb}</div>`;
}

/* ---------- exercise page ---------- */
function viewExercise(s, exId) {
  const e = EXERCISE(exId); if (!e) return `<div class="empty section">Exercise not found.</div>`;
  const t = TOPIC(e.topicId);
  const active = studentMs(s).filter(m => m.category === e.cat && m.status === "active");
  const sentTasks = db().tasks.filter(x => x.exId === exId && studentMs(s).some(m => m.id === x.mentorshipId));
  const sent = sentTasks.flatMap(x => taskSubs(x.id));
  const saves = db().practice.filter(p => p.studentId === s.id && p.exId === exId).sort((a, b) => b.createdAt - a.createdAt);
  mountAll({ topicId: t.id, exId, check: e.check });
  const idx = t.ex.indexOf(e), nextE = t.ex[idx + 1];
  return `<div class="section">
      <div class="row" style="gap:8px"><a class="chip ${e.cat}" href="#/s/learn/${t.id}" style="text-decoration:none">${t.emoji} ${esc(t.name)}</a><span class="chip">${esc(e.kind)}</span>${bestChip(s.id, e)}</div>
      <h1 style="margin-top:8px;font-size:clamp(1.7rem,4vw,2.4rem)">${esc(e.title)}</h1>
      <p style="max-width:70ch">${esc(e.desc)}</p>
    </div>
    <details class="panel flat" style="margin-bottom:14px"><summary style="cursor:pointer;font-weight:700">📘 About ${esc(t.name)} and key points</summary><p class="small" style="margin-top:10px">${esc(t.about)}</p><ul class="keypoints">${t.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul></details>
    ${workspaceHTML(e.cat, workspaceOpts(e.cat, t.id, e, null))}
    <div class="panel" style="margin:16px 0">
      <h3>Send your work</h3>
      <p class="small muted">${e.cat === "music" ? "Your recording, exercise score and notes are sent together." : e.cat === "speaking" ? "Your timed recording, its transcript and statistics, and your notes are sent together." : "Your code, its last output and check result, and your notes are sent together."}</p>
      ${active.length ? `<div class="row"><select class="input" id="send-ms" style="width:auto;margin:0">${active.map(ms => `<option value="${ms.id}">To ${esc(getMentor(ms.mentorId).name)}</option>`).join("")}</select>
        <button class="btn" data-act="send-ex" data-id="${exId}">📤 Send to mentor for review</button></div>`
        : `<p class="small">You need a mentor for ${esc(catName(e.cat))} to get this reviewed. <a href="#/s/learn/${t.id}">Book one at the bottom of the topic page</a>. You can still save your work for yourself.</p>`}
      <div class="row" style="margin-top:12px">
        <button class="btn ghost" data-act="save-ex" data-id="${exId}">💾 Save for myself</button>
        <button class="btn ghost" data-act="notes-now" data-id="${exId}">📄 View session notes</button>
        ${nextE ? `<a class="btn ghost" style="white-space:normal;text-align:left" href="#/s/ex/${nextE.id}">Next: ${esc(nextE.title)} →</a>` : ""}
      </div>
    </div>
    ${sent.length ? `<h2>Sent to your mentor</h2><div class="list">${sent.map(x => subHTML(x, false)).join("")}</div>` : ""}
    ${saves.length ? `<h2 style="margin-top:22px">Saved for yourself</h2><div class="list">${saves.map(p => `<div class="item"><div class="row" style="justify-content:space-between"><h4>${fmtDate(p.createdAt)}${p.seconds ? ", " + mmss(p.seconds) : ""}</h4><button class="btn ghost sm" data-act="notes-practice" data-id="${p.id}">📄 Notes</button></div>${p.drill ? `<span class="chip music">🎯 ${p.drill.score}/${p.drill.total}</span>` : ""}${p.notes ? `<p class="small" style="margin:6px 0 0">${nl2br(p.notes)}</p>` : ""}${p.code ? `<pre class="code">${esc(p.code)}</pre>` : ""}${mediaListHTML([p.recId, ...(p.files || [])].filter(Boolean))}</div>`).join("")}</div>` : ""}`;
}
async function sendExercise(exId, btn) {
  const s = session.get("student"), e = EXERCISE(exId), w = readWorkspace();
  if (!hasWork(w)) { toast(e.cat === "music" ? "Record a take, finish an exercise or add notes before sending." : e.cat === "speaking" ? "Do a timed recording or add notes before sending." : "Write some code before sending."); return; }
  btn.disabled = true; btn.textContent = "Sending…";
  let m;
  try { m = await saveWorkMedia(w, s.id); } catch (err) { toast("Could not store your files. Try smaller files."); btn.disabled = false; btn.textContent = "📤 Send to mentor for review"; return; }
  const ms = getMs($("#send-ms").value);
  let task = db().tasks.find(x => x.mentorshipId === ms.id && x.exId === exId);
  if (!task) task = createTaskFromTemplate(ms, { ...e, kind: e.kind + " (chosen by student)" }, { status: "submitted" });
  task.status = "submitted";
  const sub = pushSubmission(task, ms, s, w, m);
  notify("mentor", ms.mentorId, `📥 ${s.name} sent “${e.title}” for review`, "/m/review/" + sub.id);
  save(); toast("Sent! " + getMentor(ms.mentorId).name.split(" ")[0] + " has been notified."); render();
}
function pushSubmission(task, ms, s, w, m) {
  const sub = { id: uid("sub"), taskId: task.id, mentorshipId: ms.id, studentId: s.id, notes: w.notes, code: task.category === "python" ? w.code : "",
    recId: m.recId, files: m.files, practiceSeconds: w.seconds, drill: w.drill, speech: w.speech, run: task.category === "python" ? w.run : null,
    createdAt: Date.now(), feedback: null, score: null, fbMedia: [], reviewedAt: null };
  db().submissions.push(sub);
  ms.updatedAt = Date.now();
  return sub;
}
async function saveExercise(exId) {
  const s = session.get("student"), e = EXERCISE(exId), w = readWorkspace();
  if (!hasWork(w) && !w.seconds) { toast("Practise, record or write something first."); return; }
  let m; try { m = await saveWorkMedia(w, s.id); } catch (err) { toast("Could not store your files."); return; }
  db().practice.push({ id: uid("p"), studentId: s.id, exId, category: e.cat, createdAt: Date.now(), seconds: w.seconds, drill: w.drill, speech: w.speech, notes: w.notes, code: e.cat === "python" ? w.code : "", recId: m.recId, files: m.files });
  save(); toast("Saved."); render();
}

/* ---------- mentorship + mentor task pages ---------- */
function viewStudentMentorship(s, id) {
  const ms = getMs(id);
  if (!ms || ms.studentId !== s.id) return `<div class="empty section">Mentorship not found.</div>`;
  const m = getMentor(ms.mentorId), p = progressOf(ms.id), tasks = msTasks(ms.id), t = TOPIC(ms.topicId);
  const mats = db().materials.filter(x => x.mentorshipIds.includes(ms.id)).sort((a, b) => b.createdAt - a.createdAt);
  let banner = "";
  if (ms.status === "pending") banner = `<div class="note">⏳ Waiting for ${esc(m.name)} to accept. You will get a notification.</div>`;
  if (ms.status === "declined") banner = `<div class="note">${esc(m.name)} could not take this booking${ms.reason ? ": " + esc(ms.reason) : "."} ${t ? `<a href="#/s/learn/${t.id}">Find another mentor</a>` : ""}</div>`;
  if (ms.status === "ended") banner = `<div class="note">This mentorship has ended${ms.reason ? ": " + esc(ms.reason) : "."} Your work and feedback are kept below. ${t ? `<a href="#/s/learn/${t.id}">Find another mentor</a>` : ""}</div>`;
  hydrateMedia();
  return `<div class="panel section">
      <div class="mhead">${avatar(m, true)}<div><h1 style="font-size:1.9rem;margin:0">${esc(m.name)}</h1>
        <div class="row" style="gap:6px;margin-top:6px">${statusChip(ms.status)}<span class="chip ${ms.category}">${t ? t.emoji + " " + esc(t.name) : esc(ms.focus || "")}</span></div>
        <p class="small muted" style="margin:6px 0 0">${esc(m.availability)}, ${m.mode === "online" ? "online" : "offline in " + esc(m.location)}. <a href="#/mentors/${m.id}">Profile</a></p></div></div>
      ${banner ? `<div style="margin-top:14px">${banner}</div>` : ""}
      <div style="margin-top:16px"><div class="row small" style="justify-content:space-between"><b>Progress</b><span class="muted">${p.reviewed} of ${p.total} reviewed${p.avg !== null ? ", avg " + p.avg.toFixed(1) + "/10" : ""}, ${p.minutes} min</span></div>
      <div class="progress" style="margin-top:6px"><i style="width:${p.pct}%"></i></div></div>
    </div>
    <h2>Notes & media from ${esc(m.name.split(" ")[0])}</h2>
    ${mats.length ? `<div class="list">${mats.map(mt => `<div class="item"><h4>📎 ${esc(mt.title)}</h4><p class="small muted" style="margin:0 0 6px">${fmtDate(mt.createdAt)}</p>${mt.text ? `<p class="small">${nl2br(mt.text)}</p>` : ""}${mediaListHTML(mt.files)}</div>`).join("")}</div>` : `<div class="empty">Nothing shared yet.</div>`}
    <h2 style="margin-top:26px">Work and feedback</h2>
    ${tasks.length ? `<div class="list">${tasks.map(x => { const last = taskSubs(x.id)[0]; return `<a class="item" href="#/s/task/${x.id}" style="text-decoration:none;color:inherit;display:block">
      <div class="row" style="justify-content:space-between"><h4>${esc(x.title)}</h4>${taskChip(x)}</div>
      <p class="small muted" style="margin:0">${esc(x.kind)}, ${ago(x.createdAt)}${last?.reviewedAt ? ", score " + last.score + "/10" : ""}</p></a>`; }).join("")}</div>`
      : `<div class="empty">${ms.status === "active" ? "No work yet. Open a topic and send an exercise." : "Work appears here once the mentor accepts."}</div>`}`;
}

function viewStudentTask(s, id) {
  const t = getTask(id), ms = t && getMs(t.mentorshipId);
  if (!t || ms.studentId !== s.id) return `<div class="empty section">Task not found.</div>`;
  const m = getMentor(ms.mentorId), subs = taskSubs(t.id), last = subs[0];
  const ex = t.exId ? EXERCISE(t.exId) : null, topicId = t.topicId || ms.topicId, tp = TOPIC(topicId);
  mountAll({ topicId, exId: t.exId, check: ex?.check });
  return `<div class="panel section">
      <div class="row" style="justify-content:space-between"><h1 style="font-size:1.9rem;margin:0">${CATS[t.category].emoji} ${esc(t.title)}</h1>${taskChip(t)}</div>
      <p class="small muted">${tp ? tp.emoji + " " + esc(tp.name) + ", " : ""}${esc(t.kind)}, from ${esc(m.name)}, ${fmtDate(t.createdAt)}</p>
      <p>${nl2br(t.desc)}</p>
      ${(t.files || []).length ? `<p class="small" style="margin:10px 0 0"><b>Files from your mentor:</b></p>${mediaListHTML(t.files)}` : ""}
      <div class="row" style="margin-top:12px"><button class="btn ghost sm" data-act="notes-task" data-id="${t.id}">📄 View session notes</button></div>
    </div>
    ${subs.length ? `<h2>Your work and feedback</h2><div class="list">${subs.map(x => subHTML(x, false)).join("")}</div>` : ""}
    ${ms.status === "active" ? `<h2 style="margin-top:26px">${subs.length ? "Improve and send again" : "Work on it and send"}</h2>
      ${workspaceHTML(t.category, workspaceOpts(t.category, topicId, ex, t, last?.code || undefined))}
      <div class="row" style="margin:16px 0 30px"><button class="btn" data-act="submit-task" data-id="${t.id}">📤 Send to ${esc(m.name.split(" ")[0])}</button></div>`
      : `<div class="empty">This mentorship is ${ms.status}, so new work cannot be sent.</div>`}`;
}
async function submitTask(taskId, btn) {
  const s = session.get("student"), w = readWorkspace();
  if (!hasWork(w)) { toast("Add a recording, code, notes or a file before sending."); return; }
  btn.disabled = true; btn.textContent = "Sending…";
  let m; try { m = await saveWorkMedia(w, s.id); } catch (e) { toast("Could not store your files."); btn.disabled = false; return; }
  const t = getTask(taskId), ms = getMs(t.mentorshipId);
  t.status = "submitted";
  const sub = pushSubmission(t, ms, s, w, m);
  notify("mentor", ms.mentorId, `📥 ${s.name} sent “${t.title}”`, "/m/review/" + sub.id);
  save(); toast("Sent! Your mentor has been notified."); render();
}

/* ---------- session notes: view in the app, download as .txt ---------- */
function notesText(title, rows, extra = "") {
  const lines = ["LEARN BRIDGE: SESSION NOTES", "=".repeat(34), title, "Created " + new Date().toLocaleString(), ""];
  rows.filter(r => r[1]).forEach(([k, v]) => lines.push(k + ": " + v));
  if (extra) lines.push("", extra);
  return lines.join("\n") + "\n";
}
function fbText(x) {
  if (!x.reviewedAt) return "Waiting for mentor review";
  const f = x.feedback || {};
  return `Mentor score: ${x.score}/10` + (f.good ? `\nWhat went well: ${f.good}` : "") + (f.mistakes ? `\nMistakes found: ${f.mistakes}` : "") + (f.next ? `\nHow to improve: ${f.next}` : "");
}
function subText(x, i) {
  const sp = x.speech;
  return [`--- Attempt ${i + 1} (${fmtDate(x.createdAt)}) ---`, x.drill ? `Exercise score: ${x.drill.title} ${x.drill.score}/${x.drill.total}` : "",
    sp ? `${sp.mode === "read" ? "Read aloud" : "Spoke on"}: ${sp.prompt}` + (sp.seconds ? `\nLength: ${mmss(sp.seconds)}` : "") + (sp.wpm ? `, ${sp.wpm} words/min` : "") + (sp.accuracy != null ? `, ${sp.accuracy}% read correctly` : "") + (sp.transcript ? `\nTranscript: ${sp.transcript}` : "") : "",
    x.practiceSeconds && !sp ? "Practice time: " + mmss(x.practiceSeconds) : "", x.notes ? "Notes: " + x.notes : "", x.code ? "Code:\n" + x.code : "",
    x.run ? "Last run output:\n" + (x.run.output || "(no output)") + (x.run.check ? (x.run.check.ok ? "\nChecks: passed" : "\nChecks: not passed") : "") : "",
    (x.recId || (x.files || []).length) ? "Media: " + [x.recId, ...(x.files || [])].filter(Boolean).map(id => mediaMeta(id)?.name).join(", ") : "", fbText(x) + (x.feedback?.code ? "\nCorrected code:\n" + x.feedback.code : "")].filter(Boolean).join("\n");
}
function topicNotes(topicId) { const t = TOPIC(topicId); return t ? `LESSON: ${t.name}\n` + t.points.map(p => "• " + p).join("\n") + "\n\nFurther reading:\n" + REFS[t.cat].map(([a, u]) => "• " + a + ": " + u).join("\n") : ""; }
function showTaskNotes(id) {
  const t = getTask(id), ms = getMs(t.mentorshipId), m = getMentor(ms.mentorId), st = getStudent(ms.studentId);
  const subs = taskSubs(t.id).reverse().map(subText).join("\n\n");
  const txt = notesText(t.title, [["Student", st.name], ["Mentor", m.name], ["Subject", CATS[t.category].name], ["Type", t.kind], ["Task", t.desc], ["Raga", t.raga], ["Tala", t.tala]], (subs || "No attempts yet.") + "\n\n" + topicNotes(t.topicId || ms.topicId));
  viewText("Session notes", txt, ("learnbridge-" + t.title).replace(/[^\w-]+/g, "-").toLowerCase() + ".txt");
}
function showExerciseNotes(exId, p) {
  const e = EXERCISE(exId), s = session.get("student");
  const w = p || readWorkspace(), sp = w.speech;
  const txt = notesText(e.title, [["Student", s.name], ["Subject", CATS[e.cat].name + ": " + (TOPIC(e.topicId)?.name || "")], ["Exercise", e.desc], ["Date", fmtDate(p?.createdAt || Date.now())],
    ["Practice time", w.seconds ? mmss(w.seconds) : ""], ["Exercise score", w.drill ? w.drill.score + "/" + w.drill.total : ""],
    ["Speech", sp ? (sp.prompt || "") : ""], ["Speaking speed", sp?.wpm ? sp.wpm + " words/min" : ""], ["Reading accuracy", sp?.accuracy != null ? sp.accuracy + "%" : ""], ["Transcript", sp?.transcript || ""],
    ["Code check", w.run?.check ? (w.run.check.ok ? "passed" : "not passed: " + (w.run.check.msg || "")) : ""], ["Notes", w.notes]],
    (w.code ? "CODE\n" + w.code + "\n\n" : "") + (w.run?.output ? "OUTPUT\n" + w.run.output + "\n\n" : "") + topicNotes(e.topicId));
  viewText("Session notes", txt, "learnbridge-" + e.id + "-" + new Date().toISOString().slice(0, 10) + ".txt");
}
