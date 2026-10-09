/* La interfaz no concede permisos: cada lectura/escritura depende de RLS. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const config = window.LSPEDIA_MIEMBROS || {};
const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl || '') && Boolean(config.publishableKey);
const base = (config.supabaseUrl || '').replace(/\/$/, '');
const key = 'lspedia_members_session_v1';
let session = null, profile = null, categories = [], content = [], selected = '', generation = 0;
let accessTimer = null;
function scheduleAccessExpiry() {
  clearTimeout(accessTimer);
  if (!profile?.expires_at || profile.role === 'admin') return;
  const remaining = Date.parse(profile.expires_at) - Date.now();
  if (remaining <= 0) { lock('Tu acceso venció. Contacta al administrador para renovarlo.'); return; }
  accessTimer = setTimeout(scheduleAccessExpiry, Math.min(remaining, 2147483647));
}
let recoverySession = null, recovering = false, recoverySentAt = 0;
let favorites = new Set(), recent = [], activeVideo = null;
const specialViews = new Set(['@favorites','@recent']);
const incomingId = new URLSearchParams(location.search).get('ficha');
let pendingShared = /^[0-9a-f-]{36}$/i.test(incomingId || '') ? incomingId : '';
const sectionCode = title => ({'Señas Internacionales (IS)':'IS','Lengua de Señas Americana (ASL)':'ASL','Contenido para profesores':'Profesores'}[title] || title);
const canUse = title => profile?.role === 'admin' || profile?.allowed_sections == null || profile.allowed_sections.includes(sectionCode(title));
const personalKey = () => 'lspedia_members_library_v1_' + session.user.id;
function readPersonal() {
  favorites = new Set(); recent = [];
  try { const saved=JSON.parse(localStorage.getItem(personalKey()) || '{}');
    favorites=new Set((Array.isArray(saved.favorites)?saved.favorites:[]).filter(v=>typeof v==='string').slice(0,1000));
    recent=(Array.isArray(saved.recent)?saved.recent:[]).filter(v=>v && typeof v.id==='string' && Number.isFinite(v.at)).slice(0,30);
  } catch (_) {}
}
function savePersonal() {
  if (!session) return;
  try { localStorage.setItem(personalKey(),JSON.stringify({favorites:[...favorites].slice(0,1000),recent:recent.slice(0,30)})); }
  catch (_) { status('Este navegador no pudo guardar tus favoritos.'); }
}
function favoriteLabel(id) { return favorites.has(id) ? '♥ Guardado' : '♡ Guardar'; }
function toggleFavorite(video) {
  if (!session) return;
  favorites.has(video.id) ? favorites.delete(video.id) : favorites.add(video.id); savePersonal(); renderVideos();
  if (activeVideo?.id===video.id) { $('playerFavorite').textContent=favoriteLabel(video.id); $('playerFavorite').setAttribute('aria-pressed',String(favorites.has(video.id))); }
}
async function shareVideo(video) {
  const url=new URL(location.pathname,location.origin);url.searchParams.set('ficha',video.id);
  if (navigator.share) { try { await navigator.share({title:video.title,url:url.href}); return; } catch(e) { if(e.name==='AbortError') return; } }
  try { await navigator.clipboard.writeText(url.href); status('Enlace copiado. Se necesita una cuenta autorizada para ver la ficha.'); }
  catch (_) { const field=$('shareUrl');field.value=url.href;$('shareDialog').showModal();field.select(); }
}
const sectionState = new Map();
const state = () => { if (!sectionState.has(selected)) sectionState.set(selected, {search:'',topic:'',letter:'',order:'alphabetical'}); return sectionState.get(selected); };
const text = (tag, value, cls) => { const el = document.createElement(tag); el.textContent = value; if (cls) el.className = cls; return el; };
function status(message = '') { $('status').textContent = message; }
function clearPlayer() { activeVideo = null; $('embed').replaceChildren(); if ($('player').open) $('player').close(); }
function lock(message = '') {
  clearTimeout(accessTimer); accessTimer = null;
  recoverySession = null; recovering = false; $('recoveryForm').hidden = true; $('newPasswordForm').hidden = true; $('loginForm').hidden = false; $('newPasswordForm').reset();
  favorites=new Set(); recent=[]; sectionState.clear(); generation++; session = null; profile = null; content = []; categories = []; selected = '';
  try { sessionStorage.removeItem(key); } catch (_) {}
  clearPlayer(); if ($('shareDialog').open) $('shareDialog').close(); $('shareUrl').value=''; if ($('contributionDialog').open) $('contributionDialog').close(); $('library').hidden = true; $('admin').hidden = true; $('logout').hidden = true; $('loginPanel').hidden = false;
  $('videos').replaceChildren(); $('categories').replaceChildren(); $('adminVideos').replaceChildren(); $('users').replaceChildren();
  $('contentForm').reset(); $('contentId').value = ''; $('adminToggle').hidden = true; renderNavigation(); status(message);
}
async function request(path, options = {}, authenticated = true) {
  if (!ready) throw new Error('La zona de miembros todavía no está habilitada.');
  const current = generation;
  if (authenticated && (!session || session.expires_at <= Date.now())) { lock('Tu sesión terminó. Vuelve a ingresar.'); throw new Error('Vuelve a ingresar para continuar.'); }
  const headers = { apikey: config.publishableKey, 'Content-Type': 'application/json', ...options.headers };
  if (session && authenticated) headers.Authorization = 'Bearer ' + session.access_token;
  let response;
  try { response = await fetch(base + path, { ...options, headers, cache: 'no-store', credentials: 'omit' }); }
  catch (_) { throw new Error('No se pudo conectar. Revisa tu conexión e inténtalo nuevamente.'); }
  if (authenticated && current !== generation) throw new Error('La sesión cambió.');
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (authenticated && response.status === 401) lock('Tu sesión terminó. Vuelve a ingresar.');
    throw new Error(path.startsWith('/auth/v1/token') ? 'No se pudo ingresar. Revisa tu correo y contraseña.' : 'No se pudo completar la operación. Comprueba tu acceso e inténtalo nuevamente.');
  }
  return data;
}
async function membership() {
  const rows = await request('/rest/v1/lsp_members?select=*&user_id=eq.' + encodeURIComponent(session.user.id));
  if (!rows?.[0] || (rows[0].status !== 'active' || (rows[0].role !== 'admin' && rows[0].expires_at && Date.parse(rows[0].expires_at) <= Date.now()))) { lock('Tu cuenta aún no tiene acceso o ha sido suspendida. Contacta al administrador de LSPedia.'); return false; }
  profile = rows[0]; scheduleAccessExpiry(); return !!profile;
}
function youtubeId(value) {
  try {
    const url = new URL(value); if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase(); let id = '';
    if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
    else if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else if (/^\/(shorts|embed|live)\//.test(url.pathname)) id = url.pathname.split('/')[2];
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
  } catch (_) { return null; }
}
const visible = video => video.published && (!video.publish_at || Date.parse(video.publish_at) <= Date.now());
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
function button(label, action) {
  const el = text('button', label); el.type = 'button'; el.addEventListener('click', () => run(el, action)); return el;
}
async function run(el, action) { el.disabled = true; status(); try { await action(); } catch (e) { status(e.message); } finally { el.disabled = false; } }
async function loadLibrary() {
  const current = generation, adminWasOpen = !$('admin').hidden;
  if (!await membership()) return;
  const [newCategories, newContent] = await Promise.all([
    request('/rest/v1/lsp_member_categories?select=*&order=position.asc,title.asc'),
    request('/rest/v1/lsp_content?select=*&order=created_at.desc')
  ]);
  if (current !== generation) return;
  categories = (newCategories || []).filter(c=>canUse(c.title)); content = (newContent || []).map(fromDatabase);
  if (!specialViews.has(selected) && !categories.some(c => c.id === selected)) selected = '';
  if (!selected && location.hash.startsWith('#seccion=')) { const id = decodeURIComponent(location.hash.slice(9)); if (categories.some(c => c.id === id)) selected = id; }
  $('loginPanel').hidden = true; $('library').hidden = adminWasOpen && profile.role === 'admin'; $('admin').hidden = !adminWasOpen || profile.role !== 'admin'; $('logout').hidden = false;
  $('adminToggle').hidden = profile.role !== 'admin'; renderCategories(); renderVideos(); renderNavigation();
  if (profile.role === 'admin') renderAdmin();
  $('accessBadge').hidden=!profile.expires_at || profile.role==='admin';
  if (!$('accessBadge').hidden) $('accessBadge').textContent='Acceso hasta '+new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeZone:'America/Lima'}).format(new Date(Date.parse(profile.expires_at)-1));
  if (pendingShared) { const id=pendingShared; pendingShared='';const video=content.find(v=>v.id===id && visible(v) && categories.some(c=>c.id===v.category_id));
    if (video) {openSection(video.category_id);await play(video);} else status('Esta ficha no está disponible para tu cuenta.'); }

}
function fromDatabase(row) {
  const sectionNames = {IS:'Señas Internacionales (IS)',ASL:'Lengua de Señas Americana (ASL)',Tutoriales:'Tutoriales',Profesores:'Contenido para profesores'};
  const section = sectionNames[row.section] || row.section;
  return {...row,title:row.word,category_id:categories.find(c=>c.title===section)?.id || '',youtube_id:youtubeId(row.video_url),keywords:(row.variants || []).join(', '),variants:(row.variants || []).join(', '),topic:row.category,publish_at:row.published_at};
}
function renderNavigation() {
  const internal = Boolean(session && (!$('admin').hidden || selected));
  $('memberBack').hidden = !internal; $('exitMembers').hidden = internal;
  $('exitMembers').textContent = session ? 'Salir a Herramientas ↗' : '← Volver a LSPedia';
  $('memberBack').textContent = !$('admin').hidden ? '← Volver a la biblioteca' : '← Zona de miembros';
  $('openFavorites').setAttribute('aria-pressed',String(selected==='@favorites')); $('openRecent').setAttribute('aria-pressed',String(selected==='@recent'));
  $('sectionPanel').hidden = !selected; $('categories').hidden = Boolean(selected); $('libraryWelcome').hidden = Boolean(selected);
}
function openSection(id, push = true) {
  if (!specialViews.has(id) && !categories.some(c => c.id === id)) return;
  selected = id;
  if (push) { if (!location.hash || location.hash === '#biblioteca') history.replaceState(null,'','#biblioteca'); history.pushState(null,'','#seccion='+encodeURIComponent(id)); }
  renderCategories(); renderVideos(); renderNavigation();
}
function showLibraryHome() {
  selected = ''; $('admin').hidden = true; $('library').hidden = false; resetEditor();
  history.replaceState(null,'','#biblioteca'); renderCategories(); renderNavigation();
}
$('memberBack').addEventListener('click', () => { if (!$('admin').hidden) { $('adminClose').click(); renderNavigation(); } else showLibraryHome(); });
window.addEventListener('popstate', () => { if (!session) return; const id = location.hash.startsWith('#seccion=') ? decodeURIComponent(location.hash.slice(9)) : ''; if (specialViews.has(id) || categories.some(c=>c.id===id)) openSection(id,false); else showLibraryHome(); });
function sectionIcon(title) {
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 48 48');svg.setAttribute('aria-hidden','true');
  const paths=title.includes('(IS)') || title.includes('(ASL)') ? ['M24 5a19 19 0 1 0 0 38 19 19 0 0 0 0-38Z','M5 24h38M24 5c-10 10-10 28 0 38M24 5c10 10 10 28 0 38M9 13h30M9 35h30'] : title==='Tutoriales' ? ['M10 7h28a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4Z','m20 16 12 8-12 8Z'] : ['m3 17 21-10 21 10-21 10Z','M12 23v11c8 6 16 6 24 0V23M45 18v16'];
  paths.forEach(d=>{const path=document.createElementNS(ns,'path');path.setAttribute('d',d);svg.append(path);});return svg;
}
function renderCategories() {
  $('categories').replaceChildren();
  for (const category of categories) {
    const el = button('', () => { openSection(category.id); });
    el.className = 'category'; el.setAttribute('aria-pressed', String(selected === category.id));
    const symbol = text('span',category.title.includes('(IS)') ? 'IS' : category.title.includes('(ASL)') ? 'ASL' : category.title === 'Tutoriales' ? '↗' : category.title.includes('profesores') ? '✦' : category.title.slice(0,2).toUpperCase(),'category-symbol');
    symbol.append(sectionIcon(category.title));el.append(symbol, text('b', category.title), text('small', content.filter(v => v.category_id === category.id && visible(v)).length + ' videos'),text('span','↗','category-arrow')); $('categories').append(el);
  }
}
function renderVideos() {
  const category = categories.find(c => c.id === selected), filters = state();
  const specialTitle=selected==='@favorites'?'Favoritos':selected==='@recent'?'Últimos vistos':'';
  $('personalHint').hidden=!specialViews.has(selected);
  $('search').value = filters.search; $('sortOrder').value = filters.order;
  $('clearSearch').hidden = !filters.search;
  $('categoryTitle').textContent = specialTitle || category?.title || 'Biblioteca'; 
  $('searchLabel').textContent = 'Buscar en ' + (specialTitle || category?.title || 'esta sección');
  const sectionVideos = content.filter(v => visible(v) && categories.some(c=>c.id===v.category_id) && (selected==='@favorites' ? favorites.has(v.id) : selected==='@recent' ? recent.some(r=>r.id===v.id) : v.category_id === selected));
  const topics = [...new Set(sectionVideos.map(v => v.topic || 'General'))].sort((a,b)=>a.localeCompare(b,'es'));
  if (filters.topic && !topics.includes(filters.topic)) filters.topic = '';
  $('topics').replaceChildren();
  if (topics.length) for (const topic of ['',...topics]) {
    const el = button(topic || 'Todas las categorías', () => { filters.topic = topic; renderVideos(); });
    el.setAttribute('aria-pressed', String(filters.topic === topic));
    el.append(text('small', sectionVideos.filter(v => !topic || (v.topic || 'General') === topic).length)); $('topics').append(el);
  }
  $('alphabet').replaceChildren();
  for (const letter of ['',...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ']) {
    const el = button(letter || 'Todas', () => { filters.letter = letter; renderVideos(); });
    el.setAttribute('aria-pressed', String(filters.letter === letter)); $('alphabet').append(el);
  }
  const terms = normalize(filters.search).split(/\s+/).filter(Boolean);
  const initial = value => String(value || '').trim().slice(0,1).toLocaleUpperCase('es').normalize('NFD').replace(/([AEIOU])[\u0300-\u036f]/g,'$1').normalize('NFC');
  const videos = sectionVideos.filter(v => (!filters.topic || (v.topic || 'General') === filters.topic) && (!filters.letter || initial(v.title) === filters.letter) && terms.every(term => normalize([v.title,v.description,v.keywords,v.variants,v.topic].join(' ')).includes(term)));
  videos.sort(selected==='@recent' ? (a,b)=>(recent.find(r=>r.id===b.id)?.at||0)-(recent.find(r=>r.id===a.id)?.at||0) : filters.order === 'recent' ? (a,b) => (Date.parse(b.publish_at)||0)-(Date.parse(a.publish_at)||0) || a.title.localeCompare(b.title,'es') : (a,b) => a.title.localeCompare(b.title,'es'));
  $('videos').replaceChildren(); $('resultCount').textContent = videos.length + (videos.length === 1 ? ' resultado' : ' resultados');
  if (!videos.length) {
    const empty = text('div','','empty'); empty.append(text('h3',sectionVideos.length ? 'No encontramos coincidencias' : selected==='@favorites' ? 'Guarda lo que te gusta' : selected==='@recent' ? 'Aquí aparecerán los videos que abras' : 'Esta sección está en preparación'),text('p',sectionVideos.length ? 'Prueba otra palabra, categoría o letra del índice.' : selected==='@favorites' ? 'Pulsa el corazón de una ficha.' : selected==='@recent' ? 'Elige un video de tu biblioteca.' : 'Todavía no hay publicaciones disponibles.')); $('videos').append(empty);
  }
  for (const video of videos) {
    const card = text('article','','video');
    const el = button('', () => play(video)); el.className = 'video-open'; el.setAttribute('aria-label','Ver video: '+video.title);
    const image = document.createElement('img');
    const fallback = 'https://i.ytimg.com/vi/' + video.youtube_id + '/hqdefault.jpg';
    const supplied = String(video.image_url || '');
    image.src = /^https:\/\//.test(supplied) ? supplied : /^img\//.test(supplied) ? 'https://lspedia.site/' + supplied : fallback;
    image.addEventListener('error', () => { image.src = fallback; }, {once:true}); image.alt = ''; image.loading = 'lazy';
    el.append(image, text('b', video.title), text('small',video.topic || 'General','topic'),text('p', video.variants ? 'Variantes: '+video.variants : video.description || 'Ver video')); const actions=text('div','','video-actions');
    const favorite=button(favoriteLabel(video.id),()=>toggleFavorite(video));favorite.setAttribute('aria-pressed',String(favorites.has(video.id)));favorite.setAttribute('aria-label',favoriteLabel(video.id)+': '+video.title);
    const share=button('↗ Compartir',()=>shareVideo(video));share.setAttribute('aria-label','Compartir ficha: '+video.title);
    actions.append(favorite,share);card.append(el,actions);$('videos').append(card);
  }
}
async function play(video) {
  if (!await membership()) return;
  // Reconsultar permite detectar un video retirado desde que se abrió la biblioteca.
  const records = await request('/rest/v1/lsp_content?select=*&id=eq.' + video.id + '&published=eq.true');
  const rows = (records || []).map(fromDatabase);
  if (!rows?.[0] || !visible(rows[0]) || !rows[0].youtube_id) { await loadLibrary(); throw new Error('Este video ya no está disponible.'); }
  clearPlayer(); $('playerTitle').textContent = rows[0].title;
  const frame = document.createElement('iframe'); frame.title = rows[0].title; frame.src = 'https://www.youtube-nocookie.com/embed/' + rows[0].youtube_id;
  frame.allow = 'encrypted-media; picture-in-picture; fullscreen'; frame.allowFullscreen = true; frame.referrerPolicy = 'strict-origin-when-cross-origin';
  $('embed').append(frame); activeVideo=rows[0];
  recent=[{id:video.id,at:Date.now()},...recent.filter(r=>r.id!==video.id)].slice(0,30);savePersonal();
  $('playerFavorite').textContent=favoriteLabel(video.id);$('playerFavorite').setAttribute('aria-pressed',String(favorites.has(video.id)));$('player').showModal();
}
function resetEditor() { $('contentForm').reset(); $('contentId').value = ''; $('editorTitle').textContent = 'Añadir video'; }
function renderAdmin() {
  const select = $('contentForm').elements.category_id; select.replaceChildren();
  for (const category of categories) { const option = text('option', category.title); option.value = category.id; select.append(option); }
  $('adminVideos').replaceChildren();
  for (const video of content) {
    const row = text('div', '', 'row'); row.append(text('span', video.title + (video.published ? '' : ' · Borrador')));
    const actions = text('div', '', 'actions');
    actions.append(button('Editar', () => {
      const f = $('contentForm'); $('contentId').value = video.id; f.elements.title.value = video.title; f.elements.category_id.value = video.category_id;
      f.elements.youtube_url.value = 'https://www.youtube.com/watch?v=' + video.youtube_id; f.elements.description.value = video.description;
      f.elements.keywords.value = video.keywords; f.elements.published.checked = video.published; $('editorTitle').textContent = 'Editar video'; f.scrollIntoView({behavior:'smooth'});
    }), button('Eliminar', async () => {
      if (!confirm('¿Eliminar «' + video.title + '» de LSPedia? El video de YouTube se conserva.')) return;
      await request('/rest/v1/lsp_content?id=eq.' + video.id, {method:'DELETE'}); await loadLibrary();
    })); row.append(actions); $('adminVideos').append(row);
  }
}
async function loadUsers() {
  const users = await request('/rest/v1/rpc/lsp_list_members', {method:'POST',body:'{}'}); $('users').replaceChildren();
  for (const user of users || []) {
    const row = text('div', '', 'row'); row.append(text('span', user.email + ' · ' + (user.role === 'admin' ? 'Administrador' : user.status === 'active' ? 'Activo' : user.status === 'suspended' ? 'Suspendido' : 'Pendiente')));
    if (user.role !== 'admin') row.append(button(user.status === 'active' ? 'Suspender' : 'Autorizar', async () => {
      await request('/rest/v1/rpc/lsp_set_member_status', {method:'POST',body:JSON.stringify({target_user:user.user_id,new_status:user.status === 'active' ? 'suspended' : 'active'})}); await loadUsers();
    })); $('users').append(row);
  }
}
$('loginForm').addEventListener('submit', e => { e.preventDefault(); run($('loginButton'), async () => {
  const data = await request('/auth/v1/token?grant_type=password', {method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})}, false);
  $('password').value = ''; generation++; session = {access_token:data.access_token,expires_at:Date.now() + data.expires_in * 1000,user:{id:data.user.id}};
  readPersonal();
  try { sessionStorage.setItem(key, JSON.stringify(session)); } catch (_) {}
  try { await loadLibrary(); } catch (error) { lock(error.message); }
}); });
function recoveryScreen(mode) {
  $('loginForm').hidden = mode !== 'login';
  $('recoveryForm').hidden = mode !== 'email';
  $('newPasswordForm').hidden = mode !== 'password';
}
$('forgotPassword').addEventListener('click', () => {
  status(); $('recoveryEmail').value = $('email').value.trim(); recoveryScreen('email'); $('recoveryEmail').focus();
});
$('cancelRecovery').addEventListener('click', () => { status(); recoveryScreen('login'); $('email').focus(); });
$('cancelNewPassword').addEventListener('click', () => { lock(); $('email').focus(); });
$('recoveryForm').addEventListener('submit', e => { e.preventDefault(); run($('sendRecovery'), async () => {
  if (Date.now() - recoverySentAt < 60000) throw new Error('Espera un minuto antes de pedir otro enlace.');
  await request('/auth/v1/recover?redirect_to=' + encodeURIComponent('https://lspedia.site/miembros/?recuperar=1'), {
    method:'POST',body:JSON.stringify({email:$('recoveryEmail').value.trim()})
  }, false);
  recoverySentAt = Date.now();
  $('recoveryNotice').textContent = 'Si tu correo tiene una cuenta, recibirás un enlace. Revisa también Spam.';
}); });
$('showNewPassword').addEventListener('change', () => {
  const type = $('showNewPassword').checked ? 'text' : 'password'; $('newPassword').type = type; $('confirmPassword').type = type;
});
$('newPasswordForm').addEventListener('submit', e => { e.preventDefault(); run($('savePassword'), async () => {
  if (!recoverySession || recoverySession.expires_at <= Date.now()) { lock('El enlace venció. Solicita otro.'); return; }
  const password = $('newPassword').value;
  if (password.length < 8) throw new Error('Usa al menos 8 caracteres.');
  if (password !== $('confirmPassword').value) throw new Error('Las contraseñas no coinciden.');
  const token = recoverySession.access_token;
  await request('/auth/v1/user', {method:'PUT',headers:{Authorization:'Bearer '+token},body:JSON.stringify({password})}, false);
  lock('Contraseña guardada. Ingresa con tu nueva contraseña.');
  await fetch(base+'/auth/v1/logout', {method:'POST',headers:{apikey:config.publishableKey,Authorization:'Bearer '+token},cache:'no-store',credentials:'omit'}).catch(()=>{});
  $('email').focus();
}); });
async function receiveRecovery() {
  const fragment = new URLSearchParams(location.hash.slice(1));
  const isRecovery = fragment.get('type') === 'recovery' || new URLSearchParams(location.search).get('recuperar') === '1';
  const hasAuthFragment = fragment.has('access_token') || fragment.has('error');
  if (!isRecovery && !hasAuthFragment) return false;
  // Retirar credenciales de la dirección antes de cualquier consulta.
  history.replaceState(null,'',location.pathname);
  lock(); recovering = true; recoveryScreen('password'); $('savePassword').disabled = true;
  const token = fragment.get('access_token'), duration = Number(fragment.get('expires_in'));
  if (fragment.has('error') || !token || !Number.isFinite(duration) || duration <= 0 || fragment.get('type') !== 'recovery') {
    lock('El enlace no es válido o venció. Solicita otro.'); return true;
  }
  try {
    const user = await request('/auth/v1/user', {headers:{Authorization:'Bearer '+token}}, false);
    if (!user?.id) throw new Error('Invalid recovery');
    if (!recovering) return true;
    recoverySession = {access_token:token,expires_at:Date.now()+duration*1000};
    $('savePassword').disabled = false; $('newPassword').focus();
  } catch (_) { if (recovering) lock('El enlace no es válido o venció. Solicita otro.'); }
  return true;
}
$('showPassword').addEventListener('click', () => { const show = $('password').type === 'password'; $('password').type = show ? 'text' : 'password'; $('showPassword').setAttribute('aria-label',show ? 'Ocultar contraseña' : 'Mostrar contraseña'); $('showPassword').title = show ? 'Ocultar contraseña' : 'Mostrar contraseña'; $('showPassword').setAttribute('aria-pressed',String(show)); });
$('logout').addEventListener('click', async () => { const token = session?.access_token; lock(); if (token) await fetch(base + '/auth/v1/logout', {method:'POST',headers:{apikey:config.publishableKey,Authorization:'Bearer ' + token},cache:'no-store'}).catch(() => {}); });
$('openFavorites').addEventListener('click',()=>openSection('@favorites'));
$('openRecent').addEventListener('click',()=>openSection('@recent'));
$('playerFavorite').addEventListener('click',()=>{if(activeVideo)toggleFavorite(activeVideo);});
$('playerShare').addEventListener('click',()=>run($('playerShare'),()=>activeVideo && shareVideo(activeVideo)));
$('shareClose').addEventListener('click',()=>$('shareDialog').close());
$('search').addEventListener('input', () => { state().search = $('search').value; renderVideos(); });
$('clearSearch').addEventListener('click', () => { state().search = ''; renderVideos(); $('search').focus(); });
$('sortOrder').addEventListener('change', () => { state().order = $('sortOrder').value; renderVideos(); });
$('alphabetToggle').addEventListener('click', () => { $('alphabet').hidden = !$('alphabet').hidden; $('alphabetToggle').setAttribute('aria-expanded',String(!$('alphabet').hidden)); });
const contributionUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfbOQn5ZaVy0uP9sIQnqv4QJlhjYj8lHy-UiUU1whHAXZW4Bg/viewform';
$('contributionLink').href = contributionUrl;
$('contribute').addEventListener('click', () => run($('contribute'), async () => { if (!await membership()) return; $('contributionDialog').showModal(); }));
$('contributionClose').addEventListener('click', () => $('contributionDialog').close());
$('playerClose').addEventListener('click', clearPlayer); $('player').addEventListener('close', () => $('embed').replaceChildren());
$('adminToggle').addEventListener('click', () => run($('adminToggle'), async () => { if (!await membership() || profile.role !== 'admin') return; $('library').hidden = true; $('admin').hidden = false; renderNavigation(); await loadUsers(); }));
$('adminClose').addEventListener('click', () => { $('admin').hidden = true; $('library').hidden = false; resetEditor(); renderNavigation(); });
$('refreshUsers').addEventListener('click', () => run($('refreshUsers'), loadUsers));
$('cancelEdit').addEventListener('click', resetEditor);
$('contentForm').addEventListener('submit', e => { e.preventDefault(); run(e.submitter, async () => {
  const f = e.target, id = $('contentId').value, youtube = youtubeId(f.elements.youtube_url.value.trim());
  if (!youtube) throw new Error('Usa un enlace válido de YouTube (video, Shorts o youtu.be).');
  const title = f.elements.title.value.trim(); if (!title) throw new Error('Escribe un título para el video.');
  const section = categories.find(c=>c.id===f.elements.category_id.value)?.title;
  if (!section) throw new Error('Selecciona una sección.');
  const body = {word:title,section,video_url:'https://www.youtube.com/watch?v='+youtube,description:f.elements.description.value.trim(),variants:f.elements.keywords.value.split(',').map(v=>v.trim()).filter(Boolean),published:f.elements.published.checked};
  await request('/rest/v1/lsp_content' + (id ? '?id=eq.' + id : ''), {method:id ? 'PATCH' : 'POST',body:JSON.stringify(body)});
  resetEditor(); await loadLibrary(); $('library').hidden = true; status('Video guardado.');
}); });
$('categoryForm').addEventListener('submit', e => { e.preventDefault(); run(e.submitter, async () => {
  const f = e.target, title = f.elements.title.value.trim(); if (!title) throw new Error('Escribe el nombre de la sección.');
  await request('/rest/v1/lsp_member_categories', {method:'POST',body:JSON.stringify({title,description:f.elements.description.value.trim(),position:categories.length + 1})});
  f.reset(); await loadLibrary(); $('library').hidden = true; status('Sección creada.');
}); });
if (!ready) {
  $('forgotPassword').disabled = true; $('sendRecovery').disabled = true; $('loginButton').disabled = true; $('email').disabled = true; $('password').disabled = true;
  status('La zona de miembros está en preparación. El acceso se habilitará cuando esté lista.');
} else {
  receiveRecovery().then(handled => { if (handled) return;
  try { const saved = JSON.parse(sessionStorage.getItem(key) || 'null'); if (saved?.access_token && saved?.user?.id && saved.expires_at > Date.now()) session = saved; } catch (_) {}
  if (session) {readPersonal();loadLibrary().catch(error => lock(error.message));}
  });
  setInterval(() => { if (session && !recovering) membership().catch(error => lock(error.message)); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && session && !recovering) loadLibrary().catch(error => lock(error.message)); });
}
})();

