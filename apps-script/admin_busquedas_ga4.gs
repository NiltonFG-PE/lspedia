/* ============================================================
   LSPedia - Panel privado de búsquedas sin resultados (GA4)
   ------------------------------------------------------------
   Consulta el evento `search_no_results` que ya envía LSPedia y devuelve
   un ranking de los términos que la web no encontró.

   CONFIGURACIÓN UNA SOLA VEZ
   1) Crea un proyecto independiente en Google Apps Script.
   2) Copia este archivo y el manifest del repositorio.
   3) Habilita Google Analytics Data API y Google Analytics Admin API en el
      proyecto de Google Cloud asociado al Apps Script.
   4) Ejecuta prepararPanelBusquedas() una vez y autoriza acceso de SOLO
      LECTURA a Analytics. En el registro de ejecución aparecerá tu clave.
   5) Implementa como Aplicación web: ejecutar como tú y acceso "Cualquiera".

   No tienes que buscar el ID numérico de la propiedad: el script encuentra
   automáticamente la propiedad cuyo flujo web usa G-RJX3RP2CBR.
   La clave privada se guarda en Script Properties, no en GitHub.
   ============================================================ */

const GA4_MEASUREMENT_ID = "G-RJX3RP2CBR";
const EVENTO_SIN_RESULTADOS = "search_no_results";
const FECHA_INICIO_REGISTRO = "2026-09-10";
const PROP_ADMIN_KEY = "LSPEDIA_ADMIN_BUSQUEDAS_KEY";
const PROP_GA4_ID = "LSPEDIA_GA4_PROPERTY_ID";

/**
 * Ejecutar manualmente UNA vez antes de desplegar.
 * Genera la clave privada y comprueba que puede localizar la propiedad GA4.
 * Copia la clave que aparecerá en el registro de ejecución.
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

  return {
    ok: true,
    propertyId: propertyId,
    adminKey: key
  };
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const callback = limpiarCallback_(params.callback);

    if (String(params.modo || "") !== "admin_busquedas") {
      return responder_(callback, { ok: false, error: "Modo no válido." });
    }

    if (!claveValida_(params.key)) {
      return responder_(callback, { ok: false, error: "Clave incorrecta." });
    }

    const propertyId = obtenerPropertyId_();
    const periodo = normalizarPeriodo_(params.periodo);
    const fechas = fechasPeriodo_(periodo);
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
  } catch (error) {
    const params = (e && e.parameter) || {};
    return responder_(limpiarCallback_(params.callback), {
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function claveValida_(key) {
  const recibida = String(key || "");
  const esperada = String(PropertiesService.getScriptProperties().getProperty(PROP_ADMIN_KEY) || "");
  if (!esperada || recibida.length !== esperada.length) return false;

  // Comparación sencilla de tiempo constante: evita cortar al primer carácter.
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

  throw new Error("No se encontró una propiedad GA4 con el flujo " + GA4_MEASUREMENT_ID + ". Autoriza el mismo Google que administra LSPedia.");
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
    let url = "https://analyticsadmin.googleapis.com/v1beta/" + propertyName + "/dataStreams?pageSize=200";
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
  const codigo = respuesta.getResponseCode();
  const texto = respuesta.getContentText();
  let json;
  try {
    json = JSON.parse(texto || "{}");
  } catch (_error) {
    throw new Error(nombreApi + " devolvió una respuesta que no se pudo leer.");
  }

  if (codigo < 200 || codigo >= 300) {
    const detalle = json && json.error && json.error.message ? json.error.message : ("HTTP " + codigo);
    throw new Error(nombreApi + ": " + detalle);
  }
  return json;
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

function consultarBusquedas_(propertyId, inicio, fin) {
  const endpoint = "https://analyticsdata.googleapis.com/v1beta/properties/" +
    encodeURIComponent(propertyId) + ":runReport";

  const payload = {
    dateRanges: [{ startDate: inicio, endDate: fin }],
    dimensions: [
      { name: "searchTerm" },
      { name: "date" }
    ],
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

  const respuesta = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
  });

  const json = interpretarRespuestaApi_(respuesta, "Google Analytics Data API");
  const acumulado = {};
  let totalBusquedas = 0;
  let ultimaBusqueda = "";

  (json.rows || []).forEach(function (row) {
    const terminoCrudo = String(row.dimensionValues && row.dimensionValues[0] && row.dimensionValues[0].value || "").trim();
    const fecha = String(row.dimensionValues && row.dimensionValues[1] && row.dimensionValues[1].value || "").trim();
    const cantidad = Number(row.metricValues && row.metricValues[0] && row.metricValues[0].value || 0);

    if (!terminoCrudo || terminoCrudo === "(not set)" || !Number.isFinite(cantidad) || cantidad <= 0) return;

    const termino = terminoCrudo.toLocaleLowerCase("es-PE");
    if (!acumulado[termino]) {
      acumulado[termino] = { termino: termino, busquedas: 0, ultimaFecha: "" };
    }

    acumulado[termino].busquedas += cantidad;
    if (fecha && fecha > acumulado[termino].ultimaFecha) acumulado[termino].ultimaFecha = fecha;
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
