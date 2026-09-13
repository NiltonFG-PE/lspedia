/* LSPedia — búsqueda tolerante y fichas visuales del Diccionario.
   -----------------------------------------------------------------
   Reglas de producto:
   - SOLO Diccionario puede consultar una ficha sin video cuando ya tiene
     concepto o imagen de apoyo.
   - Vocabulario permanece video-first: este módulo no amplía su banco ni
     convierte filas sin video en fichas públicas.
   - Las faltas de ortografía del usuario se toleran para buscar, pero nunca
     se muestran como variantes correctas dentro de la ficha.
   - Las formas gramaticales pueden llevar a su palabra base sin cambiar el
     contenido visible. Ej.: "fui" puede sugerir Ser e Ir.
   - Máximo 2 imágenes de apoyo por ficha del Diccionario.
   - GA4 recibe un evento adicional por sección para que Admin distinga
     búsquedas de Diccionario y Vocabulario en las búsquedas nuevas.
*/
(function(){
    'use strict';

    const RUTA_DICCIONARIO = 'data/palabras.json';
    const RUTA_AYUDAS = 'data/busqueda-ayudas.json';
    let diccionarioConsultable = [];
    let ayudasBusqueda = {aliasOcultos:[], gramatica:[]};
    const aliasesDinamicosPorObjetivo = new Map();

    // Fallback local: se conserva por robustez si el JSON auxiliar no carga.
    const ALIASES_BUSQUEDA_DICCIONARIO = new Map([
        ['gracias', ['grax', 'grx', 'muxas grax', 'grasias', 'muchas grasias']],
        ['por favor', ['plis', 'xfa', 'xfis', 'pls', 'por fabor']],
        ['disculpa', ['diskulpa', 'disculpame']],
        ['resiliencia', ['resilencia', 'resciliencia']],
        ['matemáticas', ['matematicas']],
        ['educación', ['educacion']],
        ['acompañar', ['acompanar']],
        ['hipótesis', ['hipotesis']],
        ['trascender', ['transcender']],
        ['hola', ['holi', 'holis', 'holiwi', 'olas', 'oli', 'olis']],
        ['buenos días', ['buenos dias', 'bnas', 'bnas dias']],
        ['buenas tardes', ['bnas', 'bnas tardes']],
        ['buenas noches', ['bnas', 'bnas noches']],
        ['bienvenido', ['bienvenid@', 'bienvenid@s']],
        ['adiós', ['adios']]
    ]);

    function texto(v){ return String(v == null ? '' : v).trim(); }
    function normal(v){
        return texto(v)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g,'')
            .toLocaleLowerCase('es-PE');
    }
    function tieneVideo(p){ return !!texto(p && p.video); }
    function imagenesDeRegistro(p){
        return texto(p && p.imagen).split(',').map(x=>x.trim()).filter(Boolean).slice(0,2);
    }
    function primeraImagen(p){
        for(const valor of imagenesDeRegistro(p)){
            if(/^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(valor)) return valor;
        }
        return '';
    }
    function esConsultableDiccionario(p){
        if(!p || !texto(p.palabra) || !texto(p.categoria)) return false;
        return tieneVideo(p) || !!texto(p.definicion) || !!primeraImagen(p);
    }

    function agregarAliasObjetivo(objetivo, entrada){
        const clave = normal(objetivo);
        const alias = texto(entrada);
        if(!clave || !alias) return;
        const actual = aliasesDinamicosPorObjetivo.get(clave) || [];
        if(!actual.some(x=>normal(x)===normal(alias))) actual.push(alias);
        aliasesDinamicosPorObjetivo.set(clave, actual);
    }

    function prepararAyudas(data){
        ayudasBusqueda = data && typeof data === 'object' ? data : {aliasOcultos:[],gramatica:[]};
        aliasesDinamicosPorObjetivo.clear();

        (Array.isArray(ayudasBusqueda.aliasOcultos) ? ayudasBusqueda.aliasOcultos : []).forEach(item=>{
            const entrada = texto(item && item.entrada);
            (Array.isArray(item && item.objetivos) ? item.objetivos : []).forEach(obj=>agregarAliasObjetivo(obj, entrada));
        });

        (Array.isArray(ayudasBusqueda.gramatica) ? ayudasBusqueda.gramatica : []).forEach(item=>{
            const forma = texto(item && item.forma);
            (Array.isArray(item && item.objetivos) ? item.objetivos : []).forEach(obj=>agregarAliasObjetivo(obj, forma));
        });

        window.LSPediaBusquedaAyudas = ayudasBusqueda;
    }

    function aliasesParaPalabra(p){
        if(!p || !p.palabra) return [];
        const propios = Array.isArray(p._aliasBusqueda)
            ? p._aliasBusqueda.map(texto).filter(Boolean)
            : [];
        const clave = normal(p.palabra);
        const curados = ALIASES_BUSQUEDA_DICCIONARIO.get(clave) || [];
        const dinamicos = aliasesDinamicosPorObjetivo.get(clave) || [];
        return Array.from(new Set(propios.concat(curados,dinamicos).map(texto).filter(Boolean)));
    }

    function prepararAliases(lista){
        (Array.isArray(lista) ? lista : []).forEach(p => {
            if(!p || typeof p !== 'object') return;
            const aliases = aliasesParaPalabra(p);
            if(aliases.length) p._aliasBusqueda = aliases;
        });
        return lista;
    }

    function filtrarConsultablesDiccionario(lista){
        const filtrada = Array.isArray(lista) ? lista.filter(esConsultableDiccionario) : [];
        return prepararAliases(filtrada);
    }

    function aplicarDiccionario(lista){
        diccionarioConsultable = filtrarConsultablesDiccionario(lista);
        try{
            if(typeof App !== 'undefined' && App && Array.isArray(App.datos)) App.datos = diccionarioConsultable;
        }catch(_e){}
        try{
            if(window.App && Array.isArray(window.App.datos)) window.App.datos = diccionarioConsultable;
        }catch(_e){}
        try{
            if(typeof obtenerDatosDiccionarioPublicables === 'function'){
                obtenerDatosDiccionarioPublicables = filtrarConsultablesDiccionario;
                window.obtenerDatosDiccionarioPublicables = filtrarConsultablesDiccionario;
            }
        }catch(_e){}
        try{ if(typeof actualizarEstadisticas === 'function') actualizarEstadisticas(); }catch(_e){}
        document.dispatchEvent(new CustomEvent('lspedia:datosConsultablesListos',{
            detail:{fuente:'diccionario',total:diccionarioConsultable.length}
        }));
    }

    async function cargarDiccionario(){
        try{
            const marca = Date.now();
            const [rDic,rAyudas] = await Promise.all([
                fetch(RUTA_DICCIONARIO + '?_visual=' + marca, {cache:'no-store'}),
                fetch(RUTA_AYUDAS + '?_ayudas=' + marca, {cache:'no-store'}).catch(()=>null)
            ]);
            if(!rDic.ok) throw new Error('HTTP '+rDic.status);
            const data = await rDic.json();
            if(rAyudas && rAyudas.ok){
                try{ prepararAyudas(await rAyudas.json()); }catch(_e){ prepararAyudas(null); }
            }else{
                prepararAyudas(null);
            }
            aplicarDiccionario(Array.isArray(data) ? data : []);
        }catch(error){
            prepararAyudas(null);
            console.warn('LSPedia búsqueda visual: no se pudo cargar '+RUTA_DICCIONARIO, error);
        }
    }

    // Amplía el ranking del buscador con aliases ocultos. El texto visible de
    // la ficha sigue leyendo exclusivamente `palabra` y `variantes` correctas.
    function envolverClasificadorAliases(){
        try{
            if(typeof clasificarCoincidencia !== 'function' || clasificarCoincidencia.__lspAliasesOcultos) return;
            const original = clasificarCoincidencia;
            const envuelta = function(p, consultaNormalizada){
                const base = original.apply(this, arguments);
                const consulta = normal(consultaNormalizada);
                const aliases = aliasesParaPalabra(p).map(normal).filter(Boolean);
                if(!consulta || !aliases.length) return base;

                if(aliases.includes(consulta)){
                    return base >= 0 ? Math.min(base, 2) : 2;
                }
                if(aliases.some(a => a.startsWith(consulta) || a.includes(consulta))){
                    return base >= 0 ? Math.min(base, 5) : 5;
                }
                return base;
            };
            envuelta.__lspAliasesOcultos = true;
            clasificarCoincidencia = envuelta;
            window.clasificarCoincidencia = envuelta;
        }catch(_e){}
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

    function buscarPorTextoBoton(btn, lista){
        const crudo = normal(btn && btn.textContent);
        if(!crudo) return null;
        const ordenadas = (Array.isArray(lista)?lista:[]).slice().sort((a,b)=>texto(b.palabra).length-texto(a.palabra).length);
        return ordenadas.find(p=>{
            const nombre = normal(p.palabra);
            return nombre && (crudo === nombre || crudo.startsWith(nombre+' ') || crudo.startsWith(nombre+'\n') || crudo.includes(nombre));
        }) || null;
    }

    function enriquecerSugerenciasDiccionario(){
        const cont = document.getElementById('sugerencias');
        if(!cont) return;
        setTimeout(()=>{
            cont.querySelectorAll('.sugerencia-thumb-wrap.sin-video').forEach(wrap=>{
                const btn = wrap.closest('button');
                const p = buscarPorTextoBoton(btn, diccionarioConsultable);
                const imagen = primeraImagen(p);
                if(!imagen) return;
                wrap.classList.remove('sin-video');
                wrap.classList.add('visual-sin-video');
                wrap.textContent = '';
                const img = document.createElement('img');
                img.src = imagen;
                img.alt = 'Imagen de ' + texto(p && p.palabra);
                img.loading = 'lazy';
                img.addEventListener('error',()=>{
                    wrap.classList.add('sin-video');
                    wrap.classList.remove('visual-sin-video');
                    wrap.textContent='🤟';
                },{once:true});
                wrap.appendChild(img);
            });
        },0);
    }

    function engancharSugerenciasVisuales(){
        const inputDic = document.getElementById('buscar');
        if(inputDic && !inputDic.dataset.visualSugerencias){
            inputDic.dataset.visualSugerencias='1';
            inputDic.addEventListener('input', enriquecerSugerenciasDiccionario, false);
        }
    }

    function personalizarProximamenteDiccionario(){
        ['resultado','resultadoCategoriasDiccionario'].forEach(id=>{
            const cont = document.getElementById(id);
            if(!cont) return;
            cont.querySelectorAll('span').forEach(span=>{
                if(texto(span.textContent)==='Video próximamente') span.textContent='Video en LSP próximamente';
            });
        });
    }

    function envolverFichaDiccionario(){
        try{
            const original = window.mostrarPalabra;
            if(typeof original !== 'function' || original.__lspVisualWrapped) return;
            const envuelta = function(){
                const r = original.apply(this, arguments);
                setTimeout(personalizarProximamenteDiccionario,0);
                return r;
            };
            envuelta.__lspVisualWrapped = true;
            window.mostrarPalabra = envuelta;
            try{ mostrarPalabra = envuelta; }catch(_e){}
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
        envolverClasificadorAliases();
        envolverAnalytics();
        envolverFichaDiccionario();
        engancharSugerenciasVisuales();
        cargarDiccionario();
        setTimeout(()=>{
            limitarImagenesFicha();
            envolverClasificadorAliases();
            envolverAnalytics();
            envolverFichaDiccionario();
            engancharSugerenciasVisuales();
        },1200);
    }

    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    else iniciar();
})();
