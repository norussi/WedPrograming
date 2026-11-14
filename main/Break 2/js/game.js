"use strict";
const $ = (id) => document.getElementById(id);
const scenes = ["home","prologue","guide","demo","ending"];
const lines = [
  ["교수님","실습 기록이 일부 누락되어 임시로 F가 부여된 것 같군요."],
  ["나","교수님, 성적을 복구할 수 있을까요?"],
  ["교수님","다행히 성적 정정 기간이 아직 남아 있습니다."],
  ["교수님","HTML, CSS, JavaScript 세 실습을 모두 통과하면 기록을 재확인해 드리겠습니다."],
  ["교수님","그럼 행운을 빕니다. ^^"]
];
const memory = {session:{}, local:{}};
function read(scope,key){
  try { return window[scope+"Storage"].getItem(key) ?? memory[scope][key] ?? null; }
  catch { return memory[scope][key] ?? null; }
}
function write(scope,key,value){
  memory[scope][key]=value;
  try { window[scope+"Storage"].setItem(key,value); } catch {}
}
function readJSON(scope,key,fallback){
  try {return JSON.parse(read(scope,key)) ?? fallback;} catch {return fallback;}
}
let play = readJSON("session","break.play",null);
let step = Math.min(lines.length-1,Math.max(0,Number(read("session","break.step"))||0));
let activeScene = "home";
let typingTimer = null, typingBubble = null, typingText = "";
function finishTyping(){
  if(!typingTimer)return false;
  clearInterval(typingTimer);
  typingTimer=null;
  typingBubble.textContent=typingText;
  typingBubble=null;
  return true;
}
function show(name){
  if(name!=="prologue")finishTyping();
  activeScene = name;
  write("session","break.scene",name);
  for(const id of scenes) $(id).hidden = id !== name;
  $("identity").textContent = name !== "home" && play ? play.nickname : "웹프로그래밍 특별 실습";
  $("brand-text").textContent = name === "home" ? "웹프로그래밍 실습" : "학사 포털";
  $(name).querySelector("h1").focus({preventScroll:true});
  window.scrollTo(0,0);
}
function savePlay(){write("session","break.play",JSON.stringify(play));}
function begin(nickname){
  // 백엔드 연결 시 POST /plays 응답의 playId를 이곳에서 사용.
  const playId = globalThis.crypto?.randomUUID?.() ?? "demo-"+Date.now()+"-"+Math.random().toString(36).slice(2);
  play = {playId,nickname,startedAt:null,result:null};
  write("session","playId",playId);
  write("local","break.nickname",nickname);
  write("local","break_nickname",nickname); // [통합] 실습실 3곳과 공유하는 닉네임 키
  savePlay();
  step=0;
  renderDialogue();
  show("prologue");
}
function renderDialogue(){
  finishTyping();
  write("session","break.step",String(step));
  const log = $("messages");
  log.replaceChildren();
  for(const [i,[speaker,text]] of lines.slice(0,step+1).entries()){
    const row=document.createElement("div");
    row.className="message"+(speaker==="나"?" me":"");
    const label=document.createElement("small");
    label.textContent=speaker==="나"&&play?play.nickname:speaker;
    const bubble=document.createElement("p");
    bubble.className="bubble";
    if(i<step)bubble.textContent=text;
    else{
      typingBubble=bubble;
      typingText=text;
      let shown=0;
      const letters=Array.from(text);
      typingTimer=setInterval(()=>{
        shown=Math.min(shown+2,letters.length);
        bubble.textContent=letters.slice(0,shown).join("");
        log.scrollTop=log.scrollHeight;
        if(shown===letters.length)finishTyping();
      },25);
    }
    row.append(label,bubble);
    log.append(row);
  }
  log.scrollTop=log.scrollHeight;
  $("prev").disabled=step===0;
  $("next").textContent=step===lines.length-1?"실습 안내 확인 →":"다음 →";
}
function enterPractice(){
  if(!play)return;
  play.startedAt ??= Date.now();
  savePlay();
  // [통합] 새 게임: 공유 기록 초기화 후 HTML 실습실로 이동
  for(const k of ["break_elapsed_ms","break_hint_count","break_stage_result","break_html_progress"]){
    try{localStorage.removeItem(k);}catch{}
  }
  write("local","break_nickname",play.nickname);
  write("session","break.scene","guide");
  location.href="html-room/index.html";
}
function records(){
  const list=readJSON("local","break.demo.rankings",[]);
  return Array.isArray(list)?list:[];
}
function complete({cleared,elapsedSeconds,hintCount,demo=false}={}){
  // 팀 실습실 연결 시 서버가 판정한 완료 결과를 이 함수에 전달.
  if(!play || play.startedAt===null || cleared!==true ||
    !Number.isSafeInteger(elapsedSeconds) || elapsedSeconds<0 ||
    !Number.isSafeInteger(hintCount) || hintCount<0) return false;
  if(!play.result){
    play.result={playId:play.playId,nickname:play.nickname,elapsedSeconds,hintCount,demo};
    savePlay();
  }
  { // [통합] 실제 클리어 기록도 랭킹에 저장
    const list=records();
    if(!list.some(r=>r.playId===play.playId)){
      list.push(play.result);
      write("local","break.demo.rankings",JSON.stringify(list));
    }
  }
  renderEnding();
  return true;
}
function time(seconds){
  return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
}
function renderEnding(){
  const result=play.result;
  $("result-name").textContent=result.nickname+"님의 웹프로그래밍 최종 성적";
  $("result-time").textContent=time(result.elapsedSeconds);
  $("result-hints").textContent=result.hintCount+"회";
  $("result-note").textContent=result.demo?"시연용 예시 기록입니다.":"";
  show("ending");
}
function showRank(){
  // 공용 랭킹 연결 시 records() 대신 서버 GET /rankings 결과를 사용.
  const sorted=records().slice().sort((a,b)=>a.elapsedSeconds-b.elapsedSeconds || a.hintCount-b.hintCount);
  const body=$("rank-body");
  body.replaceChildren();
  let rank=0;
  sorted.forEach((r,i)=>{
    const prev=sorted[i-1];
    if(!prev || prev.elapsedSeconds!==r.elapsedSeconds || prev.hintCount!==r.hintCount) rank=i+1;
    const mine=activeScene==="ending"&&r.playId===play?.playId;
    if(i>=10&&!mine)return;
    const row=document.createElement("tr");
    if(mine)row.className="mine";
    for(const value of [rank,r.nickname+(mine?" (내 기록)":""),time(r.elapsedSeconds),r.hintCount+"회"]){
      const cell=document.createElement("td");cell.textContent=value;row.append(cell);
    }
    body.append(row);
  });
  $("rank-wrap").hidden=!sorted.length;
  $("empty-rank").hidden=!!sorted.length;
  $("rank-dialog").showModal();
}
$("nickname").value=read("local","break.nickname") ?? "";
$("start-form").addEventListener("submit",(e)=>{
  e.preventDefault();
  const input=$("nickname");
  const nickname=input.value.trim();
  const size=Array.from(nickname).length;
  const message=!size?"닉네임을 입력해주세요.":size<2||size>10?"닉네임은 2~10자로 입력해주세요.":"";
  $("nickname-error").textContent=message;
  $("nickname-error").hidden=!message;
  if(message){input.setAttribute("aria-invalid","true");input.focus();return;}
  input.removeAttribute("aria-invalid");
  begin(nickname);
});
$("prev").addEventListener("click",()=>{if(step>0){step--;renderDialogue();}});
$("next").addEventListener("click",()=>{if(finishTyping())return;if(step===lines.length-1)show("guide");else{step++;renderDialogue();}});
$("messages").addEventListener("click",finishTyping);
$("back-chat").addEventListener("click",()=>{step=0;renderDialogue();show("prologue");});
$("enter").addEventListener("click",enterPractice);
$("demo-clear").addEventListener("click",()=>complete({cleared:true,elapsedSeconds:754,hintCount:2,demo:true}));
$("retry").addEventListener("click",()=>{if(play)begin(play.nickname);});
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.open).showModal()));
document.querySelectorAll("[data-rank]").forEach(b=>b.addEventListener("click",showRank));
document.querySelectorAll("[data-home]").forEach(b=>b.addEventListener("click",()=>show("home")));
window.BreakGame=Object.freeze({getPlayId:()=>play?.playId??null,complete});
const restore = new URLSearchParams(location.search).get("scene")==="ending"
  ? "ending" : read("session","break.scene");
if(play?.startedAt!=null && restore==="ending"){
  // [통합] JS 동아리방에서 넘어오면 공유 키의 누적 시간·힌트로 결과 확정
  if(!play.result){
    const ms=Number(read("local","break_elapsed_ms"))||0;
    const hints=Number(read("local","break_hint_count"))||0;
    complete({cleared:true,elapsedSeconds:Math.round(ms/1000),hintCount:Math.round(hints)});
  }else renderEnding();
  history.replaceState(null,"",location.pathname);
}else if(play && ["prologue","guide","demo"].includes(restore)){
  renderDialogue();
  show(restore);
}
