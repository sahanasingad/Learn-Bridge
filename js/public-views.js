"use strict";
/* Home page, login and mentor profile */
/* ============================================================
   VIEWS — shared / public
   ============================================================ */
function avatar(m, lg) { return `<div class="avatar ${m.category} ${lg ? "lg" : ""}" aria-hidden="true">${esc(initials(m.name))}</div>`; }
function statusChip(s) { const map = { pending: "Waiting for mentor", active: "Active", declined: "Declined", ended: "Ended" }; return `<span class="chip ${s}">${map[s] || s}</span>`; }

function mentorCard(m, opts = {}) {
  const r = mentorRating(m.id);
  return `<article class="panel mcard">
    <div class="mhead">${avatar(m)}
      <div style="min-width:0"><h3 style="margin:0">${esc(m.name)}</h3>
      <div class="row" style="gap:6px;margin-top:4px"><span class="chip ${m.category}">${CATS[m.category].emoji} ${esc(catName(m.category))}</span><span class="chip ${m.mode}">${m.mode === "online" ? "Online" : "Offline"}</span></div></div></div>
    ${opts.badge || ""}
    <p class="small" style="margin:0">${esc(m.bio)}</p>
    <div class="skills">${(m.skills || []).slice(0, 4).map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>
    <p class="small muted" style="margin:0">📍 ${esc(m.location)} &nbsp; 🗓️ ${esc(m.availability)} &nbsp; ⭐ ${m.experience} yrs &nbsp; 👥 ${r.active} active student${r.active === 1 ? "" : "s"}</p>
    <div class="row" style="margin-top:auto">
      <a class="btn ghost sm" href="#/mentors/${m.id}">View profile</a>
      ${opts.action || ""}
    </div></article>`;
}

function bridgeSVG() {
  let cables = "";
  for (let i = 1; i < 20; i++) {
    const t = i / 20, x = (1 - t) ** 2 * 70 + 2 * (1 - t) * t * 450 + t * t * 830, y = (1 - t) ** 2 * 200 + 2 * (1 - t) * t * 10 + t * t * 200;
    if (y < 168) cables += `<line class="cable" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="168"/>`;
  }
  return `<svg class="bridge" viewBox="0 0 900 250" role="img" aria-label="A bridge between students and mentors">
    <rect class="water" x="0" y="200" width="900" height="50"/>
    <line class="ripple" x1="150" y1="218" x2="230" y2="218"/><line class="ripple" x1="420" y1="232" x2="520" y2="232"/><line class="ripple" x1="660" y1="216" x2="740" y2="216"/>
    <path class="arch" d="M70 200 Q450 10 830 200"/>
    ${cables}
    <line class="deck" x1="20" y1="168" x2="880" y2="168"/>
    <rect x="58" y="150" width="24" height="50" rx="4" fill="#9A86FF"/><rect x="818" y="150" width="24" height="50" rx="4" fill="#33CFA2"/>
    <text x="70" y="140" text-anchor="middle" fill="#C9C3F2" font-size="15" font-weight="700" font-family="Figtree, sans-serif">Students</text>
    <text x="830" y="140" text-anchor="middle" fill="#C9C3F2" font-size="15" font-weight="700" font-family="Figtree, sans-serif">Mentors</text>
    <circle r="9" fill="#FFB84D"><animateMotion dur="6s" repeatCount="indefinite" path="M90 160 L810 160 L90 160"/></circle>
  </svg>`;
}
function viewLanding() {
  const s = session.get("student"), m = session.get("mentor");
  const counts = Object.values(CATS).map(c => ({ c, n: topicsOf(c.key).length }));
  return `<section class="band">
      <h1>Learn Bridge</h1>
      <p class="sub">Students on one side, mentors on the other. Cross over, practise, and get real feedback.</p>
      ${bridgeSVG()}
      <div class="banks">
        <a class="bank" href="#/s"><span class="ico">🎒</span><b>I'm a student</b><span>Choose what to learn, practise it, and send your work to a mentor.</span><span class="cta">${s ? "Continue as " + esc(s.name.split(" ")[0]) : "Student login"}</span></a>
        <a class="bank m" href="#/m"><span class="ico">🧑‍🏫</span><b>I'm a mentor</b><span>Accept students, review their work, point out mistakes and guide them.</span><span class="cta">${m ? "Continue as " + esc(m.name.split(" ")[0]) : "Mentor login"}</span></a>
      </div>
    </section>
    <div class="learnrow">${counts.map(({ c, n }) => `<div class="lr"><div style="font-size:1.8rem">${c.emoji}</div><h3>${esc(c.name)}</h3><p class="small muted" style="margin:0">${n} topics: ${esc(c.tagline)}</p></div>`).join("")}</div>`;
}

function viewMentorProfile(id) {
  const m = getMentor(id);
  if (!m) return `<div class="empty section">That mentor profile does not exist.</div>`;
  const stu = session.get("student"), r = mentorRating(m.id);
  let action = "";
  if (stu) {
    const ex = db().mentorships.find(x => x.studentId === stu.id && x.mentorId === m.id && (x.status === "pending" || x.status === "active"));
    action = ex ? `<p>${statusChip(ex.status)} <a href="#/s/ms/${ex.id}">Open this mentorship</a></p>` : `<button class="btn" data-act="request" data-id="${m.id}">Request ${esc(m.name.split(" ")[0])} as my mentor</button>`;
  } else if (!session.get("mentor")) {
    action = `<a class="btn" href="#/s/login?next=${encodeURIComponent("/mentors/" + m.id)}">Log in as student to request</a>`;
  }
  return `<div class="crumbs">Mentor profile</div>
    <div class="split section">
      <div class="panel">
        <div class="mhead">${avatar(m, true)}<div><h1 style="font-size:2rem;margin:0">${esc(m.name)}</h1>
          <div class="row" style="gap:6px;margin-top:6px"><span class="chip ${m.category}">${CATS[m.category].emoji} ${esc(CATS[m.category].name)}</span><span class="chip ${m.mode}">${m.mode === "online" ? "Online classes" : "Offline classes"}</span></div></div></div>
        <h3 style="margin-top:20px">About</h3><p>${nl2br(m.bio)}</p>
        <h3>Teaches</h3><div class="skills" style="margin-bottom:14px">${(m.topics || []).map(id => TOPIC(id)).filter(Boolean).map(t => `<span class="chip ${t.cat}">${t.emoji} ${esc(t.name)}</span>`).join("") || `<span class="muted small">All ${esc(catName(m.category))} topics</span>`}</div>
        <h3>Skills</h3><div class="skills">${(m.skills || []).map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>
        <h3 style="margin-top:20px">Success stories</h3>
        ${(m.stories || []).length ? `<div class="list">${m.stories.map(s => `<div class="note">🏆 ${esc(s)}</div>`).join("")}</div>` : `<p class="muted">No stories added yet.</p>`}
      </div>
      <aside class="panel" style="align-self:start">
        <h3>Details</h3>
        <p class="small" style="margin:0 0 6px"><b>Experience:</b> ${m.experience} years</p>
        <p class="small" style="margin:0 0 6px"><b>Availability:</b> ${esc(m.availability)}</p>
        <p class="small" style="margin:0 0 6px"><b>Mode:</b> ${m.mode === "online" ? "Online" : "Offline (in person)"}</p>
        <p class="small" style="margin:0 0 6px"><b>Location:</b> ${esc(m.location)}</p>
        <p class="small" style="margin:0 0 16px"><b>Students:</b> ${r.active} active, ${r.total} total</p>
        ${action}
      </aside>
    </div>`;
}

/* ---------- login / create account (separate for each portal) ---------- */
function viewLogin(type, mode) {
  const isS = type === "student";
  mode = mode === "signup" ? "signup" : "login";
  const accounts = (isS ? db().students : db().mentors).slice().sort((a, b) => (b.lastLogin || b.createdAt) - (a.lastLogin || a.createdAt));
  const quick = isS
    ? (accounts.length ? `<div class="panel flat" style="margin-top:16px"><h3>Student accounts on this device</h3><p class="small muted">Tap one to fill in the email, then type its password.</p><div class="list">${accounts.slice(0, 8).map(a => `<button type="button" class="item" data-act="fill-login" data-email="${esc(a.email)}" style="text-align:left;cursor:pointer;font:inherit;color:inherit"><b>${esc(a.name)}</b><br><span class="small muted">${esc(a.email)}</span></button>`).join("")}</div></div>` : "")
    : `<p class="small muted" style="margin:16px 0 0">Mentor accounts are given out by the Learn Bridge team. New mentors can use Create account.</p>`;
  return `<div style="max-width:560px;margin:34px auto">
    
    <div class="panel">
      <div style="font-size:2.4rem">${isS ? "🎒" : "🧑‍🏫"}</div>
      <h1 style="font-size:2rem">${isS ? "Student" : "Mentor"} portal</h1>
      <div class="tabs" role="tablist">
        <button type="button" class="tab ${mode === "login" ? "on" : ""}" data-act="auth-mode" data-type="${type}" data-mode="login">Log in</button>
        <button type="button" class="tab ${mode === "signup" ? "on" : ""}" data-act="auth-mode" data-type="${type}" data-mode="signup">Create account</button>
      </div>
      <form data-form="auth" data-type="${type}" data-mode="${mode}" novalidate>
        <label class="f">Email<input class="input" type="email" name="email" autocomplete="email" autocapitalize="off" required></label>
        ${mode === "login"
          ? `<label class="f">Password<input class="input" type="password" name="password" autocomplete="current-password" required></label>`
          : `<label class="f">Full name<input class="input" name="name" autocomplete="name" required></label>
             <div class="formgrid">
               <label class="f">Password<span class="hint">At least 6 characters</span><input class="input" type="password" name="password" autocomplete="new-password" required></label>
               <label class="f">Confirm password<span class="hint">&nbsp;</span><input class="input" type="password" name="password2" autocomplete="new-password" required></label>
             </div>${isS ? "" : mentorProfileFields({})}`}
        <p class="err" data-err></p>
        <button class="btn" type="submit" style="width:100%">${mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      ${quick}
    </div>
    <p class="small muted" style="text-align:center;margin-top:14px">${isS ? `Are you a mentor? <a href="#/m/login">Go to the mentor portal</a>` : `Are you a student? <a href="#/s/login">Go to the student portal</a>`}</p>
  </div>`;
}

function mentorProfileFields(m) {
  return `<label class="f">Category you teach<select class="input" name="category" onchange="document.querySelectorAll('[data-topicgroup]').forEach(g=>g.classList.toggle('hide',g.dataset.topicgroup!==this.value))">${Object.values(CATS).map(c => `<option value="${c.key}" ${m.category === c.key ? "selected" : ""}>${c.emoji} ${esc(c.name)}</option>`).join("")}</select></label>
    <fieldset class="f" style="border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:0 0 12px"><legend style="font-weight:600;padding:0 4px">Topics you teach</legend>
      ${Object.values(CATS).map(c => `<div data-topicgroup="${c.key}" class="${(m.category || "music") === c.key ? "" : "hide"}" style="display:flex;flex-wrap:wrap;gap:6px 14px">${topicsOf(c.key).map(t => `<label class="small" style="display:inline-flex;gap:6px;align-items:center;font-weight:500"><input type="checkbox" name="topic" value="${t.id}" ${(m.topics || []).includes(t.id) ? "checked" : ""}> ${t.emoji} ${esc(t.name)}</label>`).join("")}</div>`).join("")}
    </fieldset>
    <label class="f">Skills<span class="hint">Separate with commas, e.g. Carnatic vocal, Sruti alignment</span><input class="input" name="skills" value="${esc((m.skills || []).join(", "))}" required></label>
    <div class="formgrid">
      <label class="f">Experience (years)<input class="input" type="number" min="0" max="70" name="experience" value="${esc(m.experience ?? "")}" required></label>
      <label class="f">Teaching mode<select class="input" name="mode"><option value="online" ${m.mode !== "offline" ? "selected" : ""}>Online</option><option value="offline" ${m.mode === "offline" ? "selected" : ""}>Offline</option></select></label>
      <label class="f">Location<input class="input" name="location" value="${esc(m.location || "")}" required></label>
      <label class="f">Availability<input class="input" name="availability" placeholder="e.g. Mon–Fri, 6–8 pm" value="${esc(m.availability || "")}" required></label>
    </div>
    <label class="f">Short bio<textarea class="input" name="bio" required>${esc(m.bio || "")}</textarea></label>
    <label class="f">Success stories<span class="hint">One per line</span><textarea class="input" name="stories">${esc((m.stories || []).join("\n"))}</textarea></label>`;
}

async function handleAuth(form) {
  const type = form.dataset.type, mode = form.dataset.mode, errEl = $("[data-err]", form);
  const f = Object.fromEntries(new FormData(form).entries());
  const email = (f.email || "").trim().toLowerCase();
  errEl.innerHTML = "";
  if (!validEmail(email)) { errEl.textContent = "Enter a valid email address."; return; }
  const table = type === "student" ? db().students : db().mentors;
  const other = type === "student" ? db().mentors : db().students;
  const user = table.find(u => u.email === email);
  const next = new URLSearchParams(location.hash.split("?")[1] || "").get("next");
  if (mode === "login") {
    if (!user) {
      if (other.find(u => u.email === email)) errEl.innerHTML = `That email is a ${type === "student" ? "mentor" : "student"} account. Use the <a href="#/${type === "student" ? "m" : "s"}/login">${type === "student" ? "mentor" : "student"} portal</a> to log in with it.`;
      else errEl.innerHTML = `No ${type} account uses that email on this device. Check the spelling, or <button type="button" class="linkbtn" data-act="auth-mode" data-type="${type}" data-mode="signup">create an account</button>.`;
      return;
    }
    if (await hashPass(f.password || "", user.salt) !== user.passHash) { errEl.textContent = "That password is not right. Try again."; return; }
    user.lastLogin = Date.now(); save();
    session.set(type, user.id);
    toast("Welcome back, " + user.name.split(" ")[0] + "!");
    return go(next || (type === "student" ? "/s" : "/m"));
  }
  // create account
  if (user) { errEl.innerHTML = `That email already has a ${type} account. <button type="button" class="linkbtn" data-act="auth-mode" data-type="${type}" data-mode="login">Log in instead</button>.`; return; }
  if (!f.name?.trim()) { errEl.textContent = "Enter your name."; return; }
  if ((f.password || "").length < 6) { errEl.textContent = "Use a password of at least 6 characters."; return; }
  if (f.password !== f.password2) { errEl.textContent = "The two passwords do not match."; return; }
  const salt = uid("s");
  const rec = { id: uid(type === "student" ? "st" : "m"), email, name: f.name.trim(), salt, passHash: await hashPass(f.password, salt), createdAt: Date.now(), lastLogin: Date.now() };
  if (type === "mentor") {
    if (!f.skills?.trim() || !f.bio?.trim() || !f.location?.trim() || !f.availability?.trim()) { errEl.textContent = "Fill in skills, location, availability and bio so students can find you."; return; }
    rec.topics = new FormData(form).getAll("topic").filter(id => TOPIC(id)?.cat === f.category);
    Object.assign(rec, { category: f.category, skills: f.skills.split(",").map(s => s.trim()).filter(Boolean), experience: Math.max(0, +f.experience || 0), mode: f.mode, location: f.location.trim(), availability: f.availability.trim(), bio: f.bio.trim(), stories: (f.stories || "").split("\n").map(s => s.trim()).filter(Boolean) });
  }
  table.push(rec); save();
  session.set(type, rec.id); authMode[type] = "login";
  toast("Account created. Welcome, " + rec.name.split(" ")[0] + "!");
  go(next || (type === "student" ? "/s" : "/m"));
}
