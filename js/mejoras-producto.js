/* LSPedia — cargador de mejoras de producto.
   Mantiene intacta la base existente y carga mejoras como módulos independientes.
   La regla pública del Diccionario vive en security.js para evitar duplicarla. */
(function(){
    'use strict';

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
        if(document.querySelector('script[data-lspedia-modulo="' + src + '"]')){
            if(typeof alTerminar === 'function') alTerminar();
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.dataset.lspediaModulo = src;
        if(typeof alTerminar === 'function') s.onload = alTerminar;
        s.onerror = function(){
            console.error('No se pudo cargar:', src);
            if(typeof alTerminar === 'function') alTerminar();
        };
        document.head.appendChild(s);
    }

    activarDescubreSoloConVideo();
    activarAutoScrollIndiceDiccionario();

    cargarCss('css/mejoras-maestras.css?v=20260914');
    cargar('js/lspedia-core.js?v=20260914', function(){
        cargar('js/juegos-banco-compartido.js?v=20260914');
        cargar('js/a-z-movil.js?v=20260914');
    });

    cargar('js/optimizacion-errores.js?v=20260914-1', function(){
        cargar('js/rendimiento-movil.js?v=20260914-1', function(){
            cargar('js/mejoras-producto-base.js?v=20260914', function(){
                cargar('js/lo-nuevo.js?v=20260914');
                cargar('js/i18n.js?v=20260914', function(){
                    cargar('js/i18n-restaurar.js?v=20260914', function(){
                        cargar('js/i18n-auto.js?v=20260914', function(){
                            cargar('js/i18n-nosotros.js?v=20260914', function(){
                                cargar('js/buscador-visual.js?v=20260914', function(){
                                    cargar('js/buscador-predictivo.js?v=20260914');
                                });
                            });
                        });
                    });
                });
            });
        });
    });
})();
