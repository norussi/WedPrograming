const $ = (s) => document.querySelector(s);
const ids = Object.keys(Q);
const solved = new Set();
let left = TOTAL_TIME, cur = null, tm;

function clock() {
  const m = String(Math.floor(left / 60)).padStart(2, '0');
  const s = String(left % 60).padStart(2, '0');
  $('#timer').textContent = m + ':' + s;
  $('#hud').classList.toggle('danger', left <= 30);
}
function prog() {
  const p = Math.round((solved.size / ids.length) * 100);
  $('#pct').textContent = p + '%';
  $('#fill').style.width = p + '%';
  $('#done').textContent = solved.size;
}
function openQ(id) {
  if (solved.has(id) || left <= 0) return;
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
  if (win) setTimeout(() => { location.href = 'js-room.html'; }, 3000);
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
$('#hint-btn').addEventListener('click', () => { $('#hint').hidden = !$('#hint').hidden; });
$('#close').addEventListener('click', () => $('#modal').close());
$('#cl-btn').addEventListener('click', () => { $('#checklist').hidden = !$('#checklist').hidden; });
$('#e-retry').addEventListener('click', () => location.reload());

clock(); prog();
tm = setInterval(() => { left--; clock(); if (left <= 0) end(false); }, 1000);
