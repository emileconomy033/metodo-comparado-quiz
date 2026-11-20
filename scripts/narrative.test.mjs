import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/?room=ABC123',pretendToBeVisual:true});
const w=dom.window,d=w.document;await new Promise(r=>setTimeout(r,300));
w.firebase={firestore:{FieldValue:{serverTimestamp:()=>'TS'}}};w.confirm=()=>true;w.alert=()=>{};
const ev=s=>w.eval(s);

// 1) Cada explicación «Desambigüemos» queda asociada a SU alternativa aunque se reordenen
ev('activateQuizVersion(3)');
const probe=ev(`QUIZ.map((q,i)=>({a:q.a,c:q.correct,dis:PEDAGOGY[i].dis,key:PEDAGOGY[i].key,recall:PEDAGOGY[i].recall,closing:PEDAGOGY[i].closing,strengthen:PEDAGOGY[i].strengthen}))`);
probe.forEach((p,i)=>{
  assert.equal(p.dis.length,4);assert.equal(p.dis[p.c],null,'la correcta no lleva desambiguación (P'+(i+1)+')');
  p.dis.forEach((t,j)=>{if(j!==p.c)assert(typeof t==='string'&&t.startsWith('Desambigüemos'),'dis P'+(i+1)+'/'+j)});
  assert(p.key&&p.recall&&p.closing&&p.strengthen,'campos teóricos P'+(i+1));
  assert(/Sartori \(1999|Sartori, 1999|\(1999, p/.test(p.recall+p.dis.join(' ')),'cita con página P'+(i+1));
});
const idx=(i,frag)=>probe[i].a.findIndex(t=>t.includes(frag));
assert(probe[0].dis[idx(0,'idénticos')].includes('idéntico'));
assert(probe[0].dis[idx(0,'mismo país')].includes('país'));
assert(probe[1].dis[idx(1,'garantiza equivalencia')].includes('perro-gato'));
assert(probe[2].dis[idx(2,'aumentar los casos')].includes('más casos'));
assert(probe[3].dis[idx(3,'doble')].includes('40/20'),'P4 razón 40/20 en su alternativa');
assert(probe[3].dis[idx(3,'ambos están medidos en minutos')].includes('unidad'));

// 2) Análisis narrativo del moderador
ev(`isHost=true;uid='o';roomId='NAR001';room={owner:'o',status:'live',mode:'competition',quizVersion:3,idx:3,reveal:true,revealStage:3,publicView:'questions',questionTimes:[40,40,40,40]};
people=[{uid:'a',name:'A',ready:true},{uid:'b',name:'B',ready:true},{uid:'c',name:'C',ready:true}];
votes=Array.from({length:N},()=>[]);votes[3]=[{uid:'a',choice:3},{uid:'b',choice:0},{uid:'c',choice:0}];
votes[1]=[{uid:'a',choice:1},{uid:'b',choice:1},{uid:'c',choice:1}];
loadedPeople=true;loadedVotes=new Set([0,1,2,3]);activeTab=3;hostReadingView='notes';rref=()=>({update:async c=>{globalThis.__w=c}});render()`);
const analysis=d.getElementById('hostChart');
const at=analysis.textContent;
for(const s of ['Análisis de la pregunta 4','Recordemos lo que dice la teoría','se inclinó hacia la alternativa A','66.7 % eligió la alternativa A','Desambigüemos','Para fortalecer','Sartori (1999, pp. 36-38)'])
  assert(at.includes(s),'análisis narrativo: falta «'+s+'»');
assert(analysis.querySelectorAll('mark.hl').length>=4,'ideas resaltadas');

// 3) Síntesis con ideas fuerza + cierre
const syn=d.getElementById('finalLearning'),st=syn.textContent;
for(const s of ['Ideas fuerza de la sesión','Idea para recordar','Hacia dónde falló el grupo','Conclusión de la sesión','Tres ideas para llevarnos','comparable, ¿en qué aspecto?','Panebianco (1999)','por reforzar'])
  assert(st.includes(s),'síntesis: falta «'+s+'»');
assert(syn.querySelectorAll('mark.hl').length>=8,'ideas fuerza resaltadas en la síntesis');

// 4) Cierre en la pantalla pública
ev(`room.status='done';projecting=true;renderProjection()`);
const pub=d.getElementById('projectChart').textContent;
assert(pub.includes('Conclusión de la sesión')&&pub.includes('Ideas fuerza')&&pub.includes('Amplio acuerdo del grupo'),'cierre público');
assert(!pub.includes('Desambigüemos')&&!pub.includes('Tres ideas para llevarnos')&&!pub.includes('Panebianco'),'la pantalla pública debe ser una versión reducida');
ev('projecting=false');

// 5) Cierre personal
ev(`isHost=false;uid='a';roomId='NAR001';myRegistration={name:'A',ready:true};room.status='done';render()`);
const personal=d.getElementById('ranking').textContent;
assert(personal.includes('Gracias por participar')&&!personal.includes('Sartori')&&!personal.includes('Para llevarte'),'el participante no ve teoría al cerrar');

// 6) Sonidos: osciladores creados al jugar y silencio al apagar
let osc=0;
w.AudioContext=function(){this.state='running';this.currentTime=0;this.destination={};this.resume=()=>Promise.resolve();
  this.createOscillator=()=>({type:'',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){osc++},stop(){}});
  this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}})};
for(const n of ['select','ready','start','next','correct','wrong','timeup','tick','reveal','achievement','finish']){const before=osc;ev(`SFX.play('${n}')`);assert(osc>before,'sonido «'+n+'» no genera audio');}
const beforeOnce=osc;ev(`SFX.once('k1','correct');SFX.once('k1','correct')`);assert(osc>beforeOnce,'once suena una vez');const afterOnce=osc;ev(`SFX.once('k1','correct')`);assert.equal(osc,afterOnce,'once no repite');
assert(!d.getElementById('soundToggle')&&!html.includes('sound-toggle'),'no debe haber botón de sonido');

// 7) Revelación personal: cita + sonido de acierto/desacierto
ev(`room.status='live';room.idx=3;room.reveal=true;room.revealStage=3;uid='a';votes[3]=[{uid:'a',choice:0}];drawPersonalReveal()`);
const pr=d.getElementById('personalReveal').textContent;
assert(!pr.includes('Recordemos')&&!pr.includes('Desambigüemos')&&!pr.includes('Principio metodológico')&&!pr.includes('Sartori'),'el participante no ve teoría');
assert(pr.includes('Respuesta correcta'),'el participante ve su resultado');

// 7b) Selección instantánea: la opción tocada se marca antes de que Firebase confirme
ev(`room={owner:'z',status:'live',mode:'competition',quizVersion:3,idx:0,reveal:false,revealStage:0,publicView:'questions',questionTimes:[40,40,40,40],openedAt:{toMillis:()=>Date.now()}};
isHost=false;uid='p1';roomId='SEL001';votes=Array.from({length:N},()=>[]);localChoice.clear();wantedChoice.clear();
globalThis.__sets=[];voteRef=()=>({set:(v)=>new Promise(r=>setTimeout(()=>{globalThis.__sets.push(v.choice);r()},80))});renderParticipant()`);
const btn=j=>d.querySelectorAll('#compChoices button')[j];
btn(2).click();
assert(btn(2).classList.contains('selected'),'se marca al instante, sin esperar a Firebase');
btn(3).click();btn(1).click();
assert(btn(1).classList.contains('selected')&&!btn(2).classList.contains('selected'),'varios toques seguidos: gana el último');
assert.equal(d.querySelectorAll('#compChoices button:disabled').length,0,'los botones no se bloquean mientras se envía');
await new Promise(r=>setTimeout(r,400));
const sent=[...ev('globalThis.__sets')];
assert.equal(sent[sent.length-1],1,'al servidor llega la última elección: '+sent);

// 8) Tiempos: el panel muestra lo que Firestore aplica y se puede guardar
ev(`isHost=true;uid='o';roomId='TIM001';people=[];votes=Array.from({length:N},()=>[]);room={owner:'o',status:'lobby',mode:'competition',quizVersion:3,idx:-1,reveal:false,revealStage:0,publicView:'welcome',questionTimes:[25,30,45,60]};loadedPeople=true;loadedVotes=new Set([0,1,2,3]);globalThis.__w=null;rref=()=>({update:async c=>{globalThis.__w=c},collection:()=>({doc:()=>({delete:async()=>{}})})});render()`);
assert.deepEqual([0,1,2,3].map(k=>d.getElementById('roomTime'+k).value),['25','30','45','60'],'el panel debe mostrar los tiempos guardados en la sala');
assert.equal(d.getElementById('saveTimes').disabled,false);
assert.deepEqual([0,1,2,3].map(k=>ev(`questionSeconds(${k})`)),[25,30,45,60],'questionSeconds debe leer los tiempos de la sala');
d.getElementById('roomTime0').value='15';d.getElementById('roomTime0').dispatchEvent(new w.Event('input'));d.getElementById('roomTime3').value='90';
d.getElementById('saveTimes').click();await new Promise(r=>setTimeout(r,30));
assert.deepEqual([...ev('globalThis.__w.questionTimes')],[15,30,45,90],'se guardan los segundos editados');
ev(`globalThis.__w=null`);d.getElementById('roomTime1').value='5';d.getElementById('saveTimes').click();await new Promise(r=>setTimeout(r,30));
assert.equal(ev('globalThis.__w'),null,'no guarda tiempos fuera de 10-180');
ev(`room.status='live';render()`);assert.equal(d.getElementById('saveTimes').disabled,true,'no editable con la sala en curso');
assert(d.getElementById('timesNote').textContent.includes('P1 25 s'),'muestra tiempos vigentes');

// 9) Reglas: solo el propietario cambia questionTimes y solo en lobby
assert(rules.includes("'mode','publicView','questionTimes'"));
assert(rules.includes("hasAny(['questionTimes'])"));
assert(rules.includes("owner(id) && resource.data.status == 'lobby' && request.resource.data.status == 'lobby'"));
console.log('NARRATIVE OK');process.exit(0);
