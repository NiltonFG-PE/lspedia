#!/usr/bin/env python3
"""Convierte un PDF en un libro de la biblioteca «Libros digitales» de LSPedia.

El visor (herramientas/libro-digital.html) no muestra el PDF: muestra una
imagen WebP por página. Así no hay un archivo PDF que descargar y el visor
carga solo las páginas que se están leyendo. Cada libro vive en su propia
carpeta (libros/<id>/) y aparece en la biblioteca (herramientas/libros-digitales.html)
porque el script lo agrega a libros/catalogo.json.

Uso (desde la carpeta del repositorio):

    pip install pymupdf pillow
    python scripts/pdf_a_libro.py mi-libro.pdf --titulo "Título del libro" --autor "Nombre"

Genera (con <id> = identificador del libro, por defecto sale del título):
    libros/<id>/paginas/p001.webp, p002.webp, ...   (páginas)
    libros/<id>/miniaturas/p001.webp, ...           (miniaturas pequeñas)
    libros/<id>/portada.webp                        (tapa para la biblioteca)
    libros/<id>/libro.json                          (título, tamaño, lista de páginas,
                                                     índice y botones/enlaces del PDF)
    libros/<id>/texto.json                          (texto de cada página, para buscar)
    libros/catalogo.json                            (lista de libros de la biblioteca;
                                                     se agrega o actualiza este libro)

Para agregar otro libro basta con volver a ejecutar el script con otro PDF y otro
título: cada libro queda en su carpeta y la biblioteca los muestra todos.

Los enlaces internos del PDF (botones "Índice", pestañas de capítulos, entradas
del índice, etc.) y los enlaces a páginas web se conservan: en el visor son
zonas tocables encima de cada página. El índice (tabla de contenido) sale de
los marcadores del PDF. Si el PDF no los tiene, el visor simplemente no
muestra esas funciones.

Opciones útiles:
    --ancho 1600     más nitidez al hacer zoom (pesa más). Por defecto 1400.
    --calidad 82     calidad WebP de 1 a 100. Por defecto 82.
    --marca "Texto"  texto de la marca de agua tenue. Por defecto "LSPedia".
    --sin-marca      sin marca de agua.
    --sin-tapa-dura  la primera y la última página se mueven como hojas comunes.
    --sin-enlaces    no copia los botones/enlaces del PDF.
    --sin-texto      no genera texto.json (se desactiva la búsqueda).
    --id nombre      identificador del libro: nombre de su carpeta y de su enlace
                     (solo minúsculas, números y guiones). Recuerda también la
                     página y los marcadores de cada lector. Por defecto sale
                     del título.
    --salida carpeta carpeta de salida. Por defecto libros/<id>.

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


def a_milesimas(valor, total):
    """Convierte una medida del PDF a milésimas del ancho/alto de la página (0 a 1000)."""
    return max(0, min(1000, round(valor / total * 1000)))


def extraer_indice(doc):
    """Marcadores del PDF como [[nivel, título, página], ...] (páginas desde 1)."""
    indice = []
    for nivel, titulo, pagina in doc.get_toc(simple=True):
        titulo = " ".join(str(titulo).split())
        if titulo and 1 <= pagina <= doc.page_count:
            indice.append([int(nivel), titulo[:140], int(pagina)])
    return indice


def extraer_enlaces(doc, min_ancho_pt=22, min_alto_pt=14):
    """Botones del PDF por página: {"11": [[x, y, ancho, alto, destino], ...]}.

    Las medidas van en milésimas de la página. El destino es un número de
    página (desde 1) o una dirección web. Las zonas muy angostas (como las
    pestañas del borde) se ensanchan un poco para que se puedan tocar bien.
    """
    resultado = {}
    for i, pagina in enumerate(doc, start=1):
        ancho_pg, alto_pg = pagina.rect.width, pagina.rect.height
        zonas, vistos = [], set()
        for enlace in pagina.get_links():
            tipo = enlace.get("kind")
            if tipo == fitz.LINK_GOTO and 0 <= enlace.get("page", -1) < doc.page_count:
                destino = enlace["page"] + 1
            elif tipo == fitz.LINK_URI and str(enlace.get("uri", "")).lower().startswith(("https://", "http://")):
                destino = str(enlace["uri"])
            else:
                continue
            r = enlace["from"]
            x0, y0, x1, y1 = max(0, r.x0), max(0, r.y0), min(ancho_pg, r.x1), min(alto_pg, r.y1)
            if x1 - x0 < min_ancho_pt:
                falta = min_ancho_pt - (x1 - x0)
                if x0 + (x1 - x0) / 2 > ancho_pg / 2:   # pestaña del borde derecho: crece hacia adentro
                    x0 = max(0, x0 - falta)
                else:
                    x1 = min(ancho_pg, x1 + falta)
            if y1 - y0 < min_alto_pt:
                centro = (y0 + y1) / 2
                y0, y1 = max(0, centro - min_alto_pt / 2), min(alto_pg, centro + min_alto_pt / 2)
            zona = [a_milesimas(x0, ancho_pg), a_milesimas(y0, alto_pg),
                    a_milesimas(x1 - x0, ancho_pg), a_milesimas(y1 - y0, alto_pg), destino]
            if zona[2] < 3 or zona[3] < 3 or tuple(zona[:4]) + (str(destino),) in vistos:
                continue
            vistos.add(tuple(zona[:4]) + (str(destino),))
            zonas.append(zona)
        # Las zonas grandes primero y las chicas al final: así las chicas quedan encima.
        zonas.sort(key=lambda z: -(z[2] * z[3]))
        if zonas:
            resultado[str(i)] = zonas
    return resultado


def extraer_texto(doc):
    """Texto de cada página por líneas: [[x, y, ancho, alto, "texto"], ...] por página."""
    paginas = []
    for pagina in doc:
        ancho_pg, alto_pg = pagina.rect.width, pagina.rect.height
        lineas = []
        for bloque in pagina.get_text("dict").get("blocks", []):
            if bloque.get("type") != 0:
                continue
            for linea in bloque.get("lines", []):
                texto = " ".join("".join(sp.get("text", "") for sp in linea.get("spans", [])).split())
                if not texto:
                    continue
                x0, y0, x1, y1 = linea["bbox"]
                lineas.append([a_milesimas(x0, ancho_pg), a_milesimas(y0, alto_pg),
                               a_milesimas(x1 - x0, ancho_pg), a_milesimas(y1 - y0, alto_pg), texto])
        paginas.append(lineas)
    return paginas


def crear_id(titulo):
    base = re.sub(r"[^a-z0-9]+", "-", titulo.lower().translate(str.maketrans("áéíóúüñ", "aeiouun"))).strip("-")
    return (base or "libro")[:40]


def main():
    ap = argparse.ArgumentParser(description="Convierte un PDF en páginas WebP para el Libro digital de LSPedia.")
    ap.add_argument("pdf", help="ruta del archivo PDF")
    ap.add_argument("--titulo", default="Libro digital")
    ap.add_argument("--autor", default="")
    ap.add_argument("--salida", default="", help="carpeta de salida (por defecto: libros/<id>)")
    ap.add_argument("--ancho", type=int, default=1400, help="ancho en píxeles de cada página (por defecto 1400)")
    ap.add_argument("--calidad", type=int, default=82, help="calidad WebP, 1 a 100 (por defecto 82)")
    ap.add_argument("--miniatura", type=int, default=180, help="ancho de las miniaturas (por defecto 180)")
    ap.add_argument("--marca", default="LSPedia", help='texto de la marca de agua (por defecto "LSPedia")')
    ap.add_argument("--sin-marca", action="store_true", help="sin marca de agua")
    ap.add_argument("--sin-tapa-dura", action="store_true", help="portada y contraportada como hojas comunes")
    ap.add_argument("--sin-enlaces", action="store_true", help="no copiar los botones/enlaces del PDF")
    ap.add_argument("--sin-texto", action="store_true", help="no generar texto.json (sin búsqueda)")
    ap.add_argument("--id", default="", help="identificador del libro: carpeta y enlace (por defecto, sale del título)")
    args = ap.parse_args()

    ruta_pdf = Path(args.pdf)
    if not ruta_pdf.is_file():
        sys.exit(f"No encuentro el archivo: {ruta_pdf}")
    if not 200 <= args.ancho <= 4000:
        sys.exit("--ancho debe estar entre 200 y 4000")

    doc = fitz.open(str(ruta_pdf))
    if doc.page_count == 0:
        sys.exit("El PDF no tiene páginas.")
    if doc.needs_pass:
        sys.exit("El PDF tiene contraseña. Quítala antes de convertirlo.")

    titulo = args.titulo
    autor = args.autor
    if titulo == "Libro digital" and (doc.metadata or {}).get("title"):
        titulo = doc.metadata["title"].strip()
    if not autor and (doc.metadata or {}).get("author"):
        autor = doc.metadata["author"].strip()
    id_libro = crear_id(args.id or titulo)
    if args.id and id_libro != args.id:
        print(f"Aviso: el id se normalizó a «{id_libro}» (solo minúsculas, números y guiones).")

    salida = Path(args.salida) if args.salida else Path("libros") / id_libro
    carpeta_pag = salida / "paginas"
    carpeta_min = salida / "miniaturas"
    carpeta_pag.mkdir(parents=True, exist_ok=True)
    carpeta_min.mkdir(parents=True, exist_ok=True)

    # Limpia páginas de una conversión anterior de este mismo libro (solo pNNN.webp).
    patron = re.compile(r"^p\d{3,}\.webp$")
    for carpeta in (carpeta_pag, carpeta_min):
        for viejo in carpeta.iterdir():
            if viejo.is_file() and patron.match(viejo.name):
                viejo.unlink()

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

    indice = extraer_indice(doc)
    enlaces = {} if args.sin_enlaces else extraer_enlaces(doc)

    datos = {
        "version": 2,
        "id": id_libro,
        "titulo": titulo,
        "autor": autor,
        "ancho": ancho_base,
        "alto": alto_base,
        "tapaDura": not args.sin_tapa_dura,
        "marcaAgua": False if args.sin_marca else args.marca,
        "carpeta": "paginas/",
        "miniaturas": "miniaturas/",
        "paginas": nombres,
    }
    if indice:
        datos["indice"] = indice
    if enlaces:
        datos["enlaces"] = enlaces

    ruta_texto = salida / "texto.json"
    if ruta_texto.exists():
        ruta_texto.unlink()
    if not args.sin_texto:
        texto = extraer_texto(doc)
        if any(texto):
            ruta_texto.write_text(json.dumps({"version": 1, "paginas": texto}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
            datos["texto"] = "texto.json"

    (salida / "libro.json").write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    # Tapa para la biblioteca (la primera página, más pequeña).
    portada = Image.open(carpeta_pag / nombres[0]).convert("RGB")
    portada.thumbnail((520, int(520 * alto_base / ancho_base) + 1), Image.LANCZOS)
    portada.save(salida / "portada.webp", "WEBP", quality=80, method=6)

    # Agrega o actualiza el libro en la lista de la biblioteca.
    ruta_catalogo = salida.parent / "catalogo.json"
    catalogo = {"version": 1, "libros": []}
    if ruta_catalogo.is_file():
        try:
            catalogo = json.loads(ruta_catalogo.read_text(encoding="utf-8"))
        except ValueError:
            sys.exit(f"{ruta_catalogo} no es un JSON válido; corrígelo o bórralo y vuelve a ejecutar.")
    libros = [l for l in catalogo.get("libros", []) if l.get("id") != id_libro]
    entrada = {"id": id_libro, "carpeta": salida.name, "titulo": titulo, "autor": autor,
               "paginas": len(nombres), "portada": "portada.webp"}
    libros.append(entrada)
    catalogo["libros"] = libros
    ruta_catalogo.write_text(json.dumps(catalogo, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    peso = sum(p.stat().st_size for p in carpeta_pag.iterdir()) / 1_048_576
    print(f"\nListo: {len(nombres)} páginas ({ancho_base}x{alto_base}), {peso:.1f} MB en {carpeta_pag}")
    print(f"Índice: {len(indice)} entradas · botones del PDF: {sum(len(v) for v in enlaces.values())} en {len(enlaces)} páginas"
          f" · búsqueda: {'sí' if datos.get('texto') else 'no'}")
    if len(nombres) % 2:
        print("Aviso: el libro tiene una cantidad impar de páginas; la contraportada quedará junto a la última hoja.")
    print(f"Biblioteca: {len(libros)} libro(s) en {ruta_catalogo}")
    print("Súbelo al repositorio: git add libros && git commit -m \"Nuevo libro digital\"")


if __name__ == "__main__":
    main()
