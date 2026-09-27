/* LSPedia — corrección aislada del botón/indicador “Ampliar” en Alfabetización.
   No modifica la lógica de aprendizaje, reproducción, velocidad ni navegación. */
(function () {
  'use strict';

  if (window.__LSPediaAlfabetizacionAmpliarFix) return;
  window.__LSPediaAlfabetizacionAmpliarFix = true;

  const SELECTORES = '#alfabBocaCaja, #alfabTrazoCaja, #alfabEjemploImagenCaja';
  let modal = null;
  let mediaModal = null;
  let overflowAnterior = '';

  function asegurarEstilos() {
    if (document.getElementById('lsp-alfab-ampliar-css')) return;
    const style = document.createElement('style');
    style.id = 'lsp-alfab-ampliar-css';
    style.textContent = `
      #alfabBocaCaja,
      #alfabTrazoCaja,
      #alfabEjemploImagenCaja { cursor: zoom-in; }
      #alfabBocaCaja .apoyo-visual-lupa,
      #alfabTrazoCaja .apoyo-visual-lupa,
      #alfabEjemploImagenCaja .apoyo-visual-lupa { pointer-events: none; }
      .lsp-alfab-media-modal {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(5, 12, 28, .94);
        backdrop-filter: blur(8px);
      }
      .lsp-alfab-media-modal[hidden] { display: none !important; }
      .lsp-alfab-media-dialog {
        position: relative;
        width: min(1100px, 96vw);
        height: min(820px, 92vh);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 24px;
        background: #0f172a;
        box-shadow: 0 28px 80px rgba(0,0,0,.45);
        overflow: hidden;
      }
      .lsp-alfab-media-dialog img,
      .lsp-alfab-media-dialog video {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
      }
      .lsp-alfab-media-cerrar {
        position: absolute;
        top: 14px;
        right: 14px;
        z-index: 2;
        width: 46px;
        height: 46px;
        border: 1px solid rgba(255,255,255,.22);
        border-radius: 999px;
        background: rgba(15,23,42,.82);
        color: #fff;
        font-size: 24px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,.25);
      }
      .lsp-alfab-media-cerrar:hover,
      .lsp-alfab-media-cerrar:focus-visible { background: #1e293b; outline: 3px solid #ffc107; }
      @media (max-width: 700px) {
        .lsp-alfab-media-modal { padding: 8px; }
        .lsp-alfab-media-dialog { width: 100%; height: 94dvh; border-radius: 18px; }
        .lsp-alfab-media-cerrar { top: 10px; right: 10px; }
      }
    `;
    document.head.appendChild(style);
  }

  function crearModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'lsp-alfab-media-modal';
    modal.id = 'lspAlfabMediaModal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Recurso ampliado de Alfabetización');

    const dialog = document.createElement('div');
    dialog.className = 'lsp-alfab-media-dialog';

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'lsp-alfab-media-cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar ampliación');
    cerrar.textContent = '×';
    cerrar.addEventListener('click', cerrarModal);

    dialog.appendChild(cerrar);
    modal.appendChild(dialog);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) cerrarModal();
    });
    document.body.appendChild(modal);
    return modal;
  }

  function cerrarModal() {
    if (!modal || modal.hidden) return;
    if (mediaModal && mediaModal.tagName === 'VIDEO') {
      try { mediaModal.pause(); } catch (_e) {}
    }
    if (mediaModal && mediaModal.parentNode) mediaModal.parentNode.removeChild(mediaModal);
    mediaModal = null;
    modal.hidden = true;
    document.body.style.overflow = overflowAnterior;
  }

  function abrirEnModal(media, etiqueta) {
    if (!media) return;
    asegurarEstilos();
    const contenedor = crearModal();
    const dialog = contenedor.querySelector('.lsp-alfab-media-dialog');
    if (!dialog) return;

    if (mediaModal && mediaModal.parentNode) mediaModal.parentNode.removeChild(mediaModal);

    const src = media.currentSrc || media.getAttribute('src') || media.src || '';
    if (!src) return;

    if (media.tagName === 'VIDEO') {
      mediaModal = document.createElement('video');
      mediaModal.src = src;
      mediaModal.controls = true;
      mediaModal.autoplay = true;
      mediaModal.loop = !!media.loop;
      mediaModal.muted = !!media.muted;
      mediaModal.playsInline = true;
      mediaModal.setAttribute('playsinline', '');
      try { mediaModal.playbackRate = media.playbackRate || 1; } catch (_e) {}
      mediaModal.addEventListener('loadedmetadata', function () {
        try {
          if (Number.isFinite(media.currentTime) && media.currentTime > 0) mediaModal.currentTime = media.currentTime;
        } catch (_e) {}
        const promesa = mediaModal.play();
        if (promesa && promesa.catch) promesa.catch(function () {});
      }, { once: true });
    } else {
      mediaModal = document.createElement('img');
      mediaModal.src = src;
      mediaModal.alt = media.alt || etiqueta || 'Recurso ampliado';
    }

    dialog.insertBefore(mediaModal, dialog.firstChild);
    overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    contenedor.hidden = false;
    const cerrar = contenedor.querySelector('.lsp-alfab-media-cerrar');
    if (cerrar) cerrar.focus({ preventScroll: true });
  }

  function etiquetaCaja(caja) {
    if (!caja) return 'Alfabetización';
    const celda = caja.closest('.alfab-grid-celda');
    const titulo = celda && celda.querySelector('.alfab-etiqueta-panel');
    return titulo ? String(titulo.textContent || '').trim() : 'Alfabetización';
  }

  function ampliarCaja(caja) {
    if (!caja) return;
    const media = caja.querySelector('video, img');
    if (!media) return;
    const src = media.currentSrc || media.getAttribute('src') || media.src || '';
    if (!src) return;

    // Para imágenes reutilizamos el visor con zoom ya existente del Diccionario.
    if (media.tagName === 'IMG' && typeof window.abrirImagenAmpliada === 'function') {
      try {
        window.abrirImagenAmpliada(src, etiquetaCaja(caja));
        return;
      } catch (_e) {
        // Si el visor principal no está disponible, usamos el modal de respaldo.
      }
    }
    abrirEnModal(media, etiquetaCaja(caja));
  }

  function prepararCajas() {
    document.querySelectorAll(SELECTORES).forEach(function (caja) {
      if (!caja.hasAttribute('role')) caja.setAttribute('role', 'button');
      if (!caja.hasAttribute('tabindex')) caja.setAttribute('tabindex', '0');
      if (!caja.hasAttribute('aria-label')) caja.setAttribute('aria-label', 'Ampliar recurso visual');
    });
  }

  function esClickDeControlInteractivo(target, caja) {
    if (!target || !caja) return false;
    const interactivo = target.closest('button, a, input, select, textarea');
    return !!(interactivo && caja.contains(interactivo));
  }

  document.addEventListener('click', function (event) {
    const caja = event.target && event.target.closest ? event.target.closest(SELECTORES) : null;
    if (!caja || !document.getElementById('seccionAlfabetizacion')?.contains(caja)) return;
    if (esClickDeControlInteractivo(event.target, caja)) return;
    event.preventDefault();
    ampliarCaja(caja);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      cerrarModal();
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const caja = event.target && event.target.matches && event.target.matches(SELECTORES) ? event.target : null;
    if (!caja) return;
    event.preventDefault();
    ampliarCaja(caja);
  });

  asegurarEstilos();
  prepararCajas();
  window.addEventListener('load', prepararCajas, { once: true });
})();
