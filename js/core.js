"use strict";
/* Core: utilities, local database, sessions */
/* ============================================================
   LEARN BRIDGE — Student & Mentor portal (single-file app)
   Storage: localStorage (JSON "tables") + IndexedDB (recordings)
   ============================================================ */

const DB_KEY = "learnbridge_db_v1";
const SESS = { student: "learnbridge_session_student", mentor: "learnbridge_session_mentor" };

/* ---------- utilities ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = (p) => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nl2br = (v) => esc(v).replace(/\n/g, "<br>");
const fmtDate = (t) => new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const ago = (t) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago";
  return Math.floor(s / 86400) + " d ago";
};
const mmss = (sec) => { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), s = sec % 60; return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"); };
const initials = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(-2).map(w => w[0]).join("").toUpperCase();
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function toast(msg, ms = 3200) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), ms);
}

/* ---------- database (localStorage) ---------- */
function emptyDb() {
  return { students: [], mentors: [], mentorships: [], tasks: [], submissions: [], mentorNotes: [], notifications: [], practice: [], materials: [], media: [], results: [] };
}
let _db = null;
function db() {
  if (_db) return _db;
  try { _db = JSON.parse(localStorage.getItem(DB_KEY) || "null"); } catch (e) { _db = null; }
  if (!_db) _db = emptyDb();
  const base = emptyDb();
  for (const k in base) if (!(k in _db)) _db[k] = base[k];
  return _db;
}
function save() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(_db)); }
  catch (e) { toast("Could not save: browser storage is full or blocked."); }
}
function reloadDb() { _db = null; return db(); }

/* ---------- password hashing ---------- */
async function hashPass(pass, salt) {
  const data = new TextEncoder().encode(salt + "::" + pass);
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 5381; for (const b of data) h = ((h << 5) + h + b) >>> 0; return "djb2_" + h.toString(16);
}

/* ---------- categories & content ---------- */
const CATS = {
  music: { key: "music", name: "Music", emoji: "🎵", blurb: "Play piano, guitar, violin and drum kit in the browser, read notes, train your ear, record what you play and get feedback from a mentor.",
    tagline: "Piano, guitar, violin and drum kit" },
  speaking: { key: "speaking", name: "Public Speaking & Communication", short: "Speaking", emoji: "🎤", blurb: "Timed speaking practice with a paragraph for every task: the timer counts you in, records your audio or video, and stops automatically.",
    tagline: "Self introduction, presentations, debate, interviews and pronunciation" },
  python: { key: "python", name: "Python", emoji: "🐍", blurb: "Type Python, run it right here, see the output and the errors, and press Check to test your answer.",
    tagline: "Variables, loops and conditions, object oriented programming and a mini project" }
};
const catName = (k) => CATS[k]?.short || CATS[k]?.name || k;

const RAGAS = ["Mayamalavagowla", "Shankarabharanam", "Kalyani", "Mohanam", "Hamsadhwani", "Kharaharapriya", "Hindolam", "Yaman", "Bhairav", "Bhupali", "Bageshri"];
const TALAS = [
  ["Adi", "8 beats: laghu (4) + dhrutam (2) + dhrutam (2)"],
  ["Rupaka", "3 beats (6 in some schools): dhrutam + laghu"],
  ["Misra Chapu", "7 beats, counted 3 + 2 + 2"],
  ["Khanda Chapu", "5 beats, counted 2 + 3"],
  ["Teentaal", "16 beats in four vibhags of 4"],
  ["Ektaal", "12 beats in six vibhags of 2"],
  ["Jhaptaal", "10 beats, counted 2 + 3 + 2 + 3"],
  ["Dadra", "6 beats, counted 3 + 3"],
  ["Keherwa", "8 beats, counted 4 + 4"]
];
const PITCHES = [
  ["C (1 kattai)", 261.63], ["C# (1½ kattai)", 277.18], ["D (2 kattai)", 293.66], ["D# (2½ kattai)", 311.13],
  ["E (3 kattai)", 329.63], ["F (4 kattai)", 349.23], ["F# (4½ kattai)", 369.99], ["G (5 kattai)", 392.0],
  ["G# (5½ kattai)", 415.3], ["A (6 kattai)", 440.0], ["A# (6½ kattai)", 466.16], ["B (7 kattai)", 493.88]
];

const IMPROMPTU = [
  "A skill you learned without a teacher", "The best advice you ignored", "Why every city needs more trees",
  "A small habit that changed your week", "Should homework exist?", "Your favourite place at dusk",
  "What makes a good team-mate", "A tool you could not live without", "Explain your hometown to a visitor",
  "The most useful mistake you made", "If you ran your school for a day", "Why people love music they grew up with",
  "Online classes versus classroom learning", "A festival you look forward to", "One thing you would teach every child"
];

/* ---------- data helpers ---------- */
const getStudent = (id) => db().students.find(s => s.id === id);
const getMentor = (id) => db().mentors.find(m => m.id === id);
const getMs = (id) => db().mentorships.find(m => m.id === id);
const getTask = (id) => db().tasks.find(t => t.id === id);
const msTasks = (msId) => db().tasks.filter(t => t.mentorshipId === msId).sort((a, b) => b.createdAt - a.createdAt);
const taskSubs = (taskId) => db().submissions.filter(s => s.taskId === taskId).sort((a, b) => b.createdAt - a.createdAt);
function notify(userType, userId, text, link) {
  db().notifications.push({ id: uid("n"), userType, userId, text, link: link || "", read: false, createdAt: Date.now() });
}
function myNotifs(type, id) { return db().notifications.filter(n => n.userType === type && n.userId === id).sort((a, b) => b.createdAt - a.createdAt); }
function progressOf(msId) {
  const tasks = msTasks(msId);
  const reviewed = tasks.filter(t => t.status === "reviewed").length;
  const scores = db().submissions.filter(s => s.mentorshipId === msId && typeof s.score === "number").map(s => s.score);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const secs = db().submissions.filter(s => s.mentorshipId === msId).reduce((a, s) => a + (s.practiceSeconds || 0), 0);
  return { total: tasks.length, reviewed, pct: tasks.length ? Math.round(reviewed / tasks.length * 100) : 0, avg, minutes: Math.round(secs / 60) };
}
function mentorRating(mId) {
  const ms = db().mentorships.filter(m => m.mentorId === mId);
  const active = ms.filter(m => m.status === "active").length;
  const total = ms.filter(m => m.status === "active" || m.status === "ended").length;
  return { active, total };
}
function createTaskFromTemplate(ms, tpl, extra = {}) {
  const t = {
    id: uid("t"), mentorshipId: ms.id, category: ms.category, exId: tpl.id || null, topicId: tpl.topicId || null,
    kind: tpl.kind || "Task", title: tpl.title, desc: tpl.desc, starter: tpl.starter || "",
    minutes: tpl.minutes || 0, files: tpl.files || [],
    status: "assigned", createdAt: Date.now(), ...extra
  };
  db().tasks.push(t);
  return t;
}
/* ---------- sessions (separate for each portal) ---------- */
const session = {
  get(type) { const id = localStorage.getItem(SESS[type]); if (!id) return null; return type === "student" ? getStudent(id) : getMentor(id); },
  set(type, id) { localStorage.setItem(SESS[type], id); },
  clear(type) { localStorage.removeItem(SESS[type]); }
};
