# JavaScript 동아리방 방탈출

## 실행 방법
폴더 안의 index.html을 Chrome, Edge, Safari에서 열면 실행됩니다.

폴더 구성: index.html / style.css / app.js / clubroom.png (배경 사진)

## 구성
- 배경 사진은 화면을 꽉 채우도록(cover) 깔리며, 컴퓨터·칠판·책 버튼은 사진 기준 % 좌표라 화면 크기가 바뀌어도 사진 속 위치를 따라갑니다. 위치 조정은 style.css의 `.computer-hotspot`, `.board-hotspot`, `.book-hotspot`.
- 상단 바(HUD)는 화면 맨 위에 붙어 있습니다.
- 칠판: 하나의 칠판에 미션 순서와 상관없이 섞인 메모 6개가 있습니다. (app.js의 `BOARD_NOTES`)
- 책장: 하나의 책장에 힌트 책 4권 + 관련 없는 책 3권이 섞여 있습니다. (app.js의 `BOOKS`)
- 모든 미션은 '함수의 인자 넣기 / return / 이름 / 순서'를 고치는 입문자용 문제입니다.

## 미션 1 사진 바꾸기
app.js 맨 위의 `PHOTOS`에서 사진 파일 경로(src)와 설명(caption)을 바꾸면 됩니다.
예) assets 폴더에 사진을 넣고 `{ src: "./assets/my1.jpg", caption: "MT", emoji: "🏕" }`
사진 개수(1~8개)를 바꾸면 미션 1의 문제·시작 코드·정답 검사도 자동으로 맞춰집니다. 파일을 못 찾으면 emoji 카드가 대신 보입니다.
- 타이머는 시간 제한 없이 경과 시간이 누적되며, 모든 미션을 끝내면 걸린 시간이 표시됩니다.

## 채점 방식
입력한 코드는 메인 페이지에서 eval()하지 않고, sandbox iframe(allow-scripts 전용, 부모와 분리된 origin) 안에서 실행합니다.
각 미션의 `check()`가 코드 실행 결과(DOM)를 검사하므로 forEach / for / for...of / innerHTML 등 여러 풀이를 모두 인정합니다.

## 예시 정답
1. `showPhoto(images[0]);` → `showPhoto(images[0], urls[0]);` (각 줄에 알맞은 주소 인자 추가, 반복문도 가능)
2. `makeTitle`에 `return text;` 추가, `makeDesc` → `makeDescription` (이름 오타 수정)
3. `addActivity('화', '알고리즘 스터디', 18)` → `addActivity('알고리즘 스터디', '화', 18)` (인자 순서 수정)
4. `student` → `member`, `body.append(makeRow)` → `body.append(makeRow(member))`

## 학사 포털(메인 화면) 연동
- 메인 화면은 별도 HTML이라 이 게임에는 타이틀 화면이 없습니다. 페이지를 열면 바로 게임(타이머 포함)이 시작됩니다.
- 상단 바 맨 오른쪽 점 세 개(⋮) 메뉴
  - **다시하기**: 확인 후 진행 상황·코드·타이머를 처음으로 되돌립니다.
  - **메인 화면**: app.js 위쪽의 `goToMainScreen()` 함수를 실행합니다. **함수 안은 비워 두었으니** 메인 화면과 연동하는 코드를 직접 넣으세요. (예: `window.location.href = "../main/index.html";`)
  - **배경음악 설정**: 켜기/끄기 스위치와 볼륨 슬라이더만 있습니다. (설정은 브라우저에 저장됩니다)
- 디자인은 메인 화면(학사 포털)과 같은 톤입니다: 네이비 상단 바(#2c3b4c) · 연한 회색 배경 · 흰 카드 · 틸(#407c7f) 버튼. 색은 style.css 맨 위 `:root` 변수에서 바꿀 수 있고, 상단 바 로고·이름은 index.html의 `.brand`에서 바꿀 수 있습니다.

## 타이머 일시정지
- 상단 바의 '정지'를 누르면 타이머가 멈추고, 그동안 컴퓨터(미션)·칠판·책장(힌트)은 누를 수 없습니다. 화면 가운데 '일시정지 중' 카드의 '재개하기'(또는 상단 바 '재개')를 누르면 다시 할 수 있습니다.
- 정지하는 순간 열려 있던 미션·힌트 창은 닫힙니다.

## 배경음악 넣는 법
- app.js 위쪽의 `BGM_SRC`에 음악 파일 경로를 적으면 됩니다. 예) `const BGM_SRC = "./bgm.mp3";` (파일은 index.html과 같은 폴더에 두기)
- 비워 두면 음악이 재생되지 않고, 설정 팝업에 "아직 지정되지 않았어요" 안내가 보입니다.
- 브라우저 정책상 자동재생이 막히면, 화면을 처음 클릭하거나 키를 누를 때 재생이 시작됩니다.
