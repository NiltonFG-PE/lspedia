const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname,'../js/lo-nuevo.js'),'utf8');
function block(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));}
function environment(){
    const state={opens:0,updates:0};
    function element(){return {attrs:{},children:[],events:{},classList:{toggle(){}},
        setAttribute(k,v){this.attrs[k]=v;},append(...items){this.children.push(...items);},
        appendChild(item){this.children.push(item);},addEventListener(k,fn){this.events[k]=fn;},
        querySelector(){return this.children.find(c=>c.className==='lsp-nueva-marca');}};}
    const context={URL,location:{pathname:'/',origin:'https://lspedia.site'},window:{obtenerIdPalabra:p=>p.id},
        document:{createElement:element},miniatura:()=>'/img/test.webp',esNuevo:()=>false,
        abrirContenido:()=>state.opens++,actualizarAcciones:()=>state.updates++};
    vm.createContext(context);
    vm.runInContext("let modoSeleccion=false; const seleccionadas=new Set();",context);
    vm.runInContext(block('    function $(id)','    function datosDiccionario()'),context);
    vm.runInContext(block('    function claveFicha(','    function botonAccion('),context);
    vm.runInContext(block('    function crearTarjeta(','    function render('),context);
    return {context,state};
}
const ficha={fuente:'vocabulario',palabra:{id:'generoso-adjetivos',palabra:'Generoso',categoria:'Adjetivos'},registro:{fecha:''}};
test('enlace conserva origen, referencia y orden de las fichas seleccionadas',()=>{
    const {context}=environment();
    const url=new URL(context.urlCompartirNovedades([ficha,{...ficha,fuente:'diccionario',palabra:{id:'¿cómo? & ayuda'}}]));
    assert.equal(url.origin,'https://lspedia.site');
    assert.equal(url.searchParams.get('vista'),'diccionario');
    assert.deepEqual(url.searchParams.getAll('nuevo'),['vocabulario:generoso-adjetivos','diccionario:¿cómo? & ayuda']);
    assert.equal(url.hash,'#lspNuevasCard');
    assert.equal(url.searchParams.has('p'),false);
});
test('seleccionar una ficha marca y desmarca sin abrirla ni reemplazar el carrusel',()=>{
    const {context,state}=environment();
    vm.runInContext('modoSeleccion=true',context);
    const boton=context.crearTarjeta(ficha);
    assert.equal(boton.attrs['aria-pressed'],'false');
    boton.events.click();
    assert.equal(boton.attrs['aria-pressed'],'true');
    boton.events.click();
    assert.equal(boton.attrs['aria-pressed'],'false');
    assert.equal(state.opens,0);
    assert.equal(state.updates,2);
});
test('fuera del modo de selección la ficha conserva su apertura habitual',()=>{
    const {context,state}=environment();
    context.crearTarjeta(ficha).events.click();
    assert.equal(state.opens,1);
    assert.equal(state.updates,0);
});
test('la recepción resuelve por ID en la fuente aunque ya no esté entre las novedades',()=>{
    const {context}=environment();
    context.datosVocabulario=()=>[ficha.palabra];
    context.datosDiccionario=()=>[{id:'generoso-adjetivos',palabra:'Otro concepto'}];
    vm.runInContext(block('    function fuenteRegistro(','    function extraerIdVideo('),context);
    assert.equal(context.buscarContenido({fuente:'vocabulario',id:'generoso-adjetivos'}).palabra.palabra,'Generoso');
    assert.equal(context.buscarContenido({fuente:'vocabulario',id:'ausente'}),null);
});

test('compartir todo conserva más de doce fichas',()=>{
    const {context}=environment();
    const fichas=Array.from({length:45},(_,i)=>({...ficha,palabra:{id:'palabra-'+i}}));
    const url=new URL(context.urlCompartirNovedades(fichas));
    assert.equal(url.searchParams.getAll('nuevo').length,45);
    assert.equal(url.searchParams.getAll('nuevo')[44],'vocabulario:palabra-44');
});
test('períodos de 7 y 30 días excluyen fechas antiguas e inválidas',()=>{
    const context={Date,texto:v=>String(v)};
    vm.createContext(context);
    vm.runInContext(block('    function dentroDelPeriodo(','    function actualizarMenu('),context);
    const fecha=d=>new Date(Date.now()-d*86400000).toISOString();
    assert.equal(context.dentroDelPeriodo(fecha(6),7),true);
    assert.equal(context.dentroDelPeriodo(fecha(15),7),false);
    assert.equal(context.dentroDelPeriodo(fecha(15),30),true);
    assert.equal(context.dentroDelPeriodo(fecha(31),30),false);
    assert.equal(context.dentroDelPeriodo('sin fecha',30),false);
});
