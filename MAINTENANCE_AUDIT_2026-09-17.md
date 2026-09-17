# Auditoría integral de mantenimiento — 17 de septiembre de 2026

Estado: **completada sobre la rama `develop`**.

Se ejecutaron las validaciones automáticas vigentes del proyecto y una revisión adicional de contenido, duplicados, Alfabetización, seguridad, red, rendimiento, PWA, SEO, imágenes y archivos históricos. No se eliminaron datos editoriales ambiguos.

## Correcciones aplicadas

1. Se actualizó `scripts/validar_seo_estatico.py` para proteger la arquitectura SEO vigente con rutas estáticas `/diccionario/<slug>/` y `/vocabulario/<slug>/`, en lugar de exigir las URLs antiguas con parámetros.
2. Se aclaró en `sw.js` la estrategia real de caché: `palabras.json` y `busqueda-ayudas.json` permanecen fuera del Service Worker, mientras otras fuentes pueden formar parte del shell.
3. Se mejoró `scripts/auditar-seguridad.mjs` para no clasificar como riesgo alto un simple `innerHTML = ""` usado para vaciar contenedores y para reconocer `rel="noopener"` asignado por JavaScript en líneas cercanas. Resultado posterior: **0 críticos, 0 altos**.
4. Se mejoró `scripts/auditar_duplicados.py` para mostrar explícitamente los casos multicategoría que requieren criterio editorial.

## Estado de contenido

### Diccionario

- Registros totales: **1711**.
- Registros públicos actualmente: **27**.
- Categorías totales: **35**.
- Faltan definición: **629**.
- Faltan imagen real publicable: **1684**.
- Faltan video: **1684**.
- Públicos sin video: **0**.

El video no bloquea la publicación pública, pero definición + imagen real sí son necesarias en Diccionario.

### Vocabulario

- Registros totales: **71**.
- Públicos: **71**.
- Con imagen: **71**.
- Con video: **71**.
- Sin definición de apoyo: **71**.

La definición de apoyo no bloquea la publicación actual de Vocabulario.

### Publicación real

- Palabras públicas entre Diccionario y Vocabulario: **98**.
- Videos públicos: **98**.
- Categorías públicas sumadas por sección: **17**.
- Sitemap: **100 URLs** (27 Diccionario + 71 Vocabulario + páginas institucionales).

## Duplicados

No existen copias completamente idénticas que puedan borrarse automáticamente con seguridad.

Existe un único nombre repetido dentro del Diccionario:

- **Análisis — Educación**: `analisis-educacion`.
- **Análisis — Salud**: `analisis-salud`.

Ambos tienen definición e imagen y pertenecen a categorías diferentes. Se mantienen separados como posibles sentidos/contextos distintos.

Hay **17 palabras** presentes tanto en Diccionario como en Vocabulario. Esto es válido porque ambas fuentes son independientes: Aburrido, Aceptar, Amor, Asustado, Cansado, Cariño, Celos, Enojado, Envidia, Escuchar, Esperanza, Feliz, Practicar, Soledad, Sorprendido, Triste y Vergüenza.

## Alfabetización

- Caracteres: **47** (27 letras + 20 números).
- Ejemplos: **128**.
- Errores estructurales: **0**.
- Único recurso faltante detectado: **número 0 sin `imagenBoca` / recurso de fonética**.

No se creó un recurso artificial para el 0 porque debe corresponder al material pedagógico real.

## Seguridad

Después de mejorar el auditor:

- Hallazgos críticos: **0**.
- Hallazgos altos: **0**.
- Avisos informativos: **192**.
- Anti-clon: validado sin errores.
- Sintaxis JavaScript: validada.
- JSON principales: válidos.

Los avisos restantes corresponden principalmente a HTML dinámico e `onclick` heredado. Se mantienen como deuda de refactor gradual; no se hizo una sustitución masiva porque podría alterar la interfaz o los juegos.

## Red y resiliencia

La capa común de red está validada con timeout, reintentos y degradación parcial del banco de Juegos. Juegos sigue usando únicamente Vocabulario + Alfabetización y no imágenes del Diccionario.

## Rendimiento

Todos los archivos principales permanecen dentro del presupuesto conservador configurado:

- `index.html`: **310.1 KiB / 390.6 KiB**.
- `js/script.js`: **302.3 KiB / 390.6 KiB**.
- `css/estilos.css`: **74.3 KiB / 117.2 KiB**.
- `css/mejoras-producto.css`: **40.1 KiB / 78.1 KiB**.
- `sw.js`: **5.2 KiB / 34.2 KiB**.
- Shell PWA local: **870.1 KiB**, 44 entradas declaradas.

`js/script.js` continúa siendo grande y debe modularizarse gradualmente, pero no excede el presupuesto actual.

## Imágenes y archivos históricos

- Rutas locales activas revisadas: **318**.
- Errores de imagen: **0**.
- Avisos de nombres heredados: **46**; principalmente mayúsculas/tildes/espacios antiguos.

No se renombraron masivamente porque hacerlo sin migrar todas las referencias podría romper contenido existente. Para archivos nuevos se mantiene la regla: minúsculas, sin tildes y sin espacios.

Los archivos históricos marcados como retirados siguen sin referencias ejecutables. `data/alfabetizacion-mock.json` se conserva porque continúa siendo respaldo activo. El archivo multimedia protegido conserva su hash esperado.

## IA y videojuego

- Dataset del buscador por señas: válido, pero todavía **0 muestras / 0 conceptos**. La siguiente fase necesita muestras reales de LSP.
- Laboratorio de videojuego: validado, aislado, `noindex` y sin usar Diccionario como fuente visual.

## SEO y PWA

- H1 institucional: válido.
- Canonical por fuente: válido.
- Rutas `/diccionario/` y `/vocabulario/`: validadas.
- `robots.txt` y sitemap: válidos.
- PWA: versión de Service Worker **v157** y coherencia automática validada.

La prueba final de actualización/offline de PWA continúa requiriendo un dispositivo Android real.

## Resultado final

El workflow integral terminó correctamente después de las correcciones. No quedaron errores automáticos de código, datos, SEO, seguridad, red, publicación, sitemap, imágenes o rendimiento.

Los pendientes reales después de esta auditoría son principalmente **editoriales o dependen de material real**: completar contenido del Diccionario, agregar definiciones de apoyo a Vocabulario si se desea, añadir la fonética del número 0, recopilar muestras reales para IA y realizar pruebas físicas de PWA en Android.
