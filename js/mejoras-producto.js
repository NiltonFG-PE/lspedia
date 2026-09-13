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
    // script.js todavía conserva compatibilidad con reglas históricas. Esta capa
    // es la fuente de verdad visual: sanea App.datos directamente y vuelve a
    // leer palabras.json sin caché, de modo que buscador, categorías, A-Z,
    // favoritos, "Descubre" y estadísticas trabajen con el mismo conjunto.
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

        function existeReferenciaPublicable(referencia){
            const ref = String(referencia || '').trim().toLocaleLowerCase('es-PE');
            if(!ref || !window.App || !Array.isArray(window.App.datos)) return false;
            return window.App.datos.some(function(palabra){
                if(!palabra) return false;
                const id = String(palabra.id || '').trim().toLocaleLowerCase('es-PE');
                const nombre = String(palabra.palabra || '').trim().toLocaleLowerCase('es-PE');
                return id === ref || nombre === ref;
            });
        }

        function cerrarFichaQueYaNoEsPublicable(){
            let params;
            try { params = new URLSearchParams(window.location.search); }
            catch(_error){ return; }

            const referencia = params.get('p');
            const fuente = String(params.get('fuente') || '').toLowerCase();
            if(!referencia || fuente === 'vocabulario' || existeReferenciaPublicable(referencia)) return;

            // Si alguien tenía abierta por caché una ficha del Diccionario que
            // ya no cumple la regla, regresamos a Inicio en vez de dejarla visible.
            try {
                window.history.replaceState({ tipo: 'vista', vista: 'diccionario' }, '', window.location.pathname);
            } catch(_error){}

            if(typeof window.irAlBuscador === 'function'){
                window.irAlBuscador({ sinEnfoque: true, irArriba: true });
                return;
            }

            ['resultado', 'resultadoCategorias', 'resultadoCategoriasDiccionario'].forEach(function(id){
                const nodo = document.getElementById(id);
                if(nodo) nodo.innerHTML = '';
            });
        }

        function refrescarZonasDependientes(){
            if(typeof window.renderCategoriasDiccionario === 'function'){
                window.renderCategoriasDiccionario();
            }
            if(typeof window.actualizarEstadisticas === 'function'){
                window.actualizarEstadisticas();
            }
            if(typeof window.mostrarFavoritos === 'function'){
                window.mostrarFavoritos();
            }

            // Si el usuario ya estaba escribiendo, repinta las sugerencias con
            // el banco saneado para retirar inmediatamente palabras sin imagen.
            const input = document.getElementById('buscar');
            if(input && String(input.value || '').trim() && typeof window.buscarPalabras === 'function'){
                window.buscarPalabras();
            }

            cerrarFichaQueYaNoEsPublicable();

            // En Inicio vuelve a calcular "Descubre" con el conjunto correcto.
            let params;
            try { params = new URLSearchParams(window.location.search); }
            catch(_error){ params = null; }
            if(params && !params.get('p') && !params.get('vista') && typeof window.mostrarSenalDelDia === 'function'){
                window.mostrarSenalDelDia();
            }
        }

        function aplicarDatosPublicables(data){
            if(!window.App || !Array.isArray(data)) return false;
            window.App.datos = filtrarPublicablesPorImagen(data);
            refrescarZonasDependientes();
            return true;
        }

        filtrarPublicablesPorImagen.__lspediaImagenObligatoria = true;
        filtrarPublicablesPorImagen.__lspediaReglaAnterior = original;
        filtrarPublicablesPorImagen.esImagenReal = esImagenReal;
        window.obtenerDatosDiccionarioPublicables = filtrarPublicablesPorImagen;
        window.LSPediaPublicacionDiccionario = Object.freeze({
            esImagenReal: esImagenReal,
            filtrar: filtrarPublicablesPorImagen
        });

        // Cada vez que la capa base termina de cargar o actualizar datos,
        // saneamos de nuevo App.datos. Esto cubre caché local, revalidación en
        // segundo plano y futuras actualizaciones durante la misma sesión.
        document.addEventListener('lspedia:datosListos', function(){
            if(window.App && Array.isArray(window.App.datos)){
                aplicarDatosPublicables(window.App.datos);
            }
        });
        document.addEventListener('lspedia:palabrasActualizadas', function(){
            if(window.App && Array.isArray(window.App.datos)){
                aplicarDatosPublicables(window.App.datos);
            }
        });

        // La lectura cruda es necesaria porque una caché/regla histórica de
        // script.js puede haber descartado palabras que SÍ tienen imagen pero
        // todavía no tienen video. Aquí se reconstruye el conjunto correcto:
        // IMAGEN sí; video opcional.
        fetch('data/palabras.json?reglaImagen=20260913-3', { cache: 'no-store' })
            .then(function(respuesta){
                if(!respuesta.ok) throw new Error('No se pudo actualizar palabras.json');
                return respuesta.json();
            })
            .then(function(data){
                if(!Array.isArray(data)) return;
                aplicarDatosPublicables(data);
            })
            .catch(function(error){
                console.warn('No se pudo refrescar el Diccionario con la regla de imagen:', error);
                // Sin red, al menos eliminamos de la copia en memoria cualquier
                // entrada sin imagen que hubiera llegado desde una caché vieja.
                if(window.App && Array.isArray(window.App.datos)){
                    aplicarDatosPublicables(window.App.datos);
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