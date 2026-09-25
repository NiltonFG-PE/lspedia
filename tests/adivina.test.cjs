const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../js/adivina-core.js');
test('Vocabulario: empty pictures excluded, duplicates normalized, categories preserved',()=>{
 const v=C.cards([{palabra:'León',imagen:'img/leon.svg',categoria:'Animales'},{palabra:' LEÓN ',imagen:'img/otro.svg'},{palabra:'Sin imagen'},{palabra:'Médica',imagen:'img/medica.svg',categoria:'Profesiones'}],'vocabulario');
 assert.equal(v.length,2);assert.equal(C.select(v,'vocabulario','Animales').length,1);assert.equal(C.select(v,'Profesiones')[0].word,'Médica');
 const extras=C.cards([{palabra:'leon',imagen:'img/extra.svg',categoria:'Animales'}],'extra');
 assert.equal(C.select([...v,...extras],'todos').length,2);
});
test('screen normal works with portrait and both landscape rotations',()=>{
 assert.ok(Math.abs(C.screenZ(90,0))<.01);assert.ok(Math.abs(C.screenZ(0,90))<.01);assert.ok(Math.abs(C.screenZ(0,-90))<.01);
 assert.ok(C.screenZ(140,0)<-.57);assert.ok(C.screenZ(180,40)<-.57);assert.ok(C.screenZ(180,-40)<-.57);
 assert.ok(C.screenZ(40,0)>.57);assert.ok(C.screenZ(0,40)>.57);assert.ok(C.screenZ(0,-40)>.57);
 assert.equal(C.screenZ(null,0),null);assert.equal(C.screenZ(0,NaN),null);
});
test('no accidental point before neutral, no duplicate while held, jitter ignored',()=>{
 const g=C.tiltGate();assert.equal(g.update(-.9,0),null);assert.equal(g.update(-.9,500),null);
 g.update(0,600);g.update(0,910);g.update(-.8,1000);assert.equal(g.update(-.8,1190),'correct');
 assert.equal(g.update(-.8,1800),null);assert.equal(g.update(.9,2200),null);
 g.update(0,2300);g.update(0,2650);g.update(.8,2700);g.update(.3,2790);assert.equal(g.update(.8,2850),null);assert.equal(g.update(.8,3040),'pass');
 g.reset();assert.equal(g.update(-.9,3600),null);
});
test('shuffle preserves every card without mutating input',()=>{const source=[1,2,3,4,5];const result=C.shuffle(source,()=>.2);assert.deepEqual([...result].sort(),source);assert.notDeepEqual(result,source);});

test('quick return during feedback rearms without consuming an answer',()=>{
 const g=C.tiltGate();g.update(0,0);g.update(0,100);g.update(-.5,110);
 assert.equal(g.update(-.5,210),'correct');
 g.reset();g.update(.15,240,false);g.update(.15,340,false);
 assert.equal(g.update(-.5,400,false),null);
 assert.equal(g.update(-.5,900),null);
 assert.equal(g.update(-.5,1000),'correct');
 assert.equal(g.update(-.5,1500),null);
});
