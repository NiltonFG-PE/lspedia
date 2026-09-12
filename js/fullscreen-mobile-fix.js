/* ============================================================
   LSPedia - fullscreen visual estable para móviles/tablets
   ------------------------------------------------------------
   En pantallas táctiles no usa requestFullscreen(), porque Chrome/Android
   muestra un aviso propio que puede tapar los controles. En su lugar,
   mueve temporalmente el reproductor al <body> para evitar que contenedores
   con transform/overflow lo recorten u oculten.
   ============================================================ */
(function () {
    'use strict';

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

    function restaurarAtributoStyle(elemento, valorOriginal) {
        if (!elemento) return;
        if (valorOriginal === null) elemento.removeAttribute('style');
        else elemento.setAttribute('style', valorOriginal);
    }

    function cerrarVisual() {
        if (!estado) return;

        const {
            wrap,
            iframe,
            controles,
            btn,
            marcadorWrap,
            marcadorControles,
            styleWrap,
            styleIframe,
            styleControles
        } = estado;

        wrap.classList.remove('video-palabra-pantalla-completa');
        wrap.classList.remove('video-palabra-pantalla-completa-fallback');
        if (controles) controles.classList.remove('video-palabra-controles-pantalla-completa');

        // Primero devolvemos el reproductor a su sitio y luego la barra de controles.
        if (marcadorWrap && marcadorWrap.parentNode) {
            marcadorWrap.parentNode.insertBefore(wrap, marcadorWrap);
            marcadorWrap.remove();
        }

        if (controles && marcadorControles && marcadorControles.parentNode) {
            marcadorControles.parentNode.insertBefore(controles, marcadorControles);
            marcadorControles.remove();
        }

        restaurarAtributoStyle(wrap, styleWrap);
        restaurarAtributoStyle(iframe, styleIframe);
        restaurarAtributoStyle(controles, styleControles);

        document.body.classList.remove('video-palabra-pantalla-completa-activa');

        if (btn) {
            btn.textContent = '⛶';
            btn.setAttribute('aria-label', 'Ver en pantalla completa');
            btn.setAttribute('title', 'Ver en pantalla completa');
        }

        estado = null;
    }

    function abrirVisual(wrapId, btnId) {
        const wrap = document.getElementById(wrapId);
        const btn = document.getElementById(btnId);
        if (!wrap) return;

        if (estado) cerrarVisual();

        const iframe = wrap.querySelector('iframe');
        const hermano = wrap.nextElementSibling;
        const controles = hermano && hermano.classList.contains('controles-video')
            ? hermano
            : null;

        const marcadorWrap = document.createComment('lspedia-video-wrap-origen');
        const marcadorControles = controles
            ? document.createComment('lspedia-controles-video-origen')
            : null;

        const styleWrap = wrap.getAttribute('style');
        const styleIframe = iframe ? iframe.getAttribute('style') : null;
        const styleControles = controles ? controles.getAttribute('style') : null;

        // Marcamos la posición original antes de mover nada.
        if (wrap.parentNode) wrap.parentNode.insertBefore(marcadorWrap, wrap);
        if (controles && controles.parentNode && marcadorControles) {
            controles.parentNode.insertBefore(marcadorControles, controles);
            wrap.appendChild(controles);
            controles.classList.add('video-palabra-controles-pantalla-completa');
        }

        // La clave de esta corrección: sacar el wrapper de cualquier tarjeta,
        // grid o contenedor animado que pueda recortar position:fixed.
        document.body.appendChild(wrap);

        wrap.classList.add('video-palabra-pantalla-completa');
        wrap.classList.add('video-palabra-pantalla-completa-fallback');
        document.body.classList.add('video-palabra-pantalla-completa-activa');

        // Respaldo inline para que el fullscreen visual sea estable incluso si
        // alguna regla CSS antigua tiene mayor especificidad.
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

        if (btn) {
            btn.textContent = '✕';
            btn.setAttribute('aria-label', 'Salir de pantalla completa');
            btn.setAttribute('title', 'Salir de pantalla completa');
        }

        estado = {
            wrap,
            iframe,
            controles,
            btn,
            marcadorWrap,
            marcadorControles,
            styleWrap,
            styleIframe,
            styleControles
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
            if (forzarCerrar === true || mismo) {
                cerrarVisual();
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

        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape' && estado) cerrarVisual();
        });

        window.addEventListener('pagehide', cerrarVisual);
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
