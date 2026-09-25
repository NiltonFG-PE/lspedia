#!/usr/bin/env python3
"""Publica cambios automáticos sin forzar ni sobrescribir ediciones concurrentes.

Solo resuelve conflictos en resultados regenerables. Un conflicto en datos
fuente o código aborta el rebase y falla explícitamente para conservar ambos.
"""
from pathlib import Path
import os
import subprocess
import sys


def git(repo, *args, check=True):
    return subprocess.run(
        ["git", *args], cwd=repo, text=True, capture_output=True, check=check,
        env={**os.environ, "GIT_EDITOR": "true", "GIT_TERMINAL_PROMPT": "0"},
    )


def es_generado(path):
    return path in {"sitemap.xml", "data/nuevas-palabras.json"} or (
        path.startswith(("diccionario/", "vocabulario/", "categoria/")) and
        (path.endswith("/index.html") or path.endswith("/.lspedia-seo-generated"))
    )


def incorporar_remoto(repo, branch):
    git(repo, "fetch", "origin", f"{branch}:refs/remotes/origin/{branch}")
    result = git(repo, "rebase", f"origin/{branch}", check=False)
    while result.returncode:
        conflictos = git(repo, "diff", "--name-only", "--diff-filter=U").stdout.splitlines()
        if not conflictos or not all(es_generado(p) for p in conflictos):
            git(repo, "rebase", "--abort", check=False)
            raise RuntimeError("No se sobrescribieron datos fuente. Revisar conflicto: " +
                               ", ".join(conflictos or [result.stderr.strip()]))
        for path in conflictos:
            # Durante un rebase, ours es la versión remota ya incorporada.
            existe = git(repo, "cat-file", "-e", ":2:" + path, check=False).returncode == 0
            if existe:
                git(repo, "checkout", "--ours", "--", path)
                git(repo, "add", "--", path)
            else:
                git(repo, "rm", "--", path)
        sin_cambios = git(repo, "diff", "--cached", "--quiet", check=False).returncode == 0
        result = git(repo, "rebase", "--skip" if sin_cambios else "--continue", check=False)


def regenerar(repo):
    for nombre in ("generar_paginas_seo.py", "generar_sitemap.py",
                   "actualizar_nuevas_palabras.py",
                   "validar_sitemap_publico.py"):
        subprocess.run([sys.executable, str(repo / "scripts" / nombre)], cwd=repo, check=True)
    git(repo, "add", "-A", "--", "diccionario", "vocabulario", "categoria", "sitemap.xml",
        "data/nuevas-palabras.json")


def publicar(repo, branch="develop", generar=regenerar, intentos=3):
    repo = Path(repo)
    if git(repo, "status", "--porcelain").stdout.strip():
        raise RuntimeError("Guardar primero los cambios locales en un commit.")
    for intento in range(intentos):
        incorporar_remoto(repo, branch)
        generar(repo)
        if git(repo, "diff", "--cached", "--quiet", check=False).returncode:
            git(repo, "commit", "-m", "Sincronizar páginas públicas con los datos vigentes")
        if git(repo, "rev-list", "--count", f"origin/{branch}..HEAD").stdout.strip() == "0":
            print("Publicación ya actualizada.")
            return
        resultado = git(repo, "push", "origin", f"HEAD:{branch}", check=False)
        if resultado.returncode == 0:
            print("Publicación automática actualizada sin forzar historial.")
            return
        print(f"No se pudo guardar (intento {intento + 1}/{intentos}); comprobando cambios remotos.")
    raise RuntimeError("No se pudo publicar tras tres intentos; el remoto permanece intacto. Reejecutar la automatización.")


if __name__ == "__main__":
    publicar(Path(__file__).resolve().parents[1])
