/* Motor de búsqueda compartido. Sin DOM, red, Quiz ni dependencias del laboratorio IA. */
(function(root){
    'use strict';
const norm = (s) => (s || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Formas alternativas de búsqueda que ayudan con plurales sencillos y
// traducciones al inglés. La palabra canónica en la ficha sigue siendo
// siempre la de LSPedia.
function normalizarFormaBusqueda(valor){
    return norm(String(valor || ""))
        .replace(/^(los|las|unos|unas|un|una|el|la)\s+/, "")
        .replace(/es$/, "")
        .replace(/s$/, "");
}

function formasInglesBusqueda(p){
    return [
        p && p.ingles,
        p && p.word,
        p && p.english,
        p && p.traduccionIngles,
        p && p.traduccioningles
    ].map(v => String(v || "").trim()).filter(Boolean);
}

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
    const variantesNorm = p.variantes ? p.variantes.split(',').map(v => norm(v.trim())).filter(Boolean) : [];
    const inglesNorm = formasInglesBusqueda(p).map(v => norm(v)).filter(Boolean);

    if (palabraNorm === texto) return 0;                                  // palabra exacta
    if (variantesNorm.includes(texto)) return 1;                          // variante exacta

    // Singular/plural o artículo delante: conserva la ficha canónica.
    if (texto.length >= 4 && normalizarFormaBusqueda(palabraNorm) === normalizarFormaBusqueda(texto)) return 2;

    // También permite encontrar una entrada española por su equivalente en inglés.
    if (inglesNorm.includes(texto)) return 3;

    if (palabraNorm.startsWith(texto)) return 4;                          // prefijo
    if (variantesNorm.some(v => v.startsWith(texto))) return 5;           // prefijo de variante
    if (inglesNorm.some(v => v.startsWith(texto))) return 5;              // prefijo en inglés
    if (palabraNorm.includes(texto)) return 6;                            // contiene
    if (variantesNorm.some(v => v.includes(texto))) return 7;             // contiene en variante
    if (inglesNorm.some(v => v.includes(texto))) return 7;                // contiene en inglés

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

// Formas regulares de apoyo; las variantes registradas tienen prioridad.
function generarConjugacionesRegulares(infinitivo){
    const verbo = norm(String(infinitivo || "").trim());
    if(!/^[a-záéíóúñ]+(ar|er|ir)$/.test(verbo)) return [];
    const terminacion = verbo.slice(-2);
    const raiz = verbo.slice(0, -2);
    const formas = new Set();

    if(terminacion === "ar"){
        ["o","as","a","amos","áis","an","é","aste","ó","amos","asteis","aron",
         "aba","abas","aba","ábamos","abais","aban","aré","arás","ará","aremos","aréis","arán",
         "ando","ado"].forEach(x => formas.add(raiz + x));
    } else if(terminacion === "er"){
        ["o","es","e","emos","éis","en","í","iste","ió","imos","isteis","ieron",
         "ía","ías","ía","íamos","íais","ían","eré","erás","erá","eremos","eréis","erán",
         "iendo","ido"].forEach(x => formas.add(raiz + x));
    } else {
        ["o","es","e","imos","ís","en","í","iste","ió","imos","isteis","ieron",
         "ía","ías","ía","íamos","íais","ían","iré","irás","irá","iremos","iréis","irán",
         "iendo","ido"].forEach(x => formas.add(raiz + x));
    }

    return Array.from(formas);
}


function resolver(consulta, diccionario, vocabulario, estadoVocabulario = 'listo') {
    const q = norm(String(consulta || '').trim());
    const dic = Array.isArray(diccionario) ? diccionario : [];
    const voc = Array.isArray(vocabulario) ? vocabulario : [];
    if (!q) return { tipo: 'vacia' };
    const exactaDic = dic.find(p => norm(p.palabra) === q);
    if (exactaDic) return { tipo: 'diccionario', registro: exactaDic, rango: 0 };
    // Un banco pendiente o fallido no demuestra que la palabra no existe.
    if (estadoVocabulario !== 'listo') return { tipo: estadoVocabulario === 'error' ? 'error' : 'cargando' };
    const exactaVoc = voc.find(p => norm(p.palabra) === q);
    if (exactaVoc) return { tipo: 'vocabulario', registro: exactaVoc, coincidencia: 'exacta', forma: exactaVoc.palabra };
    const varianteDic = dic.find(p => String(p.variantes || '').split(',').some(v => norm(v.trim()) === q));
    if (varianteDic) return { tipo: 'diccionario', registro: varianteDic, rango: 1 };
    return { tipo: 'aproximada' };
}
const api = Object.freeze({norm, normalizarFormaBusqueda, formasInglesBusqueda,
    obtenerVarianteQueCoincide, clasificarCoincidencia, ordenarYLimitarCoincidencias,
    levenshtein, generarConjugacionesRegulares, resolver});
root.LSPediaBusquedaCore = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
