/* ============================================================
   LSPedia - Service Worker
   ------------------------------------------------------------
   Objetivos:
   - Mantener la PWA instalable y rápida.
   - Usar la red cuando está disponible para evitar versiones viejas.
   - Permitir abrir el cascarón principal de LSPedia sin conexión.
   - NO cachear los JSON de contenido; palabras.json conserva su propia
     estrategia de actualización y respaldo en localStorage desde script.js.
   ============================================================ */

// Cambia esta versión cuando modifiques el cascarón de la aplicación.
const VERSION_APP = "v36";
const PREFIJO_CACHE = "lspedia-shell-";
const CACHE_NOMBRE = PREFIJO_CACHE + VERSION_APP;

const ARCHIVOS_CASCARON = [
    "./",
    "./index.html",
    "css/estilos.css",
    "css/quiz.css",
    "css/alfabetizacion.css",
    "css/matematicas.css",
    "css/subtitulos.css",
    "js/script.js",
    "js/quiz.js",
    "js/alfabetizacion.js",
    "js/matematicas.js",
    "js/oraciones.js",
    "js/subtitulos.js",
    "js/subtitulos-core.js",
    "js/categorias-compartir.js",
    "manifest.json",
    "img/icons/icon-192.png",
    "img/icons/icon-512.png",
    "img/icons/icon-512-maskable.png"
];

const RUTAS_CASCARON = new Set(
    ARCHIVOS_CASCARON.map((archivo) => new URL(archivo, self.location.href).pathname)
);

const RUTA_SCOPE = new URL(self.registration.scope).pathname;
const URL_INDEX = new URL("index.html", self.registration.scope);
const RUTA_INDEX = URL_INDEX.pathname;

self.addEventListener("install", (evento) => {
    evento.waitUntil((async () => {
        const cache = await caches.open(CACHE_NOMBRE);
        await cache.addAll(ARCHIVOS_CASCARON);
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", (evento) => {
    evento.waitUntil((async () => {
        const nombres = await caches.keys();
        await Promise.all(
            nombres
                .filter((nombre) => nombre.startsWith(PREFIJO_CACHE) && nombre !== CACHE_NOMBRE)
                .map((nombre) => caches.delete(nombre))
        );
        await self.clients.claim();
    })());
});

self.addEventListener("message", (evento) => {
    if (evento.data && evento.data.tipo === "ACTIVAR_ACTUALIZACION") {
        self.skipWaiting();
    }
});

self.addEventListener("fetch", (evento) => {
    const request = evento.request;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    const esManifest = url.pathname.endsWith("/manifest.json");
    if (url.pathname.endsWith(".json") && !esManifest) return;

    const esNavegacionApp = request.mode === "navigate" &&
        (url.pathname === RUTA_SCOPE || url.pathname === RUTA_INDEX);

    if (esNavegacionApp) {
        evento.respondWith((async () => {
            try {
                const respuestaRed = await fetch(request, { cache: "no-store" });
                if (respuestaRed && respuestaRed.ok) {
                    const cache = await caches.open(CACHE_NOMBRE);
                    await cache.put(URL_INDEX.href, respuestaRed.clone());
                }
                return respuestaRed;
            } catch (error) {
                const offline =
                    await caches.match(URL_INDEX.href) ||
                    await caches.match(self.registration.scope);
                if (offline) return offline;
                throw error;
            }
        })());
        return;
    }

    if (RUTAS_CASCARON.has(url.pathname)) {
        evento.respondWith((async () => {
            try {
                const respuestaRed = await fetch(request, { cache: "no-store" });
                if (respuestaRed && respuestaRed.ok) {
                    const cache = await caches.open(CACHE_NOMBRE);
                    const claveCache = new Request(url.origin + url.pathname);
                    await cache.put(claveCache, respuestaRed.clone());
                }
                return respuestaRed;
            } catch (error) {
                const claveCache = new Request(url.origin + url.pathname);
                const respuestaCache = await caches.match(claveCache);
                if (respuestaCache) return respuestaCache;
                throw error;
            }
        })());
    }
});