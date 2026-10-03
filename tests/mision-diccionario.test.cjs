const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
function run(sources) {
 const index=sources['index.html'];
 const html=index.match(/<script id="lspedia-mision-render">([\s\S]*?)<\/script>/)[1];
 const config=JSON.parse(sources['data/web-config.json']);
 const nodes={tituloPrincipal:{},subtituloPrincipal:{innerHTML:'',classList:{toggle(){}}},btnCategorias:{classList:{contains(){return false;}}}};
 const ctx={window:{LSPediaWebConfig:config},document:{getElementById:id=>nodes[id]||null},idioma:'es',setPlaceholder(){}};
 ctx.window.LSPediaIdioma={obtener:()=>ctx.idioma};
 ctx.q=sel=>nodes[sel.slice(1)]||null;
 vm.createContext(ctx);
 vm.runInContext(html,ctx);
 const main=sources['js/script.js'];
 vm.runInContext(main.slice(main.indexOf('const TITULOS_PRINCIPALES ='),main.indexOf('// TRANSICION_SECCIONES_PRINCIPALES_JS')),ctx);
 const web=sources['js/web-config.js'];
 vm.runInContext(web.slice(web.indexOf('function subDic('),web.indexOf('function subVoc(')),ctx);
 const restore=sources['js/i18n-restaurar.js'];
 vm.runInContext(restore.slice(restore.indexOf('function restaurarHeroEspanol('),restore.indexOf("document.addEventListener(")),ctx);
 const en=sources['js/i18n.js'];
 vm.runInContext(en.slice(en.indexOf('function traducirHero('),en.indexOf('function resolverTraduccionResultado(')),ctx);
 const expected=ctx.window.LSPediaMision.html('es');
 assert.match(expected,/Busca una palabra/);
 assert.equal((expected.match(/<p /g)||[]).length,3);
 assert.doesNotMatch(expected,/aviso-mision-icono|ni enseñamos/);
 // Repeat the actual writers in different load orders, as on refresh.
 for(const order of [
  ['actualizarTituloPrincipal("diccionario")','subDic(window.LSPediaWebConfig.heroes.diccionario.subtitulo)','restaurarHeroEspanol()'],
  ['restaurarHeroEspanol()','subDic(window.LSPediaWebConfig.heroes.diccionario.subtitulo)','actualizarTituloPrincipal("diccionario")']
 ]) for(const call of order){vm.runInContext(call,ctx);assert.equal(nodes.subtituloPrincipal.innerHTML,expected);}
 vm.runInContext('actualizarTituloPrincipal("vocabulario");actualizarTituloPrincipal("diccionario")',ctx);
 assert.equal(nodes.subtituloPrincipal.innerHTML,expected);
 ctx.idioma='en';
 vm.runInContext('traducirHero();subDic(window.LSPediaWebConfig.heroes.diccionario.subtitulo)',ctx);
 assert.match(nodes.subtituloPrincipal.innerHTML,/Search for a word/);
 ctx.idioma='es';vm.runInContext('restaurarHeroEspanol()',ctx);
 assert.equal(nodes.subtituloPrincipal.innerHTML,expected);
 const custom=ctx.window.LSPediaMision.html('es','Nueva descripción\n<img src=x onerror=alert(1)>');
 assert.match(custom,/Nueva descripción/);
 assert.match(custom,/&lt;img/);
 assert.doesNotMatch(custom,/<img|no un curso/);
 return ctx;
}
const files=['index.html','data/web-config.json','js/script.js','js/web-config.js','js/i18n-restaurar.js','js/i18n.js'];
const sources=Object.fromEntries(files.map(p=>[p,read(p)]));
const ctx=run(sources);
const old='Entiende el significado de las palabras en español con videos en Lengua de Señas Peruana (LSP). Pensado para personas sordas y para quienes quieren comunicarse mejor con ellas.\nEs un diccionario de apoyo, no un curso de LSP.';
assert.match(ctx.window.LSPediaMision.html('es',old),/Busca una palabra/);
console.log('Misión: recarga, configuración tardía, navegación, ES/EN, migración y escape HTML correctos.');
