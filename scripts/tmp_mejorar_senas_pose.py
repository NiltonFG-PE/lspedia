from pathlib import Path


def replace_once(texto: str, viejo: str, nuevo: str, etiqueta: str) -> str:
    conteo = texto.count(viejo)
    if conteo != 1:
        raise SystemExit(f"{etiqueta}: esperaba 1 coincidencia y encontré {conteo}")
    return texto.replace(viejo, nuevo, 1)


js_path = Path("js/lab-senas-ia.js")
html_path = Path("lab-senas-ia.html")
validator_path = Path("scripts/validar_senas_ia.py")

js = js_path.read_text(encoding="utf-8")

js = replace_once(
    js,
    "import { HandLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm';",
    "import { HandLandmarker, PoseLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm';",
    "import PoseLandmarker",
)

js = replace_once(
    js,
    "const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';\nconst WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';\nconst DATASET_CENTRAL_URL = 'data/senas-ia-dataset.json?v=20260914-3';\nconst STORAGE_KEY = 'lspedia_senas_ia_muestras_v2';\nconst STORAGE_KEY_ANTERIOR = 'lspedia_senas_ia_muestras_v1';\nconst FRAMES_MUESTRA = 24;\nconst DIMENSION_VECTOR = 127;",
    "const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';\nconst POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';\nconst WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';\nconst DATASET_CENTRAL_URL = 'data/senas-ia-dataset.json?v=20260914-4';\nconst STORAGE_KEY = 'lspedia_senas_ia_muestras_v2';\nconst STORAGE_KEY_ANTERIOR = 'lspedia_senas_ia_muestras_v1';\nconst FRAMES_MUESTRA = 24;\nconst DIMENSION_VECTOR_LEGACY = 127;\nconst DIMENSION_VECTOR_POSE = 161;\nconst POSE_INDICES = [0, 9, 10, 11, 12, 13, 14, 15, 16, 23, 24];",
    "constantes pose",
)

js = replace_once(
    js,
    "];\n\nconst $ = (id) => document.getElementById(id);",
    "];\nconst CONEXIONES_POSE = [\n  [11,12],[11,13],[13,15],[12,14],[14,16],\n  [11,23],[12,24],[23,24],[0,11],[0,12]\n];\n\nconst $ = (id) => document.getElementById(id);",
    "conexiones pose",
)

js = replace_once(
    js,
    "let detector = null;\nlet stream = null;\nlet activo = false;\nlet ultimoProceso = 0;\nlet ultimoTiempoVideo = -1;",
    "let detector = null;\nlet detectorPose = null;\nlet stream = null;\nlet activo = false;\nlet ultimoProceso = 0;\nlet ultimoProcesoPose = 0;\nlet ultimoResultadoPose = null;\nlet ultimoTiempoVideo = -1;",
    "estado pose",
)

js = replace_once(
    js,
    "function vectorValido(vector) {\n  return Array.isArray(vector) &&\n    vector.length === DIMENSION_VECTOR &&\n    vector.every(n => Number.isFinite(Number(n)) && Math.abs(Number(n)) < 1000);\n}",
    "function vectorValido(vector) {\n  return Array.isArray(vector) &&\n    (vector.length === DIMENSION_VECTOR_LEGACY || vector.length === DIMENSION_VECTOR_POSE) &&\n    vector.every(n => Number.isFinite(Number(n)) && Math.abs(Number(n)) < 1000);\n}",
    "vector valido dual",
)

js = replace_once(
    js,
    "    origen,\n    version: 2,\n    frames: muestra.frames.map(frame => frame.map(Number))",
    "    origen,\n    version: muestra.frames.some(frame => Array.isArray(frame) && frame.length >= DIMENSION_VECTOR_POSE) ? 3 : 2,\n    frames: muestra.frames.map(frame => frame.map(Number))",
    "version muestra",
)

viejo_preparar = """async function prepararDetector() {
  if (detector) return detector;
  estado('Cargando detector de manos…');
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
  return detector;
}"""

nuevo_preparar = """async function prepararDetector() {
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
}"""
js = replace_once(js, viejo_preparar, nuevo_preparar, "preparar detector")

insertar_pose = """
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

"""
js = replace_once(js, "}\n\nfunction vectorNormalizado(resultado) {", "}\n\n" + insertar_pose + "function vectorNormalizado(resultado, resultadoPose) {", "dibujar/vector pose")

js = replace_once(
    js,
    "  while (salida.length < 126) salida.push(0);\n  salida.push(usadas.length === 2 ? 1 : 0);\n  return salida;\n}",
    "  while (salida.length < 126) salida.push(0);\n  salida.push(usadas.length === 2 ? 1 : 0);\n\n  const pose = Array.isArray(resultadoPose && resultadoPose.landmarks)\n    ? resultadoPose.landmarks[0]\n    : null;\n  if (!Array.isArray(pose) || pose.length < 25 || !pose[11] || !pose[12]) return salida;\n\n  const hombroIzq = pose[11];\n  const hombroDer = pose[12];\n  const pcx = (hombroIzq.x + hombroDer.x) / 2;\n  const pcy = (hombroIzq.y + hombroDer.y) / 2;\n  const pcz = ((hombroIzq.z || 0) + (hombroDer.z || 0)) / 2;\n  const escalaPose = Math.max(\n    Math.hypot(\n      hombroIzq.x - hombroDer.x,\n      hombroIzq.y - hombroDer.y,\n      (hombroIzq.z || 0) - (hombroDer.z || 0)\n    ),\n    0.05\n  );\n\n  POSE_INDICES.forEach(indice => {\n    const p = pose[indice] || { x: pcx, y: pcy, z: pcz };\n    const limitar = valor => Math.max(-6, Math.min(6, valor));\n    salida.push(\n      limitar((p.x - pcx) / escalaPose),\n      limitar((p.y - pcy) / escalaPose),\n      limitar(((p.z || 0) - pcz) / escalaPose)\n    );\n  });\n  salida.push(1);\n  return salida;\n}",
    "vector con pose",
)

viejo_dist = """function distanciaVector(a, b) {
  if (!a || !b || a.length !== b.length) return 99;
  let suma = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    suma += d * d;
  }
  return Math.sqrt(suma / a.length);
}"""

nuevo_dist = """function distanciaVector(a, b) {
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
}"""
js = replace_once(js, viejo_dist, nuevo_dist, "distancia compatible")

js = replace_once(
    js,
    "function procesarResultado(resultado) {\n  dibujar(resultado);\n  const vector = vectorNormalizado(resultado);",
    "function procesarResultado(resultado, resultadoPose) {\n  dibujar(resultado);\n  dibujarPose(resultadoPose);\n  const vector = vectorNormalizado(resultado, resultadoPose);",
    "procesar pose",
)

js = replace_once(
    js,
    "    const resultado = detector.detectForVideo(ui.video, tiempo);\n    procesarResultado(resultado);",
    "    const resultado = detector.detectForVideo(ui.video, tiempo);\n    if (detectorPose && tiempo - ultimoProcesoPose >= 140) {\n      try {\n        ultimoResultadoPose = detectorPose.detectForVideo(ui.video, tiempo);\n        ultimoProcesoPose = tiempo;\n      } catch (errorPose) {\n        console.warn('[LSPedia señas IA] Fotograma corporal omitido:', errorPose);\n      }\n    }\n    procesarResultado(resultado, ultimoResultadoPose);",
    "bucle pose",
)

js = replace_once(
    js,
    "    formato: 'lspedia-senas-ia-v2',\n    version: 2,\n    exportado: new Date().toISOString(),\n    framesPorMuestra: FRAMES_MUESTRA,\n    vectorDimension: DIMENSION_VECTOR,",
    "    formato: 'lspedia-senas-ia-v3',\n    version: 3,\n    exportado: new Date().toISOString(),\n    framesPorMuestra: FRAMES_MUESTRA,\n    vectorDimension: DIMENSION_VECTOR_POSE,\n    vectorDimensionsCompatibles: [DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE],\n    modeloEntrada: 'MediaPipe Hand Landmarker + Pose Landmarker',",
    "export v3",
)

js = replace_once(
    js,
    "      const dato = porConcepto.get(muestra.etiqueta) || { total: 0, aciertos: 0 };\n      dato.total += 1;\n      if (ok) dato.aciertos += 1;\n      porConcepto.set(muestra.etiqueta, dato);",
    "      const dato = porConcepto.get(muestra.etiqueta) || { total: 0, aciertos: 0, confusiones: new Map() };\n      dato.total += 1;\n      if (ok) {\n        dato.aciertos += 1;\n      } else if (prediccion) {\n        dato.confusiones.set(prediccion, (dato.confusiones.get(prediccion) || 0) + 1);\n      }\n      porConcepto.set(muestra.etiqueta, dato);",
    "confusiones eval",
)

js = replace_once(
    js,
    "      .map(([etiqueta,d]) => ({ etiqueta, precision: d.total ? d.aciertos / d.total : 0, total: d.total }))\n      .sort((a,b) => a.precision - b.precision)\n      .slice(0,4);",
    "      .map(([etiqueta,d]) => {\n        const confusion = [...d.confusiones.entries()].sort((a,b) => b[1] - a[1])[0]?.[0] || '';\n        return { etiqueta, precision: d.total ? d.aciertos / d.total : 0, total: d.total, confusion };\n      })\n      .sort((a,b) => a.precision - b.precision)\n      .slice(0,4);",
    "resumen confusiones",
)

js = replace_once(
    js,
    "    const detalle = peores.map(x => `${x.etiqueta} ${Math.round(x.precision * 100)}%`).join(' · ');",
    "    const detalle = peores.map(x => `${x.etiqueta} ${Math.round(x.precision * 100)}%${x.confusion ? ` → suele confundirse con ${x.confusion}` : ''}`).join(' · ');",
    "detalle confusiones",
)

js_path.write_text(js, encoding="utf-8")

html = html_path.read_text(encoding="utf-8")
html = replace_once(
    html,
    ".resultado-sena{display:flex;justify-content:space-between;gap:10px;align-items:center;text-decoration:none;color:var(--text);border:1px solid var(--border);padding:10px 11px;border-radius:10px;background:#fafcff}.resultado-sena span{font-size:10px;color:var(--muted)}.subtitulo",
    ".resultado-sena{display:flex;justify-content:space-between;gap:10px;align-items:center;text-decoration:none;color:#064e3b;border:1px solid #6ee7b7;padding:11px 12px;border-radius:11px;background:#ecfdf5;box-shadow:0 0 0 2px rgba(16,185,129,.10),0 0 18px rgba(16,185,129,.34);animation:respuestaBrillo 1.8s ease-in-out infinite;transition:transform .18s ease,box-shadow .18s ease}.resultado-sena:first-child{border-color:#22c55e;background:#dcfce7;box-shadow:0 0 0 3px rgba(34,197,94,.16),0 0 28px rgba(34,197,94,.55);font-size:1.03em}.resultado-sena:hover{transform:translateY(-1px);box-shadow:0 0 0 3px rgba(16,185,129,.16),0 0 30px rgba(16,185,129,.52)}.resultado-sena span{font-size:10px;color:#047857}@keyframes respuestaBrillo{0%,100%{box-shadow:0 0 0 2px rgba(16,185,129,.10),0 0 14px rgba(16,185,129,.25)}50%{box-shadow:0 0 0 3px rgba(16,185,129,.16),0 0 26px rgba(16,185,129,.48)}}@media(prefers-reduced-motion:reduce){.resultado-sena{animation:none;transition:none}}.subtitulo",
    "brillo verde",
)
html = replace_once(
    html,
    "Base técnica para reconocer una seña desde la cámara y proponer conceptos de LSPedia. Todavía no es un traductor de LSP.",
    "Base técnica para reconocer una seña observando manos, movimiento y posición respecto al cuerpo, y proponer conceptos de LSPedia. Todavía no es un traductor de LSP.",
    "intro cuerpo",
)
html = replace_once(
    html,
    "Cada muestra guarda una secuencia corta de puntos de las manos, no el video. Conviene grabar varias muestras del mismo concepto.",
    "Cada muestra guarda puntos de las manos y, cuando está disponible, la posición del cuerpo/cabeza. No guarda el video. Conviene grabar varias muestras del mismo concepto.",
    "ayuda cuerpo",
)
html = replace_once(
    html,
    "El laboratorio procesa los fotogramas en el dispositivo para extraer puntos de las manos.",
    "El laboratorio procesa los fotogramas en el dispositivo para extraer puntos de las manos y referencias de posición del cuerpo.",
    "privacidad cuerpo",
)
html = replace_once(html, "js/lab-senas-ia.js?v=20260914-3", "js/lab-senas-ia.js?v=20260914-4", "version js")
html_path.write_text(html, encoding="utf-8")

validator = validator_path.read_text(encoding="utf-8")
validator = replace_once(validator, "DIMENSION = 127", "DIMENSIONES = {127, 161}", "dimensiones validador")
validator = replace_once(
    validator,
    "    if data.get(\"formato\") != \"lspedia-senas-ia-v2\":\n        error(\"formato no reconocido\")\n    if data.get(\"version\") != 2:\n        error(\"version debe ser 2\")\n    if data.get(\"vectorDimension\") != DIMENSION:\n        error(f\"vectorDimension debe ser {DIMENSION}\")",
    "    if data.get(\"formato\") not in {\"lspedia-senas-ia-v2\", \"lspedia-senas-ia-v3\"}:\n        error(\"formato no reconocido\")\n    if data.get(\"version\") not in {2, 3}:\n        error(\"version debe ser 2 o 3\")\n    if data.get(\"vectorDimension\") not in DIMENSIONES:\n        error(f\"vectorDimension debe ser uno de {sorted(DIMENSIONES)}\")",
    "schema dual",
)
validator = replace_once(
    validator,
    "            if not isinstance(vector, list) or len(vector) != DIMENSION:\n                error(\n                    f\"muestra {identificador}, frame {num_frame}: \"\n                    f\"vector debe tener {DIMENSION} valores\"\n                )",
    "            if not isinstance(vector, list) or len(vector) not in DIMENSIONES:\n                error(\n                    f\"muestra {identificador}, frame {num_frame}: \"\n                    f\"vector debe tener una dimensión compatible {sorted(DIMENSIONES)}\"\n                )",
    "validar frame dual",
)
validator = replace_once(
    validator,
    "    print(\n        \"Dataset señas IA válido: \"",
    "    js_lab = Path(\"js/lab-senas-ia.js\").read_text(encoding=\"utf-8\")\n    html_lab = Path(\"lab-senas-ia.html\").read_text(encoding=\"utf-8\")\n    for requerido in (\"PoseLandmarker\", \"DIMENSION_VECTOR_POSE = 161\", \"POSE_INDICES\"):\n        if requerido not in js_lab:\n            error(f\"falta integración corporal en laboratorio: {requerido}\")\n    if \"respuestaBrillo\" not in html_lab or \"rgba(16,185,129\" not in html_lab:\n        error(\"falta destaque verde de respuestas candidatas\")\n\n    print(\n        \"Dataset señas IA válido: \"",
    "validacion laboratorio",
)
validator_path.write_text(validator, encoding="utf-8")

print("Mejora de señas IA aplicada: pose compatible + brillo verde + diagnóstico de confusiones.")
