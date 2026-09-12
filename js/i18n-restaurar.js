/* LSPedia — restauración segura del hero al volver de EN a ES.
   i18n.js reemplaza estos bloques con innerHTML en inglés; este complemento
   restablece el marcado original en español cuando el usuario vuelve a ES. */
(function(){
    'use strict';

    function restaurarHeroEspanol(){
        if(!window.LSPediaIdioma || window.LSPediaIdioma.obtener() !== 'es') return;

        const titulo = document.getElementById('tituloPrincipal');
        const subtitulo = document.getElementById('subtituloPrincipal');
        const intro = document.getElementById('vocabularioIntroLista');
        const vocabActivo = !!(document.getElementById('btnCategorias') && document.getElementById('btnCategorias').classList.contains('active'));

        if(titulo){
            titulo.innerHTML = vocabActivo
                ? '<span class="titulo-acento">Vocabulario</span> de Lengua de Señas Peruana (LSP)'
                : '<span class="titulo-acento">Diccionario</span> de Lengua de Señas Peruana (LSP) y Español';
        }

        if(subtitulo && !vocabActivo){
            subtitulo.innerHTML = '<span class="aviso-mision-icono" aria-hidden="true">🤟</span><div class="aviso-mision-texto"><p class="aviso-mision-linea1"><span style="color:#42a5f5;font-weight:700;">Diccionario visual de español</span> con apoyo en Lengua de Señas Peruana.<br>Su función es facilitar la comprensión de palabras y significados,</p><p class="aviso-mision-linea2"><span style="color:#a66a00;font-weight:700;">🪧No es un curso, ni enseñamos LSP.</span></p></div>';
        }

        if(intro && vocabActivo){
            const textos = intro.querySelectorAll('.vocab-intro-texto');
            if(textos[0]) textos[0].innerHTML = 'Las señas representan <strong>conceptos</strong>, no siempre palabras.';
            if(textos[1]) textos[1].innerHTML = 'Los términos en español son solo una <strong>referencia</strong> para facilitar la búsqueda y el aprendizaje.';
            if(textos[2]) textos[2].innerHTML = 'Las <strong>variantes regionales</strong> enriquecen la Lengua de Señas Peruana.';
        }
    }

    document.addEventListener('lspedia:idiomaCambiado', function(evento){
        if(evento && evento.detail && evento.detail.idioma === 'es'){
            requestAnimationFrame(restaurarHeroEspanol);
        }
    });
})();
