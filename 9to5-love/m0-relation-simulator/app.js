const NPCS = [
  { id:'seojin', name:'윤서진', kind:'핵심', job:'서비스 기획', mbti:'ENTJ', enneagram:'3번 성취가', traits:['성취가','직설적'], desire:'프로젝트의 실질적 리더가 되기', wound:'기획안을 빼앗긴 경험', dislike:'무임승차', skills:{work:2,plan:5,talk:2,sense:1}, focus:5, social:1, ranks:['사원','대리'], leader:true, mentor:'완벽주의형', hook:'성과와 공로 사건에서 강하게 반응', boundary:'strict', availability:'single', ideal:{plan:4,work:3}, idealText:'성과를 내고 약속을 지키는 사람' },
  { id:'doyoon', name:'한도윤', kind:'핵심', job:'클라이언트 개발', mbti:'INTP', enneagram:'5번 탐구자', traits:['분석가','완벽주의'], desire:'쓸모 있는 실무자로 인정받기', wound:'회의에서 배제된 경험', dislike:'근거 없는 지시', skills:{work:5,plan:2,talk:1,sense:2}, focus:5, social:1, ranks:['사원','대리'], leader:false, mentor:'코칭형', hook:'업무 위기와 실수 수습에 강함', boundary:'strict', availability:'unknown', ideal:{work:4,sense:3}, idealText:'근거 있게 일하고 선을 넘지 않는 사람' },
  { id:'narae', name:'김나래', kind:'핵심', job:'마케팅·홍보', mbti:'ENFP', enneagram:'7번 낙천가', traits:['관계중심형','호기심'], desire:'없으면 허전한 사람이 되기', wound:'친구가 말을 소문으로 이용한 경험', dislike:'따돌림', skills:{work:1,plan:2,talk:5,sense:2}, focus:3, social:5, ranks:['사원','대리'], leader:false, mentor:'관계형', hook:'소문과 중재 사건에서 특별 선택지', boundary:'open', availability:'single', ideal:{talk:4,sense:3}, idealText:'대화가 통하고 분위기를 읽는 사람' },
  { id:'taesung', name:'박태성', kind:'일반', job:'운영 관리', mbti:'ISTJ', enneagram:'6번 충성가', traits:['안정가','원칙주의'], desire:'사고 없이 팀을 지키기', wound:'부하 실수를 대신 책임진 경험', dislike:'책임 회피', skills:{work:4,plan:1,talk:1,sense:4}, focus:5, social:1, ranks:['대리','과장'], leader:true, mentor:'방임형', hook:'신뢰를 잃으면 회복이 느림', boundary:'strict', availability:'partner', ideal:{work:4,sense:4}, idealText:'책임감 있고 공사를 구분하는 사람' },
  { id:'sua', name:'이수아', kind:'일반', job:'UI·그래픽 디자인', mbti:'ISFP', enneagram:'4번 개인주의자', traits:['인정추구형','섬세함'], desire:'결과물로 인정받기', wound:'투명인간 취급을 받은 경험', dislike:'공개 비판', skills:{work:3,plan:3,talk:1,sense:3}, focus:4, social:2, ranks:['사원','주임'], leader:false, mentor:'다정한 피드백형', hook:'칭찬과 선물에 친밀도가 빠르게 상승', boundary:'private', availability:'single', ideal:{sense:4,plan:3}, idealText:'작은 변화를 알아보고 배려하는 사람' },
  { id:'minjae', name:'최민재', kind:'일반', job:'제휴·영업', mbti:'ESFP', enneagram:'2번 조력가', traits:['영향력형','친화력'], desire:'모두에게 필요한 사람이 되기', wound:'선배에게 성과를 빼앗긴 경험', dislike:'무시당하는 것', skills:{work:1,plan:1,talk:5,sense:3}, focus:2, social:5, ranks:['사원','대리'], leader:false, mentor:'정치형', hook:'도움을 잘 주지만 편을 바꿀 수 있음', boundary:'open', availability:'single', ideal:{talk:4,sense:3}, idealText:'리액션이 좋고 자기 편을 들어 주는 사람' },
  { id:'jihoo', name:'오지후', kind:'일반', job:'인사·조직문화', mbti:'INFJ', enneagram:'1번 개혁가', traits:['정의감','비밀주의'], desire:'회사를 덜 부당한 곳으로 만들기', wound:'부당한 평가를 막지 못한 경험', dislike:'권력 남용', skills:{work:2,plan:2,talk:2,sense:5}, focus:3, social:3, ranks:['사원','대리'], leader:true, mentor:'원칙형', hook:'숨은 불만과 소문을 가장 많이 알게 됨', boundary:'private', availability:'unknown', ideal:{sense:4,talk:3}, idealText:'비밀을 지키고 부당함을 넘기지 않는 사람' }
];

const PRESSURES = ['마감 임박','고객 클레임','팀장 부재','수습 평가 소문','발표 준비'];
const state = { run:null, policy:'observe' };

function seededRandom(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let x = Math.imul(t ^ t >>> 15, 1 | t); x ^= x + Math.imul(x ^ x >>> 7, 61 | x); return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
function pick(rng, items) { return items[Math.floor(rng() * items.length)]; }
function shuffle(rng, items) { return [...items].sort(() => rng() - .5); }
function pairKey(a,b) { return [a,b].sort().join('|'); }
function other(run, id) { return run.npcs.filter(n => n.id !== id); }
function edge(run,a,b) { return run.relations[pairKey(a.id || a,b.id || b)]; }
function weightedTarget(run, actor) {
  const candidates = other(run, actor.id);
  const weights = candidates.map(n => { const e = edge(run,actor,n); const momentum = Math.abs(e.affection)+Math.abs(e.tension)+Math.abs(e.competition)+Math.abs(e.trust); return 1 + momentum/40; });
  const total = weights.reduce((a,b)=>a+b,0);
  let roll = run.rng()*total;
  for (let i=0;i<candidates.length;i++){ roll -= weights[i]; if (roll<=0) return candidates[i]; }
  return candidates[candidates.length-1];
}
function clamp(v,min,max) { return Math.max(min,Math.min(max,v)); }
function randomAvailability(rng) { const roll=rng(); return roll<.55?'single':roll<.78?'unknown':'partner'; }
const AFFINITY_HOOKS = [
  {id:'seatmate',label:'옆자리',desc:'사소한 회사 생활 접점이 자주 생겨 친밀도가 빨리 오른다.'},
  {id:'cohort',label:'입사동기',desc:'같이 적응하는 처지라 초반 개인 이벤트에서 더 쉽게 가까워진다.'},
  {id:'ideal_vibe',label:'취향 저격',desc:'플레이어의 말투와 행동이 이상형에 가까우면 사적인 호감이 더 붙는다.'}
];
function assignAffinityHooks(rng,npcs) {
  const used=new Set();
  const take=(candidates)=>{ const pool=shuffle(rng,candidates.filter(n=>!used.has(n.id))); const npc=pool[0]||shuffle(rng,npcs.filter(n=>!used.has(n.id)))[0]; if(npc) used.add(npc.id); return npc; };
  const seatmate=take(npcs.filter(n=>!n.rank.includes('팀장')));
  const cohort=take(npcs.filter(n=>n.rank==='사원'));
  const ideal=take(npcs);
  [[seatmate,AFFINITY_HOOKS[0]],[cohort,AFFINITY_HOOKS[1]],[ideal,AFFINITY_HOOKS[2]]].forEach(([npc,hook])=>{ if(npc) npc.affinityHook=hook; });
}
function affinityText(npc) { return npc.affinityHook?`${npc.affinityHook.label}`:'-'; }
function affinityBonus(run,npc,context) {
  if(!npc?.affinityHook) return 0;
  if(npc.affinityHook.id==='seatmate') return ['office','talk','lunch','gift','personal','rest'].includes(context)?2:0;
  if(npc.affinityHook.id==='cohort') return run.day<=10||['personal','rest','talk','lunch'].includes(context)?2:0;
  if(npc.affinityHook.id==='ideal_vibe') return ['personal','rest','talk','lunch','gift','romance'].includes(context)?(personalFit(run,npc).score>=0?3:1):0;
  return 0;
}
function addPlayerCloseness(run,npc,amount,context,dayLog,source) {
  if(!npc) return 0;
  const bonus=affinityBonus(run,npc,context);
  npc.playerCloseness+=amount+bonus;
  if(bonus&&dayLog) dayLog.push({type:'player',text:`<strong>호감 보너스 · ${npc.name}</strong><br>${npc.affinityHook.label} 효과로 ${source||'이번 접점'}이 더 좋은 기억으로 남았다. <span class="muted">(추가 친밀도 +${bonus})</span>`});
  return amount+bonus;
}

function createRun(seed) {
  const rng = seededRandom(seed);
  const npcs = NPCS.map(n => ({...n, availability:randomAvailability(rng), affinityHook:null, rank:'사원', stress:Math.floor(rng()*15), playerTrust:0, playerCloseness:0 }));
  const leader = pick(rng, npcs.filter(n => n.leader));
  leader.rank = '팀장';
  const mentor = pick(rng, npcs.filter(n => n.id !== leader.id && (n.ranks.includes('대리') || n.ranks.includes('주임'))));
  mentor.rank = `${mentor.ranks[mentor.ranks.length-1]} · 사수`;
  const remaining = shuffle(rng, npcs.filter(n => n.id !== leader.id && n.id !== mentor.id));
  remaining.slice(0,2).forEach(n => n.rank = n.ranks.includes('대리') && rng()>.45 ? '대리' : '주임');
  remaining.slice(2).forEach(n => n.rank = '사원');
  assignAffinityHooks(rng,npcs);
  const knowledge=Object.fromEntries(npcs.map(n=>[n.id,{evidence:0,notes:[]}]));
  const run = { seed, rng, npcs, leaderId:leader.id, mentorId:mentor.id, relations:{}, day:0, logs:[], firstConnection:null, secrets:[], eventCount:0, eventHistory:{}, player:{skills:{work:3,plan:2,talk:2,sense:2},stress:0,reputation:0,insight:0,impacts:[],outcomes:{success:0,partial:0,failure:0},knowledge,disposition:'적응 중'}, flags:{milestoneSuccess:0,requiredFailure:0,finalReviewSuccess:false,mentorPersonal:0,mentorWorkSuccess:0,leaderPersonal:0,romanceMoments:{},readRoomInsights:0,officeBuddyId:null}, pendingEvent:null, lastChoiceDay:-3, autoMode:false };
  for (let i=0;i<npcs.length;i++) for (let j=i+1;j<npcs.length;j++) run.relations[pairKey(npcs[i].id,npcs[j].id)] = {a:npcs[i].id,b:npcs[j].id,trust:Math.floor(rng()*18)-6,affection:Math.floor(rng()*18)-6,tension:Math.floor(rng()*18),competition:Math.floor(rng()*16),history:[]};
  assignInitialRelations(run);
  run.initialRelations=JSON.parse(JSON.stringify(run.relations));
  return run;
}

function randomPair(run, excluded=[]) { const pairs = []; for(let i=0;i<run.npcs.length;i++) for(let j=i+1;j<run.npcs.length;j++){ const k=pairKey(run.npcs[i].id,run.npcs[j].id); if(!excluded.includes(k)) pairs.push([run.npcs[i],run.npcs[j]]); } return pick(run.rng,pairs); }
function change(edge, values, reason) { Object.entries(values).forEach(([k,v]) => edge[k] = clamp(edge[k]+v, k==='tension'||k==='competition'?0:-100, k==='tension'||k==='competition'?100:100)); edge.history.push(reason); }
function gainKnowledge(run, npc, note, amount=1) { if(!npc) return; const record=run.player.knowledge[npc.id]; if(record.notes.includes(note)) return; record.evidence+=amount; record.notes.push(note); run.player.insight+=amount; }
function maybeGainEventKnowledge(run,event,actors,outcome,choice,dayLog) {
  if(!actors.length) return;
  if(choice?.id==='observe_event'||choice?.id==='read_room') return;
  const chance=event.required?.18:event.companyRandom?.12:['personal','rest'].includes(event.kind)?.25:.10;
  const target=actors[0];
  if(outcome.label==='성공'&&run.rng()<chance) {
    gainKnowledge(run,target,`${event.title}에서 눈에 띈 반응을 기억함`);
    dayLog.push({type:'player',text:`<strong>작은 단서 · ${target.name}</strong><br>사건을 겪으며 ${target.name}의 반응 하나를 기억했다. <span class="muted">(정보 +1)</span>`});
  }
}
function maybeMarkRomanceMoment(run,event,actors,outcome,dayLog) {
  if(outcome.label!=='성공') return;
  const privateEvents=['company_dinner','workshop','heartbreak'];
  const isPrivateContext=privateEvents.includes(event.id)||event.kind==='rest';
  if(!isPrivateContext) return;
  actors.filter(n=>n.boundary==='strict').forEach(n=>{
    run.flags.romanceMoments[n.id]=event.title;
    dayLog.push({type:'player',text:`<strong>경계가 풀린 순간 · ${n.name}</strong><br>${event.title}에서 ${n.name}이(가) 평소보다 사적인 모습을 조금 보였다.`});
  });
}
function revealPrivateClue(run,npc,dayLog,source) {
  if(!npc||run.rng()>.22) return;
  const text=npc.availability==='partner'?`${npc.name}에게 이미 만나는 사람이 있다는 단서를 얻었다.`:npc.availability==='unknown'?`${npc.name}의 연애 상태는 아직 애매하지만, 사적인 이야기를 잘 숨기는 편임을 알았다.`:`${npc.name}의 이상형은 ${npc.idealText}에 가깝다는 단서를 얻었다.`;
  gainKnowledge(run,npc,`${source}: ${text}`,2);
  dayLog.push({type:'player',text:`<strong>개인 단서 · ${npc.name}</strong><br>${text} <span class="muted">(정보 +2)</span>`});
}
function personalFit(run,npc) { if(!npc) return {score:0,met:[],missing:[]}; const met=[],missing=[]; Object.entries(npc.ideal||{}).forEach(([key,need])=>{ if(run.player.skills[key]>=need) met.push(`${skillName(key)} ${need}+`); else missing.push(`${skillName(key)} ${need}+`); }); const score=met.length*6-missing.length*5+(run.player.skills.sense>=3?3:-4); return {score,met,missing}; }
function romanceReadiness(run,npc) {
  if(!npc) return {ok:false,score:0,reason:'대상이 없다'};
  const fit=personalFit(run,npc); const boundaryPenalty={open:0,private:12,strict:24}[npc.boundary]||0; const availabilityPenalty={single:0,unknown:14,partner:100}[npc.availability]||0;
  const score=npc.playerCloseness+npc.playerTrust+fit.score-boundaryPenalty-availabilityPenalty;
  const needsTrust=npc.boundary==='strict'?20:npc.boundary==='private'?14:10; const needsSense=npc.boundary==='open'?2:npc.boundary==='private'?3:4;
  let reason=`친밀 ${npc.playerCloseness} · 신뢰 ${npc.playerTrust} · 이상형 ${fit.met.length?fit.met.join(', '):'미충족'}`;
  if(npc.boundary==='strict') reason+=run.flags.romanceMoments[npc.id]?` · ${run.flags.romanceMoments[npc.id]}에서 사적인 틈을 봄`:' · 공사구분 확실, 사적인 계기 없음';
  if(npc.boundary==='private') reason+=' · 사적인 티를 잘 안 냄';
  if(npc.availability==='partner') reason+=' · 이미 만나는 사람이 있음';
  if(npc.availability==='unknown') reason+=' · 연애 상태를 아직 모름';
  if(fit.missing.length) reason+=` · 부족: ${fit.missing.join(', ')}`;
  const hasRequiredMoment=npc.boundary!=='strict'||!!run.flags.romanceMoments[npc.id];
  return {ok:hasRequiredMoment&&score>=42&&npc.playerTrust>=needsTrust&&npc.playerCloseness>=22&&run.player.skills.sense>=needsSense,score,reason,fit};
}
function assignInitialRelations(run) {
  const used=[];
  for(let i=0;i<2;i++){ const [a,b]=randomPair(run,used); const e=edge(run,a,b); change(e,{trust:14,affection:22,tension:-4},'시작: 기존 친분'); used.push(pairKey(a.id,b.id)); }
  for(let i=0;i<2;i++){ const [a,b]=randomPair(run,used); const e=edge(run,a,b); change(e,{tension:25,competition:26,trust:-10},'시작: 경쟁 관계'); used.push(pairKey(a.id,b.id)); }
  const [a,b]=randomPair(run,used); const e=edge(run,a,b); change(e,{trust:13,affection:12},'시작: 과거 도움을 받은 기억'); used.push(pairKey(a.id,b.id));
  if(run.rng()<.38) { const [rivalA,rivalB]=randomPair(run,used); const severe=edge(run,rivalA,rivalB); change(severe,{tension:28,competition:22,trust:-10},'시작: 해결되지 않은 정면 충돌'); used.push(pairKey(rivalA,rivalB)); }
  const [s1,s2]=randomPair(run,used); run.secrets.push(`${s1.name}은(는) ${s2.name}의 과거 실수에 관한 이야기를 알고 있다.`);
}

function chooseAction(run, actor, mood) {
  const roll = run.rng();
  if (mood.id==='faction' && roll < .16) return pick(run.rng,['소문 전달','공을 주장하기','도움 요청']);
  if (mood.id==='cold' && actor.social >= 3 && roll < .18) return '도움 요청';
  if (actor.stress > 58 && roll < .25) return '건강 챙기기';
  if (actor.focus >= 4 && roll < .34) return pick(run.rng,['업무 집중','주간 보고 준비','자료 정리']);
  if (actor.social >= 4 && roll < .68) return pick(run.rng,['스몰토크','점심 함께 먹기','티타임','관심사 공유','선물 주기','소문 전달']);
  if (actor.traits.includes('성취가') && roll < .77) return '공을 주장하기';
  if (actor.traits.includes('관계중심형') && roll < .82) return '업무 지원';
  return pick(run.rng,['업무 집중','도움 요청','업무 지원','스몰토크','비품 챙기기']);
}

function applyAction(run, actor, action, pressure, dayLog, mood) {
  const target = weightedTarget(run,actor); const e = edge(run,actor,target);
  const add = (values,text) => { change(e,values,`D${run.day}: ${text}`); applyInteractionClimate(run,e,action,mood,dayLog); dayLog.push({type:'normal', text}); };
  if(['업무 집중','주간 보고 준비','자료 정리'].includes(action)){ actor.stress=clamp(actor.stress+(action==='업무 집중'?7:4),0,100); dayLog.push({type:'normal', text:`${actor.name}은(는) ${action}에 몰입했다. <span class="muted">(${pressure}, 스트레스 +${action==='업무 집중'?7:4})</span>`}); return; }
  if(action==='건강 챙기기'){ actor.stress=clamp(actor.stress-10,0,100); add({affection:2},`${actor.name}은(는) 컨디션이 좋지 않아 ${target.name}의 배려를 받았다. <span class="muted">(스트레스 -10, 친밀도 +2)</span>`); return; }
  if(action==='도움 요청'){ actor.stress=clamp(actor.stress-5,0,100); add({trust:3,affection:2},`${actor.name}이(가) ${target.name}에게 업무 도움을 요청했고, ${target.name}이(가) 받아들였다. <span class="muted">(신뢰 +3, 친밀도 +2)</span>`); return; }
  if(action==='업무 지원'){ actor.stress=clamp(actor.stress+3,0,100); add({trust:4,affection:2},`${actor.name}이(가) ${target.name}의 막힌 업무를 지원했다. <span class="muted">(신뢰 +4, 친밀도 +2)</span>`); return; }
  if(['스몰토크','점심 함께 먹기','티타임','관심사 공유'].includes(action)){ const amount=action==='점심 함께 먹기'?4:action==='티타임'?3:2; add({affection:amount,tension:-1},`${actor.name}과(와) ${target.name}이(가) ${action==='관심사 공유'?'이번 주 관심사를 나누며':action==='티타임'?'티타임을 가지며':action==='점심 함께 먹기'?'점심을 함께 먹으며':'잠깐'} 이야기를 나눴다. <span class="muted">(친밀도 +${amount})</span>`); return; }
  if(action==='선물 주기'||action==='비품 챙기기'){ add({affection:action==='선물 주기'?3:1,tension:-1},`${actor.name}이(가) ${target.name}에게 ${action==='선물 주기'?'작은 선물':'필요한 비품'}을 챙겨 주었다. <span class="muted">(친밀도 상승)</span>`); return; }
  if(action==='소문 전달'){ add({tension:5,affection:2},`${actor.name}이(가) ${target.name}에게 조심스러운 회사 소문을 전했다. <span class="muted">(긴장 +5)</span>`); return; }
  if(action==='공을 주장하기'){ add({competition:7,tension:6,trust:-3},`${actor.name}이(가) ${target.name} 앞에서 자신의 성과를 강하게 주장했다. <span class="muted">(경쟁·긴장 상승)</span>`); }
}

function addEvent(results, run, event) { if(!run.eventHistory[event.id]) results.push(event); }
function seniorOrLeader(run) { const leader=run.npcs.find(n=>n.id===run.leaderId); if(run.rng()<.5) return leader; return pick(run.rng, run.npcs.filter(n=>n.id!==run.leaderId)); }
function eligibleEvents(run, pressure) {
  const results=[]; const mentor=run.npcs.find(n=>n.id===run.mentorId); const leader=run.npcs.find(n=>n.id===run.leaderId); const anyone=()=>pick(run.rng,run.npcs);
  const hot=[...Object.values(run.relations)].sort((a,b)=>(b.tension+b.competition)-(a.tension+a.competition))[0];
  if(run.day===1) addEvent(results,run,{id:'kickoff',title:'온보딩 안내',actors:[leader,anyone()],text:`${leader.name} 팀장이 신입에게 팀의 방식과 기본 역할을 알려 준다.`,kind:'meeting'});
  if(run.day<=5) {
    addEvent(results,run,{id:'welcome_coffee',title:'먼저 다가온 커피 타임',actors:[pick(run.rng,run.npcs.filter(n=>n.social>=3)),anyone()],text:'활발한 동료가 신입에게 커피를 권하며 가벼운 대화를 시작한다.',kind:'personal'});
    addEvent(results,run,{id:'welcome_dinner',title:'첫 주 저녁 식사',actors:shuffle(run.rng,run.npcs).slice(0,3),text:'퇴근 후 가벼운 저녁 식사 자리에 초대받는다.',kind:'rest'});
    addEvent(results,run,{id:'mentor_feedback',title:'사수의 첫 피드백',actors:[mentor],text:`${mentor.name} 사수가 간단한 적응 과제를 보고 조언한다.`,kind:'mentor'});
  }
  if(run.day>=5&&run.day<=6) addEvent(results,run,{id:'team_meeting_1',title:'첫 정기 회의',actors:[leader,mentor],text:'신입도 참여하는 첫 정기 회의다. 말할 타이밍과 회의의 암묵적 규칙을 익혀야 한다.',kind:'meeting',required:true,deadline:6});
  if(run.day>=6&&run.day<=8) addEvent(results,run,{id:'first_task',title:'첫 번째 업무',actors:[mentor,leader],text:'처음으로 혼자 책임져야 하는 작은 업무가 주어진다.',kind:'meeting',required:true,deadline:8});
  if(run.day>=9&&run.day<=10) addEvent(results,run,{id:'company_dinner',title:'첫 회식',actors:shuffle(run.rng,run.npcs).slice(0,3),text:'퇴근 후 회식 자리에서 업무 중에는 보이지 않던 관계와 서열이 드러난다.',kind:'personal',required:true,deadline:10});
  if(run.day>=11&&run.day<=13) addEvent(results,run,{id:'mid_review',title:'중간 수습 평가',actors:[leader,mentor],text:'팀장과 사수가 첫 적응 기간의 업무 태도와 결과를 확인한다.',kind:'leader',required:true,deadline:13});
  if(run.day>=14&&run.day<=15) addEvent(results,run,{id:'team_meeting_2',title:'중간 공유 회의',actors:[seniorOrLeader(run),anyone()],text:'각자 맡은 일을 공유하는 회의에서 플레이어의 이해도와 태도가 드러난다.',kind:'meeting',required:true,deadline:15});
  if(run.day>=16&&run.day<=18) addEvent(results,run,{id:'big_task',title:'중요 업무 배정',actors:[seniorOrLeader(run),anyone()],text:'팀의 성과가 걸린 업무에 참여할 기회가 생겼다.',kind:'meeting',required:true,deadline:18});
  if(run.day>=20&&run.day<=21) addEvent(results,run,{id:'workshop',title:'팀 워크숍',actors:shuffle(run.rng,run.npcs).slice(0,4),text:'팀 워크숍에서 협업 방식과 서로의 속마음이 조금씩 드러난다.',kind:'meeting',required:true,deadline:21});
  if(run.day>=27&&run.day<=29) addEvent(results,run,{id:'final_review',title:'30일 최종 평가',actors:[leader,mentor],text:'30일 동안의 업무 성과와 팀 적응도를 바탕으로 결론을 낸다.',kind:'leader',required:true,deadline:29});
  if(run.day>=7&&run.day<=10&&run.rng()<.12) addEvent(results,run,{id:'weekly_report',title:'주간보고 정리',actors:[mentor,anyone()],text:'첫 주 업무를 정리해 공유해야 한다. 내용보다 빠진 맥락을 챙기는지가 중요하다.',kind:'meeting',companyRandom:true});
  if(run.day>=9&&run.day<=16&&run.rng()<.10) addEvent(results,run,{id:'minutes_gap',title:'회의록 누락',actors:[seniorOrLeader(run),anyone()],text:'지난 회의의 중요한 결정사항이 문서에서 빠졌다. 누가 기억하고 어떻게 복구하느냐가 문제가 된다.',kind:'support',companyRandom:true});
  if(run.day>=10&&run.day<=18&&run.rng()<.10) addEvent(results,run,{id:'client_feedback',title:'고객 피드백 도착',actors:[pick(run.rng,run.npcs.filter(n=>n.skills.talk>=3||n.skills.sense>=3)),anyone()],text:'외부에서 애매한 피드백이 들어왔다. 그대로 믿을지, 의도를 해석할지 판단해야 한다.',kind:'meeting',companyRandom:true});
  if(run.day>=12&&run.day<=21&&run.rng()<.09) addEvent(results,run,{id:'data_cleanup',title:'자료 정리 요청',actors:[pick(run.rng,run.npcs.filter(n=>n.skills.work>=3||n.skills.plan>=3)),anyone()],text:'흩어진 자료를 정리해 다음 업무자가 볼 수 있게 만들어야 한다.',kind:'support',companyRandom:true});
  if(run.day>=14&&run.day<=23&&run.rng()<.09) addEvent(results,run,{id:'sudden_presentation',title:'갑작스런 짧은 발표',actors:[seniorOrLeader(run),anyone()],text:'회의 중 갑자기 진행 상황을 설명해 달라는 요청이 들어왔다.',kind:'meeting',companyRandom:true});
  if(run.day>=18&&run.day<=25&&run.rng()<.10) addEvent(results,run,{id:'manager_checkin',title:'팀장 체크인',actors:[leader,mentor],text:`${leader.name} 팀장이 중간 결과뿐 아니라 협업 태도까지 짧게 확인한다.`,kind:'leader',companyRandom:true});
  if(run.day>=19&&run.day<=26&&run.rng()<.09) addEvent(results,run,{id:'handoff_miss',title:'인수인계 실수',actors:[mentor,anyone()],text:'업무 인수인계 과정에서 빠진 내용이 뒤늦게 발견됐다. 탓을 할지, 수습을 할지 갈림길이다.',kind:'support',companyRandom:true});
  if(run.day>=22&&run.day<=26&&run.rng()<.12) addEvent(results,run,{id:'project_gap',title:'큰 업무 빵꾸',actors:[seniorOrLeader(run),anyone()],text:'핵심 업무에서 예상치 못한 공백이 생겨, 누군가가 수습해야 한다.',kind:'support',companyRandom:true});
  if(run.day>=6&&run.day<=20) addEvent(results,run,{id:'tea_time',title:'오후 티타임',actors:[anyone(),anyone()],text:'잠깐의 티타임에 평소와 다른 조합의 사람들이 모였다.',kind:'personal'});
  const tired=run.npcs.slice().sort((a,b)=>b.stress-a.stress)[0]; if(run.day>=8&&run.day<=22&&tired.stress>=32) addEvent(results,run,{id:'health',title:'컨디션 이상',actors:[tired,anyone()],text:`${tired.name}의 안색이 좋지 않다. 주변 사람들이 업무를 나눠 맡을지 고민한다.`,kind:'personal'});
  if(run.day>=9&&run.day<=23) addEvent(results,run,{id:'interest',title:'이번 주의 관심사',actors:[anyone(),anyone()],text:'누군가의 취미와 관심사가 뜻밖의 공통점을 만든다.',kind:'personal'});
  const lovelorn=run.npcs.filter(n=>n.availability==='single'||n.availability==='unknown').sort((a,b)=>(b.playerCloseness+b.stress)-(a.playerCloseness+a.stress))[0];
  if(run.day>=13&&run.day<=18&&lovelorn&&run.rng()<.10) addEvent(results,run,{id:'heartbreak',title:'실연의 여파',actors:[lovelorn,anyone()],text:`${lovelorn.name}이(가) 사적인 관계 문제로 흔들리고 있다. 말을 걸 타이밍과 방식이 중요해 보인다.`,kind:'personal'});
  if(run.day%7===0) addEvent(results,run,{id:`rest_${run.day}`,title:'퇴근 후의 휴식',actors:run.npcs.slice().sort((a,b)=>(b.playerCloseness+b.playerTrust)-(a.playerCloseness+a.playerTrust)).slice(0,2),text:'주말 전 저녁, 누구와 어떻게 쉬느냐가 관계에 작은 흔적을 남긴다.',kind:'rest'});
  if(run.day>=17&&pressure==='팀장 부재'&&run.rng()<.14) addEvent(results,run,{id:'leader_absent',title:'팀장 부재의 빈자리',actors:[leader,anyone()],text:`${leader.name} 팀장이 자리를 비운 사이, 누가 결정을 내릴지를 두고 신경전이 생긴다.`,kind:'conflict',companyRandom:true});
  if(run.day>=15&&hot && hot.tension>=38 && hot.competition>=28&&run.rng()<.04) addEvent(results,run,{id:'credit_conflict',title:'공동 야근의 공',actors:[run.npcs.find(n=>n.id===hot.a),run.npcs.find(n=>n.id===hot.b)],edge:hot,text:'공동 업무의 공로를 두고 갈등이 수면 위로 올라온다.',kind:'conflict',companyRandom:true});
  return results;
}

function resolveEvent(run, event, dayLog, choice=null) {
  const first=run.npcs.find(n=>n.id===run.firstConnection); const actors=event.actors.filter((v,i,a)=>v&&a.findIndex(n=>n.id===v.id)===i); const pair=actors.length>1?edge(run,actors[0],actors[1]):null;
  run.eventHistory[event.id]=run.day; dayLog.push({type:'event', label:eventLabel(event), text:`<strong>${event.title}</strong><br>${event.text}`});
  if(choice) applyEventChoice(run,event,actors,choice,dayLog);
  const outcome=resolveEventCheck(run,event,actors,choice?.bonus||0); dayLog.push({type:'player',text:`<strong>플레이어 판정 · ${outcome.label}</strong><br>${outcome.detail}`});
  maybeGainEventKnowledge(run,event,actors,outcome,choice,dayLog);
  maybeMarkRomanceMoment(run,event,actors,outcome,dayLog);
  applyEventClimate(run,event,actors,outcome,dayLog,choice);
  applyNpcEventResponses(run,event,actors,outcome,dayLog);
  if(event.required&&outcome.label==='성공') run.flags.milestoneSuccess++;
  if(event.required&&outcome.label==='실패') run.flags.requiredFailure++;
  if(event.id==='final_review'&&outcome.label==='성공') run.flags.finalReviewSuccess=true;
  if(event.kind==='mentor'&&outcome.label==='성공') run.flags.mentorWorkSuccess++;
  if(['personal','rest'].includes(event.kind)&&actors.some(n=>n.id===run.mentorId)) run.flags.mentorPersonal++;
  if(['personal','rest'].includes(event.kind)&&actors.some(n=>n.id===run.leaderId)) run.flags.leaderPersonal++;
  if(event.kind==='conflict') { const e=event.edge||pair; if(run.policy==='support' && first){ change(e,{tension:8,trust:-4},`D${run.day}: 플레이어가 ${first.name} 편을 듦`); first.playerTrust+=10; dayLog.push({type:'player',text:`플레이어가 ${first.name}의 편을 들었다. <span class="muted">(${first.name}의 신뢰 +10, 갈등 심화)</span>`}); } else if(run.policy==='mediate'){ change(e,{tension:-10,trust:3},`D${run.day}: 플레이어 중재`); actors.forEach(n=>n.playerTrust+=4); dayLog.push({type:'player',text:'플레이어가 둘 사이를 중재했다. <span class="muted">(긴장 -10, 양쪽 신뢰 +4)</span>'}); } else dayLog.push({type:'player',text:run.policy==='distance'?'플레이어는 관여하지 않고 거리를 뒀다.':'플레이어는 갈등의 원인을 관찰했다.'}); }
  else if(event.kind==='mentor') { const m=actors[0]; if(outcome.label==='성공'){m.playerTrust+=4; m.playerCloseness+=1; dayLog.push({type:'player',text:`${m.name} 사수가 업무 태도를 좋게 봤다. <span class="muted">(사수 업무 신뢰 +4)</span>`});} else dayLog.push({type:'player',text:`${m.name} 사수의 피드백은 받았지만, 아직 신뢰를 얻지는 못했다.`}); }
  else if(event.kind==='leader') { const l=actors[0]; dayLog.push({type:'player',text:outcome.label==='성공'?`팀장 ${l.name}이(가) 이번 결과를 좋게 봤다. <span class="muted">(판정 성공으로 업무 신뢰 상승)</span>`:`팀장 ${l.name}은(는) 아직 결과를 더 지켜보기로 했다.`}); }
  else if(event.id==='heartbreak') { const target=actors[0]; revealPrivateClue(run,target,dayLog,event.title); if(outcome.label==='성공'){ const closeGain=addPlayerCloseness(run,target,5,'romance',dayLog,'실연의 여파를 함께 넘긴 일'); target.playerTrust+=1; target.stress=clamp(target.stress-8,0,100); dayLog.push({type:'player',text:`${target.name}은(는) 플레이어가 선을 넘지 않고 들어 준 것을 기억했다. <span class="muted">(친밀도 +${closeGain}, 스트레스 -8)</span>`}); } else { target.playerCloseness-=4; target.playerTrust-=2; target.stress=clamp(target.stress+6,0,100); dayLog.push({type:'player',text:`타이밍을 잘못 잡아 ${target.name}이(가) 더 방어적으로 굳었다. <span class="muted">(친밀도 -4, 신뢰 -2)</span>`}); } }
  else { if(pair) change(pair,event.kind==='personal'?{affection:3,tension:-1}:{trust:3,affection:1},`D${run.day}: ${event.title}`); actors.forEach(n=>addPlayerCloseness(run,n,2,['personal','rest'].includes(event.kind)?event.kind:'personal',dayLog,event.title)); if(['personal','rest'].includes(event.kind)) actors.forEach(n=>revealPrivateClue(run,n,dayLog,event.title)); dayLog.push({type:'player',text:'플레이어가 상황을 함께 겪으며 관련 인물에 대한 정보를 얻었다.'}); }
  run.eventCount++;
}

function resolveEventCheck(run,event,actors,bonus=0) {
  const player=run.player; const trust=actors.length?Math.round(actors.reduce((sum,n)=>sum+n.playerTrust,0)/actors.length):0;
  const social=actors.length?Math.round(actors.reduce((sum,n)=>sum+n.playerCloseness,0)/actors.length):0; const support=companionSupport(run); const mood=teamAtmosphere(run);
  if(event.kind==='rest'){ const detail='휴식은 판정 실패가 없다. 선택한 방식에 따라 관계와 스트레스만 달라진다.'; player.impacts.unshift({day:run.day,kind:'event',text:`${event.title}: 휴식`,detail}); return {label:'휴식',detail}; }
  const requirements=eventRequirements(event); const personal=['personal','rumor'].includes(event.kind); const own=Math.round(requirements.reduce((sum,key)=>sum+player.skills[key],0)/requirements.length); const specialist=eventSupport(run,requirements); const score=(personal?player.insight*3+social:own*10+trust)+bonus+specialist.value*2+Math.floor(run.rng()*16); const baseDifficulty=event.required?44:50; const difficulty=(personal?23+mood.personalPenalty:baseDifficulty+mood.penalty);
  let result='failure', label='실패', detail=`판정 ${score} / 난도 ${difficulty}. 필요한 ${requirements.map(skillName).join('·')} 준비와 업무 신뢰가 부족했다. ${mood.label} 팀 분위기도 발목을 잡았다.`;
  if(score>=difficulty){ result='success'; label='성공'; player.reputation+=3; const trustGain=Math.max(1,4+mood.successTrust); actors.forEach(n=>n.playerTrust+=trustGain); detail=`판정 ${score} / 난도 ${difficulty}. ${requirements.map(key=>`${skillName(key)} ${player.skills[key]}`).join(' · ')}, 관련 인물 업무 신뢰 ${trust}${specialist.name?`, ${specialist.name}의 ${specialist.stat} 지원 +${specialist.value}`:''}이 뒷받침되어 좋은 결과를 냈다. <span class="muted">(평판 +3, 관련 인물 업무 신뢰 +${trustGain})</span>`; }
  else { const stressGain=event.required?6:5; player.stress=clamp(player.stress+stressGain,0,100); const trustLoss=event.required?3+mood.failureTrust:2+mood.failureTrust; actors.forEach(n=>n.playerTrust-=trustLoss); detail+=` <span class="muted">(스트레스 +${stressGain}, 관련 인물 신뢰 -${trustLoss})</span>`; }
  player.outcomes[result]++; player.impacts.unshift({day:run.day,kind:'event',text:`${event.title}: ${label}`,detail}); return {label,detail};
}

function closestPeople(run) { return run.npcs.slice().sort((a,b)=>(b.playerTrust+b.playerCloseness)-(a.playerTrust+a.playerCloseness)); }
function updateDisposition(run) { const closest=closestPeople(run)[0]; if(!closest||closest.playerTrust+closest.playerCloseness<8) return {name:'적응 중',hint:'아직 닮아 갈 동료가 없다. 초반 사교 이벤트가 플레이어의 행동 성향을 만든다.',mode:'balanced'}; let mode='balanced',name='균형형',hint='업무와 관계 사이에서 상황에 맞춰 행동한다.'; if(closest.traits.includes('성취가')) {mode='achievement';name='성과지향형';hint=`${closest.name}의 영향을 받아, 평소에는 준비와 성과를 우선한다.`;} else if(closest.traits.includes('관계중심형')||closest.traits.includes('친화력')) {mode='social';name='관계중심형';hint=`${closest.name}의 영향을 받아, 평소에는 사람의 감정과 분위기를 먼저 살핀다.`;} else if(closest.traits.includes('분석가')||closest.traits.includes('완벽주의')) {mode='analysis';name='분석형';hint=`${closest.name}의 영향을 받아, 평소에는 관찰과 근거 확인을 우선한다.`;} else if(closest.traits.includes('안정가')||closest.traits.includes('원칙주의')) {mode='cautious';name='안정지향형';hint=`${closest.name}의 영향을 받아, 평소에는 위험을 피하고 규칙을 따른다.`;} run.player.disposition=name; return {name,hint,mode}; }
function applyDispositionGrowth(run,dayLog) { if(run.day%5!==0) return; const tendency=updateDisposition(run); const skill=({achievement:'plan',social:'talk',analysis:'work',cautious:'sense',balanced:'sense'})[tendency.mode]; run.player.skills[skill]=clamp(run.player.skills[skill]+1,0,10); dayLog.push({type:'player',text:`<strong>성향 행동 · ${tendency.name}</strong><br>가까운 동료의 영향을 받아 평소 행동이 누적되었다. <span class="muted">(${skillName(skill)} +1)</span>`}); }
function applyOfficeBuddyMoment(run,dayLog) {
  if(run.day<4||run.day%4!==0||run.rng()>.75) return;
  const candidates=run.npcs.filter(n=>n.kind==='일반'&&n.id!==run.leaderId&&n.id!==run.mentorId);
  if(!run.flags.officeBuddyId) run.flags.officeBuddyId=(run.npcs.find(n=>n.affinityHook?.id==='seatmate')||(candidates.length?pick(run.rng,candidates):pick(run.rng,run.npcs.filter(n=>n.kind==='일반'))))?.id;
  const buddy=run.npcs.find(n=>n.id===run.flags.officeBuddyId)||candidates[0]||run.npcs.find(n=>n.kind==='일반');
  if(!buddy) return;
  const trustGain=buddy.skills.work>=4||buddy.skills.sense>=4?2:1;
  const closeGain=addPlayerCloseness(run,buddy,3,'office',null,'옆자리 접점');
  buddy.playerTrust+=trustGain;
  dayLog.push({type:'player',text:`<strong>옆자리 접점 · ${buddy.name}</strong><br>${buddy.name}이(가) 사소한 회사 생활을 챙겨 주며 자연스럽게 가까워졌다. <span class="muted">(친밀도 +${closeGain}, 업무 신뢰 +${trustGain})</span>`});
}
function autoEventChoice(run,event) { const options=eventOptions(event); const mode=updateDisposition(run).mode; const preference={achievement:['prepare','align_authority'],social:['empathize','invite','call','collaborate'],analysis:['read_room','observe_event','solo'],cautious:['read_room','align_authority','observe_event','solo']}[mode]||['collaborate','observe_event','prepare']; return options.find(o=>preference.includes(o.id))||options[0]; }
function companionSupport(run) { const candidates=run.npcs.map(n=>{const entries=Object.entries(n.skills).sort((a,b)=>b[1]-a[1]); const [key,value]=entries[0]; const score=n.playerTrust*1.7+n.playerCloseness*.25+value*4+(n.kind==='일반'?2:0); return {name:n.name,stat:skillName(key),value,npc:n,score};}).filter(x=>x.npc.playerTrust>=8&&x.value>=3).sort((a,b)=>b.score-a.score); return candidates[0]||{name:null,stat:null,value:0,npc:null}; }
function skillName(key) { return ({work:'실무',plan:'기획',talk:'화술',sense:'눈치'})[key]; }
function withParticle(name, consonantParticle, vowelParticle) { const code=name.charCodeAt(name.length-1); if(code<0xAC00||code>0xD7A3) return name+vowelParticle; return name+(((code-0xAC00)%28)?consonantParticle:vowelParticle); }
function eventLabel(event) {
  if(event.required) return event.kind==='personal'?'필수·사적':'필수·회사';
  if(event.companyRandom) return event.kind==='conflict'?'회사랜덤·갈등':'회사랜덤';
  if(event.kind==='rest') return '휴식';
  if(event.id==='heartbreak') return '개인·연애';
  if(event.kind==='personal') return '개인';
  if(event.kind==='mentor') return '사수';
  if(event.kind==='leader') return '평가';
  if(event.kind==='conflict') return '갈등';
  return '회사';
}
function logLabel(item) { return item.label||({player:'플레이어',team:'팀공기',normal:'NPC행동',event:'사건'})[item.type]||'일지'; }
function personalRandomEvent(run,dayLog) {
  const chance=run.day<=5?.72:.52;
  if(run.rng()>chance) return;
  const npc=pick(run.rng,run.npcs);
  const partner=pick(run.rng,other(run,npc.id));
  const e=edge(run,npc,partner);
  const templates=[
    {id:'supply',title:'비품이 필요한 순간',text:`${npc.name}이(가) 급하게 필요한 비품을 찾다가 ${partner.name}에게 도움을 청했다.`,values:{affection:3,trust:1},player:1},
    {id:'mood',title:'기분이 가라앉은 오후',text:`${npc.name}이(가) 평소보다 말수가 줄었다. ${partner.name}은(는) 눈치를 보며 말을 걸지 고민했다.`,values:{affection:2,tension:-1},player:1},
    {id:'interest',title:'뜻밖의 관심사',text:`${npc.name}의 이번 주 관심사가 ${partner.name}과(와) 묘하게 겹쳤다.`,values:{affection:4,tension:-1},player:2},
    {id:'mistake',title:'작은 실수 수습',text:`${npc.name}이(가) 사소한 실수를 냈고 ${partner.name}이(가) 조용히 덮어 주었다.`,values:{trust:3,affection:1,tension:-1},player:0},
    {id:'praise',title:'칭찬이 필요한 날',text:`${npc.name}은(는) 자신의 일이 묻힌 것 같아 예민해졌고, ${partner.name}의 한마디에 표정이 조금 풀렸다.`,values:{affection:3,tension:-2},player:2}
  ];
  const event=pick(run.rng,templates);
  change(e,event.values,`D${run.day}: ${event.title}`);
  const playerGain=addPlayerCloseness(run,npc,event.player,'personal',dayLog,event.title);
  if(playerGain>0) gainKnowledge(run,npc,`${event.title}에서 사적인 반응을 봄`);
  dayLog.push({type:'event',label:'개인랜덤',text:`<strong>${event.title} · ${npc.name}</strong><br>${event.text} <span class="muted">(NPC 관계 변화${playerGain?`, ${npc.name} 친밀도 +${playerGain}`:''})</span>`});
}
function applyNpcEventResponses(run,event,actors,outcome,dayLog) {
  if(!actors.length||event.kind==='rest') return;
  const responder=pick(run.rng,actors);
  const observer=pick(run.rng,run.npcs.filter(n=>!actors.some(a=>a.id===n.id)))||actors[0];
  const ok=outcome.label==='성공'||outcome.label==='휴식';
  let text='', values={};
  if(responder.traits.includes('성취가')||responder.traits.includes('완벽주의')) {
    values=ok?{trust:3,competition:1}:{tension:4,competition:2};
    text=pick(run.rng, ok?[
      `${responder.name}은(는) 결과가 나온 것을 보고 ${observer.name}을(를) 실무적으로 다시 봤다.`,
      `${responder.name}은(는) 이번 성과를 보고 ${observer.name}과(와) 다음에도 손발을 맞출 만하다고 생각했다.`
    ]:[
      `${responder.name}은(는) 실패 원인을 따지며 ${observer.name}과(와) 미묘하게 날이 섰다.`,
      `${responder.name}은(는) 아쉬운 결과를 보고 ${observer.name}의 준비 부족을 속으로 지적했다.`
    ]);
  } else if(responder.traits.includes('관계중심형')||responder.traits.includes('친화력')) {
    values=ok?{affection:4,tension:-2}:{affection:2,tension:-1};
    text=pick(run.rng, ok?[
      `${responder.name}은(는) 분위기가 풀린 틈을 타 ${observer.name}에게 말을 붙였다.`,
      `${responder.name}은(는) 좋은 결과를 핑계 삼아 ${observer.name}과(와) 더 편하게 농담을 주고받았다.`
    ]:[
      `${responder.name}은(는) 어색해진 공기를 풀려고 ${observer.name}을(를) 챙겼다.`,
      `${responder.name}은(는) 실망한 기색을 감추고 ${observer.name}의 편을 들어 주었다.`
    ]);
  } else if(responder.traits.includes('분석가')||responder.traits.includes('비밀주의')) {
    values=ok?{trust:2}:{trust:-1,tension:3};
    text=pick(run.rng, ok?[
      `${responder.name}은(는) 이번 사건에서 누가 믿을 만한지 조용히 기록했다.`,
      `${responder.name}은(는) 말을 아꼈지만 ${observer.name}의 대응 방식을 눈여겨봤다.`
    ]:[
      `${responder.name}은(는) 말은 아꼈지만 ${observer.name}의 대응을 신뢰하기 어려워했다.`,
      `${responder.name}은(는) 실패의 이유를 혼자 되짚으며 ${observer.name}과(와) 거리를 뒀다.`
    ]);
  } else {
    values=ok?{trust:2,affection:1}:{tension:3};
    text=pick(run.rng, ok?[
      `${responder.name}은(는) 이번 일을 계기로 ${observer.name}과(와) 조금 더 편해졌다.`,
      `${responder.name}은(는) 무난하게 넘어간 것에 안도하며 ${observer.name}에게 고마움을 표했다.`
    ]:[
      `${responder.name}은(는) 이번 일을 오래 기억할 것 같다.`,
      `${responder.name}은(는) 아쉬운 결과에 말수가 줄었고, ${observer.name}도 그걸 눈치챘다.`
    ]);
  }
  if(observer&&responder.id!==observer.id) change(edge(run,responder,observer),values,`D${run.day}: ${event.title} 이후 반응`);
  dayLog.push({type:'normal',label:'NPC반응',text:`<strong>${event.title} 이후 반응</strong><br>${text}`});
}
function eventRequirements(event) { const map={kickoff:['sense'],mentor_feedback:['work'],team_meeting_1:['sense','talk'],first_task:['work'],company_dinner:['talk','sense'],mid_review:['work','sense'],team_meeting_2:['plan','talk'],big_task:['plan','talk'],workshop:['talk','sense'],project_gap:['work','sense'],final_review:['work','sense'],weekly_report:['work','sense'],minutes_gap:['sense','work'],client_feedback:['talk','sense'],data_cleanup:['work','plan'],sudden_presentation:['plan','talk'],manager_checkin:['sense','talk'],handoff_miss:['work','sense'],tea_time:['talk'],health:['sense'],interest:['talk'],heartbreak:['sense','talk'],leader_absent:['sense'],credit_conflict:['work','talk']}; return map[event.id]||(['personal','rumor'].includes(event.kind)?['talk']:['work']); }
function eventSupport(run, requirements) { const candidates=run.npcs.filter(n=>n.playerTrust>=12).map(n=>{const matching=Math.max(...requirements.map(key=>n.skills[key]||0)); const stat=requirements.find(key=>(n.skills[key]||0)===matching); return {name:n.name,stat:skillName(stat),value:matching,npc:n};}).filter(x=>x.value>=3).sort((a,b)=>b.value-a.value); return candidates[0]||{name:null,stat:null,value:0}; }
function nextCompanyForecast(run) { const plan=[{id:'team_meeting_1',day:5,title:'첫 정기 회의'},{id:'first_task',day:6,title:'첫 번째 업무'},{id:'company_dinner',day:9,title:'첫 회식'},{id:'mid_review',day:11,title:'중간 수습 평가'},{id:'team_meeting_2',day:14,title:'중간 공유 회의'},{id:'big_task',day:16,title:'중요 업무 배정'},{id:'workshop',day:20,title:'팀 워크숍'},{id:'final_review',day:27,title:'30일 최종 평가'}]; const next=plan.find(item=>!run.eventHistory[item.id]&&item.day>=run.day); if(!next) return null; const req=eventRequirements({id:next.id,kind:'meeting'}); const specialists=run.npcs.filter(n=>req.some(key=>(n.skills[key]||0)>=3)); const known=specialists.filter(n=>run.player.knowledge[n.id].evidence>=2); return { ...next, req, hint:known.length?`${known.map(n=>n.name).join(', ')}은(는) 관련 전문성을 알고 있다. 업무 신뢰를 쌓으면 지원을 요청할 수 있다.`:'관련 전문성을 가진 동료와 업무 신뢰를 쌓으면 지원을 요청할 수 있다.'}; }
function teamAtmosphere(run) {
  const edges=Object.values(run.relations); const avg=key=>edges.reduce((sum,e)=>sum+e[key],0)/edges.length;
  const cohesion=avg('trust')+avg('affection'); const friction=avg('tension')+avg('competition');
  const hot=edges.filter(e=>e.tension+e.competition>=72); const close=edges.filter(e=>e.trust+e.affection>=48);
  const hottest=edges.slice().sort((a,b)=>(b.tension+b.competition)-(a.tension+a.competition))[0];
  const a=hottest&&run.npcs.find(n=>n.id===hottest.a),b=hottest&&run.npcs.find(n=>n.id===hottest.b);
  const score=friction-cohesion+hot.length*7-close.length*4;
  if(score<=-12) return {id:'warm',label:'협업 상승세',penalty:-4,personalPenalty:-3,successTrust:2,failureTrust:0,failureTension:0,reason:'서로 도운 경험이 쌓여, 작은 실수도 함께 수습하는 분위기다',daily:'호의적인 분위기가 협업을 한 번 더 밀어 준다'};
  if(score<=4) return {id:'steady',label:'안정적인',penalty:0,personalPenalty:0,successTrust:0,failureTrust:0,failureTension:0,reason:'큰 갈등 없이 각자 맡은 일을 해내는 분위기다',daily:''};
  if(score<=17) return {id:'uneasy',label:'미묘한 긴장',penalty:3,personalPenalty:2,successTrust:0,failureTrust:1,failureTension:2,reason:`${a.name}·${b.name}의 신경전이 주변에도 조금씩 번진다`,daily:'사람들이 말과 도움을 한 번 더 재고 있다'};
  if(score<=26) return {id:'cold',label:'냉각된 팀',penalty:7,personalPenalty:5,successTrust:-1,failureTrust:2,failureTension:4,reason:`${a.name}·${b.name}의 갈등 때문에 협업 요청도 조심스러워졌다`,daily:'도움과 대화가 쉽게 오해로 번질 수 있다'};
  return {id:'faction',label:'파벌화 직전',penalty:12,personalPenalty:8,successTrust:-2,failureTrust:3,failureTension:7,reason:`갈등 관계 ${hot.length}쌍이 얽혀 ${a.name}·${b.name}의 문제가 팀 전체의 편 가르기로 번졌다`,daily:'누구와 함께하느냐 자체가 업무 결과에 영향을 준다'};
}
function applyInteractionClimate(run,e,action,mood,dayLog) {
  const connective=['도움 요청','업무 지원','스몰토크','점심 함께 먹기','티타임','관심사 공유','선물 주기','비품 챙기기'];
  if(!connective.includes(action)) return;
  const a=run.npcs.find(n=>n.id===e.a),b=run.npcs.find(n=>n.id===e.b);
  if(mood.id==='warm') { change(e,{trust:1,affection:1},`D${run.day}: 협업 상승세의 추가 호의`); if(run.rng()<.06) dayLog.push({type:'team',text:`<strong>팀 분위기 · 협업 상승세</strong><br>${a.name}·${b.name}의 작은 상호작용도 평소보다 좋은 기억으로 남았다.`}); }
  if(mood.id==='cold'||mood.id==='faction') { change(e,{tension:mood.id==='faction'?3:2,trust:-1},`D${run.day}: ${mood.label}의 오해`); if(run.rng()<.08) dayLog.push({type:'team',text:`<strong>팀 분위기 · ${mood.label}</strong><br>${a.name}·${b.name}은(는) 평범한 대화도 서로의 의도를 의심하게 됐다.`}); }
}
function applyTeamDailyRipple(run,mood,dayLog) {
  if(mood.id==='steady'||run.rng()>.10) return;
  const edges=Object.values(run.relations); const target=mood.id==='warm' ? edges.sort((a,b)=>(a.trust+a.affection)-(b.trust+b.affection))[0] : edges.sort((a,b)=>(b.tension+b.competition)-(a.tension+a.competition))[0];
  const a=run.npcs.find(n=>n.id===target.a),b=run.npcs.find(n=>n.id===target.b);
  if(mood.id==='warm') { change(target,{trust:1,affection:1,tension:-1},`D${run.day}: 팀의 협업 기류`); dayLog.push({type:'team',text:`<strong>팀 분위기 · 협업 상승세</strong><br>${a.name}·${b.name}도 주변의 도움을 받아 자연스럽게 대화를 이어 갔다.`}); }
  else { const amount=mood.id==='faction'?5:mood.id==='cold'?3:1; change(target,{tension:amount},`D${run.day}: 팀의 긴장 확산`); dayLog.push({type:'team',text:`<strong>팀 분위기 · ${mood.label}</strong><br>${a.name}·${b.name}의 작은 의견 차이도 팀의 공기 때문에 더 날카로워졌다.`}); }
}
function applyEventClimate(run,event,actors,outcome,dayLog,choice) {
  const mood=teamAtmosphere(run); const pair=actors.length>1?edge(run,actors[0],actors[1]):null;
  if(mood.id==='steady') return;
  if(outcome.label==='성공'&&['cold','faction'].includes(mood.id)&&choice?.id==='collaborate') {
    const repair=Object.values(run.relations).sort((a,b)=>(b.tension+b.competition)-(a.tension+a.competition))[0]; const repairA=run.npcs.find(n=>n.id===repair.a),repairB=run.npcs.find(n=>n.id===repair.b);
    change(repair,{trust:6,tension:-9,competition:-4},`D${run.day}: ${event.title} 협업으로 팀 균열 수습`);
    dayLog.push({type:'team',text:`<strong>팀 분위기 회복 시도</strong><br>${event.title}에서 함께 책임진 선택이 ${repairA.name}·${repairB.name} 사이의 가장 큰 불신을 조금 누그러뜨렸다.`});
    return;
  }
  if(!pair) return;
  if(outcome.label==='성공'&&mood.id==='warm') { change(pair,{trust:3,affection:1,tension:-2},`D${run.day}: ${event.title} 공동 성공`); dayLog.push({type:'team',text:`<strong>팀 분위기 · 협업 상승세</strong><br>${event.title}의 성공이 ${actors.map(n=>n.name).join('·')} 사이에도 좋은 협업 기억으로 남았다.`}); }
  if(outcome.label==='실패'&&['uneasy','cold','faction'].includes(mood.id)) { change(pair,{tension:mood.failureTension,trust:-mood.failureTrust},`D${run.day}: ${event.title} 실패의 여파`); dayLog.push({type:'team',text:`<strong>팀 분위기 · ${mood.label}</strong><br>${event.title}의 실패가 ${actors.map(n=>n.name).join('·')} 사이의 탓하기로 번졌다.`}); }
}
function majorRelationChanges(run) { return Object.values(run.relations).map(e=>{const initial=run.initialRelations[pairKey(e.a,e.b)]; const a=run.npcs.find(n=>n.id===e.a),b=run.npcs.find(n=>n.id===e.b); const delta=Math.abs(e.trust-initial.trust)+Math.abs(e.affection-initial.affection)+Math.abs(e.tension-initial.tension)+Math.abs(e.competition-initial.competition); return {a,b,delta,from:relationshipStage(initial),to:relationshipStage(e),history:e.history.at(-1)}; }).filter(x=>x.from!==x.to).sort((a,b)=>b.delta-a.delta).slice(0,3); }
function resolveEnding(run) {
  const closest=closestPeople(run); const support=companionSupport(run); const careerScore=Object.values(run.player.skills).reduce((a,b)=>a+b,0)*3+run.player.reputation*3+run.player.outcomes.success*4; const leader=run.npcs.find(n=>n.id===run.leaderId), mentor=run.npcs.find(n=>n.id===run.mentorId); const bond=n=>n.playerTrust+n.playerCloseness; const lightCloseCount=run.npcs.filter(n=>n.playerCloseness>=12).length; const deepCloseCount=run.npcs.filter(n=>n.playerCloseness>=18).length; const trustedCloseCount=run.npcs.filter(n=>n.playerCloseness>=16&&n.playerTrust>=8).length;
  const isolated=bond(closest[0])<18; let career;
  if(run.player.stress>=92||(run.flags.requiredFailure>=7&&run.flags.milestoneSuccess<=3)||(run.flags.requiredFailure>=6&&isolated)) career={title:'수습 탈락',body:'업무와 관계 모두 흔들려, 회사가 더 지켜볼 이유를 찾지 못했다.'};
  else if((run.flags.milestoneSuccess>=5&&run.flags.finalReviewSuccess&&careerScore>=48&&run.flags.requiredFailure<5)||(run.flags.milestoneSuccess>=7&&careerScore>=58&&run.flags.requiredFailure<4)) career={title:'수습 통과',body:`필수 사건 ${run.flags.milestoneSuccess}/8회 성공으로 기본 역량을 증명했다.${run.flags.finalReviewSuccess?' 최종 평가도 통과했다.':' 최종 평가는 아쉬웠지만 누적 성과가 충분했다.'}`};
  else career={title:'수습 연장',body:`필수 사건 성공 ${run.flags.milestoneSuccess}/8회. 가능성은 보였지만 성과나 적응을 조금 더 확인해야 한다.`};
  const workPartner=run.npcs.filter(n=>n.id!==run.mentorId&&n.id!==run.leaderId&&n.playerTrust>=12).sort((a,b)=>b.playerTrust-a.playerTrust)[0]; const firstFriend=run.npcs.find(n=>n.id===run.firstConnection);
  let personal;
  if(deepCloseCount>=5&&trustedCloseCount>=4) personal={title:'모두의 인기인',body:'여러 동료와 깊고 안정적인 관계를 만들며 팀 안에서 존재감이 커졌다.'};
  else if(mentor.playerTrust>=18&&mentor.playerCloseness>=14&&run.flags.mentorPersonal>=3&&run.flags.mentorWorkSuccess>=1) personal={title:'사수와 절친',body:`${mentor.name}과(와) 업무 신뢰와 사적인 시간을 모두 쌓아 가장 든든한 회사 편이 되었다.`};
  else if(leader.playerTrust>=32&&leader.playerCloseness>=18&&run.flags.leaderPersonal>=3&&run.flags.milestoneSuccess>=6&&run.flags.finalReviewSuccess) personal={title:'팀장님께 발탁',body:`${leader.name} 팀장이 업무 성과와 태도를 모두 보고 플레이어의 성장 가능성을 눈여겨봤다.`};
  else if(workPartner) personal={title:'신뢰받는 실무 파트너',body:`${workPartner.name}과(와) 함께 일을 해결하며, 사적인 친밀도와 별개로 단단한 업무 신뢰를 만들었다.`};
  else if(firstFriend&&firstFriend.playerCloseness>=16) personal={title:'첫 인맥의 단짝',body:`${firstFriend.name}과(와) 가장 먼저 가까워지며, 회사 안에서 편하게 기댈 사람을 만들었다.`};
  else if(lightCloseCount>=3) personal={title:'호감 받는 신입',body:'여러 사람과 얕지만 좋은 접점을 만들었다. 아직 모두의 중심이라고 부르기엔 깊이가 부족하다.'};
  else if(isolated) personal={title:'고립된 신입',body:'일은 했지만 아직 회사 안에서 편하게 기대는 사람이 없다.'};
  else personal={title:'조용한 동료',body:`${closest[0]?.name||'동료'} 한두 명과만 천천히 관계를 쌓기 시작했다.`};
  let romance;
  const romanceCandidates=closest.map(n=>({npc:n,...romanceReadiness(run,n)})).filter(x=>x.npc.playerCloseness>=18).sort((a,b)=>b.score-a.score);
  const bestRomance=romanceCandidates[0];
  if(deepCloseCount>=5&&trustedCloseCount>=4&&run.player.outcomes.success>=4&&romanceCandidates.filter(x=>x.ok).length>=2) romance={title:'사내 화제의 중심',body:'성과와 사적인 접점이 함께 쌓이고, 둘 이상의 관계에서 묘한 기류가 생기며 주변의 관심을 받기 시작했다.'};
  else if(bestRomance?.ok) romance={title:`${withParticle(bestRomance.npc.name,'과','와')} 썸의 조짐`,body:`${bestRomance.reason}. 친밀감이 단순한 친절을 넘어설 가능성이 보였다.`};
  else if(bestRomance&&bestRomance.npc.availability==='partner') romance={title:'선을 지킨 호감',body:`${bestRomance.npc.name}과(와)는 가까워졌지만, 이미 만나는 사람이 있어 사적인 선을 넘지 않았다.`};
  else if(bestRomance&&bestRomance.npc.boundary==='strict') romance={title:'업무적으로 신뢰받음',body:`${bestRomance.npc.name}과(와)는 가까워졌지만, 공사구분이 확실해 사적인 기류보다 업무 신뢰로 남았다.`};
  else if(bestRomance) romance={title:'타이밍이 어긋난 호감',body:`가장 가까운 ${bestRomance.npc.name}과(와)도 ${bestRomance.reason}. 눈치나 이상형 조건이 조금 부족해 썸으로 이어지지는 않았다.`};
  else if(lightCloseCount>=3) romance={title:'호감 받는 신입',body:'분위기는 좋지만 아직 사내 화제나 썸으로 번질 만큼 특별한 관계는 아니다.'};
  else romance={title:'노관심',body:'이번 30일은 관계보다 적응과 생존에 집중했다.'};
  return {career,personal,romance,support,closest};
}

function eventOptions(event) {
  if(event.kind==='rest') return [{id:'invite',label:'같이 쉬자고 제안하기',hint:'친한 동료와 퇴근 후 접점. 친밀도와 스트레스 회복에 좋다.',bonus:8},{id:'call',label:'첫 인맥에게 안부 전화하기',hint:'첫 인맥과 조용히 관계를 다진다.',bonus:5},{id:'solo',label:'혼자 쉬며 회복하기',hint:'관계 기회는 적지만 스트레스를 크게 낮춘다.',bonus:2}];
  if(event.id==='heartbreak') return [{id:'empathize',label:'가볍게 곁에 있어 주기',hint:'눈치와 화술이 맞으면 깊은 친밀도로 이어진다.',bonus:7},{id:'share',label:'내 실패담도 조심히 말하기',hint:'상대가 받아들이면 신뢰가 오르지만, 타이밍이 나쁘면 부담스럽다.',bonus:4},{id:'observe_event',label:'지금은 말 아끼고 살피기',hint:'친밀도 상승은 작지만 프로필 단서와 안전성이 높다.',bonus:6}];
  if(event.kind==='personal') return [{id:'empathize',label:'상대 기분을 먼저 살피기',hint:'관련 인물 친밀도에 유리하다.',bonus:8},{id:'share',label:'내 경험을 살짝 꺼내기',hint:'사적인 신뢰와 정보에 유리하지만 부담이 될 수 있다.',bonus:5},{id:'observe_event',label:'괜히 끼지 않고 관찰하기',hint:'관계 상승은 작지만 프로필 단서와 안전성이 높다.',bonus:3}];
  if(event.kind==='leader') return [{id:'prepare',label:'결과물부터 정리해 보고하기',hint:'실무와 눈치로 정면 평가를 받는다.',bonus:10},{id:'align_authority',label:'팀장 기준에 맞춰 말하기',hint:'권한 라인 신뢰와 평판에 유리하다.',bonus:8},{id:'read_room',label:'평가자의 진짜 걱정 읽기',hint:'눈치와 정보로 감점 포인트를 줄인다.',bonus:5},{id:'collaborate',label:'도와준 동료의 공도 함께 말하기',hint:'성과는 나누지만 관계와 팀 균열 회복에 좋다.',bonus:5}];
  if(event.kind==='support') return [{id:'prepare',label:'내가 직접 수습하기',hint:'실무로 사고를 막는다. 스트레스는 오른다.',bonus:9},{id:'collaborate',label:'전문 동료에게 바로 도움 요청하기',hint:'업무 신뢰가 있는 동료가 있으면 강하다.',bonus:8},{id:'read_room',label:'누가 막혔는지 먼저 파악하기',hint:'눈치로 탓하기를 줄이고 숨은 원인을 찾는다.',bonus:6},{id:'align_authority',label:'팀장·사수에게 기준 확인하기',hint:'보고 누락을 막고 평가 리스크를 줄인다.',bonus:5}];
  if(event.kind==='conflict') return [{id:'read_room',label:'누가 왜 예민한지 먼저 읽기',hint:'눈치로 갈등 확산을 줄인다.',bonus:8},{id:'collaborate',label:'같이 책임지는 쪽으로 돌리기',hint:'성공하면 팀 균열 회복에 좋다.',bonus:7},{id:'align_authority',label:'공식 기준으로 정리하기',hint:'감정보다 원칙으로 수습한다.',bonus:6},{id:'prepare',label:'내 몫부터 조용히 마무리하기',hint:'관계 개입은 약하지만 내 평판을 지킨다.',bonus:4}];
  return [{id:'prepare',label:'회의 자료를 먼저 준비하기',hint:'내 업무 능력으로 정면 돌파한다. 스트레스는 조금 오른다.',bonus:10},{id:'align_authority',label:'팀장·사수의 의도 확인하기',hint:'평판과 권한 라인 신뢰에 유리하다.',bonus:7},{id:'collaborate',label:'관련 동료와 역할 나누기',hint:'전문성을 빌린다. 성공하면 팀 균열 회복에도 좋다.',bonus:6},{id:'read_room',label:'회의장 분위기 읽기',hint:'눈치와 정보로 말실수를 피한다. 험악한 팀에서 특히 안전하다.',bonus:4}];
}

function applyEventChoice(run,event,actors,choice,dayLog) {
  const player=run.player; const first=run.npcs.find(n=>n.id===run.firstConnection); const primary=actors[0];
  if(choice.id==='prepare'){ player.stress=clamp(player.stress+2,0,100); }
  if(choice.id==='align_authority'){ const leader=run.npcs.find(n=>n.id===run.leaderId), mentor=run.npcs.find(n=>n.id===run.mentorId); leader.playerTrust+=2; mentor.playerTrust+=2; if(['leader','meeting'].includes(event.kind)) player.reputation+=1; }
  if(choice.id==='collaborate'&&primary){ const specialist=eventSupport(run,eventRequirements(event)).npc||primary; specialist.playerTrust+=3; addPlayerCloseness(run,specialist,1,'personal',dayLog,'전문 동료와 같이 푼 일'); if(specialist.id!==primary.id) primary.playerTrust+=1; }
  if(choice.id==='read_room'){ player.insight+=1; if(player.skills.sense>=4) choice.bonus+=4; const insightTargets=actors.slice(0,player.skills.sense>=4?2:1); insightTargets.forEach(n=>{ if(run.flags.readRoomInsights<6){ gainKnowledge(run,n,`${event.title}에서 이해관계를 읽음`); run.flags.readRoomInsights++; } }); }
  if(choice.id==='empathize'&&primary){ addPlayerCloseness(run,primary,6,'personal',dayLog,'공감하며 들어준 일'); }
  if(choice.id==='share'&&primary){ primary.playerTrust+=4; gainKnowledge(run,primary,`${event.title}에서 서로의 경험을 나눔`); }
  if(choice.id==='observe_event') actors.forEach(n=>gainKnowledge(run,n,`${event.title}에서 반응을 관찰함`));
  if(choice.id==='invite'&&primary){ addPlayerCloseness(run,primary,8,'rest',dayLog,'퇴근 후 같이 쉰 일'); player.stress=clamp(player.stress-6,0,100); }
  if(choice.id==='call'&&first){ addPlayerCloseness(run,first,6,'rest',dayLog,'퇴근 후 전화한 일'); player.stress=clamp(player.stress-3,0,100); }
  if(choice.id==='solo'){ player.stress=clamp(player.stress-8,0,100); }
  dayLog.push({type:'player',text:`<strong>플레이어 선택 · ${choice.label}</strong><br><span class="muted">${choice.hint}</span>`});
  player.impacts.unshift({day:run.day,kind:'choice',text:`${event.title}에서 ${choice.label} 선택`});
}

function applyPlayerAction(run, dayLog) {
  const action=run.queuedAction; if(!action) return;
  const target=run.npcs.find(n=>n.id===run.playerTarget) || run.npcs.find(n=>n.id===run.firstConnection);
  const player=run.player; const mentor=run.npcs.find(n=>n.id===run.mentorId);
  const targetName=target?target.name:'회사';
  const studyMap={study_work:['work','실무'],study_plan:['plan','기획'],study_talk:['talk','화술'],study_sense:['sense','눈치']};
  if(studyMap[action]) { const [skill,label]=studyMap[action]; player.skills[skill]=clamp(player.skills[skill]+1,0,10); player.stress=clamp(player.stress+3,0,100); dayLog.push({type:'player',text:`<strong>플레이어 행동 · ${label} 공부</strong><br>당장 관계를 넓히는 대신, 앞으로 필요한 ${label} 능력을 준비했다. <span class="muted">(${label} +1, 스트레스 +3)</span>`}); }
  if(action==='ask') { const bonus=target.id===mentor.id?2:0; target.playerTrust+=5+bonus; const closeGain=addPlayerCloseness(run,target,2,'personal',dayLog,'업무 질문'); player.insight+=1; dayLog.push({type:'player',text:`<strong>플레이어 행동 · ${targetName}에게 업무 질문</strong><br>${targetName}의 방식을 배우며 도움을 요청했다. <span class="muted">(${targetName} 업무 신뢰 +${5+bonus}, 친밀도 +${closeGain}, 정보 +1)</span>`}); }
  if(action==='help') { target.playerTrust+=7; const closeGain=addPlayerCloseness(run,target,2,'personal',dayLog,'업무 지원'); player.stress=clamp(player.stress+3,0,100); dayLog.push({type:'player',text:`<strong>플레이어 행동 · ${targetName}의 업무 지원</strong><br>자신의 시간을 써서 ${targetName}의 막힌 일을 도왔다. <span class="muted">(${targetName} 신뢰 +7, 친밀도 +${closeGain}, 스트레스 +3)</span>`}); }
  if(action==='talk') { const closeGain=addPlayerCloseness(run,target,5,'talk',dayLog,'스몰토크'); player.insight+=1; dayLog.push({type:'player',text:`<strong>플레이어 행동 · ${targetName}과 스몰토크</strong><br>가벼운 대화로 상대의 관심사와 기분을 살폈다. <span class="muted">(${targetName} 친밀도 +${closeGain}, 정보 +1)</span>`}); }
  if(action==='lunch') { const closeGain=addPlayerCloseness(run,target,7,'lunch',dayLog,'점심을 함께 먹은 일'); target.playerTrust+=1; player.stress=clamp(player.stress-2,0,100); dayLog.push({type:'player',text:`<strong>플레이어 행동 · ${targetName}에게 점심 제안</strong><br>함께 식사하며 사적인 이야기를 나눴다. <span class="muted">(${targetName} 친밀도 +${closeGain}, 스트레스 -2)</span>`}); }
  if(action==='gift') { const closeGain=addPlayerCloseness(run,target,6,'gift',dayLog,'작은 선물'); target.playerTrust+=2; dayLog.push({type:'player',text:`<strong>플레이어 행동 · ${targetName}에게 작은 선물</strong><br>상대에게 필요한 작은 물건을 챙겨 주었다. <span class="muted">(${targetName} 친밀도 +${closeGain}, 신뢰 +2)</span>`}); }
  if(action==='observe') { gainKnowledge(run,target,`${targetName}의 업무·관계 행동을 관찰함`); gainKnowledge(run,target,`${targetName}의 주변 반응을 기록함`); dayLog.push({type:'player',text:`<strong>플레이어 행동 · ${targetName} 관찰</strong><br>개입하지 않고 행동과 주변 반응을 기록했다. <span class="muted">(프로필 단서 2개)</span>`}); }
  player.impacts.unshift({day:run.day,kind:'action',text:`${targetName}에게 ${({study_work:'실무 공부',study_plan:'기획 공부',study_talk:'화술 연습',study_sense:'눈치 관찰',ask:'업무 질문',help:'업무 도움',talk:'스몰토크',lunch:'점심 제안',gift:'작은 선물',observe:'관찰'}[action])}함`});
  run.queuedAction=null;
}

function relationshipStage(e) { if(e.tension>=58) return '적대적 긴장'; if(e.competition>=48&&e.trust>=12) return '인정하는 라이벌'; if(e.competition>=40) return '경쟁 관계'; if(e.trust>=48&&e.affection>=42) return '가까운 동맹'; if(e.affection>=32&&e.trust>=24) return '믿을 만한 동료'; if(e.affection>=20) return '친숙한 동료'; return '업무상 동료'; }
function snapshotRelations(run) { const before={}; Object.values(run.relations).forEach(e=>before[e.a+'|'+e.b]={stage:relationshipStage(e),trust:e.trust,affection:e.affection,tension:e.tension,competition:e.competition}); return before; }
function scanTransitions(run, before, dayLog) { Object.values(run.relations).forEach(e=>{const previous=before[e.a+'|'+e.b]?.stage; const next=relationshipStage(e); if(previous&&previous!==next){const a=run.npcs.find(n=>n.id===e.a),b=run.npcs.find(n=>n.id===e.b); dayLog.push({type:'event',label:'관계변화',text:`<strong>${a.name} ↔ ${b.name}</strong><br>${previous}에서 <strong>${next}</strong>(으)로 변했다. <span class="muted">(${e.history.at(-1)||'누적된 행동'})</span>`});}}); }
function scanDailyRelationDeltas(run,before,dayLog) {
  const names={trust:'신뢰',affection:'친밀',tension:'긴장',competition:'경쟁'};
  const changes=Object.values(run.relations).map(e=>{const prev=before[e.a+'|'+e.b]; if(!prev) return null; const deltas=['trust','affection','tension','competition'].map(k=>({key:k,value:e[k]-prev[k]})).filter(d=>d.value); const score=deltas.reduce((sum,d)=>sum+Math.abs(d.value),0); return {e,deltas,score};}).filter(Boolean).filter(x=>x.score>=5).sort((a,b)=>b.score-a.score).slice(0,3);
  if(!changes.length) return;
  const lines=changes.map(x=>{const a=run.npcs.find(n=>n.id===x.e.a),b=run.npcs.find(n=>n.id===x.e.b); const deltaText=x.deltas.map(d=>`${names[d.key]} ${d.value>0?'+':''}${d.value}`).join(' · '); return `${a.name} ↔ ${b.name}: ${deltaText} <span class="muted">(${x.e.history.at(-1)||'누적된 상호작용'})</span>`;});
  dayLog.push({type:'event',label:'일일 관계변화',text:`<strong>오늘 크게 흔들린 관계</strong><br>${lines.join('<br>')}`});
}
function addDailyKeySummary(run,before,dayLog) {
  const names={trust:'신뢰',affection:'친밀',tension:'긴장',competition:'경쟁'};
  const summaryPriority=['필수·회사','필수·사적','회사랜덤·갈등','회사랜덤','회사','사수','평가','개인·연애','개인','개인랜덤','휴식'];
  const summaryCandidates=dayLog.filter(x=>summaryPriority.includes(x.label));
  const mainEvent=summaryCandidates.sort((a,b)=>summaryPriority.indexOf(a.label)-summaryPriority.indexOf(b.label))[0];
  const top=Object.values(run.relations).map(e=>{const prev=before[e.a+'|'+e.b]; if(!prev) return null; const deltas=['trust','affection','tension','competition'].map(k=>({key:k,value:e[k]-prev[k]})).filter(d=>d.value); const score=deltas.reduce((sum,d)=>sum+Math.abs(d.value),0); return {e,deltas,score};}).filter(Boolean).sort((a,b)=>b.score-a.score)[0];
  if(!mainEvent&&!top?.score) return;
  const eventTitle=mainEvent?mainEvent.text.replace(/<br\s*\/?>/g,'\n').replace(/<[^>]+>/g,'').split('\n')[0].slice(0,34):'평범한 하루';
  let relationText='큰 관계 변화는 없었다.';
  if(top&&top.score>=4){ const a=run.npcs.find(n=>n.id===top.e.a),b=run.npcs.find(n=>n.id===top.e.b); const deltaText=top.deltas.map(d=>`${names[d.key]} ${d.value>0?'+':''}${d.value}`).join(' · '); relationText=`${a.name} ↔ ${b.name}: ${deltaText}`; }
  const outcome=run.player.outcomes.failure>run.player.outcomes.success?'실패의 부담이 더 컸다.':run.player.outcomes.success?'성과가 조금씩 쌓였다.':'아직 뚜렷한 성과는 없다.';
  dayLog.push({type:'event',label:'오늘요약',text:`<strong>${eventTitle}</strong><br>${relationText}<br><span class="muted">${outcome}</span>`});
}
function simulateDay(run) {
  if(!run.firstConnection || run.day>=30 || run.pendingEvent) return;
  const before=snapshotRelations(run);
  run.day++; const pressure=pick(run.rng,PRESSURES); const dayLog=[]; const mood=teamAtmosphere(run); dayLog.push({type:'title', text:`D${run.day} · ${companyPhase(run.day)} · 오늘의 압박: ${pressure}`});
  if(mood.id!=='steady'&&((['cold','faction'].includes(mood.id)&&run.rng()<.45)||run.rng()<.18)) dayLog.push({type:'team',text:`<strong>오늘의 팀 공기 · ${mood.label}</strong><br>${mood.reason} <span class="muted">(업무 난도 ${mood.penalty>=0?'+':''}${mood.penalty}, 개인 사건 난도 ${mood.personalPenalty>=0?'+':''}${mood.personalPenalty})</span>`});
  shuffle(run.rng,run.npcs).slice(0,2).forEach(actor => applyAction(run,actor,chooseAction(run,actor,mood),pressure,dayLog,mood));
  applyTeamDailyRipple(run,mood,dayLog);
  personalRandomEvent(run,dayLog);
  applyDispositionGrowth(run,dayLog);
  applyOfficeBuddyMoment(run,dayLog);
  const candidates=eligibleEvents(run,pressure); if(candidates.length){ const urgent=candidates.filter(e=>e.required&&run.day>=e.deadline-1); const heartbreak=candidates.find(e=>e.id==='heartbreak'); const companyRandom=candidates.filter(e=>e.companyRandom); const personal=candidates.filter(e=>['personal','rest'].includes(e.kind)&&!e.required); const pool=urgent.length?urgent:candidates; const roll=run.rng(); const selected=!urgent.length&&heartbreak&&roll<.28?heartbreak:!urgent.length&&personal.length&&roll<.58?pick(run.rng,personal):!urgent.length&&companyRandom.length&&roll<.82?pick(run.rng,companyRandom):pick(run.rng,pool); if(selected.required){ run.pendingEvent={event:selected,dayLog,before}; render(); return; } const automatic=autoEventChoice(run,selected); resolveEvent(run,selected,dayLog,automatic); }
  scanTransitions(run,before,dayLog); addDailyKeySummary(run,before,dayLog); scanDailyRelationDeltas(run,before,dayLog); run.logs.unshift(dayLog); render();
}
function resolvePendingEvent(choiceId) { const run=state.run; if(!run?.pendingEvent) return; const pending=run.pendingEvent; const choice=eventOptions(pending.event).find(o=>o.id===choiceId); resolveEvent(run,pending.event,pending.dayLog,choice); scanTransitions(run,pending.before,pending.dayLog); addDailyKeySummary(run,pending.before,pending.dayLog); scanDailyRelationDeltas(run,pending.before,pending.dayLog); run.logs.unshift(pending.dayLog); run.lastChoiceDay=run.day; run.pendingEvent=null; if(run.autoMode) advanceAutomatically(run); else render(); }
function advanceAutomatically(run) { while(run.day<30&&!run.pendingEvent) simulateDay(run); render(); }
function companyPhase(day) { return day<=5?'1막 · 온보딩':day<=13?'2막 · 적응과 협업':day<=22?'3막 · 공개 검증': '4막 · 평가와 결산'; }
function relationLabel(e) { return relationshipStage(e); }
function timelineTime(item,index) {
  if(item.label==='일일 관계변화') return '18:40';
  if(item.label==='오늘요약') return '18:30';
  if(item.label==='관계변화') return '18:20';
  if(item.label==='휴식') return '19:10';
  const slots=['09:10','09:40','10:20','11:00','11:40','13:20','14:00','14:50','15:40','16:30','17:20','18:00'];
  return slots[Math.min(index,slots.length-1)];
}
function render() {
  const run=state.run; const $=id=>document.getElementById(id); if(!run) return;
  const atmosphere=teamAtmosphere(run); const forecast=nextCompanyForecast(run); const workEffect=`업무 난도 ${atmosphere.penalty>=0?'+':''}${atmosphere.penalty}`; const personalEffect=`개인 난도 ${atmosphere.personalPenalty>=0?'+':''}${atmosphere.personalPenalty}`; const affinitySummary=run.npcs.filter(n=>n.affinityHook).map(n=>`${n.affinityHook.label}: ${n.name}`).join(' · '); $('runSetup').innerHTML=`<div class="setup-grid"><div class="setup-stat"><span>회차 시드</span><strong>${run.seed}</strong></div><div class="setup-stat"><span>이번 팀장</span><strong>${run.npcs.find(n=>n.id===run.leaderId).name}</strong></div><div class="setup-stat"><span>팀 분위기</span><strong>${atmosphere.label} · ${workEffect}</strong><span>${personalEffect} · ${atmosphere.reason}</span></div><div class="setup-stat"><span>플레이어 능력</span><strong>실무 ${run.player.skills.work} · 기획 ${run.player.skills.plan}</strong><span>화술 ${run.player.skills.talk} · 눈치 ${run.player.skills.sense} · 정보 ${run.player.insight}</span></div><div class="setup-stat"><span>이번 회차 호감 버프</span><strong>${affinitySummary}</strong><span>해당 인물은 특정 접점에서 친밀도가 더 오른다.</span></div></div>${forecast?`<div class="forecast-alert"><strong>예고 · D${forecast.day} ${forecast.title}</strong><span>중요할 것 같은 능력: ${forecast.req.map(skillName).join(' · ')}. ${forecast.hint}</span></div>`:''}`;
  $('dayTitle').textContent=run.day?`${run.day}일차까지 진행됨`:'첫 인맥을 선택해 주세요'; $('dayBadge').textContent=`D${run.day}`;
  const leader=run.npcs.find(n=>n.id===run.leaderId), mentor=run.npcs.find(n=>n.id===run.mentorId);
  $('authorityPanel').innerHTML=`<div class="authority-card"><strong>팀장 · ${leader.name}</strong><br><span class="muted">${leader.traits.join(' · ')} / ${leader.hook}</span></div><div class="authority-card"><strong>사수 · ${mentor.name}</strong><br><span class="muted">${mentor.mentor} / ${mentor.hook}</span></div>`;
  const impacts=run.player.impacts; $('playerImpactPanel').innerHTML=impacts.length?`<div class="authority-card"><strong>누적 직접 영향 ${impacts.filter(i=>i.kind==='action').length}회 · 사건 성공 ${run.player.outcomes.success}회</strong><br><span class="muted">최근: D${impacts[0].day} · ${impacts[0].text}</span></div>${impacts.slice(1,3).map(i=>`<div class="authority-card"><span class="muted">D${i.day} · ${i.text}</span></div>`).join('')}`:'직접 개입하거나 사건을 겪으면, 누구에게 어떤 영향을 남겼는지 여기에 쌓입니다.';
  const core=run.npcs.filter(n=>n.kind==='핵심'); $('connectionCards').innerHTML=core.map(n=>`<button class="connection-card ${run.firstConnection===n.id?'active':''}" data-connection="${n.id}" ${run.day?'disabled':''}><strong>${n.name} · ${n.rank}</strong><span class="tagline">${n.traits.join(' · ')} · ${n.desire}</span></button>`).join('');
  document.querySelectorAll('[data-connection]').forEach(btn=>btn.onclick=()=>{run.firstConnection=btn.dataset.connection; run.npcs.find(n=>n.id===run.firstConnection).playerTrust=8; updateDisposition(run); document.getElementById('nextDayButton').disabled=false; document.getElementById('autoRunButton').disabled=false; document.getElementById('resetRunButton').disabled=false; render();});
  const tendency=updateDisposition(run); $('tendencyTitle').textContent=`현재 성향: ${tendency.name}`; $('tendencyHint').textContent=tendency.hint;
  const pendingPanel=$('pendingEventPanel'); if(run.pendingEvent){ const pending=run.pendingEvent; const category=pending.event.required?'필수 회사 이벤트':pending.event.kind==='rest'?'휴식 이벤트':['personal','rumor'].includes(pending.event.kind)?'개인 이벤트':'회사 이벤트'; const req=eventRequirements(pending.event).map(skillName).join(' · '); pendingPanel.hidden=false; pendingPanel.innerHTML=`<p class="eyebrow">자동 진행 일시정지 · ${category}</p><h2>${pending.event.title}</h2><p class="event-copy">${pending.event.text}<br><strong>예상 필요 능력: ${req}</strong> · 업무 신뢰가 높은 전문 동료가 있으면 지원 가능</p><div class="event-options">${eventOptions(pending.event).map(o=>`<button data-event-choice="${o.id}"><strong>${o.label}</strong><small>${o.hint}</small></button>`).join('')}</div>`; document.querySelectorAll('[data-event-choice]').forEach(btn=>btn.onclick=()=>resolvePendingEvent(btn.datasetChoice||btn.dataset.eventChoice)); } else { pendingPanel.hidden=true; pendingPanel.innerHTML=''; }
  $('nextDayButton').disabled=!run.firstConnection||!!run.pendingEvent||run.day>=30; $('autoRunButton').disabled=!run.firstConnection||!!run.pendingEvent||run.day>=30;
  $('roster').innerHTML=run.npcs.slice().sort((a,b)=>a.rank.localeCompare(b.rank)).map(n=>`<div class="roster-item"><div><div class="rank">${n.rank}</div><div class="role">${n.job}</div></div><div><strong>${n.name}</strong><div class="role">${n.mbti} · ${n.enneagram} · 업무몰입 ${'●'.repeat(n.focus)}${n.affinityHook?` · 호감버프 ${n.affinityHook.label}`:''}</div></div><span class="traits">${n.affinityHook?n.affinityHook.label:n.traits[0]}</span></div>`).join('');
  const important=Object.values(run.relations).sort((a,b)=>(b.tension+b.competition+b.affection+b.trust)-(a.tension+a.competition+a.affection+a.trust)).slice(0,8); $('relationshipList').innerHTML=important.map(e=>{const a=run.npcs.find(n=>n.id===e.a),b=run.npcs.find(n=>n.id===e.b); const tone=e.tension>=45?'hot':e.affection>=30?'warm':''; return `<div class="relation ${tone}"><div class="relation-name">${a.name} ↔ ${b.name} · ${relationLabel(e)}</div><div class="relation-numbers">신뢰 ${e.trust} · 친밀 ${e.affection} · 긴장 ${e.tension} · 경쟁 ${e.competition}</div></div>`;}).join('');
  $('profilePanel').innerHTML=run.npcs.map(n=>{const k=run.player.knowledge[n.id]; const status=k.evidence>=6?'이해':k.evidence>=3?'추정':k.evidence>=1?'관찰':'첫인상'; const privacy=k.evidence>=4?`<br>공과사: ${({open:'열려 있음',private:'사적 표현 조심',strict:'구분 확실'})[n.boundary]} · 연애상태: ${({single:'비어 있음',unknown:'알 수 없음',partner:'만나는 사람 있음'})[n.availability]}`:''; const ideal=k.evidence>=6?`<br>이상형: ${n.idealText}`:''; const affinity=n.affinityHook?`<br>회차 버프: ${n.affinityHook.label} — ${n.affinityHook.desc}`:''; const detail=k.evidence>=6?`욕망: ${n.desire}<br>상처: ${n.wound}${privacy}${ideal}${affinity}`:k.evidence>=3?`성향: ${n.traits.join(' · ')}<br>단서 ${k.evidence}개${privacy}${affinity}`:k.evidence>=1?`최근 단서: ${k.notes.at(-1)}${affinity}`:`직무·직급만 알려져 있다.${affinity}`; return `<div class="profile-card"><strong>${n.name}</strong><span class="profile-status">${status}</span><div class="profile-detail">${detail}</div></div>`;}).join('');
  $('eventLog').innerHTML=run.logs.length?run.logs.slice().reverse().map(day=>`<div class="log-day">${day.map((x,i)=>x.type==='title'?`<div class="log-title">${x.text}</div>`:`<div class="log-item ${x.type}"><span class="log-time">${timelineTime(x,i)}</span><span class="log-label">${logLabel(x)}</span><div class="log-copy">${x.text}</div></div>`).join('')}</div>`).join(''):'첫 인맥을 고르면 1일차부터 회사를 진행할 수 있습니다.';
  const panel=$('summaryPanel'); if(run.day===30){ const ending=resolveEnding(run); const {closest,support}=ending; const changes=majorRelationChanges(run); panel.hidden=false; panel.innerHTML=`<p class="eyebrow">30일 조합 결산</p><h2>커리어·개인관계·연애·화제가 함께 이번 회차를 만듭니다</h2><div class="summary-grid"><div class="summary-card"><span>커리어</span><strong>${ending.career.title}</strong><div class="muted">${ending.career.body}</div></div><div class="summary-card"><span>개인관계</span><strong>${ending.personal.title}</strong><div class="muted">${ending.personal.body}</div></div><div class="summary-card"><span>연애·화제</span><strong>${ending.romance.title}</strong><div class="muted">${ending.romance.body}</div></div></div><div class="summary-grid"><div class="summary-card"><span>가장 가까운 동료</span><strong>${closest.slice(0,3).map(n=>n.name).join(', ')}</strong><div class="muted">${support.name?`${support.name} → ${support.stat} 지원 +${support.value}`:'가까워도 업무 신뢰가 낮으면 사건 지원은 불가'}</div></div><div class="summary-card"><span>플레이어 능력</span><strong>실무 ${run.player.skills.work} · 기획 ${run.player.skills.plan} · 화술 ${run.player.skills.talk} · 눈치 ${run.player.skills.sense}</strong><div class="muted">성공 ${run.player.outcomes.success} / 실패 ${run.player.outcomes.failure}</div></div><div class="summary-card"><span>플레이어가 남긴 영향</span><strong>직접 개입 ${impacts.filter(i=>i.kind==='action'||i.kind==='choice').length}회</strong><div class="muted">${support.name?`${support.name}와 업무 신뢰를 쌓아 ${support.stat} 지원을 얻음`:'전문 동료에게 업무 질문·도움을 주어 업무 신뢰를 쌓을 수 있음'}</div></div></div><div class="divider"></div><p class="eyebrow">중요 관계 변화</p>${changes.length?changes.map(c=>`<div class="relation ${c.to.includes('긴장')?'hot':'warm'}"><div class="relation-name">${c.a.name} ↔ ${c.b.name}: ${c.from} → ${c.to}</div><div class="relation-numbers">변화량 ${c.delta} · 마지막 계기: ${c.history||'누적된 상호작용'}</div></div>`).join(''):'<p class="muted">이번 회차에는 큰 관계 전환이 없었습니다.</p>'}`;} else panel.hidden=true;
}

function start(seed) { state.run=createRun(seed); document.getElementById('nextDayButton').disabled=true; document.getElementById('autoRunButton').disabled=true; document.getElementById('resetRunButton').disabled=true; render(); }
document.getElementById('newRunButton').onclick=()=>{ const seed=Math.floor(Math.random()*900000)+1000; document.getElementById('seedInput').value=seed; start(seed); };
document.getElementById('replayButton').onclick=()=>start(Number(document.getElementById('seedInput').value)||1001);
document.getElementById('resetRunButton').onclick=()=>start(state.run.seed);
document.getElementById('nextDayButton').onclick=()=>simulateDay(state.run);
document.getElementById('autoRunButton').onclick=()=>{ state.run.autoMode=true; advanceAutomatically(state.run); };
start(1001);
