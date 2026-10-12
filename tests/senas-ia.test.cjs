const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=import('../js/senas-ia-core.mjs');
const frames=x=>Array.from({length:24},()=>Array(127).fill(x));
const banco=()=>[0,.01,.02].map((x,i)=>({id:'a'+i,etiqueta:'gracias',frames:frames(x)})).concat([1,1.01,1.02].map((x,i)=>({id:'b'+i,etiqueta:'hola',frames:frames(x)})));
test('known reference accepted and unrelated sign rejected',async()=>{
 const {decidirCoincidencia,distanciaSecuencia}=await core;
 assert.equal(decidirCoincidencia(frames(.012),banco(),distanciaSecuencia).etiqueta,'gracias');
 assert.equal(decidirCoincidencia(frames(4),banco(),distanciaSecuencia).aceptada,false);
});
test('ties and insufficient banks rejected',async()=>{
 const {decidirCoincidencia,distanciaSecuencia}=await core;const datos=banco();datos.slice(3).forEach(x=>x.frames=frames(.01));
 assert.equal(decidirCoincidencia(frames(.01),datos,distanciaSecuencia).aceptada,false);
 assert.equal(decidirCoincidencia(frames(0),banco().slice(0,3),distanciaSecuencia).aceptada,false);
 assert.equal(decidirCoincidencia(frames(0),banco().filter(x=>x.id!=='a2'),distanciaSecuencia).aceptada,false);
});
test('one lucky nearest reference does not override distant supporting references',async()=>{
 const {decidirCoincidencia,distanciaSecuencia}=await core;const datos=banco();datos[1].frames=frames(.6);datos[2].frames=frames(.8);
 assert.equal(decidirCoincidencia(frames(0),datos,distanciaSecuencia).aceptada,false);
});
test('DTW handles different durations and rejects malformed vectors',async()=>{
 const {distanciaSecuencia}=await core;
 assert.equal(distanciaSecuencia(frames(0),frames(0).slice(0,12)),0);
 assert.ok(distanciaSecuencia([[0]],frames(0))>1);
});
test('held sign emits once; repeat possible after neutral pause',async()=>{
 const {SegmentadorSenas}=await core;const s=new SegmentadorSenas();const v=frames(0)[0];const outputs=[];
 for(let t=0;t<4000;t+=70){const x=s.actualizar(v,t);if(x)outputs.push(x);}
 assert.equal(outputs.length,1);assert.equal(outputs[0].length,24);
 s.actualizar(null,4500);for(let t=4600;t<5800;t+=70)s.actualizar(v,t);
 assert.equal(s.actualizar(null,6300).length,24);assert.equal(s.actualizar(null,6900),null);
});
test('short hand appearances do not emit words; reset cancels unfinished segment',async()=>{
 const {SegmentadorSenas}=await core;const s=new SegmentadorSenas();
 for(let t=0;t<350;t+=70)s.actualizar(frames(0)[0],t);assert.equal(s.actualizar(null,900),null);
 for(let t=1000;t<2200;t+=70)s.actualizar(frames(0)[0],t);s.reiniciar();assert.equal(s.actualizar(null,3000),null);
});
