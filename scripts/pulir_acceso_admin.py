from pathlib import Path

p = Path('admin/busquedas.html')
s = p.read_text(encoding='utf-8')

old = '''    saveAccess(api,key);
    setLoading(true);'''
new = '''    setLoading(true);'''
if old in s:
    s = s.replace(old, new, 1)

old = '''      state.data=data;
      el.periodHeading.textContent='Resumen · '+periodLabel(period).toLowerCase();'''
new = '''      saveAccess(api,key);
      state.data=data;
      el.periodHeading.textContent='Resumen · '+periodLabel(period).toLowerCase();'''
if old not in s:
    raise SystemExit('No se encontró el punto de guardado posterior a validación.')
s = s.replace(old, new, 1)

old = '''    <p class="footer-note">Analytics es de solo lectura. La clave de administrador no se guarda de forma permanente: permanece únicamente en esta pestaña. Los errores técnicos de LSPedia se envían como conteos agregados y no incluyen el texto escrito por las personas.</p>'''
new = '''    <p class="footer-note">Analytics es de solo lectura. La clave permanece solo durante la pestaña, salvo que elijas “Recordar acceso en este dispositivo”; en ese caso queda guardada localmente en ese navegador hasta que pulses “Olvidar acceso”. Úsalo únicamente en un dispositivo personal. Los errores técnicos se muestran como conteos agregados.</p>'''
if old not in s:
    raise SystemExit('No se encontró el texto de privacidad del pie.')
s = s.replace(old, new, 1)

p.write_text(s.rstrip() + '\n', encoding='utf-8')
print('Acceso Admin pulido.')
