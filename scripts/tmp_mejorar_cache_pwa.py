#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ============================================================
# 1) Service Worker: la red debe ser realmente fresca.
# ============================================================
sw_path = ROOT / "sw.js"
sw = sw_path.read_text(encoding="utf-8")

if 'const VERSION_APP = "v60";' in sw:
    sw = sw.replace('const VERSION_APP = "v60";', 'const VERSION_APP = "v61";', 1)
elif 'const VERSION_APP = "v61";' not in sw:
    raise SystemExit("Versión inesperada de sw.js; no se aplicaron cambios.")

old_install = '''        const cache = await caches.open(CACHE_NOMBRE);\n        await cache.addAll(ARCHIVOS_CASCARON);\n        await self.skipWaiting();'''
new_install = '''        const cache = await caches.open(CACHE_NOMBRE);\n\n        // Precarga realmente fresca: cache.addAll() puede apoyarse en la\n        // caché HTTP del navegador. cache:"reload" obliga a revalidar cada\n        // archivo antes de guardarlo dentro de la nueva versión de la PWA.\n        await Promise.all(ARCHIVOS_CASCARON.map(async (archivo) => {\n            const urlArchivo = new URL(archivo, self.registration.scope);\n            const requestFresco = new Request(urlArchivo.href, { cache: "reload" });\n            const respuesta = await fetch(requestFresco);\n            if (!respuesta || !respuesta.ok) {\n                throw new Error(`No se pudo precargar ${urlArchivo.pathname}`);\n            }\n            await cache.put(new Request(urlArchivo.href), respuesta.clone());\n        }));\n\n        await self.skipWaiting();'''

if old_install in sw:
    sw = sw.replace(old_install, new_install, 1)
elif 'const requestFresco = new Request(urlArchivo.href, { cache: "reload" });' not in sw:
    raise SystemExit("No se encontró el bloque install esperado en sw.js.")

# Deben existir exactamente dos fetch(request) de la aplicación: navegación
# y recursos del cascarón. Los convertimos en peticiones que no reutilizan
# la caché HTTP del navegador. El caché propio del Service Worker sigue siendo
# el respaldo offline dentro del catch.
if 'const respuestaRed = await fetch(request);' in sw:
    sw = sw.replace(
        'const respuestaRed = await fetch(request);',
        'const respuestaRed = await fetch(request, { cache: "no-store" });'
    )

if sw.count('const respuestaRed = await fetch(request, { cache: "no-store" });') != 2:
    raise SystemExit("No quedaron exactamente dos fetch frescos en sw.js.")

sw_path.write_text(sw, encoding="utf-8")

# ============================================================
# 2) Cliente: revisar el Service Worker sin usar caché HTTP.
# ============================================================
js_path = ROOT / "js" / "script.js"
js = js_path.read_text(encoding="utf-8")
marker = "ACTUALIZACIÓN PWA SIN CACHÉ HTTP — 20260910"

if marker not in js:
    js += r'''


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
'''
    js_path.write_text(js, encoding="utf-8")

print("Mejora de caché/PWA preparada correctamente.")
