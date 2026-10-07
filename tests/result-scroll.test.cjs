const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../js/script.js'),'utf8');
const helpers = source.slice(source.indexOf('let secuenciaScrollAutomatico = 0;'), source.indexOf('// Filtra las palabras del diccionario', source.indexOf('let secuenciaScrollAutomatico = 0;')));

function scenario() {
    const frames = [], scrolls = [];
    let now=0;
    const window = {pageYOffset:0,visualViewport:{height:700},scrollTo({top}){this.pageYOffset=top;scrolls.push(top);}};
    const header = {getBoundingClientRect:()=>({height:80})};
    const document = {documentElement:{scrollHeight:2400,scrollTop:0},querySelector:()=>header};
    const context = {window,document,getComputedStyle:()=>({position:'fixed'}),performance:{now:()=>now},requestAnimationFrame:fn=>frames.push(fn)};
    vm.createContext(context);vm.runInContext(helpers,context);
    const result = {getBoundingClientRect:()=>({top:900-window.pageYOffset})};
    return {context,result,scrolls,window,flush(){for(let i=0;frames.length&&i<500;i++){now+=16;frames.shift()();}assert.equal(frames.length,0);}};
}

test('la ficha cancela el desplazamiento pendiente al inicio y deja margen bajo navbar móvil',()=>{
    const s=scenario();
    s.context.scrollArribaEstable();
    s.context.scrollAlPrimerResultado(s.result);
    s.flush();
    assert.ok(s.scrolls.length);
    assert.ok(s.scrolls.every(top=>top===804));
    assert.equal(s.result.getBoundingClientRect().top,96);
});

test('un menú abierto después cancela la vigilancia de la ficha anterior',()=>{
    const s=scenario();
    s.context.scrollAlPrimerResultado(s.result);
    s.context.scrollArribaEstable();
    s.flush();
    assert.ok(s.scrolls.every(top=>top===0));
});
