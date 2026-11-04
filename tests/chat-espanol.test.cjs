'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const core=require('../js/chat-espanol-core.js'),data=require('../js/chat-espanol-data.js');
const dir=path.join(__dirname,'..');
test('conserva negación, cifras, nombres, tiempos y condicionales',()=>{
  for(const text of ['No quiero comprar leche.','Ayer fui al banco con Ana.','Mañana voy a Lima.','Si llueve, no iré.','Si puedo voy mañana.','Mi número es 12.50.','Yo medico a mis pacientes.','Yo numero las páginas.','Trabajo y estudio.','Ana, no iré.']){
    assert.equal(core.review(text,{model:'Sí, iré mañana.'}).improved,text);
  }
});
test('corrige detalles seguros sin imponer la frase modelo',()=>{
  assert.equal(core.review('tambien voy mañana',{model:'Ayer fui al mercado.'}).improved,'También voy mañana.');
  assert.equal(core.review('si',{prompt:'¿Quieres ayuda?'}).improved,'Sí.');
  assert.equal(core.review('Puedo ir?',{}).improved,'¿Puedo ir?');
  assert.equal(core.review('Quiero comprar pan.',{model:'¿Puedo comprar leche?'}).improved,'Quiero comprar pan.');
  assert.equal(core.review('No.',{prompt:'¿Quieres algo más?'}).unrecognized,false);
});
test('una respuesta no reconocida no se convierte en nota o sentencia de error',()=>{
  const r=core.review('quizás',{prompt:'¿A qué hora llegas?',model:'A las cinco.',keywords:['hora']});
  assert.equal(r.unrecognized,true);assert.equal(r.improved,'Quizás.');assert.equal('score' in r,false);
});
test('respuestas alternativas siguen siendo del usuario',()=>{
  const r=core.review('No, prefiero otra fecha.',{prompt:'¿Puedes venir mañana?',model:'Sí, iré mañana.'});
  assert.equal(r.improved,'No, prefiero otra fecha.');
});
test('ramas respetan decisiones en compras, transporte, banco y entrevista',()=>{
  const s=id=>data.scenarios.find(s=>s.id===id);
  assert.equal(core.nextGuided(s('bodega-pan'),1,'No, gracias.').next,3);
  const mem={};core.nextGuided(s('bus-centro'),2,'Más adelante.',mem);assert.equal(mem.busStop,'farther');
  assert.equal(core.nextGuided(s('bus-centro'),5,'No, gracias.',mem).next,s('bus-centro').turns.length);
  assert.equal(core.nextGuided(s('banco-dni'),3,'No.').next,5);
  assert.equal(core.nextGuided(s('entrevista-trabajo'),6,'No, gracias.').next,8);
  assert.equal(core.nextGuided(s('viaje-terminal'),8,'No.').next,10);
  assert.equal(core.nextGuided(s('reniec-dni'),2,'Sí, ya pagué.').next,4);
});
test('25 situaciones completas, únicas y recorridos terminan',()=>{
  assert.equal(data.scenarios.length,25);assert.equal(new Set(data.scenarios.map(s=>s.id)).size,25);
  for(const s of data.scenarios){
    assert.ok(s.goal&&s.closing&&s.turns.length>=4);
    let index=0,steps=0,memory={};
    while(index<s.turns.length){const t=s.turns[index];assert.ok(t.prompt&&t.model&&t.why);const next=core.nextGuided(s,index,t.model,memory).next;assert.ok(next>index);index=next;assert.ok(++steps<20);}
  }
});
test('validación de IA acepta JSON y rechaza respuestas rotas o excesivas',()=>{
  assert.deepEqual(core.parseAI('```json\n{"reply":"¿A qué hora?","suggestion":"","explanation":"Puedes indicar una hora."}\n```'),{reply:'¿A qué hora?',suggestion:'',explanation:'Puedes indicar una hora.'});
  for(const value of ['no es json','{}','[]','null','{"reply":{},"suggestion":"","explanation":""}',JSON.stringify({reply:'x'.repeat(701),suggestion:'',explanation:''})])assert.throws(()=>core.parseAI(value));
  assert.equal(core.escapeHTML('<img onerror="alert(1)">'),'&lt;img onerror=&quot;alert(1)&quot;&gt;');
});
test('progreso valida niveles e IDs y descarta datos personales/otras propiedades',()=>{
  assert.deepEqual(core.safeProgress({completed:['casa-mama','casa-mama','<img>',{}],lastLevel:99,messages:['privado'],best:{x:100}},['casa-mama']),{completed:['casa-mama'],lastLevel:5});
  assert.equal(core.safeProgress({lastLevel:-1},[]).lastLevel,1);
});
// Minimal DOM: test actual orchestration and race guards without network or a browser.
function harness(){
  const els=new Map(),saved=[];
  class Element{
    constructor(id=''){this.id=id;this.style={};this.dataset={};this.events={};this.children=[];this.value='';this.disabled=false;this.checked=false;this.isConnected=true;this.scrollHeight=200;this.attributes={};const set=new Set();this.classList={add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x),toggle:(x,on)=>on?set.add(x):set.delete(x)};}
    set innerHTML(v){this.html=v;this.children=[];const re=/<button\b([^>]*)>([\s\S]*?)<\/button>/g;let m;while((m=re.exec(v))){const b=new Element();b.textContent=m[2].replace(/<[^>]+>/g,'');b.tagName='BUTTON';b.className=(m[1].match(/class="([^"]*)"/)||[])[1]||'';for(const d of m[1].matchAll(/data-([\w-]+)="([^"]*)"/g))b.dataset[d[1]]=d[2];this.children.push(b);}}
    get innerHTML(){return this.html||'';}
    appendChild(e){this.children.push(e);return e;}setAttribute(k,v){this.attributes[k]=v;}removeAttribute(k){delete this.attributes[k];}
    addEventListener(e,f){this.events[e]=f;}querySelectorAll(selector){
      const all=this.children.flatMap(c=>[c,...c.querySelectorAll('*')]);
      if(selector==='*')return all;
      if(selector.startsWith('.'))return all.filter(c=>(c.className||'').split(' ').includes(selector.slice(1)));
      return all.filter(c=>c.tagName==='BUTTON');
    }
    querySelector(selector){return selector.startsWith('[data-level')?this.children.find(c=>selector.includes(c.dataset.level||'never'))||null:this.querySelectorAll(selector)[0]||null;}
    focus(){document.activeElement=this;}scrollTo(){}scrollIntoView(){}
  }
  function el(id){if(!els.has(id))els.set(id,new Element(id));return els.get(id);}
  const radios=[new Element('guided'),new Element('modeAI')];radios[0].value='guided';radios[0].checked=true;radios[1].value='ai';
  els.set('modeAI',radios[1]);
  const document={getElementById:el,createElement:()=>new Element(),body:new Element(),querySelectorAll:()=>radios,querySelector:()=>radios.find(r=>r.checked),addEventListener(){},activeElement:null};
  for(const id of ['screenChat','modal','busyStatus','reviewActions','wildcardPanel','btnStopAI'])el(id).classList.add('hidden');
  let aiReady=false,response=()=>Promise.resolve('{"reply":"Gracias. ¿Algo más?","suggestion":"","explanation":"Tu mensaje es breve."}');
  const ai={isReady:()=>aiReady,activate:async()=>{aiReady=true;},stop:()=>{aiReady=false;},reset:async()=>{},reply:(...args)=>response(...args)};
  const ctx={document,location:{href:''},window:null,LSPChatCore:core,LSPChatData:data,LSPChatLocal:ai,localStorage:{getItem:()=>null,setItem:(k,v)=>saved.push(JSON.parse(v))},requestAnimationFrame:f=>f(),setTimeout:()=>1,clearTimeout(){},matchMedia:()=>({matches:true}),addEventListener(){}};ctx.window=ctx;
  const source=fs.readFileSync(path.join(dir,'js/chat-espanol.js'),'utf8').replace('renderHome();\n})();','globalThis.testing={state,startScenario,sendMessage,rewrite,continueConversation,backHome,openHelp,renderScenarios,activateLocalAI,disableLocalAI,finishScenario,recommendedScenario,fillExample,cancelResponse};\nrenderHome();\n})();');
  vm.runInNewContext(source,ctx);
  return {app:ctx.testing,el,saved,setAI(value,fn){aiReady=value;if(fn)response=fn;radios[0].checked=!value;radios[1].checked=value;}};
}
test('envío, reintento y continuar solo cuentan una respuesta aceptada',async()=>{
  const {app,el}=harness();app.startScenario('casa-mama');el('messageInput').value='No, todavía no salí.';
  await app.sendMessage();assert.equal(app.state.turn,0);assert.ok(app.state.pending);assert.equal(el('messageInput').disabled,true);
  await app.sendMessage();assert.equal(app.state.attempts,1);
  app.rewrite();assert.equal(el('messageInput').value,'No, todavía no salí.');assert.equal(app.state.turn,0);
  el('messageInput').value='Todavía estoy en casa.';await app.sendMessage();app.continueConversation();
  assert.equal(app.state.turn,1);assert.equal(app.state.accepted,1);assert.equal(app.state.rewrites,1);assert.equal(el('messageInput').disabled,false);
  app.continueConversation();assert.equal(app.state.accepted,1);
});
test('ayuda rellena el editor y no envía ni penaliza',()=>{
  const {app,el}=harness();app.startScenario('casa-mama');app.openHelp();el('wildcardOptions').children[0].events.click();
  assert.ok(el('messageInput').value);assert.equal(app.state.pending,null);assert.equal(app.state.turn,0);assert.equal(app.state.attempts,0);
});
test('termina las 25 prácticas y solo persiste progreso',async()=>{
  for(const scenario of data.scenarios){const {app,el,saved}=harness();app.startScenario(scenario.id);
    for(let steps=0;app.state.turn<scenario.turns.length&&steps<20;steps++){
      el('messageInput').value=scenario.turns[app.state.turn].model;await app.sendMessage();app.continueConversation();
    }
    assert.ok(app.state.progress.completed.includes(scenario.id));assert.equal(el('modal').classList.contains('hidden'),false);
    assert.deepEqual(Object.keys(saved.at(-1)).sort(),['completed','lastLevel']);
    app.backHome();assert.equal(app.state.history.length,0);assert.equal(el('messages').innerHTML,'');
  }
});
test('IA valida salida, continúa diálogo y mantiene la conversación aceptada',async()=>{
  const {app,el,setAI}=harness();setAI(true);app.startScenario('casa-mama');el('messageInput').value='No, estoy en clase.';await app.sendMessage();
  assert.equal(app.state.mode,'ai');assert.equal(app.state.history.length,1);app.continueConversation();
  assert.equal(app.state.history[1].content,'No, estoy en clase.');assert.equal(app.state.history[2].content,'Gracias. ¿Algo más?');
});
test('salida inválida de IA vuelve a práctica guiada y conserva el mensaje',async()=>{
  const {app,el,setAI}=harness();setAI(true,async()=>'{roto');app.startScenario('casa-mama');el('messageInput').value='No puedo hoy.';await app.sendMessage();
  assert.equal(app.state.mode,'guided');assert.equal(app.state.pending.text,'No puedo hoy.');app.rewrite();assert.equal(el('messageInput').disabled,false);
});
test('una respuesta tardía no reaparece tras salir de la conversación',async()=>{
  const {app,el,setAI}=harness();let resolve;setAI(true,()=>new Promise(r=>{resolve=r;}));app.startScenario('casa-mama');el('messageInput').value='Estoy en casa.';const promise=app.sendMessage();app.backHome();
  resolve('{"reply":"Hola","suggestion":"","explanation":""}');await promise;
  assert.equal(app.state.scenario,null);assert.equal(app.state.pending,null);assert.equal(el('messages').innerHTML,'');
});
test('contenido introducido se escapa antes de insertarlo en la revisión',async()=>{
  const {app,el}=harness();app.startScenario('casa-mama');el('messageInput').value='<img src=x onerror=alert(1)>';await app.sendMessage();
  const html=el('messages').children.map(c=>c.innerHTML).join('');assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));
});
function localHarness(){
  const workers=[],timers=new Map();let seq=0;
  class Worker{
    constructor(url,options){this.url=url;this.options=options;this.sent=[];this.terminated=false;workers.push(this);}
    postMessage(message){this.sent.push(message);}
    terminate(){this.terminated=true;}
    receive(type,result){const request=this.sent.at(-1);this.onmessage({data:{id:request.id,type,result}});}
  }
  const ctx={window:null,document:{currentScript:{src:'https://example.test/js/chat-espanol-local.js'}},navigator:{gpu:{}},Worker,URL,Promise,isSecureContext:true,addEventListener(){},setTimeout:f=>{timers.set(++seq,f);return seq;},clearTimeout:id=>timers.delete(id)};ctx.window=ctx;
  vm.runInNewContext(fs.readFileSync(path.join(dir,'js/chat-espanol-local.js'),'utf8'),ctx);
  return {api:ctx.LSPChatLocal,workers,ctx,timers};
}
test('IA opcional no crea worker ni descarga al abrir la página',()=>{
  const {api,workers}=localHarness();assert.equal(workers.length,0);assert.equal(api.isReady(),false);
});
test('navegador sin WebGPU conserva la guía y no intenta cargar un modelo',async()=>{
  const {api,workers,ctx}=localHarness();delete ctx.navigator.gpu;await assert.rejects(api.activate(),/prácticas guiadas/);assert.equal(workers.length,0);
});
test('activar, generar y detener IA resuelve o cancela solicitudes pendientes',{timeout:2000},async()=>{
  const {api,workers}=localHarness();const activation=api.activate();assert.equal(workers.length,1);workers[0].receive('done',{model:'test'});await activation;assert.equal(api.isReady(),true);
  const response=api.reply(data.scenarios[0],[{role:'user',content:'Hola.'}]);await new Promise(setImmediate);workers[0].receive('done','respuesta');assert.equal(await response,'respuesta');
  const pending=api.reply(data.scenarios[0],[]);await new Promise(setImmediate);api.stop();await assert.rejects(pending,/detenida/);assert.equal(api.isReady(),false);assert.equal(workers[0].terminated,true);
});
test('cancelar una activación anterior no destruye una activación nueva',{timeout:2000},async()=>{
  const {api,workers}=localHarness();const old=api.activate();api.stop();const fresh=api.activate();await assert.rejects(old);assert.equal(workers[1].terminated,false);workers[1].receive('done',{});await fresh;assert.equal(api.isReady(),true);
});
test('tiempo de espera agotado libera worker y devuelve control',{timeout:2000},async()=>{
  const {api,workers,timers}=localHarness();const loading=api.activate();timers.values().next().value();await assert.rejects(loading);assert.equal(workers[0].terminated,true);assert.equal(timers.size,0);
});
test('la pista depende de lo que preguntan, no de la respuesta modelo',()=>{
  const cases=[['¿A qué hora llegas?','time'],['¿Para qué día necesitas el pasaje?','time'],['¿Dónde estás ahora?','place'],['¿A qué ciudad desea viajar?','destination'],['¿Por qué prefieres ese día?','reason'],['¿Cuántos panes quieres?','quantity'],['¿Prefieres efectivo o tarjeta?','choice'],['Hola. ¿Ya saliste?','confirm']];
  for(const [prompt,kind] of cases){const guide=core.responseGuide({prompt,model:'Ayer no fui.'});assert.equal(guide.kind,kind,prompt);assert.ok(guide.aim&&guide.check);}
});
test('al pedir una hora, orienta a añadir el dato sin inventarlo',()=>{
  const turn={prompt:'¿A qué hora llegas?'};
  const feedback=core.communicationFeedback('Sí',turn);assert.equal(feedback.label,'Añade el dato que te piden');assert.match(feedback.focus,/hora/);assert.ok(!feedback.focus.includes('cinco'));
  assert.equal(core.communicationFeedback('No lo sé todavía.',turn).label,'Puedes expresar una duda');
  assert.equal(core.communicationFeedback('No, gracias.',{prompt:'¿Quieres ayuda?'}).label,'Una respuesta breve puede servir');
});
test('todas las situaciones tienen una orientación legible sin cambiar su texto',()=>{
  for(const s of data.scenarios)for(const turn of s.turns){const original=JSON.stringify(turn);const guide=core.responseGuide(turn);assert.ok(guide.aim.length<150&&guide.check.length<180);assert.equal(JSON.stringify(turn),original);}
});
test('empezar lleva a una situación del nivel elegido todavía no completada',()=>{
  const {app,el}=harness();const first=app.recommendedScenario();app.state.progress.completed.push(first.id);
  const next=app.recommendedScenario();assert.notEqual(first.id,next.id);el('btnStartRecommended').events.click();assert.equal(app.state.scenario.id,next.id);
});
test('la navegación alterna escritura, pistas y revisión sin controles duplicados',async()=>{
  const {app,el}=harness();app.startScenario('casa-mama');assert.equal(el('composerWrap').classList.contains('hidden'),false);
  assert.equal(el('stepWrite').attributes['aria-current'],'step');app.openHelp();assert.equal(el('composerWrap').classList.contains('hidden'),true);
  el('wildcardOptions').children[0].events.click();assert.equal(el('composerWrap').classList.contains('hidden'),false);
  el('messageInput').value='todavia no';await app.sendMessage();assert.equal(el('composerWrap').classList.contains('hidden'),true);assert.equal(el('reviewActions').classList.contains('hidden'),false);
  assert.equal(el('stepReview').attributes['aria-current'],'step');assert.equal(el('stepWrite').attributes['aria-current'],undefined);
  app.rewrite();assert.equal(el('composerWrap').classList.contains('hidden'),false);assert.equal(el('reviewActions').classList.contains('hidden'),true);
});
test('editar la propuesta rellena el editor y requiere una nueva revisión',async()=>{
  const {app,el}=harness();app.startScenario('casa-mama');el('messageInput').value='no puedo';await app.sendMessage();
  const proposal=el('messages').querySelector('.edit-proposal');assert.ok(proposal);proposal.events.click();
  assert.equal(el('messageInput').value,'No puedo.');assert.equal(app.state.pending,null);assert.equal(app.state.accepted,0);assert.equal(app.state.attempts,1);assert.equal(proposal.disabled,true);
});
test('un ejemplo no sustituye silenciosamente un borrador',()=>{
  const {app,el}=harness();app.startScenario('casa-mama');el('messageInput').value='Mi idea original';app.fillExample('Otro texto');
  assert.equal(el('messageInput').value,'Mi idea original');assert.equal(el('modal').classList.contains('hidden'),false);
  el('modalActions').children[0].events.click();assert.equal(el('messageInput').value,'Mi idea original');
  app.fillExample('Otro texto');el('modalActions').children[1].events.click();assert.equal(el('messageInput').value,'Otro texto');assert.equal(app.state.attempts,0);
});
test('ejemplos de confirmación permiten aceptar, rechazar o no saber',()=>{
  const {app,el}=harness();app.startScenario('casa-mama');app.openHelp();el('wildcardOptions').querySelector('.show-examples').events.click();
  const examples=el('helpExamples').children.map(c=>c.textContent);assert.ok(examples.includes('No.'));assert.ok(examples.includes('Todavía no lo sé.'));
});
test('el resumen compara la primera versión con la última sin persistir mensajes',async()=>{
  const {app,el,saved}=harness();app.startScenario('casa-mama');el('messageInput').value='si';await app.sendMessage();app.rewrite();el('messageInput').value='Sí, ya salí de casa.';await app.sendMessage();app.continueConversation();
  assert.equal(app.state.samples.length,1);assert.equal(app.state.samples[0].before,'si');assert.equal(app.state.samples[0].after,'Sí, ya salí de casa.');
  while(app.state.turn<app.state.scenario.turns.length){el('messageInput').value=app.state.scenario.turns[app.state.turn].model;await app.sendMessage();app.continueConversation();}
  assert.ok(el('modalBody').innerHTML.includes('Sí, ya salí de casa.'));assert.equal(JSON.stringify(saved).includes('Sí, ya salí de casa.'),false);
  app.backHome();assert.equal(app.state.samples.length,0);
});
test('botones de propuestas anteriores no alteran la respuesta actual',async()=>{
  const {app,el}=harness();app.startScenario('casa-mama');el('messageInput').value='no';await app.sendMessage();const old=el('messages').querySelector('.edit-proposal');app.continueConversation();
  el('messageInput').value='en casa';await app.sendMessage();const pending=app.state.pending;assert.equal(old.disabled,true);old.events.click();assert.equal(app.state.pending,pending);
});
test('cancelar IA recupera el borrador exacto y descarta la respuesta tardía',async()=>{
  const {app,el,setAI}=harness();let resolve;setAI(true,()=>new Promise(r=>{resolve=r;}));app.startScenario('casa-mama');el('messageInput').value='No iré hoy. Voy mañana.';const task=app.sendMessage();app.cancelResponse();
  assert.equal(el('messageInput').value,'No iré hoy. Voy mañana.');assert.equal(app.state.busy,false);assert.equal(app.state.mode,'guided');assert.equal(el('composerWrap').classList.contains('hidden'),false);
  resolve('{"reply":"Respuesta tardía","suggestion":"","explanation":""}');await task;assert.equal(app.state.pending,null);
});
