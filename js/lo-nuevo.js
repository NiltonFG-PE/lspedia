/* LSPedia — sección "Lo nuevo".
   Regla editorial:
   - Lo nuevo depende del VIDEO publicado, no de la imagen.
   - Una ficha de Diccionario con imagen pero sin video puede estar en el
     Diccionario, pero no aparece aquí.
   - Una ficha con video aunque todavía no tenga imagen sí puede aparecer aquí;
     en ese caso se usa la miniatura del video.
   Muestra las publicaciones del período elegido de Diccionario + Vocabulario. */
(function(){
    'use strict';

    let itemsLoNuevo = [];
    let diasEtiquetaNuevo = 14;
    let diccionarioCrudo = [];
    let publicadasVisibles = [];
    let modoSeleccion = false;
    let periodoDias = 30;
    const seleccionadas = new Set();
    let referenciasCompartidas = new URLSearchParams(location.search).getAll('nuevo')
        .filter(ref => /^(diccionario|vocabulario):.{1,200}$/.test(ref));
    let compartidasDesplazadas = false;
    let overflowAntesCatalogo = '';

    function claveFicha(x){ return x.fuente + ':' + refPalabra(x.palabra); }

    function urlCompartirNovedades(fichas){
        const url = new URL(location.pathname, location.origin);
        url.searchParams.set('vista', 'diccionario');
        url.searchParams.set('novedades', 'compartidas');
        fichas.forEach(x => url.searchParams.append('nuevo', claveFicha(x)));
        url.hash = 'lspNuevasCard';
        return url.href;
    }

    function botonAccion(textoBoton, accion, id){
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'lsp-nuevo-accion';
        if(id) boton.id = id;
        boton.textContent = textoBoton;
        boton.addEventListener('click', accion);
        return boton;
    }

    function compartirFichas(fichas){
        if(!fichas.length) return;
        let dialogo = $('lspCompartirNovedades');
        if(!dialogo){
            dialogo = document.createElement('dialog');
            dialogo.id = 'lspCompartirNovedades';
            dialogo.className = 'lsp-nuevo-dialogo';
            dialogo.setAttribute('aria-labelledby', 'lspCompartirNovedadesTitulo');
            document.body.appendChild(dialogo);
        }
        dialogo.replaceChildren();
        const titulo = document.createElement('h2');
        titulo.id = 'lspCompartirNovedadesTitulo';
        titulo.textContent = 'Compartir novedades';
        const resumen = document.createElement('p');
        resumen.textContent = fichas.length + (fichas.length === 1 ? ' ficha: ' : ' fichas: ')
            + fichas.map(x => x.palabra.palabra).join(', ');
        const etiqueta = document.createElement('label');
        etiqueta.textContent = 'Enlace para compartir';
        etiqueta.htmlFor = 'lspEnlaceNovedades';
        const campo = document.createElement('input');
        campo.id = 'lspEnlaceNovedades';
        campo.type = 'text';
        campo.readOnly = true;
        campo.value = urlCompartirNovedades(fichas);
        campo.addEventListener('click', () => campo.select());
        const estado = document.createElement('p');
        estado.className = 'lsp-nuevo-estado';
        estado.setAttribute('role', 'status');
        const acciones = document.createElement('div');
        acciones.className = 'lsp-nuevo-acciones';
        acciones.appendChild(botonAccion('Copiar enlace', async () => {
            try{
                await navigator.clipboard.writeText(campo.value);
                estado.textContent = 'Enlace copiado. Ya puedes pegarlo donde quieras compartirlo.';
            }catch(_e){
                campo.focus(); campo.select();
                estado.textContent = 'Selecciona y copia el enlace con tu navegador.';
            }
        }));
        if(typeof navigator.share === 'function'){
            acciones.appendChild(botonAccion('Compartir…', async () => {
                try{
                    await navigator.share({title:'Lo nuevo en LSPedia', text:'Mira estas novedades en LSPedia 🤟', url:campo.value});
                }catch(e){
                    if(e.name !== 'AbortError') estado.textContent = 'Puedes usar Copiar enlace para compartirlo.';
                }
            }));
        }
        acciones.appendChild(botonAccion('Cerrar', () => dialogo.close()));
        dialogo.append(titulo, resumen, etiqueta, campo, acciones, estado);
        dialogo.showModal();
    }

    function volverALoNuevo(){
        referenciasCompartidas = [];
        modoSeleccion = false; seleccionadas.clear();
        const url = new URL(location.href);
        url.searchParams.delete('nuevo'); url.searchParams.delete('novedades');
        history.replaceState(history.state, '', url.href);
        render();
    }

    function actualizarAcciones(){
        const barra = $('lspCatalogoAcciones');
        if(!barra) return;
        barra.replaceChildren();
        const elegidas = publicadasVisibles.filter(x => seleccionadas.has(claveFicha(x)));
        if(modoSeleccion){
            const contador = document.createElement('span');
            contador.className = 'lsp-nuevo-contador';
            contador.setAttribute('role', 'status');
            contador.textContent = elegidas.length + ' seleccionadas';
            const compartir = botonAccion('Compartir selección', () => compartirFichas(elegidas), 'lspCompartirSeleccion');
            compartir.disabled = !elegidas.length;
            barra.append(contador, compartir,
                botonAccion('Seleccionar todas', () => { publicadasVisibles.forEach(x => seleccionadas.add(claveFicha(x))); renderCatalogo(); }),
                botonAccion('Cancelar', () => { modoSeleccion = false; seleccionadas.clear(); renderCatalogo(); }));
        }else{
            const compartir = botonAccion('Compartir todo', () => compartirFichas(publicadasVisibles), 'lspCompartirTodo');
            compartir.disabled = !publicadasVisibles.length;
            const seleccionar = botonAccion('Seleccionar videos', () => { modoSeleccion = true; renderCatalogo(); }, 'lspSeleccionarNovedades');
            seleccionar.disabled = !publicadasVisibles.length;
            barra.append(compartir, seleccionar);
        }
        if(referenciasCompartidas.length) barra.appendChild(botonAccion('Ver Lo nuevo', volverALoNuevo));
    }

    function dentroDelPeriodo(fecha, dias){
        const t = Date.parse(texto(fecha));
        const diferencia = Date.now() - t;
        return Number.isFinite(t) && diferencia >= -86400000 && diferencia <= dias * 86400000;
    }

    function actualizarMenu(){
        const boton = $('lspBtn30Dias');
        if(!boton) return;
        boton.textContent = 'Ver todo ›';
        boton.setAttribute('aria-label', 'Ver todo: abrir catálogo de Lo nuevo');
        boton.setAttribute('aria-haspopup', 'dialog');
        boton.setAttribute('aria-controls', 'lspCatalogoNovedades');
        boton.removeAttribute('aria-expanded');
    }

    function abrirCatalogo(){
        let catalogo = $('lspCatalogoNovedades');
        if(!catalogo){
            catalogo = document.createElement('dialog');
            catalogo.id = 'lspCatalogoNovedades';
            catalogo.className = 'lsp-catalogo';
            catalogo.setAttribute('aria-labelledby', 'lspCatalogoTitulo');
            const cabecera = document.createElement('div');
            cabecera.className = 'lsp-catalogo-cabecera';
            const fila = document.createElement('div');
            fila.className = 'lsp-catalogo-titulo-fila';
            const titulo = document.createElement('h2');
            titulo.id = 'lspCatalogoTitulo';
            const cerrar = botonAccion('×', () => catalogo.close());
            cerrar.className += ' lsp-catalogo-cerrar';
            cerrar.setAttribute('aria-label', 'Cerrar catálogo');
            fila.append(titulo, cerrar);
            const descripcion = document.createElement('p');
            descripcion.id = 'lspCatalogoDescripcion';
            const filtros = document.createElement('div');
            filtros.className = 'lsp-catalogo-filtros';
            const etiqueta = document.createElement('label');
            etiqueta.htmlFor = 'lspCatalogoPeriodo';
            etiqueta.textContent = 'Publicaciones';
            const periodo = document.createElement('select');
            periodo.id = 'lspCatalogoPeriodo';
            [[7,'Últimos 7 días'],[30,'Últimos 30 días'],[0,'Todas las publicaciones']].forEach(([valor,nombre]) => {
                const opcion = document.createElement('option');
                opcion.value = String(valor); opcion.textContent = nombre; periodo.appendChild(opcion);
            });
            periodo.value = String(periodoDias);
            periodo.addEventListener('change', () => {
                periodoDias = Number(periodo.value);
                volverALoNuevo();
            });
            const contador = document.createElement('span');
            contador.id = 'lspCatalogoCantidad';
            contador.setAttribute('role', 'status');
            filtros.append(etiqueta, periodo, contador);
            const acciones = document.createElement('div');
            acciones.id = 'lspCatalogoAcciones'; acciones.className = 'lsp-nuevo-acciones';
            cabecera.append(fila, descripcion, filtros, acciones);
            const grid = document.createElement('div');
            grid.id = 'lspCatalogoGrid'; grid.className = 'lsp-catalogo-grid';
            catalogo.append(cabecera, grid);
            catalogo.addEventListener('close', () => {
                document.body.style.overflow = overflowAntesCatalogo;
                modoSeleccion = false; seleccionadas.clear();
            });
            document.body.appendChild(catalogo);
        }
        if(!catalogo.open){
            overflowAntesCatalogo = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            catalogo.showModal();
        }
        renderCatalogo();
    }

    function fechaMostrar(fecha){
        const t = Date.parse(texto(fecha));
        if(!Number.isFinite(t)) return 'Fecha no disponible';
        return new Intl.DateTimeFormat('es-PE', {day:'2-digit',month:'short',year:'numeric',timeZone:'America/Lima'}).format(new Date(t));
    }

    function renderCatalogo(){
        const catalogo = $('lspCatalogoNovedades');
        if(!catalogo || !catalogo.open) return;
        $('lspCatalogoTitulo').textContent = referenciasCompartidas.length ? '✨ Novedades compartidas' : '✨ Lo nuevo · catálogo';
        $('lspCatalogoDescripcion').textContent = modoSeleccion
            ? 'Marca los videos que quieres compartir.'
            : 'Explora las publicaciones de Diccionario y Vocabulario. Toca una ficha para ver el video.';
        $('lspCatalogoPeriodo').value = String(periodoDias);
        $('lspCatalogoCantidad').textContent = publicadasVisibles.length + ' videos';
        actualizarAcciones();
        const grid = $('lspCatalogoGrid');
        grid.replaceChildren();
        publicadasVisibles.forEach(x => {
            const tarjeta = crearTarjeta(x, true);
            const fecha = document.createElement('time');
            fecha.className = 'lsp-catalogo-fecha';
            const indice = itemsLoNuevo.find(r => fuenteRegistro(r) === x.fuente && normal(r.palabra) === normal(x.palabra.palabra) && normal(r.categoria) === normal(x.palabra.categoria));
            const iso = fechaAISO(x.registro.fecha || fechaPalabra(x.palabra) || (indice && indice.fecha));
            if(iso) fecha.dateTime = iso;
            fecha.textContent = fechaMostrar(iso);
            tarjeta.appendChild(fecha);
            grid.appendChild(tarjeta);
        });
        if(!publicadasVisibles.length){
            const vacio = document.createElement('p');
            vacio.className = 'lsp-catalogo-vacio';
            vacio.textContent = referenciasCompartidas.length
                ? 'Cargando las fichas compartidas. Si ya no están disponibles, puedes ver Lo nuevo.'
                : 'No hay publicaciones en este período. Prueba con Todas las publicaciones.';
            grid.appendChild(vacio);
        }
    }

    window.LSPediaNovedades = {abrirCatalogo};

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
            titulo.append(icono, document.createTextNode(referenciasCompartidas.length ? 'Novedades compartidas' : 'Lo nuevo'));
        }

        const subtitulo = card.querySelector('.lsp-mejora-sub');
        if(subtitulo){
            subtitulo.textContent = referenciasCompartidas.length
                ? 'Novedades compartidas contigo. Abre una ficha para ver su contenido.'
                : (modoSeleccion ? 'Toca las fichas que quieres compartir.' : 'Últimos videos publicados en Diccionario y Vocabulario.');
        }
    }

    function abrirContenido(x){
        if(!x || !x.palabra) return;

        if(x.fuente === 'vocabulario'){
            const referencia = refPalabra(x.palabra);
            const abrir = function(){
                if(typeof window.mostrarPalabraVocabularioPorReferencia === 'function'){
                    if(!window.mostrarPalabraVocabularioPorReferencia(referencia)) return false;
                    return true;
                }
                return false;
            };
            if(abrir()) return;

            const api = window.LSPediaVocabularioPublico;
            if(api && typeof api.cargar === 'function'){
                Promise.resolve(api.cargar()).then(function(){
                    if(abrir()) return;
                    location.href = location.pathname
                        + '?vista=vocabulario&p=' + encodeURIComponent(referencia || x.palabra.palabra)
                        + '&fuente=vocabulario';
                }).catch(function(){
                    location.href = location.pathname
                        + '?vista=vocabulario&p=' + encodeURIComponent(referencia || x.palabra.palabra)
                        + '&fuente=vocabulario';
                });
                return;
            }

            location.href = location.pathname
                + '?vista=vocabulario&p=' + encodeURIComponent(referencia || x.palabra.palabra)
                + '&fuente=vocabulario';
            return;
        }

        if(typeof window.mostrarPalabra === 'function'){
            window.mostrarPalabra(x.palabra);
            return;
        }
        location.href = location.pathname + '?p=' + encodeURIComponent(refPalabra(x.palabra) || x.palabra.palabra);
    }

    function crearTarjeta(x, enCatalogo = false){
        const seleccionar = enCatalogo && modoSeleccion;
        const nombre = texto(x.palabra.palabra);
        const categoria = texto(x.palabra.categoria || x.registro.categoria);
        const etiquetaFuente = x.fuente === 'vocabulario' ? '🗂️ Vocabulario' : '📘 Diccionario';

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'lsp-nueva-palabra';
        boton.setAttribute('aria-label', 'Abrir ' + nombre + ' en ' + (x.fuente === 'vocabulario' ? 'Vocabulario' : 'Diccionario'));
        if(seleccionar){
            const elegida = seleccionadas.has(claveFicha(x));
            boton.setAttribute('aria-label', 'Seleccionar ' + nombre + ' en ' + (x.fuente === 'vocabulario' ? 'Vocabulario' : 'Diccionario'));
            boton.setAttribute('aria-pressed', String(elegida));
            boton.classList.toggle('lsp-nueva-seleccionada', elegida);
            const marca = document.createElement('span');
            marca.className = 'lsp-nueva-marca';
            marca.textContent = elegida ? '✓' : '+';
            marca.setAttribute('aria-hidden', 'true');
            boton.appendChild(marca);
        }
        boton.addEventListener('click', () => {
            if(!seleccionar){
                const catalogo = $('lspCatalogoNovedades');
                if(enCatalogo && catalogo && catalogo.open) catalogo.close();
                abrirContenido(x); return;
            }
            const clave = claveFicha(x);
            if(seleccionadas.has(clave)) seleccionadas.delete(clave); else seleccionadas.add(clave);
            // No reemplaza el botón enfocado ni desplaza el carrusel al seleccionar.
            const elegida = seleccionadas.has(clave);
            boton.setAttribute('aria-pressed', String(elegida));
            boton.classList.toggle('lsp-nueva-seleccionada', elegida);
            boton.querySelector('.lsp-nueva-marca').textContent = elegida ? '✓' : '+';
            actualizarAcciones();
        });

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

        const registros = referenciasCompartidas.length ? referenciasCompartidas.map(ref => {
            const separador = ref.indexOf(':');
            return {fuente:ref.slice(0,separador),id:ref.slice(separador+1)};
        }) : itemsLoNuevo.filter(x => !periodoDias || dentroDelPeriodo(x.fecha, periodoDias));
        const publicadas = registros
            .map(buscarContenido)
            .filter(x => x && x.palabra && tieneVideoValido(x.palabra));
        publicadasVisibles = publicadas;
        actualizarMenu();
        renderCatalogo();

        caja.replaceChildren();
        if(!publicadas.length){
            const vacio = document.createElement('span');
            vacio.className = 'lsp-mejora-sub';
            vacio.textContent = referenciasCompartidas.length
                ? 'Cargando las fichas compartidas. Si ya no están disponibles, puedes ver todas las novedades.'
                : 'No hay videos publicados en los últimos ' + periodoDias + ' días.';
            caja.appendChild(vacio);
            return;
        }

        const fragmento = document.createDocumentFragment();
        publicadas.slice(0,12).forEach(x => fragmento.appendChild(crearTarjeta(x)));
        caja.appendChild(fragmento);
        if(referenciasCompartidas.length && !compartidasDesplazadas){
            compartidasDesplazadas = true;
            requestAnimationFrame(() => {
                abrirCatalogo();
                const card = $('lspNuevasCard');
                if(typeof window.scrollAlPrimerResultado === 'function') window.scrollAlPrimerResultado(card);
                else card.scrollIntoView({block:'start',behavior:'smooth'});
            });
        }
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
        setTimeout(actualizarMenu, 2000);
        cargar();
        document.addEventListener('lspedia:datosListos', () => setTimeout(render, 0));
        document.addEventListener('lspedia:vocabularioPublicoListo', () => setTimeout(render, 0));
        setTimeout(render, 350);
        setTimeout(render, 1200);
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    }else{
        iniciar();
    }
})();
