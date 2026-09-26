/* ============================================================
   아이 공부방용 일기장 모듈
   공부방 페이지에 이렇게 넣으면 돼요:

   <div id="diary"></div>
   <script type="module">
     import { mountKidDiary } from "./kid-diary.js";
     mountKidDiary({ el: "#diary", kid: "dojin", firebaseConfig: { ... } });
   </script>

   공부방이 이미 같은 파이어베이스(10.12.2 CDN)를 쓰고 있으면
   firebaseConfig 는 빼도 돼요. 이미 켜 둔 앱을 그대로 써요.
   ============================================================ */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where,
  arrayUnion, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const SPELL_API = "https://family-spell.bellachord.workers.dev";
const DUE_HOUR = 20;   // 저녁 8시 전에 쓰기

export const KIDS = {
  dojin: {
    name: "도진", emoji: "🐣", color: "#7CC68A", level: "grade2", grade: "2학년", goal: 60, fs: "1.3rem", autoFix: true,
    questions: [
      "오늘 제일 재미있었던 일은 뭐였나요?", "오늘 먹은 것 중에 제일 맛있었던 건?",
      "오늘 친구랑 무엇을 하고 놀았나요?", "오늘 새로 알게 된 것은?",
      "오늘 기분이 어땠나요? 왜 그랬을까요?", "내가 동물이 된다면 무엇이 되고 싶나요?",
      "오늘 가족에게 고마웠던 일은?", "오늘 본 것 중에 신기했던 것은?"
    ]
  },
  doyun: {
    name: "도윤", emoji: "🐯", color: "#6FA3E6", level: "grade4", grade: "4학년", goal: 150, fs: "1.18rem",
    questions: [
      "오늘 가장 기억에 남는 장면을 자세히 써 볼까요?", "오늘 배운 것 중 더 알고 싶은 것은?",
      "속상했던 일이 있었다면, 다음엔 어떻게 해 보고 싶나요?", "요즘 내가 열심히 하고 있는 것은?",
      "친구에게 꼭 해 주고 싶은 말은?", "내가 선생님이라면 내일 무엇을 가르치고 싶나요?",
      "오늘의 나를 칭찬해 준다면?", "10년 뒤의 나에게 한마디!"
    ]
  }
};
const MOM = { name: "엄마", emoji: "🌷", color: "#E6A3B8" };
const WHO = k => k === "me" ? MOM : KIDS[k] || { name: k, emoji: "", color: "#999" };
const WEATHERS = ["☀️", "⛅", "☁️", "🌧️", "⛈️", "❄️", "🌈"];
const MOODS = ["😊", "😆", "🥰", "😐", "😢", "😠", "😴"];

/* ---------- 도우미 ---------- */
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const fmtDate = s => { const d = parseYmd(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일`; };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const toMs = v => !v ? 0 : typeof v === "number" ? v : v.toMillis ? v.toMillis() : Date.parse(v) || 0;
const countChars = s => s.replace(/\s/g, "").length;
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const hasBatchim = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c % 28 !== 0; };
const call = name => name + (hasBatchim(name) ? "아" : "야");
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k){ try { localStorage.removeItem(k); } catch {} }
};
function getDb(firebaseConfig){
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app);
}

/* 공부방에서 퀴즈를 다 풀었을 때 불러 주세요. 엄마 화면 '아이들 현황'에 공부한 시각이 떠요. */
export async function markStudied(kid, firebaseConfig){
  await setDoc(doc(getDb(firebaseConfig), "diaryStatus", kid), { lastStudyAt: serverTimestamp() }, { merge: true });
}

/* ---------- 스타일 (공부방 스타일과 섞이지 않게 .kd 안에서만) ---------- */
const CSS = `
.kd{ --paper:#FFFDF6; --card:#fff; --ink:#2B3557; --soft:#6B7394; --line:#CFE0EE; --red:#E0555E; --yellow:#F6C945; --ok:#3F8F60;
  font-family:'OwnglyphYuntaeng','Gaegu','Jua',sans-serif; font-size:var(--kfs); line-height:1.6; color:var(--ink);
  background:var(--paper); border-radius:18px; padding:18px; box-shadow:0 3px 0 #E3E8EF, 0 10px 30px rgba(20,30,60,.08);
  max-width:760px; margin:0 auto; position:relative; }
.kd *{ box-sizing:border-box; }
.kd button,.kd input,.kd textarea{ font:inherit; color:inherit; }
.kd button{ cursor:pointer; }
.kd :focus-visible{ outline:3px solid var(--yellow); outline-offset:2px; }
.kd .hide{ display:none !important; }
.kd-head{ display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
.kd-head .face{ width:46px; height:46px; border-radius:50%; background:var(--kc); display:grid; place-items:center; font-size:1.5em; }
.kd-head h2{ margin:0; font-size:1.4em; line-height:1.1; }
.kd-head .streak{ margin-left:auto; background:color-mix(in srgb, var(--yellow) 30%, #fff); border-radius:999px; padding:2px 12px; font-size:.9em; }
.kd-tabs{ display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
.kd-tabs button{ border:2px solid var(--line); background:#fff; border-radius:999px; padding:4px 14px; }
.kd-tabs button.on{ background:var(--kc); border-color:var(--kc); color:#fff; font-weight:700; }
.kd-nudge{ background:#FFF3C7; border:2px solid var(--yellow); border-radius:14px; padding:10px 14px; margin-bottom:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; animation:kdwig .6s ease 2; }
.kd-nudge b{ flex:1; min-width:180px; }
@keyframes kdwig{ 0%,100%{transform:rotate(0)} 25%{transform:rotate(-1deg)} 75%{transform:rotate(1deg)} }
.kd-btn{ border:2px solid var(--ink); background:#fff; border-radius:12px; padding:6px 14px; }
.kd-btn.main{ background:var(--kc); border-color:var(--kc); color:#fff; font-weight:700; }
.kd-btn.red{ border-color:var(--red); color:var(--red); }
.kd-btn:disabled{ opacity:.5; cursor:wait; }
.kd-btn.locked{ opacity:.6; cursor:not-allowed; border-style:dashed; }
.kd-acts [data-kd=autosave]{ align-self:center; }
.kd-soft{ color:var(--soft); font-size:.85em; }
.kd-row{ display:flex; flex-wrap:wrap; gap:10px 16px; align-items:center; margin-bottom:10px; }
.kd-days button{ border:2px solid var(--line); background:#fff; border-radius:10px; padding:2px 12px; }
.kd-days button.on{ border-color:var(--kc); background:color-mix(in srgb, var(--kc) 18%, #fff); font-weight:700; }
.kd-pick{ display:flex; gap:2px; align-items:center; flex-wrap:wrap; }
.kd-pick span{ margin-right:4px; }
.kd-pick button{ border:2px solid transparent; background:none; border-radius:10px; font-size:1.35em; line-height:1; padding:4px; }
.kd-pick button.on{ border-color:var(--red); background:#FDECEC; }
.kd-q{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; border-left:5px solid var(--yellow); background:#FFF8DD; padding:8px 12px; border-radius:0 12px 12px 0; margin-bottom:10px; }
.kd-q .q{ flex:1; min-width:180px; }
.kd-q label{ font-size:.85em; display:flex; gap:4px; align-items:center; }
.kd-q button{ background:none; border:none; font-size:.85em; color:var(--soft); text-decoration:underline; }
.kd-title{ width:100%; border:none; border-bottom:2px solid var(--line); background:transparent; padding:4px 2px; font-size:1.1em; margin-bottom:10px; }
.kd-editor{ position:relative; background:#fff; border-radius:6px; }
.kd-hl{ position:absolute; inset:0; padding:4px 12px 4px 56px; line-height:40px; white-space:pre-wrap; overflow-wrap:break-word; word-break:normal; color:transparent; pointer-events:none; overflow:hidden; }
.kd-hl mark{ color:transparent; background:rgba(255,222,70,.8); border-radius:4px; }
.kd-hl mark.done{ background:rgba(110,210,140,.5); }
.kd .hl-fix{ background:rgba(255,222,70,.8); border-radius:4px; padding:0 3px; }
.kd .hl-done{ background:rgba(110,210,140,.5); border-radius:4px; padding:0 3px; }
.kd-lined{ position:relative; display:block; width:100%; min-height:300px; resize:none; overflow:hidden; border:none; border-radius:6px; padding:4px 12px 4px 56px; line-height:40px; white-space:pre-wrap; overflow-wrap:break-word; word-break:normal;
  background-color:transparent; background-attachment:local;
  background-image:linear-gradient(to right, transparent 44px, var(--red) 44px, var(--red) 46px, transparent 46px),
    repeating-linear-gradient(to bottom, transparent 0 39px, var(--line) 39px 40px);
  outline:1px solid var(--line); }
.kd-gauge{ display:flex; align-items:center; gap:10px; margin:10px 0 12px; }
.kd-gauge .bar{ flex:1; height:14px; border-radius:999px; background:var(--line); overflow:hidden; }
.kd-gauge i{ display:block; height:100%; width:0; background:var(--yellow); border-radius:999px; transition:width .25s; }
.kd-gauge.full i{ background:var(--ok); }
.kd-acts{ display:flex; flex-wrap:wrap; gap:8px; }
.kd-acts .main{ margin-left:auto; }
.kd-pen{ margin-top:16px; border:2.5px solid var(--red); border-radius:16px; padding:14px 16px; background:#fff; }
.kd-pen h3{ margin:0 0 6px; color:var(--red); font-size:1.15em; }
.kd-pen .praise{ background:#EEF8F0; border-radius:10px; padding:6px 10px; margin:6px 0 10px; }

.kd-pen mark{ background:none; color:inherit; padding:0 4px; border:2px solid var(--red); border-radius:48% 52% 45% 55% / 55% 45% 55% 45%; }
.kd-pen mark sup{ color:var(--red); font-weight:700; }
.kd-pen ol{ margin:0; padding-left:1.5em; }
.kd-pen li{ margin-bottom:10px; }
.kd-pen .chip{ display:inline-block; font-size:.75em; border-radius:999px; padding:0 8px; margin-right:4px; background:#FDECEC; color:var(--red); }
.kd-pen .ans{ margin-top:4px; padding:6px 10px; border-radius:10px; background:#F4F7FB; }
.kd-pen .wrong{ color:var(--red); text-decoration:line-through; }
.kd-pen .right{ color:var(--ok); font-weight:700; }
.kd-pen .mini{ border:1.5px dashed var(--soft); background:none; border-radius:8px; font-size:.8em; padding:0 8px; margin:4px 4px 0 0; }
.kd-pen li.done{ opacity:.75; }
.kd-pen .good{ color:var(--ok); font-weight:700; }
.kd-list article{ border-bottom:1.5px dashed var(--line); padding:12px 0; position:relative; }
.kd-list .meta{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:.88em; color:var(--soft); }
.kd-list .meta b{ color:var(--c); }
.kd-list h4{ margin:4px 0; }
.kd-list .body{ white-space:pre-wrap; }
.kd-stamp{ float:right; transform:rotate(-12deg); color:var(--red); border:3px double var(--red); border-radius:50%; width:70px; height:70px;
  display:grid; place-items:center; text-align:center; font-size:.75em; line-height:1.1; font-weight:700; margin:0 0 6px 8px; }
.kd-cmts{ margin-top:6px; font-size:.9em; }
.kd-cmts p{ margin:2px 0; }
.kd-cmt{ display:flex; gap:4px; margin-top:4px; }
.kd-cmt input{ flex:1; min-width:0; border:none; border-bottom:1.5px solid var(--line); background:transparent; padding:2px; }
.kd-cmt button{ border:none; background:none; color:var(--soft); }
.kd-heart{ border:none; background:none; font-size:1.1em; padding:0; }
.kd-toast{ position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:var(--ink); color:#fff; padding:8px 18px; border-radius:999px; z-index:999; max-width:90vw; text-align:center; font-family:inherit; }
.kd-party{ text-align:center; padding:30px 10px; }
.kd-party .big{ font-size:3em; }
.kd-party p{ margin:6px 0; }
.kd-rain{ position:fixed; top:-3rem; z-index:998; pointer-events:none; animation:kdrain 3s linear forwards; }
@keyframes kdrain{ to{ transform:translateY(110vh) rotate(360deg); } }
@media (max-width:600px){ .kd{ padding:12px; } .kd-hl{ padding-left:44px; } .kd-lined{ padding-left:44px; background-image:linear-gradient(to right, transparent 34px, var(--red) 34px, var(--red) 36px, transparent 36px), repeating-linear-gradient(to bottom, transparent 0 39px, var(--line) 39px 40px); } }
@media (prefers-reduced-motion:reduce){ .kd *{ animation:none !important; transition:none !important; } }
`;
function injectStyle(){
  if (document.getElementById("kd-style")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Jua&display=swap";
  const st = document.createElement("style"); st.id = "kd-style"; st.textContent = CSS;
  document.head.append(link, st);
}

/* ============================================================
   일기장 붙이기
   ============================================================ */
export function mountKidDiary({ el, kid, firebaseConfig, spellApi = SPELL_API }){
  const P = KIDS[kid];
  if (!P) throw new Error("kid 는 dojin 또는 doyun 이어야 해요");
  injectStyle();
  const db = getDb(firebaseConfig);
  const root = typeof el === "string" ? document.querySelector(el) : el;

  const S = {
    view: "write", date: today(), entries: {}, status: {}, loaded: false,
    weather: "", mood: "", qShift: 0, spell: null, found: 0, dirty: false, cloud: null, checking: false, spellFailed: false, step: null
  };
  const keyOf = (date, w) => `${date}_${w}`;
  const mine = () => S.entries[keyOf(S.date, kid)];
  const draftKey = () => `kd_draft_${kid}_${S.date}`;
  const $ = s => root.querySelector(s);

  root.innerHTML = `<div class="kd" style="--kc:${P.color}; --kfs:${P.fs}">
    <div class="kd-head"><span class="face">${P.emoji}</span>
      <div><h2>${P.name}의 일기장</h2><span class="kd-soft">${P.grade} · ${fmtDate(today())}</span></div>
      <span class="streak" data-kd="streak"></span></div>
    <div data-kd="nudge"></div>
    <nav class="kd-tabs">
      <button data-a="view" data-v="write">✏️ 일기 쓰기</button>
      <button data-a="view" data-v="mine">📔 내 일기장</button>
      <button data-a="view" data-v="mom">🌷 엄마 일기</button>
    </nav>
    <div data-kd="main"></div></div>`;

  let toastTimer;
  function toast(msg){
    let t = document.querySelector(".kd-toast");
    if (!t){ t = document.createElement("div"); t.className = "kd-toast"; document.body.append(t); }
    t.textContent = msg; t.classList.remove("hide");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hide"), 2800);
  }
  /* 우리 아이들은 칭찬을 좋아해요 */
  const one = a => a[Math.floor(Math.random() * a.length)];
  const PRAISE_FIX = ["✨ 정확해요! 멋지게 고쳤어요!", "👍 우와, 잘 고쳤어요!", "💯 딱 맞았어요!", "🌟 역시 최고예요!", "😎 고치는 솜씨가 수준급이에요!"];
  const PRAISE_SELF = ["👍 스스로 찾아서 고쳤어요! 정말 대단해요!", "🦸 혼자 고치다니, 맞춤법 영웅이에요!", "🧠 똑똑해요! 선생님 도움 없이 고쳤어요!", "🏅 스스로 고치기 성공! 박수 짝짝짝!"];
  const PRAISE_DONE = ["오늘도 멋진 일기를 완성했어요!", "글 솜씨가 쑥쑥 자라고 있어요!", "끝까지 해낸 게 정말 자랑스러워요!", "엄마가 읽으면 정말 기뻐할 거예요!", "오늘 하루를 멋지게 기록했어요!"];
  const STEPS = [[.25, "👏 좋아요, 잘 시작했어요!"], [.5, "🌱 벌써 절반! 멋져요!"], [.75, "🔥 거의 다 왔어요! 조금만 더!"], [1, "🌟 목표 달성! 정말 대단해요! 이제 빨간펜을 불러 볼까요?"]];
  function confetti(){
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const E = ["🎉", "🎊", "⭐", "🌟", "💖", "👏", "✨", "🥳", "🏆", "🌈"];
    for (let i = 0; i < 30; i++){
      const s = document.createElement("span"); s.className = "kd-rain"; s.textContent = one(E);
      s.style.left = Math.random() * 96 + "vw"; s.style.animationDelay = Math.random() * 1.5 + "s"; s.style.fontSize = 1.3 + Math.random() * 1.5 + "rem";
      document.body.append(s); setTimeout(() => s.remove(), 4500);
    }
  }

  /* ---------- 데이터 ---------- */
  onSnapshot(query(collection(db, "diary"), where("date", ">=", addDays(today(), -45))), snap => {
    S.entries = {};
    snap.forEach(d => { S.entries[d.id] = { id: d.id, ...d.data() }; });
    S.loaded = true; refresh();
  }, err => toast("일기장을 열지 못했어요. 엄마에게 말해 주세요. (" + err.code + ")"));
  onSnapshot(doc(db, "diaryStatus", kid), d => { S.status = d.data() || {}; renderNudge(); }, () => {});
  onSnapshot(doc(db, "diaryDraft", kid), d => {
    S.cloud = d.data() || null;
    if (S.view === "write" && !S.dirty && S.loaded) renderWrite();
  }, () => {});

  function streak(){
    let d = today(); if (!S.entries[keyOf(d, kid)]) d = addDays(d, -1);
    let n = 0; while (S.entries[keyOf(d, kid)]){ n++; d = addDays(d, -1); }
    return n;
  }
  function refresh(){
    const n = streak();
    $("[data-kd=streak]").textContent = n ? `🔥 ${n}일 연속!` : "🔥 오늘부터 시작!";
    renderNudge();
    if (S.view === "write"){ if (!S.dirty) renderWrite(); }
    else render();
  }
  function render(){
    root.querySelectorAll(".kd-tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === S.view));
    if (S.view === "write") renderWrite();
    else if (S.view === "mine") renderList(kid);
    else renderList("me");
  }

  /* ---------- 엄마 콕! ---------- */
  function renderNudge(){
    const box = $("[data-kd=nudge]"), st = S.status, wrote = !!S.entries[keyOf(today(), kid)];
    const nudgeMs = toMs(st.nudgeAt);
    if (!wrote && nudgeMs && !st.nudgeSeen && ymd(new Date(nudgeMs)) === today()){
      box.innerHTML = `<div class="kd-nudge"><span style="font-size:1.6em">💌</span><b>엄마가 콕! ${esc(st.nudgeMsg || `${call(P.name)}, 오늘 일기 써 볼까?`)}</b>
        <button class="kd-btn main" data-a="nudge-ok">알겠어요!</button></div>`;
    } else if (!wrote && S.loaded && S.date === today()){
      const now = new Date(), left = DUE_HOUR * 60 - (now.getHours() * 60 + now.getMinutes());
      const msg = left <= 0 ? "🚨 8시가 지났어요! 한 줄이라도 지금 바로 써요."
        : left <= 90 ? `⏰ 일기 마감(저녁 8시)까지 ${left >= 60 ? Math.floor(left / 60) + "시간 " : ""}${left % 60}분 남았어요!`
        : "📔 오늘 일기는 저녁 8시 전에 써요!";
      box.innerHTML = `<div class="kd-nudge" style="${left <= 0 ? "" : "animation:none;"}${left <= 0 ? "border-color:var(--red);background:#FFE1E1" : ""}"><b>${msg}</b></div>`;
    } else box.innerHTML = "";
  }

  /* ---------- 쓰기 ---------- */
  const question = () => P.questions[(hash(S.date + kid) + S.qShift) % P.questions.length];
  // 쓰던 글: 이 기기(localStorage)와 파이어베이스(diaryDraft/{아이}) 두 곳에 저장해요. 더 최근 것을 불러와요.
  function pickDraft(e){
    const local = store.get(draftKey());
    const cloud = S.cloud && S.cloud.date === S.date ? S.cloud : null;
    const d = [local, cloud].filter(x => x && x.content).sort((a, b) => (b.at || 0) - (a.at || 0))[0];
    if (!d || d.content === e.content) return null;
    if (e.content && (d.at || 0) < toMs(e.updatedAt)) return null;   // 저장한 일기가 더 새것이면 그걸 보여줘요
    return d;
  }
  function renderWrite(){
    root.querySelectorAll(".kd-tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === "write"));
    const e = mine() || {};
    const draft = pickDraft(e);
    const useDraft = !!draft;
    const src = useDraft ? draft : e;
    S.weather = src.weather || ""; S.mood = src.mood || ""; S.spell = null; S.found = e.spellFound || 0;
    const q = e.question || question();
    const t = today(), y = addDays(t, -1);
    $("[data-kd=main]").innerHTML = `
      <div class="kd-row">
        <div class="kd-days">
          <button data-a="date" data-v="${t}" class="${S.date === t ? "on" : ""}">오늘</button>
          <button data-a="date" data-v="${y}" class="${S.date === y ? "on" : ""}">어제</button>
        </div>
        <b>${fmtDate(S.date)}</b>
        <span class="kd-soft">${useDraft ? "📝 쓰던 일기를 그대로 불러왔어요" : e.content ? "✅ 저장한 일기예요. 고쳐서 다시 저장할 수 있어요" : ""}</span>
      </div>
      <div class="kd-row">
        <div class="kd-pick"><span>날씨</span>${WEATHERS.map(v => `<button data-a="weather" data-v="${v}" class="${S.weather === v ? "on" : ""}">${v}</button>`).join("")}</div>
        <div class="kd-pick"><span>기분</span>${MOODS.map(v => `<button data-a="mood" data-v="${v}" class="${S.mood === v ? "on" : ""}">${v}</button>`).join("")}</div>
      </div>
      <div class="kd-q"><span>💡</span><span class="q" data-kd="q">${esc(q)}</span>
        <label><input type="checkbox" data-kd="useq" ${e.question ? "checked" : ""}> 이 질문으로 쓸래요</label>
        <button data-a="q-next">다른 질문</button></div>
      <input class="kd-title" data-kd="title" placeholder="제목" maxlength="40" value="${esc(src.title || "")}">
      <div class="kd-editor"><div class="kd-hl" data-kd="hl" aria-hidden="true"></div><textarea class="kd-lined" data-kd="content" placeholder="오늘 있었던 일을 적어 보세요.">${esc(src.content || "")}</textarea></div>
      <div class="kd-gauge" data-kd="gauge"><span>✏️</span><div class="bar"><i></i></div><span class="kd-soft" data-kd="gtxt"></span></div>
      <div class="kd-acts">
        <span class="kd-soft" data-kd="autosave"></span>
        <button class="kd-btn red" data-a="spell">🖍 빨간펜 검사</button>
        <button class="kd-btn main" data-a="save">💾 다 썼어요!</button>
      </div>
      <div data-kd="pen"></div>`;
    S.dirty = useDraft; S.step = null;
    gauge(); drawHL();
  }
  // 목표 글자 수를 다 채워야 빨간펜 선생님을 부를 수 있어요.
  function gauge(){
    const ta = $("[data-kd=content]"); if (!ta) return;
    const n = countChars(ta.value), g = P.goal;
    $("[data-kd=gauge] i").style.width = Math.min(100, n / g * 100) + "%";
    $("[data-kd=gauge]").classList.toggle("full", n >= g);
    const r = n / g;
    $("[data-kd=gtxt]").textContent = n >= g ? `🌟 ${n}자! 목표 달성!` : n === 0 ? `✏️ 첫 글자를 써 볼까요? (목표 ${g}자)`
      : r >= .75 ? `🔥 ${n} / ${g}자 · 거의 다 왔어요!` : r >= .5 ? `🌱 ${n} / ${g}자 · 절반 넘었어요!` : `${n} / ${g}자`;
    const step = STEPS.filter(([t]) => r >= t).length;   // 단계를 넘을 때마다 한 번씩 칭찬해요
    if (S.step != null && step > S.step) toast(STEPS[step - 1][1]);
    S.step = step;
    const btn = $(".kd-acts [data-a=spell]");
    if (btn && !S.checking){
      btn.disabled = n < g; btn.classList.toggle("locked", n < g);
      btn.textContent = n < g ? `🔒 빨간펜 (${g - n}자 더 쓰면 열려요)` : "🖍 빨간펜 검사";
    }
  }
  let cloudTimer = null;
  function saveDraft(){
    const c = $("[data-kd=content]"); if (!c) return;
    const d = { date: S.date, title: $("[data-kd=title]").value, content: c.value, weather: S.weather, mood: S.mood, at: Date.now() };
    store.set(draftKey(), d);
    const tag = $("[data-kd=autosave]"); if (tag) tag.textContent = "💾 저장하는 중…";
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => pushDraft(d), 2000);
  }
  function pushDraft(d){
    cloudTimer = null;
    setDoc(doc(db, "diaryDraft", kid), d)
      .then(() => { const tag = $("[data-kd=autosave]"); if (tag) tag.textContent = `💾 자동 저장됨 ${new Date().getHours()}:${pad(new Date().getMinutes())}`; })
      .catch(() => { const tag = $("[data-kd=autosave]"); if (tag) tag.textContent = "💾 이 기기에 저장됨"; });
  }
  // 창을 닫거나 다른 앱으로 넘어가도 바로 저장해요.
  function flushDraft(){
    if (!cloudTimer) return;
    clearTimeout(cloudTimer);
    const d = store.get(draftKey()); if (d) pushDraft(d);
  }
  window.addEventListener("pagehide", flushDraft);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushDraft(); });

  /* ---------- 빨간펜 선생님 ----------
     도윤(초4): 고칠 곳에 노란 형광펜 → 힌트 보고 스스로 고치기
     도진(초2): 빨간펜이 본문을 바로 고쳐 주고, 고친 곳은 초록 형광펜으로 보여 주기 */
  const ENDS = /[.?!…~。)"'”’\]]$|\p{Extended_Pictographic}$/u;
  // 틀린 곳이 아직 남았는지: '좋겠다 → 좋겠다.'처럼 고친 말이 틀린 말을 품고 있어도 정확히 가려요.
  function wrongAt(er, text){
    const off = er.right.indexOf(er.wrong);
    let i = text.indexOf(er.wrong);
    while (i >= 0){
      if (off < 0 || !text.startsWith(er.right, i - off)) return i;
      i = text.indexOf(er.wrong, i + 1);
    }
    return -1;
  }
  const isLeft = (er, text) => wrongAt(er, text) >= 0;
  // 줄 끝(문장 끝)에 마침표가 없는 곳을 직접 찾아요. 빨간펜이 놓쳐도 꼭 잡혀요.
  function periodErrors(text, known){
    const out = []; let pos = 0;
    for (const line of text.split("\n")){
      const body = line.replace(/\s+$/, ""), end = pos + body.length;
      pos += line.length + 1;
      if (countChars(body) < 4 || ENDS.test(body)) continue;
      if ([...known, ...out].some(er => { const i = wrongAt(er, text); return i >= 0 && i + er.wrong.length === end; })) continue;
      // 고칠 곳을 정확히 짚으려고, 글 전체에서 한 번만 나오는 꼬리 낱말을 골라요
      const words = [...body.matchAll(/\S+/g)];
      let tail = "";
      for (let n = 1; n <= words.length; n++){
        const t = body.slice(words[words.length - n].index);
        if (text.indexOf(t) === end - t.length && text.lastIndexOf(t) === end - t.length){ tail = t; break; }
      }
      if (!tail) continue;
      out.push({ wrong: tail, right: tail + ".", kind: "문장부호",
        hint: "문장이 끝났어요. 끝에 무엇을 찍어야 할까요?",
        why: "문장이 끝나면 마침표(.)를 찍어요. 묻는 말이면 물음표(?), 놀란 말이면 느낌표(!)예요." });
    }
    return out;
  }
  // 고친 말로 바꾸고, 다른 고친 곳들의 자리도 함께 옮겨 줘요.
  function applyOne(er){
    const ta = $("[data-kd=content]"), text = ta.value, i = wrongAt(er, text);
    if (i < 0) return;
    const delta = er.right.length - er.wrong.length;
    S.spell.errors.forEach(o => { if (o.applied && o.at > i) o.at += delta; });
    ta.value = text.slice(0, i) + er.right + text.slice(i + er.wrong.length);
    er.at = i; er.applied = true; er.shown = true;
  }
  function applyAll(){
    const ta = $("[data-kd=content]"), text = ta.value;
    const hits = S.spell.errors.map(er => ({ er, i: wrongAt(er, text) })).filter(h => h.i >= 0).sort((a, b) => a.i - b.i);
    let out = "", pos = 0;
    for (const h of hits){
      if (h.i < pos) continue;   // 겹치는 건 건너뛰어요
      out += text.slice(pos, h.i); h.er.at = out.length; out += h.er.right;
      pos = h.i + h.er.wrong.length; h.er.applied = true; h.er.shown = true;
    }
    ta.value = out + text.slice(pos);
  }

  async function spell(btn){
    const ta = $("[data-kd=content]"), text = ta.value.trim();
    if (countChars(text) < P.goal) return toast(`${P.goal}자를 다 쓰면 빨간펜 선생님을 부를 수 있어요! (지금 ${countChars(text)}자)`);
    S.checking = true; btn.disabled = true; btn.textContent = "🖍 선생님이 읽는 중…";
    try {
      const r = await fetch(spellApi, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, level: P.level, name: P.name })
      });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      const errors = (data.errors || []).filter(er => er.wrong && er.right && er.wrong !== er.right)
        .map(er => ({ ...er, shown: false, applied: false }));
      errors.push(...periodErrors(ta.value, errors).map(er => ({ ...er, shown: false, applied: false })));
      S.spell = { praise: data.praise || "", cheer: data.cheer || "", errors };
      S.found = Math.max(S.found, errors.length);
      if (P.autoFix && errors.length){ applyAll(); S.dirty = true; saveDraft(); }
      S.spell.chars = countChars(ta.value); S.spellFailed = false; S.dirty = true;
      renderPen();
      $("[data-kd=pen]").scrollIntoView({ behavior: "smooth", block: "nearest" });
      return true;
    } catch {
      S.spellFailed = true;   // 선생님이 쉬는 중이면 저장은 막지 않아요
      $("[data-kd=pen]").innerHTML = `<div class="kd-pen"><h3>빨간펜 선생님이 잠깐 쉬는 중이에요</h3>
        <p class="kd-soft">조금 있다가 다시 눌러 보세요. 일기 저장은 지금도 할 수 있어요.</p></div>`;
      return false;
    } finally { S.checking = false; gauge(); }
  }

  // 본문 칸 뒤에 형광펜을 칠해요. 노랑: 고칠 곳 · 초록: 고친 곳
  function drawHL(){
    const hl = $("[data-kd=hl]"), ta = $("[data-kd=content]"); if (!hl || !ta) return;
    const text = ta.value, spans = [];
    (S.spell?.errors || []).forEach(er => {
      let i = wrongAt(er, text), len = er.wrong.length, cls = "fix";
      if (i < 0 && er.applied){
        i = er.at != null && text.startsWith(er.right, er.at) ? er.at : text.indexOf(er.right);
        len = er.right.length; cls = "done";
      }
      if (i >= 0 && !spans.some(s => i < s.e && i + len > s.i)) spans.push({ i, e: i + len, cls });
    });
    spans.sort((a, b) => a.i - b.i);
    let html = "", pos = 0;
    spans.forEach(s => { html += esc(text.slice(pos, s.i)) + `<mark class="${s.cls}">${esc(text.slice(s.i, s.e))}</mark>`; pos = s.e; });
    hl.innerHTML = html + esc(text.slice(pos)) + " ";
    ta.style.height = "auto"; ta.style.height = Math.max(300, ta.scrollHeight) + "px";
  }

  function renderPen(){
    drawHL();
    const box = $("[data-kd=pen]"); if (!box || !S.spell) return;
    const text = $("[data-kd=content]").value;
    const { errors, praise, cheer } = S.spell;
    errors.forEach(er => { const was = er.left; er.left = isLeft(er, text); if (was && !er.left && !er.applied) toast(one(PRAISE_SELF)); });
    const left = errors.filter(er => er.left);
    const praiseHtml = praise ? `<div class="praise">👏 ${esc(praise)}</div>` : "";
    if (!errors.length){
      box.innerHTML = `<div class="kd-pen"><h3>💯 틀린 곳이 하나도 없어요!</h3>${praiseHtml}<p>${esc(cheer)}</p></div>`;
      return;
    }
    const pair = er => `<span class="wrong">${esc(er.wrong)}</span> → <span class="right">${esc(er.right)}</span>`;
    let head, sub, items;
    if (P.autoFix){
      head = `🖍 빨간펜 선생님이 ${errors.length}군데를 고쳐 줬어요`;
      sub = `<p><span class="hl-done">초록색</span>으로 칠한 곳이 고친 곳이에요. 어떻게 바뀌었는지 소리 내어 읽어 봐요!</p>
        <p class="good">${esc(cheer) || "정말 잘했어요!"} 고친 곳을 읽어 보고 💾 다 썼어요! 를 한 번 더 눌러요.</p>`;
      items = errors.map((er, i) => `<li class="${er.left ? "" : "done"}">
        ${er.kind ? `<span class="chip">${esc(er.kind)}</span>` : ""}${pair(er)}
        <br><span class="kd-soft">${esc(er.why || er.hint)}</span>
        ${er.left ? `<br><button class="mini" data-a="apply" data-i="${i}">✏️ 고치기</button>` : ""}</li>`).join("");
    } else {
      head = left.length ? `🖍 형광펜으로 칠한 곳이 ${left.length}군데 있어요` : `🎉 모두 고쳤어요!`;
      sub = left.length
        ? `<p>틀려도 괜찮아요! 고치면서 실력이 쑥쑥 자라요 🌱 일기 칸에 <span class="hl-fix">노란색</span>으로 칠한 곳을 찾아서 스스로 고쳐 보세요. 잘 모르겠으면 💡 정답 보기를 눌러요. 다 고쳐야 저장할 수 있어요!</p>`
        : `<p class="good">${esc(cheer) || "정말 멋져요!"} 이제 💾 다 썼어요! 를 눌러 저장해요.</p>`;
      items = errors.map((er, i) => `<li class="${er.left ? "" : "done"}">
        ${er.kind ? `<span class="chip">${esc(er.kind)}</span>` : ""}
        ${er.left ? `<span class="hl-fix">${esc(er.wrong)}</span> ${esc(er.hint)}`
          : er.applied ? `<span class="good">✅ 고쳤어요</span> <span class="kd-soft">${esc(er.wrong)} → ${esc(er.right)}</span>`
          : `<span class="good">👍 스스로 고쳤어요!</span> <span class="kd-soft">${esc(er.right)}</span>`}
        ${er.left ? `<div><button class="mini" data-a="find" data-i="${i}">👀 찾기</button>${er.shown
            ? `<div class="ans">${pair(er)}<br><span class="kd-soft">${esc(er.why)}</span><br>
                <button class="mini" data-a="apply" data-i="${i}">✏️ 이렇게 고칠래요</button></div>`
            : `<button class="mini" data-a="reveal" data-i="${i}">💡 정답 보기</button>`}</div>` : ""}
      </li>`).join("");
    }
    box.innerHTML = `<div class="kd-pen"><h3>${head}</h3>${praiseHtml}${sub}<ol>${items}</ol>
      ${left.length && !P.autoFix ? `<div style="text-align:right;margin-top:8px"><button class="kd-btn" data-a="spell">🔁 다시 검사</button></div>` : ""}
    </div>`;
  }
  function spellResult(){
    if (!S.spell) return {};
    const text = $("[data-kd=content]").value, errs = S.spell.errors;
    return {
      spellChecked: true, spellFound: S.found, spellAuto: !!P.autoFix,
      spellLeft: errs.filter(er => isLeft(er, text)).length,
      spellSelf: errs.filter(er => !isLeft(er, text) && !er.applied && !er.shown).length
    };
  }

  /* ---------- 저장 ---------- */
  async function save(btn){
    const ta = $("[data-kd=content]"), text = ta.value.trim(), n0 = countChars(text);
    if (!text) return toast("일기를 먼저 써 주세요 ✏️");
    if (n0 < P.goal) return toast(`💪 조금만 더! ${P.goal - n0}자만 더 쓰면 완성이에요!`);
    // 빨간펜을 안 불렀거나, 검사 뒤에 새로 많이 썼으면 빨간펜부터
    if (!S.spellFailed && (!S.spell || n0 > S.spell.chars + 10)){
      toast("🖍 저장하기 전에 빨간펜 선생님이 먼저 읽어 볼게요!");
      const ok = await spell($(".kd-acts [data-a=spell]"));
      if (ok && S.spell.errors.length) return;   // 고친 곳을 보고 다시 눌러요
      if (!ok && !S.spellFailed) return;
    }
    const left = S.spell ? S.spell.errors.filter(er => isLeft(er, ta.value)).length : 0;
    if (left){
      toast(`✏️ 노란 형광펜 ${left}군데만 고치면 저장할 수 있어요! 거의 다 왔어요 💪`);
      $("[data-kd=pen]").scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    const id = keyOf(S.date, kid), exists = !!S.entries[id];
    const days = streak() + (exists || S.date !== today() ? 0 : 1);
    btn.disabled = true;
    try {
      await setDoc(doc(db, "diary", id), {
        author: kid, date: S.date, weather: S.weather, mood: S.mood,
        title: $("[data-kd=title]").value.trim(), content: text, chars: countChars(text),
        question: $("[data-kd=useq]").checked ? $("[data-kd=q]").textContent : "",
        updatedAt: serverTimestamp(), ...spellResult(),
        ...(exists ? {} : { createdAt: serverTimestamp(), comments: [], hearts: {} })
      }, { merge: true });
      store.del(draftKey()); clearTimeout(cloudTimer); cloudTimer = null; S.dirty = false;
      if (S.cloud && S.cloud.date === S.date) deleteDoc(doc(db, "diaryDraft", kid)).catch(() => {});
      const n = countChars(text);
      const fixed = S.spell ? S.spell.errors.length : 0;
      $("[data-kd=main]").innerHTML = `<div class="kd-party"><div class="big">🎉</div>
        <h3>${exists ? `고친 일기를 저장했어요! ${one(PRAISE_DONE)}` : `${call(P.name)}, 일기 완성! ${one(PRAISE_DONE)}`}</h3>
        <p>✏️ ${n}자를 썼어요. ${n >= P.goal * 1.5 ? "목표를 훌쩍 넘었어요, 대단해요!" : "목표 달성!"}</p>
        <p>${fixed ? `🖍 빨간펜이랑 ${fixed}군데를 고쳐서 글이 반짝반짝해졌어요!` : "💯 틀린 곳 하나 없이 썼어요. 맞춤법 왕이에요!"}</p>
        ${days >= 2 ? `<p>🔥 ${days}일 연속 일기! 대단한 끈기예요!</p>` : ""}
        <p>엄마가 곧 읽고 도장 찍어 줄 거예요 🌷</p>
        <button class="kd-btn" data-a="view" data-v="mine">📔 내 일기장 보기</button>
        <button class="kd-btn" data-a="view" data-v="mom">🌷 엄마 일기 읽기</button></div>`;
      confetti();
      if (S.status.nudgeAt && !S.status.nudgeSeen) setDoc(doc(db, "diaryStatus", kid), { nudgeSeen: true }, { merge: true }).catch(() => {});
    } catch (err){
      toast("저장하지 못했어요. 엄마에게 알려 주세요 (" + err.code + ")");
    } finally { btn.disabled = false; }
  }

  /* ---------- 내 일기장 · 엄마 일기 ---------- */
  function renderList(author){
    const list = Object.values(S.entries).filter(e => e.author === author).sort((a, b) => b.date.localeCompare(a.date));
    const who = WHO(author);
    $("[data-kd=main]").innerHTML = `<div class="kd-list">${list.length ? list.map(e => {
      const hearts = e.hearts || {};
      const heartBy = Object.keys(hearts).filter(k => hearts[k]).map(k => WHO(k).name);
      return `<article style="--c:${who.color}">
        ${e.stamp ? `<div class="kd-stamp">${esc(e.stamp)}</div>` : ""}
        <div class="meta"><b>${who.emoji} ${who.name}</b><span>${fmtDate(e.date)}</span><span>${e.weather || ""}${e.mood || ""}</span></div>
        ${e.question ? `<div class="kd-soft">💡 ${esc(e.question)}</div>` : ""}
        ${e.title ? `<h4>${esc(e.title)}</h4>` : ""}
        <div class="body">${esc(e.content)}</div>
        <div class="kd-cmts">
          <button class="kd-heart" data-a="heart" data-id="${e.id}" aria-label="하트">${hearts[kid] ? "❤️" : "🤍"}</button>
          <span class="kd-soft">${heartBy.join(", ")}</span>
          ${(e.comments || []).map(c => `<p><b style="color:${WHO(c.by).color}">${esc(WHO(c.by).name)}</b> ${esc(c.text)}</p>`).join("")}
          <div class="kd-cmt"><input maxlength="80" placeholder="${author === kid ? "엄마에게 답장하기" : "엄마에게 한마디"}" data-cmt="${e.id}"><button data-a="comment" data-id="${e.id}">남기기</button></div>
        </div></article>`;
    }).join("") : `<p class="kd-soft" style="text-align:center;padding:30px 0">${author === kid ? "아직 쓴 일기가 없어요. 오늘 첫 일기를 써 볼까요?" : "엄마 일기가 아직 없어요."}</p>`}</div>`;
  }

  /* ---------- 이벤트 ---------- */
  root.addEventListener("click", ev => {
    const a = ev.target.closest("[data-a]"); if (!a) return;
    const v = a.dataset.v, id = a.dataset.id;
    switch (a.dataset.a){
      case "view":
        if (S.view === "write" && S.dirty && v !== "write") saveDraft();
        S.view = v; S.dirty = false; render(); break;
      case "date":
        if (v === S.date) break;
        if (S.dirty) saveDraft();
        S.date = v; S.dirty = false; S.qShift = 0; renderWrite(); break;
      case "weather": case "mood":
        S[a.dataset.a] = S[a.dataset.a] === v ? "" : v; S.dirty = true;
        a.parentElement.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.v === S[a.dataset.a]));
        saveDraft(); break;
      case "q-next": S.qShift++; $("[data-kd=q]").textContent = question(); break;
      case "spell": spell(root.querySelector(".kd-acts [data-a=spell]")); break;
      case "reveal": S.spell.errors[+a.dataset.i].shown = true; renderPen(); break;
      case "apply": {
        applyOne(S.spell.errors[+a.dataset.i]); toast(one(PRAISE_FIX));
  + renderPen(); break;
      }
      case "find": {
        const er = S.spell.errors[+a.dataset.i], ta = $("[data-kd=content]"), i = wrongAt(er, ta.value);
        if (i < 0) break;
        ta.focus({ preventScroll: true }); ta.setSelectionRange(i, i + er.wrong.length);
        root.querySelectorAll(".kd-hl mark.fix").forEach(m => { if (m.textContent === er.wrong) m.scrollIntoView({ behavior: "smooth", block: "center" }); });
        break;
      }
      case "save": save(a); break;
      case "nudge-ok":
        setDoc(doc(db, "diaryStatus", kid), { nudgeSeen: true }, { merge: true }).catch(() => {});
        S.view = "write"; render(); break;
      case "heart": {
        const cur = !!S.entries[id]?.hearts?.[kid];
        updateDoc(doc(db, "diary", id), { [`hearts.${kid}`]: !cur }).catch(() => toast("하트를 못 보냈어요"));
        break;
      }
      case "comment": {
        const inp = root.querySelector(`[data-cmt="${id}"]`), text = inp.value.trim(); if (!text) return;
        updateDoc(doc(db, "diary", id), { comments: arrayUnion({ by: kid, text, at: Date.now() }) })
          .then(() => { inp.value = ""; }).catch(() => toast("한마디를 못 남겼어요"));
        break;
      }
    }
  });
  let penTimer;
  root.addEventListener("input", ev => {
    const k = ev.target.dataset?.kd;
    if (k === "content"){
+
      clearTimeout(penTimer); penTimer = setTimeout(renderPen, 350);
    } else if (k === "title" || k === "useq"){ S.dirty = true; saveDraft(); }
  });
  root.addEventListener("keydown", ev => {
    if (ev.target.dataset?.cmt && ev.key === "Enter") root.querySelector(`[data-a="comment"][data-id="${ev.target.dataset.cmt}"]`)?.click();
  });

  render();
  setInterval(renderNudge, 60 * 1000);
  return { markStudied: () => markStudied(kid, firebaseConfig) };
}
