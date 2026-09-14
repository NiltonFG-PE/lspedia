from pathlib import Path

p = Path('lab-senas-ia.html')
s = p.read_text(encoding='utf-8')

old_css = ".acciones{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}"
new_css = ".acciones{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.acciones-camara{position:sticky;top:8px;z-index:9;margin:0 0 12px;padding:8px;background:rgba(255,255,255,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid #dce3ec;border-radius:13px;box-shadow:0 8px 20px rgba(15,23,42,.10)}.acciones-camara .btn{flex:1 1 130px}.acciones-camara #btnCamaraSenas{order:1}.acciones-camara #btnReconocerSenas{order:2}.acciones-camara #btnCambiarCamaraSenas{order:3}.acciones-camara #btnDetenerSenas{order:4}"
if s.count(old_css) != 1:
    raise SystemExit(f'CSS base esperado 1 vez; encontrado {s.count(old_css)}')
s = s.replace(old_css, new_css, 1)

old_media = "@media(max-width:800px){.grid{grid-template-columns:1fr}.camara{aspect-ratio:16/9}.card{padding:12px}.acciones .btn{flex:1 1 145px}.prediccion-panel{padding:11px 12px}"
new_media = "@media(max-width:800px){.grid{grid-template-columns:1fr}.camara{aspect-ratio:16/9}.card{padding:12px}.acciones .btn{flex:1 1 145px}.acciones-camara{display:grid;grid-template-columns:1fr 1fr;gap:7px;top:6px;padding:7px}.acciones-camara .btn{width:100%;min-height:46px;padding:9px 8px;font-size:.92rem}.prediccion-panel{padding:11px 12px}"
if s.count(old_media) != 1:
    raise SystemExit(f'Media query esperado 1 vez; encontrado {s.count(old_media)}')
s = s.replace(old_media, new_media, 1)

controls = '''        <div class="acciones">
          <button id="btnCamaraSenas" class="btn btn-primary" type="button">Activar cámara</button>
          <button id="btnDetenerSenas" class="btn btn-soft" type="button" disabled>Detener</button>
          <button id="btnCambiarCamaraSenas" class="btn btn-soft" type="button" disabled>Cambiar cámara</button>
          <button id="btnReconocerSenas" class="btn btn-dark" type="button" disabled>Buscar seña</button>
        </div>'''
if s.count(controls) != 1:
    raise SystemExit(f'Bloque de controles esperado 1 vez; encontrado {s.count(controls)}')
s = s.replace(controls, '', 1)

anchor = '''      <section class="card">
        <div class="prediccion-panel" aria-label="Predicción de la seña">'''
replacement = '''      <section class="card">
        <div class="acciones acciones-camara" aria-label="Controles de cámara y búsqueda">
          <button id="btnCamaraSenas" class="btn btn-primary" type="button">Activar cámara</button>
          <button id="btnDetenerSenas" class="btn btn-soft" type="button" disabled>Detener</button>
          <button id="btnCambiarCamaraSenas" class="btn btn-soft" type="button" disabled>Cambiar cámara</button>
          <button id="btnReconocerSenas" class="btn btn-dark" type="button" disabled>Buscar seña</button>
        </div>
        <div class="prediccion-panel" aria-label="Predicción de la seña">'''
if s.count(anchor) != 1:
    raise SystemExit(f'Ancla principal esperada 1 vez; encontrada {s.count(anchor)}')
s = s.replace(anchor, replacement, 1)

for id_ in ['btnCamaraSenas','btnDetenerSenas','btnCambiarCamaraSenas','btnReconocerSenas']:
    n = s.count(f'id="{id_}"')
    if n != 1:
        raise SystemExit(f'{id_}: esperado 1; encontrado {n}')

p.write_text(s, encoding='utf-8')
print('OK: controles IA reubicados arriba y sticky')
