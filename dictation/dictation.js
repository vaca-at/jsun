/* ─────────────────────────────────────────────────────────────
   💯 받아쓰기 (도진 · 윤아 공부방 공통)
   - 학교 받아쓰기 급수표를 원고지 칸에 맞춰 공부해요: 문장 보기 · 따라 쓰기 · 받아쓰기 시험 · 띄어쓰기 · 헷갈리는 말 · 비슷한 문장 · 오답 노트
   - 공부방에서 import('/dictation/dictation.js') 로 불러서 mountDictation({el, name, school, host}) 로 붙여요
   - host: { speak(text,'ko'), addStar(n), logToday(ok), toast, burst, beep(ok), store:{get(k,d), set(k,v)} }
   - 급수표 · 시험 날짜는 아래 SCHOOLS 만 고치면 돼요. 사진에서 잘 안 보인 문장은 need:true (연습 · 시험에서 빠져요)
   ───────────────────────────────────────────────────────────── */

/* 한 줄 칸 수 (학교 받아쓰기 공책에 맞춰 바꿔요) */
const CELLS = 13;

/* 급수표: s = 받아쓰기 문장 (띄어쓰기 · 문장부호까지 그대로), guess = 사진이 흐려서 짐작한 문장, need = 아직 모르는 문장 */
const LEVELS = {
  4: { s: ['걱정해 줘서 고마워.', '사용하면 안 돼.', '하찮게 여기는 말', '헤어져서 아쉬워.', '안 어울릴까 봐', '그렇게 말해 주니', '정리할 게 너무 많아.', '도움이 됐어.', '상황에 알맞은 표정', '동생을 안고 있다.'],
    // 헷갈리는 말: [바른 말, [틀리기 쉬운 말], 까닭]
    conf: [['줘서', ['저서', '져서'], "'주어서'를 줄이면 '줘서'예요."],
      ['안 돼', ['안 되', '않 돼'], "'되어'를 줄이면 '돼'예요. '안'은 '아니'를 줄인 말이라 띄어 써요."],
      ['하찮게', ['하찬게', '하챦게'], "'하찮다'는 받침 ㄶ을 써요."],
      ['헤어져서', ['해어져서', '헤어저서'], "'헤어지다'는 ㅔ, '지어서'를 줄이면 '져서'예요."],
      ['아쉬워', ['아쉬어', '아쉽어'], "'아쉽다'는 '아쉬워'로 바뀌어요."],
      ['어울릴까 봐', ['어울릴까 바', '어울릴가 봐'], "'보아'를 줄이면 '봐'예요. 'ㄹ까'는 된소리로 나도 '까'로 써요."],
      ['말해 주니', ['마래 주니', '말해 조니'], "소리는 [마래]지만 '말해'로 써요."],
      ['정리할 게', ['정리할께', '정리할개'], "'정리할 것이'를 줄이면 '정리할 게'예요. '게'는 띄어 쓰고 '께'로 쓰지 않아요."],
      ['많아', ['만아', '마나'], "'많다'는 받침 ㄶ이에요. 소리는 [마나]예요."],
      ['됐어', ['됬어', '됐서'], "'되었어'를 줄이면 '됐어'예요. '됬'은 없는 글자예요."],
      ['알맞은', ['알맞는', '알마즌'], "'알맞다'는 '알맞은'으로 써요. '알맞는'은 틀린 말이에요."],
      ['안고', ['않고', '앉고'], "품에 '안다' → '안고'. '않고'는 '아니하고', '앉고'는 '앉다'예요."],
      ['동생을', ['동생를', '동생올'], "받침이 있는 말 뒤에는 '을', 받침이 없으면 '를'이에요."]],
    // 비슷한 문장 (같은 말 · 같은 규칙으로 더 연습)
    // 비슷한 문장: 프린트 문장과 같은 말 · 같은 띄어쓰기 · 같은 문장부호 모양으로만 (프린트와 다른 규칙은 넣지 않아요)
    more: ['기다려 줘서 고마워.', '뛰면 안 돼.', '늦을까 봐', '먹을 게 너무 많아.', '큰 힘이 됐어.', '인형을 안고 있다.', '친구와 헤어져서 아쉬워.'],
    // 비슷한 말 짝: 프린트 낱말과 소리가 비슷한 다른 말 (뜻 구별만, 띄어쓰기 규칙은 가르치지 않아요)
    quiz: [['아기를 품에 □ 있다.', '안고', '않고', "프린트의 '동생을 안고 있다.'처럼 품에 안을 때는 '안고'예요. '않고'는 '하지 않고'처럼 쓰는 다른 말이에요."],
      ['사용하면 안 □.', '돼', '되', "📄 프린트에는 '안 돼.'로 써 있어요."],
      ['정리할 □ 너무 많아.', '게', '께', "📄 프린트에는 '정리할 게'로 써 있어요."]] },
  5: { s: ['사과를 꼭 해야 해.', '정중하게 물어봐야 해.', '상대를 탓하게 되거든.', '깨끗이 긁어내.', '묶음을 쓰임새에 따라', '이야기가 있잖아.', '무늬도 다양합니다.', '헬멧과 장갑', '좋은 생각이에요!', '핥아서 깜짝 놀랐어.'],   // 2026-09-30 엄마 확인
    conf: [['해야 해', ['해야해', '해야 헤'], "'해야'와 '해'는 띄어 써요."],
      ['물어봐야', ['물어바야', '무러봐야'], "'보아야'를 줄이면 '봐야'예요."],
      ['탓하게', ['타타게', '탖하게'], "소리는 [타타게]지만 '탓하게'로 써요."],
      ['되거든', ['돼거든', '되거던'], "'되어'가 아니니까 '되'를 써요."],
      ['깨끗이', ['깨끗히', '깨끄시'], "'깨끗이'는 '이'로 끝나요."],
      ['긁어내', ['글거내', '긁어네'], "'긁다'는 받침 ㄺ이에요."],
      ['쓰임새', ['쓰임세', '씀새'], "'쓰임새'는 ㅐ예요."],
      ['있잖아', ['있잔아', '잇잖아'], "'있지 않아'를 줄이면 '있잖아'예요."],
      ['무늬', ['무니', '무의'], "소리는 [무니]지만 '무늬'로 써요."],
      ['생각이에요', ['생각이예요', '생각이애요'], "받침 있는 말 뒤에는 '이에요'예요."],
      ['핥아서', ['할타서', '핧아서'], "'핥다'는 받침 ㄾ이에요."],
      ['놀랐어', ['놀랏어', '놀랐서'], "지나간 일은 받침 ㅆ을 써요."]],
    more: ['숙제를 꼭 해야 해.', '선생님께 여쭤봐야 해.', '손을 깨끗이 씻어.', '재미있는 이야기가 있잖아.', '멋진 생각이에요!', '강아지가 손을 핥았어.'] },
  6: { s: ['받아 주든지 말든지', '실컷 사과를 하고도', '미안한 까닭을 말한다.', '엄지손가락 굵기만큼씩', '한두 개나 수십 개를', '솔가지나 솔잎으로', '청결하게 만들려고', '그 옷을 고른 까닭', '둥둥 띄울래요.', '소금물에 삶아요.'],   // 2026-09-30 엄마 확인
    conf: [['주든지', ['주던지', '주든지간에'], "고를 때는 '든지', 지난 일을 떠올릴 때는 '던지'예요."],
      ['실컷', ['실껏', '싫컷'], "'실컷'은 받침 없이 '실'이에요."],
      ['까닭', ['까닥', '가닭'], "'까닭'은 받침 ㄺ이에요."],
      ['엄지손가락', ['엄지손까락', '엄지 손가락'], "한 낱말이라 붙여 쓰고 '가락'으로 써요."],
      ['굵기', ['굴기', '국기'], "'굵다'는 받침 ㄺ이에요."],
      ['만큼씩', ['만큼식', '만큼 씩'], "'씩'은 앞말에 붙여 쓰고 ㅆ이에요."],
      ['수십 개', ['수십개', '수 십 개'], "'개'는 세는 말이라 띄어 써요."],
      ['솔잎', ['솔닢', '솔입'], "'솔'과 '잎'이 만나 '솔잎'이에요."],
      ['고른', ['골른', '고룬'], "'고르다' → '고른'이에요."],
      ['삶아요', ['살마요', '삼아요'], "'삶다'는 받침 ㄻ이에요."]],
    more: ['먹든지 말든지', '실컷 놀고 나서', '늦은 까닭을 말했다.', '사탕을 두 개씩', '감자를 삶아요.'] },
  7: { s: ['본 작품들 가운데', '꼭 와 주길 바라요.', '우체국 가세요?', '많이 아팠겠구나.', '내가 이겼잖아.', '큰 도움이 되었어.', '문장을 쓴 까닭', '코를 벌름거리며', '눈을 동그랗게 뜨고', '데굴데굴 구르며'],   // 2026-09-30 엄마 확인
    conf: [['가운데', ['가은데', '가운대'], "'가운데'는 ㅔ예요."],
      ['와 주길', ['와주길', '와 주기를'], "'와 주다'는 띄어 써요."],
      ['바라요', ['바래요', '바라여'], "'바라다'는 '바라요'예요. '바래요'는 색이 바랠 때예요."],
      ['아팠겠구나', ['아팟겠구나', '아팠겟구나'], "지나간 일은 ㅆ, '겠'도 ㅆ이에요."],
      ['이겼잖아', ['이겻잖아', '이겼자나'], "'이기었잖아' → '이겼잖아'."],
      ['되었어', ['돼었어', '되엇어'], "'되다'에 '었'이 붙어 '되었어'예요."],
      ['까닭', ['까닥', '가닭'], "'까닭'은 받침 ㄺ이에요."],
      ['동그랗게', ['동그라케', '동그랗개'], "소리는 [동그라케]지만 '동그랗게'로 써요."],
      ['데굴데굴', ['대굴대굴', '데굴대굴'], "'데굴데굴'은 모두 ㅔ예요."]],
    more: ['꼭 와 주길 바라요.', '도서관 가세요?', '많이 힘들었겠구나.', '공이 데굴데굴 굴러가요.'] },
  8: { s: ['뜻깊은 작품을', '전시할 예정이에요.', '바로 보이실 거예요.', '몇 시에 시작하나요?', '제대로 하지 못해서', '친하게 지내자.', '옆 마을에 사는', '값을 치르고 가야지.', '틀림없이 들었네.', '어깨를 들썩거렸습니다.'],   // 2026-09-30 엄마 확인
    conf: [['뜻깊은', ['뜻 깊은', '뜻깁은'], "'뜻깊다'는 한 낱말이라 붙여 써요. '깊다'는 받침 ㅍ이에요."],
      ['예정이에요', ['예정이예요', '예정이애요'], "받침 있는 말 뒤에는 '이에요'예요."],
      ['보이실 거예요', ['보이실 꺼예요', '보이실거예요'], "'거'는 띄어 쓰고 '꺼'로 쓰지 않아요."],
      ['몇 시', ['몇시', '멷 시'], "'몇'과 '시'는 띄어 써요."],
      ['못해서', ['모태서', '못헤서'], "소리는 [모태서]지만 '못해서'로 써요."],
      ['지내자', ['지네자', '지내쟈'], "'지내다'는 ㅐ예요."],
      ['치르고', ['치루고', '치뤄고'], "값을 낼 때는 '치르다'예요. '치루다'는 틀린 말이에요."],
      ['틀림없이', ['틀림업시', '틀림없히'], "'없이'로 써요."],
      ['들썩거렸습니다', ['들썩거렸읍니다', '들석거렸습니다'], "'습니다'로 쓰고, '들썩'은 ㅆ이에요."]],
    more: ['내일 떠날 예정이에요.', '곧 도착할 거예요.', '몇 살이에요?', '버스 요금을 치르고 탔다.'] },
  9: { s: ['낱말을 가르쳐 줄래?', '사진첩이 바랬다.', '나와 내 짝꿍은', '방법이 다릅니다.', '길을 잃어버렸다.', '함께 추억 만들기', '왠지 쓸쓸했습니다.', '꽃씨를 뿌렸습니다.', '작은 묘목 몇 개씩', '휘파람이 나왔습니다.'],   // 2026-09-30 엄마 확인
    conf: [['낱말', ['난말', '낟말'], "소리는 [난말]이지만 '낱말'로 써요."],
      ['가르쳐', ['가르켜', '갈쳐'], "알려 줄 때는 '가르치다' → '가르쳐'예요."],
      ['바랬다', ['바랫다', '발했다'], "색이 옅어질 때는 '바래다' → '바랬다'예요."],
      ['짝꿍', ['짝궁', '짝꿍이'], "'짝꿍'은 ㄲ이에요."],
      ['잃어버렸다', ['잊어버렸다', '일어버렸다'], "물건이나 길은 '잃다', 기억은 '잊다'예요."],
      ['왠지', ['웬지', '왠찌'], "'왜인지'를 줄여서 '왠지'예요."],
      ['뿌렸습니다', ['뿌렷습니다', '부렸습니다'], "지나간 일은 ㅆ이에요."],
      ['몇 개씩', ['몇개씩', '몇 개 씩'], "'개'는 띄어 쓰고 '씩'은 붙여 써요."]],
    more: ['수학을 가르쳐 줄래?', '열쇠를 잃어버렸다.', '웬일로 일찍 왔니?', '씨앗을 뿌렸습니다.'] },
  10: { s: ['무거운 짐을 싣고', '어리둥절해한 까닭', '계산이 틀렸습니다.', '차례대로 줄 서기', '헷갈리는 말', '감자를 캤다.', '들꽃조차도 없었습니다.', '사막처럼 황량해.', '여느 때와 다름없이', '일 년이 지난 여름날'],   // 2026-09-30 엄마 확인
    conf: [['싣고', ['실고', '싫고'], "짐을 '싣다' → '싣고'예요."],
      ['어리둥절', ['어리등절', '얼이둥절'], "'어리둥절'은 '둥'이에요."],
      ['차례대로', ['차레대로', '차례 대로'], "'차례'는 ㅖ, '대로'는 붙여 써요."],
      ['줄 서기', ['줄서기', '줄 써기'], "'줄'과 '서기'는 띄어 써요."],
      ['캤다', ['캣다', '켰다'], "'캐었다'를 줄이면 '캤다'예요."],
      ['조차도', ['조차 도', '졸차도'], "'조차'와 '도'는 앞말에 붙여 써요."],
      ['황량해', ['황량헤', '황양해'], "'황량하다' → '황량해'예요."],
      ['여느', ['여늬', '여너'], "'여느'는 ㅡ예요."],
      ['다름없이', ['다름업시', '다름 없이'], "'다름없다'는 한 낱말이라 붙여 써요."],
      ['일 년', ['일년', '일 련'], "'년'은 세는 말이라 띄어 써요."]],
    more: ['책을 가방에 싣고', '차례대로 앉아요.', '고구마를 캤다.', '이 년이 지났다.'] }
};

/* 학교마다: 시험 날짜(첫 급이 시작하는 목요일)와 첫 급. 윤아 학교가 다르면 여기만 고쳐요 */
const SCHOOLS = {
  dojin: { first: 4, firstDate: '2026-10-01' },
  yuna: { first: 4, firstDate: '2026-10-01', note: '윤아 학교 받아쓰기 급수표가 따로 있으면 알려 주세요. 지금은 도진이와 같은 급수표예요.' }
};

/* ───── 도움 함수 ───── */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PUNCT = /[.,?!~]/;
const norm = s => String(s || '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/　/g, ' ').replace(/\s+/g, ' ').trim();
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const dayStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const WD = ['일', '월', '화', '수', '목', '금', '토'];
/* 연습 · 시험에 쓰는 문장: 프린트에서 확실히 읽은 것만 (짐작한 문장 guess · 모르는 문장 need 는 빼요) */
const okList = lv => { const L = LEVELS[lv]; return L.s.map((s, i) => ({ s, i })).filter(x => x.s && !(L.need || []).includes(x.i) && !(L.guess || []).includes(x.i)); };
/* 헷갈리는 말: 프린트(확실한 문장)에 나오는 낱말만 */
const confOf = lv => { const P = okList(lv).map(x => x.s); return LEVELS[lv].conf.filter(c => P.some(s => s.includes(c[0]))); };
/* 문장부호 안내는 프린트 그대로 */
const punctWhy = s => { const m = s.match(/[.?!]$/); return m ? `📄 프린트에는 끝에 '${m[0]}' 가 있어요. 문장부호도 한 칸이에요.` : '📄 프린트에는 끝에 문장부호가 없어요. 찍지 않아요.'; };

/* 이번 주 시험: 첫 목요일부터 한 주에 한 급씩 */
function examInfo(school) {
  const sc = SCHOOLS[school] || SCHOOLS.dojin, max = Math.max(...Object.keys(LEVELS).map(Number));
  const [y, m, d] = sc.firstDate.split('-').map(Number), first = new Date(y, m - 1, d), today = new Date(); today.setHours(0, 0, 0, 0);
  let wk = Math.max(0, Math.ceil((today - first) / 864e5 / 7)), lv = sc.first + wk;
  const date = new Date(first); date.setDate(first.getDate() + wk * 7);
  if (lv > max) lv = max;
  const left = Math.round((date - today) / 864e5);
  return { lv, date, left, label: `${date.getMonth() + 1}월 ${date.getDate()}일 (${WD[date.getDay()]})` };
}

/* 원고지 칸: 글자 하나 = 한 칸, 띄어쓰기 = 빈 칸, 문장부호도 한 칸 */
function cells(str) { return [...String(str)]; }
/* 두 글에서 같은 글자 짝 찾기 (틀린 칸 표시용) */
function lcsMarks(a, b) {
  const A = cells(a), B = cells(b), n = A.length, m = B.length, dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const okA = new Array(n).fill(false), okB = new Array(m).fill(false); let i = 0, j = 0;
  while (i < n && j < m) { if (A[i] === B[j]) { okA[i] = okB[j] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
  return { okA, okB };
}
/* ⌨️ 타수: 두벌식 자판을 누르는 횟수 (ㄲ · ㅖ 같은 Shift 글자는 1타, ㅘ · ㄺ 같은 겹글자는 2타, 띄어쓰기 · 문장부호도 1타) */
const JUNG2 = [9, 10, 11, 14, 15, 16, 19], JONG2 = [3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18];
function strokes(ch) {
  const c = ch.charCodeAt(0) - 0xAC00;
  if (c < 0 || c > 11171) return 1;
  const jung = Math.floor(c % 588 / 28), jong = c % 28;
  return 1 + (JUNG2.includes(jung) ? 2 : 1) + (jong ? (JONG2.includes(jong) ? 2 : 1) : 0);
}
/* 맞게 쓴 글자만 세어 1분에 몇 타인지 */
const typeSpeed = (hits, ms) => Math.round(hits / Math.max(ms, 1000) * 60000);

/* 채점: 맞춤법(글자) · 띄어쓰기 · 문장부호를 따로 봐요 */
function grade(typed, ans) {
  const t = norm(typed), a = ans;
  if (t === a) return { ok: true, kinds: [], words: [] };
  const letters = s => s.replace(/[\s.,?!~]/g, ''), punct = s => s.replace(/[^.,?!~]/g, ''), gaps = s => { const out = []; let k = 0; for (const c of s.replace(/[.,?!~]/g, '')) { if (c === ' ') out.push(k); else k++; } return out.join(','); };
  const kinds = [];
  if (letters(t) !== letters(a)) kinds.push('맞춤법');
  if (gaps(t) !== gaps(a) || (letters(t) !== letters(a) && t.split(' ').length !== a.split(' ').length)) kinds.push('띄어쓰기');
  if (punct(t) !== punct(a)) kinds.push('문장부호');
  // 어절마다: 답의 낱말이 아이 글에 그대로 있는지
  const tw = t.split(' '), words = a.split(' ').filter(w => !tw.includes(w));   // 아이 글에 그대로 없는 낱말만
  return { ok: false, kinds: kinds.length ? kinds : ['띄어쓰기'], words };
}

/* ───── 화면 ───── */
const CSS = `
.dc{--wg:#E0897F;--wg2:#F4C9C3;container-type:inline-size}
.dc-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.dc-head h2{margin:0;font-size:1.5rem}
.dc-exam{display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:12px}
.dc-exam .dd{flex:none;min-width:64px;text-align:center;font-size:1.4rem;font-weight:800;color:var(--accent)}
.dc-exam p{margin:0}
.dc-lv{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0 8px;margin-bottom:4px}
.dc-lv::-webkit-scrollbar{display:none}
.dc-lv .pill{flex:none;position:relative}
.dc-lv .pill small{font-size:.7rem;margin-left:3px;opacity:.75}
.dc-modes{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin:6px 0 14px}
.dc-mode{display:flex;align-items:center;gap:8px;padding:12px;border-radius:16px;border:2px solid var(--line);background:var(--paper);text-align:left;font-size:1rem;cursor:pointer;color:var(--ink)}
.dc-mode.on{border-color:var(--accent);background:var(--soft,var(--paper));color:var(--accent)}
.dc-mode .e{font-size:1.4rem}
.dc-mode small{display:block;font-size:.72rem;color:var(--sub)}
/* 원고지 */
.wg{display:grid;grid-template-columns:1.6em repeat(var(--n),1fr);border:2px solid var(--wg);background:#FFFDF8;border-radius:4px;overflow:hidden;font-size:min(30px,calc(64cqw / var(--n)));color:#2A2A2A}
.wg + .wg{margin-top:6px}
.wg i{font-style:normal;display:flex;align-items:center;justify-content:center;aspect-ratio:1;border-left:1px solid var(--wg2);line-height:1;position:relative}
.wg i:first-child{border-left:0;background:#FBEDEA;color:#B4574C;font-size:.62em;font-weight:700;aspect-ratio:auto}
.wg i.p{font-size:1em}
.wg i.sp::after{content:'∨';position:absolute;bottom:-2px;left:-.28em;font-size:.45em;color:#3F8FD0}
.wg i.ghost{color:#C9C3BA}
.wg i.bad{background:#FFE1DE;color:#C0392B}
.wg i.miss{background:#FFF1C9}
.wg i.cur{box-shadow:inset 0 -3px 0 var(--accent)}
.wg.ans{border-color:#9CC9A8}
.wg.ans i{border-left-color:#D2E8D8}
.wg.ans i:first-child{background:#EAF6EE;color:#3E8A55}
.dc-card{padding:14px;margin-bottom:10px}
.dc-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.dc-row .num{font-weight:800;color:var(--accent)}
.dc-say{border:0;background:var(--soft,var(--line));border-radius:999px;padding:.35rem .8rem;font-size:.95rem;cursor:pointer;color:var(--ink)}
.dc-tip{margin:8px 0 0;padding:8px 10px;border-radius:10px;background:var(--paper);border:1.5px dashed var(--line);font-size:.9rem;color:var(--sub)}
.dc-tip b{color:var(--ink)}
.dc-in{width:100%;margin-top:10px;padding:.7rem .9rem;font-size:1.25rem;border-radius:12px;border:2px solid var(--line);background:var(--paper);color:var(--ink);font-family:inherit}
.dc-in:focus{outline:none;border-color:var(--accent)}
.dc-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}
.dc-btns .big-btn{margin:0;flex:1 1 180px}
.dc-kind{display:inline-block;padding:1px 8px;border-radius:999px;font-size:.78rem;margin-right:4px;background:#FFE1DE;color:#B03A2E}
.dc-kind.k-띄어쓰기{background:#E1EEFB;color:#2767A8}
.dc-kind.k-문장부호{background:#FFF1C9;color:#8A6400}
.dc-score{font-size:2.6rem;font-weight:800;color:var(--accent);margin:4px 0}
.dc-speed{margin:8px 0 0;font-size:1rem;color:var(--sub)}
.dc-speed b{font-size:1.5rem;color:var(--accent);font-variant-numeric:tabular-nums}
.dc-speed.big{font-size:1.1rem;margin:2px 0 8px}
.dc-speed.big b{font-size:2rem}
.dc-speed .new{color:var(--ok,#3F8F60);font-weight:700}
.dc-gap{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;font-size:1.7rem;gap:0;margin:14px 0}
.dc-gap span{padding:0 1px}
.dc-gap button{width:18px;height:44px;border:0;background:none;cursor:pointer;position:relative;padding:0}
.dc-gap button::after{content:'';position:absolute;left:8px;top:8px;bottom:8px;width:2px;border-radius:2px;background:var(--line)}
.dc-gap button.on::after{background:#3F8FD0;width:4px;left:7px}
.dc-gap button.on::before{content:'∨';position:absolute;left:1px;top:-14px;font-size:.8rem;color:#3F8FD0}
.dc-gap button.bad::after{background:#E5484D}
.dc-opts{display:grid;gap:8px;margin-top:12px}
.dc-opt{padding:.8rem 1rem;border-radius:14px;border:2px solid var(--line);background:var(--paper);font-size:1.2rem;text-align:left;cursor:pointer;color:var(--ink);font-family:inherit}
.dc-opt.right{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 14%,var(--paper))}
.dc-opt.wrong{border-color:var(--no);background:color-mix(in srgb,var(--no) 12%,var(--paper))}
.dc-q{font-size:1.25rem;margin:4px 0 0;line-height:1.6}
.dc-q .blank{display:inline-block;min-width:3.2em;border-bottom:3px solid var(--accent);text-align:center}
.dc-note{font-size:.85rem;color:var(--sub);margin:6px 0 0}
.dc-prog{height:8px;border-radius:99px;background:var(--line);overflow:hidden;margin:4px 0 10px}
.dc-prog i{display:block;height:100%;background:var(--accent);border-radius:99px}
.dc-pair{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:baseline;font-size:.95rem}
.dc-pair b{font-size:1.1rem}
@media (max-width:520px){ .dc-modes{grid-template-columns:repeat(2,minmax(0,1fr))} .dc-mode{padding:10px} }
`;

export function mountDictation({ el, name = '', school = 'dojin', host = {} }) {
  if (!document.getElementById('dc-style')) { const st = document.createElement('style'); st.id = 'dc-style'; st.textContent = CSS; document.head.appendChild(st); }
  const H = Object.assign({ speak() { }, addStar() { }, logToday() { }, toast() { }, burst() { }, beep() { }, store: { get: (k, d) => d, set() { } } }, host);
  const ex = examInfo(school), sc = SCHOOLS[school] || {};
  const st = H.store.get('dict', {}) || {};           // {best:{lv:점수}, wrong:{lv:[i...]}, tries:{lv:n}}
  const save = () => H.store.set('dict', st);
  const S = { lv: ex.lv, mode: 'study', run: null };

  const say = (t, twice) => { H.speak(t, 'ko'); if (twice) setTimeout(() => H.speak(t, 'ko'), Math.max(2600, t.length * 380)); };
  const L = () => LEVELS[S.lv];

  /* 원고지 한 줄: str 을 칸에 놓아요. opt.ghost = 연하게 보일 답, opt.marks = 칸마다 표시 */
  function grid(num, str, opt = {}) {
    const cs = cells(str), g = opt.ghost ? cells(opt.ghost) : null, n = Math.max(CELLS, cs.length, g ? g.length : 0);
    let h = `<i>${num}</i>`;
    for (let k = 0; k < n; k++) {
      const c = cs[k], gc = g ? g[k] : undefined, show = c !== undefined ? c : (gc !== undefined ? gc : '');
      const cls = [c === undefined && gc !== undefined ? 'ghost' : '', show === ' ' ? 'sp' : '', PUNCT.test(show) ? 'p' : '', opt.marks && opt.marks[k] ? opt.marks[k] : '', opt.cur === k ? 'cur' : ''].filter(Boolean).join(' ');
      h += `<i class="${cls}">${show === ' ' ? '' : esc(show)}</i>`;
    }
    return `<div class="wg ${opt.ans ? 'ans' : ''}" style="--n:${n}" aria-label="${esc(str)}">${h}</div>`;
  }
  // 도움말: 📄 프린트에 쓰인 모양이 먼저, 틀리기 쉬운 모양, 기억 도우미
  const tipLine = c => `<div>📄 프린트: <b>${esc(c[0])}</b> <span style="opacity:.7">(✗ ${c[1].map(esc).join(', ')})</span> · ${esc(c[2])}</div>`;
  const tipsFor = s => confOf(S.lv).filter(c => s.includes(c[0])).map(tipLine).join('');
  /* 틀린 낱말에 맞는 도움말만 + 문장부호 도움말 */
  const bare = w => w.replace(/[.,?!~]/g, '');
  function tipsWrong(s, g) {
    const ws = g.words.map(bare).filter(Boolean);
    const conf = g.kinds.some(k => k !== '문장부호') ? confOf(S.lv).filter(c => s.includes(c[0]) && c[0].split(' ').some(p => ws.some(w => w.includes(p) || p.includes(w)))) : [];
    let h = conf.map(tipLine).join('');
    if (g.kinds.includes('문장부호')) h += `<div><b>문장부호</b> · ${punctWhy(s)}</div>`;
    if (g.kinds.includes('띄어쓰기')) h += `<div><b>띄어쓰기</b> · 📄 프린트처럼 파란 ∨ 자리에서만 한 칸 비워요.</div>`;
    return h;
  }

  function view() {
    const best = st.best || {};
    const lvs = Object.keys(LEVELS).map(Number).sort((a, b) => a - b);
    // 차례: 프린트 보기 → 퀴즈 넷 → 따라 쓰기 · 시험 → 오답 노트
    const modes = [['study', '📋', '프린트 보기', '듣고 칸 보며 익히기'], ['gap', '✂️', '띄어쓰기 퀴즈', '어디를 띄울까?'], ['conf', '🧩', '비슷한 말 퀴즈', '헷갈리는 말 고르기'], ['punct', '❗', '문장부호 퀴즈', '. ? ! 고르기'], ['more', '🔁', '비슷한 문장 퀴즈', '바르게 쓴 문장 고르기'], ['trace', '✍️', '따라 쓰기', '연한 글자 위에 쓰기 · 타수'], ['test', '🎧', '받아쓰기 시험', '듣고 칸에 쓰기 · 100점'], ['wrong', '📒', '오답 노트', `${(st.wrong?.[S.lv] || []).length}개`]];
    el.innerHTML = `<div class="dc">
      <div class="dc-head"><h2>💯 받아쓰기</h2></div>
      <div class="card dc-exam"><div class="dd">${ex.left > 0 ? `D-${ex.left}` : ex.left === 0 ? '오늘!' : '끝'}</div><p><b>${ex.label} ${ex.lv}급 시험</b><br><span class="sub">📄 학교 프린트 그대로 · 띄어쓰기 · 맞춤법 · 문장부호까지 칸에 맞게 써요${sc.note ? `<br>${esc(sc.note)}` : ''}</span></p></div>
      <div class="dc-lv" role="tablist">${lvs.map(v => `<button class="pill ${v === S.lv ? 'on' : ''}" data-dc="lv" data-v="${v}">${v}급${v === ex.lv ? '<small>이번 주</small>' : best[v] != null ? `<small>${best[v]}점</small>` : ''}</button>`).join('')}</div>
      <div class="dc-modes">${modes.map(([k, e, t, s]) => `<button class="dc-mode ${S.mode === k ? 'on' : ''}" data-dc="mode" data-v="${k}"><span class="e">${e}</span><span>${t}<small>${s}</small></span></button>`).join('')}</div>
      <div id="dcBody"></div></div>`;
    body();
  }
  const B = () => el.querySelector('#dcBody');
  function body() {
    ({ study, trace: () => startRun('trace'), test: () => startRun('test'), gap: startGap, conf: startConf, punct: startPunct, more: startMore, wrong: wrongNote })[S.mode]();
  }

  /* 📋 문장 보기 */
  function study() {
    const Lv = L(), guess = Lv.guess || [], need = Lv.need || [];
    B().innerHTML = `<p class="dc-note">📄 학교 프린트와 똑같이 적었어요. 🔊 를 누르면 읽어 줘요. 파란 <b style="color:#3F8FD0">∨</b> 는 프린트에서 띄어 쓴 칸, 문장부호도 한 칸이에요.</p>` +
      Lv.s.map((s, i) => need.includes(i) ? `<div class="card dc-card"><div class="dc-row"><span class="num">${i + 1}.</span><span class="sub">사진이 잘 안 보여요. 엄마가 알려 주면 넣을게요.</span></div></div>` :
        `<div class="card dc-card"><div class="dc-row"><span class="num">${i + 1}.</span><button class="dc-say" data-dc="say" data-v="${esc(s)}">🔊 듣기</button>${guess.includes(i) ? '<small class="sub">(사진이 흐려서 확인 중인 문장 · 확인 전에는 시험 · 퀴즈에 안 나와요)</small>' : ''}</div>${grid(i + 1, s, { ans: true })}${tipsFor(s) ? `<div class="dc-tip">${tipsFor(s)}</div>` : ''}</div>`).join('') +
      (Lv.pairs ? `<div class="card dc-card"><b>🔍 같이 알면 좋은 짝</b><div class="dc-pair" style="margin-top:8px">${Lv.pairs.map(([a, b]) => `<b>${esc(a)}</b><span class="sub">${esc(b)}</span>`).join('')}</div></div>` : '');
  }

  /* ✍️ 따라 쓰기 · 🎧 시험 · 🔁 비슷한 문장: 한 문장씩 원고지에 써요 */
  function startRun(kind, list) {
    const base = kind === 'more' ? (L().more || []).map((s, i) => ({ s, i: 'm' + i })) : okList(S.lv);
    const items = list || (kind === 'test' ? base : kind === 'more' ? shuffle(base) : base);
    S.run = { kind, items, k: 0, res: [], typed: '' };
    drawRun(true);
  }
  function drawRun(first) {
    const R = S.run, it = R.items[R.k];
    if (!it) return drawResult();
    const trace = R.kind === 'trace', title = { trace: '✍️ 따라 쓰기', test: `🎧 ${S.lv}급 받아쓰기 시험`, more: '🔁 비슷한 문장 받아쓰기', retry: '📒 오답 다시 쓰기' }[R.kind];
    B().innerHTML = `<div class="card dc-card">
      <div class="dc-row"><b>${title}</b><span class="sub">${R.k + 1} / ${R.items.length}</span></div>
      <div class="dc-prog"><i style="width:${R.k / R.items.length * 100}%"></i></div>
      <div class="dc-row"><button class="dc-say" data-dc="say" data-v="${esc(it.s)}">🔊 다시 듣기</button>${trace ? '' : '<span class="sub">두 번 읽어 줘요. 띄어쓰기와 문장부호까지!</span>'}</div>
      <div id="dcGrid">${grid(R.k + 1, '', { ghost: trace ? it.s : '' })}</div>
      ${trace ? `<div class="dc-speed" id="dcSpeed">⌨️ <b>0</b>타 <span>· 쓰기 시작하면 시간을 재요${st.speed?.[S.lv] ? ` · 내 최고 ${st.speed[S.lv]}타` : ''}</span></div>` : ''}
      <input class="dc-in" id="dcIn" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="여기에 쓰면 칸에 들어가요" aria-label="받아쓰기 답">
      <div class="dc-btns"><button class="big-btn" data-dc="check">다 썼어요 ✔</button></div></div>`;
    const inp = el.querySelector('#dcIn');
    R.t0 = 0;
    // 따라 쓰기 타수: 맞는 칸에 맞게 쓴 글자만 세요
    const hitsNow = () => { const a = cells(it.s); return cells(inp.value).reduce((n, c, k) => n + (c === a[k] ? strokes(c) : 0), 0); };
    const drawSpeed = () => { const sp = el.querySelector('#dcSpeed'); if (!sp || !R.t0) return; const ms = Date.now() - R.t0;
      sp.innerHTML = `⌨️ <b>${typeSpeed(hitsNow(), ms)}</b>타 <span>· ${(ms / 1000).toFixed(1)}초${st.speed?.[S.lv] ? ` · 내 최고 ${st.speed[S.lv]}타` : ''}</span>`; };
    if (trace) { clearInterval(R.tick); R.tick = setInterval(() => { if (!el.querySelector('#dcSpeed')) { clearInterval(R.tick); return; } drawSpeed(); }, 250); }
    const paint = () => { const v = inp.value, g = el.querySelector('#dcGrid');
      if (trace && !R.t0 && v) R.t0 = Date.now();
      let marks = null; if (trace) { const t = cells(v), a = cells(it.s); marks = t.map((c, k) => c === a[k] ? '' : 'bad'); }
      g.innerHTML = grid(R.k + 1, v, { ghost: trace ? it.s : '', marks, cur: cells(v).length }); drawSpeed(); };
    inp.addEventListener('input', paint);
    if (trace) inp.addEventListener('compositionstart', () => { if (!R.t0) R.t0 = Date.now(); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); check(); } });
    el.querySelector('#dcGrid').addEventListener('click', () => inp.focus());
    inp.focus();
    if (!trace) say(it.s, first !== false); else if (first) say(it.s);
  }
  function check() {
    const R = S.run, it = R.items[R.k], inp = el.querySelector('#dcIn'); if (!inp) return;
    const v = norm(inp.value); if (!v) { H.toast('먼저 써 볼까요?'); inp.focus(); return; }
    const g = grade(v, it.s), { okA, okB } = lcsMarks(v, it.s);
    clearInterval(R.tick);
    // ⌨️ 따라 쓰기 타수: 맞게 쓴 글자의 타 ÷ 걸린 시간
    const sp = R.kind === 'trace' && R.t0 ? { hits: cells(v).reduce((n, c, k) => n + (okA[k] ? strokes(c) : 0), 0), ms: Date.now() - R.t0 } : null;
    R.res.push({ it, v, g, sp });
    H.logToday(g.ok); H.beep(g.ok);
    if (g.ok) { H.addStar(1); }
    B().innerHTML = `<div class="card dc-card">
      <div class="dc-row"><b>${g.ok ? '⭕ 딩동댕! 칸까지 딱 맞았어요' : '❌ 한 번 더 볼까요?'}</b>${g.ok ? '' : g.kinds.map(k => `<span class="dc-kind k-${k}">${k}</span>`).join('')}</div>
      ${sp ? `<div class="dc-speed">⌨️ <b>${typeSpeed(sp.hits, sp.ms)}</b>타 <span>· ${(sp.ms / 1000).toFixed(1)}초</span></div>` : ''}
      <p class="dc-note">내가 쓴 것</p>${grid(R.k + 1, v, { marks: cells(v).map((c, k) => okA[k] ? '' : 'bad') })}
      ${g.ok ? '' : `<p class="dc-note">바른 답</p>${grid('✓', it.s, { ans: true, marks: cells(it.s).map((c, k) => okB[k] ? '' : 'miss') })}<div class="dc-tip">${g.words.length ? `<div>다시 볼 곳: ${g.words.map(w => `<b>${esc(w)}</b>`).join(' · ')}</div>` : ''}${tipsWrong(it.s, g)}</div>`}
      <div class="dc-btns">${g.ok ? '' : `<button class="big-btn" style="background:var(--paper);color:var(--ink);border:2px solid var(--line)" data-dc="again">다시 쓰기</button>`}<button class="big-btn" data-dc="next">${R.k + 1 < R.items.length ? '다음 문장 ▶' : '결과 보기'}</button></div></div>`;
    if (!g.ok && typeof it.i === 'number') { st.wrong = st.wrong || {}; const w = new Set(st.wrong[S.lv] || []); w.add(it.i); st.wrong[S.lv] = [...w]; save(); }
    if (g.ok && R.kind === 'retry' && typeof it.i === 'number') { st.wrong[S.lv] = (st.wrong[S.lv] || []).filter(x => x !== it.i); save(); }
    el.querySelector('[data-dc="next"]')?.focus();
  }
  function drawResult() {
    const R = S.run, n = R.items.length, ok = R.res.filter(r => r.g.ok).length, score = Math.round(ok / n * 100);
    const cnt = {}; R.res.forEach(r => r.g.kinds.forEach(k => cnt[k] = (cnt[k] || 0) + 1));
    if (R.kind === 'test') { st.best = st.best || {}; st.best[S.lv] = Math.max(st.best[S.lv] || 0, score); st.tries = st.tries || {}; st.tries[S.lv] = (st.tries[S.lv] || 0) + 1; save(); if (score === 100) { H.addStar(5); H.burst(); setTimeout(H.burst, 500); } }
    // ⌨️ 따라 쓰기: 모든 문장을 합친 평균 타수 · 급마다 최고 기록
    let speedHTML = '';
    const sps = R.res.map(r => r.sp).filter(Boolean);
    if (R.kind === 'trace' && sps.length) {
      const avg = typeSpeed(sps.reduce((a, s) => a + s.hits, 0), sps.reduce((a, s) => a + s.ms, 0)), old = st.speed?.[S.lv] || 0;
      if (avg > old) { st.speed = st.speed || {}; st.speed[S.lv] = avg; save(); }
      speedHTML = `<div class="dc-speed big">⌨️ 평균 <b>${avg}</b>타 ${avg > old ? `<span class="new">${old ? `🏅 새 기록! (전에는 ${old}타)` : '🏅 첫 기록!'}</span>` : `<span>· 내 최고 ${old}타</span>`}</div>`;
      if (avg > old && old) H.burst();
    }
    B().innerHTML = `<div class="card dc-card center">
      <p><b>${{ trace: '✍️ 따라 쓰기', test: `🎧 ${S.lv}급 받아쓰기`, more: '🔁 비슷한 문장', retry: '📒 오답 다시 쓰기' }[R.kind]} 끝!</b></p>
      <div class="dc-score">${R.kind === 'test' ? score + '점' : `${ok} / ${n}`}</div>${speedHTML}
      <p class="sub">${score === 100 ? '🏆 100점! 칸까지 완벽해요' + (R.kind === 'test' ? ' · 별 5개 더!' : '') : `틀린 곳: ${Object.entries(cnt).map(([k, v]) => `${k} ${v}`).join(' · ') || '없어요'}`}</p>
      ${R.res.filter(r => !r.g.ok).map(r => `<div style="text-align:left;margin-top:10px">${grid('✗', r.v, {})}${grid('✓', r.it.s, { ans: true })}</div>`).join('')}
      <div class="dc-btns"><button class="big-btn" data-dc="mode" data-v="${R.kind === 'retry' ? 'wrong' : R.kind}">다시 하기</button>${R.res.some(r => !r.g.ok && typeof r.it.i === 'number') ? '<button class="big-btn" data-dc="mode" data-v="wrong">📒 오답 노트</button>' : ''}</div></div>`;
  }

  /* ✂️ 띄어쓰기: 붙여 쓴 문장에서 띄울 곳을 눌러요 */
  function startGap() {
    const pool = shuffle(okList(S.lv)).filter(x => x.s.includes(' '));   // 띄어쓰기는 프린트 문장으로만
    S.run = { kind: 'gap', items: pool, k: 0, ok: 0 }; drawGap();
  }
  function drawGap(done) {
    const R = S.run, it = R.items[R.k];
    if (!it) { B().innerHTML = `<div class="card dc-card center"><p><b>✂️ 띄어쓰기 끝!</b></p><div class="dc-score">${R.ok} / ${R.items.length}</div><div class="dc-btns"><button class="big-btn" data-dc="mode" data-v="gap">다시 하기</button></div></div>`; return; }
    const chars = cells(it.s.replace(/ /g, '')), ansGaps = new Set(); let k = 0; for (const c of it.s) { if (c === ' ') ansGaps.add(k); else k++; }
    R.sel = R.sel || new Set();
    let h = ''; chars.forEach((c, i) => { h += `<span>${esc(c)}</span>`; if (i < chars.length - 1 && !PUNCT.test(chars[i + 1])) {
      const on = R.sel.has(i + 1), need = ansGaps.has(i + 1);
      // 확인 뒤: 맞게 띄운 곳 파랑, 빠뜨린 곳 파랑+빨강, 잘못 띄운 곳 빨강
      const cls = done ? (need ? (on ? 'on' : 'on bad') : (on ? 'bad' : '')) : (on ? 'on' : '');
      h += `<button class="${cls}" data-dc="gapT" data-v="${i + 1}" aria-label="${i + 1}번째 글자 뒤 띄우기" ${done ? 'disabled' : ''}></button>`; } });
    B().innerHTML = `<div class="card dc-card"><div class="dc-row"><b>✂️ 어디를 띄어 쓸까요?</b><span class="sub">${R.k + 1} / ${R.items.length}</span><button class="dc-say" data-dc="say" data-v="${esc(it.s)}">🔊</button></div>
      <p class="dc-note">글자 사이를 누르면 파란 ∨ 가 생겨요.</p><div class="dc-gap">${h}</div>
      ${done ? grid('✓', it.s, { ans: true }) : ''}
      <div class="dc-btns"><button class="big-btn" data-dc="${done ? 'gapNext' : 'gapCheck'}">${done ? '다음 ▶' : '확인'}</button></div></div>`;
  }

  /* 🧩 헷갈리는 말 · ❗ 문장부호: 고르기 퀴즈 */
  function confItems() {
    const Lv = L(), out = [];
    // 1) 낱말 고르기: 문장에 빈칸 → 바른 말 고르기
    for (const [right, wrongs, why] of confOf(S.lv)) {
      const src = okList(S.lv).map(x => x.s).find(s => s.includes(right));   // 문제 문장도 프린트 문장
      out.push({ q: esc(src).replace(esc(right), '<span class="blank">?</span>'), say: src, opts: shuffle([right, ...wrongs.slice(0, 2)]), a: right, why: `📄 프린트에는 '${right}'(으)로 써 있어요. ${why}` });
    }
    // 2) 문장 통째로: 받아쓰기 답과 똑같이 쓴 것은? (띄어쓰기 · 맞춤법 · 문장부호 섞어서)
    for (const { s } of shuffle(okList(S.lv)).slice(0, 4)) {
      const v = new Set();
      if (s.includes(' ')) v.add(s.replace(' ', ''));
      const c = confOf(S.lv).find(c => s.includes(c[0])); if (c) v.add(s.replace(c[0], c[1][0]));
      if (/[.?!]$/.test(s)) v.add(s.slice(0, -1)); else v.add(s + '.');
      if (s.split(' ').length > 2) { const w = s.split(' '); const j = 1 + Math.floor(Math.random() * (w.length - 2)); v.add(w.slice(0, j).join(' ') + w[j] + ' ' + w.slice(j + 1).join(' ')); }
      v.delete(s); const opts = shuffle([s, ...shuffle([...v]).slice(0, 3)]);
      out.push({ q: '🎧 학교 프린트와 <b>똑같이</b> 쓴 것은?', say: s, opts, a: s, why: '📄 프린트와 띄어쓰기 · 글자 · 문장부호가 모두 같아야 해요.' });
    }
    // 3) 뜻에 따라 달라지는 말 (quiz: [문제, 바른 답, 틀린 답, 까닭])
    for (const [q, a, w, why] of (Lv.quiz || [])) out.push({ q: esc(q).replace('□', '<span class="blank">?</span>'), opts: shuffle([a, w]), a, why });
    return shuffle(out).slice(0, 12);
  }
  function punctItems() {
    const pool = okList(S.lv).map(x => x.s);   // 문장부호는 프린트 문장으로만
    return shuffle(pool).map(s => { const m = s.match(/[.?!]$/), a = m ? m[0] : '없음';
      return { q: `${esc(m ? s.slice(0, -1) : s)}<span class="blank">□</span>`, say: s, opts: ['.', '?', '!', '없음'], a, why: punctWhy(s) }; });
  }
  /* 🔁 비슷한 문장 퀴즈: 듣고 바르게 쓴 문장 고르기 (틀린 보기는 띄어쓰기 · 맞춤법 · 문장부호 중 하나씩만 달라요) */
  function moreItems() {
    return shuffle(L().more || []).map(s => {
      const v = new Set(), w = s.split(' ');
      if (w.length > 1) { const j = Math.floor(Math.random() * (w.length - 1)); v.add([...w.slice(0, j), w[j] + w[j + 1], ...w.slice(j + 2)].join(' ')); }   // 붙여 쓰기
      const c = (L().conf || []).find(c => s.includes(c[0])); if (c) v.add(s.replace(c[0], c[1][0]));   // 헷갈리는 말
      if (/[.?!]$/.test(s)) v.add(s.slice(0, -1) + (s.endsWith('?') ? '.' : '?')); else v.add(s + '.');   // 문장부호
      const lw = w.map((x, i) => [x.replace(/[.?!]/g, '').length, i]).sort((a, b) => b[0] - a[0])[0];   // 가장 긴 낱말을 띄어 쓰기
      if (lw && lw[0] >= 3) { const x = w[lw[1]]; v.add([...w.slice(0, lw[1]), x.slice(0, 1) + ' ' + x.slice(1), ...w.slice(lw[1] + 1)].join(' ')); }
      v.delete(s);
      return { q: '🎧 잘 듣고, <b>바르게</b> 쓴 문장을 골라요', say: s, opts: shuffle([s, ...shuffle([...v]).slice(0, 2)]), a: s, why: '띄어쓰기 · 글자 · 문장부호가 모두 바른 문장이에요.' };
    });
  }
  function startConf() { S.run = { kind: 'conf', items: confItems(), k: 0, ok: 0 }; drawQuiz(); }
  function startPunct() { S.run = { kind: 'punct', items: punctItems(), k: 0, ok: 0 }; drawQuiz(); }
  function startMore() { S.run = { kind: 'more', items: moreItems(), k: 0, ok: 0 }; drawQuiz(); if (S.run.items[0]) say(S.run.items[0].say); }
  const QUIZ_NAME = { conf: ['🧩 비슷한 말 퀴즈', '🧩 비슷한 말 퀴즈'], punct: ['❗ 문장부호 퀴즈', '❗ 알맞은 문장부호는?'], more: ['🔁 비슷한 문장 퀴즈', '🔁 비슷한 문장 퀴즈'] };
  function drawQuiz(picked) {
    const R = S.run, it = R.items[R.k];
    if (!it) { B().innerHTML = `<div class="card dc-card center"><p><b>${QUIZ_NAME[R.kind][0]} 끝!</b></p><div class="dc-score">${R.ok} / ${R.items.length}</div><div class="dc-btns"><button class="big-btn" data-dc="mode" data-v="${R.kind}">다시 하기</button></div></div>`; return; }
    const done = picked !== undefined;
    B().innerHTML = `<div class="card dc-card"><div class="dc-row"><b>${QUIZ_NAME[R.kind][1]}</b><span class="sub">${R.k + 1} / ${R.items.length}</span>${it.say ? `<button class="dc-say" data-dc="say" data-v="${esc(it.say)}">🔊</button>` : ''}</div>
      <p class="dc-q">${it.q}</p>
      <div class="dc-opts">${it.opts.map((o, i) => `<button class="dc-opt ${done ? (o === it.a ? 'right' : i === picked ? 'wrong' : '') : ''}" data-dc="opt" data-v="${i}" ${done ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      ${done ? `<div class="dc-tip">${it.opts[picked] === it.a ? '⭕ ' : '❌ '}${esc(it.why || '')}</div><div class="dc-btns"><button class="big-btn" data-dc="qNext">다음 ▶</button></div>` : ''}</div>`;
  }

  /* 📒 오답 노트 */
  function wrongNote() {
    const w = (st.wrong?.[S.lv] || []).filter(i => L().s[i]);
    B().innerHTML = w.length ? `<div class="card dc-card"><div class="dc-row"><b>📒 ${S.lv}급 오답 노트</b><span class="sub">${w.length}개</span></div>
      ${w.map(i => `<div style="margin-top:10px"><div class="dc-row"><button class="dc-say" data-dc="say" data-v="${esc(L().s[i])}">🔊</button></div>${grid(i + 1, L().s[i], { ans: true })}${tipsFor(L().s[i]) ? `<div class="dc-tip">${tipsFor(L().s[i])}</div>` : ''}</div>`).join('')}
      <div class="dc-btns"><button class="big-btn" data-dc="retry">틀린 문장만 다시 쓰기</button></div></div>`
      : `<div class="card dc-card center"><p>📒 ${S.lv}급 오답이 없어요!</p><p class="sub">받아쓰기 시험에서 틀린 문장이 여기에 모여요.</p></div>`;
  }

  /* 누르기 */
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-dc]'); if (!b || !el.contains(b)) return;
    const a = b.dataset.dc, v = b.dataset.v, R = S.run;
    if (a === 'lv') { S.lv = +v; S.run = null; view(); }
    else if (a === 'mode') { S.mode = v; S.run = null; view(); }
    else if (a === 'say') say(v);
    else if (a === 'check') check();
    else if (a === 'again') { R.res.pop(); drawRun(false); }
    else if (a === 'next') { R.k++; drawRun(true); }
    else if (a === 'retry') { const items = (st.wrong?.[S.lv] || []).filter(i => L().s[i]).map(i => ({ s: L().s[i], i })); startRun('retry', items); }
    else if (a === 'gapT') { const i = +v; R.sel.has(i) ? R.sel.delete(i) : R.sel.add(i); drawGap(); }
    else if (a === 'gapCheck') { const it = R.items[R.k], ans = new Set(); let k = 0; for (const c of it.s) { if (c === ' ') ans.add(k); else k++; }
      const ok = ans.size === R.sel.size && [...ans].every(x => R.sel.has(x)); if (ok) { R.ok++; H.addStar(1); } H.beep(ok); H.logToday(ok); drawGap(true); }
    else if (a === 'gapNext') { R.k++; R.sel = new Set(); drawGap(); }
    else if (a === 'opt') { const it = R.items[R.k], ok = it.opts[+v] === it.a; if (ok) { R.ok++; H.addStar(1); } H.beep(ok); H.logToday(ok); drawQuiz(+v); }
    else if (a === 'qNext') { R.k++; drawQuiz(); if (R.kind === 'more' && R.items[R.k]) say(R.items[R.k].say); }   // 비슷한 문장은 듣고 고르니까 먼저 읽어 줘요
  });
  view();
  return { refresh: view };
}
