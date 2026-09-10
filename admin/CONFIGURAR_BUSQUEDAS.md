# Panel privado de búsquedas sin resultados

La vista está en `admin/busquedas.html` y consulta el evento GA4 `search_no_results` que ya envía LSPedia.

## Configuración una sola vez

1. Crea un proyecto independiente en **Google Apps Script**.
2. Copia `apps-script/admin_busquedas_ga4.gs` dentro de `Code.gs`.
3. En **Configuración del proyecto**, activa la visualización del archivo de manifiesto `appsscript.json` y reemplázalo por el contenido de `apps-script/appsscript-admin-busquedas.json`.
4. En el proyecto de Google Cloud asociado al Apps Script, habilita **Google Analytics Data API** y **Google Analytics Admin API**.
5. En Apps Script selecciona la función **`prepararPanelBusquedas`** y pulsa **Ejecutar**. Autoriza el acceso de solo lectura a Analytics. El script localizará automáticamente la propiedad cuyo flujo web usa `G-RJX3RP2CBR`.
6. Abre el registro de ejecución y copia la línea **CLAVE PRIVADA**. La clave se genera automáticamente y se guarda en Script Properties; no debe copiarse al repositorio.
7. En Apps Script selecciona **Implementar > Nueva implementación > Aplicación web**:
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquiera**.
8. Copia la URL terminada en `/exec`.
9. Abre `https://lspedia.site/admin/busquedas.html`, pega esa URL y escribe la clave privada del paso 6.

## Seguridad

La página administrativa no aparece en el menú y lleva `noindex,nofollow`. Los datos de Analytics no se publican en GitHub. La URL de Apps Script puede guardarse localmente en el navegador; la clave privada solo se guarda en `sessionStorage`, es decir, durante la sesión de esa pestaña.

La aplicación web de Apps Script debe estar disponible para que la página de LSPedia pueda consultarla mediante JSONP, pero toda respuesta con datos exige la clave privada. No compartas esa clave.

## Qué muestra

- Ranking de palabras por número de búsquedas sin resultado.
- Última fecha en que se buscó cada término.
- Periodos de 7, 30, 90, 365 días o desde que se activó el registro (10-09-2026).
- Filtro automático de **Pendientes** y **Ya agregadas** comparando con `data/palabras.json` y `data/vocabulario.json`.
- Filtro por texto y exportación CSV.

Google Analytics puede tardar varias horas en consolidar eventos recientes; el panel no pretende ser un monitor en tiempo real.
