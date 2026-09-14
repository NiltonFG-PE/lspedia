/* LSPedia — accesibilidad segura y progresiva.
   Solo añade semántica/foco cuando el contexto es claro; no cambia flujos. */
(function(){
  'use strict';

  function textoAccesible(el){
    if(!el)return'';
    return String(el.getAttribute('aria-label')||'').trim() ||
      String(el.getAttribute('aria-labelledby')||'').trim() ||
      String(el.textContent||'').replace(/\s+/g,' ').trim();
  }

  function asegurarNombre(el){
    if(!(el instanceof Element) || textoAccesible(el))return;
    const titulo=String(el.getAttribute('title')||'').trim();
    const img=el.querySelector&&el.querySelector('img[alt]');
    const alt=img?String(img.getAttribute('alt')||'').trim():'';
    const nombre=titulo||alt;
    if(nombre)el.setAttribute('aria-label',nombre);
  }

  function prepararNavegacion(){
    document.querySelectorAll('a.nav-link, [role="tab"], [data-admin-tab]').forEach(function(el){
      if(el.classList.contains('active'))el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    });
  }

  function prepararRegionesDinamicas(){
    const ids=[
      'resultado','resultadoVocabulario','resultadosVocabulario','sugerencias',
      'sugerenciasVocabulario','quizFeedback','feedbackQuiz','estadoSenas',
      'resultadosSenas','progresoMuestraSenas'
    ];
    ids.forEach(function(id){
      const el=document.getElementById(id);
      if(!el)return;
      if(!el.hasAttribute('role'))el.setAttribute('role','status');
      if(!el.hasAttribute('aria-live'))el.setAttribute('aria-live','polite');
      if(!el.hasAttribute('aria-atomic'))el.setAttribute('aria-atomic','false');
    });
  }

  function prepararControles(root){
    const base=root&&root.querySelectorAll?root:document;
    base.querySelectorAll('button, a, [role="button"]').forEach(asegurarNombre);
    base.querySelectorAll('button.btn-close').forEach(function(el){
      if(!textoAccesible(el))el.setAttribute('aria-label','Cerrar');
    });
  }

  function asegurarSaltoContenido(){
    if(document.querySelector('.lspedia-skip-link'))return;
    const main=document.querySelector('main');
    if(!main)return;
    if(!main.id)main.id='contenidoPrincipal';
    const enlace=document.createElement('a');
    enlace.className='lspedia-skip-link';
    enlace.href='#'+main.id;
    enlace.textContent='Saltar al contenido';
    document.body.prepend(enlace);
  }

  function iniciar(){
    asegurarSaltoContenido();
    prepararNavegacion();
    prepararRegionesDinamicas();
    prepararControles(document);

    if(!('MutationObserver' in window))return;
    const obs=new MutationObserver(function(cambios){
      let actualizarNav=false;
      cambios.forEach(function(cambio){
        if(cambio.type==='attributes'&&cambio.attributeName==='class')actualizarNav=true;
        cambio.addedNodes.forEach(function(nodo){
          if(!(nodo instanceof Element))return;
          if(nodo.matches('button, a, [role="button"]'))asegurarNombre(nodo);
          prepararControles(nodo);
        });
      });
      if(actualizarNav)prepararNavegacion();
      prepararRegionesDinamicas();
    });
    obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
