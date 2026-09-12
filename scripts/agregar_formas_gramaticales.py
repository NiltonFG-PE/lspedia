#!/usr/bin/env python3
import json
from pathlib import Path

RUTA = Path('data/palabras.json')
datos = json.loads(RUTA.read_text(encoding='utf-8'))
if not isinstance(datos, list):
    raise SystemExit('data/palabras.json no es una lista')

nuevas = [
    {
        'id': 'soy',
        'palabra': 'Soy',
        'variantes': 'yo soy',
        'definicion': 'Forma del verbo ser. Se usa con “yo” para decir quién eres, qué eres o cómo eres. Ejemplo: Yo soy estudiante.',
        'categoria': 'Verbos',
        'video': '',
        'imagen': '',
        'senasugerida': ''
    },
    {
        'id': 'eres',
        'palabra': 'Eres',
        'variantes': 'tú eres',
        'definicion': 'Forma del verbo ser. Se usa con “tú” para decir quién es o cómo es la persona con quien hablas. Ejemplo: Tú eres amable.',
        'categoria': 'Verbos',
        'video': '',
        'imagen': '',
        'senasugerida': ''
    },
    {
        'id': 'escupe',
        'palabra': 'Escupe',
        'variantes': 'escupir, escupió, escupiendo',
        'definicion': 'Forma del verbo escupir. Significa sacar saliva de la boca hacia afuera. También puede usarse como una orden: “Escupe”.',
        'categoria': 'Verbos',
        'video': '',
        'imagen': '',
        'senasugerida': ''
    }
]

existentes_id = {str(x.get('id','')).strip().casefold() for x in datos if isinstance(x, dict)}
existentes_nombre = {str(x.get('palabra','')).strip().casefold() for x in datos if isinstance(x, dict)}
agregadas = []
for item in nuevas:
    if item['id'].casefold() in existentes_id or item['palabra'].casefold() in existentes_nombre:
        continue
    datos.append(item)
    agregadas.append(item['palabra'])

RUTA.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
print('Agregadas:', ', '.join(agregadas) if agregadas else 'ninguna (ya existían)')
