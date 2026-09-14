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

   Regla editorial LSPedia:
   una búsqueda solo se considera RESUELTA cuando la palabra o su destino
   equivalente ya existe CON VIDEO. Que exista la ficha sin video no basta. */
(function(){
  'use strict';

  function texto(v){return String(v==null?'':v).trim()}
  function norm(v){
    return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toLocaleLowerCase('es-PE').trim();
  }
  function variantes(v){return texto(v).split(',').map(x=>x.trim()).filter(Boolean)}
  function tieneVideo(item){return !!texto(item&&item.video)}

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
          video:texto(item.video),
          conVideo:tieneVideo(item)
        };
        registro.variantesNorm=registro.variantes.map(norm);
        registros.push(registro);
      });
    }
    agregar(diccionario,'Diccionario');
    agregar(vocabulario,'Vocabulario');

    const canonicos=new Set(registros.map(x=>x.palabraNorm));
    const canonicosConVideo=new Set(registros.filter(x=>x.conVideo).map(x=>x.palabraNorm));
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

    return {registros,canonicos,canonicosConVideo,alias,gramatica};
  }

  function destinosDisponibles(indice,objetivos){
    return (Array.isArray(objetivos)?objetivos:[]).filter(obj=>indice.canonicosConVideo.has(norm(obj)));
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
        mejor={palabra:r.palabra,seccion:r.seccion,distancia:d,conVideo:r.conVideo};
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
          : ((g.explicacion?g.explicacion+' ':'')+'Sigue pendiente hasta que la palabra relacionada tenga video.'),
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
          ? 'La búsqueda puede resolverse con una palabra canónica que ya tiene video.'
          : 'La forma sugerida existe o está relacionada, pero seguirá pendiente hasta que tenga video.',
        resuelto:disponibles.length>0
      };
    }

    const ex=exacto(indice,q);
    if(ex){
      const mismo=norm(ex.registro.seccion)===norm(seccion);
      const conVideo=!!ex.registro.conVideo;
      return {
        tipo:'existente',
        etiqueta:conVideo
          ? (ex.tipo==='variante'?'Ya existe como variante + video':'Ya existe + video')
          : (ex.tipo==='variante'?'Existe como variante, falta video':'Existe, falta video'),
        sugerencia:ex.registro.palabra,
        detalle:conVideo
          ? ((mismo?'Disponible en ':'Está en otra sección: ')+ex.registro.seccion+'. Ya cuenta como resuelta porque tiene video.')
          : ((mismo?'La ficha ya existe en ':'La ficha está en otra sección: ')+ex.registro.seccion+', pero permanece pendiente hasta agregarle video.'),
        resuelto:conVideo
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

    return {tipo:'falta',etiqueta:'Falta agregar',sugerencia:'',detalle:'No se encontró una coincidencia confiable. Revisar el término y, si es correcto, agregarlo con video.',resuelto:false};
  }

  window.LSPediaDiagnosticoBusquedas={construirIndice,analizar,normalizar:norm};
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
    s.src='busquedas-historial.js?v=20260914-1';
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
