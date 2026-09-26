/* ============================================================
   LSPedia - fullscreen real y estable para móviles/tablets
   ------------------------------------------------------------
   En pantallas táctiles usamos la API nativa de fullscreen del navegador.
   Esto evita que el reproductor parezca una tarjeta flotante dentro de la
   página y mantiene el iframe de YouTube en el mismo contenedor, por lo que
   no se reinicia el video.

   Los controles personalizados se mueven temporalmente DENTRO del wrapper
   antes de entrar a fullscreen (el iframe no cambia de padre). Android puede
   salir con su botón Atrás; fullscreenchange restaura automáticamente todo.
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
    let cerrando = false;
    let temporizadorControles = null;

    function mostrarControles() {
        if (!estado) return;
        estado.wrap.classList.remove('lsp-controles-ocultos');
        window.clearTimeout(temporizadorControles);
        if (window.matchMedia('(orientation: landscape)').matches) {
            temporizadorControles = window.setTimeout(function () {
                if (estado) estado.wrap.classList.add('lsp-controles-ocultos');
            }, 3500);
        }
    }

    function elementoFullscreenActual() {
        return document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement ||
            null;
    }

    function restaurarAtributoStyle(elemento, valorOriginal) {
        if (!elemento) return;
        if (valorOriginal === null) elemento.removeAttribute('style');
        else elemento.setAttribute('style', valorOriginal);
    }

    function restaurarVisual() {
        if (!estado || cerrando) return;
        cerrando = true;
        const {
            wrap,
            controles,
            btn,
            marcadorControles,
            styleWrap,
            styleControles,
            styleBtn,
            interceptarCierre
        } = estado;

        window.clearTimeout(temporizadorControles);
        window.removeEventListener('orientationchange', mostrarControles);
        window.removeEventListener('resize', mostrarControles);
        wrap.classList.remove('lsp-controles-ocultos');
        if (estado.botonGirar) estado.botonGirar.remove();
        if (estado.capaMostrar) estado.capaMostrar.remove();
        if (estado.mostrarAlTocar) wrap.removeEventListener('click', estado.mostrarAlTocar, true);
        if (screen.orientation && screen.orientation.unlock) {
            try { screen.orientation.unlock(); } catch (_error) {}
        }

        if (btn && interceptarCierre) {
            btn.removeEventListener('click', interceptarCierre, true);
        }

        wrap.classList.remove('video-palabra-pantalla-completa');
        wrap.classList.remove('video-palabra-pantalla-completa-fallback');

        if (controles) {
            controles.classList.remove('video-palabra-controles-pantalla-completa');
            if (marcadorControles && marcadorControles.parentNode) {
                marcadorControles.parentNode.insertBefore(controles, marcadorControles);
                marcadorControles.remove();
            }
        }

        restaurarAtributoStyle(wrap, styleWrap);
        restaurarAtributoStyle(controles, styleControles);
        document.body.classList.remove('video-palabra-pantalla-completa-activa');

        if (btn) {
            btn.classList.remove('lsp-fullscreen-cerrar-rojo');
            restaurarAtributoStyle(btn, styleBtn);
            btn.textContent = '⛶';
            btn.setAttribute('aria-label', 'Ver en pantalla completa');
            btn.setAttribute('title', 'Ver en pantalla completa');
        }

        estado = null;
        window.setTimeout(function () { cerrando = false; }, 80);
    }

    function salirFullscreenNativo() {
        if (!elementoFullscreenActual()) {
            restaurarVisual();
            return;
        }

        const salir = document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.msExitFullscreen;

        if (!salir) {
            restaurarVisual();
            return;
        }

        try {
            const resultado = salir.call(document);
            if (resultado && typeof resultado.catch === 'function') {
                resultado.catch(function () { restaurarVisual(); });
            }
        } catch (_error) {
            restaurarVisual();
        }
    }

    function abrirFullscreenNativo(wrapId, btnId) {
        const wrap = document.getElementById(wrapId);
        const btn = document.getElementById(btnId);
        if (!wrap || cerrando) return;

        if (estado) {
            salirFullscreenNativo();
            return;
        }

        const hermano = wrap.nextElementSibling;
        const controles = hermano && hermano.classList.contains('controles-video')
            ? hermano
            : null;

        const marcadorControles = controles
            ? document.createComment('lspedia-controles-video-origen')
            : null;

        const styleWrap = wrap.getAttribute('style');
        const styleControles = controles ? controles.getAttribute('style') : null;
        const styleBtn = btn ? btn.getAttribute('style') : null;

        if (controles && controles.parentNode && marcadorControles) {
            controles.parentNode.insertBefore(marcadorControles, controles);
            wrap.appendChild(controles);
            controles.classList.add('video-palabra-controles-pantalla-completa');
        }

        wrap.classList.add('video-palabra-pantalla-completa');
        document.body.classList.add('video-palabra-pantalla-completa-activa');

        let interceptarCierre = null;
        if (btn) {
            btn.textContent = '✕';
            btn.setAttribute('aria-label', 'Salir de pantalla completa');
            btn.setAttribute('title', 'Salir de pantalla completa');
            btn.classList.add('lsp-fullscreen-cerrar-rojo');
            btn.style.setProperty('background', '#ef2b2d', 'important');
            btn.style.setProperty('background-image', 'none', 'important');
            btn.style.setProperty('border-color', '#d71920', 'important');
            btn.style.setProperty('color', '#ffffff', 'important');
            btn.style.setProperty('box-shadow', '0 6px 16px rgba(220,38,38,.35)', 'important');

            interceptarCierre = function (evento) {
                if (!estado || estado.btn !== btn) return;
                evento.preventDefault();
                evento.stopPropagation();
                if (typeof evento.stopImmediatePropagation === 'function') {
                    evento.stopImmediatePropagation();
                }
                salirFullscreenNativo();
            };
            btn.addEventListener('click', interceptarCierre, true);
        }

        estado = {
            wrap,
            controles,
            btn,
            marcadorControles,
            styleWrap,
            styleControles,
            styleBtn,
            interceptarCierre
        };

        if (controles && btn) {
            const botonGirar = document.createElement('button');
            botonGirar.type = 'button';
            botonGirar.className = 'btn lsp-video-girar';
            botonGirar.textContent = '↻ Horizontal';
            botonGirar.title = 'Abrir video en horizontal';
            botonGirar.setAttribute('aria-label', 'Abrir video en horizontal');
            controles.insertBefore(botonGirar, btn);
            botonGirar.addEventListener('click', async function () {
                mostrarControles();
                if (screen.orientation && screen.orientation.lock) {
                    try { await screen.orientation.lock('landscape'); mostrarControles(); return; }
                    catch (_error) { /* Algunos navegadores no permiten bloquear el giro. */ }
                }
                botonGirar.textContent = '↻ Gira el celular';
            });
            estado.botonGirar = botonGirar;
        }
        // Los toques dentro del iframe de YouTube no llegan al documento padre.
        // Solo mientras los controles están ocultos, esta capa recibe el primer
        // toque en toda la pantalla. Al mostrarlos, la línea de tiempo vuelve
        // a recibir los gestos directamente.
        const capaMostrar = document.createElement('button');
        capaMostrar.type = 'button';
        capaMostrar.className = 'lsp-video-mostrar-controles';
        capaMostrar.setAttribute('aria-label', 'Mostrar controles del video');
        wrap.appendChild(capaMostrar);
        estado.capaMostrar = capaMostrar;

        estado.mostrarAlTocar = function (evento) {
            if (wrap.classList.contains('lsp-controles-ocultos')) {
                evento.preventDefault();
                evento.stopPropagation();
                mostrarControles();
            } else {
                mostrarControles();
            }
        };
        wrap.addEventListener('click', estado.mostrarAlTocar, true);
        window.addEventListener('orientationchange', mostrarControles);
        window.addEventListener('resize', mostrarControles);
        mostrarControles();

        const solicitar = wrap.requestFullscreen ||
            wrap.webkitRequestFullscreen ||
            wrap.msRequestFullscreen;

        if (!solicitar) {
            console.warn('[LSPedia] Este navegador no ofrece fullscreen nativo para el reproductor.');
            restaurarVisual();
            return;
        }

        try {
            let resultado;
            if (wrap.requestFullscreen) {
                resultado = wrap.requestFullscreen({ navigationUI: 'hide' });
            } else {
                resultado = solicitar.call(wrap);
            }

            if (resultado && typeof resultado.catch === 'function') {
                resultado.catch(function (error) {
                    console.warn('[LSPedia] No se pudo abrir fullscreen nativo:', error);
                    restaurarVisual();
                });
            }
        } catch (error) {
            console.warn('[LSPedia] No se pudo abrir fullscreen nativo:', error);
            restaurarVisual();
        }
    }

    function alCambiarFullscreen() {
        if (!estado) return;
        const actual = elementoFullscreenActual();
        if (!actual || actual !== estado.wrap) {
            restaurarVisual();
        } else {
            mostrarControles();
        }
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
                salirFullscreenNativo();
                return;
            }

            abrirFullscreenNativo(wrapId, btnId);
        };

        window.cerrarPantallaCompletaVideoPalabra = function () {
            if (esPantallaTactil() && estado) {
                salirFullscreenNativo();
                return;
            }
            if (cerrarOriginal) return cerrarOriginal.apply(this, arguments);
        };

        document.addEventListener('fullscreenchange', alCambiarFullscreen, true);
        document.addEventListener('webkitfullscreenchange', alCambiarFullscreen, true);
        document.addEventListener('MSFullscreenChange', alCambiarFullscreen, true);

        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape' && estado) salirFullscreenNativo();
        });

        window.addEventListener('pagehide', function () {
            if (estado) restaurarVisual();
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
