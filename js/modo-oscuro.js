/* ============================================================
   LSPedia — Modo oscuro
   ------------------------------------------------------------
   - Botón integrado junto al selector ES/EN.
   - Preferencia persistente en localStorage.
   - Cambia luna/sol y etiquetas accesibles.
   - Integración segura: sin MutationObserver recursivo.
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
        if(document.documentElement.getAttribute(ATRIBUTO) !== normalizado){
            document.documentElement.setAttribute(ATRIBUTO, normalizado);
        }
        if(document.body) document.body.classList.toggle('lspedia-modo-oscuro', normalizado === TEMA_OSCURO);
        if(persistir) guardarTema(normalizado);
        actualizarBoton();
        actualizarThemeColor();
        if(persistir){
            try {
                document.dispatchEvent(new CustomEvent('lspedia:temaCambiado', { detail: { tema: normalizado } }));
            } catch(_e) {}
        }
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
            /* IMPORTANTE: no volver a appendChild si ya está en el selector.
               Hacerlo dentro de un MutationObserver generaba un bucle infinito. */
            if(boton.parentElement !== selectorIdioma){
                selectorIdioma.appendChild(boton);
            }
            const respaldo = document.getElementById('lspediaTemaStandalone');
            if(respaldo && respaldo.parentElement) respaldo.remove();
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
            navContainer.appendChild(wrap);
        }
        if(boton.parentElement !== wrap) wrap.appendChild(boton);
        actualizarBoton();
        return true;
    }

    function iniciar(){
        aplicarTema(leerTema(), false);
        integrarBoton();

        /* i18n se carga después. En vez de observar todo el DOM, hacemos
           unos pocos intentos controlados y reaccionamos al evento propio
           de idioma. Esto evita cualquier ciclo de mutaciones. */
        [120, 450, 1000, 2200].forEach(function(ms){
            setTimeout(integrarBoton, ms);
        });
        document.addEventListener('lspedia:idiomaCambiado', function(){
            integrarBoton();
            actualizarBoton();
        });
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
