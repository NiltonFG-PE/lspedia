const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// La caja del video arranca en 16/9 y, cuando YouTube informa la proporción real
// (muchos videos de señas son verticales), cambiaba de golpe: la caja pasaba de
// ~190 px a ~590 px de alto con la ficha ya a la vista. Se veía como un salto
// ("rebote") cada vez que se abría un video. Estas pruebas fijan que la caja
// nazca ya con la proporción que se espera, para que casi nunca haya que moverla.
const fuente = fs.readFileSync(path.join(__dirname, '../js/lspedia-media.js'), 'utf8');
const CLAVE = 'lspedia:ultimoAspectoVideo';
const A = 'AAAAAAAAAAA';
const B = 'BBBBBBBBBBB';

function entorno({almacen = {}, medidas = {}, almacenRoto = false, esperar = {}} = {}) {
    const wraps = {};
    const localStorage = {
        getItem: k => {
            if (almacenRoto) throw new Error('almacenamiento bloqueado');
            return Object.prototype.hasOwnProperty.call(almacen, k) ? almacen[k] : null;
        },
        setItem: (k, v) => {
            if (almacenRoto) throw new Error('almacenamiento bloqueado');
            almacen[k] = String(v);
        }
    };
    const window = {localStorage};
    const document = {getElementById: id => wraps[id] || null};
    const fetch = async url => {
        const id = decodeURIComponent(String(url)).match(/v=([A-Za-z0-9_-]{11})/)[1];
        if (esperar[id]) await esperar[id];      // respuesta que llega tarde
        const medida = medidas[id];
        if (!medida) throw new Error('sin red');
        return {ok: true, json: async () => ({width: medida[0], height: medida[1]})};
    };
    const contexto = {window, document, fetch, setTimeout, clearTimeout, AbortController, URL, encodeURIComponent, decodeURIComponent};
    vm.createContext(contexto);
    vm.runInContext(fuente, contexto);
    return {
        api: window.LSPediaMedia,
        almacen,
        nuevaCaja(id) { const caja = {style: {aspectRatio: ''}}; wraps[id] = caja; return caja; },
        quitarCaja(id) { delete wraps[id]; }
    };
}

test('un video desconocido nace en 16/9 y toma su proporción real al llegar la respuesta', async () => {
    const e = entorno({medidas: {[A]: [113, 200]}});
    const caja = e.nuevaCaja('caja');
    const promesa = e.api.ajustarAspecto('caja', A);
    assert.equal(caja.style.aspectRatio, '16 / 9');
    assert.equal(await promesa, true);
    assert.equal(caja.style.aspectRatio, '113 / 200');
});

test('al volver a abrir el mismo video la caja nace ya con su proporción real', async () => {
    const e = entorno({medidas: {[A]: [113, 200], [B]: [200, 113]}});
    e.nuevaCaja('caja');
    await e.api.ajustarAspecto('caja', A);
    e.nuevaCaja('caja');
    await e.api.ajustarAspecto('caja', B);          // el último visto es horizontal…
    const caja = e.nuevaCaja('caja');
    const promesa = e.api.ajustarAspecto('caja', A);  // …pero A ya se sabe vertical
    assert.equal(caja.style.aspectRatio, '113 / 200', 'debe estar puesta antes de esperar la red');
    await promesa;
    assert.equal(caja.style.aspectRatio, '113 / 200');
});

test('un video distinto arranca con la última proporción conocida', async () => {
    const e = entorno({medidas: {[A]: [113, 200], [B]: [113, 200]}});
    e.nuevaCaja('caja');
    await e.api.ajustarAspecto('caja', A);
    const caja = e.nuevaCaja('caja');
    const promesa = e.api.ajustarAspecto('caja', B);
    assert.equal(caja.style.aspectRatio, '113 / 200', 'antes de esperar la red');
    await promesa;
    assert.equal(caja.style.aspectRatio, '113 / 200');
});

test('en una visita nueva se recuerda la última proporción', async () => {
    const almacen = {};
    const antes = entorno({almacen, medidas: {[A]: [113, 200]}});
    antes.nuevaCaja('caja');
    await antes.api.ajustarAspecto('caja', A);
    assert.equal(almacen[CLAVE], '113 / 200');

    const despues = entorno({almacen, medidas: {[B]: [113, 200]}});
    const caja = despues.nuevaCaja('caja');
    const promesa = despues.api.ajustarAspecto('caja', B);
    assert.equal(caja.style.aspectRatio, '113 / 200');
    await promesa;
});

test('si la proporción era solo una suposición y YouTube no responde, vuelve a 16/9', async () => {
    const e = entorno({medidas: {[A]: [113, 200]}});
    e.nuevaCaja('caja');
    await e.api.ajustarAspecto('caja', A);
    const caja = e.nuevaCaja('caja');
    const promesa = e.api.ajustarAspecto('caja', B);   // B no responde
    assert.equal(caja.style.aspectRatio, '113 / 200');
    assert.equal(await promesa, false);
    assert.equal(caja.style.aspectRatio, '16 / 9');
});

test('un valor corrupto o absurdo guardado en el navegador se ignora', async () => {
    for (const basura of ['basura', '0 / 0', '99999 / 1', '1 / 99999', '-5 / 9', '113 / 200 / 3', '']) {
        const e = entorno({almacen: {[CLAVE]: basura}, medidas: {[A]: [200, 113]}});
        const caja = e.nuevaCaja('caja');
        const promesa = e.api.ajustarAspecto('caja', A);
        assert.equal(caja.style.aspectRatio, '16 / 9', 'valor guardado: ' + JSON.stringify(basura));
        await promesa;
    }
});

test('si el almacenamiento del navegador está bloqueado, todo sigue funcionando', async () => {
    const e = entorno({almacenRoto: true, medidas: {[A]: [113, 200]}});
    const caja = e.nuevaCaja('caja');
    const promesa = e.api.ajustarAspecto('caja', A);
    assert.equal(caja.style.aspectRatio, '16 / 9');
    assert.equal(await promesa, true);
    assert.equal(caja.style.aspectRatio, '113 / 200');
});

test('si la ficha se reemplazó mientras llegaba la respuesta, no falla y avisa con false', async () => {
    const e = entorno({medidas: {[A]: [113, 200]}});
    e.nuevaCaja('caja');
    const promesa = e.api.ajustarAspecto('caja', A);
    e.quitarCaja('caja');
    assert.equal(await promesa, false);
});

// Si el usuario abre otra ficha antes de que llegue la respuesta de la anterior,
// esa respuesta tardía no debe tocar la caja del video nuevo (ni para cambiarle la
// proporción ni para devolverla a 16/9).
test('una respuesta tardía de un video anterior no pisa la proporción del video actual', async () => {
    let soltarA;
    const esperaA = new Promise(resolver => { soltarA = resolver; });
    const e = entorno({medidas: {[A]: [200, 113], [B]: [113, 200]}, esperar: {[A]: esperaA}});
    e.nuevaCaja('caja');
    const pedidoA = e.api.ajustarAspecto('caja', A);      // queda esperando
    const cajaNueva = e.nuevaCaja('caja');                // la ficha se reemplazó
    await e.api.ajustarAspecto('caja', B);
    assert.equal(cajaNueva.style.aspectRatio, '113 / 200');
    soltarA();
    assert.equal(await pedidoA, false);
    assert.equal(cajaNueva.style.aspectRatio, '113 / 200', 'la respuesta vieja no debe cambiarla');
});

test('si el video anterior falla tarde, la caja del video actual no vuelve a 16/9', async () => {
    const C = 'CCCCCCCCCCC';
    let soltarA;
    const esperaA = new Promise(resolver => { soltarA = resolver; });
    // A no tiene medidas (YouTube no responde) y tarda; C y B sí responden.
    const e = entorno({medidas: {[C]: [113, 200], [B]: [200, 113]}, esperar: {[A]: esperaA}});
    e.nuevaCaja('caja');
    await e.api.ajustarAspecto('caja', C);                 // deja una "última proporción" conocida
    e.nuevaCaja('caja');
    const pedidoA = e.api.ajustarAspecto('caja', A);       // arranca con esa suposición y se queda esperando
    const cajaNueva = e.nuevaCaja('caja');
    await e.api.ajustarAspecto('caja', B);
    assert.equal(cajaNueva.style.aspectRatio, '200 / 113');
    soltarA();
    assert.equal(await pedidoA, false);
    assert.equal(cajaNueva.style.aspectRatio, '200 / 113', 'el fallo viejo no debe cambiarla');
});

test('si la caja se reemplazó pero sigue siendo el mismo video, la respuesta llega a la caja nueva', async () => {
    let soltarA;
    const esperaA = new Promise(resolver => { soltarA = resolver; });
    const e = entorno({medidas: {[A]: [113, 200]}, esperar: {[A]: esperaA}});
    e.nuevaCaja('caja');
    const pedido = e.api.ajustarAspecto('caja', A);
    const cajaNueva = e.nuevaCaja('caja');                 // misma ficha, redibujada
    soltarA();
    assert.equal(await pedido, true);
    assert.equal(cajaNueva.style.aspectRatio, '113 / 200');
});

test('una respuesta tardía enseña la proporción de su video, sin cambiar la "última vista"', async () => {
    const D = 'DDDDDDDDDDD';
    let soltarA;
    const esperaA = new Promise(resolver => { soltarA = resolver; });
    const e = entorno({medidas: {[A]: [200, 113], [B]: [113, 200], [D]: [113, 200]}, esperar: {[A]: esperaA}});
    e.nuevaCaja('caja');
    const pedidoA = e.api.ajustarAspecto('caja', A);       // A tarda
    e.nuevaCaja('caja');
    await e.api.ajustarAspecto('caja', B);                 // lo último que se ve es vertical
    soltarA();
    await pedidoA;

    const cajaD = e.nuevaCaja('caja');
    const pedidoD = e.api.ajustarAspecto('caja', D);
    assert.equal(cajaD.style.aspectRatio, '113 / 200', 'un video nuevo usa la última vista (B), no la de la respuesta tardía');
    await pedidoD;

    const cajaA = e.nuevaCaja('caja');
    const pedidoA2 = e.api.ajustarAspecto('caja', A);
    assert.equal(cajaA.style.aspectRatio, '200 / 113', 'pero A ya se sabe horizontal');
    await pedidoA2;
});
