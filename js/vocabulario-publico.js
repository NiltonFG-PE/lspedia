/* ============================================================
   LSPedia — fuente pública de Vocabulario
   ------------------------------------------------------------
   Separa dos conceptos que antes compartían el mismo arreglo:
   - Quiz: necesita video y mantiene su banco interno en QuizV2.
   - Vocabulario público/buscador/juegos: necesita IMAGEN REAL; el video
     es opcional, igual que la regla pública vigente de LSPedia.

   Este módulo reemplaza únicamente el getter público obtenerBancoHoja2().
   No modifica el banco interno del Quiz ni sus requisitos de video.
   ============================================================ */
(function () {
    'use strict';

    if (window.LSPediaVocabularioPublico && window.LSPediaVocabularioPublico.version) return;

    const VERSION = '2026.09.14.2';
    const DATA_URL = 'data/vocabulario.json';
    const getterAnterior = typeof window.obtenerBancoHoja2 === 'function'
        ? window.obtenerBancoHoja2
        : null;

    const estado = {
        datos: [],
        listo: false,
        cargando: false,
        error: null
    };

    function texto(valor) {
        return String(valor == null ? '' : valor).trim();
    }

    function esImagenReal(valor) {
        try {
            if (window.LSPediaPublicacionDiccionario &&
                typeof window.LSPediaPublicacionDiccionario.esImagenReal === 'function') {
                return window.LSPediaPublicacionDiccionario.esImagenReal(valor);
            }
        } catch (_e) {}

        const principal = texto(valor).split(',')[0].trim();
        if (!principal) return false;
        return /^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(principal) &&
            /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(principal);
    }

    function esPublicable(item) {
        return !!(
            item &&
            texto(item.palabra) &&
            texto(item.categoria) &&
            esImagenReal(item.imagen)
        );
    }

    function normalizarLista(data) {
        const lista = Array.isArray(data)
            ? data
            : (data && Array.isArray(data.preguntas) ? data.preguntas : []);
        return lista.filter(esPublicable).map(function (item) {
            return item && item._fuenteLspedia === 'vocabulario'
                ? item
                : Object.assign({}, item, { _fuenteLspedia: 'vocabulario' });
        });
    }

    function obtener() {
        if (estado.listo) return estado.datos;
        try {
            const respaldo = getterAnterior ? getterAnterior() : [];
            return Array.isArray(respaldo) ? respaldo : [];
        } catch (_e) {
            return [];
        }
    }

    // script.js resuelve este identificador en el entorno global. Al sustituir
    // la propiedad global, sus búsquedas, Vocabulario y estadísticas pasan a
    // usar la colección pública por imagen; QuizV2 conserva su propio banco.
    try {
        window.obtenerBancoHoja2 = obtener;
    } catch (error) {
        console.warn('[LSPedia] No se pudo instalar la fuente pública de Vocabulario:', error);
    }

    function refrescarConsumidores() {
        try {
            if (typeof window.actualizarEstadisticas === 'function') {
                window.actualizarEstadisticas();
            }
        } catch (error) {
            console.warn('[LSPedia] No se pudieron refrescar estadísticas de Vocabulario:', error);
        }

        // Una URL directa a una palabra de Vocabulario pudo haberse evaluado
        // antes de que este JSON terminara de cargar. Se intenta restaurar una
        // sola vez cuando ya existe la colección pública completa.
        try {
            const params = new URLSearchParams(window.location.search);
            const fuente = texto(params.get('fuente')).toLowerCase();
            const palabra = texto(params.get('p'));
            if (palabra && fuente === 'vocabulario' &&
                typeof window.restaurarPalabraDesdeUrl === 'function') {
                window.restaurarPalabraDesdeUrl();
            }
        } catch (_e) {}

        document.dispatchEvent(new CustomEvent('lspedia:vocabularioPublicoListo', {
            detail: { total: estado.datos.length }
        }));
    }

    function leerDatos(url) {
        const core = window.LSPediaCore;
        if (core && typeof core.leerJsonSeguro === 'function') {
            return core.leerJsonSeguro(url, {
                timeoutMs: 6500,
                reintentos: 1,
                esperaReintentoMs: 400,
                fetch: { cache: 'no-store' }
            });
        }
        return fetch(url, { cache: 'no-store' }).then(function (respuesta) {
            if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
            return respuesta.json();
        });
    }

    function cargar() {
        if (estado.cargando || estado.listo) return;
        estado.cargando = true;
        estado.error = null;

        const separador = DATA_URL.includes('?') ? '&' : '?';
        const url = DATA_URL + separador + '_publico=' + Date.now();
        leerDatos(url)
            .then(function (data) {
                estado.datos = normalizarLista(data);
                estado.listo = true;
                refrescarConsumidores();
            })
            .catch(function (error) {
                estado.error = error;
                console.warn('[LSPedia] No se pudo cargar Vocabulario público; se conserva el respaldo disponible.', error);
            })
            .finally(function () {
                estado.cargando = false;
            });
    }

    const api = Object.freeze({
        version: VERSION,
        obtener: function () { return estado.datos.slice(); },
        listo: function () { return estado.listo; },
        total: function () { return estado.datos.length; },
        esPublicable: esPublicable,
        recargar: function () {
            estado.listo = false;
            cargar();
        }
    });

    Object.defineProperty(window, 'LSPediaVocabularioPublico', {
        configurable: false,
        enumerable: true,
        writable: false,
        value: api
    });

    cargar();

    // Quiz puede terminar su precarga después. Como nuestro getter público ya
    // está separado, solo refrescamos estadísticas al recibir esa señal; nunca
    // sustituimos datos públicos por el banco de videos.
    try {
        if (window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function') {
            window.QuizV2.onBancoListo(function () {
                if (estado.listo) setTimeout(refrescarConsumidores, 0);
            });
        }
    } catch (_e) {}
})();
