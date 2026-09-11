#!/usr/bin/env python3
"""Auditoría integral de los recursos y contratos de Alfabetización."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "alfabetizacion.json"
JS = ROOT / "js" / "alfabetizacion.js"
HTML = ROOT / "index.html"
VARIANTES = ("mayuscula", "minuscula", "cursiva-mayuscula", "cursiva-minuscula")
NIVELES_EJEMPLOS = {"", "Fácil", "Medio", "Difícil"}


def txt(v: object) -> str:
    return "" if v is None else str(v).strip()


def local(ruta: str) -> Path | None:
    r = txt(ruta).replace("\\", "/")
    if not r or r.startswith(("http://", "https://")):
        return None
    while r.startswith("./"):
        r = r[2:]
    r = r.lstrip("/")
    return ROOT / r if r.startswith("img/") else None


def main() -> int:
    errores: list[str] = []
    avisos: list[str] = []
    try:
        datos = json.loads(DATA.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"❌ No se pudo leer {DATA}: {exc}")
        return 1

    alfabeto = datos.get("alfabeto", []) if isinstance(datos, dict) else []
    ejemplos = datos.get("ejemplos", []) if isinstance(datos, dict) else []
    caracteres = {(txt(x.get("tipo")), txt(x.get("caracter"))) for x in alfabeto if isinstance(x, dict)}
    vistos_ej: set[tuple[str, str]] = set()

    for fila in alfabeto:
        if not isinstance(fila, dict):
            continue
        tipo, c = txt(fila.get("tipo")), txt(fila.get("caracter"))
        if not c:
            continue

        boca = txt(fila.get("imagenBoca"))
        p_boca = local(boca)
        if not boca:
            avisos.append(f"{tipo} {c}: sin recurso de fonética (imagenBoca).")
        elif p_boca is not None and not p_boca.is_file():
            errores.append(f"{tipo} {c}: recurso de fonética no existe: {boca}")

        if tipo == "letra":
            for variante in VARIANTES:
                png = ROOT / f"img/alfabetizacion/grafias/{c}-{variante}.png"
                mp4 = ROOT / f"img/alfabetizacion/grafias/{c}-{variante}.mp4"
                if not png.is_file():
                    errores.append(f"Letra {c}: falta PNG de grafía {variante}.")
                if not mp4.is_file():
                    avisos.append(f"Letra {c}: falta MP4 de grafía {variante}; la web usará el PNG.")
        elif tipo == "numero":
            png = ROOT / f"img/alfabetizacion/grafias/{c}.png"
            mp4 = ROOT / f"img/alfabetizacion/grafias/{c}.mp4"
            if not png.is_file():
                errores.append(f"Número {c}: falta PNG de grafía.")
            if not mp4.is_file():
                avisos.append(f"Número {c}: falta MP4 de grafía; la web usará el PNG.")

        circulo = ROOT / f"img/alfabetizacion/circulo/{c}.webp"
        if not circulo.is_file() and not (tipo == "numero" and c in {"16", "17", "18", "19"}):
            avisos.append(f"{tipo} {c}: falta imagen circular; la web usará texto.")

    for i, fila in enumerate(ejemplos, 1):
        if not isinstance(fila, dict):
            errores.append(f"Ejemplo #{i}: formato inválido.")
            continue
        c = txt(fila.get("caracter"))
        palabra = txt(fila.get("palabra"))
        imagen = txt(fila.get("imagen"))
        nivel = txt(fila.get("nivel"))
        if not any(k[1].casefold() == c.casefold() for k in caracteres):
            errores.append(f"Ejemplo #{i} ({palabra or '?'}): carácter {c!r} no existe en alfabeto.")
        clave = (c.casefold(), palabra.casefold())
        if all(clave):
            if clave in vistos_ej:
                avisos.append(f"Ejemplo repetido: {c} / {palabra}.")
            vistos_ej.add(clave)
        p = local(imagen)
        if not imagen:
            avisos.append(f"Ejemplo {c}/{palabra}: sin imagen.")
        elif p is not None and not p.is_file():
            errores.append(f"Ejemplo {c}/{palabra}: imagen no existe: {imagen}")
        if nivel not in NIVELES_EJEMPLOS:
            errores.append(
                f"Ejemplo #{i} ({palabra or '?'}): nivel inválido {nivel!r}. "
                "Usar Fácil, Medio, Difícil o vacío para contenido heredado."
            )

    js = JS.read_text(encoding="utf-8") if JS.is_file() else ""
    html = HTML.read_text(encoding="utf-8") if HTML.is_file() else ""
    contratos_js = [
        "cargarImagenSenaConReintento",
        "cargarVideoGrafiaConFallback",
        "renderFonetica",
        "renderEjemploActual",
        "irACaracter",
        "cambiarTipo",
        "digitosCompuestos",
    ]
    for nombre in contratos_js:
        if nombre not in js:
            errores.append(f"Falta contrato JS esperado: {nombre}.")
    ids_html = ["alfabCaracterCirculo", "alfabBocaCaja", "alfabTrazoVideo", "alfabEjemplosSeccion"]
    for ident in ids_html:
        if f'id="{ident}"' not in html:
            errores.append(f"Falta elemento HTML #{ident} requerido por Alfabetización.")

    print("\n=== AUDITORÍA INTEGRAL Alfabetización ===")
    print(f"ℹ️ {len(alfabeto)} caracteres, {len(ejemplos)} ejemplos.")
    for a in avisos:
        print("⚠️", a)
    for e in errores:
        print("❌", e)
    print(f"Resumen: {len(errores)} error(es), {len(avisos)} aviso(s).")
    return 1 if errores else 0


if __name__ == "__main__":
    raise SystemExit(main())