from pathlib import Path

SCRIPT = Path("js/script.js")
CSS = Path("css/estilos.css")
SW = Path("sw.js")

js = SCRIPT.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")
sw = SW.read_text(encoding="utf-8")

MARCADOR_JS = "// ============================================================\n// FICHA DE PALABRA — NAVEGACIÓN VISUAL ANTERIOR / SIGUIENTE\n"
MARCADOR_CSS = "/* ============================================================\n   FICHA DE PALABRA — NAVEGACIÓN VISUAL ANTERIOR / SIGUIENTE\n"

if MARCADOR_JS not in js:
    js += r'''

// ============================================================
// FICHA DE PALABRA — NAVEGACIÓN VISUAL ANTERIOR / SIGUIENTE
// ------------------------------------------------------------
// Mejora la ficha sin cambiar la lógica de videos, formularios, favoritos
// ni navegación existente. Cuando una palabra está abierta, agrega una barra
// inferior para explorar la palabra anterior/siguiente dentro de la misma
// fuente (Diccionario o Vocabulario), ordenadas alfabéticamente.
// ============================================================
(function configurarNavegacionVisualFichaPalabra(){
    const ID_NAVEGACION = "navegacionFichaPalabra";
    let rafPendiente = 0;

    function obtenerEstadoFichaActual(){
        const params = new URLSearchParams(window.location.search);
        const referencia = String(params.get("p") || "").trim();
        if(!referencia) return null;

        const esVocabulario = params.get("fuente") === "vocabulario";
        const coleccion = esVocabulario
            ? (typeof obtenerDatosVocabulario === "function" ? obtenerDatosVocabulario() : [])
            : (window.App && Array.isArray(App.datos) ? App.datos : []);

        const palabras = (Array.isArray(coleccion) ? coleccion : [])
            .filter(p => p && p.palabra && String(p.palabra).trim())
            .slice()
            .sort((a, b) => String(a.palabra).localeCompare(String(b.palabra), "es", { sensitivity: "base" }));

        const actual = buscarPalabraPorReferencia(referencia, palabras);
        if(!actual) return null;

        const indice = palabras.findIndex(p => obtenerIdPalabra(p) === obtenerIdPalabra(actual));
        if(indice < 0) return null;

        return { esVocabulario, palabras, actual, indice };
    }

    function obtenerContenedorFicha(actual){
        const candidatos = [
            document.getElementById("resultado"),
            document.getElementById("resultadoCategorias"),
            document.getElementById("resultadoCategoriasDiccionario")
        ].filter(Boolean);

        // Primero buscamos señales inequívocas de que el contenedor tiene
        // una ficha de palabra y no una lista/categoría o un estado vacío.
        const porControles = candidatos.find(c => c.querySelector(
            "#btnCompartir, #reproductorPalabra, .reproductor-palabra-wrap, .apoyo-panel"
        ));
        if(porControles) return porControles;

        // Respaldo para palabras que todavía no tienen video ni imagen.
        const nombre = String(actual && actual.palabra || "").trim().toLowerCase();
        return candidatos.find(c => {
            if(!c.querySelector(".card")) return false;
            return nombre && String(c.textContent || "").toLowerCase().includes(nombre);
        }) || null;
    }

    function abrirDesdeNavegacion(p, esVocabulario){
        if(!p) return;
        if(esVocabulario && typeof mostrarPalabraVocabularioPorReferencia === "function"){
            mostrarPalabraVocabularioPorReferencia(obtenerIdPalabra(p));
        } else if(typeof mostrarPalabra === "function") {
            mostrarPalabra(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    function crearBotonNavegacion(tipo, p, deshabilitado, esVocabulario){
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "ficha-palabra-browse-btn ficha-palabra-browse-btn-" + tipo;
        boton.disabled = !!deshabilitado;

        const esAnterior = tipo === "anterior";
        const etiqueta = esAnterior ? "Anterior" : "Siguiente";
        const flecha = esAnterior ? "←" : "→";
        const nombre = p && p.palabra ? String(p.palabra) : "";

        boton.innerHTML = esAnterior
            ? `<span class="ficha-palabra-browse-flecha" aria-hidden="true">${flecha}</span><span class="ficha-palabra-browse-texto"><small>${etiqueta}</small><strong>${escaparHtml(nombre)}</strong></span>`
            : `<span class="ficha-palabra-browse-texto"><small>${etiqueta}</small><strong>${escaparHtml(nombre)}</strong></span><span class="ficha-palabra-browse-flecha" aria-hidden="true">${flecha}</span>`;

        if(!deshabilitado && p){
            boton.addEventListener("click", () => abrirDesdeNavegacion(p, esVocabulario));
        }
        return boton;
    }

    function refrescarFichaVisual(){
        const estado = obtenerEstadoFichaActual();
        const existente = document.getElementById(ID_NAVEGACION);

        if(!estado){
            if(existente) existente.remove();
            document.querySelectorAll(".ficha-palabra-visual").forEach(el => el.classList.remove("ficha-palabra-visual"));
            return;
        }

        const referenciaActual = obtenerIdPalabra(estado.actual);
        const fuenteActual = estado.esVocabulario ? "vocabulario" : "diccionario";
        if(existente && existente.dataset.referencia === referenciaActual && existente.dataset.fuente === fuenteActual){
            return;
        }

        const contenedor = obtenerContenedorFicha(estado.actual);
        if(!contenedor) return;

        if(existente) existente.remove();
        document.querySelectorAll(".ficha-palabra-visual").forEach(el => el.classList.remove("ficha-palabra-visual"));

        const tarjeta = contenedor.querySelector(".card");
        if(tarjeta) tarjeta.classList.add("ficha-palabra-visual");

        const anterior = estado.indice > 0 ? estado.palabras[estado.indice - 1] : null;
        const siguiente = estado.indice < estado.palabras.length - 1 ? estado.palabras[estado.indice + 1] : null;

        const nav = document.createElement("nav");
        nav.id = ID_NAVEGACION;
        nav.className = "ficha-palabra-browse";
        nav.dataset.referencia = referenciaActual;
        nav.dataset.fuente = fuenteActual;
        nav.setAttribute("aria-label", "Navegar entre palabras");

        const btnAnterior = crearBotonNavegacion("anterior", anterior, !anterior, estado.esVocabulario);
        const btnSiguiente = crearBotonNavegacion("siguiente", siguiente, !siguiente, estado.esVocabulario);

        const centro = document.createElement("div");
        centro.className = "ficha-palabra-browse-centro";
        centro.innerHTML = `<small>${estado.esVocabulario ? "Vocabulario" : "Diccionario"}</small><strong>${estado.indice + 1} / ${estado.palabras.length}</strong>`;

        nav.append(btnAnterior, centro, btnSiguiente);
        contenedor.appendChild(nav);
    }

    function programarRefrescoFichaVisual(){
        cancelAnimationFrame(rafPendiente);
        rafPendiente = requestAnimationFrame(refrescarFichaVisual);
    }

    function iniciarObservadoresFicha(){
        const contenedores = [
            document.getElementById("resultado"),
            document.getElementById("resultadoCategorias"),
            document.getElementById("resultadoCategoriasDiccionario")
        ].filter(Boolean);

        if("MutationObserver" in window){
            const observer = new MutationObserver(programarRefrescoFichaVisual);
            contenedores.forEach(c => observer.observe(c, { childList: true, subtree: true }));
        }

        window.addEventListener("popstate", () => setTimeout(programarRefrescoFichaVisual, 0));
        programarRefrescoFichaVisual();
    }

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded", iniciarObservadoresFicha, { once: true });
    } else {
        iniciarObservadoresFicha();
    }
})();
'''

if MARCADOR_CSS not in css:
    css += r'''

/* ============================================================
   FICHA DE PALABRA — NAVEGACIÓN VISUAL ANTERIOR / SIGUIENTE
   ------------------------------------------------------------
   Pulido visual específico de una ficha abierta. La clase se agrega
   dinámicamente desde script.js, por lo que no afecta tarjetas de
   categorías, estados sin resultados ni otros módulos de LSPedia.
   ============================================================ */
.ficha-palabra-visual {
    border: 1px solid rgba(15, 23, 42, 0.07) !important;
    border-radius: 20px !important;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 14px 38px rgba(15, 23, 42, 0.09) !important;
}

.ficha-palabra-visual .card-body {
    padding: clamp(18px, 3vw, 30px) !important;
}

.ficha-palabra-visual h2,
.ficha-palabra-visual h3,
.ficha-palabra-visual h4 {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    letter-spacing: -0.45px;
}

.ficha-palabra-visual .reproductor-palabra-wrap,
.ficha-palabra-visual .apoyo-visual-caja {
    border-radius: 16px !important;
    overflow: hidden;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
}

.ficha-palabra-visual .apoyo-panel {
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 16px;
    background: #fbfcfe;
    padding: 14px;
}

.ficha-palabra-browse {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: stretch;
    gap: 10px;
    margin: 14px 0 28px;
    padding: 9px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(15, 23, 42, 0.09);
    border-radius: 16px;
    box-shadow: 0 7px 22px rgba(15, 23, 42, 0.06);
}

.ficha-palabra-browse-btn {
    min-width: 0;
    min-height: 56px;
    border: 0;
    border-radius: 12px;
    background: #f3f6fa;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 12px;
    text-align: left;
    transition: transform 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;
}

.ficha-palabra-browse-btn-siguiente {
    justify-content: flex-end;
    text-align: right;
}

.ficha-palabra-browse-btn:not(:disabled):hover,
.ficha-palabra-browse-btn:not(:disabled):focus-visible {
    background: #e8f3fb;
    box-shadow: 0 5px 14px rgba(2, 132, 199, 0.12);
    transform: translateY(-1px);
    outline: none;
}

.ficha-palabra-browse-btn:not(:disabled):active {
    transform: translateY(0);
}

.ficha-palabra-browse-btn:disabled {
    opacity: 0.34;
    cursor: default;
}

.ficha-palabra-browse-flecha {
    flex: 0 0 auto;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-color);
    color: #fff;
    font-size: 18px;
    line-height: 1;
}

.ficha-palabra-browse-texto {
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.ficha-palabra-browse-texto small,
.ficha-palabra-browse-centro small {
    color: var(--text-muted);
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.15;
}

.ficha-palabra-browse-texto strong {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.88rem;
    line-height: 1.25;
}

.ficha-palabra-browse-centro {
    min-width: 74px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    text-align: center;
}

.ficha-palabra-browse-centro strong {
    margin-top: 2px;
    color: var(--primary-color);
    font-size: 0.8rem;
    white-space: nowrap;
}

@media (max-width: 575.98px) {
    .ficha-palabra-visual {
        border-radius: 16px !important;
    }

    .ficha-palabra-visual .card-body {
        padding: 16px 13px !important;
    }

    .ficha-palabra-browse {
        grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr);
        gap: 6px;
        padding: 6px;
        margin-top: 10px;
        border-radius: 14px;
    }

    .ficha-palabra-browse-btn {
        min-height: 52px;
        padding: 7px 8px;
        gap: 6px;
    }

    .ficha-palabra-browse-flecha {
        width: 27px;
        height: 27px;
        font-size: 16px;
    }

    .ficha-palabra-browse-texto small {
        font-size: 0.61rem;
    }

    .ficha-palabra-browse-texto strong {
        font-size: 0.76rem;
    }

    .ficha-palabra-browse-centro {
        min-width: 0;
        padding: 0;
    }

    .ficha-palabra-browse-centro small {
        display: none;
    }

    .ficha-palabra-browse-centro strong {
        font-size: 0.7rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .ficha-palabra-browse-btn {
        transition: none;
    }
}
'''

if 'const VERSION_APP = "v57";' not in sw:
    raise SystemExit("sw.js no está en v57; revisar antes de aplicar esta mejora")
sw = sw.replace('const VERSION_APP = "v57";', 'const VERSION_APP = "v58";', 1)

SCRIPT.write_text(js, encoding="utf-8")
CSS.write_text(css, encoding="utf-8")
SW.write_text(sw, encoding="utf-8")

print("OK: ficha visual + navegación anterior/siguiente + cache v58")
