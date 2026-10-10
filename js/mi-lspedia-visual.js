/* LSPedia — Mi LSPedia visual
   Fusiona "Tu aprendizaje" dentro de Mi LSPedia y prioriza iconos, imágenes y acciones visuales.
   Todo se calcula localmente en el dispositivo.

   Descubrir:
   - Ya no abre una ficha de inmediato.
   - Primero muestra una recomendación visual dentro de Mi LSPedia.
   - La ficha solo se abre cuando el usuario toca "Ver".
   - Al abrir una ficha desde la recomendación, la vista empieza arriba. */
(function(){
  'use strict';
  if(window.__LSPediaMiVisual)return;
  window.__LSPediaMiVisual=true;

  const CLAVE_FAVORITOS='lspedia_favoritos';
  const CLAVE_HISTORIAL='lspedia_historial';
  const CLAVE_PROGRESO='lspedia_progreso_palabras_v1';
  let panel=null;
  let rafPendiente=false;

  const $=(s,r=document)=>r.querySelector(s);
  const leer=(clave,respaldo)=>{try{const v=JSON.parse(localStorage.getItem(clave)||'null');return v==null?respaldo:v;}catch(_e){return respaldo;}};
  const norm=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function progreso(){const p=leer(CLAVE_PROGRESO,{items:[]});return p&&Array.isArray(p.items)?p.items:[];}
  function favoritos(){const f=leer(CLAVE_FAVORITOS,[]);return Array.isArray(f)?f:[];}
  function historial(){const h=leer(CLAVE_HISTORIAL,[]);return Array.isArray(h)?h:[];}
  function totalDisponible(){
    let dic=0,voc=0;
    try{dic=window.App&&Array.isArray(window.App.datos)?window.App.datos.length:0;}catch(_e){}
    try{voc=window.LSPediaVocabularioPublico&&typeof window.LSPediaVocabularioPublico.total==='function'?window.LSPediaVocabularioPublico.total():0;}catch(_e){}
    return Math.max(0,dic+voc);
  }
  function ultimaPalabra(){
    return progreso().filter(x=>x&&x.palabra).sort((a,b)=>(Number(b.ultimaVez)||0)-(Number(a.ultimaVez)||0))[0]||null;
  }
  function porcentaje(){
    const total=totalDisponible(),vistos=progreso().filter(x=>x&&x.palabra).length;
    if(!total)return 0;
    return Math.max(0,Math.min(100,Math.round((vistos/total)*100)));
  }

  function datosDiccionario(){
    try{return window.App&&Array.isArray(window.App.datos)?window.App.datos:[];}catch(_e){return [];}
  }
  function datosVocabulario(){
    try{
      if(window.LSPediaVocabularioPublico&&typeof window.LSPediaVocabularioPublico.obtener==='function'){
        const lista=window.LSPediaVocabularioPublico.obtener();
        return Array.isArray(lista)?lista:[];
      }
    }catch(_e){}
    return [];
  }
  function coincideItem(x,ref,fuente){
    const r=norm(ref);if(!x||!r)return false;
    const valores=fuente==='vocabulario'
      ? [x.idQuiz,x.id,x.referencia,x.palabra]
      : [x.id,x.referencia,x.palabra];
    return valores.some(v=>norm(v)===r);
  }
  function resolverVisual(ref,fuente){
    const lista=fuente==='vocabulario'?datosVocabulario():datosDiccionario();
    let item=lista.find(x=>coincideItem(x,ref,fuente))||null;
    if(!item){
      const otra=fuente==='vocabulario'?'diccionario':'vocabulario';
      const alt=otra==='vocabulario'?datosVocabulario():datosDiccionario();
      item=alt.find(x=>coincideItem(x,ref,otra))||null;
      if(item)fuente=otra;
    }
    if(!item)return {referencia:ref,palabra:ref,categoria:'',imagen:'',fuente:fuente||'diccionario'};
    return {
      referencia:String(item.idQuiz||item.id||item.referencia||item.palabra||ref||'').trim(),
      palabra:String(item.palabra||ref||'').trim(),
      categoria:String(item.categoria||'').trim(),
      imagen:String(item.imagen||'').split(',')[0].trim(),
      fuente
    };
  }
  function rutaImagen(valor){
    const v=String(valor||'').trim();if(!v)return '';
    if(/^(?:https?:\/\/|data:|\/|\.\.?\/)/i.test(v))return v;
    return v;
  }

  function estilos(){
    if($('#miLspediaVisualCss'))return;
    const s=document.createElement('style');s.id='miLspediaVisualCss';s.textContent=`
      #panelAprendizajeVocabulario.lsp-learning-merged,#lspModoCard.lsp-learning-merged{display:none!important}
      #miLspediaHub.mi-lsp-visual-ready{background:linear-gradient(145deg,#f8fbff 0%,#eef5ff 52%,#fffaf0 100%);border-radius:32px!important;box-shadow:0 20px 54px rgba(30,64,175,.10),inset 0 1px 0 #fff!important}
      #miLspediaHub .mi-lsp-title p{font-size:.72rem!important;line-height:1.35;color:#708197!important}
      #miLspediaHub .mi-lsp-smart-wrap{display:none!important}
      .mi-lsp-visual-dashboard{display:grid;grid-template-columns:170px minmax(0,1fr);gap:16px;margin:0 0 16px;padding:14px;border:1px solid rgba(148,163,184,.16);border-radius:24px;background:rgba(255,255,255,.68);box-shadow:inset 0 1px 0 rgba(255,255,255,.9)}
      .mi-lsp-progress-card{display:flex;align-items:center;justify-content:center;min-height:150px;border-radius:20px;background:linear-gradient(145deg,#152f68,#2563eb);box-shadow:0 14px 26px rgba(37,99,235,.20);color:#fff;position:relative;overflow:hidden}
      .mi-lsp-progress-card::after{content:"";position:absolute;width:120px;height:120px;border-radius:50%;right:-54px;bottom:-56px;border:20px solid rgba(255,255,255,.07)}
      .mi-lsp-ring{--p:0;width:108px;height:108px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#ffd329 calc(var(--p)*1%),rgba(255,255,255,.15) 0);position:relative;box-shadow:0 0 0 1px rgba(255,255,255,.12)}
      .mi-lsp-ring::before{content:"";position:absolute;inset:10px;border-radius:50%;background:#173574;box-shadow:inset 0 0 18px rgba(0,0,0,.15)}
      .mi-lsp-ring-copy{position:relative;z-index:1;text-align:center}.mi-lsp-ring-copy strong{display:block;font-size:1.35rem;line-height:1}.mi-lsp-ring-copy small{display:block;margin-top:5px;font-size:.62rem;opacity:.86;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
      .mi-lsp-visual-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-content:stretch}
      .mi-lsp-visual-btn{border:1px solid #dce7f3;border-radius:20px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:150px;padding:12px 8px;cursor:pointer;font:inherit;color:#21324a;box-shadow:0 8px 18px rgba(15,23,42,.05);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
      .mi-lsp-visual-btn:hover,.mi-lsp-visual-btn:focus-visible{transform:translateY(-3px);box-shadow:0 14px 28px rgba(15,23,42,.09);outline:none;border-color:#bfd3ed}
      .mi-lsp-visual-icon{width:58px;height:58px;border-radius:19px;display:grid;place-items:center;font-size:28px;background:#eff6ff;box-shadow:inset 0 1px 0 #fff}
      .mi-lsp-visual-btn[data-action="continuar"] .mi-lsp-visual-icon{background:linear-gradient(145deg,#dbeafe,#bfdbfe)}
      .mi-lsp-visual-btn[data-action="favoritos"] .mi-lsp-visual-icon{background:linear-gradient(145deg,#fff1f2,#ffe4e6)}
      .mi-lsp-visual-btn[data-action="recientes"] .mi-lsp-visual-icon{background:linear-gradient(145deg,#f5f3ff,#ede9fe)}
      .mi-lsp-visual-btn[data-action="descubrir"] .mi-lsp-visual-icon{background:linear-gradient(145deg,#fff8d8,#ffe992)}
      .mi-lsp-visual-btn>span:last-child{display:flex;flex-direction:column;gap:4px;min-width:0;max-width:100%;line-height:1.4}.mi-lsp-visual-btn b{display:block;font-size:.80rem}.mi-lsp-visual-btn small{display:block;font-size:.62rem;color:#7b8a9d;max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mi-lsp-discovery-wrap{margin:-3px 0 16px}
      .mi-lsp-discovery-wrap[hidden]{display:none!important}
      .mi-lsp-discovery-card{position:relative;display:grid;grid-template-columns:92px minmax(0,1fr) auto;align-items:center;gap:15px;padding:13px 14px;border:1px solid rgba(231,182,22,.28);border-radius:24px;background:linear-gradient(135deg,#fffdf1 0%,#fff4b8 52%,#eef6ff 100%);box-shadow:0 13px 30px rgba(146,103,11,.10);overflow:hidden;animation:miLspDiscoverIn .28s cubic-bezier(.2,.8,.2,1)}
      .mi-lsp-discovery-card::before{content:"";position:absolute;width:150px;height:150px;border-radius:50%;right:-78px;top:-86px;background:rgba(255,255,255,.44);pointer-events:none}
      .mi-lsp-discovery-media{width:92px;height:92px;border-radius:21px;background:#fff;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(255,255,255,.88);box-shadow:0 8px 18px rgba(15,23,42,.09);font-size:35px}
      .mi-lsp-discovery-media img{width:100%;height:100%;object-fit:cover;display:block}
      .mi-lsp-discovery-copy{min-width:0}.mi-lsp-discovery-kicker{display:flex;align-items:center;gap:6px;color:#9a6b00;font-size:.66rem;font-weight:900;text-transform:uppercase;letter-spacing:.035em}.mi-lsp-discovery-copy h3{margin:4px 0 3px;font-size:1.05rem;color:#173a73;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mi-lsp-discovery-copy p{margin:0;color:#68798d;font-size:.70rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mi-lsp-discovery-actions{display:flex;align-items:center;gap:7px;position:relative;z-index:1}.mi-lsp-discovery-open,.mi-lsp-discovery-close{border:0;font:inherit;cursor:pointer}.mi-lsp-discovery-open{min-height:44px;padding:0 17px;border-radius:15px;background:#1f6fe5;color:#fff;font-size:.73rem;font-weight:900;box-shadow:0 8px 18px rgba(37,99,235,.20)}.mi-lsp-discovery-close{width:40px;height:40px;border-radius:14px;background:rgba(255,255,255,.78);color:#6b7280;font-size:18px;border:1px solid rgba(148,163,184,.20)}
      .mi-lsp-discovery-open:active,.mi-lsp-discovery-close:active{transform:scale(.96)}
      @keyframes miLspDiscoverIn{from{opacity:0;transform:translateY(-7px) scale(.985)}to{opacity:1;transform:none}}
      .mi-lsp-toolbar{margin-top:2px!important}
      @media(max-width:900px){.mi-lsp-visual-dashboard{grid-template-columns:130px minmax(0,1fr)}.mi-lsp-progress-card{min-height:126px}.mi-lsp-ring{width:90px;height:90px}.mi-lsp-visual-actions{grid-template-columns:repeat(4,minmax(0,1fr))}.mi-lsp-visual-btn{min-height:126px;border-radius:18px}.mi-lsp-visual-icon{width:50px;height:50px;font-size:24px}}
      @media(max-width:640px){#miLspediaHub.mi-lsp-visual-ready{border-radius:24px!important}.mi-lsp-visual-dashboard{grid-template-columns:104px 1fr;gap:9px;padding:9px;border-radius:20px}.mi-lsp-progress-card{min-height:110px;border-radius:17px}.mi-lsp-ring{width:76px;height:76px}.mi-lsp-ring::before{inset:8px}.mi-lsp-ring-copy strong{font-size:1.05rem}.mi-lsp-ring-copy small{font-size:.52rem}.mi-lsp-visual-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.mi-lsp-visual-btn{min-height:51px;border-radius:15px;flex-direction:row;justify-content:flex-start;padding:7px 9px;gap:8px}.mi-lsp-visual-icon{width:38px;height:38px;flex:0 0 38px;border-radius:12px;font-size:20px}.mi-lsp-visual-btn b{font-size:.70rem}.mi-lsp-visual-btn small{display:none}.mi-lsp-discovery-wrap{margin:-2px 0 12px}.mi-lsp-discovery-card{grid-template-columns:72px minmax(0,1fr) auto;gap:10px;padding:10px;border-radius:19px}.mi-lsp-discovery-media{width:72px;height:72px;border-radius:17px}.mi-lsp-discovery-copy h3{font-size:.90rem}.mi-lsp-discovery-copy p{font-size:.62rem}.mi-lsp-discovery-kicker{font-size:.58rem}.mi-lsp-discovery-open{width:44px;padding:0;font-size:0;border-radius:14px}.mi-lsp-discovery-open::after{content:"›";font-size:25px;line-height:1}.mi-lsp-discovery-close{display:none}}
      @media(max-width:410px){.mi-lsp-visual-dashboard{grid-template-columns:92px 1fr}.mi-lsp-progress-card{min-height:104px}.mi-lsp-ring{width:68px;height:68px}.mi-lsp-visual-btn{padding:6px 7px}.mi-lsp-visual-icon{width:34px;height:34px;flex-basis:34px;font-size:18px}.mi-lsp-discovery-card{grid-template-columns:64px minmax(0,1fr) 40px}.mi-lsp-discovery-media{width:64px;height:64px}.mi-lsp-discovery-copy h3{font-size:.84rem}}
      @media(prefers-reduced-motion:reduce){.mi-lsp-visual-btn{transition:none!important}.mi-lsp-discovery-card{animation:none!important}}
    `;document.head.appendChild(s);
  }

  function abrirTab(tab){const b=panel&&panel.querySelector('.mi-lsp-tab[data-tab="'+tab+'"]');if(b)b.click();}
  function vibrar(){try{if(navigator.vibrate)navigator.vibrate(10);}catch(_e){}}

  function asegurarDescubrir(){
    if(!panel)return null;
    let wrap=$('.mi-lsp-discovery-wrap',panel);
    if(wrap)return wrap;
    const dash=$('.mi-lsp-visual-dashboard',panel),body=$('.mi-lsp-body',panel);if(!body)return null;
    wrap=document.createElement('div');wrap.className='mi-lsp-discovery-wrap';wrap.hidden=true;
    if(dash&&dash.nextSibling)body.insertBefore(wrap,dash.nextSibling);else if(dash)body.appendChild(wrap);else body.prepend(wrap);
    wrap.addEventListener('click',function(e){
      const cerrar=e.target.closest('.mi-lsp-discovery-close');
      if(cerrar){wrap.hidden=true;return;}
      const abrir=e.target.closest('.mi-lsp-discovery-open');
      if(!abrir)return;
      const reco=panel.querySelector('.mi-lsp-reco');
      if(reco){
        reco.click();
        setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),90);
      }
    });
    return wrap;
  }

  function mostrarDescubrir(){
    const wrap=asegurarDescubrir();if(!wrap)return;
    const reco=panel&&panel.querySelector('.mi-lsp-reco');
    if(!reco){abrirTab('frecuentes');return;}
    const ref=String(reco.dataset.ref||'').trim();
    const fuente=String(reco.dataset.fuente||'diccionario').trim()||'diccionario';
    const item=resolverVisual(ref,fuente);
    const src=rutaImagen(item.imagen);
    const media=src?'<img src="'+esc(src)+'" alt="" loading="lazy">':'<span>'+(item.fuente==='vocabulario'?'🗂️':'📖')+'</span>';
    const tipo=item.fuente==='vocabulario'?'Vocabulario':'Diccionario';
    wrap.innerHTML='<article class="mi-lsp-discovery-card" data-ref="'+esc(item.referencia)+'" data-fuente="'+esc(item.fuente)+'"><div class="mi-lsp-discovery-media">'+media+'</div><div class="mi-lsp-discovery-copy"><div class="mi-lsp-discovery-kicker">✨ Para ti</div><h3>'+esc(item.palabra||ref)+'</h3><p>'+esc(tipo+(item.categoria?' · '+item.categoria:''))+'</p></div><div class="mi-lsp-discovery-actions"><button type="button" class="mi-lsp-discovery-open" aria-label="Ver '+esc(item.palabra||ref)+'">Ver</button><button type="button" class="mi-lsp-discovery-close" aria-label="Cerrar recomendación">×</button></div></article>';
    wrap.hidden=false;
    requestAnimationFrame(()=>{
      try{wrap.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(_e){}
    });
  }

  function conectarDashboard(dash){
    dash.addEventListener('click',function(e){
      const b=e.target.closest('.mi-lsp-visual-btn');if(!b)return;vibrar();
      const a=b.dataset.action;
      if(a==='favoritos'){abrirTab('favoritos');return;}
      if(a==='recientes'){abrirTab('recientes');return;}
      if(a==='continuar'){
        const oculto=panel&&panel.querySelector('.mi-lsp-continue');
        if(oculto){oculto.click();return;}
        try{if(typeof window.abrirUltimaPalabraProgreso==='function')window.abrirUltimaPalabraProgreso();}catch(_e){}
        return;
      }
      if(a==='descubrir'){
        mostrarDescubrir();
      }
    });
  }

  function asegurarDashboard(){
    panel=$('#miLspediaHub');if(!panel)return false;
    estilos();
    let dash=$('.mi-lsp-visual-dashboard',panel);
    if(!dash){
      const body=$('.mi-lsp-body',panel),smart=$('.mi-lsp-smart-wrap',panel);if(!body)return false;
      dash=document.createElement('div');dash.className='mi-lsp-visual-dashboard';
      dash.innerHTML='<div class="mi-lsp-progress-card"><div class="mi-lsp-ring"><div class="mi-lsp-ring-copy"><strong>0%</strong><small>progreso</small></div></div></div><div class="mi-lsp-visual-actions"><button class="mi-lsp-visual-btn" data-action="continuar"><span class="mi-lsp-visual-icon">▶️</span><span><b>Seguir</b> <small>Última palabra</small></span></button><button class="mi-lsp-visual-btn" data-action="favoritos"><span class="mi-lsp-visual-icon">❤️</span><span><b>Favoritos</b> <small>0 guardados</small></span></button><button class="mi-lsp-visual-btn" data-action="recientes"><span class="mi-lsp-visual-icon">🕘</span><span><b>Recientes</b> <small>0 vistos</small></span></button><button class="mi-lsp-visual-btn" data-action="descubrir"><span class="mi-lsp-visual-icon">✨</span><span><b>Descubrir</b> <small>Para ti</small></span></button></div>';
      if(smart)body.insertBefore(dash,smart);else body.prepend(dash);
      conectarDashboard(dash);
    }
    asegurarDescubrir();
    const sub=$('.mi-lsp-title p',panel);if(sub)sub.textContent='❤️ Guardados  ·  ▶️ Seguir  ·  ✨ Descubrir';
    panel.classList.add('mi-lsp-visual-ready');
    ['panelAprendizajeVocabulario','lspModoCard'].forEach(id=>{const n=document.getElementById(id);if(n)n.classList.add('lsp-learning-merged');});
    return true;
  }

  function pintar(){
    rafPendiente=false;if(!asegurarDashboard())return;
    const dash=$('.mi-lsp-visual-dashboard',panel);if(!dash)return;
    const p=porcentaje(),items=progreso(),fav=favoritos(),his=historial(),ultima=ultimaPalabra();
    const ring=$('.mi-lsp-ring',dash);if(ring)ring.style.setProperty('--p',String(p));
    const ringNum=$('.mi-lsp-ring-copy strong',dash);if(ringNum)ringNum.textContent=p+'%';
    const seguir=dash.querySelector('[data-action="continuar"] small');if(seguir)seguir.textContent=ultima&&ultima.palabra?ultima.palabra:'Empieza aquí';
    const favTxt=dash.querySelector('[data-action="favoritos"] small');if(favTxt)favTxt.textContent=fav.length+' guardados';
    const recTxt=dash.querySelector('[data-action="recientes"] small');if(recTxt)recTxt.textContent=Math.max(his.length,items.length)+' vistos';
  }
  function programar(){if(rafPendiente)return;rafPendiente=true;requestAnimationFrame(pintar);}

  function iniciar(){
    estilos();
    [80,250,700,1500,2800].forEach(ms=>setTimeout(programar,ms));
    document.addEventListener('click',function(){setTimeout(programar,80);},true);
    window.addEventListener('popstate',programar);
    window.addEventListener('storage',e=>{if([CLAVE_FAVORITOS,CLAVE_HISTORIAL,CLAVE_PROGRESO].includes(e.key))programar();});
    window.addEventListener('lspedia:favoritosActualizados',programar);
    document.addEventListener('lspedia:vocabularioPublicoListo',programar);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
