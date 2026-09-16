/* LSPedia — Tu aprendizaje colapsable (Diccionario + Vocabulario) */
(function(){
    'use strict';

    if(window.__LSPEDIA_APRENDIZAJE_COLAPSABLE__) return;
    window.__LSPEDIA_APRENDIZAJE_COLAPSABLE__ = true;

    const IDS = ['panelAprendizajeVocabulario', 'lspModoCard'];
    const visibilidadAnterior = new WeakMap();
    let revisionPendiente = false;

    function esVisible(elemento){
        if(!elemento || !elemento.isConnected) return false;
        if(elemento.classList.contains('is-hidden') || elemento.classList.contains('d-none')) return false;
        try {
            const estilo = getComputedStyle(elemento);
            if(estilo.display === 'none' || estilo.visibility === 'hidden') return false;
        } catch(_error) {}
        return elemento.getClientRects().length > 0;
    }

    function textoSecundario(card){
        return card.id === 'panelAprendizajeVocabulario'
            ? 'Ver progreso de Vocabulario'
            : 'Ver progreso del Diccionario';
    }

    function cambiarEstado(card, abierto, enfocar){
        if(!card) return;
        const boton = card.querySelector(':scope > .lsp-learning-collapse-toggle');
        const cuerpo = card.querySelector(':scope > .lsp-learning-collapse-body');
        if(!boton || !cuerpo) return;

        card.classList.toggle('lsp-learning-collapsed', !abierto);
        card.classList.toggle('lsp-learning-expanded', abierto);
        cuerpo.hidden = !abierto;
        boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');

        const accion = boton.querySelector('.lsp-learning-collapse-action');
        const flecha = boton.querySelector('.lsp-learning-collapse-chevron');
        if(accion) accion.textContent = abierto ? 'Ocultar' : 'Mostrar';
        if(flecha) flecha.setAttribute('aria-hidden', 'true');

        if(enfocar) boton.focus({preventScroll:true});
    }

    function preparar(card){
        if(!card || card.dataset.learningCollapseReady === '1') return;

        const cuerpo = document.createElement('div');
        cuerpo.className = 'lsp-learning-collapse-body';
        cuerpo.id = card.id + '-contenido';

        while(card.firstChild) cuerpo.appendChild(card.firstChild);

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'lsp-learning-collapse-toggle';
        boton.setAttribute('aria-controls', cuerpo.id);
        boton.setAttribute('aria-expanded', 'false');
        boton.innerHTML =
            '<span class="lsp-learning-collapse-icon" aria-hidden="true">📘</span>' +
            '<span class="lsp-learning-collapse-copy">' +
                '<strong>Tu aprendizaje</strong>' +
                '<small>' + textoSecundario(card) + '</small>' +
            '</span>' +
            '<span class="lsp-learning-collapse-action">Mostrar</span>' +
            '<span class="lsp-learning-collapse-chevron" aria-hidden="true">⌄</span>';

        boton.addEventListener('click', function(){
            const abierto = boton.getAttribute('aria-expanded') === 'true';
            cambiarEstado(card, !abierto, false);
        });

        card.appendChild(boton);
        card.appendChild(cuerpo);
        card.dataset.learningCollapseReady = '1';
        card.classList.add('lsp-learning-collapse-ready');
        cambiarEstado(card, false, false);
    }

    function revisar(){
        revisionPendiente = false;
        IDS.forEach(function(id){
            const card = document.getElementById(id);
            if(!card) return;

            preparar(card);

            const visibleAhora = esVisible(card);
            const visibleAntes = visibilidadAnterior.get(card);

            // Primera aparición y cada regreso a la sección: cerrado por defecto.
            if(visibleAhora && visibleAntes !== true){
                cambiarEstado(card, false, false);
            }

            visibilidadAnterior.set(card, visibleAhora);
        });
    }

    function programarRevision(){
        if(revisionPendiente) return;
        revisionPendiente = true;
        requestAnimationFrame(revisar);
    }

    function iniciar(){
        revisar();

        if('MutationObserver' in window && document.body){
            const observer = new MutationObserver(programarRevision);
            observer.observe(document.body, {
                subtree:true,
                childList:true,
                attributes:true,
                attributeFilter:['class','style','hidden']
            });
        }

        document.addEventListener('click', function(){
            setTimeout(programarRevision, 0);
            setTimeout(programarRevision, 120);
        }, true);
        window.addEventListener('popstate', programarRevision);
        window.addEventListener('pageshow', programarRevision);
        document.addEventListener('lspedia:datosListos', programarRevision);
        document.addEventListener('lspedia:palabrasActualizadas', programarRevision);

        [100,300,700,1400,2600].forEach(function(ms){
            setTimeout(programarRevision, ms);
        });
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    } else {
        iniciar();
    }
})();
