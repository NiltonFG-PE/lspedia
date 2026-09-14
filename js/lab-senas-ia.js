import { HandLandmarker, PoseLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const DATASET_CENTRAL_URL = 'data/senas-ia-dataset.json?v=20260914-4';
const STORAGE_KEY = 'lspedia_senas_ia_muestras_v2';
const STORAGE_KEY_ANTERIOR = 'lspedia_senas_ia_muestras_v1';
const FRAMES_MUESTRA = 24;
const DIMENSION_VECTOR_LEGACY = 127;
const DIMENSION_VECTOR_POSE = 161;
const POSE_INDICES = [0, 9, 10, 11, 12, 13, 14, 15, 16, 23, 24];
const INTERVALO_MS = 70;
const MAX_MUESTRAS_LOCALES = 300;
const MAX_EVALUACION = 120;
const CONEXIONES = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],[0,17]
];
const CONEXIONES_POSE = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],[0,11],[0,12]
];

const $ = (id) => document.getElementById(id);
const ui = {
  video: $('videoSenas'), canvas: $('canvasSenas'), estado: $('estadoSenas'),
  btnCamara: $('btnCamaraSenas'), btnDetener: $('btnDetenerSenas'),
  btnMuestra: $('btnGuardarMuestraSenas'), btnReconocer: $('btnReconocerSenas'),
  btnExportar: $('btnExportarSenas'), btnImportar: $('btnImportarSenas'),
  btnEvaluar: $('btnEvaluarSenas'), btnBorrarTodo: $('btnBorrarMuestrasSenas'),
  archivoImportar: $('archivoImportarSenas'), etiqueta: $('etiquetaSena'),
  progreso: $('progresoMuestraSenas'), resultados: $('resultadosSenas'),
  lista: $('listaMuestrasSenas'), contador: $('contadorMuestrasSenas'),
  central: $('estadoDatasetCentralSenas'), calidad: $('calidadDatasetSenas')
};

let detector = null;
let detectorPose = null;
let stream = null;
let activo = false;
let ultimoProceso = 0;
let ultimoProcesoPose = 0;
let ultimoResultadoPose = null;
let ultimoTiempoVideo = -1;
let rafId = 0;
let captura = null;
let ventanaActual = [];
let muestrasLocales = cargarMuestrasLocales();
let muestrasCentrales = [];
let evaluando = false;

async function conTimeout(promesa, timeoutMs, mensaje) {
  let temporizador = null;
  try {
    return await Promise.race([
      promesa,
      new Promise((_, reject) => {
        temporizador = setTimeout(() => reject(new Error(mensaje || 'Tiempo de espera agotado.')), timeoutMs);
      })
    ]);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}

async function leerJsonConTimeout(url, timeoutMs = 6500) {
  const controlador = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let temporizador = null;
  try {
    const promesaFetch = fetch(url, controlador ? { cache: 'no-store', signal: controlador.signal } : { cache: 'no-store' });
    const respuesta = await Promise.race([
      promesaFetch,
      new Promise((_, reject) => {
        temporizador = setTimeout(() => {
          if (controlador) {
            try { controlador.abort(); } catch (_e) {}
          }
          reject(new Error('Tiempo de espera agotado al cargar el dataset central.'));
        }, timeoutMs);
      })
    ]);
    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
    return await respuesta.json();
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}

function estado(texto, tipo = 'info') {
  if (!ui.estado) return;
  ui.estado.textContent = texto;
  ui.estado.dataset.tipo = tipo;
}

function etiquetaValida(valor) {
  return String(valor || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

function idSeguro(valor) {
  return String(valor || '').replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 120);
}

function vectorValido(vector) {
  return Array.isArray(vector) &&
    (vector.length === DIMENSION_VECTOR_LEGACY || vector.length === DIMENSION_VECTOR_POSE) &&
    vector.every(n => Number.isFinite(Number(n)) && Math.abs(Number(n)) < 1000);
}

function muestraValida(muestra) {
  if (!muestra || !etiquetaValida(muestra.etiqueta) || !Array.isArray(muestra.frames)) return false;
  if (muestra.frames.length < 8 || muestra.frames.length > 80) return false;
  return muestra.frames.every(vectorValido);
}

function normalizarMuestra(muestra, origen = 'local') {
  if (!muestraValida(muestra)) return null;
  return {
    id: idSeguro(muestra.id) || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)),
    etiqueta: etiquetaValida(muestra.etiqueta),
    creada: String(muestra.creada || new Date().toISOString()).slice(0, 40),
    origen,
    version: muestra.frames.some(frame => Array.isArray(frame) && frame.length >= DIMENSION_VECTOR_POSE) ? 3 : 2,
    frames: muestra.frames.map(frame => frame.map(Number))
  };
}

function cargarMuestrasLocales() {
  for (const key of [STORAGE_KEY, STORAGE_KEY_ANTERIOR]) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(data)) continue;
      const limpias = data.map(x => normalizarMuestra(x, 'local')).filter(Boolean);
      if (limpias.length) {
        if (key !== STORAGE_KEY) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(limpias)); } catch (_e) {}
        }
        return limpias.slice(-MAX_MUESTRAS_LOCALES);
      }
    } catch (_e) {}
  }
  return [];
}

function persistirMuestras() {
  try {
    muestrasLocales = muestrasLocales.slice(-MAX_MUESTRAS_LOCALES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(muestrasLocales));
    return true;
  } catch (_e) {
    estado('No se pudieron guardar más muestras en este dispositivo.', 'error');
    return false;
  }
}

function todasLasMuestras() {
  const mapa = new Map();
  [...muestrasCentrales, ...muestrasLocales].forEach(m => {
    if (m && m.id) mapa.set(m.id, m);
  });
  return [...mapa.values()];
}

async function cargarDatasetCentral() {
  if (ui.central) ui.central.textContent = 'Dataset central: comprobando…';
  try {
    const data = await leerJsonConTimeout(DATASET_CENTRAL_URL, 6500);
    const lista = Array.isArray(data && data.muestras) ? data.muestras : [];
    muestrasCentrales = lista.map(x => normalizarMuestra(x, 'central')).filter(Boolean);
    if (ui.central) {
      ui.central.textContent = muestrasCentrales.length
        ? `Dataset central: ${muestrasCentrales.length} muestras revisadas.`
        : 'Dataset central preparado; todavía no contiene muestras revisadas.';
    }
  } catch (error) {
    console.warn('[LSPedia señas IA] Dataset central no disponible:', error);
    muestrasCentrales = [];
    if (ui.central) ui.central.textContent = 'Dataset central no disponible; se usarán las muestras locales.';
  }
  renderMuestras();
}

async function prepararDetector() {
  if (detector) return detector;
  estado('Cargando detector de manos y posición corporal…');
  const vision = await conTimeout(
    FilesetResolver.forVisionTasks(WASM_URL),
    15000,
    'El motor de visión tardó demasiado en cargar.'
  );
  detector = await conTimeout(
    HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    }),
    20000,
    'El modelo de manos tardó demasiado en cargar.'
  );

  try {
    detectorPose = await conTimeout(
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.45,
        minPosePresenceConfidence: 0.45,
        minTrackingConfidence: 0.45,
        outputSegmentationMasks: false
      }),
      20000,
      'El modelo corporal tardó demasiado en cargar.'
    );
  } catch (error) {
    detectorPose = null;
    console.warn('[LSPedia señas IA] Pose no disponible; se continuará con manos:', error);
  }
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


function dibujarPose(resultadoPose) {
  const pose = Array.isArray(resultadoPose && resultadoPose.landmarks)
    ? resultadoPose.landmarks[0]
    : null;
  if (!Array.isArray(pose) || pose.length < 25) return;
  const ctx = ui.canvas.getContext('2d');
  ctx.lineWidth = Math.max(2, ui.canvas.width / 500);
  ctx.strokeStyle = 'rgba(16,185,129,.75)';
  ctx.fillStyle = 'rgba(16,185,129,.92)';
  CONEXIONES_POSE.forEach(([a,b]) => {
    const p = pose[a], q = pose[b];
    if (!p || !q) return;
    ctx.beginPath();
    ctx.moveTo(p.x * ui.canvas.width, p.y * ui.canvas.height);
    ctx.lineTo(q.x * ui.canvas.width, q.y * ui.canvas.height);
    ctx.stroke();
  });
  POSE_INDICES.forEach(indice => {
    const p = pose[indice];
    if (!p) return;
    ctx.beginPath();
    ctx.arc(p.x * ui.canvas.width, p.y * ui.canvas.height, Math.max(2, ui.canvas.width / 300), 0, Math.PI * 2);
    ctx.fill();
  });
}

function vectorNormalizado(resultado, resultadoPose) {
  const manos = Array.isArray(resultado && resultado.landmarks)
    ? resultado.landmarks.filter(x => Array.isArray(x) && x.length >= 21)
    : [];
  if (!manos.length) return null;

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

  const pose = Array.isArray(resultadoPose && resultadoPose.landmarks)
    ? resultadoPose.landmarks[0]
    : null;
  if (!Array.isArray(pose) || pose.length < 25 || !pose[11] || !pose[12]) return salida;

  const hombroIzq = pose[11];
  const hombroDer = pose[12];
  const pcx = (hombroIzq.x + hombroDer.x) / 2;
  const pcy = (hombroIzq.y + hombroDer.y) / 2;
  const pcz = ((hombroIzq.z || 0) + (hombroDer.z || 0)) / 2;
  const escalaPose = Math.max(
    Math.hypot(
      hombroIzq.x - hombroDer.x,
      hombroIzq.y - hombroDer.y,
      (hombroIzq.z || 0) - (hombroDer.z || 0)
    ),
    0.05
  );

  POSE_INDICES.forEach(indice => {
    const p = pose[indice] || { x: pcx, y: pcy, z: pcz };
    const limitar = valor => Math.max(-6, Math.min(6, valor));
    salida.push(
      limitar((p.x - pcx) / escalaPose),
      limitar((p.y - pcy) / escalaPose),
      limitar(((p.z || 0) - pcz) / escalaPose)
    );
  });
  salida.push(1);
  return salida;
}

function distanciaVector(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) ||
      a.length < DIMENSION_VECTOR_LEGACY || b.length < DIMENSION_VECTOR_LEGACY) return 99;

  const rms = (inicio, fin) => {
    let suma = 0;
    let n = 0;
    for (let i = inicio; i < fin; i++) {
      const d = Number(a[i]) - Number(b[i]);
      suma += d * d;
      n += 1;
    }
    return n ? Math.sqrt(suma / n) : 99;
  };

  const manos = rms(0, DIMENSION_VECTOR_LEGACY);
  if (a.length >= DIMENSION_VECTOR_POSE && b.length >= DIMENSION_VECTOR_POSE) {
    const pose = rms(DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE);
    return manos * 0.78 + pose * 0.22;
  }
  return manos;
}

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

function procesarResultado(resultado, resultadoPose) {
  dibujar(resultado);
  dibujarPose(resultadoPose);
  const vector = vectorNormalizado(resultado, resultadoPose);
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
    if (detectorPose && tiempo - ultimoProcesoPose >= 140) {
      try {
        ultimoResultadoPose = detectorPose.detectForVideo(ui.video, tiempo);
        ultimoProcesoPose = tiempo;
      } catch (errorPose) {
        console.warn('[LSPedia señas IA] Fotograma corporal omitido:', errorPose);
      }
    }
    procesarResultado(resultado, ultimoResultadoPose);
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
  const nueva = normalizarMuestra({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2),
    etiqueta: captura.etiqueta,
    creada: new Date().toISOString(),
    frames: captura.frames.slice(0, FRAMES_MUESTRA)
  }, 'local');
  captura = null;
  ui.btnMuestra.disabled = false;
  if (!nueva) {
    ui.progreso.textContent = 'La muestra no pasó la validación.';
    return estado('La muestra quedó incompleta y no se guardó. Inténtalo nuevamente.', 'error');
  }
  muestrasLocales.push(nueva);
  if (muestrasLocales.length > MAX_MUESTRAS_LOCALES) muestrasLocales = muestrasLocales.slice(-MAX_MUESTRAS_LOCALES);
  ui.progreso.textContent = 'Muestra guardada en este dispositivo.';
  persistirMuestras();
  renderMuestras();
  estado(`Muestra de “${nueva.etiqueta}” guardada. Para mejorar el reconocimiento conviene grabar varias muestras del mismo concepto.`, 'ok');
}

function candidatosPara(secuencia, banco = todasLasMuestras(), excluirId = '') {
  const porEtiqueta = new Map();
  banco.forEach(m => {
    if (!m || m.id === excluirId) return;
    const d = distanciaSecuencia(secuencia, m.frames);
    const previa = porEtiqueta.get(m.etiqueta);
    if (previa == null || d < previa) porEtiqueta.set(m.etiqueta, d);
  });
  return [...porEtiqueta.entries()].sort((a,b) => a[1] - b[1]);
}

function reconocer() {
  if (!activo) return estado('Activa la cámara primero.', 'error');
  if (ventanaActual.length < Math.floor(FRAMES_MUESTRA * 0.7)) {
    return estado('Mantén la seña visible un momento antes de reconocer.', 'error');
  }
  const banco = todasLasMuestras();
  if (!banco.length) return estado('Todavía no hay muestras de referencia.', 'error');

  const top = candidatosPara(ventanaActual, banco).slice(0,3);
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

function resumenConceptos(lista) {
  const grupos = new Map();
  lista.forEach(m => {
    if (!m) return;
    const actual = grupos.get(m.etiqueta) || { total: 0, locales: 0, centrales: 0 };
    actual.total += 1;
    if (m.origen === 'central') actual.centrales += 1;
    else actual.locales += 1;
    grupos.set(m.etiqueta, actual);
  });
  return grupos;
}

function renderCalidadBasica() {
  if (!ui.calidad) return;
  const todas = todasLasMuestras();
  const grupos = resumenConceptos(todas);
  if (!todas.length) {
    ui.calidad.textContent = 'Aún no hay muestras. Para una primera prueba útil, intenta reunir al menos 5 muestras por concepto.';
    return;
  }
  const debiles = [...grupos.entries()].filter(([,v]) => v.total < 3).map(([k]) => k);
  const recomendacion = debiles.length
    ? ` Conceptos con menos de 3 muestras: ${debiles.slice(0,6).join(', ')}${debiles.length > 6 ? '…' : ''}.`
    : ' Todos los conceptos tienen al menos 3 muestras.';
  ui.calidad.textContent = `${todas.length} muestras válidas en ${grupos.size} conceptos.${recomendacion}`;
}

function renderMuestras() {
  ui.lista.textContent = '';
  const todas = todasLasMuestras();
  const grupos = resumenConceptos(todas);
  ui.contador.textContent = `${todas.length} muestra${todas.length === 1 ? '' : 's'} totales · ${muestrasLocales.length} locales · ${muestrasCentrales.length} centrales · ${grupos.size} concepto${grupos.size === 1 ? '' : 's'}`;

  [...grupos.entries()].sort((a,b) => a[0].localeCompare(b[0], 'es')).forEach(([etiqueta, info]) => {
    const fila = document.createElement('div');
    fila.className = 'muestra-sena';
    const texto = document.createElement('span');
    texto.textContent = `${etiqueta} (${info.total})`;
    fila.appendChild(texto);
    if (info.locales) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Eliminar local';
      btn.addEventListener('click', () => {
        muestrasLocales = muestrasLocales.filter(m => m.etiqueta !== etiqueta);
        persistirMuestras();
        renderMuestras();
        estado(`Muestras locales de “${etiqueta}” eliminadas.`);
      });
      fila.appendChild(btn);
    }
    ui.lista.appendChild(fila);
  });
  renderCalidadBasica();
}

function exportarMuestras() {
  if (!muestrasLocales.length) return estado('No hay muestras locales para exportar.', 'error');
  const conceptos = [...new Set(muestrasLocales.map(m => m.etiqueta))].sort((a,b) => a.localeCompare(b,'es'));
  const data = {
    formato: 'lspedia-senas-ia-v3',
    version: 3,
    exportado: new Date().toISOString(),
    framesPorMuestra: FRAMES_MUESTRA,
    vectorDimension: DIMENSION_VECTOR_POSE,
    vectorDimensionsCompatibles: [DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE],
    modeloEntrada: 'MediaPipe Hand Landmarker + Pose Landmarker',
    conceptos,
    muestras: muestrasLocales
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
  estado('Dataset local exportado.', 'ok');
}

function abrirImportacion() {
  if (!ui.archivoImportar) return;
  ui.archivoImportar.value = '';
  ui.archivoImportar.click();
}

async function importarMuestras(evento) {
  const archivo = evento && evento.target && evento.target.files ? evento.target.files[0] : null;
  if (!archivo) return;
  if (archivo.size > 15 * 1024 * 1024) return estado('El archivo JSON es demasiado grande para este laboratorio.', 'error');
  try {
    const textoArchivo = await archivo.text();
    const data = JSON.parse(textoArchivo);
    const lista = Array.isArray(data) ? data : (Array.isArray(data && data.muestras) ? data.muestras : []);
    if (!lista.length) return estado('El JSON no contiene muestras reconocibles.', 'error');

    const existentes = new Set(muestrasLocales.map(m => m.id));
    let agregadas = 0;
    let rechazadas = 0;
    lista.forEach(item => {
      const limpia = normalizarMuestra(item, 'local');
      if (!limpia) { rechazadas += 1; return; }
      if (existentes.has(limpia.id)) return;
      existentes.add(limpia.id);
      muestrasLocales.push(limpia);
      agregadas += 1;
    });
    if (muestrasLocales.length > MAX_MUESTRAS_LOCALES) muestrasLocales = muestrasLocales.slice(-MAX_MUESTRAS_LOCALES);
    persistirMuestras();
    renderMuestras();
    estado(`Importación terminada: ${agregadas} muestras añadidas${rechazadas ? ` · ${rechazadas} rechazadas por formato` : ''}.`, agregadas ? 'ok' : 'error');
  } catch (error) {
    console.error('[LSPedia señas IA] Importación:', error);
    estado('No se pudo importar el JSON. Revisa que sea un dataset válido de LSPedia.', 'error');
  }
}

function seleccionarMuestrasEvaluacion(todas) {
  if (todas.length <= MAX_EVALUACION) return todas.slice();
  const porConcepto = new Map();
  todas.forEach(m => {
    if (!porConcepto.has(m.etiqueta)) porConcepto.set(m.etiqueta, []);
    porConcepto.get(m.etiqueta).push(m);
  });
  const salida = [];
  const grupos = [...porConcepto.values()];
  let indice = 0;
  while (salida.length < MAX_EVALUACION && grupos.some(g => indice < g.length)) {
    grupos.forEach(g => {
      if (salida.length < MAX_EVALUACION && indice < g.length) salida.push(g[indice]);
    });
    indice += 1;
  }
  return salida;
}

function mostrarResultadoEvaluacion(precision, nivel, muestraNota, detalle) {
  if (!ui.calidad) return;
  ui.calidad.textContent = '';
  const fuerte = document.createElement('strong');
  fuerte.textContent = `Precisión experimental: ${Math.round(precision * 100)}%`;
  ui.calidad.appendChild(fuerte);
  ui.calidad.appendChild(document.createTextNode(` · Resultado ${nivel}.${muestraNota}`));
  if (detalle) {
    ui.calidad.appendChild(document.createElement('br'));
    ui.calidad.appendChild(document.createTextNode('Conceptos a reforzar: ' + detalle));
  }
}

async function evaluarDataset() {
  if (evaluando) return;
  const bancoCompleto = todasLasMuestras();
  const conceptos = new Set(bancoCompleto.map(m => m.etiqueta));
  if (bancoCompleto.length < 4 || conceptos.size < 2) {
    if (ui.calidad) ui.calidad.textContent = 'Para medir precisión necesitas al menos 2 conceptos y varias muestras de cada uno.';
    return;
  }

  evaluando = true;
  if (ui.btnEvaluar) ui.btnEvaluar.disabled = true;
  const banco = seleccionarMuestrasEvaluacion(bancoCompleto);
  let aciertos = 0;
  const porConcepto = new Map();

  try {
    for (let i = 0; i < banco.length; i++) {
      const muestra = banco[i];
      const candidatos = candidatosPara(muestra.frames, banco, muestra.id);
      const prediccion = candidatos.length ? candidatos[0][0] : '';
      const ok = prediccion === muestra.etiqueta;
      if (ok) aciertos += 1;
      const dato = porConcepto.get(muestra.etiqueta) || { total: 0, aciertos: 0, confusiones: new Map() };
      dato.total += 1;
      if (ok) {
        dato.aciertos += 1;
      } else if (prediccion) {
        dato.confusiones.set(prediccion, (dato.confusiones.get(prediccion) || 0) + 1);
      }
      porConcepto.set(muestra.etiqueta, dato);

      if (ui.calidad) ui.calidad.textContent = `Evaluando ${i + 1}/${banco.length}…`;
      if (i % 4 === 3) await new Promise(resolve => requestAnimationFrame(resolve));
    }

    const precision = banco.length ? aciertos / banco.length : 0;
    const peores = [...porConcepto.entries()]
      .map(([etiqueta,d]) => {
        const confusion = [...d.confusiones.entries()].sort((a,b) => b[1] - a[1])[0]?.[0] || '';
        return { etiqueta, precision: d.total ? d.aciertos / d.total : 0, total: d.total, confusion };
      })
      .sort((a,b) => a.precision - b.precision)
      .slice(0,4);
    const nivel = precision >= 0.9 ? 'muy prometedor' : precision >= 0.75 ? 'prometedor' : precision >= 0.55 ? 'todavía inestable' : 'insuficiente por ahora';
    const detalle = peores.map(x => `${x.etiqueta} ${Math.round(x.precision * 100)}%${x.confusion ? ` → suele confundirse con ${x.confusion}` : ''}`).join(' · ');
    const muestraNota = bancoCompleto.length > banco.length
      ? ` Se evaluó una muestra equilibrada de ${banco.length}/${bancoCompleto.length} para no bloquear el celular.`
      : '';
    mostrarResultadoEvaluacion(precision, nivel, muestraNota, detalle);
  } finally {
    evaluando = false;
    if (ui.btnEvaluar) ui.btnEvaluar.disabled = false;
  }
}

function borrarTodoLocal() {
  if (!muestrasLocales.length) return;
  if (!confirm('¿Eliminar todas las muestras locales guardadas en este dispositivo? El dataset central no se borra.')) return;
  muestrasLocales = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY_ANTERIOR);
  renderMuestras();
  ui.resultados.textContent = '';
  estado('Todas las muestras locales fueron eliminadas.');
}

ui.btnCamara?.addEventListener('click', iniciarCamara);
ui.btnDetener?.addEventListener('click', detenerCamara);
ui.btnMuestra?.addEventListener('click', iniciarCaptura);
ui.btnReconocer?.addEventListener('click', reconocer);
ui.btnExportar?.addEventListener('click', exportarMuestras);
ui.btnImportar?.addEventListener('click', abrirImportacion);
ui.archivoImportar?.addEventListener('change', importarMuestras);
ui.btnEvaluar?.addEventListener('click', evaluarDataset);
ui.btnBorrarTodo?.addEventListener('click', borrarTodoLocal);
window.addEventListener('pagehide', detenerCamara, { once: true });

renderMuestras();
cargarDatasetCentral();
estado('Laboratorio listo. La cámara permanece apagada hasta que la actives.');
