/* LSPedia — mejoras de producto no invasivas.
   Modo Aprender, Nuevas palabras, compartir y telemetría técnica mínima. */
(function(){
    'use strict';

    const CLAVE_MODO = 'lspedia_modo_aprender_v1';
    const CLAVE_PROGRESO = 'lspedia_progreso_palabras_v1';
    const enviados = new Set();
    let nuevas = [];
    let observerResultado = null;

    function $(id){ return document.getElementById(id); }
    function texto(v){ return String(v == null ? '' : v).trim(); }
    function refPalabra(p){
        try { if (typeof window.obtenerIdPalabra === 'function') return texto(window.obtenerIdPalabra(p)); } catch(_e){}
        return texto(p && (p.id || p.palabra));
    }
    function datosDiccionario(){
        return window.App && Array.isArray(window.App.datos) ? window.App.datos.filter(p=>p&&p.palabra) : [];
    }
    function visible(el){
        if(!el || el.classList.contains('d-none')) return false;
        const s=getComputedStyle(el); return s.display!=='none' && s.visibility!=='hidden';
    }
    function esInicioDiccionario(){
        const buscador=$('bloqueBuscador');
        if(!visible(buscador)) return false;
        if($('resultado') && $('resultado').children.length) return false;
        if($('resultadoCategoriasDiccionario') && $('resultadoCategoriasDiccionario').children.length) return false;
        const panel=$('panelCategorias');
        if(panel && panel.children.length && visible(panel)) return false;
        return true;
    }
    function seccionActual(){
        const ids=[['seccionAlfabetizacion','alfabetizacion'],['seccionQuiz','quiz'],['seccionJuegos','juegos'],['seccionSubtitulos','subtitulos'],['seccionNosotros','nosotros']];
        for(const [id,nombre] of ids){ if(visible($(id))) return nombre; }
        if(visible($('bloqueBuscadorCategorias'))) return 'vocabulario';
        return 'diccionario';
    }
    function gtagEvento(nombre, parametros){
        try { if(typeof window.gtag==='function') window.gtag('event',nombre,parametros||{}); } catch(_e){}
    }
    function rutaSegura(src){
        try{
            const u=new URL(src||'',location.href);
            if(u.origin!==location.origin) return 'externo';
            return u.pathname.slice(0,140);
        }catch(_e){ return 'desconocido'; }
    }

    // Telemetría técnica: solo tipo de fallo, sección y ruta local pública.
    // Nunca envía búsquedas, mensajes del usuario, stacks ni contenido escrito.
    document.addEventListener('error',function(ev){
        const t=ev.target;
        if(t && t!==window && ['IMG','VIDEO','AUDIO'].includes(t.tagName)){
            const tipo=t.tagName.toLowerCase();
            const src=t.currentSrc||t.src||'';
            const ruta=rutaSegura(src);
            const clave=tipo+'|'+ruta;
            if(enviados.has(clave)) return;
            enviados.add(clave);
            gtagEvento(tipo==='IMG'?'image_load_error':'media_load_error',{
                media_type:tipo,
                resource_path:ruta,
                app_section:seccionActual()
            });
            return;
        }
        const clave='runtime|'+seccionActual();
        if(!enviados.has(clave)){
            enviados.add(clave);
            gtagEvento('app_runtime_error',{error_kind:'javascript',app_section:seccionActual()});
        }
    },true);
    window.addEventListener('unhandledrejection',function(){
        const clave='promise|'+seccionActual();
        if(enviados.has(clave)) return;
        enviados.add(clave);
        gtagEvento('app_runtime_error',{error_kind:'promise',app_section:seccionActual()});
    });

    function leerModo(){
        try{
            const x=JSON.parse(localStorage.getItem(CLAVE_MODO)||'null');
            return x&&typeof x==='object'?x:{activo:false,indice:0,iniciado:false};
        }catch(_e){return {activo:false,indice:0,iniciado:false};}
    }
    function guardarModo(x){ try{localStorage.setItem(CLAVE_MODO,JSON.stringify(x));}catch(_e){} }
    function listaAprender(){
        return datosDiccionario().slice().sort((a,b)=>texto(a.palabra).localeCompare(texto(b.palabra),'es',{sensitivity:'base'}));
    }
    function referenciasVistas(){
        try{
            const p=JSON.parse(localStorage.getItem(CLAVE_PROGRESO)||'null');
            const set=new Set();
            (p&&Array.isArray(p.items)?p.items:[]).forEach(x=>{
                if(x&&x.fuente==='diccionario'&&x.referencia) set.add(texto(x.referencia));
            });
            return set;
        }catch(_e){return new Set();}
    }
    function indiceInicial(lista){
        const modo=leerModo();
        if(modo.iniciado && Number.isInteger(modo.indice) && modo.indice>=0 && modo.indice<lista.length) return modo.indice;
        const vistas=referenciasVistas();
        const idx=lista.findIndex(p=>!vistas.has(refPalabra(p)));
        return idx>=0?idx:0;
    }
    function abrirAprender(indice){
        const lista=listaAprender(); if(!lista.length) return;
        const i=Math.max(0,Math.min(lista.length-1,Number(indice)||0));
        const modo={activo:true,iniciado:true,indice:i,referencia:refPalabra(lista[i]),actualizado:Date.now()};
        guardarModo(modo);
        if(typeof window.mostrarPalabra==='function'){
            window.mostrarPalabra(lista[i]);
            setTimeout(()=>{renderBarraAprender();actualizarTarjetaModo();window.scrollTo({top:0,behavior:'smooth'});},50);
        } else {
            location.href=location.pathname+'?p='+encodeURIComponent(modo.referencia);
        }
        gtagEvento('learning_mode_step',{action:'open',step:i+1});
    }
    function iniciarOContinuar(){
        const lista=listaAprender(); if(!lista.length) return;
        abrirAprender(indiceInicial(lista));
    }
    function finalizarModo(){
        const modo=leerModo(); modo.activo=false; guardarModo(modo);
        const bar=$('lspAprenderBar'); if(bar) bar.remove();
        actualizarTarjetaModo();
        gtagEvento('learning_mode_step',{action:'finish'});
    }
    function renderBarraAprender(){
        const modo=leerModo();
        const destino=$('resultado');
        if(!modo.activo||!destino||!destino.children.length){const viejo=$('lspAprenderBar');if(viejo)viejo.remove();return;}
        const lista=listaAprender(); if(!lista.length) return;
        let i=Number(modo.indice)||0;
        const actual=texto($('buscar')&&$('buscar').value).toLocaleLowerCase('es-PE');
        const hallado=lista.findIndex(p=>texto(p.palabra).toLocaleLowerCase('es-PE')===actual);
        if(hallado>=0){i=hallado;modo.indice=i;modo.referencia=refPalabra(lista[i]);guardarModo(modo);}
        let bar=$('lspAprenderBar');
        if(!bar){bar=document.createElement('div');bar.id='lspAprenderBar';bar.className='lsp-aprender-bar';destino.insertBefore(bar,destino.firstChild);}
        bar.innerHTML='<strong>📘 Modo Aprender</strong><span class="lsp-aprender-progreso">'+(i+1)+' / '+lista.length+'</span>'+
          '<button class="lsp-aprender-nav" id="lspAprenderPrev" type="button" '+(i===0?'disabled':'')+'>← Anterior</button>'+
          '<button class="lsp-aprender-nav primary" id="lspAprenderNext" type="button">'+(i>=lista.length-1?'Reiniciar':'Siguiente →')+'</button>'+
          '<button class="lsp-aprender-fin" id="lspAprenderFin" type="button">Salir</button>';
        $('lspAprenderPrev').onclick=()=>abrirAprender(Math.max(0,i-1));
        $('lspAprenderNext').onclick=()=>abrirAprender(i>=lista.length-1?0:i+1);
        $('lspAprenderFin').onclick=finalizarModo;
    }

    function leerResumenProgreso(){
        try{
            const p=JSON.parse(localStorage.getItem(CLAVE_PROGRESO)||'null');
            const items=(p&&Array.isArray(p.items)?p.items:[])
                .filter(x=>x&&x.fuente==='diccionario'&&x.referencia&&x.palabra)
                .sort((a,b)=>(Number(b.ultimaVez)||0)-(Number(a.ultimaVez)||0));
            return {cantidad:items.length,ultima:items[0]||null};
        }catch(_e){return {cantidad:0,ultima:null};}
    }

    function asegurarInicio(){
        const hero=$('filaHeroPrincipal'); if(!hero) return null;
        let sec=$('lspMejorasInicio');
        if(sec) return sec;
        sec=document.createElement('section');
        sec.id='lspMejorasInicio';
        sec.setAttribute('aria-label','Aprender y descubrir palabras');
        sec.innerHTML='<div class="lsp-mejoras-grid">'+
          '<article class="lsp-mejora-card lsp-aprendizaje-unificado" id="lspModoCard"><div class="lsp-mejora-head"><h2 class="lsp-mejora-titulo"><span class="lsp-mejora-icono">📘</span>Tu aprendizaje</h2></div><p class="lsp-mejora-sub">Recorre el Diccionario palabra por palabra cuando tú quieras.</p><div class="lsp-aprender-estado" id="lspModoEstado"></div><button class="lsp-aprender-btn" id="lspModoBtn" type="button">Empezar a aprender</button><div class="lsp-aprender-meta" id="lspModoMeta">Tú decides cuándo entrar. Tu avance se guarda solo en este dispositivo.</div></article>'+
          '<article class="lsp-mejora-card" id="lspNuevasCard"><div class="lsp-mejora-head"><h2 class="lsp-mejora-titulo"><span class="lsp-mejora-icono">✨</span>Nuevas palabras</h2></div><p class="lsp-mejora-sub">Descubre palabras publicadas recientemente en el Diccionario.</p><div class="lsp-nuevas-lista" id="lspNuevasLista"><span class="lsp-mejora-sub">Cargando…</span></div></article>'+
          '</div>';
        hero.insertAdjacentElement('afterend',sec);
        $('lspModoBtn').onclick=iniciarOContinuar;
        return sec;
    }
    function actualizarTarjetaModo(){
        const btn=$('lspModoBtn'),meta=$('lspModoMeta'),estado=$('lspModoEstado');
        if(!btn||!meta)return;
        const modo=leerModo(),lista=listaAprender(),progreso=leerResumenProgreso();
        if(!lista.length){
            btn.disabled=true;
            btn.textContent='Sin palabras disponibles';
            if(estado) estado.innerHTML='<strong>Aún no hay palabras disponibles.</strong>';
            return;
        }
        btn.disabled=false;
        btn.textContent=modo.iniciado?'Continuar aprendiendo':'Empezar a aprender';
        if(estado){
            const cantidad=progreso.cantidad;
            const base=cantidad===0
                ? '<strong>Aún no has empezado.</strong><span>Entra cuando quieras.</span>'
                : '<strong>Has explorado '+cantidad+' '+(cantidad===1?'palabra':'palabras')+'.</strong>'+(progreso.ultima?'<span>Última palabra: '+escapeHtml(texto(progreso.ultima.palabra))+'</span>':'');
            const paso=modo.iniciado?'<span>Modo Aprender: '+Math.min((Number(modo.indice)||0)+1,lista.length)+' de '+lista.length+'.</span>':'';
            estado.innerHTML=base+paso;
        }
        meta.textContent='Tú decides cuándo entrar. Tu avance se guarda solo en este dispositivo.';
    }
    function renderNuevas(){
        const caja=$('lspNuevasLista');if(!caja)return;
        const actuales=datosDiccionario();
        const publicadas=nuevas.map(x=>{
            const p=actuales.find(y=>refPalabra(y)===texto(x.id))||actuales.find(y=>texto(y.palabra).toLocaleLowerCase('es-PE')===texto(x.palabra).toLocaleLowerCase('es-PE'));
            return p?{registro:x,palabra:p}:null;
        }).filter(Boolean);
        if(!publicadas.length){
            caja.innerHTML='<span class="lsp-mejora-sub">Las próximas palabras publicadas aparecerán aquí.</span>';
            return;
        }
        caja.innerHTML=publicadas.slice(0,8).map((x,i)=>'<button type="button" class="lsp-nueva-palabra" data-nueva="'+i+'"><span class="lsp-nueva-badge">NUEVA</span><span class="lsp-nueva-nombre">'+escapeHtml(texto(x.palabra.palabra))+'</span><span class="lsp-nueva-cat">'+escapeHtml(texto(x.palabra.categoria)||'Diccionario')+'</span></button>').join('');
        caja.querySelectorAll('[data-nueva]').forEach(btn=>btn.onclick=()=>{
            const x=publicadas[Number(btn.dataset.nueva)]; if(!x||!x.palabra)return;
            if(typeof window.mostrarPalabra==='function'){window.mostrarPalabra(x.palabra);window.scrollTo({top:0,behavior:'smooth'});}
        });
    }
    function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
    async function cargarNuevas(){
        try{const r=await fetch('data/nuevas-palabras.json?_='+Date.now(),{cache:'no-store'});if(r.ok){const d=await r.json();nuevas=Array.isArray(d.items)?d.items:[];}}catch(_e){nuevas=[];}
        renderNuevas();
    }
    function sincronizarInicio(){const sec=asegurarInicio();if(sec)sec.style.display=esInicioDiccionario()?'':'none';actualizarTarjetaModo();}

    function palabraActualCompartir(){
        const params=new URLSearchParams(location.search);
        const nombreDom=texto(document.querySelector('#resultado h1,#resultado h2,#resultadoCategorias h1,#resultadoCategorias h2')?.textContent).replace(/^['“"]|['”"]$/g,'');
        const nombre=nombreDom||texto($('buscar')&&$('buscar').value)||texto(params.get('p'))||'LSPedia';
        let url=location.href;
        if(!params.get('p')) url=location.origin+location.pathname+'?p='+encodeURIComponent(nombre);
        return {nombre,url};
    }
    function toast(m){let t=$('lspShareToast');if(!t){t=document.createElement('div');t.id='lspShareToast';t.className='lsp-share-toast';document.body.appendChild(t);}t.textContent=m;t.classList.add('show');clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.remove('show'),1800);}
    function cerrarShare(){const x=$('lspShareOverlay');if(x)x.remove();}
    function abrirShare(){
        cerrarShare();
        const p=palabraActualCompartir();
        const textoShare='Mira “'+p.nombre+'” en LSPedia: significado y apoyo visual en Lengua de Señas Peruana.';
        const ov=document.createElement('div');ov.id='lspShareOverlay';ov.className='lsp-share-overlay';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Compartir palabra');
        ov.innerHTML='<div class="lsp-share-sheet"><div class="lsp-share-grip"></div><div class="lsp-share-head"><div><h3>Compartir “'+escapeHtml(p.nombre)+'”</h3><p>Envía esta palabra directamente a otra persona.</p></div><button class="lsp-share-close" id="lspShareClose" aria-label="Cerrar" type="button">×</button></div><div class="lsp-share-actions"><button class="lsp-share-action whatsapp" id="lspShareWhats" type="button"><span>💬</span>WhatsApp</button><button class="lsp-share-action" id="lspShareCopy" type="button"><span>🔗</span>Copiar enlace</button><button class="lsp-share-action more" id="lspShareMore" type="button"><span>↗</span>Más opciones</button></div></div>';
        document.body.appendChild(ov);
        $('lspShareClose').onclick=cerrarShare;ov.onclick=e=>{if(e.target===ov)cerrarShare();};
        $('lspShareWhats').onclick=()=>{gtagEvento('word_share',{share_method:'whatsapp',app_section:seccionActual()});window.open('https://wa.me/?text='+encodeURIComponent(textoShare+' '+p.url),'_blank','noopener');};
        $('lspShareCopy').onclick=async()=>{try{await navigator.clipboard.writeText(p.url);toast('🔗 Enlace copiado');gtagEvento('word_share',{share_method:'copy',app_section:seccionActual()});}catch(_e){window.prompt('Copia este enlace:',p.url);}};
        $('lspShareMore').onclick=async()=>{if(navigator.share){try{await navigator.share({title:'LSPedia — '+p.nombre,text:textoShare,url:p.url});gtagEvento('word_share',{share_method:'native',app_section:seccionActual()});}catch(_e){}}else{try{await navigator.clipboard.writeText(p.url);toast('🔗 Enlace copiado');}catch(_e){}}};
    }
    // Intercepta el botón existente antes de su listener para ofrecer opciones claras.
    document.addEventListener('click',function(e){const b=e.target&&e.target.closest?e.target.closest('#btnCompartir'):null;if(!b)return;e.preventDefault();e.stopImmediatePropagation();abrirShare();},true);

    function iniciar(){
        asegurarInicio();actualizarTarjetaModo();cargarNuevas();sincronizarInicio();
        const resultado=$('resultado');
        if(resultado){observerResultado=new MutationObserver(()=>{renderBarraAprender();sincronizarInicio();});observerResultado.observe(resultado,{childList:true,subtree:false});}
        ['panelCategorias','resultadoCategoriasDiccionario','bloqueBuscador','bloqueBuscadorCategorias'].forEach(id=>{const n=$(id);if(n)new MutationObserver(sincronizarInicio).observe(n,{attributes:true,childList:true,attributeFilter:['class','style']});});
        window.addEventListener('popstate',()=>setTimeout(()=>{sincronizarInicio();renderBarraAprender();},30));
        document.addEventListener('lspedia:datosListos',()=>{actualizarTarjetaModo();renderNuevas();sincronizarInicio();renderBarraAprender();});
        setTimeout(()=>{sincronizarInicio();renderBarraAprender();},250);
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar,{once:true}); else iniciar();
    window.LSPediaMejoras={iniciarModoAprender:iniciarOContinuar,finalizarModoAprender:finalizarModo};
})();
