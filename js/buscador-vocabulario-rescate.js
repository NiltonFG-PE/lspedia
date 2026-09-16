/* ============================================================
   LSPedia — respaldo robusto del buscador de Vocabulario
   ------------------------------------------------------------
   Objetivo:
   - Si el buscador principal no pinta sugerencias o no abre resultados,
     este módulo toma el relevo sin duplicar la experiencia normal.
   - Usa primero la colección pública ya cargada y, si hace falta,
     data/vocabulario.json como respaldo.
   - No modifica datos ni mezcla Diccionario con Vocabulario.
   ============================================================ */
(function(){
    'use strict';

    if(window.__LSPEDIA_BUSCADOR_VOCABULARIO_RESCATE__) return;
    window.__LSPEDIA_BUSCADOR_VOCABULARIO_RESCATE__ = true;

    const INPUT_ID = 'buscarCategorias';
    const BOTON_ID = 'btnBuscarCategorias';
    const PANEL_ID = 'sugerenciasCategorias';
    const RESULTADO_ID = 'resultadoCategorias';
    const DATA_URL = 'data/vocabulario.json';
    let cacheLocal = [];
    let cargaEnCurso = null;

    function texto(valor){
        return String(valor == null ? '' : valor).trim();
    }

    function normalizar(valor){
        return texto(valor)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function slug(valor){
        return normalizar(valor)
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function referencia(item){
        try {
            if(typeof window.obtenerIdPalabra === 'function'){
                const id = window.obtenerIdPalabra(item);
                if(id) return id;
            }
        } catch(_e) {}
        const base = slug(item && item.palabra) || 'palabra';
        const categoria = slug(item && item.categoria);
        return categoria ? base + '-' + categoria : base;
    }

    function imagenPublicable(valor){
        const principal = texto(valor).split(',')[0].trim();
        if(!principal) return false;
        return /^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(principal) &&
               /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(principal);
    }

    function prepararLista(lista){
        return (Array.isArray(lista) ? lista : [])
            .filter(function(item){
                return item && texto(item.palabra) && texto(item.categoria) && imagenPublicable(item.imagen);
            })
            .map(function(item){
                return item._fuenteLspedia === 'vocabulario'
                    ? item
                    : Object.assign({}, item, { _fuenteLspedia: 'vocabulario' });
            });
    }

    function datosDisponibles(){
        try {
            if(window.LSPediaVocabularioPublico && typeof window.LSPediaVocabularioPublico.obtener === 'function'){
                const publicos = window.LSPediaVocabularioPublico.obtener();
                if(Array.isArray(publicos) && publicos.length) return publicos;
            }
        } catch(_e) {}

        try {
            if(typeof window.obtenerBancoHoja2 === 'function'){
                const banco = window.obtenerBancoHoja2();
                if(Array.isArray(banco) && banco.length) return banco;
            }
        } catch(_e) {}

        return cacheLocal;
    }

    function cargarRespaldo(){
        if(cacheLocal.length) return Promise.resolve(cacheLocal);
        if(cargaEnCurso) return cargaEnCurso;

        cargaEnCurso = fetch(DATA_URL + '?_buscador=' + Date.now(), { cache:'no-store' })
            .then(function(respuesta){
                if(!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
                return respuesta.json();
            })
            .then(function(data){
                const lista = Array.isArray(data) ? data : (data && Array.isArray(data.preguntas) ? data.preguntas : []);
                cacheLocal = prepararLista(lista);
                return cacheLocal;
            })
            .catch(function(error){
                console.warn('[LSPedia] Respaldo del buscador de Vocabulario no pudo cargar datos:', error);
                return [];
            })
            .finally(function(){ cargaEnCurso = null; });

        return cargaEnCurso;
    }

    function puntuar(item, consulta){
        const palabra = normalizar(item && item.palabra);
        const variantes = texto(item && item.variantes)
            .split(',')
            .map(normalizar)
            .filter(Boolean);

        if(palabra === consulta) return 0;
        if(variantes.indexOf(consulta) >= 0) return 1;
        if(palabra.startsWith(consulta)) return 2;
        if(variantes.some(function(v){ return v.startsWith(consulta); })) return 3;
        if(palabra.includes(consulta)) return 4;
        if(variantes.some(function(v){ return v.includes(consulta); })) return 5;
        return -1;
    }

    function coincidencias(consulta){
        const lista = datosDisponibles();
        return lista
            .map(function(item, indice){ return { item:item, rango:puntuar(item, consulta), indice:indice }; })
            .filter(function(x){ return x.rango >= 0; })
            .sort(function(a,b){
                if(a.rango !== b.rango) return a.rango - b.rango;
                const pa = normalizar(a.item.palabra);
                const pb = normalizar(b.item.palabra);
                return pa.localeCompare(pb, 'es');
            })
            .slice(0, 15)
            .map(function(x){ return x.item; });
    }

    function ocultarPanel(){
        const panel = document.getElementById(PANEL_ID);
        if(!panel) return;
        panel.innerHTML = '';
        panel.style.display = 'none';
        panel.removeAttribute('data-rescate-vocabulario');
    }

    function abrir(item){
        const input = document.getElementById(INPUT_ID);
        if(input) input.value = '';
        ocultarPanel();

        const id = referencia(item);
        try {
            if(typeof window.mostrarPalabraVocabularioPorReferencia === 'function'){
                window.mostrarPalabraVocabularioPorReferencia(id);
                return;
            }
        } catch(error){
            console.warn('[LSPedia] Falló la apertura normal de Vocabulario; se usa navegación directa.', error);
        }

        const url = window.location.pathname
            + '?vista=vocabulario&p=' + encodeURIComponent(id)
            + '&fuente=vocabulario';
        window.location.href = url;
    }

    function crearBoton(item){
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'list-group-item list-group-item-action text-start';
        boton.setAttribute('data-rescate-vocabulario-item', '1');

        const nombre = document.createElement('strong');
        nombre.textContent = texto(item.palabra);
        boton.appendChild(nombre);

        const categoria = document.createElement('span');
        categoria.className = 'badge ms-2';
        categoria.style.fontSize = '10px';
        categoria.textContent = texto(item.categoria);
        boton.appendChild(categoria);

        boton.addEventListener('click', function(evento){
            evento.preventDefault();
            evento.stopPropagation();
            abrir(item);
        });
        return boton;
    }

    function pintarRespaldo(){
        const input = document.getElementById(INPUT_ID);
        const panel = document.getElementById(PANEL_ID);
        if(!input || !panel) return;

        const consulta = normalizar(input.value);
        if(!consulta){
            ocultarPanel();
            return;
        }

        /* Si el buscador original ya respondió, no lo pisamos. */
        const yaTieneResultados = panel.style.display !== 'none' && panel.children.length > 0;
        if(yaTieneResultados && panel.getAttribute('data-rescate-vocabulario') !== '1') return;

        const resultados = coincidencias(consulta);
        panel.innerHTML = '';
        panel.setAttribute('data-rescate-vocabulario', '1');
        panel.style.display = 'block';

        if(!resultados.length){
            const datos = datosDisponibles();
            if(!datos.length){
                const aviso = document.createElement('div');
                aviso.className = 'list-group-item text-secondary small';
                aviso.textContent = 'Cargando vocabulario…';
                panel.appendChild(aviso);
                cargarRespaldo().then(function(){
                    if(normalizar(input.value) === consulta) pintarRespaldo();
                });
                return;
            }

            const aviso = document.createElement('div');
            aviso.className = 'list-group-item text-secondary small';
            aviso.textContent = 'No encontramos esa palabra en Vocabulario.';
            panel.appendChild(aviso);
            return;
        }

        resultados.forEach(function(item){ panel.appendChild(crearBoton(item)); });
    }

    function buscarDirectoRespaldo(){
        const input = document.getElementById(INPUT_ID);
        if(!input) return;
        const consulta = normalizar(input.value);
        if(!consulta) return;

        const lista = coincidencias(consulta);
        if(lista.length){
            const exacta = lista.find(function(item){ return normalizar(item.palabra) === consulta; });
            abrir(exacta || lista[0]);
            return;
        }

        if(!datosDisponibles().length){
            cargarRespaldo().then(buscarDirectoRespaldo);
        } else {
            pintarRespaldo();
        }
    }

    function enganchar(){
        const input = document.getElementById(INPUT_ID);
        const boton = document.getElementById(BOTON_ID);
        if(!input || !boton) return false;

        if(input.dataset.rescateVocabulario !== '1'){
            input.dataset.rescateVocabulario = '1';

            /* Dejamos primero actuar al buscador original. Si no dibuja nada,
               nuestro respaldo responde en el siguiente turno del event loop. */
            input.addEventListener('input', function(){
                setTimeout(pintarRespaldo, 0);
            });
            input.addEventListener('keydown', function(evento){
                if(evento.key !== 'Enter') return;
                const consulta = normalizar(input.value);
                if(!consulta) return;
                setTimeout(function(){
                    const panel = document.getElementById(PANEL_ID);
                    const resultado = document.getElementById(RESULTADO_ID);
                    const originalRespondio =
                        (resultado && resultado.innerHTML.trim()) ||
                        (panel && panel.style.display !== 'none' && panel.children.length > 0 && panel.getAttribute('data-rescate-vocabulario') !== '1');
                    if(!originalRespondio) buscarDirectoRespaldo();
                }, 30);
            });
        }

        if(boton.dataset.rescateVocabulario !== '1'){
            boton.dataset.rescateVocabulario = '1';
            boton.addEventListener('click', function(){
                const consultaAntes = normalizar(input.value);
                if(!consultaAntes) return;
                setTimeout(function(){
                    const resultado = document.getElementById(RESULTADO_ID);
                    const urlYaCambio = new URLSearchParams(window.location.search).get('p');
                    if((resultado && resultado.innerHTML.trim()) || urlYaCambio) return;
                    if(normalizar(input.value) === consultaAntes) buscarDirectoRespaldo();
                }, 40);
            });
        }

        if(input.value.trim()) setTimeout(pintarRespaldo, 0);
        return true;
    }

    function iniciar(){
        enganchar();
        cargarRespaldo().then(function(){
            const input = document.getElementById(INPUT_ID);
            if(input && input.value.trim()) pintarRespaldo();
        });

        [300, 900, 1800, 3200].forEach(function(ms){ setTimeout(enganchar, ms); });
        document.addEventListener('lspedia:vocabularioPublicoListo', function(){
            const input = document.getElementById(INPUT_ID);
            if(input && input.value.trim()) pintarRespaldo();
        });
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once:true });
    else iniciar();

    window.LSPediaBuscadorVocabularioRescate = Object.freeze({
        buscar: function(){ pintarRespaldo(); },
        datos: function(){ return datosDisponibles().slice(); }
    });
})();
