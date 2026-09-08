from pathlib import Path
import re
import subprocess

index = Path("index.html")
html = index.read_text(encoding="utf-8")

if 'id="btnMenuJuegoOraciones"' not in html:
    card = (
        '\n                        <div class="col-6 col-md-3 menu-juego-col">\n'
        '                            <button type="button" class="quiz-selector-btn menu-juego-btn w-100 h-100" id="btnMenuJuegoOraciones" aria-label="Juego Construye la oración">\n'
        '                                <span class="icono">💬</span>\n'
        '                                <span class="fw-bold">Oraciones</span>\n'
        '                            </button>\n'
        '                        </div>'
    )
    patron_tarjeta = re.compile(
        r'(<div class="col-6 col-md-3 menu-juego-col">\s*'
        r'<button[^>]*id="btnMenuJuegoMatematicas"[^>]*>.*?</button>\s*</div>)',
        re.S,
    )
    html, n = patron_tarjeta.subn(lambda m: m.group(1) + card, html, count=1)
    if n != 1:
        raise SystemExit("No se pudo ubicar la tarjeta de Matemáticas")

html = html.replace('js/oraciones.js?v=20260908b"', 'js/oraciones.js?v=20260908c"')
index.write_text(html, encoding="utf-8")

js_path = Path("js/oraciones.js")
js = js_path.read_text(encoding="utf-8")
patron = re.compile(
    r'  function asegurarBoton\(\)\{\n.*?\n  \}\n\n  function alCargar\(\)\{',
    re.S,
)
nuevo = (
    '  function asegurarBoton(){\n'
    '    let btn=document.getElementById("btnMenuJuegoOraciones");\n'
    '\n'
    '    // La tarjeta Oraciones vive de forma permanente en index.html.\n'
    '    // Este respaldo solo la crea si alguien abre una copia vieja del HTML.\n'
    '    if(!btn){\n'
    '      const fila=document.querySelector("#quizMenuJuegos .row");\n'
    '      if(!fila) return;\n'
    '      const col=document.createElement("div");\n'
    '      col.className="col-6 col-md-3 menu-juego-col";\n'
    '      col.innerHTML=`<button type="button" class="quiz-selector-btn menu-juego-btn w-100 h-100" id="btnMenuJuegoOraciones" aria-label="Juego Construye la oración"><span class="icono">💬</span><span class="fw-bold">Oraciones</span></button>`;\n'
    '      fila.appendChild(col);\n'
    '      btn=col.querySelector("#btnMenuJuegoOraciones");\n'
    '    }\n'
    '\n'
    '    if(btn && btn.dataset.oracionesListo!=="1"){\n'
    '      btn.dataset.oracionesListo="1";\n'
    '      btn.addEventListener("click",()=>iniciar());\n'
    '    }\n'
    '  }\n'
    '\n'
    '  function alCargar(){'
)
js, n = patron.subn(nuevo, js, count=1)
if n != 1:
    raise SystemExit("No se pudo actualizar asegurarBoton()")
js_path.write_text(js, encoding="utf-8")

sw = Path("sw.js")
sw_text = sw.read_text(encoding="utf-8")
sw_text = re.sub(r'const VERSION_APP = "v\d+";', 'const VERSION_APP = "v13";', sw_text, count=1)
sw.write_text(sw_text, encoding="utf-8")

subprocess.run(["node", "--check", "js/oraciones.js"], check=True)

html_final = index.read_text(encoding="utf-8")
js_final = js_path.read_text(encoding="utf-8")
sw_final = sw.read_text(encoding="utf-8")
assert html_final.count('id="btnMenuJuegoOraciones"') == 1
assert 'btn.dataset.oracionesListo' in js_final
assert 'js/oraciones.js?v=20260908c' in html_final
assert 'const VERSION_APP = "v13";' in sw_final
print("Corrección Oraciones: OK")
