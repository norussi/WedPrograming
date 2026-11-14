(() => {
'use strict';

/* ════════════ 팀 통합용 설정 ════════════ */
const CONFIG = {
  mainUrl: '../index.html',                  // 메인 화면 파일
  nextStageUrl: '../css-room/index.html',          // 클리어 후 이동할 CSS 디자인실 파일
  bgmSrc: 'assets/audio/bgm_html.mp3',    // 없으면 내장 신스 BGM 재생
  defaultNickname: '웹프',
  pw: 'ZjEyX2lzX2tleQ==',                 // PC 03 비밀번호 (base64)
  keys: {                                  // 다른 방과 공유하는 localStorage 키
    nickname: 'break_nickname',            // 메인 화면에서 저장한 닉네임
    elapsed:  'break_elapsed_ms',          // 누적 플레이 시간(ms) — HTML 실습실 입장부터 측정
    hints:    'break_hint_count',          // 누적 힌트 사용 횟수
    stage:    'break_stage_result',        // 방별 통과 기록
    html:     'break_html_progress'        // 이 방의 진행 상황
  },
  // PC 클릭 영역 (assets/images.jfif 기준 %; x,y = 왼쪽 위)
  photoHotspots: {
    1: { x: 3.7,  y: 65.6, w: 33.7, h: 24.3 },
    2: { x: 56.6, y: 65.6, w: 33.0, h: 25.0 },
    3: { x: 29.7, y: 54.3, w: 16.9, h: 12.4 },
    4: { x: 55.0, y: 54.5, w: 16.7, h: 12.1 }
  }
};
const K = CONFIG.keys;

/* ════════════ 유틸 ════════════ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const md = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
const show = el => (typeof el === 'string' ? $(el) : el).classList.remove('hidden');
const hide = el => (typeof el === 'string' ? $(el) : el).classList.add('hidden');
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  raw(k)    { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k)    { try { localStorage.removeItem(k); } catch {} }
};
function hl(src) { // 이미 esc 된 HTML 문자열에 간단한 색칠
  return src
    .replace(/([\w:-]+)=&quot;(.*?)&quot;/g, '<span class=a>$1</span>=<span class=v>&quot;$2&quot;</span>')
    .replace(/&lt;(\/?)([a-zA-Z][\w-]*)/g, '&lt;$1<span class=t>$2</span>');
}
function fmt(ms) {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
  const p = n => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
}
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ════════════ 상태 ════════════ */
const qs = new URLSearchParams(location.search);
if (qs.has('reset')) {
  [K.html, K.elapsed, K.hints, K.stage].forEach(LS.del);
  history.replaceState(null, '', location.pathname);
}
// 이한솔 메인(frontend/js/game.js)은 sessionStorage 'break.play'에 {nickname,...}을 저장함
function mainNick() {
  try { return (JSON.parse(sessionStorage.getItem('break.play')) || {}).nickname || ''; } catch { return ''; }
}
const NICK = (qs.get('nick') || mainNick() || (LS.raw(K.nickname) || '').replace(/^"(.*)"$/, '$1') || CONFIG.defaultNickname).trim().slice(0, 20);
const PASSWORD = atob(CONFIG.pw);
const ORDER = ['pc03', 'pc08', 'pc14', 'pc17'];

const saved = LS.get(K.html, null) || {};
const state = {
  solved:    Object.assign({ pc03: false, pc08: false, pc14: false, pc17: false }, saved.solved),
  hintLevel: Object.assign({ pc03: 0, pc08: 0, pc14: 0, pc17: 0 }, saved.hintLevel),
  entered: !!saved.entered,
  cleared: !!saved.cleared,
  hints:   Number(LS.get(K.hints, 0)) || 0,
  elapsed: Number(LS.get(K.elapsed, 0)) || 0,
  paused: true,
  open: null,
  solving: {}
};
/* [디버그] ?debug=pc17 → pc17 직전까지 해결 처리 / ?debug=all → 전부 해결 (배포 전 삭제) */
if (qs.has('debug')) {
  const target = qs.get('debug'), idx = ORDER.indexOf(target);
  ORDER.forEach((id, i) => { if (target === 'all' || i < idx) state.solved[id] = true; });
  state.entered = true;
  history.replaceState(null, '', location.pathname);
}
function save() {
  LS.set(K.html, { solved: state.solved, hintLevel: state.hintLevel, entered: state.entered, cleared: state.cleared });
  LS.set(K.hints, state.hints);
  LS.set(K.elapsed, Math.round(state.elapsed));
}
const solvedCount = () => ORDER.filter(id => state.solved[id]).length;
const firstThree = () => state.solved.pc03 && state.solved.pc08 && state.solved.pc14;

/* ════════════ 미션 정의 ════════════ */
const MISSIONS = {
  pc03: {
    num: '03', topic: 'console', url: 'lab-pc-03.local/admin-login.html',
    title: '관리자 로그인', task: '콘솔 로그에서 비밀번호 찾기',
    clue: 'CSS', clueDesc: '단서 ① — 다음 실습실 이름의 첫 단어',
    hints: [
      '메모에 "로그에 남김"이라고 적혀 있죠. 웹 개발자가 로그를 남기는 곳은 화면이 아니라 브라우저의 개발자 도구예요.',
      '`F12` (맥은 `⌥ ⌘ I`)로 개발자 도구를 열고 `Console` 탭을 보세요. `[PC-03]` 으로 시작하는 줄이 있어요. 안 보이면 이 창을 닫았다가 다시 열어 보세요.',
      '콘솔에 찍힌 비밀번호는 `' + PASSWORD + '` 입니다.'
    ]
  },
  pc08: {
    num: '08', topic: 'element', url: 'lab-pc-08.local/attendance.html',
    title: '출석 정보 수정', task: '학생증 태그(Element)의 속성 수정하기',
    clue: '_', clueDesc: '단서 ② — 단어와 단어를 잇는 연결 문자. 그리고 학생의 위치는 location 속성이 정한다.',
    hints: [
      '학생증은 이미지가 아니라 `<student>` 라는 HTML 태그의 속성(attribute) 값으로 그려지고 있어요.',
      '학생증을 마우스 오른쪽 버튼으로 클릭 → `검사`를 누르면 `Elements` 탭에서 `<student>` 태그로 바로 이동해요. 속성 값을 더블클릭하면 수정할 수 있어요.',
      '`name="' + NICK + '"`, `status="present"` 로 바꾸면 출석 처리돼요.'
    ]
  },
  pc14: {
    num: '14', topic: 'input type', url: 'lab-pc-14.local/course-form.html',
    title: '실습 항목 신청서', task: 'H·T·M·L 네 항목 모두 체크하기',
    clue: 'classroom', clueDesc: '단서 ③ — 다음 실습실 이름의 마지막 단어',
    hints: [
      '라디오 버튼(`radio`)은 같은 `name` 끼리 하나만 고를 수 있어요. 여러 개를 동시에 고를 수 있는 입력 방식은 따로 있죠? L 을 보세요.',
      '`Elements` 탭에서 H·T·M 의 `<input>` 태그를 찾아 `type` 속성 값을 더블클릭해 바꿔 보세요.',
      'H·T·M 의 `type="radio"` 를 `type="checkbox"` 로 바꾼 뒤 네 개를 모두 체크하세요.'
    ]
  },
  pc17: {
    num: '17', topic: '종합', url: 'lab-pc-17.local/student-move.html',
    title: '실습실 위치 이동', task: '단서를 조합해 CSS 실습실로 위치 이동',
    clue: null,
    hints: [
      'PC 03 · 08 · 14 에서 얻은 단서 세 개를 순서대로 이어 붙여 보세요.',
      '학생의 위치는 `location` 속성이 정해요. PC 08 에서 했던 것처럼 `Elements` 탭에서 수정하면 돼요.',
      '`location="CSS_classroom"` 으로 바꾸면 이동이 승인돼요.'
    ]
  }
};

const scene = $('#scene');
const MISSION_AT = { 1: 'pc03', 2: 'pc08', 3: 'pc14', 4: 'pc17' };
(function buildScene() {
  Object.entries(CONFIG.photoHotspots).forEach(([num, h]) => {
    const pc = document.createElement('button');
    pc.type = 'button';
    pc.className = 'pc';
    pc.dataset.num = num;
    pc.dataset.mission = MISSION_AT[num];
    pc.style.cssText = `left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%`;
    pc.innerHTML = `<span class="tag">PC ${MISSIONS[MISSION_AT[num]].num}</span>`;
    scene.appendChild(pc);
  });
})();

/* ════════════ 렌더링 ════════════ */
function renderHUD() {
  const n = solvedCount(), pct = Math.round(n / 4 * 100);
  $('#pct').textContent = pct + '%';
  $('#barFill').style.width = pct + '%';
  $('#checkN2').textContent = n;
  $('#checkN').textContent = n;
  $('#hintTotal').textContent = state.hints;
  $('#checkPanel').innerHTML = '<div class="cp-title">HTML 실습실 체크리스트</div>' + ORDER.map(id => {
    const m = MISSIONS[id], d = state.solved[id];
    return `<div class="check-item ${d ? 'done' : ''}"><span class="box">${d ? '✓' : ''}</span><div>
      <div class="t">PC ${m.num} · ${esc(m.task)}</div>
      ${d && m.clue ? `<div class="c">획득 단서 <span class="clue-chip">${esc(m.clue)}</span></div>` : ''}
      ${!d && id === 'pc17' && !firstThree() ? '<div class="c">다른 PC의 단서가 먼저 필요하다</div>' : ''}
    </div></div>`;
  }).join('');
  const bc = $('#boardClues');
  if (bc) bc.innerHTML = ['pc03', 'pc08', 'pc14'].map(id =>
    `<span class="${state.solved[id] ? 'got' : ''}">${state.solved[id] ? esc(MISSIONS[id].clue) : '?'}</span>`
  ).join('<small>+</small>');
}
function renderPCs() {
  const three = firstThree();
  $$('.pc', scene).forEach(el => {
    const id = el.dataset.mission, d = state.solved[id], lock = id === 'pc17' && !three && !d;
    el.classList.toggle('solved', d);
    el.classList.toggle('locked', lock);
    el.setAttribute('aria-label', `PC ${MISSIONS[id].num}${d ? ' (해결됨)' : lock ? ' (잠김)' : ''}`);
  });
}

/* ════════════ 타이머 ════════════ */
let last = performance.now(), saveAcc = 0;
setInterval(() => {
  const now = performance.now(), dt = now - last; last = now;
  if (!state.paused && !state.cleared) {
    state.elapsed += dt; saveAcc += dt;
    if (saveAcc >= 1000) { saveAcc = 0; LS.set(K.elapsed, Math.round(state.elapsed)); }
  }
  $('#timer').textContent = fmt(state.elapsed);
}, 250);
window.addEventListener('beforeunload', save);

/* ════════════ 사운드 ════════════ */
let ac = null;
function audio() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(freq, t0, dur, type = 'sine', vol = .12, dest) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(.03, dur / 3));
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(dest || a.destination);
  o.start(t); o.stop(t + dur + .05);
}
function sfx(kind) {
  if (kind === 'ok')    { tone(660, 0, .25); tone(880, .1, .3); tone(1320, .2, .45); }
  if (kind === 'bad')   { tone(170, 0, .28, 'square', .05); }
  if (kind === 'click') { tone(520, 0, .07, 'triangle', .05); }
  if (kind === 'clear') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .14, .6)); }
}
// [통합] 배경음악은 ../common/bgm.js 설정 팝업에서 관리

/* ════════════ 미션 창 ════════════ */
let cleanup = [];
const body = $('#winBody');
function head(m) {
  return `<div class="m-head"><span class="m-num">PC ${m.num}</span><span class="m-topic">${esc(m.topic)}</span><span class="m-user">접속자: ${esc(NICK)}</span></div>
          <h3 class="m-title">${esc(m.title)}</h3>`;
}
function openMission(id) {
  closeMission(true);
  state.open = id;
  $('#winUrl').textContent = MISSIONS[id].url;
  body.innerHTML = '';
  if (state.solved[id]) renderDone(id); else RENDER[id]();
  renderHints();
  show('#missionOv');
  sfx('click');
}
function closeMission(silent) {
  cleanup.forEach(f => f()); cleanup = [];
  state.open = null;
  $('#hintBox').innerHTML = '';
  hide('#missionOv');
}
function observe(target, fn) {
  const mo = new MutationObserver(fn);
  mo.observe(target, { attributes: true, subtree: true, childList: true, characterData: true });
  cleanup.push(() => mo.disconnect());
}
function setMsg(el, text, cls) { el.textContent = text; el.className = 'msg ' + (cls || ''); }
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

const RENDER = {
  /* ── PC 03 : console ── */
  pc03() {
    const m = MISSIONS.pc03;
    body.innerHTML = head(m) + `
      <p class="desc">관리자 계정으로 로그인해야 실습 기록을 열 수 있다. 화면 구석에 누군가 메모를 남겨 두었다.</p>
      <!-- [메모] 비밀번호 자꾸 까먹어서 로그(console)에 찍어둠. F12 누르면 보임 -->
      <pre class="code"><span class="a">password</span> :
<span class="cm">##비밀번호는 로그에 남김!</span></pre>
      <form class="row" id="pwForm" autocomplete="off">
        <input class="inp mono" id="pwInput" placeholder="비밀번호 입력" spellcheck="false" aria-label="비밀번호">
        <button class="btn primary">로그인</button>
      </form>
      <p class="msg" id="pwMsg"></p>`;
    // 콘솔에 로그 남기기 (창을 열 때마다)
    console.log('%c[PC-03] boot sequence ........ OK', 'color:#64748b');
    console.log('[PC-03] user session: guest  /  lab: html_classroom');
    console.warn('[PC-03] 관리자 비밀번호 변경됨 — 잊어버릴까 봐 로그에 남겨둠');
    console.log('%c[PC-03] password = ' + PASSWORD, 'font-size:15px;font-weight:bold;color:#22c55e;background:#052e16;padding:4px 10px;border-radius:4px');
    console.log('%c[PC-02] password = ********  (권한 없음)', 'color:#64748b');

    let tries = 0;
    const form = $('#pwForm', body), inp = $('#pwInput', body), msg = $('#pwMsg', body);
    setTimeout(() => inp.focus(), 50);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (inp.value.trim().toLowerCase() === PASSWORD) { solve('pc03'); return; }
      tries++; sfx('bad'); shake(form);
      setMsg(msg, tries >= 2 ? '비밀번호가 틀렸습니다. 메모의 "로그"가 어디를 말하는 걸까?' : '비밀번호가 틀렸습니다.', 'bad');
      inp.select();
    });
  },

  /* ── PC 08 : element 수정 ── */
  pc08() {
    const m = MISSIONS.pc08;
    body.innerHTML = head(m) + `
      <p class="desc">출석 관리 시스템. 학생 정보가 비어 있어 오늘 실습 출석이 처리되지 않았다.<br>이 학생증은 <b>HTML 태그</b>로 만들어져 있다.</p>
      <div class="idcard-wrap" id="card08">
        <div class="idcard-top">SSU 학생증 · 출석 확인</div>
        <student name="000" location="html_classroom" status=""></student>
      </div>
      <ul class="rules">
        <li id="r08name"><i></i><span><code>name</code> — 지금 접속한 플레이어의 닉네임 (<b>${esc(NICK)}</b>)</span></li>
        <li id="r08status"><i></i><span><code>status</code> — 출석 상태 코드 <code>present</code> · <code>absent</code> · <code>late</code> 중 하나</span></li>
      </ul>
      <div class="src-label">현재 HTML <em>실시간</em></div>
      <pre class="code" id="src08"></pre>
      <div class="row end"><button class="btn primary" id="chk08">출석 확인</button></div>
      <p class="msg" id="msg08"></p>`;
    const wrap = $('#card08', body), msg = $('#msg08', body);
    const check = (manual) => {
      const s = $('student', wrap);
      if (!s) { $('#src08', body).textContent = '(학생증 태그가 사라졌다… 창을 닫고 다시 열면 복구된다)'; return; }
      const name = (s.getAttribute('name') || '').trim();
      const status = (s.getAttribute('status') || '').trim().toLowerCase();
      const nameOk = name === NICK, stOk = status === 'present' || status === '출석';
      $('#r08name', body).classList.toggle('ok', nameOk);
      $('#r08status', body).classList.toggle('ok', stOk);
      $('#src08', body).innerHTML = hl(esc(fmtTag(s)));
      if (nameOk && stOk) { setMsg(msg, '출석 정보 확인 중…', 'good'); delaySolve('pc08'); }
      else if (manual) {
        sfx('bad'); shake(wrap);
        setMsg(msg, !nameOk && !stOk ? '출석 처리 실패: 이름과 상태가 모두 올바르지 않습니다.' : !nameOk ? '출석 처리 실패: 등록된 접속자와 이름이 다릅니다.' : '출석 처리 실패: 상태 코드를 확인하세요.', 'bad');
      }
    };
    check(false);
    observe(wrap, () => check(false));
    $('#chk08', body).addEventListener('click', () => check(true));
  },

  /* ── PC 14 : input type ── */
  pc14() {
    const m = MISSIONS.pc14;
    body.innerHTML = head(m) + `
      <p class="desc">이번 학기 실습 필수 항목 신청서. <b>H · T · M · L</b> 네 항목을 <b>모두</b> 체크해야 제출된다.</p>
      <div class="opts" id="form14">
        <input type="radio" name="lang" id="h"><label for="h">H</label>
        <input type="radio" name="lang" id="t"><label for="t">T</label>
        <input type="radio" name="lang" id="m"><label for="m">M</label>
        <input type="checkbox" id="l"><label for="l">L</label><br>
      </div>
      <div class="src-label">현재 HTML <em>실시간</em></div>
      <pre class="code" id="src14"></pre>
      <p class="msg" id="msg14"></p>`;
    const form = $('#form14', body), msg = $('#msg14', body);
    let radioClicks = 0;
    const check = () => {
      const inputs = ['h', 't', 'm', 'l'].map(id => form.querySelector('#' + id));
      const lines = [];
      $$(':scope > input, :scope > label', form).forEach(el => {
        if (el.tagName === 'INPUT') lines.push(fmtTag(el, true));
        else lines.push('  ' + fmtTag(el));
      });
      $('#src14', body).innerHTML = hl(esc(lines.join('\n')));
      if (inputs.some(x => !x)) { setMsg(msg, '항목이 사라졌다! 창을 닫고 다시 열면 복구된다.', 'bad'); return; }
      const n = inputs.filter(x => x.checked).length;
      if (n === 4) { setMsg(msg, '네 항목 모두 체크 완료! 제출 중…', 'good'); delaySolve('pc14'); }
      else if (radioClicks >= 2) setMsg(msg, `체크된 항목 ${n}/4 — 라디오(radio) 버튼은 같은 name 끼리 하나만 선택된다. 다른 입력 방식은 없을까?`, 'info');
      else setMsg(msg, `체크된 항목 ${n}/4`);
    };
    form.addEventListener('change', e => { if (e.target.type === 'radio') radioClicks++; check(); });
    observe(form, check);
    check();
  },

  /* ── PC 17 : 종합 ── */
  pc17() {
    const m = MISSIONS.pc17;
    const slots = ['pc03', 'pc08', 'pc14'].map(id =>
      `<span class="slot ${state.solved[id] ? 'got' : ''}">${state.solved[id] ? esc(MISSIONS[id].clue) : '?'}</span>`
    ).join('<span class="plus">+</span>');
    if (!firstThree()) {
      const have = ['pc03', 'pc08', 'pc14'].filter(id => state.solved[id]).length;
      body.innerHTML = head(m) + `
        <p class="desc">학생 위치 이동 시스템 — 아직 잠겨 있다.</p>
        <div class="lockbox">화면에 <b>"이동 승인에 필요한 단서가 부족합니다 (${have}/3)"</b> 문구만 깜빡이고 있다.<br>다른 PC에서 단서를 먼저 모아 오자.</div>
        <div class="slots">${slots}</div>`;
      return;
    }
    body.innerHTML = head(m) + `
      <p class="desc">학생 위치 이동 시스템. 학생증의 위치가 <b>다음 실습실</b>로 바뀌면 이동이 승인된다.</p>
      <div class="slots">${slots}</div>
      <div class="idcard-wrap" id="card17">
        <div class="idcard-top">SSU 학생증 · 위치 이동 신청</div>
        <student name="${esc(NICK)}" location="html_classroom" status="present"></student>
      </div>
      <div class="src-label">현재 HTML <em>실시간</em></div>
      <pre class="code" id="src17"></pre>
      <div class="row end"><button class="btn primary" id="go17">이동 요청</button></div>
      <p class="msg" id="msg17"></p>`;
    const wrap = $('#card17', body), msg = $('#msg17', body);
    const check = (manual) => {
      const s = $('student', wrap);
      if (!s) { $('#src17', body).textContent = '(학생증 태그가 사라졌다… 창을 닫고 다시 열면 복구된다)'; return; }
      $('#src17', body).innerHTML = hl(esc(fmtTag(s)));
      const loc = (s.getAttribute('location') || '').trim();
      if (loc.toLowerCase() === 'css_classroom') { setMsg(msg, '위치 확인 완료 — CSS 실습실로 이동 승인 중…', 'good'); delaySolve('pc17'); return; }
      if (loc !== 'html_classroom') setMsg(msg, `"${loc}" 실습실을 찾을 수 없습니다.`, 'bad');
      else if (manual) setMsg(msg, '현재 위치와 같은 곳으로는 이동할 수 없습니다.', 'bad');
      else setMsg(msg, '');
      if (manual) { sfx('bad'); shake(wrap); }
    };
    check(false);
    observe(wrap, () => check(false));
    $('#go17', body).addEventListener('click', () => check(true));
  }
};

function fmtTag(el, single) { // <student name="..." ...> 를 보기 좋게 문자열로
  const tag = el.tagName.toLowerCase();
  const attrs = Array.from(el.attributes).map(a => a.value === '' && a.name !== 'status' && a.name !== 'name' && a.name !== 'location' ? a.name : `${a.name}="${a.value}"`);
  if (tag === 'student') {
    const pad = ' '.repeat(9);
    return `<student ${attrs[0] || ''}${attrs.slice(1).map(a => '\n' + pad + a).join('')}>\n</student>`;
  }
  if (single || tag === 'input') return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
  return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${el.textContent}</${tag}>`;
}

function delaySolve(id) {
  if (state.solving[id] || state.solved[id]) return;
  state.solving[id] = true;
  setTimeout(() => { state.solving[id] = false; solve(id); }, 650);
}

function solve(id) {
  if (state.solved[id]) return;
  state.solved[id] = true;
  save(); sfx('ok'); renderHUD(); renderPCs();
  if (state.open === id) { cleanup.forEach(f => f()); cleanup = []; renderDone(id, true); renderHints(); }
  if (id !== 'pc17' && firstThree()) setTimeout(() => toast('PC 17의 화면이 켜졌다!'), 900);
  if (id === 'pc17') setTimeout(() => { closeMission(); clearStage(); }, 1500);
}

function renderDone(id, fresh) {
  const m = MISSIONS[id];
  body.innerHTML = `<div class="done">
    <div class="done-ic">✓</div>
    <h3>PC ${m.num} ${fresh ? '미션 해결!' : '— 이미 해결한 PC'}</h3>
    <p>${esc(m.task)}</p>
    ${m.clue
      ? `<div class="reward"><span>획득한 단서</span><b>${esc(m.clue)}</b><small>${esc(m.clueDesc)}</small></div>`
      : '<div class="reward"><span>이동 승인</span><b style="font-size:22px">CSS_classroom</b><small>CSS 디자인실로 이동합니다…</small></div>'}
    ${m.clue ? '<div class="row" style="justify-content:center;margin-top:14px"><button class="btn primary" data-close>확인</button></div>' : ''}
  </div>`;
}

/* ════════════ 클리어 ════════════ */
const PROF_MSG = `${NICK} 학생, HTML 실습 기록 확인했습니다. 콘솔 로그, 요소 수정, 입력 타입 변경까지 개발자 도구를 잘 다뤘네요. 다음은 CSS 디자인실이에요. 화이팅 ^^`;
function clearStage(instant) {
  state.cleared = true;
  const result = LS.get(K.stage, {}) || {};
  result.html = { pass: true, elapsed: Math.round(state.elapsed), hints: state.hints };
  LS.set(K.stage, result);
  save();
  scene.classList.add('fx-clear');
  const go = () => {
    $('#clearTime').textContent = fmt(state.elapsed);
    $('#clearHints').textContent = state.hints + '회';
    show('#clearOv');
    if (!instant) sfx('clear');
    typeWrite($('#profMsg'), PROF_MSG, instant);
  };
  instant ? go() : setTimeout(go, 1000);
}
function typeWrite(el, text, instant) {
  if (instant) { el.textContent = text; return; }
  el.textContent = ''; let i = 0;
  const t = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(t); }, 28);
  el.onclick = () => { clearInterval(t); el.textContent = text; };
}

/* ════════════ 미션별 힌트 ════════════ */
function renderHints() {
  const box = $('#hintBox'), id = state.open;
  if (!id || state.solved[id] || (id === 'pc17' && !firstThree())) { box.innerHTML = ''; return; }
  const m = MISSIONS[id], lv = state.hintLevel[id];
  box.innerHTML = m.hints.slice(0, lv).map((h, i) => `<div class="hint"><b>힌트 ${i + 1}</b> ${md(h)}</div>`).join('')
    + (lv < 3 ? `<button class="btn" id="hintBtn">힌트 ${lv + 1} 받기</button>` : '')
    + `<p class="muted">힌트를 받을 때마다 사용 횟수가 기록돼요. (누적 ${state.hints}회)</p>`;
  const btn = $('#hintBtn', box);
  if (btn) btn.addEventListener('click', () => {
    state.hintLevel[id]++; state.hints++;
    save(); renderHUD(); renderHints(); sfx('click');
  });
}

/* ════════════ 이벤트 ════════════ */
scene.addEventListener('click', e => {
  const pc = e.target.closest('.pc'); if (!pc) return;
  openMission(pc.dataset.mission);
});
$('#winClose').addEventListener('click', () => closeMission());
body.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeMission(); });

$('#checkBtn').addEventListener('click', e => {
  e.stopPropagation();
  const p = $('#checkPanel'); p.classList.toggle('hidden');
  $('#checkBtn').setAttribute('aria-expanded', String(!p.classList.contains('hidden')));
});
document.addEventListener('click', e => { if (!e.target.closest('.check-wrap')) hide('#checkPanel'); });

$('#menuToggle').addEventListener('click', e => { e.stopPropagation(); const d = $('#menuDropdown'); d.classList.toggle('hidden'); $('#menuToggle').setAttribute('aria-expanded', String(!d.classList.contains('hidden'))); });
document.addEventListener('click', e => { if (!e.target.closest('.menu-wrap')) { $('#menuDropdown').classList.add('hidden'); $('#menuToggle').setAttribute('aria-expanded', 'false'); } });
$('#pauseBtn').addEventListener('click', () => { if (state.cleared) return; state.paused = true; save(); show('#pauseOv'); });
$('#resumeBtn').addEventListener('click', () => { hide('#pauseOv'); state.paused = false; });
$('#enterBtn').addEventListener('click', () => {
  state.entered = true; state.paused = false; save(); hide('#introOv'); sfx('click');
});
$('#nextBtn').addEventListener('click', () => { save(); location.href = CONFIG.nextStageUrl; });
$('#retryBtn').addEventListener('click', () => $('#replayBtn').click());
$('#mainBtn').addEventListener('click', () => { save(); location.href = CONFIG.mainUrl; });
$('#replayBtn').addEventListener('click', () => {
  if (!confirm('HTML 실습실 진행 상황과 누적 시간·힌트 기록을 모두 지우고 처음부터 시작할까요?')) return;
  state.paused = true; state.elapsed = 0; state.hints = 0;
  $('#timer').textContent = fmt(0);
  [K.html, K.elapsed, K.hints, K.stage].forEach(LS.del);
  window.removeEventListener('beforeunload', save);
  location.reload();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#missionOv').classList.contains('hidden')) closeMission();
  else hide('#checkPanel');
});

/* ════════════ 시작 ════════════ */
$('#introNick').textContent = NICK;
renderHUD(); renderPCs();
if (state.cleared) clearStage(true);
else if (!state.entered) show('#introOv');
else state.paused = false;

// 팀원 디버깅용: 콘솔에서 HTMLRoom.state 확인 가능
window.HTMLRoom = { state, config: CONFIG, reset: () => { location.search = '?reset=1'; } };
})();
