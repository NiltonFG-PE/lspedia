/* LSPedia — microinteracciones 3D estables.
   Animaciones locales, de una sola vez y sin alterar reproductores.
*/
(function(){
    'use strict';

    const reducirMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SELECTOR_REVEAL = [
        '.lsp-mejora-card',
        '.stat2-card',
        '.nosotros-apoyo-card',
        '.categoria-card',
        '.categoria-dicc-card',
        '.herr-movil-btn',
        '.menu-juego-btn',
        '.lsp-nueva-palabra'
    ].join(',');

    let observadorReveal = null;

    function estaVisible(elemento){
        if(!elemento || !elemento.isConnected) return false;
        if(elemento.classList.contains('d-none')) return false;
        const estilo = window.getComputedStyle(elemento);
        return estilo.display !== 'none' && estilo.visibility !== 'hidden' && elemento.getClientRects().length > 0;
    }

    function completarReveal(elemento){
        if(!elemento) return;
        elemento.classList.add('lsp-reveal-visible');
        window.setTimeout(function(){
            elemento.classList.remove('lsp-reveal-item', 'lsp-reveal-visible');
            elemento.style.removeProperty('--lsp-reveal-delay');
        }, 520);
    }

    function obtenerObservador(){
        if(observadorReveal || reducirMovimiento || !('IntersectionObserver' in window)) return observadorReveal;
        observadorReveal = new IntersectionObserver(function(entradas){
            entradas.forEach(function(entrada){
                if(!entrada.isIntersecting) return;
                const elemento = entrada.target;
                completarReveal(elemento);
                observadorReveal.unobserve(elemento);
            });
        }, {root:null, rootMargin:'0px 0px -7% 0px', threshold:.08});
        return observadorReveal;
    }

    function prepararRevelados(raiz){
        const base = raiz && raiz.querySelectorAll ? raiz : document;
        const elementos = Array.from(base.querySelectorAll(SELECTOR_REVEAL));
        const observador = obtenerObservador();
        const alto = Math.max(window.innerHeight || 0, 1);
        let retraso = 0;

        elementos.forEach(function(elemento){
            if(elemento.dataset.lspRevealPreparado === '1') return;

            if(reducirMovimiento){
                elemento.dataset.lspRevealPreparado = '1';
                return;
            }

            /* Un bloque oculto puede pertenecer a otra sección. No lo marcamos
               como preparado hasta que realmente llegue a mostrarse. */
            if(!estaVisible(elemento)) return;

            const rect = elemento.getBoundingClientRect();
            /* Lo que ya está visible al cargar no se oculta ni parpadea. */
            if(rect.top < alto * .9 || rect.bottom < 0){
                elemento.dataset.lspRevealPreparado = '1';
                return;
            }

            elemento.dataset.lspRevealPreparado = '1';
            elemento.style.setProperty('--lsp-reveal-delay', Math.min(retraso, 180) + 'ms');
            retraso += 35;
            elemento.classList.add('lsp-reveal-item');
            if(observador) observador.observe(elemento);
            else completarReveal(elemento);
        });
    }

    function animarSeccionVisible(){
        if(reducirMovimiento) return;
        const idsPreferidos = [
            'bloqueBuscadorCategorias',
            'bloqueBuscador',
            'seccionNosotros',
            'herramientasMenuMovil',
            'quizMenuJuegos',
            'panelCategorias'
        ];
        let destino = null;

        for(let i = 0; i < idsPreferidos.length; i += 1){
            const candidato = document.getElementById(idsPreferidos[i]);
            if(estaVisible(candidato)){
                destino = candidato;
                break;
            }
        }

        if(!destino) return;
        destino.classList.remove('lsp-seccion-enter');
        void destino.offsetWidth;
        destino.classList.add('lsp-seccion-enter');
        window.setTimeout(function(){ destino.classList.remove('lsp-seccion-enter'); }, 360);
    }

    function prepararNavegacion(){
        document.addEventListener('click', function(evento){
            const control = evento.target && evento.target.closest
                ? evento.target.closest('#btnInicio,#btnCategorias,#btnHerramientas,#btnSobreNosotros,.mobile-bottom-nav .mbn-item')
                : null;
            if(!control) return;

            /* Dejamos que la navegación original haga primero su trabajo. */
            window.setTimeout(function(){
                animarSeccionVisible();
                prepararRevelados(document);
            }, 70);
        }, {passive:true});
    }

    function refrescarContenidoDinamico(){
        prepararRevelados(document);
        ['resultado','resultadoCategorias'].forEach(function(id){
            const raiz = document.getElementById(id);
            if(raiz) prepararRevelados(raiz);
        });
    }

    function iniciar(){
        document.documentElement.classList.add('lsp-micro-3d-ready');
        prepararNavegacion();
        prepararRevelados(document);

        document.addEventListener('lspedia:datosListos', function(){
            window.setTimeout(refrescarContenidoDinamico, 50);
        });

        /* Respaldo para módulos que terminan de pintar después del evento principal. */
        window.setTimeout(refrescarContenidoDinamico, 700);
        window.setTimeout(refrescarContenidoDinamico, 1800);
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    else iniciar();
})();
