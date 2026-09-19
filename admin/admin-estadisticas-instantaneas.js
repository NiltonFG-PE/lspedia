/* Compatibilidad: carga la versión completa del Admin unificado y la capa de organización inteligente. */
(function(){
  'use strict';
  if(window.__lspediaAdminVistasCompletasLoader)return;
  window.__lspediaAdminVistasCompletasLoader=true;

  function cargar(src,marca){
    if(document.querySelector('script[data-admin-modulo="'+marca+'"]'))return;
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.dataset.adminModulo=marca;
    s.onerror=()=>console.error('[LSPedia Admin] No se pudo cargar '+src);
    document.head.appendChild(s);
  }

  cargar('admin-vistas-completas.js?v=20260919-4','vistas-completas');
  cargar('admin-taxonomia.js?v=20260919-1','taxonomia');
})();
