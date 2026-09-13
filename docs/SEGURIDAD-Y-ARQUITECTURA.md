# Seguridad y arquitectura de LSPedia

Actualizado: 2026-09-13.

## Principios

1. `lspedia.site` y `www.lspedia.site` son los hosts oficiales.
2. El frontend público nunca debe contener tokens de GitHub, claves privadas ni credenciales.
3. Los juegos visuales solo pueden consumir Vocabulario y AlfabetizacionEjemplos. Diccionario no es fuente de imágenes de juegos.
4. La información que llega de Sheets/JSON se trata como dato no confiable: debe mostrarse con `textContent` o escaparse antes de usar `innerHTML`.
5. El Publicador mantiene sus secretos en Script Properties.

## Arquitectura contra clones

En un sitio estático no existe una protección absoluta contra copiar HTML/CSS/JS público. La defensa aplicada es de identidad y reducción de valor del clon:

- el sitio oficial se reconoce por host;
- una copia en otro dominio muestra aviso de “copia no oficial”;
- una copia no oficial pierde el manifest y se intenta desregistrar su Service Worker, evitando que se instale como si fuera LSPedia oficial;
- canonical y analítica apuntan/funcionan únicamente para la identidad oficial;
- las capacidades privadas continúan fuera del frontend.

Para una protección mayor, cualquier servicio que requiera secreto o reglas de negocio sensibles debe vivir en backend y validar el origen/credencial en servidor.

## XSS

`script.js` ya contiene funciones de escape y normalización. La capa `lspedia-core.js` añade utilidades compartidas y defensa adicional contra URLs `javascript:`/`data:text/html`. El workflow `Seguridad LSPedia` ejecuta `scripts/auditar-seguridad.mjs` en cada push/PR a `develop`.

Los avisos de `innerHTML` no se bloquean automáticamente porque LSPedia tiene HTML estático construido por JavaScript. Deben revisarse gradualmente. Los patrones críticos sí bloquean el workflow.

## Apps Script

Hallazgos revisados:

- `GITHUB_TOKEN` se obtiene de Script Properties: correcto.
- el Publicador móvil usa una clave privada: conservarla fuera del frontend público.
- JSONP debe validar el nombre del callback antes de concatenarlo.
- no devolver mensajes de excepción internos a clientes públicos.
- mantener un solo `doGet` en todo el proyecto.

`Código.gs` y `Ejemplos.gs` requieren su fuente actual completa antes de cambiarlos. No se deben reemplazar desde una copia antigua.

## Deuda técnica

Las mejoras nuevas se implementan como módulos independientes (`lspedia-core`, banco compartido de juegos, PWA e índice A-Z) y se cargan desde `mejoras-producto.js`. Esto evita seguir creciendo `index.html` y `script.js` con lógica no relacionada.
