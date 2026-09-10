#!/usr/bin/env python3
"""Genera data/nuevas-palabras.json con palabras realmente publicadas.

Una palabra se considera publicada cuando tiene video. La fecha usada es
el commit en el que pasó de no publicable (sin video o inexistente) a
publicable. Así los borradores no aparecen como "Nuevas palabras".
"""
from __future__ import annotations

import datetime as dt
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "palabras.json"
DESTINO = ROOT / "data" / "nuevas-palabras.json"
MAX_COMMITS = 120
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


def publicable(item: dict | None) -> bool:
    if not isinstance(item, dict):
        return False
    return bool(str(item.get("palabra") or "").strip() and str(item.get("video") or "").strip())


def mapa(items: list[dict]) -> dict[str, dict]:
    return {clave(x): x for x in items if isinstance(x, dict) and x.get("palabra")}


def main() -> int:
    actual = json.loads(DATA.read_text(encoding="utf-8"))
    if not isinstance(actual, list):
        raise SystemExit("palabras.json debe ser una lista")

    por_clave = {k: x for k, x in mapa(actual).items() if publicable(x)}

    log = subprocess.run(
        ["git", "log", f"-n{MAX_COMMITS}", "--format=%H|%cI", "--", "data/palabras.json"],
        cwd=ROOT, text=True, capture_output=True, check=False,
    ).stdout.splitlines()

    detectadas: dict[str, str] = {}
    for linea in log:
        if "|" not in linea:
            continue
        sha, fecha = linea.split("|", 1)
        ahora = mapa(cargar_texto_git(f"{sha}:data/palabras.json"))
        antes = mapa(cargar_texto_git(f"{sha}^:data/palabras.json"))

        for k in por_clave:
            if k in detectadas:
                continue
            if publicable(ahora.get(k)) and not publicable(antes.get(k)):
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
        "metodo": "historial-git-publicacion-video",
        "items": items,
    }
    DESTINO.write_text(json.dumps(salida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"✅ Nuevas palabras publicadas: {len(items)} elemento(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
