from pathlib import Path

ROOT = Path('.')
ADMIN = ROOT / 'admin' / 'busquedas.html'
ESTADO = ROOT / 'admin' / 'estado.html'
BACKEND = ROOT / 'apps-script' / 'admin_busquedas_ga4.gs'
SCRIPT = ROOT / 'js' / 'script.js'
ADMIN_INDEX = ROOT / 'admin' / 'index.html'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'No se encontró el bloque esperado: {label}')
    return text.replace(old, new, 1)


# ============================================================
# 1) Registrar búsquedas generales en Diccionario y Vocabulario
# ============================================================
js = SCRIPT.read_text(encoding='utf-8')
marker = 'BUSQUEDAS_POPULARES_GA4_V1_20260911'
if marker not in js:
    hook = 'function buscarPalabras(){\n'
    analytics_fn = r'''// BUSQUEDAS_POPULARES_GA4_V1_20260911
// Registra únicamente búsquedas explícitas (Enter o lupa), no cada tecla.
// GA4 usa el evento recomendado view_search_results y el parámetro search_term.
function registrarBusquedaGA4(termino, origen){
    const limpio = String(termino || "").trim().replace(/\s+/g, " ").slice(0, 80);
    if(limpio.length < 2) return;
    if(/@/.test(limpio) || /https?:\/\//i.test(limpio) || /www\./i.test(limpio)) return;
    if(/(?:\d[\s.-]*){7,}/.test(limpio)) return;

    try {
        if(typeof window.gtag === "function"){
            window.gtag("event", "view_search_results", {
                search_term: limpio.toLocaleLowerCase("es-PE"),
                search_origin: String(origen || "lspedia")
            });
        }
    } catch(error){
        console.warn("No se pudo registrar la búsqueda en GA4:", error);
    }
}

'''
    js = replace_once(js, hook, analytics_fn + hook, 'insertar registrarBusquedaGA4')

    old_dict = '''function ejecutarBusquedaDirecta() {
    const consultaOriginal = buscar.value.trim();
    const texto = norm(consultaOriginal);
    if(texto === "") return;
    sugerencias.innerHTML = "";'''
    new_dict = '''function ejecutarBusquedaDirecta() {
    const consultaOriginal = buscar.value.trim();
    const texto = norm(consultaOriginal);
    if(texto === "") return;
    registrarBusquedaGA4(consultaOriginal, "diccionario");
    sugerencias.innerHTML = "";'''
    js = replace_once(js, old_dict, new_dict, 'búsqueda directa Diccionario')

    old_vocab = '''function ejecutarBusquedaDirectaCategorias() {
    if(!buscarCategorias) return;
    const texto = norm(buscarCategorias.value.trim());
    if(texto === "") return;

    const datos = obtenerDatosVocabulario();'''
    new_vocab = '''function ejecutarBusquedaDirectaCategorias() {
    if(!buscarCategorias) return;
    const consultaOriginal = buscarCategorias.value.trim();
    const texto = norm(consultaOriginal);
    if(texto === "") return;
    registrarBusquedaGA4(consultaOriginal, "vocabulario");

    const datos = obtenerDatosVocabulario();'''
    js = replace_once(js, old_vocab, new_vocab, 'búsqueda directa Vocabulario')

SCRIPT.write_text(js.rstrip() + '\n', encoding='utf-8')


# ============================================================
# 2) Backend Apps Script: ranking de búsquedas más frecuentes
# ============================================================
gs = BACKEND.read_text(encoding='utf-8')
backend_marker = 'EVENTO_BUSQUEDA_GENERAL'
if backend_marker not in gs:
    gs = replace_once(
        gs,
        'const EVENTO_SIN_RESULTADOS = "search_no_results";\n',
        'const EVENTO_SIN_RESULTADOS = "search_no_results";\nconst EVENTO_BUSQUEDA_GENERAL = "view_search_results";\n',
        'constante evento búsqueda general'
    )

    old_query = '''    {
      key: "busquedas",
      api: "Búsquedas sin resultado",
      url: coreEndpoint,
      payload: payloadBusquedas_(fechas.inicio, fechas.fin)
    }'''
    new_query = '''    {
      key: "busquedasPopulares",
      api: "Búsquedas más frecuentes",
      url: coreEndpoint,
      payload: payloadBusquedasPopulares_(fechas.inicio, fechas.fin)
    },
    {
      key: "busquedas",
      api: "Búsquedas sin resultado",
      url: coreEndpoint,
      payload: payloadBusquedas_(fechas.inicio, fechas.fin)
    }'''
    gs = replace_once(gs, old_query, new_query, 'consulta búsquedas populares')

    gs = replace_once(
        gs,
        '  const errores = parseErrores_(lote.datos.errores);\n  const busquedas = parseBusquedasJson_(lote.datos.busquedas);\n',
        '  const errores = parseErrores_(lote.datos.errores);\n  const busquedasPopulares = parseBusquedasJson_(lote.datos.busquedasPopulares);\n  const busquedas = parseBusquedasJson_(lote.datos.busquedas);\n',
        'parse búsquedas populares'
    )

    gs = replace_once(
        gs,
        '''    errores: errores,
    busquedas: {
      totalBusquedas: busquedas.totalBusquedas,''',
        '''    errores: errores,
    busquedasPopulares: {
      totalBusquedas: busquedasPopulares.totalBusquedas,
      totalTerminos: busquedasPopulares.items.length,
      ultimaBusqueda: busquedasPopulares.ultimaBusqueda,
      items: busquedasPopulares.items
    },
    busquedas: {
      totalBusquedas: busquedas.totalBusquedas,''',
        'respuesta búsquedas populares'
    )

    payload_hook = 'function payloadBusquedas_(inicio, fin) {\n'
    popular_payload = r'''function payloadBusquedasPopulares_(inicio, fin) {
  return {
    dateRanges: [{ startDate: inicio, endDate: fin }],
    dimensions: [{ name: "searchTerm" }, { name: "date" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: {
          matchType: "EXACT",
          value: EVENTO_BUSQUEDA_GENERAL,
          caseSensitive: true
        }
      }
    },
    limit: "10000"
  };
}

'''
    gs = replace_once(gs, payload_hook, popular_payload + payload_hook, 'payload búsquedas populares')

BACKEND.write_text(gs.rstrip() + '\n', encoding='utf-8')


# ============================================================
# 3) Panel Admin: pestañas + acceso recordado
# ============================================================
html = ADMIN.read_text(encoding='utf-8')
ui_marker = 'ADMIN_TABS_ACCESO_V2_20260911'
if ui_marker not in html:
    html = replace_once(
        html,
        '''    .admin-nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
    .admin-nav a{text-decoration:none;color:#334155;background:#fff;border:1px solid var(--border);padding:9px 12px;border-radius:10px;font-size:12px;font-weight:800}
    .admin-nav a.active{background:var(--navy);color:#fff;border-color:var(--navy)}''',
        '''    .admin-nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
    .admin-nav a,.admin-nav button{text-decoration:none;color:#334155;background:#fff;border:1px solid var(--border);padding:10px 13px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer}
    .admin-nav a.active,.admin-nav button.active{background:var(--navy);color:#fff;border-color:var(--navy)}
    .admin-tab-panel.d-none{display:none!important}
    .remember-row{display:flex;align-items:flex-start;gap:9px;margin-top:12px;padding:11px 12px;border:1px solid #dce3ec;border-radius:11px;background:#f8fafc;color:#475569;font-size:12px;line-height:1.4;cursor:pointer}
    .remember-row input{margin-top:2px;flex:0 0 auto}
    .remember-row strong{display:block;color:#263449;margin-bottom:2px}
    .popular-note{font-size:11px;color:var(--muted);margin-top:8px}
    /* ADMIN_TABS_ACCESO_V2_20260911 */''',
        'CSS tabs y acceso'
    )

    html = replace_once(
        html,
        '''  <nav class="admin-nav">
    <a class="active" href="busquedas.html">📊 Analytics</a>
    <a href="estado.html">🩺 Estado</a>
  </nav>

  <div class="hero">
    <div>
      <h1>Analytics de LSPedia</h1>
      <p>Usuarios, visitas, páginas, interacciones, tráfico, ubicación, búsquedas que faltan y errores técnicos en una sola vista.</p>
    </div>
    <div class="hero-live"><span class="dot-live"></span> Realtime · últimos 30 min</div>
  </div>''',
        '''  <nav class="admin-nav" aria-label="Secciones del panel Admin">
    <button class="admin-tab-btn active" type="button" data-admin-tab="busquedas">🔎 Búsquedas</button>
    <button class="admin-tab-btn" type="button" data-admin-tab="estadisticas">📊 Estadísticas</button>
    <a href="estado.html">🩺 Estado</a>
  </nav>

  <div class="hero">
    <div>
      <h1 id="panelTitle">Búsquedas de LSPedia</h1>
      <p id="panelSubtitle">Descubre qué palabras busca la gente, cuáles son las más frecuentes y cuáles todavía no tienen resultado.</p>
    </div>
    <div class="hero-live d-none" id="heroRealtime"><span class="dot-live"></span> Realtime · últimos 30 min</div>
  </div>''',
        'navegación y hero'
    )

    html = replace_once(
        html,
        '''      <button class="btn btn-primary" id="btnConnect" type="button">Ver Analytics</button>
      <button class="btn btn-danger-soft" id="btnReset" type="button">Restablecer</button>
    </div>
    <p class="setup-note"><b>Privacidad:</b> la URL puede guardarse en este dispositivo. La clave solo vive durante esta pestaña. Las credenciales de Google/GA4 permanecen en Apps Script y nunca se exponen aquí.</p>''',
        '''      <button class="btn btn-primary" id="btnConnect" type="button">Guardar y entrar</button>
      <button class="btn btn-danger-soft" id="btnReset" type="button">Olvidar acceso</button>
    </div>
    <label class="remember-row" for="rememberAccess">
      <input id="rememberAccess" type="checkbox">
      <span><strong>Recordar acceso en este dispositivo</strong>Guarda la URL y la clave en este navegador para entrar automáticamente la próxima vez. Úsalo solo en tu celular o computadora personal.</span>
    </label>
    <p class="setup-note"><b>Privacidad:</b> si no marcas la opción anterior, la clave solo dura durante esta pestaña. Las credenciales de Google/GA4 permanecen en Apps Script y nunca se publican en GitHub.</p>''',
        'configuración de acceso'
    )

    html = replace_once(
        html,
        '''        <button class="btn btn-soft" id="btnRefresh" type="button">↻ Actualizar</button>
      </div>''',
        '''        <button class="btn btn-soft" id="btnRefresh" type="button">↻ Actualizar</button>
        <button class="btn btn-soft" id="btnAccess" type="button">🔐 Acceso</button>
      </div>''',
        'botón acceso compacto'
    )

    html = replace_once(
        html,
        '    <div class="section-title"><div><h2>Ahora mismo</h2><p>Actividad recibida por la API Realtime de GA4 durante los últimos 30 minutos.</p></div></div>',
        '    <div id="tabEstadisticas" class="admin-tab-panel d-none">\n    <div class="section-title"><div><h2>Ahora mismo</h2><p>Actividad recibida por la API Realtime de GA4 durante los últimos 30 minutos.</p></div></div>',
        'abrir pestaña Estadísticas'
    )

    search_heading = '    <div class="section-title"><div><h2>Búsquedas sin resultado</h2><p>Qué palabras intentan encontrar las personas y todavía no están disponibles.</p></div><button class="btn btn-soft" id="btnCopyTop" type="button">Copiar top 5</button></div>'
    new_search_heading = '''    </div>

    <div id="tabBusquedas" class="admin-tab-panel">
      <div class="section-title"><div><h2>Más buscadas</h2><p>Ranking de las búsquedas explícitas hechas con Enter o la lupa en Diccionario y Vocabulario.</p></div></div>
      <section class="card panel" style="margin-bottom:13px">
        <div class="metric-list" id="popularSearchList"></div>
        <p class="popular-note">Este ranking comienza a acumular datos desde que se activó el registro de búsquedas generales.</p>
      </section>

    <div class="section-title"><div><h2>Búsquedas sin resultado</h2><p>Qué palabras intentan encontrar las personas y todavía no están disponibles.</p></div><button class="btn btn-soft" id="btnCopyTop" type="button">Copiar top 5</button></div>'''
    html = replace_once(html, search_heading, new_search_heading, 'separar pestaña Búsquedas')

    html = replace_once(
        html,
        '''    </section>

    <p class="footer-note">Analytics es de solo lectura.''',
        '''    </section>
    </div>

    <p class="footer-note">Analytics es de solo lectura.''',
        'cerrar pestaña Búsquedas'
    )

    html = replace_once(
        html,
        '''    api:$(\'apiUrl\'),key:$(\'adminKey\'),connect:$(\'btnConnect\'),reset:$(\'btnReset\'),status:$(\'setupStatus\'),
    alert:$(\'alertBox\'),warning:$(\'warningBox\'),loading:$(\'loading\'),dashboard:$(\'dashboard\'),period:$(\'periodSelect\'),
    refresh:$(\'btnRefresh\'),generated:$(\'generatedAt\'),periodHeading:$(\'periodHeading\'),'''.replace('\\\'','\''),
        '''    api:$(\'apiUrl\'),key:$(\'adminKey\'),connect:$(\'btnConnect\'),reset:$(\'btnReset\'),status:$(\'setupStatus\'),
    setupPanel:$(\'setupPanel\'),remember:$(\'rememberAccess\'),access:$(\'btnAccess\'),panelTitle:$(\'panelTitle\'),panelSubtitle:$(\'panelSubtitle\'),heroRealtime:$(\'heroRealtime\'),
    alert:$(\'alertBox\'),warning:$(\'warningBox\'),loading:$(\'loading\'),dashboard:$(\'dashboard\'),period:$(\'periodSelect\'),
    refresh:$(\'btnRefresh\'),generated:$(\'generatedAt\'),periodHeading:$(\'periodHeading\'),'''.replace('\\\'','\''),
        'referencias UI acceso'
    )

    html = replace_once(
        html,
        '''    search:$(\'tableSearch\'),body:$(\'searchTableBody\'),wrap:$(\'searchTableWrap\'),empty:$(\'searchEmpty\'),
    priority:$(\'priorityList\'),copyTop:$(\'btnCopyTop\'),csv:$(\'btnCsv\')'''.replace('\\\'','\''),
        '''    search:$(\'tableSearch\'),body:$(\'searchTableBody\'),wrap:$(\'searchTableWrap\'),empty:$(\'searchEmpty\'),
    priority:$(\'priorityList\'),popular:$(\'popularSearchList\'),copyTop:$(\'btnCopyTop\'),csv:$(\'btnCsv\')'''.replace('\\\'','\''),
        'referencia ranking popular'
    )

    html = replace_once(
        html,
        '''  const STORE_URL='lspedia_admin_busquedas_api_v1';
  const SESSION_KEY='lspedia_admin_busquedas_key_v1';
  const state={data:null,searchItems:[],existing:new Set(),filter:'pending',query:''};''',
        '''  const STORE_URL='lspedia_admin_busquedas_api_v1';
  const SESSION_KEY='lspedia_admin_busquedas_key_v1';
  const STORE_ACCESS='lspedia_admin_access_v2';
  const state={data:null,searchItems:[],popularItems:[],existing:new Set(),filter:'pending',query:'',tab:'busquedas'};''',
        'constantes acceso y estado'
    )

    insert_before_request = '  function requestJsonp(apiUrl,key,period){\n'
    access_and_tabs = r'''  function readRememberedAccess(){
    try{
      const raw=localStorage.getItem(STORE_ACCESS);
      if(!raw)return null;
      const parsed=JSON.parse(raw);
      if(parsed&&typeof parsed.api==='string'&&typeof parsed.key==='string'&&parsed.api&&parsed.key)return parsed;
    }catch(_e){}
    return null;
  }

  function saveAccess(api,key){
    localStorage.setItem(STORE_URL,api);
    if(el.remember&&el.remember.checked){
      localStorage.setItem(STORE_ACCESS,JSON.stringify({api,key}));
      sessionStorage.removeItem(SESSION_KEY);
    }else{
      localStorage.removeItem(STORE_ACCESS);
      sessionStorage.setItem(SESSION_KEY,key);
    }
  }

  function selectAdminTab(name,updateHash=true){
    const tab=name==='estadisticas'?'estadisticas':'busquedas';
    state.tab=tab;
    const busquedas=document.getElementById('tabBusquedas');
    const estadisticas=document.getElementById('tabEstadisticas');
    if(busquedas)busquedas.classList.toggle('d-none',tab!=='busquedas');
    if(estadisticas)estadisticas.classList.toggle('d-none',tab!=='estadisticas');
    document.querySelectorAll('[data-admin-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.adminTab===tab));
    if(el.panelTitle)el.panelTitle.textContent=tab==='busquedas'?'Búsquedas de LSPedia':'Estadísticas de LSPedia';
    if(el.panelSubtitle)el.panelSubtitle.textContent=tab==='busquedas'
      ?'Descubre qué palabras busca la gente, cuáles son las más frecuentes y cuáles todavía no tienen resultado.'
      :'Usuarios, visitas, páginas, interacciones, tráfico, ubicación y errores técnicos en una sola vista.';
    if(el.heroRealtime)el.heroRealtime.classList.toggle('d-none',tab!=='estadisticas');
    if(updateHash&&location.hash!=='#'+tab)history.replaceState(null,'','#'+tab);
    if(tab==='estadisticas'&&state.data)setTimeout(()=>drawGeo(state.data.paises||[]),0);
  }

'''
    html = replace_once(html, insert_before_request, access_and_tabs + insert_before_request, 'funciones acceso y pestañas')

    render_hook = '  function renderSearch(data){\n'
    popular_render = r'''  function renderPopularSearches(data){
    const b=data.busquedasPopulares||{};
    const rows=(Array.isArray(b.items)?b.items:[]).map(x=>({
      termino:String(x.termino||'').trim(),
      busquedas:n(x.busquedas),
      ultimaFecha:String(x.ultimaFecha||''),
      added:state.existing.has(normalize(x.termino))
    }));
    state.popularItems=rows;
    if(!rows.length){
      el.popular.innerHTML='<div class="empty"><strong>Aún no hay búsquedas generales registradas.</strong><span>El ranking se llenará a medida que las personas usen Enter o la lupa.</span></div>';
      return;
    }
    renderMetricList(el.popular,rows,{
      nameKey:'termino',valueKey:'busquedas',limit:15,
      meta:x=>(x.added?'Disponible en LSPedia':'Sin resultado / por revisar')+(x.ultimaFecha?' · '+gaDate(x.ultimaFecha):'')
    });
  }

'''
    html = replace_once(html, render_hook, popular_render + render_hook, 'render ranking popular')

    html = replace_once(
        html,
        '''      renderGeneral(data);
      renderSearch(data);
      showWarnings(data.avisos);
      el.dashboard.classList.remove('d-none');
      el.status.textContent='Conectado';''',
        '''      renderGeneral(data);
      renderPopularSearches(data);
      renderSearch(data);
      showWarnings(data.avisos);
      el.dashboard.classList.remove('d-none');
      el.setupPanel.classList.add('d-none');
      el.status.textContent='Conectado';''',
        'render y ocultar setup'
    )

    html = replace_once(
        html,
        '''    localStorage.setItem(STORE_URL,api);
    sessionStorage.setItem(SESSION_KEY,key);
    setLoading(true);''',
        '''    saveAccess(api,key);
    setLoading(true);''',
        'guardar acceso'
    )

    html = replace_once(
        html,
        '''      state.data=null;
      el.dashboard.classList.add('d-none');
      el.status.textContent='Error';''',
        '''      state.data=null;
      el.dashboard.classList.add('d-none');
      el.setupPanel.classList.remove('d-none');
      el.status.textContent='Error';''',
        'mostrar setup en error'
    )

    html = replace_once(
        html,
        '''  function resetConnection(){
    try{localStorage.removeItem(STORE_URL);sessionStorage.removeItem(SESSION_KEY)}catch(_e){}
    el.api.value='';el.key.value='';state.data=null;state.searchItems=[];el.dashboard.classList.add('d-none');''',
        '''  function resetConnection(){
    try{localStorage.removeItem(STORE_URL);localStorage.removeItem(STORE_ACCESS);sessionStorage.removeItem(SESSION_KEY)}catch(_e){}
    el.api.value='';el.key.value='';if(el.remember)el.remember.checked=false;state.data=null;state.searchItems=[];state.popularItems=[];el.dashboard.classList.add('d-none');
    el.setupPanel.classList.remove('d-none');''',
        'restablecer acceso'
    )

    html = replace_once(
        html,
        '''  el.refresh.addEventListener('click',loadData);
  el.period.addEventListener('change',()=>{if(state.data)loadData()});''',
        '''  el.refresh.addEventListener('click',loadData);
  if(el.access)el.access.addEventListener('click',()=>{el.setupPanel.classList.remove('d-none');el.key.focus()});
  document.querySelectorAll('[data-admin-tab]').forEach(btn=>btn.addEventListener('click',()=>selectAdminTab(btn.dataset.adminTab||'busquedas')));
  window.addEventListener('hashchange',()=>selectAdminTab(location.hash.replace('#',''),false));
  el.period.addEventListener('change',()=>{if(state.data)loadData()});''',
        'listeners pestañas/acceso'
    )

    html = replace_once(
        html,
        '''  const savedUrl=localStorage.getItem(STORE_URL)||'';
  const savedKey=sessionStorage.getItem(SESSION_KEY)||'';
  if(savedUrl)el.api.value=savedUrl;
  if(savedKey)el.key.value=savedKey;
  if(savedUrl&&savedKey)loadData();''',
        '''  selectAdminTab(location.hash.replace('#','')||'busquedas',false);
  const remembered=readRememberedAccess();
  const savedUrl=(remembered&&remembered.api)||localStorage.getItem(STORE_URL)||'';
  const savedKey=(remembered&&remembered.key)||sessionStorage.getItem(SESSION_KEY)||'';
  if(savedUrl)el.api.value=savedUrl;
  if(savedKey)el.key.value=savedKey;
  if(remembered&&el.remember)el.remember.checked=true;
  if(savedUrl&&savedKey)loadData();''',
        'autologin acceso guardado'
    )

ADMIN.write_text(html.rstrip() + '\n', encoding='utf-8')


# ============================================================
# 4) Pestaña Estado coherente con el nuevo menú
# ============================================================
estado = ESTADO.read_text(encoding='utf-8')
if '🔎 Búsquedas' not in estado:
    estado = replace_once(
        estado,
        '.nav a{text-decoration:none;color:#334155;background:#fff;border:1px solid var(--border);padding:9px 12px;border-radius:10px;font-size:12px;font-weight:800}',
        '.nav a{text-decoration:none;color:#334155;background:#fff;border:1px solid var(--border);padding:9px 12px;border-radius:10px;font-size:12px;font-weight:800}.nav a.active{background:var(--navy);color:#fff;border-color:var(--navy)}',
        'estado active CSS'
    )
    estado = replace_once(
        estado,
        '<nav class="nav"><a href="busquedas.html">📊 Analytics</a><a href="estado.html">🩺 Estado</a></nav>',
        '<nav class="nav"><a href="busquedas.html#busquedas">🔎 Búsquedas</a><a href="busquedas.html#estadisticas">📊 Estadísticas</a><a class="active" href="estado.html">🩺 Estado</a></nav>',
        'estado navegación'
    )
ESTADO.write_text(estado.rstrip() + '\n', encoding='utf-8')


# ============================================================
# 5) URL corta /admin/
# ============================================================
ADMIN_INDEX.write_text('''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>LSPedia Admin</title>
  <meta http-equiv="refresh" content="0; url=busquedas.html#busquedas">
  <script>location.replace('busquedas.html#busquedas');</script>
</head>
<body></body>
</html>
''', encoding='utf-8')

print('Panel Admin reorganizado: Búsquedas / Estadísticas / Estado + acceso recordado.')
