from pathlib import Path
import re

js_path = Path("js/script.js")
sw_path = Path("sw.js")

js = js_path.read_text(encoding="utf-8")

viejo = '''    try {
        if(wrap.requestFullscreen){
            await wrap.requestFullscreen({ navigationUI: "hide" });
        } else {
            wrap.classList.add("video-palabra-pantalla-completa-fallback");
        }
    } catch(error){
        console.warn("No se pudo activar fullscreen nativo; usando respaldo visual.", error);
        wrap.classList.add("video-palabra-pantalla-completa-fallback");
    }
'''

nuevo = '''    try {
        const esPantallaTactil = (
            window.matchMedia("(pointer: coarse)").matches ||
            Number(navigator.maxTouchPoints || 0) > 0 ||
            "ontouchstart" in window
        );

        // En celulares y tablets evitamos el fullscreen nativo de Chrome,
        // porque muestra un aviso propio del navegador que tapa nuestros
        // controles. El modo visual ocupa toda la ventana sin ese mensaje.
        if(esPantallaTactil){
            wrap.classList.add("video-palabra-pantalla-completa-fallback");
        } else if(wrap.requestFullscreen){
            await wrap.requestFullscreen({ navigationUI: "hide" });
        } else {
            wrap.classList.add("video-palabra-pantalla-completa-fallback");
        }
    } catch(error){
        console.warn("No se pudo activar fullscreen nativo; usando respaldo visual.", error);
        wrap.classList.add("video-palabra-pantalla-completa-fallback");
    }
'''

if viejo not in js:
    raise SystemExit("No se encontró el bloque actual de fullscreen para reemplazar")

js = js.replace(viejo, nuevo, 1)
js_path.write_text(js, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
sw, n = re.subn(r'const VERSION_APP = "v\d+";', 'const VERSION_APP = "v88";', sw, count=1)
if n != 1:
    raise SystemExit("No se pudo actualizar VERSION_APP")
sw_path.write_text(sw, encoding="utf-8")

print("Parche aplicado: móvil/tablet usa fullscreen visual sin aviso del navegador; PWA v88")
