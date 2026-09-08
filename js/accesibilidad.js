/* ============================================================
   LSPedia - Accesibilidad global
   ------------------------------------------------------------
   Mejora la experiencia sin cambiar el diseño ni desactivar funciones:
   - nombres accesibles para controles con iconos;
   - foco visible y navegación por teclado;
   - regiones vivas para resultados y mensajes;
   - títulos para videos, formularios e iframes;
   - estado accesible de Favoritos;
   - manejo de foco en modales;
   - soporte para contenido que aparece dinámicamente.
   ============================================================ */
(function () {
    "use strict";

    const SELECTOR_INTERACTIVO = [
        "button",
        "a[href]",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    const SIMBOLOS_SIN_NOMBRE = new Set([
        "", "×", "✕", "✖", "☰", "⋮", "…", "←", "→", "↩", "↪",
        "⛶", "🔊", "🔇", "❤️", "♡", "♥", "★", "☆", "+", "−", "-"
    ]);

    let ultimoDisparadorModal = null;
    let regionEstado = null;
    let regionAlerta = null;

    function textoVisible(el) {
        return String(el && el.innerText ? el.innerText : "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function tieneNombreAccesible(el) {
        if (!el) return false;
        if (el.getAttribute("aria-label")) return true;
        if (el.getAttribute("aria-labelledby")) return true;
        if (el.getAttribute("title")) return true;

        const texto = textoVisible(el);
        if (texto && !SIMBOLOS_SIN_NOMBRE.has(texto)) return true;

        const img = el.querySelector && el.querySelector("img[alt]");
        return !!(img && String(img.getAttribute("alt") || "").trim());
    }

    function fuenteIdentificadora(el) {
        return [
            el.id || "",
            typeof el.className === "string" ? el.className : "",
            el.getAttribute("name") || "",
            el.getAttribute("data-action") || "",
            el.getAttribute("data-accion") || ""
        ].join(" ").toLowerCase();
    }

    function etiquetaSugerida(el) {
        const fuente = fuenteIdentificadora(el);
        if (/favorit/.test(fuente)) return esFavoritoActivo(el) ? "Quitar de favoritos" : "Agregar a favoritos";
        if (/cerrar|close/.test(fuente)) return "Cerrar";
        if (/volver|atras|atrás|back/.test(fuente)) return "Volver";
        if (/salir|exit/.test(fuente)) return "Salir";
        if (/compart|share/.test(fuente)) return "Compartir";
        if (/fullscreen|pantalla.?completa|maxim/.test(fuente)) return "Pantalla completa";
        if (/sonido|audio|volumen|mute/.test(fuente)) return "Control de sonido";
        if (/menu|menú/.test(fuente)) return "Abrir menú";
        if (/anterior|prev/.test(fuente)) return "Anterior";
        if (/siguiente|next/.test(fuente)) return "Siguiente";
        if (/reproduc|play/.test(fuente)) return "Reproducir";
        if (/pausa|pause/.test(fuente)) return "Pausar";
        if (/buscar|search/.test(fuente)) return "Buscar";
        if (/limpiar|clear/.test(fuente)) return "Limpiar";
        return "";
    }

    function esFavoritoActivo(el) {
        const clases = typeof el.className === "string" ? el.className.toLowerCase() : "";
        const datos = String(el.getAttribute("data-favorito") || el.getAttribute("data-favorite") || "").toLowerCase();
        return /activo|active|guardado|seleccionado/.test(clases) || datos === "true" || datos === "1";
    }

    function actualizarFavorito(el) {
        if (!el || !/favorit/.test(fuenteIdentificadora(el))) return;
        const activo = esFavoritoActivo(el);
        el.setAttribute("aria-pressed", activo ? "true" : "false");
        el.setAttribute("aria-label", activo ? "Quitar de favoritos" : "Agregar a favoritos");

        if (!el.dataset.a11yFavoritoListo) {
            el.dataset.a11yFavoritoListo = "1";
            el.addEventListener("click", function () {
                window.setTimeout(function () {
                    actualizarFavorito(el);
                    anunciar(esFavoritoActivo(el) ? "Añadido a favoritos" : "Eliminado de favoritos");
                }, 0);
            });
        }
    }

    function prepararControl(el) {
        if (!(el instanceof Element)) return;

        const esNativo = el.matches("button, a[href], input, select, textarea, summary");
        const tieneClick = el.hasAttribute("onclick") || el.matches(
            ".categoria-card, [data-action], [data-accion], [data-opcion], .a11y-interactivo"
        );

        if (!esNativo && tieneClick) {
            if (!el.hasAttribute("role")) el.setAttribute("role", "button");
            if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
            el.classList.add("a11y-clickable");

            if (!el.dataset.a11yTecladoListo) {
                el.dataset.a11yTecladoListo = "1";
                el.addEventListener("keydown", function (evento) {
                    if (evento.key === "Enter" || evento.key === " ") {
                        evento.preventDefault();
                        el.click();
                    }
                });
            }
        }

        if (el.matches("button, [role='button']")) {
            const texto = textoVisible(el);
            const pareceSoloIcono = !texto || SIMBOLOS_SIN_NOMBRE.has(texto) || texto.length <= 2;
            if (pareceSoloIcono) el.classList.add("a11y-icon-control");

            if (!tieneNombreAccesible(el)) {
                const sugerida = etiquetaSugerida(el);
                if (sugerida) el.setAttribute("aria-label", sugerida);
            }
        }

        actualizarFavorito(el);
    }

    function tieneLabelVisible(campo) {
        if (!campo) return false;
        if (campo.id) {
            const labels = document.getElementsByTagName("label");
            for (const label of labels) {
                if (label.htmlFor === campo.id) return true;
            }
        }
        return !!campo.closest("label");
    }

    function prepararCampo(campo) {
        if (!(campo instanceof Element) || !campo.matches("input, select, textarea")) return;
        if (campo.getAttribute("aria-label") || campo.getAttribute("aria-labelledby") || tieneLabelVisible(campo)) return;

        const etiqueta = String(
            campo.getAttribute("placeholder") ||
            campo.getAttribute("title") ||
            campo.getAttribute("name") ||
            ""
        ).replace(/[-_]+/g, " ").trim();

        if (etiqueta) campo.setAttribute("aria-label", etiqueta);
    }

    function prepararIframe(iframe) {
        if (!(iframe instanceof Element) || !iframe.matches("iframe")) return;
        if (String(iframe.getAttribute("title") || "").trim()) return;

        const src = String(iframe.getAttribute("src") || iframe.getAttribute("data-src") || "").toLowerCase();
        if (src.includes("youtube.com") || src.includes("youtu.be")) {
            iframe.setAttribute("title", "Video en Lengua de Señas Peruana");
        } else if (src.includes("docs.google.com/forms")) {
            iframe.setAttribute("title", "Formulario de LSPedia");
        } else {
            iframe.setAttribute("title", "Contenido integrado de LSPedia");
        }
    }

    function prepararVideo(video) {
        if (!(video instanceof Element) || !video.matches("video")) return;
        if (!video.getAttribute("aria-label") && !video.getAttribute("aria-labelledby")) {
            video.setAttribute("aria-label", "Video de LSPedia");
        }
    }

    function prepararRegionesVivas(raiz) {
        if (!(raiz instanceof Element || raiz instanceof Document)) return;

        const resultados = raiz.querySelectorAll(
            "[id*='resultado' i], [class*='resultados' i], [id*='sugerencia' i], [class*='sugerencias' i]"
        );
        resultados.forEach(function (el) {
            if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
            if (!el.hasAttribute("aria-atomic")) el.setAttribute("aria-atomic", "false");
        });

        const feedback = raiz.querySelectorAll(
            "[class*='feedback' i], [id*='feedback' i], [class*='mensaje' i], [id*='mensaje' i]"
        );
        feedback.forEach(function (el) {
            if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
            if (!el.hasAttribute("role")) el.setAttribute("role", "status");
        });
    }

    function prepararDialogo(dialogo) {
        if (!(dialogo instanceof Element)) return;
        if (!dialogo.matches(".modal, [role='dialog']")) return;

        if (!dialogo.hasAttribute("role")) dialogo.setAttribute("role", "dialog");
        dialogo.setAttribute("aria-modal", "true");

        if (!dialogo.getAttribute("aria-labelledby")) {
            const titulo = dialogo.querySelector(".modal-title, .dialog-title, h1, h2, h3");
            if (titulo) {
                if (!titulo.id) titulo.id = "a11y-dialog-title-" + Math.random().toString(36).slice(2, 9);
                dialogo.setAttribute("aria-labelledby", titulo.id);
            }
        }
    }

    function prepararNavegacion() {
        const navs = document.querySelectorAll("nav");
        navs.forEach(function (nav, indice) {
            if (!nav.getAttribute("aria-label") && !nav.getAttribute("aria-labelledby")) {
                nav.setAttribute("aria-label", indice === 0 ? "Navegación principal" : "Navegación de LSPedia");
            }
        });
    }

    function prepararSaltoContenido() {
        if (document.getElementById("a11ySaltarContenido")) return;
        const principal = document.querySelector("main, #contenidoPrincipal, #mainContent, [role='main']");
        if (!principal) return;

        if (!principal.id) principal.id = "contenidoPrincipalLSPedia";
        if (!principal.hasAttribute("tabindex")) principal.setAttribute("tabindex", "-1");

        const enlace = document.createElement("a");
        enlace.id = "a11ySaltarContenido";
        enlace.className = "a11y-skip-link";
        enlace.href = "#" + principal.id;
        enlace.textContent = "Saltar al contenido principal";
        document.body.insertBefore(enlace, document.body.firstChild);
    }

    function crearRegionesAnuncio() {
        if (!document.getElementById("lspediaA11yStatus")) {
            regionEstado = document.createElement("div");
            regionEstado.id = "lspediaA11yStatus";
            regionEstado.className = "a11y-sr-only";
            regionEstado.setAttribute("role", "status");
            regionEstado.setAttribute("aria-live", "polite");
            regionEstado.setAttribute("aria-atomic", "true");
            document.body.appendChild(regionEstado);
        } else {
            regionEstado = document.getElementById("lspediaA11yStatus");
        }

        if (!document.getElementById("lspediaA11yAlert")) {
            regionAlerta = document.createElement("div");
            regionAlerta.id = "lspediaA11yAlert";
            regionAlerta.className = "a11y-sr-only";
            regionAlerta.setAttribute("role", "alert");
            regionAlerta.setAttribute("aria-live", "assertive");
            regionAlerta.setAttribute("aria-atomic", "true");
            document.body.appendChild(regionAlerta);
        } else {
            regionAlerta = document.getElementById("lspediaA11yAlert");
        }
    }

    function escribirRegion(region, mensaje) {
        if (!region || !mensaje) return;
        region.textContent = "";
        window.setTimeout(function () {
            region.textContent = String(mensaje);
        }, 20);
    }

    function anunciar(mensaje) {
        escribirRegion(regionEstado, mensaje);
    }

    function alertar(mensaje) {
        escribirRegion(regionAlerta, mensaje);
    }

    function prepararArbol(raiz) {
        if (!(raiz instanceof Element || raiz instanceof Document)) return;

        if (raiz instanceof Element) {
            prepararControl(raiz);
            prepararCampo(raiz);
            prepararIframe(raiz);
            prepararVideo(raiz);
            prepararDialogo(raiz);
        }

        raiz.querySelectorAll("button, [role='button'], [onclick], .categoria-card, [data-action], [data-accion], [data-opcion]")
            .forEach(prepararControl);
        raiz.querySelectorAll("input, select, textarea").forEach(prepararCampo);
        raiz.querySelectorAll("iframe").forEach(prepararIframe);
        raiz.querySelectorAll("video").forEach(prepararVideo);
        raiz.querySelectorAll(".modal, [role='dialog']").forEach(prepararDialogo);
        prepararRegionesVivas(raiz);
    }

    function elementosEnDialogo(dialogo) {
        return Array.from(dialogo.querySelectorAll(SELECTOR_INTERACTIVO)).filter(function (el) {
            return !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true" && el.getClientRects().length > 0;
        });
    }

    function enfocarDialogo(dialogo) {
        const elementos = elementosEnDialogo(dialogo);
        const destino = dialogo.querySelector("[autofocus]") || elementos[0] || dialogo;
        if (destino === dialogo && !dialogo.hasAttribute("tabindex")) dialogo.setAttribute("tabindex", "-1");
        window.setTimeout(function () {
            try { destino.focus({ preventScroll: true }); } catch (_) { destino.focus(); }
        }, 30);
    }

    function instalarModales() {
        document.addEventListener("show.bs.modal", function (evento) {
            ultimoDisparadorModal = evento.relatedTarget || document.activeElement;
            prepararDialogo(evento.target);
        });

        document.addEventListener("shown.bs.modal", function (evento) {
            enfocarDialogo(evento.target);
        });

        document.addEventListener("hidden.bs.modal", function () {
            const destino = ultimoDisparadorModal;
            ultimoDisparadorModal = null;
            if (destino && document.contains(destino) && typeof destino.focus === "function") {
                window.setTimeout(function () {
                    try { destino.focus({ preventScroll: true }); } catch (_) { destino.focus(); }
                }, 20);
            }
        });

        document.addEventListener("keydown", function (evento) {
            if (evento.key !== "Tab") return;
            const dialogo = document.querySelector("[role='dialog']:not(.modal)[aria-modal='true']:not([aria-hidden='true'])");
            if (!dialogo || dialogo.getClientRects().length === 0) return;

            const elementos = elementosEnDialogo(dialogo);
            if (!elementos.length) {
                evento.preventDefault();
                dialogo.focus();
                return;
            }

            const primero = elementos[0];
            const ultimo = elementos[elementos.length - 1];
            if (evento.shiftKey && document.activeElement === primero) {
                evento.preventDefault();
                ultimo.focus();
            } else if (!evento.shiftKey && document.activeElement === ultimo) {
                evento.preventDefault();
                primero.focus();
            }
        });
    }

    function instalarObservador() {
        const observador = new MutationObserver(function (cambios) {
            cambios.forEach(function (cambio) {
                if (cambio.type === "childList") {
                    cambio.addedNodes.forEach(function (nodo) {
                        if (nodo.nodeType === Node.ELEMENT_NODE) prepararArbol(nodo);
                    });
                } else if (cambio.type === "attributes") {
                    const el = cambio.target;
                    prepararControl(el);
                    if (el.matches && el.matches("iframe")) prepararIframe(el);
                }
            });
        });

        observador.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["class", "src", "data-src", "title", "data-favorito", "data-favorite"]
        });
    }

    function instalarEventosPublicos() {
        window.LSPediaA11y = Object.assign(window.LSPediaA11y || {}, {
            anunciar: anunciar,
            alertar: alertar,
            preparar: prepararArbol
        });

        document.addEventListener("lspedia:a11y-anunciar", function (evento) {
            if (evento.detail) anunciar(evento.detail.mensaje || evento.detail);
        });

        document.addEventListener("lspedia:a11y-alertar", function (evento) {
            if (evento.detail) alertar(evento.detail.mensaje || evento.detail);
        });
    }

    function iniciar() {
        crearRegionesAnuncio();
        prepararArbol(document);
        prepararNavegacion();
        prepararSaltoContenido();
        instalarModales();
        instalarObservador();
        instalarEventosPublicos();
        document.documentElement.classList.add("a11y-ready");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
