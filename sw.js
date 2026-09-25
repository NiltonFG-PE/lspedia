/* ============================================================
   LSPedia - Service Worker
   ------------------------------------------------------------
   Objetivos:
   - Mantener la PWA instalable y rápida.
   - Abrir el cascarón desde caché inmediatamente en visitas repetidas.
   - Actualizar recursos en segundo plano sin bloquear al usuario.
   - Reintentar una vez las lecturas de red del cascarón ante fallos breves.
   - No precargar módulos pesados que ahora se cargan bajo demanda.
   - Mantener palabras.json y busqueda-ayudas.json fuera del SW; otras
     fuentes pueden formar parte del cascarón según su estrategia de carga.
   - El panel /admin/ y los laboratorios quedan fuera del fallback público.
   ============================================================ */

const VERSION_APP = "v199";
const PREFIJO_CACHE = "lspedia-shell-";
const PREFIJO_RUNTIME = "lspedia-runtime-";
const CACHE_NOMBRE = PREFIJO_CACHE + VERSION_APP;
const CACHE_RUNTIME = PREFIJO_RUNTIME + VERSION_APP;
const RED_TIMEOUT_MS = 8000;
const RED_REINTENTOS = 1;

const EXTENSION_ARCHIVO_ESTATICO = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|css|html?|js|mjs|json|map|webmanifest|woff2?|ttf|otf|mp3|wav|ogg|mp4|webm|pdf|txt|xml)$/i;

const ARCHIVOS_CASCARON = [
    "./",
    "./index.html",
    "img/favicon.png",
    "css/estilos.css",
    "css/estilos-base.css",
    "css/quiz.css",
    "css/mejoras-producto.css",
    "css/lo-nuevo-premium.css",
    "css/aprendizaje-unificado.css",
    "css/aprendizaje-colapsable.css",
    "css/accesibilidad-segura.css",
    "css/vocabulario-layout.css",
    "css/fab-dock-delgado.css",
    "css/modo-oscuro.css",
    "css/modo-oscuro-ajustes.css",
    "css/modo-oscuro-herramientas.css",
    "css/buscador-dropdown-premium.css",
    "js/security.js",
    "js/lspedia-core.js",
    "js/lspedia-media.js",
    "js/accesibilidad-segura.js",
    "js/seo-institucional.js",
    "js/vocabulario-publico.js",
    "js/juegos-banco-compartido.js",
    "js/lazy-modules.js",
    "js/fullscreen-mobile-fix.js",
    "js/pwa-install.js",
    "js/script.js",
    "js/busqueda-core.js",
    "js/quiz.js",
    "js/mejoras-producto.js",
    "js/experiencia-vocabulario.js",
    "js/aprendizaje-colapsable.js",
    "js/categorias-compartir.js",
    "js/mejoras-producto-base.js",
    "js/modo-oscuro.js",
    "js/modo-oscuro-herramientas.js",
    "js/youtube-diagnostico.js",
    "js/buscador-vocabulario-rescate.js",
    "js/buscador-movil-focus.js",
    "js/optimizacion-errores.js",
    "js/rendimiento-movil.js",
    "js/lo-nuevo.js",
    "js/i18n.js",
    "js/i18n-restaurar.js",
    "js/i18n-auto.js",
    "js/buscador-visual.js",
    "js/buscador-predictivo.js",
    "js/a-z-movil.js",
    "data/vocabulario.json",
    "data/vocabulario-definiciones.json",
    "data/nuevas-palabras.json"
];

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

async function fetchConReintento(request, opciones = {}) {
    const timeoutMs = Math.max(1000, Number(opciones.timeoutMs) || RED_TIMEOUT_MS);
    const reintentos = Math.max(0, Math.min(2, Number(opciones.reintentos ?? RED_REINTENTOS)));
    let ultimoError = null;

    for (let intento = 0; intento <= reintentos; intento += 1) {
        const controlador = typeof AbortController !== "undefined" ? new AbortController() : null;
        let temporizador = null;
        try {
            if (controlador) temporizador = setTimeout(() => controlador.abort(), timeoutMs);
            const respuesta = await fetch(request.clone(), controlador ? { signal: controlador.signal } : undefined);
            if (temporizador) clearTimeout(temporizador);
            if (!respuesta || !respuesta.ok) {
                const error = new Error("HTTP " + (respuesta ? respuesta.status : 0));
                error.status = respuesta ? respuesta.status : 0;
                throw error;
            }
            return respuesta;
        } catch (error) {
            if (temporizador) clearTimeout(temporizador);
            ultimoError = error;
            const status = Number(error && error.status) || 0;
            const reintentable = !status || status === 408 || status === 425 || status === 429 || status >= 500;
            if (!reintentable || intento >= reintentos) throw error;
            await esperar(300 * (intento + 1));
        }
    }

    throw ultimoError || new Error("No se pudo completar la solicitud de red.");
}

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NOMBRE).then((cache) => cache.addAll(ARCHIVOS_CASCARON)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (
                    (key.startsWith(PREFIJO_CACHE) && key !== CACHE_NOMBRE) ||
                    (key.startsWith(PREFIJO_RUNTIME) && key !== CACHE_RUNTIME)
                ) return caches.delete(key);
                return Promise.resolve(false);
            })
        )).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return;

    if (url.pathname === "/lab-senas-ia.html" || url.pathname === "/lab-juego-educativo.html") {
        event.respondWith(fetch(request).catch(() => Response.error()));
        return;
    }

    if (url.pathname.includes("/data/palabras.json") || url.pathname.includes("/data/busqueda-ayudas.json")) return;

    // Las páginas SEO reales deben llegar desde su URL exacta. Antes, cualquier
    // navegación devolvía primero index.html desde caché; al abrir por segunda
    // vez /categoria/... eso dejaba el navegador en la URL profunda pero con
    // el HTML de Inicio, y sus rutas relativas de CSS/JS quedaban rotas.
    // Estas rutas se sirven siempre desde red y nunca usan el fallback SPA.
    const esRutaSeoEstatica = /^\/(?:categoria|coleccion|diccionario|vocabulario)\//.test(url.pathname);
    if (request.mode === "navigate" && esRutaSeoEstatica) {
        event.respondWith(fetchConReintento(request, { timeoutMs: 10000, reintentos: 1 })
            .catch(() => Response.error()));
        return;
    }

    if (request.mode === "navigate" && EXTENSION_ARCHIVO_ESTATICO.test(url.pathname)) return;

    if (request.mode === "navigate") {
        event.respondWith((async () => {
            const cached = await caches.match("./index.html");
            const networkPromise = fetchConReintento(request).then(async (response) => {
                const runtime = await caches.open(CACHE_RUNTIME);
                runtime.put(request, response.clone());
                return response;
            }).catch(() => null);

            if (cached) {
                event.waitUntil(networkPromise);
                return cached;
            }
            const network = await networkPromise;
            if (network) return network;
            const runtime = await caches.match(request);
            return runtime || Response.error();
        })());
        return;
    }

    event.respondWith((async () => {
        const cached = await caches.match(request);
        const networkPromise = fetchConReintento(request).then(async (response) => {
            const runtime = await caches.open(CACHE_RUNTIME);
            runtime.put(request, response.clone());
            return response;
        }).catch(() => null);

        if (cached) {
            event.waitUntil(networkPromise);
            return cached;
        }
        const network = await networkPromise;
        if (network) return network;
        return Response.error();
    })());
    return;
});