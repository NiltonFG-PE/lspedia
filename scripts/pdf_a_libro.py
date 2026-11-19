#!/usr/bin/env python3
"""Convierte un PDF en las páginas del Libro digital de LSPedia.

El visor (herramientas/libro-digital.html) no muestra el PDF: muestra una
imagen WebP por página. Así no hay un archivo PDF que descargar y el visor
carga solo las páginas que se están leyendo.

Uso (desde la carpeta del repositorio):

    pip install pymupdf pillow
    python scripts/pdf_a_libro.py mi-libro.pdf --titulo "Título del libro" --autor "Nombre"

Genera:
    libro/paginas/p001.webp, p002.webp, ...   (páginas)
    libro/miniaturas/p001.webp, ...           (miniaturas pequeñas)
    libro/libro.json                          (título, tamaño y lista de páginas)

Opciones útiles:
    --ancho 1600     más nitidez al hacer zoom (pesa más). Por defecto 1400.
    --calidad 82     calidad WebP de 1 a 100. Por defecto 82.
    --marca "Texto"  texto de la marca de agua tenue. Por defecto "LSPedia".
    --sin-marca      sin marca de agua.
    --sin-tapa-dura  la primera y la última página se mueven como hojas comunes.

Consejo: para que la contraportada quede sola al final, usa un PDF con
cantidad PAR de páginas (portada + hojas + contraportada).
"""
import argparse
import json
import re
import sys
from pathlib import Path

try:
    import pymupdf as fitz  # PyMuPDF >= 1.24
except ImportError:  # pragma: no cover - versiones anteriores
    try:
        import fitz
    except ImportError:
        sys.exit("Falta PyMuPDF. Instálalo con:  pip install pymupdf pillow")
try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow. Instálalo con:  pip install pymupdf pillow")


def renderizar(pagina, ancho_px):
    """Dibuja una página del PDF con el ancho pedido y la devuelve como imagen PIL."""
    escala = ancho_px / pagina.rect.width
    pix = pagina.get_pixmap(matrix=fitz.Matrix(escala, escala), alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def ajustar_a_lienzo(img, ancho, alto):
    """Si una página tiene otro tamaño, la centra sobre un lienzo blanco del tamaño base."""
    if img.size == (ancho, alto):
        return img
    img.thumbnail((ancho, alto), Image.LANCZOS)
    lienzo = Image.new("RGB", (ancho, alto), (255, 255, 255))
    lienzo.paste(img, ((ancho - img.width) // 2, (alto - img.height) // 2))
    return lienzo


def main():
    ap = argparse.ArgumentParser(description="Convierte un PDF en páginas WebP para el Libro digital de LSPedia.")
    ap.add_argument("pdf", help="ruta del archivo PDF")
    ap.add_argument("--titulo", default="Libro digital")
    ap.add_argument("--autor", default="")
    ap.add_argument("--salida", default="libro", help="carpeta de salida (por defecto: libro)")
    ap.add_argument("--ancho", type=int, default=1400, help="ancho en píxeles de cada página (por defecto 1400)")
    ap.add_argument("--calidad", type=int, default=82, help="calidad WebP, 1 a 100 (por defecto 82)")
    ap.add_argument("--miniatura", type=int, default=180, help="ancho de las miniaturas (por defecto 180)")
    ap.add_argument("--marca", default="LSPedia", help='texto de la marca de agua (por defecto "LSPedia")')
    ap.add_argument("--sin-marca", action="store_true", help="sin marca de agua")
    ap.add_argument("--sin-tapa-dura", action="store_true", help="portada y contraportada como hojas comunes")
    args = ap.parse_args()

    ruta_pdf = Path(args.pdf)
    if not ruta_pdf.is_file():
        sys.exit(f"No encuentro el archivo: {ruta_pdf}")
    if not 200 <= args.ancho <= 4000:
        sys.exit("--ancho debe estar entre 200 y 4000")

    salida = Path(args.salida)
    carpeta_pag = salida / "paginas"
    carpeta_min = salida / "miniaturas"
    carpeta_pag.mkdir(parents=True, exist_ok=True)
    carpeta_min.mkdir(parents=True, exist_ok=True)

    # Limpia páginas de un libro anterior (solo los archivos pNNN.webp).
    patron = re.compile(r"^p\d{3,}\.webp$")
    for carpeta in (carpeta_pag, carpeta_min):
        for viejo in carpeta.iterdir():
            if viejo.is_file() and patron.match(viejo.name):
                viejo.unlink()

    doc = fitz.open(str(ruta_pdf))
    if doc.page_count == 0:
        sys.exit("El PDF no tiene páginas.")
    if doc.needs_pass:
        sys.exit("El PDF tiene contraseña. Quítala antes de convertirlo.")

    nombres = []
    ancho_base = alto_base = None
    for i, pagina in enumerate(doc, start=1):
        img = renderizar(pagina, args.ancho)
        if ancho_base is None:
            ancho_base, alto_base = img.size
        img = ajustar_a_lienzo(img, ancho_base, alto_base)
        nombre = f"p{i:03d}.webp"
        img.save(carpeta_pag / nombre, "WEBP", quality=args.calidad, method=6)
        mini = img.copy()
        mini.thumbnail((args.miniatura, int(args.miniatura * alto_base / ancho_base) + 1), Image.LANCZOS)
        mini.save(carpeta_min / nombre, "WEBP", quality=70, method=6)
        nombres.append(nombre)
        print(f"  página {i}/{doc.page_count}", end="\r", flush=True)

    datos = {
        "version": 1,
        "titulo": args.titulo,
        "autor": args.autor,
        "ancho": ancho_base,
        "alto": alto_base,
        "tapaDura": not args.sin_tapa_dura,
        "marcaAgua": False if args.sin_marca else args.marca,
        "carpeta": "paginas/",
        "miniaturas": "miniaturas/",
        "paginas": nombres,
    }
    (salida / "libro.json").write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    peso = sum(p.stat().st_size for p in carpeta_pag.iterdir()) / 1_048_576
    print(f"\nListo: {len(nombres)} páginas ({ancho_base}x{alto_base}), {peso:.1f} MB en {carpeta_pag}")
    if len(nombres) % 2:
        print("Aviso: el libro tiene una cantidad impar de páginas; la contraportada quedará junto a la última hoja.")
    print("Súbelas al repositorio: git add libro && git commit -m \"Nuevo libro digital\"")


if __name__ == "__main__":
    main()
