/*
 * LSPedia — punto de entrada de Subtítulos + restauración de categorías.
 *
 * El módulo original de Subtítulos vive en js/subtitulos-core.js.
 * Este archivo también contiene un respaldo simple para los enlaces
 * directos de Vocabulario, para que funcionen igual en escritorio,
 * móvil, PWA y al abrir un enlace desde WhatsApp/redes.
 */
(function(){
    'use strict';

    // IMPORTANTE: script.js puede cambiar muy pronto
    // ?vista=vocabulario&categoria=Emociones -> ?vista=vocabulario.
    // Por eso capturamos el destino ORIGINAL AHORA, durante el parseo,
    // antes de esperar DOMContentLoaded.
    function leerDestinoCategoria(urlTexto){
        try {
            const url = new URL(urlTexto, window.location.href);
            const vista = String(url.searchParams.get('vista') || '').trim().toLowerCase();
            const categoria = String(url.searchParams.get('categoria') || '').trim();
            if((vista === 'vocabulario' || vista === 'temas') && categoria){
                return { vista: 'vocabulario', categoria };
            }
        } catch(_e) {}
        return null;
    }

    function obtenerDestinoOriginal(){
        try {
            if(window.performance && typeof performance.getEntriesByType === 'function'){
                const entradas = performance.getEntriesByType('navigation');
                if(entradas && entradas[0] && entradas[0].name){
                    const desdeNavegacion = leerDestinoCategoria(entradas[0].name);
                    if(desdeNavegacion) return desdeNavegacion;
                }
            }
        } catch(_e) {}
        return leerDestinoCategoria(window.location.href);
    }

    const destinoCategoriaOriginal = obtenerDestinoOriginal();

    if(!window.__LSPEDIA_SUBTITULOS_CORE_CARGADO__){
        window.__LSPEDIA_SUBTITULOS_CORE_CARGADO__ = true;
        document.write('<script src="js/subtitulos-core.js?v=20260915"><\/script>');
    }

    if(!window.__LSPEDIA_CATEGORIAS_COMPARTIR_CARGADO__){
        window.__LSPEDIA_CATEGORIAS_COMPARTIR_CARGADO__ = true;
        document.write('<script src="js/categorias-compartir.js?v=20260915e"><\/script>');
    }

    function restaurarCategoriaVocabularioDesdeUrl(){
        const destino = destinoCategoriaOriginal || leerDestinoCategoria(window.location.href);
        if(!destino || !destino.categoria) return;

        const categoria = destino.categoria;
        const clave = 'vocabulario:' + categoria.toLowerCase();
        if(window.__LSPEDIA_CATEGORIA_URL_RESTAURADA__ === clave) return;
        window.__LSPEDIA_CATEGORIA_URL_RESTAURADA__ = clave;

        function reponerUrl(){
            const url = window.location.pathname
                + '?vista=vocabulario&categoria=' + encodeURIComponent(categoria);
            try {
                window.history.replaceState(
                    { tipo: 'categoriaVocabulario', categoria },
                    '',
                    url
                );
            } catch(_e) {}
        }

        const cuerpo = document.body;
        const yaEnVocabulario = !!(cuerpo && cuerpo.classList.contains('vista-temas-movil'));
        if(!yaEnVocabulario){
            const btn = document.getElementById('btnCategorias');
            if(btn){
                try { btn.click(); } catch(_e) {}
            }
        }

        reponerUrl();

        const mostrar = () => {
            if(typeof window.mostrarCategoria !== 'function') return false;
            try {
                window.mostrarCategoria(categoria, { noActualizarHistorial: true });
                reponerUrl();
                return true;
            } catch(error) {
                console.warn('LSPedia: no se pudo restaurar la categoría compartida:', error);
                return false;
            }
        };

        if(window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function'){
            if(typeof window.QuizV2.asegurarBancoCargado === 'function'){
                try { window.QuizV2.asegurarBancoCargado(); } catch(_e) {}
            }
            window.QuizV2.onBancoListo(() => {
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    mostrar();
                    reponerUrl();
                }));
            });
        }

        [50, 200, 500, 1000, 1800, 3000, 5000].forEach(ms => {
            setTimeout(() => {
                mostrar();
                reponerUrl();
            }, ms);
        });
    }

    // Facebook oficial de LSPedia.
    // Se crea igual que las demás redes, pero su estado visual se controla
    // de forma directa para evitar conflictos con reglas antiguas del footer.
    function agregarFacebookRedesSociales(){
        const href = 'https://www.facebook.com/lspedia.sign';
        const usuario = '@lspedia.sign';
        const AZUL = '#1877F2';
        const FONDO = '#f8fafc';
        const svgFacebook = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>';

        // Respaldo CSS. Los estados activos también se fuerzan por JS abajo,
        // de modo que ninguna regla global pueda volver gris o blanco el icono.
        let estilo = document.getElementById('lspediaFacebookEstilos');
        if(!estilo){
            estilo = document.createElement('style');
            estilo.id = 'lspediaFacebookEstilos';
            document.head.appendChild(estilo);
        }
        estilo.textContent = [
            '.stat2-red-facebook,.footer-red-facebook{transition:transform .2s ease,background-color .2s ease,color .2s ease,box-shadow .2s ease!important;opacity:1!important;filter:none!important;-webkit-tap-highlight-color:transparent!important;}',
            '.stat2-red-facebook svg,.footer-red-facebook svg,.stat2-red-facebook path,.footer-red-facebook path{opacity:1!important;filter:none!important;}'
        ].join('');

        function aplicarEstado(enlace, activo){
            if(!enlace) return;
            const colorIcono = activo ? '#ffffff' : AZUL;
            const fondo = activo ? AZUL : FONDO;

            enlace.style.setProperty('color', colorIcono, 'important');
            enlace.style.setProperty('background', fondo, 'important');
            enlace.style.setProperty('background-color', fondo, 'important');
            enlace.style.setProperty('border-color', activo ? AZUL : 'rgba(24,119,242,.22)', 'important');
            enlace.style.setProperty('opacity', '1', 'important');
            enlace.style.setProperty('filter', 'none', 'important');
            enlace.style.setProperty('transform', activo ? 'scale(1.12)' : 'scale(1)', 'important');
            enlace.style.setProperty('box-shadow', activo ? '0 7px 18px rgba(24,119,242,.28)' : 'none', 'important');
            enlace.style.setProperty('-webkit-tap-highlight-color', 'transparent', 'important');

            const svg = enlace.querySelector('svg');
            if(svg){
                svg.style.setProperty('color', colorIcono, 'important');
                svg.style.setProperty('fill', colorIcono, 'important');
                svg.style.setProperty('opacity', '1', 'important');
                svg.style.setProperty('filter', 'none', 'important');
            }
            enlace.querySelectorAll('path').forEach(path => {
                path.style.setProperty('color', colorIcono, 'important');
                path.style.setProperty('fill', colorIcono, 'important');
                path.style.setProperty('opacity', '1', 'important');
                path.style.setProperty('filter', 'none', 'important');
            });
        }

        function prepararInteraccion(enlace){
            if(!enlace) return;
            aplicarEstado(enlace, false);
            if(enlace.dataset.facebookAnimacionLista === '1') return;
            enlace.dataset.facebookAnimacionLista = '1';

            enlace.addEventListener('mouseenter', () => aplicarEstado(enlace, true));
            enlace.addEventListener('mouseleave', () => aplicarEstado(enlace, false));
            enlace.addEventListener('focus', () => aplicarEstado(enlace, true));
            enlace.addEventListener('blur', () => aplicarEstado(enlace, false));
            enlace.addEventListener('pointerdown', () => aplicarEstado(enlace, true));
            enlace.addEventListener('pointerup', () => {
                if(enlace.matches(':hover')) aplicarEstado(enlace, true);
                else aplicarEstado(enlace, false);
            });
            enlace.addEventListener('pointercancel', () => aplicarEstado(enlace, false));
        }

        function crearEnlace(clases){
            const enlace = document.createElement('a');
            enlace.href = href;
            enlace.target = '_blank';
            enlace.rel = 'noopener noreferrer';
            enlace.className = clases;
            enlace.title = 'LSPedia en Facebook ' + usuario;
            enlace.setAttribute('aria-label', 'Síguenos en Facebook ' + usuario);
            enlace.innerHTML = svgFacebook;
            prepararInteraccion(enlace);
            return enlace;
        }

        document.querySelectorAll('.stat2-redes-iconos').forEach(contenedor => {
            let enlace = contenedor.querySelector('.stat2-red-facebook');
            if(!enlace){
                enlace = crearEnlace('stat2-red-icono stat2-red-facebook');
                contenedor.appendChild(enlace);
            }
            prepararInteraccion(enlace);
        });

        document.querySelectorAll('.footer-redes').forEach(contenedor => {
            let enlace = contenedor.querySelector('.footer-red-facebook');
            if(!enlace){
                enlace = crearEnlace('footer-red-icono footer-red-facebook');
                contenedor.appendChild(enlace);
            }
            prepararInteraccion(enlace);
        });
    }

    function iniciarLSPediaComplementos(){
        restaurarCategoriaVocabularioDesdeUrl();
        agregarFacebookRedesSociales();
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciarLSPediaComplementos, { once: true });
    } else {
        iniciarLSPediaComplementos();
    }
})();