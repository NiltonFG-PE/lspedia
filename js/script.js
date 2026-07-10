let palabras = [];

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

    const urlParams = new URLSearchParams(window.location.search);
    const palabraEnUrl = urlParams.get("p");
    
    if (palabraEnUrl) {
        mostrarPalabraPorNombre(palabraEnUrl);
    }
});

function actualizarEstadisticas(){
    totalPalabras.textContent = palabras.length;
    totalVideos.textContent = palabras.length; 
    const categoriasUnicas = [...new Set(palabras.map(p => p.categoria.trim()))];
    totalCategorias.textContent = categoriasUnicas.length;
}

// --- BUSCADOR INTELIGENTE (SUGERENCIAS EN VIVO) ---
buscar.addEventListener("input", buscarPalabras);

function buscarPalabras(){
    const texto = buscar.value.trim().toLowerCase();

    sugerencias.innerHTML = "";
    resultado.innerHTML = "";
    ultimasPalabras.innerHTML = ""; 
    panelCategorias.innerHTML = "";
    seccionHistorial.classList.add("d-none"); 

    if(texto === "") {
        sugerencias.style.display = "none";
        return;
    }

    const encontrados = palabras
    .filter(p => {
        const matchPrincipal = p.palabra.toLowerCase().includes(texto);
        const matchVariantes = p.variantes ? p.variantes.toLowerCase().includes(texto) : false;
        return matchPrincipal || matchVariantes;
    })
    .slice(0,10);

    sugerencias.style.display = "block";

    // NUEVO: Menú desplegable con botón amarillo si no encuentra la palabra
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

        boton.innerHTML=`
            ${textoMatch}
            <span class="badge float-end" style="font-size: 10px;">${p.categoria.trim()}</span>
        `;
        boton.onclick=()=>mostrarPalabra(p);
        sugerencias.appendChild(boton);
    });
}

// --- FUNCIÓN PARA EL BOTÓN LUPA Y TECLA ENTER ---
if(btnBuscar) {
    btnBuscar.addEventListener("click", () => {
        ejecutarBusquedaDirecta();
    });
}

buscar.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); 
        ejecutarBusquedaDirecta();
    }
});

function ejecutarBusquedaDirecta() {
    const texto = buscar.value.trim().toLowerCase();
    if(texto === "") return;
    
    sugerencias.innerHTML = "";
    sugerencias.style.display = "none";
    
    const encontrados = palabras.filter(p => {
        const matchPrincipal = p.palabra.toLowerCase() === texto;
        const matchVariantes = p.variantes ? p.variantes.toLowerCase().split(',').map(v=>v.trim()).includes(texto) : false;
        return matchPrincipal || matchVariantes;
    });
    
    if(encontrados.length > 0) {
        mostrarPalabra(encontrados[0]);
    } else {
        const parciales = palabras.filter(p => {
            return p.palabra.toLowerCase().includes(texto) || (p.variantes && p.variantes.toLowerCase().includes(texto));
        });
        if(parciales.length > 0) {
            mostrarPalabra(parciales[0]);
        } else {
            // SI DA ENTER O CLIC EN LUPA Y NO EXISTE: Pantalla grande central
            panelCategorias.innerHTML = "";
            ultimasPalabras.innerHTML = "";
            seccionHistorial.classList.add("d-none");
            
            resultado.innerHTML = `
            <div class="card shadow-sm mb-4 border-0 animate-fade-in" style="border-radius: 15px; background-color: #f8f9fa;">
                <div class="card-body p-5 text-center">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔍🤷‍♂️</div>
                    <h4 class="fw-bold mb-3 text-primary">No encontramos "${buscar.value}"</h4>
                    <p class="text-muted mb-4">Aún no tenemos esta palabra en nuestro diccionario de Lengua de Señas Peruana, ¡pero nos encantaría agregarla con tu ayuda!</p>
                    <button class="btn btn-warning px-4 py-2 rounded-pill fw-bold text-dark" data-bs-toggle="modal" data-bs-target="#modalSugerencia">
                        Sugerir esta palabra
                    </button>
                </div>
            </div>
            `;
        }
    }
}

// --- MOSTRAR PALABRA Y UN SOLO VIDEO ---
function mostrarPalabra(p){
    buscar.value = p.palabra;
    sugerencias.innerHTML="";
    sugerencias.style.display = "none";
    panelCategorias.innerHTML = ""; 
    seccionHistorial.classList.add("d-none");

    const nuevaUrl = window.location.pathname + "?p=" + encodeURIComponent(p.palabra);
    window.history.pushState({path: nuevaUrl}, '', nuevaUrl);

    agregarAHistorial(p.palabra); 

    const enFavoritos = esFavorito(p.palabra);
    const textoBoton = enFavoritos ? "★ En favoritos" : "⭐ Agregar a favoritos";
    const rutaImagen = p.imagen ? p.imagen : "https://via.placeholder.com/150";

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
    <div class="card shadow-sm mb-4 animate-fade-in" style="border-radius: 15px; border-color: #dceefc;">
        <div class="card-body p-4">
            <span class="badge bg-primary mb-2" style="font-size: 11px;">
                ${p.categoria.trim()}
            </span>
            <h3 class="fw-bold mb-1" style="color: #0d6efd;">${p.palabra}</h3>
            <p class="text-muted small mb-3">${p.definicion}</p>

            ${bloqueVariantes}

            <button id="btnFavorito" class="btn btn-sm btn-outline-primary mb-4 py-1 px-3" style="border-radius: 15px; font-size: 12px; font-weight: bold;">
                ${textoBoton}
            </button>

            <div class="row g-4 justify-content-center">
                <div class="col-md-8">
                    <div class="mb-2">
                        <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">🎥 DEFINICIÓN Y EJEMPLO:</span>
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
    sugerencias.style.display = "none";
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    ultimasPalabras.innerHTML = ""; 
    seccionHistorial.classList.add("d-none");
    
    window.history.pushState({}, '', window.location.pathname);

    const filtradas = palabras.filter(p => p.palabra.toUpperCase().startsWith(letra.toUpperCase()));

    if (filtradas.length === 0) {
        resultado.innerHTML = `
            <div class="alert alert-light border text-center text-muted small py-3" style="border-radius: 12px;">
                No hay palabras registradas que comiencen con la letra <strong>${letra}</strong> todavía.
            </div>
        `;
        return;
    }

    resultado.innerHTML = `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Resultados con la letra: ${letra}</h6>`;
    
    filtradas.forEach(p => {
        resultado.innerHTML += `
        <div class="card mb-2 palabra-card shadow-sm animate-fade-in" style="border-radius: 10px;">
            <div class="card-body p-2 d-flex justify-content-between align-items-center">
                <div class="ms-2">
                    <h6 class="mb-0 fw-bold text-primary">${p.palabra}</h6>
                    <small class="text-muted" style="font-size: 11px;">${p.categoria.trim()}</small>
                </div>
                <button class="btn btn-sm btn-primary py-1 px-3 fw-bold" style="border-radius: 6px; font-size: 13px;" onclick="mostrarPalabraPorNombre('${p.palabra}')">
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
        sugerencias.style.display = "none";
    }
});

// --- CATEGORÍAS ---
function mostrarCategorias(){
    resultado.innerHTML="";
    panelCategorias.innerHTML="";
    ultimasPalabras.innerHTML = ""; 
    seccionHistorial.classList.add("d-none");
    window.history.pushState({}, '', window.location.pathname); 
    
    const categories = [...new Set(palabras.map(p => p.categoria.trim()))];
    categories.sort();

    categories.forEach(nombre=>{
        const cantidad = palabras.filter(p => p.categoria.trim() === nombre).length;
        const card = document.createElement("div");
        card.className = "col-6 col-md-3 animate-fade-in";

        card.innerHTML = `
        <div class="card h-100 shadow-sm categoria-card" style="border-radius: 12px; border: 1px solid #dceefc;">
            <div class="card-body text-center py-3">
                <h6 class="mb-1 text-truncate fw-bold text-primary">${nombre}</h6>
                <p class="mb-0 small text-muted">${cantidad} palabras</p>
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
        <div class="card mb-2 palabra-card shadow-sm animate-fade-in" style="border-radius: 10px;">
            <div class="card-body p-2 d-flex justify-content-between align-items-center">
                <div class="ms-2">
                    <h6 class="mb-0 fw-bold text-primary">${p.palabra}</h6>
                    <small class="text-muted" style="font-size: 11px;">${p.definicion}</small>
                </div>
                <button class="btn btn-sm btn-primary py-1 px-3 fw-bold" style="border-radius: 6px; font-size: 13px;" onclick="mostrarPalabraPorNombre('${p.palabra}')">
                    Ver Seña
                </button>
            </div>
        </div>
        `;
    });
}

function mostrarPalabraPorNombre(nombre){
    const palabra = palabras.find(p => p.palabra.toLowerCase() === nombre.toLowerCase());
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
            <h5 class="fw-bold" style="color: #2c3e50; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">
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
        <div class="card h-100 border-0 shadow-sm categoria-card" style="border-radius: 12px; background-color: #f8f9fa;">
            <div class="row g-0 align-items-center h-100">
                <div class="col-3 col-sm-2 p-2 text-center">
                    <img src="${rutaImagen}" class="img-fluid rounded" alt="${p.palabra}" style="object-fit: cover; height: 70px; width: 70px;">
                </div>
                <div class="col-9 col-sm-10">
                    <div class="card-body py-2 px-2 text-start">
                        <small class="text-uppercase text-muted fw-bold" style="font-size: 10px; letter-spacing: 0.5px;">${p.categoria.trim()}</small>
                        <h6 class="mb-0 fw-bold text-primary" style="font-size: 16px;">${p.palabra}</h6>
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
        card.className = "card h-100 shadow-sm border-0 categoria-card";
        card.style.borderRadius = "12px";
        card.innerHTML = `
            <div class="card-body text-center py-2 bg-white" style="border-radius: 12px;">
                <h6 class="mb-0 fw-bold small text-primary">${p.palabra}</h6>
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
    sugerencias.style.display = "none";
    
    window.history.pushState({}, '', window.location.pathname);

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
        card.className = "card h-100 shadow-sm categoria-card";
        card.style.borderRadius = "12px";
        card.innerHTML = `
            <div class="card-body text-center py-2">
                <h6 class="mb-0 fw-bold small text-primary">${p.palabra}</h6>
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