/* LSPedia — segunda aparición del acceso "Instalar LSPedia".
   Mantiene intacto el control PWA original y solo coordina una segunda
   aparición por sesión:
   - 1.ª aparición: comportamiento normal del control existente.
   - Tras desaparecer, espera 80 s.
   - 2.ª aparición: se vuelve a cargar el mismo control.
   - Cada aparición conserva su autoocultado de 30 s y la desintegración.
*/
(function(){
    'use strict';

    if(window.__LSPEDIA_PWA_REPEAT_RUNNING__) return;
    window.__LSPEDIA_PWA_REPEAT_RUNNING__=true;

    const ID='lspPwaInstalar';
    const LEGACY_HIDE_KEY='lspedia_pwa_instalar_oculta_sesion';
    const COUNT_KEY='lspedia_pwa_instalar_apariciones_sesion_v2';
    const NEXT_KEY='lspedia_pwa_instalar_segunda_desde_v2';
    const MAX=2;
    const ESPERA=80*1000;
    let timer=0;
    let recargando=false;
    let vistoActual=null;

    function leerSesionNumero(clave){
        try{const n=Number(sessionStorage.getItem(clave)||0);return Number.isFinite(n)?n:0;}
        catch(_e){return 0;}
    }
    function guardarSesion(clave,valor){try{sessionStorage.setItem(clave,String(valor));}catch(_e){}}
    function borrarSesion(clave){try{sessionStorage.removeItem(clave);}catch(_e){}}
    function apariciones(){return Math.min(MAX,Math.max(0,leerSesionNumero(COUNT_KEY)));}
    function instalada(){
        try{
            return window.matchMedia('(display-mode: standalone)').matches||
                window.navigator.standalone===true||
                localStorage.getItem('lspedia_pwa_instalada_v1')==='1';
        }catch(_e){return false;}
    }

    function registrarControl(el){
        if(!el||el.dataset.lspPwaRepeatSeen==='1')return;
        el.dataset.lspPwaRepeatSeen='1';
        vistoActual=el;
        const n=Math.min(MAX,apariciones()+1);
        guardarSesion(COUNT_KEY,n);
        if(n===1){
            // Respaldo si la página se recarga mientras la primera aparición
            // sigue visible: 30 s visible + 80 s antes de la segunda.
            guardarSesion(NEXT_KEY,Date.now()+110000);
        }else{
            borrarSesion(NEXT_KEY);
        }
    }

    function programarSegunda(desde){
        if(instalada()||apariciones()>=MAX)return;
        const cuando=Math.max(Date.now(),Number(desde)||0);
        guardarSesion(NEXT_KEY,cuando);
        clearTimeout(timer);
        timer=setTimeout(intentarSegunda,Math.max(0,cuando-Date.now()));
    }

    function alDesaparecer(){
        vistoActual=null;
        if(instalada()||apariciones()>=MAX)return;
        programarSegunda(Date.now()+ESPERA);
    }

    function cargarSegundoControl(){
        if(recargando||instalada()||apariciones()>=MAX||document.getElementById(ID))return;
        recargando=true;
        borrarSesion(LEGACY_HIDE_KEY);
        const anterior=document.querySelector('script[data-lspedia-pwa-repeat-load]');
        if(anterior)anterior.remove();
        const s=document.createElement('script');
        s.src='js/pwa-install.js?v=20261002-1&repeat=2';
        s.async=false;
        s.dataset.lspediaPwaRepeatLoad='1';
        s.onload=function(){recargando=false;setTimeout(function(){
            const actual=document.getElementById(ID);
            if(actual)registrarControl(actual);
            else if(!instalada()&&apariciones()<MAX)programarSegunda(Date.now()+10000);
        },80);};
        s.onerror=function(){recargando=false;if(!instalada()&&apariciones()<MAX)programarSegunda(Date.now()+15000);};
        document.head.appendChild(s);
    }

    function intentarSegunda(){
        clearTimeout(timer);
        if(instalada()||apariciones()>=MAX)return;
        const cuando=leerSesionNumero(NEXT_KEY);
        if(cuando>Date.now()){
            programarSegunda(cuando);
            return;
        }
        if(document.hidden){
            programarSegunda(Date.now()+5000);
            return;
        }
        cargarSegundoControl();
    }

    function observar(){
        const existente=document.getElementById(ID);
        if(existente)registrarControl(existente);

        const observer=new MutationObserver(function(cambios){
            cambios.forEach(function(cambio){
                cambio.addedNodes.forEach(function(nodo){
                    if(!(nodo instanceof Element))return;
                    if(nodo.id===ID)registrarControl(nodo);
                    const dentro=nodo.querySelector&&nodo.querySelector('#'+ID);
                    if(dentro)registrarControl(dentro);
                });
                cambio.removedNodes.forEach(function(nodo){
                    if(!(nodo instanceof Element))return;
                    const era=nodo===vistoActual||nodo.id===ID||(nodo.querySelector&&vistoActual&&nodo.contains(vistoActual));
                    if(era)alDesaparecer();
                });
            });
        });
        observer.observe(document.documentElement,{childList:true,subtree:true});
    }

    function iniciar(){
        if(instalada())return;
        observar();

        const n=apariciones();
        if(n>=MAX)return;

        let legacy=false;
        try{legacy=sessionStorage.getItem(LEGACY_HIDE_KEY)==='1';}catch(_e){}
        if(n===0&&legacy&&!document.getElementById(ID)){
            guardarSesion(COUNT_KEY,1);
            programarSegunda(Date.now()+ESPERA);
            return;
        }

        if(apariciones()===1&&!document.getElementById(ID)){
            const cuando=leerSesionNumero(NEXT_KEY)||Date.now()+ESPERA;
            programarSegunda(cuando);
        }

        document.addEventListener('visibilitychange',function(){
            if(!document.hidden&&apariciones()===1&&!document.getElementById(ID))intentarSegunda();
        });
    }

    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();