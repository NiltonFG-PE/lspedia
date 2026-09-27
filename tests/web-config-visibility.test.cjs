const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/web-config-v27.js'), 'utf8');
function harness() {
  const elements = new Map();
  for (const selector of ['#seccionNosotros', '#bloqueEjemplos', '#senalDelDia', '#panelProgresoPersonal', '.stats-header', '.stats-panel-destacado']) {
    const classes = new Set();
    elements.set(selector, {style:{display:''}, classList:{
      add(c){classes.add(c);}, remove(c){classes.delete(c);}, contains(c){return classes.has(c);},
      toggle(c,on){if(on)classes.add(c);else classes.delete(c);}
    },querySelector(){return null;},querySelectorAll(){return [];}});
  }
  const window = {};
  const document = {readyState:'loading',addEventListener(){},
    querySelector(s){return elements.get(s)||null;},
    querySelectorAll(s){return s.split(',').map(x=>elements.get(x)).filter(Boolean);}};
  vm.runInNewContext(source.replace('function boot(){', 'window.applyVisibility = c => { CFG=c; inicio(); about(); };\nfunction boot(){'), {window,document});
  return {elements, apply:window.applyVisibility};
}
test('WEB configuration preserves hidden sections and homepage blocks after navigation', () => {
  const h=harness();
  h.elements.get('#seccionNosotros').classList.add('d-none');
  h.elements.get('#panelProgresoPersonal').classList.add('d-none');
  for(const [s,e] of h.elements) if(!['#seccionNosotros','#panelProgresoPersonal'].includes(s)) e.style.display='none';
  for(let i=0;i<6;i++)h.apply({nosotros:{visible:true},heroes:{diccionario:{}}});
  assert.ok(h.elements.get('#seccionNosotros').classList.contains('d-none'));
  assert.ok(h.elements.get('#panelProgresoPersonal').classList.contains('d-none'));
  for(const [s,e] of h.elements) if(!['#seccionNosotros','#panelProgresoPersonal'].includes(s))assert.equal(e.style.display,'none',s);
});
test('panel visibility is independent of navigation and can be toggled without revealing another view', () => {
  const h=harness();
  const about=h.elements.get('#seccionNosotros');
  about.classList.add('d-none');
  h.apply({nosotros:{visible:false},heroes:{diccionario:{mostrarEstadisticas:false}}});
  assert.ok(about.classList.contains('lsp-web-config-hidden'));
  assert.ok(h.elements.get('.stats-panel-destacado').classList.contains('lsp-web-config-hidden'));
  // Navigation can select the section without defeating the disabled setting.
  about.classList.remove('d-none');
  assert.ok(about.classList.contains('lsp-web-config-hidden'));
  h.apply({nosotros:{visible:true},heroes:{diccionario:{mostrarEstadisticas:true}}});
  assert.ok(!about.classList.contains('lsp-web-config-hidden'));
  assert.ok(!about.classList.contains('d-none'));
  about.classList.add('d-none');
  h.apply({nosotros:{visible:true}});
  assert.ok(about.classList.contains('d-none'));
  assert.match(source,/\.lsp-web-config-hidden\{display:none!important\}/);
});
