#!/usr/bin/env python3
"""Integra en script.js la regla pública vigente del Diccionario.

Migración idempotente de una sola función. No toca navegación, formularios,
autoplay ni otras partes del archivo grande.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "js" / "script.js"

ANTIGUO = '''function obtenerDatosDiccionarioPublicables(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(p => p && p.palabra && p.categoria && p.video && String(p.video).trim());
}'''

NUEVO = '''function obtenerDatosDiccionarioPublicables(data) {
    if (!Array.isArray(data)) return [];

    // Regla pública vigente: palabra + categoría + imagen real.
    // El video es opcional. Si security.js ya instaló el filtro compartido,
    // se reutiliza para mantener una única definición en tiempo de ejecución.
    try {
        if (window.LSPediaPublicacionDiccionario &&
            typeof window.LSPediaPublicacionDiccionario.filtrar === 'function') {
            return window.LSPediaPublicacionDiccionario.filtrar(data);
        }
    } catch (_error) {}

    return data.filter(function (p) {
        if (!(p && p.palabra && p.categoria)) return false;
        const imagen = String(p.imagen || '').split(',')[0].trim();
        if (!imagen) return false;
        return /^(?:https?:\\/\\/|\\/|\\.\\.?\\/|img\\/)/i.test(imagen) &&
            /\\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(imagen);
    });
}'''


def main():
    texto = PATH.read_text(encoding="utf-8")
    if NUEVO in texto:
        print("La regla canónica por imagen ya está integrada.")
        return 0
    if ANTIGUO not in texto:
        print("ERROR: no se encontró exactamente la función histórica esperada; no se modifica script.js.", file=sys.stderr)
        return 1
    actualizado = texto.replace(ANTIGUO, NUEVO, 1)
    PATH.write_text(actualizado, encoding="utf-8", newline="\n")
    print("Regla pública integrada en js/script.js: imagen real obligatoria, video opcional.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
