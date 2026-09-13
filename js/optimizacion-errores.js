/* LSPedia — optimización de recursos a partir de la telemetría técnica.
   Complementa el fallback global existente; no crea un segundo sistema visual. */
(function(){
    'use strict';
    const FALLBACK='img/imagen-no-disponible.svg';
    const CLAVE_FALLOS='lspedia_recursos_fallidos_v1';
    const MAX_FALLOS=160;
    const tecnicosRecientes=new Map();
    let fallos=leerFallos();

    function texto(v){return String(v==null?'':v).trim();}
    function urlAbsoluta(v){try{return new URL(texto(v),location.href).href;}catch(_e){return '';}}
    function claveUrl(v){const u=urlAbsoluta(v);if(!u)return '';try{const x=new URL(u);return x.origin===location.origin?x.pathname+x.search:x.href;}catch(_e){return u;}}
    function leerFallos(){try{const raw=JSON.parse(sessionStorage.getItem(CLAVE_FALLOS)||'[]');return new Set(Array.isArray(raw)?raw.slice(-MAX_FALLOS):[]);}catch(_e){return new Set();}}
    function guardarFallos(){try{sessionStorage.setItem(CLAVE_FALLOS,JSON.stringify(Array.from(fallos).slice(-MAX_FALLOS)));}catch(_e){}}
    function recordarFallo(src){const k=claveUrl(src);if(!k)return;fallos.add(k);while(fallos.size>MAX_FALLOS)fallos.delete(fallos.values().next().value);guardarFallos();}
    function yaFallo(src){const k=claveUrl(src);return !!k&&fallos.has(k);}

    function siguienteMiniaturaYouTube(src){
        const u=urlAbsoluta(src);if(!u)return '';
        try{
            const x=new URL(u);
            if(!/(^|\.)i\.ytimg\.com$/i.test(x.hostname))return '';
            if(/\/maxresdefault\.jpg(?:$|[?#])/i.test(x.href))return x.href.replace(/maxresdefault\.jpg/i,'hqdefault.jpg');
            if(/\/hqdefault\.jpg(?:$|[?#])/i.test(x.href))return x.href.replace(/hqdefault\.jpg/i,'mqdefault.jpg');
        }catch(_e){}
        return '';
    }

    function optimizarImagen(img){
        if(!img||img.tagName!=='IMG')return;
        const src=img.currentSrc||img.getAttribute('src')||'';
        if(!src||src.includes('imagen-no-disponible.svg'))return;
        if(!img.hasAttribute('decoding'))img.decoding='async';
        if(!img.hasAttribute('loading')&&!img.hasAttribute('fetchpriority')&&!img.closest('header,.navbar,#filaHeroPrincipal,.splash-screen'))img.loading='lazy';
        if(yaFallo(src)){
            const yt=siguienteMiniaturaYouTube(src);
            img.dataset.lspediaErrorOptimizado='1';
            img.src=yt||FALLBACK;
        }
    }

    function observarNodo(nodo){
        if(!nodo||nodo.nodeType!==1)return;
        if(nodo.tagName==='IMG')optimizarImagen(nodo);
        if(nodo.querySelectorAll)nodo.querySelectorAll('img').forEach(optimizarImagen);
    }

    document.querySelectorAll('img').forEach(optimizarImagen);
    const observer=new MutationObserver(cambios=>cambios.forEach(c=>c.addedNodes&&c.addedNodes.forEach(observarNodo)));
    observer.observe(document.documentElement,{childList:true,subtree:true});

    document.addEventListener('error',function(ev){
        const t=ev.target;
        if(!t||t===window||!['IMG','VIDEO','AUDIO'].includes(t.tagName))return;
        const src=t.currentSrc||t.src||'';if(!src)return;
        recordarFallo(src);
        if(t.tagName==='IMG'&&!texto(t.dataset.lspediaErrorOptimizado)){
            const alternativa=siguienteMiniaturaYouTube(src);
            if(alternativa&&!yaFallo(alternativa)){
                t.dataset.lspediaErrorOptimizado='1';
                t.src=alternativa;
            }
        }
    },true);

    /* script.js y mejoras-producto-base.js ya registran fallos. Esta capa
       evita que el MISMO fallo se envíe dos veces seguidas desde ambos. */
    const gtagOriginal=window.gtag;
    if(typeof gtagOriginal==='function'&&!gtagOriginal.__lspediaTecnicaDedup){
        function gtagDeduplicado(){
            try{
                const args=Array.from(arguments);
                if(args[0]==='event'&&['image_load_error','media_load_error','app_runtime_error'].includes(args[1])){
                    const p=args[2]||{};
                    const recurso=texto(p.resource_path||p.image_path||p.media_type||p.error_kind||'');
                    const seccion=texto(p.app_section||'');
                    const k=args[1]+'|'+recurso+'|'+seccion;
                    const ahora=Date.now();
                    const anterior=tecnicosRecientes.get(k)||0;
                    if(ahora-anterior<10000)return;
                    tecnicosRecientes.set(k,ahora);
                    if(tecnicosRecientes.size>200){for(const [clave,ts] of tecnicosRecientes){if(ahora-ts>60000)tecnicosRecientes.delete(clave);}}
                }
            }catch(_e){}
            return gtagOriginal.apply(this,arguments);
        }
        gtagDeduplicado.__lspediaTecnicaDedup=true;
        window.gtag=gtagDeduplicado;
    }
})();
