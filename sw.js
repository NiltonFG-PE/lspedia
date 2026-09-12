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
   ============================================================ */

const VERSION_APP = "v101";
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
    "manifest.json",
    "img/icons/icon-192-v82.png",
    "img/icons/icon-512-v82.png",
    "img/icons/icon-512-maskable-v82.png",
    "img/imagen-no-disponible.svg"
];

const RUTAS_CASCARON = new Set(
    ARCHIVOS_CASCARON.map((archivo) => new URL(archivo, self.location.href).pathname)
);

const RUTAS_PEREZOSAS = new Set([
    "js/alfabetizacion.js",
    "js/matematicas.js",
    "js/oraciones.js",
    "js/subtitulos.js",
    "css/alfabetizacion.css",
    "css/matematicas.css",
    "css/subtitulos.css"
].map((archivo) => new URL(archivo, self.location.href).pathname));

const RUTA_SCOPE = new URL(self.registration.scope).pathname;
const URL_INDEX = new URL("index.html", self.registration.scope);
const RUTA_INDEX = URL_INDEX.pathname;

self.addEventListener("install", (evento) => {
    evento.waitUntil((async () => {
        const cache = await caches.open(CACHE_NOMBRE);
        await Promise.all(ARCHIVOS_CASCARON.map(async (archivo) => {
            const urlArchivo = new URL(archivo, self.registration.scope);
            const requestFresco = new Request(urlArchivo.href, { cache: "reload" });
            const respuesta = await fetch(requestFresco);
            if (!respuesta || !respuesta.ok) {
                throw new Error(`No se pudo precargar ${urlArchivo.pathname}`);
            }
            await cache.put(new Request(urlArchivo.href), respuesta.clone());
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", (evento) => {
    evento.waitUntil((async () => {
        const nombres = await caches.keys();
        await Promise.all(
            nombres
                .filter((nombre) =>
                    (nombre.startsWith(PREFIJO_CACHE) && nombre !== CACHE_NOMBRE) ||
                    (nombre.startsWith(PREFIJO_RUNTIME) && nombre !== CACHE_RUNTIME)
                )
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

async function actualizarCacheEnSegundoPlano(request, cache, clave) {
    try {
        const respuesta = await fetch(request, { cache: "no-store" });
        if (respuesta && respuesta.ok) {
            await cache.put(clave, respuesta.clone());
        }
        return respuesta;
    } catch (_error) {
        return null;
    }
}

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

    // Shell: caché primero y actualización silenciosa. En una conexión lenta
    // no se vuelve a esperar por CSS/JS que el dispositivo ya descargó antes.
    if (RUTAS_CASCARON.has(url.pathname)) {
        evento.respondWith((async () => {
            const cache = await caches.open(CACHE_NOMBRE);
            const clave = new Request(url.origin + url.pathname);
            const guardada = await cache.match(clave);

            if (guardada) {
                evento.waitUntil(actualizarCacheEnSegundoPlano(request, cache, clave));
                return guardada;
            }

            const respuesta = await actualizarCacheEnSegundoPlano(request, cache, clave);
            if (respuesta) return respuesta;
            throw new Error("Recurso del shell no disponible: " + url.pathname);
        })());
        return;
    }

    // Módulos bajo demanda: se descargan la primera vez que se usan y luego
    // abren desde caché de inmediato. La query ?v=... invalida versiones viejas.
    if (RUTAS_PEREZOSAS.has(url.pathname)) {
        evento.respondWith((async () => {
            const cache = await caches.open(CACHE_RUNTIME);
            const clave = request;
            const guardada = await cache.match(clave);

            if (guardada) {
                evento.waitUntil(actualizarCacheEnSegundoPlano(request, cache, clave));
                return guardada;
            }

            const respuesta = await actualizarCacheEnSegundoPlano(request, cache, clave);
            if (respuesta) return respuesta;
            throw new Error("Módulo bajo demanda no disponible: " + url.pathname);
        })());
    }
});