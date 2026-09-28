/* LSPedia — Mi LSPedia
   Espacio personal local: Favoritos, Recientes, Frecuentes, Continuar y sugerencias.
   No envía datos personales ni de uso a un servidor. */
(function(){
  'use strict';
  if(window.__LSPediaMiPanel)return;
  window.__LSPediaMiPanel=true;

  const CLAVE_FAVORITOS='lspedia_favoritos';
  const CLAVE_HISTORIAL='lspedia_historial';
  const CLAVE_PROGRESO='lspedia_progreso_palabras_v1';
  const MAX_ITEMS=16;
  let tabActual='favoritos';
  let consulta='';
  let panel=null;
  let cuerpo=null;
  let ocultoManual=false;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const norm=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function leerJsonLocal(clave,respaldo){
    try{const v=JSON.parse(localStorage.getItem(clave)||'null');return v==null?respaldo:v;}catch(_e){return respaldo;}
  }
  function favoritos(){const v=leerJsonLocal(CLAVE_FAVORITOS,[]);return Array.isArray(v)?v:[];}
  function historial(){const v=leerJsonLocal(CLAVE_HISTORIAL,[]);return Array.isArray(v)?v:[];}
  function progreso(){const v=leerJsonLocal(CLAVE_PROGRESO,{items:[]});return v&&Array.isArray(v.items)?v.items:[];}

  function datosDiccionario(){return window.App&&Array.isArray(window.App.datos)?window.App.datos:[];}
  function datosVocabulario(){
    try{if(window.LSPediaVocabularioPublico&&typeof window.LSPediaVocabularioPublico.obtener==='function')return window.LSPediaVocabularioPublico.obtener()||[];}catch(_e){}
    return [];
  }
  function refItem(x,fuente){
    if(!x)return '';
    // Importante: el visor público de Vocabulario abre por id/referencia/palabra.
    // idQuiz sirve para otros flujos, pero no debe ser la referencia principal
    // de navegación porque mostrarPalabraVocabularioPorReferencia no lo usa.
    if(fuente==='vocabulario')return String(x.id||x.referencia||x.palabra||x.idQuiz||'').trim();
    return String(x.id||x.referencia||x.palabra||'').trim();
  }
  function coincideRef(x,ref,fuente){
    const r=norm(ref);if(!r)return false;
    return [refItem(x,fuente),x&&x.palabra,x&&x.idQuiz,x&&x.id,x&&x.referencia].some(v=>norm(v)===r);
  }
  function resolver(ref,preferida){
    const dic=datosDiccionario(),voc=datosVocabulario();
    let raw=null,fuente='diccionario';
    if(preferida==='vocabulario')raw=voc.find(x=>coincideRef(x,ref,'vocabulario'))||null;
    if(!raw&&preferida==='diccionario')raw=dic.find(x=>coincideRef(x,ref,'diccionario'))||null;
    if(!raw){raw=dic.find(x=>coincideRef(x,ref,'diccionario'))||null;fuente='diccionario';}
    if(!raw){raw=voc.find(x=>coincideRef(x,ref,'vocabulario'))||null;fuente='vocabulario';}
    if(!raw)return null;
    if(voc.includes(raw))fuente='vocabulario';
    return {raw,fuente,referencia:refItem(raw,fuente),palabra:String(raw.palabra||ref||'').trim(),categoria:String(raw.categoria||'').trim(),imagen:String(raw.imagen||'').split(',')[0].trim()};
  }
  function itemDesdeProgreso(x){
    const res=resolver(x.referencia||x.palabra,x.fuente);
    if(res){res.visitas=Math.max(1,Number(x.visitas)||1);res.ultimaVez=Number(x.ultimaVez)||0;return res;}
    return {raw:null,fuente:x.fuente||'diccionario',referencia:x.referencia||'',palabra:x.palabra||'',categoria:x.categoria||'',visitas:Math.max(1,Number(x.visitas)||1),ultimaVez:Number(x.ultimaVez)||0};
  }
  function unicos(lista){
    const vistos=new Set();return lista.filter(x=>{if(!x||!x.palabra)return false;const k=x.fuente+'|'+norm(x.referencia||x.palabra);if(vistos.has(k))return false;vistos.add(k);return true;});
  }

  function abrir(item){
    if(!item)return;
    if(item.fuente==='vocabulario'){
      const palabra=String(item.palabra||'').trim();
      const referencia=String(item.referencia||palabra||'').trim();
      if(typeof window.mostrarPalabraVocabularioPorReferencia==='function'){
        // La palabra es el respaldo más estable: la función pública siempre
        // compara también por p.palabra, aunque el id interno cambie.
        window.mostrarPalabraVocabularioPorReferencia(palabra||referencia);
        return;
      }
      location.href=location.pathname+'?vista=vocabulario&p='+encodeURIComponent(palabra||referencia)+'&fuente=vocabulario';return;
    }
    if(item.raw&&typeof window.mostrarPalabra==='function'){window.mostrarPalabra(item.raw);window.scrollTo({top:0,behavior:'smooth'});return;}
    location.href=location.pathname+'?p='+encodeURIComponent(item.referencia||item.palabra);
  }

  function sugerencia(){
    const favRes=favoritos().map(r=>resolver(r,'diccionario')).filter(Boolean);
    const prog=progreso().map(itemDesdeProgreso).filter(x=>x&&x.palabra);
    const punt=new Map();
    favRes.forEach(x=>{if(x.categoria)punt.set(norm(x.categoria),(punt.get(norm(x.categoria))||0)+4);});
    prog.slice(0,40).forEach(x=>{if(x.categoria)punt.set(norm(x.categoria),(punt.get(norm(x.categoria))||0)+Math.min(3,x.visitas||1));});
    const top=[...punt.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
    const ya=new Set([...favoritos(),...historial(),...progreso().map(x=>x.referencia||x.palabra)].map(norm));
    let candidatos=[];
    datosDiccionario().forEach(x=>{const r=refItem(x,'diccionario');if(r&&!ya.has(norm(r)))candidatos.push({raw:x,fuente:'diccionario',referencia:r,palabra:x.palabra||r,categoria:x.categoria||'',imagen:String(x.imagen||'').split(',')[0].trim()});});
    datosVocabulario().forEach(x=>{const r=refItem(x,'vocabulario');if(r&&!ya.has(norm(r)))candidatos.push({raw:x,fuente:'vocabulario',referencia:r,palabra:x.palabra||r,categoria:x.categoria||'',imagen:String(x.imagen||'').split(',')[0].trim()});});
    if(top){const afin=candidatos.filter(x=>norm(x.categoria)===top);if(afin.length)candidatos=afin;}
    if(!candidatos.length)return null;
    const dia=Math.floor(Date.now()/86400000);
    const semilla=(dia*31+(top.length||7)*17)%candidatos.length;
    return candidatos[semilla];
  }

  function listaActual(){
    if(tabActual==='favoritos')return unicos(favoritos().map(r=>resolver(r,'diccionario')).filter(Boolean));
    if(tabActual==='recientes'){
      const h=historial().map(r=>resolver(r,'diccionario')).filter(Boolean);
      const p=progreso().sort((a,b)=>(Number(b.ultimaVez)||0)-(Number(a.ultimaVez)||0)).map(itemDesdeProgreso);
      return unicos(h.concat(p)).slice(0,MAX_ITEMS);
    }
    return unicos(progreso().map(itemDesdeProgreso).filter(x=>x&&x.palabra).sort((a,b)=>(b.visitas||0)-(a.visitas||0)||(b.ultimaVez||0)-(a.ultimaVez||0))).slice(0,MAX_ITEMS);
  }

  function filtrar(lista){const q=norm(consulta);if(!q)return lista;return lista.filter(x=>norm(x.palabra).includes(q)||norm(x.categoria).includes(q)||norm(x.fuente).includes(q));}

  function iconoFuente(f){return f==='vocabulario'?'🗂️':'📖';}
  function tarjeta(item,esFav){
    const img=item.imagen&&/^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(item.imagen)?'<img src="'+esc(item.imagen)+'" alt="" loading="lazy">':'<span>'+iconoFuente(item.fuente)+'</span>';
    return '<article class="mi-lsp-card" data-ref="'+esc(item.referencia)+'" data-fuente="'+esc(item.fuente)+'">'+
      '<button type="button" class="mi-lsp-open" aria-label="Abrir '+esc(item.palabra)+'"><span class="mi-lsp-thumb">'+img+'</span><span class="mi-lsp-card-main"><strong>'+esc(item.palabra)+'</strong><small><b>'+iconoFuente(item.fuente)+' '+(item.fuente==='vocabulario'?'Vocabulario':'Diccionario')+'</b>'+(item.categoria?' · '+esc(item.categoria):'')+(item.visitas>1?' · '+item.visitas+' visitas':'')+'</small></span><span class="mi-lsp-arrow">›</span></button>'+
      (esFav?'<button type="button" class="mi-lsp-remove" title="Quitar de favoritos" aria-label="Quitar '+esc(item.palabra)+' de favoritos">★</button>':'')+
      '</article>';
  }

  function resumenSmart(){
    const prog=progreso().filter(x=>x&&x.palabra);
    const ultima=prog.slice().sort((a,b)=>(Number(b.ultimaVez)||0)-(Number(a.ultimaVez)||0))[0]||null;
    const reco=sugerencia();
    return '<div class="mi-lsp-smart">'+
      '<div class="mi-lsp-stats"><span><b>'+favoritos().length+'</b> favoritos</span><span><b>'+historial().length+'</b> recientes</span><span><b>'+prog.length+'</b> exploradas</span></div>'+
      '<div class="mi-lsp-smart-actions">'+
      (ultima?'<button type="button" class="mi-lsp-continue" data-ref="'+esc(ultima.referencia||ultima.palabra)+'" data-fuente="'+esc(ultima.fuente||'diccionario')+'"><span>▶</span><span><small>Continuar</small><b>'+esc(ultima.palabra)+'</b></span></button>':'')+
      (reco?'<button type="button" class="mi-lsp-reco" data-ref="'+esc(reco.referencia)+'" data-fuente="'+esc(reco.fuente)+'"><span>✨</span><span><small>Sugerencia para ti</small><b>'+esc(reco.palabra)+'</b></span></button>':'')+
      '</div></div>';
  }

  function pintar(){
    if(!panel||!cuerpo)return;
    const lista=filtrar(listaActual());
    $$('.mi-lsp-tab',panel).forEach(b=>b.classList.toggle('active',b.dataset.tab===tabActual));
    const titulo=tabActual==='favoritos'?'Tus favoritos':tabActual==='recientes'?'Vistos recientemente':'Más consultadas';
    cuerpo.innerHTML='<div class="mi-lsp-list-head"><strong>'+titulo+'</strong><span>'+lista.length+(lista.length===1?' elemento':' elementos')+'</span></div>'+
      (lista.length?'<div class="mi-lsp-grid">'+lista.map(x=>tarjeta(x,tabActual==='favoritos')).join('')+'</div>':'<div class="mi-lsp-empty"><span>'+(tabActual==='favoritos'?'☆':tabActual==='recientes'?'🕒':'📊')+'</span><b>'+ (tabActual==='favoritos'?'Todavía no guardaste favoritos':tabActual==='recientes'?'Todavía no hay actividad reciente':'Aún no hay suficientes visitas') +'</b><small>'+ (tabActual==='favoritos'?'Marca con estrella las palabras que quieras guardar.':tabActual==='recientes'?'Abre palabras y aparecerán aquí.':'Las palabras que más consultes aparecerán primero.') +'</small></div>');
    const smart=$('.mi-lsp-smart-wrap',panel);if(smart)smart.innerHTML=resumenSmart();
  }

  function quitarFavorito(ref){
    const n=norm(ref);const nuevo=favoritos().filter(x=>norm(x)!==n);try{localStorage.setItem(CLAVE_FAVORITOS,JSON.stringify(nuevo));}catch(_e){}pintar();
  }
  function limpiarHistorial(){
    if(!historial().length)return;
    if(!confirm('¿Borrar todo el historial reciente de este dispositivo?'))return;
    try{localStorage.setItem(CLAVE_HISTORIAL,'[]');}catch(_e){}
    if(typeof window.renderizarListaHistorial==='function'){try{window.renderizarListaHistorial();}catch(_e){}}
    pintar();
  }

  function asegurarEstilos(){
    if($('#miLspediaCss'))return;
    const s=document.createElement('style');s.id='miLspediaCss';s.textContent=`
    .lsp-mi-legacy-hidden{display:none!important}
    #miLspediaHub{margin:28px 0 34px;padding:0;border-radius:30px;background:linear-gradient(145deg,#f8fbff 0%,#eef5ff 55%,#fffaf0 100%);border:1px solid rgba(113,153,220,.22);box-shadow:0 18px 52px rgba(30,64,175,.08),inset 0 1px 0 #fff;overflow:hidden;color:#172554}
    .mi-lsp-head{display:flex;align-items:center;gap:13px;padding:20px 22px 13px}.mi-lsp-icon{width:46px;height:46px;border-radius:16px;display:grid;place-items:center;font-size:23px;background:linear-gradient(145deg,#fff8d7,#ffd85a);box-shadow:0 9px 22px rgba(181,134,0,.14)}.mi-lsp-title{min-width:0}.mi-lsp-title h2{margin:0;font-size:1.12rem;font-weight:900;color:#172554}.mi-lsp-title p{margin:3px 0 0;font-size:.76rem;color:#64748b}.mi-lsp-collapse{margin-left:auto;width:38px;height:38px;border:1px solid #d8e5f4;border-radius:13px;background:#fff;color:#31507d;font-size:18px;cursor:pointer}
    .mi-lsp-body{padding:0 22px 22px}.mi-lsp-smart{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.9fr);gap:14px;margin-bottom:15px}.mi-lsp-stats{display:flex;gap:8px;flex-wrap:wrap;align-content:flex-start}.mi-lsp-stats span{padding:9px 12px;border-radius:999px;background:rgba(255,255,255,.75);border:1px solid #dce8f5;font-size:.72rem;color:#60738a}.mi-lsp-stats b{color:#174ea6;font-size:.86rem}.mi-lsp-smart-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mi-lsp-continue,.mi-lsp-reco{display:flex;align-items:center;gap:10px;text-align:left;border:0;border-radius:17px;padding:10px 12px;cursor:pointer;font:inherit}.mi-lsp-continue{background:linear-gradient(135deg,#143f85,#2563eb);color:#fff;box-shadow:0 10px 22px rgba(37,99,235,.18)}.mi-lsp-reco{background:linear-gradient(135deg,#fff8d6,#ffe78a);color:#654700;border:1px solid rgba(210,160,0,.18)}.mi-lsp-smart-actions small{display:block;font-size:.60rem;opacity:.78}.mi-lsp-smart-actions b{display:block;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
    .mi-lsp-toolbar{display:grid;grid-template-columns:auto minmax(180px,1fr) auto;gap:10px;align-items:center;margin-bottom:12px}.mi-lsp-tabs{display:flex;gap:5px;padding:4px;background:rgba(255,255,255,.66);border:1px solid #dbe7f3;border-radius:16px}.mi-lsp-tab{border:0;background:transparent;border-radius:12px;padding:8px 11px;font:inherit;font-size:.71rem;font-weight:800;color:#64748b;cursor:pointer}.mi-lsp-tab.active{background:#fff;color:#1858b6;box-shadow:0 5px 14px rgba(29,78,216,.10)}.mi-lsp-search{width:100%;height:40px;border:1px solid #d6e3f0;border-radius:14px;padding:0 13px;background:rgba(255,255,255,.88);font:inherit;font-size:.78rem;color:#1e293b;outline:none}.mi-lsp-search:focus{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(59,130,246,.10)}.mi-lsp-clear{border:1px solid #e3dce9;background:#fff;color:#7c3aed;border-radius:14px;height:40px;padding:0 12px;font:inherit;font-size:.69rem;font-weight:800;cursor:pointer}
    .mi-lsp-list-head{display:flex;align-items:center;justify-content:space-between;margin:8px 1px 9px}.mi-lsp-list-head strong{font-size:.78rem;color:#334155}.mi-lsp-list-head span{font-size:.65rem;color:#94a3b8}.mi-lsp-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.mi-lsp-card{position:relative;border-radius:18px;background:rgba(255,255,255,.90);border:1px solid #dfe8f2;box-shadow:0 7px 18px rgba(15,23,42,.045);overflow:hidden;transition:transform .18s ease,box-shadow .18s ease}.mi-lsp-card:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(15,23,42,.08)}.mi-lsp-open{width:100%;display:flex;align-items:center;gap:9px;padding:9px 34px 9px 9px;border:0;background:transparent;text-align:left;font:inherit;color:inherit;cursor:pointer}.mi-lsp-thumb{width:40px;height:40px;flex:0 0 40px;border-radius:13px;background:#eff5fc;display:grid;place-items:center;overflow:hidden;font-size:19px}.mi-lsp-thumb img{width:100%;height:100%;object-fit:cover}.mi-lsp-card-main{min-width:0;display:block}.mi-lsp-card-main strong{display:block;font-size:.76rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mi-lsp-card-main small{display:block;margin-top:3px;font-size:.56rem;color:#7b8a9d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mi-lsp-card-main small b{color:#2776b8}.mi-lsp-arrow{margin-left:auto;font-size:22px;color:#9fb0c4}.mi-lsp-remove{position:absolute;right:7px;top:7px;width:27px;height:27px;border:0;border-radius:9px;background:#fff7cf;color:#d79c00;cursor:pointer}.mi-lsp-empty{padding:27px 15px;text-align:center;border:1px dashed #d6e3f0;border-radius:20px;background:rgba(255,255,255,.48)}.mi-lsp-empty>span{display:block;font-size:27px;margin-bottom:5px}.mi-lsp-empty b{display:block;font-size:.80rem;color:#475569}.mi-lsp-empty small{display:block;margin-top:4px;color:#94a3b8;font-size:.68rem}
    #miLspediaHub.mi-lsp-collapsed .mi-lsp-body{display:none}.mi-lsp-collapsed{box-shadow:0 10px 28px rgba(30,64,175,.06)!important}
    @media(max-width:900px){#miLspediaHub{margin:20px 0 26px;border-radius:24px}.mi-lsp-head{padding:16px 15px 11px}.mi-lsp-body{padding:0 15px 16px}.mi-lsp-smart{grid-template-columns:1fr}.mi-lsp-toolbar{grid-template-columns:1fr auto}.mi-lsp-tabs{grid-column:1/-1;overflow:auto}.mi-lsp-search{grid-column:1}.mi-lsp-clear{grid-column:2}.mi-lsp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mi-lsp-title p{font-size:.68rem}}
    @media(max-width:520px){.mi-lsp-smart-actions{grid-template-columns:1fr}.mi-lsp-stats span{padding:7px 10px;font-size:.64rem}.mi-lsp-tab{padding:7px 9px;font-size:.65rem}.mi-lsp-grid{grid-template-columns:1fr}.mi-lsp-card-main strong{font-size:.73rem}.mi-lsp-open{padding-top:8px;padding-bottom:8px}.mi-lsp-thumb{width:36px;height:36px;flex-basis:36px}}
    `;document.head.appendChild(s);
  }

  function crearPanel(){
    if($('#miLspediaHub'))return $('#miLspediaHub');
    const fav=$('#seccionFavoritos'),hist=$('#seccionHistorial');
    if(!fav||!hist||!fav.parentNode)return null;
    asegurarEstilos();
    const sec=document.createElement('section');sec.id='miLspediaHub';sec.setAttribute('aria-label','Mi LSPedia');
    sec.innerHTML='<div class="mi-lsp-head"><div class="mi-lsp-icon">⭐</div><div class="mi-lsp-title"><h2>Mi LSPedia</h2><p>Favoritos, actividad y sugerencias · guardado solo en este dispositivo</p></div><button type="button" class="mi-lsp-collapse" aria-label="Contraer Mi LSPedia" aria-expanded="true">⌃</button></div><div class="mi-lsp-body"><div class="mi-lsp-smart-wrap"></div><div class="mi-lsp-toolbar"><div class="mi-lsp-tabs"><button type="button" class="mi-lsp-tab active" data-tab="favoritos">⭐ Favoritos</button><button type="button" class="mi-lsp-tab" data-tab="recientes">🕒 Recientes</button><button type="button" class="mi-lsp-tab" data-tab="frecuentes">📊 Frecuentes</button></div><input class="mi-lsp-search" type="search" placeholder="Buscar en Mi LSPedia" aria-label="Buscar en Mi LSPedia"><button type="button" class="mi-lsp-clear">Borrar historial</button></div><div class="mi-lsp-content"></div></div>';
    fav.parentNode.insertBefore(sec,fav);fav.classList.add('lsp-mi-legacy-hidden');hist.classList.add('lsp-mi-legacy-hidden');
    panel=sec;cuerpo=$('.mi-lsp-content',sec);
    sec.addEventListener('click',e=>{
      const tab=e.target.closest('.mi-lsp-tab');if(tab){tabActual=tab.dataset.tab;pintar();return;}
      if(e.target.closest('.mi-lsp-collapse')){ocultoManual=!ocultoManual;sec.classList.toggle('mi-lsp-collapsed',ocultoManual);const b=$('.mi-lsp-collapse',sec);b.textContent=ocultoManual?'⌄':'⌃';b.setAttribute('aria-expanded',ocultoManual?'false':'true');return;}
      if(e.target.closest('.mi-lsp-clear')){limpiarHistorial();return;}
      const rem=e.target.closest('.mi-lsp-remove');if(rem){const card=rem.closest('.mi-lsp-card');quitarFavorito(card&&card.dataset.ref);return;}
      const abrirBtn=e.target.closest('.mi-lsp-open,.mi-lsp-continue,.mi-lsp-reco');if(abrirBtn){const card=abrirBtn.closest('[data-ref]')||abrirBtn;abrir(resolver(card.dataset.ref,card.dataset.fuente)||{fuente:card.dataset.fuente,referencia:card.dataset.ref,palabra:card.dataset.ref});}
    });
    $('.mi-lsp-search',sec).addEventListener('input',e=>{consulta=e.target.value||'';pintar();});
    return sec;
  }

  function visibleSegunVista(){
    if(!panel)return;
    const herramientas=$('#btnHerramientas'),nosotros=$('#btnNosotros');
    const ocultar=(herramientas&&herramientas.classList.contains('active'))||(nosotros&&nosotros.classList.contains('active'));
    panel.style.display=ocultar?'none':'';
  }

  function refrescar(){
    try{if(!panel)crearPanel();if(!panel)return;pintar();visibleSegunVista();}catch(error){console.warn('[Mi LSPedia] No se pudo actualizar:',error);}
  }

  function envolver(nombre){
    const fn=window[nombre];if(typeof fn!=='function'||fn.__miLspediaWrapped)return;
    const nuevo=function(){const r=fn.apply(this,arguments);setTimeout(refrescar,0);return r;};
    nuevo.__miLspediaWrapped=true;try{window[nombre]=nuevo;}catch(_e){}
  }
  function conectar(){['alternarFavorito','agregarAHistorial','borrarHistorial','registrarProgresoPalabra'].forEach(envolver);}

  function iniciar(){
    try{
      crearPanel();conectar();refrescar();
      ['btnInicio','btnCategorias','btnHerramientas','btnNosotros'].forEach(id=>{const b=$('#'+id);if(b)b.addEventListener('click',()=>setTimeout(()=>{visibleSegunVista();refrescar();},60));});
      window.addEventListener('storage',e=>{if([CLAVE_FAVORITOS,CLAVE_HISTORIAL,CLAVE_PROGRESO].includes(e.key))refrescar();});
      [500,1400,3000].forEach(ms=>setTimeout(()=>{conectar();refrescar();},ms));
    }catch(error){console.warn('[Mi LSPedia] Inicio seguro cancelado:',error);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
  window.LSPediaMi={refrescar,mostrar:function(){if(panel){panel.style.display='';panel.classList.remove('mi-lsp-collapsed');ocultoManual=false;panel.scrollIntoView({behavior:'smooth',block:'start'});}}};
})();