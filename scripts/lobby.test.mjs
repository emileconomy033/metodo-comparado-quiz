import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/?room=ABC123',pretendToBeVisual:true});
const w=dom.window;await new Promise(r=>setTimeout(r,300));
w.firebase={firestore:{FieldValue:{serverTimestamp:()=>'TS'}}};let written=null;w.confirm=()=>true;w.alert=()=>{};
w.eval(`activateQuizVersion(3);isHost=true;uid='o';roomId='ABC123';room={owner:'o',status:'lobby',mode:'competition',quizVersion:3,idx:-1,reveal:false,revealStage:0,publicView:'welcome',questionTimes:[40,40,40,40]};
people=[{uid:'a',name:'Ana',ready:true},{uid:'b',name:'ana',ready:false},{uid:'c',name:'Luis',ready:true}];loadedPeople=true;loadedVotes=new Set([0,1,2,3]);
globalThis.__written=null;rref=()=>({update:async c=>{globalThis.__written=c},collection:()=>({doc:id=>({delete:async()=>{globalThis.__deleted=id}})})});render();`);
const d=w.document;
assert.equal(d.getElementById('start').disabled,true,'start strict disabled');
assert.equal(d.getElementById('startAnyway').classList.contains('hidden'),false,'startAnyway visible');
assert.equal(d.getElementById('startAnyway').disabled,false);
const chips=[...d.querySelectorAll('#attendanceNames span')].map(s=>s.textContent);console.log(chips);
assert(chips.filter(c=>c.includes('posible duplicado')).length===2);
assert(d.querySelectorAll('#attendanceNames button').length===3,'Quitar buttons');
assert(!d.getElementById('resetOfficial').classList.contains('hidden'),'reset visible in lobby');
console.log('guide:',d.getElementById('stageGuide').textContent);
d.getElementById('startAnyway').click();await new Promise(r=>setTimeout(r,50));
const wr=w.eval('globalThis.__written');console.log(wr&&Object.keys(wr),wr?.status,wr?.publicView);assert.equal(wr.status,'live');assert.equal(wr.publicView,'questions');
// remove participant
d.querySelector('#attendanceNames button').click();await new Promise(r=>setTimeout(r,50));console.log('deleted uid:',w.eval('globalThis.__deleted'));
// all ready -> strict start enabled, override hidden
w.eval(`room.status='lobby';people.forEach(p=>p.ready=true);globalThis.__written=null;render()`);
assert.equal(d.getElementById('start').disabled,false);assert(d.getElementById('startAnyway').classList.contains('hidden'));
d.getElementById('start').click();await new Promise(r=>setTimeout(r,50));assert.equal(w.eval('globalThis.__written').status,'live');
// participant not owner sees no Quitar
w.eval(`room.status='lobby';uid='x';render()`);assert.equal(d.querySelectorAll('#attendanceNames button').length,0);
// sala finalizada: la pantalla pública no debe aparentar sala de espera con QR
w.eval("uid='o';room.status='done';room.publicView='welcome';projecting=true;renderProjection()");
assert(d.getElementById('projectChart').textContent.includes('La sala está cerrada'),'pública cerrada');
assert(d.getElementById('projectStage').textContent==='Sala cerrada');
console.log('JSDOM OK');process.exit(0);
