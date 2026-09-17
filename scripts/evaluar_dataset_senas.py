#!/usr/bin/env python3
"""Auditor técnico del dataset experimental de señas de LSPedia.

No entrena ni inventa señas. Comprueba estructura, balance y separación por
participante para evitar medir precisión con muestras de la misma persona en
entrenamiento y prueba.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "data" / "senas-ia-dataset.json"


def texto(v):
    return str(v or "").strip()


def etiqueta(muestra):
    return texto(muestra.get("etiqueta") or muestra.get("concepto") or muestra.get("label"))


def participante(muestra):
    return texto(
        muestra.get("participanteId")
        or muestra.get("personaId")
        or muestra.get("signerId")
        or muestra.get("participante")
    )


def dimension_muestra(muestra):
    valor = muestra.get("vectorDimension")
    if isinstance(valor, int) and valor > 0:
        return valor
    frames = muestra.get("frames")
    if isinstance(frames, list) and frames:
        primero = frames[0]
        if isinstance(primero, list):
            return len(primero)
        if isinstance(primero, dict):
            vector = primero.get("vector") or primero.get("features")
            if isinstance(vector, list):
                return len(vector)
    vector = muestra.get("vector") or muestra.get("features")
    return len(vector) if isinstance(vector, list) else 0


def particion_por_persona(personas):
    """Separa personas completas; nunca muestras individuales."""
    orden = sorted(set(personas), key=lambda p: hashlib.sha256(p.encode("utf-8")).hexdigest())
    if len(orden) < 2:
        return orden, []
    cantidad_prueba = max(1, round(len(orden) * 0.2))
    prueba = orden[-cantidad_prueba:]
    entrenamiento = orden[:-cantidad_prueba]
    return entrenamiento, prueba


def main():
    data = json.loads(DATASET.read_text(encoding="utf-8"))
    muestras = data.get("muestras") if isinstance(data.get("muestras"), list) else []
    conceptos_declarados = data.get("conceptos") if isinstance(data.get("conceptos"), list) else []
    compatibles = set(data.get("vectorDimensionsCompatibles") or [])

    print("=== LSPedia · auditor de dataset de señas ===")
    print(f"Formato: {texto(data.get('formato')) or 'sin declarar'}")
    print(f"Muestras: {len(muestras)}")
    print(f"Conceptos declarados: {len(conceptos_declarados)}")

    if not muestras:
        print("ESTADO: estructura válida, pero todavía no hay muestras reales.")
        print("PRECISION: no se puede estimar sin muestras y sin separación por participante.")
        return

    etiquetas = [etiqueta(m) for m in muestras]
    sin_etiqueta = sum(not x for x in etiquetas)
    por_concepto = Counter(x for x in etiquetas if x)
    personas = [participante(m) for m in muestras]
    sin_persona = sum(not x for x in personas)
    por_persona = Counter(x for x in personas if x)
    dimensiones = Counter(dimension_muestra(m) for m in muestras)

    print("Muestras por concepto:")
    for nombre, cantidad in sorted(por_concepto.items()):
        print(f"  - {nombre}: {cantidad}")
    print(f"Participantes identificados: {len(por_persona)}")
    print(f"Muestras sin participante: {sin_persona}")
    print(f"Dimensiones observadas: {dict(sorted(dimensiones.items()))}")

    problemas = []
    if sin_etiqueta:
        problemas.append(f"{sin_etiqueta} muestra(s) sin concepto/etiqueta")
    if sin_persona:
        problemas.append(
            f"{sin_persona} muestra(s) sin identificador de participante; no deben usarse para una medición final de precisión"
        )
    dimensiones_invalidas = [d for d in dimensiones if d and compatibles and d not in compatibles]
    if dimensiones_invalidas:
        problemas.append("dimensiones no declaradas como compatibles: " + ", ".join(map(str, dimensiones_invalidas)))
    if 0 in dimensiones:
        problemas.append(f"{dimensiones[0]} muestra(s) cuya dimensión no pudo inferirse")

    personas_validas = sorted(por_persona)
    train, test = particion_por_persona(personas_validas)
    if test:
        print("Separación recomendada por participante:")
        print("  Entrenamiento: " + ", ".join(train))
        print("  Prueba: " + ", ".join(test))
        print("  Regla: ninguna persona de prueba debe aparecer en entrenamiento.")
    else:
        problemas.append("se necesitan al menos dos participantes identificados para una separación train/test por persona")

    # Detecta conceptos que solo aparecen con una persona; no invalida la muestra,
    # pero impide saber si el sistema generaliza entre firmantes.
    personas_por_concepto = defaultdict(set)
    for muestra in muestras:
        e = etiqueta(muestra)
        p = participante(muestra)
        if e and p:
            personas_por_concepto[e].add(p)
    unipersonales = sorted(e for e, ps in personas_por_concepto.items() if len(ps) < 2)
    if unipersonales:
        problemas.append("conceptos representados por una sola persona: " + ", ".join(unipersonales))

    if problemas:
        print("AVISOS:")
        for problema in problemas:
            print("  - " + problema)
    else:
        print("ESTADO: dataset estructuralmente apto para iniciar una evaluación por participante.")

    print("PRECISION: este auditor no inventa un porcentaje. La precisión debe calcularse con predicciones reales sobre el conjunto de prueba separado por participante.")


if __name__ == "__main__":
    main()
