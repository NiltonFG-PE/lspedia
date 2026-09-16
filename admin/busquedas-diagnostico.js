/* LSPedia Admin — seguridad del transporte JSONP.
   El panel usa JSONP porque Apps Script no expone CORS tradicional para este
   flujo. Antes de que el panel base pueda insertar el <script> remoto,
   bloqueamos de forma síncrona cualquier endpoint administrativo que no sea
   un despliegue /exec oficial de Google Apps Script. */
(function protegerJsonpAdmin(){
  'use strict';
  if(window.__lspediaAdminJsonpProtegido)return;

  const MODOS_ADMIN=new Set(['admin_busquedas','admin_analytics']);
  const HOST_PERMITIDO='script.google.com';
  const RUTA_EXEC=/^\/macros\/s\/[^/]+\/exec\/?$/;

  function esJsonpAdminSeguro(nodo){
    if(!nodo||nodo.nodeType!==1||String(nodo.tagName).toUpperCase()!=='SCRIPT')return true;
    const src=String(nodo.getAttribute('src')||nodo.src||'').trim();
    if(!src)return true;
    let url;
    try{url=new URL(src,location.href)}catch(_e){return false;}
    const modo=url.searchParams.get('modo')||'';
    if(!MODOS_ADMIN.has(modo))return true;
    return url.protocol==='https:'&&url.hostname===HOST_PERMITIDO&&RUTA_EXEC.test(url.pathname);
  }

  function validarNodo(nodo){
    if(esJsonpAdminSeguro(nodo))return;
    console.error('[LSPedia Admin] Se bloqueó un endpoint JSONP no autorizado.');
    throw new TypeError('Por seguridad, el panel solo acepta una URL /exec oficial de Google Apps Script.');
  }

  const appendOriginal=Node.prototype.appendChild;
  Node.prototype.appendChild=function(nodo){
    validarNodo(nodo);
    return appendOriginal.call(this,nodo);
  };

  const insertOriginal=Node.prototype.insertBefore;
  Node.prototype.insertBefore=function(nodo,referencia){
    validarNodo(nodo);
    return insertOriginal.call(this,nodo,referencia);
  };

  Object.defineProperty(window,'__lspediaAdminJsonpProtegido',{
    value:true,writable:false,configurable:false,enumerable:false
  });
})();

/* LSPedia Admin — diagnóstico educativo de búsquedas sin resultado.
   No corrige ni reescribe lo que el usuario buscó. Clasifica la consulta para
   ayudar al administrador a decidir si ya existe, es una forma gramatical,
   parece un error ortográfico o realmente falta agregarla.

   Regla editorial LSPedia vigente:
   una búsqueda se considera RESUELTA cuando la palabra o su destino equivalente
   ya es pública. Para ser pública necesita una imagen real; el video es opcional. */
(function(){
  'use strict';

  function texto(v){return String(v==null?'':v).trim()}
  function norm(v){
    return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toLocaleLowerCase('es-PE').trim();
  }
  function variantes(v){return texto(v).split(',').map(x=>x.trim()).filter(Boolean)}
  function esImagenReal(valor){
    const principal=texto(valor).split(',')[0].trim();
    if(!principal)return false;
    return /^(?:https?:\/\/|\/|\.\.?\/|img\/)/i.test(principal)&&
      /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(principal);
  }

  function distancia(a,b){
    a=norm(a);b=norm(b);
    if(a===b)return 0;
    if(!a.length)return b.length;if(!b.length)return a.length;
    const prev=Array.from({length:b.length+1},(_,i)=>i);
    const curr=new Array(b.length+1);
    for(let i=1;i<=a.length;i++){
      curr[0]=i;
      for(let j=1;j<=b.length;j++){
        curr[j]=Math.min(curr[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
      }
      for(let j=0;j<=b.length;j++)prev[j]=curr[j];
    }
    return prev[b.length];
  }

  function construirIndice(diccionario,vocabulario,ayudas){
    const registros=[];
    function agregar(lista,seccion){
      (Array.isArray(lista)?lista:[]).forEach(item=>{
        if(!item||!texto(item.palabra))return;
        const registro={
          palabra:texto(item.palabra),
          palabraNorm:norm(item.palabra),
          variantes:variantes(item.variantes),
          seccion,
          imagen:texto(item.imagen),
          publica:esImagenReal(item.imagen)
        };
        registro.variantesNorm=registro.variantes.map(norm);
        registros.push(registro);
      });
    }
    agregar(diccionario,'Diccionario');
    agregar(vocabulario,'Vocabulario');

    const canonicos=new Set(registros.map(x=>x.palabraNorm));
    const canonicosPublicos=new Set(registros.filter(x=>x.publica).map(x=>x.palabraNorm));
    const alias=new Map();
    const gramatica=new Map();
    const datos=ayudas&&typeof ayudas==='object'?ayudas:{};

    (Array.isArray(datos.aliasOcultos)?datos.aliasOcultos:[]).forEach(item=>{
      const clave=norm(item&&item.entrada);
      if(!clave)return;
      alias.set(clave,{
        objetivos:(Array.isArray(item.objetivos)?item.objetivos:[]).map(texto).filter(Boolean),
        tipo:texto(item.tipo)||'alias'
      });
    });
    (Array.isArray(datos.gramatica)?datos.gramatica:[]).forEach(item=>{
      const clave=norm(item&&item.forma);
      if(!clave)return;
      gramatica.set(clave,{
        objetivos:(Array.isArray(item.objetivos)?item.objetivos:[]).map(texto).filter(Boolean),
        clase:texto(item.clase)||'gramatica',
        explicacion:texto(item.explicacion)
      });
    });

    return {registros,canonicos,canonicosPublicos,alias,gramatica};
  }

  function destinosDisponibles(indice,objetivos){
    return (Array.isArray(objetivos)?objetivos:[]).filter(obj=>indice.canonicosPublicos.has(norm(obj)));
  }

  function exacto(indice,q){
    for(const r of indice.registros){
      if(r.palabraNorm===q)return {registro:r,tipo:'palabra'};
      const pos=r.variantesNorm.indexOf(q);
      if(pos>=0)return {registro:r,tipo:'variante',variante:r.variantes[pos]};
    }
    return null;
  }

  function predicciones(indice,q){
    if(q.length<2)return [];
    const vistas=new Set(),salida=[];
    indice.registros.forEach(r=>{
      if(r.palabraNorm.startsWith(q)&&!vistas.has(r.palabraNorm)){
        vistas.add(r.palabraNorm);salida.push(r.palabra);
      }
    });
    return salida.slice(0,3);
  }

  function cercano(indice,q){
    if(q.length<3)return null;
    let mejor=null;
    indice.registros.forEach(r=>{
      const d=distancia(q,r.palabraNorm);
      if(!mejor||d<mejor.distancia||(d===mejor.distancia&&r.palabra.length<mejor.palabra.length)){
        mejor={palabra:r.palabra,seccion:r.seccion,distancia:d,publica:r.publica};
      }
    });
    if(!mejor)return null;
    const limite=q.length<=4?1:q.length<=8?2:3;
    return mejor.distancia<=limite?mejor:null;
  }

  function analizar(indice,termino,seccion){
    const original=texto(termino),q=norm(original);
    if(!q)return {tipo:'falta',etiqueta:'Falta agregar',sugerencia:'',detalle:'Consulta vacía.',resuelto:false};

    const g=indice.gramatica.get(q);
    if(g){
      const disponibles=destinosDisponibles(indice,g.objetivos);
      const destino=(disponibles.length?disponibles:g.objetivos).join(' / ');
      return {
        tipo:'gramatica',etiqueta:'Forma gramatical',sugerencia:destino,
        detalle:disponibles.length
          ? (g.explicacion||('Relacionar con '+destino+'.'))
          : ((g.explicacion?g.explicacion+' ':'')+'Sigue pendiente hasta que la palabra relacionada tenga una imagen real y sea pública.'),
        resuelto:disponibles.length>0
      };
    }

    const a=indice.alias.get(q);
    if(a){
      const disponibles=destinosDisponibles(indice,a.objetivos);
      const destino=(disponibles.length?disponibles:a.objetivos).join(' / ');
      return {
        tipo:'correccion',etiqueta:a.tipo==='abreviacion'?'Abreviación':'Posible escritura',sugerencia:destino,
        detalle:disponibles.length
          ? 'La búsqueda puede resolverse con una palabra canónica que ya es pública.'
          : 'La forma sugerida existe o está relacionada, pero seguirá pendiente hasta que tenga una imagen real y sea pública.',
        resuelto:disponibles.length>0
      };
    }

    const ex=exacto(indice,q);
    if(ex){
      const mismo=norm(ex.registro.seccion)===norm(seccion);
      const publica=!!ex.registro.publica;
      return {
        tipo:'existente',
        etiqueta:publica
          ? (ex.tipo==='variante'?'Ya existe como variante + imagen':'Ya existe + imagen')
          : (ex.tipo==='variante'?'Existe como variante, falta imagen':'Existe, falta imagen'),
        sugerencia:ex.registro.palabra,
        detalle:publica
          ? ((mismo?'Disponible en ':'Está en otra sección: ')+ex.registro.seccion+'. Ya cuenta como resuelta porque tiene imagen real y es pública.')
          : ((mismo?'La ficha ya existe en ':'La ficha está en otra sección: ')+ex.registro.seccion+', pero permanece pendiente hasta agregarle una imagen real.'),
        resuelto:publica
      };
    }

    const pred=predicciones(indice,q);
    if(pred.length){
      return {tipo:'prediccion',etiqueta:'Puede estar incompleta',sugerencia:pred.join(' / '),detalle:'Coincide con el inicio de palabras existentes.',resuelto:false};
    }

    const cer=cercano(indice,q);
    if(cer){
      return {tipo:'correccion',etiqueta:'Posible error',sugerencia:cer.palabra,detalle:'Se parece a una palabra existente en '+cer.seccion+'. Revisar antes de crear una nueva.',resuelto:false};
    }

    return {tipo:'falta',etiqueta:'Falta agregar',sugerencia:'',detalle:'No se encontró una coincidencia confiable. Revisar el término y, si es correcto, agregarlo con una imagen real.',resuelto:false};
  }

  window.LSPediaDiagnosticoBusquedas={construirIndice,analizar,normalizar:norm,esImagenReal};
})();

/* Carga la mejora de historial sobre el panel existente. Se espera a que
   busquedas.html termine su inicialización para no competir con su primer render. */
(function cargarHistorialAdmin(){
  'use strict';
  function refrescarHistorial(){
    document.dispatchEvent(new Event('visibilitychange'));
  }
  function cargar(){
    if(document.querySelector('script[data-lspedia-historial-busquedas]'))return;
    const s=document.createElement('script');
    s.src='busquedas-historial.js?v=20260914-2';
    s.async=false;
    s.dataset.lspediaHistorialBusquedas='1';
    s.onload=function(){
      // Refuerzo tras el render inicial del panel base.
      setTimeout(refrescarHistorial,2200);
      const periodo=document.getElementById('periodSelect');
      if(periodo&&periodo.dataset.lspediaHistorialPeriodo!=='1'){
        periodo.dataset.lspediaHistorialPeriodo='1';
        periodo.addEventListener('change',function(){
          // Estadísticas cambian de periodo; la cola de búsquedas vuelve a
          // consultar "todo" y no se encoge con ese selector.
          setTimeout(refrescarHistorial,1800);
        });
      }
    };
    document.head.appendChild(s);
  }
  if(document.readyState==='complete')setTimeout(cargar,0);
  else window.addEventListener('load',()=>setTimeout(cargar,0),{once:true});
})();

/* LSPedia Admin — tarjeta de países de los últimos 30 días.
   Reutiliza la respuesta de GA4 que el panel ya solicita por defecto para
   evitar una segunda consulta y no exige cambiar ni volver a desplegar Apps Script.
   La lista muestra usuarios y visitas por país; las interacciones son el total
   de eventos del mismo periodo, porque el backend actual no desglosa eventos
   por país. */
(function tarjetaPaises30Dias(){
  'use strict';
  if(window.__lspediaTarjetaPaises30Dias)return;
  window.__lspediaTarjetaPaises30Dias=true;

  const fmt=v=>new Intl.NumberFormat('es-PE').format(Number(v)||0);
  const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let ultimo30=null;

  function bandera(codigo){
    const c=String(codigo||'').trim().toUpperCase();
    if(!/^[A-Z]{2}$/.test(c))return '🌐';
    return String.fromCodePoint(...[...c].map(ch=>127397+ch.charCodeAt(0)));
  }

  function asegurarEstilos(){
    if(document.getElementById('lspediaCountry30Styles'))return;
    const style=document.createElement('style');
    style.id='lspediaCountry30Styles';
    style.textContent=`
      .country30-card{overflow:hidden;border-top:3px solid #0284c7;margin-top:0}
      .country30-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:13px}
      .country30-kpi{border:1px solid #e5edf5;border-radius:12px;background:#f8fbfe;padding:11px}
      .country30-kpi strong{display:block;font-size:21px;line-height:1.1;color:#172033}
      .country30-kpi span{display:block;margin-top:4px;font-size:10px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
      .country30-table{width:100%;border-collapse:collapse}
      .country30-table th{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#718096;text-align:left;padding:8px 9px;border-bottom:1px solid #e6edf4}
      .country30-table th:not(:first-child),.country30-table td:not(:first-child){text-align:right}
      .country30-table td{padding:10px 9px;border-bottom:1px solid #eef2f6;font-size:12px}
      .country30-table tr:last-child td{border-bottom:0}
      .country30-name{display:flex;align-items:center;gap:7px;font-weight:800}
      .country30-flag{font-size:17px;line-height:1}
      .country30-value{font-weight:900}
      .country30-note{font-size:10px;color:#64748b;margin-top:10px;line-height:1.4}
      @media(max-width:720px){.country30-summary{grid-template-columns:1fr 1fr}.country30-summary .country30-kpi:last-child{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function crearTarjeta(){
    const tab=document.getElementById('tabEstadisticas');
    if(!tab)return null;
    let card=document.getElementById('country30Card');
    if(card)return card;
    asegurarEstilos();

    const resumen=document.getElementById('sumErrors');
    const statsResumen=resumen&&resumen.closest('.stats');
    if(!statsResumen)return null;

    const titulo=document.createElement('div');
    titulo.className='section-title';
    titulo.id='country30Title';
    titulo.innerHTML='<div><h2>Países · últimos 30 días</h2><p>De dónde llegan los usuarios y cuánta actividad registra LSPedia.</p></div>';

    card=document.createElement('section');
    card.id='country30Card';
    card.className='card panel country30-card';
    card.innerHTML=`
      <div class="panel-head">
        <div><h3>🌍 Audiencia internacional</h3><p>Usuarios activos, visitas e interacciones registradas por Google Analytics durante los últimos 30 días.</p></div>
        <span class="mini-badge">30 días</span>
      </div>
      <div class="country30-summary">
        <div class="country30-kpi"><strong id="country30Countries">0</strong><span>Países</span></div>
        <div class="country30-kpi"><strong id="country30Users">0</strong><span>Usuarios</span></div>
        <div class="country30-kpi"><strong id="country30Interactions">0</strong><span>Interacciones</span></div>
      </div>
      <div class="table-wrap">
        <table class="country30-table">
          <thead><tr><th>País</th><th>Usuarios</th><th>Visitas</th></tr></thead>
          <tbody id="country30Body"><tr><td colspan="3" class="muted">Esperando datos de Analytics…</td></tr></tbody>
        </table>
      </div>
      <div class="country30-note">Interacciones = total de eventos de GA4 en los últimos 30 días. La tabla desglosa usuarios y visitas por país. Los datos son agregados y no identifican personas.</div>`;

    statsResumen.insertAdjacentElement('afterend',card);
    card.insertAdjacentElement('beforebegin',titulo);
    return card;
  }

  function render(data){
    if(!data||data.ok!==true)return;
    ultimo30=data;
    const card=crearTarjeta();
    if(!card)return;
    const rows=(Array.isArray(data.paises)?data.paises:[]).filter(x=>x&&x.pais&&Number(x.usuarios)>0);
    const usuarios=Number(data.resumen&&data.resumen.usuarios)||0;
    const interacciones=Number(data.resumen&&data.resumen.eventos)||0;
    const q=id=>document.getElementById(id);
    if(q('country30Countries'))q('country30Countries').textContent=fmt(rows.length);
    if(q('country30Users'))q('country30Users').textContent=fmt(usuarios);
    if(q('country30Interactions'))q('country30Interactions').textContent=fmt(interacciones);
    const body=q('country30Body');
    if(!body)return;
    if(!rows.length){body.innerHTML='<tr><td colspan="3" class="muted">Aún no hay datos geográficos en este periodo.</td></tr>';return}
    body.innerHTML=rows.map(x=>'<tr><td><div class="country30-name"><span class="country30-flag" aria-hidden="true">'+bandera(x.codigo)+'</span><span>'+escapeHtml(x.pais)+'</span></div></td><td class="country30-value">'+fmt(x.usuarios)+'</td><td class="country30-value">'+fmt(x.sesiones)+'</td></tr>').join('');
  }

  // Captura únicamente la respuesta de 30 días del JSONP que ya usa el panel.
  // Se instala antes del IIFE principal de busquedas.html, así que el callback
  // ya existe cuando el <script> remoto se añade al documento.
  const appendActual=Node.prototype.appendChild;
  Node.prototype.appendChild=function(nodo){
    try{
      if(nodo&&nodo.nodeType===1&&String(nodo.tagName).toUpperCase()==='SCRIPT'){
        const src=String(nodo.getAttribute('src')||nodo.src||'');
        if(src){
          const url=new URL(src,location.href);
          if(url.searchParams.get('modo')==='admin_analytics'&&url.searchParams.get('periodo')==='30'){
            const cb=url.searchParams.get('callback');
            const original=cb&&window[cb];
            if(typeof original==='function'&&!original.__lspediaCountry30Wrapped){
              const wrapped=function(data){
                try{render(data)}catch(error){console.warn('[LSPedia Admin] No se pudo renderizar países 30 días:',error)}
                return original.apply(this,arguments);
              };
              wrapped.__lspediaCountry30Wrapped=true;
              window[cb]=wrapped;
            }
          }
        }
      }
    }catch(_error){}
    return appendActual.call(this,nodo);
  };

  function iniciar(){
    crearTarjeta();
    if(ultimo30)render(ultimo30);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
