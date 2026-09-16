/* LSPedia — cargador de mejoras de producto.
   Mantiene intacta la base existente y carga mejoras como módulos independientes.
   La publicación vive en script.js/Vocabulario público; security.js queda solo para seguridad. */
(function(){
    'use strict';

    function activarDescubreSoloConVideo(){
        const original = window.mostrarSenalDelDia;
        if(typeof original !== 'function' || original.__lspediaSoloVideos) return;

        function mostrarDescubreSoloConVideo(){
            const app = window.App;
            if(!app || !Array.isArray(app.datos)) return original.apply(this, arguments);

            const datosCompletos = app.datos;
            const palabrasConVideo = datosCompletos.filter(function(palabra){
                const video = String((palabra && palabra.video) || '').trim();
                if(!video) return false;
                if(typeof window.extraerIdYouTube === 'function') return !!window.extraerIdYouTube(video);
                return true;
            });

            if(!palabrasConVideo.length){
                const tarjeta = document.getElementById('senalDelDia');
                if(tarjeta) tarjeta.style.display = 'none';
                return;
            }

            app.datos = palabrasConVideo;
            try { return original.apply(this, arguments); }
            finally { app.datos = datosCompletos; }
        }

        mostrarDescubreSoloConVideo.__lspediaSoloVideos = true;
        window.mostrarSenalDelDia = mostrarDescubreSoloConVideo;
        if(window.App && Array.isArray(window.App.datos) && window.App.datos.length) mostrarDescubreSoloConVideo();
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
                    if(typeof window.scrollAlPrimerResultado === 'function') window.scrollAlPrimerResultado(destino);
                    else destino.scrollIntoView({behavior:'smooth',block:'start'});
                });
            });
        });
    }

    function desactivarAvisoModalVocabulario(){
        window.mostrarAvisoVocabulario = function(){ return false; };

        const modal = document.getElementById('modalAvisoVocabulario');
        if(modal){
            try {
                if(typeof bootstrap !== 'undefined' && bootstrap.Modal){
                    const instancia = bootstrap.Modal.getInstance(modal);
                    if(instancia) instancia.hide();
                }
            } catch(_error) {}
            modal.remove();
        }

        document.querySelectorAll('.modal-backdrop').forEach(function(backdrop){ backdrop.remove(); });
        const contenidoPrincipal = document.getElementById('contenidoPrincipalApp');
        if(contenidoPrincipal) contenidoPrincipal.classList.remove('contenido-desenfocado');
        document.body.classList.remove('vocab-aviso-activo','modal-open');
        document.body.style.removeProperty('padding-right');
        document.body.style.removeProperty('overflow');
    }

    function agregarFacebookRedesSociales(){
        const href = 'https://facebook.com/lspedia.sign';
        const usuario = '@lspedia.sign';
        const svgFacebook = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>';

        if(!document.getElementById('lspediaFacebookEstilos')){
            const style = document.createElement('style');
            style.id = 'lspediaFacebookEstilos';
            style.textContent = '.stat2-red-facebook:hover,.footer-red-facebook:hover{background:#1877F2!important;color:#fff!important;}';
            document.head.appendChild(style);
        }

        document.querySelectorAll('.stat2-redes-iconos').forEach(function(contenedor){
            if(contenedor.querySelector('.stat2-red-facebook')) return;
            const enlace = document.createElement('a');
            enlace.href = href;
            enlace.target = '_blank';
            enlace.rel = 'noopener';
            enlace.className = 'stat2-red-icono stat2-red-facebook';
            enlace.title = 'LSPedia en Facebook ' + usuario;
            enlace.setAttribute('aria-label', 'Síguenos en Facebook ' + usuario);
            enlace.innerHTML = svgFacebook;
            contenedor.appendChild(enlace);
        });

        document.querySelectorAll('.footer-redes').forEach(function(contenedor){
            if(contenedor.querySelector('.footer-red-facebook')) return;
            const enlace = document.createElement('a');
            enlace.href = href;
            enlace.target = '_blank';
            enlace.rel = 'noopener';
            enlace.className = 'footer-red-icono footer-red-facebook';
            enlace.title = 'LSPedia en Facebook ' + usuario;
            enlace.setAttribute('aria-label', 'Síguenos en Facebook ' + usuario);
            enlace.innerHTML = svgFacebook;
            contenedor.appendChild(enlace);
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
    desactivarAvisoModalVocabulario();
    agregarFacebookRedesSociales();
    [250, 800, 1800, 3500].forEach(function(ms){
        setTimeout(agregarFacebookRedesSociales, ms);
    });

    cargar('js/categorias-compartir.js?v=20260915d');
    cargar('js/experiencia-vocabulario.js?v=20260916-2', function(){
        cargarCss('css/aprendizaje-unificado.css?v=20260916-2');
        cargarCss('css/aprendizaje-colapsable.css?v=20260916-1');
        cargar('js/aprendizaje-colapsable.js?v=20260916-1');
    });

    cargarCss('css/mejoras-maestras.css?v=20260914');
    cargarCss('css/accesibilidad-segura.css?v=20260914-1');
    cargarCss('css/vocabulario-layout.css?v=20260915-2');
    cargarCss('css/fab-dock-delgado.css?v=20260916-1');
    cargarCss('css/modo-oscuro.css?v=20260916-2');
    cargar('js/modo-oscuro.js?v=20260916-2');

    function cargarMejorasConCore(){
        cargar('js/vocabulario-publico.js?v=20260914-2');
        cargar('js/accesibilidad-segura.js?v=20260914-1');
        cargar('js/seo-institucional.js?v=20260914-1');
        cargar('js/juegos-banco-compartido.js?v=20260914-2');
        cargar('js/a-z-movil.js?v=20260914');
    }

    if(window.LSPediaCore) cargarMejorasConCore();
    else cargar('js/lspedia-core.js?v=20260914-3', cargarMejorasConCore);

    cargar('js/optimizacion-errores.js?v=20260914-1', function(){
        cargar('js/rendimiento-movil.js?v=20260914-1', function(){
            cargar('js/mejoras-producto-base.js?v=20260914', function(){
                cargar('js/lo-nuevo.js?v=20260914');
                cargar('js/i18n.js?v=20260914', function(){
                    cargar('js/i18n-restaurar.js?v=20260914', function(){
                        cargar('js/i18n-auto.js?v=20260914', function(){
                            cargar('js/i18n-nosotros.js?v=20260914', function(){
                                agregarFacebookRedesSociales();
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
