/* LSPedia — apertura directa de tarjetas de “Últimos 30 días”.
   V3: Diccionario y Vocabulario abren dentro de la SPA, sin location.href.
   Reutiliza los mismos renderizadores internos que usa el buscador normal. */
(function(){
  'use strict';
  if(window.__LSPediaUltimos30FixV3)return;
  window.__LSPediaUltimos30FixV3=true;

  function texto(v){return String(v==null?'':v).trim();}
  function clave(v){
    return texto(v)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/\s+/g,' ')
      .trim();
  }

  function cerrarModal30(){
    const overlay=document.getElementById('lsp30dOverlay');
    if(!overlay)return;
    const cerrar=overlay.querySelector('.lsp-30d-close');
    if(cerrar){
      try{cerrar.click();return;}catch(_e){}
    }
    overlay.hidden=true;
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  function subirAlResultado(){
    requestAnimationFrame(function(){
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  function buscarItemVocabulario(palabra){
    try{
      const api=window.LSPediaVocabularioPublico;
      const lista=api&&typeof api.obtener==='function'?api.obtener():[];
      const objetivo=clave(palabra);
      return (Array.isArray(lista)?lista:[]).find(function(item){
        return clave(item&&item.palabra)===objetivo;
      })||null;
    }catch(_e){
      return null;
    }
  }

  function pintarVocabulario(item){
    if(!item)return false;

    /* Es exactamente el flujo usado cuando el buscador del Diccionario
       ofrece un resultado procedente de Vocabulario. */
    if(typeof window.abrirResultadoVocabularioDesdeBusqueda==='function'){
      try{
        window.abrirResultadoVocabularioDesdeBusqueda(item);
        subirAlResultado();
        return true;
      }catch(error){
        console.warn('[LSPedia] Falló abrirResultadoVocabularioDesdeBusqueda.',error);
      }
    }

    if(typeof window.mostrarPalabraSimplificada==='function'){
      try{
        window.mostrarPalabraSimplificada(item,{
          fuente:'vocabulario',
          enCategorias:false
        });
        subirAlResultado();
        return true;
      }catch(error){
        console.warn('[LSPedia] Falló mostrarPalabraSimplificada.',error);
      }
    }
    return false;
  }

  function abrirVocabularioDirecto(palabra){
    cerrarModal30();

    const inmediato=buscarItemVocabulario(palabra);
    if(pintarVocabulario(inmediato))return true;

    /* Si el banco público todavía está terminando de cargar, esperamos esa
       misma carga y pintamos después. No se recarga la página. */
    const api=window.LSPediaVocabularioPublico;
    if(api&&typeof api.cargar==='function'){
      Promise.resolve(api.cargar()).then(function(){
        const item=buscarItemVocabulario(palabra);
        if(!pintarVocabulario(item)){
          console.warn('[LSPedia] No se encontró en Vocabulario:',palabra);
        }
      }).catch(function(error){
        console.warn('[LSPedia] No se pudo cargar Vocabulario para abrir:',palabra,error);
      });
      return true;
    }

    console.warn('[LSPedia] Vocabulario no está disponible para abrir:',palabra);
    return true;
  }

  function abrirDiccionarioDirecto(palabra){
    cerrarModal30();

    /* restaurarPalabraDesdeUrl no recarga: localiza la ficha en App.datos
       y llama al mismo mostrarPalabra() del buscador. */
    if(typeof window.restaurarPalabraDesdeUrl==='function'){
      try{
        window.restaurarPalabraDesdeUrl(palabra,{
          fuente:'diccionario',
          enCategorias:false
        });
        subirAlResultado();
        return true;
      }catch(error){
        console.warn('[LSPedia] No se pudo abrir Diccionario directamente.',error);
      }
    }

    /* Respaldo sin navegación si mostrarPalabra/buscarPalabraPorReferencia
       están expuestos por el script principal. */
    if(typeof window.buscarPalabraPorReferencia==='function'&&typeof window.mostrarPalabra==='function'){
      try{
        const item=window.buscarPalabraPorReferencia(palabra);
        if(item){
          window.mostrarPalabra(item,{enCategorias:false,fuente:'diccionario'});
          subirAlResultado();
          return true;
        }
      }catch(error){
        console.warn('[LSPedia] Falló el respaldo directo de Diccionario.',error);
      }
    }

    console.warn('[LSPedia] No se encontró en Diccionario:',palabra);
    return true;
  }

  function abrirTarjeta(card){
    if(!card)return false;
    const titulo=card.querySelector('strong');
    const palabra=texto(titulo&&titulo.textContent);
    if(!palabra)return false;

    const meta=texto(card.querySelector('.lsp-30d-meta')&&card.querySelector('.lsp-30d-meta').textContent);
    return /vocabulario/i.test(meta)
      ? abrirVocabularioDirecto(palabra)
      : abrirDiccionarioDirecto(palabra);
  }

  document.addEventListener('click',function(e){
    const objetivo=e.target&&e.target.closest?e.target.closest('.lsp-30d-card'):null;
    if(!objetivo)return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    abrirTarjeta(objetivo);
  },true);
})();
