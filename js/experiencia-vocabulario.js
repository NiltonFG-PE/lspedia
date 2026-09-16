/* ============================================================
   LSPedia — experiencia de Vocabulario + accesos flotantes
   2026-09-16
   ------------------------------------------------------------
   - Añade "Tu aprendizaje" a Vocabulario usando el progreso local que
     LSPedia ya registra por palabra y fuente.
   - Calcula avance real contra data/vocabulario.json.
   - Permite continuar desde la última palabra de Vocabulario.
   - Moderniza visualmente el menú flotante de accesos rápidos sin cambiar
     su lógica ni sus destinos.
   ============================================================ */
(function(){
    'use strict';

    if(window.__LSPEDIA_EXPERIENCIA_VOCABULARIO__) return;
    window.__LSPEDIA_EXPERIENCIA_VOCABULARIO__ = true;

    const STYLE_ID = 'lspediaExperienciaVocabularioStyles';
    const CARD_ID = 'panelAprendizajeVocabulario';
    const CLAVE_PROGRESO = 'lspedia_progreso_palabras_v1';
    let totalVocabulario = 0;
    let categoriasTotales = 0;

    function escapar(valor){
        return String(valor == null ? '' : valor).replace(/[&<>"']/g, function(ch){
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
        });
    }

    function inyectarEstilos(){
        if(document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
/* ============================================================
   TU APRENDIZAJE — VOCABULARIO
   ============================================================ */
#${CARD_ID}{
    position:relative;
    overflow:hidden;
    margin:8px 0 22px;
    padding:20px;
    border:1px solid rgba(37,99,235,.14);
    border-radius:24px;
    background:
        radial-gradient(circle at 92% 12%,rgba(96,165,250,.20),transparent 28%),
        linear-gradient(145deg,#ffffff 0%,#f7fbff 58%,#eef6ff 100%);
    box-shadow:0 14px 34px rgba(30,64,175,.09);
    color:#172554;
}
#${CARD_ID}.is-hidden{display:none!important}
#${CARD_ID}::after{
    content:"";
    position:absolute;
    width:170px;
    height:170px;
    right:-84px;
    bottom:-104px;
    border-radius:50%;
    border:28px solid rgba(59,130,246,.055);
    pointer-events:none;
}
.vocab-learning-top{
    position:relative;
    z-index:1;
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:16px;
    margin-bottom:16px;
}
.vocab-learning-title-wrap{display:flex;align-items:center;gap:13px;min-width:0}
.vocab-learning-icon{
    flex:0 0 52px;
    width:52px;
    height:52px;
    display:grid;
    place-items:center;
    border-radius:17px;
    background:linear-gradient(145deg,#2563eb,#3b82f6);
    box-shadow:0 9px 20px rgba(37,99,235,.25);
    color:#fff;
    font-size:24px;
}
.vocab-learning-kicker{
    font-size:10px;
    font-weight:900;
    letter-spacing:.09em;
    color:#2563eb;
    text-transform:uppercase;
    margin-bottom:3px;
}
.vocab-learning-title{
    margin:0;
    color:#172554;
    font-family:'Poppins',-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    font-size:clamp(1.12rem,1rem + .45vw,1.42rem);
    font-weight:800;
    letter-spacing:-.025em;
}
.vocab-learning-subtitle{margin:4px 0 0;color:#64748b;font-size:.88rem;line-height:1.45}
.vocab-learning-badge{
    flex:0 0 auto;
    display:inline-flex;
    align-items:center;
    gap:6px;
    padding:7px 10px;
    border-radius:999px;
    border:1px solid rgba(37,99,235,.14);
    background:rgba(255,255,255,.76);
    color:#475569;
    font-size:10px;
    font-weight:800;
    white-space:nowrap;
    backdrop-filter:blur(8px);
}
.vocab-learning-progress-row{position:relative;z-index:1;display:flex;align-items:center;gap:12px;margin:2px 0 14px}
.vocab-learning-progress{
    position:relative;
    flex:1;
    height:11px;
    overflow:hidden;
    border-radius:999px;
    background:#dfeaf8;
    box-shadow:inset 0 1px 2px rgba(15,23,42,.06);
}
.vocab-learning-progress > span{
    display:block;
    width:0%;
    height:100%;
    border-radius:inherit;
    background:linear-gradient(90deg,#2563eb 0%,#3b82f6 55%,#60a5fa 100%);
    box-shadow:0 0 14px rgba(59,130,246,.36);
    transition:width .5s cubic-bezier(.22,1,.36,1);
}
.vocab-learning-percent{min-width:46px;text-align:right;color:#1d4ed8;font-size:.9rem;font-weight:900}
.vocab-learning-stats{
    position:relative;
    z-index:1;
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:10px;
    margin-bottom:15px;
}
.vocab-learning-stat{
    min-width:0;
    padding:11px 12px;
    border:1px solid rgba(148,163,184,.18);
    border-radius:15px;
    background:rgba(255,255,255,.72);
    box-shadow:0 5px 15px rgba(15,23,42,.035);
}
.vocab-learning-stat strong{display:block;color:#172554;font-size:1.03rem;font-weight:900;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vocab-learning-stat span{display:block;margin-top:3px;color:#64748b;font-size:10px;font-weight:700;line-height:1.2}
.vocab-learning-actions{position:relative;z-index:1;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.vocab-learning-primary,
.vocab-learning-secondary{
    min-height:44px;
    border-radius:14px;
    padding:10px 16px;
    font:inherit;
    font-size:.88rem;
    font-weight:800;
    cursor:pointer;
    transition:transform .18s ease,box-shadow .18s ease,background .18s ease,border-color .18s ease;
}
.vocab-learning-primary{
    border:0;
    color:#fff;
    background:linear-gradient(135deg,#2563eb,#3b82f6);
    box-shadow:0 9px 20px rgba(37,99,235,.23);
}
.vocab-learning-primary:hover,.vocab-learning-primary:focus-visible{transform:translateY(-2px);box-shadow:0 12px 24px rgba(37,99,235,.30)}
.vocab-learning-secondary{
    border:1px solid #d4e2f5;
    color:#2855a8;
    background:rgba(255,255,255,.88);
}
.vocab-learning-secondary:hover,.vocab-learning-secondary:focus-visible{transform:translateY(-1px);background:#fff;border-color:#bcd1ee}
.vocab-learning-note{position:relative;z-index:1;margin:10px 0 0;color:#7b8799;font-size:10px;line-height:1.35}
#panelCategorias.vocab-learning-highlight{animation:vocabLearningHighlight .75s ease 2}
@keyframes vocabLearningHighlight{50%{filter:drop-shadow(0 0 13px rgba(37,99,235,.30));transform:translateY(-2px)}}

/* ============================================================
   DOCK FLOTANTE — ESCRITORIO
   Moderniza la presentación manteniendo los IDs y listeners actuales.
   ============================================================ */
#fabMenuAccesos.fab-menu{
    right:26px;
    bottom:30px;
}
#fabMenuAccesos .fab-menu-lista{
    bottom:84px;
    right:-2px;
    gap:9px;
    padding:12px 10px;
    border:1px solid rgba(255,255,255,.72);
    border-radius:28px;
    background:rgba(248,250,252,.82);
    -webkit-backdrop-filter:blur(16px) saturate(1.15);
    backdrop-filter:blur(16px) saturate(1.15);
    box-shadow:0 18px 42px rgba(15,23,42,.18),inset 0 1px 0 rgba(255,255,255,.85);
    opacity:0;
    transform:translateY(16px) scale(.94);
    transform-origin:bottom right;
    transition:opacity .2s ease,transform .32s cubic-bezier(.22,1,.36,1);
}
#fabMenuAccesos.fab-menu-abierto .fab-menu-lista{opacity:1;transform:translateY(0) scale(1)}
#fabMenuAccesos .fab-item{gap:10px}
#fabMenuAccesos .fab-item-btn{
    width:56px;
    height:56px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.88);
    box-shadow:0 7px 18px rgba(15,23,42,.11),inset 0 1px 0 rgba(255,255,255,.9);
    overflow:hidden;
}
#fabMenuAccesos .fab-item-btn::after{
    content:"";
    position:absolute;
    inset:0;
    border-radius:inherit;
    background:linear-gradient(145deg,rgba(255,255,255,.38),transparent 54%);
    pointer-events:none;
}
#fabMenuAccesos .fab-item-btn:hover,
#fabMenuAccesos .fab-item-btn:focus-visible{
    transform:translateX(-3px) translateY(-2px) scale(1.06);
    box-shadow:0 12px 24px rgba(15,23,42,.18);
}
#fabMenuAccesos .fab-item-icono-img{width:31px;height:31px;position:relative;z-index:1}
#fabMenuAccesos .fab-item-btn-corazon > span{position:relative;z-index:1;font-size:24px}
#fabMenuAccesos .fab-item-btn-vocabulario{background:linear-gradient(145deg,#f4f7fb,#dce7f4)}
#fabMenuAccesos .fab-item-btn-herramientas{background:linear-gradient(145deg,#edf7ff,#d6eaff)}
#fabMenuAccesos .fab-item-btn-jugar{background:linear-gradient(145deg,#f4efff,#e4dcff)}
#fabMenuAccesos .fab-item-btn-corazon{background:linear-gradient(145deg,#fff2f4,#ffdce2)}
#fabMenuAccesos .fab-item-etiqueta{
    padding:8px 11px;
    border:1px solid rgba(226,232,240,.95);
    border-radius:11px;
    background:rgba(15,23,42,.92);
    color:#fff;
    box-shadow:0 8px 18px rgba(15,23,42,.15);
    font-size:11px;
    font-weight:800;
    letter-spacing:.01em;
    -webkit-backdrop-filter:blur(8px);
    backdrop-filter:blur(8px);
}
#fabMenuAccesos .fab-menu-toggle{
    width:68px;
    height:68px;
    border:1px solid rgba(255,255,255,.70);
    background:linear-gradient(145deg,#ffd329 0%,#ffb800 100%);
    color:#13203b;
    box-shadow:0 12px 26px rgba(245,184,24,.30),0 5px 18px rgba(15,23,42,.16),inset 0 1px 0 rgba(255,255,255,.72);
}
#fabMenuAccesos .fab-menu-toggle::before{
    content:"";
    position:absolute;
    inset:-6px;
    border:1px solid rgba(245,184,24,.24);
    border-radius:50%;
    pointer-events:none;
    transition:transform .3s ease,opacity .3s ease;
}
#fabMenuAccesos .fab-menu-toggle:hover,
#fabMenuAccesos .fab-menu-toggle:focus-visible{transform:translateY(-2px) scale(1.05)}
#fabMenuAccesos.fab-menu-abierto .fab-menu-toggle{
    background:linear-gradient(145deg,#334155,#1e293b);
    color:#fff;
    box-shadow:0 12px 28px rgba(15,23,42,.26),inset 0 1px 0 rgba(255,255,255,.12);
}
#fabMenuAccesos.fab-menu-abierto .fab-menu-toggle::before{transform:scale(.84);opacity:0}
#fabMenuAccesos .fab-menu-toggle-icono{font-size:24px;line-height:1}

@media (max-width:767.98px){
    #${CARD_ID}{margin:10px 0 18px;padding:16px;border-radius:20px}
    .vocab-learning-top{gap:10px;margin-bottom:13px}
    .vocab-learning-title-wrap{align-items:flex-start}
    .vocab-learning-icon{flex-basis:44px;width:44px;height:44px;border-radius:14px;font-size:21px}
    .vocab-learning-badge{display:none}
    .vocab-learning-subtitle{font-size:.8rem}
    .vocab-learning-stats{gap:7px}
    .vocab-learning-stat{padding:9px 8px;border-radius:13px;text-align:center}
    .vocab-learning-stat strong{font-size:.93rem}
    .vocab-learning-stat span{font-size:9px}
    .vocab-learning-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .vocab-learning-primary,.vocab-learning-secondary{width:100%;padding:9px 10px;font-size:.78rem;border-radius:13px}
}
@media (max-width:430px){
    .vocab-learning-actions{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){
    #${CARD_ID} *,#fabMenuAccesos *{animation:none!important;transition:none!important}
}
`;
        document.head.appendChild(style);
    }

    function leerProgreso(){
        try {
            if(typeof window.leerProgresoPalabras === 'function'){
                return window.leerProgresoPalabras();
            }
            const guardado = JSON.parse(localStorage.getItem(CLAVE_PROGRESO) || 'null');
            return guardado && Array.isArray(guardado.items) ? guardado : {version:1,items:[]};
        } catch(_error){
            return {version:1,items:[]};
        }
    }

    function itemsVocabulario(){
        const progreso = leerProgreso();
        const items = Array.isArray(progreso && progreso.items) ? progreso.items : [];
        const vistos = new Map();
        items.forEach(function(item){
            if(!item || String(item.fuente || '').toLowerCase() !== 'vocabulario') return;
            const clave = String(item.referencia || item.palabra || '').trim().toLowerCase();
            if(!clave) return;
            const previo = vistos.get(clave);
            if(!previo || Number(item.ultimaVez || 0) > Number(previo.ultimaVez || 0)) vistos.set(clave,item);
        });
        return Array.from(vistos.values()).sort(function(a,b){
            return Number(b.ultimaVez || 0) - Number(a.ultimaVez || 0);
        });
    }

    function esVistaVocabulario(){
        const intro = document.getElementById('vocabularioIntroLista');
        if(intro && !intro.classList.contains('d-none')){
            try { if(getComputedStyle(intro).display !== 'none') return true; } catch(_error) { return true; }
        }
        return !!(document.body && document.body.classList.contains('vista-temas-movil'));
    }

    function crearTarjeta(){
        let card = document.getElementById(CARD_ID);
        if(card) return card;
        const panelCategorias = document.getElementById('panelCategorias');
        if(!panelCategorias || !panelCategorias.parentNode) return null;

        card = document.createElement('section');
        card.id = CARD_ID;
        card.className = 'is-hidden';
        card.setAttribute('aria-label','Tu aprendizaje en Vocabulario');
        card.innerHTML = `
            <div class="vocab-learning-top">
                <div class="vocab-learning-title-wrap">
                    <div class="vocab-learning-icon" aria-hidden="true">📘</div>
                    <div>
                        <div class="vocab-learning-kicker">Tu aprendizaje</div>
                        <h3 class="vocab-learning-title">Avanza a tu ritmo</h3>
                        <p class="vocab-learning-subtitle" id="vocabLearningResumen">Aún no has empezado. Explora una categoría para comenzar.</p>
                    </div>
                </div>
                <div class="vocab-learning-badge">🔒 Solo en este dispositivo</div>
            </div>
            <div class="vocab-learning-progress-row">
                <div class="vocab-learning-progress" role="progressbar" aria-label="Progreso en Vocabulario" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="vocabLearningBar"></span></div>
                <div class="vocab-learning-percent" id="vocabLearningPercent">0%</div>
            </div>
            <div class="vocab-learning-stats">
                <div class="vocab-learning-stat"><strong id="vocabLearningSeen">0</strong><span>Palabras vistas</span></div>
                <div class="vocab-learning-stat"><strong id="vocabLearningCategories">0</strong><span>Categorías exploradas</span></div>
                <div class="vocab-learning-stat"><strong id="vocabLearningLast">—</strong><span>Última palabra</span></div>
            </div>
            <div class="vocab-learning-actions">
                <button type="button" class="vocab-learning-primary" id="btnVocabLearningPrimary">✨ Empezar a aprender</button>
                <button type="button" class="vocab-learning-secondary" id="btnVocabLearningCategories">Ver categorías</button>
            </div>
            <p class="vocab-learning-note">Tu avance se guarda automáticamente en este navegador y no requiere una cuenta.</p>`;

        panelCategorias.parentNode.insertBefore(card,panelCategorias);

        const primario = card.querySelector('#btnVocabLearningPrimary');
        const categorias = card.querySelector('#btnVocabLearningCategories');
        if(primario) primario.addEventListener('click', accionPrincipal);
        if(categorias) categorias.addEventListener('click', irACategorias);
        return card;
    }

    function irACategorias(){
        const panel = document.getElementById('panelCategorias');
        if(!panel) return;
        try { panel.scrollIntoView({behavior:'smooth',block:'start'}); }
        catch(_error){ panel.scrollIntoView(); }
        panel.classList.remove('vocab-learning-highlight');
        void panel.offsetWidth;
        panel.classList.add('vocab-learning-highlight');
        setTimeout(function(){ panel.classList.remove('vocab-learning-highlight'); },1700);
    }

    function abrirUltima(ultima){
        if(!ultima) return irACategorias();
        const referencia = String(ultima.referencia || ultima.palabra || '').trim();
        if(!referencia) return irACategorias();

        if(typeof window.mostrarPalabraVocabularioPorReferencia === 'function'){
            try {
                window.mostrarPalabraVocabularioPorReferencia(referencia);
                return;
            } catch(_error){}
        }

        const url = new URL(window.location.href);
        url.searchParams.set('vista','vocabulario');
        url.searchParams.set('p',referencia);
        url.searchParams.set('fuente','vocabulario');
        window.location.href = url.pathname + '?' + url.searchParams.toString();
    }

    function accionPrincipal(){
        const items = itemsVocabulario();
        if(items.length) abrirUltima(items[0]);
        else irACategorias();
    }

    function actualizar(){
        const card = crearTarjeta();
        if(!card) return;
        card.classList.toggle('is-hidden',!esVistaVocabulario());
        if(card.classList.contains('is-hidden')) return;

        const items = itemsVocabulario();
        const vistos = items.length;
        const categoriasVistas = new Set(items.map(function(x){ return String(x.categoria || '').trim().toLowerCase(); }).filter(Boolean)).size;
        const ultima = items[0] || null;
        const total = Math.max(0,Number(totalVocabulario) || 0);
        const porcentaje = total > 0 ? Math.min(100,Math.round((vistos / total) * 100)) : 0;

        const resumen = card.querySelector('#vocabLearningResumen');
        const seen = card.querySelector('#vocabLearningSeen');
        const cats = card.querySelector('#vocabLearningCategories');
        const last = card.querySelector('#vocabLearningLast');
        const percent = card.querySelector('#vocabLearningPercent');
        const bar = card.querySelector('#vocabLearningBar');
        const progress = card.querySelector('.vocab-learning-progress');
        const primary = card.querySelector('#btnVocabLearningPrimary');

        if(resumen){
            if(!vistos) resumen.textContent = total ? `Tienes ${total} palabras disponibles para explorar.` : 'Explora una categoría para comenzar.';
            else if(total) resumen.textContent = `Has explorado ${vistos} de ${total} palabras disponibles.`;
            else resumen.textContent = `Has explorado ${vistos} ${vistos === 1 ? 'palabra' : 'palabras'} en Vocabulario.`;
        }
        if(seen) seen.textContent = vistos.toLocaleString('es-PE');
        if(cats) cats.textContent = categoriasVistas.toLocaleString('es-PE');
        if(last) last.textContent = ultima && ultima.palabra ? ultima.palabra : '—';
        if(percent) percent.textContent = porcentaje + '%';
        if(bar) bar.style.width = porcentaje + '%';
        if(progress) progress.setAttribute('aria-valuenow',String(porcentaje));
        if(primary){
            if(ultima && ultima.palabra){
                primary.innerHTML = '▶ Continuar <span class="d-none d-sm-inline">desde ' + escapar(ultima.palabra) + '</span>';
                primary.setAttribute('aria-label','Continuar desde ' + ultima.palabra);
            } else {
                primary.textContent = '✨ Empezar a aprender';
                primary.setAttribute('aria-label','Empezar a aprender Vocabulario');
            }
        }
    }

    async function cargarTotales(){
        try {
            const respuesta = await fetch('data/vocabulario.json?learning=' + Date.now(),{cache:'no-store'});
            if(!respuesta.ok) return;
            const datos = await respuesta.json();
            if(!Array.isArray(datos)) return;
            totalVocabulario = datos.length;
            categoriasTotales = new Set(datos.map(function(x){ return String((x && x.categoria) || '').trim().toLowerCase(); }).filter(Boolean)).size;
            actualizar();
        } catch(_error){}
    }

    function envolverRegistroProgreso(){
        const original = window.registrarProgresoPalabra;
        if(typeof original !== 'function' || original.__lspediaVocabLearningWrapped) return;
        const envuelta = function(){
            const resultado = original.apply(this,arguments);
            setTimeout(actualizar,0);
            return resultado;
        };
        envuelta.__lspediaVocabLearningWrapped = true;
        window.registrarProgresoPalabra = envuelta;
    }

    function observarVista(){
        const intro = document.getElementById('vocabularioIntroLista');
        const config = {attributes:true,attributeFilter:['class','style']};
        if(intro && 'MutationObserver' in window) new MutationObserver(actualizar).observe(intro,config);
        if(document.body && 'MutationObserver' in window) new MutationObserver(actualizar).observe(document.body,{attributes:true,attributeFilter:['class']});
    }

    function iniciar(){
        inyectarEstilos();
        crearTarjeta();
        envolverRegistroProgreso();
        observarVista();
        actualizar();
        cargarTotales();

        document.addEventListener('lspedia:datosListos',actualizar);
        document.addEventListener('lspedia:palabrasActualizadas',actualizar);
        window.addEventListener('storage',function(e){ if(e && e.key === CLAVE_PROGRESO) actualizar(); });
        [250,700,1400,2600].forEach(function(ms){ setTimeout(function(){ envolverRegistroProgreso(); actualizar(); },ms); });
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',iniciar,{once:true});
    else iniciar();
})();
