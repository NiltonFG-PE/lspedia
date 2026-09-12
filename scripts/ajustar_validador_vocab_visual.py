#!/usr/bin/env python3
from pathlib import Path

ruta = Path("scripts/validar_lspedia.py")
texto = ruta.read_text(encoding="utf-8")
inicio = texto.index("def validar_vocabulario(informe: Informe) -> list[dict]:")
fin = texto.index("\n\ndef revisar_cruce_fuentes", inicio)

nuevo = '''def validar_vocabulario(informe: Informe) -> list[dict]:
    filas = _cargar(VOCABULARIO, "Vocabulario", informe)
    if not filas:
        return filas

    categorias_permitidas = set(CATEGORIAS_VOCABULARIO)
    categorias_nuevas: set[str] = set()
    referencias: dict[tuple[str, str], int] = {}
    sin_imagen = 0
    sin_definicion = 0
    con_video = 0
    visuales_sin_video = 0

    for i, fila in enumerate(filas, 1):
        palabra = _texto(fila.get("palabra"))
        categoria = _texto(fila.get("categoria"))
        video = _texto(fila.get("video"))
        nivel = _texto(fila.get("nivel"))
        imagen = _texto(fila.get("imagen"))
        definicion = _texto(fila.get("definicion"))

        if not palabra:
            informe.error(f"Vocabulario #{i}: falta 'palabra'.")
        _validar_categoria(
            "Vocabulario",
            i,
            palabra,
            categoria,
            categorias_permitidas,
            categorias_nuevas,
            informe,
        )

        if video:
            con_video += 1
            if _youtube_id(video) is None:
                informe.error(
                    f"Vocabulario #{i} ({palabra}): referencia de YouTube no reconocida: {video!r}."
                )
        else:
            # Una ficha sin video sí es válida cuando ya ofrece comprensión
            # visual: concepto + imagen. QuizV2 no la usa porque filtra video.
            if not definicion or not imagen:
                informe.error(
                    f"Vocabulario #{i} ({palabra}): sin video debe tener definición e imagen para ser consultable."
                )
            else:
                visuales_sin_video += 1

        if not nivel:
            informe.aviso(f"Vocabulario #{i} ({palabra}): falta nivel.")
        elif nivel not in NIVELES_VOCABULARIO:
            informe.error(
                f"Vocabulario #{i} ({palabra}): nivel no válido {nivel!r}. "
                "Usar Fácil, Medio o Difícil."
            )

        if not definicion:
            sin_definicion += 1

        imagenes = [x.strip() for x in imagen.split(",") if x.strip()]
        if not imagenes:
            sin_imagen += 1
        else:
            if len(imagenes) > 2:
                informe.error(
                    f"Vocabulario #{i} ({palabra}): hay {len(imagenes)} imágenes; LSPedia admite máximo 2."
                )
            for imagen_item in imagenes[:2]:
                if imagen_item.startswith(("img/", "./img/")):
                    ruta_texto = unquote(imagen_item.removeprefix("./"))
                    ruta_img = ROOT / ruta_texto
                    if not ruta_img.exists():
                        informe.aviso(
                            f"Vocabulario #{i} ({palabra}): imagen local no encontrada: {imagen_item}."
                        )

        referencia = (_clave(palabra), _clave(categoria))
        if all(referencia):
            if referencia in referencias:
                informe.error(
                    f"Vocabulario: referencia duplicada {palabra!r} / {categoria!r} "
                    f"en registros #{referencias[referencia]} y #{i}."
                )
            else:
                referencias[referencia] = i

    if sin_imagen:
        informe.aviso(f"Vocabulario: {sin_imagen} palabra(s) con video todavía no tienen imagen de apoyo.")
    if sin_definicion:
        informe.aviso(
            f"Vocabulario: {sin_definicion} palabra(s) con video todavía no tienen definición. "
            "Las fichas visuales nuevas sin video sí requieren definición e imagen."
        )
    if categorias_nuevas:
        informe.dato(
            "Vocabulario: categorías adicionales reconocidas por su icono: "
            + ", ".join(sorted(categorias_nuevas, key=str.casefold))
            + "."
        )
    _revisar_campos_extranos("Vocabulario", filas, informe)
    informe.dato(
        f"Vocabulario: {len(filas)} fichas consultables, {con_video} con video para Quiz, "
        f"{visuales_sin_video} visuales sin video, "
        f"{len(set(_texto(x.get('categoria')) for x in filas))} categorías."
    )
    return filas
'''

ruta.write_text(texto[:inicio] + nuevo + texto[fin:], encoding="utf-8", newline="\n")
print("Validador de Vocabulario actualizado para fichas visuales sin video.")
