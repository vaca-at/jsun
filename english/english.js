/* ============================================================
   공부방 영어 — 영국 · 미국 초등 저학년 순서를 따라가는 3단계
   🌱 1단계 (7살): 알파벳 소리 (Jolly Phonics 순서 s a t p i n …)
   🌿 2단계 (8살): 단어 읽기 (짧은 모음 CVC · sh ch th · 사이트워드 · 짧은 문장)
   🌳 3단계 (9살): 짧은 이야기 (긴 모음 · 문법 기초 · 문장 만들기 · 이야기 읽고 답하기)

   공부방에서 이렇게 불러요:
   import('/english/english.js').then(m => m.mountEnglish({
     el, kidId: 'dojin', grade: 'e2', firebaseConfig, name: '도진',
     host: { speak, beep, addStar, logToday, toast, burst }   // 공부방에 이미 있는 기능
   }));
   ============================================================ */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PASS = 8;        // 10문제 중 8개 맞히면 다음 단원이 열려요
const QN = 10;

/* ---------- 🌱 1단계: 알파벳 소리 ---------- */
// l: 글자 · s: 소리 힌트 · w: 그 소리로 시작하는 단어 · e: 그림 · k: 뜻
const L = (l, s, w, e, k) => ({ l, s, w, e, k });
const LETTERS = {
  g1: [L("s", "스~", "sun", "☀️", "해"), L("a", "애", "apple", "🍎", "사과"), L("t", "트", "tiger", "🐯", "호랑이"),
       L("p", "프", "pig", "🐷", "돼지"), L("i", "이", "insect", "🐞", "곤충"), L("n", "느~", "nose", "👃", "코")],
  g2: [L("c", "크", "cat", "🐱", "고양이"), L("k", "크", "kite", "🪁", "연"), L("e", "에", "egg", "🥚", "달걀"),
       L("h", "흐", "hat", "🎩", "모자"), L("r", "르~", "rabbit", "🐰", "토끼"), L("m", "므~", "moon", "🌙", "달"), L("d", "드", "dog", "🐶", "개")],
  g3: [L("g", "그", "goat", "🐐", "염소"), L("o", "아", "octopus", "🐙", "문어"), L("u", "어", "umbrella", "☂️", "우산"),
       L("l", "을~", "lion", "🦁", "사자"), L("f", "프~ (윗니)", "fish", "🐟", "물고기"), L("b", "브", "bear", "🐻", "곰")],
  g4: [L("j", "즈", "juice", "🧃", "주스"), L("z", "즈~", "zebra", "🦓", "얼룩말"), L("w", "워", "web", "🕸️", "거미줄"),
       L("v", "브~ (윗니)", "van", "🚐", "승합차"), L("y", "이어", "yo-yo", "🪀", "요요"), L("x", "크스", "box", "📦", "상자 (끝소리)"), L("q", "쿠", "queen", "👸", "여왕")]
};
LETTERS.g4.find(x => x.l === "x").end = true;   // x 는 box 처럼 끝에서 나는 소리
const ALL_LETTERS = [...LETTERS.g1, ...LETTERS.g2, ...LETTERS.g3, ...LETTERS.g4];

/* ---------- 단어 (그림 · 뜻) ---------- */
const W = (w, e, k) => ({ w, e, k });
const WORDS = {
  cvc0: [W("cat", "🐱", "고양이"), W("pig", "🐷", "돼지"), W("sun", "☀️", "해"), W("dog", "🐶", "개"),
         W("hat", "🎩", "모자"), W("bus", "🚌", "버스"), W("pen", "🖊️", "펜"), W("bed", "🛏️", "침대")],
  a:   [W("cat", "🐱", "고양이"), W("hat", "🎩", "모자"), W("bat", "🦇", "박쥐"), W("map", "🗺️", "지도"), W("can", "🥫", "캔"),
        W("fan", "🪭", "부채"), W("man", "👨", "남자"), W("van", "🚐", "승합차"), W("bag", "👜", "가방"), W("ant", "🐜", "개미")],
  ei:  [W("bed", "🛏️", "침대"), W("hen", "🐔", "암탉"), W("pen", "🖊️", "펜"), W("net", "🥅", "그물"), W("ten", "🔟", "열(10)"),
        W("pig", "🐷", "돼지"), W("six", "6️⃣", "여섯"), W("lip", "👄", "입술"), W("fin", "🦈", "지느러미"), W("kid", "🧒", "아이")],
  ou:  [W("dog", "🐶", "개"), W("fox", "🦊", "여우"), W("box", "📦", "상자"), W("pot", "🍲", "냄비"), W("log", "🪵", "통나무"),
        W("sun", "☀️", "해"), W("bus", "🚌", "버스"), W("cup", "🥤", "컵"), W("bug", "🐛", "벌레"), W("hut", "🛖", "오두막")],
  dig: [W("ship", "🚢", "배"), W("fish", "🐟", "물고기"), W("shell", "🐚", "조개"), W("chick", "🐤", "병아리"), W("chip", "🍟", "감자칩"),
        W("lunch", "🍱", "점심"), W("bench", "🪑", "벤치"), W("bath", "🛁", "목욕"), W("thumb", "👍", "엄지"), W("three", "3️⃣", "셋")],
  bl:  [W("frog", "🐸", "개구리"), W("flag", "🚩", "깃발"), W("drum", "🥁", "북"), W("crab", "🦀", "게"), W("swim", "🏊", "수영하다"),
        W("clap", "👏", "손뼉 치다"), W("sled", "🛷", "썰매"), W("stop", "🛑", "멈추다"), W("plant", "🌱", "식물"), W("truck", "🚚", "트럭")],
  mage:[W("cake", "🎂", "케이크"), W("lake", "🏞️", "호수"), W("bike", "🚲", "자전거"), W("kite", "🪁", "연"), W("five", "5️⃣", "다섯"),
        W("home", "🏠", "집"), W("bone", "🦴", "뼈"), W("rope", "🪢", "밧줄"), W("cube", "🧊", "정육면체"), W("flute", "🪈", "피리")],
  aiee:[W("rain", "🌧️", "비"), W("train", "🚆", "기차"), W("snail", "🐌", "달팽이"), W("day", "🌞", "낮"), W("tree", "🌳", "나무"),
        W("bee", "🐝", "벌"), W("sheep", "🐑", "양"), W("sea", "🌊", "바다"), W("leaf", "🍃", "잎"), W("eat", "🍽️", "먹다")],
  oaoo:[W("boat", "⛵", "배"), W("goat", "🐐", "염소"), W("coat", "🧥", "코트"), W("snow", "❄️", "눈"), W("bowl", "🥣", "그릇"),
        W("moon", "🌙", "달"), W("food", "🍱", "음식"), W("spoon", "🥄", "숟가락"), W("book", "📖", "책"), W("foot", "🦶", "발")],
  rr:  [W("car", "🚗", "자동차"), W("star", "⭐", "별"), W("farm", "🚜", "농장"), W("shark", "🦈", "상어"), W("corn", "🌽", "옥수수"),
        W("fork", "🍴", "포크"), W("horse", "🐴", "말"), W("bird", "🐦", "새"), W("girl", "👧", "소녀"), W("nurse", "👩‍⚕️", "간호사")]
};

/* ---------- 사이트워드 (통째로 외우는 말) ---------- */
const SW = (w, k, x) => ({ w, k, x });   // x: 예문 (그 말이 들어간 문장)
const SIGHT = {
  s1: [SW("the", "그", "The cat is big."), SW("a", "하나의", "I see a dog."), SW("I", "나", "I like cake."), SW("is", "~이다", "It is red."),
       SW("it", "그것", "It is a fish."), SW("in", "~안에", "The bug is in the cup."), SW("and", "그리고", "Mom and Dad."), SW("to", "~로", "I go to school."),
       SW("you", "너", "I like you."), SW("my", "나의", "My hat is red."), SW("he", "그(남자)", "He can run."), SW("she", "그녀", "She is my sister."),
       SW("we", "우리", "We can swim."), SW("can", "~할 수 있다", "I can jump."), SW("see", "보다", "I see the sun."), SW("go", "가다", "Let's go!"),
       SW("look", "보다", "Look at me!"), SW("like", "좋아하다", "I like dogs."), SW("said", "말했다", "Mom said yes."), SW("no", "아니", "No, thank you.")],
  s2: [SW("was", "~였다", "It was fun."), SW("are", "~이다", "We are friends."), SW("they", "그들", "They are happy."), SW("have", "가지다", "I have a pen."),
       SW("come", "오다", "Come here!"), SW("here", "여기", "I am here."), SW("there", "저기", "The dog is there."), SW("what", "무엇", "What is it?"),
       SW("do", "하다", "I do my homework."), SW("for", "~을 위해", "This is for you."), SW("of", "~의", "A cup of milk."), SW("put", "놓다", "Put it on the bed."),
       SW("want", "원하다", "I want an apple."), SW("this", "이것", "This is my book."), SW("that", "저것", "That is a bird."), SW("with", "~와 함께", "Play with me."),
       SW("one", "하나", "I have one cat."), SW("two", "둘", "I see two birds."), SW("all", "모두", "We all sing."), SW("play", "놀다", "Let's play!")],
  s3: [SW("because", "왜냐하면", "I am happy because it is sunny."), SW("could", "~할 수 있었다", "I could see the moon."), SW("would", "~할 것이다", "Would you like tea?"),
       SW("many", "많은", "I have many books."), SW("again", "다시", "Say it again."), SW("friend", "친구", "She is my friend."), SW("school", "학교", "I walk to school."),
       SW("people", "사람들", "Many people are here."), SW("very", "매우", "It is very hot."), SW("where", "어디", "Where is my bag?"), SW("when", "언제", "When is lunch?"),
       SW("why", "왜", "Why are you sad?"), SW("who", "누구", "Who is that?"), SW("water", "물", "I drink water."), SW("little", "작은", "A little cat."),
       SW("their", "그들의", "That is their house."), SW("some", "약간의", "I want some milk."), SW("every", "모든", "I read every day.")]
};

/* ---------- 문장 ---------- */
const S_ = (s, e, k) => ({ s, e, k });
const SENT2 = [S_("I see a cat.", "🐱", "나는 고양이를 봐요."), S_("The dog is big.", "🐶", "그 개는 커요."), S_("I like red.", "🔴", "나는 빨간색이 좋아요."),
  S_("Look at the sun.", "☀️", "해를 봐요."), S_("We can run.", "🏃", "우리는 달릴 수 있어요."), S_("It is a fish.", "🐟", "그것은 물고기예요."),
  S_("My hat is red.", "🎩", "내 모자는 빨개요."), S_("She can swim.", "🏊", "그녀는 수영할 수 있어요."), S_("He has a bag.", "👜", "그는 가방이 있어요."),
  S_("The bug is in the cup.", "🐛", "벌레가 컵 안에 있어요.")];
const BUILD3 = [S_("The cat is on the bed.", "🐱", "고양이가 침대 위에 있어요."), S_("I can ride a bike.", "🚲", "나는 자전거를 탈 수 있어요."),
  S_("We play in the park.", "🛝", "우리는 공원에서 놀아요."), S_("My friend has a red kite.", "🪁", "내 친구는 빨간 연이 있어요."),
  S_("The bird is in the tree.", "🐦", "새가 나무에 있어요."), S_("I eat cake at home.", "🎂", "나는 집에서 케이크를 먹어요."),
  S_("She reads a book.", "📖", "그녀는 책을 읽어요."), S_("They swim in the sea.", "🌊", "그들은 바다에서 수영해요.")];
// 문법: 빈칸 채우기 (s: 문장, a: 정답, o: 보기)
const G = (s, a, o, k) => ({ s, a, o, k });
const GRAM3 = [G("I ___ happy.", "am", ["am", "is", "are"], "나는 행복해요."), G("He ___ tall.", "is", ["am", "is", "are"], "그는 키가 커요."),
  G("They ___ friends.", "are", ["am", "is", "are"], "그들은 친구예요."), G("She ___ my sister.", "is", ["am", "is", "are"], "그녀는 내 여동생(언니)이에요."),
  G("We ___ at school.", "are", ["am", "is", "are"], "우리는 학교에 있어요."), G("It ___ a cat.", "is", ["am", "is", "are"], "그것은 고양이예요."),
  G("You ___ kind.", "are", ["am", "is", "are"], "너는 친절해."), G("one cat, two ___", "cats", ["cat", "cats", "cates"], "고양이 한 마리, 두 마리"),
  G("one box, two ___", "boxes", ["boxs", "boxes", "box"], "상자 하나, 두 개"), G("one dog, three ___", "dogs", ["dog", "dogs", "doges"], "개 한 마리, 세 마리")];
// 이야기: pages [영어, 한국어], qs [질문, 정답, 보기]
const STORIES = [
  { t: "Sam and the Kite", e: "🪁",
    pages: [["Sam has a red kite.", "샘은 빨간 연이 있어요."], ["The wind is strong.", "바람이 세게 불어요."], ["The kite goes up, up, up!", "연이 높이, 높이, 높이 올라가요!"],
            ["Oh no! The kite is in the tree.", "아이고! 연이 나무에 걸렸어요."], ["Dad gets the kite. Sam is happy.", "아빠가 연을 꺼내 줘요. 샘은 기뻐요."]],
    qs: [["샘의 연은 무슨 색이었나요?", "red", ["red", "blue", "green"]], ["연은 어디에 걸렸나요?", "in the tree", ["in the tree", "in the sea", "on the car"]],
         ["누가 연을 꺼내 주었나요?", "Dad", ["Dad", "Mom", "Sam"]]] },
  { t: "The Big Cake", e: "🎂",
    pages: [["It is Mia's birthday.", "오늘은 미아의 생일이에요."], ["Mom makes a big cake.", "엄마가 큰 케이크를 만들어요."], ["The cake has five candles.", "케이크에 초가 다섯 개 있어요."],
            ["Mia makes a wish.", "미아가 소원을 빌어요."], ["Everyone sings and eats cake.", "모두 노래하고 케이크를 먹어요."]],
    qs: [["누구의 생일이었나요?", "Mia", ["Mia", "Mom", "Sam"]], ["초는 몇 개였나요?", "five", ["three", "five", "ten"]],
         ["케이크는 누가 만들었나요?", "Mom", ["Dad", "Mia", "Mom"]]] },
  { t: "A Day at the Sea", e: "🌊",
    pages: [["We go to the sea.", "우리는 바다에 가요."], ["The sun is hot.", "해가 뜨거워요."], ["I swim with my brother.", "나는 형(오빠)이랑 수영해요."],
            ["We see a crab on the sand.", "모래 위에서 게를 봐요."], ["We eat ice cream. What a fun day!", "아이스크림을 먹어요. 정말 신나는 날이에요!"]],
    qs: [["어디에 갔나요?", "the sea", ["the park", "the sea", "school"]], ["누구와 수영했나요?", "my brother", ["my brother", "my dog", "my teacher"]],
         ["모래 위에서 무엇을 봤나요?", "a crab", ["a fish", "a crab", "a bird"]]] }
];

/* ---------- 커리큘럼: 3단계 × 8단원 ---------- */
const U = (id, title, sub, kind, data, extra = {}) => ({ id, title, sub, kind, data, ...extra });
const CUR = [
  { lv: 1, icon: "🌱", name: "1단계", age: "7살", goal: "알파벳 소리", tip: "영어 글자는 이름보다 '소리'가 먼저예요. s는 '에스'가 아니라 '스~' 소리!",
    units: [
      U("1-1", "s a t p i n", "첫 번째 소리 6개", "letters", LETTERS.g1),
      U("1-2", "c k e h r m d", "두 번째 소리 7개", "letters", LETTERS.g2),
      U("1-3", "g o u l f b", "세 번째 소리 6개", "letters", LETTERS.g3),
      U("1-4", "j z w v y x q", "마지막 소리 7개", "letters", LETTERS.g4),
      U("1-5", "A~M 대문자·소문자", "큰 글자와 작은 글자 짝꿍", "case", "abcdefghijklm".split("")),
      U("1-6", "N~Z 대문자·소문자", "큰 글자와 작은 글자 짝꿍", "case", "nopqrstuvwxyz".split("")),
      U("1-7", "첫소리 찾기", "26개 소리 모두 복습", "letters", ALL_LETTERS),
      U("1-8", "첫 단어 읽기", "소리를 이어 붙여 c-a-t → cat!", "words", WORDS.cvc0, { blend: true })
    ] },
  { lv: 2, icon: "🌿", name: "2단계", age: "8살", goal: "단어 읽기", tip: "소리를 하나씩 읽고 이어 붙이면 단어가 돼요. c · a · t → cat!",
    units: [
      U("2-1", "짧은 a", "cat · hat · map", "words", WORDS.a, { blend: true, pat: /a/g }),
      U("2-2", "짧은 e · i", "bed · pen · pig", "words", WORDS.ei, { blend: true, pat: /[ei]/g }),
      U("2-3", "짧은 o · u", "dog · sun · cup", "words", WORDS.ou, { blend: true, pat: /[ou]/g }),
      U("2-4", "sh · ch · th", "두 글자가 한 소리", "words", WORDS.dig, { pat: /sh|ch|th/g }),
      U("2-5", "붙어 나는 소리", "fr · fl · dr · st …", "words", WORDS.bl, { pat: /^(fr|fl|dr|cr|sw|cl|sl|st|pl|tr)/g }),
      U("2-6", "사이트워드 1", "the · is · you … 20개", "sight", SIGHT.s1),
      U("2-7", "사이트워드 2", "was · they · have … 20개", "sight", SIGHT.s2),
      U("2-8", "짧은 문장", "I see a cat.", "sentences", SENT2)
    ] },
  { lv: 3, icon: "🌳", name: "3단계", age: "9살", goal: "짧은 이야기", tip: "모음이 길게 나는 소리를 배우고, 문장과 이야기를 읽어요.",
    units: [
      U("3-1", "마법의 e", "cake · bike · home", "words", WORDS.mage, { pat: /[aeiou](?=[a-z]e$)|e$/g }),
      U("3-2", "ai · ay · ee · ea", "rain · tree · sea", "words", WORDS.aiee, { pat: /ai|ay|ee|ea/g }),
      U("3-3", "oa · ow · oo", "boat · snow · moon", "words", WORDS.oaoo, { pat: /oa|ow|oo/g }),
      U("3-4", "ar · or · ir · ur", "car · corn · bird", "words", WORDS.rr, { pat: /ar|or|ir|ur/g }),
      U("3-5", "사이트워드 3", "because · friend … 18개", "sight", SIGHT.s3),
      U("3-6", "am · is · are · 여러 개(-s)", "I am / He is / They are", "grammar", GRAM3),
      U("3-7", "문장 만들기", "낱말을 순서대로 놓아요", "build", BUILD3),
      U("3-8", "이야기 읽기", "읽고 질문에 답해요", "story", STORIES)
    ] }
];
const UNIT = id => CUR.flatMap(c => c.units).find(u => u.id === id);

/* ---------- 도우미 ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickN = (a, n, not) => shuffle(a.filter(x => x !== not)).slice(0, n);
const one = a => a[Math.floor(Math.random() * a.length)];
const OKS = ["딩동댕! 👏", "정답! 최고예요 🌟", "우와, 맞았어요!", "완벽해요! 💯", "척척박사예요!"];
function highlight(w, pat){
  if (!pat) return esc(w);
  return esc(w).replace(new RegExp(pat.source, "g"), m => `<b class="pat">${m}</b>`);
}
const blendView = w => w.split("").map(c => `<span>${esc(c)}</span>`).join("<i>·</i>");

const CSS = `
.en2{ --en:#3F7FD8; --ok:#3F8F60; --no:#E0555E; }
.en2 .en-lv{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:12px; }
.en2 .en-lv button{ border:2.5px solid #D6E2F2; background:#fff; border-radius:16px; padding:10px 8px; text-align:center; font:inherit; cursor:pointer; }
.en2 .en-lv button b{ display:block; font-size:1.15em; }
.en2 .en-lv button small{ display:block; opacity:.75; }
.en2 .en-lv button.on{ border-color:var(--en); background:#EAF2FF; box-shadow:0 3px 0 #C9DBF7; }
.en2 .en-tip{ background:#FFF8DD; border-radius:12px; padding:8px 12px; margin-bottom:12px; }
.en2 .en-map{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
.en2 .en-map button{ border:2px solid #D6E2F2; background:#fff; border-radius:14px; padding:10px 8px; min-height:96px; text-align:left; font:inherit; cursor:pointer; position:relative; }
.en2 .en-map button .no{ font-size:.8em; opacity:.6; }
.en2 .en-map button b{ display:block; margin:2px 0; }
.en2 .en-map button small{ opacity:.7; font-size:.8em; }
.en2 .en-map button .st{ position:absolute; right:8px; top:6px; }
.en2 .en-map button.pass{ background:#EEF8F0; border-color:#9FD3A8; }
.en2 .en-map button.now{ border-color:var(--en); box-shadow:0 0 0 3px #C9DBF7; }
.en2 .en-map button:disabled{ opacity:.45; cursor:default; }
.en2 .en-head{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
.en2 .en-head h3{ margin:0; }
.en2 .en-seg{ display:flex; gap:6px; margin-left:auto; }
.en2 .en-seg button, .en2 .en-back{ border:2px solid #D6E2F2; background:#fff; border-radius:999px; padding:4px 14px; font:inherit; cursor:pointer; }
.en2 .en-seg button.on{ background:var(--en); border-color:var(--en); color:#fff; }
.en2 .en-cards{ display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; }
.en2 .en-card{ border:2px solid #E3EAF4; background:#fff; border-radius:16px; padding:12px 8px; text-align:center; font:inherit; cursor:pointer; }
.en2 .en-card:active{ transform:scale(.97); }
.en2 .en-card .big{ font-size:2.6em; line-height:1.1; font-weight:700; letter-spacing:.02em; }
.en2 .en-card .emo{ font-size:2.2em; line-height:1.2; }
.en2 .en-card .snd{ color:var(--en); font-weight:700; }
.en2 .en-card .ko{ display:block; opacity:.7; font-size:.85em; }
.en2 .en-card .word{ font-size:1.35em; font-weight:700; }
.en2 .en-card .ex{ display:block; font-size:.85em; margin-top:4px; }
.en2 .blend{ display:flex; justify-content:center; gap:4px; font-size:1.1em; opacity:.8; }
.en2 .blend i{ font-style:normal; opacity:.4; }
.en2 b.pat{ color:#E0555E; }
.en2 .en-wide{ grid-column:1/-1; text-align:left; display:flex; gap:12px; align-items:center; }
.en2 .en-go{ text-align:center; margin-top:14px; }
.en2 .en-btn{ border:none; background:var(--en); color:#fff; border-radius:14px; padding:10px 22px; font:inherit; font-weight:700; cursor:pointer; font-size:1.05em; }
.en2 .en-btn.sub{ background:#fff; color:var(--en); border:2px solid var(--en); }
.en2 .en-q{ background:#fff; border-radius:18px; padding:14px 16px; border:2px solid #E3EAF4; }
.en2 .qtop{ display:flex; justify-content:space-between; opacity:.75; font-size:.9em; }
.en2 .qbar{ height:8px; background:#E3EAF4; border-radius:999px; overflow:hidden; margin:6px 0 10px; }
.en2 .qbar i{ display:block; height:100%; background:var(--en); }
.en2 .qask{ font-size:1.1em; text-align:center; margin:6px 0; }
.en2 .qshow{ text-align:center; font-size:2.8em; font-weight:700; margin:6px 0; min-height:1.2em; }
.en2 .qshow.small{ font-size:1.5em; }
.en2 .qsay{ display:block; margin:6px auto; border:none; background:#EAF2FF; border-radius:999px; font-size:1.8em; width:72px; height:72px; cursor:pointer; }
.en2 .qopts{ display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; margin-top:10px; }
.en2 .qopts button{ border:2.5px solid #D6E2F2; background:#fff; border-radius:16px; padding:12px 8px; font:inherit; font-size:1.3em; cursor:pointer; min-height:64px; }
.en2 .qopts.pics button{ font-size:2.4em; }
.en2 .qopts button.ok{ background:#DDF3E3; border-color:var(--ok); }
.en2 .qopts button.no{ background:#FDECEC; border-color:var(--no); }
.en2 .qline{ min-height:56px; border-bottom:3px dashed #C9DBF7; display:flex; flex-wrap:wrap; gap:6px; padding:6px 0; justify-content:center; }
.en2 .qline button, .en2 .qpool button{ border:2px solid #D6E2F2; background:#fff; border-radius:12px; padding:6px 12px; font:inherit; font-size:1.2em; cursor:pointer; }
.en2 .qpool{ display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin:10px 0; }
.en2 .qres{ text-align:center; font-size:1.15em; margin-top:10px; padding:8px; border-radius:12px; }
.en2 .qres.ok{ background:#DDF3E3; } .en2 .qres.no{ background:#FDECEC; }
.en2 .en-story{ background:#fff; border-radius:18px; padding:14px 16px; border:2px solid #E3EAF4; margin-bottom:12px; }
.en2 .en-story p{ margin:6px 0; cursor:pointer; }
.en2 .en-story p b{ font-size:1.15em; }
.en2 .en-story p small{ display:block; opacity:.65; }
.en2 .en-done{ text-align:center; padding:20px 10px; }
.en2 .en-done .big{ font-size:3.2em; }
@media (max-width:640px){ .en2 .en-map{ grid-template-columns:repeat(2,minmax(0,1fr)); } .en2 .en-lv button small{ display:none; } }
`;

/* ---------- 퀴즈 만들기: 단원 종류마다 문제 모양이 달라요 ---------- */
export function makeQuestions(u){
  const qs = [];
  const add = q => qs.push(q);
  if (u.kind === "letters"){
    const pool = u.data;
    for (let n = 0; n < QN; n++){
      const x = pool[n % pool.length], others = pickN(pool.filter(o => o.s !== x.s), 2, x);   // c·k 처럼 같은 소리는 함께 안 내요
      const t = n % 3;
      const where = x.end ? "끝나는" : "시작하는", whereQ = x.end ? "어떤 글자 소리로 끝날까요?" : "어떤 글자로 시작할까요?";
      if (t === 0) add({ ask: `🔊 잘 듣고, ${whereQ}`, say: x.w, show: "", opts: shuffle([x, ...others]).map(o => ({ v: o.l, h: o.l })), a: x.l });
      else if (t === 1) add({ ask: `'${x.l}' (${x.s}) 소리로 ${where} 그림은?`, show: x.l.toUpperCase() + x.l, pics: true, opts: shuffle([x, ...others]).map(o => ({ v: o.w, h: o.e })), a: x.w, after: x.w });
      else add({ ask: `이 그림은 ${whereQ}`, show: x.e, say: x.w, opts: shuffle([x, ...others]).map(o => ({ v: o.l, h: o.l })), a: x.l });
    }
  } else if (u.kind === "case"){
    for (let n = 0; n < QN; n++){
      const l = u.data[n % u.data.length], others = pickN(u.data, 2, l), up = n % 2 === 0;
      add({ ask: up ? "대문자의 짝꿍 소문자는?" : "소문자의 짝꿍 대문자는?", show: up ? l.toUpperCase() : l,
        opts: shuffle([l, ...others]).map(o => ({ v: o, h: up ? o : o.toUpperCase() })), a: l });
    }
  } else if (u.kind === "words"){
    const pool = shuffle(u.data);
    for (let n = 0; n < QN; n++){
      const x = pool[n % pool.length], others = pickN(u.data, 2, x), t = n % 4;
      if (t === 0) add({ ask: "🔊 잘 듣고, 맞는 그림을 골라요", say: x.w, pics: true, opts: shuffle([x, ...others]).map(o => ({ v: o.w, h: o.e })), a: x.w });
      else if (t === 1) add({ ask: "이 단어에 맞는 그림은?", show: x.w, small: true, pics: true, opts: shuffle([x, ...others]).map(o => ({ v: o.w, h: o.e })), a: x.w, after: x.w });
      else if (t === 2) add({ ask: "그림에 맞는 단어는?", show: x.e, opts: shuffle([x, ...others]).map(o => ({ v: o.w, h: o.w })), a: x.w, after: x.w });
      else add({ ask: "🔊 잘 듣고, 맞는 단어를 골라요", say: x.w, opts: shuffle([x, ...others]).map(o => ({ v: o.w, h: o.w })), a: x.w });
    }
  } else if (u.kind === "sight"){
    const pool = shuffle(u.data);
    for (let n = 0; n < QN; n++){
      const x = pool[n % pool.length], others = pickN(u.data, 3, x);
      if (n % 2 === 0) add({ ask: "🔊 잘 듣고, 들린 말을 골라요", say: x.w, opts: shuffle([x, ...others]).map(o => ({ v: o.w, h: o.w })), a: x.w });
      else {
        const re = new RegExp(`\\b${x.w}\\b`, "i"), m = x.x.match(re);
        const blank = m ? x.x.replace(re, "___") : x.x;
        add({ ask: `빈칸에 들어갈 말은? (${x.k})`, show: blank, small: true, opts: shuffle([x, ...others]).map(o => ({ v: o.w, h: o.w })), a: x.w, after: x.x });
      }
    }
  } else if (u.kind === "sentences"){
    const pool = shuffle(u.data);
    for (let n = 0; n < QN; n++){
      const x = pool[n % pool.length], others = pickN(u.data, 2, x), t = n % 3;
      if (t === 0) add({ ask: "🔊 잘 듣고, 맞는 문장을 골라요", say: x.s, opts: shuffle([x, ...others]).map(o => ({ v: o.s, h: o.s })), a: x.s, wide: true });
      else if (t === 1) add({ ask: "그림에 맞는 문장은?", show: x.e, opts: shuffle([x, ...others]).map(o => ({ v: o.s, h: o.s })), a: x.s, wide: true, after: x.s });
      else add({ ask: `낱말을 순서대로 눌러 문장을 만들어요 (${x.k})`, order: x.s, say: x.s });
    }
  } else if (u.kind === "build"){
    const pool = shuffle(u.data);
    for (let n = 0; n < QN; n++){
      const x = pool[n % pool.length];
      if (n % 3 === 2){ const others = pickN(u.data, 2, x); add({ ask: "🔊 잘 듣고, 맞는 문장을 골라요", say: x.s, opts: shuffle([x, ...others]).map(o => ({ v: o.s, h: o.s })), a: x.s, wide: true }); }
      else add({ ask: `${x.e} 낱말을 순서대로 눌러 문장을 만들어요 (${x.k})`, order: x.s });
    }
  } else if (u.kind === "grammar"){
    shuffle(u.data).forEach(x => add({ ask: `빈칸에 알맞은 말은? (${x.k})`, show: x.s, small: true, opts: shuffle(x.o).map(o => ({ v: o, h: o })), a: x.a, after: x.s.replace("___", x.a) }));
  } else if (u.kind === "story"){
    u.data.forEach(st => st.qs.forEach(([q, a, o]) => add({ ask: `${st.e} ${st.t} — ${q}`, opts: shuffle(o).map(v => ({ v, h: v })), a, wide: true })));
    const pages = shuffle(u.data.flatMap(st => st.pages.map(p => p[0])));
    add({ ask: "🔊 잘 듣고, 이야기 속 문장을 골라요", say: pages[0], opts: shuffle(pages.slice(0, 3)).map(v => ({ v, h: v })), a: pages[0], wide: true });
  }
  return shuffle(qs).slice(0, QN);
}


/* ============================================================
   붙이기
   ============================================================ */
export function mountEnglish({ el, kidId, grade, firebaseConfig, name = "", host = {} }){
  const root = typeof el === "string" ? document.querySelector(el) : el;
  if (!document.getElementById("en2-style")){ const st = document.createElement("style"); st.id = "en2-style"; st.textContent = CSS; document.head.append(st); }
  const say = t => { try { host.speak ? host.speak(t, "en") : speechFallback(t); } catch { speechFallback(t); } };
  const toast = m => host.toast ? host.toast(m) : console.log(m);
  const beep = ok => { try { host.beep?.(ok); } catch {} };

  /* 진도: 이 기기(localStorage) + 파이어베이스(공부방 아이 문서의 eng2) */
  const KEY = `en2_${kidId}`;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  let P = Object.assign({ lv: 1, best: {} }, load());
  const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch {} };
  let db = null, ref = null;
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app); ref = doc(db, grade, kidId);
    getDoc(ref).then(s => {
      const c = s.data()?.eng2; if (!c) return;
      for (const [k, v] of Object.entries(c.best || {})) P.best[k] = Math.max(P.best[k] || 0, v);
      if ((c.at || 0) > (P.at || 0)) P.lv = c.lv || P.lv;
      saveLocal(); if (V.screen === "map") draw();
    }).catch(() => {});
  } catch {}
  const saveCloud = () => { P.at = Date.now(); saveLocal(); if (ref) setDoc(ref, { eng2: P }, { merge: true }).catch(() => {}); };

  const V = { screen: "map", unit: null, tab: "learn", quiz: null, story: 0 };
  const level = () => CUR.find(c => c.lv === P.lv) || CUR[0];
  const unlocked = u => { const us = level().units, i = us.indexOf(u); return i === 0 || (P.best[us[i - 1].id] || 0) >= PASS; };
  const starsOf = id => { const b = P.best[id] || 0; return b >= 10 ? "⭐⭐⭐" : b >= 9 ? "⭐⭐" : b >= PASS ? "⭐" : ""; };

  /* ---------- 화면 ---------- */
  function draw(){
    if (V.screen === "map") drawMap();
    else if (V.tab === "learn") drawLearn();
    else drawQuiz();
  }
  function levelBar(){
    return `<div class="en-lv">${CUR.map(c => `<button class="${c.lv === P.lv ? "on" : ""}" data-en="lv" data-v="${c.lv}">
      <b>${c.icon} ${c.name}</b><small>${c.age} · ${c.goal}</small></button>`).join("")}</div>`;
  }
  function drawMap(){
    const lv = level(), us = lv.units;
    const now = us.find(u => (P.best[u.id] || 0) < PASS && unlocked(u));
    const passed = us.filter(u => (P.best[u.id] || 0) >= PASS).length;
    root.innerHTML = `<div class="en2">
      ${levelBar()}
      <div class="en-tip">💡 ${esc(lv.tip)} <span style="opacity:.7">(${passed} / ${us.length} 단원 통과)</span></div>
      <div class="en-map">${us.map((u, i) => {
        const ok = (P.best[u.id] || 0) >= PASS, open = unlocked(u);
        return `<button class="${ok ? "pass" : ""} ${u === now ? "now" : ""}" data-en="unit" data-v="${u.id}" ${open ? "" : "disabled"}>
          <span class="no">${i + 1}단원</span><span class="st">${open ? starsOf(u.id) || (u === now ? "▶" : "") : "🔒"}</span>
          <b>${esc(u.title)}</b><small>${esc(u.sub)}</small></button>`;
      }).join("")}</div>
      <p style="text-align:center;opacity:.7;font-size:.85em;margin-top:10px">퀴즈 10문제 중 ${PASS}개 이상 맞히면 다음 단원이 열려요 🔓 · 맞힐 때마다 ⭐</p>
    </div>`;
  }
  function unitHead(){
    const u = V.unit;
    return `<div class="en-head"><button class="en-back" data-en="map">◀ 단원 지도</button>
      <h3>${esc(u.title)}</h3><span style="opacity:.7">${esc(u.sub)}</span>
      <div class="en-seg"><button class="${V.tab === "learn" ? "on" : ""}" data-en="tab" data-v="learn">👂 배우기</button>
        <button class="${V.tab === "quiz" ? "on" : ""}" data-en="tab" data-v="quiz">🎯 퀴즈</button></div></div>`;
  }

  /* 배우기: 카드를 누르면 소리로 읽어 줘요 */
  function drawLearn(){
    const u = V.unit; let body = "";
    if (u.kind === "letters") body = `<div class="en-cards">${u.data.map((x, i) => `<button class="en-card" data-en="say" data-i="${i}">
      <div class="big">${x.l.toUpperCase()}${x.l}</div><div class="snd">${esc(x.s)}</div>
      <div class="emo">${x.e}</div><span class="word">${esc(x.w)}</span><span class="ko">${esc(x.k)}</span></button>`).join("")}</div>`;
    else if (u.kind === "case") body = `<div class="en-cards">${u.data.map((l, i) => {
      const x = ALL_LETTERS.find(a => a.l === l);
      return `<button class="en-card" data-en="say" data-i="${i}"><div class="big">${l.toUpperCase()} <span style="opacity:.5">·</span> ${l}</div>
        <div class="emo">${x?.e || ""}</div><span class="word">${esc(x?.w || "")}</span></button>`; }).join("")}</div>`;
    else if (u.kind === "words") body = `<div class="en-cards">${u.data.map((x, i) => `<button class="en-card" data-en="say" data-i="${i}">
      <div class="emo">${x.e}</div>${u.blend ? `<div class="blend">${blendView(x.w)}</div>` : ""}
      <span class="word">${highlight(x.w, u.pat)}</span><span class="ko">${esc(x.k)}</span></button>`).join("")}</div>`;
    else if (u.kind === "sight") body = `<div class="en-cards">${u.data.map((x, i) => `<button class="en-card" data-en="say" data-i="${i}">
      <span class="word" style="font-size:1.6em">${esc(x.w)}</span><span class="ko">${esc(x.k)}</span><span class="ex">${esc(x.x)}</span></button>`).join("")}</div>`;
    else if (u.kind === "sentences" || u.kind === "build") body = `<div class="en-cards">${u.data.map((x, i) => `<button class="en-card en-wide" data-en="say" data-i="${i}">
      <span class="emo">${x.e}</span><span><span class="word">${esc(x.s)}</span><span class="ko">${esc(x.k)}</span></span></button>`).join("")}</div>`;
    else if (u.kind === "grammar") body = `<div class="en-tip">
        👤 <b>I</b> 다음엔 <b>am</b> · 👦 <b>He / She / It</b> 다음엔 <b>is</b> · 👨‍👩‍👧 <b>We / You / They</b> 다음엔 <b>are</b><br>
        🐱 하나면 cat, 여러 개면 끝에 <b>s</b>: cats · s·x·ch·sh 로 끝나면 <b>es</b>: boxes</div>
      <div class="en-cards">${u.data.map((x, i) => `<button class="en-card en-wide" data-en="say" data-i="${i}">
        <span><span class="word">${esc(x.s.replace("___", x.a))}</span><span class="ko">${esc(x.k)}</span></span></button>`).join("")}</div>`;
    else if (u.kind === "story"){
      const st = u.data[V.story];
      body = `<div class="en-seg" style="margin:0 0 10px">${u.data.map((s, i) => `<button class="${i === V.story ? "on" : ""}" data-en="story" data-v="${i}">${s.e} ${esc(s.t)}</button>`).join("")}</div>
        <div class="en-story"><h3 style="margin:0 0 6px">${st.e} ${esc(st.t)}</h3>
        ${st.pages.map((p, i) => `<p data-en="say" data-i="${i}"><b>🔊 ${esc(p[0])}</b><small>${esc(p[1])}</small></p>`).join("")}
        <div style="text-align:center"><button class="en-btn sub" data-en="readall">📖 처음부터 읽어 줘요</button></div></div>`;
    }
    root.innerHTML = `<div class="en2">${unitHead()}
      <p style="opacity:.75;margin:0 0 10px">카드를 누르면 소리로 읽어 줘요. 따라 말해 봐요! 🗣️</p>
      ${body}
      <div class="en-go"><button class="en-btn" data-en="tab" data-v="quiz">다 배웠어요 → 🎯 퀴즈 풀기</button></div></div>`;
  }
  function sayItem(i){
    const u = V.unit, x = u.kind === "story" ? null : u.data[i];
    if (u.kind === "letters") say(`${x.w}. ${x.w}.`);
    else if (u.kind === "case"){ const a = ALL_LETTERS.find(a => a.l === x); say(a ? a.w : x); }
    else if (u.kind === "words" || u.kind === "sight") say(x.w);
    else if (u.kind === "sentences" || u.kind === "build") say(x.s);
    else if (u.kind === "grammar") say(x.s.replace("___", x.a));
    else if (u.kind === "story") say(u.data[V.story].pages[i][0]);
  }

  const newQuiz = () => ({ list: makeQuestions(V.unit), i: 0, ok: 0, ans: null, line: [], pool: null, done: false, unitId: V.unit.id });
  function startQuiz(){
    V.quiz = newQuiz(); V.tab = "quiz"; drawQuiz(); autoSay();
  }
  const autoSay = () => { const q = V.quiz?.list[V.quiz.i]; if (q?.say && !q.order) setTimeout(() => say(q.say), 350); };
  function drawQuiz(){
    if (!V.quiz || V.quiz.unitId !== V.unit.id){ V.quiz = newQuiz(); setTimeout(autoSay, 0); }
    const Qz = V.quiz;
    if (Qz.done){
      const pass = Qz.ok >= PASS, us = level().units, next = us[us.indexOf(V.unit) + 1];
      root.innerHTML = `<div class="en2">${unitHead()}<div class="en-done">
        <div class="big">${Qz.ok === QN ? "🏆" : pass ? "🎉" : "💪"}</div>
        <h3>${QN}문제 중 ${Qz.ok}개 맞혔어요!</h3>
        <p>${pass ? (next ? `통과! <b>${esc(next.title)}</b> 단원이 열렸어요 🔓` : "이 단계를 모두 통과했어요! 다음 단계에 도전해 볼까요? 🚀") : `${PASS}개 이상 맞히면 통과예요. 조금만 더 하면 돼요! 🌱`}</p>
        <p>⭐ 맞힌 만큼 별을 받았어요!</p>
        <button class="en-btn sub" data-en="tab" data-v="learn">👂 다시 배우기</button>
        <button class="en-btn" data-en="again">🔁 한 번 더</button>
        ${pass && next ? `<button class="en-btn" data-en="unit" data-v="${next.id}">다음 단원 ▶</button>` : ""}</div></div>`;
      return;
    }
    const q = Qz.list[Qz.i], ans = Qz.ans;
    let area = "";
    if (q.order){
      const words = q.order.split(" ");
      if (!Qz.pool){ Qz.pool = shuffle(words.map((w, i) => ({ w, i }))); Qz.line = []; }
      area = `<div class="qline">${Qz.line.map((t, i) => `<button data-en="unpick" data-i="${i}" ${ans ? "disabled" : ""}>${esc(t.w)}</button>`).join("") || `<span style="opacity:.5">여기에 낱말이 놓여요</span>`}</div>
        <div class="qpool">${Qz.pool.filter(t => !Qz.line.includes(t)).map(t => `<button data-en="put" data-i="${t.i}" ${ans ? "disabled" : ""}>${esc(t.w)}</button>`).join("")}</div>
        ${!ans && Qz.line.length === words.length ? `<div style="text-align:center"><button class="en-btn" data-en="check">확인</button></div>` : ""}`;
    } else {
      area = `<div class="qopts ${q.pics ? "pics" : ""}" ${q.wide ? 'style="grid-template-columns:1fr"' : ""}>${q.opts.map(o => {
        const cls = ans ? (o.v === q.a ? "ok" : o.v === ans.pick ? "no" : "") : "";
        return `<button class="${cls}" data-en="pick" data-v="${esc(o.v)}" ${ans ? "disabled" : ""}>${esc(o.h)}</button>`; }).join("")}</div>`;
    }
    root.innerHTML = `<div class="en2">${unitHead()}<div class="en-q">
      <div class="qtop"><span>${Qz.i + 1} / ${Qz.list.length}</span><span>⭐ ${Qz.ok}</span></div>
      <div class="qbar"><i style="width:${Qz.i / Qz.list.length * 100}%"></i></div>
      <div class="qask">${esc(q.ask)}</div>
      ${q.say ? `<button class="qsay" data-en="replay" aria-label="다시 듣기">🔊</button>` : ""}
      ${q.show ? `<div class="qshow ${q.small ? "small" : ""}">${esc(q.show)}</div>` : ""}
      ${area}
      ${ans ? `<div class="qres ${ans.ok ? "ok" : "no"}">${ans.ok ? one(OKS) : `아쉬워요! 정답은 <b>${esc(q.order || q.a)}</b> 예요`}</div>
        <div style="text-align:center;margin-top:8px"><button class="en-btn" data-en="next">${Qz.i + 1 < Qz.list.length ? "다음 문제 ▶" : "결과 보기 🎉"}</button></div>` : ""}
    </div></div>`;
  }
  function answer(ok, extra){
    const Qz = V.quiz, q = Qz.list[Qz.i];
    Qz.ans = { ok, ...extra };
    beep(ok);
    if (ok){ Qz.ok++; try { host.addStar?.(1); } catch {} }
    try { host.logToday?.(ok); } catch {}
    const tell = q.after || q.order || (q.say ? null : null);
    if (tell) setTimeout(() => say(tell), 250);
    drawQuiz();
  }
  function nextQ(){
    const Qz = V.quiz;
    Qz.i++; Qz.ans = null; Qz.pool = null; Qz.line = [];
    if (Qz.i >= Qz.list.length){
      Qz.done = true;
      const id = V.unit.id, before = P.best[id] || 0;
      P.best[id] = Math.max(before, Qz.ok); saveCloud();
      if (Qz.ok >= PASS){ try { host.burst?.(); } catch {} if (before < PASS) toast("🔓 다음 단원이 열렸어요!"); }
    }
    drawQuiz(); if (!Qz.done) autoSay();
  }

  /* ---------- 누르기 ---------- */
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-en]"); if (!b || !root.contains(b)) return;
    const act = b.dataset.en, v = b.dataset.v;
    switch (act){
      case "lv": P.lv = +v; saveCloud(); V.screen = "map"; draw(); break;
      case "map": V.screen = "map"; V.quiz = null; draw(); break;
      case "unit": { const u = UNIT(v); if (!u) break; if (+v[0] !== P.lv){ P.lv = +v[0]; saveCloud(); } V.unit = u; V.screen = "unit"; V.tab = "learn"; V.quiz = null; V.story = 0; draw(); window.scrollTo?.(0, 0); break; }
      case "tab": if (v === "quiz"){ V.quiz = null; startQuiz(); } else { V.tab = "learn"; draw(); } break;
      case "again": V.quiz = null; startQuiz(); break;
      case "story": V.story = +v; draw(); break;
      case "say": sayItem(+b.dataset.i); break;
      case "readall": say(V.unit.data[V.story].pages.map(p => p[0]).join(" ")); break;
      case "replay": { const q = V.quiz?.list[V.quiz.i]; if (q?.say) say(q.say); break; }
      case "pick": if (!V.quiz.ans){ const q = V.quiz.list[V.quiz.i]; answer(v === q.a, { pick: v }); } break;
      case "put": { const Qz = V.quiz, t = Qz.pool.find(t => t.i === +b.dataset.i); if (t && !Qz.line.includes(t)){ Qz.line.push(t); say(t.w); drawQuiz(); } break; }
      case "unpick": V.quiz.line.splice(+b.dataset.i, 1); drawQuiz(); break;
      case "check": { const q = V.quiz.list[V.quiz.i]; answer(V.quiz.line.map(t => t.w).join(" ") === q.order); break; }
      case "next": nextQ(); break;
    }
  });

  draw();
  return { level: () => P.lv };
}

function speechFallback(t){
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t); u.lang = "en-US"; u.rate = .85; speechSynthesis.speak(u);
}

export const CURRICULUM = CUR;   // 확인용
