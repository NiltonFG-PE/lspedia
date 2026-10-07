const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/script.js'), 'utf8');

function navigation() {
    const timers = [];
    let capture;
    const state = {url:'/?vista=vocabulario&p=bien-adverbios&fuente=vocabulario', result:'', active:false};
    const button = {id:'btnCategorias', classList:{contains:()=>false}, click(){
        let stopped = false;
        capture({isTrusted:false, target:{closest:()=>button}, preventDefault(){}, stopImmediatePropagation(){stopped=true;}});
        if(stopped) return;
        state.active = true;
        state.result = '';
        if(!context.restaurandoHistorialNavegador) state.url = '/?vista=vocabulario';
    }};
    const context = {restaurandoHistorialNavegador:false, omitirIntercepcionTransicionPrincipal:false,
        IDS_SECCIONES_PRINCIPALES:new Set(['btnCategorias']), idSeccionPrincipalActiva:'btnInicio',
        iniciarSalidaSeccionPrincipal(){}, idDestinoDesdeControlPrincipal:c=>c.id,
        setTimeout:fn=>timers.push(fn), window:{matchMedia:()=>({matches:false}),scrollTo(){}},
        document:{addEventListener(type,fn){capture=fn;}, getElementById:()=>button,
            body:{classList:{contains:()=>state.active}}},
        obtenerDatosVocabulario:()=>[{id:'bien-adverbios',palabra:'Bien'}],
        buscarPalabraPorReferencia:(id,items)=>items.find(p=>p.id===id),
        mostrarPalabraSimplificada(p){state.result=p.palabra;state.url='/?vista=vocabulario&p='+p.id+'&fuente=vocabulario';}
    };
    vm.createContext(context);
    const start=source.indexOf('document.addEventListener("click", (evento) => {\n    if(omitirIntercepcionTransicionPrincipal)');
    vm.runInContext(source.slice(start,source.indexOf('}, true);', start)+9),context);
    const fnStart=source.indexOf('function mostrarPalabraVocabularioPorReferencia(');
    vm.runInContext(source.slice(fnStart,source.indexOf('window.mostrarPalabraVocabularioPorReferencia', fnStart)),context);
    return {state,context,button,timers,capture};
}

test('restaurar enlace BIEN no deja un clic pendiente que borre ficha y URL',()=>{
    const n=navigation();
    n.context.restaurandoHistorialNavegador=true;
    n.button.click();
    n.context.restaurandoHistorialNavegador=false;
    n.context.mostrarPalabraSimplificada({id:'bien-adverbios',palabra:'Bien'});
    n.timers.forEach(fn=>fn());
    assert.equal(n.state.result,'Bien');
    assert.match(n.state.url,/p=bien-adverbios/);
});

test('Lo nuevo activa Vocabulario antes de pintar y permite volver sin parada intermedia',()=>{
    const n=navigation();
    assert.equal(n.context.mostrarPalabraVocabularioPorReferencia('bien-adverbios'),true);
    assert.equal(n.state.active,true);
    n.timers.forEach(fn=>fn());
    assert.equal(n.state.result,'Bien');
    assert.match(n.state.url,/p=bien-adverbios/);
    assert.equal(n.context.restaurandoHistorialNavegador,false);
    assert.equal(n.context.mostrarPalabraVocabularioPorReferencia('inexistente'),false);
});

test('clic manual conserva la animación y abre el menú después de la salida',()=>{
    const n=navigation();
    n.capture({isTrusted:true,target:{closest:()=>n.button},preventDefault(){},stopImmediatePropagation(){}});
    assert.equal(n.state.active,false);
    assert.equal(n.timers.length,1);
    n.timers.forEach(fn=>fn());
    assert.equal(n.state.active,true);
});
