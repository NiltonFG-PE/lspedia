/* ============================================================
   LSPedia - Panel privado de Analytics (GA4)
   ------------------------------------------------------------
   Backend de solo lectura para:
   - Analytics general por periodo.
   - Realtime (últimos 30 minutos).
   - Fuentes de tráfico, países, ciudades, páginas y eventos.
   - Búsquedas sin resultados.
   - Errores técnicos que LSPedia ya registra en GA4.

   CONFIGURACIÓN UNA SOLA VEZ
   1) Crea/usa el proyecto independiente de Google Apps Script del Admin.
   2) Copia este archivo y el manifest apps-script/appsscript-admin-busquedas.json.
   3) Habilita Google Analytics Data API y Google Analytics Admin API en
      el proyecto de Google Cloud asociado.
   4) Ejecuta prepararPanelAnalytics() una vez y autoriza solo lectura.
   5) Implementa como Aplicación web: ejecutar como tú y acceso "Cualquiera".
      La clave privada sigue en Script Properties, nunca en GitHub/frontend.

   Compatibilidad:
   - Conserva modo=admin_busquedas para el panel antiguo.
   - Añade modo=admin_analytics para el panel completo.
   ============================================================ */

const GA4_MEASUREMENT_ID = "G-RJX3RP2CBR";
const EVENTO_SIN_RESULTADOS = "search_no_results";
const EVENTOS_ERROR = ["image_load_error", "media_load_error", "app_runtime_error"];
const FECHA_INICIO_REGISTRO = "2026-09-10";
const PROP_ADMIN_KEY = "LSPEDIA_ADMIN_BUSQUEDAS_KEY";
const PROP_GA4_ID = "LSPEDIA_GA4_PROPERTY_ID";

function prepararPanelAnalytics() {
  return prepararPanelBusquedas();
}

/**
 * Ejecutar manualmente UNA vez antes de desplegar.
 * Genera/reutiliza la clave privada y localiza la propiedad GA4.
 */
function prepararPanelBusquedas() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty(PROP_ADMIN_KEY);
  if (!key) {
    key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
    props.setProperty(PROP_ADMIN_KEY, key);
  }

  const propertyId = obtenerPropertyId_();
  console.log("LSPedia Admin - configuración lista");
  console.log("GA4 Property ID: " + propertyId);
  console.log("CLAVE PRIVADA: " + key);
  console.log("Guarda esta clave. No la publiques ni la subas a GitHub.");

  return { ok: true, propertyId: propertyId, adminKey: key };
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = limpiarCallback_(params.callback);

  try {
    const modo = String(params.modo || "");

    if (modo !== "admin_busquedas" && modo !== "admin_analytics") {
      return responder_(callback, { ok: false, error: "Modo no válido." });
    }

    if (!claveValida_(params.key)) {
      return responder_(callback, { ok: false, error: "Clave incorrecta." });
    }

    const propertyId = obtenerPropertyId_();
    const periodo = normalizarPeriodo_(params.periodo);
    const fechas = fechasPeriodo_(periodo);

    if (modo === "admin_busquedas") {
      const datos = consultarBusquedas_(propertyId, fechas.inicio, fechas.fin);
      return responder_(callback, {
        ok: true,
        periodo: periodo,
        inicio: fechas.inicio,
        fin: fechas.fin,
        totalBusquedas: datos.totalBusquedas,
        totalTerminos: datos.items.length,
        ultimaBusqueda: datos.ultimaBusqueda,
        items: datos.items,
        generadoEn: new Date().toISOString()
      });
    }

    return responder_(callback, construirPanelAnalytics_(propertyId, periodo, fechas));
  } catch (error) {
    return responder_(callback, {
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function construirPanelAnalytics_(propertyId, periodo, fechas) {
  const coreEndpoint = endpointData_(propertyId, "runReport");
  const realtimeEndpoint = endpointData_(propertyId, "runRealtimeReport");

  const consultas = [
    {
      key: "rtResumen",
      api: "Realtime resumen",
      url: realtimeEndpoint,
      payload: {
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "eventCount" }
        ]
      }
    },
    {
      key: "rtGeo",
      api: "Realtime geografía",
      url: realtimeEndpoint,
      payload: {
        dimensions: [{ name: "country" }, { name: "city" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "100"
      }
    },
    {
      key: "rtDevice",
      api: "Realtime dispositivos",
      url: realtimeEndpoint,
      payload: {
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "10"
      }
    },
    {
      key: "rtPages",
      api: "Realtime páginas",
      url: realtimeEndpoint,
      payload: {
        dimensions: [{ name: "unifiedScreenName" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "10"
      }
    },
    {
      key: "resumen",
      api: "Resumen por periodo",
      url: coreEndpoint,
      payload: {
        dateRanges: [{ startDate: fechas.inicio, endDate: fechas.fin }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "eventCount" },
          { name: "engagedSessions" },
          { name: "engagementRate" }
        ]
      }
    },
    {
      key: "serie",
      api: "Serie diaria",
      url: coreEndpoint,
      payload: {
        dateRanges: [{ startDate: fechas.inicio, endDate: fechas.fin }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" }
        ],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        limit: "500"
      }
    },
    {
      key: "fuentes",
      api: "Fuentes de tráfico",
      url: coreEndpoint,
      payload: {
        dateRanges: [{ startDate: fechas.inicio, endDate: fechas.fin }],
        dimensions: [
          { name: "sessionSource" },
          { name: "sessionMedium" },
          { name: "sessionDefaultChannelGroup" }
        ],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "20"
      }
    },
    {
      key: "paises",
      api: "Países",
      url: coreEndpoint,
      payload: {
        dateRanges: [{ startDate: fechas.inicio, endDate: fechas.fin }],
        dimensions: [{ name: "country" }, { name: "countryId" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "100"
      }
    },
    {
      key: "ciudades",
      api: "Ciudades",
      url: coreEndpoint,
      payload: {
        dateRanges: [{ startDate: fechas.inicio, endDate: fechas.fin }],
        dimensions: [{ name: "city" }, { name: "country" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "50"
      }
    },
    {
      key: "paginas",
      api: "Páginas",
      url: coreEndpoint,
      payload: {
        dateRanges: [{ startDate: fechas.inicio, endDate: fechas.fin }],
        dimensions: [{ name: "unifiedPagePathScreen" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "20"
      }
    },
    {
      key: "eventos",
      api: "Eventos",
      url: coreEndpoint,
      payload: {
        dateRanges: [{ startDate: fechas.inicio, endDate: fechas.fin }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: "25"
      }
    },
    {
      key: "errores",
      api: "Errores técnicos",
      url: coreEndpoint,
      payload: {
        dateRanges: [{ startDate: fechas.inicio, endDate: fechas.fin }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: { values: EVENTOS_ERROR, caseSensitive: true }
          }
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: "20"
      }
    },
    {
      key: "busquedas",
      api: "Búsquedas sin resultado",
      url: coreEndpoint,
      payload: payloadBusquedas_(fechas.inicio, fechas.fin)
    }
  ];

  const lote = ejecutarConsultasEnLote_(consultas);
  const avisos = lote.avisos.slice();

  const rtResumen = parseResumenRealtime_(lote.datos.rtResumen);
  const rtGeo = parseRealtimeGeo_(lote.datos.rtGeo);
  const rtDispositivos = parseFilas_(lote.datos.rtDevice, ["dispositivo"], ["usuarios"]);
  const rtPaginas = parseFilas_(lote.datos.rtPages, ["pagina"], ["vistas", "usuarios"]);

  const resumen = parseResumenPeriodo_(lote.datos.resumen);
  const serie = parseFilas_(lote.datos.serie, ["fecha"], ["usuarios", "sesiones", "vistas"]);
  const fuentes = parseFilas_(lote.datos.fuentes, ["fuente", "medio", "canal"], ["sesiones", "usuarios"]);
  const paises = parseFilas_(lote.datos.paises, ["pais", "codigo"], ["usuarios", "sesiones"]);
  const ciudades = parseFilas_(lote.datos.ciudades, ["ciudad", "pais"], ["usuarios", "sesiones"]);
  const paginas = parseFilas_(lote.datos.paginas, ["pagina"], ["vistas", "usuarios"]);
  const eventos = parseFilas_(lote.datos.eventos, ["evento"], ["eventos", "usuarios"]);
  const errores = parseErrores_(lote.datos.errores);
  const busquedas = parseBusquedasJson_(lote.datos.busquedas);

  return {
    ok: true,
    modo: "admin_analytics",
    periodo: periodo,
    inicio: fechas.inicio,
    fin: fechas.fin,
    realtime: {
      minutos: 30,
      activos: rtResumen.activos,
      vistas: rtResumen.vistas,
      eventos: rtResumen.eventos,
      paises: rtGeo.paises,
      ciudades: rtGeo.ciudades,
      dispositivos: rtDispositivos,
      paginas: rtPaginas
    },
    resumen: resumen,
    serie: serie,
    fuentes: fuentes,
    paises: paises,
    ciudades: ciudades,
    paginas: paginas,
    eventos: eventos,
    errores: errores,
    busquedas: {
      totalBusquedas: busquedas.totalBusquedas,
      totalTerminos: busquedas.items.length,
      ultimaBusqueda: busquedas.ultimaBusqueda,
      items: busquedas.items
    },
    avisos: avisos,
    generadoEn: new Date().toISOString()
  };
}

function endpointData_(propertyId, metodo) {
  return "https://analyticsdata.googleapis.com/v1beta/properties/" +
    encodeURIComponent(propertyId) + ":" + metodo;
}

function ejecutarConsultasEnLote_(consultas) {
  const token = ScriptApp.getOAuthToken();
  const requests = consultas.map(function (consulta) {
    return {
      url: consulta.url,
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(consulta.payload || {}),
      muteHttpExceptions: true,
      headers: { Authorization: "Bearer " + token }
    };
  });

  const respuestas = UrlFetchApp.fetchAll(requests);
  const datos = {};
  const avisos = [];

  respuestas.forEach(function (respuesta, i) {
    const consulta = consultas[i];
    const parsed = interpretarRespuestaApiSegura_(respuesta, consulta.api);
    if (parsed.ok) {
      datos[consulta.key] = parsed.data;
    } else {
      datos[consulta.key] = null;
      avisos.push(consulta.api + ": " + parsed.error);
    }
  });

  return { datos: datos, avisos: avisos };
}

function interpretarRespuestaApiSegura_(respuesta, nombreApi) {
  const codigo = respuesta.getResponseCode();
  const texto = respuesta.getContentText();
  let json;

  try {
    json = JSON.parse(texto || "{}");
  } catch (_error) {
    return { ok: false, error: "respuesta ilegible (" + codigo + ")" };
  }

  if (codigo < 200 || codigo >= 300) {
    const detalle = json && json.error && json.error.message
      ? json.error.message
      : ("HTTP " + codigo);
    return { ok: false, error: detalle };
  }

  return { ok: true, data: json };
}

function parseResumenRealtime_(json) {
  const row = json && json.rows && json.rows[0];
  const m = row && row.metricValues || [];
  return {
    activos: numero_(m[0] && m[0].value),
    vistas: numero_(m[1] && m[1].value),
    eventos: numero_(m[2] && m[2].value)
  };
}

function parseRealtimeGeo_(json) {
  const paisesMap = {};
  const ciudades = [];

  (json && json.rows || []).forEach(function (row) {
    const d = row.dimensionValues || [];
    const m = row.metricValues || [];
    const pais = limpiarDimension_(d[0] && d[0].value);
    const ciudad = limpiarDimension_(d[1] && d[1].value);
    const usuarios = numero_(m[0] && m[0].value);

    if (pais) {
      paisesMap[pais] = (paisesMap[pais] || 0) + usuarios;
    }
    if (ciudad) {
      ciudades.push({ ciudad: ciudad, pais: pais || "—", usuarios: usuarios });
    }
  });

  const paises = Object.keys(paisesMap)
    .map(function (pais) { return { pais: pais, usuarios: paisesMap[pais] }; })
    .sort(function (a, b) { return b.usuarios - a.usuarios; })
    .slice(0, 15);

  ciudades.sort(function (a, b) { return b.usuarios - a.usuarios; });

  return { paises: paises, ciudades: ciudades.slice(0, 20) };
}

function parseResumenPeriodo_(json) {
  const row = json && json.rows && json.rows[0];
  const m = row && row.metricValues || [];
  return {
    usuarios: numero_(m[0] && m[0].value),
    sesiones: numero_(m[1] && m[1].value),
    vistas: numero_(m[2] && m[2].value),
    eventos: numero_(m[3] && m[3].value),
    sesionesConInteraccion: numero_(m[4] && m[4].value),
    tasaInteraccion: decimal_(m[5] && m[5].value)
  };
}

function parseFilas_(json, nombresDimensiones, nombresMetricas) {
  const salida = [];
  (json && json.rows || []).forEach(function (row) {
    const item = {};
    const dims = row.dimensionValues || [];
    const mets = row.metricValues || [];

    nombresDimensiones.forEach(function (nombre, i) {
      item[nombre] = limpiarDimension_(dims[i] && dims[i].value);
    });
    nombresMetricas.forEach(function (nombre, i) {
      item[nombre] = numero_(mets[i] && mets[i].value);
    });

    salida.push(item);
  });
  return salida;
}

function parseErrores_(json) {
  const items = parseFilas_(json, ["evento"], ["cantidad"]);
  const out = { total: 0, imagen: 0, media: 0, runtime: 0, items: items };

  items.forEach(function (item) {
    const n = numero_(item.cantidad);
    out.total += n;
    if (item.evento === "image_load_error") out.imagen += n;
    else if (item.evento === "media_load_error") out.media += n;
    else if (item.evento === "app_runtime_error") out.runtime += n;
  });

  return out;
}

function payloadBusquedas_(inicio, fin) {
  return {
    dateRanges: [{ startDate: inicio, endDate: fin }],
    dimensions: [{ name: "searchTerm" }, { name: "date" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: {
          matchType: "EXACT",
          value: EVENTO_SIN_RESULTADOS,
          caseSensitive: true
        }
      }
    },
    limit: "10000"
  };
}

function consultarBusquedas_(propertyId, inicio, fin) {
  const endpoint = endpointData_(propertyId, "runReport");
  const respuesta = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payloadBusquedas_(inicio, fin)),
    muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
  });

  const json = interpretarRespuestaApi_(respuesta, "Google Analytics Data API");
  return parseBusquedasJson_(json);
}

function parseBusquedasJson_(json) {
  const acumulado = {};
  let totalBusquedas = 0;
  let ultimaBusqueda = "";

  (json && json.rows || []).forEach(function (row) {
    const terminoCrudo = String(
      row.dimensionValues && row.dimensionValues[0] &&
      row.dimensionValues[0].value || ""
    ).trim();
    const fecha = String(
      row.dimensionValues && row.dimensionValues[1] &&
      row.dimensionValues[1].value || ""
    ).trim();
    const cantidad = numero_(
      row.metricValues && row.metricValues[0] &&
      row.metricValues[0].value
    );

    if (!terminoCrudo || terminoCrudo === "(not set)" || cantidad <= 0) return;

    const termino = terminoCrudo.toLocaleLowerCase("es-PE");
    if (!acumulado[termino]) {
      acumulado[termino] = { termino: termino, busquedas: 0, ultimaFecha: "" };
    }

    acumulado[termino].busquedas += cantidad;
    if (fecha && fecha > acumulado[termino].ultimaFecha) {
      acumulado[termino].ultimaFecha = fecha;
    }
    if (fecha && fecha > ultimaBusqueda) ultimaBusqueda = fecha;
    totalBusquedas += cantidad;
  });

  const items = Object.keys(acumulado)
    .map(function (clave) { return acumulado[clave]; })
    .sort(function (a, b) {
      if (b.busquedas !== a.busquedas) return b.busquedas - a.busquedas;
      return String(b.ultimaFecha || "").localeCompare(String(a.ultimaFecha || ""));
    });

  return { totalBusquedas: totalBusquedas, ultimaBusqueda: ultimaBusqueda, items: items };
}

function numero_(valor) {
  const n = Number(valor || 0);
  return Number.isFinite(n) ? n : 0;
}

function decimal_(valor) {
  const n = Number(valor || 0);
  return Number.isFinite(n) ? n : 0;
}

function limpiarDimension_(valor) {
  const v = String(valor || "").trim();
  if (!v || v === "(not set)") return "";
  return v;
}

function claveValida_(key) {
  const recibida = String(key || "");
  const esperada = String(
    PropertiesService.getScriptProperties().getProperty(PROP_ADMIN_KEY) || ""
  );
  if (!esperada || recibida.length !== esperada.length) return false;

  let diferencia = 0;
  for (let i = 0; i < esperada.length; i++) {
    diferencia |= esperada.charCodeAt(i) ^ recibida.charCodeAt(i);
  }
  return diferencia === 0;
}

function obtenerPropertyId_() {
  const props = PropertiesService.getScriptProperties();
  const cache = String(props.getProperty(PROP_GA4_ID) || "");
  if (/^\d+$/.test(cache)) return cache;

  const propertyId = descubrirPropertyIdPorMeasurementId_();
  props.setProperty(PROP_GA4_ID, propertyId);
  return propertyId;
}

function descubrirPropertyIdPorMeasurementId_() {
  const propiedades = listarPropiedadesAccesibles_();
  if (!propiedades.length) {
    throw new Error("La cuenta autorizada no tiene propiedades de Google Analytics accesibles.");
  }

  for (let i = 0; i < propiedades.length; i++) {
    const propertyName = propiedades[i];
    const streams = listarDataStreams_(propertyName);
    for (let j = 0; j < streams.length; j++) {
      const stream = streams[j] || {};
      const web = stream.webStreamData || {};
      if (String(web.measurementId || "").trim() === GA4_MEASUREMENT_ID) {
        const match = String(propertyName).match(/^properties\/(\d+)$/);
        if (!match) break;
        return match[1];
      }
    }
  }

  throw new Error(
    "No se encontró una propiedad GA4 con el flujo " +
    GA4_MEASUREMENT_ID +
    ". Autoriza el mismo Google que administra LSPedia."
  );
}

function listarPropiedadesAccesibles_() {
  const propiedades = [];
  let pageToken = "";

  do {
    let url = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200";
    if (pageToken) url += "&pageToken=" + encodeURIComponent(pageToken);
    const json = apiGetJson_(url, "Google Analytics Admin API");

    (json.accountSummaries || []).forEach(function (cuenta) {
      (cuenta.propertySummaries || []).forEach(function (prop) {
        const name = String(prop.property || "");
        if (/^properties\/\d+$/.test(name) && propiedades.indexOf(name) === -1) {
          propiedades.push(name);
        }
      });
    });

    pageToken = String(json.nextPageToken || "");
  } while (pageToken);

  return propiedades;
}

function listarDataStreams_(propertyName) {
  const streams = [];
  let pageToken = "";

  do {
    let url = "https://analyticsadmin.googleapis.com/v1beta/" +
      propertyName + "/dataStreams?pageSize=200";
    if (pageToken) url += "&pageToken=" + encodeURIComponent(pageToken);
    const json = apiGetJson_(url, "Google Analytics Admin API");
    (json.dataStreams || []).forEach(function (stream) { streams.push(stream); });
    pageToken = String(json.nextPageToken || "");
  } while (pageToken);

  return streams;
}

function apiGetJson_(url, nombreApi) {
  const respuesta = UrlFetchApp.fetch(url, {
    method: "get",
    muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
  });
  return interpretarRespuestaApi_(respuesta, nombreApi);
}

function interpretarRespuestaApi_(respuesta, nombreApi) {
  const seguro = interpretarRespuestaApiSegura_(respuesta, nombreApi);
  if (!seguro.ok) throw new Error(nombreApi + ": " + seguro.error);
  return seguro.data;
}

function normalizarPeriodo_(valor) {
  const permitido = ["7", "30", "90", "365", "todo"];
  const periodo = String(valor || "30").toLowerCase();
  return permitido.indexOf(periodo) >= 0 ? periodo : "30";
}

function fechasPeriodo_(periodo) {
  if (periodo === "todo") {
    return { inicio: FECHA_INICIO_REGISTRO, fin: "today" };
  }
  return { inicio: periodo + "daysAgo", fin: "today" };
}

function limpiarCallback_(valor) {
  const callback = String(valor || "");
  return /^[A-Za-z_$][0-9A-Za-z_$\.]{0,80}$/.test(callback) ? callback : "";
}

function responder_(callback, objeto) {
  const json = JSON.stringify(objeto);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
