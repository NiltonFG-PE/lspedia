const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/i18n.js'),'utf8');
function iniciar(languages,guardado,storageBloqueado=false){
 const window={};let elegido;
 vm.runInNewContext(source,{window,navigator:{languages,language:languages[0]},localStorage:{getItem(){if(storageBloqueado)throw Error('bloqueado');return guardado},setItem(k,v){elegido=v}},document:{readyState:'loading',addEventListener(){}}});
 return {api:window.LSPediaIdioma,elegido:()=>elegido};
}
test('detecta variantes regionales de inglés',()=>{for(const lang of ['en-US','en-GB','en-AU'])assert.equal(iniciar([lang]).api.obtener(),'en')});
test('respeta español antes que inglés secundario',()=>assert.equal(iniciar(['es-PE','en-US']).api.obtener(),'es'));
test('elige el primer idioma disponible y conserva español como respaldo',()=>{assert.equal(iniciar(['fr-FR','en-CA']).api.obtener(),'en');assert.equal(iniciar(['fr-FR']).api.obtener(),'es')});
test('respeta la elección manual guardada',()=>{assert.equal(iniciar(['en-US'],'es').api.obtener(),'es');assert.equal(iniciar(['es-PE'],'en').api.obtener(),'en')});
test('detecta idioma aunque el almacenamiento esté bloqueado o sea inválido',()=>{assert.equal(iniciar(['en-GB'],null,true).api.obtener(),'en');assert.equal(iniciar(['en-US'],'fr').api.obtener(),'en')});
test('guarda una selección manual aunque coincida con el idioma automático',()=>{const app=iniciar(['en-US']);app.api.cambiar('en');assert.equal(app.elegido(),'en')});
