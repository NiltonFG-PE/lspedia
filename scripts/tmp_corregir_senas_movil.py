#!/usr/bin/env python3
from pathlib import Path

JS = Path('js/lab-senas-ia.js')
HTML = Path('lab-senas-ia.html')


def repl(text, old, new, name):
    if old not in text:
        raise SystemExit(f'No se encontró bloque para {name}')
    return text.replace(old, new, 1)

js = JS.read_text(encoding='utf-8')
html = HTML.read_text(encoding='utf-8')

js = repl(js,
"""async function obtenerStreamCamara() {
  const video = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 }
  };
  if (dispositivoCamaraActual) video.deviceId = { exact: dispositivoCamaraActual };
  else video.facingMode = { ideal: 'user' };
  return navigator.mediaDevices.getUserMedia({ audio: false, video });
}
""",
"""function pantallaVertical() {
  try {
    if (window.matchMedia) return window.matchMedia('(orientation: portrait)').matches;
  } catch (_e) {}
  return window.innerHeight > window.innerWidth;
}

async function obtenerStreamCamara() {
  const vertical = pantallaVertical();
  const video = vertical ? {
    width: { ideal: 720 },
    height: { ideal: 1280 },
    aspectRatio: { ideal: 9 / 16 },
    frameRate: { ideal: 30, max: 30 }
  } : {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    aspectRatio: { ideal: 16 / 9 },
    frameRate: { ideal: 30, max: 30 }
  };
  if (dispositivoCamaraActual) video.deviceId = { exact: dispositivoCamaraActual };
  else video.facingMode = { ideal: 'user' };
  return navigator.mediaDevices.getUserMedia({ audio: false, video });
}
""",
'obtenerStreamCamara vertical')

js = repl(js,
"""function ajustarCanvas() {
  const w = ui.video.videoWidth || 1280;
  const h = ui.video.videoHeight || 720;
  if (ui.canvas.width !== w) ui.canvas.width = w;
  if (ui.canvas.height !== h) ui.canvas.height = h;
}
""",
"""function ajustarCanvas() {
  const w = ui.video.videoWidth || (pantallaVertical() ? 720 : 1280);
  const h = ui.video.videoHeight || (pantallaVertical() ? 1280 : 720);
  if (ui.canvas.width !== w) ui.canvas.width = w;
  if (ui.canvas.height !== h) ui.canvas.height = h;
  const marco = ui.video.closest ? ui.video.closest('.camara') : null;
  if (marco) marco.dataset.orientacion = pantallaVertical() ? 'vertical' : 'horizontal';
}
""",
'ajustarCanvas vertical')

js = repl(js,
"""  if (!todas.length) {
    ui.calidad.textContent = 'Aún no hay muestras. Para una primera prueba útil, intenta reunir al menos 5 muestras por concepto.';
    return;
  }
""",
"""  if (!todas.length) {
    ui.calidad.textContent = 'Aún no hay muestras en este navegador. Si ya grabaste muestras en otra computadora, celular o navegador, no se sincronizan automáticamente: usa Exportar JSON en ese dispositivo e Importar JSON aquí. Para una primera prueba nueva, intenta reunir al menos 5 muestras por concepto.';
    return;
  }
""",
'mensaje muestras por dispositivo')

js = repl(js,
"""  ui.contador.textContent = `${todas.length} muestra${todas.length === 1 ? '' : 's'} totales · ${muestrasLocales.length} locales · ${muestrasCentrales.length} centrales · ${grupos.size} concepto${grupos.size === 1 ? '' : 's'}`;
""",
"""  ui.contador.textContent = `${todas.length} muestra${todas.length === 1 ? '' : 's'} totales · ${muestrasLocales.length} locales en este dispositivo · ${muestrasCentrales.length} centrales · ${grupos.size} concepto${grupos.size === 1 ? '' : 's'}`;
""",
'contador locales dispositivo')

html = repl(html,
"""@media(max-width:800px){.grid{grid-template-columns:1fr}.camara{aspect-ratio:4/3}.card{padding:12px}.acciones .btn{flex:1 1 145px}}""",
"""@media(max-width:800px){.grid{grid-template-columns:1fr}.camara{aspect-ratio:4/3}.card{padding:12px}.acciones .btn{flex:1 1 145px}}@media(max-width:800px) and (orientation:portrait){.camara{aspect-ratio:3/4}.camara video,.camara canvas{object-fit:contain}.guia-captura{inset:4% 6%;border-radius:20px}.guia-captura:before{width:24%;left:38%;top:3%}}""",
'CSS vertical móvil')

html = repl(html,
"""        <div id=\"contadorMuestrasSenas\" class=\"contador\"></div>
        <div id=\"estadoDatasetCentralSenas\" class=\"contador\"></div>
""",
"""        <div id=\"contadorMuestrasSenas\" class=\"contador\"></div>
        <div id=\"estadoDatasetCentralSenas\" class=\"contador\"></div>
        <p class=\"help\"><strong>Importante:</strong> las muestras locales pertenecen a este navegador y dispositivo. Si las grabaste en otra computadora, celular o navegador, expórtalas allí como JSON e impórtalas aquí.</p>
""",
'aviso muestras locales')

html = html.replace('js/lab-senas-ia.js?v=20260914-5', 'js/lab-senas-ia.js?v=20260914-6', 1)

JS.write_text(js, encoding='utf-8')
HTML.write_text(html, encoding='utf-8')
print('Corrección móvil aplicada.')
