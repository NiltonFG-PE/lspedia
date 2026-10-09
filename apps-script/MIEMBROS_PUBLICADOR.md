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

Esta extensión está preparada y probada localmente. No está instalada en la
implementación de Apps Script hasta completar estos pasos con acceso al editor.

1. Añadir un archivo `.gs` llamado `MiembrosPublicador` con el contenido de
   `miembros_publicador.gs`. Conserva todos los archivos actuales.
2. Añadir un archivo HTML `PublicadorMiembrosUI` con el fragmento del mismo nombre.
3. En `PublicadorUI`, dentro de `<body>` y antes de `</body>`, incluir:
   `<?!= lspMiembrosFragmento_(); ?>`
   Esto añade un bloque plegable al panel actual y reutiliza su acceso autorizado.
4. La cuenta que ejecuta el Apps Script debe poder editar la nueva hoja privada.
   El ID del archivo ya está configurado en el módulo; no usa Proyecto como fallback.
5. Comprobar en el panel de Sheets el bloque Zona de miembros: crear borrador,
   editarlo y verificar la fila en el nuevo archivo. Las funciones nuevas exigen
   la clave del publicador en cada llamada, también en escritorio.
6. Actualizar una nueva versión de la misma implementación `/exec` para que
   el panel móvil vea el bloque. La URL estable actual permanece igual.

## Conectar la publicación protegida

Cuando exista el proyecto Supabase gratuito:

1. Ejecutar `supabase/miembros.sql` y después `supabase/miembros-sheet.sql`.
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
- Falta la prueba de extremo a extremo en la implementación real de Apps Script
  y en el proyecto Supabase del usuario, que todavía no está conectado.
