/* LSPedia WEB editable — datos administrados desde Publicador.
   Esta capa modifica contenido sin destruir la presentación rica integrada. */
(function(){
'use strict';

let CFG=null;
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
const tx=v=>String(v==null?'':v).replace(/[\u0000-\u001F\u007F]/g,' ').trim();
const ml=v=>String(v==null?'':v).replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim();
const at=(o,p)=>p.reduce((a,k)=>a&&typeof a==='object'?a[k]:undefined,o);

function recurso(v){v=tx(v);return v&&!/^(?:javascript|vbscript|data)\s*:/i.test(v)?v:'';}
function enlace(v){v=tx(v);return v&&/^(?:https?:\/\/|mailto:|tel:|\/|#)/i.test(v)&&!/^(?:javascript|vbscript|data)/i.test(v)?v:'';}
function video(r){return /\.(?:webm|mp4)(?:[?#].*)?$/i.test(String(r||''));}
function yt(v){v=tx(v);let m=v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i);return m?m[1]:(/^[\w-]{11}$/.test(v)?v:'');}

function media(el,r,opt={}){
  r=recurso(r);if(!el||!r)return el;
  const want=video(r)?'video':'img',cur=el.tagName.toLowerCase();let n=el;
  if(cur!==want){
    n=document.createElement(want);
    Array.from(el.attributes).forEach(a=>{if(!/^(src|poster|autoplay|loop|muted|playsinline|disablepictureinpicture)$/i.test(a.name))n.setAttribute(a.name,a.value)});
    el.replaceWith(n);
  }
  if(want==='video'){
    if(n.getAttribute('src')!==r)n.src=r;
    n.autoplay=true;n.loop=true;n.muted=true;n.playsInline=true;
    ['autoplay','loop','muted','playsinline','disablepictureinpicture'].forEach(a=>n.setAttribute(a,''));
    try{n.load();const p=n.play();if(p&&p.catch)p.catch(()=>{});}catch(_e){}
  }else if(n.getAttribute('src')!==r){n.src=r;}
  if(opt.alt)n.alt=opt.alt;
  if(opt.aria)n.setAttribute('aria-label',opt.aria);
  return n;
}

function mask(el,r){r=recurso(r);if(!el||!r)return;const u='url("'+r.replace(/"/g,'%22')+'")';if(el.style.webkitMaskImage!==u)el.style.webkitMaskImage=u;if(el.style.maskImage!==u)el.style.maskImage=u;}
function label(a,t){if(!a||!t)return;let s=q('.web-nav-label',a);if(!s){Array.from(a.childNodes).filter(n=>n.nodeType===3).forEach(n=>n.remove());s=document.createElement('span');s.className='web-nav-label';a.appendChild(s);}if(s.textContent!==t)s.textContent=t;}
function textoEquivalente(a,b){return String(a||'').replace(/\s+/g,' ').trim()===String(b||'').replace(/\s+/g,' ').trim();}

function aplicarLogo(){const r=at(CFG,['header','logo']),a=q('#btnLogo');if(a&&r){const e=q('video,img',a);if(e)media(e,r,{alt:'LSPedia',aria:'Logo LSPedia'});}}
const MEN={diccionario:'btnInicio',vocabulario:'btnCategorias',herramientas:'btnHerramientas',nosotros:'btnSobreNosotros'};
function aplicarMenu(){const m=at(CFG,['header','menu'])||{};Object.keys(MEN).forEach(k=>{const x=m[k]||{},id=MEN[k],a=document.getElementById(id),t=tx(x.texto);if(a){if(t)label(a,t);mask(q('.nav-icono',a),x.icono);}const b=q('.mobile-bottom-nav .mbn-item[data-vinculado="'+id+'"]');if(b){const l=q('.mbn-label',b);if(l&&t&&l.textContent!==t)l.textContent=t;mask(q('.mbn-icon-img',b),x.icono);}});}

function titulo(el,tipo,t){
  if(!el||!t)return;
  const actual=el.textContent.replace(/\s+/g,' ').trim();
  if(actual===t.replace(/\s+/g,' ').trim())return;
  el.textContent='';
  const p=t.split(/\s+/).filter(Boolean),n=tipo==='diccionario'&&p.length>1?2:1,s=document.createElement('span');
  s.className='titulo-acento';s.textContent=p.slice(0,n).join(' ');el.appendChild(s);
  if(p.length>n)el.appendChild(document.createTextNode(' '+p.slice(n).join(' ')));
}

function agregarResaltado(el,texto,frase,color){
  texto=String(texto||'');frase=String(frase||'');
  const idx=texto.toLocaleLowerCase('es').indexOf(frase.toLocaleLowerCase('es'));
  if(idx<0){el.appendChild(document.createTextNode(texto));return;}
  if(idx>0)el.appendChild(document.createTextNode(texto.slice(0,idx)));
  const st=document.createElement('strong');st.textContent=texto.slice(idx,idx+frase.length);st.style.fontWeight='700';if(color)st.style.color=color;el.appendChild(st);
  if(idx+frase.length<texto.length)el.appendChild(document.createTextNode(texto.slice(idx+frase.length)));
}

function subDic(t){
  const c=q('#subtituloPrincipal');if(!c||!t)return;
  if(window.LSPediaMision){
    const html=window.LSPediaMision.html(null,t);
    if(c.innerHTML!==html)c.innerHTML=html;
    return;
  }
  // Respaldo para páginas sin el renderizador compartido, siempre como texto seguro.
  const d=document.createElement('div');d.className='aviso-mision-texto';
  t.split('\n').map(x=>x.trim()).filter(Boolean).forEach((linea,i)=>{
    const p=document.createElement('p');
    p.className=i===0?'aviso-mision-linea1':/^ℹ/.test(linea)?'aviso-mision-linea2':'aviso-mision-publico';
    p.textContent=linea;d.appendChild(p);
  });
  c.replaceChildren(d);
}

function subVoc(t){
  const c=q('#vocabularioIntroLista');if(!c||!t)return;
  let ls=t.split('\n').map(x=>x.trim()).filter(Boolean);
  if(!ls.length)return;
  // Recupera el texto original de la cuarta idea cuando la configuración
  // todavía contiene el reemplazo plano introducido en V27.
  ls=ls.map(x=>x==='El aprendizaje también requiere contacto con personas sordas.'?'No basta aprender vocabulario, también requiere contacto con personas sordas.':x);
  const firma=ls.join('|');if(c.dataset.webRichFirma===firma)return;
  const iconos=['🔎','💡','🌎','🤝','🧩','✨'];
  const resaltar=['referencia','conceptos','variantes regionales','requiere contacto'];
  let items=qa('.vocab-intro-item',c);
  while(items.length<ls.length){const d=document.createElement('div');d.className='vocab-intro-item';const i=document.createElement('span');i.className='vocab-intro-icono';i.setAttribute('aria-hidden','true');const p=document.createElement('p');p.className='vocab-intro-texto';d.append(i,p);c.appendChild(d);items.push(d);}
  items.forEach((d,i)=>{
    d.style.display=i<ls.length?'':'none';if(i>=ls.length)return;
    const ic=q('.vocab-intro-icono',d),p=q('.vocab-intro-texto',d);if(ic)ic.textContent=iconos[i%iconos.length];if(!p)return;
    p.textContent='';agregarResaltado(p,ls[i],resaltar[i]||'','#2563eb');
  });
  c.dataset.webRichFirma=firma;
}

function vista(){const b=q('#btnCategorias');return b&&b.classList.contains('active')?'vocabulario':'diccionario';}
function aplicarHero(tipo=vista()){
  const h=at(CFG,['heroes',tipo])||{},t=tx(h.titulo),s=ml(h.subtitulo);
  if(t)titulo(q('#tituloPrincipal'),tipo,t);
  if(tipo==='vocabulario'){if(s)subVoc(s);}else if(s)subDic(s);
  const a=q('#colAvatarHero .avatar-hero-img');if(a&&h.avatar)media(a,h.avatar,{alt:'Personaje visual de LSPedia',aria:'Personaje visual de LSPedia'});
}

function aplicarRedes(){const s=at(CFG,['social'])||{};['tiktok','instagram','youtube','facebook'].forEach(k=>{const u=enlace(s[k]);if(!u)return;qa('.footer-red-'+k+',.stat2-red-'+k).forEach(a=>{if(a.tagName==='A'){if(a.href!==u)a.href=u;a.target='_blank';a.rel='noopener noreferrer';}});});}

const ACC={sugerir:['.nosotros-apoyo-card-sugerencia','#modalSugerencia'],idea:['.nosotros-apoyo-card-idea','#modalEnviarIdea'],apoyar:['.nosotros-apoyo-card-donacion','#modalDonacion'],interprete:['.nosotros-apoyo-card-interprete','#modalInterprete']};
function abrir(u){if(/^https?:\/\//i.test(u))window.open(u,'_blank','noopener,noreferrer');else location.href=u;}
function aplicarAcciones(){const a=at(CFG,['acciones'])||{};Object.keys(ACC).forEach(k=>{const x=a[k]||{},u=enlace(x.url),n=tx(x.nombre),d=ml(x.contenido);qa(ACC[k][0]).forEach(c=>{const ti=q('.nosotros-apoyo-titulo',c),de=q('.nosotros-apoyo-desc',c);if(n&&ti&&ti.textContent!==n)ti.textContent=n;if(d&&de&&de.textContent!==d)de.textContent=d;if(u){c.removeAttribute('data-bs-toggle');c.removeAttribute('data-bs-target');c.dataset.webHref=u;c.setAttribute('role','link');}else{c.setAttribute('data-bs-toggle','modal');c.setAttribute('data-bs-target',ACC[k][1]);delete c.dataset.webHref;c.setAttribute('role','button');}if(!c.dataset.webListener){c.dataset.webListener='1';c.addEventListener('click',e=>{const z=c.dataset.webHref;if(!z)return;e.preventDefault();e.stopImmediatePropagation();abrir(z);},true);c.addEventListener('keydown',e=>{const z=c.dataset.webHref;if(z&&(e.key==='Enter'||e.key===' ')){e.preventDefault();abrir(z);}});}});});}

function p(txt){const e=document.createElement('p');e.className='text-secondary mb-3';e.style.lineHeight='1.7';e.textContent=txt;return e;}
function contenido(c,t){t=ml(t);if(!c||!t||textoEquivalente(c.textContent,t))return;c.textContent='';let par=[],ul=null;function flush(){const z=par.join(' ').trim();if(z)c.appendChild(p(z));par=[];}t.split('\n').forEach(l=>{l=l.trim();if(!l){flush();ul=null;return;}if(/^(?:[-•]|\d+[.)])\s+/.test(l)){flush();if(!ul){ul=document.createElement('ul');ul.className='text-secondary mb-4';ul.style.lineHeight='1.9';c.appendChild(ul);}const li=document.createElement('li');li.textContent=l.replace(/^(?:[-•]|\d+[.)])\s+/,'');ul.appendChild(li);}else{ul=null;par.push(l);}});flush();}
function nuevoBloque(){const r=q('#nosotrosApoyoRow');if(!r||!r.parentNode)return null;const h=document.createElement('h4'),b=document.createElement('div');h.className='nosotros-titulo-clicable fw-bold mb-3';b.className='nosotros-bloque-clicable';[h,b].forEach(e=>{e.setAttribute('role','button');e.setAttribute('tabindex','0');r.parentNode.insertBefore(e,r);});return[h,b];}
function aplicarNosotros(){const s=at(CFG,['nosotros','secciones']);if(!Array.isArray(s)||!s.length)return;const r=q('#nosotrosTextoBajoVideo');if(!r)return;let hs=qa(':scope > .nosotros-titulo-clicable[data-tiempo-nosotros]',r);while(hs.length<s.length){const z=nuevoBloque();if(!z)break;hs.push(z[0]);}hs.forEach((h,i)=>{const x=s[i],b0=h.nextElementSibling;if(!x){h.style.display='none';if(b0&&b0.classList.contains('nosotros-bloque-clicable'))b0.style.display='none';return;}const sec=String(Math.max(0,Math.round(Number(x.tiempo)||0)));h.style.display='';h.dataset.tiempoNosotros=sec;const nom=tx(x.titulo);if(nom&&!textoEquivalente(h.textContent,nom))h.textContent=nom;let b=b0;if(!b||!b.classList.contains('nosotros-bloque-clicable')){b=document.createElement('div');b.className='nosotros-bloque-clicable';h.after(b);}b.style.display='';b.dataset.tiempoNosotros=sec;b.setAttribute('role','button');b.setAttribute('tabindex','0');contenido(b,x.contenido);});}
function cambiarVideoNosotros(intentos=50){const id=yt(at(CFG,['nosotros','video']));if(!id)return;try{if(typeof ytPlayerNosotros!=='undefined'&&ytPlayerNosotros&&typeof ytPlayerNosotros.getVideoData==='function'){const a=(ytPlayerNosotros.getVideoData()||{}).video_id||'';if(a!==id&&typeof ytPlayerNosotros.loadVideoById==='function')ytPlayerNosotros.loadVideoById(id);return;}}catch(_e){}if(intentos>0)setTimeout(()=>cambiarVideoNosotros(intentos-1),120);}

function asegurarEstilosPrivacidad(){if(q('#lspedia-privacidad-form-style'))return;const s=document.createElement('style');s.id='lspedia-privacidad-form-style';s.textContent='.lsp-privacy-form-notice{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:#eff6ff;border-bottom:1px solid #bfdbfe;color:#334155;font-size:12.5px;line-height:1.45}.lsp-privacy-form-notice strong{color:#0f172a}.lsp-privacy-form-notice a{color:#0b6fdc;font-weight:700;text-decoration:underline}.lsp-privacy-form-icon{font-size:18px;line-height:1.2;flex:0 0 auto}';document.head.appendChild(s);}
function aplicarLegalPrivacidad(){
  const a=q('.footer-link-licencia');if(a){a.href='licencia.html';a.setAttribute('aria-label','Legal y privacidad de LSPedia');let cambiado=false;Array.from(a.childNodes).forEach(n=>{if(n.nodeType===3&&String(n.textContent||'').trim()){if(n.textContent!==' Legal y privacidad ')n.textContent=' Legal y privacidad ';cambiado=true;}});if(!cambiado){const t=document.createElement('span');t.textContent='Legal y privacidad';a.insertBefore(t,a.firstChild);}}
  asegurarEstilosPrivacidad();
  [['#modalSugerencia','Sugerir palabra'],['#modalEnviarIdea','Enviar una idea']].forEach(([sel,nombre])=>{const body=q(sel+' .modal-body'),iframe=body?q('iframe',body):null;if(!body||!iframe||q('.lsp-privacy-form-notice',body))return;const n=document.createElement('div');n.className='lsp-privacy-form-notice';const ic=document.createElement('span');ic.className='lsp-privacy-form-icon';ic.setAttribute('aria-hidden','true');ic.textContent='🛡️';const d=document.createElement('div');const st=document.createElement('strong');st.textContent='Privacidad antes de enviar. ';const txt=document.createTextNode('Este formulario puede guardar tus respuestas mediante Google Forms/Sheets. Evita datos sensibles que no sean necesarios. ');const l=document.createElement('a');l.href='licencia.html#formularios';l.target='_blank';l.rel='noopener';l.textContent='Ver Legal y privacidad';d.append(st,txt,l);n.append(ic,d);body.insertBefore(n,iframe);iframe.setAttribute('title','Formulario de '+nombre+' de LSPedia');});
}

function aplicar(){aplicarLegalPrivacidad();if(!CFG)return;aplicarLogo();aplicarMenu();aplicarRedes();aplicarAcciones();aplicarNosotros();aplicarHero();document.documentElement.dataset.webConfigLspedia='1';}
function navegacion(){['btnInicio','btnCategorias'].forEach(id=>{const e=document.getElementById(id);if(e&&!e.dataset.webHeroListener){e.dataset.webHeroListener='1';e.addEventListener('click',()=>{const t=id==='btnCategorias'?'vocabulario':'diccionario';setTimeout(()=>aplicarHero(t),80);setTimeout(()=>aplicarHero(t),350);});}});const n=q('#btnSobreNosotros');if(n&&!n.dataset.webVideoListener){n.dataset.webVideoListener='1';n.addEventListener('click',()=>setTimeout(()=>cambiarVideoNosotros(),250));}window.addEventListener('popstate',()=>setTimeout(()=>{aplicarHero();cambiarVideoNosotros();},200),{passive:true});}
async function cargar(){aplicarLegalPrivacidad();try{const u='data/web-config.json?v='+Date.now();let d;if(window.LSPediaCore&&LSPediaCore.leerJsonSeguro)d=await LSPediaCore.leerJsonSeguro(u,{timeoutMs:5000,reintentos:0,fetch:{cache:'no-store',credentials:'same-origin'}});else{const r=await fetch(u,{cache:'no-store'});if(!r.ok)return;d=await r.json();}if(!d||typeof d!=='object')return;CFG=d;window.LSPediaWebConfig=d;aplicar();navegacion();setTimeout(aplicar,500);setTimeout(()=>{aplicar();cambiarVideoNosotros();},1500);}catch(e){if(!e||e.status!==404)console.warn('[LSPedia] Configuración WEB no disponible; se conserva el contenido integrado.',e);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cargar,{once:true});else cargar();
})();