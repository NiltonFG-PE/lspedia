/* LSPedia Admin — vistas unificadas completas.
   Mantiene un solo menú y recupera las funciones completas de Búsquedas y Estadísticas
   sin navegar a un segundo panel. Reutiliza la caché del Inicio y solo consulta GA4
   cuando el periodo solicitado no está disponible o el usuario pulsa Actualizar. */
(function(){
  'use strict';
  if(window.__lspediaAdminVistasCompletasV4)return;
  window.__lspediaAdminVistasCompletasV4=true;

  const CACHE_PREFIX='lspedia_admin_home_cache_v2_';
  const STORE_URL='lspedia_admin_busquedas_api_v1';
  const SESSION_KEY='lspedia_admin_busquedas_key_v1';
  const STORE_ACCESS='lspedia_admin_access_v2';
  const STORE_PUBLISHER='lspedia_admin_publisher_url_v1';
  const $=id=>document.getElementById(id);
  const text=v=>String(v==null?'':v).trim();
  const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toLocaleLowerCase('es-PE').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>new Intl.NumberFormat('es-PE').format(Number(v)||0);
  const pct=v=>new Intl.NumberFormat('es-PE',{style:'percent',maximumFractionDigits:1}).format(Number(v)||0);
  const periodLabel=p=>({'7':'Últimos 7 días','30':'Últimos 30 días','90':'Últimos 90 días','365':'Último año','todo':'Desde el 10 sep 2026'})[p]||'Últimos 30 días';
  const state={view:'home',statsPeriod:'30',searchFilter:'pending',searchQuery:'',diagnostico:null,diagLoading:false,loadingPeriods:new Set(),mapReady:false,lastSig:''};

  function cacheRead(period){try{const r=JSON.parse(sessionStorage.getItem(CACHE_PREFIX+period)||'null');return r&&r.data?r.data:null;}catch(_e){return null;}}
  function cacheWrite(period,data){try{sessionStorage.setItem(CACHE_PREFIX+period,JSON.stringify({ts:Date.now(),data}));}catch(_e){}}
  function cacheSig(){try{return ['7','30','90','365','todo'].map(p=>{const r=JSON.parse(sessionStorage.getItem(CACHE_PREFIX+p)||'null');return p+':'+(r&&r.ts||0);}).join('|');}catch(_e){return'';}}
  function bestData(order){for(const p of order){const d=cacheRead(p);if(d)return{period:p,data:d};}return null;}

  function credentials(){
    let api='',key='';
    try{const r=JSON.parse(localStorage.getItem(STORE_ACCESS)||'null');if(r&&r.api&&r.key){api=text(r.api);key=text(r.key);}}catch(_e){}
    if(!api)try{api=text(localStorage.getItem(STORE_URL));}catch(_e){}
    if(!key)try{key=text(sessionStorage.getItem(SESSION_KEY));}catch(_e){}
    const apiEl=$('apiUrl'),keyEl=$('adminKey');
    if(apiEl&&text(apiEl.value))api=text(apiEl.value);
    if(keyEl&&text(keyEl.value))key=text(keyEl.value);
    return{api,key};
  }

  function requestJsonp(api,key,period){
    return new Promise((resolve,reject)=>{
      let u;try{u=new URL(api);}catch(_e){reject(new Error('URL de Apps Script inválida.'));return;}
      const cb='lspAdminUnified_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
      const s=document.createElement('script');let done=false,timer=null;
      const cleanup=()=>{try{delete window[cb];}catch(_e){}try{s.remove();}catch(_e){}if(timer)clearTimeout(timer);};
      window[cb]=payload=>{if(done)return;done=true;cleanup();if(payload&&payload.ok)resolve(payload);else reject(new Error(payload&&payload.error||'Respuesta inválida de Apps Script.'));};
      u.searchParams.set('modo','admin_analytics');u.searchParams.set('key',key);u.searchParams.set('periodo',period);u.searchParams.set('callback',cb);u.searchParams.set('_',String(Date.now()));
      s.src=u.toString();s.async=true;
      s.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('No se pudo conectar con Apps Script.'));};
      timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Apps Script no respondió a tiempo.'));},45000);
      document.head.appendChild(s);
    });
  }

  async function ensurePeriod(period,force){
    if(!force){const cached=cacheRead(period);if(cached)return cached;}
    if(state.loadingPeriods.has(period)){
      for(let i=0;i<80;i++){await new Promise(r=>setTimeout(r,250));const d=cacheRead(period);if(d)return d;if(!state.loadingPeriods.has(period))break;}
      return cacheRead(period);
    }
    const c=credentials();if(!c.api||!c.key)throw new Error('No hay una conexión de Analytics disponible. Vuelve a Inicio y conecta el Admin.');
    state.loadingPeriods.add(period);
    try{
      const d=await requestJsonp(c.api,c.key,period);cacheWrite(period,d);window.dispatchEvent(new CustomEvent('lsp-admin-cache-updated',{detail:{period}}));return d;
    }finally{state.loadingPeriods.delete(period);}
  }

  function loadScript(src,id){
    return new Promise((resolve,reject)=>{
      if(id&&$(id)){resolve();return;}
      const s=document.createElement('script');if(id)s.id=id;s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }

  async function ensureDiagnostico(){
    if(state.diagnostico||state.diagLoading)return;
    state.diagLoading=true;
    try{
      if(!window.LSPediaDiagnosticoBusquedas)await loadScript('busquedas-diagnostico.js?v=20260919-4','lspBusquedaDiagnosticoScript');
      const m=Date.now();
      const[d,v,a]=await Promise.all([
        fetch('../data/palabras.json?_='+m,{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]),
        fetch('../data/vocabulario.json?_='+m,{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]),
        fetch('../data/busqueda-ayudas.json?_='+m,{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({}))
      ]);
      if(window.LSPediaDiagnosticoBusquedas)state.diagnostico=window.LSPediaDiagnosticoBusquedas.construirIndice(d,v,a);
    }catch(e){console.warn('[LSPedia Admin] diagnóstico de búsquedas no disponible:',e&&e.message||e);}
    finally{state.diagLoading=false;if(state.view==='busquedas')renderSearch();}
  }

  function revisarTermino(termino,seccion){
    if(state.diagnostico&&window.LSPediaDiagnosticoBusquedas){
      try{return window.LSPediaDiagnosticoBusquedas.analizar(state.diagnostico,termino,seccion==='Histórico'?'':seccion);}catch(_e){}
    }
    return{tipo:'falta',etiqueta:'Por revisar',sugerencia:'',detalle:'',resuelto:false};
  }

  function fecha(v){const s=text(v);if(!/^\d{8}$/.test(s))return'—';const d=new Date(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8));return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(d);}
  function shortDate(v){const s=text(v);return /^\d{8}$/.test(s)?s.slice(6,8)+'/'+s.slice(4,6):'';}

  function installStyles(){
    if($('lspUnifiedFullStyles'))return;
    const s=document.createElement('style');s.id='lspUnifiedFullStyles';s.textContent=`
      .lsp-view{display:none}.lsp-view.active{display:block}.lsp-view *{box-sizing:border-box}
      .lsp-view-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}.lsp-view-hero h1{font-size:clamp(1.7rem,4vw,2.3rem);margin:0 0 6px;letter-spacing:-.035em}.lsp-view-hero p{margin:0;color:#64748b;line-height:1.5;max-width:760px}
      .lsp-eyebrow{font-size:10px;font-weight:950;letter-spacing:.12em;color:#0284c7;margin-bottom:6px}.lsp-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.lsp-toolbar button,.lsp-toolbar select{border:1px solid #d7e0ea;background:#fff;color:#475569;border-radius:10px;padding:9px 11px;font-size:12px;font-weight:850;min-height:40px}.lsp-toolbar button.active{background:#0f172a;color:#fff;border-color:#0f172a}.lsp-toolbar .primary{background:#0284c7;color:#fff;border-color:#0284c7}
      .lsp-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.lsp-kpi{padding:16px;position:relative;overflow:hidden}.lsp-kpi:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#0284c7}.lsp-kpi.amber:before{background:#f5b818}.lsp-kpi.green:before{background:#16a06a}.lsp-kpi.red:before{background:#b42318}.lsp-kpi span{display:block;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.lsp-kpi strong{display:block;font-size:29px;line-height:1.05;margin-top:7px}.lsp-kpi small{display:block;color:#7b8898;font-size:11px;margin-top:5px;line-height:1.35}
      .lsp-section{margin-top:24px}.lsp-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:11px}.lsp-section-head h2{margin:0 0 3px;font-size:18px}.lsp-section-head p{margin:0;color:#64748b;font-size:12px;line-height:1.4}.lsp-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.lsp-panel{padding:16px;min-width:0}.lsp-panel h3{font-size:15px;margin:0 0 4px}.lsp-panel-sub{font-size:11px;color:#64748b;margin-bottom:12px;line-height:1.4}
      .lsp-list{display:grid;gap:9px}.lsp-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.lsp-name{font-size:12px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lsp-meta{font-size:10px;color:#64748b;margin-top:2px}.lsp-value{font-size:13px;font-weight:900}.lsp-track{height:5px;background:#edf2f7;border-radius:999px;overflow:hidden;margin-top:5px}.lsp-track>span{display:block;height:100%;background:#0284c7;border-radius:999px}
      .lsp-bars{display:flex;align-items:flex-end;gap:5px;height:170px;padding-top:8px;border-bottom:1px solid #e5eaf0;overflow:hidden}.lsp-barcol{flex:1;min-width:4px;height:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:4px}.lsp-bar{background:linear-gradient(180deg,#38a8df,#0284c7);border-radius:5px 5px 1px 1px;min-height:2px}.lsp-barlabel{font-size:8px;color:#8491a2;text-align:center;white-space:nowrap;overflow:hidden}
      .lsp-notice{padding:13px 14px;border-radius:12px;background:#eef8ff;border:1px solid #c9e8fb;color:#175979;font-size:12px;line-height:1.45}.lsp-notice.warn{background:#fff8e6;border-color:#ffe2a3;color:#795600}.lsp-notice.bad{background:#fff1ef;border-color:#ffd3ce;color:#8e241b}.lsp-notice.ok{background:#eaf8f1;border-color:#c6ead8;color:#0f6b4b}
      .lsp-popular-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.lsp-popular{border:1px solid #e5eaf0;background:linear-gradient(145deg,#fff,#f8fbff);border-radius:13px;padding:12px;min-width:0}.lsp-popular-rank{font-size:10px;font-weight:950;color:#0284c7}.lsp-popular-word{font-size:14px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}.lsp-popular-meta{font-size:10px;color:#64748b;margin-top:4px;line-height:1.35}
      .lsp-tools{display:grid;grid-template-columns:minmax(180px,1fr) auto auto;gap:8px;align-items:center;margin-bottom:12px}.lsp-tools input{width:100%;border:1px solid #cfd8e4;background:#fff;border-radius:10px;padding:10px 12px;min-height:42px}.lsp-filters{display:flex;gap:6px}.lsp-filters button{border:1px solid #d7e0ea;background:#fff;color:#536174;border-radius:9px;padding:9px 11px;font-size:11px;font-weight:850;white-space:nowrap}.lsp-filters button.active{background:#0f172a;border-color:#0f172a;color:#fff}.lsp-action{border:1px solid #d7e0ea;background:#fff;color:#334155;border-radius:9px;padding:9px 11px;font-size:11px;font-weight:850;white-space:nowrap}.lsp-action.blue{background:#eef8ff;color:#0f6fb0;border-color:#cde5f5}
      .lsp-table-wrap{overflow:auto;border-radius:15px}.lsp-table{width:100%;border-collapse:collapse;min-width:880px}.lsp-table th{background:#f8fafc;color:#657386;font-size:10px;text-transform:uppercase;letter-spacing:.06em;text-align:left;padding:10px 12px;border-bottom:1px solid #e5eaf0;white-space:nowrap}.lsp-table td{padding:11px 12px;border-bottom:1px solid #edf1f5;font-size:12px;vertical-align:middle}.lsp-table tr:last-child td{border-bottom:0}.lsp-state{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:850;white-space:nowrap}.lsp-state.pending{background:#fff6dd;color:#805b00}.lsp-state.added{background:#eaf8f1;color:#16845b}.lsp-state.grammar{background:#eef2ff;color:#5145b5}.lsp-state.correction{background:#fff7ed;color:#9a4d08}.lsp-state.existing{background:#eaf8f1;color:#16845b}.lsp-state.prediction{background:#eef8ff;color:#17658c}.lsp-state.missing{background:#fff1ef;color:#9f2d24}.lsp-review{min-width:220px}.lsp-review strong{font-size:11px}.lsp-review-detail{font-size:10px;color:#64748b;margin-top:4px;line-height:1.35;max-width:330px}
      .lsp-errors{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.lsp-error{border:1px solid #edf1f5;border-radius:12px;padding:12px;background:#fff}.lsp-error strong{display:block;font-size:22px}.lsp-error span{font-size:10px;color:#64748b;font-weight:850;text-transform:uppercase}
      .lsp-geo{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);gap:12px}.lsp-map{min-height:330px;border:1px solid #edf1f5;border-radius:12px;background:#f8fafc;display:grid;place-items:center;color:#94a3b8;font-size:12px;overflow:hidden}.lsp-geo-lists{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lsp-subcard{border:1px solid #edf1f5;border-radius:12px;padding:12px}.lsp-subcard h4{font-size:12px;margin:0 0 9px}
      .lsp-help{padding:14px 16px}.lsp-help summary{cursor:pointer;font-weight:900}.lsp-help-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.lsp-help-grid>div{padding:10px;border:1px solid #e5eaf0;border-radius:11px;background:#f8fafc}.lsp-help-grid b{display:block;font-size:12px;margin-bottom:3px}.lsp-help-grid span{display:block;font-size:11px;color:#64748b;line-height:1.4}
      .lsp-back{margin-top:18px}.lsp-loading{padding:36px;text-align:center;color:#64748b}.lsp-spinner{width:25px;height:25px;border:3px solid #dbe4ec;border-top-color:#0284c7;border-radius:50%;animation:lspSpin .8s linear infinite;margin:0 auto 9px}@keyframes lspSpin{to{transform:rotate(360deg)}}
      @media(max-width:980px){.lsp-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.lsp-grid2,.lsp-geo{grid-template-columns:1fr}.lsp-popular-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:720px){.lsp-view-hero,.lsp-section-head{align-items:flex-start;flex-direction:column}.lsp-tools{grid-template-columns:1fr}.lsp-filters{overflow:auto}.lsp-popular-grid{grid-template-columns:1fr 1fr}.lsp-geo-lists{grid-template-columns:1fr}.lsp-help-grid{grid-template-columns:1fr}}
      @media(max-width:480px){.lsp-kpis{grid-template-columns:1fr 1fr;gap:8px}.lsp-kpi{padding:12px}.lsp-kpi strong{font-size:23px}.lsp-popular-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function listHtml(items,nameKey,valueKey,meta,limit){
    const rows=Array.isArray(items)?items:[];if(!rows.length)return '<div class="lsp-notice">Sin datos todavía.</div>';
    const max=Math.max(1,...rows.map(x=>Number(x[valueKey])||0));
    return '<div class="lsp-list">'+rows.slice(0,limit||10).map(x=>{const n=Number(x[valueKey])||0;return '<div class="lsp-row"><div><div class="lsp-name" title="'+esc(x[nameKey]||'—')+'">'+esc(x[nameKey]||'—')+'</div><div class="lsp-meta">'+esc(meta?meta(x):'')+'</div><div class="lsp-track"><span style="width:'+Math.max(3,(n/max)*100).toFixed(1)+'%"></span></div></div><div class="lsp-value">'+fmt(n)+'</div></div>';}).join('')+'</div>';
  }

  function barsHtml(items){
    const rows=Array.isArray(items)?items:[];if(!rows.length)return '<div class="lsp-notice">Sin actividad diaria disponible.</div>';
    const max=Math.max(1,...rows.map(x=>Number(x.sesiones)||0));const step=rows.length>45?Math.ceil(rows.length/28):1;const r=rows.filter((_,i)=>i%step===0||i===rows.length-1);
    return '<div class="lsp-bars">'+r.map(x=>'<div class="lsp-barcol" title="'+esc(fecha(x.fecha))+': '+fmt(x.sesiones)+' sesiones"><div class="lsp-bar" style="height:'+Math.max(2,((Number(x.sesiones)||0)/max)*142).toFixed(1)+'px"></div><div class="lsp-barlabel">'+esc(shortDate(x.fecha))+'</div></div>').join('')+'</div>';
  }

  function searchCombined(data){
    const map=new Map();const newer=(data&&data.busquedasSinResultadoPorSeccion&&data.busquedasSinResultadoPorSeccion.items)||[];const old=(data&&data.busquedas&&data.busquedas.items)||[];
    (Array.isArray(newer)?newer:[]).forEach(x=>{const term=text(x.termino);if(!term)return;const sec=text(x.seccion)||'Histórico',k=norm(sec)+'\u0000'+norm(term);map.set(k,{termino:term,seccion:sec,busquedas:Number(x.busquedas)||0,ultimaFecha:text(x.ultimaFecha)});});
    (Array.isArray(old)?old:[]).forEach(x=>{const term=text(x.termino);if(!term)return;let found=null;for(const v of map.values()){if(norm(v.termino)===norm(term)){found=v;break;}}if(found){found.busquedas=Math.max(found.busquedas,Number(x.busquedas)||0);if(text(x.ultimaFecha)>found.ultimaFecha)found.ultimaFecha=text(x.ultimaFecha);}else map.set('historico\u0000'+norm(term),{termino:term,seccion:'Histórico',busquedas:Number(x.busquedas)||0,ultimaFecha:text(x.ultimaFecha)});});
    return [...map.values()].map(x=>{const revision=revisarTermino(x.termino,x.seccion);return{...x,revision,resuelta:!!revision.resuelto};}).sort((a,b)=>b.busquedas-a.busquedas||String(b.ultimaFecha).localeCompare(String(a.ultimaFecha)));
  }

  function popularRows(data){
    const by=(data&&data.busquedasPorSeccion)||{},general=(data&&data.busquedasPopulares)||{};const src=(Array.isArray(by.items)&&by.items.length)?by.items:(Array.isArray(general.items)?general.items:[]);
    return src.map(x=>({termino:text(x.termino),seccion:text(x.seccion),busquedas:Number(x.busquedas)||0,ultimaFecha:text(x.ultimaFecha)})).filter(x=>x.termino).sort((a,b)=>b.busquedas-a.busquedas).slice(0,10);
  }

  function reviewHtml(r){
    r=r||{};const cls=({gramatica:'grammar',correccion:'correction',existente:'existing',prediccion:'prediction',falta:'missing'})[r.tipo]||'missing';
    return '<div class="lsp-review"><div><span class="lsp-state '+cls+'">'+esc(r.etiqueta||'Revisar')+'</span>'+(r.sugerencia?'<strong> → '+esc(r.sugerencia)+'</strong>':'')+'</div>'+(r.detalle?'<div class="lsp-review-detail">'+esc(r.detalle)+'</div>':'')+'</div>';
  }

  function createSearchView(){
    if($('lspSearchView'))return $('lspSearchView');const sec=document.createElement('section');sec.id='lspSearchView';sec.className='lsp-view';
    sec.innerHTML='<div class="lsp-view-hero"><div><div class="lsp-eyebrow">DEMANDA DE CONTENIDO</div><h1>Búsquedas de LSPedia</h1><p>Ranking, historial, diagnóstico automático, prioridades y acciones para convertir búsquedas faltantes en nuevo contenido.</p></div><div class="lsp-toolbar"><button id="lspSearchCopyTop" type="button">Copiar top 5</button><button id="lspSearchCsv" type="button">CSV</button></div></div>'+
      '<div id="lspSearchNotice"></div><div id="lspSearchKpis" class="lsp-kpis"></div>'+
      '<section class="lsp-section"><div class="lsp-section-head"><div><h2>🔥 Más buscadas</h2><p>Las búsquedas explícitas más frecuentes registradas por LSPedia.</p></div></div><div id="lspPopular" class="lsp-popular-grid"></div></section>'+
      '<section class="lsp-section"><div class="lsp-section-head"><div><h2>🎯 Prioridad editorial</h2><p>Top 5 de términos que siguen pendientes según la revisión automática.</p></div></div><div id="lspPriority" class="lsp-popular-grid"></div></section>'+
      '<section class="lsp-section"><div class="lsp-section-head"><div><h2>📚 Historial de búsquedas sin resultado</h2><p>Filtra pendientes, términos ya resueltos y todas las búsquedas registradas.</p></div></div><div class="lsp-tools"><input id="lspSearchInput" type="search" placeholder="Buscar palabra, categoría o sugerencia…"><div class="lsp-filters"><button type="button" data-sfilter="pending" class="active">Pendientes</button><button type="button" data-sfilter="added">Ya agregadas</button><button type="button" data-sfilter="all">Todas</button></div><button class="lsp-action" id="lspSearchRefresh" type="button">↻ Actualizar vista</button></div><div class="card lsp-table-wrap"><div id="lspSearchTable"></div></div></section>'+
      '<button class="btn btn-soft lsp-back" type="button" data-go-home>← Volver a Inicio</button>';
    document.querySelector('main').appendChild(sec);
    sec.querySelector('#lspSearchInput').addEventListener('input',e=>{state.searchQuery=e.target.value;renderSearch();});
    sec.querySelectorAll('[data-sfilter]').forEach(b=>b.addEventListener('click',()=>{state.searchFilter=b.dataset.sfilter||'all';sec.querySelectorAll('[data-sfilter]').forEach(x=>x.classList.toggle('active',x===b));renderSearch();}));
    sec.querySelector('#lspSearchRefresh').addEventListener('click',renderSearch);
    sec.querySelector('#lspSearchCopyTop').addEventListener('click',copyTop5);
    sec.querySelector('#lspSearchCsv').addEventListener('click',exportCsv);
    return sec;
  }

  function renderSearch(){
    const sec=createSearchView();const best=bestData(['todo','30','7']);const notice=$('lspSearchNotice'),table=$('lspSearchTable');
    if(!best){notice.innerHTML='<div class="lsp-notice warn">Los datos todavía están llegando desde Analytics. Esta vista se actualizará automáticamente cuando estén disponibles.</div>';table.innerHTML='';return;}
    ensureDiagnostico();let rows=searchCombined(best.data);const allRows=rows.slice();const q=norm(state.searchQuery);rows=rows.filter(x=>{if(state.searchFilter==='pending'&&x.resuelta)return false;if(state.searchFilter==='added'&&!x.resuelta)return false;return!q||norm(x.termino).includes(q)||norm(x.seccion).includes(q)||norm(x.revision&&x.revision.sugerencia).includes(q)||norm(x.revision&&x.revision.etiqueta).includes(q);});
    notice.innerHTML='<div class="lsp-notice '+(best.period==='todo'?'ok':'warn')+'">'+(best.period==='todo'?'Historial completo disponible.':'Mostrando temporalmente '+periodLabel(best.period).toLowerCase()+' mientras el historial completo termina de cargarse.')+'</div>';
    const pending=allRows.filter(x=>!x.resuelta),resolved=allRows.length-pending.length,totalAttempts=allRows.reduce((s,x)=>s+(Number(x.busquedas)||0),0);
    $('lspSearchKpis').innerHTML='<article class="card lsp-kpi"><span>Términos registrados</span><strong>'+fmt(allRows.length)+'</strong><small>Palabras o expresiones únicas del historial visible</small></article><article class="card lsp-kpi amber"><span>Intentos acumulados</span><strong>'+fmt(totalAttempts)+'</strong><small>Una palabra puede haberse buscado varias veces</small></article><article class="card lsp-kpi red"><span>Pendientes</span><strong>'+fmt(pending.length)+'</strong><small>Todavía requieren revisión o contenido</small></article><article class="card lsp-kpi green"><span>Resueltas</span><strong>'+fmt(resolved)+'</strong><small>La revisión automática detecta contenido disponible</small></article>';
    const pop=popularRows(cacheRead('30')||best.data);$('lspPopular').innerHTML=pop.length?pop.slice(0,10).map((x,i)=>'<article class="lsp-popular"><div class="lsp-popular-rank">#'+(i+1)+'</div><div class="lsp-popular-word" title="'+esc(x.termino)+'">'+esc(x.termino)+'</div><div class="lsp-popular-meta">'+fmt(x.busquedas)+' búsqueda'+(x.busquedas===1?'':'s')+(x.seccion?' · '+esc(x.seccion):'')+'</div></article>').join(''):'<div class="lsp-notice" style="grid-column:1/-1">Aún no hay búsquedas generales registradas.</div>';
    const top=pending.slice(0,5);$('lspPriority').innerHTML=top.length?top.map((x,i)=>'<article class="lsp-popular"><div class="lsp-popular-rank">PRIORIDAD #'+(i+1)+'</div><div class="lsp-popular-word" title="'+esc(x.termino)+'">'+esc(x.termino)+'</div><div class="lsp-popular-meta">'+fmt(x.busquedas)+' búsquedas · '+esc(x.seccion)+' · última '+esc(fecha(x.ultimaFecha))+'</div><div style="margin-top:9px"><button class="lsp-action blue" type="button" data-create-term="'+encodeURIComponent(x.termino)+'">➕ Crear</button></div></article>').join(''):'<div class="lsp-notice ok" style="grid-column:1/-1">No hay términos pendientes en los datos visibles.</div>';
    const show=rows.slice(0,180);table.innerHTML=show.length?'<table class="lsp-table"><thead><tr><th>#</th><th>Palabra</th><th>Sección</th><th>Revisión automática</th><th>Búsquedas</th><th>Última</th><th>Estado</th><th></th></tr></thead><tbody>'+show.map((x,i)=>'<tr><td class="muted">'+(i+1)+'</td><td><strong>'+esc(x.termino)+'</strong></td><td><span class="lsp-state pending">'+esc(x.seccion||'—')+'</span></td><td>'+reviewHtml(x.revision)+'</td><td><strong>'+fmt(x.busquedas)+'</strong></td><td>'+esc(fecha(x.ultimaFecha))+'</td><td><span class="lsp-state '+(x.resuelta?'added':'pending')+'">'+(x.resuelta?'✓ Resuelta':'● Pendiente')+'</span></td><td><button class="lsp-action blue" type="button" data-create-term="'+encodeURIComponent(x.termino)+'">➕ Crear</button></td></tr>').join('')+'</tbody></table>'+(rows.length>show.length?'<div class="lsp-notice" style="margin:12px">Mostrando '+fmt(show.length)+' de '+fmt(rows.length)+' resultados. Usa el buscador para localizar una palabra específica.</div>':''):'<div class="lsp-notice" style="margin:12px">No hay resultados para este filtro.</div>';
    sec.querySelectorAll('[data-create-term]').forEach(b=>b.addEventListener('click',()=>openPublisher(decodeURIComponent(b.dataset.createTerm||''))));
  }

  function currentFilteredRows(){const best=bestData(['todo','30','7']);if(!best)return[];let rows=searchCombined(best.data),q=norm(state.searchQuery);return rows.filter(x=>{if(state.searchFilter==='pending'&&x.resuelta)return false;if(state.searchFilter==='added'&&!x.resuelta)return false;return!q||norm(x.termino).includes(q)||norm(x.seccion).includes(q)||norm(x.revision&&x.revision.sugerencia).includes(q);});}
  async function copyTop5(){const rows=currentFilteredRows().filter(x=>!x.resuelta).slice(0,5);if(!rows.length)return;const t=rows.map((x,i)=>(i+1)+'. '+x.termino+' — '+x.busquedas+' búsqueda'+(x.busquedas===1?'':'s')).join('\n');try{await navigator.clipboard.writeText(t);const b=$('lspSearchCopyTop');b.textContent='✓ Copiado';setTimeout(()=>b.textContent='Copiar top 5',1000);}catch(_e){window.prompt('Copia esta lista:',t);}}
  function exportCsv(){const rows=currentFilteredRows();if(!rows.length)return;const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const lines=[['N','Palabra','Seccion','Revision','Sugerencia','Busquedas','Ultima busqueda','Estado'].map(q).join(',')];rows.forEach((x,i)=>lines.push([i+1,x.termino,x.seccion,x.revision&&x.revision.etiqueta||'',x.revision&&x.revision.sugerencia||'',x.busquedas,fecha(x.ultimaFecha),x.resuelta?'Resuelta':'Pendiente'].map(q).join(',')));const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lspedia-busquedas.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0);}

  async function openPublisher(term){let u='';try{u=text(localStorage.getItem(STORE_PUBLISHER));}catch(_e){}if(!u){u=text(prompt('Pega una sola vez la URL privada completa de tu Publicador LSPedia:')||'');if(!u)return;try{const x=new URL(u.split('?')[0]);if(x.protocol!=='https:'||x.hostname!=='script.google.com'){alert('La URL debe ser una implementación oficial de Google Apps Script.');return;}}catch(_e){alert('La URL no es válida.');return;}try{localStorage.setItem(STORE_PUBLISHER,u);}catch(_e){}}try{await navigator.clipboard.writeText(term);}catch(_e){}try{const x=new URL(u);x.searchParams.set('lsp_prefill',term);u=x.toString();}catch(_e){}window.open(u,'_blank','noopener');}

  function createStatsView(){
    if($('lspStatsView'))return $('lspStatsView');const sec=document.createElement('section');sec.id='lspStatsView';sec.className='lsp-view';
    sec.innerHTML='<div class="lsp-view-hero"><div><div class="lsp-eyebrow">ANALYTICS</div><h1>Estadísticas de LSPedia</h1><p>La vista completa de usuarios, sesiones, contenido, tráfico, ubicación, eventos y salud técnica, dentro del mismo Admin.</p></div><div class="lsp-toolbar"><button type="button" data-stats-period="7">7 días</button><button type="button" data-stats-period="30" class="active">30 días</button><button type="button" data-stats-period="90">90 días</button><button type="button" data-stats-period="365">1 año</button><button type="button" data-stats-period="todo">Desde inicio</button><button id="lspStatsRefresh" class="primary" type="button">↻ Actualizar</button></div></div><div id="lspStatsNotice"></div><div id="lspStatsBody"></div><button class="btn btn-soft lsp-back" type="button" data-go-home>← Volver a Inicio</button>';
    document.querySelector('main').appendChild(sec);
    sec.querySelectorAll('[data-stats-period]').forEach(b=>b.addEventListener('click',()=>{state.statsPeriod=b.dataset.statsPeriod||'30';sec.querySelectorAll('[data-stats-period]').forEach(x=>x.classList.toggle('active',x===b));loadAndRenderStats(false);}));
    sec.querySelector('#lspStatsRefresh').addEventListener('click',()=>loadAndRenderStats(true));return sec;
  }

  async function loadAndRenderStats(force){
    const notice=$('lspStatsNotice'),body=$('lspStatsBody');let data=cacheRead(state.statsPeriod);
    if(data&&!force){renderStatsData(data);return;}
    const fallback=bestData(state.statsPeriod==='30'?['7','todo']:state.statsPeriod==='7'?['30','todo']:['30','7','todo']);
    if(fallback&&!data&&!force){notice.innerHTML='<div class="lsp-notice warn">Mostrando temporalmente '+periodLabel(fallback.period).toLowerCase()+' mientras se prepara '+periodLabel(state.statsPeriod).toLowerCase()+'.</div>';renderStatsData(fallback.data,true);}
    else{body.innerHTML='<div class="card lsp-loading"><div class="lsp-spinner"></div>Consultando '+esc(periodLabel(state.statsPeriod))+'…</div>';}
    try{data=await ensurePeriod(state.statsPeriod,!!force);if(data)renderStatsData(data,false);}
    catch(e){notice.innerHTML='<div class="lsp-notice bad">No se pudo cargar este periodo: '+esc(e&&e.message||e)+'</div>';if(!fallback)body.innerHTML='';}
  }

  function renderStatsData(data,isFallback){
    const notice=$('lspStatsNotice'),body=$('lspStatsBody');if(!data||!body)return;const r=data.resumen||{},rt=data.realtime||{},err=data.errores||{},miss=data.busquedasSinResultadoPorSeccion||data.busquedas||{};
    if(!isFallback)notice.innerHTML='<div class="lsp-notice ok">'+esc(periodLabel(state.statsPeriod))+' cargado. Cambiar entre Inicio, Búsquedas y Estadísticas no reinicia el Admin.</div>';
    body.innerHTML='<div class="lsp-kpis">'+
      '<article class="card lsp-kpi green"><span>Usuarios activos</span><strong>'+fmt(rt.activos)+'</strong><small>Realtime · últimos 30 min</small></article><article class="card lsp-kpi"><span>Vistas realtime</span><strong>'+fmt(rt.vistas)+'</strong><small>Páginas vistas recientemente</small></article><article class="card lsp-kpi amber"><span>Eventos realtime</span><strong>'+fmt(rt.eventos)+'</strong><small>Interacciones recientes</small></article><article class="card lsp-kpi"><span>Ciudad principal</span><strong style="font-size:19px">'+esc(rt.ciudades&&rt.ciudades[0]&&rt.ciudades[0].ciudad||'—')+'</strong><small>'+(rt.ciudades&&rt.ciudades[0]?fmt(rt.ciudades[0].usuarios)+' usuario(s) · '+esc(rt.ciudades[0].pais||''):'Sin actividad reciente')+'</small></article></div>'+
      '<section class="lsp-section"><div class="lsp-section-head"><div><h2>Resumen · '+esc(periodLabel(state.statsPeriod).toLowerCase())+'</h2><p>Indicadores principales del periodo seleccionado.</p></div></div><div class="lsp-kpis">'+
      '<article class="card lsp-kpi"><span>Usuarios</span><strong>'+fmt(r.usuarios)+'</strong><small>Usuarios activos</small></article><article class="card lsp-kpi"><span>Visitas</span><strong>'+fmt(r.sesiones)+'</strong><small>Sesiones</small></article><article class="card lsp-kpi"><span>Páginas vistas</span><strong>'+fmt(r.vistas)+'</strong><small>Incluye repetidas</small></article><article class="card lsp-kpi"><span>Interacciones</span><strong>'+fmt(r.eventos)+'</strong><small>Eventos registrados</small></article><article class="card lsp-kpi green"><span>Sesiones activas</span><strong>'+fmt(r.sesionesConInteraccion)+'</strong><small>Con interacción significativa</small></article><article class="card lsp-kpi green"><span>Tasa de interacción</span><strong>'+pct(r.tasaInteraccion)+'</strong><small>Engagement rate</small></article><article class="card lsp-kpi amber"><span>Sin resultado</span><strong>'+fmt(miss.totalBusquedas)+'</strong><small>'+fmt(miss.totalTerminos)+' término(s)</small></article><article class="card lsp-kpi red"><span>Errores técnicos</span><strong>'+fmt(err.total)+'</strong><small>Imagen, multimedia o JavaScript</small></article></div></section>'+
      '<section class="lsp-section"><div class="lsp-section-head"><div><h2>📈 Tendencia y dispositivos</h2><p>Evolución diaria y equipos usados en realtime.</p></div></div><div class="lsp-grid2"><article class="card lsp-panel"><h3>Actividad diaria</h3><div class="lsp-panel-sub">Sesiones por día.</div>'+barsHtml(data.serie)+'</article><article class="card lsp-panel"><h3>Dispositivos · realtime</h3><div class="lsp-panel-sub">Usuarios activos por tipo de dispositivo.</div>'+listHtml(rt.dispositivos,'dispositivo','usuarios',()=> 'Usuarios activos',8)+'</article></div></section>'+
      '<section class="lsp-section"><div class="lsp-section-head"><div><h2>🌐 Cómo llegan y qué ven</h2><p>Fuentes de tráfico, páginas principales e interacciones frecuentes.</p></div></div><div class="lsp-grid2"><article class="card lsp-panel"><h3>Fuentes de tráfico</h3>'+listHtml(data.fuentes,'fuente','sesiones',x=>(x.medio||'—')+(x.canal?' · '+x.canal:''),10)+'</article><article class="card lsp-panel"><h3>Páginas más vistas</h3>'+listHtml(data.paginas,'pagina','vistas',x=>fmt(x.usuarios)+' usuarios',10)+'</article></div></section>'+
      '<section class="lsp-section"><div class="lsp-section-head"><div><h2>📍 Ubicación</h2><p>Países y ciudades agregados por Google Analytics.</p></div></div><article class="card lsp-panel"><div class="lsp-geo"><div id="lspGeoMap" class="lsp-map">Cargando mapa…</div><div class="lsp-geo-lists"><div class="lsp-subcard"><h4>🌎 Países</h4>'+listHtml(data.paises,'pais','usuarios',x=>fmt(x.sesiones)+' sesiones',10)+'</div><div class="lsp-subcard"><h4>🏙️ Ciudades</h4>'+listHtml(data.ciudades,'ciudad','usuarios',x=>(x.pais||'—')+' · '+fmt(x.sesiones)+' sesiones',10)+'</div></div></div></article></section>'+
      '<section class="lsp-section"><div class="lsp-section-head"><div><h2>⚡ Interacciones y salud técnica</h2><p>Eventos frecuentes y errores detectados por la telemetría.</p></div></div><div class="lsp-grid2"><article class="card lsp-panel"><h3>Eventos principales</h3>'+listHtml(data.eventos,'evento','eventos',x=>fmt(x.usuarios)+' usuarios',12)+'</article><article class="card lsp-panel"><h3>Errores detectados</h3><div class="lsp-errors"><div class="lsp-error"><strong>'+fmt(err.total)+'</strong><span>Total</span></div><div class="lsp-error"><strong>'+fmt(err.imagen)+'</strong><span>Imágenes</span></div><div class="lsp-error"><strong>'+fmt(err.media)+'</strong><span>Video/audio</span></div><div class="lsp-error"><strong>'+fmt(err.runtime)+'</strong><span>JavaScript</span></div></div></article></div></section>'+
      '<section class="lsp-section"><details class="card lsp-help"><summary>ℹ️ Cómo interpretar estas estadísticas</summary><div class="lsp-help-grid"><div><b>Usuarios</b><span>Usuarios activos reconocidos por GA4; no equivale exactamente a personas físicas únicas.</span></div><div><b>Visitas</b><span>Sesiones. Una misma persona puede generar varias.</span></div><div><b>Páginas vistas</b><span>Cada visualización cuenta, incluidas repeticiones.</span></div><div><b>Interacciones</b><span>Eventos registrados por la web.</span></div><div><b>Sin resultado</b><span>Intentos de búsqueda que no encontraron contenido.</span></div><div><b>Errores técnicos</b><span>Ocurrencias agregadas de fallos de imagen, multimedia o JavaScript.</span></div></div></details></section>';
    drawGeo(data.paises||[]);
  }

  async function ensureGoogleCharts(){
    if(window.google&&google.charts)return;
    await loadScript('https://www.gstatic.com/charts/loader.js','lspGoogleCharts');
  }
  async function drawGeo(paises){
    const map=$('lspGeoMap');if(!map)return;const rows=(Array.isArray(paises)?paises:[]).filter(x=>x&&(x.codigo||x.pais)&&(Number(x.usuarios)||0)>0);if(!rows.length){map.textContent='Sin datos geográficos para este periodo.';return;}
    try{await ensureGoogleCharts();if(!(window.google&&google.charts)){map.textContent='Mapa no disponible. Las listas siguen visibles.';return;}await new Promise(resolve=>{google.charts.load('current',{packages:['geochart']});google.charts.setOnLoadCallback(resolve);});if(!(google.visualization&&google.visualization.GeoChart)){map.textContent='Mapa no disponible.';return;}const table=[['País','Usuarios']];rows.forEach(x=>table.push([String(x.codigo||x.pais),Number(x.usuarios)||0]));const d=google.visualization.arrayToDataTable(table);new google.visualization.GeoChart(map).draw(d,{legend:'none',backgroundColor:'transparent',datalessRegionColor:'#eef2f7',defaultColor:'#dbeafe',colorAxis:{colors:['#bae6fd','#0284c7']},keepAspectRatio:true});}
    catch(_e){map.textContent='No se pudo dibujar el mapa. Las listas de países y ciudades siguen disponibles.';}
  }

  function repairHomeTrends(){
    const grid=$('trendGrid');if(!grid)return;const d7=cacheRead('7');if(!d7){grid.innerHTML='<div class="lsp-notice" style="grid-column:1/-1">Esperando las primeras métricas de 7 días…</div>';return;}const src=(d7.busquedasSinResultadoPorSeccion&&d7.busquedasSinResultadoPorSeccion.items)||[];const map=new Map();(Array.isArray(src)?src:[]).forEach(x=>{const k=norm(x.termino);if(!k)return;const p=map.get(k)||{termino:text(x.termino),busquedas:0,secciones:new Set()};p.busquedas+=Number(x.busquedas)||0;if(x.seccion)p.secciones.add(text(x.seccion));map.set(k,p);});const d30=cacheRead('30');let rows=[...map.values()];if(d30){const m30=new Map();const s30=(d30.busquedasSinResultadoPorSeccion&&d30.busquedasSinResultadoPorSeccion.items)||[];(Array.isArray(s30)?s30:[]).forEach(x=>{const k=norm(x.termino);m30.set(k,(m30.get(k)||0)+(Number(x.busquedas)||0));});rows=rows.map(x=>{const total=m30.get(norm(x.termino))||x.busquedas,prev=Math.max(0,total-x.busquedas),exp=(prev/23)*7,g=exp>0?((x.busquedas-exp)/exp)*100:(x.busquedas>1?999:0);return{...x,growth:g};}).sort((a,b)=>b.growth-a.growth||b.busquedas-a.busquedas);grid.innerHTML=rows.slice(0,6).map((x,i)=>'<article class="card trend-card"><div class="trend-top"><div><div class="trend-rank">#'+(i+1)+'</div><div class="trend-word">'+esc(x.termino)+'</div></div><span class="trend-badge '+(x.growth<0?'down':'')+'">'+(x.growth>=0?'↑ ':'↓ ')+Math.min(999,Math.round(Math.abs(x.growth)))+'%</span></div><div class="trend-meta"><b>'+fmt(x.busquedas)+'</b> búsquedas en 7 días · '+esc([...x.secciones].join(' / ')||'—')+'</div></article>').join('')||'<div class="lsp-notice" style="grid-column:1/-1">No hay suficiente actividad reciente.</div>';}else{rows.sort((a,b)=>b.busquedas-a.busquedas);grid.innerHTML=rows.slice(0,6).map((x,i)=>'<article class="card trend-card"><div class="trend-top"><div><div class="trend-rank">#'+(i+1)+'</div><div class="trend-word">'+esc(x.termino)+'</div></div></div><div class="trend-meta"><b>'+fmt(x.busquedas)+'</b> búsquedas en 7 días · comparación de 30 días aún cargando</div></article>').join('')||'<div class="lsp-notice" style="grid-column:1/-1">No hay suficiente actividad reciente.</div>';}
  }

  function activateNav(target){
    document.querySelectorAll('.admin-nav a,.mobile-nav a').forEach(a=>{const h=a.getAttribute('href')||'';const isHome=h==='./'||h==='#home'||/\/admin\/?$/.test(h);const isSearch=h.includes('busquedas')&&!h.includes('estadisticas');const isStats=h.includes('estadisticas');a.classList.toggle('active',target==='home'?isHome:target==='busquedas'?isSearch:target==='estadisticas'?isStats:false);});
  }
  function show(target,ev){if(ev){ev.preventDefault();ev.stopPropagation();}state.view=target;const dash=$('dashboard'),search=createSearchView(),stats=createStatsView();if(dash)dash.style.display=target==='home'?'':'none';search.classList.toggle('active',target==='busquedas');stats.classList.toggle('active',target==='estadisticas');activateNav(target);if(target==='busquedas')renderSearch();else if(target==='estadisticas')loadAndRenderStats(false);else repairHomeTrends();history.replaceState(null,'',location.pathname+(target==='home'?'':'#'+target));window.scrollTo({top:0,behavior:'auto'});}
  function intercept(e){const a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;const h=a.getAttribute('href')||'';if(h==='./'||h==='#home'||h===location.pathname){show('home',e);return;}if(h.includes('busquedas.html#estadisticas')||h==='#estadisticas'||h.endsWith('/#estadisticas')){show('estadisticas',e);return;}if(h.includes('busquedas.html#busquedas')||h==='#busquedas'||h.endsWith('/#busquedas')){show('busquedas',e);}}

  function init(){
    installStyles();createSearchView();createStatsView();document.addEventListener('click',intercept,true);document.querySelectorAll('[data-go-home]').forEach(b=>b.addEventListener('click',e=>show('home',e)));window.addEventListener('hashchange',()=>{const h=location.hash;if(h==='#busquedas')show('busquedas');else if(h==='#estadisticas')show('estadisticas');else show('home');});
    ensureDiagnostico();const h=location.hash;if(h==='#busquedas')show('busquedas');else if(h==='#estadisticas')show('estadisticas');else repairHomeTrends();state.lastSig=cacheSig();let ticks=0;const timer=setInterval(()=>{ticks++;const sig=cacheSig();if(sig!==state.lastSig){state.lastSig=sig;repairHomeTrends();if(state.view==='busquedas')renderSearch();if(state.view==='estadisticas')renderStatsData(cacheRead(state.statsPeriod)||((bestData(['30','7','todo'])||{}).data),!cacheRead(state.statsPeriod));}else if(ticks%5===0&&state.view==='home')repairHomeTrends();if(ticks>225)clearInterval(timer);},800);
    window.addEventListener('lsp-admin-cache-updated',()=>{repairHomeTrends();if(state.view==='busquedas')renderSearch();if(state.view==='estadisticas')renderStatsData(cacheRead(state.statsPeriod)||((bestData(['30','7','todo'])||{}).data),!cacheRead(state.statsPeriod));});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();