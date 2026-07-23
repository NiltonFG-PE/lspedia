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

// Recuerda qué categoría está abierta (si hay alguna) para poder
// refrescarla automáticamente si llegan datos nuevos del banco del Quiz.
let categoriaActualMostrada = null;

// Mismas 7 velocidades que tenía el selector anterior, ahora con
// control tortuga 🐢 / conejo 🐇 igual que en el módulo Alfabetización.
const VELOCIDADES_PALABRA = [0.6, 0.8, 0.9, 1, 1.2, 1.6, 2];
let palabraVelocidadIndex = 3; // 1x

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
    ocultarAlfabetizacion();
    ocultarSubtitulos();
    mostrarCategorias();
    panelCategorias.scrollIntoView({ behavior: 'smooth', block: 'center' });
    panelCategorias.classList.add("highlight-anim");
    setTimeout(() => panelCategorias.classList.remove("highlight-anim"), 2000);
});

document.getElementById("btnNavFavoritos").addEventListener("click", (e) => {
    e.preventDefault();
    ocultarQuiz();
    ocultarAlfabetizacion();
    ocultarSubtitulos();
    const seccionFav = document.getElementById("seccionFavoritos");
    seccionFav.scrollIntoView({ behavior: 'smooth', block: 'center' });
    seccionFav.classList.add("highlight-anim");
    setTimeout(() => seccionFav.classList.remove("highlight-anim"), 2000);
});

document.getElementById("btnHistorial").addEventListener("click", (e) => {
    e.preventDefault();
    ocultarQuiz();
    ocultarAlfabetizacion();
    ocultarSubtitulos();
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

const btnAccesoJugar = document.getElementById("btnAccesoJugar");
if(btnAccesoJugar){
    btnAccesoJugar.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarSeccionQuiz();
    });
}

// --- PANTALLAS DENTRO DE "JUGAR" ---
// La sección Jugar ahora arranca siempre en un menú (#quizMenuJuegos)
// para elegir "Completar la palabra", "Unir con flechas" o "Quiz".
// Los dos primeros juegos viven en js/alfabetizacion.js (AlfabetizacionV2)
// y el Quiz en js/quiz.js (QuizV2); esta lista cubre TODAS las pantallas
// posibles dentro de #seccionQuiz para poder ocultarlas de una sola vez
// antes de mostrar la que corresponde, sin importar de qué módulo venga.
const PANTALLAS_SECCION_JUEGOS = [
    "quizMenuJuegos", "quizCargando", "quizIntro", "quizActivo", "quizMemoria", "quizResultados",
    "alfabCompletar", "alfabUnir", "alfabResultados"
];

function ocultarPantallasJuegos(){
    PANTALLAS_SECCION_JUEGOS.forEach((id) => {
        const n = document.getElementById(id);
        if(n) n.classList.add("d-none");
    });
}

function mostrarPantallaJuegos(id){
    ocultarPantallasJuegos();
    const n = document.getElementById(id);
    if(n) n.classList.remove("d-none");
}

function mostrarMenuJuegos(){
    if(window.QuizV2 && typeof QuizV2.salir === "function") QuizV2.salir();
    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.detenerJuegosActivos === "function") AlfabetizacionV2.detenerJuegosActivos();
    mostrarPantallaJuegos("quizMenuJuegos");
}

function abrirJuegoCompletar(){
    mostrarPantallaJuegos("quizCargando");
    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.mostrarJuego === "function") AlfabetizacionV2.mostrarJuego("completar");
}

function abrirJuegoUnir(){
    mostrarPantallaJuegos("quizCargando");
    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.mostrarJuego === "function") AlfabetizacionV2.mostrarJuego("unir");
}

function abrirJuegoQuiz(){
    mostrarPantallaJuegos("quizCargando");
    if(window.QuizV2 && typeof QuizV2.iniciar === "function") QuizV2.iniciar();
}

const btnMenuJuegoCompletar = document.getElementById("btnMenuJuegoCompletar");
if(btnMenuJuegoCompletar) btnMenuJuegoCompletar.addEventListener("click", abrirJuegoCompletar);

const btnMenuJuegoUnir = document.getElementById("btnMenuJuegoUnir");
if(btnMenuJuegoUnir) btnMenuJuegoUnir.addEventListener("click", abrirJuegoUnir);

const btnMenuJuegoQuiz = document.getElementById("btnMenuJuegoQuiz");
if(btnMenuJuegoQuiz) btnMenuJuegoQuiz.addEventListener("click", abrirJuegoQuiz);

document.querySelectorAll(".btn-volver-menu-juegos").forEach((btn) => {
    btn.addEventListener("click", mostrarMenuJuegos);
});

function ocultarQuiz(){
    if(seccionQuiz) seccionQuiz.classList.add("d-none");
    // El Quiz ahora es independiente (QuizV2) y tiene sus propios datos desde Google Sheets.
    if(window.QuizV2 && typeof QuizV2.salir === "function") QuizV2.salir();
    // "Completar la palabra" y "Unir con flechas" (AlfabetizacionV2) también viven aquí ahora.
    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.detenerJuegosActivos === "function") AlfabetizacionV2.detenerJuegosActivos();
}

function mostrarSeccionQuiz(){
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    seccionHistorial.classList.add("d-none");
    ocultarAlfabetizacion();
    ocultarSubtitulos();
    seccionQuiz.classList.remove("d-none");
    mostrarMenuJuegos();
    seccionQuiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- SECCIÓN ALFABETIZACIÓN (ahora solo el módulo "Aprender") ---
const seccionAlfabetizacion = document.getElementById("seccionAlfabetizacion");
const btnAlfabetizacion = document.getElementById("btnAlfabetizacion");
if(btnAlfabetizacion){
    btnAlfabetizacion.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarSeccionAlfabetizacion();
    });
}

function ocultarAlfabetizacion(){
    if(seccionAlfabetizacion) seccionAlfabetizacion.classList.add("d-none");
    // js/alfabetizacion.js (namespace AlfabetizacionV2) tiene sus propios datos desde Google Sheets.
    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.salir === "function") AlfabetizacionV2.salir();
}

function mostrarSeccionAlfabetizacion(){
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    seccionHistorial.classList.add("d-none");
    ocultarQuiz();
    ocultarSubtitulos();
    seccionAlfabetizacion.classList.remove("d-none");
    // AlfabetizacionV2 (js/alfabetizacion.js) carga sus datos desde Google Sheets.
    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.iniciar === "function"){
        AlfabetizacionV2.iniciar();
    } else {
        console.warn("AlfabetizacionV2 aún no está definido: falta crear/cargar js/alfabetizacion.js.");
    }
    seccionAlfabetizacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- SECCIÓN SUBTÍTULOS EN TIEMPO REAL (independiente: micrófono + Web Speech API) ---
const seccionSubtitulos = document.getElementById("seccionSubtitulos");
const btnSubtitulos = document.getElementById("btnSubtitulos");
if(btnSubtitulos){
    btnSubtitulos.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarSeccionSubtitulos();
    });
}

function ocultarSubtitulos(){
    if(seccionSubtitulos) seccionSubtitulos.classList.add("d-none");
    // js/subtitulos.js (namespace SubtitulosV2) apaga el micrófono al salir,
    // por privacidad, aunque el usuario no haya pulsado "Detener".
    if(window.SubtitulosV2 && typeof SubtitulosV2.salir === "function") SubtitulosV2.salir();
}

function mostrarSeccionSubtitulos(){
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    seccionHistorial.classList.add("d-none");
    ocultarQuiz();
    ocultarAlfabetizacion();
    seccionSubtitulos.classList.remove("d-none");
    if(window.SubtitulosV2 && typeof SubtitulosV2.iniciar === "function"){
        SubtitulosV2.iniciar();
    } else {
        console.warn("SubtitulosV2 aún no está definido: falta crear/cargar js/subtitulos.js.");
    }
    seccionSubtitulos.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const btnSubtitulosSalir = document.getElementById("btnSubtitulosSalir");
if(btnSubtitulosSalir){
    btnSubtitulosSalir.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarSubtitulos();
    });
}

// --- CARGA DE DATOS CENTRALIZADA ---
const App = {
    datos: [],
    iniciar: function() {
        // Precarga en segundo plano el banco del Quiz (Hoja 2) desde el
        // primer instante, sin esperar a que el usuario busque algo o
        // entre a la sección Quiz. js/quiz.js ya dispara su propia carga
        // automática al cargar la página; esta llamada es una segunda
        // garantía explícita (no hace nada si ya está cargando o cargado)
        // para que quede claro, en un solo lugar, que las palabras de la
        // Hoja 2 deben estar disponibles lo antes posible.
        if (window.QuizV2 && typeof QuizV2.asegurarBancoCargado === "function") {
            QuizV2.asegurarBancoCargado();
        }

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
                restaurarPalabraDesdeUrl(palabraEnUrl);
            }
        })
        .catch(error => console.error("Error al cargar LSPedia:", error));
    }
};
// "const App = {...}" NO se agrega solo a window (a diferencia de "var"
// o de una función declarada), así que hay que exponerlo a mano, igual
// que QuizV2/AlfabetizacionV2/SubtitulosV2 — por si algún otro módulo
// necesita leer App.datos más adelante.
window.App = App;

document.addEventListener("DOMContentLoaded", () => {
    App.iniciar();
});

// --- TARJETAS DE ESTADÍSTICAS CLICABLES ---
const statCardPalabras = document.getElementById("statCardPalabras");
if (statCardPalabras) {
    statCardPalabras.addEventListener("click", () => {
        const indice = document.getElementById("indiceAlfabetico");
        const yaAbierto = indice.classList.contains("show");
        if (!yaAbierto) {
            document.getElementById("btnToggleAbc").click();
        }
        indice.scrollIntoView({ behavior: "smooth", block: "center" });
    });
}

const statCardCategorias = document.getElementById("statCardCategorias");
if (statCardCategorias) {
    statCardCategorias.addEventListener("click", () => {
        document.getElementById("btnCategorias").click();
    });
}

const statCardVideos = document.getElementById("statCardVideos");
if (statCardVideos) {
    statCardVideos.addEventListener("click", () => {
        window.open("https://www.youtube.com/@LSPedia-sign/playlists", "_blank", "noopener");
    });
}

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

// --- BANCO DE LA HOJA 2 (solo para Categorías y para fusionar el video
//     del Quiz cuando falta en la Hoja 1; el buscador YA NO la usa) ---
// QuizV2 (js/quiz.js) ya precarga la Hoja 2 en segundo plano apenas
// carga la página (para que el juego abra al instante). Reutilizamos
// esa misma data en vivo en vez de conectarnos otra vez a Google Sheets.
function obtenerBancoHoja2() {
    return (window.QuizV2 && typeof QuizV2.obtenerBanco === "function") ? QuizV2.obtenerBanco() : [];
}

// --- FUSIÓN DE RESULTADOS ENTRE HOJA 1 Y HOJA 2 ---
// Cuando una misma palabra existe tanto en el diccionario (Hoja 1) como
// en el banco del Quiz (Hoja 2), en vez de mostrar dos tarjetas separadas
// se fusiona en un solo resultado: se usa el video de la Hoja 2 solo como
// respaldo (si en la Hoja 1 todavía no hay video cargado) y se agrega el
// nivel del Quiz como dato extra para mostrar una insignia.
function fusionarConHoja2(p) {
    const enHoja2 = obtenerBancoHoja2().find(
        q => q.palabra && q.palabra.trim().toLowerCase() === p.palabra.trim().toLowerCase()
    );
    if (!enHoja2) return p;
    return {
        ...p,
        // El video de la Hoja 1 ya NO se reemplaza por el de la Hoja 2:
        // cada uno se muestra en su propio bloque dentro del resultado
        // (ver bloqueVideoSena en mostrarPalabra()).
        nivel: p.nivel || enHoja2.nivel,
        _tambienEnQuiz: true,
        _videoQuiz: (enHoja2.video && enHoja2.video.trim() !== "") ? enHoja2.video : ""
    };
}

// La precarga en segundo plano de QuizV2 puede tardar unos segundos en
// llegar (esperando un "momento libre" del navegador + la respuesta de
// Google Sheets). Para que el buscador no dependa de esa espera:
// 1) Apenas hay algo escrito en el buscador, le pedimos a QuizV2 que
//    apure la carga si todavía no la tiene (asegurarBancoCargado no hace
//    nada si ya está cargada o si ya hay una petición en curso).
// 2) Nos suscribimos a onBancoListo para volver a ejecutar la búsqueda
//    en cuanto lleguen los datos, así el usuario ve aparecer los
//    resultados de la Hoja 2 sin tener que volver a escribir.
document.addEventListener("DOMContentLoaded", () => {
    if (window.QuizV2 && typeof QuizV2.onBancoListo === "function") {
        QuizV2.onBancoListo(() => {
            actualizarEstadisticas();
            // Si el panel de categorías (o una categoría abierta) ya estaba
            // visible antes de que llegaran los datos de la Hoja 2, se
            // refresca solo para que las palabras del Quiz aparezcan sin
            // que el usuario tenga que volver a hacer clic.
            if (categoriaActualMostrada) {
                mostrarCategoria(categoriaActualMostrada);
            } else if (panelCategorias && panelCategorias.children.length > 0) {
                mostrarCategorias();
            }
        });
    } else {
        console.warn("QuizV2 no está disponible: las categorías no podrán mostrar palabras de la Hoja 2.");
    }
});

// --- BUSCADOR INTELIGENTE (solo Hoja 1) ---
buscar.addEventListener("input", buscarPalabras);

function buscarPalabras(){
    const texto = buscar.value.trim().toLowerCase();
    ocultarQuiz();
    ocultarAlfabetizacion();
    sugerencias.innerHTML = "";
    //resultado.innerHTML = "";
    //ultimasPalabras.innerHTML = ""; 
    //panelCategorias.innerHTML = "";
    categoriaActualMostrada = null;
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
        return;
    }

    const parciales = App.datos.filter(p => p.palabra.toLowerCase().includes(texto) || (p.variantes && p.variantes.toLowerCase().includes(texto)));
    if(parciales.length > 0) {
        mostrarPalabra(parciales[0]);
        return;
    }

    buscar.blur();
    panelCategorias.innerHTML = "";
    categoriaActualMostrada = null;
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

// --- MOSTRAR PALABRA ---
// Extrae el ID de video de un enlace de YouTube en cualquiera de sus
// formatos comunes (watch?v=, youtu.be/, embed/, shorts/). Si lo que
// llega ya es un ID "pelado" de 11 caracteres (como usa la columna
// "video"), lo devuelve tal cual. Si no reconoce nada, devuelve "".
function extraerIdYouTube(valor) {
    if (!valor) return "";
    const texto = valor.trim();
    const match = texto.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    if (match) return match[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(texto)) return texto;
    return "";
}

function mostrarPalabra(p){
    // Si la misma palabra también existe en la Hoja 2 (banco del Quiz),
    // se fusiona el resultado en vez de tratarlas por separado.
    p = fusionarConHoja2(p);
    ocultarQuiz();
    ocultarAlfabetizacion();
    buscar.value = p.palabra;
    buscar.blur();
    sugerencias.innerHTML="";
    sugerencias.style.display = "none";
    panelCategorias.innerHTML = ""; 
    categoriaActualMostrada = null;
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
        : `<div class="d-flex flex-column align-items-center justify-content-center text-muted text-center p-3 w-100 h-100">
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
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnReiniciarPalabra" title="Reiniciar desde el principio" aria-label="Reiniciar desde el principio">↺ Reiniciar</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnAvanzar10" title="Avanzar 10 segundos" aria-label="Avanzar 10 segundos">10s ⏩</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadLenta" title="Reducir velocidad" aria-label="Reducir velocidad">🐢</button>
                <span class="small fw-bold text-muted" id="palabraVelocidadLabel">1x</span>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadRapida" title="Aumentar velocidad" aria-label="Aumentar velocidad">🐇</button>
           </div>`
        : "";
    let bloqueVariantes = p.variantes && p.variantes.trim() !== "" ? `<div class="mb-3 p-2 bg-light rounded border"><span class="d-block fw-bold text-secondary mb-1" style="font-size: 10px; letter-spacing: 0.5px;">🔄 CONJUGACIONES O VARIANTES:</span><span class="text-muted small fst-italic">${p.variantes}</span></div>` : "";

    // Columna "senaSugerida" de la Hoja 1: es un ID/URL de YouTube, así que
    // en vez de mostrarla como texto se arma una tercera caja con su propio
    // reproductor controlable (mismos botones que el video principal, pero
    // con IDs "...Sugerida" para no chocar con los del reproductor principal).
    const idVideoSugerida = extraerIdYouTube(p.senasugerida);
    const bloqueSenaSugerida = idVideoSugerida
        ? `<div class="apoyo-panel mt-3 mt-lg-0">
                <span class="apoyo-panel-titulo">💡 Seña sugerida</span>
                <div class="reproductor-palabra-wrap shadow-sm rounded overflow-hidden border mx-0" id="reproductorSugeridaWrap" style="max-width: none;">
                    <div id="reproductorSugerida"></div>
                </div>
                <div class="controles-video controles-video-compactos d-flex align-items-center justify-content-center gap-2 mt-2 flex-wrap">
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnRetroceder10Sugerida" title="Retroceder 5 segundos" aria-label="Retroceder 5 segundos">⏪ 5s</button>
                    <button type="button" class="btn btn-sm btn-primary" id="btnPlayPauseSugerida" title="Reproducir o pausar" aria-label="Reproducir o pausar">▶️ Reproducir</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnReiniciarSugerida" title="Reiniciar desde el principio" aria-label="Reiniciar desde el principio">↺ Reiniciar</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnAvanzar10Sugerida" title="Avanzar 10 segundos" aria-label="Avanzar 10 segundos">10s ⏩</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnVelocidadLentaSugerida" title="Reducir velocidad" aria-label="Reducir velocidad">🐢</button>
                    <span class="small fw-bold text-muted" id="velocidadLabelSugerida">1x</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnVelocidadRapidaSugerida" title="Aumentar velocidad" aria-label="Aumentar velocidad">🐇</button>
                </div>
           </div>`
        : "";

    // Insignia opcional cuando la palabra también aparece en el banco del
    // Quiz (Hoja 2), resultado de fusionarConHoja2() más arriba.
    const bloqueBadgeQuiz = p._tambienEnQuiz
        ? `<span class="badge bg-warning text-dark mb-2 ms-1" style="font-size: 11px;">🎮 También en el Quiz${p.nivel ? " · " + p.nivel : ""}</span>`
        : "";

    // --- BLOQUE "VIDEO SEÑA" ---
    // Cuando la misma palabra también tiene un video propio en la Hoja 2
    // (banco del Quiz), se muestra como una sección aparte dentro del
    // mismo resultado, sin pisar el video/definición de la Hoja 1.
    const idVideoQuiz = p._videoQuiz ? extraerIdYouTube(p._videoQuiz) : "";
    const bloqueVideoSena = idVideoQuiz
        ? `<div class="mt-4 pt-4 border-top">
                <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">🎮 VIDEO SEÑA <span class="text-normal">(Banco del Quiz${p.nivel ? " · " + p.nivel : ""})</span>:</span>
                <div class="reproductor-palabra-wrap shadow-sm rounded overflow-hidden border mx-auto" id="reproductorPalabraQuizWrap" style="max-width: 480px;">
                    <div id="reproductorPalabraQuiz"></div>
                </div>
                <div class="controles-video d-flex align-items-center justify-content-center gap-2 mt-2 flex-wrap">
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnRetroceder10Quiz" title="Retroceder 5 segundos" aria-label="Retroceder 5 segundos">⏪ 5s</button>
                    <button type="button" class="btn btn-sm btn-primary" id="btnPlayPauseQuiz" title="Reproducir o pausar" aria-label="Reproducir o pausar">▶️ Reproducir</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnReiniciarPalabraQuiz" title="Reiniciar desde el principio" aria-label="Reiniciar desde el principio">↺ Reiniciar</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnAvanzar10Quiz" title="Avanzar 10 segundos" aria-label="Avanzar 10 segundos">10s ⏩</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadLentaQuiz" title="Reducir velocidad" aria-label="Reducir velocidad">🐢</button>
                    <span class="small fw-bold text-muted" id="palabraVelocidadLabelQuiz">1x</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadRapidaQuiz" title="Aumentar velocidad" aria-label="Aumentar velocidad">🐇</button>
                </div>
           </div>`
        : "";

    resultado.innerHTML=`
    <div class="card shadow-sm mb-4 animate-fade-in" style="border-radius: 15px; border-color: #dceefc;">
        <div class="card-body p-4">
            <span class="badge bg-primary mb-2" style="font-size: 11px;">${p.categoria.trim()}</span>
            ${bloqueBadgeQuiz}
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <h3 class="fw-bold mb-0" style="color: #0d6efd;">${p.palabra}</h3>
                <button id="btnFavorito" class="btn btn-sm btn-outline-primary py-1 px-3 flex-shrink-0" style="border-radius: 15px; font-size: 12px; font-weight: bold;">${textoBoton}</button>
            </div>
            <p class="mb-3 p-3 rounded" style="background-color: #eef6ff; border-left: 4px solid #0d6efd; font-size: 1rem; line-height: 1.5; color: #1e293b;">${p.definicion}</p>
            ${bloqueVariantes}
            <div class="row g-4 justify-content-center align-items-stretch">
                <div class="col-lg-7 d-flex flex-column">
                    <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider text-md-start">🤟 Definición en Señas:</span>
                    <div class="reproductor-palabra-wrap shadow-sm rounded overflow-hidden border" id="reproductorPalabraWrap">
                        ${bloqueVideo}
                    </div>
                    ${bloqueControlesVideo}
                </div>
                <div class="col-lg-5 d-flex flex-column justify-content-center gap-3">
                    <div class="apoyo-panel">
                        <span class="apoyo-panel-titulo">📸 Imagen ejemplo</span>
                        <div class="apoyo-panel-caja">
                            ${bloqueImagen}
                        </div>
                    </div>
                    ${bloqueSenaSugerida}
                </div>
            </div>
            ${bloqueVideoSena}
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
<<<<<<< HEAD
    if (idVideoQuiz) {
        inicializarReproductorPalabraQuiz(idVideoQuiz);
    } else {
        ytPlayerPalabraQuiz = null;
=======
    if (idVideoSugerida) {
        inicializarReproductorSugerida(idVideoSugerida);
    } else {
        ytPlayerSugerida = null;
>>>>>>> develop
    }
    setTimeout(() => resultado.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}

// --- TARJETA SIMPLIFICADA PARA PALABRAS DE LA HOJA 2 (banco del Quiz) ---
// La Hoja 2 solo tiene palabra, video, categoría y nivel (no definición,
// imagen, variantes ni seña sugerida), así que esta es una versión
// reducida de mostrarPalabra() con lo mínimo que hay disponible.
// No toca favoritos ni historial (viven ligados a App.datos), pero SÍ
// actualiza la URL (?p=...) para que restaurarPalabraDesdeUrl() pueda
// recuperar este mismo resultado si el usuario refresca la página.
function mostrarPalabraSimplificada(p){
    ocultarQuiz();
    ocultarAlfabetizacion();
    buscar.value = p.palabra;
    buscar.blur();
    sugerencias.innerHTML = "";
    sugerencias.style.display = "none";
    panelCategorias.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    seccionHistorial.classList.add("d-none");
    document.getElementById("senalDelDia").style.display = "none";
    const nuevaUrl = window.location.pathname + "?p=" + encodeURIComponent(p.palabra);
    window.history.pushState({path: nuevaUrl}, '', nuevaUrl);

    const idVideo = extraerIdYouTube(p.video);
    const bloqueVideo = idVideo
        ? `<div id="reproductorPalabra"></div>`
        : `<div class="d-flex flex-column align-items-center justify-content-center h-100 bg-light text-muted text-center p-3">
                <span class="fs-1 mb-2">🤟</span>
                <span class="small fw-bold">Video próximamente</span>
           </div>`;
    const bloqueControlesVideo = idVideo
        ? `<div class="controles-video d-flex align-items-center justify-content-center gap-2 mt-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnRetroceder10" title="Retroceder 5 segundos" aria-label="Retroceder 5 segundos">⏪ 5s</button>
                <button type="button" class="btn btn-sm btn-primary" id="btnPlayPause" title="Reproducir o pausar" aria-label="Reproducir o pausar">▶️ Reproducir</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnReiniciarPalabra" title="Reiniciar desde el principio" aria-label="Reiniciar desde el principio">↺ Reiniciar</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnAvanzar10" title="Avanzar 10 segundos" aria-label="Avanzar 10 segundos">10s ⏩</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadLenta" title="Reducir velocidad" aria-label="Reducir velocidad">🐢</button>
                <span class="small fw-bold text-muted" id="palabraVelocidadLabel">1x</span>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadRapida" title="Aumentar velocidad" aria-label="Aumentar velocidad">🐇</button>
           </div>`
        : "";

    resultado.innerHTML = `
    <div class="card shadow-sm mb-4 animate-fade-in" style="border-radius: 15px; border-color: #dceefc;">
        <div class="card-body p-4">
            <span class="badge bg-warning text-dark mb-2" style="font-size: 11px;">🎮 Banco del Quiz</span>
            ${p.categoria ? `<span class="badge bg-primary mb-2 ms-1" style="font-size: 11px;">${p.categoria.trim()}</span>` : ""}
            ${p.nivel ? `<span class="badge bg-secondary mb-2 ms-1" style="font-size: 11px;">${p.nivel}</span>` : ""}
            <h3 class="fw-bold mb-3" style="color: #0d6efd;">${p.palabra}</h3>
            <div class="row g-4 justify-content-center">
                <div class="col-lg-8 d-flex flex-column">
                    <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">🤟 Video de la seña:</span>
                    <div class="reproductor-palabra-wrap shadow-sm rounded overflow-hidden border" id="reproductorPalabraWrap">
                        ${bloqueVideo}
                    </div>
                    ${bloqueControlesVideo}
                </div>
            </div>
        </div>
    </div>`;

    if (idVideo) {
        inicializarReproductorPalabra(idVideo);
    } else {
        ytPlayerPalabra = null;
    }
    setTimeout(() => resultado.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}

// --- REPRODUCTOR DE VIDEO CONTROLABLE (YouTube IFrame API) ---
let ytPlayerPalabra = null;
let ytPlayerPalabraQuiz = null;
let ytApiListo = false;
let ytVideoIdPendiente = null;
let ytVideoIdPendienteQuiz = null;

// Esta función la llama automáticamente el script de YouTube (iframe_api) cuando está lista.
function onYouTubeIframeAPIReady() {
    ytApiListo = true;
    if (ytVideoIdPendiente) {
        crearReproductorPalabra(ytVideoIdPendiente);
        ytVideoIdPendiente = null;
    }
<<<<<<< HEAD
    if (ytVideoIdPendienteQuiz) {
        crearReproductorPalabraQuiz(ytVideoIdPendienteQuiz);
        ytVideoIdPendienteQuiz = null;
=======
    if (ytVideoIdSugeridaPendiente) {
        crearReproductorSugerida(ytVideoIdSugeridaPendiente);
        ytVideoIdSugeridaPendiente = null;
>>>>>>> develop
    }
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function inicializarReproductorPalabra(videoId) {
    ajustarAspectoReproductorPalabra(videoId);
    if (ytApiListo) {
        crearReproductorPalabra(videoId);
    } else {
        // La API todavía no cargó: guardamos el video y se crea en cuanto esté lista.
        ytVideoIdPendiente = videoId;
    }
}

// Consulta el oEmbed público de YouTube para conocer el ancho/alto reales
// del video (muchos videos de señas son verticales) y ajusta la ventana
// del reproductor a su tamaño real, sin bandas negras ni recortes, en vez
// de forzar siempre un recuadro 16:9 fijo. Mismo patrón que se usa en el
// reproductor del Quiz (js/quiz.js).
function ajustarAspectoReproductorPalabra(videoId) {
    const wrap = document.getElementById("reproductorPalabraWrap");
    if (!wrap) return;
    wrap.style.aspectRatio = "16 / 9"; // valor razonable mientras se confirma el real

    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}&format=json`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
            const wrapActual = document.getElementById("reproductorPalabraWrap");
            if (!data || !wrapActual || !data.width || !data.height) return;
            wrapActual.style.aspectRatio = `${data.width} / ${data.height}`;
        })
        .catch(() => { /* si falla la red, se mantiene el valor por defecto */ });
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
    const btnReiniciar = document.getElementById("btnReiniciarPalabra");
    const btnVelocidadLenta = document.getElementById("btnPalabraVelocidadLenta");
    const btnVelocidadRapida = document.getElementById("btnPalabraVelocidadRapida");
    if (!btnRetroceder || !btnAvanzar || !btnPlayPause || !btnReiniciar || !btnVelocidadLenta || !btnVelocidadRapida || !ytPlayerPalabra) return;

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

    btnReiniciar.addEventListener("click", () => {
        ytPlayerPalabra.seekTo(0, true);
        ytPlayerPalabra.playVideo();
    });

    // Cada video nuevo arranca en 1x, igual que antes con el <select selected>.
    palabraVelocidadIndex = VELOCIDADES_PALABRA.indexOf(1);
    ytPlayerPalabra.setPlaybackRate(1);
    actualizarLabelVelocidadPalabra();

    btnVelocidadLenta.addEventListener("click", () => cambiarVelocidadPalabra(-1));
    btnVelocidadRapida.addEventListener("click", () => cambiarVelocidadPalabra(1));
}

function cambiarVelocidadPalabra(delta) {
    if (!ytPlayerPalabra) return;
    const max = VELOCIDADES_PALABRA.length - 1;
    palabraVelocidadIndex = Math.min(max, Math.max(0, palabraVelocidadIndex + delta));
    ytPlayerPalabra.setPlaybackRate(VELOCIDADES_PALABRA[palabraVelocidadIndex]);
    actualizarLabelVelocidadPalabra();
}

function actualizarLabelVelocidadPalabra() {
    const label = document.getElementById("palabraVelocidadLabel");
    if (label) label.textContent = VELOCIDADES_PALABRA[palabraVelocidadIndex] + "x";
}

function actualizarBotonPlayPause(evento) {
    const btnPlayPause = document.getElementById("btnPlayPause");
    if (!btnPlayPause) return;
    btnPlayPause.textContent = evento.data === YT.PlayerState.PLAYING ? "⏸ Pausar" : "▶️ Reproducir";
}

<<<<<<< HEAD
// --- REPRODUCTOR DEL BLOQUE "VIDEO SEÑA" (video de la Hoja 2 / banco del Quiz) ---
// Mismo patrón y mismos controles que el reproductor principal de arriba,
// pero completamente independiente: su propio id de DOM, su propio
// reproductor (ytPlayerPalabraQuiz) y su propia velocidad, así ambos
// videos se pueden reproducir y controlar por separado sin pisarse.
let palabraVelocidadIndexQuiz = VELOCIDADES_PALABRA.indexOf(1);

function inicializarReproductorPalabraQuiz(videoId) {
    ajustarAspectoReproductorPalabraQuiz(videoId);
    if (ytApiListo) {
        crearReproductorPalabraQuiz(videoId);
    } else {
        ytVideoIdPendienteQuiz = videoId;
    }
}

function ajustarAspectoReproductorPalabraQuiz(videoId) {
    const wrap = document.getElementById("reproductorPalabraQuizWrap");
=======
// --- REPRODUCTOR DE VIDEO CONTROLABLE PARA "SEÑA SUGERIDA" (columna G,
// senaSugerida, de la Hoja 1). Es una copia independiente del reproductor
// principal (misma API de YouTube, mismos controles: pausar, reiniciar,
// retroceder/avanzar y velocidad) pero con su propia instancia y sus
// propios IDs, para poder mostrarse al mismo tiempo que el video principal
// sin que ambos reproductores se pisen entre sí. ---
let ytPlayerSugerida = null;
let ytVideoIdSugeridaPendiente = null;
const VELOCIDADES_SUGERIDA = VELOCIDADES_PALABRA;
let velocidadSugeridaIndex = VELOCIDADES_SUGERIDA.indexOf(1);

function inicializarReproductorSugerida(videoId) {
    ajustarAspectoReproductorSugerida(videoId);
    if (ytApiListo) {
        crearReproductorSugerida(videoId);
    } else {
        // La API de YouTube todavía no cargó (la carga onYouTubeIframeAPIReady
        // ya crea el reproductor principal si estaba pendiente; aquí guardamos
        // también el video de la seña sugerida para crearlo en ese mismo momento).
        ytVideoIdSugeridaPendiente = videoId;
    }
}

function ajustarAspectoReproductorSugerida(videoId) {
    const wrap = document.getElementById("reproductorSugeridaWrap");
>>>>>>> develop
    if (!wrap) return;
    wrap.style.aspectRatio = "16 / 9";

    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}&format=json`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
<<<<<<< HEAD
            const wrapActual = document.getElementById("reproductorPalabraQuizWrap");
=======
            const wrapActual = document.getElementById("reproductorSugeridaWrap");
>>>>>>> develop
            if (!data || !wrapActual || !data.width || !data.height) return;
            wrapActual.style.aspectRatio = `${data.width} / ${data.height}`;
        })
        .catch(() => { /* si falla la red, se mantiene el valor por defecto */ });
}

<<<<<<< HEAD
function crearReproductorPalabraQuiz(videoId) {
    const contenedor = document.getElementById("reproductorPalabraQuiz");
    if (!contenedor) return;
    if (ytPlayerPalabraQuiz && typeof ytPlayerPalabraQuiz.destroy === "function") {
        ytPlayerPalabraQuiz.destroy();
    }
    ytPlayerPalabraQuiz = new YT.Player("reproductorPalabraQuiz", {
        videoId: videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
            onReady: configurarControlesVideoQuiz,
            onStateChange: actualizarBotonPlayPauseQuiz
=======
function crearReproductorSugerida(videoId) {
    const contenedor = document.getElementById("reproductorSugerida");
    if (!contenedor) return;
    if (ytPlayerSugerida && typeof ytPlayerSugerida.destroy === "function") {
        ytPlayerSugerida.destroy();
    }
    ytPlayerSugerida = new YT.Player("reproductorSugerida", {
        videoId: videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
            onReady: configurarControlesVideoSugerida,
            onStateChange: actualizarBotonPlayPauseSugerida
>>>>>>> develop
        }
    });
}

<<<<<<< HEAD
function configurarControlesVideoQuiz() {
    const btnRetroceder = document.getElementById("btnRetroceder10Quiz");
    const btnAvanzar = document.getElementById("btnAvanzar10Quiz");
    const btnPlayPause = document.getElementById("btnPlayPauseQuiz");
    const btnReiniciar = document.getElementById("btnReiniciarPalabraQuiz");
    const btnVelocidadLenta = document.getElementById("btnPalabraVelocidadLentaQuiz");
    const btnVelocidadRapida = document.getElementById("btnPalabraVelocidadRapidaQuiz");
    if (!btnRetroceder || !btnAvanzar || !btnPlayPause || !btnReiniciar || !btnVelocidadLenta || !btnVelocidadRapida || !ytPlayerPalabraQuiz) return;

    btnRetroceder.addEventListener("click", () => {
        const tiempoActual = ytPlayerPalabraQuiz.getCurrentTime();
        ytPlayerPalabraQuiz.seekTo(Math.max(0, tiempoActual - 5), true);
    });

    btnAvanzar.addEventListener("click", () => {
        const tiempoActual = ytPlayerPalabraQuiz.getCurrentTime();
        const duracion = ytPlayerPalabraQuiz.getDuration();
        ytPlayerPalabraQuiz.seekTo(Math.min(duracion, tiempoActual + 10), true);
    });

    btnPlayPause.addEventListener("click", () => {
        const estado = ytPlayerPalabraQuiz.getPlayerState();
        if (estado === YT.PlayerState.PLAYING) {
            ytPlayerPalabraQuiz.pauseVideo();
        } else {
            ytPlayerPalabraQuiz.playVideo();
=======
function configurarControlesVideoSugerida() {
    const btnRetroceder = document.getElementById("btnRetroceder10Sugerida");
    const btnAvanzar = document.getElementById("btnAvanzar10Sugerida");
    const btnPlayPause = document.getElementById("btnPlayPauseSugerida");
    const btnReiniciar = document.getElementById("btnReiniciarSugerida");
    const btnVelocidadLenta = document.getElementById("btnVelocidadLentaSugerida");
    const btnVelocidadRapida = document.getElementById("btnVelocidadRapidaSugerida");
    if (!btnRetroceder || !btnAvanzar || !btnPlayPause || !btnReiniciar || !btnVelocidadLenta || !btnVelocidadRapida || !ytPlayerSugerida) return;

    btnRetroceder.addEventListener("click", () => {
        const tiempoActual = ytPlayerSugerida.getCurrentTime();
        ytPlayerSugerida.seekTo(Math.max(0, tiempoActual - 5), true);
    });

    btnAvanzar.addEventListener("click", () => {
        const tiempoActual = ytPlayerSugerida.getCurrentTime();
        const duracion = ytPlayerSugerida.getDuration();
        ytPlayerSugerida.seekTo(Math.min(duracion, tiempoActual + 10), true);
    });

    btnPlayPause.addEventListener("click", () => {
        const estado = ytPlayerSugerida.getPlayerState();
        if (estado === YT.PlayerState.PLAYING) {
            ytPlayerSugerida.pauseVideo();
        } else {
            ytPlayerSugerida.playVideo();
>>>>>>> develop
        }
    });

    btnReiniciar.addEventListener("click", () => {
<<<<<<< HEAD
        ytPlayerPalabraQuiz.seekTo(0, true);
        ytPlayerPalabraQuiz.playVideo();
    });

    // Cada video nuevo arranca en 1x, igual que el reproductor principal.
    palabraVelocidadIndexQuiz = VELOCIDADES_PALABRA.indexOf(1);
    ytPlayerPalabraQuiz.setPlaybackRate(1);
    actualizarLabelVelocidadPalabraQuiz();

    btnVelocidadLenta.addEventListener("click", () => cambiarVelocidadPalabraQuiz(-1));
    btnVelocidadRapida.addEventListener("click", () => cambiarVelocidadPalabraQuiz(1));
}

function cambiarVelocidadPalabraQuiz(delta) {
    if (!ytPlayerPalabraQuiz) return;
    const max = VELOCIDADES_PALABRA.length - 1;
    palabraVelocidadIndexQuiz = Math.min(max, Math.max(0, palabraVelocidadIndexQuiz + delta));
    ytPlayerPalabraQuiz.setPlaybackRate(VELOCIDADES_PALABRA[palabraVelocidadIndexQuiz]);
    actualizarLabelVelocidadPalabraQuiz();
}

function actualizarLabelVelocidadPalabraQuiz() {
    const label = document.getElementById("palabraVelocidadLabelQuiz");
    if (label) label.textContent = VELOCIDADES_PALABRA[palabraVelocidadIndexQuiz] + "x";
}

function actualizarBotonPlayPauseQuiz(evento) {
    const btnPlayPause = document.getElementById("btnPlayPauseQuiz");
=======
        ytPlayerSugerida.seekTo(0, true);
        ytPlayerSugerida.playVideo();
    });

    velocidadSugeridaIndex = VELOCIDADES_SUGERIDA.indexOf(1);
    ytPlayerSugerida.setPlaybackRate(1);
    actualizarLabelVelocidadSugerida();

    btnVelocidadLenta.addEventListener("click", () => cambiarVelocidadSugerida(-1));
    btnVelocidadRapida.addEventListener("click", () => cambiarVelocidadSugerida(1));
}

function cambiarVelocidadSugerida(delta) {
    if (!ytPlayerSugerida) return;
    const max = VELOCIDADES_SUGERIDA.length - 1;
    velocidadSugeridaIndex = Math.min(max, Math.max(0, velocidadSugeridaIndex + delta));
    ytPlayerSugerida.setPlaybackRate(VELOCIDADES_SUGERIDA[velocidadSugeridaIndex]);
    actualizarLabelVelocidadSugerida();
}

function actualizarLabelVelocidadSugerida() {
    const label = document.getElementById("velocidadLabelSugerida");
    if (label) label.textContent = VELOCIDADES_SUGERIDA[velocidadSugeridaIndex] + "x";
}

function actualizarBotonPlayPauseSugerida(evento) {
    const btnPlayPause = document.getElementById("btnPlayPauseSugerida");
>>>>>>> develop
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
    const bancoHoja2 = obtenerBancoHoja2();

    totalPalabras.textContent = App.datos.length;
    totalCategorias.textContent = [...new Set(App.datos.map(p => p.categoria.trim()))].length;

    // "Videos": suma de archivos de video reales, no de palabras únicas.
    // Se cuentan por separado (sin deduplicar por nombre de palabra) porque
    // son archivos distintos aunque pertenezcan a la misma palabra:
    // 1) video principal de la Hoja 1, 2) seña sugerida de la Hoja 1
    // (columna G, senasugerida) y 3) video del banco del Quiz (Hoja 2,
    // que QuizV2 ya entrega filtrado a solo filas con video).
    const videosHoja1 = App.datos.filter(p => p.video && p.video.trim() !== "").length;
    const senasSugeridas = App.datos.filter(p => p.senasugerida && p.senasugerida.trim() !== "").length;
    const videosQuiz = bancoHoja2.length;
    totalVideos.textContent = videosHoja1 + senasSugeridas + videosQuiz;
}

// --- FILTRO ABC ---
function filtrarPorLetra(letra) {
    ocultarQuiz();
    ocultarAlfabetizacion();
    buscar.value = ""; 
    sugerencias.innerHTML = "";
    sugerencias.style.display = "none";
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    categoriaActualMostrada = null;
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
    if (window.QuizV2 && typeof QuizV2.asegurarBancoCargado === "function") {
        QuizV2.asegurarBancoCargado();
    }
    const datosUnificados = obtenerDatosUnificados();
    const categories = [...new Set(datosUnificados.map(p => p.categoria.trim()))].sort();
    categories.forEach(nombre=>{
        const cantidad = datosUnificados.filter(p => p.categoria.trim() === nombre).length;
        const card = document.createElement("div");
        card.className = "col-6 col-md-3 animate-fade-in";
        card.innerHTML = `<div class="card h-100 shadow-sm categoria-card" style="border-radius: 12px; border: 1px solid #dceefc;"><div class="card-body text-center py-3"><h6 class="mb-1 fw-bold text-primary">${nombre}</h6><p class="mb-0 small text-muted">${cantidad} palabras</p></div></div>`;
        card.onclick = () => mostrarCategoria(nombre);
        panelCategorias.appendChild(card);
    });
    categoriaActualMostrada = null;
}

// --- DATOS UNIFICADOS (Hoja 1 + palabras de la Hoja 2 que no están en la Hoja 1) ---
// Se usa en categorías (y se puede reutilizar donde haga falta) para que
// las palabras del banco del Quiz no queden "invisibles" fuera del buscador.
// Solo se incluyen las de la Hoja 2 que ya tienen categoría, para que el
// agrupamiento por categoría tenga sentido.
function obtenerDatosUnificados(){
    const nombresHoja1 = new Set(App.datos.map(p => p.palabra.trim().toLowerCase()));
    const soloHoja2 = obtenerBancoHoja2()
        .filter(p => p.palabra && p.categoria && p.categoria.trim() !== "" && !nombresHoja1.has(p.palabra.trim().toLowerCase()))
        .map(p => ({ ...p, _soloQuiz: true }));
    return [...App.datos, ...soloHoja2];
}

function mostrarCategoria(nombre){
    categoriaActualMostrada = nombre;
    resultado.innerHTML=`<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Categoría: ${nombre}</h6>`;
    obtenerDatosUnificados().filter(p => p.categoria.trim() === nombre).forEach(p=>{
        const badgeQuiz = p._soloQuiz ? ` <span class="badge bg-warning text-dark ms-1" style="font-size: 10px;">🎮 Quiz</span>` : "";
        resultado.innerHTML+=`<div class="card mb-2 palabra-card shadow-sm animate-fade-in" style="border-radius: 10px;"><div class="card-body p-2 d-flex justify-content-between align-items-center"><div><h6 class="mb-0 fw-bold text-primary">${p.palabra}${badgeQuiz}</h6></div><button class="btn btn-sm btn-primary py-1 px-3 fw-bold" onclick="mostrarPalabraPorNombreUnificado('${p.palabra.replace(/'/g, "\\'")}')">Ver Seña</button></div></div>`;
    });
}

// Igual que mostrarPalabraPorNombre(), pero también busca en el banco
// del Quiz (Hoja 2) cuando la palabra no está en el diccionario principal.
function mostrarPalabraPorNombreUnificado(nombre){
    const enHoja1 = App.datos.find(p => p.palabra.toLowerCase() === nombre.toLowerCase());
    if(enHoja1){ window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabra(enHoja1); return; }
    const enHoja2 = obtenerBancoHoja2().find(p => p.palabra && p.palabra.toLowerCase() === nombre.toLowerCase());
    if(enHoja2){ window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabraSimplificada(enHoja2); }
}

function mostrarPalabraPorNombre(nombre){
    const palabra = App.datos.find(p => p.palabra.toLowerCase() === nombre.toLowerCase());
    if(palabra){ window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabra(palabra); }
}

// --- RESTAURAR RESULTADO AL CARGAR/REFRESCAR LA PÁGINA (?p=...) ---
// Si la palabra está en el diccionario (Hoja 1) se muestra de inmediato.
// Si no está ahí, puede ser una palabra que solo vive en el banco del
// Quiz (Hoja 2): en ese caso esperamos (o forzamos) su carga y recién
// entonces la mostramos, en vez de simplemente volver al inicio.
function restaurarPalabraDesdeUrl(nombre){
    const enHoja1 = App.datos.find(p => p.palabra.toLowerCase() === nombre.toLowerCase());
    if(enHoja1){
        mostrarPalabra(enHoja1);
        return;
    }
    if(window.QuizV2 && typeof QuizV2.onBancoListo === "function"){
        if(typeof QuizV2.asegurarBancoCargado === "function") QuizV2.asegurarBancoCargado();
        QuizV2.onBancoListo((banco) => {
            const enHoja2 = (banco || []).find(p => p.palabra && p.palabra.toLowerCase() === nombre.toLowerCase());
            // Solo mostramos si el usuario sigue en el resultado esperado (no navegó a otra pantalla mientras cargaba).
            if(enHoja2 && new URLSearchParams(window.location.search).get("p") === nombre){
                mostrarPalabraSimplificada(enHoja2);
            }
        });
    }
}

function mostrarSugerenciasRelacionadas(palabraActual){
    if(!ultimasPalabras) return;
    ultimasPalabras.innerHTML = "";
    const relacionadas = App.datos.filter(p => p.categoria.trim() === palabraActual.categoria.trim() && p.palabra !== palabraActual.palabra);
    if (relacionadas.length === 0) return;
    // Todo el bloque (título + tarjetas) va dentro de un único "col-12"
    // con fondo amarillo claro (.sugerencias-panel-destacado), así el
    // panel de color solo aparece cuando realmente hay sugerencias que
    // mostrar (si no hay, ultimasPalabras queda vacío y no se ve ninguna
    // caja de color de más).
    ultimasPalabras.innerHTML = `<div class="col-12"><div class="sugerencias-panel-destacado"><h5 class="fw-bold mb-3">Puede que también te interese</h5><div class="row g-2" id="sugerenciasPanelFilas"></div></div></div>`;
    const filas = document.getElementById("sugerenciasPanelFilas");
    relacionadas.slice(-4).reverse().forEach(p => {
        const col = document.createElement("div"); col.className = "col-12 col-md-6 mb-2";
        col.innerHTML = `<div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; background-color: #ffffff;"><div class="row g-0 align-items-center"><div class="col-3 p-2"><img src="${p.imagen || 'https://via.placeholder.com/150'}" class="img-fluid rounded" style="height: 70px; width: 70px; object-fit: cover;"></div><div class="col-9"><div class="card-body py-2 px-2"><h6 class="mb-0 fw-bold text-primary">${p.palabra}</h6></div></div></div></div>`;
        col.onclick = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabra(p); };
        filas.appendChild(col);
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

    // --- Miniatura del video (reutiliza extraerIdYouTube, definida más arriba) ---
    const miniaturaWrap = document.getElementById("miniaturaDelDiaWrap");
    const miniaturaImg = document.getElementById("miniaturaDelDiaImg");
    if (miniaturaWrap && miniaturaImg) {
        const idVideoDelDia = extraerIdYouTube(palabra.video);
        if (idVideoDelDia) {
            miniaturaImg.src = `https://img.youtube.com/vi/${idVideoDelDia}/mqdefault.jpg`;
            miniaturaImg.alt = `Miniatura de la seña "${palabra.palabra}"`;
            miniaturaWrap.classList.remove("d-none");
            const abrirDesdeMiniatura = () => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                document.getElementById("senalDelDia").style.display = "none";
                mostrarPalabra(palabra);
            };
            miniaturaWrap.onclick = abrirDesdeMiniatura;
            miniaturaWrap.onkeypress = (e) => { if (e.key === "Enter") abrirDesdeMiniatura(); };
        } else {
            miniaturaWrap.classList.add("d-none");
        }
    }

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

// El motor del Quiz (niveles, modos, temporizador, sonidos, etc.)
// vive ahora en js/quiz.js como el módulo independiente QuizV2,
// que lee sus preguntas desde la Hoja 2 de Google Sheets.