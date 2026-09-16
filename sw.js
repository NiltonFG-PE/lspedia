/* ============================================================
   LSPedia - Service Worker
   ------------------------------------------------------------
   Objetivos:
   - Mantener la PWA instalable y rápida.
   - Abrir el cascarón desde caché inmediatamente en visitas repetidas.
   - Actualizar recursos en segundo plano sin bloquear al usuario.
   - No precargar módulos pesados que ahora se cargan bajo demanda.
   - Mantener los JSON de contenido fuera del SW: palabras.json conserva
     su propia caché rápida + revalidación desde script.js.
   - El panel /admin/ y los laboratorios quedan fuera del fallback público.
   ============================================================ */

const VERSION_APP = "v140";
const PREFIJO_CACHE = "lspedia-shell-";
const PREFIJO_RUNTIME = "lspedia-runtime-";
const CACHE_NOMBRE = PREFIJO_CACHE + VERSION_APP;
const CACHE_RUNTIME = PREFIJO_RUNTIME + VERSION_APP;

// Cuando un archivo estático se abre directamente en una pestaña, el navegador
// usa una navegación de nivel superior (request.mode === "navigate"). Esas
// solicitudes no deben recibir index.html como fallback de la PWA.
const EXTENSION_ARCHIVO_ESTATICO = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|css|js|mjs|json|map|webmanifest|woff2?|ttf|otf|mp3|wav|ogg|mp4|webm|pdf|txt|xml)$/i;

const ARCHIVOS_CASCARON = [
    "./",
    "./index.html",
    "img/favicon.png",
    "css/estilos.css",
    "css/quiz.css",
    "css/mejoras-producto.css",
    "css/accesibilidad-segura.css",
    "css/vocabulario-layout.css",
    "js/security.js",
    "js/lspedia-core.js",
    "js/accesibilidad-segura.js",
    "js/seo-institucional.js",
    "js/vocabulario-publico.js",
    "js/juegos-banco-compartido.js",
    "js/lazy-modules.js",
    "js/fullscreen-mobile-fix.js",
    "js/pwa-install.js",
    "js/script.js",
    "js/quiz.js",
    "js/mejoras-producto.js",
    "js/categorias-compartir.js",
    "js/mejoras-producto-base.js",
    "js/optimizacion-errores.js",
    "js/rendimiento-movil.js",
    "js/lo-nuevo.js",
    "js/i18n.js",
    "js/i18n-restaurar.js",
    "js/i18n-auto.js",
    "js/buscador-visual.js",
    "js/buscador-predictivo.js",
    "data/vocabulario.json",
    "data/nuevas-palabras.json"
];

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

    // Abrir una imagen u otro archivo en una pestaña también cuenta como
    // "navigate". Si dejamos que caiga en el bloque SPA de abajo, el SW
    // devuelve index.html y aparece la pantalla de carga de LSPedia en vez
    // del archivo. Para archivos estáticos, dejamos actuar a la red normal.
    if (request.mode === "navigate" && EXTENSION_ARCHIVO_ESTATICO.test(url.pathname)) return;

    if (request.mode === "navigate") {
        event.respondWith((async () => {
            const cached = await caches.match("./index.html");
            const networkPromise = fetch(request).then(async (response) => {
                if (response && response.ok) {
                    const runtime = await caches.open(CACHE_RUNTIME);
                    runtime.put(request, response.clone());
                }
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
        const networkPromise = fetch(request).then(async (response) => {
            if (response && response.ok) {
                const runtime = await caches.open(CACHE_RUNTIME);
                runtime.put(request, response.clone());
            }
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
