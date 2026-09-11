from pathlib import Path

JS = Path('js/script.js')
CSS = Path('css/mejoras-producto.css')

js = JS.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')

marca_js = 'VOCABULARIO_AZ_FUNCIONAL_V2_20260911'
if marca_js not in js:
    js += r'''

// VOCABULARIO_AZ_FUNCIONAL_V2_20260911
// El índice A-Z de Vocabulario no depende de onclick inline: usa un listener
// delegado propio, igual de fiable en escritorio, móvil y PWA.
(function configurarIndiceVocabularioRobusto(){
    function iniciar(){
        const indice = document.getElementById('indiceAlfabeticoVocabulario');
        if(!indice || indice.dataset.lspAzFuncional === '1') return;
        indice.dataset.lspAzFuncional = '1';

        // Evita doble ejecución si quedaron handlers inline del HTML.
        indice.querySelectorAll('.btn-abc-vocabulario').forEach((boton) => {
            boton.removeAttribute('onclick');
        });

        indice.addEventListener('click', (evento) => {
            const objetivo = evento.target instanceof Element ? evento.target.closest('.btn-abc-vocabulario') : null;
            if(!objetivo || !indice.contains(objetivo)) return;
            evento.preventDefault();

            const letra = String(objetivo.textContent || '').trim().toUpperCase();
            if(!letra || typeof window.filtrarVocabularioPorLetra !== 'function') return;

            // Mantiene visible el bloque correcto antes de pintar resultados.
            if(bloqueBuscadorCategorias) bloqueBuscadorCategorias.classList.remove('d-none');
            window.filtrarVocabularioPorLetra(letra);

            // Si el navegador conserva el foco del botón, lo quitamos para que
            // el scroll y la lectura visual del resultado se comporten como en Diccionario.
            if(typeof objetivo.blur === 'function') objetivo.blur();
        });
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
'''

marca_css = 'CORRECCION_TARJETA_CATEGORIAS_V2_20260911'
if marca_css not in css:
    css += r'''

/* CORRECCION_TARJETA_CATEGORIAS_V2_20260911
   Mantiene el desglose Diccionario/Vocabulario dentro de la tarjeta,
   alineado como el resto de las estadísticas y sin cuadros flotantes. */
#statCardCategorias #detalleCategoriasStats {
    position: relative !important;
    inset: auto !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    transform: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    flex-wrap: nowrap !important;
    width: fit-content !important;
    max-width: 100% !important;
    margin: 0 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    vertical-align: middle !important;
}

#statCardCategorias #detalleCategoriasStats .stat2-desglose-num,
#statCardCategorias #detalleCategoriasStats .stat2-desglose-sep,
#statCardCategorias #detalleCategoriasStats .stat2-desglose-label,
#statCardCategorias #detalleCategoriasStats .stat2-desglose-icon-img {
    position: static !important;
    transform: none !important;
    flex: 0 0 auto !important;
}

@media (max-width: 576px) {
    #statCardCategorias #detalleCategoriasStats {
        gap: 5px !important;
        padding-left: 10px !important;
        padding-right: 10px !important;
    }
}
'''

JS.write_text(js.rstrip() + '\n', encoding='utf-8')
CSS.write_text(css.rstrip() + '\n', encoding='utf-8')

print('Corrección de Vocabulario aplicada.')
