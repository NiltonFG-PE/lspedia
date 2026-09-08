from pathlib import Path

MAT = Path("js/matematicas.js")
SW = Path("sw.js")

js = MAT.read_text(encoding="utf-8")

if "HistorialJuegosLSPedia" not in js:
    viejo = '    function iniciarPartida(operacion) {\n'
    nuevo = '    function iniciarPartida(operacion, opciones = {}) {\n'
    if viejo not in js:
        raise SystemExit("No se encontró iniciarPartida(operacion).")
    js = js.replace(viejo, nuevo, 1)

    viejo = '''        estado.operacion = operacion;\n        estado.pregunta = 0;\n        estado.puntaje = 0;\n        estado.respondida = false;\n        estado.finalizada = false;\n        mostrarJuego();'''
    nuevo = '''        estado.operacion = operacion;\n        estado.pregunta = 0;\n        estado.puntaje = 0;\n        estado.respondida = false;\n        estado.finalizada = false;\n        if (!opciones.sinHistorial && window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarPantallaMatematicas === "function") {\n            HistorialJuegosLSPedia.registrarPantallaMatematicas("partida", operacion);\n        }\n        mostrarJuego();'''
    if viejo not in js:
        raise SystemExit("No se encontró el inicio de iniciarPartida.")
    js = js.replace(viejo, nuevo, 1)

    viejo = '''    function volverMenu() {\n        detenerTimer();\n        ocultarCuentaRegresiva();\n        estado.tutorialActivo = false;\n        mostrarMenu();\n    }'''
    nuevo = '''    function volverMenu() {\n        detenerTimer();\n        ocultarCuentaRegresiva();\n        estado.tutorialActivo = false;\n\n        const params = new URLSearchParams(window.location.search);\n        const enPartidaHistorial = params.get("juego") === "matematicas" && params.get("pantalla") === "partida";\n        if (enPartidaHistorial && window.history.length > 1) {\n            window.history.back();\n            return;\n        }\n\n        mostrarMenu();\n    }'''
    if viejo not in js:
        raise SystemExit("No se encontró volverMenu().")
    js = js.replace(viejo, nuevo, 1)

    viejo = '''    function salir() {\n        detenerTimer();\n        ocultarCuentaRegresiva();\n        estado.tutorialActivo = false;\n        estado.operacion = null;\n        estado.pregunta = 0;\n        if (asegurarUI()) mostrarMenu();\n    }\n\n    return { iniciar, salir };\n})();\n\nwindow.MatematicasV2 = MatematicasV2;\n'''
    nuevo = '''    function salir() {\n        detenerTimer();\n        ocultarCuentaRegresiva();\n        estado.tutorialActivo = false;\n        estado.operacion = null;\n        estado.pregunta = 0;\n        if (asegurarUI()) mostrarMenu();\n    }\n\n    function restaurarHistorial(pantalla, operacion) {\n        if (!asegurarUI()) return;\n\n        detenerTimer();\n        estado.tutorialActivo = false;\n\n        if (pantalla === "partida" && OPS[operacion]) {\n            iniciarPartida(operacion, { sinHistorial: true });\n            return;\n        }\n\n        mostrarMenu();\n    }\n\n    return { iniciar, salir, restaurarHistorial };\n})();\n\nwindow.MatematicasV2 = MatematicasV2;\n\n\n/* ============================================================\n   HISTORIAL INTERNO DE HERRAMIENTAS > JUGAR\n   ------------------------------------------------------------\n   El botón Atrás del navegador/celular ahora retrocede una pantalla:\n   partida Matemáticas -> menú Matemáticas -> menú de juegos -> Herramientas.\n   Los otros juegos también vuelven primero al menú de juegos.\n   ============================================================ */\nconst HistorialJuegosLSPedia = (function () {\n    "use strict";\n\n    let restaurando = false;\n    let listenersListos = false;\n\n    const BOTONES = {\n        completar: "btnMenuJuegoCompletar",\n        unir: "btnMenuJuegoUnir",\n        quiz: "btnMenuJuegoQuiz",\n        matematicas: "btnMenuJuegoMatematicas"\n    };\n\n    function construirUrl(juego, pantalla, operacion) {\n        const url = new URL(window.location.href);\n        url.search = "";\n        url.searchParams.set("vista", "herramientas-jugar");\n        if (juego) url.searchParams.set("juego", juego);\n        if (pantalla) url.searchParams.set("pantalla", pantalla);\n        if (operacion) url.searchParams.set("op", operacion);\n        return url.pathname + "?" + url.searchParams.toString();\n    }\n\n    function registrar(url, estado) {\n        if (restaurando) return;\n        const actual = window.location.pathname + window.location.search;\n        if (actual === url) window.history.replaceState(estado, "", url);\n        else window.history.pushState(estado, "", url);\n    }\n\n    function registrarJuego(juego) {\n        registrar(construirUrl(juego), { tipo: "juego", vista: "herramientas-jugar", juego });\n    }\n\n    function registrarPantallaMatematicas(pantalla, operacion) {\n        registrar(\n            construirUrl("matematicas", pantalla, operacion),\n            { tipo: "juego-matematicas", vista: "herramientas-jugar", juego: "matematicas", pantalla, operacion }\n        );\n    }\n\n    function abrirJuegoSinRegistrar(juego) {\n        const id = BOTONES[juego];\n        const btn = id && document.getElementById(id);\n        if (btn) btn.click();\n    }\n\n    function restaurarDesdeUrl() {\n        const params = new URLSearchParams(window.location.search);\n        if (params.get("vista") !== "herramientas-jugar") return;\n\n        const juego = params.get("juego");\n        if (!juego || !BOTONES[juego]) return;\n\n        restaurando = true;\n        try {\n            abrirJuegoSinRegistrar(juego);\n            if (juego === "matematicas" && window.MatematicasV2 && typeof MatematicasV2.restaurarHistorial === "function") {\n                MatematicasV2.restaurarHistorial(params.get("pantalla") || "menu", params.get("op") || "");\n            }\n        } finally {\n            restaurando = false;\n        }\n    }\n\n    function volverAlMenuJuegosDesdeBoton() {\n        const params = new URLSearchParams(window.location.search);\n        if (params.get("vista") !== "herramientas-jugar" || !params.get("juego")) return;\n\n        if (params.get("juego") === "matematicas" && params.get("pantalla") === "partida") {\n            if (window.history.length > 2) window.history.go(-2);\n            return;\n        }\n\n        if (window.history.length > 1) window.history.back();\n    }\n\n    function enlazar() {\n        if (listenersListos) return;\n        listenersListos = true;\n\n        Object.entries(BOTONES).forEach(([juego, id]) => {\n            const btn = document.getElementById(id);\n            if (!btn) return;\n            btn.addEventListener("click", () => {\n                if (!restaurando) registrarJuego(juego);\n            });\n        });\n\n        document.querySelectorAll(".btn-volver-menu-juegos").forEach((btn) => {\n            btn.addEventListener("click", () => {\n                if (!restaurando) volverAlMenuJuegosDesdeBoton();\n            });\n        });\n\n        window.addEventListener("popstate", () => {\n            setTimeout(restaurarDesdeUrl, 0);\n        });\n\n        setTimeout(restaurarDesdeUrl, 0);\n    }\n\n    enlazar();\n\n    return { registrarJuego, registrarPantallaMatematicas, restaurarDesdeUrl };\n})();\n\nwindow.HistorialJuegosLSPedia = HistorialJuegosLSPedia;\n'''
    if viejo not in js:
        raise SystemExit("No se encontró el final esperado de MatematicasV2.")
    js = js.replace(viejo, nuevo, 1)

    MAT.write_text(js, encoding="utf-8")
    print("Historial interno de juegos aplicado.")
else:
    print("Historial interno de juegos ya estaba aplicado.")

sw = SW.read_text(encoding="utf-8")
if 'const VERSION_APP = "v8";' in sw:
    sw = sw.replace('const VERSION_APP = "v8";', 'const VERSION_APP = "v9";', 1)
    SW.write_text(sw, encoding="utf-8")
    print("Service Worker actualizado a v9.")
elif 'const VERSION_APP = "v9";' in sw:
    print("Service Worker ya estaba en v9.")
else:
    raise SystemExit("Versión inesperada del Service Worker.")
