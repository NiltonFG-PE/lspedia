/* ============================================================
   LSPedia - Guardia de entorno / anti-clon (fase 1)
   ============================================================ */
(function () {
    'use strict';
    const HOSTS_OFICIALES = new Set(['lspedia.site', 'www.lspedia.site']);
    const HOSTS_DESARROLLO = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
    const host = String(window.location.hostname || '').toLowerCase();
    const esArchivoLocal = window.location.protocol === 'file:';
    const esOficial = HOSTS_OFICIALES.has(host);
    const esDesarrollo = esArchivoLocal || HOSTS_DESARROLLO.has(host);
    const esCopiaPublica = !esOficial && !esDesarrollo;
    const ORIGEN_OFICIAL = 'https://lspedia.site';

    function hostDe(url) {
        try { return new URL(String(url || ''), window.location.href).hostname.toLowerCase(); }
        catch (_e) { return ''; }
    }
    function esServicioSensible(url) {
        const h = hostDe(url);
        return h === 'script.google.com' ||
            h === 'script.googleusercontent.com' ||
            h === 'forms.gle' ||
            (h === 'docs.google.com' && /\/forms(?:\/|$)/i.test(String(url || '')));
    }
    function permitirServicio(url) {
        if (!esCopiaPublica) return true;
        return !esServicioSensible(url);
    }
    function permitirPWA() { return !esCopiaPublica; }
    function urlOficialActual() {
        return ORIGEN_OFICIAL + window.location.pathname + window.location.search + window.location.hash;
    }
    function avisoServicioOficial() {
        try { window.alert('Esta función está disponible únicamente en el sitio oficial lspedia.site.'); } catch (_e) {}
        try { console.warn('[LSPedia seguridad] Integración bloqueada fuera del dominio oficial.'); } catch (_e) {}
    }

    window.LSPediaSecurity = Object.freeze({
        esOficial: () => esOficial,
        esDesarrollo: () => esDesarrollo,
        esCopiaPublica: () => esCopiaPublica,
        permitirServicio,
        permitirPWA,
        urlOficialActual,
        origenOficial: ORIGEN_OFICIAL
    });
    window.__LSPEDIA_OFFICIAL__ = esOficial;
    document.documentElement.dataset.lspediaEntorno = esOficial ? 'oficial' : (esDesarrollo ? 'desarrollo' : 'copia');
    if (!esCopiaPublica) return;

    document.addEventListener('click', function (evento) {
        const enlace = evento.target && evento.target.closest ? evento.target.closest('a[href]') : null;
        if (!enlace || permitirServicio(enlace.href)) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        avisoServicioOficial();
    }, true);

    const abrirOriginal = window.open;
    window.open = function (url) {
        if (!permitirServicio(url)) {
            avisoServicioOficial();
            return null;
        }
        return abrirOriginal.apply(window, arguments);
    };
})();

/* ============================================================
   Control visible de instalación PWA.
   Se carga solo en el dominio oficial o en desarrollo local.
   ============================================================ */
(function cargarControlInstalacionPWA() {
    'use strict';
    try {
        if (window.LSPediaSecurity && !window.LSPediaSecurity.permitirPWA()) return;
        if (document.querySelector('script[data-lspedia-pwa-install]')) return;

        const script = document.createElement('script');
        script.src = 'js/pwa-install.js?v=20260911-1';
        script.async = false;
        script.dataset.lspediaPwaInstall = '1';
        document.head.appendChild(script);
    } catch (_e) {}
})();

/* ============================================================
   Corrección de fullscreen visual para móvil/tablet.
   Mantiene los controles LSPedia visibles y evita el aviso de Chrome.
   ============================================================ */
(function cargarFullscreenMovilFix() {
    'use strict';
    try {
        if (window.LSPediaSecurity && window.LSPediaSecurity.esCopiaPublica()) return;
        if (document.querySelector('script[data-lspedia-fullscreen-mobile-fix]')) return;

        const script = document.createElement('script');
        script.src = 'js/fullscreen-mobile-fix.js?v=20260912-3';
        script.async = false;
        script.dataset.lspediaFullscreenMobileFix = '1';
        document.head.appendChild(script);
    } catch (_e) {}
})();