/* LSPedia — interacciones 3D ligeras y seguras.
   No usa giroscopio ni DeviceOrientation: solo puntero fino.
*/
(function(){
    'use strict';

    const reducirMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const punteroFino = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let frameHero = 0;

    function limitar(valor, minimo, maximo){
        return Math.min(maximo, Math.max(minimo, valor));
    }

    function prepararHero(){
        const hero = document.getElementById('filaHeroPrincipal');
        const avatar = document.querySelector('#colAvatarHero .avatar-hero-img');
        const descubre = document.getElementById('senalDelDia');
        if(!hero || reducirMovimiento) return;

        function resetear(){
            hero.style.setProperty('--lsp-rx', '0deg');
            hero.style.setProperty('--lsp-ry', '0deg');
            hero.style.setProperty('--lsp-avatar-x', '0px');
            hero.style.setProperty('--lsp-avatar-y', '0px');
            hero.style.setProperty('--lsp-hero-card-x', '0px');
            hero.style.setProperty('--lsp-hero-card-y', '0px');
        }

        /* Parallax únicamente con mouse/trackpad. En táctil se conserva
           la profundidad visual sin escuchar movimiento ni sensores. */
        if(punteroFino){
            hero.addEventListener('pointermove', function(evento){
                if(frameHero) cancelAnimationFrame(frameHero);
                frameHero = requestAnimationFrame(function(){
                    const rect = hero.getBoundingClientRect();
                    if(!rect.width || !rect.height) return;
                    const nx = limitar(((evento.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
                    const ny = limitar(((evento.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
                    hero.style.setProperty('--lsp-rx', (-ny * 1.8).toFixed(2) + 'deg');
                    hero.style.setProperty('--lsp-ry', (nx * 2.4).toFixed(2) + 'deg');
                    hero.style.setProperty('--lsp-avatar-x', (nx * 6).toFixed(1) + 'px');
                    hero.style.setProperty('--lsp-avatar-y', (ny * 4).toFixed(1) + 'px');
                    hero.style.setProperty('--lsp-hero-card-x', (-nx * 3).toFixed(1) + 'px');
                    hero.style.setProperty('--lsp-hero-card-y', (-ny * 2).toFixed(1) + 'px');
                });
            }, {passive:true});
            hero.addEventListener('pointerleave', resetear, {passive:true});
        }

        if(avatar) avatar.setAttribute('data-lsp-3d', 'avatar');
        if(descubre) descubre.setAttribute('data-lsp-3d', 'descubre');
    }

    function marcarMarcosVideo(raiz){
        if(!raiz) return;
        const candidatos = raiz.querySelectorAll([
            '.ratio.ratio-16x9',
            '.video-wrapper',
            '.video-container',
            '.embed-responsive',
            '[id*="VideoRatio"]'
        ].join(','));
        candidatos.forEach(function(elemento){
            if(elemento.closest('.controles-video')) return;
            elemento.classList.add('lsp-video-marco-3d');
        });
    }

    function animarResultado(contenedor){
        if(!contenedor || !contenedor.innerHTML.trim()) return;
        marcarMarcosVideo(contenedor);
        if(reducirMovimiento) return;
        contenedor.classList.remove('lsp-resultado-3d-enter');
        void contenedor.offsetWidth;
        contenedor.classList.add('lsp-resultado-3d-enter');
        window.setTimeout(function(){
            contenedor.classList.remove('lsp-resultado-3d-enter');
        }, 520);
    }

    function observarResultados(){
        ['resultado','resultadoCategorias'].forEach(function(id){
            const contenedor = document.getElementById(id);
            if(!contenedor || contenedor.dataset.lsp3dObservado === '1') return;
            contenedor.dataset.lsp3dObservado = '1';
            animarResultado(contenedor);
            let pendiente = 0;
            const observador = new MutationObserver(function(mutations){
                const cambioVisible = mutations.some(function(m){ return m.type === 'childList'; });
                if(!cambioVisible) return;
                if(pendiente) window.clearTimeout(pendiente);
                pendiente = window.setTimeout(function(){
                    pendiente = 0;
                    animarResultado(contenedor);
                }, 60);
            });
            /* Solo cambios de nodos. Observar class/style causaría que la
               propia clase de entrada volviera a disparar el observador. */
            observador.observe(contenedor, {childList:true, subtree:true});
        });
    }

    function prepararVideoNosotros(){
        /* El contenedor exterior es arrastrable y puede usar transform/posición.
           La profundidad se aplica al marco interior para no interferir. */
        const marco = document.getElementById('nosotrosVideoRatio');
        if(marco) marco.classList.add('lsp-video-marco-3d');
    }

    function prepararAccesibilidad(){
        document.documentElement.classList.add('lsp-3d-ready');
    }

    function iniciar(){
        prepararAccesibilidad();
        prepararHero();
        observarResultados();
        prepararVideoNosotros();

        document.addEventListener('lspedia:datosListos', function(){
            observarResultados();
            prepararVideoNosotros();
            ['resultado','resultadoCategorias'].forEach(function(id){
                animarResultado(document.getElementById(id));
            });
        });
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    else iniciar();
})();
