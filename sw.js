/* ============================================================
   LSPedia - Service Worker básico
   ------------------------------------------------------------
   Objetivo único: cumplir el requisito técnico mínimo para que
   el sitio cuente como PWA "instalable" (Chrome/Android exige que
   exista un service worker registrado, aunque sea simple).
   No implementa caché agresivo ni modo offline completo a propósito,
   para no arriesgar que alguien vea contenido desactualizado del
   diccionario (que cambia seguido vía el Apps Script de sync).
   Si más adelante quieres soporte offline real, se puede ampliar
   este archivo con una estrategia de caché (cache-first, etc.).
   ============================================================ */

const CACHE_NOMBRE = "lspedia-shell-v1";

// Solo cacheamos el "cascarón" de la app (HTML/CSS/JS base), nunca
// los JSON de datos (palabras.json, categorias.json, etc.) para que
// el contenido del diccionario siempre se lea fresco de la red.
const ARCHIVOS_CASCARON = [
    "./index.html",
    "css/estilos.css",
    "css/quiz.css",
    "css/alfabetizacion.css",
    "css/subtitulos.css",
    "js/script.js",
    "js/quiz.js",
    "js/alfabetizacion.js",
    "js/subtitulos.js"
];

self.addEventListener("install", (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NOMBRE).then((cache) => cache.addAll(ARCHIVOS_CASCARON))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        caches.keys().then((nombres) =>
            Promise.all(
                nombres
                    .filter((nombre) => nombre !== CACHE_NOMBRE)
                    .map((nombre) => caches.delete(nombre))
            )
        )
    );
    self.clients.claim();
});

// Estrategia: red primero, y si falla (sin conexión), se usa la
// copia en caché del cascarón. Los JSON de datos NO pasan por acá
// gracias al filtro de arriba, así que siempre se piden a la red.
self.addEventListener("fetch", (evento) => {
    const url = new URL(evento.request.url);
    const esCascaron = ARCHIVOS_CASCARON.some((archivo) => url.pathname.endsWith(archivo.replace("./", "")));

    if (!esCascaron) return; // deja pasar todo lo demás (JSON, videos, imágenes) sin intervenir

    evento.respondWith(
        fetch(evento.request).catch(() => caches.match(evento.request))
    );
});
