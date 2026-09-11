from pathlib import Path
import re

INDEX = Path("index.html")
SCRIPT = Path("js/script.js")
CSS = Path("css/mejoras-producto.css")

index = INDEX.read_text(encoding="utf-8")
script = SCRIPT.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")

# -----------------------------------------------------------------------------
# 1) INDEX: el índice deja de ser una tarjeta grande separada y pasa a vivir
#    junto al buscador principal. Se conservan los mismos IDs que usa script.js
#    para no romper la navegación Inicio/Vocabulario.
# -----------------------------------------------------------------------------
search_start = '                <div class="position-relative" id="bloqueBuscador">'
search_end = '                <div class="ejemplos-busqueda justify-content-center justify-content-lg-start" id="bloqueEjemplos">'

if search_start not in index or search_end not in index:
    raise SystemExit("No se encontró el bloque actual del buscador del Diccionario")

start = index.index(search_start)
end = index.index(search_end, start)

letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "Ñ", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
letter_buttons = "\n".join(
    f'                                <button class="btn btn-abc" onclick="filtrarPorLetra(\'{letter}\')">{letter}</button>'
    for letter in letters
)

new_search = f'''                <div class="position-relative" id="bloqueBuscador">
                    <div class="buscador-indice-linea">
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
                    </div>
                    <div id="sugerencias" class="list-group mt-2 shadow-sm position-absolute w-100 z-3" style="border-radius: 15px; overflow: hidden;"></div>

                    <div id="filaIndiceAlfabetico" class="indice-compacto-desplegable">
                        <div class="collapse" id="indiceAlfabetico">
                            <div class="indice-alfabetico">
{letter_buttons}
                            </div>
                        </div>
                    </div>
                </div>

'''
index = index[:start] + new_search + index[end:]

old_index_start = '        <div class="row justify-content-center mb-4 mt-4" id="filaBotonIndiceAlfabetico">'
old_index_end = '        <!-- Resultados de búsqueda del Diccionario:'
if old_index_start not in index or old_index_end not in index:
    raise SystemExit("No se encontró la tarjeta antigua del índice alfabético")
old_start = index.index(old_index_start)
old_end = index.index(old_index_end, old_start)
index = index[:old_start] + index[old_end:]

# -----------------------------------------------------------------------------
# 2) JS: el índice compacto arranca cerrado en cualquier tamaño. Inicio lo
#    muestra y lo deja cerrado; Vocabulario/Temas lo cierra y lo oculta.
#    Se conserva el nombre desplegarIndiceAlfabetico() porque ya existen
#    llamadas antiguas, pero ahora solo asegura que el control sea visible.
# -----------------------------------------------------------------------------
old_functions = '''// Solo en la versión de escritorio (ver detección en index.html) el
// índice alfabético debe aparecer desplegado por defecto en el Inicio,
// y colapsado (no desplegado) al entrar a "Temas orden". En móvil no
// cambia nada: sigue arrancando colapsado como antes.
function esModoEscritorioForzado(){
    return document.documentElement.classList.contains("modo-escritorio-forzado");
}

function desplegarIndiceAlfabetico(){
    if (!esModoEscritorioForzado()) return;
    const indice = document.getElementById("indiceAlfabetico");
    const btn = document.getElementById("btnToggleAbc");
    if (indice && btn && !indice.classList.contains("show")) btn.click();
}

function colapsarIndiceAlfabetico(){
    if (!esModoEscritorioForzado()) return;
    const indice = document.getElementById("indiceAlfabetico");
    const btn = document.getElementById("btnToggleAbc");
    if (indice && btn && indice.classList.contains("show")) btn.click();
}
'''

new_functions = '''// ÍNDICE ALFABÉTICO COMPACTO
// El control A-Z vive al lado del buscador y arranca cerrado tanto en móvil
// como en escritorio. Al entrar a Vocabulario/Temas se cierra y se oculta;
// al volver a Inicio se muestra de nuevo, sin duplicar navegación.
function actualizarEstadoIndiceAlfabetico(){
    const indice = document.getElementById("indiceAlfabetico");
    const btn = document.getElementById("btnToggleAbc");
    if(!indice || !btn) return;

    const abierto = indice.classList.contains("show") || btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-label", abierto ? "Cerrar índice alfabético A a Z" : "Abrir índice alfabético A a Z");
    btn.setAttribute("title", abierto ? "Cerrar índice alfabético" : "Abrir índice alfabético");
}

function desplegarIndiceAlfabetico(){
    const filaBoton = document.getElementById("filaBotonIndiceAlfabetico");
    const filaIndice = document.getElementById("filaIndiceAlfabetico");
    if(filaBoton) filaBoton.style.display = "";
    if(filaIndice) filaIndice.style.display = "";
    actualizarEstadoIndiceAlfabetico();
}

function colapsarIndiceAlfabetico(){
    const indice = document.getElementById("indiceAlfabetico");
    const btn = document.getElementById("btnToggleAbc");
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
    actualizarEstadoIndiceAlfabetico();
}

const indiceAlfabeticoCompacto = document.getElementById("indiceAlfabetico");
if(indiceAlfabeticoCompacto){
    indiceAlfabeticoCompacto.addEventListener("shown.bs.collapse", actualizarEstadoIndiceAlfabetico);
    indiceAlfabeticoCompacto.addEventListener("hidden.bs.collapse", actualizarEstadoIndiceAlfabetico);
}
'''

if old_functions not in script:
    raise SystemExit("No se encontró el bloque JS antiguo del índice alfabético")
script = script.replace(old_functions, new_functions, 1)

old_home = '''    actualizarVistaUrl(null);
    desplegarIndiceAlfabetico();
    if (sugerencias) sugerencias.innerHTML = "";'''
new_home = '''    actualizarVistaUrl(null);
    // Inicio siempre vuelve al control A-Z compacto en estado cerrado.
    colapsarIndiceAlfabetico();
    desplegarIndiceAlfabetico();
    if (sugerencias) sugerencias.innerHTML = "";'''
if old_home not in script:
    raise SystemExit("No se encontró la llamada del índice dentro de irAlBuscador")
script = script.replace(old_home, new_home, 1)

script = script.replace(
    '''    // Vista "Temas" en móvil: solo deben quedar visibles el buscador, el
    // índice A-Z, las categorías, Favoritos e Historial. La clase la lee''',
    '''    // Vista "Vocabulario/Temas": usa su propio buscador y categorías.
    // El índice A-Z pertenece solo al Diccionario y se oculta por completo.
    // La clase también controla el layout móvil de esta vista.''',
    1,
)

script = script.replace(
    '''    // El botón "A-Z | Índice alfabético" no debe verse dentro de "Temas
    // orden" (ahí ya se navega por las tarjetas de categoría y por el
    // buscador azul de abajo): se oculta por completo, en escritorio y
    // en móvil por igual. mostrarBloqueInicio() lo vuelve a mostrar al
    // salir hacia "Buscar" (ver irAlBuscador()).''',
    '''    // El botón A-Z compacto y sus letras no deben verse dentro de
    // Vocabulario/Temas. Se ocultan en cualquier tamaño; Inicio los vuelve a
    // mostrar y el índice queda cerrado para no duplicar navegación.''',
    1,
)

script = script.replace(
    '''    // #btnToggleAbc alterna su texto ("Mostrar todas" / "Ocultar") solo
    // con CSS, en base al atributo aria-expanded que Bootstrap actualiza
    // por su cuenta al abrir/cerrar el collapse (ver estilos.css).
    // En escritorio el índice alfabético arranca desplegado (en móvil
    // sigue arrancando colapsado, como antes).
    desplegarIndiceAlfabetico();''',
    '''    // El botón A-Z compacto se muestra en Diccionario, pero las letras
    // arrancan cerradas en cualquier tamaño para ahorrar espacio.
    colapsarIndiceAlfabetico();
    desplegarIndiceAlfabetico();''',
    1,
)

# -----------------------------------------------------------------------------
# 3) CSS: apariencia compacta y táctil. El botón queda realmente junto al
#    buscador; las letras se despliegan debajo ocupando el ancho disponible.
# -----------------------------------------------------------------------------
marker = "/* INDICE_ALFABETICO_COMPACTO_V1_20260910 */"
if marker not in css:
    css += f'''\n\n{marker}
#bloqueBuscador .buscador-indice-linea {{
    display: flex;
    align-items: stretch;
    gap: 9px;
    width: 100%;
}}

#bloqueBuscador .buscador-indice-linea > .input-group {{
    flex: 1 1 auto;
    min-width: 0;
}}

#filaBotonIndiceAlfabetico.indice-compacto-wrap {{
    flex: 0 0 auto;
    display: flex;
    align-items: stretch;
}}

.indice-compacto-btn {{
    min-height: 50px;
    padding: 0 13px;
    border: 2px solid #f1b514;
    border-radius: 999px;
    background: linear-gradient(180deg, #fffdf5 0%, #fff5c8 100%);
    color: #0f172a;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-weight: 800;
    box-shadow: 0 5px 14px rgba(180, 127, 8, 0.13);
    transition: transform .16s ease, box-shadow .16s ease, background-color .16s ease;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    white-space: nowrap;
}}

.indice-compacto-btn:hover,
.indice-compacto-btn:focus-visible {{
    color: #0f172a;
    background: #ffefaa;
    box-shadow: 0 7px 18px rgba(180, 127, 8, 0.20);
    outline: none;
}}

.indice-compacto-btn:active {{
    transform: scale(.97);
}}

.indice-compacto-az {{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 35px;
    height: 27px;
    padding: 0 7px;
    border-radius: 8px;
    background: #ffc107;
    color: #172033;
    font-size: .78rem;
    letter-spacing: .02em;
}}

.indice-compacto-texto {{
    font-size: .88rem;
}}

.indice-compacto-flecha {{
    display: inline-block;
    font-size: 1rem;
    line-height: 1;
    transition: transform .2s ease;
}}

.indice-compacto-btn[aria-expanded="true"] .indice-compacto-flecha {{
    transform: rotate(180deg);
}}

#filaIndiceAlfabetico.indice-compacto-desplegable {{
    width: 100%;
}}

#filaIndiceAlfabetico .indice-alfabetico {{
    margin-top: 10px;
    padding: 12px;
    border: 1px solid rgba(148, 163, 184, .25);
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 8px 20px rgba(15, 23, 42, .07);
}}

@media (max-width: 767.98px) {{
    #bloqueBuscador .buscador-indice-linea {{
        gap: 7px;
    }}

    .indice-compacto-btn {{
        min-width: 58px;
        min-height: 52px;
        padding: 0 8px;
        gap: 5px;
    }}

    .indice-compacto-az {{
        min-width: 33px;
        height: 26px;
        padding: 0 6px;
        font-size: .74rem;
    }}

    #filaIndiceAlfabetico .indice-alfabetico {{
        grid-template-columns: repeat(7, 1fr) !important;
        gap: 7px !important;
        padding: 10px;
        margin-top: 8px;
    }}
}}

@media (max-width: 380px) {{
    .indice-compacto-btn {{
        min-width: 54px;
        padding: 0 6px;
    }}

    #btnBuscar {{
        padding-left: .8rem !important;
        padding-right: .8rem !important;
    }}
}}

@media (prefers-reduced-motion: reduce) {{
    .indice-compacto-btn,
    .indice-compacto-flecha {{
        transition: none !important;
    }}
}}
'''

INDEX.write_text(index, encoding="utf-8")
SCRIPT.write_text(script, encoding="utf-8")
CSS.write_text(css, encoding="utf-8")

# Verificaciones estructurales de la migración.
assert index.count('id="btnToggleAbc"') == 1
assert index.count('id="filaBotonIndiceAlfabetico"') == 1
assert index.count('id="filaIndiceAlfabetico"') == 1
assert index.count('id="indiceAlfabetico"') == 1
assert 'indice-alfabetico-card' not in index[index.index('id="bloqueBuscador"'): index.index('id="bloqueEjemplos"')]
assert 'buscador-indice-linea' in index
assert 'INDICE_ALFABETICO_COMPACTO_V1_20260910' in css
assert 'function actualizarEstadoIndiceAlfabetico()' in script
print("Índice alfabético compacto aplicado correctamente.")
