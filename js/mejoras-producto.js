/* LSPedia — cargador de mejoras de producto.
   Mantiene intacta la base existente y carga mejoras como módulos independientes. */
(function(){
    'use strict';

    // Regla oficial del Diccionario:
    // - una imagen principal REAL es obligatoria para aparecer públicamente;
    // - el video es opcional;
    // - definiciones, variantes, traducciones o prompts de ilustración no publican.
    function activarReglaPublicacionDiccionarioConImagen(){
        const original = window.obtenerDatosDiccionarioPublicables;
        if(typeof original !== 'function' || original.__lspediaImagenObligatoria) return;

        function esImagenReal(valor){
            const principal = String(valor || '').split(',')[0].trim();
            if(!principal) return false;
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

        function bancoVocabulario(){
            try {
                if(window.QuizV2 && typeof window.QuizV2.obtenerBanco === 'function'){
                    const banco = window.QuizV2.obtenerBanco();
                    return Array.isArray(banco) ? banco : [];
                }
            } catch(_error){}
            return [];
        }

        function videoValido(valor){
            const video = String(valor || '').trim();
            if(!video) return false;
            try {
                if(typeof window.extraerIdYouTube === 'function'){
                    return !!window.extraerIdYouTube(video);
                }
            } catch(_error){}
            return true;
        }

        // Las estadísticas deben contar exactamente lo que está publicado.
        // No dependemos del contador antiguo porque podía conservar el total
        // crudo de palabras aunque el buscador ya hubiese ocultado las que no
        // tenían imagen.
        function actualizarEstadisticasPublicadas(publicables){
            const diccionario = Array.isArray(publicables) ? publicables : [];
            const vocabulario = bancoVocabulario();
            const normalizar = function(valor){
                return String(valor || '').trim().toLocaleLowerCase('es-PE');
            };

            const vocabPalabras = vocabulario.filter(function(p){
                return p && String(p.palabra || '').trim() && videoValido(p.video);
            });

            const categoriasDic = new Set(
                diccionario
                    .map(function(p){ return normalizar(p && p.categoria); })
                    .filter(Boolean)
            );
            const categoriasVoc = new Set(
                vocabulario
                    .map(function(p){ return normalizar(p && p.categoria); })
                    .filter(Boolean)
            );

            const videosDicPrincipales = diccionario.filter(function(p){ return videoValido(p && p.video); }).length;
            const videosDicSugeridos = diccionario.filter(function(p){ return videoValido(p && p.senasugerida); }).length;
            const videosVoc = vocabulario.filter(function(p){ return videoValido(p && p.video); }).length;

            const totalPalabras = document.getElementById('totalPalabras');
            const detallePalabrasDic = document.getElementById('detallePalabrasDic');
            const detallePalabrasVoc = document.getElementById('detallePalabrasVoc');
            const totalCategorias = document.getElementById('totalCategorias');
            const detalleCategoriasDic = document.getElementById('detalleCategoriasDic');
            const detalleCategoriasVoc = document.getElementById('detalleCategoriasVoc');
            const totalVideos = document.getElementById('totalVideos');
            const detalleVideosDic = document.getElementById('detalleVideosDic');
            const detalleVideosVoc = document.getElementById('detalleVideosVoc');

            if(totalPalabras) totalPalabras.textContent = String(diccionario.length + vocabPalabras.length);
            if(detallePalabrasDic) detallePalabrasDic.textContent = String(diccionario.length);
            if(detallePalabrasVoc) detallePalabrasVoc.textContent = String(vocabPalabras.length);

            if(totalCategorias) totalCategorias.textContent = String(categoriasDic.size + categoriasVoc.size);
            if(detalleCategoriasDic) detalleCategoriasDic.textContent = String(categoriasDic.size);
            if(detalleCategoriasVoc) detalleCategoriasVoc.textContent = String(categoriasVoc.size);

            const videosDic = videosDicPrincipales + videosDicSugeridos;
            if(totalVideos) totalVideos.textContent = String(videosDic + videosVoc);
            if(detalleVideosDic) detalleVideosDic.textContent = String(videosDic);
            if(detalleVideosVoc) detalleVideosVoc.textContent = String(videosVoc);
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

        function refrescarZonasDependientes(publicables){
            if(typeof window.renderCategoriasDiccionario === 'function'){
                window.renderCategoriasDiccionario();
            }
            if(typeof window.mostrarFavoritos === 'function'){
                window.mostrarFavoritos();
            }

            // El contador nuevo se escribe al final para que ningún cálculo
            // histórico vuelva a mostrar filas sin imagen.
            actualizarEstadisticasPublicadas(publicables);

            const input = document.getElementById('buscar');
            if(input && String(input.value || '').trim() && typeof window.buscarPalabras === 'function'){
                window.buscarPalabras();
            }

            cerrarFichaQueYaNoEsPublicable();

            let params;
            try { params = new URLSearchParams(window.location.search); }
            catch(_error){ params = null; }
            if(params && !params.get('p') && !params.get('vista') && typeof window.mostrarSenalDelDia === 'function'){
                window.mostrarSenalDelDia();
            }
        }

        function aplicarDatosPublicables(data){
            if(!window.App || !Array.isArray(data)) return false;
            const publicables = filtrarPublicablesPorImagen(data);
            window.App.datos = publicables;
            refrescarZonasDependientes(publicables);
            return true;
        }

        filtrarPublicablesPorImagen.__lspediaImagenObligatoria = true;
        filtrarPublicablesPorImagen.__lspediaReglaAnterior = original;
        filtrarPublicablesPorImagen.esImagenReal = esImagenReal;
        window.obtenerDatosDiccionarioPublicables = filtrarPublicablesPorImagen;
        window.LSPediaPublicacionDiccionario = Object.freeze({
            esImagenReal: esImagenReal,
            filtrar: filtrarPublicablesPorImagen,
            actualizarEstadisticas: actualizarEstadisticasPublicadas
        });

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

        // Quiz/Vocabulario puede terminar de cargar después. Cuando eso pase,
        // recalculamos el desglose sin tocar la regla del Diccionario.
        try {
            if(window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function'){
                window.QuizV2.onBancoListo(function(){
                    if(window.App && Array.isArray(window.App.datos)){
                        actualizarEstadisticasPublicadas(window.App.datos);
                    }
                });
            }
        } catch(_error){}

        // Lee el JSON crudo sin caché para rescatar palabras con imagen aunque
        // todavía no tengan video y, al mismo tiempo, retirar cualquier fila sin
        // imagen que haya sobrevivido en una caché antigua.
        fetch('data/palabras.json?reglaImagen=20260913-4', { cache: 'no-store' })
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
                if(window.App && Array.isArray(window.App.datos)){
                    aplicarDatosPublicables(window.App.datos);
                }
            });
    }

    // "Descubre" solo elige entre palabras publicadas que además tienen video.
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
        cargar('js/a-z-movil.js?v=20260913');
    });

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