#!/usr/bin/env node
import fs from 'node:fs';

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf8');
}

function escribir(ruta, contenido) {
  fs.writeFileSync(ruta, contenido, 'utf8');
}

function reemplazarUna(texto, viejo, nuevo, etiqueta) {
  const i = texto.indexOf(viejo);
  if (i < 0) throw new Error(`No se encontró bloque: ${etiqueta}`);
  if (texto.indexOf(viejo, i + viejo.length) >= 0) throw new Error(`Bloque ambiguo (más de una coincidencia): ${etiqueta}`);
  return texto.slice(0, i) + nuevo + texto.slice(i + viejo.length);
}

function reemplazarEntre(texto, inicio, fin, nuevo, etiqueta) {
  const i = texto.indexOf(inicio);
  if (i < 0) throw new Error(`No se encontró inicio: ${etiqueta}`);
  const j = texto.indexOf(fin, i + inicio.length);
  if (j < 0) throw new Error(`No se encontró fin: ${etiqueta}`);
  return texto.slice(0, i) + nuevo + texto.slice(j);
}

let alfab = leer('js/alfabetizacion.js');

const anclaNivel = `    function vibrarError() {
        if (navigator.vibrate) {
            try { navigator.vibrate(200); } catch (e) { /* no soportado o bloqueado */ }
        }
    }

    function bancoPalabrasCompletar() {`;

const helpersNivel = `    function vibrarError() {
        if (navigator.vibrate) {
            try { navigator.vibrate(200); } catch (e) { /* no soportado o bloqueado */ }
        }
    }

    // El nivel editorial de AlfabetizacionEjemplos ahora sí controla qué
    // contenido entra en Fácil/Medio/Difícil. Si una fila antigua no tiene
    // nivel, se usa el mismo fallback por longitud de LSPediaCore.
    function normalizarNivelPedagogico(valor, palabra) {
        try {
            if (window.LSPediaCore && typeof window.LSPediaCore.normalizarNivel === "function") {
                return window.LSPediaCore.normalizarNivel(valor, palabra);
            }
        } catch (e) { /* fallback local */ }

        const n = String(valor || "")
            .normalize("NFD")
            .replace(/[\\u0300-\\u036f]/g, "")
            .toLowerCase()
            .trim();
        if (n === "facil") return "Fácil";
        if (n === "medio") return "Medio";
        if (n === "dificil") return "Difícil";

        const largo = String(palabra || "").trim().replace(/\\s+/g, "").length;
        if (!largo) return "";
        if (largo <= 5) return "Fácil";
        if (largo <= 8) return "Medio";
        return "Difícil";
    }

    function nivelObjetivoJuego(nivelId) {
        if (nivelId === "medio") return "Medio";
        if (nivelId === "dificil" || nivelId === "reto") return "Difícil";
        return "Fácil";
    }

    function nivelNumeroJuego(numero) {
        const n = Number(numero);
        if (n <= 9) return "Fácil";
        if (n <= 15) return "Medio";
        return "Difícil";
    }

    function coincideNivelJuego(valorNivel, palabra, nivelId) {
        return normalizarNivelPedagogico(valorNivel, palabra) === nivelObjetivoJuego(nivelId);
    }

    function bancoPalabrasCompletar(nivelId) {`;

alfab = reemplazarUna(alfab, anclaNivel, helpersNivel, 'helpers de nivel');

alfab = reemplazarEntre(
  alfab,
  `    function bancoPalabrasCompletar(nivelId) {`,
  `    // Palabras de una lista del Diccionario o del Vocabulario`,
  `    function bancoPalabrasCompletar(nivelId) {
        const nivelSeleccionado = nivelId || estado.completar.nivelId || "facil";

        const deLetras = (estado.datos.ejemplos || [])
            .filter((e) => e && e.palabra && e.palabra.length >= 3 && primeraImagenUsable(e.imagen) && coincideNivelJuego(e.nivel, e.palabra, nivelSeleccionado))
            .map((e) => ({
                palabra: e.palabra.toUpperCase(),
                imagen: primeraImagenUsable(e.imagen),
                numero: null,
                nivel: normalizarNivelPedagogico(e.nivel, e.palabra)
            }));

        const deNumeros = Object.keys(CONFIG.PALABRA_NUMERO)
            .filter((n) => nivelNumeroJuego(n) === nivelObjetivoJuego(nivelSeleccionado))
            .map((n) => ({
                palabra: CONFIG.PALABRA_NUMERO[n],
                imagen: null,
                numero: n,
                nivel: nivelNumeroJuego(n)
            }));

        // Vocabulario (Hoja 2) se filtra por su propio nivel y por imagen
        // real. A propósito NO se usa el Diccionario (Hoja 1).
        const bancoHoja2 = (window.QuizV2 && typeof QuizV2.obtenerBanco === "function") ? QuizV2.obtenerBanco() : [];
        const deVocabulario = obtenerPalabrasConImagenDe(bancoHoja2, nivelSeleccionado);

        const combinado = deLetras.concat(deNumeros, deVocabulario);
        const vistas = new Set();
        return combinado.filter((p) => {
            const clave = p.palabra.trim().toUpperCase();
            if (vistas.has(clave)) return false;
            vistas.add(clave);
            return true;
        });
    }

`,
  'banco Completar por nivel'
);

alfab = reemplazarEntre(
  alfab,
  `    function obtenerPalabrasConImagenDe(lista) {`,
  `    // Distingue una URL/ruta de imagen real`,
  `    function obtenerPalabrasConImagenDe(lista, nivelId) {
        if (!Array.isArray(lista)) return [];
        const nivelSeleccionado = nivelId || "facil";
        return lista
            .map((p) => ({
                palabra: p && p.palabra,
                imagenUrl: primeraImagenUsable(p && p.imagen),
                nivel: normalizarNivelPedagogico(p && p.nivel, p && p.palabra)
            }))
            .filter((p) => p.palabra && p.imagenUrl && p.palabra.trim().length >= 3 && p.palabra.trim().length <= 22 && p.nivel === nivelObjetivoJuego(nivelSeleccionado))
            .map((p) => ({ palabra: p.palabra.toUpperCase(), imagen: p.imagenUrl, numero: null, nivel: p.nivel }));
    }

`,
  'Vocabulario con imagen y nivel'
);

alfab = reemplazarUna(
  alfab,
  `    function nivelCompletarActual() {
        return CONFIG.NIVELES_COMPLETAR.find((n) => n.id === estado.completar.nivelId) || CONFIG.NIVELES_COMPLETAR[0];
    }
`,
  `    function nivelCompletarActual() {
        return CONFIG.NIVELES_COMPLETAR.find((n) => n.id === estado.completar.nivelId) || CONFIG.NIVELES_COMPLETAR[0];
    }

    function actualizarTotalCompletarDisponible() {
        const totalEl = el("alfabCompletarTotalDisponibles");
        if (totalEl) totalEl.textContent = bancoPalabrasCompletar(estado.completar.nivelId).length + " palabras disponibles en este nivel";
    }
`,
  'contador Completar'
);

alfab = reemplazarUna(
  alfab,
  `                    estado.completar.nivelId = nivel.id;
                    cont.querySelectorAll(".quiz-selector-btn").forEach((b) => b.classList.remove("activo"));`,
  `                    estado.completar.nivelId = nivel.id;
                    actualizarTotalCompletarDisponible();
                    cont.querySelectorAll(".quiz-selector-btn").forEach((b) => b.classList.remove("activo"));`,
  'actualizar total al elegir nivel Completar'
);

alfab = reemplazarUna(
  alfab,
  `        const totalEl = el("alfabCompletarTotalDisponibles");
        if (totalEl) totalEl.textContent = bancoPalabrasCompletar().length + " palabras disponibles (abecedario + números + vocabulario)";`,
  `        actualizarTotalCompletarDisponible();`,
  'total inicial Completar'
);

alfab = reemplazarUna(
  alfab,
  `        const banco = barajar(bancoPalabrasCompletar());`,
  `        const banco = barajar(bancoPalabrasCompletar(estado.completar.nivelId));`,
  'inicio Completar por nivel'
);

alfab = reemplazarEntre(
  alfab,
  `    function bancoParesUnir() {`,
  `    function nivelUnirActual() {`,
  `    function bancoParesUnir(nivelId) {
        const nivelSeleccionado = nivelId || estado.unir.nivelId || "facil";

        const deLetras = (estado.datos.ejemplos || [])
            .filter((e) => e && e.palabra && primeraImagenUsable(e.imagen) && coincideNivelJuego(e.nivel, e.palabra, nivelSeleccionado))
            .map((e) => ({
                palabra: e.palabra.toUpperCase(),
                imagen: primeraImagenUsable(e.imagen),
                numero: null,
                nivel: normalizarNivelPedagogico(e.nivel, e.palabra)
            }));

        const deNumeros = Object.keys(CONFIG.PALABRA_NUMERO)
            .filter((n) => nivelNumeroJuego(n) === nivelObjetivoJuego(nivelSeleccionado))
            .map((n) => ({
                palabra: CONFIG.PALABRA_NUMERO[n],
                imagen: null,
                numero: n,
                nivel: nivelNumeroJuego(n)
            }));

        const bancoHoja2 = (window.QuizV2 && typeof QuizV2.obtenerBanco === "function") ? QuizV2.obtenerBanco() : [];
        const deVocabulario = obtenerPalabrasConImagenDe(bancoHoja2, nivelSeleccionado);

        const combinado = deLetras.concat(deNumeros, deVocabulario);
        const vistas = new Set();
        return combinado.filter((p) => {
            const clave = p.palabra.trim().toUpperCase();
            if (vistas.has(clave)) return false;
            vistas.add(clave);
            return true;
        });
    }

    function nivelUnirActual() {`,
  'banco Unir por nivel'
);

alfab = reemplazarUna(
  alfab,
  `    function nivelUnirActual() {
        return CONFIG.NIVELES_UNIR.find((n) => n.id === estado.unir.nivelId) || CONFIG.NIVELES_UNIR[0];
    }
`,
  `    function nivelUnirActual() {
        return CONFIG.NIVELES_UNIR.find((n) => n.id === estado.unir.nivelId) || CONFIG.NIVELES_UNIR[0];
    }

    function actualizarTotalUnirDisponible() {
        const totalEl = el("alfabUnirTotalDisponibles");
        if (totalEl) totalEl.textContent = bancoParesUnir(estado.unir.nivelId).length + " parejas disponibles en este nivel";
    }
`,
  'contador Unir'
);

alfab = reemplazarUna(
  alfab,
  `                    estado.unir.nivelId = nivel.id;
                    cont.querySelectorAll(".quiz-selector-btn").forEach((b) => b.classList.remove("activo"));`,
  `                    estado.unir.nivelId = nivel.id;
                    actualizarTotalUnirDisponible();
                    cont.querySelectorAll(".quiz-selector-btn").forEach((b) => b.classList.remove("activo"));`,
  'actualizar total al elegir nivel Unir'
);

alfab = reemplazarUna(
  alfab,
  `        const totalEl = el("alfabUnirTotalDisponibles");
        if (totalEl) totalEl.textContent = bancoParesUnir().length + " parejas disponibles (abecedario + números + vocabulario)";`,
  `        actualizarTotalUnirDisponible();`,
  'total inicial Unir'
);

alfab = reemplazarUna(
  alfab,
  `        const banco = barajar(bancoParesUnir());`,
  `        const banco = barajar(bancoParesUnir(estado.unir.nivelId));`,
  'ronda Unir por nivel'
);

// La letra/número del Sheet se escapa antes de entrar a HTML dinámico.
alfab = reemplazarUna(
  alfab,
  '>${c.caracter}</button>`;',
  '>${escaparHtml(c.caracter)}</button>`;',
  'escape índice Alfabetización'
);

// Dos listados de resultados construían HTML con texto procedente de datos.
const viejoRevision = `                item.innerHTML = "<span>" + (r.ok ? "✔" : "✘") + " " + r.texto + "</span>";
                lista.appendChild(item);`;
const nuevoRevision = `                const span = document.createElement("span");
                span.textContent = (r.ok ? "✔ " : "✘ ") + String(r.texto || "");
                item.appendChild(span);
                lista.appendChild(item);`;
const coincidenciasRevision = alfab.split(viejoRevision).length - 1;
if (coincidenciasRevision !== 2) throw new Error(`Se esperaban 2 revisiones inseguras y se encontraron ${coincidenciasRevision}`);
alfab = alfab.split(viejoRevision).join(nuevoRevision);

escribir('js/alfabetizacion.js', alfab);

let html = leer('index.html');
const descripcion = `    <meta id="metaDescription" name="description" content="Diccionario visual gratuito para aprender y comprender palabras en español con apoyo de videos en Lengua de Señas Peruana (LSP).">`;
const descripcionConIdentidad = `${descripcion}\n    <meta name="author" content="Nilton F. G.">\n    <meta name="application-name" content="LSPedia">`;
html = reemplazarUna(html, descripcion, descripcionConIdentidad, 'metadatos de identidad');

const formsAntes = (html.match(/<iframe src="https:\/\/docs\.google\.com\/forms\//g) || []).length;
if (formsAntes < 1) throw new Error('No se encontraron iframes de Google Forms para optimizar');
html = html.replace(/<iframe src="https:\/\/docs\.google\.com\/forms\//g, '<iframe loading="lazy" referrerpolicy="no-referrer" src="https://docs.google.com/forms/');

escribir('index.html', html);
console.log(`Cambios aplicados: niveles pedagógicos, 2 sinks HTML saneados, ${formsAntes} formularios lazy y metadatos de identidad.`);
