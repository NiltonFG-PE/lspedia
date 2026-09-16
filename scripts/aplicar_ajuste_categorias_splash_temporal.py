from pathlib import Path
import re

# 1) Restaurar el splash visual anterior sin perder la optimizacion de red.
index = Path('index.html')
html = index.read_text(encoding='utf-8')

bloque_forzado = '''
    <!-- El splash debe mostrar la marca desde el primer fotograma, incluso con Internet lento. -->
    <style id="splash-visible-inmediato">
        #splashLogo {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            will-change: auto !important;
        }
    </style>
'''
html = html.replace(bloque_forzado, '\n', 1)

actual = '<img src="img/favicon.png" alt="" width="82" height="82" fetchpriority="high" loading="eager" decoding="sync">'
original = '<img src="img/favicon.png" alt="" width="82" height="82" fetchpriority="high" decoding="async">'
if actual in html:
    html = html.replace(actual, original, 1)
elif original not in html:
    raise SystemExit('No se encontro la imagen principal esperada del splash')

preload = '<link rel="preload" href="img/favicon.png" as="image" fetchpriority="high">'
if preload not in html:
    favicon = '<link rel="icon" type="image/png" href="img/favicon.png">'
    if favicon not in html:
        raise SystemExit('No se encontro favicon para mantener el preload')
    html = html.replace(favicon, preload + '\n    ' + favicon, 1)
index.write_text(html, encoding='utf-8')

# 2) Compartir categorias.
script = Path('js/script.js')
js = script.read_text(encoding='utf-8')
marcador = '// --- COMPARTIR CATEGORÍAS ---'
if marcador not in js:
    ancla = '// Mensaje flotante breve (estilo "toast") que confirma que el enlace se\n'
    if ancla not in js:
        raise SystemExit('No se encontro el punto de insercion para compartir categorias')
    helper = '''// --- COMPARTIR CATEGORÍAS ---
// Las categorías tienen URL propia. En móviles usa el panel nativo y,
// cuando no está disponible, copia el enlace para compartirlo.
function copiarEnlaceCategoriaLSPedia(url){
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => mostrarAvisoCompartir("🔗 Enlace de categoría copiado"))
            .catch(() => window.prompt("Copia este enlace para compartir:", url));
        return;
    }
    window.prompt("Copia este enlace para compartir:", url);
}

function compartirCategoriaLSPedia(nombre, fuente){
    const categoria = String(nombre || "").trim();
    if(!categoria) return;

    const esVocabulario = fuente === "vocabulario";
    const params = new URLSearchParams();
    if(esVocabulario){
        params.set("vista", "vocabulario");
        params.set("categoria", categoria);
    } else {
        params.set("categoriaDiccionario", categoria);
    }

    const url = window.location.origin + window.location.pathname + "?" + params.toString();
    const titulo = categoria + " | LSPedia";
    const texto = esVocabulario
        ? `Explora la categoría "${categoria}" en el Vocabulario de LSPedia.`
        : `Explora la categoría "${categoria}" en el Diccionario de LSPedia.`;

    if (navigator.share) {
        navigator.share({ title: titulo, text: texto, url })
            .catch(error => {
                if(error && error.name === "AbortError") return;
                copiarEnlaceCategoriaLSPedia(url);
            });
        return;
    }
    copiarEnlaceCategoriaLSPedia(url);
}

function agregarBotonCompartirCategoria(tarjeta, nombre, fuente){
    if(!tarjeta || tarjeta.querySelector(".btn-compartir-categoria")) return;
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn-compartir-categoria";
    boton.setAttribute("aria-label", `Compartir categoría ${nombre}`);
    boton.setAttribute("title", "Compartir categoría");
    boton.innerHTML = '<span aria-hidden="true">↗</span>';
    boton.addEventListener("click", evento => {
        evento.preventDefault();
        evento.stopPropagation();
        compartirCategoriaLSPedia(nombre, fuente);
    });
    tarjeta.appendChild(boton);
}

'''
    js = js.replace(ancla, helper + ancla, 1)

vocab_line = '        card.onclick = () => mostrarCategoria(nombre);\n'
vocab_insert = '        agregarBotonCompartirCategoria(card.querySelector(".categoria-card"), nombre, "vocabulario");\n' + vocab_line
if vocab_insert not in js:
    if js.count(vocab_line) != 1:
        raise SystemExit(f'Se esperaba una tarjeta de Vocabulario; encontradas: {js.count(vocab_line)}')
    js = js.replace(vocab_line, vocab_insert, 1)

dic_line = '        card.querySelector(".categoria-dicc-card").onclick = () => filtrarPorCategoriaDiccionario(nombre);\n'
dic_insert = '        agregarBotonCompartirCategoria(card.querySelector(".categoria-dicc-card"), nombre, "diccionario");\n' + dic_line
if dic_insert not in js:
    if js.count(dic_line) != 1:
        raise SystemExit(f'Se esperaba una tarjeta de Diccionario; encontradas: {js.count(dic_line)}')
    js = js.replace(dic_line, dic_insert, 1)
script.write_text(js, encoding='utf-8')

# 3) Estilo del boton.
css_path = Path('css/estilos.css')
css = css_path.read_text(encoding='utf-8')
css_marker = '/* --- Compartir categorías LSPedia --- */'
if css_marker not in css:
    css += '''

/* --- Compartir categorías LSPedia --- */
.categoria-card,
.categoria-dicc-card {
    position: relative;
}

.btn-compartir-categoria {
    position: absolute;
    top: 9px;
    right: 9px;
    z-index: 4;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.90);
    color: #0f172a;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1;
    box-shadow: 0 2px 7px rgba(15, 23, 42, 0.12);
    cursor: pointer;
    transition: transform .16s ease, box-shadow .16s ease, background-color .16s ease;
}

.btn-compartir-categoria:hover {
    transform: translateY(-1px) scale(1.04);
    background: #fff;
    box-shadow: 0 4px 11px rgba(15, 23, 42, 0.18);
}

.btn-compartir-categoria:focus-visible {
    outline: 3px solid rgba(13, 110, 253, .35);
    outline-offset: 2px;
}

@media (max-width: 575.98px) {
    .btn-compartir-categoria {
        top: 7px;
        right: 7px;
        width: 30px;
        height: 30px;
        font-size: .95rem;
    }
}
'''
css_path.write_text(css, encoding='utf-8')

# 4) Renovar cache de la PWA.
sw_path = Path('sw.js')
sw = sw_path.read_text(encoding='utf-8')
nuevo, n = re.subn(r'const VERSION_APP = "v\d+";', 'const VERSION_APP = "v136";', sw, count=1)
if n != 1:
    raise SystemExit('No se pudo actualizar VERSION_APP en sw.js')
sw_path.write_text(nuevo, encoding='utf-8')
