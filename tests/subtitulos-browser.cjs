const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://lspedia.test/**',route=>{const p=decodeURIComponent(new URL(route.request().url()).pathname);const file=path.join(root,p);if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});return route.fulfill({status:404,body:''});});
 await page.goto('https://lspedia.test/empty');
 const section=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<section id="seccionSubtitulos"[\s\S]*?<\/section>/)[0].replace('class="d-none"','class=""');
 await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><main class="container py-3">'+section+'</main>');
 const bootstrap=process.env.LSPEDIA_BOOTSTRAP_CSS||require.resolve('bootstrap/dist/css/bootstrap.min.css');
 await page.addStyleTag({path:bootstrap});
 for(const file of ['css/quiz.css','css/subtitulos.css','css/modo-oscuro-herramientas.css'])await page.addStyleTag({path:path.join(root,file)});
 await page.evaluate(()=>{window.engines=[];window.SpeechRecognition=class{constructor(){window.engines.push(this);}start(){this.onstart?.();}abort(){this.aborted=true;}};});
 await page.addScriptTag({path:path.join(root,'js/subtitulos.js')});await page.evaluate(()=>SubtitulosV2.iniciar());
 for(const width of [390,320,1280]){
 await page.setViewportSize({width,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow at '+width);
 assert.equal(await page.locator('#btnSubtitulosIniciar').isVisible(),true);
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/subtitulos-mobile.png',fullPage:true,animations:'disabled'});
 await page.locator('#btnSubtitulosIniciar').click();assert.equal(await page.locator('#subtitulosEnVivo').isVisible(),true);
 await page.evaluate(()=>engines[0].onresult({resultIndex:0,results:[Object.assign([{transcript:'Hola, bienvenidos a LSPedia.'}],{isFinal:true}),Object.assign([{transcript:'Seguimos conversando'}],{isFinal:false})]}));
 assert.match(await page.locator('#subtitulosTexto').innerText(),/Hola, bienvenidos/);
 await page.locator('#btnSubtitulosPausar').click();assert.match(await page.locator('#subtitulosEstadoMotor').innerText(),/Pausado/);
 await page.locator('#btnSubtitulosPausar').click();assert.equal(await page.evaluate(()=>engines.length),2);
 await page.locator('#btnSubtitulosTextoMas').click();assert.match(await page.locator('#subtitulosTexto').getAttribute('class'),/tam-lg/);
 await page.screenshot({path:'/tmp/subtitulos-live.png',fullPage:true,animations:'disabled'});
 await page.locator('#btnSubtitulosBorrar').click();assert.doesNotMatch(await page.locator('#subtitulosTexto').innerText(),/bienvenidos/);
 await page.locator('#btnSubtitulosDetener').click();assert.equal(await page.locator('#subtitulosIntro').isVisible(),true);
 await page.evaluate(()=>document.documentElement.dataset.lspTema='dark');await page.screenshot({path:'/tmp/subtitulos-dark.png',fullPage:true,animations:'disabled'});
 assert.deepEqual(errors,[]);console.log('PASS: 320/390/1280 layout, start, recognition rendering, pause/resume, text size, clear, stop, dark theme, no JS errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
