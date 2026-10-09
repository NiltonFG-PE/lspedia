/* La interfaz no concede permisos: cada lectura/escritura depende de RLS. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const config = window.LSPEDIA_MIEMBROS || {};
const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl || '') && Boolean(config.publishableKey);
const base = (config.supabaseUrl || '').replace(/\/$/, '');
const key = 'lspedia_members_session_v1';
let session = null, profile = null, categories = [], content = [], selected = '', generation = 0;
const text = (tag, value, cls) => { const el = document.createElement(tag); el.textContent = value; if (cls) el.className = cls; return el; };
function status(message = '') { $('status').textContent = message; }
function clearPlayer() { $('embed').replaceChildren(); if ($('player').open) $('player').close(); }
function lock(message = '') {
  generation++; session = null; profile = null; content = []; categories = []; selected = '';
  try { sessionStorage.removeItem(key); } catch (_) {}
  clearPlayer(); $('library').hidden = true; $('admin').hidden = true; $('logout').hidden = true; $('loginPanel').hidden = false;
  $('videos').replaceChildren(); $('categories').replaceChildren(); $('adminVideos').replaceChildren(); $('users').replaceChildren();
  $('contentForm').reset(); $('contentId').value = ''; $('adminToggle').hidden = true; status(message);
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
  const rows = await request('/rest/v1/lsp_members?select=role,status&user_id=eq.' + encodeURIComponent(session.user.id));
  if (!rows?.[0] || rows[0].status !== 'active') { lock('Tu cuenta aún no tiene acceso o ha sido suspendida. Contacta al administrador de LSPedia.'); return false; }
  profile = rows[0]; return true;
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
    request('/rest/v1/lsp_member_content?select=*&order=created_at.desc')
  ]);
  if (current !== generation) return;
  categories = newCategories || []; content = newContent || [];
  if (!categories.some(c => c.id === selected)) selected = categories[0]?.id || '';
  $('loginPanel').hidden = true; $('library').hidden = adminWasOpen && profile.role === 'admin'; $('admin').hidden = !adminWasOpen || profile.role !== 'admin'; $('logout').hidden = false;
  $('adminToggle').hidden = profile.role !== 'admin'; renderCategories(); renderVideos();
  if (profile.role === 'admin') renderAdmin();
}
function renderCategories() {
  $('categories').replaceChildren();
  for (const category of categories) {
    const el = button('', () => { selected = category.id; $('search').value = ''; renderCategories(); renderVideos(); });
    el.className = 'category'; el.setAttribute('aria-pressed', String(selected === category.id));
    el.append(text('b', category.title), text('small', content.filter(v => v.category_id === category.id && visible(v)).length + ' videos')); $('categories').append(el);
  }
}
function renderVideos() {
  const category = categories.find(c => c.id === selected);
  $('categoryTitle').textContent = category?.title || 'Biblioteca'; $('categoryDescription').textContent = category?.description || '';
  $('searchLabel').textContent = 'Buscar en ' + (category?.title || 'esta sección');
  const terms = normalize($('search').value).split(/\s+/).filter(Boolean);
  const videos = content.filter(v => v.category_id === selected && visible(v) && terms.every(term => normalize([v.title,v.description,v.keywords,v.variants,v.topic].join(' ')).includes(term)));
  $('videos').replaceChildren(); $('resultCount').textContent = videos.length ? videos.length + ' resultados' : terms.length ? 'No encontramos videos con esa búsqueda.' : 'Pronto encontrarás contenido en esta sección.';
  for (const video of videos) {
    const el = button('', () => play(video)); el.className = 'video';
    const image = document.createElement('img');
    const fallback = 'https://i.ytimg.com/vi/' + video.youtube_id + '/hqdefault.jpg';
    const supplied = String(video.image_url || '');
    image.src = /^https:\/\//.test(supplied) ? supplied : /^img\//.test(supplied) ? 'https://lspedia.site/' + supplied : fallback;
    image.addEventListener('error', () => { image.src = fallback; }, {once:true});
    image.alt = ''; image.loading = 'lazy';
    el.append(image, text('b', video.title), text('p', video.description || 'Ver video')); $('videos').append(el);
  }
}
async function play(video) {
  if (!await membership()) return;
  // Reconsultar permite detectar un video retirado desde que se abrió la biblioteca.
  const rows = await request('/rest/v1/lsp_member_content?select=title,youtube_id&id=eq.' + video.id + '&published=eq.true');
  if (!rows?.[0]) { await loadLibrary(); throw new Error('Este video ya no está disponible.'); }
  clearPlayer(); $('playerTitle').textContent = rows[0].title;
  const frame = document.createElement('iframe'); frame.title = rows[0].title; frame.src = 'https://www.youtube-nocookie.com/embed/' + rows[0].youtube_id;
  frame.allow = 'encrypted-media; picture-in-picture; fullscreen'; frame.allowFullscreen = true; frame.referrerPolicy = 'strict-origin-when-cross-origin';
  $('embed').append(frame); $('player').showModal();
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
      await request('/rest/v1/lsp_member_content?id=eq.' + video.id, {method:'DELETE'}); await loadLibrary();
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
  try { sessionStorage.setItem(key, JSON.stringify(session)); } catch (_) {}
  try { await loadLibrary(); } catch (error) { lock(error.message); }
}); });
$('showPassword').addEventListener('click', () => { const show = $('password').type === 'password'; $('password').type = show ? 'text' : 'password'; $('showPassword').textContent = show ? 'Ocultar' : 'Mostrar'; $('showPassword').setAttribute('aria-pressed',String(show)); });
$('logout').addEventListener('click', async () => { const token = session?.access_token; lock(); if (token) await fetch(base + '/auth/v1/logout', {method:'POST',headers:{apikey:config.publishableKey,Authorization:'Bearer ' + token},cache:'no-store'}).catch(() => {}); });
$('search').addEventListener('input', renderVideos);
$('playerClose').addEventListener('click', clearPlayer); $('player').addEventListener('close', () => $('embed').replaceChildren());
$('adminToggle').addEventListener('click', () => run($('adminToggle'), async () => { if (!await membership() || profile.role !== 'admin') return; $('library').hidden = true; $('admin').hidden = false; await loadUsers(); }));
$('adminClose').addEventListener('click', () => { $('admin').hidden = true; $('library').hidden = false; resetEditor(); });
$('refreshUsers').addEventListener('click', () => run($('refreshUsers'), loadUsers));
$('cancelEdit').addEventListener('click', resetEditor);
$('contentForm').addEventListener('submit', e => { e.preventDefault(); run(e.submitter, async () => {
  const f = e.target, id = $('contentId').value, youtube = youtubeId(f.elements.youtube_url.value.trim());
  if (!youtube) throw new Error('Usa un enlace válido de YouTube (video, Shorts o youtu.be).');
  const title = f.elements.title.value.trim(); if (!title) throw new Error('Escribe un título para el video.');
  const body = {title,category_id:f.elements.category_id.value,youtube_id:youtube,description:f.elements.description.value.trim(),keywords:f.elements.keywords.value.trim(),published:f.elements.published.checked};
  await request('/rest/v1/lsp_member_content' + (id ? '?id=eq.' + id : ''), {method:id ? 'PATCH' : 'POST',body:JSON.stringify(body)});
  resetEditor(); await loadLibrary(); $('library').hidden = true; status('Video guardado.');
}); });
$('categoryForm').addEventListener('submit', e => { e.preventDefault(); run(e.submitter, async () => {
  const f = e.target, title = f.elements.title.value.trim(); if (!title) throw new Error('Escribe el nombre de la sección.');
  await request('/rest/v1/lsp_member_categories', {method:'POST',body:JSON.stringify({title,description:f.elements.description.value.trim(),position:categories.length + 1})});
  f.reset(); await loadLibrary(); $('library').hidden = true; status('Sección creada.');
}); });
if (!ready) {
  $('loginButton').disabled = true; $('email').disabled = true; $('password').disabled = true;
  status('La zona de miembros está en preparación. El acceso se habilitará cuando esté lista.');
} else {
  try { const saved = JSON.parse(sessionStorage.getItem(key) || 'null'); if (saved?.access_token && saved?.user?.id && saved.expires_at > Date.now()) session = saved; } catch (_) {}
  if (session) loadLibrary().catch(error => lock(error.message));
  setInterval(() => { if (session) membership().catch(error => lock(error.message)); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && session) loadLibrary().catch(error => lock(error.message)); });
}
})();
