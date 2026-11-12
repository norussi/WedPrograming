const $ = (s) => document.querySelector(s);
const ids = Object.keys(Q);
const solved = new Set();
let cur = null, tm;   // [통합] 5분 제한 제거 — 전체 누적 시간만 측정
/* [통합] 다른 방과 공유하는 localStorage 키 (이준혁 HTML 방과 동일) */
const KEY = { elapsed: 'break_elapsed_ms', hints: 'break_hint_count', stage: 'break_stage_result' };
const num = (k) => Number(localStorage.getItem(k)) || 0;
let elapsed = num(KEY.elapsed);   // HTML 방에서 이어지는 누적 시간(ms)
let hintSeen = new Set();         // 같은 문제 힌트는 1번만 카운트
function fmtMs(ms) { const t = Math.floor(ms / 1000); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }

function prog() {
  const p = Math.round((solved.size / ids.length) * 100);
  $('#pct').textContent = p + '%';
  $('#fill').style.width = p + '%';
  $('#done').textContent = solved.size;
}
function updateHintCount() { $('#hint-count').textContent = num(KEY.hints); }
function openQ(id) {
  if (solved.has(id)) return;
  cur = id;
  $('#q-title').textContent = Q[id].name;
  $('#q-text').textContent = Q[id].text;
  $('#q-body').innerHTML = Q[id].body;
  $('#hint').textContent = Q[id].hint;
  $('#hint').hidden = true;
  $('#ans').value = '';
  $('#msg').textContent = '';
  $('#modal').showModal();
}
function end(win) {
  clearInterval(tm);
  if ($('#modal').open) $('#modal').close();
  $('#e-title').textContent = win ? '탈출 성공!' : '시간 초과';
  $('#e-text').textContent = win ? 'JavaScript방으로 이동합니다…' : '제한 시간 안에 모든 퀴즈를 풀지 못했어요.';
  $('#e-go').hidden = !win;
  $('#e-retry').hidden = win;
  $('#end').hidden = false;
  $('#e-mark').textContent = win ? '✓' : '!';
  if (win) {
    const r = JSON.parse(localStorage.getItem(KEY.stage) || '{}') || {};
    r.css = { cleared: true, at: Date.now() };
    localStorage.setItem(KEY.stage, JSON.stringify(r));
    localStorage.setItem(KEY.elapsed, String(Math.round(elapsed)));
    setTimeout(() => { location.href = '../js-room/index.html'; }, 3000);
  }
}

document.querySelectorAll('.hot').forEach((b) => b.addEventListener('click', () => openQ(b.dataset.q)));
$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('#ans').value.trim().toLowerCase();
  if (!v) { $('#msg').textContent = '정답을 입력하세요'; return; }
  if (v !== Q[cur].answer) { $('#msg').textContent = '틀렸어요. 다시 확인해 보세요.'; return; }
  solved.add(cur);
  $('#h-' + cur).classList.add('solved');
  document.querySelector('#checklist li[data-q=' + cur + ']').classList.add('ok');
  prog();
  $('#modal').close();
  if (solved.size === ids.length) end(true);
});
$('#hint-btn').addEventListener('click', () => {
  $('#hint').hidden = !$('#hint').hidden;
  if (!$('#hint').hidden && !hintSeen.has(cur)) {   // [통합] 힌트 사용 횟수 누적
    hintSeen.add(cur);
    localStorage.setItem(KEY.hints, String(num(KEY.hints) + 1));
    updateHintCount();
  }
});
/* [통합] ⋮ 메뉴 */
$('#menu-btn').addEventListener('click', (e) => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; });
document.addEventListener('click', (e) => { if (!e.target.closest('.menu-wrap')) $('#menu').hidden = true; });
$('#m-retry').addEventListener('click', () => location.reload());
$('#m-main').addEventListener('click', () => { localStorage.setItem(KEY.elapsed, String(Math.round(elapsed))); location.href = '../index.html'; });
$('#close').addEventListener('click', () => $('#modal').close());
$('#cl-btn').addEventListener('click', () => { $('#checklist').hidden = !$('#checklist').hidden; });
$('#e-retry').addEventListener('click', () => location.reload());

prog();
updateHintCount();
$('#total').textContent = fmtMs(elapsed);
tm = setInterval(() => {
  elapsed += 1000; $('#total').textContent = fmtMs(elapsed);   // [통합] 누적 시간 저장
  localStorage.setItem(KEY.elapsed, String(Math.round(elapsed)));
}, 1000);
