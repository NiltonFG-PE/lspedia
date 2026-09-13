#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PALABRAS = ROOT / 'data' / 'palabras.json'
ADMIN = ROOT / 'admin' / 'busquedas.html'
SW = ROOT / 'sw.js'

NUEVAS = [
    {
        'id':'ser','palabra':'Ser','variantes':'Soy, Eres, Es, Somos, Son',
        'definicion':'Es un verbo que usamos para decir quién o qué es una persona o cosa, cómo es, de dónde es o qué profesión tiene. Ejemplo: Yo soy estudiante. Ella es amable. Ellos son peruanos.',
        'categoria':'Verbos','video':'','imagen':'','senasugerida':'','':'','fechapublicacion':'',
        'ingles':'To be','definicionIngles':'A verb used to say who or what a person or thing is, what they are like, where they are from, or what their profession is. Example: I am a student. She is kind.'
    },
    {
        'id':'ir','palabra':'Ir','variantes':'Voy, Vas, Va, Vamos, Van',
        'definicion':'Es un verbo que usamos para expresar movimiento de un lugar a otro. Ejemplo: Voy al trabajo. Ella va al mercado. Mañana iremos al hospital.',
        'categoria':'Verbos','video':'','imagen':'','senasugerida':'','':'','fechapublicacion':'',
        'ingles':'To go','definicionIngles':'A verb used to express movement from one place to another. Example: I go to work. She goes to the market.'
    },
    {
        'id':'estar','palabra':'Estar','variantes':'Estoy, Estás, Está, Estamos, Están',
        'definicion':'Es un verbo que usamos para indicar dónde se encuentra alguien o algo, o para hablar de un estado o situación que puede cambiar. Ejemplo: Estoy en casa. El vaso está en la mesa. Ella está cansada.',
        'categoria':'Verbos','video':'','imagen':'','senasugerida':'','':'','fechapublicacion':'',
        'ingles':'To be','definicionIngles':'A verb used to say where someone or something is, or to describe a state or situation that can change. Example: I am at home. She is tired.'
    },
    {
        'id':'haber','palabra':'Haber','variantes':'Hay, Había, Hubo, Ha, Han',
        'definicion':'Es un verbo que se usa de varias maneras. Con “hay” indica que algo existe o está presente. También ayuda a formar otros tiempos verbales. Ejemplo: Hay tres personas en la sala. Ella ha terminado su tarea.',
        'categoria':'Verbos','video':'','imagen':'','senasugerida':'','':'','fechapublicacion':'',
        'ingles':'To have / there is','definicionIngles':'A verb used in different ways. With “hay” it indicates that something exists or is present. It is also used to form compound verb tenses.'
    },
    {
        'id':'fue','palabra':'Fue','variantes':'',
        'definicion':'“Fue” es una forma verbal en pasado. Puede venir del verbo “ser” o del verbo “ir”; el significado depende del contexto. Ejemplo con ser: La reunión fue ayer. Ejemplo con ir: Ana fue al mercado.',
        'categoria':'Verbos','video':'','imagen':'','senasugerida':'','':'','fechapublicacion':'',
        'ingles':'Was / went','definicionIngles':'“Fue” is a Spanish past-tense verb form. Depending on context, it can come from “ser” (to be) or “ir” (to go).'
    },
    {
        'id':'articulo','palabra':'Artículo','variantes':'El, La, Los, Las, Un, Una, Unos, Unas',
        'definicion':'En gramática, un artículo es una palabra pequeña que acompaña a un sustantivo y ayuda a indicar de qué persona, animal, objeto o idea hablamos. Ejemplo: “el carro”, “la casa”, “una persona”, “unos libros”.',
        'categoria':'Educación','video':'','imagen':'','senasugerida':'','':'','fechapublicacion':'',
        'ingles':'Article','definicionIngles':'In grammar, an article is a small word used with a noun. Spanish articles include el, la, los, las, un, una, unos and unas.'
    },
    {
        'id':'pronombre','palabra':'Pronombre','variantes':'Yo, Tú, Él, Ella, Nosotros, Nosotras, Ustedes, Ellos, Ellas',
        'definicion':'En gramática, un pronombre es una palabra que puede reemplazar el nombre de una persona, animal o cosa para no repetirlo. Ejemplo: En vez de decir “Ana llegó. Ana está cansada”, podemos decir “Ana llegó. Ella está cansada”.',
        'categoria':'Educación','video':'','imagen':'','senasugerida':'','':'','fechapublicacion':'',
        'ingles':'Pronoun','definicionIngles':'In grammar, a pronoun is a word that can replace a person’s, animal’s or thing’s name so it does not have to be repeated.'
    },
    {
        'id':'preposicion','palabra':'Preposición','variantes':'A, Ante, Bajo, Con, Contra, De, Desde, En, Entre, Hacia, Hasta, Para, Por, Según, Sin, Sobre, Tras',
        'definicion':'En gramática, una preposición es una palabra que conecta otras palabras y ayuda a expresar relaciones como lugar, dirección, origen, compañía o propósito. Ejemplo: “Voy a casa”, “Vengo de Lima”, “Estoy con mi amigo”.',
        'categoria':'Educación','video':'','imagen':'','senasugerida':'','':'','fechapublicacion':'',
        'ingles':'Preposition','definicionIngles':'In grammar, a preposition connects words and can express relationships such as place, direction, origin, company or purpose.'
    },
    {
        'id':'conjuncion','palabra':'Conjunción','variantes':'Y, O, Pero, Porque, Aunque',
        'definicion':'En gramática, una conjunción es una palabra que une palabras, ideas u oraciones. Ejemplo: “pan y queso”, “té o café”, “quería salir, pero estaba lloviendo”.',
        'categoria':'Educación','video':'','imagen':'','senasugerida':'','':'','fechapublicacion':'',
        'ingles':'Conjunction','definicionIngles':'In grammar, a conjunction is a word that joins words, ideas or sentences. Examples include y, o, pero, porque and aunque.'
    }
]


def reemplazar(texto: str, viejo: str, nuevo: str, nombre: str) -> str:
    cuenta = texto.count(viejo)
    if cuenta != 1:
        raise SystemExit(f'{nombre}: se esperaba 1 coincidencia y se encontraron {cuenta}.')
    return texto.replace(viejo, nuevo, 1)


def actualizar_palabras() -> None:
    datos = json.loads(PALABRAS.read_text(encoding='utf-8'))
    if not isinstance(datos, list):
        raise SystemExit('palabras.json no es una lista.')
    existentes = {str(x.get('id','')).strip().casefold() for x in datos if isinstance(x,dict)}
    existentes_palabra = {str(x.get('palabra','')).strip().casefold() for x in datos if isinstance(x,dict)}
    agregadas = 0
    for fila in NUEVAS:
        if fila['id'].casefold() in existentes or fila['palabra'].casefold() in existentes_palabra:
            continue
        datos.append(fila)
        existentes.add(fila['id'].casefold())
        existentes_palabra.add(fila['palabra'].casefold())
        agregadas += 1
    PALABRAS.write_text(json.dumps(datos,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(f'Entradas gramaticales agregadas a palabras.json: {agregadas}.')


def actualizar_admin() -> None:
    t = ADMIN.read_text(encoding='utf-8')

    t = reemplazar(t,
        '.state{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;white-space:nowrap}.state-pending{background:#fff6dd;color:#805b00}.state-added{background:var(--greenbg);color:var(--green)}\n',
        '.state{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;white-space:nowrap}.state-pending{background:#fff6dd;color:#805b00}.state-added{background:var(--greenbg);color:var(--green)}\n    .review-cell{min-width:210px}.review-main{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.review-detail{font-size:10px;color:var(--muted);margin-top:4px;line-height:1.35;max-width:310px}.review-grammar{background:#eef2ff;color:#5145b5}.review-correction{background:#fff7ed;color:#9a4d08}.review-existing{background:var(--greenbg);color:var(--green)}.review-prediction{background:#eef8ff;color:#17658c}.review-missing{background:#fff1ef;color:#9f2d24}\n',
        'admin css')

    t = reemplazar(t,
        '<table class="table"><thead><tr><th>#</th><th>Palabra</th><th>Sección</th><th>Búsquedas</th><th>Última búsqueda</th><th>Estado</th><th></th></tr></thead><tbody id="searchTableBody"></tbody></table>',
        '<table class="table"><thead><tr><th>#</th><th>Palabra</th><th>Sección</th><th>Revisión automática</th><th>Búsquedas</th><th>Última búsqueda</th><th>Estado</th><th></th></tr></thead><tbody id="searchTableBody"></tbody></table>',
        'admin tabla')

    t = reemplazar(t,
        '<script>\n(function(){',
        '<script src="busquedas-diagnostico.js"></script>\n<script>\n(function(){',
        'admin script diagnostico')

    t = reemplazar(t,
        "const state={data:null,searchItems:[],popularItems:[],existing:new Set(),filter:'pending',query:'',tab:'busquedas'};",
        "const state={data:null,searchItems:[],popularItems:[],existing:new Set(),diagnostico:null,filter:'pending',query:'',tab:'busquedas'};",
        'admin state')

    viejo_load = '''  async function loadExistingWords(){\n    try{\n      const [a,b]=await Promise.all([\n        fetch('../data/palabras.json?_='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]),\n        fetch('../data/vocabulario.json?_='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[])\n      ]);\n      const all=[];\n      (Array.isArray(a)?a:[]).forEach(x=>{if(x&&x.palabra)all.push(normalize(x.palabra))});\n      (Array.isArray(b)?b:[]).forEach(x=>{if(x&&x.palabra)all.push(normalize(x.palabra))});\n      state.existing=new Set(all.filter(Boolean));\n    }catch(_e){state.existing=new Set()}\n  }\n'''
    nuevo_load = '''  async function loadExistingWords(){\n    try{\n      const marca=Date.now();\n      const [a,b,c]=await Promise.all([\n        fetch('../data/palabras.json?_='+marca,{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]),\n        fetch('../data/vocabulario.json?_='+marca,{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]),\n        fetch('../data/busqueda-ayudas.json?_='+marca,{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({}))\n      ]);\n      const all=[];\n      (Array.isArray(a)?a:[]).forEach(x=>{if(x&&x.palabra)all.push(normalize(x.palabra))});\n      (Array.isArray(b)?b:[]).forEach(x=>{if(x&&x.palabra)all.push(normalize(x.palabra))});\n      state.existing=new Set(all.filter(Boolean));\n      state.diagnostico=window.LSPediaDiagnosticoBusquedas\n        ? window.LSPediaDiagnosticoBusquedas.construirIndice(a,b,c)\n        : null;\n    }catch(_e){state.existing=new Set();state.diagnostico=null}\n  }\n\n  function revisarTermino(termino,seccion){\n    if(state.diagnostico&&window.LSPediaDiagnosticoBusquedas){\n      return window.LSPediaDiagnosticoBusquedas.analizar(state.diagnostico,termino,seccion);\n    }\n    const existe=state.existing.has(normalize(termino));\n    return {tipo:existe?'existente':'falta',etiqueta:existe?'Ya existe':'Falta agregar',sugerencia:existe?termino:'',detalle:'',resuelto:existe};\n  }\n\n  function revisionHtml(item){\n    const r=item.revision||revisarTermino(item.termino,item.seccion);\n    const cls=({gramatica:'review-grammar',correccion:'review-correction',existente:'review-existing',prediccion:'review-prediction',falta:'review-missing'})[r.tipo]||'review-missing';\n    const sugerencia=r.sugerencia?' → '+r.sugerencia:'';\n    return '<div class="review-cell"><div class="review-main"><span class="state '+cls+'">'+escapeHtml(r.etiqueta||'Revisar')+'</span><strong>'+escapeHtml(sugerencia)+'</strong></div>'+(r.detalle?'<div class="review-detail">'+escapeHtml(r.detalle)+'</div>':'')+'</div>';\n  }\n'''
    t = reemplazar(t,viejo_load,nuevo_load,'admin loadExistingWords')

    t = reemplazar(t,
        "      return !q||normalize(item.termino).includes(q);",
        "      return !q||normalize(item.termino).includes(q)||normalize(item.revision&&item.revision.sugerencia).includes(q)||normalize(item.revision&&item.revision.etiqueta).includes(q);",
        'admin filtro')

    viejo_tr = "      tr.innerHTML='<td class=\"muted\">'+(i+1)+'</td><td><strong>'+escapeHtml(item.termino)+'</strong></td><td><span class=\"state\">'+escapeHtml(item.seccion||'—')+'</span></td><td><strong>'+fmt(item.busquedas)+'</strong></td><td>'+escapeHtml(gaDate(item.ultimaFecha))+'</td><td><span class=\"state '+(item.added?'state-added':'state-pending')+'\">'+(item.added?'✓ Ya está':'● Pendiente')+'</span></td><td><button class=\"copy-btn\" type=\"button\" data-copy=\"'+encodeURIComponent(item.termino)+'\">Copiar</button></td>';"
    nuevo_tr = "      tr.innerHTML='<td class=\"muted\">'+(i+1)+'</td><td><strong>'+escapeHtml(item.termino)+'</strong></td><td><span class=\"state\">'+escapeHtml(item.seccion||'—')+'</span></td><td>'+revisionHtml(item)+'</td><td><strong>'+fmt(item.busquedas)+'</strong></td><td>'+escapeHtml(gaDate(item.ultimaFecha))+'</td><td><span class=\"state '+(item.added?'state-added':'state-pending')+'\">'+(item.added?'✓ Resuelta':'● Pendiente')+'</span></td><td><button class=\"copy-btn\" type=\"button\" data-copy=\"'+encodeURIComponent(item.termino)+'\">Copiar</button></td>';"
    t = reemplazar(t,viejo_tr,nuevo_tr,'admin fila')

    viejo_pop = '''    const rows=(Array.isArray(fuente.items)?fuente.items:[]).map(x=>({\n      termino:String(x.termino||'').trim(),\n      seccion:String(x.seccion||'').trim(),\n      busquedas:n(x.busquedas),\n      ultimaFecha:String(x.ultimaFecha||''),\n      added:state.existing.has(normalize(x.termino))\n    }));'''
    nuevo_pop = '''    const rows=(Array.isArray(fuente.items)?fuente.items:[]).map(x=>{\n      const termino=String(x.termino||'').trim(),seccion=String(x.seccion||'').trim();\n      const revision=revisarTermino(termino,seccion);\n      return {termino,seccion,busquedas:n(x.busquedas),ultimaFecha:String(x.ultimaFecha||''),added:!!revision.resuelto,revision};\n    });'''
    if t.count(viejo_pop) != 2:
        raise SystemExit(f'admin map: se esperaban 2 coincidencias y se encontraron {t.count(viejo_pop)}.')
    t = t.replace(viejo_pop,nuevo_pop,2)

    t = reemplazar(t,
        "      meta:x=>(x.seccion?x.seccion+' · ':'')+(x.added?'Disponible en LSPedia':'Sin resultado / por revisar')+(x.ultimaFecha?' · '+gaDate(x.ultimaFecha):'')",
        "      meta:x=>(x.seccion?x.seccion+' · ':'')+((x.revision&&x.revision.etiqueta)|| (x.added?'Disponible en LSPedia':'Sin resultado / por revisar'))+(x.revision&&x.revision.sugerencia?' → '+x.revision.sugerencia:'')+(x.ultimaFecha?' · '+gaDate(x.ultimaFecha):'')",
        'admin popular meta')

    viejo_csv = "    const lines=[['N','Palabra buscada','Seccion','Busquedas','Ultima busqueda','Estado'].map(quote).join(',')];\n    rows.forEach((x,i)=>lines.push([i+1,x.termino,x.seccion||'',x.busquedas,gaDate(x.ultimaFecha),x.added?'Ya esta en LSPedia':'Pendiente'].map(quote).join(',')));"
    nuevo_csv = "    const lines=[['N','Palabra buscada','Seccion','Revision automatica','Sugerencia','Busquedas','Ultima busqueda','Estado'].map(quote).join(',')];\n    rows.forEach((x,i)=>lines.push([i+1,x.termino,x.seccion||'',x.revision&&x.revision.etiqueta||'',x.revision&&x.revision.sugerencia||'',x.busquedas,gaDate(x.ultimaFecha),x.added?'Resuelta':'Pendiente'].map(quote).join(',')));"
    t = reemplazar(t,viejo_csv,nuevo_csv,'admin csv')

    ADMIN.write_text(t,encoding='utf-8',newline='\n')


def actualizar_sw() -> None:
    t=SW.read_text(encoding='utf-8')
    t=reemplazar(t,'const VERSION_APP = "v105";','const VERSION_APP = "v106";','sw version')
    t=reemplazar(t,
        '    if (url.pathname.includes("/data/palabras.json")) return;',
        '    if (url.pathname.includes("/data/palabras.json") || url.pathname.includes("/data/busqueda-ayudas.json")) return;',
        'sw json no-store')
    SW.write_text(t,encoding='utf-8',newline='\n')


if __name__ == '__main__':
    actualizar_palabras()
    actualizar_admin()
    actualizar_sw()
    print('Diagnóstico educativo, gramática y alias aplicados.')
