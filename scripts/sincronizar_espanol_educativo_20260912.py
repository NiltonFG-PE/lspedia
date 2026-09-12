#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATOS = ROOT / 'data' / 'palabras.json'
BUSCADOR = ROOT / 'js' / 'buscador-visual.js'
I18N = ROOT / 'js' / 'i18n.js'
SW = ROOT / 'sw.js'

CAMBIOS = {
    'Huevo': {
        'definicion': 'Es un alimento que ponen las gallinas. Se puede cocinar de diferentes formas. Ejemplo: Comí un huevo frito en el desayuno.'
    },
    'Lengua de señas': {
        'definicion': 'Es una lengua visual y gestual que permite comunicarse mediante señas, movimientos del cuerpo y expresiones faciales. En Perú existe la Lengua de Señas Peruana (LSP). Ejemplo: Uso la LSP para comunicarme con otras personas.'
    },
    'Intérprete': {
        'definicion': 'Es la persona que interpreta entre una lengua de señas y una lengua oral para facilitar la comunicación. Ejemplo: Un intérprete de LSP ayudó a que todos comprendieran la charla.'
    },
    'Gracias': {
        'variantes': 'Muchas gracias, Muchísimas gracias, Mil gracias, Gracias totales, Se agradece, Agradecer'
    },
    'Por favor': {
        'variantes': 'Porfa, Por favorcito'
    },
    'Disculpa': {
        'variantes': 'Disculpe, Disculpen, Disculpas, Disculpaste, Disculparás, Perdón, Perdóname, Lo siento, Pedir disculpas, Discúlpame'
    },
    'Felicitaciones': {
        'variantes': 'Felicidades, Enhorabuena, Bravo, Bien hecho, Te felicito, Los felicito, Te felicitamos, Los felicitamos'
    },
    'Hipótesis': {
        'variantes': 'Suposición, Conjetura, Teoría, Premisa'
    },
    'Especialización': {
        'definicion': 'Proceso de aprender y formarse de manera profunda en un área específica.'
    },
    'Evidencia': {
        'definicion': 'Prueba, dato o información que ayuda a demostrar que algo es verdadero o que una afirmación tiene fundamento.'
    },
    'Uniformidad': {
        'variantes': 'Homogeneidad, Regularidad, Igualdad, Consistencia, Estandarización'
    },
    'Celoso': {
        'definicion': 'Es cuando una persona siente inseguridad, temor o molestia porque piensa que puede perder el cariño o la atención de alguien importante para ella. Ejemplo: Se sintió celoso cuando su amigo empezó a pasar más tiempo con otra persona.'
    },
    'Hijo': {
        'definicion': 'Es la persona que un padre o una madre llama “mi hijo” o “mi hija”. Puede ser niño, joven o adulto. Ejemplo: Tengo un hijo de cinco años.'
    },
    'Nieto': {
        'definicion': 'Es el hijo o la hija de tu hijo o de tu hija. Ejemplo: Mi abuela juega con su nieto todas las tardes.'
    },
    'Cuñado': {
        'definicion': 'Es el hermano o la hermana de tu esposo o esposa, o la pareja de tu hermano o hermana. Ejemplo: Mi cuñado nos invitó a su casa.'
    },
    'Viento': {
        'definicion': 'Es el aire en movimiento. Puede ser suave o fuerte y puede mover objetos. Ejemplo: El viento hizo volar mi sombrero.'
    },
    'Calor': {
        'definicion': 'Es la sensación que sentimos cuando la temperatura es alta. Ejemplo: Hace mucho calor en la costa en verano.'
    },
    'Empatía': {
        'definicion': 'Es la capacidad de comprender cómo se siente otra persona y tratar de entender su situación desde su punto de vista.'
    },
    'Trascender': {
        'variantes': 'Perdurar, Dejar huella, Tener impacto, Permanecer',
        'definicion': 'Trascender significa ir más allá de lo común o de ciertos límites y dejar un impacto, una enseñanza o un cambio que permanece con el tiempo. En otras palabras, trascender es hacer algo que tenga un valor o una influencia duradera.'
    },
    'Gripe': {
        'variantes': '',
        'definicion': 'Es una infección respiratoria causada por los virus de la influenza. Puede causar fiebre, tos, dolor de cuerpo y cansancio. Ejemplo: Falté al trabajo porque tenía gripe.'
    },
    'Hola': {
        'variantes': ''
    },
    'Adiós': {
        'variantes': 'Chau, Hasta la vista, Chao'
    },
    'Buenos días': {
        'variantes': 'Buen día, Buenas'
    },
    'Buenas tardes': {
        'variantes': ''
    },
    'Buenas noches': {
        'variantes': ''
    },
    'Bienvenido': {
        'variantes': 'Bienvenida, Bienvenidos, Bienvenidas'
    },
    'Algoritmo': {
        'definicion': 'Es una serie de pasos ordenados para resolver un problema o realizar una tarea, como una receta que se sigue paso a paso.'
    },
    'Branding': {
        'definicion': 'Es el proceso de crear y desarrollar la identidad de una marca o empresa para que las personas la reconozcan y la diferencien de otras.'
    },
    'Consenso': {
        'variantes': 'Acuerdo, Conformidad',
        'definicion': 'Es un acuerdo general al que llega un grupo después de conversar. No significa que todos piensen exactamente igual, sino que aceptan una decisión común.'
    },
    'Carrera': {
        'definicion': 'Es el conjunto de estudios que una persona sigue en una universidad o instituto para prepararse para una profesión u oficio. Ejemplo: Mi carrera es contabilidad y estudio en la universidad desde hace dos años.'
    },
    'Tesis': {
        'definicion': 'Es un trabajo de investigación que una persona realiza en la universidad para obtener un grado o título, según las reglas de su institución.\n\n*¿Cómo se hace?*\n• Elige un tema o problema que quiere investigar.\n• Busca información en libros, artículos, entrevistas, encuestas u otras fuentes.\n• Analiza la información y explica lo que descubrió.\n• Escribe sus conclusiones.\n\n*El último paso: sustentar la tesis*\nLa persona presenta y explica su investigación ante un jurado, que puede hacerle preguntas. Si la tesis es aprobada y se cumplen los demás requisitos de la institución, puede continuar el proceso para obtener el grado o título correspondiente.\n\nEn una maestría o un doctorado también puede ser necesario realizar y sustentar una nueva tesis de mayor nivel.'
    },
    'Titulación': {
        'definicion': 'Es el proceso para obtener un título profesional después de cumplir los requisitos establecidos por la institución educativa. Ejemplo: Después de terminar la carrera y cumplir los requisitos, inició su proceso de titulación.'
    },
    'Psicosis': {
        'variantes': 'Psicótico, Psicótica, Episodio psicótico'
    },
    'Retar': {
        'variantes': 'Reto, Retado, Retando, Desafiar, Desafío'
    },
    'Flexible': {
        'variantes': 'Flexibilidad, Flexibilizar, Adaptable, Ajustar, Versátil'
    },
}


def actualizar_datos() -> int:
    datos = json.loads(DATOS.read_text(encoding='utf-8'))
    if not isinstance(datos, list):
        raise SystemExit('palabras.json no contiene una lista.')

    por_nombre: dict[str, list[dict]] = {}
    for fila in datos:
        if isinstance(fila, dict):
            por_nombre.setdefault(str(fila.get('palabra', '')).strip(), []).append(fila)

    for palabra, campos in CAMBIOS.items():
        filas = por_nombre.get(palabra, [])
        if len(filas) != 1:
            raise SystemExit(f'{palabra!r}: se esperaba 1 registro y se encontraron {len(filas)}.')
        filas[0].update(campos)

    filas_mucho = por_nombre.get('Mucho', [])
    if len(filas_mucho) != 1:
        raise SystemExit('Mucho: no se pudo limpiar la columna accidental con seguridad.')
    if '' in filas_mucho[0]:
        filas_mucho[0][''] = ''

    DATOS.write_text(
        json.dumps(datos, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
        newline='\n',
    )
    return len(CAMBIOS)


def actualizar_aliases_busqueda() -> None:
    texto = BUSCADOR.read_text(encoding='utf-8')
    viejo = """        ['resiliencia', ['resilencia', 'resciliencia']],\n        ['matemáticas', ['matematicas', 'matematicas']],\n        ['educación', ['educacion']],\n        ['acompañar', ['acompanar']],\n        ['hipótesis', ['hipotesis']],\n        ['adiós', ['adios']]\n"""
    nuevo = """        ['resiliencia', ['resilencia', 'resciliencia']],\n        ['matemáticas', ['matematicas']],\n        ['educación', ['educacion']],\n        ['acompañar', ['acompanar']],\n        ['hipótesis', ['hipotesis']],\n        ['trascender', ['transcender']],\n        ['hola', ['holi', 'holis', 'holiwi', 'olas', 'oli', 'olis']],\n        ['buenos días', ['buenos dias', 'bnas', 'bnas dias']],\n        ['buenas tardes', ['bnas', 'bnas tardes']],\n        ['buenas noches', ['bnas', 'bnas noches']],\n        ['bienvenido', ['bienvenid@', 'bienvenid@s']],\n        ['adiós', ['adios']]\n"""
    if texto.count(viejo) != 1:
        raise SystemExit('No se encontró el bloque esperado de aliases del buscador.')
    BUSCADOR.write_text(texto.replace(viejo, nuevo, 1), encoding='utf-8', newline='\n')


def actualizar_tesis_ingles() -> None:
    texto = I18N.read_text(encoding='utf-8')
    viejo = "A thesis is a major university research project that a student must complete and approve in order to graduate. Instead of only answering exam questions, the student chooses a problem in their field, investigates it and writes what they discovered."
    nuevo = "A thesis is a university research project that may be required for a degree or professional title, depending on the institution. The student chooses a topic or problem, investigates it and explains what was discovered."
    if texto.count(viejo) != 1:
        raise SystemExit('No se encontró la definición inglesa esperada de Tesis.')
    I18N.write_text(texto.replace(viejo, nuevo, 1), encoding='utf-8', newline='\n')


def actualizar_cache() -> None:
    texto = SW.read_text(encoding='utf-8')
    viejo = 'const VERSION_APP = "v102";'
    nuevo = 'const VERSION_APP = "v103";'
    if texto.count(viejo) != 1:
        raise SystemExit('No se encontró VERSION_APP v102 en sw.js.')
    SW.write_text(texto.replace(viejo, nuevo, 1), encoding='utf-8', newline='\n')


if __name__ == '__main__':
    total = actualizar_datos()
    actualizar_aliases_busqueda()
    actualizar_tesis_ingles()
    actualizar_cache()
    print(f'Sincronizadas {total} correcciones educativas del Diccionario.')
