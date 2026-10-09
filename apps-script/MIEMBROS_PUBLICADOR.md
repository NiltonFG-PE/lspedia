# Zona de miembros: hoja privada y Publicador

Fuente de contenido independiente:
https://docs.google.com/spreadsheets/d/1QfWa69Jb2CXjU8ed8VLe1k80mIerP-Ic31j-6lbMhAU/edit

Ese archivo fue creado con acceso solo del propietario. No hacerlo público ni
publicarlo en la web. No se necesitan cambios en el archivo Proyecto.

## Campos

`id`, `seccion`, `palabra`, `variantes`, `video`, `categoria`, `imagen`,
`definicion`, `fechaPublicacion`, `estado`.

- Sección: IS, ASL, Tutoriales o Profesores. Se puede añadir otra sección en Sheets.
- Estado: Borrador o Publicado. Sin estado se considera Borrador.
- Video: ID o enlace de YouTube. Un borrador puede no tener video.
- Fecha: fecha nativa de Sheets, dd/MM/yyyy o yyyy-MM-dd. Una fecha futura programa
  su aparición mediante la política de acceso de Supabase, sin publicar un JSON público.
- ID: UUID estable generado por el módulo. No editar ni reutilizar.
- Una identidad repetida (sección, palabra y categoría) se rechaza; seleccionar
  la ficha existente para editar. Los títulos y variantes se guardan como texto.

## Instalar en el Publicador actual

La extensión está instalada en el Publicador de Proyecto. Estos pasos permiten
reinstalarla si se necesita.

1. Añadir un archivo `.gs` llamado `MiembrosPublicador` con el contenido de
   `miembros_publicador.gs`. Conserva todos los archivos actuales.
2. Añadir un archivo HTML `PublicadorMiembrosUI` con el fragmento del mismo nombre.
3. En `PublicadorUI`, dentro de `<body>` y antes de `</body>`, incluir:
   `<?!= lspMiembrosFragmento_(); ?>`
   Aplicar también `PublicadorMiembrosNav.patch` a la plantilla actual: añade un botón propio, registra `miembros` en cambiarTipo, oculta el guardado general y carga el editor al entrar. La sección permanece oculta en las demás pestañas.
4. La cuenta que ejecuta el Apps Script debe poder editar la nueva hoja privada.
   El ID del archivo ya está configurado en el módulo; no usa Proyecto como fallback.
5. Comprobar en el panel de Sheets la pestaña Zona de miembros: crear borrador,
   editarlo y verificar la fila en el nuevo archivo. Las funciones nuevas exigen
   la clave del publicador en cada llamada, también en escritorio.
6. Actualizar una nueva versión de la misma implementación `/exec` para que
   el panel móvil vea la pestaña. La URL estable actual permanece igual.

## Conectar la publicación protegida

Proyecto existente: `lspedia-web`. La tabla nativa es `lsp_content`.

1. La integración aditiva `supabase/miembros-existing.sql` ya fue ejecutada.
   No ejecutar `miembros.sql` ni `miembros-sheet.sql` en este proyecto: corresponden a otro esquema.
2. Configurar en Script Properties del Apps Script:
   - `LSPEDIA_MIEMBROS_SUPABASE_URL`: URL del proyecto.
   - `LSPEDIA_MIEMBROS_SUPABASE_SECRET`: clave secret moderna o service_role antigua.
   Esta clave se guarda solo en el servidor. Nunca ponerla en `config.js`, la hoja,
   GitHub ni el HTML. No enviarla por el chat. El módulo no la devuelve en respuestas.
3. Usar Guardar para sincronizar después de editar una ficha desde el panel.
   Para cambios directos en Sheets, pulsar Sincronizar con la web. No se instala
   un disparador automático en esta primera versión.
4. Verificar con cuentas reales: publicado actual visible; futuro y borrador
   ocultos a miembros; variantes encontrables; imagen y categoría correctas.

Si Supabase aún no está configurado, Guardar conserva los datos en la hoja y
muestra que falta conectar la web. Si la sincronización falla, no se informa una
publicación exitosa: los datos quedan guardados para reintentar. La sincronización
valida todas las filas antes de tocar el catálogo remoto, asigna IDs estables y
respeta cambios concurrentes de Sheets con una revisión al editar desde el panel.

Las filas retiradas o los borradores sin video ocultan sus fichas sincronizadas.
Los registros manuales ajenos a esta hoja se conservan. No se exporta la hoja a
`data/palabras.json`, `data/vocabulario.json` ni a ninguna ruta pública de Apps Script.

El editor permite enlazar imágenes o subirlas mediante el mecanismo GitHub
existente. Las imágenes subidas van al repositorio público, como en Vocabulario;
el enlace del video no se guarda allí. Usar un origen privado autorizado si una
imagen también debe ser exclusiva. YouTube no listado sigue siendo compartible.

## Verificación realizada

- Archivo privado, columnas, formato de fecha y listas desplegables verificados
  mediante Google Sheets/Drive. Vista local de encabezados renderizada.
- Pruebas PostgreSQL locales de publicación programada y permisos RLS.
- Pruebas locales del módulo: autenticación obligatoria, variantes, borradores,
  IDs estables, duplicados, control de cambios y payload de sincronización.
- Estructura, administrador activo y políticas existentes inspeccionados en Supabase.
- Lectura real de la hoja privada verificada desde Apps Script.
- La sincronización requiere la clave privada del servidor en Script Properties.

## Imágenes, edición y eliminación

La pestaña tiene nueva ficha, buscador, edición, borrador y eliminación con confirmación. Reutiliza `optimizarImagenWebpPublicador` del panel para comprimir a WebP (máximo 1400 px, transparencia conservada), muestra el tamaño y una vista previa y permite quitar la imagen. La eliminación exige la clave del panel y la revisión actual. Cuando la conexión está configurada, primero oculta el registro remoto; si esto falla conserva la fila. Después guarda los diez campos originales más fechaEliminacion en MiembrosPapelera del mismo archivo privado y retira la fila. Para recuperar, copiar los diez primeros campos desde MiembrosPapelera a Miembros y sincronizar. La imagen y el video no se eliminan.

## Usuarios en el publicador

Zona de miembros contiene ahora Contenido y Usuarios. Usuarios consulta cuentas de Supabase en páginas de 50 y muestra únicamente ID, correo, rol, estado y confirmación del correo. El filtro y el buscador se aplican a la página visible. Activar/Suspender exige confirmación en la interfaz, la clave del Publicador y el estado anterior. El servidor protege administradores, valida IDs, confirma que la cuenta exista y condiciona la escritura para evitar sobrescribir cambios simultáneos. No modifica roles ni contraseñas ni envía invitaciones. Las cuentas deben existir en Supabase Auth.

Los usuarios y sus accesos permanecen en Supabase, no en la hoja privada ni en GitHub. Si falta la configuración del servidor, Usuarios muestra Conexión pendiente y no permite cambios. Completar esa conexión requiere guardar la clave secret en Script Properties del Apps Script, previa autorización del propietario por el acceso privilegiado que concede.

## Estado de conexión (9 octubre 2026)

Conexión completada con autorización del propietario. La URL y la clave secreta están guardadas en Script Properties; la clave no está en el repositorio ni en la hoja. Se aplicó `supabase/miembros-publisher-permissions.sql` tras confirmar el acceso del servidor: lectura/escritura de contenido y lectura/creación de miembros, con actualización restringida a status en cuentas existentes. No modifica anon, authenticated ni RLS.

Comprobación real desde el Publicador: Usuarios muestra la cuenta administradora protegida y la sincronización del catálogo finaliza correctamente. La hoja aún está vacía: la publicación de la primera ficha se comprobará cuando exista contenido real. Activación/suspensión y controles de concurrencia fueron probados con APIs simuladas; no se alteró el acceso de ninguna cuenta real durante la comprobación.

## Mejoras de miembros, versión 2

Instalar los archivos actualizados `miembros_publicador.gs` y
`PublicadorMiembrosUI.html` en el proyecto existente. Publicar una nueva versión
sobre la misma implementación móvil. No crear otra hoja ni otro publicador.

- Usuarios → Crear usuario: correo y contraseña inicial (mínimo 12 caracteres).
  Crea una cuenta pendiente; nunca escribe contraseñas en la hoja ni las devuelve.
  Después, activar su acceso. El administrador sigue protegido.
- Usuarios → Secciones y vencimiento: requiere aplicar primero
  `supabase/miembros-mejoras.sql` sobre las tablas existentes. El control queda
  desactivado si los campos todavía no existen. Una fecha incluye todo ese día
  en Lima. Sin fecha no vence; todas las secciones usa NULL; ninguna usa [].
- Colaboraciones: lee la carpeta privada creada por Google Forms y guarda
  revisiones en la pestaña Colaboraciones del archivo privado de miembros.
  Pendiente / Aprobado / Descartado no mueve, borra ni publica archivos.
  Solo archivos de video contenidos en esa carpeta pueden revisarse.

La biblioteca web incluye favoritos y últimos videos abiertos por cuenta y
por navegador. Guarda solo IDs y fechas en el dispositivo, nunca títulos ni
contraseñas. No sincroniza favoritos entre dispositivos ni recupera el segundo
exacto de reproducción. Las fichas compartidas piden acceso autorizado.

### Validación y activación

Las pruebas locales cubren permisos por sección, vencimiento, suspensión,
cuentas protegidas, creación pendiente, revisiones, búsquedas y aislamiento
entre cuentas. Usan APIs simuladas y PostgreSQL local; no prueban el correo.

Pendientes para activar las funciones administrativas: aplicar la migración
SQL, instalar ambos archivos en Apps Script y verificar el remitente de correo
en Authentication. Nunca repetir la migración inicial ni cambiar el registro
público para estas mejoras. La recuperación necesita la Redirect URL exacta
`https://lspedia.site/miembros/?recuperar=1` y un SMTP apto para los miembros.
