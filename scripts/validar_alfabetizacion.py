#!/usr/bin/env python3
"""Valida data/alfabetizacion.json antes de publicarlo."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUTA = ROOT / "data" / "alfabetizacion.json"


def texto(valor: object) -> str:
    return "" if valor is None else str(valor).strip()


def ruta_local_media(valor: object) -> Path | None:
    ruta = texto(valor).replace("\\", "/")
    if not ruta or ruta.startswith(("http://", "https://")):
        return None
    while ruta.startswith("./"):
        ruta = ruta[2:]
    ruta = ruta.lstrip("/")
    if not ruta.startswith("img/"):
        return None
    return ROOT / ruta


def validar_recursos_derivados(alfabeto: list[dict], errores: list[str], advertencias: list[str]) -> None:
    variantes = ("mayuscula", "minuscula", "cursiva-mayuscula", "cursiva-minuscula")

    for fila in alfabeto:
        if not isinstance(fila, dict):
            continue
        tipo = texto(fila.get("tipo"))
        caracter = texto(fila.get("caracter"))
        if not caracter or tipo not in {"letra", "numero"}:
            continue

        if tipo == "letra":
            recursos = [
                (ROOT / f"img/alfabetizacion/grafias/{caracter}-{variante}.png", True, variante)
                for variante in variantes
            ] + [
                (ROOT / f"img/alfabetizacion/grafias/{caracter}-{variante}.mp4", False, variante)
                for variante in variantes
            ]
        else:
            recursos = [
                (ROOT / f"img/alfabetizacion/grafias/{caracter}.png", True, "numero"),
                (ROOT / f"img/alfabetizacion/grafias/{caracter}.mp4", False, "numero"),
            ]

        for ruta, obligatoria, variante in recursos:
            if ruta.is_file():
                continue
            relativa = ruta.relative_to(ROOT).as_posix()
            if obligatoria:
                errores.append(
                    f"{tipo.capitalize()} {caracter}: falta imagen estática de grafía ({variante}): {relativa}"
                )
            else:
                advertencias.append(
                    f"{tipo.capitalize()} {caracter}: falta animación de grafía ({variante}); se usará la PNG: {relativa}"
                )

        circulo = ROOT / f"img/alfabetizacion/circulo/{caracter}.webp"
        if not circulo.is_file() and not (tipo == "numero" and caracter in {"16", "17", "18", "19"}):
            advertencias.append(
                f"{tipo.capitalize()} {caracter}: falta imagen de seña circular; se usará texto: "
                f"{circulo.relative_to(ROOT).as_posix()}"
            )


def main() -> int:
    errores: list[str] = []
    advertencias: list[str] = []

    try:
        datos = json.loads(RUTA.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"❌ Alfabetización: JSON inválido o inexistente: {exc}")
        return 1

    if not isinstance(datos, dict) or datos.get("ok") is not True:
        errores.append("La raíz debe ser un objeto con ok=true.")

    alfabeto = datos.get("alfabeto") if isinstance(datos, dict) else None
    ejemplos = datos.get("ejemplos") if isinstance(datos, dict) else None
    if not isinstance(alfabeto, list) or not alfabeto:
        errores.append("'alfabeto' debe ser una lista no vacía.")
        alfabeto = []
    if not isinstance(ejemplos, list):
        errores.append("'ejemplos' debe ser una lista.")
        ejemplos = []

    vistos: set[tuple[str, str]] = set()
    letras = 0
    numeros = 0
    for i, fila in enumerate(alfabeto, 1):
        if not isinstance(fila, dict):
            errores.append(f"Alfabeto #{i}: no es un objeto.")
            continue
        permitidos = {"tipo", "caracter", "imagenBoca"}
        extras = set(fila) - permitidos
        if extras:
            errores.append(f"Alfabeto #{i}: campos no permitidos: {sorted(extras)}")
        tipo = texto(fila.get("tipo"))
        caracter = texto(fila.get("caracter"))
        if tipo not in {"letra", "numero"}:
            errores.append(f"Alfabeto #{i}: tipo inválido {tipo!r}.")
        if not caracter or len(caracter) > 4:
            errores.append(f"Alfabeto #{i}: carácter inválido {caracter!r}.")
        clave = (tipo, caracter.casefold())
        if all(clave):
            if clave in vistos:
                errores.append(f"Alfabeto: carácter duplicado {tipo}/{caracter}.")
            vistos.add(clave)
        if tipo == "letra":
            letras += 1
        elif tipo == "numero":
            numeros += 1
        imagen_boca = texto(fila.get("imagenBoca"))
        if not imagen_boca:
            advertencias.append(f"Alfabeto #{i} ({caracter}): sin imagenBoca.")
        else:
            local = ruta_local_media(imagen_boca)
            if local is not None and not local.is_file():
                errores.append(f"Alfabeto #{i} ({caracter}): imagenBoca local no existe: {imagen_boca}")

    validar_recursos_derivados(alfabeto, errores, advertencias)

    for i, fila in enumerate(ejemplos, 1):
        if not isinstance(fila, dict):
            errores.append(f"Ejemplo #{i}: no es un objeto.")
            continue
        permitidos = {"caracter", "palabra", "imagen", "orden"}
        extras = set(fila) - permitidos
        if extras:
            errores.append(f"Ejemplo #{i}: campos no permitidos: {sorted(extras)}")
        if not texto(fila.get("caracter")):
            errores.append(f"Ejemplo #{i}: falta caracter.")
        if not texto(fila.get("palabra")):
            errores.append(f"Ejemplo #{i}: falta palabra.")
        if not texto(fila.get("imagen")):
            advertencias.append(f"Ejemplo #{i} ({texto(fila.get('palabra'))}): sin imagen.")
        if not isinstance(fila.get("orden"), int):
            errores.append(f"Ejemplo #{i}: orden debe ser entero.")

    if letras == 0:
        errores.append("No hay letras en el alfabeto.")
    if numeros == 0:
        advertencias.append("No hay números en el alfabeto.")

    print("\n=== VALIDACIÓN Alfabetización ===")
    print(f"ℹ️  {len(alfabeto)} caracteres: {letras} letras y {numeros} números.")
    print(f"ℹ️  {len(ejemplos)} ejemplos.")
    for aviso in advertencias:
        print(f"⚠️  {aviso}")
    for error in errores:
        print(f"❌ {error}")
    print(f"Resumen: {len(errores)} error(es), {len(advertencias)} advertencia(s).")
    return 1 if errores else 0


if __name__ == "__main__":
    raise SystemExit(main())
