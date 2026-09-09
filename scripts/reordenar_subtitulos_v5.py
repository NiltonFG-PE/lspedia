from pathlib import Path

repo = Path(__file__).resolve().parents[1]
js_path = repo / "js" / "subtitulos.js"
css_path = repo / "css" / "subtitulos.css"
sw_path = repo / "sw.js"

js = js_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")
sw = sw_path.read_text(encoding="utf-8")

marker = "SUBTITULOS_V5_ORDEN_VISUAL_20260909"
if marker in js:
    raise SystemExit("La mejora V5 ya fue aplicada")

anchor = '''        const btnIniciar = el("btnSubtitulosIniciar");
        if (btnIniciar) {
            btnIniciar.innerHTML = '🎙️ Iniciar subtítulos <span class="subtitulos-icono-grabar" aria-hidden="true"></span>';
        }
    }

    function actualizarEstadoMotor(tipo, textoPersonalizado) {'''

replacement = '''        const btnIniciar = el("btnSubtitulosIniciar");
        if (btnIniciar) {
            btnIniciar.innerHTML = '🎙️ Iniciar subtítulos <span class="subtitulos-icono-grabar" aria-hidden="true"></span>';
        }

        organizarIntroCompactaV5();
    }

    // SUBTITULOS_V5_ORDEN_VISUAL_20260909
    // Reordena la pantalla inicial para que la acción principal aparezca
    // antes que las opciones secundarias. Conserva exactamente los mismos
    // controles/IDs, así que no cambia la lógica del micrófono ni del modo
    // offline: solo mueve los nodos ya existentes dentro de una jerarquía
    // visual más clara.
    function organizarIntroCompactaV5() {
        const introCard = document.querySelector("#subtitulosIntro .card");
        const hero = introCard && introCard.querySelector(".subtitulos-intro-hero-v3");
        const btnIniciar = el("btnSubtitulosIniciar");
        if (!introCard || !hero || !btnIniciar) return;

        // El pequeño paso a paso acompaña ahora el flujo real: primero se
        // inicia, luego se escucha y finalmente se lee el texto en pantalla.
        const pasos = hero.querySelector(".subtitulos-pasos-v3");
        if (pasos) {
            pasos.innerHTML = '<span><b>1</b> Inicia</span><span><b>2</b> Escucha</span><span><b>3</b> Lee</span>';
        }
        const textoHero = hero.querySelector(".subtitulos-hero-textos p");
        if (textoHero) textoHero.textContent = "Toca iniciar y acerca el celular a quien habla o al parlante.";

        // 1) ACCIÓN PRINCIPAL: queda inmediatamente debajo del hero.
        let accion = el("subtitulosAccionPrincipalV5");
        if (!accion) {
            accion = document.createElement("div");
            accion.id = "subtitulosAccionPrincipalV5";
            accion.className = "subtitulos-accion-principal-v5";
            const ayuda = document.createElement("small");
            ayuda.className = "subtitulos-accion-ayuda-v5";
            ayuda.textContent = "Toca aquí para comenzar a convertir voz en texto.";
            hero.insertAdjacentElement("afterend", accion);
            accion.appendChild(btnIniciar);
            accion.appendChild(ayuda);
        }
        btnIniciar.className = "btn subtitulos-btn-principal-v5";

        // 2) CONTROLES BÁSICOS: idioma + prueba de audio en una sola zona.
        let basicos = el("subtitulosBasicosV5");
        if (!basicos) {
            basicos = document.createElement("div");
            basicos.id = "subtitulosBasicosV5";
            basicos.className = "subtitulos-basicos-v5";
            accion.insertAdjacentElement("afterend", basicos);
        }

        const selectIdioma = el("subtitulosSelectIdioma");
        const filaIdioma = selectIdioma ? selectIdioma.closest(".row") : null;
        if (filaIdioma && filaIdioma.parentElement !== basicos) basicos.appendChild(filaIdioma);

        const medidorCaja = el("subtitulosMedidorCaja");
        const medidorWrap = medidorCaja ? medidorCaja.parentElement : null;
        if (medidorWrap && medidorWrap.parentElement !== basicos) basicos.appendChild(medidorWrap);

        // 3) OPCIONES AVANZADAS: plegadas por defecto para que no compitan
        // con el botón principal. Incluyen modo offline y palabras clave.
        let avanzadas = el("subtitulosAvanzadasV5");
        if (!avanzadas) {
            avanzadas = document.createElement("details");
            avanzadas.id = "subtitulosAvanzadasV5";
            avanzadas.className = "subtitulos-details-v5";
            avanzadas.innerHTML = '<summary><span>⚙️ Opciones avanzadas</span><small>Sin internet y precisión</small></summary><div class="subtitulos-details-contenido-v5"></div>';
            basicos.insertAdjacentElement("afterend", avanzadas);
        }
        const contenidoAvanzadas = avanzadas.querySelector(".subtitulos-details-contenido-v5");
        const offline = el("subtitulosOfflineCard");
        const inputContexto = el("subtitulosContextoPalabras");
        const precision = inputContexto ? inputContexto.closest(".subtitulos-precision-card-v4") : null;
        if (contenidoAvanzadas && offline && offline.parentElement !== contenidoAvanzadas) contenidoAvanzadas.appendChild(offline);
        if (contenidoAvanzadas && precision && precision.parentElement !== contenidoAvanzadas) contenidoAvanzadas.appendChild(precision);

        // 4) CONSEJOS: también plegados. Buscamos el bloque existente y lo
        // movemos, sin duplicar sus textos ni cambiar su funcionalidad.
        let consejos = el("subtitulosConsejosV5");
        if (!consejos) {
            consejos = document.createElement("details");
            consejos.id = "subtitulosConsejosV5";
            consejos.className = "subtitulos-details-v5 subtitulos-consejos-v5";
            consejos.innerHTML = '<summary><span>📢 Consejos para captar mejor el audio</span><small>Ver recomendaciones</small></summary><div class="subtitulos-details-contenido-v5"></div>';
            avanzadas.insertAdjacentElement("afterend", consejos);
        }
        const contenidoConsejos = consejos.querySelector(".subtitulos-details-contenido-v5");
        if (contenidoConsejos && !contenidoConsejos.querySelector(".subtitulos-consejos-original-v5")) {
            const candidatos = Array.from(introCard.querySelectorAll("div"));
            const bloqueConsejos = candidatos.find((nodo) => {
                const p = nodo.querySelector(":scope > p");
                const ul = nodo.querySelector(":scope > ul");
                return p && ul && p.textContent.includes("Consejos para captar mejor el audio");
            });
            if (bloqueConsejos) {
                bloqueConsejos.classList.add("subtitulos-consejos-original-v5");
                bloqueConsejos.removeAttribute("style");
                const p = bloqueConsejos.querySelector(":scope > p");
                const ul = bloqueConsejos.querySelector(":scope > ul");
                if (p) p.removeAttribute("style");
                if (ul) ul.removeAttribute("style");
                contenidoConsejos.appendChild(bloqueConsejos);
            }
        }

        // El aviso de compatibilidad queda al final, en formato discreto.
        const aviso = el("subtitulosAvisoCompat");
        if (aviso) {
            aviso.classList.add("subtitulos-aviso-compacto-v5");
            if (aviso.previousElementSibling !== consejos) consejos.insertAdjacentElement("afterend", aviso);
        }
    }

    function actualizarEstadoMotor(tipo, textoPersonalizado) {'''

if anchor not in js:
    raise SystemExit("No se encontró el punto esperado en js/subtitulos.js")
js = js.replace(anchor, replacement, 1)

css_marker = "SUBTITULOS_V5_ORDEN_VISUAL_20260909"
css_append = r'''

/* ============================================================
   SUBTITULOS_V5_ORDEN_VISUAL_20260909
   Jerarquía más simple: acción principal arriba, controles básicos juntos
   y opciones secundarias plegadas.
   ============================================================ */
#subtitulosIntro .quiz-card {
    max-width: 820px;
}

.subtitulos-accion-principal-v5 {
    position: sticky;
    top: 116px;
    z-index: 12;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 16px auto 20px;
    padding: 16px 18px;
    max-width: 600px;
    border: 1px solid rgba(59,130,246,.18);
    border-radius: 20px;
    background: rgba(248,251,255,.94);
    box-shadow: 0 12px 28px rgba(37,99,235,.11);
    backdrop-filter: blur(12px);
}

.subtitulos-btn-principal-v5 {
    min-width: min(360px, 100%);
    min-height: 54px;
    padding: 13px 26px !important;
    border: 0 !important;
    border-radius: 999px !important;
    color: #fff !important;
    font-weight: 800 !important;
    font-size: 1.08rem !important;
    background: linear-gradient(100deg, #2563eb 0%, #0ea5e9 100%) !important;
    box-shadow: 0 10px 24px rgba(37,99,235,.28);
    transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
}
.subtitulos-btn-principal-v5:hover,
.subtitulos-btn-principal-v5:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(37,99,235,.34);
    filter: saturate(1.06);
}
.subtitulos-accion-ayuda-v5 {
    color: #64748b;
    font-size: .78rem;
    text-align: center;
}

.subtitulos-basicos-v5 {
    width: 100%;
    max-width: 600px;
    margin: 0 auto 16px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    align-items: stretch;
}
.subtitulos-basicos-v5 > .row,
.subtitulos-basicos-v5 > div {
    width: 100%;
    max-width: none !important;
    margin: 0 !important;
}
.subtitulos-basicos-v5 > .row {
    display: block !important;
}
.subtitulos-basicos-v5 > .row > div {
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
}
.subtitulos-basicos-v5 #subtitulosMedidorCaja {
    height: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-radius: 16px !important;
    border-color: #dbe8f5 !important;
    background: #fff !important;
    box-shadow: 0 5px 15px rgba(15,23,42,.035);
}
.subtitulos-basicos-v5 #btnSubtitulosProbarNivel {
    margin: 0 !important;
    min-height: 42px;
}
.subtitulos-basicos-v5 .form-label {
    margin-bottom: 7px;
    color: #475569 !important;
}
.subtitulos-basicos-v5 .form-select {
    min-height: 46px;
    border-radius: 14px;
    border-color: #cbdcf0;
    background-color: #fff;
}

.subtitulos-details-v5 {
    width: 100%;
    max-width: 600px;
    margin: 0 auto 12px;
    border: 1px solid #dbe6f2;
    border-radius: 18px;
    background: #fff;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(15,23,42,.045);
}
.subtitulos-details-v5 > summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-height: 54px;
    padding: 13px 16px;
    color: #24364d;
    font-weight: 800;
    background: #f8fbff;
    user-select: none;
}
.subtitulos-details-v5 > summary::-webkit-details-marker { display: none; }
.subtitulos-details-v5 > summary::after {
    content: "⌄";
    font-size: 1.25rem;
    color: #64748b;
    transition: transform .2s ease;
}
.subtitulos-details-v5[open] > summary::after { transform: rotate(180deg); }
.subtitulos-details-v5 > summary small {
    margin-left: auto;
    color: #7c8ca1;
    font-size: .72rem;
    font-weight: 600;
}
.subtitulos-details-contenido-v5 {
    padding: 14px;
    border-top: 1px solid #edf2f7;
}
.subtitulos-details-contenido-v5 .subtitulos-offline-card-v4,
.subtitulos-details-contenido-v5 .subtitulos-precision-card-v4 {
    max-width: none;
    margin: 0 0 12px;
    box-shadow: none;
}
.subtitulos-details-contenido-v5 .subtitulos-precision-card-v4:last-child,
.subtitulos-details-contenido-v5 .subtitulos-offline-card-v4:last-child {
    margin-bottom: 0;
}
.subtitulos-consejos-original-v5 {
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
}
.subtitulos-consejos-original-v5 > p {
    display: none;
}
.subtitulos-consejos-original-v5 > ul {
    margin: 0 !important;
    padding-left: 1.15rem !important;
    color: #596b80 !important;
    line-height: 1.55;
}
.subtitulos-consejos-original-v5 li + li { margin-top: 5px; }

#subtitulosAvisoCompat.subtitulos-aviso-compacto-v5 {
    display: block;
    width: 100%;
    max-width: 600px;
    margin: 12px auto 0 !important;
    padding: 9px 13px;
    border: 1px solid #e0e8f2;
    border-radius: 999px;
    background: #f5f8fc;
    color: #77869a !important;
    font-size: .72rem;
    line-height: 1.35;
    text-align: center;
}

@media (max-width: 767.98px) {
    .subtitulos-accion-principal-v5 {
        top: 78px;
        margin-top: 12px;
        padding: 13px;
        border-radius: 17px;
    }
    .subtitulos-btn-principal-v5 {
        width: 100%;
        min-width: 0;
        font-size: 1rem !important;
    }
    .subtitulos-basicos-v5 {
        grid-template-columns: 1fr;
        gap: 10px;
    }
    .subtitulos-details-v5 > summary {
        min-height: 50px;
        padding: 11px 13px;
    }
    .subtitulos-details-v5 > summary small {
        display: none;
    }
    .subtitulos-details-contenido-v5 { padding: 11px; }
    #subtitulosAvisoCompat.subtitulos-aviso-compacto-v5 {
        border-radius: 14px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .subtitulos-btn-principal-v5 { transition: none; }
}
'''

if css_marker in css:
    raise SystemExit("El CSS V5 ya fue aplicado")
css = css.rstrip() + css_append + "\n"

if 'const VERSION_APP = "v44";' not in sw:
    raise SystemExit("La versión esperada de PWA no es v44")
sw = sw.replace('const VERSION_APP = "v44";', 'const VERSION_APP = "v45";', 1)

js_path.write_text(js, encoding="utf-8")
css_path.write_text(css, encoding="utf-8")
sw_path.write_text(sw, encoding="utf-8")
