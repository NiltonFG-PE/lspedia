#!/usr/bin/env python3
"""Valida que el panel Analytics conserve sus capacidades principales.

No consulta GA4 ni usa credenciales. Solo verifica contratos de código entre
backend Apps Script y frontend Admin para detectar regresiones antes de publicar.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def exigir(texto, requeridos, nombre):
    faltantes = [item for item in requeridos if item not in texto]
    if faltantes:
        raise AssertionError(f"{nombre} perdió capacidades: {', '.join(faltantes)}")


def main():
    try:
        backend = (ROOT / "apps-script" / "admin_busquedas_ga4.gs").read_text(encoding="utf-8")
        frontend = (ROOT / "admin" / "busquedas.html").read_text(encoding="utf-8")
        diagnostico = (ROOT / "admin" / "busquedas-diagnostico.js").read_text(encoding="utf-8")

        exigir(
            backend,
            [
                'modo !== "admin_busquedas" && modo !== "admin_analytics"',
                'activeUsers',
                'sessions',
                'screenPageViews',
                'eventCount',
                'engagementRate',
                'sessionSource',
                'sessionMedium',
                'country',
                'city',
                'deviceCategory',
                'EVENTOS_ERROR',
                'busquedasPopulares',
                'busquedasPorSeccion',
                'busquedasSinResultadoPorSeccion',
                'runRealtimeReport',
                'runReport',
            ],
            "backend Analytics",
        )

        exigir(
            frontend,
            [
                'id="rtActive"',
                'id="sumUsers"',
                'id="sumSessions"',
                'id="sumViews"',
                'id="sumEvents"',
                'id="sumEngaged"',
                'id="sumRate"',
                'id="sumNoResults"',
                'id="sumErrors"',
                'id="sourceList"',
                'id="pageList"',
                'id="countryList"',
                'id="cityList"',
                'id="geoMap"',
                'id="eventList"',
                'id="errTotal"',
                'google.visualization.GeoChart',
            ],
            "frontend Analytics",
        )

        # El JSONP administrativo solo puede apuntar al host oficial de Apps Script.
        exigir(
            diagnostico,
            [
                'script.google.com',
                '/exec',
            ],
            "barrera JSONP del Admin",
        )

        print("Admin Analytics validado: realtime, resumen, tráfico, páginas, geografía, búsquedas y errores.")
        return 0
    except Exception as exc:
        print(f"ERROR Admin Analytics: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
