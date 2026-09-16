/* ============================================================
   LSPedia — Modo oscuro
   ------------------------------------------------------------
   - Botón integrado junto al selector ES/EN.
   - Preferencia persistente en localStorage.
   - Cambia luna/sol y etiquetas accesibles.
   - No altera el contenido ni la lógica de Diccionario/Vocabulario.
   ============================================================ */
(function(){
    'use strict';

    const CLAVE = 'lspedia_tema_v1';
    const ATRIBUTO = 'data-lsp-tema';
    const TEMA_OSCURO = 'dark';
    const TEMA_CLARO = 'light';

    const ICONO_LUNA = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    const ICONO_SOL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

    function leerTema(){
        try {
            const guardado = localStorage.getItem(CLAVE);
            return guardado === TEMA_OSCURO ? TEMA_OSCURO : TEMA_CLARO;
        } catch(_e){
            return TEMA_CLARO;
        }
    }

    function guardarTema(tema){
        try { localStorage.setItem(CLAVE, tema); } catch(_e) {}
    }

    function esOscuro(){
        return document.documentElement.getAttribute(ATRIBUTO) === TEMA_OSCURO;
    }

    function textoBoton(oscuro){
        const idioma = String(document.documentElement.lang || 'es').toLowerCase();
        if(idioma.startsWith('en')) return oscuro ? 'Switch to light mode' : 'Switch to dark mode';
        return oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    }

    function actualizarBoton(){
        const boton = document.getElementById('lspediaTemaBtn');
        if(!boton) return;
        const oscuro = esOscuro();
        boton.innerHTML = oscuro ? ICONO_SOL : ICONO_LUNA;
        boton.setAttribute('aria-pressed', oscuro ? 'true' : 'false');
        boton.setAttribute('aria-label', textoBoton(oscuro));
        boton.title = textoBoton(oscuro);
    }

    function actualizarThemeColor(){
        const meta = document.querySelector('meta[name="theme-color"]');
        if(meta) meta.setAttribute('content', esOscuro() ? '#09111f' : '#0f172a');
    }

    function aplicarTema(tema, persistir){
        const normalizado = tema === TEMA_OSCURO ? TEMA_OSCURO : TEMA_CLARO;
        document.documentElement.setAttribute(ATRIBUTO, normalizado);
        if(document.body) document.body.classList.toggle('lspedia-modo-oscuro', normalizado === TEMA_OSCURO);
        if(persistir) guardarTema(normalizado);
        actualizarBoton();
        actualizarThemeColor();
        try {
            document.dispatchEvent(new CustomEvent('lspedia:temaCambiado', { detail: { tema: normalizado } }));
        } catch(_e) {}
    }

    function crearBoton(){
        let boton = document.getElementById('lspediaTemaBtn');
        if(boton) return boton;
        boton = document.createElement('button');
        boton.type = 'button';
        boton.id = 'lspediaTemaBtn';
        boton.className = 'lspedia-tema-btn';
        boton.addEventListener('click', function(){
            aplicarTema(esOscuro() ? TEMA_CLARO : TEMA_OSCURO, true);
        });
        return boton;
    }

    function integrarBoton(){
        const boton = crearBoton();
        const selectorIdioma = document.getElementById('lspediaIdiomaSelector');

        if(selectorIdioma){
            const respaldo = document.getElementById('lspediaTemaStandalone');
            selectorIdioma.appendChild(boton);
            if(respaldo) respaldo.remove();
            actualizarBoton();
            return true;
        }

        const navContainer = document.querySelector('nav.navbar .container');
        if(!navContainer) return false;
        let wrap = document.getElementById('lspediaTemaStandalone');
        if(!wrap){
            wrap = document.createElement('div');
            wrap.id = 'lspediaTemaStandalone';
            wrap.className = 'lspedia-tema-standalone';
            wrap.appendChild(boton);
            navContainer.appendChild(wrap);
        }
        actualizarBoton();
        return true;
    }

    function observarSelectorIdioma(){
        if(typeof MutationObserver === 'undefined') return;
        const observer = new MutationObserver(function(){
            if(document.getElementById('lspediaIdiomaSelector')){
                integrarBoton();
                actualizarBoton();
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('pagehide', function(){ observer.disconnect(); }, { once: true });
    }

    // Aplica la preferencia antes de crear el control visible. En la carga
    // normal esto ocurre mientras el splash todavía está en pantalla, evitando
    // un salto visual perceptible entre claro y oscuro.
    aplicarTema(leerTema(), false);

    function iniciar(){
        integrarBoton();
        observarSelectorIdioma();
        // i18n puede cambiar documentElement.lang después; refrescamos la
        // etiqueta accesible sin tocar el estado del tema.
        document.addEventListener('lspedia:idiomaCambiado', actualizarBoton);
        setTimeout(integrarBoton, 120);
        setTimeout(integrarBoton, 600);
        setTimeout(integrarBoton, 1500);
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once:true });
    else iniciar();

    window.LSPediaTema = {
        get tema(){ return esOscuro() ? TEMA_OSCURO : TEMA_CLARO; },
        oscuro: function(){ aplicarTema(TEMA_OSCURO, true); },
        claro: function(){ aplicarTema(TEMA_CLARO, true); },
        alternar: function(){ aplicarTema(esOscuro() ? TEMA_CLARO : TEMA_OSCURO, true); }
    };
})();
