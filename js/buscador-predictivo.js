/* LSPedia — predicción inteligente del Diccionario
   -------------------------------------------------
   Se ejecuta DESPUÉS de script.js y buscador-visual.js.

   Objetivos:
   - sugerir mientras la persona escribe, incluso con palabra incompleta;
   - mezclar coincidencias por prefijo con correcciones probables, sin esperar
     a que no exista ningún resultado;
   - relacionar formas gramaticales con su palabra base;
   - mostrar SIEMPRE la escritura canónica de LSPedia, nunca el error escrito;
   - dar una pequeña prioridad a resultados realmente elegidos en este
     dispositivo, sin enviar ni guardar datos personales;
   - no modificar el buscador de Vocabulario.
*/
(function(){
    'use strict';

    const CLAVE_PRIORIDAD = 'lspedia_busquedas_diccionario_local_v1';
    const MAX_SUGERENCIAS = 9;
    let indiceActivo = -1;
    let ultimoTexto = '';

    function texto(v){ return String(v == null ? '' : v).trim(); }
    function normal(v){
        return texto(v)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g,'')
            .toLocaleLowerCase('es-PE')
            .replace(/[^a-z0-9\s]/g,' ')
            .replace(/\s+/g,' ')
            .trim();
    }
    function escapar(v){
        return String(v == null ? '' : v).replace(/[&<>"']/g, c=>({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        })[c]);
    }
    function urlImagenSegura(valor){
        const v=texto(valor).split(',').map(x=>x.trim()).filter(Boolean)[0]||'';
        if(!v) return '';
        try{
            const u=new URL(v,window.location.href);
            return (u.protocol==='http:'||u.protocol==='https:') ? u.href : '';
        }catch(_e){ return ''; }
    }

    function idioma(){
        try{
            return window.LSPediaIdioma && typeof window.LSPediaIdioma.obtener==='function'
                ? window.LSPediaIdioma.obtener()
                : 'es';
        }catch(_e){ return 'es'; }
    }
    function t(es,en){ return idioma()==='en' ? en : es; }

    function leerPrioridad(){
        try{
            const v=JSON.parse(localStorage.getItem(CLAVE_PRIORIDAD)||'{}');
            return v && typeof v==='object' ? v : {};
        }catch(_e){ return {}; }
    }
    function guardarPrioridad(v){
        try{ localStorage.setItem(CLAVE_PRIORIDAD,JSON.stringify(v)); }catch(_e){}
    }
    function registrarEleccion(p){
        if(!p || !p.palabra) return;
        const k=normal(p.palabra);
        if(!k) return;
        const v=leerPrioridad();
        const actual=v[k]&&typeof v[k]==='object'?v[k]:{conteo:0,ultima:0};
        actual.conteo=Math.min(999,Math.max(0,Number(actual.conteo)||0)+1);
        actual.ultima=Date.now();
        v[k]=actual;

        // Mantiene pequeño el registro local.
        const claves=Object.keys(v);
        if(claves.length>250){
            claves.sort((a,b)=>(Number(v[b]&&v[b].ultima)||0)-(Number(v[a]&&v[a].ultima)||0));
            claves.slice(250).forEach(x=>delete v[x]);
        }
        guardarPrioridad(v);
    }
    function bonoPrioridadLocal(p){
        const v=leerPrioridad()[normal(p&&p.palabra)];
        if(!v) return 0;
        const conteo=Math.max(0,Number(v.conteo)||0);
        const dias=(Date.now()-(Number(v.ultima)||0))/86400000;
        const bonoConteo=Math.min(7,Math.log2(conteo+1)*2);
        const bonoReciente=dias<=7?1:(dias<=30?0.4:0);
        return bonoConteo+bonoReciente;
    }

    function levenshtein(a,b){
        if(a===b) return 0;
        const la=a.length,lb=b.length;
        if(!la) return lb;
        if(!lb) return la;
        let prev=Array.from({length:lb+1},(_,i)=>i),curr=new Array(lb+1);
        for(let i=1;i<=la;i++){
            curr[0]=i;
            for(let j=1;j<=lb;j++){
                const costo=a[i-1]===b[j-1]?0:1;
                curr[j]=Math.min(prev[j]+1,curr[j-1]+1,prev[j-1]+costo);
            }
            [prev,curr]=[curr,prev];
        }
        return prev[lb];
    }

    function limiteEdicion(q){
        if(q.length<3) return 0;
        if(q.length<=4) return 1;
        if(q.length<=8) return 2;
        return 3;
    }

    function ayudas(){
        const a=window.LSPediaBusquedaAyudas;
        return a&&typeof a==='object'?a:{aliasOcultos:[],gramatica:[]};
    }
    function mapaAyudas(){
        const a=ayudas();
        const alias=new Map(),gramatica=new Map();
        (Array.isArray(a.aliasOcultos)?a.aliasOcultos:[]).forEach(x=>{
            const k=normal(x&&x.entrada); if(k) alias.set(k,x);
        });
        (Array.isArray(a.gramatica)?a.gramatica:[]).forEach(x=>{
            const k=normal(x&&x.forma); if(k) gramatica.set(k,x);
        });
        return {alias,gramatica};
    }

    function variantes(p){
        return texto(p&&p.variantes).split(',').map(x=>x.trim()).filter(Boolean);
    }

    // Todas las formas que una persona puede usar para llegar a una entrada.
    // Además del nombre y sus variantes, aprovechamos la traducción inglesa
    // cuando existe. Esto mantiene una sola ficha canónica en español.
    function formasIngles(p){
        return [
            p&&p.ingles,
            p&&p.word,
            p&&p.english,
            p&&p.traduccionIngles,
            p&&p.traduccioningles
        ].map(texto).filter(Boolean);
    }

    function normalizarFormaSimple(v){
        const q=normal(v);
        if(!q) return '';
        // Singular/plural sencillo del español. Solo se usa como señal de
        // relevancia; nunca reemplaza una coincidencia exacta.
        return q
            .replace(/^(los|las|unos|unas|un|una|el|la)\\s+/,'')
            .replace(/es$/,'')
            .replace(/s$/,'');
    }

    function aliasesOcultos(p){
        return Array.isArray(p&&p._aliasBusqueda)?p._aliasBusqueda.map(texto).filter(Boolean):[];
    }

    function objetivoCoincide(item,p){
        const objetivos=Array.isArray(item&&item.objetivos)?item.objetivos:[];
        const nombre=normal(p&&p.palabra);
        return objetivos.some(x=>normal(x)===nombre);
    }

    function etiquetaAlias(item){
        const tipo=normal(item&&item.tipo);
        if(tipo==='ortografia'||tipo==='sin tilde'||tipo==='sin_tilde'){
            return {tipo:'correccion',texto:t('Posible corrección','Possible correction')};
        }
        if(tipo==='abreviacion'||tipo==='coloquial'){
            return {tipo:'alias',texto:t('También puedes buscarlo así','Search shortcut')};
        }
        return {tipo:'alias',texto:t('Coincidencia relacionada','Related match')};
    }

    function clasificar(p,q,mapas){
        const nombre=normal(p&&p.palabra);
        if(!nombre||!q) return null;
        const vars=variantes(p).map(v=>({original:v,norm:normal(v)})).filter(x=>x.norm);
        const ocultos=aliasesOcultos(p).map(v=>({original:v,norm:normal(v)})).filter(x=>x.norm);
        const ingles=formasIngles(p).map(v=>({original:v,norm:normal(v)})).filter(x=>x.norm);

        if(nombre===q) return {score:0,tipo:'exacta',detalle:''};
        const vExacta=vars.find(x=>x.norm===q);
        if(vExacta) return {score:7,tipo:'variante',detalle:vExacta.original};

        const inglesExacto=ingles.find(x=>x.norm===q);
        if(inglesExacto) return {score:9,tipo:'ingles',detalle:inglesExacto.original};

        const nombreMorf=normalizarFormaSimple(nombre);
        if(q.length>=4 && nombreMorf && nombreMorf===normalizarFormaSimple(q)){
            return {score:11,tipo:'morfologia',detalle:t('Forma singular/plural','Singular/plural form')};
        }

        const gramatica=mapas.gramatica.get(q);
        if(gramatica&&objetivoCoincide(gramatica,p)){
            return {score:12,tipo:'gramatica',detalle:texto(gramatica.explicacion)};
        }
        const alias=mapas.alias.get(q);
        if(alias&&objetivoCoincide(alias,p)){
            const e=etiquetaAlias(alias);
            return {score:14,tipo:e.tipo,detalle:e.texto};
        }
        if(ocultos.some(x=>x.norm===q)){
            return {score:16,tipo:'relacionada',detalle:t('Coincidencia relacionada','Related match')};
        }

        if(nombre.startsWith(q)){
            return {score:20+Math.min(5,(nombre.length-q.length)*0.25),tipo:'prefijo',detalle:''};
        }
        const vPref=vars.find(x=>x.norm.startsWith(q));
        if(vPref) return {score:27+Math.min(5,(vPref.norm.length-q.length)*0.25),tipo:'variante',detalle:vPref.original};
        const iPref=ingles.find(x=>x.norm.startsWith(q));
        if(iPref) return {score:31+Math.min(5,(iPref.norm.length-q.length)*0.25),tipo:'ingles',detalle:iPref.original};
        const oPref=ocultos.find(x=>x.norm.startsWith(q));
        if(oPref) return {score:36+Math.min(5,(oPref.norm.length-q.length)*0.25),tipo:'relacionada',detalle:t('Coincidencia relacionada','Related match')};

        // La corrección aproximada se calcula AUNQUE ya existan resultados
        // por prefijo. Así "carre" puede mostrar Carrera y también Carro.
        const limite=limiteEdicion(q);
        if(limite>0){
            let mejor={d:Infinity,tipo:'',detalle:''};
            const formas=[{norm:nombre,tipo:'palabra',detalle:''}]
                .concat(vars.map(x=>({norm:x.norm,tipo:'variante',detalle:x.original})))
                .concat(ingles.map(x=>({norm:x.norm,tipo:'ingles',detalle:x.original})))
                .concat(ocultos.map(x=>({norm:x.norm,tipo:'oculto',detalle:''})));
            formas.forEach(f=>{
                const d=levenshtein(q,f.norm);
                if(d<mejor.d) mejor={d,tipo:f.tipo,detalle:f.detalle};
            });
            if(mejor.d<=limite){
                const longitud=Math.max(q.length,nombre.length);
                if(longitud&&mejor.d/longitud<=0.38){
                    return {score:48+mejor.d*8,tipo:'correccion',detalle:t('Posible corrección','Possible correction')};
                }
            }
        }

        if(nombre.includes(q)) return {score:78,tipo:'contiene',detalle:''};
        const vCont=vars.find(x=>x.norm.includes(q));
        if(vCont) return {score:84,tipo:'variante',detalle:vCont.original};

        if(q.length>=4){
            const contenido=normal((p&&p.definicion||'')+' '+(p&&p.ejemplo||'')+' '+(p&&p.definicioningles||'')+' '+(p&&p.definicionIngles||''));
            if(contenido.includes(q)) return {score:110,tipo:'significado',detalle:t('Coincide con el significado','Matches the meaning')};

            const tokens=q.split(/\\s+/).filter(x=>x.length>=3);
            if(tokens.length>=2 && tokens.every(token=>contenido.includes(token))){
                return {score:116,tipo:'significado',detalle:t('Coincide con el significado','Matches the meaning')};
            }
        }
        return null;
    }

    function obtenerCandidatos(consulta){
        const q=normal(consulta);
        if(!q) return [];
        const datos=window.App&&Array.isArray(window.App.datos)?window.App.datos:[];
        const mapas=mapaAyudas();
        const vistos=new Set();
        const lista=[];
        datos.forEach(p=>{
            if(!p||!p.palabra) return;
            const c=clasificar(p,q,mapas);
            if(!c) return;
            const k=normal(p.palabra)+'|'+normal(p.categoria);
            if(vistos.has(k)) return;
            vistos.add(k);
            c.score-=bonoPrioridadLocal(p);
            lista.push({p,score:c.score,tipo:c.tipo,detalle:c.detalle});
        });
        lista.sort((a,b)=>
            a.score-b.score ||
            texto(a.p.palabra).length-texto(b.p.palabra).length ||
            texto(a.p.palabra).localeCompare(texto(b.p.palabra),'es')
        );
        return lista.slice(0,MAX_SUGERENCIAS);
    }

    function miniatura(p){
        let id='';
        try{
            if(typeof window.extraerIdYouTube==='function') id=window.extraerIdYouTube(texto(p&&p.video));
        }catch(_e){}
        if(id){
            return '<div class="sugerencia-thumb-wrap"><img src="https://i.ytimg.com/vi/'+escapar(id)+'/mqdefault.jpg" alt="" loading="lazy"><span class="sugerencia-thumb-play">▶</span></div>';
        }
        const img=urlImagenSegura(p&&p.imagen);
        if(img){
            return '<div class="sugerencia-thumb-wrap lsp-pred-imagen"><img src="'+escapar(img)+'" alt="" loading="lazy"></div>';
        }
        return '<div class="sugerencia-thumb-wrap sin-video">🤟</div>';
    }

    function meta(c){
        if(c.tipo==='gramatica') return '<span class="lsp-pred-meta lsp-pred-gramatica">'+escapar(t('Forma gramatical','Grammar form'))+'</span>';
        if(c.tipo==='morfologia') return '<span class="lsp-pred-meta lsp-pred-gramatica">'+escapar(c.detalle)+'</span>';
        if(c.tipo==='ingles') return '<span class="lsp-pred-meta">'+escapar(t('Coincide en inglés: ','English match: ')+c.detalle)+'</span>';
        if(c.tipo==='correccion') return '<span class="lsp-pred-meta lsp-pred-correccion">'+escapar(t('Posible corrección','Possible correction'))+'</span>';
        if(c.tipo==='significado') return '<span class="lsp-pred-meta">'+escapar(t('En el significado','In the meaning'))+'</span>';
        if(c.tipo==='variante'&&c.detalle) return '<span class="lsp-pred-meta">'+escapar(t('Relacionado: ','Related: ')+c.detalle)+'</span>';
        if(c.tipo==='alias'||c.tipo==='relacionada') return '<span class="lsp-pred-meta">'+escapar(c.detalle||t('Coincidencia relacionada','Related match'))+'</span>';
        return '';
    }

    function abrir(c){
        if(!c||!c.p) return;
        registrarEleccion(c.p);
        const cont=document.getElementById('sugerencias');
        if(cont) cont.style.display='none';
        try{
            if(typeof window.mostrarPalabra==='function') window.mostrarPalabra(c.p);
            else if(typeof mostrarPalabra==='function') mostrarPalabra(c.p);
        }catch(_e){}
    }

    // Comprueba una coincidencia EXACTA en Vocabulario sin depender de que
    // script.js haya expuesto sus funciones auxiliares. Esto evita que una
    // palabra que existe solo en Vocabulario termine convertida en una
    // "Posible corrección" del Diccionario.
    function vocabularioTieneCoincidenciaExacta(q){
        try{
            if(typeof window.buscarCoincidenciaEnVocabulario==='function'){
                if(window.buscarCoincidenciaEnVocabulario(q)) return true;
            }

            if(typeof window.obtenerBancoHoja2!=='function') return false;
            const banco=window.obtenerBancoHoja2();
            if(!Array.isArray(banco)||!banco.length) return false;

            const campos=['palabra','word','termino','término','nombre','titulo','título'];
            return banco.some(item=>{
                if(typeof item==='string') return normal(item)===q;
                if(!item||typeof item!=='object') return false;
                return campos.some(c=>normal(item[c])===q);
            });
        }catch(_e){
            return false;
        }
    }

    function diccionarioTieneCoincidenciaFuerte(q){
        const datos=window.App&&Array.isArray(window.App.datos)?window.App.datos:[];
        return datos.some(p=>{
            if(!p) return false;
            if(normal(p.palabra)===q) return true;
            if(variantes(p).some(v=>normal(v)===q)) return true;
            if(formasIngles(p).some(v=>normal(v)===q)) return true;
            return false;
        });
    }

    function renderizar(){
        const input=document.getElementById('buscar');
        const cont=document.getElementById('sugerencias');
        if(!input||!cont) return;
        const crudo=texto(input.value);
        const q=normal(crudo);
        ultimoTexto=q;
        indiceActivo=-1;
        if(!q) return;

        // El buscador principal tiene una prioridad estricta: una coincidencia
        // exacta en Vocabulario debe ganar a cualquier corrección del Diccionario.
        // Este módulo se ejecuta con setTimeout(0), después de script.js, y antes
        // podía reemplazar "Barato" por una sugerencia como "Felicitaciones".
        // Si Vocabulario aún está cargando, tampoco debemos pintar predicciones:
        // dejamos visible el estado de carga de script.js hasta que el banco llegue.
        try {
            // Si la consulta existe exactamente en Vocabulario y NO existe
            // exactamente en Diccionario, dejamos intacto el resultado que
            // muestra script.js para Vocabulario. Nunca lo reemplazamos por
            // una sugerencia como "Felicitaciones".
            const hayCoincidenciaDiccionario = diccionarioTieneCoincidenciaFuerte(q);
            const hayCoincidenciaVocabulario = vocabularioTieneCoincidenciaExacta(q);

            if (!hayCoincidenciaDiccionario && hayCoincidenciaVocabulario) {
                return;
            }
        } catch (_e) {}

        const candidatos=obtenerCandidatos(crudo);
        if(!candidatos.length) return; // conserva el mensaje original de script.js

        cont.innerHTML='';
        cont.style.display='block';
        cont.setAttribute('role','listbox');
        cont.setAttribute('aria-label',t('Sugerencias del Diccionario','Dictionary suggestions'));

        candidatos.forEach((c,i)=>{
            const boton=document.createElement('button');
            boton.type='button';
            boton.className='list-group-item list-group-item-action text-start lsp-pred-item';
            boton.dataset.predIndex=String(i);
            // Referencia estable para la selección táctil dentro del overlay móvil.
            if(typeof obtenerIdPalabra === 'function'){
                boton.dataset.lspRef = obtenerIdPalabra(c.p);
            }
            boton.setAttribute('role','option');
            boton.setAttribute('aria-selected','false');
            boton.innerHTML='<div class="sugerencia-fila">'+miniatura(c.p)+'<div class="sugerencia-texto"><div class="lsp-pred-titulo"><strong>'+escapar(c.p.palabra)+'</strong>'+meta(c)+'</div><span class="badge" style="font-size:10px">'+escapar(texto(c.p.categoria))+'</span></div></div>';
            boton.addEventListener('click',()=>abrir(c));
            cont.appendChild(boton);
        });
        cont._lspPredCandidatos=candidatos;
    }

    function programarRender(){
        // El buscador base corre primero. Repintamos justo después con el
        // ranking predictivo para conservar como respaldo todo lo anterior.
        setTimeout(renderizar,0);
    }

    function moverSeleccion(delta){
        const cont=document.getElementById('sugerencias');
        if(!cont||cont.style.display==='none') return false;
        const botones=Array.from(cont.querySelectorAll('.lsp-pred-item'));
        if(!botones.length) return false;
        indiceActivo=(indiceActivo+delta+botones.length)%botones.length;
        botones.forEach((b,i)=>{
            const activo=i===indiceActivo;
            b.classList.toggle('active',activo);
            b.setAttribute('aria-selected',activo?'true':'false');
        });
        botones[indiceActivo].scrollIntoView({block:'nearest'});
        return true;
    }

    function instalarTeclado(input){
        input.addEventListener('keydown',e=>{
            if(e.key==='ArrowDown'){
                if(moverSeleccion(1)){e.preventDefault();e.stopPropagation();}
                return;
            }
            if(e.key==='ArrowUp'){
                if(moverSeleccion(-1)){e.preventDefault();e.stopPropagation();}
                return;
            }
            if(e.key==='Escape'){
                const cont=document.getElementById('sugerencias');
                if(cont){cont.style.display='none';indiceActivo=-1;e.preventDefault();}
                return;
            }
            if(e.key==='Enter'&&indiceActivo>=0){
                const cont=document.getElementById('sugerencias');
                const candidatos=cont&&Array.isArray(cont._lspPredCandidatos)?cont._lspPredCandidatos:[];
                const c=candidatos[indiceActivo];
                if(c){
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    abrir(c);
                }
            }
        },true);
    }

    function registrarBusquedaConfirmada(){
        const input=document.getElementById('buscar');
        if(!input) return;
        const lista=obtenerCandidatos(input.value);
        // Solo aprende automáticamente cuando el primer candidato es fuerte.
        // Una coincidencia puramente por significado no debe sesgar el ranking.
        if(lista.length&&lista[0].score<75) registrarEleccion(lista[0].p);
    }

    function inyectarCss(){
        if(document.getElementById('lsp-buscador-predictivo-css')) return;
        const s=document.createElement('style');
        s.id='lsp-buscador-predictivo-css';
        s.textContent=[
            '.lsp-pred-item.active{background:#eaf5ff!important;color:inherit!important;outline:2px solid rgba(2,132,199,.2);outline-offset:-2px}',
            '.lsp-pred-titulo{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:3px}',
            '.lsp-pred-meta{font-size:10px;font-weight:800;color:#64748b;background:#f1f5f9;border-radius:999px;padding:3px 7px}',
            '.lsp-pred-gramatica{color:#5145b5;background:#eef2ff}',
            '.lsp-pred-correccion{color:#9a4d08;background:#fff7ed}',
            '.sugerencia-thumb-wrap.lsp-pred-imagen{overflow:hidden;background:#f8fafc}',
            '.sugerencia-thumb-wrap.lsp-pred-imagen img{width:100%;height:100%;object-fit:cover;display:block}'
        ].join('');
        document.head.appendChild(s);
    }

    function iniciar(){
        const input=document.getElementById('buscar');
        const btn=document.getElementById('btnBuscar');
        if(!input||input.dataset.prediccionLspedia==='1') return;
        input.dataset.prediccionLspedia='1';
        inyectarCss();
        input.addEventListener('input',programarRender,false);
        instalarTeclado(input);
        if(btn) btn.addEventListener('click',registrarBusquedaConfirmada,false);
        input.addEventListener('keypress',e=>{if(e.key==='Enter'&&indiceActivo<0) registrarBusquedaConfirmada();},false);
        document.addEventListener('lspedia:datosConsultablesListos',()=>{
            if(normal(input.value)===ultimoTexto&&normal(input.value)) programarRender();
        });
        document.addEventListener('lspedia:idiomaCambiado',programarRender);
    }

    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar,{once:true});
    else iniciar();

    window.LSPediaBuscadorPredictivo={
        obtenerCandidatos,
        registrarEleccion
    };
})();
