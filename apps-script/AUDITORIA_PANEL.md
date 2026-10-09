# Panel LSPedia — revisión del 9 de octubre de 2026

Instalado en el proyecto Apps Script conectado a Proyecto y publicado como
versión 73 de la implementación existente. No se modificaron sus permisos.

## Hallazgos corregidos

- La navegación horizontal ocultaba secciones: las nueve opciones se muestran
  en una cuadrícula adaptable, con nombres completos y estado seleccionado.
- Faltaba orientación por pantalla: cada sección tiene una ayuda breve que se
  actualiza también cuando la navegación ocurre desde el código existente.
- Había espacio vacío y demasiados efectos: controles y márgenes compactos,
  sombras suaves y eliminación de desenfoques en navegación y barras.
- Algunas etiquetas no estaban asociadas a su campo: se asocian cuando el
  campo siguiente tiene un ID; se conservan las etiquetas ya relacionadas.
- El CSS de etiquetas anulaba el atributo hidden en Miembros: la fecha manual
  y los formularios ocultos ahora respetan su visibilidad. Ayudas separadas en
  líneas y formulario de alta en dos columnas, una en pantallas pequeñas.
- Se refuerza el foco visible por teclado y se respeta movimiento reducido.

## Conservación y validación

Se trabajó sobre el contenido leído directamente del editor, con respaldo
local previo. Se conserva todo el código original salvo una llamada a la
actualización de ayuda al final de cambiarTipo; el nuevo bloque no llama al
servidor ni agrega dependencias. Todos los controles originales se conservan.
La lectura posterior al pegado coincidió exactamente con el archivo preparado.

Validación local: comparación del contenido anterior y posterior, compilación
de todos los scripts del template, controles originales, ayudas de las nueve
secciones, asociaciones de etiquetas y visibilidad de formularios ocultos.

Validación real: apertura y navegación de las nueve secciones, carga de
Usuarios desde Supabase y cambio visual entre plazo fijo y fecha manual.
La versión 73 fue confirmada por el diálogo de implementación.

No se crearon cuentas, publicaron fichas, eliminaron datos ni cambiaron accesos
durante la comprobación. Las operaciones con escritura se preservaron por
comparación de código, sin ejecutarlas sobre datos de producción. No se hizo
una medición de rendimiento en dispositivos móviles físicos; la mejora de
ligereza corresponde a los efectos visuales retirados.

Para restaurar, la implementación anterior es la versión 72.
