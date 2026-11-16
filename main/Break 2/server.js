const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'rankings.json');
const plays = new Map();
app.use(express.json({ limit: '10kb' }));

function readRecords() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
function writeRecords(records) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
}
function findPlay(req, res) {
  const play = plays.get(req.params.id);
  if (!play) { res.status(404).json({ error: '플레이 기록을 찾을 수 없습니다.' }); return null; }
  return play;
}

app.post('/api/plays', (req, res) => {
  const nickname = typeof req.body.nickname === 'string' ? req.body.nickname.trim() : '';
  const size = Array.from(nickname).length;
  if (size < 2 || size > 10) return res.status(400).json({ error: '닉네임은 2~10자로 입력해주세요.' });
  const id = crypto.randomUUID();
  plays.set(id, { id, nickname, startedAt: null, hintCount: 0, completed: false });
  res.status(201).json({ playId: id, nickname });
});

app.post('/api/plays/:id/start', (req, res) => {
  const play = findPlay(req, res); if (!play) return;
  if (play.startedAt === null) play.startedAt = Date.now();
  res.json({ started: true });
});

app.post('/api/plays/:id/hints', (req, res) => {
  const play = findPlay(req, res); if (!play) return;
  if (play.startedAt === null || play.completed) return res.status(409).json({ error: '진행 중인 게임이 아닙니다.' });
  play.hintCount += 1;
  res.json({ hintCount: play.hintCount });
});

app.post('/api/plays/:id/complete', (req, res) => {
  const play = findPlay(req, res); if (!play) return;
  if (play.startedAt === null) return res.status(409).json({ error: '게임이 시작되지 않았습니다.' });
  if (!play.completed) {
    const record = { playId: play.id, nickname: play.nickname,
      elapsedSeconds: Math.max(0, Math.floor((Date.now() - play.startedAt) / 1000)),
      hintCount: play.hintCount, completedAt: new Date().toISOString() };
    const records = readRecords();
    records.push(record);
    writeRecords(records);
    play.completed = true;
    play.record = record;
  }
  res.json(play.record);
});

app.get('/api/rankings', (_req, res) => {
  const records = readRecords().sort((a, b) => a.elapsedSeconds - b.elapsedSeconds || a.hintCount - b.hintCount || a.completedAt.localeCompare(b.completedAt));
  res.json(records.slice(0, 100));
});

app.use(express.static(__dirname));
app.listen(PORT, () => console.log(`Break 2 server: http://localhost:${PORT}`));
