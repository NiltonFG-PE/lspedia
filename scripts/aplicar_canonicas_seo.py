#!/usr/bin/env python3
"""Alinea las canonicals dinámicas de la SPA con las páginas SEO estáticas.

El parche es intencionalmente conservador: solo reemplaza bloques exactos
conocidos y falla si no los encuentra, para no modificar código desconocido.
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
                : "https://lspedia.site/palabra/" + encodeURIComponent(referenciaSeo) + "/";'''

BLOQUE_SCRIPT_ANTERIOR = '''function urlCanonicaPalabra(palabraOReferencia){
    if(palabraOReferencia && typeof palabraOReferencia === "object"){
        return construirUrlPalabra(SEO_LSPEDIA_BASE.url, palabraOReferencia);
    }
    // Compatibilidad: una referencia suelta, sin información de fuente,
    // continúa significando Diccionario como en los enlaces históricos.
    return SEO_LSPEDIA_BASE.url + "?p=" + encodeURIComponent(String(palabraOReferencia || "").trim());
}'''

BLOQUE_SCRIPT_NUEVO = '''function normalizarReferenciaSeo(valor){
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
        + (fuente === "vocabulario" ? "vocabulario/" : "palabra/")
        + encodeURIComponent(referenciaSeo)
        + "/";
}'''


def reemplazar_unico(ruta: Path, anterior: str, nuevo: str, etiqueta: str) -> bool:
    contenido = ruta.read_text(encoding="utf-8")
    if nuevo in contenido:
        print(f"{etiqueta}: ya estaba actualizado.")
        return False
    cantidad = contenido.count(anterior)
    if cantidad != 1:
        raise SystemExit(
            f"ERROR: se esperaban 1 bloque de {etiqueta} y se encontraron {cantidad}. "
            "No se modificó el archivo."
        )
    ruta.write_text(contenido.replace(anterior, nuevo, 1), encoding="utf-8", newline="\n")
    print(f"{etiqueta}: canonical alineada con páginas SEO estáticas.")
    return True


def main() -> int:
    repo = Path(__file__).resolve().parent.parent
    reemplazar_unico(repo / "index.html", BLOQUE_INDEX_ANTERIOR, BLOQUE_INDEX_NUEVO, "index.html")
    reemplazar_unico(repo / "js" / "script.js", BLOQUE_SCRIPT_ANTERIOR, BLOQUE_SCRIPT_NUEVO, "js/script.js")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
