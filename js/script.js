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

        sugerencias.innerHTML =
        '<div class="list-group-item">Sin resultados</div>';

        return;

    }

    encontrados.forEach(p=>{

        const boton=document.createElement("button");

        boton.className="list-group-item list-group-item-action";

        boton.innerHTML=`
            <strong>${p.palabra}</strong><br>
            <small>${p.categoria}</small>
        `;

        boton.onclick=()=>mostrarPalabra(p);

        sugerencias.appendChild(boton);

    });

}

function mostrarPalabra(p){

    buscar.value = p.palabra;

    sugerencias.innerHTML="";

    // Texto del botón según si la palabra ya está en favoritos
    const enFavoritos = esFavorito(p.palabra);
    const textoBoton = enFavoritos
        ? "★ En favoritos"
        : "⭐ Agregar a favoritos";

    resultado.innerHTML=`

    <div class="card shadow-lg">

        <div class="card-body">

            <span class="badge bg-primary">
                ${p.categoria}
            </span>

            <h2 class="mt-3">
                ${p.palabra}
            </h2>

            <p>
                ${p.definicion}
            </p>

            <button id="btnFavorito" class="btn btn-outline-primary mb-3">
                ${textoBoton}
            </button>

            <div class="ratio ratio-16x9">

                <iframe
                src="https://www.youtube.com/embed/${p.video}"
                allowfullscreen>
                </iframe>

            </div>

        </div>

    </div>

    `;

    // Alternar favorito al hacer clic y refrescar la sección
    document.getElementById("btnFavorito").addEventListener("click", () => {

        const ahoraEnFavoritos = alternarFavorito(p.palabra);

        document.getElementById("btnFavorito").textContent = ahoraEnFavoritos
            ? "★ En favoritos"
            : "⭐ Agregar a favoritos";

        mostrarFavoritos();

    });

}

document.addEventListener("click",(e)=>{

    if(
        !buscar.contains(e.target) &&
        !sugerencias.contains(e.target)
    ){

        sugerencias.innerHTML="";

    }

});

document
.getElementById("btnCategorias")
.addEventListener("click", mostrarCategorias);

function mostrarCategorias(){

    panelCategorias.innerHTML="";

    const categorias=[...new Set(palabras.map(p=>p.categoria))];

    categorias.sort();

    categorias.forEach(nombre=>{

        const cantidad=palabras.filter(
            p=>p.categoria===nombre
        ).length;

        const card=document.createElement("div");

        card.className="col-md-4";

        card.innerHTML=`

        <div class="card h-100 shadow categoria-card">

            <div class="card-body text-center">

                <h5>${nombre}</h5>

                <p>${cantidad} palabras</p>

            </div>

        </div>

        `;

        card.onclick=()=>mostrarCategoria(nombre);

        panelCategorias.appendChild(card);

    });

}

function mostrarCategoria(nombre){

    resultado.innerHTML="";

    const lista=palabras.filter(
        p=>p.categoria===nombre
    );

    lista.forEach(p=>{

        resultado.innerHTML+=`

        <div class="card mb-3 palabra-card">

            <div class="card-body">

                <h5>${p.palabra}</h5>

                <p>${p.definicion}</p>

                <button
                    class="btn btn-primary"
                    onclick="mostrarPalabraPorNombre('${p.palabra}')">

                    Ver

                </button>

            </div>

        </div>

        `;

    });

}

function mostrarPalabraPorNombre(nombre){

    const palabra=palabras.find(
        p=>p.palabra===nombre
    );

    if(palabra){

        mostrarPalabra(palabra);

    }

}

function mostrarUltimasPalabras(){

    ultimasPalabras.innerHTML="";

    const lista=[...palabras].slice(-6).reverse();

    lista.forEach(p=>{

        ultimasPalabras.innerHTML+=`

        <div class="col-md-4">

            <div class="card">

                <div class="card-body">

                    <h5>${p.palabra}</h5>

                    <small>${p.categoria}</small>

                </div>

            </div>

        </div>

        `;

    });

}

// --- Sistema de favoritos (localStorage) ---

// Lee la lista de palabras favoritas desde localStorage
function obtenerFavoritos(){

    const datos = localStorage.getItem(CLAVE_FAVORITOS);

    if(datos === null) return [];

    try{

        return JSON.parse(datos);

    }catch(error){

        return [];

    }

}

// Guarda la lista de favoritos en localStorage
function guardarFavoritos(lista){

    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(lista));

}

// Comprueba si una palabra está en favoritos
function esFavorito(nombre){

    return obtenerFavoritos().includes(nombre);

}

// Agrega o quita una palabra de favoritos y persiste el cambio
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

// Renderiza las tarjetas de la sección "Mis Favoritos"
function mostrarFavoritos(){

    if(!listaFavoritos) return;

    listaFavoritos.innerHTML = "";

    obtenerFavoritos().forEach(nombre => {

        const p = palabras.find(item => item.palabra === nombre);

        // Omitir favoritos cuyo nombre ya no exista en el diccionario
        if(!p) return;

        const col = document.createElement("div");
        col.className = "col-md-4";

        const card = document.createElement("div");
        card.className = "card";
        card.style.cursor = "pointer";

        card.innerHTML = `
            <div class="card-body">
                <h5>${p.palabra}</h5>
                <small>${p.categoria}</small>
            </div>
        `;

        card.onclick = () => mostrarPalabra(p);

        col.appendChild(card);
        listaFavoritos.appendChild(col);

    });

}