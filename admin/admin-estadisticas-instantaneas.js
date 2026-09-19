/* LSPedia Admin — vistas instantáneas de Búsquedas y Estadísticas.
   Objetivos:
   - Nunca navegar a busquedas.html desde Inicio: reutilizar lo ya cargado.
   - Mostrar Búsquedas aunque el histórico completo todavía esté en proceso.
   - Mostrar Estadísticas con el mejor periodo disponible en caché.
   - Evitar esqueletos eternos en "Búsquedas en tendencia".
*/
(function(){
  'use strict';
  if(window.__lspediaVistasInstantaneasV3)return;
  window.__lspediaVistasInstantaneasV3=true;

  const CACHE_PREFIX='lspedia_admin_home_cache_v2_';
  const STORE_PUBLISHER='lspedia_admin_publisher_url_v1';
  const $=id=>document.getElementById(id);
  const fmt=v=>new Intl.NumberFormat('es-PE').format(Number(v)||0);
  const fmtPct=v=>{const n=Number(v)||0;return (n>999?'>999':Math.round(n))+'%';};
  const pct=v=>new Intl.NumberFormat('es-PE',{style:'percent',maximumFractionDigits:1}).format(Number(v)||0);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('es-PE');
  const text=v=>String(v==null?'':v).trim();
  const labelPeriodo=p=>p==='7'?'Últimos 7 días':p==='todo'?'Desde el inicio':'Últimos 30 días';
  let vista='home',periodoStats='30',searchQuery='',searchFilter='pending',lastCacheSignature='';

  function leer(period){
    try{
      const r=JSON.parse(sessionStorage.getItem(CACHE_PREFIX+period)||'null');
      return r&&r.data?r.data:null;
    }catch(_e){return null;}
  }
  function mejorData(preferidos){for(const p of preferidos){const d=leer(p);if(d)return{data:d,period:p};}return null;}
  function cacheSignature(){
    try{return ['7','30','todo'].map(p=>{const r=JSON.parse(sessionStorage.getItem(CACHE_PREFIX+p)||'null');return p+':'+(r&&r.ts||0);}).join('|');}catch(_e){return'';}
  }

  function estilos(){
    if($('lspInstantViewsStyles'))return;
    const s=document.createElement('style');s.id='lspInstantViewsStyles';
    s.textContent=`
      .lsp-instant-view{display:none}.lsp-instant-view.active{display:block}
      .lsp-view-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px}.lsp-view-hero h1{margin:0 0 6px;font-size:clamp(1.65rem,4vw,2.2rem)}.lsp-view-hero p{margin:0;color:#64748b;line-height:1.45}
      .lsp-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.lsp-toolbar button{border:1px solid #d7e0ea;background:#fff;color:#475569;border-radius:10px;padding:9px 11px;font-weight:800;font-size:12px}.lsp-toolbar button.active{background:#0f172a;color:#fff;border-color:#0f172a}
      .lsp-fast-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.lsp-fast-card{padding:15px}.lsp-fast-card span{display:block;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.lsp-fast-card strong{display:block;font-size:28px;margin-top:6px}.lsp-fast-card small{display:block;color:#7b8898;margin-top:4px}
      .lsp-fast-section{margin-top:22px}.lsp-fast-section h2{margin:0 0 10px;font-size:18px}.lsp-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.lsp-panel{padding:16px}.lsp-panel h3{margin:0 0 12px;font-size:15px}
      .lsp-list{display:grid;gap:9px}.lsp-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.lsp-name{font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lsp-meta{font-size:10px;color:#64748b;margin-top:2px}.lsp-value{font-weight:900;font-size:13px}.lsp-track{height:5px;background:#edf2f7;border-radius:999px;overflow:hidden;margin-top:5px}.lsp-track span{display:block;height:100%;background:#0284c7;border-radius:999px}
      .lsp-bars{display:flex;align-items:flex-end;gap:4px;height:160px;border-bottom:1px solid #e5eaf0;padding-top:8px}.lsp-barcol{flex:1;min-width:3px;height:100%;display:flex;align-items:flex-end}.lsp-bar{width:100%;min-height:2px;background:linear-gradient(180deg,#38a8df,#0284c7);border-radius:4px 4px 0 0}
      .lsp-notice{padding:14px;border:1px solid #c9e8fb;background:#eef8ff;color:#175979;border-radius:12px;font-size:12px;line-height:1.45}.lsp-notice.warn{background:#fff8e6;border-color:#ffe2a3;color:#795600}.lsp-back{margin-top:18px}
      .lsp-search-tools{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:9px;margin-bottom:12px}.lsp-search-tools input{width:100%;border:1px solid #cfd8e4;border-radius:10px;padding:10px 12px;min-height:42px}.lsp-filter-group{display:flex;gap:6px}.lsp-filter-group button{border:1px solid #d7e0ea;background:#fff;border-radius:9px;padding:9px 11px;font-size:11px;font-weight:800}.lsp-filter-group button.active{background:#0f172a;color:#fff;border-color:#0f172a}
      .lsp-table-card{overflow:auto}.lsp-search-table{width:100%;border-collapse:collapse;min-width:720px}.lsp-search-table th{background:#f8fafc;color:#657386;font-size:10px;text-transform:uppercase;letter-spacing:.06em;text-align:left;padding:10px 12px;border-bottom:1px solid #e5eaf0}.lsp-search-table td{padding:11px 12px;border-bottom:1px solid #edf1f5;font-size:12px;vertical-align:middle}.lsp-search-table tr:last-child td{border-bottom:0}.lsp-chip{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;background:#fff6dd;color:#805b00}.lsp-create{border:1px solid #cde5f5;background:#eef8ff;color:#0f6fb0;border-radius:8px;padding:6px 8px;font-size:10px;font-weight:900}
      .lsp-trend-fallback{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.lsp-trend-fallback .card{padding:13px}.lsp-trend-word{font-weight:900;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lsp-trend-num{font-size:24px;font-weight:900;margin-top:7px}.lsp-trend-note{font-size:10px;color:#64748b;margin-top:3px}
      @media(max-width:820px){.lsp-fast-grid{grid-template-columns:1fr 1fr}.lsp-grid2{grid-template-columns:1fr}.lsp-view-hero{align-items:flex-start;flex-direction:column}.lsp-trend-fallback{grid-template-columns:1fr 1fr}}
      @media(max-width:560px){.lsp-fast-grid{grid-template-columns:1fr 1fr;gap:8px}.lsp-fast-card{padding:12px}.lsp-fast-card strong{font-size:23px}.lsp-search-tools{grid-template-columns:1fr}.lsp-filter-group{overflow:auto}.lsp-trend-fallback{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function lista(items,nameKey,valueKey,meta){
    const rows=Array.isArray(items)?items:[];
    if(!rows.length)return '<div class="lsp-notice">Sin datos para este periodo.</div>';
    const max=Math.max(1,...rows.map(x=>Number(x[valueKey])||0));
    return '<div class="lsp-list">'+rows.slice(0,10).map(x=>{const n=Number(x[valueKey])||0;return '<div class="lsp-row"><div><div class="lsp-name" title="'+esc(x[nameKey]||'—')+'">'+esc(x[nameKey]||'—')+'</div><div class="lsp-meta">'+esc(meta?meta(x):'')+'</div><div class="lsp-track"><span style="width:'+Math.max(3,(n/max)*100).toFixed(1)+'%"></span></div></div><div class="lsp-value">'+fmt(n)+'</div></div>';}).join('')+'</div>';
  }

  function barras(serie){
    const rows=Array.isArray(serie)?serie:[];if(!rows.length)return '<div class="lsp-notice">Sin actividad diaria disponible.</div>';
    const max=Math.max(1,...rows.map(x=>Number(x.sesiones)||0));
    const step=rows.length>45?Math.ceil(rows.length/30):1;
    const r=rows.filter((_,i)=>i%step===0||i===rows.length-1);
    return '<div class="lsp-bars">'+r.map(x=>'<div class="lsp-barcol" title="'+esc(String(x.fecha||''))+': '+fmt(x.sesiones)+' sesiones"><div class="lsp-bar" style="height:'+Math.max(2,((Number(x.sesiones)||0)/max)*145).toFixed(1)+'px"></div></div>').join('')+'</div>';
  }

  function crearStats(){
    if($('statsInstant'))return $('statsInstant');
    const sec=document.createElement('section');sec.id='statsInstant';sec.className='lsp-instant-view';
    sec.innerHTML='<div class="lsp-view-hero"><div><div class="eyebrow">ANALYTICS</div><h1>Estadísticas de LSPedia</h1><p>Usa los datos ya cargados por el Admin. Cambiar de sección no reinicia Google Analytics.</p></div><div class="lsp-toolbar"><button type="button" data-stats-period="7">7 días</button><button type="button" data-stats-period="30" class="active">30 días</button><button type="button" data-stats-period="todo">Desde inicio</button></div></div><div id="statsInstantBody"></div><button class="btn btn-soft lsp-back" type="button" data-go-home>← Volver a Inicio</button>';
    document.querySelector('main').appendChild(sec);
    sec.querySelectorAll('[data-stats-period]').forEach(b=>b.addEventListener('click',()=>{periodoStats=b.dataset.statsPeriod||'30';sec.querySelectorAll('[data-stats-period]').forEach(x=>x.classList.toggle('active',x===b));renderStats();}));
    return sec;
  }

  function renderStats(){
    const body=$('statsInstantBody');if(!body)return;
    const exact=leer(periodoStats),fallback=mejorData(periodoStats==='30'?['7','todo']:periodoStats==='todo'?['30','7']:['30','todo']);
    const data=exact||(fallback&&fallback.data);
    if(!data){body.innerHTML='<div class="lsp-notice warn">Los datos todavía están llegando. No se hará otra consulta: esta vista se actualizará automáticamente cuando termine la carga de Inicio.</div>';return;}
    const usedPeriod=exact?periodoStats:fallback.period;
    const r=data.resumen||{},rt=data.realtime||{},err=data.errores||{},missing=data.busquedasSinResultadoPorSeccion||data.busquedas||{};
    const aviso=usedPeriod!==periodoStats?'<div class="lsp-notice warn" style="margin-bottom:12px">Mostrando temporalmente '+labelPeriodo(usedPeriod).toLowerCase()+' mientras termina de cargarse '+labelPeriodo(periodoStats).toLowerCase()+'.</div>':'';
    body.innerHTML=aviso+'<div class="lsp-fast-grid">'
      +'<article class="card lsp-fast-card"><span>Usuarios</span><strong>'+fmt(r.usuarios)+'</strong><small>'+labelPeriodo(usedPeriod)+'</small></article>'
      +'<article class="card lsp-fast-card"><span>Visitas</span><strong>'+fmt(r.sesiones)+'</strong><small>Sesiones</small></article>'
      +'<article class="card lsp-fast-card"><span>Páginas vistas</span><strong>'+fmt(r.vistas)+'</strong><small>Incluye repetidas</small></article>'
      +'<article class="card lsp-fast-card"><span>Interacción</span><strong>'+pct(r.tasaInteraccion)+'</strong><small>'+fmt(r.sesionesConInteraccion)+' sesiones activas</small></article>'
      +'<article class="card lsp-fast-card"><span>Activos ahora</span><strong>'+fmt(rt.activos)+'</strong><small>Últimos 30 min</small></article>'
      +'<article class="card lsp-fast-card"><span>Eventos</span><strong>'+fmt(r.eventos)+'</strong><small>'+fmt(rt.eventos)+' realtime</small></article>'
      +'<article class="card lsp-fast-card"><span>Sin resultado</span><strong>'+fmt(missing.totalBusquedas)+'</strong><small>'+fmt(missing.totalTerminos)+' términos</small></article>'
      +'<article class="card lsp-fast-card"><span>Errores técnicos</span><strong>'+fmt(err.total)+'</strong><small>'+fmt(err.imagen)+' imagen · '+fmt(err.media)+' media</small></article>'
      +'</div>'
      +'<section class="lsp-fast-section"><h2>Actividad diaria</h2><article class="card lsp-panel">'+barras(data.serie)+'</article></section>'
      +'<section class="lsp-fast-section"><div class="lsp-grid2"><article class="card lsp-panel"><h3>Dispositivos · realtime</h3>'+lista(rt.dispositivos,'dispositivo','usuarios',()=> 'Usuarios activos')+'</article><article class="card lsp-panel"><h3>Fuentes de tráfico</h3>'+lista(data.fuentes,'fuente','sesiones',x=>(x.medio||'—')+(x.canal?' · '+x.canal:''))+'</article></div></section>'
      +'<section class="lsp-fast-section"><div class="lsp-grid2"><article class="card lsp-panel"><h3>Páginas más vistas</h3>'+lista(data.paginas,'pagina','vistas',x=>fmt(x.usuarios)+' usuarios')+'</article><article class="card lsp-panel"><h3>Países</h3>'+lista(data.paises,'pais','usuarios',x=>fmt(x.sesiones)+' sesiones')+'</article></div></section>'
      +'<section class="lsp-fast-section"><div class="lsp-grid2"><article class="card lsp-panel"><h3>Ciudades</h3>'+lista(data.ciudades,'ciudad','usuarios',x=>(x.pais||'—')+' · '+fmt(x.sesiones)+' sesiones')+'</article><article class="card lsp-panel"><h3>Eventos principales</h3>'+lista(data.eventos,'evento','eventos',x=>fmt(x.usuarios)+' usuarios')+'</article></div></section>';
  }

  function searchRows(data){
    const src=(data&&data.busquedasSinResultadoPorSeccion&&data.busquedasSinResultadoPorSeccion.items)||((data&&data.busquedas&&data.busquedas.items)||[]);
    return (Array.isArray(src)?src:[]).map(x=>({termino:text(x.termino),seccion:text(x.seccion)||'—',busquedas:Number(x.busquedas)||0,ultimaFecha:text(x.ultimaFecha)})).filter(x=>x.termino).sort((a,b)=>b.busquedas-a.busquedas||String(b.ultimaFecha).localeCompare(String(a.ultimaFecha)));
  }

  function crearBusquedas(){
    if($('searchInstant'))return $('searchInstant');
    const sec=document.createElement('section');sec.id='searchInstant';sec.className='lsp-instant-view';
    sec.innerHTML='<div class="lsp-view-hero"><div><div class="eyebrow">DEMANDA</div><h1>Búsquedas de LSPedia</h1><p>Consulta las palabras sin resultado usando los datos que ya cargó Inicio.</p></div></div><div id="searchInstantNotice"></div><div class="lsp-search-tools"><input id="instantSearchInput" type="search" placeholder="Filtrar palabra o sección…"><div class="lsp-filter-group"><button class="active" type="button" data-search-filter="pending">Pendientes</button><button type="button" data-search-filter="all">Todas</button></div></div><div id="searchInstantBody" class="card lsp-table-card"></div><button class="btn btn-soft lsp-back" type="button" data-go-home>← Volver a Inicio</button>';
    document.querySelector('main').appendChild(sec);
    $('instantSearchInput').addEventListener('input',()=>{searchQuery=$('instantSearchInput').value;renderBusquedas();});
    sec.querySelectorAll('[data-search-filter]').forEach(b=>b.addEventListener('click',()=>{searchFilter=b.dataset.searchFilter||'pending';sec.querySelectorAll('[data-search-filter]').forEach(x=>x.classList.toggle('active',x===b));renderBusquedas();}));
    return sec;
  }

  async function abrirPublicador(term){
    let u=text(localStorage.getItem(STORE_PUBLISHER));
    if(!u){try{await navigator.clipboard.writeText(term);}catch(_e){};alert('Primero configura la URL privada del Publicador desde Inicio → ⚙ Publicador. La palabra quedó copiada.');return;}
    try{await navigator.clipboard.writeText(term);}catch(_e){}
    try{const x=new URL(u);x.searchParams.set('lsp_prefill',term);u=x.toString();}catch(_e){}
    window.open(u,'_blank','noopener');
  }

  function renderBusquedas(){
    const best=mejorData(['todo','30','7']),notice=$('searchInstantNotice'),body=$('searchInstantBody');if(!notice||!body)return;
    if(!best){notice.innerHTML='<div class="lsp-notice warn">Las búsquedas todavía están llegando. Esta vista se actualizará automáticamente sin volver a consultar Google Analytics.</div>';body.innerHTML='';return;}
    let rows=searchRows(best.data);const q=norm(searchQuery);if(q)rows=rows.filter(x=>norm(x.termino).includes(q)||norm(x.seccion).includes(q));
    notice.innerHTML=best.period!=='todo'?'<div class="lsp-notice warn" style="margin-bottom:12px">Mostrando '+labelPeriodo(best.period).toLowerCase()+' mientras termina de cargarse el historial completo. No necesitas esperar para usar el panel.</div>':'<div class="lsp-notice" style="margin-bottom:12px">Historial completo cargado: '+fmt(rows.length)+' términos visibles.</div>';
    if(!rows.length){body.innerHTML='<div class="lsp-notice">No hay búsquedas para este filtro.</div>';return;}
    const show=rows.slice(0,120);
    body.innerHTML='<table class="lsp-search-table"><thead><tr><th>#</th><th>Palabra</th><th>Sección</th><th>Búsquedas</th><th>Última</th><th></th></tr></thead><tbody>'+show.map((x,i)=>'<tr><td>'+(i+1)+'</td><td><strong>'+esc(x.termino)+'</strong></td><td><span class="lsp-chip">'+esc(x.seccion)+'</span></td><td><strong>'+fmt(x.busquedas)+'</strong></td><td>'+esc(x.ultimaFecha||'—')+'</td><td><button class="lsp-create" type="button" data-create="'+encodeURIComponent(x.termino)+'">➕ Crear</button></td></tr>').join('')+'</tbody></table>'+(rows.length>show.length?'<div class="lsp-notice" style="margin:12px">Mostrando las primeras '+fmt(show.length)+' de '+fmt(rows.length)+' coincidencias. Usa el buscador para encontrar una palabra específica.</div>':'');
    body.querySelectorAll('[data-create]').forEach(b=>b.addEventListener('click',()=>abrirPublicador(decodeURIComponent(b.dataset.create||''))));
  }

  function trendSource(data){
    const src=(data&&data.busquedasSinResultadoPorSeccion&&data.busquedasSinResultadoPorSeccion.items)||[];
    const map=new Map();
    (Array.isArray(src)?src:[]).forEach(x=>{const k=norm(x.termino);if(!k)return;const p=map.get(k)||{termino:text(x.termino),busquedas:0,secciones:new Set()};p.busquedas+=Number(x.busquedas)||0;if(x.seccion)p.secciones.add(text(x.seccion));map.set(k,p);});
    return map;
  }

  function repararTendencias(){
    const grid=$('trendGrid');if(!grid)return;
    const d7=leer('7');if(!d7)return;
    const d30=leer('30');const a=trendSource(d7),rows=[];
    if(d30){
      const b=trendSource(d30);
      a.forEach((x,k)=>{const total=(b.get(k)&&b.get(k).busquedas)||x.busquedas;const prev23=Math.max(0,total-x.busquedas);const expected=(prev23/23)*7;const growth=expected>0?((x.busquedas-expected)/expected)*100:(x.busquedas>1?999:0);rows.push({...x,growth});});
      rows.sort((x,y)=>y.growth-x.growth||y.busquedas-x.busquedas);
      grid.innerHTML=rows.slice(0,6).map((x,i)=>'<article class="card trend-card"><div class="trend-top"><div><div class="trend-rank">#'+(i+1)+'</div><div class="trend-word" title="'+esc(x.termino)+'">'+esc(x.termino)+'</div></div><span class="trend-badge '+(x.growth<0?'down':'')+'">'+(x.growth>=0?'↑ ':'↓ ')+fmtPct(Math.abs(x.growth))+'</span></div><div class="trend-meta"><b>'+fmt(x.busquedas)+'</b> búsquedas en 7 días · '+esc([...x.secciones].join(' / ')||'—')+'</div></article>').join('')||'<div class="alert-empty" style="grid-column:1/-1">No hay suficiente actividad reciente para calcular tendencias.</div>';
    }else{
      const simple=[...a.values()].sort((x,y)=>y.busquedas-x.busquedas).slice(0,6);
      grid.innerHTML=simple.length?'<div class="lsp-trend-fallback" style="grid-column:1/-1">'+simple.map(x=>'<article class="card"><div class="lsp-trend-word">'+esc(x.termino)+'</div><div class="lsp-trend-num">'+fmt(x.busquedas)+'</div><div class="lsp-trend-note">búsquedas en 7 días · comparación de 30 días aún cargando</div></article>').join('')+'</div>':'<div class="alert-empty" style="grid-column:1/-1">No hay actividad reciente suficiente.</div>';
    }
  }

  function activarNav(target){
    document.querySelectorAll('.admin-nav a,.mobile-nav a').forEach(a=>{
      const h=a.getAttribute('href')||'';const isHome=h==='./';const isSearch=h.includes('busquedas')&&!h.includes('estadisticas');const isStats=h.includes('estadisticas');
      a.classList.toggle('active',target==='home'?isHome:target==='busquedas'?isSearch:target==='estadisticas'?isStats:false);
    });
  }

  function mostrar(target,ev){
    if(ev){ev.preventDefault();ev.stopPropagation();}
    vista=target;
    const dash=$('dashboard'),stats=crearStats(),search=crearBusquedas();
    if(dash)dash.style.display=target==='home'?'':'none';
    stats.classList.toggle('active',target==='estadisticas');search.classList.toggle('active',target==='busquedas');
    activarNav(target);
    if(target==='estadisticas')renderStats();if(target==='busquedas')renderBusquedas();if(target==='home')repararTendencias();
    const hash=target==='home'?'':('#'+target);history.replaceState(null,'',location.pathname+hash);window.scrollTo({top:0,behavior:'auto'});
  }

  function interceptar(e){
    const a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;
    const h=a.getAttribute('href')||'';
    if(h==='./'||h===location.pathname||h==='#home'){mostrar('home',e);return;}
    if(h.includes('busquedas.html#estadisticas')||h==='#estadisticas'){mostrar('estadisticas',e);return;}
    if((h.includes('busquedas.html#busquedas'))||h==='#busquedas'){mostrar('busquedas',e);}
  }

  function refrescarDesdeCache(){
    repararTendencias();
    if(vista==='estadisticas')renderStats();
    if(vista==='busquedas')renderBusquedas();
  }

  function init(){
    estilos();crearStats();crearBusquedas();
    document.addEventListener('click',interceptar,true);
    document.querySelectorAll('[data-go-home]').forEach(b=>b.addEventListener('click',e=>mostrar('home',e)));
    const hash=location.hash;
    if(hash==='#estadisticas')mostrar('estadisticas');else if(hash==='#busquedas')mostrar('busquedas');else repararTendencias();
    lastCacheSignature=cacheSignature();
    let ticks=0;const timer=setInterval(()=>{ticks++;const sig=cacheSignature();if(sig!==lastCacheSignature){lastCacheSignature=sig;refrescarDesdeCache();}else if(ticks%4===0){repararTendencias();}if(ticks>150)clearInterval(timer);},800);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
