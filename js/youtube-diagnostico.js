/* ============================================================
   LSPedia — módulo de diagnóstico YouTube DESACTIVADO
   ------------------------------------------------------------
   Este módulo se deja como archivo compatible para no romper versiones
   antiguas de la PWA que todavía intenten cargarlo, pero ya NO modifica
   YT.Player, NO intercepta callbacks y NO añade listeners al reproductor.

   Motivo: la prioridad es que un video con problemas nunca pueda bloquear
   ni congelar la navegación de LSPedia.
   ============================================================ */
(function(){
    'use strict';

    if(window.LSPediaYouTubeDiagnostico && window.LSPediaYouTubeDiagnostico.desactivado) return;

    window.LSPediaYouTubeDiagnostico = Object.freeze({
        desactivado: true,
        aplicar: function(){ return false; },
        mensajes: {},
        ultimos: function(){ return []; },
        limpiar: function(){
            try { localStorage.removeItem('lspedia_youtube_diagnosticos_v1'); } catch(_e) {}
        }
    });
})();
