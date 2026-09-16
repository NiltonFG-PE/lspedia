/* ============================================================
   LSPedia — diagnóstico y recuperación de videos YouTube
   ------------------------------------------------------------
   Objetivos:
   - Capturar el código real de error de la IFrame API.
   - Añadir origin/enablejsapi para reducir errores de identificación (153).
   - Mostrar una salida útil en vez del mensaje genérico de YouTube.
   - Permitir reintentar o abrir el video directamente en YouTube.
   - Guardar los últimos diagnósticos localmente para poder investigarlos.
   ============================================================ */
(function(){
    'use strict';

    const CLAVE_LOG = 'lspedia_youtube_diagnosticos_v1';
    const MAX_LOGS = 20;
    let playerOriginal = null;
    let parcheAplicado = false;
    let callbackEnvuelto = false;

    const MENSAJES = {
        2:   'El enlace o ID del video no es válido.',
        5:   'YouTube tuvo un problema al reproducir este video en HTML5.',
        100: 'El video fue eliminado, es privado o YouTube no lo encuentra.',
        101: 'El propietario del video no permite reproducirlo en otras páginas.',
        150: 'El propietario del video no permite reproducirlo en otras páginas.',
        153: 'YouTube no pudo identificar correctamente el sitio que solicita el video.'
    };

    function asegurarEstilos(){
        if(document.getElementById('lspediaYoutubeDiagnosticoCss')) return;
        const style = document.createElement('style');
        style.id = 'lspediaYoutubeDiagnosticoCss';
        style.textContent = `
            .reproductor-palabra-wrap{position:relative!important;}
            .lspedia-video-fallback{
                position:absolute; inset:0; z-index:20;
                display:flex; flex-direction:column; align-items:center; justify-content:center;
                gap:10px; padding:22px; text-align:center;
                background:linear-gradient(145deg,#0b1424 0%,#141c31 100%);
                color:#f8fbff; border-radius:inherit;
            }
            .lspedia-video-fallback-icono{font-size:2rem;line-height:1;}
            .lspedia-video-fallback-titulo{font-weight:900;font-size:1.05rem;}
            .lspedia-video-fallback-texto{max-width:520px;color:#cbd7e6;font-size:.9rem;line-height:1.4;}
            .lspedia-video-fallback-acciones{display:flex;gap:9px;flex-wrap:wrap;justify-content:center;margin-top:3px;}
            .lspedia-video-fallback button,.lspedia-video-fallback a{
                min-height:40px;padding:9px 14px;border-radius:12px;font-weight:800;text-decoration:none;
                display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;
            }
            .lspedia-video-reintentar{background:#ffc107;color:#172033;border:1px solid #ffc107;}
            .lspedia-video-youtube{background:#ff0033;color:#fff;border:1px solid #ff0033;}
            .lspedia-video-codigo{font-size:.72rem;color:#8192a8;margin-top:2px;}
            html[data-lsp-tema="light"] .lspedia-video-fallback{box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);}
        `;
        document.head.appendChild(style);
    }

    function idObjetivo(elemento){
        if(typeof elemento === 'string') return elemento;
        if(elemento && typeof elemento.id === 'string') return elemento.id;
        return '';
    }

    function obtenerIdVideo(opciones){
        return String((opciones && opciones.videoId) || '').trim();
    }

    function mensajeError(codigo){
        return MENSAJES[codigo] || 'YouTube no pudo reproducir este video dentro de LSPedia.';
    }

    function guardarDiagnostico(codigo, videoId, objetivo){
        const item = {
            fecha: new Date().toISOString(),
            codigo: Number(codigo) || 0,
            videoId: String(videoId || ''),
            objetivo: String(objetivo || ''),
            pagina: location.pathname + location.search
        };
        try{
            const anterior = JSON.parse(localStorage.getItem(CLAVE_LOG) || '[]');
            const lista = Array.isArray(anterior) ? anterior : [];
            lista.unshift(item);
            localStorage.setItem(CLAVE_LOG, JSON.stringify(lista.slice(0, MAX_LOGS)));
        }catch(_e){}
        try{
            document.dispatchEvent(new CustomEvent('lspedia:youtubeError', {detail:item}));
        }catch(_e){}
        console.warn('[LSPedia][YouTube]', item, mensajeError(item.codigo));
        return item;
    }

    function quitarFallback(){
        document.querySelectorAll('.lspedia-video-fallback').forEach(function(n){ n.remove(); });
    }

    function mostrarFallback(evento, codigo, videoId, objetivo){
        asegurarEstilos();
        const nodo = document.getElementById(objetivo);
        if(!nodo) return;
        const wrap = nodo.closest('.reproductor-palabra-wrap') || nodo.parentElement;
        if(!wrap) return;

        const anterior = wrap.querySelector('.lspedia-video-fallback');
        if(anterior) anterior.remove();

        const panel = document.createElement('div');
        panel.className = 'lspedia-video-fallback';
        panel.setAttribute('role','alert');

        const icono = document.createElement('div');
        icono.className = 'lspedia-video-fallback-icono';
        icono.textContent = '🎬';

        const titulo = document.createElement('div');
        titulo.className = 'lspedia-video-fallback-titulo';
        titulo.textContent = 'No se pudo reproducir este video aquí';

        const texto = document.createElement('div');
        texto.className = 'lspedia-video-fallback-texto';
        texto.textContent = mensajeError(codigo);

        const acciones = document.createElement('div');
        acciones.className = 'lspedia-video-fallback-acciones';

        const reintentar = document.createElement('button');
        reintentar.type = 'button';
        reintentar.className = 'lspedia-video-reintentar';
        reintentar.textContent = '↻ Reintentar';
        reintentar.addEventListener('click', function(){
            panel.remove();
            try{
                if(evento && evento.target && typeof evento.target.cueVideoById === 'function'){
                    evento.target.cueVideoById(videoId);
                    setTimeout(function(){
                        try{ if(typeof evento.target.playVideo === 'function') evento.target.playVideo(); }catch(_e){}
                    }, 120);
                }else{
                    location.reload();
                }
            }catch(_e){ location.reload(); }
        });
        acciones.appendChild(reintentar);

        if(videoId){
            const enlace = document.createElement('a');
            enlace.className = 'lspedia-video-youtube';
            enlace.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
            enlace.target = '_blank';
            enlace.rel = 'noopener';
            enlace.textContent = '▶ Abrir en YouTube';
            acciones.appendChild(enlace);
        }

        const detalle = document.createElement('div');
        detalle.className = 'lspedia-video-codigo';
        detalle.textContent = 'Diagnóstico YouTube: código ' + String(codigo || 'desconocido');

        panel.append(icono, titulo, texto, acciones, detalle);
        wrap.appendChild(panel);
    }

    function prepararOpciones(elemento, opciones){
        const objetivo = idObjetivo(elemento);
        const videoId = obtenerIdVideo(opciones);
        const copia = Object.assign({}, opciones || {});
        copia.playerVars = Object.assign({}, (opciones && opciones.playerVars) || {});

        // Identificación explícita del sitio. Ayuda a evitar el error 153.
        if(!copia.playerVars.origin && location.origin && /^https?:/.test(location.origin)){
            copia.playerVars.origin = location.origin;
        }
        if(copia.playerVars.enablejsapi == null) copia.playerVars.enablejsapi = 1;

        copia.events = Object.assign({}, (opciones && opciones.events) || {});
        const onErrorOriginal = copia.events.onError;
        const onReadyOriginal = copia.events.onReady;

        copia.events.onReady = function(evento){
            // Si un reintento anterior dejó un aviso, un player ya listo lo limpia.
            if(objetivo === 'reproductorPalabra') quitarFallback();
            if(typeof onReadyOriginal === 'function'){
                try{ onReadyOriginal(evento); }catch(error){ console.error(error); }
            }
        };

        copia.events.onError = function(evento){
            const codigo = Number(evento && evento.data) || 0;
            guardarDiagnostico(codigo, videoId, objetivo);
            if(objetivo === 'reproductorPalabra'){
                mostrarFallback(evento, codigo, videoId, objetivo);
            }
            if(typeof onErrorOriginal === 'function'){
                try{ onErrorOriginal(evento); }catch(error){ console.error(error); }
            }
        };
        return copia;
    }

    function aplicarParche(){
        if(parcheAplicado) return true;
        if(!window.YT || typeof window.YT.Player !== 'function') return false;
        if(window.YT.Player.__lspediaDiagnostico){
            parcheAplicado = true;
            return true;
        }

        playerOriginal = window.YT.Player;
        function PlayerLSPedia(elemento, opciones){
            const preparadas = prepararOpciones(elemento, opciones || {});
            return new playerOriginal(elemento, preparadas);
        }
        try{ Object.setPrototypeOf(PlayerLSPedia, playerOriginal); }catch(_e){}
        PlayerLSPedia.prototype = playerOriginal.prototype;
        PlayerLSPedia.__lspediaDiagnostico = true;
        PlayerLSPedia.__lspediaOriginal = playerOriginal;
        window.YT.Player = PlayerLSPedia;
        parcheAplicado = true;
        return true;
    }

    function envolverCallbackYouTube(){
        if(callbackEnvuelto) return;
        callbackEnvuelto = true;
        const anterior = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function(){
            aplicarParche();
            if(typeof anterior === 'function') return anterior.apply(this, arguments);
        };
    }

    function iniciar(){
        asegurarEstilos();
        if(!aplicarParche()){
            envolverCallbackYouTube();
            // Respaldo por si otro módulo redefine el callback después.
            [100,300,700,1500,3000,6000].forEach(function(ms){
                setTimeout(aplicarParche, ms);
            });
        }
    }

    window.LSPediaYouTubeDiagnostico = {
        aplicar: aplicarParche,
        mensajes: Object.assign({}, MENSAJES),
        ultimos: function(){
            try{
                const valor = JSON.parse(localStorage.getItem(CLAVE_LOG) || '[]');
                return Array.isArray(valor) ? valor : [];
            }catch(_e){ return []; }
        },
        limpiar: function(){
            try{ localStorage.removeItem(CLAVE_LOG); }catch(_e){}
        }
    };

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    else iniciar();
})();
