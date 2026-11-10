/* ============================================================
   LSPedia - Ficha de Palabra y Mejoras de Interacción UI
   Módulo modularizado para navegación anterior/siguiente,
   anti-imágenes rotas, scroll nav y gestos móviles.
   ============================================================ */

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


/* ============================================================
   SISTEMA GLOBAL ANTI-IMÁGENES ROTAS
   ------------------------------------------------------------
   Si cualquier <img> falla, incluso uno creado dinámicamente por
   Diccionario, Vocabulario, Quiz o Juegos, se sustituye por un
   respaldo visual local y se registra la ruta técnica en Analytics.
   ============================================================ */
(function activarRespaldoGlobalImagenesLSPedia(){
    "use strict";
    const FALLBACK = "img/imagen-no-disponible.svg";

    function aplicarFallback(img){
        if(!img || img.tagName !== "IMG" || img.dataset.lspediaImagenFallback === "1") return;
        const original = img.currentSrc || img.getAttribute("src") || "";
        if(!original || original.indexOf("imagen-no-disponible.svg") !== -1) return;
        img.dataset.lspediaImagenFallback = "1";
        img.dataset.lspediaSrcOriginal = original;
        img.classList.add("lspedia-imagen-fallback");
        img.src = FALLBACK;
        try {
            if(typeof window.gtag === "function"){
                const ruta = new URL(original, window.location.href).pathname.slice(0, 180);
                window.gtag("event", "image_load_error", { image_path: ruta });
            }
        } catch (_) { /* el respaldo no depende de Analytics */ }
    }

    document.addEventListener("error", function(evento){
        const destino = evento.target;
        if(destino && destino.tagName === "IMG") aplicarFallback(destino);
    }, true);

    window.LSPediaImagenes = Object.freeze({ aplicarFallback });
})();



/* ============================================================
   ACTUALIZACIÓN PWA SIN CACHÉ HTTP — 20260910
   ------------------------------------------------------------
   Fuerza la comprobación de sw.js contra la red real al abrir LSPedia y
   al volver a una pestaña que estuvo un rato en segundo plano.

   IMPORTANTE: NO recarga la página automáticamente. Una actualización
   nunca debe interrumpir un video, un formulario o una actividad del juego.
   La nueva versión queda activa gracias a skipWaiting()/clients.claim() y
   será usada en la siguiente navegación/recarga normal.
   ============================================================ */
(function asegurarActualizacionPwaLSPedia(){
    "use strict";
    if (!("serviceWorker" in navigator)) return;

    const INTERVALO_REVISION_MS = 5 * 60 * 1000;
    let ultimaRevision = 0;

    async function revisarActualizacionPwa(forzar = false){
        const ahora = Date.now();
        if (!forzar && ahora - ultimaRevision < INTERVALO_REVISION_MS) return;
        ultimaRevision = ahora;

        try {
            // updateViaCache:"none" evita que el propio script del Service
            // Worker (y sus imports futuros) se resuelva desde la caché HTTP.
            const registro = await navigator.serviceWorker.register("sw.js", {
                updateViaCache: "none"
            });

            if (registro && typeof registro.update === "function") {
                await registro.update();
            }
        } catch (error) {
            // Sin conexión no es un error crítico: el Service Worker conserva
            // el cascarón offline y se comprobará otra vez más adelante.
            console.info("LSPedia: actualización PWA pendiente de conexión.", error);
        }
    }

    if (document.readyState === "complete") {
        setTimeout(() => revisarActualizacionPwa(true), 0);
    } else {
        window.addEventListener("load", () => revisarActualizacionPwa(true), { once: true });
    }

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            revisarActualizacionPwa(false);
        }
    });
})();


// VOCABULARIO_AZ_FUNCIONAL_V2_20260911
// El índice A-Z de Vocabulario no depende de onclick inline: usa un listener
// delegado propio, igual de fiable en escritorio, móvil y PWA.
(function configurarIndiceVocabularioRobusto(){
    function iniciar(){
        const indice = document.getElementById('indiceAlfabeticoVocabulario');
        if(!indice || indice.dataset.lspAzFuncional === '1') return;
        indice.dataset.lspAzFuncional = '1';

        // Evita doble ejecución si quedaron handlers inline del HTML.
        indice.querySelectorAll('.btn-abc-vocabulario').forEach((boton) => {
            boton.removeAttribute('onclick');
        });

        indice.addEventListener('click', (evento) => {
            const objetivo = evento.target instanceof Element ? evento.target.closest('.btn-abc-vocabulario') : null;
            if(!objetivo || !indice.contains(objetivo)) return;
            evento.preventDefault();

            const letra = String(objetivo.textContent || '').trim().toUpperCase();
            if(!letra || typeof window.filtrarVocabularioPorLetra !== 'function') return;

            // Mantiene visible el bloque correcto antes de pintar resultados.
            if(bloqueBuscadorCategorias) bloqueBuscadorCategorias.classList.remove('d-none');
            window.filtrarVocabularioPorLetra(letra);

            // Si el navegador conserva el foco del botón, lo quitamos para que
            // el scroll y la lectura visual del resultado se comporten como en Diccionario.
            if(typeof objetivo.blur === 'function') objetivo.blur();
        });
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();



// LSP_NAV_SCROLL_UI_20260922_V2
(() => {
    const navInferior = document.getElementById("mobileBottomNav");
    if (!navInferior) return;

    let ultimoScrollY = window.scrollY || window.pageYOffset || 0;
    let rafScroll = 0;
    let noOcultarHasta = 0;

    function mostrarNavInferior() {
        navInferior.classList.remove("lsp-nav-oculta-scroll");
    }

    function actualizarNavPorScroll() {
        rafScroll = 0;
        const y = Math.max(0, window.scrollY || window.pageYOffset || 0);
        const ahora = performance.now();
        const delta = y - ultimoScrollY;

        // Al pulsar un botón inferior, la navegación puede hacer scroll
        // programático hacia la sección. Ese movimiento NO debe ocultar
        // la barra: el usuario la acaba de tocar.
        if (ahora < noOcultarHasta) {
            mostrarNavInferior();
            ultimoScrollY = y;
            return;
        }

        if (Math.abs(delta) < 6) return;

        // Comportamiento tipo app:
        // - scroll hacia abajo => barra se oculta
        // - scroll hacia arriba => barra reaparece
        // - cerca del inicio => siempre visible
        if (delta > 0 && y > 80) {
            navInferior.classList.add("lsp-nav-oculta-scroll");
        } else if (delta < 0) {
            mostrarNavInferior();
        } else if (y <= 80) {
            mostrarNavInferior();
        }

        ultimoScrollY = y;
    }

    document.addEventListener("click", (evento) => {
        const boton = evento.target.closest(".mobile-bottom-nav .mbn-item");
        if (!boton) return;

        // Deja visible la barra durante el cambio de sección y su scroll
        // suave asociado.
        noOcultarHasta = performance.now() + 1400;
        mostrarNavInferior();
    }, true);

    window.addEventListener("scroll", () => {
        if (rafScroll) return;
        rafScroll = requestAnimationFrame(actualizarNavPorScroll);
    }, { passive: true });

    window.addEventListener("resize", () => {
        mostrarNavInferior();
        ultimoScrollY = window.scrollY || window.pageYOffset || 0;
    }, { passive: true });

    mostrarNavInferior();
})();


// LSP_BUSQUEDA_MOVIL_TOUCH_FIX_20260923_V3
(function activarToqueDirectoResultadosBusqueda(){
    // Importante: tocar una sugerencia no debe seleccionar nada mientras la
    // persona está desplazándose por la lista. Dejamos que el navegador
    // genere el click únicamente al finalizar un toque sin desplazamiento.
    function instalar(contenedor, fuente){
        if(!contenedor || contenedor.dataset.lspTouchFix === "3") return;
        contenedor.dataset.lspTouchFix = "3";

        let inicioX = 0;
        let inicioY = 0;
        let botonInicial = null;
        let huboDesplazamiento = false;

        contenedor.addEventListener("touchstart", (evento) => {
            if(document.getElementById("lspMobileSearchOverlay")) return;

            const toque = evento.touches && evento.touches[0];
            if(!toque) return;

            botonInicial = evento.target && evento.target.closest
                ? evento.target.closest("button.list-group-item-action[data-lsp-ref]")
                : null;

            if(!botonInicial || !contenedor.contains(botonInicial)){
                botonInicial = null;
                return;
            }

            inicioX = toque.clientX;
            inicioY = toque.clientY;
            huboDesplazamiento = false;
        }, { passive: true });

        contenedor.addEventListener("touchmove", (evento) => {
            if(!botonInicial) return;

            const toque = evento.touches && evento.touches[0];
            if(!toque) return;

            const dx = toque.clientX - inicioX;
            const dy = toque.clientY - inicioY;

            // Un desplazamiento pequeño puede ser el movimiento natural del
            // dedo; a partir de 10 px consideramos que la persona está
            // recorriendo la lista y NO debe seleccionarse el elemento.
            if(Math.hypot(dx, dy) > 10){
                huboDesplazamiento = true;
            }
        }, { passive: true });

        contenedor.addEventListener("touchend", () => {
            // No hacemos preventDefault ni abrimos la ficha aquí.
            // Si fue un toque sin desplazamiento, el click nativo del
            // navegador ejecutará el onclick existente del botón.
            botonInicial = null;
        }, { passive: true });

        contenedor.addEventListener("touchcancel", () => {
            botonInicial = null;
            huboDesplazamiento = false;
        }, { passive: true });
    }

    instalar(document.getElementById("sugerencias"), "diccionario");
    instalar(document.getElementById("sugerenciasCategorias"), "vocabulario");
})();


// LSPEDIA_INSTALACION_UNA_VEZ_POR_SESION_20260924
(function limitarAvisoInstalacionPorSesion(){
    const CLAVE = "lspedia_instalar_mostrado_sesion";
    const TEXTO = "instalar lspedia";

    function yaSeMostro(){
        try { return sessionStorage.getItem(CLAVE) === "1"; }
        catch(error){ return false; }
    }

    function marcarComoMostrado(){
        try { sessionStorage.setItem(CLAVE, "1"); }
        catch(error) { /* Si sessionStorage no está disponible, no bloqueamos la web. */ }
    }

    function esBotonInstalar(elemento){
        if(!elemento || elemento.nodeType !== 1) return false;
        const texto = String(elemento.textContent || "").replace(/\\s+/g, " ").trim().toLowerCase();
        return texto.includes(TEXTO) && /^(button|a)$/i.test(elemento.tagName);
    }

    function revisar(root){
        if(!root || root.nodeType !== 1) return;
        const elementos = [];
        if(esBotonInstalar(root)) elementos.push(root);
        if(root.querySelectorAll){
            root.querySelectorAll("button, a").forEach(el => {
                if(esBotonInstalar(el)) elementos.push(el);
            });
        }

        elementos.forEach(el => {
            if(yaSeMostro()){
                el.style.display = "none";
                el.setAttribute("aria-hidden", "true");
            } else {
                // La primera vez que aparece durante esta sesión sí se permite.
                marcarComoMostrado();
            }
        });
    }

    function iniciar(){
        revisar(document.body);
        const observador = new MutationObserver(mutations => {
            mutations.forEach(m => m.addedNodes.forEach(n => {
                if(n.nodeType === 1) revisar(n);
            }));
        });
        observador.observe(document.body, { childList: true, subtree: true });
    }

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();