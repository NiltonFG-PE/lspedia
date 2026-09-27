/* LSPedia — ajuste visual aislado del header.
   Corrige alineación vertical del menú y elimina el parpadeo del selector ES/EN
   sin cambiar navegación, idioma ni modo oscuro. */
(function(){
  'use strict';
  if(window.__LSPediaHeaderPremiumFix)return;
  window.__LSPediaHeaderPremiumFix=true;

  if(document.getElementById('lsp-header-premium-fix-css'))return;
  const style=document.createElement('style');
  style.id='lsp-header-premium-fix-css';
  style.textContent=`
/* ---------- HEADER DESKTOP ---------- */
@media (min-width:1200px){
  nav.navbar > .container{
    min-height:85px;
    display:flex!important;
    align-items:center!important;
  }

  #menuPrincipal.navbar-nav,
  nav.navbar .navbar-nav{
    align-items:center!important;
    align-self:center!important;
    padding-top:0!important;
    padding-bottom:0!important;
    margin-top:0!important;
    margin-bottom:0!important;
    gap:8px!important;
  }

  #menuPrincipal.navbar-nav > .nav-item,
  nav.navbar .navbar-nav > .nav-item{
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    min-height:52px;
    margin:0!important;
  }

  #menuPrincipal.navbar-nav .nav-link,
  nav.navbar .navbar-nav .nav-link{
    height:48px;
    min-height:48px;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    padding:0 18px!important;
    margin:0!important;
    line-height:1!important;
    border-radius:999px!important;
  }

  #menuPrincipal.navbar-nav .nav-link .nav-icono,
  nav.navbar .navbar-nav .nav-link .nav-icono{
    width:18px!important;
    height:18px!important;
    margin:0!important;
  }

  .lspedia-idioma-selector{
    height:52px!important;
    min-height:52px!important;
    padding:4px!important;
    gap:2px!important;
    margin-left:14px!important;
    align-self:center!important;
    position:relative!important;
    top:auto!important;
    right:auto!important;
    transform:none!important;
    overflow:hidden!important;
    isolation:isolate;
  }

  .lspedia-idioma-selector .lspedia-idioma-btn{
    width:48px!important;
    min-width:48px!important;
    height:42px!important;
    min-height:42px!important;
  }

  .lspedia-idioma-selector #lspediaTemaBtn{
    width:42px!important;
    min-width:42px!important;
    height:42px!important;
    min-height:42px!important;
  }
}

/* ---------- ES / EN: repintado estable ---------- */
.lspedia-idioma-selector{
  overflow:hidden!important;
  contain:paint;
  transform-style:flat;
  -webkit-font-smoothing:antialiased;
}

.lspedia-idioma-selector .lspedia-idioma-btn{
  position:relative;
  z-index:1;
  box-sizing:border-box;
  transform:none!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
  background-image:none!important;
  transition:background-color .16s ease,color .16s ease,box-shadow .16s ease,border-color .16s ease!important;
}

.lspedia-idioma-selector .lspedia-idioma-btn:hover{
  transform:none!important;
}

.lspedia-idioma-selector .lspedia-idioma-btn.active{
  background:#ffc107!important;
  background-image:none!important;
  color:#0f172a!important;
  border-color:rgba(255,255,255,.36)!important;
  box-shadow:0 5px 13px rgba(255,193,7,.24),inset 0 1px 0 rgba(255,255,255,.58)!important;
  transform:none!important;
  animation:none!important;
}

.lspedia-idioma-selector #lspediaTemaBtn{
  position:relative;
  z-index:1;
  transform:none!important;
  transition:background-color .16s ease,color .16s ease,border-color .16s ease!important;
}

/* Móvil: conservar la posición lateral existente, pero sin saltos de pintura. */
@media (max-width:1199.98px){
  .lspedia-idioma-selector .lspedia-idioma-btn,
  .lspedia-idioma-selector #lspediaTemaBtn{
    transform:none!important;
    animation:none!important;
  }
}

@media (prefers-reduced-motion:reduce){
  #menuPrincipal .nav-link,
  .lspedia-idioma-selector *,
  .lspedia-idioma-selector{
    animation:none!important;
    transition:none!important;
  }
}
`;
  document.head.appendChild(style);
})();

/* Carga aislada de Mi LSPedia. Si falla, Favoritos/Historial originales
   siguen disponibles porque el módulo nuevo solo los oculta tras iniciar bien. */
(function(){
  'use strict';
  if(document.querySelector('script[data-lspedia-mi]'))return;
  function cargar(){
    if(document.querySelector('script[data-lspedia-mi]'))return;
    const s=document.createElement('script');
    s.src='js/mi-lspedia.js?v=20260927-1';
    s.async=true;
    s.dataset.lspediaMi='1';
    s.onerror=function(){console.warn('[LSPedia] No se pudo cargar Mi LSPedia. Se conservan Favoritos e Historial originales.');};
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cargar,{once:true});else cargar();
})();

/* Acciones premium de ficha: corazón de Favoritos + Compartir compacto.
   El módulo es idempotente y observa solo los contenedores de resultados. */
(function(){
  'use strict';
  if(document.querySelector('script[data-lspedia-acciones-ficha]'))return;
  function cargar(){
    if(document.querySelector('script[data-lspedia-acciones-ficha]'))return;
    const s=document.createElement('script');
    s.src='js/acciones-ficha-premium.js?v=20260927-1';
    s.async=true;
    s.dataset.lspediaAccionesFicha='1';
    s.onerror=function(){console.warn('[LSPedia] No se pudieron cargar las acciones premium de ficha. Se conservan los botones base.');};
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cargar,{once:true});else cargar();
})();
