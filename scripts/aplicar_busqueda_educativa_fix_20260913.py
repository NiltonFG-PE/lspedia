#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import importlib.util

ROOT=Path(__file__).resolve().parent.parent
ADMIN=ROOT/'admin'/'busquedas.html'
BASE=ROOT/'scripts'/'aplicar_busqueda_educativa_20260913.py'

spec=importlib.util.spec_from_file_location('base_busqueda_educativa',BASE)
base=importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(base)


def rep(t,v,n,nombre):
    c=t.count(v)
    if c!=1:
        raise SystemExit(f'{nombre}: se esperaba 1 coincidencia y se encontraron {c}.')
    return t.replace(v,n,1)


def actualizar_admin():
    t=ADMIN.read_text(encoding='utf-8')
    t=rep(t,
      '.state{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;white-space:nowrap}.state-pending{background:#fff6dd;color:#805b00}.state-added{background:var(--greenbg);color:var(--green)}\n',
      '.state{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;white-space:nowrap}.state-pending{background:#fff6dd;color:#805b00}.state-added{background:var(--greenbg);color:var(--green)}\n    .review-cell{min-width:210px}.review-main{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.review-detail{font-size:10px;color:var(--muted);margin-top:4px;line-height:1.35;max-width:310px}.review-grammar{background:#eef2ff;color:#5145b5}.review-correction{background:#fff7ed;color:#9a4d08}.review-existing{background:var(--greenbg);color:var(--green)}.review-prediction{background:#eef8ff;color:#17658c}.review-missing{background:#fff1ef;color:#9f2d24}\n',
      'css')
    t=rep(t,
      '<table class="table"><thead><tr><th>#</th><th>Palabra</th><th>Sección</th><th>Búsquedas</th><th>Última búsqueda</th><th>Estado</th><th></th></tr></thead><tbody id="searchTableBody"></tbody></table>',
      '<table class="table"><thead><tr><th>#</th><th>Palabra</th><th>Sección</th><th>Revisión automática</th><th>Búsquedas</th><th>Última búsqueda</th><th>Estado</th><th></th></tr></thead><tbody id="searchTableBody"></tbody></table>',
      'tabla')
    t=rep(t,'<script>\n(function(){','<script src="busquedas-diagnostico.js"></script>\n<script>\n(function(){','script externo')
    t=rep(t,
      "const state={data:null,searchItems:[],popularItems:[],existing:new Set(),filter:'pending',query:'',tab:'busquedas'};",
      "const state={data:null,searchItems:[],popularItems:[],existing:new Set(),diagnostico:null,filter:'pending',query:'',tab:'busquedas'};",
      'state')

    old='''  async function loadExistingWords(){\n    try{\n      const [a,b]=await Promise.all([\n        fetch('../data/palabras.json?_='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]),\n        fetch('../data/vocabulario.json?_='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[])\n      ]);\n      const all=[];\n      (Array.isArray(a)?a:[]).forEach(x=>{if(x&&x.palabra)all.push(normalize(x.palabra))});\n      (Array.isArray(b)?b:[]).forEach(x=>{if(x&&x.palabra)all.push(normalize(x.palabra))});\n      state.existing=new Set(all.filter(Boolean));\n    }catch(_e){state.existing=new Set()}\n  }\n'''
    new='''  async function loadExistingWords(){\n    try{\n      const marca=Date.now();\n      const [a,b,c]=await Promise.all([\n        fetch('../data/palabras.json?_='+marca,{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]),\n        fetch('../data/vocabulario.json?_='+marca,{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]),\n        fetch('../data/busqueda-ayudas.json?_='+marca,{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({}))\n      ]);\n      const all=[];\n      (Array.isArray(a)?a:[]).forEach(x=>{if(x&&x.palabra)all.push(normalize(x.palabra))});\n      (Array.isArray(b)?b:[]).forEach(x=>{if(x&&x.palabra)all.push(normalize(x.palabra))});\n      state.existing=new Set(all.filter(Boolean));\n      state.diagnostico=window.LSPediaDiagnosticoBusquedas?window.LSPediaDiagnosticoBusquedas.construirIndice(a,b,c):null;\n    }catch(_e){state.existing=new Set();state.diagnostico=null}\n  }\n\n  function revisarTermino(termino,seccion){\n    if(state.diagnostico&&window.LSPediaDiagnosticoBusquedas)return window.LSPediaDiagnosticoBusquedas.analizar(state.diagnostico,termino,seccion);\n    const existe=state.existing.has(normalize(termino));\n    return {tipo:existe?'existente':'falta',etiqueta:existe?'Ya existe':'Falta agregar',sugerencia:existe?termino:'',detalle:'',resuelto:existe};\n  }\n  function revisionHtml(item){\n    const r=item.revision||revisarTermino(item.termino,item.seccion);\n    const cls=({gramatica:'review-grammar',correccion:'review-correction',existente:'review-existing',prediccion:'review-prediction',falta:'review-missing'})[r.tipo]||'review-missing';\n    const sugerencia=r.sugerencia?' → '+r.sugerencia:'';\n    return '<div class="review-cell"><div class="review-main"><span class="state '+cls+'">'+escapeHtml(r.etiqueta||'Revisar')+'</span><strong>'+escapeHtml(sugerencia)+'</strong></div>'+(r.detalle?'<div class="review-detail">'+escapeHtml(r.detalle)+'</div>':'')+'</div>';\n  }\n'''
    t=rep(t,old,new,'loadExistingWords')
    t=rep(t,"      return !q||normalize(item.termino).includes(q);","      return !q||normalize(item.termino).includes(q)||normalize(item.revision&&item.revision.sugerencia).includes(q)||normalize(item.revision&&item.revision.etiqueta).includes(q);",'filtro')

    oldrow="      tr.innerHTML='<td class=\"muted\">'+(i+1)+'</td><td><strong>'+escapeHtml(item.termino)+'</strong></td><td><span class=\"state\">'+escapeHtml(item.seccion||'—')+'</span></td><td><strong>'+fmt(item.busquedas)+'</strong></td><td>'+escapeHtml(gaDate(item.ultimaFecha))+'</td><td><span class=\"state '+(item.added?'state-added':'state-pending')+'\">'+(item.added?'✓ Ya está':'● Pendiente')+'</span></td><td><button class=\"copy-btn\" type=\"button\" data-copy=\"'+encodeURIComponent(item.termino)+'\">Copiar</button></td>';"
    newrow="      tr.innerHTML='<td class=\"muted\">'+(i+1)+'</td><td><strong>'+escapeHtml(item.termino)+'</strong></td><td><span class=\"state\">'+escapeHtml(item.seccion||'—')+'</span></td><td>'+revisionHtml(item)+'</td><td><strong>'+fmt(item.busquedas)+'</strong></td><td>'+escapeHtml(gaDate(item.ultimaFecha))+'</td><td><span class=\"state '+(item.added?'state-added':'state-pending')+'\">'+(item.added?'✓ Resuelta':'● Pendiente')+'</span></td><td><button class=\"copy-btn\" type=\"button\" data-copy=\"'+encodeURIComponent(item.termino)+'\">Copiar</button></td>';"
    t=rep(t,oldrow,newrow,'fila')

    oldpop='''    const rows=(Array.isArray(fuente.items)?fuente.items:[]).map(x=>({\n      termino:String(x.termino||'').trim(),\n      seccion:String(x.seccion||'').trim(),\n      busquedas:n(x.busquedas),\n      ultimaFecha:String(x.ultimaFecha||''),\n      added:state.existing.has(normalize(x.termino))\n    }));'''
    newpop='''    const rows=(Array.isArray(fuente.items)?fuente.items:[]).map(x=>{\n      const termino=String(x.termino||'').trim(),seccion=String(x.seccion||'').trim();\n      const revision=revisarTermino(termino,seccion);\n      return {termino,seccion,busquedas:n(x.busquedas),ultimaFecha:String(x.ultimaFecha||''),added:!!revision.resuelto,revision};\n    });'''
    t=rep(t,oldpop,newpop,'map popular')

    oldsearch='''    state.searchItems=(Array.isArray(fuente.items)?fuente.items:[]).map(x=>({\n      termino:String(x.termino||'').trim(),\n      seccion:String(x.seccion||'').trim(),\n      busquedas:n(x.busquedas),\n      ultimaFecha:String(x.ultimaFecha||''),\n      added:state.existing.has(normalize(x.termino))\n    }));'''
    newsearch='''    state.searchItems=(Array.isArray(fuente.items)?fuente.items:[]).map(x=>{\n      const termino=String(x.termino||'').trim(),seccion=String(x.seccion||'').trim();\n      const revision=revisarTermino(termino,seccion);\n      return {termino,seccion,busquedas:n(x.busquedas),ultimaFecha:String(x.ultimaFecha||''),added:!!revision.resuelto,revision};\n    });'''
    t=rep(t,oldsearch,newsearch,'map sin resultado')

    t=rep(t,"      meta:x=>(x.seccion?x.seccion+' · ':'')+(x.added?'Disponible en LSPedia':'Sin resultado / por revisar')+(x.ultimaFecha?' · '+gaDate(x.ultimaFecha):'')","      meta:x=>(x.seccion?x.seccion+' · ':'')+((x.revision&&x.revision.etiqueta)||(x.added?'Disponible en LSPedia':'Sin resultado / por revisar'))+(x.revision&&x.revision.sugerencia?' → '+x.revision.sugerencia:'')+(x.ultimaFecha?' · '+gaDate(x.ultimaFecha):'')",'meta popular')
    t=rep(t,
      "    const lines=[['N','Palabra buscada','Seccion','Busquedas','Ultima busqueda','Estado'].map(quote).join(',')];\n    rows.forEach((x,i)=>lines.push([i+1,x.termino,x.seccion||'',x.busquedas,gaDate(x.ultimaFecha),x.added?'Ya esta en LSPedia':'Pendiente'].map(quote).join(',')));",
      "    const lines=[['N','Palabra buscada','Seccion','Revision automatica','Sugerencia','Busquedas','Ultima busqueda','Estado'].map(quote).join(',')];\n    rows.forEach((x,i)=>lines.push([i+1,x.termino,x.seccion||'',x.revision&&x.revision.etiqueta||'',x.revision&&x.revision.sugerencia||'',x.busquedas,gaDate(x.ultimaFecha),x.added?'Resuelta':'Pendiente'].map(quote).join(',')));",
      'csv')
    ADMIN.write_text(t,encoding='utf-8',newline='\n')


if __name__=='__main__':
    base.actualizar_palabras()
    actualizar_admin()
    base.actualizar_sw()
    print('Parche corregido aplicado.')
