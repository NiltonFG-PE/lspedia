/*
 * LSPedia — punto de entrada de Subtítulos.
 *
 * El contenido original de este archivo se conserva íntegro en
 * js/subtitulos-core.js. Este pequeño punto de entrada permite cargar,
 * además, el módulo independiente que corrige los enlaces para compartir
 * categorías sin mezclar esa lógica con el módulo de Subtítulos.
 *
 * document.write se usa aquí de forma deliberada: este archivo se carga
 * mediante un <script> síncrono durante el parseo de index.html, por lo que
 * así mantenemos exactamente el mismo orden de ejecución que tenía antes.
 */
(function(){
    'use strict';

    if(!window.__LSPEDIA_SUBTITULOS_CORE_CARGADO__){
        window.__LSPEDIA_SUBTITULOS_CORE_CARGADO__ = true;
        document.write('<script src="js/subtitulos-core.js?v=20260915"><\/script>');
    }

    if(!window.__LSPEDIA_CATEGORIAS_COMPARTIR_CARGADO__){
        window.__LSPEDIA_CATEGORIAS_COMPARTIR_CARGADO__ = true;
        document.write('<script src="js/categorias-compartir.js?v=20260915b"><\/script>');
    }
})();