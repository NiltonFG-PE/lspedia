/* LSPedia — banco compartido para juegos.
   ÚNICAS fuentes permitidas: Vocabulario + AlfabetizacionEjemplos. */
(function () {
  'use strict';

  if (window.LSPediaJuegosBanco) return;

  const URL_VOCABULARIO = 'data/vocabulario.json';
  const URL_ALFABETIZACION = 'data/alfabetizacion.json';
  const CLAVE_RECIENTES = 'lspedia_juegos_recientes_v1';
  const MAX_RECIENTES = 40;
  let cache = null;
  let carga = null;

  function core() { return window.LSPediaCore || {}; }
  function normalizarTexto(v) {
    return core().normalizarTexto ? core().normalizarTexto(v) : String(v || '').toLowerCase().trim();
  }
  function normalizarNivel(v, palabra) {
    if (core().normalizarNivel) return core().normalizarNivel(v, palabra);
    return String(v || '').trim();
  }
  function primeraImagen(valor) {
    return String(valor || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean)[0] || '';
  }
  function barajar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = copia[i]; copia[i] = copia[j]; copia[j] = t;
    }
    return copia;
  }

  async function leerJson(url) {
    const separador = url.includes('?') ? '&' : '?';
    const res = await fetch(url + separador + '_lspedia=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' al leer ' + url);
    return res.json();
  }

  function prepararVocabulario(datos) {
    const lista = Array.isArray(datos) ? datos : (datos && Array.isArray(datos.preguntas) ? datos.preguntas : []);
    return lista
      .filter(function (p) { return p && p.palabra; })
      .map(function (p) {
        return {
          fuente: 'vocabulario',
          palabra: String(p.palabra || '').trim(),
          categoria: String(p.categoria || '').trim(),
          nivel: normalizarNivel(p.nivel, p.palabra),
          imagen: primeraImagen(p.imagen),
          video: String(p.video || '').trim(),
          definicion: String(p.definicion || '').trim()
        };
      });
  }

  function prepararAlfabetizacion(datos) {
    const lista = datos && Array.isArray(datos.ejemplos) ? datos.ejemplos : [];
    return lista
      .filter(function (p) { return p && p.palabra; })
      .map(function (p) {
        return {
          fuente: 'alfabetizacion',
          palabra: String(p.palabra || '').trim(),
          caracter: String(p.caracter || '').trim(),
          nivel: normalizarNivel(p.nivel, p.palabra),
          imagen: primeraImagen(p.imagen),
          orden: Number(p.orden) || 0
        };
      });
  }

  function deduplicar(lista) {
    const salida = [];
    const vistos = new Set();
    lista.forEach(function (item) {
      const clave = normalizarTexto(item.palabra);
      if (!clave || vistos.has(clave)) return;
      vistos.add(clave);
      salida.push(item);
    });
    return salida;
  }

  async function cargar(forzar) {
    if (cache && !forzar) return cache;
    if (carga && !forzar) return carga;
    carga = Promise.all([leerJson(URL_ALFABETIZACION), leerJson(URL_VOCABULARIO)])
      .then(function (partes) {
        // Alfabetización primero: si una palabra está en las dos fuentes,
        // conservamos su imagen pedagógica de AlfabetizacionEjemplos.
        cache = deduplicar(prepararAlfabetizacion(partes[0]).concat(prepararVocabulario(partes[1])));
        return cache;
      })
      .finally(function () { carga = null; });
    return carga;
  }

  function leerRecientes() {
    try {
      const arr = JSON.parse(localStorage.getItem(CLAVE_RECIENTES) || '[]');
      return Array.isArray(arr) ? arr.slice(0, MAX_RECIENTES) : [];
    } catch (_e) { return []; }
  }

  function registrarRecientes(items) {
    try {
      const actuales = leerRecientes();
      const nuevos = items.map(function (x) { return normalizarTexto(x.palabra); }).filter(Boolean);
      const unidos = nuevos.concat(actuales.filter(function (x) { return nuevos.indexOf(x) === -1; })).slice(0, MAX_RECIENTES);
      localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(unidos));
    } catch (_e) {}
  }

  async function obtener(opciones) {
    const opts = opciones || {};
    const banco = await cargar(false);
    const nivel = normalizarNivel(opts.nivel || '', '');
    const fuentes = Array.isArray(opts.fuentes) && opts.fuentes.length ? new Set(opts.fuentes) : null;
    const recientes = opts.excluirRecientes === false ? new Set() : new Set(leerRecientes());

    let candidatos = banco.filter(function (item) {
      if (fuentes && !fuentes.has(item.fuente)) return false;
      if (opts.conImagen && !item.imagen) return false;
      if (opts.conVideo && !item.video) return false;
      if (nivel && nivel !== 'Todos' && item.nivel !== nivel) return false;
      if (recientes.has(normalizarTexto(item.palabra))) return false;
      return true;
    });

    // Si excluir recientes dejó muy poco banco, permitimos reutilizar sin duplicar.
    if (opts.cantidad && candidatos.length < opts.cantidad) {
      candidatos = banco.filter(function (item) {
        if (fuentes && !fuentes.has(item.fuente)) return false;
        if (opts.conImagen && !item.imagen) return false;
        if (opts.conVideo && !item.video) return false;
        if (nivel && nivel !== 'Todos' && item.nivel !== nivel) return false;
        return true;
      });
    }

    candidatos = barajar(deduplicar(candidatos));
    if (opts.cantidad) candidatos = candidatos.slice(0, Math.max(1, Number(opts.cantidad) || 1));
    registrarRecientes(candidatos);
    return candidatos;
  }

  async function estadisticas() {
    const banco = await cargar(false);
    const porNivel = { 'Fácil': 0, 'Medio': 0, 'Difícil': 0 };
    const porFuente = { vocabulario: 0, alfabetizacion: 0 };
    banco.forEach(function (x) {
      if (porNivel[x.nivel] != null) porNivel[x.nivel] += 1;
      if (porFuente[x.fuente] != null) porFuente[x.fuente] += 1;
    });
    return { total: banco.length, porNivel: porNivel, porFuente: porFuente };
  }

  // Aventura ya guarda "nivel" por misión. Le agregamos un filtro visible
  // sin modificar su lógica interna ni su progreso.
  function mejorarNivelesAventura() {
    const panel = document.getElementById('aventuraPanelCard');
    if (!panel || panel.dataset.nivelesLspedia === '1') return;
    const misiones = panel.querySelectorAll('.aventura-mision');
    if (!misiones.length) return;
    panel.dataset.nivelesLspedia = '1';

    const filtro = document.createElement('div');
    filtro.className = 'aventura-filtro-nivel';
    filtro.setAttribute('aria-label', 'Filtrar misiones por nivel');
    ['Todos', 'Fácil', 'Medio', 'Difícil'].forEach(function (nivel) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'aventura-filtro-nivel-btn' + (nivel === 'Todos' ? ' activo' : '');
      b.textContent = nivel;
      b.addEventListener('click', function () {
        filtro.querySelectorAll('button').forEach(function (x) { x.classList.remove('activo'); });
        b.classList.add('activo');
        panel.querySelectorAll('.aventura-mision').forEach(function (m) {
          const etiqueta = m.querySelector('.aventura-nivel');
          const actual = normalizarNivel(etiqueta ? etiqueta.textContent : '', '');
          m.classList.toggle('d-none', nivel !== 'Todos' && actual !== nivel);
        });
      });
      filtro.appendChild(b);
    });
    const lista = panel.querySelector('.aventura-misiones') || panel.querySelector('.aventura-mision');
    if (lista && lista.parentNode) lista.parentNode.insertBefore(filtro, lista);
  }

  const observer = new MutationObserver(function () { mejorarNivelesAventura(); });
  function iniciar() {
    cargar(false).catch(function (e) { console.warn('[LSPedia Juegos] banco compartido no disponible:', e); });
    observer.observe(document.body, { childList: true, subtree: true });
    mejorarNivelesAventura();
  }

  window.LSPediaJuegosBanco = Object.freeze({ cargar: cargar, obtener: obtener, estadisticas: estadisticas });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
