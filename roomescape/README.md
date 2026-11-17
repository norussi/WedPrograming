# Break; F학점 탈출 — Full-stack 개선판

원본 `Break 2.zip`의 메인 화면, HTML/CSS/JavaScript 실습실 12개 미션, 이미지와 힌트를 유지하면서 프론트엔드와 백엔드를 연결한 프로젝트입니다.

## 가장 쉬운 실행 방법

1. **Node.js 18 이상**을 설치합니다: https://nodejs.org/
2. 이 ZIP의 압축을 풀고, **`Break2_Fullstack` 폴더**에서 터미널을 엽니다.
3. 다음을 실행합니다.

   ```sh
   npm install
   npm start
   ```

4. Chrome/Edge에서 **http://localhost:3000** 접속 후 닉네임을 입력합니다.

Windows 사용자는 **`start_windows.bat`를 더블클릭**해도 됩니다(Node.js 설치가 먼저 필요합니다). macOS/Linux 사용자는 `sh start_mac_linux.sh`로 실행할 수 있습니다.

HTML 파일을 직접 더블클릭해서는 정상 동작하지 않습니다. **서버를 실행해야 합니다.** 사용 중단은 터미널에서 `Ctrl+C`입니다.

### 재설치 없이 나중에 실행하기

위 `npm install`은 최초 1회만 하면 됩니다. 다음부터는 같은 폴더에서 `npm start`만 실행합니다. 포트 변경: macOS/Linux `PORT=3100 npm start`, Windows PowerShell `$env:PORT=3100; npm start`.

## 게임 흐름

`메인/교수님 대화 → HTML 실습실(PC03·08·14·17) → CSS 디자인실(칠판·모니터·사물함·책상) → JS 동아리방(사진·글·활동·명단) → 엔딩/랭킹`.

- **HTML:** F12 콘솔, Elements의 `<student>` 속성, input 타입 수정 학습. 원본의 HTML 스크립트 중복 실행 문제를 수정했습니다.
- **CSS:** DOM/CSS 단서 확인 후 정답 제출. 네 문제는 자유로운 순서로 풀 수 있습니다.
- **JavaScript:** 사용자가 수정한 코드는 브라우저의 격리된 iframe에서 실행·검사되고, 검사 결과에 대한 증거를 서버에 전송합니다. 서버에서 사용자 코드를 직접 실행하지 않습니다.
- **일시정지:** 서버가 일시정지 시작/종료 시간을 기록하여 랭킹용 경과 시간에서 제외합니다.
- **힌트:** 서버가 `방 + 미션 + 단계`별로 사용을 기록합니다. 같은 힌트를 반복해서 열어도 추가 집계되지 않습니다.
- **진행 복원:** 서버가 미션별 완료를 보관합니다. 같은 탭에서 새로고침하거나 중간에 나갔다 돌아와도 진행 기록을 복원합니다.

## 달라진 백엔드

| 기능 | 원본 | 개선판 |
| --- | --- | --- |
| 랭킹 등록 | 완료 요청만으로 가능 | 12개 미션의 서버 승인 필수 |
| 정답 판정 | 브라우저 안에서만 | 서버에서 답안/결과를 재검증 |
| 방 순서 | 직접 URL 접속 가능 | 서버 단계 검사로 완료 차단 |
| 인증 | 플레이 ID만 | 32바이트 랜덤 토큰 + SHA-256 해시 저장 |
| 타이머 | 서버가 시작부터 누적 | 일시정지 기간 제외 |
| 진행 저장 | 메모리(Map), 재시작하면 소실 | 원자적 JSON 파일 저장 |
| 힌트 횟수 | API 반복 호출로 증가 | 같은 힌트 중복 방지 |
| 랭킹 | 완료 API로 바로 등록 가능 | 서버가 마지막 미션 검증 후 1회만 등록 |

`data/state.json`은 첫 플레이를 만들면 자동 생성되고, 서버 재시작 후에도 유지됩니다. 닉네임과 점수, 서버 상태만 저장하며 **토큰 원문은 저장하지 않습니다.** 이 파일은 정적 웹 경로(`public/`) 바깥에 있어 HTTP로 노출되지 않습니다.

### API

- `POST /api/plays` `{ "nickname": "테스트유저" }` → 플레이 ID, 비밀 토큰 발급
- `GET /api/plays/:id` → 진행 상태 조회
- `POST /api/plays/:id/start` → 시작
- `POST /api/plays/:id/pause`, `.../resume` → 서버 타이머 제어
- `POST /api/plays/:id/missions` `{room, mission, proof}` → 정답/증거 검증 및 진행 승인
- `POST /api/plays/:id/hints` `{room, mission, level}` → 힌트 사용 기록
- `POST /api/plays/:id/complete` → 12개 미션 승인이 있을 때만 최종 기록 반환
- `GET /api/rankings` → 상위 100개 공개 랭킹
- `GET /api/health` → 서버 상태

플레이 전용 API에는 `Authorization: Bearer <token>` 요청 헤더가 필요합니다. 토큰은 해당 탭의 `sessionStorage`에만 보관합니다.

## 테스트

```sh
npm test
```

백엔드 테스트는 인증 실패, 정답 오류, 순서 우회, 일시정지, 힌트 중복, 서버 승인 후 랭킹 저장 등을 검사합니다. 실제 화면은 Chrome/Edge에서 확인하세요.

## 프로젝트 구조

```text
Break2_Fullstack/
├── server.js               # 인증, 정답 검증, 진행, 타이머, 랭킹
├── package.json
├── start_windows.bat       # Windows 간편 실행
├── start_mac_linux.sh      # macOS/Linux 간편 실행
├── README.md
├── public/                 # 사용자 브라우저에 제공되는 파일
│   ├── index.html          # 시작/대화/엔딩/랭킹
│   ├── js/game.js
│   ├── common/api.js       # 3개 방 공통 인증 API
│   ├── common/hint.js
│   ├── html-room/
│   ├── css-room/
│   ├── js-room/
│   └── assets/
├── test/api.test.js
└── data/state.json         # 실행 후 자동 생성, 배포 파일에는 없음
```

## 보안·운영 시 한계

- **교육용 프로젝트 개선판**입니다. 서버는 답안, 미션 순서, 랭킹 등록을 검증하므로 단순히 `/complete`를 요청해서는 점수를 만들 수 없습니다.
- **브라우저로 전달되는 문제와 클라이언트에서 계산된 JS 미션 결과는 사용자가 개발자 도구로 조작할 수 있습니다.** 서버는 전달된 정답/출력 증거의 값을 다시 확인하지만, 브라우저에서 실제로 문제를 풀었다는 행위를 암호학적으로 증명할 수는 없습니다. 대회용 부정행위 방지까지 필요하다면 서버에서 생성하는 개인별 문제, 서버 단독 비밀 검증, 운영 모니터링이 추가로 필요합니다.
- 데이터 저장은 작은 팀 프로젝트에 적합한 **원자적 JSON 파일** 방식입니다. 다중 서버 또는 대규모 동시 이용 환경에서는 SQLite/PostgreSQL 같은 DB 및 트랜잭션을 도입하세요.
- 사용자 지정 JavaScript는 브라우저의 sandbox iframe에서 실행됩니다. 실서비스에서는 네트워크 제한·CSP·별도 실행 원점 등 추가적인 방어를 고려해야 합니다.
- HTTPS, 운영환경 로그/백업, 개인정보 보관정책, 관리 권한 등은 배포할 때 별도로 설정해야 합니다.

원본의 이미지/디자인 및 학습 미션은 가능한 한 유지했습니다. CSS나 JS 문제의 화면과 코드를 수정하면 서버의 채점 규칙도 함께 업데이트해야 합니다.
