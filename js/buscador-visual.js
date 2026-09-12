/* LSPedia — búsqueda visual y contenido consultable sin video.
   ------------------------------------------------------------
   Reglas de producto:
   - Una palabra puede consultarse antes de tener video si ya tiene concepto o imagen.
   - El video en LSP sigue siendo la versión completa de la ficha.
   - Máximo 2 imágenes por ficha; la PRIMERA es la oficial para juegos.
   - Quiz/Juegos conservan sus bancos con video/imagen real; no se fuerzan borradores.
   - El buscador conserva el ranking/fuzzy search de script.js y solo amplía su banco.
   - GA4 recibe además un evento por sección para distinguir Diccionario/Vocabulario.
*/
(function(){
    'use strict';

    const RUTA_DICCIONARIO = 'data/palabras.json';
    const RUTA_VOCABULARIO = 'data/vocabulario.json';
    let diccionarioConsultable = [];
    let vocabularioConsultable = [];

    function texto(v){ return String(v == null ? '' : v).trim(); }
    function normal(v){
        return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-PE');
    }
    function tieneVideo(p){ return !!texto(p && p.video); }
    function primeraImagen(p){
        const candidatas = texto(p && p.imagen).split(',').map(x=>x.trim()).filter(Boolean);
        for(const valor of candidatas.slice(0,2)){
            if(/^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(valor)) return valor;
        }
        return '';
    }
    function esConsultable(p){
        if(!p || !texto(p.palabra) || !texto(p.categoria)) return false;
        return tieneVideo(p) || !!texto(p.definicion) || !!primeraImagen(p);
    }
    function filtrarConsultables(lista){
        return Array.isArray(lista) ? lista.filter(esConsultable) : [];
    }

    function aplicarDiccionario(lista){
        diccionarioConsultable = filtrarConsultables(lista);
        try{
            if(typeof App !== 'undefined' && App && Array.isArray(App.datos)) App.datos = diccionarioConsultable;
        }catch(_e){}
        try{
            if(window.App && Array.isArray(window.App.datos)) window.App.datos = diccionarioConsultable;
        }catch(_e){}
        try{
            if(typeof obtenerDatosDiccionarioPublicables === 'function'){
                obtenerDatosDiccionarioPublicables = filtrarConsultables;
                window.obtenerDatosDiccionarioPublicables = filtrarConsultables;
            }
        }catch(_e){}
        try{ if(typeof actualizarEstadisticas === 'function') actualizarEstadisticas(); }catch(_e){}
        document.dispatchEvent(new CustomEvent('lspedia:datosConsultablesListos',{detail:{fuente:'diccionario',total:diccionarioConsultable.length}}));
    }

    function aplicarVocabulario(lista){
        vocabularioConsultable = filtrarConsultables(lista);
        window.LSPediaVocabularioConsultable = vocabularioConsultable;

        // Vocabulario puede ver las fichas consultables; QuizV2 NO se toca y
        // sigue filtrando por video dentro de js/quiz.js.
        const devolverBanco = function(){
            if(vocabularioConsultable.length) return vocabularioConsultable;
            try{
                return (window.QuizV2 && typeof QuizV2.obtenerBanco === 'function') ? QuizV2.obtenerBanco() : [];
            }catch(_e){ return []; }
        };
        try{
            if(typeof obtenerBancoHoja2 === 'function'){
                obtenerBancoHoja2 = devolverBanco;
                window.obtenerBancoHoja2 = devolverBanco;
            }
        }catch(_e){}
        try{
            if(typeof obtenerDatosVocabulario === 'function'){
                obtenerDatosVocabulario = devolverBanco;
                window.obtenerDatosVocabulario = devolverBanco;
            }
        }catch(_e){}
        try{ if(typeof actualizarEstadisticas === 'function') actualizarEstadisticas(); }catch(_e){}
        document.dispatchEvent(new CustomEvent('lspedia:datosConsultablesListos',{detail:{fuente:'vocabulario',total:vocabularioConsultable.length}}));
    }

    async function cargarJson(ruta, aplicar){
        try{
            const r = await fetch(ruta + '?_visual=' + Date.now(), {cache:'no-store'});
            if(!r.ok) throw new Error('HTTP '+r.status);
            const data = await r.json();
            aplicar(Array.isArray(data) ? data : (data && Array.isArray(data.preguntas) ? data.preguntas : []));
        }catch(error){
            console.warn('LSPedia búsqueda visual: no se pudo cargar '+ruta, error);
        }
    }

    function limitarImagenesFicha(){
        try{
            if(typeof obtenerImagenesDeApoyo !== 'function' || obtenerImagenesDeApoyo.__lspMax2) return;
            const original = obtenerImagenesDeApoyo;
            const limitada = function(p){
                const imgs = original(p);
                return Array.isArray(imgs) ? imgs.slice(0,2) : [];
            };
            limitada.__lspMax2 = true;
            obtenerImagenesDeApoyo = limitada;
            window.obtenerImagenesDeApoyo = limitada;
        }catch(_e){}
    }

    function mejorarMiniaturaVocabulario(){
        try{
            if(typeof generarMiniaturaVocabulario !== 'function' || generarMiniaturaVocabulario.__lspVisual) return;
            const original = generarMiniaturaVocabulario;
            const mejorada = function(p){
                if(tieneVideo(p)) return original(p);
                const imagen = primeraImagen(p);
                if(!imagen) return original(p);
                const nombre = texto(p && p.palabra).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
                const src = imagen.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
                return '<div class="sugerencia-thumb-wrap visual-sin-video"><img src="'+src+'" alt="Imagen de '+nombre+'" loading="lazy"></div>';
            };
            mejorada.__lspVisual = true;
            generarMiniaturaVocabulario = mejorada;
            window.generarMiniaturaVocabulario = mejorada;
        }catch(_e){}
    }

    function buscarPorTextoBoton(btn, lista){
        const crudo = normal(btn && btn.textContent);
        if(!crudo) return null;
        const ordenadas = (Array.isArray(lista)?lista:[]).slice().sort((a,b)=>texto(b.palabra).length-texto(a.palabra).length);
        return ordenadas.find(p=>{
            const nombre = normal(p.palabra);
            return nombre && (crudo === nombre || crudo.startsWith(nombre+' ') || crudo.startsWith(nombre+'\n') || crudo.includes(nombre));
        }) || null;
    }

    function enriquecerSugerencias(contenedorId, lista){
        const cont = document.getElementById(contenedorId);
        if(!cont) return;
        setTimeout(()=>{
            cont.querySelectorAll('.sugerencia-thumb-wrap.sin-video').forEach(wrap=>{
                const btn = wrap.closest('button');
                const p = buscarPorTextoBoton(btn, lista);
                const imagen = primeraImagen(p);
                if(!imagen) return;
                wrap.classList.remove('sin-video');
                wrap.classList.add('visual-sin-video');
                wrap.textContent = '';
                const img = document.createElement('img');
                img.src = imagen;
                img.alt = 'Imagen de ' + texto(p && p.palabra);
                img.loading = 'lazy';
                img.addEventListener('error',()=>{ wrap.classList.add('sin-video'); wrap.classList.remove('visual-sin-video'); wrap.textContent='🤟'; },{once:true});
                wrap.appendChild(img);
            });
        },0);
    }

    function engancharSugerenciasVisuales(){
        const inputDic = document.getElementById('buscar');
        const inputVoc = document.getElementById('buscarCategorias');
        if(inputDic && !inputDic.dataset.visualSugerencias){
            inputDic.dataset.visualSugerencias='1';
            inputDic.addEventListener('input',()=>enriquecerSugerencias('sugerencias', diccionarioConsultable), false);
        }
        if(inputVoc && !inputVoc.dataset.visualSugerencias){
            inputVoc.dataset.visualSugerencias='1';
            inputVoc.addEventListener('input',()=>enriquecerSugerencias('sugerenciasCategorias', vocabularioConsultable), false);
        }
    }

    function personalizarProximamente(){
        ['resultado','resultadoCategorias','resultadoCategoriasDiccionario'].forEach(id=>{
            const cont = document.getElementById(id);
            if(!cont) return;
            cont.querySelectorAll('span').forEach(span=>{
                if(texto(span.textContent)==='Video próximamente') span.textContent='Video en LSP próximamente';
            });
        });
    }

    function envolverFicha(nombreFuncion){
        try{
            const original = window[nombreFuncion];
            if(typeof original !== 'function' || original.__lspVisualWrapped) return;
            const envuelta = function(){
                const r = original.apply(this, arguments);
                setTimeout(personalizarProximamente,0);
                return r;
            };
            envuelta.__lspVisualWrapped = true;
            window[nombreFuncion] = envuelta;
            try{
                if(nombreFuncion==='mostrarPalabra') mostrarPalabra = envuelta;
                if(nombreFuncion==='mostrarPalabraSimplificada') mostrarPalabraSimplificada = envuelta;
            }catch(_e){}
        }catch(_e){}
    }

    function terminoSeguro(v){
        const t = texto(v).replace(/\s+/g,' ').slice(0,80);
        if(t.length < 2) return '';
        if(/@/.test(t) || /https?:\/\//i.test(t) || /www\./i.test(t)) return '';
        if(/(?:\d[\s.-]*){7,}/.test(t)) return '';
        return t;
    }
    function origenSeguro(origen){
        return normal(origen)==='vocabulario' ? 'vocabulary' : 'dictionary';
    }
    function emitirBusquedaSeccion(consulta, origen, sinResultado){
        const term = terminoSeguro(consulta);
        if(!term || typeof window.gtag !== 'function') return;
        const sufijo = origenSeguro(origen);
        const evento = sinResultado ? 'lspedia_no_result_'+sufijo : 'lspedia_search_'+sufijo;
        try{
            window.gtag('event', evento, {
                search_term: term.toLocaleLowerCase('es-PE'),
                search_section: sufijo
            });
        }catch(_e){}
    }

    function envolverAnalytics(){
        try{
            if(typeof registrarBusquedaGA4 === 'function' && !registrarBusquedaGA4.__lspSeccion){
                const original = registrarBusquedaGA4;
                const envuelta = function(consulta, origen){
                    const r = original.apply(this, arguments);
                    emitirBusquedaSeccion(consulta, origen, false);
                    return r;
                };
                envuelta.__lspSeccion = true;
                registrarBusquedaGA4 = envuelta;
                window.registrarBusquedaGA4 = envuelta;
            }
        }catch(_e){}
        try{
            if(typeof registrarBusquedaSinResultado === 'function' && !registrarBusquedaSinResultado.__lspSeccion){
                const original = registrarBusquedaSinResultado;
                const envuelta = function(consulta, origen){
                    const r = original.apply(this, arguments);
                    emitirBusquedaSeccion(consulta, origen, true);
                    return r;
                };
                envuelta.__lspSeccion = true;
                registrarBusquedaSinResultado = envuelta;
                window.registrarBusquedaSinResultado = envuelta;
            }
        }catch(_e){}
    }

    function inyectarEstilos(){
        if(document.getElementById('lsp-buscador-visual-css')) return;
        const style = document.createElement('style');
        style.id='lsp-buscador-visual-css';
        style.textContent = [
            '.sugerencia-thumb-wrap.visual-sin-video{background:#f8fafc;overflow:hidden}',
            '.sugerencia-thumb-wrap.visual-sin-video img{width:100%;height:100%;object-fit:cover;display:block}',
            '.lsp-ficha-visual-note{font-size:.78rem;color:#64748b;text-align:center;margin-top:.35rem}'
        ].join('');
        document.head.appendChild(style);
    }

    function iniciar(){
        inyectarEstilos();
        limitarImagenesFicha();
        mejorarMiniaturaVocabulario();
        envolverAnalytics();
        envolverFicha('mostrarPalabra');
        envolverFicha('mostrarPalabraSimplificada');
        engancharSugerenciasVisuales();
        cargarJson(RUTA_DICCIONARIO, aplicarDiccionario);
        cargarJson(RUTA_VOCABULARIO, aplicarVocabulario);
        setTimeout(()=>{
            limitarImagenesFicha();
            mejorarMiniaturaVocabulario();
            envolverAnalytics();
            envolverFicha('mostrarPalabra');
            envolverFicha('mostrarPalabraSimplificada');
            engancharSugerenciasVisuales();
        },1200);
    }

    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    else iniciar();
})();
