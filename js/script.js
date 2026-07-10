let palabras = [];

const buscar = document.getElementById("buscar");
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
const btnInicio = document.getElementById("btnInicio");
if(btnInicio) {
    btnInicio.addEventListener("click", (e) => {
        e.preventDefault();
        const icono = document.getElementById("iconoInicio");
        if(icono) icono.classList.add("spin-anim");
        setTimeout(() => window.location.reload(), 500); 
    });
}

document.getElementById("btnCategorias").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarCategorias();
    panelCategorias.scrollIntoView({ behavior: 'smooth', block: 'center' });
    panelCategorias.classList.add("highlight-anim");
    setTimeout(() => panelCategorias.classList.remove("highlight-anim"), 2000);
});

document.getElementById("btnNavFavoritos").addEventListener("click", (e) => {
    e.preventDefault();
    const seccionFav = document.getElementById("seccionFavoritos");
    seccionFav.scrollIntoView({ behavior: 'smooth', block: 'center' });
    seccionFav.classList.add("highlight-anim");
    setTimeout(() => seccionFav.classList.remove("highlight-anim"), 2000);
});

document.getElementById("btnHistorial").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarPantallaHistorial();
});

// --- CARGA DE DATOS ---
fetch("data/palabras.json")
.then(res => res.json())
.then(data => {
    palabras = data.filter(p => p.palabra && p.categoria);
    actualizarEstadisticas();
    mostrarFavoritos();
});

function actualizarEstadisticas(){
    totalPalabras.textContent = palabras.length;
    totalVideos.textContent = palabras.length; 
    const categoriasUnicas = [...new Set(palabras.map(p => p.categoria.trim()))];
    totalCategorias.textContent = categoriasUnicas.length;
}

// --- BUSCADOR INTELIGENTE ---
buscar.addEventListener("input", buscarPalabras);

function buscarPalabras(){
    const texto = buscar.value.trim().toLowerCase();

    sugerencias.innerHTML = "";
    resultado.innerHTML = "";
    ultimasPalabras.innerHTML = ""; 
    panelCategorias.innerHTML = "";
    seccionHistorial.classList.add("d-none"); 

    if(texto === "") return;

    const encontrados = palabras
    .filter(p => {
        const matchPrincipal = p.palabra.toLowerCase().includes(texto);
        const matchVariantes = p.variantes ? p.variantes.toLowerCase().includes(texto) : false;
        return matchPrincipal || matchVariantes;
    })
    .slice(0,10);

    if(encontrados.length===0){
        sugerencias.innerHTML = '<div class="list-group-item text-muted small">Sin resultados</div>';
        return;
    }

    encontrados.forEach(p=>{
        const boton=document.createElement("button");
        boton.className="list-group-item list-group-item-action text-start";
        
        let textoMatch = `<strong>${p.palabra}</strong>`;
        if(p.variantes && p.variantes.toLowerCase().includes(texto) && !p.palabra.toLowerCase().includes(texto)){
            textoMatch += ` <small class="text-primary ms-2 fw-bold" style="font-size: 11px;">(Variante: ${texto})</small>`;
        }

        boton.innerHTML=`
            ${textoMatch}
            <span class="badge bg-light text-dark float-end" style="font-size: 10px;">${p.categoria.trim()}</span>
        `;
        boton.onclick=()=>mostrarPalabra(p);
        sugerencias.appendChild(boton);
    });
}

// --- MOSTRAR PALABRA Y UN SOLO VIDEO ---
function mostrarPalabra(p){
    buscar.value = p.palabra;
    sugerencias.innerHTML="";
    panelCategorias.innerHTML = ""; 
    seccionHistorial.classList.add("d-none");

    agregarAHistorial(p.palabra); 

    const enFavoritos = esFavorito(p.palabra);
    const textoBoton = enFavoritos ? "★ En favoritos" : "⭐ Agregar a favoritos";
    const rutaImagen = p.imagen ? p.imagen : "https://via.placeholder.com/150";

    // NUEVO: Bloque dinámico para las variantes
    let bloqueVariantes = "";
    if (p.variantes && p.variantes.trim() !== "") {
        bloqueVariantes = `
        <div class="mb-3 p-2 bg-light rounded border">
            <span class="d-block fw-bold text-secondary mb-1" style="font-size: 10px; letter-spacing: 0.5px;">🔄 CONJUGACIONES O VARIANTES:</span>
            <span class="text-muted small fst-italic">${p.variantes}</span>
        </div>
        `;
    }

    resultado.innerHTML=`
    <div class="card shadow-sm mb-4 animate-fade-in">
        <div class="card-body p-4">
            <span class="badge bg-primary mb-2" style="font-size: 11px;">
                ${p.categoria.trim()}
            </span>
            <h3 class="fw-bold mb-1">${p.palabra}</h3>
            <p class="text-muted small mb-3">${p.definicion}</p>

            ${bloqueVariantes}

            <button id="btnFavorito" class="btn btn-sm btn-outline-primary mb-4 py-1 px-3" style="border-radius: 15px; font-size: 12px;">
                ${textoBoton}
            </button>

            <div class="row g-4 justify-content-center">
                <div class="col-md-8">
                    <div class="mb-2">
                        <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">🎥 SEÑA Y EJEMPLO:</span>
                        <div class="ratio ratio-16x9 shadow-sm rounded overflow-hidden border">
                            <iframe src="https://www.youtube.com/embed/${p.video}" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4 text-center d-flex flex-column align-items-center justify-content-start">
                    <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">📸 Apoyo Visual:</span>
                    <img src="${rutaImagen}" alt="Seña para ${p.palabra}" class="img-fluid rounded border p-2 bg-light shadow-sm" style="max-height: 250px; object-fit: contain;">
                </div>
            </div>
        </div>
    </div>
    `;

    document.getElementById("btnFavorito").addEventListener("click", () => {
        const ahoraEnFavoritos = alternarFavorito(p.palabra);
        document.getElementById("btnFavorito").textContent = ahoraEnFavoritos ? "★ En favoritos" : "⭐ Agregar a favoritos";
        mostrarFavoritos();
    });

    mostrarSugerenciasRelacionadas(p);
}

// --- FILTRO ABC ---
function filtrarPorLetra(letra) {
    buscar.value = ""; 
    sugerencias.innerHTML = "";
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    ultimasPalabras.innerHTML = ""; 
    seccionHistorial.classList.add("d-none");

    const filtradas = palabras.filter(p => p.palabra.toUpperCase().startsWith(letra.toUpperCase()));

    if (filtradas.length === 0) {
        resultado.innerHTML = `
            <div class="alert alert-light border text-center text-muted small py-3">
                No hay palabras registradas que comiencen con la letra <strong>${letra}</strong> todavía.
            </div>
        `;
        return;
    }

    resultado.innerHTML = `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Resultados con la letra: ${letra}</h6>`;
    
    filtradas.forEach(p => {
        resultado.innerHTML += `
        <div class="card mb-2 palabra-card shadow-sm animate-fade-in">
            <div class="card-body p-2 d-flex justify-content-between align-items-center">
                <div class="ms-2">
                    <h6 class="mb-0 fw-bold">${p.palabra}</h6>
                    <small class="text-muted" style="font-size: 11px;">${p.categoria.trim()}</small>
                </div>
                <button class="btn btn-sm btn-primary py-1 px-3" style="border-radius: 6px; font-size: 13px;" onclick="mostrarPalabraPorNombre('${p.palabra}')">
                    Ver Seña
                </button>
            </div>
        </div>
        `;
    });
}

document.addEventListener("click",(e)=>{
    if(!buscar.contains(e.target) && !sugerencias.contains(e.target)){
        sugerencias.innerHTML="";
    }
});

// --- CATEGORÍAS ---
function mostrarCategorias(){
    resultado.innerHTML="";
    panelCategorias.innerHTML="";
    ultimasPalabras.innerHTML = ""; 
    seccionHistorial.classList.add("d-none");
    
    const categories = [...new Set(palabras.map(p => p.categoria.trim()))];
    categories.sort();

    categories.forEach(nombre=>{
        const cantidad = palabras.filter(p => p.categoria.trim() === nombre).length;
        const card = document.createElement("div");
        card.className = "col-6 col-md-3 animate-fade-in";

        card.innerHTML = `
        <div class="card h-100 shadow-sm categoria-card">
            <div class="card-body text-center py-3">
                <h6 class="mb-1 text-truncate">${nombre}</h6>
                <p class="mb-0 small">${cantidad} palabras</p>
            </div>
        </div>
        `;
        card.onclick = () => mostrarCategoria(nombre);
        panelCategorias.appendChild(card);
    });
}

function mostrarCategoria(nombre){
    resultado.innerHTML="";
    ultimasPalabras.innerHTML = ""; 
    const lista = palabras.filter(p => p.categoria.trim() === nombre);

    resultado.innerHTML = `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Categoría: ${nombre}</h6>`;

    lista.forEach(p=>{
        resultado.innerHTML+=`
        <div class="card mb-2 palabra-card shadow-sm animate-fade-in">
            <div class="card-body p-2 d-flex justify-content-between align-items-center">
                <div class="ms-2">
                    <h6 class="mb-0 fw-bold">${p.palabra}</h6>
                    <small class="text-muted" style="font-size: 11px;">${p.definicion}</small>
                </div>
                <button class="btn btn-sm btn-primary py-1 px-3" style="border-radius: 6px; font-size: 13px;" onclick="mostrarPalabraPorNombre('${p.palabra}')">
                    Ver Seña
                </button>
            </div>
        </div>
        `;
    });
}

function mostrarPalabraPorNombre(nombre){
    const palabra=palabras.find(p=>p.palabra===nombre);
    if(palabra){
        window.scrollTo({ top: 0, behavior: 'smooth' });
        mostrarPalabra(palabra);
    }
}

function mostrarSugerenciasRelacionadas(palabraActual){
    if(!ultimasPalabras) return;
    ultimasPalabras.innerHTML = "";
    const relacionadas = palabras.filter(p => p.categoria.trim() === palabraActual.categoria.trim() && p.palabra !== palabraActual.palabra);
    if (relacionadas.length === 0) return;

    ultimasPalabras.innerHTML = `
        <div class="col-12 mt-4 mb-2 animate-fade-in">
            <h5 class="fw-bold" style="color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
                Puede que también te interese
            </h5>
        </div>
    `;

    const lista = relacionadas.slice(-4).reverse();
    lista.forEach(p => {
        const col = document.createElement("div");
        col.className = "col-12 col-md-6 mb-2 animate-fade-in"; 
        const rutaImagen = p.imagen ? p.imagen : "https://via.placeholder.com/150";

        col.innerHTML = `
        <div class="card h-100 border-0 shadow-sm" style="cursor:pointer; background-color: #f8f9fa;">
            <div class="row g-0 align-items-center h-100">
                <div class="col-3 col-sm-2 p-2 text-center">
                    <img src="${rutaImagen}" class="img-fluid rounded" alt="${p.palabra}" style="object-fit: cover; height: 70px; width: 70px;">
                </div>
                <div class="col-9 col-sm-10">
                    <div class="card-body py-2 px-2 text-start">
                        <small class="text-uppercase text-muted" style="font-size: 10px; letter-spacing: 0.5px;">${p.categoria.trim()}</small>
                        <h6 class="mb-0 fw-bold" style="color: #0d6efd; font-size: 16px;">${p.palabra}</h6>
                        <p class="mb-0 text-muted small text-truncate" style="font-size: 12px;">${p.definicion}</p>
                    </div>
                </div>
            </div>
        </div>
        `;
        col.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            mostrarPalabra(p);
        };
        ultimasPalabras.appendChild(col);
    });
}

// --- FAVORITOS ---
function obtenerFavoritos(){
    const datos = localStorage.getItem(CLAVE_FAVORITOS);
    return datos ? JSON.parse(datos) : [];
}

function guardarFavoritos(lista){
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(lista));
}

function esFavorito(nombre){
    return obtenerFavoritos().includes(nombre);
}

function alternarFavorito(nombre){
    let favoritos = obtenerFavoritos();
    if(favoritos.includes(nombre)){
        favoritos = favoritos.filter(f => f !== nombre);
    }else{
        favoritos.push(nombre);
    }
    guardarFavoritos(favoritos);
    return favoritos.includes(nombre);
}

function mostrarFavoritos(){
    if(!listaFavoritos) return;
    listaFavoritos.innerHTML = "";
    
    const favs = obtenerFavoritos();
    if(favs.length === 0){
        listaFavoritos.innerHTML = '<p class="text-muted small">Aún no tienes palabras en favoritos.</p>';
        return;
    }

    favs.forEach(nombre => {
        const p = palabras.find(item => item.palabra === nombre);
        if(!p) return;

        const col = document.createElement("div");
        col.className = "col-6 col-md-3";

        const card = document.createElement("div");
        card.className = "card h-100 shadow-sm border-0";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <div class="card-body text-center py-2 bg-white rounded">
                <h6 class="mb-0 fw-bold small">${p.palabra}</h6>
                <small class="text-muted" style="font-size: 11px;">${p.categoria.trim()}</small>
            </div>
        `;
        card.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            mostrarPalabra(p);
        };
        col.appendChild(card);
        listaFavoritos.appendChild(col);
    });
}

// --- HISTORIAL ---
function obtenerHistorial(){
    const datos = localStorage.getItem(CLAVE_HISTORIAL);
    return datos ? JSON.parse(datos) : [];
}

function agregarAHistorial(nombre){
    let historial = obtenerHistorial();
    historial = historial.filter(h => h !== nombre);
    historial.unshift(nombre); 
    if(historial.length > 12) historial.pop(); 
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
}

function mostrarPantallaHistorial(){
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    ultimasPalabras.innerHTML = "";
    buscar.value = "";
    sugerencias.innerHTML = "";
    
    seccionHistorial.classList.remove("d-none");
    seccionHistorial.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    seccionHistorial.classList.add("highlight-anim");
    setTimeout(() => seccionHistorial.classList.remove("highlight-anim"), 2000);

    listaHistorial.innerHTML = "";
    const hist = obtenerHistorial();

    if(hist.length === 0){
        listaHistorial.innerHTML = '<p class="text-muted small">Tu historial está vacío. ¡Busca algunas palabras!</p>';
        return;
    }

    hist.forEach(nombre => {
        const p = palabras.find(item => item.palabra === nombre);
        if(!p) return;

        const col = document.createElement("div");
        col.className = "col-6 col-md-3 animate-fade-in";

        const card = document.createElement("div");
        card.className = "card h-100 shadow-sm";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <div class="card-body text-center py-2">
                <h6 class="mb-0 fw-bold small">${p.palabra}</h6>
                <small class="text-muted" style="font-size: 11px;">${p.categoria.trim()}</small>
            </div>
        `;
        card.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            mostrarPalabra(p);
        };
        col.appendChild(card);
        listaHistorial.appendChild(col);
    });
}