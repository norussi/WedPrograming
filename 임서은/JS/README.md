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
