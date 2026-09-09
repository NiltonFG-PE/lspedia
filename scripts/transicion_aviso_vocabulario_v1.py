from pathlib import Path

repo = Path(__file__).resolve().parents[1]
index_path = repo / "index.html"
css_path = repo / "css" / "estilos.css"
script_path = repo / "js" / "script.js"
sw_path = repo / "sw.js"

index = index_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")
script = script_path.read_text(encoding="utf-8")
sw = sw_path.read_text(encoding="utf-8")

MARKER = "TRANSICION_AVISO_VOCABULARIO_V1_20260909"
if MARKER in css or MARKER in script:
    raise SystemExit("La transición del aviso ya fue aplicada")

# 1) El botón deja de cerrar el modal por su cuenta. Así JS puede esperar
# al cierre real de Bootstrap antes de revelar y enfocar el buscador.
old_btn = '<button type="button" class="btn btn-primary px-4" id="btnAceptarAvisoVocabulario" data-bs-dismiss="modal">ENTIENDO, CONTINUAR</button>'
new_btn = '<button type="button" class="btn btn-primary px-4" id="btnAceptarAvisoVocabulario">ENTIENDO, CONTINUAR</button>'
if old_btn not in index:
    raise SystemExit("No se encontró el botón actual del aviso de Vocabulario")
index = index.replace(old_btn, new_btn, 1)

# 2) Mejora visual: entrada scale .96 -> 1, fondo difuminado y salida suave.
old_blur = '''#contenidoPrincipalApp.contenido-desenfocado {
    filter: blur(6px);
    -webkit-filter: blur(6px);
    pointer-events: none;
    -webkit-user-select: none;
    user-select: none;
    transition: filter 0.2s ease;
}
'''
new_blur = '''#contenidoPrincipalApp.contenido-desenfocado {
    filter: blur(5px);
    -webkit-filter: blur(5px);
    opacity: 0.90;
    pointer-events: none;
    -webkit-user-select: none;
    user-select: none;
    transition: filter 0.22s ease, opacity 0.22s ease;
}

/* TRANSICION_AVISO_VOCABULARIO_V1_20260909
   El aviso entra con una ampliación muy leve y se retira sin saltos.
   El fondo mantiene el contexto visible, pero suavemente difuminado. */
body.vocab-aviso-activo .modal-backdrop.show {
    opacity: 0.38;
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
}

#modalAvisoVocabulario.fade .modal-dialog {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
    transition: opacity 0.18s ease,
                transform 0.23s cubic-bezier(0.22, 1, 0.36, 1);
}

#modalAvisoVocabulario.show .modal-dialog {
    opacity: 1;
    transform: translateY(0) scale(1);
}

#modalAvisoVocabulario.lsp-aviso-cerrando .modal-dialog {
    opacity: 0;
    transform: translateY(4px) scale(0.985);
    transition-duration: 0.16s;
}

#modalAvisoVocabulario .modal-content {
    overflow: hidden;
    border-radius: 18px;
}

/* Después de aceptar, el buscador aparece como el siguiente paso natural. */
#bloqueBuscadorCategorias.vocab-buscador-revelado {
    animation: vocabBuscadorRevelado 0.30s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes vocabBuscadorRevelado {
    from {
        opacity: 0.35;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (prefers-reduced-motion: reduce) {
    #contenidoPrincipalApp.contenido-desenfocado {
        transition: none;
    }
    #modalAvisoVocabulario.fade .modal-dialog,
    #modalAvisoVocabulario.show .modal-dialog,
    #modalAvisoVocabulario.lsp-aviso-cerrando .modal-dialog {
        opacity: 1;
        transform: none;
        transition: none;
    }
    #bloqueBuscadorCategorias.vocab-buscador-revelado {
        animation: none;
    }
}
'''
if old_blur not in css:
    raise SystemExit("No se encontró el bloque actual de desenfoque")
css = css.replace(old_blur, new_blur, 1)

# 3) mostrarAvisoVocabulario ahora informa si realmente abrió el modal.
old_show = '''function mostrarAvisoVocabulario() {
    // Si ya fue aceptado en esta sesión, no mostramos ni desenfocamos nada.
    if (avisoVocabularioYaAceptado()) return;

    const modalEl = document.getElementById("modalAvisoVocabulario");
    if (!modalEl) return;

    const contenidoPrincipal = document.getElementById("contenidoPrincipalApp");
    if (contenidoPrincipal) contenidoPrincipal.classList.add("contenido-desenfocado");

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}
'''
new_show = '''function mostrarAvisoVocabulario() {
    // Si ya fue aceptado en esta sesión, no mostramos ni desenfocamos nada.
    if (avisoVocabularioYaAceptado()) return false;

    const modalEl = document.getElementById("modalAvisoVocabulario");
    if (!modalEl) return false;

    const contenidoPrincipal = document.getElementById("contenidoPrincipalApp");
    if (contenidoPrincipal) contenidoPrincipal.classList.add("contenido-desenfocado");
    document.body.classList.add("vocab-aviso-activo");
    modalEl.classList.remove("lsp-aviso-cerrando");

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
    return true;
}
'''
if old_show not in script:
    raise SystemExit("No se encontró mostrarAvisoVocabulario()")
script = script.replace(old_show, new_show, 1)

# 4) Controlamos la salida. El desenfoque solo se retira cuando Bootstrap
# terminó de cerrar; recién entonces se lleva la vista al buscador.
old_accept = '''const btnAceptarAvisoVocabulario = document.getElementById("btnAceptarAvisoVocabulario");
if (btnAceptarAvisoVocabulario) {
    btnAceptarAvisoVocabulario.addEventListener("click", () => {
        registrarAvisoVocabularioAceptado();
        const contenidoPrincipal = document.getElementById("contenidoPrincipalApp");
        if (contenidoPrincipal) contenidoPrincipal.classList.remove("contenido-desenfocado");
    });
}
'''
new_accept = '''// TRANSICION_AVISO_VOCABULARIO_V1_20260909
let revelarBuscadorTrasCerrarAvisoVocabulario = false;
const modalAvisoVocabulario = document.getElementById("modalAvisoVocabulario");
const btnAceptarAvisoVocabulario = document.getElementById("btnAceptarAvisoVocabulario");

if (btnAceptarAvisoVocabulario && modalAvisoVocabulario) {
    btnAceptarAvisoVocabulario.addEventListener("click", () => {
        registrarAvisoVocabularioAceptado();
        revelarBuscadorTrasCerrarAvisoVocabulario = true;
        btnAceptarAvisoVocabulario.disabled = true;
        modalAvisoVocabulario.classList.add("lsp-aviso-cerrando");

        const modal = bootstrap.Modal.getOrCreateInstance(modalAvisoVocabulario);
        modal.hide();
    });

    modalAvisoVocabulario.addEventListener("hidden.bs.modal", () => {
        const contenidoPrincipal = document.getElementById("contenidoPrincipalApp");
        if (contenidoPrincipal) contenidoPrincipal.classList.remove("contenido-desenfocado");
        document.body.classList.remove("vocab-aviso-activo");
        modalAvisoVocabulario.classList.remove("lsp-aviso-cerrando");
        btnAceptarAvisoVocabulario.disabled = false;

        if (!revelarBuscadorTrasCerrarAvisoVocabulario) return;
        revelarBuscadorTrasCerrarAvisoVocabulario = false;

        const destino = bloqueBuscadorCategorias || panelCategorias;
        if (!destino || !document.body.classList.contains("vista-temas-movil")) return;

        destino.classList.remove("vocab-buscador-revelado");
        void destino.offsetWidth;
        destino.classList.add("vocab-buscador-revelado");
        scrollAlPrimerResultado(destino);

        setTimeout(() => {
            destino.classList.remove("vocab-buscador-revelado");
            if (buscarCategorias) {
                try { buscarCategorias.focus({ preventScroll: true }); }
                catch (_error) { buscarCategorias.focus(); }
            }
        }, 320);
    });
}
'''
if old_accept not in script:
    raise SystemExit("No se encontró el listener actual del botón Aceptar")
script = script.replace(old_accept, new_accept, 1)

# 5) El handler de Vocabulario recuerda si el aviso apareció, para no hacer
# el scroll al buscador por debajo del modal antes de que el usuario acepte.
old_handler_start = '''document.getElementById("btnCategorias").addEventListener("click", (e) => {
    e.preventDefault();
    if(omitirAvisoVocabularioUnaVez){
        omitirAvisoVocabularioUnaVez = false;
    } else {
        mostrarAvisoVocabulario();
    }
'''
new_handler_start = '''document.getElementById("btnCategorias").addEventListener("click", (e) => {
    e.preventDefault();
    let avisoVocabularioMostrado = false;
    if(omitirAvisoVocabularioUnaVez){
        omitirAvisoVocabularioUnaVez = false;
    } else {
        avisoVocabularioMostrado = mostrarAvisoVocabulario();
    }
'''
if old_handler_start not in script:
    raise SystemExit("No se encontró el inicio del handler de Vocabulario")
script = script.replace(old_handler_start, new_handler_start, 1)

old_scroll = '''    } else {
        // Al entrar a Vocabulario, la primera referencia visual debe ser el
        // buscador. Antes se centraba #panelCategorias y, al cerrar el aviso
        // inicial, la pantalla quedaba a mitad de la sección. Reutilizamos el
        // scroll estable para dejar el buscador justo debajo del navbar fijo.
        scrollAlPrimerResultado(bloqueBuscadorCategorias || panelCategorias);
'''
new_scroll = '''    } else if (!avisoVocabularioMostrado) {
        // Al entrar a Vocabulario sin aviso (ya aceptado en esta sesión), la
        // primera referencia visual sigue siendo el buscador. Si el aviso se
        // mostró, el scroll se hace al terminar su animación de salida.
        scrollAlPrimerResultado(bloqueBuscadorCategorias || panelCategorias);
'''
if old_scroll not in script:
    raise SystemExit("No se encontró el bloque de scroll al entrar a Vocabulario")
script = script.replace(old_scroll, new_scroll, 1)

# PWA: forzar actualización del shell en móviles instalados.
if 'const VERSION_APP = "v51";' not in sw:
    raise SystemExit("La versión esperada de la PWA no es v51")
sw = sw.replace('const VERSION_APP = "v51";', 'const VERSION_APP = "v52";', 1)

index_path.write_text(index, encoding="utf-8")
css_path.write_text(css, encoding="utf-8")
script_path.write_text(script, encoding="utf-8")
sw_path.write_text(sw, encoding="utf-8")
