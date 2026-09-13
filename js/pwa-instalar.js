/* LSPedia — instalación PWA visible y contextual. */
(function () {
  'use strict';

  let eventoInstalacion = null;
  let boton = null;
  let ayuda = null;

  function esStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function esOficial() {
    return !window.LSPediaCore || window.LSPediaCore.esOficial;
  }

  function esIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  }

  function ocultar() {
    if (boton) boton.hidden = true;
    if (ayuda) ayuda.hidden = true;
  }

  function crearUI() {
    if (boton || !esOficial() || esStandalone()) return;
    boton = document.createElement('button');
    boton.id = 'btnInstalarLSPedia';
    boton.type = 'button';
    boton.className = 'lspedia-instalar-btn';
    const icono = document.createElement('span');
    icono.setAttribute('aria-hidden', 'true');
    icono.textContent = '⬇';
    const etiqueta = document.createElement('span');
    etiqueta.textContent = 'Instalar LSPedia';
    boton.append(icono, etiqueta);
    boton.hidden = true;
    boton.setAttribute('aria-haspopup', 'dialog');

    ayuda = document.createElement('div');
    ayuda.id = 'ayudaInstalarLSPedia';
    ayuda.className = 'lspedia-instalar-ayuda';
    ayuda.hidden = true;
    ayuda.setAttribute('role', 'dialog');
    ayuda.setAttribute('aria-modal', 'false');
    ayuda.setAttribute('aria-label', 'Cómo instalar LSPedia');

    const texto = document.createElement('p');
    texto.textContent = esIOS()
      ? 'En Safari toca Compartir y luego “Añadir a pantalla de inicio”.'
      : 'En el menú del navegador busca “Instalar aplicación” o “Añadir a pantalla de inicio”.';
    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.textContent = 'Cerrar';
    cerrar.addEventListener('click', function () { ayuda.hidden = true; });
    ayuda.append(texto, cerrar);

    boton.addEventListener('click', async function () {
      if (eventoInstalacion) {
        boton.disabled = true;
        try {
          await eventoInstalacion.prompt();
          const eleccion = await eventoInstalacion.userChoice;
          if (eleccion && eleccion.outcome === 'accepted') ocultar();
        } catch (_e) {
          ayuda.hidden = false;
        } finally {
          eventoInstalacion = null;
          boton.disabled = false;
        }
      } else {
        ayuda.hidden = !ayuda.hidden;
      }
    });

    document.body.append(ayuda, boton);
    if (esIOS()) boton.hidden = false;
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    if (!esOficial() || esStandalone()) return;
    e.preventDefault();
    eventoInstalacion = e;
    crearUI();
    if (boton) boton.hidden = false;
  });

  window.addEventListener('appinstalled', function () {
    eventoInstalacion = null;
    ocultar();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', crearUI, { once: true });
  else crearUI();
})();
