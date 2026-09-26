"use strict";
/* Mentor portal, router, events and app start */
/* ============================================================
   MENTOR PORTAL
   ============================================================ */
function viewMentorHome(m) {
  const d = db();
  const mss = d.mentorships.filter(x => x.mentorId === m.id);
  const pending = mss.filter(x => x.status === "pending").sort((a, b) => b.createdAt - a.createdAt);
  const active = mss.filter(x => x.status === "active").sort((a, b) => b.updatedAt - a.updatedAt);
  const past = mss.filter(x => x.status === "ended" || x.status === "declined");
  const awaiting = d.submissions.filter(s => active.some(a => a.id === s.mentorshipId) && !s.reviewedAt).sort((a, b) => a.createdAt - b.createdAt);
  return `<section class="section">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div><h1>Welcome, ${esc(m.name.split(" ")[0])}</h1><p class="muted" style="margin:0">${CATS[m.category].emoji} ${esc(CATS[m.category].name)} mentor</p></div>
        <div class="row"><button class="btn ghost sm" data-act="toggle-mode">${m.mode === "online" ? "🟢 Online" : "⚪ Offline"}: switch</button><a class="btn ghost sm" href="#/m/profile">Edit profile</a></div>
      </div>
      <div class="statrow" style="margin-top:16px">
        <div class="stat"><b>${pending.length}</b><span class="small muted">new bookings</span></div>
        <div class="stat"><b>${active.length}</b><span class="small muted">active students</span></div>
        <div class="stat"><b>${awaiting.length}</b><span class="small muted">work to review</span></div>
        <div class="stat"><b>${past.length}</b><span class="small muted">past / declined</span></div>
      </div></section>
    <div class="split">
      <div>
        <section class="panel">
          <h2>Work waiting for your review</h2>
          ${awaiting.length ? `<div class="list">${awaiting.map(x => { const s = getStudent(x.studentId), t = getTask(x.taskId); return `<a class="item" href="#/m/review/${x.id}" style="display:block;text-decoration:none;color:inherit"><div class="row" style="justify-content:space-between"><h4>${esc(t?.title)}</h4><span class="btn ok sm">Review</span></div><p class="small muted" style="margin:0">${esc(s?.name)}, ${ago(x.createdAt)}${x.recId ? ", 🎧 recording" : ""}${(x.files || []).length ? ", 📎 " + x.files.length + " file(s)" : ""}${x.code ? ", 🐍 code" : ""}</p></a>`; }).join("")}</div>` : `<div class="empty">All caught up.</div>`}
        </section>
        <section class="panel" style="margin-top:16px">
          <h2>Booking requests</h2>
          ${pending.length ? `<div class="list">${pending.map(x => { const s = getStudent(x.studentId), t = TOPIC(x.topicId); return `<div class="item">
            <div class="row" style="justify-content:space-between"><h4>${esc(s?.name)}</h4><span class="chip ${x.category}">${t ? t.emoji + " " + esc(t.name) : esc(x.focus)}</span></div>
            <p class="small muted" style="margin:0 0 6px">${esc(s?.email)}, ${ago(x.createdAt)}${x.slot ? ", prefers " + esc(x.slot) : ""}</p>
            <p class="small">“${esc(x.message)}”</p>
            <div class="row"><button class="btn ok sm" data-act="accept" data-id="${x.id}">✓ Accept</button><button class="btn ghost sm" data-act="decline" data-id="${x.id}">Decline</button></div></div>`; }).join("")}</div>` : `<div class="empty">No new bookings. Students who book you show up here straight away.</div>`}
        </section>
      </div>
      <aside>
        <section class="panel">
          <h2>My students</h2>
          ${active.length ? `<div class="list">${active.map(x => { const s = getStudent(x.studentId), p = progressOf(x.id), t = TOPIC(x.topicId); return `<a class="item" href="#/m/s/${x.id}" style="display:block;text-decoration:none;color:inherit"><h4>${esc(s?.name)}</h4><p class="small muted" style="margin:0 0 6px">${t ? esc(t.name) : esc(x.focus)}, ${p.reviewed}/${p.total} reviewed</p><div class="progress"><i style="width:${p.pct}%"></i></div></a>`; }).join("")}</div>` : `<div class="empty">No active students yet.</div>`}
        </section>
        ${past.length ? `<section class="panel" style="margin-top:16px"><h2>Past</h2><div class="list">${past.map(x => `<a class="item" href="#/m/s/${x.id}" style="display:block;text-decoration:none;color:inherit"><h4>${esc(getStudent(x.studentId)?.name)}</h4>${statusChip(x.status)}</a>`).join("")}</div></section>` : ""}
      </aside>
    </div>`;
}

function acceptRequest(id) {
  const ms = getMs(id), m = getMentor(ms.mentorId), s = getStudent(ms.studentId);
  ms.status = "active"; ms.updatedAt = Date.now(); ms.acceptedAt = Date.now();
  const tp = TOPIC(ms.topicId) || topicsOf(ms.category)[0];
  const t = createTaskFromTemplate(ms, tp.ex[0]);
  notify("student", s.id, `✅ ${m.name} accepted your booking. First task: “${t.title}”`, "/s/task/" + t.id);
  save(); toast("Accepted. First task “" + t.title + "” was created for " + s.name.split(" ")[0] + ".");
  go("/m/s/" + ms.id);
}

function viewMentorStudent(m, id) {
  const ms = getMs(id);
  if (!ms || ms.mentorId !== m.id) return `<div class="empty section">Student not found.</div>`;
  const s = getStudent(ms.studentId), p = progressOf(ms.id), tasks = msTasks(ms.id), tp = TOPIC(ms.topicId);
  const notes = db().mentorNotes.filter(n => n.mentorshipId === ms.id).sort((a, b) => b.createdAt - a.createdAt);
  const mats = db().materials.filter(x => x.mentorshipIds.includes(ms.id)).sort((a, b) => b.createdAt - a.createdAt);
  mountAll({ noRecord: true });
  return `<div class="panel section">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div>
        <h1 style="font-size:1.9rem;margin:0">${esc(s.name)}</h1>
        <p class="small muted" style="margin:4px 0 8px">${esc(s.email)}, joined ${fmtDate(s.createdAt)}</p>
        <div class="row" style="gap:6px">${statusChip(ms.status)}<span class="chip ${ms.category}">${tp ? tp.emoji + " " + esc(tp.name) : esc(ms.focus)}</span></div></div>
        ${ms.status === "pending" ? `<div class="row"><button class="btn ok" data-act="accept" data-id="${ms.id}">✓ Accept</button><button class="btn ghost" data-act="decline" data-id="${ms.id}">Decline</button></div>` : ""}
        ${ms.status === "active" ? `<button class="btn ghost sm" data-act="end" data-id="${ms.id}" style="color:var(--danger)">End mentorship</button>` : ""}
      </div>
      <p class="small" style="margin:12px 0 0"><b>Problem the student is facing:</b> ${esc(ms.message)}${ms.slot ? "<br><b>Preferred time:</b> " + esc(ms.slot) : ""}</p>
      <div style="margin-top:14px"><div class="row small" style="justify-content:space-between"><b>Student progress</b><span class="muted">${p.reviewed}/${p.total} reviewed${p.avg !== null ? ", avg " + p.avg.toFixed(1) + "/10" : ""}, ${p.minutes} min practised</span></div><div class="progress" style="margin-top:6px"><i style="width:${p.pct}%"></i></div></div>
    </div>
    <div class="split">
      <section>
        <h2>Practice progress</h2>
        <p class="small muted">What ${esc(s.name.split(" ")[0])} has practised on their own: exercise scores, code checks and timed speeches.</p>
        ${progressHTML(s.id, ms.category)}
        <h2 style="margin-top:26px">Student's work</h2>
        ${tasks.length ? `<div class="list">${tasks.map(t => { const subs = taskSubs(t.id); return `<div class="panel flat">
          <div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(t.title)}</h3>${taskChip(t)}</div>
          <p class="small muted" style="margin:2px 0 8px">${esc(t.kind)}, ${fmtDate(t.createdAt)}</p>
          <p class="small">${nl2br(t.desc)}</p>
          ${(t.files || []).length ? mediaListHTML(t.files) : ""}
          ${subs.length ? `<div class="list" style="margin-top:8px">${subs.map(x => subHTML(x, ms.status === "active")).join("")}</div>` : `<p class="small muted" style="margin:0">Nothing sent yet.</p>`}
        </div>`; }).join("")}</div>` : `<div class="empty">No work yet.</div>`}
        <h2 style="margin-top:26px">Notes & media you shared</h2>
        ${mats.length ? `<div class="list">${mats.map(mt => `<div class="item"><h4>📎 ${esc(mt.title)}</h4><p class="small muted" style="margin:0 0 6px">${fmtDate(mt.createdAt)}${mt.mentorshipIds.length > 1 ? ", sent to " + mt.mentorshipIds.length + " students" : ""}</p>${mt.text ? `<p class="small">${nl2br(mt.text)}</p>` : ""}${mediaListHTML(mt.files)}</div>`).join("")}</div>` : `<div class="empty">Nothing shared yet.</div>`}
      </section>
      <aside>
        ${ms.status === "active" ? `<section class="panel">
          <h2>Share notes & media</h2>
          <p class="small muted">Upload photos, PDFs, audio, video or written notes for this student.</p>
          <form data-form="material" data-id="${ms.id}" data-root>
            <label class="f">Title<input class="input" name="title" placeholder="e.g. Notation for varase 1–5" required></label>
            <label class="f">Notes<textarea class="input" name="text" placeholder="Explain what to do with these files"></textarea></label>
            <div class="row" style="margin-bottom:12px">${filesHTML("mat", "Upload files")}</div>
            <label class="small" style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><input type="checkbox" name="all"> Send to all my active students</label>
            <p class="err" data-err></p>
            <button class="btn" type="submit">📤 Share</button>
          </form></section>
        <section class="panel" style="margin-top:16px">
          <h2>Assign a task</h2>
          <form data-form="assign" data-id="${ms.id}">
            <label class="f">From the learning catalog<select class="input" name="ex"><option value="">Custom task (write below)</option>
              ${topicsOf(ms.category).map(t => `<optgroup label="${esc(t.emoji + " " + t.name)}">${t.ex.map(e => `<option value="${e.id}" ${tp && t.id === tp.id && e === t.ex[1] ? "" : ""}>${esc(e.title)}</option>`).join("")}</optgroup>`).join("")}</select></label>
            <label class="f">Activity<select class="input" name="topic">${topicsOf(ms.category).map(t => `<option value="${t.id}" ${tp && t.id === tp.id ? "selected" : ""}>${t.emoji} ${esc(t.name)}</option>`).join("")}</select><span class="hint">Used for custom tasks; a catalog exercise keeps its own activity</span></label>
            <label class="f">Title<span class="hint">Leave blank to use the catalog exercise</span><input class="input" name="title"></label>
            <label class="f">Instructions<textarea class="input" name="desc"></textarea></label>
            ${ms.category === "python" ? `<label class="f">Starter code (optional)<textarea class="input code" name="starter" style="min-height:120px"></textarea></label>` : ""}
            ${ms.category === "speaking" ? `<label class="f">Paragraph or topic shown to the student<span class="hint">Leave blank to use the instructions above</span><textarea class="input" name="paragraph" placeholder="e.g. Read this paragraph aloud / Speak about your favourite festival"></textarea></label>
              <div class="formgrid"><label class="f">Type<select class="input" name="mode"><option value="speak">Speak on it</option><option value="read">Read it aloud</option></select></label>
              <label class="f">Prepare (seconds)<input class="input" type="number" min="0" max="300" name="prep" value="10"></label>
              <label class="f">Speak (seconds)<input class="input" type="number" min="5" max="600" name="speak" value="60"></label></div>` : ""}
            <div class="row" style="margin-bottom:12px">${filesHTML("task", "Attach files")}</div>
            <p class="err" data-err></p>
            <button class="btn" type="submit">Assign task</button>
          </form></section>` : ""}
        <section class="panel" style="margin-top:16px">
          <h2>Private notes</h2><p class="small muted">Only you can see these.</p>
          <form data-form="mnote" data-id="${ms.id}"><textarea class="input" name="text" placeholder="e.g. Pitch drifts on upper Sa; try slower tempo" required></textarea><button class="btn ghost sm" type="submit" style="margin-top:8px">Add note</button></form>
          <div class="list" style="margin-top:12px">${notes.map(n => `<div class="note small">${nl2br(n.text)}<br><span class="muted">${fmtDate(n.createdAt)}</span></div>`).join("") || `<p class="small muted">No notes yet.</p>`}</div>
        </section>
      </aside>
    </div>`;
}

/* Review page: the mentor goes through the work and guides the student */
function viewReview(m, subId) {
  const x = db().submissions.find(s => s.id === subId);
  const ms = x && getMs(x.mentorshipId);
  if (!x || ms.mentorId !== m.id) return `<div class="empty section">This submission was not found.</div>`;
  const s = getStudent(x.studentId), t = getTask(x.taskId), tp = TOPIC(t.topicId || ms.topicId), ex = t.exId ? EXERCISE(t.exId) : null;
  const earlier = taskSubs(t.id).filter(y => y.id !== x.id);
  const f = x.feedback || {};
  mountAll({ noRecord: true, check: ex?.check });
  const tips = { music: "Listen for pitch (sruti), steadiness, tala/tempo, and clarity of each swara or note.", speaking: "Listen for structure, clarity, pace, filler words, eye contact (in video) and a strong ending.", python: "Check correctness, edge cases, naming, readability and whether the student understood the error." }[t.category];
  return `<div class="section">
      <p class="small muted" style="margin:0">Reviewing work from</p>
      <h1 style="font-size:clamp(1.6rem,4vw,2.2rem);margin:0">${esc(s.name)}: ${esc(t.title)}</h1>
      <div class="row" style="gap:6px;margin-top:8px">${tp ? `<span class="chip ${t.category}">${tp.emoji} ${esc(tp.name)}</span>` : ""}<span class="chip">${esc(t.kind)}</span>${x.reviewedAt ? `<span class="chip active">Reviewed</span>` : `<span class="chip pending">Needs review</span>`}</div>
    </div>
    <div class="split">
      <section>
        <div class="panel flat"><h3>The task</h3><p class="small">${nl2br(t.desc)}</p>${t.starter && t.category === "python" ? `<details><summary class="small" style="cursor:pointer;font-weight:700">Starter code given</summary><pre class="code">${esc(t.starter)}</pre></details>` : ""}</div>
        <h2 style="margin-top:20px">What the student sent</h2>
        ${subHTML({ ...x, reviewedAt: null }, false).replace(/<p class="small muted" style="margin:8px 0 0">⏳ Waiting for your mentor's review.<\/p>/, "")}
        ${t.category === "python" && x.code ? `<details class="panel flat" style="margin-top:14px" open><summary style="cursor:pointer;font-weight:700">▶ Run the student's code yourself</summary><p class="small muted">Your edits here are not sent to the student. Use the corrected code box to send fixes.</p>${codeStudioHTML({ code: x.code, starter: x.code, stdin: ex?.stdin || "", check: ex?.check || "" })}</details>` : ""}
        ${ex?.solution ? `<details class="panel flat" style="margin-top:14px"><summary style="cursor:pointer;font-weight:700">🔑 Model solution (only mentors see this)</summary><pre class="code">${esc(ex.solution)}</pre></details>` : ""}
        ${earlier.length ? `<details class="panel flat" style="margin-top:14px"><summary style="cursor:pointer;font-weight:700">Earlier attempts (${earlier.length}) to compare</summary><div class="list" style="margin-top:10px">${earlier.map(y => subHTML(y, false)).join("")}</div></details>` : ""}
      </section>
      <aside class="panel" style="align-self:start">
        <h2>Your feedback</h2>
        <p class="small muted">${esc(tips)}</p>
        <form data-form="review" data-id="${x.id}">
          <label class="f">✅ What went well<textarea class="input" name="good" placeholder="Point out what they did right">${esc(f.good || "")}</textarea></label>
          <label class="f">⚠️ Mistakes found<textarea class="input" name="mistakes" placeholder="Be specific: which line, which phrase, which note, at what time">${esc(f.mistakes || "")}</textarea></label>
          <label class="f">➡️ How to improve (guidance)<textarea class="input" name="next" placeholder="Steps to fix it and what to practise next">${esc(f.next || "")}</textarea></label>
          ${t.category === "python" ? `<label class="f">🛠️ Corrected code (optional)<textarea class="input" name="fixcode" spellcheck="false" style="font-family:ui-monospace,Menlo,Consolas,monospace;min-height:120px" placeholder="Paste a fixed version of the student's code">${esc(f.code || "")}</textarea></label>` : ""}
          <label class="f">Score (1–10)<input class="input" type="number" min="1" max="10" name="score" value="${x.score ?? ""}" required style="max-width:120px"></label>
          <div class="panel flat" style="margin-bottom:12px"><h3 style="font-size:1rem">🎙️ Voice or video feedback (optional)</h3>${recorderHTML("fb", "Record voice feedback")}</div>
          <div class="row" style="margin-bottom:12px">${filesHTML("fbfiles", "Attach corrected notes, photos or files")}</div>
          <p class="err" data-err></p>
          <button class="btn ok" type="submit" style="width:100%">${x.reviewedAt ? "Update feedback" : "Send feedback to " + esc(s.name.split(" ")[0])}</button>
        </form>
      </aside>
    </div>`;
}

function viewMentorProfileEdit(m) {
  return `<div class="panel section" style="max-width:760px"><h1 style="font-size:2rem">Your profile</h1>
    <p class="muted">Students see this when they choose a mentor.</p>
    <form data-form="profile"><label class="f">Full name<input class="input" name="name" value="${esc(m.name)}" required></label>${mentorProfileFields(m)}
    <p class="err" data-err></p><button class="btn" type="submit">Save profile</button></form></div>`;
}

/* ============================================================
   NOTIFICATIONS, MODAL, TOP BAR
   ============================================================ */
function modal(html) {
  $("#modal-root").innerHTML = `<div class="modal-back" data-act="modal-bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  setTimeout(() => $(".modal input, .modal textarea, .modal select, .modal button")?.focus(), 30);
}
function closeModal() { $("#modal-root").innerHTML = ""; }
function currentPortal() { const p = routePath(); return /^\/s(\/|$)/.test(p) ? "student" : /^\/m(\/|$)/.test(p) ? "mentor" : null; }
function openNotifs(type) {
  const u = session.get(type); if (!u) return;
  const list = myNotifs(type, u.id);
  modal(`<div class="row" style="justify-content:space-between"><h2 style="margin:0">Notifications</h2>${list.some(n => !n.read) ? `<button class="linkbtn" data-act="read-all" data-type="${type}">Mark all as read</button>` : ""}</div>
    <div class="list" style="margin-top:12px;gap:4px">${list.length ? list.map(n => `<div class="notif ${n.read ? "" : "unread"}" data-act="open-notif" data-id="${n.id}"><div style="flex:1"><div>${esc(n.text)}</div><div class="small muted">${ago(n.createdAt)}</div></div></div>`).join("") : `<div class="empty">Nothing yet.</div>`}</div>`);
}
let lastUnread = { student: 0, mentor: 0 };
function renderBar() {
  const p = routePath(), portal = currentPortal(), u = portal && session.get(portal);
  const unread = u ? myNotifs(portal, u.id).filter(n => !n.read).length : 0;
  const bump = u && unread > (lastUnread[portal] || 0);
  if (portal) lastUnread[portal] = unread;
  const isHome = p === "/";
  $("#bar").innerHTML = `
    ${!isHome ? `<button class="navbtn" data-act="back" aria-label="Go back">←<span class="lbl">Back</span></button>` : ""}
    <a class="brand" href="#/"><span class="knot"><span>🌉</span></span><span class="hide-sm">Learn Bridge</span></a>
    ${portal ? `<span class="portal-tag ${portal}">${portal === "student" ? "Student" : "Mentor"}</span>` : ""}
    <span class="spacer"></span>
    ${!isHome ? `<a class="navbtn" href="#/" aria-label="Home page">🏠<span class="lbl">Home</span></a>` : ""}
    ${u && p !== (portal === "student" ? "/s" : "/m") ? `<a class="navbtn" href="#/${portal === "student" ? "s" : "m"}" aria-label="Dashboard">▦<span class="lbl">Dashboard</span></a>` : ""}
    ${u ? `<button class="iconbtn" data-act="notifs" data-type="${portal}" aria-label="Notifications, ${unread} unread">🔔${unread ? `<span class="dot ${bump ? "pop" : ""}">${unread}</span>` : ""}</button>
      <button class="navbtn" data-act="logout" data-type="${portal}" aria-label="Log out">⏻<span class="lbl">Log out</span></button>` : ""}`;
}

/* ============================================================
   ROUTER + back navigation
   ============================================================ */
function routePath() { return (location.hash.replace(/^#/, "") || "/").split("?")[0]; }
const navStack = [];
function go(path) { if ("#" + path === location.hash) render(); else location.hash = path; }
function goBack() {
  navStack.pop();
  const prev = navStack.pop();
  if (prev && prev !== routePath()) { location.hash = prev; return; }
  const p = routePath();
  location.hash = (p === "/s" || p === "/m" || p.endsWith("/login")) ? "/" : p.startsWith("/s") ? "/s" : p.startsWith("/m/") ? "/m" : "/";
}
const LIVE_ROUTES = [/^\/s$/, /^\/m$/, /^\/s\/ms\//, /^\/m\/s\/[^/]+$/];
let authMode = { student: "login", mentor: "login" };

function render() {
  runCleanups(); mounts = [];
  const p = routePath(), parts = p.split("/").filter(Boolean);
  if (navStack[navStack.length - 1] !== p) navStack.push(p);
  if (navStack.length > 50) navStack.shift();
  let html = "";
  const needS = () => { const s = session.get("student"); if (!s) { go("/s/login"); return null; } return s; };
  const needM = () => { const m = session.get("mentor"); if (!m) { go("/m/login"); return null; } return m; };

  if (p === "/") html = viewLanding();
  else if (parts[0] === "mentors" && parts[1]) html = viewMentorProfile(parts[1]);
  else if (parts[0] === "s") {
    if (parts[1] === "login") { if (session.get("student")) return go("/s"); html = viewLogin("student", authMode.student); }
    else { const s = needS(); if (!s) return;
      if (!parts[1]) html = viewStudentHome(s);
      else if (parts[1] === "learn") html = viewTopic(s, parts[2]);
      else if (parts[1] === "ex") html = viewExercise(s, parts[2]);
      else if (parts[1] === "ms") html = viewStudentMentorship(s, parts[2]);
      else if (parts[1] === "task") html = viewStudentTask(s, parts[2]);
      else html = `<div class="empty section">Page not found.</div>`; }
  } else if (parts[0] === "m") {
    if (parts[1] === "login") { if (session.get("mentor")) return go("/m"); html = viewLogin("mentor", authMode.mentor); }
    else { const m = needM(); if (!m) return;
      if (!parts[1]) html = viewMentorHome(m);
      else if (parts[1] === "s") html = viewMentorStudent(m, parts[2]);
      else if (parts[1] === "review") html = viewReview(m, parts[2]);
      else if (parts[1] === "profile") html = viewMentorProfileEdit(m);
      else html = `<div class="empty section">Page not found.</div>`; }
  } else { location.hash = "/"; return; }

  renderBar();
  $("#app").innerHTML = html;
  mounts.forEach(f => f());
}

/* ============================================================
   EVENTS
   ============================================================ */
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  if (a === "modal-bg") { if (e.target === el) closeModal(); return; }
  switch (a) {
    case "close-modal": closeModal(); break;
    case "back": goBack(); break;
    case "auth-mode": {
      const typed = $("form[data-form=auth] input[name=email]")?.value || "";
      authMode[el.dataset.type] = el.dataset.mode; render();
      const inp = $("form[data-form=auth] input[name=email]"); if (inp) { inp.value = typed; inp.focus(); }
      break;
    }
    case "fill-login": {
      if (authMode.student !== "login") { authMode.student = "login"; render(); }
      $("form[data-form=auth] input[name=email]").value = el.dataset.email;
      $("form[data-form=auth] input[name=password]").focus();
      break;
    }
    case "learn-tab": learnTab = el.dataset.cat; render(); break;
    case "request": openRequestModal(id, el.dataset.topic); break;
    case "logout": session.clear(el.dataset.type); authMode[el.dataset.type] = "login"; navStack.length = 0; closeModal(); toast("Logged out."); go("/"); break;
    case "notifs": openNotifs(el.dataset.type); break;
    case "read-all": { const u = session.get(el.dataset.type); myNotifs(el.dataset.type, u.id).forEach(n => n.read = true); save(); closeModal(); renderBar(); break; }
    case "open-notif": { const n = db().notifications.find(x => x.id === id); n.read = true; save(); closeModal(); go(n.link || routePath()); break; }
    case "accept": acceptRequest(id); break;
    case "decline": modal(`<h2>Decline booking</h2><form data-form="decline" data-id="${id}"><label class="f">Reason for the student (optional)<textarea class="input" name="reason" placeholder="e.g. My schedule is full this month"></textarea></label><div class="row"><button class="btn danger" type="submit">Decline booking</button><button class="btn ghost" type="button" data-act="close-modal">Cancel</button></div></form>`); break;
    case "end": modal(`<h2>End this mentorship?</h2><p class="small muted">The student keeps all their work and feedback and can book another mentor.</p><form data-form="end" data-id="${id}"><label class="f">Message to the student<textarea class="input" name="reason" placeholder="e.g. Great progress! You are ready for an advanced mentor."></textarea></label><div class="row"><button class="btn danger" type="submit">End mentorship</button><button class="btn ghost" type="button" data-act="close-modal">Cancel</button></div></form>`); break;
    case "toggle-mode": { const m = session.get("mentor"); m.mode = m.mode === "online" ? "offline" : "online"; save(); toast("You now show as " + m.mode + "."); render(); break; }
    case "send-ex": sendExercise(id, el); break;
    case "save-ex": saveExercise(id); break;
    case "submit-task": submitTask(id, el); break;
    case "notes-now": showExerciseNotes(id); break;
    case "notes-practice": { const p = db().practice.find(x => x.id === id); showExerciseNotes(p.exId, p); break; }
    case "notes-task": showTaskNotes(id); break;
    case "view-media": viewMedia(id); break;
    case "dl-media": downloadMedia(id); break;
    case "new-topic": { const tt = $("[data-tt]"); let t; do { t = IMPROMPTU[Math.floor(Math.random() * IMPROMPTU.length)]; } while (t === tt.dataset.topic && IMPROMPTU.length > 1); tt.textContent = t; tt.dataset.topic = t; break; }
  }
});

document.addEventListener("submit", async (e) => {
  const form = e.target.closest("form[data-form]"); if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form, id = form.dataset.id, f = Object.fromEntries(new FormData(form).entries()), err = $("[data-err]", form);
  const btn = $("button[type=submit]", form);
  if (kind === "auth") return handleAuth(form);
  if (kind === "request") return handleRequest(form);
  if (kind === "decline") {
    const ms = getMs(id), m = getMentor(ms.mentorId);
    ms.status = "declined"; ms.reason = (f.reason || "").trim(); ms.updatedAt = Date.now();
    notify("student", ms.studentId, `${m.name} declined your booking${ms.reason ? ": " + ms.reason : ""}. You can book another mentor.`, "/s/ms/" + ms.id);
    save(); closeModal(); toast("Booking declined."); return go("/m");
  }
  if (kind === "end") {
    const ms = getMs(id), m = getMentor(ms.mentorId);
    ms.status = "ended"; ms.reason = (f.reason || "").trim(); ms.updatedAt = Date.now(); ms.endedAt = Date.now();
    notify("student", ms.studentId, `${m.name} ended your mentorship${ms.reason ? ": " + ms.reason : ""}. You can book another mentor any time.`, "/s/ms/" + ms.id);
    save(); closeModal(); toast("Mentorship ended."); return render();
  }
  if (kind === "review") {
    const score = Math.round(+f.score);
    if (!(f.good || "").trim() && !(f.mistakes || "").trim() && !(f.next || "").trim()) { err.textContent = "Write at least one part of the feedback."; return; }
    if (!(score >= 1 && score <= 10)) { err.textContent = "Give a score from 1 to 10."; return; }
    const m = session.get("mentor"), rec = $("[data-rec=fb]")?._rec, files = $("[data-files=fbfiles]")?._files || [];
    btn.disabled = true; btn.textContent = "Sending…";
    let media = [];
    try { if (rec?.blob) media.push(await storeFile(rec.blob, rec.name || "voice-feedback.webm", m.id)); media = media.concat(await storeFiles(files, m.id)); }
    catch (ex) { err.textContent = "Could not store your files. Try smaller files."; btn.disabled = false; btn.textContent = "Send feedback"; return; }
    const x = db().submissions.find(s => s.id === id), t = getTask(x.taskId);
    Object.assign(x, { feedback: { good: f.good.trim(), mistakes: f.mistakes.trim(), next: f.next.trim(), code: (f.fixcode || "").trim() }, score, fbMedia: (x.fbMedia || []).concat(media), reviewedAt: Date.now() });
    t.status = "reviewed"; getMs(x.mentorshipId).updatedAt = Date.now();
    notify("student", x.studentId, `💬 ${m.name} reviewed “${t.title}”: ${score}/10. Read the feedback and improve.`, "/s/task/" + t.id);
    save(); toast("Feedback sent."); return go("/m/s/" + x.mentorshipId);
  }
  if (kind === "material") {
    const ms = getMs(id), m = session.get("mentor"), files = $("[data-files=mat]")?._files || [];
    if (!f.title.trim()) { err.textContent = "Give it a title."; return; }
    if (!files.length && !(f.text || "").trim()) { err.textContent = "Add notes or at least one file."; return; }
    btn.disabled = true; btn.textContent = "Uploading…";
    let ids; try { ids = await storeFiles(files, m.id); } catch (ex) { err.textContent = "Could not store the files. Try smaller files."; btn.disabled = false; btn.textContent = "📤 Share"; return; }
    const targets = f.all ? db().mentorships.filter(x => x.mentorId === m.id && x.status === "active").map(x => x.id) : [ms.id];
    db().materials.push({ id: uid("mat"), mentorId: m.id, mentorshipIds: targets, title: f.title.trim(), text: (f.text || "").trim(), files: ids, createdAt: Date.now() });
    targets.forEach(tid => notify("student", getMs(tid).studentId, `📎 ${m.name} shared “${f.title.trim()}”`, "/s/ms/" + tid));
    save(); toast("Shared with " + targets.length + " student" + (targets.length === 1 ? "" : "s") + "."); return render();
  }
  if (kind === "assign") {
    const ms = getMs(id), exr = EXERCISE(f.ex), files = $("[data-files=task]")?._files || [], m = session.get("mentor");
    const title = (f.title || "").trim() || exr?.title, desc = (f.desc || "").trim() || exr?.desc;
    if (!title || !desc) { err.textContent = "Pick a catalog exercise or write a title and instructions."; return; }
    btn.disabled = true;
    let ids = []; try { ids = await storeFiles(files, m.id); } catch (ex) { err.textContent = "Could not store the files."; btn.disabled = false; return; }
    const extra = exr ? {} : { topicId: f.topic || ms.topicId };
    if (!exr && ms.category === "speaking") Object.assign(extra, { paragraph: (f.paragraph || "").trim(), mode: f.mode || "speak", prep: Math.max(0, +f.prep || 0), speak: Math.max(5, +f.speak || 60) });
    const t = createTaskFromTemplate(ms, { ...(exr || { kind: "Custom task" }), title, desc, starter: (f.starter || "").trim() || exr?.starter || "", files: ids }, extra);
    ms.updatedAt = Date.now();
    notify("student", ms.studentId, `📌 New task from ${m.name}: “${t.title}”`, "/s/task/" + t.id);
    save(); toast("Task assigned."); return render();
  }
  if (kind === "mnote") {
    if (!f.text.trim()) return;
    db().mentorNotes.push({ id: uid("mn"), mentorshipId: id, text: f.text.trim(), createdAt: Date.now() });
    save(); return render();
  }
  if (kind === "profile") {
    const m = session.get("mentor");
    if (!f.name.trim() || !f.skills.trim() || !f.bio.trim()) { err.textContent = "Name, skills and bio are required."; return; }
    Object.assign(m, { name: f.name.trim(), category: f.category, topics: new FormData(form).getAll("topic").filter(id => TOPIC(id)?.cat === f.category), skills: f.skills.split(",").map(s => s.trim()).filter(Boolean), experience: Math.max(0, +f.experience || 0), mode: f.mode, location: f.location.trim(), availability: f.availability.trim(), bio: f.bio.trim(), stories: (f.stories || "").split("\n").map(s => s.trim()).filter(Boolean) });
    save(); toast("Profile saved."); return go("/m");
  }
});

/* Live updates between a student tab and a mentor tab */
window.addEventListener("storage", (e) => {
  if (e.key !== DB_KEY) return;
  reloadDb();
  const portal = currentPortal(), u = portal && session.get(portal);
  const before = lastUnread[portal] || 0;
  renderBar();
  if (u) { const list = myNotifs(portal, u.id), unread = list.filter(n => !n.read).length; if (unread > before && list[0]) toast(list[0].text, 5000); }
  const typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  const busy = $$("[data-rec]").some(r => r._rec?.mr?.state === "recording" || r._rec?.blob) || $$("[data-files]").some(f => f._files?.length);
  if (!typing && !busy && !$("#modal-root").innerHTML && LIVE_ROUTES.some(r => r.test(routePath()))) render();
});
window.addEventListener("hashchange", () => { closeModal(); render(); window.scrollTo(0, 0); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

function storageWorks() {
  try { localStorage.setItem("lb_probe", "1"); const ok = localStorage.getItem("lb_probe") === "1"; localStorage.removeItem("lb_probe"); return ok; } catch (e) { return false; }
}
(async function boot() {
  if (!storageWorks()) {
    const b = document.createElement("div");
    b.className = "wrap"; b.innerHTML = `<div class="note" style="margin-top:12px"><b>This browser is not keeping saved data</b>, so accounts disappear when the page reloads. Open the app in a normal (not private) window, or in Chrome or Edge on a laptop.</div>`;
    $("#app").before(b);
  }
  await seedIfNeeded();
  render();
  getCap("downloads"); getCap("assets");
})();
