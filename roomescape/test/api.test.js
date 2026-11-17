'use strict';
const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const dataPath=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'break2-test-')),'state.json');
process.env.BREAK2_DATA_FILE=dataPath;
const {app}=require('../server');
const server=app.listen(0);
after(()=>{server.close();fs.rmSync(path.dirname(dataPath),{recursive:true,force:true});});
async function call(method,route,body,token) {
  const res=await fetch(`http://127.0.0.1:${server.address().port}${route}`,{
    method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
    ...(body!==undefined?{body:JSON.stringify(body)}:{})
  });
  const json=await res.json().catch(()=>({}));
  return {status:res.status,body:json};
}
const STARTER=[
 ['html','pc03',{password:'f12_is_key'}],
 ['html','pc08',{name:'테스트유저',status:'present'}],
 ['html','pc14',{items:Object.fromEntries('html'.split('').map(id=>[id,{type:'checkbox',checked:true}]))}],
 ['html','pc17',{location:'CSS_classroom'}],
 ['css','board',{answer:'ssu2026'}],['css','monitor',{answer:'173'}],
 ['css','locker',{answer:'714'}],['css','desk',{answer:'3591'}],
 ['js','mission1',{srcs:['image1.png','image2.png','image3.png','image4.png']}],
 ['js','mission2',{title:'JS Club',desc:'함께 배우고 함께 만드는 JavaScript 동아리'}],
 ['js','mission3',{items:['알고리즘 스터디 - 화요일 18시','프로젝트 해커톤 - 금요일 19시','DOM 세미나 - 목요일 17시']}],
 ['js','mission4',{rows:['박서연 · 3학년','김하늘 · 2학년','최민준 · 1학년']}],
];
test('health, auth, server-side validation, order, pause, ranking persist',async()=>{
  const created=await call('POST','/api/plays',{nickname:'테스트유저'});
  assert.equal(created.status,201);
  const {playId,token}=created.body;
  const base=`/api/plays/${playId}`;
  assert.equal((await call('GET',base)).status,401);
  assert.equal((await call('GET',base,undefined,'0'.repeat(64))).status,401);
  assert.equal((await call('POST',base+'/complete',{},token)).status,409);
  assert.equal((await call('POST',base+'/missions',{room:'html',mission:'pc03',proof:{password:'f12_is_key'}},token)).status,409);
  assert.equal((await call('POST',base+'/start',{},token)).status,200);
  assert.equal((await call('POST',base+'/missions',{room:'css',mission:'board',proof:{answer:'ssu2026'}},token)).status,409);
  assert.equal((await call('POST',base+'/missions',{room:'html',mission:'pc17',proof:{location:'CSS_classroom'}},token)).status,409);
  assert.equal((await call('POST',base+'/missions',{room:'html',mission:'pc03',proof:{password:'wrong'}},token)).status,422);
  assert.equal((await call('POST',base+'/pause',{},token)).status,200);
  assert.equal((await call('POST',base+'/missions',{room:'html',mission:'pc03',proof:{password:'f12_is_key'}},token)).status,409);
  assert.equal((await call('POST',base+'/resume',{},token)).status,200);
  assert.equal((await call('POST',base+'/hints',{room:'html',mission:'pc03',level:1},token)).body.hintCount,1);
  assert.equal((await call('POST',base+'/hints',{room:'html',mission:'pc03',level:1},token)).body.hintCount,1);
  for(let i=0;i<STARTER.length;i++){
    const [room,mission,proof]=STARTER[i];
    const out=await call('POST',base+'/missions',{room,mission,proof},token);
    assert.equal(out.status,200,`${room}/${mission}: ${JSON.stringify(out.body)}`);
    if(i!==STARTER.length-1) assert.equal(out.body.completed,false);
    else assert.equal(out.body.completed,true);
  }
  const complete=await call('POST',base+'/complete',{},token);
  assert.equal(complete.status,200);
  assert.equal(complete.body.nickname,'테스트유저');
  assert.equal(complete.body.hintCount,1);
  assert.equal((await call('POST',base+'/complete',{},token)).body.playId,playId);
  assert.equal((await call('POST',base+'/hints',{room:'js',mission:'mission4',level:1},token)).status,409);
  const ranking=await call('GET','/api/rankings');
  assert.equal(ranking.status,200);
  assert.equal(ranking.body.length,1);
  const saved=JSON.parse(fs.readFileSync(dataPath,'utf8'));
  assert.equal(saved.rankings.length,1);
  assert.equal(saved.plays[playId].tokenHash.length,64);
  assert.ok(!JSON.stringify(saved).includes(token));
  assert.equal((await call('GET','/api/health')).body.status,'ok');
});
test('input validation and stage-specific rejection',async()=>{
  assert.equal((await call('POST','/api/plays',{nickname:'A'})).status,400);
  assert.equal((await call('POST','/api/plays',{nickname:'<script>'})).status,400);
  const c=(await call('POST','/api/plays',{nickname:'두글자'})).body;
  const base=`/api/plays/${c.playId}`;
  await call('POST',base+'/start',{},c.token);
  assert.equal((await call('POST',base+'/missions',{room:'html',mission:'pc08',proof:{name:'타인',status:'present'}},c.token)).status,422);
  assert.equal((await call('POST',base+'/hints',{room:'js',mission:'mission1',level:1},c.token)).status,409);
});
