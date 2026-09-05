// El navegador (Chrome sobre todo) recuerda por su cuenta la posición de
// scroll de cada entrada del historial y la vuelve a aplicar solo al
// recargar la página, incluso si el JS de acá nunca pidió ese scroll.
// Eso es justo lo que seguía cortando el encabezado de "Vocabulario" al
// entrar directo por "?vista=vocabulario": el scroll automático del
// propio navegador ganaba por encima del window.scrollTo({top:0}) de
// abajo. Con "manual" apagamos esa restauración automática, y dejamos
// que sea siempre nuestro propio código (más abajo) el que decida dónde
// arranca la página.
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

const buscar = document.getElementById("buscar");
const btnBuscar = document.getElementById("btnBuscar");
const sugerencias = document.getElementById("sugerencias");
const resultado = document.getElementById("resultado");

const bloqueBuscador = document.getElementById("bloqueBuscador");
const bloqueBuscadorCategorias = document.getElementById("bloqueBuscadorCategorias");
const buscarCategorias = document.getElementById("buscarCategorias");
const sugerenciasCategorias = document.getElementById("sugerenciasCategorias");
const resultadoCategorias = document.getElementById("resultadoCategorias");

const totalPalabras = document.getElementById("totalPalabras");
const totalCategorias = document.getElementById("totalCategorias");
const totalVideos = document.getElementById("totalVideos");

const panelCategorias = document.getElementById("panelCategorias");
const ultimasPalabras = document.getElementById("ultimasPalabras");
const ultimasPalabrasCategorias = document.getElementById("ultimasPalabrasCategorias");
const seccionHistorial = document.getElementById("seccionHistorial");
const seccionFavoritos = document.getElementById("seccionFavoritos");
const listaHistorial = document.getElementById("listaHistorial");
const listaFavoritos = document.getElementById("listaFavoritos");

// Convierte el texto plano de la definición (tal como se escribe en el
// Google Sheet) a HTML seguro para mostrar en la ficha de la palabra:
//   - Escapa cualquier HTML que venga en el texto (evita romper el layout
//     o inyectar markup si alguien pega algo raro en el Sheet).
//   - *texto* -> <strong>texto</strong> (negrita simple estilo markdown).
//   - Saltos de línea reales -> <br> (para que los \n del Sheet se vean).
// Uso: en el <p> de la ficha con innerHTML, NUNCA insertar p.definicion
// directo; siempre pasar por acá.
function formatearDefinicion(texto){
    if (!texto) return "";

    const div = document.createElement("div");
    div.textContent = texto;
    let seguro = div.innerHTML; // texto ya escapado (sin HTML real)

    seguro = seguro.replace(/\*(.+?)\*/g, "<strong>$1</strong>");
    seguro = seguro.replace(/\n/g, "<br>");

    return seguro;
}

// Versión para mostrar la definición como texto plano corto (ej. tarjeta
// "Seña del día", que usa textContent y no debe llevar HTML). Solo quita
// los asteriscos y cambia saltos de línea por espacio, sin generar <strong>.
function limpiarDefinicionTextoPlano(texto){
    if (!texto) return "";
    return texto.replace(/\*/g, "").replace(/\n+/g, " ").trim();
}

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

// El título y subtítulo de arriba del todo cambian según la vista:
// "Diccionario" (buscador general) usa el texto original, y
// "Vocabulario" (tarjetas de categorías) usa un texto propio, más
// acorde a esa sección. La primera palabra ("Diccionario" / "Vocabulario")
// va envuelta en <span class="titulo-acento"> para que se vea en azul,
// igual que en el diseño de referencia; el resto del título queda en el
// color normal (oscuro).
const TITULOS_PRINCIPALES = {
    diccionario: {
        titulo: '<span class="titulo-acento">Diccionario</span> de Lengua de Señas Peruana (LSP) y Español',
        subtitulo: "Aprende el significado de las palabras con el apoyo de videos en señas."
    },
    vocabulario: {
        titulo: '<span class="titulo-acento">Vocabulario</span> de Lengua de Señas Peruana (LSP)',
        subtitulo: "Las señas representan conceptos, no siempre palabras. Los términos en español son solo una referencia para facilitar la búsqueda y el aprendizaje. Las variantes regionales enriquecen la Lengua de Señas Peruana."
    }
};

function actualizarTituloPrincipal(vista){
    const datos = TITULOS_PRINCIPALES[vista];
    if(!datos) return;
    const titulo = document.getElementById("tituloPrincipal");
    const subtitulo = document.getElementById("subtituloPrincipal");
    const listaVocab = document.getElementById("vocabularioIntroLista");
    // innerHTML (no textContent): así se conserva el <span class="titulo-acento">
    // que colorea la primera palabra en cada vista.
    if(titulo) titulo.innerHTML = datos.titulo;
    const esVocabulario = vista === "vocabulario";
    // En Vocabulario, la lista con íconos (arriba, en el HTML) reemplaza
    // al párrafo simple del subtítulo; en Diccionario es al revés.
    if(subtitulo) subtitulo.classList.toggle("d-none", esVocabulario);
    if(listaVocab) listaVocab.classList.toggle("d-none", !esVocabulario);
    if(subtitulo && !esVocabulario) subtitulo.textContent = datos.subtitulo;
}

// Marca cuál botón del menú superior (escritorio) está activo, quitando
// la clase de los demás. Antes esta clase solo existía de entrada en
// "Diccionario" (hardcodeada en el HTML) y nunca se actualizaba al
// navegar, por eso el subrayado ámbar (CSS ::after sobre .active) se
// quedaba siempre fijo ahí. Se llama desde cada sección (Diccionario,
// Vocabulario, Herramientas, Sobre Nosotros) para que el subrayado se
// mueva junto con la navegación real.
function activarBotonMenu(idActivo){
    document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
        link.classList.toggle("active", link.id === idActivo);
    });
    // La barra de navegación inferior (solo móvil/tablet) tiene sus
    // propios botones (.mbn-item), separados de los del menú de arriba,
    // y cada uno apunta al enlace real mediante data-vinculado. Antes
    // solo se sincronizaban cuando el usuario tocaba un .mbn-item
    // directamente (ver el addEventListener más abajo); si la sección
    // se activaba de otra forma —como al restaurar "Vocabulario" tras un
    // refresco de página, que simula el clic del enlace de arriba en vez
    // del botón de abajo— el botón inferior "Diccionario" se quedaba
    // marcado como activo por error, mezclándose con la sección real
    // (Vocabulario) que se estaba mostrando. Ahora, cada vez que se
    // marca un enlace del menú como activo, la barra inferior se
    // actualiza igual, venga de donde venga la navegación.
    document.querySelectorAll(".mbn-item").forEach((boton) => {
        boton.classList.toggle("active", boton.dataset.vinculado === idActivo);
    });
}

function irAlBuscador(){
    ocultarSeccionHerramientas();
    ocultarSeccionNosotros();
    ocultarPanelesGuardados();
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    resultadoCategorias.innerHTML = "";
    resultadoCategoriasDiccionario.innerHTML = "";
    ultimasPalabras.innerHTML = "";
    // Mismo bug que en mostrarSeccionHerramientas()/mostrarSeccionNosotros():
    // faltaba limpiar #ultimasPalabrasCategorias (las sugerencias "Puede que
    // también te interese" de la vista Vocabulario), así que se quedaban
    // visibles al volver al Diccionario.
    if(ultimasPalabrasCategorias) ultimasPalabrasCategorias.innerHTML = "";
    categoriaActualMostrada = null;
    document.body.classList.remove("vista-temas-movil");
    mostrarBloqueInicio();
    mostrarSenalDelDia();
    actualizarTituloPrincipal("diccionario");
    activarBotonMenu("btnInicio");
    actualizarVistaUrl(null);
    desplegarIndiceAlfabetico();
    if (sugerencias) sugerencias.innerHTML = "";
    if (buscar) buscar.value = "";
    if (buscar) {
        buscar.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => buscar.focus(), 250);
    }
}

// Cuando "Vocabulario" se abre solo (sin que la persona haya tocado el
// botón), como al cargar la página directo en "?vista=vocabulario", no
// queremos el scroll automático que centra el panel de categorías: eso
// dejaba la pantalla a mitad de camino, con el encabezado ("Vocabulario
// de Lengua de Señas Peruana") y parte de las tarjetas cortados fuera de
// vista (ver captura reportada). En cambio, cuando la persona SÍ toca el
// botón del menú, ese scroll ayuda a llevarla directo al contenido. Esta
// bandera distingue ambos casos: se activa justo antes de simular el
// clic durante la restauración inicial y el handler la apaga después de
// leerla.
let saltarScrollAlAbrirVocabulario = false;

// El botón "Historial" del menú se fusionó dentro de "Temas orden":
// un solo clic ahora muestra Categorías, Favoritos e Historial juntos
// (cada uno sigue siendo su propio bloque independiente en el HTML).
document.getElementById("btnCategorias").addEventListener("click", (e) => {
    e.preventDefault();
    ocultarSeccionHerramientas();
    ocultarSeccionNosotros();
    mostrarBloqueInicio();
    actualizarTituloPrincipal("vocabulario");
    activarBotonMenu("btnCategorias");
    // Vista "Temas" en móvil: solo deben quedar visibles el buscador, el
    // índice A-Z, las categorías, Favoritos e Historial. La clase la lee
    // el CSS (@media max-width 1199.98px) para ocultar la seña del
    // día/ayer y el panel de Estadísticas; también aplica en escritorio.
    document.body.classList.add("vista-temas-movil");
    // Los 3 bloques de arriba (seña del día, cabecera de stats y panel de
    // stats) solo se ocultaban vía CSS con la clase "vista-temas-movil"
    // dentro de "@media (max-width: 1199.98px)". En escritorio ancho
    // (>=1200px) esa regla no aplica y nada más los tapaba, así que
    // mostrarBloqueInicio() los volvía a mostrar sin condición y
    // descuadraban el layout de tarjetas de Vocabulario/Temas (bug
    // reportado: la tarjeta reaparecía arriba de las categorías en
    // escritorio). Se ocultan acá explícitamente, sin depender del ancho
    // de pantalla, igual que ya se hace más abajo con el índice A-Z.
    const senalTemas = document.getElementById("senalDelDia");
    if (senalTemas) senalTemas.style.display = "none";
    const statsHeaderTemas = document.querySelector(".stats-header");
    if (statsHeaderTemas) statsHeaderTemas.style.display = "none";
    const statsPanelTemas = document.querySelector(".stats-panel-destacado");
    if (statsPanelTemas) statsPanelTemas.style.display = "none";
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
    const filaCategoriasDiccTemas = document.getElementById("filaCategoriasDiccionario");
    if(filaCategoriasDiccTemas) filaCategoriasDiccTemas.style.display = "none";
    // Los chips "Ejemplos: Hola, Gracias..." pertenecen solo al Diccionario:
    // en Vocabulario no deben aparecer, para no mezclar ambas secciones.
    const bloqueEjemplosTemas = document.getElementById("bloqueEjemplos");
    if(bloqueEjemplosTemas) bloqueEjemplosTemas.style.display = "none";
    // El buscador general (#buscar, busca en todo el diccionario) se
    // reemplaza acá por el buscador azul exclusivo de Categorías (solo
    // filtra las tarjetas por nombre). Aplica igual en escritorio y móvil.
    mostrarBuscadorDeCategorias();
    mostrarCategorias();
    mostrarPantallaHistorialYFavoritos();
    actualizarVistaUrl("vocabulario");
    if (saltarScrollAlAbrirVocabulario) {
        // Carga directa en "?vista=vocabulario": se deja la pantalla arriba
        // del todo, como una visita normal a la página, en vez de saltar a
        // mitad de camino.
        saltarScrollAlAbrirVocabulario = false;
        // Antes este scrollTo(top:0) se disparaba una sola vez y de
        // inmediato. En ese momento el avatar del héroe y las tarjetas de
        // categoría todavía se están acomodando (animación de entrada por
        // IntersectionObserver, imágenes/fuentes terminando de cargar), así
        // que el alto del documento sigue cambiando justo después: el
        // "scroll anchoring" del navegador compensa ese cambio arriba del
        // scroll y termina arrastrando la pantalla de nuevo a mitad de
        // camino (el "cortado" reportado). Se reutiliza la misma estrategia
        // de espera + vigilancia que ya usa scrollAlPrimerResultado(), pero
        // apuntando al techo de la página (top:0) en vez de a un elemento.
        scrollArribaEstable();
    } else {
        panelCategorias.scrollIntoView({ behavior: 'smooth', block: 'center' });
        panelCategorias.classList.add("highlight-anim");
        seccionFavoritos.classList.add("highlight-anim");
        seccionHistorial.classList.add("highlight-anim");
        setTimeout(() => {
            panelCategorias.classList.remove("highlight-anim");
            seccionFavoritos.classList.remove("highlight-anim");
            seccionHistorial.classList.remove("highlight-anim");
        }, 2000);
    }
});

// --- BARRA DE NAVEGACIÓN INFERIOR (solo móvil/tablet) ---
// Cada botón de la barra de abajo solo simula el clic del enlace
// equivalente del menú de arriba (data-vinculado guarda su id), así
// que no duplicamos ninguna lógica: toda la navegación real sigue
// pasando por los mismos handlers de siempre.
document.querySelectorAll(".mbn-item").forEach(boton => {
    boton.addEventListener("click", () => {
        const idVinculado = boton.dataset.vinculado;
        document.querySelectorAll(".mbn-item").forEach(b => b.classList.remove("active"));
        boton.classList.add("active");
        const elementoOriginal = idVinculado && document.getElementById(idVinculado);
        if(elementoOriginal) elementoOriginal.click();
    });
});

// "Jugar", "Alfabetización" y "Subtítulos" ya no tienen botón propio en
// el menú: viven todos juntos, cada uno en su bloque independiente,
// dentro de "Herramientas" (ver mostrarSeccionHerramientas más abajo).
const seccionQuiz = document.getElementById("seccionQuiz");

// El acceso flotante "🎮 Jugar" lleva directo a la sección Jugar (el
// menú con "Completar la palabra", "Unir con flechas" y "Quiz"),
// saltándose el selector de Herramientas (ver abrirJugarDirecto más abajo).
const btnAccesoJugar = document.getElementById("btnAccesoJugar");
if(btnAccesoJugar){
    btnAccesoJugar.addEventListener("click", (e) => {
        e.preventDefault();
        abrirJugarDirecto();
    });
}

// --- PANTALLA COMPLETA DE LA SECCIÓN "JUGAR" (compartida por TODOS los
// juegos: Quiz, Completar la palabra, Unir con flechas y Matemáticas) ---
// El botón #btnQuizFullscreen vive en el encabezado de #seccionQuiz, por
// fuera de cada juego individual, así que su lógica no puede depender de
// qué módulo (QuizV2, AlfabetizacionV2, MatematicasV2) esté activo en ese
// momento: antes vivía solo dentro de js/quiz.js y por eso el botón no
// hacía nada si se entraba a otro juego sin haber abierto el Quiz primero.
let jugarPantallaCompletaActiva = false;
let jugarTimeoutAvisoFullscreen = null;

function jugarElementoPantallaCompletaActivo(){
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

function jugarActualizarIconoPantallaCompleta(){
    const btn = document.getElementById("btnQuizFullscreen");
    if(btn) btn.textContent = jugarPantallaCompletaActiva ? "⤢" : "⛶";
}

// Al entrar a la pantalla completa NATIVA (no la simulada), Chrome en
// Android muestra unos segundos su propio aviso pegado a la parte de
// abajo de la pantalla, que puede tapar botones al fondo de la tarjeta.
// Mientras dura ese aviso, le damos un margen extra abajo a la sección.
function jugarAplicarEspacioAvisoNativoFullscreen(seccion, activo){
    if(!seccion) return;
    clearTimeout(jugarTimeoutAvisoFullscreen);
    if(activo){
        seccion.style.paddingBottom = "110px";
        jugarTimeoutAvisoFullscreen = setTimeout(() => { seccion.style.paddingBottom = ""; }, 3500);
    } else {
        seccion.style.paddingBottom = "";
    }
}

// Alternativa para navegadores que no soportan pantalla completa en este
// elemento (por ejemplo, Safari en iOS): simulamos el efecto con estilos
// a pantalla completa dentro de la propia página.
function jugarActivarPantallaCompletaSimulada(){
    const seccion = document.getElementById("seccionQuiz");
    if(!seccion) return;
    jugarPantallaCompletaActiva = true;
    seccion.classList.add("quiz-fullscreen");
    jugarActualizarIconoPantallaCompleta();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function alternarPantallaCompletaJugar(){
    const seccion = document.getElementById("seccionQuiz");
    if(!seccion) return;

    // Si ya estamos en pantalla completa (real o simulada), salimos.
    if(jugarElementoPantallaCompletaActivo() || jugarPantallaCompletaActiva){
        const salirFn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if(jugarElementoPantallaCompletaActivo() && salirFn){
            salirFn.call(document);
        } else {
            jugarPantallaCompletaActiva = false;
            seccion.classList.remove("quiz-fullscreen");
            jugarActualizarIconoPantallaCompleta();
        }
        return;
    }

    // Intentamos la API real de pantalla completa del navegador.
    const solicitarFn = seccion.requestFullscreen || seccion.webkitRequestFullscreen || seccion.msRequestFullscreen;
    if(solicitarFn){
        Promise.resolve(solicitarFn.call(seccion)).catch(jugarActivarPantallaCompletaSimulada);
    } else {
        jugarActivarPantallaCompletaSimulada();
    }
}

// Mantiene el ícono y el estado sincronizados si el usuario sale de
// pantalla completa con Esc, el gesto del navegador, etc.
function jugarManejarCambioPantallaCompleta(){
    const seccion = document.getElementById("seccionQuiz");
    const activo = !!jugarElementoPantallaCompletaActivo();
    jugarPantallaCompletaActiva = activo;
    if(seccion) seccion.classList.toggle("quiz-fullscreen", activo);
    jugarActualizarIconoPantallaCompleta();
    jugarAplicarEspacioAvisoNativoFullscreen(seccion, activo);
}

// Se llama al volver al menú de juegos o al cerrar toda la sección
// Jugar, sin importar qué módulo estuviera activo.
function salirDePantallaCompletaJugar(){
    if(jugarPantallaCompletaActiva || jugarElementoPantallaCompletaActivo()) alternarPantallaCompletaJugar();
}

const btnQuizFullscreen = document.getElementById("btnQuizFullscreen");
if(btnQuizFullscreen) btnQuizFullscreen.addEventListener("click", alternarPantallaCompletaJugar);

["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((evt) => {
    document.addEventListener(evt, jugarManejarCambioPantallaCompleta);
});

// --- PANTALLAS DENTRO DE "JUGAR" ---
// La sección Jugar ahora arranca siempre en un menú (#quizMenuJuegos)
// para elegir "Completar la palabra", "Unir con flechas" o "Quiz".
// Los dos primeros juegos viven en js/alfabetizacion.js (AlfabetizacionV2)
// y el Quiz en js/quiz.js (QuizV2); esta lista cubre TODAS las pantallas
// posibles dentro de #seccionQuiz para poder ocultarlas de una sola vez
// antes de mostrar la que corresponde, sin importar de qué módulo venga.
const PANTALLAS_SECCION_JUEGOS = [
    "quizMenuJuegos", "quizCargando", "quizIntro", "quizActivo", "quizMemoria", "quizResultados",
    "alfabCompletar", "alfabUnir", "alfabResultados", "matApp"
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
    if(id === "quizMenuJuegos") reproducirAnimacionMenuJuegos();
}

// Reinicia la animación de entrada en cascada de las 4 tarjetas del
// menú "¿A qué quieres jugar?" cada vez que se muestra (no solo la
// primera vez): quitamos y volvemos a poner la clase forzando un
// reflow en el medio, porque solo re-agregar la misma clase no
// reinicia una animación CSS ya terminada.
function reproducirAnimacionMenuJuegos(){
    document.querySelectorAll("#quizMenuJuegos .menu-juego-col").forEach((col) => {
        col.classList.remove("menu-juego-anim");
        void col.offsetWidth;
        col.classList.add("menu-juego-anim");
    });
}

function mostrarMenuJuegos(){
    if(window.QuizV2 && typeof QuizV2.salir === "function") QuizV2.salir();
    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.detenerJuegosActivos === "function") AlfabetizacionV2.detenerJuegosActivos();
    if(window.MatematicasV2 && typeof MatematicasV2.salir === "function") MatematicasV2.salir();
    salirDePantallaCompletaJugar();
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

function abrirJuegoMatematicas(){
    mostrarPantallaJuegos("matApp");
    if(window.MatematicasV2 && typeof MatematicasV2.iniciar === "function") MatematicasV2.iniciar();
}

const btnMenuJuegoCompletar = document.getElementById("btnMenuJuegoCompletar");
if(btnMenuJuegoCompletar) btnMenuJuegoCompletar.addEventListener("click", abrirJuegoCompletar);

const btnMenuJuegoUnir = document.getElementById("btnMenuJuegoUnir");
if(btnMenuJuegoUnir) btnMenuJuegoUnir.addEventListener("click", abrirJuegoUnir);

const btnMenuJuegoQuiz = document.getElementById("btnMenuJuegoQuiz");
if(btnMenuJuegoQuiz) btnMenuJuegoQuiz.addEventListener("click", abrirJuegoQuiz);

const btnMenuJuegoMatematicas = document.getElementById("btnMenuJuegoMatematicas");
if(btnMenuJuegoMatematicas) btnMenuJuegoMatematicas.addEventListener("click", abrirJuegoMatematicas);

document.querySelectorAll(".btn-volver-menu-juegos").forEach((btn) => {
    btn.addEventListener("click", mostrarMenuJuegos);
});

function ocultarQuiz(){
    if(seccionQuiz) seccionQuiz.classList.add("d-none");
    // El Quiz ahora es independiente (QuizV2) y tiene sus propios datos desde Google Sheets.
    if(window.QuizV2 && typeof QuizV2.salir === "function") QuizV2.salir();
    // "Completar la palabra" y "Unir con flechas" (AlfabetizacionV2) también viven aquí ahora.
    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.detenerJuegosActivos === "function") AlfabetizacionV2.detenerJuegosActivos();
    // "Matemáticas Visuales" (MatematicasV2) también vive aquí.
    if(window.MatematicasV2 && typeof MatematicasV2.salir === "function") MatematicasV2.salir();
    salirDePantallaCompletaJugar();
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
        activarBotonMenu("btnHerramientas");
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
    // Celular/tablet real (ver el script que agrega "modo-movil-real" en
    // index.html): siempre debe verse el selector de 3 botones grandes,
    // incluso en horizontal, aunque en ese momento el ancho de la
    // ventana llegue a superar los 1200px (antes, en tablets grandes
    // horizontales, esto hacía que Herramientas abriera directo en
    // Subtítulos en vez de mostrar el selector).
    if (document.documentElement.classList.contains("modo-movil-real")) return true;
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
    const filaCategoriasDicc = document.getElementById("filaCategoriasDiccionario");
    if(filaCategoriasDicc) filaCategoriasDicc.style.display = "none";
    const statsPanel = document.querySelector(".stats-panel-destacado");
    if(statsPanel) statsPanel.style.display = "none";
    const sugerencias = document.getElementById("seccionSugerencias");
    if(sugerencias) sugerencias.style.display = "none";
    const bloqueEjemplosInicio = document.getElementById("bloqueEjemplos");
    if(bloqueEjemplosInicio) bloqueEjemplosInicio.style.display = "none";
    // El avatar y la cabecera "ESTADÍSTICAS | LSPedia" solo deben verse en
    // Diccionario y Vocabulario, no en Herramientas ni en Sobre Nosotros.
    const colAvatarHero = document.getElementById("colAvatarHero");
    if(colAvatarHero) colAvatarHero.classList.add("oculto-por-seccion");
    const statsHeader = document.querySelector(".stats-header");
    if(statsHeader) statsHeader.style.display = "none";
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
    const filaCategoriasDicc = document.getElementById("filaCategoriasDiccionario");
    if(filaCategoriasDicc) filaCategoriasDicc.style.display = "";
    const statsPanel = document.querySelector(".stats-panel-destacado");
    if(statsPanel) statsPanel.style.display = "";
    const sugerencias = document.getElementById("seccionSugerencias");
    if(sugerencias) sugerencias.style.display = "";
    const bloqueEjemplosInicio = document.getElementById("bloqueEjemplos");
    if(bloqueEjemplosInicio) bloqueEjemplosInicio.style.display = "";
    const colAvatarHero = document.getElementById("colAvatarHero");
    if(colAvatarHero) colAvatarHero.classList.remove("oculto-por-seccion");
    const statsHeader = document.querySelector(".stats-header");
    if(statsHeader) statsHeader.style.display = "";
    // La seña del día se vuelve a mostrar junto con el resto del bloque
    // de inicio (antes se quedaba oculta para siempre tras la primera
    // vez que se entraba a Vocabulario/Herramientas/Nosotros, porque
    // ocultarBloqueInicio() la ocultaba pero nadie la revertía).
    const senal = document.getElementById("senalDelDia");
    if(senal) senal.style.display = "";
}

function mostrarSeccionHerramientas(){
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    resultadoCategorias.innerHTML = "";
    resultadoCategoriasDiccionario.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    // Bug: faltaba limpiar también #ultimasPalabrasCategorias (donde se
    // pintan las tarjetas de "Puede que también te interese" cuando se
    // abrió una palabra desde la vista Categorías). Sin esto, ese panel
    // se quedaba visible al pasar a Herramientas, aunque no tenga nada
    // que ver con esta sección.
    if(ultimasPalabrasCategorias) ultimasPalabrasCategorias.innerHTML = "";
    ocultarPanelesGuardados();
    ocultarBloqueInicio();
    ocultarSeccionNosotros();
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

        // Precarga en segundo plano de "Alfabeto y números": a diferencia
        // de Subtítulos (pide permiso de micrófono) y Jugar (solo abre un
        // menú, no tiene datos que descargar), Alfabetización sí depende
        // de un fetch a Google Sheets que puede tardar. Se llama a
        // iniciar() ya mismo, con #seccionAlfabetizacion todavía en
        // "d-none" (oculto), para que cargarDatos()/cambiarModulo() dejen
        // el bloque "Aprender" listo y pintado por dentro sin que se vea
        // nada en pantalla. Así, cuando el usuario toca la tarjeta
        // "Alfabeto y números", btnHerrMovilAlfabetizacion solo necesita
        // destaparlo (ya no hay que esperar la carga en ese momento).
        try {
            if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.iniciar === "function"){
                AlfabetizacionV2.iniciar();
            }
        } catch(err){ console.error("No se pudo precargar Alfabetización:", err); }

        // Precarga (o "asegura") en segundo plano el banco de preguntas
        // del Quiz: aunque QuizV2 ya se precarga solo apenas carga la
        // página, en una conexión lenta esa primera precarga puede seguir
        // en camino (o haber fallado) para cuando el usuario llega hasta
        // acá. asegurarBancoCargado() es seguro de llamar las veces que
        // haga falta: no dispara una petición nueva si ya hay una en
        // curso o si el banco ya tiene datos, así que apenas el usuario
        // toca la tarjeta "Jugar" → "Quiz", lo más probable es que las
        // preguntas ya estén listas en vez de tener que esperar a que
        // arranque recién en ese momento.
        try {
            if(window.QuizV2 && typeof QuizV2.asegurarBancoCargado === "function"){
                QuizV2.asegurarBancoCargado();
            }
        } catch(err){ console.error("No se pudo precargar el Quiz:", err); }

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
        // Mismo motivo que en la rama móvil de más arriba: nos aseguramos
        // de que el banco de preguntas del Quiz esté cargado (o en camino)
        // sin duplicar peticiones.
        try {
            if(window.QuizV2 && typeof QuizV2.asegurarBancoCargado === "function"){
                QuizV2.asegurarBancoCargado();
            }
        } catch(err){ console.error("No se pudo precargar el Quiz:", err); }
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

// --- SECCIÓN "SOBRE NOSOTROS" (reemplaza el antiguo modal) ---
function ocultarSeccionNosotros(){
    const seccion = document.getElementById("seccionNosotros");
    if(seccion) seccion.classList.add("d-none");
    if(nosotrosPantallaCompletaActiva) toggleNosotrosPantallaCompleta(true);
    if(ytPlayerNosotros && typeof ytPlayerNosotros.pauseVideo === "function") ytPlayerNosotros.pauseVideo();
}

function mostrarSeccionNosotros(){
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    resultadoCategorias.innerHTML = "";
    resultadoCategoriasDiccionario.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    // Mismo bug que en mostrarSeccionHerramientas(): faltaba limpiar
    // #ultimasPalabrasCategorias.
    if(ultimasPalabrasCategorias) ultimasPalabrasCategorias.innerHTML = "";
    ocultarPanelesGuardados();
    ocultarSeccionHerramientas();
    ocultarBloqueInicio();
    document.body.classList.remove("vista-temas-movil");
    actualizarVistaUrl("nosotros");

    const seccion = document.getElementById("seccionNosotros");
    if(seccion){
        seccion.classList.remove("d-none");
        seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // El texto arranca justo debajo del video (que ahora "flota" fijo
    // sobre la página, ver .nosotros-video-wrap.nosotros-fijo en el
    // CSS). Como el alto real del video+leyenda+controles varía según
    // el ancho de pantalla, se mide después de que el layout se asiente
    // (por eso el pequeño delay) en vez de usar un valor fijo adivinado.
    setTimeout(ajustarEspacioVideoNosotros, 60);
    // iniciarReproductorNosotros ya espera, cuadro a cuadro, a que el
    // contenedor tenga su tamaño real antes de crear el reproductor de
    // YouTube (ver crearReproductorNosotrosCuandoVisible más abajo), así
    // que no hace falta ningún margen fijo de frames acá.
    iniciarReproductorNosotros();
}

const btnSobreNosotros = document.getElementById("btnSobreNosotros");
if(btnSobreNosotros){
    btnSobreNosotros.addEventListener("click", (e) => {
        e.preventDefault();
        activarBotonMenu("btnSobreNosotros");
        mostrarSeccionNosotros();
    });
}

// Acceso directo a "Jugar" (usado por el botón flotante 🎮): a
// diferencia de mostrarSeccionHerramientas(), acá NO se pasa primero
// por el selector de 3 botones grandes (Subtítulos/Jugar/Alfabetización):
// se muestra de una el menú "Elige a qué quieres jugar" (quizMenuJuegos),
// igual que en la imagen de referencia.
function abrirJugarDirecto(){
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    resultadoCategorias.innerHTML = "";
    resultadoCategoriasDiccionario.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    ocultarPanelesGuardados();
    ocultarBloqueInicio();
    document.body.classList.remove("vista-temas-movil");
    actualizarVistaUrl("herramientas-jugar");

    // Se ocultan el selector de Herramientas y los otros 2 módulos
    // (Subtítulos/Alfabetización): solo debe quedar visible Jugar.
    const menuMovil = document.getElementById("herramientasMenuMovil");
    if(menuMovil) menuMovil.classList.add("d-none");
    ocultarSubtitulos();
    ocultarAlfabetizacion();

    if(seccionQuiz){
        seccionQuiz.classList.remove("d-none");
        try { mostrarMenuJuegos(); } catch(err){ console.error("No se pudo abrir Jugar:", err); }
        seccionQuiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
        cargarPalabrasJson();
    }
};

// Guarda en el dispositivo la última copia de palabras.json que sí se pudo
// cargar con éxito. Es el respaldo que se usa cuando, tras varios
// reintentos, la red sigue sin responder: en vez de dejar "Seña del día" y
// "Categorías" vacíos (o con el aviso de error), se muestra igual el
// diccionario con los datos de la última visita, aunque no sean los más
// recientes.
const CLAVE_CACHE_PALABRAS = "lspedia_cache_palabras_v1";

function guardarCachePalabras(data) {
    try {
        localStorage.setItem(CLAVE_CACHE_PALABRAS, JSON.stringify({ datos: data, guardadoEn: Date.now() }));
    } catch (e) {
        // localStorage lleno, en modo privado, o no disponible: no es
        // crítico, simplemente no habrá respaldo la próxima vez.
    }
}

function leerCachePalabras() {
    try {
        const crudo = localStorage.getItem(CLAVE_CACHE_PALABRAS);
        if (!crudo) return null;
        const parsed = JSON.parse(crudo);
        return (parsed && Array.isArray(parsed.datos) && parsed.datos.length) ? parsed.datos : null;
    } catch (e) {
        return null;
    }
}

// Avisa al resto de la página (ver index.html, splash screen) que ya se
// sabe si hay datos para mostrar o no, sea porque llegaron de la red, de
// la copia guardada, o porque definitivamente no se pudo conseguir
// ninguna. El splash usa este aviso para no ocultarse antes de tiempo.
function avisarDatosListos() {
    document.dispatchEvent(new Event("lspedia:datosListos"));
}

// --- CARGA DE data/palabras.json: RÁPIDO PRIMERO, CONFIABLE DESPUÉS ---
//
// Estrategia "caché primero" (igual a como se sentía la página antes de
// que la conexión del operador empezara a dar problemas puntuales):
//   1) Si ya hay una copia guardada en este dispositivo de una visita
//      anterior (ver guardarCachePalabras), se pinta TODO el contenido
//      de inmediato, sin esperar nada a la red. La persona ve la página
//      completa al instante, como antes.
//   2) En paralelo, y sin bloquear ni mostrar ningún aviso, se pide la
//      versión más reciente en segundo plano. Si llega, se guarda para
//      la próxima carga; si falla o tarda, no importa, ya se está
//      viendo contenido completo y no hace falta molestar con errores.
//   3) Solo en la PRIMERA visita de un dispositivo (todavía sin ninguna
//      copia guardada) hace falta esperar a la red sí o sí. Ahí se usan
//      tiempos cortos (6s por intento, máximo 2 intentos) para no dejar
//      a la persona esperando mucho: si de verdad no hay conexión, se
//      avisa con un botón "Reintentar" en vez de quedarse pegado.
const TIMEOUT_INTENTO_PALABRAS_MS = 6000;

// Un intento de red con límite de tiempo "duro": el timeout es un
// temporizador independiente (Promise.race), no depende de que
// AbortController.abort() logre cancelar el fetch. En algunos
// navegadores móviles (o cuando el Service Worker intercepta la
// petición, ver sw.js) abort() no propaga bien y el fetch original se
// queda colgado; con Promise.race el límite de tiempo se cumple igual y
// el código sigue adelante pase lo que pase con esa petición.
function unIntentoDeCargaPalabras() {
    const controlador = (typeof AbortController !== "undefined") ? new AbortController() : null;
    const promesaFetch = fetch("data/palabras.json", controlador ? { signal: controlador.signal } : undefined)
        .then(res => {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        });
    const promesaTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), TIMEOUT_INTENTO_PALABRAS_MS);
    });
    return Promise.race([promesaFetch, promesaTimeout]).catch(error => {
        if (controlador) { try { controlador.abort(); } catch (e) { /* no crítico */ } }
        throw error;
    });
}

// Reintenta unos pocos intentos rápidos, sin esperas largas entre ellos.
function cargarPalabrasConReintentos(intentosRestantes, alExito, alFallar) {
    unIntentoDeCargaPalabras()
        .then(alExito)
        .catch(error => {
            console.error("Error al cargar LSPedia:", error);
            if (intentosRestantes > 1) {
                setTimeout(() => cargarPalabrasConReintentos(intentosRestantes - 1, alExito, alFallar), 1000);
            } else {
                alFallar(error);
            }
        });
}

function cargarPalabrasJson() {
    const cache = leerCachePalabras();

    if (cache && cache.length) {
        // Contenido completo al instante con lo último guardado.
        procesarDatosApp(cache);
        avisarDatosListos();
        // Actualiza en segundo plano y en silencio (sin reintentos
        // largos ni avisos de error): si hay datos nuevos, quedan
        // guardados para la próxima visita.
        cargarPalabrasConReintentos(2, (data) => guardarCachePalabras(data), () => {
            // Sin conexión ahora mismo: no importa, ya se está viendo
            // el contenido guardado. Se reintentará en la próxima visita.
        });
    } else {
        // Primera vez en este dispositivo: no hay nada guardado
        // todavía, así que sí hace falta esperar a la red, pero con
        // límites cortos para no dejar a la persona esperando mucho.
        cargarPalabrasConReintentos(2, (data) => {
            guardarCachePalabras(data);
            procesarDatosApp(data);
            avisarDatosListos();
        }, () => {
            mostrarErrorCargaInicial();
            avisarDatosListos();
        });
    }
}

// --- RED DE SEGURIDAD FINAL ---
// Último resguardo por si algún error no contemplado (por ejemplo, una
// excepción dentro de procesarDatosApp) impide que se llegue a mostrar
// contenido o el aviso de error. Si 15 segundos después de cargar la
// página "Seña del día" sigue mostrando "Cargando..." y no hay datos, se
// fuerza el aviso con botón "Reintentar" en vez de dejarlo así para
// siempre.
// IMPORTANTE: este temporizador NO depende de "window.load" a propósito.
// window.load solo se dispara cuando TODA la página terminó de cargar
// (imágenes, miniaturas de YouTube, fuentes, etc.), no solo el JSON de
// palabras. Con señal débil, window.load puede tardar mucho más que estos
// 15s (o no llegar nunca si algún recurso de terceros nunca responde),
// dejando "Seña del día" y "Categorías" en "Cargando..." para siempre, sin
// que este aviso de error/Reintentar llegue a mostrarse nunca. Al colgar
// el contador directamente del momento en que este script se ejecuta (ya
// va casi al final del <body>, así que el HTML relevante ya existe),
// queda garantizado que el aviso aparece sí o sí, sin importar cuánto
// tarden en llegar el resto de recursos de la página.
setTimeout(() => {
    const senal = document.getElementById("senalDelDia");
    const panel = document.getElementById("panelCategoriasDiccionario");
    // Antes esto solo miraba "App.datos.length === 0": si un error a
    // mitad de procesarDatosApp dejaba App.datos ya asignado pero el resto
    // de la función sin terminar (ver el try/catch de ahí), esta condición
    // nunca era verdadera y el aviso de error nunca se mostraba. Ahora se
    // fija en lo que el usuario realmente sigue viendo en pantalla.
    const senalSigueCargando = senal && senal.textContent && senal.textContent.indexOf("Cargando") !== -1;
    const panelSigueCargando = panel && panel.textContent && panel.textContent.indexOf("Cargando") !== -1;
    if (senalSigueCargando || panelSigueCargando) {
        console.warn("Red de seguridad: una sección quedó colgada, forzando aviso de error.");
        mostrarErrorCargaInicial();
        avisarDatosListos();
    }
}, 15000);

function procesarDatosApp(data) {
          // Todo el cuerpo va envuelto en try/catch a propósito: si CUALQUIER
          // línea de acá abajo lanza una excepción (por ejemplo, un dato mal
          // escrito en el Google Sheet de origen que rompe alguna de estas
          // funciones), antes la función se detenía en silencio ahí mismo.
          // Como App.datos ya se había asignado en la primera línea, la "red
          // de seguridad" de más abajo (que solo revisa si App.datos sigue
          // vacío) nunca se activaba, y "Seña del día"/"Categorías" se
          // quedaban en "Cargando…" para siempre sin ningún aviso. Con el
          // catch, cualquier error futuro termina mostrando el aviso de
          // error + botón "Reintentar" en vez de un spinner mudo.
          try {
            // Solo se muestran en la web las palabras que YA tienen video
            // cargado. Si agregas una palabra nueva en la Hoja 1 y aún no
            // le pusiste el video, se queda oculta hasta que el campo
            // "video" tenga algo escrito.
            App.datos = data.filter(p => p.palabra && p.categoria && p.video && String(p.video).trim());
            // Las categorías reales del diccionario (Hoja 1, columna C)
            // recién están disponibles acá, así que se pintan las tarjetas
            // en cuanto llegan las palabras.
            renderCategoriasDiccionario();
            actualizarEstadisticas();
            mostrarFavoritos();

            const urlParams = new URLSearchParams(window.location.search);
            const palabraEnUrl = urlParams.get("p");
            // La vista destino se lee ANTES de pintar la seña del día: si
            // el usuario en realidad va a "Temas orden", "Herramientas" o
            // "Sobre Nosotros", mostrarSenalDelDia() nunca llega a pintarse
            // con el título "Diccionario" de por medio. Antes se pintaba
            // siempre y recién después se simulaba el clic a la otra
            // sección, lo que dejaba ver un parpadeo con contenido
            // mezclado (título de Diccionario + tarjetas de Vocabulario).
            const vistaEnUrlPrevia = urlParams.get("vista");
            if (!palabraEnUrl && (vistaEnUrlPrevia === "vocabulario" || vistaEnUrlPrevia === "temas" || vistaEnUrlPrevia === "nosotros" || (vistaEnUrlPrevia && vistaEnUrlPrevia.indexOf("herramientas") === 0))) {
                ocultarBloqueInicio();
            } else {
                mostrarSenalDelDia();
            }

            if (palabraEnUrl) {
                restaurarPalabraDesdeUrl(palabraEnUrl);
            } else {
                // Si no hay una palabra específica que restaurar, revisa si
                // el usuario estaba en "Temas orden" o "Herramientas" antes
                // del refresh (ver actualizarVistaUrl) y lo deja ahí mismo
                // en vez de mandarlo siempre a Inicio.
                const vistaEnUrl = urlParams.get("vista");
                if (vistaEnUrl === "vocabulario" || vistaEnUrl === "temas") {
                    const btnCategorias = document.getElementById("btnCategorias");
                    // Evita que el clic simulado dispare el scroll que centra
                    // el panel de categorías: acá se está restaurando la
                    // vista tras cargar la página directo, así que debe verse
                    // desde arriba (ver bandera "saltarScrollAlAbrirVocabulario").
                    saltarScrollAlAbrirVocabulario = true;
                    if (btnCategorias) btnCategorias.click();
                    // (antes, un segundo toque en "Vocabulario" desde la barra
                    // inferior forzaba un refresco real de la página y acá se
                    // restauraba la búsqueda/categoría; esa función ya no
                    // existe, pero esta restauración sigue sirviendo para un
                    // refresco manual normal del navegador, ej. F5).
                    const textoBusquedaUrl = urlParams.get("buscar");
                    const categoriaUrl = urlParams.get("categoria");
                    if (textoBusquedaUrl && buscarCategorias) {
                        buscarCategorias.value = textoBusquedaUrl;
                        buscarEnCategorias();
                    } else if (categoriaUrl && typeof mostrarCategoria === "function") {
                        mostrarCategoria(categoriaUrl);
                    }
                } else if (vistaEnUrl === "nosotros") {
                    const btnSobreNosotros = document.getElementById("btnSobreNosotros");
                    if (btnSobreNosotros) btnSobreNosotros.click();
                } else if (vistaEnUrl && vistaEnUrl.indexOf("herramientas") === 0) {
                    // A diferencia de "temas" y "nosotros" (que restauran
                    // simulando el clic real del botón del menú, y por lo
                    // tanto ya pasan por activarBotonMenu), acá se llamaba
                    // directo a mostrarSeccionHerramientas() sin marcar
                    // "Herramientas" como botón activo del menú. Como
                    // "Inicio" arranca con la clase "active" fija en el
                    // HTML, tras un refresco en Herramientas ese botón
                    // seguía figurando "activo", y el bloque de "Palabras
                    // sugeridas" (que se calcula mirando si Inicio está
                    // activo, ver el script de chips más abajo en
                    // index.html) terminaba mostrándose también acá, cuando
                    // debe verse solo en Diccionario.
                    activarBotonMenu("btnHerramientas");
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
          } catch (error) {
            console.error("Error al procesar los datos del diccionario:", error);
            mostrarErrorCargaInicial();
          }
}

// Aviso + botón "Reintentar" cuando, tras varios intentos, no se pudo
// cargar data/palabras.json (típico de una conexión móvil inestable). Sin
// esto, "Seña del día" se quedaba con el título/descripción vacíos (ver
// captura reportada) y "Categorías" se quedaba con el encabezado pero sin
// ninguna tarjeta debajo, sin ninguna pista de que algo había fallado.
function mostrarErrorCargaInicial() {
    const senal = document.getElementById("senalDelDia");
    const cuerpoSenal = senal ? senal.querySelector(".dia-rect-body") : null;
    if (cuerpoSenal) {
        cuerpoSenal.innerHTML = `
            <span class="dia-rect-label">⚠️ No se pudo cargar</span>
            <p class="dia-rect-desc">Revisa tu conexión a internet e inténtalo de nuevo.</p>
            <button type="button" class="btn dia-rect-btn" id="btnReintentarCargaInicial">🔄 Reintentar</button>`;
        const btnReintentar = document.getElementById("btnReintentarCargaInicial");
        if (btnReintentar) btnReintentar.onclick = () => location.reload();
    }

    const panelCategorias = document.getElementById("panelCategoriasDiccionario");
    if (panelCategorias) {
        panelCategorias.innerHTML = `
            <div class="col-12 text-center text-muted small py-3">
                No se pudieron cargar las categorías. Revisa tu conexión e
                <button type="button" class="btn btn-sm btn-outline-primary ms-1" onclick="location.reload()">inténtalo de nuevo</button>.
            </div>`;
    }
}
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
        // Antes llevaba a "Vocabulario" (btnCategorias.click()). Ahora se
        // queda dentro de la misma sección "Diccionario": el panel de
        // categorías (#filaCategoriasDiccionario, con las tarjetas
        // Vivienda/Familia/Alimentos/etc.) ya vive arriba en esta misma
        // pantalla, así que solo se hace scroll y un resalte breve para
        // que la persona lo ubique, igual que hace la tarjeta "PALABRAS"
        // con el índice A-Z.
        const panel = document.getElementById("filaCategoriasDiccionario");
        if (panel) {
            // Antes usaba block:"center": como el panel es alto (header +
            // grid de tarjetas), centrarlo
            // dejaba la mitad de arriba fuera de pantalla en móvil y el
            // bloque quedaba "cortado". Con scrollAlPrimerResultado (la
            // misma función que usa filtrarPorCategoriaDiccionario) el
            // panel queda anclado arriba, con su encabezado y sus tarjetas
            // visibles desde la primera hasta donde entre en pantalla.
            panel.classList.add("highlight-anim");
            setTimeout(() => panel.classList.remove("highlight-anim"), 2000);
            scrollAlPrimerResultado(panel);
        }
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
    // El diseño actual ya no usa una flecha giratoria: el propio botón
    // #btnToggleAbc alterna su texto ("Mostrar todas" / "Ocultar") solo
    // con CSS, en base al atributo aria-expanded que Bootstrap actualiza
    // por su cuenta al abrir/cerrar el collapse (ver estilos.css).
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
        video: (p.video && p.video.trim() !== "") ? p.video : enHoja2.video,
        nivel: p.nivel || enHoja2.nivel,
        _tambienEnQuiz: true
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
            } else if (document.body.classList.contains("vista-temas-movil")) {
                // Antes se usaba "panelCategorias.children.length > 0" para
                // decidir si tocaba refrescar. Pero justo al refrescar la
                // página estando en Vocabulario, mostrarCategorias() corre
                // ANTES de que la Hoja 2 (banco de QuizV2) termine de
                // cargar, así que panelCategorias queda con 0 tarjetas — y
                // esa condición nunca volvía a ser true cuando los datos
                // sí llegaban, dejando "Vocabulario" sin categorías para
                // siempre. La clase "vista-temas-movil" (agregada al
                // <body> mientras esta sección está abierta, sin importar
                // cuántas tarjetas tenga en un momento dado) es un
                // indicador confiable de que seguimos en Vocabulario y hay
                // que repintar apenas llegan los datos.
                mostrarCategorias();
            }
        });
    } else {
        console.warn("QuizV2 no está disponible: las categorías no podrán mostrar palabras de la Hoja 2.");
    }
});

// --- BUSCADOR INTELIGENTE (solo Hoja 1) ---
buscar.addEventListener("input", buscarPalabras);

// Normaliza texto para comparar sin importar tildes (adios === Adiós) ni
// mayúsculas/minúsculas, y tratando "ñ" como "n" para que la búsqueda
// también funcione si el usuario escribe sin tilde de la eñe (ano ~ año).
// Se usa en ambos lados de cada comparación para que el buscador tolere
// errores comunes de escritura.
const norm = (s) => (s || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Dado el texto de variantes tal como está en los datos (con tildes/ñ
// originales) y el texto normalizado que escribió el usuario, devuelve
// la variante ORIGINAL que hizo match (para mostrarla tal cual, no la
// versión normalizada de lo que escribió el usuario).
function obtenerVarianteQueCoincide(variantesStr, textoNormalizado) {
    if (!variantesStr) return null;
    const variantesOriginales = variantesStr.split(',').map(v => v.trim());
    const encontrada = variantesOriginales.find(v => norm(v).includes(textoNormalizado));
    return encontrada || null;
}

// Clasifica qué tan buena es la coincidencia de "p" contra "texto"
// (ya normalizado). Menor número = más relevante. -1 = no hay match.
// Se usa para que los resultados se ordenen SIEMPRE de lo más exacto
// a lo más aproximado, sin importar el orden alfabético.
function clasificarCoincidencia(p, texto) {
    const palabraNorm = norm(p.palabra);
    const variantesNorm = p.variantes ? p.variantes.split(',').map(v => norm(v.trim())) : [];

    if (palabraNorm === texto) return 0;                                  // la palabra es exactamente lo buscado
    if (variantesNorm.includes(texto)) return 1;                          // una variante es exactamente lo buscado
    if (palabraNorm.startsWith(texto)) return 2;                          // la palabra empieza así
    if (variantesNorm.some(v => v.startsWith(texto))) return 3;           // una variante empieza así
    if (palabraNorm.includes(texto)) return 4;                            // la palabra lo contiene en otra parte
    if (variantesNorm.some(v => v.includes(texto))) return 5;             // una variante lo contiene en otra parte
    return -1;
}

// Ordena una lista de {p, rango} de más exacto a más aproximado, y
// dentro de cada nivel de exactitud, alfabéticamente. Los niveles 0-3
// (coincidencias exactas o que empiezan con el texto) NUNCA se recortan;
// solo se limita cuántos resultados "de relleno" (nivel 4-5, que solo
// contienen el texto en otra parte) se agregan al final, hasta el tope.
function ordenarYLimitarCoincidencias(coincidencias, tope) {
    const ordenarAlfabetico = (a, b) => a.p.palabra.localeCompare(b.p.palabra, "es");
    const prioritarios = coincidencias.filter(c => c.rango <= 3).sort((a, b) => a.rango - b.rango || ordenarAlfabetico(a, b));
    const secundarios = coincidencias.filter(c => c.rango >= 4).sort((a, b) => a.rango - b.rango || ordenarAlfabetico(a, b));
    const cupoRestante = Math.max(0, tope - prioritarios.length);
    return prioritarios.concat(secundarios.slice(0, cupoRestante)).map(c => c.p);
}

// Distancia de Levenshtein: cuántas ediciones (insertar/borrar/cambiar una
// letra) hacen falta para convertir "a" en "b". Se usa para detectar
// errores de escritura (ej. "adioz" está a 1 edición de "adios") y poder
// ofrecer "¿Quisiste decir...?" cuando la búsqueda normal no encuentra nada.
function levenshtein(a, b) {
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (la === 0) return lb;
    if (lb === 0) return la;
    let prev = new Array(lb + 1);
    let curr = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) prev[j] = j;
    for (let i = 1; i <= la; i++) {
        curr[0] = i;
        for (let j = 1; j <= lb; j++) {
            const costo = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,      // borrar
                curr[j - 1] + 1,  // insertar
                prev[j - 1] + costo // cambiar (o igual)
            );
        }
        [prev, curr] = [curr, prev];
    }
    return prev[lb];
}

// Busca en "datos" palabras (o variantes) que estén a exactamente 1 error
// de "texto". Solo tiene sentido cuando el texto ya tiene al menos 3
// letras (con 1-2 letras casi cualquier palabra "cabe" a distancia 1 y el
// resultado sería puro ruido). Devuelve como máximo 3 candidatas.
function buscarCercanos(texto, datos) {
    if (texto.length < 3) return [];
    const candidatos = [];
    datos.forEach(p => {
        let dist = levenshtein(texto, norm(p.palabra));
        if (p.variantes) {
            p.variantes.split(',').forEach(v => {
                const d = levenshtein(texto, norm(v.trim()));
                if (d < dist) dist = d;
            });
        }
        if (dist === 1) candidatos.push(p);
    });
    candidatos.sort((a, b) => a.palabra.localeCompare(b.palabra, "es"));
    return candidatos.slice(0, 3);
}

function buscarPalabras(){
    const texto = norm(buscar.value.trim());
    ocultarQuiz();
    ocultarAlfabetizacion();
    document.querySelectorAll(".btn-abc.active").forEach(boton => boton.classList.remove("active"));
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

    // Ordena de lo más exacto a lo más aproximado (ver clasificarCoincidencia
    // y ordenarYLimitarCoincidencias más arriba). Las coincidencias exactas
    // o que empiezan con el texto escrito nunca se recortan; solo se
    // limita cuántas coincidencias "de relleno" (que solo contienen el
    // texto en otra parte) se agregan al final.
    const coincidencias = [];
    App.datos.forEach(p => {
        const rango = clasificarCoincidencia(p, texto);
        if (rango >= 0) coincidencias.push({ p, rango });
    });

    const encontrados = ordenarYLimitarCoincidencias(coincidencias, 15);

    sugerencias.style.display = "block";

    if(encontrados.length===0){
        const cercanos = buscarCercanos(texto, App.datos);
        if(cercanos.length > 0){
            sugerencias.innerHTML = `
                <div class="list-group-item text-center py-2" style="background-color: #343a40; border: none;">
                    <span class="text-white d-block small">¿Quisiste decir...?</span>
                </div>`;
            cercanos.forEach(p => {
                const boton = document.createElement("button");
                boton.className = "list-group-item list-group-item-action text-start";
                boton.innerHTML = `<strong>${p.palabra}</strong> <span class="badge" style="font-size: 10px;">${p.categoria.trim()}</span>`;
                boton.onclick = () => mostrarPalabra(p);
                sugerencias.appendChild(boton);
            });
            return;
        }
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
        const varianteCoincidente = obtenerVarianteQueCoincide(p.variantes, texto);
        if(varianteCoincidente && !norm(p.palabra).includes(texto)){
            textoMatch += ` <small class="text-primary ms-2 fw-bold" style="font-size: 11px;">(Variante: ${varianteCoincidente})</small>`;
        }

        // Video-first: miniatura de la seña junto a cada sugerencia,
        // así se reconoce visualmente antes de leer la palabra.
        const idVideoSugerencia = extraerIdYouTube(p.video);
        const miniatura = idVideoSugerencia
            ? `<div class="sugerencia-thumb-wrap">
                   <img src="https://i.ytimg.com/vi/${idVideoSugerencia}/mqdefault.jpg" alt="Seña de ${p.palabra}" loading="lazy">
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
    const texto = norm(buscar.value.trim());
    if(texto === "") return;
    sugerencias.innerHTML = "";
    sugerencias.style.display = "none";

    const encontrados = App.datos.filter(p => {
        const matchPrincipal = norm(p.palabra) === texto;
        const matchVariantes = p.variantes ? norm(p.variantes).split(',').map(v=>v.trim()).includes(texto) : false;
        return matchPrincipal || matchVariantes;
    });

    if(encontrados.length > 0) {
        mostrarPalabra(encontrados[0]);
        return;
    }

    const parciales = App.datos.filter(p => norm(p.palabra).includes(texto) || (p.variantes && norm(p.variantes).includes(texto)));
    if(parciales.length > 0) {
        mostrarPalabra(parciales[0]);
        return;
    }

    buscar.blur();
    panelCategorias.innerHTML = "";
    resultadoCategoriasDiccionario.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    ocultarPanelesGuardados();
    const filaCategoriasDiccBusq = document.getElementById("filaCategoriasDiccionario");
    if(filaCategoriasDiccBusq) filaCategoriasDiccBusq.style.display = "none";
    const statsPanelBusq = document.querySelector(".stats-panel-destacado");
    if(statsPanelBusq) statsPanelBusq.style.display = "none";
    const statsHeaderBusq = document.querySelector(".stats-header");
    if(statsHeaderBusq) statsHeaderBusq.style.display = "none";
    resultado.innerHTML = `
    <div class="card shadow-sm mb-4 border-0 animate-fade-in" style="border-radius: 15px; background-color: #f8f9fa;">
        <div class="card-body p-5 text-center">
            <div style="width: 140px; height: 140px; margin: 0 auto 10px;">
                <video autoplay muted loop playsinline disablepictureinpicture poster="img/avatar_duda_sin_fondo.png" aria-label="Personaje de LSPedia buscando con una lupa, sin encontrar resultados" style="width: 100%; height: 100%; object-fit: contain;">
                    <source src="img/avatar_duda.webm" type="video/webm">
                </video>
            </div>
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

// --- COMPARTIR ENLACE DE UNA PALABRA (Diccionario y Vocabulario) ---
// Genera el botón que va junto al título de la ficha. Usa la misma URL
// "?p=..." que ya arma mostrarPalabra()/mostrarPalabraSimplificada() al
// hacer history.pushState(), así que el enlace compartido, al abrirse,
// restaura directamente esa palabra (ver restaurarPalabraDesdeUrl()).
function generarBotonCompartir(){
    return `<button type="button" id="btnCompartir" class="btn btn-sm btn-compartir py-1 px-3" title="Compartir esta seña" aria-label="Compartir esta seña"><span class="btn-compartir-icono">🔗</span> Compartir</button>`;
}

// Si el navegador soporta la Web Share API (la mayoría de celulares), abre
// el panel nativo para compartir a redes sociales, WhatsApp, etc. Si no
// (la mayoría de escritorios), copia el enlace al portapapeles y lo avisa
// con un pequeño mensaje flotante. Como último respaldo (navegadores muy
// viejos o sin permiso de portapapeles), muestra un prompt con el enlace
// ya seleccionado para copiar a mano.
function compartirPalabra(nombrePalabra){
    const url = window.location.origin + window.location.pathname + "?p=" + encodeURIComponent(nombrePalabra);
    const textoCompartir = `Mira la seña de "${nombrePalabra}" en LSP 🤟 - LSPedia`;
    if (navigator.share) {
        navigator.share({ title: "LSPedia", text: textoCompartir, url: url }).catch(() => {});
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => mostrarAvisoCompartir("🔗 Enlace copiado"))
            .catch(() => window.prompt("Copia este enlace para compartir:", url));
        return;
    }
    window.prompt("Copia este enlace para compartir:", url);
}

// Mensaje flotante breve (estilo "toast") que confirma que el enlace se
// copió. Se crea una sola vez y se reutiliza en cada llamada.
function mostrarAvisoCompartir(mensaje){
    let toast = document.getElementById("toastCompartir");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastCompartir";
        toast.className = "toast-compartir";
        document.body.appendChild(toast);
    }
    toast.textContent = mensaje;
    clearTimeout(toast._timeoutId);
    toast.classList.add("mostrar");
    toast._timeoutId = setTimeout(() => toast.classList.remove("mostrar"), 2200);
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
    cerrarPantallaCompletaVideoPalabra();
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
        ultimasPalabras.innerHTML = "";
        // Al mostrar el resultado de una palabra (búsqueda o categoría)
        // en Diccionario, se ocultan las tarjetas de Categorías y el
        // panel de Estadísticas que quedan arriba del buscador: no
        // aportan nada mientras se está viendo una ficha, y vuelven a
        // aparecer al regresar al inicio (ver mostrarBloqueInicio()).
        const filaCategoriasDicc = document.getElementById("filaCategoriasDiccionario");
        if(filaCategoriasDicc) filaCategoriasDicc.style.display = "none";
        const statsPanelResultado = document.querySelector(".stats-panel-destacado");
        if(statsPanelResultado) statsPanelResultado.style.display = "none";
        const statsHeaderResultado = document.querySelector(".stats-header");
        if(statsHeaderResultado) statsHeaderResultado.style.display = "none";
    } else {
        // No tocamos el buscador principal ni las tarjetas de categoría
        // (siguen visibles arriba, igual que al buscar dentro de una
        // categoría o con el buscador de "Temas orden"). Las sugerencias
        // en este modo se pintan en #ultimasPalabrasCategorias (justo
        // debajo de #resultadoCategorias), no en #ultimasPalabras (que
        // queda arriba, lejos de la tarjeta, y no debe tocarse acá).
        resultado.innerHTML = "";
        if(ultimasPalabrasCategorias) ultimasPalabrasCategorias.innerHTML = "";
    }
    ocultarPanelesGuardados();
    const nuevaUrl = window.location.pathname + "?p=" + encodeURIComponent(p.palabra);
    window.history.pushState({path: nuevaUrl}, '', nuevaUrl);
    agregarAHistorial(p.palabra); 
    const enFavoritos = esFavorito(p.palabra);
    const textoBoton = enFavoritos ? "★ En favoritos" : "⭐ Agregar a favoritos";
    const botonCompartir = generarBotonCompartir();
    // La columna "imagen" puede traer varias URLs separadas por coma para
    // mostrar más de un ejemplo por palabra. Con una sola imagen se
    // mantiene el comportamiento de siempre (clic para ampliar, sin
    // flechas); con dos o más se arma un carrusel deslizable.
    const imagenesPalabra = obtenerImagenesDeApoyo(p);
    const bloqueImagen = generarBloqueImagenApoyo(imagenesPalabra, p.palabra);
    const hayVideo = p.video && p.video.trim() !== "";
    const bloqueVideo = hayVideo
        ? `<div id="reproductorPalabra"></div>`
        : `<div class="d-flex flex-column align-items-center justify-content-center h-100 bg-light text-muted text-center p-3">
                <span class="fs-1 mb-2">🤟</span>
                <span class="small fw-bold">Video próximamente</span>
                <span class="small">Todavía no hemos grabado la seña de esta palabra.</span>
           </div>`;
    const bloqueControlesVideo = hayVideo
            ? `<div class="controles-video d-flex align-items-center justify-content-center gap-2 mt-2 flex-nowrap">
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnRetroceder10" title="Retroceder 1 segundo" aria-label="Retroceder 1 segundo">⏪ <span class="controles-video-texto">1s</span></button>
                <button type="button" class="btn btn-sm btn-primary" id="btnPlayPause" title="Reproducir o pausar" aria-label="Reproducir o pausar">▶️ <span class="controles-video-texto">Iniciar</span></button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnReiniciarPalabra" title="Reiniciar desde el principio" aria-label="Reiniciar desde el principio">↺ <span class="controles-video-texto">Más</span></button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnAvanzar10" title="Avanzar 3 segundos" aria-label="Avanzar 3 segundos"><span class="controles-video-texto">3s</span> ⏩</button>
                <div class="controles-video-velocidad">
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadLenta" title="Reducir velocidad" aria-label="Reducir velocidad">🐢</button>
                    <span class="small fw-bold text-muted" id="palabraVelocidadLabel">1x</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadRapida" title="Aumentar velocidad" aria-label="Aumentar velocidad">🐇</button>
                </div>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraFullscreen" title="Ver en pantalla completa" aria-label="Ver en pantalla completa">⛶</button>
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
                    <div class="video-toque-overlay" id="overlaySugerida"></div>
                </div>
                <div class="controles-video controles-video-compactos d-flex align-items-center justify-content-center gap-2 mt-2 flex-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnRetroceder10Sugerida" title="Retroceder 1 segundo" aria-label="Retroceder 1 segundo">⏪ 1s</button>
                    <button type="button" class="btn btn-sm btn-primary" id="btnPlayPauseSugerida" title="Reproducir o pausar" aria-label="Reproducir o pausar">▶️ Iniciar</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnReiniciarSugerida" title="Reiniciar desde el principio" aria-label="Reiniciar desde el principio">↺ Más</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnAvanzar10Sugerida" title="Avanzar 3 segundos" aria-label="Avanzar 3 segundos">3s ⏩</button>
                    <div class="controles-video-velocidad">
                        <button type="button" class="btn btn-sm btn-outline-secondary" id="btnVelocidadLentaSugerida" title="Reducir velocidad" aria-label="Reducir velocidad">🐢</button>
                        <span class="small fw-bold text-muted" id="velocidadLabelSugerida">1x</span>
                        <button type="button" class="btn btn-sm btn-outline-secondary" id="btnVelocidadRapidaSugerida" title="Aumentar velocidad" aria-label="Aumentar velocidad">🐇</button>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnSugeridaFullscreen" title="Ver en pantalla completa" aria-label="Ver en pantalla completa">⛶</button>
                </div>
           </div>`
        : "";

    // Insignia opcional cuando la palabra también aparece en el banco del
    // Quiz (Hoja 2), resultado de fusionarConHoja2() más arriba.
    const bloqueBadgeQuiz = p._tambienEnQuiz
        ? `<span class="badge bg-warning text-dark mb-2 ms-1" style="font-size: 11px;">🎮 También en el Quiz${p.nivel ? " · " + p.nivel : ""}</span>`
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
                <div class="d-flex gap-2 flex-shrink-0 flex-wrap justify-content-end">
                    ${botonCompartir}
                    <button id="btnFavorito" class="btn btn-sm btn-outline-primary py-1 px-3" style="border-radius: 15px; font-size: 12px; font-weight: bold;">${textoBoton}</button>
                </div>
            </div>
            <p class="mb-3 p-3 rounded" style="background-color: #eef6ff; border-left: 4px solid #0d6efd; font-size: 1rem; line-height: 1.5; color: #1e293b;">${formatearDefinicion(p.definicion)}</p>
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
        </div>
    </div>`;
    document.getElementById("btnFavorito").addEventListener("click", () => {
        const ahoraEnFavoritos = alternarFavorito(p.palabra);
        document.getElementById("btnFavorito").textContent = ahoraEnFavoritos ? "★ En favoritos" : "⭐ Agregar a favoritos";
        mostrarFavoritos();
    });
    const btnCompartirDicc = document.getElementById("btnCompartir");
    if (btnCompartirDicc) btnCompartirDicc.addEventListener("click", () => compartirPalabra(p.palabra));
    if (!enCategorias) {
        mostrarSugerenciasRelacionadas(p, ultimasPalabras);
    } else {
        mostrarSugerenciasRelacionadas(p, ultimasPalabrasCategorias, { clickAbreEnCategorias: true });
    }
    if (hayVideo) {
        inicializarReproductorPalabra(p.video, { autoreproducir: true });
    } else {
        ytPlayerPalabra = null;
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
    cerrarPantallaCompletaVideoPalabra();
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
        if(ultimasPalabrasCategorias) ultimasPalabrasCategorias.innerHTML = "";
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
        ? `<div class="controles-video d-flex align-items-center justify-content-center gap-2 mt-2 flex-nowrap">
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnRetroceder10" title="Retroceder 1 segundo" aria-label="Retroceder 1 segundo">⏪ <span class="controles-video-texto">1s</span></button>
                <button type="button" class="btn btn-sm btn-primary" id="btnPlayPause" title="Reproducir o pausar" aria-label="Reproducir o pausar">▶️ <span class="controles-video-texto">Iniciar</span></button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnReiniciarPalabra" title="Reiniciar desde el principio" aria-label="Reiniciar desde el principio">↺ <span class="controles-video-texto">Más</span></button>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnAvanzar10" title="Avanzar 3 segundos" aria-label="Avanzar 3 segundos"><span class="controles-video-texto">3s</span> ⏩</button>
                <div class="controles-video-velocidad">
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadLenta" title="Reducir velocidad" aria-label="Reducir velocidad">🐢</button>
                    <span class="small fw-bold text-muted" id="palabraVelocidadLabel">1x</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraVelocidadRapida" title="Aumentar velocidad" aria-label="Aumentar velocidad">🐇</button>
                </div>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnPalabraFullscreen" title="Ver en pantalla completa" aria-label="Ver en pantalla completa">⛶</button>
           </div>`
        : "";

    const imagenesPalabra = obtenerImagenesDeApoyo(p);
    const bloqueImagen = generarBloqueImagenApoyo(imagenesPalabra, p.palabra);
    let bloqueVariantes = p.variantes && p.variantes.trim() !== "" ? `<div class="mb-3 p-2 bg-light rounded border"><span class="d-block fw-bold text-secondary mb-1" style="font-size: 10px; letter-spacing: 0.5px;">🔄 CONJUGACIONES O VARIANTES:</span><span class="text-muted small fst-italic">${p.variantes}</span></div>` : "";

    const contenedorDestino = enCategorias ? resultadoCategorias : resultado;
    contenedorDestino.innerHTML = `
    ${enCategorias ? botonAtrasCategorias() : ""}
    <div class="card shadow-sm mb-4 animate-fade-in" style="border-radius: 15px; border-color: #dceefc;">
        <div class="card-body p-4">
            <span class="badge bg-warning text-dark mb-2" style="font-size: 11px;">🎮 Banco del Quiz</span>
            ${p.categoria ? `<span class="badge bg-primary mb-2 ms-1" style="font-size: 11px;">${p.categoria.trim()}</span>` : ""}
            ${p.nivel ? `<span class="badge bg-secondary mb-2 ms-1" style="font-size: 11px;">${p.nivel}</span>` : ""}
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <h3 class="fw-bold mb-0" style="color: #0d6efd;">${p.palabra}</h3>
                ${generarBotonCompartir()}
            </div>
            ${bloqueVariantes}
            <div class="row g-4 justify-content-center align-items-stretch">
                <div class="col-lg-7 d-flex flex-column">
                    <span class="text-muted d-block small fw-bold mb-2 uppercase tracking-wider">🤟 Video de la seña:</span>
                    <div class="reproductor-palabra-wrap shadow-sm rounded overflow-hidden border" id="reproductorPalabraWrap">
                        ${bloqueVideo}
                    </div>
                    ${bloqueControlesVideo}
                </div>
                <div class="col-lg-5 d-flex flex-column justify-content-center gap-3">
                    <div class="apoyo-panel apoyo-panel-vocabulario">
                        <span class="apoyo-panel-titulo">📸 Ejemplo</span>
                        <div class="apoyo-panel-caja">
                            ${bloqueImagen}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    const btnCompartirVoc = document.getElementById("btnCompartir");
    if (btnCompartirVoc) btnCompartirVoc.addEventListener("click", () => compartirPalabra(p.palabra));
    if (!enCategorias) {
        mostrarSugerenciasRelacionadasVocabulario(p, ultimasPalabras);
    } else {
        mostrarSugerenciasRelacionadasVocabulario(p, ultimasPalabrasCategorias, { clickAbreEnCategorias: true });
    }
    if (idVideo) {
        inicializarReproductorPalabra(idVideo, { autoreproducirEnBucle: true });
    } else {
        ytPlayerPalabra = null;
    }
    setTimeout(() => contenedorDestino.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}

// --- REPRODUCTOR DE VIDEO CONTROLABLE (YouTube IFrame API) ---
let ytPlayerPalabra = null;
let ytApiListo = false;
let ytVideoIdPendiente = null;
// Igual que ytVideoIdPendiente: recuerda si, cuando se cree el reproductor
// de la palabra pendiente, debe hacerlo en modo autoreproducción + bucle
// (ver inicializarReproductorPalabra / crearReproductorPalabra más abajo).
let ytOpcionesReproductorPalabraPendiente = {};
// Declarada acá (y no junto al resto del reproductor "Seña sugerida" más
// abajo) a propósito: onYouTubeIframeAPIReady, justo debajo, ya la usa. Si
// la API de YouTube carga muy rápido, el aviso "temprano" (ver
// window.__ytApiListoTemprano un poco más abajo) puede llamar a esa función
// ANTES de que el script llegue a la línea original de esta declaración,
// lo que rompía todo el resto de la carga (incluyendo Categorías) con un
// "Cannot access 'ytVideoIdSugeridaPendiente' before initialization".
let ytVideoIdSugeridaPendiente = null;

// --- REPRODUCTOR DE VIDEO CONTROLABLE PARA "SOBRE NOSOTROS" ---
const ID_VIDEO_NOSOTROS = "CTzPj2deb3M";
let ytPlayerNosotros = null;
let ytVideoNosotrosPendiente = null;
let nosotrosVelocidadIndex = VELOCIDADES_PALABRA.indexOf(1);
let nosotrosPantallaCompletaActiva = false;

// Esta función la llama automáticamente el script de YouTube (iframe_api) cuando está lista.
function onYouTubeIframeAPIReady() {
    ytApiListo = true;
    if (ytVideoIdPendiente) {
        crearReproductorPalabra(ytVideoIdPendiente, ytOpcionesReproductorPalabraPendiente);
        ytVideoIdPendiente = null;
        ytOpcionesReproductorPalabraPendiente = {};
    }
    if (ytVideoIdSugeridaPendiente) {
        crearReproductorSugerida(ytVideoIdSugeridaPendiente);
        ytVideoIdSugeridaPendiente = null;
    }
    if (ytVideoNosotrosPendiente) {
        const videoPendiente = ytVideoNosotrosPendiente;
        ytVideoNosotrosPendiente = null;
        // Ver crearReproductorNosotrosCuandoVisible: se espera a que el
        // contenedor tenga tamaño real (no un número fijo de frames) antes
        // de crear el reproductor, ya que la API de YouTube (script de
        // terceros) suele quedar lista recién después de que la sección
        // "Sobre Nosotros" ya se hizo visible -algo típico justo tras un
        // refresco de la página con esa sección restaurada desde la URL-.
        crearReproductorNosotrosCuandoVisible(videoPendiente);
    }
}
// index.html ya define un window.onYouTubeIframeAPIReady "temprano" (en el
// <head>, antes de que este archivo cargue) para no perder el aviso de la
// API si esta queda lista antes de que script.js termine de descargarse.
// Acá se reemplaza esa función por la real, y si el aviso temprano ya
// había llegado (window.__ytApiListoTemprano), se ejecuta de una vez.
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
window.__onYouTubeIframeAPIReadyReal = onYouTubeIframeAPIReady;
if (window.__ytApiListoTemprano) {
    onYouTubeIframeAPIReady();
}

// El video de "Sobre Nosotros" es fijo (no depende de datos del Sheet), así
// que se intenta crear una sola vez, la primera vez que se abre la sección
// (ver mostrarSeccionNosotros). Si la API de YouTube todavía no cargó, queda
// pendiente igual que el reproductor de palabra.
function iniciarReproductorNosotros() {
    if (ytPlayerNosotros) return; // ya está creado, no se recrea
    if (ytApiListo) {
        crearReproductorNosotrosCuandoVisible(ID_VIDEO_NOSOTROS);
    } else {
        ytVideoNosotrosPendiente = ID_VIDEO_NOSOTROS;
    }
}

// El margen fijo de "2 frames" no siempre alcanzaba: si justo en ese
// momento el navegador todavía estaba ocupado con otro trabajo pesado
// (típico recién refrescada la página, con muchas cosas cargando a la
// vez), el contenedor podía seguir midiendo 0 y el reproductor de
// YouTube se creaba con tamaño 0, quedando en negro. Acá, en vez de
// asumir que 2 frames alcanzan, se comprueba el tamaño real del
// contenedor cuadro a cuadro y solo se crea el reproductor cuando ya
// mide algo (o, como límite de seguridad, tras ~1 segundo igual se
// crea, para no quedarse esperando para siempre si algo impide que el
// contenedor llegue a tener tamaño).
function crearReproductorNosotrosCuandoVisible(videoId, intentosRestantes) {
    if (typeof intentosRestantes !== "number") intentosRestantes = 60; // tope de seguridad: ~1s a 60fps
    const contenedor = document.getElementById("reproductorNosotros");
    const rect = contenedor ? contenedor.getBoundingClientRect() : null;
    const yaTieneTamano = rect && rect.width > 0 && rect.height > 0;
    if (yaTieneTamano || intentosRestantes <= 0) {
        crearReproductorNosotros(videoId);
        return;
    }
    requestAnimationFrame(() => crearReproductorNosotrosCuandoVisible(videoId, intentosRestantes - 1));
}

function crearReproductorNosotros(videoId) {
    const contenedor = document.getElementById("reproductorNosotros");
    if (!contenedor) return;
    ytPlayerNosotros = new YT.Player("reproductorNosotros", {
        videoId: videoId,
        playerVars: { rel: 0, modestbranding: 1, controls: 1, disablekb: 1, fs: 0, iv_load_policy: 3, autoplay: 1 },
        events: {
            onReady: configurarControlesVideoNosotros,
            onStateChange: actualizarBotonPlayPauseNosotros
        }
    });
}

// Al tocar el título o cualquier párrafo de un bloque del texto de
// "Sobre Nosotros" (ver [data-tiempo-nosotros] en el HTML), el video
// salta directo a la parte donde se explica ese tema, igual que el
// comportamiento de la Watchtower Online (wol.jw.org): el video queda
// fijo arriba (ver .nosotros-video-wrap.nosotros-fijo en el CSS) y el
// texto se desplaza debajo, así siempre se ve mientras se lee. Si el
// reproductor todavía no existe (la sección no se abrió antes), se crea
// primero y se guarda el segundo pedido para saltarlo apenas esté listo.
let nosotrosSegundoPendiente = null;
function saltarVideoNosotros(segundos) {
    const wrap = document.getElementById("nosotrosVideoWrap");
    if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!ytPlayerNosotros || typeof ytPlayerNosotros.seekTo !== "function") {
        nosotrosSegundoPendiente = segundos;
        iniciarReproductorNosotros();
        return;
    }
    ytPlayerNosotros.seekTo(segundos, true);
    ytPlayerNosotros.playVideo();
}
window.saltarVideoNosotros = saltarVideoNosotros;

// El video de "Sobre Nosotros" es position:fixed (ver .nosotros-fijo en
// el CSS), así que no ocupa espacio real en el flujo del documento. El
// texto que sigue (#nosotrosTextoBajoVideo) necesita un padding-top
// exactamente del alto del video+leyenda+controles para que, al entrar
// a la sección, arranque justo debajo de él en vez de escondido detrás
// desde el principio. Se mide el alto real (no un número fijo) porque
// cambia según el ancho de pantalla (el video es 16:9 dentro de un
// contenedor de ancho variable) y según si el texto de los botones se
// oculta en celulares chicos (ver los estilos de .controles-video).
function ajustarEspacioVideoNosotros() {
    const video = document.getElementById("nosotrosVideoWrap");
    const texto = document.getElementById("nosotrosTextoBajoVideo");
    if (!video || !texto) return;
    const alturaVideo = video.getBoundingClientRect().height;
    if (alturaVideo > 0) {
        texto.style.paddingTop = (alturaVideo + 24) + "px";
    }
}
window.addEventListener("resize", () => {
    const seccion = document.getElementById("seccionNosotros");
    if (seccion && !seccion.classList.contains("d-none")) {
        ajustarEspacioVideoNosotros();
    }
});

// Un solo listener delegado (en vez de uno por título/párrafo) alcanza
// para los 4 bloques del texto de "Sobre Nosotros": cualquier clic
// dentro de un elemento [data-tiempo-nosotros] (o alguno de sus hijos,
// como los <li> de la lista) hace saltar el video a ese segundo.
document.addEventListener("click", (e) => {
    const elClicable = e.target.closest("[data-tiempo-nosotros]");
    if (!elClicable) return;
    const segundos = parseInt(elClicable.getAttribute("data-tiempo-nosotros"), 10);
    if (!isNaN(segundos)) saltarVideoNosotros(segundos);
});
document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const elClicable = e.target.closest("[data-tiempo-nosotros]");
    if (!elClicable) return;
    e.preventDefault();
    const segundos = parseInt(elClicable.getAttribute("data-tiempo-nosotros"), 10);
    if (!isNaN(segundos)) saltarVideoNosotros(segundos);
});

function configurarControlesVideoNosotros() {
    const btnRetroceder = document.getElementById("btnRetroceder10Nosotros");
    const btnAvanzar = document.getElementById("btnAvanzar10Nosotros");
    const btnPlayPause = document.getElementById("btnPlayPauseNosotros");
    const btnReiniciar = document.getElementById("btnReiniciarNosotros");
    const btnVelocidadLenta = document.getElementById("btnNosotrosVelocidadLenta");
    const btnVelocidadRapida = document.getElementById("btnNosotrosVelocidadRapida");
    const btnPantallaCompleta = document.getElementById("btnNosotrosPantallaCompleta");
    if (!btnRetroceder || !btnAvanzar || !btnPlayPause || !btnReiniciar || !btnVelocidadLenta || !btnVelocidadRapida || !ytPlayerNosotros) return;

    // Salvaguarda extra contra el video en negro: si aun con los 2 frames
    // de margen (ver mostrarSeccionNosotros y onYouTubeIframeAPIReady) el
    // reproductor se creó cuando el contenedor todavía no tenía su tamaño
    // real, acá -ya en el evento onReady del propio reproductor- se le
    // fuerza un resize con las dimensiones reales ya calculadas del
    // contenedor, en vez de quedar congelado con el tamaño 0 con el que
    // se haya creado.
    const contenedorVideoNosotros = document.getElementById("nosotrosVideoRatio");
    if (contenedorVideoNosotros && typeof ytPlayerNosotros.setSize === "function") {
        const rectVideoNosotros = contenedorVideoNosotros.getBoundingClientRect();
        if (rectVideoNosotros.width > 0 && rectVideoNosotros.height > 0) {
            ytPlayerNosotros.setSize(rectVideoNosotros.width, rectVideoNosotros.height);
        }
    }

    // Si se tocó un título/párrafo del texto ANTES de que el reproductor
    // terminara de crearse (ver saltarVideoNosotros), el salto quedó
    // pendiente acá: se aplica apenas el reproductor ya está listo.
    if (nosotrosSegundoPendiente !== null) {
        const segundoPendiente = nosotrosSegundoPendiente;
        nosotrosSegundoPendiente = null;
        ytPlayerNosotros.seekTo(segundoPendiente, true);
        ytPlayerNosotros.playVideo();
    }
    ajustarEspacioVideoNosotros();

    btnRetroceder.addEventListener("click", () => {
        const tiempoActual = ytPlayerNosotros.getCurrentTime();
        ytPlayerNosotros.seekTo(Math.max(0, tiempoActual - 3), true);
    });

    btnAvanzar.addEventListener("click", () => {
        const tiempoActual = ytPlayerNosotros.getCurrentTime();
        const duracion = ytPlayerNosotros.getDuration();
        ytPlayerNosotros.seekTo(Math.min(duracion, tiempoActual + 5), true);
    });

    btnPlayPause.addEventListener("click", () => {
        const estado = ytPlayerNosotros.getPlayerState();
        if (estado === YT.PlayerState.PLAYING) {
            ytPlayerNosotros.pauseVideo();
        } else {
            ytPlayerNosotros.playVideo();
        }
    });

    btnReiniciar.addEventListener("click", () => {
        ytPlayerNosotros.seekTo(0, true);
        ytPlayerNosotros.playVideo();
    });

    nosotrosVelocidadIndex = VELOCIDADES_PALABRA.indexOf(1);    ytPlayerNosotros.setPlaybackRate(1);
    actualizarLabelVelocidadNosotros();

    btnVelocidadLenta.addEventListener("click", () => cambiarVelocidadNosotros(-1));
    btnVelocidadRapida.addEventListener("click", () => cambiarVelocidadNosotros(1));

    if (btnPantallaCompleta) {
        btnPantallaCompleta.addEventListener("click", toggleNosotrosPantallaCompleta);
    }
}

function cambiarVelocidadNosotros(delta) {
    if (!ytPlayerNosotros) return;
    const max = VELOCIDADES_PALABRA.length - 1;
    nosotrosVelocidadIndex = Math.min(max, Math.max(0, nosotrosVelocidadIndex + delta));
    ytPlayerNosotros.setPlaybackRate(VELOCIDADES_PALABRA[nosotrosVelocidadIndex]);
    actualizarLabelVelocidadNosotros();
}

function actualizarLabelVelocidadNosotros() {
    const label = document.getElementById("nosotrosVelocidadLabel");
    if (label) label.textContent = VELOCIDADES_PALABRA[nosotrosVelocidadIndex] + "x";
}

function actualizarBotonPlayPauseNosotros(evento) {
    const btnPlayPause = document.getElementById("btnPlayPauseNosotros");
    if (!btnPlayPause) return;
    const reproduciendo = evento.data === YT.PlayerState.PLAYING;
    btnPlayPause.innerHTML = reproduciendo
        ? '⏸ <span class="controles-video-texto">Pausar</span>'
        : '<span class="nosotros-icono-iniciar">▶</span> <span class="controles-video-texto">Iniciar</span>';
    alternarTapaPausaYoutube("nosotrosVideoRatio", evento);
}

// Ver comentario en estilos.css (junto a .yt-pausado): agrega/quita la
// clase que muestra los dos parches negros que tapan la barra "Compartir /
// Ver más tarde" y el logo de YouTube que aparecen solos al pausar,
// aunque el reproductor tenga controls:0.
function alternarTapaPausaYoutube(wrapId, evento) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const enPausaOTerminado = evento.data === YT.PlayerState.PAUSED || evento.data === YT.PlayerState.ENDED;
    wrap.classList.toggle("yt-pausado", enPausaOTerminado);
}

// Ventana flotante y arrastrable del video de "Sobre Nosotros": el usuario
// mantiene presionada la barrita superior (#nosotrosArrastre, ver HTML) y
// la mueve a cualquier parte de la pantalla. Se usan Pointer Events porque
// funcionan igual con mouse, lápiz o dedo, sin necesitar código aparte
// para touch. La posición queda guardada en nosotrosPosicionGuardada para
// poder restaurarla al salir de pantalla completa (ver
// toggleNosotrosPantallaCompleta), que mientras tanto la desactiva porque
// ahí el video ocupa toda la pantalla y no tiene sentido arrastrarlo.
let nosotrosArrastrando = false;
let nosotrosArrastreOffsetX = 0;
let nosotrosArrastreOffsetY = 0;
let nosotrosPosicionGuardada = null;

function configurarArrastreNosotros() {
    const wrap = document.getElementById("nosotrosVideoWrap");
    const manija = document.getElementById("nosotrosArrastre");
    const barraControles = wrap ? wrap.querySelector(".controles-video") : null;
    if (!wrap || !manija) return;

    function moverA(x, y) {
        const margen = 4;
        const maxX = Math.max(margen, window.innerWidth - wrap.offsetWidth - margen);
        const maxY = Math.max(margen, window.innerHeight - wrap.offsetHeight - margen);
        const nuevoX = Math.max(margen, Math.min(x, maxX));
        const nuevoY = Math.max(margen, Math.min(y, maxY));
        wrap.style.left = nuevoX + "px";
        wrap.style.top = nuevoY + "px";
        wrap.style.transform = "none";
        nosotrosPosicionGuardada = { left: nuevoX, top: nuevoY };
    }

    function empezarArrastre(e, elemento) {
        if (wrap.classList.contains("nosotros-pantalla-completa")) return;
        const rect = wrap.getBoundingClientRect();
        nosotrosArrastreOffsetX = e.clientX - rect.left;
        nosotrosArrastreOffsetY = e.clientY - rect.top;
        nosotrosArrastrando = true;
        wrap.classList.add("nosotros-arrastrando");
        elemento.setPointerCapture(e.pointerId);
        e.preventDefault();
    }

    function soltar(e, elemento) {
        if (!nosotrosArrastrando) return;
        nosotrosArrastrando = false;
        wrap.classList.remove("nosotros-arrastrando");
        try { elemento.releasePointerCapture(e.pointerId); } catch (err) { /* ya liberado */ }
    }

    // Mango dedicado (la barrita "⠿ ⠿ ⠿"): arrastra desde cualquier punto.
    manija.addEventListener("pointerdown", (e) => empezarArrastre(e, manija));
    manija.addEventListener("pointermove", (e) => {
        if (nosotrosArrastrando) moverA(e.clientX - nosotrosArrastreOffsetX, e.clientY - nosotrosArrastreOffsetY);
    });
    manija.addEventListener("pointerup", (e) => soltar(e, manija));
    manija.addEventListener("pointercancel", (e) => soltar(e, manija));

    // Barra de controles: también arrastra desde cualquier parte de ella,
    // EXCEPTO si el toque cae justo sobre un botón (o la píldora de
    // velocidad), para no interferir con sus clics normales. closest()
    // sube desde el punto exacto tocado, así que un toque en el "aire"
    // entre botones (o en su padding) sigue iniciando el arrastre.
    if (barraControles) {
        barraControles.addEventListener("pointerdown", (e) => {
            if (e.target.closest("button, .controles-video-velocidad")) return;
            empezarArrastre(e, barraControles);
        });
        barraControles.addEventListener("pointermove", (e) => {
            if (nosotrosArrastrando) moverA(e.clientX - nosotrosArrastreOffsetX, e.clientY - nosotrosArrastreOffsetY);
        });
        barraControles.addEventListener("pointerup", (e) => soltar(e, barraControles));
        barraControles.addEventListener("pointercancel", (e) => soltar(e, barraControles));
    }

    // Si la ventana del navegador cambia de tamaño (o gira el celular) y
    // la posición guardada queda fuera del área visible, se reubica
    // dentro de los límites en vez de dejarla cortada fuera de pantalla.
    window.addEventListener("resize", () => {
        if (nosotrosPosicionGuardada && !wrap.classList.contains("nosotros-pantalla-completa")) {
            moverA(nosotrosPosicionGuardada.left, nosotrosPosicionGuardada.top);
        }
    });
}
document.addEventListener("DOMContentLoaded", configurarArrastreNosotros);

// Vista "pantalla completa" del video de Sobre Nosotros: es un overlay
// dentro de la misma ventana (no usa requestFullscreen), así la barra de
// direcciones del navegador se mantiene visible. Se cierra con el mismo
// botón, con la tecla Escape, o al salir de la sección "Sobre Nosotros".
function toggleNosotrosPantallaCompleta(forzarCerrar) {
    const wrap = document.getElementById("nosotrosVideoWrap");
    const btn = document.getElementById("btnNosotrosPantallaCompleta");
    if (!wrap) return;

    const cerrar = forzarCerrar === true || nosotrosPantallaCompletaActiva;
    nosotrosPantallaCompletaActiva = !cerrar;

    wrap.classList.toggle("nosotros-pantalla-completa", nosotrosPantallaCompletaActiva);
    document.body.classList.toggle("nosotros-pantalla-completa-activa", nosotrosPantallaCompletaActiva);

    // La ventana flotante (ver configurarArrastreNosotros) usa left/top/
    // transform en línea. En pantalla completa eso debe desaparecer para
    // que el overlay ocupe toda la pantalla; al salir, se restaura donde
    // el usuario la había dejado (si nunca la arrastró, vuelve sola a su
    // posición centrada de siempre).
    if (nosotrosPantallaCompletaActiva) {
        wrap.style.left = "";
        wrap.style.top = "";
        wrap.style.transform = "";
    } else if (nosotrosPosicionGuardada) {
        wrap.style.left = nosotrosPosicionGuardada.left + "px";
        wrap.style.top = nosotrosPosicionGuardada.top + "px";
        wrap.style.transform = "none";
    }

    if (btn) {
        btn.innerHTML = nosotrosPantallaCompletaActiva ? "✕ Salir" : "⛶";
        btn.title = nosotrosPantallaCompletaActiva ? "Salir de pantalla completa" : "Ver en pantalla completa";
        btn.setAttribute("aria-label", btn.title);
    }

    if (nosotrosPantallaCompletaActiva) {
        document.addEventListener("keydown", salirNosotrosPantallaCompletaConEscape);
    } else {
        document.removeEventListener("keydown", salirNosotrosPantallaCompletaConEscape);
    }
    // El tamaño del video cambia al entrar/salir de pantalla completa,
    // así que el espacio reservado arriba del texto (ver
    // ajustarEspacioVideoNosotros) debe recalcularse en ambos casos.
    setTimeout(ajustarEspacioVideoNosotros, 60);
}

function salirNosotrosPantallaCompletaConEscape(evento) {
    if (evento.key === "Escape") {
        toggleNosotrosPantallaCompleta(true);
    }
}

// Vista "pantalla completa" reutilizable para los videos del diccionario
// (video principal "Significado" y "Seña sugerida"): mismo patrón que
// toggleNosotrosPantallaCompleta (overlay dentro de la misma ventana, sin
// requestFullscreen, así la barra de direcciones se mantiene visible).
// Se cierra con el mismo botón, con Escape, o automáticamente al mostrar
// otra palabra (ver cerrarPantallaCompletaVideoPalabra()).
let wrapIdPantallaCompletaActiva = null;

function toggleVideoPalabraPantallaCompleta(wrapId, btnId, forzarCerrar) {
    const wrap = document.getElementById(wrapId);
    const btn = document.getElementById(btnId);
    if (!wrap) return;

    const cerrar = forzarCerrar === true || wrapIdPantallaCompletaActiva === wrapId;
    const activar = !cerrar;

    wrap.classList.toggle("video-palabra-pantalla-completa", activar);
    document.body.classList.toggle("video-palabra-pantalla-completa-activa", activar);

    if (btn) {
        btn.innerHTML = activar ? "✕ Salir" : "⛶";
        btn.title = activar ? "Salir de pantalla completa" : "Ver en pantalla completa";
        btn.setAttribute("aria-label", btn.title);
    }

    if (activar) {
        wrapIdPantallaCompletaActiva = wrapId;
        wrapIdBtnPantallaCompletaActiva = btnId;
        document.addEventListener("keydown", salirVideoPalabraPantallaCompletaConEscape);
    } else {
        wrapIdPantallaCompletaActiva = null;
        wrapIdBtnPantallaCompletaActiva = null;
        document.removeEventListener("keydown", salirVideoPalabraPantallaCompletaConEscape);
    }
}
let wrapIdBtnPantallaCompletaActiva = null;

function salirVideoPalabraPantallaCompletaConEscape(evento) {
    if (evento.key === "Escape" && wrapIdPantallaCompletaActiva) {
        toggleVideoPalabraPantallaCompleta(wrapIdPantallaCompletaActiva, wrapIdBtnPantallaCompletaActiva, true);
    }
}

// Se llama al mostrar cualquier palabra nueva (o su versión simplificada),
// para no dejar un video "pegado" en pantalla completa al navegar a otra ficha.
function cerrarPantallaCompletaVideoPalabra() {
    if (wrapIdPantallaCompletaActiva) {
        toggleVideoPalabraPantallaCompleta(wrapIdPantallaCompletaActiva, wrapIdBtnPantallaCompletaActiva, true);
    }
}

function inicializarReproductorPalabra(videoId, opciones = {}) {
    ajustarAspectoReproductorPalabra(videoId);
    if (ytApiListo) {
        crearReproductorPalabra(videoId, opciones);
    } else {
        // La API todavía no cargó: guardamos el video (y estas opciones) y
        // se crea en cuanto esté lista.
        ytVideoIdPendiente = videoId;
        ytOpcionesReproductorPalabraPendiente = opciones;
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

function crearReproductorPalabra(videoId, opciones = {}) {
    const contenedor = document.getElementById("reproductorPalabra");
    if (!contenedor) return;
    if (ytPlayerPalabra && typeof ytPlayerPalabra.destroy === "function") {
        ytPlayerPalabra.destroy();
    }
    const autoreproducirEnBucle = !!opciones.autoreproducirEnBucle;
    const autoreproducir = autoreproducirEnBucle || !!opciones.autoreproducir;
    // "loop" solo funciona en un video suelto (sin playlist real) si además
    // se le pasa "playlist" con ese mismo id — así lo exige la API de
    // YouTube. "mute" es obligatorio: los navegadores bloquean la
    // autoreproducción con sonido si la persona no interactuó antes con la
    // página; el video igual se puede desmutear a mano desde sus propios
    // controles.
    // controls:1 deja los controles nativos de YouTube (más videos, ver en
    // YouTube, etc.), que conviven con los botones propios de abajo.
    const playerVars = autoreproducirEnBucle
        ? { rel: 0, modestbranding: 1, controls: 1, disablekb: 1, fs: 0, iv_load_policy: 3, autoplay: 1, mute: 1, loop: 1, playlist: videoId }
        : autoreproducir
            ? { rel: 0, modestbranding: 1, controls: 1, disablekb: 1, fs: 0, iv_load_policy: 3, autoplay: 1, mute: 1 }
            : { rel: 0, modestbranding: 1, controls: 1, disablekb: 1, fs: 0, iv_load_policy: 3 };
    ytPlayerPalabra = new YT.Player("reproductorPalabra", {
        videoId: videoId,
        playerVars: playerVars,
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
    const btnPantallaCompleta = document.getElementById("btnPalabraFullscreen");
    if (!btnRetroceder || !btnAvanzar || !btnPlayPause || !btnReiniciar || !btnVelocidadLenta || !btnVelocidadRapida || !ytPlayerPalabra) return;

    if (btnPantallaCompleta) {
        btnPantallaCompleta.addEventListener("click", () => toggleVideoPalabraPantallaCompleta("reproductorPalabraWrap", "btnPalabraFullscreen"));
    }

    btnRetroceder.addEventListener("click", () => {
        const tiempoActual = ytPlayerPalabra.getCurrentTime();
        ytPlayerPalabra.seekTo(Math.max(0, tiempoActual - 1), true);
    });

    btnAvanzar.addEventListener("click", () => {
        const tiempoActual = ytPlayerPalabra.getCurrentTime();
        const duracion = ytPlayerPalabra.getDuration();
        ytPlayerPalabra.seekTo(Math.min(duracion, tiempoActual + 3), true);
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
    btnPlayPause.innerHTML = evento.data === YT.PlayerState.PLAYING
        ? '⏸ <span class="controles-video-texto">Pausar</span>'
        : '▶️ <span class="controles-video-texto">Iniciar</span>';
    alternarTapaPausaYoutube("reproductorPalabraWrap", evento);
}

// --- REPRODUCTOR DE VIDEO CONTROLABLE PARA "SEÑA SUGERIDA" (columna G,
// senaSugerida, de la Hoja 1). Es una copia independiente del reproductor
// principal (misma API de YouTube, mismos controles: pausar, reiniciar,
// retroceder/avanzar y velocidad) pero con su propia instancia y sus
// propios IDs, para poder mostrarse al mismo tiempo que el video principal
// sin que ambos reproductores se pisen entre sí. ---
let ytPlayerSugerida = null;
// ytVideoIdSugeridaPendiente ahora se declara más arriba, junto a
// ytVideoIdPendiente (ver comentario ahí) — la usa onYouTubeIframeAPIReady,
// que puede llamarse antes de llegar hasta acá.
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
        playerVars: { rel: 0, modestbranding: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3 },
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
    const btnPantallaCompleta = document.getElementById("btnSugeridaFullscreen");
    if (!btnRetroceder || !btnAvanzar || !btnPlayPause || !btnReiniciar || !btnVelocidadLenta || !btnVelocidadRapida || !ytPlayerSugerida) return;

    if (btnPantallaCompleta) {
        btnPantallaCompleta.addEventListener("click", () => toggleVideoPalabraPantallaCompleta("reproductorSugeridaWrap", "btnSugeridaFullscreen"));
    }

    const overlaySugerida = document.getElementById("overlaySugerida");
    if (overlaySugerida) {
        overlaySugerida.addEventListener("click", () => btnPlayPause.click());
    }

    btnRetroceder.addEventListener("click", () => {
        const tiempoActual = ytPlayerSugerida.getCurrentTime();
        ytPlayerSugerida.seekTo(Math.max(0, tiempoActual - 1), true);
    });

    btnAvanzar.addEventListener("click", () => {
        const tiempoActual = ytPlayerSugerida.getCurrentTime();
        const duracion = ytPlayerSugerida.getDuration();
        ytPlayerSugerida.seekTo(Math.min(duracion, tiempoActual + 3), true);
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
    btnPlayPause.textContent = evento.data === YT.PlayerState.PLAYING ? "⏸ Pausar" : "▶️ Iniciar";
    alternarTapaPausaYoutube("reproductorSugeridaWrap", evento);
}

// --- AMPLIAR IMAGEN DE APOYO VISUAL (con zoom) ---
function abrirImagenAmpliada(url, palabra){
    const imgAmpliada = document.getElementById("imgAmpliadaContenido");
    const tituloAmpliada = document.getElementById("tituloImagenAmpliada");
    if(!imgAmpliada) return;
    imgAmpliada.src = url;
    imgAmpliada.alt = `Imagen de apoyo visual para ${palabra}`;
    if(tituloAmpliada) tituloAmpliada.textContent = palabra;
    inicializarZoomImagenAmpliada();
    resetearZoomImagen();
    const modalEl = document.getElementById("modalImagenAmpliada");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

// --- ZOOM DE LA IMAGEN AMPLIADA ---
// Estado del zoom del modal. Vive fuera de las funciones para persistir
// entre aperturas, pero se resetea cada vez que se abre una imagen nueva
// (ver resetearZoomImagen(), llamada desde abrirImagenAmpliada()).
const estadoZoomImagen = {
    nivel: 1,
    minimo: 1,
    maximo: 4,
    paso: 0.6,
    desplazX: 0,
    desplazY: 0,
    arrastrando: false,
    inicioX: 0,
    inicioY: 0,
    inicioDesplazX: 0,
    inicioDesplazY: 0,
    listenersListos: false
};

function aplicarTransformZoomImagen(){
    const img = document.getElementById("imgAmpliadaContenido");
    if(!img) return;
    img.style.transform = `translate(${estadoZoomImagen.desplazX}px, ${estadoZoomImagen.desplazY}px) scale(${estadoZoomImagen.nivel})`;
    const etiqueta = document.getElementById("zoomImagenNivel");
    if(etiqueta) etiqueta.textContent = Math.round(estadoZoomImagen.nivel * 100) + "%";
    const contenedor = document.getElementById("zoomImagenContenedor");
    if(contenedor) contenedor.classList.toggle("zoom-activo", estadoZoomImagen.nivel > 1);
}

function resetearZoomImagen(){
    estadoZoomImagen.nivel = 1;
    estadoZoomImagen.desplazX = 0;
    estadoZoomImagen.desplazY = 0;
    aplicarTransformZoomImagen();
}

function cambiarZoomImagen(delta){
    const nuevoNivel = Math.min(estadoZoomImagen.maximo, Math.max(estadoZoomImagen.minimo, estadoZoomImagen.nivel + delta));
    if(nuevoNivel === estadoZoomImagen.nivel) return;
    estadoZoomImagen.nivel = nuevoNivel;
    if(nuevoNivel === estadoZoomImagen.minimo){
        // vuelve a 1x: se recentra, sin desplazamiento residual
        estadoZoomImagen.desplazX = 0;
        estadoZoomImagen.desplazY = 0;
    }
    aplicarTransformZoomImagen();
}

// Registra los listeners de zoom UNA sola vez (el modal es el mismo
// elemento del DOM siempre, solo cambia la imagen que muestra).
function inicializarZoomImagenAmpliada(){
    if(estadoZoomImagen.listenersListos) return;
    estadoZoomImagen.listenersListos = true;

    const contenedor = document.getElementById("zoomImagenContenedor");
    const btnMas = document.getElementById("btnZoomIn");
    const btnMenos = document.getElementById("btnZoomOut");
    const btnReset = document.getElementById("btnZoomReset");
    if(!contenedor) return;

    // Clic simple: alterna entre 1x y 2.5x (comportamiento típico de "lightbox").
    contenedor.addEventListener("click", () => {
        if(estadoZoomImagen.arrastrando) return; // que un arrastre no cuente como clic
        if(estadoZoomImagen.nivel > 1){
            resetearZoomImagen();
        } else {
            estadoZoomImagen.nivel = 2.5;
            aplicarTransformZoomImagen();
        }
    });

    // Rueda del mouse: zoom continuo, sin necesidad de mantener Ctrl.
    contenedor.addEventListener("wheel", (ev) => {
        ev.preventDefault();
        cambiarZoomImagen(ev.deltaY < 0 ? 0.4 : -0.4);
    }, { passive: false });

    // Arrastrar para desplazar la imagen cuando está ampliada (mouse y táctil).
    const empezarArrastre = (x, y) => {
        if(estadoZoomImagen.nivel <= 1) return;
        estadoZoomImagen.arrastrando = true;
        estadoZoomImagen.inicioX = x;
        estadoZoomImagen.inicioY = y;
        estadoZoomImagen.inicioDesplazX = estadoZoomImagen.desplazX;
        estadoZoomImagen.inicioDesplazY = estadoZoomImagen.desplazY;
        contenedor.classList.add("arrastrando");
    };
    const moverArrastre = (x, y) => {
        if(!estadoZoomImagen.arrastrando) return;
        estadoZoomImagen.desplazX = estadoZoomImagen.inicioDesplazX + (x - estadoZoomImagen.inicioX);
        estadoZoomImagen.desplazY = estadoZoomImagen.inicioDesplazY + (y - estadoZoomImagen.inicioY);
        aplicarTransformZoomImagen();
    };
    const terminarArrastre = () => {
        if(!estadoZoomImagen.arrastrando) return;
        estadoZoomImagen.arrastrando = false;
        contenedor.classList.remove("arrastrando");
    };

    contenedor.addEventListener("mousedown", (ev) => { ev.preventDefault(); empezarArrastre(ev.clientX, ev.clientY); });
    window.addEventListener("mousemove", (ev) => moverArrastre(ev.clientX, ev.clientY));
    window.addEventListener("mouseup", terminarArrastre);

    contenedor.addEventListener("touchstart", (ev) => {
        if(ev.touches.length === 1) empezarArrastre(ev.touches[0].clientX, ev.touches[0].clientY);
    }, { passive: true });
    contenedor.addEventListener("touchmove", (ev) => {
        if(ev.touches.length === 1){ ev.preventDefault(); moverArrastre(ev.touches[0].clientX, ev.touches[0].clientY); }
    }, { passive: false });
    contenedor.addEventListener("touchend", terminarArrastre);

    if(btnMas) btnMas.addEventListener("click", (ev) => { ev.stopPropagation(); cambiarZoomImagen(estadoZoomImagen.paso); });
    if(btnMenos) btnMenos.addEventListener("click", (ev) => { ev.stopPropagation(); cambiarZoomImagen(-estadoZoomImagen.paso); });
    if(btnReset) btnReset.addEventListener("click", (ev) => { ev.stopPropagation(); resetearZoomImagen(); });

    // Al cerrar el modal, siempre se resetea el zoom para la próxima apertura.
    const modalEl = document.getElementById("modalImagenAmpliada");
    if(modalEl) modalEl.addEventListener("hidden.bs.modal", resetearZoomImagen);
}

// --- ESTADÍSTICAS ---
// Ahora son "generales": combinan el Diccionario (Hoja 1, App.datos, ya
// filtrado a solo palabras con video) y el Vocabulario (Hoja 2, el mismo
// banco que usa el Quiz), no solo el Diccionario como antes. El número
// grande de cada tarjeta es el total sin repetir (una palabra o categoría
// que exista en ambas cuenta una sola vez); el texto pequeño de abajo
// muestra cuánto aporta cada sección por separado.
function actualizarEstadisticas(){
    const bancoHoja2 = obtenerBancoHoja2();
    const normalizar = (s) => (s || "").trim().toLowerCase();

    // --- Palabras ---
    const palabrasDiccionario = App.datos.map(p => normalizar(p.palabra));
    const palabrasVocabulario = bancoHoja2
        .filter(p => p.palabra && p.video && p.video.trim() !== "")
        .map(p => normalizar(p.palabra));
    const totalPalabrasUnicas = new Set(palabrasDiccionario.concat(palabrasVocabulario)).size;

    totalPalabras.textContent = totalPalabrasUnicas;
    const detallePalabras = document.getElementById("detallePalabrasStats");
    if (detallePalabras) {
        const elPalDic = document.getElementById("detallePalabrasDic");
        const elPalVoc = document.getElementById("detallePalabrasVoc");
        if (elPalDic) elPalDic.textContent = palabrasDiccionario.length;
        if (elPalVoc) elPalVoc.textContent = palabrasVocabulario.length;
    }

    // --- Categorías ---
    const categoriasDiccionario = App.datos.map(p => normalizar(p.categoria));
    const categoriasVocabulario = bancoHoja2
        .filter(p => p.categoria && p.categoria.trim() !== "")
        .map(p => normalizar(p.categoria));
    const totalCategoriasUnicas = new Set(categoriasDiccionario.concat(categoriasVocabulario)).size;

    totalCategorias.textContent = totalCategoriasUnicas;
    const detalleCategorias = document.getElementById("detalleCategoriasStats");
    if (detalleCategorias) {
        const elCatDic = document.getElementById("detalleCategoriasDic");
        const elCatVoc = document.getElementById("detalleCategoriasVoc");
        if (elCatDic) elCatDic.textContent = new Set(categoriasDiccionario).size;
        if (elCatVoc) elCatVoc.textContent = new Set(categoriasVocabulario).size;
    }

    // --- Videos ---
    // Acá NO se deduplica: cada archivo de video cuenta, aunque dos
    // palabras compartan el mismo texto entre secciones. Diccionario:
    // video principal (columna "video") + seña sugerida (columna
    // "senasugerida"). Vocabulario: un video por palabra.
    const videosHoja1 = App.datos.filter(p => p.video && p.video.trim() !== "").length;
    const senasSugeridas = App.datos.filter(p => p.senasugerida && p.senasugerida.trim() !== "").length;
    const videosDiccionario = videosHoja1 + senasSugeridas;
    const videosVocabulario = bancoHoja2.filter(p => p.video && p.video.trim() !== "").length;

    totalVideos.textContent = videosDiccionario + videosVocabulario;
    const detalleVideos = document.getElementById("detalleVideosStats");
    if (detalleVideos) {
        const elVidDic = document.getElementById("detalleVideosDic");
        const elVidVoc = document.getElementById("detalleVideosVoc");
        if (elVidDic) elVidDic.textContent = videosDiccionario;
        if (elVidVoc) elVidVoc.textContent = videosVocabulario;
    }
}

// --- FILTRO ABC ---
function filtrarPorLetra(letra) {
    ocultarQuiz();
    ocultarAlfabetizacion();
    document.querySelectorAll(".btn-abc").forEach(boton => {
        boton.classList.toggle("active", boton.textContent.trim().toUpperCase() === letra.toUpperCase());
    });
    buscar.value = ""; 
    sugerencias.innerHTML = "";
    sugerencias.style.display = "none";
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    resultadoCategoriasDiccionario.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = ""; 
    ocultarPanelesGuardados();
    // Igual que al elegir una tarjeta de Categoría: la sección
    // "Categorías" (#filaCategoriasDiccionario) ya no se oculta al
    // filtrar por letra, se deja siempre visible debajo del teclado
    // A-Z. Solo se sigue ocultando el panel de Estadísticas, para no
    // competir visualmente con el listado de resultados.
    const statsPanelLetra = document.querySelector(".stats-panel-destacado");
    if(statsPanelLetra) statsPanelLetra.style.display = "none";
    const statsHeaderLetra = document.querySelector(".stats-header");
    if(statsHeaderLetra) statsHeaderLetra.style.display = "none";
    window.history.pushState({}, '', window.location.pathname);
    const filtradas = App.datos.filter(p => p.palabra.toUpperCase().startsWith(letra.toUpperCase()));
    if (filtradas.length === 0) {
        resultado.innerHTML = `<div class="alert alert-light border text-center text-muted small py-3" style="border-radius: 12px;">No hay resultados con <strong>${letra}</strong>.</div>`;
        return;
    }
    // Mismo estilo de tarjeta que usa filtrarPorCategoriaDiccionario():
    // miniatura del video + nombre + botón "Ver Seña", en una cuadrícula
    // (categoria-resultados-grid), en vez de la fila simple de antes.
    // Se arma todo el HTML en una sola variable y se asigna de una vez,
    // igual que allá, para evitar múltiples reflujos/reflows.
    let htmlResultado = `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Resultados con: ${letra}</h6>
    <div class="categoria-resultados-grid">`;
    filtradas.forEach((p, i) => {
        const nombreEscapado = p.palabra.replace(/'/g, "\\'");
        htmlResultado += `
        <button type="button" class="categoria-resultado-item shadow-sm" style="animation-delay: ${Math.min(i, 20) * 0.04}s" onclick="mostrarPalabraPorNombre('${nombreEscapado}')">
            ${generarMiniaturaVocabulario(p)}
            <span class="categoria-resultado-titulo">${p.palabra}</span>
            <span class="btn btn-sm btn-primary fw-bold categoria-resultado-boton">${ICONO_OJO_SVG} Ver Seña</span>
        </button>`;
    });
    htmlResultado += `</div>`;
    resultado.innerHTML = htmlResultado;
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

// --- IMAGEN DE RESPALDO POR CATEGORÍA (Vocabulario) ---
// Si una palabra de Vocabulario (Hoja 2) todavía no tiene su propia
// imagen, se usa la de su categoría aquí abajo (si existe) en vez de
// dejar el hueco "Imagen próximamente". Para activarla, agrega la URL de
// una imagen entre las comillas, con el nombre EXACTO de la categoría tal
// como aparece en la Hoja 2 (columna "categoria"). Ejemplo:
// "Saludos": "https://misitio.com/imagenes/saludos.jpg",
const IMAGENES_CATEGORIA = {
    // "Saludos": "",
    // "Colores": "",
};

// Arma el bloque de "imagen de apoyo" (una sola imagen con clic para
// ampliar, o carrusel si hay varias) a partir de una lista de URLs ya
// separadas. La usan tanto mostrarPalabra() (Diccionario, Hoja 1) como
// mostrarPalabraSimplificada() (Vocabulario, Hoja 2), para que ambas
// vistas se vean y se comporten igual.
function generarBloqueImagenApoyo(imagenesPalabra, nombrePalabra){
    const escaparComillasImg = (texto) => texto.replace(/'/g, "\\'");
    if(imagenesPalabra.length === 0){
        return `<div class="d-flex flex-column align-items-center justify-content-center text-muted text-center p-3 w-100 h-100">
                <span class="fs-1 mb-2">🖼️</span>
                <span class="small fw-bold">Imagen próximamente</span>
           </div>`;
    }
    if(imagenesPalabra.length === 1){
        return `<div class="apoyo-visual-caja h-100 w-100" role="button" tabindex="0"
                onclick="abrirImagenAmpliada('${imagenesPalabra[0]}', '${escaparComillasImg(nombrePalabra)}')"
                onkeypress="if(event.key==='Enter') abrirImagenAmpliada('${imagenesPalabra[0]}', '${escaparComillasImg(nombrePalabra)}')">
                <img src="${imagenesPalabra[0]}" class="apoyo-visual-img" alt="Imagen de apoyo visual para ${nombrePalabra}">
                <span class="apoyo-visual-lupa">🔍 Ampliar</span>
           </div>`;
    }
    const idCarrusel = "carruselImagenesPalabra";
    const slides = imagenesPalabra.map((url, i) => `
        <div class="carousel-item ${i === 0 ? "active" : ""}">
            <div class="apoyo-visual-caja h-100 w-100" role="button" tabindex="0"
                 onclick="abrirImagenAmpliada('${url}', '${escaparComillasImg(nombrePalabra)}')"
                 onkeypress="if(event.key==='Enter') abrirImagenAmpliada('${url}', '${escaparComillasImg(nombrePalabra)}')">
                <img src="${url}" class="apoyo-visual-img" alt="Imagen de apoyo visual ${i + 1} de ${imagenesPalabra.length} para ${nombrePalabra}">
                <span class="apoyo-visual-lupa">🔍 Ampliar</span>
            </div>
        </div>`).join("");
    const indicadores = imagenesPalabra.map((_, i) => `
        <button type="button" data-bs-target="#${idCarrusel}" data-bs-slide-to="${i}" class="${i === 0 ? "active" : ""}" ${i === 0 ? 'aria-current="true"' : ''} aria-label="Imagen ${i + 1}"></button>`).join("");
    return `
        <div id="${idCarrusel}" class="carousel slide carrusel-apoyo-visual h-100 w-100" data-bs-ride="false">
            <div class="carousel-inner h-100">${slides}</div>
            <button class="carousel-control-prev" type="button" data-bs-target="#${idCarrusel}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Imagen anterior</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${idCarrusel}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Imagen siguiente</span>
            </button>
            <div class="carousel-indicators carrusel-apoyo-visual-indicadores">${indicadores}</div>
        </div>`;
}

// Lee la(s) imagen(es) propia(s) de una palabra (columna "imagen",
// admite varias separadas por coma). Si no tiene ninguna, cae en la
// imagen de respaldo de su categoría (IMAGENES_CATEGORIA) cuando exista.
function obtenerImagenesDeApoyo(p){
    const propias = (p.imagen || "")
        .split(",")
        .map(url => url.trim())
        .filter(url => url !== "");
    if(propias.length > 0) return propias;
    const deCategoria = p.categoria ? IMAGENES_CATEGORIA[p.categoria.trim()] : null;
    return deCategoria ? [deCategoria] : [];
}

// --- TARJETAS DE CATEGORÍAS DEL DICCIONARIO (Hoja 1, columna "categoria") ---
// Estas tarjetas se arman con las categorías REALES que existen en
// palabras.json (columna C de la Hoja 1), igual que hace mostrarCategorias()
// con la Hoja 2, fijas debajo del Índice Alfabético, dentro de la vista
// "Diccionario". Cada una lleva su propio ícono, descripción corta y
// paleta de colores (fondo/borde/texto), tomados de
// CATEGORIAS_DICCIONARIO_INFO cuando la categoría ya está mapeada ahí;
// cualquier categoría nueva que todavía no tenga ícono propio cae en un
// color de la paleta genérica (COLORES_CATEGORIAS) con un ícono de
// carpeta por defecto, para que nunca se quede sin tarjeta.
const panelCategoriasDiccionario = document.getElementById("panelCategoriasDiccionario");
// Contenedor de resultados exclusivo para las tarjetas de Categoría del
// Diccionario, ubicado justo DEBAJO de #panelCategoriasDiccionario en el
// HTML (a diferencia de #resultado, que está arriba de las tarjetas). Ver
// filtrarPorCategoriaDiccionario() más abajo.
const resultadoCategoriasDiccionario = document.getElementById("resultadoCategoriasDiccionario");

const CATEGORIAS_DICCIONARIO_INFO = {
    "ciencia": {
        icono: "img/categorias/ciencia.webp",
        descripcion: "Explora estas palabras",
        fondo: "#e0f2fe", borde: "#bae6fd", texto: "#0369a1"
    },
    "comunicación": {
        icono: "img/categorias/comunicacion.webp",
        descripcion: "Explora estas palabras",
        fondo: "#fce7f3", borde: "#fbcfe8", texto: "#be185d"
    },
    "sociedad": {
        icono: "img/categorias/sociedad.webp",
        descripcion: "Explora estas palabras",
        fondo: "#e0e7ff", borde: "#c7d2fe", texto: "#4338ca"
    },
    "cortesía": {
        icono: "img/categorias/cortesia.webp",
        descripcion: "Palabras para usar a diario",
        fondo: "#dbeeff", borde: "#bfe0fc", texto: "#1d4ed8"
    },
    "educación": {
        icono: "img/categorias/educacion.webp",
        descripcion: "Aprende y enseña",
        fondo: "#fce4ef", borde: "#f8c7dd", texto: "#be185d"
    },
    "reflexión": {
        icono: "img/categorias/reflexion.webp",
        descripcion: "Pensamientos y emociones",
        fondo: "#fff3d6", borde: "#fde7ad", texto: "#b45309"
    },
    "saludos": {
        icono: "img/categorias/saludos.webp",
        descripcion: "Formas de saludar",
        fondo: "#e1f7ea", borde: "#bdeed0", texto: "#15803d"
    },
    "alimentos": {
        icono: "img/categorias/alimentos.webp",
        descripcion: "Comidas y bebidas",
        fondo: "#efe6fb", borde: "#ddc9f5", texto: "#7a3fc4"
    }
};

function infoCategoriaDiccionario(nombre, indiceFallback){
    const clave = nombre.trim().toLowerCase();
    if (CATEGORIAS_DICCIONARIO_INFO[clave]) return CATEGORIAS_DICCIONARIO_INFO[clave];
    const color = COLORES_CATEGORIAS[indiceFallback % COLORES_CATEGORIAS.length];
    return { icono: null, descripcion: "Explora estas palabras", fondo: color.fondo, borde: color.borde, texto: color.texto };
}

// Cuántas categorías se muestran de entrada (el resto queda oculto detrás
// de la tarjeta "Ver todas las categorías", que SIEMPRE se muestra al
// final del panel, aunque ya quepan todas de entrada).
// ============================================================
// ANIMACIÓN DE ENTRADA POR SCROLL (IntersectionObserver)
// ------------------------------------------------------------
// Antes, las tarjetas de categorías (Diccionario/Vocabulario)
// se animaban una sola vez, apenas se creaban en el DOM. Eso
// funcionaba bien en escritorio (donde se ven casi todas de
// entrada) pero en móvil la animación terminaba mientras la
// tarjeta seguía fuera de pantalla, así que el usuario nunca
// llegaba a verla.
//
// Ahora cada tarjeta arranca oculta (ver estilos.css) y
// observarEntradaAnimada() la observa; cuando entra en el
// viewport se le agrega la clase ".en-vista", que dispara la
// animación vía CSS. Se usa el mismo mecanismo para Diccionario,
// Vocabulario, Herramientas (menú móvil) y Sobre Nosotros.
// ============================================================
const observerEntradaAnimada = ("IntersectionObserver" in window)
    ? new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("en-vista");
                observerEntradaAnimada.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" })
    : null;

function observarEntradaAnimada(el){
    if (!el) return;
    if (observerEntradaAnimada) {
        observerEntradaAnimada.observe(el);
    } else {
        // Navegador sin soporte: mostrar directamente, sin animación.
        el.classList.add("en-vista");
    }
}

// Herramientas (menú móvil) y Sobre Nosotros ya están en el HTML desde
// el inicio (no se crean por JS), así que sus tarjetas se observan una
// sola vez apenas carga la página. Lo mismo aplica a las tarjetas de
// apoyo reutilizadas en Diccionario/Vocabulario (#seccionSugerencias):
// si no se observan acá, se quedan con opacity:0 para siempre (ver
// ".nosotros-apoyo-card" en estilos.css), aunque sigan funcionando al
// clic — quedan invisibles.
function observarTarjetasEstaticas(){
    document.querySelectorAll("#herramientasMenuMovilRow .herr-movil-btn")
        .forEach(observarEntradaAnimada);
    document.querySelectorAll("#nosotrosApoyoRow .nosotros-apoyo-card")
        .forEach(observarEntradaAnimada);
    document.querySelectorAll("#seccionSugerencias .nosotros-apoyo-card")
        .forEach(observarEntradaAnimada);
}
document.addEventListener("DOMContentLoaded", observarTarjetasEstaticas);

const LIMITE_CATEGORIAS_DICCIONARIO = 5;

// Recuerda si el panel está expandido (mostrando TODAS las categorías) o
// contraído (mostrando solo el adelanto), para que renderCategoriasDiccionario()
// pueda redibujarse respetando el estado actual.
let categoriasDiccionarioExpandido = false;

function renderCategoriasDiccionario(){
    if(!panelCategoriasDiccionario) return;
    panelCategoriasDiccionario.innerHTML = "";
    // Categorías reales, tomadas de la columna "categoria" de cada palabra
    // (Hoja 1 de Sheets), sin duplicados y ordenadas alfabéticamente.
    // String(p.categoria) en vez de p.categoria.trim() directo: así, si
    // algún dato llega desde el Sheet como número, booleano u otro tipo
    // que no sea texto, no se rompe con ".trim() is not a function" y
    // tumba a toda la función (lo que dejaba el panel pegado en
    // "Cargando categorías…" para siempre).
    const nombresCategorias = [...new Set(
        (App.datos || [])
            .filter(p => p.categoria && String(p.categoria).trim())
            .map(p => String(p.categoria).trim())
    )].sort((a, b) => a.localeCompare(b, "es"));

    const hayCategoriasOcultas = nombresCategorias.length > LIMITE_CATEGORIAS_DICCIONARIO;
    const listaAMostrar = (categoriasDiccionarioExpandido || !hayCategoriasOcultas)
        ? nombresCategorias
        : nombresCategorias.slice(0, LIMITE_CATEGORIAS_DICCIONARIO);

    listaAMostrar.forEach((nombre) => {
        // El índice de color se calcula sobre la lista COMPLETA (no sobre
        // la visible), así cada categoría conserva siempre el mismo color
        // sin importar si el panel está expandido o contraído.
        const indice = nombresCategorias.indexOf(nombre);
        const info = infoCategoriaDiccionario(nombre, indice);
        const iconoHtml = info.icono
            ? `<img src="${info.icono}" class="categoria-dicc-icono-img" alt="${nombre}" loading="lazy">`
            : `<span class="categoria-dicc-icono">📁</span>`;
        const cantidad = (App.datos || []).filter(p => p.categoria && p.categoria.trim().toLowerCase() === nombre.toLowerCase()).length;
        const cantidadTexto = cantidad === 1 ? "1 palabra" : `${cantidad} palabras`;
        const card = document.createElement("div");
        card.className = "col-4 col-md-4 col-lg-2 animate-fade-in";
        card.innerHTML = `
            <div class="card h-100 categoria-dicc-card" style="border-color: ${info.borde}; background-color: ${info.fondo};">
                ${iconoHtml}
                <div>
                    <div class="categoria-dicc-nombre" style="color: ${info.texto};">${nombre}</div>
                    <div class="categoria-dicc-desc">${info.descripcion}</div>
                    <div class="categoria-dicc-cantidad" style="color: ${info.texto};">${cantidadTexto}</div>
                </div>
                <span class="categoria-dicc-flecha" style="color: ${info.texto};">›</span>
            </div>`;
        card.querySelector(".categoria-dicc-card").onclick = () => filtrarPorCategoriaDiccionario(nombre);
        panelCategoriasDiccionario.appendChild(card);
        observarEntradaAnimada(card.querySelector(".categoria-dicc-card"));
    });

    // Tarjeta "Ver todas las categorías" / "Ver menos": SIEMPRE se
    // muestra al final del panel. Si hay categorías escondidas, alterna
    // entre el adelanto y la lista completa dentro del mismo panel (ya no
    // navega a otra vista); si no hay ninguna escondida, sigue visible
    // pero no hace nada al tocarla (ya se ven todas).
    const cardVerTodas = document.createElement("div");
    cardVerTodas.className = "col-4 col-md-4 col-lg-2 animate-fade-in";
    const texto = categoriasDiccionarioExpandido ? "Ver menos" : "Ver todas las categorías";
    const rotacionFlecha = categoriasDiccionarioExpandido ? "transform: rotate(-90deg);" : "";
    cardVerTodas.innerHTML = `
        <div class="card h-100 categoria-dicc-card card-ver-todas">
            <span class="categoria-dicc-flecha" style="${rotacionFlecha}">›</span>
            <div class="categoria-dicc-nombre" style="color: var(--primary-color); font-size: 0.82rem;">${texto}</div>
        </div>`;
    cardVerTodas.querySelector(".categoria-dicc-card").onclick = () => {
        if (!hayCategoriasOcultas) return;
        categoriasDiccionarioExpandido = !categoriasDiccionarioExpandido;
        renderCategoriasDiccionario();
    };
    panelCategoriasDiccionario.appendChild(cardVerTodas);
    observarEntradaAnimada(cardVerTodas.querySelector(".categoria-dicc-card"));
}

// Hace scroll hasta el elemento indicado, esperando primero a que el
// navegador termine de acomodar (layout) el contenido recién insertado.
//
// OJO: antes esto usaba el.scrollIntoView({behavior:'smooth'}), pero en
// varios navegadores móviles (sobre todo Safari/iOS y algunos Chrome
// Android) ese scroll terminaba cancelado o "peleaba" contra el "scroll
// anchoring" del navegador: al insertar contenido en #resultado, que
// está MÁS ARRIBA que las tarjetas que el usuario está tocando, el
// navegador reajusta el scroll solo para "compensar" el cambio de
// altura fuera de la vista, y ese reajuste automático puede ganarle o
// anular al scrollIntoView() disparado por JS, dejando la pantalla
// completamente quieta.
//
// Por eso ahora se calcula la posición absoluta del elemento (respecto
// al documento) y se hace window.scrollTo() directamente, en vez de
// depender de scrollIntoView(). Esto evita el conflicto con el "scroll
// anchoring" y funciona igual sin importar en qué elemento viva el
// scroll real (body, html, o el "scrollingElement" del navegador).
function scrollAlPrimerResultado(el){
    if(!el) return;

    // En móvil, 2 frames fijos (el requestAnimationFrame doble de antes) a
    // veces no alcanzaban a esperar que el layout terminara de acomodarse
    // (fuentes/iconos recién cargando la primera vez, etc.): el cálculo se
    // hacía con la página todavía "a medio pintar" y el scroll salía mal
    // calculado o, en la práctica, no se notaba ningún movimiento. Ahora se
    // espera a que el alto total del documento deje de cambiar entre dos
    // frames seguidos (con un tope de intentos) antes de calcular a dónde
    // hacer scroll.
    //
    // Además, si el teclado móvil sigue cerrándose (animación) en este
    // momento, el alto VISIBLE de la pantalla (window.visualViewport.height)
    // también sigue cambiando aunque el alto del documento ya se haya
    // estabilizado; se espera a que ambos se calmen antes de scrollear,
    // porque un cambio de altura del viewport después de nuestro scroll es
    // justo lo que hace que "el scroll se quede en la tarjeta".
    let altoAnterior = -1;
    let altoViewportAnterior = -1;
    let intentos = 0;

    function medirYEsperar(){
        const altoActual = document.documentElement.scrollHeight;
        const altoViewportActual = window.visualViewport ? window.visualViewport.height : -1;
        intentos++;
        const documentoEstable = altoActual === altoAnterior;
        const viewportEstable = altoViewportActual === altoViewportAnterior;
        if ((documentoEstable && viewportEstable) || intentos > 20) {
            hacerScroll();
            return;
        }
        altoAnterior = altoActual;
        altoViewportAnterior = altoViewportActual;
        requestAnimationFrame(medirYEsperar);
    }

    function calcularDestino(){
        const yDestino = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
        // En móvil/tablet (ver estilos.css, media max-width: 1199.98px)
        // "nav.navbar" pasa a position:fixed y flota con z-index alto
        // sobre el contenido. Si no se descuenta su alto acá, el destino
        // calculado deja el heading "Categoría: X" y la primera tarjeta
        // asomando justo DETRÁS del navbar (tapados), aunque el scroll
        // haya llegado exactamente a donde se pidió: se ve como si el
        // resultado hubiera "aterrizado" más abajo (en la 2da o 3ra
        // tarjeta), que es justo el bug reportado.
        const navbarEl = document.querySelector("nav.navbar");
        let altoNavbarFijo = 0;
        if (navbarEl && getComputedStyle(navbarEl).position === "fixed") {
            altoNavbarFijo = navbarEl.getBoundingClientRect().height;
        }
        // Pequeño margen arriba (16px) para que la tarjeta no quede
        // pegada al borde superior de la pantalla (o al borde inferior
        // del navbar fijo, si lo hay).
        return Math.max(yDestino - altoNavbarFijo - 16, 0);
    }

    function hacerScroll(){
        // El salto inicial va con behavior:"auto" (instantáneo), no
        // "smooth". #resultado está antes que las tarjetas de categorías
        // en el HTML: al tocar una tarjeta, #resultado cambia de alto
        // estando arriba/fuera de pantalla, y eso dispara el "scroll
        // anchoring" del navegador (el navegador reajusta el scroll solo
        // para compensar ese cambio de alto). Un scroll "smooth" pedido en
        // ese instante queda peleando cuadro a cuadro contra ese reajuste
        // automático y termina cancelado o sin notarse. Uno instantáneo no
        // deja ventana para esa pelea: la posición queda fijada de una vez
        // (además, en estilos.css se desactivó overflow-anchor en <html>
        // para eliminar el reajuste automático de raíz).
        window.scrollTo({ top: calcularDestino(), behavior: "auto" });

        // En vez de revisar solo en 3 momentos puntuales (150/500/900ms),
        // se vigila el scroll frame a frame durante ~1.2s después del
        // salto inicial. El problema real es que el "arrastre" hacia
        // abajo (fuentes/íconos terminando de cargar, el teclado móvil
        // cerrándose, reflows tardíos) puede ocurrir en cualquier
        // instante intermedio, no solo en los 3 momentos que se
        // chequeaban antes; con revisiones puntuales el desvío se cuela
        // en las ventanas sin vigilar y el scroll termina asentado sobre
        // las tarjetas de categorías, que es justo el bug reportado. Con
        // vigilancia continua, apenas el resultado se sale de la franja
        // válida (top entre -5 y 120px) se corrige de inmediato, sin
        // esperar al próximo chequeo fijo.
        const inicioVigilancia = performance.now();
        const DURACION_VIGILANCIA_MS = 1200;

        function vigilarYCorregir(){
            const transcurrido = performance.now() - inicioVigilancia;
            const bounds = el.getBoundingClientRect();
            // El límite superior de la franja válida ya no es un número
            // fijo (120px): con el navbar fijo de móvil descontado en
            // calcularDestino(), "el.top" en reposo puede quedar bastante
            // más abajo que 120px (justo debajo del navbar). Se calcula
            // ese margen dinámicamente (con 40px extra de tolerancia)
            // para no disparar correcciones de más en móvil.
            const navbarEl = document.querySelector("nav.navbar");
            const altoNavbarFijo = (navbarEl && getComputedStyle(navbarEl).position === "fixed")
                ? navbarEl.getBoundingClientRect().height
                : 0;
            if (bounds.top < -5 || bounds.top > 120 + altoNavbarFijo) {
                window.scrollTo({ top: calcularDestino(), behavior: "auto" });
            }
            if (transcurrido < DURACION_VIGILANCIA_MS) {
                requestAnimationFrame(vigilarYCorregir);
            }
        }
        requestAnimationFrame(vigilarYCorregir);
    }

    requestAnimationFrame(medirYEsperar);
}

// Misma estrategia que scrollAlPrimerResultado() de arriba (esperar a que
// el alto del documento y del viewport se estabilicen, saltar sin
// animación, y vigilar/corregir unos instantes más) pero apuntando siempre
// al techo de la página. Se usa al restaurar "?vista=vocabulario" desde una
// carga directa, donde un solo window.scrollTo({top:0}) disparado de
// inmediato quedaba peleando contra el "scroll anchoring" mientras el
// avatar y las tarjetas de categoría todavía se acomodaban (animación de
// entrada por IntersectionObserver), dejando la pantalla a mitad de camino
// (el "cortado" reportado).
function scrollArribaEstable(){
    let altoAnterior = -1;
    let altoViewportAnterior = -1;
    let intentos = 0;

    function medirYEsperar(){
        const altoActual = document.documentElement.scrollHeight;
        const altoViewportActual = window.visualViewport ? window.visualViewport.height : -1;
        intentos++;
        const documentoEstable = altoActual === altoAnterior;
        const viewportEstable = altoViewportActual === altoViewportAnterior;
        if ((documentoEstable && viewportEstable) || intentos > 20) {
            hacerScroll();
            return;
        }
        altoAnterior = altoActual;
        altoViewportAnterior = altoViewportActual;
        requestAnimationFrame(medirYEsperar);
    }

    function hacerScroll(){
        window.scrollTo({ top: 0, behavior: "auto" });

        const inicioVigilancia = performance.now();
        const DURACION_VIGILANCIA_MS = 1200;

        function vigilarYCorregir(){
            const transcurrido = performance.now() - inicioVigilancia;
            if ((window.pageYOffset || document.documentElement.scrollTop || 0) > 5) {
                window.scrollTo({ top: 0, behavior: "auto" });
            }
            if (transcurrido < DURACION_VIGILANCIA_MS) {
                requestAnimationFrame(vigilarYCorregir);
            }
        }
        requestAnimationFrame(vigilarYCorregir);
    }

    requestAnimationFrame(medirYEsperar);
}

// Filtra las palabras del diccionario (Hoja 1, App.datos) por el nombre
// de la categoría tocada y las pinta en #resultadoCategoriasDiccionario,
// que está DEBAJO de las tarjetas de categoría (a diferencia de
// filtrarPorLetra(), que sigue usando #resultado, arriba del índice A-Z).
//
// Antes esto pintaba en #resultado (arriba de las tarjetas): al tocar una
// tarjeta más abajo, el resultado aparecía fuera de pantalla por ENCIMA
// del punto donde estaba el usuario, y había que forzar un scroll hacia
// arriba (ver el historial de scrollAlPrimerResultado más abajo) que
// competía con el "scroll anchoring" del navegador. Resultado: a veces la
// pantalla se quedaba quieta sobre las tarjetas y el bloque de resultados
// no se notaba como una unidad. Pintando acá abajo, el resultado aparece
// justo donde el usuario ya está mirando y el scroll es siempre hacia
// abajo, sin pelear contra nada.
function filtrarPorCategoriaDiccionario(nombre){
    // Si el teclado móvil está abierto (el usuario venía de buscar), se
    // cierra ANTES de medir/scrollear, para que su animación de cierre no
    // desacomode el cálculo del scroll.
    if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
    }
    ocultarQuiz();
    ocultarAlfabetizacion();
    buscar.value = "";
    sugerencias.innerHTML = "";
    sugerencias.style.display = "none";
    resultado.innerHTML = "";
    panelCategorias.innerHTML = "";
    resultadoCategorias.innerHTML = "";
    resultadoCategoriasDiccionario.innerHTML = "";
    categoriaActualMostrada = null;
    ultimasPalabras.innerHTML = "";
    ocultarPanelesGuardados();
    // Antes acá se ocultaba también #filaCategoriasDiccionario (las
    // tarjetas de Categorías), pensado para "no repetir la grilla de
    // categorías arriba y abajo del resultado" de cuando el resultado
    // vivía DENTRO de esa misma fila. Ahora que #resultadoCategoriasDiccionario
    // es una fila propia, independiente (ver index.html), ya no hay
    // ninguna grilla que se repita: ocultar las tarjetas solo hacía que
    // la sección "Categorías" desapareciera sin necesidad al elegir una,
    // así que se dejan siempre visibles. El panel de Estadísticas sí se
    // sigue ocultando (igual que al mostrar una palabra), para no competir
    // visualmente con el listado de la categoría.
    const statsPanelCat = document.querySelector(".stats-panel-destacado");
    if(statsPanelCat) statsPanelCat.style.display = "none";
    const statsHeaderCat = document.querySelector(".stats-header");
    if(statsHeaderCat) statsHeaderCat.style.display = "none";
    window.history.pushState({}, '', window.location.pathname);
    const filtradas = App.datos.filter(p => String(p.categoria || "").trim().toLowerCase() === nombre.trim().toLowerCase());
    if (filtradas.length === 0) {
        resultadoCategoriasDiccionario.innerHTML = `<div class="alert alert-light border text-center text-muted small py-3" style="border-radius: 12px;">No hay palabras en la categoría <strong>${nombre}</strong> todavía.</div>`;
        scrollAlPrimerResultado(resultadoCategoriasDiccionario);
        return;
    }
    // Se arma todo el HTML en una sola variable y se asigna de una vez
    // (en vez de "...innerHTML += ..." dentro del forEach) para evitar
    // múltiples reflujos/reflows mientras se insertan las tarjetas.
    // A diferencia de Vocabulario (mostrarCategoria), acá se usa una
    // cuadrícula de tarjetas una al lado de otra; cada tarjeta entera
    // es un <button> (clic o toque en cualquier parte abre la seña), y
    // el "Ver Seña" de adentro (con ícono de ojo) es solo visual. El
    // animation-delay escalonado (ver .categoria-resultado-item en
    // estilos.css) hace que las tarjetas vayan apareciendo en cascada,
    // como si "salieran" de la tarjeta de categoría que se tocó.
    let htmlResultado = `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Categoría: ${nombre}</h6>
    <div class="categoria-resultados-grid">`;
    filtradas.forEach((p, i) => {
        const nombreEscapado = p.palabra.replace(/'/g, "\\'");
        htmlResultado += `
        <button type="button" class="categoria-resultado-item shadow-sm" style="animation-delay: ${Math.min(i, 20) * 0.04}s" onclick="mostrarPalabraPorNombre('${nombreEscapado}')">
            ${generarMiniaturaVocabulario(p)}
            <span class="categoria-resultado-titulo">${p.palabra}</span>
            <span class="btn btn-sm btn-primary fw-bold categoria-resultado-boton">${ICONO_OJO_SVG} Ver Seña</span>
        </button>`;
    });
    htmlResultado += `</div>`;
    resultadoCategoriasDiccionario.innerHTML = htmlResultado;
    scrollAlPrimerResultado(resultadoCategoriasDiccionario);
}
window.filtrarPorCategoriaDiccionario = filtrarPorCategoriaDiccionario;

// --- ICONOS DE CATEGORÍAS DE VOCABULARIO ---
// Igual que CATEGORIAS_DICCIONARIO_INFO, pero solo para el ícono: las
// categorías de Vocabulario (Hoja 2) ya usan la paleta de colores
// genérica (COLORES_CATEGORIAS) según su posición, así que aquí solo se
// mapea el nombre -> ruta de imagen. Cualquier categoría nueva que
// todavía no tenga ícono cae en un emoji de libro por defecto.
const ICONOS_CATEGORIA_VOCABULARIO = {
    "adjetivos": "img/categorias/adjetivos.webp",
    "emociones": "img/categorias/emociones.webp",
    "verbos": "img/categorias/verbos.webp",
    "tiempo": "img/categorias/tiempo.webp"
};

// Emoji de respaldo por categoría, para cuando todavía no hay una imagen
// en ICONOS_CATEGORIA_VOCABULARIO. Si la categoría no está aquí tampoco,
// se usa el 📖 por defecto.
const EMOJIS_CATEGORIA_VOCABULARIO = {
    "tiempo": "⏰"
};

function mostrarCategorias(){
    resultado.innerHTML=""; panelCategorias.innerHTML=""; resultadoCategoriasDiccionario.innerHTML=""; ultimasPalabras.innerHTML = "";
    // Mismo bug que en irAlBuscador(): faltaba limpiar #ultimasPalabrasCategorias
    // al entrar a Vocabulario, así que la sugerencia de la última palabra vista
    // (en esta misma vista, en una visita anterior) se quedaba pegada.
    if(ultimasPalabrasCategorias) ultimasPalabrasCategorias.innerHTML = "";
    ocultarPanelesGuardados();
    if (window.QuizV2 && typeof QuizV2.asegurarBancoCargado === "function") {
        QuizV2.asegurarBancoCargado();
    }
    const datosVocabulario = obtenerDatosVocabulario();
    const categories = [...new Set(datosVocabulario.map(p => p.categoria.trim()))].sort();
    categories.forEach((nombre, indice)=>{
        const cantidad = datosVocabulario.filter(p => p.categoria.trim() === nombre).length;
        const color = COLORES_CATEGORIAS[indice % COLORES_CATEGORIAS.length];
        const nombreClave = nombre.trim().toLowerCase();
        const icono = ICONOS_CATEGORIA_VOCABULARIO[nombreClave];
        const emoji = EMOJIS_CATEGORIA_VOCABULARIO[nombreClave] || "📖";
        const iconoHtml = icono
            ? `<img src="${icono}" alt="${nombre}" loading="lazy" style="width: 48px; height: 48px; object-fit: contain; margin-bottom: 8px;">`
            : `<span style="font-size: 2rem; display: block; margin-bottom: 8px;">${emoji}</span>`;
        const card = document.createElement("div");
        card.className = "col-4 col-md-3 animate-fade-in";
        card.innerHTML = `<div class="card h-100 shadow-sm categoria-card" style="border-radius: 16px; border: 2px solid ${color.borde}; background-color: ${color.fondo};"><div class="card-body text-center py-4">${iconoHtml}<h5 class="mb-2 fw-bold" style="color: ${color.texto}; font-size: 1.25rem;">${nombre}</h5><p class="mb-0 fw-semibold" style="color: ${color.texto}; opacity: 0.85; font-size: 1rem;">${cantidad} palabras</p></div></div>`;
        card.onclick = () => mostrarCategoria(nombre);
        panelCategorias.appendChild(card);
        observarEntradaAnimada(card.querySelector(".categoria-card"));
    });
    categoriaActualMostrada = null;
}

// --- BUSCADOR EXCLUSIVO DE "VOCABULARIO" (antes "Temas orden") ---
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
    buscarCategorias.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); ejecutarBusquedaDirectaCategorias(); } });
}
const btnBuscarCategorias = document.getElementById("btnBuscarCategorias");
if(btnBuscarCategorias) btnBuscarCategorias.addEventListener("click", ejecutarBusquedaDirectaCategorias);

// Igual que ejecutarBusquedaDirecta() del buscador principal: al presionar
// Enter en el input o tocar la lupa, en vez de solo dejar la lista de
// sugerencias abierta, navega directo al resultado (coincidencia exacta
// primero -por nombre o por variante-, y si no hay, la primera coincidencia
// parcial). Si no hay ninguna coincidencia, deja el input como estaba.
function ejecutarBusquedaDirectaCategorias() {
    if(!buscarCategorias) return;
    const texto = norm(buscarCategorias.value.trim());
    if(texto === "") return;

    const datos = obtenerDatosVocabulario();

    const exactos = datos.filter(p => {
        const matchPrincipal = norm(p.palabra) === texto;
        const matchVariantes = p.variantes ? norm(p.variantes).split(',').map(v=>v.trim()).includes(texto) : false;
        return matchPrincipal || matchVariantes;
    });

    const encontrado = exactos[0] || datos.find(p => {
        const matchPrincipal = norm(p.palabra).includes(texto);
        const matchVariantes = p.variantes ? norm(p.variantes).includes(texto) : false;
        return matchPrincipal || matchVariantes;
    });

    if(encontrado){
        buscarCategorias.value = "";
        if(sugerenciasCategorias){ sugerenciasCategorias.innerHTML = ""; sugerenciasCategorias.style.display = "none"; }
        mostrarPalabraPorNombreUnificado(encontrado.palabra);
    }
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
    if(sugerenciasCategorias){ sugerenciasCategorias.innerHTML = ""; sugerenciasCategorias.style.display = "none"; }
    // Mismo bug: al volver de una palabra a las tarjetas de categoría con
    // "⬅ Atrás", las sugerencias "Puede que también te interese" de esa
    // palabra se quedaban pegadas debajo de las tarjetas.
    if(ultimasPalabrasCategorias) ultimasPalabrasCategorias.innerHTML = "";
    categoriaActualMostrada = null;
}
window.limpiarResultadoCategorias = limpiarResultadoCategorias;

// Igual que buscarPalabras() (buscador principal del Diccionario): al
// escribir se muestra un panel flotante oscuro con las coincidencias
// (miniatura + nombre + categoría), en vez de tarjetas completas debajo
// del buscador. Al elegir una, se limpia el buscador y se abre la ficha
// completa de la palabra en #resultadoCategorias (mismo comportamiento
// que antes, vía mostrarPalabraPorNombreUnificado).
function buscarEnCategorias(){
    if(!sugerenciasCategorias || !buscarCategorias) return;
    const textoOriginal = buscarCategorias.value.trim();
    const texto = norm(textoOriginal);
    sugerenciasCategorias.innerHTML = "";

    if(!texto){
        sugerenciasCategorias.style.display = "none";
        return;
    }

    // Misma prioridad que buscarPalabras(): de lo más exacto a lo más
    // aproximado (ver clasificarCoincidencia / ordenarYLimitarCoincidencias).
    const coincidenciasClasificadas = [];
    obtenerDatosVocabulario().forEach(p => {
        const rango = clasificarCoincidencia(p, texto);
        if (rango >= 0) coincidenciasClasificadas.push({ p, rango });
    });

    const coincidencias = ordenarYLimitarCoincidencias(coincidenciasClasificadas, 15);

    sugerenciasCategorias.style.display = "block";

    if(coincidencias.length === 0){
        const cercanos = buscarCercanos(texto, obtenerDatosVocabulario());
        if(cercanos.length > 0){
            sugerenciasCategorias.innerHTML = `
                <div class="list-group-item text-center py-2" style="background-color: #343a40; border: none;">
                    <span class="text-white d-block small">¿Quisiste decir...?</span>
                </div>`;
            cercanos.forEach(p => {
                const boton = document.createElement("button");
                boton.className = "list-group-item list-group-item-action text-start";
                boton.innerHTML = `<strong>${p.palabra}</strong> <span class="badge" style="font-size: 10px;">${p.categoria.trim()}</span>`;
                boton.onclick = () => {
                    buscarCategorias.value = "";
                    sugerenciasCategorias.innerHTML = "";
                    sugerenciasCategorias.style.display = "none";
                    mostrarPalabraPorNombreUnificado(p.palabra);
                };
                sugerenciasCategorias.appendChild(boton);
            });
            return;
        }
        sugerenciasCategorias.innerHTML = `
            <div class="list-group-item text-center py-3" style="background-color: #343a40; border: none;">
                <span class="text-white d-block small">No hay resultados para "${textoOriginal}"</span>
            </div>`;
        return;
    }

    coincidencias.forEach(p => {
        const boton = document.createElement("button");
        boton.className = "list-group-item list-group-item-action text-start";
        let textoMatch = `<strong>${p.palabra}</strong>`;
        const varianteCoincidenteCat = obtenerVarianteQueCoincide(p.variantes, texto);
        if(varianteCoincidenteCat && !norm(p.palabra).includes(texto)){
            textoMatch += ` <small class="text-primary ms-2 fw-bold" style="font-size: 11px;">(Variante: ${varianteCoincidenteCat})</small>`;
        }
        boton.innerHTML = `
            <div class="sugerencia-fila">
                ${generarMiniaturaVocabulario(p)}
                <div class="sugerencia-texto">
                    ${textoMatch}
                    <span class="badge" style="font-size: 10px;">${p.categoria.trim()}</span>
                </div>
            </div>`;
        boton.onclick = () => {
            buscarCategorias.value = "";
            sugerenciasCategorias.innerHTML = "";
            sugerenciasCategorias.style.display = "none";
            mostrarPalabraPorNombreUnificado(p.palabra);
        };
        sugerenciasCategorias.appendChild(boton);
    });
}

document.addEventListener("click", (e) => {
    if (sugerenciasCategorias && buscarCategorias && !buscarCategorias.contains(e.target) && !sugerenciasCategorias.contains(e.target)) {
        sugerenciasCategorias.style.display = "none";
    }
});

// --- DATOS DE VOCABULARIO (solo Hoja 2) ---
// La sección "Vocabulario" (antes "Temas orden") ahora toma sus categorías
// y palabras EXCLUSIVAMENTE del banco de la Hoja 2 (el mismo que usa el
// Quiz), sin mezclarlas con el diccionario de la Hoja 1. Solo se incluyen
// las que ya tienen categoría, para que el agrupamiento tenga sentido.
function obtenerDatosVocabulario(){
    return obtenerBancoHoja2().filter(p => p.palabra && p.categoria && p.categoria.trim() !== "");
}

// Genera el mismo bloque de miniatura (imagen de YouTube + ícono de
// "play", o el emoji de respaldo si la palabra no tiene video) que ya
// usa el buscador del Diccionario (#sugerencias, ver más arriba), para
// que las tarjetas de Vocabulario se vean y se sientan igual.
// Ícono de "ojo con pestaña" (estilo Feather/outline) para el botón
// visual "Ver Seña" de las tarjetas de categoría del Diccionario (ver
// filtrarPorCategoriaDiccionario). Es un SVG simple en vez de una
// librería de íconos completa, ya que el sitio no carga ninguna.
const ICONO_OJO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;

function generarMiniaturaVocabulario(p){
    const idVideo = extraerIdYouTube(p.video);
    return idVideo
        ? `<div class="sugerencia-thumb-wrap">
               <img src="https://i.ytimg.com/vi/${idVideo}/mqdefault.jpg" alt="Seña de ${p.palabra}" loading="lazy">
               <span class="sugerencia-thumb-play">▶</span>
           </div>`
        : `<div class="sugerencia-thumb-wrap sin-video">🤟</div>`;
}

function mostrarCategoria(nombre){
    categoriaActualMostrada = nombre;
    if(buscarCategorias) buscarCategorias.value = "";
    if(sugerenciasCategorias){ sugerenciasCategorias.innerHTML = ""; sugerenciasCategorias.style.display = "none"; }
    let html = botonAtrasCategorias() + `<h6 class="text-muted uppercase fw-bold mb-3 tracking-wider">Categoría: ${nombre}</h6>
    <div class="categoria-resultados-grid">`;
    obtenerDatosVocabulario().filter(p => p.categoria.trim() === nombre).forEach((p, i) => {
        const nombreEscapado = p.palabra.replace(/'/g, "\\'");
        html += `<button type="button" class="categoria-resultado-item shadow-sm" style="animation-delay: ${Math.min(i, 20) * 0.04}s" onclick="mostrarPalabraPorNombreUnificado('${nombreEscapado}')">
            ${generarMiniaturaVocabulario(p)}
            <span class="categoria-resultado-titulo">${p.palabra}</span>
            <span class="btn btn-sm btn-primary fw-bold categoria-resultado-boton">${ICONO_OJO_SVG} Ver Seña</span>
        </button>`;
    });
    html += `</div>`;
    resultadoCategorias.innerHTML = html;
    scrollAlPrimerResultado(resultadoCategorias);
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

// Miniatura de 70x70 para las tarjetas de "Puede que también te interese"
// (Diccionario y Vocabulario). Antes usaba via.placeholder.com como
// respaldo cuando la palabra no tiene columna "imagen", pero ese servicio
// dejó de responder y se veía como ícono roto. Se reemplaza por el mismo
// mini-bloque "🖼️" ya usado en otras partes del sitio para "sin imagen
// todavía", en vez de depender de un servicio externo.
function generarMiniaturaSugerencia(p){
    const primeraImagen = (p.imagen || "").split(",")[0].trim();
    if(primeraImagen){
        return `<img src="${primeraImagen}" class="img-fluid rounded" style="height: 70px; width: 70px; object-fit: cover;" alt="Imagen de apoyo visual para ${p.palabra}">`;
    }
    return `<div class="rounded d-flex align-items-center justify-content-center bg-light text-muted" style="height: 70px; width: 70px; font-size: 1.3rem;">🖼️</div>`;
}

function mostrarSugerenciasRelacionadas(palabraActual, contenedor, opciones = {}){
    if(!contenedor) return;
    contenedor.innerHTML = "";
    const relacionadas = App.datos.filter(p => p.categoria.trim() === palabraActual.categoria.trim() && p.palabra !== palabraActual.palabra);
    if (relacionadas.length === 0) return;
    // Todo el bloque (título + tarjetas) va dentro de un único "col-12"
    // con fondo amarillo claro (.sugerencias-panel-destacado), así el
    // panel de color solo aparece cuando realmente hay sugerencias que
    // mostrar (si no hay, el contenedor queda vacío y no se ve ninguna
    // caja de color de más). El id interno de las filas se busca dentro
    // de "contenedor" (querySelector), no con getElementById global, para
    // que esta misma función sirva tanto para #ultimasPalabras (búsqueda
    // normal) como para #ultimasPalabrasCategorias (vista Categorías).
    contenedor.innerHTML = `<div class="col-12"><div class="sugerencias-panel-destacado"><h5 class="fw-bold mb-3">Puede que también te interese</h5><div class="row g-2 sugerenciasPanelFilas"></div></div></div>`;
    const filas = contenedor.querySelector(".sugerenciasPanelFilas");
    relacionadas.slice(-4).reverse().forEach(p => {
        const col = document.createElement("div"); col.className = "col-12 col-md-6 mb-2";
        col.innerHTML = `<div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; background-color: #ffffff;"><div class="row g-0 align-items-center"><div class="col-3 p-2">${generarMiniaturaSugerencia(p)}</div><div class="col-9"><div class="card-body py-2 px-2"><h6 class="mb-0 fw-bold text-primary">${p.palabra}</h6></div></div></div></div>`;
        col.onclick = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabra(p, { enCategorias: !!opciones.clickAbreEnCategorias }); };
        filas.appendChild(col);
    });
}

// Igual que mostrarSugerenciasRelacionadas(), pero para palabras de
// Vocabulario (Hoja 2, banco del Quiz): usa obtenerBancoHoja2() en vez
// de App.datos, y al hacer clic en una sugerencia abre con
// mostrarPalabraSimplificada() en vez de mostrarPalabra(). La Hoja 2 no
// trae columna "imagen", así que las tarjetas siempre caen en el
// placeholder (igual que el resto de tarjetas de Vocabulario).
function mostrarSugerenciasRelacionadasVocabulario(palabraActual, contenedor, opciones = {}){
    if(!contenedor) return;
    contenedor.innerHTML = "";
    const relacionadas = obtenerBancoHoja2().filter(p => p.categoria && palabraActual.categoria && p.categoria.trim() === palabraActual.categoria.trim() && p.palabra !== palabraActual.palabra);
    if (relacionadas.length === 0) return;
    contenedor.innerHTML = `<div class="col-12"><div class="sugerencias-panel-destacado"><h5 class="fw-bold mb-3">Puede que también te interese</h5><div class="row g-2 sugerenciasPanelFilas"></div></div></div>`;
    const filas = contenedor.querySelector(".sugerenciasPanelFilas");
    relacionadas.slice(-4).reverse().forEach(p => {
        const col = document.createElement("div"); col.className = "col-12 col-md-6 mb-2";
        col.innerHTML = `<div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; background-color: #ffffff;"><div class="row g-0 align-items-center"><div class="col-3 p-2">${generarMiniaturaSugerencia(p)}</div><div class="col-9"><div class="card-body py-2 px-2"><h6 class="mb-0 fw-bold text-primary">${p.palabra}</h6></div></div></div></div>`;
        col.onclick = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabraSimplificada(p, { enCategorias: !!opciones.clickAbreEnCategorias }); };
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

// Vacía por completo el historial guardado (localStorage) y repinta el
// panel al instante para que quede vacío sin necesidad de recargar.
function borrarHistorial(){
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify([]));
    renderizarListaHistorial();
}

function renderizarListaHistorial(){
    if(!listaHistorial) return;
    const historial = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) || "[]");
    listaHistorial.innerHTML = historial.length === 0 ? '<p class="text-muted small mb-0">Aún no tienes búsquedas recientes.</p>' : "";
    historial.forEach(nombre => {
        const p = App.datos.find(i => i.palabra === nombre);
        if(p){ const col = document.createElement("div"); col.className="col-6 col-md-3"; col.innerHTML=`<div class="card h-100 shadow-sm border-0" style="border-radius: 12px;"><div class="card-body text-center py-2"><h6 class="mb-0 fw-bold small text-primary">${p.palabra}</h6></div></div>`; col.onclick=()=>mostrarPalabra(p); listaHistorial.appendChild(col); }
    });
}

const btnBorrarHistorial = document.getElementById("btnBorrarHistorial");
if(btnBorrarHistorial){
    btnBorrarHistorial.addEventListener("click", (e) => {
        e.stopPropagation();
        borrarHistorial();
    });
}

function mostrarPantallaHistorialYFavoritos(){
    // Primero Favoritos, luego Historial — mismo orden en que aparecen
    // los bloques en el HTML. Cada uno sigue siendo un bloque
    // independiente (su propio <section>), solo comparten el botón
    // de menú que los abre.
    if(seccionFavoritos) seccionFavoritos.classList.remove("d-none");
    mostrarFavoritos();
    seccionHistorial.classList.remove("d-none");
    renderizarListaHistorial();
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

    const definicionPlanaDelDia = limpiarDefinicionTextoPlano(palabra.definicion);
    document.getElementById("descripcionDelDia").textContent =
        definicionPlanaDelDia.length > 160
            ? definicionPlanaDelDia.substring(0,160)+"..."
            : definicionPlanaDelDia;

    document.getElementById("categoriaDelDia").textContent =
        palabra.categoria;

    // --- Miniatura del video (reutiliza extraerIdYouTube, definida más arriba) ---
    const miniaturaWrap = document.getElementById("miniaturaDelDiaWrap");
    const miniaturaImg = document.getElementById("miniaturaDelDiaImg");
    if (miniaturaWrap && miniaturaImg) {
        const idVideoDelDia = extraerIdYouTube(palabra.video);
        if (idVideoDelDia) {
            // Se usa i.ytimg.com directo (y no img.youtube.com) porque ya
            // hay un <link rel="preconnect"> a ese dominio en index.html.
            // img.youtube.com termina redirigiendo internamente a
            // i.ytimg.com, así que pedirle la miniatura a img.youtube.com
            // obligaba al navegador a una conexión extra (DNS + TLS) antes
            // de llegar al dominio ya precalentado, retrasando de forma
            // visible la aparición de esta miniatura.
            miniaturaImg.src = `https://i.ytimg.com/vi/${idVideoDelDia}/mqdefault.jpg`;
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
            // El avatar se achica y se acomoda al costado del título (en
            // vez de quedar solo y grande arriba, empujando el título
            // debajo): ver la regla "body.senal-cerrada" en index.html.
            document.body.classList.add("senal-cerrada");
        };
    }

}

// El motor del Quiz (niveles, modos, temporizador, sonidos, etc.)
// vive ahora en js/quiz.js como el módulo independiente QuizV2,
// que lee sus preguntas desde la Hoja 2 de Google Sheets.