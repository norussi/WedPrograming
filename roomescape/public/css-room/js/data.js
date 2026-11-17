const Q = {
  board: {
    name: '칠판', answer: 'ssu2026',
    text: '칠판에 보이지 않는 글씨가 숨어 있어요. F12로 숨겨진 요소를 찾아 그 id를 입력하세요.',
    hint: 'F12 → Elements에서 칠판 안쪽을 펼쳐 보세요. Styles에서 display: none이 걸린 요소가 단서예요.',
    body: `<div class="chalkboard"><p>오늘도<br>조금 더 성장하는 하루 :)</p><div class="hidden-chalk" id="ssu2026">숨은 글씨</div></div>`
  },
  monitor: {
    name: '모니터', answer: '173',
    text: '모니터 화면의 파란 상자의 width 값(숫자만)이 비밀번호예요.',
    hint: 'F12로 파란 상자를 선택하고 Styles 또는 Computed 탭에서 width를 확인하세요.',
    body: `<div class="mon-screen"><div class="mon-box"></div></div>`
  },
  locker: {
    name: '사물함', answer: '714',
    text: '사물함 문에 마우스를 올려 보세요. 나타나는 숫자를 문 번호 순서대로 입력하세요.',
    hint: '숫자는 마우스를 올린 동안만 보여요. 문 번호는 왼쪽 위부터 1, 2, 3, 4, 5, 6이에요.',
    body: `<div class="lockers"><div class="door"></div><div class="door"></div><div class="door"></div><div class="door"></div><div class="door"></div><div class="door"></div></div>`
  },
  desk: {
    name: '책상', answer: '3591',
    text: '책상 위 물건을 체크해 보세요. 숨은 단서가 나타나면 비밀번호를 입력하세요.',
    hint: '두 개의 물건을 체크해야 숨겨진 비밀번호가 나와요. 어떤 물건을 함께 체크해야 할까요?',
    body: `<div class="desk-box">
      <input type="checkbox" id="i-note"><label for="i-note">노트</label>
      <input type="checkbox" id="i-case"><label for="i-case">필통</label>
      <input type="checkbox" id="i-book"><label for="i-book">교재</label>
      <input type="checkbox" id="i-bag"><label for="i-bag">가방</label>
      <p class="desk-clue">비밀번호: 3591</p></div>`
  }
};
