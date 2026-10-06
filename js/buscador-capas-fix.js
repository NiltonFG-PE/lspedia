/* ============================================================
   LSPedia — corrección de capas del buscador
   ------------------------------------------------------------
   Eleva temporalmente el contexto correcto cuando el panel de
   sugerencias está abierto. Evita que "Lo nuevo", categorías u otras
   tarjetas con transform/isolation se pinten encima del desplegable.
   ============================================================ */
(function(){
    'use strict';

    if(window.__LSPediaBuscadorCapasFix) return;
    window.__LSPediaBuscadorCapasFix = true;

    function panelVisible(panel){
        if(!panel || !panel.isConnected) return false;
        if(!panel.children.length && !String(panel.textContent || '').trim()) return false;

        const estilo = window.getComputedStyle(panel);
        if(estilo.display === 'none' || estilo.visibility === 'hidden') return false;
        if(Number(estilo.opacity) === 0) return false;

        return panel.getClientRects().length > 0;
    }

    function actualizar(){
        const sugerencias = document.getElementById('sugerencias');
        const hero = document.getElementById('filaHeroPrincipal');
        const sugerenciasVocab = document.getElementById('sugerenciasCategorias');
        const bloqueVocab = document.getElementById('bloqueBuscadorCategorias');

        if(hero){
            hero.classList.toggle('lsp-buscador-desplegado', panelVisible(sugerencias));
        }

        if(bloqueVocab){
            bloqueVocab.classList.toggle('lsp-buscador-desplegado', panelVisible(sugerenciasVocab));
        }
    }

    function observar(panel){
        if(!panel || !('MutationObserver' in window)) return;
        const observer = new MutationObserver(function(){
            requestAnimationFrame(actualizar);
        });
        observer.observe(panel, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden']
        });
    }

    function iniciar(){
        const sugerencias = document.getElementById('sugerencias');
        const sugerenciasVocab = document.getElementById('sugerenciasCategorias');

        observar(sugerencias);
        observar(sugerenciasVocab);

        ['buscar', 'buscarCategorias'].forEach(function(id){
            const input = document.getElementById(id);
            if(!input) return;
            input.addEventListener('input', function(){ requestAnimationFrame(actualizar); }, {passive:true});
            input.addEventListener('focus', function(){ requestAnimationFrame(actualizar); }, {passive:true});
            input.addEventListener('blur', function(){ setTimeout(actualizar, 80); }, {passive:true});
        });

        document.addEventListener('click', function(){
            setTimeout(actualizar, 0);
        }, {passive:true});

        document.addEventListener('lspedia:datosListos', function(){
            setTimeout(actualizar, 0);
        });

        window.addEventListener('resize', actualizar, {passive:true});

        actualizar();
        setTimeout(actualizar, 250);
        setTimeout(actualizar, 900);
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    }else{
        iniciar();
    }
})();