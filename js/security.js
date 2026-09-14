/* ============================================================
   LSPedia - Guardia de entorno / anti-clon (fase 2)
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

    function marcarCopiaComoNoIndexable() {
        if (!esCopiaPublica) return;
        let robots = document.querySelector('meta[name="robots"]');
        if (!robots) {
            robots = document.createElement('meta');
            robots.name = 'robots';
            document.head.appendChild(robots);
        }
        robots.content = 'noindex,nofollow,noarchive,nosnippet';

        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = urlOficialActual();
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

    marcarCopiaComoNoIndexable();

    document.addEventListener('click', function (evento) {
        const enlace = evento.target && evento.target.closest ? evento.target.closest('a[href]') : null;
        if (!enlace || permitirServicio(enlace.href)) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        avisoServicioOficial();
    }, true);

    document.addEventListener('submit', function (evento) {
        const form = evento.target;
        if (!form || form.tagName !== 'FORM') return;
        const destino = form.action || window.location.href;
        if (permitirServicio(destino)) return;
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

    if (typeof window.fetch === 'function') {
        const fetchOriginal = window.fetch.bind(window);
        window.fetch = function (entrada) {
            const url = typeof entrada === 'string' || entrada instanceof URL
                ? String(entrada)
                : (entrada && entrada.url ? String(entrada.url) : '');
            if (url && !permitirServicio(url)) {
                console.warn('[LSPedia seguridad] fetch bloqueado fuera del sitio oficial.');
                return Promise.reject(new Error('Servicio disponible solo en lspedia.site'));
            }
            return fetchOriginal.apply(window, arguments);
        };
    }

    if (navigator && typeof navigator.sendBeacon === 'function') {
        const beaconOriginal = navigator.sendBeacon.bind(navigator);
        navigator.sendBeacon = function (url) {
            if (!permitirServicio(url)) {
                console.warn('[LSPedia seguridad] sendBeacon bloqueado fuera del sitio oficial.');
                return false;
            }
            return beaconOriginal.apply(navigator, arguments);
        };
    }
})();

/* Instalación PWA solo en oficial/desarrollo. */
(function cargarControlInstalacionPWA() {
    'use strict';
    try {
        if (window.LSPediaSecurity && !window.LSPediaSecurity.permitirPWA()) return;
        if (document.querySelector('script[data-lspedia-pwa-install]')) return;
        const script = document.createElement('script');
        script.src = 'js/pwa-install.js?v=20260914-1';
        script.async = false;
        script.dataset.lspediaPwaInstall = '1';
        document.head.appendChild(script);
    } catch (_e) {}
})();

/* Fullscreen visual móvil/tablet. */
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

/* Publicación y estadísticas viven en script.js y vocabulario-publico.js. */
