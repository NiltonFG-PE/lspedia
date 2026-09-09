from pathlib import Path

repo = Path(__file__).resolve().parents[1]
js_path = repo / "js" / "subtitulos.js"
css_path = repo / "css" / "subtitulos.css"
sw_path = repo / "sw.js"

js = js_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")
sw = sw_path.read_text(encoding="utf-8")

marker = "SUBTITULOS_V6_ICONO_AMARILLO_20260909"
if marker in js or marker in css:
    raise SystemExit("La mejora V6 ya fue aplicada")

old_icon = '<div class="subtitulos-hero-icono" aria-hidden="true">CC</div>'
new_icon = '''<div class="subtitulos-hero-icono subtitulos-hero-icono-imagen" aria-hidden="true">
                    <img src="img/categorias/Subtítulos.webp" alt="" class="subtitulos-hero-icono-img">
                </div>'''
if old_icon not in js:
    raise SystemExit("No se encontró el icono CC esperado en js/subtitulos.js")
js = js.replace(old_icon, new_icon, 1)
js = js.replace('// SUBTITULOS_V5_ORDEN_VISUAL_20260909', '// SUBTITULOS_V6_ICONO_AMARILLO_20260909\n    // Usa el icono oficial existente de img/categorias/Subtítulos.webp y\n    // mantiene la interfaz V5 reordenada.\n    // SUBTITULOS_V5_ORDEN_VISUAL_20260909', 1)

old_bg = 'background: linear-gradient(100deg, #2563eb 0%, #0ea5e9 100%) !important;'
old_shadow = 'box-shadow: 0 10px 24px rgba(37,99,235,.28);'
old_hover_shadow = 'box-shadow: 0 14px 30px rgba(37,99,235,.34);'
if old_bg not in css or old_shadow not in css or old_hover_shadow not in css:
    raise SystemExit("No se encontró el estilo V5 esperado del botón principal")
css = css.replace(old_bg, 'background: linear-gradient(100deg, #ffd54a 0%, #fbbc04 100%) !important;', 1)
css = css.replace('color: #fff !important;\n    font-weight: 800 !important;', 'color: #10224b !important;\n    font-weight: 800 !important;', 1)
css = css.replace(old_shadow, 'box-shadow: 0 10px 24px rgba(251,188,4,.34);', 1)
css = css.replace(old_hover_shadow, 'box-shadow: 0 14px 30px rgba(251,188,4,.42);', 1)

css_append = r'''

/* SUBTITULOS_V6_ICONO_AMARILLO_20260909
   Ajuste de identidad visual LSPedia: botón principal amarillo e icono
   oficial de Subtítulos en lugar del bloque con letras CC. */
.subtitulos-hero-icono.subtitulos-hero-icono-imagen {
    padding: 9px;
    overflow: hidden;
    background: linear-gradient(180deg, #fff7d6 0%, #ffed9b 100%);
    border: 1px solid rgba(251,188,4,.34);
    box-shadow: 0 8px 20px rgba(251,188,4,.16);
}
.subtitulos-hero-icono-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.subtitulos-btn-principal-v5 .subtitulos-icono-grabar {
    box-shadow: 0 0 0 5px rgba(239,68,68,.13);
}
@media (max-width: 767.98px) {
    .subtitulos-hero-icono.subtitulos-hero-icono-imagen { padding: 7px; }
}
'''
css = css.rstrip() + css_append + "\n"

if 'const VERSION_APP = "v45";' not in sw:
    raise SystemExit("La versión esperada de la PWA no es v45")
sw = sw.replace('const VERSION_APP = "v45";', 'const VERSION_APP = "v46";', 1)

js_path.write_text(js.rstrip() + "\n", encoding="utf-8")
css_path.write_text(css.rstrip() + "\n", encoding="utf-8")
sw_path.write_text(sw.rstrip() + "\n", encoding="utf-8")
