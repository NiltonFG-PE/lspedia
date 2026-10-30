/* ============================================================
   LSPedia - Matematicas V10 "premium"
   ------------------------------------------------------------
   Se integra dentro de Herramientas > Jugar y conserva la API
   publica que ya usa js/script.js:
       MatematicasV2.iniciar()
       MatematicasV2.salir()

   Diseñado para personas sordas que leen poco: numeros, iconos
   y color llevan el peso de la informacion; el texto que queda
   es minimo. "Practicar" muestra primero una guia visual con una
   mano; "Jugar" quita la ayuda y agrega tiempo. Se agrego un
   quinto modo, "Comparar" (mayor/menor/igual), pensado para
   reforzar el sentido numerico sin depender de leer.

   HistorialJuegosLSPedia (al final de este archivo) es codigo
   compartido por TODOS los juegos de Herramientas > Jugar, no
   solo por Matematicas: su contrato publico no cambia.
   ============================================================ */

const MatematicasV2 = (function () {
    "use strict";

    const OPS = {
        suma: {
            nombre: "Sumar", simbolo: "+", colorSolido: "#2563eb",
            clase: "m10-op-suma", claseEscena: "m10-escena-suma"
        },
        resta: {
            nombre: "Restar", simbolo: "−", colorSolido: "#f97316",
            clase: "m10-op-resta", claseEscena: "m10-escena-resta"
        },
        multiplicacion: {
            nombre: "Multiplicar", simbolo: "×", colorSolido: "#8b5cf6",
            clase: "m10-op-mult", claseEscena: "m10-escena-mult"
        },
        division: {
            nombre: "Dividir", simbolo: "÷", colorSolido: "#06b6d4",
            clase: "m10-op-div", claseEscena: "m10-escena-div"
        },
        comparar: {
            nombre: "Comparar", simbolo: "⚖️", colorSolido: "#ec4899",
            clase: "m10-op-comparar", claseEscena: "m10-escena-comparar"
        }
    };

    const NIVELES = [
        { n: 1, etiqueta: "Facil", icono: "🌱" },
        { n: 2, etiqueta: "Medio", icono: "🌿" },
        { n: 3, etiqueta: "Dificil", icono: "🌳" }
    ];

    const TEXTO_MODO = {
        practicar: "La mano te muestra como hacerlo. Luego lo haces tu.",
        jugar: "Sin ayuda. Resuelve antes de que se acabe el tiempo."
    };

    const LS_NIVEL = "lspedia_mat_v10_nivel";
    const LS_MODO = "lspedia_mat_v10_modo";
    const LS_ESTRELLAS = "lspedia_mat_v10_estrellas";

    const estado = {
        operacion: null,
        modo: "practicar",
        nivel: 1,
        pregunta: 0,
        puntaje: 0,
        estrellasRonda: [false, false, false, false, false],
        problema: null,
        timerId: null,
        tiempoRestante: 0,
        tiempoMax: 20,
        tutorialActivo: false,
        respondida: false,
        finalizada: false,
        uiLista: false,
        audioCtx: null
    };

    let root = null;
    let menu = null;
    let juego = null;

    function $(id) {
        return document.getElementById(id);
    }

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function barajar(arr) {
        const copia = arr.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = copia[i];
            copia[i] = copia[j];
            copia[j] = t;
        }
        return copia;
    }

    /* ---------- Estrellas totales: progreso que persiste entre visitas ---------- */
    function leerEstrellasTotales() {
        try {
            const v = parseInt(localStorage.getItem(LS_ESTRELLAS), 10);
            return v > 0 ? v : 0;
        } catch (_) {
            return 0;
        }
    }

    function sumarEstrellasTotales(n) {
        try {
            const actual = leerEstrellasTotales() + n;
            localStorage.setItem(LS_ESTRELLAS, String(actual));
            return actual;
        } catch (_) {
            return leerEstrellasTotales();
        }
    }

    function pintarEstrellasTotales() {
        const el = $("m10EstrellasTotalNum");
        if (el) el.textContent = String(leerEstrellasTotales());
    }

    /* ---------- Preferencias (nivel / modo elegidos) ---------- */
    function cargarPreferencias() {
        try {
            const nivel = parseInt(localStorage.getItem(LS_NIVEL), 10);
            if (nivel >= 1 && nivel <= 3) estado.nivel = nivel;
            const modo = localStorage.getItem(LS_MODO);
            if (modo === "practicar" || modo === "jugar") estado.modo = modo;
        } catch (_) {}
    }

    function guardarPreferencias() {
        try {
            localStorage.setItem(LS_NIVEL, String(estado.nivel));
            localStorage.setItem(LS_MODO, estado.modo);
        } catch (_) {}
    }

    /* ---------- Construccion de la interfaz ---------- */
    function construirUI() {
        root = $("matApp");
        menu = $("matMenu");
        juego = $("matJuego");
        if (!root || !menu || !juego) return false;

        menu.innerHTML =
            '<div class="m10-card">' +
                '<div class="m10-header-fila">' +
                    '<div class="m10-mascota" id="m10Mascota" aria-hidden="true"><span class="m10-mascota-cara">🦊</span></div>' +
                    '<div class="m10-header-textos">' +
                        '<h3 class="m10-titulo">Matematicas</h3>' +
                        '<p class="m10-subtitulo">Toca, arrastra y aprende jugando</p>' +
                    '</div>' +
                    '<div class="m10-estrellas-total" aria-hidden="true">⭐ <span id="m10EstrellasTotalNum">0</span></div>' +
                '</div>' +
            '</div>' +
            '<div class="m10-card">' +
                '<div class="m10-seccion-titulo">Nivel</div>' +
                '<div class="m10-niveles" id="m10Niveles"></div>' +
            '</div>' +
            '<div class="m10-card">' +
                '<div class="m10-seccion-titulo">Modo</div>' +
                '<div class="m10-modos" id="m10Modos"></div>' +
                '<p class="m10-nota" id="m10ModoAyuda"></p>' +
            '</div>' +
            '<div class="m10-card">' +
                '<div class="m10-seccion-titulo">¿Que quieres practicar?</div>' +
                '<div class="m10-operaciones" id="m10Operaciones"></div>' +
            '</div>';

        juego.innerHTML =
            '<div class="m10-juego-top">' +
                '<button type="button" id="m10Volver" class="m10-volver" aria-label="Volver">←</button>' +
                '<div class="m10-juego-centro">' +
                    '<div id="m10TituloJuego" class="m10-juego-titulo"></div>' +
                    '<div id="m10EstrellasRonda" class="m10-estrellas-ronda" aria-hidden="true"></div>' +
                '</div>' +
                '<div class="m10-mascota m10-mascota-mini" id="m10MascotaMini" aria-hidden="true"><span class="m10-mascota-cara">🦊</span></div>' +
            '</div>' +
            '<div class="m10-progreso"><div id="m10Barra"></div></div>' +
            '<div id="m10TimerWrap" class="m10-timer-wrap m10-oculto"><div id="m10Timer" class="m10-timer"></div></div>' +
            '<div class="m10-card m10-juego-card">' +
                '<div id="m10Prompt" class="m10-prompt"></div>' +
                '<div id="m10Escena" class="m10-escena"></div>' +
                '<div id="m10Respuestas"></div>' +
                '<div id="m10Feedback"></div>' +
                '<button type="button" id="m10Siguiente" class="m10-siguiente m10-oculto">Siguiente →</button>' +
            '</div>';

        enlazarUI();
        renderizarNiveles();
        renderizarModos();
        renderizarOperaciones();
        pintarEstrellasTotales();
        estado.uiLista = true;
        return true;
    }

    function asegurarUI() {
        if (estado.uiLista && $("m10Escena") && $("m10Niveles")) return true;
        cargarPreferencias();
        return construirUI();
    }

    function enlazarUI() {
        const volver = $("m10Volver");
        if (volver) volver.addEventListener("click", volverMenu);

        const siguiente = $("m10Siguiente");
        if (siguiente) {
            siguiente.addEventListener("click", () => {
                if (estado.finalizada) {
                    estado.finalizada = false;
                    $("m10Siguiente").textContent = "Siguiente →";
                    volverMenu();
                } else {
                    siguientePregunta();
                }
            });
        }
    }

    function renderizarNiveles() {
        const cont = $("m10Niveles");
        if (!cont) return;
        cont.innerHTML = "";
        NIVELES.forEach((n) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "m10-nivel" + (n.n === estado.nivel ? " m10-activo" : "");
            btn.innerHTML = '<span class="m10-nivel-icono">' + n.icono + '</span><span class="m10-nivel-texto">' + n.etiqueta + '</span>';
            btn.addEventListener("click", () => {
                estado.nivel = n.n;
                guardarPreferencias();
                renderizarNiveles();
            });
            cont.appendChild(btn);
        });
    }

    function renderizarModos() {
        const cont = $("m10Modos");
        if (!cont) return;
        cont.innerHTML = "";
        const modos = [
            { id: "practicar", icono: "✋", texto: "Practicar" },
            { id: "jugar", icono: "🎮", texto: "Jugar" }
        ];
        modos.forEach((m) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "m10-modo" + (m.id === estado.modo ? " m10-activo" : "");
            btn.innerHTML = '<span class="m10-modo-icono">' + m.icono + '</span><span>' + m.texto + '</span>';
            btn.addEventListener("click", () => {
                estado.modo = m.id;
                guardarPreferencias();
                renderizarModos();
            });
            cont.appendChild(btn);
        });
        const ayuda = $("m10ModoAyuda");
        if (ayuda) ayuda.textContent = TEXTO_MODO[estado.modo];
    }

    function renderizarOperaciones() {
        const cont = $("m10Operaciones");
        if (!cont) return;
        cont.innerHTML = "";
        const datos = {
            suma: { emoji: "🍎" }, resta: { emoji: "🥩" },
            multiplicacion: { emoji: "📦" }, division: { emoji: "🐟" },
            comparar: { emoji: "⚖️" }
        };
        Object.keys(OPS).forEach((clave) => {
            const op = OPS[clave];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "m10-op " + op.clase;
            btn.setAttribute("aria-label", op.nombre);
            btn.innerHTML =
                '<span class="m10-op-emoji">' + datos[clave].emoji + '</span>' +
                '<span>' + op.nombre + '</span>' +
                '<span class="m10-op-simbolo">' + op.simbolo + '</span>';
            btn.addEventListener("click", () => iniciarPartida(clave));
            cont.appendChild(btn);
        });
    }

    function mostrarMenu() {
        detenerTimer();
        ocultarCuentaRegresiva();
        menu.classList.add("mat-pantalla-activa");
        juego.classList.remove("mat-pantalla-activa");
        renderizarNiveles();
        renderizarModos();
        pintarEstrellasTotales();
        estado.finalizada = false;
        const siguiente = $("m10Siguiente");
        if (siguiente) siguiente.textContent = "Siguiente →";
    }

    function mostrarJuego() {
        menu.classList.remove("mat-pantalla-activa");
        juego.classList.add("mat-pantalla-activa");
    }

    function iniciarPartida(operacion, opciones = {}) {
        estado.operacion = operacion;
        estado.pregunta = 0;
        estado.puntaje = 0;
        estado.estrellasRonda = [false, false, false, false, false];
        estado.respondida = false;
        estado.finalizada = false;
        if (!opciones.sinHistorial && window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarPantallaMatematicas === "function") {
            HistorialJuegosLSPedia.registrarPantallaMatematicas("partida", operacion);
        }
        mostrarJuego();
        const nivelInfo = NIVELES[estado.nivel - 1];
        $("m10TituloJuego").textContent = OPS[operacion].nombre + (nivelInfo ? " · " + nivelInfo.icono + " " + nivelInfo.etiqueta : "");
        pintarEstrellasRonda();
        siguientePregunta();
    }

    function volverMenu() {
        detenerTimer();
        ocultarCuentaRegresiva();
        estado.tutorialActivo = false;

        const params = new URLSearchParams(window.location.search);
        const enPartidaHistorial = params.get("juego") === "matematicas" && params.get("pantalla") === "partida";
        if (enPartidaHistorial && window.history.length > 1) {
            window.history.back();
            return;
        }

        mostrarMenu();
    }

    /* ---------- Generacion de problemas ---------- */
    function generarRestaSinPrestamo(total) {
        const centenas = Math.floor(total / 100) % 10;
        const decenas = Math.floor(total / 10) % 10;
        const unidades = total % 10;

        for (let intento = 0; intento < 30; intento++) {
            const c = randInt(0, centenas);
            const d = randInt(0, decenas);
            const u = randInt(0, unidades);
            const quitar = c * 100 + d * 10 + u;
            if (quitar >= 1 && quitar < total) return quitar;
        }

        if (unidades > 0) return 1;
        if (decenas > 0) return 10;
        if (centenas > 0) return 100;
        return 1;
    }

    function generarProblema() {
        const nivel = estado.nivel;
        const op = estado.operacion;

        if (op === "suma") {
            if (nivel === 1) {
                const a = randInt(1, 5), b = randInt(1, 5);
                return { a, b, resultado: a + b };
            }
            if (nivel === 2) {
                const a = randInt(3, 19), b = randInt(1, 9);
                return { a, b, resultado: a + b };
            }
            const a = randInt(20, 180), b = randInt(10, 80);
            return { a, b, resultado: a + b };
        }

        if (op === "resta") {
            if (nivel === 1) {
                const a = randInt(3, 5);
                const b = randInt(1, a - 1);
                return { a, b, resultado: a - b };
            }
            if (nivel === 2) {
                const a = randInt(10, 39);
                const b = generarRestaSinPrestamo(a);
                return { a, b, resultado: a - b };
            }
            let a = randInt(100, 299);
            if (a % 100 === 0) a += randInt(1, 9);
            const b = generarRestaSinPrestamo(a);
            return { a, b, resultado: a - b };
        }

        if (op === "multiplicacion") {
            const grupos = nivel === 1 ? randInt(2, 4) : nivel === 2 ? randInt(3, 6) : randInt(4, 8);
            const cada = nivel === 1 ? randInt(1, 3) : nivel === 2 ? randInt(3, 12) : randInt(10, 50);
            return { a: grupos, b: cada, resultado: grupos * cada };
        }

        if (op === "division") {
            const grupos = nivel === 1 ? randInt(2, 3) : nivel === 2 ? randInt(3, 5) : randInt(4, 8);
            const cada = nivel === 1 ? randInt(1, 3) : nivel === 2 ? randInt(3, 12) : randInt(10, 50);
            return { a: grupos * cada, b: grupos, resultado: cada };
        }

        // comparar: dos cantidades independientes; a veces iguales a proposito
        const tope = nivel === 1 ? 9 : nivel === 2 ? 30 : 200;
        const a = randInt(1, tope);
        let b;
        if (Math.random() < 0.28) {
            b = a;
        } else {
            do { b = randInt(1, tope); } while (b === a);
        }
        const simboloCorrecto = a > b ? ">" : a < b ? "<" : "=";
        return { a, b, resultado: simboloCorrecto };
    }

    function renderizarPrompt() {
        const cont = $("m10Prompt");
        if (!cont) return;
        if (estado.operacion === "comparar") {
            cont.innerHTML = "";
            return;
        }
        const p = estado.problema;
        const op = OPS[estado.operacion];
        cont.innerHTML =
            '<div class="m10-ecuacion">' +
                '<span class="m10-eq-num">' + p.a + '</span>' +
                '<span class="m10-eq-op" style="background:' + op.colorSolido + '">' + op.simbolo + '</span>' +
                '<span class="m10-eq-num">' + p.b + '</span>' +
                '<span class="m10-eq-igual">=</span>' +
                '<span class="m10-eq-r" id="m10Resultado">?</span>' +
            '</div>';
    }

    /* ---------- Piezas y arrastre (compartido por las 4 operaciones con manipulativos) ---------- */
    function crearObjeto(icono, valor) {
        const el = document.createElement("div");
        el.className = "m10-objeto";
        el.dataset.valor = String(valor);
        if (valor === 1) {
            el.textContent = icono;
        } else {
            el.classList.add("m10-objeto-bloque");
            el.textContent = String(valor);
        }
        return el;
    }

    function piezasCompactas(n) {
        const piezas = [];
        if (n <= 9) {
            while (n-- > 0) piezas.push(1);
            return piezas;
        }
        while (n >= 100) { piezas.push(100); n -= 100; }
        while (n >= 10) { piezas.push(10); n -= 10; }
        while (n > 0) { piezas.push(1); n--; }
        return piezas;
    }

    function setContador(zona, n) {
        const c = zona.querySelector(".m10-contador");
        if (c) c.textContent = String(n);
    }

    function centroDentro(el, destino) {
        const a = el.getBoundingClientRect();
        const b = destino.getBoundingClientRect();
        const x = a.left + a.width / 2;
        const y = a.top + a.height / 2;
        return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    }

    function colocar(el, destino) {
        destino.appendChild(el);
        el.dataset.bloqueado = "1";
        el.classList.add("m10-colocado");
        Object.assign(el.style, {
            position: "", left: "", top: "", width: "", height: "", margin: "", transition: ""
        });
    }

    function activarArrastre(el, escena, onDrop) {
        el.style.touchAction = "none";
        el.addEventListener("pointerdown", function onDown(e) {
            if (estado.tutorialActivo || el.dataset.bloqueado === "1") return;
            e.preventDefault();

            const rEscena = escena.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            const x0 = r.left - rEscena.left;
            const y0 = r.top - rEscena.top;
            const w = r.width;
            const h = r.height;
            const padre = el.parentElement;
            const siguiente = el.nextSibling;
            let lx = e.clientX;
            let ly = e.clientY;

            // Mientras dura el arrastre, dejamos un marcador invisible del
            // mismo tamaño ocupando el lugar de la pieza dentro de su zona
            // de origen (la bandeja). Sin esto, al sacar la pieza esa zona
            // se encoge de golpe apenas se la toca, y si con eso pasa a ser
            // mas baja que la zona vecina (el leon), toda la fila se
            // reacomoda y el leon se corre de lugar justo en el instante en
            // que el jugador empieza a arrastrar -antes de que mueva el
            // dedo o el cursor-, haciendo que el blanco ya no este donde se
            // veia. El marcador se quita en soltar(), pase lo que pase.
            const marcador = document.createElement("div");
            marcador.className = "m10-marcador-espacio";
            marcador.style.width = w + "px";
            marcador.style.height = h + "px";
            if (siguiente) padre.insertBefore(marcador, siguiente);
            else padre.appendChild(marcador);

            escena.appendChild(el);
            el.classList.add("m10-arrastrando");
            Object.assign(el.style, {
                position: "absolute",
                left: x0 + "px",
                top: y0 + "px",
                width: w + "px",
                height: h + "px",
                margin: "0"
            });

            try { el.setPointerCapture(e.pointerId); } catch (_) {}

            function mover(ev) {
                const dx = ev.clientX - lx;
                const dy = ev.clientY - ly;
                lx = ev.clientX;
                ly = ev.clientY;
                el.style.left = (parseFloat(el.style.left) + dx) + "px";
                el.style.top = (parseFloat(el.style.top) + dy) + "px";
            }

            function soltar(ev) {
                el.removeEventListener("pointermove", mover);
                el.removeEventListener("pointerup", soltar);
                el.removeEventListener("pointercancel", soltar);
                el.classList.remove("m10-arrastrando");

                // Importante: el marcador se quita DESPUES de preguntarle a
                // onDrop si acierta, no antes. Si lo sacamos primero, la
                // bandeja se encoge (y el leon se corre) justo en el
                // instante de soltar, antes de que centroDentro() alcance a
                // comparar -el blanco cambia de lugar entre que el jugador
                // apunta y el momento en que se decide si entro o no-.
                const aceptado = onDrop(ev, el);
                if (aceptado) {
                    if (marcador.parentNode) marcador.remove();
                } else {
                    if (marcador.parentNode) marcador.parentNode.replaceChild(el, marcador);
                    else if (siguiente) padre.insertBefore(el, siguiente);
                    else padre.appendChild(el);
                    Object.assign(el.style, {
                        position: "", left: "", top: "", width: "", height: "", margin: ""
                    });
                }
            }

            el.addEventListener("pointermove", mover);
            el.addEventListener("pointerup", soltar);
            el.addEventListener("pointercancel", soltar);
        });
    }

    /* ---------- Guia visual con mano (modo Practicar) ---------- */
    function mostrarBadgeTutorial(escena) {
        const badge = document.createElement("div");
        badge.className = "m10-tutorial-badge";
        badge.innerHTML = "👀 <span>Mira primero</span>";
        escena.insertBefore(badge, escena.firstChild);
    }

    function mostrarAhoraTu(escena) {
        const el = document.createElement("div");
        el.className = "m10-ahora-tu";
        el.innerHTML = "✋ <span>Ahora tu</span>";
        escena.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 1800);
    }

    function tutorialMover(escena, origen, destino, contenido, opciones = {}) {
        const rEscena = escena.getBoundingClientRect();
        const rOrigen = origen.getBoundingClientRect();
        const rDestino = destino.getBoundingClientRect();

        let fantasma;
        if (opciones.clonar) {
            fantasma = origen.cloneNode(true);
            fantasma.classList.remove("m10-arrastrando", "m10-colocado");
            fantasma.classList.add("m10-tutorial-fantasma");
            fantasma.style.width = rOrigen.width + "px";
            fantasma.style.height = rOrigen.height + "px";
        } else {
            fantasma = document.createElement("div");
            fantasma.className = "m10-tutorial-fantasma" + (opciones.paquete ? " m10-tutorial-paquete" : "");
            fantasma.textContent = contenido;
        }

        const mano = document.createElement("div");
        mano.className = "m10-tutorial-mano";
        mano.textContent = "👆";

        escena.appendChild(fantasma);
        escena.appendChild(mano);

        const sx = rOrigen.left - rEscena.left + rOrigen.width / 2;
        const sy = rOrigen.top - rEscena.top + rOrigen.height / 2;
        const tx = rDestino.left - rEscena.left + rDestino.width / 2;
        const ty = rDestino.top - rEscena.top + rDestino.height / 2;

        fantasma.style.left = (sx - rOrigen.width / 2) + "px";
        fantasma.style.top = (sy - rOrigen.height / 2) + "px";
        mano.style.left = (sx - 8) + "px";
        mano.style.top = (sy + 10) + "px";

        destino.classList.add("m10-tutorial-destino");

        requestAnimationFrame(() => {
            fantasma.classList.add("m10-tutorial-mover");
            mano.classList.add("m10-tutorial-mover");
            fantasma.style.transform = `translate(${tx - sx}px, ${ty - sy}px)`;
            mano.style.transform = `translate(${tx - sx}px, ${ty - sy}px)`;
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                fantasma.remove();
                mano.remove();
                destino.classList.remove("m10-tutorial-destino");
                resolve();
            }, 1150);
        });
    }

    async function tutorialSuma(escena, objeto, destino) {
        if (estado.modo !== "practicar" || !objeto) return;
        estado.tutorialActivo = true;
        mostrarBadgeTutorial(escena);
        await tutorialMover(escena, objeto, destino, "🍎", { clonar: true });
        estado.tutorialActivo = false;
        mostrarAhoraTu(escena);
    }

    async function tutorialResta(escena, objeto, leon) {
        if (estado.modo !== "practicar" || !objeto) return;
        estado.tutorialActivo = true;
        mostrarBadgeTutorial(escena);
        await tutorialMover(escena, objeto, leon, "🥩", { clonar: true });
        const svg = $("m10Leon");
        if (svg) {
            svg.setAttribute("class", "m10-leon-svg m10-leon-neutral");
            setTimeout(() => {
                if (svg) svg.setAttribute("class", "m10-leon-svg m10-leon-enojado");
            }, 650);
        }
        estado.tutorialActivo = false;
        mostrarAhoraTu(escena);
    }

    async function tutorialMultiplicacion(escena, grupo, vagones) {
        if (estado.modo !== "practicar" || !grupo) return;
        estado.tutorialActivo = true;
        mostrarBadgeTutorial(escena);

        for (let i = 0; i < Math.min(vagones.length, 3); i++) {
            vagones[i].zona.classList.add("m10-foco");
            await tutorialMover(escena, grupo, vagones[i].zona, "", { clonar: true });
            vagones[i].zona.classList.remove("m10-foco");
        }

        estado.tutorialActivo = false;
        mostrarAhoraTu(escena);
    }

    async function tutorialDivision(escena, paquete, pinguinos) {
        if (estado.modo !== "practicar" || !paquete) return;
        estado.tutorialActivo = true;
        mostrarBadgeTutorial(escena);

        for (let i = 0; i < Math.min(pinguinos.length, 4); i++) {
            pinguinos[i].unidad.classList.add("m10-foco");
            await tutorialMover(escena, paquete, pinguinos[i].plato, "", { clonar: true });
            pinguinos[i].unidad.classList.remove("m10-foco");
        }

        estado.tutorialActivo = false;
        mostrarAhoraTu(escena);
    }

    function ayudaModo(texto) {
        const d = document.createElement("div");
        d.className = estado.modo === "practicar" ? "m10-ayuda m10-ayuda-practica" : "m10-ayuda m10-ayuda-juego";
        d.innerHTML = '<span>' + (estado.modo === "practicar" ? "✋" : "🎮") + '</span><span>' + texto + '</span>';
        $("m10Escena").appendChild(d);
    }

    /* ---------- Suma ---------- */
    function renderSuma() {
        const p = estado.problema;
        const escena = $("m10Escena");
        escena.className = "m10-escena m10-escena-suma";
        escena.innerHTML =
            '<div class="m10-escena-iconos">🍎 <span class="m10-escena-flecha">➜</span> 🧺</div>' +
            '<div class="m10-zonas"></div>' +
            '<div class="m10-flujo"><span>' + p.a + '</span><strong class="m10-azul">+</strong><strong class="m10-azul">' + p.b + '</strong><i>→</i><strong id="m10SumaTotal">' + p.a + '</strong></div>';

        const zonas = escena.querySelector(".m10-zonas");

        const cesta = document.createElement("div");
        cesta.className = "m10-zona m10-zona-destino";
        cesta.innerHTML = '<div class="m10-contador">' + p.a + '</div>';

        const fuente = document.createElement("div");
        fuente.className = "m10-zona m10-zona-fuente-color";
        fuente.innerHTML = '<div class="m10-contador m10-azul">' + p.b + '</div>';

        zonas.append(cesta, fuente);

        piezasCompactas(p.a).forEach((v) => {
            const o = crearObjeto("🍎", v);
            o.dataset.bloqueado = "1";
            o.classList.add("m10-base");
            cesta.appendChild(o);
        });

        const movibles = [];
        piezasCompactas(p.b).forEach((v) => {
            const o = crearObjeto("🍎", v);
            fuente.appendChild(o);
            movibles.push({ el: o, valor: v });
        });

        let agregado = 0;
        movibles.forEach(({ el, valor }) => {
            activarArrastre(el, escena, (_ev, obj) => {
                if (!centroDentro(obj, cesta)) return false;
                colocar(obj, cesta);
                agregado += valor;
                setContador(fuente, Math.max(0, p.b - agregado));
                setContador(cesta, p.a + agregado);
                $("m10SumaTotal").textContent = String(p.a + agregado);
                if (agregado === p.b) accionCompletada();
                return true;
            });
        });

        if (estado.modo === "practicar") {
            tutorialSuma(escena, movibles[0] && movibles[0].el, cesta);
            ayudaModo("Mira como la mano lleva la manzana a la cesta. Luego hazlo tu.");
        } else {
            ayudaModo("Junta rapido la cantidad con la cesta.");
        }
    }

    /* ---------- Resta ---------- */
    function estadoLeon(comido, necesita) {
        if (comido === 0) return "m10-leon-enojado";
        if (comido < necesita) return "m10-leon-neutral";
        return "m10-leon-feliz";
    }

    function svgLeon() {
        return `
        <svg viewBox="0 0 180 180" class="m10-leon-svg m10-leon-enojado" id="m10Leon" role="img" aria-label="Leon hambriento">
            <g class="m10-melena">
                <path d="M90 8
                    C112 8 108 26 128 22
                    C148 18 150 -2 168 12
                    C182 24 168 36 182 46
                    C196 56 194 76 178 82
                    C192 90 188 110 172 114
                    C182 124 174 142 158 140
                    C162 154 148 168 134 160
                    C132 174 114 178 106 166
                    C98 176 82 176 74 166
                    C66 178 48 174 46 160
                    C32 168 18 154 22 140
                    C6 142 -2 124 8 114
                    C-8 110 -12 90 2 82
                    C-14 76 -16 56 -2 46
                    C12 36 -2 24 12 12
                    C30 -2 32 18 52 22
                    C72 26 68 8 90 8 Z"/>
            </g>
            <circle class="m10-oreja-ext" cx="46" cy="44" r="17"/><circle class="m10-oreja-ext" cx="134" cy="44" r="17"/>
            <circle class="m10-oreja-int" cx="46" cy="46" r="8"/><circle class="m10-oreja-int" cx="134" cy="46" r="8"/>
            <ellipse class="m10-cara" cx="90" cy="94" rx="50" ry="46"/>
            <path class="m10-hocico" d="M90 92
                C108 92 122 104 120 120
                C118 134 105 142 90 142
                C75 142 62 134 60 120
                C58 104 72 92 90 92 Z"/>
            <line class="m10-bigote" x1="58" y1="112" x2="24" y2="106"/>
            <line class="m10-bigote" x1="58" y1="120" x2="22" y2="120"/>
            <line class="m10-bigote" x1="58" y1="128" x2="24" y2="134"/>
            <line class="m10-bigote" x1="122" y1="112" x2="156" y2="106"/>
            <line class="m10-bigote" x1="122" y1="120" x2="158" y2="120"/>
            <line class="m10-bigote" x1="122" y1="128" x2="156" y2="134"/>
            <line class="m10-ceja m10-ceja-i" x1="62" y1="72" x2="82" y2="66"/>
            <line class="m10-ceja m10-ceja-d" x1="98" y1="66" x2="118" y2="72"/>
            <circle class="m10-ojo m10-ojo-i" cx="72" cy="82" r="6"/>
            <circle class="m10-ojo m10-ojo-d" cx="108" cy="82" r="6"/>
            <path class="m10-ojo-feliz" d="M65 82 Q72 76 79 82"/>
            <path class="m10-ojo-feliz" d="M101 82 Q108 76 115 82"/>
            <path class="m10-nariz" d="M82 98 Q90 92 98 98 Q97 106 90 108 Q83 106 82 98 Z"/>
            <g class="m10-boca-abierta">
                <path d="M90 108 Q68 110 66 128 Q66 142 90 144 Q114 142 114 128 Q112 110 90 108 Z"/>
                <ellipse class="m10-lengua" cx="90" cy="130" rx="11" ry="7"/>
                <path class="m10-diente" d="M74 112 L80 112 L77 120 Z"/>
                <path class="m10-diente" d="M100 112 L106 112 L103 120 Z"/>
            </g>
            <path class="m10-boca-neutral" d="M74 120 Q90 126 106 120"/>
            <path class="m10-boca-feliz" d="M66 108 Q90 134 114 108"/>
        </svg>`;
    }

    function renderResta() {
        const p = estado.problema;
        const escena = $("m10Escena");
        escena.className = "m10-escena m10-escena-resta";
        escena.innerHTML =
            '<div class="m10-escena-iconos">🥩 <span class="m10-escena-flecha">➜</span> 🦁</div>' +
            '<div class="m10-zonas"></div>' +
            '<div class="m10-flujo"><span>' + p.a + '</span><strong class="m10-naranja">−</strong><strong class="m10-naranja">' + p.b + '</strong><i>→</i><strong id="m10RestaQueda">' + p.a + '</strong></div>';

        const zonas = escena.querySelector(".m10-zonas");

        const bandeja = document.createElement("div");
        bandeja.className = "m10-zona m10-zona-fuente-neutra";
        bandeja.innerHTML = '<div class="m10-contador">' + p.a + '</div>';

        const leon = document.createElement("div");
        leon.className = "m10-zona m10-leon-zona";
        leon.innerHTML = '<div class="m10-contador m10-naranja">0</div><div class="m10-leon-box">' + svgLeon() + '</div>';

        zonas.append(bandeja, leon);

        // Las piezas se calculan a partir de lo que hay que QUITAR (p.b),
        // no del total (p.a). Asi se decide de antemano, pieza por pieza,
        // que va al leon y que se queda en la bandeja: el jugador nunca
        // puede arrastrar algo "de mas" ni quedarse sin piezas que encajen,
        // sin importar el orden en que las mueva.
        const necesita = desglosarValor(p.b);
        const disponible = desglosarValor(p.a);
        const piezasArrastrables = [];

        [100, 10].forEach((denom) => {
            const cantidadNecesaria = necesita[denom];
            const cantidadQueda = disponible[denom] - cantidadNecesaria;

            if (cantidadQueda > 0) {
                const pilaFija = crearPilaResta(denom, cantidadQueda);
                pilaFija.dataset.bloqueado = "1";
                pilaFija.classList.add("m10-base");
                bandeja.appendChild(pilaFija);
            }
            if (cantidadNecesaria > 0) {
                const pilaMovible = crearPilaResta(denom, cantidadNecesaria);
                bandeja.appendChild(pilaMovible);
                piezasArrastrables.push({ el: pilaMovible, valor: denom * cantidadNecesaria });
            }
        });

        // Las unidades se muestran una por una: son pocas como maximo (9) y
        // contar de a una ayuda mas que agruparlas.
        for (let i = 0; i < disponible[1] - necesita[1]; i++) {
            const o = crearObjeto("🥩", 1);
            o.dataset.bloqueado = "1";
            o.classList.add("m10-base");
            bandeja.appendChild(o);
        }
        for (let i = 0; i < necesita[1]; i++) {
            const o = crearObjeto("🥩", 1);
            bandeja.appendChild(o);
            piezasArrastrables.push({ el: o, valor: 1 });
        }

        let comido = 0;
        piezasArrastrables.forEach(({ el, valor }) => {
            activarArrastre(el, escena, (_ev, obj) => {
                if (!centroDentro(obj, leon)) return false;

                comido += valor;
                leon.querySelector(".m10-contador").textContent = String(comido);
                bandeja.querySelector(".m10-contador").textContent = String(p.a - comido);
                $("m10RestaQueda").textContent = String(p.a - comido);

                const svg = $("m10Leon");
                if (svg) {
                    svg.setAttribute("class", "m10-leon-svg " + estadoLeon(comido, p.b) + " m10-leon-mordisco");
                    setTimeout(() => {
                        if (svg) svg.setAttribute("class", "m10-leon-svg " + estadoLeon(comido, p.b));
                    }, 340);
                }

                obj.remove();

                if (comido === p.b) accionCompletada();
                return true;
            });
        });

        if (estado.modo === "practicar") {
            tutorialResta(escena, piezasArrastrables[0] && piezasArrastrables[0].el, leon);
            ayudaModo("Mira la mano. Luego dale al leon las piezas que no estan apagadas.");
        } else {
            ayudaModo("Dale al leon las piezas que no estan apagadas antes de que acabe el tiempo.");
        }
    }

    // Separa un numero en cuantas centenas, decenas y unidades tiene.
    // Se usa para decidir, pieza por pieza, cuales van al leon (p.b) y
    // cuales se quedan en la bandeja (p.a - p.b).
    function desglosarValor(n) {
        return {
            100: Math.floor(n / 100),
            10: Math.floor((n % 100) / 10),
            1: n % 10
        };
    }

    // Una pieza que representa varias decenas o centenas juntas (por
    // ejemplo "8 decenas"), para no obligar a arrastrar una por una en
    // numeros grandes. cantidad siempre es la que corresponde arrastrar
    // o quedarse completa: nunca hace falta partirla.
    function crearPilaResta(denominacion, cantidad) {
        const pila = document.createElement("div");
        pila.className = "m10-pila-resta " + (denominacion === 100 ? "m10-pila-100" : "m10-pila-10");
        pila.dataset.valor = String(denominacion * cantidad);

        const icono = denominacion === 100 ? "🍖" : "🥩";
        if (cantidad <= 6) {
            const iconos = document.createElement("div");
            iconos.className = "m10-grupo-iconos";
            for (let i = 0; i < cantidad; i++) {
                const s = document.createElement("span");
                s.textContent = icono;
                iconos.appendChild(s);
            }
            pila.appendChild(iconos);
        } else {
            const grande = document.createElement("span");
            grande.className = "m10-grupo-grande";
            grande.textContent = icono + " × " + cantidad;
            pila.appendChild(grande);
        }

        const etiqueta = document.createElement("strong");
        etiqueta.textContent = String(denominacion * cantidad);
        pila.appendChild(etiqueta);
        return pila;
    }

    /* ---------- Multiplicacion y division: grupos compactos ---------- */
    function crearGrupoCajas(cantidad) {
        const grupo = document.createElement("div");
        grupo.className = "m10-grupo-cajas";
        grupo.dataset.valor = String(cantidad);

        if (cantidad <= 8) {
            const iconos = document.createElement("div");
            iconos.className = "m10-grupo-iconos";
            for (let i = 0; i < cantidad; i++) {
                const s = document.createElement("span");
                s.textContent = "📦";
                iconos.appendChild(s);
            }
            grupo.appendChild(iconos);
        } else {
            grupo.innerHTML = '<span class="m10-grupo-grande">📦 × ' + cantidad + '</span>';
        }

        const etiqueta = document.createElement("strong");
        etiqueta.textContent = String(cantidad);
        grupo.appendChild(etiqueta);
        return grupo;
    }

    function crearPaquetePeces(cantidad) {
        const paquete = document.createElement("div");
        paquete.className = "m10-paquete-peces";
        paquete.dataset.valor = String(cantidad);

        if (cantidad <= 6) {
            const iconos = document.createElement("div");
            iconos.className = "m10-grupo-iconos";
            for (let i = 0; i < cantidad; i++) {
                const s = document.createElement("span");
                s.textContent = "🐟";
                iconos.appendChild(s);
            }
            paquete.appendChild(iconos);
        } else {
            paquete.innerHTML = `<span class="m10-grupo-grande">🐟 🐟 🐟 …</span>`;
        }

        return paquete;
    }

    function renderMultiplicacion() {
        const p = estado.problema;
        const escena = $("m10Escena");
        escena.className = "m10-escena m10-escena-mult";
        escena.innerHTML =
            '<div class="m10-escena-iconos">📦 <span class="m10-escena-flecha">➜</span> 🚂</div>' +
            '<div class="m10-pool"><div class="m10-contador">' + p.a + ' grupos</div></div>' +
            '<div class="m10-tren"></div>' +
            '<div class="m10-info-rapida"><span>' + p.a + ' grupos</span><strong>×</strong><span>' + p.b + ' en cada uno</span></div>';

        const pool = escena.querySelector(".m10-pool");
        const tren = escena.querySelector(".m10-tren");

        const motor = document.createElement("div");
        motor.className = "m10-motor";
        motor.textContent = "🚂";
        tren.appendChild(motor);

        const vagones = [];
        for (let i = 0; i < p.a; i++) {
            const v = document.createElement("div");
            v.className = "m10-vagon";
            v.innerHTML = '<div class="m10-contador">0 / ' + p.b + '</div>';
            tren.appendChild(v);
            vagones.push({ zona: v, lleno: false });
        }

        const grupos = [];
        for (let i = 0; i < p.a; i++) {
            const grupo = crearGrupoCajas(p.b);
            pool.appendChild(grupo);
            grupos.push(grupo);
        }

        let colocados = 0;
        grupos.forEach((grupo) => {
            activarArrastre(grupo, escena, (_ev, obj) => {
                for (const v of vagones) {
                    if (centroDentro(obj, v.zona) && !v.lleno) {
                        colocar(obj, v.zona);
                        v.lleno = true;
                        colocados++;
                        v.zona.querySelector(".m10-contador").textContent = String(p.b);
                        pool.querySelector(".m10-contador").textContent = (p.a - colocados) + " grupos";
                        if (colocados === p.a) accionCompletada();
                        return true;
                    }
                }
                return false;
            });
        });

        if (estado.modo === "practicar") {
            tutorialMultiplicacion(escena, grupos[0], vagones);
            ayudaModo("La mano lleva un grupo completo a cada vagon. Luego hazlo tu.");
        } else {
            ayudaModo("Pon un grupo igual en cada vagon.");
        }
    }

    function renderDivision() {
        const p = estado.problema;
        const escena = $("m10Escena");
        escena.className = "m10-escena m10-escena-div";
        escena.innerHTML =
            '<div class="m10-escena-iconos">🐟 <span class="m10-escena-flecha">↘</span> 🐧 🐧 <span class="m10-escena-flecha">↙</span></div>' +
            '<div class="m10-pool"><div class="m10-contador">' + p.a + ' peces</div></div>' +
            '<div class="m10-pinguinos"></div>' +
            '<div class="m10-info-rapida"><span>' + p.a + ' peces</span><strong>÷</strong><span>' + p.b + ' pinguinos</span><strong>= igual</strong></div>';

        const pool = escena.querySelector(".m10-pool");
        const fila = escena.querySelector(".m10-pinguinos");
        const pinguinos = [];

        for (let i = 0; i < p.b; i++) {
            const unidad = document.createElement("div");
            unidad.className = "m10-pinguino";
            unidad.innerHTML =
                '<div class="m10-pinguino-cara">🐧</div>' +
                '<div class="m10-plato"><div class="m10-contador">0</div></div>';
            fila.appendChild(unidad);
            pinguinos.push({ unidad, plato: unidad.querySelector(".m10-plato"), lleno: false });
        }

        const paquetes = [];
        for (let i = 0; i < p.b; i++) {
            const paquete = crearPaquetePeces(p.resultado);
            pool.appendChild(paquete);
            paquetes.push(paquete);
        }

        let repartidos = 0;
        paquetes.forEach((paquete) => {
            activarArrastre(paquete, escena, (_ev, obj) => {
                for (const pg of pinguinos) {
                    if (centroDentro(obj, pg.plato) && !pg.lleno) {
                        colocar(obj, pg.plato);
                        pg.lleno = true;
                        repartidos++;
                        pg.plato.querySelector(".m10-contador").textContent = String(p.resultado);
                        pool.querySelector(".m10-contador").textContent = Math.max(0, p.a - repartidos * p.resultado) + " peces";
                        if (repartidos === p.b) accionCompletada();
                        return true;
                    }
                }
                return false;
            });
        });

        if (estado.modo === "practicar") {
            tutorialDivision(escena, paquetes[0], pinguinos);
            ayudaModo("La mano reparte paquetes iguales. Luego dale uno a cada pinguino.");
        } else {
            ayudaModo("Reparte un paquete igual a cada pinguino.");
        }
    }

    /* ---------- Comparar: mayor, menor o igual ---------- */
    function renderGrupoComparar(cantidad, icono) {
        const wrap = document.createElement("div");
        if (cantidad <= 6) {
            wrap.className = "m10-comparar-grid";
            for (let i = 0; i < cantidad; i++) {
                const s = document.createElement("span");
                s.textContent = icono;
                wrap.appendChild(s);
            }
        } else {
            wrap.className = "m10-comparar-grid";
            wrap.style.display = "flex";
            wrap.style.flexWrap = "wrap";
            wrap.style.gap = "4px";
            piezasCompactas(cantidad).forEach((v) => {
                wrap.appendChild(crearObjeto(icono, v));
            });
        }
        return wrap;
    }

    function renderComparar() {
        const p = estado.problema;
        const escena = $("m10Escena");
        escena.className = "m10-escena m10-escena-comparar";
        escena.innerHTML = '<div class="m10-escena-iconos">🔍 <span>¿Cual grupo tiene mas?</span></div><div class="m10-comparar-filas"></div>';

        const filas = escena.querySelector(".m10-comparar-filas");

        const cajaA = document.createElement("div");
        cajaA.className = "m10-comparar-caja";
        cajaA.appendChild(renderGrupoComparar(p.a, "⭐"));
        const numA = document.createElement("div");
        numA.className = "m10-comparar-numero";
        numA.textContent = String(p.a);
        cajaA.appendChild(numA);

        const vs = document.createElement("div");
        vs.className = "m10-comparar-vs";
        vs.textContent = "?";

        const cajaB = document.createElement("div");
        cajaB.className = "m10-comparar-caja";
        cajaB.appendChild(renderGrupoComparar(p.b, "🐠"));
        const numB = document.createElement("div");
        numB.className = "m10-comparar-numero";
        numB.textContent = String(p.b);
        cajaB.appendChild(numB);

        filas.append(cajaA, vs, cajaB);

        if (estado.modo === "practicar") {
            ayudaModo("Cuenta las dos cajas y elige el signo correcto.");
        } else {
            ayudaModo("¿Cual tiene mas? Elige rapido.");
        }

        accionCompletada();
    }

    /* ---------- Reacciones, sonido y celebracion ---------- */
    function mostrarReaccion(ok, texto) {
        const anteriorOk = document.querySelector(".m10-reaccion-ok");
        const anteriorMal = document.querySelector(".m10-reaccion-mal");
        if (anteriorOk) anteriorOk.remove();
        if (anteriorMal) anteriorMal.remove();

        const el = document.createElement("div");
        el.className = ok ? "m10-reaccion-ok" : "m10-reaccion-mal";
        el.innerHTML = '<div>' + (ok ? "🥳👏🏻" : "😅👀") + '</div><span>' + texto + '</span>';
        $("m10Escena").appendChild(el);

        if (!ok) {
            setTimeout(() => { if (el.parentNode) el.remove(); }, 1200);
        }
    }

    function mascotaReaccion(tipo) {
        [$("m10Mascota"), $("m10MascotaMini")].forEach((el) => {
            if (!el) return;
            el.classList.remove("m10-mascota-feliz", "m10-mascota-triste");
            void el.offsetWidth;
            if (tipo === "feliz") el.classList.add("m10-mascota-feliz");
            else if (tipo === "triste") el.classList.add("m10-mascota-triste");
        });
    }

    function obtenerAudioCtx() {
        if (!estado.audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) estado.audioCtx = new AC();
        }
        const ctx = estado.audioCtx;
        if (ctx && ctx.state === "suspended") {
            try { ctx.resume(); } catch (_) {}
        }
        return ctx;
    }

    function tono(frecuencia, duracionMs, retrasoMs, tipo, volumen) {
        const ctx = obtenerAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const inicio = ctx.currentTime + (retrasoMs / 1000);
        osc.type = tipo || "sine";
        osc.frequency.value = frecuencia;
        gain.gain.setValueAtTime(volumen || 0.14, inicio);
        gain.gain.exponentialRampToValueAtTime(0.001, inicio + (duracionMs / 1000));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + (duracionMs / 1000) + 0.05);
    }

    function reproducirSonidoCorrectoMat() {
        tono(523, 105, 0, "triangle", 0.14);
        tono(659, 110, 90, "triangle", 0.14);
        tono(880, 170, 180, "triangle", 0.16);
    }

    function reproducirSonidoIncorrectoMat() {
        tono(235, 115, 0, "sawtooth", 0.10);
        tono(175, 190, 105, "sawtooth", 0.11);
    }

    function vibrarError() {
        if (navigator.vibrate) {
            try { navigator.vibrate([180, 70, 180]); } catch (_) {}
        }
    }

    function destelloRojo() {
        const viejo = document.querySelector(".m10-destello-error");
        if (viejo) viejo.remove();
        const el = document.createElement("div");
        el.className = "m10-destello-error";
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
    }

    function destelloExito() {
        const viejo = document.querySelector(".m10-destello-exito");
        if (viejo) viejo.remove();
        const el = document.createElement("div");
        el.className = "m10-destello-exito";
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 950);
    }

    function confeti() {
        const viejo = document.querySelector(".m10-confeti");
        if (viejo) viejo.remove();

        const capa = document.createElement("div");
        capa.className = "m10-confeti";
        const colores = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

        for (let i = 0; i < 38; i++) {
            const p = document.createElement("i");
            p.className = "m10-confeti-pieza" + (i % 3 === 0 ? " m10-serpentina" : "");
            p.style.left = (Math.random() * 100) + "vw";
            p.style.background = colores[i % colores.length];
            p.style.animationDuration = (1.6 + Math.random() * 1.4) + "s";
            p.style.animationDelay = (Math.random() * 0.25) + "s";
            capa.appendChild(p);
        }

        document.body.appendChild(capa);
        setTimeout(() => { if (capa.parentNode) capa.remove(); }, 2700);
    }

    function celebrar() {
        destelloExito();
        confeti();
    }

    function feedback(clase, texto) {
        const el = $("m10Feedback");
        el.className = "m10-feedback " + clase;
        el.textContent = texto;
    }

    function fallo(texto) {
        feedback("m10-feedback-mal", texto || "Intenta otra vez.");
        mostrarReaccion(false, texto || "Intenta otra vez.");
        mascotaReaccion("triste");
        reproducirSonidoIncorrectoMat();
        vibrarError();
        destelloRojo();
    }

    function accionCompletada() {
        if (estado.respondida) return;
        feedback("m10-feedback-info", estado.modo === "practicar" ? "Ahora elige la respuesta." : "Elige la respuesta.");
        mostrarRespuestas();
    }

    /* ---------- Opciones de respuesta ---------- */
    function opcionesRespuestaNumericas(correcto) {
        const valores = [correcto];
        const amplitud = Math.max(2, Math.round(correcto * 0.18));
        let intentos = 0;
        while (valores.length < 3 && intentos < 100) {
            intentos++;
            const v = Math.max(0, correcto + randInt(-amplitud, amplitud));
            if (!valores.includes(v)) valores.push(v);
        }
        return barajar(valores).map((v) => ({ valor: v, texto: String(v) }));
    }

    function opcionesRespuestaComparar() {
        return barajar([
            { valor: "<", texto: "<" },
            { valor: ">", texto: ">" },
            { valor: "=", texto: "=" }
        ]);
    }

    function mostrarRespuestas() {
        const cont = $("m10Respuestas");
        if (cont.querySelector(".m10-respuestas")) return;

        const esComparar = estado.operacion === "comparar";
        const correcto = estado.problema.resultado;
        const opciones = esComparar ? opcionesRespuestaComparar() : opcionesRespuestaNumericas(correcto);

        const fila = document.createElement("div");
        fila.className = "m10-respuestas";

        opciones.forEach((op) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "m10-respuesta";
            btn.textContent = op.texto;

            btn.addEventListener("click", () => {
                if (estado.respondida) return;

                if (op.valor === correcto) {
                    estado.respondida = true;
                    detenerTimer();
                    btn.classList.add("m10-correcta");
                    fila.querySelectorAll("button").forEach((b) => { b.disabled = true; });

                    if (esComparar) {
                        const vs = document.querySelector("#m10Escena .m10-comparar-vs");
                        if (vs) vs.textContent = String(op.valor);
                    } else {
                        const r = $("m10Resultado");
                        if (r) { r.textContent = String(op.valor); r.classList.add("m10-eq-lista"); }
                    }

                    sumarEstrella();
                    estado.puntaje++;
                    feedback("m10-feedback-bien", "¡Muy bien!");
                    mostrarReaccion(true, "¡Muy bien!");
                    mascotaReaccion("feliz");
                    reproducirSonidoCorrectoMat();
                    celebrar();
                    $("m10Siguiente").classList.remove("m10-oculto");
                } else {
                    btn.classList.add("m10-incorrecta");
                    fallo("Observa otra vez.");
                }
            });

            fila.appendChild(btn);
        });

        cont.appendChild(fila);
    }

    /* ---------- Estrellas de la ronda actual ---------- */
    function sumarEstrella() {
        estado.estrellasRonda[estado.pregunta - 1] = true;
        pintarEstrellasRonda();
        sumarEstrellasTotales(1);
        pintarEstrellasTotales();
    }

    function pintarEstrellasRonda() {
        const cont = $("m10EstrellasRonda");
        if (!cont) return;
        cont.innerHTML = "";
        for (let i = 0; i < 5; i++) {
            const s = document.createElement("span");
            s.className = "m10-estrella" + (estado.estrellasRonda[i] ? " m10-ganada" : "");
            s.textContent = "⭐";
            cont.appendChild(s);
        }
    }

    /* ---------- Cuenta regresiva y temporizador (modo Jugar) ---------- */
    function mostrarCuentaRegresiva(n) {
        let overlay = $("m10CuentaRegresiva");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "m10CuentaRegresiva";
            overlay.className = "m10-cuenta-regresiva";
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = '<div class="m10-cuenta-numero' + (n <= 3 ? " m10-urgente" : "") + '">' + n + '</div>';
    }

    function ocultarCuentaRegresiva() {
        const overlay = $("m10CuentaRegresiva");
        if (overlay) overlay.remove();
    }

    function detenerTimer() {
        if (estado.timerId) {
            clearInterval(estado.timerId);
            estado.timerId = null;
        }
        ocultarCuentaRegresiva();
    }

    function iniciarTimer() {
        detenerTimer();
        const wrap = $("m10TimerWrap");
        const barra = $("m10Timer");

        if (estado.modo !== "jugar") {
            wrap.classList.add("m10-oculto");
            return;
        }

        wrap.classList.remove("m10-oculto");
        barra.style.background = "#22c55e";
        const base = estado.operacion === "comparar" ? 12 : (estado.nivel === 1 ? 18 : estado.nivel === 2 ? 22 : 28);
        estado.tiempoMax = base;
        estado.tiempoRestante = base;
        barra.style.width = "100%";

        estado.timerId = setInterval(() => {
            estado.tiempoRestante--;
            barra.style.width = Math.max(0, estado.tiempoRestante / estado.tiempoMax * 100) + "%";

            if (estado.tiempoRestante <= 6) barra.style.background = "#f97316";
            if (estado.tiempoRestante <= 3) barra.style.background = "#dc2626";

            if (estado.tiempoRestante <= 5 && estado.tiempoRestante >= 1) {
                mostrarCuentaRegresiva(estado.tiempoRestante);
            } else if (estado.tiempoRestante > 5) {
                ocultarCuentaRegresiva();
            }

            if (estado.tiempoRestante <= 0) {
                detenerTimer();
                $("m10Respuestas").innerHTML = "";
                fallo("Se acabo el tiempo.");
                $("m10Siguiente").classList.remove("m10-oculto");
            }
        }, 1000);
    }

    function limpiarPregunta() {
        estado.tutorialActivo = false;
        estado.respondida = false;
        $("m10Respuestas").innerHTML = "";
        $("m10Feedback").innerHTML = "";
        $("m10Feedback").className = "";
        $("m10Siguiente").classList.add("m10-oculto");
    }

    function siguientePregunta() {
        detenerTimer();
        estado.pregunta++;

        if (estado.pregunta > 5) {
            finalizar();
            return;
        }

        estado.problema = generarProblema();
        limpiarPregunta();

        $("m10Barra").style.width = ((estado.pregunta - 1) / 5 * 100) + "%";
        pintarEstrellasRonda();

        renderizarPrompt();

        if (estado.operacion === "suma") renderSuma();
        else if (estado.operacion === "resta") renderResta();
        else if (estado.operacion === "multiplicacion") renderMultiplicacion();
        else if (estado.operacion === "division") renderDivision();
        else renderComparar();

        iniciarTimer();
    }

    function finalizar() {
        detenerTimer();
        estado.finalizada = true;
        $("m10Barra").style.width = "100%";
        $("m10Prompt").innerHTML = "";

        const totalGanadas = estado.estrellasRonda.filter(Boolean).length;
        const estrellasTexto = "⭐".repeat(totalGanadas) + "☆".repeat(5 - totalGanadas);
        const trofeo = totalGanadas >= 4 ? "🏆" : totalGanadas >= 2 ? "🎉" : "💪";

        $("m10Escena").className = "m10-escena";
        $("m10Escena").innerHTML =
            '<div class="m10-fin">' +
                '<div class="m10-fin-trofeo">' + trofeo + '</div>' +
                '<h3>' + totalGanadas + ' de 5</h3>' +
                '<p>Ronda terminada</p>' +
                '<div class="m10-fin-estrellas">' + estrellasTexto + '</div>' +
                '<div class="m10-fin-total">⭐ ' + leerEstrellasTotales() + ' en total</div>' +
            '</div>';
        $("m10Respuestas").innerHTML = "";
        $("m10Feedback").innerHTML = "";
        $("m10TimerWrap").classList.add("m10-oculto");
        mascotaReaccion(totalGanadas >= 3 ? "feliz" : null);
        celebrar();

        const siguiente = $("m10Siguiente");
        siguiente.textContent = "Volver al menu";
        siguiente.classList.remove("m10-oculto");
    }

    /* ---------- API publica ---------- */
    function iniciar() {
        if (!asegurarUI()) return;
        detenerTimer();
        estado.operacion = null;
        estado.pregunta = 0;
        estado.puntaje = 0;
        estado.respondida = false;
        mostrarMenu();
    }

    function salir() {
        detenerTimer();
        ocultarCuentaRegresiva();
        estado.tutorialActivo = false;
        estado.operacion = null;
        estado.pregunta = 0;
        if (asegurarUI()) mostrarMenu();
    }

    function restaurarHistorial(pantalla, operacion) {
        if (!asegurarUI()) return;

        detenerTimer();
        estado.tutorialActivo = false;

        if (pantalla === "partida" && OPS[operacion]) {
            iniciarPartida(operacion, { sinHistorial: true });
            return;
        }

        mostrarMenu();
    }

    return { iniciar, salir, restaurarHistorial };
})();

window.MatematicasV2 = MatematicasV2;

/* ============================================================
   HISTORIAL INTERNO DE HERRAMIENTAS > JUGAR
   ------------------------------------------------------------
   Sin cambios: este modulo es compartido por TODOS los juegos de
   Herramientas > Jugar (Completar, Unir, Quiz y Matematicas), no
   solo por Matematicas, asi que se mantiene exactamente igual.

   El boton/gesto Atras del celular retrocede una pantalla:
   partida Matematicas -> menu Matematicas -> menu de juegos -> Herramientas.
   Los otros juegos tambien vuelven primero al menu de juegos.

   El listener popstate usa CAPTURA para resolver las pantallas internas
   de Jugar antes que el router general de script.js. Solo intercepta
   cuando el destino continua dentro de ?vista=herramientas-jugar.
   Si el destino ya es Herramientas u otra seccion, deja actuar al router
   principal normalmente.
   ============================================================ */
const HistorialJuegosLSPedia = (function () {
    "use strict";

    let restaurando = false;
    let listenersListos = false;

    const BOTONES = {
        completar: "btnMenuJuegoCompletar",
        unir: "btnMenuJuegoUnir",
        quiz: "btnMenuJuegoQuiz",
        matematicas: "btnMenuJuegoMatematicas"
    };

    const PANTALLAS = [
        "quizMenuJuegos", "quizCargando", "quizIntro", "quizActivo", "quizMemoria", "quizResultados",
        "alfabCompletar", "alfabUnir", "alfabResultados", "matApp"
    ];

    function construirUrl(juego, pantalla, operacion, extra = {}) {
        const url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set("vista", "herramientas-jugar");
        if (juego) url.searchParams.set("juego", juego);
        if (pantalla && pantalla !== "menu") url.searchParams.set("pantalla", pantalla);
        if (operacion) url.searchParams.set("op", operacion);
        Object.entries(extra || {}).forEach(([k,v]) => {
            if(v !== undefined && v !== null && String(v) !== "") url.searchParams.set(k,String(v));
        });
        return url.pathname + "?" + url.searchParams.toString();
    }

    function registrar(url, estado) {
        if (restaurando) return;
        const actual = window.location.pathname + window.location.search;
        if (actual === url) window.history.replaceState(estado, "", url);
        else window.history.pushState(estado, "", url);
    }

    function registrarJuego(juego, pantalla = "menu", extra = {}) {
        registrar(
            construirUrl(juego, pantalla, "", extra),
            { tipo: "juego", vista: "herramientas-jugar", juego, pantalla, ...extra }
        );
    }

    function registrarPantallaMatematicas(pantalla, operacion) {
        registrar(
            construirUrl("matematicas", pantalla, operacion),
            {
                tipo: "juego-matematicas",
                vista: "herramientas-jugar",
                juego: "matematicas",
                pantalla,
                operacion
            }
        );
    }

    function jugarEstaVisible() {
        const seccion = document.getElementById("seccionQuiz");
        return !!(seccion && !seccion.classList.contains("d-none"));
    }

    function ocultarPantallas() {
        PANTALLAS.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.classList.add("d-none");
        });
    }

    function mostrarMenuJuegosSinHistorial() {
        if (window.QuizV2 && typeof QuizV2.salir === "function") QuizV2.salir();
        if (window.AlfabetizacionV2 && typeof AlfabetizacionV2.detenerJuegosActivos === "function") {
            AlfabetizacionV2.detenerJuegosActivos();
        }
        if (window.MatematicasV2 && typeof MatematicasV2.salir === "function") {
            MatematicasV2.salir();
        }

        if (document.fullscreenElement && document.exitFullscreen) {
            Promise.resolve(document.exitFullscreen()).catch(() => {});
        }

        ocultarPantallas();
        const menu = document.getElementById("quizMenuJuegos");
        if (menu) menu.classList.remove("d-none");
    }

    function abrirJuegoSinRegistrar(juego) {
        const id = BOTONES[juego];
        const btn = id && document.getElementById(id);
        if (btn) btn.click();
    }

    function restaurarJuegoDesdeParametros(params) {
        const juego = params.get("juego");
        if (!juego || !BOTONES[juego]) {
            mostrarMenuJuegosSinHistorial();
            return;
        }

        abrirJuegoSinRegistrar(juego);

        if (juego === "matematicas" &&
            window.MatematicasV2 &&
            typeof MatematicasV2.restaurarHistorial === "function") {
            MatematicasV2.restaurarHistorial(
                params.get("pantalla") || "menu",
                params.get("op") || ""
            );
        }
    }

    function restaurarDesdeUrl() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("vista") !== "herramientas-jugar") return;

        restaurando = true;
        try {
            restaurarJuegoDesdeParametros(params);
        } finally {
            restaurando = false;
        }
    }

    function manejarPopstateInterno() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("vista") !== "herramientas-jugar") return;

    // script.js se carga antes que matematicas.js. Dejamos que el
    // router general reconstruya Herramientas > Jugar y despues
    // restauramos la pantalla interna exacta indicada por la URL.
    setTimeout(() => {
        const actuales = new URLSearchParams(window.location.search);
        if (actuales.get("vista") !== "herramientas-jugar") return;
        restaurando = true;
        try {
            restaurarJuegoDesdeParametros(actuales);
        } finally {
            restaurando = false;
        }
    }, 0);
}

    function volverAlMenuJuegosDesdeBoton() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("vista") === "herramientas-jugar" && params.get("juego") && window.history.length > 1) {
            // Un solo paso: partida -> menu del juego -> Jugar -> Herramientas.
            window.history.back();
            return;
        }
        window.history.replaceState(
            { tipo: "jugar", vista: "herramientas-jugar" },
            "",
            construirUrl()
        );
        mostrarMenuJuegosSinHistorial();
    }

    function enlazar() {
        if (listenersListos) return;
        listenersListos = true;

        Object.entries(BOTONES).forEach(([juego, id]) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            btn.addEventListener("click", () => {
                if (!restaurando) registrarJuego(juego);
            });
        });

        window.addEventListener("popstate", manejarPopstateInterno);

        setTimeout(restaurarDesdeUrl, 0);
        setTimeout(restaurarDesdeUrl, 900);
    }

    enlazar();

    return {
        registrarJuego,
        registrarPantallaMatematicas,
        restaurarDesdeUrl,
        volverAlMenuJuegosDesdeBoton
    };
})();

window.HistorialJuegosLSPedia = HistorialJuegosLSPedia;
