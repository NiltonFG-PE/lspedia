/* LSPedia — acciones premium de ficha
   Favoritos + Compartir para Diccionario y Vocabulario.
   Módulo visual aislado: no reemplaza la lógica principal de las fichas. */
(function(){
  'use strict';
  if(window.__LSPediaAccionesFichaPremium)return;
  window.__LSPediaAccionesFichaPremium=true;

  const CLAVE_FAVORITOS='lspedia_favoritos';
  const OBSERVADORES=[];

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function leerFavoritos(){try{const x=JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)||'[]');return Array.isArray(x)?x:[];}catch(_e){return [];}}
  function normal(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
  function estaFavorito(ref){const n=normal(ref);return leerFavoritos().some(x=>normal(x)===n);}
  function guardarFavoritos(lista){try{localStorage.setItem(CLAVE_FAVORITOS,JSON.stringify(lista));}catch(_e){}}
  function toggleFavorito(ref){
    const n=normal(ref);if(!n)return false;
    let f=leerFavoritos();
    const existe=f.some(x=>normal(x)===n);
    f=existe?f.filter(x=>normal(x)!==n):f.concat([ref]);
    guardarFavoritos(f);
    try{if(window.LSPediaMi&&typeof window.LSPediaMi.refrescar==='function')window.LSPediaMi.refrescar();}catch(_e){}
    try{window.dispatchEvent(new CustomEvent('lspedia:favoritosActualizados',{detail:{referencia:ref,activo:!existe}}));}catch(_e){}
    return !existe;
  }

  function referenciaActual(btn){
    try{
      const p=new URLSearchParams(location.search).get('p');
      if(p&&String(p).trim())return String(p).trim();
    }catch(_e){}
    const cont=btn&&btn.closest('#resultado,#resultadoCategorias,[data-palabra-ficha]');
    const h=cont&&cont.querySelector('h3');
    return h?String(h.textContent||'').trim():'';
  }

  function esVocabularioActual(){
    try{
      const q=new URLSearchParams(location.search);
      const fuente=String(q.get('fuente')||'').toLowerCase();
      const vista=String(q.get('vista')||'').toLowerCase();
      return fuente==='vocabulario'||vista==='vocabulario'||vista==='temas';
    }catch(_e){return false;}
  }

  function iconoCorazon(){
    return '<svg class="lsp-action-svg lsp-heart-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 10.55 19.1C5.4 14.48 2 11.42 2 7.67 2 4.6 4.42 2.2 7.5 2.2c1.74 0 3.42.8 4.5 2.06A6.05 6.05 0 0 1 16.5 2.2C19.58 2.2 22 4.6 22 7.67c0 3.75-3.4 6.81-8.55 11.44L12 20.4Z"/></svg>';
  }
  function iconoCompartir(){
    return '<svg class="lsp-action-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.1c-.76 0-1.45.3-1.97.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.04-4.12A2.98 2.98 0 1 0 15 5c0 .24.04.47.09.7L8.05 9.82A3 3 0 1 0 8.05 14l7.12 4.17c-.04.2-.07.41-.07.63a2.9 2.9 0 1 0 2.9-2.7Z"/></svg>';
  }

  function toast(mensaje,icono){
    let t=document.getElementById('lspActionToast');
    if(!t){t=document.createElement('div');t.id='lspActionToast';t.className='lsp-action-toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t);}
    t.innerHTML='<span aria-hidden="true">'+esc(icono||'✓')+'</span><b>'+esc(mensaje)+'</b>';
    clearTimeout(t._timer);t.classList.remove('show');void t.offsetWidth;t.classList.add('show');
    t._timer=setTimeout(()=>t.classList.remove('show'),1800);
  }

  function renderEstadoFavorito(btn,ref){
    if(!btn||!ref)return;
    const activo=estaFavorito(ref);
    btn.classList.add('lsp-accion-premium','lsp-accion-favorito');
    btn.classList.toggle('is-active',activo);
    btn.setAttribute('aria-pressed',activo?'true':'false');
    btn.setAttribute('aria-label',activo?'Quitar de favoritos':'Agregar a favoritos');
    btn.setAttribute('title',activo?'Quitar de favoritos':'Agregar a favoritos');
    btn.innerHTML=iconoCorazon()+'<span class="lsp-action-label">'+(activo?'Guardado':'Favorito')+'</span>';
  }

  function asegurarFavoritoVocabulario(share){
    if(!share||!esVocabularioActual())return null;
    const zona=share.parentElement;if(!zona)return null;
    let fav=zona.querySelector('#btnFavorito');
    if(!fav){
      fav=document.createElement('button');
      fav.type='button';fav.id='btnFavorito';fav.dataset.lspVocabFavorito='1';
      zona.insertBefore(fav,share);
    }
    if(fav.dataset.lspVocabFavorito==='1'&&!fav.dataset.lspPremiumHooked){
      fav.dataset.lspPremiumHooked='1';
      fav.addEventListener('click',function(ev){
        ev.preventDefault();ev.stopPropagation();
        const ref=referenciaActual(fav);if(!ref)return;
        const activo=toggleFavorito(ref);
        renderEstadoFavorito(fav,ref);
        fav.classList.remove('lsp-heart-pop');void fav.offsetWidth;fav.classList.add('lsp-heart-pop');
        try{if(navigator.vibrate)navigator.vibrate(activo?18:8);}catch(_e){}
        toast(activo?'Guardado en favoritos':'Quitado de favoritos',activo?'♥':'♡');
      });
    }
    return fav;
  }

  function decorarFavoritoExistente(btn){
    if(!btn)return;
    const ref=referenciaActual(btn);if(!ref)return;
    renderEstadoFavorito(btn,ref);
    if(!btn.dataset.lspPremiumVisualHook){
      btn.dataset.lspPremiumVisualHook='1';
      btn.addEventListener('click',function(){
        btn.classList.remove('lsp-heart-pop');void btn.offsetWidth;btn.classList.add('lsp-heart-pop');
        setTimeout(function(){
          const r=referenciaActual(btn);if(r)renderEstadoFavorito(btn,r);
          try{if(window.LSPediaMi&&typeof window.LSPediaMi.refrescar==='function')window.LSPediaMi.refrescar();}catch(_e){}
        },0);
      });
    }
  }

  function decorarCompartir(btn){
    if(!btn)return;
    btn.classList.add('lsp-accion-premium','lsp-accion-compartir');
    btn.setAttribute('title','Compartir palabra');
    btn.setAttribute('aria-label','Compartir palabra');
    btn.innerHTML=iconoCompartir()+'<span class="lsp-action-label">Compartir</span>';
    if(!btn.dataset.lspPremiumShareHook){
      btn.dataset.lspPremiumShareHook='1';
      btn.addEventListener('click',function(){
        btn.classList.remove('lsp-share-pop');void btn.offsetWidth;btn.classList.add('lsp-share-pop');
      },true);
    }
  }

  function decorar(root){
    const scope=root&&root.querySelectorAll?root:document;
    let share=scope.querySelector('#btnCompartir');
    if(!share&&scope.matches&&scope.matches('#btnCompartir'))share=scope;
    if(!share)return;
    const zona=share.parentElement;if(zona)zona.classList.add('lsp-ficha-acciones');
    decorarCompartir(share);
    const nuevo=asegurarFavoritoVocabulario(share);
    const fav=nuevo||(zona&&zona.querySelector('#btnFavorito'))||document.getElementById('btnFavorito');
    if(fav)decorarFavoritoExistente(fav);
  }

  function estilos(){
    if(document.getElementById('lspAccionesFichaPremiumCss'))return;
    const s=document.createElement('style');s.id='lspAccionesFichaPremiumCss';s.textContent=`
      .lsp-ficha-acciones{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important;justify-content:flex-end!important}
      .lsp-accion-premium{--lsp-accent:#2563eb;position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;height:42px!important;min-height:42px!important;padding:0 14px!important;border-radius:999px!important;border:1px solid rgba(148,163,184,.32)!important;background:linear-gradient(180deg,#fff,rgba(248,250,252,.94))!important;color:#334155!important;font:700 12px/1 Poppins,system-ui,sans-serif!important;letter-spacing:0!important;box-shadow:0 7px 18px rgba(15,23,42,.07),inset 0 1px 0 #fff!important;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease,color .18s ease!important;overflow:hidden!important;isolation:isolate!important;white-space:nowrap!important}
      .lsp-accion-premium::after{content:"";position:absolute;inset:-40%;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75),transparent 58%);opacity:0;transform:scale(.45);pointer-events:none;z-index:-1}
      .lsp-accion-premium:hover,.lsp-accion-premium:focus-visible{transform:translateY(-2px)!important;box-shadow:0 11px 23px rgba(15,23,42,.11),0 0 0 3px rgba(37,99,235,.07)!important;outline:none!important}
      .lsp-action-svg{width:19px;height:19px;display:block;fill:currentColor;flex:0 0 auto}
      .lsp-accion-compartir{--lsp-accent:#2563eb;color:#1d4ed8!important;border-color:rgba(37,99,235,.18)!important;background:linear-gradient(180deg,#fff,#eff6ff)!important}
      .lsp-accion-favorito{--lsp-accent:#e11d48;color:#64748b!important}
      .lsp-accion-favorito .lsp-heart-svg path{fill:transparent;stroke:currentColor;stroke-width:1.8;transition:fill .18s ease,stroke .18s ease}
      .lsp-accion-favorito.is-active{color:#e11d48!important;border-color:rgba(225,29,72,.22)!important;background:linear-gradient(180deg,#fff,#fff1f2)!important;box-shadow:0 8px 19px rgba(225,29,72,.10),inset 0 1px 0 #fff!important}
      .lsp-accion-favorito.is-active .lsp-heart-svg path{fill:currentColor;stroke:currentColor}
      .lsp-heart-pop{animation:lspHeartPop .42s cubic-bezier(.2,1.5,.35,1)}
      .lsp-share-pop{animation:lspSharePop .36s cubic-bezier(.2,1.3,.35,1)}
      .lsp-share-pop::after{animation:lspActionShine .38s ease}
      @keyframes lspHeartPop{0%{transform:scale(1)}45%{transform:scale(1.16)}70%{transform:scale(.96)}100%{transform:scale(1)}}
      @keyframes lspSharePop{0%{transform:scale(1)}45%{transform:translateY(-2px) scale(1.08)}100%{transform:scale(1)}}
      @keyframes lspActionShine{0%{opacity:0;transform:scale(.45)}50%{opacity:.8}100%{opacity:0;transform:scale(1.25)}}
      .lsp-action-toast{position:fixed;left:50%;bottom:26px;z-index:2147482000;display:flex;align-items:center;gap:9px;padding:11px 15px;border-radius:999px;background:rgba(15,23,42,.94);color:#fff;box-shadow:0 12px 34px rgba(15,23,42,.25);backdrop-filter:blur(12px);font:700 12px/1.2 Poppins,system-ui,sans-serif;opacity:0;transform:translate(-50%,14px) scale(.96);pointer-events:none;transition:opacity .2s ease,transform .2s ease}
      .lsp-action-toast.show{opacity:1;transform:translate(-50%,0) scale(1)}
      .lsp-action-toast>span{font-size:17px;color:#fb7185}
      @media(max-width:767.98px){
        .lsp-ficha-acciones{gap:7px!important}
        .lsp-accion-premium{width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;border-radius:15px!important}
        .lsp-accion-premium .lsp-action-label{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
        .lsp-action-svg{width:20px;height:20px}
        .lsp-action-toast{bottom:92px;max-width:calc(100vw - 28px);font-size:11px}
      }
      @media(prefers-reduced-motion:reduce){.lsp-accion-premium,.lsp-action-toast{animation:none!important;transition:none!important}}
    `;document.head.appendChild(s);
  }

  function observar(){
    ['resultado','resultadoCategorias'].forEach(function(id){
      const el=document.getElementById(id);if(!el)return;
      const obs=new MutationObserver(function(){decorar(el);});
      obs.observe(el,{childList:true,subtree:true});OBSERVADORES.push(obs);decorar(el);
    });
    decorar(document);
  }

  function iniciar(){estilos();observar();window.addEventListener('popstate',function(){setTimeout(()=>decorar(document),0);});window.addEventListener('lspedia:favoritosActualizados',function(){setTimeout(()=>decorar(document),0);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
