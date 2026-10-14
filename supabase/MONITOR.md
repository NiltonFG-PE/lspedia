# Comprobación de disponibilidad de Supabase

Proyecto: `lspedia-web`. Se añadió únicamente `public.lsp_service_health_v1()`.
Devuelve `true` mediante una consulta SQL con permisos del invocador. No lee
ni escribe tablas, no usa `security definer`, ni cambia permisos sobre miembros,
contenidos, Storage o Auth. La función acepta llamadas con la clave publicable
que ya utiliza `miembros/config.js`. No requiere contraseñas ni claves secretas.

La comprobación externa ejecuta:

```
python3 scripts/monitor_supabase.py --config miembros/config.js
```

Requiere HTTP 200 y respuesta booleana `true`; fallos de conexión, permisos,
función ausente o respuestas inesperadas dan código de salida distinto de cero.
Usa una solicitud GET con límite de veinte segundos, sin transmitir datos de
usuarios. Pruebas locales: `python3 -m unittest discover -s tests -p test_monitor_supabase.py`.

Una tarea programada en ChatGPT realiza la comprobación a las 06:00, 14:00 y
22:00, hora de Lima, y avisa aquí si falla. Descarga estos dos archivos de la rama
`develop` mediante la conexión GitHub, sin depender de una sesión del navegador
Supabase. Si la conexión GitHub o la ejecución de la tarea falla, debe avisar,
no dar el resultado por correcto. La tarea se gestiona desde las tareas de ChatGPT.
No se creó un workflow cron: el repositorio tiene otra rama predeterminada y
GitHub ejecuta los cron solo desde esa rama; se conserva todo el código en develop.

Las consultas de salud generan actividad real en la API y la base de datos.
Esto reduce el riesgo de pausa, pero no garantiza disponibilidad ni elimina
las reglas del plan gratuito. Las tareas pueden retrasarse, fallar o detenerse;
la política del proveedor también puede cambiar. No se ha contratado un plan.
La documentación oficial indica que poca actividad durante siete días puede
causar una pausa; Pro excluye las pausas por inactividad:
https://supabase.com/docs/guides/platform/free-project-pausing

Si el proyecto ya está pausado, la comprobación avisa; no puede reanudarlo con
una clave publicable. La reanudación requiere el panel y una sesión autorizada.
Para retirar el monitor, desactivar la tarea de ChatGPT; la función inocua puede
conservarse o eliminarse posteriormente mediante una migración revisada.
