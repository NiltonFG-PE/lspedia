/* LSPedia — sección "Lo nuevo".
   Regla editorial:
   - Lo nuevo depende del VIDEO publicado, no de la imagen.
   - Una ficha de Diccionario con imagen pero sin video puede estar en el
     Diccionario, pero no aparece aquí.
   - Una ficha con video aunque todavía no tenga imagen sí puede aparecer aquí;
     en ese caso se usa la miniatura del video.
   Muestra los 12 contenidos más recientes de Diccionario + Vocabulario. */
(function(){
    'use strict';

    let itemsLoNuevo = [];
    let diasEtiquetaNuevo = 14;
    let diccionarioCrudo = [];

    function $(id){ return document.getElementById(id); }
    function texto(v){ return String(v == null ? '' : v).trim(); }
    function normal(v){ return texto(v).toLocaleLowerCase('es-PE'); }

    function refPalabra(p){
        try{
            if(typeof window.obtenerIdPalabra === 'function'){
                return texto(window.obtenerIdPalabra(p));
            }
        }catch(_e){}
        return texto(p && (p.id || p.palabra));
    }

    function datosDiccionario(){
        if(Array.isArray(diccionarioCrudo) && diccionarioCrudo.length){
            return diccionarioCrudo.filter(p => p && p.palabra);
        }
        return window.App && Array.isArray(window.App.datos)
            ? window.App.datos.filter(p => p && p.palabra)
            : [];
    }

    function datosVocabulario(){
        try{
            if(typeof window.obtenerDatosVocabulario === 'function'){
                const datos = window.obtenerDatosVocabulario();
                if(Array.isArray(datos)) return datos.filter(p => p && p.palabra);
            }
        }catch(_e){}
        return [];
    }

    function fuenteRegistro(registro){
        return normal(registro && registro.fuente) === 'vocabulario'
            ? 'vocabulario'
            : 'diccionario';
    }

    function buscarContenido(registro){
        const fuente = fuenteRegistro(registro);
        const lista = fuente === 'vocabulario' ? datosVocabulario() : datosDiccionario();
        if(!lista.length) return null;

        const id = texto(registro && registro.id);
        if(id){
            const porId = lista.find(p => refPalabra(p) === id);
            if(porId) return { registro, palabra: porId, fuente };
        }

        const nombre = normal(registro && registro.palabra);
        const categoria = normal(registro && registro.categoria);
        const mismaPalabra = lista.filter(p => normal(p.palabra) === nombre);
        const porCategoria = mismaPalabra.find(p => !categoria || normal(p.categoria) === categoria);
        const palabra = porCategoria || mismaPalabra[0] || null;
        return palabra ? { registro, palabra, fuente } : null;
    }

    function extraerIdVideo(valor){
        try{
            if(typeof window.extraerIdYouTube === 'function'){
                const id = texto(window.extraerIdYouTube(valor));
                if(id) return id;
            }
        }catch(_e){}

        const v = texto(valor);
        if(/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
        try{
            const u = new URL(v, location.href);
            if(/(^|\.)youtu\.be$/i.test(u.hostname)){
                return texto(u.pathname.split('/').filter(Boolean)[0]);
            }
            if(/(^|\.)youtube\.com$/i.test(u.hostname) || /(^|\.)youtube-nocookie\.com$/i.test(u.hostname)){
                const q = texto(u.searchParams.get('v'));
                if(q) return q;
                const partes = u.pathname.split('/').filter(Boolean);
                const marca = partes.findIndex(x => ['embed','shorts','live'].includes(x));
                if(marca >= 0 && partes[marca + 1]) return texto(partes[marca + 1]);
            }
        }catch(_e){}
        return '';
    }

    function tieneVideoValido(p){
        return !!extraerIdVideo(p && p.video);
    }

    function esImagenReal(valor){
        const imagen = texto(valor).split(',')[0].trim();
        return /^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(imagen) &&
            /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(imagen);
    }

    function miniatura(x){
        const dePalabra = texto(x && x.palabra && x.palabra.imagen).split(',')[0].trim();
        const deRegistro = texto(x && x.registro && x.registro.imagen).split(',')[0].trim();
        const imagen = esImagenReal(dePalabra) ? dePalabra : (esImagenReal(deRegistro) ? deRegistro : '');
        if(imagen) return imagen;

        const videoId = extraerIdVideo(x && x.palabra && x.palabra.video);
        if(videoId) return 'https://i.ytimg.com/vi/' + encodeURIComponent(videoId) + '/mqdefault.jpg';
        return 'img/imagen-no-disponible.svg';
    }

    function fechaAISO(valor){
        const v = texto(valor);
        if(!v) return '';
        const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if(m){
            return m[3] + '-' + m[2].padStart(2,'0') + '-' + m[1].padStart(2,'0') + 'T12:00:00Z';
        }
        const t = Date.parse(v);
        return Number.isFinite(t) ? new Date(t).toISOString() : '';
    }

    function fechaPalabra(p){
        return fechaAISO(
            p && (p.fechaPublicacion || p.fechapublicacion || p.fecha_publicacion)
        );
    }

    function claveRegistro(x){
        return fuenteRegistro(x) + '|' + normal(x && x.palabra) + '|' + normal(x && x.categoria);
    }

    function integrarDiccionarioPorVideo(registros){
        const salida = Array.isArray(registros) ? registros.slice() : [];
        const existentes = new Set(salida.map(claveRegistro));

        datosDiccionario().forEach(p => {
            if(!p || !p.palabra || !p.categoria || !tieneVideoValido(p)) return;
            const fecha = fechaPalabra(p);
            if(!fecha) return;
            const registro = {
                id: refPalabra(p),
                palabra: p.palabra,
                categoria: p.categoria,
                imagen: esImagenReal(p.imagen) ? texto(p.imagen).split(',')[0].trim() : '',
                fecha,
                origenFecha: 'fechaPublicacion-video',
                fuente: 'diccionario'
            };
            const clave = claveRegistro(registro);
            if(!existentes.has(clave)){
                salida.push(registro);
                existentes.add(clave);
            }
        });

        return salida.sort((a,b) => {
            const ta = Date.parse(texto(a && a.fecha)) || 0;
            const tb = Date.parse(texto(b && b.fecha)) || 0;
            return tb - ta;
        });
    }

    function esNuevo(fecha){
        const t = Date.parse(texto(fecha));
        if(!Number.isFinite(t)) return false;
        const diferencia = Date.now() - t;
        return diferencia >= -86400000 && diferencia <= diasEtiquetaNuevo * 86400000;
    }

    function actualizarEncabezado(){
        const card = $('lspNuevasCard');
        if(!card) return;
        card.setAttribute('aria-label', 'Lo nuevo en LSPedia');

        const titulo = card.querySelector('.lsp-mejora-titulo');
        if(titulo){
            titulo.replaceChildren();
            const icono = document.createElement('span');
            icono.className = 'lsp-mejora-icono';
            icono.textContent = '✨';
            icono.setAttribute('aria-hidden', 'true');
            titulo.append(icono, document.createTextNode('Lo nuevo'));
        }

        const subtitulo = card.querySelector('.lsp-mejora-sub');
        if(subtitulo){
            subtitulo.textContent = 'Últimos videos publicados en Diccionario y Vocabulario.';
        }
    }

    function abrirContenido(x){
        if(!x || !x.palabra) return;

        if(x.fuente === 'vocabulario'){
            const referencia = refPalabra(x.palabra);
            if(typeof window.mostrarPalabraVocabularioPorReferencia === 'function'){
                window.mostrarPalabraVocabularioPorReferencia(referencia);
                window.scrollTo({top:0, behavior:'smooth'});
                return;
            }
            location.href = location.pathname
                + '?vista=vocabulario&p=' + encodeURIComponent(referencia || x.palabra.palabra)
                + '&fuente=vocabulario';
            return;
        }

        if(typeof window.mostrarPalabra === 'function'){
            window.mostrarPalabra(x.palabra);
            window.scrollTo({top:0, behavior:'smooth'});
            return;
        }
        location.href = location.pathname + '?p=' + encodeURIComponent(refPalabra(x.palabra) || x.palabra.palabra);
    }

    function crearTarjeta(x){
        const nombre = texto(x.palabra.palabra);
        const categoria = texto(x.palabra.categoria || x.registro.categoria);
        const etiquetaFuente = x.fuente === 'vocabulario' ? '🗂️ Vocabulario' : '📘 Diccionario';

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'lsp-nueva-palabra';
        boton.setAttribute('aria-label', 'Abrir ' + nombre + ' en ' + (x.fuente === 'vocabulario' ? 'Vocabulario' : 'Diccionario'));
        boton.addEventListener('click', () => abrirContenido(x));

        const thumbWrap = document.createElement('span');
        thumbWrap.className = 'lsp-nueva-thumb-wrap';
        const img = document.createElement('img');
        img.className = 'lsp-nueva-thumb';
        img.src = miniatura(x);
        img.alt = 'Miniatura de ' + nombre;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', () => {
            if(img.dataset.fallback) return;
            img.dataset.fallback = '1';
            img.src = 'img/imagen-no-disponible.svg';
        });
        thumbWrap.appendChild(img);

        const fuente = document.createElement('span');
        fuente.className = 'lsp-nueva-badge';
        fuente.textContent = etiquetaFuente;

        boton.append(thumbWrap, fuente);
        if(esNuevo(x.registro.fecha)){
            const nuevo = document.createElement('span');
            nuevo.className = 'lsp-nueva-badge';
            nuevo.textContent = 'NUEVO';
            boton.appendChild(nuevo);
        }

        const nombreEl = document.createElement('span');
        nombreEl.className = 'lsp-nueva-nombre';
        nombreEl.textContent = nombre;
        const categoriaEl = document.createElement('span');
        categoriaEl.className = 'lsp-nueva-cat';
        categoriaEl.textContent = categoria;
        boton.append(nombreEl, categoriaEl);
        return boton;
    }

    function render(){
        actualizarEncabezado();
        const caja = $('lspNuevasLista');
        if(!caja) return;

        const publicadas = itemsLoNuevo
            .map(buscarContenido)
            .filter(x => x && x.palabra && tieneVideoValido(x.palabra))
            .slice(0, 12);

        caja.replaceChildren();
        if(!publicadas.length){
            const vacio = document.createElement('span');
            vacio.className = 'lsp-mejora-sub';
            vacio.textContent = 'Los próximos videos publicados aparecerán aquí.';
            caja.appendChild(vacio);
            return;
        }

        const fragmento = document.createDocumentFragment();
        publicadas.forEach(x => fragmento.appendChild(crearTarjeta(x)));
        caja.appendChild(fragmento);
    }

    function leerJson(url){
        const core = window.LSPediaCore;
        if(core && typeof core.leerJsonSeguro === 'function'){
            return core.leerJsonSeguro(url, {
                timeoutMs: 6500,
                reintentos: 1,
                esperaReintentoMs: 350,
                fetch: {cache:'no-store'}
            });
        }
        return fetch(url, {cache:'no-store'}).then(res => {
            if(!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        });
    }

    async function cargar(){
        const marca = Date.now();
        const resultados = await Promise.allSettled([
            leerJson('data/nuevas-palabras.json?_=' + marca),
            leerJson('data/palabras.json?_=' + marca)
        ]);

        let registros = [];
        if(resultados[0].status === 'fulfilled'){
            const d = resultados[0].value;
            registros = Array.isArray(d && d.items) ? d.items : [];
            const dias = Number(d && d.diasEtiquetaNuevo);
            if(Number.isFinite(dias) && dias > 0) diasEtiquetaNuevo = dias;
        }else{
            console.warn('[LSPedia Lo nuevo] No se pudo cargar el índice de novedades:', resultados[0].reason);
        }

        if(resultados[1].status === 'fulfilled'){
            const d = resultados[1].value;
            diccionarioCrudo = Array.isArray(d) ? d : [];
        }else{
            console.warn('[LSPedia Lo nuevo] No se pudo cargar el Diccionario; se conserva la vista disponible:', resultados[1].reason);
            diccionarioCrudo = [];
        }

        itemsLoNuevo = integrarDiccionarioPorVideo(registros);
        render();
    }

    // ANIMACION_LO_NUEVO_VIEWPORT_V2_20260912
    function prepararAnimacionAtencion(intentos){
        intentos = Number(intentos) || 0;
        const card = $('lspNuevasCard');
        if(!card){
            if(intentos < 12){
                setTimeout(() => prepararAnimacionAtencion(intentos + 1), 300);
            }
            return;
        }

        if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
            return;
        }

        let activada = false;
        function activar(){
            if(activada) return;
            activada = true;
            card.classList.add('lsp-lo-nuevo-atencion');
            setTimeout(() => card.classList.remove('lsp-lo-nuevo-atencion'), 6500);
        }

        if('IntersectionObserver' in window){
            const observer = new IntersectionObserver((entradas) => {
                const visible = entradas.some(entrada =>
                    entrada.isIntersecting && entrada.intersectionRatio >= 0.22
                );
                if(visible){
                    activar();
                    observer.disconnect();
                }
            }, {
                threshold: [0.22, 0.45],
                rootMargin: '0px 0px -6% 0px'
            });
            observer.observe(card);
        }else{
            setTimeout(activar, 1800);
        }
    }

    function iniciar(){
        actualizarEncabezado();
        prepararAnimacionAtencion();
        cargar();
        document.addEventListener('lspedia:datosListos', () => setTimeout(render, 0));
        setTimeout(render, 350);
        setTimeout(render, 1200);
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    }else{
        iniciar();
    }
})();
