/* LSPedia — optimizaciones ligeras para móvil sin afectar autoplay. */
(function () {
    'use strict';

    // Solo las animaciones decorativas: los videos de señas mantienen sus controles.
    const decoraciones = new Map();
    const observerDecoracion = 'IntersectionObserver' in window
        ? new IntersectionObserver(function(entradas){
            entradas.forEach(function(entrada){
                decoraciones.set(entrada.target, entrada.isIntersecting);
                actualizarDecoracion(entrada.target, entrada.isIntersecting);
            });
        })
        : null;

    function actualizarDecoracion(video, visible){
        if(!video.isConnected){
            decoraciones.delete(video);
            if(observerDecoracion) observerDecoracion.unobserve(video);
            return;
        }
        if(document.hidden || !visible){
            if(!video.paused) video.pause();
        } else if(video.autoplay && video.paused){
            const reproduccion = video.play();
            if(reproduccion && reproduccion.catch) reproduccion.catch(function(){});
        }
    }

    function gestionarDecoracion(video){
        if(video.tagName !== 'VIDEO' || !video.matches('#btnLogo video, #colAvatarHero video')) return;
        if(decoraciones.has(video)) return;
        const visible = estaVisible(video);
        decoraciones.set(video, visible);
        actualizarDecoracion(video, visible);
        if(observerDecoracion) observerDecoracion.observe(video);
    }
    document.addEventListener('visibilitychange', function(){
        decoraciones.forEach(function(visible, video){ actualizarDecoracion(video, visible); });
    });

    function estaVisible(elemento) {
        if (!elemento || !elemento.isConnected) return false;
        const rect = elemento.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight);
    }

    function optimizarIframe(iframe) {
        if (!iframe || iframe.tagName !== 'IFRAME') return;
        if (!iframe.hasAttribute('loading') && !estaVisible(iframe) && !iframe.closest('[data-lspedia-prioridad="1"]')) {
            iframe.loading = 'lazy';
        }
        if (!iframe.hasAttribute('referrerpolicy')) iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    }

    function optimizarMedia(media) {
        if (!media || !['VIDEO', 'AUDIO'].includes(media.tagName)) return;

        gestionarDecoracion(media);

        // Los recursos con autoplay se dejan intactos: LSPedia necesita que
        // los videos de señas/animaciones sigan iniciándose automáticamente.
        if (media.autoplay || media.hasAttribute('autoplay') || media.dataset.lspediaPreloadCompleto === '1') return;

        if (!media.hasAttribute('preload') || media.preload === 'auto') {
            media.preload = 'metadata';
        }
    }

    function optimizarNodo(nodo) {
        if (!nodo || nodo.nodeType !== 1) return;
        if (nodo.tagName === 'IFRAME') optimizarIframe(nodo);
        if (nodo.tagName === 'VIDEO' || nodo.tagName === 'AUDIO') optimizarMedia(nodo);
        if (nodo.querySelectorAll) {
            nodo.querySelectorAll('iframe').forEach(optimizarIframe);
            nodo.querySelectorAll('video,audio').forEach(optimizarMedia);
        }
    }

    document.querySelectorAll('iframe').forEach(optimizarIframe);
    document.querySelectorAll('video,audio').forEach(optimizarMedia);

    if ('MutationObserver' in window) {
        const observer = new MutationObserver(function (cambios) {
            cambios.forEach(function (cambio) {
                cambio.addedNodes.forEach(optimizarNodo);
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
})();
