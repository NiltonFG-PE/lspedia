/* LSPedia Core — identidad oficial, utilidades seguras y defensa contra clones. */
(function () {
  'use strict';

  if (window.LSPediaCore && window.LSPediaCore.version) return;

  const VERSION = '2026.09.14-3';
  const URL_OFICIAL = 'https://lspedia.site/';
  const HOSTS_OFICIALES = new Set(['lspedia.site', 'www.lspedia.site']);
  const HOSTS_DESARROLLO = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  const host = String(location.hostname || '').toLowerCase();
  const esOficial = HOSTS_OFICIALES.has(host);
  const esDesarrollo = location.protocol === 'file:' || HOSTS_DESARROLLO.has(host);

  function escaparHtml(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function textoPlano(valor) {
    return String(valor == null ? '' : valor).replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  }

  function normalizarTexto(valor) {
    return String(valor == null ? '' : valor)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizarNivel(valor, palabra) {
    const n = normalizarTexto(valor);
    if (n === 'facil') return 'Fácil';
    if (n === 'medio') return 'Medio';
    if (n === 'dificil') return 'Difícil';

    const largo = String(palabra || '').trim().replace(/\s+/g, '').length;
    if (!largo) return '';
    if (largo <= 5) return 'Fácil';
    if (largo <= 8) return 'Medio';
    return 'Difícil';
  }

  function urlHttpSegura(valor, base) {
    const crudo = String(valor || '').trim();
    if (!crudo) return '';
    try {
      const url = new URL(crudo, base || location.href);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.href;
    } catch (_e) {
      return '';
    }
  }

  function urlInternaSegura(valor) {
    const segura = urlHttpSegura(valor, location.origin + '/');
    if (!segura) return '';
    try {
      const url = new URL(segura);
      if (url.origin !== location.origin) return '';
      return url.href;
    } catch (_e) {
      return '';
    }
  }

  function deduplicarPorPalabra(lista) {
    const vistos = new Set();
    return (Array.isArray(lista) ? lista : []).filter(function (item) {
      const clave = normalizarTexto(item && item.palabra);
      if (!clave || vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
  }

  function esperar(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, Math.max(0, Number(ms) || 0)); });
  }

  function errorHttp(respuesta, url) {
    const error = new Error('HTTP ' + respuesta.status + ' al leer ' + url);
    error.name = 'LSPediaHttpError';
    error.status = respuesta.status;
    error.url = String(url || '');
    return error;
  }

  function esErrorReintentable(error) {
    if (!error) return true;
    if (error.name === 'LSPediaHttpError') {
      return error.status === 408 || error.status === 425 || error.status === 429 || error.status >= 500;
    }
    return true;
  }

  async function fetchConTimeout(url, opciones) {
    const cfg = opciones || {};
    const timeoutMs = Math.max(1000, Number(cfg.timeoutMs) || 7000);
    const reintentos = Math.max(0, Math.min(2, Number(cfg.reintentos) || 0));
    const esperaReintentoMs = Math.max(0, Number(cfg.esperaReintentoMs) || 350);
    const fetchOpciones = Object.assign({}, cfg.fetch || {});
    let ultimoError = null;

    for (let intento = 0; intento <= reintentos; intento += 1) {
      let temporizador = null;
      let controlador = null;
      try {
        controlador = typeof AbortController !== 'undefined' ? new AbortController() : null;
        if (controlador && !fetchOpciones.signal) fetchOpciones.signal = controlador.signal;

        const promesaFetch = fetch(url, fetchOpciones);
        const promesaTimeout = new Promise(function (_resolve, reject) {
          temporizador = setTimeout(function () {
            if (controlador) {
              try { controlador.abort(); } catch (_e) {}
            }
            const error = new Error('Tiempo de espera agotado al leer ' + url);
            error.name = 'LSPediaTimeoutError';
            error.url = String(url || '');
            reject(error);
          }, timeoutMs);
        });

        const respuesta = await Promise.race([promesaFetch, promesaTimeout]);
        if (!respuesta || !respuesta.ok) throw errorHttp(respuesta || { status: 0 }, url);
        if (temporizador) clearTimeout(temporizador);
        return respuesta;
      } catch (error) {
        if (temporizador) clearTimeout(temporizador);
        ultimoError = error;
        if (intento >= reintentos || !esErrorReintentable(error)) throw error;
        await esperar(esperaReintentoMs * (intento + 1));
      } finally {
        if (fetchOpciones.signal && controlador && fetchOpciones.signal === controlador.signal) {
          delete fetchOpciones.signal;
        }
      }
    }

    throw ultimoError || new Error('No se pudo completar la solicitud de red.');
  }

  async function leerJsonSeguro(url, opciones) {
    const respuesta = await fetchConTimeout(url, opciones);
    try {
      return await respuesta.json();
    } catch (error) {
      const invalido = new Error('JSON inválido al leer ' + url);
      invalido.name = 'LSPediaJsonError';
      invalido.url = String(url || '');
      invalido.cause = error;
      throw invalido;
    }
  }

  function asegurarCanonicalOficial() {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = URL_OFICIAL + (location.search || '');
  }

  function asegurarMetaRobotsNoIndex() {
    ['robots', 'googlebot'].forEach(function (nombre) {
      let meta = document.querySelector('meta[name="' + nombre + '"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = nombre;
        document.head.appendChild(meta);
      }
      meta.content = 'noindex,nofollow,noarchive';
    });
  }

  function reforzarMetadatosOficiales() {
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', URL_OFICIAL + (location.search || ''));
    const sitio = document.querySelector('meta[property="og:site_name"]');
    if (sitio) sitio.setAttribute('content', 'LSPedia');
  }

  function bloquearInstalacionClon() {
    document.querySelectorAll('link[rel="manifest"]').forEach(function (nodo) { nodo.remove(); });
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(function (regs) { regs.forEach(function (r) { r.unregister(); }); })
        .catch(function () {});
    }
  }

  function mostrarAvisoNoOficial() {
    if (document.getElementById('lspediaAvisoNoOficial')) return;
    const aviso = document.createElement('aside');
    aviso.id = 'lspediaAvisoNoOficial';
    aviso.className = 'lspedia-aviso-no-oficial';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');

    const texto = document.createElement('span');
    texto.textContent = 'Esta es una copia no oficial de LSPedia.';
    const enlace = document.createElement('a');
    enlace.href = URL_OFICIAL;
    enlace.rel = 'noopener noreferrer';
    enlace.textContent = 'Abrir sitio oficial';
    aviso.append(texto, enlace);
    document.body.prepend(aviso);
  }

  function atributoUrlPeligroso(valor) {
    const v = String(valor || '').trim();
    return /^(?:javascript|vbscript)\s*:/i.test(v) ||
      /^data\s*:\s*text\/html/i.test(v) ||
      /^data\s*:\s*image\/svg\+xml/i.test(v);
  }

  function reforzarEnlaceExterno(el) {
    if (!el || el.tagName !== 'A' || el.getAttribute('target') !== '_blank') return;
    try {
      const url = new URL(el.getAttribute('href') || '', location.href);
      if (url.origin === location.origin) return;
      const rel = new Set(String(el.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      el.setAttribute('rel', Array.from(rel).join(' '));
    } catch (_e) {}
  }

  function vigilarUrlsPeligrosas() {
    function limpiarNodo(nodo) {
      if (!(nodo instanceof Element)) return;
      const revisar = [nodo].concat(Array.from(nodo.querySelectorAll('[href],[src],[action],[formaction]')));
      revisar.forEach(function (el) {
        ['href', 'src', 'action', 'formaction'].forEach(function (attr) {
          if (!el.hasAttribute(attr)) return;
          const valor = el.getAttribute(attr) || '';
          if (atributoUrlPeligroso(valor)) {
            el.removeAttribute(attr);
            console.warn('[LSPedia] URL potencialmente insegura eliminada:', attr);
          }
        });
        reforzarEnlaceExterno(el);
      });
    }

    limpiarNodo(document.documentElement);
    if (!('MutationObserver' in window)) return;
    const obs = new MutationObserver(function (cambios) {
      cambios.forEach(function (cambio) {
        cambio.addedNodes.forEach(limpiarNodo);
        if (cambio.type === 'attributes') limpiarNodo(cambio.target);
      });
    });
    obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'src', 'action', 'formaction', 'target', 'rel']
    });
  }

  function activarIdentidad() {
    document.documentElement.dataset.lspediaOficial = esOficial ? '1' : '0';
    document.documentElement.dataset.lspediaOrigen = esOficial ? 'oficial' : (esDesarrollo ? 'desarrollo' : 'copia');
    asegurarCanonicalOficial();
    reforzarMetadatosOficiales();
    vigilarUrlsPeligrosas();
    if (!esOficial && !esDesarrollo) {
      asegurarMetaRobotsNoIndex();
      bloquearInstalacionClon();
      mostrarAvisoNoOficial();
    }
  }

  const api = Object.freeze({
    version: VERSION,
    urlOficial: URL_OFICIAL,
    esOficial: esOficial,
    esDesarrollo: esDesarrollo,
    escaparHtml: escaparHtml,
    textoPlano: textoPlano,
    normalizarTexto: normalizarTexto,
    normalizarNivel: normalizarNivel,
    urlHttpSegura: urlHttpSegura,
    urlInternaSegura: urlInternaSegura,
    deduplicarPorPalabra: deduplicarPorPalabra,
    fetchConTimeout: fetchConTimeout,
    leerJsonSeguro: leerJsonSeguro,
    atributoUrlPeligroso: atributoUrlPeligroso
  });

  Object.defineProperty(window, 'LSPediaCore', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: api
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activarIdentidad, { once: true });
  } else {
    activarIdentidad();
  }
})();
