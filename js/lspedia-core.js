/* LSPedia Core — identidad oficial, utilidades seguras y defensa contra clones. */
(function () {
  'use strict';

  if (window.LSPediaCore && window.LSPediaCore.version) return;

  const VERSION = '2026.09.14';
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

  function asegurarCanonicalOficial() {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://lspedia.site/' + (location.search || '');
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

    const texto = document.createElement('span');
    texto.textContent = 'Esta es una copia no oficial de LSPedia.';
    const enlace = document.createElement('a');
    enlace.href = 'https://lspedia.site/';
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
    asegurarCanonicalOficial();
    vigilarUrlsPeligrosas();
    if (!esOficial && !esDesarrollo) {
      bloquearInstalacionClon();
      mostrarAvisoNoOficial();
    }
  }

  const api = Object.freeze({
    version: VERSION,
    esOficial: esOficial,
    esDesarrollo: esDesarrollo,
    escaparHtml: escaparHtml,
    textoPlano: textoPlano,
    normalizarTexto: normalizarTexto,
    normalizarNivel: normalizarNivel,
    urlHttpSegura: urlHttpSegura,
    urlInternaSegura: urlInternaSegura,
    deduplicarPorPalabra: deduplicarPorPalabra,
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
