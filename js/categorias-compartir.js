/* ============================================================
   LSPedia — compartir y restaurar categorías por URL
   ============================================================ */
(function(){
    'use strict';

    const CLASE_BOTON = 'btn-compartir-categoria-lspedia';
    let restauracionVocabularioRegistrada = false;
    let ultimaRestauracionConfirmada = '';

    function datosCategoriaDesdeUrl(urlTexto){
        try {
            const url = new URL(urlTexto, window.location.href);
            const diccionario = (url.searchParams.get('categoriaDiccionario') || '').trim();
            const vista = (url.searchParams.get('vista') || '').trim().toLowerCase();
            const vocabulario = (url.searchParams.get('categoria') || '').trim();
            const coleccion = (url.searchParams.get('coleccion') || '').trim();

            if(diccionario) return { tipo: 'diccionario', nombre: diccionario };
            if((vista === 'vocabulario' || vista === 'temas') && coleccion){
                return { tipo: 'coleccion-vocabulario', nombre: coleccion };
            }
            if((vista === 'vocabulario' || vista === 'temas') && vocabulario){
                return { tipo: 'vocabulario', nombre: vocabulario };
            }
        } catch(_error){}
        return null;
    }

    function obtenerCategoriaDeNavegacionOriginal(){
        // security.js se ejecuta antes de script.js y conserva la URL exacta
        // con la que se abrió la página. Esta es la fuente principal porque
        // script.js puede quitar ?categoria=... mediante history.pushState.
        const urlGuardada = String(window.__LSPEDIA_URL_INICIAL__ || '').trim();
        if(urlGuardada){
            const datosGuardados = datosCategoriaDesdeUrl(urlGuardada);
            if(datosGuardados) return datosGuardados;
        }

        // Respaldo para navegadores/sesiones donde aún no exista la variable.
        try {
            const entradas = (window.performance && typeof performance.getEntriesByType === 'function')
                ? performance.getEntriesByType('navigation')
                : [];
            if(entradas && entradas[0] && entradas[0].name){
                const datos = datosCategoriaDesdeUrl(entradas[0].name);
                if(datos) return datos;
            }
        } catch(_error){}
        return datosCategoriaDesdeUrl(window.location.href);
    }

    let categoriaPendienteOriginal = obtenerCategoriaDeNavegacionOriginal();

    function textoControl(control){
        if(!control) return '';
        return [control.textContent || '', control.getAttribute('title') || '', control.getAttribute('aria-label') || '']
            .join(' ').toLowerCase();
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

    function construirUrlColeccion(nombre){
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('vista', 'vocabulario');
        url.searchParams.set('coleccion', nombre);
        return url.href;
    }

    function slugCategoria(valor){
        return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    function construirUrlCategoria(tipo, nombre){
        // URL estática compartible: WhatsApp/Facebook pueden leer Open Graph
        // sin ejecutar JavaScript. La página SEO ofrece acceso a la categoría
        // interactiva y conserva una miniatura propia.
        const seccion = tipo === 'vocabulario' ? 'vocabulario' : 'diccionario';
        const ref = slugCategoria(nombre);
        return new URL('/categoria/' + seccion + '/' + encodeURIComponent(ref) + '/', window.location.origin).href;
    }

    function construirUrlCategoriaApp(tipo, nombre){
        const url = new URL(window.location.origin + '/');
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
                position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
                zIndex: '99999', background: '#1f2937', color: '#fff', padding: '10px 16px',
                borderRadius: '999px', fontSize: '14px', fontWeight: '600',
                boxShadow: '0 8px 24px rgba(0,0,0,.22)', opacity: '0', transition: 'opacity .2s ease'
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
        const texto = `Explora la categoría \"${nombre}\" de ${seccion} en LSPedia:`;
        if(navigator.share){
            try {
                await navigator.share({ title: 'LSPedia', text: texto, url });
                return;
            } catch(error){
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
            position: 'absolute', top: '7px', right: '7px', width: '31px', height: '31px', padding: '0',
            border: '1px solid rgba(13,110,253,.18)', borderRadius: '50%', background: 'rgba(255,255,255,.95)',
            color: '#0d6efd', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '15px', lineHeight: '1', boxShadow: '0 2px 8px rgba(0,0,0,.12)', cursor: 'pointer', zIndex: '4'
        });
        card.style.position = 'relative';
        card.appendChild(boton);
    }

    function prepararTarjetas(raiz = document){
        raiz.querySelectorAll('.categoria-dicc-card:not(.card-ver-todas), .categoria-card').forEach(crearBoton);
    }

    function parametrosCategoriaActuales(){
        return datosCategoriaDesdeUrl(window.location.href) || categoriaPendienteOriginal;
    }

    function mismaCategoria(a, b){
        return !!a && !!b && a.tipo === b.tipo
            && String(a.nombre).trim().toLowerCase() === String(b.nombre).trim().toLowerCase();
    }

    function confirmarUrlCategoria(datos){
        const objetivo = new URL(construirUrlCategoriaApp(datos.tipo, datos.nombre));
        const relativaObjetivo = objetivo.pathname + objetivo.search;
        const relativaActual = window.location.pathname + window.location.search;
        if(relativaActual !== relativaObjetivo){
            window.history.replaceState(
                { tipo: datos.tipo === 'vocabulario' ? 'categoriaVocabulario' : 'categoriaDiccionario', categoria: datos.nombre },
                '', relativaObjetivo
            );
        }
    }

    function resultadoDiccionarioVisible(nombre){
        const contenedor = document.getElementById('resultadoCategoriasDiccionario');
        return !!(contenedor && contenedor.textContent.trim()
            && contenedor.textContent.toLowerCase().includes(String(nombre).trim().toLowerCase()));
    }

    function resultadoVocabularioVisible(nombre){
        const contenedor = document.getElementById('resultadoCategorias');
        return !!(contenedor && contenedor.textContent.trim()
            && contenedor.textContent.toLowerCase().includes(String(nombre).trim().toLowerCase()));
    }

    function restaurarDiccionario(datos){
        confirmarUrlCategoria(datos);
        if(!window.App || !Array.isArray(window.App.datos) || !window.App.datos.length) return false;
        if(typeof window.filtrarPorCategoriaDiccionario !== 'function') return false;
        const existe = window.App.datos.some(p => p && p.categoria
            && String(p.categoria).trim().toLowerCase() === datos.nombre.trim().toLowerCase());
        if(!existe) return false;
        if(!resultadoDiccionarioVisible(datos.nombre)){
            window.filtrarPorCategoriaDiccionario(datos.nombre, { noActualizarHistorial: true });
        }
        confirmarUrlCategoria(datos);
        ultimaRestauracionConfirmada = 'diccionario:' + datos.nombre.toLowerCase();
        categoriaPendienteOriginal = null;
        return true;
    }

    function abrirVistaVocabularioSinPerderUrl(datos){
        const yaEnVocabulario = document.body && document.body.classList.contains('vista-temas-movil');
        if(!yaEnVocabulario){
            const boton = document.getElementById('btnCategorias');
            if(boton) boton.click();
        }
        confirmarUrlCategoria(datos);
    }

    function categoriaVocabularioDisponible(nombre){
        const buscado = String(nombre).trim().toLowerCase();
        try {
            const banco = (window.QuizV2 && typeof window.QuizV2.obtenerBanco === 'function')
                ? window.QuizV2.obtenerBanco() : [];
            if(Array.isArray(banco) && banco.some(p => p && p.categoria
                && String(p.categoria).trim().toLowerCase() === buscado)) return true;
        } catch(_error){}
        return Array.from(document.querySelectorAll('.categoria-card h5')).some(el =>
            String(el.textContent || '').trim().toLowerCase() === buscado
        );
    }

    function restaurarVocabulario(datos){
        abrirVistaVocabularioSinPerderUrl(datos);
        if(typeof window.mostrarCategoria !== 'function') return false;

        const intentarMostrar = () => {
            const actuales = parametrosCategoriaActuales();
            if(!mismaCategoria(actuales, datos)) return false;
            if(!categoriaVocabularioDisponible(datos.nombre)) return false;
            if(!resultadoVocabularioVisible(datos.nombre)){
                window.mostrarCategoria(datos.nombre, { noActualizarHistorial: true });
            }
            confirmarUrlCategoria(datos);
            if(resultadoVocabularioVisible(datos.nombre)){
                ultimaRestauracionConfirmada = 'vocabulario:' + datos.nombre.toLowerCase();
                categoriaPendienteOriginal = null;
                return true;
            }
            return false;
        };

        if(intentarMostrar()) return true;
        if(!restauracionVocabularioRegistrada && window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function'){
            restauracionVocabularioRegistrada = true;
            if(typeof window.QuizV2.asegurarBancoCargado === 'function'){
                try { window.QuizV2.asegurarBancoCargado(); } catch(_error){}
            }
            window.QuizV2.onBancoListo(() => {
                restauracionVocabularioRegistrada = false;
                intentarMostrar();
            });
        }
        return false;
    }

    function restaurarCategoriaCompartida(){
        const datos = parametrosCategoriaActuales();
        if(!datos) return false;
        if(datos.tipo === 'coleccion-vocabulario'){
            if(typeof window.mostrarEtiquetaVocabulario !== 'function') return false;
            const confirmarUrlColeccion = () => {
                const objetivo = new URL(construirUrlColeccion(datos.nombre));
                const relativaObjetivo = objetivo.pathname + objetivo.search;
                const relativaActual = window.location.pathname + window.location.search;
                if(relativaActual !== relativaObjetivo){
                    window.history.replaceState(
                        { tipo: 'coleccionVocabulario', coleccion: datos.nombre },
                        '', relativaObjetivo
                    );
                }
            };
            const abrirYMostrar = () => {
                try {
                    const yaEnVocabulario = document.body && document.body.classList.contains('vista-temas-movil');
                    if(!yaEnVocabulario){
                        const boton = document.getElementById('btnCategorias');
                        if(boton) boton.click();
                    }
                    window.mostrarEtiquetaVocabulario(datos.nombre, { noActualizarHistorial: true });
                    confirmarUrlColeccion();
                    return true;
                } catch(_error){ return false; }
            };
            if(abrirYMostrar()){
                categoriaPendienteOriginal = null;
                return true;
            }
            if(window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function'){
                window.QuizV2.onBancoListo(() => abrirYMostrar());
            }
            return false;
        }
        const clave = datos.tipo + ':' + datos.nombre.toLowerCase();
        if(ultimaRestauracionConfirmada === clave){
            return datos.tipo === 'diccionario'
                ? resultadoDiccionarioVisible(datos.nombre)
                : resultadoVocabularioVisible(datos.nombre);
        }
        return datos.tipo === 'diccionario' ? restaurarDiccionario(datos) : restaurarVocabulario(datos);
    }

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
        restaurarCategoriaCompartida();
        [50,150,350,700,1200,2000,3500,5500].forEach(ms => setTimeout(restaurarCategoriaCompartida, ms));
    }

    document.addEventListener('lspedia:datosListos', restaurarCategoriaCompartida);
    document.addEventListener('lspedia:palabrasActualizadas', restaurarCategoriaCompartida);

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    else iniciar();

    window.compartirCategoriaLSPedia = compartirCategoria;
    window.construirUrlCategoriaLSPedia = construirUrlCategoria;
    window.construirUrlColeccionLSPedia = construirUrlColeccion;
    window.restaurarCategoriaCompartidaLSPedia = restaurarCategoriaCompartida;
})();