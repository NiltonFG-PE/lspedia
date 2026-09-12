/* ============================================================
   LSPedia - fullscreen visual estable para móviles/tablets
   ------------------------------------------------------------
   En pantallas táctiles no usa requestFullscreen(), porque Chrome/Android
   muestra un aviso propio que puede tapar los controles.

   IMPORTANTE:
   - El iframe de YouTube NO se mueve de su contenedor original. Mover un
     iframe entre padres puede reiniciar el video en algunos navegadores.
   - Se neutralizan temporalmente transform/overflow/contain de los ancestros
     para que position:fixed pueda ocupar realmente toda la ventana.
   - El botón de salida intercepta el clic en fase de captura, evitando que el
     listener normal de fullscreen se ejecute otra vez al tocar la X.
   - Al abrir el fullscreen se crea una entrada temporal en history. Así el
     botón Atrás del celular cierra primero el fullscreen sin salir de la ficha.
   ============================================================ */
(function () {
    'use strict';

    const CLAVE_HISTORIAL_FULLSCREEN = '__lspediaVideoFullscreen';
    const CLAVE_HISTORIAL_WRAP = '__lspediaVideoFullscreenWrap';

    function esPantallaTactil() {
        return window.matchMedia('(pointer: coarse)').matches ||
            Number(navigator.maxTouchPoints || 0) > 0 ||
            'ontouchstart' in window;
    }

    if (!esPantallaTactil()) return;

    let instalado = false;
    let estado = null;
    let toggleOriginal = null;
    let cerrarOriginal = null;
    let cerrando = false;

    function restaurarAtributoStyle(elemento, valorOriginal) {
        if (!elemento) return;
        if (valorOriginal === null) elemento.removeAttribute('style');
        else elemento.setAttribute('style', valorOriginal);
    }

    function prepararAncestros(wrap) {
        const lista = [];
        let actual = wrap.parentElement;

        while (actual && actual !== document.documentElement) {
            lista.push({
                elemento: actual,
                styleOriginal: actual.getAttribute('style')
            });

            actual.style.setProperty('transform', 'none', 'important');
            actual.style.setProperty('filter', 'none', 'important');
            actual.style.setProperty('perspective', 'none', 'important');
            actual.style.setProperty('backdrop-filter', 'none', 'important');
            actual.style.setProperty('contain', 'none', 'important');
            actual.style.setProperty('clip-path', 'none', 'important');
            actual.style.setProperty('overflow', 'visible', 'important');
            actual.style.setProperty('overflow-x', 'visible', 'important');
            actual.style.setProperty('overflow-y', 'visible', 'important');

            actual = actual.parentElement;
        }

        return lista;
    }

    function restaurarAncestros(ancestros) {
        if (!Array.isArray(ancestros)) return;
        [...ancestros].reverse().forEach(item => {
            if (!item || !item.elemento) return;
            restaurarAtributoStyle(item.elemento, item.styleOriginal);
        });
    }

    function crearEntradaHistorialFullscreen(wrapId) {
        try {
            const actual = history.state && typeof history.state === 'object'
                ? history.state
                : {};
            const token = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
            history.pushState({
                ...actual,
                [CLAVE_HISTORIAL_FULLSCREEN]: token,
                [CLAVE_HISTORIAL_WRAP]: wrapId
            }, '', window.location.href);
            return token;
        } catch (error) {
            console.warn('[LSPedia] No se pudo crear la entrada temporal de fullscreen:', error);
            return null;
        }
    }

    function limpiarMarcadorHistorialActual(token) {
        if (!token) return;
        try {
            const actual = history.state;
            if (!actual || typeof actual !== 'object' || actual[CLAVE_HISTORIAL_FULLSCREEN] !== token) return;
            const limpio = { ...actual };
            delete limpio[CLAVE_HISTORIAL_FULLSCREEN];
            delete limpio[CLAVE_HISTORIAL_WRAP];
            history.replaceState(limpio, '', window.location.href);
        } catch (_error) {}
    }

    function cerrarVisual(opciones = {}) {
        if (!estado || cerrando) return;
        cerrando = true;

        const desdeHistorial = opciones.desdeHistorial === true;
        const {
            wrap,
            iframe,
            controles,
            btn,
            marcadorControles,
            styleWrap,
            styleIframe,
            styleControles,
            styleBtn,
            ancestros,
            interceptarCierre,
            tokenHistorial
        } = estado;

        if (btn && interceptarCierre) {
            btn.removeEventListener('click', interceptarCierre, true);
        }

        wrap.classList.remove('video-palabra-pantalla-completa');
        wrap.classList.remove('video-palabra-pantalla-completa-fallback');
        if (controles) controles.classList.remove('video-palabra-controles-pantalla-completa');

        // Solo la barra de controles vuelve a su posición original. El iframe
        // nunca cambia de padre, por lo que conserva tiempo y reproducción.
        if (controles && marcadorControles && marcadorControles.parentNode) {
            marcadorControles.parentNode.insertBefore(controles, marcadorControles);
            marcadorControles.remove();
        }

        restaurarAtributoStyle(wrap, styleWrap);
        restaurarAtributoStyle(iframe, styleIframe);
        restaurarAtributoStyle(controles, styleControles);
        restaurarAncestros(ancestros);

        document.body.classList.remove('video-palabra-pantalla-completa-activa');

        if (btn) {
            btn.classList.remove('lsp-fullscreen-cerrar-rojo');
            restaurarAtributoStyle(btn, styleBtn);
            btn.textContent = '⛶';
            btn.setAttribute('aria-label', 'Ver en pantalla completa');
            btn.setAttribute('title', 'Ver en pantalla completa');
        }

        // Si el cierre fue programático y seguimos en la entrada temporal,
        // quitamos su marca para no dejar un estado de fullscreen fantasma.
        // Cuando el cierre viene del botón Atrás, el navegador ya hizo pop.
        if (!desdeHistorial) limpiarMarcadorHistorialActual(tokenHistorial);

        estado = null;
        window.setTimeout(() => { cerrando = false; }, 60);
    }

    function solicitarCierreConHistorial() {
        if (!estado || cerrando) return;

        const token = estado.tokenHistorial;
        const actual = history.state;
        const entradaTemporalActiva = !!(
            token &&
            actual &&
            typeof actual === 'object' &&
            actual[CLAVE_HISTORIAL_FULLSCREEN] === token
        );

        if (entradaTemporalActiva) {
            // El popstate en captura cerrará el fullscreen y bloqueará el
            // router general de LSPedia para que la ficha/video no se reinicie.
            history.back();
            return;
        }

        cerrarVisual();
    }

    function abrirVisual(wrapId, btnId) {
        const wrap = document.getElementById(wrapId);
        const btn = document.getElementById(btnId);
        if (!wrap || cerrando) return;

        if (estado) cerrarVisual();
        if (cerrando) return;

        const iframe = wrap.querySelector('iframe');
        const hermano = wrap.nextElementSibling;
        const controles = hermano && hermano.classList.contains('controles-video')
            ? hermano
            : null;

        const marcadorControles = controles
            ? document.createComment('lspedia-controles-video-origen')
            : null;

        const styleWrap = wrap.getAttribute('style');
        const styleIframe = iframe ? iframe.getAttribute('style') : null;
        const styleControles = controles ? controles.getAttribute('style') : null;
        const styleBtn = btn ? btn.getAttribute('style') : null;
        const ancestros = prepararAncestros(wrap);

        if (controles && controles.parentNode && marcadorControles) {
            controles.parentNode.insertBefore(marcadorControles, controles);
            wrap.appendChild(controles);
            controles.classList.add('video-palabra-controles-pantalla-completa');
        }

        wrap.classList.add('video-palabra-pantalla-completa');
        wrap.classList.add('video-palabra-pantalla-completa-fallback');
        document.body.classList.add('video-palabra-pantalla-completa-activa');

        Object.assign(wrap.style, {
            position: 'fixed',
            inset: '0',
            width: '100vw',
            height: '100dvh',
            maxWidth: 'none',
            maxHeight: 'none',
            margin: '0',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'stretch',
            overflow: 'hidden',
            background: '#000',
            border: '0',
            borderRadius: '0',
            zIndex: '2147483000'
        });

        if (iframe) {
            Object.assign(iframe.style, {
                position: 'relative',
                inset: 'auto',
                display: 'block',
                flex: '1 1 0',
                width: '100%',
                height: '100%',
                minWidth: '0',
                minHeight: '0',
                maxWidth: 'none',
                maxHeight: 'none',
                margin: '0',
                border: '0',
                borderRadius: '0',
                background: '#000'
            });
        }

        if (controles) {
            Object.assign(controles.style, {
                position: 'relative',
                inset: 'auto',
                left: 'auto',
                right: 'auto',
                top: 'auto',
                bottom: 'auto',
                flex: '0 0 auto',
                width: '100%',
                maxWidth: 'none',
                margin: '0',
                transform: 'none',
                zIndex: '2147483646'
            });
        }

        let interceptarCierre = null;

        if (btn) {
            btn.textContent = '✕';
            btn.setAttribute('aria-label', 'Salir de pantalla completa');
            btn.setAttribute('title', 'Salir de pantalla completa');
            btn.classList.add('lsp-fullscreen-cerrar-rojo');

            btn.style.setProperty('background', '#dc2626', 'important');
            btn.style.setProperty('background-image', 'none', 'important');
            btn.style.setProperty('border-color', '#b91c1c', 'important');
            btn.style.setProperty('color', '#ffffff', 'important');
            btn.style.setProperty('box-shadow', '0 6px 16px rgba(220,38,38,.35)', 'important');

            interceptarCierre = function (evento) {
                if (!estado || estado.btn !== btn) return;
                evento.preventDefault();
                evento.stopPropagation();
                if (typeof evento.stopImmediatePropagation === 'function') {
                    evento.stopImmediatePropagation();
                }
                solicitarCierreConHistorial();
            };
            btn.addEventListener('click', interceptarCierre, true);
        }

        const tokenHistorial = crearEntradaHistorialFullscreen(wrapId);

        estado = {
            wrap,
            iframe,
            controles,
            btn,
            marcadorControles,
            styleWrap,
            styleIframe,
            styleControles,
            styleBtn,
            ancestros,
            interceptarCierre,
            tokenHistorial
        };
    }

    function instalarParche() {
        if (instalado) return true;
        if (typeof window.toggleVideoPalabraPantallaCompleta !== 'function') return false;

        toggleOriginal = window.toggleVideoPalabraPantallaCompleta;
        cerrarOriginal = typeof window.cerrarPantallaCompletaVideoPalabra === 'function'
            ? window.cerrarPantallaCompletaVideoPalabra
            : null;

        window.toggleVideoPalabraPantallaCompleta = function (wrapId, btnId, forzarCerrar) {
            if (!esPantallaTactil()) {
                return toggleOriginal.apply(this, arguments);
            }

            const mismo = estado && estado.wrap && estado.wrap.id === wrapId;
            if (forzarCerrar === true) {
                cerrarVisual();
                return;
            }
            if (mismo) {
                solicitarCierreConHistorial();
                return;
            }

            abrirVisual(wrapId, btnId);
        };

        window.cerrarPantallaCompletaVideoPalabra = function () {
            if (esPantallaTactil()) {
                cerrarVisual();
                return;
            }
            if (cerrarOriginal) return cerrarOriginal.apply(this, arguments);
        };

        // Se registra en CAPTURA para ejecutarse antes que el popstate general
        // de LSPedia. Así Atrás solo cierra el fullscreen y no reconstruye la
        // ficha, evitando reinicios del video o navegación inesperada.
        window.addEventListener('popstate', function (evento) {
            if (!estado) {
                // Si el usuario vuelve hacia delante a una entrada temporal vieja,
                // limpiamos la marca para que no quede un estado fantasma.
                if (evento.state && evento.state[CLAVE_HISTORIAL_FULLSCREEN]) {
                    const limpio = { ...evento.state };
                    delete limpio[CLAVE_HISTORIAL_FULLSCREEN];
                    delete limpio[CLAVE_HISTORIAL_WRAP];
                    try { history.replaceState(limpio, '', window.location.href); } catch (_error) {}
                }
                return;
            }

            evento.preventDefault();
            evento.stopPropagation();
            if (typeof evento.stopImmediatePropagation === 'function') {
                evento.stopImmediatePropagation();
            }
            cerrarVisual({ desdeHistorial: true });
        }, true);

        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape' && estado) solicitarCierreConHistorial();
        });

        window.addEventListener('pagehide', function () {
            if (estado) cerrarVisual();
        });

        instalado = true;
        return true;
    }

    if (instalarParche()) return;

    let intentos = 0;
    const temporizador = window.setInterval(function () {
        intentos += 1;
        if (instalarParche() || intentos >= 200) {
            window.clearInterval(temporizador);
        }
    }, 50);
})();