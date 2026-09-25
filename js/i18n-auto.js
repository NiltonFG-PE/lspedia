/* LSPedia — traducciones EN generadas al publicar.
   Complementa i18n.js sin modificar el español canónico.
   Lee data/traducciones-en.json, agrega el término inglés al buscador y
   muestra la definición inglesa cuando la interfaz está en EN.

   Reglas:
   - Diccionario y Vocabulario participan de esta capa bilingüe.
   - El español sigue siendo la palabra canónica y la URL permanece en español.
   - La búsqueda en inglés funciona incluso si la interfaz está en español,
     mediante aliases ocultos que no se muestran como variantes correctas.
   - Las traducciones curadas de i18n.js tienen prioridad sobre la traducción
     automática para no degradar conceptos ya revisados manualmente.
*/
(function(){
    'use strict';

    const RUTA = 'data/traducciones-en.json';
    const mapas = {
        diccionario: { exacto: new Map(), palabra: new Map() },
        vocabulario: { exacto: new Map(), palabra: new Map() }
    };
    let cargado = false;
    let rafPendiente = 0;

    function norm(valor){
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('es-PE')
            .trim();
    }

    function clave(palabra, categoria){
        return norm(palabra) + '::' + norm(categoria);
    }

    function idiomaActual(){
        return window.LSPediaIdioma && typeof window.LSPediaIdioma.obtener === 'function'
            ? window.LSPediaIdioma.obtener()
            : 'es';
    }

    function traduccionCurada(palabra){
        if(!window.LSPediaIdioma || typeof window.LSPediaIdioma.traduccionIngles !== 'function') return null;
        try {
            return window.LSPediaIdioma.traduccionIngles(palabra) || null;
        } catch(_e) {
            return null;
        }
    }

    function integrarDocumento(documento){
        const lista = documento && Array.isArray(documento.traducciones)
            ? documento.traducciones
            : [];

        lista.forEach(item => {
            if(!item || !item.palabra || !item.ingles) return;
            const fuente = norm(item.fuente) === 'vocabulario' ? 'vocabulario' : 'diccionario';
            const traduccion = {
                es: String(item.palabra || '').trim(),
                categoria: String(item.categoria || '').trim(),
                term: String(item.ingles || '').trim(),
                aliases: Array.isArray(item.aliases)
                    ? item.aliases.map(v => String(v || '').trim()).filter(Boolean)
                    : [],
                definition: String(item.definicionIngles || '').trim()
            };
            if(!traduccion.term) return;
            mapas[fuente].palabra.set(norm(traduccion.es), traduccion);
            if(traduccion.categoria){
                mapas[fuente].exacto.set(clave(traduccion.es, traduccion.categoria), traduccion);
            }
        });
        cargado = true;
    }

    function traduccionPara(p, fuente){
        if(!p || !p.palabra) return null;

        // Lo revisado manualmente en i18n.js siempre gana frente a la
        // traducción generada automáticamente.
        const curada = traduccionCurada(p.palabra);
        if(curada) return curada;

        // Si el JSON principal ya trae las columnas ingles/definicionIngles,
        // se aprovechan directamente sin duplicar la fuente de datos.
        const inglesDirecto = String(p.ingles || '').trim();
        if(inglesDirecto){
            return {
                es: String(p.palabra || '').trim(),
                categoria: String(p.categoria || '').trim(),
                term: inglesDirecto,
                aliases: Array.isArray(p.aliasesIngles) ? p.aliasesIngles : [],
                definition: String(p.definicionIngles || '').trim()
            };
        }

        const grupo = mapas[fuente] || mapas.diccionario;
        return grupo.exacto.get(clave(p.palabra, p.categoria)) ||
            grupo.palabra.get(norm(p.palabra)) ||
            null;
    }

    function guardarOriginales(p){
        if(!p || typeof p !== 'object') return;
        if(!Object.prototype.hasOwnProperty.call(p, '_i18nAutoVariantesEs')){
            p._i18nAutoVariantesEs = Object.prototype.hasOwnProperty.call(p, '_i18nVariantesEs')
                ? String(p._i18nVariantesEs || '')
                : String(p.variantes || '');
        }
        if(!Object.prototype.hasOwnProperty.call(p, '_i18nAutoDefinicionEs')){
            p._i18nAutoDefinicionEs = Object.prototype.hasOwnProperty.call(p, '_i18nDefinicionEs')
                ? String(p._i18nDefinicionEs || '')
                : String(p.definicion || '');
        }
    }

    function variantesConIngles(base, traduccion){
        const partes = [];
        if(String(base || '').trim()) partes.push(String(base).trim());
        [traduccion.term].concat(traduccion.aliases || []).forEach(valor => {
            const limpio = String(valor || '').trim();
            if(!limpio) return;
            if(!partes.some(p => norm(p) === norm(limpio))) partes.push(limpio);
        });
        return partes.join(', ');
    }

    function agregarAliasBusquedaOculto(p, traduccion){
        if(!p || !traduccion) return;
        const actuales = Array.isArray(p._aliasBusqueda) ? p._aliasBusqueda.slice() : [];
        [traduccion.term].concat(traduccion.aliases || []).forEach(valor => {
            const limpio = String(valor || '').trim();
            if(!limpio) return;
            if(!actuales.some(a => norm(a) === norm(limpio))) actuales.push(limpio);
        });
        if(actuales.length) p._aliasBusqueda = actuales;
    }

    function aplicarColeccion(coleccion, fuente){
        if(!Array.isArray(coleccion)) return;
        const en = idiomaActual() === 'en';

        coleccion.forEach(p => {
            const traduccion = traduccionPara(p, fuente);
            if(!traduccion) return;
            guardarOriginales(p);
            p._traduccionEnAuto = traduccion.term;

            // Se usa para encontrar "traffic light" -> "Semáforo" aunque la
            // persona todavía tenga seleccionada la interfaz ES. Este alias no
            // se muestra en la ficha como si fuera una variante española.
            agregarAliasBusquedaOculto(p, traduccion);

            if(en){
                p.variantes = variantesConIngles(p._i18nAutoVariantesEs, traduccion);
                if(traduccion.definition) p.definicion = traduccion.definition;
            } else {
                p.variantes = p._i18nAutoVariantesEs;
                p.definicion = p._i18nAutoDefinicionEs;
            }
        });
    }

    function resolverTraduccionVisible(palabra, fuente){
        const curada = traduccionCurada(palabra);
        if(curada) return curada;
        const principal = mapas[fuente] || mapas.diccionario;
        return principal.palabra.get(norm(palabra))
            || mapas.diccionario.palabra.get(norm(palabra))
            || mapas.vocabulario.palabra.get(norm(palabra))
            || null;
    }

    function etiquetarResultado(root){
        if(!root) return;
        const titulo = root.querySelector('h3.fw-bold');
        if(!titulo) return;

        if(!titulo.dataset.lspediaEs){
            titulo.dataset.lspediaEs = String(titulo.textContent || '').trim();
        }
        const original = titulo.dataset.lspediaEs;
        const fuente = root.id === 'resultadoCategorias' ? 'vocabulario' : 'diccionario';
        const tr = resolverTraduccionVisible(original, fuente);
        let etiqueta = root.querySelector('.lspedia-es-term-auto');

        if(idiomaActual() === 'en' && tr){
            titulo.textContent = tr.term;
            const manual = root.querySelector('.lspedia-es-term:not(.lspedia-es-term-auto)');
            if(manual){
                manual.textContent = 'Spanish: ' + original;
                if(etiqueta) etiqueta.remove();
            } else {
                if(!etiqueta){
                    etiqueta = document.createElement('div');
                    etiqueta.className = 'lspedia-es-term lspedia-es-term-auto';
                    titulo.parentElement.insertAdjacentElement('afterend', etiqueta);
                }
                etiqueta.textContent = 'Spanish: ' + original;
            }
        } else {
            titulo.textContent = original;
            if(etiqueta) etiqueta.remove();
        }
    }

    function traducirTarjetasVocabulario(){
        const en = idiomaActual() === 'en';
        document.querySelectorAll('#resultadoCategorias .categoria-resultado-titulo').forEach(el => {
            if(!el.dataset.lspediaEs) el.dataset.lspediaEs = String(el.textContent || '').trim();
            const original = el.dataset.lspediaEs;
            const tr = resolverTraduccionVisible(original, 'vocabulario');
            el.textContent = en && tr ? tr.term : original;
        });
    }

    function aplicarTodo(){
        if(window.App && Array.isArray(window.App.datos)){
            aplicarColeccion(window.App.datos, 'diccionario');
        }
        if(window.LSPediaVocabularioPublico && typeof window.LSPediaVocabularioPublico.obtener === 'function'){
            aplicarColeccion(window.LSPediaVocabularioPublico.obtener(), 'vocabulario');
        }
        etiquetarResultado(document.getElementById('resultado'));
        etiquetarResultado(document.getElementById('resultadoCategorias'));
        etiquetarResultado(document.getElementById('resultadoCategoriasDiccionario'));
        traducirTarjetasVocabulario();
    }

    function programar(){
        if(rafPendiente) cancelAnimationFrame(rafPendiente);
        rafPendiente = requestAnimationFrame(() => {
            rafPendiente = 0;
            aplicarTodo();
        });
    }

    function refrescarFichaActual(){
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('p');
        if(!ref) return;
        const esVocab = params.get('fuente') === 'vocabulario' || params.get('vista') === 'vocabulario';
        if(esVocab) return;
        try {
            if(typeof window.mostrarPalabraPorNombre === 'function'){
                window.mostrarPalabraPorNombre(ref);
            }
        } catch(_e) {}
    }

    function aplicarYRefrescar(){
        aplicarTodo();
        refrescarFichaActual();
        setTimeout(programar, 0);
        setTimeout(programar, 250);
    }

    function cargarTraducciones(){
        return fetch(RUTA + '?v=' + Date.now(), { cache: 'no-store' })
            .then(respuesta => {
                if(!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
                return respuesta.json();
            })
            .then(documento => {
                integrarDocumento(documento);
                aplicarYRefrescar();
                document.dispatchEvent(new CustomEvent('lspedia:traduccionesEnListas', {
                    detail: {
                        diccionario: mapas.diccionario.palabra.size,
                        vocabulario: mapas.vocabulario.palabra.size
                    }
                }));
            })
            .catch(error => {
                // La capa bilingüe curada de i18n.js sigue funcionando si este
                // archivo todavía no existe o la red falla temporalmente.
                console.warn('LSPedia EN automático no disponible:', error);
            });
    }

    function iniciar(){
        cargarTraducciones();

        document.addEventListener('lspedia:datosListos', () => {
            setTimeout(programar, 0);
            setTimeout(programar, 300);
        });
        document.addEventListener('lspedia:vocabularioPublicoListo', () => {
            setTimeout(programar, 0);
            setTimeout(programar, 250);
        });

        document.addEventListener('lspedia:idiomaCambiado', () => {
            setTimeout(aplicarYRefrescar, 0);
        });

        document.addEventListener('click', () => setTimeout(programar, 0), true);
        document.addEventListener('keydown', evento => {
            if(evento.key === 'Enter') setTimeout(programar, 0);
        }, true);

    }

    window.LSPediaI18nAuto = {
        recargar: cargarTraducciones,
        aplicar: aplicarYRefrescar,
        cargado: () => cargado,
        traduccion: (palabra, fuente) => resolverTraduccionVisible(palabra, fuente || 'diccionario')
    };

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
