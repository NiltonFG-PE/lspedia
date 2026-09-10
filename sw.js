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
const VERSION_APP = "v62";
const PREFIJO_CACHE = "lspedia-shell-";
const CACHE_NOMBRE = PREFIJO_CACHE + VERSION_APP;

// Archivos necesarios para que la interfaz principal pueda abrir offline.
// Se incluyen Matemáticas, el manifest y los iconos de instalación.
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
    "manifest.json",
    "img/icons/icon-192.png",
    "img/icons/icon-512.png",
    "img/icons/icon-512-maskable.png",
    "img/imagen-no-disponible.svg"
];

// Convertimos los archivos anteriores a rutas absolutas de pathname para
// reconocerlos aunque la petición lleve parámetros como ?v=20260826.
const RUTAS_CASCARON = new Set(
    ARCHIVOS_CASCARON.map((archivo) => new URL(archivo, self.location.href).pathname)
);

const RUTA_SCOPE = new URL(self.registration.scope).pathname;
const URL_INDEX = new URL("index.html", self.registration.scope);
const RUTA_INDEX = URL_INDEX.pathname;

self.addEventListener("install", (evento) => {
    evento.waitUntil((async () => {
        const cache = await caches.open(CACHE_NOMBRE);

        // Precarga realmente fresca: cache.addAll() puede apoyarse en la
        // caché HTTP del navegador. cache:"reload" obliga a revalidar cada
        // archivo antes de guardarlo dentro de la nueva versión de la PWA.
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
                // Solo eliminamos cachés antiguos creados por ESTE Service Worker.
                // Así no borramos por accidente otros cachés que pueda usar LSPedia.
                .filter((nombre) => nombre.startsWith(PREFIJO_CACHE) && nombre !== CACHE_NOMBRE)
                .map((nombre) => caches.delete(nombre))
        );
        await self.clients.claim();
    })());
});

// Permite activar manualmente una actualización futura sin tener que cambiar
// esta lógica. No recarga la página por la fuerza ni interrumpe videos.
self.addEventListener("message", (evento) => {
    if (evento.data && evento.data.tipo === "ACTIVAR_ACTUALIZACION") {
        self.skipWaiting();
    }
});

self.addEventListener("fetch", (evento) => {
    const request = evento.request;

    // Solo intervenimos en lecturas GET.
    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Recursos externos (YouTube, Bootstrap, Google Fonts, Forms, etc.) siguen
    // funcionando directamente desde la red y no quedan atrapados por la PWA.
    if (url.origin !== self.location.origin) return;

    // Los JSON de datos se dejan fuera del Service Worker para que su contenido
    // se compruebe contra la red. palabras.json ya tiene respaldo en localStorage.
    const esManifest = url.pathname.endsWith("/manifest.json");
    if (url.pathname.endsWith(".json") && !esManifest) return;

    // Para navegaciones (/, ?p=Tesis, ?vista=vocabulario, etc.) usamos RED PRIMERO.
    // Si no hay conexión, devolvemos el index guardado, que reconstruye la vista
    // a partir de la URL gracias al router de script.js.
    const esNavegacionApp = request.mode === "navigate" &&
        (url.pathname === RUTA_SCOPE || url.pathname === RUTA_INDEX);

    if (esNavegacionApp) {
        evento.respondWith((async () => {
            try {
                const respuestaRed = await fetch(request, { cache: "no-store" });

                if (respuestaRed && respuestaRed.ok) {
                    const cache = await caches.open(CACHE_NOMBRE);
                    // Guardamos la versión más reciente como fallback general,
                    // evitando llenar la caché con una copia por cada ?p=...
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

    // CSS, JS, manifest e iconos básicos: RED PRIMERO y CACHÉ como respaldo.
    // La clave normalizada evita problemas con parámetros como ?v=20260826.
    if (RUTAS_CASCARON.has(url.pathname)) {
        evento.respondWith((async () => {
            try {
                const respuestaRed = await fetch(request, { cache: "no-store" });

                if (respuestaRed && respuestaRed.ok) {
                    const cache = await caches.open(CACHE_NOMBRE);
                    // Guardamos una clave normalizada SIN query string. Así una
                    // petición como estilos.css?v=20260908 reemplaza la copia
                    // anterior en vez de dejar varias versiones ambiguas.
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
