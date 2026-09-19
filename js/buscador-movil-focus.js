/* LSPedia — búsqueda móvil tipo app
   ------------------------------------------------------------
   En Android/Chrome el teclado reduce y puede desplazar el visualViewport.
   En lugar de intentar empujar el buscador original con scroll/fixed, este
   módulo mueve temporalmente EL MISMO buscador y EL MISMO panel de resultados
   a una capa propia que ocupa exactamente el visualViewport disponible.

   Ventajas:
   - el buscador siempre queda arriba de la zona realmente visible;
   - los resultados usan todo el espacio hasta el teclado;
   - no los tapan "Tu aprendizaje", la navegación ni "Instalar LSPedia";
   - no se clonan inputs ni resultados: se conservan todos sus listeners;
   - al cerrar, los nodos vuelven a su lugar original.
*/
(function(){
    'use strict';

    if(window.__LSPEDIA_BUSCADOR_MOVIL_OVERLAY__) return;
    window.__LSPEDIA_BUSCADOR_MOVIL_OVERLAY__ = true;

    const media = window.matchMedia('(max-width: 767.98px)');
    const configuraciones = [
        {
            inputId: 'buscar',
            panelId: 'sugerencias',
            titulo: 'Buscar en Diccionario'
        },
        {
            inputId: 'buscarCategorias',
            panelId: 'sugerenciasCategorias',
            titulo: 'Buscar en Vocabulario'
        }
    ];

    let estado = null;
    let cerrando = false;
    let blurTimer = 0;

    function crearMarcador(nombre){
        return document.createComment('lspedia-' + nombre);
    }

    function obtenerLinea(input){
        if(!input) return null;
        return input.closest('.buscador-indice-linea') ||
               input.closest('.input-group') ||
               input.parentElement;
    }

    function idiomaIngles(){
        try {
            return !!(window.LSPediaIdioma && typeof window.LSPediaIdioma.obtener === 'function' && window.LSPediaIdioma.obtener() === 'en');
        } catch(_e){ return false; }
    }

    function traducirTitulo(titulo){
        if(!idiomaIngles()) return titulo;
        return titulo.indexOf('Vocabulario') >= 0 ? 'Search Vocabulary' : 'Search Dictionary';
    }

    function geometriaViewport(){
        const vv = window.visualViewport;
        if(vv){
            return {
                top: Math.max(0, Number(vv.offsetTop) || 0),
                left: Math.max(0, Number(vv.offsetLeft) || 0),
                width: Math.max(1, Number(vv.width) || window.innerWidth),
                height: Math.max(1, Number(vv.height) || window.innerHeight)
            };
        }
        return {top:0,left:0,width:window.innerWidth,height:window.innerHeight};
    }

    function ajustarOverlay(){
        if(!estado || !estado.overlay || !estado.overlay.isConnected) return;
        const g = geometriaViewport();
        estado.overlay.style.setProperty('--lsp-vv-top', g.top + 'px');
        estado.overlay.style.setProperty('--lsp-vv-left', g.left + 'px');
        estado.overlay.style.setProperty('--lsp-vv-width', g.width + 'px');
        estado.overlay.style.setProperty('--lsp-vv-height', g.height + 'px');
    }

    function crearOverlay(config, input, panel, linea){
        const overlay = document.createElement('div');
        overlay.id = 'lspMobileSearchOverlay';
        overlay.className = 'lsp-mobile-search-overlay';
        overlay.setAttribute('role','dialog');
        overlay.setAttribute('aria-modal','true');
        overlay.setAttribute('aria-label', traducirTitulo(config.titulo));

        const shell = document.createElement('div');
        shell.className = 'lsp-mobile-search-shell';

        const cabecera = document.createElement('div');
        cabecera.className = 'lsp-mobile-search-head';

        const titulo = document.createElement('div');
        titulo.className = 'lsp-mobile-search-title';
        titulo.textContent = traducirTitulo(config.titulo);

        const cerrar = document.createElement('button');
        cerrar.type = 'button';
        cerrar.className = 'lsp-mobile-search-close';
        cerrar.setAttribute('aria-label', idiomaIngles() ? 'Close search' : 'Cerrar búsqueda');
        cerrar.innerHTML = '<span aria-hidden="true">×</span>';

        const controles = document.createElement('div');
        controles.className = 'lsp-mobile-search-controls';

        const resultados = document.createElement('div');
        resultados.className = 'lsp-mobile-search-results';

        cabecera.appendChild(titulo);
        cabecera.appendChild(cerrar);
        shell.appendChild(cabecera);
        shell.appendChild(controles);
        shell.appendChild(resultados);
        overlay.appendChild(shell);

        cerrar.addEventListener('click', function(){ cerrarOverlay(true); });
        overlay.addEventListener('keydown', function(e){
            if(e.key === 'Escape'){
                e.preventDefault();
                cerrarOverlay(true);
            }
        });

        // Si se toca un resultado, permitimos primero que el manejador actual
        // de LSPedia abra la palabra y cerramos inmediatamente después.
        resultados.addEventListener('click', function(e){
            const item = e.target && e.target.closest && e.target.closest('.list-group-item, [data-pred-index]');
            if(item){
                setTimeout(function(){ cerrarOverlay(false); }, 80);
            }
        });

        controles.appendChild(linea);
        resultados.appendChild(panel);
        document.body.appendChild(overlay);

        return {overlay:overlay, controles:controles, resultados:resultados};
    }

    function abrirOverlay(config, input, panel){
        if(!media.matches || cerrando) return;
        if(estado && estado.input === input){
            ajustarOverlay();
            return;
        }
        if(estado) cerrarOverlay(false);

        const linea = obtenerLinea(input);
        if(!linea || !panel || !linea.parentNode || !panel.parentNode) return;

        const marcadorLinea = crearMarcador('linea-buscador');
        const marcadorPanel = crearMarcador('panel-sugerencias');
        linea.parentNode.insertBefore(marcadorLinea, linea);
        panel.parentNode.insertBefore(marcadorPanel, panel);

        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const previoHtmlOverflow = document.documentElement.style.overflow;
        const previoBodyOverflow = document.body.style.overflow;

        const ui = crearOverlay(config, input, panel, linea);
        estado = {
            config: config,
            input: input,
            panel: panel,
            linea: linea,
            marcadorLinea: marcadorLinea,
            marcadorPanel: marcadorPanel,
            overlay: ui.overlay,
            scrollX: scrollX,
            scrollY: scrollY,
            previoHtmlOverflow: previoHtmlOverflow,
            previoBodyOverflow: previoBodyOverflow
        };

        document.body.classList.add('lsp-search-overlay-active','lsp-search-focus');
        document.documentElement.classList.add('lsp-search-overlay-active');
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        ajustarOverlay();

        // Mover un elemento enfocado puede provocar blur en algunos Android.
        // Recuperamos el foco sin pedir al navegador que vuelva a desplazar la página.
        requestAnimationFrame(function(){
            try { input.focus({preventScroll:true}); }
            catch(_e){ try { input.focus(); } catch(_e2){} }
            ajustarOverlay();
        });
    }

    function restaurarNodo(nodo, marcador){
        if(!nodo || !marcador || !marcador.parentNode) return;
        marcador.parentNode.insertBefore(nodo, marcador.nextSibling);
        marcador.remove();
    }

    function cerrarOverlay(devolverFoco){
        if(!estado || cerrando) return;
        cerrando = true;
        clearTimeout(blurTimer);

        const actual = estado;

        // Primero restauramos los nodos reales; así ningún módulo ve IDs
        // duplicados ni pierde sus listeners.
        restaurarNodo(actual.linea, actual.marcadorLinea);
        restaurarNodo(actual.panel, actual.marcadorPanel);

        if(actual.overlay && actual.overlay.parentNode) actual.overlay.remove();

        document.body.classList.remove('lsp-search-overlay-active','lsp-search-focus');
        document.documentElement.classList.remove('lsp-search-overlay-active');
        document.documentElement.style.overflow = actual.previoHtmlOverflow;
        document.body.style.overflow = actual.previoBodyOverflow;

        // Limpia límites de altura puestos por versiones anteriores.
        actual.panel.style.removeProperty('max-height');

        estado = null;
        cerrando = false;

        // Si se cerró con la X, quitamos teclado. Al elegir un resultado no
        // forzamos foco alguno porque mostrarPalabra controla la navegación.
        if(devolverFoco){
            try { actual.input.blur(); } catch(_e){}
            requestAnimationFrame(function(){
                window.scrollTo(actual.scrollX, actual.scrollY);
            });
        }
    }

    function preparar(config){
        const input = document.getElementById(config.inputId);
        const panel = document.getElementById(config.panelId);
        if(!input || !panel || input.dataset.lspMobileOverlay === '1') return;
        input.dataset.lspMobileOverlay = '1';

        input.addEventListener('focus', function(){
            if(media.matches) abrirOverlay(config,input,panel);
        });

        input.addEventListener('blur', function(){
            // No cerrar al tocar un resultado o el botón de lupa dentro de la
            // misma capa. Solo cerramos si el foco salió realmente del diálogo.
            clearTimeout(blurTimer);
            blurTimer = setTimeout(function(){
                if(!estado || estado.input !== input) return;
                const activo = document.activeElement;
                if(activo && estado.overlay && estado.overlay.contains(activo)) return;
                const panelVisible = panel.children.length > 0 && getComputedStyle(panel).display !== 'none';
                if(!panelVisible) cerrarOverlay(false);
            }, 220);
        });
    }

    function reaccionarViewport(){
        if(!media.matches){
            if(estado) cerrarOverlay(false);
            return;
        }
        ajustarOverlay();
    }

    function iniciar(){
        configuraciones.forEach(preparar);

        if(window.visualViewport){
            window.visualViewport.addEventListener('resize', reaccionarViewport, {passive:true});
            window.visualViewport.addEventListener('scroll', reaccionarViewport, {passive:true});
        }
        window.addEventListener('resize', reaccionarViewport, {passive:true});
        window.addEventListener('orientationchange', reaccionarViewport, {passive:true});
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    else iniciar();
})();