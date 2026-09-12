/* LSPedia — ES/EN bilingual layer.
   Keeps Spanish as the canonical word while allowing an English interface,
   English search aliases and English definitions for published dictionary entries. */
(function(){
    'use strict';

    const CLAVE_IDIOMA = 'lspedia_idioma_v1';
    const IDIOMAS = new Set(['es', 'en']);

    function norm(valor){
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('es-PE')
            .trim();
    }

    const DICCIONARIO_EN = [
        ['Ecosistema','Ecosystem',['ecosystems'],`🌿 *Ecosystem (Nature)*\n\n*Definition:*\nA community of living things (people, animals, plants and other organisms) and the place where they live, interacting with one another and with the environment.\n\n*Example:*\nA forest, a river or the sea can be ecosystems.\n\n💻 *Ecosystem (Technology)*\n\n*Definition:*\nA group of devices, applications, services and people that work together to provide one experience or achieve a goal.\n\n*Example:*\nA phone, a computer, cloud storage and applications that work together form a technology ecosystem.`],
        ['Diccionario','Dictionary',['dictionaries'],'A reference work that collects, defines and explains words or terms in an organized way, usually alphabetically, and may also show spelling, origin or use.'],
        ['Vocabulario','Vocabulary',['vocabulary words'],'The set of words used in a language, by a community, by a person, or within a specific subject or technical field.'],
        ['Gracias','Thank you',['thanks','thank you very much'],'A general expression used to show gratitude for a favor, a gift or someone’s attention.'],
        ['Por favor','Please',['please'],'A basic polite expression used to ask for something respectfully and without imposing.'],
        ['Disculpa','Excuse me',['sorry','apology','excuse me'],'A request for forgiveness for a minor mistake, or a polite expression used to interrupt someone.'],
        ['De nada',"You're welcome",['you are welcome','no problem'],"A standard and polite response when someone says thank you."],
        ['Con gusto','My pleasure',['gladly','with pleasure'],'A polite way to say that you are happy to do a favor for someone.'],
        ['Felicitaciones','Congratulations',['congrats','well done'],'An expression of joy and recognition for someone’s success or celebration.'],
        ['Hipótesis','Hypothesis',['hypotheses'],'A reasonable assumption used as a starting point for research or investigation.'],
        ['Discrepancia','Discrepancy',['disagreement','difference'],'When two or more people have different ideas, opinions or answers about the same subject.\n\n*Example:*\nAna says the meeting is at 9. Luis says it is at 10. There is a discrepancy.'],
        ['Uniformidad','Uniformity',['consistency','uniformity'],'The quality of keeping the same characteristics, form or way of doing something, without important differences between its parts.\n\n*Examples:*\n*At school:* All students wear the same uniform, creating uniformity in the group.\n*Game rules:* If one rule applies equally to every player at all times, there is uniformity.\n*Science, industry or cooking:* A uniform mixture has its ingredients distributed evenly, so each part has a very similar composition.'],
        ['Abismo','Abyss',['chasm','precipice'],'An abyss is an extremely deep place that is difficult to measure. It can also be used figuratively for a very large difference, a danger or a very difficult situation.\n\nIn simple terms, an abyss is something so deep or so great that it seems endless or very hard to overcome.'],
        ['Trascender','Transcend',['go beyond','leave a lasting impact','transcend'],'To transcend means to go beyond what is usual or beyond normal limits, leaving an impact, lesson or change that continues even after a person, event or moment has ended.\n\nIn other words, it means doing something whose value or influence lasts.'],
        ['Hola','Hello',['hi','hey'],'The word we use to greet someone when we see them or start talking to them. It can be used at any time of day.'],
        ['Adiós','Goodbye',['bye','see you'],'An expression used when saying goodbye to someone.'],
        ['Buenos días','Good morning',['morning'],'A common polite greeting used from the morning until around midday.'],
        ['Buenas tardes','Good afternoon',['afternoon'],'A greeting used from midday until the sun goes down and it begins to get dark.'],
        ['Buenas noches','Good evening',['good night','evening'],'A greeting used when it is already dark. It can also be used to say goodbye before going to sleep.'],
        ['Bienvenido','Welcome',['welcome'],'A polite expression used when a person arrives at a place, joins a group or comes to your home.'],
        ['Digno','Worthy',['dignified','deserving'],'A person or thing that deserves respect, good treatment or recognition because of its value or because it acts correctly.\n\n*Examples*\n*Person:* Every person has dignity and deserves respect.\n*Things:* A family deserves decent housing that is clean, safe and in good condition.\n*Work:* Every person deserves a decent wage that can cover basic needs.'],
        ['Inteligencia artificial','Artificial intelligence',['AI','artificial intelligence'],'Artificial intelligence is a technology that tries to imitate some human abilities. It can learn from large amounts of information, recognize patterns and improve its responses or results over time.\n\n*For example,* AI can recognize a face in a photo, translate text, answer questions, recommend videos or create images.'],
        ['Tesis','Thesis',['dissertation','research thesis'],'A thesis is a major university research project that a student must complete and approve in order to graduate. Instead of only answering exam questions, the student chooses a problem in their field, investigates it and writes what they discovered.\n\n*How is it done?*\n• Choose a problem to investigate.\n• Look for information in books, interviews, surveys or other sources.\n• Analyze the information and explain the conclusions.\n\n*The final step: defend the thesis*\nThe student presents and explains the research to a panel of professors, who may ask questions. If the thesis is approved, the student can continue the graduation process. A new thesis may be required later for graduate degrees such as a master’s or doctorate.'],
        ['Resiliencia','Resilience',['resilient','resilience'],'Resilience is a person’s ability to face difficult moments, adapt to what happened and keep moving forward.\n\nThe person may still feel sad, worried or affected. Resilience does not mean never suffering. It means gradually finding ways to face the problem, adapt to changes and continue with life.'],
        ['Psicosis','Psychosis',['psychotic episode','psychosis'],'Psychosis is a state in which a person has difficulty distinguishing what is real from what is not.\n\nFor example, the person may hear or see things that other people do not perceive, or be strongly convinced that something is happening when it is not.\n\nThey may also have difficulty organizing thoughts or understanding some situations correctly.\n\nPsychosis can appear because of different mental health conditions, some illnesses or the use of certain substances. It does not mean that the person is “crazy” or necessarily dangerous.'],
        ['Retar','Challenge',['dare','challenge'],'To challenge someone means to invite or push that person to do something difficult, compete, or show that they can do it.\n\nFor example, one person asks another to race to see who wins. That person is challenging the other.'],
        ['Flexible','Flexible',['adaptable','flexibility'],'Flexible means that a person or an object can change or adapt easily.\n\nFor example, a person is traveling along a path and finds a problem that blocks the way. Instead of getting angry and staying there, the person looks for another path and continues.\n\nIt can also happen at work. A person normally starts at one time, but one day the manager asks them to arrive earlier. If they can do it, they change their schedule and adapt to the new situation.\n\nA flexible object can also bend without breaking.']
    ];

    const VOCABULARIO_EN = [
        ['Adulto','Adult',['grown-up']],['Caro','Expensive',['costly']],['Débil','Weak',['fragile']],['Difícil','Difficult',['hard']],['Distraído','Distracted',['inattentive']],
        ['Cansado','Tired',['exhausted']],['Aburrido','Bored',['boring']],['Amor','Love',['love']],['Asustado','Scared',['frightened','afraid']],['Cariño','Affection',['fondness']],['Celos','Jealousy',['jealous']],['Contento','Happy',['content','satisfied']],['Enojado','Angry',['mad']],['Envidia','Envy',['jealousy']],['Esperanza','Hope',['hope']],['Feliz','Happy',['glad','joyful']],['Extrañar','Miss',['miss someone','long for']],['Orgullo (negativo)','Pride',['arrogance','negative pride']],['Soledad','Loneliness',['solitude']],['Sorprendido','Surprised',['amazed']],['Triste','Sad',['unhappy']],['Vergüenza','Embarrassment',['shame']],
        ['Abril','April',[]],['Agosto','August',[]],['Diciembre','December',[]],['Domingo','Sunday',[]],['Enero','January',[]],['Febrero','February',[]],['Jueves','Thursday',[]],['Julio','July',[]],['Junio','June',[]],['Lunes','Monday',[]],['Martes','Tuesday',[]],['Marzo','March',[]],['Mayo','May',[]],['Miércoles','Wednesday',[]],['Noviembre','November',[]],['Octubre','October',[]],['Sábado','Saturday',[]],['Septiembre','September',[]],['Viernes','Friday',[]],
        ['Apoyar','Support',['back','support']],['Ayudar','Help',['assist']],['Examinar','Examine',['inspect','review']],['Advertir','Warn',['warning']],['Practicar','Practice',['practise','rehearse']],['Aceptar','Accept',['agree','receive']],['Añadir','Add',['insert']],['Abrir','Open',['open']],['Bromear','Joke',['kid','joking']],['Abrazar','Hug',['embrace']],['Atender','Attend',['serve','pay attention']],['Aplaudir','Applaud',['clap']],['Escuchar','Listen',['hear']],['Agradecer','Thank',['give thanks','thank']],['Jugar','Play',['play a game']]
    ];

    const CATEGORIAS_EN = {
        'Adjetivos':'Adjectives','Adverbios':'Adverbs','Animales':'Animals','Bienestar':'Well-being','Calle':'Street','Cantidad':'Quantity','Casa':'Home','Ciencia':'Science','Ciudad':'City','Colegio':'School','Colores':'Colors','Comida':'Food','Comportamiento':'Behavior','Comunicación':'Communication','Cortesía':'Courtesy','Cuerpo':'Body','Deportes':'Sports','Descripción':'Description','Economía':'Economy','Educación':'Education','Emociones':'Emotions','Familia':'Family','Filosofía':'Philosophy','Geografía':'Geography','Habilidades':'Skills','Naturaleza':'Nature','Números':'Numbers','Ocio':'Leisure','Personas':'People','Política':'Politics','Preguntas':'Questions','Profesiones':'Professions','Psicología':'Psychology','Reflexión':'Reflection','Ropa':'Clothing','Salud':'Health','Saludos':'Greetings','Sociedad':'Society','Tecnología':'Technology','Tiempo':'Time','Trabajo':'Work','Trámites':'Procedures','Transporte':'Transport','Universidad':'University','Valores':'Values','Verbos':'Verbs'
    };

    const UI_EN = {
        'Diccionario':'Dictionary','Vocabulario':'Vocabulary','Herramientas':'Tools','Sobre Nosotros':'About us','Nosotros':'About us',
        'Índice':'Index','Categorías':'Categories','Palabras sugeridas':'Suggested words','Descubre':'Discover','Ver':'View','Ver Seña':'View sign',
        'Buscar palabra y significado':'Search a Spanish word or type in English','Buscar palabra':'Search a word','Buscar vocabulario':'Search vocabulary',
        'Tu progreso':'Your progress','Continuar':'Continue','Favoritos':'Favorites','Historial':'History','Borrar historial':'Clear history',
        'Aún no tienes favoritos.':'You do not have favorites yet.','Aún no tienes búsquedas recientes.':'You do not have recent searches yet.',
        'Palabras':'Words','Videos':'Videos','Redes Sociales':'Social media','ESTADÍSTICAS':'STATISTICS','Estadísticas':'Statistics',
        'Compartir':'Share','Agregar a favoritos':'Add to favorites','Quitar de favoritos':'Remove from favorites','Atrás':'Back',
        'Anterior':'Previous','Siguiente':'Next','Salir':'Exit','Ver más':'View more','Ver menos':'View less','Cerrar':'Close',
        'Conjugaciones o variantes:':'Conjugations or variants:','CONJUGACIONES O VARIANTES:':'CONJUGATIONS OR VARIANTS:',
        'Apoyo visual':'Visual support','Seña sugerida':'Suggested sign','Video principal':'Main video',
        'Desarrollado con corazón para potenciar la comunicación y la inclusión en el Perú.':'Developed with care to strengthen communication and inclusion in Peru.',
        'Ver licencia':'View license','Todos los derechos reservados.':'All rights reserved.'
    };
    Object.assign(UI_EN, CATEGORIAS_EN);

    function crearMapa(lista){
        const mapa = new Map();
        lista.forEach(([es, term, aliases, definition]) => mapa.set(norm(es), { es, term, aliases: aliases || [], definition: definition || '' }));
        return mapa;
    }
    const MAPA_DICC = crearMapa(DICCIONARIO_EN);
    const MAPA_VOCAB = crearMapa(VOCABULARIO_EN);

    let idioma = leerIdioma();
    const originalesTexto = new WeakMap();

    function leerIdioma(){
        try {
            const guardado = localStorage.getItem(CLAVE_IDIOMA);
            return IDIOMAS.has(guardado) ? guardado : 'es';
        } catch(_e){
            return 'es';
        }
    }

    function guardarIdioma(valor){
        try { localStorage.setItem(CLAVE_IDIOMA, valor); } catch(_e) {}
    }

    function inyectarEstilos(){
        if(document.getElementById('lspedia-i18n-estilos')) return;
        const style = document.createElement('style');
        style.id = 'lspedia-i18n-estilos';
        style.textContent = `
            .lspedia-idioma-selector{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);margin-left:10px;flex:0 0 auto}
            .lspedia-idioma-btn{border:0;border-radius:999px;background:transparent;color:#fff;font:700 12px/1 'Poppins',sans-serif;padding:8px 9px;min-width:38px;cursor:pointer;transition:.18s ease}
            .lspedia-idioma-btn.active{background:#ffc107;color:#0f172a;box-shadow:0 2px 8px rgba(0,0,0,.15)}
            .lspedia-idioma-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}
            .lspedia-en-term{font-size:.88rem;font-weight:700;color:#64748b;margin:-8px 0 12px}
            .lspedia-lsp-label{display:inline-flex;align-items:center;gap:6px;margin:0 auto 8px;padding:5px 10px;border-radius:999px;background:#eef6ff;color:#174a7e;font-size:.78rem;font-weight:700}
            @media(max-width:1199.98px){nav.navbar .container{position:relative}.lspedia-idioma-selector{position:absolute;right:8px;top:50%;transform:translateY(-50%);margin-left:0}.lspedia-idioma-btn{padding:7px 8px;min-width:34px;font-size:11px}}
        `;
        document.head.appendChild(style);
    }

    function inyectarSelector(){
        if(document.getElementById('lspediaIdiomaSelector')) return;
        const navContainer = document.querySelector('nav.navbar .container');
        if(!navContainer) return;
        const wrap = document.createElement('div');
        wrap.id = 'lspediaIdiomaSelector';
        wrap.className = 'lspedia-idioma-selector';
        wrap.setAttribute('role','group');
        wrap.setAttribute('aria-label','Idioma / Language');
        wrap.innerHTML = '<button type="button" class="lspedia-idioma-btn" data-idioma="es" aria-label="Español">ES</button><button type="button" class="lspedia-idioma-btn" data-idioma="en" aria-label="English">EN</button>';
        wrap.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-idioma]');
            if(!btn) return;
            cambiarIdioma(btn.dataset.idioma);
        });
        navContainer.appendChild(wrap);
    }

    function guardarOriginalesPalabra(p){
        if(!p || typeof p !== 'object') return;
        if(!Object.prototype.hasOwnProperty.call(p, '_i18nVariantesEs')) p._i18nVariantesEs = String(p.variantes || '');
        if(!Object.prototype.hasOwnProperty.call(p, '_i18nDefinicionEs')) p._i18nDefinicionEs = String(p.definicion || '');
    }

    function aplicarColeccion(coleccion, mapa){
        if(!Array.isArray(coleccion)) return;
        coleccion.forEach(p => {
            if(!p || !p.palabra) return;
            const traduccion = mapa.get(norm(p.palabra));
            if(!traduccion) return;
            guardarOriginalesPalabra(p);
            p._traduccionEn = traduccion.term;
            if(idioma === 'en'){
                const extras = [traduccion.term].concat(traduccion.aliases || []).filter(Boolean);
                const base = p._i18nVariantesEs ? [p._i18nVariantesEs] : [];
                p.variantes = base.concat(extras).join(', ');
                if(traduccion.definition) p.definicion = traduccion.definition;
            } else {
                p.variantes = p._i18nVariantesEs;
                p.definicion = p._i18nDefinicionEs;
            }
        });
    }

    function aplicarDatos(){
        if(window.App && Array.isArray(window.App.datos)) aplicarColeccion(window.App.datos, MAPA_DICC);
        if(window.QuizV2 && typeof window.QuizV2.obtenerBanco === 'function'){
            try { aplicarColeccion(window.QuizV2.obtenerBanco(), MAPA_VOCAB); } catch(_e) {}
        }
    }

    function estaExcluido(node){
        const el = node.parentElement;
        if(!el) return true;
        return !!el.closest('h3.fw-bold, .categoria-resultado-titulo, #tituloDelDia, .ejemplo-chip, #listaFavoritos h6, #listaHistorial h6, .dia-rect-titulo');
    }

    function traducirNodos(root){
        if(!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodos = [];
        while(walker.nextNode()) nodos.push(walker.currentNode);
        nodos.forEach(node => {
            if(estaExcluido(node)) return;
            if(idioma === 'es'){
                if(originalesTexto.has(node)) node.nodeValue = originalesTexto.get(node);
                return;
            }
            const bruto = String(node.nodeValue || '');
            const limpio = bruto.trim();
            if(!limpio) return;
            const traduccion = UI_EN[limpio];
            if(!traduccion) return;
            if(!originalesTexto.has(node)) originalesTexto.set(node, bruto);
            node.nodeValue = bruto.replace(limpio, traduccion);
        });
    }

    function setPlaceholder(id, es, en){
        const el = document.getElementById(id);
        if(el) el.setAttribute('placeholder', idioma === 'en' ? en : es);
    }

    function traducirHero(){
        const titulo = document.getElementById('tituloPrincipal');
        const subtitulo = document.getElementById('subtituloPrincipal');
        const intro = document.getElementById('vocabularioIntroLista');
        const vocabActivo = !!(document.getElementById('btnCategorias') && document.getElementById('btnCategorias').classList.contains('active'));
        if(idioma === 'en'){
            if(titulo) titulo.innerHTML = vocabActivo
                ? '<span class="titulo-acento">Vocabulary</span> in Peruvian Sign Language (LSP)'
                : '<span class="titulo-acento">Spanish Dictionary</span> with Peruvian Sign Language (LSP) support';
            if(subtitulo && !vocabActivo){
                subtitulo.innerHTML = '<span class="aviso-mision-icono" aria-hidden="true">🤟</span><div class="aviso-mision-texto"><p class="aviso-mision-linea1"><span style="color:#42a5f5;font-weight:700;">Visual Spanish dictionary</span> supported by Peruvian Sign Language.<br>Its purpose is to make Spanish words and meanings easier to understand.</p><p class="aviso-mision-linea2"><span style="color:#a66a00;font-weight:700;">🪧 It is not an LSP course and does not teach or impose signs.</span></p></div>';
            }
            if(intro && vocabActivo){
                const textos = intro.querySelectorAll('.vocab-intro-texto');
                if(textos[0]) textos[0].innerHTML = 'Signs represent <strong>concepts</strong>, not always individual words.';
                if(textos[1]) textos[1].innerHTML = 'Spanish terms are a <strong>reference</strong> that makes searching and learning easier.';
                if(textos[2]) textos[2].innerHTML = '<strong>Regional variations</strong> enrich Peruvian Sign Language.';
            }
        }
        setPlaceholder('buscar','Buscar palabra y significado','Search a Spanish word or type in English');
        setPlaceholder('buscarCategorias','Buscar vocabulario','Search vocabulary in Spanish or English');
    }

    function traducirResultado(root){
        if(!root) return;
        const titulo = root.querySelector('h3.fw-bold');
        if(!titulo) return;
        const mapa = root === document.getElementById('resultado') ? MAPA_DICC : new Map([...MAPA_DICC, ...MAPA_VOCAB]);
        const tr = mapa.get(norm(titulo.textContent));
        const filaTitulo = titulo.parentElement;
        let etiqueta = root.querySelector('.lspedia-en-term');
        if(idioma === 'en' && tr && filaTitulo){
            if(!etiqueta){
                etiqueta = document.createElement('div');
                etiqueta.className = 'lspedia-en-term';
                filaTitulo.insertAdjacentElement('afterend', etiqueta);
            }
            etiqueta.textContent = 'English: ' + tr.term;
        } else if(etiqueta){
            etiqueta.remove();
        }

        let etiquetaVideo = root.querySelector('.lspedia-lsp-label');
        if(idioma === 'en'){
            const iframe = root.querySelector('iframe');
            const video = root.querySelector('video');
            const media = iframe || video;
            if(media && !etiquetaVideo){
                etiquetaVideo = document.createElement('div');
                etiquetaVideo.className = 'lspedia-lsp-label';
                etiquetaVideo.textContent = '🇵🇪 Peruvian Sign Language (LSP) video';
                const contenedor = media.closest('.ratio, .reproductor-palabra-wrap') || media.parentElement;
                if(contenedor) contenedor.insertAdjacentElement('beforebegin', etiquetaVideo);
            }
        } else if(etiquetaVideo){
            etiquetaVideo.remove();
        }

        const toggle = root.querySelector('[data-definicion-toggle]');
        if(toggle){
            const abierto = toggle.getAttribute('aria-expanded') === 'true';
            toggle.innerHTML = idioma === 'en'
                ? (abierto ? 'View less <span aria-hidden="true">↑</span>' : 'View more <span aria-hidden="true">↓</span>')
                : (abierto ? 'Ver menos <span aria-hidden="true">↑</span>' : 'Ver más <span aria-hidden="true">↓</span>');
        }
    }

    function aplicarInterfaz(){
        document.documentElement.lang = idioma === 'en' ? 'en' : 'es';
        document.querySelectorAll('.lspedia-idioma-btn').forEach(btn => {
            const activo = btn.dataset.idioma === idioma;
            btn.classList.toggle('active', activo);
            btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
        });

        traducirHero();
        [
            document.querySelector('nav.navbar'),
            document.getElementById('mobileBottomNav'),
            document.getElementById('filaHeroPrincipal'),
            document.getElementById('filaCategoriasDiccionario'),
            document.getElementById('panelCategorias'),
            document.getElementById('herramientasMenuMovil'),
            document.getElementById('seccionNosotros'),
            document.querySelector('footer.footer-lspedia'),
            document.getElementById('resultado'),
            document.getElementById('resultadoCategorias'),
            document.getElementById('resultadoCategoriasDiccionario')
        ].forEach(traducirNodos);

        traducirResultado(document.getElementById('resultado'));
        traducirResultado(document.getElementById('resultadoCategorias'));
        traducirResultado(document.getElementById('resultadoCategoriasDiccionario'));
    }

    let rafPendiente = 0;
    function programarAplicacion(){
        if(rafPendiente) cancelAnimationFrame(rafPendiente);
        rafPendiente = requestAnimationFrame(() => {
            rafPendiente = 0;
            aplicarDatos();
            aplicarInterfaz();
        });
    }

    function refrescarFichaActual(){
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('p');
        if(!ref) return;
        const esVocab = params.get('fuente') === 'vocabulario' || params.get('vista') === 'vocabulario';
        try {
            if(esVocab && typeof window.mostrarPalabraVocabularioPorReferencia === 'function'){
                window.mostrarPalabraVocabularioPorReferencia(ref);
            } else if(typeof window.mostrarPalabraPorNombre === 'function'){
                window.mostrarPalabraPorNombre(ref);
            }
        } catch(_e) {}
    }

    function cambiarIdioma(nuevo){
        if(!IDIOMAS.has(nuevo) || nuevo === idioma) return;
        idioma = nuevo;
        guardarIdioma(idioma);
        aplicarDatos();
        refrescarFichaActual();
        setTimeout(programarAplicacion, 0);
        document.dispatchEvent(new CustomEvent('lspedia:idiomaCambiado', { detail: { idioma } }));
    }

    function iniciar(){
        inyectarEstilos();
        inyectarSelector();
        aplicarDatos();
        aplicarInterfaz();

        document.addEventListener('lspedia:datosListos', () => {
            setTimeout(programarAplicacion, 0);
            setTimeout(programarAplicacion, 350);
        });
        document.addEventListener('click', () => setTimeout(programarAplicacion, 0), true);
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') setTimeout(programarAplicacion, 0);
        }, true);

        // Quiz/Vocabulario finishes loading asynchronously. Poll briefly so
        // English aliases are attached as soon as that bank becomes available.
        let intentos = 0;
        const timer = setInterval(() => {
            intentos += 1;
            aplicarDatos();
            if((window.QuizV2 && typeof window.QuizV2.obtenerBanco === 'function' && window.QuizV2.obtenerBanco().length) || intentos >= 20){
                clearInterval(timer);
                programarAplicacion();
            }
        }, 500);
    }

    window.LSPediaIdioma = {
        obtener: () => idioma,
        cambiar: cambiarIdioma,
        traduccionIngles: (palabra) => MAPA_DICC.get(norm(palabra)) || MAPA_VOCAB.get(norm(palabra)) || null
    };

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once:true });
    else iniciar();
})();
