/* LSPedia Media — utilidades multimedia extraídas del script principal.
   Primera fase de modularización: centraliza consultas de metadatos de video
   y evita que script.js tenga que conocer los detalles de red de YouTube. */
(function () {
  'use strict';

  if (window.LSPediaMedia && window.LSPediaMedia.version) return;

  const VERSION = '2026.09.17.1';
  const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

  function texto(valor) {
    return String(valor == null ? '' : valor).trim();
  }

  function idYouTubeSeguro(valor) {
    const id = texto(valor);
    return ID_YOUTUBE.test(id) ? id : '';
  }

  async function leerOEmbed(videoId) {
    const id = idYouTubeSeguro(videoId);
    if (!id) return null;
    const url = 'https://www.youtube.com/oembed?url=' +
      encodeURIComponent('https://www.youtube.com/watch?v=' + id) +
      '&format=json';

    const core = window.LSPediaCore;
    try {
      if (core && typeof core.fetchConTimeout === 'function') {
        const respuesta = await core.fetchConTimeout(url, {
          timeoutMs: 4500,
          reintentos: 1,
          esperaReintentoMs: 300,
          fetch: { cache: 'force-cache', mode: 'cors' }
        });
        return await respuesta.json();
      }

      const controlador = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const temporizador = controlador ? setTimeout(function () { controlador.abort(); }, 4500) : null;
      try {
        const respuesta = await fetch(url, controlador ? { signal: controlador.signal, cache: 'force-cache', mode: 'cors' } : { cache: 'force-cache', mode: 'cors' });
        if (!respuesta.ok) return null;
        return await respuesta.json();
      } finally {
        if (temporizador) clearTimeout(temporizador);
      }
    } catch (_e) {
      return null;
    }
  }

  async function ajustarAspecto(wrapId, videoId) {
    const wrap = typeof wrapId === 'string' ? document.getElementById(wrapId) : wrapId;
    if (!wrap) return false;
    wrap.style.aspectRatio = '16 / 9';

    const data = await leerOEmbed(videoId);
    const ancho = Number(data && data.width);
    const alto = Number(data && data.height);
    if (!Number.isFinite(ancho) || !Number.isFinite(alto) || ancho <= 0 || alto <= 0) return false;

    // El contenedor puede haber sido reemplazado mientras llegaba la respuesta.
    const actual = typeof wrapId === 'string' ? document.getElementById(wrapId) : wrap;
    if (!actual) return false;
    actual.style.aspectRatio = ancho + ' / ' + alto;
    return true;
  }

  const api = Object.freeze({
    version: VERSION,
    idYouTubeSeguro: idYouTubeSeguro,
    leerOEmbed: leerOEmbed,
    ajustarAspecto: ajustarAspecto
  });

  Object.defineProperty(window, 'LSPediaMedia', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: api
  });
})();
