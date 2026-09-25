/* ============================================================
   LSPedia — fuente pública de Vocabulario
   ------------------------------------------------------------
   Separa dos conceptos que antes compartían el mismo arreglo:
   - Quiz: necesita video y mantiene su banco interno en QuizV2.
   - Vocabulario público/buscador/juegos: necesita IMAGEN REAL; el video
     es opcional, igual que la regla pública vigente de LSPedia.

   Desde 2026-09-17 también combina, sin sobrescribir datos editoriales,
   las definiciones de apoyo de data/vocabulario-definiciones.json.
   Así el JSON sincronizado desde Sheets puede seguir siendo la fuente
   principal y las definiciones editoriales se mantienen separadas.
   ============================================================ */
(function () {
    'use strict';

    if (window.LSPediaVocabularioPublico && window.LSPediaVocabularioPublico.version) return;

    const VERSION = '2026.09.25.1';
    const DATA_URL = 'data/vocabulario.json';
    const DEFINICIONES_URL = 'data/vocabulario-definiciones.json';
    const getterAnterior = typeof window.obtenerBancoHoja2 === 'function'
        ? window.obtenerBancoHoja2
        : null;

    const estado = {
        datos: [],
        definiciones: Object.create(null),
        listo: false,
        cargando: false,
        error: null
    };

    function texto(valor) {
        return String(valor == null ? '' : valor).trim();
    }

    function clavePalabra(valor) {
        const core = window.LSPediaCore;
        if (core && typeof core.normalizarTexto === 'function') return core.normalizarTexto(valor);
        return texto(valor)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
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

    function normalizarDefiniciones(data) {
        const origen = data && data.definiciones && typeof data.definiciones === 'object'
            ? data.definiciones
            : {};
        const mapa = Object.create(null);
        Object.keys(origen).forEach(function (palabra) {
            const clave = clavePalabra(palabra);
            const definicion = texto(origen[palabra]);
            if (clave && definicion) mapa[clave] = definicion;
        });
        return mapa;
    }

    function enriquecerDefinicion(item) {
        if (!item) return item;
        if (texto(item.definicion)) return item;
        const definicion = estado.definiciones[clavePalabra(item.palabra)];
        if (!definicion) return item;
        return Object.assign({}, item, {
            definicion: definicion,
            _definicionLspedia: 'apoyo-editorial'
        });
    }

    function normalizarLista(data) {
        const lista = Array.isArray(data)
            ? data
            : (data && Array.isArray(data.preguntas) ? data.preguntas : []);
        return lista.filter(esPublicable).map(function (item) {
            const base = item && item._fuenteLspedia === 'vocabulario'
                ? item
                : Object.assign({}, item, { _fuenteLspedia: 'vocabulario' });
            return enriquecerDefinicion(base);
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
            detail: {
                total: estado.datos.length,
                conDefinicion: estado.datos.filter(function (item) { return texto(item && item.definicion); }).length
            }
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

    let promesaCarga = null;
    function cargar() {
        if (estado.cargando || estado.listo || estado.error) return promesaCarga || Promise.resolve();
        estado.cargando = true;
        estado.error = null;

        const marca = Date.now();
        // La definición de apoyo no bloquea la disponibilidad de las palabras.
        leerDatos(DEFINICIONES_URL + '?_def=' + marca)
            .then(function (data) {
                estado.definiciones = normalizarDefiniciones(data);
                if (estado.listo) {
                    estado.datos = estado.datos.map(enriquecerDefinicion);
                    refrescarConsumidores();
                }
            })
            .catch(function (error) {
                console.warn('[LSPedia] Definiciones de apoyo no disponibles.', error);
            });
        promesaCarga = leerDatos(DATA_URL + '?_publico=' + marca)
            .then(function (data) {
                if (!Array.isArray(data) && !(data && Array.isArray(data.preguntas))) {
                    throw new Error('Formato de Vocabulario no válido');
                }
                estado.datos = normalizarLista(data);
                estado.listo = true; // Una colección vacía también terminó de cargar.
                refrescarConsumidores();
            })
            .catch(function (error) {
                estado.error = error;
                console.warn('[LSPedia] No se pudo cargar Vocabulario público.', error);
                document.dispatchEvent(new CustomEvent('lspedia:vocabularioPublicoError'));
            })
            .finally(function () { estado.cargando = false; });
        return promesaCarga;
    }

    const api = Object.freeze({
        version: VERSION,
        obtener: function () { return estado.datos.slice(); },
        listo: function () { return estado.listo; },
        cargar: cargar,
        estado: function () { return estado.listo ? 'listo' : (estado.error ? 'error' : 'cargando'); },
        total: function () { return estado.datos.length; },
        totalConDefinicion: function () {
            return estado.datos.filter(function (item) { return texto(item && item.definicion); }).length;
        },
        esPublicable: esPublicable,
        recargar: function () {
            if (estado.cargando) return promesaCarga;
            estado.listo = false;
            estado.error = null;
            return cargar();
        }
    });

    Object.defineProperty(window, 'LSPediaVocabularioPublico', {
        configurable: false,
        enumerable: true,
        writable: false,
        value: api
    });

    cargar();

    try {
        if (window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function') {
            window.QuizV2.onBancoListo(function () {
                if (estado.listo) setTimeout(refrescarConsumidores, 0);
            });
        }
    } catch (_e) {}
})();
