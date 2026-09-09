from pathlib import Path

repo = Path(__file__).resolve().parents[1]
js_path = repo / "js" / "script.js"
sw_path = repo / "sw.js"

js = js_path.read_text(encoding="utf-8")
sw = sw_path.read_text(encoding="utf-8")

marker = "CORRECCION_FUGA_VOCABULARIO_HERRAMIENTAS_20260909"
if marker in js:
    raise SystemExit("La corrección ya fue aplicada")

old = '''    const bloqueBuscadorCategorias = document.getElementById("bloqueBuscadorCategorias");
    if(bloqueBuscadorCategorias) bloqueBuscadorCategorias.classList.add("d-none");
    const filaBotonIndice = document.getElementById("filaBotonIndiceAlfabetico");'''
new = '''    const bloqueBuscadorCategorias = document.getElementById("bloqueBuscadorCategorias");
    if(bloqueBuscadorCategorias) bloqueBuscadorCategorias.classList.add("d-none");
    // CORRECCION_FUGA_VOCABULARIO_HERRAMIENTAS_20260909
    // Esta lista informativa pertenece exclusivamente a Vocabulario. Antes
    // no formaba parte de ocultarBloqueInicio(), por eso podía quedarse
    // visible al pasar a Herramientas y también al abrir uno de sus módulos.
    // Se oculta de forma centralizada acá; actualizarTituloPrincipal()
    // vuelve a mostrarla únicamente cuando la vista activa es Vocabulario.
    const listaVocabulario = document.getElementById("vocabularioIntroLista");
    if(listaVocabulario) listaVocabulario.classList.add("d-none");
    const filaBotonIndice = document.getElementById("filaBotonIndiceAlfabetico");'''

if old not in js:
    raise SystemExit("No se encontró el punto esperado en ocultarBloqueInicio()")
js = js.replace(old, new, 1)

if 'const VERSION_APP = "v43";' not in sw:
    raise SystemExit("La versión esperada de la PWA no es v43")
sw = sw.replace('const VERSION_APP = "v43";', 'const VERSION_APP = "v44";', 1)

js_path.write_text(js, encoding="utf-8")
sw_path.write_text(sw, encoding="utf-8")
