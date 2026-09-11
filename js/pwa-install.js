/* ============================================================
   LSPedia - Control visible para instalar la PWA
   ------------------------------------------------------------
   - En Android muestra un botón claro para instalar LSPedia.
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
                bottom: calc(82px + env(safe-area-inset-bottom, 0px));
                z-index: 1042;
                display: flex;
                align-items: center;
                gap: 7px;
                max-width: min(92vw, 310px);
                padding: 7px;
                border: 1px solid rgba(15, 23, 42, 0.10);
                border-radius: 18px;
                background: rgba(255, 255, 255, 0.97);
                box-shadow: 0 12px 32px rgba(15, 23, 42, 0.20);
                backdrop-filter: blur(10px);
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            #${ID_CONTENEDOR} .lsp-pwa-instalar-btn {
                display: flex;
                align-items: center;
                gap: 9px;
                min-height: 46px;
                padding: 8px 13px;
                border: 0;
                border-radius: 13px;
                background: linear-gradient(135deg, #0d6efd 0%, #075bc7 100%);
                color: #fff;
                font: inherit;
                font-weight: 700;
                line-height: 1.1;
                cursor: pointer;
                box-shadow: 0 6px 15px rgba(13, 110, 253, 0.24);
                transition: transform .16s ease, filter .16s ease, box-shadow .16s ease;
            }
            #${ID_CONTENEDOR} .lsp-pwa-instalar-btn:hover,
            #${ID_CONTENEDOR} .lsp-pwa-instalar-btn:focus-visible {
                transform: translateY(-1px);
                filter: brightness(1.04);
                box-shadow: 0 8px 18px rgba(13, 110, 253, 0.30);
                outline: none;
            }
            #${ID_CONTENEDOR} .lsp-pwa-instalar-btn:active {
                transform: scale(.98);
            }
            #${ID_CONTENEDOR} .lsp-pwa-instalar-icono {
                font-size: 1.3rem;
                line-height: 1;
            }
            #${ID_CONTENEDOR} .lsp-pwa-instalar-textos {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 2px;
            }
            #${ID_CONTENEDOR} .lsp-pwa-instalar-titulo {
                font-size: .91rem;
                white-space: nowrap;
            }
            #${ID_CONTENEDOR} .lsp-pwa-instalar-sub {
                font-size: .68rem;
                font-weight: 500;
                opacity: .86;
            }
            #${ID_CONTENEDOR} .lsp-pwa-instalar-cerrar {
                width: 32px;
                height: 32px;
                flex: 0 0 32px;
                border: 0;
                border-radius: 50%;
                background: #eef2f7;
                color: #475569;
                font-size: 1rem;
                line-height: 1;
                cursor: pointer;
            }
            #${ID_CONTENEDOR} .lsp-pwa-instalar-ayuda {
                display: none;
                max-width: 250px;
                padding: 6px 9px;
                color: #334155;
                font-size: .73rem;
                line-height: 1.35;
            }
            #${ID_CONTENEDOR}.mostrando-ayuda {
                flex-wrap: wrap;
            }
            #${ID_CONTENEDOR}.mostrando-ayuda .lsp-pwa-instalar-ayuda {
                display: block;
                flex-basis: 100%;
            }
            @media (min-width: 1200px) {
                #${ID_CONTENEDOR} {
                    bottom: 24px;
                    right: 24px;
                }
            }
            @media (max-width: 380px) {
                #${ID_CONTENEDOR} {
                    right: 8px;
                    max-width: calc(100vw - 16px);
                }
                #${ID_CONTENEDOR} .lsp-pwa-instalar-sub {
                    display: none;
                }
            }
            @media (prefers-reduced-motion: reduce) {
                #${ID_CONTENEDOR} .lsp-pwa-instalar-btn {
                    transition: none;
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
            <button type="button" class="lsp-pwa-instalar-btn" aria-label="Instalar LSPedia">
                <span class="lsp-pwa-instalar-icono" aria-hidden="true">📲</span>
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
