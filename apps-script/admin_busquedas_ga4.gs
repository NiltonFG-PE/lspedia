/* ============================================================
   LSPedia - Panel privado de búsquedas sin resultados (GA4)
   ------------------------------------------------------------
   Este Apps Script consulta el evento GA4 `search_no_results` y devuelve
   un ranking de términos buscados. NO modifica el sitio público.

   Requisitos de despliegue:
   1) Crear un proyecto de Google Apps Script independiente.
   2) Copiar este archivo y usar el manifest incluido en el repositorio.
   3) Cambiar GA4_PROPERTY_ID por el ID NUMÉRICO de la propiedad GA4.
   4) Cambiar ADMIN_KEY por una clave privada larga.
   5) Implementar como Aplicación web: ejecutar como tú y acceso "Cualquiera".
      Los datos siguen protegidos porque toda consulta exige ADMIN_KEY.

   IMPORTANTE: la URL del panel está fuera del menú público y el HTML lleva
   noindex/nofollow. La clave nunca debe guardarse en GitHub.
   ============================================================ */

const GA4_PROPERTY_ID = "PEGA_AQUI_EL_ID_NUMERICO_DE_GA4";
const ADMIN_KEY = "CAMBIA_ESTA_CLAVE_POR_UNA_LARGA_Y_PRIVADA";
const EVENTO_SIN_RESULTADOS = "search_no_results";
const FECHA_INICIO_REGISTRO = "2026-09-10";

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

    validarConfiguracion_();

    const periodo = normalizarPeriodo_(params.periodo);
    const fechas = fechasPeriodo_(periodo);
    const datos = consultarBusquedas_(fechas.inicio, fechas.fin);

    return responder_(callback, {
      ok: true,
      periodo,
      inicio: fechas.inicio,
      fin: fechas.fin,
      propiedad: GA4_PROPERTY_ID,
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
  const esperada = String(ADMIN_KEY || "");
  if (!esperada || esperada.indexOf("CAMBIA_ESTA") === 0) return false;
  if (recibida.length !== esperada.length) return false;

  // Comparación de tiempo constante sencilla para no cortar al primer carácter.
  let diferencia = 0;
  for (let i = 0; i < esperada.length; i++) {
    diferencia |= esperada.charCodeAt(i) ^ recibida.charCodeAt(i);
  }
  return diferencia === 0;
}

function validarConfiguracion_() {
  if (!/^\d+$/.test(String(GA4_PROPERTY_ID || ""))) {
    throw new Error("Falta configurar GA4_PROPERTY_ID con el ID numérico de la propiedad.");
  }
  if (!ADMIN_KEY || ADMIN_KEY.indexOf("CAMBIA_ESTA") === 0 || ADMIN_KEY.length < 16) {
    throw new Error("Falta configurar una ADMIN_KEY privada de al menos 16 caracteres.");
  }
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

function consultarBusquedas_(inicio, fin) {
  const endpoint = "https://analyticsdata.googleapis.com/v1beta/properties/" +
    encodeURIComponent(GA4_PROPERTY_ID) + ":runReport";

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
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    }
  });

  const codigo = respuesta.getResponseCode();
  const texto = respuesta.getContentText();
  let json;
  try {
    json = JSON.parse(texto || "{}");
  } catch (_error) {
    throw new Error("Google Analytics devolvió una respuesta que no se pudo leer.");
  }

  if (codigo < 200 || codigo >= 300) {
    const detalle = json && json.error && json.error.message ? json.error.message : ("HTTP " + codigo);
    throw new Error("No se pudo consultar Google Analytics: " + detalle);
  }

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
      acumulado[termino] = {
        termino: termino,
        busquedas: 0,
        ultimaFecha: ""
      };
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

  return {
    totalBusquedas: totalBusquedas,
    ultimaBusqueda: ultimaBusqueda,
    items: items
  };
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
