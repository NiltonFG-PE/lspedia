const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function fixture(){
 const timers=new Map();let tick=0;
 const nodes=new Map();
 const node=()=>({value:'es-PE',dataset:{},classList:{add(){},remove(){},contains(){return false},toggle(){}},style:{},setAttribute(){},innerHTML:'',textContent:'',scrollTop:0,scrollHeight:0});
 const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 const instances=[];
 class Recognition{constructor(){instances.push(this);}start(){this.onstart?.();}abort(){this.aborted=true;}}
 const context={console,Set,Promise,window:{SpeechRecognition:Recognition},navigator:{},document:{getElementById:get,createElement:node,visibilityState:'visible'},setTimeout(fn){timers.set(++tick,fn);return tick;},clearTimeout(id){timers.delete(id);},alert(){},requestAnimationFrame(){},cancelAnimationFrame(){}};
 let source=fs.readFileSync(require('node:path').join(__dirname,'../js/subtitulos.js'),'utf8');
 source=source.replace('return { iniciar, salir };','return { iniciar, salir, estado, iniciarEscucha, alternarPausa, detenerEscucha, borrarTexto, elegirAlternativa, iniciarMedidorNivel, detenerMedidorNivel, solicitarWakeLock, cargarAjustes, guardarAjustes, editarTranscripcion, nuevaSesion };');
 vm.runInNewContext(source,context);
 const api=context.window.SubtitulosV2;
 const emit=(r,items,index=0)=>r.onresult?.({resultIndex:index,results:items.map(([transcript,isFinal=true])=>Object.assign([{transcript,confidence:.9}],{isFinal}))});
 const flush=()=>{const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());};
 return {api,context,get,instances,emit,flush,timers};
}
test('keeps spoken repetitions, ignores repeated final event, keeps unchanged interim segments',()=>{
 const f=fixture();f.api.iniciarEscucha();const r=f.instances[0];
 f.emit(r,[['sí'],['sí'],['vamos',false]]);
 f.emit(r,[['sí'],['sí'],['vamos',false],['ahora',false]],3);
 assert.equal(f.api.estado.textoCompleto,'sí sí');assert.equal(f.api.estado.textoInterino,'vamos ahora');
 r.onend();f.flush();f.emit(f.instances[1],[['sí']]);assert.equal(f.api.estado.textoCompleto,'sí sí sí');
});
test('pause during reconnect does not block the next automatic restart',()=>{
 const f=fixture();f.api.iniciarEscucha();f.instances[0].onend();f.api.alternarPausa();f.flush();
 assert.equal(f.instances.length,1);f.api.alternarPausa();f.instances[1].onend();f.flush();assert.equal(f.instances.length,3);
});
test('stale recognition callbacks cannot change a new session or restart after stop',()=>{
 const f=fixture();f.api.iniciarEscucha();const r=f.instances[0],end=r.onend,result=r.onresult;
 f.api.detenerEscucha();assert.equal(r.aborted,true);f.api.iniciarEscucha();
 result({results:[Object.assign([{transcript:'obsoleto'}],{isFinal:true})],resultIndex:0});end();f.flush();
 assert.equal(f.instances.length,2);assert.equal(f.api.estado.textoCompleto,'');
});
test('clear does not resurrect already confirmed text from a cumulative result list',()=>{
 const f=fixture();f.api.iniciarEscucha();const r=f.instances[0];f.emit(r,[['anterior']]);f.api.borrarTexto();
 f.emit(r,[['anterior'],['nuevo']],1);assert.equal(f.api.estado.textoCompleto,'nuevo');
});
test('context does not replace a higher ranked alternative through substring matching',()=>{
 const f=fixture();f.api.estado.frasesContextuales=['Ana'];
 const first={transcript:'mañana',confidence:.9},second={transcript:'banana',confidence:.85};
 assert.equal(f.api.elegirAlternativa(Object.assign([first,second],{isFinal:true})),first);
});
test('late microphone permission is released after leaving the tool',async()=>{
 const f=fixture();let resolve,stopped=0;f.api.estado._seccionAbierta=true;
 f.context.navigator.mediaDevices={getUserMedia:()=>new Promise(r=>resolve=r)};
 f.api.iniciarMedidorNivel();f.api.estado._seccionAbierta=false;f.api.detenerMedidorNivel();
 resolve({getTracks:()=>[{stop(){stopped++;}}]});await Promise.resolve();assert.equal(stopped,1);assert.equal(f.api.estado.medidor.activo,false);
});
test('wake lock granted after stop is released',async()=>{
 const f=fixture();let resolve,released=0;f.context.navigator.wakeLock={request:()=>new Promise(r=>resolve=r)};
 f.api.estado.activo=true;const pending=f.api.solicitarWakeLock();f.api.estado.activo=false;
 resolve({release(){released++;return Promise.resolve();}});await pending;assert.equal(released,1);assert.equal(f.api.estado.wakeLock,null);
});

test('stop, edit and continue preserve the complete transcript, excluding interim text',()=>{
 const f=fixture();f.api.iniciarEscucha();f.emit(f.instances[0],[['Hola Perú'],['provisional',false]]);
 f.api.detenerEscucha();assert.equal(f.get('subtitulosEditor').value,'Hola Perú');
 f.get('subtitulosEditor').value='Hola, Perú.\nTexto corregido.';f.api.editarTranscripcion();f.api.iniciarEscucha();
 f.emit(f.instances[1],[['Continuamos']]);assert.equal(f.api.estado.textoCompleto,'Hola, Perú.\nTexto corregido. Continuamos');
});
test('new session requires confirmation before discarding text',()=>{
 const f=fixture();f.api.estado.textoCompleto='Conservar';f.context.window.confirm=()=>false;f.api.nuevaSesion();assert.equal(f.api.estado.textoCompleto,'Conservar');
 f.context.window.confirm=()=>true;f.api.nuevaSesion();assert.equal(f.api.estado.textoCompleto,'');
});
test('preferences validate values, tolerate blocked storage and never save transcript',()=>{
 const f=fixture();let saved;
 f.context.window.localStorage={getItem:()=>JSON.stringify({idioma:'en-US',tamanoIndex:3,colorResaltado:'amarillo',caraACara:true}),setItem:(k,v)=>saved=JSON.parse(v)};
 f.api.cargarAjustes();assert.equal(f.get('subtitulosSelectIdioma').value,'en-US');assert.equal(f.api.estado.tamanoIndex,3);assert.equal(f.api.estado.caraACara,true);
 f.api.estado.textoCompleto='Privado';f.api.guardarAjustes();assert.equal(Object.hasOwn(saved,'textoCompleto'),false);assert.equal(JSON.stringify(saved).includes('Privado'),false);
 const bad=fixture();bad.context.window.localStorage={getItem:()=>'{"idioma":"__proto__","tamanoIndex":500,"colorResaltado":"red","caraACara":"yes"}',setItem:()=>{throw Error('blocked');}};
 bad.api.cargarAjustes();assert.equal(bad.api.estado.idioma,'es-PE');assert.equal(bad.api.estado.tamanoIndex,1);assert.equal(bad.api.estado.caraACara,false);assert.doesNotThrow(()=>bad.api.guardarAjustes());
});
test('silence clears on recognition and permission failure preserves text',()=>{
 const f=fixture();f.api.iniciarEscucha();f.flush();assert.equal(f.api.estado._silencio,true);
 f.emit(f.instances[0],[['Texto conservado']]);assert.equal(f.api.estado._silencio,false);
 f.instances[0].onerror({error:'not-allowed'});assert.equal(f.api.estado.activo,false);assert.equal(f.api.estado.textoCompleto,'Texto conservado');assert.match(f.get('subtitulosAvisoMotor').textContent,/permiso/);
 f.flush();assert.equal(f.instances.length,1);
});
