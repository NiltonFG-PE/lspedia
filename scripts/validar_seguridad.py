#!/usr/bin/env python3
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ERRORES = []
EXT_TEXTO = {'.html','.js','.css','.json','.yml','.yaml','.py','.md','.gs','.txt','.xml'}
EXCLUIR_DIR = {'.git','node_modules','.venv','venv'}
SECRETOS = {
    'clave privada PEM': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'token GitHub clásico': re.compile(r'\bgh[pousr]_[A-Za-z0-9]{20,}\b'),
    'token GitHub fine-grained': re.compile(r'\bgithub_pat_[A-Za-z0-9_]{20,}\b'),
    'Google API key': re.compile(r'\bAIza[0-9A-Za-z_-]{35}\b'),
    'AWS access key': re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
    'OpenAI API key': re.compile(r'\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b'),
}
def leer(p):
    try: return p.read_text(encoding='utf-8')
    except UnicodeDecodeError: return ''
for p in ROOT.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in EXT_TEXTO or any(x in EXCLUIR_DIR for x in p.parts):
        continue
    t = leer(p)
    for nombre, patron in SECRETOS.items():
        if patron.search(t): ERRORES.append(f'{p.relative_to(ROOT)}: posible {nombre} expuesto.')

patron_exec = re.compile(r'https://script\.google\.com/macros/s/[^\s\"\'<>]+/exec', re.I)
for p in [ROOT/'index.html', *sorted((ROOT/'js').glob('*.js'))]:
    if p.exists() and patron_exec.search(leer(p)):
        ERRORES.append(f'{p.relative_to(ROOT)}: endpoint Apps Script /exec incrustado en frontend público.')

index = leer(ROOT/'index.html')
security = leer(ROOT/'js'/'security.js')
quiz = leer(ROOT/'js'/'quiz.js')
cname = leer(ROOT/'CNAME').strip().lower()
if cname != 'lspedia.site': ERRORES.append(f'CNAME inesperado: {cname!r}.')
if '<script src="js/security.js"></script>' not in index: ERRORES.append('index.html no carga js/security.js.')
if 'LSPEDIA_GA_ONLY_OFFICIAL' not in index: ERRORES.append('GA4 no está limitado al dominio oficial.')
if 'LSPediaSecurity.permitirPWA()' not in index: ERRORES.append('PWA no está protegida por el guard de dominio.')
if 'lspedia.site' not in security or 'permitirServicio' not in security: ERRORES.append('security.js incompleto.')
if 'script.google.com/macros/s/' in quiz: ERRORES.append('Quiz todavía expone Apps Script.')
if 'if (!esCopiaPublica) return;' not in security: ERRORES.append('El guard no preserva explícitamente el sitio oficial/desarrollo.')

print('\n=== SEGURIDAD LSPedia / anti-clon fase 1 ===')
print('ℹ️ Dominio oficial: https://lspedia.site')
for x in ERRORES: print('❌', x)
print(f'Resumen: {len(ERRORES)} error(es).')
raise SystemExit(1 if ERRORES else 0)
