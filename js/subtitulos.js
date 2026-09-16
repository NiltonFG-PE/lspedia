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
        // Navigation Timing conserva la URL usada para abrir realmente
        // el documento aunque después la SPA haga pushState/replaceState.
        try {
            if(window.performance && typeof performance.getEntriesByType === 'function'){
                const entradas = performance.getEntriesByType('navigation');
                if(entradas && entradas[0] && entradas[0].name){
                    const desdeNavegacion = leerDestinoCategoria(entradas[0].name);
                    if(desdeNavegacion) return desdeNavegacion;
                }
            }
        } catch(_e) {}

        // Respaldo: en navegadores sin Navigation Timing, usamos la URL
        // que existe exactamente en este momento de ejecución.
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

        // 1. Abre Vocabulario solo si todavía no está abierta la sección.
        // Si script.js ya la abrió, no volvemos a simular otro clic.
        const cuerpo = document.body;
        const yaEnVocabulario = !!(cuerpo && cuerpo.classList.contains('vista-temas-movil'));
        if(!yaEnVocabulario){
            const btn = document.getElementById('btnCategorias');
            if(btn){
                try { btn.click(); } catch(_e) {}
            }
        }

        // El clic anterior (o el arranque normal de script.js) puede haber
        // reducido la URL a ?vista=vocabulario. La restauramos enseguida.
        reponerUrl();

        // 2. Mostrar la categoría exacta cuando Hoja 2 esté disponible.
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
                // Espera dos frames para que mostrarCategorias() termine de
                // pintar antes de sustituirlo por los resultados exactos.
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    mostrar();
                    reponerUrl();
                }));
            });
        }

        // Respaldo por si el banco ya estaba cargado o algún módulo tarda
        // en exponer mostrarCategoria. Nunca abandonamos la categoría original.
        [50, 200, 500, 1000, 1800, 3000, 5000].forEach(ms => {
            setTimeout(() => {
                mostrar();
                reponerUrl();
            }, ms);
        });
    }

    // Facebook oficial de LSPedia. Se agrega a los dos grupos de redes
    // que ya existen en la página sin duplicarlo si el script se ejecuta
    // más de una vez (por ejemplo, al usar la PWA o restaurar una vista).
    function agregarFacebookRedesSociales(){
        const href = 'https://facebook.com/lspedia.sign';
        const usuario = '@lspedia.sign';
        const svgFacebook = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>';

        if(!document.getElementById('lspediaFacebookEstilos')){
            const estilo = document.createElement('style');
            estilo.id = 'lspediaFacebookEstilos';
            estilo.textContent = '.stat2-red-facebook:hover,.footer-red-facebook:hover{background-color:#1877F2!important;color:#fff!important;}';
            document.head.appendChild(estilo);
        }

        document.querySelectorAll('.stat2-redes-iconos').forEach(contenedor => {
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

        document.querySelectorAll('.footer-redes').forEach(contenedor => {
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