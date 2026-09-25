#!/usr/bin/env python3
"""Valida que el panel Analytics conserve sus capacidades principales.

No consulta GA4 ni usa credenciales. Solo verifica contratos de código entre
backend Apps Script y frontend Admin para detectar regresiones antes de publicar.
También protege la tolerancia a arranques lentos de Apps Script: timeout amplio,
reintentos automáticos y conservación del último dashboard durante una recarga.
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
        frontend = (ROOT / "admin" / "index.html").read_text(encoding="utf-8")
        legado = (ROOT / "admin" / "busquedas.html").read_text(encoding="utf-8")
        dashboard = (ROOT / "admin" / "admin-dashboard.js").read_text(encoding="utf-8")
        cargador = (ROOT / "admin" / "admin-estadisticas-instantaneas.js").read_text(encoding="utf-8")
        vistas = (ROOT / "admin" / "admin-vistas-completas.js").read_text(encoding="utf-8")
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

        # busquedas.html ahora redirige al panel unificado. Comprobar los módulos
        # realmente cargados y sus capacidades, no IDs de la interfaz retirada.
        exigir(legado, ['location.replace(destino)', './#busquedas', './#estadisticas'], "redirección del Admin anterior")
        exigir(frontend, ['id="dashboard"', 'id="accessPanel"', 'id="btnRefresh"',
                          'admin-dashboard.js', 'admin-estadisticas-instantaneas.js'], "entrada del Admin")
        exigir(cargador, ['admin-vistas-completas.js'], "cargador de vistas Analytics")
        exigir(vistas, [
            "function createSearchView()", "function renderSearch()", "function createStatsView()",
            "function renderStatsData(data,isFallback)", "id=\"lspStatsBody\"", "id=\"lspGeoMap\"",
            "rt.activos", "r.usuarios", "r.sesiones", "r.vistas", "r.eventos",
            "r.sesionesConInteraccion", "r.tasaInteraccion", "miss.totalBusquedas",
            "data.fuentes", "data.paginas", "data.paises", "data.ciudades", "data.eventos",
            "err.total", "err.imagen", "err.media", "err.runtime", "google.visualization.GeoChart",
            "busquedasSinResultadoPorSeccion", "busquedasPopulares", "function exportCsv()",
            "45000", "cacheRead(state.statsPeriod)", "if(fallback&&!data&&!force)",
        ], "vistas Analytics actuales")
        exigir(dashboard, [
            "async function analytics(period,force)", "for(const delay of [0,1200])",
            "cacheSet(period,d)", "38000", "state.data7=await analytics('7',force)",
            "state.data30=await analytics('30',force)", "state.dataAll=await analytics('todo',force)",
            "Analytics no pudo cargar los datos esenciales", "const token=++state.loadToken",
        ], "carga progresiva y recuperación de Analytics")

        # El JSONP administrativo solo puede apuntar al host oficial de Apps Script.
        exigir(
            diagnostico,
            [
                'script.google.com',
                '/exec',
            ],
            "barrera JSONP del Admin",
        )

        print(
            "Admin Analytics validado: realtime, resumen, tráfico, páginas, geografía, "
            "búsquedas, errores y conexión resiliente con reintentos."
        )
        return 0
    except Exception as exc:
        print(f"ERROR Admin Analytics: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
