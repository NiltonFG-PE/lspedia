#!/usr/bin/env python3
from pathlib import Path
import re

index = Path('index.html')
texto = index.read_text(encoding='utf-8')

nuevo_estilo = r'''<style id="footer-microanimaciones">
    .footer-lspedia .footer-logo {
        width: 132px !important;
        max-width: 38vw;
        height: auto;
        object-fit: contain;
        filter: drop-shadow(0 5px 10px rgba(15, 58, 112, 0.08));
    }

    .footer-lspedia .footer-redes {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .footer-lspedia .footer-red-icono {
        position: relative;
        width: 46px !important;
        height: 46px !important;
        flex: 0 0 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #ffffff !important;
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.09);
        overflow: visible;
        transform-origin: center;
        animation: footerRedFlotar 2.8s ease-in-out infinite;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        -webkit-tap-highlight-color: transparent;
    }

    .footer-lspedia .footer-red-icono::before,
    .footer-lspedia .footer-red-icono::after {
        content: "";
        position: absolute;
        border-radius: inherit;
        pointer-events: none;
    }

    .footer-lspedia .footer-red-icono::before {
        inset: -6px;
        border: 2px solid currentColor;
        opacity: 0;
        transform: scale(0.84);
        animation: footerRedAro 2.8s ease-out infinite;
    }

    .footer-lspedia .footer-red-icono::after {
        inset: -11px;
        border: 2px solid currentColor;
        opacity: 0.10;
    }

    .footer-lspedia .footer-red-icono svg {
        width: 22px !important;
        height: 22px !important;
        color: inherit !important;
        filter: none !important;
    }

    .footer-lspedia .footer-red-tiktok { color: #111827 !important; }
    .footer-lspedia .footer-red-tiktok::after { border-color: #22d3ee; }
    .footer-lspedia .footer-red-instagram { color: #d62976 !important; }
    .footer-lspedia .footer-red-instagram::after { border-color: #c13584; }
    .footer-lspedia .footer-red-youtube { color: #ff0000 !important; }
    .footer-lspedia .footer-red-youtube::after { border-color: #ff5a5f; }

    .footer-lspedia .footer-red-icono:nth-child(2),
    .footer-lspedia .footer-red-icono:nth-child(2)::before { animation-delay: 0.36s; }

    .footer-lspedia .footer-red-icono:nth-child(3),
    .footer-lspedia .footer-red-icono:nth-child(3)::before { animation-delay: 0.72s; }

    .footer-lspedia .footer-red-icono:hover,
    .footer-lspedia .footer-red-icono:focus,
    .footer-lspedia .footer-red-icono:focus-visible,
    .footer-lspedia .footer-red-icono:active {
        background: #ffffff !important;
        color: inherit;
        outline: none;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
    }

    .footer-lspedia .footer-red-tiktok:hover,
    .footer-lspedia .footer-red-tiktok:focus,
    .footer-lspedia .footer-red-tiktok:focus-visible,
    .footer-lspedia .footer-red-tiktok:active { color: #111827 !important; }

    .footer-lspedia .footer-red-instagram:hover,
    .footer-lspedia .footer-red-instagram:focus,
    .footer-lspedia .footer-red-instagram:focus-visible,
    .footer-lspedia .footer-red-instagram:active { color: #d62976 !important; }

    .footer-lspedia .footer-red-youtube:hover,
    .footer-lspedia .footer-red-youtube:focus,
    .footer-lspedia .footer-red-youtube:focus-visible,
    .footer-lspedia .footer-red-youtube:active { color: #ff0000 !important; }

    .footer-lspedia .footer-red-icono:active {
        transform: translateY(-1px) scale(0.94);
    }

    .footer-lspedia .footer-bottom {
        position: relative;
        overflow: hidden;
        margin-top: 26px;
        padding: 24px 20px 22px !important;
        border-radius: 26px;
        border: 1px solid #d8e1ec;
        background: linear-gradient(145deg, #f8fafc 0%, #edf3f9 55%, #f6f8fb 100%);
        box-shadow: 0 10px 26px rgba(71, 85, 105, 0.11);
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        animation: footerDerechosRespira 4.8s ease-in-out infinite;
    }

    .footer-lspedia .footer-bottom::before {
        content: "";
        position: absolute;
        width: 180px;
        height: 180px;
        right: -82px;
        bottom: -104px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(96, 165, 250, 0.16) 0%, rgba(96, 165, 250, 0) 72%);
        pointer-events: none;
    }

    .footer-lspedia .footer-bottom::after {
        content: "";
        position: absolute;
        top: -45%;
        bottom: -45%;
        left: -38%;
        width: 23%;
        transform: rotate(16deg);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.88), transparent);
        filter: blur(2px);
        pointer-events: none;
        animation: footerDerechosBrillo 6.2s ease-in-out infinite;
    }

    .footer-lspedia .footer-bottom > * {
        position: relative;
        z-index: 1;
    }

    .footer-lspedia .footer-escudo {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 54px;
        height: 54px;
        margin-bottom: 10px;
        border-radius: 50%;
        color: #0d6efd;
        background: #e7f0ff;
        box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.055);
        animation: footerEscudoPulso 3.4s ease-in-out infinite;
    }

    .footer-lspedia .footer-escudo svg {
        width: 25px;
        height: 25px;
    }

    .footer-derechos-principal {
        margin: 0 auto 12px;
        max-width: 560px;
        color: #24364d;
        font-size: 0.98rem;
        font-weight: 600;
        line-height: 1.55;
        letter-spacing: -0.01em;
    }

    .footer-link-licencia.footer-link-boton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 42px;
        padding: 9px 18px;
        margin-bottom: 12px;
        border-radius: 999px;
        color: #075bc7 !important;
        background: #e7f0ff;
        border: 1px solid #c9dcfb;
        font-weight: 700;
        text-decoration: none;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }

    .footer-link-licencia.footer-link-boton:hover,
    .footer-link-licencia.footer-link-boton:focus-visible,
    .footer-link-licencia.footer-link-boton:active {
        color: #075bc7 !important;
        background: #dceafe;
        transform: translateY(-1px);
        box-shadow: 0 7px 16px rgba(37, 99, 235, 0.13);
        outline: none;
    }

    .footer-tagline {
        margin: 0;
        color: #7d8da5;
        font-size: 0.83rem;
        font-style: italic;
        font-weight: 500;
        letter-spacing: 0.01em;
    }

    @keyframes footerRedFlotar {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-4px) scale(1.035); }
    }

    @keyframes footerRedAro {
        0%, 44% { opacity: 0; transform: scale(0.84); }
        57% { opacity: 0.30; }
        82%, 100% { opacity: 0; transform: scale(1.16); }
    }

    @keyframes footerDerechosRespira {
        0%, 100% { box-shadow: 0 10px 26px rgba(71, 85, 105, 0.11); transform: translateY(0); }
        50% { box-shadow: 0 13px 30px rgba(71, 85, 105, 0.15); transform: translateY(-1px); }
    }

    @keyframes footerDerechosBrillo {
        0%, 58% { left: -38%; opacity: 0; }
        66% { opacity: 0.9; }
        86% { left: 116%; opacity: 0.25; }
        100% { left: 116%; opacity: 0; }
    }

    @keyframes footerEscudoPulso {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.045); }
    }

    @media (max-width: 576px) {
        .footer-lspedia .footer-logo { width: 118px !important; }
        .footer-lspedia .footer-redes { gap: 12px; }
        .footer-lspedia .footer-red-icono {
            width: 43px !important;
            height: 43px !important;
            flex-basis: 43px;
        }
        .footer-lspedia .footer-red-icono svg {
            width: 21px !important;
            height: 21px !important;
        }
        .footer-lspedia .footer-bottom {
            margin: 22px 0 4px;
            padding: 22px 16px 20px !important;
            border-radius: 24px;
        }
        .footer-derechos-principal {
            font-size: 0.94rem;
            line-height: 1.5;
        }
        .footer-tagline {
            font-size: 0.79rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .footer-lspedia .footer-red-icono,
        .footer-lspedia .footer-red-icono::before,
        .footer-lspedia .footer-bottom,
        .footer-lspedia .footer-bottom::after,
        .footer-lspedia .footer-escudo {
            animation: none !important;
        }
    }
</style>'''

texto, c1 = re.subn(r'<style id="footer-microanimaciones">.*?</style>', nuevo_estilo, texto, count=1, flags=re.S)
if c1 != 1:
    raise SystemExit(f'ERROR: no se encontró el bloque footer-microanimaciones ({c1}).')

nuevo_footer_bottom = r'''<div class="footer-bottom text-center">
            <span class="footer-escudo" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/></svg>
            </span>
            <p class="footer-derechos-principal">© 2026 LSPedia — Nilton F. G. Todos los derechos reservados.</p>
            <a href="licencia.html" class="footer-link-licencia footer-link-boton">
                Ver licencia
                <svg viewBox="0 0 24 24" aria-hidden="true" class="footer-icono-externo"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 3h6v6"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 14L21 3"/></svg>
            </a>
            <p class="footer-tagline">Conocimiento sin barreras, un Perú más inclusivo.</p>
        </div>'''

texto, c2 = re.subn(r'<div class="footer-bottom text-center">.*?</div>', nuevo_footer_bottom, texto, count=1, flags=re.S)
if c2 != 1:
    raise SystemExit(f'ERROR: no se encontró footer-bottom ({c2}).')

index.write_text(texto, encoding='utf-8', newline='\n')

sw = Path('sw.js')
sw_texto = sw.read_text(encoding='utf-8')
sw_nuevo, c3 = re.subn(r'const VERSION_APP = "v29";', 'const VERSION_APP = "v30";', sw_texto, count=1)
if c3 != 1:
    raise SystemExit('ERROR: no se encontró VERSION_APP v29.')
sw.write_text(sw_nuevo, encoding='utf-8', newline='\n')
