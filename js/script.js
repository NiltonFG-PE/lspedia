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

// Clave de localStorage para persistir favoritos
const CLAVE_FAVORITOS = "lspedia_favoritos";

fetch("data/palabras.json")
.then(res => res.json())
.then(data => {
    palabras = data;
    actualizarEstadisticas();
    mostrarUltimasPalabras();
    mostrarFavoritos();
});

function actualizarEstadisticas(){
    totalPalabras.textContent = palabras.length;
    totalVideos.textContent = palabras.length;
    const categorias = [...new Set(palabras.map(p => p.categoria))];
    totalCategorias.textContent = categorias.length;
}

buscar.addEventListener("input", buscarPalabras);

function buscarPalabras(){
    const texto = buscar.value.trim().toLowerCase();

    sugerencias.innerHTML = "";
    resultado.innerHTML = "";

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
            <strong class="small">${p.palabra}</strong><br>
            <small class="text-muted" style="font-size: 11px;">${p.categoria}</small>
        `;
        boton.onclick=()=>mostrarPalabra(p);
        sugerencias.appendChild(boton);
    });
}

function mostrarPalabra(p){
    buscar.value = p.palabra;
    sugerencias.innerHTML="";

    const enFavoritos = esFavorito(p.palabra);
    const textoBoton = enFavoritos ? "★ En favoritos" : "⭐ Agregar a favoritos";
    const rutaImagen = p.imagen ? p.imagen : "https://via.placeholder.com/150";

    resultado.innerHTML=`
    <div class="card shadow-md mb-4">
        <div class="card-body p-3">
            <span class="badge bg-primary mb-1" style="font-size: 11px;">
                ${p.categoria}
            </span>
            <h4 class="mt-1 mb-1">${p.palabra}</h4>
            <p class="text-muted small mb-2">${p.definicion}</p>

            <button id="btnFavorito" class="btn btn-sm btn-outline-primary mb-3 py-1 px-3" style="border-radius: 15px; font-size: 12px;">
                ${textoBoton}
            </button>

            <!-- Estructura de dos columnas alineadas para Video e Imagen -->
            <div class="row g-3 align-items-center">
                <div class="col-md-7">
                    <div class="ratio ratio-16x9">
                        <iframe src="https://www.youtube.com/embed/${p.video}" allowfullscreen></iframe>
                    </div>
                </div>
                <div class="col-md-5 text-center">
                    <img src="${rutaImagen}" alt="Seña para ${p.palabra}" class="img-fluid">
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
}

document.addEventListener("click",(e)=>{
    if(!buscar.contains(e.target) && !sugerencias.contains(e.target)){
        sugerencias.innerHTML="";
    }
});

document.getElementById("btnCategorias").addEventListener("click", mostrarCategorias);

function mostrarCategorias(){
    panelCategorias.innerHTML="";
    const categorias=[...new Set(palabras.map(p=>p.categoria))];
    categorias.sort();

    categorias.forEach(nombre=>{
        const cantidad=palabras.filter(p=>p.categoria===nombre).length;
        const card=document.createElement("div");
        card.className="col-6 col-md-3"; // Cuadrícula de 4 elementos por fila en PC

        card.innerHTML=`
        <div class="card h-100 shadow-sm categoria-card">
            <div class="card-body text-center py-2">
                <h6 class="mb-0">${nombre}</h6>
                <p class="mb-0 small">${cantidad} palabras</p>
            </div>
        </div>
        `;
        card.onclick=()=>mostrarCategoria(nombre);
        panelCategorias.appendChild(card);
    });
}

function mostrarCategoria(nombre){
    resultado.innerHTML="";
    const lista=palabras.filter(p=>p.categoria===nombre);

    lista.forEach(p=>{
        resultado.innerHTML+=`
        <div class="card mb-2 palabra-card shadow-sm">
            <div class="card-body p-2 d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0 fw-bold">${p.palabra}</h6>
                    <small class="text-muted" style="font-size: 11px;">${p.definicion}</small>
                </div>
                <button class="btn btn-sm btn-primary py-1 px-3" onclick="mostrarPalabraPorNombre('${p.palabra}')">
                    Ver
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

function mostrarUltimasPalabras(){
    if(!ultimasPalabras) return;
    ultimasPalabras.innerHTML="";
    const lista=[...palabras].slice(-4).reverse(); // Muestra las últimas 4 palabras en lugar de 6

    lista.forEach(p=>{
        const col = document.createElement("div");
        col.className = "col-6 col-md-3";
        col.innerHTML=`
        <div class="card h-100 shadow-sm" style="cursor:pointer">
            <div class="card-body text-center py-2">
                <h6 class="mb-0 fw-bold small">${p.palabra}</h6>
                <small class="text-muted" style="font-size: 11px;">${p.categoria}</small>
            </div>
        </div>
        `;
        col.onclick = () => mostrarPalabra(p);
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
                <small class="text-muted" style="font-size: 11px;">${p.categoria}</small>
            </div>
        `;
        card.onclick = () => mostrarPalabra(p);
        col.appendChild(card);
        listaFavoritos.appendChild(col);
    });
}