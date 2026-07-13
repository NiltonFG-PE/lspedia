const buscar = document.getElementById("buscar");
const btnBuscar = document.getElementById("btnBuscar");
const sugerencias = document.getElementById("sugerencias");
const resultado = document.getElementById("resultado");

const totalPalabras = document.getElementById("totalPalabras");
const totalCategorias = document.getElementById("totalCategorias");
const totalVideos = document.getElementById("totalVideos");

const panelCategorias = document.getElementById("panelCategorias");
const ultimasPalabras = document.getElementById("ultimasPalabras");
const seccionHistorial = document.getElementById("seccionHistorial");
const listaHistorial = document.getElementById("listaHistorial");
const listaFavoritos = document.getElementById("listaFavoritos");

const CLAVE_FAVORITOS = "lspedia_favoritos";
const CLAVE_HISTORIAL = "lspedia_historial";

// --- EVENTOS DEL MENÚ SUPERIOR ---
const btnLogo = document.getElementById("btnLogo");
if(btnLogo) {
    btnLogo.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = window.location.pathname; 
    });
}

const btnInicio = document.getElementById("btnInicio");
if(btnInicio) {
    btnInicio.addEventListener("click", (e) => {
        e.preventDefault();
        const icono = document.getElementById("iconoInicio");
        if(icono) icono.classList.add("spin-anim");
        setTimeout(() => window.location.href = window.location.pathname, 500); 
    });
}

document.getElementById("btnCategorias").addEventListener("click", (e) => {
    e.preventDefault();
    ocultarQuiz();
    mostrarCategorias();
    panelCategorias.scrollIntoView({ behavior: 'smooth', block: 'center' });
    panelCategorias.classList.add("highlight-anim");
    setTimeout(() => panelCategorias.classList.remove("highlight-anim"), 2000);
});

document.getElementById("btnNavFavoritos").addEventListener("click", (e) => {
    e.preventDefault();
    ocultarQuiz();
    const seccionFav = document.getElementById("seccionFavoritos");
    seccionFav.scrollIntoView({ behavior: 'smooth', block: 'center' });
    seccionFav.classList.add("highlight-anim");
    setTimeout(() => seccionFav.classList.remove("highlight-anim"), 2000);
});

document.getElementById("btnHistorial").addEventListener("click", (e) => {
    e.preventDefault();
    ocultarQuiz();
    mostrarPantallaHistorial();
    seccionHistorial.scrollIntoView({ behavior: 'smooth', block: 'center' });
    seccionHistorial.classList.add("highlight-anim");
    setTimeout(() => seccionHistorial.classList.remove("highlight-anim"), 2000);
});

const seccionQuiz = document.getElementById("seccionQuiz");
const btnQuiz = document.getElementById("btnQuiz");
if(btnQuiz){
    btnQuiz.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarSeccionQuiz();
    });
}

function ocultarQuiz(){
    if(seccionQuiz) seccionQuiz.classList.add("d-none");
}

function mostrarSeccionQuiz(){
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    ultimasPalabras.innerHTML = "";
    seccionHistorial.classList.add("d-none");
    seccionQuiz.classList.remove("d-none");
    document.getElementById("quizIntro").classList.remove("d-none");
    document.getElementById("quizActivo").classList.add("d-none");
    document.getElementById("quizResultados").classList.add("d-none");
    const jugables = App.datos.filter(p => p.video && p.video.trim() !== "");
    const aviso = document.getElementById("quizAvisoPocasPalabras");
    if(aviso) aviso.textContent = `✅ Preguntas generadas a partir de ${jugables.length} palabras con video disponible.`;
    seccionQuiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- CARGA DE DATOS CENTRALIZADA ---
const App = {
    datos: [],
    iniciar: function() {
        fetch("data/palabras.json")
        .then(res => res.json())
        .then(data => {
            this.datos = data.filter(p => p.palabra && p.categoria);
            actualizarEstadisticas();
            mostrarFavoritos();
            mostrarSenalDelDia();
            
            const urlParams = new URLSearchParams(window.location.search);
            const palabraEnUrl = urlParams.get("p");
            if (palabraEnUrl) {
                mostrarPalabraPorNombre(palabraEnUrl);
            }
        })
        .catch(error => console.error("Error al cargar LSPedia:", error));
    }
};

document.addEventListener("DOMContentLoaded", () => {
    App.iniciar();
});

const indiceAlfabetico = document.getElementById("indiceAlfabetico");
if(indiceAlfabetico){
    indiceAlfabetico.addEventListener("show.bs.collapse", () => {
        const flecha = document.getElementById("flechaAbc");
        if(flecha) flecha.style.transform = "rotate(180deg)";
    });
    indiceAlfabetico.addEventListener("hide.bs.collapse", () => {
        const flecha = document.getElementById("flechaAbc");
        if(flecha) flecha.style.transform = "rotate(0deg)";
    });
}

// --- BUSCADOR INTELIGENTE ---
buscar.addEventListener("input", buscarPalabras);

function buscarPalabras(){
    const texto = buscar.value.trim().toLowerCase();
    ocultarQuiz();
    sugerencias.innerHTML = "";
    //resultado.innerHTML = "";
    //ultimasPalabras.innerHTML = ""; 
    //panelCategorias.innerHTML = "";
    seccionHistorial.classList.add("d-none"); 

    if(texto === "") {
        sugerencias.style.display = "none";
        return;
    }document.getElementById("senalDelDia").style.display = "none";

    const encontrados = App.datos
    .filter(p => {
        const matchPrincipal = p.palabra.toLowerCase().includes(texto);
        const matchVariantes = p.variantes ? p.variantes.toLowerCase().includes(texto) : false;
        return matchPrincipal || matchVariantes;
    })
    .slice(0,10);

    sugerencias.style.display = "block";

    if(encontrados.length===0){
        sugerencias.innerHTML = `
            <div class="list-group-item text-center py-3" style="background-color: #343a40; border: none;">
                <span class="text-white d-block mb-2 small">No hay resultados para "${texto}"</span>
                <button class="btn btn-sm btn-warning w-100 fw-bold text-dark" data-bs-toggle="modal" data-bs-target="#modalSugerencia" onclick="document.getElementById('sugerencias').style.display='none'">
                    Sugerir esta palabra
                </button>
            </div>`;
        return;
    }

    encontrados.forEach(p=>{
        const boton=document.createElement("button");
        boton.className="list-group-item list-group-item-action text-start";
        let textoMatch = `<strong>${p.palabra}</strong>`;
        if(p.variantes && p.variantes.toLowerCase().includes(texto) && !p.palabra.toLowerCase().includes(texto)){
            textoMatch += ` <small class="text-primary ms-2 fw-bold" style="font-size: 11px;">(Variante: ${texto})</small>`;
        }
        boton.innerHTML=`${textoMatch} <span class="badge float-end" style="font-size: 10px;">${p.categoria.trim()}</span>`;
        boton.onclick=()=>mostrarPalabra(p);
        sugerencias.appendChild(boton);
    });
}

// --- BUSQUEDA DIRECTA ---
if(btnBuscar) btnBuscar.addEventListener("click", ejecutarBusquedaDirecta);
buscar.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); ejecutarBusquedaDirecta(); } });

function ejecutarBusquedaDirecta() {
    const texto = buscar.value.trim().toLowerCase();
    if(texto === "") return;
    sugerencias.innerHTML = "";
    sugerencias.style.display = "none";
    
    const encontrados = App.datos.filter(p => {
        const matchPrincipal = p.palabra.toLowerCase() === texto;
        const matchVariantes = p.variantes ? p.variantes.toLowerCase().split(',').map(v=>v.trim()).includes(texto) : false;
        return matchPrincipal || matchVariantes;
    });
    
    if(encontrados.length > 0) {
        mostrarPalabra(encontrados[0]);
    } else {
        const parciales = App.datos.filter(p => p.palabra.toLowerCase().includes(texto) || (p.variantes && p.variantes.toLowerCase().includes(texto)));
        if(parciales.length > 0) {
            mostrarPalabra(parciales[0]);
        } else {
            buscar.blur();
            panelCategorias.innerHTML = "";
            ultimasPalabras.innerHTML = "";
            seccionHistorial.classList.add("d-none");
            resultado.innerHTML = `
            <div class="card shadow-sm mb-4 border-0 animate-fade-in" style="border-radius: 15px; background-color: #f8f9fa;">
                <div class="card-body p-5 text-center">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔍🤷‍♂️</div>
                    <h4 class="fw-bold mb-3 text-primary">No encontramos "${buscar.value}"</h4>
                    <button class="btn btn-warning px-4 py-2 rounded-pill fw-bold text-dark" data-bs-toggle="modal" data-bs-target="#modalSugerencia">Sugerir esta palabra</button>
                </div>
            </div>`;
            setTimeout(() => resultado.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        }
    }
}

// --- MOSTRAR PALABRA ---
function mostrarPalabra(p){
    ocultarQuiz();
    buscar.value = p.palabra;
    buscar.blur();
    sugerencias.innerHTML="";
    sugerencias.style.display = "none";
    panelCategorias.innerHTML = ""; 
    seccionHistorial.classList.add("d-none");
    const nuevaUrl = window.location.pathname + "?p=" + encodeURIComponent(p.palabra);
    window.history.pushState({path: nuevaUrl}, '', nuevaUrl);
    agregarAHistorial(p.palabra); 
    const enFavoritos = esFavorito(p.palabra);
    const textoBoton = enFavoritos ? "★ En favoritos" : "⭐ Agregar a favoritos";
    const bloqueImagen = p.imagen && p.imagen.trim() !== ""
        ? `<div class="apoyo-visual-caja h-100 w-100" role="button" tabindex="0"
                onclick="abrirImagenAmpliada('${p.imagen}', '${p.palabra.replace(/'/g, "\\'")}')"
                onkeypress="if(event.key==='Enter') abrirImagenAmpliada('${p.imagen}', '${p.palabra.replace(/'/g, "\\'")}')">
                <img src="${p.imagen}" class="apoyo-visual-img" alt="Imagen de apoyo visual para ${p.palabra}">
                <span class="apoyo-visual-lupa">🔍 Ampliar</span>
           </div>`
        : `<div class="d-flex flex-column align-items-center justify-content-center bg-light text-muted text-center p-3 rounded border w-100 h-100" style="min-height:200px;">
                <span class="fs-1 mb-2">🖼️</span>
                <span class="small fw-bold">Imagen próximamente</span>
           </div>`;
    const hayVideo = p.video && p.video.trim() !== "";
    const bloqueVideo = hayVideo
        ? `<div id="reproductorPalabra"></div>`
        : `<div class="d-flex flex-column align-items-center justify-content-center h-100 bg-light text-muted text-center p-3">
                <span class="fs-1 mb-2">🤟</span>
                <span class="small fw-bold">Video próximamente</span>
                <span class="small">Todavía no hemos grabado la seña de esta palabra.</span>
           </div>`;
    const bloqueControlesVideo = hayVideo
            ? `<div class="controles-video d-flex align-items-center justify-content-center gap-2 mt-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnRetroceder10" title="Retroceder 5 segundos" aria-label="Retroceder 5 segundos">⏪ 5s</button>
                <button type="button" class="btn btn-sm btn-primary" id="btnPlayPause" title="Reproducir o pausar" aria-label="Reproducir o pausar">▶️ Reproducir</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnAvanzar10" title="Avanzar 10 segundos" aria-label="Avanzar 10 segundos">10s ⏩</button>
                <select class="form-select form-select-sm" id="selectVelocidad" title="Velocidad de reproducción" aria-label="Velocidad de reproducción">
                    <option value="0.6">0.6x</option>
                    <option value="0.8">0.8x</option>
                    <option value="0.9">0.9x</option>
                    <option value="1" selected>1x</option>
                    <option value="1.2">1.2x</option>
                    <option value="1.6">1.6x</option>
                    <option value="2">2x</option>
                </select>
           </div>`
        : "";
    let bloqueVariantes = p.variantes && p.variantes.trim() !== "" ? `<div class="mb-3 p-2 bg-light rounded border"><span class="d-block fw-bold text-secondary mb-1" style="font-size: 10px; letter-spacing: 0.5px;">🔄 CONJUGACIONES O VARIANTES:</span><span class="text-muted small fst-italic">${p.variantes}</span></div>` : "";
    resultado.innerHTML=`
    <div class="card shadow-sm mb-4 animate-fade-in" style="border-radius: 15px; border-color: #dceefc;">
        <div class="card-body p-4">
            <span class="badge bg-primary mb-2" style="font-size: 11px;">${p.categoria.trim()}</span>
            <h3 class="fw-bold mb-1" style="color: #0d6efd;">${p.palabra}</h3>
            <p class="text-muted small mb-3">${p.definicion}</p>
            ${bloqueVariantes}
            <button id="btnFavorito" class="btn btn-sm btn-outline-primary mb-4 py-1 px-3" style="border-radius: 15px; font-size: 12px; font-weight: bold;">${textoBoton}</button>
            <div class="row g-4 justify-content-center align-items-stretch">
                <div class="col-md-8 d-flex flex-column">
                    <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider text-md-start">🤟 Video en LSP:</span>
                    <div class="ratio ratio-16x9 shadow-sm rounded overflow-hidden border">
                        ${bloqueVideo}
                    </div>
                    ${bloqueControlesVideo}
                </div>
                <div class="col-md-4 d-flex flex-column">
                    <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">📸 Apoyo Visual:</span>
                    <div class="shadow-sm rounded overflow-hidden border bg-light flex-grow-1">
                        ${bloqueImagen}
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    document.getElementById("btnFavorito").addEventListener("click", () => {
        const ahoraEnFavoritos = alternarFavorito(p.palabra);
        document.getElementById("btnFavorito").textContent = ahoraEnFavoritos ? "★ En favoritos" : "⭐ Agregar a favoritos";
        mostrarFavoritos();
    });
    mostrarSugerenciasRelacionadas(p);
    if (hayVideo) {
        inicializarReproductorPalabra(p.video);
    } else {
        ytPlayerPalabra = null;
    }
    setTimeout(() => resultado.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}

// --- REPRODUCTOR DE VIDEO CONTROLABLE (YouTube IFrame API) ---
let ytPlayerPalabra = null;
let ytApiListo = false;
let ytVideoIdPendiente = null;

// Esta función la llama automáticamente el script de YouTube (iframe_api) cuando está lista.
function onYouTubeIframeAPIReady() {
    ytApiListo = true;
    if (ytVideoIdPendiente) {
        crearReproductorPalabra(ytVideoIdPendiente);
        ytVideoIdPendiente = null;
    }
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function inicializarReproductorPalabra(videoId) {
    if (ytApiListo) {
        crearReproductorPalabra(videoId);
    } else {
        // La API todavía no cargó: guardamos el video y se crea en cuanto esté lista.
        ytVideoIdPendiente = videoId;
    }
}

function crearReproductorPalabra(videoId) {
    const contenedor = document.getElementById("reproductorPalabra");
    if (!contenedor) return;
    if (ytPlayerPalabra && typeof ytPlayerPalabra.destroy === "function") {
        ytPlayerPalabra.destroy();
    }
    ytPlayerPalabra = new YT.Player("reproductorPalabra", {
        videoId: videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
            onReady: configurarControlesVideo,
            onStateChange: actualizarBotonPlayPause
        }
    });
}

function configurarControlesVideo() {
    const btnRetroceder = document.getElementById("btnRetroceder10");
    const btnAvanzar = document.getElementById("btnAvanzar10");
    const btnPlayPause = document.getElementById("btnPlayPause");
    const selectVelocidad = document.getElementById("selectVelocidad");
    if (!btnRetroceder || !btnAvanzar || !btnPlayPause || !selectVelocidad || !ytPlayerPalabra) return;

    btnRetroceder.addEventListener("click", () => {
        const tiempoActual = ytPlayerPalabra.getCurrentTime();
        ytPlayerPalabra.seekTo(Math.max(0, tiempoActual - 5), true);
    });

    btnAvanzar.addEventListener("click", () => {
        const tiempoActual = ytPlayerPalabra.getCurrentTime();
        const duracion = ytPlayerPalabra.getDuration();
        ytPlayerPalabra.seekTo(Math.min(duracion, tiempoActual + 10), true);
    });

    btnPlayPause.addEventListener("click", () => {
        const estado = ytPlayerPalabra.getPlayerState();
        if (estado === YT.PlayerState.PLAYING) {
            ytPlayerPalabra.pauseVideo();
        } else {
            ytPlayerPalabra.playVideo();
        }
    });

    selectVelocidad.addEventListener("change", () => {
        ytPlayerPalabra.setPlaybackRate(parseFloat(selectVelocidad.value));
    });
}

function actualizarBotonPlayPause(evento) {
    const btnPlayPause = document.getElementById("btnPlayPause");
    if (!btnPlayPause) return;
    btnPlayPause.textContent = evento.data === YT.PlayerState.PLAYING ? "⏸ Pausar" : "▶️ Reproducir";
}

// --- AMPLIAR IMAGEN DE APOYO VISUAL ---
function abrirImagenAmpliada(url, palabra){
    const imgAmpliada = document.getElementById("imgAmpliadaContenido");
    const tituloAmpliada = document.getElementById("tituloImagenAmpliada");
    if(!imgAmpliada) return;
    imgAmpliada.src = url;
    imgAmpliada.alt = `Imagen de apoyo visual para ${palabra}`;
    if(tituloAmpliada) tituloAmpliada.textContent = palabra;
    const modalEl = document.getElementById("modalImagenAmpliada");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

// --- ESTADÍSTICAS ---
function actualizarEstadisticas(){
    totalPalabras.textContent = App.datos.length;
    totalVideos.textContent = App.datos.length; 
    totalCategorias.textContent = [...new Set(App.datos.map(p => p.categoria.trim()))].length;
}

// --- FILTRO ABC ---
function filtrarPorLetra(letra) {
    ocultarQuiz();
    buscar.value = ""; 
    sugerencias.innerHTML = "";
    sugerencias.style.display = "none";
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    ultimasPalabras.innerHTML = ""; 
    seccionHistorial.classList.add("d-none");
    window.history.pushState({}, '', window.location.pathname);
    const filtradas = App.datos.filter(p => p.palabra.toUpperCase().startsWith(letra.toUpperCase()));
    if (filtradas.length === 0) {
        resultado.innerHTML = `<div class="alert alert-light border text-center text-muted small py-3" style="border-radius: 12px;">No hay resultados con <strong>${letra}</strong>.</div>`;
        return;
    }
    resultado.innerHTML = `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Resultados con: ${letra}</h6>`;
    filtradas.forEach(p => {
        resultado.innerHTML += `
        <div class="card mb-2 palabra-card shadow-sm animate-fade-in" style="border-radius: 10px;">
            <div class="card-body p-2 d-flex justify-content-between align-items-center">
                <div><h6 class="mb-0 fw-bold text-primary">${p.palabra}</h6><small class="text-muted">${p.categoria.trim()}</small></div>
                <button class="btn btn-sm btn-primary py-1 px-3 fw-bold" onclick="mostrarPalabraPorNombre('${p.palabra}')">Ver Seña</button>
            </div>
        </div>`;
    });
}

// --- CATEGORÍAS ---
function mostrarCategorias(){
    resultado.innerHTML=""; panelCategorias.innerHTML=""; ultimasPalabras.innerHTML = ""; seccionHistorial.classList.add("d-none");
    const categories = [...new Set(App.datos.map(p => p.categoria.trim()))].sort();
    categories.forEach(nombre=>{
        const cantidad = App.datos.filter(p => p.categoria.trim() === nombre).length;
        const card = document.createElement("div");
        card.className = "col-6 col-md-3 animate-fade-in";
        card.innerHTML = `<div class="card h-100 shadow-sm categoria-card" style="border-radius: 12px; border: 1px solid #dceefc;"><div class="card-body text-center py-3"><h6 class="mb-1 fw-bold text-primary">${nombre}</h6><p class="mb-0 small text-muted">${cantidad} palabras</p></div></div>`;
        card.onclick = () => mostrarCategoria(nombre);
        panelCategorias.appendChild(card);
    });
}

function mostrarCategoria(nombre){
    resultado.innerHTML=`<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Categoría: ${nombre}</h6>`;
    App.datos.filter(p => p.categoria.trim() === nombre).forEach(p=>{
        resultado.innerHTML+=`<div class="card mb-2 palabra-card shadow-sm animate-fade-in" style="border-radius: 10px;"><div class="card-body p-2 d-flex justify-content-between align-items-center"><div><h6 class="mb-0 fw-bold text-primary">${p.palabra}</h6></div><button class="btn btn-sm btn-primary py-1 px-3 fw-bold" onclick="mostrarPalabraPorNombre('${p.palabra}')">Ver Seña</button></div></div>`;
    });
}

function mostrarPalabraPorNombre(nombre){
    const palabra = App.datos.find(p => p.palabra.toLowerCase() === nombre.toLowerCase());
    if(palabra){ window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabra(palabra); }
}

function mostrarSugerenciasRelacionadas(palabraActual){
    if(!ultimasPalabras) return;
    ultimasPalabras.innerHTML = "";
    const relacionadas = App.datos.filter(p => p.categoria.trim() === palabraActual.categoria.trim() && p.palabra !== palabraActual.palabra);
    if (relacionadas.length === 0) return;
    ultimasPalabras.innerHTML = `<div class="col-12 mt-4 mb-2"><h5 class="fw-bold">Puede que también te interese</h5></div>`;
    relacionadas.slice(-4).reverse().forEach(p => {
        const col = document.createElement("div"); col.className = "col-12 col-md-6 mb-2";
        col.innerHTML = `<div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; background-color: #f8f9fa;"><div class="row g-0 align-items-center"><div class="col-3 p-2"><img src="${p.imagen || 'https://via.placeholder.com/150'}" class="img-fluid rounded" style="height: 70px; width: 70px; object-fit: cover;"></div><div class="col-9"><div class="card-body py-2 px-2"><h6 class="mb-0 fw-bold text-primary">${p.palabra}</h6></div></div></div></div>`;
        col.onclick = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabra(p); };
        ultimasPalabras.appendChild(col);
    });
}

// --- FAVORITOS Y HISTORIAL ---
function obtenerFavoritos(){ return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS) || "[]"); }
function esFavorito(n){ return obtenerFavoritos().includes(n); }
function alternarFavorito(n){ let f = obtenerFavoritos(); f.includes(n) ? f = f.filter(i=>i!==n) : f.push(n); localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(f)); return f.includes(n); }
function mostrarFavoritos(){
    if(!listaFavoritos) return;
    listaFavoritos.innerHTML = obtenerFavoritos().length === 0 ? '<p class="text-muted small">Aún no tienes favoritos.</p>' : "";
    obtenerFavoritos().forEach(nombre => {
        const p = App.datos.find(i => i.palabra === nombre);
        if(p){ const col = document.createElement("div"); col.className="col-6 col-md-3"; col.innerHTML=`<div class="card h-100 shadow-sm border-0" style="border-radius: 12px;"><div class="card-body text-center py-2"><h6 class="mb-0 fw-bold small text-primary">${p.palabra}</h6></div></div>`; col.onclick=()=>mostrarPalabra(p); listaFavoritos.appendChild(col); }
    });
}
function agregarAHistorial(n){ let h = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) || "[]"); h = h.filter(i=>i!==n); h.unshift(n); if(h.length>12) h.pop(); localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(h)); }
function mostrarPantallaHistorial(){
    seccionHistorial.classList.remove("d-none");
    listaHistorial.innerHTML = "";
    JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) || "[]").forEach(nombre => {
        const p = App.datos.find(i => i.palabra === nombre);
        if(p){ const col = document.createElement("div"); col.className="col-6 col-md-3"; col.innerHTML=`<div class="card h-100 shadow-sm border-0" style="border-radius: 12px;"><div class="card-body text-center py-2"><h6 class="mb-0 fw-bold small text-primary">${p.palabra}</h6></div></div>`; col.onclick=()=>mostrarPalabra(p); listaHistorial.appendChild(col); }
    });
}
document.addEventListener("click",(e)=>{ if(!buscar.contains(e.target) && !sugerencias.contains(e.target)) sugerencias.style.display="none"; });  
let offsetSenalDelDia = 0;

function mostrarSenalDelDia(offset = offsetSenalDelDia){

    if(App.datos.length===0) return;

    offsetSenalDelDia = offset;

    const hoy = new Date();

    // Perú está en UTC-5 todo el año (sin horario de verano).
    // Restamos ese desfase antes de calcular el día, para que el cambio
    // ocurra a la medianoche de Perú y no a la medianoche UTC.
    const desfasePeruMs = 5 * 60 * 60 * 1000;

    const numeroDia =
        Math.floor((hoy.getTime() - desfasePeruMs) / 86400000) - offset;

    const indice =
        ((numeroDia % App.datos.length) + App.datos.length) % App.datos.length;

    const palabra = App.datos[indice];

    document.getElementById("tituloDelDia").textContent =
        `"${palabra.palabra}"`;

    document.getElementById("descripcionDelDia").textContent =
        palabra.definicion.length > 160
            ? palabra.definicion.substring(0,160)+"..."
            : palabra.definicion;

    document.getElementById("categoriaDelDia").textContent =
        palabra.categoria;

    const labelSenalDelDia = document.getElementById("labelSenalDelDia");
    if(labelSenalDelDia){
        if(offset === 0) labelSenalDelDia.textContent = "✨ Seña del día";
        else if(offset === 1) labelSenalDelDia.textContent = "✨ Seña de ayer";
        else labelSenalDelDia.textContent = `✨ Seña de hace ${offset} días`;
    }

    const btnSenalSiguiente = document.getElementById("btnSenalSiguiente");
    if(btnSenalSiguiente){
        btnSenalSiguiente.classList.toggle("d-none", offset === 0);
        btnSenalSiguiente.onclick = () => mostrarSenalDelDia(Math.max(0, offsetSenalDelDia - 1));
    }

    const btnSenalAnterior = document.getElementById("btnSenalAnterior");
    if(btnSenalAnterior){
        btnSenalAnterior.classList.toggle("d-none", offset >= 1);
        btnSenalAnterior.onclick = () => mostrarSenalDelDia(Math.min(1, offsetSenalDelDia + 1));
    }

    document
        .getElementById("btnVerDelDia")
        .onclick=()=>{

            window.scrollTo({
                top:0,
                behavior:"smooth"
            });

            document.getElementById("senalDelDia").style.display = "none";
            mostrarPalabra(palabra);

        };

    const btnCerrarDelDia = document.getElementById("btnCerrarDelDia");
    if(btnCerrarDelDia){
        btnCerrarDelDia.onclick = () => {
            document.getElementById("senalDelDia").style.display = "none";
        };
    }

}

// --- QUIZ (Aprende Jugando) ---
const QuizState = {
    preguntas: [],
    indice: 0,
    aciertos: 0
};

const btnEmpezarQuiz = document.getElementById("btnEmpezarQuiz");
if(btnEmpezarQuiz) btnEmpezarQuiz.addEventListener("click", iniciarQuiz);

const btnReiniciarQuiz = document.getElementById("btnReiniciarQuiz");
if(btnReiniciarQuiz) btnReiniciarQuiz.addEventListener("click", () => {
    document.getElementById("quizResultados").classList.add("d-none");
    document.getElementById("quizIntro").classList.remove("d-none");
});

const btnSiguientePregunta = document.getElementById("btnSiguientePregunta");
if(btnSiguientePregunta) btnSiguientePregunta.addEventListener("click", () => {
    QuizState.indice++;
    mostrarPreguntaQuiz();
});

function mezclarArray(array){
    const copia = [...array];
    for(let i = copia.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

function palabrasJugables(){
    return App.datos.filter(p => p.video && p.video.trim() !== "");
}

function iniciarQuiz(){
    const jugables = palabrasJugables();
    if(jugables.length < 4){
        alert("Todavía no hay suficientes palabras con video para jugar el quiz.");
        return;
    }
    const totalPreguntas = Math.min(5, jugables.length);
    QuizState.preguntas = mezclarArray(jugables).slice(0, totalPreguntas);
    QuizState.indice = 0;
    QuizState.aciertos = 0;

    document.getElementById("quizIntro").classList.add("d-none");
    document.getElementById("quizResultados").classList.add("d-none");
    document.getElementById("quizActivo").classList.remove("d-none");
    mostrarPreguntaQuiz();
}

function mostrarPreguntaQuiz(){
    if(QuizState.indice >= QuizState.preguntas.length){
        mostrarResultadosQuiz();
        return;
    }
    const pregunta = QuizState.preguntas[QuizState.indice];

    document.getElementById("quizProgreso").textContent = `Pregunta ${QuizState.indice + 1} de ${QuizState.preguntas.length}`;
    document.getElementById("quizPuntaje").textContent = `Aciertos: ${QuizState.aciertos}`;
    document.getElementById("quizVideo").src = `https://www.youtube.com/embed/${pregunta.video}?rel=0&modestbranding=1`;
    document.getElementById("quizFeedback").textContent = "";
    document.getElementById("btnSiguientePregunta").classList.add("d-none");

    const jugables = palabrasJugables();
    const distractores = mezclarArray(jugables.filter(p => p.palabra !== pregunta.palabra)).slice(0, 3);
    const opciones = mezclarArray([pregunta, ...distractores]);

    const contenedorOpciones = document.getElementById("quizOpciones");
    contenedorOpciones.innerHTML = "";
    opciones.forEach(op => {
        const col = document.createElement("div");
        col.className = "col-6";
        const boton = document.createElement("button");
        boton.className = "btn btn-outline-primary w-100 fw-bold";
        boton.style.borderRadius = "10px";
        boton.textContent = op.palabra;
        boton.onclick = () => responderQuiz(boton, op.palabra === pregunta.palabra, pregunta.palabra);
        col.appendChild(boton);
        contenedorOpciones.appendChild(col);
    });
}

function responderQuiz(botonElegido, esCorrecta, palabraCorrecta){
    const botones = document.querySelectorAll("#quizOpciones button");
    botones.forEach(b => {
        b.disabled = true;
        if(b.textContent === palabraCorrecta) b.classList.replace("btn-outline-primary", "btn-success");
    });

    const feedback = document.getElementById("quizFeedback");
    if(esCorrecta){
        QuizState.aciertos++;
        feedback.textContent = "✅ ¡Correcto!";
        feedback.style.color = "#16a34a";
    } else {
        botonElegido.classList.replace("btn-outline-primary", "btn-danger");
        feedback.textContent = `❌ La respuesta correcta era "${palabraCorrecta}".`;
        feedback.style.color = "#dc2626";
    }
    document.getElementById("quizPuntaje").textContent = `Aciertos: ${QuizState.aciertos}`;
    document.getElementById("btnSiguientePregunta").classList.remove("d-none");
}

function mostrarResultadosQuiz(){
    document.getElementById("quizActivo").classList.add("d-none");
    document.getElementById("quizResultados").classList.remove("d-none");
    const total = QuizState.preguntas.length;
    document.getElementById("quizResultadoTexto").innerHTML = `Acertaste <strong>${QuizState.aciertos}</strong> de <strong>${total}</strong> preguntas.`;
}

