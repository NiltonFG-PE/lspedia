/* Compatibilidad: carga la versión completa del Admin unificado. */
(function(){
  'use strict';
  if(window.__lspediaAdminVistasCompletasLoader)return;
  window.__lspediaAdminVistasCompletasLoader=true;
  const s=document.createElement('script');
  s.src='admin-vistas-completas.js?v=20260919-4';
  s.async=false;
  s.onerror=()=>console.error('[LSPedia Admin] No se pudo cargar admin-vistas-completas.js');
  document.head.appendChild(s);
})();
