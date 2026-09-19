/* LSPedia — foco móvil del buscador
   Mantiene el buscador en la zona alta realmente visible de Chrome/Android
   cuando aparece el teclado y reserva el resto del viewport para resultados. */
(function(){
    'use strict';

    if(window.__LSPEDIA_BUSCADOR_MOVIL_FOCUS__) return;
    window.__LSPEDIA_BUSCADOR_MOVIL_FOCUS__ = true;

    const media = window.matchMedia('(max-width: 767.98px)');
    const pares = [
        ['buscar','sugerencias'],
        ['buscarCategorias','sugerenciasCategorias']
    ];

    let cerrarTimer = 0;
    let realinearTimer = 0;
    let inputActivo = null;
    let panelActivo = null;

    function visible(elemento){
        if(!elemento || !elemento.isConnected) return false;
        const estilo = getComputedStyle(elemento);
        return estilo.display !== 'none' && estilo.visibility !== 'hidden' && elemento.getClientRects().length > 0;
    }

    function hayResultados(panel){
        return !!(panel && panel.children.length && visible(panel));
    }

    function lineaBuscador(input){
        return input && (
            input.closest('.buscador-indice-linea') ||
            input.closest('.col-lg-8.position-relative') ||
            input.closest('#bloqueBuscador, #bloqueBuscadorCategorias') ||
            input
        );
    }

    function viewport(){
        const vv = window.visualViewport;
        return {
            offsetTop: vv ? Math.max(0, Number(vv.offsetTop) || 0) : 0,
            height: vv ? Math.max(1, Number(vv.height) || window.innerHeight) : window.innerHeight
        };
    }

    function margenSuperiorVisible(vp){
        const nav = document.querySelector('nav.navbar');
        if(!nav) return 10;

        const r = nav.getBoundingClientRect();
        const abajoVisual = r.bottom - vp.offsetTop;
        const arribaVisual = r.top - vp.offsetTop;

        // Solo reserva espacio para la barra de LSPedia cuando de verdad está
        // dentro del viewport visual. Con el teclado abierto Chrome puede
        // desplazar el viewport y dejar esa barra fuera de la zona visible.
        if(abajoVisual > 0 && arribaVisual < vp.height && abajoVisual < vp.height * .42){
            return Math.max(10, abajoVisual + 8);
        }
        return 10;
    }

    function ajustarAlturaPanel(panel){
        if(!panel || !visible(panel)) return;
        const vp = viewport();
        const r = panel.getBoundingClientRect();
        const topVisual = Math.max(0, r.top - vp.offsetTop);
        const disponible = Math.floor(vp.height - topVisual - 10);
        const alto = Math.max(155, Math.min(470, disponible));
        panel.style.setProperty('max-height', alto + 'px', 'important');
    }

    function alinearBuscador(input, panel){
        if(!media.matches || !input || document.activeElement !== input) return;

        const objetivo = lineaBuscador(input);
        if(!objetivo) return;

        const vp = viewport();
        const rect = objetivo.getBoundingClientRect();
        const margen = margenSuperiorVisible(vp);
        const topVisual = rect.top - vp.offsetTop;
        const delta = topVisual - margen;

        // Chrome ya hace su propio scroll al abrir el teclado. Corregimos solo
        // la diferencia restante respecto de la parte superior REAL visible.
        if(Math.abs(delta) > 4){
            window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
        }

        requestAnimationFrame(function(){ ajustarAlturaPanel(panel); });
    }

    function programarAlineado(input, panel){
        clearTimeout(realinearTimer);
        [25, 140, 320, 620].forEach(function(ms){
            setTimeout(function(){ alinearBuscador(input, panel); }, ms);
        });
    }

    function activarModo(input, panel){
        if(!media.matches) return;
        clearTimeout(cerrarTimer);
        inputActivo = input || inputActivo;
        panelActivo = panel || panelActivo;
        document.body.classList.add('lsp-search-focus');
        if(inputActivo) programarAlineado(inputActivo, panelActivo);
    }

    function limpiarPaneles(){
        pares.forEach(function(par){
            const panel = document.getElementById(par[1]);
            if(panel) panel.style.removeProperty('max-height');
        });
    }

    function desactivarModoConEspera(){
        clearTimeout(cerrarTimer);
        cerrarTimer = setTimeout(function(){
            const algunoActivo = pares.some(function(par){
                const input = document.getElementById(par[0]);
                const panel = document.getElementById(par[1]);
                return input === document.activeElement || hayResultados(panel);
            });
            if(algunoActivo) return;
            document.body.classList.remove('lsp-search-focus');
            inputActivo = null;
            panelActivo = null;
            limpiarPaneles();
        }, 200);
    }

    function preparar(inputId, panelId){
        const input = document.getElementById(inputId);
        const panel = document.getElementById(panelId);
        if(!input || !panel || input.dataset.lspMobileFocus === '1') return;
        input.dataset.lspMobileFocus = '1';

        input.addEventListener('focus', function(){
            if(!media.matches) return;
            activarModo(input, panel);
        });

        input.addEventListener('input', function(){
            if(!media.matches) return;
            activarModo(input, panel);
            setTimeout(function(){ ajustarAlturaPanel(panel); }, 45);
        });

        input.addEventListener('blur', desactivarModoConEspera);

        const observer = new MutationObserver(function(){
            if(!media.matches) return;
            if(hayResultados(panel)){
                activarModo(input, panel);
                setTimeout(function(){ ajustarAlturaPanel(panel); }, 20);
            }else{
                desactivarModoConEspera();
            }
        });
        observer.observe(panel, {childList:true, subtree:false, attributes:true, attributeFilter:['style','class']});
    }

    function reaccionarViewport(){
        if(!media.matches || !document.body.classList.contains('lsp-search-focus')) return;
        clearTimeout(realinearTimer);
        realinearTimer = setTimeout(function(){
            if(inputActivo && document.activeElement === inputActivo){
                alinearBuscador(inputActivo, panelActivo);
            }else if(panelActivo){
                ajustarAlturaPanel(panelActivo);
            }
        }, 35);
    }

    function iniciar(){
        pares.forEach(function(par){ preparar(par[0], par[1]); });

        document.addEventListener('click', function(e){
            if(!media.matches) return;
            const dentro = e.target && e.target.closest && e.target.closest('#bloqueBuscador, #bloqueBuscadorCategorias, #sugerencias, #sugerenciasCategorias');
            if(!dentro) desactivarModoConEspera();
        }, true);

        window.addEventListener('resize', function(){
            if(!media.matches){
                document.body.classList.remove('lsp-search-focus');
                limpiarPaneles();
                return;
            }
            reaccionarViewport();
        }, {passive:true});

        if(window.visualViewport){
            window.visualViewport.addEventListener('resize', reaccionarViewport, {passive:true});
            window.visualViewport.addEventListener('scroll', reaccionarViewport, {passive:true});
        }
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    else iniciar();
})();