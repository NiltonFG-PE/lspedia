/* npm run test:browser — página real, servicios externos aislados. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const tipos = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp'};
const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if(fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if(!file.startsWith(root + path.sep) || !fs.existsSync(file)) {res.writeHead(404); res.end(); return;}
    res.setHeader('Content-Type', tipos[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
});

(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${server.address().port}`;
    let launch = {headless:true};
    if(process.env.LSPEDIA_TEST_CHROMIUM) launch = {...launch, executablePath:process.env.LSPEDIA_TEST_CHROMIUM, args:['--no-sandbox']};
    const browser = await chromium.launch(launch);
    try {
        async function pagina(options = {}) {
            const context = await browser.newContext({serviceWorkers:'block', viewport:{width:1440,height:1000}, ...options});
            await context.route('**/*', async route => {
                const url = route.request().url();
                if(url.startsWith(base)) return route.continue();
                if(url.includes('bootstrap@') && url.endsWith('bootstrap.bundle.min.js')) return route.fulfill({path:path.join(root,'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'),contentType:'text/javascript'});
                if(url.includes('bootstrap@') && url.endsWith('bootstrap.min.css')) return route.fulfill({path:path.join(root,'node_modules/bootstrap/dist/css/bootstrap.min.css'),contentType:'text/css'});
                return route.abort();
            });
            const page = await context.newPage();
            page.on('pageerror', e => errores.push(e.message));
            return {context, page};
        }
        const errores = [];
        let {context, page} = await pagina();
        let liberar;
        const bloqueo = new Promise(r => {liberar = r;});
        await page.route('**/data/vocabulario.json*', async route => {await bloqueo; await route.continue();});
        await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo');
        await page.locator('#buscar').fill('BARATO');
        await page.waitForFunction(() => document.getElementById('sugerencias').textContent.includes('Buscando también'));
        assert.doesNotMatch(await page.locator('#sugerencias').innerText(), /Felicitaciones/);
        await page.locator('#buscar').press('Enter');
        liberar();
        await page.waitForFunction(() => document.getElementById('resultado').textContent.includes('Barato'));
        assert.match(await page.locator('#resultado').innerText(), /Vocabulario/);
        console.log('PASS: BARATO + Enter durante carga lenta');
        for(const q of ['barato', 'Barato', 'BARATO']) {
            await page.locator('#buscar').fill(q);
            await page.waitForFunction(() => !!document.getElementById('btnIrVocabularioBusqueda'));
            assert.match(await page.locator('#sugerencias').innerText(), /Barato/);
        }
        await page.locator('#buscar').fill('felicidades');
        assert.match(await page.locator('#sugerencias').innerText(), /Felicitaciones/);
        await page.locator('#buscar').fill('adioz');
        await page.waitForFunction(() => document.getElementById('sugerencias').textContent.includes('Adiós'));
        await page.locator('#buscar').fill('zzzzzzzzzzzzzz');
        assert.match(await page.locator('#sugerencias').innerText(), /Sugerir esta palabra/);
        await page.locator('#btnLimpiarBuscar').click();
        assert.equal(await page.locator('#buscar').inputValue(), '');
        console.log('PASS: variantes, ortografía, palabra ausente y limpiar');
        // Fixture de colisión: exacta de Vocabulario frente a variante del Diccionario.
        await page.evaluate(() => App.datos.push({id:'economico-prueba',palabra:'Económico',variantes:'barato',categoria:'Prueba',definicion:'Prueba',imagen:'img/favicon.png'}));
        await page.locator('#buscar').fill('barato');
        await page.locator('#btnBuscar').click();
        assert.match(await page.locator('#resultado').innerText(), /Vocabulario/);
        console.log('PASS: exacta en Vocabulario gana a variante en Diccionario');
        await context.close();

        ({context, page} = await pagina());
        let fallo = true;
        await page.route('**/data/vocabulario.json*', route => fallo ? route.fulfill({status:404,body:'No disponible'}) : route.continue());
        await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo' && window.LSPediaVocabularioPublico?.estado() === 'error');
        await page.locator('#buscar').fill('barato');
        assert.match(await page.locator('#sugerencias').innerText(), /Reintentar/);
        fallo = false;
        await page.locator('#reintentarBusqueda').click();
        await page.waitForFunction(() => !!document.getElementById('btnIrVocabularioBusqueda'));
        console.log('PASS: fallo de red y recuperación');
        await context.close();

        ({context, page} = await pagina({viewport:{width:390,height:844},isMobile:true,hasTouch:true}));
        await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.LSPediaVocabularioPublico?.listo() && window.__LSPEDIA_BUSCADOR_MOVIL_OVERLAY__ && window.App?.estadoDatos === 'listo');
        await page.locator('#buscar').fill('b');
        const item = page.locator('#sugerencias button').first();
        await item.waitFor({state:'visible'});
        const antes = page.url();
        await item.dispatchEvent('pointerdown', {pointerId:1,pointerType:'touch',clientX:100,clientY:300,bubbles:true});
        await item.dispatchEvent('pointermove', {pointerId:1,pointerType:'touch',clientX:100,clientY:200,bubbles:true});
        await item.dispatchEvent('pointerup', {pointerId:1,pointerType:'touch',clientX:100,clientY:200,bubbles:true});
        await page.waitForTimeout(100);
        assert.equal(page.url(), antes, 'Deslizar no debe abrir una palabra');
        await item.tap();
        await page.waitForFunction(() => new URL(location.href).searchParams.has('p'));
        console.log('PASS: deslizar y tocar en móvil son acciones distintas');
        await context.close();

        // Experiencia EN: navegación, buscadores y Vocabulario deben cambiar
        // de idioma sin recargar, y volver limpiamente a ES.
        ({context, page} = await pagina());
        await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() =>
            window.App?.estadoDatos === 'listo'
            && window.LSPediaVocabularioPublico?.listo()
            && document.querySelector('.lspedia-idioma-btn[data-idioma="en"]')
        );
        await page.locator('.lspedia-idioma-btn[data-idioma="en"]').click();
        await page.waitForFunction(() => document.documentElement.lang === 'en');
        assert.equal(await page.locator('#buscar').getAttribute('placeholder'), 'Search a Spanish word or type in English');
        assert.match(await page.locator('nav.navbar').innerText(), /Vocabulary/i);

        await page.locator('#btnCategorias').click();
        await page.waitForFunction(() => /Colors/.test(document.getElementById('panelCategorias')?.innerText || ''));
        const cardColors = page.locator('#panelCategorias .categoria-card').filter({hasText:'Colors'}).first();
        await cardColors.click();
        await page.waitForFunction(() => /Yellow/.test(document.getElementById('resultadoCategorias')?.innerText || ''));
        assert.match(await page.locator('#resultadoCategorias').innerText(), /Category:\s*Colors/i);
        assert.match(await page.locator('#resultadoCategorias').innerText(), /Yellow/);

        await page.locator('.lspedia-idioma-btn[data-idioma="es"]').click();
        await page.waitForFunction(() => document.documentElement.lang === 'es');
        assert.equal(await page.locator('#buscar').getAttribute('placeholder'), 'Buscar palabra y significado');
        console.log('PASS: experiencia ES/EN completa en interfaz y Vocabulario');
        await context.close();

        assert.deepEqual(errores, [], 'Errores JavaScript en la página');
    } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode=1;}).finally(() => server.close());
