/* LSPedia — aislamiento de Mi LSPedia por sección.
   Mi LSPedia pertenece a las vistas de Diccionario/Vocabulario y nunca debe
   mezclarse visualmente con Herramientas ni Sobre Nosotros. */
(function(){
    'use strict';
    if(window.__LSPediaMiSecciones) return;
    window.__LSPediaMiSecciones = true;

    const CLASE_OCULTA = 'lsp-mi-lspedia-fuera-de-vista';

    function visible(el){
        if(!el) return false;
        if(el.hidden || el.classList.contains('d-none')) return false;
        const estilo = window.getComputedStyle(el);
        if(estilo.display === 'none' || estilo.visibility === 'hidden') return false;
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    function vistaUrl(){
        try {
            return String(new URLSearchParams(window.location.search).get('vista') || '')
                .trim().toLowerCase();
        } catch(_e) {
            return '';
        }
    }

    function debeOcultarse(){
        const vista = vistaUrl();
        if(vista === 'nosotros' || vista.indexOf('herramientas') === 0) return true;

        // Respaldo para navegación SPA mientras la URL termina de actualizarse.
        const btnHerramientas = document.getElementById('btnHerramientas');
        const btnNosotros = document.getElementById('btnNosotros') || document.getElementById('btnSobreNosotros');
        if(btnHerramientas && btnHerramientas.classList.contains('active')) return true;
        if(btnNosotros && btnNosotros.classList.contains('active')) return true;

        // Última barrera: si una de estas secciones está realmente visible,
        // Mi LSPedia permanece fuera aunque otro script olvide marcar el botón.
        if(visible(document.getElementById('seccionNosotros'))) return true;
        if(visible(document.getElementById('seccionHerramientas'))) return true;
        if(visible(document.getElementById('herramientasMenuMovil'))) return true;

        return false;
    }

    function sincronizar(){
        const ocultar = debeOcultarse();
        document.documentElement.classList.toggle(CLASE_OCULTA, ocultar);

        const panel = document.getElementById('miLspediaHub');
        if(panel){
            panel.setAttribute('aria-hidden', ocultar ? 'true' : 'false');
            if('inert' in panel) panel.inert = ocultar;
        }
    }

    function instalarEstilo(){
        if(document.getElementById('lspedia-mi-secciones-css')) return;
        const style = document.createElement('style');
        style.id = 'lspedia-mi-secciones-css';
        style.textContent =
            'html.' + CLASE_OCULTA + ' #miLspediaHub{' +
            'display:none!important;visibility:hidden!important;' +
            '}';
        document.head.appendChild(style);
    }

    function programar(){
        sincronizar();
        requestAnimationFrame(sincronizar);
        setTimeout(sincronizar, 80);
    }

    function envolverHistorial(nombre){
        const original = history[nombre];
        if(typeof original !== 'function' || original.__lspediaMiSecciones) return;
        const envuelto = function(){
            const resultado = original.apply(this, arguments);
            setTimeout(sincronizar, 0);
            return resultado;
        };
        envuelto.__lspediaMiSecciones = true;
        try { history[nombre] = envuelto; } catch(_e) {}
    }

    function iniciar(){
        instalarEstilo();
        sincronizar();
        envolverHistorial('pushState');
        envolverHistorial('replaceState');

        document.addEventListener('click', function(){ setTimeout(programar, 0); }, true);
        window.addEventListener('popstate', programar);
        window.addEventListener('pageshow', programar);

        if('MutationObserver' in window){
            const observer = new MutationObserver(function(cambios){
                const relevante = cambios.some(function(cambio){
                    if(cambio.type === 'attributes') return true;
                    return Array.from(cambio.addedNodes || []).some(function(nodo){
                        return nodo && nodo.nodeType === 1 && (
                            nodo.id === 'miLspediaHub' ||
                            nodo.id === 'seccionNosotros' ||
                            nodo.id === 'seccionHerramientas' ||
                            (nodo.querySelector && nodo.querySelector('#miLspediaHub,#seccionNosotros,#seccionHerramientas'))
                        );
                    });
                });
                if(relevante) setTimeout(sincronizar, 0);
            });
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class','style','hidden']
            });
        }
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
