/* LSPedia — cargador de mejoras de producto.
   Mantiene intacta la base existente y añade la sección general "Lo nuevo",
   la capa bilingüe Español/Inglés y la búsqueda visual consultable. */
(function(){
    'use strict';

    /* ============================================================
       DESCUBRE — SOLO PALABRAS CON VIDEO
       ------------------------------------------------------------
       La tarjeta "Descubre" usa mostrarSenalDelDia() de script.js.
       Aquí la envolvemos sin tocar la lógica principal: durante el cálculo
       de la tarjeta, App.datos se limita temporalmente a palabras que tengan
       un video de YouTube válido. Después se restaura el banco completo.

       Así:
       - Diccionario y búsquedas siguen viendo todas las palabras.
       - Descubre nunca muestra una ficha sin video.
       - Anterior/Siguiente también recorren únicamente palabras con video.
       ============================================================ */
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

    /* ============================================================
       DICCIONARIO — AUTOSCROLL AL FILTRAR POR LETRA
       ============================================================ */
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

    activarDescubreSoloConVideo();
    activarAutoScrollIndiceDiccionario();

    cargar('js/mejoras-producto-base.js', function(){
        cargar('js/lo-nuevo.js');
        cargar('js/i18n.js', function(){
            cargar('js/i18n-restaurar.js', function(){
                cargar('js/i18n-auto.js', function(){
                    cargar('js/i18n-nosotros.js', function(){
                        cargar('js/buscador-visual.js', function(){
                            // Predicción avanzada solo para el Diccionario.
                            cargar('js/buscador-predictivo.js');
                        });
                    });
                });
            });
        });
    });
})();
