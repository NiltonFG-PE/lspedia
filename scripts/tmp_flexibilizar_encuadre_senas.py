#!/usr/bin/env python3
from pathlib import Path

JS = Path('js/lab-senas-ia.js')
HTML = Path('lab-senas-ia.html')
VALIDADOR = Path('scripts/validar_senas_ia.py')


def repl(text, old, new, name):
    if old not in text:
        raise SystemExit(f'No se encontró bloque: {name}')
    return text.replace(old, new, 1)

js = JS.read_text(encoding='utf-8')
html = HTML.read_text(encoding='utf-8')
val = VALIDADOR.read_text(encoding='utf-8')

inicio = js.index('function evaluarCalidadCaptura(')
fin = js.index('\nfunction renderCalidadCaptura(', inicio)

nueva_funcion = r'''function evaluarCalidadCaptura(resultado, resultadoPose, resultadoRostro, tiempo) {
  const manos = Array.isArray(resultado && resultado.landmarks) ? resultado.landmarks.length : 0;
  const pose = Array.isArray(resultadoPose && resultadoPose.landmarks) ? resultadoPose.landmarks[0] : null;
  const cuerpo = Array.isArray(pose) &&
    visibilidad(pose[0], 0.25) && visibilidad(pose[11], 0.25) && visibilidad(pose[12], 0.25);
  const cara = Array.isArray(resultadoRostro && resultadoRostro.faceLandmarks) ? resultadoRostro.faceLandmarks[0] : null;
  const rostro = Array.isArray(cara) && cara.length >= 400;
  const cajaCara = rostro ? cajaRostro(cara) : null;
  const luz = medirIluminacion(tiempo);
  const vertical = pantallaVertical();

  let encuadre = false;
  let distancia = 'ajustar';
  let consejo = '';

  if (cuerpo) {
    const anchoHombros = Math.abs(pose[11].x - pose[12].x);
    const centroHombrosX = (pose[11].x + pose[12].x) / 2;
    const hombroMin = vertical ? 0.15 : 0.10;
    const hombroMax = vertical ? 0.72 : 0.62;
    const caraMin = vertical ? 0.065 : 0.05;
    const caraMax = vertical ? 0.36 : 0.30;
    const caraMuyGrande = cajaCara ? cajaCara.ancho > caraMax : false;
    const caraMuyPequena = cajaCara ? cajaCara.ancho < caraMin : false;
    const demasiadoCerca = anchoHombros > hombroMax || caraMuyGrande;
    const demasiadoLejos = anchoHombros < hombroMin || caraMuyPequena;

    if (demasiadoCerca) distancia = 'cerca';
    else if (demasiadoLejos) distancia = 'lejos';
    else distancia = 'bien';

    const hombrosDentro = puntoDentro(pose[11], 0.018, 0.02) && puntoDentro(pose[12], 0.018, 0.02);
    const cabezaDentro = puntoDentro(pose[0], 0.035, 0.02);
    const caraDentro = !cajaCara || (
      cajaCara.minX >= 0.015 && cajaCara.maxX <= 0.985 &&
      cajaCara.minY >= 0.01 && cajaCara.maxY <= 0.82
    );
    const centrado = centroHombrosX >= 0.18 && centroHombrosX <= 0.82 &&
      (!cajaCara || (cajaCara.cx >= 0.18 && cajaCara.cx <= 0.82));

    encuadre = distancia === 'bien' && hombrosDentro && cabezaDentro && caraDentro && centrado;

    if (distancia === 'cerca') consejo = 'Aléjate un poco de la cámara para dejar espacio a las manos.';
    else if (distancia === 'lejos') consejo = 'Acércate un poco a la cámara.';
    else if (!cabezaDentro || !caraDentro) consejo = 'Deja tu rostro completo dentro del cuadro.';
    else if (!hombrosDentro) consejo = 'Deja ambos hombros visibles dentro del cuadro.';
    else if (centroHombrosX < 0.18 || (cajaCara && cajaCara.cx < 0.18)) consejo = 'Muévete un poco hacia la izquierda de la pantalla.';
    else if (centroHombrosX > 0.82 || (cajaCara && cajaCara.cx > 0.82)) consejo = 'Muévete un poco hacia la derecha de la pantalla.';
  } else if (detectorPose) {
    consejo = 'Coloca rostro y hombros dentro del cuadro.';
  }

  const cuerpoNecesario = detectorPose ? cuerpo : true;
  const rostroNecesario = detectorRostro ? rostro : true;
  const encuadreNecesario = detectorPose ? encuadre : true;
  const apta = manos >= 1 && cuerpoNecesario && rostroNecesario && luz.ok && encuadreNecesario;

  if (!manos) consejo = 'Muestra al menos una mano completa dentro del cuadro.';
  else if (detectorRostro && !rostro) consejo = 'Mantén el rostro visible mirando aproximadamente hacia la cámara.';
  else if (!luz.ok) consejo = luz.brillo < 55 ? 'Hay poca luz. Coloca una luz delante de ti.' : 'Hay demasiada luz. Evita una luz fuerte de frente o detrás.';
  else if (!consejo && luz.contraste < 18) consejo = 'Si puedes, usa un fondo o ropa con más contraste.';
  else if (!consejo && apta) consejo = manos >= 2
    ? 'Listo. Mantén esta posición: puedes mover las manos libremente al hacer la seña.'
    : 'Listo. Una mano visible es suficiente para iniciar; la segunda aparecerá si la seña la necesita.';

  return { manos, cuerpo, rostro, luz: luz.ok, encuadre: encuadreNecesario, apta, distancia, brillo: luz.brillo, contraste: luz.contraste, consejo };
}
'''
js = js[:inicio] + nueva_funcion + js[fin:]

reemplazos_js = {
"estado('No se logró mantener manos, cuerpo y rostro visibles. Ajusta el encuadre e inténtalo otra vez.', 'error');": "estado('No se logró mantener rostro, hombros y al menos una mano visibles. Ajusta tu posición e inténtalo otra vez.', 'error');",
"estado('Vuelve a colocarte dentro de la silueta. La cuenta regresiva empezará sola cuando todo esté listo.');": "estado('Vuelve a colocarte dentro de la zona segura. La cuenta regresiva empezará sola cuando estés listo.');",
"estado('Haz la seña ahora. Mantén cabeza, hombros y manos dentro del cuadro.');": "estado('Haz la seña ahora. Puedes mover las manos libremente; intenta mantener rostro y hombros visibles.');",
"ui.progreso.textContent = 'Colócate dentro de la silueta.';": "ui.progreso.textContent = 'Colócate cómodamente dentro del cuadro.';",
"estado('Colócate dentro de la silueta. Cuando manos, cuerpo, rostro, luz y encuadre estén listos, comenzará 3–2–1 automáticamente.');": "estado('Colócate cómodamente. Cuando detectemos rostro, hombros, al menos una mano y buena luz, comenzará 3–2–1 automáticamente.');",
"estado('Colócate dentro de la silueta. Cuando estés bien ubicado, comenzará 3–2–1 automáticamente.');": "estado('Colócate cómodamente. Cuando detectemos rostro, hombros, al menos una mano y buena luz, comenzará 3–2–1 automáticamente.');",
"const ESTABILIDAD_ANTES_CUENTA_MS = 1100;": "const ESTABILIDAD_ANTES_CUENTA_MS = 800;",
}
for old, new in reemplazos_js.items():
    js = repl(js, old, new, old[:35])

# Hacer la zona visual amplia y explicativa; no es un molde corporal.
html = repl(
    html,
    ".guia-captura{position:absolute;z-index:2;inset:5.5% 5%;border:2px dashed rgba(255,255,255,.72);border-radius:22px;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(15,23,42,.14),inset 0 0 28px rgba(2,132,199,.08);transition:border-color .2s ease,box-shadow .2s ease}",
    ".guia-captura{position:absolute;z-index:2;inset:3.5% 3.5%;border:2px dashed rgba(255,255,255,.72);border-radius:22px;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(15,23,42,.14),inset 0 0 28px rgba(2,132,199,.08);transition:border-color .2s ease,box-shadow .2s ease}.guia-captura:after{content:'ZONA SEGURA';position:absolute;left:50%;top:8px;transform:translateX(-50%);padding:4px 8px;border-radius:999px;background:rgba(2,6,23,.58);color:#fff;font-size:9px;font-weight:900;letter-spacing:.08em;white-space:nowrap}",
    'css zona segura'
)
html = html.replace(".guia-captura{inset:4.5% 5%;border-radius:20px}", ".guia-captura{inset:3% 3%;border-radius:20px}")
html = html.replace("<span>↔ Cabeza, hombros, codos y manos visibles</span>", "<span>↔ Rostro, hombros y al menos una mano visibles</span>")
html = html.replace("js/lab-senas-ia.js?v=20260914-7", "js/lab-senas-ia.js?v=20260914-8")

# Validador permanente: debe seguir siendo zona flexible y no volver una silueta rígida.
val = repl(
    val,
    'for requerido in ("calidadCapturaSenas", "cuentaRegresivaSenas", "btnCambiarCamaraSenas", "Fondo liso"):',
    'for requerido in ("calidadCapturaSenas", "cuentaRegresivaSenas", "btnCambiarCamaraSenas", "Fondo liso", "ZONA SEGURA"): ',
    'validador html'
)
insert = '''\n    if "siluetaGuiaSenas" in html_lab:\n        error("no debe volver la silueta rígida: usar zona segura flexible")\n    if "manos >= 1" not in js_lab or "ESTABILIDAD_ANTES_CUENTA_MS = 800" not in js_lab:\n        error("falta encuadre flexible o preparación automática del buscador por señas")\n'''
needle = '    print(\n        "Dataset señas IA válido: "'
val = repl(val, needle, insert + '\n' + needle, 'proteccion encuadre flexible')

JS.write_text(js, encoding='utf-8')
HTML.write_text(html, encoding='utf-8')
VALIDADOR.write_text(val, encoding='utf-8')
print('OK: encuadre flexible aplicado')
