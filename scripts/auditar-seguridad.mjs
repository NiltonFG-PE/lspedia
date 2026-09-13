#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();
const EXT = new Set(['.js', '.mjs', '.html', '.gs', '.json', '.yml', '.yaml']);
const IGNORAR = new Set(['.git', 'node_modules', '.cache']);
const hallazgos = [];

function archivos(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...archivos(p));
    else if (EXT.has(path.extname(ent.name).toLowerCase())) out.push(p);
  }
  return out;
}

function agregar(sev, archivo, linea, regla, detalle) {
  hallazgos.push({ sev, archivo: path.relative(RAIZ, archivo), linea, regla, detalle });
}

const patronesCriticos = [
  ['secreto-github', /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/g],
  ['clave-privada', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['eval', /\beval\s*\(/g],
  ['new-function', /\bnew\s+Function\s*\(/g],
  ['document-write', /\bdocument\.write(?:ln)?\s*\(/g]
];

for (const archivo of archivos(RAIZ)) {
  const texto = fs.readFileSync(archivo, 'utf8');
  const lineas = texto.split(/\r?\n/);
  lineas.forEach((linea, i) => {
    for (const [regla, re] of patronesCriticos) {
      re.lastIndex = 0;
      if (re.test(linea)) agregar('CRITICO', archivo, i + 1, regla, linea.trim().slice(0, 180));
    }
    if (/\b(?:href|src|action|formaction)\s*=\s*["']\s*javascript:/i.test(linea)) {
      agregar('CRITICO', archivo, i + 1, 'javascript-url', linea.trim().slice(0, 180));
    }
    if (/\.innerHTML\s*=/.test(linea) || /insertAdjacentHTML\s*\(/.test(linea)) {
      const contexto = lineas.slice(Math.max(0, i - 2), i + 3).join(' ');
      if (!/(escaparHtml|formatearDefinicion|textContent|textoSeguro|sanit)/i.test(contexto)) {
        agregar('AVISO', archivo, i + 1, 'html-dinamico', linea.trim().slice(0, 180));
      }
    }
    if (/e\.parameter\.callback|parameter\s*&&\s*e\.parameter\.callback/.test(linea)) {
      agregar('AVISO', archivo, i + 1, 'jsonp-callback', 'Validar el nombre del callback con una lista permitida/regex antes de concatenarlo.');
    }
    if (/Bearer\s+[A-Za-z0-9_\-]{20,}/.test(linea)) {
      agregar('CRITICO', archivo, i + 1, 'bearer-hardcoded', 'Token Bearer literal detectado.');
    }
  });
}

const criticos = hallazgos.filter(x => x.sev === 'CRITICO');
const avisos = hallazgos.filter(x => x.sev === 'AVISO');
console.log(`Auditoría LSPedia: ${criticos.length} críticos, ${avisos.length} avisos.`);
for (const h of hallazgos) console.log(`[${h.sev}] ${h.archivo}:${h.linea} ${h.regla} — ${h.detalle}`);

if (criticos.length) {
  console.error('\nLa auditoría falló porque existen hallazgos críticos.');
  process.exit(1);
}
console.log('\nSin hallazgos críticos. Los avisos deben revisarse durante refactors, pero no bloquean el despliegue.');
