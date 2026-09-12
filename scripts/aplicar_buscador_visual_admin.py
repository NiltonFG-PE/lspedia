#!/usr/bin/env python3
from pathlib import Path


def reemplazar(texto, anterior, nuevo, nombre):
    if anterior not in texto:
        raise SystemExit(f"No se encontró el bloque esperado en {nombre}: {anterior[:120]!r}")
    return texto.replace(anterior, nuevo, 1)


# 1) Lo nuevo: SOLO contenidos que ya tienen video.
ruta = Path("js/lo-nuevo.js")
t = ruta.read_text(encoding="utf-8")
t = reemplazar(
    t,
    ".map(buscarContenido)\n            .filter(Boolean)\n            .slice(0, 12);",
    ".map(buscarContenido)\n            .filter(x => x && x.palabra && texto(x.palabra.video))\n            .slice(0, 12);",
    str(ruta),
)
ruta.write_text(t, encoding="utf-8", newline="\n")

# 2) PWA: cachear el nuevo módulo y subir versión.
ruta = Path("sw.js")
t = ruta.read_text(encoding="utf-8")
t = reemplazar(t, 'const VERSION_APP = "v100";', 'const VERSION_APP = "v101";', str(ruta))
t = reemplazar(
    t,
    '    "js/i18n-auto.js",\n    "manifest.json",',
    '    "js/i18n-auto.js",\n    "js/buscador-visual.js",\n    "manifest.json",',
    str(ruta),
)
ruta.write_text(t, encoding="utf-8", newline="\n")

# 3) Backend Admin: consultas separadas por Diccionario/Vocabulario.
ruta = Path("apps-script/admin_busquedas_ga4.gs")
t = ruta.read_text(encoding="utf-8")
t = reemplazar(
    t,
    'const EVENTO_BUSQUEDA_GENERAL = "view_search_results";\n',
    'const EVENTO_BUSQUEDA_GENERAL = "view_search_results";\n'
    'const EVENTOS_BUSQUEDA_SECCION = ["lspedia_search_dictionary", "lspedia_search_vocabulary"];\n'
    'const EVENTOS_SIN_RESULTADOS_SECCION = ["lspedia_no_result_dictionary", "lspedia_no_result_vocabulary"];\n',
    str(ruta),
)
t = reemplazar(
    t,
    '''    {\n      key: "busquedasPopulares",\n      api: "Búsquedas más frecuentes",\n      url: coreEndpoint,\n      payload: payloadBusquedasPopulares_(fechas.inicio, fechas.fin)\n    },\n    {\n      key: "busquedas",''',
    '''    {\n      key: "busquedasPopulares",\n      api: "Búsquedas más frecuentes",\n      url: coreEndpoint,\n      payload: payloadBusquedasPopulares_(fechas.inicio, fechas.fin)\n    },\n    {\n      key: "busquedasSeccion",\n      api: "Búsquedas por sección",\n      url: coreEndpoint,\n      payload: payloadBusquedasSeccion_(fechas.inicio, fechas.fin, false)\n    },\n    {\n      key: "busquedasSinResultadoSeccion",\n      api: "Búsquedas sin resultado por sección",\n      url: coreEndpoint,\n      payload: payloadBusquedasSeccion_(fechas.inicio, fechas.fin, true)\n    },\n    {\n      key: "busquedas",''',
    str(ruta),
)
t = reemplazar(
    t,
    '''  const busquedasPopulares = parseBusquedasJson_(lote.datos.busquedasPopulares);\n  const busquedas = parseBusquedasJson_(lote.datos.busquedas);''',
    '''  const busquedasPopulares = parseBusquedasJson_(lote.datos.busquedasPopulares);\n  const busquedasPorSeccion = parseBusquedasSeccionJson_(lote.datos.busquedasSeccion);\n  const busquedasSinResultadoPorSeccion = parseBusquedasSeccionJson_(lote.datos.busquedasSinResultadoSeccion);\n  const busquedas = parseBusquedasJson_(lote.datos.busquedas);''',
    str(ruta),
)
t = reemplazar(
    t,
    '''    busquedasPopulares: {\n      totalBusquedas: busquedasPopulares.totalBusquedas,\n      totalTerminos: busquedasPopulares.items.length,\n      ultimaBusqueda: busquedasPopulares.ultimaBusqueda,\n      items: busquedasPopulares.items\n    },\n    busquedas: {''',
    '''    busquedasPopulares: {\n      totalBusquedas: busquedasPopulares.totalBusquedas,\n      totalTerminos: busquedasPopulares.items.length,\n      ultimaBusqueda: busquedasPopulares.ultimaBusqueda,\n      items: busquedasPopulares.items\n    },\n    busquedasPorSeccion: busquedasPorSeccion,\n    busquedasSinResultadoPorSeccion: busquedasSinResultadoPorSeccion,\n    busquedas: {''',
    str(ruta),
)
marcador = "function consultarBusquedas_(propertyId, inicio, fin) {"
bloque = '''function payloadBusquedasSeccion_(inicio, fin, sinResultado) {
  const eventos = sinResultado ? EVENTOS_SIN_RESULTADOS_SECCION : EVENTOS_BUSQUEDA_SECCION;
  return {
    dateRanges: [{ startDate: inicio, endDate: fin }],
    dimensions: [{ name: "eventName" }, { name: "searchTerm" }, { name: "date" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: eventos, caseSensitive: true }
      }
    },
    limit: "10000"
  };
}

function parseBusquedasSeccionJson_(json) {
  const acumulado = {};
  let totalBusquedas = 0;
  let ultimaBusqueda = "";
  let totalDiccionario = 0;
  let totalVocabulario = 0;

  (json && json.rows || []).forEach(function (row) {
    const dims = row.dimensionValues || [];
    const mets = row.metricValues || [];
    const evento = String(dims[0] && dims[0].value || "").trim();
    const terminoCrudo = String(dims[1] && dims[1].value || "").trim();
    const fecha = String(dims[2] && dims[2].value || "").trim();
    const cantidad = numero_(mets[0] && mets[0].value);
    if (!terminoCrudo || terminoCrudo === "(not set)" || cantidad <= 0) return;

    const seccion = /_vocabulary$/.test(evento) ? "Vocabulario" : "Diccionario";
    const termino = terminoCrudo.toLocaleLowerCase("es-PE");
    const clave = seccion + "\\u0000" + termino;
    if (!acumulado[clave]) {
      acumulado[clave] = { termino: termino, seccion: seccion, busquedas: 0, ultimaFecha: "" };
    }
    acumulado[clave].busquedas += cantidad;
    if (fecha && fecha > acumulado[clave].ultimaFecha) acumulado[clave].ultimaFecha = fecha;
    if (fecha && fecha > ultimaBusqueda) ultimaBusqueda = fecha;
    totalBusquedas += cantidad;
    if (seccion === "Vocabulario") totalVocabulario += cantidad;
    else totalDiccionario += cantidad;
  });

  const items = Object.keys(acumulado)
    .map(function (clave) { return acumulado[clave]; })
    .sort(function (a, b) {
      if (b.busquedas !== a.busquedas) return b.busquedas - a.busquedas;
      return String(b.ultimaFecha || "").localeCompare(String(a.ultimaFecha || ""));
    });

  return {
    totalBusquedas: totalBusquedas,
    totalTerminos: items.length,
    ultimaBusqueda: ultimaBusqueda,
    totalDiccionario: totalDiccionario,
    totalVocabulario: totalVocabulario,
    items: items
  };
}

'''
if marcador not in t:
    raise SystemExit("No se encontró marcador para funciones de sección en Admin backend")
t = t.replace(marcador, bloque + marcador, 1)
ruta.write_text(t, encoding="utf-8", newline="\n")

# 4) Frontend Admin: mostrar sección en ranking y tabla.
ruta = Path("admin/busquedas.html")
t = ruta.read_text(encoding="utf-8")
t = reemplazar(
    t,
    '<table class="table"><thead><tr><th>#</th><th>Palabra</th><th>Búsquedas</th><th>Última búsqueda</th><th>Estado</th><th></th></tr></thead><tbody id="searchTableBody"></tbody></table>',
    '<table class="table"><thead><tr><th>#</th><th>Palabra</th><th>Sección</th><th>Búsquedas</th><th>Última búsqueda</th><th>Estado</th><th></th></tr></thead><tbody id="searchTableBody"></tbody></table>',
    str(ruta),
)
t = reemplazar(
    t,
    '''    el.priority.innerHTML=top.map((x,i)=>'<div class="priority-item"><div class="priority-num">#'+(i+1)+'</div><div class="priority-term" title="'+escapeHtml(x.termino)+'">'+escapeHtml(x.termino)+'</div><div class="priority-count">'+fmt(x.busquedas)+' búsqueda'+(x.busquedas===1?'':'s')+'</div></div>').join('');''',
    '''    el.priority.innerHTML=top.map((x,i)=>'<div class="priority-item"><div class="priority-num">#'+(i+1)+'</div><div class="priority-term" title="'+escapeHtml(x.termino)+'">'+escapeHtml(x.termino)+'</div><div class="priority-count">'+fmt(x.busquedas)+' búsqueda'+(x.busquedas===1?'':'s')+(x.seccion?' · '+escapeHtml(x.seccion):'')+'</div></div>').join('');''',
    str(ruta),
)
t = reemplazar(
    t,
    '''      tr.innerHTML='<td class="muted">'+(i+1)+'</td><td><strong>'+escapeHtml(item.termino)+'</strong></td><td><strong>'+fmt(item.busquedas)+'</strong></td><td>'+escapeHtml(gaDate(item.ultimaFecha))+'</td><td><span class="state '+(item.added?'state-added':'state-pending')+'">'+(item.added?'✓ Ya está':'● Pendiente')+'</span></td><td><button class="copy-btn" type="button" data-copy="'+encodeURIComponent(item.termino)+'">Copiar</button></td>';''',
    '''      tr.innerHTML='<td class="muted">'+(i+1)+'</td><td><strong>'+escapeHtml(item.termino)+'</strong></td><td><span class="state">'+escapeHtml(item.seccion||'—')+'</span></td><td><strong>'+fmt(item.busquedas)+'</strong></td><td>'+escapeHtml(gaDate(item.ultimaFecha))+'</td><td><span class="state '+(item.added?'state-added':'state-pending')+'">'+(item.added?'✓ Ya está':'● Pendiente')+'</span></td><td><button class="copy-btn" type="button" data-copy="'+encodeURIComponent(item.termino)+'">Copiar</button></td>';''',
    str(ruta),
)
t = reemplazar(
    t,
    '''  function renderPopularSearches(data){
    const b=data.busquedasPopulares||{};
    const rows=(Array.isArray(b.items)?b.items:[]).map(x=>({
      termino:String(x.termino||'').trim(),
      busquedas:n(x.busquedas),
      ultimaFecha:String(x.ultimaFecha||''),
      added:state.existing.has(normalize(x.termino))
    }));''',
    '''  function renderPopularSearches(data){
    const porSeccion=data.busquedasPorSeccion||{};
    const general=data.busquedasPopulares||{};
    const fuente=(Array.isArray(porSeccion.items)&&porSeccion.items.length)?porSeccion:general;
    const rows=(Array.isArray(fuente.items)?fuente.items:[]).map(x=>({
      termino:String(x.termino||'').trim(),
      seccion:String(x.seccion||'').trim(),
      busquedas:n(x.busquedas),
      ultimaFecha:String(x.ultimaFecha||''),
      added:state.existing.has(normalize(x.termino))
    }));''',
    str(ruta),
)
t = reemplazar(
    t,
    '''      meta:x=>(x.added?'Disponible en LSPedia':'Sin resultado / por revisar')+(x.ultimaFecha?' · '+gaDate(x.ultimaFecha):'')''',
    '''      meta:x=>(x.seccion?x.seccion+' · ':'')+(x.added?'Disponible en LSPedia':'Sin resultado / por revisar')+(x.ultimaFecha?' · '+gaDate(x.ultimaFecha):'')''',
    str(ruta),
)
t = reemplazar(
    t,
    '''  function renderSearch(data){
    const b=data.busquedas||{};
    state.searchItems=(Array.isArray(b.items)?b.items:[]).map(x=>({
      termino:String(x.termino||'').trim(),
      busquedas:n(x.busquedas),
      ultimaFecha:String(x.ultimaFecha||''),
      added:state.existing.has(normalize(x.termino))
    }));''',
    '''  function renderSearch(data){
    const porSeccion=data.busquedasSinResultadoPorSeccion||{};
    const general=data.busquedas||{};
    const fuente=(Array.isArray(porSeccion.items)&&porSeccion.items.length)?porSeccion:general;
    state.searchItems=(Array.isArray(fuente.items)?fuente.items:[]).map(x=>({
      termino:String(x.termino||'').trim(),
      seccion:String(x.seccion||'').trim(),
      busquedas:n(x.busquedas),
      ultimaFecha:String(x.ultimaFecha||''),
      added:state.existing.has(normalize(x.termino))
    }));''',
    str(ruta),
)
t = reemplazar(
    t,
    '''    const lines=[['N','Palabra buscada','Busquedas','Ultima busqueda','Estado'].map(quote).join(',')];
    rows.forEach((x,i)=>lines.push([i+1,x.termino,x.busquedas,gaDate(x.ultimaFecha),x.added?'Ya esta en LSPedia':'Pendiente'].map(quote).join(',')));''',
    '''    const lines=[['N','Palabra buscada','Seccion','Busquedas','Ultima busqueda','Estado'].map(quote).join(',')];
    rows.forEach((x,i)=>lines.push([i+1,x.termino,x.seccion||'',x.busquedas,gaDate(x.ultimaFecha),x.added?'Ya esta en LSPedia':'Pendiente'].map(quote).join(',')));''',
    str(ruta),
)
ruta.write_text(t, encoding="utf-8", newline="\n")

print("Cambios aplicados correctamente.")
