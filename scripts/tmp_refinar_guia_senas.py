#!/usr/bin/env python3
from pathlib import Path

JS = Path('js/lab-senas-ia.js')
HTML = Path('lab-senas-ia.html')


def repl(text, old, new, nombre):
    if old not in text:
        raise SystemExit(f'No se encontró bloque: {nombre}')
    return text.replace(old, new, 1)

js = JS.read_text(encoding='utf-8')
html = HTML.read_text(encoding='utf-8')

js = repl(
    js,
    "  silueta: $('siluetaGuiaSenas')\n};",
    "  guia: document.querySelector('.guia-captura')\n};",
    'referencia UI'
)

js = js.replace(
    "width: { ideal: 720 }, height: { ideal: 1280 }, aspectRatio: { ideal: 9 / 16 }, frameRate: { ideal: 30, max: 30 }",
    "width: { ideal: 720 }, height: { ideal: 900 }, aspectRatio: { ideal: 4 / 5 }, frameRate: { ideal: 30, max: 30 }"
)
js = js.replace(
    "height: { ideal: 1280 },\n    aspectRatio: { ideal: 9 / 16 },",
    "height: { ideal: 900 },\n    aspectRatio: { ideal: 4 / 5 },"
)

inicio = js.index('function evaluarCalidadCaptura(')
fin = js.index('\nfunction renderCalidadCaptura(', inicio)
nuevo = r'''function puntoDentro(punto, margenX = 0.055, margenY = 0.045) {
  return visibilidad(punto, 0.25) &&
    punto.x >= margenX && punto.x <= 1 - margenX &&
    punto.y >= margenY && punto.y <= 1 - margenY;
}

function cajaRostro(cara) {
  if (!Array.isArray(cara) || cara.length < 100) return null;
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  cara.forEach(p => {
    if (!p) return;
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  });
  return { minX, minY, maxX, maxY, ancho: maxX - minX, alto: maxY - minY, cx: (minX + maxX) / 2 };
}

function evaluarCalidadCaptura(resultado, resultadoPose, resultadoRostro, tiempo) {
  const manos = Array.isArray(resultado && resultado.landmarks) ? resultado.landmarks.length : 0;
  const pose = Array.isArray(resultadoPose && resultadoPose.landmarks) ? resultadoPose.landmarks[0] : null;
  const cuerpo = Array.isArray(pose) &&
    visibilidad(pose[0]) && visibilidad(pose[11]) && visibilidad(pose[12]) &&
    visibilidad(pose[13]) && visibilidad(pose[14]);
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
    const hombroMin = vertical ? 0.22 : 0.14;
    const hombroMax = vertical ? 0.58 : 0.48;
    const caraMin = vertical ? 0.08 : 0.055;
    const caraMax = vertical ? 0.30 : 0.24;
    const caraMuyGrande = cajaCara ? cajaCara.ancho > caraMax : false;
    const caraMuyPequena = cajaCara ? cajaCara.ancho < caraMin : false;
    const demasiadoCerca = anchoHombros > hombroMax || caraMuyGrande;
    const demasiadoLejos = anchoHombros < hombroMin || caraMuyPequena;

    if (demasiadoCerca) distancia = 'cerca';
    else if (demasiadoLejos) distancia = 'lejos';
    else distancia = 'bien';

    const brazosDentro = [13, 14, 15, 16].every(i => puntoDentro(pose[i], 0.045, 0.035));
    const hombrosDentro = puntoDentro(pose[11], 0.05, 0.04) && puntoDentro(pose[12], 0.05, 0.04);
    const cabezaDentro = puntoDentro(pose[0], 0.10, 0.055) && pose[0].y < 0.44;
    const centrado = centroHombrosX >= 0.32 && centroHombrosX <= 0.68 &&
      (!cajaCara || (cajaCara.cx >= 0.32 && cajaCara.cx <= 0.68 && cajaCara.minY >= 0.025));

    encuadre = distancia === 'bien' && brazosDentro && hombrosDentro && cabezaDentro && centrado;

    if (distancia === 'cerca') consejo = 'Estás demasiado cerca. Aléjate hasta que se vean completos cabeza, hombros, codos y manos.';
    else if (distancia === 'lejos') consejo = 'Estás demasiado lejos. Acércate un poco sin cortar los brazos.';
    else if (!brazosDentro) consejo = 'Deja ambos antebrazos y manos dentro del marco.';
    else if (!hombrosDentro || !cabezaDentro) consejo = 'No cortes la cabeza ni los hombros. Ajusta tu posición.';
    else if (!centrado) consejo = 'Muévete un poco hacia el centro del cuadro.';
  } else if (detectorPose) {
    consejo = 'Aléjate hasta que la cámara pueda ver cabeza, hombros, codos y manos.';
  }

  const cuerpoNecesario = detectorPose ? cuerpo : true;
  const rostroNecesario = detectorRostro ? rostro : true;
  const encuadreNecesario = detectorPose ? encuadre : true;
  const apta = manos > 0 && cuerpoNecesario && rostroNecesario && luz.ok && encuadreNecesario;

  if (!manos) consejo = 'Muestra al menos una mano dentro del cuadro.';
  else if (detectorRostro && !rostro) consejo = 'Mira hacia la cámara y mantén el rostro visible.';
  else if (!luz.ok) consejo = luz.brillo < 55 ? 'Hay poca luz. Coloca una luz delante de ti.' : 'Hay demasiada luz. Evita una ventana o foco fuerte detrás o frente a ti.';
  else if (!consejo && luz.contraste < 18) consejo = 'Usa ropa y un fondo que contrasten mejor.';
  else if (!consejo && apta) consejo = 'Encuadre correcto. Mantén cabeza, hombros, antebrazos y manos dentro del marco.';

  return { manos, cuerpo, rostro, luz: luz.ok, encuadre: encuadreNecesario, apta, distancia, brillo: luz.brillo, contraste: luz.contraste, consejo };
}
'''
js = js[:inicio] + nuevo + js[fin:]

js = repl(
    js,
    "  if (ui.silueta) {\n    ui.silueta.classList.toggle('lista', !!calidad.apta);\n    ui.silueta.classList.toggle('ajustar', !calidad.apta);\n  }",
    "  if (ui.guia) {\n    ui.guia.classList.toggle('lista', !!calidad.apta);\n    ui.guia.classList.toggle('ajustar', !calidad.apta);\n  }",
    'estado visual guía'
)

js = repl(
    js,
    "    ['Encuadre', detectorPose ? calidad.encuadre : null, detectorPose ? (calidad.encuadre ? 'Bien' : 'Mejorar') : 'Opcional']",
    "    ['Encuadre', detectorPose ? calidad.encuadre : null, detectorPose ? (calidad.encuadre ? 'Bien' : 'Mejorar') : 'Opcional'],\n    ['Distancia', detectorPose ? calidad.distancia === 'bien' : null, detectorPose ? (calidad.distancia === 'cerca' ? 'Aléjate' : calidad.distancia === 'lejos' ? 'Acércate' : calidad.distancia === 'bien' ? 'Bien' : 'Ajustar') : 'Opcional']",
    'chip distancia'
)

# Sustituir la silueta falsa por una zona segura real, basada en el tracking.
svg_inicio = html.index('          <svg id="siluetaGuiaSenas"')
svg_fin = html.index('          <div id="cuentaRegresivaSenas"', svg_inicio)
html = html[:svg_inicio] + html[svg_fin:]

css_inicio = html.index('.camara{position:relative;')
css_fin = html.index('.cuenta-regresiva{', css_inicio)
css_nuevo = '''.camara{position:relative;aspect-ratio:16/9;background:#050a12;border-radius:14px;overflow:hidden;display:grid;place-items:center}.camara video,.camara canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}.camara canvas{pointer-events:none}.guia-captura{position:absolute;z-index:2;inset:5.5% 5%;border:2px dashed rgba(255,255,255,.72);border-radius:22px;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(15,23,42,.14),inset 0 0 28px rgba(2,132,199,.08);transition:border-color .2s ease,box-shadow .2s ease}.guia-captura.ajustar{border-color:rgba(251,191,36,.82);box-shadow:inset 0 0 0 1px rgba(15,23,42,.12),inset 0 0 26px rgba(245,184,24,.10)}.guia-captura.lista{border-color:rgba(34,197,94,.98);box-shadow:inset 0 0 0 2px rgba(34,197,94,.12),0 0 18px rgba(34,197,94,.22)}'''
html = html[:css_inicio] + css_nuevo + html[css_fin:]

html = html.replace(
    '@media(max-width:800px){.grid{grid-template-columns:1fr}.camara{aspect-ratio:4/3}.card{padding:12px}.acciones .btn{flex:1 1 145px}}@media(max-width:800px) and (orientation:portrait){.camara{aspect-ratio:3/4}.camara video,.camara canvas{object-fit:cover}.guia-captura{inset:4% 6%;border-radius:20px}.guia-captura:before{width:24%;left:38%;top:3%}}',
    '@media(max-width:800px){.grid{grid-template-columns:1fr}.camara{aspect-ratio:16/9}.card{padding:12px}.acciones .btn{flex:1 1 145px}}@media(max-width:800px) and (orientation:portrait){.camara{width:min(100%,496px);aspect-ratio:4/5;margin-inline:auto}.camara video,.camara canvas{object-fit:cover}.guia-captura{inset:4.5% 5%;border-radius:20px}}'
)

html = html.replace('↔ Cabeza, hombros y manos visibles', '↔ Cabeza, hombros, codos y manos visibles')
html = html.replace('js/lab-senas-ia.js?v=20260914-7', 'js/lab-senas-ia.js?v=20260914-8')

JS.write_text(js, encoding='utf-8')
HTML.write_text(html, encoding='utf-8')
print('OK: guía estática retirada; encuadre real reforzado')
