import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script, runInNewContext} from 'node:vm';

const html=readFileSync('index.html','utf8');
const rules=readFileSync('firestore.rules','utf8');
const config=readFileSync('firebase-config.js','utf8');
const match=html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
assert(match,'Se requiere el JavaScript principal');
new Script(match[1],{filename:'index.html'});
new Script(config,{filename:'firebase-config.js'});
const source=match[1],start=source.indexOf('let QUIZ='),end=source.indexOf('const $=',start);
assert(start>=0&&end>start,'No se encontró el currículo versionado');
const curriculum=source.slice(start,end);
function loadVersion(version){
  const result=runInNewContext(curriculum+';activateQuizVersion('+version+');globalThis.out={QUIZ,PEDAGOGY,TRANSFER}',{});
  return result.out;
}
const original=loadVersion(1),legacy=loadVersion(2),current=loadVersion(3);
assert.equal(original.QUIZ.length,6,'Las salas históricas originales deben conservar seis preguntas');
assert.equal(legacy.QUIZ.length,6,'Las salas de versión dos deben conservar seis preguntas');
assert.equal(current.QUIZ.length,4,'Las nuevas salas deben tener exactamente cuatro preguntas');
assert.equal(current.PEDAGOGY.length,4);
assert.deepEqual(Array.from(current.QUIZ.map(q=>q.correct)),[0,1,2,3],'Las claves nuevas deben distribuirse A/B/C/D');
for(let i=0;i<4;i++){
  const q=current.QUIZ[i],p=current.PEDAGOGY[i];
  assert.equal(q.a.length,4);
  assert.equal(p.mis.length,4);
  assert(q.a.every(x=>x.length>20));
  assert(Math.max(...q.a.map(x=>x.length))-Math.min(...q.a.map(x=>x.length))<=24,'Sesgo de longitud en pregunta '+(i+1));
  assert(p.mis.every((x,j)=>j===q.correct||typeof x==='string'&&x.length>15));
  assert.equal(q.q,original.QUIZ[i].q,'No deben alterarse los enunciados de las cuatro preguntas');
}
assert(!html.includes('123Moderador'),'No incluir contraseñas en el repositorio');
for(const id of ['moderatorEmail','moderatorPassword','presenterEntry','presenterRoomCode','presenterInviteEmail','savePresenter','removePresenter','hostNotesView','hostPublicView','projection','resetOfficial','newOfficial','newPractice'])
 assert(html.includes('id="'+id+'"'),'Falta control '+id);
assert(source.includes('signInWithEmailAndPassword'));
assert(source.includes('function normalizeExplanation('));
assert(source.includes('Guion pedagógico del expositor'));
assert(source.includes("hostReadingView==='public'"));
assert(source.includes("const mistakes=q.a.map"));
assert(source.includes("sort((a,b)=>b.count-a.count"));
assert(source.includes('if(compact)'),'La vista pública debe ser abreviada');
assert(source.includes('function subscribe()'));
assert(source.includes("observedVersion!==room.quizVersion"),'Al cambiar la versión deben recrearse los listeners');
assert(source.includes('if(typed!==\'BORRAR\')return'),'Requerir borrado confirmado');
assert(source.includes('room.owner!==uid')&&source.includes('room.status!==\'done\''),'El borrado debe estar restringido al propietario y sala finalizada');
assert(source.includes("status:'lobby',idx:-1,reveal:false,revealStage:0,openedAt:null"),'Se requiere restablecer sala sin cambiar código');
assert(rules.includes('version == 3 && t.size() == 4'));
assert(rules.includes('request.resource.data.quizVersion in [2,3]'));
assert(rules.includes("resource.data.get('quizVersion',1) == 3 ? 4 : 6"));
assert(rules.includes('function coPresenter(id)'));
assert(rules.includes("match /access/{key}"));
assert(rules.includes("allow delete: if owner(id) && parent(id).data.status == 'done'"));
assert(rules.includes("parent(id).data.get('revealStage',0) == 0"));
assert(!rules.includes('if true;'));
assert(html.includes('id="openAudienceWindow"'),'Falta abrir ventana pública independiente');
assert(source.includes("url.searchParams.set('view','projection')"),'No se abre la vista de público por separado');
assert(source.includes("get('view')==='projection'"),'La pantalla pública no recupera su estado');
assert(source.includes('function refreshPresenterInvite()'),'Falta recuperar la invitación del segundo expositor');
assert(source.includes("if(room?.status==='live'"),'Advertencia de salida durante sesiones abiertas');
assert(source.includes('const difficult=[...meaningful]'),'El cierre público debe ser breve y descriptivo');
assert(source.includes('function normalizeExplanation(text)'),'Debe mejorar la lectura de distractores');
assert(html.includes('Aciertos: 0/4'),'La puntuación inicial debe mostrar cuatro preguntas');
console.log('OK: cuatro preguntas, historial intacto, roles seguros, doble pantalla, síntesis y borrado controlado.');
