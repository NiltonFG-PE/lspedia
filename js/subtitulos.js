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

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', restaurarCategoriaVocabularioDesdeUrl, { once: true });
    } else {
        restaurarCategoriaVocabularioDesdeUrl();
    }
})();