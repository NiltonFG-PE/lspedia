/* LSPedia — búsqueda móvil tipo app
   ------------------------------------------------------------
   Mueve temporalmente el buscador y su panel a una capa propia que ocupa
   el visualViewport. La capa participa además en el historial del navegador:
   el botón Atrás de Android primero cierra la búsqueda y vuelve a la pantalla
   anterior de LSPedia, en lugar de sacar al usuario del sitio.
*/
(function(){
    'use strict';

    if(window.__LSPEDIA_BUSCADOR_MOVIL_OVERLAY__) return;
    window.__LSPEDIA_BUSCADOR_MOVIL_OVERLAY__ = true;

    const media = window.matchMedia('(max-width: 767.98px)');
    const HISTORIA_CLAVE = '__lspMobileSearchOverlay';
    const configuraciones = [
        { inputId:'buscar', panelId:'sugerencias', titulo:'Buscar en Diccionario' },
        { inputId:'buscarCategorias', panelId:'sugerenciasCategorias', titulo:'Buscar en Vocabulario' }
    ];

    let estado = null;
    let cerrando = false;
    let blurTimer = 0;
    let fallbackAtrasTimer = 0;
    let accionPendiente = null;
    let desenfocarAlCerrar = true;

    function limpiarMarcaHuerfana(){
        const actual = window.history.state;
        if(!actual || typeof actual !== 'object' || !actual[HISTORIA_CLAVE]) return;
        const limpio = Object.assign({}, actual);
        delete limpio[HISTORIA_CLAVE];
        try { window.history.replaceState(limpio, '', window.location.href); }
        catch(_e){}
    }

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
        return { top:0, left:0, width:window.innerWidth, height:window.innerHeight };
    }

    function claveOrientacion(){
        try {
            if(window.screen && window.screen.orientation && window.screen.orientation.type){
                return String(window.screen.orientation.type).split('-')[0];
            }
        } catch(_e){}
        try {
            return window.screen.width > window.screen.height ? 'landscape' : 'portrait';
        } catch(_e){
            return 'unknown';
        }
    }

    function ajustarOverlay(){
        if(!estado || !estado.overlay || !estado.overlay.isConnected) return;
        const g = geometriaViewport();
        estado.overlay.style.setProperty('--lsp-vv-top', g.top + 'px');
        estado.overlay.style.setProperty('--lsp-vv-left', g.left + 'px');
        estado.overlay.style.setProperty('--lsp-vv-width', g.width + 'px');
        estado.overlay.style.setProperty('--lsp-vv-height', g.height + 'px');
    }

    function historialOverlayActivo(){
        if(!estado || !estado.historialToken) return false;
        const actual = window.history.state;
        return !!(actual && actual[HISTORIA_CLAVE] === estado.historialToken);
    }

    function agregarEntradaHistorial(){
        if(!estado) return;
        const previo = window.history.state && typeof window.history.state === 'object'
            ? Object.assign({}, window.history.state)
            : {};
        delete previo[HISTORIA_CLAVE];

        const token = 'buscar-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
        estado.historialToken = token;
        estado.estadoHistorialPrevio = previo;

        try {
            window.history.pushState(
                Object.assign({}, previo, { [HISTORIA_CLAVE]: token }),
                '',
                window.location.href
            );
        } catch(_e){
            estado.historialToken = '';
        }
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

        cerrar.addEventListener('click', function(){ solicitarRegreso(true); });
        overlay.addEventListener('keydown', function(e){
            if(e.key === 'Escape'){
                e.preventDefault();
                solicitarRegreso(true);
            }
        });

        /* Marcar desde pointerdown evita confundir la desaparición del teclado
           al tocar un resultado con una pulsación del botón Atrás. */
        resultados.addEventListener('pointerdown', function(e){
            const item = e.target && e.target.closest && e.target.closest('.list-group-item, [data-pred-index]');
            if(!item || !estado) return;
            estado.seleccionandoResultado = true;
            clearTimeout(estado.seleccionTimer);
            estado.seleccionTimer = setTimeout(function(){
                if(estado) estado.seleccionandoResultado = false;
            }, 900);
        }, true);

        /* Consumimos primero la entrada temporal de historial. Después del
           popstate reproducimos el click real del resultado. Así la palabra
           elegida conserva su propio historial sin dejar una entrada fantasma. */
        resultados.addEventListener('click', function(e){
            const item = e.target && e.target.closest && e.target.closest('.list-group-item, [data-pred-index]');
            if(!item) return;

            if(historialOverlayActivo()){
                e.preventDefault();
                e.stopPropagation();
                if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                const itemReal = item;
                solicitarRegreso(false, function(){
                    if(itemReal && itemReal.isConnected){
                        try { itemReal.click(); } catch(_e){}
                    }
                });
                return;
            }

            setTimeout(function(){
                if(estado) cerrarOverlay(false);
            }, 80);
        }, true);

        controles.appendChild(linea);
        resultados.appendChild(panel);
        document.body.appendChild(overlay);

        return { overlay, controles, resultados };
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

        const g = geometriaViewport();
        const ui = crearOverlay(config, input, panel, linea);
        estado = {
            config,
            input,
            panel,
            linea,
            marcadorLinea,
            marcadorPanel,
            overlay: ui.overlay,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            previoHtmlOverflow: document.documentElement.style.overflow,
            previoBodyOverflow: document.body.style.overflow,
            historialToken: '',
            estadoHistorialPrevio: null,
            minimaAlturaViewport: g.height,
            ultimaAlturaViewport: g.height,
            orientacionInicial: claveOrientacion(),
            seleccionandoResultado: false,
            seleccionTimer: 0
        };

        document.body.classList.add('lsp-search-overlay-active','lsp-search-focus');
        document.documentElement.classList.add('lsp-search-overlay-active');
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        agregarEntradaHistorial();
        ajustarOverlay();

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
        clearTimeout(fallbackAtrasTimer);

        const actual = estado;
        if(actual.seleccionTimer) clearTimeout(actual.seleccionTimer);

        restaurarNodo(actual.linea, actual.marcadorLinea);
        restaurarNodo(actual.panel, actual.marcadorPanel);
        if(actual.overlay && actual.overlay.parentNode) actual.overlay.remove();

        document.body.classList.remove('lsp-search-overlay-active','lsp-search-focus');
        document.documentElement.classList.remove('lsp-search-overlay-active');
        document.documentElement.style.overflow = actual.previoHtmlOverflow;
        document.body.style.overflow = actual.previoBodyOverflow;
        actual.panel.style.removeProperty('max-height');

        estado = null;
        cerrando = false;

        if(devolverFoco){
            try { actual.input.blur(); } catch(_e){}
            requestAnimationFrame(function(){
                window.scrollTo(actual.scrollX, actual.scrollY);
            });
        }

        const accion = accionPendiente;
        accionPendiente = null;
        if(typeof accion === 'function') setTimeout(accion, 0);
    }

    function solicitarRegreso(devolverFoco, despues){
        if(!estado || cerrando) return;
        desenfocarAlCerrar = devolverFoco !== false;
        accionPendiente = typeof despues === 'function' ? despues : null;

        if(historialOverlayActivo()){
            try {
                window.history.back();
                clearTimeout(fallbackAtrasTimer);
                fallbackAtrasTimer = setTimeout(function(){
                    if(!estado) return;
                    try {
                        window.history.replaceState(estado.estadoHistorialPrevio || {}, '', window.location.href);
                    } catch(_e){}
                    cerrarOverlay(desenfocarAlCerrar);
                }, 550);
                return;
            } catch(_e){}
        }

        cerrarOverlay(desenfocarAlCerrar);
    }

    function manejarPopstate(){
        if(!estado) return;
        clearTimeout(fallbackAtrasTimer);
        cerrarOverlay(desenfocarAlCerrar);
    }

    /* El botón inferior "Diccionario" representa navegación, no una orden de
       búsqueda. script.js lo enlaza con #btnInicio, cuyo comportamiento antiguo
       enfoca el input y por tanto abre esta capa. En móvil interceptamos ese clic
       antes del listener general y volvemos al Diccionario SIN enfocar el campo.
       Tocar directamente el input sigue abriendo la búsqueda normalmente. */
    function prepararEntradaDiccionarioSinBusquedaAutomatica(){
        const boton = document.getElementById('btnInicio');
        if(!boton || boton.dataset.lspDiccionarioSinAutoFocus === '1') return;
        boton.dataset.lspDiccionarioSinAutoFocus = '1';

        boton.addEventListener('click', function(e){
            if(!media.matches) return;

            e.preventDefault();
            e.stopPropagation();
            if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

            if(estado){
                solicitarRegreso(false, function(){
                    if(typeof window.irAlBuscador === 'function'){
                        window.irAlBuscador({ sinEnfoque:true, irArriba:true });
                    }
                });
                return;
            }

            if(typeof window.irAlBuscador === 'function'){
                window.irAlBuscador({ sinEnfoque:true, irArriba:true });
            }
        }, true);
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
            clearTimeout(blurTimer);
            blurTimer = setTimeout(function(){
                if(!estado || estado.input !== input) return;
                const activo = document.activeElement;
                if(activo && estado.overlay && estado.overlay.contains(activo)) return;
                const panelVisible = panel.children.length > 0 && getComputedStyle(panel).display !== 'none';
                if(!panelVisible) solicitarRegreso(false);
            }, 220);
        });
    }

    function reaccionarViewport(){
        if(!estado) return;
        if(!media.matches){
            solicitarRegreso(false);
            return;
        }

        const g = geometriaViewport();
        const anterior = estado.ultimaAlturaViewport;
        estado.minimaAlturaViewport = Math.min(estado.minimaAlturaViewport, g.height);
        estado.ultimaAlturaViewport = g.height;
        ajustarOverlay();

        /* En muchos Android el primer Atrás solo es consumido por el teclado.
           Cuando detectamos que el viewport recuperó de golpe el espacio del
           teclado, cerramos también la búsqueda. Para el usuario sigue siendo
           una sola acción de Atrás. */
        const aumento = g.height - anterior;
        const recuperadoDesdeMinimo = g.height - estado.minimaAlturaViewport;
        const mismaOrientacion = estado.orientacionInicial === claveOrientacion();
        if(
            mismaOrientacion &&
            !estado.seleccionandoResultado &&
            aumento > 90 &&
            recuperadoDesdeMinimo > 120
        ){
            setTimeout(function(){
                if(estado && !estado.seleccionandoResultado) solicitarRegreso(true);
            }, 0);
        }
    }

    function iniciar(){
        limpiarMarcaHuerfana();
        prepararEntradaDiccionarioSinBusquedaAutomatica();
        configuraciones.forEach(preparar);

        /* capture=true hace que la capa se restaure antes del listener general
           de historial de script.js; después LSPedia reconstruye normalmente
           la pantalla a la que el usuario volvió. */
        window.addEventListener('popstate', manejarPopstate, true);

        if(window.visualViewport){
            window.visualViewport.addEventListener('resize', reaccionarViewport, {passive:true});
            window.visualViewport.addEventListener('scroll', function(){ ajustarOverlay(); }, {passive:true});
        }
        window.addEventListener('resize', reaccionarViewport, {passive:true});
        window.addEventListener('orientationchange', function(){ ajustarOverlay(); }, {passive:true});
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    else iniciar();
})();