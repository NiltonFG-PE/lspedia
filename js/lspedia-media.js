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

  /* Memoria de proporciones.
     Muchos videos de señas son verticales y la caja nacía siempre en 16/9: cuando
     YouTube respondía con el tamaño real, la caja pasaba de ~190 px a ~590 px de
     alto con la ficha ya a la vista, y se notaba como un salto. Recordando la
     proporción real de cada video (y la última que se vio, que casi siempre es la
     misma) la caja nace ya con su tamaño final y casi nunca hay que moverla. */
  const ASPECTO_BASE = '16 / 9';
  const CLAVE_ULTIMO_ASPECTO = 'lspedia:ultimoAspectoVideo';
  const FORMATO_ASPECTO = /^(\d{1,5}) \/ (\d{1,5})$/;
  const aspectosConocidos = new Map();
  let ultimoAspecto = null;

  // Devuelve "ancho / alto" si el valor es una proporción razonable; si no, ''.
  function aspectoValido(valor) {
    const partes = FORMATO_ASPECTO.exec(texto(valor));
    if (!partes) return '';
    const ancho = Number(partes[1]);
    const alto = Number(partes[2]);
    if (!(ancho > 0) || !(alto > 0)) return '';
    const razon = ancho / alto;
    return razon >= 0.3 && razon <= 3.5 ? ancho + ' / ' + alto : '';
  }

  function leerUltimoAspecto() {
    if (ultimoAspecto === null) {
      try {
        ultimoAspecto = aspectoValido(window.localStorage.getItem(CLAVE_ULTIMO_ASPECTO));
      } catch (_e) {
        ultimoAspecto = '';
      }
    }
    return ultimoAspecto;
  }

  // Último video pedido para cada caja. Si el usuario abre otra ficha antes de que
  // llegue la respuesta de la anterior, esa respuesta tardía no debe tocar la caja
  // del video nuevo (ni cambiarle la proporción ni devolverla a 16/9).
  const ultimoPedido = new Map();

  // comoUltimo: la proporción se guarda también como "la última vista" (la que usarán
  // los videos que aún no se conocen). Una respuesta tardía solo enseña la de su video.
  function recordarAspecto(id, aspecto, comoUltimo) {
    const valido = aspectoValido(aspecto);
    if (!valido) return;
    if (id) aspectosConocidos.set(id, valido);
    if (!comoUltimo) return;
    ultimoAspecto = valido;
    try {
      window.localStorage.setItem(CLAVE_ULTIMO_ASPECTO, valido);
    } catch (_e) { /* almacenamiento bloqueado o lleno: se sigue sin recordar */ }
  }

  async function ajustarAspecto(wrapId, videoId) {
    const wrap = typeof wrapId === 'string' ? document.getElementById(wrapId) : wrapId;
    if (!wrap) return false;

    const id = idYouTubeSeguro(videoId);
    const clave = typeof wrapId === 'string' ? wrapId : wrap;
    ultimoPedido.set(clave, id);

    const propio = id ? (aspectosConocidos.get(id) || '') : '';
    const inicial = propio || leerUltimoAspecto() || ASPECTO_BASE;
    wrap.style.aspectRatio = inicial;

    const data = await leerOEmbed(videoId);
    const ancho = Number(data && data.width);
    const alto = Number(data && data.height);
    const real = Number.isFinite(ancho) && Number.isFinite(alto) && ancho > 0 && alto > 0
      ? ancho + ' / ' + alto
      : '';

    // ¿Sigue siendo este el video de la caja? Si ya se pidió otro, la medida se
    // aprende para la próxima vez, pero la caja no se toca.
    const vigente = ultimoPedido.get(clave) === id;
    if (real) recordarAspecto(id, real, vigente);
    if (!vigente) return false;

    // El contenedor puede haber sido reemplazado mientras llegaba la respuesta.
    const actual = typeof wrapId === 'string' ? document.getElementById(wrapId) : wrap;
    if (!actual) return false;

    if (!real) {
      // Sin respuesta de YouTube: si la proporción de salida era solo una suposición
      // (la de otro video), se vuelve a la base; si era la medida real de este video, se queda.
      if (!propio && inicial !== ASPECTO_BASE) actual.style.aspectRatio = ASPECTO_BASE;
      return false;
    }

    actual.style.aspectRatio = real;
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
