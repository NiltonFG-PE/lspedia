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
            subtitulo.innerHTML = '<div class="aviso-mision-texto"><p class="aviso-mision-linea1">🔎 Busca una palabra y entiende su significado con videos en Lengua de Señas.<br>🧏🏻‍♂️🧏🏻‍♀️ Para personas sordas y para quienes quieren comunicarse mejor con ellas.</p><p class="aviso-mision-linea2">ℹ️ Diccionario de apoyo, no un curso de LSP.</p></div>';
        }

        if(intro && vocabActivo){
            const textos = intro.querySelectorAll('.vocab-intro-texto');
            if(textos[0]) textos[0].innerHTML = 'Las palabras en español sirven como <strong>referencia</strong> para facilitar las búsquedas.';
            if(textos[1]) textos[1].innerHTML = 'Las señas representan <strong>conceptos</strong>, no solo palabras.';
            if(textos[2]) textos[2].innerHTML = 'Las <strong>variantes regionales</strong> enriquecen la Lengua de señas.';
            if(textos[3]) textos[3].innerHTML = 'No basta aprender vocabulario, también <strong>requiere contacto</strong> con personas sordas.';
        }
    }

    document.addEventListener('lspedia:idiomaCambiado', function(evento){
        if(evento && evento.detail && evento.detail.idioma === 'es'){
            requestAnimationFrame(restaurarHeroEspanol);
        }
    });
})();
