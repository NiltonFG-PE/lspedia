# LSPedia

**Sitio oficial:** https://lspedia.site/

LSPedia es un **diccionario visual de español con apoyo en Lengua de Señas Peruana (LSP)**. Es un proyecto gratuito orientado especialmente a personas sordas que necesitan comprender palabras y conceptos del español mediante explicaciones sencillas, apoyo visual y videos en LSP.

LSPedia **no es un diccionario para imponer o enseñar señas**. La Lengua de Señas Peruana pertenece a su comunidad lingüística y puede presentar variantes regionales. Los videos de LSPedia sirven como apoyo para comprender conceptos expresados en español y respetan esa diversidad.

## Objetivos

- Facilitar la comprensión de palabras y conceptos del español.
- Ofrecer apoyo visual y videos en LSP.
- Explorar vocabulario y categorías de manera accesible.
- Incluir herramientas educativas, alfabetización y juegos.
- Mantener una experiencia gratuita, visual y útil para personas sordas.

## Tecnologías

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- GitHub Pages

## Identidad oficial

El dominio oficial del proyecto es **https://lspedia.site/**. Una copia del repositorio publicada en otro dominio no constituye una versión oficial de LSPedia ni está autorizada para reutilizar sus integraciones, formularios o servicios.

## Licencia y autoría

© 2026 Nilton F. G. (NiltonFG-PE). Todos los derechos reservados.

Este repositorio es público únicamente para permitir su revisión y el funcionamiento del sitio mediante GitHub Pages. La visibilidad pública del código **no autoriza copiar, modificar, redistribuir ni reutilizar** el código, diseño, textos, imágenes, videos u otros contenidos del proyecto.

Consulta [LICENSE.md](./LICENSE.md) para el detalle completo.


## Validación y organización de la búsqueda

El motor puro vive en `js/busqueda-core.js`. Su prioridad es palabra exacta en
Diccionario, palabra exacta en Vocabulario y variante registrada en Diccionario;
las aproximaciones y correcciones se evalúan después. `vocabulario-publico.js`
expone una sola carga pública con estados de carga, éxito y error. El Quiz
conserva su banco independiente.

Pruebas locales:

```sh
npm ci
npm test
npx playwright install chromium --only-shell
npm run test:browser
python scripts/validar_sitemap_publico.py
python scripts/validar_senas_ia.py
```

Las pruebas de navegador aíslan servicios externos y cubren búsquedas, carga
lenta, recuperación de red y gestos móviles. El laboratorio experimental
`lab-senas-ia.html` mantiene su módulo y dataset independientes.

Al actualizar datos públicos, generar y validar las páginas antes de publicar:

```sh
python scripts/generar_paginas_seo.py
python scripts/generar_sitemap.py
python scripts/validar_sitemap_publico.py
```
