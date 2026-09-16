/* ============================================================
   LSPedia — Compartir categorías con enlace directo
   ------------------------------------------------------------
   Objetivo:
   - Cada botón Compartir de una categoría genera una URL que conserva
     LA CATEGORÍA concreta, no solo la sección general.
   - Diccionario: ?categoriaDiccionario=NOMBRE
   - Vocabulario: ?vista=vocabulario&categoria=NOMBRE
   - Al abrir el enlace se fuerza una segunda restauración cuando los
     datos estén listos. Esto evita depender del orden de carga, caché,
     service worker o del momento en que llegue Hoja 2.
   ============================================================ */
(function(){
    'use strict';

    const CLASE_BOTON = 'btn-compartir-categoria-lspedia';
    let restauracionVocabularioRegistrada = false;
    let ultimaRestauracionConfirmada = '';

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
                position: 'fixed', left: '50%', bottom: '24px',
                transform: 'translateX(-50%)', zIndex: '99999',
                background: '#1f2937', color: '#fff', padding: '10px 16px',
                borderRadius: '999px', fontSize: '14px', fontWeight: '600',
                boxShadow: '0 8px 24px rgba(0,0,0,.22)', opacity: '0',
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
        // Incluimos también la URL dentro del texto. Algunos destinos de
        // Web Share (según navegador/app) ignoran el campo `url` separado;
        // de esta manera el enlace específico nunca se pierde.
        const texto = `Explora la categoría "${nombre}" de ${seccion} en LSPedia:\n${url}`;

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
            position: 'absolute', top: '7px', right: '7px', width: '31px',
            height: '31px', padding: '0', border: '1px solid rgba(13,110,253,.18)',
            borderRadius: '50%', background: 'rgba(255,255,255,.95)',
            color: '#0d6efd', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '15px', lineHeight: '1',
            boxShadow: '0 2px 8px rgba(0,0,0,.12)', cursor: 'pointer', zIndex: '4'
        });

        card.style.position = 'relative';
        card.appendChild(boton);
    }

    function prepararTarjetas(raiz = document){
        raiz.querySelectorAll('.categoria-dicc-card:not(.card-ver-todas), .categoria-card').forEach(crearBoton);
    }

    function parametrosCategoriaActuales(){
        const params = new URLSearchParams(window.location.search);
        const diccionario = params.get('categoriaDiccionario');
        const vista = params.get('vista');
        const vocabulario = params.get('categoria');

        if(diccionario) return { tipo: 'diccionario', nombre: diccionario };
        if((vista === 'vocabulario' || vista === 'temas') && vocabulario){
            return { tipo: 'vocabulario', nombre: vocabulario };
        }
        return null;
    }

    function confirmarUrlCategoria(datos){
        const objetivo = construirUrlCategoria(datos.tipo, datos.nombre);
        const relativaObjetivo = new URL(objetivo).pathname + new URL(objetivo).search;
        const relativaActual = window.location.pathname + window.location.search;
        if(relativaActual !== relativaObjetivo){
            window.history.replaceState(
                { tipo: datos.tipo === 'vocabulario' ? 'categoriaVocabulario' : 'categoriaDiccionario', categoria: datos.nombre },
                '',
                relativaObjetivo
            );
        }
    }

    function resultadoDiccionarioVisible(nombre){
        const contenedor = document.getElementById('resultadoCategoriasDiccionario');
        if(!contenedor || !contenedor.textContent.trim()) return false;
        return contenedor.textContent.toLowerCase().includes(String(nombre).trim().toLowerCase());
    }

    function resultadoVocabularioVisible(nombre){
        const contenedor = document.getElementById('resultadoCategorias');
        if(!contenedor || !contenedor.textContent.trim()) return false;
        return contenedor.textContent.toLowerCase().includes(String(nombre).trim().toLowerCase());
    }

    function restaurarDiccionario(datos){
        if(!window.App || !Array.isArray(window.App.datos) || !window.App.datos.length) return false;
        if(typeof window.filtrarPorCategoriaDiccionario !== 'function') return false;

        const existe = window.App.datos.some(p =>
            p && p.categoria && String(p.categoria).trim().toLowerCase() === datos.nombre.trim().toLowerCase()
        );
        if(!existe) return false;

        if(!resultadoDiccionarioVisible(datos.nombre)){
            window.filtrarPorCategoriaDiccionario(datos.nombre, { noActualizarHistorial: true });
        }
        confirmarUrlCategoria(datos);
        ultimaRestauracionConfirmada = 'diccionario:' + datos.nombre;
        return true;
    }

    function abrirVistaVocabularioSinPerderUrl(datos){
        const cuerpo = document.body;
        const yaEnVocabulario = cuerpo && cuerpo.classList.contains('vista-temas-movil');
        if(yaEnVocabulario) return;

        const boton = document.getElementById('btnCategorias');
        if(!boton) return;
        boton.click();
        // El clic normal actualiza la URL a ?vista=vocabulario. Reponemos
        // inmediatamente la categoría concreta para que no se pierda.
        confirmarUrlCategoria(datos);
    }

    function restaurarVocabulario(datos){
        abrirVistaVocabularioSinPerderUrl(datos);

        if(typeof window.mostrarCategoria !== 'function') return false;

        const intentarMostrar = () => {
            const actuales = parametrosCategoriaActuales();
            if(!actuales || actuales.tipo !== 'vocabulario' || actuales.nombre !== datos.nombre) return;

            const banco = (window.QuizV2 && typeof window.QuizV2.obtenerBanco === 'function')
                ? window.QuizV2.obtenerBanco()
                : [];
            const existe = Array.isArray(banco) && banco.some(p =>
                p && p.categoria && String(p.categoria).trim().toLowerCase() === datos.nombre.trim().toLowerCase()
            );

            if(!existe) return;
            if(!resultadoVocabularioVisible(datos.nombre)){
                window.mostrarCategoria(datos.nombre, { noActualizarHistorial: true });
            }
            confirmarUrlCategoria(datos);
            ultimaRestauracionConfirmada = 'vocabulario:' + datos.nombre;
        };

        intentarMostrar();

        if(!restauracionVocabularioRegistrada && window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function'){
            restauracionVocabularioRegistrada = true;
            if(typeof window.QuizV2.asegurarBancoCargado === 'function'){
                window.QuizV2.asegurarBancoCargado();
            }
            window.QuizV2.onBancoListo(() => {
                restauracionVocabularioRegistrada = false;
                intentarMostrar();
            });
        }

        return resultadoVocabularioVisible(datos.nombre);
    }

    function restaurarCategoriaCompartida(){
        const datos = parametrosCategoriaActuales();
        if(!datos) return false;

        const clave = datos.tipo + ':' + datos.nombre;
        if(ultimaRestauracionConfirmada === clave){
            const sigueVisible = datos.tipo === 'diccionario'
                ? resultadoDiccionarioVisible(datos.nombre)
                : resultadoVocabularioVisible(datos.nombre);
            if(sigueVisible) return true;
        }

        return datos.tipo === 'diccionario'
            ? restaurarDiccionario(datos)
            : restaurarVocabulario(datos);
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

        // Intento inmediato y varios respaldos. El evento datosListos cubre
        // Diccionario; onBancoListo cubre Vocabulario. Los reintentos cortos
        // cubren cachés antiguas y teléfonos donde los eventos llegan en otro orden.
        restaurarCategoriaCompartida();
        [100, 350, 800, 1600, 3000].forEach(ms => {
            setTimeout(restaurarCategoriaCompartida, ms);
        });
    }

    document.addEventListener('lspedia:datosListos', restaurarCategoriaCompartida);
    document.addEventListener('lspedia:palabrasActualizadas', restaurarCategoriaCompartida);

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }

    window.compartirCategoriaLSPedia = compartirCategoria;
    window.construirUrlCategoriaLSPedia = construirUrlCategoria;
    window.restaurarCategoriaCompartidaLSPedia = restaurarCategoriaCompartida;
})();
