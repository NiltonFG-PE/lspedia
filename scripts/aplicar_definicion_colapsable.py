from pathlib import Path

JS = Path('js/script.js')
CSS = Path('css/mejoras-producto.css')
SW = Path('sw.js')

js = JS.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')
sw = SW.read_text(encoding='utf-8')

marker_js = 'DEFINICION_COLAPSABLE_DICCIONARIO_V1_20260911'
marker_css = 'DEFINICION_COLAPSABLE_DICCIONARIO_V1_20260911'

if marker_js not in js:
    anchor = 'function mostrarPalabra(p, opciones = {}){'
    if anchor not in js:
        raise SystemExit('No se encontró mostrarPalabra()')

    helper = r'''// DEFINICION_COLAPSABLE_DICCIONARIO_V1_20260911
// Las definiciones largas del Diccionario se muestran resumidas para que el
// video quede visible mucho antes. El contenido original no se modifica:
// solo se limita visualmente a 4 líneas en móvil y 6 en escritorio.
function inicializarDefinicionColapsable(contenedor){
    if(!contenedor) return;
    const bloque = contenedor.querySelector('[data-definicion-colapsable]');
    if(!bloque) return;

    const texto = bloque.querySelector('.definicion-colapsable-texto');
    const boton = bloque.querySelector('[data-definicion-toggle]');
    if(!texto || !boton) return;

    const medir = () => {
        const ancho = texto.getBoundingClientRect().width;
        if(!ancho) return;

        const estilos = window.getComputedStyle(texto);
        const altoLinea = Number.parseFloat(estilos.lineHeight) || 24;
        const lineasVisibles = window.matchMedia('(max-width: 767.98px)').matches ? 4 : 6;

        // Se mide una copia sin line-clamp para saber si realmente hace falta
        // el botón. Así las definiciones cortas siguen viéndose completas.
        const copia = texto.cloneNode(true);
        copia.removeAttribute('id');
        copia.className = '';
        copia.style.cssText = [
            'position:absolute',
            'visibility:hidden',
            'pointer-events:none',
            'display:block',
            'overflow:visible',
            'height:auto',
            'max-height:none',
            '-webkit-line-clamp:unset',
            '-webkit-box-orient:initial',
            'width:' + ancho + 'px',
            'font-size:' + estilos.fontSize,
            'font-family:' + estilos.fontFamily,
            'font-weight:' + estilos.fontWeight,
            'line-height:' + estilos.lineHeight,
            'letter-spacing:' + estilos.letterSpacing,
            'white-space:normal'
        ].join(';');
        bloque.appendChild(copia);
        const alturaCompleta = copia.scrollHeight;
        copia.remove();

        const esLarga = alturaCompleta > (altoLinea * lineasVisibles + 2);
        if(!esLarga){
            bloque.classList.remove('definicion-colapsable-cerrada');
            boton.hidden = true;
            boton.setAttribute('aria-expanded', 'true');
            return;
        }

        boton.hidden = false;
        if(!bloque.dataset.definicionInicializada){
            bloque.classList.add('definicion-colapsable-cerrada');
            bloque.dataset.definicionInicializada = '1';
        }
    };

    boton.addEventListener('click', () => {
        const estabaCerrada = bloque.classList.contains('definicion-colapsable-cerrada');
        bloque.classList.toggle('definicion-colapsable-cerrada', !estabaCerrada);
        const expandida = estabaCerrada;
        boton.setAttribute('aria-expanded', expandida ? 'true' : 'false');
        boton.innerHTML = expandida ? 'Ver menos <span aria-hidden="true">↑</span>' : 'Ver más <span aria-hidden="true">↓</span>';

        if(!expandida){
            requestAnimationFrame(() => {
                bloque.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }
    });

    requestAnimationFrame(medir);
}

'''
    js = js.replace(anchor, helper + anchor, 1)

old_def = '''            <p class="mb-3 p-3 rounded" style="background-color: #eef6ff; border-left: 4px solid #0d6efd; font-size: 1rem; line-height: 1.5; color: #1e293b;">${formatearDefinicion(p.definicion)}</p>'''
new_def = '''            <div class="definicion-colapsable definicion-colapsable-cerrada mb-3" data-definicion-colapsable>
                <div class="definicion-colapsable-contenido">
                    <div class="definicion-colapsable-texto" id="definicionPalabraTexto">${formatearDefinicion(p.definicion)}</div>
                </div>
                <button type="button" class="definicion-colapsable-toggle" data-definicion-toggle aria-expanded="false" aria-controls="definicionPalabraTexto" hidden>
                    Ver más <span aria-hidden="true">↓</span>
                </button>
            </div>'''

if new_def not in js:
    if old_def not in js:
        raise SystemExit('No se encontró el bloque de definición del Diccionario')
    js = js.replace(old_def, new_def, 1)

call_anchor = '''    document.getElementById("btnFavorito").addEventListener("click", () => {'''
call_line = '''    inicializarDefinicionColapsable(contenedorDestino);\n'''
if call_line not in js:
    if call_anchor not in js:
        raise SystemExit('No se encontró punto para inicializar la definición')
    js = js.replace(call_anchor, call_line + call_anchor, 1)

css_block = r'''

/* DEFINICION_COLAPSABLE_DICCIONARIO_V1_20260911
   Mantiene el texto completo en el DOM, pero acerca el video cuando una
   definición del Diccionario es larga. */
.definicion-colapsable {
    background: #eef6ff;
    border-left: 4px solid #0d6efd;
    border-radius: .5rem;
    padding: 1rem;
}

.definicion-colapsable-contenido {
    position: relative;
}

.definicion-colapsable-texto {
    color: #1e293b;
    font-size: 1rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
}

.definicion-colapsable-cerrada .definicion-colapsable-texto {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
    overflow: hidden;
}

.definicion-colapsable-cerrada .definicion-colapsable-contenido::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2.2rem;
    pointer-events: none;
    background: linear-gradient(to bottom, rgba(238, 246, 255, 0), #eef6ff 88%);
}

.definicion-colapsable-toggle {
    display: inline-flex;
    align-items: center;
    gap: .32rem;
    margin-top: .55rem;
    padding: .28rem .15rem;
    border: 0;
    background: transparent;
    color: #0d6efd;
    font-size: .88rem;
    font-weight: 800;
    line-height: 1.2;
    cursor: pointer;
    touch-action: manipulation;
}

.definicion-colapsable-toggle:hover,
.definicion-colapsable-toggle:focus-visible {
    color: #084298;
    text-decoration: underline;
}

.definicion-colapsable-toggle:focus-visible {
    outline: 2px solid rgba(13, 110, 253, .35);
    outline-offset: 3px;
    border-radius: .35rem;
}

@media (max-width: 767.98px) {
    .definicion-colapsable {
        padding: .85rem .9rem;
    }

    .definicion-colapsable-cerrada .definicion-colapsable-texto {
        -webkit-line-clamp: 4;
    }

    .definicion-colapsable-toggle {
        min-height: 38px;
        margin-top: .35rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .definicion-colapsable {
        scroll-behavior: auto;
    }
}
'''

if marker_css not in css:
    css = css.rstrip() + css_block + '\n'

if 'const VERSION_APP = "v71";' in sw:
    sw = sw.replace('const VERSION_APP = "v71";', 'const VERSION_APP = "v72";', 1)
elif 'const VERSION_APP = "v72";' not in sw:
    raise SystemExit('VERSION_APP cambió; revisar antes de sobrescribir')

JS.write_text(js, encoding='utf-8')
CSS.write_text(css, encoding='utf-8')
SW.write_text(sw, encoding='utf-8')

# Validaciones estructurales de la migración.
final_js = JS.read_text(encoding='utf-8')
final_css = CSS.read_text(encoding='utf-8')
final_sw = SW.read_text(encoding='utf-8')
assert marker_js in final_js
assert 'data-definicion-colapsable' in final_js
assert 'inicializarDefinicionColapsable(contenedorDestino);' in final_js
assert marker_css in final_css
assert '-webkit-line-clamp: 4;' in final_css
assert '-webkit-line-clamp: 6;' in final_css
assert 'const VERSION_APP = "v72";' in final_sw
print('Definición colapsable aplicada correctamente.')
