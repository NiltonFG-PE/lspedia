/* ============================================================
   LSPedia - Control visible para instalar la PWA
   ------------------------------------------------------------
   - En Android muestra un botón acorde con la identidad visual de LSPedia.
   - En Chromium usa beforeinstallprompt cuando está disponible.
   - Si el navegador no expone el prompt, muestra una instrucción breve.
   - Se oculta dentro de la app instalada (display-mode: standalone).
   - No se habilita en copias públicas de otro dominio.
   ============================================================ */
(function () {
    'use strict';

    const ID_CONTENEDOR = 'lspPwaInstalar';
    const CLAVE_INSTALADA = 'lspedia_pwa_instalada_v1';
    const CLAVE_OCULTA_SESION = 'lspedia_pwa_instalar_oculta_sesion';
    let eventoInstalacion = null;

    function permitido() {
        try {
            return !window.LSPediaSecurity || window.LSPediaSecurity.permitirPWA();
        } catch (_e) {
            return false;
        }
    }

    function esAndroid() {
        return /Android/i.test(navigator.userAgent || '');
    }

    function esStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }

    function leerLocal(clave) {
        try { return localStorage.getItem(clave); } catch (_e) { return null; }
    }

    function guardarLocal(clave, valor) {
        try { localStorage.setItem(clave, valor); } catch (_e) {}
    }

    function estaOcultoEnSesion() {
        try { return sessionStorage.getItem(CLAVE_OCULTA_SESION) === '1'; }
        catch (_e) { return false; }
    }

    function ocultarEnSesion() {
        try { sessionStorage.setItem(CLAVE_OCULTA_SESION, '1'); } catch (_e) {}
    }

    function estaInstalada() {
        if (esStandalone()) {
            guardarLocal(CLAVE_INSTALADA, '1');
            return true;
        }
        return leerLocal(CLAVE_INSTALADA) === '1';
    }

    function quitarControl() {
        const actual = document.getElementById(ID_CONTENEDOR);
        if (actual) actual.remove();
    }

    function asegurarEstilos() {
        if (document.getElementById('lspPwaInstalarEstilos')) return;

        const estilo = document.createElement('style');
        estilo.id = 'lspPwaInstalarEstilos';
        estilo.textContent = `
            #${ID_CONTENEDOR} {
                position: fixed;
                right: 14px;
                bottom: calc(84px + env(safe-area-inset-bottom, 0px));
                z-index: 1042;
                display: flex;
                align-items: center;
                gap: 7px;
                max-width: min(92vw, 324px);
                padding: 5px;
                border: 1px solid rgba(245, 190, 32, 0.52);
                border-radius: 20px;
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.985) 0%, rgba(19, 38, 78, 0.985) 100%);
                box-shadow:
                    0 14px 34px rgba(15, 23, 42, 0.28),
                    0 0 0 1px rgba(255, 255, 255, 0.045) inset;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                overflow: hidden;
                isolation: isolate;
                animation:
                    lspPwaEntrada .62s cubic-bezier(.2,.8,.2,1) both,
                    lspPwaAtencion 5.8s ease-in-out 1.5s infinite;
            }

            #${ID_CONTENEDOR}::before {
                content: '';
                position: absolute;
                inset: 0;
                z-index: -1;
                pointer-events: none;
                background:
                    radial-gradient(circle at 18% 18%, rgba(255, 204, 51, 0.16), transparent 34%),
                    linear-gradient(135deg, transparent 42%, rgba(255,255,255,.035) 43%, transparent 66%);
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-btn {
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                gap: 10px;
                min-height: 52px;
                padding: 8px 13px 8px 9px;
                border: 0;
                border-radius: 15px;
                background: transparent;
                color: #fff;
                font: inherit;
                font-weight: 700;
                line-height: 1.1;
                cursor: pointer;
                transition: transform .18s ease, background .18s ease;
                -webkit-tap-highlight-color: transparent;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-btn::after {
                content: '';
                position: absolute;
                top: -35%;
                left: -45%;
                width: 28%;
                height: 170%;
                pointer-events: none;
                background: linear-gradient(
                    90deg,
                    rgba(255,255,255,0) 0%,
                    rgba(255,255,255,.06) 32%,
                    rgba(255,255,255,.34) 50%,
                    rgba(255,255,255,.06) 68%,
                    rgba(255,255,255,0) 100%
                );
                transform: skewX(-24deg);
                animation: lspPwaBrillo 5.8s ease-in-out 2s infinite;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-btn:hover,
            #${ID_CONTENEDOR} .lsp-pwa-instalar-btn:focus-visible {
                background: rgba(255,255,255,.055);
                transform: translateY(-1px);
                outline: none;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-btn:active {
                transform: scale(.985);
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-icono {
                position: relative;
                z-index: 1;
                width: 42px;
                height: 42px;
                flex: 0 0 42px;
                display: grid;
                place-items: center;
                border-radius: 50%;
                background: linear-gradient(145deg, #ffd84f 0%, #f5b914 100%);
                color: #10214b;
                box-shadow:
                    0 6px 16px rgba(0, 0, 0, .20),
                    0 0 0 2px rgba(255,255,255,.34) inset;
                animation: lspPwaIcono 5.8s ease-in-out 1.5s infinite;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-icono svg {
                width: 23px;
                height: 23px;
                display: block;
                stroke: currentColor;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-textos {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 3px;
                min-width: 0;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-titulo {
                color: #ffffff;
                font-size: .93rem;
                font-weight: 800;
                letter-spacing: .01em;
                white-space: nowrap;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-sub {
                color: #ffd65c;
                font-size: .70rem;
                font-weight: 650;
                letter-spacing: .015em;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-cerrar {
                position: relative;
                z-index: 2;
                width: 30px;
                height: 30px;
                flex: 0 0 30px;
                display: grid;
                place-items: center;
                margin-right: 2px;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 50%;
                background: rgba(255,255,255,.08);
                color: rgba(255,255,255,.78);
                font-size: 1rem;
                line-height: 1;
                cursor: pointer;
                transition: background .16s ease, color .16s ease, transform .16s ease;
                -webkit-tap-highlight-color: transparent;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-cerrar:hover,
            #${ID_CONTENEDOR} .lsp-pwa-instalar-cerrar:focus-visible {
                background: rgba(255,255,255,.15);
                color: #fff;
                outline: none;
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-cerrar:active {
                transform: scale(.94);
            }

            #${ID_CONTENEDOR} .lsp-pwa-instalar-ayuda {
                display: none;
                flex-basis: 100%;
                margin: 0 5px 5px;
                padding: 9px 11px;
                border: 1px solid rgba(255, 212, 89, .20);
                border-radius: 12px;
                background: rgba(255,255,255,.075);
                color: rgba(255,255,255,.88);
                font-size: .73rem;
                line-height: 1.42;
            }

            #${ID_CONTENEDOR}.mostrando-ayuda {
                flex-wrap: wrap;
                animation: lspPwaEntrada .3s ease both;
            }

            #${ID_CONTENEDOR}.mostrando-ayuda .lsp-pwa-instalar-ayuda {
                display: block;
            }

            @keyframes lspPwaEntrada {
                from {
                    opacity: 0;
                    transform: translate3d(18px, 18px, 0) scale(.94);
                }
                to {
                    opacity: 1;
                    transform: translate3d(0, 0, 0) scale(1);
                }
            }

            @keyframes lspPwaAtencion {
                0%, 68%, 100% {
                    transform: translateY(0) scale(1);
                    box-shadow:
                        0 14px 34px rgba(15, 23, 42, 0.28),
                        0 0 0 1px rgba(255, 255, 255, 0.045) inset;
                }
                74% {
                    transform: translateY(-3px) scale(1.018);
                    box-shadow:
                        0 18px 40px rgba(15, 23, 42, 0.34),
                        0 0 0 5px rgba(245, 190, 32, .08),
                        0 0 0 1px rgba(255, 255, 255, 0.055) inset;
                }
                80% {
                    transform: translateY(0) scale(1);
                }
                86% {
                    transform: translateY(-2px) scale(1.012);
                }
                92% {
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes lspPwaIcono {
                0%, 70%, 100% { transform: scale(1) rotate(0deg); }
                76% { transform: scale(1.10) rotate(-4deg); }
                82% { transform: scale(1.02) rotate(3deg); }
                88% { transform: scale(1.08) rotate(-2deg); }
                94% { transform: scale(1) rotate(0deg); }
            }

            @keyframes lspPwaBrillo {
                0%, 68%, 100% {
                    left: -45%;
                    opacity: 0;
                }
                72% { opacity: 1; }
                86% {
                    left: 125%;
                    opacity: 1;
                }
                90% {
                    left: 125%;
                    opacity: 0;
                }
            }

            @media (min-width: 1200px) {
                #${ID_CONTENEDOR} {
                    right: 24px;
                    bottom: 24px;
                }
            }

            @media (max-width: 520px) {
                #${ID_CONTENEDOR} {
                    right: 10px;
                    bottom: calc(88px + env(safe-area-inset-bottom, 0px));
                    max-width: calc(100vw - 20px);
                    border-radius: 18px;
                }

                #${ID_CONTENEDOR} .lsp-pwa-instalar-btn {
                    min-height: 50px;
                    padding-right: 10px;
                }
            }

            @media (max-width: 365px) {
                #${ID_CONTENEDOR} .lsp-pwa-instalar-icono {
                    width: 38px;
                    height: 38px;
                    flex-basis: 38px;
                }

                #${ID_CONTENEDOR} .lsp-pwa-instalar-titulo {
                    font-size: .84rem;
                }

                #${ID_CONTENEDOR} .lsp-pwa-instalar-sub {
                    font-size: .65rem;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                #${ID_CONTENEDOR},
                #${ID_CONTENEDOR} .lsp-pwa-instalar-icono,
                #${ID_CONTENEDOR} .lsp-pwa-instalar-btn::after {
                    animation: none !important;
                }

                #${ID_CONTENEDOR} .lsp-pwa-instalar-btn,
                #${ID_CONTENEDOR} .lsp-pwa-instalar-cerrar {
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(estilo);
    }

    function mostrarAyudaManual() {
        const caja = document.getElementById(ID_CONTENEDOR);
        if (!caja) return;

        const ayuda = caja.querySelector('.lsp-pwa-instalar-ayuda');
        if (ayuda) {
            ayuda.textContent = 'Si no aparece la ventana de instalación, abre el menú ⋮ de Chrome y toca “Instalar aplicación” o “Agregar a pantalla de inicio”.';
        }
        caja.classList.add('mostrando-ayuda');
    }

    async function solicitarInstalacion() {
        if (eventoInstalacion) {
            const evento = eventoInstalacion;
            eventoInstalacion = null;
            try {
                await evento.prompt();
                const eleccion = await evento.userChoice;
                if (eleccion && eleccion.outcome === 'accepted') {
                    guardarLocal(CLAVE_INSTALADA, '1');
                    quitarControl();
                    return;
                }
                mostrarAyudaManual();
            } catch (_e) {
                mostrarAyudaManual();
            }
            return;
        }

        mostrarAyudaManual();
    }

    function crearControl() {
        if (!permitido() || estaInstalada() || estaOcultoEnSesion()) {
            quitarControl();
            return;
        }

        // En Android siempre ofrecemos el acceso. En escritorio solo aparece
        // si Chromium confirmó que la PWA se puede instalar.
        if (!esAndroid() && !eventoInstalacion) return;
        if (document.getElementById(ID_CONTENEDOR)) return;

        asegurarEstilos();

        const caja = document.createElement('aside');
        caja.id = ID_CONTENEDOR;
        caja.setAttribute('aria-label', 'Instalar LSPedia como aplicación');
        caja.innerHTML = `
            <button type="button" class="lsp-pwa-instalar-btn" aria-label="Instalar LSPedia, usar como app">
                <span class="lsp-pwa-instalar-icono" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="6.5" y="2.5" width="11" height="19" rx="2.4"></rect>
                        <path d="M10 5.5h4"></path>
                        <path d="M12 8v7"></path>
                        <path d="m9.5 12.5 2.5 2.5 2.5-2.5"></path>
                        <path d="M10.5 18.3h3"></path>
                    </svg>
                </span>
                <span class="lsp-pwa-instalar-textos">
                    <span class="lsp-pwa-instalar-titulo">Instalar LSPedia</span>
                    <span class="lsp-pwa-instalar-sub">Usar como app</span>
                </span>
            </button>
            <button type="button" class="lsp-pwa-instalar-cerrar" aria-label="Ocultar botón de instalación" title="Ocultar">×</button>
            <div class="lsp-pwa-instalar-ayuda" role="status" aria-live="polite"></div>
        `;

        const instalar = caja.querySelector('.lsp-pwa-instalar-btn');
        const cerrar = caja.querySelector('.lsp-pwa-instalar-cerrar');

        if (instalar) instalar.addEventListener('click', solicitarInstalacion);
        if (cerrar) cerrar.addEventListener('click', function () {
            ocultarEnSesion();
            quitarControl();
        });

        document.body.appendChild(caja);
    }

    window.addEventListener('beforeinstallprompt', function (evento) {
        if (!permitido()) return;
        evento.preventDefault();
        eventoInstalacion = evento;
        crearControl();
    });

    window.addEventListener('appinstalled', function () {
        guardarLocal(CLAVE_INSTALADA, '1');
        eventoInstalacion = null;
        quitarControl();
    });

    const mediaStandalone = window.matchMedia('(display-mode: standalone)');
    if (typeof mediaStandalone.addEventListener === 'function') {
        mediaStandalone.addEventListener('change', function (evento) {
            if (evento.matches) {
                guardarLocal(CLAVE_INSTALADA, '1');
                quitarControl();
            }
        });
    }

    function iniciar() {
        if (esStandalone()) {
            guardarLocal(CLAVE_INSTALADA, '1');
            return;
        }
        crearControl();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
