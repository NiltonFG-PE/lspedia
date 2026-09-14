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

/* ============================================================
   REGLA ÚNICA DE PUBLICACIÓN DEL DICCIONARIO
   Una entrada pública necesita imagen REAL; el video es opcional.
   ============================================================ */
(function activarReglaPublicacionDiccionarioPorImagen() {
    'use strict';

    let aplicando = false;
    let ultimaFirma = '';
    let bancoVocabularioRegistrado = false;

    function texto(valor) {
        return String(valor == null ? '' : valor).trim();
    }

    function esImagenReal(valor) {
        const principal = texto(valor).split(',')[0].trim();
        if (!principal) return false;
        return /^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(principal) &&
            /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(principal);
    }

    function filtrarPublicables(data) {
        if (!Array.isArray(data)) return [];
        return data.filter(function (p) {
            return !!(p && texto(p.palabra) && texto(p.categoria) && esImagenReal(p.imagen));
        });
    }

    function videoValido(valor) {
        const video = texto(valor);
        if (!video) return false;
        try {
            if (typeof window.extraerIdYouTube === 'function') return !!window.extraerIdYouTube(video);
        } catch (_error) {}
        return true;
    }

    function bancoVocabulario() {
        try {
            if (window.QuizV2 && typeof window.QuizV2.obtenerBanco === 'function') {
                const banco = window.QuizV2.obtenerBanco();
                return Array.isArray(banco) ? banco : [];
            }
        } catch (_error) {}
        return [];
    }

    function actualizarEstadisticasPublicadas(publicables) {
        const diccionario = Array.isArray(publicables) ? publicables : [];
        const vocabulario = bancoVocabulario();
        const normalizar = function (valor) { return texto(valor).toLocaleLowerCase('es-PE'); };

        const vocabPalabras = vocabulario.filter(function (p) {
            return p && texto(p.palabra) && videoValido(p.video);
        });
        const categoriasDic = new Set(diccionario.map(function (p) { return normalizar(p && p.categoria); }).filter(Boolean));
        const categoriasVoc = new Set(vocabulario.map(function (p) { return normalizar(p && p.categoria); }).filter(Boolean));
        const videosDicPrincipales = diccionario.filter(function (p) { return videoValido(p && p.video); }).length;
        const videosDicSugeridos = diccionario.filter(function (p) { return videoValido(p && p.senasugerida); }).length;
        const videosVoc = vocabulario.filter(function (p) { return videoValido(p && p.video); }).length;

        const totalPalabras = document.getElementById('totalPalabras');
        const detallePalabrasDic = document.getElementById('detallePalabrasDic');
        const detallePalabrasVoc = document.getElementById('detallePalabrasVoc');
        const totalCategorias = document.getElementById('totalCategorias');
        const detalleCategoriasDic = document.getElementById('detalleCategoriasDic');
        const detalleCategoriasVoc = document.getElementById('detalleCategoriasVoc');
        const totalVideos = document.getElementById('totalVideos');
        const detalleVideosDic = document.getElementById('detalleVideosDic');
        const detalleVideosVoc = document.getElementById('detalleVideosVoc');

        if (totalPalabras) totalPalabras.textContent = String(diccionario.length + vocabPalabras.length);
        if (detallePalabrasDic) detallePalabrasDic.textContent = String(diccionario.length);
        if (detallePalabrasVoc) detallePalabrasVoc.textContent = String(vocabPalabras.length);
        if (totalCategorias) totalCategorias.textContent = String(categoriasDic.size + categoriasVoc.size);
        if (detalleCategoriasDic) detalleCategoriasDic.textContent = String(categoriasDic.size);
        if (detalleCategoriasVoc) detalleCategoriasVoc.textContent = String(categoriasVoc.size);

        const videosDic = videosDicPrincipales + videosDicSugeridos;
        if (totalVideos) totalVideos.textContent = String(videosDic + videosVoc);
        if (detalleVideosDic) detalleVideosDic.textContent = String(videosDic);
        if (detalleVideosVoc) detalleVideosVoc.textContent = String(videosVoc);
    }

    function instalarFiltroEnScriptBase() {
        if (typeof window.obtenerDatosDiccionarioPublicables === 'function' &&
            window.obtenerDatosDiccionarioPublicables !== filtrarPublicables) {
            window.obtenerDatosDiccionarioPublicables = filtrarPublicables;
        }
        window.LSPediaPublicacionDiccionario = Object.freeze({
            esImagenReal: esImagenReal,
            filtrar: filtrarPublicables,
            actualizarEstadisticas: actualizarEstadisticasPublicadas
        });
    }

    function refrescarInterfaz(publicables) {
        try { if (typeof window.renderCategoriasDiccionario === 'function') window.renderCategoriasDiccionario(); }
        catch (error) { console.warn('[LSPedia] No se pudieron refrescar categorías:', error); }
        try { if (typeof window.mostrarFavoritos === 'function') window.mostrarFavoritos(); }
        catch (_error) {}
        try { if (typeof window.recalcularChipsSugeridos === 'function') window.recalcularChipsSugeridos(); }
        catch (_error) {}

        actualizarEstadisticasPublicadas(publicables);

        try {
            const input = document.getElementById('buscar');
            if (input && texto(input.value) && typeof window.buscarPalabras === 'function') window.buscarPalabras();
        } catch (_error) {}
    }

    function cerrarFichaNoPublicable() {
        let params;
        try { params = new URLSearchParams(window.location.search); }
        catch (_error) { return; }

        const referencia = texto(params.get('p'));
        const fuente = texto(params.get('fuente')).toLowerCase();
        if (!referencia || fuente === 'vocabulario') return;
        if (!window.App || !Array.isArray(window.App.datos)) return;

        const ref = referencia.toLocaleLowerCase('es-PE');
        const existe = window.App.datos.some(function (p) {
            if (!p) return false;
            return texto(p.id).toLocaleLowerCase('es-PE') === ref ||
                texto(p.palabra).toLocaleLowerCase('es-PE') === ref;
        });
        if (existe) return;

        try { window.history.replaceState({ tipo: 'vista', vista: 'diccionario' }, '', window.location.pathname); }
        catch (_error) {}
        if (typeof window.irAlBuscador === 'function') window.irAlBuscador({ sinEnfoque: true, irArriba: true });
    }

    function aplicarDataCruda(data) {
        if (!window.App || !Array.isArray(data)) return;
        instalarFiltroEnScriptBase();
        const publicables = filtrarPublicables(data);
        const firma = publicables.map(function (p) { return texto(p.id) || texto(p.palabra); }).join('|');

        if (ultimaFirma !== firma || !Array.isArray(window.App.datos) || window.App.datos.length !== publicables.length) {
            window.App.datos = publicables;
            ultimaFirma = firma;
            refrescarInterfaz(publicables);
            cerrarFichaNoPublicable();
        } else {
            actualizarEstadisticasPublicadas(publicables);
        }
    }

    function aplicarDesdeFuenteReal() {
        if (aplicando || !window.App) return;
        aplicando = true;
        instalarFiltroEnScriptBase();

        fetch('data/palabras.json?_publicacion_imagen=20260914-2', { cache: 'no-store' })
            .then(function (respuesta) {
                if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
                return respuesta.json();
            })
            .then(aplicarDataCruda)
            .catch(function (error) {
                console.warn('[LSPedia] No se pudo refrescar palabras.json; se filtra la copia en memoria.', error);
                if (window.App && Array.isArray(window.App.datos)) aplicarDataCruda(window.App.datos);
            })
            .finally(function () { aplicando = false; });
    }

    function registrarActualizacionVocabulario(intentosRestantes) {
        if (bancoVocabularioRegistrado) return;
        try {
            if (window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function') {
                bancoVocabularioRegistrado = true;
                window.QuizV2.onBancoListo(function () {
                    if (window.App && Array.isArray(window.App.datos)) actualizarEstadisticasPublicadas(window.App.datos);
                });
                return;
            }
        } catch (_error) {}
        if ((intentosRestantes || 0) > 0) {
            setTimeout(function () { registrarActualizacionVocabulario(intentosRestantes - 1); }, 350);
        }
    }

    // security.js se registra antes que script.js. En DOMContentLoaded este
    // listener corre primero y reemplaza la regla histórica ANTES de que
    // App.iniciar haga su primer filtrado: así nunca aparece una palabra sin
    // imagen ni siquiera durante la carga inicial.
    document.addEventListener('DOMContentLoaded', function () {
        instalarFiltroEnScriptBase();
        setTimeout(aplicarDesdeFuenteReal, 0);
    }, { once: true });

    document.addEventListener('lspedia:datosListos', function () { setTimeout(aplicarDesdeFuenteReal, 0); });
    document.addEventListener('lspedia:palabrasActualizadas', function () { setTimeout(aplicarDesdeFuenteReal, 0); });

    window.addEventListener('load', function () {
        instalarFiltroEnScriptBase();
        registrarActualizacionVocabulario(10);
        setTimeout(aplicarDesdeFuenteReal, 0);
        setTimeout(aplicarDesdeFuenteReal, 1200);
    }, { once: true });
})();
