/* LSPedia — cargador de mejoras de producto.
   Mantiene intacta la base existente y añade la sección general "Lo nuevo"
   y la capa bilingüe Español/Inglés. */
(function(){
    'use strict';

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

    cargar('js/mejoras-producto-base.js', function(){
        cargar('js/lo-nuevo.js');
        cargar('js/i18n.js', function(){
            cargar('js/i18n-restaurar.js');
        });
    });
})();