#!/usr/bin/env python3
from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent

js = ROOT / 'js' / 'mejoras-producto.js'
s = js.read_text(encoding='utf-8')
patron = re.compile(r'''    function asegurarInicio\(\)\{.*?\n    function escapeHtml\(v\)\{''', re.S)
nuevo = r'''    function leerResumenProgreso(){
        try{
            const p=JSON.parse(localStorage.getItem(CLAVE_PROGRESO)||'null');
            const items=(p&&Array.isArray(p.items)?p.items:[])
                .filter(x=>x&&x.fuente==='diccionario'&&x.referencia&&x.palabra)
                .sort((a,b)=>(Number(b.ultimaVez)||0)-(Number(a.ultimaVez)||0));
            return {cantidad:items.length,ultima:items[0]||null};
        }catch(_e){return {cantidad:0,ultima:null};}
    }

    function asegurarInicio(){
        const hero=$('filaHeroPrincipal'); if(!hero) return null;
        let sec=$('lspMejorasInicio');
        if(sec) return sec;
        sec=document.createElement('section');
        sec.id='lspMejorasInicio';
        sec.setAttribute('aria-label','Aprender y descubrir palabras');
        sec.innerHTML='<div class="lsp-mejoras-grid">'+
          '<article class="lsp-mejora-card lsp-aprendizaje-unificado" id="lspModoCard"><div class="lsp-mejora-head"><h2 class="lsp-mejora-titulo"><span class="lsp-mejora-icono">📘</span>Tu aprendizaje</h2></div><p class="lsp-mejora-sub">Recorre el Diccionario palabra por palabra cuando tú quieras.</p><div class="lsp-aprender-estado" id="lspModoEstado"></div><button class="lsp-aprender-btn" id="lspModoBtn" type="button">Empezar a aprender</button><div class="lsp-aprender-meta" id="lspModoMeta">Tú decides cuándo entrar. Tu avance se guarda solo en este dispositivo.</div></article>'+
          '<article class="lsp-mejora-card" id="lspNuevasCard"><div class="lsp-mejora-head"><h2 class="lsp-mejora-titulo"><span class="lsp-mejora-icono">✨</span>Nuevas palabras</h2></div><p class="lsp-mejora-sub">Descubre palabras publicadas recientemente en el Diccionario.</p><div class="lsp-nuevas-lista" id="lspNuevasLista"><span class="lsp-mejora-sub">Cargando…</span></div></article>'+
          '</div>';
        hero.insertAdjacentElement('afterend',sec);
        $('lspModoBtn').onclick=iniciarOContinuar;
        return sec;
    }
    function actualizarTarjetaModo(){
        const btn=$('lspModoBtn'),meta=$('lspModoMeta'),estado=$('lspModoEstado');
        if(!btn||!meta)return;
        const modo=leerModo(),lista=listaAprender(),progreso=leerResumenProgreso();
        if(!lista.length){
            btn.disabled=true;
            btn.textContent='Sin palabras disponibles';
            if(estado) estado.innerHTML='<strong>Aún no hay palabras disponibles.</strong>';
            return;
        }
        btn.disabled=false;
        btn.textContent=modo.iniciado?'Continuar aprendiendo':'Empezar a aprender';
        if(estado){
            const cantidad=progreso.cantidad;
            const base=cantidad===0
                ? '<strong>Aún no has empezado.</strong><span>Entra cuando quieras.</span>'
                : '<strong>Has explorado '+cantidad+' '+(cantidad===1?'palabra':'palabras')+'.</strong>'+(progreso.ultima?'<span>Última palabra: '+escapeHtml(texto(progreso.ultima.palabra))+'</span>':'');
            const paso=modo.iniciado?'<span>Modo Aprender: '+Math.min((Number(modo.indice)||0)+1,lista.length)+' de '+lista.length+'.</span>':'';
            estado.innerHTML=base+paso;
        }
        meta.textContent='Tú decides cuándo entrar. Tu avance se guarda solo en este dispositivo.';
    }
    function renderNuevas(){
        const caja=$('lspNuevasLista');if(!caja)return;
        const actuales=datosDiccionario();
        const publicadas=nuevas.map(x=>{
            const p=actuales.find(y=>refPalabra(y)===texto(x.id))||actuales.find(y=>texto(y.palabra).toLocaleLowerCase('es-PE')===texto(x.palabra).toLocaleLowerCase('es-PE'));
            return p?{registro:x,palabra:p}:null;
        }).filter(Boolean);
        if(!publicadas.length){
            caja.innerHTML='<span class="lsp-mejora-sub">Las próximas palabras publicadas aparecerán aquí.</span>';
            return;
        }
        caja.innerHTML=publicadas.slice(0,8).map((x,i)=>'<button type="button" class="lsp-nueva-palabra" data-nueva="'+i+'"><span class="lsp-nueva-badge">NUEVA</span><span class="lsp-nueva-nombre">'+escapeHtml(texto(x.palabra.palabra))+'</span><span class="lsp-nueva-cat">'+escapeHtml(texto(x.palabra.categoria)||'Diccionario')+'</span></button>').join('');
        caja.querySelectorAll('[data-nueva]').forEach(btn=>btn.onclick=()=>{
            const x=publicadas[Number(btn.dataset.nueva)]; if(!x||!x.palabra)return;
            if(typeof window.mostrarPalabra==='function'){window.mostrarPalabra(x.palabra);window.scrollTo({top:0,behavior:'smooth'});}
        });
    }
    function escapeHtml(v){'''

s2, n = patron.subn(nuevo, s, count=1)
if n != 1:
    raise SystemExit('No se encontró el bloque de Modo Aprender/Nuevas palabras esperado')
js.write_text(s2, encoding='utf-8', newline='\n')

css = ROOT / 'css' / 'mejoras-producto.css'
c = css.read_text(encoding='utf-8')
marca = '/* Aprendizaje unificado: reemplaza la tarjeta separada Tu progreso. */'
if marca not in c:
    c += '''\n\n/* Aprendizaje unificado: reemplaza la tarjeta separada Tu progreso. */\n#panelProgresoPersonal{display:none!important}\n.lsp-aprender-estado{display:flex;flex-direction:column;gap:3px;margin:-2px 0 12px;padding:10px 12px;background:#f7fbff;border:1px solid #dcecf8;border-radius:12px;color:#52657a;font-size:.76rem;line-height:1.4}\n.lsp-aprender-estado strong{color:#17324f;font-family:'Poppins',sans-serif;font-size:.86rem;font-weight:800}\n.lsp-aprender-estado span{display:block}\n.lsp-aprendizaje-unificado .lsp-aprender-btn{margin-top:1px}\n@media(max-width:767.98px){.lsp-aprendizaje-unificado .lsp-mejora-sub{margin-bottom:9px}.lsp-aprender-estado{margin-bottom:11px}}\n'''
css.write_text(c, encoding='utf-8', newline='\n')

generador = ROOT / 'scripts' / 'actualizar_nuevas_palabras.py'
generador.write_text('''#!/usr/bin/env python3
"""Genera data/nuevas-palabras.json con palabras realmente publicadas.

Una palabra se considera publicada cuando tiene video. La fecha usada es
el commit en el que pasó de no publicable (sin video o inexistente) a
publicable. Así los borradores no aparecen como "Nuevas palabras".
"""
from __future__ import annotations

import datetime as dt
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "palabras.json"
DESTINO = ROOT / "data" / "nuevas-palabras.json"
MAX_COMMITS = 120
MAX_ITEMS = 12


def normal(v: object) -> str:
    return str(v or "").strip().casefold()


def cargar_texto_git(spec: str) -> list[dict]:
    try:
        r = subprocess.run(["git", "show", spec], cwd=ROOT, text=True, capture_output=True, check=True)
        data = json.loads(r.stdout)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def clave(item: dict) -> str:
    ident = str(item.get("id") or "").strip()
    return "id:" + ident if ident else "p:" + normal(item.get("palabra"))


def publicable(item: dict | None) -> bool:
    if not isinstance(item, dict):
        return False
    return bool(str(item.get("palabra") or "").strip() and str(item.get("video") or "").strip())


def mapa(items: list[dict]) -> dict[str, dict]:
    return {clave(x): x for x in items if isinstance(x, dict) and x.get("palabra")}


def main() -> int:
    actual = json.loads(DATA.read_text(encoding="utf-8"))
    if not isinstance(actual, list):
        raise SystemExit("palabras.json debe ser una lista")

    por_clave = {k: x for k, x in mapa(actual).items() if publicable(x)}

    log = subprocess.run(
        ["git", "log", f"-n{MAX_COMMITS}", "--format=%H|%cI", "--", "data/palabras.json"],
        cwd=ROOT, text=True, capture_output=True, check=False,
    ).stdout.splitlines()

    detectadas: dict[str, str] = {}
    for linea in log:
        if "|" not in linea:
            continue
        sha, fecha = linea.split("|", 1)
        ahora = mapa(cargar_texto_git(f"{sha}:data/palabras.json"))
        antes = mapa(cargar_texto_git(f"{sha}^:data/palabras.json"))

        for k in por_clave:
            if k in detectadas:
                continue
            if publicable(ahora.get(k)) and not publicable(antes.get(k)):
                detectadas[k] = fecha

    items = []
    for k, fecha in sorted(detectadas.items(), key=lambda par: par[1], reverse=True):
        item = por_clave.get(k)
        if not item:
            continue
        items.append({
            "id": str(item.get("id") or "").strip(),
            "palabra": str(item.get("palabra") or "").strip(),
            "categoria": str(item.get("categoria") or "").strip(),
            "fecha": fecha,
        })
        if len(items) >= MAX_ITEMS:
            break

    salida = {
        "generadoEn": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "metodo": "historial-git-publicacion-video",
        "items": items,
    }
    DESTINO.write_text(json.dumps(salida, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8", newline="\\n")
    print(f"✅ Nuevas palabras publicadas: {len(items)} elemento(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
''', encoding='utf-8', newline='\n')

sw = ROOT / 'sw.js'
t = sw.read_text(encoding='utf-8')
if 'const VERSION_APP = "v66";' in t:
    t = t.replace('const VERSION_APP = "v66";', 'const VERSION_APP = "v67";', 1)
elif 'const VERSION_APP = "v67";' not in t:
    raise SystemExit('Versión inesperada de sw.js')
sw.write_text(t, encoding='utf-8', newline='\n')

subprocess.run(['python', 'scripts/actualizar_nuevas_palabras.py'], cwd=ROOT, check=True)

# El parche es temporal: se elimina a sí mismo para no quedar en el repositorio.
Path(__file__).unlink()
