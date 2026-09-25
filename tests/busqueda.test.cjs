const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const core = require('../js/busqueda-core.js');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const dic = JSON.parse(read('data/palabras.json')).filter(p => p.palabra && p.categoria &&
    String(p.definicion || '').trim() && /\.(webp|png|jpe?g|gif|svg|avif)([?#].*)?$/i.test(String(p.imagen || '').split(',')[0].trim()));
const voc = JSON.parse(read('data/vocabulario.json'));

test('exacta en Diccionario gana incluso si Vocabulario está pendiente', () => {
    const d = [{palabra:'Hola', variantes:''}];
    for (const estado of ['listo', 'cargando', 'error']) {
        assert.equal(core.resolver('HOLA', d, [{palabra:'Hola'}], estado).registro, d[0]);
    }
});

test('exacta en Vocabulario gana a variante y prefijo del Diccionario', () => {
    const d = [{palabra:'Económico', variantes:'barato'}, {palabra:'Baratómetro'}];
    const v = [{palabra:'Barato'}];
    for (const q of ['BARATO', 'Barato', ' barato ']) {
        assert.equal(core.resolver(q, d, v).registro, v[0]);
    }
    assert.equal(core.resolver('barato', d, []).registro, d[0]);
});

test('Barato real espera Vocabulario, y una colección vacía no queda cargando', () => {
    assert.equal(core.resolver('BARATO', dic, [], 'cargando').tipo, 'cargando');
    assert.equal(core.resolver('BARATO', dic, [], 'error').tipo, 'error');
    assert.equal(core.resolver('BARATO', dic, voc).registro.palabra, 'Barato');
    assert.equal(core.resolver('zzzzzzzz', dic, []).tipo, 'aproximada');
});

test('variantes exactas, tildes y herramientas de corrección siguen disponibles', () => {
    assert.equal(core.resolver('felicidades', dic, voc).registro.palabra, 'Felicitaciones');
    assert.equal(core.norm('Adiós'), 'adios');
    assert.equal(core.levenshtein('adioz', 'adios'), 1);
    assert.ok(core.generarConjugacionesRegulares('hablar').includes('hablamos'));
});

function prediccion(consulta, estado, vocabulario) {
    const listeners = {};
    const panel = {innerHTML:'resultado principal', style:{display:'block'}, items:[],
        setAttribute(){}, appendChild(item){ this.items.push(item); }};
    const input = {value:consulta, dataset:{}, addEventListener(k, fn){listeners[k] = fn;}};
    const document = {readyState:'complete', head:{appendChild(){}}, addEventListener(){},
        getElementById(id){return id === 'buscar' ? input : id === 'sugerencias' ? panel : null;},
        createElement(){return {dataset:{}, setAttribute(){}, addEventListener(){}};}};
    const context = {document, URL, localStorage:{getItem(){return null;}}, setTimeout(fn){fn();},
        window:{App:{datos:dic}, location:{href:'http://localhost/'},
            resolverPrioridadBusqueda(q){return core.resolver(q, dic, vocabulario, estado);}}};
    vm.runInNewContext(read('js/buscador-predictivo.js'), context);
    listeners.input();
    return {panel, api:context.window.LSPediaBuscadorPredictivo};
}

test('el predictivo real no reemplaza la espera, el error ni el resultado exacto', () => {
    for (const [estado, banco] of [['cargando', []], ['error', []], ['listo', voc]]) {
        assert.equal(prediccion('BARATO', estado, banco).panel.innerHTML, 'resultado principal');
    }
});

test('el predictivo real conserva sugerencias ortográficas cuando corresponde', () => {
    const {panel, api} = prediccion('adioz', 'listo', voc);
    assert.ok(panel.items.length > 0);
    assert.ok(api.obtenerCandidatos('adioz').some(x => x.p.palabra === 'Adiós'));
});

test('la fuente pública deduplica cargas y no espera las definiciones de apoyo', async () => {
    let resolverDatos;
    const llamadas = [];
    const eventos = [];
    const window = {location:{search:''}, LSPediaCore:{leerJsonSeguro(url){
        llamadas.push(url);
        return url.includes('definiciones') ? new Promise(() => {}) : new Promise(r => {resolverDatos = r;});
    }}};
    vm.runInNewContext(read('js/vocabulario-publico.js'), {window, URLSearchParams, console,
        CustomEvent:class {constructor(type){this.type=type;}}, document:{dispatchEvent(e){eventos.push(e.type);}}});
    const api = window.LSPediaVocabularioPublico;
    const a = api.cargar(), b = api.cargar();
    assert.equal(a, b);
    assert.equal(llamadas.filter(x => x.includes('vocabulario.json')).length, 1);
    resolverDatos([{palabra:'Sin vídeo',categoria:'Prueba',imagen:'img/prueba.webp',video:''}]);
    await a;
    assert.equal(api.estado(), 'listo');
    assert.equal(api.obtener().length, 1);
    assert.ok(eventos.includes('lspedia:vocabularioPublicoListo'));
});

test('la fuente publica un error recuperable y acepta un banco vacío al reintentar', async () => {
    let fallar = true;
    const window = {location:{search:''}, LSPediaCore:{leerJsonSeguro(url){
        if(url.includes('definiciones')) return Promise.resolve({});
        return fallar ? Promise.reject(new Error('red')) : Promise.resolve([]);
    }}};
    vm.runInNewContext(read('js/vocabulario-publico.js'), {window, URLSearchParams,
        console:{warn(){}}, CustomEvent:class {}, document:{dispatchEvent(){}}});
    const api = window.LSPediaVocabularioPublico;
    await api.cargar();
    assert.equal(api.estado(), 'error');
    fallar = false;
    await api.recargar();
    assert.equal(api.estado(), 'listo');
    assert.equal(api.total(), 0);
});
