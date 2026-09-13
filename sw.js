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
   - El panel /admin/ queda fuera del cascarón público para que nunca se
     sustituya por index.html.
   ============================================================ */

const VERSION_APP = "v109";
const PREFIJO_CACHE = "lspedia-shell-";
const PREFIJO_RUNTIME = "lspedia-runtime-";
const CACHE_NOMBRE = PREFIJO_CACHE + VERSION_APP;
const CACHE_RUNTIME = PREFIJO_RUNTIME + VERSION_APP;

// Cascarón mínimo necesario para abrir Diccionario/Vocabulario rápido.
// Alfabetización, Matemáticas, Oraciones y Subtítulos NO se precargan:
// js/lazy-modules.js los solicita solo cuando la persona los necesita.
const ARCHIVOS_CASCARON = [
    "./",
    "./index.html",
    "css/estilos.css",
    "css/quiz.css",
    "css/mejoras-producto.css",
    "js/security.js",
    "js/lazy-modules.js",
    "js/fullscreen-mobile-fix.js",
    "js/pwa-install.js",
    "js/script.js",
    "js/quiz.js",
    "js/mejoras-producto.js",
    "js/mejoras-producto-base.js",
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
    event.waitUntil(
        caches.open(CACHE_NOMBRE).then((cache) => cache.addAll(ARCHIVOS_CASCARON))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (
                    (key.startsWith(PREFIJO_CACHE) && key !== CACHE_NOMBRE) ||
                    (key.startsWith(PREFIJO_RUNTIME) && key !== CACHE_RUNTIME)
                ) {
                    return caches.delete(key);
                }
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

    // El panel privado Admin NO forma parte de la PWA pública. Dejar estas
    // peticiones totalmente en manos del navegador evita que una navegación a
    // /admin/busquedas.html reciba por error el index.html del Diccionario.
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
        return;
    }

    // Los JSON de contenido son deliberadamente network-first/no-store desde
    // el frontend para evitar que una palabra recién publicada quede vieja.
    if (url.pathname.includes("/data/palabras.json") || url.pathname.includes("/data/busqueda-ayudas.json")) return;

    // Navegación pública: devuelve rápido el cascarón cacheado y actualiza en
    // segundo plano cuando la red está disponible.
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

    // Recursos del mismo sitio: stale-while-revalidate. Así CSS/JS aparecen
    // de inmediato desde caché y se actualizan silenciosamente.
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
});
