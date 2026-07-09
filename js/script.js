let palabras = [];

const buscar = document.getElementById("buscar");
const sugerencias = document.getElementById("sugerencias");
const resultado = document.getElementById("resultado");

const totalPalabras = document.getElementById("totalPalabras");
const totalCategorias = document.getElementById("totalCategorias");
const totalVideos = document.getElementById("totalVideos");

const panelCategorias = document.getElementById("panelCategorias");
const ultimasPalabras = document.getElementById("ultimasPalabras");
const listaFavoritos = document.getElementById("listaFavoritos");

const CLAVE_FAVORITOS = "lspedia_favoritos";

fetch("data/palabras.json")
.then(res => res.json())
.then(data => {
    palabras = data.filter(p => p.palabra && p.categoria);
    actualizarEstadisticas();
    // Ya no cargamos las sugerencias al inicio de la página
    mostrarFavoritos();
});

function actualizarEstadisticas(){
    totalPalabras.textContent = palabras.length;
    totalVideos.textContent = palabras.length * 2; 
    const categoriasUnicas = [...new Set(palabras.map(p => p.categoria.trim()))];
    totalCategorias.textContent = categoriasUnicas.length;
}

buscar.addEventListener("input", buscarPalabras);

function buscarPalabras(){
    const texto = buscar.value.trim().toLowerCase();

    sugerencias.innerHTML = "";
    resultado.innerHTML = "";
    ultimasPalabras.innerHTML = ""; // Oculta sugerencias al buscar
    panelCategorias.innerHTML = "";

    if(texto === "") return;

    const encontrados = palabras
    .filter(p => p.palabra.toLowerCase().includes(texto))
    .slice(0,10);

    if(encontrados.length===0){
        sugerencias.innerHTML = '<div class="list-group-item text-muted small">Sin resultados</div>';
        return;
    }

    encontrados.forEach(p=>{
        const boton=document.createElement("button");
        boton.className="list-group-item list-group-item-action text-start";
        boton.innerHTML=`
            <strong>${p.palabra}</strong>
            <span class="badge bg-light text-dark float-end" style="font-size: 10px;">${p.categoria.trim()}</span>
        `;
        boton.onclick=()=>mostrarPalabra(p);
        sugerencias.appendChild(boton);
    });
}

function mostrarPalabra(p){
    buscar.value = p.palabra;
    sugerencias.innerHTML="";
    panelCategorias.innerHTML = ""; 

    const enFavoritos = esFavorito(p.palabra);
    const textoBoton = enFavoritos ? "★ En favoritos" : "⭐ Agregar a favoritos";
    const rutaImagen = p.imagen ? p.imagen : "https://via.placeholder.com/150";
    const videoEjemploId = p.videoEjemplo ? p.videoEjemplo : p.video;

    resultado.innerHTML=`
    <div class="card shadow-sm mb-4 animate-fade-in">
        <div class="card-body p-4">
            <span class="badge bg-primary mb-2" style="font-size: 11px;">
                ${p.categoria.trim()}
            </span>
            <h3 class="fw-bold mb-1">${p.palabra}</h3>
            <p class="text-muted small mb-3">${p.definicion}</p>

            <button id="btnFavorito" class="btn btn-sm btn-outline-primary mb-4 py-1 px-3" style="border-radius: 15px; font-size: 12px;">
                ${textoBoton}
            </button>

            <div class="row g-4 justify-content-center">
                <div class="col-md-7">
                    <div class="mb-4">
                        <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">🎥 TRADUCCIÓN:</span>
                        <div class="ratio ratio-16x9 shadow-sm">
                            <iframe src="https://www.youtube.com/embed/${p.video}" allowfullscreen></iframe>
                        </div>
                    </div>
                    
                    <div>
                        <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">🎬 Ejemplo en oración:</span>
                        <div class="ratio ratio-16x9 shadow-sm">
                            <iframe src="https://www.youtube.com/embed/${videoEjemploId}" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4 text-center d-flex flex-column align-items-center justify-content-start pt-4">
                    <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">📸 Apoyo Visual:</span>
                    <img src="${rutaImagen}" alt="Seña para ${p.palabra}" class="img-fluid rounded border p-2 bg-light shadow-sm">
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

    // Llamamos a la sección relacionada SOLO después de mostrar el video
    mostrarUltimasPalabras(p.palabra);
}

function filtrarPorLetra(letra) {
    buscar.value = ""; 
    sugerencias.innerHTML = "";
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    ultimasPalabras.innerHTML = ""; // Oculta sugerencias al usar el abecedario

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

document.getElementById("btnCategorias").addEventListener("click", mostrarCategorias);

function mostrarCategorias(){
    resultado.innerHTML="";
    panelCategorias.innerHTML="";
    ultimasPalabras.innerHTML = ""; // Oculta sugerencias al ver categorías
    
    const categories = [...new Set(palabras.map(p => p.categoria.trim()))];
    categories.sort();

    categories.forEach(nombre=>{
        const cantidad = palabras.filter(p => p.categoria.trim() === nombre).length;
        const card = document.createElement("div");
        card.className = "col-6 col-md-3";

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
    ultimasPalabras.innerHTML = ""; // Oculta sugerencias al listar categoría
    const lista = palabras.filter(p => p.categoria.trim() === nombre);

    resultado.innerHTML = `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Categoría: ${nombre}</h6>`;

    lista.forEach(p=>{
        resultado.innerHTML+=`
        <div class="card mb-2 palabra-card shadow-sm">
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
        mostrarPalabra(palabra);
    }
}

// Modificado para recibir la palabra actual y no repetirla
function mostrarUltimasPalabras(palabraActual = null){
    if(!ultimasPalabras) return;
    
    ultimasPalabras.innerHTML = "";
    
    ultimasPalabras.innerHTML = `
        <div class="col-12 mt-4 mb-2 animate-fade-in">
            <h5 class="fw-bold" style="color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
                Puede que también te interese
            </h5>
        </div>
    `;

    // Filtramos para que no recomiende la misma palabra que estás viendo
    let listaFiltrada = palabras;
    if (palabraActual) {
        listaFiltrada = palabras.filter(p => p.palabra !== palabraActual);
    }

    const lista = [...listaFiltrada].slice(-4).reverse();

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

function obtenerFavoritos(){
    const datos = localStorage.getItem(CLAVE_FAVORITOS);
    if(datos === null) return [];
    try{
        return JSON.parse(datos);
    }catch(error){
        return [];
    }
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

    obtenerFavoritos().forEach(nombre => {
        const p = palabras.find(item => item.palabra === nombre);
        if(!p) return;

        const col = document.createElement("div");
        col.className = "col-6 col-md-3";

        const card = document.createElement("div");
        card.className = "card h-100 shadow-sm";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <div class="card-body text-center py-2">
                <h6 class="mb-0 fw-bold small">${p.palabra}</h6>
                <small class="text-muted" style="font-size: 11px;">${p.categoria.trim()}</small>
            </div>
        `;
        card.onclick = () => mostrarPalabra(p);
        col.appendChild(card);
        listaFavoritos.appendChild(col);
    });
}