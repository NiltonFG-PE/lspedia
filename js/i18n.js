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
        ['Tesis','Thesis',['dissertation','research thesis'],'A thesis is a university research project that may be required for a degree or professional title, depending on the institution. The student chooses a topic or problem, investigates it and explains what was discovered.\n\n*How is it done?*\n• Choose a problem to investigate.\n• Look for information in books, interviews, surveys or other sources.\n• Analyze the information and explain the conclusions.\n\n*The final step: defend the thesis*\nThe student presents and explains the research to a panel of professors, who may ask questions. If the thesis is approved, the student can continue the graduation process. A new thesis may be required later for graduate degrees such as a master’s or doctorate.'],
        ['Resiliencia','Resilience',['resilient','resilience'],'Resilience is a person’s ability to face difficult moments, adapt to what happened and keep moving forward.\n\nThe person may still feel sad, worried or affected. Resilience does not mean never suffering. It means gradually finding ways to face the problem, adapt to changes and continue with life.'],
        ['Psicosis','Psychosis',['psychotic episode','psychosis'],'Psychosis is a state in which a person has difficulty distinguishing what is real from what is not.\n\nFor example, the person may hear or see things that other people do not perceive, or be strongly convinced that something is happening when it is not.\n\nThey may also have difficulty organizing thoughts or understanding some situations correctly.\n\nPsychosis can appear because of different mental health conditions, some illnesses or the use of certain substances. It does not mean that the person is “crazy” or necessarily dangerous.'],
        ['Retar','Challenge',['dare','challenge'],'To challenge someone means to invite or push that person to do something difficult, compete, or show that they can do it.\n\nFor example, one person asks another to race to see who wins. That person is challenging the other.'],
        ['Flexible','Flexible',['adaptable','flexibility'],'Flexible means that a person or an object can change or adapt easily.\n\nFor example, a person is traveling along a path and finds a problem that blocks the way. Instead of getting angry and staying there, the person looks for another path and continues.\n\nIt can also happen at work. A person normally starts at one time, but one day the manager asks them to arrive earlier. If they can do it, they change their schedule and adapt to the new situation.\n\nA flexible object can also bend without breaking.']
    ];

    const VOCABULARIO_EN = [
        ['Adulto','Adult',['grown-up']],['Alto','Tall',[]],['Ancho','Wide',[]],['Angosto','Narrow',[]],['Antiguo','Old',['ancient']],['Bajo','Short',['low']],['Barato','Cheap',['inexpensive']],['Caro','Expensive',['costly']],['Débil','Weak',['fragile']],['Difícil','Difficult',['hard']],['Distraído','Distracted',['inattentive']],
        ['Amarillo','Yellow',[]],['Azul','Blue',[]],['Beige','Beige',[]],['Blanco','White',[]],['Celeste','Light blue',[]],['Dorado','Gold',['golden']],['Guinda','Burgundy',['maroon']],['Marrón','Brown',[]],['Morado','Purple',[]],['Anaranjado','Orange',[]],['Negro','Black',[]],['Rojo','Red',[]],['Rosado','Pink',[]],['Turquesa','Turquoise',[]],['Verde','Green',[]],
        ['Pregunta','Question',[]],
        ['Felicitaciones','Congratulations',['congrats']],['Gracias','Thank you',['thanks']],['Por favor','Please',[]],['Perdón','Sorry',['excuse me']],['Bienvenido','Welcome',[]],['Hasta luego','See you later',[]],['Buenos días','Good morning',[]],['Buenas tardes','Good afternoon',[]],['Buenas noches','Good evening',['good night']],
        ['Cansado','Tired',['exhausted']],['Aburrido','Bored',[]],['Amor','Love',[]],['Asustado','Scared',['afraid','frightened']],['Cariño','Affection',['fondness']],['Celos','Jealousy',['jealous']],['Contento','Happy',['content']],['Enojado','Angry',['mad']],['Envidia','Envy',[]],['Esperanza','Hope',[]],['Feliz','Happy',['glad']],['Extrañar','Miss',['miss someone']],['Orgullo (negativo)','Pride (negative)',['negative pride']],['Soledad','Loneliness',[]],['Sorprendido','Surprised',['amazed']],['Triste','Sad',['unhappy']],['Vergüenza','Embarrassment',['shame']],
        ['¿Cómo?','How?',[]],['¿Cuál?','Which?',[]],['¿Cuándo?','When?',[]],['¿Dónde?','Where?',[]],['¿Por qué?','Why?',[]],['¿Qué?','What?',[]],['¿Quién?','Who?',[]],['¿Quiénes?','Who?',[]],['¿Cuáles?','Which ones?',[]],['¿Cuántos?','How many?',[]],['¿Para qué?','What for?',[]],
        ['Abril','April',[]],['Agosto','August',[]],['Ahora','Now',[]],['Anteayer','The day before yesterday',[]],['Ayer','Yesterday',[]],['Todos los días','Every day',[]],['Diciembre','December',[]],['Domingo','Sunday',[]],['Enero','January',[]],['Estaciones del año','Seasons of the year',['seasons']],['Febrero','February',[]],['Hoy','Today',[]],['Invierno','Winter',[]],['Jueves','Thursday',[]],['Julio','July',[]],['Junio','June',[]],['Lunes','Monday',[]],['Mañana','Tomorrow',[]],['Martes','Tuesday',[]],['Marzo','March',[]],['Mayo','May',[]],['Miércoles','Wednesday',[]],['Noviembre','November',[]],['Octubre','October',[]],['Otoño','Autumn',['fall']],['Pasado mañana','The day after tomorrow',[]],['Primavera','Spring',[]],['Sábado','Saturday',[]],['Septiembre','September',[]],['Verano','Summer',[]],['Viernes','Friday',[]],
        ['Apoyar','Support',['back']],['Ayudar','Help',['assist']],['Examinar','Examine',['inspect','review']],['Advertir','Warn',['warning']],['Practicar','Practice',['practise']],['Aceptar','Accept',['agree']],['Añadir','Add',['insert']],['Abrir','Open',[]],['Bromear','Joke',['kid']],['Abrazar','Hug',['embrace']],['Atender','Attend to',['assist']],['Aplaudir','Applaud',['clap']],['Escuchar','Listen',['hear']],['Agradecer','Thank',['give thanks']],['Jugar','Play',['play a game']],
        ['Número','Number',[]],['Saludos','Greetings',[]],['Muchas gracias','Thank you very much',[]],['Gratis','Free',['free of charge']],['Nos vemos','See you',[]],['Hola','Hello',['hi']],['Chau','Bye',['goodbye']],['Cuídate','Take care',[]],['Educado','Polite',['well-mannered']]
    ];

    const CATEGORIAS_EN = {
        'Adjetivos':'Adjectives','Adverbios':'Adverbs','Animales':'Animals','Bienestar':'Well-being','Calle':'Street','Cantidad':'Quantity','Casa':'Home','Ciencia':'Science','Ciudad':'City','Colegio':'School','Colores':'Colors','Comida':'Food','Comportamiento':'Behavior','Comunicación':'Communication','Cortesía':'Courtesy','Cuerpo':'Body','Deportes':'Sports','Descripción':'Description','Economía':'Economy','Educación':'Education','Emociones':'Emotions','Familia':'Family','Filosofía':'Philosophy','Geografía':'Geography','Habilidades':'Skills','Naturaleza':'Nature','Números':'Numbers','Ocio':'Leisure','Personas':'People','Política':'Politics','Preguntas':'Questions','Profesiones':'Professions','Psicología':'Psychology','Reflexión':'Reflection','Ropa':'Clothing','Salud':'Health','Saludos':'Greetings','Sociedad':'Society','Tecnología':'Technology','Tiempo':'Time','Trabajo':'Work','Trámites':'Procedures','Transporte':'Transport','Universidad':'University','Valores':'Values','Verbos':'Verbs'
    };

    const COLECCIONES_EN = {
        'meses del año':'months of the year',
        'Estaciones del año':'Seasons of the year',
        'Gratuito':'Free','Sin costo':'Free','Sin cargo':'No charge','De cortesía':'Complimentary','Gratuitamente':'Free of charge'
    };

    const UI_EN = {
        'Diccionario':'Dictionary','Vocabulario':'Vocabulary','Herramientas':'Tools','Sobre Nosotros':'About us','Nosotros':'About us',
        'Desarrollado con corazón':'Made with care','Apoyar LSPedia':'Support LSPedia','Ir a Vocabulario':'Go to Vocabulary',
        'Ir a Herramientas':'Go to Tools','Ir a Jugar':'Go to Games','🎥 VIDEO':'🎥 VIDEO','✨ Descubre':'✨ Discover',
        'Cargando...':'Loading...','Cargando…':'Loading…','Cargando la palabra de hoy…':"Loading today's word…",
        'Un momento, estamos trayendo el contenido.':'One moment, we are loading the content.','Ver':'View',
        'Diccionario visual':'Visual dictionary','Índice':'Index','Categorías':'Categories','Cargando categorías…':'Loading categories…',
        'Palabras sugeridas':'Suggested words','⭐ Palabras sugeridas':'⭐ Suggested words','Descubre':'Discover','Ver Seña':'View sign',
        'Buscar palabra y significado':'Search a Spanish word or type in English','Buscar palabra':'Search a word','Buscar vocabulario':'Search vocabulary',
        'Tu progreso':'Your progress','Continuar':'Continue','Favoritos':'Favorites','⭐ Mis Favoritos':'⭐ My Favorites',
        'Historial':'History','🕒 Mi Historial de Búsqueda':'🕒 My Search History','Borrar historial':'Clear history',
        'Aún no tienes favoritos.':'You do not have favorites yet.','Aún no tienes búsquedas recientes.':'You do not have recent searches yet.',
        'Palabras':'Words','PALABRAS':'WORDS','Categorías':'Categories','CATEGORÍAS':'CATEGORIES','Videos':'Videos','VIDEOS':'VIDEOS',
        'Redes Sociales':'Social media','REDES SOCIALES':'SOCIAL MEDIA','ESTADÍSTICAS':'STATISTICS','Estadísticas':'Statistics',
        'Sigue aprendiendo y descubre más cada día.':'Keep learning and discover more every day.',
        'Síguenos y no te pierdas nada':'Follow us and do not miss anything',
        'Compartir':'Share','Compartir colección':'Share collection','Agregar a favoritos':'Add to favorites','Quitar de favoritos':'Remove from favorites','Atrás':'Back',
        'Anterior':'Previous','Siguiente':'Next','Siguiente →':'Next →','Salir':'Exit','↩ Salir':'↩ Exit','⏻ Salir':'⏻ Exit','✕ Salir':'✕ Exit',
        'Ver más':'View more','Ver menos':'View less','Cerrar':'Close','Empezar':'Start','▶ Empezar':'▶ Start','▶ JUGAR':'▶ PLAY',
        'Iniciar':'Start','Detener':'Stop','Guardar':'Save','💾 Guardar':'💾 Save','⏹ Detener subtítulos':'⏹ Stop captions',
        'Conjugaciones o variantes:':'Conjugations or variants:','CONJUGACIONES O VARIANTES:':'CONJUGATIONS OR VARIANTS:',
        'Apoyo visual':'Visual support','📸 Apoyo visual:':'📸 Visual support:','Seña sugerida':'Suggested sign','Video principal':'Main video',
        'Alfabeto y números':'Alphabet and numbers','Alfabeto y Números':'Alphabet and Numbers',
        'Mira, reconoce y practica letras y números':'Look, recognize, and practice letters and numbers',
        'Jugar':'Games','Aprende tocando, ordenando y resolviendo':'Learn by tapping, ordering, and solving',
        'Subtítulos':'Captions','Convierte la voz en texto en tiempo real':'Turn speech into text in real time',
        '💬 Subtítulos en vivo':'💬 Live captions','🎚️ Probar nivel de audio':'🎚️ Test audio level',
        'Escuchando el ambiente…':'Listening to the environment…','Idioma de los subtítulos':'Caption language',
        'Español (Perú)':'Spanish (Peru)','Español (Latinoamérica)':'Spanish (Latin America)','Español (España)':'Spanish (Spain)',
        '🎤 Empezar':'🎤 Start','📢 Consejos para captar mejor el audio:':'📢 Tips for better audio capture:',
        'EN VIVO':'LIVE','Tu navegador no admite el reconocimiento de voz':'Your browser does not support speech recognition',
        'Para usar los subtítulos en tiempo real, abre esta página en':'To use live captions, open this page in',
        'Toca un juego. La animación te muestra qué harás.':'Tap a game. The animation shows what you will do.',
        'Completar la palabra':'Complete the word','Lleva la letra al espacio':'Move the letter into the blank',
        'Unir con flechas':'Match with arrows','Arrastra y conecta':'Drag and connect',
        'Quiz':'Quiz','Mira, piensa y elige':'Look, think, and choose',
        'Matemáticas':'Math','Junta, quita, agrupa y reparte':'Add, remove, group, and share',
        'Oraciones':'Sentences','Ordena ideas y conversa mejor':'Organize ideas and communicate better',
        'Preparando el juego…':'Preparing the game…','↩ Elegir otro juego':'↩ Choose another game',
        'Elige el nivel y el modo de juego para tu ronda de práctica.':'Choose the level and game mode for your practice round.',
        '🌱 Elegir nivel':'🌱 Choose level','🎲 Modo de juego':'🎲 Game mode','Nivel':'Level','Modo de juego':'Game mode',
        'Pregunta 1':'Question 1','Fácil':'Easy','Medio':'Medium','Difícil':'Hard','Básico':'Basic',
        '↩ Menú':'↩ Menu','Intentos: 0':'Attempts: 0','¡Ronda completada!':'Round complete!',
        'Correctas':'Correct','Incorrectas':'Incorrect','Precisión':'Accuracy','Revisión de respuestas':'Answer review',
        '🔁 Jugar de nuevo':'🔁 Play again','Palabra 1':'Word 1','Ronda 1':'Round 1','🖼️ Imágenes':'🖼️ Images','🔤 Palabras':'🔤 Words',
        'Preparando contenido…':'Preparing content…','🔡 Abecedario A-Z':'🔡 Alphabet A-Z','🔢 Números 0-19':'🔢 Numbers 0-19',
        'Ocultar índice':'Hide index','🔊👄 Fonética':'🔊👄 Phonetics','Ampliar 🔍':'Enlarge 🔍','✏️ Grafía':'✏️ Spelling',
        '📚 Ejemplos de palabras':'📚 Word examples',
        'Sugerir palabra':'Suggest a word','¿Falta un término? Envíanos tu propuesta.':'Is a term missing? Send us your suggestion.',
        'Enviar una idea':'Send an idea','Comparte sugerencias para mejorar LSPedia.':'Share suggestions to improve LSPedia.',
        'Ayuda a mantener el proyecto gratuito y en crecimiento.':'Help keep the project free and growing.',
        'Contratar un intérprete':'Hire an interpreter','Solicita servicios de interpretación en LSP.':'Request Peruvian Sign Language interpreting services.',
        'Sugerir nueva palabra en LSP':'Suggest a new LSP word','¿Quieres apoyar LSPedia?':'Would you like to support LSPedia?',
        'LSPedia es un proyecto independiente financiado con recursos propios. Puedes contactarme para cualquier aporte o sugerencia.':'LSPedia is an independent project funded with personal resources. You can contact me with any contribution or suggestion.',
        'Si deseas brindar un apoyo económico, escríbeme por WhatsApp y con gusto te compartiré los medios de pago disponibles.':'If you would like to provide financial support, message me on WhatsApp and I will gladly share the available payment options.',
        'Cada aporte, por pequeño que sea, contribuye a crear más contenido y mantener LSPedia gratuita para todos.':'Every contribution, no matter how small, helps create more content and keep LSPedia free for everyone.',
        'Escríbenos por el medio que prefieras y coordinamos los detalles de tu solicitud. Puedes contactarme para ofertas de trabajo o servicios de traducción e interpretación.':'Contact us through your preferred channel and we will coordinate the details of your request. You can also contact me for work offers or translation and interpreting services.',
        'Correo electrónico':'Email','Vocabulario en fase de prueba':'Vocabulary in testing phase',
        'La sección':'The section','está en fase de prueba. Esperamos contar en el futuro con la ayuda de personas sordas en la grabación de estos videos.':'is currently in testing. We hope to have the support of Deaf people in recording these videos in the future.',
        'ENTIENDO, CONTINUAR':'I UNDERSTAND, CONTINUE',
        'Desarrollado con corazón para potenciar la comunicación y la inclusión en el Perú.':'Developed with care to strengthen communication and inclusion in Peru.',
        'Ver licencia':'View license','Todos los derechos reservados.':'All rights reserved.',
        'Colecciones':'Collections','palabra':'word','palabras':'words','relacionadas':'related',
        'Categoría:':'Category:','¿Quisiste decir...?':'Did you mean...?'
    };
    Object.assign(UI_EN, CATEGORIAS_EN, COLECCIONES_EN);


    function crearMapa(lista){
        const mapa = new Map();
        lista.forEach(([es, term, aliases, definition]) => mapa.set(norm(es), { es, term, aliases: aliases || [], definition: definition || '' }));
        return mapa;
    }
    const MAPA_DICC = crearMapa(DICCIONARIO_EN);
    const MAPA_VOCAB = crearMapa(VOCABULARIO_EN);

    let idioma = leerIdioma();
    const originalesTexto = new WeakMap();
    const originalesAtributos = new WeakMap();

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
            /* Selector ES/EN + modo oscuro: cápsula premium de cristal, compacta y táctil. */
            .lspedia-idioma-selector{
                display:inline-flex;
                align-items:center;
                gap:3px;
                padding:4px;
                min-height:48px;
                border-radius:999px;
                background:linear-gradient(145deg,rgba(255,255,255,.18),rgba(255,255,255,.08));
                border:1px solid rgba(255,255,255,.28);
                box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 24px rgba(0,0,0,.18),0 0 0 1px rgba(37,99,235,.08);
                -webkit-backdrop-filter:blur(14px) saturate(1.25);
                backdrop-filter:blur(14px) saturate(1.25);
                margin-left:10px;
                flex:0 0 auto;
            }
            .lspedia-idioma-btn{
                border:1px solid transparent;
                border-radius:999px;
                background:transparent;
                color:rgba(255,255,255,.88);
                font:700 13px/1 'Poppins',sans-serif;
                letter-spacing:.2px;
                padding:0;
                width:46px;
                height:40px;
                cursor:pointer;
                transition:background .22s ease,color .22s ease,box-shadow .22s ease,transform .18s ease;
            }
            .lspedia-idioma-btn:hover{background:rgba(255,255,255,.11);color:#fff;transform:translateY(-1px)}
            .lspedia-idioma-btn.active{
                background:linear-gradient(145deg,#ffd329 0%,#ffbf00 100%);
                color:#0f172a;
                border-color:rgba(255,255,255,.32);
                box-shadow:0 5px 14px rgba(255,193,7,.28),inset 0 1px 0 rgba(255,255,255,.5);
            }
            .lspedia-idioma-btn:focus-visible{outline:2px solid #ffd54a;outline-offset:2px}
            .lspedia-idioma-selector #lspediaTemaBtn{
                width:40px;
                height:40px;
                margin-left:2px;
                border-left:1px solid rgba(255,255,255,.22);
                border-radius:0 999px 999px 0;
                box-shadow:none;
            }
            .lspedia-en-term{font-size:.88rem;font-weight:700;color:#64748b;margin:-8px 0 12px}
            .lspedia-lsp-label{display:inline-flex;align-items:center;gap:6px;margin:0 auto 8px;padding:5px 10px;border-radius:999px;background:#eef6ff;color:#174a7e;font-size:.78rem;font-weight:700}
            @media(max-width:1199.98px){
                nav.navbar .container{position:relative}
                .lspedia-idioma-selector{position:absolute;right:8px;top:50%;transform:translateY(-50%);margin-left:0;min-height:46px;padding:3px;gap:2px}
                .lspedia-idioma-btn{width:44px;height:38px;font-size:11px}
                .lspedia-idioma-selector #lspediaTemaBtn{width:38px;height:38px}
            }
            /* En móvil/tablet: el logo queda a la izquierda y ES/EN + modo oscuro quedan juntos a la derecha. */
            @media(max-width:1199.98px){
                nav.navbar .container{position:relative !important;}
                nav.navbar .container > .navbar-brand{
                    position:absolute !important;
                    left:6px !important;
                    top:50% !important;
                    margin:0 !important;
                    transform:translateY(-50%) !important;
                    z-index:2 !important;
                }
                nav.navbar .container > .navbar-brand video,
                nav.navbar .container > .navbar-brand img{
                    height:58px !important;
                    width:auto !important;
                }
                .lspedia-idioma-selector{
                    right:8px !important;
                    z-index:3 !important;
                    transform:translateY(-50%) !important;
                    min-height:42px !important;
                    height:42px !important;
                    padding:2px !important;
                    gap:1px !important;
                }
                .lspedia-idioma-selector .lspedia-idioma-btn{
                    width:38px !important;
                    min-width:38px !important;
                    height:32px !important;
                    min-height:32px !important;
                    padding:0 !important;
                    font-size:11px !important;
                }
                .lspedia-idioma-selector #lspediaTemaBtn{
                    width:32px !important;
                    min-width:32px !important;
                    height:32px !important;
                    min-height:32px !important;
                    padding:0 !important;
                }
            }
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

    function traduccionDirecta(p){
        const term = String(p && p.ingles || '').trim();
        if(!term) return null;
        return {
            es: String(p.palabra || '').trim(),
            term,
            aliases: Array.isArray(p.aliasesIngles) ? p.aliasesIngles : [],
            definition: String(p.definicionIngles || '').trim()
        };
    }

    function aplicarColeccion(coleccion, mapa){
        if(!Array.isArray(coleccion)) return;
        coleccion.forEach(p => {
            if(!p || !p.palabra) return;
            const traduccion = traduccionDirecta(p) || mapa.get(norm(p.palabra));
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
        if(window.App && Array.isArray(window.App.datos)){
            aplicarColeccion(window.App.datos, MAPA_DICC);
        }
        if(window.LSPediaVocabularioPublico && typeof window.LSPediaVocabularioPublico.obtener === 'function'){
            aplicarColeccion(window.LSPediaVocabularioPublico.obtener(), MAPA_VOCAB);
        }
    }

    function traduccionConcepto(texto){
        const limpio = String(texto || '').trim();
        if(!limpio) return '';
        const exacta = UI_EN[limpio];
        if(exacta) return exacta;

        const vocab = MAPA_VOCAB.get(norm(limpio));
        if(vocab) return vocab.term;
        const dicc = MAPA_DICC.get(norm(limpio));
        if(dicc) return dicc.term;

        if(window.LSPediaI18nAuto && typeof window.LSPediaI18nAuto.traduccion === 'function'){
            try {
                const auto = window.LSPediaI18nAuto.traduccion(limpio);
                if(auto && auto.term) return auto.term;
            } catch(_e) {}
        }
        return '';
    }

    function traducirTextoDinamico(texto){
        const limpio = String(texto || '').trim();
        if(!limioSeguro(limpio)) return '';

        const exacta = traduccionConcepto(limpio);
        if(exacta) return exacta;

        let m = limpio.match(/^Categoría:\s*(.+)$/i);
        if(m){
            const nombre = m[1].trim();
            return 'Category: ' + (traduccionConcepto(nombre) || nombre);
        }

        m = limpio.match(/^(\d+)\s+palabra(?:s)?(?:\s+relacionadas)?$/i);
        if(m){
            const n = Number(m[1]);
            return n + (n === 1 ? ' word' : ' words')
                + (/relacionadas/i.test(limpio) ? ' related' : '');
        }

        m = limpio.match(/^🏷️\s*(.+)$/);
        if(m){
            const nombre = m[1].trim();
            return '🏷️ ' + (traduccionConcepto(nombre) || nombre);
        }

        m = limpio.match(/^Pregunta\s+(\d+)$/i);
        if(m) return 'Question ' + m[1];
        m = limpio.match(/^Palabra\s+(\d+)$/i);
        if(m) return 'Word ' + m[1];
        m = limpio.match(/^Ronda\s+(\d+)$/i);
        if(m) return 'Round ' + m[1];
        m = limpio.match(/^Intentos:\s*(\d+)$/i);
        if(m) return 'Attempts: ' + m[1];

        return '';
    }

    function limioSeguro(texto){
        return !!texto && texto.length < 220;
    }

    function estaExcluido(node){
        const el = node.parentElement;
        if(!el) return true;
        return !!el.closest('script, style, noscript, .lspedia-es-term, .lspedia-en-term, h3.fw-bold');
    }

    function traducirNodos(root){
        if(!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodos = [];
        while(walker.nextNode()) nodos.push(walker.currentNode);
        nodos.forEach(node => {
            if(estaExcluido(node)) return;
            const actual = String(node.nodeValue || '');
            if(!originalesTexto.has(node)) originalesTexto.set(node, actual);
            const original = originalesTexto.get(node);
            if(idioma === 'es'){
                if(node.nodeValue !== original) node.nodeValue = original;
                return;
            }
            const limpio = String(original || '').trim();
            if(!limpio) return;
            const traduccion = traducirTextoDinamico(limpio);
            if(!traduccion) return;
            const nuevo = original.replace(limpio, traduccion);
            if(node.nodeValue !== nuevo) node.nodeValue = nuevo;
        });
    }

    function traducirAtributos(root){
        if(!root || !root.querySelectorAll) return;
        const elementos = [];
        if(root.nodeType === 1 && root.matches('[placeholder],[title],[aria-label],[alt]')) elementos.push(root);
        root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(el => elementos.push(el));

        elementos.forEach(el => {
            let originales = originalesAtributos.get(el);
            if(!originales){
                originales = {};
                originalesAtributos.set(el, originales);
            }
            ['placeholder','title','aria-label','alt'].forEach(attr => {
                if(!el.hasAttribute(attr)) return;
                if(!Object.prototype.hasOwnProperty.call(originales, attr)){
                    originales[attr] = el.getAttribute(attr);
                }
                const original = originales[attr];
                if(idioma === 'es'){
                    if(el.getAttribute(attr) !== original) el.setAttribute(attr, original);
                    return;
                }

                let traduccion = traducirTextoDinamico(original);
                if(!traduccion){
                    const compartirCategoria = original.match(/^Compartir categoría\s+(.+)$/i);
                    const compartirColeccion = original.match(/^Compartir colección\s+(.+)$/i);
                    if(compartirCategoria){
                        const nombre = compartirCategoria[1].trim();
                        traduccion = 'Share category ' + (traduccionConcepto(nombre) || nombre);
                    } else if(compartirColeccion){
                        const nombre = compartirColeccion[1].trim();
                        traduccion = 'Share collection ' + (traduccionConcepto(nombre) || nombre);
                    }
                }
                if(traduccion && el.getAttribute(attr) !== traduccion){
                    el.setAttribute(attr, traduccion);
                }
            });
        });
    }

    function setPlaceholder(id, es, en){
        const el = document.getElementById(id);
        if(!el) return;
        if(!originalesAtributos.has(el)) originalesAtributos.set(el, {});
        const originales = originalesAtributos.get(el);
        if(!Object.prototype.hasOwnProperty.call(originales, 'placeholder')) originales.placeholder = es;
        el.setAttribute('placeholder', idioma === 'en' ? en : es);
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
        setPlaceholder('buscarCategorias','Buscar vocabulario','Search sign vocabulary');
    }

    function traducirResultado(root){
        if(!root) return;
        const titulo = root.querySelector('h3.fw-bold');
        if(!titulo) return;
        const esDiccionario = root === document.getElementById('resultado') ||
            root === document.getElementById('resultadoCategoriasDiccionario');
        const tr = esDiccionario ? MAPA_DICC.get(norm(titulo.textContent)) : null;
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
        if(esVocab) return;
        try {
            if(typeof window.mostrarPalabraPorNombre === 'function'){
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

        // No se espera ni se modifica el banco de Vocabulario: la capa
        // bilingüe de conceptos trabaja únicamente con el Diccionario.
    }

    window.LSPediaIdioma = {
        obtener: () => idioma,
        cambiar: cambiarIdioma,
        traduccionIngles: (palabra) => MAPA_DICC.get(norm(palabra)) || null
    };

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once:true });
    else iniciar();
})();
