(function(){
  'use strict';

  const REPO='NiltonFG-PE/lspedia';
  const BRANCH_DEV='develop';
  const STORE_URL='lspedia_admin_busquedas_api_v1';
  const SESSION_KEY='lspedia_admin_busquedas_key_v1';
  const STORE_ACCESS='lspedia_admin_access_v2';
  const STORE_PUBLISHER='lspedia_admin_publisher_url_v1';
  const STORE_FIRST_SEEN='lspedia_admin_pending_first_seen_v1';
  const CACHE_PREFIX='lspedia_admin_home_cache_v2_';
  const CACHE_TTL=5*60*1000;
  const AUTOLOCK_MS=30*60*1000;
  const WORKFLOWS=[
    {id:'alfabetizacion',title:'Alfabetización',file:'actualizar-alfabetizacion.yml',maxHours:1.5},
    {id:'vocabulario',title:'Vocabulario',file:'actualizar-vocabulario.yml',maxHours:1},
    {id:'sitemap',title:'Diccionario + sitemap',file:'actualizar-sitemap.yml',maxHours:4},
    {id:'validacion',title:'Validación general',file:'validar-lspedia.yml',maxHours:72}
  ];

  const $=id=>document.getElementById(id);
  const fmt=v=>new Intl.NumberFormat('es-PE').format(Number(v)||0);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('es-PE');
  const text=v=>String(v==null?'':v).trim();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const daysAgo=v=>{const d=parseGaDate(v);if(!d)return null;return Math.max(0,Math.floor((Date.now()-d.getTime())/86400000));};
  function parseGaDate(v){const s=String(v||'');if(!/^\d{8}$/.test(s))return null;return new Date(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8),12,0,0);}
  function gaDateLabel(v){const d=parseGaDate(v);return d?new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(d):'—';}
  function pct(v){const n=Number(v)||0;return (n>999?'>999':Math.round(n))+'%';}

  const state={
    api:'',key:'',remember:false,locked:false,
    data7:null,data30:null,dataAll:null,
    content:null,repo:null,workflows:[],audit:null,
    alerts:[],publisherUrl:'',loadToken:0,lastLoaded:0
  };

  function readCredentials(){
    let api='',key='',remember=false;
    try{
      const r=JSON.parse(localStorage.getItem(STORE_ACCESS)||'null');
      if(r&&r.api&&r.key){api=text(r.api);key=text(r.key);remember=true;}
    }catch(_e){}
    if(!api){try{api=text(localStorage.getItem(STORE_URL));}catch(_e){}}
    if(!key){try{key=text(sessionStorage.getItem(SESSION_KEY));}catch(_e){}}
    return {api,key,remember};
  }

  function saveCredentials(api,key,remember){
    localStorage.setItem(STORE_URL,api);
    if(remember){
      localStorage.setItem(STORE_ACCESS,JSON.stringify({api,key}));
      sessionStorage.removeItem(SESSION_KEY);
    }else{
      localStorage.removeItem(STORE_ACCESS);
      sessionStorage.setItem(SESSION_KEY,key);
    }
  }

  function forgetCredentials(){
    try{localStorage.removeItem(STORE_URL);localStorage.removeItem(STORE_ACCESS);sessionStorage.removeItem(SESSION_KEY);}catch(_e){}
    state.api='';state.key='';state.data7=null;state.data30=null;state.dataAll=null;
    $('dashboard').classList.add('d-none');
    $('accessPanel').classList.remove('d-none');
    $('apiUrl').value='';$('adminKey').value='';$('rememberAccess').checked=false;
    $('accessStatus').textContent='Sin conectar';
  }

  function validApiUrl(value){
    try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='script.google.com'&&/^\/macros\/s\/[^/]+\/exec\/?$/.test(u.pathname);}catch(_e){return false;}
  }

  function requestJsonp(api,key,period,mode='admin_analytics',timeoutMs=38000){
    return new Promise((resolve,reject)=>{
      let url;
      try{url=new URL(api);}catch(_e){reject(new Error('URL de Apps Script inválida.'));return;}
      const cb='lspAdminHome_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
      const s=document.createElement('script');let done=false,timer=0;
      const cleanup=()=>{try{delete window[cb];}catch(_e){}try{s.remove();}catch(_e){}clearTimeout(timer);};
      window[cb]=payload=>{
        if(done)return;done=true;cleanup();
        if(payload&&payload.ok)resolve(payload);
        else reject(new Error(payload&&payload.error||'Respuesta inválida del Admin.'));
      };
      url.searchParams.set('modo',mode);
      url.searchParams.set('key',key);
      url.searchParams.set('periodo',period||'7');
      url.searchParams.set('callback',cb);
      url.searchParams.set('_',String(Date.now()));
      s.src=url.toString();s.async=true;
      s.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('No se pudo conectar con Apps Script. Revisa tu conexión o la URL.'));};
      timer=setTimeout(()=>{
        if(done)return;done=true;cleanup();
        reject(new Error(timeoutMs<=15000?'Apps Script está tardando demasiado en responder. Intenta otra vez.':'La consulta de Analytics tardó demasiado.'));
      },timeoutMs);
      document.head.appendChild(s);
    });
  }

  async function probeAccess(api,key){
    // Compatibilidad inmediata con el backend nuevo (admin_ping) y con
    // implementaciones anteriores (admin_busquedas). Se prueban en paralelo
    // para que una versión antigua de Apps Script no deje el Admin esperando.
    const ping=requestJsonp(api,key,'7','admin_ping',8000);
    const legacy=requestJsonp(api,key,'7','admin_busquedas',12000);
    try{
      if(typeof Promise.any==='function') return await Promise.any([ping,legacy]);
      return await new Promise((resolve,reject)=>{
        let failed=0,last=null;
        [ping,legacy].forEach(p=>p.then(resolve).catch(e=>{last=e;if(++failed===2)reject(last);}));
      });
    }catch(e){
      const errors=e&&Array.isArray(e.errors)?e.errors:[e];
      const keyError=errors.find(x=>/clave incorrecta|unauthorized|no autorizado/i.test(String(x&&x.message||'')));
      if(keyError)throw keyError;
      throw new Error('No se pudo validar el acceso en 12 segundos. Verifica que la URL termine en /exec y que la implementación de Apps Script esté activa.');
    }
  }

  function cacheGet(period){
    try{const r=JSON.parse(sessionStorage.getItem(CACHE_PREFIX+period)||'null');if(r&&r.ts&&Date.now()-r.ts<CACHE_TTL&&r.data)return r.data;}catch(_e){}
    return null;
  }
  function cacheSet(period,data){try{sessionStorage.setItem(CACHE_PREFIX+period,JSON.stringify({ts:Date.now(),data}));}catch(_e){}}
  function cacheClear(){try{Object.keys(sessionStorage).filter(k=>k.indexOf(CACHE_PREFIX)===0).forEach(k=>sessionStorage.removeItem(k));}catch(_e){}}

  async function analytics(period,force){
    if(!force){const c=cacheGet(period);if(c)return c;}
    // Evita dos consultas largas idénticas: en móvil podían encadenarse hasta
    // ~77 s por período y hacer parecer que el panel había dejado de cargar.
    try{
      const d=await requestJsonp(state.api,state.key,period,'admin_analytics',45000);
      cacheSet(period,d);return d;
    }catch(e){
      throw e||new Error('No se pudo consultar Analytics.');
    }
  }

  async function fetchJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status+' · '+url);return r.json();}
  async function fetchText(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status+' · '+url);return r.text();}

  async function loadContent(){
    const m=Date.now();
    const [dic,voc,alf,cat,tr]=await Promise.all([
      fetchJson('../data/palabras.json?_='+m).catch(()=>[]),
      fetchJson('../data/vocabulario.json?_='+m).catch(()=>[]),
      fetchJson('../data/alfabetizacion.json?_='+m).catch(()=>({})),
      fetchJson('../data/categorias.json?_='+m).catch(()=>({})),
      fetchJson('../data/traducciones-en.json?_='+m).catch(()=>({}))
    ]);
    return {dic:Array.isArray(dic)?dic:[],voc:Array.isArray(voc)?voc:[],alf:alf||{},cat:cat||{},tr:tr||{}};
  }

  function imageReal(v){const s=text(v).split(',')[0].trim();return !!s&&/\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(s);}
  function videoReal(v){const s=text(v);return !!s&&(/youtu/i.test(s)||/^[A-Za-z0-9_-]{8,}$/.test(s));}
  function wordOf(x){return text(x&&x.palabra);}
  function categoryOf(x){return text(x&&x.categoria)||'Sin categoría';}
  function definitionOf(x){return text(x&&(x.definicion||x.concepto||x.descripcion));}

  function auditContent(content){
    const all=[...content.dic.map(x=>({x,src:'Diccionario'})),...content.voc.map(x=>({x,src:'Vocabulario'}))];
    const seen=new Map(),duplicates=[];
    all.forEach(({x,src})=>{const k=src+'|'+norm(wordOf(x))+'|'+norm(categoryOf(x));if(!wordOf(x))return;if(seen.has(k))duplicates.push({palabra:wordOf(x),src});else seen.set(k,1);});
    const missingImage=all.filter(({x})=>!imageReal(x.imagen));
    const missingVideo=all.filter(({x})=>!videoReal(x.video));
    const missingCategory=all.filter(({x})=>!text(x.categoria));
    const missingDefinition=content.dic.filter(x=>!definitionOf(x));
    const brokenNames=all.filter(({x})=>!wordOf(x));
    return {duplicates,missingImage,missingVideo,missingCategory,missingDefinition,brokenNames,total:all.length};
  }

  function categories(content){
    const map=new Map();
    [...content.dic,...content.voc].forEach(x=>{const c=categoryOf(x);map.set(c,(map.get(c)||0)+1);});
    return [...map.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  }

  async function loadRepo(){
    const api='https://api.github.com/repos/'+REPO;
    const [repo,dev,main,pages,liveSw,devSw]=await Promise.all([
      fetchJson(api).catch(()=>null),
      fetchJson(api+'/branches/'+BRANCH_DEV).catch(()=>null),
      fetchJson(api+'/branches/main').catch(()=>null),
      fetchJson(api+'/pages').catch(()=>null),
      fetchText('../sw.js?_='+Date.now()).catch(()=>''),
      fetchText('https://raw.githubusercontent.com/'+REPO+'/'+BRANCH_DEV+'/sw.js?_='+Date.now()).catch(()=>''),
    ]);
    const ver=s=>{const m=String(s||'').match(/(?:VERSION_APP|CACHE_VERSION|CACHE_NAME|VERSION)\s*=\s*["']([^"']+)/i)||String(s||'').match(/lspedia[-_ ]?v?(\d+)/i);return m?m[1]:'—';};
    return {repo,dev,main,pages,liveVersion:ver(liveSw),devVersion:ver(devSw)};
  }

  async function loadWorkflows(){
    return Promise.all(WORKFLOWS.map(async w=>{
      try{
        const d=await fetchJson('https://api.github.com/repos/'+REPO+'/actions/workflows/'+encodeURIComponent(w.file)+'/runs?branch='+BRANCH_DEV+'&per_page=1&_='+Date.now());
        const run=d.workflow_runs&&d.workflow_runs[0];
        if(!run)return {...w,state:'warn',label:'Sin ejecuciones',hours:null,run:null};
        const hours=(Date.now()-new Date(run.updated_at||run.created_at).getTime())/36e5;
        let state='wait',label='En curso';
        if(run.status==='completed'&&run.conclusion==='success'){state=hours>w.maxHours?'warn':'ok';label=hours>w.maxHours?'Antigua':'Correcto';}
        else if(run.status==='completed'){state='bad';label='Falló';}
        return {...w,state,label,hours,run};
      }catch(e){return {...w,state:'warn',label:'No comprobado',hours:null,error:e.message};}
    }));
  }

  function aggregateMissing(data){
    const out=new Map();
    const source=(data&&data.busquedasSinResultadoPorSeccion&&data.busquedasSinResultadoPorSeccion.items)||[];
    source.forEach(x=>{const k=norm(x.termino);if(!k)return;const prev=out.get(k)||{termino:text(x.termino),busquedas:0,ultimaFecha:'',secciones:new Set()};prev.busquedas+=Number(x.busquedas)||0;if(String(x.ultimaFecha||'')>prev.ultimaFecha)prev.ultimaFecha=String(x.ultimaFecha||'');if(x.seccion)prev.secciones.add(text(x.seccion));out.set(k,prev);});
    return out;
  }

  function trendItems(d7,d30){
    const a=aggregateMissing(d7),b=aggregateMissing(d30),rows=[];
    a.forEach((x,k)=>{
      const total30=(b.get(k)&&b.get(k).busquedas)||x.busquedas;
      const prev23=Math.max(0,total30-x.busquedas);
      const expected7=(prev23/23)*7;
      const growth=expected7>0?((x.busquedas-expected7)/expected7)*100:(x.busquedas>1?999:0);
      rows.push({...x,total30,growth,expected7});
    });
    return rows.filter(x=>x.busquedas>=1).sort((p,q)=>q.growth-p.growth||q.busquedas-p.busquedas).slice(0,6);
  }

  function firstSeenMap(){try{return JSON.parse(localStorage.getItem(STORE_FIRST_SEEN)||'{}')||{};}catch(_e){return {};}}
  function saveFirstSeen(rows){const m=firstSeenMap(),today=new Date().toISOString().slice(0,10);let changed=false;rows.forEach(x=>{const k=norm(x.termino);if(k&&!m[k]){m[k]=today;changed=true;}});if(changed)try{localStorage.setItem(STORE_FIRST_SEEN,JSON.stringify(m));}catch(_e){}return m;}
  function seenDays(v){if(!v)return 0;const d=new Date(v+'T12:00:00');return Number.isNaN(d.getTime())?0:Math.max(0,Math.floor((Date.now()-d.getTime())/86400000));}

  function buildPending(allData){
    const rows=[...aggregateMissing(allData).values()].sort((a,b)=>b.busquedas-a.busquedas||String(b.ultimaFecha).localeCompare(String(a.ultimaFecha)));
    const first=saveFirstSeen(rows);
    return rows.map(x=>({...x,trackedDays:seenDays(first[norm(x.termino)]),lastDays:daysAgo(x.ultimaFecha)}));
  }

  function detectEvent(events,patterns){
    const list=Array.isArray(events)?events:[];
    const row=list.find(x=>patterns.some(r=>r.test(String(x.evento||''))));
    return row?Number(row.eventos)||0:null;
  }

  function setNotice(message,type){const e=$('globalNotice');e.textContent=message;e.className='notice '+(type==='bad'?'notice-bad':type==='warn'?'notice-warn':type==='ok'?'notice-ok':'notice-info');}

  function renderKpis(){
    const d=state.data7||{},sum=d.resumen||{},missing=d.busquedasSinResultadoPorSeccion||{};
    $('kpiUsers').textContent=fmt(sum.usuarios||0);
    $('kpiUsersSub').textContent=fmt(sum.sesiones||0)+' sesiones';
    $('kpiMissing').textContent=fmt(missing.totalBusquedas||0);
    $('kpiMissingSub').textContent=fmt(missing.totalTerminos||0)+' términos';
    $('kpiContent').textContent=state.content?fmt(state.content.dic.length+state.content.voc.length):'—';
    $('kpiContentSub').textContent=state.content?fmt(state.content.dic.length)+' Diccionario · '+fmt(state.content.voc.length)+' Vocabulario':'Cargando…';
    $('kpiAlerts').textContent=fmt(state.alerts.filter(a=>a.level!=='green').length);
    $('kpiAlertsSub').textContent=state.alerts.some(a=>a.level==='red')?'Hay elementos urgentes':'Sin fallos críticos';
  }

  function computeAlerts(){
    const alerts=[];
    state.workflows.forEach(w=>{
      if(w.state==='bad')alerts.push({level:'red',title:'Falló '+w.title,detail:'La última automatización terminó con error.',href:'estado.html'});
      else if(w.state==='warn')alerts.push({level:'yellow',title:w.title+' necesita revisión',detail:w.label==='Antigua'?'La última sincronización es más antigua de lo esperado.':'No se pudo confirmar su estado.',href:'estado.html'});
    });
    if(state.data7){
      const err=Number(state.data7.errores&&state.data7.errores.total)||0;
      if(err>=5)alerts.push({level:'red',title:fmt(err)+' errores técnicos en 7 días',detail:'Revisa errores de imagen, multimedia o JavaScript.',href:'busquedas.html#estadisticas'});
      else if(err>0)alerts.push({level:'yellow',title:fmt(err)+' error(es) técnico(s) reciente(s)',detail:'Conviene revisar la sección de Estadísticas.',href:'busquedas.html#estadisticas'});
      const miss=Number(state.data7.busquedasSinResultadoPorSeccion&&state.data7.busquedasSinResultadoPorSeccion.totalBusquedas)||0;
      if(miss>0)alerts.push({level:'yellow',title:fmt(miss)+' búsquedas sin resultado esta semana',detail:'El Admin ordenó las palabras con mayor demanda más abajo.',href:'#pendientes'});
    }
    if(state.audit){
      if(state.audit.duplicates.length)alerts.push({level:'red',title:fmt(state.audit.duplicates.length)+' posible(s) duplicado(s)',detail:'Se detectaron palabras repetidas dentro de la misma sección/categoría.',href:'#salud'});
      if(state.audit.missingImage.length)alerts.push({level:'yellow',title:fmt(state.audit.missingImage.length)+' fichas sin imagen',detail:'Las fichas sin imagen no cuentan como contenido visual completo.',href:'#salud'});
      if(state.audit.missingCategory.length)alerts.push({level:'yellow',title:fmt(state.audit.missingCategory.length)+' fichas sin categoría',detail:'Conviene corregir la clasificación del contenido.',href:'#salud'});
    }
    if(state.repo&&state.repo.dev&&state.repo.main&&state.repo.dev.commit&&state.repo.main.commit&&state.repo.dev.commit.sha!==state.repo.main.commit.sha){alerts.push({level:'yellow',title:'develop y main no están en el mismo commit',detail:'Hay cambios que podrían no estar todavía en la rama principal.',href:'#deploy'});}
    if(!alerts.some(a=>a.level==='red'||a.level==='yellow'))alerts.push({level:'green',title:'Sin alertas importantes',detail:'Las comprobaciones disponibles aparecen correctas.',href:'#salud'});
    state.alerts=alerts;
  }

  function renderAlerts(){
    const e=$('alertsList');
    if(!state.alerts.length){e.innerHTML='<div class="alert-empty">✅ No se detectaron alertas.</div>';return;}
    e.innerHTML=state.alerts.slice(0,8).map(a=>'<div class="alert-item '+a.level+'"><span class="alert-dot"></span><div class="alert-main"><b>'+esc(a.title)+'</b><span>'+esc(a.detail)+'</span></div><a class="alert-action" href="'+esc(a.href||'#')+'">Revisar →</a></div>').join('');
  }

  function renderTrends(){
    const e=$('trendGrid');
    if(!state.data7||!state.data30){e.innerHTML='<div class="skeleton h130"></div><div class="skeleton h130"></div><div class="skeleton h130"></div>';return;}
    const rows=trendItems(state.data7,state.data30);
    if(!rows.length){e.innerHTML='<div class="alert-empty" style="grid-column:1/-1">No hay suficiente actividad reciente para calcular tendencias.</div>';return;}
    e.innerHTML=rows.map((x,i)=>'<article class="card trend-card"><div class="trend-top"><div><div class="trend-rank">#'+(i+1)+'</div><div class="trend-word" title="'+esc(x.termino)+'">'+esc(x.termino)+'</div></div><span class="trend-badge '+(x.growth<0?'down':'')+'">'+(x.growth>=0?'↑ ':'↓ ')+pct(Math.abs(x.growth))+'</span></div><div class="trend-meta"><b>'+fmt(x.busquedas)+'</b> búsquedas en 7 días · '+esc([...x.secciones].join(' / ')||'—')+'</div><div class="trend-actions"><button type="button" data-copy-term="'+encodeURIComponent(x.termino)+'">Copiar</button><button type="button" data-create-term="'+encodeURIComponent(x.termino)+'">➕ Crear</button></div></article>').join('');
    wireTermButtons(e);
  }

  function renderPending(){
    const box=$('pendingTable');
    if(!state.dataAll){box.innerHTML='<div class="loading-inline">Cargando historial completo de búsquedas…</div>';return;}
    const rows=buildPending(state.dataAll).slice(0,30);
    if(!rows.length){box.innerHTML='<div class="alert-empty">✅ No hay pendientes registrados.</div>';return;}
    box.innerHTML='<table class="pending-table"><thead><tr><th>#</th><th>Palabra</th><th>Sección</th><th>Búsquedas</th><th>Última búsqueda</th><th>Seguimiento</th><th>Prioridad</th><th></th></tr></thead><tbody>'+rows.map((x,i)=>{const hot=x.busquedas>=10||x.lastDays===0;const warm=x.busquedas>=4||x.trackedDays>=7;const cls=hot?'state-hot':warm?'state-warm':'state-normal';const label=hot?'Alta':warm?'Media':'Normal';return '<tr><td>'+(i+1)+'</td><td><strong>'+esc(x.termino)+'</strong></td><td>'+esc([...x.secciones].join(' / ')||'—')+'</td><td><strong>'+fmt(x.busquedas)+'</strong></td><td>'+esc(gaDateLabel(x.ultimaFecha))+(x.lastDays!=null?'<div class="metric-meta">hace '+fmt(x.lastDays)+' día(s)</div>':'')+'</td><td>'+fmt(x.trackedDays)+' día(s)<div class="metric-meta">desde que este Admin lo sigue</div></td><td><span class="state '+cls+'">'+label+'</span></td><td><button class="create-btn" type="button" data-create-term="'+encodeURIComponent(x.termino)+'">➕ Crear</button></td></tr>';}).join('')+'</tbody></table>';
    wireTermButtons(box);
  }

  function renderContent(){
    if(!state.content)return;
    const cats=categories(state.content).slice(0,10),max=cats[0]?cats[0].count:1;
    $('categoryList').innerHTML=cats.map(x=>'<div class="metric-row"><div><div class="metric-name">'+esc(x.name)+'</div><div class="track"><span style="width:'+Math.max(4,(x.count/max)*100)+'%"></span></div></div><div class="metric-value">'+fmt(x.count)+'</div></div>').join('')||'<div class="metric-meta">Sin categorías.</div>';
    const pages=(state.data30&&state.data30.paginas)||[];const maxP=pages[0]?Number(pages[0].vistas)||1:1;
    $('pageListHome').innerHTML=pages.slice(0,10).map(x=>'<div class="metric-row"><div><div class="metric-name" title="'+esc(x.pagina)+'">'+esc(x.pagina||'—')+'</div><div class="track"><span style="width:'+Math.max(4,((Number(x.vistas)||0)/maxP)*100)+'%"></span></div></div><div class="metric-value">'+fmt(x.vistas)+'</div></div>').join('')||'<div class="metric-meta">Analytics todavía no devolvió páginas.</div>';
    const a=state.audit||auditContent(state.content);const total=a.total||1;const imgOk=total-a.missingImage.length,vidOk=total-a.missingVideo.length;
    $('contentQuality').innerHTML='<div class="quality-box"><strong>'+fmt(state.content.dic.length)+'</strong><span>Diccionario</span><small>Entradas públicas cargadas</small></div><div class="quality-box"><strong>'+fmt(state.content.voc.length)+'</strong><span>Vocabulario</span><small>Entradas públicas cargadas</small></div><div class="quality-box"><strong>'+Math.round(imgOk/total*100)+'%</strong><span>Con imagen</span><small>'+fmt(imgOk)+' de '+fmt(total)+'</small></div><div class="quality-box"><strong>'+Math.round(vidOk/total*100)+'%</strong><span>Con video</span><small>'+fmt(vidOk)+' de '+fmt(total)+'</small></div>';
  }

  function renderFunnel(){
    const d=state.data30||{};const searches=Number(d.busquedasPorSeccion&&d.busquedasPorSeccion.totalBusquedas)||Number(d.busquedasPopulares&&d.busquedasPopulares.totalBusquedas)||0;const misses=Number(d.busquedasSinResultadoPorSeccion&&d.busquedasSinResultadoPorSeccion.totalBusquedas)||0;const useful=Math.max(0,searches-misses);const ev=d.eventos||[];
    const opens=detectEvent(ev,[/open.*(?:word|ficha|entry)/i,/(?:word|ficha|entry).*open/i,/select_content/i,/view_item/i]);
    const videos=detectEvent(ev,[/video.*(?:play|start)/i,/(?:play|start).*video/i,/youtube.*(?:play|start)/i]);
    const step=(label,val,sub)=>'<div class="funnel-step"><div class="funnel-label">'+esc(label)+'</div><div class="funnel-value">'+(val==null?'—':fmt(val))+'</div><div class="funnel-sub">'+esc(sub)+'</div></div>';
    $('funnel').innerHTML=step('Búsquedas',searches,'Intentos registrados en 30 días')+step('Con resultado',useful,'Estimación: búsquedas menos búsquedas sin resultado')+step('Ficha abierta',opens,opens==null?'La telemetría actual no expone un evento inequívoco de apertura de ficha':'Evento detectado automáticamente')+step('Video reproducido',videos,videos==null?'La telemetría actual no expone un evento inequívoco de reproducción':'Evento detectado automáticamente');
  }

  function renderAudit(){
    if(!state.audit){$('auditGrid').innerHTML='<div class="skeleton h130"></div><div class="skeleton h130"></div>';return;}
    const a=state.audit;
    const card=(title,n,cls,desc,items)=>'<article class="card audit-card"><h3>'+esc(title)+'</h3><strong class="'+cls+'">'+fmt(n)+'</strong><p>'+esc(desc)+'</p>'+(items&&items.length?'<ul class="audit-list">'+items.slice(0,5).map(x=>'<li>'+esc(x.palabra||wordOf(x.x)||String(x))+'</li>').join('')+'</ul>':'')+'</article>';
    $('auditGrid').innerHTML=card('Posibles duplicados',a.duplicates.length,a.duplicates.length?'bad':'good','Misma palabra, sección y categoría.',a.duplicates)+card('Sin imagen',a.missingImage.length,a.missingImage.length?'warn':'good','Fichas sin una ruta de imagen reconocible.',a.missingImage)+card('Sin video',a.missingVideo.length,a.missingVideo.length?'warn':'good','Puede ser válido en Diccionario; revisar según el tipo.',a.missingVideo)+card('Sin categoría',a.missingCategory.length,a.missingCategory.length?'bad':'good','Contenido que necesita clasificación.',a.missingCategory)+card('Diccionario sin definición',a.missingDefinition.length,a.missingDefinition.length?'bad':'good','Entradas sin concepto/definición detectable.',a.missingDefinition)+card('Filas sin palabra',a.brokenNames.length,a.brokenNames.length?'bad':'good','Registros sin nombre de contenido.',a.brokenNames);
  }

  function renderDeploy(){
    const r=state.repo;if(!r){$('deployGrid').innerHTML='<div class="notice notice-warn" style="grid-column:1/-1">No se pudo consultar GitHub.</div>';return;}
    const devSha=r.dev&&r.dev.commit&&r.dev.commit.sha||'';const mainSha=r.main&&r.main.commit&&r.main.commit.sha||'';const same=devSha&&mainSha&&devSha===mainSha;const source=r.pages&&r.pages.source?((r.pages.source.branch||'—')+' / '+(r.pages.source.path||'/')):'No confirmado';
    $('deployGrid').innerHTML='<article class="card deploy-card"><h3>develop</h3><strong class="deploy-sha">'+esc(devSha?devSha.slice(0,8):'—')+'</strong><p>Commit actual de trabajo.</p></article><article class="card deploy-card"><h3>main</h3><strong class="deploy-sha">'+esc(mainSha?mainSha.slice(0,8):'—')+'</strong><p class="'+(same?'good':'warn')+'">'+(same?'Está alineada con develop.':'Es diferente de develop.')+'</p></article><article class="card deploy-card"><h3>GitHub Pages</h3><strong style="font-size:14px">'+esc(source)+'</strong><p>Fuente de publicación detectada por GitHub.</p></article><article class="card deploy-card"><h3>PWA visible</h3><strong>'+esc(r.liveVersion)+'</strong><p>Versión detectada en el Service Worker servido por el sitio.</p></article><article class="card deploy-card"><h3>PWA develop</h3><strong>'+esc(r.devVersion)+'</strong><p class="'+(r.liveVersion===r.devVersion?'good':'warn')+'">'+(r.liveVersion===r.devVersion?'Coincide con la versión visible.':'La versión visible y develop no coinciden.')+'</p></article><article class="card deploy-card"><h3>Rama por defecto</h3><strong style="font-size:17px">'+esc(r.repo&&r.repo.default_branch||'—')+'</strong><p>Configuración del repositorio.</p></article>';
  }

  async function testResources(){
    if(!state.content)return;
    const btn=$('btnAuditResources');btn.disabled=true;btn.textContent='Probando…';
    const rows=[...state.content.dic,...state.content.voc].filter(x=>imageReal(x.imagen)).slice(0,30);
    let failed=0,ok=0;
    for(const x of rows){
      const path=text(x.imagen).split(',')[0].trim();
      let url=path;
      if(!/^https?:/i.test(path))url='../'+path.replace(/^\.\/?/,'').replace(/^\//,'');
      try{const r=await fetch(url,{method:'GET',cache:'no-store'});if(r.ok)ok++;else failed++;}catch(_e){failed++;}
    }
    btn.disabled=false;btn.textContent='Probar recursos';
    const old=$('resourceAuditResult');if(old)old.remove();
    const div=document.createElement('div');div.id='resourceAuditResult';div.className='notice '+(failed?'notice-warn':'notice-ok');div.style.marginTop='10px';div.textContent='Muestra de recursos: '+ok+' accesibles · '+failed+' con error, sobre '+rows.length+' imágenes probadas.';$('auditGrid').insertAdjacentElement('afterend',div);
  }

  function wireTermButtons(root){
    root.querySelectorAll('[data-copy-term]').forEach(b=>b.addEventListener('click',async()=>{const term=decodeURIComponent(b.dataset.copyTerm||'');try{await navigator.clipboard.writeText(term);b.textContent='✓ Copiado';setTimeout(()=>b.textContent='Copiar',900);}catch(_e){}}));
    root.querySelectorAll('[data-create-term]').forEach(b=>b.addEventListener('click',()=>openPublisher(decodeURIComponent(b.dataset.createTerm||''))));
  }

  async function openPublisher(term){
    state.publisherUrl=text(localStorage.getItem(STORE_PUBLISHER));
    if(!state.publisherUrl){openPublisherModal();return;}
    if(term){try{await navigator.clipboard.writeText(term);}catch(_e){}}
    let url=state.publisherUrl;
    try{const u=new URL(url);if(term)u.searchParams.set('lsp_prefill',term);url=u.toString();}catch(_e){}
    window.open(url,'_blank','noopener');
    if(term)setNotice('“'+term+'” fue copiada. Se abrió el Publicador para que puedas crearla.','ok');
  }

  function openPublisherModal(){state.publisherUrl=text(localStorage.getItem(STORE_PUBLISHER));$('publisherUrl').value=state.publisherUrl;$('publisherModal').classList.remove('d-none');}
  function closePublisherModal(){$('publisherModal').classList.add('d-none');}
  function savePublisher(){const u=text($('publisherUrl').value);if(u&&!validApiUrl(u.split('?')[0])){alert('La URL debe ser una implementación /exec oficial de Google Apps Script.');return;}if(u)localStorage.setItem(STORE_PUBLISHER,u);else localStorage.removeItem(STORE_PUBLISHER);state.publisherUrl=u;closePublisherModal();setNotice(u?'URL privada del Publicador guardada solo en este navegador.':'Se quitó la URL del Publicador.','ok');}

  function lock(){state.locked=true;state.key='';try{sessionStorage.removeItem(SESSION_KEY);}catch(_e){};$('unlockKey').value='';$('lockScreen').classList.remove('d-none');}
  async function unlock(){const key=text($('unlockKey').value);if(!key)return;const c=readCredentials();const api=state.api||c.api;if(!api){forgetCredentials();$('lockScreen').classList.add('d-none');return;}const btn=$('btnUnlock');btn.disabled=true;btn.textContent='Comprobando…';try{await probeAccess(api,key);state.api=api;state.key=key;state.locked=false;sessionStorage.setItem(SESSION_KEY,key);$('lockScreen').classList.add('d-none');btn.textContent='Desbloquear';btn.disabled=false;resetAutolock();}catch(e){btn.textContent='Clave incorrecta';btn.disabled=false;setTimeout(()=>btn.textContent='Desbloquear',1300);}}
  let lockTimer=null;function resetAutolock(){clearTimeout(lockTimer);if(!state.locked&&state.key)lockTimer=setTimeout(lock,AUTOLOCK_MS);}

  async function connect(){
    const api=text($('apiUrl').value),key=text($('adminKey').value),remember=$('rememberAccess').checked;
    if(!validApiUrl(api)){setNotice('La URL debe ser una implementación /exec oficial de Google Apps Script.','bad');return;}
    if(!key){setNotice('Escribe la clave privada del Admin.','bad');return;}
    const btn=$('btnConnect');
    btn.disabled=true;btn.textContent='Comprobando acceso…';
    $('accessStatus').textContent='Comprobando';
    setNotice('Validando la URL y la clave. Esto debe tomar solo unos segundos.','info');
    try{
      await probeAccess(api,key);
      state.api=api;state.key=key;state.remember=remember;
      saveCredentials(api,key,remember);
      $('accessStatus').textContent='Conectado';
      $('accessPanel').classList.add('d-none');
      $('dashboard').classList.remove('d-none');
      btn.textContent='Entrar';btn.disabled=false;
      setNotice('Acceso correcto. Cargando primero los indicadores esenciales…','info');
      // La carga pesada ocurre después de entrar y ya no bloquea el acceso.
      loadAll(false).catch(e=>{
        setNotice('El acceso es correcto, pero Analytics no pudo terminar de cargar: '+e.message,'bad');
        $('btnRefresh').disabled=false;
      });
    }catch(e){
      btn.disabled=false;btn.textContent='Entrar';
      $('accessStatus').textContent='Sin conectar';
      const msg=String(e&&e.message||'No se pudo conectar.');
      if(/Clave incorrecta/i.test(msg))setNotice('La URL respondió, pero la clave privada no es correcta.','bad');
      else setNotice(msg,'bad');
    }
  }

  function progressMessage(){
    if(state.data7&&state.content&&!state.data30)return 'Indicadores esenciales listos. Cargando tendencias y páginas de 30 días…';
    if(state.data30&&!state.dataAll)return 'Resumen y tendencias listos. Cargando historial completo en segundo plano…';
    if(state.dataAll)return '✅ Panel actualizado. Los datos pesados se cargaron de forma progresiva y quedan en caché durante 5 minutos.';
    return 'Cargando primero los indicadores esenciales. Los análisis pesados aparecerán después.';
  }

  async function loadAll(force){
    const token=++state.loadToken;state.lastLoaded=Date.now();resetAutolock();
    $('btnRefresh').disabled=true;$('freshness').textContent='Actualizando…';setNotice('Cargando el panel…','info');
    state.alerts=[];renderKpis();

    // Contenido y estado del repositorio nunca deben depender de Analytics.
    const contentP=loadContent().then(c=>{if(token!==state.loadToken)return;state.content=c;state.audit=auditContent(c);renderContent();renderAudit();computeAlerts();renderAlerts();renderKpis();}).catch(()=>{});
    const repoP=Promise.all([loadRepo(),loadWorkflows()]).then(([r,w])=>{if(token!==state.loadToken)return;state.repo=r;state.workflows=w;renderDeploy();computeAlerts();renderAlerts();renderKpis();}).catch(()=>{});

    // Los tres períodos son independientes. Antes se ejecutaban uno detrás de
    // otro: si 7 días tardaba/fallaba, 30 días y el historial nunca aparecían.
    // En paralelo, cada bloque se muestra apenas su consulta termina.
    const p7=analytics('7',force).then(d=>{
      if(token!==state.loadToken)return;state.data7=d;renderKpis();computeAlerts();renderAlerts();
    }).catch(e=>{
      if(token!==state.loadToken)return;
      setNotice('No se pudieron cargar los indicadores de 7 días: '+e.message,'warn');
    });
    const p30=analytics('30',force).then(d=>{
      if(token!==state.loadToken)return;state.data30=d;renderTrends();renderContent();renderFunnel();
    }).catch(e=>{
      if(token!==state.loadToken)return;
      $('trendGrid').innerHTML='<div class="notice notice-warn" style="grid-column:1/-1">No se pudo cargar el análisis de 30 días: '+esc(e.message)+'</div>';
    });
    const pAll=analytics('todo',force).then(d=>{
      if(token!==state.loadToken)return;state.dataAll=d;renderPending();
    }).catch(e=>{
      if(token!==state.loadToken)return;
      $('pendingTable').innerHTML='<div class="notice notice-warn">No se pudo cargar el historial completo: '+esc(e.message)+'</div>';
    });

    await Promise.allSettled([p7,p30,pAll,contentP,repoP]);
    if(token!==state.loadToken)return;
    computeAlerts();renderAlerts();renderKpis();renderContent();
    const analyticsOk=[state.data7,state.data30,state.dataAll].filter(Boolean).length;
    if(analyticsOk===3)setNotice('✅ Panel actualizado. Todos los períodos de Analytics están disponibles.','ok');
    else if(analyticsOk)setNotice('El panel cargó parcialmente: '+analyticsOk+' de 3 períodos de Analytics respondieron. Puedes pulsar Actualizar para reintentar lo que falta.','warn');
    else setNotice('El contenido del Admin cargó, pero Analytics no respondió. Pulsa Actualizar para reintentar.','bad');
    $('freshness').textContent='Actualizado '+new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit'}).format(new Date());
    $('btnRefresh').disabled=false;
  }

  function initEvents(){
    $('btnConnect').addEventListener('click',connect);
    $('btnRefresh').addEventListener('click',()=>{cacheClear();loadAll(true);});
    $('btnClearCache').addEventListener('click',()=>{cacheClear();setNotice('Caché del Admin vaciada. La próxima actualización consultará Analytics otra vez.','ok');});
    $('btnForget').addEventListener('click',()=>{if(confirm('¿Olvidar la URL y la clave de este navegador?'))forgetCredentials();});
    $('btnLock').addEventListener('click',lock);$('btnUnlock').addEventListener('click',unlock);$('unlockKey').addEventListener('keydown',e=>{if(e.key==='Enter')unlock();});
    $('btnPublisherSettings').addEventListener('click',openPublisherModal);$('btnOpenPublisher').addEventListener('click',()=>openPublisher(''));$('btnClosePublisherModal').addEventListener('click',closePublisherModal);$('btnSavePublisher').addEventListener('click',savePublisher);$('btnRemovePublisher').addEventListener('click',()=>{$('publisherUrl').value='';savePublisher();});$('publisherModal').addEventListener('click',e=>{if(e.target===$('publisherModal'))closePublisherModal();});
    $('btnAuditResources').addEventListener('click',testResources);
    ['pointerdown','keydown','scroll','touchstart'].forEach(ev=>window.addEventListener(ev,resetAutolock,{passive:true}));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resetAutolock();});
  }

  async function init(){
    initEvents();state.publisherUrl=text(localStorage.getItem(STORE_PUBLISHER));
    const c=readCredentials();state.api=c.api;state.key=c.key;state.remember=c.remember;
    $('apiUrl').value=c.api;$('adminKey').value=c.key;$('rememberAccess').checked=c.remember;
    if(c.api&&c.key&&validApiUrl(c.api)){
      $('accessPanel').classList.remove('d-none');$('dashboard').classList.add('d-none');
      $('accessStatus').textContent='Comprobando';
      $('btnConnect').disabled=true;$('btnConnect').textContent='Comprobando acceso…';
      try{
        await probeAccess(c.api,c.key);
        $('accessStatus').textContent='Conectado';
        $('accessPanel').classList.add('d-none');$('dashboard').classList.remove('d-none');
        $('btnConnect').disabled=false;$('btnConnect').textContent='Entrar';
        loadAll(false).catch(e=>{setNotice('El acceso es correcto, pero Analytics no pudo terminar de cargar: '+e.message,'bad');$('btnRefresh').disabled=false;});
      }catch(e){
        $('btnConnect').disabled=false;$('btnConnect').textContent='Entrar';
        $('accessStatus').textContent='Sin conectar';
        $('accessPanel').classList.remove('d-none');$('dashboard').classList.add('d-none');
        setNotice(String(e&&e.message||'No se pudo conectar.'),'bad');
      }
    }else{
      $('accessPanel').classList.remove('d-none');$('dashboard').classList.add('d-none');
    }
    resetAutolock();
  }

  init();
})();
