/* ═════════ 내 방 꾸미기 배경 그림 (여섯 공부방 공통) ═════════
   그림 크기 400 × 260. 바닥(땅)은 y 190 부근이고, 캐릭터는 가운데 아래(x 130~270)에 서요.
   나무 · 가구 · 파라솔 같은 물건은 모두 땅(바닥선)에 뿌리를 두고 그려요.
   공부방에서: window.ROOM_SCENE('forest') → SVG 글자 (없으면 null → 예전 배경) */
(function(){
  const W = 400, H = 260;
  let uid = 0;
  const G = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</linearGradient>`;
  const R = (id, stops) => `<radialGradient id="${id}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</radialGradient>`;

  /* ---------- 그림 조각 ---------- */
  const cloud = (x, y, s = 1, o = .95, c = "#fff") => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}" opacity="${o}">
    <ellipse cx="0" cy="0" rx="26" ry="11"/><circle cx="-10" cy="-6" r="10"/><circle cx="7" cy="-9" r="13"/><circle cx="21" cy="-3" r="8"/></g>`;
  const sun = (x, y, r, glow) => `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#${glow})"/><circle cx="${x}" cy="${y}" r="${r}" fill="#FFE27A"/><circle cx="${x}" cy="${y}" r="${r * .72}" fill="#FFEFA8"/>`;
  // 둥근 나무: 줄기 아래 끝이 baseY (땅)에 닿아요
  const tree = (x, baseY, s = 1, c1 = "#5DB86A", c2 = "#3E9A55") => `<g transform="translate(${x} ${baseY}) scale(${s})">
    <ellipse cx="0" cy="0" rx="16" ry="3.5" fill="#000" opacity=".12"/>
    <path d="M-4 0 L-3 -30 Q0 -34 3 -30 L4 0 Z" fill="#8A5A3B"/><path d="M0 -22 L-9 -32 M1 -26 L9 -36" stroke="#8A5A3B" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="-12" cy="-40" r="15" fill="${c2}"/><circle cx="12" cy="-42" r="16" fill="${c2}"/><circle cx="0" cy="-55" r="19" fill="${c1}"/>
    <circle cx="-13" cy="-44" r="12" fill="${c1}"/><circle cx="11" cy="-47" r="13" fill="${c1}"/><circle cx="-5" cy="-60" r="7" fill="#fff" opacity=".16"/></g>`;
  // 뾰족 나무 (눈이 쌓이면 snow)
  const pine = (x, baseY, s = 1, snow = false, c = "#3F8F5B", c2 = "#2F7A4A") => `<g transform="translate(${x} ${baseY}) scale(${s})">
    <ellipse cx="0" cy="0" rx="13" ry="3" fill="#000" opacity=".12"/><rect x="-3" y="-12" width="6" height="12" fill="#7A4E32"/>
    <path d="M0 -70 L-16 -40 L-8 -40 L-20 -12 L20 -12 L8 -40 L16 -40 Z" fill="${c}"/><path d="M0 -70 L-16 -40 L-8 -40 L-20 -12 L0 -12 Z" fill="${c2}" opacity=".55"/>
    ${snow ? `<path d="M0 -70 L-8 -55 Q0 -52 8 -55 Z M-12 -40 Q0 -36 12 -40 L8 -40 L4 -46 Q0 -44 -4 -46 L-8 -40 Z M-17 -14 Q0 -9 17 -14 L14 -18 Q0 -15 -14 -18 Z" fill="#fff"/>` : ""}</g>`;
  const tuft = (x, y, c = "#4E9F4A") => `<path d="M${x} ${y} q-3 -9 -6 -11 M${x} ${y} q0 -10 1 -13 M${x} ${y} q3 -8 7 -10" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const flower = (x, y, c = "#FF8FB1") => `<g transform="translate(${x} ${y})"><path d="M0 0 V-9" stroke="#4E9F4A" stroke-width="1.6"/>
    <circle cx="0" cy="-12" r="3.2" fill="${c}"/><circle cx="-3.2" cy="-9.8" r="3.2" fill="${c}"/><circle cx="3.2" cy="-9.8" r="3.2" fill="${c}"/><circle cx="0" cy="-10.6" r="1.8" fill="#FFE27A"/></g>`;
  const star = (x, y, r = 1.2, o = .9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
  const sparkle = (x, y, s = 1, c = "#FFF6C8") => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -6 Q1 -1 6 0 Q1 1 0 6 Q-1 1 -6 0 Q-1 -1 0 -6 Z" fill="${c}"/>`;
  const bird = (x, y, s = 1, c = "#5B4A7A") => `<path transform="translate(${x} ${y}) scale(${s})" d="M-7 0 Q-3 -4 0 0 Q3 -4 7 0" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  const fish = (x, y, s = 1, c = "#FFB547", flip = false) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <path d="M-12 0 Q-2 -9 10 0 Q-2 9 -12 0 Z" fill="${c}"/><path d="M-11 0 L-19 -6 L-19 6 Z" fill="${c}"/><circle cx="5" cy="-1.5" r="1.4" fill="#223"/>
    <path d="M-2 -6 Q0 0 -2 6" stroke="#fff" stroke-width="1.4" fill="none" opacity=".6"/></g>`;
  const bubble = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".18" stroke="#fff" stroke-opacity=".55" stroke-width="1"/><circle cx="${x - r * .35}" cy="${y - r * .35}" r="${r * .25}" fill="#fff" opacity=".7"/>`;
  const seaweed = (x, baseY, h, c = "#2FA37A") => `<path d="M${x} ${baseY} q-8 ${-h * .25} 0 ${-h * .5} q8 ${-h * .25} 0 ${-h * .5}" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M${x + 6} ${baseY} q7 ${-h * .2} 0 ${-h * .38} q-7 ${-h * .18} 0 ${-h * .36}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  // 방 바닥: 나무 널빤지
  const woodFloor = (id, c1, c2, line) => `<rect x="0" y="190" width="${W}" height="70" fill="url(#${id})"/>
    ${[0, 1, 2, 3].map(i => `<path d="M0 ${200 + i * 16} H${W}" stroke="${line}" stroke-width="1" opacity=".5"/>`).join("")}
    ${[40, 130, 220, 310, 80, 170, 260, 350].map((x, i) => `<path d="M${x} ${i < 4 ? 190 : 206} v16" stroke="${line}" stroke-width="1" opacity=".45"/>`).join("")}
    <rect x="0" y="186" width="${W}" height="5" fill="${c2}"/>`;
  const windowFrame = (x, y, w, h, sky1, sky2, id) => `<g><rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="4" fill="#fff"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#${id})"/>
    ${cloud(x + w * .35, y + h * .4, .5)}<path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="#fff" stroke-width="4"/>
    <rect x="${x - 8}" y="${y + h + 2}" width="${w + 16}" height="6" rx="2" fill="#F1E4D2"/></g>`;
  const plant = (x, baseY, s = 1) => `<g transform="translate(${x} ${baseY}) scale(${s})"><ellipse cx="0" cy="0" rx="14" ry="3" fill="#000" opacity=".12"/>
    <path d="M-10 -20 L10 -20 L7 0 L-7 0 Z" fill="#D9825B"/><rect x="-11" y="-23" width="22" height="5" rx="2" fill="#E89A74"/>
    <path d="M0 -22 Q-16 -36 -14 -52 Q-4 -40 0 -22 Z M0 -22 Q14 -38 16 -50 Q6 -36 0 -22 Z M0 -22 Q-2 -44 4 -60 Q6 -40 0 -22 Z" fill="#4CA86A"/></g>`;
  const rug = (cx, cy, rx, ry, c1, c2) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c1}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - 10}" ry="${ry - 5}" fill="none" stroke="${c2}" stroke-width="3" stroke-dasharray="6 5"/>`;

  /* ---------- 배경 12개 ---------- */
  const S = {
    // 🏠 기본 방: 밝은 벽 · 창문 · 나무 바닥 · 러그 · 화분
    plain: () => `<defs>${G("pw", [[0, "#F7F9FD"], [1, "#E6ECF6"]])}${G("pf", [[0, "#EBD8BD"], [1, "#D9BE98"]])}${G("psky", [[0, "#BFE4FF"], [1, "#EAF6FF"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#pw)"/><rect x="0" y="150" width="${W}" height="40" fill="#EEF2F9"/><path d="M0 150 H${W}" stroke="#D8E0EE" stroke-width="3"/>
      ${windowFrame(40, 40, 80, 70, "", "", "psky")}
      <rect x="300" y="40" width="44" height="54" rx="3" fill="#fff" stroke="#E4D6C0" stroke-width="4"/><circle cx="322" cy="62" r="10" fill="#FFD27A"/><path d="M306 90 L318 74 L328 84 L338 70 L340 90 Z" fill="#8FCB8A"/>
      ${woodFloor("pf", "#EBD8BD", "#CFB28A", "#C4A57C")}${rug(200, 226, 120, 22, "#F4C9D3", "#fff")}${plant(355, 200, 1.1)}`,

    // 🌊 바닷속: 빛줄기 · 물풀 · 산호 · 물고기 · 모래 바닥
    sea: () => `<defs>${G("sw", [[0, "#8FE0FA"], [.45, "#3FA3E3"], [1, "#1C5AA6"]])}${G("ss", [[0, "#F2D9A0"], [1, "#DDB36A"]])}${G("ray", [[0, "#fff", .45], [1, "#fff", 0]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#sw)"/>
      ${[[60, 30], [150, 40], [250, 26], [330, 36]].map(([x, w]) => `<path d="M${x} 0 L${x + w} 0 L${x + w * 2.4} 200 L${x + w * .6} 200 Z" fill="url(#ray)" opacity=".5"/>`).join("")}
      ${fish(300, 70, 1.2, "#FFB547")}${fish(90, 100, 1, "#FF7A8A", true)}${fish(330, 120, .8, "#7CE0C3", true)}${fish(60, 60, .7, "#FFE07A")}
      ${bubble(40, 40, 6)}${bubble(52, 20, 4)}${bubble(360, 50, 5)}${bubble(348, 28, 3)}${bubble(210, 30, 4)}
      <path d="M0 196 Q60 184 120 194 T240 192 T${W} 194 V${H} H0 Z" fill="url(#ss)"/>
      ${seaweed(22, 206, 90)}${seaweed(46, 204, 60, "#27906B")}${seaweed(372, 206, 84)}${seaweed(350, 202, 56, "#27906B")}
      <path d="M78 208 q-6 -20 4 -34 q2 12 8 14 q0 -16 10 -24 q-2 18 4 26 q6 -8 12 -6 q-8 14 -6 24 Z" fill="#FF7F8E"/>
      <path d="M300 210 q-4 -22 6 -32 q4 12 8 12 q2 -14 12 -18 q-4 16 2 24 q8 -6 12 -2 q-8 10 -8 18 Z" fill="#FFA56B"/>
      <circle cx="120" cy="228" r="3" fill="#fff" opacity=".6"/><path d="M270 236 q6 -8 12 0 q-6 3 -12 0 Z" fill="#F7B6C8"/>`,

    // 🌳 숲: 해 · 구름 · 겹겹 언덕 · 땅에 뿌리내린 나무 · 풀꽃
    forest: () => `<defs>${G("fs", [[0, "#AEE0FF"], [.7, "#E4F6E4"]])}${R("fsun", [[0, "#FFF3B0", .9], [1, "#FFF3B0", 0]])}${G("fh1", [[0, "#B9E3A8"], [1, "#A2D48E"]])}${G("fh2", [[0, "#8FCF6B"], [1, "#6DB64E"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#fs)"/>${sun(338, 42, 16, "fsun")}${cloud(70, 40, 1)}${cloud(220, 28, .7, .85)}
      <path d="M0 150 Q70 118 150 140 T300 128 T${W} 138 V${H} H0 Z" fill="url(#fh1)"/>
      ${pine(118, 142, .55, false, "#5FA873", "#4E9464")}${tree(300, 132, .6, "#7CC47F", "#63B06A")}${pine(250, 136, .5, false, "#5FA873", "#4E9464")}
      <path d="M0 196 Q100 176 200 190 T${W} 186 V${H} H0 Z" fill="url(#fh2)"/>
      ${tree(40, 200, 1.25)}${pine(88, 196, 1)}${tree(360, 196, 1.15, "#6CC070", "#4FA85B")}${pine(318, 192, .85)}
      ${tuft(110, 236)}${tuft(300, 240)}${tuft(20, 246)}${tuft(380, 244)}${flower(96, 244)}${flower(318, 250, "#FFD166")}${flower(122, 252, "#B8A2FF")}${flower(290, 232, "#FF8FB1")}
      <g transform="translate(66 236)"><path d="M-6 0 Q0 -14 6 0 Z" fill="#E4574E"/><circle cx="-2" cy="-6" r="1.4" fill="#fff"/><circle cx="2" cy="-3" r="1.1" fill="#fff"/><rect x="-1.6" y="0" width="3.2" height="5" fill="#F6EBDD"/></g>`,

    // 🌇 노을: 붉은 하늘 · 지는 해 · 보랏빛 언덕 · 새
    sunset: () => `<defs>${G("ss1", [[0, "#6E5AB8"], [.45, "#FF7E79"], [.8, "#FFB38A"], [1, "#FFD6A0"]])}${R("ssun", [[0, "#FFE9A6", .95], [1, "#FFB38A", 0]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#ss1)"/>${star(40, 20, 1)}${star(90, 34, .8, .7)}${star(360, 18, 1)}
      <path d="M322 24 a12 12 0 1 0 10 18 a9 9 0 1 1 -10 -18 Z" fill="#FFF3D1" opacity=".9"/>
      <circle cx="200" cy="170" r="70" fill="url(#ssun)"/><circle cx="200" cy="170" r="30" fill="#FFE08A"/>
      ${cloud(90, 90, 1, .5, "#FFD0C2")}${cloud(300, 110, .8, .45, "#FFD0C2")}${bird(150, 70)}${bird(166, 62, .8)}${bird(260, 80, .9)}
      <path d="M0 160 Q80 140 160 158 T320 150 T${W} 158 V${H} H0 Z" fill="#9A6FB8"/>
      <path d="M0 190 Q90 170 200 186 T${W} 180 V${H} H0 Z" fill="#6E4F9A"/>
      ${pine(40, 192, .9, false, "#4B3674", "#3E2C63")}${pine(70, 190, .6, false, "#4B3674", "#3E2C63")}${tree(356, 186, .9, "#4B3674", "#3E2C63")}
      <path d="M0 220 Q100 206 200 216 T${W} 212 V${H} H0 Z" fill="#533B7C"/>`,

    // ⛄ 눈 나라: 눈 언덕 · 눈 쌓인 나무 · 눈사람 · 눈송이
    snow: () => `<defs>${G("sn", [[0, "#CFE4FA"], [1, "#EEF6FF"]])}${G("sng", [[0, "#FFFFFF"], [1, "#E4EEF9"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#sn)"/>${cloud(80, 34, .9, .9)}${cloud(300, 26, 1.1, .9)}
      <path d="M0 150 Q90 120 180 146 T${W} 136 V${H} H0 Z" fill="#DCE9F7"/>${pine(140, 146, .5, true, "#6D9FB0", "#5B8C9D")}${pine(270, 140, .55, true, "#6D9FB0", "#5B8C9D")}
      <path d="M0 194 Q110 172 210 188 T${W} 184 V${H} H0 Z" fill="url(#sng)"/>
      ${pine(36, 198, 1.1, true)}${pine(78, 194, .8, true)}${pine(330, 192, .9, true)}
      <g transform="translate(368 206)"><ellipse cx="0" cy="0" rx="16" ry="3" fill="#000" opacity=".1"/><circle cx="0" cy="-14" r="15" fill="#fff" stroke="#DDE7F2"/>
        <circle cx="0" cy="-38" r="11" fill="#fff" stroke="#DDE7F2"/><circle cx="-4" cy="-40" r="1.4" fill="#334"/><circle cx="4" cy="-40" r="1.4" fill="#334"/><path d="M0 -37 l7 2 l-7 1 Z" fill="#FF9A3D"/>
        <path d="M-10 -30 Q0 -26 10 -30 L10 -26 Q0 -22 -10 -26 Z" fill="#E4574E"/><rect x="-8" y="-54" width="16" height="4" fill="#334"/><rect x="-5" y="-64" width="10" height="11" fill="#334"/></g>
      ${[[30, 60], [120, 90], [200, 50], [260, 100], [350, 70], [180, 120], [60, 130], [320, 150], [240, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#fff" opacity=".9"/>`).join("")}`,

    // 🪐 우주: 별 · 고리 행성 · 지구 · 달 표면
    space: () => `<defs>${G("sp", [[0, "#12123A"], [1, "#3A2C78"]])}${G("pl", [[0, "#FFB38A"], [1, "#E86F9A"]], 1, 1)}${G("moonG", [[0, "#C9C6DA"], [1, "#9A97B4"]])}${R("neb", [[0, "#8E6CFF", .45], [1, "#8E6CFF", 0]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#sp)"/><ellipse cx="120" cy="70" rx="120" ry="50" fill="url(#neb)"/>
      ${Array.from({ length: 36 }, (_, i) => star((i * 97) % W, (i * 53) % 170, (i % 3) * .5 + .6, .4 + (i % 5) * .12)).join("")}
      ${sparkle(60, 40, 1.2)}${sparkle(330, 120, .9)}${sparkle(250, 30, .7)}
      <g transform="translate(320 64)"><ellipse cx="0" cy="0" rx="44" ry="10" fill="none" stroke="#FFD89A" stroke-width="4" opacity=".7" transform="rotate(-18)"/>
        <circle cx="0" cy="0" r="24" fill="url(#pl)"/><path d="M-24 0 A24 24 0 0 0 24 0" fill="#000" opacity=".12"/>
        <path d="M-44 0 A44 10 0 0 0 44 0" fill="none" stroke="#FFD89A" stroke-width="4" transform="rotate(-18)"/></g>
      <circle cx="70" cy="120" r="14" fill="#4AA3F0"/><path d="M62 112 q6 4 4 10 q-6 2 -8 -4 Z M72 124 q6 -2 8 4 q-4 4 -8 0 Z" fill="#5CC36B"/>
      <path d="M0 196 Q100 180 200 192 T${W} 188 V${H} H0 Z" fill="url(#moonG)"/>
      ${[[50, 214, 10], [120, 236, 7], [300, 222, 12], [360, 244, 6], [230, 246, 5]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .4}" fill="#7F7B9E" opacity=".6"/>`).join("")}
      <g transform="translate(360 196)"><path d="M0 0 V-26" stroke="#ddd" stroke-width="2"/><path d="M0 -26 H16 V-16 H0 Z" fill="#FF6B6B"/></g>`,

    // 🌈 무지개 언덕: 파스텔 하늘 · 무지개 · 구름 · 꽃 언덕
    rainbow: () => `<defs>${G("rb", [[0, "#FFF4D6"], [1, "#DDF4F0"]])}${G("rh", [[0, "#A8E0A0"], [1, "#86CC7E"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#rb)"/>
      ${["#FF8A8A", "#FFB86B", "#FFE27A", "#8FDB8F", "#7CC4FF", "#B39DFF"].map((c, i) => `<path d="M60 200 A140 130 0 0 1 340 200" fill="none" stroke="${c}" stroke-width="10" transform="translate(0 ${i * 10})" opacity=".9"/>`).join("")}
      ${cloud(66, 186, 1.3)}${cloud(338, 186, 1.3)}${cloud(200, 40, .7, .8)}
      <path d="M0 190 Q100 164 200 184 T${W} 178 V${H} H0 Z" fill="url(#rh)"/>
      <path d="M0 222 Q120 206 220 218 T${W} 214 V${H} H0 Z" fill="#76BF6E"/>
      ${flower(40, 214)}${flower(70, 226, "#FFD166")}${flower(100, 212, "#B8A2FF")}${flower(300, 214, "#FF8FB1")}${flower(330, 230, "#7CC4FF")}${flower(365, 216, "#FFD166")}
      ${tuft(120, 244)}${tuft(290, 250)}${sparkle(120, 60, 1, "#fff")}${sparkle(290, 70, .8, "#fff")}`,

    // 📚 공부방: 책장 · 창문 · 책상 · 스탠드 · 나무 바닥
    studyroom: () => `<defs>${G("sw2", [[0, "#FFF6E6"], [1, "#F4E3C6"]])}${G("sf2", [[0, "#C99A6B"], [1, "#A97B4F"]])}${G("ssky", [[0, "#9FD8FF"], [1, "#E6F5FF"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#sw2)"/>
      <g><rect x="18" y="56" width="74" height="132" rx="3" fill="#A97448"/><rect x="24" y="62" width="62" height="120" fill="#8A5A34"/>
        ${[0, 1, 2].map(r => `<rect x="24" y="${100 + r * 40}" width="62" height="4" fill="#A97448"/>` +
          ["#E66A6A", "#4F9BE8", "#FFC857", "#6CC08A", "#B08BE8", "#FF9F6B"].slice(r, r + 4).map((c, i) => `<rect x="${28 + i * 13}" y="${70 + r * 40 + (i % 2) * 4}" width="10" height="${30 - (i % 2) * 4}" rx="1.5" fill="${c}"/>`).join("")).join("")}</g>
      ${windowFrame(140, 34, 90, 70, "", "", "ssky")}
      <path d="M130 30 Q146 70 136 110 L126 110 L126 30 Z M240 30 Q224 70 234 110 L244 110 L244 30 Z" fill="#F29C9C" opacity=".85"/>
      ${woodFloor("sf2", "#C99A6B", "#96683E", "#8C603A")}
      <g><rect x="270" y="130" width="116" height="8" rx="2" fill="#8A5A34"/><rect x="276" y="138" width="6" height="52" fill="#6E4524"/><rect x="374" y="138" width="6" height="52" fill="#6E4524"/>
        <rect x="330" y="100" width="40" height="28" rx="3" fill="#2F3440"/><rect x="333" y="103" width="34" height="21" fill="#7CC4FF"/><rect x="345" y="128" width="10" height="3" fill="#2F3440"/>
        <path d="M290 130 V104 L300 94" stroke="#555" stroke-width="3" fill="none"/><path d="M294 90 L312 90 L304 100 Z" fill="#FFC857"/>
        <rect x="306" y="120" width="18" height="10" fill="#fff" transform="rotate(-8 315 125)"/></g>
      ${rug(200, 228, 110, 20, "#BFD9F2", "#fff")}`,

    // 🎹 피아노 학원: 연보라 벽 · 음표 액자 · 업라이트 피아노 · 보면대
    pianoroom: () => `<defs>${G("pr", [[0, "#F4EEFF"], [1, "#E2D4F8"]])}${G("pf3", [[0, "#D8C0A0"], [1, "#B99A74"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#pr)"/><rect x="0" y="150" width="${W}" height="40" fill="#EDE3FA"/>
      <g><rect x="30" y="36" width="70" height="50" rx="3" fill="#fff" stroke="#CDB8F0" stroke-width="4"/>
        ${[0, 1, 2, 3, 4].map(i => `<path d="M38 ${50 + i * 6} H92" stroke="#B9A6DD" stroke-width="1"/>`).join("")}
        <circle cx="52" cy="68" r="4" fill="#5B4A7A"/><path d="M56 68 V48" stroke="#5B4A7A" stroke-width="2"/><circle cx="74" cy="62" r="4" fill="#5B4A7A"/><path d="M78 62 V44" stroke="#5B4A7A" stroke-width="2"/><path d="M56 48 L78 44" stroke="#5B4A7A" stroke-width="3"/></g>
      <text x="130" y="60" font-size="18" fill="#9C84CF">♪</text><text x="160" y="44" font-size="14" fill="#B39DFF">♫</text><text x="220" y="54" font-size="16" fill="#9C84CF">♩</text>
      ${woodFloor("pf3", "#D8C0A0", "#A88862", "#A08060")}
      <g><rect x="276" y="92" width="110" height="98" rx="4" fill="#26222E"/><rect x="282" y="98" width="98" height="30" rx="2" fill="#3A3444"/>
        <rect x="270" y="128" width="122" height="14" rx="2" fill="#1B1822"/><rect x="274" y="130" width="114" height="10" fill="#fff"/>
        ${Array.from({ length: 12 }, (_, i) => `<path d="M${274 + i * 9.5} 130 V140" stroke="#ccc" stroke-width=".8"/>`).join("")}
        ${[0, 1, 3, 4, 5, 7, 8, 10].map(i => `<rect x="${280 + i * 9.5}" y="130" width="5" height="6" fill="#222"/>`).join("")}
        <rect x="286" y="142" width="8" height="48" fill="#1B1822"/><rect x="368" y="142" width="8" height="48" fill="#1B1822"/>
        <rect x="316" y="102" width="30" height="22" fill="#fff"/><path d="M320 108 H342 M320 113 H342 M320 118 H342" stroke="#aaa"/></g>
      <g><rect x="306" y="170" width="46" height="8" rx="3" fill="#6E4F9A"/><rect x="310" y="178" width="4" height="14" fill="#4B3674"/><rect x="344" y="178" width="4" height="14" fill="#4B3674"/></g>
      ${plant(40, 200, 1.1)}`,

    // ☕ 카페: 펜던트 조명 · 메뉴판 · 카운터 · 커피 머신
    cafe: () => `<defs>${G("cw", [[0, "#FFF3E8"], [1, "#F3D6BF"]])}${G("cf", [[0, "#B98A6A"], [1, "#936547"]])}${R("lamp", [[0, "#FFE9A6", .8], [1, "#FFE9A6", 0]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#cw)"/><rect x="0" y="0" width="${W}" height="14" fill="#E9C9AE"/>
      ${[70, 200, 330].map(x => `<path d="M${x} 0 V36" stroke="#6E4F3A" stroke-width="1.5"/><circle cx="${x}" cy="54" r="30" fill="url(#lamp)"/><path d="M${x - 14} 48 Q${x} 30 ${x + 14} 48 Z" fill="#3E5C4E"/><circle cx="${x}" cy="50" r="4" fill="#FFE9A6"/>`).join("")}
      <g><rect x="24" y="70" width="80" height="62" rx="4" fill="#2F3B35"/><rect x="28" y="74" width="72" height="54" rx="2" fill="none" stroke="#C9A77A" stroke-width="2"/>
        <text x="64" y="90" font-size="10" fill="#FFF3E8" text-anchor="middle" font-family="sans-serif" font-weight="700">MENU</text>
        ${[0, 1, 2].map(i => `<path d="M36 ${102 + i * 9} H78 M86 ${102 + i * 9} H94" stroke="#E9DCC8" stroke-width="2" stroke-linecap="round"/>`).join("")}</g>
      ${woodFloor("cf", "#B98A6A", "#7F5537", "#7F5537")}
      <g><rect x="262" y="120" width="138" height="70" fill="#8A5A3B"/><rect x="258" y="114" width="142" height="8" rx="2" fill="#6E4524"/>
        ${[0, 1, 2, 3].map(i => `<rect x="${270 + i * 32}" y="130" width="26" height="50" rx="3" fill="#9A6A48"/>`).join("")}
        <rect x="336" y="80" width="40" height="34" rx="4" fill="#C9CED6"/><rect x="342" y="86" width="28" height="10" rx="2" fill="#5A6270"/><rect x="352" y="100" width="8" height="8" fill="#5A6270"/>
        <path d="M290 100 h14 v12 h-14 Z" fill="#fff"/><path d="M304 103 q6 0 6 4 q0 4 -6 4" stroke="#fff" stroke-width="2" fill="none"/><path d="M294 96 q2 -4 0 -8 M300 96 q2 -4 0 -8" stroke="#bbb" stroke-width="1.4" fill="none"/></g>
      ${plant(30, 200, 1.2)}<g transform="translate(120 190)"><rect x="-2" y="-40" width="4" height="40" fill="#5C3A1E"/><ellipse cx="0" cy="-40" rx="18" ry="4" fill="#7A4E2A"/></g>`,

    // 🌉 한강공원: 하늘 · 빌딩 · 강 · 다리 · 잔디 · 나무 · 돗자리
    hangang: () => `<defs>${G("hs", [[0, "#9FD8FF"], [1, "#E6F5FF"]])}${G("hr", [[0, "#6CB9EA"], [1, "#4C9BD3"]])}${G("hg", [[0, "#9ED77A"], [1, "#6FB54E"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#hs)"/>${cloud(70, 36, .9)}${cloud(300, 26, .7, .85)}
      <g fill="#9FB6CF">${[[180, 70, 22], [204, 56, 18], [224, 80, 26], [252, 64, 16], [270, 50, 22], [294, 76, 18], [314, 60, 24], [340, 84, 20]].map(([x, h, w]) => `<rect x="${x}" y="${136 - h}" width="${w}" height="${h}" rx="1"/>`).join("")}</g>
      <rect x="0" y="136" width="${W}" height="44" fill="url(#hr)"/>
      ${[0, 1, 2].map(i => `<path d="M${40 + i * 120} 158 q20 -4 40 0" stroke="#fff" stroke-width="1.5" fill="none" opacity=".6"/>`).join("")}
      <g><rect x="0" y="120" width="${W}" height="6" fill="#E0564F"/>${[20, 110, 200, 290, 380].map(x => `<path d="M${x - 40} 126 Q${x} 104 ${x + 40} 126" fill="none" stroke="#C94A44" stroke-width="3"/><rect x="${x - 3}" y="126" width="6" height="18" fill="#B8403A"/>`).join("")}</g>
      <path d="M0 184 Q100 172 200 180 T${W} 176 V${H} H0 Z" fill="url(#hg)"/>
      ${tree(34, 196, 1.2)}${tree(372, 192, 1)}${tuft(90, 240)}${tuft(310, 246)}${flower(110, 246, "#FFD166")}
      <g transform="translate(300 232)"><path d="M-30 0 L28 0 L20 -14 L-22 -14 Z" fill="#FFB0B0"/><path d="M-26 -3 L24 -3 M-14 0 L-10 -14 M4 0 L6 -14" stroke="#fff" stroke-width="2"/></g>
      <path d="M150 160 q4 -3 8 0 q-4 2 -8 0 Z" fill="#fff"/>`,

    // 🏖️ 해수욕장: 해 · 바다 · 요트 · 모래 · 땅에 선 야자수와 파라솔
    beach: () => `<defs>${G("bs", [[0, "#8EDCFF"], [1, "#DDF5FF"]])}${G("bw", [[0, "#3DB2E8"], [1, "#6FD0F0"]])}${G("bsand", [[0, "#F7E2AE"], [1, "#EBC983"]])}${R("bsun", [[0, "#FFF3B0", .9], [1, "#FFF3B0", 0]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#bs)"/>${sun(330, 40, 16, "bsun")}${cloud(80, 40, .9)}
      <rect x="0" y="120" width="${W}" height="70" fill="url(#bw)"/><path d="M0 120 H${W}" stroke="#fff" stroke-width="2" opacity=".6"/>
      <g transform="translate(250 118)"><path d="M-14 0 H14 L10 6 H-10 Z" fill="#fff"/><path d="M0 0 V-26 L12 -4 Z" fill="#fff"/><path d="M-1 -24 L-12 -4 H-1 Z" fill="#FF8A8A"/></g>
      ${[0, 1, 2, 3].map(i => `<path d="M${20 + i * 100} ${150 + (i % 2) * 14} q12 -6 24 0 q12 6 24 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`).join("")}
      <path d="M0 190 Q60 176 120 186 T240 182 T${W} 186 V${H} H0 Z" fill="url(#bsand)"/><path d="M0 190 Q60 176 120 186 T240 182 T${W} 186" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/>
      <g transform="translate(46 204)"><ellipse cx="6" cy="0" rx="22" ry="4" fill="#000" opacity=".12"/>
        <path d="M-2 0 Q-6 -50 14 -96 L20 -94 Q2 -50 6 0 Z" fill="#A9774E"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${-4 + i} ${-12 - i * 14} h8" stroke="#8C5E3A" stroke-width="1.5" opacity=".6"/>`).join("")}
        <path d="M17 -95 Q-10 -110 -32 -88 Q-6 -100 17 -92 Z M17 -95 Q46 -112 64 -86 Q40 -100 17 -92 Z M17 -95 Q10 -124 -12 -128 Q16 -114 17 -95 Z M17 -95 Q34 -126 56 -120 Q30 -112 17 -95 Z M17 -95 Q-4 -80 -18 -60 Q6 -86 17 -95 Z M17 -95 Q40 -84 50 -62 Q30 -84 17 -95 Z" fill="#3FA35A"/>
        <circle cx="12" cy="-90" r="4" fill="#8A5A34"/><circle cx="20" cy="-88" r="4" fill="#8A5A34"/></g>
      <g transform="translate(346 214)"><ellipse cx="0" cy="0" rx="20" ry="4" fill="#000" opacity=".12"/><path d="M0 0 V-70" stroke="#777" stroke-width="3"/>
        <path d="M-40 -66 Q0 -104 40 -66 Z" fill="#FF7A7A"/><path d="M-40 -66 Q-20 -92 0 -94 Q-8 -80 -13 -66 Z M13 -66 Q8 -80 0 -94 Q20 -92 40 -66 Z" fill="#fff"/></g>
      <path d="M100 234 q6 -8 12 0 q-6 3 -12 0 Z" fill="#F7B6C8"/><circle cx="290" cy="240" r="7" fill="#fff"/><path d="M283 240 h14 M290 233 v14" stroke="#FF8A8A" stroke-width="2"/>`
  };

  window.ROOM_SCENE = id => {
    const f = S[id]; if (!f) return null;
    uid++;
    // 한 화면에 여러 번 그려도 그라데이션 이름이 겹치지 않게 번호를 붙여요
    const svg = f().replace(/id="([\w-]+)"/g, `id="$1_${uid}"`).replace(/url\(#([\w-]+)\)/g, `url(#$1_${uid})`);
    return `<svg class="me-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${svg}</svg>`;
  };
})();
