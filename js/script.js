const buscar = document.getElementById("buscar");
const btnBuscar = document.getElementById("btnBuscar");
const sugerencias = document.getElementById("sugerencias");
const resultado = document.getElementById("resultado");

const bloqueBuscador = document.getElementById("bloqueBuscador");
const bloqueBuscadorCategorias = document.getElementById("bloqueBuscadorCategorias");
const buscarCategorias = document.getElementById("buscarCategorias");
const resultadoCategorias = document.getElementById("resultadoCategorias");

const totalPalabras = document.getElementById("totalPalabras");
const totalCategorias = document.getElementById("totalCategorias");
const totalVideos = document.getElementById("totalVideos");

const panelCategorias = document.getElementById("panelCategorias");
const ultimasPalabras = document.getElementById("ultimasPalabras");
const seccionHistorial = document.getElementById("seccionHistorial");
const seccionFavoritos = document.getElementById("seccionFavoritos");
const listaHistorial = document.getElementById("listaHistorial");
const listaFavoritos = document.getElementById("listaFavoritos");

// El botón de menú "Favoritos" se fusionó con "Historial": un solo
// botón ("Historial") ahora abre ambos paneles, cada uno en su propio
// bloque independiente (primero Favoritos, luego Historial). Esta
// función centraliza el ocultarlos cuando se navega a otra sección.
function ocultarPanelesGuardados(){
    seccionHistorial.classList.add("d-none");
    if(seccionFavoritos) seccionFavoritos.classList.add("d-none");
}

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

// El botón "Buscar" (🔍, antes "Inicio") YA NO recarga la página: una
// recarga completa siempre dispara la pantalla de carga (splash), por
// más corta que sea. En su lugar, resetea la vista a la pantalla
// principal (igual que hacía "Inicio" antes de mostrar resultados) y
// deja el buscador enfocado al instante, sin ningún parpadeo/carga de
// por medio.
const btnInicio = document.getElementById("btnInicio");
if(btnInicio) {
    btnInicio.addEventListener("click", (e) => {
        e.preventDefault();
        irAlBuscador();
    });
}

// Solo en la versión de escritorio (ver detección en index.html) el
// índice alfabético debe aparecer desplegado por defecto en el Inicio,
// y colapsado (no desplegado) al entrar a "Temas orden". En móvil no
// cambia nada: sigue arrancando colapsado como antes.
function esModoEscritorioForzado(){
    return document.documentElement.classList.contains("modo-escritorio-forzado");
}

function desplegarIndiceAlfabetico(){
    if (!esModoEscritorioForzado()) return;
    const indice = document.getElementById("indiceAlfabetico");
    const btn = document.getElementById("btnToggleAbc");
    if (indice && btn && !indice.classList.contains("show")) btn.click();
}

function colapsarIndiceAlfabetico(){
    if (!esModoEscritorioForzado()) return;
    const indice = document.getElementById("indiceAlfabetico");
    const btn = document.getElementById("btnToggleAbc");
    if (indice && btn && indice.classList.contains("show")) btn.click();
}

// --- RECORDAR LA VISTA ACTUAL EN LA URL (para que un refresh no vuelva
//     siempre a Inicio) ---
// Usa replaceState (no pushState) a propósito: cambiar de "Temas orden" a
// "Herramientas" varias veces no debe ir llenando el historial del
// navegador, solo necesitamos que la URL actual refleje dónde está el
// usuario para poder restaurarlo al recargar. Cuando se muestra una
// palabra (?p=...) o se filtra por letra, esas rutas ya arman su propia
// URL desde cero (pathname + su propio parámetro), así que la vista
// guardada queda reemplazada sola sin que haga falta limpiarla a mano.
function actualizarVistaUrl(vista){
    const nuevaUrl = vista ? (window.location.pathname + "?vista=" + vista) : window.location.pathname;
    window.history.replaceState({}, '', nuevaUrl);
}

function irAlBuscador(){
    ocultarSeccionHerramientas();
    ocultarPanelesGuardados();
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    resultadoCategorias.innerHTML = "";
    ultimasPalabras.innerHTML = "";
    categoriaActualMostrada = null;
    document.body.classList.remove("vista-temas-movil");
    mostrarBloqueInicio();
    actualizarVistaUrl(null);
    desplegarIndiceAlfabetico();
    if (sugerencias) sugerencias.innerHTML = "";
    if (buscar) buscar.value = "";
    if (buscar) {
        buscar.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => buscar.focus(), 250);
    }
}

// El botón "Historial" del menú se fusionó dentro de "Temas orden":
// un solo clic ahora muestra Categorías, Favoritos e Historial juntos
// (cada uno sigue siendo su propio bloque independiente en el HTML).
document.getElementById("btnCategorias").addEventListener("click", (e) => {
    e.preventDefault();
    ocultarSeccionHerramientas();
    mostrarBloqueInicio();
    // Vista "Temas" en móvil: solo deben quedar visibles el buscador, el
    // índice A-Z, las categorías, Favoritos e Historial. La clase la lee
    // el CSS (@media max-width 1199.98px) para ocultar la seña del
    // día/ayer y el panel de Estadísticas; también aplica en escritorio.
    document.body.classList.add("vista-temas-movil");
    colapsarIndiceAlfabetico();
    // El botón "A-Z | Índice alfabético" no debe verse dentro de "Temas
    // orden" (ahí ya se navega por las tarjetas de categoría y por el
    // buscador azul de abajo): se oculta por completo, en escritorio y
    // en móvil por igual. mostrarBloqueInicio() lo vuelve a mostrar al
    // salir hacia "Buscar" (ver irAlBuscador()).
    const filaBotonIndiceTemas = document.getElementById("filaBotonIndiceAlfabetico");
    if(filaBotonIndiceTemas) filaBotonIndiceTemas.style.display = "none";
    const filaIndiceTemas = document.getElementById("filaIndiceAlfabetico");
    if(filaIndiceTemas) filaIndiceTemas.style.display = "none";
    // El buscador general (#buscar, busca en todo el diccionario) se
    // reemplaza acá por el buscador azul exclusivo de Categorías (solo
    // filtra las tarjetas por nombre). Aplica igual en escritorio y móvil.
    mostrarBuscadorDeCategorias();
    mostrarCategorias();
    mostrarPantallaHistorialYFavoritos();
    actualizarVistaUrl("temas");
    panelCategorias.scrollIntoView({ behavior: 'smooth', block: 'center' });
    panelCategorias.classList.add("highlight-anim");
    seccionFavoritos.classList.add("highlight-anim");
    seccionHistorial.classList.add("highlight-anim");
    setTimeout(() => {
        panelCategorias.classList.remove("highlight-anim");
        seccionFavoritos.classList.remove("highlight-anim");
        seccionHistorial.classList.remove("highlight-anim");
    }, 2000);
});

// --- BARRA DE NAVEGACIÓN INFERIOR (solo móvil/tablet) ---
// Cada botón de la barra de abajo solo simula el clic del enlace
// equivalente del menú de arriba (data-vinculado guarda su id), así
// que no duplicamos ninguna lógica: toda la navegación real sigue
// pasando por los mismos handlers de siempre.
document.querySelectorAll(".mbn-item").forEach(boton => {
    boton.addEventListener("click", () => {
        document.querySelectorAll(".mbn-item").forEach(b => b.classList.remove("active"));
        boton.classList.add("active");
        const idVinculado = boton.dataset.vinculado;
        const elementoOriginal = idVinculado && document.getElementById(idVinculado);
        if(elementoOriginal) elementoOriginal.click();
    });
});

// "Jugar", "Alfabetización" y "Subtítulos" ya no tienen botón propio en
// el menú: viven todos juntos, cada uno en su bloque independiente,
// dentro de "Herramientas" (ver mostrarSeccionHerramientas más abajo).
const seccionQuiz = document.getElementById("seccionQuiz");

// El acceso flotante "🎮 Jugar" ahora lleva directo a Herramientas
// (donde Jugar vive junto a Subtítulos y Alfabetización).
const btnAccesoJugar = document.getElementById("btnAccesoJugar");
if(btnAccesoJugar){
    btnAccesoJugar.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarSeccionHerramientas();
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

// --- SECCIÓN ALFABETIZACIÓN (ahora solo el módulo "Aprender") ---
// Ya no tiene botón propio en el menú: vive dentro de "Herramientas"
// (ver mostrarSeccionHerramientas más abajo), junto a Jugar y Subtítulos.
const seccionAlfabetizacion = document.getElementById("seccionAlfabetizacion");

function ocultarAlfabetizacion(){
    if(seccionAlfabetizacion) seccionAlfabetizacion.classList.add("d-none");
    // js/alfabetizacion.js (namespace AlfabetizacionV2) tiene sus propios datos desde Google Sheets.
    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.salir === "function") AlfabetizacionV2.salir();
}

// --- SECCIÓN SUBTÍTULOS EN TIEMPO REAL (independiente: micrófono + Web Speech API) ---
// Ya no tiene botón propio en el menú: vive dentro de "Herramientas"
// (ver mostrarSeccionHerramientas más abajo), junto a Jugar y Alfabetización.
const seccionSubtitulos = document.getElementById("seccionSubtitulos");

function ocultarSubtitulos(){
    if(seccionSubtitulos) seccionSubtitulos.classList.add("d-none");
    // js/subtitulos.js (namespace SubtitulosV2) apaga el micrófono al salir,
    // por privacidad, aunque el usuario no haya pulsado "Detener".
    if(window.SubtitulosV2 && typeof SubtitulosV2.salir === "function") SubtitulosV2.salir();
}

const btnSubtitulosSalir = document.getElementById("btnSubtitulosSalir");
if(btnSubtitulosSalir){
    btnSubtitulosSalir.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarSubtitulos();
        volverAlMenuHerramientasMovilSiCorresponde();
    });
}

// --- SECCIÓN "HERRAMIENTAS" (fusiona Subtítulos + Jugar + Alfabetización) ---
// A diferencia de como funcionaban antes por separado, acá los 3
// módulos se muestran TODOS a la vez, uno debajo del otro, cada uno en
// su propio bloque (<section>) para que no se confundan entre sí.
// Orden pedido: primero Subtítulos, luego Jugar, y al final Alfabetización.
const btnHerramientas = document.getElementById("btnHerramientas");
if(btnHerramientas){
    btnHerramientas.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarSeccionHerramientas();
    });
}

// Oculta y "apaga" los 3 módulos de Herramientas de una sola vez
// (se usa al salir hacia Inicio o Temas orden).
function ocultarSeccionHerramientas(){
    ocultarSubtitulos();
    ocultarQuiz();
    ocultarAlfabetizacion();
    const menuMovil = document.getElementById("herramientasMenuMovil");
    if(menuMovil) menuMovil.classList.add("d-none");
}

// Mismo punto de corte que usa el resto de la barra inferior móvil
// (ver el media query "max-width: 1199.98px" del CSS, equivalente al
// breakpoint "xl" de Bootstrap).
function esVistaMovilHerramientas(){
    // En la versión de escritorio, Herramientas también usa el selector
    // de 3 botones grandes (Subtítulos / Jugar / Alfabetización), igual
    // que en móvil, sin importar el ancho de la ventana.
    if (document.documentElement.classList.contains("modo-escritorio-forzado")) return true;
    return window.innerWidth < 1200;
}

// En móvil, "Salir" de cualquiera de los 3 módulos regresa al selector
// de botones grandes en vez de dejar la pantalla vacía. En escritorio no
// hace nada (ahí los 3 bloques siguen mostrándose juntos, como antes).
function volverAlMenuHerramientasMovilSiCorresponde(){
    if(!esVistaMovilHerramientas()) return;
    const menuMovil = document.getElementById("herramientasMenuMovil");
    if(menuMovil){
        menuMovil.classList.remove("d-none");
        menuMovil.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    actualizarVistaUrl("herramientas");
}

// Dentro de "Herramientas" no se muestra ni la seña del día, ni el
// título principal, ni el buscador, ni el botón de "Índice alfabético",
// ni el panel de Estadísticas, ni el bloque "¿Falta alguna palabra?"
// (se ven solo en Inicio/Temas orden).
function ocultarBloqueInicio(){
    const senal = document.getElementById("senalDelDia");
    if(senal) senal.style.display = "none";
    const titulo = document.getElementById("bloqueTituloPrincipal");
    if(titulo) titulo.style.display = "none";
    const bloqueBuscador = document.getElementById("bloqueBuscador");
    if(bloqueBuscador) bloqueBuscador.classList.add("d-none");
    const bloqueBuscadorCategorias = document.getElementById("bloqueBuscadorCategorias");
    if(bloqueBuscadorCategorias) bloqueBuscadorCategorias.classList.add("d-none");
    const filaBotonIndice = document.getElementById("filaBotonIndiceAlfabetico");
    if(filaBotonIndice) filaBotonIndice.style.display = "none";
    const filaIndice = document.getElementById("filaIndiceAlfabetico");
    if(filaIndice) filaIndice.style.display = "none";
    const statsPanel = document.querySelector(".stats-panel-destacado");
    if(statsPanel) statsPanel.style.display = "none";
    const sugerencias = document.getElementById("seccionSugerencias");
    if(sugerencias) sugerencias.style.display = "none";
}

function mostrarBloqueInicio(){
    const titulo = document.getElementById("bloqueTituloPrincipal");
    if(titulo) titulo.style.display = "";
    const bloqueBuscador = document.getElementById("bloqueBuscador");
    if(bloqueBuscador) bloqueBuscador.classList.remove("d-none");
    const bloqueBuscadorCategorias = document.getElementById("bloqueBuscadorCategorias");
    if(bloqueBuscadorCategorias) bloqueBuscadorCategorias.classList.add("d-none");
    const filaBotonIndice = document.getElementById("filaBotonIndiceAlfabetico");
    if(filaBotonIndice) filaBotonIndice.style.display = "";
    const filaIndice = document.getElementById("filaIndiceAlfabetico");
    if(filaIndice) filaIndice.style.display = "";
    const statsPanel = document.querySelector(".stats-panel-destacado");
    if(statsPanel) statsPanel.style.display = "";
    const sugerencias = document.getElementById("seccionSugerencias");
    if(sugerencias) sugerencias.style.display = "";
    // La seña del día no se vuelve a mostrar sola: igual que antes, una
    // vez oculta (por ejemplo al ver una palabra) solo reaparece con
    // una recarga de página real (btnInicio ya hace eso).
}

function mostrarSeccionHerramientas(){
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    resultadoCategorias.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    ocultarPanelesGuardados();
    ocultarBloqueInicio();
    document.body.classList.remove("vista-temas-movil");
    actualizarVistaUrl("herramientas");

    const menuMovil = document.getElementById("herramientasMenuMovil");

    if(esVistaMovilHerramientas() && menuMovil){
        // EN MÓVIL: primero se muestra el selector con los 3 botones
        // grandes (Subtítulos / Jugar / Alfabetización), SIN iniciar
        // ningún módulo todavía. Antes se intentaba arrancar los 3 a la
        // vez (incluyendo el micrófono de Subtítulos), y si alguno fallaba
        // al iniciar, los que venían después -como Jugar- se quedaban sin
        // cargar. Ahora cada módulo solo se inicia cuando el usuario toca
        // su botón (ver btnHerrMovilJugar y compañía más abajo).
        ocultarSubtitulos();
        ocultarQuiz();
        ocultarAlfabetizacion();
        menuMovil.classList.remove("d-none");
        menuMovil.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    // EN ESCRITORIO: se mantiene el comportamiento anterior, los 3
    // bloques se muestran juntos, uno debajo del otro.
    if(menuMovil) menuMovil.classList.add("d-none");

    // 1) Subtítulos
    if(seccionSubtitulos){
        seccionSubtitulos.classList.remove("d-none");
        try {
            if(window.SubtitulosV2 && typeof SubtitulosV2.iniciar === "function"){
                SubtitulosV2.iniciar();
            }
        } catch(err){ console.error("No se pudo iniciar Subtítulos:", err); }
    }

    // 2) Jugar
    if(seccionQuiz){
        seccionQuiz.classList.remove("d-none");
        try { mostrarMenuJuegos(); } catch(err){ console.error("No se pudo abrir Jugar:", err); }
    }

    // 3) Alfabetización
    if(seccionAlfabetizacion){
        seccionAlfabetizacion.classList.remove("d-none");
        try {
            if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.iniciar === "function"){
                AlfabetizacionV2.iniciar();
            }
        } catch(err){ console.error("No se pudo iniciar Alfabetización:", err); }
    }

    if(seccionSubtitulos) seccionSubtitulos.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- BOTONES GRANDES DEL MENÚ DE HERRAMIENTAS (solo móvil) ---
// Cada uno oculta el selector y recién ahí carga/muestra su módulo
// correspondiente, uno a la vez (nunca los 3 juntos en móvil).
const btnHerrMovilSubtitulos = document.getElementById("btnHerrMovilSubtitulos");
if(btnHerrMovilSubtitulos){
    btnHerrMovilSubtitulos.addEventListener("click", () => {
        const menuMovil = document.getElementById("herramientasMenuMovil");
        if(menuMovil) menuMovil.classList.add("d-none");
        if(seccionSubtitulos){
            seccionSubtitulos.classList.remove("d-none");
            try {
                if(window.SubtitulosV2 && typeof SubtitulosV2.iniciar === "function"){
                    SubtitulosV2.iniciar();
                }
            } catch(err){ console.error("No se pudo iniciar Subtítulos:", err); }
            seccionSubtitulos.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        actualizarVistaUrl("herramientas-subtitulos");
    });
}

const btnHerrMovilJugar = document.getElementById("btnHerrMovilJugar");
if(btnHerrMovilJugar){
    btnHerrMovilJugar.addEventListener("click", () => {
        const menuMovil = document.getElementById("herramientasMenuMovil");
        if(menuMovil) menuMovil.classList.add("d-none");
        if(seccionQuiz){
            seccionQuiz.classList.remove("d-none");
            try { mostrarMenuJuegos(); } catch(err){ console.error("No se pudo abrir Jugar:", err); }
            seccionQuiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        actualizarVistaUrl("herramientas-jugar");
    });
}

const btnHerrMovilAlfabetizacion = document.getElementById("btnHerrMovilAlfabetizacion");
if(btnHerrMovilAlfabetizacion){
    btnHerrMovilAlfabetizacion.addEventListener("click", () => {
        const menuMovil = document.getElementById("herramientasMenuMovil");
        if(menuMovil) menuMovil.classList.add("d-none");
        if(seccionAlfabetizacion){
            seccionAlfabetizacion.classList.remove("d-none");
            try {
                if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.iniciar === "function"){
                    AlfabetizacionV2.iniciar();
                }
            } catch(err){ console.error("No se pudo iniciar Alfabetización:", err); }
            seccionAlfabetizacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        actualizarVistaUrl("herramientas-alfabetizacion");
    });
}

// "Salir" de cada módulo: en móvil regresa al selector de botones
// grandes; en escritorio solo oculta ese bloque puntual (como antes).
const btnQuizSalir = document.getElementById("btnQuizSalir");
if(btnQuizSalir){
    btnQuizSalir.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarQuiz();
        volverAlMenuHerramientasMovilSiCorresponde();
    });
}

const btnAlfabSalir = document.getElementById("btnAlfabSalir");
if(btnAlfabSalir){
    btnAlfabSalir.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarAlfabetizacion();
        volverAlMenuHerramientasMovilSiCorresponde();
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
            } else {
                // Si no hay una palabra específica que restaurar, revisa si
                // el usuario estaba en "Temas orden" o "Herramientas" antes
                // del refresh (ver actualizarVistaUrl) y lo deja ahí mismo
                // en vez de mandarlo siempre a Inicio.
                const vistaEnUrl = urlParams.get("vista");
                if (vistaEnUrl === "temas") {
                    const btnCategorias = document.getElementById("btnCategorias");
                    if (btnCategorias) btnCategorias.click();
                } else if (vistaEnUrl && vistaEnUrl.indexOf("herramientas") === 0) {
                    mostrarSeccionHerramientas();
                    // Si además había un módulo puntual abierto (selector móvil /
                    // modo escritorio forzado), lo reabre tal cual estaba.
                    if (vistaEnUrl === "herramientas-subtitulos" && btnHerrMovilSubtitulos) {
                        btnHerrMovilSubtitulos.click();
                    } else if (vistaEnUrl === "herramientas-jugar" && btnHerrMovilJugar) {
                        btnHerrMovilJugar.click();
                    } else if (vistaEnUrl === "herramientas-alfabetizacion" && btnHerrMovilAlfabetizacion) {
                        btnHerrMovilAlfabetizacion.click();
                    }
                }
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
    // En escritorio el índice alfabético arranca desplegado (en móvil
    // sigue arrancando colapsado, como antes).
    desplegarIndiceAlfabetico();
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
    ocultarPanelesGuardados(); 

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

        // Video-first: miniatura de la seña junto a cada sugerencia,
        // así se reconoce visualmente antes de leer la palabra.
        const idVideoSugerencia = extraerIdYouTube(p.video);
        const miniatura = idVideoSugerencia
            ? `<div class="sugerencia-thumb-wrap">
                   <img src="https://img.youtube.com/vi/${idVideoSugerencia}/mqdefault.jpg" alt="Seña de ${p.palabra}" loading="lazy">
                   <span class="sugerencia-thumb-play">▶</span>
               </div>`
            : `<div class="sugerencia-thumb-wrap sin-video">🤟</div>`;

        boton.innerHTML=`
            <div class="sugerencia-fila">
                ${miniatura}
                <div class="sugerencia-texto">
                    ${textoMatch}
                    <span class="badge" style="font-size: 10px;">${p.categoria.trim()}</span>
                </div>
            </div>`;
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
    ocultarPanelesGuardados();
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

function mostrarPalabra(p, opciones = {}){
    // opciones.enCategorias === true  ->  este resultado viene de la vista
    // "Temas orden" (categorías): se pinta dentro de #resultadoCategorias,
    // con el botón "Atrás" arriba (incluso arriba del video), en vez de en
    // #resultado (que queda por encima del buscador de categorías y
    // provocaba que el botón "Atrás" y la lista de resultados aparecieran
    // debajo del video en vez de arriba).
    // Si la misma palabra también existe en la Hoja 2 (banco del Quiz),
    // se fusiona el resultado en vez de tratarlas por separado.
    p = fusionarConHoja2(p);
    const enCategorias = !!opciones.enCategorias;
    ocultarQuiz();
    ocultarAlfabetizacion();
    if(!enCategorias){
        buscar.value = p.palabra;
        buscar.blur();
        sugerencias.innerHTML="";
        sugerencias.style.display = "none";
        panelCategorias.innerHTML = ""; 
        categoriaActualMostrada = null;
        resultado.innerHTML = "";
    } else {
        // No tocamos el buscador principal ni las tarjetas de categoría
        // (siguen visibles arriba, igual que al buscar dentro de una
        // categoría o con el buscador de "Temas orden").
        resultado.innerHTML = "";
        ultimasPalabras.innerHTML = "";
    }
    ocultarPanelesGuardados();
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
                <span class="apoyo-panel-titulo">💡 Seña</span>
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

    const contenedorDestino = enCategorias ? resultadoCategorias : resultado;
    contenedorDestino.innerHTML = `
    ${enCategorias ? botonAtrasCategorias() : ""}
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
                    <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider text-md-start">🤟 Significado:</span>
                    <div class="reproductor-palabra-wrap shadow-sm rounded overflow-hidden border" id="reproductorPalabraWrap">
                        ${bloqueVideo}
                    </div>
                    ${bloqueControlesVideo}
                </div>
                <div class="col-lg-5 d-flex flex-column justify-content-center gap-3">
                    <div class="apoyo-panel">
                        <span class="apoyo-panel-titulo">📸 Ejemplo</span>
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
    if (!enCategorias) {
        mostrarSugerenciasRelacionadas(p);
    }
    if (hayVideo) {
        inicializarReproductorPalabra(p.video);
    } else {
        ytPlayerPalabra = null;
    }
    if (idVideoQuiz) {
        inicializarReproductorPalabraQuiz(idVideoQuiz);
    } else {
        ytPlayerPalabraQuiz = null;
    }
    if (idVideoSugerida) {
        inicializarReproductorSugerida(idVideoSugerida);
    } else {
        ytPlayerSugerida = null;
    }
    setTimeout(() => contenedorDestino.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}

// --- TARJETA SIMPLIFICADA PARA PALABRAS DE LA HOJA 2 (banco del Quiz) ---
// La Hoja 2 solo tiene palabra, video, categoría y nivel (no definición,
// imagen, variantes ni seña sugerida), así que esta es una versión
// reducida de mostrarPalabra() con lo mínimo que hay disponible.
// No toca favoritos ni historial (viven ligados a App.datos), pero SÍ
// actualiza la URL (?p=...) para que restaurarPalabraDesdeUrl() pueda
// recuperar este mismo resultado si el usuario refresca la página.
function mostrarPalabraSimplificada(p, opciones = {}){
    // opciones.enCategorias === true -> viene de "Temas orden" (categorías):
    // se pinta en #resultadoCategorias con el botón "Atrás" arriba del
    // video, y no se tocan el buscador principal ni las tarjetas de
    // categoría (ver mostrarPalabra() para la misma lógica en detalle).
    const enCategorias = !!opciones.enCategorias;
    ocultarQuiz();
    ocultarAlfabetizacion();
    if(!enCategorias){
        buscar.value = p.palabra;
        buscar.blur();
        sugerencias.innerHTML = "";
        sugerencias.style.display = "none";
        panelCategorias.innerHTML = "";
        categoriaActualMostrada = null;
        ultimasPalabras.innerHTML = "";
        resultado.innerHTML = "";
    } else {
        resultado.innerHTML = "";
        ultimasPalabras.innerHTML = "";
    }
    ocultarPanelesGuardados();
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

    const contenedorDestino = enCategorias ? resultadoCategorias : resultado;
    contenedorDestino.innerHTML = `
    ${enCategorias ? botonAtrasCategorias() : ""}
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
    setTimeout(() => contenedorDestino.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
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
    if (ytVideoIdPendienteQuiz) {
        crearReproductorPalabraQuiz(ytVideoIdPendienteQuiz);
        ytVideoIdPendienteQuiz = null;
    }
    if (ytVideoIdSugeridaPendiente) {
        crearReproductorSugerida(ytVideoIdSugeridaPendiente);
        ytVideoIdSugeridaPendiente = null;
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
    if (!wrap) return;
    wrap.style.aspectRatio = "16 / 9";

    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}&format=json`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
            const wrapActual = document.getElementById("reproductorPalabraQuizWrap");
            if (!data || !wrapActual || !data.width || !data.height) return;
            wrapActual.style.aspectRatio = `${data.width} / ${data.height}`;
        })
        .catch(() => { /* si falla la red, se mantiene el valor por defecto */ });
}

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
        }
    });
}

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
        }
    });

    btnReiniciar.addEventListener("click", () => {
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
    if (!btnPlayPause) return;
    btnPlayPause.textContent = evento.data === YT.PlayerState.PLAYING ? "⏸ Pausar" : "▶️ Reproducir";
}

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
    if (!wrap) return;
    wrap.style.aspectRatio = "16 / 9";

    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}&format=json`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
            const wrapActual = document.getElementById("reproductorSugeridaWrap");
            if (!data || !wrapActual || !data.width || !data.height) return;
            wrapActual.style.aspectRatio = `${data.width} / ${data.height}`;
        })
        .catch(() => { /* si falla la red, se mantiene el valor por defecto */ });
}

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
        }
    });
}

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
        }
    });

    btnReiniciar.addEventListener("click", () => {
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
    ocultarPanelesGuardados();
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
// Paleta de colores suaves/claros para diferenciar cada tarjeta de
// categoría a simple vista. Se repite en ciclo si hay más categorías
// que colores en la lista.
const COLORES_CATEGORIAS = [
    { fondo: "#e0f2fe", borde: "#bae6fd", texto: "#0369a1" }, // celeste
    { fondo: "#fce7f3", borde: "#fbcfe8", texto: "#be185d" }, // rosado
    { fondo: "#fef3c7", borde: "#fde68a", texto: "#b45309" }, // amarillo
    { fondo: "#dcfce7", borde: "#bbf7d0", texto: "#15803d" }, // verde
    { fondo: "#ede9fe", borde: "#ddd6fe", texto: "#6d28d9" }, // violeta
    { fondo: "#ffedd5", borde: "#fed7aa", texto: "#c2410c" }, // naranja
    { fondo: "#e0e7ff", borde: "#c7d2fe", texto: "#4338ca" }, // índigo
    { fondo: "#fee2e2", borde: "#fecaca", texto: "#b91c1c" }, // rojo suave
    { fondo: "#ccfbf1", borde: "#99f6e4", texto: "#0f766e" }, // turquesa
];

function mostrarCategorias(){
    resultado.innerHTML=""; panelCategorias.innerHTML=""; ultimasPalabras.innerHTML = ""; ocultarPanelesGuardados();
    if (window.QuizV2 && typeof QuizV2.asegurarBancoCargado === "function") {
        QuizV2.asegurarBancoCargado();
    }
    const datosUnificados = obtenerDatosUnificados();
    const categories = [...new Set(datosUnificados.map(p => p.categoria.trim()))].sort();
    categories.forEach((nombre, indice)=>{
        const cantidad = datosUnificados.filter(p => p.categoria.trim() === nombre).length;
        const color = COLORES_CATEGORIAS[indice % COLORES_CATEGORIAS.length];
        const card = document.createElement("div");
        card.className = "col-6 col-md-3 animate-fade-in";
        card.innerHTML = `<div class="card h-100 shadow-sm categoria-card" style="border-radius: 16px; border: 2px solid ${color.borde}; background-color: ${color.fondo};"><div class="card-body text-center py-4"><h5 class="mb-2 fw-bold" style="color: ${color.texto}; font-size: 1.25rem;">${nombre}</h5><p class="mb-0 fw-semibold" style="color: ${color.texto}; opacity: 0.85; font-size: 1rem;">${cantidad} palabras</p></div></div>`;
        card.onclick = () => mostrarCategoria(nombre);
        panelCategorias.appendChild(card);
    });
    categoriaActualMostrada = null;
}

// --- BUSCADOR EXCLUSIVO DE "TEMAS ORDEN" ---
// Reemplaza al buscador general (#buscar) mientras esta vista está
// activa, en escritorio y en móvil por igual. Busca dentro del CONTENIDO
// de las categorías (palabras reales: Cortesía, Educación, Saludos,
// Verbos y las que se agreguen a futuro), no solo el nombre de la
// categoría. Los resultados (o la categoría elegida al tocar una
// tarjeta) se pintan en #resultadoCategorias, que queda debajo del
// buscador Y debajo de las tarjetas de categoría, con un botón "Atrás"
// para volver a la vista limpia de tarjetas.
function mostrarBuscadorDeCategorias(){
    if(bloqueBuscador) bloqueBuscador.classList.add("d-none");
    if(bloqueBuscadorCategorias) bloqueBuscadorCategorias.classList.remove("d-none");
    limpiarResultadoCategorias();
}

if(buscarCategorias){
    buscarCategorias.addEventListener("input", buscarEnCategorias);
}

function botonAtrasCategorias(){
    return `<button type="button" class="btn btn-sm btn-outline-primary fw-bold mb-3" onclick="limpiarResultadoCategorias()">⬅ Atrás</button>`;
}

// Limpia la búsqueda/categoría seleccionada y deja solo las tarjetas de
// categoría visibles (usado por el botón "Atrás" y al entrar de nuevo a
// "Temas orden").
function limpiarResultadoCategorias(){
    if(resultadoCategorias) resultadoCategorias.innerHTML = "";
    if(buscarCategorias) buscarCategorias.value = "";
    categoriaActualMostrada = null;
}
window.limpiarResultadoCategorias = limpiarResultadoCategorias;

function buscarEnCategorias(){
    if(!resultadoCategorias || !buscarCategorias) return;
    const textoOriginal = buscarCategorias.value.trim();
    const texto = textoOriginal.toLowerCase();
    categoriaActualMostrada = null;
    if(!texto){
        resultadoCategorias.innerHTML = "";
        return;
    }
    const coincidencias = obtenerDatosUnificados().filter(p => p.palabra.toLowerCase().includes(texto));
    if(coincidencias.length === 0){
        resultadoCategorias.innerHTML = botonAtrasCategorias() +
            `<div class="alert alert-light border text-center text-muted small py-3" style="border-radius: 12px;">No hay palabras que coincidan con "${textoOriginal}".</div>`;
        return;
    }
    let html = botonAtrasCategorias() +
        `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Resultados para "${textoOriginal}"</h6>`;
    coincidencias.forEach(p => {
        const badgeQuiz = p._soloQuiz ? ` <span class="badge bg-warning text-dark ms-1" style="font-size: 10px;">🎮 Quiz</span>` : "";
        html += `<div class="card mb-2 palabra-card shadow-sm animate-fade-in" style="border-radius: 10px;"><div class="card-body p-2 d-flex justify-content-between align-items-center"><div><h6 class="mb-0 fw-bold text-primary">${p.palabra}${badgeQuiz}</h6><small class="text-muted">${p.categoria.trim()}</small></div><button class="btn btn-sm btn-primary py-1 px-3 fw-bold" onclick="mostrarPalabraPorNombreUnificado('${p.palabra.replace(/'/g, "\\'")}')">Ver Seña</button></div></div>`;
    });
    resultadoCategorias.innerHTML = html;
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
    if(buscarCategorias) buscarCategorias.value = "";
    let html = botonAtrasCategorias() + `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Categoría: ${nombre}</h6>`;
    obtenerDatosUnificados().filter(p => p.categoria.trim() === nombre).forEach(p=>{
        const badgeQuiz = p._soloQuiz ? ` <span class="badge bg-warning text-dark ms-1" style="font-size: 10px;">🎮 Quiz</span>` : "";
        html += `<div class="card mb-2 palabra-card shadow-sm animate-fade-in" style="border-radius: 10px;"><div class="card-body p-2 d-flex justify-content-between align-items-center"><div><h6 class="mb-0 fw-bold text-primary">${p.palabra}${badgeQuiz}</h6></div><button class="btn btn-sm btn-primary py-1 px-3 fw-bold" onclick="mostrarPalabraPorNombreUnificado('${p.palabra.replace(/'/g, "\\'")}')">Ver Seña</button></div></div>`;
    });
    resultadoCategorias.innerHTML = html;
}

// Igual que mostrarPalabraPorNombre(), pero también busca en el banco
// del Quiz (Hoja 2) cuando la palabra no está en el diccionario principal.
function mostrarPalabraPorNombreUnificado(nombre){
    const enHoja1 = App.datos.find(p => p.palabra.toLowerCase() === nombre.toLowerCase());
    if(enHoja1){ mostrarPalabra(enHoja1, { enCategorias: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const enHoja2 = obtenerBancoHoja2().find(p => p.palabra && p.palabra.toLowerCase() === nombre.toLowerCase());
    if(enHoja2){ mostrarPalabraSimplificada(enHoja2, { enCategorias: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
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
function mostrarPantallaHistorialYFavoritos(){
    // Primero Favoritos, luego Historial — mismo orden en que aparecen
    // los bloques en el HTML. Cada uno sigue siendo un bloque
    // independiente (su propio <section>), solo comparten el botón
    // de menú que los abre.
    if(seccionFavoritos) seccionFavoritos.classList.remove("d-none");
    mostrarFavoritos();
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