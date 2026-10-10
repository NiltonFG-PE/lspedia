/**
 * ============================================================
 * LSPedia — PUBLICADOR DE CONTENIDO
 * ============================================================
 * Diccionario        -> Diccionario
 * Vocabulario        -> Vocabulario
 * Alfabetización     -> AlfabetizacionEjemplos
 *
 * Las imágenes se guardan directamente en GitHub / develop.
 * Solo el Diccionario puede publicarse sin video como ficha visual consultable.
 * Las imágenes son opcionales y una ficha puede tener varias. Los juegos visuales siguen usando solo registros con imagen de Vocabulario y ejemplos de Alfabetización.
 * Si la misma palabra/categoría ya existe, se actualiza en vez de duplicarse.
 * El token permanece en Script Properties.
 * ============================================================
 */


const PROP_PUBLICADOR_SPREADSHEET_ID = 'LSPEDIA_PUBLICADOR_SPREADSHEET_ID';
const PROP_PUBLICADOR_MOVIL_KEY = 'LSPEDIA_PUBLICADOR_MOVIL_KEY';
const PROP_PUBLICADOR_AUTOABRIR = 'LSPEDIA_PUBLICADOR_AUTOABRIR';
const HOJA_HISTORIAL_PUBLICADOR = 'PublicadorHistorial';

// Misma Web App que ya usa Quiz/Alfabetización.
const URL_WEB_APP_LSPEDIA = 'https://script.google.com/macros/s/AKfycbw9d7br5C8C4gfk4dJAY6FHRKTKTMI23bNQvO58OQ5TlPe9z5awMWjNIlCLILNLH0t51w/exec';


function obtenerSpreadsheetPublicador_() {
  const activo = SpreadsheetApp.getActiveSpreadsheet();

  if (activo) {
    PropertiesService
      .getScriptProperties()
      .setProperty(
        PROP_PUBLICADOR_SPREADSHEET_ID,
        activo.getId()
      );

    return activo;
  }

  const id = PropertiesService
    .getScriptProperties()
    .getProperty(PROP_PUBLICADOR_SPREADSHEET_ID);

  if (!id) {
    throw new Error(
      'El Publicador móvil todavía no está vinculado al Google Sheet. ' +
      'Abre el Sheet Proyecto en computadora y ejecuta una vez ' +
      'instalarPublicadorLSPedia().' 
    );
  }

  return SpreadsheetApp.openById(id);
}

function asegurarClavePublicadorMovil_() {
  const props = PropertiesService.getScriptProperties();
  let clave = props.getProperty(PROP_PUBLICADOR_MOVIL_KEY);

  if (!clave) {
    clave = (
      Utilities.getUuid() +
      Utilities.getUuid()
    ).replace(/-/g, '');

    props.setProperty(
      PROP_PUBLICADOR_MOVIL_KEY,
      clave
    );
  }

  return clave;
}

function esSolicitudPublicadorMovilLSPedia_(e) {
  const params = e && e.parameter ? e.parameter : {};
  return String(params.modo || '') === 'publicador';
}

function crearHtmlPublicadorLSPedia_(modoWeb, claveMovil) {
  const plantilla = HtmlService
    .createTemplateFromFile('PublicadorUI');

  plantilla.modoWeb = !!modoWeb;
  plantilla.claveMovil = String(claveMovil || '');

  return plantilla
    .evaluate()
    .setTitle('Panel LSPedia v30.0')
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1, viewport-fit=cover'
    );
}

function servirPublicadorWebLSPedia_(e) {
  const params = e && e.parameter ? e.parameter : {};
  const recibida = String(params.key || '');
  const esperada = PropertiesService
    .getScriptProperties()
    .getProperty(PROP_PUBLICADOR_MOVIL_KEY) || '';

  if (!esperada || !recibida || recibida !== esperada) {
    return HtmlService
      .createHtmlOutput(
        '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<div style="font-family:Arial,sans-serif;max-width:520px;margin:60px auto;padding:24px;text-align:center">' +
        '<h2>🔒 Acceso privado</h2>' +
        '<p>Este enlace no autoriza el Publicador LSPedia.</p>' +
        '</div>'
      )
      .setTitle('Panel LSPedia v30.0')
      .addMetaTag(
        'viewport',
        'width=device-width, initial-scale=1, viewport-fit=cover'
      );
  }

  return crearHtmlPublicadorLSPedia_(
    true,
    esperada
  );
}

function obtenerUrlPublicadorMovilLSPedia() {
  const clave = asegurarClavePublicadorMovil_();

  /*
   * IMPORTANTE:
   * No usamos ScriptApp.getService().getUrl() porque este proyecto
   * tiene varias implementaciones antiguas/activas y Apps Script puede
   * devolver una distinta de la Web App que realmente usa LSPedia.
   *
   * Esta URL es la implementación estable que ya consume
   * Quiz/Alfabetización. Al publicar una "Nueva versión" de esa misma
   * implementación, la URL /exec permanece igual.
   */
  const base = URL_WEB_APP_LSPEDIA;

  return base +
    '?modo=publicador&key=' +
    encodeURIComponent(clave);
}

function mostrarAccesoMovilPublicadorLSPedia() {
  // También garantiza que el ID del Sheet quede registrado.
  obtenerSpreadsheetPublicador_();

  const url = obtenerUrlPublicadorMovilLSPedia();

  const segura = String(url)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  /*
   * navigator.clipboard puede estar bloqueado dentro del iframe que
   * Google Sheets usa para HtmlService. Por eso usamos dos caminos:
   *
   * 1. Clipboard API cuando está disponible.
   * 2. Fallback con selección + document.execCommand("copy").
   */
  const htmlContenido =
    '<!doctype html>' +
    '<html>' +
    '<head>' +
      '<base target="_top">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '</head>' +
    '<body style="font-family:Arial,sans-serif;padding:18px;line-height:1.45">' +

      '<h3 style="margin-top:0">📱 Panel LSPedia v30.0 en el celular</h3>' +

      '<p>Abre este enlace en Chrome del celular. Es privado: no lo compartas.</p>' +

      '<input id="urlPublicador" value="' + segura + '" readonly ' +
        'style="width:100%;box-sizing:border-box;padding:11px;' +
        'border:1px solid #ccd8e5;border-radius:8px;font-size:14px">' +

      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +

        '<button id="btnCopiar" type="button" onclick="copiarEnlace()" ' +
          'style="padding:11px 16px;border:0;border-radius:8px;' +
          'background:#168bd2;color:white;font-weight:bold;cursor:pointer">' +
          'Copiar enlace' +
        '</button>' +

        '<a href="' + segura + '" target="_blank" rel="noopener noreferrer" ' +
          'style="padding:11px 16px;border-radius:8px;background:#eef6ff;' +
          'color:#0b6b9f;text-decoration:none;font-weight:bold">' +
          'Abrir ahora' +
        '</a>' +

      '</div>' +

      '<div id="estadoCopia" ' +
        'style="min-height:22px;margin-top:10px;font-size:13px;font-weight:bold;color:#15803d">' +
      '</div>' +

      '<p style="font-size:12px;color:#64748b;margin-bottom:0">' +
        'Puedes agregarlo a la pantalla de inicio del celular para abrirlo como una app.' +
      '</p>' +

      '<script>' +
        'function mostrarEstadoCopia(texto, ok){' +
          'var estado=document.getElementById("estadoCopia");' +
          'estado.textContent=texto;' +
          'estado.style.color=ok ? "#15803d" : "#b45309";' +
        '}' +

        'function copiaRespaldo(){' +
          'var campo=document.getElementById("urlPublicador");' +
          'campo.focus();' +
          'campo.select();' +
          'campo.setSelectionRange(0,99999);' +

          'var correcto=false;' +
          'try{' +
            'correcto=document.execCommand("copy");' +
          '}catch(e){' +
            'correcto=false;' +
          '}' +

          'if(correcto){' +
            'mostrarEstadoCopia("✅ Enlace copiado",true);' +
            'campo.setSelectionRange(0,0);' +
            'campo.blur();' +
          '}else{' +
            'mostrarEstadoCopia("Mantén presionado el enlace y elige Copiar.",false);' +
          '}' +
        '}' +

        'function copiarEnlace(){' +
          'var campo=document.getElementById("urlPublicador");' +
          'var texto=campo.value;' +

          'if(navigator.clipboard && typeof navigator.clipboard.writeText==="function"){' +
            'navigator.clipboard.writeText(texto)' +
              '.then(function(){' +
                'mostrarEstadoCopia("✅ Enlace copiado",true);' +
              '})' +
              '.catch(function(){' +
                'copiaRespaldo();' +
              '});' +
          '}else{' +
            'copiaRespaldo();' +
          '}' +
        '}' +
      '</script>' +

    '</body>' +
    '</html>';

  const html = HtmlService
    .createHtmlOutput(htmlContenido)
    .setWidth(520)
    .setHeight(330);

  SpreadsheetApp.getUi().showModalDialog(
    html,
    'Acceso móvil LSPedia'
  );
}


function configPublicador_() {
  return {
    githubUsuario: 'NiltonFG-PE',
    githubRepo: 'lspedia',
    githubRama: 'develop',

    hojaDiccionario: 'Diccionario',
    hojaVocabulario: 'Vocabulario',
    hojaAlfabetizacion: 'Alfabetización',
    hojaEjemplos: 'AlfabetizacionEjemplos',

    carpetaDiccionario: 'img/diccionario/',
    carpetaVocabulario: 'img/vocabulario/',
    carpetaEjemplos: 'img/alfabetizacion/ejemplos/',
    carpetaAlfabetizacionBoca: 'img/alfabetizacion/boca/',
    carpetaAlfabetizacionGrafias: 'img/alfabetizacion/grafias/',
    carpetaAlfabetizacionCirculo: 'img/alfabetizacion/circulo/',
    carpetaCategorias: 'img/categorias/'
  };
}




/* ============================================================
   PUBLICADOR 21 — HISTORIAL, DESHACER Y ESTADO TÉCNICO
   ------------------------------------------------------------
   Se suma al Publicador actual sin sustituir sincronizadores,
   IDs de Quiz, Alfabetización ni lógica ya existente.
   ============================================================ */

function obtenerHojaHistorialPublicador_(crear) {
  const ss = obtenerSpreadsheetPublicador_();
  let hoja = ss.getSheetByName(HOJA_HISTORIAL_PUBLICADOR);

  if (!hoja && crear !== false) {
    hoja = ss.insertSheet(HOJA_HISTORIAL_PUBLICADOR);
    hoja.getRange(1, 1, 1, 10).setValues([[
      'id', 'fecha', 'accion', 'origen', 'hoja',
      'fila', 'palabra', 'antes', 'despues', 'deshecho'
    ]]);
    hoja.setFrozenRows(1);
    try { hoja.hideSheet(); } catch (error) {}
  }

  return hoja;
}

function snapshotFilaPublicador_(hoja, fila) {
  fila = Number(fila);
  if (!hoja || !Number.isInteger(fila) || fila < 2 || fila > hoja.getLastRow()) {
    return null;
  }

  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(function(valor) { return String(valor || ''); });

  const valores = hoja
    .getRange(fila, 1, 1, ultimaColumna)
    .getValues()[0]
    .map(function(valor) {
      return Object.prototype.toString.call(valor) === '[object Date]'
        ? { __fechaPublicador: valor.toISOString() }
        : valor;
    });

  return { encabezados: encabezados, valores: valores };
}

function valorSnapshotPublicador_(snapshot, campo) {
  if (!snapshot || !Array.isArray(snapshot.encabezados)) return '';
  const buscado = normalizarClavePublicador_(campo);
  const indice = snapshot.encabezados.findIndex(function(encabezado) {
    return normalizarClavePublicador_(encabezado) === buscado;
  });
  if (indice === -1) return '';
  const valor = snapshot.valores && snapshot.valores[indice];
  if (valor && typeof valor === 'object' && valor.__fechaPublicador) {
    return new Date(valor.__fechaPublicador);
  }
  return valor == null ? '' : valor;
}

function restaurarSnapshotFilaPublicador_(hoja, fila, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.encabezados)) {
    throw new Error('No existe una copia anterior que restaurar.');
  }

  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const headersActuales = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0];

  const mapa = {};
  snapshot.encabezados.forEach(function(encabezado, indice) {
    mapa[normalizarClavePublicador_(encabezado)] = indice;
  });

  const valoresActuales = hoja
    .getRange(fila, 1, 1, ultimaColumna)
    .getValues()[0];

  const restaurados = headersActuales.map(function(encabezado, indiceActual) {
    const indiceSnapshot = mapa[normalizarClavePublicador_(encabezado)];
    if (indiceSnapshot === undefined) return valoresActuales[indiceActual];
    const valor = snapshot.valores[indiceSnapshot];
    if (valor && typeof valor === 'object' && valor.__fechaPublicador) {
      return new Date(valor.__fechaPublicador);
    }
    return valor;
  });

  hoja.getRange(fila, 1, 1, ultimaColumna).setValues([restaurados]);
}

function registrarHistorialPublicador_(accion, origen, hoja, fila, palabra, antes, despues) {
  try {
    const historial = obtenerHojaHistorialPublicador_(true);
    historial.appendRow([
      Utilities.getUuid(),
      new Date(),
      String(accion || ''),
      String(origen || ''),
      hoja && hoja.getName ? hoja.getName() : '',
      Number(fila || 0),
      String(palabra || ''),
      JSON.stringify(antes || null),
      JSON.stringify(despues || null),
      ''
    ]);

    const exceso = historial.getLastRow() - 151;
    if (exceso > 0) historial.deleteRows(2, exceso);
  } catch (error) {
    console.warn('[LSPedia] No se pudo registrar historial del Publicador:', error);
  }
}

function obtenerHistorialPublicadorLSPedia(datos) {
  validarSesionEditorPublicador_(datos || {});
  const hoja = obtenerHojaHistorialPublicador_(false);
  if (!hoja || hoja.getLastRow() < 2) return [];

  const ultima = hoja.getLastRow();
  const inicio = Math.max(2, ultima - 39);
  const filas = hoja
    .getRange(inicio, 1, ultima - inicio + 1, 10)
    .getDisplayValues();

  return filas.reverse().map(function(fila) {
    return {
      id: fila[0],
      fecha: fila[1],
      accion: fila[2],
      origen: fila[3],
      hoja: fila[4],
      fila: Number(fila[5] || 0),
      palabra: fila[6],
      deshecho: normalizarClavePublicador_(fila[9]) === 'si'
    };
  });
}

function sincronizarOrigenHistorialPublicador_(origen) {
  origen = normalizarClavePublicador_(origen);
  if (origen === 'diccionario') return sincronizarDiccionarioJsonSinLockPublicador_();
  if (origen === 'vocabulario') return sincronizarVocabularioJsonSinLockPublicador_();
  if (origen === 'ejemplos' || origen === 'alfabeto' || origen === 'alfabetizacion') {
    return sincronizarAlfabetizacionJsonSinLockPublicador_();
  }
  return { ok: true, mensaje: 'Cambio restaurado.' };
}

function deshacerUltimaAccionPublicadorLSPedia(datos) {
  validarSesionEditorPublicador_(datos || {});
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('El Publicador está ocupado. Intenta nuevamente.');

  try {
    const historial = obtenerHojaHistorialPublicador_(false);
    if (!historial || historial.getLastRow() < 2) {
      throw new Error('Todavía no hay acciones que deshacer.');
    }

    const filas = historial
      .getRange(2, 1, historial.getLastRow() - 1, 10)
      .getValues();

    let indiceHistorial = -1;
    for (let i = filas.length - 1; i >= 0; i--) {
      const accion = String(filas[i][2] || '');
      const deshecho = String(filas[i][9] || '').trim();
      if (!deshecho && (accion === 'crear' || accion === 'actualizar' || accion === 'eliminar')) {
        indiceHistorial = i;
        break;
      }
    }

    if (indiceHistorial === -1) {
      throw new Error('No hay acciones recientes disponibles para deshacer.');
    }

    const h = filas[indiceHistorial];
    const accion = String(h[2] || '');
    const origen = String(h[3] || '');
    const nombreHoja = String(h[4] || '');
    let fila = Number(h[5] || 0);
    const palabra = String(h[6] || '');
    const antes = h[7] ? JSON.parse(String(h[7])) : null;
    const despues = h[8] ? JSON.parse(String(h[8])) : null;

    const ss = obtenerSpreadsheetPublicador_();
    const hoja = ss.getSheetByName(nombreHoja);
    if (!hoja) throw new Error('No encuentro la hoja original de esta acción.');

    if (accion === 'crear') {
      if (fila < 2 || fila > hoja.getLastRow()) {
        throw new Error('La fila creada ya cambió de posición. Recarga antes de deshacer.');
      }
      hoja.deleteRow(fila);
    } else if (accion === 'actualizar') {
      if (!antes) throw new Error('No existe la copia anterior de esta edición.');
      if (fila < 2 || fila > hoja.getLastRow()) throw new Error('La fila editada ya no existe.');
      restaurarSnapshotFilaPublicador_(hoja, fila, antes);
    } else if (accion === 'eliminar') {
      if (!antes) throw new Error('No existe la copia de la fila eliminada.');
      const posicion = Math.max(2, Math.min(fila, hoja.getLastRow() + 1));
      if (posicion <= hoja.getLastRow()) hoja.insertRowBefore(posicion);
      else hoja.insertRowAfter(Math.max(1, hoja.getLastRow()));
      fila = posicion;
      restaurarSnapshotFilaPublicador_(hoja, fila, antes);
    }

    SpreadsheetApp.flush();

    if (origen === 'ejemplos') {
      const snap = antes || despues;
      const caracter = limpiarTextoPublicador_(valorSnapshotPublicador_(snap, 'caracter')).toUpperCase();
      if (caracter) reindexarGrupoEjemplosSinObjetivoPublicador_(hoja, caracter);
    }

    if (origen === 'alfabeto') {
      const snap = antes || despues;
      const tipo = limpiarTextoPublicador_(valorSnapshotPublicador_(snap, 'tipo')).toLowerCase();
      if (tipo) reindexarTipoAlfabetizacion_(hoja, tipo, 0, 0);
    }

    if (origen === 'diccionario') {
      try {
        if (accion === 'crear' && despues) {
          actualizarTraduccionInglesGitHubPublicador_(
            'diccionario',
            limpiarTextoPublicador_(valorSnapshotPublicador_(despues, 'palabra')),
            limpiarTextoPublicador_(valorSnapshotPublicador_(despues, 'categoria')),
            '', '', '', ''
          );
        } else if (accion === 'actualizar' && antes) {
          actualizarTraduccionInglesGitHubPublicador_(
            'diccionario',
            limpiarTextoPublicador_(valorSnapshotPublicador_(despues, 'palabra')),
            limpiarTextoPublicador_(valorSnapshotPublicador_(despues, 'categoria')),
            limpiarTextoPublicador_(valorSnapshotPublicador_(antes, 'palabra')),
            limpiarTextoPublicador_(valorSnapshotPublicador_(antes, 'categoria')),
            limpiarTextoPublicador_(valorSnapshotPublicador_(antes, 'ingles')),
            String(valorSnapshotPublicador_(antes, 'definicionIngles') || '').trim()
          );
        }
      } catch (errorTraduccion) {
        console.warn('[LSPedia] Se restauró la ficha, pero no traducciones-en.json:', errorTraduccion);
      }
    }

    const sincronizacion = sincronizarOrigenHistorialPublicador_(origen);
    historial.getRange(indiceHistorial + 2, 10).setValue('SI');

    return {
      ok: true,
      accion: accion,
      origen: origen,
      palabra: palabra,
      fila: fila,
      sincronizacion: sincronizacion
    };
  } finally {
    lock.releaseLock();
  }
}

function obtenerEstadoTecnicoPublicadorLSPedia(datos) {
  validarSesionEditorPublicador_(datos || {});
  const c = configPublicador_();
  const salida = {
    sheets: false,
    github: false,
    sincronizacion: false,
    mensajeSheets: '',
    mensajeGithub: '',
    mensajeSincronizacion: ''
  };

  try {
    const ss = obtenerSpreadsheetPublicador_();
    salida.sheets = !!(
      ss.getSheetByName(c.hojaDiccionario) &&
      ss.getSheetByName(c.hojaVocabulario) &&
      ss.getSheetByName(c.hojaAlfabetizacion) &&
      ss.getSheetByName(c.hojaEjemplos)
    );
    salida.mensajeSheets = salida.sheets
      ? 'Google Sheets conectado.'
      : 'Falta una de las hojas necesarias.';
  } catch (error) {
    salida.mensajeSheets = String(error && error.message ? error.message : error);
  }

  try {
    const token = comprobarTokenPublicador_();
    const url = 'https://api.github.com/repos/' + c.githubUsuario + '/' + c.githubRepo + '/branches/' + c.githubRama;
    const respuesta = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      muteHttpExceptions: true
    });
    salida.github = respuesta.getResponseCode() === 200;
    salida.mensajeGithub = salida.github
      ? 'GitHub conectado a ' + c.githubRama + '.'
      : 'GitHub respondió con código ' + respuesta.getResponseCode() + '.';
  } catch (error) {
    salida.mensajeGithub = String(error && error.message ? error.message : error);
  }

  salida.sincronizacion = salida.sheets && salida.github;
  salida.mensajeSincronizacion = salida.sincronizacion
    ? 'Sincronización disponible.'
    : 'Revisa Sheets/GitHub antes de publicar.';

  return salida;
}


/* ============================================================
   PANEL
   ============================================================ */

function abrirPublicadorLSPedia() {
  const html = crearHtmlPublicadorLSPedia_(false, '')
    .setWidth(860)
    .setHeight(760);

  SpreadsheetApp.getUi().showModelessDialog(
    html,
    'Panel LSPedia v30.0'
  );
}


function instalarPublicadorLSPedia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Abre este proyecto desde el Google Sheet "Proyecto" antes de instalar el Publicador.'
    );
  }

  // Guarda el ID del Sheet para que la Web App pueda encontrarlo
  // cuando se abra desde el celular y no exista un Sheet "activo".
  PropertiesService
    .getScriptProperties()
    .setProperty(
      PROP_PUBLICADOR_SPREADSHEET_ID,
      ss.getId()
    );

  // Genera una sola vez la clave privada del acceso móvil.
  asegurarClavePublicadorMovil_();

  // La primera vez, deja activada la apertura automática del Publicador.
  const propsPublicador = PropertiesService.getScriptProperties();
  if (propsPublicador.getProperty(PROP_PUBLICADOR_AUTOABRIR) === null) {
    propsPublicador.setProperty(PROP_PUBLICADOR_AUTOABRIR, '1');
  }

  // Evita duplicar el disparador si vuelves a ejecutar la instalación.
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (
      trigger.getHandlerFunction() ===
      'alAbrirPublicadorLSPedia'
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Al abrir el Google Sheet, este disparador creará el menú LSPedia.
  ScriptApp
    .newTrigger('alAbrirPublicadorLSPedia')
    .forSpreadsheet(ss)
    .onOpen()
    .create();

  /*
   * IMPORTANTE:
   * No usamos SpreadsheetApp.getUi() aquí.
   *
   * Esta función se ejecuta manualmente desde el editor de Apps Script,
   * y Google puede responder:
   * "Cannot call SpreadsheetApp.getUi() from this context."
   *
   * El menú se creará automáticamente cuando vuelvas al Sheet
   * y recargues la página.
   */
  Logger.log('✅ Panel LSPedia v30.0 instalado correctamente.');
  Logger.log('📱 Acceso móvil preparado.');
  Logger.log('🔄 Ahora vuelve al Google Sheet Proyecto y recarga la página.');

  return {
    ok: true,
    mensaje:
      'Panel LSPedia instalado. Al volver al Google Sheet Proyecto y recargar, se abrirá automáticamente.'
  };
}


function publicadorAperturaAutomaticaActiva_() {
  const valor = PropertiesService
    .getScriptProperties()
    .getProperty(PROP_PUBLICADOR_AUTOABRIR);

  // Activada por defecto. Solo "0" significa desactivada.
  return valor !== '0';
}


function alternarAperturaAutomaticaPublicadorLSPedia() {
  const props = PropertiesService.getScriptProperties();
  const nuevaActiva = !publicadorAperturaAutomaticaActiva_();

  props.setProperty(
    PROP_PUBLICADOR_AUTOABRIR,
    nuevaActiva ? '1' : '0'
  );

  crearMenuPublicadorLSPedia();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    nuevaActiva
      ? 'Panel LSPedia se abrirá automáticamente al abrir este Sheet.'
      : 'La apertura automática de Panel LSPedia quedó desactivada.',
    'LSPedia',
    4
  );
}


function alAbrirPublicadorLSPedia() {
  crearMenuPublicadorLSPedia();

  if (!publicadorAperturaAutomaticaActiva_()) {
    return;
  }

  try {
    abrirPublicadorLSPedia();
  } catch (error) {
    console.warn(
      '[LSPedia] No se pudo abrir automáticamente el Publicador:',
      error
    );
  }
}


function crearMenuPublicadorLSPedia() {
  const autoActiva = publicadorAperturaAutomaticaActiva_();

  SpreadsheetApp.getUi()
    .createMenu('📘 LSPedia')
    .addItem(
      '➕ Abrir Panel LSPedia',
      'abrirPublicadorLSPedia'
    )
    .addItem(
      '📱 Abrir / configurar móvil',
      'mostrarAccesoMovilPublicadorLSPedia'
    )
    .addSeparator()
    .addItem(
      autoActiva
        ? '✅ Apertura automática: activada'
        : '⬜ Apertura automática: desactivada',
      'alternarAperturaAutomaticaPublicadorLSPedia'
    )
    .addSeparator()
    .addItem(
      '🔐 Verificar conexión GitHub',
      'verificarConexionGitHubPublicador'
    )
    .addToUi();
}


/* ============================================================
   DATOS DEL PANEL
   ============================================================ */

function obtenerDatosPublicador() {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();

  const diccionario =
    ss.getSheetByName(c.hojaDiccionario);

  const vocabulario =
    ss.getSheetByName(c.hojaVocabulario);

  const alfabetizacion =
    ss.getSheetByName(c.hojaAlfabetizacion);

  const ejemplos =
    ss.getSheetByName(c.hojaEjemplos);

  if (!diccionario) {
    throw new Error('No encuentro "Diccionario".');
  }

  if (!vocabulario) {
    throw new Error('No encuentro "Vocabulario".');
  }

  if (!alfabetizacion) {
    throw new Error(
      'No encuentro la hoja "Alfabetización".'
    );
  }

  if (!ejemplos) {
    throw new Error(
      'No encuentro "AlfabetizacionEjemplos".'
    );
  }

  // Asegura que la fecha de publicación exista y se vea como fecha
  // directamente en Google Sheets.
  prepararFechaPublicacionPublicador_(diccionario);
  prepararFechaPublicacionPublicador_(vocabulario);

  // Vocabulario usa un identificador interno opaco para el Quiz.
  // Si la hoja todavía tiene la antigua columna "orden", la renombramos
  // a "idQuiz" y reemplazamos los códigos antiguos/números por IDs
  // aleatorios estables y únicos. Las filas sin video quedan sin ID hasta
  // que pasen a formar parte del banco del Quiz.
  asegurarIdsQuizVocabulario_(vocabulario);

  let niveles =
    obtenerValoresUnicosPublicador_(
      vocabulario,
      'nivel'
    );

  if (!niveles.length) {
    niveles = ['Fácil', 'Medio', 'Difícil'];
  }

  let nivelesEjemplos =
    obtenerValoresUnicosPublicador_(
      ejemplos,
      'nivel'
    );

  if (!nivelesEjemplos.length) {
    nivelesEjemplos = ['Fácil', 'Medio', 'Difícil'];
  }

  return {
    categoriasDiccionario:
      obtenerValoresUnicosPublicador_(
        diccionario,
        'categoria'
      ),

    categoriasVocabulario:
      asegurarCategoriasVocabularioPublicador_(
        obtenerValoresUnicosPublicador_(
          vocabulario,
          'categoria'
        )
      ),

    nivelesVocabulario: niveles,

    contenidosDiccionario:
      obtenerContenidosEditablesPublicador_(diccionario),

    contenidosVocabulario:
      obtenerContenidosEditablesPublicador_(vocabulario),

    contenidosEjemplos:
      obtenerContenidosEditablesEjemplosPublicador_(ejemplos),

    contenidosAlfabetizacion:
      obtenerContenidosAlfabetizacionPublicador_(alfabetizacion),

    nivelesEjemplos: nivelesEjemplos,

    rutasIconosCategorias:
      obtenerRutasIconosCategoriasPublicador_()
  };
}


function obtenerContenidosAlfabetizacionPublicador_(hoja) {
  const datos = hoja.getDataRange().getDisplayValues();
  if (datos.length < 2) return [];

  const encabezados = datos[0].map(normalizarClavePublicador_);
  const cTipo = encabezados.indexOf('tipo');
  const cCaracter = encabezados.indexOf('caracter');
  const cNombre = encabezados.indexOf('nombre');
  const cOrden = encabezados.indexOf('orden');
  const cFonetica = encabezados.indexOf('imagenboca');
  const cTrazoVideo = encabezados.indexOf('trazovideo');
  const cGrafiaImagen = encabezados.indexOf('grafiaimagen');
  const cGrafiaMay = encabezados.indexOf('grafiamayuscula');
  const cGrafiaMin = encabezados.indexOf('grafiaminuscula');
  const cGrafiaCurMay = encabezados.indexOf('grafiacursivamayuscula');
  const cGrafiaCurMin = encabezados.indexOf('grafiacursivaminuscula');
  const cCirculo = encabezados.indexOf('imagencirculo');
  if (cTipo === -1 || cCaracter === -1) return [];

  function valorFila(fila, indiceColumna) {
    return indiceColumna === -1 ? '' : limpiarTextoPublicador_(fila[indiceColumna] || '');
  }

  return datos.slice(1).map(function(fila, indice) {
    const tipo = limpiarTextoPublicador_(fila[cTipo] || '').toLowerCase();
    const caracter = limpiarTextoPublicador_(fila[cCaracter] || '');
    const nombre = cNombre === -1 ? '' : limpiarTextoPublicador_(fila[cNombre] || '');
    const orden = cOrden === -1 ? 0 : Number(fila[cOrden] || 0);
    const faltantes = [];
    if (!valorFila(fila, cFonetica)) faltantes.push('fonética');
    if (!valorFila(fila, cCirculo)) faltantes.push('imagen/seña');
    if (tipo === 'numero') {
      if (!valorFila(fila, cTrazoVideo)) faltantes.push('video de grafía');
      if (!valorFila(fila, cGrafiaImagen)) faltantes.push('imagen de grafía');
    } else if (tipo === 'letra') {
      if (!valorFila(fila, cGrafiaMay)) faltantes.push('grafía mayúscula');
      if (!valorFila(fila, cGrafiaMin)) faltantes.push('grafía minúscula');
      if (!valorFila(fila, cGrafiaCurMay)) faltantes.push('cursiva mayúscula');
      if (!valorFila(fila, cGrafiaCurMin)) faltantes.push('cursiva minúscula');
    }
    return {
      fila: indice + 2,
      tipo: tipo,
      caracter: caracter,
      nombre: nombre,
      orden: Number.isFinite(orden) ? orden : 0,
      faltantes: faltantes,
      etiqueta:
        (tipo === 'numero' ? 'Número' : 'Letra') +
        ' · ' + caracter +
        (nombre ? ' · ' + nombre : '') +
        (faltantes.length ? ' · ⚠ ' + faltantes.join(', ') : ' · ✅ completo')
    };
  }).filter(function(item) {
    return (item.tipo === 'letra' || item.tipo === 'numero') && !!item.caracter;
  }).sort(function(a, b) {
    if (a.tipo !== b.tipo) return a.tipo === 'letra' ? -1 : 1;
    const oa = a.orden > 0 ? a.orden : 999999;
    const ob = b.orden > 0 ? b.orden : 999999;
    if (oa !== ob) return oa - ob;
    return a.caracter.localeCompare(b.caracter, 'es', { numeric: true, sensitivity: 'base' });
  });
}
function obtenerContenidosEditablesPublicador_(hoja) {
  const datos = hoja.getDataRange().getDisplayValues();
  if (datos.length < 2) return [];

  const encabezados = datos[0].map(function(valor) {
    return normalizarClavePublicador_(valor);
  });

  const cPalabra = encabezados.indexOf('palabra');
  const cCategoria = encabezados.indexOf('categoria');
  const cVariantes = encabezados.indexOf('variantes');
  const cImagen = encabezados.indexOf('imagen');
  const cVideo = encabezados.indexOf('video');

  if (cPalabra === -1) return [];

  const nombreHoja = hoja.getName();
  const c = configPublicador_();

  return datos
    .slice(1)
    .map(function(fila, indice) {
      const palabra = limpiarTextoPublicador_(fila[cPalabra] || '');
      const categoria = cCategoria === -1 ? '' : limpiarTextoPublicador_(fila[cCategoria] || '');
      const tieneImagen = cImagen !== -1 && !!limpiarTextoPublicador_(fila[cImagen] || '');
      const tieneVideo = cVideo !== -1 && !!limpiarTextoPublicador_(fila[cVideo] || '');

      let estado = 'completo';
      if (nombreHoja === c.hojaDiccionario) {
        if (!tieneImagen && !tieneVideo) estado = 'faltan-ambos';
        else if (!tieneImagen) estado = 'falta-imagen';
        else if (!tieneVideo) estado = 'falta-video';
      } else if (nombreHoja === c.hojaVocabulario) {
        if (!tieneImagen && !tieneVideo) estado = 'faltan-ambos';
        else if (!tieneImagen) estado = 'falta-imagen';
        else if (!tieneVideo) estado = 'falta-video';
        else estado = 'completo';
      }

      return {
        fila: indice + 2,
        palabra: palabra,
        variantes: cVariantes === -1 ? '' : limpiarTextoPublicador_(fila[cVariantes] || ''),
        categoria: categoria,
        tieneImagen: tieneImagen,
        tieneVideo: tieneVideo,
        estado: estado
      };
    })
    .filter(function(item) { return !!item.palabra; })
    .sort(function(a, b) {
      return a.palabra.localeCompare(b.palabra, 'es', { sensitivity: 'base' });
    });
}


function obtenerContenidosEditablesEjemplosPublicador_(hoja) {
  const datos =
    hoja.getDataRange().getDisplayValues();

  if (datos.length < 2) return [];

  const encabezados =
    datos[0].map(function(valor) {
      return normalizarClavePublicador_(valor);
    });

  const cCaracter = encabezados.indexOf('caracter');
  const cPalabra = encabezados.indexOf('palabra');
  const cNivel = encabezados.indexOf('nivel');
  const cOrden = encabezados.indexOf('orden');

  if (cPalabra === -1) return [];

  return datos
    .slice(1)
    .map(function(fila, indice) {
      const caracter =
        cCaracter === -1
          ? ''
          : limpiarTextoPublicador_(fila[cCaracter] || '').toUpperCase();
      const palabra =
        limpiarTextoPublicador_(fila[cPalabra] || '');
      const nivel =
        cNivel === -1
          ? ''
          : limpiarTextoPublicador_(fila[cNivel] || '');
      const ordenTexto =
        cOrden === -1
          ? ''
          : limpiarTextoPublicador_(fila[cOrden] || '');
      const ordenNumero = Number(ordenTexto);

      return {
        fila: indice + 2,
        palabra: palabra,
        caracter: caracter,
        nivel: nivel,
        orden: Number.isFinite(ordenNumero) ? ordenNumero : 999999,
        etiqueta: (caracter ? caracter + ' · ' : '') + palabra
      };
    })
    .filter(function(item) {
      return !!item.palabra;
    })
    .sort(function(a, b) {
      const porCaracter = a.caracter.localeCompare(
        b.caracter,
        'es',
        { sensitivity: 'base' }
      );
      if (porCaracter) return porCaracter;
      if (a.orden !== b.orden) return a.orden - b.orden;
      return a.palabra.localeCompare(
        b.palabra,
        'es',
        { sensitivity: 'base' }
      );
    });
}


function obtenerIndiceColumnaPublicador_(hoja, nombreCampo) {
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0];

  const buscado = normalizarClavePublicador_(nombreCampo);

  return encabezados.findIndex(function(encabezado) {
    return normalizarClavePublicador_(encabezado) === buscado;
  });
}


function prepararFechaPublicacionPublicador_(hoja) {
  if (!hoja) return;

  asegurarEncabezadoPublicador_(
    hoja,
    'fechaPublicacion'
  );

  const indice =
    obtenerIndiceColumnaPublicador_(
      hoja,
      'fechaPublicacion'
    );

  if (indice === -1) return;

  const celdaMuestra =
    hoja.getRange(
      2,
      indice + 1
    );

  if (
    celdaMuestra.getNumberFormat() ===
    'dd/MM/yyyy'
  ) {
    return;
  }

  const filas = Math.max(
    hoja.getMaxRows() - 1,
    1
  );

  hoja
    .getRange(
      2,
      indice + 1,
      filas,
      1
    )
    .setNumberFormat('dd/MM/yyyy');
}


function fechaHtmlPublicador_(valor) {
  if (!valor) return '';

  let fecha = valor;

  if (
    Object.prototype.toString.call(fecha) !== '[object Date]' ||
    isNaN(fecha.getTime())
  ) {
    const texto = String(valor || '').trim();

    if (!texto) return '';

    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      return iso[1] + '-' + iso[2] + '-' + iso[3];
    }

    const latam = texto.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (latam) {
      return (
        latam[3] + '-' +
        ('0' + latam[2]).slice(-2) + '-' +
        ('0' + latam[1]).slice(-2)
      );
    }

    fecha = new Date(texto);
  }

  if (
    Object.prototype.toString.call(fecha) !== '[object Date]' ||
    isNaN(fecha.getTime())
  ) {
    return '';
  }

  const zona =
    obtenerSpreadsheetPublicador_()
      .getSpreadsheetTimeZone() ||
    Session.getScriptTimeZone() ||
    'America/Lima';

  return Utilities.formatDate(
    fecha,
    zona,
    'yyyy-MM-dd'
  );
}


function fechaDesdeHtmlPublicador_(valor) {
  const texto = String(valor || '').trim();

  if (!texto) return '';

  const m = texto.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!m) {
    throw new Error(
      'La fecha debe tener formato válido.'
    );
  }

  const fecha = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    12,
    0,
    0,
    0
  );

  if (
    fecha.getFullYear() !== Number(m[1]) ||
    fecha.getMonth() !== Number(m[2]) - 1 ||
    fecha.getDate() !== Number(m[3])
  ) {
    throw new Error(
      'La fecha de publicación no es válida.'
    );
  }

  return fecha;
}


function obtenerRutasIconosCategoriasPublicador_() {
  const c = configPublicador_();
  const token = comprobarTokenPublicador_();

  const rutaApi = c.carpetaCategorias
    .replace(/\/$/, '')
    .split('/')
    .map(function(parte) {
      return encodeURIComponent(parte);
    })
    .join('/');

  const url =
    'https://api.github.com/repos/' +
    c.githubUsuario +
    '/' +
    c.githubRepo +
    '/contents/' +
    rutaApi +
    '?ref=' +
    encodeURIComponent(c.githubRama);

  try {
    const respuesta = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      muteHttpExceptions: true
    });

    if (respuesta.getResponseCode() !== 200) {
      return {};
    }

    const items = JSON.parse(
      respuesta.getContentText()
    );

    if (!Array.isArray(items)) return {};

    const mapa = {};

    items.forEach(function(item) {
      const nombre = String(item && item.name || '');

      if (!/\.webp$/i.test(nombre)) return;

      const base = nombre.replace(/\.webp$/i, '');
      const slug = slugPublicador_(base);

      if (slug) {
        mapa[slug] = String(item.path || '');
      }
    });

    return mapa;

  } catch (error) {
    return {};
  }
}

function resolverRutaIconoCategoriaPublicador_(categoria) {
  const c = configPublicador_();
  const slug = slugPublicador_(categoria);
  const rutas = obtenerRutasIconosCategoriasPublicador_();

  return rutas[slug] ||
    (c.carpetaCategorias + slug + '.webp');
}







function obtenerValoresUnicosPublicador_(
  hoja,
  encabezado
) {
  const datos =
    hoja.getDataRange().getDisplayValues();

  if (!datos.length) return [];

  const encabezados =
    datos[0].map(function(valor) {
      return normalizarClavePublicador_(valor);
    });

  const columna =
    encabezados.indexOf(
      normalizarClavePublicador_(encabezado)
    );

  if (columna === -1) return [];

  const valores =
    datos
      .slice(1)
      .map(function(fila) {
        return String(
          fila[columna] || ''
        ).trim();
      })
      .filter(Boolean);

  return Array
    .from(new Set(valores))
    .sort(function(a, b) {
      return a.localeCompare(
        b,
        'es',
        { sensitivity: 'base' }
      );
    });
}


// Vocabulario usa "Colores" como categoría canónica.
// La mantenemos visible en el Publicador incluso si una edición temporal
// dejó "Color", cambió mayúsculas/minúsculas o todavía no sincronizó
// todas las filas de la hoja.
function asegurarCategoriasVocabularioPublicador_(categorias) {
  const salida = [];

  (Array.isArray(categorias) ? categorias : [])
    .forEach(function(valor) {
      const limpio = limpiarTextoPublicador_(valor);
      if (!limpio) return;

      const clave = normalizarClavePublicador_(limpio);
      const canonico =
        (clave === 'color' || clave === 'colores')
          ? 'Colores'
          : limpio;

      if (
        !salida.some(function(existente) {
          return normalizarClavePublicador_(existente) ===
            normalizarClavePublicador_(canonico);
        })
      ) {
        salida.push(canonico);
      }
    });

  if (
    !salida.some(function(valor) {
      return normalizarClavePublicador_(valor) === 'colores';
    })
  ) {
    salida.push('Colores');
  }

  return salida.sort(function(a, b) {
    return a.localeCompare(
      b,
      'es',
      { sensitivity: 'base' }
    );
  });
}


/* ============================================================
   ASISTENTE DE CATEGORÍAS
   ============================================================ */

function sugerirCategoriaPublicador(tipo, palabra, definicion) {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const tipoNormalizado = normalizarClavePublicador_(tipo);

  let hoja = null;
  if (tipoNormalizado === 'diccionario') {
    hoja = ss.getSheetByName(c.hojaDiccionario);
  } else if (tipoNormalizado === 'vocabulario') {
    hoja = ss.getSheetByName(c.hojaVocabulario);
  } else {
    throw new Error('El asistente de categorías solo funciona con Diccionario o Vocabulario.');
  }

  const palabraLimpia = limpiarTextoPublicador_(palabra);
  const definicionLimpia = String(definicion || '').trim();

  if (!palabraLimpia || palabraLimpia.length < 2) {
    return {
      ok: true,
      existe: false,
      sugerencias: [],
      parecidas: [],
      nuevaCategoria: ''
    };
  }

  const datos = hoja.getDataRange().getDisplayValues();
  if (!datos.length) {
    return {
      ok: true,
      existe: false,
      sugerencias: [],
      parecidas: [],
      nuevaCategoria: ''
    };
  }

  const headers = datos[0].map(normalizarClavePublicador_);
  const colPalabra = headers.indexOf('palabra');
  const colVariantes = headers.indexOf('variantes');
  const colDefinicion = headers.indexOf('definicion');
  const colCategoria = headers.indexOf('categoria');

  if (colPalabra === -1 || colCategoria === -1) {
    throw new Error('La hoja no tiene las columnas palabra/categoria necesarias.');
  }

  const clavePalabra = normalizarBusquedaCategoriaPublicador_(palabraLimpia);
  const categoriasExactas = [];
  const filasUtiles = [];

  for (let i = 1; i < datos.length; i++) {
    const nombre = limpiarTextoPublicador_(datos[i][colPalabra]);
    const categoria = limpiarTextoPublicador_(datos[i][colCategoria]);
    if (!nombre || !categoria) continue;

    const claveNombre = normalizarBusquedaCategoriaPublicador_(nombre);
    if (claveNombre === clavePalabra && categoriasExactas.indexOf(categoria) === -1) {
      categoriasExactas.push(categoria);
    }

    filasUtiles.push({
      palabra: nombre,
      clavePalabra: claveNombre,
      variantes: colVariantes === -1 ? '' : limpiarTextoPublicador_(datos[i][colVariantes]),
      definicion: colDefinicion === -1 ? '' : limpiarTextoPublicador_(datos[i][colDefinicion]),
      categoria: categoria
    });
  }

  if (categoriasExactas.length) {
    return {
      ok: true,
      existe: true,
      palabra: palabraLimpia,
      categorias: categoriasExactas,
      sugerencias: categoriasExactas.map(function(categoria) {
        return { categoria: categoria, confianza: 'alta', motivo: 'La palabra ya existe.' };
      }),
      parecidas: [],
      nuevaCategoria: ''
    };
  }

  const categoriasExistentes = obtenerValoresUnicosPublicador_(hoja, 'categoria');
  const categoriasPorClave = {};
  categoriasExistentes.forEach(function(categoria) {
    categoriasPorClave[normalizarBusquedaCategoriaPublicador_(categoria)] = categoria;
  });

  const contexto = normalizarBusquedaCategoriaPublicador_(
    palabraLimpia + ' ' + definicionLimpia
  );
  const tokensConsulta = tokensCategoriaPublicador_(contexto);
  const puntajes = {};
  const motivos = {};

  function sumar(categoria, puntos, motivo) {
    const real = categoriasPorClave[normalizarBusquedaCategoriaPublicador_(categoria)];
    if (!real || !puntos) return;
    puntajes[real] = (puntajes[real] || 0) + puntos;
    if (!motivos[real] && motivo) motivos[real] = motivo;
  }

  // 1) Aprende de palabras ya clasificadas: si el concepto nuevo comparte
  // vocabulario importante con fichas existentes, hereda evidencia de su categoría.
  filasUtiles.forEach(function(fila) {
    const textoFila = normalizarBusquedaCategoriaPublicador_(
      fila.palabra + ' ' + fila.variantes + ' ' + fila.definicion
    );
    const tokensFila = tokensCategoriaPublicador_(textoFila);
    let comunes = 0;
    tokensConsulta.forEach(function(token) {
      if (tokensFila.indexOf(token) !== -1) comunes++;
    });

    if (comunes) {
      sumar(
        fila.categoria,
        Math.min(6, comunes * 2),
        'Se parece a palabras ya clasificadas en esta categoría.'
      );
    }

    if (
      fila.clavePalabra &&
      clavePalabra.length >= 4 &&
      (fila.clavePalabra.indexOf(clavePalabra) !== -1 ||
       clavePalabra.indexOf(fila.clavePalabra) !== -1)
    ) {
      sumar(
        fila.categoria,
        4,
        'El nombre se parece a una palabra de esta categoría.'
      );
    }
  });

  // 2) Reglas semánticas ligeras. Solo se proponen categorías que ya existen
  // en la hoja, por lo que el sistema no fuerza categorías nuevas innecesarias.
  const reglas = reglasCategoriasPublicador_();
  Object.keys(reglas).forEach(function(categoria) {
    const palabrasClave = reglas[categoria];
    palabrasClave.forEach(function(palabraClave) {
      const clave = normalizarBusquedaCategoriaPublicador_(palabraClave);
      if (!clave) return;
      if (contexto === clave || contexto.indexOf(' ' + clave + ' ') !== -1 ||
          contexto.indexOf(clave + ' ') === 0 || contexto.lastIndexOf(' ' + clave) === contexto.length - clave.length - 1) {
        sumar(categoria, 5, 'El significado está relacionado con este tema.');
      } else if (clavePalabra === clave) {
        sumar(categoria, 7, 'La palabra está directamente relacionada con este tema.');
      }
    });
  });

  // 3) Si el usuario escribe el nombre de una categoría o una forma muy cercana,
  // esa categoría recibe prioridad.
  categoriasExistentes.forEach(function(categoria) {
    const claveCat = normalizarBusquedaCategoriaPublicador_(categoria);
    if (claveCat && (clavePalabra === claveCat || contexto.indexOf(claveCat) !== -1)) {
      sumar(categoria, 8, 'La palabra coincide con el nombre o tema de la categoría.');
    }
  });

  const sugerencias = Object.keys(puntajes)
    .map(function(categoria) {
      return {
        categoria: categoria,
        puntaje: puntajes[categoria],
        confianza: puntajes[categoria] >= 9 ? 'alta' : (puntajes[categoria] >= 5 ? 'media' : 'baja'),
        motivo: motivos[categoria] || 'Coincide con la organización actual de LSPedia.'
      };
    })
    .sort(function(a, b) {
      if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
      return a.categoria.localeCompare(b.categoria, 'es', { sensitivity: 'base' });
    })
    .slice(0, 3);

  const parecidas = filasUtiles
    .map(function(fila) {
      const distancia = distanciaLevenshteinPublicador_(clavePalabra, fila.clavePalabra);
      const maximo = Math.max(clavePalabra.length, fila.clavePalabra.length, 1);
      return {
        palabra: fila.palabra,
        categoria: fila.categoria,
        distancia: distancia,
        proporcion: distancia / maximo
      };
    })
    .filter(function(item) {
      const limite = clavePalabra.length <= 5 ? 1 : 2;
      return item.distancia > 0 && item.distancia <= limite && item.proporcion <= 0.28;
    })
    .sort(function(a, b) {
      if (a.distancia !== b.distancia) return a.distancia - b.distancia;
      return a.palabra.localeCompare(b.palabra, 'es', { sensitivity: 'base' });
    })
    .slice(0, 3);

  let nuevaCategoria = '';
  let motivoNueva = '';
  const mejorPuntaje = sugerencias.length ? sugerencias[0].puntaje : 0;

  if (mejorPuntaje < 5) {
    const nuevas = reglasCategoriasNuevasPublicador_();
    let mejorNueva = { categoria: '', puntaje: 0, motivo: '' };

    Object.keys(nuevas).forEach(function(categoria) {
      // Si ya existe con otra capitalización, no se propone como nueva.
      if (categoriasPorClave[normalizarBusquedaCategoriaPublicador_(categoria)]) return;
      let puntos = 0;
      nuevas[categoria].forEach(function(palabraClave) {
        const clave = normalizarBusquedaCategoriaPublicador_(palabraClave);
        if (!clave) return;
        if (clavePalabra === clave) puntos += 7;
        else if (contexto.indexOf(clave) !== -1) puntos += 4;
      });
      if (puntos > mejorNueva.puntaje) {
        mejorNueva = {
          categoria: categoria,
          puntaje: puntos,
          motivo: 'No hay una categoría actual suficientemente clara para este tema.'
        };
      }
    });

    if (mejorNueva.puntaje >= 4) {
      nuevaCategoria = mejorNueva.categoria;
      motivoNueva = mejorNueva.motivo;
    }
  }

  return {
    ok: true,
    existe: false,
    palabra: palabraLimpia,
    sugerencias: sugerencias,
    parecidas: parecidas,
    nuevaCategoria: nuevaCategoria,
    motivoNueva: motivoNueva,
    categoriasDisponibles: categoriasExistentes
  };
}


function normalizarBusquedaCategoriaPublicador_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function tokensCategoriaPublicador_(valor) {
  const omitidas = {
    'a':1,'al':1,'algo':1,'como':1,'con':1,'de':1,'del':1,'el':1,'ella':1,'en':1,
    'es':1,'esta':1,'este':1,'esto':1,'la':1,'las':1,'lo':1,'los':1,'o':1,'para':1,
    'por':1,'que':1,'se':1,'sin':1,'su':1,'sus':1,'un':1,'una':1,'uno':1,'y':1
  };

  return Array.from(new Set(
    normalizarBusquedaCategoriaPublicador_(valor)
      .split(' ')
      .filter(function(token) {
        return token.length >= 3 && !omitidas[token];
      })
  ));
}


function reglasCategoriasPublicador_() {
  return {
    'Adjetivos': ['alto','bajo','grande','pequeño','bonito','feo','caro','barato','fuerte','débil','flexible'],
    'Adverbios': ['antes','después','aquí','allí','cerca','lejos','siempre','nunca','también','tampoco'],
    'Animales': ['animal','perro','gato','ave','mamífero','reptil','insecto','mascota'],
    'Cantidad': ['cantidad','mucho','poco','todo','nada','mitad','doble','primero','último'],
    'Casa': ['casa','hogar','habitación','dormitorio','cocina','baño','sala','mueble','pared','techo'],
    'Ciencia': ['ciencia','átomo','molécula','célula','energía','fuerza','masa','experimento','hipótesis'],
    'Ciudad': ['ciudad','municipalidad','mercado','tienda','parque','plaza','edificio','barrio','comisaría'],
    'Colegio': ['colegio','escuela','aula','recreo','tarea','profesor','examen','alumno','estudiante'],
    'Colores': ['color','rojo','azul','verde','amarillo','blanco','negro','morado','naranja'],
    'Comida': ['comida','alimento','desayuno','almuerzo','cena','arroz','pan','fruta','verdura','bebida','receta'],
    'Comunicación': ['comunicación','mensaje','seña','gesto','hablar','conversar','preguntar','responder','explicar','interpretar','traducir'],
    'Cortesía': ['gracias','favor','disculpa','perdón','felicitaciones','bienvenido','cortesía'],
    'Cuerpo': ['cuerpo','cabeza','corazón','pulmón','estómago','hígado','riñón','sangre','órgano'],
    'Deportes': ['deporte','fútbol','vóley','básquet','natación','ciclismo','boxeo','tenis','gol','entrenador'],
    'Economía': ['dinero','precio','costo','gasto','ingreso','banco','crédito','deuda','ahorro','pago','venta','compra'],
    'Educación': ['educación','aprender','enseñar','aprendizaje','curso','materia','estudio','conocimiento','lección'],
    'Emociones': ['emoción','feliz','triste','enojo','miedo','celos','amor','cariño','esperanza','vergüenza','orgullo','sorpresa'],
    'Familia': ['familia','papá','mamá','padre','madre','hermano','hermana','hijo','hija','tío','tía','primo','abuelo','nieto','pareja'],
    'Filosofía': ['filosofía','ética','moral','verdad','realidad','existencia','razón','lógica','escepticismo','epistemología'],
    'Geografía': ['geografía','país','región','costa','sierra','selva','isla','valle','montaña','río','océano','lago'],
    'Habilidades': ['habilidad','liderazgo','organización','planificación','cooperación','adaptabilidad','creatividad','pensamiento'],
    'Naturaleza': ['naturaleza','bosque','mar','río','montaña','árbol','lluvia','viento','clima','terremoto','ecosistema'],
    'Números': ['número','suma','resta','multiplicar','dividir','primero','segundo'],
    'Ocio': ['ocio','juego','música','baile','película','fiesta','pasatiempo','concierto','serie','teatro','fotografía','karaoke'],
    'Personas': ['persona','adulto','niño','joven','bebé','hombre','mujer','vecino'],
    'Política': ['política','gobierno','estado','congreso','presidente','alcalde','elección','voto','candidato','ministro'],
    'Profesiones': ['profesión','doctor','enfermera','profesor','ingeniero','vendedor','intérprete','abogado','psicólogo'],
    'Psicología': ['psicología','ansiedad','autoestima','trauma','motivación','memoria','atención','percepción','conducta','personalidad','terapia','depresión','duelo','psicosis'],
    'Ropa': ['ropa','camisa','pantalón','zapato','chompa','vestido','uniforme'],
    'Salud': ['salud','hospital','clínica','farmacia','ambulancia','doctor','enfermera','enfermedad','dolor','fiebre','vacuna','síntoma','diagnóstico','tratamiento','gripe'],
    'Saludos': ['hola','adiós','buenos días','buenas tardes','buenas noches','saludo','despedida'],
    'Sociedad': ['sociedad','comunidad','inclusión','discriminación','ciudadanía','convivencia','grupo','asociación'],
    'Tecnología': ['tecnología','celular','computadora','internet','wifi','aplicación','contraseña','algoritmo','servidor','código','programa','sistema','inteligencia artificial'],
    'Tiempo': ['tiempo','hora','día','semana','mes','año','mañana','tarde','noche','ayer','calendario','duración','intervalo'],
    'Trabajo': ['trabajo','empleo','empresa','jefe','sueldo','contrato','reunión','currículum','horario','vacante','empleado','empleador'],
    'Trámites': ['trámite','documento','dni','pasaporte','solicitud','certificado','constancia','formulario','registro','inscripción','licencia'],
    'Transporte': ['transporte','bus','combi','taxi','carro','bicicleta','moto','tren','avión','paradero','ruta','tráfico','pasaje','estación'],
    'Universidad': ['universidad','carrera','semestre','beca','tesis','facultad','titulación','posgrado','maestría','doctorado','jurado','sustentación'],
    'Valores': ['valor','respeto','honestidad','solidaridad','justicia','tolerancia','lealtad','generosidad','humildad','integridad','bondad'],
    'Verbos': ['aceptar','abrir','ayudar','apoyar','aprender','caminar','comer','correr','escribir','leer','mirar','practicar','rechazar','trabajar']
  };
}


function reglasCategoriasNuevasPublicador_() {
  return {
    'Legal': ['legal','ley','jurídico','juridico','delito','juicio','juez','fiscal','tribunal','demanda','penal','civil'],
    'Relaciones': ['amistad','novio','novia','relación','relacion','vínculo','vinculo','pareja','conflicto interpersonal'],
    'Ambiente': ['ambiental','ecología','ecologia','reciclaje','sostenibilidad','biodiversidad','residuo'],
    'Viajes': ['viaje','turismo','turista','excursión','excursion','hospedaje','reserva'],
    'Religión': ['religión','religion','iglesia','oración','oracion','fe','culto','biblia']
  };
}


/* ============================================================
   PUBLICADOR 25 — ETIQUETAS SIMPLES
   ------------------------------------------------------------
   Se retiraron los grupos temáticos. Las etiquetas son manuales
   y sirven para reunir contenidos relacionados sin crear otra
   capa de navegación para el usuario.
   ============================================================ */

function normalizarEtiquetasTaxonomiaPublicador23_(valor) {
  let partes = [];

  if (Array.isArray(valor)) {
    partes = valor;
  } else {
    partes = String(valor || '').split(/[,;|]/);
  }

  const salida = [];
  const vistos = {};

  partes.forEach(function(item) {
    const etiqueta = limpiarTextoPublicador_(item);
    const clave = normalizarClavePublicador_(etiqueta);

    if (!etiqueta || !clave || vistos[clave]) return;

    vistos[clave] = true;
    salida.push(etiqueta);
  });

  return salida.slice(0, 12);
}


/* Compatibilidad con código antiguo: ya no se asignan grupos. */
function resolverTaxonomiaPublicador23_(
  categoria,
  grupoManual,
  etiquetasManual
) {
  return {
    grupo: '',
    etiquetas:
      normalizarEtiquetasTaxonomiaPublicador23_(
        etiquetasManual
      ),
    automatica: false
  };
}


/* Publicador 25 ya no usa taxonomía de grupos. */
function obtenerTaxonomiaPublicadorLSPedia(datos) {
  authControlPublicador22_(datos);
  return {
    ok: true,
    grupos: [],
    categorias: {}
  };
}


function distanciaLevenshteinPublicador_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const anterior = [];
  const actual = [];
  for (let j = 0; j <= b.length; j++) anterior[j] = j;

  for (let i = 1; i <= a.length; i++) {
    actual[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      actual[j] = Math.min(
        actual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + costo
      );
    }
    for (let j = 0; j <= b.length; j++) anterior[j] = actual[j];
  }

  return anterior[b.length];
}


/* ============================================================
   PUBLICAR
   ============================================================ */

function publicarContenidoLSPedia(datos) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'El Publicador está ocupado. Intenta nuevamente.'
    );
  }

  try {
    if (!datos || !datos.tipo) {
      throw new Error(
        'No se recibió el tipo de contenido.'
      );
    }

    validarSesionEditorPublicador_(datos);
    // Valida antes de subir recursos o escribir en Sheets.
    lspFechaPublicacionNueva_(datos.fechaPublicacion);

    comprobarTokenPublicador_();

    if (datos.tipo === 'diccionario') {
      return publicarDiccionario_(datos);
    }

    if (datos.tipo === 'vocabulario') {
      return publicarVocabulario_(datos);
    }

    if (datos.tipo === 'alfabetizacion') {
      return publicarEjemploAlfabetizacion_(datos);
    }

    throw new Error(
      'Tipo de publicación no reconocido.'
    );

  } finally {
    lock.releaseLock();
  }
}


function listaArchivosImagenPublicador_(datos) {
  const listaNueva =
    datos && Array.isArray(datos.imagenes)
      ? datos.imagenes
      : [datos && datos.imagen, datos && datos.imagen2];

  // Conservamos huecos para respetar la posición. Ejemplo: si al editar
  // solo se elige la segunda imagen, debe reemplazar la imagen 2 y no la 1.
  return listaNueva.map(function(archivo) {
    return (archivo && archivo.dataUrl && archivo.nombre) ? archivo : null;
  });
}

function rutasImagenPublicador_(valor) {
  return String(valor || '')
    .split(',')
    .map(function(item) { return item.trim(); })
    .filter(Boolean);
}

function prepararListaImagenesPublicador_(archivos, carpeta, palabra, posicionInicial) {
  posicionInicial = Number(posicionInicial) || 1;
  const salida = [];

  (Array.isArray(archivos) ? archivos : []).forEach(function(archivo, indice) {
    if (!(archivo && archivo.dataUrl && archivo.nombre)) return;
    const posicion = posicionInicial + indice;
    const preparada = prepararImagenPublicador_(
      archivo,
      carpeta,
      palabra,
      posicion === 1 ? '' : String(posicion),
      false
    );
    if (preparada) {
      preparada.posicion = posicion;
      salida.push(preparada);
    }
  });

  return salida;
}

function subirListaImagenesPublicador_(imagenes, mensajeBase) {
  (Array.isArray(imagenes) ? imagenes : []).forEach(function(imagen, indice) {
    subirArchivoGitHubPublicador_(
      imagen.ruta,
      imagen.base64,
      String(mensajeBase || 'Actualizar imagen') + ' #' + (indice + 1)
    );
  });
}

function esSiPublicador_(valor) {
  return /^(?:si|sí|yes|true|1|publicar)$/i.test(String(valor == null ? '' : valor).trim());
}

/* ============================================================
   DICCIONARIO
   ============================================================ */

function publicarDiccionario_(datos) {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const hoja =
    ss.getSheetByName(c.hojaDiccionario);

  asegurarEncabezadoPublicador_(hoja, 'publicarSinImagen');

  const palabra =
    limpiarTextoPublicador_(datos.palabra);

  const definicion =
    String(datos.definicion || '').trim();

  const variantes =
    limpiarTextoPublicador_(datos.variantes);

  if (!palabra) {
    throw new Error('Escribe la palabra.');
  }

  const videoCrudo =
    limpiarTextoPublicador_(datos.video);

  const video = videoCrudo
    ? extraerYoutubeIdPublicador_(videoCrudo)
    : '';

  if (videoCrudo && !video) {
    throw new Error(
      'El enlace de YouTube no es válido.'
    );
  }

  const categoria =
    resolverCategoriaPublicador_(
      hoja,
      datos,
      'diccionario'
    );

  const filaExistente =
    buscarFilaExistentePublicador_(
      hoja,
      palabra,
      categoria
    );

  const historialAntes = filaExistente
    ? snapshotFilaPublicador_(hoja, filaExistente)
    : null;

  const videoAnterior = filaExistente
    ? limpiarTextoPublicador_(
        obtenerValorFilaPublicador_(hoja, filaExistente, 'video')
      )
    : '';

  const imagenesAnteriores = filaExistente
    ? limpiarTextoPublicador_(
        obtenerValorFilaPublicador_(hoja, filaExistente, 'imagen')
      )
    : '';

  const publicarSinImagenAnterior = filaExistente
    ? limpiarTextoPublicador_(obtenerValorFilaPublicador_(hoja, filaExistente, 'publicarSinImagen'))
    : '';

  const etiquetasAnteriores = filaExistente
    ? limpiarTextoPublicador_(
        obtenerValorFilaPublicador_(hoja, filaExistente, 'etiquetas')
      )
    : '';

  // Dejar el video vacío al editar NO borra uno existente. Esto permite
  // actualizar concepto/imágenes sin volver a pegar el enlace.
  const videoFinal = video || videoAnterior;

  // La capa bilingüe de conceptos es exclusiva del Diccionario.
  // Si la traducción automática falla, la publicación en español continúa.
  const traduccionIngles =
    crearTraduccionInglesPublicador_(
      palabra,
      definicion
    );

  const archivosImagenes =
    listaArchivosImagenPublicador_(datos);

  const anteriores =
    rutasImagenPublicador_(imagenesAnteriores);

  const imagenesPreparadas =
    prepararListaImagenesPublicador_(
      archivosImagenes,
      c.carpetaDiccionario,
      palabra,
      1
    );

  subirListaImagenesPublicador_(
    imagenesPreparadas,
    'Agregar/actualizar imagen de Diccionario: ' + palabra
  );

  const rutasFinales = anteriores.slice();
  imagenesPreparadas.forEach(function(imagenPreparada) {
    rutasFinales[Math.max(0, Number(imagenPreparada.posicion || 1) - 1)] = imagenPreparada.ruta;
  });

  const imagenesFinales =
    rutasFinales.filter(Boolean);

  const rutaPrincipal =
    imagenesFinales[0] || '';

  const rutaSecundaria =
    imagenesFinales[1] || '';

  const imagenes =
    imagenesFinales.join(', ');

  let publicarSinImagenFinal = esSiPublicador_(publicarSinImagenAnterior) ? 'SI' : '';
  if (datos && datos.publicarSinImagenDecidido === true) {
    publicarSinImagenFinal = datos.publicarSinImagen === true ? 'SI' : '';
  }
  if (!definicion && !imagenesFinales.length) publicarSinImagenFinal = '';
  const publicadaPorContenido = imagenesFinales.length > 0 || (!!definicion && publicarSinImagenFinal === 'SI');

  asegurarEncabezadoPublicador_(
    hoja,
    'fechaPublicacion'
  );

  asegurarEncabezadoPublicador_(
    hoja,
    'ingles'
  );

  asegurarEncabezadoPublicador_(
    hoja,
    'definicionIngles'
  );

  asegurarEncabezadoPublicador_(
    hoja,
    'etiquetas'
  );

  const etiquetas =
    normalizarEtiquetasTaxonomiaPublicador23_(
      limpiarTextoPublicador_(datos.etiquetas)
        ? datos.etiquetas
        : etiquetasAnteriores
    );

  const valores = {
    palabra: palabra,
    variantes: variantes,
    definicion: definicion,
    categoria: categoria,
    etiquetas: etiquetas.join(', '),
    video: videoFinal,
    imagen: imagenes,
    publicarSinImagen: publicarSinImagenFinal,
    senaSugerida: '',
    ingles: traduccionIngles.ingles,
    definicionIngles:
      traduccionIngles.definicionIngles
  };

  // Las fichas nuevas usan la fecha elegida. En fichas existentes se conserva
  // la fecha salvo cuando se agrega su primer video.
  if (videoFinal && (!filaExistente || !videoAnterior)) {
    valores.fechaPublicacion = lspFechaPublicacionNueva_(datos.fechaPublicacion);
  } else if (!filaExistente) {
    valores.fechaPublicacion = lspFechaPublicacionNueva_(datos.fechaPublicacion);
  }

  const fila = filaExistente
    ? actualizarFilaPublicador_(hoja, filaExistente, valores)
    : escribirFilaPublicador_(hoja, valores);

  const sincronizacion =
    ejecutarSincronizacionExistente_(
      hoja,
      fila
    );

  const sincronizacionIngles =
    intentarSincronizarTraduccionInglesPublicador_(
      'diccionario',
      palabra,
      categoria,
      traduccionIngles
    );

  registrarHistorialPublicador_(
    filaExistente ? 'actualizar' : 'crear',
    'diccionario',
    hoja,
    fila,
    palabra,
    historialAntes,
    snapshotFilaPublicador_(hoja, fila)
  );

  return {
    ok: true,
    tipo: 'diccionario',
    palabra: palabra,
    categoria: categoria,
    fila: fila,
    imagen: rutaPrincipal,
    imagen2: rutaSecundaria,
    imagenes: imagenesFinales,
    tieneVideo: !!videoFinal,
    tieneConcepto: !!definicion,
    publicada: publicadaPorContenido,
    publicarSinImagen: publicarSinImagenFinal === 'SI',
    actualizado: !!filaExistente,
    sincronizacion: sincronizacion,
    traduccionIngles: sincronizacionIngles
  };
}


/* ============================================================
   VOCABULARIO
   ============================================================ */

function publicarVocabulario_(datos) {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const hoja =
    ss.getSheetByName(c.hojaVocabulario);

  asegurarEncabezadoPublicador_(hoja, 'publicarSinImagen');
  asegurarIdsQuizVocabulario_(hoja);

  const palabra =
    limpiarTextoPublicador_(datos.palabra);

  const variantes =
    limpiarTextoPublicador_(datos.variantes);

  const definicion =
    String(datos.definicion || '').trim();

  const nivel =
    limpiarTextoPublicador_(datos.nivel);

  if (!palabra) {
    throw new Error('Escribe la palabra.');
  }

  if (!nivel) {
    throw new Error(
      'Selecciona el nivel.'
    );
  }

  const videoCrudo =
    limpiarTextoPublicador_(datos.video);

  const video = videoCrudo
    ? extraerYoutubeIdPublicador_(videoCrudo)
    : '';

  if (videoCrudo && !video) {
    throw new Error(
      'El enlace de YouTube no es válido.'
    );
  }

  const categoria =
    resolverCategoriaPublicador_(
      hoja,
      datos,
      'vocabulario'
    );

  const filaExistente =
    buscarFilaExistentePublicador_(
      hoja,
      palabra,
      categoria
    );

  const historialAntes = filaExistente
    ? snapshotFilaPublicador_(hoja, filaExistente)
    : null;

  const videoAnterior = filaExistente
    ? limpiarTextoPublicador_(
        obtenerValorFilaPublicador_(hoja, filaExistente, 'video')
      )
    : '';

  const imagenesAnteriores = filaExistente
    ? limpiarTextoPublicador_(
        obtenerValorFilaPublicador_(hoja, filaExistente, 'imagen')
      )
    : '';

  const publicarSinImagenAnterior = filaExistente
    ? limpiarTextoPublicador_(obtenerValorFilaPublicador_(hoja, filaExistente, 'publicarSinImagen'))
    : '';

  const etiquetasAnteriores = filaExistente
    ? limpiarTextoPublicador_(
        obtenerValorFilaPublicador_(hoja, filaExistente, 'etiquetas')
      )
    : '';

  const idQuizAnterior = filaExistente
    ? limpiarTextoPublicador_(
        obtenerValorFilaPublicador_(hoja, filaExistente, 'idQuiz')
      )
    : '';

  const videoFinal = video || videoAnterior;

  const archivosImagenes =
    listaArchivosImagenPublicador_(datos);

  const anteriores =
    rutasImagenPublicador_(imagenesAnteriores);

  const imagenesPreparadas =
    prepararListaImagenesPublicador_(
      archivosImagenes,
      c.carpetaVocabulario,
      palabra,
      1
    );

  subirListaImagenesPublicador_(
    imagenesPreparadas,
    'Agregar/actualizar imagen de Vocabulario: ' + palabra
  );

  const rutasFinales = anteriores.slice();
  imagenesPreparadas.forEach(function(imagenPreparada) {
    rutasFinales[Math.max(0, Number(imagenPreparada.posicion || 1) - 1)] = imagenPreparada.ruta;
  });

  const imagenesFinales =
    rutasFinales.filter(Boolean);

  const rutaPrincipal =
    imagenesFinales[0] || '';

  const rutaSecundaria =
    imagenesFinales[1] || '';

  const imagenes =
    imagenesFinales.join(', ');

  // En Vocabulario el concepto no sustituye a la imagen.
  // La columna histórica publicarSinImagen se limpia y se conserva solo
  // por compatibilidad con hojas existentes.
  const publicarSinImagenFinal = '';

  asegurarEncabezadoPublicador_(
    hoja,
    'definicion'
  );

  asegurarEncabezadoPublicador_(
    hoja,
    'fechaPublicacion'
  );

  asegurarEncabezadoPublicador_(
    hoja,
    'etiquetas'
  );

  const etiquetas =
    normalizarEtiquetasTaxonomiaPublicador23_(
      limpiarTextoPublicador_(datos.etiquetas)
        ? datos.etiquetas
        : etiquetasAnteriores
    );

  const idQuizSolicitado =
    limpiarTextoPublicador_(datos && datos.idQuiz);

  let idQuiz = idQuizAnterior;
  if (!idQuiz) {
    if (idQuizSolicitado && esIdQuizValidoPublicador_(idQuizSolicitado)) {
      const usadosIdQuiz = new Set(
        hoja.getRange(2, asegurarEncabezadoIdQuizVocabulario_(hoja), Math.max(hoja.getLastRow() - 1, 1), 1)
          .getDisplayValues().map(function(r){ return String(r[0] || '').trim().toUpperCase(); })
          .filter(Boolean)
      );
      if (!usadosIdQuiz.has(idQuizSolicitado.toUpperCase())) {
        idQuiz = idQuizSolicitado.toUpperCase();
      }
    }
    if (!idQuiz) idQuiz = generarIdQuizUnicoPublicador_(hoja);
  }

  const valores = {
    palabra: palabra,
    variantes: variantes,
    video: videoFinal,
    categoria: categoria,
    etiquetas: etiquetas.join(', '),
    nivel: nivel,
    idQuiz: idQuiz,
    imagen: imagenes,
    definicion: definicion,
    publicarSinImagen: publicarSinImagenFinal
  };

  if (videoFinal && (!filaExistente || !videoAnterior)) {
    valores.fechaPublicacion = lspFechaPublicacionNueva_(datos.fechaPublicacion);
  } else if (!filaExistente) {
    valores.fechaPublicacion = lspFechaPublicacionNueva_(datos.fechaPublicacion);
  }

  const fila = filaExistente
    ? actualizarFilaPublicador_(hoja, filaExistente, valores)
    : escribirFilaPublicador_(hoja, valores);

  SpreadsheetApp.flush();

  const sincronizacion =
    sincronizarVocabularioJsonSinLockPublicador_();

  registrarHistorialPublicador_(
    filaExistente ? 'actualizar' : 'crear',
    'vocabulario',
    hoja,
    fila,
    palabra,
    historialAntes,
    snapshotFilaPublicador_(hoja, fila)
  );

  return {
    ok: true,
    tipo: 'vocabulario',
    palabra: palabra,
    categoria: categoria,
    fila: fila,
    imagen: rutaPrincipal,
    imagen2: rutaSecundaria,
    imagenes: imagenesFinales,
    tieneVideo: !!videoFinal,
    idQuiz: idQuiz,
    actualizado: !!filaExistente,
    sincronizacion: sincronizacion,
    traduccionIngles: null
  };
}


/* ============================================================
   ALFABETIZACIÓN — EJEMPLOS
   ============================================================ */

function publicarEjemploAlfabetizacion_(datos) {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();

  const hoja =
    ss.getSheetByName(c.hojaEjemplos);

  const caracter =
    limpiarTextoPublicador_(datos.caracter)
      .toUpperCase();

  const palabra =
    limpiarTextoPublicador_(datos.palabra);

  const nivel =
    limpiarTextoPublicador_(datos.nivel);

  if (!caracter) {
    throw new Error(
      'Selecciona una letra.'
    );
  }

  if (!palabra) {
    throw new Error(
      'Escribe la palabra del ejemplo.'
    );
  }

  if (!nivel) {
    throw new Error(
      'Selecciona el nivel.'
    );
  }

  comprobarEjemploDuplicadoPublicador_(
    hoja,
    caracter,
    palabra
  );

  const imagen =
    prepararImagenPublicador_(
      datos.imagen,
      c.carpetaEjemplos,
      palabra
    );

  subirArchivoGitHubPublicador_(
    imagen.ruta,
    imagen.base64,
    'Agregar ejemplo de Alfabetización: ' +
      palabra
  );

  asegurarEncabezadoPublicador_(
    hoja,
    'nivel'
  );

  asegurarEncabezadoPublicador_(hoja, 'fechaPublicacion');

  const orden =
    siguienteOrdenCaracterPublicador_(
      hoja,
      caracter
    );

  const fila =
    escribirFilaPublicador_(
      hoja,
      {
        caracter: caracter,
        palabra: palabra,
        imagen: imagen.ruta,
        orden: orden,
        nivel: nivel,
        fechaPublicacion: lspFechaPublicacionNueva_(datos.fechaPublicacion)
      }
    );

  const sincronizacion =
    ejecutarSincronizacionExistente_(
      hoja,
      fila
    );

  registrarHistorialPublicador_(
    'crear',
    'ejemplos',
    hoja,
    fila,
    palabra,
    null,
    snapshotFilaPublicador_(hoja, fila)
  );

  return {
    ok: true,
    tipo: 'alfabetizacion',
    palabra: palabra,
    fila: fila,
    imagen: imagen.ruta,
    orden: orden,
    sincronizacion: sincronizacion
  };
}


/* ============================================================
   TRADUCCIÓN AUTOMÁTICA ES -> EN
   ============================================================ */

function crearTraduccionInglesPublicador_(
  palabra,
  definicion
) {
  const salida = {
    ok: false,
    ingles: '',
    definicionIngles: '',
    error: ''
  };

  try {
    salida.ingles = String(
      LanguageApp.translate(
        String(palabra || '').trim(),
        'es',
        'en'
      ) || ''
    ).trim();

    salida.definicionIngles = String(
      LanguageApp.translate(
        String(definicion || '').trim(),
        'es',
        'en'
      ) || ''
    ).trim();

    salida.ok = Boolean(
      salida.ingles &&
      salida.definicionIngles
    );

    if (!salida.ok) {
      salida.error =
        'Google no devolvió una traducción completa.';
    }
  } catch (error) {
    salida.error = String(error);
  }

  return salida;
}


function intentarSincronizarTraduccionInglesPublicador_(
  fuente,
  palabra,
  categoria,
  traduccion
) {
  if (
    !traduccion ||
    !traduccion.ingles ||
    !traduccion.definicionIngles
  ) {
    return {
      ok: false,
      mensaje:
        'La publicación en español se completó, pero la traducción automática al inglés no estuvo disponible.' +
        (traduccion && traduccion.error
          ? ' Detalle: ' + traduccion.error
          : '')
    };
  }

  try {
    guardarTraduccionInglesGitHubPublicador_(
      fuente,
      palabra,
      categoria,
      traduccion.ingles,
      traduccion.definicionIngles
    );

    return {
      ok: true,
      ingles: traduccion.ingles,
      mensaje:
        'Inglés generado y sincronizado automáticamente.'
    };
  } catch (error) {
    return {
      ok: false,
      ingles: traduccion.ingles,
      mensaje:
        'La publicación en español se completó y la traducción quedó guardada en la hoja, pero no se pudo actualizar data/traducciones-en.json. Detalle: ' +
        String(error)
    };
  }
}


function guardarTraduccionInglesGitHubPublicador_(
  fuente,
  palabra,
  categoria,
  ingles,
  definicionIngles
) {
  const ruta = 'data/traducciones-en.json';
  const actual =
    leerJsonGitHubPublicador_(ruta);

  let documento =
    actual &&
    actual.datos &&
    typeof actual.datos === 'object'
      ? actual.datos
      : {};

  if (!Array.isArray(documento.traducciones)) {
    documento.traducciones = [];
  }

  documento.version = 1;
  documento.actualizado =
    new Date().toISOString();

  const claveFuente =
    normalizarClavePublicador_(fuente);
  const clavePalabra =
    normalizarClavePublicador_(palabra);
  const claveCategoria =
    normalizarClavePublicador_(categoria);

  const nueva = {
    fuente: fuente,
    palabra: palabra,
    categoria: categoria,
    ingles: ingles,
    aliases: [],
    definicionIngles: definicionIngles,
    actualizado: new Date().toISOString()
  };

  const indice =
    documento.traducciones.findIndex(
      function(item) {
        return (
          normalizarClavePublicador_(
            item && item.fuente
          ) === claveFuente &&
          normalizarClavePublicador_(
            item && item.palabra
          ) === clavePalabra &&
          normalizarClavePublicador_(
            item && item.categoria
          ) === claveCategoria
        );
      }
    );

  if (indice === -1) {
    documento.traducciones.push(nueva);
  } else {
    // Conserva aliases revisados manualmente si ya existen.
    const aliasesAnteriores =
      Array.isArray(
        documento.traducciones[indice].aliases
      )
        ? documento.traducciones[indice].aliases
        : [];

    nueva.aliases = aliasesAnteriores;
    documento.traducciones[indice] = nueva;
  }

  documento.traducciones.sort(
    function(a, b) {
      const fa = String(a.fuente || '');
      const fb = String(b.fuente || '');
      const porFuente =
        fa.localeCompare(fb, 'es', {
          sensitivity: 'base'
        });
      if (porFuente) return porFuente;

      return String(a.palabra || '')
        .localeCompare(
          String(b.palabra || ''),
          'es',
          { sensitivity: 'base' }
        );
    }
  );

  const texto =
    JSON.stringify(
      documento,
      null,
      2
    ) + '\n';

  const base64 =
    Utilities.base64Encode(
      Utilities.newBlob(
        texto,
        'application/json',
        'traducciones-en.json'
      ).getBytes()
    );

  subirArchivoGitHubPublicador_(
    ruta,
    base64,
    'Actualizar traducción EN: ' + palabra
  );
}


function leerJsonGitHubPublicador_(ruta) {
  const c = configPublicador_();
  const token =
    comprobarTokenPublicador_();

  const rutaApi =
    String(ruta || '')
      .split('/')
      .map(function(parte) {
        return encodeURIComponent(parte);
      })
      .join('/');

  const url =
    'https://api.github.com/repos/' +
    c.githubUsuario +
    '/' +
    c.githubRepo +
    '/contents/' +
    rutaApi +
    '?ref=' +
    encodeURIComponent(c.githubRama);

  const respuesta =
    UrlFetchApp.fetch(
      url,
      {
        method: 'get',
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        muteHttpExceptions: true
      }
    );

  const codigo =
    respuesta.getResponseCode();

  if (codigo === 404) {
    return null;
  }

  if (codigo !== 200) {
    throw new Error(
      'No se pudo leer "' +
      ruta +
      '" desde GitHub. Código ' +
      codigo +
      '.'
    );
  }

  const payload =
    JSON.parse(
      respuesta.getContentText()
    );

  const contenido =
    String(payload.content || '')
      .replace(/\s/g, '');

  if (!contenido) {
    return {
      sha: payload.sha || '',
      datos: {
        version: 1,
        traducciones: []
      }
    };
  }

  const texto =
    Utilities.newBlob(
      Utilities.base64Decode(contenido)
    ).getDataAsString('UTF-8');

  return {
    sha: payload.sha || '',
    datos: JSON.parse(texto)
  };
}


/* ============================================================
   EDITAR / ELIMINAR CONTENIDO EXISTENTE
   ============================================================ */

function validarSesionEditorPublicador_(datos) {
  if (datos && datos.origenWeb === true) {
    const esperada = PropertiesService
      .getScriptProperties()
      .getProperty(PROP_PUBLICADOR_MOVIL_KEY) || '';

    if (
      !esperada ||
      !datos.claveMovil ||
      String(datos.claveMovil) !== esperada
    ) {
      throw new Error(
        'La sesión del Publicador móvil no está autorizada. ' +
        'Vuelve a abrirlo desde el enlace privado.'
      );
    }
  }

  comprobarTokenPublicador_();
}

/* ============================================================
   EDITOR DE ALFABETIZACIÓN — LETRAS Y NÚMEROS
   ============================================================ */

function asegurarContratoAlfabetizacionPublicador_(hoja) {
  [
    'tipo', 'caracter', 'imagenBoca', 'trazoVideo', 'nombre',
    'grafiaMayuscula', 'grafiaMinuscula',
    'grafiaCursivaMayuscula', 'grafiaCursivaMinuscula',
    'imagenCirculo', 'orden', 'grafiaImagen'
  ].forEach(function(nombre) {
    asegurarEncabezadoPublicador_(hoja, nombre);
  });
}

function mapaEncabezadosPublicador_(hoja) {
  const encabezados = hoja
    .getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1))
    .getDisplayValues()[0];
  const mapa = {};
  encabezados.forEach(function(valor, indice) {
    const clave = normalizarClavePublicador_(valor);
    if (clave) mapa[clave] = indice + 1;
  });
  return mapa;
}

function valorAlfabetizacionFila_(hoja, fila, mapa, campo) {
  const col = mapa[normalizarClavePublicador_(campo)];
  return col
    ? limpiarTextoPublicador_(hoja.getRange(fila, col).getDisplayValue())
    : '';
}

function obtenerFichaAlfabetizacionLSPedia(datos) {
  validarSesionEditorPublicador_(datos || {});
  const c = configPublicador_();
  const hoja = obtenerSpreadsheetPublicador_().getSheetByName(c.hojaAlfabetizacion);
  if (!hoja) throw new Error('No encuentro la hoja "Alfabetización".');
  asegurarContratoAlfabetizacionPublicador_(hoja);

  const fila = Number(datos && datos.fila);
  if (!Number.isInteger(fila) || fila < 2 || fila > hoja.getLastRow()) {
    throw new Error('Selecciona una letra o número existente.');
  }

  const mapa = mapaEncabezadosPublicador_(hoja);
  const salida = { fila: fila };
  [
    'tipo', 'caracter', 'imagenBoca', 'trazoVideo', 'nombre',
    'grafiaMayuscula', 'grafiaMinuscula',
    'grafiaCursivaMayuscula', 'grafiaCursivaMinuscula',
    'imagenCirculo', 'orden', 'grafiaImagen'
  ].forEach(function(campo) {
    salida[campo] = valorAlfabetizacionFila_(hoja, fila, mapa, campo);
  });
  return salida;
}

function extensionMediaAlfabetizacion_(nombre, permitidas) {
  const partes = String(nombre || '').toLowerCase().split('.');
  if (partes.length < 2) return '';
  let ext = partes.pop();
  if (ext === 'jpeg') ext = 'jpg';
  return (permitidas || []).indexOf(ext) !== -1 ? ext : '';
}

function prepararMediaAlfabetizacionPublicador_(archivo, carpeta, caracter, sufijo, permitidas) {
  if (!archivo || !archivo.dataUrl || !archivo.nombre) return null;
  const ext = extensionMediaAlfabetizacion_(archivo.nombre, permitidas);
  if (!ext) {
    throw new Error('El archivo "' + archivo.nombre + '" no tiene un formato permitido.');
  }
  const texto = String(archivo.dataUrl || '');
  const coma = texto.indexOf(',');
  if (coma === -1) throw new Error('No se pudo leer "' + archivo.nombre + '".');
  const base64 = texto.substring(coma + 1);
  if (base64.length > 12000000) {
    throw new Error('El archivo "' + archivo.nombre + '" es demasiado grande. Usa un archivo de menos de 8 MB.');
  }
  const base = slugPublicador_(caracter);
  const extra = sufijo ? '-' + slugPublicador_(sufijo) : '';
  return { ruta: carpeta + base + extra + '.' + ext, base64: base64 };
}

function siguienteOrdenTipoAlfabetizacion_(hoja, tipo) {
  const mapa = mapaEncabezadosPublicador_(hoja);
  const cTipo = mapa.tipo;
  const cOrden = mapa.orden;
  if (!cTipo || !cOrden || hoja.getLastRow() < 2) return 1;
  const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getDisplayValues();
  let mayor = 0;
  datos.forEach(function(fila) {
    if (normalizarClavePublicador_(fila[cTipo - 1]) !== normalizarClavePublicador_(tipo)) return;
    const n = Number(fila[cOrden - 1]);
    if (Number.isFinite(n) && n > mayor) mayor = n;
  });
  return mayor + 1;
}

function reindexarTipoAlfabetizacion_(hoja, tipo, filaObjetivo, ordenDeseado) {
  const mapa = mapaEncabezadosPublicador_(hoja);
  const cTipo = mapa.tipo;
  const cOrden = mapa.orden;
  if (!cTipo || !cOrden || hoja.getLastRow() < 2) return;

  const filas = [];
  for (let fila = 2; fila <= hoja.getLastRow(); fila += 1) {
    const tipoFila = limpiarTextoPublicador_(hoja.getRange(fila, cTipo).getDisplayValue()).toLowerCase();
    if (tipoFila !== tipo) continue;
    const orden = Number(hoja.getRange(fila, cOrden).getValue());
    filas.push({ fila: fila, orden: Number.isFinite(orden) && orden > 0 ? orden : 999999 });
  }

  let objetivo = null;
  const resto = [];
  filas.forEach(function(item) {
    if (filaObjetivo && item.fila === filaObjetivo) objetivo = item;
    else resto.push(item);
  });
  resto.sort(function(a, b) { return a.orden - b.orden || a.fila - b.fila; });

  if (objetivo) {
    let pos = Number(ordenDeseado);
    if (!Number.isInteger(pos) || pos < 1) pos = resto.length + 1;
    pos = Math.min(pos, resto.length + 1);
    resto.splice(pos - 1, 0, objetivo);
  }

  resto.forEach(function(item, indice) {
    hoja.getRange(item.fila, cOrden).setValue(indice + 1);
  });
}

function guardarFichaAlfabetizacionLSPedia(datos) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('El Publicador está ocupado. Intenta nuevamente.');

  try {
    validarSesionEditorPublicador_(datos || {});
    const c = configPublicador_();
    const hoja = obtenerSpreadsheetPublicador_().getSheetByName(c.hojaAlfabetizacion);
    if (!hoja) throw new Error('No encuentro la hoja "Alfabetización".');
    asegurarContratoAlfabetizacionPublicador_(hoja);

    const filaSolicitada = Number(datos && datos.fila);
    const esNueva = !Number.isInteger(filaSolicitada) || filaSolicitada < 2;
    if (!esNueva && filaSolicitada > hoja.getLastRow()) {
      throw new Error('La fila seleccionada ya no existe. Recarga el Publicador.');
    }

    const historialAntes = esNueva
      ? null
      : snapshotFilaPublicador_(hoja, filaSolicitada);

    const tipo = limpiarTextoPublicador_(datos && datos.tipo).toLowerCase();
    let caracter = limpiarTextoPublicador_(datos && datos.caracter);
    const nombre = limpiarTextoPublicador_(datos && datos.nombre);
    if (tipo !== 'letra' && tipo !== 'numero') throw new Error('Selecciona Letra o Número.');

    if (tipo === 'letra') {
      caracter = caracter.toUpperCase();
      if (!/^[A-ZÑ]$/.test(caracter)) throw new Error('Para Letra usa un solo carácter de A a Z o Ñ.');
    } else {
      if (!/^\d{1,4}$/.test(caracter) || Number(caracter) < 0 || Number(caracter) > 9999) {
        throw new Error('Para Número escribe un entero entre 0 y 9999.');
      }
      caracter = String(Number(caracter));
      if (!nombre) throw new Error('Escribe el nombre del número, por ejemplo VEINTE.');
    }

    const mapa = mapaEncabezadosPublicador_(hoja);
    let tipoAnterior = '';
    if (!esNueva) {
      tipoAnterior = valorAlfabetizacionFila_(hoja, filaSolicitada, mapa, 'tipo').toLowerCase();
    }

    // No permitir dos filas con el mismo tipo + carácter.
    for (let fila = 2; fila <= hoja.getLastRow(); fila += 1) {
      if (!esNueva && fila === filaSolicitada) continue;
      const t = valorAlfabetizacionFila_(hoja, fila, mapa, 'tipo').toLowerCase();
      const k = valorAlfabetizacionFila_(hoja, fila, mapa, 'caracter');
      if (t === tipo && normalizarClavePublicador_(k) === normalizarClavePublicador_(caracter)) {
        throw new Error((tipo === 'numero' ? 'El número ' : 'La letra ') + caracter + ' ya existe.');
      }
    }

    let orden = Number(datos && datos.orden);
    if (!Number.isInteger(orden) || orden < 1) {
      orden = siguienteOrdenTipoAlfabetizacion_(hoja, tipo);
    }

    const fonetica = prepararMediaAlfabetizacionPublicador_(
      datos && datos.fonetica, c.carpetaAlfabetizacionBoca, caracter, '',
      ['webm', 'mp4', 'webp', 'png', 'jpg']
    );
    const grafiaNumeroVideo = prepararMediaAlfabetizacionPublicador_(
      datos && datos.grafiaNumeroVideo, c.carpetaAlfabetizacionGrafias, caracter, '', ['mp4', 'webm']
    );
    const grafiaNumeroImagen = prepararMediaAlfabetizacionPublicador_(
      datos && datos.grafiaNumeroImagen, c.carpetaAlfabetizacionGrafias, caracter, '', ['png', 'webp', 'jpg']
    );
    const grafiaMayuscula = prepararMediaAlfabetizacionPublicador_(
      datos && datos.grafiaMayuscula, c.carpetaAlfabetizacionGrafias, caracter, 'mayuscula', ['mp4', 'webm']
    );
    const grafiaMinuscula = prepararMediaAlfabetizacionPublicador_(
      datos && datos.grafiaMinuscula, c.carpetaAlfabetizacionGrafias, caracter, 'minuscula', ['mp4', 'webm']
    );
    const grafiaCursivaMayuscula = prepararMediaAlfabetizacionPublicador_(
      datos && datos.grafiaCursivaMayuscula, c.carpetaAlfabetizacionGrafias, caracter, 'cursiva-mayuscula', ['mp4', 'webm']
    );
    const grafiaCursivaMinuscula = prepararMediaAlfabetizacionPublicador_(
      datos && datos.grafiaCursivaMinuscula, c.carpetaAlfabetizacionGrafias, caracter, 'cursiva-minuscula', ['mp4', 'webm']
    );
    const circulo = prepararMediaAlfabetizacionPublicador_(
      datos && datos.imagenCirculo, c.carpetaAlfabetizacionCirculo, caracter, '', ['webp', 'png', 'jpg']
    );

    [
      [fonetica, 'Actualizar fonética de Alfabetización: ' + caracter],
      [grafiaNumeroVideo, 'Actualizar grafía del número: ' + caracter],
      [grafiaNumeroImagen, 'Actualizar imagen de grafía del número: ' + caracter],
      [grafiaMayuscula, 'Actualizar grafía mayúscula: ' + caracter],
      [grafiaMinuscula, 'Actualizar grafía minúscula: ' + caracter],
      [grafiaCursivaMayuscula, 'Actualizar grafía cursiva mayúscula: ' + caracter],
      [grafiaCursivaMinuscula, 'Actualizar grafía cursiva minúscula: ' + caracter],
      [circulo, 'Actualizar imagen circular de Alfabetización: ' + caracter]
    ].forEach(function(par) {
      if (par[0]) subirArchivoGitHubPublicador_(par[0].ruta, par[0].base64, par[1]);
    });

    const valores = {
      tipo: tipo,
      caracter: caracter,
      nombre: tipo === 'numero' ? nombre.toUpperCase() : '',
      orden: orden
    };
    if (fonetica) valores.imagenBoca = fonetica.ruta;
    if (grafiaNumeroVideo) valores.trazoVideo = grafiaNumeroVideo.ruta;
    if (grafiaNumeroImagen) valores.grafiaImagen = grafiaNumeroImagen.ruta;
    if (grafiaMayuscula) valores.grafiaMayuscula = grafiaMayuscula.ruta;
    if (grafiaMinuscula) valores.grafiaMinuscula = grafiaMinuscula.ruta;
    if (grafiaCursivaMayuscula) valores.grafiaCursivaMayuscula = grafiaCursivaMayuscula.ruta;
    if (grafiaCursivaMinuscula) valores.grafiaCursivaMinuscula = grafiaCursivaMinuscula.ruta;
    if (circulo) valores.imagenCirculo = circulo.ruta;

    const fila = esNueva
      ? escribirFilaPublicador_(hoja, valores)
      : actualizarFilaPublicador_(hoja, filaSolicitada, valores);

    if (tipoAnterior && tipoAnterior !== tipo) {
      reindexarTipoAlfabetizacion_(hoja, tipoAnterior, 0, 0);
    }
    reindexarTipoAlfabetizacion_(hoja, tipo, fila, orden);
    SpreadsheetApp.flush();

    const mapaFinal = mapaEncabezadosPublicador_(hoja);
    const ordenFinal = Number(hoja.getRange(fila, mapaFinal.orden).getValue()) || orden;
    const sincronizacion = ejecutarSincronizacionExistente_(hoja, fila);

    registrarHistorialPublicador_(
      esNueva ? 'crear' : 'actualizar',
      'alfabeto',
      hoja,
      fila,
      caracter,
      historialAntes,
      snapshotFilaPublicador_(hoja, fila)
    );

    return {
      ok: true,
      fila: fila,
      tipo: tipo,
      caracter: caracter,
      nombre: tipo === 'numero' ? nombre.toUpperCase() : '',
      orden: ordenFinal,
      creado: esNueva,
      sincronizacion: sincronizacion
    };
  } finally {
    lock.releaseLock();
  }
}


function obtenerHojaPorOrigenPublicador_(origen) {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const clave = normalizarClavePublicador_(origen);

  if (clave === 'diccionario') {
    return ss.getSheetByName(c.hojaDiccionario);
  }

  if (clave === 'vocabulario') {
    return ss.getSheetByName(c.hojaVocabulario);
  }

  if (
    clave === 'alfabeto' ||
    clave === 'alfabetizacionbase' ||
    clave === 'alfabetoynumeros'
  ) {
    return ss.getSheetByName(c.hojaAlfabetizacion);
  }

  if (
    clave === 'ejemplos' ||
    clave === 'alfabetizacion' ||
    clave === 'alfabetizacionejemplos'
  ) {
    return ss.getSheetByName(c.hojaEjemplos);
  }

  throw new Error(
    'Selecciona Diccionario, Vocabulario, Ejemplos o Alfabeto y números.'
  );
}


function obtenerFichaEditableLSPedia(datos) {
  validarSesionEditorPublicador_(datos || {});

  const origen =
    normalizarClavePublicador_(
      datos && datos.origenContenido
    );

  const hoja =
    obtenerHojaPorOrigenPublicador_(origen);

  const fila = Number(datos && datos.fila);
  const palabraEsperada =
    limpiarTextoPublicador_(
      datos && datos.palabra
    );

  if (!Number.isInteger(fila) || fila < 2) {
    throw new Error(
      'Selecciona una palabra existente.'
    );
  }

  if (fila > hoja.getLastRow()) {
    throw new Error(
      'La fila seleccionada ya no existe. Recarga el Publicador.'
    );
  }

  if (origen !== 'ejemplos') {
    prepararFechaPublicacionPublicador_(hoja);
  }

  if (origen === 'vocabulario') {
    asegurarIdsQuizVocabulario_(hoja);
  }

  if (origen === 'diccionario') {
    asegurarEncabezadoPublicador_(
      hoja,
      'ingles'
    );

    asegurarEncabezadoPublicador_(
      hoja,
      'definicionIngles'
    );
  }

  if (
    origen === 'diccionario' ||
    origen === 'vocabulario'
  ) {

    asegurarEncabezadoPublicador_(
      hoja,
      'etiquetas'
    );
  }

  const ultimaColumna =
    Math.max(hoja.getLastColumn(), 1);

  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0];

  const claves =
    encabezados.map(
      normalizarClavePublicador_
    );

  const rango =
    hoja.getRange(
      fila,
      1,
      1,
      ultimaColumna
    );

  const valores =
    rango.getValues()[0];

  const mostrados =
    rango.getDisplayValues()[0];

  const formulas =
    rango.getFormulas()[0];

  function indice(nombre) {
    return claves.indexOf(
      normalizarClavePublicador_(nombre)
    );
  }

  function mostrar(nombre) {
    const i = indice(nombre);
    return i === -1
      ? ''
      : String(mostrados[i] || '').trim();
  }

  function valor(nombre) {
    const i = indice(nombre);
    return i === -1
      ? ''
      : valores[i];
  }

  function formula(nombre) {
    const i = indice(nombre);
    return i === -1
      ? ''
      : String(formulas[i] || '');
  }

  const palabraActual =
    limpiarTextoPublicador_(
      mostrar('palabra')
    );

  if (
    palabraEsperada &&
    normalizarClavePublicador_(palabraActual) !==
    normalizarClavePublicador_(palabraEsperada)
  ) {
    throw new Error(
      'La fila cambió desde que abriste el Publicador. ' +
      'Recárgalo y vuelve a intentarlo.'
    );
  }

  const imagenTexto =
    mostrar('imagen');

  const imagenes =
    String(imagenTexto || '')
      .split(',')
      .map(function(item) {
        return item.trim();
      })
      .filter(Boolean);

  const video =
    limpiarTextoPublicador_(
      mostrar('video')
    );

  const taxonomiaFicha =
    (
      origen === 'diccionario' ||
      origen === 'vocabulario'
    )
      ? resolverTaxonomiaPublicador23_(
          mostrar('categoria'),
          '',
          mostrar('etiquetas')
        )
      : {
          grupo: '',
          etiquetas: []
        };

  return {
    ok: true,
    origen: origen,
    fila: fila,
    palabra: palabraActual,
    caracter: mostrar('caracter'),
    variantes: mostrar('variantes'),
    definicion: mostrar('definicion'),
    categoria: mostrar('categoria'),
    etiquetas: taxonomiaFicha.etiquetas,
    video: video,
    videoUrl: video
      ? 'https://youtu.be/' + video
      : '',
    imagen: imagenTexto,
    imagenes: imagenes,
    fechaPublicacion:
      fechaHtmlPublicador_(
        valor('fechaPublicacion')
      ),
    fechaPublicacionTexto:
      mostrar('fechaPublicacion'),
    ingles: mostrar('ingles'),
    definicionIngles:
      mostrar('definicionIngles'),
    inglesEsFormula:
      !!formula('ingles'),
    definicionInglesEsFormula:
      !!formula('definicionIngles'),
    nivel: mostrar('nivel'),
    publicarSinImagen:
      origen === 'diccionario'
        ? esSiPublicador_(mostrar('publicarSinImagen'))
        : false,
    idQuiz:
      origen === 'vocabulario'
        ? mostrar('idQuiz')
        : '',
    orden:
      origen === 'ejemplos'
        ? mostrar('orden')
        : ''
  };
}


function traducirFichaLSPedia(datos) {
  validarSesionEditorPublicador_(datos || {});

  const palabra =
    limpiarTextoPublicador_(
      datos && datos.palabra
    );

  const definicion =
    String(
      datos && datos.definicion || ''
    ).trim();

  if (!palabra) {
    throw new Error(
      'Escribe la palabra antes de traducir.'
    );
  }

  if (!definicion) {
    throw new Error(
      'Escribe la definición antes de traducir.'
    );
  }

  const traduccion =
    crearTraduccionInglesPublicador_(
      palabra,
      definicion
    );

  if (!traduccion.ok) {
    throw new Error(
      traduccion.error ||
      'No se pudo generar la traducción.'
    );
  }

  return {
    ok: true,
    ingles: traduccion.ingles,
    definicionIngles:
      traduccion.definicionIngles
  };
}


function actualizarFichaContenidoLSPedia(datos) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'El Publicador está ocupado. Intenta nuevamente.'
    );
  }

  try {
    validarSesionEditorPublicador_(datos || {});

    const c = configPublicador_();

    const origen =
      normalizarClavePublicador_(
        datos && datos.origenContenido
      );

    const hoja =
      obtenerHojaPorOrigenPublicador_(origen);

    const fila = Number(datos && datos.fila);

    const palabraEsperada =
      limpiarTextoPublicador_(
        datos && datos.palabraEsperada
      );

    if (!Number.isInteger(fila) || fila < 2) {
      throw new Error(
        'Selecciona una palabra existente.'
      );
    }

    if (fila > hoja.getLastRow()) {
      throw new Error(
        'La fila seleccionada ya no existe. Recarga el Publicador.'
      );
    }

    if (origen === 'ejemplos') {
      return actualizarEjemploAlfabetizacionDesdeEditor_(
        hoja,
        fila,
        datos || {},
        palabraEsperada,
        c
      );
    }

    prepararFechaPublicacionPublicador_(hoja);

    if (origen === 'vocabulario') {
      asegurarIdsQuizVocabulario_(hoja);
    }

    if (origen === 'diccionario') {
      asegurarEncabezadoPublicador_(hoja, 'publicarSinImagen');
      asegurarEncabezadoPublicador_(
        hoja,
        'ingles'
      );

      asegurarEncabezadoPublicador_(
        hoja,
        'definicionIngles'
      );
    }

    if (
      origen === 'diccionario' ||
      origen === 'vocabulario'
    ) {

      asegurarEncabezadoPublicador_(
        hoja,
        'etiquetas'
      );
    }

    const ultimaColumna =
      Math.max(hoja.getLastColumn(), 1);

    const encabezados = hoja
      .getRange(1, 1, 1, ultimaColumna)
      .getDisplayValues()[0];

    const claves =
      encabezados.map(
        normalizarClavePublicador_
      );

    const rangoActual =
      hoja.getRange(
        fila,
        1,
        1,
        ultimaColumna
      );

    const valoresActuales =
      rangoActual.getValues()[0];

    const mostradosActuales =
      rangoActual.getDisplayValues()[0];

    const historialAntes =
      snapshotFilaPublicador_(hoja, fila);

    function indice(nombre) {
      return claves.indexOf(
        normalizarClavePublicador_(nombre)
      );
    }

    function mostrado(nombre) {
      const i = indice(nombre);
      return i === -1
        ? ''
        : String(
            mostradosActuales[i] || ''
          ).trim();
    }

    function valorActual(nombre) {
      const i = indice(nombre);
      return i === -1
        ? ''
        : valoresActuales[i];
    }

    const palabraAnterior =
      limpiarTextoPublicador_(
        mostrado('palabra')
      );

    const categoriaAnterior =
      limpiarTextoPublicador_(
        mostrado('categoria')
      );

    const definicionAnterior =
      String(
        mostrado('definicion') || ''
      ).trim();

    if (
      palabraEsperada &&
      normalizarClavePublicador_(palabraAnterior) !==
      normalizarClavePublicador_(palabraEsperada)
    ) {
      throw new Error(
        'La fila cambió desde que abriste el Publicador. ' +
        'Recárgalo y vuelve a intentarlo.'
      );
    }

    const palabraNueva =
      limpiarTextoPublicador_(
        datos && datos.palabra
      );

    const variantesNuevas =
      limpiarTextoPublicador_(
        datos && datos.variantes
      );

    const definicionNueva =
      String(
        datos && datos.definicion || ''
      ).trim();

    if (!palabraNueva) {
      throw new Error(
        'La palabra no puede quedar vacía.'
      );
    }

    // Publicador 26: en Diccionario la definición ya no es obligatoria.
    // Una imagen puede bastar para publicar; si solo hay concepto, la UI pide
    // una decisión explícita antes de autorizar publicación sin imagen.

    const categoriaSolicitada =
      limpiarTextoPublicador_(
        datos && datos.categoria
      );

    if (!categoriaSolicitada) {
      throw new Error(
        'Selecciona una categoría.'
      );
    }

    const categoriasExistentes =
      obtenerValoresUnicosPublicador_(
        hoja,
        'categoria'
      );

    const categoriaReal =
      categoriasExistentes.find(function(item) {
        return (
          normalizarClavePublicador_(item) ===
          normalizarClavePublicador_(categoriaSolicitada)
        );
      });

    if (!categoriaReal) {
      throw new Error(
        'Para editar una ficha, selecciona una categoría existente.'
      );
    }

    comprobarDuplicadoPublicadorExceptoFila_(
      hoja,
      palabraNueva,
      categoriaReal,
      fila
    );

    const videoCrudo =
      limpiarTextoPublicador_(
        datos && datos.video
      );

    const videoNuevo = videoCrudo
      ? extraerYoutubeIdPublicador_(videoCrudo)
      : '';

    if (videoCrudo && !videoNuevo) {
      throw new Error(
        'El enlace o ID de YouTube no es válido.'
      );
    }

    const fechaTexto =
      String(
        datos && datos.fechaPublicacion || ''
      ).trim();

    let fechaNueva =
      fechaTexto
        ? fechaDesdeHtmlPublicador_(fechaTexto)
        : '';

    const imagenAnteriorTexto =
      mostrado('imagen');

    const imagenesAnteriores =
      rutasImagenPublicador_(imagenAnteriorTexto);

    const carpeta =
      origen === 'diccionario'
        ? c.carpetaDiccionario
        : c.carpetaVocabulario;

    const imagenNueva =
      prepararImagenPublicador_(
        datos && datos.imagen,
        carpeta,
        palabraNueva,
        '',
        false
      );

    const imagen2Nueva =
      prepararImagenPublicador_(
        datos && datos.imagen2,
        carpeta,
        palabraNueva,
        '2',
        false
      );

    if (imagenNueva) {
      subirArchivoGitHubPublicador_(
        imagenNueva.ruta,
        imagenNueva.base64,
        'Reemplazar imagen principal: ' +
          palabraNueva
      );
    }

    if (imagen2Nueva) {
      subirArchivoGitHubPublicador_(
        imagen2Nueva.ruta,
        imagen2Nueva.base64,
        'Reemplazar segunda imagen: ' +
          palabraNueva
      );
    }

    const galeriaSolicitada =
      !!(datos && Array.isArray(datos.imagenesOrdenActual));

    const rutasPermitidasGaleria = {};
    imagenesAnteriores.forEach(function(ruta) {
      rutasPermitidasGaleria[String(ruta || '').trim()] = true;
    });

    let imagenesFinales = galeriaSolicitada
      ? datos.imagenesOrdenActual
          .map(function(ruta) { return String(ruta || '').trim(); })
          .filter(function(ruta, indice, lista) {
            return !!ruta && !!rutasPermitidasGaleria[ruta] && lista.indexOf(ruta) === indice;
          })
          .slice(0, 8)
      : imagenesAnteriores.slice(0, 8);

    if (imagenNueva) {
      imagenesFinales[0] = imagenNueva.ruta;
    }

    if (imagen2Nueva) {
      imagenesFinales[1] = imagen2Nueva.ruta;
    }

    imagenesFinales =
      imagenesFinales.filter(Boolean);

    const archivosAdicionales =
      datos && Array.isArray(datos.imagenesAdicionales)
        ? datos.imagenesAdicionales.filter(function(archivo) {
            return !!(archivo && archivo.dataUrl && archivo.nombre);
          })
        : [];

    const adicionalesPreparadas =
      prepararListaImagenesPublicador_(
        archivosAdicionales,
        carpeta,
        palabraNueva,
        imagenesFinales.length + 1
      );

    subirListaImagenesPublicador_(
      adicionalesPreparadas,
      'Agregar imagen adicional: ' + palabraNueva
    );

    adicionalesPreparadas.forEach(function(imagenPreparada) {
      imagenesFinales.push(imagenPreparada.ruta);
    });

    const rutaPrincipal =
      imagenesFinales[0] || '';

    const rutaSecundaria =
      imagenesFinales[1] || '';

    const imagenFinal =
      imagenesFinales.join(', ');

    const etiquetasEditadas =
      normalizarEtiquetasTaxonomiaPublicador23_(
        Object.prototype.hasOwnProperty.call(datos || {}, 'etiquetas')
          ? datos.etiquetas
          : mostrado('etiquetas')
      );

    if (
      videoNuevo &&
      !limpiarTextoPublicador_(
        mostrado('video')
      ) &&
      !fechaNueva
    ) {
      fechaNueva = new Date();
    }

    const valores = {
      palabra: palabraNueva,
      variantes: variantesNuevas,
      definicion: definicionNueva,
      categoria: categoriaReal,
      etiquetas: etiquetasEditadas.join(', '),
      video: videoNuevo,
      fechaPublicacion: fechaNueva
    };

    if (origen === 'diccionario') {
      let publicarSinImagenFinal = esSiPublicador_(mostrado('publicarSinImagen')) ? 'SI' : '';
      if (datos && datos.publicarSinImagenDecidido === true) {
        publicarSinImagenFinal = datos.publicarSinImagen === true ? 'SI' : '';
      }
      if (!definicionNueva) publicarSinImagenFinal = '';
      valores.publicarSinImagen = publicarSinImagenFinal;
    }

    if (
      galeriaSolicitada ||
      imagenNueva ||
      imagen2Nueva ||
      adicionalesPreparadas.length
    ) {
      valores.imagen = imagenFinal;
    }

    if (origen === 'vocabulario') {
      const nivel =
        limpiarTextoPublicador_(
          datos && datos.nivel
        );

      if (!nivel) {
        throw new Error(
          'Selecciona el nivel de Vocabulario.'
        );
      }

      valores.nivel = nivel;

      // El ID del Quiz nunca se edita a mano. Se conserva aunque cambie
      // la palabra, la categoría o la posición de la fila. Si por alguna
      // razón falta, se crea automáticamente y se comprueba contra toda
      // la columna para impedir duplicados.
      const idQuizExistente =
        limpiarTextoPublicador_(mostrado('idQuiz'));
      const idQuizSolicitadoEditor =
        limpiarTextoPublicador_(datos && datos.idQuiz);

      valores.idQuiz = idQuizExistente ||
        (idQuizSolicitadoEditor && esIdQuizValidoPublicador_(idQuizSolicitadoEditor)
          ? idQuizSolicitadoEditor.toUpperCase()
          : generarIdQuizUnicoPublicador_(hoja));
    }

    let traduccionUsada = null;
    let traduccionFueEditada = false;
    let traduccionRequiereSync = false;

    if (origen === 'diccionario') {
      const inglesActual =
        mostrado('ingles');

      const definicionInglesActual =
        mostrado('definicionIngles');

      const inglesSolicitado =
        String(
          datos && datos.ingles || ''
        ).trim();

      const definicionInglesSolicitada =
        String(
          datos && datos.definicionIngles || ''
        ).trim();

      traduccionFueEditada =
        inglesSolicitado !== inglesActual ||
        definicionInglesSolicitada !==
          definicionInglesActual;

      if (
        traduccionFueEditada &&
        Boolean(inglesSolicitado) !==
          Boolean(definicionInglesSolicitada)
      ) {
        throw new Error(
          'Para editar el inglés, completa tanto la palabra traducida como la definición traducida, o deja ambas vacías.'
        );
      }

      const cambioTextoEspanol =
        palabraNueva !== palabraAnterior ||
        definicionNueva !== definicionAnterior;

      const cambioCategoria =
        normalizarClavePublicador_(categoriaReal) !==
        normalizarClavePublicador_(categoriaAnterior);

      traduccionRequiereSync =
        traduccionFueEditada ||
        cambioTextoEspanol ||
        cambioCategoria;

      const traduccionActualUtil =
        inglesActual &&
        definicionInglesActual &&
        normalizarClavePublicador_(inglesActual) !==
          'cargando...' &&
        normalizarClavePublicador_(definicionInglesActual) !==
          'cargando...' &&
        inglesActual.charAt(0) !== '#' &&
        definicionInglesActual.charAt(0) !== '#';

      if (traduccionFueEditada) {
        valores.ingles =
          inglesSolicitado;

        valores.definicionIngles =
          definicionInglesSolicitada;

        traduccionUsada = {
          ingles: inglesSolicitado,
          definicionIngles:
            definicionInglesSolicitada
        };

      } else if (
        cambioTextoEspanol ||
        (cambioCategoria && !traduccionActualUtil)
      ) {
        const automatica =
          crearTraduccionInglesPublicador_(
            palabraNueva,
            definicionNueva
          );

        if (automatica.ok) {
          valores.ingles =
            automatica.ingles;

          valores.definicionIngles =
            automatica.definicionIngles;

          traduccionUsada = {
            ingles: automatica.ingles,
            definicionIngles:
              automatica.definicionIngles
          };
        } else {
          traduccionUsada = {
            ingles:
              traduccionActualUtil
                ? inglesActual
                : '',
            definicionIngles:
              traduccionActualUtil
                ? definicionInglesActual
                : '',
            aviso:
              'No se pudo regenerar automáticamente el inglés: ' +
              (automatica.error || 'sin detalle')
          };
        }

      } else {
        traduccionUsada = {
          ingles: inglesActual,
          definicionIngles:
            definicionInglesActual
        };
      }
    }

    actualizarFilaPublicador_(
      hoja,
      fila,
      valores
    );

    prepararFechaPublicacionPublicador_(hoja);

    SpreadsheetApp.flush();

    // Vocabulario se sincroniza con GitHub de forma asíncrona desde la UI.
    // Así el guardado en Sheets responde inmediatamente y la sincronización
    // completa de vocabulario no bloquea al usuario.
    const sincronizacion =
      origen === 'vocabulario'
        ? {
            ok: true,
            pendiente: true,
            mensaje:
              'Guardado en Google Sheets. La sincronización con GitHub se ejecutará en segundo plano.'
          }
        : ejecutarSincronizacionExistente_(
            hoja,
            fila
          );

    let sincronizacionIngles = null;

    if (
      origen === 'diccionario' &&
      traduccionRequiereSync
    ) {
      sincronizacionIngles =
        sincronizarTraduccionEditadaPublicador_({
          fuente: 'diccionario',
          palabraAnterior:
            palabraAnterior,
          categoriaAnterior:
            categoriaAnterior,
          palabra: palabraNueva,
          categoria: categoriaReal,
          ingles:
            traduccionUsada &&
            traduccionUsada.ingles || '',
          definicionIngles:
            traduccionUsada &&
            traduccionUsada.definicionIngles || '',
          aviso:
            traduccionUsada &&
            traduccionUsada.aviso || ''
        });
    } else if (origen === 'diccionario') {
      sincronizacionIngles = {
        ok: true,
        ingles:
          traduccionUsada &&
          traduccionUsada.ingles || '',
        mensaje:
          'La traducción en inglés no cambió.'
      };
    }

    registrarHistorialPublicador_(
      'actualizar',
      origen,
      hoja,
      fila,
      palabraNueva,
      historialAntes,
      snapshotFilaPublicador_(hoja, fila)
    );

    return {
      ok: true,
      tipo: origen,
      fila: fila,
      palabraAnterior:
        palabraAnterior,
      palabra: palabraNueva,
      categoriaAnterior:
        categoriaAnterior,
      categoria: categoriaReal,
      video: videoNuevo,
      tieneVideo: !!videoNuevo,
      idQuiz:
        origen === 'vocabulario'
          ? limpiarTextoPublicador_(valores.idQuiz)
          : '',
      fechaPublicacion:
        fechaHtmlPublicador_(
          fechaNueva
        ),
      imagen: rutaPrincipal,
      imagen2: rutaSecundaria,
      imagenes: imagenesFinales,
      publicada:
        origen === 'vocabulario'
          ? imagenesFinales.length > 0
          : (imagenesFinales.length > 0 || (!!definicionNueva && esSiPublicador_(valores.publicarSinImagen))),
      publicarSinImagen:
        origen === 'diccionario' && esSiPublicador_(valores.publicarSinImagen),
      sincronizacion:
        sincronizacion,
      traduccionIngles:
        sincronizacionIngles,
      traduccionFueEditada:
        traduccionFueEditada
    };

  } finally {
    lock.releaseLock();
  }
}


function comprobarEjemploDuplicadoExceptoFilaPublicador_(
  hoja,
  caracter,
  palabra,
  filaExcluir
) {
  const datos =
    hoja.getDataRange().getDisplayValues();

  if (datos.length < 2) return;

  const encabezados =
    datos[0].map(normalizarClavePublicador_);

  const cCaracter = encabezados.indexOf('caracter');
  const cPalabra = encabezados.indexOf('palabra');

  if (cCaracter === -1 || cPalabra === -1) return;

  for (let i = 1; i < datos.length; i++) {
    const numeroFila = i + 1;
    if (numeroFila === filaExcluir) continue;

    if (
      normalizarClavePublicador_(datos[i][cCaracter]) ===
        normalizarClavePublicador_(caracter) &&
      normalizarClavePublicador_(datos[i][cPalabra]) ===
        normalizarClavePublicador_(palabra)
    ) {
      throw new Error(
        '“' + palabra + '” ya existe como ejemplo de la letra ' + caracter + '.'
      );
    }
  }
}


function reindexarEjemplosCaracterPublicador_(
  hoja,
  caracter,
  filaObjetivo,
  ordenSolicitado
) {
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(normalizarClavePublicador_);

  const cCaracter = encabezados.indexOf('caracter');
  const cOrden = encabezados.indexOf('orden');
  const cPalabra = encabezados.indexOf('palabra');

  if (cCaracter === -1 || cOrden === -1) {
    throw new Error('La hoja de Ejemplos necesita las columnas caracter y orden.');
  }

  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return 1;

  const valores = hoja
    .getRange(2, 1, ultimaFila - 1, ultimaColumna)
    .getDisplayValues();

  const claveCaracter = normalizarClavePublicador_(caracter);
  const items = [];

  valores.forEach(function(fila, indice) {
    const numeroFila = indice + 2;
    if (numeroFila === filaObjetivo) return;
    if (
      normalizarClavePublicador_(fila[cCaracter]) !==
      claveCaracter
    ) return;

    const orden = Number(fila[cOrden]);
    items.push({
      fila: numeroFila,
      orden: Number.isFinite(orden) && orden > 0 ? orden : 999999,
      palabra: cPalabra === -1 ? '' : String(fila[cPalabra] || '')
    });
  });

  items.sort(function(a, b) {
    if (a.orden !== b.orden) return a.orden - b.orden;
    const porPalabra = a.palabra.localeCompare(
      b.palabra,
      'es',
      { sensitivity: 'base' }
    );
    if (porPalabra) return porPalabra;
    return a.fila - b.fila;
  });

  let posicion = Number(ordenSolicitado);
  if (!Number.isFinite(posicion) || posicion < 1) {
    posicion = items.length + 1;
  }
  posicion = Math.max(1, Math.min(Math.round(posicion), items.length + 1));

  items.splice(posicion - 1, 0, {
    fila: filaObjetivo,
    orden: posicion,
    palabra: ''
  });

  items.forEach(function(item, indice) {
    hoja.getRange(item.fila, cOrden + 1).setValue(indice + 1);
  });

  return posicion;
}


function reindexarGrupoEjemplosSinObjetivoPublicador_(hoja, caracter) {
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(normalizarClavePublicador_);

  const cCaracter = encabezados.indexOf('caracter');
  const cOrden = encabezados.indexOf('orden');
  const cPalabra = encabezados.indexOf('palabra');
  if (cCaracter === -1 || cOrden === -1) return;

  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return;

  const valores = hoja
    .getRange(2, 1, ultimaFila - 1, ultimaColumna)
    .getDisplayValues();

  const clave = normalizarClavePublicador_(caracter);
  const items = [];

  valores.forEach(function(fila, indice) {
    if (normalizarClavePublicador_(fila[cCaracter]) !== clave) return;
    const orden = Number(fila[cOrden]);
    items.push({
      fila: indice + 2,
      orden: Number.isFinite(orden) && orden > 0 ? orden : 999999,
      palabra: cPalabra === -1 ? '' : String(fila[cPalabra] || '')
    });
  });

  items.sort(function(a, b) {
    if (a.orden !== b.orden) return a.orden - b.orden;
    const porPalabra = a.palabra.localeCompare(b.palabra, 'es', { sensitivity: 'base' });
    if (porPalabra) return porPalabra;
    return a.fila - b.fila;
  });

  items.forEach(function(item, indice) {
    hoja.getRange(item.fila, cOrden + 1).setValue(indice + 1);
  });
}


function actualizarEjemploAlfabetizacionDesdeEditor_(
  hoja,
  fila,
  datos,
  palabraEsperada,
  config
) {
  asegurarEncabezadoPublicador_(hoja, 'caracter');
  asegurarEncabezadoPublicador_(hoja, 'palabra');
  asegurarEncabezadoPublicador_(hoja, 'imagen');
  asegurarEncabezadoPublicador_(hoja, 'orden');
  asegurarEncabezadoPublicador_(hoja, 'nivel');

  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(normalizarClavePublicador_);

  const rango = hoja.getRange(fila, 1, 1, ultimaColumna);
  const mostrados = rango.getDisplayValues()[0];
  const historialAntes = snapshotFilaPublicador_(hoja, fila);

  function mostrado(nombre) {
    const indice = encabezados.indexOf(normalizarClavePublicador_(nombre));
    return indice === -1 ? '' : String(mostrados[indice] || '').trim();
  }

  const palabraAnterior = limpiarTextoPublicador_(mostrado('palabra'));
  const caracterAnterior = limpiarTextoPublicador_(mostrado('caracter')).toUpperCase();
  const imagenAnterior = limpiarTextoPublicador_(mostrado('imagen'));

  if (
    palabraEsperada &&
    normalizarClavePublicador_(palabraAnterior) !==
      normalizarClavePublicador_(palabraEsperada)
  ) {
    throw new Error(
      'La fila cambió desde que abriste el Publicador. Recárgalo y vuelve a intentarlo.'
    );
  }

  const caracterNuevo = limpiarTextoPublicador_(datos.caracter).toUpperCase();
  const palabraNueva = limpiarTextoPublicador_(datos.palabra);
  const nivelNuevo = limpiarTextoPublicador_(datos.nivel);
  const ordenTexto = String(datos.orden == null ? '' : datos.orden).trim();
  const ordenSolicitado = Number(ordenTexto);

  if (!/^[A-ZÑ]$/.test(caracterNuevo)) {
    throw new Error('Selecciona una letra válida para el ejemplo.');
  }
  if (!palabraNueva) {
    throw new Error('Escribe el ejemplo.');
  }
  if (!nivelNuevo) {
    throw new Error('Selecciona el nivel del ejemplo.');
  }
  if (
    !ordenTexto ||
    !Number.isFinite(ordenSolicitado) ||
    ordenSolicitado < 1
  ) {
    throw new Error('El orden debe ser un número entero desde 1.');
  }

  comprobarEjemploDuplicadoExceptoFilaPublicador_(
    hoja,
    caracterNuevo,
    palabraNueva,
    fila
  );

  const imagenNueva = prepararImagenPublicador_(
    datos.imagen,
    config.carpetaEjemplos,
    palabraNueva,
    '',
    false
  );

  if (imagenNueva) {
    subirArchivoGitHubPublicador_(
      imagenNueva.ruta,
      imagenNueva.base64,
      'Reemplazar imagen de ejemplo: ' + palabraNueva
    );
  }

  actualizarFilaPublicador_(hoja, fila, {
    caracter: caracterNuevo,
    palabra: palabraNueva,
    imagen: imagenNueva ? imagenNueva.ruta : imagenAnterior,
    nivel: nivelNuevo
  });

  if (
    caracterAnterior &&
    normalizarClavePublicador_(caracterAnterior) !==
      normalizarClavePublicador_(caracterNuevo)
  ) {
    reindexarGrupoEjemplosSinObjetivoPublicador_(
      hoja,
      caracterAnterior
    );
  }

  const ordenFinal = reindexarEjemplosCaracterPublicador_(
    hoja,
    caracterNuevo,
    fila,
    ordenSolicitado
  );

  SpreadsheetApp.flush();

  const sincronizacion = ejecutarSincronizacionExistente_(
    hoja,
    fila
  );

  registrarHistorialPublicador_(
    'actualizar',
    'ejemplos',
    hoja,
    fila,
    palabraNueva,
    historialAntes,
    snapshotFilaPublicador_(hoja, fila)
  );

  return {
    ok: true,
    tipo: 'ejemplos',
    fila: fila,
    caracterAnterior: caracterAnterior,
    caracter: caracterNuevo,
    palabraAnterior: palabraAnterior,
    palabra: palabraNueva,
    nivel: nivelNuevo,
    orden: ordenFinal,
    imagen: imagenNueva ? imagenNueva.ruta : imagenAnterior,
    sincronizacion: sincronizacion,
    traduccionIngles: null
  };
}


function sincronizarTraduccionEditadaPublicador_(datos) {
  try {
    actualizarTraduccionInglesGitHubPublicador_(
      datos.fuente,
      datos.palabraAnterior,
      datos.categoriaAnterior,
      datos.palabra,
      datos.categoria,
      datos.ingles,
      datos.definicionIngles
    );

    let mensaje =
      datos.ingles &&
      datos.definicionIngles
        ? 'Traducción en inglés sincronizada.'
        : 'La traducción en inglés quedó vacía y se retiró de traducciones-en.json.';

    if (datos.aviso) {
      mensaje += ' ' + datos.aviso;
    }

    return {
      ok: true,
      ingles: datos.ingles || '',
      mensaje: mensaje
    };

  } catch (error) {
    return {
      ok: false,
      ingles: datos.ingles || '',
      mensaje:
        'La ficha se guardó en Google Sheets, pero no se pudo sincronizar traducciones-en.json. Detalle: ' +
        String(error)
    };
  }
}


function actualizarTraduccionInglesGitHubPublicador_(
  fuente,
  palabraAnterior,
  categoriaAnterior,
  palabraNueva,
  categoriaNueva,
  ingles,
  definicionIngles
) {
  const ruta =
    'data/traducciones-en.json';

  const actual =
    leerJsonGitHubPublicador_(ruta);

  let documento =
    actual &&
    actual.datos &&
    typeof actual.datos === 'object'
      ? actual.datos
      : {};

  if (!Array.isArray(documento.traducciones)) {
    documento.traducciones = [];
  }

  const claveFuente =
    normalizarClavePublicador_(fuente);

  const clavePalabraAnterior =
    normalizarClavePublicador_(
      palabraAnterior
    );

  const claveCategoriaAnterior =
    normalizarClavePublicador_(
      categoriaAnterior
    );

  const clavePalabraNueva =
    normalizarClavePublicador_(
      palabraNueva
    );

  const claveCategoriaNueva =
    normalizarClavePublicador_(
      categoriaNueva
    );

  function coincide(item, palabraClave, categoriaClave) {
    return (
      normalizarClavePublicador_(
        item && item.fuente
      ) === claveFuente &&
      normalizarClavePublicador_(
        item && item.palabra
      ) === palabraClave &&
      normalizarClavePublicador_(
        item && item.categoria
      ) === categoriaClave
    );
  }

  const indiceAnterior =
    documento.traducciones.findIndex(
      function(item) {
        return coincide(
          item,
          clavePalabraAnterior,
          claveCategoriaAnterior
        );
      }
    );

  const indiceNuevo =
    documento.traducciones.findIndex(
      function(item) {
        return coincide(
          item,
          clavePalabraNueva,
          claveCategoriaNueva
        );
      }
    );

  let aliases = [];

  if (indiceAnterior !== -1) {
    aliases =
      Array.isArray(
        documento.traducciones[indiceAnterior].aliases
      )
        ? documento.traducciones[indiceAnterior].aliases
        : [];
  } else if (indiceNuevo !== -1) {
    aliases =
      Array.isArray(
        documento.traducciones[indiceNuevo].aliases
      )
        ? documento.traducciones[indiceNuevo].aliases
        : [];
  }

  const indicesEliminar =
    [indiceAnterior, indiceNuevo]
      .filter(function(indice, posicion, arr) {
        return (
          indice !== -1 &&
          arr.indexOf(indice) === posicion
        );
      })
      .sort(function(a, b) {
        return b - a;
      });

  indicesEliminar.forEach(function(indice) {
    documento.traducciones.splice(
      indice,
      1
    );
  });

  if (ingles && definicionIngles) {
    documento.traducciones.push({
      fuente: fuente,
      palabra: palabraNueva,
      categoria: categoriaNueva,
      ingles: ingles,
      aliases: aliases,
      definicionIngles:
        definicionIngles,
      actualizado:
        new Date().toISOString()
    });
  }

  documento.version = 1;
  documento.actualizado =
    new Date().toISOString();

  documento.traducciones.sort(
    function(a, b) {
      const fa = String(a.fuente || '');
      const fb = String(b.fuente || '');

      const porFuente =
        fa.localeCompare(
          fb,
          'es',
          { sensitivity: 'base' }
        );

      if (porFuente) return porFuente;

      return String(a.palabra || '')
        .localeCompare(
          String(b.palabra || ''),
          'es',
          { sensitivity: 'base' }
        );
    }
  );

  const texto =
    JSON.stringify(
      documento,
      null,
      2
    ) + '\n';

  const base64 =
    Utilities.base64Encode(
      Utilities.newBlob(
        texto,
        'application/json',
        'traducciones-en.json'
      ).getBytes()
    );

  subirArchivoGitHubPublicador_(
    ruta,
    base64,
    'Editar traducción EN: ' +
      palabraNueva
  );
}


function actualizarCategoriaContenidoLSPedia(datos) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'El Publicador está ocupado. Intenta nuevamente.'
    );
  }

  try {
    validarSesionEditorPublicador_(datos || {});

    const origen =
      normalizarClavePublicador_(
        datos && datos.origenContenido
      );

    const hoja =
      obtenerHojaPorOrigenPublicador_(origen);

    if (!hoja) {
      throw new Error(
        'No encuentro la hoja del contenido.'
      );
    }

    const fila = Number(datos && datos.fila);
    const palabraEsperada =
      limpiarTextoPublicador_(
        datos && datos.palabra
      );
    const categoriaSolicitada =
      limpiarTextoPublicador_(
        datos && datos.categoria
      );

    if (!Number.isInteger(fila) || fila < 2) {
      throw new Error(
        'Selecciona una palabra existente.'
      );
    }

    if (!palabraEsperada) {
      throw new Error(
        'No pude identificar la palabra seleccionada.'
      );
    }

    if (!categoriaSolicitada) {
      throw new Error(
        'Selecciona la nueva categoría.'
      );
    }

    const ultimaColumna = hoja.getLastColumn();
    const encabezados = hoja
      .getRange(1, 1, 1, ultimaColumna)
      .getDisplayValues()[0]
      .map(function(valor) {
        return normalizarClavePublicador_(valor);
      });

    const cPalabra = encabezados.indexOf('palabra');
    const cCategoria = encabezados.indexOf('categoria');

    if (cPalabra === -1 || cCategoria === -1) {
      throw new Error(
        'La hoja no tiene las columnas palabra/categoria.'
      );
    }

    if (fila > hoja.getLastRow()) {
      throw new Error(
        'La fila seleccionada ya no existe. Recarga el Publicador.'
      );
    }

    const filaActual = hoja
      .getRange(fila, 1, 1, ultimaColumna)
      .getDisplayValues()[0];

    const palabraActual =
      limpiarTextoPublicador_(
        filaActual[cPalabra] || ''
      );

    if (
      normalizarClavePublicador_(palabraActual) !==
      normalizarClavePublicador_(palabraEsperada)
    ) {
      throw new Error(
        'La fila cambió desde que abriste el Publicador. ' +
        'Recárgalo y vuelve a intentarlo.'
      );
    }

    const historialAntes =
      snapshotFilaPublicador_(hoja, fila);

    const categoriasExistentes =
      obtenerValoresUnicosPublicador_(
        hoja,
        'categoria'
      );

    const categoriaReal =
      categoriasExistentes.find(function(item) {
        return (
          normalizarClavePublicador_(item) ===
          normalizarClavePublicador_(categoriaSolicitada)
        );
      });

    if (!categoriaReal) {
      throw new Error(
        'Para editar una palabra, selecciona una categoría existente.'
      );
    }

    const categoriaAnterior =
      limpiarTextoPublicador_(
        filaActual[cCategoria] || ''
      );

    if (
      normalizarClavePublicador_(categoriaAnterior) ===
      normalizarClavePublicador_(categoriaReal)
    ) {
      return {
        ok: true,
        sinCambios: true,
        tipo: origen,
        palabra: palabraActual,
        fila: fila,
        categoriaAnterior: categoriaAnterior,
        categoria: categoriaReal,
        sincronizacion: {
          ok: true,
          mensaje: 'La palabra ya pertenece a esa categoría.'
        }
      };
    }

    comprobarDuplicadoPublicadorExceptoFila_(
      hoja,
      palabraActual,
      categoriaReal,
      fila
    );

    hoja
      .getRange(fila, cCategoria + 1)
      .setValue(categoriaReal);

    SpreadsheetApp.flush();

    const sincronizacion =
      ejecutarSincronizacionExistente_(
        hoja,
        fila
      );

    registrarHistorialPublicador_(
      'actualizar',
      origen,
      hoja,
      fila,
      palabraActual,
      historialAntes,
      snapshotFilaPublicador_(hoja, fila)
    );

    return {
      ok: true,
      tipo: origen,
      palabra: palabraActual,
      fila: fila,
      categoriaAnterior: categoriaAnterior,
      categoria: categoriaReal,
      sincronizacion: sincronizacion
    };

  } finally {
    lock.releaseLock();
  }
}

function actualizarIconoCategoriaLSPedia(datos) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'El Publicador está ocupado. Intenta nuevamente.'
    );
  }

  try {
    validarSesionEditorPublicador_(datos || {});

    const origen =
      normalizarClavePublicador_(
        datos && datos.origenContenido
      );

    const hoja =
      obtenerHojaPorOrigenPublicador_(origen);

    if (!hoja) {
      throw new Error(
        'No encuentro la hoja del contenido.'
      );
    }

    const categoriaSolicitada =
      limpiarTextoPublicador_(
        datos && datos.categoria
      );

    if (!categoriaSolicitada) {
      throw new Error(
        'Selecciona una categoría.'
      );
    }

    const categoriasExistentes =
      obtenerValoresUnicosPublicador_(
        hoja,
        'categoria'
      );

    const categoriaReal =
      categoriasExistentes.find(function(item) {
        return (
          normalizarClavePublicador_(item) ===
          normalizarClavePublicador_(categoriaSolicitada)
        );
      });

    if (!categoriaReal) {
      throw new Error(
        'La categoría seleccionada ya no existe. Recarga el Publicador.'
      );
    }

    const ruta =
      guardarIconoCategoriaPublicador_(
        categoriaReal,
        datos && datos.iconoCategoria,
        'Actualizar icono de categoría: ' + categoriaReal
      );

    return {
      ok: true,
      tipo: origen,
      categoria: categoriaReal,
      ruta: ruta
    };

  } finally {
    lock.releaseLock();
  }
}





/* ============================================================
   BÚSQUEDA GLOBAL Y BORRADORES EN SHEETS
   ------------------------------------------------------------
   Estas operaciones son deliberadamente independientes de GitHub:
   - buscarContenidoPublicadorLSPedia() lee directamente las hojas.
   - agregarBorradorContenidoLSPedia() solo agrega una fila a Sheets.
     NO sincroniza JSON, NO publica en GitHub y NO ejecuta onEdit().
   ============================================================ */

function buscarContenidoPublicadorLSPedia(datos) {
  validarSesionEditorPublicador_(datos || {});

  const origen = normalizarClavePublicador_(
    datos && datos.origenContenido
  );

  if (origen !== 'diccionario' && origen !== 'vocabulario') {
    throw new Error('La búsqueda global solo está disponible para Diccionario y Vocabulario.');
  }

  const consulta = normalizarClavePublicador_(
    datos && datos.consulta
  );

  if (!consulta) return [];

  const hoja = obtenerHojaPorOrigenPublicador_(origen);
  if (!hoja) throw new Error('No encuentro la hoja del contenido.');

  const datosHoja = hoja.getDataRange().getDisplayValues();
  if (datosHoja.length < 2) return [];

  const encabezados = datosHoja[0].map(function(valor) {
    return normalizarClavePublicador_(valor);
  });

  const cPalabra = encabezados.indexOf('palabra');
  const cCategoria = encabezados.indexOf('categoria');
  const cVariantes = encabezados.indexOf('variantes');
  const cEtiquetas = encabezados.indexOf('etiquetas');

  if (cPalabra === -1) return [];

  const resultados = [];

  datosHoja.slice(1).forEach(function(fila, indice) {
    const palabra = limpiarTextoPublicador_(fila[cPalabra] || '');
    const categoria = cCategoria === -1 ? '' : limpiarTextoPublicador_(fila[cCategoria] || '');
    const variantes = cVariantes === -1 ? '' : limpiarTextoPublicador_(fila[cVariantes] || '');
    const etiquetas = cEtiquetas === -1 ? '' : limpiarTextoPublicador_(fila[cEtiquetas] || '');

    if (!palabra) return;

    const texto = normalizarClavePublicador_(
      [palabra, variantes, categoria, etiquetas].filter(Boolean).join(' ')
    );

    if (!texto.includes(consulta)) return;

    resultados.push({
      fila: indice + 2,
      palabra: palabra,
      variantes: variantes,
      categoria: categoria,
      etiquetas: etiquetas
    });
  });

  resultados.sort(function(a, b) {
    const aExacto = normalizarClavePublicador_(a.palabra) === consulta ? 0 : 1;
    const bExacto = normalizarClavePublicador_(b.palabra) === consulta ? 0 : 1;
    if (aExacto !== bExacto) return aExacto - bExacto;
    return a.palabra.localeCompare(b.palabra, 'es', { sensitivity: 'base' });
  });

  return resultados.slice(0, 200);
}


function agregarBorradorContenidoLSPedia(datos) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error('El Publicador está ocupado. Intenta nuevamente.');
  }

  try {
    validarSesionEditorPublicador_(datos || {});

    const origen = normalizarClavePublicador_(
      datos && datos.origenContenido
    );

    if (origen !== 'diccionario' && origen !== 'vocabulario') {
      throw new Error('Solo puedes agregar borradores al Diccionario o Vocabulario.');
    }

    const palabra = limpiarTextoPublicador_(datos && datos.palabra);
    const variantes = limpiarTextoPublicador_(datos && datos.variantes);
    const categoria = limpiarTextoPublicador_(datos && datos.categoria);

    if (!palabra) throw new Error('Escribe la palabra.');
    if (!categoria) throw new Error('Selecciona o escribe la categoría.');

    const hoja = obtenerHojaPorOrigenPublicador_(origen);
    if (!hoja) throw new Error('No encuentro la hoja del contenido.');

    const filaExistente = buscarFilaExistentePublicador_(
      hoja,
      palabra,
      categoria
    );

    if (filaExistente) {
      throw new Error(
        '"' + palabra + '" ya existe en la categoría "' + categoria + '" (fila ' + filaExistente + ').'
      );
    }

    asegurarEncabezadoPublicador_(hoja, 'palabra');
    asegurarEncabezadoPublicador_(hoja, 'variantes');
    asegurarEncabezadoPublicador_(hoja, 'categoria');

    const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
    const encabezados = hoja
      .getRange(1, 1, 1, ultimaColumna)
      .getDisplayValues()[0]
      .map(function(valor) {
        return normalizarClavePublicador_(valor);
      });

    const filaNueva = new Array(ultimaColumna).fill('');
    const poner = function(nombre, valor) {
      const indice = encabezados.indexOf(normalizarClavePublicador_(nombre));
      if (indice !== -1) filaNueva[indice] = valor == null ? '' : valor;
    };

    poner('palabra', palabra);
    poner('variantes', variantes);
    poner('categoria', categoria);

    hoja.appendRow(filaNueva);
    SpreadsheetApp.flush();

    const fila = hoja.getLastRow();

    return {
      ok: true,
      borrador: true,
      publicado: false,
      tipo: origen,
      palabra: palabra,
      variantes: variantes,
      categoria: categoria,
      fila: fila,
      mensaje:
        'Guardado únicamente en Google Sheets. No se publicó ni se sincronizó con GitHub.'
    };
  } finally {
    lock.releaseLock();
  }
}


function eliminarContenidoLSPedia(datos) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'El Publicador está ocupado. Intenta nuevamente.'
    );
  }

  try {
    validarSesionEditorPublicador_(datos || {});

    const origen =
      normalizarClavePublicador_(
        datos && datos.origenContenido
      );

    const hoja =
      obtenerHojaPorOrigenPublicador_(origen);

    if (!hoja) {
      throw new Error('No encuentro la hoja del contenido.');
    }

    const fila = Number(datos && datos.fila);

    if (!Number.isInteger(fila) || fila < 2) {
      throw new Error('Selecciona un contenido existente.');
    }

    if (fila > hoja.getLastRow()) {
      throw new Error(
        'La fila seleccionada ya no existe. Recarga el Publicador.'
      );
    }

    const ultimaColumna = hoja.getLastColumn();
    const encabezados = hoja
      .getRange(1, 1, 1, ultimaColumna)
      .getDisplayValues()[0]
      .map(function(valor) {
        return normalizarClavePublicador_(valor);
      });

    const filaActual = hoja
      .getRange(fila, 1, 1, ultimaColumna)
      .getDisplayValues()[0];

    const historialAntes =
      snapshotFilaPublicador_(hoja, fila);

    /* ---------------------------------------------------------
       ALFABETO Y NÚMEROS
       --------------------------------------------------------- */
    if (origen === 'alfabeto') {
      const cCaracter = encabezados.indexOf('caracter');
      const cTipo = encabezados.indexOf('tipo');
      const cNombre = encabezados.indexOf('nombre');

      if (cCaracter === -1) {
        throw new Error(
          'La hoja Alfabetización no tiene la columna caracter.'
        );
      }

      const caracterEsperado = limpiarTextoPublicador_(
        (datos && datos.caracter) || (datos && datos.palabra)
      );
      const caracterActual = limpiarTextoPublicador_(
        filaActual[cCaracter] || ''
      );
      const tipoActual = cTipo === -1
        ? ''
        : limpiarTextoPublicador_(filaActual[cTipo] || '').toLowerCase();
      const nombreActual = cNombre === -1
        ? ''
        : limpiarTextoPublicador_(filaActual[cNombre] || '');

      if (!caracterEsperado) {
        throw new Error(
          'No pude identificar la letra o número seleccionado.'
        );
      }

      if (
        normalizarClavePublicador_(caracterActual) !==
        normalizarClavePublicador_(caracterEsperado)
      ) {
        throw new Error(
          'La fila cambió desde que abriste el Publicador. ' +
          'Recárgalo y vuelve a intentarlo.'
        );
      }

      hoja.deleteRow(fila);

      if (tipoActual) {
        reindexarTipoAlfabetizacion_(
          hoja,
          tipoActual,
          0,
          0
        );
      }

      SpreadsheetApp.flush();

      const sync =
        sincronizarAlfabetizacionJsonSinLockPublicador_();
      const etiqueta =
        (tipoActual === 'numero' ? 'Número ' : 'Letra ') +
        caracterActual +
        (nombreActual ? ' · ' + nombreActual : '');

      registrarHistorialPublicador_(
        'eliminar',
        'alfabeto',
        hoja,
        fila,
        caracterActual,
        historialAntes,
        null
      );

      return {
        ok: true,
        tipo: origen,
        caracter: caracterActual,
        tipoAlfabetizacion: tipoActual,
        palabra: caracterActual,
        etiqueta: etiqueta,
        filaEliminada: fila,
        sincronizacion: Object.assign({}, sync, {
          mensaje:
            'Eliminado de Alfabeto y Números. alfabetizacion.json quedó sincronizado.'
        }),
        imagenesConservadas: true
      };
    }

    /* ---------------------------------------------------------
       DICCIONARIO / VOCABULARIO / EJEMPLOS
       --------------------------------------------------------- */
    const palabraEsperada =
      limpiarTextoPublicador_(
        datos && datos.palabra
      );

    if (!palabraEsperada) {
      throw new Error(
        'No pude identificar el contenido seleccionado.'
      );
    }

    const cPalabra = encabezados.indexOf('palabra');
    const cDefinicion = encabezados.indexOf('definicion');
    const cCategoria = encabezados.indexOf('categoria');
    const cCaracter = encabezados.indexOf('caracter');

    if (cPalabra === -1) {
      throw new Error(
        'La hoja no tiene la columna palabra.'
      );
    }

    const palabraActual =
      limpiarTextoPublicador_(
        filaActual[cPalabra] || ''
      );

    if (
      normalizarClavePublicador_(palabraActual) !==
      normalizarClavePublicador_(palabraEsperada)
    ) {
      throw new Error(
        'La fila cambió desde que abriste el Publicador. ' +
        'Recárgalo y vuelve a intentarlo.'
      );
    }

    const definicion =
      cDefinicion === -1
        ? ''
        : String(filaActual[cDefinicion] || '').trim();

    const categoria =
      cCategoria === -1
        ? ''
        : limpiarTextoPublicador_(
            filaActual[cCategoria] || ''
          );

    const caracterEjemplo =
      cCaracter === -1
        ? ''
        : limpiarTextoPublicador_(
            filaActual[cCaracter] || ''
          );

    hoja.deleteRow(fila);

    if (origen === 'ejemplos' && caracterEjemplo) {
      reindexarGrupoEjemplosSinObjetivoPublicador_(
        hoja,
        caracterEjemplo
      );
    }

    SpreadsheetApp.flush();

    let sincronizacion = {
      ok: true,
      mensaje:
        origen === 'vocabulario'
          ? 'Eliminado de Vocabulario. La sincronización automática actualizará los datos publicados.'
          : (origen === 'ejemplos'
              ? 'Eliminado de Ejemplos.'
              : 'Eliminado del Diccionario.')
    };

    if (origen === 'diccionario') {
      const ultimaFila = hoja.getLastRow();

      if (ultimaFila >= 2) {
        const filaDisparo = Math.min(
          Math.max(2, fila),
          ultimaFila
        );

        sincronizacion =
          ejecutarSincronizacionExistente_(
            hoja,
            filaDisparo
          );
      } else {
        sincronizacion = {
          ok: true,
          mensaje:
            'Eliminado del Diccionario. No quedan filas de contenido para disparar la sincronización por onEdit.'
        };
      }
    } else if (origen === 'ejemplos') {
      const sync =
        sincronizarAlfabetizacionJsonSinLockPublicador_();
      sincronizacion = Object.assign({}, sync, {
        mensaje:
          'Eliminado de Ejemplos. alfabetizacion.json quedó sincronizado.'
      });
    }

    registrarHistorialPublicador_(
      'eliminar',
      origen,
      hoja,
      fila,
      palabraActual,
      historialAntes,
      null
    );

    return {
      ok: true,
      tipo: origen,
      palabra: palabraActual,
      etiqueta:
        origen === 'ejemplos' && caracterEjemplo
          ? caracterEjemplo + ' · ' + palabraActual
          : palabraActual,
      caracter: caracterEjemplo,
      categoria: categoria,
      definicion: definicion,
      filaEliminada: fila,
      sincronizacion: sincronizacion,
      imagenesConservadas: true
    };

  } finally {
    lock.releaseLock();
  }
}



/* ============================================================
   CATEGORÍAS
   ============================================================ */

function resolverCategoriaPublicador_(
  hoja,
  datos,
  origen
) {
  const seleccion =
    limpiarTextoPublicador_(datos.categoria);

  if (
    seleccion &&
    seleccion !== '__NUEVA__'
  ) {
    return seleccion;
  }

  const nueva =
    limpiarTextoPublicador_(
      datos.nuevaCategoria
    );

  if (!nueva) {
    throw new Error(
      'Escribe el nombre de la nueva categoría.'
    );
  }

  if (/\s/.test(nueva.trim())) {
    throw new Error(
      'Las categorías nuevas de LSPedia deben tener un nombre de una sola palabra.'
    );
  }

  const existentes =
    obtenerValoresUnicosPublicador_(
      hoja,
      'categoria'
    );

  const encontrada =
    existentes.find(function(item) {
      return (
        normalizarClavePublicador_(item) ===
        normalizarClavePublicador_(nueva)
      );
    });

  if (encontrada) {
    return encontrada;
  }

  if (!datos.iconoCategoria) {
    throw new Error(
      'La categoría "' +
      nueva +
      '" es nueva. Debes subir su icono .webp.'
    );
  }

  const nombreOriginal =
    String(
      datos.iconoCategoria.nombre || ''
    );

  if (
    !nombreOriginal
      .toLowerCase()
      .endsWith('.webp')
  ) {
    throw new Error(
      'El icono de una categoría nueva debe ser .webp.'
    );
  }

  const c = configPublicador_();

  const ruta =
    c.carpetaCategorias +
    slugPublicador_(nueva) +
    '.webp';

  const base64 =
    extraerBase64Publicador_(
      datos.iconoCategoria.dataUrl
    );

  subirArchivoGitHubPublicador_(
    ruta,
    base64,
    'Agregar icono de categoría: ' +
      nueva
  );

  return nueva;
}


function guardarIconoCategoriaPublicador_(
  categoria,
  archivo,
  mensaje
) {
  if (
    !archivo ||
    !archivo.nombre ||
    !archivo.dataUrl
  ) {
    throw new Error(
      'Selecciona un icono .webp.'
    );
  }

  const nombreOriginal =
    String(archivo.nombre || '');

  const extension =
    extensionImagenPublicador_(
      nombreOriginal
    );
  if (extension !== 'webp') {
    throw new Error(
      'El icono de la categoría debe ser .webp.'
    );
  }

  const ruta =
    resolverRutaIconoCategoriaPublicador_(
      categoria
    );

  const dataUrlTexto = String(archivo.dataUrl || '');
  const mimeMatch = dataUrlTexto.match(/^data:([^;,]+);base64,/i);
  const mime = mimeMatch ? String(mimeMatch[1] || '').toLowerCase() : '';
  const mimePermitidos = {
    webp: ['image/webp'],
    png: ['image/png'],
    jpg: ['image/jpeg', 'image/jpg']
  };
  if (!mime || (mimePermitidos[extension] || []).indexOf(mime) === -1) {
    throw new Error('El contenido del archivo no coincide con una imagen ' + extension.toUpperCase() + ' válida.');
  }

  const base64 =
    extraerBase64Publicador_(
      archivo.dataUrl
    );

  if (!base64) {
    throw new Error(
      'No se pudo leer el icono seleccionado.'
    );
  }

  subirArchivoGitHubPublicador_(
    ruta,
    base64,
    mensaje ||
      ('Actualizar icono de categoría: ' + categoria)
  );

  return ruta;
}





/* ============================================================
   IMÁGENES
   ============================================================ */

function prepararImagenPublicador_(
  archivo,
  carpeta,
  nombreBase,
  sufijo,
  obligatorio
) {
  obligatorio = obligatorio !== false;

  if (
    !archivo ||
    !archivo.dataUrl ||
    !archivo.nombre
  ) {
    if (!obligatorio) return null;
    throw new Error(
      'Debes seleccionar una imagen.'
    );
  }

  const extension =
    extensionImagenPublicador_(
      archivo.nombre
    );

  if (!extension) {
    throw new Error(
      'Usa una imagen WEBP, PNG, JPG o JPEG.'
    );
  }

  const base64 =
    extraerBase64Publicador_(
      archivo.dataUrl
    );

  if (!base64) {
    throw new Error(
      'No se pudo leer la imagen seleccionada.'
    );
  }

  return {
    ruta:
      carpeta +
      slugPublicador_(nombreBase) +
      (sufijo ? '-' + slugPublicador_(sufijo) : '') +
      '.' +
      extension,

    base64: base64
  };
}


function extensionImagenPublicador_(nombre) {
  const partes =
    String(nombre || '')
      .toLowerCase()
      .split('.');

  if (partes.length < 2) return '';

  let ext =
    partes.pop();

  if (ext === 'jpeg') {
    ext = 'jpg';
  }

  if (
    ['webp', 'png', 'jpg']
      .indexOf(ext) === -1
  ) {
    return '';
  }

  return ext;
}


function extraerBase64Publicador_(dataUrl) {
  const texto =
    String(dataUrl || '');

  const indice =
    texto.indexOf(',');

  if (indice === -1) return '';

  const base64 =
    texto.substring(indice + 1);

  // Límite aproximado de seguridad.
  if (base64.length > 9000000) {
    throw new Error(
      'La imagen es demasiado grande. ' +
      'Intenta usar una versión de menos de 5 MB.'
    );
  }

  return base64;
}


/* ============================================================
   GITHUB
   ============================================================ */

function comprobarTokenPublicador_() {
  const token =
    PropertiesService
      .getScriptProperties()
      .getProperty('GITHUB_TOKEN');

  if (
    !token ||
    token === 'PEGA_AQUI_TU_TOKEN'
  ) {
    throw new Error(
      'No existe un GITHUB_TOKEN válido.'
    );
  }

  return token;
}


function subirArchivoGitHubPublicador_(
  ruta,
  contenidoBase64,
  mensaje
) {
  const c = configPublicador_();
  const token =
    comprobarTokenPublicador_();

  const rutaApi =
    ruta
      .split('/')
      .map(function(parte) {
        return encodeURIComponent(parte);
      })
      .join('/');

  const url =
    'https://api.github.com/repos/' +
    c.githubUsuario +
    '/' +
    c.githubRepo +
    '/contents/' +
    rutaApi;

  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  let sha = null;

  const actual =
    UrlFetchApp.fetch(
      url +
      '?ref=' +
      encodeURIComponent(c.githubRama),
      {
        method: 'get',
        headers: headers,
        muteHttpExceptions: true
      }
    );

  if (
    actual.getResponseCode() === 200
  ) {
    try {
      sha =
        JSON.parse(
          actual.getContentText()
        ).sha || null;
    } catch (error) {}
  }

  const payload = {
    message: mensaje,
    content: contenidoBase64,
    branch: c.githubRama
  };

  if (sha) {
    payload.sha = sha;
  }

  const respuesta =
    UrlFetchApp.fetch(
      url,
      {
        method: 'put',
        headers: headers,
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const codigo =
    respuesta.getResponseCode();

  if (
    codigo !== 200 &&
    codigo !== 201
  ) {
    let detalle = '';

    try {
      detalle =
        JSON.parse(
          respuesta.getContentText()
        ).message || '';
    } catch (error) {}

    throw new Error(
      'GitHub no pudo guardar "' +
      ruta +
      '". Código ' +
      codigo +
      (detalle ? ': ' + detalle : '')
    );
  }

  return ruta;
}


/* ============================================================
   HOJAS
   ============================================================ */

function asegurarEncabezadoPublicador_(
  hoja,
  nombre
) {
  const ultimaColumna =
    Math.max(
      hoja.getLastColumn(),
      1
    );

  const encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0];

  const buscado =
    normalizarClavePublicador_(nombre);

  const existe =
    encabezados.some(function(item) {
      return (
        normalizarClavePublicador_(item) ===
        buscado
      );
    });

  if (existe) return;

  hoja
    .getRange(
      1,
      ultimaColumna + 1
    )
    .setValue(nombre);
}


function escribirFilaPublicador_(
  hoja,
  valores
) {
  lspPrepararMomentoPublicacion_(hoja, 0, valores);
  const ultimaColumna =
    hoja.getLastColumn();

  const encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0];

  const filaNueva =
    hoja.getLastRow() + 1;

  const fila =
    new Array(
      ultimaColumna
    ).fill('');

  Object.keys(valores)
    .forEach(function(campo) {
      const clave =
        normalizarClavePublicador_(campo);

      const indice =
        encabezados.findIndex(
          function(encabezado) {
            return (
              normalizarClavePublicador_(
                encabezado
              ) === clave
            );
          }
        );

      if (indice !== -1) {
        fila[indice] =
          valores[campo];
      }
    });

  hoja
    .getRange(
      filaNueva,
      1,
      1,
      fila.length
    )
    .setValues([fila]);

  SpreadsheetApp.flush();

  return filaNueva;
}


/* ============================================================
   DUPLICADOS
   ============================================================ */

function buscarFilaExistentePublicador_(
  hoja,
  palabra,
  categoria
) {
  const datos =
    hoja.getDataRange().getDisplayValues();

  if (datos.length < 2) return 0;

  const headers =
    datos[0].map(
      normalizarClavePublicador_
    );

  const colPalabra =
    headers.indexOf('palabra');

  const colCategoria =
    headers.indexOf('categoria');

  if (colPalabra === -1) return 0;

  const clavePalabra =
    normalizarClavePublicador_(palabra);

  const claveCategoria =
    normalizarClavePublicador_(categoria);

  for (let i = 1; i < datos.length; i++) {
    const mismaPalabra =
      normalizarClavePublicador_(
        datos[i][colPalabra]
      ) === clavePalabra;

    const mismaCategoria =
      colCategoria === -1 ||
      normalizarClavePublicador_(
        datos[i][colCategoria]
      ) === claveCategoria;

    if (mismaPalabra && mismaCategoria) {
      return i + 1;
    }
  }

  return 0;
}


function obtenerValorFilaPublicador_(
  hoja,
  numeroFila,
  nombreCampo
) {
  if (!numeroFila || numeroFila < 2) return '';

  const ultimaColumna =
    Math.max(hoja.getLastColumn(), 1);

  const encabezados =
    hoja.getRange(1, 1, 1, ultimaColumna)
      .getDisplayValues()[0];

  const buscado =
    normalizarClavePublicador_(nombreCampo);

  const indice =
    encabezados.findIndex(function(encabezado) {
      return normalizarClavePublicador_(encabezado) === buscado;
    });

  if (indice === -1) return '';

  return hoja
    .getRange(numeroFila, indice + 1)
    .getDisplayValue();
}


function actualizarFilaPublicador_(
  hoja,
  numeroFila,
  valores
) {
  lspPrepararMomentoPublicacion_(hoja, numeroFila, valores);
  const ultimaColumna =
    Math.max(hoja.getLastColumn(), 1);

  const encabezados =
    hoja.getRange(1, 1, 1, ultimaColumna)
      .getDisplayValues()[0];

  const mapa = {};
  encabezados.forEach(function(encabezado, indice) {
    const k = normalizarClavePublicador_(encabezado);
    if (k) mapa[k] = indice + 1;
  });

  Object.keys(valores || {}).forEach(function(nombre) {
    const col = mapa[normalizarClavePublicador_(nombre)];
    if (!col) return;
    hoja.getRange(numeroFila, col).setValue(valores[nombre]);
  });

  SpreadsheetApp.flush();
  return numeroFila;
}


function comprobarDuplicadoPublicadorExceptoFila_(
  hoja,
  palabra,
  categoria,
  filaIgnorada
) {
  const datos =
    hoja.getDataRange().getDisplayValues();

  if (datos.length < 2) return;

  const headers =
    datos[0].map(
      normalizarClavePublicador_
    );

  const colPalabra =
    headers.indexOf('palabra');

  const colCategoria =
    headers.indexOf('categoria');

  if (colPalabra === -1) return;

  const clavePalabra =
    normalizarClavePublicador_(palabra);

  const claveCategoria =
    normalizarClavePublicador_(categoria);

  for (let i = 1; i < datos.length; i++) {
    const numeroFila = i + 1;

    if (numeroFila === Number(filaIgnorada)) {
      continue;
    }

    const mismaPalabra =
      normalizarClavePublicador_(
        datos[i][colPalabra]
      ) === clavePalabra;

    const mismaCategoria =
      colCategoria === -1 ||
      normalizarClavePublicador_(
        datos[i][colCategoria]
      ) === claveCategoria;

    if (mismaPalabra && mismaCategoria) {
      throw new Error(
        '"' +
        palabra +
        '" ya existe en la categoría "' +
        categoria +
        '".'
      );
    }
  }
}


function comprobarEjemploDuplicadoPublicador_(
  hoja,
  caracter,
  palabra
) {
  const datos =
    hoja.getDataRange().getDisplayValues();

  if (datos.length < 2) return;

  const headers =
    datos[0].map(
      normalizarClavePublicador_
    );

  const cCaracter =
    headers.indexOf('caracter');

  const cPalabra =
    headers.indexOf('palabra');

  if (
    cCaracter === -1 ||
    cPalabra === -1
  ) {
    return;
  }

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    if (
      normalizarClavePublicador_(
        datos[i][cCaracter]
      ) ===
        normalizarClavePublicador_(
          caracter
        ) &&
      normalizarClavePublicador_(
        datos[i][cPalabra]
      ) ===
        normalizarClavePublicador_(
          palabra
        )
    ) {
      throw new Error(
        palabra +
        ' ya existe como ejemplo de la letra ' +
        caracter +
        '.'
      );
    }
  }
}


/* ============================================================
   ORDEN
   ============================================================ */

function asegurarEncabezadoIdQuizVocabulario_(hoja) {
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(normalizarClavePublicador_);

  const cIdQuiz = encabezados.indexOf('idquiz');
  if (cIdQuiz !== -1) {
    return cIdQuiz + 1;
  }

  // Migración compatible con la estructura anterior de LSPedia: en
  // Vocabulario la columna llamada "orden" realmente era la clave del Quiz.
  const cOrdenAntiguo = encabezados.indexOf('orden');
  if (cOrdenAntiguo !== -1) {
    const columna = cOrdenAntiguo + 1;
    hoja.getRange(1, columna).setValue('idQuiz');
    return columna;
  }

  const columnaNueva = ultimaColumna + 1;
  hoja.getRange(1, columnaNueva).setValue('idQuiz');
  return columnaNueva;
}


function esIdQuizValidoPublicador_(valor) {
  return /^Q[A-F0-9]{10}$/.test(
    String(valor || '').trim().toUpperCase()
  );
}


function generarIdQuizUnicoPublicador_(hoja, usadosOpcionales) {
  const columna = asegurarEncabezadoIdQuizVocabulario_(hoja);
  const usados = usadosOpcionales || new Set();

  if (!usadosOpcionales && hoja.getLastRow() >= 2) {
    hoja
      .getRange(2, columna, hoja.getLastRow() - 1, 1)
      .getDisplayValues()
      .forEach(function(fila) {
        const actual = String(fila[0] || '').trim().toUpperCase();
        if (actual) usados.add(actual);
      });
  }

  for (let intento = 0; intento < 50; intento++) {
    const id =
      'Q' +
      Utilities.getUuid()
        .replace(/-/g, '')
        .toUpperCase()
        .slice(0, 10);

    if (!usados.has(id)) {
      usados.add(id);
      return id;
    }
  }

  throw new Error(
    'No se pudo generar un ID Quiz único. Intenta nuevamente.'
  );
}


function asegurarIdsQuizVocabulario_(hoja) {
  if (!hoja) {
    throw new Error('No encuentro la hoja Vocabulario para preparar los IDs del Quiz.');
  }

  const columnaId = asegurarEncabezadoIdQuizVocabulario_(hoja);
  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return {
      ok: true,
      columna: columnaId,
      actualizados: 0
    };
  }

  const ultimaColumna = Math.max(hoja.getLastColumn(), columnaId);
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(normalizarClavePublicador_);

  const cVideo = encabezados.indexOf('video');
  if (cVideo === -1) {
    throw new Error('Vocabulario no tiene la columna video.');
  }

  const cantidad = ultimaFila - 1;
  const videos = hoja
    .getRange(2, cVideo + 1, cantidad, 1)
    .getDisplayValues();

  const ids = hoja
    .getRange(2, columnaId, cantidad, 1)
    .getDisplayValues();

  const usados = new Set();
  let actualizados = 0;

  // Primera pasada: conserva solo IDs nuevos válidos y no repetidos.
  // Los códigos antiguos (incluidos los que revelan partes de la palabra)
  // se sustituyen en la segunda pasada.
  for (let i = 0; i < cantidad; i++) {
    const original = String(ids[i][0] || '').trim();
    const actual = original.toUpperCase();

    if (
      esIdQuizValidoPublicador_(actual) &&
      !usados.has(actual)
    ) {
      // Un ID válido pertenece a la ficha, incluso si temporalmente no tiene
      // video. Así mantiene su identidad cuando el video vuelva a publicarse.
      usados.add(actual);
      ids[i][0] = actual;
      if (original !== actual) actualizados++;
    } else {
      // Código antiguo, ID inválido o duplicado: se elimina. Si la fila tiene
      // video recibirá uno nuevo y único en la segunda pasada.
      ids[i][0] = '';
      if (original) actualizados++;
    }
  }

  // Segunda pasada: toda fila con video debe tener un ID opaco y único.
  for (let i = 0; i < cantidad; i++) {
    const tieneVideo = !!String(videos[i][0] || '').trim();
    if (!tieneVideo || ids[i][0]) continue;

    ids[i][0] = generarIdQuizUnicoPublicador_(hoja, usados);
    actualizados++;
  }

  if (actualizados) {
    hoja
      .getRange(2, columnaId, cantidad, 1)
      .setValues(ids);
    SpreadsheetApp.flush();
  }

  return {
    ok: true,
    columna: columnaId,
    actualizados: actualizados
  };
}


function siguienteOrdenCaracterPublicador_(
  hoja,
  caracter
) {
  const datos =
    hoja.getDataRange().getDisplayValues();

  if (datos.length < 2) return 1;

  const headers =
    datos[0].map(
      normalizarClavePublicador_
    );

  const cCaracter =
    headers.indexOf('caracter');

  const cOrden =
    headers.indexOf('orden');

  if (
    cCaracter === -1 ||
    cOrden === -1
  ) {
    return 1;
  }

  let mayor = 0;

  datos
    .slice(1)
    .forEach(function(fila) {
      if (
        normalizarClavePublicador_(
          fila[cCaracter]
        ) !==
        normalizarClavePublicador_(
          caracter
        )
      ) {
        return;
      }

      const numero =
        Number(fila[cOrden]);

      if (
        Number.isFinite(numero) &&
        numero > mayor
      ) {
        mayor = numero;
      }
    });

  return mayor + 1;
}


/* ============================================================
   SINCRONIZACIÓN EXISTENTE
   ============================================================ */

function ejecutarSincronizacionExistente_(
  hoja,
  fila
) {
  const c = configPublicador_();

  const nombreHoja =
    hoja && typeof hoja.getName === 'function'
      ? hoja.getName()
      : '';

  /*
   * Vocabulario y AlfabetizacionEjemplos ya se sincronizan mediante
   * los procesos automáticos del repositorio. No debemos simular
   * onEdit() en esas hojas porque ese onEdit pertenece al flujo
   * antiguo y puede intentar llamar funciones que ya no existen.
   */
  if (
    nombreHoja === c.hojaVocabulario ||
    nombreHoja === c.hojaAlfabetizacion ||
    nombreHoja === c.hojaEjemplos
  ) {
    return {
      ok: true,
      mensaje:
        nombreHoja === c.hojaVocabulario
          ? 'Guardado correctamente. Vocabulario se actualizará mediante su sincronización automática.'
          : 'Guardado correctamente en Google Sheets. Alfabetización se actualizará mediante su sincronización automática.'
    };
  }

  /*
   * Diccionario conserva la sincronización existente por onEdit().
   * El Diccionario todavía puede depender de ese flujo para
   * reflejar la fila nueva en los datos publicados.
   */
  try {
    if (
      nombreHoja === c.hojaDiccionario &&
      typeof onEdit === 'function'
    ) {
      const rango =
        hoja.getRange(
          fila,
          1
        );

      onEdit({
        range: rango,
        source:
          obtenerSpreadsheetPublicador_(),
        value:
          rango.getValue()
      });

      return {
        ok: true,
        mensaje:
          'Sincronización del Diccionario solicitada.'
      };
    }

    return {
      ok: false,
      mensaje:
        nombreHoja === c.hojaDiccionario
          ? 'El contenido fue guardado, pero no encontré onEdit() para sincronizar el Diccionario.'
          : 'El contenido fue guardado.'
    };

  } catch (error) {
    return {
      ok: false,
      mensaje:
        'Contenido guardado. La sincronización automática respondió: ' +
        error.message
    };
  }
}


/* ============================================================
   SINCRONIZACIÓN MANUAL DE DATOS PÚBLICOS
   ============================================================ */

function textoJsonPublicador_(valor) {
  return valor === null || valor === undefined
    ? ''
    : String(valor).trim();
}


function claveColumnaJsonPublicador_(valor) {
  return normalizarClavePublicador_(valor)
    .replace(/[\s_]+/g, '');
}


function valorFilaJsonPublicador_(fila, columna) {
  return columna >= 0
    ? textoJsonPublicador_(fila[columna])
    : '';
}


function numeroOrdenJsonPublicador_(valor) {
  const numero = Number(textoJsonPublicador_(valor));
  return Number.isFinite(numero)
    ? Math.trunc(numero)
    : 0;
}


function guardarJsonGitHubSiCambioPublicador_(
  ruta,
  datosNuevos,
  mensajeCommit,
  lecturaActual
) {
  const actual =
    lecturaActual === undefined
      ? leerJsonGitHubPublicador_(ruta)
      : lecturaActual;

  const actualCompacto =
    actual
      ? JSON.stringify(actual.datos)
      : '';

  const nuevoCompacto =
    JSON.stringify(datosNuevos);

  if (
    actual &&
    actualCompacto === nuevoCompacto
  ) {
    return {
      actualizado: false,
      yaEstabaActualizado: true
    };
  }

  const texto =
    JSON.stringify(
      datosNuevos,
      null,
      2
    ) + '\n';

  const nombreArchivo =
    String(ruta || '')
      .split('/')
      .pop() || 'datos.json';

  const base64 =
    Utilities.base64Encode(
      Utilities.newBlob(
        texto,
        'application/json',
        nombreArchivo
      ).getBytes()
    );

  subirArchivoGitHubPublicador_(
    ruta,
    base64,
    mensajeCommit
  );

  return {
    actualizado: true,
    yaEstabaActualizado: false
  };
}


/* -------------------------
   DICCIONARIO -> palabras.json
   ------------------------- */

function construirDiccionarioJsonPublicador_(
  hoja,
  datosActuales
) {
  const datos =
    hoja.getDataRange().getDisplayValues();

  if (!datos || datos.length < 2) {
    throw new Error(
      'La hoja Diccionario no contiene filas para sincronizar.'
    );
  }

  const encabezados =
    datos[0].map(function(valor) {
      return claveColumnaJsonPublicador_(valor);
    });

  function indice(nombre) {
    return encabezados.indexOf(nombre);
  }

  const columnas = {
    id: indice('id'),
    palabra: indice('palabra'),
    variantes: indice('variantes'),
    definicion: indice('definicion'),
    categoria: indice('categoria'),
    video: indice('video'),
    imagen: indice('imagen'),
    senaSugerida: indice('senasugerida'),
    fechaPublicacion: indice('fechapublicacion'),
    publicadoEn: indice('publicadoen'),
    ingles: indice('ingles'),
    definicionIngles: indice('definicioningles'),
    etiquetas: indice('etiquetas'),
    publicarSinImagen: indice('publicarsinimagen')
  };

  if (columnas.palabra === -1) {
    throw new Error(
      'La hoja Diccionario debe tener la columna palabra.'
    );
  }

  const actuales =
    Array.isArray(datosActuales)
      ? datosActuales
      : [];

  const porIdentidad = {};
  const porPalabra = {};
  const idsUsados = {};

  actuales.forEach(function(item) {
    if (!item || typeof item !== 'object') return;

    const palabra =
      textoJsonPublicador_(item.palabra);
    const categoria =
      textoJsonPublicador_(item.categoria);

    const clavePalabra =
      normalizarClavePublicador_(palabra);

    const claveIdentidad =
      clavePalabra +
      '\u0000' +
      normalizarClavePublicador_(categoria);

    const referencia = {
      item: item,
      usado: false
    };

    if (!porIdentidad[claveIdentidad]) {
      porIdentidad[claveIdentidad] = [];
    }

    porIdentidad[claveIdentidad].push(
      referencia
    );

    if (!porPalabra[clavePalabra]) {
      porPalabra[clavePalabra] = [];
    }

    porPalabra[clavePalabra].push(
      referencia
    );

    const id =
      textoJsonPublicador_(item.id);

    if (id) {
      idsUsados[id] = true;
    }
  });

  function tomarExistente(
    palabra,
    categoria
  ) {
    const clavePalabra =
      normalizarClavePublicador_(palabra);

    const claveIdentidad =
      clavePalabra +
      '\u0000' +
      normalizarClavePublicador_(categoria);

    const exactos =
      porIdentidad[claveIdentidad] || [];

    for (
      let i = 0;
      i < exactos.length;
      i += 1
    ) {
      if (!exactos[i].usado) {
        exactos[i].usado = true;
        return exactos[i].item;
      }
    }

    /*
     * Si la categoría fue normalizada por GitHub pero la palabra es única,
     * conservamos el registro anterior y, sobre todo, su ID estable.
     */
    const mismaPalabra =
      (porPalabra[clavePalabra] || [])
        .filter(function(ref) {
          return !ref.usado;
        });

    if (mismaPalabra.length === 1) {
      mismaPalabra[0].usado = true;
      return mismaPalabra[0].item;
    }

    return null;
  }

  const conteoPalabras = {};

  datos
    .slice(1)
    .forEach(function(fila) {
      const palabra =
        valorFilaJsonPublicador_(
          fila,
          columnas.palabra
        );

      if (!palabra) return;

      const clave =
        normalizarClavePublicador_(palabra);

      conteoPalabras[clave] =
        (conteoPalabras[clave] || 0) + 1;
    });

  function crearIdNuevo(
    palabra,
    categoria
  ) {
    let base =
      slugPublicador_(palabra);

    const clavePalabra =
      normalizarClavePublicador_(palabra);

    if (
      (conteoPalabras[clavePalabra] || 0) > 1 &&
      categoria
    ) {
      base +=
        '-' +
        slugPublicador_(categoria);
    }

    let candidato = base;
    let numero = 2;

    while (idsUsados[candidato]) {
      candidato =
        base +
        '-' +
        numero;
      numero += 1;
    }

    idsUsados[candidato] = true;
    return candidato;
  }

  const salida = [];
  let filasVacias = 0;

  datos
    .slice(1)
    .forEach(function(fila) {
      const palabra =
        valorFilaJsonPublicador_(
          fila,
          columnas.palabra
        );

      if (!palabra) {
        filasVacias += 1;
        return;
      }

      const categoria =
        valorFilaJsonPublicador_(
          fila,
          columnas.categoria
        );

      const existente =
        tomarExistente(
          palabra,
          categoria
        );

      const definicionFila = valorFilaJsonPublicador_(fila, columnas.definicion);
      const imagenFila = valorFilaJsonPublicador_(fila, columnas.imagen);
      const aprobadoSinImagen = esSiPublicador_(valorFilaJsonPublicador_(fila, columnas.publicarSinImagen));
      // Regla nueva: imagen publica automáticamente; concepto sin imagen requiere aprobación.
      // Los registros que ya estaban en el JSON se conservan para no retirar contenido histórico de golpe.
      const publicable = !!imagenFila || (!!definicionFila && aprobadoSinImagen) || !!existente;
      if (!publicable) return;

      const registro = {};

      if (existente) {
        Object.keys(existente)
          .forEach(function(clave) {
            registro[clave] =
              existente[clave];
          });
      }

      const idHoja =
        valorFilaJsonPublicador_(
          fila,
          columnas.id
        );

      if (idHoja) {
        registro.id = idHoja;
        idsUsados[idHoja] = true;
      } else if (!textoJsonPublicador_(registro.id)) {
        registro.id =
          crearIdNuevo(
            palabra,
            categoria
          );
      }

      registro.palabra = palabra;
      registro.variantes =
        valorFilaJsonPublicador_(
          fila,
          columnas.variantes
        );
      registro.definicion =
        valorFilaJsonPublicador_(
          fila,
          columnas.definicion
        );
      registro.categoria =
        categoria;

      const etiquetasRegistro =
        normalizarEtiquetasTaxonomiaPublicador23_(
          valorFilaJsonPublicador_(
            fila,
            columnas.etiquetas
          )
        );

      // El sistema de grupos temáticos se retiró de la web.
      delete registro.grupo;
      registro.etiquetas =
        etiquetasRegistro;

      registro.video =
        valorFilaJsonPublicador_(
          fila,
          columnas.video
        );
      registro.imagen =
        valorFilaJsonPublicador_(
          fila,
          columnas.imagen
        );

      const senaHoja =
        valorFilaJsonPublicador_(
          fila,
          columnas.senaSugerida
        );

      registro.senasugerida =
        senaHoja ||
        textoJsonPublicador_(
          registro.senasugerida ||
          registro.senaSugerida
        );

      if (
        Object.prototype.hasOwnProperty.call(
          registro,
          'senaSugerida'
        )
      ) {
        delete registro.senaSugerida;
      }

      if (
        !Object.prototype.hasOwnProperty.call(
          registro,
          ''
        )
      ) {
        registro[''] = '';
      }

      let fecha =
        valorFilaJsonPublicador_(
          fila,
          columnas.fechaPublicacion
        );

      if (fecha.charAt(0) === '#') {
        fecha = '';
      }

      registro.fechapublicacion = fecha;
      registro.publicadoEn = lspMomentoPublicacionJson_(valorFilaJsonPublicador_(fila, columnas.publicadoEn)) || lspMomentoPublicacionJson_(registro.publicadoEn || registro.publicadoen);
      delete registro.publicadoen;
      registro.ingles =
        valorFilaJsonPublicador_(
          fila,
          columnas.ingles
        );
      registro.definicioningles =
        valorFilaJsonPublicador_(
          fila,
          columnas.definicionIngles
        );

      if (
        Object.prototype.hasOwnProperty.call(
          registro,
          'fechaPublicacion'
        )
      ) {
        delete registro.fechaPublicacion;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          registro,
          'definicionIngles'
        )
      ) {
        delete registro.definicionIngles;
      }

      salida.push(registro);
    });

  if (!salida.length) {
    throw new Error(
      'No encontré palabras válidas en la hoja Diccionario.'
    );
  }

  /*
   * Protección contra una lectura incompleta accidental de Google Sheets.
   * Si ya existe un JSON grande y de repente la hoja devuelve menos de la
   * mitad, no sobrescribimos el Diccionario automáticamente.
   */
  if (
    actuales.length >= 20 &&
    salida.length < Math.floor(actuales.length * 0.5)
  ) {
    throw new Error(
      'La hoja Diccionario devolvió muchas menos filas que palabras.json. ' +
      'Por seguridad no se sobrescribió el archivo.'
    );
  }

  return {
    registros: salida,
    total: salida.length,
    filasVacias: filasVacias
  };
}


function sincronizarDiccionarioJsonSinLockPublicador_() {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const hoja =
    ss.getSheetByName(c.hojaDiccionario);

  if (!hoja) {
    throw new Error(
      'No encontré la hoja Diccionario.'
    );
  }

  const ruta =
    'data/palabras.json';

  const actual =
    leerJsonGitHubPublicador_(ruta);

  const resultado =
    construirDiccionarioJsonPublicador_(
      hoja,
      actual && actual.datos
    );

  const guardado =
    guardarJsonGitHubSiCambioPublicador_(
      ruta,
      resultado.registros,
      'Sincronizar palabras.json desde Publicador',
      actual
    );

  return {
    ok: true,
    fuente: 'Diccionario',
    ruta: ruta,
    total: resultado.total,
    filasVacias: resultado.filasVacias,
    actualizado: guardado.actualizado,
    yaEstabaActualizado:
      guardado.yaEstabaActualizado
  };
}


function sincronizarDiccionarioJsonPublicador(
  datos
) {
  validarSesionEditorPublicador_(datos || {});

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'Ya hay otra sincronización en curso. Espera unos segundos e inténtalo otra vez.'
    );
  }

  try {
    SpreadsheetApp.flush();
    return sincronizarDiccionarioJsonSinLockPublicador_();
  } finally {
    lock.releaseLock();
  }
}


/* -------------------------
   VOCABULARIO -> vocabulario.json
   ------------------------- */

function normalizarNivelVocabularioJsonPublicador_(
  valor
) {
  const original =
    textoJsonPublicador_(valor);

  const clave =
    normalizarClavePublicador_(original);

  if (clave === 'dificil') return 'Difícil';
  if (clave === 'medio') return 'Medio';
  if (clave === 'facil') return 'Fácil';

  return original;
}


function normalizarCategoriaVocabularioJsonPublicador_(
  valor
) {
  const original =
    textoJsonPublicador_(valor)
      .replace(/\s+/g, ' ')
      .replace(/\s*\/\s*/g, '/');

  const clave =
    normalizarClavePublicador_(original)
      .replace(/\s*\/\s*/g, '/');

  if (!clave) return '';

  const alias = {
    adjetivo: 'Adjetivos',
    adverbio: 'Adverbios',
    animal: 'Animales',
    color: 'Colores',
    alimentos: 'Comida',
    emocion: 'Emociones',
    emociones: 'Emociones',
    tiempos: 'Tiempo',
    verbo: 'Verbos',
    'profesiones/ocupaciones': 'Profesiones',
    ocupaciones: 'Profesiones',
    'redes sociales/aplicaciones': 'Tecnología',
    'relaciones familiares y personales': 'Familia',
    'ropa y accesorios': 'Ropa',
    sustantivo: 'Personas'
  };

  if (alias[clave]) return alias[clave];

  const canonicas = {
    adjetivos: 'Adjetivos',
    adverbios: 'Adverbios',
    animales: 'Animales',
    cantidad: 'Cantidad',
    casa: 'Casa',
    colores: 'Colores',
    comida: 'Comida',
    comunicacion: 'Comunicación',
    cortesia: 'Cortesía',
    cuerpo: 'Cuerpo',
    educacion: 'Educación',
    emociones: 'Emociones',
    familia: 'Familia',
    geografia: 'Geografía',
    naturaleza: 'Naturaleza',
    numeros: 'Números',
    personas: 'Personas',
    preguntas: 'Preguntas',
    profesiones: 'Profesiones',
    ropa: 'Ropa',
    sociedad: 'Sociedad',
    tecnologia: 'Tecnología',
    tiempo: 'Tiempo',
    tramites: 'Trámites',
    valores: 'Valores',
    verbos: 'Verbos'
  };

  return canonicas[clave] || original;
}


function esImagenRealVocabularioJsonPublicador_(
  valor
) {
  const principal =
    textoJsonPublicador_(valor)
      .split(',')[0]
      .trim();

  if (!principal) return false;

  const tienePrefijo =
    /^(?:https?:\/\/|\/|\.\.?\/|img\/)/i
      .test(principal);

  const tieneExtension =
    /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i
      .test(principal);

  return tienePrefijo && tieneExtension;
}


function construirVocabularioJsonPublicador_(
  hoja
) {
  const datos =
    hoja.getDataRange().getDisplayValues();

  if (!datos || datos.length < 2) {
    throw new Error(
      'La hoja Vocabulario no contiene filas para sincronizar.'
    );
  }

  const encabezados =
    datos[0].map(function(valor) {
      return claveColumnaJsonPublicador_(valor);
    });

  function indice(nombre) {
    return encabezados.indexOf(nombre);
  }

  const columnas = {
    palabra: indice('palabra'),
    variantes: indice('variantes'),
    video: indice('video'),
    categoria: indice('categoria'),
    etiquetas: indice('etiquetas'),
    nivel: indice('nivel'),
    idQuiz: indice('idquiz'),
    orden: indice('orden'),
    imagen: indice('imagen'),
    definicion: indice('definicion'),
    publicarSinImagen: indice('publicarsinimagen'),
    fechaPublicacion: indice('fechapublicacion'),
    publicadoEn: indice('publicadoen'),
    ingles: indice('ingles'),
    definicionIngles: indice('definicioningles')
  };

  if (
    columnas.palabra === -1 ||
    columnas.categoria === -1 ||
    columnas.imagen === -1
  ) {
    throw new Error(
      'La hoja Vocabulario debe tener, como mínimo, las columnas palabra, categoria e imagen.'
    );
  }

  const salida = [];
  const vistos = {};
  let omitidosCamposBase = 0;
  let omitidosSinImagen = 0;
  let duplicadosOmitidos = 0;
  let conVideo = 0;
  let sinVideo = 0;

  datos
    .slice(1)
    .forEach(function(fila) {
      const palabra =
        valorFilaJsonPublicador_(
          fila,
          columnas.palabra
        );

      const categoriaOriginal =
        valorFilaJsonPublicador_(
          fila,
          columnas.categoria
        );

      const imagen =
        valorFilaJsonPublicador_(
          fila,
          columnas.imagen
        );

      if (
        !palabra ||
        !categoriaOriginal
      ) {
        omitidosCamposBase += 1;
        return;
      }

      const definicion = valorFilaJsonPublicador_(fila, columnas.definicion);
      const tieneImagenReal = esImagenRealVocabularioJsonPublicador_(imagen);
      // Vocabulario se publica visualmente solo cuando tiene imagen.
      // El concepto es complementario y nunca reemplaza este requisito.
      if (!tieneImagenReal) {
        omitidosSinImagen += 1;
        return;
      }

      const identidad =
        palabra.toLowerCase() +
        '\u0000' +
        categoriaOriginal.toLowerCase();

      if (vistos[identidad]) {
        duplicadosOmitidos += 1;
        return;
      }

      vistos[identidad] = true;

      const video =
        valorFilaJsonPublicador_(
          fila,
          columnas.video
        );

      let fechaPublicacion =
        valorFilaJsonPublicador_(
          fila,
          columnas.fechaPublicacion
        );

      if (
        fechaPublicacion.charAt(0) === '#'
      ) {
        fechaPublicacion = '';
      }

      if (video) conVideo += 1;
      else sinVideo += 1;

      salida.push({
        palabra: palabra,
        variantes:
          valorFilaJsonPublicador_(
            fila,
            columnas.variantes
          ),
        video: video,
        categoria:
          normalizarCategoriaVocabularioJsonPublicador_(
            categoriaOriginal
          ),
        etiquetas:
          normalizarEtiquetasTaxonomiaPublicador23_(
            valorFilaJsonPublicador_(
              fila,
              columnas.etiquetas
            )
          ),
        nivel:
          normalizarNivelVocabularioJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnas.nivel
            )
          ),
        idQuiz:
          valorFilaJsonPublicador_(
            fila,
            columnas.idQuiz
          ) ||
          valorFilaJsonPublicador_(
            fila,
            columnas.orden
          ),
        imagen: imagen,
        definicion: definicion,
        fechaPublicacion:
          fechaPublicacion,
        publicadoEn: lspMomentoPublicacionJson_(valorFilaJsonPublicador_(fila, columnas.publicadoEn)),
        ingles:
          valorFilaJsonPublicador_(
            fila,
            columnas.ingles
          ),
        definicionIngles:
          valorFilaJsonPublicador_(
            fila,
            columnas.definicionIngles
          )
      });
    });

  if (!salida.length) {
    throw new Error(
      'No encontré fichas públicas en Vocabulario (se requiere al menos una imagen).'
    );
  }

  return {
    registros: salida,
    total: salida.length,
    conVideo: conVideo,
    sinVideo: sinVideo,
    omitidosCamposBase: omitidosCamposBase,
    omitidosSinImagen: omitidosSinImagen,
    duplicadosOmitidos: duplicadosOmitidos
  };
}


function sincronizarVocabularioJsonSinLockPublicador_() {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const hoja =
    ss.getSheetByName(c.hojaVocabulario);

  if (!hoja) {
    throw new Error(
      'No encontré la hoja Vocabulario.'
    );
  }

  asegurarIdsQuizVocabulario_(hoja);

  const resultado =
    construirVocabularioJsonPublicador_(
      hoja
    );

  const ruta =
    'data/vocabulario.json';

  const actual =
    leerJsonGitHubPublicador_(ruta);

  const guardado =
    guardarJsonGitHubSiCambioPublicador_(
      ruta,
      resultado.registros,
      'Sincronizar vocabulario.json desde Publicador',
      actual
    );

  return {
    ok: true,
    fuente: 'Vocabulario',
    ruta: ruta,
    total: resultado.total,
    conVideo: resultado.conVideo,
    sinVideo: resultado.sinVideo,
    omitidosCamposBase:
      resultado.omitidosCamposBase,
    omitidosSinImagen:
      resultado.omitidosSinImagen,
    duplicadosOmitidos:
      resultado.duplicadosOmitidos,
    actualizado:
      guardado.actualizado,
    yaEstabaActualizado:
      guardado.yaEstabaActualizado
  };
}


function sincronizarVocabularioDespuesDeGuardarPublicador(
  datos
) {
  validarSesionEditorPublicador_(datos || {});

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    throw new Error(
      'Hay otra sincronización en curso. El guardado en Sheets ya se realizó; vuelve a sincronizar en unos segundos.'
    );
  }

  try {
    SpreadsheetApp.flush();
    return sincronizarVocabularioJsonSinLockPublicador_();
  } finally {
    lock.releaseLock();
  }
}


function sincronizarVocabularioJsonPublicador(
  datos
) {
  validarSesionEditorPublicador_(datos || {});

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'Ya hay otra sincronización en curso. Espera unos segundos e inténtalo otra vez.'
    );
  }

  try {
    SpreadsheetApp.flush();
    return sincronizarVocabularioJsonSinLockPublicador_();
  } finally {
    lock.releaseLock();
  }
}


/* -------------------------
   ALFABETIZACIÓN + EJEMPLOS
   -> alfabetizacion.json
   ------------------------- */

function normalizarRutaMediaJsonPublicador_(
  valor
) {
  let ruta =
    textoJsonPublicador_(valor);

  if (!ruta) return '';

  if (
    /^https?:\/\//i.test(ruta)
  ) {
    return ruta;
  }

  ruta =
    ruta
      .replace(/\\/g, '/');

  while (
    ruta.indexOf('./') === 0
  ) {
    ruta =
      ruta.slice(2);
  }

  ruta =
    ruta.replace(/^\/+/, '');

  if (
    ruta.indexOf('img/') !== 0
  ) {
    return '';
  }

  return ruta;
}


function construirAlfabetizacionJsonPublicador_(
  hojaAlfabeto,
  hojaEjemplos
) {
  asegurarContratoAlfabetizacionPublicador_(
    hojaAlfabeto
  );

  const datosAlfabeto =
    hojaAlfabeto
      .getDataRange()
      .getDisplayValues();

  const encabezadosAlfabeto =
    (datosAlfabeto[0] || [])
      .map(function(valor) {
        return claveColumnaJsonPublicador_(
          valor
        );
      });

  function indiceAlfabeto(nombre) {
    return encabezadosAlfabeto.indexOf(nombre);
  }

  const columnasAlfabeto = {
    tipo: indiceAlfabeto('tipo'),
    caracter: indiceAlfabeto('caracter'),
    imagenBoca: indiceAlfabeto('imagenboca'),
    trazoVideo: indiceAlfabeto('trazovideo'),
    nombre: indiceAlfabeto('nombre'),
    grafiaMayuscula:
      indiceAlfabeto('grafiamayuscula'),
    grafiaMinuscula:
      indiceAlfabeto('grafiaminuscula'),
    grafiaCursivaMayuscula:
      indiceAlfabeto('grafiacursivamayuscula'),
    grafiaCursivaMinuscula:
      indiceAlfabeto('grafiacursivaminuscula'),
    imagenCirculo:
      indiceAlfabeto('imagencirculo'),
    orden: indiceAlfabeto('orden'),
    grafiaImagen:
      indiceAlfabeto('grafiaimagen')
  };

  if (
    columnasAlfabeto.tipo === -1 ||
    columnasAlfabeto.caracter === -1
  ) {
    throw new Error(
      'La hoja Alfabetización debe tener las columnas tipo y caracter.'
    );
  }

  const alfabeto = [];
  const vistos = {};

  datosAlfabeto
    .slice(1)
    .forEach(function(fila) {
      const tipo =
        valorFilaJsonPublicador_(
          fila,
          columnasAlfabeto.tipo
        ).toLowerCase();

      const caracter =
        valorFilaJsonPublicador_(
          fila,
          columnasAlfabeto.caracter
        );

      if (
        (tipo !== 'letra' && tipo !== 'numero') ||
        !caracter ||
        caracter.length > 4
      ) {
        return;
      }

      const identidad =
        tipo +
        '\u0000' +
        normalizarClavePublicador_(
          caracter
        );

      if (vistos[identidad]) return;
      vistos[identidad] = true;

      alfabeto.push({
        tipo: tipo,
        caracter: caracter,
        imagenBoca:
          normalizarRutaMediaJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasAlfabeto.imagenBoca
            )
          ),
        trazoVideo:
          normalizarRutaMediaJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasAlfabeto.trazoVideo
            )
          ),
        nombre:
          valorFilaJsonPublicador_(
            fila,
            columnasAlfabeto.nombre
          ),
        grafiaMayuscula:
          normalizarRutaMediaJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasAlfabeto.grafiaMayuscula
            )
          ),
        grafiaMinuscula:
          normalizarRutaMediaJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasAlfabeto.grafiaMinuscula
            )
          ),
        grafiaCursivaMayuscula:
          normalizarRutaMediaJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasAlfabeto.grafiaCursivaMayuscula
            )
          ),
        grafiaCursivaMinuscula:
          normalizarRutaMediaJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasAlfabeto.grafiaCursivaMinuscula
            )
          ),
        imagenCirculo:
          normalizarRutaMediaJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasAlfabeto.imagenCirculo
            )
          ),
        orden:
          numeroOrdenJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasAlfabeto.orden
            )
          ),
        grafiaImagen:
          normalizarRutaMediaJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasAlfabeto.grafiaImagen
            )
          )
      });
    });

  if (!alfabeto.length) {
    throw new Error(
      'No encontré letras o números válidos en Alfabetización.'
    );
  }

  const datosEjemplos =
    hojaEjemplos
      .getDataRange()
      .getDisplayValues();

  const encabezadosEjemplos =
    (datosEjemplos[0] || [])
      .map(function(valor) {
        return claveColumnaJsonPublicador_(
          valor
        );
      });

  function indiceEjemplo(nombre) {
    return encabezadosEjemplos.indexOf(nombre);
  }

  const columnasEjemplos = {
    caracter: indiceEjemplo('caracter'),
    palabra: indiceEjemplo('palabra'),
    imagen: indiceEjemplo('imagen'),
    orden: indiceEjemplo('orden'),
    nivel: indiceEjemplo('nivel')
  };

  if (
    columnasEjemplos.caracter === -1 ||
    columnasEjemplos.palabra === -1 ||
    columnasEjemplos.imagen === -1
  ) {
    throw new Error(
      'AlfabetizacionEjemplos debe tener las columnas caracter, palabra e imagen.'
    );
  }

  const ejemplos = [];
  let ejemplosSinImagen = 0;

  datosEjemplos
    .slice(1)
    .forEach(function(fila) {
      const caracter =
        valorFilaJsonPublicador_(
          fila,
          columnasEjemplos.caracter
        );

      const palabra =
        valorFilaJsonPublicador_(
          fila,
          columnasEjemplos.palabra
        );

      const imagen =
        normalizarRutaMediaJsonPublicador_(
          valorFilaJsonPublicador_(
            fila,
            columnasEjemplos.imagen
          )
        );

      if (!caracter || !palabra) {
        return;
      }

      if (
        !imagen ||
        !esImagenRealVocabularioJsonPublicador_(
          imagen
        )
      ) {
        ejemplosSinImagen += 1;
        return;
      }

      ejemplos.push({
        caracter: caracter,
        palabra: palabra,
        imagen: imagen,
        orden:
          numeroOrdenJsonPublicador_(
            valorFilaJsonPublicador_(
              fila,
              columnasEjemplos.orden
            )
          ),
        nivel:
          valorFilaJsonPublicador_(
            fila,
            columnasEjemplos.nivel
          )
      });
    });

  return {
    documento: {
      ok: true,
      alfabeto: alfabeto,
      ejemplos: ejemplos
    },
    caracteres: alfabeto.length,
    ejemplos: ejemplos.length,
    ejemplosSinImagen: ejemplosSinImagen
  };
}


function sincronizarAlfabetizacionJsonSinLockPublicador_() {
  const c = configPublicador_();
  const ss =
    obtenerSpreadsheetPublicador_();

  const hojaAlfabeto =
    ss.getSheetByName(
      c.hojaAlfabetizacion
    );

  const hojaEjemplos =
    ss.getSheetByName(
      c.hojaEjemplos
    );

  if (!hojaAlfabeto) {
    throw new Error(
      'No encontré la hoja Alfabetización.'
    );
  }

  if (!hojaEjemplos) {
    throw new Error(
      'No encontré la hoja AlfabetizacionEjemplos.'
    );
  }

  const resultado =
    construirAlfabetizacionJsonPublicador_(
      hojaAlfabeto,
      hojaEjemplos
    );

  const ruta =
    'data/alfabetizacion.json';

  const actual =
    leerJsonGitHubPublicador_(ruta);

  if (
    actual &&
    actual.datos &&
    Array.isArray(actual.datos.alfabeto) &&
    actual.datos.alfabeto.length >= 10 &&
    resultado.caracteres <
      Math.floor(
        actual.datos.alfabeto.length *
        0.5
      )
  ) {
    throw new Error(
      'Alfabetización devolvió muchos menos caracteres que el JSON actual. ' +
      'Por seguridad no se sobrescribió el archivo.'
    );
  }

  const guardado =
    guardarJsonGitHubSiCambioPublicador_(
      ruta,
      resultado.documento,
      'Sincronizar alfabetizacion.json desde Publicador',
      actual
    );

  return {
    ok: true,
    fuente:
      'Alfabetización + Ejemplos',
    ruta: ruta,
    caracteres:
      resultado.caracteres,
    ejemplos:
      resultado.ejemplos,
    ejemplosSinImagen:
      resultado.ejemplosSinImagen,
    actualizado:
      guardado.actualizado,
    yaEstabaActualizado:
      guardado.yaEstabaActualizado
  };
}


function sincronizarAlfabetizacionJsonPublicador(
  datos
) {
  validarSesionEditorPublicador_(datos || {});

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'Ya hay otra sincronización en curso. Espera unos segundos e inténtalo otra vez.'
    );
  }

  try {
    SpreadsheetApp.flush();
    return sincronizarAlfabetizacionJsonSinLockPublicador_();
  } finally {
    lock.releaseLock();
  }
}


/* -------------------------
   SINCRONIZAR TODO
   ------------------------- */

function sincronizarTodoJsonPublicador(
  datos
) {
  validarSesionEditorPublicador_(datos || {});

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'Ya hay otra sincronización en curso. Espera unos segundos e inténtalo otra vez.'
    );
  }

  try {
    SpreadsheetApp.flush();

    const resultados = {};
    const errores = [];

    function ejecutar(
      clave,
      funcion
    ) {
      try {
        resultados[clave] =
          funcion();
      } catch (error) {
        resultados[clave] = {
          ok: false,
          error:
            error &&
            error.message
              ? error.message
              : String(error)
        };

        errores.push(
          clave +
          ': ' +
          resultados[clave].error
        );
      }
    }

    ejecutar(
      'diccionario',
      sincronizarDiccionarioJsonSinLockPublicador_
    );

    ejecutar(
      'vocabulario',
      sincronizarVocabularioJsonSinLockPublicador_
    );

    ejecutar(
      'alfabetizacion',
      sincronizarAlfabetizacionJsonSinLockPublicador_
    );

    const actualizados =
      Object.keys(resultados)
        .filter(function(clave) {
          return (
            resultados[clave] &&
            resultados[clave].actualizado
          );
        })
        .length;

    return {
      ok: errores.length === 0,
      actualizados: actualizados,
      resultados: resultados,
      errores: errores,
      mensaje:
        errores.length
          ? 'La sincronización terminó con algunos errores.'
          : (
              actualizados
                ? 'Sincronización completa. Los JSON públicos quedaron actualizados.'
                : 'Todo ya estaba sincronizado.'
            )
    };
  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
   YOUTUBE
   ============================================================ */

function extraerYoutubeIdPublicador_(
  valor
) {
  const texto =
    String(valor || '').trim();

  if (
    /^[A-Za-z0-9_-]{11}$/
      .test(texto)
  ) {
    return texto;
  }

  const patrones = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/
  ];

  for (
    let i = 0;
    i < patrones.length;
    i++
  ) {
    const coincidencia =
      texto.match(patrones[i]);

    if (coincidencia) {
      return coincidencia[1];
    }
  }

  return '';
}


/* ============================================================
   TEXTO / SLUG
   ============================================================ */

function limpiarTextoPublicador_(valor) {
  return String(valor || '')
    .trim()
    .replace(/\s+/g, ' ');
}


function normalizarClavePublicador_(valor) {
  return limpiarTextoPublicador_(valor)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}


function slugPublicador_(valor) {
  let texto =
    normalizarClavePublicador_(valor);

  texto =
    texto
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  return texto || 'archivo';
}


/* ============================================================
   VERIFICAR CONEXIÓN
   ============================================================ */

function verificarConexionGitHubPublicador() {
  const c = configPublicador_();
  const ui = SpreadsheetApp.getUi();

  let token;

  try {
    token =
      comprobarTokenPublicador_();
  } catch (error) {
    ui.alert(
      '⚠️ ' +
      error.message
    );
    return;
  }

  const url =
    'https://api.github.com/repos/' +
    c.githubUsuario +
    '/' +
    c.githubRepo +
    '/branches/' +
    c.githubRama;

  try {
    const respuesta =
      UrlFetchApp.fetch(
        url,
        {
          method: 'get',

          headers: {
            Authorization:
              'Bearer ' + token,

            Accept:
              'application/vnd.github+json',

            'X-GitHub-Api-Version':
              '2022-11-28'
          },

          muteHttpExceptions: true
        }
      );

    const codigo =
      respuesta.getResponseCode();

    if (codigo === 200) {
      ui.alert(
        '✅ Conexión correcta\n\n' +
        'Repositorio: ' +
        c.githubUsuario +
        '/' +
        c.githubRepo +
        '\n\nRama: ' +
        c.githubRama +
        '\n\nEl Publicador ya puede comunicarse con GitHub.'
      );

      return;
    }

    ui.alert(
      '❌ GitHub respondió con código ' +
      codigo +
      '.'
    );

  } catch (error) {
    ui.alert(
      '❌ No se pudo comprobar GitHub.\n\n' +
      error.message
    );
  }
}

/* ============================================================
   PUBLICADOR 22 — CENTRO DE CONTROL, AUDITORÍA Y PRODUCCIÓN
   Añade herramientas de administración sin sustituir la lógica
   existente del Publicador.
   ============================================================ */

function authControlPublicador22_(datos) {
  validarSesionEditorPublicador_(datos || {});
}

function normalizarRutaRepoPublicador22_(valor) {
  let texto = limpiarTextoPublicador_(valor || '');
  if (!texto) return '';
  texto = texto.replace(/^https?:\/\/lspedia\.site\//i, '');
  texto = texto.replace(/^\.\//, '').replace(/^\//, '');
  try { texto = decodeURIComponent(texto); } catch (error) {}
  return texto;
}

function separarRutasPublicador22_(valor) {
  return String(valor || '')
    .split(',')
    .map(normalizarRutaRepoPublicador22_)
    .filter(function(ruta) {
      return /^(?:img|video)\//i.test(ruta);
    });
}

function cabecerasPublicador22_(hoja) {
  const ultima = Math.max(hoja.getLastColumn(), 1);
  const originales = hoja.getRange(1, 1, 1, ultima).getDisplayValues()[0];
  const mapa = {};
  originales.forEach(function(valor, indice) {
    mapa[normalizarClavePublicador_(valor)] = indice;
  });
  return { originales: originales, mapa: mapa };
}

function valorFilaPublicador22_(fila, mapa, campo) {
  const indice = mapa[normalizarClavePublicador_(campo)];
  if (indice === undefined) return '';
  return limpiarTextoPublicador_(fila[indice] || '');
}

function listarArchivosGitHubCarpetaPublicador22_(rutaRaiz) {
  const c = configPublicador_();
  const token = comprobarTokenPublicador_();
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  const cola = [String(rutaRaiz || '').replace(/\/$/, '')];
  const salida = [];
  let seguridad = 0;

  while (cola.length && seguridad < 120) {
    seguridad++;
    const ruta = cola.shift();
    const rutaApi = ruta
      .split('/')
      .map(function(parte) { return encodeURIComponent(parte); })
      .join('/');
    const url =
      'https://api.github.com/repos/' + c.githubUsuario + '/' + c.githubRepo +
      '/contents/' + rutaApi + '?ref=' + encodeURIComponent(c.githubRama);

    const respuesta = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true
    });

    if (respuesta.getResponseCode() === 404) continue;
    if (respuesta.getResponseCode() !== 200) {
      throw new Error('No se pudo revisar la carpeta ' + ruta + ' en GitHub. Código ' + respuesta.getResponseCode() + '.');
    }

    const elementos = JSON.parse(respuesta.getContentText());
    const lista = Array.isArray(elementos) ? elementos : [elementos];
    lista.forEach(function(item) {
      if (!item || !item.path) return;
      if (item.type === 'dir') cola.push(item.path);
      else if (item.type === 'file') {
        salida.push({
          ruta: item.path,
          nombre: item.name || '',
          sha: item.sha || '',
          tamano: Number(item.size || 0),
          downloadUrl: item.download_url || ''
        });
      }
    });
  }

  return salida;
}

function leerArchivoGitHubCrudoPublicador22_(ruta) {
  const c = configPublicador_();
  const token = comprobarTokenPublicador_();
  const rutaApi = String(ruta || '')
    .split('/')
    .map(function(parte) { return encodeURIComponent(parte); })
    .join('/');
  const url =
    'https://api.github.com/repos/' + c.githubUsuario + '/' + c.githubRepo +
    '/contents/' + rutaApi + '?ref=' + encodeURIComponent(c.githubRama);
  const respuesta = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    muteHttpExceptions: true
  });
  if (respuesta.getResponseCode() === 404) return null;
  if (respuesta.getResponseCode() !== 200) {
    throw new Error('No se pudo leer ' + ruta + ' desde GitHub. Código ' + respuesta.getResponseCode() + '.');
  }
  const payload = JSON.parse(respuesta.getContentText());
  return {
    ruta: ruta,
    sha: payload.sha || '',
    contenido: String(payload.content || '').replace(/\s/g, ''),
    tamano: Number(payload.size || 0)
  };
}

function recolectarRutasUsadasPublicador22_() {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const rutas = {};
  const categorias = {};

  function usarRuta(valor) {
    separarRutasPublicador22_(valor).forEach(function(ruta) { rutas[ruta] = true; });
  }

  function revisarHoja(nombre, camposRutas, conCategorias) {
    const hoja = ss.getSheetByName(nombre);
    if (!hoja || hoja.getLastRow() < 2) return;
    const info = cabecerasPublicador22_(hoja);
    const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, Math.max(hoja.getLastColumn(), 1)).getDisplayValues();
    filas.forEach(function(fila) {
      camposRutas.forEach(function(campo) { usarRuta(valorFilaPublicador22_(fila, info.mapa, campo)); });
      if (conCategorias) {
        const categoria = valorFilaPublicador22_(fila, info.mapa, 'categoria');
        if (categoria) categorias[categoria] = true;
      }
    });
  }

  revisarHoja(c.hojaDiccionario, ['imagen'], true);
  revisarHoja(c.hojaVocabulario, ['imagen'], true);
  revisarHoja(c.hojaEjemplos, ['imagen'], false);
  revisarHoja(c.hojaAlfabetizacion, [
    'imagenBoca','trazoVideo','grafiaImagen','grafiaMayuscula','grafiaMinuscula',
    'grafiaCursivaMayuscula','grafiaCursivaMinuscula','imagenCirculo'
  ], false);

  const mapaIconos = obtenerRutasIconosCategoriasPublicador_();
  Object.keys(categorias).forEach(function(categoria) {
    const slug = slugPublicador_(categoria);
    const ruta = (mapaIconos && mapaIconos[slug]) || ('img/categorias/' + slug + '.webp');
    rutas[normalizarRutaRepoPublicador22_(ruta)] = true;
  });

  return { rutas: rutas, categorias: categorias };
}

function obtenerEstadoDiccionarioControlPublicador22_(hoja) {
  const totales = { total:0, completo:0, faltaImagen:0, faltaVideo:0, faltanAmbos:0 };
  if (!hoja || hoja.getLastRow() < 2) return totales;
  const info = cabecerasPublicador22_(hoja);
  const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, Math.max(hoja.getLastColumn(),1)).getDisplayValues();
  filas.forEach(function(fila) {
    const palabra = valorFilaPublicador22_(fila, info.mapa, 'palabra');
    if (!palabra) return;
    const imagen = separarRutasPublicador22_(valorFilaPublicador22_(fila, info.mapa, 'imagen')).length > 0;
    const video = !!valorFilaPublicador22_(fila, info.mapa, 'video');
    totales.total++;
    if (imagen && video) totales.completo++;
    else if (!imagen && !video) totales.faltanAmbos++;
    else if (!imagen) totales.faltaImagen++;
    else totales.faltaVideo++;
  });
  return totales;
}

function contarFilasConPalabraPublicador22_(hoja) {
  if (!hoja || hoja.getLastRow() < 2) return 0;
  const info = cabecerasPublicador22_(hoja);
  if (info.mapa.palabra === undefined) return Math.max(0, hoja.getLastRow() - 1);
  const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, Math.max(hoja.getLastColumn(),1)).getDisplayValues();
  return filas.filter(function(fila) { return !!valorFilaPublicador22_(fila, info.mapa, 'palabra'); }).length;
}

function obtenerDashboardPublicadorLSPedia(datos) {
  authControlPublicador22_(datos);
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const dic = ss.getSheetByName(c.hojaDiccionario);
  const voc = ss.getSheetByName(c.hojaVocabulario);
  const eje = ss.getSheetByName(c.hojaEjemplos);
  const alf = ss.getSheetByName(c.hojaAlfabetizacion);
  const estadoDic = obtenerEstadoDiccionarioControlPublicador22_(dic);

  const usadas = recolectarRutasUsadasPublicador22_();
  const categorias = Object.keys(usadas.categorias);
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioSemana = new Date(inicioHoy.getTime() - 6 * 24 * 60 * 60 * 1000);
  let hoy = 0;
  let semana = 0;
  const historial = obtenerHojaHistorialPublicador_(false);
  if (historial && historial.getLastRow() >= 2) {
    const fechas = historial.getRange(2, 2, historial.getLastRow() - 1, 1).getValues();
    fechas.forEach(function(fila) {
      const fecha = fila[0];
      if (Object.prototype.toString.call(fecha) !== '[object Date]' || isNaN(fecha.getTime())) return;
      if (fecha >= inicioHoy) hoy++;
      if (fecha >= inicioSemana) semana++;
    });
  }

  return {
    diccionario: estadoDic.total,
    vocabulario: contarFilasConPalabraPublicador22_(voc),
    ejemplos: contarFilasConPalabraPublicador22_(eje),
    alfabeto: Math.max(0, alf ? alf.getLastRow() - 1 : 0),
    categorias: categorias.length,
    pendientes: estadoDic.faltaImagen + estadoDic.faltaVideo + estadoDic.faltanAmbos,
    faltaImagen: estadoDic.faltaImagen,
    faltaVideo: estadoDic.faltaVideo,
    borradores: estadoDic.faltanAmbos,
    accionesHoy: hoy,
    acciones7Dias: semana
  };
}

function canonJsonPublicador22_(valor) {
  if (Array.isArray(valor)) return valor.map(canonJsonPublicador22_);
  if (valor && typeof valor === 'object') {
    const salida = {};
    Object.keys(valor).sort().forEach(function(k) { salida[k] = canonJsonPublicador22_(valor[k]); });
    return salida;
  }
  return valor;
}

function auditarLSPediaPublicador(datos) {
  authControlPublicador22_(datos);
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const problemas = [];
  const resultados = [];

  function comparar(ruta, generado, actual) {
    const esperado = JSON.stringify(canonJsonPublicador22_(generado || null));
    const presente = JSON.stringify(canonJsonPublicador22_(actual || null));
    const igual = esperado === presente;
    resultados.push({ ruta:ruta, ok:igual, esperado: Array.isArray(generado) ? generado.length : '', actual: Array.isArray(actual) ? actual.length : '' });
    if (!igual) problemas.push('El archivo ' + ruta + ' no coincide con lo que actualmente producen las hojas.');
  }

  const dic = ss.getSheetByName(c.hojaDiccionario);
  const voc = ss.getSheetByName(c.hojaVocabulario);
  const alf = ss.getSheetByName(c.hojaAlfabetizacion);
  const eje = ss.getSheetByName(c.hojaEjemplos);

  try {
    const actualDic = leerJsonGitHubPublicador_('data/palabras.json');
    const genDic = construirDiccionarioJsonPublicador_(dic, actualDic && actualDic.datos);
    comparar('data/palabras.json', genDic.registros, actualDic && actualDic.datos);
  } catch (error) { problemas.push('Diccionario: ' + error.message); }

  try {
    const actualVoc = leerJsonGitHubPublicador_('data/vocabulario.json');
    const genVoc = construirVocabularioJsonPublicador_(voc);
    comparar('data/vocabulario.json', genVoc.registros, actualVoc && actualVoc.datos);
  } catch (error) { problemas.push('Vocabulario: ' + error.message); }

  try {
    const actualAlf = leerJsonGitHubPublicador_('data/alfabetizacion.json');
    const genAlf = construirAlfabetizacionJsonPublicador_(alf, eje);
    comparar('data/alfabetizacion.json', genAlf.documento, actualAlf && actualAlf.datos);
  } catch (error) { problemas.push('Alfabetización: ' + error.message); }

  let archivos = [];
  try {
    [
      c.carpetaDiccionario,c.carpetaVocabulario,c.carpetaEjemplos,c.carpetaAlfabetizacionBoca,
      c.carpetaAlfabetizacionGrafias,c.carpetaAlfabetizacionCirculo,c.carpetaCategorias
    ].forEach(function(carpeta) {
      listarArchivosGitHubCarpetaPublicador22_(carpeta).forEach(function(item) { archivos.push(item); });
    });
    const existe = {};
    archivos.forEach(function(item) { existe[normalizarRutaRepoPublicador22_(item.ruta)] = true; });
    const usadas = recolectarRutasUsadasPublicador22_();
    Object.keys(usadas.rutas).forEach(function(ruta) {
      if (!existe[ruta]) problemas.push('Falta en GitHub el recurso usado: ' + ruta);
    });
  } catch (error) { problemas.push('Revisión de archivos: ' + error.message); }

  return {
    ok: problemas.length === 0,
    problemas: problemas,
    json: resultados,
    archivosRevisados: archivos.length,
    fecha: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Lima', 'dd/MM/yyyy HH:mm')
  };
}

function obtenerArchivosNoUsadosPublicadorLSPedia(datos) {
  authControlPublicador22_(datos);
  const c = configPublicador_();
  const usadas = recolectarRutasUsadasPublicador22_().rutas;
  const carpetas = [
    c.carpetaDiccionario,c.carpetaVocabulario,c.carpetaEjemplos,c.carpetaAlfabetizacionBoca,
    c.carpetaAlfabetizacionGrafias,c.carpetaAlfabetizacionCirculo,c.carpetaCategorias
  ];
  const vistos = {};
  const noUsados = [];
  carpetas.forEach(function(carpeta) {
    listarArchivosGitHubCarpetaPublicador22_(carpeta).forEach(function(item) {
      const ruta = normalizarRutaRepoPublicador22_(item.ruta);
      if (vistos[ruta]) return;
      vistos[ruta] = true;
      if (!usadas[ruta]) {
        noUsados.push({ ruta:ruta, tamano:item.tamano, nombre:item.nombre });
      }
    });
  });
  noUsados.sort(function(a,b){ return a.ruta.localeCompare(b.ruta, 'es', {sensitivity:'base'}); });
  return { total:noUsados.length, archivos:noUsados.slice(0,300), truncado:noUsados.length > 300 };
}

function verificarVideoYouTubePublicadorLSPedia(datos) {
  authControlPublicador22_(datos);
  const crudo = limpiarTextoPublicador_(datos && datos.video);
  const id = extraerYoutubeIdPublicador_(crudo);
  if (!id) return { ok:false, videoId:'', mensaje:'El enlace o ID de YouTube no es válido.' };
  const url = 'https://www.youtube.com/oembed?url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id) + '&format=json';
  try {
    const respuesta = UrlFetchApp.fetch(url, { method:'get', muteHttpExceptions:true, followRedirects:true });
    if (respuesta.getResponseCode() !== 200) {
      return { ok:false, videoId:id, mensaje:'YouTube no confirmó que el video sea público y accesible.' };
    }
    const info = JSON.parse(respuesta.getContentText());
    return { ok:true, videoId:id, titulo:info.title || '', autor:info.author_name || '', mensaje:'Video disponible en YouTube.' };
  } catch (error) {
    return { ok:false, videoId:id, mensaje:'No se pudo comprobar YouTube: ' + error.message };
  }
}

function auditarVideosPublicadorLSPedia(datos) {
  authControlPublicador22_(datos);
  const limite = Math.max(1, Math.min(Number(datos && datos.limite || 40), 60));
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const candidatos = [];

  [
    { hoja:c.hojaDiccionario, origen:'Diccionario' },
    { hoja:c.hojaVocabulario, origen:'Vocabulario' }
  ].forEach(function(config) {
    if (candidatos.length >= limite) return;
    const hoja = ss.getSheetByName(config.hoja);
    if (!hoja || hoja.getLastRow() < 2) return;
    const info = cabecerasPublicador22_(hoja);
    const filas = hoja.getRange(2,1,hoja.getLastRow()-1,Math.max(hoja.getLastColumn(),1)).getDisplayValues();
    for (let i=0; i<filas.length && candidatos.length<limite; i++) {
      const video = valorFilaPublicador22_(filas[i], info.mapa, 'video');
      const palabra = valorFilaPublicador22_(filas[i], info.mapa, 'palabra');
      if (!video || !palabra) continue;
      const id = extraerYoutubeIdPublicador_(video);
      candidatos.push({ origen:config.origen, fila:i+2, palabra:palabra, video:video, id:id });
    }
  });

  const solicitudes = candidatos.map(function(item) {
    if (!item.id) return null;
    return {
      url: 'https://www.youtube.com/oembed?url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + item.id) + '&format=json',
      method:'get', muteHttpExceptions:true, followRedirects:true
    };
  });

  const indicesValidos = [];
  const requests = [];
  solicitudes.forEach(function(req, indice) {
    if (req) { requests.push(req); indicesValidos.push(indice); }
  });

  let respuestas = [];
  if (requests.length) {
    try { respuestas = UrlFetchApp.fetchAll(requests); }
    catch (error) { respuestas = []; }
  }

  const porIndice = {};
  respuestas.forEach(function(resp, i) { porIndice[indicesValidos[i]] = resp; });
  const problemas = [];
  candidatos.forEach(function(item, indice) {
    if (!item.id) {
      problemas.push({ origen:item.origen, fila:item.fila, palabra:item.palabra, video:item.video, ok:false, mensaje:'Enlace o ID inválido.' });
      return;
    }
    const resp = porIndice[indice];
    if (!resp || resp.getResponseCode() !== 200) {
      problemas.push({ origen:item.origen, fila:item.fila, palabra:item.palabra, video:item.video, ok:false, mensaje:'YouTube no confirmó que el video sea público y accesible.' });
    }
  });

  return { total:candidatos.length, problemas:problemas, ok:problemas.length === 0, limite:limite };
}

function obtenerCategoriasAdminPublicadorLSPedia(datos) {
  authControlPublicador22_(datos);
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const mapa = {};

  function contar(nombreHoja, campoConteo) {
    const hoja = ss.getSheetByName(nombreHoja);
    if (!hoja || hoja.getLastRow() < 2) return;
    const info = cabecerasPublicador22_(hoja);
    const filas = hoja.getRange(2,1,hoja.getLastRow()-1,Math.max(hoja.getLastColumn(),1)).getDisplayValues();
    filas.forEach(function(fila) {
      const cat = valorFilaPublicador22_(fila, info.mapa, 'categoria');
      const palabra = valorFilaPublicador22_(fila, info.mapa, 'palabra');
      if (!cat || !palabra) return;
      if (!mapa[cat]) mapa[cat] = { categoria:cat, diccionario:0, vocabulario:0 };
      mapa[cat][campoConteo]++;
    });
  }
  contar(c.hojaDiccionario, 'diccionario');
  contar(c.hojaVocabulario, 'vocabulario');

  let iconos = {};
  try {
    listarArchivosGitHubCarpetaPublicador22_(c.carpetaCategorias).forEach(function(item) {
      iconos[normalizarRutaRepoPublicador22_(item.ruta)] = true;
    });
  } catch (error) {}

  return Object.keys(mapa).sort(function(a,b){ return a.localeCompare(b,'es',{sensitivity:'base'}); }).map(function(nombre) {
    const item = mapa[nombre];
    const ruta = normalizarRutaRepoPublicador22_(resolverRutaIconoCategoriaPublicador_(nombre));
    item.total = item.diccionario + item.vocabulario;
    item.icono = ruta;
    item.tieneIcono = !!iconos[ruta];
    return item;
  });
}

function cambiarCategoriaMasivoPublicador22_(hoja, origen, destino) {
  if (!hoja || hoja.getLastRow() < 2) return 0;
  const info = cabecerasPublicador22_(hoja);
  const col = info.mapa.categoria;
  if (col === undefined) return 0;
  const rango = hoja.getRange(2, col + 1, hoja.getLastRow() - 1, 1);
  const valores = rango.getValues();
  let cambios = 0;
  valores.forEach(function(fila) {
    if (normalizarClavePublicador_(fila[0]) === normalizarClavePublicador_(origen)) {
      fila[0] = destino;
      cambios++;
    }
  });
  if (cambios) rango.setValues(valores);
  return cambios;
}

function copiarIconoCategoriaSiConvienePublicador22_(origen, destino) {
  const c = configPublicador_();
  const rutaOrigen = c.carpetaCategorias + slugPublicador_(origen) + '.webp';
  const rutaDestino = c.carpetaCategorias + slugPublicador_(destino) + '.webp';
  const destinoActual = leerArchivoGitHubCrudoPublicador22_(rutaDestino);
  if (destinoActual) return { copiado:false, mensaje:'La categoría destino ya tiene icono.' };
  const archivo = leerArchivoGitHubCrudoPublicador22_(rutaOrigen);
  if (!archivo || !archivo.contenido) return { copiado:false, mensaje:'No encontré un icono antiguo para copiar.' };
  subirArchivoGitHubPublicador_(rutaDestino, archivo.contenido, 'Copiar icono de categoría: ' + origen + ' → ' + destino);
  return { copiado:true, ruta:rutaDestino };
}

function renombrarCategoriaPublicadorLSPedia(datos) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('El Publicador está ocupado. Intenta nuevamente.');
  try {
  authControlPublicador22_(datos);
  const anterior = limpiarTextoPublicador_(datos && datos.anterior);
  const nueva = limpiarTextoPublicador_(datos && datos.nueva);
  if (!anterior || !nueva) throw new Error('Indica la categoría actual y el nuevo nombre.');
  if (normalizarClavePublicador_(anterior) === normalizarClavePublicador_(nueva)) throw new Error('El nombre nuevo es igual al actual.');

  const existentes = obtenerCategoriasAdminPublicadorLSPedia(datos);
  if (existentes.some(function(item){ return normalizarClavePublicador_(item.categoria) === normalizarClavePublicador_(nueva); })) {
    throw new Error('La categoría destino ya existe. Usa Fusionar categorías para evitar duplicados.');
  }

  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const cambiosDic = cambiarCategoriaMasivoPublicador22_(ss.getSheetByName(c.hojaDiccionario), anterior, nueva);
  const cambiosVoc = cambiarCategoriaMasivoPublicador22_(ss.getSheetByName(c.hojaVocabulario), anterior, nueva);
  if (!cambiosDic && !cambiosVoc) throw new Error('No encontré filas con la categoría ' + anterior + '.');
  SpreadsheetApp.flush();

  let icono = null;
  try { icono = copiarIconoCategoriaSiConvienePublicador22_(anterior, nueva); } catch (error) { icono = {copiado:false,mensaje:error.message}; }
  const syncDic = sincronizarDiccionarioJsonSinLockPublicador_();
  const syncVoc = sincronizarVocabularioJsonSinLockPublicador_();
  registrarHistorialPublicador_('categoria-renombrada','categorias',null,0,anterior,null,{anterior:anterior,nueva:nueva,diccionario:cambiosDic,vocabulario:cambiosVoc});
  return { ok:true, anterior:anterior, nueva:nueva, diccionario:cambiosDic, vocabulario:cambiosVoc, icono:icono, syncDic:syncDic, syncVoc:syncVoc };

  } finally {
    lock.releaseLock();
  }
}

function fusionarCategoriasPublicadorLSPedia(datos) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('El Publicador está ocupado. Intenta nuevamente.');
  try {
  authControlPublicador22_(datos);
  const origen = limpiarTextoPublicador_(datos && datos.origen);
  const destino = limpiarTextoPublicador_(datos && datos.destino);
  if (!origen || !destino) throw new Error('Selecciona la categoría origen y la categoría destino.');
  if (normalizarClavePublicador_(origen) === normalizarClavePublicador_(destino)) throw new Error('Origen y destino no pueden ser iguales.');
  const existentes = obtenerCategoriasAdminPublicadorLSPedia(datos);
  if (!existentes.some(function(item){ return normalizarClavePublicador_(item.categoria) === normalizarClavePublicador_(destino); })) {
    throw new Error('La categoría destino no existe.');
  }
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const cambiosDic = cambiarCategoriaMasivoPublicador22_(ss.getSheetByName(c.hojaDiccionario), origen, destino);
  const cambiosVoc = cambiarCategoriaMasivoPublicador22_(ss.getSheetByName(c.hojaVocabulario), origen, destino);
  if (!cambiosDic && !cambiosVoc) throw new Error('No encontré filas con la categoría origen.');
  SpreadsheetApp.flush();
  const syncDic = sincronizarDiccionarioJsonSinLockPublicador_();
  const syncVoc = sincronizarVocabularioJsonSinLockPublicador_();
  registrarHistorialPublicador_('categorias-fusionadas','categorias',null,0,origen,null,{origen:origen,destino:destino,diccionario:cambiosDic,vocabulario:cambiosVoc});
  return { ok:true, origen:origen, destino:destino, diccionario:cambiosDic, vocabulario:cambiosVoc, syncDic:syncDic, syncVoc:syncVoc };

  } finally {
    lock.releaseLock();
  }
}

function regenerarClavePublicadorMovilLSPedia(datos) {
  authControlPublicador22_(datos);
  const nueva = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty(PROP_PUBLICADOR_MOVIL_KEY, nueva);
  return {
    ok:true,
    url: URL_WEB_APP_LSPEDIA + '?modo=publicador&key=' + encodeURIComponent(nueva),
    mensaje:'La clave anterior quedó invalidada. Guarda el nuevo enlace antes de cerrar esta pantalla.'
  };
}

function validarPreflightPublicadorLSPedia(datos) {
  authControlPublicador22_(datos);

  const tipo =
    normalizarClavePublicador_(
      datos && datos.tipo
    );

  const items = [];
  let ok = true;
  let requiereConfirmacionSinImagen = false;
  let yaAprobadoSinImagen = false;

  function agregar(
    etiqueta,
    correcto,
    detalle,
    aviso
  ) {
    items.push({
      etiqueta: etiqueta,
      ok: !!correcto,
      aviso: !!aviso,
      detalle: detalle || ''
    });

    if (!correcto && !aviso) {
      ok = false;
    }
  }

  const palabra =
    limpiarTextoPublicador_(
      datos && datos.palabra
    );

  agregar(
    tipo === 'alfabetizacion'
      ? 'Palabra del ejemplo'
      : 'Palabra',
    !!palabra,
    palabra
      ? 'Completa'
      : 'Falta completar este campo.'
  );

  if (tipo === 'diccionario') {
    const definicion =
      String(
        datos && datos.definicion || ''
      ).trim();

    const categoriaSeleccionada =
      limpiarTextoPublicador_(
        datos && datos.categoria
      );

    const nueva =
      limpiarTextoPublicador_(
        datos && datos.nuevaCategoria
      );

    const categoria =
      categoriaSeleccionada === '__NUEVA__'
        ? nueva
        : categoriaSeleccionada;

    let imagenEfectiva =
      !!(datos && datos.tieneImagen);

    let videoEfectivo =
      limpiarTextoPublicador_(
        datos && datos.video
      );

    let filaExistente = 0;

    if (palabra && categoria) {
      const c = configPublicador_();
      const hoja =
        obtenerSpreadsheetPublicador_()
          .getSheetByName(
            c.hojaDiccionario
          );

      filaExistente =
        buscarFilaExistentePublicador_(
          hoja,
          palabra,
          categoria
        );

      if (filaExistente) {
        imagenEfectiva =
          imagenEfectiva ||
          !!obtenerValorFilaPublicador_(
            hoja,
            filaExistente,
            'imagen'
          );

        videoEfectivo =
          videoEfectivo ||
          obtenerValorFilaPublicador_(
            hoja,
            filaExistente,
            'video'
          );
        yaAprobadoSinImagen = esSiPublicador_(obtenerValorFilaPublicador_(hoja, filaExistente, 'publicarSinImagen'));
      }
    }

    requiereConfirmacionSinImagen = !imagenEfectiva && !!definicion && !yaAprobadoSinImagen;

    agregar(
      'Concepto / definición',
      true,
      definicion
        ? (!imagenEfectiva ? (yaAprobadoSinImagen ? 'Disponible y ya autorizado para publicarse sin imagen.' : 'Disponible. Antes de guardar te preguntaré si deseas publicarlo sin imagen.') : 'Disponible.')
        : (imagenEfectiva ? 'Opcional: la imagen permite publicar la ficha.' : 'Sin concepto y sin imagen: se guardará como pendiente.'),
      !definicion
    );

    agregar(
      'Categoría',
      !!categoria,
      categoria
        ? 'Seleccionada'
        : 'Falta seleccionar categoría.'
    );

    agregar(
      'Duplicados',
      true,
      filaExistente
        ? (
          'Ya existe en la fila ' +
          filaExistente +
          ': se actualizará, no se duplicará.'
        )
        : 'No existe una ficha idéntica: se creará una nueva.'
    );
    const etiquetas =
      normalizarEtiquetasTaxonomiaPublicador23_(
        datos && datos.etiquetas
      );

    agregar(
      'Etiquetas',
      true,
      etiquetas.length
        ? etiquetas.join(', ')
        : 'Opcionales. Ejemplos: Días de la semana, Meses del año, Útiles escolares.',
      false
    );

    agregar(
      'Imagen principal',
      imagenEfectiva,
      imagenEfectiva
        ? 'Disponible: la ficha puede publicarse aunque falten concepto o video.'
        : (definicion ? 'Sin imagen: puede publicarse solo con concepto si lo confirmas.' : 'Sin imagen y sin concepto: se guardará pendiente.'),
      !imagenEfectiva
    );

    if (videoEfectivo) {
      const videoId =
        extraerYoutubeIdPublicador_(
          videoEfectivo
        );

      // Preflight rápido: valida el formato localmente y no consulta YouTube.
      // La disponibilidad remota sigue pudiendo revisarse desde Control.
      // Así una demora de YouTube no deja el botón en “Revisando...”.
      agregar(
        'Video de YouTube',
        !!videoId,
        videoId
          ? 'Enlace o ID válido. Disponibilidad remota revisable desde Control.'
          : 'El enlace o ID de YouTube no tiene un formato válido.',
        false
      );
      // El guardado definitivo vuelve a validar el ID antes de escribir.
      // No se pierde ninguna protección de datos ni de duplicados.
      // Solo se retira la llamada externa del paso previo.
    } else {
      agregar(
        'Video de YouTube',
        false,
        'Opcional. La ficha puede publicarse sin video; podrás agregarlo después.',
        true
      );
    }

  } else if (tipo === 'vocabulario') {
    const categoriaSeleccionada =
      limpiarTextoPublicador_(
        datos && datos.categoria
      );

    const nueva =
      limpiarTextoPublicador_(
        datos && datos.nuevaCategoria
      );

    const categoria =
      categoriaSeleccionada === '__NUEVA__'
        ? nueva
        : categoriaSeleccionada;

    const nivel =
      limpiarTextoPublicador_(
        datos && datos.nivel
      );

    const definicion = String(datos && datos.definicion || '').trim();

    let imagenEfectiva =
      !!(datos && datos.tieneImagen);

    let videoEfectivo =
      limpiarTextoPublicador_(
        datos && datos.video
      );

    let filaExistente = 0;

    if (palabra && categoria) {
      const c = configPublicador_();
      const hoja =
        obtenerSpreadsheetPublicador_()
          .getSheetByName(
            c.hojaVocabulario
          );

      filaExistente =
        buscarFilaExistentePublicador_(
          hoja,
          palabra,
          categoria
        );

      if (filaExistente) {
        imagenEfectiva =
          imagenEfectiva ||
          !!obtenerValorFilaPublicador_(
            hoja,
            filaExistente,
            'imagen'
          );

        videoEfectivo =
          videoEfectivo ||
          obtenerValorFilaPublicador_(
            hoja,
            filaExistente,
            'video'
          );
      }
    }

    // En Vocabulario no existe publicación "solo con concepto".
    // El concepto es opcional y no participa en la decisión de publicación.
    requiereConfirmacionSinImagen = false;

    agregar(
      'Categoría',
      !!categoria,
      categoria
        ? 'Seleccionada'
        : 'Falta categoría.'
    );

    agregar(
      'Nivel',
      !!nivel,
      nivel
        ? 'Seleccionado'
        : 'Falta nivel.'
    );

    agregar(
      'Duplicados',
      true,
      filaExistente
        ? (
          'Ya existe en la fila ' +
          filaExistente +
          ': se actualizará, no se duplicará.'
        )
        : 'No existe una ficha idéntica: se creará una nueva.'
    );
    const etiquetas =
      normalizarEtiquetasTaxonomiaPublicador23_(
        datos && datos.etiquetas
      );

    agregar(
      'Etiquetas',
      true,
      etiquetas.length
        ? etiquetas.join(', ')
        : 'Opcionales. Ejemplos: Días de la semana, Meses del año, Útiles escolares.',
      false
    );

    agregar(
      'Imágenes',
      imagenEfectiva,
      imagenEfectiva
        ? 'Disponible: permite que la ficha aparezca públicamente en Vocabulario.'
        : 'Falta imagen: se guardará en Sheets, pero permanecerá pendiente y fuera de la galería pública.',
      !imagenEfectiva
    );

    if (videoEfectivo) {
      const videoId =
        extraerYoutubeIdPublicador_(
          videoEfectivo
        );

      // Preflight rápido: valida el formato localmente y no consulta YouTube.
      // La disponibilidad remota sigue pudiendo revisarse desde Control.
      // Así una demora de YouTube no deja el botón en “Revisando...”.
      agregar(
        'Video de YouTube',
        !!videoId,
        videoId
          ? 'Enlace o ID válido. Disponibilidad remota revisable desde Control.'
          : 'El enlace o ID de YouTube no tiene un formato válido.',
        false
      );
      // El guardado definitivo vuelve a validar el ID antes de escribir.
      // No se pierde ninguna protección de datos ni de duplicados.
      // Solo se retira la llamada externa del paso previo.
    } else {
      agregar(
        'Video de YouTube',
        false,
        'Falta video. No bloquea la publicación si ya hay imagen, pero la ficha seguirá marcada en Pendientes hasta completarlo.',
        true
      );
    }

  } else if (tipo === 'alfabetizacion') {
    agregar(
      'Letra',
      !!limpiarTextoPublicador_(
        datos && datos.caracter
      ),
      ''
    );

    agregar(
      'Nivel',
      !!limpiarTextoPublicador_(
        datos && datos.nivel
      ),
      ''
    );

    agregar(
      'Imagen',
      !!(datos && datos.tieneImagen),
      (datos && datos.tieneImagen)
        ? 'Seleccionada'
        : 'Falta imagen.'
    );

  } else {
    agregar(
      'Tipo',
      false,
      'Tipo de publicación no reconocido.'
    );
  }

  return {
    ok: ok,
    items: items,
    requiereConfirmacionSinImagen: requiereConfirmacionSinImagen,
    yaAprobadoSinImagen: yaAprobadoSinImagen
  };
}

function snapshotADiccionarioPublicador22_(snapshot) {
  const salida = {};
  if (!snapshot) return salida;
  if (!Array.isArray(snapshot.encabezados)) {
    if (typeof snapshot === 'object') {
      Object.keys(snapshot).forEach(function(k) { salida[k] = snapshot[k] == null ? '' : snapshot[k]; });
    }
    return salida;
  }
  snapshot.encabezados.forEach(function(encabezado, indice) {
    let valor = snapshot.valores && snapshot.valores[indice];
    if (valor && typeof valor === 'object' && valor.__fechaPublicador) valor = valor.__fechaPublicador;
    salida[String(encabezado || '')] = valor == null ? '' : valor;
  });
  return salida;
}

function obtenerDetalleHistorialPublicadorLSPedia(datos) {
  authControlPublicador22_(datos);
  const id = limpiarTextoPublicador_(datos && datos.id);
  if (!id) throw new Error('Falta el identificador del historial.');
  const hoja = obtenerHojaHistorialPublicador_(false);
  if (!hoja || hoja.getLastRow() < 2) throw new Error('No hay historial disponible.');
  const filas = hoja.getRange(2,1,hoja.getLastRow()-1,10).getValues();
  for (let i=filas.length-1; i>=0; i--) {
    if (String(filas[i][0] || '') !== id) continue;
    const antes = filas[i][7] ? JSON.parse(String(filas[i][7])) : null;
    const despues = filas[i][8] ? JSON.parse(String(filas[i][8])) : null;
    const a = snapshotADiccionarioPublicador22_(antes);
    const d = snapshotADiccionarioPublicador22_(despues);
    const campos = {};
    Object.keys(a).forEach(function(k){ campos[k]=true; });
    Object.keys(d).forEach(function(k){ campos[k]=true; });
    const cambios = [];
    Object.keys(campos).forEach(function(campo) {
      const va = a[campo] == null ? '' : String(a[campo]);
      const vd = d[campo] == null ? '' : String(d[campo]);
      if (va !== vd) cambios.push({ campo:campo, antes:va, despues:vd });
    });
    return {
      id:id, fecha:String(filas[i][1] || ''), accion:String(filas[i][2] || ''), origen:String(filas[i][3] || ''),
      palabra:String(filas[i][6] || ''), deshecho:normalizarClavePublicador_(filas[i][9]) === 'si', cambios:cambios
    };
  }
  throw new Error('No encontré esa entrada del historial.');
}

function buscarRegistroJsonPublicador22_(lista, palabra, categoria) {
  if (!Array.isArray(lista)) return null;
  const p = normalizarClavePublicador_(palabra);
  const c = normalizarClavePublicador_(categoria);
  return lista.find(function(item) {
    const ip = normalizarClavePublicador_(item && item.palabra);
    const ic = normalizarClavePublicador_(item && item.categoria);
    return ip === p && (!c || ic === c);
  }) || null;
}

function verificarPublicacionEnJsonLSPedia(datos) {
  authControlPublicador22_(datos);

  const tipo =
    normalizarClavePublicador_(
      datos && datos.tipo
    );

  const palabra =
    limpiarTextoPublicador_(
      datos && datos.palabra
    );

  const categoria =
    limpiarTextoPublicador_(
      datos && datos.categoria
    );

  if (!palabra) {
    throw new Error(
      'Falta la palabra para verificar.'
    );
  }

  if (tipo === 'diccionario') {
    const imagenEsperada =
      datos &&
      datos.tieneImagenPublicada === true;

    const imagenAusente =
      datos &&
      datos.tieneImagenPublicada === false;

    const videoEsperado =
      datos &&
      datos.tieneVideoPublicada !== false;

    const publicada = datos && datos.publicada !== false;

    if (!publicada) {
      return {
        ok: true,
        ruta: 'Google Sheets · pendiente',
        mensaje: 'La ficha se guardó como pendiente y no debe aparecer todavía en los datos públicos.'
      };
    }

    // Toda ficha marcada como publicada —con imagen o solo con concepto aprobado—
    // debe estar en palabras.json. El video ya no decide si una ficha se publica.
    if (publicada) {
      const actual =
        leerJsonGitHubPublicador_(
          'data/palabras.json'
        );

      const encontrado =
        buscarRegistroJsonPublicador22_(
          actual && actual.datos,
          palabra,
          categoria
        );

      if (encontrado) {
        return {
          ok: true,
          ruta: 'data/palabras.json',
          mensaje: imagenEsperada
            ? 'La ficha ya está presente en el Diccionario público.'
            : 'La ficha ya está presente en palabras.json.'
        };
      }
    }

    /*
     * Una ficha del Diccionario puede tener video sin imagen. En ese caso
     * es válida para "Lo nuevo" aunque todavía no deba aparecer en el
     * Diccionario visual. Verificamos también ese archivo para evitar un
     * falso negativo en el post-publicación.
     */
    if (videoEsperado && !(datos && datos.publicarSinImagen === true)) {
      const nuevas =
        leerJsonGitHubPublicador_(
          'data/nuevas-palabras.json'
        );

      const items =
        nuevas &&
        nuevas.datos &&
        Array.isArray(nuevas.datos.items)
          ? nuevas.datos.items
          : [];

      const encontradaNueva =
        items.some(function(item) {
          return (
            normalizarClavePublicador_(
              item && item.palabra
            ) ===
              normalizarClavePublicador_(
                palabra
              ) &&
            normalizarClavePublicador_(
              item && item.fuente
            ) === 'diccionario' &&
            (
              !categoria ||
              normalizarClavePublicador_(
                item && item.categoria
              ) ===
                normalizarClavePublicador_(
                  categoria
                )
            )
          );
        });

      if (encontradaNueva) {
        return {
          ok: true,
          ruta: 'data/nuevas-palabras.json',
          mensaje: imagenAusente
            ? 'La ficha está publicada en Lo nuevo. Falta imagen para aparecer también en el Diccionario visual.'
            : 'La ficha también está registrada en Lo nuevo.'
        };
      }
    }

    return {
      ok: false,
      ruta: (datos && datos.publicarSinImagen === true)
        ? 'data/palabras.json'
        : (imagenAusente ? 'data/nuevas-palabras.json' : 'data/palabras.json / data/nuevas-palabras.json'),
      mensaje: (datos && datos.publicarSinImagen === true)
        ? 'Todavía no encontré la ficha publicada solo con concepto en palabras.json.'
        : (imagenAusente ? 'Todavía no encontré el video de esta ficha en Lo nuevo.' : 'Todavía no encontré la ficha en los JSON públicos.')
    };
  }

  if (tipo === 'vocabulario') {
    const actual =
      leerJsonGitHubPublicador_(
        'data/vocabulario.json'
      );

    const encontrado =
      buscarRegistroJsonPublicador22_(
        actual && actual.datos,
        palabra,
        categoria
      );

    return {
      ok: !!encontrado,
      ruta: 'data/vocabulario.json',
      mensaje: encontrado
        ? 'La ficha ya está presente en vocabulario.json.'
        : 'No encontré todavía la ficha en vocabulario.json. En Vocabulario se necesita una imagen para entrar en los datos públicos; el concepto no sustituye la imagen.'
    };
  }

  if (
    tipo === 'alfabetizacion' ||
    tipo === 'ejemplos'
  ) {
    const actual =
      leerJsonGitHubPublicador_(
        'data/alfabetizacion.json'
      );

    const lista =
      actual &&
      actual.datos &&
      actual.datos.ejemplos;

    const encontrado =
      Array.isArray(lista) &&
      lista.some(function(item) {
        return (
          normalizarClavePublicador_(
            item && item.palabra
          ) ===
          normalizarClavePublicador_(
            palabra
          )
        );
      });

    return {
      ok: !!encontrado,
      ruta: 'data/alfabetizacion.json',
      mensaje: encontrado
        ? 'El ejemplo ya está presente en alfabetizacion.json.'
        : 'No encontré todavía el ejemplo en alfabetizacion.json.'
    };
  }

  return {
    ok: false,
    ruta: '',
    mensaje:
      'Este tipo de contenido no tiene verificación JSON automática.'
  };
}

function buscarFilaEjemploPublicador22_(hoja, caracter, palabra) {
  if (!hoja || hoja.getLastRow() < 2) return 0;
  const info = cabecerasPublicador22_(hoja);
  const filas = hoja.getRange(2,1,hoja.getLastRow()-1,Math.max(hoja.getLastColumn(),1)).getDisplayValues();
  for (let i=0; i<filas.length; i++) {
    if (normalizarClavePublicador_(valorFilaPublicador22_(filas[i], info.mapa, 'caracter')) === normalizarClavePublicador_(caracter) &&
        normalizarClavePublicador_(valorFilaPublicador22_(filas[i], info.mapa, 'palabra')) === normalizarClavePublicador_(palabra)) return i+2;
  }
  return 0;
}

function validarRutaImagenLotePublicador22_(ruta) {
  ruta = normalizarRutaRepoPublicador22_(ruta);
  if (!ruta) return '';
  if (!/^img\//i.test(ruta)) throw new Error('En publicación por lote, las imágenes deben ser rutas existentes del repositorio que empiecen con img/.');
  return ruta;
}


function rutasImagenesLotePublicador22_(fila, comprobarRutaLote) {
  fila = fila || {};
  const crudos = [];
  if (fila.imagenes) {
    String(fila.imagenes).split(/[,;\n\r]+/).forEach(function(x){ if (String(x||'').trim()) crudos.push(x); });
  }
  if (fila.imagen) crudos.unshift(fila.imagen);
  if (fila.imagen2) crudos.push(fila.imagen2);
  const salida = [];
  const vistos = {};
  crudos.forEach(function(valor) {
    if (salida.length >= 8) return;
    const ruta = validarRutaImagenLotePublicador22_(valor);
    if (!ruta) return;
    const comprobada = comprobarRutaLote(ruta);
    const clave = normalizarRutaRepoPublicador22_(comprobada);
    if (!clave || vistos[clave]) return;
    vistos[clave] = true;
    salida.push(comprobada);
  });
  return salida;
}

function publicarLotePublicadorLSPedia(datos) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('El Publicador está ocupado. Intenta nuevamente.');
  try {
  authControlPublicador22_(datos);
  const filas = Array.isArray(datos && datos.filas) ? datos.filas : [];
  if (!filas.length) throw new Error('No hay filas para importar.');
  if (filas.length > 150) throw new Error('Por seguridad, procesa como máximo 150 filas por lote.');

  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const hojaDic = ss.getSheetByName(c.hojaDiccionario);
  const hojaVoc = ss.getSheetByName(c.hojaVocabulario);
  const hojaEje = ss.getSheetByName(c.hojaEjemplos);
  prepararFechaPublicacionPublicador_(hojaDic);
  prepararFechaPublicacionPublicador_(hojaVoc);
  asegurarEncabezadoPublicador_(hojaDic, 'ingles');
  asegurarEncabezadoPublicador_(hojaDic, 'definicionIngles');
  asegurarEncabezadoPublicador_(hojaDic, 'etiquetas');
  asegurarEncabezadoPublicador_(hojaDic, 'publicarSinImagen');
  asegurarEncabezadoPublicador_(hojaVoc, 'etiquetas');
  const categoriasDic = obtenerValoresUnicosPublicador_(hojaDic,'categoria');
  const categoriasVoc = obtenerValoresUnicosPublicador_(hojaVoc,'categoria');
  const rutasExistentes = {};
  [c.carpetaDiccionario, c.carpetaVocabulario, c.carpetaEjemplos].forEach(function(carpeta) {
    listarArchivosGitHubCarpetaPublicador22_(carpeta).forEach(function(item) {
      rutasExistentes[normalizarRutaRepoPublicador22_(item.ruta)] = true;
    });
  });
  function comprobarRutaLote(ruta) {
    if (ruta && !rutasExistentes[ruta]) throw new Error('No existe en GitHub la imagen: ' + ruta);
    return ruta;
  }
  const resumen = { creados:0, actualizados:0, borradores:0, sinVideoQuiz:0, errores:[], tipos:{} };
  const afectados = { diccionario:false, vocabulario:false, ejemplos:false };

  filas.forEach(function(origenFila, indice) {
    try {
      const fila = origenFila || {};
      const tipo = normalizarClavePublicador_(fila.tipo || datos.tipoDefecto || 'diccionario');
      const palabra = limpiarTextoPublicador_(fila.palabra);
      if (!palabra) throw new Error('Falta palabra.');
      if (!resumen.tipos[tipo]) resumen.tipos[tipo] = 0;
      resumen.tipos[tipo]++;

      if (tipo === 'diccionario') {
        const categoria = limpiarTextoPublicador_(fila.categoria);
        if (!categoria) throw new Error('Falta categoría.');
        const real = categoriasDic.find(function(x){return normalizarClavePublicador_(x)===normalizarClavePublicador_(categoria);});
        if (!real) throw new Error('La categoría "' + categoria + '" no existe en Diccionario.');
        const definicion = String(fila.definicion || '').trim();
        const imagenesLote = rutasImagenesLotePublicador22_(fila, comprobarRutaLote);
        const video = fila.video ? extraerYoutubeIdPublicador_(fila.video) : '';
        if (fila.video && !video) throw new Error('Video de YouTube inválido.');
        const existente = buscarFilaExistentePublicador_(hojaDic,palabra,real);
        const antes = existente ? snapshotFilaPublicador_(hojaDic,existente) : null;
        const imagenAnterior = existente ? obtenerValorFilaPublicador_(hojaDic, existente, 'imagen') : '';
        const videoAnterior = existente ? obtenerValorFilaPublicador_(hojaDic, existente, 'video') : '';
        const fechaAnterior = existente ? obtenerValorFilaPublicador_(hojaDic, existente, 'fechaPublicacion') : '';
        const imagenFinal = imagenesLote.length ? imagenesLote.join(', ') : imagenAnterior;
        const videoFinal = video || videoAnterior;
        const etiquetas = normalizarEtiquetasTaxonomiaPublicador23_(fila.etiquetas);
        const publicarSinImagen = !!definicion && esSiPublicador_(fila.publicarSinImagen) ? 'SI' : '';
        const valores = {
          palabra:palabra, variantes:limpiarTextoPublicador_(fila.variantes), definicion:definicion,
          categoria:real, etiquetas:etiquetas.join(', '),
          video:videoFinal, imagen:imagenFinal, publicarSinImagen:publicarSinImagen, senaSugerida:'',
          ingles:limpiarTextoPublicador_(fila.ingles), definicionIngles:String(fila.definicionIngles || '').trim()
        };
        if (videoFinal && !fechaAnterior) valores.fechaPublicacion = new Date();
        let numero;
        if (existente) { actualizarFilaPublicador_(hojaDic,existente,valores); numero=existente; resumen.actualizados++; }
        else { numero=escribirFilaPublicador_(hojaDic,valores); resumen.creados++; }
        if (!(imagenFinal || (definicion && publicarSinImagen === 'SI'))) resumen.borradores++;
        registrarHistorialPublicador_(existente?'actualizar':'crear','diccionario',hojaDic,numero,palabra,antes,snapshotFilaPublicador_(hojaDic,numero));
        afectados.diccionario = true;
      } else if (tipo === 'vocabulario') {
        const categoria = limpiarTextoPublicador_(fila.categoria);
        if (!categoria) throw new Error('Falta categoría.');
        const real = categoriasVoc.find(function(x){return normalizarClavePublicador_(x)===normalizarClavePublicador_(categoria);});
        if (!real) throw new Error('La categoría "' + categoria + '" no existe en Vocabulario.');
        const nivel = limpiarTextoPublicador_(fila.nivel);
        if (!nivel) throw new Error('Falta nivel.');
        const imagenesLote = rutasImagenesLotePublicador22_(fila, comprobarRutaLote);
        const video = fila.video ? extraerYoutubeIdPublicador_(fila.video) : '';
        if (fila.video && !video) throw new Error('Video de YouTube inválido.');
        const existente = buscarFilaExistentePublicador_(hojaVoc,palabra,real);
        const antes = existente ? snapshotFilaPublicador_(hojaVoc,existente) : null;
        const imagenAnterior = existente ? obtenerValorFilaPublicador_(hojaVoc, existente, 'imagen') : '';
        const videoAnterior = existente ? obtenerValorFilaPublicador_(hojaVoc, existente, 'video') : '';
        const fechaAnterior = existente ? obtenerValorFilaPublicador_(hojaVoc, existente, 'fechaPublicacion') : '';
        const imagenFinal = imagenesLote.length ? imagenesLote.join(', ') : imagenAnterior;
        const videoFinal = video || videoAnterior;
        const etiquetas = normalizarEtiquetasTaxonomiaPublicador23_(fila.etiquetas);
        const valores = {
          palabra:palabra, variantes:limpiarTextoPublicador_(fila.variantes),
          definicion:String(fila.definicion||'').trim(), categoria:real, etiquetas:etiquetas.join(', '),
          nivel:nivel, video:videoFinal, imagen:imagenFinal
        };
        if (videoFinal && !fechaAnterior) valores.fechaPublicacion = new Date();
        let numero;
        if (existente) { actualizarFilaPublicador_(hojaVoc,existente,valores); numero=existente; resumen.actualizados++; }
        else { numero=escribirFilaPublicador_(hojaVoc,valores); resumen.creados++; }
        if (!imagenFinal) resumen.borradores++;
        if (!videoFinal) resumen.sinVideoQuiz++;
        registrarHistorialPublicador_(existente?'actualizar':'crear','vocabulario',hojaVoc,numero,palabra,antes,snapshotFilaPublicador_(hojaVoc,numero));
        afectados.vocabulario = true;
      } else if (tipo === 'alfabetizacion' || tipo === 'ejemplos') {
        const caracter = limpiarTextoPublicador_(fila.caracter).toUpperCase();
        const nivel = limpiarTextoPublicador_(fila.nivel);
        const imagen = comprobarRutaLote(validarRutaImagenLotePublicador22_(fila.imagen));
        if (!caracter) throw new Error('Falta letra/caracter.');
        if (!nivel) throw new Error('Falta nivel.');
        const existente = buscarFilaEjemploPublicador22_(hojaEje,caracter,palabra);
        const antes = existente ? snapshotFilaPublicador_(hojaEje,existente) : null;
        const imagenAnterior = existente ? obtenerValorFilaPublicador_(hojaEje, existente, 'imagen') : '';
        const imagenFinal = imagen || imagenAnterior;
        let orden = Number(fila.orden || 0);
        if (!Number.isInteger(orden) || orden < 1) orden = existente ? Number(obtenerValorFilaPublicador_(hojaEje, existente, 'orden') || 0) : siguienteOrdenCaracterPublicador_(hojaEje,caracter);
        if (!Number.isInteger(orden) || orden < 1) orden = siguienteOrdenCaracterPublicador_(hojaEje,caracter);
        const valores = { caracter:caracter, palabra:palabra, imagen:imagenFinal, orden:orden, nivel:nivel };
        let numero;
        if (existente) { actualizarFilaPublicador_(hojaEje,existente,valores); numero=existente; resumen.actualizados++; }
        else { numero=escribirFilaPublicador_(hojaEje,valores); resumen.creados++; }
        if (!imagenFinal) resumen.borradores++;
        registrarHistorialPublicador_(existente?'actualizar':'crear','ejemplos',hojaEje,numero,palabra,antes,snapshotFilaPublicador_(hojaEje,numero));
        afectados.ejemplos = true;
      } else {
        throw new Error('Tipo no permitido: ' + tipo);
      }
    } catch (error) {
      resumen.errores.push({ fila:indice+1, mensaje:error.message || String(error) });
    }
  });

  SpreadsheetApp.flush();
  if (afectados.vocabulario) asegurarIdsQuizVocabulario_(hojaVoc);
  const sincronizaciones = [];
  if (afectados.diccionario) sincronizaciones.push(sincronizarDiccionarioJsonSinLockPublicador_());
  if (afectados.vocabulario) sincronizaciones.push(sincronizarVocabularioJsonSinLockPublicador_());
  if (afectados.ejemplos) sincronizaciones.push(sincronizarAlfabetizacionJsonSinLockPublicador_());
  resumen.sincronizaciones = sincronizaciones;
  resumen.ok = resumen.errores.length === 0;
  return resumen;

  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
   PUBLICADOR 22.1 — PENDIENTES RÁPIDOS
   Lee el Diccionario una sola vez y no consulta GitHub.
   Evita el recorrido lento anterior cuando existen miles de filas.
   ============================================================ */
function obtenerPendientesPublicadorRapido22(datos) {
  authControlPublicador22_(datos || {});
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const salida = {
    totales:{ pendientes:0, diccionario:0, vocabulario:0, ejemplos:0, alfabeto:0 },
    secciones:{
      diccionario:{pendientes:[]}, vocabulario:{pendientes:[]},
      ejemplos:{pendientes:[]}, alfabeto:{pendientes:[]}
    },
    generadoEn:new Date().toISOString()
  };
  function agregar(origen,item){
    item=item||{}; item.origen=origen;
    salida.secciones[origen].pendientes.push(item);
    salida.totales[origen]++; salida.totales.pendientes++;
  }
  function leerPalabras(hoja,origen){
    if(!hoja||hoja.getLastRow()<2)return;
    const info=cabecerasPublicador22_(hoja), filas=hoja.getRange(2,1,hoja.getLastRow()-1,Math.max(hoja.getLastColumn(),1)).getDisplayValues();
    filas.forEach(function(fila,indice){
      const palabra=valorFilaPublicador22_(fila,info.mapa,'palabra'); if(!palabra)return;
      const categoria=valorFilaPublicador22_(fila,info.mapa,'categoria');
      const definicion=valorFilaPublicador22_(fila,info.mapa,'definicion');
      const imagen=separarRutasPublicador22_(valorFilaPublicador22_(fila,info.mapa,'imagen')).length>0;
      const video=!!valorFilaPublicador22_(fila,info.mapa,'video');
      const aprobado=esSiPublicador_(valorFilaPublicador22_(fila,info.mapa,'publicarsinimagen'));
      const faltantes=[];
      let publicado=false;
      let nota='';
      if(origen==='vocabulario'){
        // Vocabulario solo evalúa imagen + video. El concepto no es requisito.
        if(!imagen)faltantes.push('imagen');
        if(!video)faltantes.push('video');
        if(!faltantes.length)return;
        publicado=imagen;
        if(publicado&&!video)nota='Publicada con imagen; falta video';
        else if(!publicado&&video)nota='Video listo; falta imagen para publicarse';
        else if(!publicado)nota='Faltan imagen y video';
      }else{
        if(!imagen)faltantes.push('imagen');
        if(!definicion)faltantes.push('concepto');
        if(!video)faltantes.push('video');
        if(!faltantes.length)return;
        publicado=imagen || (!!definicion && aprobado);
        if(publicado&&!imagen&&definicion)nota='Publicada solo con concepto';
        else if(!publicado&&definicion&&!imagen)nota='Concepto listo: falta decidir si publicar sin imagen';
        else if(!publicado&&!imagen&&!definicion)nota='Sin imagen ni concepto: no se publica todavía';
      }
      agregar(origen,{fila:indice+2,palabra:palabra,categoria:categoria,faltantes:faltantes,publicado:publicado,nota:nota});
    });
  }
  leerPalabras(ss.getSheetByName(c.hojaDiccionario),'diccionario');
  leerPalabras(ss.getSheetByName(c.hojaVocabulario),'vocabulario');

  const ejemplos=ss.getSheetByName(c.hojaEjemplos);
  if(ejemplos&&ejemplos.getLastRow()>=2){
    const info=cabecerasPublicador22_(ejemplos), filas=ejemplos.getRange(2,1,ejemplos.getLastRow()-1,Math.max(ejemplos.getLastColumn(),1)).getDisplayValues();
    filas.forEach(function(fila,indice){
      const palabra=valorFilaPublicador22_(fila,info.mapa,'palabra'); if(!palabra)return;
      const caracter=valorFilaPublicador22_(fila,info.mapa,'caracter');
      const imagen=!!valorFilaPublicador22_(fila,info.mapa,'imagen');
      const nivel=valorFilaPublicador22_(fila,info.mapa,'nivel');
      const faltantes=[]; if(!caracter)faltantes.push('letra'); if(!imagen)faltantes.push('imagen'); if(!nivel)faltantes.push('nivel');
      if(faltantes.length)agregar('ejemplos',{fila:indice+2,palabra:palabra,caracter:caracter,faltantes:faltantes,publicado:!!(caracter&&imagen),nota:imagen?'Publicado; faltan datos complementarios':'Falta imagen del ejemplo'});
    });
  }

  const alf=ss.getSheetByName(c.hojaAlfabetizacion);
  (obtenerContenidosAlfabetizacionPublicador_(alf)||[]).forEach(function(item){
    if(!item.faltantes||!item.faltantes.length)return;
    agregar('alfabeto',{fila:item.fila,palabra:(item.nombre||item.caracter),caracter:item.caracter,tipo:item.tipo,faltantes:item.faltantes,publicado:true,nota:(item.tipo==='numero'?'Número':'Letra')+' con recursos por completar'});
  });

  Object.keys(salida.secciones).forEach(function(k){salida.secciones[k].pendientes.sort(function(a,b){return String(a.palabra||'').localeCompare(String(b.palabra||''),'es',{sensitivity:'base',numeric:true});});});
  return salida;
}


/* ============================================================
   PUBLICADOR WEB — CONFIGURACIÓN EDITABLE DEL SITIO
   Guarda contenido general en data/web-config.json y medios en
   img/web-admin/ o video/web-admin/. La web mantiene sus valores HTML
   actuales como respaldo si este archivo no existe o tiene un error.
   ============================================================ */
function configWebPublicadorPorDefecto_() {
  return {
    version: 2,
    actualizadoEn: '',
    header: {
      logo: 'video/lspedia_transparente.webm',
      logoOscuro: '',
      logoEscala: 100,
      orden: ['diccionario','vocabulario','herramientas','nosotros'],
      menu: {
        diccionario: { texto:'Diccionario', icono:'img/icons/nav/icono-diccionario.webp', visible:true },
        vocabulario: { texto:'Vocabulario', icono:'img/icons/nav/icono-vocabulario.webp', visible:true },
        herramientas: { texto:'Herramientas', icono:'img/icons/nav/icono-herramientas.webp', visible:true },
        nosotros: { texto:'Sobre Nosotros', icono:'img/icons/nav/icono-nosotros.png', visible:true }
      }
    },
    heroes: {
      diccionario: {
        titulo:'Diccionario visual de español con apoyo en Lengua de Señas Peruana (LSP)',
        subtitulo:'Diccionario visual de español con apoyo en Lengua de Señas Peruana.\nSu función es facilitar la comprensión de palabras y significados.\nNo es un curso, ni enseñamos LSP.',
        estilo:{ fuente:'inherit', emoji:'', tituloColor:'#17233c', acentoColor:'#2d7df6', subtituloColor:'#425466', negrita:['Diccionario visual de español'] },
        avatar:'img/avatar_lupa.webm',
        buscadorPlaceholder:'Buscar palabra y significado',
        categoriasIniciales:10,
        sugerenciasLabel:'⭐ Palabras sugeridas',
        // Se mantiene vacío: la portada sortea sugerencias desde App.datos.
        sugerencias:[],
        mostrarSugerencias:true,
        mostrarSenalDia:true,
        mostrarProgreso:true,
        mostrarEstadisticas:true
      },
      vocabulario: {
        titulo:'Vocabulario de Lengua de Señas Peruana (LSP)',
        subtitulo:'Las palabras en español sirven como referencia para facilitar las búsquedas.\nLas señas representan conceptos, no solo palabras.\nLas variantes regionales enriquecen la Lengua de señas.\nEl aprendizaje también requiere contacto con personas sordas.',
        estilo:{ fuente:'inherit', emoji:'', tituloColor:'#17233c', acentoColor:'#2d7df6', subtituloColor:'#425466', negrita:['referencia','conceptos','variantes regionales'] },
        avatar:'img/avatar_lupa.webm',
        buscadorPlaceholder:'Buscar palabra del vocabulario',
        categoriasIniciales:10,
        categoriasOrden:[],
        categoriasOcultas:[]
      }
    },
    contacto: { correo:'proyectolspedia@gmail.com', whatsapp:'51928789623' },
    footer: { copyright:'© 2026 LSPedia — Nilton F. G. Todos los derechos reservados.', legalTexto:'Legal y privacidad', anioAutomatico:true },
    social: {
      tiktok:'https://www.tiktok.com/@lspedia',
      instagram:'https://www.instagram.com/lspedia_sign',
      youtube:'https://www.youtube.com/@LSPedia-sign',
      facebook:'https://www.facebook.com/lspedia.sign',
      orden:['tiktok','instagram','youtube','facebook'],
      visible:{tiktok:true,instagram:true,youtube:true,facebook:true}
    },
    acciones: {
      sugerir:{ nombre:'Sugerir palabra', contenido:'¿Falta un término? Envíanos tu propuesta.', url:'', icono:'💡', visible:true, nuevaPestana:true },
      idea:{ nombre:'Enviar una idea', contenido:'Comparte sugerencias para mejorar LSPedia.', url:'', icono:'💬', visible:true, nuevaPestana:true },
      apoyar:{ nombre:'Apoyar LSPedia', contenido:'Ayuda a mantener el proyecto gratuito y en crecimiento.', url:'', icono:'❤️', visible:true, nuevaPestana:true },
      interprete:{ nombre:'Contratar un intérprete', contenido:'Solicita servicios de interpretación en LSP.', url:'', icono:'🎤', visible:true, nuevaPestana:true }
    },
    aviso:{activo:false,tipo:'info',titulo:'',mensaje:'',estilo:{tituloNegrita:true,tituloCursiva:false,mensajeNegrita:false,mensajeCursiva:false},botonTexto:'Ver más',url:'',inicio:'',fin:'',frecuencia:'siempre'},
    novedades:{activo:false,titulo:'Lo nuevo en LSPedia',items:[]},
    herramientas:{
      alfabeto:{nombre:'Alfabeto y números',descripcion:'Mira, reconoce y practica letras y números',icono:'🔤',orden:1,activo:true},
      jugar:{nombre:'Jugar',descripcion:'Aprende tocando, ordenando y resolviendo',icono:'🎮',orden:2,activo:true},
      subtitulos:{nombre:'Subtítulos',descripcion:'Convierte la voz en texto en tiempo real',icono:'CC',orden:3,activo:true}
    },
    juegos:{
      adivina:{nombre:'Adivina qué soy',descripcion:'Mira las señas y mueve el celular',icono:'🎭',orden:1,etiqueta:'',activo:true},
      caras:{nombre:'Caras y gestos',descripcion:'Mira, expresa y adivina',icono:'😀',orden:2,etiqueta:'',activo:true},
      chat:{nombre:'Chat en Español',descripcion:'Conversa, escribe y mejora',icono:'💬',orden:3,etiqueta:'',activo:true},
      completar:{nombre:'Completar la palabra',descripcion:'Lleva la letra al espacio',icono:'🔤',orden:4,etiqueta:'',activo:true},
      unir:{nombre:'Unir con flechas',descripcion:'Arrastra y conecta',icono:'🔗',orden:5,etiqueta:'',activo:true},
      quiz:{nombre:'Quiz',descripcion:'Mira, piensa y elige',icono:'❓',orden:6,etiqueta:'',activo:true},
      matematicas:{nombre:'Matemáticas',descripcion:'Junta, quita, agrupa y reparte',icono:'➗',orden:7,etiqueta:'',activo:true},
      carrera:{nombre:'Carrera matemática',descripcion:'Corre, esquiva y resuelve',icono:'🏎️',orden:8,etiqueta:'',activo:true},
      oraciones:{nombre:'Oraciones',descripcion:'Ordena y escribe ideas',icono:'📝',orden:9,etiqueta:'',activo:true}
    },
    seo:{
      titulo:'LSPedia - Diccionario visual de español con apoyo en Lengua de Señas Peruana',
      descripcion:'Diccionario visual gratuito para aprender y comprender palabras en español con apoyo de videos en Lengua de Señas Peruana (LSP).',
      sitio:'LSPedia',
      imagenCompartir:'https://lspedia.site/img/lspedia.png'
    },
    pwa:{activo:true,titulo:'Instalar LSPedia',subtitulo:'Usar como app',ayuda:'Si no aparece la ventana de instalación, abre el menú del navegador y elige Instalar aplicación o Agregar a pantalla de inicio.'},
    mantenimiento:{modo:'normal',titulo:'Estamos mejorando LSPedia',mensaje:'Estamos realizando mejoras. Vuelve a intentarlo en unos minutos.'},
    experimentos:{senasIA:{activo:true,etiqueta:'Beta'}},
    legal: {
      responsable:'Nilton L. F. G.',
      correo:'proyectolspedia@gmail.com',
      intro:'Información clara sobre el uso de LSPedia, el tratamiento de datos personales, los formularios, los servicios externos y la propiedad intelectual.',
      secciones:[
        {clave:'responsable',titulo:'👤 Responsable de LSPedia',contenido:'LSPedia es un proyecto independiente administrado por Nilton L. F. G. Esta información se aplica al sitio oficial lspedia.site y a los formularios gestionados por LSPedia.'},
        {clave:'datos',titulo:'🔐 Datos personales',contenido:'LSPedia procura recopilar únicamente los datos necesarios.\n\n- No vendemos datos personales.\n- Las respuestas no se publican automáticamente.\n- No envíes datos sensibles innecesarios.'},
        {clave:'formularios',titulo:'📝 Formularios de sugerencias',contenido:'Los formularios pueden recibir nombre, correo electrónico, tipo de propuesta y el contenido de la sugerencia. Se utilizan para revisar la propuesta, gestionar la comunicación y responder cuando corresponda. Las respuestas pueden almacenarse mediante Google Forms y Google Sheets.'},
        {clave:'conservacion',titulo:'🗂️ Conservación de la información',contenido:'Los datos se conservan solo durante el tiempo razonablemente necesario para gestionar la sugerencia y responder. Cuando dejan de ser necesarios, pueden eliminarse o anonimizarse. Como criterio interno, LSPedia procura revisar los datos identificativos dentro de los 12 meses posteriores a la última interacción.'},
        {clave:'arco',titulo:'✉️ Derechos sobre tus datos (ARCO)',contenido:'Puedes solicitar acceso, rectificación, cancelación u oposición respecto de tus datos personales escribiendo al correo de privacidad.'},
        {clave:'terceros',titulo:'🌐 Servicios externos',contenido:'LSPedia puede utilizar Google Forms, Google Sheets, YouTube, GitHub y otros proveedores técnicos. Cada proveedor puede aplicar sus propias condiciones y políticas.'},
        {clave:'cookies',titulo:'📊 Analítica y almacenamiento local',contenido:'LSPedia puede utilizar herramientas de medición como Google Analytics y almacenamiento local del dispositivo para mejorar la experiencia y conocer de forma estadística el uso del sitio.'},
        {clave:'menores',titulo:'🧒 Menores de edad',contenido:'LSPedia no necesita que un menor entregue datos personales innecesarios. Si eres menor y un formulario solicita información personal, pide ayuda a tu padre, madre o tutor cuando corresponda.'},
        {clave:'terminos',titulo:'📘 Términos de uso',contenido:'LSPedia ofrece contenido educativo e informativo. El uso del sitio debe ser lícito y respetuoso. No se permite intentar dañar, interferir o acceder sin autorización a los sistemas del proyecto.'},
        {clave:'licencia',titulo:'©️ Propiedad intelectual y licencia',contenido:'LSPedia, su diseño, código y materiales propios están protegidos por las normas aplicables de propiedad intelectual. El contenido de terceros conserva la titularidad y condiciones de sus respectivos autores o proveedores.'},
        {clave:'cambios',titulo:'🔄 Cambios en esta información',contenido:'Esta información puede actualizarse cuando cambien las funciones de LSPedia, sus formularios, los proveedores tecnológicos o las obligaciones aplicables.'}
      ]
    },
    nosotros: {
      titulo:'Sobre nosotros', visible:true,
      video:'https://youtu.be/4tQBIrxA5gQ',
      secciones: [
        { tiempo:0, titulo:'⚠️ Un punto importante', imagen:'', contenido:'' },
        { tiempo:85, titulo:'❓ ¿Qué es LSPedia?', imagen:'', contenido:'' },
        { tiempo:185, titulo:'🌱 Un proyecto que crece gracias a tu apoyo', imagen:'', contenido:'' },
        { tiempo:396, titulo:'💌 Tus ideas, opiniones, consejos o cualquier otra forma de ayudar y apoyar son muy bienvenidos', imagen:'', contenido:'' }
      ]
    }
  };
}

function mezclarConfigWebPublicador_(base, entrada) {
  if (!entrada || typeof entrada !== 'object') return base;
  Object.keys(entrada).forEach(function(clave) {
    if (clave === '__proto__' || clave === 'prototype' || clave === 'constructor') return;
    const valor = entrada[clave];
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      if (!base[clave] || typeof base[clave] !== 'object' || Array.isArray(base[clave])) base[clave] = {};
      mezclarConfigWebPublicador_(base[clave], valor);
    } else if (valor !== undefined && valor !== null) {
      base[clave] = valor;
    }
  });
  return base;
}

function textoWebPublicador_(valor, maximo) {
  const texto = String(valor == null ? '' : valor).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim();
  return texto.slice(0, Math.max(1, Number(maximo)||1000));
}

function normalizarColorWebPublicador_(valor, respaldo) {
  const t = String(valor == null ? '' : valor).trim();
  if (!t) return respaldo || '#17233c';
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t) ? t : (respaldo || '#17233c');
}

function enlaceWebPublicador_(valor, soloHttp) {
  const texto = textoWebPublicador_(valor, 1200);
  if (!texto) return '';
  if (/^(?:javascript|vbscript|data):/i.test(texto)) throw new Error('Hay un enlace no permitido en la configuración WEB.');
  if (/^https?:\/\//i.test(texto)) return texto;
  if (!soloHttp && (/^(?:mailto:|tel:|\/|#)/i.test(texto))) return texto;
  throw new Error('Usa un enlace https:// válido' + (soloHttp ? '.' : ', una ruta interna, mailto: o tel:.'));
}

function normalizarConfigWebPublicador_(entrada, anterior) {
  const cfg = mezclarConfigWebPublicador_(configWebPublicadorPorDefecto_(), anterior || {});
  entrada = entrada || {};
  const listaClaves = function(v, permitidas, maximo) {
    const out = [];
    (Array.isArray(v) ? v : []).forEach(function(x){
      const k = normalizarClavePublicador_(x);
      if (k && (!permitidas || permitidas.indexOf(k) !== -1) && out.indexOf(k) === -1 && out.length < (maximo || 30)) out.push(k);
    });
    return out;
  };
  const menuEntrada = entrada.header && entrada.header.menu || {};
  ['diccionario','vocabulario','herramientas','nosotros'].forEach(function(k){
    if (menuEntrada[k] && Object.prototype.hasOwnProperty.call(menuEntrada[k],'texto')) cfg.header.menu[k].texto = textoWebPublicador_(menuEntrada[k].texto, 70) || cfg.header.menu[k].texto;
    if (menuEntrada[k] && Object.prototype.hasOwnProperty.call(menuEntrada[k],'visible')) cfg.header.menu[k].visible = menuEntrada[k].visible !== false;
  });
  if (entrada.header) {
    if (Object.prototype.hasOwnProperty.call(entrada.header,'logoEscala')) cfg.header.logoEscala = Math.max(70, Math.min(130, Number(entrada.header.logoEscala)||100));
    if (Array.isArray(entrada.header.orden)) {
      const orden = listaClaves(entrada.header.orden,['diccionario','vocabulario','herramientas','nosotros'],4);
      if (orden.length) cfg.header.orden = orden;
    }
  }
  ['diccionario','vocabulario'].forEach(function(k){
    const h = entrada.heroes && entrada.heroes[k] || {};
    if (Object.prototype.hasOwnProperty.call(h,'titulo')) cfg.heroes[k].titulo = textoWebPublicador_(h.titulo, 220) || cfg.heroes[k].titulo;
    if (Object.prototype.hasOwnProperty.call(h,'subtitulo')) cfg.heroes[k].subtitulo = textoWebPublicador_(h.subtitulo, 2400);
    if (Object.prototype.hasOwnProperty.call(h,'buscadorPlaceholder')) cfg.heroes[k].buscadorPlaceholder = textoWebPublicador_(h.buscadorPlaceholder, 160);
    if (Object.prototype.hasOwnProperty.call(h,'categoriasIniciales')) cfg.heroes[k].categoriasIniciales = Math.max(4, Math.min(18, Number(h.categoriasIniciales)||10));
    const estiloEntrada = h.estilo || {};
    if (!cfg.heroes[k].estilo || typeof cfg.heroes[k].estilo !== 'object') cfg.heroes[k].estilo = {};
    if (Object.prototype.hasOwnProperty.call(estiloEntrada,'aplicar')) cfg.heroes[k].estilo.aplicar=estiloEntrada.aplicar===true;
    if (Object.prototype.hasOwnProperty.call(estiloEntrada,'fuente')) cfg.heroes[k].estilo.fuente = textoWebPublicador_(estiloEntrada.fuente, 80) || 'inherit';
    if (Object.prototype.hasOwnProperty.call(estiloEntrada,'emoji')) cfg.heroes[k].estilo.emoji = textoWebPublicador_(estiloEntrada.emoji, 30);
    if (Object.prototype.hasOwnProperty.call(estiloEntrada,'tituloColor')) cfg.heroes[k].estilo.tituloColor = normalizarColorWebPublicador_(estiloEntrada.tituloColor, cfg.heroes[k].estilo.tituloColor || '#17233c');
    if (Object.prototype.hasOwnProperty.call(estiloEntrada,'acentoColor')) cfg.heroes[k].estilo.acentoColor = normalizarColorWebPublicador_(estiloEntrada.acentoColor, cfg.heroes[k].estilo.acentoColor || '#2d7df6');
    if (Object.prototype.hasOwnProperty.call(estiloEntrada,'subtituloColor')) cfg.heroes[k].estilo.subtituloColor = normalizarColorWebPublicador_(estiloEntrada.subtituloColor, cfg.heroes[k].estilo.subtituloColor || '#425466');
    if (Array.isArray(estiloEntrada.negrita)) cfg.heroes[k].estilo.negrita = estiloEntrada.negrita.slice(0,12).map(function(x){ return textoWebPublicador_(x, 120); }).filter(Boolean);
  });
  const hd = entrada.heroes && entrada.heroes.diccionario || {};
  if (Object.prototype.hasOwnProperty.call(hd,'sugerenciasLabel')) cfg.heroes.diccionario.sugerenciasLabel = textoWebPublicador_(hd.sugerenciasLabel, 120);
  // Desde V28.4 no se aceptan listas fijas: evita que WEB anule el sorteo nativo del Diccionario.
  cfg.heroes.diccionario.sugerencias = [];
  ['mostrarSugerencias','mostrarSenalDia','mostrarProgreso','mostrarEstadisticas'].forEach(function(k){if(Object.prototype.hasOwnProperty.call(hd,k))cfg.heroes.diccionario[k]=hd[k]!==false;});
  const hv = entrada.heroes && entrada.heroes.vocabulario || {};
  if (Array.isArray(hv.categoriasOrden)) cfg.heroes.vocabulario.categoriasOrden = hv.categoriasOrden.slice(0,30).map(function(x){return textoWebPublicador_(x,100);}).filter(Boolean);
  if (Array.isArray(hv.categoriasOcultas)) cfg.heroes.vocabulario.categoriasOcultas = hv.categoriasOcultas.slice(0,30).map(function(x){return textoWebPublicador_(x,100);}).filter(Boolean);

  if (entrada.contacto) {
    if (Object.prototype.hasOwnProperty.call(entrada.contacto,'correo')) { const c=textoWebPublicador_(entrada.contacto.correo,240); if(c && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) throw new Error('El correo general no parece válido.'); cfg.contacto.correo=c; }
    if (Object.prototype.hasOwnProperty.call(entrada.contacto,'whatsapp')) cfg.contacto.whatsapp = textoWebPublicador_(entrada.contacto.whatsapp,40).replace(/\D/g,'');
  }
  if (entrada.footer) {
    if (Object.prototype.hasOwnProperty.call(entrada.footer,'copyright')) cfg.footer.copyright = textoWebPublicador_(entrada.footer.copyright,260);
    if (Object.prototype.hasOwnProperty.call(entrada.footer,'legalTexto')) cfg.footer.legalTexto = textoWebPublicador_(entrada.footer.legalTexto,80) || cfg.footer.legalTexto;
    if (Object.prototype.hasOwnProperty.call(entrada.footer,'anioAutomatico')) cfg.footer.anioAutomatico = entrada.footer.anioAutomatico !== false;
  }
  if (entrada.social) {
    ['tiktok','instagram','youtube','facebook'].forEach(function(k){ if (Object.prototype.hasOwnProperty.call(entrada.social,k)) cfg.social[k] = enlaceWebPublicador_(entrada.social[k], true); });
    if (Array.isArray(entrada.social.orden)) { const o=listaClaves(entrada.social.orden,['tiktok','instagram','youtube','facebook'],4); if(o.length)cfg.social.orden=o; }
    if (entrada.social.visible) ['tiktok','instagram','youtube','facebook'].forEach(function(k){if(Object.prototype.hasOwnProperty.call(entrada.social.visible,k))cfg.social.visible[k]=entrada.social.visible[k]!==false;});
  }
  if (entrada.acciones) {
    ['sugerir','idea','apoyar','interprete'].forEach(function(k){
      const a = entrada.acciones[k] || {};
      if (Object.prototype.hasOwnProperty.call(a,'nombre')) cfg.acciones[k].nombre = textoWebPublicador_(a.nombre, 100) || cfg.acciones[k].nombre;
      if (Object.prototype.hasOwnProperty.call(a,'contenido')) cfg.acciones[k].contenido = textoWebPublicador_(a.contenido, 900);
      if (Object.prototype.hasOwnProperty.call(a,'url')) cfg.acciones[k].url = enlaceWebPublicador_(a.url, false);
      if (Object.prototype.hasOwnProperty.call(a,'icono')) cfg.acciones[k].icono = textoWebPublicador_(a.icono,120);
      if (Object.prototype.hasOwnProperty.call(a,'visible')) cfg.acciones[k].visible = a.visible !== false;
      if (Object.prototype.hasOwnProperty.call(a,'nuevaPestana')) cfg.acciones[k].nuevaPestana = a.nuevaPestana !== false;
    });
  }
  if (entrada.aviso) {
    ['titulo','mensaje','botonTexto','inicio','fin','frecuencia'].forEach(function(k){if(Object.prototype.hasOwnProperty.call(entrada.aviso,k))cfg.aviso[k]=textoWebPublicador_(entrada.aviso[k],k==='mensaje'?1200:220);});
    if (Object.prototype.hasOwnProperty.call(entrada.aviso,'activo')) cfg.aviso.activo=entrada.aviso.activo===true;
    if (Object.prototype.hasOwnProperty.call(entrada.aviso,'tipo')) { const t=normalizarClavePublicador_(entrada.aviso.tipo); cfg.aviso.tipo=['info','nuevo','aviso'].indexOf(t)!==-1?t:'info'; }
    if (Object.prototype.hasOwnProperty.call(entrada.aviso,'url')) cfg.aviso.url=enlaceWebPublicador_(entrada.aviso.url,false);
    const estiloAviso = entrada.aviso.estilo || {};
    if (!cfg.aviso.estilo || typeof cfg.aviso.estilo !== 'object') cfg.aviso.estilo = {tituloNegrita:true,tituloCursiva:false,mensajeNegrita:false,mensajeCursiva:false};
    ['tituloNegrita','tituloCursiva','mensajeNegrita','mensajeCursiva'].forEach(function(k){ if(Object.prototype.hasOwnProperty.call(estiloAviso,k)) cfg.aviso.estilo[k]=estiloAviso[k]===true; });
  }
  if (entrada.novedades) {
    if (Object.prototype.hasOwnProperty.call(entrada.novedades,'activo')) cfg.novedades.activo=entrada.novedades.activo===true;
    if (Object.prototype.hasOwnProperty.call(entrada.novedades,'titulo')) cfg.novedades.titulo=textoWebPublicador_(entrada.novedades.titulo,160);
    if (Array.isArray(entrada.novedades.items)) cfg.novedades.items=entrada.novedades.items.slice(0,6).map(function(x){return{titulo:textoWebPublicador_(x&&x.titulo,150),texto:textoWebPublicador_(x&&x.texto,700),url:enlaceWebPublicador_(x&&x.url,false)};}).filter(function(x){return x.titulo||x.texto;});
  }
  if (entrada.herramientas) ['alfabeto','jugar','subtitulos'].forEach(function(k){const x=entrada.herramientas[k]||{};if(Object.prototype.hasOwnProperty.call(x,'nombre'))cfg.herramientas[k].nombre=textoWebPublicador_(x.nombre,100)||cfg.herramientas[k].nombre;if(Object.prototype.hasOwnProperty.call(x,'descripcion'))cfg.herramientas[k].descripcion=textoWebPublicador_(x.descripcion,240);if(Object.prototype.hasOwnProperty.call(x,'icono'))cfg.herramientas[k].icono=textoWebPublicador_(x.icono,400);if(Object.prototype.hasOwnProperty.call(x,'orden'))cfg.herramientas[k].orden=Math.max(1,Math.min(30,Number(x.orden)||cfg.herramientas[k].orden));if(Object.prototype.hasOwnProperty.call(x,'activo'))cfg.herramientas[k].activo=x.activo!==false;});
  if (entrada.juegos) Object.keys(cfg.juegos).forEach(function(k){const x=entrada.juegos[k]||{};if(Object.prototype.hasOwnProperty.call(x,'nombre'))cfg.juegos[k].nombre=textoWebPublicador_(x.nombre,120)||cfg.juegos[k].nombre;if(Object.prototype.hasOwnProperty.call(x,'descripcion'))cfg.juegos[k].descripcion=textoWebPublicador_(x.descripcion,260);if(Object.prototype.hasOwnProperty.call(x,'icono'))cfg.juegos[k].icono=textoWebPublicador_(x.icono,400);if(Object.prototype.hasOwnProperty.call(x,'orden'))cfg.juegos[k].orden=Math.max(1,Math.min(30,Number(x.orden)||cfg.juegos[k].orden));if(Object.prototype.hasOwnProperty.call(x,'etiqueta'))cfg.juegos[k].etiqueta=textoWebPublicador_(x.etiqueta,40);if(Object.prototype.hasOwnProperty.call(x,'activo'))cfg.juegos[k].activo=x.activo!==false;});
  if (entrada.seo) {
    if (Object.prototype.hasOwnProperty.call(entrada.seo,'titulo')) cfg.seo.titulo=textoWebPublicador_(entrada.seo.titulo,90)||cfg.seo.titulo;
    if (Object.prototype.hasOwnProperty.call(entrada.seo,'descripcion')) cfg.seo.descripcion=textoWebPublicador_(entrada.seo.descripcion,220)||cfg.seo.descripcion;
    if (Object.prototype.hasOwnProperty.call(entrada.seo,'sitio')) cfg.seo.sitio=textoWebPublicador_(entrada.seo.sitio,90)||cfg.seo.sitio;
  }
  if (entrada.pwa) { if(Object.prototype.hasOwnProperty.call(entrada.pwa,'activo'))cfg.pwa.activo=entrada.pwa.activo!==false; ['titulo','subtitulo','ayuda'].forEach(function(k){if(Object.prototype.hasOwnProperty.call(entrada.pwa,k))cfg.pwa[k]=textoWebPublicador_(entrada.pwa[k],k==='ayuda'?600:100);}); }
  if (entrada.mantenimiento) { const m=normalizarClavePublicador_(entrada.mantenimiento.modo); cfg.mantenimiento.modo=['normal','parcial','total'].indexOf(m)!==-1?m:'normal'; if(Object.prototype.hasOwnProperty.call(entrada.mantenimiento,'titulo'))cfg.mantenimiento.titulo=textoWebPublicador_(entrada.mantenimiento.titulo,180);if(Object.prototype.hasOwnProperty.call(entrada.mantenimiento,'mensaje'))cfg.mantenimiento.mensaje=textoWebPublicador_(entrada.mantenimiento.mensaje,1200); }
  if (entrada.experimentos && entrada.experimentos.senasIA) { const x=entrada.experimentos.senasIA; if(Object.prototype.hasOwnProperty.call(x,'activo'))cfg.experimentos.senasIA.activo=x.activo!==false;if(Object.prototype.hasOwnProperty.call(x,'etiqueta'))cfg.experimentos.senasIA.etiqueta=textoWebPublicador_(x.etiqueta,40); }
  if (entrada.legal) {
    if (Object.prototype.hasOwnProperty.call(entrada.legal,'responsable')) cfg.legal.responsable = textoWebPublicador_(entrada.legal.responsable, 180) || cfg.legal.responsable;
    if (Object.prototype.hasOwnProperty.call(entrada.legal,'correo')) { const correo = textoWebPublicador_(entrada.legal.correo, 240); if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error('El correo de privacidad no parece válido.'); cfg.legal.correo = correo || cfg.legal.correo; }
    if (Object.prototype.hasOwnProperty.call(entrada.legal,'intro')) cfg.legal.intro = textoWebPublicador_(entrada.legal.intro, 2500);
    if (Array.isArray(entrada.legal.secciones)) {
      const permitidas = ['responsable','datos','formularios','conservacion','arco','terceros','cookies','menores','terminos','licencia','cambios'];
      const porClave = {}; entrada.legal.secciones.forEach(function(s){ const clave = normalizarClavePublicador_(s && s.clave); if (permitidas.indexOf(clave) === -1) return; porClave[clave] = { clave:clave, titulo:textoWebPublicador_(s && s.titulo, 220), contenido:textoWebPublicador_(s && s.contenido, 16000) }; });
      cfg.legal.secciones = cfg.legal.secciones.map(function(def){ return porClave[def.clave] || def; });
    }
  }
  if (entrada.nosotros) {
    if (Object.prototype.hasOwnProperty.call(entrada.nosotros,'titulo')) cfg.nosotros.titulo=textoWebPublicador_(entrada.nosotros.titulo,160)||cfg.nosotros.titulo;
    if (Object.prototype.hasOwnProperty.call(entrada.nosotros,'visible')) cfg.nosotros.visible=entrada.nosotros.visible!==false;
    if (Object.prototype.hasOwnProperty.call(entrada.nosotros,'video')) cfg.nosotros.video = textoWebPublicador_(entrada.nosotros.video, 800);
    if (Array.isArray(entrada.nosotros.secciones)) cfg.nosotros.secciones = entrada.nosotros.secciones.slice(0,8).map(function(s){ const imagen=textoWebPublicador_(s && s.imagen,1200); if(/^(?:javascript|vbscript|data):/i.test(imagen)) throw new Error('Hay una imagen no permitida en Sobre nosotros.'); return { tiempo: Math.max(0, Math.round(Number(s && s.tiempo || 0))), titulo: textoWebPublicador_(s && s.titulo, 220), imagen:imagen, contenido: textoWebPublicador_(s && s.contenido, 12000) }; }).filter(function(s){ return s.titulo || s.contenido || s.imagen; });
  }
  if(Object.prototype.hasOwnProperty.call(entrada,'textoEnriquecido')) cfg.textoEnriquecido=normalizarTextoEnriquecidoWeb_(entrada.textoEnriquecido,cfg);
  cfg.version = 2;
  cfg.actualizadoEn = new Date().toISOString();
  return cfg;
}

function decodificarHtmlTextoPublicador_(valor) {
  return String(valor || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, function(_m, n) { return String.fromCharCode(Number(n) || 32); })
    .replace(/&#x([0-9a-f]+);/gi, function(_m, n) { return String.fromCharCode(parseInt(n, 16) || 32); });
}

function htmlNosotrosATextoPublicador_(html) {
  let salida = String(html || '');
  salida = salida
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/(?:p|ul|ol)>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ');
  salida = decodificarHtmlTextoPublicador_(salida)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return salida;
}

function obtenerSeccionesNosotrosActualesPublicador_() {
  try {
    const archivo = leerArchivoGitHubCrudoPublicador22_('index.html');
    if (!archivo || !archivo.contenido) return [];
    const html = Utilities.newBlob(
      Utilities.base64Decode(archivo.contenido),
      'text/html',
      'index.html'
    ).getDataAsString('UTF-8');
    const inicio = html.indexOf('id="nosotrosTextoBajoVideo"');
    if (inicio === -1) return [];
    let fin = html.indexOf('id="nosotrosApoyoRow"', inicio);
    if (fin === -1) fin = html.indexOf('</section>', inicio);
    if (fin === -1) fin = html.length;
    const segmento = html.slice(inicio, fin);
    const patron = /<h4\b[^>]*data-tiempo-nosotros="(\d+)"[^>]*>([\s\S]*?)<\/h4>/gi;
    const cabeceras = [];
    let m;
    while ((m = patron.exec(segmento))) {
      cabeceras.push({
        tiempo: Math.max(0, Number(m[1]) || 0),
        titulo: htmlNosotrosATextoPublicador_(m[2]),
        inicioContenido: patron.lastIndex,
        inicioCabecera: m.index
      });
    }
    return cabeceras.slice(0, 8).map(function(item, i) {
      const hasta = i + 1 < cabeceras.length ? cabeceras[i + 1].inicioCabecera : segmento.length;
      let cuerpo = segmento.slice(item.inicioContenido, hasta);
      const apertura = cuerpo.search(/<div\b[^>]*class="[^"]*nosotros-bloque-clicable[^"]*"[^>]*>/i);
      if (apertura !== -1) {
        cuerpo = cuerpo.slice(apertura);
        cuerpo = cuerpo.replace(/^<div\b[^>]*>/i, '');
        const ultimoCierre = cuerpo.lastIndexOf('</div>');
        if (ultimoCierre !== -1) cuerpo = cuerpo.slice(0, ultimoCierre);
      }
      return {
        tiempo: item.tiempo,
        titulo: item.titulo,
        contenido: htmlNosotrosATextoPublicador_(cuerpo)
      };
    }).filter(function(item) { return item.titulo || item.contenido; });
  } catch (error) {
    console.warn('[LSPedia] No se pudo importar el texto actual de Sobre Nosotros:', error);
    return [];
  }
}

function obtenerConfiguracionWebLSPedia(datos) {
  validarSesionEditorPublicador_(datos || {});
  const actual = leerJsonGitHubPublicador_('data/web-config.json');
  const base = configWebPublicadorPorDefecto_();
  if (!actual) {
    const seccionesActuales = obtenerSeccionesNosotrosActualesPublicador_();
    if (seccionesActuales.length) base.nosotros.secciones = seccionesActuales;
  }
  const config = actual && actual.datos
    ? mezclarConfigWebPublicador_(base, actual.datos)
    : base;
  return { ok:true, existe:!!actual, config:config };
}

function extensionArchivoWebPublicador_(nombre) {
  const m = String(nombre || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!m) return '';
  let ext = m[1];
  if (ext === 'jpeg') ext = 'jpg';
  return ['webp','png','jpg','webm','mp4'].indexOf(ext) !== -1 ? ext : '';
}

function prepararArchivoWebPublicador_(archivo, nombreBase) {
  if (!archivo || !archivo.dataUrl || !archivo.nombre) return null;
  const ext = extensionArchivoWebPublicador_(archivo.nombre);
  if (!ext) throw new Error('Para la WEB usa WEBP/PNG/JPG o video WEBM/MP4.');
  const dataUrlTexto = String(archivo.dataUrl || '');
  const mimeMatch = dataUrlTexto.match(/^data:([^;,]+);base64,/i);
  const mime = mimeMatch ? String(mimeMatch[1] || '').toLowerCase() : '';
  const permitidosMime = {
    webp:['image/webp'], png:['image/png'], jpg:['image/jpeg','image/jpg'],
    webm:['video/webm'], mp4:['video/mp4']
  };
  if (!mime || (permitidosMime[ext] || []).indexOf(mime) === -1) {
    throw new Error('El contenido del archivo WEB no coincide con su extensión.');
  }
  const indice = dataUrlTexto.indexOf(',');
  if (indice === -1) throw new Error('No se pudo leer el archivo WEB.');
  const base64 = dataUrlTexto.substring(indice + 1);
  if (base64.length > 14500000) throw new Error('El archivo WEB es demasiado grande. Usa un archivo de menos de 10 MB.');
  const esVideo = ext === 'webm' || ext === 'mp4';
  return {
    ruta:(esVideo ? 'video/web-admin/' : 'img/web-admin/') + slugPublicador_(nombreBase) + '.' + ext,
    base64:base64
  };
}


function leerTextoRuntimeWebPublicador28_(ruta) {
  const archivo = leerArchivoGitHubCrudoPublicador22_(ruta);
  if (!archivo || !archivo.contenido) return '';
  try {
    return Utilities.newBlob(
      Utilities.base64Decode(archivo.contenido),
      'text/plain',
      String(ruta || 'archivo.txt').split('/').pop()
    ).getDataAsString('UTF-8');
  } catch (_error) {
    return '';
  }
}

function auditarRuntimeWebPublicador28_() {
  const errores = [];
  const comprobaciones = [];
  const avanzado = leerTextoRuntimeWebPublicador28_('js/web-config-v27.js');
  const base = leerTextoRuntimeWebPublicador28_('js/web-config.js');

  if (!avanzado) {
    errores.push('No pude leer js/web-config-v27.js.');
    comprobaciones.push({ok:false,texto:'Módulo WEB avanzado disponible.'});
  } else {
    comprobaciones.push({ok:true,texto:'Módulo WEB avanzado disponible.'});
    const idempotente = avanzado.indexOf('let aplicando=false') !== -1 &&
      avanzado.indexOf('if(aplicando)return') !== -1;
    comprobaciones.push({ok:idempotente,texto:'Protección idempotente contra aplicaciones repetidas.'});
    if (!idempotente) errores.push('El módulo WEB avanzado no contiene la protección idempotente esperada.');

    // Regresión crítica aprendida del bloqueo de septiembre de 2026:
    // este módulo no debe observar todo el subárbol del DOM mientras él mismo lo modifica.
    const compacto = avanzado.replace(/\s+/g, '');
    const observadorGlobalPeligroso =
      /observe\(document\.documentElement,\{[^}]{0,500}childList:true[^}]{0,500}subtree:true/.test(compacto) ||
      /observe\(document\.body,\{[^}]{0,500}childList:true[^}]{0,500}subtree:true/.test(compacto);
    comprobaciones.push({ok:!observadorGlobalPeligroso,texto:'Sin observador global autorreactivo del DOM.'});
    if (observadorGlobalPeligroso) errores.push('Detecté un observador global del DOM que podría volver a bloquear LSPedia.');
  }

  if (!base) {
    errores.push('No pude leer js/web-config.js.');
    comprobaciones.push({ok:false,texto:'Módulo WEB base disponible.'});
  } else {
    comprobaciones.push({ok:true,texto:'Módulo WEB base disponible.'});
    const protegeDiseno = base.indexOf('agregarResaltado') !== -1 &&
      base.indexOf('function subDic') !== -1 &&
      base.indexOf('function subVoc') !== -1;
    comprobaciones.push({ok:protegeDiseno,texto:'Protección de negritas, colores y estructura enriquecida.'});
    if (!protegeDiseno) errores.push('El módulo WEB base no contiene la protección de estilos enriquecidos de Diccionario/Vocabulario.');
  }

  return {ok:errores.length===0, errores:errores, comprobaciones:comprobaciones};
}

function validarConfigWebCriticaPublicador28_(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('La configuración WEB no es válida.');
  if (!cfg.header || !cfg.heroes || !cfg.footer || !cfg.legal) throw new Error('La configuración WEB está incompleta.');
  if (!cfg.heroes.diccionario || !cfg.heroes.vocabulario) throw new Error('Faltan los bloques principales de Diccionario o Vocabulario.');
  if (!textoWebPublicador_(cfg.heroes.diccionario.titulo, 500)) throw new Error('El título del Diccionario no puede quedar vacío.');
  if (!textoWebPublicador_(cfg.heroes.vocabulario.titulo, 500)) throw new Error('El título de Vocabulario no puede quedar vacío.');
  if (!textoWebPublicador_(cfg.legal.responsable, 500)) throw new Error('Legal y privacidad necesita un responsable.');
  const correo = textoWebPublicador_(cfg.legal.correo, 300);
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error('Legal y privacidad necesita un correo válido.');

  const aviso = cfg.aviso || {};
  if (aviso.activo === true) {
    if (!textoWebPublicador_(aviso.titulo, 300) && !textoWebPublicador_(aviso.mensaje, 1500)) {
      throw new Error('El banner está activado, pero no tiene título ni mensaje.');
    }
    const inicio = textoWebPublicador_(aviso.inicio, 40);
    const fin = textoWebPublicador_(aviso.fin, 40);
    const patron = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (inicio && !patron.test(inicio)) throw new Error('La fecha de inicio del banner no tiene un formato válido.');
    if (fin && !patron.test(fin)) throw new Error('La fecha final del banner no tiene un formato válido.');
    if (inicio && fin && fin <= inicio) throw new Error('La fecha final del banner debe ser posterior a la fecha de inicio.');
  }

  const mantenimiento = cfg.mantenimiento || {};
  if (['normal','parcial','total'].indexOf(String(mantenimiento.modo || 'normal')) === -1) {
    throw new Error('El modo de mantenimiento no es válido.');
  }
  return true;
}

function guardarJsonWebSeguroPublicador28_(ruta, objeto, mensaje) {
  const texto = JSON.stringify(objeto, null, 2) + '\n';
  JSON.parse(texto); // verificación local antes de tocar GitHub
  const base64 = Utilities.base64Encode(Utilities.newBlob(texto, 'application/json', ruta.split('/').pop() || 'config.json').getBytes());
  subirArchivoGitHubPublicador_(ruta, base64, mensaje);
  const lectura = leerJsonGitHubPublicador_(ruta);
  if (!lectura || !lectura.datos) throw new Error('GitHub guardó el archivo, pero no pude releerlo: ' + ruta);
  return lectura.datos;
}

function revisionWebPublicador28_(cfg) {
  return textoWebPublicador_(cfg && cfg.actualizadoEn, 80);
}

function guardarConfiguracionWebLSPedia(datos) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('El Publicador está ocupado guardando otro cambio. Intenta nuevamente.');
  try {
    validarSesionEditorPublicador_(datos || {});
    const saludRuntime = auditarRuntimeWebPublicador28_();
    if (!saludRuntime.ok) {
      throw new Error('Por seguridad no guardé cambios WEB. ' + saludRuntime.errores.join(' '));
    }
    const actual = leerJsonGitHubPublicador_('data/web-config.json');
    const anterior = actual && actual.datos ? actual.datos : configWebPublicadorPorDefecto_();
    const revisionActual = revisionWebPublicador28_(anterior);
    const revisionBase = textoWebPublicador_(datos && datos.revisionBase, 80);
    if (revisionBase && revisionActual && revisionBase !== revisionActual) {
      throw new Error('La configuración WEB cambió desde que abriste el panel. Recarga WEB antes de guardar para no sobrescribir cambios más recientes.');
    }

    const cfg = normalizarConfigWebPublicador_(datos && datos.config || {}, anterior);
    validarConfigWebCriticaPublicador28_(cfg);
    const archivos = datos && datos.archivos || {};

    const mapa = [
      ['logo','logo',function(r){cfg.header.logo=r;}],
      ['logoOscuro','logo-oscuro',function(r){cfg.header.logoOscuro=r;}],
      ['herramientaAlfabeto','herramienta-alfabeto',function(r){cfg.herramientas.alfabeto.icono=r;}],
      ['herramientaJugar','herramienta-jugar',function(r){cfg.herramientas.jugar.icono=r;}],
      ['herramientaSubtitulos','herramienta-subtitulos',function(r){cfg.herramientas.subtitulos.icono=r;}],
      ['menuDiccionario','menu-diccionario',function(r){cfg.header.menu.diccionario.icono=r;}],
      ['menuVocabulario','menu-vocabulario',function(r){cfg.header.menu.vocabulario.icono=r;}],
      ['menuHerramientas','menu-herramientas',function(r){cfg.header.menu.herramientas.icono=r;}],
      ['menuNosotros','menu-nosotros',function(r){cfg.header.menu.nosotros.icono=r;}],
      ['avatarDiccionario','avatar-diccionario',function(r){cfg.heroes.diccionario.avatar=r;}],
      ['avatarVocabulario','avatar-vocabulario',function(r){cfg.heroes.vocabulario.avatar=r;}],
      ['seoImagen','seo-compartir',function(r){cfg.seo.imagenCompartir=r;}]
    ];
    const subidos = [];
    mapa.forEach(function(item){
      const preparado = prepararArchivoWebPublicador_(archivos[item[0]], item[1]);
      if (!preparado) return;
      subirArchivoGitHubPublicador_(preparado.ruta, preparado.base64, 'Actualizar recurso WEB: ' + item[1]);
      item[2](preparado.ruta);
      subidos.push(preparado.ruta);
    });
    Object.keys(cfg.juegos || {}).forEach(function(k){
      const preparado = prepararArchivoWebPublicador_(archivos['juego_' + k], 'juego-' + k);
      if (!preparado) return;
      subirArchivoGitHubPublicador_(preparado.ruta, preparado.base64, 'Actualizar icono de juego WEB: ' + k);
      cfg.juegos[k].icono = preparado.ruta;
      subidos.push(preparado.ruta);
    });

    // 1) Escribimos y releemos un archivo de preparación. La web pública NO lo consume.
    const staged = guardarJsonWebSeguroPublicador28_('data/web-config-next.json', cfg, 'Preparar configuración WEB antes de publicar');
    validarConfigWebCriticaPublicador28_(staged);
    if (revisionWebPublicador28_(staged) !== revisionWebPublicador28_(cfg)) {
      throw new Error('La verificación previa de la configuración WEB no coincidió. No se modificó la configuración activa.');
    }

    // 2) Conservamos dos niveles de respaldo antes de tocar la configuración activa.
    const backupAnterior = leerJsonGitHubPublicador_('data/web-config-backup.json');
    if (backupAnterior && backupAnterior.datos) {
      guardarJsonWebSeguroPublicador28_('data/web-config-backup-2.json', backupAnterior.datos, 'Rotar respaldo WEB anterior');
    }
    if (actual && actual.datos) {
      guardarJsonWebSeguroPublicador28_('data/web-config-backup.json', actual.datos, 'Respaldar configuración WEB activa');
    }

    // 3) Solo después de validar staging y respaldos reemplazamos el archivo activo.
    const guardada = guardarJsonWebSeguroPublicador28_('data/web-config.json', cfg, 'Actualizar configuración WEB de LSPedia');
    validarConfigWebCriticaPublicador28_(guardada);
    if (revisionWebPublicador28_(guardada) !== revisionWebPublicador28_(cfg)) {
      throw new Error('La configuración WEB fue escrita, pero la verificación final no coincide. Usa Restaurar versión anterior antes de continuar.');
    }

    return {
      ok:true,
      verificado:true,
      revision:revisionWebPublicador28_(guardada),
      config:guardada,
      archivosSubidos:subidos,
      mensaje:'Configuración WEB guardada y verificada correctamente.'
    };
  } finally {
    lock.releaseLock();
  }
}

function restaurarConfiguracionWebAnteriorLSPedia(datos) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('El Publicador está ocupado. Intenta nuevamente.');
  try {
    validarSesionEditorPublicador_(datos || {});
    const actual = leerJsonGitHubPublicador_('data/web-config.json');
    const respaldo = leerJsonGitHubPublicador_('data/web-config-backup.json');
    if (!respaldo || !respaldo.datos) throw new Error('Todavía no existe una versión WEB anterior para restaurar.');
    const restaurada = normalizarConfigWebPublicador_(respaldo.datos, configWebPublicadorPorDefecto_());
    validarConfigWebCriticaPublicador28_(restaurada);

    // Verifica la copia a restaurar antes de reemplazar la activa.
    const staged = guardarJsonWebSeguroPublicador28_('data/web-config-next.json', restaurada, 'Preparar restauración WEB');
    validarConfigWebCriticaPublicador28_(staged);

    if (actual && actual.datos) {
      const backup2 = leerJsonGitHubPublicador_('data/web-config-backup-2.json');
      if (backup2 && backup2.datos) guardarJsonWebSeguroPublicador28_('data/web-config-backup-3.json', backup2.datos, 'Rotar respaldo WEB 3');
      guardarJsonWebSeguroPublicador28_('data/web-config-backup-2.json', actual.datos, 'Guardar configuración WEB reemplazada');
    }
    const guardada = guardarJsonWebSeguroPublicador28_('data/web-config.json', restaurada, 'Restaurar configuración WEB anterior');
    validarConfigWebCriticaPublicador28_(guardada);
    return {ok:true, verificado:true, revision:revisionWebPublicador28_(guardada), config:guardada, mensaje:'Configuración WEB anterior restaurada y verificada.'};
  } finally {
    lock.releaseLock();
  }
}

function verificarSaludWebPublicador28(datos) {
  validarSesionEditorPublicador_(datos || {});
  const config = leerJsonGitHubPublicador_('data/web-config.json');
  const errores = [];
  const comprobaciones = [];

  if (!config || !config.datos) {
    errores.push('No pude leer data/web-config.json.');
    comprobaciones.push({ok:false,texto:'Configuración WEB activa disponible.'});
  } else {
    comprobaciones.push({ok:true,texto:'Configuración WEB activa disponible.'});
    try {
      validarConfigWebCriticaPublicador28_(config.datos);
      comprobaciones.push({ok:true,texto:'Configuración WEB supera la validación crítica.'});
    } catch (e) {
      errores.push(e.message || String(e));
      comprobaciones.push({ok:false,texto:'Configuración WEB supera la validación crítica.'});
    }
  }

  const runtime = auditarRuntimeWebPublicador28_();
  (runtime.errores || []).forEach(function(x){ errores.push(x); });
  (runtime.comprobaciones || []).forEach(function(x){ comprobaciones.push(x); });

  return {
    ok:errores.length===0,
    revision:config&&config.datos?revisionWebPublicador28_(config.datos):'',
    errores:errores,
    comprobaciones:comprobaciones,
    mensaje:errores.length
      ? 'La WEB necesita revisión. No guardes cambios WEB hasta corregir estos puntos.'
      : 'Configuración, módulos y protecciones WEB disponibles.'
  };
}


/* ============================================================
   PUBLICADOR 26 — DATOS BAJO DEMANDA + PENDIENTES PAGINADOS
   ============================================================ */
function obtenerDatosPublicadorLigero26() {
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const diccionario = ss.getSheetByName(c.hojaDiccionario);
  const vocabulario = ss.getSheetByName(c.hojaVocabulario);
  const ejemplos = ss.getSheetByName(c.hojaEjemplos);
  if (!diccionario || !vocabulario || !ejemplos) throw new Error('Faltan hojas necesarias para iniciar el Publicador.');

  prepararFechaPublicacionPublicador_(diccionario);
  prepararFechaPublicacionPublicador_(vocabulario);

  let niveles = obtenerValoresUnicosPublicador_(vocabulario, 'nivel');
  if (!niveles.length) niveles = ['Fácil','Medio','Difícil'];
  let nivelesEjemplos = obtenerValoresUnicosPublicador_(ejemplos, 'nivel');
  if (!nivelesEjemplos.length) nivelesEjemplos = ['Fácil','Medio','Difícil'];

  return {
    categoriasDiccionario: obtenerValoresUnicosPublicador_(diccionario, 'categoria'),
    categoriasVocabulario: asegurarCategoriasVocabularioPublicador_(obtenerValoresUnicosPublicador_(vocabulario, 'categoria')),
    nivelesVocabulario: niveles,
    nivelesEjemplos: nivelesEjemplos,
    rutasIconosCategorias: obtenerRutasIconosCategoriasPublicador_(),
    contenidosDiccionario: [], contenidosVocabulario: [], contenidosEjemplos: [], contenidosAlfabetizacion: [],
    cargaLigera: true
  };
}

function obtenerDatosEditorPublicador26(datos) {
  validarSesionEditorPublicador_(datos || {});
  const c = configPublicador_();
  const ss = obtenerSpreadsheetPublicador_();
  const diccionario = ss.getSheetByName(c.hojaDiccionario);
  const vocabulario = ss.getSheetByName(c.hojaVocabulario);
  const alfabetizacion = ss.getSheetByName(c.hojaAlfabetizacion);
  const ejemplos = ss.getSheetByName(c.hojaEjemplos);
  if (!diccionario || !vocabulario || !alfabetizacion || !ejemplos) throw new Error('No pude cargar las hojas de edición.');
  return {
    contenidosDiccionario: obtenerContenidosEditablesPublicador_(diccionario),
    contenidosVocabulario: obtenerContenidosEditablesPublicador_(vocabulario),
    contenidosEjemplos: obtenerContenidosEditablesEjemplosPublicador_(ejemplos),
    contenidosAlfabetizacion: obtenerContenidosAlfabetizacionPublicador_(alfabetizacion)
  };
}

function normalizarConsultaPendiente26_(valor) {
  return normalizarClavePublicador_(String(valor || '')).replace(/\s+/g, ' ').trim();
}

function obtenerPendientesPaginadosPublicador26(datos) {
  datos = datos || {};
  authControlPublicador22_(datos);
  const base = obtenerPendientesPublicadorRapido22(datos);
  const seccion = ['diccionario','vocabulario','ejemplos','alfabeto'].indexOf(String(datos.seccion || '').toLowerCase()) !== -1
    ? String(datos.seccion).toLowerCase() : 'todos';
  const consulta = normalizarConsultaPendiente26_(datos.consulta);
  const offset = Math.max(0, Number(datos.offset) || 0);
  const limit = Math.max(10, Math.min(100, Number(datos.limit) || 45));
  const claves = seccion === 'todos' ? ['diccionario','vocabulario','ejemplos','alfabeto'] : [seccion];
  let lista = [];
  claves.forEach(function(k) {
    const arr = base.secciones && base.secciones[k] && base.secciones[k].pendientes;
    if (Array.isArray(arr)) lista = lista.concat(arr);
  });
  if (consulta) {
    lista = lista.filter(function(item) {
      const texto = [item.palabra,item.caracter,item.categoria,(item.faltantes||[]).join(' '),item.origen,item.nota]
        .filter(Boolean).join(' ');
      return normalizarConsultaPendiente26_(texto).indexOf(consulta) !== -1;
    });
  }
  lista.sort(function(a,b) {
    const oa=String(a.origen||''), ob=String(b.origen||'');
    if (oa !== ob) return oa.localeCompare(ob);
    return String(a.palabra||a.caracter||'').localeCompare(String(b.palabra||b.caracter||''),'es',{sensitivity:'base',numeric:true});
  });
  return {
    ok:true,
    totales:base.totales || {},
    totalFiltrado:lista.length,
    offset:offset,
    limit:limit,
    items:lista.slice(offset, offset + limit),
    hayMas:offset + limit < lista.length,
    generadoEn:base.generadoEn
  };
}

// Fecha de nuevas publicaciones en Perú; conserva el motor de edición existente.
function lspFechaPublicacionNueva_(valor) {
  const texto = String(valor || '').trim() || Utilities.formatDate(new Date(), 'America/Lima', 'yyyy-MM-dd');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) throw new Error('La fecha de publicación no es válida.');
  const fecha = new Date(texto + 'T00:00:00-05:00');
  if (isNaN(fecha.getTime()) || Utilities.formatDate(fecha, 'America/Lima', 'yyyy-MM-dd') !== texto) throw new Error('La fecha de publicación no es válida.');
  return fecha;
}

// Guarda únicamente texto y marcas permitidas; el sitio nunca recibe HTML del editor.
function normalizarTextoEnriquecidoWeb_(entrada,cfg) {
  if(!entrada || typeof entrada!=='object' || Array.isArray(entrada))throw new Error('El formato WEB no es válido.');
  const keys=Object.keys(entrada);if(keys.length>120)throw new Error('Hay demasiados textos con formato.');
  const out={},fonts=['Poppins, sans-serif','Nunito, sans-serif','Arial, sans-serif','Georgia, serif'];
  function valor(key){
    const permitted=/^(?:header\.menu\.(?:diccionario|vocabulario|herramientas|nosotros)\.texto|heroes\.(?:diccionario|vocabulario)\.(?:titulo|subtitulo|sugerenciasLabel)|footer\.(?:copyright|legalTexto)|acciones\.(?:sugerir|idea|apoyar|interprete)\.(?:nombre|contenido)|herramientas\.(?:alfabeto|jugar|subtitulos)\.(?:nombre|descripcion)|nosotros\.titulo|nosotros\.secciones\.[0-7]\.(?:titulo|contenido)|aviso\.(?:titulo|mensaje|botonTexto)|novedades\.titulo|novedades\.items\.[0-5]\.(?:titulo|texto)|pwa\.(?:titulo|subtitulo|ayuda)|mantenimiento\.(?:titulo|mensaje)|legal\.intro|legal\.secciones\.(?:responsable|datos|formularios|conservacion|arco|terceros|cookies|menores|terminos|licencia|cambios)\.(?:titulo|contenido))$/;
    if(!permitted.test(key)&&!/^juegos\.(?:adivina|caras|chat|completar|unir|quiz|matematicas|carrera|oraciones)\.(?:nombre|descripcion|etiqueta)$/.test(key))throw new Error('Campo de formato no permitido: '+key);
    const path=key.split('.');if(path[0]==='legal'&&path[1]==='secciones'){const sec=cfg.legal.secciones.find(s=>s.clave===path[2]);return sec&&sec[path[3]];}
    return path.reduce((v,k)=>v&&Object.prototype.hasOwnProperty.call(v,k)?v[k]:undefined,cfg);
  }
  keys.forEach(key=>{
    const d=entrada[key],text=valor(key);if(typeof text!=='string')return;
    if(!d||typeof d.texto!=='string'||d.texto!==text||!Array.isArray(d.fragmentos)||d.fragmentos.length>1000)throw new Error('El texto y su formato no coinciden: '+key+'. Recarga WEB antes de guardar.');
    const parts=d.fragmentos.map(p=>{if(!p||typeof p.texto!=='string'||p.texto.length>16000)throw new Error('Fragmento de texto inválido.');const r={texto:p.texto};['negrita','cursiva','subrayado'].forEach(k=>{if(typeof p[k]==='boolean')r[k]=p[k];});if(p.color){if(!/^#[0-9a-f]{6}$/i.test(p.color))throw new Error('Color de texto inválido.');r.color=p.color;}if(p.fuente){if(fonts.indexOf(p.fuente)===-1)throw new Error('Fuente de texto inválida.');r.fuente=p.fuente;}return r;});
    if(parts.map(p=>p.texto).join('')!==text)throw new Error('El formato no cubre todo el texto.');
    const r={texto:text,fragmentos:parts};[['interlineado',1,3],['espacioLetras',0,5],['espacioPalabras',0,12],['espacioBloque',0,48]].forEach(spec=>{const k=spec[0];if(Object.prototype.hasOwnProperty.call(d,k)){const n=Number(d[k]);if(!Number.isFinite(n)||n<spec[1]||n>spec[2])throw new Error('Espaciado fuera de rango.');r[k]=n;}});if(d.alineacion){if(['left','center','right','justify'].indexOf(d.alineacion)===-1)throw new Error('Alineación inválida.');r.alineacion=d.alineacion;}out[key]=r;
  });
  if(JSON.stringify(out).length>450000)throw new Error('El formato WEB supera el tamaño permitido.');
  return out;
}

/** Compara los datos de GitHub con la respuesta del sitio público; no da por hecho el despliegue. */
function verificarEstadoPublicacion30(datos) {
  authControlPublicador22_(datos);
  const rutas={diccionario:'data/palabras.json',vocabulario:'data/vocabulario.json',alfabetizacion:'data/alfabetizacion.json',ejemplos:'data/alfabetizacion.json',web:'data/web-config.json'};
  const ruta=rutas[datos.tipo];if(!ruta)throw new Error('Sección sin comprobación pública.');
  const lectura=leerJsonGitHubPublicador_(ruta);if(!lectura || !lectura.datos)return {sincronizado:false,visible:false,mensaje:'No se encontró el archivo sincronizado. El contenido guardado se conserva.'};
  if(datos.tipo==='web' && String(lectura.datos.actualizadoEn||'')!==String(datos.revision||''))return {sincronizado:false,visible:false,mensaje:'La revisión cambió después del guardado. Actualiza la configuración WEB antes de editarla.'};
  if(datos.tipo!=='web'){
    const c=configPublicador_(),ss=obtenerSpreadsheetPublicador_();let generada;
    if(datos.tipo==='diccionario')generada=construirDiccionarioJsonPublicador_(ss.getSheetByName(c.hojaDiccionario),lectura.datos).registros;
    else if(datos.tipo==='vocabulario')generada=construirVocabularioJsonPublicador_(ss.getSheetByName(c.hojaVocabulario)).registros;
    else generada=construirAlfabetizacionJsonPublicador_(ss.getSheetByName(c.hojaAlfabetizacion),ss.getSheetByName(c.hojaEjemplos)).documento.ejemplos;
    const esperado=buscarRegistroJsonPublicador22_(generada,datos.palabra,datos.categoria);
    if(!esperado)return {sincronizado:true,visible:false,pendiente:true,mensaje:'La ficha está guardada, pero todavía no cumple las condiciones para entrar en el catálogo público. Completa sus recursos.'};
    const registro=datos.tipo==='alfabetizacion'||datos.tipo==='ejemplos'?buscarRegistroJsonPublicador22_(lectura.datos.ejemplos,datos.palabra,datos.categoria):buscarRegistroJsonPublicador22_(lectura.datos,datos.palabra,datos.categoria);
    if(registro&&canonicoPanel30_(registro)!==canonicoPanel30_(esperado))return {sincronizado:false,visible:false,mensaje:'La ficha guardada en Sheets y la versión de GitHub todavía son diferentes. Sincroniza antes de comprobar la web.'};
    if(!registro)return {sincronizado:datos.publicada===false,visible:false,pendiente:datos.publicada===false,mensaje:datos.publicada===false?'Guardado como pendiente. Completa los recursos requeridos para publicarlo.':'El registro aún no se encontró en los datos de GitHub. Revisa la sincronización.'};
  }
  let respuesta;try{respuesta=UrlFetchApp.fetch('https://lspedia.site/'+ruta+'?verificacion='+Date.now(),{muteHttpExceptions:true,followRedirects:false});if(respuesta.getResponseCode()!==200)throw new Error('Respuesta pública '+respuesta.getResponseCode());}catch(e){return {sincronizado:true,visible:false,mensaje:'Datos encontrados en GitHub. No fue posible comprobar la respuesta del sitio; vuelve a comprobar en unos momentos.'};}
  let publica;try{publica=JSON.parse(respuesta.getContentText());}catch(_){return {sincronizado:true,visible:false,mensaje:'GitHub está actualizado, pero la respuesta pública todavía no contiene JSON válido.'};}
  const igual=canonicoPanel30_(lectura.datos)===canonicoPanel30_(publica);
  return {sincronizado:true,visible:igual,mensaje:igual?'La respuesta pública coincide con la versión de GitHub. Datos disponibles verificados; recarga LSPedia para verlos. Las fechas futuras y las reglas de cada sección siguen aplicándose.':'Guardado y sincronizado. El sitio público todavía devuelve otra versión; espera un momento y vuelve a comprobar.'};
}
function canonicoPanel30_(v){if(Array.isArray(v))return '['+v.map(canonicoPanel30_).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonicoPanel30_(v[k])).join(',')+'}';return JSON.stringify(v);}

function obtenerResumenInicio30(datos){const d=obtenerDashboardPublicadorLSPedia(datos);const p=obtenerPendientesPaginadosPublicador26(Object.assign({},datos,{seccion:"todos",consulta:"",offset:0,limit:1}));d.pendientes=Number((p.totales||{}).pendientes||0);return d;}


// Hora automática de la primera publicación; independiente de la fecha editorial.
function lspPrepararMomentoPublicacion_(hoja, numeroFila, valores) {
  const c = configPublicador_(), nombre = hoja.getName();
  if ([c.hojaDiccionario, c.hojaVocabulario, c.hojaEjemplos].indexOf(nombre) === -1) return;
  asegurarEncabezadoPublicador_(hoja, 'publicadoEn');
  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0];
  const anterior = {};
  if (numeroFila) {
    const fila = hoja.getRange(numeroFila, 1, 1, headers.length).getDisplayValues()[0];
    headers.forEach(function(k, i) { anterior[normalizarClavePublicador_(k)] = fila[i]; });
  }
  const siguiente = Object.assign({}, anterior);
  Object.keys(valores).forEach(function(k) { siguiente[normalizarClavePublicador_(k)] = valores[k]; });
  // Nunca aceptar ni reemplazar la hora desde un formulario de edición.
  Object.keys(valores).forEach(function(k) { if (normalizarClavePublicador_(k) === 'publicadoen') delete valores[k]; });
  function publicable(r) {
    if (!r.palabra) return false;
    const imagen = esImagenRealVocabularioJsonPublicador_(String(r.imagen || ''));
    if (nombre === c.hojaEjemplos) return !!r.caracter && imagen;
    if (!r.categoria || !extraerYoutubeIdPublicador_(String(r.video || ''))) return false;
    return nombre === c.hojaVocabulario ? imagen : imagen || (!!r.definicion && esSiPublicador_(r.publicarsinimagen));
  }
  if (!anterior.publicadoen && publicable(siguiente) && !publicable(anterior)) valores.publicadoEn = new Date().toISOString();
}

function lspMomentoPublicacionJson_(valor) {
  const s = String(valor || '').trim();
  // Rechazar fechas sin hora: no convertirlas en una hora inventada.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(s)) return '';
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : '';
}
