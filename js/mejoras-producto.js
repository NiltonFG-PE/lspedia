/* LSPedia — cargador de mejoras de producto.
   Mantiene intacta la base existente y carga mejoras como módulos independientes.
   La publicación vive en script.js/Vocabulario público; security.js queda solo para seguridad. */
(function(){
    'use strict';

    function abrirDescubreEnDiccionario(palabra){
        if(!palabra) return;
        if(typeof window.irAlBuscador === 'function'){
            window.irAlBuscador({ sinEnfoque: true, irArriba: false });
        }
        const tarjeta = document.getElementById('senalDelDia');
        if(tarjeta) tarjeta.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if(typeof window.mostrarPalabra === 'function') window.mostrarPalabra(palabra, { enCategorias: false });
    }

    function fijarNavegacionDescubre(){
        const app = window.App;
        if(!app || !Array.isArray(app.datos)) return;
        const titulo = document.getElementById('tituloDelDia');
        if(!titulo) return;
        const nombre = String(titulo.textContent || '').trim().replace(/^[“\"]|[”\"]$/g, '');
        if(!nombre) return;
        const normalizar = function(valor){
            return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        };
        const palabra = app.datos.find(function(item){
            return item && normalizar(item.palabra) === normalizar(nombre);
        });
        if(!palabra) return;
        const abrir = function(evento){
            if(evento){ evento.preventDefault(); evento.stopPropagation(); }
            abrirDescubreEnDiccionario(palabra);
        };
        const boton = document.getElementById('btnVerDelDia');
        if(boton) boton.onclick = abrir;
        const miniatura = document.getElementById('miniaturaDelDiaWrap');
        if(miniatura){
            miniatura.onclick = abrir;
            miniatura.onkeypress = function(evento){ if(evento.key === 'Enter') abrir(evento); };
        }
    }

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
            try {
                const resultado = original.apply(this, arguments);
                fijarNavegacionDescubre();
                return resultado;
            }
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

    function asegurarEstilosRedesSociales(){
        let style = document.getElementById('lspediaFacebookEstilos');
        if(!style){ style = document.createElement('style'); style.id = 'lspediaFacebookEstilos'; document.head.appendChild(style); }
        style.textContent = [
            '.stat2-redes-iconos .stat2-red-icono{background:#f8fafc!important;-webkit-tap-highlight-color:transparent!important;}',
            '.stat2-redes-iconos .stat2-red-tiktok{color:#111111!important;background:linear-gradient(135deg,#e8ffff 0%,#fff0f7 100%)!important;}',
            '.stat2-redes-iconos .stat2-red-instagram{color:#E1306C!important;background:#fff0f6!important;}',
            '.stat2-redes-iconos .stat2-red-youtube{color:#FF0000!important;background:#fff1f1!important;}',
            '.stat2-redes-iconos .stat2-red-facebook{color:#1877F2!important;background:#eef5ff!important;}',
            '.stat2-redes-iconos .stat2-red-icono svg{color:currentColor!important;fill:currentColor!important;}',
            '.footer-red-facebook{color:#1877F2!important;-webkit-tap-highlight-color:transparent!important;}',
            '.footer-red-facebook svg{color:currentColor!important;fill:currentColor!important;}'
        ].join('');
    }

    function fijarColoresRedesTarjeta(){
        [['stat2-red-tiktok','#111111'],['stat2-red-instagram','#E1306C'],['stat2-red-youtube','#FF0000'],['stat2-red-facebook','#1877F2']].forEach(function(config){
            document.querySelectorAll('.stat2-redes-iconos .' + config[0]).forEach(function(enlace){
                enlace.style.setProperty('color', config[1], 'important');
                enlace.style.setProperty('-webkit-tap-highlight-color', 'transparent', 'important');
                const svg = enlace.querySelector('svg');
                if(svg){ svg.style.setProperty('color', config[1], 'important'); svg.style.setProperty('fill', 'currentColor', 'important'); }
            });
        });
    }

    function agregarFacebookRedesSociales(){
        const href = 'https://facebook.com/lspedia.sign';
        const usuario = '@lspedia.sign';
        const svgFacebook = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>';
        asegurarEstilosRedesSociales();
        document.querySelectorAll('.stat2-redes-iconos').forEach(function(contenedor){
            if(contenedor.querySelector('.stat2-red-facebook')) return;
            const enlace = document.createElement('a'); enlace.href=href; enlace.target='_blank'; enlace.rel='noopener'; enlace.className='stat2-red-icono stat2-red-facebook'; enlace.title='LSPedia en Facebook '+usuario; enlace.setAttribute('aria-label','Síguenos en Facebook '+usuario); enlace.innerHTML=svgFacebook; contenedor.appendChild(enlace);
        });
        document.querySelectorAll('.footer-redes').forEach(function(contenedor){
            if(contenedor.querySelector('.footer-red-facebook')) return;
            const enlace = document.createElement('a'); enlace.href=href; enlace.target='_blank'; enlace.rel='noopener'; enlace.className='footer-red-icono footer-red-facebook'; enlace.title='LSPedia en Facebook '+usuario; enlace.setAttribute('aria-label','Síguenos en Facebook '+usuario); enlace.innerHTML=svgFacebook; contenedor.appendChild(enlace);
        });
        fijarColoresRedesTarjeta();
    }

    function cargarCss(href){
        if(document.querySelector('link[data-lspedia-modulo="'+href+'"]')) return;
        const link=document.createElement('link'); link.rel='stylesheet'; link.href=href; link.dataset.lspediaModulo=href; document.head.appendChild(link);
    }
    function cargar(src, alTerminar){
        if(document.querySelector('script[data-lspedia-modulo="'+src+'"]')){ if(typeof alTerminar==='function') alTerminar(); return; }
        const s=document.createElement('script'); s.src=src; s.async=false; s.dataset.lspediaModulo=src; if(typeof alTerminar==='function') s.onload=alTerminar; s.onerror=function(){ console.error('No se pudo cargar:',src); if(typeof alTerminar==='function') alTerminar(); }; document.head.appendChild(s);
    }

    activarDescubreSoloConVideo();
    activarAutoScrollIndiceDiccionario();
    desactivarAvisoModalVocabulario();
    agregarFacebookRedesSociales();
    [250,800,1800,3500].forEach(function(ms){ setTimeout(agregarFacebookRedesSociales,ms); });

    cargar('js/youtube-diagnostico.js?v=20260916-1');
    cargar('js/categorias-compartir.js?v=20260915d');
    cargar('js/buscador-vocabulario-rescate.js?v=20261007-share-fix-2');
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
    cargarCss('css/buscador-dropdown-premium.css?v=20261006-5');
    cargarCss('css/derivacion-vocabulario.css?v=20261006-2');
    cargarCss('css/profundidad-3d.css?v=20261003-3');
    const movilLigero = window.matchMedia('(max-width: 1199.98px), (pointer: coarse)').matches;
    if(!movilLigero) cargar('js/profundidad-3d.js?v=20261003-3');
    cargarCss('css/microinteracciones-3d.css?v=20261007-light-1');
    if(!movilLigero) cargar('js/microinteracciones-3d.js?v=20261003-2');
    cargarCss('css/detalles-3d.css?v=20261007-light-1');
    cargarCss('css/compatibilidad-captura-movil.css?v=20261003-1');
    cargarCss('css/header-responsive-fix.css?v=20261006-1');
    cargar('js/buscador-capas-fix.js?v=20261006-1');
    cargar('js/buscador-movil-focus.js?v=20260925-1');
    cargarCss('css/lo-nuevo-premium.css?v=20260919-1');
    cargar('js/modo-oscuro.js?v=20260916-2');
    cargar('js/mi-lspedia-secciones.js?v=20260930-1');
    cargarCss('css/social-invitacion.css?v=20261001-3');
    cargar('js/social-invitacion.js?v=20261002-1');

    function cargarMejorasConCore(){
        cargar('js/accesibilidad-segura.js?v=20261007-light-1');
        cargar('js/seo-institucional.js?v=20260914-1');
        cargar('js/juegos-banco-compartido.js?v=20261007-light-1');
        cargar('js/a-z-movil.js?v=20260914');
    }
    if(window.LSPediaCore) cargarMejorasConCore(); else cargar('js/lspedia-core.js?v=20261003-mision-2', cargarMejorasConCore);
    cargar('js/optimizacion-errores.js?v=20260914-1', function(){
        cargar('js/rendimiento-movil.js?v=20261007-light-1', function(){
            cargar('js/mejoras-producto-base.js?v=20260914', function(){
                cargar('js/lo-nuevo.js?v=20261007-result-scroll-1');
                cargar('js/i18n.js?v=20261003-mision-2', function(){
                    cargar('js/i18n-restaurar.js?v=20261003-mision-2', function(){
                        cargar('js/i18n-auto.js?v=20260925-3', function(){
                            cargar('js/i18n-nosotros.js?v=20260925-2', function(){
                                cargar('js/i18n-completo.js?v=20260925-2', function(){
                                    agregarFacebookRedesSociales();
                                    cargar('js/buscador-visual.js?v=20260914');
                                });
                            });
                        });
                    });
                });
            });
        });
    });
})();