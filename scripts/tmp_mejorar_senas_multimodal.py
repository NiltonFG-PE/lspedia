#!/usr/bin/env python3
from pathlib import Path
import json

JS = Path('js/lab-senas-ia.js')
HTML = Path('lab-senas-ia.html')
VALID = Path('scripts/validar_senas_ia.py')
DATA = Path('data/senas-ia-dataset.json')


def repl(text, old, new, name):
    if old not in text:
        raise SystemExit(f'No se encontró bloque para {name}')
    return text.replace(old, new, 1)

js = JS.read_text(encoding='utf-8')

js = repl(js,
"import { HandLandmarker, PoseLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm';",
"import { HandLandmarker, PoseLandmarker, FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm';",
'import FaceLandmarker')

js = repl(js,
"const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';\nconst WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';\nconst DATASET_CENTRAL_URL = 'data/senas-ia-dataset.json?v=20260914-4';",
"const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';\nconst FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';\nconst WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';\nconst DATASET_CENTRAL_URL = 'data/senas-ia-dataset.json?v=20260914-5';",
'URL rostro')

js = repl(js,
"const DIMENSION_VECTOR_POSE = 161;\nconst POSE_INDICES = [0, 9, 10, 11, 12, 13, 14, 15, 16, 23, 24];",
"const DIMENSION_VECTOR_POSE = 161;\nconst DIMENSION_VECTOR_MULTIMODAL = 186;\nconst POSE_INDICES = [0, 9, 10, 11, 12, 13, 14, 15, 16, 23, 24];\nconst BLENDSHAPES_CARA = [\n  'browDownLeft','browDownRight','browInnerUp','browOuterUpLeft','browOuterUpRight',\n  'eyeBlinkLeft','eyeBlinkRight','eyeSquintLeft','eyeSquintRight','eyeWideLeft','eyeWideRight',\n  'jawOpen','mouthFunnel','mouthPucker','mouthSmileLeft','mouthSmileRight',\n  'mouthFrownLeft','mouthFrownRight','mouthPressLeft','mouthPressRight',\n  'mouthStretchLeft','mouthStretchRight','mouthUpperUpLeft','mouthUpperUpRight'\n];",
'dimensiones multimodales')

js = repl(js,
"const CONEXIONES_POSE = [\n  [11,12],[11,13],[13,15],[12,14],[14,16],\n  [11,23],[12,24],[23,24],[0,11],[0,12]\n];",
"const CONEXIONES_POSE = [\n  [11,12],[11,13],[13,15],[12,14],[14,16],\n  [11,23],[12,24],[23,24],[0,11],[0,12]\n];\nconst OVALO_ROSTRO = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,10];",
'óvalo rostro')

js = repl(js,
"  lista: $('listaMuestrasSenas'), contador: $('contadorMuestrasSenas'),\n  central: $('estadoDatasetCentralSenas'), calidad: $('calidadDatasetSenas')",
"  lista: $('listaMuestrasSenas'), contador: $('contadorMuestrasSenas'),\n  central: $('estadoDatasetCentralSenas'), calidad: $('calidadDatasetSenas'),\n  calidadCaptura: $('calidadCapturaSenas'), btnCambiarCamara: $('btnCambiarCamaraSenas'),\n  cuenta: $('cuentaRegresivaSenas'), cuentaTexto: $('textoCuentaSenas'), cuentaNumero: $('numeroCuentaSenas')",
'UI multimodal')

js = repl(js,
"let detector = null;\nlet detectorPose = null;\nlet stream = null;",
"let detector = null;\nlet detectorPose = null;\nlet detectorRostro = null;\nlet stream = null;",
'estado detector rostro')

js = repl(js,
"let ultimoProcesoPose = 0;\nlet ultimoResultadoPose = null;\nlet ultimoTiempoVideo = -1;",
"let ultimoProcesoPose = 0;\nlet ultimoResultadoPose = null;\nlet ultimoProcesoRostro = 0;\nlet ultimoResultadoRostro = null;\nlet ultimoTiempoVideo = -1;",
'estado resultados rostro')

js = repl(js,
"let captura = null;\nlet ventanaActual = [];",
"let captura = null;\nlet capturaReconocimiento = null;\nlet preparandoCaptura = false;\nlet ventanaActual = [];\nlet camarasDisponibles = [];\nlet dispositivoCamaraActual = '';\nlet ultimaMedicionLuz = 0;\nlet medicionLuz = { brillo: 128, contraste: 40, ok: true };\nlet calidadActual = { manos: 0, cuerpo: false, rostro: false, luz: true, encuadre: false, apta: false };\nconst canvasLuz = document.createElement('canvas');\ncanvasLuz.width = 32;\ncanvasLuz.height = 18;",
'estado captura guiada')

js = repl(js,
"    (vector.length === DIMENSION_VECTOR_LEGACY || vector.length === DIMENSION_VECTOR_POSE) &&",
"    (vector.length === DIMENSION_VECTOR_LEGACY || vector.length === DIMENSION_VECTOR_POSE || vector.length === DIMENSION_VECTOR_MULTIMODAL) &&",
'validar dimensión multimodal')

js = repl(js,
"    version: muestra.frames.some(frame => Array.isArray(frame) && frame.length >= DIMENSION_VECTOR_POSE) ? 3 : 2,",
"    version: muestra.frames.some(frame => Array.isArray(frame) && frame.length >= DIMENSION_VECTOR_MULTIMODAL) ? 4 :\n      (muestra.frames.some(frame => Array.isArray(frame) && frame.length >= DIMENSION_VECTOR_POSE) ? 3 : 2),",
'versión muestra')

inicio = js.index('async function prepararDetector() {')
fin = js.index('\nasync function iniciarCamara() {', inicio)
if inicio < 0 or fin < 0:
    raise SystemExit('No se encontró prepararDetector')
preparar = r'''async function prepararDetector() {
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
'''
js = js[:inicio] + preparar + js[fin:]

inicio = js.index('async function iniciarCamara() {')
fin = js.index('\nfunction detenerCamara() {', inicio)
if inicio < 0 or fin < 0:
    raise SystemExit('No se encontró iniciarCamara')
iniciar = r'''async function listarCamaras() {
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
'''
js = js[:inicio] + iniciar + js[fin:]

js = repl(js,
"  captura = null;\n  ventanaActual = [];",
"  captura = null;\n  capturaReconocimiento = null;\n  preparandoCaptura = false;\n  ventanaActual = [];",
'detener capturas')

js = repl(js,
"  ui.btnReconocer.disabled = true;\n  ui.progreso.textContent = '';\n  estado('Cámara detenida.');",
"  ui.btnReconocer.disabled = true;\n  if (ui.btnCambiarCamara) ui.btnCambiarCamara.disabled = true;\n  if (ui.cuenta) ui.cuenta.hidden = true;\n  ui.progreso.textContent = '';\n  renderCalidadCaptura({ manos: 0, cuerpo: false, rostro: false, luz: true, encuadre: false, apta: false }, 'Cámara apagada.');\n  estado('Cámara detenida.');",
'detener UI')

marca = 'function vectorNormalizado(resultado, resultadoPose) {'
pos = js.index(marca)
if pos < 0:
    raise SystemExit('No se encontró vectorNormalizado')
extras = r'''function dibujarRostro(resultadoRostro) {
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

'''
js = js[:pos] + extras + js[pos:]

inicio = js.index('function vectorNormalizado(resultado, resultadoPose) {')
fin = js.index('\nfunction distanciaVector(a, b) {', inicio)
vector = r'''function vectorNormalizado(resultado, resultadoPose, resultadoRostro) {
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
'''
js = js[:inicio] + vector + js[fin:]

old_dist = """  const manos = rms(0, DIMENSION_VECTOR_LEGACY);\n  if (a.length >= DIMENSION_VECTOR_POSE && b.length >= DIMENSION_VECTOR_POSE) {\n    const pose = rms(DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE);\n    return manos * 0.78 + pose * 0.22;\n  }\n  return manos;"""
new_dist = """  const manos = rms(0, DIMENSION_VECTOR_LEGACY);\n  if (a.length >= DIMENSION_VECTOR_MULTIMODAL && b.length >= DIMENSION_VECTOR_MULTIMODAL) {\n    const pose = rms(DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE);\n    const rostro = rms(DIMENSION_VECTOR_POSE, DIMENSION_VECTOR_MULTIMODAL);\n    return manos * 0.64 + pose * 0.21 + rostro * 0.15;\n  }\n  if (a.length >= DIMENSION_VECTOR_POSE && b.length >= DIMENSION_VECTOR_POSE) {\n    const pose = rms(DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE);\n    return manos * 0.78 + pose * 0.22;\n  }\n  return manos;"""
js = repl(js, old_dist, new_dist, 'distancia multimodal')

inicio = js.index('function procesarResultado(resultado, resultadoPose) {')
fin = js.index('\nfunction bucle(', inicio)
procesar = r'''function cancelarCapturaPorTiempo(tipo) {
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
'''
js = js[:inicio] + procesar + js[fin:]

js = repl(js,
"    if (detectorPose && tiempo - ultimoProcesoPose >= 140) {\n      try {\n        ultimoResultadoPose = detectorPose.detectForVideo(ui.video, tiempo);\n        ultimoProcesoPose = tiempo;\n      } catch (errorPose) {\n        console.warn('[LSPedia señas IA] Fotograma corporal omitido:', errorPose);\n      }\n    }\n    procesarResultado(resultado, ultimoResultadoPose);",
"    if (detectorPose && tiempo - ultimoProcesoPose >= 140) {\n      try {\n        ultimoResultadoPose = detectorPose.detectForVideo(ui.video, tiempo);\n        ultimoProcesoPose = tiempo;\n      } catch (errorPose) {\n        console.warn('[LSPedia señas IA] Fotograma corporal omitido:', errorPose);\n      }\n    }\n    if (detectorRostro && tiempo - ultimoProcesoRostro >= 210) {\n      try {\n        ultimoResultadoRostro = detectorRostro.detectForVideo(ui.video, tiempo);\n        ultimoProcesoRostro = tiempo;\n      } catch (errorRostro) {\n        console.warn('[LSPedia señas IA] Fotograma facial omitido:', errorRostro);\n      }\n    }\n    procesarResultado(resultado, ultimoResultadoPose, ultimoResultadoRostro, tiempo);",
'bucle rostro')

inicio = js.index('function iniciarCaptura() {')
fin = js.index('\nfunction finalizarCaptura() {', inicio)
iniciar_captura = r'''async function iniciarCaptura() {
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
'''
js = js[:inicio] + iniciar_captura + js[fin:]

inicio = js.index('function reconocer() {')
fin = js.index('\nfunction renderResultados(', inicio)
reconocer = r'''async function reconocer() {
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
'''
js = js[:inicio] + reconocer + js[fin:]

js = repl(js,
"    formato: 'lspedia-senas-ia-v3',\n    version: 3,\n    exportado: new Date().toISOString(),\n    framesPorMuestra: FRAMES_MUESTRA,\n    vectorDimension: DIMENSION_VECTOR_POSE,\n    vectorDimensionsCompatibles: [DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE],\n    modeloEntrada: 'MediaPipe Hand Landmarker + Pose Landmarker',",
"    formato: 'lspedia-senas-ia-v4',\n    version: 4,\n    exportado: new Date().toISOString(),\n    framesPorMuestra: FRAMES_MUESTRA,\n    vectorDimension: DIMENSION_VECTOR_MULTIMODAL,\n    vectorDimensionsCompatibles: [DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE, DIMENSION_VECTOR_MULTIMODAL],\n    modeloEntrada: 'MediaPipe Hand Landmarker + Pose Landmarker + Face Landmarker (blendshapes)',",
'exportación v4')

js = repl(js,
"ui.btnDetener?.addEventListener('click', detenerCamara);",
"ui.btnDetener?.addEventListener('click', detenerCamara);\nui.btnCambiarCamara?.addEventListener('click', cambiarCamara);",
'listener cambiar cámara')

js = repl(js,
"estado('Laboratorio listo. La cámara permanece apagada hasta que la actives.');",
"renderCalidadCaptura(calidadActual, 'Activa la cámara. Para mejores muestras usa luz de frente, fondo liso y deja visibles cabeza, hombros y manos.');\nestado('Laboratorio listo. La cámara permanece apagada hasta que la actives.');",
'estado inicial calidad')

JS.write_text(js, encoding='utf-8')

html = HTML.read_text(encoding='utf-8')
html = repl(html,
".camara{position:relative;aspect-ratio:16/10;background:#050a12;border-radius:14px;overflow:hidden;display:grid;place-items:center}.camara video,.camara canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}.camara canvas{pointer-events:none}",
".camara{position:relative;aspect-ratio:16/10;background:#050a12;border-radius:14px;overflow:hidden;display:grid;place-items:center}.camara video,.camara canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}.camara canvas{pointer-events:none}.guia-captura{position:absolute;z-index:2;inset:7% 8%;border:2px dashed rgba(255,255,255,.48);border-radius:24px;pointer-events:none;box-shadow:inset 0 0 30px rgba(2,132,199,.12)}.guia-captura:before{content:'';position:absolute;width:18%;aspect-ratio:1/1.25;border:2px solid rgba(56,189,248,.48);border-radius:50%;left:41%;top:4%}.cuenta-regresiva{position:absolute;z-index:4;inset:0;background:rgba(2,6,23,.62);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:8px;text-align:center;pointer-events:none}.cuenta-regresiva[hidden]{display:none}.cuenta-regresiva span{font-size:clamp(1rem,3vw,1.35rem);font-weight:750}.cuenta-regresiva strong{font-size:clamp(3.5rem,11vw,6.5rem);line-height:1;text-shadow:0 0 28px rgba(56,189,248,.75)}",
'CSS guía cámara')

html = repl(html,
".estado[data-tipo=\"ok\"]{background:#eaf8f1;color:var(--green)}.acciones",
".estado[data-tipo=\"ok\"]{background:#eaf8f1;color:var(--green)}.calidad-captura{margin-top:10px;padding:10px;border:1px solid #dce3ec;border-radius:12px;background:#f8fafc}.calidad-chips{display:flex;gap:6px;flex-wrap:wrap}.calidad-chip{font-size:10px;font-weight:850;padding:5px 7px;border-radius:999px;background:#e2e8f0;color:#475569}.calidad-chip.ok{background:#dcfce7;color:#166534;border:1px solid #86efac}.calidad-chip.bad{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}.calidad-chip.neutral{background:#e2e8f0;color:#475569}.calidad-mensaje{margin:8px 0 0;font-size:11px;line-height:1.4;color:#475569}.consejos-captura{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:10px;color:#536174}.consejos-captura span{background:#fff;border:1px solid #dce3ec;border-radius:999px;padding:5px 8px}.acciones",
'CSS calidad')

html = repl(html,
"          <canvas id=\"canvasSenas\"></canvas>\n        </div>\n        <div id=\"estadoSenas\"",
"          <canvas id=\"canvasSenas\"></canvas>\n          <div class=\"guia-captura\" aria-hidden=\"true\"></div>\n          <div id=\"cuentaRegresivaSenas\" class=\"cuenta-regresiva\" hidden aria-hidden=\"true\"><span id=\"textoCuentaSenas\">Prepárate</span><strong id=\"numeroCuentaSenas\">3</strong></div>\n        </div>\n        <div id=\"calidadCapturaSenas\" class=\"calidad-captura\" role=\"status\" aria-live=\"polite\"></div>\n        <div class=\"consejos-captura\"><span>💡 Luz de frente</span><span>▭ Fondo liso</span><span>↔ Cabeza, hombros y manos visibles</span></div>\n        <div id=\"estadoSenas\"",
'marcadores calidad HTML')

html = repl(html,
"          <button id=\"btnDetenerSenas\" class=\"btn btn-soft\" type=\"button\" disabled>Detener</button>\n          <button id=\"btnReconocerSenas\"",
"          <button id=\"btnDetenerSenas\" class=\"btn btn-soft\" type=\"button\" disabled>Detener</button>\n          <button id=\"btnCambiarCamaraSenas\" class=\"btn btn-soft\" type=\"button\" disabled>Cambiar cámara</button>\n          <button id=\"btnReconocerSenas\"",
'botón cámara')

html = repl(html,
"Cada muestra guarda puntos de las manos y, cuando está disponible, la posición del cuerpo/cabeza. No guarda el video. Conviene grabar varias muestras del mismo concepto.",
"Cada muestra nueva intenta guardar manos, posición del cuerpo y rasgos de expresión facial. No guarda el video ni una foto del rostro. Usa un fondo liso, buena luz y graba varias muestras del mismo concepto.",
'ayuda muestra')

html = repl(html,
"<strong>Privacidad y alcance.</strong> El laboratorio procesa los fotogramas en el dispositivo para extraer puntos de las manos y referencias de posición del cuerpo.",
"<strong>Privacidad y alcance.</strong> El laboratorio procesa los fotogramas en el dispositivo para extraer puntos de las manos, referencias de posición del cuerpo y valores numéricos de expresión facial.",
'privacidad rostro')

html = repl(html,
"<script type=\"module\" src=\"js/lab-senas-ia.js?v=20260914-4\"></script>",
"<script type=\"module\" src=\"js/lab-senas-ia.js?v=20260914-5\"></script>",
'bust JS')
HTML.write_text(html, encoding='utf-8')

valid = VALID.read_text(encoding='utf-8')
valid = repl(valid, 'DIMENSIONES = {127, 161}', 'DIMENSIONES = {127, 161, 186}', 'validator dimensiones')
valid = repl(valid,
"if data.get(\"formato\") not in {\"lspedia-senas-ia-v2\", \"lspedia-senas-ia-v3\"}:\n        error(\"formato no reconocido\")\n    if data.get(\"version\") not in {2, 3}:\n        error(\"version debe ser 2 o 3\")",
"if data.get(\"formato\") not in {\"lspedia-senas-ia-v2\", \"lspedia-senas-ia-v3\", \"lspedia-senas-ia-v4\"}:\n        error(\"formato no reconocido\")\n    if data.get(\"version\") not in {2, 3, 4}:\n        error(\"version debe ser 2, 3 o 4\")",
'validator versiones')
valid = repl(valid,
"    for requerido in (\"PoseLandmarker\", \"DIMENSION_VECTOR_POSE = 161\", \"POSE_INDICES\"):",
"    for requerido in (\"PoseLandmarker\", \"FaceLandmarker\", \"DIMENSION_VECTOR_POSE = 161\", \"DIMENSION_VECTOR_MULTIMODAL = 186\", \"POSE_INDICES\", \"BLENDSHAPES_CARA\", \"outputFaceBlendshapes: true\", \"cuentaRegresiva\", \"evaluarCalidadCaptura\"):",
'validator multimodal')
valid = repl(valid,
"    if \"respuestaBrillo\" not in html_lab or \"rgba(16,185,129\" not in html_lab:\n        error(\"falta destaque verde de respuestas candidatas\")",
"    if \"respuestaBrillo\" not in html_lab or \"rgba(16,185,129\" not in html_lab:\n        error(\"falta destaque verde de respuestas candidatas\")\n    for requerido in (\"calidadCapturaSenas\", \"cuentaRegresivaSenas\", \"btnCambiarCamaraSenas\", \"Fondo liso\"):\n        if requerido not in html_lab:\n            error(f\"falta mejora de captura multimodal en HTML: {requerido}\")",
'validator UI captura')
VALID.write_text(valid, encoding='utf-8')

data = json.loads(DATA.read_text(encoding='utf-8'))
data['formato'] = 'lspedia-senas-ia-v4'
data['version'] = 4
data['vectorDimension'] = 186
data['vectorDimensionsCompatibles'] = [127, 161, 186]
data['modeloEntrada'] = 'MediaPipe Hand Landmarker + Pose Landmarker + Face Landmarker (blendshapes)'
data['descripcion'] = 'Dataset experimental multimodal para el buscador mediante señas de LSPedia. Las muestras almacenan landmarks normalizados y rasgos numéricos de expresión facial, no video ni fotografías.'
DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('Mejora multimodal aplicada.')
