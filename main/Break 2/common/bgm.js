/* =====================================================================
 * [통합] 세 실습실 공용 배경음악 설정 (임서은 JS 동아리방 app.js 258~329줄을 옮겨 온 것)
 *  - 사용법: 이 파일을 불러오기 전에 window.BREAK_BGM_SRC = "음악파일경로"; 를 적으세요.
 *  - HTML에 #menuMusic(메뉴 버튼)과 #musicModal(설정 팝업)이 있어야 합니다.
 *  - 켜기/끄기·볼륨은 JS 방과 같은 키(jsClubBgmOn, jsClubBgmVolume)에 저장 → 세 방 설정이 이어집니다.
 * ===================================================================== */
(function () {
  const BGM_SRC = window.BREAK_BGM_SRC || "";
  const $ = (s) => document.querySelector(s);
  const musicModal = $("#musicModal");
  if (!musicModal) return;
  const bgm = new Audio();
  bgm.loop = true;
  const music = { on: true, failed: false, unlockArmed: false };

  function readSetting(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
  }
  function saveSetting(key, value) { try { localStorage.setItem(key, String(value)); } catch (e) { /* 무시 */ } }
  function setMusicVolume(percent, save) {
    bgm.volume = percent / 100;
    $("#musicVolume").value = String(percent);
    $("#musicVolumeText").textContent = percent + "%";
    if (save) saveSetting("jsClubBgmVolume", percent);
  }
  function updateMusicUI() {
    const sw = $("#musicSwitch");
    sw.setAttribute("aria-checked", String(music.on));
    sw.classList.toggle("on", music.on);
    $("#musicState").textContent = music.on ? "켜짐" : "꺼짐";
    const note = $("#musicNote");
    if (!BGM_SRC) { note.textContent = "배경음악 파일이 아직 지정되지 않았어요."; note.hidden = false; }
    else if (music.failed) { note.textContent = "음악 파일을 불러오지 못했어요. 파일 경로를 확인해 주세요."; note.hidden = false; }
    else note.hidden = true;
  }
  function tryPlayMusic() {
    if (!BGM_SRC || !music.on) return;
    const p = bgm.play();
    if (p && p.catch) p.catch(armMusicUnlock);
  }
  // 브라우저가 자동재생을 막으면 화면을 처음 클릭/키 입력할 때 한 번 더 재생 시도
  function armMusicUnlock() {
    if (music.unlockArmed) return;
    music.unlockArmed = true;
    const retry = () => {
      document.removeEventListener("pointerdown", retry);
      document.removeEventListener("keydown", retry);
      music.unlockArmed = false;
      tryPlayMusic();
    };
    document.addEventListener("pointerdown", retry);
    document.addEventListener("keydown", retry);
  }
  function setMusicOn(on) {
    music.on = on;
    saveSetting("jsClubBgmOn", on ? "1" : "0");
    if (on) tryPlayMusic(); else bgm.pause();
    updateMusicUI();
  }
  function openMusic() { updateMusicUI(); musicModal.hidden = false; $("#closeMusic").focus(); }
  function closeMusic() { musicModal.hidden = true; }

  // 초기화
  const saved = Number(readSetting("jsClubBgmVolume", "50"));
  setMusicVolume(saved >= 0 && saved <= 100 ? saved : 50, false);
  music.on = readSetting("jsClubBgmOn", "1") !== "0";
  if (BGM_SRC) bgm.src = BGM_SRC;
  bgm.addEventListener("error", () => { if (BGM_SRC) { music.failed = true; updateMusicUI(); } });
  updateMusicUI();
  tryPlayMusic();

  // 이벤트
  $("#menuMusic").addEventListener("click", () => {
    const dd = $("#menuDropdown");             // ⋮ 메뉴 닫기 (hidden 속성 / .hidden 클래스 둘 다 대응)
    if (dd) { dd.hidden = true; dd.classList.add("hidden"); }
    const t = $("#menuToggle"); if (t) t.setAttribute("aria-expanded", "false");
    openMusic();
  });
  $("#closeMusic").addEventListener("click", closeMusic);
  $("#musicSwitch").addEventListener("click", () => setMusicOn(!music.on));
  $("#musicVolume").addEventListener("input", (e) => setMusicVolume(Number(e.target.value), true));
  musicModal.addEventListener("click", (e) => { if (e.target === musicModal) closeMusic(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !musicModal.hidden) closeMusic(); });
})();
