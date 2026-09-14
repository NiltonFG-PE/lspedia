#!/usr/bin/env python3
"""Ajuste idempotente de security.js tras integrar la regla canónica.

- Deja de sobrescribir obtenerDatosDiccionarioPublicables: script.js ya es correcto.
- Estadísticas de Vocabulario usan la fuente pública por imagen, no el banco del Quiz.
- El refresco escucha lspedia:vocabularioPublicoListo.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "js" / "security.js"

CAMBIOS = [
('''    function bancoVocabulario() {
        try {
            if (window.QuizV2 && typeof window.QuizV2.obtenerBanco === 'function') {
                const banco = window.QuizV2.obtenerBanco();
                return Array.isArray(banco) ? banco : [];
            }
        } catch (_error) {}
        return [];
    }''', '''    function bancoVocabulario() {
        // La fuente pública de Vocabulario se rige por imagen real; el banco
        // interno del Quiz puede exigir video y no debe definir estadísticas.
        try {
            if (window.LSPediaVocabularioPublico &&
                typeof window.LSPediaVocabularioPublico.obtener === 'function') {
                const bancoPublico = window.LSPediaVocabularioPublico.obtener();
                if (Array.isArray(bancoPublico)) return bancoPublico;
            }
        } catch (_error) {}
        try {
            if (typeof window.obtenerBancoHoja2 === 'function') {
                const banco = window.obtenerBancoHoja2();
                return Array.isArray(banco) ? banco.filter(function (p) {
                    return p && texto(p.palabra) && texto(p.categoria) && esImagenReal(p.imagen);
                }) : [];
            }
        } catch (_error) {}
        return [];
    }'''),
('''        const vocabPalabras = vocabulario.filter(function (p) {
            return p && texto(p.palabra) && videoValido(p.video);
        });''', '''        const vocabPalabras = vocabulario.filter(function (p) {
            return p && texto(p.palabra) && texto(p.categoria) && esImagenReal(p.imagen);
        });'''),
('''    function instalarFiltroEnScriptBase() {
        if (typeof window.obtenerDatosDiccionarioPublicables === 'function' &&
            window.obtenerDatosDiccionarioPublicables !== filtrarPublicables) {
            window.obtenerDatosDiccionarioPublicables = filtrarPublicables;
        }
        window.LSPediaPublicacionDiccionario = Object.freeze({''', '''    function instalarFiltroEnScriptBase() {
        // script.js ya contiene la regla canónica por imagen. Aquí solo se
        // publica la utilidad compartida para evitar sobrescribir la función base.
        window.LSPediaPublicacionDiccionario = Object.freeze({'''),
('''    function registrarActualizacionVocabulario(intentosRestantes) {
        if (bancoVocabularioRegistrado) return;
        try {
            if (window.QuizV2 && typeof window.QuizV2.onBancoListo === 'function') {
                bancoVocabularioRegistrado = true;
                window.QuizV2.onBancoListo(function () {
                    if (window.App && Array.isArray(window.App.datos)) actualizarEstadisticasPublicadas(window.App.datos);
                });
                return;
            }
        } catch (_error) {}
        if ((intentosRestantes || 0) > 0) {
            setTimeout(function () { registrarActualizacionVocabulario(intentosRestantes - 1); }, 350);
        }
    }''', '''    function registrarActualizacionVocabulario() {
        if (bancoVocabularioRegistrado) return;
        bancoVocabularioRegistrado = true;
        document.addEventListener('lspedia:vocabularioPublicoListo', function () {
            if (window.App && Array.isArray(window.App.datos)) {
                actualizarEstadisticasPublicadas(window.App.datos);
            }
        });
    }'''),
('''    // security.js se registra antes que script.js. En DOMContentLoaded este
    // listener corre primero y reemplaza la regla histórica ANTES de que
    // App.iniciar haga su primer filtrado: así nunca aparece una palabra sin
    // imagen ni siquiera durante la carga inicial.''', '''    // security.js se registra antes que script.js. En DOMContentLoaded deja
    // disponible la utilidad compartida y refresca la fuente real sin sustituir
    // la función canónica de publicación que ya vive en script.js.'''),
]


def main():
    texto = PATH.read_text(encoding="utf-8")
    aplicado = 0
    for antiguo, nuevo in CAMBIOS:
        if nuevo in texto:
            continue
        if antiguo not in texto:
            print("ERROR: no se encontró un bloque esperado; no se escribe security.js.", file=sys.stderr)
            return 1
        texto = texto.replace(antiguo, nuevo, 1)
        aplicado += 1

    # La llamada histórica puede pasar un número; la nueva función ignora args,
    # así que no necesita modificar otros puntos del archivo para ser compatible.
    PATH.write_text(texto, encoding="utf-8", newline="\n")
    print(f"security.js ajustado; bloques modificados={aplicado}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
