/* LSPedia — capa EN completa de interfaz.
   Complementa i18n.js: traduce texto estático y dinámico de la app, incluidos
   Herramientas, juegos, Subtítulos, navegación, footer, estados y atributos.
   Las palabras españolas del Diccionario se conservan como contenido de
   estudio; la interfaz que las rodea sí cambia completamente a inglés. */
(function(){
    'use strict';

    const KEY = 'lspedia_idioma_v1';
    const originalsText = new WeakMap();
    const originalsAttr = new WeakMap();
    let observer = null;
    let raf = 0;

    const UI = new Map(Object.entries({
        // Navegación / portada / footer.
        'Diccionario':'Dictionary',
        'Vocabulario':'Vocabulary',
        'Herramientas':'Tools',
        'Nosotros':'About',
        'Sobre Nosotros':'About us',
        'Apoyar LSPedia':'Support LSPedia',
        'Ir a Vocabulario':'Go to Vocabulary',
        'Ir a Herramientas':'Go to Tools',
        'Ir a Jugar':'Go to Play',
        'Jugar':'Play',
        'Subtítulos':'Captions',
        'Alfabeto y números':'Alphabet & numbers',
        'Alfabeto y Números':'Alphabet & Numbers',
        'Mira, reconoce y practica letras y números':'Look, recognize, and practice letters and numbers',
        'Aprende tocando, ordenando y resolviendo':'Learn by tapping, ordering, and solving',
        'Convierte la voz en texto en tiempo real':'Turn speech into text in real time',
        'Desarrollado con corazón para potenciar la comunicación y la inclusión en el Perú.':'Developed with care to strengthen communication and inclusion in Peru.',
        'Palabras sugeridas':'Suggested words',
        'Categorías':'Categories',
        'Índice':'Index',
        'Buscar':'Search',
        'Compartir':'Share',
        'Colecciones':'Collections',
        'Atrás':'Back',
        'Volver':'Back',
        'Cerrar':'Close',
        'Anterior':'Previous',
        'Siguiente':'Next',
        'Salir':'Exit',
        'Guardar':'Save',
        'Copiar':'Copy',
        'Limpiar':'Clear',
        'Pausar':'Pause',
        'Reanudar':'Resume',
        'Detener':'Stop',
        'Pantalla completa':'Full screen',
        'Cargando…':'Loading…',
        'Cargando...':'Loading...',
        'Preparando contenido…':'Preparing content…',
        'Preparando contenido...':'Preparing content...',
        'Sin resultados':'No results',
        'Reintentar':'Try again',

        // Historial / favoritos.
        'Mi Historial de Búsqueda':'My Search History',
        'Borrar historial':'Clear history',
        'Borrar todo el historial':'Clear all history',
        'Favoritos':'Favorites',
        'Historial':'History',
        'Tu progreso':'Your progress',
        'Continuar':'Continue',
        'Aún no tienes favoritos.':'You do not have favorites yet.',
        'Aún no tienes búsquedas recientes.':'You do not have recent searches yet.',

        // Herramientas / subtítulos.
        'Subtítulos en vivo':'Live captions',
        'Probar nivel de audio':'Test audio level',
        'Escuchando el ambiente…':'Listening to your surroundings…',
        'Idioma de los subtítulos':'Caption language',
        'Empezar':'Start',
        'EN VIVO':'LIVE',
        'Consejos para captar mejor el audio:':'Tips for better audio capture:',
        'Saca el celular de la funda/bolsillo y sostenlo con el micrófono apuntando hacia los parlantes.':'Take your phone out of its case/pocket and hold it with the microphone facing the speakers.',
        'Mientras más cerca esté del parlante, mejor se transcribe: evita dejarlo sobre la pierna o mesa baja.':'The closer it is to the speaker, the better the transcription. Avoid leaving it on your leg or a low table.',
        'Si tienes audífonos con micrófono (manos libres), pruébalos: suelen captar mejor que el micrófono trasero del celular.':'If you have headphones with a microphone, try them. They often capture sound better than the phone\'s rear microphone.',
        'Evita hablar o hacer ruido cerca del celular mientras esté escuchando.':'Avoid talking or making noise near the phone while it is listening.',

        // Juegos.
        '🎮 Jugar - LSPedia':'🎮 Play - LSPedia',
        'Toca un juego. La animación te muestra qué harás.':'Tap a game. The animation shows what you will do.',
        'Adivina qué soy':'Guess what I am',
        'Mira las señas y mueve el celular':'Watch the signs and move your phone',
        'Caras y gestos':'Faces and gestures',
        'Completar la palabra':'Complete the word',
        'Completa la palabra':'Complete the word',
        'Unir con flechas':'Match with arrows',
        'Quiz':'Quiz',
        'Matemáticas':'Math',
        'Carrera matemática':'Math race',
        'Oraciones':'Sentences',
        'Mira, piensa y elige':'Look, think, and choose',
        'Junta, quita, agrupa y reparte':'Add, take away, group, and share',
        'Corre, esquiva y resuelve':'Race, dodge, and solve',
        'Ordena y escribe ideas':'Arrange and write ideas',
        'Elegir otro juego':'Choose another game',
        'Elige el nivel para practicar completando palabras con la letra que falta.':'Choose a level to practice completing words with the missing letter.',
        'Elige el nivel para practicar uniendo cada imagen con su palabra.':'Choose a level to practice matching each image with its word.',
        'Nivel':'Level',
        'Fácil':'Easy',
        'Medio':'Medium',
        'Difícil':'Hard',
        'Jugar de nuevo':'Play again',
        'Revisión de respuestas':'Answer review',
        'Precisión':'Accuracy',
        'Menú':'Menu',
        'Puntaje':'Score',
        'Correcto':'Correct',
        'Incorrecto':'Incorrect',
        'Respuesta correcta':'Correct answer',

        // Alfabetización.
        'Abecedario A-Z':'Alphabet A-Z',
        'Números 0-19':'Numbers 0-19',
        'Tipo de contenido':'Content type',
        'Letra':'Letter',
        'Número':'Number',
        'Letras':'Letters',
        'Números':'Numbers',
        'Aprender':'Learn',
        'Practicar':'Practice',

        // Buscadores / resultados.
        'Ver Seña':'View sign',
        'Ver seña':'View sign',
        'Ver más':'View more',
        'Ver menos':'View less',
        'Palabras':'Words',
        'Videos':'Videos',
        'Estadísticas':'Statistics',
        'ESTADÍSTICAS':'STATISTICS',
        'Redes Sociales':'Social media',
        'No pudimos completar la búsqueda.':'We could not complete the search.',
        'Buscando también en Vocabulario…':'Also searching Vocabulary…',
        'Cargando Diccionario…':'Loading Dictionary…',
        '¿Quisiste decir...?':'Did you mean...?',
        'No encontramos resultados.':'We found no results.',
        'Sugerir palabra':'Suggest a word',
        '¿Falta un término? Envíanos tu propuesta.':'Is a term missing? Send us your suggestion.'
    }));

    const CATEGORIES = new Map(Object.entries({
        'Adjetivos':'Adjectives','Adverbios':'Adverbs','Animales':'Animals',
        'Bienestar':'Well-being','Calle':'Street','Cantidad':'Quantity','Casa':'Home',
        'Ciencia':'Science','Ciudad':'City','Colegio':'School','Colores':'Colors',
        'Comida':'Food','Comportamiento':'Behavior','Comunicación':'Communication',
        'Cortesía':'Courtesy','Cuerpo':'Body','Deportes':'Sports',
        'Descripción':'Description','Economía':'Economy','Educación':'Education',
        'Emociones':'Emotions','Familia':'Family','Filosofía':'Philosophy',
        'Geografía':'Geography','Habilidades':'Skills','Naturaleza':'Nature',
        'Números':'Numbers','Ocio':'Leisure','Personas':'People','Política':'Politics',
        'Preguntas':'Questions','Profesiones':'Professions','Psicología':'Psychology',
        'Reflexión':'Reflection','Ropa':'Clothing','Salud':'Health','Saludos':'Greetings',
        'Sociedad':'Society','Tecnología':'Technology','Tiempo':'Time','Trabajo':'Work',
        'Trámites':'Procedures','Transporte':'Transport','Universidad':'University',
        'Valores':'Values','Verbos':'Verbs'
    }));

    const COLLECTIONS = new Map(Object.entries({
        'Estaciones del año':'Seasons of the year',
        'meses del año':'months of the year',
        'Meses del año':'Months of the year'
    }));

    const VOCAB_EN = new Map(Object.entries({
        'Adulto':'Adult','Alto':'Tall','Ancho':'Wide','Angosto':'Narrow','Antiguo':'Old',
        'Bajo':'Short','Barato':'Cheap','Caro':'Expensive','Débil':'Weak','Difícil':'Difficult',
        'Distraído':'Distracted','Amarillo':'Yellow','Azul':'Blue','Beige':'Beige','Blanco':'White',
        'Celeste':'Light blue','Dorado':'Golden','Guinda':'Burgundy','Marrón':'Brown','Morado':'Purple',
        'Anaranjado':'Orange','Negro':'Black','Rojo':'Red','Rosado':'Pink','Turquesa':'Turquoise',
        'Verde':'Green','Pregunta':'Question','Felicitaciones':'Congratulations','Gracias':'Thank you',
        'Por favor':'Please','Perdón':'Sorry','Bienvenido':'Welcome','Hasta luego':'See you later',
        'Buenos días':'Good morning','Buenas tardes':'Good afternoon','Buenas noches':'Good evening',
        'Cansado':'Tired','Aburrido':'Bored','Amor':'Love','Asustado':'Scared','Cariño':'Affection',
        'Celos':'Jealousy','Contento':'Happy','Enojado':'Angry','Envidia':'Envy','Esperanza':'Hope',
        'Feliz':'Happy','Extrañar':'Miss','Orgullo (negativo)':'Pride (negative)','Soledad':'Loneliness',
        'Sorprendido':'Surprised','Triste':'Sad','Vergüenza':'Embarrassment','¿Cómo?':'How?',
        '¿Cuál?':'Which?','¿Cuándo?':'When?','¿Dónde?':'Where?','¿Por qué?':'Why?','¿Qué?':'What?',
        '¿Quién?':'Who?','¿Quiénes?':'Who?','¿Cuáles?':'Which ones?','¿Cuántos?':'How many?',
        '¿Para qué?':'What for?','Abril':'April','Agosto':'August','Ahora':'Now',
        'Anteayer':'The day before yesterday','Ayer':'Yesterday','Todos los días':'Every day',
        'Diciembre':'December','Domingo':'Sunday','Enero':'January','Estaciones del año':'Seasons of the year',
        'Febrero':'February','Hoy':'Today','Invierno':'Winter','Jueves':'Thursday','Julio':'July',
        'Junio':'June','Lunes':'Monday','Mañana':'Tomorrow','Martes':'Tuesday','Marzo':'March',
        'Mayo':'May','Miércoles':'Wednesday','Noviembre':'November','Octubre':'October',
        'Otoño':'Autumn','Pasado mañana':'The day after tomorrow','Primavera':'Spring','Sábado':'Saturday',
        'Septiembre':'September','Verano':'Summer','Viernes':'Friday','Apoyar':'Support','Ayudar':'Help',
        'Examinar':'Examine','Advertir':'Warn','Practicar':'Practice','Aceptar':'Accept','Añadir':'Add',
        'Abrir':'Open','Bromear':'Joke','Abrazar':'Hug','Atender':'Attend','Aplaudir':'Applaud',
        'Escuchar':'Listen','Agradecer':'Thank','Jugar':'Play','Número':'Number','Saludos':'Greetings',
        'Muchas gracias':'Thank you very much','Gratis':'Free','Nos vemos':'See you','Hola':'Hello',
        'Chau':'Bye','Cuídate':'Take care','Educado':'Polite'
    }));

    function installVocabularyEnglishAliases(){
        const api = window.LSPediaVocabularioPublico;
        if(!api || typeof api.obtener !== 'function') return;
        try {
            api.obtener().forEach(item => {
                if(!item || !item.palabra) return;
                const english = VOCAB_EN.get(String(item.palabra).trim());
                if(!english) return;
                item.ingles = english;
                item.traduccionIngles = english;
            });
        } catch(_error) {}
    }


    const ATTR = new Map(Object.entries({
        'Pantalla completa':'Full screen',
        'Salir de Subtítulos':'Exit Captions',
        'Copiar todo el texto subtitulado':'Copy all caption text',
        'Borrar todo el historial':'Clear all history',
        'Borrar todo el historial de búsqueda':'Clear all search history',
        'Volver al menú del juego':'Back to game menu',
        'Jugar Adivina qué soy':'Play Guess what I am',
        'Jugar Caras y gestos':'Play Faces and gestures',
        'Juego Matematicas':'Math game',
        'Juego Carrera matemática':'Math race game',
        'Juego Construye la oración':'Build the sentence game',
        'Tipo de contenido':'Content type',
        'Idioma / Language':'Language'
    }));

    function language(){
        if(window.LSPediaIdioma && typeof window.LSPediaIdioma.obtener === 'function'){
            return window.LSPediaIdioma.obtener();
        }
        try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'es'; }
        catch(_e){ return 'es'; }
    }

    function translateSource(source){
        const clean = String(source || '').trim();
        if(!clean) return source;

        if(UI.has(clean)) return UI.get(clean);
        if(CATEGORIES.has(clean)) return CATEGORIES.get(clean);
        if(COLLECTIONS.has(clean)) return COLLECTIONS.get(clean);

        let m = clean.match(/^Categoría:\s*(.+)$/i);
        if(m){
            const name = CATEGORIES.get(m[1]) || m[1];
            return 'Category: ' + name;
        }
        m = clean.match(/^(\d+)\s+palabra$/i);
        if(m) return m[1] + ' word';
        m = clean.match(/^(\d+)\s+palabras$/i);
        if(m) return m[1] + ' words';
        m = clean.match(/^(\d+)\s+palabra\s+relacionada$/i);
        if(m) return m[1] + ' related word';
        m = clean.match(/^(\d+)\s+palabras\s+relacionadas$/i);
        if(m) return m[1] + ' related words';
        m = clean.match(/^Palabra\s+(\d+)$/i);
        if(m) return 'Word ' + m[1];
        m = clean.match(/^Ronda\s+(\d+)$/i);
        if(m) return 'Round ' + m[1];
        m = clean.match(/^Pregunta\s+(\d+)\s+de\s+(\d+)$/i);
        if(m) return 'Question ' + m[1] + ' of ' + m[2];
        m = clean.match(/^Compartir colección\s+(.+)$/i);
        if(m) return 'Share collection ' + (COLLECTIONS.get(m[1]) || m[1]);
        return source;
    }

    function translateTextNode(node){
        if(!node || node.nodeType !== Node.TEXT_NODE) return;
        const parent = node.parentElement;
        if(!parent || parent.closest('script,style,noscript,textarea,code,pre')) return;

        const current = String(node.nodeValue || '');
        if(!current.trim()) return;

        if(language() !== 'en'){
            const record = originalsText.get(node);
            if(record && node.nodeValue === record.translated){
                node.nodeValue = record.original;
            }
            return;
        }

        const translatedTrimmed = translateSource(current);
        if(translatedTrimmed === current) return;

        const leading = current.match(/^\s*/)?.[0] || '';
        const trailing = current.match(/\s*$/)?.[0] || '';
        const translated = leading + String(translatedTrimmed).trim() + trailing;
        originalsText.set(node, { original: current, translated });
        node.nodeValue = translated;
    }

    function translateAttributes(el){
        if(!el || el.nodeType !== Node.ELEMENT_NODE) return;
        ['title','aria-label','placeholder'].forEach(name => {
            if(!el.hasAttribute(name)) return;
            const current = el.getAttribute(name) || '';

            if(language() !== 'en'){
                const recs = originalsAttr.get(el);
                const record = recs && recs[name];
                if(record && current === record.translated) el.setAttribute(name, record.original);
                return;
            }

            const translated = ATTR.get(current) || UI.get(current) || translateSource(current);
            if(!translated || translated === current) return;

            const recs = originalsAttr.get(el) || {};
            recs[name] = { original: current, translated };
            originalsAttr.set(el, recs);
            el.setAttribute(name, translated);
        });
    }

    function walk(root){
        if(!root) return;
        if(root.nodeType === Node.TEXT_NODE){
            translateTextNode(root);
            return;
        }
        if(root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

        if(root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        let node;
        while((node = walker.nextNode())){
            if(node.nodeType === Node.TEXT_NODE) translateTextNode(node);
            else translateAttributes(node);
        }
    }

    const META_EN = {
        title: 'LSPedia - Visual Spanish Dictionary with Peruvian Sign Language',
        description: 'Free visual Spanish dictionary with definitions, images and Peruvian Sign Language (LSP) videos.'
    };
    let originalTitle = '';
    let originalDescription = '';

    function translateMetadata(){
        const desc = document.getElementById('metaDescription') || document.querySelector('meta[name="description"]');
        if(!originalTitle) originalTitle = document.title;
        if(desc && !originalDescription) originalDescription = desc.getAttribute('content') || '';

        if(language() === 'en'){
            document.title = META_EN.title;
            if(desc) desc.setAttribute('content', META_EN.description);
            const ogTitle = document.getElementById('ogTitle');
            const ogDesc = document.getElementById('ogDescription');
            if(ogTitle) ogTitle.setAttribute('content', META_EN.title);
            if(ogDesc) ogDesc.setAttribute('content', META_EN.description);
        } else {
            if(originalTitle) document.title = originalTitle;
            if(desc && originalDescription) desc.setAttribute('content', originalDescription);
        }
    }

    function apply(){
        document.documentElement.lang = language() === 'en' ? 'en' : 'es';
        installVocabularyEnglishAliases();
        walk(document.body);
        translateMetadata();
    }

    function schedule(){
        if(raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            raf = 0;
            apply();
        });
    }

    function startObserver(){
        if(observer || !document.body) return;
        observer = new MutationObserver(records => {
            records.forEach(record => {
                record.addedNodes.forEach(node => walk(node));
                if(record.type === 'characterData') translateTextNode(record.target);
            });
        });
        observer.observe(document.body, {
            childList:true,
            subtree:true,
            characterData:true
        });
    }

    function start(){
        apply();
        startObserver();

        document.addEventListener('lspedia:idiomaCambiado', () => {
            schedule();
            setTimeout(apply, 60);
            setTimeout(apply, 300);
        });
        document.addEventListener('lspedia:datosListos', schedule);
        document.addEventListener('lspedia:vocabularioPublicoListo', () => {
            installVocabularyEnglishAliases();
            schedule();
        });
        document.addEventListener('click', () => setTimeout(schedule, 0), true);
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', start, { once:true });
    } else {
        start();
    }

    window.LSPediaI18nCompleto = { aplicar: apply };
})();
