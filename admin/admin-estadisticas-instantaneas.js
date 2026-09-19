/* LSPedia Admin — Estadísticas instantáneas dentro del Inicio.
   Reutiliza la caché que el dashboard ya cargó desde GA4 para evitar una
   segunda consulta y una navegación completa a busquedas.html. */
(function(){
  'use strict';
  if(window.__lspediaStatsInstantaneas)return;
  window.__lspediaStatsInstantaneas=true;

  const CACHE_PREFIX='lspedia_admin_home_cache_v2_';
  const CACHE_TTL=5*60*1000;
  const $=id=>document.getElementById(id);
  const fmt=v=>new Intl.NumberFormat('es-PE').format(Number(v)||0);
  const pct=v=>new Intl.NumberFormat('es-PE',{style:'percent',maximumFractionDigits:1}).format(Number(v)||0);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labelPeriodo=p=>p==='7'?'Últimos 7 días':p==='todo'?'Desde el inicio':'Últimos 30 días';
  let periodo='30';

  function leer(period){
    try{
      const r=JSON.parse(sessionStorage.getItem(CACHE_PREFIX+period)||'null');
      if(r&&r.ts&&r.data&&Date.now()-r.ts<CACHE_TTL)return r.data;
    }catch(_e){}
    return null;
  }

  function estilos(){
    if($('lspStatsInstantStyles'))return;
    const s=document.createElement('style');s.id='lspStatsInstantStyles';
    s.textContent=`
      .stats-instant{display:none}.stats-instant.active{display:block}
      .stats-instant .stats-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px}
      .stats-instant h1{margin:0 0 6px;font-size:clamp(1.65rem,4vw,2.2rem)}
      .stats-instant p{margin:0;color:#64748b;line-height:1.45}
      .stats-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.stats-toolbar button{border:1px solid #d7e0ea;background:#fff;color:#475569;border-radius:10px;padding:9px 11px;font-weight:800;font-size:12px}.stats-toolbar button.active{background:#0f172a;color:#fff;border-color:#0f172a}
      .stats-fast-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.stats-fast-card{padding:15px}.stats-fast-card span{display:block;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.stats-fast-card strong{display:block;font-size:28px;margin-top:6px}.stats-fast-card small{display:block;color:#7b8898;margin-top:4px}
      .stats-fast-section{margin-top:22px}.stats-fast-section h2{margin:0 0 10px;font-size:18px}.stats-fast-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.stats-fast-panel{padding:16px}.stats-fast-panel h3{margin:0 0 12px;font-size:15px}
      .stats-fast-list{display:grid;gap:9px}.stats-fast-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.stats-fast-name{font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stats-fast-meta{font-size:10px;color:#64748b;margin-top:2px}.stats-fast-value{font-weight:900;font-size:13px}.stats-fast-track{height:5px;background:#edf2f7;border-radius:999px;overflow:hidden;margin-top:5px}.stats-fast-track span{display:block;height:100%;background:#0284c7;border-radius:999px}
      .stats-fast-bars{display:flex;align-items:flex-end;gap:4px;height:160px;border-bottom:1px solid #e5eaf0;padding-top:8px}.stats-fast-barcol{flex:1;min-width:3px;height:100%;display:flex;align-items:flex-end}.stats-fast-bar{width:100%;min-height:2px;background:linear-gradient(180deg,#38a8df,#0284c7);border-radius:4px 4px 0 0}
      .stats-fast-notice{padding:14px;border:1px solid #c9e8fb;background:#eef8ff;color:#175979;border-radius:12px;font-size:12px}.stats-fast-back{margin-top:18px}
      @media(max-width:820px){.stats-fast-grid{grid-template-columns:1fr 1fr}.stats-fast-grid2{grid-template-columns:1fr}.stats-instant .stats-hero{align-items:flex-start;flex-direction:column}}
      @media(max-width:520px){.stats-fast-grid{grid-template-columns:1fr 1fr;gap:8px}.stats-fast-card{padding:12px}.stats-fast-card strong{font-size:23px}}
    `;
    document.head.appendChild(s);
  }

  function lista(items,nameKey,valueKey,meta){
    const rows=Array.isArray(items)?items:[];
    if(!rows.length)return '<div class="stats-fast-notice">Sin datos para este periodo.</div>';
    const max=Math.max(1,...rows.map(x=>Number(x[valueKey])||0));
    return '<div class="stats-fast-list">'+rows.slice(0,10).map(x=>{const n=Number(x[valueKey])||0;return '<div class="stats-fast-row"><div><div class="stats-fast-name" title="'+esc(x[nameKey]||'—')+'">'+esc(x[nameKey]||'—')+'</div><div class="stats-fast-meta">'+esc(meta?meta(x):'')+'</div><div class="stats-fast-track"><span style="width:'+Math.max(3,(n/max)*100).toFixed(1)+'%"></span></div></div><div class="stats-fast-value">'+fmt(n)+'</div></div>';}).join('')+'</div>';
  }

  function barras(serie){
    const rows=Array.isArray(serie)?serie:[];if(!rows.length)return '<div class="stats-fast-notice">Sin actividad diaria disponible.</div>';
    const max=Math.max(1,...rows.map(x=>Number(x.sesiones)||0));
    const step=rows.length>45?Math.ceil(rows.length/30):1;
    const r=rows.filter((_,i)=>i%step===0||i===rows.length-1);
    return '<div class="stats-fast-bars">'+r.map(x=>'<div class="stats-fast-barcol" title="'+esc(String(x.fecha||''))+': '+fmt(x.sesiones)+' sesiones"><div class="stats-fast-bar" style="height:'+Math.max(2,((Number(x.sesiones)||0)/max)*145).toFixed(1)+'px"></div></div>').join('')+'</div>';
  }

  function crearPanel(){
    if($('statsInstant'))return $('statsInstant');
    const main=document.querySelector('main');
    const sec=document.createElement('section');sec.id='statsInstant';sec.className='stats-instant';
    sec.innerHTML='<div class="stats-hero"><div><div class="eyebrow">ANALYTICS</div><h1>Estadísticas de LSPedia</h1><p>Usa los datos que el Admin ya cargó. Cambiar de sección no vuelve a consultar Google Analytics.</p></div><div class="stats-toolbar"><button type="button" data-stats-period="7">7 días</button><button type="button" data-stats-period="30" class="active">30 días</button><button type="button" data-stats-period="todo">Desde inicio</button></div></div><div id="statsInstantBody"></div><button id="statsBackHome" class="btn btn-soft stats-fast-back" type="button">← Volver a Inicio</button>';
    main.appendChild(sec);
    sec.querySelectorAll('[data-stats-period]').forEach(b=>b.addEventListener('click',()=>{periodo=b.dataset.statsPeriod||'30';sec.querySelectorAll('[data-stats-period]').forEach(x=>x.classList.toggle('active',x===b));render();}));
    $('statsBackHome').addEventListener('click',mostrarInicio);
    return sec;
  }

  function render(){
    const data=leer(periodo),body=$('statsInstantBody');if(!body)return;
    if(!data){body.innerHTML='<div class="stats-fast-notice">Este periodo todavía no está en la caché del Admin. Vuelve a Inicio y espera unos segundos a que termine de cargar.</div>';return;}
    const r=data.resumen||{},rt=data.realtime||{},err=data.errores||{},missing=data.busquedasSinResultadoPorSeccion||data.busquedas||{};
    body.innerHTML='<div class="stats-fast-grid">'
      +'<article class="card stats-fast-card"><span>Usuarios</span><strong>'+fmt(r.usuarios)+'</strong><small>'+labelPeriodo(periodo)+'</small></article>'
      +'<article class="card stats-fast-card"><span>Visitas</span><strong>'+fmt(r.sesiones)+'</strong><small>Sesiones</small></article>'
      +'<article class="card stats-fast-card"><span>Páginas vistas</span><strong>'+fmt(r.vistas)+'</strong><small>Incluye repetidas</small></article>'
      +'<article class="card stats-fast-card"><span>Interacción</span><strong>'+pct(r.tasaInteraccion)+'</strong><small>'+fmt(r.sesionesConInteraccion)+' sesiones activas</small></article>'
      +'<article class="card stats-fast-card"><span>Activos ahora</span><strong>'+fmt(rt.activos)+'</strong><small>Últimos 30 min</small></article>'
      +'<article class="card stats-fast-card"><span>Eventos</span><strong>'+fmt(r.eventos)+'</strong><small>'+fmt(rt.eventos)+' realtime</small></article>'
      +'<article class="card stats-fast-card"><span>Sin resultado</span><strong>'+fmt(missing.totalBusquedas)+'</strong><small>'+fmt(missing.totalTerminos)+' términos</small></article>'
      +'<article class="card stats-fast-card"><span>Errores técnicos</span><strong>'+fmt(err.total)+'</strong><small>'+fmt(err.imagen)+' imagen · '+fmt(err.media)+' media</small></article>'
      +'</div>'
      +'<section class="stats-fast-section"><h2>Actividad diaria</h2><article class="card stats-fast-panel">'+barras(data.serie)+'</article></section>'
      +'<section class="stats-fast-section"><div class="stats-fast-grid2"><article class="card stats-fast-panel"><h3>Dispositivos · realtime</h3>'+lista(rt.dispositivos,'dispositivo','usuarios',()=> 'Usuarios activos')+'</article><article class="card stats-fast-panel"><h3>Fuentes de tráfico</h3>'+lista(data.fuentes,'fuente','sesiones',x=>(x.medio||'—')+(x.canal?' · '+x.canal:''))+'</article></div></section>'
      +'<section class="stats-fast-section"><div class="stats-fast-grid2"><article class="card stats-fast-panel"><h3>Páginas más vistas</h3>'+lista(data.paginas,'pagina','vistas',x=>fmt(x.usuarios)+' usuarios')+'</article><article class="card stats-fast-panel"><h3>Países</h3>'+lista(data.paises,'pais','usuarios',x=>fmt(x.sesiones)+' sesiones')+'</article></div></section>'
      +'<section class="stats-fast-section"><div class="stats-fast-grid2"><article class="card stats-fast-panel"><h3>Ciudades</h3>'+lista(data.ciudades,'ciudad','usuarios',x=>(x.pais||'—')+' · '+fmt(x.sesiones)+' sesiones')+'</article><article class="card stats-fast-panel"><h3>Eventos principales</h3>'+lista(data.eventos,'evento','eventos',x=>fmt(x.usuarios)+' usuarios')+'</article></div></section>';
  }

  function activarNavStats(on){
    document.querySelectorAll('.admin-nav a,.mobile-nav a').forEach(a=>{
      const isStats=(a.getAttribute('href')||'').includes('estadisticas');
      const isHome=(a.getAttribute('href')||'')==='./';
      if(isStats)a.classList.toggle('active',on);
      if(isHome)a.classList.toggle('active',!on);
    });
  }

  function mostrarStats(ev){if(ev)ev.preventDefault();const dash=$('dashboard');if(dash)dash.style.display='none';const sec=crearPanel();sec.classList.add('active');activarNavStats(true);render();if(location.hash!=='#estadisticas')history.replaceState(null,'','#estadisticas');window.scrollTo({top:0,behavior:'instant'});}
  function mostrarInicio(){const dash=$('dashboard');if(dash)dash.style.display='';const sec=$('statsInstant');if(sec)sec.classList.remove('active');activarNavStats(false);history.replaceState(null,'',location.pathname);window.scrollTo({top:0,behavior:'instant'});}

  function init(){
    estilos();crearPanel();
    document.querySelectorAll('a[href*="busquedas.html#estadisticas"],a[href="#estadisticas"]').forEach(a=>a.addEventListener('click',mostrarStats));
    if(location.hash==='#estadisticas')mostrarStats();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
