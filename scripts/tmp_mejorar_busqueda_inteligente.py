from pathlib import Path
import re

SCRIPT = Path("js/script.js")
SW = Path("sw.js")

src = SCRIPT.read_text(encoding="utf-8")
original = src


def reemplazar_funcion(nombre: str, nuevo: str) -> None:
    global src
    patron = re.compile(
        rf"^function {re.escape(nombre)}\([^\n]*\) \{{\n.*?^\}}\n",
        re.MULTILINE | re.DOTALL,
    )
    src_nuevo, cantidad = patron.subn(nuevo.rstrip() + "\n", src, count=1)
    if cantidad != 1:
        raise SystemExit(f"No se pudo reemplazar {nombre}: coincidencias={cantidad}")
    src = src_nuevo


reemplazar_funcion(
    "clasificarCoincidencia",
    r'''function clasificarCoincidencia(p, texto) {
    const palabraNorm = norm(p.palabra);
    const variantesNorm = p.variantes ? p.variantes.split(',').map(v => norm(v.trim())) : [];

    if (palabraNorm === texto) return 0;                                  // la palabra es exactamente lo buscado
    if (variantesNorm.includes(texto)) return 1;                          // una variante es exactamente lo buscado
    if (palabraNorm.startsWith(texto)) return 2;                          // la palabra empieza así
    if (variantesNorm.some(v => v.startsWith(texto))) return 3;           // una variante empieza así
    if (palabraNorm.includes(texto)) return 4;                            // la palabra lo contiene en otra parte
    if (variantesNorm.some(v => v.includes(texto))) return 5;             // una variante lo contiene en otra parte

    // Si el nombre no coincide, también buscamos dentro del significado y
    // del ejemplo. Esto ayuda a quien conoce la idea pero no recuerda la
    // palabra exacta. Se exige un mínimo de 4 caracteres para evitar ruido
    // con consultas demasiado cortas.
    if (texto.length >= 4) {
        const contenido = norm(`${p.definicion || ""} ${p.ejemplo || ""}`);
        if (contenido.includes(texto)) return 6;

        // Para consultas de varias palabras aceptamos que todas aparezcan
        // en el significado/ejemplo aunque no estén juntas en el mismo orden.
        const terminos = texto.split(/\s+/).filter(t => t.length >= 3);
        if (terminos.length >= 2 && terminos.every(t => contenido.includes(t))) return 7;
    }

    return -1;
}'''
)

reemplazar_funcion(
    "buscarCercanos",
    r'''function buscarCercanos(texto, datos) {
    if (texto.length < 3) return [];

    // Además de la distancia de edición normal, usamos una comparación
    // fonética muy conservadora para errores frecuentes del español peruano
    // (por ejemplo aver -> haber, b/v, s/z y la h muda). Solo se usa cuando
    // la búsqueda normal NO encontró nada, así no reemplaza coincidencias reales.
    const normalizarFoneticoBusqueda = (valor) => norm(valor)
        .replace(/h/g, "")
        .replace(/[bv]/g, "b")
        .replace(/ll/g, "y")
        .replace(/z/g, "s")
        .replace(/qu/g, "k")
        .replace(/c(?=[ei])/g, "s")
        .replace(/g(?=[ei])/g, "j");

    // Una palabra larga admite un poco más de error que una corta. El límite
    // sigue siendo pequeño para no sugerir palabras sin relación.
    const maxDistancia = texto.length >= 11 ? 3 : (texto.length >= 6 ? 2 : 1);
    const textoFonetico = normalizarFoneticoBusqueda(texto);
    const candidatos = [];

    (Array.isArray(datos) ? datos : []).forEach(p => {
        const formas = [p && p.palabra]
            .concat(p && p.variantes ? p.variantes.split(',') : [])
            .map(v => String(v || "").trim())
            .filter(Boolean);

        let mejorDistancia = Infinity;
        let mejorDistanciaFonetica = Infinity;
        formas.forEach(forma => {
            mejorDistancia = Math.min(mejorDistancia, levenshtein(texto, norm(forma)));
            mejorDistanciaFonetica = Math.min(
                mejorDistanciaFonetica,
                levenshtein(textoFonetico, normalizarFoneticoBusqueda(forma))
            );
        });

        const coincidePorEdicion = mejorDistancia <= maxDistancia;
        // La vía fonética debe ser todavía más estricta: 0 para palabras
        // cortas y como máximo 1 para palabras de 6+ letras.
        const limiteFonetico = texto.length >= 6 ? 1 : 0;
        const coincidePorFonetica = mejorDistanciaFonetica <= limiteFonetico;

        if (coincidePorEdicion || coincidePorFonetica) {
            candidatos.push({
                p,
                puntaje: Math.min(mejorDistancia, mejorDistanciaFonetica + 0.25)
            });
        }
    });

    candidatos.sort((a, b) =>
        a.puntaje - b.puntaje || a.p.palabra.localeCompare(b.p.palabra, "es")
    );

    // Evita que una misma palabra entre dos veces si varias variantes se
    // parecen a la consulta.
    const vistos = new Set();
    const unicos = [];
    candidatos.forEach(({ p }) => {
        const id = obtenerIdPalabra(p) || norm(p.palabra);
        if (vistos.has(id)) return;
        vistos.add(id);
        unicos.push(p);
    });
    return unicos.slice(0, 3);
}

// Registra únicamente búsquedas confirmadas (Enter/lupa) que no tuvieron
// resultados ni una sugerencia cercana. No se registra cada tecla escrita.
// Tampoco enviamos consultas que parezcan correos, URLs o números largos.
function registrarBusquedaSinResultado(consulta, origen = "diccionario") {
    const termino = String(consulta || "").trim().replace(/\s+/g, " ").slice(0, 80);
    if (termino.length < 2) return;
    if (/@/.test(termino) || /https?:\/\//i.test(termino) || /www\./i.test(termino)) return;
    if (/(?:\d[\s.-]*){7,}/.test(termino)) return;

    try {
        if (typeof window.gtag === "function") {
            window.gtag("event", "search_no_results", {
                search_term: termino,
                search_origin: origen
            });
        }
    } catch (error) {
        console.warn("No se pudo registrar una búsqueda sin resultados:", error);
    }
}'''
)

# En las sugerencias normales, si la coincidencia viene del significado o
# ejemplo, lo indicamos de forma breve para que el usuario entienda por qué
# apareció esa palabra.
ancla = '''        let textoMatch = `<strong>${escaparHtml(p.palabra)}</strong>`;\n        const varianteCoincidente = obtenerVarianteQueCoincide(p.variantes, texto);\n        if(varianteCoincidente && !norm(p.palabra).includes(texto)){\n            textoMatch += ` <small class="text-primary ms-2 fw-bold" style="font-size: 11px;">(Variante: ${escaparHtml(varianteCoincidente)})</small>`;\n        }\n'''
reemplazo = ancla + '''        const rangoCoincidencia = clasificarCoincidencia(p, texto);\n        if(rangoCoincidencia >= 6){\n            textoMatch += ` <small class="text-secondary ms-2 fw-bold" style="font-size: 11px;">(en el significado)</small>`;\n        }\n'''
if ancla not in src:
    raise SystemExit("No se encontró el bloque de textoMatch del buscador principal")
src = src.replace(ancla, reemplazo, 1)

reemplazar_funcion(
    "ejecutarBusquedaDirecta",
    r'''function ejecutarBusquedaDirecta() {
    const consultaOriginal = buscar.value.trim();
    const texto = norm(consultaOriginal);
    if(texto === "") return;
    sugerencias.innerHTML = "";
    sugerencias.style.display = "none";

    // Usamos el mismo ranking del autocompletado para que Enter/lupa y las
    // sugerencias se comporten igual. Las coincidencias por nombre/variante
    // abren la ficha; si solo coincide el significado, mostramos la lista
    // para no abrir automáticamente una palabra ambigua.
    const coincidencias = [];
    App.datos.forEach(p => {
        const rango = clasificarCoincidencia(p, texto);
        if (rango >= 0) coincidencias.push({ p, rango });
    });

    if(coincidencias.length > 0) {
        const mejorRango = Math.min(...coincidencias.map(c => c.rango));
        if(mejorRango <= 5) {
            const ordenadas = ordenarYLimitarCoincidencias(coincidencias, 15);
            if(ordenadas.length > 0) {
                mostrarPalabra(ordenadas[0]);
                return;
            }
        }

        // Coincidencia encontrada en significado/ejemplo: dejamos visibles
        // las sugerencias para que la persona elija la palabra correcta.
        buscarPalabras();
        if(sugerencias && sugerencias.children.length) {
            setTimeout(() => sugerencias.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
        }
        return;
    }

    // Si escribió la palabra con uno o varios errores razonables, no la
    // declaramos inexistente: mostramos "¿Quisiste decir...?".
    const cercanos = buscarCercanos(texto, App.datos);
    if(cercanos.length > 0) {
        buscarPalabras();
        buscar.blur();
        if(sugerencias && sugerencias.children.length) {
            setTimeout(() => sugerencias.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
        }
        return;
    }

    // Solo ahora sabemos que fue una búsqueda confirmada sin resultados.
    registrarBusquedaSinResultado(consultaOriginal, "diccionario");

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
            <h4 class="fw-bold mb-2 text-primary">No encontramos "${escaparHtml(consultaOriginal)}"</h4>
            <p class="text-muted small mb-3">Esta búsqueda se registra sin un identificador personal para ayudarnos a saber qué palabras hacen falta en LSPedia.</p>
            <button class="btn btn-warning px-4 py-2 rounded-pill fw-bold text-dark" data-bs-toggle="modal" data-bs-target="#modalSugerencia">Sugerir esta palabra</button>
        </div>
    </div>`;
    setTimeout(() => resultado.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}'''
)

# También mejoramos el botón/Enter del buscador de Vocabulario para que use
# la misma tolerancia. No registra analítica aquí porque la Hoja 2 puede estar
# todavía cargándose y no queremos falsos "sin resultado".
reemplazar_funcion(
    "ejecutarBusquedaDirectaCategorias",
    r'''function ejecutarBusquedaDirectaCategorias() {
    if(!buscarCategorias) return;
    const texto = norm(buscarCategorias.value.trim());
    if(texto === "") return;

    const datos = obtenerDatosVocabulario();
    const coincidencias = [];
    datos.forEach(p => {
        const rango = clasificarCoincidencia(p, texto);
        if(rango >= 0) coincidencias.push({ p, rango });
    });

    if(coincidencias.length > 0) {
        const mejorRango = Math.min(...coincidencias.map(c => c.rango));
        if(mejorRango <= 5) {
            const ordenadas = ordenarYLimitarCoincidencias(coincidencias, 15);
            const encontrado = ordenadas[0];
            if(encontrado){
                buscarCategorias.value = "";
                if(sugerenciasCategorias){
                    sugerenciasCategorias.innerHTML = "";
                    sugerenciasCategorias.style.display = "none";
                }
                mostrarPalabraVocabularioPorReferencia(obtenerIdPalabra(encontrado));
                return;
            }
        }

        // Si solo coincide el significado/ejemplo, mostramos opciones.
        buscarEnCategorias();
        return;
    }

    const cercanos = buscarCercanos(texto, datos);
    if(cercanos.length > 0) {
        buscarEnCategorias();
    }
}'''
)

if src == original:
    raise SystemExit("El script no cambió")

# Comprobaciones antes de escribir.
requeridos = [
    "search_no_results",
    "normalizarFoneticoBusqueda",
    "(en el significado)",
    "Esta búsqueda se registra sin un identificador personal",
    "mejorRango <= 5",
]
for texto in requeridos:
    if texto not in src:
        raise SystemExit(f"Falta marcador esperado: {texto}")

SCRIPT.write_text(src, encoding="utf-8")

sw = SW.read_text(encoding="utf-8")
if 'const VERSION_APP = "v56";' not in sw:
    raise SystemExit("sw.js no está en v56; revisar antes de tocarlo")
sw = sw.replace('const VERSION_APP = "v56";', 'const VERSION_APP = "v57";', 1)
SW.write_text(sw, encoding="utf-8")

print("OK: búsqueda inteligente mejorada y cache v57 preparados")
