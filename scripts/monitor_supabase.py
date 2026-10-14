#!/usr/bin/env python3
"""Read-only availability check. Uses only the existing public publishable key."""
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

PROJECT_ORIGIN = 'https://vreltnsquvqgragcewlj.supabase.co'

def leer_config(texto):
    url = re.search(r"supabaseUrl\s*:\s*['\"]([^'\"]+)['\"]", texto)
    key = re.search(r"publishableKey\s*:\s*['\"]([^'\"]+)['\"]", texto)
    if not url or url.group(1).rstrip('/') != PROJECT_ORIGIN:
        raise ValueError('Proyecto inesperado: revisar configuración del monitor.')
    if not key or not re.fullmatch(r'sb_publishable_[A-Za-z0-9_-]+', key.group(1)):
        raise ValueError('Se requiere una clave publicable; nunca usar claves secretas.')
    return key.group(1)

def comprobar(key, opener=None):
    request = urllib.request.Request(
        PROJECT_ORIGIN + '/rest/v1/rpc/lsp_service_health_v1',
        headers={'apikey': key, 'Accept': 'application/json',
                 'User-Agent': 'LSPedia-availability-monitor/1.0'}, method='GET')
    with (opener or urllib.request.urlopen)(request, timeout=20) as respuesta:
        if respuesta.status != 200 or respuesta.read(32).strip() != b'true':
            raise ValueError('Respuesta de salud no válida.')
    return {'ok': True, 'project': 'lspedia-web', 'database_query': True}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path,
        default=Path(__file__).resolve().parents[1] / 'miembros/config.js')
    args = parser.parse_args()
    try:
        resultado = comprobar(leer_config(args.config.read_text(encoding='utf-8')))
    except urllib.error.HTTPError as exc:
        resultado = {'ok': False, 'error': 'HTTP ' + str(exc.code)}
    except (ValueError, OSError) as exc:
        resultado = {'ok': False, 'error': type(exc).__name__}
    print(json.dumps(resultado, ensure_ascii=False))
    return 0 if resultado['ok'] else 1

if __name__ == '__main__':
    sys.exit(main())
