/* ============================================================
   LSPedia - Matemáticas Visuales V9 integrada
   ------------------------------------------------------------
   Se integra dentro de Herramientas > Jugar y conserva la API
   pública esperada por js/script.js:
       MatematicasV2.iniciar()
       MatematicasV2.salir()

   En Practicar aparece primero una guía visual con una mano.
   En Jugar no hay tutorial y se usa tiempo + cuenta regresiva.
   ============================================================ */

const MatematicasV2 = (function () {
    "use strict";

    const OPS = {
        suma: { nombre: "Sumar", simbolo: "+", color: "#2563eb", colorSegundo: "#2563eb", clase: "matv9-suma" },
        resta: { nombre: "Restar", simbolo: "−", color: "#f97316", colorSegundo: "#f97316", clase: "matv9-resta" },
        multiplicacion: { nombre: "Multiplicar", simbolo: "×", color: "#8b5cf6", colorSegundo: "#8b5cf6", clase: "matv9-multiplicacion" },
        division: { nombre: "Dividir", simbolo: "÷", color: "#0ea5e9", colorSegundo: "#0891b2", clase: "matv9-division" }
    };

    const NIVELES = [
        { n: 1, etiqueta: "Nivel 1", corto: "1–5", min: 1, max: 5, ayuda: "Cantidades pequeñas · más apoyo visual" },
        { n: 2, etiqueta: "Nivel 2", corto: "1 cifra", min: 1, max: 9, ayuda: "Hasta 9 · menos ayuda" },
        { n: 3, etiqueta: "Nivel 3", corto: "2 cifras", min: 10, max: 39, ayuda: "Decenas y unidades" },
        { n: 4, etiqueta: "Nivel 4", corto: "2 cifras +", min: 20, max: 99, ayuda: "Más números · menos apoyo" },
        { n: 5, etiqueta: "Nivel 5", corto: "3 cifras", min: 100, max: 299, ayuda: "Centenas, decenas y unidades" }
    ];

    const TEXTO_MODO = {
        practicar: "Primero mira la mano guía. Después haz la operación y elige el resultado.",
        jugar: "Sin tutorial. Resuelve antes de que termine el tiempo."
    };

    const LS_NIVEL = "lspedia_mat_v9_nivel";
    const LS_MODO = "lspedia_mat_v9_modo";

    const estado = {
        operacion: null,
        modo: "practicar",
        nivel: 1,
        pregunta: 0,
        puntaje: 0,
        problema: null,
        timerId: null,
        tiempoRestante: 0,
        tiempoMax: 18,
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

    function cargarPreferencias() {
        try {
            const nivel = parseInt(localStorage.getItem(LS_NIVEL), 10);
            if (nivel >= 1 && nivel <= 5) estado.nivel = nivel;
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

    function construirUI() {
        root = $("matApp");
        menu = $("matMenu");
        juego = $("matJuego");
        if (!root || !menu || !juego) return false;

        menu.innerHTML = `
            <div class="matv9-card matv9-menu-principal">
                <div class="matv9-menu-encabezado">
                    <div>
                        <h3 class="matv9-titulo">Matemáticas</h3>
                        <p class="matv9-subtitulo">Toca, arrastra y relaciona cantidad, número y símbolo.</p>
                    </div>
                    <span class="matv9-menu-icono" aria-hidden="true">🔢</span>
                </div>

                <div class="matv9-operaciones">
                    <button type="button" class="matv9-op matv9-op-suma" data-mat-op="suma" aria-label="Sumar">
                        <span class="matv9-op-simbolo">+</span><span>Sumar</span>
                    </button>
                    <button type="button" class="matv9-op matv9-op-resta" data-mat-op="resta" aria-label="Restar">
                        <span class="matv9-op-simbolo">−</span><span>Restar</span>
                    </button>
                    <button type="button" class="matv9-op matv9-op-mult" data-mat-op="multiplicacion" aria-label="Multiplicar">
                        <span class="matv9-op-simbolo">×</span><span>Multiplicar</span>
                    </button>
                    <button type="button" class="matv9-op matv9-op-div" data-mat-op="division" aria-label="Dividir">
                        <span class="matv9-op-simbolo">÷</span><span>Dividir</span>
                    </button>
                </div>
            </div>

            <div class="matv9-card">
                <div class="matv9-seccion-titulo">Modo</div>
                <div class="matv9-modos">
                    <button type="button" class="matv9-modo" data-mat-modo="practicar">✋<span>Practicar</span></button>
                    <button type="button" class="matv9-modo" data-mat-modo="jugar">🎮<span>Jugar</span></button>
                </div>
                <p id="matv9ModoAyuda" class="matv9-nota"></p>
            </div>

            <div class="matv9-card">
                <div class="matv9-seccion-titulo">Nivel</div>
                <div id="matv9Niveles" class="matv9-niveles"></div>
                <p id="matv9NivelAyuda" class="matv9-nota"></p>
            </div>
        `;

        juego.innerHTML = `
            <div class="matv9-juego-top">
                <button type="button" id="matv9Volver" class="matv9-volver" aria-label="Volver">←</button>
                <div id="matv9TituloJuego" class="matv9-juego-titulo"></div>
                <div id="matv9ModoPill" class="matv9-modo-pill"></div>
            </div>

            <div class="matv9-progreso"><div id="matv9Barra"></div></div>
            <div id="matv9TimerWrap" class="matv9-timer-wrap matv9-oculto"><div id="matv9Timer" class="matv9-timer"></div></div>

            <div class="matv9-card matv9-juego-card">
                <div class="matv9-info">
                    <div id="matv9Score">⭐ 0 · Pregunta 1 de 5</div>
                    <div id="matv9AyudaJuego"></div>
                </div>
                <div id="matv9Ecuacion" class="matv9-ecuacion"></div>
                <div id="matv9Escena" class="matv9-escena"></div>
                <div id="matv9Respuestas"></div>
                <div id="matv9Feedback"></div>
                <button type="button" id="matv9Siguiente" class="matv9-siguiente matv9-oculto">Siguiente →</button>
            </div>
        `;

        enlazarUI();
        renderizarNiveles();
        renderizarModo();
        estado.uiLista = true;
        return true;
    }

    function asegurarUI() {
        if (estado.uiLista && $("matv9Escena") && $("matv9Niveles")) return true;
        cargarPreferencias();
        return construirUI();
    }

    function enlazarUI() {
        menu.querySelectorAll("[data-mat-op]").forEach((btn) => {
            btn.addEventListener("click", () => iniciarPartida(btn.dataset.matOp));
        });

        menu.querySelectorAll("[data-mat-modo]").forEach((btn) => {
            btn.addEventListener("click", () => {
                estado.modo = btn.dataset.matModo;
                guardarPreferencias();
                renderizarModo();
            });
        });

        $("matv9Volver").addEventListener("click", volverMenu);
        $("matv9Siguiente").addEventListener("click", () => {
            if (estado.finalizada) {
                estado.finalizada = false;
                $("matv9Siguiente").textContent = "Siguiente →";
                volverMenu();
            } else {
                siguientePregunta();
            }
        });
    }

    function renderizarModo() {
        if (!menu) return;
        menu.querySelectorAll("[data-mat-modo]").forEach((btn) => {
            btn.classList.toggle("matv9-activo", btn.dataset.matModo === estado.modo);
        });
        const ayuda = $("matv9ModoAyuda");
        if (ayuda) ayuda.textContent = TEXTO_MODO[estado.modo];
    }

    function renderizarNiveles() {
        const cont = $("matv9Niveles");
        if (!cont) return;
        cont.innerHTML = "";
        NIVELES.forEach((n) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "matv9-nivel" + (n.n === estado.nivel ? " matv9-activo" : "");
            btn.innerHTML = `<span>${n.etiqueta}</span><small>${n.corto}</small>`;
            btn.addEventListener("click", () => {
                estado.nivel = n.n;
                guardarPreferencias();
                renderizarNiveles();
            });
            cont.appendChild(btn);
        });
        const ayuda = $("matv9NivelAyuda");
        if (ayuda) ayuda.textContent = NIVELES[estado.nivel - 1].ayuda;
    }

    function mostrarMenu() {
        detenerTimer();
        ocultarCuentaRegresiva();
        menu.classList.add("mat-pantalla-activa");
        juego.classList.remove("mat-pantalla-activa");
        renderizarModo();
        renderizarNiveles();
        estado.finalizada = false;
        const siguiente = $("matv9Siguiente");
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
        estado.respondida = false;
        estado.finalizada = false;
        if (!opciones.sinHistorial && window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarPantallaMatematicas === "function") {
            HistorialJuegosLSPedia.registrarPantallaMatematicas("partida", operacion);
        }
        mostrarJuego();
        $("matv9TituloJuego").textContent = OPS[operacion].nombre + " · Nivel " + estado.nivel;
        $("matv9ModoPill").textContent = estado.modo === "practicar" ? "Practicar" : "Jugar";
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

    function generarProblema() {
        const nivel = NIVELES[estado.nivel - 1];
        const op = estado.operacion;

        if (op === "suma") {
            if (estado.nivel <= 2) {
                const a = randInt(1, nivel.max);
                const b = randInt(1, nivel.max);
                return { a, b, resultado: a + b };
            }
            const a = randInt(nivel.min, nivel.max);
            const b = randInt(estado.nivel === 3 ? 10 : 20, Math.min(nivel.max, estado.nivel === 5 ? 180 : 60));
            return { a, b, resultado: a + b };
        }

        if (op === "resta") {
            if (estado.nivel <= 2) {
                const a = randInt(3, nivel.max);
                const b = randInt(1, a - 1);
                return { a, b, resultado: a - b };
            }
            let a = randInt(nivel.min, nivel.max);
            // Evita números completamente redondos, porque con bloques
            // 100/10/1 no habría una resta visual interesante sin préstamo.
            if (a > 9 && a % 100 === 0) a += randInt(1, 9);
            const b = generarRestaSinPrestamo(a);
            return { a, b, resultado: a - b };
        }

        if (op === "multiplicacion") {
            // En niveles altos NO se arrastran decenas de cajas una por una:
            // cada pieza representa un grupo completo para mantener el juego fluido.
            const grupos = estado.nivel === 1 ? randInt(2, 4)
                : estado.nivel === 2 ? randInt(2, 5)
                : estado.nivel === 3 ? randInt(3, 6)
                : randInt(4, 8);
            const cada = estado.nivel === 1 ? randInt(1, 3)
                : estado.nivel === 2 ? randInt(2, 8)
                : estado.nivel === 3 ? randInt(5, 15)
                : estado.nivel === 4 ? randInt(10, 30)
                : randInt(20, 60);
            return { a: grupos, b: cada, resultado: grupos * cada };
        }

        // División: el divisor es el número de pingüinos. En niveles altos
        // cada pingüino recibe un paquete igual, evitando arrastrar cientos
        // de peces uno por uno y permitiendo resultados de 2-3 cifras.
        const grupos = estado.nivel === 1 ? randInt(2, 3)
            : estado.nivel === 2 ? randInt(2, 4)
            : estado.nivel === 3 ? randInt(3, 5)
            : randInt(4, 8);
        const cada = estado.nivel === 1 ? randInt(1, 3)
            : estado.nivel === 2 ? randInt(2, 8)
            : estado.nivel === 3 ? randInt(5, 15)
            : estado.nivel === 4 ? randInt(10, 30)
            : randInt(20, 60);
        return { a: grupos * cada, b: grupos, resultado: cada };
    }

    function renderizarEcuacion() {
        const p = estado.problema;
        const op = OPS[estado.operacion];
        $("matv9Ecuacion").innerHTML =
            `<span class="matv9-eq-a">${p.a}</span>` +
            `<span class="matv9-eq-op" style="background:${op.color}">${op.simbolo}</span>` +
            `<span class="matv9-eq-b" style="color:${op.colorSegundo}">${p.b}</span>` +
            `<span class="matv9-eq-igual">=</span>` +
            `<span class="matv9-eq-r" id="matv9Resultado">?</span>`;
    }

    function crearObjeto(icono, valor = 1) {
        const el = document.createElement("div");
        el.className = "matv9-objeto";
        el.dataset.valor = String(valor);
        if (valor === 1) {
            el.textContent = icono;
        } else {
            el.classList.add("matv9-objeto-bloque");
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
        const c = zona.querySelector(".matv9-contador");
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
        el.classList.add("matv9-colocado");
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

            escena.appendChild(el);
            el.classList.add("matv9-arrastrando");
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
                el.classList.remove("matv9-arrastrando");

                const aceptado = onDrop(ev, el);
                if (!aceptado) {
                    if (siguiente) padre.insertBefore(el, siguiente);
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

    function mostrarBadgeTutorial(escena) {
        const badge = document.createElement("div");
        badge.className = "matv9-tutorial-badge";
        badge.innerHTML = "👀 <span>Guía visual</span>";
        escena.insertBefore(badge, escena.firstChild);
    }

    function mostrarAhoraTu(escena) {
        const el = document.createElement("div");
        el.className = "matv9-ahora-tu";
        el.innerHTML = "✋ <span>Ahora tú</span>";
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
            fantasma.classList.remove("matv9-arrastrando", "matv9-colocado");
            fantasma.classList.add("matv9-tutorial-fantasma");
            fantasma.style.width = rOrigen.width + "px";
            fantasma.style.height = rOrigen.height + "px";
        } else {
            fantasma = document.createElement("div");
            fantasma.className = "matv9-tutorial-fantasma" + (opciones.paquete ? " matv9-tutorial-paquete" : "");
            fantasma.textContent = contenido;
        }

        const mano = document.createElement("div");
        mano.className = "matv9-tutorial-mano";
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

        destino.classList.add("matv9-tutorial-destino");

        requestAnimationFrame(() => {
            fantasma.classList.add("matv9-tutorial-mover");
            mano.classList.add("matv9-tutorial-mover");
            fantasma.style.transform = `translate(${tx - sx}px, ${ty - sy}px)`;
            mano.style.transform = `translate(${tx - sx}px, ${ty - sy}px)`;
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                fantasma.remove();
                mano.remove();
                destino.classList.remove("matv9-tutorial-destino");
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
        const svg = $("matv9Leon");
        if (svg) {
            svg.setAttribute("class", "matv9-leon-svg matv9-leon-neutral");
            setTimeout(() => {
                if (svg) svg.setAttribute("class", "matv9-leon-svg matv9-leon-enojado");
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
            vagones[i].zona.classList.add("matv9-foco");
            await tutorialMover(escena, grupo, vagones[i].zona, "", { clonar: true });
            vagones[i].zona.classList.remove("matv9-foco");
        }

        estado.tutorialActivo = false;
        mostrarAhoraTu(escena);
    }

    async function tutorialDivision(escena, paquete, pinguinos) {
        if (estado.modo !== "practicar" || !paquete) return;
        estado.tutorialActivo = true;
        mostrarBadgeTutorial(escena);

        for (let i = 0; i < Math.min(pinguinos.length, 4); i++) {
            pinguinos[i].unidad.classList.add("matv9-foco");
            await tutorialMover(escena, paquete, pinguinos[i].plato, "", { clonar: true });
            pinguinos[i].unidad.classList.remove("matv9-foco");
        }

        estado.tutorialActivo = false;
        mostrarAhoraTu(escena);
    }

    function ayudaModo(texto) {
        const d = document.createElement("div");
        d.className = estado.modo === "practicar" ? "matv9-ayuda matv9-ayuda-practica" : "matv9-ayuda matv9-ayuda-juego";
        d.innerHTML = `<span>${estado.modo === "practicar" ? "✋" : "🎮"}</span><span>${texto}</span>`;
        $("matv9Escena").appendChild(d);
    }

    function renderSuma() {
        const p = estado.problema;
        const escena = $("matv9Escena");
        escena.className = "matv9-escena matv9-suma";
        escena.innerHTML =
            `<div class="matv9-iconos">🍎 <span class="matv9-flecha">➜</span> 🧺</div>` +
            `<div class="matv9-zonas"></div>` +
            `<div class="matv9-flujo"><span>${p.a}</span><b class="matv9-azul">+</b><b class="matv9-azul">${p.b}</b><i>→</i><strong id="matv9SumaTotal">${p.a}</strong></div>`;

        const zonas = escena.querySelector(".matv9-zonas");

        const cesta = document.createElement("div");
        cesta.className = "matv9-zona matv9-destino";
        cesta.innerHTML = `<div class="matv9-contador">${p.a}</div>`;

        const fuente = document.createElement("div");
        fuente.className = "matv9-zona matv9-fuente-b";
        fuente.innerHTML = `<div class="matv9-contador matv9-azul">${p.b}</div>`;

        zonas.append(cesta, fuente);

        piezasCompactas(p.a).forEach((v) => {
            const o = crearObjeto("🍎", v);
            o.dataset.bloqueado = "1";
            o.classList.add("matv9-base");
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
                $("matv9SumaTotal").textContent = String(p.a + agregado);
                if (agregado === p.b) accionCompletada();
                return true;
            });
        });

        if (estado.modo === "practicar") {
            tutorialSuma(escena, movibles[0] && movibles[0].el, cesta);
            ayudaModo("Mira cómo la mano lleva la cantidad azul a la cesta. Después hazlo tú.");
        } else {
            ayudaModo("Junta rápido la cantidad azul con la cantidad inicial.");
        }
    }

    function estadoLeon(comido, necesita) {
        if (comido === 0) return "matv9-leon-enojado";
        if (comido < necesita) return "matv9-leon-neutral";
        return "matv9-leon-feliz";
    }

    function svgLeon() {
        return `
        <svg viewBox="0 0 180 180" class="matv9-leon-svg matv9-leon-enojado" id="matv9Leon" role="img" aria-label="León hambriento">
            <g class="matv9-melena">
                <circle cx="90" cy="90" r="72"/>
                <circle cx="90" cy="16" r="18"/><circle cx="132" cy="28" r="18"/>
                <circle cx="160" cy="60" r="18"/><circle cx="164" cy="100" r="18"/>
                <circle cx="146" cy="138" r="18"/><circle cx="110" cy="160" r="18"/>
                <circle cx="70" cy="160" r="18"/><circle cx="34" cy="138" r="18"/>
                <circle cx="16" cy="100" r="18"/><circle cx="20" cy="60" r="18"/>
                <circle cx="48" cy="28" r="18"/>
            </g>
            <circle class="matv9-oreja-ext" cx="54" cy="48" r="16"/><circle class="matv9-oreja-ext" cx="126" cy="48" r="16"/>
            <circle class="matv9-oreja-int" cx="54" cy="48" r="8"/><circle class="matv9-oreja-int" cx="126" cy="48" r="8"/>
            <circle class="matv9-cara" cx="90" cy="92" r="54"/>
            <ellipse class="matv9-hocico" cx="90" cy="112" rx="30" ry="23"/>
            <line class="matv9-ceja matv9-ceja-i" x1="64" y1="74" x2="84" y2="68"/>
            <line class="matv9-ceja matv9-ceja-d" x1="96" y1="68" x2="116" y2="74"/>
            <circle class="matv9-ojo matv9-ojo-i" cx="74" cy="84" r="6"/>
            <circle class="matv9-ojo matv9-ojo-d" cx="106" cy="84" r="6"/>
            <path class="matv9-ojo-feliz" d="M67 84 Q74 78 81 84"/>
            <path class="matv9-ojo-feliz" d="M99 84 Q106 78 113 84"/>
            <path class="matv9-nariz" d="M82 100 Q90 94 98 100 Q97 107 90 109 Q83 107 82 100 Z"/>
            <g class="matv9-boca-abierta">
                <ellipse cx="90" cy="123" rx="18" ry="16"/>
                <ellipse class="matv9-lengua" cx="90" cy="132" rx="10" ry="6"/>
                <rect class="matv9-diente" x="80" y="113" width="6" height="7" rx="2"/>
                <rect class="matv9-diente" x="94" y="113" width="6" height="7" rx="2"/>
            </g>
            <path class="matv9-boca-neutral" d="M80 126 Q90 132 100 126"/>
            <path class="matv9-boca-feliz" d="M76 122 Q90 138 104 122"/>
        </svg>`;
    }

    function renderResta() {
        const p = estado.problema;
        const escena = $("matv9Escena");
        escena.className = "matv9-escena matv9-resta";
        escena.innerHTML =
            `<div class="matv9-iconos">🥩 <span class="matv9-flecha">➜</span> 🦁</div>` +
            `<div class="matv9-zonas"></div>` +
            `<div class="matv9-flujo"><span>${p.a}</span><b class="matv9-naranja">−</b><b class="matv9-naranja">${p.b}</b><i>→</i><strong id="matv9RestaQueda">${p.a}</strong></div>`;

        const zonas = escena.querySelector(".matv9-zonas");

        const bandeja = document.createElement("div");
        bandeja.className = "matv9-zona matv9-fuente-a";
        bandeja.innerHTML = `<div class="matv9-contador">${p.a}</div>`;

        const leon = document.createElement("div");
        leon.className = "matv9-zona matv9-leon-zona";
        leon.innerHTML = `<div class="matv9-contador matv9-naranja">0</div><div class="matv9-leon-box">${svgLeon()}</div>`;

        zonas.append(bandeja, leon);

        const piezas = [];
        piezasCompactas(p.a).forEach((v) => {
            const o = crearObjeto("🥩", v);
            bandeja.appendChild(o);
            piezas.push({ el: o, valor: v });
        });

        let comido = 0;
        piezas.forEach(({ el, valor }) => {
            activarArrastre(el, escena, (_ev, obj) => {
                if (!centroDentro(obj, leon)) return false;
                if (comido + valor > p.b) {
                    fallo("Demasiado.");
                    return false;
                }

                comido += valor;
                leon.querySelector(".matv9-contador").textContent = String(comido);
                bandeja.querySelector(".matv9-contador").textContent = String(p.a - comido);
                $("matv9RestaQueda").textContent = String(p.a - comido);

                const svg = $("matv9Leon");
                if (svg) {
                    svg.setAttribute("class", "matv9-leon-svg " + estadoLeon(comido, p.b) + " matv9-leon-mordisco");
                    setTimeout(() => {
                        if (svg) svg.setAttribute("class", "matv9-leon-svg " + estadoLeon(comido, p.b));
                    }, 340);
                }

                obj.remove();

                if (comido === p.b) accionCompletada();
                return true;
            });
        });

        if (estado.modo === "practicar") {
            tutorialResta(escena, piezas[0] && piezas[0].el, leon);
            ayudaModo("Mira la mano. Luego alimenta al león hasta que se calme.");
        } else {
            ayudaModo("Alimenta al león con la cantidad correcta antes de que termine el tiempo.");
        }
    }

    function crearGrupoCajas(cantidad) {
        const grupo = document.createElement("div");
        grupo.className = "matv9-grupo-cajas";
        grupo.dataset.valor = String(cantidad);

        if (cantidad <= 8) {
            const iconos = document.createElement("div");
            iconos.className = "matv9-grupo-iconos";
            for (let i = 0; i < cantidad; i++) {
                const s = document.createElement("span");
                s.textContent = "📦";
                iconos.appendChild(s);
            }
            grupo.appendChild(iconos);
        } else {
            grupo.innerHTML = `<span class="matv9-grupo-grande">📦 × ${cantidad}</span>`;
        }

        const etiqueta = document.createElement("strong");
        etiqueta.textContent = String(cantidad);
        grupo.appendChild(etiqueta);
        return grupo;
    }

    function renderMultiplicacion() {
        const p = estado.problema;
        const escena = $("matv9Escena");
        escena.className = "matv9-escena matv9-multiplicacion";
        escena.innerHTML =
            `<div class="matv9-iconos">📦 <span class="matv9-flecha">➜</span> 🚂</div>` +
            `<div class="matv9-pool"><div class="matv9-contador">${p.a} grupos</div></div>` +
            `<div class="matv9-tren"></div>` +
            `<div class="matv9-info-rapida"><span>${p.a} grupos</span><b>×</b><span>${p.b} por grupo</span></div>`;

        const pool = escena.querySelector(".matv9-pool");
        const tren = escena.querySelector(".matv9-tren");

        const motor = document.createElement("div");
        motor.className = "matv9-motor";
        motor.textContent = "🚂";
        tren.appendChild(motor);

        const vagones = [];
        for (let i = 0; i < p.a; i++) {
            const v = document.createElement("div");
            v.className = "matv9-vagon";
            v.innerHTML = `<div class="matv9-contador">0 / ${p.b}</div>`;
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
                        v.zona.querySelector(".matv9-contador").textContent = String(p.b);
                        pool.querySelector(".matv9-contador").textContent = `${p.a - colocados} grupos`;
                        if (colocados === p.a) accionCompletada();
                        return true;
                    }
                }
                return false;
            });
        });

        if (estado.modo === "practicar") {
            tutorialMultiplicacion(escena, grupos[0], vagones);
            ayudaModo("La mano mueve un grupo completo a cada vagón. Después hazlo tú.");
        } else {
            ayudaModo("Coloca un grupo igual en cada vagón.");
        }
    }

    function crearPaquetePeces(cantidad) {
        const paquete = document.createElement("div");
        paquete.className = "matv9-paquete-peces";
        paquete.dataset.valor = String(cantidad);

        if (cantidad <= 6) {
            const iconos = document.createElement("div");
            iconos.className = "matv9-grupo-iconos";
            for (let i = 0; i < cantidad; i++) {
                const s = document.createElement("span");
                s.textContent = "🐟";
                iconos.appendChild(s);
            }
            paquete.appendChild(iconos);
        } else {
            paquete.innerHTML = `<span class="matv9-grupo-grande">🐟 🐟 🐟 …</span>`;
        }

        return paquete;
    }

    function renderDivision() {
        const p = estado.problema;
        const escena = $("matv9Escena");
        escena.className = "matv9-escena matv9-division";
        escena.innerHTML =
            `<div class="matv9-iconos">🐟 <span class="matv9-flecha">↘</span> 🐧 🐧 <span class="matv9-flecha">↙</span></div>` +
            `<div class="matv9-pool"><div class="matv9-contador">${p.a} peces</div></div>` +
            `<div class="matv9-pinguinos"></div>` +
            `<div class="matv9-info-rapida"><span>${p.a} peces</span><b>÷</b><span>${p.b} pingüinos</span><strong>= igual</strong></div>`;

        const pool = escena.querySelector(".matv9-pool");
        const fila = escena.querySelector(".matv9-pinguinos");
        const pinguinos = [];

        for (let i = 0; i < p.b; i++) {
            const unidad = document.createElement("div");
            unidad.className = "matv9-pinguino";
            unidad.innerHTML =
                `<div class="matv9-pinguino-cara">🐧</div>` +
                `<div class="matv9-plato"><div class="matv9-contador">0</div></div>`;
            fila.appendChild(unidad);
            pinguinos.push({ unidad, plato: unidad.querySelector(".matv9-plato"), lleno: false });
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
                        pg.plato.querySelector(".matv9-contador").textContent = String(p.resultado);
                        pool.querySelector(".matv9-contador").textContent = `${Math.max(0, p.a - repartidos * p.resultado)} peces`;
                        if (repartidos === p.b) accionCompletada();
                        return true;
                    }
                }
                return false;
            });
        });

        if (estado.modo === "practicar") {
            tutorialDivision(escena, paquetes[0], pinguinos);
            ayudaModo("La mano reparte paquetes iguales. Después da uno a cada pingüino.");
        } else {
            ayudaModo("Reparte un paquete igual a cada pingüino.");
        }
    }

    function mostrarReaccion(ok, texto) {
        const anteriorOk = document.querySelector(".matv9-reaccion-ok");
        const anteriorMal = document.querySelector(".matv9-reaccion-mal");
        if (anteriorOk) anteriorOk.remove();
        if (anteriorMal) anteriorMal.remove();

        const el = document.createElement("div");
        el.className = ok ? "matv9-reaccion-ok" : "matv9-reaccion-mal";
        el.innerHTML = `<div>${ok ? "🥳👏🏻" : "😢👎🏻"}</div><span>${texto}</span>`;
        $("matv9Escena").appendChild(el);

        if (!ok) {
            setTimeout(() => { if (el.parentNode) el.remove(); }, 1200);
        }
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
        const viejo = document.querySelector(".matv9-destello-error");
        if (viejo) viejo.remove();
        const el = document.createElement("div");
        el.className = "matv9-destello-error";
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
    }

    function destelloExito() {
        const viejo = document.querySelector(".matv9-destello-exito");
        if (viejo) viejo.remove();
        const el = document.createElement("div");
        el.className = "matv9-destello-exito";
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 950);
    }

    function confeti() {
        const viejo = document.querySelector(".matv9-confeti");
        if (viejo) viejo.remove();

        const capa = document.createElement("div");
        capa.className = "matv9-confeti";
        const colores = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

        for (let i = 0; i < 38; i++) {
            const p = document.createElement("i");
            p.className = "matv9-confeti-pieza" + (i % 3 === 0 ? " matv9-serpentina" : "");
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
        const el = $("matv9Feedback");
        el.className = "matv9-feedback " + clase;
        el.textContent = texto;
    }

    function fallo(texto) {
        feedback("matv9-feedback-mal", texto || "Intenta otra vez.");
        mostrarReaccion(false, texto || "Intenta otra vez.");
        reproducirSonidoIncorrectoMat();
        vibrarError();
        destelloRojo();
    }

    function accionCompletada() {
        if (estado.respondida) return;
        feedback("matv9-feedback-info", estado.modo === "practicar" ? "Ahora elige el resultado." : "Elige el resultado.");
        mostrarRespuestas();
    }

    function opcionesRespuesta(correcto) {
        const valores = [correcto];
        const amplitud = Math.max(2, Math.round(correcto * 0.18));
        let intentos = 0;
        while (valores.length < 3 && intentos < 100) {
            intentos++;
            const v = Math.max(0, correcto + randInt(-amplitud, amplitud));
            if (!valores.includes(v)) valores.push(v);
        }
        return barajar(valores);
    }

    function mostrarRespuestas() {
        const cont = $("matv9Respuestas");
        if (cont.querySelector(".matv9-respuestas")) return;

        const fila = document.createElement("div");
        fila.className = "matv9-respuestas";

        opcionesRespuesta(estado.problema.resultado).forEach((v) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "matv9-respuesta";
            btn.textContent = String(v);

            btn.addEventListener("click", () => {
                if (estado.respondida) return;

                if (v === estado.problema.resultado) {
                    estado.respondida = true;
                    detenerTimer();
                    btn.classList.add("matv9-correcta");
                    fila.querySelectorAll("button").forEach((b) => { b.disabled = true; });
                    $("matv9Resultado").textContent = String(v);
                    $("matv9Resultado").classList.add("matv9-resultado-listo");
                    estado.puntaje++;
                    feedback("matv9-feedback-bien", "¡Excelente!");
                    mostrarReaccion(true, "¡Excelente!");
                    reproducirSonidoCorrectoMat();
                    celebrar();
                    $("matv9Siguiente").classList.remove("matv9-oculto");
                } else {
                    btn.classList.add("matv9-incorrecta");
                    fallo("Observa y prueba otra vez.");
                }
            });

            fila.appendChild(btn);
        });

        cont.appendChild(fila);
    }

    function mostrarCuentaRegresiva(n) {
        let overlay = $("matv9CuentaRegresiva");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "matv9CuentaRegresiva";
            overlay.className = "matv9-cuenta-regresiva";
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `<div class="matv9-cuenta-numero${n <= 3 ? " matv9-urgente" : ""}">${n}</div>`;
    }

    function ocultarCuentaRegresiva() {
        const overlay = $("matv9CuentaRegresiva");
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
        const wrap = $("matv9TimerWrap");
        const barra = $("matv9Timer");

        if (estado.modo !== "jugar") {
            wrap.classList.add("matv9-oculto");
            return;
        }

        wrap.classList.remove("matv9-oculto");
        barra.style.background = "#22c55e";
        estado.tiempoMax = estado.nivel <= 2 ? 18 : estado.nivel === 3 ? 22 : 26;
        estado.tiempoRestante = estado.tiempoMax;
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
                $("matv9Respuestas").innerHTML = "";
                fallo("Tiempo.");
                $("matv9Siguiente").classList.remove("matv9-oculto");
            }
        }, 1000);
    }

    function limpiarPregunta() {
        estado.tutorialActivo = false;
        estado.respondida = false;
        $("matv9Respuestas").innerHTML = "";
        $("matv9Feedback").innerHTML = "";
        $("matv9Feedback").className = "";
        $("matv9Siguiente").classList.add("matv9-oculto");
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

        $("matv9Barra").style.width = ((estado.pregunta - 1) / 5 * 100) + "%";
        $("matv9Score").textContent = `⭐ ${estado.puntaje} · Pregunta ${estado.pregunta} de 5`;
        $("matv9AyudaJuego").textContent = estado.modo === "practicar" ? "Tutorial + eliges al final" : "Con tiempo";

        renderizarEcuacion();

        if (estado.operacion === "suma") renderSuma();
        else if (estado.operacion === "resta") renderResta();
        else if (estado.operacion === "multiplicacion") renderMultiplicacion();
        else renderDivision();

        iniciarTimer();
    }

    function finalizar() {
        detenerTimer();
        estado.finalizada = true;
        $("matv9Barra").style.width = "100%";
        $("matv9Ecuacion").innerHTML = `<span class="matv9-fin-trofeo">🏆</span>`;
        $("matv9Escena").className = "matv9-escena";
        $("matv9Escena").innerHTML =
            `<div class="matv9-fin"><div>🥳👏🏻</div><h3>${estado.puntaje} / 5</h3><p>Fin de la ronda</p></div>`;
        $("matv9Respuestas").innerHTML = "";
        $("matv9Feedback").innerHTML = "";
        $("matv9TimerWrap").classList.add("matv9-oculto");
        celebrar();

        const siguiente = $("matv9Siguiente");
        siguiente.textContent = "Volver al menú";
        siguiente.classList.remove("matv9-oculto");
    }

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
   El botón/gesto Atrás del celular retrocede una pantalla:
   partida Matemáticas -> menú Matemáticas -> menú de juegos -> Herramientas.
   Los otros juegos también vuelven primero al menú de juegos.

   El listener popstate usa CAPTURA para resolver las pantallas internas
   de Jugar antes que el router general de script.js. Solo intercepta
   cuando el destino continúa dentro de ?vista=herramientas-jugar.
   Si el destino ya es Herramientas u otra sección, deja actuar al router
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
    // router general reconstruya Herramientas > Jugar y después
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
            // Un solo paso: partida -> menú del juego -> Jugar -> Herramientas.
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
