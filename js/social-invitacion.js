/* LSPedia — invitación inteligente a redes sociales.
   Objetivo: aumentar seguidores sin interrumpir la experiencia.
   Reglas:
   - Primera aparición: desde 12 s con interés o respaldo a los 30 s.
   - Máximo dos apariciones por sesión; la segunda espera 90 s tras cerrar la primera.
   - Cada aparición permanece hasta 30 s.
   - Tocar una red NO cierra la invitación.
   - Se cierra con “Ahora no”, con la X o automáticamente.
   - Si se cierra sin visitar redes, descansa 5 días; si visita una red, 15 días.
   - No aparece sobre modales, teclado, pantalla completa ni splash.
   - ?socialtest=1 permite probar sin alterar descansos reales.
*/
(function(){
    'use strict';

    if(window.__LSPEDIA_SOCIAL_INVITE_RUNNING__) return;
    window.__LSPEDIA_SOCIAL_INVITE_RUNNING__=true;

    const VERSION='1';
    const SESSION_KEY='lsp_social_invite_session_v'+VERSION;
    const SECOND_AT_KEY='lsp_social_invite_second_at_v'+VERSION;
    const NEXT_KEY='lsp_social_invite_next_v'+VERSION;
    const VISIT_KEY='lsp_social_invite_social_visit_v'+VERSION;
    const MIGRATION_KEY='lsp_social_invite_cooldown_20261001b';
    const CINCO_DIAS=5*24*60*60*1000;
    const QUINCE_DIAS=15*24*60*60*1000;
    const TIEMPO_VISIBLE=30*1000;
    const ESPERA_SEGUNDA=90*1000;
    const MAX_SESION=2;
    const INICIO=Date.now();
    const MODO_PRUEBA=(function(){
        try{return new URLSearchParams(window.location.search).get('socialtest')==='1';}
        catch(_e){return false;}
    })();

    let puntos=0;
    let scrollContado=false;
    let busquedaContada=false;
    let navegacionContada=false;
    let visible=false;
    let temporizador=0;
    let temporizadorCierre=0;
    let tarjeta=null;
    let visitoRed=false;

    const REDES=[
        {
            id:'tiktok',nombre:'TikTok',href:'https://www.tiktok.com/@lspedia',clase:'lsp-social-tiktok',
            svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 5.82c-.7-.77-1.14-1.75-1.24-2.82h-3.1v13.44c0 1.5-1.22 2.72-2.72 2.72a2.72 2.72 0 0 1-2.72-2.72 2.72 2.72 0 0 1 2.72-2.72c.29 0 .56.04.82.12v-3.14a5.9 5.9 0 0 0-.82-.06A5.86 5.86 0 0 0 3.68 16.5a5.86 5.86 0 0 0 5.86 5.86 5.86 5.86 0 0 0 5.86-5.86V9.01a8.9 8.9 0 0 0 5.2 1.67V7.58a5.8 5.8 0 0 1-4-1.76z"/></svg>'
        },
        {
            id:'instagram',nombre:'Instagram',href:'https://www.instagram.com/lspedia_sign',clase:'lsp-social-instagram',
            svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.55.22.95.47 1.37.89.42.42.67.82.89 1.37.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.55-.47.95-.89 1.37-.42.42-.82.67-1.37.89-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.69 3.69 0 0 1-1.37-.89 3.69 3.69 0 0 1-.89-1.37c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.55.47-.95.89-1.37.42-.42.82-.67 1.37-.89.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.31-1.46.72-2.13 1.38A5.86 5.86 0 0 0 .63 4.14c-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.66.66 1.34 1.07 2.13 1.38.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38a5.86 5.86 0 0 0 1.38-2.13c.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.13A5.86 5.86 0 0 0 19.86.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0z"/><path fill="currentColor" d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zM18.41 4.15a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/></svg>'
        },
        {
            id:'youtube',nombre:'YouTube',href:'https://www.youtube.com/@LSPedia-sign',clase:'lsp-social-youtube',
            svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.87.55 9.38.55 9.38.55s7.51 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.6 15.6V8.4l6.27 3.6z"/></svg>'
        },
        {
            id:'facebook',nombre:'Facebook',href:'https://www.facebook.com/lspedia.sign',clase:'lsp-social-facebook',
            svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>'
        }
    ];

    const TEXTOS={
        es:{eyebrow:'COMUNIDAD LSPEDIA',title:'¿Te está ayudando LSPedia? 🤟',text:'Síguenos para descubrir nuevas palabras, videos y contenido visual sobre Lengua de Señas Peruana.',note:'Lo mostramos solo de vez en cuando.',later:'Ahora no',close:'Cerrar invitación a redes sociales'},
        en:{eyebrow:'LSPEDIA COMMUNITY',title:'Is LSPedia helping you? 🤟',text:'Follow us for new words, videos and visual content about Peruvian Sign Language.',note:'We only show this occasionally.',later:'Not now',close:'Close social media invitation'}
    };

    function idioma(){
        try{
            if(window.LSPediaIdioma&&typeof window.LSPediaIdioma.obtener==='function') return window.LSPediaIdioma.obtener()==='en'?'en':'es';
            return localStorage.getItem('lspedia_idioma_v1')==='en'?'en':'es';
        }catch(_e){return'es';}
    }
    function ahora(){return Date.now();}
    function guardarLocal(clave,valor){try{localStorage.setItem(clave,String(valor));}catch(_e){}}
    function leerLocalNumero(clave){try{const n=Number(localStorage.getItem(clave)||0);return Number.isFinite(n)?n:0;}catch(_e){return 0;}}
    function leerSesionNumero(clave){try{const n=Number(sessionStorage.getItem(clave)||0);return Number.isFinite(n)?n:0;}catch(_e){return 0;}}
    function guardarSesion(clave,valor){try{sessionStorage.setItem(clave,String(valor));}catch(_e){}}
    function aparicionesSesion(){return Math.min(MAX_SESION,Math.max(0,leerSesionNumero(SESSION_KEY)));}
    function registrarAparicionSesion(){const n=Math.min(MAX_SESION,aparicionesSesion()+1);guardarSesion(SESSION_KEY,n);return n;}
    function sesionCompleta(){return aparicionesSesion()>=MAX_SESION;}
    function aplazar(ms){guardarLocal(NEXT_KEY,ahora()+ms);}

    function migrarFrecuenciaAnterior(){
        try{
            if(localStorage.getItem(MIGRATION_KEY)==='1')return;
            const proxima=leerLocalNumero(NEXT_KEY),visita=leerLocalNumero(VISIT_KEY),ahoraMs=ahora();
            if(proxima>ahoraMs){
                let nuevaProxima=proxima;
                if(visita>0)nuevaProxima=Math.min(proxima,visita+QUINCE_DIAS);
                else nuevaProxima=Math.min(proxima,ahoraMs+CINCO_DIAS);
                guardarLocal(NEXT_KEY,Math.max(ahoraMs,nuevaProxima));
            }
            localStorage.setItem(MIGRATION_KEY,'1');
        }catch(_e){}
    }

    function registrarGA(nombre,parametros){
        try{if(typeof window.gtag==='function')window.gtag('event',nombre,Object.assign({feature:'social_invite',test:MODO_PRUEBA?1:0},parametros||{}));}catch(_e){}
    }

    function elementoVisible(el){
        if(!el)return false;
        try{const estilo=window.getComputedStyle(el);if(!estilo||estilo.display==='none'||estilo.visibility==='hidden'||estilo.opacity==='0')return false;return!!(el.offsetWidth||el.offsetHeight||el.getClientRects().length);}catch(_e){return false;}
    }
    function tecladoVirtualVisible(){
        const activo=document.activeElement;
        if(!activo||!/^(INPUT|TEXTAREA|SELECT)$/.test(activo.tagName))return false;
        const vv=window.visualViewport;if(!vv)return false;
        const diferencia=Math.max(0,(window.innerHeight||0)-vv.height);
        return diferencia>Math.max(120,(window.innerHeight||0)*0.16);
    }
    function bloqueadoTemporalmente(){
        if(document.hidden||document.fullscreenElement)return true;
        const splash=document.getElementById('splashScreen');
        if(splash&&!splash.classList.contains('splash-oculto')&&elementoVisible(splash))return true;
        if(document.body.classList.contains('modal-open')){
            const modalVisible=document.querySelector('.modal.show,.offcanvas.show');
            if(modalVisible&&elementoVisible(modalVisible))return true;
        }
        const overlays=Array.from(document.querySelectorAll('.modal.show,.offcanvas.show,[aria-modal="true"]'));
        if(overlays.some(function(el){return!el.classList.contains('lsp-social-invite')&&elementoVisible(el);}))return true;
        return tecladoVirtualVisible();
    }

    function elegible(){
        if(visible||tarjeta||sesionCompleta()||bloqueadoTemporalmente())return false;
        const apariciones=aparicionesSesion();
        if(apariciones===0){
            if(!MODO_PRUEBA&&leerLocalNumero(NEXT_KEY)>ahora())return false;
            const transcurrido=ahora()-INICIO;
            return(transcurrido>=12000&&puntos>=2)||transcurrido>=30000;
        }
        const segundaDesde=leerSesionNumero(SECOND_AT_KEY);
        return segundaDesde>0&&ahora()>=segundaDesde;
    }

    function actualizarTextos(){
        if(!tarjeta)return;
        const t=TEXTOS[idioma()];
        const mapa=[['eyebrow','[data-social-i18n="eyebrow"]'],['title','[data-social-i18n="title"]'],['text','[data-social-i18n="text"]'],['note','[data-social-i18n="note"]'],['later','[data-social-i18n="later"]']];
        mapa.forEach(function(par){const el=tarjeta.querySelector(par[1]);if(el)el.textContent=t[par[0]];});
        const close=tarjeta.querySelector('.lsp-social-invite-close');if(close)close.setAttribute('aria-label',t.close);
    }

    function registrarVisitaRed(redId){
        visitoRed=true;
        registrarGA('social_invite_click',{network:redId,appearance:aparicionesSesion()});
        if(MODO_PRUEBA)return;
        guardarLocal(VISIT_KEY,ahora());
        aplazar(QUINCE_DIAS);
    }

    function programarSegunda(){
        if(sesionCompleta())return;
        const cuando=ahora()+ESPERA_SEGUNDA;
        guardarSesion(SECOND_AT_KEY,cuando);
        clearTimeout(temporizador);
        temporizador=setTimeout(evaluar,ESPERA_SEGUNDA+50);
    }

    function cerrar(motivo){
        if(!tarjeta)return;
        clearTimeout(temporizadorCierre);
        visible=false;
        tarjeta.classList.remove('is-visible');
        if(!MODO_PRUEBA){
            if(visitoRed){
                const visita=leerLocalNumero(VISIT_KEY)||ahora();
                guardarLocal(NEXT_KEY,Math.max(leerLocalNumero(NEXT_KEY),visita+QUINCE_DIAS));
            }else aplazar(CINCO_DIAS);
        }
        registrarGA('social_invite_close',{reason:motivo||'dismiss',appearance:aparicionesSesion()});
        const cerrada=tarjeta;
        setTimeout(function(){
            if(cerrada&&cerrada.parentNode)cerrada.remove();
            if(tarjeta===cerrada)tarjeta=null;
            if(!sesionCompleta())programarSegunda();
        },420);
    }

    function crear(){
        if(tarjeta)return tarjeta;
        const cont=document.createElement('aside');
        cont.className='lsp-social-invite';
        cont.setAttribute('role','dialog');
        cont.setAttribute('aria-modal','false');
        cont.setAttribute('aria-labelledby','lspSocialInviteTitle');
        cont.innerHTML=''
            +'<div class="lsp-social-invite-card">'
            +'<span class="lsp-social-invite-glow" aria-hidden="true"></span>'
            +'<button type="button" class="lsp-social-invite-close" aria-label="Cerrar">×</button>'
            +'<div class="lsp-social-invite-inner">'
            +'<div class="lsp-social-invite-head">'
            +'<div class="lsp-social-invite-brand"><img src="img/favicon.png" alt="" aria-hidden="true"></div>'
            +'<div class="lsp-social-invite-copy"><p class="lsp-social-invite-eyebrow" data-social-i18n="eyebrow"></p><h2 id="lspSocialInviteTitle" class="lsp-social-invite-title" data-social-i18n="title"></h2></div>'
            +'</div>'
            +'<p class="lsp-social-invite-text" data-social-i18n="text"></p>'
            +'<div class="lsp-social-invite-grid"></div>'
            +'<div class="lsp-social-invite-foot"><span class="lsp-social-invite-note" data-social-i18n="note"></span><button type="button" class="lsp-social-later" data-social-i18n="later"></button></div>'
            +'</div></div>';
        const grid=cont.querySelector('.lsp-social-invite-grid');
        REDES.forEach(function(red){
            const a=document.createElement('a');a.className='lsp-social-link '+red.clase;a.href=red.href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','LSPedia en '+red.nombre);a.dataset.red=red.id;a.innerHTML='<span class="lsp-social-link-icon">'+red.svg+'</span><span>'+red.nombre+'</span>';
            a.addEventListener('click',function(){registrarVisitaRed(red.id);});
            grid.appendChild(a);
        });
        cont.querySelector('.lsp-social-invite-close').addEventListener('click',function(){cerrar('close');});
        cont.querySelector('.lsp-social-later').addEventListener('click',function(){cerrar('later');});
        document.body.appendChild(cont);tarjeta=cont;actualizarTextos();return cont;
    }

    function mostrar(){
        if(!elegible())return false;
        const numero=registrarAparicionSesion();
        if(numero>=MAX_SESION){try{sessionStorage.removeItem(SECOND_AT_KEY);}catch(_e){}}
        visible=true;
        const el=crear();
        requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('is-visible');});});
        clearTimeout(temporizadorCierre);
        temporizadorCierre=setTimeout(function(){cerrar('auto');},TIEMPO_VISIBLE);
        registrarGA('social_invite_view',{points:puntos,seconds:Math.round((ahora()-INICIO)/1000),appearance:numero});
        return true;
    }

    function evaluar(){
        clearTimeout(temporizador);
        if(mostrar())return;
        if(sesionCompleta()||visible)return;
        const apariciones=aparicionesSesion();
        if(apariciones===0){
            if(!MODO_PRUEBA&&leerLocalNumero(NEXT_KEY)>ahora())return;
            temporizador=setTimeout(evaluar,2000);
            return;
        }
        const cuando=leerSesionNumero(SECOND_AT_KEY);
        if(cuando>0)temporizador=setTimeout(evaluar,Math.max(500,Math.min(4000,cuando-ahora())));
    }

    function sumarPunto(tipo){
        if(tipo==='scroll'&&scrollContado)return;if(tipo==='search'&&busquedaContada)return;if(tipo==='nav'&&navegacionContada)return;
        if(tipo==='scroll')scrollContado=true;if(tipo==='search')busquedaContada=true;if(tipo==='nav')navegacionContada=true;
        puntos=Math.min(5,puntos+1);evaluar();
    }

    function observarInteres(){
        let scrollRaf=0;
        window.addEventListener('scroll',function(){if(scrollRaf)return;scrollRaf=requestAnimationFrame(function(){scrollRaf=0;const doc=document.documentElement,total=Math.max(1,doc.scrollHeight-window.innerHeight);if((window.scrollY||0)/total>=.34)sumarPunto('scroll');});},{passive:true});
        document.addEventListener('input',function(e){const el=e.target;if(el&&(el.id==='buscar'||el.id==='buscarCategorias')&&String(el.value||'').trim().length>=2)sumarPunto('search');},true);
        document.addEventListener('click',function(e){
            const target=e.target.closest&&e.target.closest('.categoria-card,.categoria-dicc-card,.lsp-nueva-palabra,#resultado a,#resultado button,#resultadoCategorias a,#resultadoCategorias button,.nav-link,.mobile-bottom-item');if(target)sumarPunto('nav');
            const social=e.target.closest&&e.target.closest('.footer-red-tiktok,.footer-red-instagram,.footer-red-youtube,.footer-red-facebook,.stat2-red-tiktok,.stat2-red-instagram,.stat2-red-youtube,.stat2-red-facebook');
            if(social&&!MODO_PRUEBA){guardarSesion(SESSION_KEY,MAX_SESION);guardarLocal(VISIT_KEY,ahora());aplazar(QUINCE_DIAS);}
        },true);
        document.addEventListener('visibilitychange',function(){if(!document.hidden)evaluar();});
        document.addEventListener('lspedia:idiomaCambiado',actualizarTextos);
        if(window.visualViewport)window.visualViewport.addEventListener('resize',function(){if(!tecladoVirtualVisible())evaluar();},{passive:true});
    }

    function cargarRepeticionInstalacion(){
        if(document.querySelector('script[data-lspedia-pwa-repeat]'))return;
        const s=document.createElement('script');s.src='js/pwa-repeat.js?v=20261001-1';s.async=true;s.dataset.lspediaPwaRepeat='1';document.head.appendChild(s);
    }

    function iniciar(){
        cargarRepeticionInstalacion();
        if(!MODO_PRUEBA)migrarFrecuenciaAnterior();
        if(sesionCompleta())return;
        const apariciones=aparicionesSesion();
        if(apariciones===0&&!MODO_PRUEBA&&leerLocalNumero(NEXT_KEY)>ahora())return;
        observarInteres();
        if(apariciones===1){
            if(!leerSesionNumero(SECOND_AT_KEY))guardarSesion(SECOND_AT_KEY,ahora()+ESPERA_SEGUNDA);
            evaluar();
            return;
        }
        setTimeout(function(){puntos=Math.max(puntos,1);evaluar();},12000);
        temporizador=setTimeout(evaluar,14000);
        setTimeout(evaluar,30000);
    }

    window.LSPediaSocialInvite={
        mostrar:function(){puntos=5;if(aparicionesSesion()===1)guardarSesion(SECOND_AT_KEY,ahora());return mostrar();},
        cerrar:cerrar,
        estado:function(){return{puntos:puntos,visible:visible,apariciones:aparicionesSesion(),maximo:MAX_SESION,segundaDesde:leerSesionNumero(SECOND_AT_KEY),proxima:leerLocalNumero(NEXT_KEY),prueba:MODO_PRUEBA,bloqueado:bloqueadoTemporalmente(),visitoRed:visitoRed};}
    };

    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();