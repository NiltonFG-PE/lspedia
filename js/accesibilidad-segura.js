/* LSPedia — accesibilidad segura y progresiva.
   Solo añade semántica/foco cuando el contexto es claro; no cambia flujos. */
(function(){
  'use strict';

  let ultimoFocoAntesDialogo=null;

  function textoAccesible(el){
    if(!el)return'';
    return String(el.getAttribute('aria-label')||'').trim() ||
      String(el.getAttribute('aria-labelledby')||'').trim() ||
      String(el.textContent||'').replace(/\s+/g,' ').trim();
  }

  function asegurarNombre(el){
    if(!(el instanceof Element) || textoAccesible(el))return;
    const titulo=String(el.getAttribute('title')||'').trim();
    const img=el.querySelector&&el.querySelector('img[alt]');
    const alt=img?String(img.getAttribute('alt')||'').trim():'';
    const nombre=titulo||alt;
    if(nombre)el.setAttribute('aria-label',nombre);
  }

  function prepararNavegacion(){
    document.querySelectorAll('a.nav-link, [role="tab"], [data-admin-tab]').forEach(function(el){
      if(el.classList.contains('active'))el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    });
  }

  function prepararRegionesDinamicas(){
    const ids=['resultado','resultadoVocabulario','resultadosVocabulario','sugerencias','sugerenciasVocabulario','quizFeedback','feedbackQuiz','estadoSenas','resultadosSenas','progresoMuestraSenas','feedbackJuego'];
    ids.forEach(function(id){
      const el=document.getElementById(id);
      if(!el)return;
      if(!el.hasAttribute('role'))el.setAttribute('role','status');
      if(!el.hasAttribute('aria-live'))el.setAttribute('aria-live','polite');
      if(!el.hasAttribute('aria-atomic'))el.setAttribute('aria-atomic','false');
    });
  }

  function prepararControles(root){
    const base=root&&root.querySelectorAll?root:document;
    base.querySelectorAll('button, a, [role="button"]').forEach(asegurarNombre);
    base.querySelectorAll('button.btn-close').forEach(function(el){if(!textoAccesible(el))el.setAttribute('aria-label','Cerrar');});
    base.querySelectorAll('input[required], select[required], textarea[required]').forEach(function(el){if(!el.hasAttribute('aria-required'))el.setAttribute('aria-required','true');});
    base.querySelectorAll('img:not([alt])').forEach(function(img){if(img.classList.contains('decorativo')||img.hasAttribute('data-decorativo'))img.setAttribute('alt','');});
  }

  function asegurarSaltoContenido(){
    if(document.querySelector('.lspedia-skip-link'))return;
    const main=document.querySelector('main');
    if(!main)return;
    if(!main.id)main.id='contenidoPrincipal';
    if(!main.hasAttribute('tabindex'))main.setAttribute('tabindex','-1');
    const enlace=document.createElement('a');
    enlace.className='lspedia-skip-link'; enlace.href='#'+main.id; enlace.textContent='Saltar al contenido';
    enlace.addEventListener('click',function(){setTimeout(function(){try{main.focus({preventScroll:true});}catch(_e){main.focus();}},0);});
    document.body.prepend(enlace);
  }

  function elementosEnfocables(dialogo){
    if(!dialogo||!dialogo.querySelectorAll)return[];
    return Array.from(dialogo.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function(el){return !el.hasAttribute('hidden')&&el.getAttribute('aria-hidden')!=='true';});
  }

  function prepararDialogo(dialogo){
    if(!(dialogo instanceof Element))return;
    if(!dialogo.hasAttribute('role'))dialogo.setAttribute('role','dialog');
    dialogo.setAttribute('aria-modal','true');
    if(!dialogo.hasAttribute('aria-label')&&!dialogo.hasAttribute('aria-labelledby')){
      const titulo=dialogo.querySelector('.modal-title,h1,h2,h3');
      if(titulo){if(!titulo.id)titulo.id='tituloDialogoLspedia-'+Math.random().toString(36).slice(2,9);dialogo.setAttribute('aria-labelledby',titulo.id);}
    }
  }

  function enfocarDialogoSiCorresponde(dialogo){
    if(!(dialogo instanceof Element))return;
    const visible=dialogo.classList.contains('show')||dialogo.getAttribute('open')!==null||dialogo.getAttribute('aria-hidden')==='false';
    if(!visible)return;
    prepararDialogo(dialogo);
    if(!dialogo.contains(document.activeElement)){
      ultimoFocoAntesDialogo=document.activeElement instanceof HTMLElement?document.activeElement:null;
      const foco=elementosEnfocables(dialogo)[0]||dialogo;
      if(foco===dialogo&&!dialogo.hasAttribute('tabindex'))dialogo.setAttribute('tabindex','-1');
      setTimeout(function(){try{foco.focus({preventScroll:true});}catch(_e){try{foco.focus();}catch(_e2){}}},0);
    }
  }

  function restaurarFocoSiNoHayDialogo(){
    const abierto=document.querySelector('.modal.show,[role="dialog"][aria-hidden="false"],dialog[open]');
    if(abierto||!ultimoFocoAntesDialogo)return;
    const destino=ultimoFocoAntesDialogo; ultimoFocoAntesDialogo=null;
    if(document.contains(destino))setTimeout(function(){try{destino.focus({preventScroll:true});}catch(_e){}},0);
  }

  function prepararDialogos(root){
    const base=root&&root.querySelectorAll?root:document;
    if(base instanceof Element&&base.matches('.modal,[role="dialog"],dialog'))prepararDialogo(base);
    base.querySelectorAll('.modal,[role="dialog"],dialog').forEach(prepararDialogo);
    document.querySelectorAll('.modal.show,[role="dialog"][aria-hidden="false"],dialog[open]').forEach(enfocarDialogoSiCorresponde);
  }

  /* Barra INFERIOR: se oculta únicamente cuando el usuario desplaza hacia arriba.
     Al desplazarse hacia abajo permanece visible y fija. La cabecera superior no se toca. */
  function iniciarNavegacionInferiorAutoOcultable(){
    const estilos=document.createElement('style');
    estilos.textContent='.lspedia-nav-inferior-scroll-oculta{transform:translateY(calc(100% + 24px)) !important;opacity:0 !important;pointer-events:none !important;}';
    document.head.appendChild(estilos);

    function obtenerBarrasInferiores(){
      return Array.from(document.querySelectorAll('nav')).filter(function(el){
        if(el.matches('nav.navbar'))return false;
        const cs=getComputedStyle(el);
        if(cs.display==='none'||cs.visibility==='hidden')return false;
        const rect=el.getBoundingClientRect();
        const pos=cs.position;
        return (pos==='fixed'||pos==='sticky') && rect.height>0 && rect.top>window.innerHeight*0.45 && rect.bottom>=window.innerHeight-12;
      });
    }

    let temporizador=null;
    let raf=null;
    let ultimaPosicion=window.scrollY||window.pageYOffset||0;
    let desplazandoHaciaArriba=false;

    function mostrar(){
      obtenerBarrasInferiores().forEach(function(el){el.classList.remove('lspedia-nav-inferior-scroll-oculta');});
      desplazandoHaciaArriba=false;
    }

    function ocultar(){
      obtenerBarrasInferiores().forEach(function(el){el.classList.add('lspedia-nav-inferior-scroll-oculta');});
      desplazandoHaciaArriba=true;
    }

    function scroll(){
      if(raf)return;
      raf=requestAnimationFrame(function(){
        raf=null;
        const posicionActual=window.scrollY||window.pageYOffset||0;
        const delta=posicionActual-ultimaPosicion;
        ultimaPosicion=posicionActual;

        // Hacia arriba: ocultar. Hacia abajo: mantener visible.
        if(delta>0){
          mostrar();
        }else if(delta<0){
          ocultar();
        }
      });
    }

    window.addEventListener('scroll',scroll,{passive:true});
    window.addEventListener('resize',function(){
      ultimaPosicion=window.scrollY||window.pageYOffset||0;
      mostrar();
    },{passive:true});

    // Si se inicia un gesto hacia abajo, no dejamos que un temporizador
    // anterior vuelva a ocultar la navegación.
    ['touchmove','pointermove'].forEach(function(tipo){
      window.addEventListener(tipo,function(){
        const posicionActual=window.scrollY||window.pageYOffset||0;
        if(posicionActual>ultimaPosicion){
          ultimaPosicion=posicionActual;
          mostrar();
        }
      },{passive:true});
    });
  }

  function iniciar(){
    asegurarSaltoContenido(); prepararNavegacion(); prepararRegionesDinamicas(); prepararControles(document); prepararDialogos(document);
    document.addEventListener('shown.bs.modal',function(event){if(event.target instanceof Element)enfocarDialogoSiCorresponde(event.target);});
    document.addEventListener('hidden.bs.modal',restaurarFocoSiNoHayDialogo);
    iniciarNavegacionInferiorAutoOcultable();
    if(!('MutationObserver' in window))return;
    const obs=new MutationObserver(function(cambios){
      let actualizarNav=false,revisarDialogos=false;
      cambios.forEach(function(cambio){
        if(cambio.type==='attributes'&&cambio.attributeName==='class'){actualizarNav=true;if(cambio.target instanceof Element&&cambio.target.matches('.modal,[role="dialog"],dialog'))revisarDialogos=true;}
        if(cambio.type==='attributes'&&(cambio.attributeName==='aria-hidden'||cambio.attributeName==='open'))revisarDialogos=true;
        cambio.addedNodes.forEach(function(nodo){if(!(nodo instanceof Element))return;if(nodo.matches('button, a, [role="button"]'))asegurarNombre(nodo);prepararControles(nodo);prepararDialogos(nodo);});
      });
      if(actualizarNav)prepararNavegacion(); prepararRegionesDinamicas();
      if(revisarDialogos){prepararDialogos(document);restaurarFocoSiNoHayDialogo();}
    });
    obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-hidden','open']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true}); else iniciar();
})();
