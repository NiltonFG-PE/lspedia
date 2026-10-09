/** LSPedia: extensión aditiva del Publicador. No añade rutas públicas doGet.
 * Fuente única: archivo privado Zona de miembros → Miembros. Secretos solo en Script Properties.
 * Instalar junto al Publicador actual e incluir PublicadorMiembrosUI en su plantilla.
 */
const LSP_MIEMBROS_HOJA = 'Miembros';
const LSP_MIEMBROS_SPREADSHEET_ID = '1QfWa69Jb2CXjU8ed8VLe1k80mIerP-Ic31j-6lbMhAU';
const LSP_MIEMBROS_CAMPOS = ['id','seccion','palabra','variantes','video','categoria','imagen','definicion','fechaPublicacion','estado'];

function lspMiembrosAuth_(datos) {
  const esperada = PropertiesService.getScriptProperties().getProperty('LSPEDIA_PUBLICADOR_MOVIL_KEY');
  // Se exige la clave también en escritorio. Nunca se confía en origenWeb.
  if (!esperada || !datos || datos.claveMovil !== esperada) throw new Error('Sesión no autorizada. Vuelve a abrir el Publicador.');
}
function lspMiembrosFragmento_() {
  const t = HtmlService.createTemplateFromFile('PublicadorMiembrosUI');
  t.claveMiembros = asegurarClavePublicadorMovil_();
  return t.evaluate().getContent();
}
function lspMiembrosHoja_() {
  const hoja = SpreadsheetApp.openById(LSP_MIEMBROS_SPREADSHEET_ID).getSheetByName(LSP_MIEMBROS_HOJA);
  if (!hoja) throw new Error('No encuentro la pestaña Miembros en el archivo privado.');
  const headers = hoja.getRange(1,1,1,10).getValues()[0];
  if (headers.join('|') !== LSP_MIEMBROS_CAMPOS.join('|')) throw new Error('Los encabezados de Miembros deben conservar su orden.');
  return hoja;
}
function lspMiembrosTexto_(valor) { return String(valor == null ? '' : valor).trim(); }
function lspMiembrosNorm_(valor) { return lspMiembrosTexto_(valor).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function lspMiembrosFecha_(valor) {
  if (valor === '' || valor == null) return '';
  if (valor instanceof Date) { if (isNaN(valor.getTime())) throw new Error('Fecha inválida.'); return valor.toISOString(); }
  const str = lspMiembrosTexto_(valor);
  let iso = str;
  const peru = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
  if (peru) iso = peru[3] + '-' + peru[2] + '-' + peru[1];
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const date = new Date(iso + 'T00:00:00-05:00');
    if (isNaN(date.getTime()) || Utilities.formatDate(date,'America/Lima','yyyy-MM-dd') !== iso) throw new Error('Fecha inválida. Usa día/mes/año.');
    return date.toISOString();
  }
  throw new Error('Usa una fecha de Sheets, dd/MM/yyyy o yyyy-MM-dd.');
}
function lspMiembrosVideo_(valor) {
  let str = lspMiembrosTexto_(valor);
  if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;
  let match = /^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?([^#]*)/.exec(str);
  if (match) {
    const param = match[1].split('&').find(function(p){return p.split('=')[0] === 'v';});
    str = param ? decodeURIComponent(param.slice(2)) : '';
  } else {
    match = /^https:\/\/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:shorts|embed|live)\/)([A-Za-z0-9_-]{11})(?:[/?#]|$)/.exec(str);
    str = match ? match[1] : '';
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(str)) throw new Error('Video inválido. Usa el ID o un enlace de YouTube.');
  return str;
}
function lspMiembrosRevision_(valores) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(valores));
  return Utilities.base64EncodeWebSafe(bytes);
}
function lspMiembrosLeer_(hoja) {
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2,1,hoja.getLastRow()-1,10).getValues().map(function(row,i){
    const item = {fila:i+2,revision:lspMiembrosRevision_(row)};
    LSP_MIEMBROS_CAMPOS.forEach(function(c,j){item[c] = c === 'fechaPublicacion' ? lspMiembrosFecha_(row[j]) : lspMiembrosTexto_(row[j]);});
    return item;
  }).filter(function(r){return LSP_MIEMBROS_CAMPOS.some(function(c){return r[c] !== '';});});
}
function lspMiembrosListar(datos) {
  lspMiembrosAuth_(datos);
  return {registros:lspMiembrosLeer_(lspMiembrosHoja_()),configurado:lspMiembrosConfigurado_()};
}
function lspMiembrosValidar_(r) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id)) throw new Error('Identificador inválido.');
  ['seccion','palabra','categoria'].forEach(function(c){if (!lspMiembrosTexto_(r[c])) throw new Error('Completa sección, palabra y categoría.');});
  const limites = {seccion:100,palabra:160,variantes:1000,categoria:100,imagen:1500,definicion:4000};
  Object.keys(limites).forEach(function(c){if (String(r[c] || '').length > limites[c]) throw new Error('El campo ' + c + ' es demasiado largo.');});
  if (r.estado !== 'Borrador' && r.estado !== 'Publicado') throw new Error('Estado inválido.');
  if (r.video) r.video = lspMiembrosVideo_(r.video);
  if (r.estado === 'Publicado' && !r.video) throw new Error('Para publicar necesitas un video.');
  if (r.imagen && !/^https:\/\/[^\s]+$/.test(r.imagen) && !/^img\/[a-zA-Z0-9_/.%-]+$/.test(r.imagen)) throw new Error('Usa una imagen HTTPS o una ruta img/...');
  if (r.imagen && /(^|\/)\.\.(\/|$)/.test(r.imagen)) throw new Error('Ruta de imagen inválida.');
  return r;
}
function lspMiembrosGuardar(datos) {
  lspMiembrosAuth_(datos);
  const lock=LockService.getScriptLock(); if (!lock.tryLock(30000)) throw new Error('Publicador ocupado. Intenta nuevamente.');
  try {
    const hoja=lspMiembrosHoja_(), rows=lspMiembrosLeer_(hoja), entrada=datos.registro || {}, id=lspMiembrosTexto_(entrada.id);
    // Si la fila no tiene ID todavía (editada directamente en Sheets), se usa
    // fila+revisión solo para esta asignación inicial. Luego el UUID es estable.
    const actual=id ? rows.find(function(r){return r.id===id;}) : Number.isInteger(entrada.fila) ? rows.find(function(r){return r.fila===entrada.fila && !r.id;}) : null;
    if ((id || entrada.fila) && !actual) throw new Error('La ficha ya no existe. Actualiza la lista.');
    if (actual && entrada.revision !== actual.revision) throw new Error('La ficha cambió en Sheets. Actualiza antes de guardar.');
    const registro={};LSP_MIEMBROS_CAMPOS.forEach(function(c){registro[c]=lspMiembrosTexto_(entrada[c]);});
    registro.id=id || Utilities.getUuid();registro.estado=registro.estado || 'Borrador';registro.fechaPublicacion=lspMiembrosFecha_(registro.fechaPublicacion);
    if (registro.estado==='Publicado' && !registro.fechaPublicacion) registro.fechaPublicacion=new Date().toISOString();
    lspMiembrosValidar_(registro);
    const duplicado=rows.find(function(r){return (!actual || r.fila!==actual.fila) && lspMiembrosNorm_(r.seccion)===lspMiembrosNorm_(registro.seccion) && lspMiembrosNorm_(r.palabra)===lspMiembrosNorm_(registro.palabra) && lspMiembrosNorm_(r.categoria)===lspMiembrosNorm_(registro.categoria);});
    if (duplicado) throw new Error('Ya existe esa palabra en la sección y categoría. Selecciónala para editar.');
    if (datos.imagenArchivo) {
      const a=datos.imagenArchivo;
      if (typeof a.dataUrl!=='string' || a.dataUrl.length>7*1024*1024 || !/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(a.dataUrl)) throw new Error('Imagen inválida o demasiado grande.');
      if (typeof prepararImagenPublicador_!=='function' || typeof subirArchivoGitHubPublicador_!=='function') throw new Error('Falta el módulo de imágenes del Publicador actual.');
      const prepared=prepararImagenPublicador_(a,'img/miembros/',registro.id,'',false);
      subirArchivoGitHubPublicador_(prepared.ruta,prepared.base64,'Añadir imagen de zona de miembros');
      registro.imagen=prepared.ruta;
    }
    const fila=actual ? actual.fila : Math.max(2,hoja.getLastRow()+1);
    const values=LSP_MIEMBROS_CAMPOS.map(function(c){return c==='fechaPublicacion' && registro[c] ? new Date(registro[c]) : registro[c];});
    // Escapar un apóstrofo fuerza texto; evita que palabras/variantes sean fórmulas.
    const safe=values.map(function(v){return typeof v==='string' && /^[=+@-]/.test(v) ? "'"+v : v;});
    hoja.getRange(fila,1,1,10).setValues([safe]);hoja.getRange(fila,9).setNumberFormat('dd/MM/yyyy');
    SpreadsheetApp.flush();
    if (typeof registrarHistorialPublicador_ === 'function') registrarHistorialPublicador_(actual?'Editar':'Crear','miembros',hoja,fila,registro.palabra,null,null);
    let aviso='Guardado en Zona de miembros → Miembros. La zona protegida todavía no está conectada.', sincronizado=false;
    if (lspMiembrosConfigurado_()) {
      try { lspMiembrosSincronizarSinLock_();sincronizado=true;aviso='Guardado y sincronizado con la zona de miembros.'; }
      catch(e) { aviso='Guardado en Sheets, pero no sincronizado. Revisa la conexión y pulsa Sincronizar.'; }
    }
    return {ok:true,id:registro.id,sincronizado:sincronizado,mensaje:aviso};
  } finally {lock.releaseLock();}
}
/** Eliminación con copia recuperable en el mismo archivo privado. */
function lspMiembrosEliminar(datos) {
  lspMiembrosAuth_(datos);
  const lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('Publicador ocupado.');
  try {
    const hoja=lspMiembrosHoja_(),entrada=datos.registro || {},rows=lspMiembrosLeer_(hoja);
    const actual=entrada.id ? rows.find(function(r){return r.id===entrada.id;}) : rows.find(function(r){return !r.id && r.fila===entrada.fila;});
    if(!actual)throw new Error('La ficha ya no existe. Actualiza la lista.');
    if(entrada.revision!==actual.revision)throw new Error('La ficha cambió en Sheets. Actualiza antes de eliminar.');
    // Si la retirada remota falla, la ficha permanece en la hoja original.
    const conectado=lspMiembrosConfigurado_();
    if(conectado && actual.id)lspMiembrosApi_('lsp_content?id=eq.'+encodeURIComponent(actual.id)+'&source_key=eq.'+encodeURIComponent('sheets:'+actual.id),'patch',{published:false});
    const libro=SpreadsheetApp.openById(LSP_MIEMBROS_SPREADSHEET_ID);
    const papelera=libro.getSheetByName('MiembrosPapelera') || libro.insertSheet('MiembrosPapelera');
    const headers=LSP_MIEMBROS_CAMPOS.concat(['fechaEliminacion']);
    if(papelera.getLastRow()===0)papelera.getRange(1,1,1,11).setValues([headers]);
    if(papelera.getRange(1,1,1,11).getValues()[0].join('|')!==headers.join('|'))throw new Error('Revisa los encabezados de MiembrosPapelera.');
    const copia=hoja.getRange(actual.fila,1,1,10).getValues()[0].concat([new Date()]);
    papelera.getRange(papelera.getLastRow()+1,1,1,11).setValues([copia.map(function(v){return typeof v==='string' && /^[=+@-]/.test(v)?"'"+v:v;})]);
    SpreadsheetApp.flush();
    hoja.deleteRow(actual.fila);SpreadsheetApp.flush();
    return {ok:true,mensaje:conectado?'Ficha retirada del catálogo. Copia guardada en MiembrosPapelera.':'Ficha eliminada de la hoja y guardada en MiembrosPapelera. La conexión con la web está pendiente.'};
  } finally {lock.releaseLock();}
}
function lspMiembrosSincronizar(datos) {
  lspMiembrosAuth_(datos);const lock=LockService.getScriptLock();if (!lock.tryLock(30000)) throw new Error('Publicador ocupado.');
  try { return lspMiembrosSincronizarSinLock_(); } finally {lock.releaseLock();}
}
function lspMiembrosConfigurado_() {
  const p=PropertiesService.getScriptProperties();
  return Boolean(p.getProperty('LSPEDIA_MIEMBROS_SUPABASE_URL') && p.getProperty('LSPEDIA_MIEMBROS_SUPABASE_SECRET'));
}
function lspMiembrosApi_(path,method,body,prefer) {
  const p=PropertiesService.getScriptProperties(),base=lspMiembrosTexto_(p.getProperty('LSPEDIA_MIEMBROS_SUPABASE_URL')).replace(/\/$/,''),secret=p.getProperty('LSPEDIA_MIEMBROS_SUPABASE_SECRET');
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base) || !secret) throw new Error('Configura Supabase en Script Properties.');
  const headers={apikey:secret};
  // Claves secret modernas van en apikey. Las service_role antiguas son JWT.
  if (secret.indexOf('eyJ')===0) headers.Authorization='Bearer '+secret;
  if (prefer) headers.Prefer=prefer;
  const options={method:method,headers:headers,contentType:'application/json',muteHttpExceptions:true};
  if (body!==undefined) options.payload=JSON.stringify(body);
  const response=UrlFetchApp.fetch(base+'/rest/v1/'+path,options);
  if (response.getResponseCode()<200 || response.getResponseCode()>=300) throw new Error('Error de sincronización con Supabase ('+response.getResponseCode()+').');
  const data=response.getContentText();return data?JSON.parse(data):null;
}
function lspMiembrosSincronizarSinLock_() {
  if (!lspMiembrosConfigurado_()) throw new Error('La zona de miembros todavía no está conectada. Los datos están guardados en Sheets.');
  const hoja=lspMiembrosHoja_(), rows=lspMiembrosLeer_(hoja), usados={},duplicados={};
  // Validar TODO antes de tocar el catálogo remoto. Una fila inválida no
  // provoca que otras fichas sean retiradas por accidente.
  rows.forEach(function(r){
    if (!r.id) {r.id=Utilities.getUuid();hoja.getRange(r.fila,1).setValue(r.id);}
    r.estado=r.estado || 'Borrador';
    if (r.estado==='Publicado' && !r.fechaPublicacion) {r.fechaPublicacion=new Date().toISOString();hoja.getRange(r.fila,9).setValue(new Date(r.fechaPublicacion)).setNumberFormat('dd/MM/yyyy');}
    try {lspMiembrosValidar_(r);} catch(e) {throw new Error('Fila '+r.fila+': '+e.message);}
    if (usados[r.id]) throw new Error('ID duplicado en la fila '+r.fila);usados[r.id]=true;
    const identidad=[r.seccion,r.palabra,r.categoria].map(lspMiembrosNorm_).join('|');
    if (duplicados[identidad]) throw new Error('Palabra duplicada en la fila '+r.fila);duplicados[identidad]=true;
  });
  const nombres={IS:'Señas Internacionales (IS)',ASL:'Lengua de Señas Americana (ASL)',Tutoriales:'Tutoriales',Profesores:'Contenido para profesores'}, categorias={};
  rows.forEach(function(r){categorias[nombres[r.seccion] || r.seccion]=true;});
  const keys=Object.keys(categorias);
  if (keys.length) {
    const resp=lspMiembrosApi_('lsp_member_categories?on_conflict=title','post',keys.map(function(t,i){return {title:t,position:i+1};}),'resolution=merge-duplicates,return=representation');
    resp.forEach(function(c){categorias[c.title]=c.id;});
  }
  const payload=rows.filter(function(r){return !!r.video;}).map(function(r){return {
    id:r.id,source_key:'sheets:'+r.id,section:nombres[r.seccion] || r.seccion,word:r.palabra,variants:r.variantes.split(',').map(function(v){return v.trim();}).filter(Boolean),
    video_url:'https://www.youtube.com/watch?v='+r.video,category:r.categoria,image_url:r.imagen,description:r.definicion,published_at:r.fechaPublicacion || new Date().toISOString(),published:r.estado==='Publicado'
  };});
  for (let i=0;i<payload.length;i+=100) lspMiembrosApi_('lsp_content?on_conflict=id','post',payload.slice(i,i+100),'resolution=merge-duplicates');
  // Borradores sin video o filas quitadas de Sheets se ocultan; no se borran
  // registros manuales ni se publican videos pendientes por una fecha futura.
  const existentes=lspMiembrosApi_('lsp_content?select=id,source_key&source_key=like.sheets:*','get');
  const enviados={};payload.forEach(function(r){enviados[r.id]=true;});
  existentes.filter(function(r){return !enviados[r.source_key.slice(7)];}).forEach(function(r){lspMiembrosApi_('lsp_content?id=eq.'+encodeURIComponent(r.id),'patch',{published:false});});
  return {ok:true,total:rows.length,mensaje:'Catálogo sincronizado. Las fechas futuras se respetan.'};
}
