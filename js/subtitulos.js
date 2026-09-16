/*
 * LSPedia — punto de entrada de Subtítulos + restauración de categorías.
 *
 * El módulo original de Subtítulos vive en js/subtitulos-core.js.
 * Este archivo también contiene un respaldo MUY simple para los enlaces
 * directos de Vocabulario, porque debe funcionar igual en escritorio,
 * móvil, PWA y al abrir un enlace desde WhatsApp/redes.
 */
(function(){
    'use strict';

    if(!window.__LSPEDIA_SUBTITULOS_CORE_CARGADO__){
        window.__LSPEDIA_SUBTITULOS_CORE_CARGADO__ = true;
        document.write('<script src="js/subtitulos-core.js?v=20260915"><\/script>');
    }

    if(!window.__LSPEDIA_CATEGORIAS_COMPARTIR_CARGADO__){
        window.__LSPEDIA_CATEGORIAS_COMPARTIR_CARGADO__ = true;
        document.write('<script src="js/categorias-compartir.js?v=20260915d"><\/script>');
    }

    function restaurarCategoriaVocabularioDesdeUrl(){
        const params = new URLSearchParams(window.location.search);
        const vista = String(params.get('vista') || '').toLowerCase();
        const categoria = String(params.get('categoria') || '').trim();

        if((vista !== 'vocabulario' && vista !== 'temas') || !categoria) return;
        if(window.__LSPEDIA_CATEGORIA_URL_RESTAURADA__) return;
        window.__LSPEDIA_CATEGORIA_URL_RESTAURADA__ = true;

        // 1. Abrimos la sección Vocabulario UNA sola vez.
        // script.js normalmente ya lo hace al procesar palabras.json,
        // pero este respaldo no depende de ese orden de carga.
        const abrirVocabulario = () => {
            const btn = document.getElementById('btnCategorias');
            if(btn){
                try { btn.click(); } catch(_e) {}
            }

            // El clic normal deja la URL como ?vista=vocabulario.
            // Reponemos enseguida la categoría exacta compartida.
            const url = window.location.pathname
                + '?vista=vocabulario&categoria=' + encodeURIComponent(categoria);
            try {
                window.history.replaceState(
                    { tipo: 'categoriaVocabulario', categoria },
                    '',
                    url
                );
            } catch(_e) {}
        };

        // 2. Cuando Hoja 2 / vocabulario.json esté listo, mostramos
        // directamente la categoría. No se comprueba el DOM ni clases
        // de móvil/escritorio: mostrarCategoria es la fuente de verdad.
        const mostrar = () => {
            if(typeof window.mostrarCategoria !== 'function') return false;
            try {
                window.mostrarCategoria(categoria, { noActualizarHistorial: true });
                return true;
            } catch(error) {
                console.warn('LSPedia: no se pudo restaurar la categoría compartida:', error);
                return false;
            }
        };

        abrirVocabulario();

        if(window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function'){
            if(typeof window.QuizV2.asegurarBancoCargado === 'function'){
                window.QuizV2.asegurarBancoCargado();
            }
            window.QuizV2.onBancoListo(() => {
                // Un pequeño frame de espera permite que mostrarCategorias()
                // termine de pintar antes de reemplazarlo por los resultados.
                requestAnimationFrame(() => requestAnimationFrame(mostrar));
            });
        }

        // Respaldo por si el banco ya estaba cargado antes de registrar
        // el listener o si otro script tarda en exponer mostrarCategoria.
        [250, 700, 1500, 3000].forEach(ms => {
            setTimeout(() => {
                const paramsAhora = new URLSearchParams(window.location.search);
                if(String(paramsAhora.get('categoria') || '').trim() !== categoria) return;
                mostrar();
            }, ms);
        });
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', restaurarCategoriaVocabularioDesdeUrl, { once: true });
    } else {
        restaurarCategoriaVocabularioDesdeUrl();
    }
})();