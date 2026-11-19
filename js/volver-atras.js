/* Flecha «atrás» de las páginas sueltas (juegos, Chat en español, libros).
 *
 * Esas páginas son archivos HTML propios, no pantallas del SPA. Antes la
 * flecha era un enlace normal a "../?vista=herramientas…": abría LSPedia de
 * nuevo (recarga completa con pantalla de carga) y además dejaba una entrada
 * de más en el historial, así que el botón Atrás del navegador volvía a la
 * página de la que acababas de salir.
 *
 * Ahora, si la página anterior es de LSPedia, "volver" es retroceder UN paso
 * del historial (history.back()). El navegador conserva la pantalla anterior
 * tal como estaba y, cuando puede, la restaura sin recargar. Si la persona
 * llegó directo (enlace, favorito, otra pestaña) se navega al destino.
 *
 * Uso:
 *   <a href="../?vista=herramientas" data-volver>…</a>     (enlace con respaldo)
 *   LSPediaVolver('../?vista=herramientas-jugar')           (desde JS)
 *   LSPediaVolver(destino, { pasosPropios: 1 })             (si la página añadió
 *                                                            entradas de historial)
 */
(function () {
  'use strict';

  function vieneDeLSPedia() {
    try {
      return !!document.referrer &&
        new URL(document.referrer).origin === location.origin &&
        history.length > 1;
    } catch (_e) {
      return false;
    }
  }

  function volver(destino, opciones) {
    var propios = Math.max(0, Number(opciones && opciones.pasosPropios) || 0);
    if (vieneDeLSPedia() && history.length > propios + 1) {
      history.go(-(propios + 1));
      return;
    }
    if (destino) location.href = destino;
    else history.back();
  }

  window.LSPediaVolver = volver;
  window.LSPediaVieneDeLSPedia = vieneDeLSPedia;

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var enlace = e.target && e.target.closest ? e.target.closest('a[data-volver]') : null;
    if (!enlace) return;
    var propios = Number(enlace.getAttribute('data-volver-propios')) || 0;
    if (!vieneDeLSPedia() || history.length <= propios + 1) return; // deja actuar al href
    e.preventDefault();
    history.go(-(propios + 1));
  });
})();
