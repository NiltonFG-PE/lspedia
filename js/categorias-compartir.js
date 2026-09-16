/* ============================================================
   LSPedia — Compartir categorías con enlace directo
   ------------------------------------------------------------
   Objetivo:
   - Cada botón Compartir de una categoría debe generar una URL que
     conserve LA CATEGORÍA concreta, no solo la sección general.
   - Diccionario: ?categoriaDiccionario=NOMBRE
   - Vocabulario: ?vista=vocabulario&categoria=NOMBRE
   - Al abrir ese enlace, el router existente de script.js reconstruye
     la sección y muestra automáticamente los resultados de la categoría.
   ============================================================ */
(function(){
    'use strict';

    const CLASE_BOTON = 'btn-compartir-categoria-lspedia';

    function textoControl(control){
        if(!control) return '';
        return [
            control.textContent || '',
            control.getAttribute('title') || '',
            control.getAttribute('aria-label') || ''
        ].join(' ').toLowerCase();
    }

    function esControlCompartir(control){
        if(!control) return false;
        if(control.classList.contains(CLASE_BOTON)) return true;
        if(control.hasAttribute('data-compartir-categoria')) return true;
        const texto = textoControl(control);
        return texto.includes('compart') || texto.includes('share') || texto.includes('🔗');
    }

    function obtenerDatosCategoriaDesdeCard(card){
        if(!card) return null;

        if(card.classList.contains('categoria-dicc-card')){
            if(card.classList.contains('card-ver-todas')) return null;
            const nombreEl = card.querySelector('.categoria-dicc-nombre');
            const nombre = nombreEl ? nombreEl.textContent.trim() : '';
            return nombre ? { tipo: 'diccionario', nombre } : null;
        }

        if(card.classList.contains('categoria-card')){
            const nombreEl = card.querySelector('h5');
            const nombre = nombreEl ? nombreEl.textContent.trim() : '';
            return nombre ? { tipo: 'vocabulario', nombre } : null;
        }

        return null;
    }

    function construirUrlCategoria(tipo, nombre){
        const url = new URL(window.location.origin + window.location.pathname);

        if(tipo === 'vocabulario'){
            url.searchParams.set('vista', 'vocabulario');
            url.searchParams.set('categoria', nombre);
        } else {
            url.searchParams.set('categoriaDiccionario', nombre);
        }

        return url.href;
    }

    function aviso(mensaje){
        if(typeof window.mostrarAvisoCompartir === 'function'){
            window.mostrarAvisoCompartir(mensaje);
            return;
        }

        let toast = document.getElementById('toastCompartirCategoria');
        if(!toast){
            toast = document.createElement('div');
            toast.id = 'toastCompartirCategoria';
            Object.assign(toast.style, {
                position: 'fixed',
                left: '50%',
                bottom: '24px',
                transform: 'translateX(-50%)',
                zIndex: '99999',
                background: '#1f2937',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 8px 24px rgba(0,0,0,.22)',
                opacity: '0',
                transition: 'opacity .2s ease'
            });
            document.body.appendChild(toast);
        }

        toast.textContent = mensaje;
        toast.style.opacity = '1';
        clearTimeout(toast._lspediaTimeout);
        toast._lspediaTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 1800);
    }

    async function compartirCategoria(tipo, nombre){
        const url = construirUrlCategoria(tipo, nombre);
        const seccion = tipo === 'vocabulario' ? 'Vocabulario' : 'Diccionario';
        const texto = `Explora la categoría "${nombre}" de ${seccion} en LSPedia`;

        if(navigator.share){
            try {
                await navigator.share({ title: 'LSPedia', text: texto, url });
                return;
            } catch(error){
                // AbortError significa que la persona cerró el panel de compartir.
                if(error && error.name === 'AbortError') return;
            }
        }

        if(navigator.clipboard && typeof navigator.clipboard.writeText === 'function'){
            try {
                await navigator.clipboard.writeText(url);
                aviso('🔗 Enlace de la categoría copiado');
                return;
            } catch(_error){}
        }

        window.prompt('Copia este enlace para compartir la categoría:', url);
    }

    function crearBoton(card){
        const datos = obtenerDatosCategoriaDesdeCard(card);
        if(!datos) return;

        // Si una versión anterior ya agregó un botón Compartir, se reutiliza
        // y solo se corrige su comportamiento para no duplicar controles.
        const controles = Array.from(card.querySelectorAll('button, a, [role="button"]'));
        const existente = controles.find(esControlCompartir);
        if(existente){
            existente.classList.add(CLASE_BOTON);
            existente.setAttribute('data-compartir-categoria', datos.tipo);
            existente.setAttribute('data-categoria-nombre', datos.nombre);
            return;
        }

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = CLASE_BOTON;
        boton.setAttribute('data-compartir-categoria', datos.tipo);
        boton.setAttribute('data-categoria-nombre', datos.nombre);
        boton.setAttribute('title', `Compartir categoría ${datos.nombre}`);
        boton.setAttribute('aria-label', `Compartir categoría ${datos.nombre}`);
        boton.innerHTML = '<span aria-hidden="true">🔗</span>';

        Object.assign(boton.style, {
            position: 'absolute',
            top: '7px',
            right: '7px',
            width: '31px',
            height: '31px',
            padding: '0',
            border: '1px solid rgba(13,110,253,.18)',
            borderRadius: '50%',
            background: 'rgba(255,255,255,.95)',
            color: '#0d6efd',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            lineHeight: '1',
            boxShadow: '0 2px 8px rgba(0,0,0,.12)',
            cursor: 'pointer',
            zIndex: '4'
        });

        card.style.position = 'relative';
        card.appendChild(boton);
    }

    function prepararTarjetas(raiz = document){
        raiz.querySelectorAll('.categoria-dicc-card:not(.card-ver-todas), .categoria-card').forEach(crearBoton);
    }

    // Captura el clic ANTES del onclick de la tarjeta. Así compartir nunca
    // abre accidentalmente la categoría en el dispositivo de quien comparte.
    document.addEventListener('click', (evento) => {
        const control = evento.target.closest('button, a, [role="button"]');
        if(!control || !esControlCompartir(control)) return;

        const card = control.closest('.categoria-dicc-card, .categoria-card');
        const datosCard = obtenerDatosCategoriaDesdeCard(card);
        if(!datosCard) return;

        evento.preventDefault();
        evento.stopPropagation();
        if(typeof evento.stopImmediatePropagation === 'function') evento.stopImmediatePropagation();

        const tipo = control.getAttribute('data-compartir-categoria') || datosCard.tipo;
        const nombre = control.getAttribute('data-categoria-nombre') || datosCard.nombre;
        compartirCategoria(tipo, nombre);
    }, true);

    function iniciar(){
        prepararTarjetas(document);

        const observador = new MutationObserver((mutaciones) => {
            mutaciones.forEach((mutacion) => {
                mutacion.addedNodes.forEach((nodo) => {
                    if(!(nodo instanceof Element)) return;
                    if(nodo.matches('.categoria-dicc-card:not(.card-ver-todas), .categoria-card')) crearBoton(nodo);
                    prepararTarjetas(nodo);
                });
            });
        });

        observador.observe(document.body, { childList: true, subtree: true });
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }

    window.compartirCategoriaLSPedia = compartirCategoria;
    window.construirUrlCategoriaLSPedia = construirUrlCategoria;
})();