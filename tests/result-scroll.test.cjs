const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../js/script.js'),'utf8');
const helpers = source.slice(source.indexOf('let secuenciaScrollAutomatico = 0;'), source.indexOf('// Filtra las palabras del diccionario', source.indexOf('let secuenciaScrollAutomatico = 0;')));

function scenario() {
    const frames = [], scrolls = [], listeners = {};
    let now=0;
    const window = {pageYOffset:0,visualViewport:{height:700},scrollTo({top}){this.pageYOffset=top;scrolls.push(top);}};
    const header = {getBoundingClientRect:()=>({height:80})};
    const document = {documentElement:{scrollHeight:2400,scrollTop:0},querySelector:()=>header,addEventListener:(name,handler)=>{listeners[name]=handler;}};
    const context = {window,document,getComputedStyle:()=>({position:'fixed'}),performance:{now:()=>now},requestAnimationFrame:fn=>frames.push(fn)};
    vm.createContext(context);vm.runInContext(helpers,context);
    const result = {getBoundingClientRect:()=>({top:900-window.pageYOffset})};
    return {context,result,scrolls,window,input(type,key){listeners[type]({type,key});},frame(){now+=16;frames.shift()?.();},flush(){for(let i=0;frames.length&&i<500;i++){now+=16;frames.shift()();}assert.equal(frames.length,0);}};
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


for (const type of ['wheel','touchstart','pointerdown']) {
    test('Vocabulario respeta '+type+' durante la primera estabilización',()=>{
        const s=scenario();
        s.context.scrollArribaEstable();s.frame();s.frame();
        s.scrolls.length=0;
        s.input(type);s.window.pageYOffset=320;s.flush();
        assert.equal(s.window.pageYOffset,320);
        assert.deepEqual(s.scrolls,[]);
    });
}
test('PageDown cancela incluso antes del primer salto, sin anular un clic posterior',()=>{
    const s=scenario();s.context.scrollArribaEstable();
    s.input('keydown','PageDown');s.window.pageYOffset=400;s.flush();
    assert.equal(s.window.pageYOffset,400);assert.deepEqual(s.scrolls,[]);
    s.context.scrollAlPrimerResultado(s.result);s.flush();
    assert.equal(s.window.pageYOffset,804);
});
test('la vigilancia de resultados tampoco pelea con el desplazamiento manual',()=>{
    const s=scenario();s.context.scrollAlPrimerResultado(s.result);s.frame();s.frame();
    s.scrolls.length=0;s.input('wheel');s.window.pageYOffset=1100;s.flush();
    assert.equal(s.window.pageYOffset,1100);assert.deepEqual(s.scrolls,[]);
});
test('una tecla que no desplaza no cancela el ajuste de carga',()=>{
    const s=scenario();s.context.scrollArribaEstable();s.input('keydown','a');s.flush();
    assert.ok(s.scrolls.length);assert.ok(s.scrolls.every(top=>top===0));
});
