# Arquitectura actual de LSPedia

Actualizado: 15 de septiembre de 2026.

Este documento describe la arquitectura operativa de la rama `develop`. Su objetivo es evitar que futuras mejoras vuelvan a introducir reglas antiguas o mezclen fuentes que hoy están separadas.

## 1. Sitio oficial y despliegue

- Sitio oficial: `https://lspedia.site/`.
- Rama de trabajo y despliegue usada por el proyecto: `develop`.
- Frontend estático alojado con GitHub Pages.
- `js/security.js` y `js/lspedia-core.js` refuerzan la identidad oficial y limitan funciones sensibles en copias públicas.
- Una copia externa no debe instalarse como PWA, reutilizar integraciones sensibles ni competir en buscadores con el sitio oficial.

## 2. Reglas públicas

### Diccionario

Una ficha del Diccionario es pública/buscable cuando tiene:

**palabra + definición + categoría + imagen real.**

El video es opcional para la búsqueda y la ficha pública.

- Fuente: `data/palabras.json`.
- La fuente de verdad del filtro público vive en `js/script.js`, función `obtenerDatosDiccionarioPublicables()`.
- Una ficha sin video puede seguir apareciendo en búsqueda si tiene definición e imagen real.
- Una ficha sin video NO aparece en `Lo nuevo`.

### Vocabulario público

Una ficha de Vocabulario público necesita:

**palabra + categoría + imagen real.**

El video es opcional.

- Fuente estática: `data/vocabulario.json`.
- `scripts/generar_vocabulario.py` descarga la hoja `Vocabulario` y genera el JSON aplicando la regla pública por imagen real; ya no exige video.
- `js/vocabulario-publico.js` crea la colección pública usada por búsqueda, Vocabulario y estadísticas.
- `js/script.js` cuenta las fichas públicas de Vocabulario sin volver a exigir video.
- La carga usa la capa de red resiliente de `LSPediaCore`: timeout, reintento limitado y `cache: no-store`.

### Lo nuevo

- `js/lo-nuevo.js` exige video válido.
- Una ficha del Diccionario o Vocabulario puede ser pública sin video y, al mismo tiempo, quedar fuera de `Lo nuevo`.
- Esta diferencia es deliberada y está protegida por `scripts/validar_publicacion_publica.py`.

### Quiz

- `js/quiz.js` consume el banco de Vocabulario, pero filtra internamente las filas con video para las actividades que lo necesitan.
- El requisito de video del Quiz nunca define qué contenido es público.
- El banco del Quiz no debe utilizarse como filtro de publicación ni como fuente de estadísticas públicas de Vocabulario.

## 3. Juegos

Los juegos educativos deben usar únicamente:

- Vocabulario público.
- `AlfabetizacionEjemplos` / ejemplos de Alfabetización.

Nunca deben tomar imágenes del Diccionario.

El banco compartido se encuentra en `js/juegos-banco-compartido.js` y está integrado con Alfabetización. Ya no depende directamente de `QuizV2.obtenerBanco()`.

La carga del banco es tolerante a fallos parciales: si temporalmente no llega Vocabulario pero sí Alfabetización, o al revés, conserva la fuente disponible. Solo falla el banco cuando no puede cargar ninguna de las dos fuentes.

Los niveles de Alfabetización deben respetar el campo `nivel` cuando esté disponible.

## 4. Alfabetización

- Hoja: `Alfabetización`.
- Fuente principal web: `data/alfabetizacion.json`.
- Ejemplos: hoja `AlfabetizacionEjemplos`.
- Módulo: `js/alfabetizacion.js`.
- `data/alfabetizacion-mock.json` NO es basura: es un respaldo local deliberado y modo de prueba controlado.
- El JSON principal se sincroniza mediante los workflows y scripts de Alfabetización.
- La estructura admite fonética, grafía normal y cursiva, imagen/seña, orden y números ampliables desde Sheets.

## 5. Auditoría editorial de contenido

`scripts/auditar_contenido_pendiente.py` separa pendientes sin modificar datos:

- Diccionario: falta definición, falta imagen real y falta video.
- Vocabulario: falta imagen real y falta video.
- El video se informa como pendiente editorial, pero no bloquea la publicación pública.

`scripts/auditar_duplicados.py` clasifica sin borrar automáticamente:

- copias completamente idénticas;
- misma palabra + misma categoría con diferencias, que requieren decisión editorial;
- misma palabra en categorías distintas;
- coincidencias entre Diccionario y Vocabulario, que no son errores por sí mismas.

`--fix-exact` solo puede retirar copias completamente idénticas y nunca decide entre registros diferentes.

## 6. Red y manejo de errores

`js/lspedia-core.js` ofrece la capa común para cargas críticas:

- `fetchConTimeout()`;
- `leerJsonSeguro()`;
- timeout mediante `AbortController` cuando está disponible;
- reintentos limitados para fallos de red, 408, 425, 429 y errores 5xx;
- espera breve entre reintentos.

Esta capa no reemplaza globalmente `window.fetch`; los módulos la usan de forma explícita.

Actualmente la usan Vocabulario público y el banco compartido de Juegos. El laboratorio de señas tiene límites de espera propios porque carga MediaPipe, WASM y un modelo externo.

El panel privado de Analytics también tiene tolerancia específica a la latencia de Google Apps Script: cada intento espera hasta 45 segundos, realiza hasta tres intentos y conserva el último dashboard visible mientras intenta actualizar.

`scripts/validar_red_segura.py` protege la arquitectura de red general. `scripts/validar_admin_analytics.py` protege además los reintentos y el timeout del Admin.

## 7. PWA

- Manifest: `manifest.json`.
- Service Worker: `sw.js`.
- Versión actual del shell al actualizar este documento: `v131`.
- La caché del shell usa versionado explícito.
- `skipWaiting()` y `clients.claim()` permiten activar versiones nuevas sin esperar a cerrar todas las pestañas.
- Los JSON de contenido crítico se mantienen fuera de una caché agresiva para evitar mostrar publicaciones antiguas.
- `/admin/` y los laboratorios no deben recibir el fallback público de `index.html`.
- Cuando cambia `index.html` o un recurso del shell que deba reemplazarse en instalaciones existentes, se incrementa `VERSION_APP`.

La validación definitiva de actualización/offline continúa requiriendo un dispositivo Android real.

## 8. Seguridad

### Frontend público

- `js/security.js`: guardia de entorno, anti-clon y bloqueo de servicios sensibles en copias públicas.
- `js/security.js` NO define publicación ni estadísticas.
- `js/lspedia-core.js`: utilidades de texto/URL seguras, canonical, identidad oficial y utilidades de red resiliente.
- El CI ejecuta `scripts/validar_seguridad.py` y `scripts/auditar-seguridad.mjs`.
- `scripts/validar_publicacion_publica.py` impide que lógica de Quiz/publicación vuelva a mezclarse dentro de `security.js` y protege la separación Diccionario/Vocabulario/Quiz.

### Admin Analytics

- `admin/busquedas.html` usa JSONP para Apps Script.
- `admin/busquedas-diagnostico.js` bloquea endpoints JSONP administrativos que no sean un `/exec` HTTPS de `script.google.com`.
- El frontend reintenta automáticamente una conexión que falla de forma temporal antes de mostrar un error definitivo.
- Las claves administrativas deben vivir en Script Properties, no en GitHub.

### Publicador

- Hojas actuales: `Diccionario`, `Vocabulario`, `Alfabetización` y `AlfabetizacionEjemplos`.
- El Apps Script específico del Publicador no está versionado completamente en este repositorio.
- Las versiones manuales más recientes del Publicador incorporan edición de Alfabetización y apertura automática, pero su instalación/despliegue real sigue requiriendo comprobación en Apps Script y no debe darse por validado únicamente desde GitHub.

## 9. Buscador mediante señas con IA

Archivos principales:

- `lab-senas-ia.html`
- `js/lab-senas-ia.js`
- `data/senas-ia-dataset.json`
- `scripts/validar_senas_ia.py`

Estado actual:

1. cámara en navegador;
2. landmarks de hasta dos manos;
3. pose y rasgos faciales experimentales;
4. secuencias normalizadas;
5. comparación temporal;
6. Top 3 de conceptos candidatos;
7. muestras locales;
8. importación/exportación JSON;
9. evaluación experimental de precisión;
10. dataset central versionado y validado;
11. timeout para dataset central, motor de visión y carga del modelo;
12. predicción principal destacada arriba de la cámara y controles de cámara/búsqueda siempre accesibles.

El dataset central almacena landmarks, no videos. Para avanzar en precisión hacen falta muestras reales de LSP obtenidas con consentimiento y revisión humana.

## 10. Accesibilidad

La capa vigente es:

- `js/accesibilidad-segura.js`
- `css/accesibilidad-segura.css`

Los antiguos `js/accesibilidad.js` y `css/accesibilidad.css` fueron retirados después de comprobar automáticamente que estaban huérfanos.

## 11. SEO

Ya existen:

- SEO dinámico por palabra;
- canonical por fuente;
- Open Graph/Twitter;
- datos estructurados WebSite/SearchAction;
- `js/seo-institucional.js` con información institucional adicional;
- `robots.txt` apuntando al sitemap oficial;
- sitemap automático limitado al contenido realmente público.

El sitemap incluye:

- fichas públicas del Diccionario;
- fichas públicas de Vocabulario con su URL `fuente=vocabulario`;
- portada y licencia.

No debe indexar borradores sin los campos exigidos por la regla pública.

H1 institucional, tanto en el HTML inicial como en el refuerzo dinámico:

**Diccionario visual de español con apoyo en Lengua de Señas Peruana (LSP)**

`scripts/validar_sitemap_publico.py` compara el sitemap completo contra las fuentes de datos y `scripts/validar_seo_estatico.py` protege H1, canonical por fuente, metadatos principales, robots y coherencia mínima de la PWA.

Search Console y la comprobación de indexación real requieren acceso a la cuenta correspondiente.

## 12. Validaciones automáticas

`.github/workflows/validar-lspedia.yml` verifica, entre otros:

- Diccionario y Vocabulario;
- contenido pendiente sin modificar datos;
- duplicados sin modificar datos;
- Alfabetización;
- fuentes permitidas de Juegos;
- resiliencia de red;
- seguridad/anti-clon;
- sintaxis JavaScript;
- JSON principales;
- dataset de señas IA;
- laboratorio de videojuego;
- regla pública y estadísticas;
- sitemap público;
- SEO estático;
- panel Analytics y su conexión resiliente;
- separación entre publicación, Quiz y security;
- presupuesto del frontend;
- archivos históricos retirados/respaldo activo;
- imágenes locales;
- archivo multimedia protegido.

Además de ejecutarse con cambios relevantes y pull requests, tiene una comprobación programada semanal para detectar regresiones aunque no se esté trabajando activamente en una sección.

`.github/workflows/seguridad-lspedia.yml` ejecuta la auditoría específica de XSS, secretos y patrones inseguros.

## 13. Archivos que no deben eliminarse por parecer antiguos

- `data/alfabetizacion-mock.json`: respaldo activo.
- `scripts/separar_fuentes_chunk1.txt` a `chunk4.txt`: usados por `scripts/separar_diccionario_vocabulario.py` como parche idempotente de migración.
- `video/lspedia_transparente anterior.webm`: archivo protegido por hash en CI.

Los parches y workflows temporales deben eliminarse después de completar y validar su migración. `scripts/verificar_archivos_huerfanos.py` impide que varios temporales ya retirados reaparezcan por accidente.

## 14. Deuda técnica conocida

- Seguir modularizando `js/script.js` sin alterar navegación, autoplay, formularios o URLs existentes.
- Extender gradualmente la capa de red resiliente a módulos antiguos cuando se modifiquen, sin parchear `window.fetch` globalmente.
- Mantener separados los requisitos de publicación general de los requisitos específicos de Quiz/Juegos.
- No eliminar duplicados de datos automáticamente cuando haya que decidir cuál registro conservar; primero auditar y luego aplicar una política editorial explícita.
- Continuar revisando archivos históricos antes de eliminarlos; no borrar por nombre o antigüedad solamente.
- Completar el dataset real del buscador por señas y medir precisión antes de integrarlo públicamente.
- Completar recursos editoriales faltantes de Alfabetización y contenido (definiciones, imágenes, fonética y videos) desde las herramientas de edición correspondientes.
