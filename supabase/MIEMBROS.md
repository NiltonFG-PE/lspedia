# Activar la zona de miembros sin un plan de pago

El código está preparado, pero no habrá acceso real hasta configurar un proyecto
Supabase y ejecutar la migración. Nunca se simula seguridad con una contraseña en HTML.

1. Crear un proyecto en el plan **Free** de Supabase. Conservar la contraseña de
   la base de datos en privado. No contratar complementos ni planes de pago.
2. Ejecutar `supabase/miembros.sql` una vez en SQL Editor. Se crean las cuatro
   secciones iniciales, sin videos ni cuentas de demostración.
3. En Authentication, desactivar **Allow new users to sign up** y no activar
   proveedores externos ni acceso anónimo. La biblioteca requiere aprobación
   incluso si esta configuración se omite por error.
4. En Authentication → Users, crear tu cuenta con correo y contraseña mediante
   **Add user → Create new user**. Usar una contraseña segura; no compartirla.
   Ejecutar el bloque comentado al final de la migración, reemplazando
   `TU_CORREO` por tu correo, para dar a esa cuenta el rol de administrador.
5. Configurar `miembros/config.js` con la URL del proyecto y su clave **publishable**
   (o la antigua clave `anon`). Ambas son públicas. Nunca usar `service_role`,
   una clave secret ni la contraseña de la base de datos en archivos de la web.
6. Cuando las pruebas reales pasen, convertir las dos tarjetas «Próximamente»
   de `index.html` en enlaces a `miembros/`, quitar `disabled` y `aria-disabled`
   y cambiar el estado a «Ingresar». Hasta entonces se mantienen desactivadas.
7. Publicar en el alojamiento actual de LSPedia y comprobar el flujo de acceso.
   Ningún cambio de hosting es necesario.

## Administración

Entrar a Herramientas → Zona de miembros → Administrar.

- Añadir un enlace de YouTube, título, descripción, sección y palabras para buscar.
- Guardar borradores o publicar; editar o quitar videos del catálogo.
- Crear secciones nuevas, que obtienen automáticamente su propio buscador.
- Crear cuentas con contraseña en Supabase Authentication → Users. No usar
  invitaciones por correo hasta configurar y probar un proveedor SMTP.
- Pulsar Actualizar usuarios y Autorizar en el panel de LSPedia. Las cuentas
  nuevas aparecen pendientes y no pueden consultar el contenido.
- Suspender accesos en el panel. Las siguientes consultas se deniegan al instante
  desde la base de datos; la interfaz comprueba el estado cada minuto y al volver
  a la pestaña. No se puede retirar un enlace de YouTube que alguien ya copió.
- Para contraseñas olvidadas, usar «¿Olvidaste tu contraseña?» en el login.
  El enlace abre la pantalla para crear y confirmar una contraseña nueva.
  Cambiar la contraseña no aprueba ni reactiva una cuenta suspendida.
  No se habilita registro público.

## Seguridad y límites

La autenticación usa correo y contraseña, no un enlace de entrada. Cada llamada
al catálogo se autoriza con un token y políticas RLS. Los visitantes anónimos,
pendientes y suspendidos no pueden leerlo. Un miembro no puede editar contenido,
ver la lista de usuarios ni cambiar su rol o estado. Los borradores solo los ve
el administrador. Las contraseñas las procesa Supabase Auth y no se almacenan
ni se muestran en LSPedia. El token dura lo que configure Supabase; se conserva
solo en sessionStorage, sin renovar la sesión automáticamente. Al caducar,
el usuario vuelve a iniciar sesión.

Los videos **no listados** de YouTube se pueden insertar si permiten inserción;
cualquiera con su enlace puede verlos y compartirlos fuera de LSPedia. Videos
privados requieren autorización independiente en Google/YouTube y no se vuelven
accesibles por iniciar sesión en LSPedia. La base de datos guarda referencias,
no archivos de video. El servicio gratuito tiene límites y puede pausarse por
inactividad. No se afirma que los recursos sean ilimitados ni que el acceso
esté operativo antes de activar el proyecto.

## Comprobaciones necesarias antes de abrir el acceso

Con un proyecto real, verificar directamente mediante la API:

1. Sin sesión: no se leen miembros, categorías, contenido ni la lista de usuarios.
2. Cuenta pendiente: no se lee contenido; no se puede cambiar el estado propio.
3. Miembro activo: ve publicados, busca por sección y reproduce un video real.
   No ve borradores, no añade/edita/elimina contenido, no llama RPC de administración.
4. Administrador: añade, edita, publica y elimina; crea secciones y autoriza usuarios.
5. Suspender a un miembro con sesión abierta: la siguiente lectura devuelve
   cero contenido, el reproductor no abre nuevos videos y la interfaz se bloquea.
6. Sesión caducada, cierre de sesión, recarga, errores de red y caracteres
   especiales en títulos: no aparecen datos privados sin una sesión autorizada.

Referencias oficiales:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/docs/guides/auth/general-configuration
- https://support.google.com/youtube/answer/157177

## Recuperación por correo

En Authentication → URL Configuration, añadir exactamente esta Redirect URL:
`https://lspedia.site/miembros/?recuperar=1`.
Mantener las demás direcciones existentes. El correo usa la plantilla de
restablecimiento de Supabase. No incluir claves secretas en la plantilla.

El remitente predeterminado de Supabase tiene restricciones: comprobar SMTP
antes de ofrecer recuperación a usuarios externos al equipo del proyecto.
Sin un SMTP configurado, no prometer envío de correos a todos los miembros.
No contratar servicios de pago sin autorización.

Verificar con una cuenta de prueba: recibir el correo, abrirlo, crear una nueva
contraseña, ingresar de nuevo y confirmar que se conserva el estado del miembro.
Los tokens del enlace se eliminan de la dirección, se validan en Supabase y se
mantienen solo en memoria durante el cambio. Un enlace inválido o caducado pide
solicitar otro. Las pruebas locales usan respuestas simuladas; no prueban SMTP.
