/* LSPedia Admin — diagnóstico educativo de búsquedas sin resultado.
   No corrige ni reescribe lo que el usuario buscó. Clasifica la consulta para
   ayudar al administrador a decidir si ya existe, es una forma gramatical,
   parece un error ortográfico o realmente falta agregarla. */
(function(){
  'use strict';

  function texto(v){return String(v==null?'':v).trim()}
  function norm(v){
    return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toLocaleLowerCase('es-PE').trim();
  }
  function variantes(v){return texto(v).split(',').map(x=>x.trim()).filter(Boolean)}

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
          seccion
        };
        registro.variantesNorm=registro.variantes.map(norm);
        registros.push(registro);
      });
    }
    agregar(diccionario,'Diccionario');
    agregar(vocabulario,'Vocabulario');

    const canonicos=new Set(registros.map(x=>x.palabraNorm));
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

    return {registros,canonicos,alias,gramatica};
  }

  function destinosDisponibles(indice,objetivos){
    return (Array.isArray(objetivos)?objetivos:[]).filter(obj=>indice.canonicos.has(norm(obj)));
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
        mejor={palabra:r.palabra,seccion:r.seccion,distancia:d};
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
        detalle:g.explicacion||('Relacionar con '+destino+'.'),
        resuelto:disponibles.length>0
      };
    }

    const a=indice.alias.get(q);
    if(a){
      const disponibles=destinosDisponibles(indice,a.objetivos);
      const destino=(disponibles.length?disponibles:a.objetivos).join(' / ');
      return {
        tipo:'correccion',etiqueta:a.tipo==='abreviacion'?'Abreviación':'Posible escritura',sugerencia:destino,
        detalle:disponibles.length?'La búsqueda puede resolverse sin enseñar esta forma como español correcto.':'La forma sugerida todavía no está disponible como palabra canónica.',
        resuelto:disponibles.length>0
      };
    }

    const ex=exacto(indice,q);
    if(ex){
      const mismo=norm(ex.registro.seccion)===norm(seccion);
      return {
        tipo:'existente',etiqueta:ex.tipo==='variante'?'Ya existe como variante':'Ya existe',
        sugerencia:ex.registro.palabra,
        detalle:(mismo?'Disponible en ':'Está en otra sección: ')+ex.registro.seccion+'.',
        resuelto:true
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

    return {tipo:'falta',etiqueta:'Falta agregar',sugerencia:'',detalle:'No se encontró una coincidencia confiable. Revisar el término y, si es correcto, agregarlo.',resuelto:false};
  }

  window.LSPediaDiagnosticoBusquedas={construirIndice,analizar,normalizar:norm};
})();
