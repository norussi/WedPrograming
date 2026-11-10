/*
 * break-state.js — 방(페이지) 사이에 진행률·타이머·힌트 횟수를 넘기는 공용 모듈
 *
 * 전달 방법 2가지를 같이 씀
 *   1) sessionStorage 'break.state'  : 같은 탭에서 페이지를 옮기면 그대로 유지됨 (기본)
 *   2) URL 쿼리 ?n=&t=&r=&h=&c=       : 저장소가 막힌 환경(시크릿 창, file:// 제한 등)을 위한 예비 경로
 *      받는 쪽은 쿼리가 있으면 쿼리를 우선 쓰고, 저장한 뒤 주소창에서 쿼리를 지움(새로고침해도 안전)
 *
 * 타이머는 "멈춘 시점까지 누적된 ms(elapsedMs)" + "다시 시작한 시각(runningSince)"으로 저장함
 *   → 페이지를 옮기는 동안에도 시간이 계속 흐르고, unload 이벤트를 못 받아도 값이 틀어지지 않음
 */
(function (global) {
  'use strict';

  const KEY = 'break.state';
  const STAGES = ['html', 'css', 'js'];          // 진행률 계산 기준 (3개 방)
  const memory = {};                              // 저장소가 막혔을 때 쓰는 임시 보관

  function blank(nickname) {
    return { nickname: nickname || '', elapsedMs: 0, runningSince: null, hints: 0, cleared: [] };
  }

  function readStore() {
    try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return memory[KEY] || null; }
  }
  function writeStore(s) {
    memory[KEY] = s;
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }

  // 이한솔 메인 화면(frontend/js/game.js)이 저장한 닉네임이 있으면 이어받음
  function mainNickname() {
    try { return (JSON.parse(sessionStorage.getItem('break.play')) || {}).nickname || ''; } catch { return ''; }
  }

  function fromQuery() {
    const q = new URLSearchParams(location.search);
    if (!q.has('t')) return null;
    const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0; };
    return {
      nickname: (q.get('n') || '').slice(0, 20),
      elapsedMs: num(q.get('t')),
      runningSince: q.get('r') === '1' ? Date.now() : null,
      hints: num(q.get('h')),
      cleared: (q.get('c') || '').split(',').filter((x) => STAGES.includes(x))
    };
  }

  function normalize(s) {
    const b = blank();
    if (!s || typeof s !== 'object') return b;
    return {
      nickname: typeof s.nickname === 'string' ? s.nickname : '',
      elapsedMs: Number.isFinite(s.elapsedMs) && s.elapsedMs >= 0 ? s.elapsedMs : 0,
      runningSince: Number.isFinite(s.runningSince) ? s.runningSince : null,
      hints: Number.isSafeInteger(s.hints) && s.hints >= 0 ? s.hints : 0,
      cleared: Array.isArray(s.cleared) ? [...new Set(s.cleared.filter((x) => STAGES.includes(x)))] : []
    };
  }

  /* ── 불러오기: sessionStorage > URL 쿼리 > 새 상태 ──
     같은 탭에서는 goTo()가 이동 직전에 저장하므로 저장소 값이 항상 최신이고,
     타이머 시작 시각(runningSince)도 그대로라 이동하는 동안의 시간까지 정확히 이어짐.
     저장소가 비었거나 막혔을 때만 URL 쿼리 값을 씀. */
  let source = 'new';
  let state;
  const q = fromQuery();
  const stored = readStore();
  if (stored) {
    state = normalize(stored); source = 'storage';
  } else if (q) {
    state = normalize(q); source = 'url';
  } else {
    state = blank();
  }
  if (q) history.replaceState(null, '', location.pathname + location.hash);
  if (!state.nickname) state.nickname = mainNickname() || '테스트';
  writeStore(state);

  const listeners = new Set();
  function commit() { writeStore(state); listeners.forEach((fn) => fn(api.snapshot())); }

  const api = {
    STAGES,
    /** 어디서 값을 받았는지: 'url' | 'storage' | 'new' */
    source,

    /** 현재 누적 시간(ms) */
    elapsed() {
      return state.elapsedMs + (state.runningSince !== null ? Date.now() - state.runningSince : 0);
    },
    /** 진행률(%) — 통과한 방 수 / 3 */
    progress() { return Math.round(state.cleared.length / STAGES.length * 100); },
    isRunning() { return state.runningSince !== null; },

    snapshot() {
      return {
        nickname: state.nickname,
        elapsedMs: api.elapsed(),
        running: api.isRunning(),
        hints: state.hints,
        cleared: state.cleared.slice(),
        progress: api.progress()
      };
    },

    /** 타이머 시작(이미 돌고 있으면 그대로) — 첫 방 입장 시 호출 */
    start() { if (state.runningSince === null) { state.runningSince = Date.now(); commit(); } },
    /** 일시정지 */
    pause() {
      if (state.runningSince === null) return;
      state.elapsedMs = api.elapsed(); state.runningSince = null; commit();
    },
    /** 힌트 1회 사용 */
    useHint() { state.hints += 1; commit(); return state.hints; },
    /** 방 통과 기록 → 진행률 갱신. 마지막 방이면 타이머 정지 */
    clearStage(stage) {
      if (!STAGES.includes(stage)) throw new Error('알 수 없는 방: ' + stage);
      if (!state.cleared.includes(stage)) state.cleared.push(stage);
      if (state.cleared.length === STAGES.length) api.pause(); else commit();
    },
    isCleared(stage) { return state.cleared.includes(stage); },

    /** 다른 방으로 이동하면서 상태 전달 (저장소 + URL 쿼리) */
    goTo(url) {
      writeStore(state);
      const u = new URL(url, location.href);
      u.searchParams.set('n', state.nickname);
      u.searchParams.set('t', String(Math.round(api.elapsed())));
      u.searchParams.set('r', api.isRunning() ? '1' : '0');
      u.searchParams.set('h', String(state.hints));
      u.searchParams.set('c', state.cleared.join(','));
      location.href = u.href;
    },

    /** 전체 초기화 */
    reset(nickname) { state = blank(nickname || state.nickname); commit(); },

    /** 값이 바뀔 때마다 호출될 함수 등록 */
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** mm:ss (1시간 넘으면 h:mm:ss) */
    format(ms) {
      const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
      const p = (n) => String(n).padStart(2, '0');
      return h ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
    }
  };

  global.BreakState = Object.freeze(api);
})(window);
