# LSPedia — avance autónomo de las 13 tareas

**Fecha:** 17/09/2026  
**Rama:** `develop`  
**Documento base anterior:** `MAINTENANCE_AUDIT_2026-09-17.md`

Este archivo registra el trabajo realizado de forma autónoma después de la auditoría integral. Distingue entre tareas cerradas en esta etapa, tareas con progreso técnico real y tareas que aún necesitan material, cuentas o pruebas físicas externas.

## 1. Modularización gradual de `js/script.js`

**Estado: AVANZADO, no terminado.**

- Se creó `js/lspedia-media.js` como primer módulo extraído del archivo principal.
- Las funciones `ajustarAspectoReproductorPalabra()` y `ajustarAspectoReproductorSugerida()` ya delegan las consultas oEmbed y el ajuste de proporción de video al nuevo módulo.
- `index.html` carga el módulo antes de `js/script.js`.
- El módulo se añadió al cascarón PWA.
- La estrategia seguirá siendo extraer bloques pequeños y comprobables, no dividir masivamente el archivo en una sola operación.

## 2. Reducción gradual de avisos de seguridad

**Estado: AVANZADO.**

- Auditoría anterior: 0 críticos, 0 altos, 192 avisos.
- Auditoría posterior a esta tanda: 0 críticos, 0 altos, 189 avisos.
- `js/lo-nuevo.js` dejó de construir sus tarjetas mediante `innerHTML` dinámico y eventos `onclick`; ahora usa nodos DOM, `textContent` y `addEventListener`.
- Los 189 restantes son avisos de refactor, principalmente HTML dinámico y eventos inline heredados. No deben describirse automáticamente como vulnerabilidades.

## 3. Resiliencia de red

**Estado: AVANZADO / etapa actual cerrada.**

- Service Worker actualizado a `v159`.
- Se añadió timeout y un reintento para solicitudes same-origin gestionadas por el Service Worker.
- Se conserva la estrategia cache-first/stale-while-revalidate del cascarón.
- `js/lo-nuevo.js`, `js/vocabulario-publico.js`, `js/lspedia-media.js` y el laboratorio del videojuego ahora manejan mejor fallos breves de red.
- `data/palabras.json` y `data/busqueda-ayudas.json` siguen fuera del caché del Service Worker por diseño.

## 4. “Misión LSPedia”

**Estado: ETAPA TÉCNICA MEJORADA.**

En `js/lab-juego-educativo.js` se incorporó:

- dificultad por nivel;
- mejor banco de preguntas de español y matemáticas;
- preguntas visuales de Vocabulario;
- explicaciones después de responder;
- puntuación distinta según dificultad;
- bonificación por racha;
- progreso local por modo y nivel;
- récord y precisión;
- navegación de opciones con flechas del teclado;
- foco y `aria-live` para feedback;
- carga de datos con timeout/reintento;
- prevención de repetición inmediata.

El laboratorio continúa aislado y **no usa Diccionario como fuente de imágenes**.

## 5. Buscador por señas con IA

**Estado: HERRAMIENTAS TÉCNICAS AVANZADAS; dataset real aún vacío.**

- Se creó `scripts/evaluar_dataset_senas.py`.
- El evaluador revisa etiquetas, dimensiones, participantes y balance.
- La separación entrenamiento/prueba se plantea por **persona firmante**, no por fotogramas o muestras de una misma persona, para evitar una medición engañosa.
- `data/senas-ia-dataset.json` documenta los metadatos mínimos recomendados y la regla de privacidad.
- Estado real del dataset: 0 conceptos y 0 muestras. No existe todavía una precisión real que pueda publicarse.

## 6. Definiciones de apoyo de Vocabulario

**Estado: COMPLETADO EN ESTA ETAPA.**

- Se creó `data/vocabulario-definiciones.json` con definiciones de apoyo para las 71 palabras actuales.
- `js/vocabulario-publico.js` integra esas definiciones solo cuando la definición principal está vacía.
- Si en el futuro Google Sheets trae una definición editorial, esa definición tiene prioridad.
- Si el archivo auxiliar no carga, Vocabulario continúa funcionando sin bloquearse.
- Este suplemento no cambia videos, imágenes, niveles ni señas.

## 7. Definiciones faltantes del Diccionario

**Estado: AVANZADO.**

- Se redactaron y aplicaron 24 definiciones nuevas de las áreas Animales y Bienestar.
- Se modificaron exclusivamente registros cuya definición estaba vacía.
- No se tocaron imágenes, videos, IDs ni señas.
- Se creó `data/diccionario-definiciones-autonomas.json` como fuente editorial y `scripts/aplicar_mejoras_autonomas.py` como aplicación repetible y segura.

## 8. Alfabetización

**Estado: ESTRUCTURA PEDAGÓGICA AMPLIADA.**

Se creó `data/alfabetizacion-actividades.json` con cuatro etapas:

1. Reconocer.
2. Relacionar.
3. Ordenar.
4. Producir.

Incluye criterios de progreso y mantiene la regla de que las actividades se apoyan en Alfabetización/AlfabetizacionEjemplos, no en imágenes del Diccionario. El recurso real `imagenBoca` del número 0 sigue pendiente y no se inventó.

## 9. Accesibilidad desde código

**Estado: AVANZADO; falta prueba manual con tecnologías de asistencia.**

`js/accesibilidad-segura.js` ahora refuerza:

- enlace “Saltar al contenido” con foco real;
- nombres accesibles de controles cuando existe una fuente segura;
- `aria-required` en campos obligatorios;
- regiones dinámicas `aria-live`;
- semántica de diálogos;
- `aria-modal` y asociación con título;
- foco inicial al abrir un diálogo;
- devolución del foco al elemento previo al cerrarlo;
- compatibilidad con eventos de modales Bootstrap y cambios dinámicos del DOM.

La validación definitiva con lector de pantalla, zoom, teclado y dispositivos reales sigue siendo manual.

## 10. Materiales imprimibles

**Estado: PROTOTIPO FUNCIONAL CREADO.**

Se creó `materiales-imprimibles.html`, mantenido fuera del menú público y con `noindex`.

Permite generar e imprimir fichas A4 de:

- Vocabulario;
- letras;
- números.

Incluye filtros, imagen real disponible, definición de apoyo, líneas para escribir y QR hacia la página pública de Vocabulario. El navegador permite imprimir o guardar en PDF. El servicio externo de QR solo recibe la URL pública de la palabra.

## 11. Vocabulario académico y profesional

**Estado: BANCO EDITORIAL CREADO.**

Se creó `data/vocabulario-academico-propuestas.json` con 64 propuestas, ocho por cada área:

- Psicología;
- Salud;
- Educación;
- Nutrición;
- Veterinaria;
- Tecnología;
- Agronomía;
- Trabajo y administración.

Cada término incluye un concepto breve. Permanecen como borrador editorial: no se publicaron automáticamente ni se les asignó una seña.

## 12. Financiamiento y sostenibilidad

**Estado: REVISIÓN 2026 DOCUMENTADA.**

Se creó `docs/FINANCIAMIENTO-LSPEDIA-2026.md` con:

- estado de convocatorias/reconocimientos relevantes revisados;
- CONADIS;
- Buenas Prácticas en Accesibilidad Universal;
- BCP + El Comercio — Peruanos que Suman;
- ProInnóvate/InnovaSuyu;
- PCM — Sello de Accesibilidad Digital;
- expediente de postulación que LSPedia debería mantener preparado;
- pitch reutilizable del proyecto;
- fuentes y recomendación de revisión periódica.

No se registró como “abierta” ninguna fuente de dinero que no hubiera sido verificada.

## 13. Documentación técnica

**Estado: ACTUALIZADA.**

Este documento registra el delta posterior a `MAINTENANCE_AUDIT_2026-09-17.md`. Además quedan versionados los nuevos archivos editoriales, pedagógicos, de IA, materiales imprimibles y financiamiento.

---

# Resultado general de esta tanda

Las 13 áreas recibieron trabajo real. Algunas se pudieron completar en esta etapa; otras son procesos continuos y se avanzaron sin ejecutar cambios masivos de riesgo.

## Elementos que todavía dependen de material, cuentas o pruebas externas

- prueba física de PWA/actualización/offline en Android;
- prueba end-to-end del Publicador instalado en Apps Script y respaldo de su fuente completa;
- muestras reales de LSP con consentimiento para el dataset de IA;
- recurso real `imagenBoca` del número 0;
- verificación de Google Search Console con la cuenta real;
- auditoría manual con lector de pantalla/dispositivos reales;
- producción de imágenes y videos reales que faltan en el Diccionario;
- revisión humana/comunitaria de nuevos términos antes de publicación.

## Próximos trabajos que todavía puedo seguir haciendo de forma autónoma

- continuar por tandas las definiciones vacías del Diccionario;
- extraer más bloques pequeños de `js/script.js`;
- sustituir gradualmente HTML dinámico y eventos inline heredados;
- integrar la estructura pedagógica experimental de Alfabetización cuando el diseño esté suficientemente estable;
- ampliar el banco profesional y los materiales imprimibles;
- seguir mejorando el videojuego y las herramientas de evaluación del dataset;
- mantener la documentación sincronizada con cada cambio.
