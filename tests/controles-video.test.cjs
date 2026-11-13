const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// configurarControlesVideo() engancha los clics de los botones del reproductor y corre cada vez
// que un reproductor avisa "listo" (onReady). Cuando la ficha se dibuja dos veces seguidas (por
// ejemplo al abrir un enlace compartido), llegan dos avisos sobre los MISMOS botones y cada clic
// quedaba enganchado dos veces: pausar/iniciar se anulaba solo, ⏪/⏩ saltaban el doble y el botón
// de pantalla completa abría y cerraba a la vez (el video quedaba a pantalla completa sin su barra).
const fuente = fs.readFileSync(path.join(__dirname, '../js/script.js'), 'utf8');
const inicio = fuente.indexOf('function configurarControlesVideo() {');
const fin = fuente.indexOf('function cambiarVelocidadPalabra(delta) {');
assert.ok(inicio > 0 && fin > inicio, 'no se encontró configurarControlesVideo() en js/script.js');
const trozo = fuente.slice(inicio, fin);

const IDS = ['btnRetroceder10', 'btnAvanzar10', 'btnPlayPause', 'btnReiniciarPalabra',
    'btnPalabraVelocidadLenta', 'btnPalabraVelocidadRapida', 'btnPalabraFullscreen'];

function boton(id) {
    return {id, dataset: {}, clics: [], addEventListener(tipo, f) { if (tipo === 'click') this.clics.push(f); }};
}

function entorno() {
    const botones = {};
    const nuevos = () => { for (const id of IDS) botones[id] = boton(id); };
    nuevos();
    const llamadas = [];
    const jugador = {
        setPlaybackRate: v => llamadas.push(['velocidad', v]),
        getCurrentTime: () => 10, getDuration: () => 20, getPlayerState: () => 2,
        seekTo: t => llamadas.push(['seek', t]), playVideo: () => llamadas.push(['play']), pauseVideo: () => llamadas.push(['pause'])
    };
    const ctx = {
        document: {getElementById: id => botones[id] || null},
        ytPlayerPalabra: jugador,
        VELOCIDADES_PALABRA: [0.5, 1, 1.5],
        palabraVelocidadIndex: 0,
        actualizarLabelVelocidadPalabra() {},
        toggleVideoPalabraPantallaCompleta: (...a) => llamadas.push(['pantalla-completa', ...a]),
        cambiarVelocidadPalabra: d => llamadas.push(['velocidad-paso', d]),
        YT: {PlayerState: {PLAYING: 1}},
        Math
    };
    vm.createContext(ctx);
    vm.runInContext(trozo + '\nthis.configurar = configurarControlesVideo;', ctx);
    return {configurar: ctx.configurar, botones, nuevos, llamadas, ctx};
}

test('cada botón recibe un solo clic aunque el reproductor avise "listo" dos veces', () => {
    const e = entorno();
    e.configurar();
    e.configurar();
    for (const id of IDS) assert.equal(e.botones[id].clics.length, 1, id + ' quedó con ' + e.botones[id].clics.length + ' clics enganchados');
});

test('al tocar pantalla completa se pide abrir una sola vez', () => {
    const e = entorno();
    e.configurar();
    e.configurar();
    e.botones.btnPalabraFullscreen.clics.forEach(f => f());
    assert.deepEqual(e.llamadas.filter(l => l[0] === 'pantalla-completa'), [['pantalla-completa', 'reproductorPalabraWrap', 'btnPalabraFullscreen']]);
});

test('una ficha nueva (botones nuevos) sí recibe sus propios clics', () => {
    const e = entorno();
    e.configurar();
    e.nuevos();                                  // la ficha se dibujó de nuevo: botones nuevos
    e.configurar();
    for (const id of IDS) assert.equal(e.botones[id].clics.length, 1, id);
});

test('cada aviso de "listo" vuelve a dejar el video en 1x', () => {
    const e = entorno();
    e.configurar();
    e.configurar();
    assert.deepEqual(e.llamadas.filter(l => l[0] === 'velocidad'), [['velocidad', 1], ['velocidad', 1]]);
    assert.equal(e.ctx.palabraVelocidadIndex, 1);
});

test('sin reproductor o con algún botón ausente no engancha nada; con todo listo, engancha una vez', () => {
    const e = entorno();
    const jugador = e.ctx.ytPlayerPalabra;
    e.ctx.ytPlayerPalabra = null;
    e.configurar();
    for (const id of IDS) assert.equal(e.botones[id].clics.length, 0, id + ' (sin reproductor)');
    e.ctx.ytPlayerPalabra = jugador;
    delete e.botones.btnPlayPause;
    e.configurar();
    for (const id of IDS.filter(x => x !== 'btnPlayPause')) assert.equal(e.botones[id].clics.length, 0, id + ' (falta un botón)');
    e.botones.btnPlayPause = boton('btnPlayPause');
    e.configurar();
    for (const id of IDS) assert.equal(e.botones[id].clics.length, 1, id + ' (todo listo)');
});

test('el botón de pausar/iniciar alterna una sola vez por clic', () => {
    const e = entorno();
    e.configurar();
    e.configurar();
    e.botones.btnPlayPause.clics.forEach(f => f());      // el reproductor está en pausa (estado 2) → debe iniciar
    assert.deepEqual(e.llamadas.filter(l => l[0] === 'play' || l[0] === 'pause'), [['play']]);
});
