#!/usr/bin/env python3
"""Alinea las canonicals dinámicas de la SPA con las páginas SEO estáticas.

Solo las fichas que cumplen los mismos requisitos de publicación del sitemap
apuntan a una página SEO estática. Las fichas antiguas o incompletas conservan
la portada como canonical, evitando canonicals hacia páginas 404.
"""
from pathlib import Path


BLOQUE_INDEX_ANTERIOR = '''            const fuente = (params.get("fuente") || "").trim().toLowerCase();
            const esVocabulario = fuente === "vocabulario";

            const url = esVocabulario
                ? "https://lspedia.site/?vista=vocabulario&p=" + encodeURIComponent(palabra) + "&fuente=vocabulario"
                : "https://lspedia.site/?p=" + encodeURIComponent(palabra);'''

BLOQUE_INDEX_NUEVO = '''            const fuente = (params.get("fuente") || "").trim().toLowerCase();
            const vista = (params.get("vista") || "").trim().toLowerCase();
            const esVocabulario = fuente === "vocabulario" || vista === "vocabulario";
            const referenciaSeo = palabra
                .normalize("NFD")
                .replace(/[\\u0300-\\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

            const url = esVocabulario
                ? "https://lspedia.site/vocabulario/" + encodeURIComponent(referenciaSeo) + "/"
                : "https://lspedia.site/diccionario/" + encodeURIComponent(referenciaSeo) + "/";'''

BLOQUE_SCRIPT_ORIGINAL = '''function urlCanonicaPalabra(palabraOReferencia){
    if(palabraOReferencia && typeof palabraOReferencia === "object"){
        return construirUrlPalabra(SEO_LSPEDIA_BASE.url, palabraOReferencia);
    }
    // Compatibilidad: una referencia suelta, sin información de fuente,
    // continúa significando Diccionario como en los enlaces históricos.
    return SEO_LSPEDIA_BASE.url + "?p=" + encodeURIComponent(String(palabraOReferencia || "").trim());
}'''

BLOQUE_SCRIPT_V1 = '''function normalizarReferenciaSeo(valor){
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function urlCanonicaPalabra(palabraOReferencia){
    let referencia = palabraOReferencia;
    let fuente = "diccionario";

    if(palabraOReferencia && typeof palabraOReferencia === "object"){
        referencia = obtenerIdPalabra(palabraOReferencia);
        fuente = obtenerFuentePalabra(palabraOReferencia);
    }

    const referenciaSeo = normalizarReferenciaSeo(referencia);
    if(!referenciaSeo) return SEO_LSPEDIA_BASE.url;

    return SEO_LSPEDIA_BASE.url
        + (fuente === "vocabulario" ? "vocabulario/" : "diccionario/")
        + encodeURIComponent(referenciaSeo)
        + "/";
}'''

BLOQUE_SCRIPT_V2 = '''function normalizarReferenciaSeo(valor){
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function tieneImagenSeoPublicable(valor){
    const principal = String(valor || "").split(",", 1)[0].trim();
    if(!principal) return false;
    const tienePrefijo = /^(?:https?:\\/\\/|\\/|\\.\\.?\\/|img\\/)/i.test(principal);
    const tieneExtension = /\\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(principal);
    return tienePrefijo && tieneExtension;
}

function tienePaginaSeoPublicada(p){
    if(!p || typeof p !== "object") return false;
    const palabra = String(p.palabra || "").trim();
    const categoria = String(p.categoria || "").trim();
    const imagenOk = tieneImagenSeoPublicable(p.imagen);
    if(!palabra || !categoria || !imagenOk) return false;
    if(obtenerFuentePalabra(p) === "vocabulario") return true;
    return Boolean(String(p.definicion || "").trim());
}

function urlCanonicaPalabra(palabraOReferencia){
    let referencia = palabraOReferencia;
    let fuente = "diccionario";

    if(palabraOReferencia && typeof palabraOReferencia === "object"){
        if(!tienePaginaSeoPublicada(palabraOReferencia)){
            return SEO_LSPEDIA_BASE.url;
        }
        referencia = obtenerIdPalabra(palabraOReferencia);
        fuente = obtenerFuentePalabra(palabraOReferencia);
    }

    const referenciaSeo = normalizarReferenciaSeo(referencia);
    if(!referenciaSeo) return SEO_LSPEDIA_BASE.url;

    return SEO_LSPEDIA_BASE.url
        + (fuente === "vocabulario" ? "vocabulario/" : "diccionario/")
        + encodeURIComponent(referenciaSeo)
        + "/";
}'''


def aplicar_index(ruta: Path) -> None:
    contenido = ruta.read_text(encoding="utf-8")
    if BLOQUE_INDEX_NUEVO in contenido:
        print("index.html: ya estaba actualizado.")
        return

    bloque_previo = BLOQUE_INDEX_NUEVO.replace("/diccionario/", "/palabra/")
    if bloque_previo in contenido:
        ruta.write_text(
            contenido.replace(bloque_previo, BLOQUE_INDEX_NUEVO, 1),
            encoding="utf-8",
            newline="\n",
        )
        print("index.html: canonical migrada de /palabra/ a /diccionario/.")
        return

    if contenido.count(BLOQUE_INDEX_ANTERIOR) != 1:
        raise SystemExit("ERROR: no se encontró el bloque canonical esperado en index.html.")
    ruta.write_text(
        contenido.replace(BLOQUE_INDEX_ANTERIOR, BLOQUE_INDEX_NUEVO, 1),
        encoding="utf-8",
        newline="\n",
    )
    print("index.html: canonical alineada con páginas SEO estáticas.")


def aplicar_script(ruta: Path) -> None:
    contenido = ruta.read_text(encoding="utf-8")
    if BLOQUE_SCRIPT_V2 in contenido:
        print("js/script.js: ya estaba actualizado.")
        return

    bloque_v2_previo = BLOQUE_SCRIPT_V2.replace('"diccionario/"', '"palabra/"')
    bloque_v1_previo = BLOQUE_SCRIPT_V1.replace('"diccionario/"', '"palabra/"')

    if bloque_v2_previo in contenido:
        contenido = contenido.replace(bloque_v2_previo, BLOQUE_SCRIPT_V2, 1)
    elif bloque_v1_previo in contenido:
        contenido = contenido.replace(bloque_v1_previo, BLOQUE_SCRIPT_V2, 1)
    elif BLOQUE_SCRIPT_V1 in contenido:
        contenido = contenido.replace(BLOQUE_SCRIPT_V1, BLOQUE_SCRIPT_V2, 1)
    elif BLOQUE_SCRIPT_ORIGINAL in contenido:
        contenido = contenido.replace(BLOQUE_SCRIPT_ORIGINAL, BLOQUE_SCRIPT_V2, 1)
    else:
        raise SystemExit("ERROR: no se encontró una versión conocida de urlCanonicaPalabra en js/script.js.")
    ruta.write_text(contenido, encoding="utf-8", newline="\n")
    print("js/script.js: canonical pública solo si existe página SEO estática.")


def main() -> int:
    repo = Path(__file__).resolve().parent.parent
    aplicar_index(repo / "index.html")
    aplicar_script(repo / "js" / "script.js")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
