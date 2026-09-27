const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/lspedia-core.js'), 'utf8');
function harness(code = source) {
  let observer, queue = [];
  class Element {
    constructor(attrs = {}, children = []) {this.tagName = 'A'; this.attrs = {...attrs}; this.children = children;}
    getAttribute(k) {return this.attrs[k] ?? null;}
    hasAttribute(k) {return k in this.attrs;}
    setAttribute(k,v) {this.attrs[k] = v; if(observer) queue.push({type:'attributes',target:this,addedNodes:[]});}
    removeAttribute(k) {delete this.attrs[k]; if(observer) queue.push({type:'attributes',target:this,addedNodes:[]});}
    querySelectorAll() {return this.children;}
  }
  const root = new Element(); root.tagName = 'HTML';
  const context = {window:{}, document:{readyState:'loading',addEventListener(){},documentElement:root},location:{hostname:'localhost',protocol:'http:',href:'http://localhost/',origin:'http://localhost'},URL,Element,console:{warn(){}},MutationObserver:class{constructor(cb){this.cb=cb;} observe(){observer=this.cb;}}};
  context.window.MutationObserver = context.MutationObserver;
  vm.runInNewContext(code.replace('  const api = Object.freeze({','  window.startSecurity = vigilarUrlsPeligrosas;\n  const api = Object.freeze({'), context);
  context.window.startSecurity();
  function drain() {let turns = 0; while(queue.length && turns++ < 30) {const batch=queue;queue=[];observer(batch);} return {turns,pending:queue.length};}
  return {Element,drain,add(el){queue.push({type:'childList',addedNodes:[el]});}};
}
test('panel social links settle; observer does not starve page startup', () => {
  const h=harness();
  const cfg=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/web-config.json'),'utf8'));
  for(const url of Object.values(cfg.social).filter(v => typeof v === 'string')) {
    const a=new h.Element({href:url,target:'_blank',rel:'nofollow'}); h.add(a);
    assert.equal(h.drain().pending,0);
    assert.match(a.getAttribute('rel'), /nofollow noopener noreferrer/);
    a.setAttribute('href',url); // Reapply WEB / external-link update.
    assert.equal(h.drain().pending,0);
  }
});
test('regression fixture reproduces the old infinite loop', () => {
  const h=harness(source.replace("if (el.getAttribute('rel') !== seguro) el.setAttribute('rel', seguro);", "el.setAttribute('rel', seguro);"));
  h.add(new h.Element({href:'https://example.com',target:'_blank'}));
  assert.ok(h.drain().pending > 0);
});
test('dangerous URLs are still removed from dynamic links', () => {
  const h=harness(), a=new h.Element({href:'javascript:alert(1)',target:'_blank'});
  h.add(a); assert.equal(h.drain().pending,0); assert.equal(a.hasAttribute('href'),false);
  a.setAttribute('href','data:text/html,unsafe'); assert.equal(h.drain().pending,0); assert.equal(a.hasAttribute('href'),false);
});
