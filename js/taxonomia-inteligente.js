/* LSPedia — taxonomía inteligente.
   Añade grupos temáticos y búsqueda semántica ligera sobre las categorías
   existentes sin cambiar su comportamiento ni sus enlaces compartibles. */
(function(){
  'use strict';

  const URL_TAXONOMIA='data/taxonomia.json?v=20260919-2';
  const ESTADO={taxonomia:null,activo:{diccionario:'',vocabulario:''},parchado:false};

  /* Etiquetas visuales cortas: la taxonomía interna conserva sus nombres
     completos, pero la interfaz usa palabras muy fáciles de reconocer. */
  const ETIQUETAS_GRUPO={
    'vida diaria':'Día a día',
    'personas y sociedad':'Personas',
    'salud y bienestar':'Salud',
    'aprendizaje y conocimiento':'Aprender',
    'trabajo y ciudadanía':'Trabajo',
    'tecnología':'Tecnología',
    'naturaleza y mundo':'Naturaleza',
    'ocio y deporte':'Juegos',
    'otros':'Otros'
  };
  const ORDEN_GRUPOS=[
    'vida diaria',
    'personas y sociedad',
    'salud y bienestar',
    'aprendizaje y conocimiento',
    'trabajo y ciudadanía',
    'tecnología',
    'naturaleza y mundo',
    'ocio y deporte',
    'otros'
  ];

  function txt(v){return String(v==null?'':v).trim();}
  function norm(v){return txt(v).toLocaleLowerCase('es-PE').normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function esc(v){return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function lista(v){
    const base=Array.isArray(v)?v:txt(v).split(/[,;|]/);
    const out=[],vistos=new Set();
    base.forEach(x=>{const t=txt(x);const k=norm(t);if(!t||vistos.has(k))return;vistos.add(k);out.push(t);});
    return out.slice(0,12);
  }
  function etiquetaGrupo(nombre){return ETIQUETAS_GRUPO[norm(nombre)]||txt(nombre)||'Otros';}

  function categoriasConfig(){
    const x=ESTADO.taxonomia&&ESTADO.taxonomia.categorias;
    return x&&typeof x==='object'?x:{};
  }
  function gruposConfig(){
    const x=ESTADO.taxonomia&&ESTADO.taxonomia.grupos;
    return Array.isArray(x)?x:[];
  }
  function configCategoria(nombre){
    const k=norm(nombre);
    const categorias=categoriasConfig();
    for(const [n,cfg] of Object.entries(categorias)){
      if(norm(n)===k) return cfg&&typeof cfg==='object'?cfg:null;
    }
    return null;
  }
  function grupoCategoria(nombre,manual){
    const cfg=configCategoria(nombre);
    return txt(cfg&&cfg.grupo)||txt(manual)||'Otros';
  }
  function etiquetasCategoria(nombre,manual){
    const cfg=configCategoria(nombre);
    const out=[],vistos=new Set();
    lista(cfg&&cfg.etiquetas).concat(lista(manual)).forEach(e=>{const k=norm(e);if(!k||vistos.has(k))return;vistos.add(k);out.push(e);});
    return out.slice(0,12);
  }
  function enriquecerRegistro(p){
    if(!p||typeof p!=='object')return p;
    const grupo=grupoCategoria(p.categoria,p.grupo);
    const etiquetas=etiquetasCategoria(p.categoria,p.etiquetas);
    if(!txt(p.grupo)||configCategoria(p.categoria)) p.grupo=grupo;
    p.etiquetas=etiquetas;
    return p;
  }
  function enriquecerBancos(){
    try{if(window.App&&Array.isArray(window.App.datos))window.App.datos.forEach(enriquecerRegistro);}catch(_e){}
    try{
      if(window.QuizV2&&typeof window.QuizV2.obtenerBanco==='function'){
        const banco=window.QuizV2.obtenerBanco();
        if(Array.isArray(banco))banco.forEach(enriquecerRegistro);
      }
    }catch(_e){}
  }

  function categoriasFuente(tipo,panel){
    let datos=[];
    try{
      if(tipo==='diccionario'&&window.App&&Array.isArray(window.App.datos))datos=window.App.datos;
      if(tipo==='vocabulario'&&window.QuizV2&&typeof window.QuizV2.obtenerBanco==='function')datos=window.QuizV2.obtenerBanco()||[];
    }catch(_e){}
    const nombres=[...new Set(datos.map(p=>txt(p&&p.categoria)).filter(Boolean))];
    if(nombres.length)return nombres;
    return [...panel.children].map(el=>nombreCategoriaTarjeta(el,tipo)).filter(Boolean);
  }
  function nombreCategoriaTarjeta(el,tipo){
    if(!el)return'';
    const selector=tipo==='diccionario'?'.categoria-dicc-nombre':'h5';
    const nodo=el.querySelector(selector);
    const nombre=txt(nodo&&nodo.textContent);
    if(!nombre||/ver todas|ver menos/i.test(nombre))return'';
    return nombre;
  }
  function grupoInfo(nombre){
    const k=norm(nombre);
    return gruposConfig().find(g=>norm(g&&g.nombre)===k)||{nombre:nombre||'Otros',icono:'🧩',descripcion:''};
  }
  function gruposUsados(tipo,panel){
    const usados=new Map();
    categoriasFuente(tipo,panel).forEach(cat=>{
      const nombre=grupoCategoria(cat,'Otros');
      const k=norm(nombre);
      if(!usados.has(k))usados.set(k,grupoInfo(nombre));
    });
    const grupos=gruposConfig().filter(g=>usados.has(norm(g.nombre))).concat(
      [...usados.values()].filter(g=>!gruposConfig().some(x=>norm(x.nombre)===norm(g.nombre)))
    );
    return grupos.sort((a,b)=>{
      const ka=norm(a&&a.nombre),kb=norm(b&&b.nombre);
      const ia=ORDEN_GRUPOS.indexOf(ka),ib=ORDEN_GRUPOS.indexOf(kb);
      if(ia<0&&ib<0)return etiquetaGrupo(ka).localeCompare(etiquetaGrupo(kb),'es');
      if(ia<0)return 1;
      if(ib<0)return -1;
      return ia-ib;
    });
  }

  function idToolbar(tipo){return 'lspTaxonomia'+(tipo==='diccionario'?'Diccionario':'Vocabulario');}
  function crearToolbar(tipo,panel){
    let wrap=document.getElementById(idToolbar(tipo));
    if(wrap)return wrap;
    wrap=document.createElement('section');
    wrap.id=idToolbar(tipo);
    wrap.className='lsp-taxonomia-wrap d-none';
    wrap.dataset.tipo=tipo;
    wrap.setAttribute('aria-label','Explorar por grupos temáticos');
    panel.parentNode.insertBefore(wrap,panel);
    return wrap;
  }

  function aplicarFiltro(tipo,panel){
    const activo=ESTADO.activo[tipo]||'';
    let visibles=0,total=0;
    [...panel.children].forEach(el=>{
      const nombre=nombreCategoriaTarjeta(el,tipo);
      const esControl=!nombre;
      if(esControl){
        el.style.display=activo?'none':'';
        return;
      }
      total++;
      const coincide=!activo||norm(grupoCategoria(nombre,''))===norm(activo);
      el.style.display=coincide?'':'none';
      el.dataset.lspGrupo=grupoCategoria(nombre,'');
      if(coincide)visibles++;
    });
    const wrap=document.getElementById(idToolbar(tipo));
    const resumen=wrap&&wrap.querySelector('.lsp-taxonomia-resumen');
    if(resumen){
      resumen.textContent=activo
        ? (visibles===1?'1 categoría en este grupo.':visibles+' categorías en este grupo.')
        : (total===1?'1 categoría disponible.':total+' categorías disponibles.');
    }
    let vacio=wrap&&wrap.querySelector('.lsp-taxonomia-vacio');
    if(activo&&visibles===0){
      if(!vacio){vacio=document.createElement('div');vacio.className='lsp-taxonomia-vacio';wrap.appendChild(vacio);}
      vacio.textContent='No hay contenido aquí todavía.';
    }else if(vacio)vacio.remove();
  }

  function seleccionarGrupo(tipo,panel,nombre){
    ESTADO.activo[tipo]=txt(nombre);
    const wrap=document.getElementById(idToolbar(tipo));
    if(wrap){
      wrap.querySelectorAll('.lsp-taxonomia-chip').forEach(btn=>{
        const activo=norm(btn.dataset.grupo||'')===norm(ESTADO.activo[tipo]);
        btn.classList.toggle('active',activo);
        btn.setAttribute('aria-pressed',activo?'true':'false');
      });
    }

    // El Diccionario enseña solo cinco categorías al inicio. Al elegir un
    // grupo se expande una vez mediante el control existente para que el
    // filtro pueda trabajar con la lista completa, sin duplicar la lógica.
    if(tipo==='diccionario'&&ESTADO.activo[tipo]){
      const verTodas=panel.querySelector('.card-ver-todas .categoria-dicc-nombre');
      if(verTodas&&/ver todas/i.test(txt(verTodas.textContent))){
        const card=verTodas.closest('.categoria-dicc-card');
        if(card){card.click();setTimeout(()=>aplicarFiltro(tipo,panel),0);return;}
      }
    }
    aplicarFiltro(tipo,panel);
    try{if(typeof window.gtag==='function')window.gtag('event','taxonomy_group_open',{content_source:tipo,group_name:ESTADO.activo[tipo]||'Todos'});}catch(_e){}
  }

  function pintarToolbar(tipo,panel){
    const wrap=crearToolbar(tipo,panel);
    const grupos=gruposUsados(tipo,panel);
    if(!grupos.length){wrap.classList.add('d-none');return;}
    const activo=ESTADO.activo[tipo]||'';
    wrap.innerHTML='<div class="lsp-taxonomia-cabecera"><h3 class="lsp-taxonomia-titulo">Explorar</h3></div><div class="lsp-taxonomia-chips" role="group" aria-label="Grupos temáticos"></div><div class="lsp-taxonomia-resumen"></div>';
    const chips=wrap.querySelector('.lsp-taxonomia-chips');
    const opciones=[{nombre:'',icono:'▦',label:'Todo'}].concat(grupos.map(g=>({nombre:txt(g.nombre),icono:txt(g.icono)||'🧩',label:etiquetaGrupo(g.nombre)})));
    opciones.forEach(op=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='lsp-taxonomia-chip'+(norm(op.nombre)===norm(activo)?' active':'');
      b.dataset.grupo=op.nombre;
      b.setAttribute('aria-pressed',norm(op.nombre)===norm(activo)?'true':'false');
      b.setAttribute('aria-label',op.nombre?'Ver '+op.label:'Ver todo');
      b.innerHTML='<span class="lsp-taxonomia-icono" aria-hidden="true">'+esc(op.icono)+'</span><span class="lsp-taxonomia-label">'+esc(op.label)+'</span>';
      b.addEventListener('click',()=>seleccionarGrupo(tipo,panel,op.nombre));
      chips.appendChild(b);
    });
    wrap.classList.remove('d-none');
    aplicarFiltro(tipo,panel);
  }

  function panelVisible(panel){
    if(!panel||!panel.children.length)return false;
    const st=getComputedStyle(panel);
    if(st.display==='none'||st.visibility==='hidden')return false;
    return panel.getClientRects().length>0;
  }
  function sincronizarPanel(tipo,id){
    const panel=document.getElementById(id);if(!panel)return;
    const wrap=crearToolbar(tipo,panel);
    if(!panelVisible(panel)){wrap.classList.add('d-none');return;}
    pintarToolbar(tipo,panel);
  }
  function sincronizarTodo(){
    enriquecerBancos();
    sincronizarPanel('diccionario','panelCategoriasDiccionario');
    sincronizarPanel('vocabulario','panelCategorias');
  }

  function observar(){
    ['panelCategoriasDiccionario','panelCategorias'].forEach(id=>{
      const panel=document.getElementById(id);if(!panel)return;
      const tipo=id==='panelCategorias'?'vocabulario':'diccionario';
      new MutationObserver(()=>{enriquecerBancos();pintarToolbar(tipo,panel);}).observe(panel,{childList:true});
    });
    new MutationObserver(()=>sincronizarTodo()).observe(document.body,{attributes:true,attributeFilter:['class']});
    if(window.QuizV2&&typeof window.QuizV2.onBancoListo==='function'){
      window.QuizV2.onBancoListo(()=>setTimeout(sincronizarTodo,0));
    }
  }

  function parchearBusqueda(){
    if(ESTADO.parchado||typeof window.clasificarCoincidencia!=='function')return;
    const original=window.clasificarCoincidencia;
    window.clasificarCoincidencia=function(p,texto){
      const rango=original.apply(this,arguments);
      if(rango>=0)return rango;
      enriquecerRegistro(p);
      const q=norm(texto);if(!q)return -1;
      const grupo=norm(p&&p.grupo);
      const etiquetas=lista(p&&p.etiquetas).map(norm);
      const cfgGrupo=gruposConfig().find(g=>norm(g&&g.nombre)===grupo);
      const alias=lista(cfgGrupo&&cfgGrupo.alias).map(norm);
      if(grupo===q||etiquetas.includes(q)||alias.includes(q))return 6;
      if(q.length>=3&&(grupo.includes(q)||etiquetas.some(x=>x.includes(q))||alias.some(x=>x.includes(q))))return 7;
      return -1;
    };
    ESTADO.parchado=true;
  }

  async function iniciar(){
    try{
      const r=await fetch(URL_TAXONOMIA,{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      ESTADO.taxonomia=await r.json();
    }catch(error){
      console.warn('No se pudo cargar la taxonomía de LSPedia:',error);
      return;
    }
    window.LSPediaTaxonomia={
      datos:ESTADO.taxonomia,
      grupoCategoria,
      etiquetasCategoria,
      enriquecerRegistro,
      refrescar:sincronizarTodo
    };
    enriquecerBancos();
    parchearBusqueda();
    observar();
    sincronizarTodo();
    setTimeout(sincronizarTodo,300);
    setTimeout(sincronizarTodo,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
