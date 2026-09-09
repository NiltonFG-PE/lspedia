from pathlib import Path

repo = Path(__file__).resolve().parents[1]
css_path = repo / "css" / "subtitulos.css"
sw_path = repo / "sw.js"

css = css_path.read_text(encoding="utf-8")
sw = sw_path.read_text(encoding="utf-8")

marker = "SUBTITULOS_V7_BOTON_AMARILLO_20260909"
if marker in css:
    raise SystemExit("La mejora V7 ya fue aplicada")

old_block = '''#btnSubtitulosIniciar {
    min-height: 54px;
    padding-inline: 28px !important;
    color: #fff !important;
    border: 0 !important;
    background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%) !important;
    box-shadow: 0 12px 26px rgba(37,99,235,.25) !important;
}
#btnSubtitulosIniciar:hover,
#btnSubtitulosIniciar:focus-visible {
    box-shadow: 0 15px 32px rgba(37,99,235,.34) !important;
}'''

new_block = '''/* SUBTITULOS_V7_BOTON_AMARILLO_20260909
   El CTA principal usa el amarillo de identidad de LSPedia. */
#btnSubtitulosIniciar {
    min-height: 54px;
    padding-inline: 28px !important;
    color: #10224b !important;
    border: 0 !important;
    background: linear-gradient(135deg, #ffd54a 0%, #fbbc04 100%) !important;
    box-shadow: 0 12px 26px rgba(251,188,4,.34) !important;
}
#btnSubtitulosIniciar:hover,
#btnSubtitulosIniciar:focus-visible {
    background: linear-gradient(135deg, #ffdb5c 0%, #ffc107 100%) !important;
    color: #10224b !important;
    box-shadow: 0 15px 32px rgba(251,188,4,.44) !important;
}'''

if old_block not in css:
    raise SystemExit("No se encontró la regla azul dominante de #btnSubtitulosIniciar")

css = css.replace(old_block, new_block, 1)

if 'const VERSION_APP = "v46";' not in sw:
    raise SystemExit("La versión esperada de la PWA no es v46")
sw = sw.replace('const VERSION_APP = "v46";', 'const VERSION_APP = "v47";', 1)

css_path.write_text(css.rstrip() + "\n", encoding="utf-8")
sw_path.write_text(sw.rstrip() + "\n", encoding="utf-8")
