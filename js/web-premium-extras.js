/* LSPedia — mejoras WEB premium aisladas.
   - Banner temporal premium + formato seguro de título/mensaje.
   - Vista “Últimos 30 días” para Lo nuevo.
   - Más categorías antes de “Ver más” en Diccionario/Vocabulario.
   Este módulo no modifica la búsqueda ni la lógica editorial. */
(function(){
  'use strict';
  if(window.__LSPediaWebPremiumExtras)return;
  window.__LSPediaWebPremiumExtras=true;

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const texto=v=>String(v==null?'':v).trim();
  const normal=v=>texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const cfg=()=>window.LSPediaWebConfig&&typeof window.LSPediaWebConfig==='object'?window.LSPediaWebConfig:{};
  let estilosListos=false;

  function asegurarEstilos(){
    if(estilosListos||q('#lsp-web-premium-extras-css'))return;
    estilosListos=true;
    const s=document.createElement('style');
    s.id='lsp-web-premium-extras-css';
    s.textContent=`
/* Banner temporal premium */
.lsp-web-aviso{
  max-width:1220px!important;
  margin:14px auto 18px!important;
  padding:16px 18px!important;
  min-height:82px;
  border-radius:24px!important;
  display:grid!important;
  grid-template-columns:auto minmax(0,1fr) auto auto;
  align-items:center!important;
  gap:14px!important;
  overflow:hidden;
  isolation:isolate;
  border:1px solid rgba(59,130,246,.18)!important;
  box-shadow:0 18px 48px rgba(15,23,42,.10),inset 0 1px 0 rgba(255,255,255,.86)!important;
  backdrop-filter:blur(14px) saturate(1.08);
}
.lsp-web-aviso::before{
  content:'ℹ️';
  width:48px;height:48px;border-radius:16px;
  display:grid;place-items:center;
  font-size:22px;
  background:rgba(255,255,255,.78);
  border:1px solid rgba(255,255,255,.9);
  box-shadow:0 8px 22px rgba(15,23,42,.10);
}
.lsp-web-aviso::after{
  content:'';position:absolute;inset:0 auto 0 0;width:5px;
  background:linear-gradient(180deg,#38bdf8,#2563eb);z-index:-1;
}
.lsp-web-aviso.info{background:linear-gradient(135deg,rgba(239,246,255,.98),rgba(248,251,255,.96))!important;color:#173b72!important}
.lsp-web-aviso.nuevo{background:linear-gradient(135deg,rgba(240,253,244,.98),rgba(248,255,250,.96))!important;color:#166534!important;border-color:rgba(34,197,94,.20)!important}
.lsp-web-aviso.nuevo::before{content:'✨'}
.lsp-web-aviso.nuevo::after{background:linear-gradient(180deg,#4ade80,#16a34a)}
.lsp-web-aviso.aviso{background:linear-gradient(135deg,rgba(255,251,235,.99),rgba(255,254,247,.96))!important;color:#8a4b0f!important;border-color:rgba(245,158,11,.25)!important}
.lsp-web-aviso.aviso::before{content:'⚠️'}
.lsp-web-aviso.aviso::after{background:linear-gradient(180deg,#fbbf24,#f59e0b)}
.lsp-web-aviso>div{min-width:0}
.lsp-web-aviso>div>strong{display:block;font-size:clamp(1rem,.94rem + .25vw,1.18rem);line-height:1.25;letter-spacing:-.012em;margin-bottom:4px;color:inherit}
.lsp-web-aviso>div>div{font-size:.91rem;line-height:1.55;color:inherit;opacity:.90}
.lsp-web-aviso>a{
  margin-left:0!important;padding:10px 16px!important;border:0!important;border-radius:999px!important;
  color:#fff!important;background:linear-gradient(135deg,#2563eb,#1677ff)!important;
  box-shadow:0 8px 18px rgba(37,99,235,.20);white-space:nowrap;transition:transform .18s ease,box-shadow .18s ease
}
.lsp-web-aviso>a:hover,.lsp-web-aviso>a:focus-visible{transform:translateY(-1px);box-shadow:0 11px 24px rgba(37,99,235,.28)}
.lsp-web-aviso>button{width:38px;height:38px;border-radius:12px!important;display:grid;place-items:center;background:rgba(255,255,255,.60)!important;font-size:21px!important;line-height:1}

/* Botón y modal de Lo nuevo */
.lsp-30d-btn{margin-left:auto;border:1px solid rgba(180,134,0,.26);border-radius:999px;padding:9px 14px;background:rgba(255,255,255,.76);color:#755500;font:inherit;font-size:.78rem;font-weight:900;box-shadow:0 7px 18px rgba(121,90,0,.08);cursor:pointer;transition:transform .18s ease,background .18s ease}
.lsp-30d-btn:hover,.lsp-30d-btn:focus-visible{transform:translateY(-1px);background:#fff;outline:3px solid rgba(255,193,7,.22)}
.lsp-30d-overlay{position:fixed;inset:0;z-index:2147482800;padding:20px;display:grid;place-items:center;background:rgba(7,15,30,.72);backdrop-filter:blur(10px)}
.lsp-30d-overlay[hidden]{display:none!important}
.lsp-30d-dialog{width:min(1080px,96vw);max-height:min(820px,92dvh);overflow:auto;border-radius:26px;background:#f8fbff;border:1px solid rgba(255,255,255,.78);box-shadow:0 30px 90px rgba(0,0,0,.35)}
.lsp-30d-head{position:sticky;top:0;z-index:4;display:flex;align-items:center;gap:12px;padding:18px 20px;background:rgba(248,251,255,.94);backdrop-filter:blur(14px);border-bottom:1px solid #dce7f2}
.lsp-30d-head h2{margin:0;font-size:1.25rem;font-weight:900;color:#172554}.lsp-30d-head p{margin:3px 0 0;color:#64748b;font-size:.78rem}
.lsp-30d-close{margin-left:auto;width:42px;height:42px;border:1px solid #d8e3ef;border-radius:14px;background:#fff;font-size:23px;cursor:pointer;color:#172554}
.lsp-30d-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:18px 20px 22px}
.lsp-30d-card{border:1px solid #dbe5ef;border-radius:18px;padding:8px;background:#fff;text-align:left;cursor:pointer;font:inherit;color:#0f172a;box-shadow:0 7px 22px rgba(15,23,42,.055);transition:transform .18s ease,box-shadow .18s ease}
.lsp-30d-card:hover,.lsp-30d-card:focus-visible{transform:translateY(-3px);box-shadow:0 13px 30px rgba(15,23,42,.11);outline:3px solid rgba(37,99,235,.13)}
.lsp-30d-card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:13px;background:#eef3f8}.lsp-30d-card strong{display:block;margin:9px 4px 2px;font-size:.92rem}.lsp-30d-meta{display:flex;gap:5px;flex-wrap:wrap;margin:5px 4px}.lsp-30d-chip{padding:3px 7px;border-radius:999px;background:#eef6ff;color:#1769a6;font-size:.60rem;font-weight:900}.lsp-30d-date{display:block;margin:4px;color:#78879a;font-size:.68rem}
.lsp-30d-empty{grid-column:1/-1;padding:40px 20px;text-align:center;color:#64748b}

/* Ver más de categorías */
.lsp-categoria-extra-oculta{display:none!important}
.card-ver-todas.lsp-ver-mas-premium{border-style:dashed!important;background:linear-gradient(145deg,#fff,#f8fbff)!important;box-shadow:0 8px 22px rgba(15,23,42,.055)!important}
.card-ver-todas.lsp-ver-mas-premium .categoria-dicc-nombre,.lsp-ver-mas-premium{font-weight:900!important}

@media(max-width:900px){.lsp-30d-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.lsp-web-aviso{margin:10px 12px 14px!important;grid-template-columns:auto minmax(0,1fr) auto}.lsp-web-aviso>a{grid-column:2}.lsp-web-aviso>button{grid-column:3;grid-row:1}}
@media(max-width:560px){.lsp-web-aviso{padding:14px!important;border-radius:20px!important;grid-template-columns:42px minmax(0,1fr) auto;gap:10px!important}.lsp-web-aviso::before{width:42px;height:42px;border-radius:14px;font-size:19px}.lsp-web-aviso>a{width:max-content;padding:9px 13px!important}.lsp-30d-overlay{padding:7px}.lsp-30d-dialog{width:100%;max-height:94dvh;border-radius:20px}.lsp-30d-grid{grid-template-columns:1fr 1fr;padding:12px;gap:8px}.lsp-30d-head{padding:14px}.lsp-30d-card{padding:6px;border-radius:15px}.lsp-30d-card strong{font-size:.80rem}.lsp-30d-btn{padding:8px 11px;font-size:.70rem}}
`;
    document.head.appendChild(s);
  }

  function decorarBanner(intentos){
    intentos=Number(intentos)||0;
    const banner=q('#lspWebAviso');
    if(!banner){if(intentos<14)setTimeout(()=>decorarBanner(intentos+1),220);return;}
    asegurarEstilos();
    const c=cfg(),est=c.aviso&&c.aviso.estilo||{};
    const titulo=q(':scope > div > strong',banner);
    const mensaje=q(':scope > div > div',banner);
    if(titulo){
      titulo.style.fontWeight=est.tituloNegrita===false?'700':'900';
      titulo.style.fontStyle=est.tituloCursiva===true?'italic':'normal';
    }
    if(mensaje){
      mensaje.style.fontWeight=est.mensajeNegrita===true?'800':'500';
      mensaje.style.fontStyle=est.mensajeCursiva===true?'italic':'normal';
    }
  }

  function fechaMs(v){
    const t=texto(v);if(!t)return 0;
    const m=t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(m)return Date.parse(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}T12:00:00`)|0;
    const n=Date.parse(t);return Number.isFinite(n)?n:0;
  }
  function fechaMostrar(v){
    const t=fechaMs(v);if(!t)return '';
    try{return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(t));}catch(_e){return new Date(t).toLocaleDateString();}
  }
  function fechaRegistro(x){return x&&(x.fecha||x.fechaPublicacion||x.fechapublicacion||x.fecha_publicacion)||'';}
  function dentro30(x){const t=fechaMs(fechaRegistro(x));if(!t)return false;const d=Date.now()-t;return d>=-86400000&&d<=30*86400000;}
  function fuente(x){return normal(x&&x.fuente)==='vocabulario'?'vocabulario':'diccionario';}
  function clave(x){return fuente(x)+'|'+normal(x&&x.palabra)+'|'+normal(x&&x.categoria);}
  function imgValida(v){const x=texto(v).split(',')[0].trim();return /^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(x)&&/\.(?:png|jpe?g|webp|gif|avif|svg)(?:[?#].*)?$/i.test(x)?x:'';}

  function modal30(){
    let ov=q('#lsp30dOverlay');if(ov)return ov;
    ov=document.createElement('div');ov.id='lsp30dOverlay';ov.className='lsp-30d-overlay';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Lo nuevo de los últimos 30 días');
    ov.innerHTML='<div class="lsp-30d-dialog"><div class="lsp-30d-head"><div><h2>✨ Lo nuevo · últimos 30 días</h2><p>Publicaciones recientes de Diccionario y Vocabulario.</p></div><button type="button" class="lsp-30d-close" aria-label="Cerrar">×</button></div><div class="lsp-30d-grid" id="lsp30dGrid"><div class="lsp-30d-empty">Cargando publicaciones recientes…</div></div></div>';
    ov.querySelector('.lsp-30d-close').onclick=()=>cerrar30();
    ov.addEventListener('click',e=>{if(e.target===ov)cerrar30();});
    document.body.appendChild(ov);return ov;
  }
  let overflowAntes='';
  function cerrar30(){const ov=q('#lsp30dOverlay');if(!ov)return;ov.hidden=true;document.body.style.overflow=overflowAntes;}
  function abrirRegistro(x){const ref=texto(x.id||x.referencia||x.palabra);if(!ref)return;if(fuente(x)==='vocabulario')location.href=location.pathname+'?vista=vocabulario&p='+encodeURIComponent(ref)+'&fuente=vocabulario';else location.href=location.pathname+'?p='+encodeURIComponent(ref);}

  function datosVocabulario(){try{if(window.LSPediaVocabularioPublico&&typeof window.LSPediaVocabularioPublico.obtener==='function')return window.LSPediaVocabularioPublico.obtener();if(typeof window.obtenerDatosVocabulario==='function')return window.obtenerDatosVocabulario();}catch(_e){}return [];}
  function fetchJson(url){const core=window.LSPediaCore;if(core&&typeof core.leerJsonSeguro==='function')return core.leerJsonSeguro(url,{timeoutMs:6500,reintentos:1,esperaReintentoMs:300,fetch:{cache:'no-store'}});return fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}

  async function cargar30(){
    const grid=q('#lsp30dGrid');if(!grid)return;
    grid.innerHTML='<div class="lsp-30d-empty">Cargando publicaciones recientes…</div>';
    const marca=Date.now();
    const [nuevasR,dicR]=await Promise.allSettled([fetchJson('data/nuevas-palabras.json?_30='+marca),fetchJson('data/palabras.json?_30='+marca)]);
    let lista=[];
    if(nuevasR.status==='fulfilled')lista=Array.isArray(nuevasR.value&&nuevasR.value.items)?nuevasR.value.items.slice():[];
    if(dicR.status==='fulfilled'&&Array.isArray(dicR.value)){
      dicR.value.forEach(p=>{if(!p||!texto(p.video)||!dentro30(p))return;lista.push({id:p.id||p.palabra,palabra:p.palabra,categoria:p.categoria,imagen:p.imagen,fecha:fechaRegistro(p),fuente:'diccionario'});});
    }
    datosVocabulario().forEach(p=>{if(!p||!texto(p.video)||!dentro30(p))return;lista.push({id:p.idQuiz||p.id||p.palabra,palabra:p.palabra,categoria:p.categoria,imagen:p.imagen,fecha:fechaRegistro(p),fuente:'vocabulario'});});
    const unicos=new Map();lista.filter(dentro30).forEach(x=>{const k=clave(x);const previo=unicos.get(k);if(!previo||fechaMs(fechaRegistro(x))>fechaMs(fechaRegistro(previo)))unicos.set(k,x);});
    const recientes=Array.from(unicos.values()).sort((a,b)=>fechaMs(fechaRegistro(b))-fechaMs(fechaRegistro(a)));
    grid.replaceChildren();
    if(!recientes.length){const e=document.createElement('div');e.className='lsp-30d-empty';e.textContent='No hay publicaciones con fecha dentro de los últimos 30 días.';grid.appendChild(e);return;}
    recientes.forEach(x=>{
      const b=document.createElement('button');b.type='button';b.className='lsp-30d-card';b.onclick=()=>abrirRegistro(x);
      const im=document.createElement('img');im.src=imgValida(x.imagen)||'img/imagen-no-disponible.svg';im.alt='Miniatura de '+texto(x.palabra);im.loading='lazy';im.onerror=()=>{if(!im.dataset.f){im.dataset.f='1';im.src='img/imagen-no-disponible.svg';}};
      const n=document.createElement('strong');n.textContent=texto(x.palabra)||'Contenido';
      const meta=document.createElement('span');meta.className='lsp-30d-meta';const f=document.createElement('span');f.className='lsp-30d-chip';f.textContent=fuente(x)==='vocabulario'?'🗂️ Vocabulario':'📘 Diccionario';meta.appendChild(f);if(texto(x.categoria)){const c=document.createElement('span');c.className='lsp-30d-chip';c.textContent=texto(x.categoria);meta.appendChild(c);}
      const d=document.createElement('span');d.className='lsp-30d-date';d.textContent=fechaMostrar(fechaRegistro(x));
      b.append(im,n,meta,d);grid.appendChild(b);
    });
  }

  function mejorarLoNuevo(intentos){
    intentos=Number(intentos)||0;
    const card=q('#lspNuevasCard');if(!card){if(intentos<16)setTimeout(()=>mejorarLoNuevo(intentos+1),250);return;}
    asegurarEstilos();if(q('#lspBtn30Dias',card))return;
    const titulo=q('.lsp-mejora-titulo',card);const host=titulo&&titulo.parentElement?titulo.parentElement:card.firstElementChild||card;
    const b=document.createElement('button');b.id='lspBtn30Dias';b.type='button';b.className='lsp-30d-btn';b.textContent='🗓️ Últimos 30 días';b.setAttribute('aria-label','Ver lo nuevo de los últimos 30 días');
    b.onclick=()=>{const ov=modal30();overflowAntes=document.body.style.overflow;document.body.style.overflow='hidden';ov.hidden=false;cargar30().catch(e=>{console.warn('[LSPedia] No se pudo cargar Lo nuevo de 30 días',e);const g=q('#lsp30dGrid');if(g)g.innerHTML='<div class="lsp-30d-empty">No pude cargar las publicaciones recientes. Intenta nuevamente.</div>';});};
    host.style.display='flex';host.style.alignItems='center';host.style.gap='10px';host.style.flexWrap='wrap';host.appendChild(b);
  }

  function limiteConfig(tipo){const c=cfg(),v=Number(c.heroes&&c.heroes[tipo]&&c.heroes[tipo].categoriasIniciales)||10;const base=Math.max(4,Math.min(18,v));if(innerWidth<640)return Math.min(base,6);if(innerWidth<1100)return Math.min(base,8);return base;}
  const panelPreparado=new Set();
  function encontrarToggle(panel){return qa('.card,button,a,[role="button"]',panel).find(x=>/ver\s+(?:todas(?:\s+las\s+categor[ií]as)?|menos|m[aá]s)/i.test(texto(x.textContent)));}
  function wrapperDirecto(panel,nodo){let x=nodo;while(x&&x.parentElement!==panel)x=x.parentElement;return x&&x.parentElement===panel?x:null;}
  function categoriaNombre(w){const c=q('[data-categoria]',w);if(c&&c.dataset.categoria)return texto(c.dataset.categoria);const e=q('.categoria-nombre,.categoria-dicc-nombre,.card-title,h3,h4,h5',w);return texto(e&&e.textContent);}
  function aplicarOrdenOcultas(panel,wrappers,tipo){if(tipo!=='vocabulario')return wrappers;const v=cfg().heroes&&cfg().heroes.vocabulario||{},oc=new Set((v.categoriasOcultas||[]).map(normal)),orden=(v.categoriasOrden||[]).map(normal);wrappers.forEach(w=>{const n=normal(categoriaNombre(w));if(oc.has(n)){w.dataset.lspCfgOculta='1';w.style.display='none';}else delete w.dataset.lspCfgOculta;const i=orden.indexOf(n);w.dataset.lspOrden=String(i>=0?i:9999);});return wrappers.sort((a,b)=>(Number(a.dataset.lspOrden)||9999)-(Number(b.dataset.lspOrden)||9999));}

  function mejorarCategorias(panelId,tipo,intentos){
    intentos=Number(intentos)||0;const panel=document.getElementById(panelId);if(!panel){if(intentos<12)setTimeout(()=>mejorarCategorias(panelId,tipo,intentos+1),260);return;}
    let toggle=encontrarToggle(panel);if(!toggle){if(intentos<12)setTimeout(()=>mejorarCategorias(panelId,tipo,intentos+1),260);return;}
    const key=panelId;
    if(!panelPreparado.has(key)&&/ver\s+todas/i.test(texto(toggle.textContent))){panelPreparado.add(key);try{toggle.click();}catch(_e){}setTimeout(()=>mejorarCategorias(panelId,tipo,0),70);return;}
    asegurarEstilos();toggle=encontrarToggle(panel);if(!toggle)return;const tw=wrapperDirecto(panel,toggle);let wrappers=Array.from(panel.children).filter(w=>w!==tw);wrappers=aplicarOrdenOcultas(panel,wrappers,tipo);wrappers.forEach(w=>{if(w.parentElement===panel)panel.insertBefore(w,tw);});
    const visibles=wrappers.filter(w=>w.dataset.lspCfgOculta!=='1');const limite=limiteConfig(tipo);let expandido=false;
    function pintar(){visibles.forEach((w,i)=>w.classList.toggle('lsp-categoria-extra-oculta',!expandido&&i>=limite));const ocultas=visibles.length>limite;if(!ocultas){tw.style.display='none';return;}tw.style.display='';const label=q('.categoria-dicc-nombre,.categoria-nombre,.card-title,h3,h4,h5',toggle)||toggle;label.textContent=expandido?'Ver menos':'Ver más';toggle.classList.add('lsp-ver-mas-premium');const flecha=q('.categoria-dicc-flecha',toggle);if(flecha)flecha.style.transform=expandido?'rotate(-90deg)':'';}
    if(!toggle.dataset.lspPremiumToggle){toggle.dataset.lspPremiumToggle='1';toggle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();expandido=!expandido;pintar();},true);}
    pintar();
  }

  function refrescar(){decorarBanner(0);mejorarLoNuevo(0);mejorarCategorias('panelCategoriasDiccionario','diccionario',0);mejorarCategorias('panelCategorias','vocabulario',0);}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrar30();});
  document.addEventListener('lspedia:datosListos',()=>setTimeout(refrescar,80));
  document.addEventListener('lspedia:vocabularioPublicoListo',()=>setTimeout(()=>mejorarCategorias('panelCategorias','vocabulario',0),100));
  document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('#btnInicio,#btnCategorias,.mbn-item');if(b)setTimeout(refrescar,180);});
  window.addEventListener('resize',()=>{setTimeout(()=>{mejorarCategorias('panelCategoriasDiccionario','diccionario',0);mejorarCategorias('panelCategorias','vocabulario',0);},120);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(refrescar,120);setTimeout(refrescar,800);},{once:true});else{setTimeout(refrescar,50);setTimeout(refrescar,700);}
})();