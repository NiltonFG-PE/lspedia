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

/* ============================================================
   REGLA OFICIAL DE PUBLICACIÓN DEL DICCIONARIO — 2026-09-13
   ------------------------------------------------------------
   Fuente de verdad pública:
   - una entrada SOLO aparece si tiene una imagen real;
   - el video es opcional para aparecer en Diccionario;
   - definición, categoría, variantes o traducción NO publican por sí solas;
   - un texto descriptivo en la columna imagen NO cuenta como imagen.

   Esta capa se registra ANTES de script.js y se aplica justo cuando
   script.js anuncia que los datos están listos. Así buscador, A-Z,
   categorías y Estadísticas comparten exactamente el mismo banco público.
   ============================================================ */
(function activarReglaPublicacionDiccionarioPorImagen() {
    'use strict';

    let aplicando = false;
    let ultimaFirma = '';

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
            return !!(
                p &&
                texto(p.palabra) &&
                texto(p.categoria) &&
                esImagenReal(p.imagen)
            );
        });
    }

    function instalarFiltroEnScriptBase() {
        // script.js declara esta función global después de security.js.
        // En cuanto existe, la sustituimos por la regla definitiva.
        if (typeof window.obtenerDatosDiccionarioPublicables === 'function' &&
            window.obtenerDatosDiccionarioPublicables !== filtrarPublicables) {
            window.obtenerDatosDiccionarioPublicables = filtrarPublicables;
        }

        window.LSPediaPublicacionDiccionario = Object.freeze({
            esImagenReal: esImagenReal,
            filtrar: filtrarPublicables
        });
    }

    function refrescarInterfaz() {
        try {
            if (typeof window.renderCategoriasDiccionario === 'function') {
                window.renderCategoriasDiccionario();
            }
        } catch (error) {
            console.warn('[LSPedia] No se pudieron refrescar categorías:', error);
        }

        try {
            if (typeof window.actualizarEstadisticas === 'function') {
                window.actualizarEstadisticas();
            }
        } catch (error) {
            console.warn('[LSPedia] No se pudieron refrescar estadísticas:', error);
        }

        try {
            if (typeof window.mostrarFavoritos === 'function') {
                window.mostrarFavoritos();
            }
        } catch (_error) {}

        try {
            if (typeof window.recalcularChipsSugeridos === 'function') {
                window.recalcularChipsSugeridos();
            }
        } catch (_error) {}

        try {
            const input = document.getElementById('buscar');
            if (input && texto(input.value) && typeof window.buscarPalabras === 'function') {
                window.buscarPalabras();
            }
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
            const id = texto(p.id).toLocaleLowerCase('es-PE');
            const nombre = texto(p.palabra).toLocaleLowerCase('es-PE');
            return id === ref || nombre === ref;
        });
        if (existe) return;

        try {
            window.history.replaceState({ tipo: 'vista', vista: 'diccionario' }, '', window.location.pathname);
        } catch (_error) {}

        if (typeof window.irAlBuscador === 'function') {
            window.irAlBuscador({ sinEnfoque: true, irArriba: true });
        }
    }

    function aplicarDataCruda(data) {
        if (!window.App || !Array.isArray(data)) return;
        const publicables = filtrarPublicables(data);
        const firma = publicables.map(function (p) { return texto(p.id) || texto(p.palabra); }).join('|');

        // Siempre reasignamos si App.datos no coincide en cantidad, aunque la
        // firma sea igual, porque una regla histórica pudo volver a llenarlo.
        if (ultimaFirma !== firma || !Array.isArray(window.App.datos) || window.App.datos.length !== publicables.length) {
            window.App.datos = publicables;
            ultimaFirma = firma;
            refrescarInterfaz();
            cerrarFichaNoPublicable();
        }
    }

    function aplicarDesdeFuenteReal() {
        if (aplicando) return;
        if (!window.App) return;
        aplicando = true;
        instalarFiltroEnScriptBase();

        fetch('data/palabras.json?_publicacion_imagen=20260913-4', { cache: 'no-store' })
            .then(function (respuesta) {
                if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
                return respuesta.json();
            })
            .then(function (data) {
                aplicarDataCruda(data);
            })
            .catch(function (error) {
                console.warn('[LSPedia] No se pudo refrescar palabras.json; se filtra la copia en memoria.', error);
                if (window.App && Array.isArray(window.App.datos)) {
                    aplicarDataCruda(window.App.datos);
                }
            })
            .finally(function () {
                aplicando = false;
            });
    }

    // security.js se ejecuta antes de script.js, por lo que estos listeners
    // ya están listos cuando la carga inicial del Diccionario termina.
    document.addEventListener('lspedia:datosListos', function () {
        setTimeout(aplicarDesdeFuenteReal, 0);
    });
    document.addEventListener('lspedia:palabrasActualizadas', function () {
        setTimeout(aplicarDesdeFuenteReal, 0);
    });

    // Respaldo para cachés/sesiones en las que el evento hubiera ocurrido
    // antes de que se instalara esta revisión.
    window.addEventListener('load', function () {
        setTimeout(aplicarDesdeFuenteReal, 0);
        setTimeout(aplicarDesdeFuenteReal, 1200);
    }, { once: true });
})();
