/* LSPedia — foco móvil del buscador
   Lleva el campo a una zona alta y útil de la pantalla mientras se escribe,
   para que la lista de sugerencias tenga espacio real y no quede oculta. */
(function(){
    'use strict';

    if(window.__LSPEDIA_BUSCADOR_MOVIL_FOCUS__) return;
    window.__LSPEDIA_BUSCADOR_MOVIL_FOCUS__ = true;

    const media = window.matchMedia('(max-width: 767.98px)');
    const pares = [
        ['buscar','sugerencias'],
        ['buscarCategorias','sugerenciasCategorias']
    ];

    let scrollProgramado = 0;
    let cerrarTimer = 0;

    function reducirMovimiento(){
        try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
        catch(_e){ return false; }
    }

    function navbarAltura(){
        const nav = document.querySelector('nav.navbar');
        if(!nav) return 78;
        const r = nav.getBoundingClientRect();
        return Math.max(68, Math.min(150, r.height || 78));
    }

    function hayResultados(panel){
        if(!panel) return false;
        if(panel.children.length === 0) return false;
        const estilo = getComputedStyle(panel);
        return estilo.display !== 'none' && estilo.visibility !== 'hidden';
    }

    function activarModo(){
        if(!media.matches) return;
        clearTimeout(cerrarTimer);
        document.body.classList.add('lsp-search-focus');
    }

    function desactivarModoConEspera(){
        clearTimeout(cerrarTimer);
        cerrarTimer = setTimeout(function(){
            const activo = pares.some(function(par){
                const input = document.getElementById(par[0]);
                const panel = document.getElementById(par[1]);
                return input === document.activeElement || hayResultados(panel);
            });
            if(!activo) document.body.classList.remove('lsp-search-focus');
        }, 180);
    }

    function subirBuscador(input){
        if(!media.matches || !input) return;
        cancelAnimationFrame(scrollProgramado);
        scrollProgramado = requestAnimationFrame(function(){
            const bloque = input.closest('#bloqueBuscador, #bloqueBuscadorCategorias') || input.closest('.position-relative') || input;
            const rect = bloque.getBoundingClientRect();
            const vv = window.visualViewport;
            const altoVisible = vv ? vv.height : window.innerHeight;
            const offset = navbarAltura() + 14;
            const demasiadoAbajo = rect.top > Math.max(offset + 80, altoVisible * .38);
            if(!demasiadoAbajo) return;

            const destino = Math.max(0, window.scrollY + rect.top - offset);
            window.scrollTo({
                top: destino,
                behavior: reducirMovimiento() ? 'auto' : 'smooth'
            });
        });
    }

    function preparar(inputId, panelId){
        const input = document.getElementById(inputId);
        const panel = document.getElementById(panelId);
        if(!input || !panel || input.dataset.lspMobileFocus === '1') return;
        input.dataset.lspMobileFocus = '1';

        input.addEventListener('focus', function(){
            if(!media.matches) return;
            activarModo();
            setTimeout(function(){ subirBuscador(input); }, 60);
        });

        input.addEventListener('input', function(){
            if(!media.matches) return;
            if(String(input.value || '').trim()) activarModo();
            setTimeout(function(){
                if(hayResultados(panel)) subirBuscador(input);
            }, 35);
        });

        input.addEventListener('blur', desactivarModoConEspera);

        const observer = new MutationObserver(function(){
            if(!media.matches) return;
            if(hayResultados(panel)){
                activarModo();
                if(input === document.activeElement) subirBuscador(input);
            } else {
                desactivarModoConEspera();
            }
        });
        observer.observe(panel, {childList:true, subtree:false, attributes:true, attributeFilter:['style','class']});
    }

    function iniciar(){
        pares.forEach(function(par){ preparar(par[0], par[1]); });

        document.addEventListener('click', function(e){
            if(!media.matches) return;
            const dentro = e.target && e.target.closest && e.target.closest('#bloqueBuscador, #bloqueBuscadorCategorias, #sugerencias, #sugerenciasCategorias');
            if(!dentro) desactivarModoConEspera();
        }, true);

        window.addEventListener('resize', function(){
            if(!media.matches) document.body.classList.remove('lsp-search-focus');
        }, {passive:true});
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    else iniciar();
})();
