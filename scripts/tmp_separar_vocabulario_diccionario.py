from pathlib import Path

p = Path('js/script.js')
s = p.read_text(encoding='utf-8')

# 1) Cualquier intento accidental de abrir un item de Vocabulario con la
#    función general del Diccionario se redirige a la ficha propia.
old = '''function mostrarPalabra(p, opciones = {}){\n    // opciones.enCategorias === true  ->  este resultado viene de la vista'''
new = '''function mostrarPalabra(p, opciones = {}){\n    // Barrera de separación: una entrada marcada como Vocabulario nunca debe\n    // renderizarse con la ficha ni la navegación del Diccionario. Esto también\n    // protege flujos antiguos que todavía pudieran llamar mostrarPalabra().\n    if(obtenerFuentePalabra(p) === "vocabulario"){\n        mostrarPalabraSimplificada(marcarFuenteVocabulario(p), {\n            ...opciones,\n            fuente: "vocabulario",\n            enCategorias: opciones.enCategorias !== false\n        });\n        return;\n    }\n\n    // opciones.enCategorias === true  ->  este resultado viene de la vista'''
if old not in s:
    raise SystemExit('No se encontró la firma esperada de mostrarPalabra().')
s = s.replace(old, new, 1)

# 2) Si por un flujo antiguo se pide relacionados generales para un item de
#    Vocabulario, se fuerza el banco y la navegación de Vocabulario.
old = '''function mostrarSugerenciasRelacionadas(palabraActual, contenedor, opciones = {}){\n    if(!contenedor) return;'''
new = '''function mostrarSugerenciasRelacionadas(palabraActual, contenedor, opciones = {}){\n    if(obtenerFuentePalabra(palabraActual) === "vocabulario"){\n        mostrarSugerenciasRelacionadasVocabulario(\n            marcarFuenteVocabulario(palabraActual),\n            contenedor,\n            opciones\n        );\n        return;\n    }\n    if(!contenedor) return;'''
if old not in s:
    raise SystemExit('No se encontró mostrarSugerenciasRelacionadas().')
s = s.replace(old, new, 1)

# 3) Los clics de relacionados de Vocabulario vuelven a resolver la ficha
#    exclusivamente contra Vocabulario, en vez de abrir el objeto directamente.
old = '''        col.onclick = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); mostrarPalabraSimplificada(p, { enCategorias: !!opciones.clickAbreEnCategorias }); };'''
new = '''        col.onclick = () => {\n            window.scrollTo({ top: 0, behavior: 'smooth' });\n            const referencia = obtenerIdPalabra(p);\n            const enVocabulario = buscarPalabraPorReferencia(referencia, obtenerDatosVocabulario());\n            if(enVocabulario){\n                mostrarPalabraSimplificada(marcarFuenteVocabulario(enVocabulario), {\n                    fuente: "vocabulario",\n                    enCategorias: !!opciones.clickAbreEnCategorias\n                });\n            }\n        };'''
if old not in s:
    raise SystemExit('No se encontró el onclick esperado de relacionados de Vocabulario.')
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')

# Bump de caché para que el navegador no conserve script.js anterior.
sw = Path('sw.js')
t = sw.read_text(encoding='utf-8')
if 'const VERSION_APP = "v130";' in t:
    t = t.replace('const VERSION_APP = "v130";', 'const VERSION_APP = "v131";', 1)
elif 'const VERSION_APP = "v131";' not in t:
    raise SystemExit('Versión inesperada de sw.js; no se modificó.')
sw.write_text(t, encoding='utf-8')

print('OK: Vocabulario aislado del Diccionario y relacionados protegidos.')
