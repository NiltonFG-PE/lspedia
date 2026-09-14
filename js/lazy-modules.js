/* ============================================================
   LSPedia - carga bajo demanda de módulos pesados (Fase 1)
   ------------------------------------------------------------
   Objetivos:
   - No descargar Alfabetización, Matemáticas, Oraciones ni Subtítulos
     durante la apertura normal del Diccionario/Vocabulario.
   - Cargar cada módulo justo antes de que el usuario lo necesite.
   - Mantener compatibles las URLs directas a Herramientas/Jugar.
   - Aplicar lazy/async a medios no críticos, incluidos los que se crean
     dinámicamente después de cargar la página.
   ============================================================ */
(function () {
    'use strict';

    const VERSION = '20260914-1';
    const modulos = {
        alfabetizacion: {
            js: 'js/alfabetizacion.js?v=' + VERSION,
            css: 'css/alfabetizacion.css?v=' + VERSION,
            global: 'AlfabetizacionV2'
        },
        matematicas: {
            js: 'js/matematicas.js?v=' + VERSION,
            css: 'css/matematicas.css?v=' + VERSION,
            global: 'MatematicasV2'
        },
        oraciones: {
            js: 'js/oraciones.js?v=20260908c',
            css: null,
            global: 'OracionesV2'
        },
        subtitulos: {
            js: 'js/subtitulos.js?v=' + VERSION,
            css: 'css/subtitulos.css?v=' + VERSION,
            global: 'SubtitulosV2'
        }
    };

    const promesas = new Map();
    let repeticionProgramatica = false;
    let promesaCore = null;

    function yaCargado(nombre) {
        const cfg = modulos[nombre];
        return !!(cfg && cfg.global && window[cfg.global]);
    }

    function cargarCss(url) {
        if (!url) return Promise.resolve();
        const existente = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .find(link => String(link.href || '').includes(url.split('?')[0]));
        if (existente) return Promise.resolve();

        return new Promise((resolve) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.dataset.lspediaLazy = '1';
            link.onload = () => resolve();
            link.onerror = () => {
                console.warn('[LSPedia rendimiento] No se pudo cargar', url);
                resolve();
            };
            document.head.appendChild(link);
        });
    }

    function cargarScript(url, globalEsperado) {
        if (globalEsperado && window[globalEsperado]) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const existente = Array.from(document.scripts)
                .find(script => String(script.src || '').includes(url.split('?')[0]));
            if (existente) {
                if (globalEsperado && window[globalEsperado]) resolve();
                else existente.addEventListener('load', () => resolve(), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.dataset.lspediaLazy = '1';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('No se pudo cargar ' + url));
            document.head.appendChild(script);
        });
    }

    // El núcleo de seguridad/utilidades ya existía, pero no estaba incluido
    // explícitamente en index.html. Lo activamos desde este cargador, que se
    // ejecuta antes de script.js, para que la protección de URLs dinámicas,
    // identidad oficial y utilidades comunes estén disponibles en toda la app.
    function asegurarCore() {
        if (window.LSPediaCore) return Promise.resolve();
        if (promesaCore) return promesaCore;
        promesaCore = cargarScript('js/lspedia-core.js?v=' + VERSION, 'LSPediaCore')
            .catch((error) => {
                promesaCore = null;
                console.error('[LSPedia seguridad] No se pudo activar el núcleo seguro.', error);
                throw error;
            });
        return promesaCore;
    }

    // Iniciar cuanto antes. Si falla la red, no bloqueamos el resto de la web;
    // el Service Worker también conserva este archivo para uso offline.
    asegurarCore().catch(() => {});

    function cargar(nombre) {
        if (!modulos[nombre]) return Promise.resolve();
        if (yaCargado(nombre)) return Promise.resolve();
        if (promesas.has(nombre)) return promesas.get(nombre);

        const cfg = modulos[nombre];
        const promesa = asegurarCore()
            .catch(() => {})
            .then(() => cargarCss(cfg.css))
            .then(() => cargarScript(cfg.js, cfg.global))
            .catch((error) => {
                promesas.delete(nombre);
                console.error('[LSPedia rendimiento]', error);
                throw error;
            });
        promesas.set(nombre, promesa);
        return promesa;
    }

    function cargarVarios(nombres) {
        return Promise.all(nombres.map(cargar));
    }

    // En escritorio Herramientas muestra sus módulos de forma conjunta.
    // En móvil se conserva el selector y solo se descarga el módulo elegido.
    function modulosParaBoton(id) {
        const escritorio = window.matchMedia('(min-width: 1200px)').matches;
        switch (id) {
            case 'btnHerramientas':
                return escritorio ? ['subtitulos', 'alfabetizacion'] : [];
            case 'btnHerrMovilSubtitulos':
                return ['subtitulos'];
            case 'btnHerrMovilAlfabetizacion':
                return ['alfabetizacion'];
            case 'btnMenuJuegoCompletar':
            case 'btnMenuJuegoUnir':
                return ['alfabetizacion'];
            case 'btnMenuJuegoMatematicas':
                return ['matematicas'];
            case 'btnMenuJuegoOraciones':
                return ['oraciones'];
            default:
                return [];
        }
    }

    const SELECTOR_ENTRADAS = [
        '#btnHerramientas',
        '#btnHerrMovilSubtitulos',
        '#btnHerrMovilAlfabetizacion',
        '#btnMenuJuegoCompletar',
        '#btnMenuJuegoUnir',
        '#btnMenuJuegoMatematicas',
        '#btnMenuJuegoOraciones'
    ].join(',');

    // Interceptamos el primer clic ANTES que los listeners de script.js.
    // Una vez descargado el módulo, repetimos el mismo clic y el flujo
    // original de LSPedia continúa sin duplicar lógica de navegación.
    document.addEventListener('click', async (evento) => {
        if (repeticionProgramatica) return;
        const boton = evento.target && evento.target.closest
            ? evento.target.closest(SELECTOR_ENTRADAS)
            : null;
        if (!boton) return;

        const necesarios = modulosParaBoton(boton.id).filter(nombre => !yaCargado(nombre));
        if (!necesarios.length) return;

        evento.preventDefault();
        evento.stopPropagation();
        if (typeof evento.stopImmediatePropagation === 'function') evento.stopImmediatePropagation();

        boton.setAttribute('aria-busy', 'true');
        try {
            await cargarVarios(necesarios);
            repeticionProgramatica = true;
            boton.click();
        } catch (_error) {
            // El error ya quedó registrado. Dejamos el botón disponible para
            // que un segundo intento pueda volver a descargar el módulo.
        } finally {
            repeticionProgramatica = false;
            boton.removeAttribute('aria-busy');
        }
    }, true);

    // Empieza la descarga un poco antes del clic cuando hay hover o toque.
    function anticipar(evento) {
        const boton = evento.target && evento.target.closest
            ? evento.target.closest(SELECTOR_ENTRADAS)
            : null;
        if (!boton) return;
        modulosParaBoton(boton.id).forEach(nombre => {
            cargar(nombre).catch(() => {});
        });
    }
    document.addEventListener('pointerover', anticipar, { passive: true, capture: true });
    document.addEventListener('touchstart', anticipar, { passive: true, capture: true });

    // Para enlaces directos (por ejemplo ?vista=herramientas-subtitulos),
    // arrancamos la descarga inmediatamente, antes de que palabras.json
    // termine de llegar y el router intente restaurar la vista.
    (function precargarSegunUrl() {
        const params = new URLSearchParams(window.location.search);
        const vista = params.get('vista') || '';
        const juego = params.get('juego') || '';
        const necesarios = [];

        if (vista === 'herramientas-subtitulos') necesarios.push('subtitulos');
        if (vista === 'herramientas-alfabetizacion') necesarios.push('alfabetizacion');
        if (vista === 'herramientas' && window.matchMedia('(min-width: 1200px)').matches) {
            necesarios.push('subtitulos', 'alfabetizacion');
        }
        if (vista === 'herramientas-jugar') {
            if (juego === 'completar' || juego === 'unir') necesarios.push('alfabetizacion');
            if (juego === 'matematicas') necesarios.push('matematicas');
            if (juego === 'oraciones') necesarios.push('oraciones');
        }

        if (necesarios.length) cargarVarios([...new Set(necesarios)]).catch(() => {});
    })();

    // Medios no críticos: las imágenes creadas por las fichas/categorías
    // se decodifican fuera del hilo principal y, cuando están lejos del
    // primer viewport, se dejan para cuando el usuario se acerque a ellas.
    function optimizarImagen(img) {
        if (!(img instanceof HTMLImageElement)) return;
        if (!img.hasAttribute('decoding')) img.decoding = 'async';
        if (img.hasAttribute('loading')) return;

        const critica = img.closest('nav, .navbar, #splashScreen, #senalDelDia, .dia-rect-card');
        if (critica) return;

        let lejos = true;
        try {
            const rect = img.getBoundingClientRect();
            lejos = rect.top > window.innerHeight * 1.25 || rect.bottom < -200;
        } catch (_e) {}

        if (lejos) {
            img.loading = 'lazy';
            try { img.fetchPriority = 'low'; } catch (_e) {}
        }
    }

    function optimizarNodo(nodo) {
        if (!nodo || nodo.nodeType !== 1) return;
        if (nodo.matches && nodo.matches('img')) optimizarImagen(nodo);
        if (nodo.querySelectorAll) nodo.querySelectorAll('img').forEach(optimizarImagen);
    }

    function iniciarOptimizacionMedios() {
        document.querySelectorAll('img').forEach(optimizarImagen);
        if ('MutationObserver' in window) {
            const observer = new MutationObserver((cambios) => {
                cambios.forEach(cambio => cambio.addedNodes.forEach(optimizarNodo));
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarOptimizacionMedios, { once: true });
    } else {
        iniciarOptimizacionMedios();
    }

    window.LSPediaModulos = Object.freeze({ cargar, cargarVarios, yaCargado });
})();