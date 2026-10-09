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
  return lspMiembrosRequest_('/rest/v1/'+path,method,body,prefer);
}
function lspMiembrosRequest_(path,method,body,prefer) {
  const p=PropertiesService.getScriptProperties(),base=lspMiembrosTexto_(p.getProperty('LSPEDIA_MIEMBROS_SUPABASE_URL')).replace(/\/$/,''),secret=p.getProperty('LSPEDIA_MIEMBROS_SUPABASE_SECRET');
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base) || !secret) throw new Error('Configura Supabase en Script Properties.');
  const headers={apikey:secret};
  // Claves secret modernas van en apikey. Las service_role antiguas son JWT.
  if (secret.indexOf('eyJ')===0) headers.Authorization='Bearer '+secret;
  if (prefer) headers.Prefer=prefer;
  const options={method:method,headers:headers,contentType:'application/json',muteHttpExceptions:true};
  if (body!==undefined) options.payload=JSON.stringify(body);
  const response=UrlFetchApp.fetch(base+path,options);
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

/** Usuarios: solo el Publicador autorizado; nunca devuelve credenciales ni metadatos privados. */
function lspMiembrosUsuariosListar(datos) {
  lspMiembrosAuth_(datos);
  if(!lspMiembrosConfigurado_())return {configurado:false,usuarios:[],pagina:1,siguiente:false};
  const pagina=datos.pagina==null?1:Number(datos.pagina);
  if(!Number.isInteger(pagina) || pagina<1 || pagina>10000)throw new Error('Página inválida.');
  const respuesta=lspMiembrosRequest_('/auth/v1/admin/users?page='+pagina+'&per_page=50','get');
  const usuarios=respuesta.users || [];
  const ids=usuarios.map(function(u){return u.id;});
  ids.forEach(lspMiembrosUsuarioId_);
  const miembros=ids.length?lspMiembrosApi_('lsp_members?select=*&user_id=in.('+ids.join(',')+')','get'):[];
  const mapa={};miembros.forEach(function(m){mapa[m.user_id]=m;});
  let accessFeatures=false;try {accessFeatures=Number(lspMiembrosApi_('rpc/lsp_member_features','post',{}).version)>=2;} catch(_) {}
  const sections=lspMiembrosApi_('lsp_member_categories?select=title&order=position.asc','get').map(function(c){return {title:c.title,code:({'Señas Internacionales (IS)':'IS','Lengua de Señas Americana (ASL)':'ASL','Contenido para profesores':'Profesores'})[c.title] || c.title};});
  return {secciones:sections,configurado:true,pagina:pagina,siguiente:respuesta.last_page?pagina<Number(respuesta.last_page):usuarios.length===50,usuarios:usuarios.map(function(u){
    const m=mapa[u.id];return {user_id:u.id,email:u.email || '',username:lspMiembrosTexto_((u.user_metadata || {}).username),role:m?m.role:'member',status:m?m.status:'pending',confirmado:!!u.email_confirmed_at,expires_at:m?m.expires_at || null:null,allowed_sections:m?m.allowed_sections==null?null:m.allowed_sections:null,accessReady:accessFeatures && !!m && Object.prototype.hasOwnProperty.call(m,'allowed_sections')};
  })};
}
function lspMiembrosUsuarioId_(id) {
  if(typeof id!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error('Usuario inválido.');
}
function lspMiembrosUsuarioEstado(datos) {
  lspMiembrosAuth_(datos);lspMiembrosUsuarioId_(datos.user_id);
  if(!lspMiembrosConfigurado_())throw new Error('Conexión con Supabase pendiente.');
  if(['active','suspended'].indexOf(datos.estado)===-1)throw new Error('Estado inválido.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('Publicador ocupado.');
  try {
    const id=datos.user_id,actuales=lspMiembrosApi_('lsp_members?select=user_id,role,status&user_id=eq.'+id,'get'),actual=actuales[0];
    if(actual && actual.role==='admin')throw new Error('La cuenta administradora está protegida.');
    if(datos.roleAnterior!=='member' || datos.estadoAnterior!==(actual?actual.status:'pending'))throw new Error('El acceso cambió. Actualiza la lista antes de continuar.');
    const cuenta=lspMiembrosRequest_('/auth/v1/admin/users/'+id,'get');
    if(!cuenta || cuenta.id!==id)throw new Error('La cuenta ya no existe.');
    let resultado;
    if(actual)resultado=lspMiembrosApi_('lsp_members?user_id=eq.'+id+'&role=eq.member&status=eq.'+encodeURIComponent(actual.status),'patch',{status:datos.estado},'return=representation');
    else resultado=lspMiembrosApi_('lsp_members?on_conflict=user_id','post',{user_id:id,role:'member',status:datos.estado},'resolution=ignore-duplicates,return=representation');
    if(!resultado || resultado.length!==1 || resultado[0].role!=='member' || resultado[0].status!==datos.estado)throw new Error('El acceso cambió. Actualiza la lista antes de continuar.');
    return {ok:true,mensaje:datos.estado==='active'?'Acceso activado.':'Acceso suspendido. El contenido protegido queda bloqueado para esta cuenta.'};
  } finally {lock.releaseLock();}
}

/** Meses de calendario desde hoy en Perú; el día se ajusta al último del mes. */
function lspMiembrosPlazo_(months, ahora) {
  if([1,3,6,12].indexOf(Number(months))===-1)throw new Error('Elige 1, 3, 6 o 12 meses.');
  const peru=new Date((ahora || new Date()).getTime()-5*3600000),day=peru.getUTCDate();
  peru.setUTCDate(1);peru.setUTCMonth(peru.getUTCMonth()+Number(months));
  const last=new Date(Date.UTC(peru.getUTCFullYear(),peru.getUTCMonth()+1,0)).getUTCDate();
  peru.setUTCDate(Math.min(day,last));
  return new Date(peru.getTime()+5*3600000).toISOString();
}
/** Contraseñas nunca van a Sheets ni logs. Acceso temporal solo tras guardar sus límites. */
function lspMiembrosUsuarioCrear(datos) {
  lspMiembrosAuth_(datos);
  const email=lspMiembrosTexto_(datos.email).toLowerCase(),password=datos.password;
  if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Escribe un correo válido.');
  if(typeof password!=='string' || password.length<12 || password.length>128)throw new Error('Usa una contraseña inicial de 12 a 128 caracteres.');
  const username=lspMiembrosTexto_(datos.username);
  if(username.length>80 || /[\u0000-\u001f\u007f]/.test(username))throw new Error('Nombre de usuario inválido (máximo 80 caracteres).');
  const expiry=datos.months?lspMiembrosPlazo_(datos.months):null;
  if(expiry && Number(lspMiembrosApi_('rpc/lsp_member_features','post',{}).version)<2)throw new Error('Primero instala los límites de acceso en Supabase.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('Publicador ocupado.');
  try {
    const user=lspMiembrosRequest_('/auth/v1/admin/users','post',{email:email,password:password,email_confirm:true,user_metadata:{username:username}});
    lspMiembrosUsuarioId_(user.id);
    try {lspMiembrosApi_('lsp_members?on_conflict=user_id','post',{user_id:user.id,role:'member',status:'pending'},'resolution=ignore-duplicates');}
    catch(e){return {ok:true,mensaje:'Cuenta creada sin acceso. Actualiza Usuarios antes de activarla.'};}
    if(expiry){
      try {
        const m=lspMiembrosApi_('lsp_members?select=*&user_id=eq.'+user.id,'get')[0];
        if(!m || m.role!=='member' || m.status!=='pending')throw new Error('Estado inesperado.');
        const saved=lspMiembrosApi_('rpc/lsp_set_member_access','post',{target_user:user.id,new_sections:null,new_expiry:expiry,expected_access:{sections:m.allowed_sections,expires:m.expires_at}});
        if(!saved || !saved.ok)throw new Error('No se guardó el vencimiento.');
        const active=lspMiembrosApi_('lsp_members?user_id=eq.'+user.id+'&role=eq.member&status=eq.pending','patch',{status:'active'},'return=representation');
        if(!active || active.length!==1 || active[0].status!=='active')throw new Error('No se activó el acceso.');
        return {ok:true,mensaje:'Cuenta creada con acceso por '+Number(datos.months)+' meses. Se bloquea automáticamente al vencer.'};
      } catch(e){return {ok:true,mensaje:'Cuenta creada. No se pudo completar el acceso temporal; revisa su estado y vencimiento en Usuarios antes de activarla.'};}
    }
    return {ok:true,mensaje:'Cuenta creada, pendiente de aprobación. Activa su acceso desde Usuarios.'};
  } finally {lock.releaseLock();}
}
function lspMiembrosUsuarioAcceso(datos) {
  lspMiembrosAuth_(datos);lspMiembrosUsuarioId_(datos.user_id);
  if(datos.sections!==null && (!Array.isArray(datos.sections) || datos.sections.length>100 || datos.sections.some(function(s){return typeof s!=='string' || s.length>100;})))throw new Error('Secciones inválidas.');
  const expiry=datos.months?lspMiembrosPlazo_(datos.months):datos.expiry?new Date(Date.parse(lspMiembrosFecha_(datos.expiry))+86400000).toISOString():null;
  const result=lspMiembrosApi_('rpc/lsp_set_member_access','post',{target_user:datos.user_id,new_sections:datos.sections,new_expiry:expiry,expected_access:datos.expectedAccess});
  if(!result || !result.ok)throw new Error('No se pudo guardar el acceso.');
  return {ok:true,mensaje:'Secciones y vencimiento guardados. El servidor aplica estos límites.'};
}

const LSP_MIEMBROS_COLABORACIONES_FOLDER='1RxHETWDjgkAsPj_emlywyfFkbpe3Oj113Ge1kVkF-TbqpCKHL1MV6VT4Lu5U5vm7-pbUlDUZ';
function lspMiembrosColaboracionesHoja_() {
  const ss=SpreadsheetApp.openById(LSP_MIEMBROS_SPREADSHEET_ID);let sh=ss.getSheetByName('Colaboraciones');
  if(!sh){sh=ss.insertSheet('Colaboraciones');sh.appendRow(['idArchivo','nombre','estado','nota','revision']);sh.setFrozenRows(1);}
  return sh;
}
function lspMiembrosColaboracionesListar(datos) {
  lspMiembrosAuth_(datos);
  const sh=lspMiembrosColaboracionesHoja_(),mapa={};
  if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,5).getValues().forEach(function(r){mapa[r[0]]={estado:r[2],nota:r[3],revision:String(r[4])};});
  const folder=DriveApp.getFolderById(LSP_MIEMBROS_COLABORACIONES_FOLDER),files=[];
  // Google Forms crea subcarpetas por pregunta. Solo revisar dentro de la carpeta configurada.
  const folders=[folder],children=folder.getFolders();while(children.hasNext())folders.push(children.next());
  folders.forEach(function(f){const it=f.getFiles();while(it.hasNext()){const file=it.next();if(file.getMimeType().indexOf('video/')!==0)continue;const stored=mapa[file.getId()] || {};files.push({id:file.getId(),nombre:file.getName(),url:file.getUrl(),fecha:file.getDateCreated().toISOString(),bytes:file.getSize(),estado:stored.estado || 'Pendiente',nota:stored.nota || '',revision:stored.revision || ''});}});
  files.sort(function(a,b){return b.fecha.localeCompare(a.fecha);});
  return {registros:files,mensaje:files.length+' videos recibidos. Aprobar no publica el video.'};
}
function lspMiembrosColaboracionEstado(datos) {
  lspMiembrosAuth_(datos);
  if(typeof datos.id!=='string' || !/^[A-Za-z0-9_-]{10,}$/.test(datos.id) || ['Pendiente','Aprobado','Descartado'].indexOf(datos.estado)===-1)throw new Error('Colaboración inválida.');
  if(typeof datos.nota!=='string' || datos.nota.length>1000)throw new Error('Nota demasiado larga.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('Publicador ocupado.');
  try {
    // Evita escribir estados sobre archivos ajenos a la carpeta de recepción.
    const file=DriveApp.getFileById(datos.id),parents=file.getParents();let permitted=false;
    while(parents.hasNext()){const p=parents.next();if(p.getId()===LSP_MIEMBROS_COLABORACIONES_FOLDER)permitted=true;const ancestors=p.getParents();while(ancestors.hasNext())if(ancestors.next().getId()===LSP_MIEMBROS_COLABORACIONES_FOLDER)permitted=true;}
    if(!permitted || file.getMimeType().indexOf('video/')!==0)throw new Error('Archivo fuera de la carpeta de colaboraciones.');
    const sh=lspMiembrosColaboracionesHoja_(),rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,5).getValues():[];
    const index=rows.findIndex(function(r){return r[0]===datos.id;});
    if(String(index>=0?rows[index][4]:'')!==String(datos.revision || ''))throw new Error('La revisión cambió. Actualiza la lista.');
    const safe=function(v){return /^[=+@-]/.test(v)?"'"+v:v;};
    sh.getRange(index>=0?index+2:sh.getLastRow()+1,1,1,5).setValues([[datos.id,safe(file.getName()),datos.estado,safe(datos.nota),Utilities.getUuid()]]);
    return {ok:true,mensaje:'Revisión guardada. El archivo se conserva en Drive.'};
  } finally {lock.releaseLock();}
}
