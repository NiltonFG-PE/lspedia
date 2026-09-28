/* LSPedia — corrección aislada para las tarjetas de “Últimos 30 días”.
   Evita usar idQuiz como referencia pública de Vocabulario y abre siempre
   la ficha mediante la palabra visible, que es la referencia estable que
   entiende el visor público. */
(function(){
  'use strict';
  if(window.__LSPediaUltimos30Fix)return;
  window.__LSPediaUltimos30Fix=true;

  function texto(v){return String(v==null?'':v).trim();}

  function abrirTarjeta(card){
    if(!card)return false;
    const palabra=texto(card.querySelector('strong')&&card.querySelector('strong').textContent);
    if(!palabra)return false;

    const meta=texto(card.querySelector('.lsp-30d-meta')&&card.querySelector('.lsp-30d-meta').textContent);
    const esVocabulario=/vocabulario/i.test(meta);
    const base=location.pathname||'/';

    if(esVocabulario){
      location.href=base+'?vista=vocabulario&p='+encodeURIComponent(palabra)+'&fuente=vocabulario';
    }else{
      location.href=base+'?p='+encodeURIComponent(palabra);
    }
    return true;
  }

  document.addEventListener('click',function(e){
    const objetivo=e.target&&e.target.closest?e.target.closest('.lsp-30d-card'):null;
    if(!objetivo)return;
    if(abrirTarjeta(objetivo)){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  },true);
})();
