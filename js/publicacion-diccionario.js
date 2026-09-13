/* LSPedia — regla única de publicación del Diccionario.
   Una entrada solo es pública si tiene una imagen REAL.
   La definición, categoría, variantes, traducción o video por sí solos
   no hacen pública una palabra. El video sigue siendo opcional. */
(function () {
    'use strict';

    function texto(valor) {
        return String(valor == null ? '' : valor).trim();
    }

    function esImagenReal(valor) {
        const principal = texto(valor).split(',')[0].trim();
        if (!principal) return false;

        // Acepta URLs y rutas reales de archivos de imagen. No acepta textos
        // descriptivos antiguos como "Ilustración plana de...".
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

    // Sustituye la regla histórica de script.js antes de futuras
    // revalidaciones/actualizaciones en segundo plano.
    window.obtenerDatosDiccionarioPublicables = filtrarPublicables;
    window.LSPediaPublicacionDiccionario = Object.freeze({
        esImagenReal: esImagenReal,
        filtrar: filtrarPublicables
    });

    function actualizarInterfaz() {
        try {
            if (typeof window.actualizarEstadisticas === 'function') {
                window.actualizarEstadisticas();
            }
        } catch (error) {
            console.warn('No se pudieron actualizar las estadísticas:', error);
        }

        try {
            if (typeof window.renderCategoriasDiccionario === 'function') {
                window.renderCategoriasDiccionario();
            }
        } catch (error) {
            console.warn('No se pudieron actualizar las categorías:', error);
        }

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

    function existeReferenciaPublica(referencia) {
        const ref = texto(referencia).toLocaleLowerCase('es-PE');
        if (!ref || !window.App || !Array.isArray(window.App.datos)) return false;

        return window.App.datos.some(function (p) {
            if (!p) return false;
            const id = texto(p.id).toLocaleLowerCase('es-PE');
            const palabra = texto(p.palabra).toLocaleLowerCase('es-PE');
            return id === ref || palabra === ref;
        });
    }

    function cerrarFichaNoPublicable() {
        let params;
        try { params = new URLSearchParams(window.location.search); }
        catch (_error) { return; }

        const referencia = params.get('p');
        const fuente = texto(params.get('fuente')).toLowerCase();
        if (!referencia || fuente === 'vocabulario' || existeReferenciaPublica(referencia)) return;

        try {
            window.history.replaceState({ tipo: 'vista', vista: 'diccionario' }, '', window.location.pathname);
        } catch (_error) {}

        if (typeof window.irAlBuscador === 'function') {
            window.irAlBuscador({ sinEnfoque: true, irArriba: true });
        } else {
            const resultado = document.getElementById('resultado');
            if (resultado) resultado.innerHTML = '';
        }
    }

    function aplicar(data) {
        if (!window.App || !Array.isArray(data)) return false;
        window.App.datos = filtrarPublicables(data);
        actualizarInterfaz();
        cerrarFichaNoPublicable();
        return true;
    }

    function cargarFuenteReal() {
        fetch('data/palabras.json?publicacionImagen=20260913-1', { cache: 'no-store' })
            .then(function (respuesta) {
                if (!respuesta.ok) throw new Error('No se pudo leer palabras.json');
                return respuesta.json();
            })
            .then(function (data) {
                aplicar(data);
            })
            .catch(function (error) {
                console.warn('No se pudo aplicar la regla de publicación por imagen:', error);
                if (window.App && Array.isArray(window.App.datos)) {
                    aplicar(window.App.datos);
                }
            });
    }

    // Si script.js termina de cargar/revalidar después que este módulo,
    // volvemos a aplicar la regla correcta.
    document.addEventListener('lspedia:datosListos', cargarFuenteReal);
    document.addEventListener('lspedia:palabrasActualizadas', cargarFuenteReal);

    // Y la aplicamos inmediatamente al cargar este módulo.
    cargarFuenteReal();
})();
