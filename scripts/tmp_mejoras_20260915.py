#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(texto: str, viejo: str, nuevo: str, nombre: str) -> str:
    n = texto.count(viejo)
    if n != 1:
        raise RuntimeError(f"{nombre}: esperaba 1 coincidencia y encontré {n}")
    return texto.replace(viejo, nuevo, 1)


# 1) Estadísticas públicas: Vocabulario ya viene filtrado por la regla pública
# de palabra + categoría + imagen. No volver a exigir video al contarlo.
ruta_script = ROOT / "js" / "script.js"
s = ruta_script.read_text(encoding="utf-8")
viejo_stats = '''    const palabrasVocabulario = bancoHoja2
        .filter(p => p.palabra && p.video && p.video.trim() !== "")
        .map(p => normalizar(p.palabra));'''
nuevo_stats = '''    const palabrasVocabulario = bancoHoja2
        .filter(p => p && p.palabra && p.categoria)
        .map(p => normalizar(p.palabra));'''
if viejo_stats in s:
    s = replace_once(s, viejo_stats, nuevo_stats, "estadísticas Vocabulario")
elif nuevo_stats not in s:
    raise RuntimeError("script.js: no se encontró ni la regla antigua ni la nueva de estadísticas")
ruta_script.write_text(s, encoding="utf-8")


# 2) Admin Analytics: Apps Script puede tardar en despertar. Cada intento espera
# hasta 45 s y la conexión se reintenta automáticamente 3 veces. Si ya había
# datos visibles, no se ocultan mientras se actualiza.
ruta_admin = ROOT / "admin" / "busquedas.html"
a = ruta_admin.read_text(encoding="utf-8")

if "function requestJsonpUnaVez(apiUrl,key,period)" not in a:
    a = replace_once(
        a,
        "  function requestJsonp(apiUrl,key,period){",
        "  function requestJsonpUnaVez(apiUrl,key,period){",
        "renombrar JSONP de un intento",
    )

if "Apps Script no respondió en 30 segundos." in a:
    a = replace_once(
        a,
        "Apps Script no respondió en 30 segundos.",
        "Apps Script no respondió en 45 segundos.",
        "mensaje timeout Analytics",
    )

# Cambia solo el temporizador JSONP asociado al mensaje anterior.
patron_timeout = re.compile(
    r"timer=setTimeout\(\(\)=>\{if\(done\)return;done=true;cleanup\(\);reject\(new Error\('Apps Script no respondió en 45 segundos\.'\)\)\},30000\);"
)
a, n_timeout = patron_timeout.subn(
    "timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Apps Script no respondió en 45 segundos.'))},45000);",
    a,
    count=1,
)
if n_timeout == 0 and "45000);" not in a:
    raise RuntimeError("admin/busquedas.html: no se pudo ampliar timeout JSONP a 45 s")

wrapper = '''
  function esperarConexion(ms){
    return new Promise(resolve=>setTimeout(resolve,ms));
  }

  async function requestJsonp(apiUrl,key,period){
    const pausas=[0,1800,3500];
    let ultimoError=null;
    for(let intento=0;intento<pausas.length;intento++){
      if(intento>0){
        if(el.status)el.status.textContent=`Reintentando conexión… ${intento+1}/3`;
        await esperarConexion(pausas[intento]);
      }
      try{
        return await requestJsonpUnaVez(apiUrl,key,period);
      }catch(error){
        ultimoError=error;
        console.warn(`[LSPedia Admin] intento ${intento+1}/3 falló:`,error);
      }
    }
    throw ultimoError||new Error('No se pudo conectar con Apps Script después de varios intentos.');
  }

'''
if "async function requestJsonp(apiUrl,key,period)" not in a:
    ancla = "  function setLoading(on){"
    if ancla not in a:
        raise RuntimeError("admin/busquedas.html: no se encontró ancla setLoading")
    a = a.replace(ancla, wrapper + ancla, 1)

viejo_loading = "    el.dashboard.classList.toggle('d-none',on||!state.data);"
nuevo_loading = "    el.dashboard.classList.toggle('d-none',!state.data);"
if viejo_loading in a:
    a = replace_once(a, viejo_loading, nuevo_loading, "conservar dashboard durante actualización")
elif nuevo_loading not in a:
    raise RuntimeError("admin/busquedas.html: no se encontró regla de visibilidad del dashboard")

ruta_admin.write_text(a, encoding="utf-8")


# 3) Bump de caché para que instalaciones PWA reciban script.js actualizado.
ruta_sw = ROOT / "sw.js"
sw = ruta_sw.read_text(encoding="utf-8")
m = re.search(r'const VERSION_APP = "v(\d+)";', sw)
if not m:
    raise RuntimeError("sw.js: no se encontró VERSION_APP")
actual = int(m.group(1))
# Solo incrementar una vez para esta migración. Si un cambio paralelo ya lo hizo,
# no forzamos un número concreto: basta con que el shell tenga una versión nueva.
if actual <= 130:
    sw = sw[:m.start()] + f'const VERSION_APP = "v{actual + 1}";' + sw[m.end():]
ruta_sw.write_text(sw, encoding="utf-8")

print("OK: estadísticas, Analytics resiliente y versión PWA actualizados")
