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

# 1) UI y estado de preparación automática.
js = repl(js,
"""  calidadCaptura: $('calidadCapturaSenas'), btnCambiarCamara: $('btnCambiarCamaraSenas'),
  cuenta: $('cuentaRegresivaSenas'), cuentaTexto: $('textoCuentaSenas'), cuentaNumero: $('numeroCuentaSenas')
};""",
"""  calidadCaptura: $('calidadCapturaSenas'), btnCambiarCamara: $('btnCambiarCamaraSenas'),
  cuenta: $('cuentaRegresivaSenas'), cuentaTexto: $('textoCuentaSenas'), cuentaNumero: $('numeroCuentaSenas'),
  silueta: $('siluetaGuiaSenas')
};""",
'ui silueta')

js = repl(js,
"""let calidadActual = { manos: 0, cuerpo: false, rostro: false, luz: true, encuadre: false, apta: false };
const canvasLuz = document.createElement('canvas');""",
"""let calidadActual = { manos: 0, cuerpo: false, rostro: false, luz: true, encuadre: false, apta: false };
let solicitudCaptura = null;
let calidadAptaDesde = 0;
let temporizadorOrientacion = 0;
let ultimaOrientacionVista = '';
const ESTABILIDAD_ANTES_CUENTA_MS = 1100;
const canvasLuz = document.createElement('canvas');""",
'estado preparación automática')

# 2) Orientación dinámica: el dispositivo puede girarse en cualquier momento.
js = repl(js,
"""function pantallaVertical() {
  try {
    if (window.matchMedia) return window.matchMedia('(orientation: portrait)').matches;
  } catch (_e) {}
  return window.innerHeight > window.innerWidth;
}

async function obtenerStreamCamara() {""",
"""function pantallaVertical() {
  try {
    if (window.matchMedia) return window.matchMedia('(orientation: portrait)').matches;
  } catch (_e) {}
  return window.innerHeight > window.innerWidth;
}

function aplicarOrientacionVista() {
  const vertical = pantallaVertical();
  const orientacion = vertical ? 'vertical' : 'horizontal';
  const marco = ui.video && ui.video.closest ? ui.video.closest('.camara') : null;
  if (marco) marco.dataset.orientacion = orientacion;
  ultimaOrientacionVista = orientacion;
  ajustarCanvas();
}

async function adaptarCamaraAOrientacion() {
  aplicarOrientacionVista();
  if (!activo || !stream) return;
  const pista = stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
  if (!pista || typeof pista.applyConstraints !== 'function') return;
  const vertical = pantallaVertical();
  try {
    await pista.applyConstraints(vertical ? {
      width: { ideal: 720 }, height: { ideal: 1280 }, aspectRatio: { ideal: 9 / 16 }, frameRate: { ideal: 30, max: 30 }
    } : {
      width: { ideal: 1280 }, height: { ideal: 720 }, aspectRatio: { ideal: 16 / 9 }, frameRate: { ideal: 30, max: 30 }
    });
  } catch (_e) {
    // Algunos navegadores mantienen la relación nativa del sensor. La vista usa cover y sigue adaptándose.
  }
  setTimeout(ajustarCanvas, 120);
}

function programarAdaptacionOrientacion() {
  if (temporizadorOrientacion) clearTimeout(temporizadorOrientacion);
  temporizadorOrientacion = setTimeout(() => {
    temporizadorOrientacion = 0;
    adaptarCamaraAOrientacion();
  }, 180);
}

async function obtenerStreamCamara() {""",
'orientación dinámica')

js = repl(js,
"""    ajustarCanvas();
    await listarCamaras();""",
"""    aplicarOrientacionVista();
    await adaptarCamaraAOrientacion();
    await listarCamaras();""",
'inicio cámara orientación')

js = repl(js,
"""  capturaReconocimiento = null;
  preparandoCaptura = false;
  ventanaActual = [];""",
"""  capturaReconocimiento = null;
  solicitudCaptura = null;
  calidadAptaDesde = 0;
  preparandoCaptura = false;
  ventanaActual = [];""",
'detener limpia solicitud')

# 3) Silueta reacciona a la calidad.
js = repl(js,
"""function renderCalidadCaptura(calidad, mensajeExtra = '') {
  if (!ui.calidadCaptura) return;
  ui.calidadCaptura.textContent = '';""",
"""function renderCalidadCaptura(calidad, mensajeExtra = '') {
  if (ui.silueta) {
    ui.silueta.classList.toggle('lista', !!calidad.apta);
    ui.silueta.classList.toggle('ajustar', !calidad.apta);
  }
  if (!ui.calidadCaptura) return;
  ui.calidadCaptura.textContent = '';""",
'silueta según calidad')

# 4) Cuenta regresiva cancela si se pierde el encuadre.
js = repl(js,
"""async function cuentaRegresiva(texto) {
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
}""",
"""async function cuentaRegresiva(texto, exigirCalidad = true) {
  if (preparandoCaptura) return false;
  preparandoCaptura = true;
  let valida = true;
  if (ui.cuenta) ui.cuenta.hidden = false;
  if (ui.cuentaTexto) ui.cuentaTexto.textContent = texto || 'Prepárate';
  for (const numero of [3, 2, 1]) {
    if (!activo || (exigirCalidad && !calidadActual.apta)) {
      valida = false;
      break;
    }
    if (ui.cuentaNumero) ui.cuentaNumero.textContent = String(numero);
    await esperar(700);
  }
  if (ui.cuenta) ui.cuenta.hidden = true;
  preparandoCaptura = false;
  return activo && valida;
}""",
'cuenta con control de calidad')

# 5) Preparación automática: pulsar acción -> colocarse -> 3,2,1 automático.
insert_before = """function procesarResultado(resultado, resultadoPose, resultadoRostro, tiempo = performance.now()) {"""
new_block = """async function iniciarCuentaDesdeSolicitud() {
  const solicitud = solicitudCaptura;
  if (!solicitud || preparandoCaptura || captura || capturaReconocimiento) return;
  const texto = solicitud.tipo === 'muestra' ? 'Prepárate para grabar' : 'Prepárate para buscar';
  const listo = await cuentaRegresiva(texto, true);
  if (!activo || solicitudCaptura !== solicitud) return;
  if (!listo) {
    calidadAptaDesde = 0;
    estado('Vuelve a colocarte dentro de la silueta. La cuenta regresiva empezará sola cuando todo esté listo.');
    return;
  }

  solicitudCaptura = null;
  calidadAptaDesde = 0;
  if (solicitud.tipo === 'muestra') {
    captura = {
      etiqueta: solicitud.etiqueta,
      frames: [],
      inicio: performance.now(),
      dimensionObjetivo: solicitud.dimensionObjetivo
    };
    ui.progreso.textContent = `Grabando 0/${FRAMES_MUESTRA}…`;
    estado(`Grabando “${solicitud.etiqueta}”. Haz la seña completa de forma natural.`);
  } else {
    capturaReconocimiento = {
      frames: [],
      inicio: performance.now(),
      dimensionObjetivo: solicitud.dimensionObjetivo
    };
    estado('Haz la seña ahora. Mantén cabeza, hombros y manos dentro del cuadro.');
  }
}

function gestionarPreparacionAutomatica(tiempo) {
  if (!solicitudCaptura || captura || capturaReconocimiento || preparandoCaptura) return;
  if (!calidadActual.apta) {
    calidadAptaDesde = 0;
    return;
  }
  if (!calidadAptaDesde) {
    calidadAptaDesde = tiempo;
    estado('Muy bien. Mantén esa posición un momento…');
    return;
  }
  const transcurrido = tiempo - calidadAptaDesde;
  if (transcurrido >= ESTABILIDAD_ANTES_CUENTA_MS) {
    calidadAptaDesde = 0;
    iniciarCuentaDesdeSolicitud();
  }
}

""" + insert_before
js = repl(js, insert_before, new_block, 'preparación automática')

js = repl(js,
"""  calidadActual = evaluarCalidadCaptura(resultado, resultadoPose, resultadoRostro, tiempo);
  renderCalidadCaptura(calidadActual);

  const vector = vectorNormalizado(resultado, resultadoPose, resultadoRostro);""",
"""  calidadActual = evaluarCalidadCaptura(resultado, resultadoPose, resultadoRostro, tiempo);
  renderCalidadCaptura(calidadActual);
  gestionarPreparacionAutomatica(tiempo);

  const vector = vectorNormalizado(resultado, resultadoPose, resultadoRostro);""",
'gestión dentro del procesamiento')

# 6) Botones ahora solo arman la captura; la posición dispara la cuenta regresiva.
old_iniciar = """async function iniciarCaptura() {
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
}"""
new_iniciar = """function iniciarCaptura() {
  const etiqueta = etiquetaValida(ui.etiqueta.value);
  if (!activo) return estado('Activa la cámara primero.', 'error');
  if (!etiqueta) return estado('Escribe el concepto de la seña antes de grabar.', 'error');
  if (captura || capturaReconocimiento || preparandoCaptura || solicitudCaptura) return;
  solicitudCaptura = { tipo: 'muestra', etiqueta, dimensionObjetivo: dimensionObjetivoCaptura() };
  calidadAptaDesde = 0;
  ui.btnMuestra.disabled = true;
  ui.btnReconocer.disabled = true;
  ui.progreso.textContent = 'Colócate dentro de la silueta.';
  estado('Colócate dentro de la silueta. Cuando manos, cuerpo, rostro, luz y encuadre estén listos, comenzará 3–2–1 automáticamente.');
}"""
js = repl(js, old_iniciar, new_iniciar, 'iniciar muestra automático')

old_reconocer = """async function reconocer() {
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
}"""
new_reconocer = """function reconocer() {
  if (!activo) return estado('Activa la cámara primero.', 'error');
  if (captura || capturaReconocimiento || preparandoCaptura || solicitudCaptura) return;
  const banco = todasLasMuestras();
  if (!banco.length) return estado('Todavía no hay muestras de referencia.', 'error');
  solicitudCaptura = { tipo: 'reconocimiento', dimensionObjetivo: dimensionObjetivoCaptura() };
  calidadAptaDesde = 0;
  ui.btnReconocer.disabled = true;
  ui.btnMuestra.disabled = true;
  ui.resultados.textContent = '';
  estado('Colócate dentro de la silueta. Cuando estés bien ubicado, comenzará 3–2–1 automáticamente.');
}"""
js = repl(js, old_reconocer, new_reconocer, 'reconocer automático')

# Restablecer ambos botones al finalizar/cancelar.
js = js.replace("""    ui.btnMuestra.disabled = false;
    ui.progreso.textContent = 'No se guardó la muestra.';""",
"""    ui.btnMuestra.disabled = false;
    ui.btnReconocer.disabled = false;
    ui.progreso.textContent = 'No se guardó la muestra.';""", 1)
js = js.replace("""    ui.btnReconocer.disabled = false;
  }
  estado('No se logró mantener manos, cuerpo y rostro visibles.""",
"""    ui.btnReconocer.disabled = false;
    ui.btnMuestra.disabled = false;
  }
  estado('No se logró mantener manos, cuerpo y rostro visibles.""", 1)
js = js.replace("""  capturaReconocimiento = null;
  ui.btnReconocer.disabled = false;
  const top = candidatosPara""",
"""  capturaReconocimiento = null;
  ui.btnReconocer.disabled = false;
  ui.btnMuestra.disabled = false;
  const top = candidatosPara""", 1)
js = js.replace("""  captura = null;
  ui.btnMuestra.disabled = false;
  if (!nueva) {""",
"""  captura = null;
  ui.btnMuestra.disabled = false;
  ui.btnReconocer.disabled = false;
  if (!nueva) {""", 1)

# 7) Escuchar cambios reales de orientación.
js = repl(js,
"""ui.btnBorrarTodo?.addEventListener('click', borrarTodoLocal);
window.addEventListener('pagehide', detenerCamara, { once: true });

renderMuestras();""",
"""ui.btnBorrarTodo?.addEventListener('click', borrarTodoLocal);
window.addEventListener('resize', programarAdaptacionOrientacion, { passive: true });
window.addEventListener('orientationchange', programarAdaptacionOrientacion, { passive: true });
try { screen.orientation?.addEventListener?.('change', programarAdaptacionOrientacion); } catch (_e) {}
window.addEventListener('pagehide', detenerCamara, { once: true });
aplicarOrientacionVista();

renderMuestras();""",
'listeners orientación')

# 8) HTML: cover en vertical, silueta, estilos reactivos y versión nueva del módulo.
html = html.replace("""@media(max-width:800px) and (orientation:portrait){.camara{aspect-ratio:3/4}.camara video,.camara canvas{object-fit:contain}.guia-captura""",
"""@media(max-width:800px) and (orientation:portrait){.camara{aspect-ratio:3/4}.camara video,.camara canvas{object-fit:cover}.guia-captura""", 1)

html = repl(html,
""".guia-captura:before{content:'';position:absolute;width:18%;aspect-ratio:1/1.25;border:2px solid rgba(56,189,248,.48);border-radius:50%;left:41%;top:4%}.cuenta-regresiva""",
""".guia-captura:before{content:'';position:absolute;width:18%;aspect-ratio:1/1.25;border:2px solid rgba(56,189,248,.48);border-radius:50%;left:41%;top:4%}.silueta-guia{position:absolute;z-index:3;left:50%;top:50%;width:54%;height:88%;transform:translate(-50%,-50%);pointer-events:none;overflow:visible;filter:drop-shadow(0 0 5px rgba(56,189,248,.28));transition:filter .2s ease,opacity .2s ease}.silueta-guia .cuerpo,.silueta-guia .manos{fill:rgba(56,189,248,.035);stroke:rgba(125,211,252,.68);stroke-width:1.7;stroke-dasharray:3 2;vector-effect:non-scaling-stroke}.silueta-guia.lista{filter:drop-shadow(0 0 9px rgba(34,197,94,.7))}.silueta-guia.lista .cuerpo,.silueta-guia.lista .manos{stroke:rgba(34,197,94,.95);fill:rgba(34,197,94,.045)}.silueta-guia.ajustar{opacity:.86}.camara[data-orientacion=vertical] .silueta-guia{width:78%;height:91%}.camara[data-orientacion=horizontal] .silueta-guia{width:54%;height:90%}.cuenta-regresiva""",
'estilos silueta')

html = repl(html,
'          <div class="guia-captura" aria-hidden="true"></div>\n          <div id="cuentaRegresivaSenas"',
'          <div class="guia-captura" aria-hidden="true"></div>\n          <svg id="siluetaGuiaSenas" class="silueta-guia ajustar" viewBox="0 0 100 150" aria-hidden="true" focusable="false">\n            <ellipse class="cuerpo" cx="50" cy="24" rx="11" ry="14"></ellipse>\n            <path class="cuerpo" d="M31 58 Q37 45 50 44 Q63 45 69 58 L75 112 Q64 124 50 124 Q36 124 25 112 Z"></path>\n            <path class="cuerpo" d="M32 58 Q20 69 15 96 M68 58 Q80 69 85 96"></path>\n            <ellipse class="manos" cx="13" cy="104" rx="9" ry="12"></ellipse>\n            <ellipse class="manos" cx="87" cy="104" rx="9" ry="12"></ellipse>\n          </svg>\n          <div id="cuentaRegresivaSenas"',
'svg silueta')

html = html.replace("js/lab-senas-ia.js?v=20260914-6", "js/lab-senas-ia.js?v=20260914-7", 1)

JS.write_text(js, encoding='utf-8')
HTML.write_text(html, encoding='utf-8')
print('OK: orientación automática, silueta y cuenta regresiva automática aplicadas')
