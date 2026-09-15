from pathlib import Path

p = Path('js/lab-senas-ia.js')
s = p.read_text(encoding='utf-8')

old = """function renderResultados(top) {\n  ui.resultados.textContent = '';\n  if (!top.length) {\n    ui.resultados.textContent = 'Sin candidatos.';\n    return;\n  }\n"""

new = """function pronunciarPrimerResultadoPrediccion(etiqueta) {\n  const texto = etiquetaValida(etiqueta);\n  if (!texto || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;\n\n  try {\n    // Si el usuario hace otra búsqueda mientras todavía se reproduce la\n    // anterior, priorizamos siempre el resultado más reciente.\n    window.speechSynthesis.cancel();\n\n    const voz = new SpeechSynthesisUtterance(texto);\n    voz.lang = 'es-PE';\n    voz.rate = 0.95;\n    voz.pitch = 1;\n    voz.volume = 1;\n\n    const voces = window.speechSynthesis.getVoices();\n    const preferida = voces.find(v => /^es-PE$/i.test(v.lang)) ||\n      voces.find(v => /^es-(419|MX|CO|AR|CL)$/i.test(v.lang)) ||\n      voces.find(v => /^es(?:-|$)/i.test(v.lang));\n    if (preferida) voz.voice = preferida;\n\n    window.speechSynthesis.speak(voz);\n  } catch (error) {\n    console.warn('[LSPedia señas IA] No se pudo reproducir la predicción por voz:', error);\n  }\n}\n\nfunction renderResultados(top) {\n  ui.resultados.textContent = '';\n  if (!top.length) {\n    ui.resultados.textContent = 'Sin candidatos.';\n    return;\n  }\n\n  // La búsqueda es una acción explícita del usuario: una vez terminada la\n  // comparación, pronunciamos únicamente el candidato Top 1.\n  pronunciarPrimerResultadoPrediccion(top[0][0]);\n"""

if old not in s:
    raise SystemExit('No se encontró el bloque esperado de renderResultados().')

s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('OK: audio Top 1 añadido a la predicción de señas IA.')
