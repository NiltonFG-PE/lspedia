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
  ['document-write', /\bdocument\.write(?:ln)?\s*\(/g],
  ['url-javascript', /\bjavascript\s*:/gi],
  ['url-vbscript', /\bvbscript\s*:/gi]
];

const fuentesNoConfiables = /(?:location\.(?:search|hash|href)|URLSearchParams\s*\(|\.value\b|event\.data\b|e\.parameter\b|postMessage\b)/i;
const sinksHtml = /(?:\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML\s*\(|\.srcdoc\s*=|setAttribute\s*\(\s*["']srcdoc["'])/;

for (const archivo of archivos(RAIZ)) {
  const texto = fs.readFileSync(archivo, 'utf8');
  const lineas = texto.split(/\r?\n/);

  lineas.forEach((linea, i) => {
    for (const [regla, re] of patronesCriticos) {
      re.lastIndex = 0;
      // Las menciones de javascript:/vbscript: dentro del propio auditor o de
      // una regex defensiva no son una vulnerabilidad. Solo se consideran
      // críticas si aparecen en código/markup operativo.
      if ((regla === 'url-javascript' || regla === 'url-vbscript') &&
          (/auditar-seguridad\.mjs$/.test(archivo) || /\^\(\?:javascript|atributoUrlPeligroso/.test(linea))) continue;
      if (re.test(linea)) agregar('CRITICO', archivo, i + 1, regla, linea.trim().slice(0, 180));
    }

    if (/\b(?:href|src|action|formaction)\s*=\s*["']\s*(?:javascript|vbscript):/i.test(linea)) {
      agregar('CRITICO', archivo, i + 1, 'url-ejecutable-html', linea.trim().slice(0, 180));
    }

    if (/\b(?:href|src|action|formaction)\s*=\s*["']\s*data\s*:\s*(?:text\/html|image\/svg\+xml)/i.test(linea)) {
      agregar('CRITICO', archivo, i + 1, 'data-url-activa', linea.trim().slice(0, 180));
    }

    if (/setAttribute\s*\(\s*["']on[a-z]+["']/i.test(linea)) {
      agregar('CRITICO', archivo, i + 1, 'evento-inline-dinamico', linea.trim().slice(0, 180));
    }

    if (sinksHtml.test(linea)) {
      const contexto = lineas.slice(Math.max(0, i - 3), Math.min(lineas.length, i + 4)).join(' ');
      const tieneDefensa = /(escaparHtml|escapeHtml|textContent|textoSeguro|sanit|createTextNode)/i.test(contexto);
      const usaFuenteNoConfiable = fuentesNoConfiables.test(contexto);
      if (!tieneDefensa) {
        agregar(
          usaFuenteNoConfiable ? 'ALTO' : 'AVISO',
          archivo,
          i + 1,
          usaFuenteNoConfiable ? 'html-dinamico-entrada-externa' : 'html-dinamico',
          linea.trim().slice(0, 180)
        );
      }
    }

    if (/e\.parameter\.callback|parameter\s*&&\s*e\.parameter\.callback/.test(linea)) {
      agregar('AVISO', archivo, i + 1, 'jsonp-callback', 'Validar el nombre del callback con lista permitida o regex antes de concatenarlo.');
    }

    if (/Bearer\s+[A-Za-z0-9_\-]{20,}/.test(linea)) {
      agregar('CRITICO', archivo, i + 1, 'bearer-hardcoded', 'Token Bearer literal detectado.');
    }

    if (/target\s*=\s*["']_blank["']/i.test(linea) && !/rel\s*=\s*["'][^"']*noopener/i.test(linea)) {
      agregar('AVISO', archivo, i + 1, 'blank-sin-noopener', linea.trim().slice(0, 180));
    }

    if (/\bon[a-z]+\s*=\s*["']/i.test(linea) && path.extname(archivo).toLowerCase() === '.html') {
      agregar('AVISO', archivo, i + 1, 'evento-inline-html', linea.trim().slice(0, 180));
    }
  });
}

const criticos = hallazgos.filter(x => x.sev === 'CRITICO');
const altos = hallazgos.filter(x => x.sev === 'ALTO');
const avisos = hallazgos.filter(x => x.sev === 'AVISO');
console.log(`Auditoría LSPedia: ${criticos.length} críticos, ${altos.length} altos, ${avisos.length} avisos.`);
for (const h of hallazgos) console.log(`[${h.sev}] ${h.archivo}:${h.linea} ${h.regla} — ${h.detalle}`);

if (criticos.length) {
  console.error('\nLa auditoría falló porque existen hallazgos críticos.');
  process.exit(1);
}

console.log('\nSin hallazgos críticos. Los hallazgos altos/avisos quedan visibles para refactors seguros sin bloquear el despliegue.');
