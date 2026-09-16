/* ============================================================
   LSPedia — integración oscura para módulos aislados
   ------------------------------------------------------------
   Construye la oración vive en un Shadow DOM abierto, por lo que el CSS
   global no puede entrar. Este módulo inyecta una hoja de estilo UNA sola
   vez dentro de ese Shadow DOM y solo activa/desactiva una clase en el host.
   No usa MutationObserver para evitar ciclos de mutaciones.
   ============================================================ */
(function(){
    'use strict';

    const ID_ESTILO = 'lspedia-dark-oraciones';

    function temaOscuro(){
        return document.documentElement.getAttribute('data-lsp-tema') === 'dark';
    }

    function cssOraciones(){
        return `
:host(.lsp-dark-host){
  --bg:#09111f !important;
  --card:#111c2f !important;
  --text:#e7eef8 !important;
  --muted:#9aabc0 !important;
  background:linear-gradient(180deg,#0c1626,#09111f 48%,#0d1727) !important;
  color:#e7eef8 !important;
  color-scheme:dark;
}
:host(.lsp-dark-host) .app{background:transparent !important;color:#e7eef8 !important;}
:host(.lsp-dark-host) .top h1,
:host(.lsp-dark-host) .section-title,
:host(.lsp-dark-host) .game-title,
:host(.lsp-dark-host) .context-name{color:#edf5ff !important;}
:host(.lsp-dark-host) .top p,
:host(.lsp-dark-host) .tip,
:host(.lsp-dark-host) .score,
:host(.lsp-dark-host) .scene-note,
:host(.lsp-dark-host) .level small,
:host(.lsp-dark-host) .verb-origin .label{color:#9aabc0 !important;}
:host(.lsp-dark-host) .card,
:host(.lsp-dark-host) .context-card{
  background:#111c2f !important;
  border-color:#2b3e58 !important;
  color:#e7eef8 !important;
  box-shadow:0 10px 28px rgba(0,0,0,.22) !important;
}
:host(.lsp-dark-host) .mode,
:host(.lsp-dark-host) .answer,
:host(.lsp-dark-host) .choice-big,
:host(.lsp-dark-host) .word,
:host(.lsp-dark-host) .verb-origin .form{
  background:#17243a !important;
  border-color:#344a66 !important;
  color:#e7eef8 !important;
}
:host(.lsp-dark-host) .mode.active{
  background:#153654 !important;
  border-color:#3989e5 !important;
  color:#9ed7ff !important;
}
:host(.lsp-dark-host) .level{
  background:#17243a !important;
  border-color:#344a66 !important;
  color:#e7eef8 !important;
}
:host(.lsp-dark-host) .level[data-level='1']{background:#123329 !important;border-color:#285f4b !important;}
:host(.lsp-dark-host) .level[data-level='2']{background:#132d49 !important;border-color:#315e8d !important;}
:host(.lsp-dark-host) .level[data-level='3']{background:#38261d !important;border-color:#765039 !important;}
:host(.lsp-dark-host) .level[data-level='4']{background:#2b2042 !important;border-color:#5b477d !important;}
:host(.lsp-dark-host) .level[data-level='5']{background:#362f17 !important;border-color:#6e6028 !important;}
:host(.lsp-dark-host) .level[data-level='6']{background:#39202c !important;border-color:#754056 !important;}
:host(.lsp-dark-host) .level.active{box-shadow:0 0 0 3px rgba(79,179,255,.08) !important;}
:host(.lsp-dark-host) .scene{
  background:#0d192a !important;
  border-color:#30445f !important;
  color:#e7eef8 !important;
}
:host(.lsp-dark-host) .slot{
  background:#162339 !important;
  color:#e7eef8 !important;
}
:host(.lsp-dark-host) .slot::before{
  background:#111c2f !important;
  border-color:#344a66 !important;
  color:#dce7f4 !important;
}
:host(.lsp-dark-host) .slot.who{background:#132d49 !important;border-color:#315e8d !important;}
:host(.lsp-dark-host) .slot.action{background:#3b2029 !important;border-color:#814352 !important;}
:host(.lsp-dark-host) .slot.what{background:#123329 !important;border-color:#285f4b !important;}
:host(.lsp-dark-host) .slot.time{background:#2b2042 !important;border-color:#5b477d !important;}
:host(.lsp-dark-host) .slot.connector{background:#362f17 !important;border-color:#6e6028 !important;}
:host(.lsp-dark-host) .word.who{color:#8dc4ff !important;border-color:#315e8d !important;}
:host(.lsp-dark-host) .word.action{color:#ff9bac !important;border-color:#814352 !important;}
:host(.lsp-dark-host) .word.what{color:#82d9a4 !important;border-color:#285f4b !important;}
:host(.lsp-dark-host) .word.time{color:#c4a6ff !important;border-color:#5b477d !important;}
:host(.lsp-dark-host) .word.connector{color:#f2c76d !important;border-color:#6e6028 !important;}
:host(.lsp-dark-host) .help,
:host(.lsp-dark-host) .feedback.info,
:host(.lsp-dark-host) .verb-origin{
  background:#143352 !important;
  border-color:#315e8d !important;
  color:#a5d9ff !important;
}
:host(.lsp-dark-host) .verb-origin .inf{color:#8dc4ff !important;}
:host(.lsp-dark-host) .verb-origin .arrowline{color:#c6d4e4 !important;}
:host(.lsp-dark-host) .bubble.a{background:#143352 !important;color:#dcecff !important;}
:host(.lsp-dark-host) .bubble.b{background:#143326 !important;color:#d9f6e4 !important;}
:host(.lsp-dark-host) .progress,
:host(.lsp-dark-host) .timer{background:#29394f !important;}
:host(.lsp-dark-host) .back,
:host(.lsp-dark-host) .pill{background:#153654 !important;color:#9ed7ff !important;}
:host(.lsp-dark-host) .write-input{
  background:#0d192a !important;
  color:#edf5ff !important;
  border-color:#407db6 !important;
}
:host(.lsp-dark-host) .overlay-react>div{
  background:#17243a !important;
  color:#e7eef8 !important;
  box-shadow:0 16px 50px rgba(0,0,0,.40) !important;
}
`;
    }

    function aplicarOraciones(){
        const host = document.getElementById('oracionesApp');
        if(!host || !host.shadowRoot) return false;

        let style = host.shadowRoot.getElementById(ID_ESTILO);
        if(!style){
            style = document.createElement('style');
            style.id = ID_ESTILO;
            style.textContent = cssOraciones();
            host.shadowRoot.appendChild(style);
        }
        host.classList.toggle('lsp-dark-host', temaOscuro());
        return true;
    }

    function reintentosCortos(){
        [0,120,350,800,1600,3000].forEach(function(ms){
            setTimeout(aplicarOraciones, ms);
        });
    }

    document.addEventListener('lspedia:temaCambiado', reintentosCortos);
    document.addEventListener('click', function(e){
        if(e.target && e.target.closest && e.target.closest('#btnMenuJuegoOraciones, #btnHerramientas, #btnMenuJuegoMatematicas')){
            reintentosCortos();
        }
    }, true);
    document.addEventListener('lspedia:datosListos', reintentosCortos);

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', reintentosCortos, {once:true});
    } else {
        reintentosCortos();
    }

    window.LSPediaModoOscuroHerramientas = {
        refrescar: reintentosCortos
    };
})();
