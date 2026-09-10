#!/usr/bin/env python3
"""Genera data/nuevas-palabras.json a partir del historial real de Git.

No supone que el orden de palabras.json sea cronológico. Busca palabras que
fueron añadidas en commits recientes y que todavía existen en el diccionario.
"""
from __future__ import annotations

import datetime as dt
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "palabras.json"
DESTINO = ROOT / "data" / "nuevas-palabras.json"
MAX_COMMITS = 100
MAX_ITEMS = 12


def normal(v: object) -> str:
    return str(v or "").strip().casefold()


def cargar_texto_git(spec: str) -> list[dict]:
    try:
        r = subprocess.run(["git", "show", spec], cwd=ROOT, text=True, capture_output=True, check=True)
        data = json.loads(r.stdout)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def clave(item: dict) -> str:
    ident = str(item.get("id") or "").strip()
    return "id:" + ident if ident else "p:" + normal(item.get("palabra"))


def main() -> int:
    actual = json.loads(DATA.read_text(encoding="utf-8"))
    if not isinstance(actual, list):
        raise SystemExit("palabras.json debe ser una lista")
    por_clave = {clave(x): x for x in actual if isinstance(x, dict) and x.get("palabra")}

    log = subprocess.run(
        ["git", "log", f"-n{MAX_COMMITS}", "--format=%H|%cI", "--", "data/palabras.json"],
        cwd=ROOT, text=True, capture_output=True, check=False,
    ).stdout.splitlines()

    detectadas: dict[str, str] = {}
    for linea in log:
        if "|" not in linea:
            continue
        sha, fecha = linea.split("|", 1)
        ahora = cargar_texto_git(f"{sha}:data/palabras.json")
        antes = cargar_texto_git(f"{sha}^:data/palabras.json")
        claves_antes = {clave(x) for x in antes if isinstance(x, dict)}
        for item in ahora:
            if not isinstance(item, dict):
                continue
            k = clave(item)
            if k in por_clave and k not in claves_antes and k not in detectadas:
                detectadas[k] = fecha

    items = []
    for k, fecha in sorted(detectadas.items(), key=lambda par: par[1], reverse=True):
        item = por_clave.get(k)
        if not item:
            continue
        items.append({
            "id": str(item.get("id") or "").strip(),
            "palabra": str(item.get("palabra") or "").strip(),
            "categoria": str(item.get("categoria") or "").strip(),
            "fecha": fecha,
        })
        if len(items) >= MAX_ITEMS:
            break

    salida = {
        "generadoEn": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "metodo": "historial-git",
        "items": items,
    }
    DESTINO.write_text(json.dumps(salida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"✅ Nuevas palabras: {len(items)} elemento(s) detectado(s) desde el historial real.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
