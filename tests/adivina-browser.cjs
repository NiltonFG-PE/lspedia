/* npm run test:adivina-browser — real images, isolated new game, no external services. */
const assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,...(process.env.LSPEDIA_TEST_CHROMIUM?{executablePath:process.env.LSPEDIA_TEST_CHROMIUM}:{}),args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/juegos/adivina-que-soy.html');
  await page.waitForFunction(()=>!document.getElementById('start').disabled);
  assert.match(await page.locator('#total').innerText(),/133/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('[data-deck="vocabulario"]').click();await page.selectOption('#category','Colores');
  assert.match(await page.locator('#total').innerText(),/15/);
  await page.locator('#start').click();await page.locator('#begin').waitFor({state:'visible'});
  await page.clock.install();await page.locator('#begin').click();await page.clock.runFor(3100);
  assert.equal(await page.locator('#card-category').innerText(),'Colores');
  assert.ok(await page.locator('#card-image').evaluate(i=>i.complete&&i.naturalWidth>0));
  const firstColor=await page.locator('#card').evaluate(e=>getComputedStyle(e).backgroundColor);
  assert.ok(await page.locator('#card-word').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=40));
  await page.locator('#correct').click();await page.clock.runFor(900);assert.notEqual(await page.locator('#card').evaluate(e=>getComputedStyle(e).backgroundColor),firstColor);assert.equal(await page.locator('#score').innerText(),'✓ 1');
  await page.locator('#pass').click();await page.clock.runFor(900);
  await page.locator('#pause').click();const time=await page.locator('#time').innerText();await page.clock.runFor(15000);assert.equal(await page.locator('#time').innerText(),time);
  await page.locator('#resume').click();await page.clock.runFor(61000);await page.locator('#results').waitFor({state:'visible'});
  assert.equal(await page.locator('#final-correct').innerText(),'1');assert.equal(await page.locator('#final-pass').innerText(),'1');
  console.log('PASS: mobile vocabulary category, real images, correct/pass, pause freezes timer, timeout results');
  await page.locator('#menu').click();await page.locator('[data-deck="Animales"]').click();await page.locator('[data-seconds="0"]').click();await page.locator('#start').click();await page.locator('#begin').click();await page.clock.runFor(3100);
  await page.setViewportSize({width:844,height:390});
  for(let i=0;i<6;i++){assert.ok(await page.locator('#card-image').evaluate(i=>i.naturalWidth>0));await page.locator('#correct').click();await page.clock.runFor(900);}
  assert.equal(await page.locator('#final-correct').innerText(),'6');assert.match(await page.locator('#end-reason').innerText(),/todas/);
  assert.equal(new Set(await page.locator('.review-item').allTextContents()).size,6);
  console.log('PASS: landscape, unlimited round, six unique animal illustrations, deck exhaustion');
  await page.locator('#menu').click();await page.locator('#motion').click();await page.clock.runFor(4100);assert.match(await page.locator('#sensor-status').innerText(),/No llegan datos/);
  // Send orientation readings as a real device would; verify gate through the UI.
  await page.locator('#motion').click();
  async function sensor(beta,gamma=0){await page.evaluate(({beta,gamma})=>{const e=new Event('deviceorientation');Object.defineProperties(e,{beta:{value:beta},gamma:{value:gamma}});window.dispatchEvent(e);},{beta,gamma});}
  await sensor(90);await page.locator('#start').click();await page.locator('#begin').click();await page.clock.runFor(3100);
  await sensor(90);await page.clock.runFor(350);await sensor(90);await sensor(140);await page.clock.runFor(200);await sensor(140);
  // Return to center while feedback is still visible; do not lose this movement.
  await sensor(90);await page.clock.runFor(110);await sensor(90);await page.clock.runFor(600);
  assert.equal(await page.locator('#score').innerText(),'✓ 1');
  await sensor(120);await page.clock.runFor(110);await sensor(120);await page.clock.runFor(700);assert.equal(await page.locator('#score').innerText(),'✓ 2');
  await sensor(120);await page.clock.runFor(500);await sensor(120);assert.equal(await page.locator('#score').innerText(),'✓ 2');
  await sensor(0,90);await page.clock.runFor(350);await sensor(0,90);await sensor(0,40);await page.clock.runFor(200);await sensor(0,40);await page.clock.runFor(900);
  await page.locator('#pause').click();await page.locator('#finish').click();assert.equal(await page.locator('#final-pass').innerText(),'1');
  console.log('PASS: missing sensor fallback, simulated down/up, duplicate tilt rejected, both orientations');
  await page.goBack();await page.locator('#home').waitFor({state:'visible'});
  assert.equal(await page.locator('#results').isVisible(),false);
  await page.locator('#start').click();await page.locator('#begin').click();await page.goBack();
  await page.locator('#home').waitFor({state:'visible'});await page.clock.runFor(5000);
  assert.equal(await page.locator('#countdown').isVisible(),false);assert.equal(await page.locator('#play').isVisible(),false);
  await page.locator('#start').click();await page.locator('#begin').click();await page.clock.runFor(3100);await page.locator('#pause').click();
  await page.goBack();await page.locator('#home').waitFor({state:'visible'});assert.equal(await page.locator('#pause-dialog').isVisible(),false);
  await page.goForward();assert.equal(await page.locator('#play').isVisible(),false);
  console.log('PASS: card colors, larger word, quick neutral during feedback, Back to menu cancels countdown/paused round, Forward cannot revive timer');
  await context.close();
  const failed=await browser.newContext({viewport:{width:360,height:740}}),p=await failed.newPage();
  await p.route('**/data/vocabulario.json',r=>r.abort());
  await p.goto(base+'/juegos/adivina-que-soy.html');await p.waitForFunction(()=>!document.getElementById('start').disabled);assert.match(await p.locator('#notice').innerText(),/No se pudo cargar Vocabulario/);assert.match(await p.locator('#total').innerText(),/14/);
  await p.route('**/img/adivina/*.svg',r=>r.abort());await p.locator('#start').click();await p.waitForFunction(()=>document.getElementById('notice').textContent.includes('No pudimos cargar'));assert.equal(await p.locator('#play').isVisible(),false);
  await p.unroute('**/img/adivina/*.svg');await p.locator('#start').click();await p.locator('#begin').waitFor({state:'visible'});
  console.log('PASS: vocabulary network failure, no blank image round, image retry recovers');
  await p.goBack();await p.locator('#home').waitFor({state:'visible'});
  await failed.close();
  const loadingContext=await browser.newContext(), q=await loadingContext.newPage();
  await q.goto(base+'/juegos/adivina-que-soy.html');await q.waitForFunction(()=>!document.getElementById('start').disabled);
  await q.locator('[data-deck="vocabulario"]').click();
  let unblock;const blocked=new Promise(r=>unblock=r);
  await q.route('**/img/vocabulario/**',async r=>{await blocked;await r.continue();});
  await q.locator('#start').click();await q.goBack();await q.locator('#home').waitFor({state:'visible'});unblock();
  await q.waitForTimeout(300);assert.equal(await q.locator('#ready').isVisible(),false);
  await loadingContext.close();assert.deepEqual(errors,[]);
  console.log('PASS: Back cancels pending preparation; late images never reopen game');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
