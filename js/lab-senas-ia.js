import { HandLandmarker, PoseLandmarker, FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const DATASET_CENTRAL_URL = 'data/senas-ia-dataset.json?v=20260914-5';
const STORAGE_KEY = 'lspedia_senas_ia_muestras_v2';
const STORAGE_KEY_ANTERIOR = 'lspedia_senas_ia_muestras_v1';
const FRAMES_MUESTRA = 24;
const DIMENSION_VECTOR_LEGACY = 127;
const DIMENSION_VECTOR_POSE = 161;
const DIMENSION_VECTOR_MULTIMODAL = 186;
const POSE_INDICES = [0, 9, 10, 11, 12, 13, 14, 15, 16, 23, 24];
const BLENDSHAPES_CARA = [
  'browDownLeft','browDownRight','browInnerUp','browOuterUpLeft','browOuterUpRight',
  'eyeBlinkLeft','eyeBlinkRight','eyeSquintLeft','eyeSquintRight','eyeWideLeft','eyeWideRight',
  'jawOpen','mouthFunnel','mouthPucker','mouthSmileLeft','mouthSmileRight',
  'mouthFrownLeft','mouthFrownRight','mouthPressLeft','mouthPressRight',
  'mouthStretchLeft','mouthStretchRight','mouthUpperUpLeft','mouthUpperUpRight'
];
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
const OVALO_ROSTRO = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,10];

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
  central: $('estadoDatasetCentralSenas'), calidad: $('calidadDatasetSenas'),
  calidadCaptura: $('calidadCapturaSenas'), btnCambiarCamara: $('btnCambiarCamaraSenas'),
  cuenta: $('cuentaRegresivaSenas'), cuentaTexto: $('textoCuentaSenas'), cuentaNumero: $('numeroCuentaSenas')
};

let detector = null;
let detectorPose = null;
let detectorRostro = null;
let stream = null;
let activo = false;
let ultimoProceso = 0;
let ultimoProcesoPose = 0;
let ultimoResultadoPose = null;
let ultimoProcesoRostro = 0;
let ultimoResultadoRostro = null;
let ultimoTiempoVideo = -1;
let rafId = 0;
let captura = null;
let capturaReconocimiento = null;
let preparandoCaptura = false;
let ventanaActual = [];
let camarasDisponibles = [];
let dispositivoCamaraActual = '';
let ultimaMedicionLuz = 0;
let medicionLuz = { brillo: 128, contraste: 40, ok: true };
let calidadActual = { manos: 0, cuerpo: false, rostro: false, luz: true, encuadre: false, apta: false };
const canvasLuz = document.createElement('canvas');
canvasLuz.width = 32;
canvasLuz.height = 18;
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
    (vector.length === DIMENSION_VECTOR_LEGACY || vector.length === DIMENSION_VECTOR_POSE || vector.length === DIMENSION_VECTOR_MULTIMODAL) &&
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
    version: muestra.frames.some(frame => Array.isArray(frame) && frame.length >= DIMENSION_VECTOR_MULTIMODAL) ? 4 :
      (muestra.frames.some(frame => Array.isArray(frame) && frame.length >= DIMENSION_VECTOR_POSE) ? 3 : 2),
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
  estado('Cargando detectores de manos, cuerpo y rostro…');
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

  const resultados = await Promise.allSettled([
    conTimeout(
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
    ),
    conTimeout(
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: FACE_MODEL_URL },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.45,
        minFacePresenceConfidence: 0.45,
        minTrackingConfidence: 0.45,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false
      }),
      20000,
      'El modelo del rostro tardó demasiado en cargar.'
    )
  ]);

  detectorPose = resultados[0].status === 'fulfilled' ? resultados[0].value : null;
  detectorRostro = resultados[1].status === 'fulfilled' ? resultados[1].value : null;
  if (!detectorPose) console.warn('[LSPedia señas IA] Pose no disponible:', resultados[0].reason);
  if (!detectorRostro) console.warn('[LSPedia señas IA] Rostro no disponible:', resultados[1].reason);
  return detector;
}

async function listarCamaras() {
  try {
    const dispositivos = await navigator.mediaDevices.enumerateDevices();
    camarasDisponibles = dispositivos.filter(d => d.kind === 'videoinput' && d.deviceId);
  } catch (_e) {
    camarasDisponibles = [];
  }
  if (ui.btnCambiarCamara) ui.btnCambiarCamara.disabled = camarasDisponibles.length < 2;
}

async function obtenerStreamCamara() {
  const video = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 }
  };
  if (dispositivoCamaraActual) video.deviceId = { exact: dispositivoCamaraActual };
  else video.facingMode = { ideal: 'user' };
  return navigator.mediaDevices.getUserMedia({ audio: false, video });
}

async function iniciarCamara() {
  if (activo) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    estado('Este navegador no permite usar la cámara desde esta página.', 'error');
    return;
  }
  try {
    await prepararDetector();
    stream = await obtenerStreamCamara();
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
    await listarCamaras();
    const capacidades = [detector ? 'manos' : '', detectorPose ? 'cuerpo' : '', detectorRostro ? 'rostro' : ''].filter(Boolean).join(' + ');
    estado(`Cámara activa · detectando ${capacidades || 'manos'}. Colócate de frente y deja espacio alrededor de las manos.`);
    bucle();
  } catch (error) {
    console.error('[LSPedia señas IA]', error);
    estado('No se pudo iniciar la cámara o los detectores. Revisa el permiso de cámara y la conexión.', 'error');
  }
}

async function cambiarCamara() {
  if (!activo) return estado('Activa la cámara primero.', 'error');
  await listarCamaras();
  if (camarasDisponibles.length < 2) return estado('Este dispositivo solo muestra una cámara disponible.');
  const pista = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
  const actual = (pista && pista.getSettings && pista.getSettings().deviceId) || dispositivoCamaraActual;
  const indice = Math.max(0, camarasDisponibles.findIndex(c => c.deviceId === actual));
  const siguiente = camarasDisponibles[(indice + 1) % camarasDisponibles.length];
  dispositivoCamaraActual = siguiente.deviceId;
  activo = false;
  if (rafId) cancelAnimationFrame(rafId);
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  ui.video.srcObject = null;
  estado('Cambiando cámara…');
  await iniciarCamara();
}

function detenerCamara() {
  activo = false;
  captura = null;
  capturaReconocimiento = null;
  preparandoCaptura = false;
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
  if (ui.btnCambiarCamara) ui.btnCambiarCamara.disabled = true;
  if (ui.cuenta) ui.cuenta.hidden = true;
  ui.progreso.textContent = '';
  renderCalidadCaptura({ manos: 0, cuerpo: false, rostro: false, luz: true, encuadre: false, apta: false }, 'Cámara apagada.');
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

function dibujarRostro(resultadoRostro) {
  const cara = Array.isArray(resultadoRostro && resultadoRostro.faceLandmarks)
    ? resultadoRostro.faceLandmarks[0]
    : null;
  if (!Array.isArray(cara) || cara.length < 400) return;
  const ctx = ui.canvas.getContext('2d');
  ctx.lineWidth = Math.max(1.5, ui.canvas.width / 650);
  ctx.strokeStyle = 'rgba(56,189,248,.82)';
  ctx.beginPath();
  OVALO_ROSTRO.forEach((indice, i) => {
    const p = cara[indice];
    if (!p) return;
    const x = p.x * ui.canvas.width;
    const y = p.y * ui.canvas.height;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function obtenerBlendshapes(resultadoRostro) {
  const grupos = Array.isArray(resultadoRostro && resultadoRostro.faceBlendshapes)
    ? resultadoRostro.faceBlendshapes
    : [];
  const categorias = grupos[0] && Array.isArray(grupos[0].categories) ? grupos[0].categories : [];
  if (!categorias.length) return null;
  const mapa = new Map(categorias.map(c => [String(c.categoryName || c.displayName || ''), Number(c.score) || 0]));
  return BLENDSHAPES_CARA.map(nombre => Math.max(0, Math.min(1, mapa.get(nombre) || 0)));
}

function medirIluminacion(tiempo = performance.now()) {
  if (!ui.video || ui.video.readyState < 2) return medicionLuz;
  if (tiempo - ultimaMedicionLuz < 650) return medicionLuz;
  ultimaMedicionLuz = tiempo;
  try {
    const ctx = canvasLuz.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(ui.video, 0, 0, canvasLuz.width, canvasLuz.height);
    const datos = ctx.getImageData(0, 0, canvasLuz.width, canvasLuz.height).data;
    let suma = 0, suma2 = 0, n = 0;
    for (let i = 0; i < datos.length; i += 16) {
      const y = 0.2126 * datos[i] + 0.7152 * datos[i + 1] + 0.0722 * datos[i + 2];
      suma += y; suma2 += y * y; n += 1;
    }
    const brillo = n ? suma / n : 128;
    const varianza = n ? Math.max(0, suma2 / n - brillo * brillo) : 0;
    const contraste = Math.sqrt(varianza);
    medicionLuz = { brillo, contraste, ok: brillo >= 55 && brillo <= 210 };
  } catch (_e) {}
  return medicionLuz;
}

function visibilidad(punto, minimo = 0.35) {
  return !!punto && (punto.visibility == null || Number(punto.visibility) >= minimo);
}

function evaluarCalidadCaptura(resultado, resultadoPose, resultadoRostro, tiempo) {
  const manos = Array.isArray(resultado && resultado.landmarks) ? resultado.landmarks.length : 0;
  const pose = Array.isArray(resultadoPose && resultadoPose.landmarks) ? resultadoPose.landmarks[0] : null;
  const cuerpo = Array.isArray(pose) && visibilidad(pose[0]) && visibilidad(pose[11]) && visibilidad(pose[12]) && visibilidad(pose[13]) && visibilidad(pose[14]);
  const cara = Array.isArray(resultadoRostro && resultadoRostro.faceLandmarks) ? resultadoRostro.faceLandmarks[0] : null;
  const rostro = Array.isArray(cara) && cara.length >= 400;
  const luz = medirIluminacion(tiempo);
  let encuadre = false;
  let consejo = '';
  if (cuerpo) {
    const anchoHombros = Math.abs(pose[11].x - pose[12].x);
    encuadre = anchoHombros >= 0.12 && anchoHombros <= 0.62 && pose[0].y > 0.02 && pose[0].y < 0.48 && pose[11].y < 0.72 && pose[12].y < 0.72;
    if (anchoHombros > 0.62) consejo = 'Aléjate un poco de la cámara.';
    else if (anchoHombros < 0.12) consejo = 'Acércate un poco a la cámara.';
    else if (!encuadre) consejo = 'Centra cabeza, hombros y brazos dentro del marco.';
  } else if (detectorPose) consejo = 'Aléjate hasta que se vean cabeza, hombros y brazos.';

  const cuerpoNecesario = detectorPose ? cuerpo : true;
  const rostroNecesario = detectorRostro ? rostro : true;
  const encuadreNecesario = detectorPose ? encuadre : true;
  const apta = manos > 0 && cuerpoNecesario && rostroNecesario && luz.ok && encuadreNecesario;
  if (!manos) consejo = 'Muestra al menos una mano dentro del cuadro.';
  else if (detectorRostro && !rostro) consejo = 'Mira hacia la cámara y mantén el rostro visible.';
  else if (!luz.ok) consejo = luz.brillo < 55 ? 'Hay poca luz. Coloca una luz delante de ti.' : 'Hay demasiada luz. Evita una ventana o foco fuerte detrás o frente a ti.';
  else if (!consejo && luz.contraste < 18) consejo = 'Usa ropa y un fondo que contrasten mejor.';
  else if (!consejo && apta) consejo = 'Listo para grabar: manos, cuerpo y rostro visibles.';

  return { manos, cuerpo, rostro, luz: luz.ok, encuadre: encuadreNecesario, apta, brillo: luz.brillo, contraste: luz.contraste, consejo };
}

function renderCalidadCaptura(calidad, mensajeExtra = '') {
  if (!ui.calidadCaptura) return;
  ui.calidadCaptura.textContent = '';
  const datos = [
    ['Manos', calidad.manos > 0, calidad.manos ? `${calidad.manos}/2` : 'No'],
    ['Cuerpo', detectorPose ? calidad.cuerpo : null, detectorPose ? (calidad.cuerpo ? 'Sí' : 'No') : 'Opcional'],
    ['Rostro', detectorRostro ? calidad.rostro : null, detectorRostro ? (calidad.rostro ? 'Sí' : 'No') : 'Opcional'],
    ['Luz', calidad.luz, calidad.luz ? 'Bien' : 'Mejorar'],
    ['Encuadre', detectorPose ? calidad.encuadre : null, detectorPose ? (calidad.encuadre ? 'Bien' : 'Mejorar') : 'Opcional']
  ];
  const fila = document.createElement('div');
  fila.className = 'calidad-chips';
  datos.forEach(([nombre, ok, detalle]) => {
    const chip = document.createElement('span');
    chip.className = 'calidad-chip ' + (ok === true ? 'ok' : ok === false ? 'bad' : 'neutral');
    chip.textContent = `${nombre}: ${detalle}`;
    fila.appendChild(chip);
  });
  const texto = document.createElement('p');
  texto.className = 'calidad-mensaje';
  texto.textContent = mensajeExtra || calidad.consejo || 'Colócate de frente a la cámara.';
  ui.calidadCaptura.append(fila, texto);
}

function dimensionObjetivoCaptura() {
  if (detectorPose && detectorRostro) return DIMENSION_VECTOR_MULTIMODAL;
  if (detectorPose) return DIMENSION_VECTOR_POSE;
  return DIMENSION_VECTOR_LEGACY;
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function cuentaRegresiva(texto) {
  if (preparandoCaptura) return false;
  preparandoCaptura = true;
  if (ui.cuenta) ui.cuenta.hidden = false;
  if (ui.cuentaTexto) ui.cuentaTexto.textContent = texto || 'Prepárate';
  for (const numero of [3, 2, 1]) {
    if (!activo) break;
    if (ui.cuentaNumero) ui.cuentaNumero.textContent = String(numero);
    await esperar(700);
  }
  if (ui.cuenta) ui.cuenta.hidden = true;
  preparandoCaptura = false;
  return activo;
}

function vectorNormalizado(resultado, resultadoPose, resultadoRostro) {
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

  const expresion = obtenerBlendshapes(resultadoRostro);
  if (!expresion) return salida;
  salida.push(...expresion, 1);
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
  if (a.length >= DIMENSION_VECTOR_MULTIMODAL && b.length >= DIMENSION_VECTOR_MULTIMODAL) {
    const pose = rms(DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE);
    const rostro = rms(DIMENSION_VECTOR_POSE, DIMENSION_VECTOR_MULTIMODAL);
    return manos * 0.64 + pose * 0.21 + rostro * 0.15;
  }
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

function cancelarCapturaPorTiempo(tipo) {
  if (tipo === 'muestra') {
    captura = null;
    ui.btnMuestra.disabled = false;
    ui.progreso.textContent = 'No se guardó la muestra.';
  } else {
    capturaReconocimiento = null;
    ui.btnReconocer.disabled = false;
  }
  estado('No se logró mantener manos, cuerpo y rostro visibles. Ajusta el encuadre e inténtalo otra vez.', 'error');
}

function finalizarReconocimientoGuiado() {
  if (!capturaReconocimiento) return;
  const secuencia = capturaReconocimiento.frames.slice(0, FRAMES_MUESTRA);
  capturaReconocimiento = null;
  ui.btnReconocer.disabled = false;
  const top = candidatosPara(secuencia, todasLasMuestras()).slice(0, 3);
  renderResultados(top);
  estado('Comparación terminada. Toca una de las opciones si corresponde a tu seña.', 'ok');
}

function procesarResultado(resultado, resultadoPose, resultadoRostro, tiempo = performance.now()) {
  dibujar(resultado);
  dibujarPose(resultadoPose);
  dibujarRostro(resultadoRostro);
  calidadActual = evaluarCalidadCaptura(resultado, resultadoPose, resultadoRostro, tiempo);
  renderCalidadCaptura(calidadActual);

  const vector = vectorNormalizado(resultado, resultadoPose, resultadoRostro);
  if (!vector) {
    if (captura) ui.progreso.textContent = 'Esperando una mano visible…';
    return;
  }

  ventanaActual.push(vector);
  if (ventanaActual.length > FRAMES_MUESTRA) ventanaActual.shift();

  if (captura) {
    if (tiempo - captura.inicio > 12000) return cancelarCapturaPorTiempo('muestra');
    if (vector.length < captura.dimensionObjetivo) {
      ui.progreso.textContent = 'Esperando manos + cuerpo + rostro bien visibles…';
    } else {
      captura.frames.push(vector);
      ui.progreso.textContent = `Grabando ${captura.frames.length}/${FRAMES_MUESTRA}…`;
      if (captura.frames.length >= FRAMES_MUESTRA) finalizarCaptura();
    }
  }

  if (capturaReconocimiento) {
    if (tiempo - capturaReconocimiento.inicio > 12000) return cancelarCapturaPorTiempo('reconocimiento');
    if (vector.length >= capturaReconocimiento.dimensionObjetivo) {
      capturaReconocimiento.frames.push(vector);
      estado(`Reconociendo seña… ${capturaReconocimiento.frames.length}/${FRAMES_MUESTRA}`);
      if (capturaReconocimiento.frames.length >= FRAMES_MUESTRA) finalizarReconocimientoGuiado();
    }
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
    if (detectorRostro && tiempo - ultimoProcesoRostro >= 210) {
      try {
        ultimoResultadoRostro = detectorRostro.detectForVideo(ui.video, tiempo);
        ultimoProcesoRostro = tiempo;
      } catch (errorRostro) {
        console.warn('[LSPedia señas IA] Fotograma facial omitido:', errorRostro);
      }
    }
    procesarResultado(resultado, ultimoResultadoPose, ultimoResultadoRostro, tiempo);
  } catch (error) {
    console.warn('[LSPedia señas IA] Fotograma omitido:', error);
  }
}

async function iniciarCaptura() {
  const etiqueta = etiquetaValida(ui.etiqueta.value);
  if (!activo) return estado('Activa la cámara primero.', 'error');
  if (!etiqueta) return estado('Escribe el concepto de la seña antes de grabar.', 'error');
  if (captura || capturaReconocimiento || preparandoCaptura) return;
  if (!calidadActual.apta) {
    return estado(calidadActual.consejo || 'Ajusta manos, cuerpo, rostro e iluminación antes de grabar.', 'error');
  }
  ui.btnMuestra.disabled = true;
  const listo = await cuentaRegresiva('Prepárate para grabar');
  if (!listo) { ui.btnMuestra.disabled = false; return; }
  captura = { etiqueta, frames: [], inicio: performance.now(), dimensionObjetivo: dimensionObjetivoCaptura() };
  ui.progreso.textContent = `Grabando 0/${FRAMES_MUESTRA}…`;
  estado(`Grabando “${etiqueta}”. Haz la seña completa de forma natural.`);
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

async function reconocer() {
  if (!activo) return estado('Activa la cámara primero.', 'error');
  if (captura || capturaReconocimiento || preparandoCaptura) return;
  const banco = todasLasMuestras();
  if (!banco.length) return estado('Todavía no hay muestras de referencia.', 'error');
  ui.btnReconocer.disabled = true;
  ui.resultados.textContent = '';
  const listo = await cuentaRegresiva('Prepárate para buscar');
  if (!listo) { ui.btnReconocer.disabled = false; return; }
  capturaReconocimiento = { frames: [], inicio: performance.now(), dimensionObjetivo: dimensionObjetivoCaptura() };
  estado('Haz la seña ahora. Mantén cabeza, hombros y manos dentro del cuadro.');
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
    formato: 'lspedia-senas-ia-v4',
    version: 4,
    exportado: new Date().toISOString(),
    framesPorMuestra: FRAMES_MUESTRA,
    vectorDimension: DIMENSION_VECTOR_MULTIMODAL,
    vectorDimensionsCompatibles: [DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE, DIMENSION_VECTOR_MULTIMODAL],
    modeloEntrada: 'MediaPipe Hand Landmarker + Pose Landmarker + Face Landmarker (blendshapes)',
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
ui.btnCambiarCamara?.addEventListener('click', cambiarCamara);
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
renderCalidadCaptura(calidadActual, 'Activa la cámara. Para mejores muestras usa luz de frente, fondo liso y deja visibles cabeza, hombros y manos.');
estado('Laboratorio listo. La cámara permanece apagada hasta que la actives.');
