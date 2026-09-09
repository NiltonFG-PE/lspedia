#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
SW = ROOT / "sw.js"


def main():
    texto = INDEX.read_text(encoding="utf-8")

    patron = re.compile(
        r'<div id="splashScreen">.*?</style>\s*(?=<script>\s*// Se oculta cuando se cumplen DOS condiciones:)',
        re.S,
    )

    reemplazo = '''<div id="splashScreen" role="status" aria-label="LSPedia está preparando el contenido">
    <span class="splash-decoracion splash-decoracion-1" aria-hidden="true"></span>
    <span class="splash-decoracion splash-decoracion-2" aria-hidden="true"></span>
    <span class="splash-punto splash-punto-1" aria-hidden="true"></span>
    <span class="splash-punto splash-punto-2" aria-hidden="true"></span>

    <div class="splash-contenido">
        <div class="splash-logo-wrap">
            <span class="splash-estela splash-estela-1" aria-hidden="true"></span>
            <span class="splash-estela splash-estela-2" aria-hidden="true"></span>
            <img src="img/lspedia.png" alt="LSPedia" id="splashLogo">
        </div>

        <div class="splash-barra-wrap" aria-hidden="true">
            <div class="splash-barra"></div>
            <div class="splash-barra-brillo"></div>
        </div>

        <p class="splash-frase">Desarrollado con corazón</p>
    </div>
</div>

<style>
    #splashScreen {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        transition: opacity 0.42s ease, visibility 0.42s ease;
    }

    #splashScreen.splash-oculto {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
    }

    .splash-contenido {
        position: relative;
        z-index: 2;
        width: min(84vw, 520px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transform: translateY(-1.5vh);
    }

    .splash-logo-wrap {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 32px;
        isolation: isolate;
    }

    #splashLogo {
        position: relative;
        z-index: 2;
        width: min(78vw, 430px);
        height: auto;
        display: block;
        filter: drop-shadow(0 8px 18px rgba(15, 58, 112, 0.08));
        animation: splashLogoEntrada 0.72s cubic-bezier(0.22, 1, 0.36, 1) both,
                   splashLogoMovimiento 2.8s ease-in-out 0.72s infinite;
        will-change: transform, opacity;
    }

    .splash-estela {
        position: absolute;
        z-index: 1;
        left: 28%;
        width: 64%;
        height: 10px;
        border-radius: 999px;
        opacity: 0;
        pointer-events: none;
        filter: blur(0.2px);
        transform: translateX(-22px) scaleX(0.72);
        animation: splashEstela 2.25s ease-in-out infinite;
    }

    .splash-estela-1 {
        top: 42%;
        background: linear-gradient(90deg, transparent, rgba(50, 151, 235, 0.13), transparent);
    }

    .splash-estela-2 {
        top: 60%;
        height: 7px;
        background: linear-gradient(90deg, transparent, rgba(247, 185, 32, 0.10), transparent);
        animation-delay: 0.28s;
    }

    .splash-barra-wrap {
        position: relative;
        width: min(66vw, 360px);
        height: 9px;
        border-radius: 999px;
        background: #e7edf4;
        overflow: hidden;
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
    }

    .splash-barra {
        position: absolute;
        inset: 0 auto 0 0;
        width: 42%;
        border-radius: inherit;
        background: linear-gradient(90deg, #1789df 0%, #3cbcf1 100%);
        animation: splashCargando 1.75s cubic-bezier(0.45, 0, 0.25, 1) infinite;
        will-change: width, transform;
    }

    .splash-barra-brillo {
        position: absolute;
        top: 1px;
        bottom: 1px;
        left: -24%;
        width: 20%;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent);
        filter: blur(0.5px);
        animation: splashBrillo 1.75s ease-in-out infinite;
        pointer-events: none;
    }

    .splash-frase {
        margin: 17px 0 0;
        color: #36597d;
        font-size: clamp(0.88rem, 2.8vw, 1.02rem);
        font-weight: 500;
        letter-spacing: 0.015em;
        text-align: center;
        animation: splashFraseEntrada 0.6s ease 0.28s both;
    }

    .splash-decoracion {
        position: absolute;
        z-index: 0;
        width: min(72vw, 520px);
        aspect-ratio: 1;
        border-radius: 50%;
        border: clamp(22px, 5vw, 42px) solid rgba(62, 151, 231, 0.055);
        pointer-events: none;
    }

    .splash-decoracion-1 {
        top: min(-24vw, -95px);
        left: min(-30vw, -130px);
    }

    .splash-decoracion-2 {
        right: min(-34vw, -150px);
        bottom: min(-30vw, -140px);
    }

    .splash-punto {
        position: absolute;
        z-index: 0;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgba(62, 151, 231, 0.10);
        pointer-events: none;
        animation: splashPunto 4s ease-in-out infinite;
    }

    .splash-punto-1 { top: 18%; right: 24%; }
    .splash-punto-2 { bottom: 17%; left: 26%; animation-delay: 1.1s; }

    @keyframes splashLogoEntrada {
        0%   { opacity: 0; transform: translateX(-18px) scale(0.96); }
        62%  { opacity: 1; transform: translateX(4px) scale(1.012); }
        100% { opacity: 1; transform: translateX(0) scale(1); }
    }

    @keyframes splashLogoMovimiento {
        0%, 100% { transform: translateX(0) translateY(0); }
        40%      { transform: translateX(2px) translateY(-2px); }
        65%      { transform: translateX(-1px) translateY(-1px); }
    }

    @keyframes splashEstela {
        0%, 12% { opacity: 0; transform: translateX(-24px) scaleX(0.70); }
        38%     { opacity: 1; }
        68%     { opacity: 0.55; }
        100%    { opacity: 0; transform: translateX(30px) scaleX(1.04); }
    }

    @keyframes splashCargando {
        0%   { width: 18%; transform: translateX(-8%); }
        48%  { width: 64%; transform: translateX(18%); }
        76%  { width: 82%; transform: translateX(10%); }
        100% { width: 34%; transform: translateX(190%); }
    }

    @keyframes splashBrillo {
        0%   { left: -24%; opacity: 0; }
        20%  { opacity: 0.9; }
        100% { left: 106%; opacity: 0; }
    }

    @keyframes splashFraseEntrada {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes splashPunto {
        0%, 100% { transform: translateY(0); opacity: 0.45; }
        50%      { transform: translateY(-7px); opacity: 0.75; }
    }

    @media (max-width: 480px) {
        .splash-contenido { width: 88vw; }
        #splashLogo { width: min(82vw, 365px); }
        .splash-logo-wrap { margin-bottom: 28px; }
        .splash-barra-wrap { width: min(68vw, 300px); height: 8px; }
    }

    @media (prefers-reduced-motion: reduce) {
        #splashLogo,
        .splash-estela,
        .splash-barra,
        .splash-barra-brillo,
        .splash-frase,
        .splash-punto {
            animation: none !important;
        }
        #splashLogo { opacity: 1; transform: none; }
        .splash-barra { width: 58%; }
    }
</style>
'''

    texto_nuevo, cambios = patron.subn(reemplazo, texto, count=1)
    if cambios != 1:
        raise SystemExit(f"ERROR: se esperaba reemplazar 1 splash y se reemplazaron {cambios}.")

    texto_nuevo, cambios_timeout = re.subn(
        r'setTimeout\(\(\) => splash\.remove\(\),\s*260\);',
        'setTimeout(() => splash.remove(), 460);',
        texto_nuevo,
        count=1,
    )
    if cambios_timeout != 1:
        raise SystemExit("ERROR: no se encontró el timeout actual del splash.")

    INDEX.write_text(texto_nuevo, encoding="utf-8", newline="\n")

    sw_texto = SW.read_text(encoding="utf-8")
    sw_nuevo, cambios_sw = re.subn(
        r'const VERSION_APP = "v26";',
        'const VERSION_APP = "v27";',
        sw_texto,
        count=1,
    )
    if cambios_sw != 1:
        raise SystemExit("ERROR: no se encontró VERSION_APP v26 en sw.js.")
    SW.write_text(sw_nuevo, encoding="utf-8", newline="\n")

    print("Splash moderno aplicado y Service Worker actualizado a v27.")


if __name__ == "__main__":
    main()
