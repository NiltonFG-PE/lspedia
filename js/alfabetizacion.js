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
        MOCK_ACTIVO: true, // 👉 cambiar a false cuando el Apps Script combinado esté listo
        MOCK_URL: "data/alfabetizacion-mock.json",

        // 👉 Pega aquí la URL de tu Web App de Apps Script (termina en /exec)
        //    (puede ser la misma del Quiz si el doGet combinado responde
        //     también a este endpoint, o una nueva si prefieres separarlo)
        APPS_SCRIPT_URL: "PEGA_AQUI_LA_URL_DEL_APPS_SCRIPT",

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

        // Juego "Completar la palabra": fusiona palabras del abecedario
        // (con imagen) y de los números (sin imagen, se muestra el número
        // grande en su lugar) en un solo banco de preguntas.
        NIVELES_COMPLETAR: [
            { id: "facil", nombre: "Fácil", icono: "🙂", opciones: 3, tiempoSeg: 25, badgeClase: "badge-nivel-facil" },
            { id: "medio", nombre: "Medio", icono: "😐", opciones: 4, tiempoSeg: 18, badgeClase: "badge-nivel-medio" },
            { id: "dificil", nombre: "Difícil", icono: "🔥", opciones: 5, tiempoSeg: 12, badgeClase: "badge-nivel-dificil" }
        ],
        PREGUNTAS_POR_RONDA_COMPLETAR: 10,
        LETRAS_DISPONIBLES: "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("")
    };

    // ---------------------------------------------------------
    // ESTADO INTERNO
    // ---------------------------------------------------------
    const estado = {
        datos: { alfabeto: [], ejemplos: [] },
        cargando: false,
        moduloActivo: "aprender", // aprender | completar | unir
        pantallaCompleta: false,

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
            tiempoRestante: 0
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
        mostrarBloque("alfabCargando");
        el("alfabError").classList.add("d-none");

        const cache = leerCache();
        if (cache && !forzar) {
            estado.datos = cache;
            alTerminarCarga();
            return;
        }

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

        fetchRemoto();
    }

    // Igual que quiz.js: JSONP porque Apps Script + GitHub Pages suele
    // bloquear la lectura por CORS aunque la URL funcione directamente.
    function fetchRemoto() {
        if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.indexOf("PEGA_AQUI") > -1) {
            mostrarError("Alfabetización aún no está conectada a Google Sheets. Falta pegar la URL de Apps Script en js/alfabetizacion.js.");
            return;
        }

        const nombreCallback = "alfabV2Callback_" + Date.now();
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
        script.src = CONFIG.APPS_SCRIPT_URL + separador + "callback=" + nombreCallback;
        script.onerror = () => {
            if (!resuelto) {
                limpiar();
                manejarErrorCarga(new Error("No se pudo conectar con Google Apps Script (revisa la URL o el despliegue)."));
            }
        };
        document.body.appendChild(script);

        setTimeout(() => {
            if (!resuelto) {
                limpiar();
                manejarErrorCarga(new Error("Tiempo de espera agotado al conectar con Google Sheets."));
            }
        }, 10000);
    }

    function guardarDatos(data) {
        estado.datos = { alfabeto: data.alfabeto || [], ejemplos: data.ejemplos || [] };
        guardarCache(estado.datos);
        alTerminarCarga();
    }

    function alTerminarCarga() {
        mostrarBloque("alfabAprender");
        renderModuloActivo();
    }

    function manejarErrorCarga(err) {
        console.error("Error cargando Alfabetización:", err);
        const cache = leerCache(true); // ignora expiración como último recurso
        if (cache) {
            estado.datos = cache;
            alTerminarCarga();
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
        cont.textContent = "⚠️ " + msg;
        cont.classList.remove("d-none");
    }

    // ---------------------------------------------------------
    // NAVEGACIÓN ENTRE BLOQUES (cargando / error / los 3 módulos / resultados)
    // ---------------------------------------------------------
    function ocultarTodosLosBloques() {
        ["alfabCargando", "alfabAprender", "alfabCompletar", "alfabUnir", "alfabResultados"].forEach((id) => {
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
        }
        // "unir" se implementa en el siguiente paso; su pantalla de intro
        // ya está en el HTML y no requiere datos para mostrarse.
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

    // Pinta la sección de Fonética según el tipo de carácter:
    // LETRAS -> una sola imagen de boca (comportamiento de siempre).
    // NÚMEROS -> tira desplazable con la boca de cada letra de la palabra
    //            (ej. "13" -> T, R, E, C, E), reutilizando las imágenes
    //            boca/{LETRA}.png que ya existen para el abecedario.
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

                    const img = document.createElement("img");
                    img.src = "img/alfabetizacion/boca/" + encodeURIComponent(letra) + ".png";
                    img.alt = "Boca de la letra " + letra;

                    const label = document.createElement("span");
                    label.textContent = letra;

                    item.appendChild(img);
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
        el("alfabBocaImg").src = c.imagenBoca || "";
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

    function bancoPalabrasCompletar() {
        const deLetras = (estado.datos.ejemplos || [])
            .filter((e) => e.palabra && e.palabra.length >= 3)
            .map((e) => ({ palabra: e.palabra.toUpperCase(), imagen: e.imagen, numero: null }));

        const deNumeros = Object.keys(CONFIG.PALABRA_NUMERO).map((n) => ({
            palabra: CONFIG.PALABRA_NUMERO[n],
            imagen: null,
            numero: n
        }));

        return deLetras.concat(deNumeros);
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
        if (totalEl) totalEl.textContent = bancoPalabrasCompletar().length + " palabras disponibles (abecedario + números)";

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

        // Elegir al azar qué letra falta, y su versión sin tilde (las
        // fichas de letra disponibles son A-Z + Ñ, siempre sin acentos).
        const letras = pregunta.palabra.split("");
        const indiceBlanco = Math.floor(Math.random() * letras.length);
        pregunta._indiceBlanco = indiceBlanco;
        pregunta._letraCorrecta = normalizarLetra(letras[indiceBlanco]);

        // Opciones: la correcta + distractores al azar, sin repetir.
        const opciones = new Set([pregunta._letraCorrecta]);
        while (opciones.size < nivel.opciones) {
            opciones.add(CONFIG.LETRAS_DISPONIBLES[Math.floor(Math.random() * CONFIG.LETRAS_DISPONIBLES.length)]);
        }
        const opcionesBarajadas = barajar(Array.from(opciones));

        const cont = el("alfabCompletarContenido");
        cont.innerHTML = "";

        // Imagen (letras) o número grande (números, no tienen imagen de ejemplo)
        const cajaImagen = document.createElement("div");
        cajaImagen.className = "completar-imagen-caja mx-auto mb-3";
        if (pregunta.imagen) {
            const img = document.createElement("img");
            img.src = pregunta.imagen;
            img.alt = pregunta.palabra;
            cajaImagen.appendChild(img);
        } else {
            const num = document.createElement("span");
            num.className = "completar-numero-grande";
            num.textContent = pregunta.numero;
            cajaImagen.appendChild(num);
        }
        cont.appendChild(cajaImagen);

        // Palabra con la letra faltante
        const filaPalabra = document.createElement("div");
        filaPalabra.className = "completar-palabra mb-2";
        letras.forEach((letra, i) => {
            const casilla = document.createElement("span");
            casilla.className = "completar-letra-casilla" + (i === indiceBlanco ? " blank" : "");
            casilla.textContent = i === indiceBlanco ? "" : letra;
            casilla.id = "completarCasilla" + i;
            filaPalabra.appendChild(casilla);
        });
        cont.appendChild(filaPalabra);

        // Opciones de letra (se tocan, no se arrastran)
        const filaOpciones = document.createElement("div");
        filaOpciones.className = "completar-opciones d-flex flex-wrap justify-content-center gap-2 mt-3";
        opcionesBarajadas.forEach((letra) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "completar-opcion-letra";
            btn.textContent = letra;
            btn.addEventListener("click", () => seleccionarOpcionCompletar(letra, btn));
            filaOpciones.appendChild(btn);
        });
        cont.appendChild(filaOpciones);

        iniciarTimerCompletar(nivel.tiempoSeg);
    }

    function seleccionarOpcionCompletar(letra, btnEl) {
        if (estado.completar.respondida) return;
        estado.completar.respondida = true;
        detenerTimerCompletar();

        const pregunta = estado.completar.preguntas[estado.completar.indice];
        const esCorrecta = letra === pregunta._letraCorrecta;

        const casilla = el("completarCasilla" + pregunta._indiceBlanco);
        if (casilla) {
            casilla.textContent = pregunta.palabra[pregunta._indiceBlanco];
            casilla.classList.add(esCorrecta ? "correcta" : "incorrecta");
        }

        document.querySelectorAll(".completar-opcion-letra").forEach((b) => {
            b.disabled = true;
            if (b === btnEl) b.classList.add(esCorrecta ? "correcta" : "incorrecta");
            if (!esCorrecta && b.textContent === pregunta._letraCorrecta) b.classList.add("correcta");
        });

        if (esCorrecta) {
            estado.completar.correctas++;
            estado.completar.puntaje += 10;
            el("alfabCompletarFeedback").innerHTML = '<span class="text-success">¡Muy bien! 🎉</span>';
        } else {
            estado.completar.incorrectas++;
            el("alfabCompletarFeedback").innerHTML = '<span class="text-danger">Era: ' + pregunta._letraCorrecta + "</span>";
        }
        el("alfabCompletarPuntaje").textContent = "⭐ " + estado.completar.puntaje;

        estado.completar.revision.push({ ok: esCorrecta, texto: pregunta.palabra + " (" + pregunta._letraCorrecta + ")" });

        el("btnAlfabCompletarSiguiente").classList.remove("d-none");
    }

    function tiempoAgotadoCompletar() {
        if (estado.completar.respondida) return;
        estado.completar.respondida = true;

        const pregunta = estado.completar.preguntas[estado.completar.indice];
        const casilla = el("completarCasilla" + pregunta._indiceBlanco);
        if (casilla) {
            casilla.textContent = pregunta.palabra[pregunta._indiceBlanco];
            casilla.classList.add("incorrecta");
        }
        document.querySelectorAll(".completar-opcion-letra").forEach((b) => {
            b.disabled = true;
            if (b.textContent === pregunta._letraCorrecta) b.classList.add("correcta");
        });

        estado.completar.incorrectas++;
        el("alfabCompletarFeedback").innerHTML = '<span class="text-danger">⏱ Se acabó el tiempo. Era: ' + pregunta._letraCorrecta + "</span>";
        estado.completar.revision.push({ ok: false, texto: pregunta.palabra + " (" + pregunta._letraCorrecta + ")" });

        el("btnAlfabCompletarSiguiente").classList.remove("d-none");
    }

    function avanzarCompletar() {
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
        estado.completar.timerId = setInterval(() => {
            estado.completar.tiempoRestante--;
            const pct = Math.max(0, (estado.completar.tiempoRestante / segundos) * 100);
            if (barra) {
                barra.style.width = pct + "%";
                barra.classList.toggle("tiempo-medio", pct <= 50 && pct > 25);
                barra.classList.toggle("tiempo-critico", pct <= 25);
            }
            if (estado.completar.tiempoRestante <= 0) {
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

        const btnAlfabReiniciar = el("btnAlfabReiniciar");
        if (btnAlfabReiniciar) {
            btnAlfabReiniciar.addEventListener("click", () => {
                if (estado._alfabResultadosVolverA === "completar") {
                    mostrarBloque("alfabCompletar");
                    iniciarJuegoCompletar();
                }
                // "unir" se agrega cuando ese módulo esté implementado
            });
        }

        const btnAlfabSalirResultados = el("btnAlfabSalirResultados");
        if (btnAlfabSalirResultados) {
            btnAlfabSalirResultados.addEventListener("click", () => {
                if (estado._alfabResultadosVolverA === "completar") {
                    mostrarBloque("alfabCompletar");
                    renderCompletarIntro();
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

    return { iniciar, salir };
})();

window.AlfabetizacionV2 = AlfabetizacionV2;