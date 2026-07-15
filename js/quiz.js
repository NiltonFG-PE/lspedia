/* ============================================================
   LSPedia - QUIZ v2 (independiente del diccionario)
   ------------------------------------------------------------
   Este archivo es 100% independiente de script.js y de
   data/palabras.json. Todas las preguntas se cargan en vivo
   desde la Hoja 2 de tu Google Sheets, a través de un Web App
   de Google Apps Script.

   ⚠️ CONFIGURACIÓN OBLIGATORIA:
   Reemplaza la URL de abajo por la URL de TU despliegue de
   Apps Script (ver INSTRUCCIONES.md, paso 4).
   ============================================================ */

const QuizV2 = (function () {

    // ---------------------------------------------------------
    // CONFIGURACIÓN
    // ---------------------------------------------------------
    const CONFIG = {
        // 👉 Pega aquí la URL de tu Web App de Apps Script (termina en /exec)
        APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbw9d7br5C8C4gfk4dJAY6FHRKTKTMI23bNQvO58OQ5TlPe9z5awMWjNIlCLILNLH0t51w/exec",

        CLAVE_CACHE: "lspedia_quiz_cache_v1",
        DURACION_CACHE_MS: 5 * 60 * 1000, // 5 minutos: evita golpear el Sheet en cada clic
        PREGUNTAS_POR_RONDA: 8,
        PARES_MEMORIA: 6,
        TIEMPOS_POR_NIVEL: { "Fácil": 20, "Medio": 15, "Difícil": 10 }
    };

    // ---------------------------------------------------------
    // ESTADO INTERNO
    // ---------------------------------------------------------
    const estado = {
        banco: [],
        cargando: false,
        nivel: "Todos",
        modo: "5", // 1=Video→Palabra 2=Palabra→Video 3=V/F 4=Memoria 5=Aleatorio
        ronda: { preguntas: [], indice: 0, puntaje: 0, respuestas: [] },
        temporizador: { id: null, restante: 0, total: 0 },
        memoria: { cartas: [], primeraSeleccion: null, bloqueado: false, intentos: 0, aciertos: 0, inicio: 0, cronoId: null },
        audioCtx: null,
        pantallaCompleta: false
    };

    // ---------------------------------------------------------
    // REFERENCIAS AL DOM (se resuelven de forma perezosa)
    // ---------------------------------------------------------
    const el = (id) => document.getElementById(id);

    // ---------------------------------------------------------
    // CARGA DE DATOS DESDE GOOGLE SHEETS
    // ---------------------------------------------------------
    function cargarBanco(forzar) {
        mostrarBloque("quizCargando");
        el("quizError").classList.add("d-none");

        const cache = leerCache();
        if (cache && !forzar) {
            estado.banco = cache;
            mostrarIntro();
            // refresca en segundo plano sin bloquear al usuario
            fetchRemoto(true);
            return;
        }
        fetchRemoto(false);
    }

    function fetchRemoto(silencioso) {
        if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.indexOf("PEGA_AQUI") > -1) {
            if (!silencioso) mostrarError("El Quiz aún no está conectado a Google Sheets. Falta pegar la URL de Apps Script en js/quiz.js.");
            return;
        }
        fetch(CONFIG.APPS_SCRIPT_URL)
            .then((res) => {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
            })
            .then((data) => {
                if (!data.ok) throw new Error(data.error || "Respuesta inválida del servidor.");
                estado.banco = data.preguntas.filter((p) => p.palabra && p.video);
                guardarCache(estado.banco);
                if (!silencioso) mostrarIntro();
            })
            .catch((err) => {
                console.error("Error cargando el Quiz desde Google Sheets:", err);
                if (!silencioso) {
                    const cache = leerCache(true); // ignora expiración como último recurso
                    if (cache && cache.length) {
                        estado.banco = cache;
                        mostrarIntro();
                    } else {
                        mostrarError("No se pudo cargar el Quiz. Detalle técnico: " + (err && err.message ? err.message : err));
                    }
                }
            });
    }

    function guardarCache(banco) {
        try {
            localStorage.setItem(CONFIG.CLAVE_CACHE, JSON.stringify({ ts: Date.now(), banco: banco }));
        } catch (e) { /* almacenamiento no disponible: se ignora silenciosamente */ }
    }

    function leerCache(ignorarExpiracion) {
        try {
            const crudo = localStorage.getItem(CONFIG.CLAVE_CACHE);
            if (!crudo) return null;
            const parsed = JSON.parse(crudo);
            const vencido = (Date.now() - parsed.ts) > CONFIG.DURACION_CACHE_MS;
            if (vencido && !ignorarExpiracion) return null;
            return parsed.banco || null;
        } catch (e) {
            return null;
        }
    }

    function mostrarError(msg) {
        ocultarTodosLosBloques();
        const cont = el("quizError");
        cont.textContent = "⚠️ " + msg;
        cont.classList.remove("d-none");
    }

    // ---------------------------------------------------------
    // NAVEGACIÓN ENTRE PANTALLAS DEL QUIZ
    // ---------------------------------------------------------
    function ocultarTodosLosBloques() {
        ["quizCargando", "quizIntro", "quizActivo", "quizMemoria", "quizResultados"].forEach((id) => {
            const n = el(id);
            if (n) n.classList.add("d-none");
        });
    }

    function mostrarBloque(id) {
        ocultarTodosLosBloques();
        const n = el(id);
        if (n) {
            n.classList.remove("d-none");
            n.classList.add("quiz-fade-in");
        }
    }

    // ---------------------------------------------------------
    // PANTALLA: INTRO (selección de nivel y modo)
    // ---------------------------------------------------------
    function mostrarIntro() {
        mostrarBloque("quizIntro");
        renderSelectorNivel();
        renderSelectorModo();
        actualizarConteoDisponibles();
    }

    function renderSelectorNivel() {
        const cont = el("quizSelectorNivel");
        if (!cont || cont.dataset.armado) { actualizarClasesActivas(); return; }
        const niveles = [
            { valor: "Todos", icono: "🌐", label: "Todos" },
            { valor: "Fácil", icono: "🟢", label: "Fácil" },
            { valor: "Medio", icono: "🟡", label: "Medio" },
            { valor: "Difícil", icono: "🔴", label: "Difícil" }
        ];
        cont.innerHTML = "";
        niveles.forEach((n) => {
            const col = document.createElement("div");
            col.className = "col-6 col-md-3";
            col.innerHTML = `<div class="quiz-selector-btn" data-nivel="${n.valor}"><span class="icono">${n.icono}</span><span class="small fw-bold">${n.label}</span></div>`;
            col.querySelector(".quiz-selector-btn").addEventListener("click", () => {
                estado.nivel = n.valor;
                actualizarClasesActivas();
                actualizarConteoDisponibles();
            });
            cont.appendChild(col);
        });
        cont.dataset.armado = "1";
        actualizarClasesActivas();
    }

    function renderSelectorModo() {
        const cont = el("quizSelectorModo");
        if (!cont || cont.dataset.armado) { actualizarClasesActivas(); return; }
        const modos = [
            { valor: "1", icono: "🎥", label: "Video → Palabra" },
            { valor: "2", icono: "🔤", label: "Palabra → Video" },
            { valor: "3", icono: "✅", label: "Verdadero/Falso" },
            { valor: "4", icono: "🧠", label: "Memoria" },
            { valor: "5", icono: "🎲", label: "Aleatorio" }
        ];
        cont.innerHTML = "";
        modos.forEach((m) => {
            const col = document.createElement("div");
            col.className = "col-6 col-md";
            col.innerHTML = `<div class="quiz-selector-btn" data-modo="${m.valor}"><span class="icono">${m.icono}</span><span class="small fw-bold">${m.label}</span></div>`;
            col.querySelector(".quiz-selector-btn").addEventListener("click", () => {
                estado.modo = m.valor;
                actualizarClasesActivas();
                actualizarConteoDisponibles();
            });
            cont.appendChild(col);
        });
        cont.dataset.armado = "1";
        actualizarClasesActivas();
    }

    function actualizarClasesActivas() {
        document.querySelectorAll("#quizSelectorNivel [data-nivel]").forEach((n) => {
            n.classList.toggle("activo", n.dataset.nivel === estado.nivel);
        });
        document.querySelectorAll("#quizSelectorModo [data-modo]").forEach((n) => {
            n.classList.toggle("activo", n.dataset.modo === estado.modo);
        });
    }

    function bancoFiltrado() {
        if (estado.nivel === "Todos") return estado.banco;
        return estado.banco.filter((p) => p.nivel === estado.nivel);
    }

    function actualizarConteoDisponibles() {
        const disponibles = bancoFiltrado().length;
        const texto = el("quizTotalDisponibles");
        const btn = el("btnEmpezarQuiz");
        const minimoNecesario = estado.modo === "4" ? Math.min(CONFIG.PARES_MEMORIA, 3) : 4;
        if (disponibles < minimoNecesario) {
            texto.innerHTML = `⚠️ Solo hay <strong>${disponibles}</strong> palabras disponibles en este nivel. Elige "Todos" o agrega más filas en la Hoja 2.`;
            btn.disabled = true;
        } else {
            texto.innerHTML = `✅ <strong>${disponibles}</strong> palabras disponibles para esta partida.`;
            btn.disabled = false;
        }
    }

    // ---------------------------------------------------------
    // INICIO DE RONDA
    // ---------------------------------------------------------
    function empezarPartida() {
        if (estado.modo === "4") {
            iniciarModoMemoria();
            return;
        }
        const pool = mezclar(bancoFiltrado());
        const total = Math.min(CONFIG.PREGUNTAS_POR_RONDA, pool.length);
        estado.ronda.preguntas = pool.slice(0, total).map((p) => {
            let modoPregunta = estado.modo;
            if (estado.modo === "5") {
                modoPregunta = ["1", "2", "3"][Math.floor(Math.random() * 3)];
            }
            return Object.assign({}, p, { modoPregunta });
        });
        estado.ronda.indice = 0;
        estado.ronda.puntaje = 0;
        estado.ronda.respuestas = [];
        mostrarBloque("quizActivo");
        mostrarPreguntaActual();
    }

    function mostrarPreguntaActual() {
        if (estado.ronda.indice >= estado.ronda.preguntas.length) {
            mostrarResultados();
            return;
        }
        const pregunta = estado.ronda.preguntas[estado.ronda.indice];
        const total = estado.ronda.preguntas.length;

        el("quizProgreso").textContent = `Pregunta ${estado.ronda.indice + 1} de ${total}`;
        el("quizPuntaje").textContent = `⭐ ${estado.ronda.puntaje}`;
        el("quizNivelBadge").textContent = pregunta.nivel;
        el("quizNivelBadge").className = "badge " + claseNivel(pregunta.nivel);
        el("quizBarraProgreso").style.width = Math.round((estado.ronda.indice / total) * 100) + "%";
        el("quizFeedback").textContent = "";
        el("btnSiguientePregunta").classList.add("d-none");

        const contenedor = el("quizContenidoPregunta");
        contenedor.innerHTML = "";

        if (pregunta.modoPregunta === "1") renderModoVideoAPalabra(contenedor, pregunta);
        else if (pregunta.modoPregunta === "2") renderModoPalabraAVideo(contenedor, pregunta);
        else renderModoVerdaderoFalso(contenedor, pregunta);

        iniciarTemporizador(CONFIG.TIEMPOS_POR_NIVEL[pregunta.nivel] || 15);
    }

    function claseNivel(nivel) {
        if (nivel === "Difícil") return "badge-nivel-dificil";
        if (nivel === "Medio") return "badge-nivel-medio";
        return "badge-nivel-facil";
    }

    // ---------------------------------------------------------
    // MODO 1: se muestra el video, elegir la palabra correcta
    // ---------------------------------------------------------
    function renderModoVideoAPalabra(contenedor, pregunta) {
        const distractores = mezclar(bancoFiltrado().filter((p) => p.palabra !== pregunta.palabra)).slice(0, 3);
        const opciones = mezclar([pregunta, ...distractores]);

        contenedor.innerHTML = `
            <div class="ratio ratio-16x9 rounded overflow-hidden border mb-3">
                <iframe src="https://www.youtube.com/embed/${pregunta.video}?rel=0&modestbranding=1&autoplay=0" allowfullscreen title="Video en LSP"></iframe>
            </div>
            <p class="text-center fw-bold mb-3">¿Qué palabra representa esta seña?</p>
            <div class="row g-2" id="quizOpcionesDinamicas"></div>
        `;
        const cont = contenedor.querySelector("#quizOpcionesDinamicas");
        opciones.forEach((op) => {
            const col = document.createElement("div");
            col.className = "col-6";
            const boton = document.createElement("button");
            boton.className = "btn btn-outline-primary w-100 quiz-opcion-btn";
            boton.textContent = op.palabra;
            boton.onclick = () => responder(boton, op.palabra === pregunta.palabra, pregunta.palabra, "[data-op-tipo='texto']");
            col.appendChild(boton);
            cont.appendChild(col);
        });
    }

    // ---------------------------------------------------------
    // MODO 2: se muestra la palabra, elegir el video correcto
    // ---------------------------------------------------------
    function renderModoPalabraAVideo(contenedor, pregunta) {
        const distractores = mezclar(bancoFiltrado().filter((p) => p.palabra !== pregunta.palabra)).slice(0, 3);
        const opciones = mezclar([pregunta, ...distractores]);

        contenedor.innerHTML = `
            <div class="text-center mb-3">
                <span class="badge bg-dark fs-5 px-3 py-2">${pregunta.palabra}</span>
                <p class="text-muted small mt-2">¿Cuál video representa esta palabra?</p>
            </div>
            <div class="row g-2" id="quizOpcionesDinamicas"></div>
        `;
        const cont = contenedor.querySelector("#quizOpcionesDinamicas");
        opciones.forEach((op) => {
            const col = document.createElement("div");
            col.className = "col-6";
            const div = document.createElement("div");
            div.className = "quiz-video-opcion";
            div.innerHTML = `<img src="https://img.youtube.com/vi/${op.video}/hqdefault.jpg" alt="Opción de video"><span class="play-overlay">▶</span>`;
            div.onclick = () => responderVideo(div, op.palabra === pregunta.palabra, pregunta);
            col.appendChild(div);
            cont.appendChild(col);
        });
    }

    function responderVideo(divElegido, esCorrecta, pregunta) {
        const todos = document.querySelectorAll(".quiz-video-opcion");
        todos.forEach((d) => { d.style.pointerEvents = "none"; });
        divElegido.classList.add(esCorrecta ? "correcta" : "incorrecta");
        if (!esCorrecta) {
            // resalta cuál era el correcto reproduciendo su miniatura marcada
            todos.forEach((d) => {
                if (d.querySelector("img").src.indexOf(pregunta.video) > -1) d.classList.add("correcta");
            });
        }
        finalizarPregunta(esCorrecta, pregunta.palabra);
    }

    // ---------------------------------------------------------
    // MODO 3: Verdadero o Falso
    // ---------------------------------------------------------
    function renderModoVerdaderoFalso(contenedor, pregunta) {
        const esAfirmacionVerdadera = Math.random() < 0.5;
        let palabraMostrada = pregunta.palabra;
        if (!esAfirmacionVerdadera) {
            const distractores = bancoFiltrado().filter((p) => p.palabra !== pregunta.palabra);
            if (distractores.length) palabraMostrada = mezclar(distractores)[0].palabra;
        }
        contenedor.innerHTML = `
            <div class="ratio ratio-16x9 rounded overflow-hidden border mb-3">
                <iframe src="https://www.youtube.com/embed/${pregunta.video}?rel=0&modestbranding=1" allowfullscreen title="Video en LSP"></iframe>
            </div>
            <p class="text-center fw-bold mb-3">¿Esta seña significa <span class="text-primary">"${palabraMostrada}"</span>?</p>
            <div class="row g-2" id="quizOpcionesDinamicas">
                <div class="col-6"><button class="btn btn-outline-success w-100 quiz-opcion-btn" id="btnQuizVerdadero">✅ Verdadero</button></div>
                <div class="col-6"><button class="btn btn-outline-danger w-100 quiz-opcion-btn" id="btnQuizFalso">❌ Falso</button></div>
            </div>
        `;
        const btnV = contenedor.querySelector("#btnQuizVerdadero");
        const btnF = contenedor.querySelector("#btnQuizFalso");
        btnV.onclick = () => responder(btnV, esAfirmacionVerdadera, pregunta.palabra);
        btnF.onclick = () => responder(btnF, !esAfirmacionVerdadera, pregunta.palabra);
    }

    // ---------------------------------------------------------
    // RESPUESTA GENÉRICA (modos 1 y 3, que usan botones de texto)
    // ---------------------------------------------------------
    function responder(botonElegido, esCorrecta, palabraCorrecta) {
        const botones = document.querySelectorAll("#quizContenidoPregunta button");
        botones.forEach((b) => {
            b.disabled = true;
            if (b.textContent.indexOf(palabraCorrecta) > -1 || b === botonElegido) {
                // marca visualmente
            }
        });
        botonElegido.classList.add(esCorrecta ? "correcta" : "incorrecta");
        botonElegido.classList.replace("btn-outline-primary", esCorrecta ? "btn-success" : "btn-danger");
        if (!esCorrecta) {
            botones.forEach((b) => {
                if (b.textContent === palabraCorrecta) b.classList.replace("btn-outline-primary", "btn-success");
            });
        }
        finalizarPregunta(esCorrecta, palabraCorrecta);
    }

    function finalizarPregunta(esCorrecta, palabraCorrecta) {
        detenerTemporizador();
        const pregunta = estado.ronda.preguntas[estado.ronda.indice];
        const tiempoUsado = estado.temporizador.total - estado.temporizador.restante;

        if (esCorrecta) {
            estado.ronda.puntaje += calcularPuntos(pregunta.nivel, tiempoUsado, estado.temporizador.total);
            reproducirSonidoCorrecto();
        } else {
            reproducirSonidoIncorrecto();
        }

        estado.ronda.respuestas.push({
            palabra: pregunta.palabra,
            categoria: pregunta.categoria,
            nivel: pregunta.nivel,
            correcta: esCorrecta,
            tiempoUsado: tiempoUsado
        });

        const feedback = el("quizFeedback");
        if (esCorrecta) {
            feedback.textContent = "✅ ¡Correcto!";
            feedback.style.color = "#16a34a";
        } else {
            feedback.textContent = `❌ La respuesta correcta era "${palabraCorrecta}".`;
            feedback.style.color = "#dc2626";
        }
        el("quizPuntaje").textContent = `⭐ ${estado.ronda.puntaje}`;
        el("btnSiguientePregunta").classList.remove("d-none");
    }

    function calcularPuntos(nivel, tiempoUsado, tiempoTotal) {
        const base = nivel === "Difícil" ? 30 : nivel === "Medio" ? 20 : 10;
        const bonoVelocidad = Math.max(0, Math.round(((tiempoTotal - tiempoUsado) / tiempoTotal) * 10));
        return base + bonoVelocidad;
    }

    // ---------------------------------------------------------
    // TEMPORIZADOR POR PREGUNTA
    // ---------------------------------------------------------
    function iniciarTemporizador(segundos) {
        detenerTemporizador();
        estado.temporizador.total = segundos;
        estado.temporizador.restante = segundos;
        const barra = el("quizBarraTiempo");
        barra.style.width = "100%";
        barra.className = "quiz-timer-barra";

        estado.temporizador.id = setInterval(() => {
            estado.temporizador.restante--;
            const pct = Math.max(0, (estado.temporizador.restante / segundos) * 100);
            barra.style.width = pct + "%";
            barra.className = "quiz-timer-barra" + (pct <= 25 ? " tiempo-critico" : pct <= 50 ? " tiempo-medio" : "");
            if (estado.temporizador.restante <= 0) {
                detenerTemporizador();
                const pregunta = estado.ronda.preguntas[estado.ronda.indice];
                document.querySelectorAll("#quizContenidoPregunta button, .quiz-video-opcion").forEach((b) => {
                    b.disabled = true; b.style.pointerEvents = "none";
                });
                finalizarPregunta(false, pregunta.palabra);
            }
        }, 1000);
    }

    function detenerTemporizador() {
        if (estado.temporizador.id) {
            clearInterval(estado.temporizador.id);
            estado.temporizador.id = null;
        }
    }

    function siguientePregunta() {
        estado.ronda.indice++;
        mostrarPreguntaActual();
    }

    // ---------------------------------------------------------
    // MODO 4: MEMORIA (relacionar palabra con video)
    // ---------------------------------------------------------
    function iniciarModoMemoria() {
        const pool = mezclar(bancoFiltrado()).slice(0, CONFIG.PARES_MEMORIA);
        const cartas = [];
        pool.forEach((p, idx) => {
            cartas.push({ id: "p" + idx, parejaId: idx, tipo: "palabra", valor: p.palabra });
            cartas.push({ id: "v" + idx, parejaId: idx, tipo: "video", valor: p.video });
        });
        estado.memoria.cartas = mezclar(cartas);
        estado.memoria.primeraSeleccion = null;
        estado.memoria.bloqueado = false;
        estado.memoria.intentos = 0;
        estado.memoria.aciertos = 0;
        estado.memoria.inicio = Date.now();

        mostrarBloque("quizMemoria");
        renderGridMemoria();
        detenerCronoMemoria();
        estado.memoria.cronoId = setInterval(actualizarCronoMemoria, 1000);
        actualizarCronoMemoria();
    }

    function renderGridMemoria() {
        const grid = el("quizMemoriaGrid");
        grid.innerHTML = "";
        estado.memoria.cartas.forEach((carta) => {
            const div = document.createElement("div");
            div.className = "quiz-memoria-carta";
            div.dataset.id = carta.id;
            div.textContent = "🤟";
            div.onclick = () => seleccionarCartaMemoria(carta, div);
            grid.appendChild(div);
        });
        el("quizMemoriaIntentos").textContent = `Intentos: ${estado.memoria.intentos}`;
    }

    function seleccionarCartaMemoria(carta, divCarta) {
        if (estado.memoria.bloqueado || divCarta.classList.contains("acertada") || divCarta.classList.contains("volteada")) return;

        voltearCarta(carta, divCarta);

        if (!estado.memoria.primeraSeleccion) {
            estado.memoria.primeraSeleccion = { carta, divCarta };
            return;
        }

        estado.memoria.bloqueado = true;
        estado.memoria.intentos++;
        el("quizMemoriaIntentos").textContent = `Intentos: ${estado.memoria.intentos}`;

        const primera = estado.memoria.primeraSeleccion;
        const esPar = primera.carta.parejaId === carta.parejaId;

        setTimeout(() => {
            if (esPar) {
                primera.divCarta.classList.add("acertada");
                divCarta.classList.add("acertada");
                estado.memoria.aciertos++;
                reproducirSonidoCorrecto();
                if (estado.memoria.aciertos === estado.memoria.cartas.length / 2) {
                    detenerCronoMemoria();
                    mostrarResultadosMemoria();
                }
            } else {
                primera.divCarta.classList.add("error-temp");
                divCarta.classList.add("error-temp");
                reproducirSonidoIncorrecto();
                setTimeout(() => {
                    volverACerrar(primera.divCarta);
                    volverACerrar(divCarta);
                }, 500);
            }
            estado.memoria.primeraSeleccion = null;
            estado.memoria.bloqueado = false;
        }, 700);
    }

    function voltearCarta(carta, div) {
        div.classList.add("volteada");
        if (carta.tipo === "palabra") {
            div.textContent = carta.valor;
        } else {
            div.innerHTML = `<img src="https://img.youtube.com/vi/${carta.valor}/default.jpg" alt="Seña">`;
        }
    }

    function volverACerrar(div) {
        div.classList.remove("volteada", "error-temp");
        div.textContent = "🤟";
    }

    function actualizarCronoMemoria() {
        const seg = Math.floor((Date.now() - estado.memoria.inicio) / 1000);
        const m = String(Math.floor(seg / 60)).padStart(2, "0");
        const s = String(seg % 60).padStart(2, "0");
        el("quizMemoriaTiempo").textContent = `⏱ ${m}:${s}`;
    }

    function detenerCronoMemoria() {
        if (estado.memoria.cronoId) { clearInterval(estado.memoria.cronoId); estado.memoria.cronoId = null; }
    }

    function mostrarResultadosMemoria() {
        const segundos = Math.floor((Date.now() - estado.memoria.inicio) / 1000);
        mostrarBloque("quizResultados");
        el("quizResultadoIcono").textContent = "🧠";
        el("quizResultadoTitulo").textContent = "¡Memoria completada!";
        el("quizResultadoTexto").innerHTML = `Encontraste <strong>${estado.memoria.aciertos}</strong> pares en <strong>${estado.memoria.intentos}</strong> intentos y ${segundos} segundos.`;
        el("statCorrectas").textContent = estado.memoria.aciertos;
        el("statIncorrectas").textContent = Math.max(0, estado.memoria.intentos - estado.memoria.aciertos);
        const precision = estado.memoria.intentos > 0 ? Math.round((estado.memoria.aciertos / estado.memoria.intentos) * 100) : 0;
        el("statPorcentaje").textContent = precision + "%";
        el("quizRevisionLista").innerHTML = `<p class="text-muted small text-center mb-0">Modo memoria: no aplica revisión palabra por palabra.</p>`;
    }

    // ---------------------------------------------------------
    // PANTALLA: RESULTADOS FINALES (modos 1/2/3/5)
    // ---------------------------------------------------------
    function mostrarResultados() {
        mostrarBloque("quizResultados");
        const respuestas = estado.ronda.respuestas;
        const total = respuestas.length;
        const correctas = respuestas.filter((r) => r.correcta).length;
        const incorrectas = total - correctas;
        const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;

        el("quizResultadoIcono").textContent = porcentaje >= 80 ? "🏆" : porcentaje >= 50 ? "🙂" : "💪";
        el("quizResultadoTitulo").textContent = "¡Ronda completada!";
        el("quizResultadoTexto").innerHTML = `Obtuviste <strong>${estado.ronda.puntaje} puntos</strong>. Acertaste <strong>${correctas}</strong> de <strong>${total}</strong> preguntas.`;
        el("statCorrectas").textContent = correctas;
        el("statIncorrectas").textContent = incorrectas;
        el("statPorcentaje").textContent = porcentaje + "%";

        const lista = el("quizRevisionLista");
        lista.innerHTML = "";
        respuestas.forEach((r, i) => {
            const fila = document.createElement("div");
            fila.className = "quiz-revision-item " + (r.correcta ? "ok" : "fail");
            fila.innerHTML = `<span>${i + 1}. <strong>${r.palabra}</strong> <span class="text-muted">(${r.categoria} · ${r.nivel})</span></span><span>${r.correcta ? "✅" : "❌"}</span>`;
            lista.appendChild(fila);
        });
    }

    // ---------------------------------------------------------
    // UTILIDADES
    // ---------------------------------------------------------
    function mezclar(arr) {
        const copia = [...arr];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    // ---------------------------------------------------------
    // SONIDOS (sintetizados con Web Audio API, sin archivos externos)
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
    }

    // ---------------------------------------------------------
    // PANTALLA COMPLETA (pseudo-fullscreen compatible con móviles)
    // ---------------------------------------------------------
    function alternarPantallaCompleta() {
        const seccion = el("seccionQuiz");
        estado.pantallaCompleta = !estado.pantallaCompleta;
        seccion.classList.toggle("quiz-fullscreen", estado.pantallaCompleta);
        const btn = el("btnQuizFullscreen");
        if (btn) btn.textContent = estado.pantallaCompleta ? "⤢" : "⛶";
        if (estado.pantallaCompleta) window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // ---------------------------------------------------------
    // SALIR / REINICIAR
    // ---------------------------------------------------------
    function salir() {
        detenerTemporizador();
        detenerCronoMemoria();
        if (estado.pantallaCompleta) alternarPantallaCompleta();
    }

    function reiniciar() {
        mostrarIntro();
    }

    // ---------------------------------------------------------
    // ENLAZAR BOTONES ESTÁTICOS (una sola vez)
    // ---------------------------------------------------------
    function enlazarEventos() {
        const btnEmpezar = el("btnEmpezarQuiz");
        if (btnEmpezar) btnEmpezar.addEventListener("click", empezarPartida);

        const btnSiguiente = el("btnSiguientePregunta");
        if (btnSiguiente) btnSiguiente.addEventListener("click", siguientePregunta);

        const btnReiniciar = el("btnReiniciarQuiz");
        if (btnReiniciar) btnReiniciar.addEventListener("click", reiniciar);

        const btnSalir = el("btnQuizSalir");
        if (btnSalir) btnSalir.addEventListener("click", () => {
            salir();
            const seccion = el("seccionQuiz");
            if (seccion) seccion.classList.add("d-none");
        });

        const btnSalirResultados = el("btnQuizSalirResultados");
        if (btnSalirResultados) btnSalirResultados.addEventListener("click", () => {
            salir();
            const seccion = el("seccionQuiz");
            if (seccion) seccion.classList.add("d-none");
        });

        const btnFullscreen = el("btnQuizFullscreen");
        if (btnFullscreen) btnFullscreen.addEventListener("click", alternarPantallaCompleta);
    }

    // ---------------------------------------------------------
    // PUNTO DE ENTRADA PÚBLICO
    // Se llama desde script.js cada vez que el usuario abre la
    // sección Quiz (botón "Quiz" del menú superior).
    // ---------------------------------------------------------
    function iniciar() {
        enlazarEventos();
        cargarBanco(false);
    }

    return { iniciar, salir };
})();

document.addEventListener("DOMContentLoaded", () => {
    // No cargamos nada aquí todavía: los datos se piden recién
    // cuando el usuario entra a la sección Quiz (ver iniciar()),
    // para no gastar cuota de Apps Script innecesariamente.
});
