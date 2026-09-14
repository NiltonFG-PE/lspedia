# Arquitectura actual de LSPedia

Actualizado: 14 de septiembre de 2026.

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

- Fuente: `data/vocabulario.json`.
- `js/vocabulario-publico.js` crea la colección pública por imagen y sustituye únicamente el getter público usado por búsqueda, Vocabulario y estadísticas.
- El video sigue siendo opcional para Vocabulario público.

### Lo nuevo

- `js/lo-nuevo.js` exige video válido.
- Una ficha del Diccionario puede ser buscable sin video y, al mismo tiempo, quedar fuera de `Lo nuevo`.
- Esta diferencia es deliberada y está protegida por `scripts/validar_publicacion_publica.py`.

### Quiz

- `js/quiz.js` conserva su banco interno.
- El Quiz puede exigir video porque su mecánica lo necesita.
- El banco del Quiz no debe utilizarse como filtro de publicación ni como fuente de estadísticas públicas de Vocabulario.

## 3. Juegos

Los juegos educativos deben usar únicamente:

- Vocabulario público.
- `AlfabetizacionEjemplos` / ejemplos de Alfabetización.

Nunca deben tomar imágenes del Diccionario.

El banco compartido se encuentra en `js/juegos-banco-compartido.js`. Los niveles de Alfabetización deben respetar el campo `nivel` cuando esté disponible.

## 4. Alfabetización

- Fuente principal: `data/alfabetizacion.json`.
- Módulo: `js/alfabetizacion.js`.
- `data/alfabetizacion-mock.json` NO es basura: es un respaldo local deliberado y modo de prueba controlado.
- El JSON principal se sincroniza mediante los workflows y scripts de Alfabetización.

## 5. PWA

- Manifest: `manifest.json`.
- Service Worker: `sw.js`.
- La caché del shell usa versionado explícito.
- `skipWaiting()` y `clients.claim()` permiten activar versiones nuevas sin esperar a cerrar todas las pestañas.
- Los JSON de contenido crítico se mantienen fuera de una caché agresiva para evitar mostrar publicaciones antiguas.
- `/admin/` y los laboratorios no deben recibir el fallback público de `index.html`.

La validación definitiva de actualización/offline continúa requiriendo un dispositivo Android real.

## 6. Seguridad

### Frontend público

- `js/security.js`: guardia de entorno, anti-clon y bloqueo de servicios sensibles en copias públicas.
- `js/security.js` NO define publicación ni estadísticas.
- `js/lspedia-core.js`: utilidades de texto/URL seguras, canonical e identidad oficial.
- El CI ejecuta `scripts/validar_seguridad.py` y `scripts/auditar-seguridad.mjs`.
- `scripts/validar_publicacion_publica.py` impide que lógica de Quiz/publicación vuelva a mezclarse dentro de `security.js`.

### Admin Analytics

- `admin/busquedas.html` usa JSONP para Apps Script.
- `admin/busquedas-diagnostico.js` bloquea endpoints JSONP administrativos que no sean un `/exec` HTTPS de `script.google.com`.
- Las claves administrativas deben vivir en Script Properties, no en GitHub.

### Publicador

El Apps Script específico del Publicador no está versionado completamente en este repositorio. Por eso su auditoría interna completa no puede considerarse cerrada desde GitHub.

## 7. Buscador mediante señas con IA

Archivos principales:

- `lab-senas-ia.html`
- `js/lab-senas-ia.js`
- `data/senas-ia-dataset.json`
- `scripts/validar_senas_ia.py`

Estado actual:

1. cámara en navegador;
2. landmarks de hasta dos manos;
3. secuencias normalizadas;
4. comparación temporal;
5. Top 3 de conceptos candidatos;
6. muestras locales;
7. importación/exportación JSON;
8. evaluación experimental de precisión;
9. dataset central versionado y validado.

El dataset central almacena landmarks, no videos. Para avanzar en precisión hacen falta muestras reales de LSP obtenidas con consentimiento y revisión humana.

## 8. Accesibilidad

La capa vigente es:

- `js/accesibilidad-segura.js`
- `css/accesibilidad-segura.css`

Los antiguos `js/accesibilidad.js` y `css/accesibilidad.css` fueron retirados después de comprobar automáticamente que estaban huérfanos.

## 9. SEO

Ya existen:

- SEO dinámico por palabra;
- canonical;
- sitemap automático;
- Open Graph/Twitter;
- datos estructurados WebSite/SearchAction;
- `js/seo-institucional.js` con información institucional adicional.

H1 institucional:

**Diccionario visual de español con apoyo en Lengua de Señas Peruana (LSP)**

Search Console y la comprobación de indexación real requieren acceso a la cuenta correspondiente.

## 10. Validaciones automáticas

`.github/workflows/validar-lspedia.yml` verifica, entre otros:

- Diccionario y Vocabulario;
- duplicados sin modificar datos;
- Alfabetización;
- seguridad/anti-clon;
- sintaxis JavaScript;
- JSON principales;
- dataset de señas IA;
- laboratorio de videojuego;
- regla pública y estadísticas;
- separación entre publicación, Quiz y security;
- presupuesto del frontend;
- archivos históricos retirados/respaldo activo;
- imágenes locales;
- archivo multimedia protegido.

`.github/workflows/seguridad-lspedia.yml` ejecuta la auditoría específica de XSS, secretos y patrones inseguros.

## 11. Archivos que no deben eliminarse por parecer antiguos

- `data/alfabetizacion-mock.json`: respaldo activo.
- `scripts/separar_fuentes_chunk1.txt` a `chunk4.txt`: usados por `scripts/separar_diccionario_vocabulario.py` como parche idempotente de migración.
- `video/lspedia_transparente anterior.webm`: archivo protegido por hash en CI.

## 12. Deuda técnica conocida

- Seguir modularizando `js/script.js` sin alterar navegación, autoplay, formularios o URLs existentes.
- Mejorar manejo uniforme de errores de red/JSON/offline.
- Mantener separados los requisitos de publicación general de los requisitos específicos de Quiz/Juegos.
- No eliminar duplicados de datos automáticamente cuando haya que decidir cuál registro conservar; primero auditar y luego aplicar una política editorial explícita.
- Continuar revisando archivos históricos antes de eliminarlos; no borrar por nombre o antigüedad solamente.
