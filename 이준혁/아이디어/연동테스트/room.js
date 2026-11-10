/*
 * room.js — 두 테스트 방이 같이 쓰는 화면 코드
 * <body data-stage="html" data-next="room2.html" data-prev=""> 처럼 방 정보를 body에 적어 둠
 */
(function () {
  'use strict';
  const S = window.BreakState;
  const $ = (id) => document.getElementById(id);
  const { stage, next, prev } = document.body.dataset;
  const NAMES = { html: 'HTML 실습실', css: 'CSS 디자인실', js: 'JavaScript 동아리방' };

  // 첫 방에 들어오면 타이머 시작 (이미 돌고 있으면 이어서)
  if (S.progress() < 100) S.start();

  function render() {
    const s = S.snapshot();
    $('nick').textContent = s.nickname;
    $('pct').textContent = s.progress + '%';
    $('barFill').style.width = s.progress + '%';
    $('meter').setAttribute('aria-valuenow', String(s.progress));
    $('timer').textContent = S.format(s.elapsedMs);
    $('hintN').textContent = s.hints;
    $('pauseBtn').textContent = s.running ? '일시정지' : (s.progress === 100 ? '완료' : '계속하기');
    $('pauseBtn').disabled = s.progress === 100;

    const done = S.isCleared(stage);
    $('clearBtn').disabled = done;
    $('clearBtn').textContent = done ? '이 방 통과 완료 ✓' : '미션 통과 처리';
    if (next) $('nextBtn').disabled = !done;   // 통과해야 다음 방으로 이동 가능

    $('stageList').replaceChildren(...S.STAGES.map((id) => {
      const li = document.createElement('li');
      li.className = (S.isCleared(id) ? 'pass ' : '') + (id === stage ? 'here' : '');
      li.innerHTML = `<b></b><span></span>`;
      li.firstChild.textContent = NAMES[id] + (id === stage ? ' (현재 방)' : '');
      li.lastChild.textContent = S.isCleared(id) ? 'PASS' : '대기 중';
      return li;
    }));

    // 디버그: 받은 값
    $('rNick').textContent = s.nickname;
    $('rPct').textContent = s.progress + '%  (' + (s.cleared.join(', ') || '없음') + ')';
    $('rTime').textContent = S.format(s.elapsedMs) + (s.running ? '  · 진행 중' : '  · 정지');
    $('rHint').textContent = s.hints + '회';
    let raw = '';
    try { raw = sessionStorage.getItem('break.state'); } catch { raw = '(sessionStorage 사용 불가)'; }
    $('raw').textContent = 'sessionStorage["break.state"]\n' + raw;
  }

  const src = $('src');
  src.textContent = { url: 'URL 쿼리로 받음', storage: 'sessionStorage에서 받음', new: '새로 시작' }[S.source];
  src.classList.add(S.source);

  $('hintBtn').addEventListener('click', () => S.useHint());
  $('clearBtn').addEventListener('click', () => S.clearStage(stage));
  $('pauseBtn').addEventListener('click', () => (S.isRunning() ? S.pause() : S.start()));
  $('resetBtn').addEventListener('click', () => { S.reset(); S.start(); });
  if (next) $('nextBtn').addEventListener('click', () => S.goTo(next));
  if (prev) $('prevBtn').addEventListener('click', () => S.goTo(prev));

  S.onChange(render);
  render();
  setInterval(() => { $('timer').textContent = S.format(S.elapsed()); $('rTime').textContent = S.format(S.elapsed()) + (S.isRunning() ? '  · 진행 중' : '  · 정지'); }, 250);
})();
