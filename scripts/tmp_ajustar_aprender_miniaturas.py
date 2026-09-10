from pathlib import Path
import re

js_path = Path('js/mejoras-producto.js')
css_path = Path('css/mejoras-producto.css')
sw_path = Path('sw.js')

js = js_path.read_text(encoding='utf-8')

js, n = re.subn(
    r"    function finalizarModo\(\)\{.*?\n    \}\n    function renderBarraAprender\(\)\{.*?\n    \}\n\n    function leerResumenProgreso",
    '''    function finalizarModo(volverInicio){
        const modo=leerModo(); modo.activo=false; guardarModo(modo);
        const viejo=$('lspAprenderBar'); if(viejo) viejo.remove();
        const nav=$('navegacionFichaPalabra');
        if(nav){
            nav.classList.remove('lsp-aprender-activo');
            const salir=nav.querySelector('.lsp-aprender-salir');
            if(salir) salir.remove();
        }
        actualizarTarjetaModo();
        gtagEvento('learning_mode_step',{action:'finish'});
        if(volverInicio){
            if(typeof window.irAlBuscador==='function') window.irAlBuscador();
            else location.href=location.pathname;
        }
    }

    // Modo Aprender ya no crea una segunda barra encima de la ficha.
    // Reutiliza la navegación normal Anterior/Siguiente que ya existe abajo
    // y solo añade ahí un botón pequeño para salir del recorrido.
    function renderBarraAprender(){
        const viejo=$('lspAprenderBar'); if(viejo) viejo.remove();
        const nav=$('navegacionFichaPalabra');
        if(!nav) return;

        const salirAnterior=nav.querySelector('.lsp-aprender-salir');
        if(salirAnterior) salirAnterior.remove();
        nav.classList.remove('lsp-aprender-activo');

        const modo=leerModo();
        if(!modo.activo || nav.dataset.fuente==='vocabulario') return;

        const lista=listaAprender();
        const referencia=texto(nav.dataset.referencia);
        const indice=lista.findIndex(p=>refPalabra(p)===referencia);
        if(indice>=0){
            modo.indice=indice;
            modo.referencia=referencia;
            modo.actualizado=Date.now();
            guardarModo(modo);
        }

        const salir=document.createElement('button');
        salir.type='button';
        salir.className='lsp-aprender-salir';
        salir.setAttribute('aria-label','Salir de Modo Aprender');
        salir.innerHTML='<span aria-hidden="true">×</span><small>Salir</small>';
        salir.onclick=()=>finalizarModo(true);
        nav.classList.add('lsp-aprender-activo');
        nav.insertBefore(salir,nav.firstChild);
    }

    function leerResumenProgreso''',
    js,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f'No se pudo reemplazar navegación de Modo Aprender: {n}')

js, n = re.subn(
    r"    function indiceInicial\(lista\)\{.*?\n    \}\n    function abrirAprender",
    '''    function indiceInicial(lista){
        const progreso=leerResumenProgreso();
        if(progreso.ultima && progreso.ultima.referencia){
            const desdeProgreso=lista.findIndex(p=>refPalabra(p)===texto(progreso.ultima.referencia));
            if(desdeProgreso>=0) return desdeProgreso;
        }
        const modo=leerModo();
        if(modo.iniciado && Number.isInteger(modo.indice) && modo.indice>=0 && modo.indice<lista.length) return modo.indice;
        const vistas=referenciasVistas();
        const idx=lista.findIndex(p=>!vistas.has(refPalabra(p)));
        return idx>=0?idx:0;
    }
    function abrirAprender''',
    js,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f'No se pudo actualizar Continuar aprendiendo: {n}')

js, n = re.subn(
    r"    function renderNuevas\(\)\{.*?\n    \}\n    function escapeHtml",
    '''    function extraerIdVideoMiniatura(valor){
        try{
            if(typeof window.extraerIdYouTube==='function'){
                const id=texto(window.extraerIdYouTube(valor));
                if(id) return id;
            }
        }catch(_e){}
        const v=texto(valor);
        if(/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
        try{
            const u=new URL(v,location.href);
            if(/(^|\\.)youtu\\.be$/i.test(u.hostname)) return texto(u.pathname.split('/').filter(Boolean)[0]);
            if(/(^|\\.)youtube\\.com$/i.test(u.hostname) || /(^|\\.)youtube-nocookie\\.com$/i.test(u.hostname)){
                const q=texto(u.searchParams.get('v'));
                if(q) return q;
                const partes=u.pathname.split('/').filter(Boolean);
                const marca=partes.findIndex(x=>['embed','shorts','live'].includes(x));
                if(marca>=0 && partes[marca+1]) return texto(partes[marca+1]);
            }
        }catch(_e){}
        return '';
    }

    function obtenerMiniaturaNueva(p){
        const imagen=texto(p&&p.imagen).split(',')[0].trim();
        if(/^(?:https?:\\/\\/|\\/|\\.\\.?\\/|img\\/)/i.test(imagen)) return imagen;
        const videoId=extraerIdVideoMiniatura(p&&p.video);
        if(videoId) return 'https://i.ytimg.com/vi/'+encodeURIComponent(videoId)+'/mqdefault.jpg';
        return 'img/imagen-no-disponible.svg';
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
        caja.innerHTML=publicadas.slice(0,8).map((x,i)=>{
            const nombre=texto(x.palabra.palabra);
            const miniatura=obtenerMiniaturaNueva(x.palabra);
            return '<button type="button" class="lsp-nueva-palabra" data-nueva="'+i+'">'+
              '<span class="lsp-nueva-thumb-wrap"><img class="lsp-nueva-thumb" src="'+escapeHtml(miniatura)+'" alt="Miniatura de '+escapeHtml(nombre)+'" loading="lazy" decoding="async"></span>'+
              '<span class="lsp-nueva-badge">NUEVA</span><span class="lsp-nueva-nombre">'+escapeHtml(nombre)+'</span><span class="lsp-nueva-cat">'+escapeHtml(texto(x.palabra.categoria)||'Diccionario')+'</span></button>';
        }).join('');
        caja.querySelectorAll('.lsp-nueva-thumb').forEach(img=>img.addEventListener('error',()=>{
            if(img.dataset.fallback) return;
            img.dataset.fallback='1';
            img.src='img/imagen-no-disponible.svg';
        }));
        caja.querySelectorAll('[data-nueva]').forEach(btn=>btn.onclick=()=>{
            const x=publicadas[Number(btn.dataset.nueva)]; if(!x||!x.palabra)return;
            if(typeof window.mostrarPalabra==='function'){window.mostrarPalabra(x.palabra);window.scrollTo({top:0,behavior:'smooth'});}
        });
    }
    function escapeHtml''',
    js,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f'No se pudo añadir miniaturas a Nuevas palabras: {n}')

js_path.write_text(js, encoding='utf-8', newline='\n')

css = css_path.read_text(encoding='utf-8')
marker = '/* Ajuste 2026-09-10: navegación única de Modo Aprender + miniaturas */'
if marker not in css:
    css += '''\n\n/* Ajuste 2026-09-10: navegación única de Modo Aprender + miniaturas */\n.lsp-nueva-palabra{min-width:164px;max-width:184px;padding:7px 7px 10px;overflow:hidden}\n.lsp-nueva-thumb-wrap{display:block;width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#e9eef5;margin-bottom:8px}\n.lsp-nueva-thumb{display:block;width:100%;height:100%;object-fit:cover}\n.lsp-nueva-badge,.lsp-nueva-nombre,.lsp-nueva-cat{margin-left:3px;margin-right:3px}\n.ficha-palabra-browse.lsp-aprender-activo{grid-template-columns:58px minmax(0,1fr) auto minmax(0,1fr)}\n.lsp-aprender-salir{min-width:0;border:0;border-radius:12px;background:#fff1f2;color:#b4233a;font-weight:800;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}\n.lsp-aprender-salir span{font-size:1.2rem;line-height:1}\n.lsp-aprender-salir small{font-size:.66rem;font-weight:800}\n.lsp-aprender-salir:hover,.lsp-aprender-salir:focus-visible{background:#ffe4e6;outline:2px solid rgba(190,24,93,.15);outline-offset:1px}\n@media(max-width:767.98px){.lsp-nueva-palabra{min-width:150px;max-width:168px}.ficha-palabra-browse.lsp-aprender-activo{grid-template-columns:46px minmax(0,1fr) 46px minmax(0,1fr);gap:5px}.lsp-aprender-salir{padding:5px 3px;border-radius:10px}.lsp-aprender-salir small{font-size:.58rem}}\n'''
css_path.write_text(css, encoding='utf-8', newline='\n')

sw = sw_path.read_text(encoding='utf-8')
sw, n = re.subn(r'const VERSION_APP = "v67";', 'const VERSION_APP = "v68";', sw, count=1)
if n != 1:
    raise SystemExit('No se pudo subir Service Worker v67 -> v68')
sw_path.write_text(sw, encoding='utf-8', newline='\n')
