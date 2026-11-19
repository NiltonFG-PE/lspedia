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
            const context = await browser.newContext({serviceWorkers:'block', locale:'es-PE', viewport:{width:1440,height:1000}, ...options});
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
        await page.goto(base + '/?vista=diccionario', {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo');
        await page.locator('#buscar').fill('BARATO');
        await page.waitForFunction(() => document.getElementById('sugerencias').textContent.includes('Buscando también'));
        assert.doesNotMatch(await page.locator('#sugerencias').innerText(), /Felicitaciones/);
        await page.locator('#buscar').press('Enter');
        liberar();
        await page.waitForFunction(() => document.getElementById('resultado').textContent.includes('Barato'));
        assert.match(await page.locator('#resultado').innerText(), /Vocabulario/);
        console.log('PASS: BARATO + Enter durante carga lenta');

        // Enlace compartido/directo de Vocabulario: debe abrir la ficha exacta
        // al cargar la página, sin depender de interacción ni del Quiz.
        await context.close();
        ({context, page} = await pagina());
        await page.goto(base + '/?vista=vocabulario&p=como-preguntas&fuente=vocabulario', {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() =>
            window.LSPediaVocabularioPublico?.listo()
            && /¿Cómo\?/.test(document.getElementById('resultadoCategorias')?.innerText || '')
            && /Vocabulario/.test(document.getElementById('resultadoCategorias')?.innerText || '')
        );
        // No basta con que aparezca un instante: cargas asíncronas posteriores
        // no deben volver a la pantalla madre ni borrar la ficha compartida.
        await page.waitForTimeout(4000);
        assert.match(await page.locator('#resultadoCategorias').innerText(), /¿Cómo\?/);
        assert.match(await page.locator('#resultadoCategorias').innerText(), /Vocabulario/);
        console.log('PASS: enlace directo como-preguntas permanece abierto tras cargas tardías');
        await context.close();

        ({context, page} = await pagina());
        await page.goto(base + '/?vista=diccionario', {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo' && window.LSPediaVocabularioPublico?.listo());
        // Las palabras interrogativas/exclamativas se guardan con signos
        // visibles (p. ej. "¿Cómo?"), pero el usuario normalmente escribe
        // "Cómo". Debe ganar la coincidencia exacta de Vocabulario frente a
        // coincidencias semánticas del Diccionario.
        await page.locator('#buscar').fill('Cómo');
        await page.waitForFunction(() => document.getElementById('sugerencias').textContent.includes('¿Cómo?'));
        assert.match(await page.locator('#sugerencias').innerText(), /Vocabulario/);
        assert.doesNotMatch(await page.locator('#sugerencias').innerText(), /Tesis/);
        console.log('PASS: Cómo encuentra ¿Cómo? exacto en Vocabulario');

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
        await page.goto(base + '/?vista=diccionario', {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo' && window.LSPediaVocabularioPublico?.estado() === 'error');
        await page.locator('#buscar').fill('barato');
        assert.match(await page.locator('#sugerencias').innerText(), /Reintentar/);
        fallo = false;
        await page.locator('#reintentarBusqueda').click();
        await page.waitForFunction(() => !!document.getElementById('btnIrVocabularioBusqueda'));
        console.log('PASS: fallo de red y recuperación');
        await context.close();

        ({context, page} = await pagina({viewport:{width:390,height:844},isMobile:true,hasTouch:true}));
        await page.goto(base + '/?vista=diccionario', {waitUntil:'domcontentloaded'});
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
        await page.goto(base + '/?vista=diccionario', {waitUntil:'domcontentloaded'});
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


        // Vocabulario es la página de inicio; Diccionario tiene su propia URL.
        ({context, page} = await pagina());
        await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo' && window.LSPediaVocabularioPublico?.listo());
        await page.waitForFunction(() => document.body.classList.contains('vista-temas-movil'));
        assert.match(await page.locator('#btnCategorias').getAttribute('class'), /active/);
        assert.doesNotMatch(await page.locator('#btnInicio').getAttribute('class'), /active/);
        const ordenMenu = await page.locator('nav.navbar .nav-link').allInnerTexts();
        assert.match(ordenMenu[0], /Vocabulario/i);
        assert.match(ordenMenu[1], /Diccionario/i);
        assert.match(ordenMenu.join(' '), /Recursos/i);
        assert.doesNotMatch(ordenMenu.join(' '), /Herramientas/i);
        assert.equal(await page.locator('#bloqueBuscadorCategorias').isVisible(), true);
        assert.equal(await page.locator('#bloqueBuscador').isVisible(), false);
        assert.equal(await page.locator('#lspCreador').isVisible(), false);
        assert.equal(await page.locator('.stats-panel-destacado').isVisible(), true, 'Estadísticas deben verse en el inicio');
        assert.equal(await page.locator('#senalDelDia').isVisible(), true, 'Descubre debe verse en Vocabulario');
        await page.waitForFunction(() => /(Vocabulario|Diccionario) ·/.test(document.getElementById('categoriaDelDia')?.textContent || ''));
        const cajaDescubre = await page.locator('#senalDelDia').boundingBox();
        const cajaTitulo = await page.locator('#tituloPrincipal').boundingBox();
        assert.ok(cajaDescubre.x + cajaDescubre.width <= cajaTitulo.x + 2, 'Descubre va a la izquierda del título en pantallas anchas');
        assert.equal(new URL(page.url()).search, '');
        console.log('PASS: Vocabulario es la página de inicio con Descubre y Estadísticas');

        // Diccionario: sin Descubre ni Estadísticas (son de Inicio) y se abre desde arriba, con el título a la vista.
        await page.waitForSelector('#lspNuevasCard', {state:'visible', timeout:15000});
        await page.evaluate(() => window.scrollTo(0, 600));
        await page.locator('#btnInicio').click();
        await page.waitForFunction(() => /diccionario/.test(location.search));
        await page.waitForTimeout(600);
        assert.equal(await page.locator('#senalDelDia').isVisible(), false, 'Descubre no va en Diccionario');
        assert.equal(await page.locator('.stats-header').isVisible(), false, 'Estadísticas no van en Diccionario');
        assert.equal(await page.locator('.stats-panel-destacado').isVisible(), false, 'Estadísticas no van en Diccionario');
        assert.ok(await page.evaluate(() => window.scrollY) < 5, 'Diccionario se abre desde arriba');
        assert.ok((await page.locator('#bloqueTituloPrincipal').boundingBox()).y >= 0, 'El título de Diccionario queda a la vista');
        await page.locator('#btnCategorias').click();
        await page.waitForFunction(() => document.body.classList.contains('vista-temas-movil'));
        assert.equal(await page.locator('#senalDelDia').isVisible(), true, 'Descubre vuelve en Vocabulario');
        assert.equal(await page.locator('.stats-panel-destacado').isVisible(), true, 'Estadísticas vuelven en Vocabulario');
        console.log('PASS: Diccionario sin Descubre/Estadísticas y desde arriba');

        // Orden de la página de inicio: encabezado → colaborador → buscador → Lo nuevo → categorías → estadísticas → Mi LSPedia.
        await page.waitForSelector('#lspNuevasCard', {state:'visible', timeout:15000});
        const orden = ['#filaHeroPrincipal', '#lspModeloLinguistico', '#bloqueBuscadorCategorias', '#lspNuevasCard', '#panelCategorias', '.stats-panel-destacado', '#miLspediaHub'];
        const tops = [];
        for (const sel of orden) {
            const caja = await page.locator(sel).first().boundingBox();
            assert.ok(caja, sel + ' debe verse en la página de inicio');
            tops.push(Math.round(caja.y + await page.evaluate(() => window.scrollY)));
        }
        for (let i = 1; i < tops.length; i++) {
            assert.ok(tops[i] > tops[i - 1], orden[i] + ' debe ir debajo de ' + orden[i - 1] + ' (' + tops.join(', ') + ')');
        }
        console.log('PASS: orden del inicio: buscador → Lo nuevo → categorías → estadísticas → Mi LSPedia');

        // Al abrir una categoría ya no es la pantalla de inicio: Lo nuevo se oculta y vuelve con «Vocabulario».
        await page.locator('#panelCategorias > div > *').first().click();
        await page.waitForFunction(() => getComputedStyle(document.getElementById('lspMejorasInicio')).display === 'none');
        await page.locator('#btnCategorias').click();
        await page.waitForFunction(() => getComputedStyle(document.getElementById('lspMejorasInicio')).display !== 'none');
        console.log('PASS: Lo nuevo se oculta al abrir una categoría y vuelve al regresar al inicio');

        await page.locator('#btnInicio').click();
        await page.waitForFunction(() => !document.body.classList.contains('vista-temas-movil'));
        assert.equal(new URL(page.url()).search, '?vista=diccionario');
        assert.equal(await page.locator('#bloqueBuscador').isVisible(), true);
        assert.equal(await page.locator('#lspCreador').isVisible(), true);
        const textoCreador = await page.locator('#lspCreador').innerText();
        assert.match(textoCreador, /Nilton Fernández G\./);
        assert.match(textoCreador, /Intérprete y traductor de LSP/);
        assert.match(textoCreador, /Creador audiovisual y web no-code/);
        assert.doesNotMatch(textoCreador, /Creador de LSPedia/);
        assert.doesNotMatch(textoCreador, /Soy el creador|CREADOR/, 'La tarjeta solo lleva nombre y roles');
        const cajaCreador = await page.locator('#lspCreador').boundingBox();
        const cajaBuscador = await page.locator('#bloqueBuscador').boundingBox();
        assert.ok(cajaCreador.y + cajaCreador.height <= cajaBuscador.y + 2, 'La tarjeta del creador va encima del buscador');
        assert.equal(await page.locator('#lspModeloLinguistico').isVisible(), false);
        assert.equal(await page.locator('#lspNuevasCard').isVisible(), false, 'Lo nuevo es exclusivo del inicio: no va en Diccionario');
        await page.reload({waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo');
        assert.equal(await page.locator('#bloqueBuscador').isVisible(), true, 'Recargar en Diccionario debe quedarse en Diccionario');
        assert.match(await page.locator('#btnInicio').getAttribute('class'), /active/);
        await page.waitForTimeout(1500);
        assert.equal(await page.locator('#lspNuevasCard').isVisible(), false, 'Lo nuevo tampoco aparece al recargar Diccionario');
        assert.equal(await page.locator('#lspReservaInicio').isVisible(), false, 'El hueco reservado de Lo nuevo no se ve en Diccionario');
        console.log('PASS: Diccionario con su URL y tarjeta del creador; recargar no cambia de vista');

        await page.goBack();
        await page.waitForFunction(() => document.body.classList.contains('vista-temas-movil'));
        assert.equal(await page.locator('#bloqueBuscadorCategorias').isVisible(), true);
        console.log('PASS: Atrás vuelve al inicio (Vocabulario)');
        await context.close();

        // Descubre alterna palabras de Vocabulario y Diccionario; «Ver» abre la ficha en su sección.
        ({context, page} = await pagina());
        await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo' && window.LSPediaVocabularioPublico?.listo()
            && /(Vocabulario|Diccionario) ·/.test(document.getElementById('categoriaDelDia')?.textContent || ''));
        const fuenteDescubre = () => page.evaluate(() => /^Vocabulario/.test(document.getElementById('categoriaDelDia').textContent) ? 'vocabulario' : 'diccionario');
        const fuenteHoy = await fuenteDescubre();
        await page.locator('#btnSenalAnterior').click();
        const fuenteAyer = await fuenteDescubre();
        assert.notEqual(fuenteHoy, fuenteAyer, 'Hoy y ayer deben ser de fuentes distintas');
        assert.notEqual((await page.locator('#descripcionDelDia').innerText()).trim(), '', 'Descubre siempre lleva una descripción');
        await page.locator('#btnVerDelDia').click();
        if (fuenteAyer === 'vocabulario') {
            await page.waitForFunction(() => /fuente=vocabulario/.test(location.search));
            await page.waitForFunction(() => document.body.classList.contains('vista-temas-movil') && (document.getElementById('resultadoCategorias')?.innerText || '').length > 20);
        } else {
            await page.waitForFunction(() => /[?&]p=/.test(location.search) && !/fuente=vocabulario/.test(location.search));
            await page.waitForFunction(() => !document.body.classList.contains('vista-temas-movil') && (document.getElementById('resultado')?.innerText || '').length > 20);
        }
        await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo' && window.LSPediaVocabularioPublico?.listo()
            && /(Vocabulario|Diccionario) ·/.test(document.getElementById('categoriaDelDia')?.textContent || ''));
        await page.locator('#btnVerDelDia').click();
        if (fuenteHoy === 'vocabulario') {
            await page.waitForFunction(() => /fuente=vocabulario/.test(location.search));
        } else {
            await page.waitForFunction(() => /[?&]p=/.test(location.search) && !/fuente=vocabulario/.test(location.search));
        }
        console.log('PASS: Descubre mezcla Vocabulario y Diccionario y abre cada ficha en su sección');
        await context.close();

        // Tarjeta del creador en inglés.
        ({context, page} = await pagina());
        await page.goto(base + '/?vista=diccionario', {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo' && document.querySelector('.lspedia-idioma-btn[data-idioma="en"]'));
        await page.locator('.lspedia-idioma-btn[data-idioma="en"]').click();
        await page.waitForFunction(() => /translator/.test(document.getElementById('lspCreador')?.innerText || ''));
        assert.match(await page.locator('#lspCreador').innerText(), /LSP interpreter and translator/);
        assert.match(await page.locator('#lspCreador').innerText(), /Audiovisual and no-code web creator/);
        console.log('PASS: tarjeta del creador traducida al inglés');
        await context.close();

        // Botón flotante (web): solo apoyar con una donación y las redes sociales.
        ({context, page} = await pagina());
        await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo');
        await page.locator('#btnToggleAccesos').click();
        await page.waitForFunction(() => document.getElementById('fabMenuAccesos').classList.contains('fab-menu-abierto'));
        assert.equal(await page.locator('#fabMenuLista .fab-item').count(), 5, 'Apoyar + 4 redes, nada más');
        assert.equal(await page.locator('#btnAccesoApoyar').isVisible(), true);
        for (const id of ['btnAccesoTemas', 'btnAccesoHerramientas', 'btnAccesoJugar']) {
            assert.equal(await page.locator('#' + id).count(), 0, id + ' ya no existe en el botón flotante');
        }
        const redes = await page.locator('#fabMenuLista a.fab-item-btn-red').evaluateAll(a => a.map(x => x.href));
        assert.deepEqual(redes, [
            'https://www.tiktok.com/@lspedia',
            'https://www.instagram.com/lspedia_sign',
            'https://www.youtube.com/@LSPedia-sign',
            'https://www.facebook.com/lspedia.sign'
        ]);
        assert.equal(await page.locator('#fabMenuLista a.fab-item-btn-red').first().isVisible(), true);
        console.log('PASS: botón flotante con donaciones y redes sociales');
        await context.close();

        // Celular real: el menú de abajo siempre se ve, también al bajar y en Recursos.
        ({context, page} = await pagina({viewport:{width:390,height:844}, isMobile:true, hasTouch:true,
            userAgent:'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'}));
        for (const ruta of ['/', '/?vista=diccionario', '/?vista=herramientas']) {
            await page.goto(base + ruta, {waitUntil:'domcontentloaded'});
            await page.waitForFunction(() => window.App?.estadoDatos === 'listo');
            const navVisible = () => page.evaluate(() => {
                const nav = document.getElementById('mobileBottomNav');
                const e = getComputedStyle(nav), r = nav.getBoundingClientRect();
                return e.visibility === 'visible' && Number(e.opacity) === 1 && r.height > 0 && r.bottom <= window.innerHeight + 1;
            });
            assert.equal(await navVisible(), true, 'El menú inferior debe verse al cargar ' + ruta);
            await page.evaluate(() => window.scrollTo(0, 400));
            await page.waitForTimeout(150);
            await page.evaluate(() => window.scrollTo(0, 1200));
            await page.waitForTimeout(500);
            assert.equal(await navVisible(), true, 'El menú inferior debe seguir visible al bajar en ' + ruta);
        }
        console.log('PASS: menú inferior del celular siempre visible');
        await context.close();

        // Recursos: cuadrícula de tarjetas (también en pantallas anchas) con Libros digitales.
        ({context, page} = await pagina());
        await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo');
        await page.locator('#btnHerramientas').click();
        await page.waitForFunction(() => !document.getElementById('herramientasMenuMovil')?.classList.contains('d-none'));
        assert.equal(await page.locator('#btnHerrMovilLibro').isVisible(), true);
        assert.equal(await page.locator('#btnHerrMovilLibro').getAttribute('href'), 'herramientas/libros-digitales.html');
        assert.match(await page.locator('#btnHerrMovilLibro').innerText(), /Libros digitales/);
        const columnas = await page.evaluate(() => getComputedStyle(document.getElementById('herramientasMenuMovilRow')).gridTemplateColumns.split(' ').length);
        assert.equal(columnas, 3, 'Recursos debe tener 3 columnas en pantallas anchas');
        await page.waitForTimeout(1200); // termina la animación de entrada
        const posiciones = await page.evaluate(() => ['btnHerrMovilChatEspanol','btnHerrMovilAlfabetizacion','btnHerrMovilJugar'].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top)));
        assert.equal(new Set(posiciones).size, 1, 'Las tres primeras tarjetas van en la misma fila');
        await page.locator('#btnCategorias').click();
        await page.waitForFunction(() => document.getElementById('herramientasMenuMovil')?.classList.contains('d-none'));
        console.log('PASS: Recursos en cuadrícula de 3 columnas con Libros digitales');
        await context.close();

        ({context, page} = await pagina({viewport:{width:390,height:844},isMobile:true,hasTouch:true}));
        await page.goto(base + '/?vista=herramientas', {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo');
        await page.waitForFunction(() => !document.getElementById('herramientasMenuMovil')?.classList.contains('d-none'));
        assert.equal(await page.locator('#btnHerrMovilLibro').isVisible(), true);
        const columnasMovil = await page.evaluate(() => getComputedStyle(document.getElementById('herramientasMenuMovilRow')).gridTemplateColumns.split(' ').length);
        assert.equal(columnasMovil, 2, 'Recursos debe tener 2 columnas en celular');
        const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(desborde <= 1, 'Recursos no debe desbordar horizontalmente en celular');
        console.log('PASS: Recursos en cuadrícula de 2 columnas en celular');
        await context.close();

        // Libros digitales: la biblioteca muestra las tapas y el libro se abre solo al elegirlo.
        const idLibro = 'algebra-en-lsp';
        const carpetaLibro = path.join(root, 'libros', idLibro);
        const datosLibro = JSON.parse(fs.readFileSync(path.join(carpetaLibro, 'libro.json'), 'utf8'));
        const textoLibro = JSON.parse(fs.readFileSync(path.join(carpetaLibro, 'texto.json'), 'utf8'));
        const catalogo = JSON.parse(fs.readFileSync(path.join(root, 'libros', 'catalogo.json'), 'utf8'));
        assert.ok(catalogo.libros.some(l => l.id === idLibro), 'El libro está en el catálogo');
        const total = datosLibro.paginas.length;
        ({context, page} = await pagina());
        await page.goto(base + '/?vista=herramientas', {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.App?.estadoDatos === 'listo');
        await page.waitForFunction(() => !document.getElementById('herramientasMenuMovil')?.classList.contains('d-none'));
        await page.evaluate(() => { window.__spaOriginal = true; });
        await page.locator('#btnHerrMovilLibro').click();
        await page.waitForFunction(() => location.pathname.endsWith('/herramientas/libros-digitales.html'));
        await page.waitForSelector('.bib-libro');
        assert.equal(await page.locator('.bib-libro').count(), catalogo.libros.length);
        assert.match(await page.locator('.bib-libro-titulo').first().innerText(), /Álgebra/);
        assert.equal(await page.locator('#libro').count(), 0, 'La biblioteca no abre ningún libro por sí sola');
        assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(255, 255, 255)', 'La biblioteca tiene fondo blanco');
        await page.waitForFunction(() => { const i = document.querySelector('.bib-tapa img'); return i && i.complete && i.naturalWidth > 0; });
        console.log('PASS: Libros digitales: biblioteca con tapas, fondo blanco y sin abrir libros solos');

        // Visor del libro: páginas, zoom, miniaturas, sonido, contenido, búsqueda, marcadores y botones del PDF.
        await page.locator('.bib-libro').first().click();
        await page.waitForFunction(() => location.search === '?libro=algebra-en-lsp');
        await page.waitForFunction(() => document.getElementById('estado')?.classList.contains('oculto'));
        assert.equal(await page.locator('#totalPaginas').innerText(), '/ ' + total);
        assert.equal(await page.locator('#btnPrev').isDisabled(), true);
        await page.locator('#btnNext').click();
        await page.waitForFunction(() => Number(document.getElementById('inpPagina').value) >= 2);
        await page.locator('#btnZoomMas').click();
        assert.equal(await page.locator('#btnZoomRestablecer').innerText(), '150%');
        await page.locator('#btnZoomRestablecer').click();
        assert.equal(await page.locator('#btnZoomRestablecer').innerText(), '100%');
        await page.locator('#btnMiniaturas').click();
        assert.equal(await page.locator('.lector-mini').count(), total);
        await page.locator('.lector-mini').nth(5).click();
        await page.waitForFunction(() => Number(document.getElementById('inpPagina').value) >= 5);
        await page.locator('#btnSonido').click();
        assert.equal(await page.locator('#btnSonido').getAttribute('aria-pressed'), 'false');
        const menu = await page.evaluate(() => {
            const e = new MouseEvent('contextmenu', {bubbles:true, cancelable:true});
            document.getElementById('libro').dispatchEvent(e);
            return e.defaultPrevented;
        });
        assert.equal(menu, true, 'El menú contextual debe estar bloqueado en el libro');
        assert.equal(await page.locator('#libro img').count(), 0, 'Las páginas no deben ser <img>');
        console.log('PASS: visor de libro (páginas, zoom, miniaturas, sonido y bloqueos)');

        // Contenido (índice del PDF): una entrada lleva a su página.
        assert.ok(datosLibro.indice.length > 5, 'El libro trae índice');
        await page.locator('#btnContenido').click();
        await page.waitForSelector('.lector-item-contenido');
        assert.equal(await page.locator('.lector-item-contenido').count(), datosLibro.indice.length);
        const entrada = datosLibro.indice.find(e => e[2] > 12);
        const posEntrada = datosLibro.indice.indexOf(entrada);
        await page.locator('.lector-item-contenido').nth(posEntrada).click();
        await page.waitForFunction(p => { const v = Number(document.getElementById('inpPagina').value); return v >= p - 1 && v <= p + 1; }, entrada[2]);
        console.log('PASS: contenido del libro lleva a la página indicada');

        // Búsqueda: una palabra real del libro da resultados.
        const lineaBusqueda = textoLibro.paginas[30].find(l => /^[A-Za-zÁÉÍÓÚáéíóúñÑ]{7,}/.test(l[4]));
        const palabraBusqueda = lineaBusqueda[4].match(/[A-Za-zÁÉÍÓÚáéíóúñÑ]{7,}/)[0];
        await page.locator('#tabBuscar').click();
        await page.locator('#inpBuscar').fill(palabraBusqueda);
        await page.waitForSelector('.lector-resultado', {timeout: 15000});
        assert.ok(await page.locator('.lector-resultado').count() >= 1, 'La búsqueda encuentra «' + palabraBusqueda + '»');
        await page.locator('.lector-resultado').first().click();
        await page.waitForTimeout(500);
        console.log('PASS: búsqueda en el texto del libro');

        // Marcadores: marcar la página y verla en la lista.
        await page.locator('#btnMarcador').click();
        assert.equal(await page.locator('#btnMarcador').getAttribute('aria-pressed'), 'true');
        await page.locator('#btnContenido').click();
        await page.locator('#tabMarcadores').click();
        assert.equal(await page.locator('#listaMarcadores li').count(), 1);
        console.log('PASS: marcadores del libro');

        // Botones del PDF: una zona con destino numérico lleva a su página.
        const paginaConBoton = Object.keys(datosLibro.enlaces).map(Number).find(n => n > 6 && datosLibro.enlaces[n].some(z => typeof z[4] === 'number' && z[4] > 8));
        const zonaBoton = datosLibro.enlaces[paginaConBoton].find(z => typeof z[4] === 'number' && z[4] > 8);
        await page.evaluate(n => window.LSPediaLibro.irA(n - 1), paginaConBoton);
        await page.waitForSelector('.enlace-libro[data-ir="' + (zonaBoton[4] - 1) + '"]', {state: 'attached'});
        await page.evaluate(d => document.querySelector('.enlace-libro[data-ir="' + d + '"]').click(), zonaBoton[4] - 1);
        await page.waitForFunction(p => { const v = Number(document.getElementById('inpPagina').value); return v >= p - 1 && v <= p + 1; }, zonaBoton[4]);
        console.log('PASS: botones del PDF funcionan dentro del visor');

        // Atrás: libro → biblioteca → Recursos, un paso a la vez y sin recargar la página de Recursos.
        await page.locator('#btnVolver').click();
        await page.waitForFunction(() => location.pathname.endsWith('/herramientas/libros-digitales.html'));
        await page.locator('#btnVolver').click();
        await page.waitForFunction(() => location.search === '?vista=herramientas');
        console.log('PASS: atrás del libro y de la biblioteca vuelve paso a paso');
        await context.close();

        // El visor sin ?libro lleva a la biblioteca.
        ({context, page} = await pagina());
        await page.goto(base + '/herramientas/libro-digital.html', {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => location.pathname.endsWith('/herramientas/libros-digitales.html'));
        console.log('PASS: el visor sin libro abre la biblioteca');
        await context.close();

        assert.deepEqual(errores, [], 'Errores JavaScript en la página');
    } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode=1;}).finally(() => server.close());
