/* Break 2 shared authenticated API bridge. The browser never writes official rankings. */
(() => {
  'use strict';
  const session = () => {
    let play=null;
    try { play=JSON.parse(sessionStorage.getItem('break.play') || 'null'); } catch {}
    return {id:play?.playId || sessionStorage.getItem('playId'), token:sessionStorage.getItem('break.token')};
  };
  async function request(method,path,body) {
    const {id,token}=session();
    if(!id||!token)throw new Error('게임 인증 정보가 없습니다. 메인 화면에서 게임을 시작하세요.');
    const response=await fetch(`/api/plays/${encodeURIComponent(id)}${path}`, {
      method,headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      ...(body!==undefined ? {body:JSON.stringify(body)} : {}),
    });
    let data={};try{data=await response.json();}catch{}
    if(!response.ok)throw new Error(data.error || '서버 통신 오류');
    return data;
  }
  const ROOM_PATH={html:'/html-room/index.html',css:'/css-room/index.html',js:'/js-room/index.html',ending:'/index.html?scene=ending'};
  async function guard(room) {
    try {
      const status=await request('GET','');
      if(!status.started) {location.replace('/index.html');return null;}
      if(status.stage!==room) {location.replace(ROOM_PATH[status.stage]);return null;}
      localStorage.setItem('break_hint_count',String(status.hintCount));
      document.getElementById('hintTotal')?.replaceChildren(document.createTextNode(String(status.hintCount)));
      return status;
    } catch(e) {
      alert(e.message);
      location.replace('/index.html');
      return null;
    }
  }
  const report = e => alert(e?.message || '서버에 연결하지 못했습니다.');
  window.BreakAPI=Object.freeze({
    request,guard,report,
    mission:(room,mission,proof)=>request('POST','/missions',{room,mission,proof}),
    hint:(room,mission,level=1)=>request('POST','/hints',{room,mission,level}),
    pause:()=>request('POST','/pause'),
    resume:()=>request('POST','/resume'),
  });
})();
