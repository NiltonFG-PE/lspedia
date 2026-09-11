# Panel privado Admin / Analytics de LSPedia

La vista está en `admin/busquedas.html` y usa un backend independiente de Google Apps Script para consultar Google Analytics 4 sin exponer credenciales en GitHub.

El backend está en:

- `apps-script/admin_busquedas_ga4.gs`
- `apps-script/appsscript-admin-busquedas.json`

## Qué muestra el panel

- Usuarios activos en los últimos 30 minutos.
- Usuarios, sesiones, vistas de página, eventos y sesiones con interacción por periodo.
- Evolución diaria.
- Fuentes y canales de tráfico.
- Países y ciudades.
- Mapa geográfico.
- Páginas más vistas.
- Eventos principales.
- Búsquedas sin resultados (`search_no_results`).
- Ranking de términos que conviene agregar a LSPedia.
- Estado automático `Pendiente` / `Ya agregada`, comparando con `data/palabras.json` y `data/vocabulario.json`.
- Errores técnicos registrados por LSPedia: `image_load_error`, `media_load_error` y `app_runtime_error`.
- Exportación CSV de búsquedas sin resultado.

## Configuración una sola vez

### 1. Crear el proyecto Admin en Google Apps Script

Crea un proyecto independiente en Google Apps Script. No lo mezcles con el Publicador ni con los Apps Script de las hojas de contenido.

### 2. Copiar el backend

Abre `apps-script/admin_busquedas_ga4.gs`, copia todo el archivo y reemplaza el contenido de `Code.gs` en el proyecto Admin.

### 3. Configurar `appsscript.json`

En **Configuración del proyecto**, activa **Mostrar el archivo de manifiesto `appsscript.json` en el editor**.

Reemplaza su contenido por `apps-script/appsscript-admin-busquedas.json`.

Ese manifiesto usa solo estos permisos:

- lectura de Google Analytics;
- solicitudes externas desde Apps Script.

### 4. Habilitar las API de Google

En el proyecto de Google Cloud asociado al Apps Script habilita:

- **Google Analytics Data API**
- **Google Analytics Admin API**

### 5. Preparar el panel

En Apps Script selecciona la función:

`prepararPanelAnalytics`

También se conserva `prepararPanelBusquedas` por compatibilidad.

Pulsa **Ejecutar** y autoriza el acceso de solo lectura a Analytics.

El script buscará automáticamente la propiedad cuyo flujo web usa el Measurement ID de LSPedia:

`G-RJX3RP2CBR`

En el registro de ejecución aparecerán:

- `GA4 Property ID`
- `CLAVE PRIVADA`

La clave se genera automáticamente y se guarda en **Script Properties**. No debe copiarse al repositorio ni publicarse.

### 6. Desplegar como Aplicación web

En Apps Script:

**Implementar → Nueva implementación → Aplicación web**

Usa:

- **Ejecutar como:** Yo
- **Quién tiene acceso:** Cualquiera

Después copia la URL terminada en `/exec`.

### 7. Abrir el panel

Abre:

`https://lspedia.site/admin/busquedas.html`

Introduce:

- la URL `/exec` del Apps Script;
- la clave privada generada en el paso 5.

Pulsa **Ver Analytics**.

La URL del Apps Script puede guardarse en el navegador. La clave privada solo se guarda en `sessionStorage`, es decir, durante la sesión de esa pestaña.

## Modos disponibles en el backend

El mismo Apps Script sirve dos modos protegidos por la clave privada:

- `modo=admin_busquedas`: compatibilidad con el panel antiguo de búsquedas sin resultados.
- `modo=admin_analytics`: panel completo de Analytics, Realtime, tráfico, geografía, páginas, eventos, errores y búsquedas.

## Seguridad

- El panel no aparece en el menú público de LSPedia.
- La página lleva `noindex,nofollow,noarchive`.
- Las credenciales de Google Analytics nunca llegan al navegador.
- La clave privada permanece en Script Properties y solo se envía al backend al consultar el panel.
- No pongas la clave dentro de `busquedas.html`, GitHub, Google Sheets ni archivos públicos.

## Notas sobre los datos

- Realtime representa aproximadamente los últimos 30 minutos.
- Los informes normales de GA4 pueden tardar en consolidar eventos recientes.
- Las búsquedas sin resultado empezaron a registrarse desde el `10-09-2026`.
- Si una consulta concreta falla en GA4, el backend intenta devolver el resto del panel y agrega el problema en `avisos`, en vez de dejar todo el Admin inutilizable.
