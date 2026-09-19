/* LSPedia — refinamiento del índice A-Z compacto en móvil. */
(function () {
  'use strict';

  const CONFIGS = [
    { indice: 'indiceAlfabetico', boton: 'btnToggleAbc' },
    { indice: 'indiceAlfabeticoVocabulario', boton: 'btnToggleAbcVocabulario' }
  ];

  function esMovil() { return window.matchMedia('(max-width: 767.98px)').matches; }

  function cerrar(indice, boton) {
    if (!indice) return;
    try {
      if (window.bootstrap && window.bootstrap.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(indice, { toggle: false }).hide();
      } else {
        indice.classList.remove('show');
      }
    } catch (_e) { indice.classList.remove('show'); }
    if (boton) {
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-label', 'Abrir índice alfabético A a Z');
    }
  }

  function preparar(cfg) {
    const indice = document.getElementById(cfg.indice);
    const boton = document.getElementById(cfg.boton);
    if (!indice || !boton || indice.dataset.lspediaAzMovil === '1') return;
    indice.dataset.lspediaAzMovil = '1';

    indice.querySelectorAll('.btn-abc').forEach(function (letra) {
      letra.setAttribute('aria-pressed', 'false');
      letra.addEventListener('click', function () {
        indice.querySelectorAll('.btn-abc').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        letra.setAttribute('aria-pressed', 'true');
        if (esMovil()) setTimeout(function () { cerrar(indice, boton); }, 180);
      });
    });

    boton.addEventListener('click', function () {
      setTimeout(function () {
        const abierto = indice.classList.contains('show');
        boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
        boton.setAttribute('aria-label', abierto ? 'Cerrar índice alfabético A a Z' : 'Abrir índice alfabético A a Z');
      }, 30);
    });
  }

  function iniciar() {
    CONFIGS.forEach(preparar);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      CONFIGS.forEach(function (cfg) {
        cerrar(document.getElementById(cfg.indice), document.getElementById(cfg.boton));
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();

/* Carga la capa de taxonomía desde un módulo independiente para que el
   índice A-Z y el resto del sitio sigan desacoplados y fáciles de revertir. */
(function cargarTaxonomiaInteligente(){
  'use strict';
  if(!document.querySelector('link[data-lsp-taxonomia]')){
    const css=document.createElement('link');
    css.rel='stylesheet';
    css.href='css/taxonomia-inteligente.css?v=20260919-3';
    css.dataset.lspTaxonomia='1';
    document.head.appendChild(css);
  }
  if(!document.querySelector('script[data-lsp-taxonomia]')){
    const js=document.createElement('script');
    js.src='js/taxonomia-inteligente.js?v=20260919-3';
    js.async=false;
    js.dataset.lspTaxonomia='1';
    document.head.appendChild(js);
  }
})();
