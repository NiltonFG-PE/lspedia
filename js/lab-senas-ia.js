import { HandLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const STORAGE_KEY = 'lspedia_senas_ia_muestras_v1';
const FRAMES_MUESTRA = 24;
const INTERVALO_MS = 70;
const MAX_MUESTRAS = 300;
const CONEXIONES = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],[0,17]
];

const $ = (id) => document.getElementById(id);
const ui = {
  video: $('videoSenas'), canvas: $('canvasSenas'), estado: $('estadoSenas'),
  btnCamara: $('btnCamaraSenas'), btnDetener: $('btnDetenerSenas'),
  btnMuestra: $('btnGuardarMuestraSenas'), btnReconocer: $('btnReconocerSenas'),
  btnExportar: $('btnExportarSenas'), btnBorrarTodo: $('btnBorrarMuestrasSenas'),
  etiqueta: $('etiquetaSena'), progreso: $('progresoMuestraSenas'),
  resultados: $('resultadosSenas'), lista: $('listaMuestrasSenas'),
  contador: $('contadorMuestrasSenas')
};

let detector = null;
let stream = null;
let activo = false;
let ultimoProceso = 0;
let ultimoTiempoVideo = -1;
let rafId = 0;
let captura = null;
let ventanaActual = [];
let muestras = cargarMuestras();

function estado(texto, tipo = 'info') {
  if (!ui.estado) return;
  ui.estado.textContent = texto;
  ui.estado.dataset.tipo = tipo;
}

function etiquetaValida(valor) {
  return String(valor || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

function cargarMuestras() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(x => x && typeof x.etiqueta === 'string' && Array.isArray(x.frames));
  } catch (_e) {
    return [];
  }
}

function persistirMuestras() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(muestras.slice(-MAX_MUESTRAS)));
    return true;
  } catch (_e) {
    estado('No se pudieron guardar más muestras en este dispositivo.', 'error');
    return false;
  }
}

async function prepararDetector() {
  if (detector) return detector;
  estado('Cargando detector de manos…');
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  detector = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.55,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  return detector;
}

async function iniciarCamara() {
  if (activo) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    estado('Este navegador no permite usar la cámara desde esta página.', 'error');
    return;
  }
  try {
    await prepararDetector();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    ui.video.srcObject = stream;
    await ui.video.play();
    activo = true;
    ultimoTiempoVideo = -1;
    ventanaActual = [];
    ui.btnCamara.disabled = true;
    ui.btnDetener.disabled = false;
    ui.btnMuestra.disabled = false;
    ui.btnReconocer.disabled = false;
    ajustarCanvas();
    estado('Cámara activa. Coloca las manos dentro del cuadro.');
    bucle();
  } catch (error) {
    console.error('[LSPedia señas IA]', error);
    estado('No se pudo iniciar la cámara o el detector. Revisa el permiso de cámara y la conexión.', 'error');
  }
}

function detenerCamara() {
  activo = false;
  captura = null;
  ventanaActual = [];
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  if (ui.video) ui.video.srcObject = null;
  limpiarCanvas();
  ui.btnCamara.disabled = false;
  ui.btnDetener.disabled = true;
  ui.btnMuestra.disabled = true;
  ui.btnReconocer.disabled = true;
  ui.progreso.textContent = '';
  estado('Cámara detenida.');
}

function ajustarCanvas() {
  const w = ui.video.videoWidth || 1280;
  const h = ui.video.videoHeight || 720;
  if (ui.canvas.width !== w) ui.canvas.width = w;
  if (ui.canvas.height !== h) ui.canvas.height = h;
}

function limpiarCanvas() {
  const ctx = ui.canvas && ui.canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
}

function dibujar(resultado) {
  ajustarCanvas();
  const ctx = ui.canvas.getContext('2d');
  ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
  const manos = Array.isArray(resultado && resultado.landmarks) ? resultado.landmarks : [];
  ctx.lineWidth = Math.max(2, ui.canvas.width / 420);
  ctx.strokeStyle = 'rgba(245,184,24,.95)';
  ctx.fillStyle = 'rgba(15,23,42,.95)';
  manos.forEach(mano => {
    CONEXIONES.forEach(([a,b]) => {
      const p = mano[a], q = mano[b];
      if (!p || !q) return;
      ctx.beginPath();
      ctx.moveTo(p.x * ui.canvas.width, p.y * ui.canvas.height);
      ctx.lineTo(q.x * ui.canvas.width, q.y * ui.canvas.height);
      ctx.stroke();
    });
    mano.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * ui.canvas.width, p.y * ui.canvas.height, Math.max(3, ui.canvas.width / 230), 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function vectorNormalizado(resultado) {
  const manos = Array.isArray(resultado && resultado.landmarks) ? resultado.landmarks.filter(x => Array.isArray(x) && x.length >= 21) : [];
  if (!manos.length) return null;

  // Orden espacial estable para no depender del orden que devuelve el detector.
  manos.sort((a,b) => (a[0]?.x || 0) - (b[0]?.x || 0));
  const usadas = manos.slice(0, 2);
  const munecas = usadas.map(m => m[0]);
  const cx = munecas.reduce((s,p) => s + p.x, 0) / munecas.length;
  const cy = munecas.reduce((s,p) => s + p.y, 0) / munecas.length;
  const cz = munecas.reduce((s,p) => s + (p.z || 0), 0) / munecas.length;

  let escala = 0;
  usadas.forEach(mano => mano.forEach(p => {
    escala = Math.max(escala, Math.hypot(p.x - cx, p.y - cy, (p.z || 0) - cz));
  }));
  escala = Math.max(escala, 0.05);

  const salida = [];
  usadas.forEach(mano => mano.slice(0,21).forEach(p => {
    salida.push((p.x - cx) / escala, (p.y - cy) / escala, ((p.z || 0) - cz) / escala);
  }));
  while (salida.length < 126) salida.push(0);
  salida.push(usadas.length === 2 ? 1 : 0);
  return salida;
}

function distanciaVector(a, b) {
  if (!a || !b || a.length !== b.length) return 99;
  let suma = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    suma += d * d;
  }
  return Math.sqrt(suma / a.length);
}

// Dynamic Time Warping simple: permite que una misma seña se haga un poco
// más rápido o más lento sin exigir que cada fotograma coincida exactamente.
function distanciaSecuencia(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) return 99;
  const n = a.length, m = b.length;
  let anterior = new Array(m + 1).fill(Infinity);
  anterior[0] = 0;
  for (let i = 1; i <= n; i++) {
    const actual = new Array(m + 1).fill(Infinity);
    for (let j = 1; j <= m; j++) {
      const coste = distanciaVector(a[i - 1], b[j - 1]);
      actual[j] = coste + Math.min(actual[j - 1], anterior[j], anterior[j - 1]);
    }
    anterior = actual;
  }
  return anterior[m] / (n + m);
}

function procesarResultado(resultado) {
  dibujar(resultado);
  const vector = vectorNormalizado(resultado);
  if (!vector) {
    if (captura) ui.progreso.textContent = 'Mantén al menos una mano visible.';
    return;
  }

  ventanaActual.push(vector);
  if (ventanaActual.length > FRAMES_MUESTRA) ventanaActual.shift();

  if (captura) {
    captura.frames.push(vector);
    ui.progreso.textContent = `Grabando ${captura.frames.length}/${FRAMES_MUESTRA}…`;
    if (captura.frames.length >= FRAMES_MUESTRA) finalizarCaptura();
  }
}

function bucle(tiempo = performance.now()) {
  if (!activo) return;
  rafId = requestAnimationFrame(bucle);
  if (!detector || ui.video.readyState < 2) return;
  if (tiempo - ultimoProceso < INTERVALO_MS) return;
  if (ui.video.currentTime === ultimoTiempoVideo) return;
  ultimoProceso = tiempo;
  ultimoTiempoVideo = ui.video.currentTime;
  try {
    const resultado = detector.detectForVideo(ui.video, tiempo);
    procesarResultado(resultado);
  } catch (error) {
    console.warn('[LSPedia señas IA] Fotograma omitido:', error);
  }
}

function iniciarCaptura() {
  const etiqueta = etiquetaValida(ui.etiqueta.value);
  if (!activo) return estado('Activa la cámara primero.', 'error');
  if (!etiqueta) return estado('Escribe el concepto de la seña antes de grabar.', 'error');
  if (captura) return;
  captura = { etiqueta, frames: [] };
  ui.btnMuestra.disabled = true;
  ui.progreso.textContent = `Grabando 0/${FRAMES_MUESTRA}…`;
  estado(`Grabando muestra de “${etiqueta}”. Haz la seña de forma natural.`);
}

function finalizarCaptura() {
  if (!captura) return;
  const nueva = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)),
    etiqueta: captura.etiqueta,
    creada: new Date().toISOString(),
    frames: captura.frames.slice(0, FRAMES_MUESTRA)
  };
  muestras.push(nueva);
  if (muestras.length > MAX_MUESTRAS) muestras = muestras.slice(-MAX_MUESTRAS);
  captura = null;
  ui.btnMuestra.disabled = false;
  ui.progreso.textContent = 'Muestra guardada en este dispositivo.';
  persistirMuestras();
  renderMuestras();
  estado(`Muestra de “${nueva.etiqueta}” guardada. Para mejorar el reconocimiento conviene grabar varias muestras del mismo concepto.`, 'ok');
}

function reconocer() {
  if (!activo) return estado('Activa la cámara primero.', 'error');
  if (ventanaActual.length < Math.floor(FRAMES_MUESTRA * 0.7)) {
    return estado('Mantén la seña visible un momento antes de reconocer.', 'error');
  }
  if (!muestras.length) return estado('Todavía no hay muestras de referencia.', 'error');

  const porEtiqueta = new Map();
  muestras.forEach(m => {
    const d = distanciaSecuencia(ventanaActual, m.frames);
    const previa = porEtiqueta.get(m.etiqueta);
    if (previa == null || d < previa) porEtiqueta.set(m.etiqueta, d);
  });
  const top = [...porEtiqueta.entries()].sort((a,b) => a[1] - b[1]).slice(0,3);
  renderResultados(top);
  estado('Comparación terminada. Los resultados son candidatos, no una traducción definitiva.', 'ok');
}

function renderResultados(top) {
  ui.resultados.textContent = '';
  if (!top.length) {
    ui.resultados.textContent = 'Sin candidatos.';
    return;
  }
  top.forEach(([etiqueta, distancia], i) => {
    const a = document.createElement('a');
    a.className = 'resultado-sena';
    a.href = './?p=' + encodeURIComponent(etiqueta);
    const puesto = document.createElement('strong');
    puesto.textContent = `${i + 1}. ${etiqueta}`;
    const detalle = document.createElement('span');
    detalle.textContent = `distancia ${distancia.toFixed(4)}`;
    a.append(puesto, detalle);
    ui.resultados.appendChild(a);
  });
}

function renderMuestras() {
  ui.lista.textContent = '';
  const grupos = new Map();
  muestras.forEach(m => grupos.set(m.etiqueta, (grupos.get(m.etiqueta) || 0) + 1));
  ui.contador.textContent = `${muestras.length} muestra${muestras.length === 1 ? '' : 's'} · ${grupos.size} concepto${grupos.size === 1 ? '' : 's'}`;

  [...grupos.entries()].sort((a,b) => a[0].localeCompare(b[0], 'es')).forEach(([etiqueta, total]) => {
    const fila = document.createElement('div');
    fila.className = 'muestra-sena';
    const texto = document.createElement('span');
    texto.textContent = `${etiqueta} (${total})`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Eliminar';
    btn.addEventListener('click', () => {
      muestras = muestras.filter(m => m.etiqueta !== etiqueta);
      persistirMuestras();
      renderMuestras();
      estado(`Muestras de “${etiqueta}” eliminadas.`);
    });
    fila.append(texto, btn);
    ui.lista.appendChild(fila);
  });
}

function exportarMuestras() {
  if (!muestras.length) return estado('No hay muestras para exportar.', 'error');
  const data = {
    formato: 'lspedia-senas-ia-v1',
    exportado: new Date().toISOString(),
    framesPorMuestra: FRAMES_MUESTRA,
    muestras
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lspedia-senas-muestras.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  estado('Dataset exportado.');
}

function borrarTodo() {
  if (!muestras.length) return;
  if (!confirm('¿Eliminar todas las muestras guardadas en este dispositivo?')) return;
  muestras = [];
  localStorage.removeItem(STORAGE_KEY);
  renderMuestras();
  ui.resultados.textContent = '';
  estado('Todas las muestras locales fueron eliminadas.');
}

ui.btnCamara?.addEventListener('click', iniciarCamara);
ui.btnDetener?.addEventListener('click', detenerCamara);
ui.btnMuestra?.addEventListener('click', iniciarCaptura);
ui.btnReconocer?.addEventListener('click', reconocer);
ui.btnExportar?.addEventListener('click', exportarMuestras);
ui.btnBorrarTodo?.addEventListener('click', borrarTodo);
window.addEventListener('pagehide', detenerCamara, { once: true });

renderMuestras();
estado('Laboratorio listo. La cámara permanece apagada hasta que la actives.');
