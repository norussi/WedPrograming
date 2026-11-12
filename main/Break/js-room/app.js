/*
 * JavaScript 동아리방 방탈출 (입문자용)
 *
 * [채점 방식]
 * 입력한 코드는 이 페이지에서 eval()로 실행하지 않습니다.
 * 대신 sandbox iframe(allow-scripts만 허용, 부모 페이지와 분리된 origin) 안에서 실행하고,
 * 코드가 만들어 낸 "결과 DOM"을 mission.check()로 검사합니다.
 * 그래서 어떤 방법으로 고쳐도(인자 추가, 순서 변경, 함수 수정 등) 결과만 맞으면 정답입니다.
 */

/* =====================================================================
 * ★ 미션 1을 풀면 나타나는 사진을 여기서 직접 지정하세요 ★
 *  - src    : 사진 파일 경로(index.html 기준) 또는 https:// 주소
 *             예) "./assets/club1.jpg"  /  "https://example.com/photo.jpg"
 *  - caption: 사진 아래에 보일 설명
 *  - emoji  : 사진 파일을 못 찾을 때 대신 보일 아이콘
 *  개수는 1~8개까지 자유롭게 바꿀 수 있습니다. (미션 1 문제·정답도 자동으로 맞춰집니다)
 * ===================================================================== */
const PHOTOS = [
  { src: "image1.png", caption: "단체 사진", emoji: "🎉" },
  { src: "image2.png", caption: "JS 스터디", emoji: "💻" },
  { src: "image3.png", caption: "동아리 MT", emoji: "🍺" },
  { src: "image4.png", caption: "멘토멘티", emoji: "📚" }
];

/* =====================================================================
 * ★ 배경음악 파일 ★
 *  - 사용할 음악 파일의 경로를 아래 BGM_SRC에 적으세요.   예) const BGM_SRC = "./bgm.mp3";
 *  - 비워 두면("") 음악이 재생되지 않습니다.
 *  - 웹페이지에서는 ⋮ 메뉴 → 배경음악 설정에서 켜기/끄기와 볼륨만 조절할 수 있습니다.
 * ===================================================================== */
const BGM_SRC = "";

/* =====================================================================
 * ★ 메인 화면 연동 ★
 *  ⋮ 메뉴의 "메인 화면" 버튼을 누르면 아래 함수가 실행됩니다.
 *  메인 화면과 연동하는 코드를 이 함수 안에 작성하세요.
 *  예) window.location.href = "../main/index.html";
 * ===================================================================== */
function goToMainScreen() {
  localStorage.setItem("break_elapsed_ms", String(state.secondsElapsed * 1000)); // [통합]
  location.href = "../index.html";
}

/* ---------- 칠판: 미션 순서와 상관없이 섞여 있는 메모 ---------- */
const BOARD_NOTES = [
  { title: "🔀 인자의 순서", text: "function 이름(a, b, c) 로 만들었다면\n이름(1, 2, 3)  →  a=1, b=2, c=3\n넣은 순서대로 짝지어진다!\n순서가 바뀌면 값도 엉뚱한 자리로 들어간다" },
  { title: "↩️ return", text: "function 이름(재료) { …; return 결과; }\nreturn 이 없으면 돌려받는 값은 undefined\n화면에 글자 'undefined' 가 보이면\n→ return 을 확인!" },
  { title: "🔧 함수 부르기", text: "함수 이름(재료1, 재료2)\n괄호 안에 재료(인자)를 빠뜨리면\n그 재료는 undefined (값 없음)\n재료가 없으면 함수는 제대로 일할 수 없다" },
  { title: "🔤 이름은 똑같이", text: "만든 이름과 부르는 이름이 다르면\n→ ReferenceError: … is not defined\n철자 하나만 달라도 다른 이름!\n함수 안에서는 괄호에 적은 이름만 쓸 수 있다" },
  { title: "( ) 괄호의 힘", text: "이름(재료)  →  함수를 '실행'한다\n이름만 쓰면  →  함수 '자체'를 말하는 것\n(실행되지 않는다!)\n표 한 줄 = tr,  한 칸 = td" },
  { title: "📦 매개변수 vs 인자", text: "매개변수 = 만들 때 괄호 안의 이름 (빈 상자)\n인자 = 부를 때 넣는 실제 값 (담는 물건)\nfunction 두배(n) { … }   두배(5)\nn 은 매개변수, 5 는 인자" }
];

/* ---------- 책장: 힌트 책 4권 + 관련 없는 책 3권 (순서는 섞여 있음) ---------- */
const BOOKS = [
  {
    title: "순서가 곧 짝꿍", color: "#2f6fa5",
    text:
      "함수를 부를 때 넣는 값은 함수가 재료를 받는 순서대로 짝지어집니다.\n  function intro(name, age) { return name + '은 ' + age + '살'; }\n  intro('하늘', 20);   // '하늘은 20살'\n  intro(20, '하늘');   // '20은 하늘살'  ← 순서가 바뀜!\n\n첫 번째 값은 첫 번째 매개변수에, 두 번째 값은 두 번째 매개변수에 들어갑니다. 이름표가 붙어 있는 게 아니라 '자리'로 짝을 맞추기 때문이에요.\n\n결과가 이상하게 나왔다면, 함수를 만든 곳의 괄호 안 순서와 부르는 곳의 괄호 안 순서가 같은지 비교해 보세요. 고치는 방법은 두 가지입니다. 부를 때 순서를 바꾸거나, 함수를 만들 때 매개변수 순서를 바꾸면 됩니다."
  },
  { title: "CSS 레이아웃 사전", color: "#3b6ea5", text:
      "웹페이지의 모양을 꾸미는 언어가 CSS입니다. 글자 크기와 색, 여백, 배경처럼 눈에 보이는 것을 다룹니다.\n\n화면을 배치할 때는 flex와 grid를 많이 씁니다. flex는 가로 또는 세로로 한 줄로 늘어놓을 때, grid는 바둑판처럼 행과 열로 나눌 때 편합니다. display: flex; 한 줄만 적으면 자식 요소들이 나란히 서고, justify-content로 간격을, align-items로 세로 정렬을 정합니다.\n\n반응형 디자인은 화면 크기에 따라 모양이 바뀌게 하는 기법입니다. @media (max-width: 600px) { … } 처럼 조건을 걸어 모바일에서만 다른 규칙을 적용할 수 있습니다.\n\n마지막 장에서는 색 대비와 글자 크기를 정해 읽기 편한 페이지를 만드는 요령을 소개합니다." },
  {
    title: "함수 사용 설명서", color: "#6b3ba5",
    text:
      "함수는 '재료를 넣으면 결과를 내놓는 기계'입니다. 만들 때 괄호 안에 적는 이름을 매개변수, 부를 때 넣는 실제 값을 인자라고 해요.\n  function double(n) { return n * 2; }\n  const a = double(5);   // a는 10\n\n함수를 부를 때 재료를 빠뜨리면 어떻게 될까요? double() 처럼 부르면 n은 undefined(값 없음)가 됩니다. 재료가 두 개 이상이면 쉼표로 구분해서 모두 넣어야 해요.\n  function add(a, b) { return a + b; }\n  add(1);      // b가 없어서 결과가 NaN\n  add(1, 2);   // 3\n\n웹페이지의 사진 자리 목록에서 첫 번째는 images[0], 두 번째는 images[1] 처럼 번호(0부터!)로 꺼냅니다. 사진 주소는 사진 자리.src = '주소' 로 연결합니다."
  },
  { title: "개발자의 커피 레시피", color: "#7a5a3b", text:
      "개발자의 하루는 커피 한 잔으로 시작합니다. 이 책은 원두의 종류부터 이야기합니다. 아라비카는 산미와 향이 좋고, 로부스타는 쓴맛이 강하고 카페인이 많습니다.\n\n코딩 중에는 50분 집중하고 10분 쉬는 방식이 인기입니다. 쉬는 시간에는 화면에서 눈을 떼고 물을 마시거나 가볍게 스트레칭을 해 보세요. 오래 앉아 있으면 어깨와 허리가 먼저 항의합니다.\n\n밤샘 작업은 다음 날의 집중력을 크게 떨어뜨립니다. 잠을 충분히 잔 다음 날 어제 막혔던 문제가 의외로 쉽게 풀렸다는 개발자들의 경험담이 마지막 장에 실려 있습니다." },
  {
    title: "괄호와 이름표", color: "#a5483b",
    text:
      "함수 이름 뒤에 괄호 ( ) 를 붙여야 함수가 실행됩니다.\n  makeRow(member)   // 실행! 결과를 돌려받음\n  makeRow           // 실행 안 됨. 함수 '자체'를 가리킬 뿐\n\n이름만 쓰고 괄호를 빼먹으면 함수 안의 코드는 한 줄도 실행되지 않습니다. 그 상태로 페이지에 붙이면 함수의 설계도(코드)가 글자로 찍혀 나오기도 해요.\n\n또 하나. 함수 안에서는 괄호에 적은 이름(매개변수)만 쓸 수 있습니다.\n  function show(member) { return student.name; }  // ✘ student 는 모르는 이름\n  function show(member) { return member.name; }   // ✔\n모르는 이름을 쓰면 ReferenceError: … is not defined 오류가 납니다.\n\n표에서 한 줄은 tr, 한 칸은 td 입니다. document.createElement('tr') 로 줄을 만들고 표.append(줄) 로 붙입니다."
  },
  { title: "React 맛보기", color: "#2b8fa8", text:
      "React는 화면을 '컴포넌트'라는 작은 부품으로 나눠 만드는 라이브러리입니다. 버튼, 카드, 목록처럼 반복해서 쓰는 조각을 함수 하나로 만들어 두고 필요한 곳에 가져다 씁니다.\n\n컴포넌트 안에서는 JSX라는 문법으로 HTML처럼 보이는 코드를 쓸 수 있습니다. 화면에 따라 바뀌는 값은 '상태(state)'로 관리하는데, useState라는 도구로 만들고 값이 바뀌면 화면이 자동으로 다시 그려집니다.\n\n이 책은 설치 방법과 첫 번째 예제(숫자를 올리는 카운터)까지 안내합니다. 따라 하려면 Node.js와 패키지 관리자가 먼저 필요합니다." },
  {
    title: "돌려주기의 비밀", color: "#2f7d6d",
    text:
      "함수가 일을 마친 뒤 결과를 바깥으로 내보내는 것이 return 입니다.\n  function makeName(n) { return n + ' Club'; }   // 돌려줌 ✔\n  function makeName(n) { const t = n + ' Club'; } // 안 돌려줌 ✘\n\n함수 안에서 아무리 열심히 글자를 만들어도 return 으로 돌려주지 않으면, 바깥에서 받는 값은 undefined 입니다. 그 값을 화면에 넣으면 글자 'undefined' 가 그대로 찍혀요.\n\n또 하나. 함수를 부를 때는 만든 이름과 철자가 똑같아야 합니다. makeTitle 로 만들고 makeTitel 로 부르면 컴퓨터는 그런 이름을 모른다며 ReferenceError: makeTitel is not defined 오류를 냅니다."
  },
];

/* ---------- 미션 데이터 ---------- */
const missionData = [
  /* ===== 미션 1: 이미지 복구하기 (함수를 부를 때 인자 넣기) ===== */
  {
    title: "이미지 복구하기",
    prompt:
      "[상황] 동아리 웹페이지의 사진 " + PHOTOS.length + "장이 깨져 보입니다. 사진 한 장을 연결해 주는 함수 showPhoto가 있는데, 부르는 방법에 문제가 있어요.\n" +
      "[할 일] 사진 " + PHOTOS.length + "장이 모두 알맞은 주소로 연결되도록 코드를 고치세요.\n" +
      "[알아두면 좋은 말] 함수는 '재료를 받아서 일하는 작은 기계'예요. 재료(인자)는 함수 이름 뒤 괄호 안에 쉼표로 구분해 넣습니다. 예) showPhoto(사진 자리, 사진 주소)",
    starterCode:
      "// 사진 자리(img)와 사진 주소(url)를 받아서 사진을 연결해 주는 함수\n" +
      "function showPhoto(img, url) {\n" +
      "  img.src = url;\n" +
      "}\n\n" +
      "// 웹페이지의 사진 자리들과 사진 주소 목록 (0번째, 1번째, ... 순서)\n" +
      "const images = document.querySelectorAll('.gallery-img');\n" +
      "const urls = [\n" +
      PHOTOS.map((p) => "  '" + p.src + "'").join(",\n") + "\n" +
      "];\n\n" +
      "// 사진을 한 장씩 연결합니다.\n" +
      PHOTOS.map((p, i) => "showPhoto(images[" + i + "]);").join("\n"),
    expected: PHOTOS.map((p) => p.src),
    dom: "<div id=\"gallery\">" + PHOTOS.map((p, i) => '<img class="gallery-img" alt="사진 ' + (i + 1) + '">').join("") + "</div>",
    // 이 함수는 sandbox iframe 안에서 실행됩니다(바깥 변수 사용 금지).
    check: function (expected) {
      var imgs = Array.prototype.slice.call(document.querySelectorAll(".gallery-img"));
      if (imgs.length !== expected.length) return { ok: false, message: ".gallery-img 요소가 " + expected.length + "개여야 합니다." };
      var strip = function (v) { return String(v || "").replace(/^\.\//, ""); };
      var wrong = [];
      imgs.forEach(function (img, i) {
        var s = strip(img.getAttribute("src"));
        var e = strip(expected[i]);
        if (!s || (s !== e && !s.endsWith("/" + e))) wrong.push(i + 1);
      });
      if (wrong.length === imgs.length) return { ok: false, message: "사진이 하나도 올바르게 연결되지 않았습니다. 현재 첫 번째 사진의 주소: \"" + imgs[0].getAttribute("src") + "\"" };
      if (wrong.length) return { ok: false, message: wrong.join(", ") + "번째 사진의 주소가 올바르지 않습니다." };
      return { ok: true, message: "정답입니다! 모든 사진이 순서대로 연결되었습니다.", data: {} };
    }
  },

  /* ===== 미션 2: 텍스트 복구하기 (return 빠짐 + 함수 이름 오타) ===== */
  {
    title: "텍스트 복구하기",
    prompt:
      "[상황] 동아리 소개 영역의 제목과 소개 글이 제대로 나타나지 않고, 콘솔에는 빨간 오류가 뜹니다.\n" +
      "[할 일] 제목에는 \"JS Club\", 소개에는 \"함께 배우고 함께 만드는 JavaScript 동아리\"가 나타나도록 코드를 고치세요.\n" +
      "[알아두면 좋은 말] 함수는 일을 마친 뒤 return으로 결과를 돌려줍니다. return이 없으면 돌려받는 값이 없어서(undefined) 화면에 글자 'undefined'가 찍혀요. 또 함수를 부를 때는 만든 이름과 철자가 똑같아야 합니다.",
    starterCode:
      "// 이름(name)을 받아서 제목 글자를 만들어 주는 함수\n" +
      "function makeTitle(name) {\n" +
      "  const text = name + ' Club';\n" +
      "}\n\n" +
      "// 언어 이름(lang)을 받아서 소개 글자를 만들어 주는 함수\n" +
      "function makeDescription(lang) {\n" +
      "  return '함께 배우고 함께 만드는 ' + lang + ' 동아리';\n" +
      "}\n\n" +
      "const title = document.querySelector('#clubTitle');\n" +
      "const desc = document.querySelector('.club-desc');\n\n" +
      "title.textContent = makeTitle('JS');\n" +
      "desc.textContent = makeDesc('JavaScript');",
    dom: '<h1 id="clubTitle"></h1><p class="club-desc"></p>',
    check: function () {
      var norm = function (v) { return String(v || "").replace(/\s+/g, " ").trim().replace(/\.$/, ""); };
      var title = norm(document.getElementById("clubTitle").textContent);
      var desc = norm(document.querySelector(".club-desc").textContent);
      if (title !== "JS Club") return { ok: false, message: "제목이 \"JS Club\"이 아닙니다. 현재: \"" + title + "\"" };
      if (desc !== "함께 배우고 함께 만드는 JavaScript 동아리") return { ok: false, message: "소개 글이 올바르지 않습니다. 현재: \"" + desc + "\"" };
      return { ok: true, message: "정답입니다! 제목과 소개 글이 복구되었습니다.", data: { title: title, desc: desc } };
    }
  },

  /* ===== 미션 3: 활동 정보 복구하기 (인자의 순서) ===== */
  {
    title: "활동 정보 복구하기",
    prompt:
      "[상황] 활동 목록의 글자가 엉망입니다. 활동 한 줄을 추가해 주는 함수 addActivity는 (이름, 요일, 시간) 순서로 재료를 받아요.\n" +
      "[할 일] 활동 3개가 \"알고리즘 스터디 - 화요일 18시\"처럼 올바르게 나오도록 코드를 고치세요.\n" +
      "[알아두면 좋은 말] 함수를 부를 때 넣는 값은 함수가 재료를 받는 순서대로 짝지어져요. 순서가 바뀌면 값이 엉뚱한 자리에 들어갑니다.",
    starterCode:
      "const list = document.querySelector('#activityList');\n\n" +
      "// 활동 한 줄을 목록에 추가하는 함수: (이름, 요일, 시간) 순서로 받습니다.\n" +
      "function addActivity(name, day, time) {\n" +
      "  const li = document.createElement('li');\n" +
      "  li.textContent = name + ' - ' + day + '요일 ' + time + '시';\n" +
      "  list.append(li);\n" +
      "}\n\n" +
      "addActivity('화', '알고리즘 스터디', 18);\n" +
      "addActivity('금', '프로젝트 해커톤', 19);\n" +
      "addActivity('목', 'DOM 세미나', 17);",
    dom: '<ul id="activityList"></ul>',
    check: function () {
      var expected = [["알고리즘 스터디", "화", 18], ["프로젝트 해커톤", "금", 19], ["DOM 세미나", "목", 17]];
      var items = Array.prototype.slice.call(document.querySelectorAll("#activityList li"));
      if (items.length === 0) return { ok: false, message: "목록 안에 <li>가 하나도 없습니다." };
      if (items.length !== expected.length) return { ok: false, message: "<li>가 " + items.length + "개입니다. 활동은 정확히 " + expected.length + "개여야 합니다." };
      var texts = [];
      for (var i = 0; i < expected.length; i++) {
        var text = String(items[i].textContent || "").replace(/\s+/g, " ").trim();
        texts.push(text);
        var e = expected[i];
        if (text.indexOf(e[0]) !== 0 || text.indexOf(e[1] + "요일") === -1 || text.indexOf(e[2] + "시") === -1) {
          return { ok: false, message: (i + 1) + "번째 줄이 올바르지 않습니다. (예: " + e[0] + " - " + e[1] + "요일 " + e[2] + "시) 현재: \"" + text + "\"" };
        }
      }
      return { ok: true, message: "정답입니다! 활동 정보 3개가 목록에 표시되었습니다.", data: { items: texts } };
    }
  },

  /* ===== 미션 4: 부원 명단 복구하기 (함수 호출 괄호 + 매개변수 이름) ===== */
  {
    title: "부원 명단 복구하기",
    prompt:
      "[상황] 부원 명단 표가 제대로 나오지 않습니다. 표 한 줄을 만들어 주는 함수 makeRow에 문제가 있어요.\n" +
      "[할 일] 부원 3명이 이름과 \"N학년\" 두 칸으로 표에 한 줄씩 보이도록 코드를 고치세요.\n" +
      "[알아두면 좋은 말] 함수를 '실행'하려면 이름 뒤에 괄호 ( )를 붙여야 하고, 함수 안에서는 괄호 안에 적은 재료 이름(매개변수)만 쓸 수 있어요.",
    starterCode:
      "const members = [\n" +
      "  { name: '박서연', grade: 3 },\n" +
      "  { name: '김하늘', grade: 2 },\n" +
      "  { name: '최민준', grade: 1 }\n" +
      "];\n" +
      "const body = document.querySelector('#memberBody');\n\n" +
      "// 부원 한 명(member)을 받아서 표 한 줄(<tr>)을 만들어 돌려주는 함수\n" +
      "function makeRow(member) {\n" +
      "  const tr = document.createElement('tr');\n" +
      "  tr.innerHTML = '<td>' + student.name + '</td><td>' + student.grade + '학년</td>';\n" +
      "  return tr;\n" +
      "}\n\n" +
      "// 부원마다 한 줄씩 표에 붙입니다.\n" +
      "for (const member of members) {\n" +
      "  body.append(makeRow);\n" +
      "}",
    dom: '<table><tbody id="memberBody"></tbody></table>',
    check: function () {
      var expected = [["박서연", 3], ["김하늘", 2], ["최민준", 1]];
      var rows = Array.prototype.slice.call(document.querySelectorAll("#memberBody tr"));
      var bodyText = String(document.getElementById("memberBody").textContent || "");
      if (rows.length === 0 && bodyText.indexOf("function") !== -1) return { ok: false, message: "표에 <tr> 대신 함수 코드가 글자로 붙었습니다. 함수가 실행되고 있나요?" };
      if (rows.length === 0) return { ok: false, message: "표가 아직 비어 있습니다." };
      if (rows.length !== expected.length) return { ok: false, message: "표에 " + rows.length + "줄이 있습니다. 부원 " + expected.length + "명이 한 줄씩 있어야 합니다." };
      var out = [];
      for (var i = 0; i < expected.length; i++) {
        var cells = rows[i].querySelectorAll("td");
        if (cells.length < 2) return { ok: false, message: (i + 1) + "번째 줄에는 <td>가 2칸(이름, 학년) 필요합니다." };
        var name = String(cells[0].textContent).trim();
        var grade = String(cells[1].textContent).trim();
        if (name !== expected[i][0]) return { ok: false, message: (i + 1) + "번째 줄은 \"" + expected[i][0] + "\"이어야 합니다. 현재: \"" + name + "\"" };
        if (grade.indexOf(String(expected[i][1])) === -1) return { ok: false, message: (i + 1) + "번째 줄의 둘째 칸에 " + expected[i][1] + "학년이 적혀야 합니다. 현재: \"" + grade + "\"" };
        out.push(name + " · " + grade);
      }
      return { ok: true, message: "정답입니다! 부원 명단이 복구되었습니다.", data: { rows: out } };
    }
  }
];

const DEFAULT_INFO_LABELS = ["동아리 소개 · 미션 2에서 복구", "활동 정보 · 미션 3에서 복구", "부원 명단 · 미션 4에서 복구"];

const state = {
  solved: [false, false, false, false],
  currentMission: 0,
  secondsElapsed: Math.floor((Number(localStorage.getItem("break_elapsed_ms")) || 0) / 1000), // [통합] 앞 방 누적 시간 이어받기
  _unused0: 0, // 경과 시간(초) — 시간 제한 없이 계속 쌓입니다
  timerId: null,
  paused: false,
  running: false
};
const $ = (selector) => document.querySelector(selector);
const computerModal = $("#computerModal");
const hintModal = $("#hintModal");
const bookModal = $("#bookModal");
const editor = $("#codeEditor");
const consoleOutput = $("#consoleOutput");
const timerText = $("#timerText");
const musicModal = $("#musicModal");
const menuDropdown = $("#menuDropdown");

/* ---------- 배경음악 (웹페이지에서는 켜기/끄기·볼륨만 조절) ---------- */
const bgm = new Audio();
bgm.loop = true;
const music = { on: true, failed: false, unlockArmed: false };

function readSetting(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) { return fallback; } // 저장소를 쓸 수 없는 환경이면 기본값
}
function saveSetting(key, value) {
  try { localStorage.setItem(key, String(value)); } catch (error) { /* 무시 */ }
}
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
  const promise = bgm.play();
  if (promise && promise.catch) promise.catch(armMusicUnlock);
}
// 브라우저가 자동재생을 막으면, 화면을 처음 클릭/키 입력할 때 한 번 더 재생을 시도합니다.
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
function initMusic() {
  const saved = Number(readSetting("jsClubBgmVolume", "50"));
  setMusicVolume(saved >= 0 && saved <= 100 ? saved : 50, false);
  music.on = readSetting("jsClubBgmOn", "1") !== "0";
  if (BGM_SRC) bgm.src = BGM_SRC;
  bgm.addEventListener("error", () => { if (BGM_SRC) { music.failed = true; updateMusicUI(); } });
  updateMusicUI();
  tryPlayMusic();
}
function openMusic() {
  updateMusicUI();
  musicModal.hidden = false;
  $("#closeMusic").focus();
}
function closeMusic() { musicModal.hidden = true; }

/* ---------- ⋮ 메뉴 ---------- */
function openMenu() {
  $("#checklistPanel").hidden = true;
  $("#checklistToggle").setAttribute("aria-expanded", "false");
  menuDropdown.hidden = false;
  $("#menuToggle").setAttribute("aria-expanded", "true");
}
function closeMenu() {
  menuDropdown.hidden = true;
  $("#menuToggle").setAttribute("aria-expanded", "false");
}
function toggleMenu() { if (menuDropdown.hidden) openMenu(); else closeMenu(); }
function restartFromMenu() {
  closeMenu();
  if (window.confirm("처음부터 다시 시작할까요?\n진행 상황과 작성한 코드가 모두 초기화됩니다.")) resetGame();
}

function init() {
  updateHintCount();
  renderMissionTabs();
  renderChecklist();
  renderProgress();
  renderPreviewPlaceholders();
  renderMission(0);
  initMusic();
  bindEvents();
  startTimer();
}

function bindEvents() {
  $("#computerHotspot").addEventListener("click", openComputer);
  $("#boardHotspot").addEventListener("click", showBoard);
  $("#bookHotspot").addEventListener("click", openBook);
  $("#closeComputer").addEventListener("click", closeComputer);
  $("#closeHint").addEventListener("click", closeHint);
  $("#hintDone").addEventListener("click", closeHint);
  $("#closeBook").addEventListener("click", closeBook);
  $("#runCode").addEventListener("click", runCurrentCode);
  editor.addEventListener("input", () => updateLineNumbers());
  editor.addEventListener("scroll", () => { $("#lineNumbers").scrollTop = editor.scrollTop; });
  editor.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      editor.setRangeText("  ", editor.selectionStart, editor.selectionEnd, "end");
      updateLineNumbers();
    }
  });
  $("#timerToggle").addEventListener("click", toggleTimer);
  $("#pauseResume").addEventListener("click", toggleTimer);
  $("#checklistToggle").addEventListener("click", toggleChecklist);
  $("#endingClose").addEventListener("click", () => {
    localStorage.setItem("break_elapsed_ms", String(state.secondsElapsed * 1000)); // [통합]
    const r = JSON.parse(localStorage.getItem("break_stage_result") || "{}") || {};
    r.js = { cleared: true };
    localStorage.setItem("break_stage_result", JSON.stringify(r));
    location.href = "../index.html?scene=ending";
  });
  $("#retryButton").addEventListener("click", resetGame);

  // ⋮ 메뉴
  $("#menuToggle").addEventListener("click", toggleMenu);
  $("#menuRestart").addEventListener("click", restartFromMenu);
  $("#menuMain").addEventListener("click", () => { closeMenu(); goToMainScreen(); });
  $("#menuMusic").addEventListener("click", () => { closeMenu(); openMusic(); });
  document.addEventListener("click", (event) => {
    if (!menuDropdown.hidden && !event.target.closest(".menu-wrap")) closeMenu();
  });
  // 배경음악 설정
  $("#closeMusic").addEventListener("click", closeMusic);
  $("#musicSwitch").addEventListener("click", () => setMusicOn(!music.on));
  $("#musicVolume").addEventListener("input", (event) => setMusicVolume(Number(event.target.value), true));

  [computerModal, hintModal, bookModal, musicModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.hidden = true;
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!musicModal.hidden) closeMusic();
      else if (!menuDropdown.hidden) closeMenu();
      else if (!hintModal.hidden) closeHint();
      else if (!bookModal.hidden) closeBook();
      else if (!computerModal.hidden) closeComputer();
    }
  });
}

function openComputer() {
  if (state.paused) return;
  computerModal.hidden = false;
  renderMission(state.currentMission);
  $("#closeComputer").focus();
}
function closeComputer() { computerModal.hidden = true; }

/* 칠판: 미션 순서와 상관없이 섞여 있는 메모 */
function showBoard() {
  localStorage.setItem("break_hint_count", String((Number(localStorage.getItem("break_hint_count")) || 0) + 1)); // [통합] 힌트 누적
  updateHintCount();
  if (state.paused) return;
  $("#hintTitle").textContent = "JS Club 칠판";
  const notes = $("#hintText");
  notes.innerHTML = "";
  BOARD_NOTES.forEach((note) => {
    const box = document.createElement("div");
    box.className = "board-note";
    const title = document.createElement("strong");
    title.textContent = note.title;
    const body = document.createElement("span");
    body.textContent = note.text;
    box.append(title, body);
    notes.append(box);
  });
  hintModal.hidden = false;
  $("#closeHint").focus();
}
function closeHint() { hintModal.hidden = true; }

/* 책장: 여러 책 중 하나를 골라 읽어야 힌트를 찾을 수 있음 */
function openBook() {
  localStorage.setItem("break_hint_count", String((Number(localStorage.getItem("break_hint_count")) || 0) + 1)); // [통합] 힌트 누적
  updateHintCount();
  if (state.paused) return;
  renderBookshelf();
  bookModal.hidden = false;
  $("#closeBook").focus();
}
function closeBook() { bookModal.hidden = true; }
function updateHintCount() { const counter = $("#hintCount"); if (counter) counter.textContent = Number(localStorage.getItem("break_hint_count")) || 0; }
function renderBookshelf() {
  const shelf = $("#bookShelf");
  shelf.innerHTML = "";
  $("#readerTitle").textContent = "";
  $("#readerText").textContent = "책을 클릭해서 읽어보세요.";
  BOOKS.forEach((book, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "book-spine";
    button.style.background = book.color;
    button.style.height = (150 + ((i * 37) % 40)) + "px";
    button.textContent = book.title;
    button.addEventListener("click", () => {
      Array.from(shelf.children).forEach((el) => el.classList.remove("open"));
      button.classList.add("open");
      $("#readerTitle").textContent = "📖 " + book.title;
      $("#readerText").textContent = book.text;
    });
    shelf.append(button);
  });
}

function renderMissionTabs() {
  const tabs = $("#missionTabs");
  tabs.innerHTML = "";
  missionData.forEach((mission, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mission-tab";
    button.textContent = "미션 " + (index + 1);
    button.addEventListener("click", () => {
      missionData[state.currentMission].draftCode = editor.value; // 작성 중인 코드 보관(원본 starterCode는 유지)
      state.currentMission = index;
      renderMission(index);
    });
    tabs.append(button);
  });
}
function renderMission(index) {
  const mission = missionData[index];
  $("#windowTitle").textContent = mission.title;
  $("#questionPrompt").textContent = mission.prompt;
  $("#questionNumber").textContent = (index + 1) + " / " + missionData.length;
  editor.value = mission.draftCode ?? mission.starterCode;
  updateLineNumbers();
  $("#consoleStatus").textContent = "미션 코드를 입력하세요";
  consoleOutput.textContent = "실행 결과와 오류 메시지가 여기에 표시됩니다.";
  consoleOutput.classList.remove("ok");
  Array.from($("#missionTabs").children).forEach((tab, tabIndex) => {
    tab.classList.toggle("active", tabIndex === index);
    tab.classList.toggle("done", state.solved[tabIndex]);
  });
}

function updateLineNumbers(errorLine = 0) {
  const box = $("#lineNumbers");
  const count = editor.value.split("\n").length;
  box.textContent = "";
  for (let n = 1; n <= count; n += 1) {
    const span = document.createElement("span");
    span.textContent = String(n);
    if (n === errorLine) span.className = "err";
    box.append(span);
  }
  box.scrollTop = editor.scrollTop;
}

function renderChecklist() {
  const list = $("#checklistItems");
  list.innerHTML = "";
  missionData.forEach((mission, index) => {
    const item = document.createElement("li");
    item.textContent = "미션 " + (index + 1) + ": " + mission.title;
    item.classList.toggle("done", state.solved[index]);
    list.append(item);
  });
  const doneCount = state.solved.filter(Boolean).length;
  $("#checklistCount").textContent = "(" + doneCount + "/" + missionData.length + ")";
}
function renderProgress() {
  const doneCount = state.solved.filter(Boolean).length;
  const percent = Math.round((doneCount / missionData.length) * 100);
  $("#progressPercent").textContent = percent + "%";
  $("#progressCount").textContent = doneCount + " / " + missionData.length + " 미션 완료";
  $("#progressFill").style.width = percent + "%";
  $(".progress-track").setAttribute("aria-valuenow", String(percent));
}

function renderPreviewPlaceholders() {
  const images = $("#imageGrid");
  const info = $("#infoGrid");
  images.innerHTML = "";
  info.innerHTML = "";
  $("#previewSectionTitle").textContent = "웹페이지 미리보기";
  $("#previewDescription").textContent = "미션을 해결하면 동아리 웹페이지가 복구됩니다.";
  images.style.setProperty("--cols", String(Math.min(PHOTOS.length, 4)));
  for (let index = 0; index < PHOTOS.length; index += 1) {
    const card = document.createElement("div");
    card.className = "broken-card";
    card.dataset.previewIndex = String(index);
    card.innerHTML = '<span><span class="broken-icon">▧</span><br>복구할 사진 영역</span>';
    images.append(card);
  }
  DEFAULT_INFO_LABELS.forEach((label, index) => {
    const slot = document.createElement("div");
    slot.className = "info-slot";
    slot.dataset.infoIndex = String(index);
    slot.textContent = label;
    info.append(slot);
  });
}

function startTimer() {
  stopTimer();
  state.paused = false;
  updateTimerDisplay();
  updateTimerButton();
  state.timerId = window.setInterval(() => {
    if (state.paused) return;
    state.secondsElapsed += 1;
    localStorage.setItem("break_elapsed_ms", String(state.secondsElapsed * 1000)); // [통합]
    updateTimerDisplay();
  }, 1000);
}
function stopTimer() {
  if (state.timerId !== null) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  return hours > 0 ? hours + ":" + mm : mm;
}
function updateTimerDisplay() {
  timerText.textContent = formatTime(state.secondsElapsed);
}
function updateTimerButton() {
  const button = $("#timerToggle");
  button.textContent = state.paused ? "▶ 재개" : "Ⅱ 정지";
  button.setAttribute("aria-label", state.paused ? "타이머 재개" : "타이머 일시정지");
  applyPauseState();
}
// 타이머가 멈춰 있는 동안에는 미션(컴퓨터)·힌트(칠판, 책장)를 이용할 수 없습니다.
function applyPauseState() {
  ["#computerHotspot", "#boardHotspot", "#bookHotspot"].forEach((selector) => { $(selector).disabled = state.paused; });
  $("#pauseNotice").hidden = !state.paused;
  $(".room").classList.toggle("is-paused", state.paused);
  if (state.paused) { closeComputer(); closeHint(); closeBook(); }
}
function toggleTimer() {
  if (state.solved.every(Boolean)) return; // 모든 미션을 끝낸 뒤에는 타이머가 이미 멈춰 있음
  state.paused = !state.paused;
  updateTimerButton();
}
function toggleChecklist() {
  const panel = $("#checklistPanel");
  const willOpen = panel.hidden;
  if (willOpen) closeMenu();
  panel.hidden = !willOpen;
  $("#checklistToggle").setAttribute("aria-expanded", String(willOpen));
}

/* ---------- 코드 실행 & 채점 (sandbox iframe) ---------- */
const SANDBOX_TIMEOUT_MS = 3000;

function buildSandboxDoc(id, mission, code) {
  // </script> 등이 코드에 섞여 있어도 안전하도록 < 문자를 이스케이프
  const safe = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const checkSource = "(" + String(mission.check) + ")(" + JSON.stringify(mission.expected ?? null) + ")";
  return (
    "<!doctype html><html><body>" + mission.dom + "<script>" +
    "(function () {" +
    "var ID = " + safe(id) + ", USER_CODE = " + safe(code) + ", CHECK = " + safe(checkSource) + ";" +
    "var logs = [], err = null;" +
    "function fmt(args) { return Array.prototype.map.call(args, function (x) { if (typeof x === 'string') return x; try { return JSON.stringify(x); } catch (e) { return String(x); } }).join(' '); }" +
    "['log','info','warn','error'].forEach(function (k) { console[k] = function () { logs.push((k === 'log' || k === 'info' ? '' : '[' + k + '] ') + fmt(arguments)); }; });" +
    // 오류 이벤트에서 이름·메시지·줄·칸 번호를 받아 둔다
    "window.addEventListener('error', function (e) { if (err) return; var er = e.error;" +
    "err = { name: (er && er.name) || 'Error', message: (er && er.message) || String(e.message || '').replace(/^Uncaught\\s+(\\w+:\\s*)?/, ''), line: e.lineno || 0, col: e.colno || 0 }; e.preventDefault(); });" +
    // 사용자 코드는 <script>로 실행해야 줄 번호가 코드 기준(1번 줄부터)으로 나온다
    "var s = document.createElement('script'); s.textContent = USER_CODE; document.body.appendChild(s);" +
    "setTimeout(function () {" +
    "var result = { ok: false, logs: logs, error: err, message: '', data: null };" +
    "if (!err) { try { var c = (0, eval)(CHECK); result.ok = !!c.ok; result.message = c.message || ''; result.data = c.data || null; }" +
    "catch (e) { result.message = '채점 중 오류가 발생했습니다: ' + e.message; } }" +
    "parent.postMessage({ id: ID, result: result }, '*');" +
    "}, 60);" +
    "})();" +
    "</script></body></html>"
  );
}

function runInSandbox(mission, code) {
  return new Promise((resolve) => {
    const id = "run-" + Math.random().toString(36).slice(2);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts"); // allow-same-origin 없음 → 부모 페이지에 접근 불가
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;height:600px;border:0;";
    let finished = false;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      resolve(result);
    };
    const onMessage = (event) => {
      if (event.source === iframe.contentWindow && event.data && event.data.id === id) finish(event.data.result);
    };
    const timer = setTimeout(
      () => finish({ ok: false, logs: [], error: { raw: true, message: "Script timed out after " + SANDBOX_TIMEOUT_MS + "ms (possible infinite loop)", line: 0, col: 0 }, message: "", data: null }),
      SANDBOX_TIMEOUT_MS
    );
    window.addEventListener("message", onMessage);
    iframe.srcdoc = buildSandboxDoc(id, mission, code);
    document.body.append(iframe);
  });
}

function formatError(err, code) {
  const out = [err.raw ? err.message : "Uncaught " + err.name + ": " + err.message];
  if (err.line > 0) {
    out.push("    at main.js:" + err.line + ":" + err.col, "");
    const src = code.split("\n");
    for (let n = Math.max(1, err.line - 1); n <= Math.min(src.length, err.line + 1); n += 1) {
      out.push((n === err.line ? "> " : "  ") + String(n).padStart(3) + " | " + src[n - 1]);
    }
  }
  return out;
}

async function runCurrentCode() {
  if (state.running || state.paused) return;
  const index = state.currentMission;
  const mission = missionData[index];
  const runButton = $("#runCode");
  const code = editor.value;
  mission.draftCode = code;
  state.running = true;
  runButton.disabled = true;
  $("#consoleStatus").textContent = "검사 중…";
  consoleOutput.classList.remove("ok");

  const result = await runInSandbox(mission, code);
  state.running = false;
  runButton.disabled = false;

  const passed = result.ok && !result.error;
  if (state.currentMission === index) {
    const lines = [];
    if (result.logs && result.logs.length) lines.push(...result.logs, "");
    if (result.error) lines.push(...formatError(result.error, code));
    else if (passed) lines.push("✅ " + (result.message || "정답입니다."));
    else lines.push("❌ " + (result.message || "아직 통과 조건을 만족하지 않았습니다."));
    consoleOutput.textContent = lines.join("\n");
    consoleOutput.classList.toggle("ok", passed);
    $("#consoleStatus").textContent = result.error ? "1 error" : passed ? "실행 성공" : "확인 필요";
    updateLineNumbers(result.error ? result.error.line : 0);
  }
  if (passed) completeMission(index, result.data);
}

function completeMission(index, data) {
  if (state.solved[index]) return;
  state.solved[index] = true;
  restorePreviewItem(index, data || {});
  renderMissionTabs();
  Array.from($("#missionTabs").children).forEach((tab, i) => tab.classList.toggle("active", i === state.currentMission));
  renderChecklist();
  renderProgress();
  if (state.solved.every(Boolean)) {
    stopTimer();
    computerModal.hidden = true;
    $("#endingTime").textContent = "걸린 시간 " + formatTime(state.secondsElapsed);
    $("#endingModal").hidden = false;
  }
}

function setInfoSlot(index, text) {
  const slot = document.querySelector('[data-info-index="' + index + '"]');
  if (!slot) return;
  slot.classList.add("restored-info");
  slot.textContent = text;
}
function restorePreviewItem(index, data) {
  const clip = (value) => String(value ?? "").slice(0, 120);
  if (index === 0) {
    document.querySelectorAll(".broken-card").forEach((card, i) => {
      const photo = PHOTOS[i % PHOTOS.length];
      card.classList.add("restored", "has-photo", "photo-" + ((i % 4) + 1));
      card.textContent = "";
      const caption = document.createElement("span");
      caption.className = "photo-caption";
      caption.textContent = photo.caption;
      const img = document.createElement("img");
      img.alt = photo.caption;
      img.src = photo.src;
      img.addEventListener("error", () => {
        // 사진 파일을 못 찾으면 아이콘 카드로 대신 표시
        img.remove();
        const icon = document.createElement("span");
        icon.className = "photo-emoji";
        icon.textContent = photo.emoji || "🖼";
        card.prepend(icon);
      });
      card.append(img, caption);
    });
  } else if (index === 1) {
    $("#previewSectionTitle").textContent = clip(data.title);
    $("#previewDescription").textContent = clip(data.desc);
    setInfoSlot(0, clip(data.title) + "\n" + clip(data.desc));
  } else if (index === 2) {
    setInfoSlot(1, "활동 정보\n" + (data.items || []).map(clip).join("\n"));
  } else if (index === 3) {
    setInfoSlot(2, "부원 명단\n" + (data.rows || []).map(clip).join("\n"));
  }
}

function resetGame() {
  $("#endingModal").hidden = true;
  closeMenu();
  state.solved = [false, false, false, false];
  state.currentMission = 0;
  // [통합] 누적 시간은 유지 (앞 방 기록 보존)
  missionData.forEach((mission) => { delete mission.draftCode; });
  renderMissionTabs();
  renderChecklist();
  renderProgress();
  renderPreviewPlaceholders();
  renderMission(0);
  startTimer();
}

window.completeMission = completeMission;
init();
