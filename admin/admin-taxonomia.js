/* LSPedia Admin — organización inteligente por grupos y etiquetas. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const txt=v=>String(v==null?'':v).trim();
  const norm=v=>txt(v).toLocaleLowerCase('es-PE').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function estilos(){
    if($('adminTaxonomiaCss'))return;
    const s=document.createElement('style');s.id='adminTaxonomiaCss';
    s.textContent='\
#organizacion .tax-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}\
#organizacion .tax-kpi{padding:16px}.tax-kpi span{display:block;color:#64748b;font-size:.76rem;font-weight:700}.tax-kpi strong{display:block;margin-top:4px;font-size:1.55rem;color:#0f172a}.tax-kpi small{color:#64748b}\
#organizacion .tax-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.tax-group{padding:15px}.tax-group-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.tax-group-title{font-weight:800;color:#172033}.tax-group-desc{margin-top:4px;color:#64748b;font-size:.78rem;line-height:1.4}.tax-group-count{white-space:nowrap;font-weight:800;color:#0f3a70;background:#eef6ff;border-radius:999px;padding:5px 8px;font-size:.74rem}.tax-cats{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}.tax-cat{padding:5px 8px;border:1px solid #dbe5ef;border-radius:999px;background:#f8fafc;color:#475569;font-size:.72rem}.tax-warning{margin-top:14px;padding:13px 14px;border:1px solid #f5d58b;border-radius:13px;background:#fff9e9;color:#7c5a0a;font-size:.82rem}.tax-ok{border-color:#bfe6ce;background:#f1fbf4;color:#17653b}\
@media(max-width:760px){#organizacion .tax-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#organizacion .tax-groups{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  function asegurarSeccion(){
    let sec=$('organizacion');if(sec)return sec;
    const referencia=$('embudo')||$('salud')||$('acciones');
    if(!referencia||!referencia.parentNode)return null;
    sec=document.createElement('section');sec.id='organizacion';sec.className='section-block';
    sec.innerHTML='<div class="section-head"><div><span class="section-kicker">ORGANIZACIÓN</span><h2>🧭 Organización inteligente</h2><p>Grupos temáticos, cobertura de categorías y etiquetas de búsqueda.</p></div><button id="btnTaxRefresh" class="btn btn-soft btn-small" type="button">↻ Actualizar</button></div><div id="taxAdminContenido"><div class="skeleton h130"></div></div>';
    referencia.parentNode.insertBefore(sec,referencia);
    $('btnTaxRefresh').addEventListener('click',cargar);
    return sec;
  }

  async function json(url){const r=await fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error(url+' · HTTP '+r.status);return r.json();}
  function configCategoria(tax,nombre){
    const cats=tax&&tax.categorias&&typeof tax.categorias==='object'?tax.categorias:{};
    const k=norm(nombre);for(const [n,cfg] of Object.entries(cats))if(norm(n)===k)return cfg||{};return null;
  }
  function grupoDe(tax,p){
    const cfg=configCategoria(tax,p&&p.categoria);
    return txt(cfg&&cfg.grupo)||txt(p&&p.grupo)||'Otros';
  }
  function etiquetasDe(tax,p){
    const cfg=configCategoria(tax,p&&p.categoria);
    const base=Array.isArray(cfg&&cfg.etiquetas)?cfg.etiquetas:[];
    const manual=Array.isArray(p&&p.etiquetas)?p.etiquetas:txt(p&&p.etiquetas).split(/[,;|]/);
    return [...new Set(base.concat(manual).map(txt).filter(Boolean).map(x=>x.toLocaleLowerCase('es-PE')))];
  }

  function render(tax,dic,voc){
    const caja=$('taxAdminContenido');if(!caja)return;
    const datos=[...(Array.isArray(dic)?dic:[]),...(Array.isArray(voc)?voc:[])].filter(x=>x&&x.palabra);
    const categorias=[...new Set(datos.map(x=>txt(x.categoria)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    const noMapeadas=categorias.filter(c=>!configCategoria(tax,c));
    const conEtiquetas=datos.filter(p=>etiquetasDe(tax,p).length>0).length;
    const grupos=Array.isArray(tax&&tax.grupos)?tax.grupos:[];
    const conteoGrupo=new Map();
    datos.forEach(p=>{const g=grupoDe(tax,p);conteoGrupo.set(norm(g),(conteoGrupo.get(norm(g))||0)+1);});

    const tarjetas=grupos.filter(g=>norm(g.nombre)!=='otros'||conteoGrupo.get('otros')).map(g=>{
      const cats=categorias.filter(c=>norm((configCategoria(tax,c)||{}).grupo||'Otros')===norm(g.nombre));
      return '<article class="card tax-group"><div class="tax-group-head"><div><div class="tax-group-title">'+esc(g.icono||'🧩')+' '+esc(g.nombre)+'</div><div class="tax-group-desc">'+esc(g.descripcion||'')+'</div></div><span class="tax-group-count">'+(conteoGrupo.get(norm(g.nombre))||0)+' palabras</span></div><div class="tax-cats">'+cats.map(c=>'<span class="tax-cat">'+esc(c)+'</span>').join('')+'</div></article>';
    }).join('');

    caja.innerHTML='<div class="tax-summary">'+
      '<article class="card tax-kpi"><span>Grupos activos</span><strong>'+grupos.filter(g=>(conteoGrupo.get(norm(g.nombre))||0)>0).length+'</strong><small>macrotemas con contenido</small></article>'+
      '<article class="card tax-kpi"><span>Categorías</span><strong>'+categorias.length+'</strong><small>entre Diccionario y Vocabulario</small></article>'+
      '<article class="card tax-kpi"><span>Con etiquetas</span><strong>'+conEtiquetas+'</strong><small>de '+datos.length+' fichas clasificables</small></article>'+
      '<article class="card tax-kpi"><span>Sin grupo definido</span><strong>'+noMapeadas.length+'</strong><small>categorías por revisar</small></article>'+
      '</div><div class="tax-groups">'+tarjetas+'</div>'+
      (noMapeadas.length?'<div class="tax-warning"><b>⚠ Categorías nuevas sin mapa:</b> '+noMapeadas.map(esc).join(', ')+'. Se muestran temporalmente en “Otros” hasta asignarlas.</div>':'<div class="tax-warning tax-ok"><b>✓ Taxonomía consistente:</b> todas las categorías públicas tienen un grupo definido.</div>');
  }

  async function cargar(){
    asegurarSeccion();const caja=$('taxAdminContenido');if(caja)caja.innerHTML='<div class="skeleton h130"></div>';
    try{
      const [tax,dic,voc]=await Promise.all([json('../data/taxonomia.json'),json('../data/palabras.json'),json('../data/vocabulario.json')]);
      render(tax,dic,voc);
    }catch(e){if(caja)caja.innerHTML='<div class="notice notice-warning">No se pudo cargar la organización inteligente: '+esc(e.message||e)+'</div>';}
  }

  function iniciar(){estilos();asegurarSeccion();cargar();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
