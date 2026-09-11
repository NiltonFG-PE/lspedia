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
   Carga diferida de LSPedia Aventura.
   El banco de actividades se descarga recién cuando el usuario entra
   al juego, para no hacer más pesada la carga inicial del sitio.
   ============================================================ */
(function cargarAventuraLSPedia() {
    'use strict';
    if (!document.getElementById('seccionQuiz')) return;
    if (document.querySelector('script[data-lspedia-aventura]')) return;

    const version = '20260911-1';

    const estilo = document.createElement('link');
    estilo.rel = 'stylesheet';
    estilo.href = 'css/aventura-educativa.css?v=' + version;
    estilo.dataset.lspediaAventura = '1';
    document.head.appendChild(estilo);

    const cargarScript = function () {
        if (document.querySelector('script[data-lspedia-aventura]')) return;
        const script = document.createElement('script');
        script.src = 'js/aventura-educativa.js?v=' + version;
        script.async = false;
        script.dataset.lspediaAventura = '1';
        document.body.appendChild(script);
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(cargarScript, { timeout: 1200 });
    } else {
        window.setTimeout(cargarScript, 120);
    }
})();
