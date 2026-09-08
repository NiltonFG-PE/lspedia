#!/usr/bin/env python3
"""Migra LSPedia a identificadores únicos y estables por palabra.

Este script está pensado para ejecutarse de forma automática en GitHub Actions.
Hace dos trabajos idempotentes:

1. Añade `id` a cada registro de data/palabras.json que todavía no lo tenga.
   - Las palabras únicas usan un slug corto: `tesis`.
   - Si el mismo término aparece varias veces, se usa la categoría para
     desambiguar: `examen-educacion`, `examen-universidad`.
   - Si aun así existe una colisión, agrega un sufijo numérico estable.
   - Los IDs ya existentes se conservan y nunca se renumeran silenciosamente.

2. En la primera ejecución adapta js/script.js para usar esos IDs en URLs,
   SEO, compartir, Favoritos, Historial y restauración de enlaces; los enlaces
   antiguos `?p=Nombre` siguen resolviéndose por compatibilidad.
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "palabras.json"
SCRIPT_PATH = ROOT / "js" / "script.js"
MARCADOR_JS = "// --- IDENTIFICADORES ÚNICOS DE PALABRAS ---"


def slug(texto: str) -> str:
    normalizado = unicodedata.normalize("NFKD", str(texto or ""))
    ascii_texto = "".join(c for c in normalizado if not unicodedata.combining(c))
    ascii_texto = ascii_texto.casefold()
    ascii_texto = re.sub(r"[^a-z0-9]+", "-", ascii_texto)
    return ascii_texto.strip("-")


def clave_palabra(texto: str) -> str:
    return unicodedata.normalize("NFKC", str(texto or "")).casefold().strip()


def asignar_ids() -> tuple[int, int]:
    datos = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    if not isinstance(datos, list):
        raise SystemExit("ERROR: data/palabras.json debe contener una lista.")

    conteos = Counter(
        clave_palabra(fila.get("palabra", ""))
        for fila in datos
        if isinstance(fila, dict) and str(fila.get("palabra", "")).strip()
    )

    usados: set[str] = set()
    for fila in datos:
        if not isinstance(fila, dict):
            continue
        actual = str(fila.get("id", "")).strip()
        if not actual:
            continue
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", actual):
            raise SystemExit(
                f"ERROR: el ID existente {actual!r} no tiene un formato válido. "
                "Corrígelo manualmente para no cambiar una URL estable sin querer."
            )
        if actual in usados:
            raise SystemExit(f"ERROR: ID duplicado existente: {actual}")
        usados.add(actual)

    agregados = 0
    nuevos_datos = []

    for fila in datos:
        if not isinstance(fila, dict):
            nuevos_datos.append(fila)
            continue

        palabra = str(fila.get("palabra", "")).strip()
        actual = str(fila.get("id", "")).strip()
        if actual or not palabra:
            nuevos_datos.append(fila)
            continue

        base = slug(palabra) or "palabra"
        if conteos[clave_palabra(palabra)] > 1:
            categoria = slug(fila.get("categoria", ""))
            if categoria:
                base = f"{base}-{categoria}"

        candidato = base
        numero = 2
        while candidato in usados:
            candidato = f"{base}-{numero}"
            numero += 1
        usados.add(candidato)

        # Dejamos `id` primero para que sea fácil verlo al editar el JSON.
        nueva_fila = {"id": candidato}
        nueva_fila.update(fila)
        nuevos_datos.append(nueva_fila)
        agregados += 1

    if agregados:
        DATA_PATH.write_text(
            json.dumps(nuevos_datos, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
            newline="\n",
        )

    return agregados, len(usados)


def reemplazar(texto: str, viejo: str, nuevo: str, etiqueta: str, cantidad: int = 1) -> str:
    encontradas = texto.count(viejo)
    if encontradas != cantidad:
        raise SystemExit(
            f"ERROR al migrar script.js ({etiqueta}): se esperaban {cantidad} "
            f"coincidencias y se encontraron {encontradas}. No se modificó el archivo."
        )
    return texto.replace(viejo, nuevo)


def parchear_script() -> bool:
    texto = SCRIPT_PATH.read_text(encoding="utf-8")
    if MARCADOR_JS in texto:
        return False

    original = texto

    ancla = '''function urlRelativaActual(){
    return window.location.pathname + window.location.search;
}

// --- SEO DINÁMICO PARA CADA PALABRA ---'''

    helpers = '''function urlRelativaActual(){
    return window.location.pathname + window.location.search;
}

// --- IDENTIFICADORES ÚNICOS DE PALABRAS ---
// Cada registro de palabras.json tiene un `id` estable. Desde esta versión las
// URLs, Favoritos e Historial usan ese ID en vez del texto visible de la
// palabra. buscarPalabraPorReferencia() también acepta el nombre antiguo para
// que enlaces ya compartidos como ?p=Tesis sigan funcionando.
function crearSlugIdPalabra(valor){
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function obtenerIdPalabra(p){
    if(!p) return "";
    const id = String(p.id || "").trim();
    if(id) return id;
    // Respaldo para datos externos (por ejemplo Hoja 2) que aún no traen ID.
    return crearSlugIdPalabra(p.palabra);
}

function buscarPalabraPorReferencia(referencia, coleccion = App.datos){
    const ref = String(referencia || "").trim();
    if(!ref) return null;
    const refMinuscula = ref.toLowerCase();
    const lista = Array.isArray(coleccion) ? coleccion : [];

    return lista.find(p => p && obtenerIdPalabra(p).toLowerCase() === refMinuscula)
        || lista.find(p => p && p.palabra && String(p.palabra).trim().toLowerCase() === refMinuscula)
        || null;
}

function migrarListaGuardadaAIds(clave){
    try {
        const lista = JSON.parse(localStorage.getItem(clave) || "[]");
        if(!Array.isArray(lista)) return;
        const migrada = [];

        lista.forEach(referencia => {
            const p = buscarPalabraPorReferencia(referencia, App.datos);
            const nuevaReferencia = p ? obtenerIdPalabra(p) : String(referencia || "").trim();
            if(nuevaReferencia && !migrada.includes(nuevaReferencia)) migrada.push(nuevaReferencia);
        });

        if(JSON.stringify(lista) !== JSON.stringify(migrada)){
            localStorage.setItem(clave, JSON.stringify(migrada));
        }
    } catch(error){
        console.warn("No se pudo migrar una lista guardada a IDs:", error);
    }
}

function migrarFavoritosEHistorialAIds(){
    migrarListaGuardadaAIds(CLAVE_FAVORITOS);
    migrarListaGuardadaAIds(CLAVE_HISTORIAL);
}

// --- SEO DINÁMICO PARA CADA PALABRA ---'''
    texto = reemplazar(texto, ancla, helpers, "insertar helpers de ID")

    texto = reemplazar(
        texto,
        '''function urlCanonicaPalabra(nombre){
    return SEO_LSPEDIA_BASE.url + "?p=" + encodeURIComponent(String(nombre || "").trim());
}''',
        '''function urlCanonicaPalabra(palabraOReferencia){
    const referencia = (palabraOReferencia && typeof palabraOReferencia === "object")
        ? obtenerIdPalabra(palabraOReferencia)
        : String(palabraOReferencia || "").trim();
    return SEO_LSPEDIA_BASE.url + "?p=" + encodeURIComponent(referencia);
}''',
        "canonical por ID",
    )

    texto = reemplazar(
        texto,
        '    const url = urlCanonicaPalabra(nombre);',
        '    const url = urlCanonicaPalabra(p);',
        "SEO usa ID",
    )

    texto = reemplazar(
        texto,
        '''function compartirPalabra(nombrePalabra){
    const url = window.location.origin + window.location.pathname + "?p=" + encodeURIComponent(nombrePalabra);
    const textoCompartir = `Descubre el significado de "${nombrePalabra}" en LSPedia 📖`;
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
}''',
        '''function compartirPalabra(palabraOReferencia){
    const p = (palabraOReferencia && typeof palabraOReferencia === "object")
        ? palabraOReferencia
        : buscarPalabraPorReferencia(palabraOReferencia, App.datos);
    const nombrePalabra = p && p.palabra ? p.palabra : String(palabraOReferencia || "");
    const referencia = p ? obtenerIdPalabra(p) : String(palabraOReferencia || "");
    const url = window.location.origin + window.location.pathname + "?p=" + encodeURIComponent(referencia);
    const textoCompartir = `Descubre el significado de "${nombrePalabra}" en LSPedia 📖`;
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
}''',
        "compartir por ID",
    )

    texto = reemplazar(
        texto,
        '''    ocultarPanelesGuardados();
    const nuevaUrl = window.location.pathname + "?p=" + encodeURIComponent(p.palabra);
    if(!opciones.noActualizarHistorial){
        registrarUrlEnHistorial(nuevaUrl, {
            tipo: "palabra",
            palabra: p.palabra,
            enCategorias: enCategorias
        });
    }
    actualizarSeoPalabra(p);
    agregarAHistorial(p.palabra); 
    const enFavoritos = esFavorito(p.palabra);''',
        '''    ocultarPanelesGuardados();
    const referenciaPalabra = obtenerIdPalabra(p);
    const nuevaUrl = window.location.pathname + "?p=" + encodeURIComponent(referenciaPalabra);
    if(!opciones.noActualizarHistorial){
        registrarUrlEnHistorial(nuevaUrl, {
            tipo: "palabra",
            palabra: referenciaPalabra,
            enCategorias: enCategorias
        });
    }
    actualizarSeoPalabra(p);
    agregarAHistorial(referenciaPalabra);
    const enFavoritos = esFavorito(referenciaPalabra);''',
        "mostrarPalabra URL/favoritos/historial",
    )

    texto = reemplazar(
        texto,
        '        const ahoraEnFavoritos = alternarFavorito(p.palabra);',
        '        const ahoraEnFavoritos = alternarFavorito(referenciaPalabra);',
        "botón favorito por ID",
    )
    texto = reemplazar(
        texto,
        '    if (btnCompartirDicc) btnCompartirDicc.addEventListener("click", () => compartirPalabra(p.palabra));',
        '    if (btnCompartirDicc) btnCompartirDicc.addEventListener("click", () => compartirPalabra(p));',
        "compartir diccionario por ID",
    )

    texto = reemplazar(
        texto,
        '''    ocultarPanelesGuardados();
    document.getElementById("senalDelDia").style.display = "none";
    const nuevaUrl = window.location.pathname + "?p=" + encodeURIComponent(p.palabra);
    if(!opciones.noActualizarHistorial){
        registrarUrlEnHistorial(nuevaUrl, {
            tipo: "palabra",
            palabra: p.palabra,
            enCategorias: enCategorias
        });
    }
    actualizarSeoPalabra(p);''',
        '''    ocultarPanelesGuardados();
    document.getElementById("senalDelDia").style.display = "none";
    const referenciaPalabra = obtenerIdPalabra(p);
    const nuevaUrl = window.location.pathname + "?p=" + encodeURIComponent(referenciaPalabra);
    if(!opciones.noActualizarHistorial){
        registrarUrlEnHistorial(nuevaUrl, {
            tipo: "palabra",
            palabra: referenciaPalabra,
            enCategorias: enCategorias
        });
    }
    actualizarSeoPalabra(p);''',
        "Vocabulario URL por ID",
    )
    texto = reemplazar(
        texto,
        '    if (btnCompartirVoc) btnCompartirVoc.addEventListener("click", () => compartirPalabra(p.palabra));',
        '    if (btnCompartirVoc) btnCompartirVoc.addEventListener("click", () => compartirPalabra(p));',
        "compartir vocabulario por ID",
    )

    # Las tarjetas de letra/categoría ya escapan el valor; solo cambiamos de
    # palabra visible a ID, dejando intacta su mecánica actual.
    texto = reemplazar(
        texto,
        'const nombreEscapado = p.palabra',
        'const nombreEscapado = obtenerIdPalabra(p)',
        "tarjetas usan ID",
        cantidad=3,
    )
    texto = reemplazar(
        texto,
        'mostrarPalabraPorNombreUnificado(encontrado.palabra);',
        'mostrarPalabraPorNombreUnificado(obtenerIdPalabra(encontrado));',
        "resultado exacto Vocabulario usa ID",
    )
    texto = reemplazar(
        texto,
        'mostrarPalabraPorNombreUnificado(p.palabra);',
        'mostrarPalabraPorNombreUnificado(obtenerIdPalabra(p));',
        "sugerencias Vocabulario usan ID",
        cantidad=2,
    )

    bloque_antiguo = '''function mostrarPalabraPorNombreUnificado(nombre){
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
function restaurarPalabraDesdeUrl(nombre, opciones = {}){
    const enHoja1 = App.datos.find(p => p.palabra.toLowerCase() === nombre.toLowerCase());
    if(enHoja1){
        mostrarPalabra(enHoja1, opciones);
        return;
    }
    if(window.QuizV2 && typeof QuizV2.onBancoListo === "function"){
        if(typeof QuizV2.asegurarBancoCargado === "function") QuizV2.asegurarBancoCargado();
        QuizV2.onBancoListo((banco) => {
            const enHoja2 = (banco || []).find(p => p.palabra && p.palabra.toLowerCase() === nombre.toLowerCase());
            // Solo mostramos si el usuario sigue en el resultado esperado (no navegó a otra pantalla mientras cargaba).
            if(enHoja2 && new URLSearchParams(window.location.search).get("p") === nombre){
                mostrarPalabraSimplificada(enHoja2, opciones);
            }
        });
    }
}'''

    bloque_nuevo = '''function mostrarPalabraPorNombreUnificado(referencia){
    const enHoja1 = buscarPalabraPorReferencia(referencia, App.datos);
    if(enHoja1){ mostrarPalabra(enHoja1, { enCategorias: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const enHoja2 = buscarPalabraPorReferencia(referencia, obtenerBancoHoja2());
    if(enHoja2){ mostrarPalabraSimplificada(enHoja2, { enCategorias: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

function mostrarPalabraPorNombre(referencia){
    const palabra = buscarPalabraPorReferencia(referencia, App.datos);
    if(palabra){ window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabra(palabra); }
}

function normalizarUrlLegadaPalabra(p, referencia){
    const id = obtenerIdPalabra(p);
    const ref = String(referencia || "").trim();
    if(!id || !ref || id.toLowerCase() === ref.toLowerCase()) return;

    const params = new URLSearchParams(window.location.search);
    if(params.get("p") !== ref) return;
    params.set("p", id);
    const nuevaUrl = window.location.pathname + "?" + params.toString();
    const estadoActual = window.history.state || {};
    window.history.replaceState({ ...estadoActual, palabra: id }, "", nuevaUrl);
}

// --- RESTAURAR RESULTADO AL CARGAR/REFRESCAR LA PÁGINA (?p=...) ---
// Primero busca por ID. Como compatibilidad también acepta el nombre visible
// usado por las URLs antiguas y, al encontrarlo, reemplaza la URL por su ID
// sin crear una entrada extra en el historial del navegador.
function restaurarPalabraDesdeUrl(referencia, opciones = {}){
    const enHoja1 = buscarPalabraPorReferencia(referencia, App.datos);
    if(enHoja1){
        normalizarUrlLegadaPalabra(enHoja1, referencia);
        mostrarPalabra(enHoja1, opciones);
        return;
    }
    if(window.QuizV2 && typeof QuizV2.onBancoListo === "function"){
        if(typeof QuizV2.asegurarBancoCargado === "function") QuizV2.asegurarBancoCargado();
        QuizV2.onBancoListo((banco) => {
            const enHoja2 = buscarPalabraPorReferencia(referencia, banco || []);
            // Solo mostramos si el usuario sigue en el resultado esperado (no navegó a otra pantalla mientras cargaba).
            if(enHoja2 && new URLSearchParams(window.location.search).get("p") === referencia){
                normalizarUrlLegadaPalabra(enHoja2, referencia);
                mostrarPalabraSimplificada(enHoja2, opciones);
            }
        });
    }
}'''
    texto = reemplazar(texto, bloque_antiguo, bloque_nuevo, "resolver/restaurar por ID")

    # Favoritos e Historial pueden contener nombres de versiones anteriores;
    # el resolver admite tanto nombre antiguo como ID nuevo.
    texto = reemplazar(
        texto,
        'const p = App.datos.find(i => i.palabra === nombre);',
        'const p = buscarPalabraPorReferencia(nombre, App.datos);',
        "Favoritos/Historial resuelven ID",
        cantidad=2,
    )

    # Cada vez que entra una versión de palabras.json se migran las listas
    # guardadas. La sustitución conserva la indentación original de cada sitio.
    patron = re.compile(r'^(\s*)App\.datos = obtenerDatosDiccionarioPublicables\(data\);\s*$', re.MULTILINE)
    coincidencias = list(patron.finditer(texto))
    if len(coincidencias) != 2:
        raise SystemExit(
            "ERROR al migrar script.js (migración de Favoritos/Historial): "
            f"se esperaban 2 asignaciones de App.datos y se encontraron {len(coincidencias)}."
        )
    texto = patron.sub(
        lambda m: m.group(1) + "App.datos = obtenerDatosDiccionarioPublicables(data);\n"
        + m.group(1) + "migrarFavoritosEHistorialAIds();",
        texto,
    )

    if texto == original:
        return False

    SCRIPT_PATH.write_text(texto, encoding="utf-8", newline="\n")
    return True


def main() -> int:
    agregados, total_ids = asignar_ids()
    js_cambiado = parchear_script()
    print(f"IDs añadidos: {agregados}. IDs existentes/totales: {total_ids}.")
    print("script.js migrado a IDs." if js_cambiado else "script.js ya estaba migrado a IDs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
