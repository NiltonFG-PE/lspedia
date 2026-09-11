from pathlib import Path

HTML = Path("index.html")
JS = Path("js/script.js")
CSS = Path("css/mejoras-producto.css")

html = HTML.read_text(encoding="utf-8")
js = JS.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")

if "INDICE_VOCABULARIO_V1_20260910" in css:
    raise SystemExit("La mejora del índice de Vocabulario ya está aplicada.")

# 1) Diccionario: mover el botón A-Z a la IZQUIERDA del buscador.
old_dic = '''                    <div class="buscador-indice-linea">
                        <div class="input-group input-group-lg shadow-sm" style="border-radius: 50px; border: 2px solid #ffc107; overflow: hidden; background-color: #fff;">
                            <input id="buscar" type="text" class="form-control border-0 px-4 shadow-none text-secondary" placeholder="Buscar palabra y significado" style="font-size: 1.1rem; background: transparent;">
                            <button class="btn px-4 d-flex align-items-center justify-content-center" type="button" id="btnBuscar">
                                <span style="font-size: 1.3rem;">🔍</span>
                            </button>
                        </div>

                        <div id="filaBotonIndiceAlfabetico" class="indice-compacto-wrap">
                            <button type="button" class="indice-compacto-btn" data-bs-toggle="collapse" data-bs-target="#indiceAlfabetico" aria-expanded="false" aria-controls="indiceAlfabetico" aria-label="Abrir índice alfabético A a Z" title="Abrir índice alfabético" id="btnToggleAbc">
                                <span class="indice-compacto-az">A-Z</span>
                                <span class="indice-compacto-texto d-none d-sm-inline">Índice</span>
                                <span class="indice-compacto-flecha" aria-hidden="true">⌄</span>
                            </button>
                        </div>
                    </div>'''
new_dic = '''                    <div class="buscador-indice-linea">
                        <div id="filaBotonIndiceAlfabetico" class="indice-compacto-wrap">
                            <button type="button" class="indice-compacto-btn" data-bs-toggle="collapse" data-bs-target="#indiceAlfabetico" aria-expanded="false" aria-controls="indiceAlfabetico" aria-label="Abrir índice alfabético A a Z" title="Abrir índice alfabético" id="btnToggleAbc">
                                <span class="indice-compacto-az">A-Z</span>
                                <span class="indice-compacto-texto d-none d-sm-inline">Índice</span>
                                <span class="indice-compacto-flecha" aria-hidden="true">⌄</span>
                            </button>
                        </div>

                        <div class="input-group input-group-lg shadow-sm" style="border-radius: 50px; border: 2px solid #ffc107; overflow: hidden; background-color: #fff;">
                            <input id="buscar" type="text" class="form-control border-0 px-4 shadow-none text-secondary" placeholder="Buscar palabra y significado" style="font-size: 1.1rem; background: transparent;">
                            <button class="btn px-4 d-flex align-items-center justify-content-center" type="button" id="btnBuscar">
                                <span style="font-size: 1.3rem;">🔍</span>
                            </button>
                        </div>
                    </div>'''
if old_dic not in html:
    raise SystemExit("No se encontró el bloque compacto actual del Diccionario.")
html = html.replace(old_dic, new_dic, 1)

# 2) Vocabulario: agregar su propio botón/índice azul a la IZQUIERDA.
old_vocab = '''        <div class="row justify-content-center mb-3 d-none" id="bloqueBuscadorCategorias">
            <div class="col-lg-8 position-relative">
                <div class="input-group input-group-lg shadow-sm" style="border-radius: 50px; border: 2px solid #0d6efd; overflow: hidden; background-color: #fff;">
                    <input id="buscarCategorias" type="text" class="form-control border-0 px-4 shadow-none text-secondary" placeholder="Buscar palabra del vocabulario" style="font-size: 1.1rem; background: transparent;">
                    <button class="btn px-4 d-flex align-items-center justify-content-center" type="button" id="btnBuscarCategorias" style="background-color: #0d6efd; color: #fff;">
                        <span style="font-size: 1.3rem;">🔍</span>
                    </button>
                </div>
                <div id="sugerenciasCategorias" class="list-group mt-2 shadow-sm position-absolute w-100 z-3" style="border-radius: 15px; overflow: hidden; display: none;"></div>
            </div>
        </div>'''

letras = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","Ñ","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
botones = "\n".join(
    f'                                <button class="btn btn-abc btn-abc-vocabulario" onclick="filtrarVocabularioPorLetra(\'{letra}\')">{letra}</button>'
    for letra in letras
)
new_vocab = f'''        <div class="row justify-content-center mb-3 d-none" id="bloqueBuscadorCategorias">
            <div class="col-lg-8 position-relative">
                <div class="buscador-indice-linea buscador-indice-linea-vocabulario">
                    <div id="filaBotonIndiceAlfabeticoVocabulario" class="indice-compacto-wrap">
                        <button type="button" class="indice-compacto-btn indice-compacto-btn-vocabulario" data-bs-toggle="collapse" data-bs-target="#indiceAlfabeticoVocabulario" aria-expanded="false" aria-controls="indiceAlfabeticoVocabulario" aria-label="Abrir índice alfabético de Vocabulario A a Z" title="Abrir índice alfabético de Vocabulario" id="btnToggleAbcVocabulario">
                            <span class="indice-compacto-az">A-Z</span>
                            <span class="indice-compacto-texto d-none d-sm-inline">Índice</span>
                            <span class="indice-compacto-flecha" aria-hidden="true">⌄</span>
                        </button>
                    </div>

                    <div class="input-group input-group-lg shadow-sm" style="border-radius: 50px; border: 2px solid #0d6efd; overflow: hidden; background-color: #fff;">
                        <input id="buscarCategorias" type="text" class="form-control border-0 px-4 shadow-none text-secondary" placeholder="Buscar palabra del vocabulario" style="font-size: 1.1rem; background: transparent;">
                        <button class="btn px-4 d-flex align-items-center justify-content-center" type="button" id="btnBuscarCategorias" style="background-color: #0d6efd; color: #fff;">
                            <span style="font-size: 1.3rem;">🔍</span>
                        </button>
                    </div>
                </div>
                <div id="sugerenciasCategorias" class="list-group mt-2 shadow-sm position-absolute w-100 z-3" style="border-radius: 15px; overflow: hidden; display: none;"></div>

                <div id="filaIndiceAlfabeticoVocabulario" class="indice-compacto-desplegable indice-compacto-desplegable-vocabulario">
                    <div class="collapse" id="indiceAlfabeticoVocabulario">
                        <div class="indice-alfabetico indice-alfabetico-vocabulario">
{botones}
                        </div>
                    </div>
                </div>
            </div>
        </div>'''
if old_vocab not in html:
    raise SystemExit("No se encontró el buscador actual de Vocabulario.")
html = html.replace(old_vocab, new_vocab, 1)

# 3) Diccionario: aislar el estado activo de sus letras para que no toque Vocabulario.
old_selector = 'document.querySelectorAll(".btn-abc").forEach(boton => {'
new_selector = 'document.querySelectorAll("#indiceAlfabetico .btn-abc").forEach(boton => {'
if old_selector not in js:
    raise SystemExit("No se encontró el selector de letras del Diccionario.")
js = js.replace(old_selector, new_selector, 1)

# 4) Estado abrir/cerrar del índice de Vocabulario.
anchor_nav = '// --- NAVEGACIÓN Y HISTORIAL DEL NAVEGADOR ---'
vocab_state = '''// ÍNDICE ALFABÉTICO DE VOCABULARIO
// Es independiente del índice del Diccionario: usa el azul de esta sección,
// arranca cerrado y se reinicia cada vez que se entra a Vocabulario.
function actualizarEstadoIndiceVocabulario(){
    const indice = document.getElementById("indiceAlfabeticoVocabulario");
    const btn = document.getElementById("btnToggleAbcVocabulario");
    if(!indice || !btn) return;

    const abierto = indice.classList.contains("show") || btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-label", abierto ? "Cerrar índice alfabético de Vocabulario A a Z" : "Abrir índice alfabético de Vocabulario A a Z");
    btn.setAttribute("title", abierto ? "Cerrar índice alfabético de Vocabulario" : "Abrir índice alfabético de Vocabulario");
}

function colapsarIndiceVocabulario(){
    const indice = document.getElementById("indiceAlfabeticoVocabulario");
    const btn = document.getElementById("btnToggleAbcVocabulario");
    if(!indice || !btn) return;

    if(indice.classList.contains("show")){
        if(typeof bootstrap !== "undefined" && bootstrap.Collapse){
            const instancia = bootstrap.Collapse.getInstance(indice) || new bootstrap.Collapse(indice, { toggle: false });
            instancia.hide();
        } else {
            indice.classList.remove("show");
            btn.setAttribute("aria-expanded", "false");
        }
    } else {
        btn.setAttribute("aria-expanded", "false");
    }
    actualizarEstadoIndiceVocabulario();
}

const indiceAlfabeticoVocabulario = document.getElementById("indiceAlfabeticoVocabulario");
if(indiceAlfabeticoVocabulario){
    indiceAlfabeticoVocabulario.addEventListener("shown.bs.collapse", actualizarEstadoIndiceVocabulario);
    indiceAlfabeticoVocabulario.addEventListener("hidden.bs.collapse", actualizarEstadoIndiceVocabulario);
}

'''
if anchor_nav not in js:
    raise SystemExit("No se encontró el ancla de navegación en script.js.")
js = js.replace(anchor_nav, vocab_state + anchor_nav, 1)

# 5) Al entrar a Vocabulario, empezar siempre con su índice cerrado.
old_show_vocab = '''function mostrarBuscadorDeCategorias(){
    if(bloqueBuscador) bloqueBuscador.classList.add("d-none");'''
new_show_vocab = '''function mostrarBuscadorDeCategorias(){
    colapsarIndiceVocabulario();
    if(bloqueBuscador) bloqueBuscador.classList.add("d-none");'''
if old_show_vocab not in js:
    raise SystemExit("No se encontró mostrarBuscadorDeCategorias().")
js = js.replace(old_show_vocab, new_show_vocab, 1)

# 6) Al limpiar Vocabulario, quitar también la letra activa.
old_clear = '''function limpiarResultadoCategorias(opciones = {}){
    if(resultadoCategorias) resultadoCategorias.innerHTML = "";'''
new_clear = '''function limpiarResultadoCategorias(opciones = {}){
    if(resultadoCategorias) resultadoCategorias.innerHTML = "";
    document.querySelectorAll("#indiceAlfabeticoVocabulario .btn-abc-vocabulario").forEach(boton => boton.classList.remove("active"));'''
if old_clear not in js:
    raise SystemExit("No se encontró limpiarResultadoCategorias().")
js = js.replace(old_clear, new_clear, 1)

# 7) Filtro A-Z exclusivo para Vocabulario.
anchor_cat = 'function mostrarCategoria(nombre, opciones = {}){'
filter_vocab = '''function filtrarVocabularioPorLetra(letra){
    const letraBuscada = String(letra || "").trim().toUpperCase();
    if(!letraBuscada || !resultadoCategorias) return;

    categoriaActualMostrada = null;
    if(buscarCategorias) buscarCategorias.value = "";
    if(sugerenciasCategorias){
        sugerenciasCategorias.innerHTML = "";
        sugerenciasCategorias.style.display = "none";
    }

    document.querySelectorAll("#indiceAlfabeticoVocabulario .btn-abc-vocabulario").forEach(boton => {
        boton.classList.toggle("active", boton.textContent.trim().toUpperCase() === letraBuscada);
    });

    const letraInicial = (valor) => {
        const primera = String(valor || "").trim().charAt(0).toUpperCase();
        if(primera === "Ñ") return "Ñ";
        return primera.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    };

    const filtradas = obtenerDatosVocabulario()
        .filter(p => letraInicial(p && p.palabra) === letraBuscada)
        .sort((a, b) => String(a.palabra || "").localeCompare(String(b.palabra || ""), "es", { sensitivity: "base" }));

    let html = botonAtrasCategorias();
    if(filtradas.length === 0){
        html += `<div class="alert alert-light border text-center text-muted small py-3" style="border-radius: 12px;">No hay palabras de Vocabulario con <strong>${escaparHtml(letraBuscada)}</strong>.</div>`;
        resultadoCategorias.innerHTML = html;
        scrollAlPrimerResultado(resultadoCategorias);
        return;
    }

    html += `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Vocabulario con: ${escaparHtml(letraBuscada)}</h6><div class="categoria-resultados-grid">`;
    filtradas.forEach((p, i) => {
        const referencia = escaparCadenaJsAtributo(obtenerIdPalabra(p));
        html += `<button type="button" class="categoria-resultado-item shadow-sm" style="animation-delay: ${Math.min(i, 20) * 0.04}s" onclick="mostrarPalabraVocabularioPorReferencia('${referencia}')">
            ${generarMiniaturaVocabulario(p)}
            <span class="categoria-resultado-titulo">${escaparHtml(p.palabra)}</span>
            <span class="btn btn-sm btn-primary fw-bold categoria-resultado-boton">${ICONO_OJO_SVG} Ver Seña</span>
        </button>`;
    });
    html += `</div>`;
    resultadoCategorias.innerHTML = html;
    scrollAlPrimerResultado(resultadoCategorias);
}
window.filtrarVocabularioPorLetra = filtrarVocabularioPorLetra;

'''
if anchor_cat not in js:
    raise SystemExit("No se encontró mostrarCategoria() para insertar el filtro A-Z de Vocabulario.")
js = js.replace(anchor_cat, filter_vocab + anchor_cat, 1)

# 8) CSS compartido + variante azul Vocabulario.
css_extra = r'''

/* INDICE_VOCABULARIO_V1_20260910
   - A-Z a la izquierda en Diccionario y Vocabulario.
   - Vocabulario usa el azul de su buscador y su propio collapse. */
#bloqueBuscadorCategorias .buscador-indice-linea {
    display: flex;
    align-items: stretch;
    gap: 9px;
    width: 100%;
}

#bloqueBuscadorCategorias .buscador-indice-linea > .input-group {
    flex: 1 1 auto;
    min-width: 0;
}

#filaBotonIndiceAlfabeticoVocabulario.indice-compacto-wrap {
    flex: 0 0 auto;
    display: flex;
    align-items: stretch;
}

.indice-compacto-btn-vocabulario {
    border-color: #0d6efd;
    background: linear-gradient(135deg, #2785ff 0%, #0867ea 100%);
    color: #ffffff;
    box-shadow: 0 6px 16px rgba(13, 110, 253, .22);
}

.indice-compacto-btn-vocabulario:hover,
.indice-compacto-btn-vocabulario:focus-visible {
    color: #ffffff;
    background: linear-gradient(135deg, #1f7cf5 0%, #075fd8 100%);
    box-shadow: 0 8px 20px rgba(13, 110, 253, .30);
}

.indice-compacto-btn-vocabulario .indice-compacto-az {
    background: rgba(255,255,255,.17);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,.28);
}

#filaIndiceAlfabeticoVocabulario.indice-compacto-desplegable {
    width: 100%;
}

#filaIndiceAlfabeticoVocabulario .indice-alfabetico {
    margin-top: 10px;
    padding: 12px;
    border: 1px solid rgba(13, 110, 253, .18);
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 8px 20px rgba(13, 110, 253, .08);
}

#indiceAlfabeticoVocabulario .btn-abc:hover,
#indiceAlfabeticoVocabulario .btn-abc:focus-visible,
#indiceAlfabeticoVocabulario .btn-abc.active {
    background: #0d6efd;
    color: #ffffff;
    box-shadow: 0 4px 10px rgba(13, 110, 253, .28);
}

@media (max-width: 767.98px) {
    #bloqueBuscadorCategorias .buscador-indice-linea {
        gap: 7px;
    }

    #filaIndiceAlfabeticoVocabulario .indice-alfabetico {
        grid-template-columns: repeat(7, 1fr) !important;
        gap: 7px !important;
        padding: 10px;
        margin-top: 8px;
    }
}

@media (max-width: 380px) {
    #btnBuscarCategorias {
        padding-left: .8rem !important;
        padding-right: .8rem !important;
        min-width: 58px !important;
    }
}
'''
css = css.rstrip() + css_extra + "\n"

HTML.write_text(html, encoding="utf-8")
JS.write_text(js, encoding="utf-8")
CSS.write_text(css, encoding="utf-8")
print("Botones A-Z a la izquierda y nuevo índice de Vocabulario aplicados correctamente.")
