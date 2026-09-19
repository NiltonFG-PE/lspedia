/* LSPedia Admin — historial persistente de búsquedas y ayuda para interpretar Analytics.
   Trabaja sobre el panel existente: la cola de pendientes consulta siempre
   desde el inicio del registro, aunque Estadísticas use otro periodo. */
(function(){
  'use strict';
  const INICIO='10 sep 2026';
  const STORE_URL='lspedia_admin_busquedas_api_v1';
  const SESSION_KEY='lspedia_admin_busquedas_key_v1';
  const STORE_ACCESS='lspedia_admin_access_v2';
  let historial=[],filtro='pending',consulta='',indice=null,cargando=false;
  const $=id=>document.getElementById(id);
  const texto=v=>String(v==null?'':v).trim();
  const norm=v=>texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toLocaleLowerCase('es-PE').trim();
  const fmt=v=>new Intl.NumberFormat('es-PE').format(Number(v)||0);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function fecha(v){const s=texto(v);if(!/^\d{8}$/.test(s))return'—';const d=new Date(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8));return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(d);}

  function credenciales(){
    let api='',key='';
    try{const r=JSON.parse(localStorage.getItem(STORE_ACCESS)||'null');if(r&&r.api&&r.key){api=texto(r.api);key=texto(r.key);}}catch(_e){}
    if(!api)try{api=texto(localStorage.getItem(STORE_URL));}catch(_e){}
    if(!key)try{key=texto(sessionStorage.getItem(SESSION_KEY));}catch(_e){}
    const apiEl=$('apiUrl'),keyEl=$('adminKey');
    if(apiEl&&texto(apiEl.value))api=texto(apiEl.value);
    if(keyEl&&texto(keyEl.value))key=texto(keyEl.value);
    return{api,key};
  }

  function jsonp(api,key){
    return new Promise((resolve,reject)=>{
      let u;try{u=new URL(api);}catch(_e){reject(new Error('URL inválida'));return;}
      const cb='lspHistorialCb_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
      const s=document.createElement('script');let fin=false;
      const limpiar=()=>{try{delete window[cb];}catch(_e){}s.remove();clearTimeout(timer);};
      window[cb]=d=>{if(fin)return;fin=true;limpiar();resolve(d);};
      u.searchParams.set('modo','admin_analytics');u.searchParams.set('key',key);u.searchParams.set('periodo','todo');u.searchParams.set('callback',cb);u.searchParams.set('_',String(Date.now()));
      s.src=u.toString();s.async=true;
      s.onerror=()=>{if(fin)return;fin=true;limpiar();reject(new Error('No se pudo cargar el historial.'));};
      const timer=setTimeout(()=>{if(fin)return;fin=true;limpiar();reject(new Error('Tiempo de espera agotado.'));},30000);
      document.head.appendChild(s);
    });
  }

  async function cargarIndice(){
    try{
      const m=Date.now();
      const[d,v,a]=await Promise.all([
        fetch('../data/palabras.json?_='+m,{cache:'no-store'}).then(r=>r.ok?r.json():[]),
        fetch('../data/vocabulario.json?_='+m,{cache:'no-store'}).then(r=>r.ok?r.json():[]),
        fetch('../data/busqueda-ayudas.json?_='+m,{cache:'no-store'}).then(r=>r.ok?r.json():{})
      ]);
      if(window.LSPediaDiagnosticoBusquedas)indice=window.LSPediaDiagnosticoBusquedas.construirIndice(d,v,a);
    }catch(_e){indice=null;}
  }

  function inferirSeccion(termino,seccion){
    if(texto(seccion))return texto(seccion);
    if(!indice)return'Histórico';
    const q=norm(termino);
    const regs=(indice.registros||[]).filter(r=>r.palabraNorm===q||(r.variantesNorm||[]).includes(q));
    const tipos=[...new Set(regs.map(r=>r.seccion).filter(Boolean))];
    return tipos.length===1?tipos[0]:'Histórico';
  }
  function revisar(termino,seccion){
    if(indice&&window.LSPediaDiagnosticoBusquedas)return window.LSPediaDiagnosticoBusquedas.analizar(indice,termino,seccion||'');
    return{tipo:'falta',etiqueta:'Por revisar',sugerencia:'',detalle:'',resuelto:false};
  }

  function combinar(data){
    const mapa=new Map();
    const nuevos=((data.busquedasSinResultadoPorSeccion||{}).items||[]);
    const antiguos=((data.busquedas||{}).items||[]);
    nuevos.forEach(x=>{
      const t=texto(x.termino);if(!t)return;
      const sec=inferirSeccion(t,x.seccion),k=norm(sec)+'\u0000'+norm(t);
      mapa.set(k,{termino:t,seccion:sec,busquedas:Number(x.busquedas)||0,ultimaFecha:texto(x.ultimaFecha),fuente:'seccion'});
    });
    antiguos.forEach(x=>{
      const t=texto(x.termino);if(!t)return;
      const sec=inferirSeccion(t,'');
      const coincidencia=[...mapa.entries()].find(([_,v])=>norm(v.termino)===norm(t));
      if(coincidencia){
        const v=coincidencia[1];v.busquedas=Math.max(v.busquedas,Number(x.busquedas)||0);if(texto(x.ultimaFecha)>v.ultimaFecha)v.ultimaFecha=texto(x.ultimaFecha);
      }else{
        const k=norm(sec)+'\u0000'+norm(t);mapa.set(k,{termino:t,seccion:sec,busquedas:Number(x.busquedas)||0,ultimaFecha:texto(x.ultimaFecha),fuente:'historica'});
      }
    });
    return[...mapa.values()].map(x=>{const r=revisar(x.termino,x.seccion==='Histórico'?'':x.seccion);return{...x,revision:r,resuelta:!!r.resuelto};}).sort((a,b)=>b.busquedas-a.busquedas||String(b.ultimaFecha).localeCompare(String(a.ultimaFecha)));
  }

  function filasFiltradas(){
    const q=norm(consulta);
    return historial.filter(x=>{
      if(filtro==='pending'&&x.resuelta)return false;
      if(filtro==='added'&&!x.resuelta)return false;
      return!q||norm(x.termino).includes(q)||norm(x.seccion).includes(q)||norm(x.revision&&x.revision.sugerencia).includes(q);
    });
  }

  function revisionHtml(x){
    const r=x.revision||{};
    const clase=({gramatica:'review-grammar',correccion:'review-correction',existente:'review-existing',prediccion:'review-prediction',falta:'review-missing'})[r.tipo]||'review-missing';
    return'<div class="review-cell"><div class="review-main"><span class="state '+clase+'">'+esc(r.etiqueta||'Revisar')+'</span>'+(r.sugerencia?'<strong> → '+esc(r.sugerencia)+'</strong>':'')+'</div>'+(r.detalle?'<div class="review-detail">'+esc(r.detalle)+'</div>':'')+'</div>';
  }

  function render(){
    const body=$('searchTableBody'),wrap=$('searchTableWrap'),empty=$('searchEmpty'),priority=$('priorityList');if(!body||!wrap||!empty)return;
    const rows=filasFiltradas();
    body.innerHTML=rows.map((x,i)=>'<tr><td class="muted">'+(i+1)+'</td><td><strong>'+esc(x.termino)+'</strong></td><td><span class="state">'+esc(x.seccion)+'</span></td><td>'+revisionHtml(x)+'</td><td><strong>'+fmt(x.busquedas)+'</strong></td><td>'+esc(fecha(x.ultimaFecha))+'</td><td><span class="state '+(x.resuelta?'state-added':'state-pending')+'">'+(x.resuelta?'✓ Resuelta':'● Pendiente')+'</span></td><td><button class="copy-btn" type="button" data-hist-copy="'+encodeURIComponent(x.termino)+'">Copiar</button></td></tr>').join('');
    wrap.classList.toggle('d-none',rows.length===0);empty.classList.toggle('d-none',rows.length!==0);
    body.querySelectorAll('[data-hist-copy]').forEach(b=>b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(decodeURIComponent(b.dataset.histCopy||''));b.textContent='✓';setTimeout(()=>b.textContent='Copiar',900);}catch(_e){}}));
    if(priority){
      const top=historial.filter(x=>!x.resuelta).slice(0,5);
      priority.innerHTML=top.length?top.map((x,i)=>'<div class="priority-item"><div class="priority-num">#'+(i+1)+'</div><div class="priority-term" title="'+esc(x.termino)+'">'+esc(x.termino)+'</div><div class="priority-count">'+fmt(x.busquedas)+' búsqueda'+(x.busquedas===1?'':'s')+' · '+esc(x.seccion)+'</div></div>').join(''):'<div class="empty" style="grid-column:1/-1"><strong>No hay palabras pendientes.</strong><span>Las nuevas búsquedas sin resultado aparecerán aquí.</span></div>';
    }
    renderResumen();
  }

  function renderResumen(){
    let caja=$('lspHistorialResumen');
    if(!caja){
      const titulo=[...document.querySelectorAll('.section-title h2')].find(x=>/Búsquedas sin resultado/i.test(x.textContent||''));const bloque=titulo&&titulo.closest('.section-title');if(!bloque)return;
      caja=document.createElement('div');caja.id='lspHistorialResumen';caja.className='lsp-historial-resumen card';bloque.insertAdjacentElement('afterend',caja);
    }
    const pendientes=historial.filter(x=>!x.resuelta),intentos=historial.reduce((s,x)=>s+(Number(x.busquedas)||0),0),pendientesIntentos=pendientes.reduce((s,x)=>s+(Number(x.busquedas)||0),0);
    caja.innerHTML='<strong>Historial desde '+INICIO+'</strong><span><b>'+fmt(historial.length)+'</b> términos registrados · <b>'+fmt(intentos)+'</b> intentos acumulados · <b>'+fmt(pendientes.length)+'</b> pendientes ('+fmt(pendientesIntentos)+' intentos).</span><small>Una búsqueda permanece pendiente hasta que la palabra o su equivalente tenga video. Cambiar el periodo de Estadísticas no borra esta cola.</small>';
  }

  function explicarEstadisticas(){
    if($('lspAyudaEstadisticas'))return;
    const panel=$('tabEstadisticas');if(!panel)return;
    const ayuda=document.createElement('details');ayuda.id='lspAyudaEstadisticas';ayuda.className='card lsp-ayuda-stats';
    ayuda.innerHTML='<summary>ℹ️ Cómo entender estas estadísticas</summary><div class="lsp-ayuda-grid">'+
      '<div><b>Usuarios</b><span>Usuarios activos que GA4 reconoce. No equivale exactamente a personas físicas únicas.</span></div>'+
      '<div><b>Visitas (sesiones)</b><span>Entradas o periodos de uso. Un mismo usuario puede generar varias visitas.</span></div>'+
      '<div><b>Páginas vistas</b><span>Cada visualización de página; las repeticiones cuentan.</span></div>'+
      '<div><b>Interacciones</b><span>Acciones registradas: páginas, videos, clics y otros eventos. No son usuarios.</span></div>'+
      '<div><b>Sesiones con interacción</b><span>Visitas en las que hubo actividad significativa según GA4.</span></div>'+
      '<div><b>Tasa de interacción</b><span>Porcentaje de sesiones con interacción significativa.</span></div>'+
      '<div><b>Búsquedas sin resultado</b><span>Intentos que no encontraron resultado. Una misma palabra puede sumar varias veces.</span></div>'+
      '<div><b>Errores técnicos</b><span>Ocurrencias de fallos de imagen, multimedia o JavaScript. No son usuarios afectados.</span></div>'+
      '<div><b>Realtime</b><span>Actividad aproximada de los últimos 30 minutos, no un contador segundo a segundo.</span></div>'+
      '<div><b>Actividad diaria</b><span>Sesiones por día. La suma diaria de usuarios puede repetir a una persona en días distintos.</span></div></div>';
    panel.insertBefore(ayuda,panel.firstChild);
    const nores=$('sumNoResults');if(nores&&nores.parentElement){const sub=nores.parentElement.querySelector('.stat-sub');if(sub)sub.textContent='Intentos sin resultado; una palabra puede repetirse';}
    const errs=$('sumErrors');if(errs&&errs.parentElement){const sub=errs.parentElement.querySelector('.stat-sub');if(sub)sub.textContent='Ocurrencias de fallos, no usuarios afectados';}
  }

  function instalarEstilos(){
    if($('lspHistorialStyles'))return;
    const s=document.createElement('style');s.id='lspHistorialStyles';s.textContent='.lsp-historial-resumen{padding:14px 16px;margin:-1px 0 13px;display:grid;gap:5px;border-left:4px solid #0284c7}.lsp-historial-resumen strong{font-size:14px}.lsp-historial-resumen span{font-size:12px;color:#334155;line-height:1.45}.lsp-historial-resumen small{font-size:11px;color:#64748b;line-height:1.45}.lsp-ayuda-stats{padding:14px 16px;margin-bottom:18px}.lsp-ayuda-stats summary{cursor:pointer;font-weight:900;font-size:14px}.lsp-ayuda-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:13px}.lsp-ayuda-grid>div{background:#f8fafc;border:1px solid #e5eaf0;border-radius:11px;padding:10px}.lsp-ayuda-grid b{display:block;font-size:12px;margin-bottom:4px}.lsp-ayuda-grid span{font-size:11px;color:#64748b;line-height:1.4;display:block}@media(max-width:720px){.lsp-ayuda-grid{grid-template-columns:1fr}.lsp-historial-resumen{margin-top:0}}';document.head.appendChild(s);
  }

  function csv(){
    const rows=filasFiltradas();if(!rows.length)return;
    const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const lines=[['N','Palabra','Seccion','Revision','Sugerencia','Busquedas','Ultima busqueda','Estado'].map(q).join(',')];
    rows.forEach((x,i)=>lines.push([i+1,x.termino,x.seccion,x.revision&&x.revision.etiqueta||'',x.revision&&x.revision.sugerencia||'',x.busquedas,fecha(x.ultimaFecha),x.resuelta?'Resuelta':'Pendiente'].map(q).join(',')));
    const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lspedia-historial-busquedas.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0);
  }

  function instalarControles(){
    document.querySelectorAll('.filter-btn').forEach(btn=>btn.addEventListener('click',ev=>{if(!historial.length)return;ev.preventDefault();ev.stopImmediatePropagation();document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');filtro=btn.dataset.filter||'all';render();},true));
    const busc=$('tableSearch');if(busc)busc.addEventListener('input',ev=>{if(!historial.length)return;ev.stopImmediatePropagation();consulta=busc.value;render();},true);
    const btnCsv=$('btnCsv');if(btnCsv)btnCsv.addEventListener('click',ev=>{if(!historial.length)return;ev.preventDefault();ev.stopImmediatePropagation();csv();},true);
    const top=$('btnCopyTop');if(top)top.addEventListener('click',async ev=>{if(!historial.length)return;ev.preventDefault();ev.stopImmediatePropagation();const items=historial.filter(x=>!x.resuelta).slice(0,5),t=items.map((x,i)=>(i+1)+'. '+x.termino+' — '+x.busquedas+' búsqueda'+(x.busquedas===1?'':'s')).join('\n');if(!t)return;try{await navigator.clipboard.writeText(t);top.textContent='✓ Copiado';setTimeout(()=>top.textContent='Copiar top 5',1000);}catch(_e){}},true);
  }

  async function actualizarHistorial(){
    if(cargando)return;cargando=true;
    try{const c=credenciales();if(!c.api||!c.key)return;if(!indice)await cargarIndice();const data=await jsonp(c.api,c.key);if(!data||data.ok!==true)return;historial=combinar(data);render();}
    catch(e){console.warn('[LSPedia Admin] No se pudo actualizar historial persistente:',e&&e.message||e);}
    finally{cargando=false;}
  }

  function iniciar(){
    instalarEstilos();explicarEstadisticas();instalarControles();setTimeout(actualizarHistorial,900);
    const refrescar=$('btnRefresh');if(refrescar)refrescar.addEventListener('click',()=>setTimeout(actualizarHistorial,900));
    const conectar=$('btnConnect');if(conectar)conectar.addEventListener('click',()=>setTimeout(actualizarHistorial,1200));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(actualizarHistorial,300);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();

/* ADMIN_NAVEGACION_MOVIL_Y_PUBLICADOR_V2_20260919
   Añade Inicio, navegación inferior móvil y acción directa hacia el Publicador
   sin guardar la URL privada en GitHub. */
(function(){
  'use strict';
  const STORE_PUBLISHER='lspedia_admin_publisher_url_v1';
  const texto=v=>String(v==null?'':v).trim();

  function instalarEstilos(){
    if(document.getElementById('lspAdminNavV2Styles'))return;
    const s=document.createElement('style');s.id='lspAdminNavV2Styles';
    s.textContent='.lsp-admin-mobile-nav{display:none}@media(max-width:720px){body{padding-bottom:72px}.lsp-admin-mobile-nav{display:grid;grid-template-columns:repeat(4,1fr);position:fixed;left:0;right:0;bottom:0;z-index:90;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid #dce3ec;padding:6px 5px calc(6px + env(safe-area-inset-bottom));box-shadow:0 -6px 20px rgba(15,23,42,.08)}.lsp-admin-mobile-nav a{text-decoration:none;color:#64748b;text-align:center;font-size:9px;font-weight:800;padding:5px 2px;border-radius:10px}.lsp-admin-mobile-nav a span{display:block;font-size:18px;margin-bottom:2px}.lsp-admin-mobile-nav a.active{color:#0f6fb0;background:#eef8ff}.lsp-create-btn{margin-left:5px;border:1px solid #cde5f5;background:#eef8ff;color:#0f6fb0;border-radius:8px;padding:6px 8px;font-size:10px;font-weight:900}}';
    document.head.appendChild(s);
  }

  function instalarInicio(){
    const nav=document.querySelector('.admin-nav');if(!nav)return;
    if(!nav.querySelector('a[href="./"]')){const a=document.createElement('a');a.href='./';a.textContent='🏠 Inicio';nav.insertBefore(a,nav.firstChild);}
  }

  function instalarNavMovil(){
    if(document.querySelector('.lsp-admin-mobile-nav'))return;
    const n=document.createElement('nav');n.className='lsp-admin-mobile-nav';n.setAttribute('aria-label','Navegación móvil');
    n.innerHTML='<a href="./"><span>🏠</span>Inicio</a><a href="busquedas.html#busquedas"><span>🔎</span>Búsquedas</a><a href="busquedas.html#estadisticas"><span>📊</span>Estadísticas</a><a href="estado.html"><span>🩺</span>Estado</a>';
    document.body.appendChild(n);actualizarActivo(n);window.addEventListener('hashchange',()=>actualizarActivo(n));
  }

  function actualizarActivo(nav){
    const h=location.hash||'#busquedas';
    nav.querySelectorAll('a').forEach(a=>a.classList.remove('active'));
    const sel=h==='#estadisticas'?'a[href="busquedas.html#estadisticas"]':'a[href="busquedas.html#busquedas"]';
    const a=nav.querySelector(sel);if(a)a.classList.add('active');
  }

  function urlValida(u){try{const x=new URL(u);return x.protocol==='https:'&&x.hostname==='script.google.com'&&/^\/macros\/s\/[^/]+\/exec\/?$/.test(x.pathname);}catch(_e){return false;}}

  async function abrirPublicador(termino){
    let u=texto(localStorage.getItem(STORE_PUBLISHER));
    if(!u){u=texto(prompt('Pega una sola vez la URL privada completa de tu Publicador LSPedia:')||'');if(!u)return;if(!urlValida(u.split('?')[0])){alert('La URL debe ser una implementación /exec oficial de Google Apps Script.');return;}localStorage.setItem(STORE_PUBLISHER,u);}
    try{await navigator.clipboard.writeText(termino);}catch(_e){}
    try{const x=new URL(u);x.searchParams.set('lsp_prefill',termino);u=x.toString();}catch(_e){}
    window.open(u,'_blank','noopener');
  }

  function enriquecerTabla(){
    const body=document.getElementById('searchTableBody');if(!body)return;
    body.querySelectorAll('tr').forEach(tr=>{
      const cells=tr.querySelectorAll('td');if(cells.length<2)return;
      const last=cells[cells.length-1];if(last.querySelector('.lsp-create-btn'))return;
      const termino=texto(cells[1].querySelector('strong')?cells[1].querySelector('strong').textContent:cells[1].textContent);if(!termino)return;
      const b=document.createElement('button');b.type='button';b.className='lsp-create-btn';b.textContent='➕ Crear';b.addEventListener('click',()=>abrirPublicador(termino));last.appendChild(b);
    });
  }

  function iniciar(){
    instalarEstilos();instalarInicio();instalarNavMovil();enriquecerTabla();
    const body=document.getElementById('searchTableBody');if(body)new MutationObserver(enriquecerTabla).observe(body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
