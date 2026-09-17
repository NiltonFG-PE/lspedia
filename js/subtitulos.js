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
    // El botón ya existe de forma nativa en index.html. Este respaldo también
    // lo crea si alguien abre una copia antigua de la PWA y, sobre todo,
    // neutraliza el :hover persistente de Chrome Android que antes dejaba
    // el icono blanco sobre fondo blanco después de tocarlo.
    function prepararFacebookRedesSociales(){
        const href = 'https://www.facebook.com/lspedia.sign';
        const usuario = '@lspedia.sign';
        const svgFacebook = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>';

        let estilo = document.getElementById('lspediaFacebookEstilos');
        if(!estilo){
            estilo = document.createElement('style');
            estilo.id = 'lspediaFacebookEstilos';
            document.head.appendChild(estilo);
        }

        // Escritorio: mismo efecto de las demás redes (marca llena + icono blanco).
        // Táctil: Chrome puede conservar :hover después del toque; por eso se
        // fuerza siempre icono azul + fondo claro y solo se anima la escala.
        estilo.textContent = `
            .footer-red-facebook,
            .stat2-red-facebook {
                color: #1877F2 !important;
                background: #f8fafc !important;
                border-color: rgba(24,119,242,.20) !important;
                opacity: 1 !important;
                filter: none !important;
                -webkit-tap-highlight-color: transparent !important;
                transition: transform .2s ease, background-color .2s ease, color .2s ease, box-shadow .2s ease !important;
            }
            .footer-red-facebook svg,
            .footer-red-facebook path,
            .stat2-red-facebook svg,
            .stat2-red-facebook path {
                color: #1877F2 !important;
                fill: #1877F2 !important;
                opacity: 1 !important;
                filter: none !important;
            }

            @media (hover: hover) and (pointer: fine) {
                .footer-red-facebook:hover,
                .footer-red-facebook:focus-visible,
                .stat2-red-facebook:hover,
                .stat2-red-facebook:focus-visible {
                    color: #ffffff !important;
                    background: #1877F2 !important;
                    border-color: #1877F2 !important;
                    transform: scale(1.12) !important;
                    box-shadow: 0 7px 18px rgba(24,119,242,.28) !important;
                }
                .footer-red-facebook:hover svg,
                .footer-red-facebook:hover path,
                .footer-red-facebook:focus-visible svg,
                .footer-red-facebook:focus-visible path,
                .stat2-red-facebook:hover svg,
                .stat2-red-facebook:hover path,
                .stat2-red-facebook:focus-visible svg,
                .stat2-red-facebook:focus-visible path {
                    color: #ffffff !important;
                    fill: #ffffff !important;
                }
            }

            @media (hover: none), (pointer: coarse) {
                .footer-red-facebook,
                .footer-red-facebook:hover,
                .footer-red-facebook:focus,
                .footer-red-facebook:focus-visible,
                .footer-red-facebook:active,
                .stat2-red-facebook,
                .stat2-red-facebook:hover,
                .stat2-red-facebook:focus,
                .stat2-red-facebook:focus-visible,
                .stat2-red-facebook:active {
                    color: #1877F2 !important;
                    background: #f8fafc !important;
                    border-color: rgba(24,119,242,.24) !important;
                    opacity: 1 !important;
                    filter: none !important;
                    box-shadow: none !important;
                }
                .footer-red-facebook:active,
                .stat2-red-facebook:active {
                    transform: scale(1.10) !important;
                }
                .footer-red-facebook svg,
                .footer-red-facebook path,
                .footer-red-facebook:hover svg,
                .footer-red-facebook:hover path,
                .footer-red-facebook:focus svg,
                .footer-red-facebook:focus path,
                .footer-red-facebook:active svg,
                .footer-red-facebook:active path,
                .stat2-red-facebook svg,
                .stat2-red-facebook path,
                .stat2-red-facebook:hover svg,
                .stat2-red-facebook:hover path,
                .stat2-red-facebook:focus svg,
                .stat2-red-facebook:focus path,
                .stat2-red-facebook:active svg,
                .stat2-red-facebook:active path {
                    color: #1877F2 !important;
                    fill: #1877F2 !important;
                    opacity: 1 !important;
                    filter: none !important;
                }
            }
        `;

        function limpiarRestosViejos(enlace){
            if(!enlace) return;
            enlace.removeAttribute('style');
            enlace.querySelectorAll('svg,path').forEach(nodo => nodo.removeAttribute('style'));
            delete enlace.dataset.facebookAnimacionLista;
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
            return enlace;
        }

        document.querySelectorAll('.stat2-redes-iconos').forEach(contenedor => {
            let enlace = contenedor.querySelector('.stat2-red-facebook');
            if(!enlace){
                enlace = crearEnlace('stat2-red-icono stat2-red-facebook');
                contenedor.appendChild(enlace);
            }
            limpiarRestosViejos(enlace);
        });

        document.querySelectorAll('.footer-redes').forEach(contenedor => {
            let enlace = contenedor.querySelector('.footer-red-facebook');
            if(!enlace){
                enlace = crearEnlace('footer-red-icono footer-red-facebook');
                contenedor.appendChild(enlace);
            }
            limpiarRestosViejos(enlace);
        });
    }

    function iniciarLSPediaComplementos(){
        restaurarCategoriaVocabularioDesdeUrl();
        prepararFacebookRedesSociales();
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciarLSPediaComplementos, { once: true });
    } else {
        iniciarLSPediaComplementos();
    }
})();