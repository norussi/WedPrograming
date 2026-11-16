# Break 2 랭킹 서버

## 실행

Node.js 18 이상이 필요합니다.

```sh
cd "main/Break 2"
npm install
npm start
```

브라우저에서 `http://localhost:3000`을 여세요. `index.html` 파일을 직접 열면 API 요청을 사용할 수 없습니다. 서버를 종료해도 랭킹은 `data/rankings.json`에 남습니다.

## API

- `POST /api/plays` — `{ "nickname": "닉네임" }`으로 플레이 ID 생성
- `POST /api/plays/:id/start` — 서버 시작 시각 기록
- `POST /api/plays/:id/hints` — 힌트 사용 횟수 1 증가
- `POST /api/plays/:id/complete` — 서버 경과 시간과 힌트 수를 저장
- `GET /api/rankings` — 시간순, 힌트 적은 순 랭킹 반환

서버는 닉네임·시작 시각·힌트 수를 기준으로 결과를 저장합니다. 정적 파일과 API가 같은 출처에서 제공되므로 개발 중 별도 CORS 설정은 필요하지 않습니다.
