/* ============================================================
   LSPedia - ALFABETIZACIÓN v2 (independiente del diccionario y del Quiz)
   ------------------------------------------------------------
   Sigue el mismo patrón que js/quiz.js (namespace QuizV2):
   caché local de 5 min + JSONP contra el Web App de Apps Script.

   ⚠️ MODO MOCK (mientras el Apps Script no está listo):
   Con MOCK_ACTIVO en true, los datos se leen de
   data/alfabetizacion-mock.json (mismo origen, sin problemas de
   CORS). Cuando el doGet combinado esté desplegado, basta con:
     1) Pegar la URL real en CONFIG.APPS_SCRIPT_URL
     2) Poner MOCK_ACTIVO en false
   El resto del módulo no necesita cambios: cargarDatos() ya
   entrega los datos en la misma forma { alfabeto, ejemplos }
   sin importar el origen.

   ARCHIVOS POR CARÁCTER (todos generados por ti, en el propio repo):
     img/alfabetizacion/boca/{CARACTER}.png                              (fonética, sí viene del Sheet -> campo imagenBoca)
     img/alfabetizacion/grafias/{CARACTER}-mayuscula.mp4                 (video de grafía, variante mayúscula)
     img/alfabetizacion/grafias/{CARACTER}-minuscula.mp4                 (video de grafía, variante minúscula)
     img/alfabetizacion/grafias/{CARACTER}-cursiva-mayuscula.mp4         (video de grafía, variante cursiva mayúscula)
     img/alfabetizacion/grafias/{CARACTER}-cursiva-minuscula.mp4         (video de grafía, variante cursiva minúscula)
   Estos 4 videos NO vienen del Sheet: se arman por convención de
   nombre a partir del carácter + variante activa (ver rutaVideoGrafia
   más abajo), para no tener que agregar columnas a la hoja de cálculo.
   El usuario elige la variante con 4 chips flotantes (mayúscula/
   minúscula/cursiva mayúscula/cursiva minúscula); el video de la caja
   "✏️ Grafía" cambia según el chip activo, con los mismos controles
   de velocidad 🐢/🐇 y 🔁 Reiniciar de siempre.
   Si en algún momento prefieres manejarlas desde Sheets también,
   avísame y lo cambiamos por 4 campos más en el JSON.
   ============================================================ */

const AlfabetizacionV2 = (function () {

    // ---------------------------------------------------------
    // CONFIGURACIÓN
    // ---------------------------------------------------------
    const CONFIG = {
        MOCK_ACTIVO: false, // 👉 ya conectado al Apps Script real (Sheet). Poner en true para volver al mock local si hace falta debuggear sin depender de Google.
        MOCK_URL: "data/alfabetizacion-mock.json",

        // 👉 Pega aquí la URL de tu Web App de Apps Script (termina en /exec)
        //    (puede ser la misma del Quiz si el doGet combinado responde
        //     también a este endpoint, o una nueva si prefieres separarlo)
        APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbw2OCpT7GlBL_UkyUxqD6o-YBmmR5TAzKBywPaVGO9UbdEG4_f2eqrCVpQV6If9IouoDA/exec",

        CLAVE_CACHE: "lspedia_alfabetizacion_cache_v1",
        DURACION_CACHE_MS: 5 * 60 * 1000, // 5 minutos, igual que el Quiz

        VELOCIDADES_TRAZO: [0.5, 1, 1.5, 2],
        VELOCIDAD_INDEX_INICIAL: 1, // 1x

        // Las 4 variantes tipográficas, en el mismo orden que los chips del HTML.
        VARIANTES_TIPO: ["mayuscula", "minuscula", "cursiva-mayuscula", "cursiva-minuscula"],

        // Los números 0-19 se pronuncian como palabra (ej. 13 = TRECE), así que
        // la fonética se arma reutilizando la boca de cada letra de la palabra
        // (img/alfabetizacion/boca/{LETRA}.png), no una imagen por número.
        PALABRA_NUMERO: {
            "0": "CERO", "1": "UNO", "2": "DOS", "3": "TRES", "4": "CUATRO",
            "5": "CINCO", "6": "SEIS", "7": "SIETE", "8": "OCHO", "9": "NUEVE",
            "10": "DIEZ", "11": "ONCE", "12": "DOCE", "13": "TRECE", "14": "CATORCE",
            "15": "QUINCE", "16": "DIECISEIS", "17": "DIECISIETE", "18": "DIECIOCHO",
            "19": "DIECINUEVE"
        },

        // Juego "Completar la palabra": banco de preguntas con las
        // palabras de ejemplo del abecedario (con imagen), los números
        // (sin imagen, se muestra el número grande) y ahora también
        // palabras del Diccionario/Vocabulario con imagen real cargada.
        // "letrasFaltantes" define cuántas letras hay que completar por
        // nivel. El tiempo YA NO es fijo: "tiempoBaseSeg" + "segPorLetra"
        // por cada letra de la palabra (ver renderPreguntaCompletar), para
        // que una palabra larga del Diccionario (ej. "Ecosistema") no
        // tenga el mismo tiempo ajustado que una corta ("Casa").
        NIVELES_COMPLETAR: [
            { id: "facil", nombre: "Fácil", icono: "🙂", opciones: 3, tiempoBaseSeg: 25, segPorLetra: 1.0, letrasFaltantes: 1, badgeClase: "badge-nivel-facil" },
            { id: "medio", nombre: "Medio", icono: "😐", opciones: 4, tiempoBaseSeg: 20, segPorLetra: 1.1, letrasFaltantes: 2, badgeClase: "badge-nivel-medio" },
            { id: "dificil", nombre: "Difícil", icono: "🔥", opciones: 5, tiempoBaseSeg: 15, segPorLetra: 1.3, letrasFaltantes: 3, badgeClase: "badge-nivel-dificil" }
        ],
        TIEMPO_MAXIMO_COMPLETAR_SEG: 50,
        PREGUNTAS_POR_RONDA_COMPLETAR: 10,
        LETRAS_DISPONIBLES: "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split(""),

        // Juego "Unir con flechas": banco de parejas imagen/número <-> palabra
        // (mismo banco que Completar en su parte de imágenes, más los números).
        // "pares" = cuántas parejas se muestran en el tablero según el nivel.
        NIVELES_UNIR: [
            { id: "facil", nombre: "Fácil", icono: "🙂", pares: 4, badgeClase: "badge-nivel-facil" },
            { id: "medio", nombre: "Medio", icono: "😐", pares: 6, badgeClase: "badge-nivel-medio" },
            { id: "dificil", nombre: "Difícil", icono: "🔥", pares: 8, badgeClase: "badge-nivel-dificil" }
        ],
        RONDAS_POR_PARTIDA_UNIR: 3,
        PUNTOS_POR_PAREJA_UNIR: 15
    };

    // ---------------------------------------------------------
    // ESTADO INTERNO
    // ---------------------------------------------------------
    const estado = {
        datos: { alfabeto: [], ejemplos: [] },
        cargando: false,
        moduloActivo: "aprender", // aprender | completar | unir
        pantallaCompleta: false,
        audioCtx: null,

        aprender: {
            tipo: "letra",           // letra | numero
            indiceCaracter: 0,       // índice dentro de la lista filtrada por tipo
            velocidadIndex: CONFIG.VELOCIDAD_INDEX_INICIAL,
            ejemploIndice: 0,
            variante: "mayuscula"    // variante tipográfica activa (chip seleccionado)
        },

        completar: {
            nivelId: null,
            preguntas: [],
            indice: 0,
            puntaje: 0,
            correctas: 0,
            incorrectas: 0,
            revision: [],
            respondida: false,
            timerId: null,
            tiempoRestante: 0,
            subIndice: 0,           // qué letra faltante (dentro de la palabra actual) se está resolviendo
            palabraTuvoError: false, // si alguna letra de la palabra actual salió mal
            blancoRespondido: false, // evita doble clic mientras se pasa a la siguiente letra faltante
            racha: 0                // aciertos consecutivos (letra por letra), para el indicador 🔥
        },

        unir: {
            nivelId: null,
            ronda: 0,                 // ronda actual dentro de la partida (0-based)
            pares: [],                // parejas de la ronda actual: [{ palabra, imagen, numero }, ...]
            ordenImagenes: [],        // índices de "pares", en el orden visual de la columna izquierda
            ordenPalabras: [],        // índices de "pares", en el orden visual de la columna derecha
            conexiones: {},           // { indiceImagen: indicePalabra } — conexiones aún no confirmadas
            resueltos: new Set(),     // índices ya confirmados como correctos (bloqueados, en verde)
            seleccion: null,          // { tipo: 'imagen'|'palabra', indice, el } en espera de su pareja
            puntaje: 0,
            correctas: 0,
            incorrectas: 0,
            revision: []
        }
    };

    // ---------------------------------------------------------
    // REFERENCIAS AL DOM (perezosas, igual que en quiz.js)
    // ---------------------------------------------------------
    const el = (id) => document.getElementById(id);

    // ---------------------------------------------------------
    // CARGA DE DATOS (mock local o Apps Script real, mismo contrato)
    // ---------------------------------------------------------
    function cargarDatos(forzar) {
        el("alfabError").classList.add("d-none");

        const cache = leerCache();
        if (cache && !forzar) {
            estado.datos = cache;
            alTerminarCarga();
            return;
        }

        mostrarBloque("alfabCargando");

        if (CONFIG.MOCK_ACTIVO) {
            fetch(CONFIG.MOCK_URL)
                .then((res) => {
                    if (!res.ok) throw new Error("No se pudo leer " + CONFIG.MOCK_URL);
                    return res.json();
                })
                .then((data) => {
                    if (!data.ok) throw new Error(data.error || "Respuesta inválida del mock.");
                    guardarDatos(data);
                })
                .catch((err) => manejarErrorCarga(err));
            return;
        }

        // Modo real: el mock local (mismo origen, sin CORS/JSONP) se usa
        // como "cascarón" para pintar el abecedario casi al instante,
        // mientras en paralelo se pide el dato real a Google Sheets. En
        // cuanto llegue el real, reemplaza en silencio lo que se esté
        // viendo (guardarDatos ya deja todo en caché para la próxima
        // vez). Así el módulo se siente listo en menos de 1 segundo aunque
        // Apps Script tarde varios segundos en responder, sin depender de
        // activar MOCK_ACTIVO ni desconectar el Sheet real.
        pintarMockDeInmediato();
        fetchRemoto();
    }

    // Pinta el mock local de inmediato SOLO si todavía no hay nada mejor
    // en pantalla (evita pisar el dato real si, por lo que sea, llegó
    // primero). Si el mock falla, no pasa nada: seguimos esperando el
    // dato real sin mostrar error por esto.
    function pintarMockDeInmediato() {
        fetch(CONFIG.MOCK_URL)
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("No se pudo leer " + CONFIG.MOCK_URL))))
            .then((data) => {
                if (!data.ok || estado.datos.alfabeto.length > 0) return;
                estado.datos = { alfabeto: data.alfabeto || [], ejemplos: data.ejemplos || [] };
                alTerminarCarga();
            })
            .catch(() => { /* silencioso: el dato real sigue en camino */ });
    }

    // Igual que quiz.js: JSONP porque Apps Script + GitHub Pages suele
    // bloquear la lectura por CORS aunque la URL funcione directamente.
    //
    // ⚠️ Los Web Apps de Apps Script "duermen" cuando nadie los usa por un
    // rato: la primera petición después de inactividad ("cold start") puede
    // tardar bastante más que una normal. Como <script src> no dispara
    // onerror mientras sigue cargando (solo si la red falla de verdad), un
    // cold start lento se ve exactamente igual que uno roto: el spinner se
    // queda quieto hasta que se cumple el timeout. Por eso: (1) el primer
    // intento usa un timeout corto, (2) si no respondió a tiempo se
    // reintenta UNA vez con un timeout más largo antes de rendirse, y
    // (3) el spinner avisa en pantalla si el segundo intento está en curso,
    // para que no parezca que la pantalla quedó colgada sin explicación.
    function fetchRemoto(esReintento) {
        if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.indexOf("PEGA_AQUI") > -1) {
            mostrarError("Alfabetización aún no está conectada a Google Sheets. Falta pegar la URL de Apps Script en js/alfabetizacion.js.");
            return;
        }

        if (esReintento) actualizarMensajeCargando("Google Sheets está tardando más de lo normal, reintentando...");

        const nombreCallback = "alfabV2Callback_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
        let resuelto = false;

        const limpiar = () => {
            delete window[nombreCallback];
            const s = document.getElementById(nombreCallback);
            if (s) s.remove();
        };

        window[nombreCallback] = function (data) {
            resuelto = true;
            limpiar();
            try {
                if (!data.ok) throw new Error(data.error || "Respuesta inválida del servidor.");
                guardarDatos(data);
            } catch (err) {
                manejarErrorCarga(err);
            }
        };

        const separador = CONFIG.APPS_SCRIPT_URL.indexOf("?") > -1 ? "&" : "?";
        const script = document.createElement("script");
        script.id = nombreCallback;
        // "modo=alfabetizacion" le dice al doGet único del proyecto (en
        // QuizAPI.gs, compartido con el Quiz) que debe responder con los
        // datos de Alfabetización y no con el banco de preguntas del Quiz.
        script.src = CONFIG.APPS_SCRIPT_URL + separador + "modo=alfabetizacion&callback=" + nombreCallback;
        script.onerror = () => {
            if (resuelto) return;
            limpiar();
            if (!esReintento) {
                fetchRemoto(true);
            } else {
                manejarErrorCarga(new Error("No se pudo conectar con Google Apps Script (revisa la URL o el despliegue)."));
            }
        };
        document.body.appendChild(script);

        // Primer intento: timeout corto (puede ser solo un cold start).
        // Reintento: timeout largo antes de mostrar el error definitivo.
        const espera = esReintento ? 15000 : 6000;
        setTimeout(() => {
            if (resuelto) return;
            limpiar();
            if (!esReintento) {
                fetchRemoto(true);
            } else {
                manejarErrorCarga(new Error("Tiempo de espera agotado al conectar con Google Sheets. El servicio puede estar lento o el despliegue del Apps Script tiene un problema."));
            }
        }, espera);
    }

    function guardarDatos(data) {
        estado.datos = { alfabeto: data.alfabeto || [], ejemplos: data.ejemplos || [] };
        guardarCache(estado.datos);
        alTerminarCarga();
    }

    function alTerminarCarga() {
        // OJO: esta función se puede llamar dos veces por el patrón de
        // "cascarón" de cargarDatos() -> primero cuando pinta el mock
        // local, y luego otra vez cuando llega el dato real de Google
        // Sheets (que puede tardar varios segundos). Antes, la segunda
        // llamada volvía a ejecutar cambiarModulo() SIEMPRE, y eso
        // reinicia la pantalla al render "intro" del módulo activo
        // (renderUnirIntro/renderCompletarIntro) sin importar en qué
        // parte del juego estaba el usuario. Si el dato real llegaba
        // justo cuando alguien acababa de pulsar "Empezar", se veía
        // como si el juego "se regresara solo" al menú de niveles.
        //
        // Por eso: solo la PRIMERA vez que hay datos disponibles se usa
        // cambiarModulo() para pintar el bloque correspondiente. Las
        // actualizaciones posteriores (el dato real reemplazando al
        // mock) quedan guardadas en estado.datos en silencio, y se
        // usarán la próxima vez que se arme una ronda nueva, sin tocar
        // la pantalla que el usuario esté viendo en este momento.
        if (!estado._alfabDatosListos) {
            estado._alfabDatosListos = true;
            cambiarModulo(estado.moduloActivo || "aprender");
        }
    }

    function manejarErrorCarga(err) {
        console.error("Error cargando Alfabetización:", err);
        const cache = leerCache(true); // ignora expiración como último recurso
        if (cache) {
            estado.datos = cache;
            alTerminarCarga();
        } else if (estado.datos.alfabeto.length > 0) {
            // Ya se alcanzó a pintar el mock local (ver pintarMockDeInmediato):
            // seguimos con eso en vez de tapar la pantalla con un error.
            console.warn("Alfabetización: usando datos de respaldo (mock) porque falló la conexión con Google Sheets.");
        } else {
            mostrarError("No se pudo cargar Alfabetización. Detalle técnico: " + (err && err.message ? err.message : err));
        }
    }

    function guardarCache(datos) {
        try {
            localStorage.setItem(CONFIG.CLAVE_CACHE, JSON.stringify({ ts: Date.now(), datos: datos }));
        } catch (e) { /* almacenamiento no disponible: se ignora silenciosamente */ }
    }

    function leerCache(ignorarExpiracion) {
        try {
            const crudo = localStorage.getItem(CONFIG.CLAVE_CACHE);
            if (!crudo) return null;
            const parsed = JSON.parse(crudo);
            const vencido = (Date.now() - parsed.ts) > CONFIG.DURACION_CACHE_MS;
            if (vencido && !ignorarExpiracion) return null;
            return parsed.datos || null;
        } catch (e) {
            return null;
        }
    }

    function mostrarError(msg) {
        ocultarTodosLosBloques();
        const cont = el("alfabError");
        cont.innerHTML = "";
        const texto = document.createElement("span");
        texto.textContent = "⚠️ " + msg;
        cont.appendChild(texto);

        const btnReintentar = document.createElement("button");
        btnReintentar.type = "button";
        btnReintentar.className = "btn btn-sm btn-outline-danger ms-3";
        btnReintentar.textContent = "🔄 Reintentar";
        btnReintentar.onclick = () => cargarDatos(true);
        cont.appendChild(btnReintentar);

        cont.classList.remove("d-none");
    }

    // Cambia el texto bajo el spinner de "alfabCargando" sin tocar el resto
    // del bloque, para que el usuario vea que la carga sigue intentando
    // (y no piense que la pantalla quedó colgada) mientras dura un
    // reintento de conexión con Google Sheets.
    function actualizarMensajeCargando(msg) {
        const cont = el("alfabCargando");
        if (!cont) return;
        const p = cont.querySelector("p");
        if (p) p.textContent = msg;
    }

    // ---------------------------------------------------------
    // NAVEGACIÓN ENTRE BLOQUES (cargando / error / los 3 módulos / resultados)
    // ---------------------------------------------------------
    function ocultarTodosLosBloques() {
        ["alfabCargando", "alfabAprender", "alfabCompletar", "alfabUnir", "alfabResultados", "quizCargando", "quizMenuJuegos"].forEach((id) => {
            const bloque = el(id);
            if (bloque) bloque.classList.add("d-none");
        });
    }

    function mostrarBloque(id) {
        ocultarTodosLosBloques();
        const bloque = el(id);
        if (bloque) bloque.classList.remove("d-none");
        el("alfabError").classList.add("d-none");
    }

    function cambiarModulo(modulo) {
        estado.moduloActivo = modulo;

        document.querySelectorAll("[data-alfab-modulo]").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.alfabModulo === modulo);
        });

        const idBloque = modulo === "aprender" ? "alfabAprender" : modulo === "completar" ? "alfabCompletar" : "alfabUnir";
        mostrarBloque(idBloque);
        renderModuloActivo();
    }

    function renderModuloActivo() {
        if (estado.moduloActivo === "aprender") {
            renderAprender();
        } else if (estado.moduloActivo === "completar") {
            renderCompletarIntro();
        } else if (estado.moduloActivo === "unir") {
            renderUnirIntro();
        }
    }

    // ===========================================================
    // MÓDULO 1: APRENDER
    // ===========================================================

    function listaFiltradaPorTipo() {
        return estado.datos.alfabeto.filter((c) => c.tipo === estado.aprender.tipo);
    }

    function caracterActual() {
        const lista = listaFiltradaPorTipo();
        if (!lista.length) return null;
        // por seguridad, si el índice quedó fuera de rango (p.ej. al cambiar de tipo)
        if (estado.aprender.indiceCaracter >= lista.length) estado.aprender.indiceCaracter = 0;
        return lista[estado.aprender.indiceCaracter];
    }

    function renderAprender() {
        renderIndiceCaracteres();
        renderCaracterActual();
    }

    // Índice de caracteres (mismo estilo .btn-abc del índice del diccionario)
    function renderIndiceCaracteres() {
        const cont = el("alfabIndiceCaracteres");
        if (!cont) return;
        const lista = listaFiltradaPorTipo();
        cont.innerHTML = lista.map((c, i) => {
            const activo = i === estado.aprender.indiceCaracter ? " fw-bold text-primary" : "";
            return `<button type="button" class="btn btn-link btn-abc text-decoration-none${activo}" data-indice="${i}">${c.caracter}</button>`;
        }).join("");

        cont.querySelectorAll("[data-indice]").forEach((btn) => {
            btn.addEventListener("click", () => {
                estado.aprender.indiceCaracter = Number(btn.dataset.indice);
                estado.aprender.ejemploIndice = 0;
                renderAprender();
            });
        });
    }

    // Convención de nombre para los videos de grafía. Las LETRAS tienen 4
    // variantes (mayúscula, minúscula, cursiva mayúscula, cursiva minúscula).
    // Los NÚMEROS no tienen variantes tipográficas, así que usan un solo
    // archivo por dígito (sin sufijo de variante). No vienen del Sheet: se
    // arman a partir del carácter (+ variante, si aplica).
    function rutaVideoGrafia(c, variante) {
        const base = "img/alfabetizacion/grafias/" + encodeURIComponent(c.caracter);
        if (c.tipo === "numero") return base + ".mp4";
        return base + "-" + variante + ".mp4";
    }

    // Misma convención que rutaVideoGrafia, pero para la imagen estática
    // que se muestra DENTRO de cada chip. Tampoco viene del Sheet.
    function rutaImagenGrafia(c, variante) {
        const base = "img/alfabetizacion/grafias/" + encodeURIComponent(c.caracter);
        if (c.tipo === "numero") return base + ".png";
        return base + "-" + variante + ".png";
    }

    // Actualiza la(s) imagen(es) de los chips para que muestren el carácter
    // actual: 4 imágenes (una por variante) si es letra, o solo 1 si es
    // número (los números no tienen mayúscula/minúscula/cursivas).
    function actualizarImagenesChips(c) {
        if (c.tipo === "numero") {
            const img = el("alfabChipNumeroImg");
            if (img) {
                img.src = rutaImagenGrafia(c, null);
                img.alt = c.caracter;
            }
            return;
        }
        CONFIG.VARIANTES_TIPO.forEach((v) => {
            const img = document.querySelector('[data-alfab-chip-img="' + v + '"]');
            if (!img) return;
            img.src = rutaImagenGrafia(c, v);
            img.alt = c.caracter + " (" + v + ")";
        });
    }

    // Pinta el chip activo y carga el video de grafía para el carácter
    // actual, conservando la velocidad ya elegida. En números no hay
    // variante que resaltar: solo se carga su único video de grafía.
    function renderVarianteActiva() {
        const c = caracterActual();
        if (!c) return;

        const video = el("alfabTrazoVideo");
        if (!video) return;

        if (c.tipo === "numero") {
            video.src = rutaVideoGrafia(c, null);
            video.playbackRate = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex];
            video.load();
            video.play().catch(() => { /* el autoplay puede requerir un gesto del usuario en algunos navegadores */ });
            return;
        }

        CONFIG.VARIANTES_TIPO.forEach((v) => {
            const chip = document.querySelector('[data-alfab-variante="' + v + '"]');
            if (chip) chip.classList.toggle("active", v === estado.aprender.variante);
        });

        video.src = rutaVideoGrafia(c, estado.aprender.variante);
        video.playbackRate = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex];
        video.load();
        video.play().catch(() => { /* el autoplay puede requerir un gesto del usuario en algunos navegadores */ });
    }

    function cambiarVarianteTipo(variante) {
        if (estado.aprender.variante === variante) return;
        estado.aprender.variante = variante;
        renderVarianteActiva();
    }

    // Las 4 cajas tipográficas (ahora chips) + fonética + grafía (video) + carrusel de ejemplos
    function renderCaracterActual() {
        const c = caracterActual();
        if (!c) return; // lista vacía (p.ej. mock sin números todavía)

        el("alfabCaracterActual").textContent = c.caracter;
        actualizarImagenesChips(c);

        renderFonetica(c);

        actualizarLabelVelocidad();
        renderVarianteActiva();

        renderEjemploActual();
    }

    // Boca (fonética): a partir de LSPedia soporta tanto imagen (.png/.jpg)
    // como video con fondo transparente (.webm/.mp4), según lo que traiga
    // imagenBoca del Sheet. Se detecta por la extensión del archivo.
    function esRutaDeVideo(ruta) {
        return /\.(webm|mp4|mov)(\?.*)?$/i.test(ruta || "");
    }

    // Busca el imagenBoca real de una letra en los datos ya cargados (para
    // reutilizarlo en la tira de números). Si no la encuentra, arma la ruta
    // clásica en png como respaldo.
    function bocaPorLetra(letra) {
        const item = (estado.datos.alfabeto || []).find((x) => x.tipo === "letra" && x.caracter === letra);
        return (item && item.imagenBoca) || ("img/alfabetizacion/boca/" + encodeURIComponent(letra) + ".png");
    }

    // Crea (o reutiliza) el elemento <img> o <video> dentro de bocaCaja según
    // corresponda, reemplazando el nodo solo si el tipo cambió respecto al
    // carácter anterior.
    function actualizarMediaBoca(contenedorId, elementId, ruta, alt) {
        const contenedor = el(contenedorId);
        if (!contenedor) return;
        const actual = document.getElementById(elementId);
        const necesitaVideo = esRutaDeVideo(ruta);
        const tipoActual = actual ? actual.tagName.toLowerCase() : null;

        if (tipoActual === (necesitaVideo ? "video" : "img")) {
            if (necesitaVideo) {
                if (actual.getAttribute("src") !== ruta) {
                    actual.src = ruta || "";
                    actual.load();
                    actual.play().catch(() => {});
                }
            } else {
                actual.src = ruta || "";
                actual.alt = alt || "";
            }
            return;
        }

        const nuevo = document.createElement(necesitaVideo ? "video" : "img");
        nuevo.id = elementId;
        nuevo.className = "apoyo-visual-img";
        nuevo.src = ruta || "";
        if (necesitaVideo) {
            nuevo.autoplay = true;
            nuevo.loop = true;
            nuevo.muted = true;
            nuevo.playsInline = true;
            nuevo.setAttribute("muted", "");
            nuevo.setAttribute("playsinline", "");
        } else {
            nuevo.alt = alt || "";
        }

        if (actual) {
            actual.replaceWith(nuevo);
        } else {
            contenedor.insertBefore(nuevo, contenedor.firstChild);
        }
    }

    // Pinta la sección de Fonética según el tipo de carácter:
    // LETRAS -> una sola imagen o video de boca.
    // NÚMEROS -> tira desplazable con la boca de cada letra de la palabra
    //            (ej. "13" -> T, R, E, C, E), reutilizando el imagenBoca real
    //            de cada letra (imagen o video, lo que corresponda).
    function renderFonetica(c) {
        const bocaCaja = el("alfabBocaCaja");
        const bocaNumeroWrap = el("alfabBocaNumeroWrap");

        if (c.tipo === "numero") {
            if (bocaCaja) bocaCaja.classList.add("d-none");
            if (bocaNumeroWrap) {
                bocaNumeroWrap.classList.remove("d-none");
                bocaNumeroWrap.classList.add("d-flex");
            }

            const palabra = CONFIG.PALABRA_NUMERO[c.caracter] || "";
            const tira = el("alfabBocaNumeroTira");
            if (tira) {
                tira.innerHTML = "";
                palabra.split("").forEach((letra) => {
                    const item = document.createElement("div");
                    item.className = "alfab-boca-numero-item";

                    const ruta = bocaPorLetra(letra);
                    const media = document.createElement(esRutaDeVideo(ruta) ? "video" : "img");
                    media.src = ruta;
                    if (media.tagName === "VIDEO") {
                        media.autoplay = true;
                        media.loop = true;
                        media.muted = true;
                        media.playsInline = true;
                        media.setAttribute("muted", "");
                        media.setAttribute("playsinline", "");
                    } else {
                        media.alt = "Boca de la letra " + letra;
                    }

                    const label = document.createElement("span");
                    label.textContent = letra;

                    item.appendChild(media);
                    item.appendChild(label);
                    tira.appendChild(item);
                });
                tira.scrollLeft = 0;
            }
            return;
        }

        if (bocaCaja) bocaCaja.classList.remove("d-none");
        if (bocaNumeroWrap) {
            bocaNumeroWrap.classList.add("d-none");
            bocaNumeroWrap.classList.remove("d-flex");
        }
        actualizarMediaBoca("alfabBocaCaja", "alfabBocaImg", c.imagenBoca, "Boca de la letra " + c.caracter);
    }

    function irACaracter(delta) {
        const lista = listaFiltradaPorTipo();
        if (!lista.length) return;
        estado.aprender.indiceCaracter = (estado.aprender.indiceCaracter + delta + lista.length) % lista.length;
        estado.aprender.ejemploIndice = 0;
        estado.aprender.variante = "mayuscula";
        renderAprender();
    }

    function cambiarTipo(tipo) {
        estado.aprender.tipo = tipo;
        estado.aprender.indiceCaracter = 0;
        estado.aprender.ejemploIndice = 0;
        estado.aprender.variante = "mayuscula";

        el("btnAlfabTipoLetras").classList.toggle("active", tipo === "letra");
        el("btnAlfabTipoNumeros").classList.toggle("active", tipo === "numero");

        const esNumero = tipo === "numero";

        // Números: 1 solo chip (sin variantes tipográficas) en vez de 4.
        const chipsLetra = el("alfabEstilosTipograficos");
        const chipNumero = el("alfabChipNumero");
        if (chipsLetra) chipsLetra.classList.toggle("d-none", esNumero);
        if (chipNumero) chipNumero.classList.toggle("d-none", !esNumero);

        // Números: sin sección de ejemplos de palabras.
        const ejemplosSeccion = el("alfabEjemplosSeccion");
        if (ejemplosSeccion) ejemplosSeccion.classList.toggle("d-none", esNumero);

        renderAprender();
    }

    // --- Control de velocidad de la grafía (video) ---
    // Al ser <video> (y no GIF), la velocidad es real: se aplica
    // directamente con .playbackRate, sin trucos ni recargas.
    function cambiarVelocidad(delta) {
        const max = CONFIG.VELOCIDADES_TRAZO.length - 1;
        estado.aprender.velocidadIndex = Math.min(max, Math.max(0, estado.aprender.velocidadIndex + delta));
        const video = el("alfabTrazoVideo");
        if (video) video.playbackRate = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex];
        actualizarLabelVelocidad();
    }

    function actualizarLabelVelocidad() {
        const label = el("alfabTrazoVelocidadLabel");
        if (label) label.textContent = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex] + "x";
    }

    function reiniciarTrazo() {
        const video = el("alfabTrazoVideo");
        if (!video || !video.src) return;
        video.currentTime = 0;
        video.play().catch(() => { /* el autoplay puede requerir un gesto del usuario en algunos navegadores */ });
    }

    // --- Carrusel de ejemplos del carácter actual ---
    function ejemplosDelCaracterActual() {
        const c = caracterActual();
        if (!c) return [];
        return estado.datos.ejemplos
            .filter((e) => e.caracter === c.caracter)
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }

    function renderEjemploActual() {
        const ejemplos = ejemplosDelCaracterActual();
        const imgEl = el("alfabEjemploImagen");
        const palabraEl = el("alfabEjemploPalabra");
        const contadorEl = el("alfabEjemploContador");

        if (!ejemplos.length) {
            imgEl.src = "";
            palabraEl.textContent = "—";
            contadorEl.textContent = "0 / 0";
            return;
        }

        if (estado.aprender.ejemploIndice >= ejemplos.length) estado.aprender.ejemploIndice = 0;
        const ejemplo = ejemplos[estado.aprender.ejemploIndice];

        imgEl.src = ejemplo.imagen || "";
        imgEl.alt = ejemplo.palabra || "";
        palabraEl.innerHTML = resaltarLetraInicial(ejemplo.palabra || "—");
        contadorEl.textContent = (estado.aprender.ejemploIndice + 1) + " / " + ejemplos.length;
    }

    // Envuelve la primera letra de la palabra en un span más grande y en
    // negrita (la letra/número que se está enseñando en este momento).
    function resaltarLetraInicial(palabra) {
        if (!palabra) return "—";
        const primera = palabra.charAt(0);
        const resto = palabra.slice(1);
        return '<span class="alfab-ejemplo-letra-inicial">' + escaparHtml(primera) + "</span>" + escaparHtml(resto);
    }

    function escaparHtml(texto) {
        const div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }

    function irAEjemplo(delta) {
        const ejemplos = ejemplosDelCaracterActual();
        if (!ejemplos.length) return;
        estado.aprender.ejemploIndice = (estado.aprender.ejemploIndice + delta + ejemplos.length) % ejemplos.length;
        renderEjemploActual();
    }

    // ===========================================================
    // MÓDULO 2: JUEGO "COMPLETAR LA PALABRA"
    // Fusiona palabras del abecedario (con imagen, vienen de
    // estado.datos.ejemplos) y palabras de los números (sin imagen,
    // vienen de CONFIG.PALABRA_NUMERO) en un solo banco de preguntas.
    // Interacción por TAP (no arrastre): se toca la letra correcta y
    // se coloca sola en el espacio en blanco — más simple y funciona
    // igual de bien en móvil que arrastrar.
    // ===========================================================

    // Quita tildes de una sola letra para poder compararla contra las
    // fichas de letra disponibles (A-Z + Ñ, siempre sin acentos).
    function normalizarLetra(letra) {
        const mapa = { "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", "Ü": "U" };
        return mapa[letra] || letra;
    }

    // Barajado Fisher-Yates genérico (no muta el arreglo original).
    function barajar(arr) {
        const copia = arr.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    // ---------------------------------------------------------
    // SONIDOS Y VIBRACIÓN (mismo patrón que js/quiz.js, sintetizado
    // con Web Audio API, sin archivos externos). Se usan en los
    // juegos "Completar la palabra" y "Unir con flechas".
    // ---------------------------------------------------------
    function obtenerAudioCtx() {
        if (!estado.audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) estado.audioCtx = new AC();
        }
        return estado.audioCtx;
    }

    function tono(frecuencia, duracionMs, retrasoMs, tipo) {
        const ctx = obtenerAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = tipo || "sine";
        osc.frequency.value = frecuencia;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + (retrasoMs / 1000));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (retrasoMs / 1000) + (duracionMs / 1000));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + (retrasoMs / 1000));
        osc.stop(ctx.currentTime + (retrasoMs / 1000) + (duracionMs / 1000) + 0.05);
    }

    function reproducirSonidoCorrecto() {
        tono(587, 120, 0, "triangle");
        tono(880, 160, 110, "triangle");
    }

    function reproducirSonidoIncorrecto() {
        tono(220, 220, 0, "sawtooth");
        vibrarError();
    }

    // Vibración corta al equivocarse (si el dispositivo/navegador lo
    // permite). Safari/iOS no soporta navigator.vibrate: falla en silencio.
    function vibrarError() {
        if (navigator.vibrate) {
            try { navigator.vibrate(200); } catch (e) { /* no soportado o bloqueado */ }
        }
    }

    function bancoPalabrasCompletar() {
        const deLetras = (estado.datos.ejemplos || [])
            .filter((e) => e.palabra && e.palabra.length >= 3)
            .map((e) => ({ palabra: e.palabra.toUpperCase(), imagen: e.imagen, numero: null }));

        const deNumeros = Object.keys(CONFIG.PALABRA_NUMERO).map((n) => ({
            palabra: CONFIG.PALABRA_NUMERO[n],
            imagen: null,
            numero: n
        }));

        // Vocabulario (Hoja 2, mismo banco que usa el Quiz) suma al pool
        // toda palabra que ya tenga una imagen de apoyo REAL cargada (no
        // la descripción en texto que se usa como prompt para generarla
        // más adelante). Hoy la Hoja 2 normalmente no trae columna
        // "imagen" (solo video), así que por ahora esto casi no suma
        // palabras; en cuanto la Hoja 2 tenga imagen cargada empiezan a
        // aparecer también sin tocar este archivo.
        // A propósito NO se usa el Diccionario (Hoja 1, window.App.datos):
        // Completar solo debe salir de Alfabetización (abecedario/números)
        // y Vocabulario (Hoja 2).
        const bancoHoja2 = (window.QuizV2 && typeof QuizV2.obtenerBanco === "function") ? QuizV2.obtenerBanco() : [];
        const deVocabulario = obtenerPalabrasConImagenDe(bancoHoja2);

        // Una misma palabra puede repetirse entre fuentes (p.ej. estar en
        // los ejemplos del abecedario Y en Vocabulario); se prioriza el
        // primer origen en el que aparece (abecedario > números >
        // Vocabulario) y se descarta el resto para no repetirla dos veces
        // en una misma ronda.
        const combinado = deLetras.concat(deNumeros, deVocabulario);
        const vistas = new Set();
        return combinado.filter((p) => {
            const clave = p.palabra.trim().toUpperCase();
            if (vistas.has(clave)) return false;
            vistas.add(clave);
            return true;
        });
    }

    // Palabras de una lista del Diccionario o del Vocabulario que ya
    // tengan una imagen de apoyo real cargada en la columna "imagen" del
    // Sheet (admite varias separadas por coma, se usa solo la primera;
    // mismo criterio que obtenerImagenesDeApoyo() en js/script.js). Se
    // filtran también por longitud para que la palabra sea jugable: ni
    // muy corta, ni una frase tan larga que no entre bien en pantalla.
    function obtenerPalabrasConImagenDe(lista) {
        if (!Array.isArray(lista)) return [];
        return lista
            .map((p) => ({ palabra: p.palabra, imagenUrl: primeraImagenUsable(p.imagen) }))
            .filter((p) => p.palabra && p.imagenUrl && p.palabra.trim().length >= 3 && p.palabra.trim().length <= 22)
            .map((p) => ({ palabra: p.palabra.toUpperCase(), imagen: p.imagenUrl, numero: null }));
    }

    // Distingue una URL/ruta de imagen real de una descripción en texto
    // (el "prompt" que se usa para generar la imagen más adelante y que
    // todavía no se ha convertido en un archivo real). Si el campo no
    // parece una URL/ruta, se descarta en vez de intentar mostrarla como
    // <img>, que rompería la tarjeta.
    function primeraImagenUsable(campoImagen) {
        if (!campoImagen) return null;
        const primera = String(campoImagen).split(",")[0].trim();
        if (!primera) return null;
        const pareceUrl = /^https?:\/\//i.test(primera) || primera.indexOf("/") > -1;
        return pareceUrl ? primera : null;
    }

    function nivelCompletarActual() {
        return CONFIG.NIVELES_COMPLETAR.find((n) => n.id === estado.completar.nivelId) || CONFIG.NIVELES_COMPLETAR[0];
    }

    function renderCompletarIntro() {
        detenerTimerCompletar();
        if (!estado.completar.nivelId) estado.completar.nivelId = CONFIG.NIVELES_COMPLETAR[0].id;

        const cont = el("alfabCompletarSelectorNivel");
        if (cont) {
            cont.innerHTML = "";
            CONFIG.NIVELES_COMPLETAR.forEach((nivel) => {
                const col = document.createElement("div");
                col.className = "col-4";

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "quiz-selector-btn w-100" + (nivel.id === estado.completar.nivelId ? " activo" : "");
                btn.innerHTML = '<span class="icono">' + nivel.icono + "</span>" + nivel.nombre;
                btn.addEventListener("click", () => {
                    estado.completar.nivelId = nivel.id;
                    cont.querySelectorAll(".quiz-selector-btn").forEach((b) => b.classList.remove("activo"));
                    btn.classList.add("activo");
                });

                col.appendChild(btn);
                cont.appendChild(col);
            });
        }

        const totalEl = el("alfabCompletarTotalDisponibles");
        if (totalEl) totalEl.textContent = bancoPalabrasCompletar().length + " palabras disponibles (abecedario + números + vocabulario)";

        const intro = el("alfabCompletarIntro");
        const activo = el("alfabCompletarActivo");
        if (intro) intro.classList.remove("d-none");
        if (activo) activo.classList.add("d-none");
    }

    function iniciarJuegoCompletar() {
        const banco = barajar(bancoPalabrasCompletar());
        const cantidad = Math.min(CONFIG.PREGUNTAS_POR_RONDA_COMPLETAR, banco.length);

        estado.completar.preguntas = banco.slice(0, cantidad);
        estado.completar.indice = 0;
        estado.completar.puntaje = 0;
        estado.completar.correctas = 0;
        estado.completar.incorrectas = 0;
        estado.completar.revision = [];
        estado.completar.respondida = false;
        estado.completar.racha = 0;

        el("alfabCompletarIntro").classList.add("d-none");
        el("alfabCompletarActivo").classList.remove("d-none");

        renderPreguntaCompletar();
    }

    function renderPreguntaCompletar() {
        detenerTimerCompletar();
        estado.completar.respondida = false;

        const nivel = nivelCompletarActual();
        const pregunta = estado.completar.preguntas[estado.completar.indice];
        if (!pregunta) { mostrarResultadosCompletar(); return; }

        el("alfabCompletarProgreso").textContent = "Palabra " + (estado.completar.indice + 1) + " de " + estado.completar.preguntas.length;
        const badge = el("alfabCompletarNivelBadge");
        badge.textContent = nivel.nombre;
        badge.className = "badge " + nivel.badgeClase;
        el("alfabCompletarPuntaje").textContent = "⭐ " + estado.completar.puntaje;
        el("alfabCompletarBarraProgreso").style.width = (estado.completar.indice / estado.completar.preguntas.length * 100) + "%";
        el("btnAlfabCompletarSiguiente").classList.add("d-none");
        el("alfabCompletarFeedback").innerHTML = "";
        actualizarRachaCompletar();

        // Cuántas y cuáles letras faltan, según el nivel (Fácil=1, Medio=2,
        // Difícil=3 letras). Nunca se deja la palabra 100% en blanco: si es
        // muy corta, se limita para que quede al menos 1 letra visible. Los
        // espacios (frases del Diccionario/Vocabulario, ej. "Buenos días")
        // nunca se eligen como blanco: no hay ficha de "espacio" entre las
        // opciones, así que dejarlo en blanco sería imposible de completar.
        const letras = pregunta.palabra.split("");
        const indicesCandidatos = letras.map((_, i) => i).filter((i) => letras[i].trim() !== "");
        const cantidadBlancos = Math.min(nivel.letrasFaltantes, Math.max(1, indicesCandidatos.length - 1));
        const indicesBlanco = barajar(indicesCandidatos).slice(0, cantidadBlancos).sort((a, b) => a - b);
        pregunta._indicesBlanco = indicesBlanco;
        pregunta._letrasCorrectas = indicesBlanco.map((i) => normalizarLetra(letras[i]));

        estado.completar.subIndice = 0;
        estado.completar.palabraTuvoError = false;

        const cont = el("alfabCompletarContenido");
        cont.innerHTML = "";

        // Capa para la cuenta regresiva "3, 2, 1, ¡fin!" (transparente,
        // superpuesta sobre el juego). Se crea vacía y oculta; el
        // temporizador la llena solo cuando quedan pocos segundos.
        const capaCuenta = document.createElement("div");
        capaCuenta.id = "alfabCompletarCuentaRegresiva";
        capaCuenta.className = "completar-cuenta-regresiva d-none";
        cont.appendChild(capaCuenta);

        // Imagen (letras del abecedario) o número grande (números, sin
        // imagen de ejemplo).
        const cajaImagen = document.createElement("div");
        if (pregunta.imagen) {
            cajaImagen.className = "completar-imagen-caja mx-auto mb-3";
            const img = document.createElement("img");
            img.src = pregunta.imagen;
            img.alt = pregunta.palabra;
            cajaImagen.appendChild(img);
        } else {
            cajaImagen.className = "completar-imagen-caja mx-auto mb-3";
            const num = document.createElement("span");
            num.className = "completar-numero-grande";
            num.textContent = pregunta.numero;
            cajaImagen.appendChild(num);
        }
        cont.appendChild(cajaImagen);

        // Palabra con los espacios en blanco (uno o varios, según el nivel)
        const filaPalabra = document.createElement("div");
        filaPalabra.className = "completar-palabra mb-2";
        letras.forEach((letra, i) => {
            const esEspacio = letra.trim() === "";
            const esBlanco = indicesBlanco.includes(i);
            const casilla = document.createElement("span");
            casilla.className = "completar-letra-casilla" + (esBlanco ? " blank" : "");
            casilla.textContent = esBlanco ? "" : letra;
            casilla.id = "completarCasilla" + i;
            if (esEspacio) {
                // Espacio entre palabras de una frase: se ve como un hueco,
                // no como una casilla de letra (sin borde ni fondo).
                casilla.style.border = "none";
                casilla.style.background = "transparent";
                casilla.style.width = "0.6em";
                casilla.style.minWidth = "0.6em";
            }
            filaPalabra.appendChild(casilla);
        });
        cont.appendChild(filaPalabra);

        // Contenedor de opciones de letra: se redibuja solo (sin rehacer
        // toda la palabra) cada vez que se pasa a la siguiente letra
        // faltante dentro de la misma palabra (ver renderOpcionesBlancoActual).
        const filaOpciones = document.createElement("div");
        filaOpciones.id = "alfabCompletarOpciones";
        filaOpciones.className = "completar-opciones d-flex flex-wrap justify-content-center gap-2 mt-3";
        cont.appendChild(filaOpciones);

        renderOpcionesBlancoActual();
        const segundosParaEstaPalabra = Math.min(
            CONFIG.TIEMPO_MAXIMO_COMPLETAR_SEG,
            Math.round(nivel.tiempoBaseSeg + pregunta.palabra.length * nivel.segPorLetra)
        );
        iniciarTimerCompletar(segundosParaEstaPalabra);
    }

    // Dibuja las opciones de letra para la letra faltante actual
    // (estado.completar.subIndice) y resalta con ".activa" cuál casilla
    // toca llenar ahora, cuando hay más de una (niveles Medio/Difícil).
    function renderOpcionesBlancoActual() {
        const nivel = nivelCompletarActual();
        const pregunta = estado.completar.preguntas[estado.completar.indice];
        const subIndice = estado.completar.subIndice;
        const indiceBlanco = pregunta._indicesBlanco[subIndice];
        const letraCorrecta = pregunta._letrasCorrectas[subIndice];
        estado.completar.blancoRespondido = false;

        pregunta._indicesBlanco.forEach((idx) => {
            const casilla = el("completarCasilla" + idx);
            if (casilla) casilla.classList.toggle("activa", idx === indiceBlanco);
        });

        const opciones = new Set([letraCorrecta]);
        while (opciones.size < nivel.opciones) {
            opciones.add(CONFIG.LETRAS_DISPONIBLES[Math.floor(Math.random() * CONFIG.LETRAS_DISPONIBLES.length)]);
        }
        const opcionesBarajadas = barajar(Array.from(opciones));

        const filaOpciones = el("alfabCompletarOpciones");
        if (!filaOpciones) return;
        filaOpciones.innerHTML = "";
        opcionesBarajadas.forEach((letra) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "completar-opcion-letra";
            btn.textContent = letra;
            btn.addEventListener("click", () => seleccionarOpcionCompletar(letra, btn));
            filaOpciones.appendChild(btn);
        });
    }

    function seleccionarOpcionCompletar(letra, btnEl) {
        if (estado.completar.respondida || estado.completar.blancoRespondido) return;
        estado.completar.blancoRespondido = true;

        const pregunta = estado.completar.preguntas[estado.completar.indice];
        const subIndice = estado.completar.subIndice;
        const indiceBlanco = pregunta._indicesBlanco[subIndice];
        const letraCorrecta = pregunta._letrasCorrectas[subIndice];
        const esCorrecta = letra === letraCorrecta;

        const casilla = el("completarCasilla" + indiceBlanco);
        if (casilla) {
            casilla.textContent = pregunta.palabra[indiceBlanco];
            casilla.classList.remove("activa");
            casilla.classList.add(esCorrecta ? "correcta" : "incorrecta");
        }

        document.querySelectorAll(".completar-opcion-letra").forEach((b) => {
            b.disabled = true;
            if (b === btnEl) b.classList.add(esCorrecta ? "correcta" : "incorrecta");
            if (!esCorrecta && b.textContent === letraCorrecta) b.classList.add("correcta");
        });

        if (esCorrecta) {
            estado.completar.puntaje += 10;
            estado.completar.racha++;
            reproducirSonidoCorrecto();
        } else {
            estado.completar.palabraTuvoError = true;
            estado.completar.racha = 0;
            reproducirSonidoIncorrecto();
        }
        el("alfabCompletarPuntaje").textContent = "⭐ " + estado.completar.puntaje;
        actualizarRachaCompletar();

        const quedanLetrasFaltantes = subIndice + 1 < pregunta._indicesBlanco.length;
        if (quedanLetrasFaltantes) {
            estado.completar.subIndice++;
            // Pequeña pausa para que se alcance a ver el color antes de
            // pasar a la siguiente letra faltante de la misma palabra.
            setTimeout(() => {
                if (!estado.completar.respondida) renderOpcionesBlancoActual();
            }, 700);
            return;
        }

        finalizarPreguntaCompletar(!estado.completar.palabraTuvoError);
    }

    function tiempoAgotadoCompletar() {
        if (estado.completar.respondida) return;

        const pregunta = estado.completar.preguntas[estado.completar.indice];
        // Revela todas las letras que quedaron sin responder (puede ser
        // más de una si se acabó el tiempo con varias letras faltantes).
        pregunta._indicesBlanco.slice(estado.completar.subIndice).forEach((idx) => {
            const casilla = el("completarCasilla" + idx);
            if (casilla) {
                casilla.textContent = pregunta.palabra[idx];
                casilla.classList.remove("activa");
                casilla.classList.add("incorrecta");
            }
        });
        document.querySelectorAll(".completar-opcion-letra").forEach((b) => { b.disabled = true; });

        estado.completar.palabraTuvoError = true;
        estado.completar.racha = 0;
        actualizarRachaCompletar();
        reproducirSonidoIncorrecto();
        el("alfabCompletarFeedback").innerHTML = '<span class="text-danger">⏱ Se acabó el tiempo.</span>';
        finalizarPreguntaCompletar(false);
    }

    // Muestra/oculta el indicador de racha 🔥 junto al puntaje. Solo se
    // hace visible a partir de 2 aciertos seguidos, para no distraer
    // en cada letra.
    function actualizarRachaCompletar() {
        const badge = el("alfabCompletarRacha");
        if (!badge) return;
        const racha = estado.completar.racha;
        if (racha >= 2) {
            badge.textContent = "🔥 " + racha;
            badge.classList.remove("d-none");
            badge.classList.remove("pulso");
            void badge.offsetWidth; // reinicia la animación aunque el texto cambie
            badge.classList.add("pulso");
        } else {
            badge.classList.add("d-none");
        }
    }

    // Confeti sencillo con <div> (sin librerías): unas piezas de color
    // caen desde arriba de la tarjeta de imagen al acertar una palabra
    // completa sin errores.
    function lanzarConfetiCompletar() {
        const caja = el("alfabCompletarContenido");
        if (!caja) return;
        const colores = ["#f59e0b", "#16a34a", "#0284c7", "#dc2626", "#9333ea"];
        for (let i = 0; i < 14; i++) {
            const pieza = document.createElement("div");
            pieza.className = "completar-confeti-pieza";
            pieza.style.left = (10 + Math.random() * 80) + "%";
            pieza.style.background = colores[i % colores.length];
            pieza.style.animationDelay = (Math.random() * 0.2) + "s";
            caja.appendChild(pieza);
            setTimeout(() => pieza.remove(), 1400);
        }
    }

    // Cuánto se espera (en ms) antes de pasar solo a la siguiente palabra,
    // una vez que la actual queda resuelta (correcta o con error), para que
    // la persona alcance a ver el resultado antes del cambio de pantalla.
    const PAUSA_AUTOAVANCE_COMPLETAR_MS = 1400;

    // Cierra la palabra actual (todas sus letras faltantes ya respondidas
    // o el tiempo se acabó): registra el puntaje y la revisión final, y
    // pasa automáticamente a la siguiente palabra tras una breve pausa
    // (ya no depende de que la persona toque "Siguiente →").
    function finalizarPreguntaCompletar(fueCorrecta) {
        estado.completar.respondida = true;
        detenerTimerCompletar();
        ocultarCuentaRegresivaCompletar();

        const pregunta = estado.completar.preguntas[estado.completar.indice];
        if (fueCorrecta) {
            estado.completar.correctas++;
            el("alfabCompletarFeedback").innerHTML = '<span class="text-success">¡Muy bien! 🎉</span>';
            lanzarConfetiCompletar();
        } else {
            estado.completar.incorrectas++;
            if (!el("alfabCompletarFeedback").innerHTML) {
                el("alfabCompletarFeedback").innerHTML = '<span class="text-danger">Revisa las letras en rojo</span>';
            }
        }
        estado.completar.revision.push({ ok: fueCorrecta, texto: pregunta.palabra + " (" + pregunta._letrasCorrectas.join(", ") + ")" });

        // El botón "Siguiente →" queda oculto: el avance ahora es
        // automático. Se deja de referencia por si se necesita reactivar.
        if (estado.completar._timerAutoAvance) clearTimeout(estado.completar._timerAutoAvance);
        estado.completar._timerAutoAvance = setTimeout(avanzarCompletar, PAUSA_AUTOAVANCE_COMPLETAR_MS);
    }

    function avanzarCompletar() {
        if (estado.completar._timerAutoAvance) {
            clearTimeout(estado.completar._timerAutoAvance);
            estado.completar._timerAutoAvance = null;
        }
        estado.completar.indice++;
        if (estado.completar.indice >= estado.completar.preguntas.length) {
            mostrarResultadosCompletar();
        } else {
            renderPreguntaCompletar();
        }
    }

    function iniciarTimerCompletar(segundos) {
        estado.completar.tiempoRestante = segundos;
        const barra = el("alfabCompletarBarraTiempo");
        if (barra) {
            barra.style.width = "100%";
            barra.classList.remove("tiempo-medio", "tiempo-critico");
        }
        ocultarCuentaRegresivaCompletar();
        estado.completar.timerId = setInterval(() => {
            estado.completar.tiempoRestante--;
            const pct = Math.max(0, (estado.completar.tiempoRestante / segundos) * 100);
            if (barra) {
                barra.style.width = pct + "%";
                barra.classList.toggle("tiempo-medio", pct <= 50 && pct > 25);
                barra.classList.toggle("tiempo-critico", pct <= 25);
            }
            // Últimos 3 segundos: "3, 2, 1" y, al llegar a 0, "¡Fin!" antes
            // de que tiempoAgotadoCompletar() tome el control.
            if (estado.completar.tiempoRestante <= 3 && estado.completar.tiempoRestante >= 1) {
                mostrarCuentaRegresivaCompletar(estado.completar.tiempoRestante);
            }
            if (estado.completar.tiempoRestante <= 0) {
                mostrarCuentaRegresivaCompletar("¡Fin!");
                detenerTimerCompletar();
                tiempoAgotadoCompletar();
            }
        }, 1000);
    }

    function detenerTimerCompletar() {
        if (estado.completar.timerId) {
            clearInterval(estado.completar.timerId);
            estado.completar.timerId = null;
        }
        // También cancela el avance automático a la siguiente palabra: si
        // se sale del juego (menú, cambiar de módulo, etc.) justo después
        // de responder, no debe saltar solo a otra pantalla.
        if (estado.completar._timerAutoAvance) {
            clearTimeout(estado.completar._timerAutoAvance);
            estado.completar._timerAutoAvance = null;
        }
    }

    // Muestra el número (o "¡Fin!") grande y transparente superpuesto
    // sobre el juego, con una pequeña animación de pulso. Se reinicia la
    // animación en cada llamada aunque el texto cambie de "3" a "2", etc.
    function mostrarCuentaRegresivaCompletar(texto) {
        const capa = el("alfabCompletarCuentaRegresiva");
        if (!capa) return;
        capa.innerHTML = '<span class="numero">' + texto + "</span>";
        capa.classList.remove("d-none");
        const span = capa.querySelector(".numero");
        if (span) {
            span.classList.remove("numero");
            void span.offsetWidth; // reinicia la animación CSS
            span.classList.add("numero");
        }
    }

    function ocultarCuentaRegresivaCompletar() {
        const capa = el("alfabCompletarCuentaRegresiva");
        if (!capa) return;
        capa.classList.add("d-none");
        capa.innerHTML = "";
    }

    function mostrarResultadosCompletar() {
        detenerTimerCompletar();
        const total = estado.completar.correctas + estado.completar.incorrectas;
        const pct = total ? Math.round((estado.completar.correctas / total) * 100) : 0;

        el("alfabResultadoIcono").textContent = pct >= 70 ? "🏆" : pct >= 40 ? "👍" : "💪";
        el("alfabResultadoTitulo").textContent = "¡Ronda completada!";
        el("alfabResultadoTexto").textContent = "Completaste " + total + ' palabras del juego "Completar la palabra".';
        el("alfabStatCorrectas").textContent = estado.completar.correctas;
        el("alfabStatIncorrectas").textContent = estado.completar.incorrectas;
        el("alfabStatPorcentaje").textContent = pct + "%";

        const lista = el("alfabRevisionLista");
        if (lista) {
            lista.innerHTML = "";
            estado.completar.revision.forEach((r) => {
                const item = document.createElement("div");
                item.className = "quiz-revision-item " + (r.ok ? "ok" : "fail");
                item.innerHTML = "<span>" + (r.ok ? "✔" : "✘") + " " + r.texto + "</span>";
                lista.appendChild(item);
            });
        }

        estado._alfabResultadosVolverA = "completar";
        mostrarBloque("alfabResultados");
    }

    // ===========================================================
    // MÓDULO 3: JUEGO "UNIR CON FLECHAS"
    // Columna izquierda = imágenes (letras) o números grandes;
    // columna derecha = palabras, en orden barajado independiente.
    // Interacción por TOQUE (no arrastre libre, más confiable en
    // móvil): se toca un ítem de una columna y luego su pareja en la
    // otra columna; eso dibuja una línea "pendiente" (gris) entre
    // ambos. El botón "✔ Comprobar" valida todas las conexiones
    // pendientes a la vez: las correctas quedan bloqueadas en verde,
    // las incorrectas se muestran un momento en rojo y luego se
    // liberan para reintentarlas. Al completar todas las parejas de
    // la ronda, se pasa automáticamente a la siguiente ronda (o a
    // resultados si era la última).
    // ===========================================================

    // Mismo banco de imágenes que "Completar" (ejemplos con imagen del
    // abecedario), más los números (sin imagen, número grande) y las
    // palabras de Vocabulario (Hoja 2, mismo banco que usa el Quiz) que
    // ya tengan imagen de apoyo real. A propósito NO se usa el
    // Diccionario (Hoja 1, window.App.datos): Unir solo debe salir de
    // Alfabetización y Vocabulario, igual que Completar.
    function bancoParesUnir() {
        const deLetras = (estado.datos.ejemplos || [])
            .filter((e) => e.palabra && e.imagen)
            .map((e) => ({ palabra: e.palabra.toUpperCase(), imagen: e.imagen, numero: null }));

        const deNumeros = Object.keys(CONFIG.PALABRA_NUMERO).map((n) => ({
            palabra: CONFIG.PALABRA_NUMERO[n],
            imagen: null,
            numero: n
        }));

        const bancoHoja2 = (window.QuizV2 && typeof QuizV2.obtenerBanco === "function") ? QuizV2.obtenerBanco() : [];
        const deVocabulario = obtenerPalabrasConImagenDe(bancoHoja2);

        const combinado = deLetras.concat(deNumeros, deVocabulario);
        const vistas = new Set();
        return combinado.filter((p) => {
            const clave = p.palabra.trim().toUpperCase();
            if (vistas.has(clave)) return false;
            vistas.add(clave);
            return true;
        });
    }

    function nivelUnirActual() {
        return CONFIG.NIVELES_UNIR.find((n) => n.id === estado.unir.nivelId) || CONFIG.NIVELES_UNIR[0];
    }

    function renderUnirIntro() {
        if (!estado.unir.nivelId) estado.unir.nivelId = CONFIG.NIVELES_UNIR[0].id;

        const cont = el("alfabUnirSelectorNivel");
        if (cont) {
            cont.innerHTML = "";
            CONFIG.NIVELES_UNIR.forEach((nivel) => {
                const col = document.createElement("div");
                col.className = "col-4";

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "quiz-selector-btn w-100" + (nivel.id === estado.unir.nivelId ? " activo" : "");
                btn.innerHTML = '<span class="icono">' + nivel.icono + "</span>" + nivel.nombre;
                btn.addEventListener("click", () => {
                    estado.unir.nivelId = nivel.id;
                    cont.querySelectorAll(".quiz-selector-btn").forEach((b) => b.classList.remove("activo"));
                    btn.classList.add("activo");
                });

                col.appendChild(btn);
                cont.appendChild(col);
            });
        }

        const totalEl = el("alfabUnirTotalDisponibles");
        if (totalEl) totalEl.textContent = bancoParesUnir().length + " parejas disponibles (abecedario + números + vocabulario)";

        const intro = el("alfabUnirIntro");
        const activo = el("alfabUnirActivo");
        if (intro) intro.classList.remove("d-none");
        if (activo) activo.classList.add("d-none");
    }

    function iniciarJuegoUnir() {
        estado.unir.ronda = 0;
        estado.unir.puntaje = 0;
        estado.unir.correctas = 0;
        estado.unir.incorrectas = 0;
        estado.unir.revision = [];

        el("alfabUnirIntro").classList.add("d-none");
        el("alfabUnirActivo").classList.remove("d-none");

        prepararRondaUnir();
    }

    // Arma un tablero nuevo: elige "pares" parejas al azar del banco y
    // baraja el orden visual de cada columna de forma independiente
    // (para que la imagen N no quede siempre frente a la palabra N).
    function prepararRondaUnir() {
        const nivel = nivelUnirActual();
        const banco = barajar(bancoParesUnir());
        const cantidad = Math.min(nivel.pares, banco.length);

        estado.unir.pares = banco.slice(0, cantidad);
        estado.unir.ordenImagenes = barajar(estado.unir.pares.map((_, i) => i));
        estado.unir.ordenPalabras = barajar(estado.unir.pares.map((_, i) => i));
        estado.unir.conexiones = {};
        estado.unir.resueltos = new Set();
        estado.unir.seleccion = null;
        if (estado.unir._timerAutoComprobar) clearTimeout(estado.unir._timerAutoComprobar);
        estado.unir._timerAutoComprobar = null;

        renderTableroUnir();
    }

    function renderTableroUnir() {
        const nivel = nivelUnirActual();
        const contImagenes = el("alfabUnirColumnaImagenes");
        const contPalabras = el("alfabUnirColumnaPalabras");
        if (!contImagenes || !contPalabras) return;

        contImagenes.innerHTML = "";
        contPalabras.innerHTML = "";

        estado.unir.ordenImagenes.forEach((idx) => {
            const par = estado.unir.pares[idx];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.id = "unirImagen" + idx;
            btn.className = "alfab-unir-item alfab-unir-imagen";

            if (par.imagen) {
                const img = document.createElement("img");
                img.src = par.imagen;
                img.alt = par.palabra;
                img.onload = () => dibujarLineasUnir(); // por si la carga de la imagen mueve el layout
                btn.appendChild(img);
            } else {
                const num = document.createElement("span");
                num.className = "alfab-unir-numero";
                num.textContent = par.numero;
                btn.appendChild(num);
            }

            btn.addEventListener("click", () => alternarSeleccionUnir("imagen", idx, btn));
            contImagenes.appendChild(btn);
        });

        estado.unir.ordenPalabras.forEach((idx) => {
            const par = estado.unir.pares[idx];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.id = "unirPalabra" + idx;
            btn.className = "alfab-unir-item alfab-unir-palabra";
            btn.textContent = par.palabra;

            btn.addEventListener("click", () => alternarSeleccionUnir("palabra", idx, btn));
            contPalabras.appendChild(btn);
        });

        el("alfabUnirFeedback").innerHTML = "";
        el("alfabUnirPuntaje").textContent = "⭐ " + estado.unir.puntaje;
        el("alfabUnirProgreso").textContent = "Ronda " + (estado.unir.ronda + 1) + " de " + CONFIG.RONDAS_POR_PARTIDA_UNIR;

        const badge = el("alfabUnirNivelBadge");
        badge.textContent = nivel.nombre;
        badge.className = "badge " + nivel.badgeClase;

        dibujarLineasUnir();
    }

    // Toca un ítem (imagen o palabra). El primer toque solo selecciona;
    // el segundo toque, si es de la columna contraria, crea la conexión.
    // Tocar dos veces el mismo ítem lo deselecciona; tocar otro ítem de
    // la misma columna cambia la selección.
    function alternarSeleccionUnir(tipo, indice, elemento) {
        const seleccion = estado.unir.seleccion;

        if (seleccion && seleccion.tipo === tipo && seleccion.indice === indice) {
            elemento.classList.remove("seleccionado");
            estado.unir.seleccion = null;
            return;
        }

        if (!seleccion || seleccion.tipo === tipo) {
            if (seleccion) seleccion.el.classList.remove("seleccionado");
            elemento.classList.add("seleccionado");
            estado.unir.seleccion = { tipo, indice, el: elemento };
            return;
        }

        // Columnas distintas: se arma la conexión imagen <-> palabra.
        const indiceImagen = tipo === "imagen" ? indice : seleccion.indice;
        const indicePalabra = tipo === "palabra" ? indice : seleccion.indice;
        seleccion.el.classList.remove("seleccionado");
        estado.unir.seleccion = null;
        conectarUnir(indiceImagen, indicePalabra);
    }

    // Guarda la conexión, liberando primero cualquier conexión previa
    // que usara alguno de los dos extremos (así se puede "reconectar"
    // simplemente tocando de nuevo, sin tener que deshacer a mano).
    function conectarUnir(indiceImagen, indicePalabra) {
        Object.keys(estado.unir.conexiones).forEach((key) => {
            const imgIdx = Number(key);
            if (imgIdx === indiceImagen || estado.unir.conexiones[imgIdx] === indicePalabra) {
                delete estado.unir.conexiones[imgIdx];
            }
        });
        estado.unir.conexiones[indiceImagen] = indicePalabra;

        actualizarClasesConectadosUnir();
        dibujarLineasUnir();

        // Autocomprobación: ya no hace falta pulsar un botón "Comprobar"
        // aparte. En cuanto el usuario conecta una pareja, se valida
        // sola. Se da un pequeño respiro (450ms) para que se alcance a
        // ver la línea recién trazada antes de que cambie a verde/rojo,
        // y si el usuario conecta otra pareja mientras tanto, se reinicia
        // la espera para comprobar todo junto.
        if (estado.unir._timerAutoComprobar) clearTimeout(estado.unir._timerAutoComprobar);
        estado.unir._timerAutoComprobar = setTimeout(comprobarUnir, 450);
    }

    // Pinta los estados visuales de cada ítem: "acertada" (bloqueado,
    // en verde) para lo ya confirmado, "conectado" para lo que tiene
    // una línea pendiente de comprobar, y "error-temp" (animación) para
    // lo que se acaba de marcar incorrecto en la última comprobación.
    function actualizarClasesConectadosUnir(resultados) {
        document.querySelectorAll(".alfab-unir-item").forEach((it) => {
            it.classList.remove("conectado", "error-temp");
        });

        estado.unir.pares.forEach((_, idx) => {
            if (!estado.unir.resueltos.has(idx)) return;
            const elImg = el("unirImagen" + idx);
            const elPal = el("unirPalabra" + idx); // en una pareja correcta, palabra idx === imagen idx
            if (elImg) { elImg.classList.add("acertada"); elImg.disabled = true; }
            if (elPal) { elPal.classList.add("acertada"); elPal.disabled = true; }
        });

        Object.keys(estado.unir.conexiones).forEach((key) => {
            const imgIdx = Number(key);
            if (estado.unir.resueltos.has(imgIdx)) return;
            const wordIdx = estado.unir.conexiones[imgIdx];
            const marcarError = resultados && resultados[imgIdx] === false;
            const elImg = el("unirImagen" + imgIdx);
            const elPal = el("unirPalabra" + wordIdx);
            if (elImg) elImg.classList.add(marcarError ? "error-temp" : "conectado");
            if (elPal) elPal.classList.add(marcarError ? "error-temp" : "conectado");
        });
    }

    // Distancia (px) a la que sobresale el "nodo" conector del borde de
    // cada ficha (debe coincidir con el ::after de .alfab-unir-item en
    // alfabetizacion.css: right:-9px / left:-9px con 14px de diámetro,
    // así la curva nace justo del centro del nodo, no del borde de la
    // ficha).
    const ALFAB_UNIR_OFFSET_NODO = 9;

    // Dibuja (o redibuja) todas las conexiones del tablero como curvas
    // Bézier de SVG (más vivas y "de juego" que una línea recta), con un
    // punto en cada extremo que simula el nodo conector de la ficha.
    // Las coordenadas se calculan a partir de la posición real en
    // pantalla de cada ítem conectado (borde derecho de la imagen ->
    // borde izquierdo de la palabra). "resultados", si viene, sirve
    // solo para pintar en rojo/verde las curvas recién comprobadas.
    function dibujarLineasUnir(resultados) {
        const svg = el("alfabUnirLineas");
        const tablero = el("alfabUnirTablero");
        if (!svg || !tablero) return;

        const rTablero = tablero.getBoundingClientRect();
        svg.setAttribute("viewBox", "0 0 " + rTablero.width + " " + rTablero.height);
        svg.innerHTML = "";
        const ns = "http://www.w3.org/2000/svg";

        Object.keys(estado.unir.conexiones).forEach((key) => {
            const imgIdx = Number(key);
            const wordIdx = estado.unir.conexiones[imgIdx];
            const elImg = el("unirImagen" + imgIdx);
            const elPal = el("unirPalabra" + wordIdx);
            if (!elImg || !elPal) return;

            const rImg = elImg.getBoundingClientRect();
            const rPal = elPal.getBoundingClientRect();

            let estadoLinea = "pendiente";
            if (estado.unir.resueltos.has(imgIdx)) estadoLinea = "correcta";
            else if (resultados && resultados[imgIdx] === false) estadoLinea = "incorrecta";

            const x1 = rImg.right - rTablero.left + ALFAB_UNIR_OFFSET_NODO;
            const y1 = rImg.top + rImg.height / 2 - rTablero.top;
            const x2 = rPal.left - rTablero.left - ALFAB_UNIR_OFFSET_NODO;
            const y2 = rPal.top + rPal.height / 2 - rTablero.top;

            // Curva en "S": los puntos de control salen horizontalmente
            // de cada nodo, así la curva siempre entra y sale recta de
            // la ficha aunque las dos columnas tengan alturas distintas.
            const dx = Math.max(Math.abs(x2 - x1) * 0.5, 40);
            const curva = document.createElementNS(ns, "path");
            curva.setAttribute(
                "d",
                "M " + x1 + " " + y1 + " C " + (x1 + dx) + " " + y1 + ", " + (x2 - dx) + " " + y2 + ", " + x2 + " " + y2
            );
            curva.setAttribute("class", "alfab-unir-linea " + estadoLinea);
            svg.appendChild(curva);

            [[x1, y1], [x2, y2]].forEach(([cx, cy]) => {
                const punto = document.createElementNS(ns, "circle");
                punto.setAttribute("cx", cx);
                punto.setAttribute("cy", cy);
                punto.setAttribute("r", 5);
                punto.setAttribute("class", "alfab-unir-punto " + estadoLinea);
                svg.appendChild(punto);
            });
        });
    }

    // Confeti sencillo con <div>, reutilizando las mismas piezas y
    // animación de "Completar la palabra" pero dentro del tablero de
    // Unir, para celebrar cuando se completa una ronda entera.
    function lanzarConfetiUnir() {
        const caja = el("alfabUnirTablero");
        if (!caja) return;
        const colores = ["#f59e0b", "#16a34a", "#0284c7", "#dc2626", "#9333ea"];
        for (let i = 0; i < 18; i++) {
            const pieza = document.createElement("div");
            pieza.className = "completar-confeti-pieza";
            pieza.style.left = (5 + Math.random() * 90) + "%";
            pieza.style.background = colores[i % colores.length];
            pieza.style.animationDelay = (Math.random() * 0.2) + "s";
            caja.appendChild(pieza);
            setTimeout(() => pieza.remove(), 1400);
        }
    }

    // Valida todas las conexiones pendientes (no las ya confirmadas).
    // Las correctas quedan bloqueadas en verde; las incorrectas se ven
    // un momento en rojo y luego se liberan para reintentarlas.
    function comprobarUnir() {
        const pendientes = Object.keys(estado.unir.conexiones)
            .map(Number)
            .filter((imgIdx) => !estado.unir.resueltos.has(imgIdx));

        if (!pendientes.length) return; // nada nuevo que autocomprobar

        const resultados = {};
        pendientes.forEach((imgIdx) => {
            const wordIdx = estado.unir.conexiones[imgIdx];
            const correcta = imgIdx === wordIdx; // misma pareja del banco de esta ronda
            resultados[imgIdx] = correcta;

            if (correcta) {
                estado.unir.resueltos.add(imgIdx);
                estado.unir.correctas++;
                estado.unir.puntaje += CONFIG.PUNTOS_POR_PAREJA_UNIR;
                estado.unir.revision.push({ ok: true, texto: estado.unir.pares[imgIdx].palabra });
            } else {
                estado.unir.incorrectas++;
                estado.unir.revision.push({ ok: false, texto: estado.unir.pares[imgIdx].palabra });
            }
        });

        actualizarClasesConectadosUnir(resultados);
        dibujarLineasUnir(resultados);
        el("alfabUnirPuntaje").textContent = "⭐ " + estado.unir.puntaje;

        const huboErrores = pendientes.some((idx) => !resultados[idx]);
        const rondaCompleta = estado.unir.resueltos.size === estado.unir.pares.length;

        if (huboErrores) reproducirSonidoIncorrecto(); else reproducirSonidoCorrecto();

        if (rondaCompleta) {
            el("alfabUnirFeedback").innerHTML = '<span class="text-success">¡Ronda completada! 🎉</span>';
            lanzarConfetiUnir();
        } else if (huboErrores) {
            el("alfabUnirFeedback").innerHTML = '<span class="text-danger">Revisa las líneas en rojo e inténtalo de nuevo.</span>';
        } else {
            el("alfabUnirFeedback").innerHTML = '<span class="text-success">¡Bien! Sigue conectando las que faltan.</span>';
        }

        // Pausa breve para que se alcance a ver el color de cada línea
        // antes de liberar las incorrectas o pasar a la siguiente ronda.
        setTimeout(() => {
            pendientes.forEach((imgIdx) => {
                if (!resultados[imgIdx]) delete estado.unir.conexiones[imgIdx];
            });
            actualizarClasesConectadosUnir();
            dibujarLineasUnir();

            if (rondaCompleta) avanzarRondaUnir();
        }, rondaCompleta ? 900 : 1100);
    }

    function avanzarRondaUnir() {
        estado.unir.ronda++;
        if (estado.unir.ronda >= CONFIG.RONDAS_POR_PARTIDA_UNIR) {
            mostrarResultadosUnir();
        } else {
            prepararRondaUnir();
        }
    }

    function mostrarResultadosUnir() {
        const total = estado.unir.correctas + estado.unir.incorrectas;
        const pct = total ? Math.round((estado.unir.correctas / total) * 100) : 0;

        el("alfabResultadoIcono").textContent = pct >= 70 ? "🏆" : pct >= 40 ? "👍" : "💪";
        el("alfabResultadoTitulo").textContent = "¡Partida completada!";
        el("alfabResultadoTexto").textContent = "Uniste " + estado.unir.correctas + ' parejas en el juego "Unir con flechas".';
        el("alfabStatCorrectas").textContent = estado.unir.correctas;
        el("alfabStatIncorrectas").textContent = estado.unir.incorrectas;
        el("alfabStatPorcentaje").textContent = pct + "%";

        const lista = el("alfabRevisionLista");
        if (lista) {
            lista.innerHTML = "";
            estado.unir.revision.forEach((r) => {
                const item = document.createElement("div");
                item.className = "quiz-revision-item " + (r.ok ? "ok" : "fail");
                item.innerHTML = "<span>" + (r.ok ? "✔" : "✘") + " " + r.texto + "</span>";
                lista.appendChild(item);
            });
        }

        estado._alfabResultadosVolverA = "unir";
        mostrarBloque("alfabResultados");
    }

    // ---------------------------------------------------------
    // PANTALLA COMPLETA (mismo patrón que quiz.js)
    // ---------------------------------------------------------
    function elementoPantallaCompletaActivo() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
    }

    function alternarPantallaCompleta() {
        const seccion = el("seccionAlfabetizacion");
        if (!seccion) return;

        if (elementoPantallaCompletaActivo() || estado.pantallaCompleta) {
            const salirFn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
            if (elementoPantallaCompletaActivo() && salirFn) {
                salirFn.call(document);
            } else {
                estado.pantallaCompleta = false;
                seccion.classList.remove("quiz-fullscreen");
                actualizarIconoPantallaCompleta();
            }
            return;
        }

        const solicitarFn = seccion.requestFullscreen || seccion.webkitRequestFullscreen || seccion.msRequestFullscreen;
        if (solicitarFn) {
            Promise.resolve(solicitarFn.call(seccion)).catch(activarPantallaCompletaSimulada);
        } else {
            activarPantallaCompletaSimulada();
        }
    }

    function activarPantallaCompletaSimulada() {
        const seccion = el("seccionAlfabetizacion");
        if (!seccion) return;
        estado.pantallaCompleta = true;
        seccion.classList.add("quiz-fullscreen");
        actualizarIconoPantallaCompleta();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function actualizarIconoPantallaCompleta() {
        const btn = el("btnAlfabFullscreen");
        if (btn) btn.textContent = estado.pantallaCompleta ? "⤢" : "⛶";
    }

    function manejarCambioPantallaCompleta() {
        const seccion = el("seccionAlfabetizacion");
        const activo = !!elementoPantallaCompletaActivo();
        estado.pantallaCompleta = activo;
        if (seccion) seccion.classList.toggle("quiz-fullscreen", activo);
        actualizarIconoPantallaCompleta();
        aplicarEspacioAvisoNativoFullscreen(seccion, activo);
    }

    // Al entrar a la pantalla completa NATIVA (no la simulada), Chrome
    // en Android muestra unos segundos su propio aviso ("Para salir de
    // pantalla completa, arrastra desde la parte superior...") pegado a
    // la parte de abajo de la pantalla, que puede tapar botones si
    // quedan al fondo. Mientras dura ese aviso, le damos un margen extra
    // abajo a la sección para que ningún botón quede tapado (mismo
    // patrón que quiz.js).
    function aplicarEspacioAvisoNativoFullscreen(seccion, activo) {
        if (!seccion) return;
        clearTimeout(estado._timeoutAvisoFullscreen);
        if (activo) {
            seccion.style.paddingBottom = "110px";
            estado._timeoutAvisoFullscreen = setTimeout(() => {
                seccion.style.paddingBottom = "";
            }, 3500);
        } else {
            seccion.style.paddingBottom = "";
        }
    }

    // ---------------------------------------------------------
    // ENTRADA PÚBLICA PARA LOS JUEGOS "COMPLETAR" Y "UNIR" DESDE
    // LA SECCIÓN JUGAR (llamada desde script.js: AlfabetizacionV2.mostrarJuego)
    // ---------------------------------------------------------
    function mostrarJuego(modulo) {
        enlazarEventos();
        estado.moduloActivo = modulo;
        const hayDatos = (estado.datos.alfabeto && estado.datos.alfabeto.length) ||
                          (estado.datos.ejemplos && estado.datos.ejemplos.length);
        if (hayDatos) {
            cambiarModulo(modulo);
        } else {
            mostrarBloque("quizCargando");
            cargarDatos(false);
        }
    }

    // Detiene cualquier temporizador de "Completar la palabra" que haya
    // quedado corriendo si el usuario sale de la sección Jugar sin pulsar
    // los botones de menú/salir propios del juego (por ejemplo, navegando
    // a otra sección del sitio).
    function detenerJuegosActivos() {
        detenerTimerCompletar();
    }

    // ---------------------------------------------------------
    // SALIR
    // ---------------------------------------------------------
    function salir() {
        if (estado.pantallaCompleta || elementoPantallaCompletaActivo()) alternarPantallaCompleta();
    }

    // ---------------------------------------------------------
    // ENLAZAR BOTONES ESTÁTICOS (una sola vez)
    // ---------------------------------------------------------
    function enlazarEventos() {
        if (estado._listenersListos) return; // evita duplicar listeners cada vez que se abre la sección

        document.querySelectorAll("[data-alfab-modulo]").forEach((btn) => {
            btn.addEventListener("click", () => cambiarModulo(btn.dataset.alfabModulo));
        });

        const btnTipoLetras = el("btnAlfabTipoLetras");
        if (btnTipoLetras) btnTipoLetras.addEventListener("click", () => cambiarTipo("letra"));

        const btnTipoNumeros = el("btnAlfabTipoNumeros");
        if (btnTipoNumeros) btnTipoNumeros.addEventListener("click", () => cambiarTipo("numero"));

        const btnCarActualAnterior = el("btnAlfabCaracterAnterior");
        if (btnCarActualAnterior) btnCarActualAnterior.addEventListener("click", () => irACaracter(-1));

        const btnCarActualSiguiente = el("btnAlfabCaracterSiguiente");
        if (btnCarActualSiguiente) btnCarActualSiguiente.addEventListener("click", () => irACaracter(1));

        // Chips de las 4 variantes tipográficas (mayúscula/minúscula/cursivas)
        document.querySelectorAll(".alfab-chip-tipo").forEach((chip) => {
            chip.addEventListener("click", () => cambiarVarianteTipo(chip.dataset.alfabVariante));
        });

        const btnTrazoLento = el("btnAlfabTrazoLento");
        if (btnTrazoLento) btnTrazoLento.addEventListener("click", () => cambiarVelocidad(-1));

        const btnTrazoRapido = el("btnAlfabTrazoRapido");
        if (btnTrazoRapido) btnTrazoRapido.addEventListener("click", () => cambiarVelocidad(1));

        const btnTrazoReiniciar = el("btnAlfabTrazoReiniciar");
        if (btnTrazoReiniciar) btnTrazoReiniciar.addEventListener("click", reiniciarTrazo);

        const btnBocaNumeroAnterior = el("btnAlfabBocaNumeroAnterior");
        if (btnBocaNumeroAnterior) {
            btnBocaNumeroAnterior.addEventListener("click", () => {
                const tira = el("alfabBocaNumeroTira");
                if (tira) tira.scrollBy({ left: -100, behavior: "smooth" });
            });
        }

        const btnBocaNumeroSiguiente = el("btnAlfabBocaNumeroSiguiente");
        if (btnBocaNumeroSiguiente) {
            btnBocaNumeroSiguiente.addEventListener("click", () => {
                const tira = el("alfabBocaNumeroTira");
                if (tira) tira.scrollBy({ left: 100, behavior: "smooth" });
            });
        }

        const btnEjemploAnterior = el("btnAlfabEjemploAnterior");
        if (btnEjemploAnterior) btnEjemploAnterior.addEventListener("click", () => irAEjemplo(-1));

        const btnEjemploSiguiente = el("btnAlfabEjemploSiguiente");
        if (btnEjemploSiguiente) btnEjemploSiguiente.addEventListener("click", () => irAEjemplo(1));

        const btnCompletarEmpezar = el("btnAlfabCompletarEmpezar");
        if (btnCompletarEmpezar) btnCompletarEmpezar.addEventListener("click", iniciarJuegoCompletar);

        const btnCompletarSiguiente = el("btnAlfabCompletarSiguiente");
        if (btnCompletarSiguiente) btnCompletarSiguiente.addEventListener("click", avanzarCompletar);

        const btnCompletarMenu = el("btnAlfabCompletarMenu");
        if (btnCompletarMenu) btnCompletarMenu.addEventListener("click", renderCompletarIntro);

        const btnUnirEmpezar = el("btnAlfabUnirEmpezar");
        if (btnUnirEmpezar) btnUnirEmpezar.addEventListener("click", iniciarJuegoUnir);

        const btnUnirMenu = el("btnAlfabUnirMenu");
        if (btnUnirMenu) {
            btnUnirMenu.addEventListener("click", () => {
                if (estado.unir._timerAutoComprobar) clearTimeout(estado.unir._timerAutoComprobar);
                renderUnirIntro();
            });
        }

        // Las líneas del SVG se calculan con getBoundingClientRect(), así
        // que hay que recalcularlas si cambia el tamaño/orientación de la
        // pantalla mientras el tablero de Unir está visible.
        window.addEventListener("resize", () => {
            const activo = el("alfabUnirActivo");
            if (estado.moduloActivo === "unir" && activo && !activo.classList.contains("d-none")) {
                dibujarLineasUnir();
            }
        });

        const btnAlfabReiniciar = el("btnAlfabReiniciar");
        if (btnAlfabReiniciar) {
            btnAlfabReiniciar.addEventListener("click", () => {
                if (estado._alfabResultadosVolverA === "completar") {
                    mostrarBloque("alfabCompletar");
                    iniciarJuegoCompletar();
                } else if (estado._alfabResultadosVolverA === "unir") {
                    mostrarBloque("alfabUnir");
                    iniciarJuegoUnir();
                }
            });
        }

        const btnAlfabSalirResultados = el("btnAlfabSalirResultados");
        if (btnAlfabSalirResultados) {
            btnAlfabSalirResultados.addEventListener("click", () => {
                if (estado._alfabResultadosVolverA === "completar") {
                    mostrarBloque("alfabCompletar");
                    renderCompletarIntro();
                } else if (estado._alfabResultadosVolverA === "unir") {
                    mostrarBloque("alfabUnir");
                    renderUnirIntro();
                } else {
                    cambiarModulo("aprender");
                }
            });
        }

        const btnFullscreen = el("btnAlfabFullscreen");
        if (btnFullscreen) btnFullscreen.addEventListener("click", alternarPantallaCompleta);

        const btnSalir = el("btnAlfabSalir");
        if (btnSalir) btnSalir.addEventListener("click", () => {
            salir();
            const seccion = el("seccionAlfabetizacion");
            if (seccion) seccion.classList.add("d-none");
        });

        ["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((evt) => {
            document.addEventListener(evt, manejarCambioPantallaCompleta);
        });

        estado._listenersListos = true;
    }

    // ---------------------------------------------------------
    // PUNTO DE ENTRADA PÚBLICO (llamado desde script.js)
    // ---------------------------------------------------------
    function iniciar() {
        enlazarEventos();
        cambiarModulo("aprender");
        cargarDatos(false);
    }

    return { iniciar, salir, mostrarJuego, detenerJuegosActivos };
})();

window.AlfabetizacionV2 = AlfabetizacionV2;