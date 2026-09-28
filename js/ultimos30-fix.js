/* LSPedia — corrección aislada para las tarjetas de “Últimos 30 días”.
   V2: las tarjetas de Vocabulario abren la ficha directamente en la SPA,
   sin recargar la página ni depender de idQuiz o de la restauración por URL. */
(function(){
  'use strict';
  if(window.__LSPediaUltimos30Fix)return;
  window.__LSPediaUltimos30Fix=true;

  function texto(v){return String(v==null?'':v).trim();}

  function cerrarModal30(){
    const overlay=document.getElementById('lsp30dOverlay');
    if(!overlay)return;
    const cerrar=overlay.querySelector('.lsp-30d-close');
    if(cerrar){
      try{cerrar.click();return;}catch(_e){}
    }
    overlay.hidden=true;
    document.body.style.overflow='';
  }

  function abrirVocabularioDirecto(palabra){
    cerrarModal30();

    /* Primero entramos a la vista de Vocabulario para que el contenedor
       correcto esté visible. Este es el mismo botón que usa la navegación. */
    const btnVocabulario=document.getElementById('btnCategorias');
    if(btnVocabulario){
      try{btnVocabulario.click();}catch(_e){}
    }

    const abrir=function(){
      /* Ruta principal: reutiliza exactamente la función del buscador de
         Vocabulario. Acepta tanto id como el nombre visible de la palabra. */
      if(typeof window.mostrarPalabraVocabularioPorReferencia==='function'){
        try{
          window.mostrarPalabraVocabularioPorReferencia(palabra);
          return;
        }catch(error){
          console.warn('[LSPedia] No se pudo abrir la ficha de Vocabulario directamente.',error);
        }
      }

      /* Segundo respaldo: busca el registro ya cargado y pinta la misma ficha
         simplificada que usa Vocabulario, sin recargar la página. */
      try{
        const api=window.LSPediaVocabularioPublico;
        const lista=api&&typeof api.obtener==='function'?api.obtener():[];
        const clave=texto(palabra).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
        const item=(Array.isArray(lista)?lista:[]).find(function(p){
          return texto(p&&p.palabra).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()===clave;
        });
        if(item&&typeof window.mostrarPalabraSimplificada==='function'){
          window.mostrarPalabraSimplificada(item,{enCategorias:true});
          window.scrollTo({top:0,behavior:'smooth'});
          return;
        }
      }catch(error){
        console.warn('[LSPedia] No se pudo usar el respaldo directo de Vocabulario.',error);
      }

      /* Último respaldo únicamente si faltaran las funciones internas. */
      const base=location.pathname||'/';
      location.href=base+'?vista=vocabulario&p='+encodeURIComponent(palabra)+'&fuente=vocabulario';
    };

    /* El cambio de vista es síncrono en condiciones normales; un frame de
       espera evita que el render de la navegación y el de la ficha compitan. */
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(abrir);
    else setTimeout(abrir,0);
    return true;
  }

  function abrirTarjeta(card){
    if(!card)return false;
    const palabra=texto(card.querySelector('strong')&&card.querySelector('strong').textContent);
    if(!palabra)return false;

    const meta=texto(card.querySelector('.lsp-30d-meta')&&card.querySelector('.lsp-30d-meta').textContent);
    const esVocabulario=/vocabulario/i.test(meta);

    if(esVocabulario)return abrirVocabularioDirecto(palabra);

    /* Diccionario ya funcionaba correctamente; se conserva su ruta actual. */
    const base=location.pathname||'/';
    location.href=base+'?p='+encodeURIComponent(palabra);
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
