#!/usr/bin/env python3
"""Genera páginas HTML estáticas SEO para términos públicos de LSPedia.

Salida:
- diccionario/<id>/index.html              (Diccionario)
- vocabulario/<id>/index.html              (Vocabulario)
- categoria/diccionario/<slug>/index.html  (Categoría de Diccionario)
- categoria/vocabulario/<slug>/index.html  (Categoría de Vocabulario)
- coleccion/vocabulario/<slug>/index.html  (Colección de Vocabulario)

Estas páginas son ligeras, indexables y contienen contenido único desde el
HTML inicial. La experiencia interactiva completa sigue viviendo en index.html.
"""
from __future__ import annotations

from html import escape
import json
import re
import shutil
import unicodedata
from pathlib import Path
from urllib.parse import quote
from PIL import Image, ImageOps

BASE_URL = "https://lspedia.site"
MARCADOR = ".lspedia-seo-generated"
IMAGEN_RE = re.compile(r"\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$", re.I)
PREFIJO_RE = re.compile(r"^(?:https?://|/|\.\.?/|img/)", re.I)
YOUTUBE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
SOCIAL_PREVIEW_VERSION = "v8"


def texto(valor: object) -> str:
    return str(valor or "").strip()


def slug(valor: object) -> str:
    normalizado = unicodedata.normalize("NFKD", texto(valor))
    ascii_texto = "".join(c for c in normalizado if not unicodedata.combining(c))
    ascii_texto = ascii_texto.casefold()
    ascii_texto = re.sub(r"[^a-z0-9]+", "-", ascii_texto)
    return ascii_texto.strip("-")


def imagen_real(valor: object) -> bool:
    principal = texto(valor).split(",", 1)[0].strip()
    return bool(principal and PREFIJO_RE.search(principal) and IMAGEN_RE.search(principal))


def imagen_absoluta(valor: object) -> str:
    principal = texto(valor).split(",", 1)[0].strip()
    if not imagen_real(principal):
        return f"{BASE_URL}/img/lspedia.png"
    if principal.startswith(("http://", "https://")):
        return principal
    return f"{BASE_URL}/{principal.lstrip('./')}"


def cargar_lista(ruta: Path) -> list[dict]:
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    if not isinstance(datos, list):
        raise SystemExit(f"ERROR: {ruta} debe contener una lista JSON.")
    return [fila for fila in datos if isinstance(fila, dict)]


def publicable_diccionario(fila: dict) -> bool:
    return bool(
        texto(fila.get("palabra"))
        and texto(fila.get("definicion"))
        and texto(fila.get("categoria"))
        and imagen_real(fila.get("imagen"))
    )


def publicable_vocabulario(fila: dict) -> bool:
    return bool(
        texto(fila.get("palabra"))
        and texto(fila.get("categoria"))
        and imagen_real(fila.get("imagen"))
    )


def referencia_diccionario(fila: dict) -> str:
    return slug(fila.get("id") or fila.get("palabra"))


def referencia_vocabulario(fila: dict) -> str:
    existente = slug(fila.get("id"))
    if existente:
        return existente
    base = slug(fila.get("palabra")) or "palabra"
    categoria = slug(fila.get("categoria"))
    return f"{base}-{categoria}" if categoria else base


def buscar_imagen_categoria(repo: Path, ref: str) -> Path | None:
    """Busca una ilustración específica de la categoría por slug normalizado."""
    carpeta = repo / "img" / "categorias"
    if not carpeta.is_dir():
        return None
    extensiones = {".webp", ".png", ".jpg", ".jpeg"}
    for ruta in carpeta.iterdir():
        if ruta.is_file() and ruta.suffix.lower() in extensiones and slug(ruta.stem) == ref:
            return ruta
    return None


def crear_preview_categoria(
    repo: Path,
    items: list[dict],
    destino: Path,
    preferida: Path | None = None,
) -> None:
    """Crea un JPEG 1200x630 local y estable para vistas previas sociales."""
    candidatos: list[Path] = []
    if preferida and preferida.is_file():
        candidatos.append(preferida)

    for item in items:
        valor = texto(item.get("imagen")).split(",", 1)[0].strip()
        if not valor or valor.startswith(("http://", "https://")):
            continue
        ruta = repo / valor.lstrip("./")
        if ruta.is_file() and ruta not in candidatos:
            candidatos.append(ruta)

    fallback = repo / "img" / "lspedia.png"
    if fallback.is_file() and fallback not in candidatos:
        candidatos.append(fallback)

    ultimo_error: Exception | None = None
    for origen in candidatos:
        try:
            with Image.open(origen) as base:
                imagen = ImageOps.exif_transpose(base).convert("RGB")
                # No recorta la ilustración: la encaja completa sobre un fondo
                # neutro para que WhatsApp no muestre solo un fragmento/color.
                preview = ImageOps.pad(
                    imagen,
                    (1200, 630),
                    method=Image.Resampling.LANCZOS,
                    color=(245, 248, 252),
                    centering=(0.5, 0.5),
                )
                preview.save(destino / "preview.jpg", "JPEG", quality=90, optimize=True, progressive=False)
                return
        except Exception as error:
            ultimo_error = error

    raise RuntimeError(f"No se pudo crear preview social para {destino}: {ultimo_error}")


def limpiar_texto_meta(valor: object, maximo: int = 158) -> str:
    limpio = re.sub(r"\s+", " ", texto(valor).replace("*", "")).strip()
    if len(limpio) <= maximo:
        return limpio
    cortado = limpio[: maximo - 1]
    espacio = cortado.rfind(" ")
    if espacio > 90:
        cortado = cortado[:espacio]
    return cortado.rstrip(" ,.;:") + "…"


def youtube_id(valor: object) -> str:
    bruto = texto(valor)
    if YOUTUBE_ID_RE.fullmatch(bruto):
        return bruto
    patrones = (
        r"(?:youtu\.be/)([A-Za-z0-9_-]{11})",
        r"(?:youtube\.com/(?:watch\?v=|shorts/|embed/))([A-Za-z0-9_-]{11})",
    )
    for patron in patrones:
        coincidencia = re.search(patron, bruto)
        if coincidencia:
            return coincidencia.group(1)
    return ""


def preparar_directorio(ruta: Path) -> None:
    if ruta.exists():
        marcador = ruta / MARCADOR
        if not marcador.exists():
            raise SystemExit(
                f"ERROR: {ruta} ya existe y no parece generado por LSPedia SEO. "
                "No se borró nada."
            )
        shutil.rmtree(ruta)
    ruta.mkdir(parents=True, exist_ok=True)
    (ruta / MARCADOR).write_text(
        "Directorio generado automáticamente por scripts/generar_paginas_seo.py\n",
        encoding="utf-8",
    )


def json_ld(tipo: str, palabra: str, categoria: str, definicion: str, url: str, imagen: str) -> str:
    entidad = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": f"{palabra} | LSPedia",
        "url": url,
        "inLanguage": "es-PE",
        "isPartOf": {
            "@type": "WebSite",
            "name": "LSPedia",
            "url": f"{BASE_URL}/",
        },
        "mainEntity": {
            "@type": "DefinedTerm",
            "name": palabra,
            "inDefinedTermSet": f"{BASE_URL}/",
            "description": definicion,
        },
        "primaryImageOfPage": {
            "@type": "ImageObject",
            "contentUrl": imagen,
        },
        "about": {
            "@type": "Thing",
            "name": categoria,
        },
    }
    if tipo == "vocabulario":
        entidad["description"] = (
            f"Vocabulario visual de {palabra} en la categoría {categoria}, "
            "con apoyo en Lengua de Señas Peruana (LSP)."
        )
    return json.dumps(entidad, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def pagina_html(
    *,
    tipo: str,
    palabra: str,
    categoria: str,
    definicion: str,
    variantes: str,
    imagen: str,
    video: str,
    canonical: str,
    app_url: str,
) -> str:
    es_dic = tipo == "diccionario"
    etiqueta = "Diccionario" if es_dic else "Vocabulario"
    definicion_visible = definicion if es_dic else (
        f"{palabra} forma parte del vocabulario visual de LSPedia en la categoría "
        f"{categoria}. Puedes consultar su imagen y, cuando está disponible, su video "
        "con apoyo en Lengua de Señas Peruana (LSP)."
    )
    descripcion = limpiar_texto_meta(
        definicion if es_dic else
        f"{palabra}: vocabulario visual de la categoría {categoria} con apoyo en Lengua de Señas Peruana (LSP)."
    )
    if not descripcion:
        descripcion = f"{palabra}: significado y apoyo visual en LSPedia."
    titulo = (
        f"{palabra}: significado con apoyo en LSP | LSPedia"
        if es_dic else
        f"{palabra}: vocabulario con apoyo en LSP | LSPedia"
    )

    variantes_html = ""
    if variantes:
        variantes_html = (
            '<div class="dato"><strong>Variantes o palabras relacionadas:</strong> '
            f"{escape(variantes)}</div>"
        )

    video_id = youtube_id(video)
    video_html = ""
    if video_id:
        video_html = f'''
        <section class="video">
          <h2>Video con apoyo en LSP</h2>
          <div class="video-wrap">
            <iframe
              src="https://www.youtube-nocookie.com/embed/{escape(video_id, quote=True)}"
              title="Video de {escape(palabra, quote=True)} en LSPedia"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen></iframe>
          </div>
        </section>'''

    ld = json_ld(tipo, palabra, categoria, definicion_visible, canonical, imagen)
    concepto_titulo = "Concepto" if es_dic else "Vocabulario visual"

    return f'''<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{escape(titulo)}</title>
  <meta name="description" content="{escape(descripcion, quote=True)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="{escape(canonical, quote=True)}">
  <link rel="icon" type="image/png" href="{BASE_URL}/img/favicon.png">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="LSPedia">
  <meta property="og:locale" content="es_PE">
  <meta property="og:url" content="{escape(canonical, quote=True)}">
  <meta property="og:title" content="{escape(titulo, quote=True)}">
  <meta property="og:description" content="{escape(descripcion, quote=True)}">
  <meta property="og:image" content="{escape(imagen, quote=True)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{escape(titulo, quote=True)}">
  <meta name="twitter:description" content="{escape(descripcion, quote=True)}">
  <meta name="twitter:image" content="{escape(imagen, quote=True)}">
  <script type="application/ld+json">{ld}</script>
  <style>
    :root{{--azul:#0f1c35;--azul2:#173866;--amarillo:#ffc107;--texto:#172033;--gris:#667085;--borde:#dbe5f0;}}
    *{{box-sizing:border-box}}
    body{{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--texto);background:#f5f8fc;line-height:1.6}}
    header{{background:var(--azul);padding:18px 20px}}
    .cabecera{{max-width:980px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:18px}}
    .logo{{width:170px;height:auto}}
    .inicio{{color:#fff;text-decoration:none;font-weight:700}}
    main{{max-width:980px;margin:34px auto;padding:0 18px 52px}}
    .miga{{font-size:.92rem;color:var(--gris);margin-bottom:14px}}
    .miga a{{color:#155ec8;text-decoration:none}}
    article{{background:#fff;border:1px solid var(--borde);border-radius:24px;padding:clamp(22px,4vw,42px);box-shadow:0 18px 45px rgba(15,28,53,.08)}}
    .etiqueta{{display:inline-flex;background:#fff3c4;color:#6c5000;border:1px solid #ffda58;border-radius:999px;padding:6px 12px;font-weight:800;font-size:.82rem}}
    h1{{font-size:clamp(2rem,5vw,3.35rem);line-height:1.08;margin:16px 0 8px;color:#1265d8}}
    .categoria{{font-weight:700;color:var(--gris);margin-bottom:26px}}
    .grid{{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);gap:30px;align-items:start}}
    .concepto h2,.video h2{{font-size:1.15rem;margin:0 0 10px;color:var(--azul2)}}
    .concepto p{{font-size:1.08rem;white-space:pre-line}}
    .dato{{margin-top:16px;padding:14px 16px;background:#f7f9fc;border-radius:14px}}
    .imagen{{width:100%;border-radius:20px;border:1px solid var(--borde);background:#f8fafc;display:block}}
    .cta{{display:inline-flex;margin-top:24px;background:var(--amarillo);color:#14213a;text-decoration:none;font-weight:800;border-radius:14px;padding:13px 18px;box-shadow:0 8px 20px rgba(255,193,7,.24)}}
    .nota{{font-size:.9rem;color:var(--gris);margin-top:12px}}
    .video{{margin-top:30px;padding-top:24px;border-top:1px solid var(--borde)}}
    .video-wrap{{position:relative;padding-top:56.25%;overflow:hidden;border-radius:18px;background:#0b1120}}
    .video-wrap iframe{{position:absolute;inset:0;width:100%;height:100%;border:0}}
    footer{{text-align:center;color:var(--gris);font-size:.9rem;padding:0 18px 34px}}
    @media(max-width:720px){{.cabecera{{align-items:center}}.logo{{width:135px}}.grid{{grid-template-columns:1fr}}article{{border-radius:18px}}}}
  </style>
</head>
<body>
<header>
  <div class="cabecera">
    <a href="{BASE_URL}/" aria-label="Ir a LSPedia"><img class="logo" src="{BASE_URL}/img/lspedia.png" alt="LSPedia"></a>
    <a class="inicio" href="{BASE_URL}/">Inicio</a>
  </div>
</header>
<main>
  <nav class="miga" aria-label="Ruta">
    <a href="{BASE_URL}/">LSPedia</a> › {escape(etiqueta)} › {escape(palabra)}
  </nav>
  <article>
    <span class="etiqueta">{escape(etiqueta)}</span>
    <h1>{escape(palabra)}</h1>
    <div class="categoria">Categoría: {escape(categoria)}</div>
    <div class="grid">
      <section class="concepto">
        <h2>{concepto_titulo}</h2>
        <p>{escape(definicion_visible)}</p>
        {variantes_html}
        <a class="cta" href="{escape(app_url, quote=True)}" rel="nofollow">Abrir ficha completa en LSPedia →</a>
        <div class="nota">La ficha completa incluye las funciones interactivas disponibles en LSPedia.</div>
      </section>
      <img class="imagen" src="{escape(imagen, quote=True)}" alt="Ilustración de {escape(palabra, quote=True)}" loading="eager">
    </div>
    {video_html}
  </article>
</main>
<footer>© 2026 LSPedia — Diccionario visual de español con apoyo en Lengua de Señas Peruana.</footer>
</body>
</html>
'''


def generar_diccionario(repo: Path, filas: list[dict]) -> int:
    raiz = repo / "diccionario"
    preparar_directorio(raiz)
    vistos: set[str] = set()
    total = 0
    for fila in filas:
        if not publicable_diccionario(fila):
            continue
        ref = referencia_diccionario(fila)
        if not ref:
            continue
        if ref in vistos:
            raise SystemExit(f"ERROR: referencia SEO duplicada en Diccionario: {ref}")
        vistos.add(ref)
        palabra = texto(fila.get("palabra"))
        categoria = texto(fila.get("categoria"))
        definicion = texto(fila.get("definicion"))
        variantes = texto(fila.get("variantes"))
        imagen = imagen_absoluta(fila.get("imagen"))
        canonical = f"{BASE_URL}/diccionario/{quote(ref, safe='')}/"
        app_url = f"{BASE_URL}/?p={quote(ref, safe='')}"
        destino = raiz / ref
        destino.mkdir(parents=True, exist_ok=True)
        (destino / "index.html").write_text(
            pagina_html(
                tipo="diccionario",
                palabra=palabra,
                categoria=categoria,
                definicion=definicion,
                variantes=variantes,
                imagen=imagen,
                video=texto(fila.get("video")),
                canonical=canonical,
                app_url=app_url,
            ).replace("        \n", "\n"),
            encoding="utf-8",
            newline="\n",
        )
        total += 1
    return total


def generar_vocabulario(repo: Path, filas: list[dict]) -> int:
    raiz = repo / "vocabulario"
    preparar_directorio(raiz)
    vistos: set[str] = set()
    total = 0
    for fila in filas:
        if not publicable_vocabulario(fila):
            continue
        ref = referencia_vocabulario(fila)
        if not ref:
            continue
        if ref in vistos:
            raise SystemExit(f"ERROR: referencia SEO duplicada en Vocabulario: {ref}")
        vistos.add(ref)
        palabra = texto(fila.get("palabra"))
        categoria = texto(fila.get("categoria"))
        variantes = texto(fila.get("variantes"))
        imagen = imagen_absoluta(fila.get("imagen"))
        canonical = f"{BASE_URL}/vocabulario/{quote(ref, safe='')}/"
        app_url = (
            f"{BASE_URL}/?vista=vocabulario&p={quote(ref, safe='')}"
            "&fuente=vocabulario"
        )
        destino = raiz / ref
        destino.mkdir(parents=True, exist_ok=True)
        (destino / "index.html").write_text(
            pagina_html(
                tipo="vocabulario",
                palabra=palabra,
                categoria=categoria,
                definicion=texto(fila.get("definicion")),
                variantes=variantes,
                imagen=imagen,
                video=texto(fila.get("video")),
                canonical=canonical,
                app_url=app_url,
            ).replace("        \n", "\n"),
            encoding="utf-8",
            newline="\n",
        )
        total += 1
    return total



def etiquetas_vocabulario(fila: dict) -> list[str]:
    valor = fila.get("etiquetas", fila.get("tags", []))
    if isinstance(valor, list):
        return [texto(x) for x in valor if texto(x)]
    return [x.strip() for x in re.split(r"[,;|]", texto(valor)) if x.strip()]


def generar_colecciones(repo: Path, filas_voc: list[dict]) -> int:
    """Genera páginas sociales para colecciones (etiquetas) de Vocabulario."""
    raiz = repo / "coleccion"
    preparar_directorio(raiz)

    grupos: dict[str, list[dict]] = {}
    nombres: dict[str, str] = {}
    for fila in filas_voc:
        if not publicable_vocabulario(fila):
            continue
        for nombre in etiquetas_vocabulario(fila):
            ref = slug(nombre)
            if not ref:
                continue
            grupos.setdefault(ref, []).append(fila)
            nombres.setdefault(ref, nombre)

    total = 0
    for ref, items in sorted(grupos.items()):
        nombre = nombres[ref]
        canonical = f"{BASE_URL}/coleccion/vocabulario/{quote(ref, safe='')}/"
        app_url = f"{BASE_URL}/index.html?vista=vocabulario&coleccion={quote(nombre, safe='')}"
        destino = raiz / "vocabulario" / ref
        destino.mkdir(parents=True, exist_ok=True)
        crear_preview_categoria(
            repo,
            items,
            destino,
            preferida=buscar_imagen_categoria(repo, ref),
        )
        imagen = f"{canonical}preview.jpg"

        palabras = [texto(x.get("palabra")) for x in items if texto(x.get("palabra"))]
        muestra = ", ".join(palabras[:12])
        tarjetas = []
        for item in items:
            palabra = texto(item.get("palabra"))
            if not palabra:
                continue
            referencia = referencia_vocabulario(item)
            url_palabra = f"{BASE_URL}/vocabulario/{quote(referencia, safe='')}/"
            imagen_palabra = imagen_absoluta(item.get("imagen"))
            tarjetas.append(
                '<a class="palabra-card" href="' + escape(url_palabra, quote=True) + '">'
                '<img src="' + escape(imagen_palabra, quote=True) + '" alt="' + escape(palabra, quote=True) + '" loading="lazy">'
                '<span>' + escape(palabra) + '</span>'
                '</a>'
            )
        tarjetas_html = "".join(tarjetas)
        descripcion = limpiar_texto_meta(
            f"Explora la colección {nombre} del Vocabulario de LSPedia con {len(palabras)} palabras y apoyo visual en Lengua de Señas Peruana (LSP)."
        )
        titulo = f"{nombre} — Colección de Vocabulario | LSPedia"
        ld = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": titulo,
            "url": canonical,
            "description": descripcion,
            "inLanguage": "es-PE",
            "isPartOf": {"@type": "WebSite", "name": "LSPedia", "url": f"{BASE_URL}/"},
            "primaryImageOfPage": {"@type": "ImageObject", "contentUrl": imagen},
        }
        html = f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{escape(titulo)}</title>
  <meta name="description" content="{escape(descripcion, quote=True)}">
  <meta name="robots" content="noindex,follow,max-image-preview:large">
  <link rel="canonical" href="{escape(canonical, quote=True)}">
  <link rel="icon" type="image/png" href="{BASE_URL}/img/favicon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="LSPedia">
  <meta property="og:locale" content="es_PE">
  <meta property="og:url" content="{escape(canonical, quote=True)}">
  <meta property="og:title" content="{escape(titulo, quote=True)}">
  <meta property="og:description" content="{escape(descripcion, quote=True)}">
  <meta property="og:image" content="{escape(imagen, quote=True)}">
  <meta property="og:image:secure_url" content="{escape(imagen, quote=True)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Imagen de la colección {escape(nombre, quote=True)} en LSPedia">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{escape(titulo, quote=True)}">
  <meta name="twitter:description" content="{escape(descripcion, quote=True)}">
  <meta name="twitter:image" content="{escape(imagen, quote=True)}">
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")}</script>
  <style>
    html.lsp-redireccion-app body{{opacity:0;visibility:hidden}}
  </style>
  <script>
    document.documentElement.classList.add("lsp-redireccion-app");
    window.location.replace({json.dumps(app_url, ensure_ascii=False)});
  </script>
  <style>
    body{{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f5f8fc;color:#172033;line-height:1.6}}
    main{{max-width:900px;margin:32px auto;padding:0 18px 48px}}
    article{{background:#fff;border:1px solid #dbe5f0;border-radius:24px;padding:clamp(22px,4vw,40px)}}
    h1{{color:#1265d8;margin:.2em 0}} .resumen{{color:#475467}}
    .palabras-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-top:24px}}
    .palabra-card{{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:#172033;font-weight:800;background:#fff;border:1px solid #dbe5f0;border-radius:16px;padding:10px;box-shadow:0 5px 16px rgba(15,28,53,.06)}}
    .palabra-card img{{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;background:#eef3f8}}
    .cta{{display:inline-flex;margin-top:24px;background:#1265d8;color:#fff;text-decoration:none;font-weight:800;border-radius:14px;padding:12px 16px}}
  </style>
</head>
<body><main><article>
  <div>Vocabulario · Colección</div>
  <h1>{escape(nombre)}</h1>
  <p class="resumen">{escape(descripcion)}</p>
  <div class="palabras-grid">{tarjetas_html}</div>
  <a class="cta" href="{escape(app_url, quote=True)}">Abrir esta colección en LSPedia</a>
</article></main></body></html>
"""
        (destino / "index.html").write_text(html, encoding="utf-8", newline="\n")

        social_dir = destino / f"compartir-{SOCIAL_PREVIEW_VERSION}"
        social_dir.mkdir(parents=True, exist_ok=True)
        social_image_name = f"preview-{SOCIAL_PREVIEW_VERSION}.jpg"
        shutil.copyfile(destino / "preview.jpg", destino / social_image_name)
        social_url = f"{canonical}compartir-{SOCIAL_PREVIEW_VERSION}/"
        social_image = f"{canonical}{social_image_name}"
        social_html = html.replace(
            f'<meta property="og:url" content="{escape(canonical, quote=True)}">',
            f'<meta property="og:url" content="{escape(social_url, quote=True)}">',
        ).replace(
            escape(imagen, quote=True),
            escape(social_image, quote=True),
        )
        (social_dir / "index.html").write_text(social_html, encoding="utf-8", newline="\n")
        total += 1

    return total


def generar_categorias(repo: Path, filas_dic: list[dict], filas_voc: list[dict]) -> int:
    """Genera páginas compartibles de categorías con Open Graph estático."""
    raiz = repo / "categoria"
    preparar_directorio(raiz)
    total = 0

    for tipo, filas in (("diccionario", filas_dic), ("vocabulario", filas_voc)):
        publicables = [
            fila for fila in filas
            if (publicable_diccionario(fila) if tipo == "diccionario" else publicable_vocabulario(fila))
        ]
        grupos: dict[str, list[dict]] = {}
        nombres: dict[str, str] = {}
        for fila in publicables:
            nombre = texto(fila.get("categoria"))
            ref = slug(nombre)
            if not ref:
                continue
            grupos.setdefault(ref, []).append(fila)
            nombres.setdefault(ref, nombre)

        for ref, items in sorted(grupos.items()):
            nombre = nombres[ref]
            canonical = f"{BASE_URL}/categoria/{tipo}/{quote(ref, safe='')}/"
            if tipo == "vocabulario":
                app_url = f"{BASE_URL}/index.html?vista=vocabulario&categoria={quote(nombre, safe='')}"
                seccion = "Vocabulario"
            else:
                app_url = f"{BASE_URL}/index.html?categoriaDiccionario={quote(nombre, safe='')}"
                seccion = "Diccionario"

            destino = raiz / tipo / ref
            destino.mkdir(parents=True, exist_ok=True)
            crear_preview_categoria(repo, items, destino)
            imagen = f"{canonical}preview.jpg"

            palabras = [texto(x.get("palabra")) for x in items if texto(x.get("palabra"))]
            muestra = ", ".join(palabras[:12])
            descripcion = limpiar_texto_meta(
                f"Explora {len(palabras)} palabras de la categoría {nombre} en {seccion} de LSPedia, "
                "con apoyo visual y Lengua de Señas Peruana (LSP)."
            )
            titulo = f"{nombre} — {seccion} | LSPedia"
            ld = {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "name": titulo,
                "url": canonical,
                "description": descripcion,
                "inLanguage": "es-PE",
                "isPartOf": {"@type": "WebSite", "name": "LSPedia", "url": f"{BASE_URL}/"},
                "primaryImageOfPage": {"@type": "ImageObject", "contentUrl": imagen},
            }
            html = f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{escape(titulo)}</title>
  <meta name="description" content="{escape(descripcion, quote=True)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="{escape(canonical, quote=True)}">
  <link rel="icon" type="image/png" href="{BASE_URL}/img/favicon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="LSPedia">
  <meta property="og:locale" content="es_PE">
  <meta property="og:url" content="{escape(canonical, quote=True)}">
  <meta property="og:title" content="{escape(titulo, quote=True)}">
  <meta property="og:description" content="{escape(descripcion, quote=True)}">
  <meta property="og:image" content="{escape(imagen, quote=True)}">
  <meta property="og:image:secure_url" content="{escape(imagen, quote=True)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Imagen de la categoría {escape(nombre, quote=True)} en LSPedia">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{escape(titulo, quote=True)}">
  <meta name="twitter:description" content="{escape(descripcion, quote=True)}">
  <meta name="twitter:image" content="{escape(imagen, quote=True)}">
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")}</script>
  <style>
    html.lsp-redireccion-app body{{opacity:0;visibility:hidden}}
  </style>
  <script>
    // Los rastreadores sociales leen Open Graph; los navegadores humanos
    // entran a la aplicación sin mostrar la página SEO intermedia.
    document.documentElement.classList.add("lsp-redireccion-app");
    window.location.replace({json.dumps(app_url, ensure_ascii=False)});
  </script>
  <style>
    body{{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f5f8fc;color:#172033;line-height:1.6}}
    header{{background:#0f1c35;padding:18px 20px}} header img{{width:150px;height:auto}}
    main{{max-width:900px;margin:32px auto;padding:0 18px 48px}}
    article{{background:#fff;border:1px solid #dbe5f0;border-radius:24px;padding:clamp(22px,4vw,40px);box-shadow:0 18px 45px rgba(15,28,53,.08)}}
    h1{{color:#1265d8;font-size:clamp(2rem,5vw,3.2rem);margin:.2em 0}} .tipo{{font-weight:700;color:#667085}}
    .grid{{display:grid;grid-template-columns:1fr minmax(220px,340px);gap:28px;align-items:start;margin-top:24px}}
    .imagen{{width:100%;border-radius:18px;border:1px solid #dbe5f0}} .palabras{{color:#475467}}
    .cta{{display:inline-flex;margin-top:20px;background:#ffc107;color:#14213a;text-decoration:none;font-weight:800;border-radius:14px;padding:13px 18px}}
    @media(max-width:680px){{.grid{{grid-template-columns:1fr}}}}
  </style>
</head>
<body>
<header><a href="{BASE_URL}/"><img src="{BASE_URL}/img/lspedia.png" alt="LSPedia"></a></header>
<main><article>
  <div class="tipo">{escape(seccion)} · Categoría</div>
  <h1>{escape(nombre)}</h1>
  <p>{escape(descripcion)}</p>
  <div class="grid">
    <div>
      <p class="palabras"><strong>Incluye:</strong> {escape(muestra)}{("…" if len(palabras) > 12 else "")}</p>
      <a class="cta" href="{escape(app_url, quote=True)}">Explorar categoría en LSPedia →</a>
    </div>
    <img class="imagen" src="{escape(imagen, quote=True)}" alt="Categoría {escape(nombre, quote=True)}" loading="eager">
  </div>
</article></main>
</body></html>
"""
            (destino / "index.html").write_text(html, encoding="utf-8", newline="\n")

            # Página exclusiva para compartir. Usa una URL física versionada
            # (sin query string) y og:url idéntico a la URL compartida, para
            # evitar que WhatsApp reutilice previews antiguos de la canonical.
            social_dir = destino / f"compartir-{SOCIAL_PREVIEW_VERSION}"
            social_dir.mkdir(parents=True, exist_ok=True)
            social_image_name = f"preview-{SOCIAL_PREVIEW_VERSION}.jpg"
            social_image_path = destino / social_image_name
            shutil.copyfile(destino / "preview.jpg", social_image_path)
            social_url = f"{canonical}compartir-{SOCIAL_PREVIEW_VERSION}/"
            social_image = f"{canonical}{social_image_name}"
            social_html = html
            social_html = social_html.replace(
                '<meta name="robots" content="index,follow,max-image-preview:large">',
                '<meta name="robots" content="noindex,follow,max-image-preview:large">',
            )
            social_html = social_html.replace(
                f'<meta property="og:url" content="{escape(canonical, quote=True)}">',
                f'<meta property="og:url" content="{escape(social_url, quote=True)}">',
            )
            social_html = social_html.replace(
                escape(imagen, quote=True),
                escape(social_image, quote=True),
            )
            (social_dir / "index.html").write_text(social_html, encoding="utf-8", newline="\n")
            total += 1
    return total

def main() -> int:
    repo = Path(__file__).resolve().parent.parent
    diccionario = cargar_lista(repo / "data" / "palabras.json")
    vocabulario = cargar_lista(repo / "data" / "vocabulario.json")
    total_dic = generar_diccionario(repo, diccionario)
    total_voc = generar_vocabulario(repo, vocabulario)
    total_cat = generar_categorias(repo, diccionario, vocabulario)
    total_col = generar_colecciones(repo, vocabulario)
    if total_dic == 0 and total_voc == 0:
        raise SystemExit("ERROR: no se generó ninguna página SEO.")
    print(f"Páginas SEO generadas: Diccionario={total_dic} · Vocabulario={total_voc} · Categorías={total_cat} · Colecciones={total_col}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
