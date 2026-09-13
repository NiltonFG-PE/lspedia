/* LSPedia — cargador de mejoras de producto.
   Mantiene intacta la base existente y carga mejoras como módulos independientes. */
(function(){
    'use strict';

    // Regla oficial de publicación del Diccionario:
    // - la imagen principal REAL es obligatoria;
    // - el video es opcional para aparecer en el Diccionario;
    // - una definición, variantes, traducción o categoría por sí solas NO publican;
    // - textos antiguos usados como idea/prompt de ilustración NO cuentan como imagen.
    //
    // Este archivo se carga después de script.js. Por eso, además de sustituir
    // la función de filtro para las siguientes actualizaciones, volvemos a leer
    // palabras.json una sola vez para corregir inmediatamente App.datos y evitar
    // que una caché previa mantenga visibles palabras sin imagen.
    function activarReglaPublicacionDiccionarioConImagen(){
        const original = window.obtenerDatosDiccionarioPublicables;
        if(typeof original !== 'function' || original.__lspediaImagenObligatoria) return;

        function esImagenReal(valor){
            const principal = String(valor || '').split(',')[0].trim();
            if(!principal) return false;

            // Las imágenes publicadas por el Publicador usan rutas/URLs de
            // archivos reales. Las antiguas descripciones como
            // “Ilustración plana de...” quedan fuera de esta regla.
            return /^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(principal) &&
                /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(principal);
        }

        function filtrarPublicablesPorImagen(data){
            if(!Array.isArray(data)) return [];
            return data.filter(function(palabra){
                return !!(
                    palabra &&
                    String(palabra.palabra || '').trim() &&
                    String(palabra.categoria || '').trim() &&
                    esImagenReal(palabra.imagen)
                );
            });
        }

        filtrarPublicablesPorImagen.__lspediaImagenObligatoria = true;
        filtrarPublicablesPorImagen.__lspediaReglaAnterior = original;
        filtrarPublicablesPorImagen.esImagenReal = esImagenReal;
        window.obtenerDatosDiccionarioPublicables = filtrarPublicablesPorImagen;

        // Corrige de inmediato la sesión actual. Esto es importante porque
        // script.js ya pudo haber cargado una versión filtrada con la regla
        // antigua (video obligatorio) antes de que este módulo se ejecute.
        fetch('data/palabras.json?reglaImagen=20260913-2', { cache: 'no-store' })
            .then(function(respuesta){
                if(!respuesta.ok) throw new Error('No se pudo actualizar palabras.json');
                return respuesta.json();
            })
            .then(function(data){
                if(!Array.isArray(data)) return;

                // Si existe la función central de script.js, la usamos para
                // refrescar categorías, estadísticas, sugerencias y demás zonas.
                // Ya verá la nueva obtenerDatosDiccionarioPublicables.
                if(typeof window.aplicarPalabrasActualizadasEnSesion === 'function'){
                    window.aplicarPalabrasActualizadasEnSesion(data);
                    return;
                }

                // Respaldo por compatibilidad: actualiza directamente App.datos.
                if(window.App){
                    window.App.datos = filtrarPublicablesPorImagen(data);
                }
                if(typeof window.renderCategoriasDiccionario === 'function'){
                    window.renderCategoriasDiccionario();
                }
                if(typeof window.actualizarEstadisticas === 'function'){
                    window.actualizarEstadisticas();
                }
                if(typeof window.mostrarFavoritos === 'function'){
                    window.mostrarFavoritos();
                }
            })
            .catch(function(error){
                console.warn('No se pudo refrescar el Diccionario con la regla de imagen:', error);

                // Incluso si falla la red, elimina en memoria las entradas sin
                // imagen que pudieran haber quedado visibles por una caché vieja.
                if(window.App && Array.isArray(window.App.datos)){
                    window.App.datos = filtrarPublicablesPorImagen(window.App.datos);
                    if(typeof window.renderCategoriasDiccionario === 'function'){
                        window.renderCategoriasDiccionario();
                    }
                    if(typeof window.actualizarEstadisticas === 'function'){
                        window.actualizarEstadisticas();
                    }
                }
            });
    }

    function activarDescubreSoloConVideo(){
        const original = window.mostrarSenalDelDia;
        if(typeof original !== 'function' || original.__lspediaSoloVideos) return;

        function mostrarDescubreSoloConVideo(){
            const app = window.App;
            if(!app || !Array.isArray(app.datos)){
                return original.apply(this, arguments);
            }

            const datosCompletos = app.datos;
            const palabrasConVideo = datosCompletos.filter(function(palabra){
                const video = String((palabra && palabra.video) || '').trim();
                if(!video) return false;

                if(typeof window.extraerIdYouTube === 'function'){
                    return !!window.extraerIdYouTube(video);
                }

                return true;
            });

            if(!palabrasConVideo.length){
                const tarjeta = document.getElementById('senalDelDia');
                if(tarjeta) tarjeta.style.display = 'none';
                return;
            }

            app.datos = palabrasConVideo;
            try {
                return original.apply(this, arguments);
            } finally {
                app.datos = datosCompletos;
            }
        }

        mostrarDescubreSoloConVideo.__lspediaSoloVideos = true;
        window.mostrarSenalDelDia = mostrarDescubreSoloConVideo;

        if(window.App && Array.isArray(window.App.datos) && window.App.datos.length){
            mostrarDescubreSoloConVideo();
        }
    }

    function activarAutoScrollIndiceDiccionario(){
        const indice = document.getElementById('indiceAlfabetico');
        if(!indice || indice.dataset.autoScrollResultados === '1') return;

        indice.dataset.autoScrollResultados = '1';
        indice.querySelectorAll('.btn-abc').forEach(function(boton){
            boton.addEventListener('click', function(){
                requestAnimationFrame(function(){
                    const destino = document.getElementById('resultado');
                    if(!destino || !destino.innerHTML.trim()) return;

                    if(typeof window.scrollAlPrimerResultado === 'function'){
                        window.scrollAlPrimerResultado(destino);
                    } else {
                        destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        });
    }

    function cargarCss(href){
        if(document.querySelector('link[data-lspedia-modulo="' + href + '"]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.lspediaModulo = href;
        document.head.appendChild(link);
    }

    function cargar(src, alTerminar){
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        if(typeof alTerminar === 'function') s.onload = alTerminar;
        s.onerror = function(){
            console.error('No se pudo cargar:', src);
            if(typeof alTerminar === 'function') alTerminar();
        };
        document.head.appendChild(s);
    }

    activarReglaPublicacionDiccionarioConImagen();
    activarDescubreSoloConVideo();
    activarAutoScrollIndiceDiccionario();

    cargarCss('css/mejoras-maestras.css?v=20260913');
    cargar('js/lspedia-core.js?v=20260913', function(){
        cargar('js/juegos-banco-compartido.js?v=20260913');
        // El instalador PWA ya existe en js/pwa-install.js y security.js
        // se encarga de cargarlo. No crear ni cargar un segundo instalador.
        cargar('js/a-z-movil.js?v=20260913');
    });

    // Mejora la carga de recursos y deduplica fallos técnicos ANTES de que
    // la telemetría base comience a escuchar errores.
    cargar('js/optimizacion-errores.js?v=20260913-1', function(){
        cargar('js/mejoras-producto-base.js', function(){
            cargar('js/lo-nuevo.js');
            cargar('js/i18n.js', function(){
                cargar('js/i18n-restaurar.js', function(){
                    cargar('js/i18n-auto.js', function(){
                        cargar('js/i18n-nosotros.js', function(){
                            cargar('js/buscador-visual.js', function(){
                                cargar('js/buscador-predictivo.js');
                            });
                        });
                    });
                });
            });
        });
    });
})();