from pathlib import Path

p = Path('.tmp/aplicar_mejoras_herramientas_juegos_v2.py')
s = p.read_text(encoding='utf-8')

# 1) Adaptar iniciarJuegoCompletar() a la estructura actual del archivo real.
viejo = '''    function iniciarJuegoCompletar() {\n        const nivel = nivelCompletarActual();'''
nuevo = '''    function iniciarJuegoCompletar() {\n        const banco = barajar(bancoPalabrasCompletar());'''
reemplazo_viejo = '''    function iniciarJuegoCompletar() {\n        if(window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarJuego === "function"){\n            HistorialJuegosLSPedia.registrarJuego("completar", "partida", { nivel: estado.completar.nivelId || "" });\n        }\n        const nivel = nivelCompletarActual();'''
reemplazo_nuevo = '''    function iniciarJuegoCompletar() {\n        if(window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarJuego === "function"){\n            HistorialJuegosLSPedia.registrarJuego("completar", "partida", { nivel: estado.completar.nivelId || "" });\n        }\n        const banco = barajar(bancoPalabrasCompletar());'''
if viejo in s:
    s = s.replace(viejo, nuevo, 1)
if reemplazo_viejo in s:
    s = s.replace(reemplazo_viejo, reemplazo_nuevo, 1)

# 2) Sustituir la parte frágil que programa la mano guía por una inserción
# limitada a la función renderOpcionesBlancoActual().
marca_inicio = '# Programa la guía cada vez que se redibujan las opciones.'
marca_fin = '# Feedback común en Completar.'
inicio = s.index(marca_inicio)
fin = s.index(marca_fin, inicio)

bloque = r'''# Programa la guía cada vez que se redibujan las opciones.
render_inicio = a.index("    function renderOpcionesBlancoActual() {")
render_fin = a.index("    function animarLetraHaciaCasilla", render_inicio)
segmento = a[render_inicio:render_fin]
needle = '            filaOpciones.appendChild(btn);\n        });\n'
if needle not in segmento:
    raise RuntimeError("No se pudo localizar el cierre de opciones para la mano guia")
segmento = segmento.replace(
    needle,
    needle + '        programarGuiaVisualCompletar();\n',
    1
)
a = a[:render_inicio] + segmento + a[render_fin:]

'''
s = s[:inicio] + bloque + s[fin:]

p.write_text(s, encoding='utf-8')
print('OK: parche adaptado a la estructura actual')
