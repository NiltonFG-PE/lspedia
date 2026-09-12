/* LSPedia — sección "Lo nuevo".
   Muestra los 12 contenidos más recientes de Diccionario + Vocabulario.
   La etiqueta NUEVO dura 14 días, pero la tarjeta puede seguir visible
   mientras continúe entre las 12 publicaciones más recientes. */
(function(){
    'use strict';

    let itemsLoNuevo = [];
    let diasEtiquetaNuevo = 14;

    function $(id){ return document.getElementById(id); }
    function texto(v){ return String(v == null ? '' : v).trim(); }
    function normal(v){ return texto(v).toLocaleLowerCase('es-PE'); }
    function escapeHtml(v){
        return String(v || '').replace(/[&<>"']/g, c => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        })[c]);
    }

    function refPalabra(p){
        try{
            if(typeof window.obtenerIdPalabra === 'function'){
                return texto(window.obtenerIdPalabra(p));
            }
        }catch(_e){}
        return texto(p && (p.id || p.palabra));
    }

    function datosDiccionario(){
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

    function miniatura(x){
        const dePalabra = texto(x && x.palabra && x.palabra.imagen).split(',')[0].trim();
        const deRegistro = texto(x && x.registro && x.registro.imagen).split(',')[0].trim();
        const imagen = dePalabra || deRegistro;
        if(/^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(imagen)) return imagen;

        const videoId = extraerIdVideo(x && x.palabra && x.palabra.video);
        if(videoId) return 'https://i.ytimg.com/vi/' + encodeURIComponent(videoId) + '/mqdefault.jpg';
        return 'img/imagen-no-disponible.svg';
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
            titulo.innerHTML = '<span class="lsp-mejora-icono">✨</span>Lo nuevo';
        }

        const subtitulo = card.querySelector('.lsp-mejora-sub');
        if(subtitulo){
            subtitulo.textContent = 'Últimos contenidos publicados en Diccionario y Vocabulario.';
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

    function render(){
        actualizarEncabezado();
        const caja = $('lspNuevasLista');
        if(!caja) return;

        const publicadas = itemsLoNuevo
            .map(buscarContenido)
            .filter(Boolean)
            .slice(0, 12);

        if(!publicadas.length){
            caja.innerHTML = '<span class="lsp-mejora-sub">Las próximas publicaciones aparecerán aquí.</span>';
            return;
        }

        caja.innerHTML = publicadas.map((x, i) => {
            const nombre = texto(x.palabra.palabra);
            const categoria = texto(x.palabra.categoria || x.registro.categoria);
            const etiquetaFuente = x.fuente === 'vocabulario' ? '🗂️ Vocabulario' : '📘 Diccionario';
            const badgeNuevo = esNuevo(x.registro.fecha)
                ? '<span class="lsp-nueva-badge">NUEVO</span>'
                : '';

            return '<button type="button" class="lsp-nueva-palabra" data-lo-nuevo="' + i + '" aria-label="Abrir ' + escapeHtml(nombre) + ' en ' + escapeHtml(etiquetaFuente.replace(/^[^ ]+\s*/, '')) + '">' +
                '<span class="lsp-nueva-thumb-wrap"><img class="lsp-nueva-thumb" src="' + escapeHtml(miniatura(x)) + '" alt="Miniatura de ' + escapeHtml(nombre) + '" loading="lazy" decoding="async"></span>' +
                '<span class="lsp-nueva-badge">' + escapeHtml(etiquetaFuente) + '</span>' +
                badgeNuevo +
                '<span class="lsp-nueva-nombre">' + escapeHtml(nombre) + '</span>' +
                '<span class="lsp-nueva-cat">' + escapeHtml(categoria) + '</span>' +
                '</button>';
        }).join('');

        caja.querySelectorAll('.lsp-nueva-thumb').forEach(img => img.addEventListener('error', () => {
            if(img.dataset.fallback) return;
            img.dataset.fallback = '1';
            img.src = 'img/imagen-no-disponible.svg';
        }));

        caja.querySelectorAll('[data-lo-nuevo]').forEach(btn => {
            btn.onclick = () => abrirContenido(publicadas[Number(btn.dataset.loNuevo)]);
        });
    }

    async function cargar(){
        try{
            const r = await fetch('data/nuevas-palabras.json?_=' + Date.now(), {cache:'no-store'});
            if(!r.ok) throw new Error('HTTP ' + r.status);
            const d = await r.json();
            itemsLoNuevo = Array.isArray(d.items) ? d.items : [];
            const dias = Number(d.diasEtiquetaNuevo);
            if(Number.isFinite(dias) && dias > 0) diasEtiquetaNuevo = dias;
        }catch(_e){
            itemsLoNuevo = [];
        }
        render();
    }


    // ANIMACION_LO_NUEVO_VIEWPORT_V2_20260912
    // Espera a que la tarjeta sea visible antes de llamar la atención.
    // Así la animación no termina mientras el usuario todavía está arriba,
    // mirando el buscador. Se ejecuta una sola vez por carga de página.
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