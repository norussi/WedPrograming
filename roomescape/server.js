'use strict';

/**
 * Break 2 full-stack game server.
 * Node.js >= 18, Express. Server owns progression, scoring, timing and rankings.
 * User-authored JavaScript is NEVER executed on the server.
 */
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', false);
const STORE = process.env.BREAK2_DATA_FILE || path.join(__dirname, 'data', 'state.json');
const ROOT = path.join(__dirname, 'public');
const ROOM_ORDER = ['html', 'css', 'js'];
const MISSIONS = Object.freeze({
  html: ['pc03', 'pc08', 'pc14', 'pc17'],
  css: ['board', 'monitor', 'locker', 'desk'],
  js: ['mission1', 'mission2', 'mission3', 'mission4'],
});

function blankDb() { return { schema: 1, plays: {}, rankings: [] }; }
function loadDb() {
  try {
    const obj = JSON.parse(fs.readFileSync(STORE, 'utf8'));
    if (obj.schema !== 1 || !obj.plays || !Array.isArray(obj.rankings)) throw new Error('저장 파일 형식이 올바르지 않습니다.');
    return obj;
  } catch (e) {
    if (e.code === 'ENOENT') return blankDb();
    throw new Error(`게임 데이터 파일을 읽을 수 없습니다 (${STORE}): ${e.message}`);
  }
}
let db = loadDb();
function persist() {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  const tmp = STORE + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, STORE);
}
function sha(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function error(res, code, message) { return res.status(code).json({ error: message }); }
function elapsed(play, now=Date.now()) {
  if (play.startedAt == null) return 0;
  const stop = play.completedAt ?? play.pausedAt ?? now;
  return Math.max(0, Math.floor((stop - play.startedAt - play.pausedDurationMs) / 1000));
}
function hintCount(play) { return Object.keys(play.hints).length; }
function stage(play) {
  if (!MISSIONS.html.every(id => play.solved.html[id])) return 'html';
  if (!MISSIONS.css.every(id => play.solved.css[id])) return 'css';
  if (!MISSIONS.js.every(id => play.solved.js[id])) return 'js';
  return 'ending';
}
function snapshot(play) {
  return {
    playId: play.id, nickname: play.nickname, started: play.startedAt !== null,
    elapsedSeconds: elapsed(play), paused: play.pausedAt !== null,
    hintCount: hintCount(play), solved: play.solved, stage: stage(play),
    evidence: play.evidence, completed: Boolean(play.completedAt), record: play.record || null,
  };
}
function secureEqual(a,b) {
  const x=Buffer.from(a,'hex'), y=Buffer.from(b,'hex');
  return x.length === y.length && crypto.timingSafeEqual(x,y);
}
function auth(req,res,next) {
  const p = db.plays[req.params.id];
  const raw = /^Bearer ([a-f0-9]{64})$/i.exec(req.get('Authorization') || '');
  if (!p || !raw || !secureEqual(p.tokenHash,sha(raw[1]))) return error(res,401,'플레이 인증에 실패했습니다. 메인 화면에서 새 게임을 시작하세요.');
  req.play=p;
  next();
}
function live(p,res) {
  if (p.startedAt === null) { error(res,409,'게임이 시작되지 않았습니다.'); return false; }
  if (p.completedAt !== null) { error(res,409,'이미 완료된 게임입니다.'); return false; }
  if (p.pausedAt !== null) { error(res,409,'일시정지를 해제한 뒤 진행하세요.'); return false; }
  return true;
}
const reqCounter = new Map();
app.use((req,res,next) => {
  res.set('X-Content-Type-Options','nosniff');
  res.set('Referrer-Policy','same-origin');
  res.set('X-Frame-Options','SAMEORIGIN');
  next();
});
app.use('/api', (req,res,next) => {
  const now=Date.now(), key=req.ip;
  let bucket=reqCounter.get(key);
  if (!bucket || bucket.expire<now) bucket={count:0,expire:now+60_000};
  bucket.count++; reqCounter.set(key,bucket);
  if (bucket.count > 300) return error(res,429,'요청이 너무 많습니다. 잠시 후 다시 시도하세요.');
  if (reqCounter.size>2000) for (const [k,v] of reqCounter) if(v.expire<now) reqCounter.delete(k);
  next();
});
app.use(express.json({limit:'16kb',strict:true}));
app.get('/api/health', (_req,res) => res.json({status:'ok',version:2}));

app.post('/api/plays',(req,res)=>{
  const nickname = typeof req.body?.nickname==='string' ? req.body.nickname.trim() : '';
  if ([...nickname].length<2 || [...nickname].length>10 || /[\u0000-\u001f\u007f<>]/.test(nickname)) {
    return error(res,400,'닉네임은 2~10자로 입력하고 특수 제어 문자는 사용할 수 없습니다.');
  }
  const id=crypto.randomUUID(), token=crypto.randomBytes(32).toString('hex');
  const p={id,nickname,tokenHash:sha(token),createdAt:Date.now(),startedAt:null,pausedAt:null,
    pausedDurationMs:0,completedAt:null,hints:{},solved:{html:{},css:{},js:{}},evidence:{html:{},css:{},js:{}},record:null};
  db.plays[id]=p;
  // Remove abandoned games after 30 days, without touching completed rankings.
  const ttl=Date.now()-30*24*3600_000;
  for(const [k,v] of Object.entries(db.plays)) if(v.createdAt<ttl) delete db.plays[k];
  persist();
  res.status(201).json({playId:id,token,nickname});
});
app.get('/api/plays/:id',auth,(req,res)=>res.json(snapshot(req.play)));
app.post('/api/plays/:id/start',auth,(req,res)=>{
  const p=req.play;
  if(p.completedAt!==null) return error(res,409,'이미 완료된 게임입니다.');
  if(p.startedAt===null) {p.startedAt=Date.now();persist();}
  res.json(snapshot(p));
});
app.post('/api/plays/:id/pause',auth,(req,res)=>{
  const p=req.play;
  if(p.startedAt===null || p.completedAt!==null) return error(res,409,'진행 중인 게임이 아닙니다.');
  if (p.pausedAt===null) {p.pausedAt=Date.now();persist();}
  res.json(snapshot(p));
});
app.post('/api/plays/:id/resume',auth,(req,res)=>{
  const p=req.play;
  if(p.startedAt===null || p.completedAt!==null) return error(res,409,'진행 중인 게임이 아닙니다.');
  if(p.pausedAt!==null) {p.pausedDurationMs+=Date.now()-p.pausedAt;p.pausedAt=null;persist();}
  res.json(snapshot(p));
});

function valid(room,mission,proof,p) {
  if(!proof || typeof proof!=='object' || Array.isArray(proof))return false;
  if(room==='html') {
    switch(mission) {
      case 'pc03':return String(proof.password||'').trim().toLowerCase()==='f12_is_key';
      case 'pc08':return proof.name===p.nickname && ['present','출석'].includes(String(proof.status||'').trim().toLowerCase());
      case 'pc14':return ['h','t','m','l'].every(id=>proof.items?.[id]?.type==='checkbox'&&proof.items[id].checked===true);
      case 'pc17':return String(proof.location||'').trim().toLowerCase()==='css_classroom';
    }
  }
  if(room==='css') {
    return String(proof.answer||'').trim().toLowerCase()==={board:'ssu2026',monitor:'173',locker:'714',desk:'3591'}[mission];
  }
  if(room==='js') {
    switch(mission) {
      case 'mission1': return Array.isArray(proof.srcs) && proof.srcs.length===4 && proof.srcs.every((s,i)=>typeof s==='string' && s.replace(/^\.\//,'')===`image${i+1}.png`);
      case 'mission2': return proof.title==='JS Club' && proof.desc==='함께 배우고 함께 만드는 JavaScript 동아리';
      case 'mission3': return Array.isArray(proof.items) && proof.items.length===3 && ['알고리즘 스터디 - 화요일 18시','프로젝트 해커톤 - 금요일 19시','DOM 세미나 - 목요일 17시'].every((v,i)=>proof.items[i]===v);
      case 'mission4':return Array.isArray(proof.rows) && proof.rows.length===3 && ['박서연 · 3학년','김하늘 · 2학년','최민준 · 1학년'].every((v,i)=>proof.rows[i]===v);
    }
  }
  return false;
}
function finish(p) {
  if(p.completedAt!==null) return p.record;
  if(stage(p)!=='ending') return null;
  p.completedAt=Date.now();
  if (p.pausedAt!==null) {p.pausedDurationMs+=Date.now()-p.pausedAt;p.pausedAt=null;}
  p.record={playId:p.id,nickname:p.nickname,elapsedSeconds:elapsed(p),hintCount:hintCount(p),completedAt:new Date(p.completedAt).toISOString()};
  db.rankings.push(p.record);
  db.rankings.sort((a,b)=>a.elapsedSeconds-b.elapsedSeconds||a.hintCount-b.hintCount||a.completedAt.localeCompare(b.completedAt));
  if(db.rankings.length>5000)db.rankings.length=5000;
  return p.record;
}
app.post('/api/plays/:id/missions',auth,(req,res)=>{
  const p=req.play;
  if(!live(p,res))return;
  const {room,mission,proof}=req.body||{};
  if(!Object.hasOwn(MISSIONS,room)||!MISSIONS[room].includes(mission))return error(res,400,'올바르지 않은 미션입니다.');
  if(stage(p)!==room)return error(res,409,'이전 실습실을 먼저 통과해야 합니다.');
  if(mission==='pc17'&&!['pc03','pc08','pc14'].every(id=>p.solved.html[id]))return error(res,409,'PC 03, 08, 14를 먼저 풀어야 합니다.');
  if(p.solved[room][mission])return res.json({accepted:true,alreadySolved:true,...snapshot(p)});
  if(!valid(room,mission,proof,p))return error(res,422,'서버 정답 검증에 실패했습니다. 문제를 다시 확인하세요.');
  p.solved[room][mission]=true;
  p.evidence[room][mission]=proof;
  const record=finish(p);
  persist();
  res.json({accepted:true,alreadySolved:false,...snapshot(p),record});
});
app.post('/api/plays/:id/hints',auth,(req,res)=>{
  const p=req.play;
  if(!live(p,res))return;
  const {room,mission,level}=req.body||{};
  if(stage(p)!==room || !MISSIONS[room]?.includes(mission))return error(res,409,'현재 방의 힌트만 기록할 수 있습니다.');
  const lv=Number(level);
  if(!Number.isInteger(lv)||lv<1||lv>3)return error(res,400,'힌트 단계가 올바르지 않습니다.');
  const key=`${room}:${mission}:${lv}`;
  if(!p.hints[key]) {p.hints[key]=true;persist();}
  res.json({hintCount:hintCount(p)});
});
app.post('/api/plays/:id/complete',auth,(req,res)=>{
  const p=req.play;
  if(p.startedAt===null)return error(res,409,'게임을 시작해야 합니다.');
  if(stage(p)!=='ending')return error(res,409,'모든 12개 미션을 해결해야 완료 기록을 등록할 수 있습니다.');
  if(p.completedAt===null){finish(p);persist();}
  res.json(p.record);
});
app.get('/api/rankings',(_req,res)=>res.json(db.rankings.slice(0,100).map(r=>({
  playId:r.playId,nickname:r.nickname,elapsedSeconds:r.elapsedSeconds,hintCount:r.hintCount,completedAt:r.completedAt
}))));
app.use('/api',(_req,res)=>error(res,404,'API를 찾을 수 없습니다.'));
app.use(express.static(ROOT,{index:'index.html',dotfiles:'deny',maxAge:'1h'}));
app.use((_req,res)=>res.status(404).send('페이지를 찾을 수 없습니다.'));
if(require.main===module){const port=Number(process.env.PORT)||3000;app.listen(port,()=>console.log(`Break 2: http://localhost:${port}`));}
module.exports={app,valid,stage,elapsed};
