/* LSPedia — presentación editorial premium de la sección Sobre Nosotros.
   Mantiene la lógica de video y navegación; solo mejora redacción y apariencia. */
(function(){
    'use strict';

    const TITULOS_ES = {
        '0': 'Un punto importante',
        '85': '¿Qué es LSPedia?',
        '185': 'Un proyecto que crece con apoyo',
        '396': 'Tus ideas y aportes son bienvenidos'
    };

    const BLOQUES_ES = {
        '0': [
            'Algunas personas podrían pensar que LSPedia busca apropiarse del trabajo de la comunidad sorda o enseñar señas a personas oyentes. Ese no es el propósito del proyecto.',
            'Reconocemos que la comunidad sorda tiene el derecho de enseñar su propia lengua. También valoramos el trabajo de las personas sordas que participan como modelos lingüísticos, docentes y en otros espacios vinculados a la lengua de señas.',
            'LSPedia busca aportar a la accesibilidad. Gran parte de la información disponible en el Perú está expresada en español. Una persona oyente que conoce español y lengua de señas puede contribuir mediante la interpretación y la producción de contenidos accesibles.',
            'Cuando una persona sorda accede a estos videos, puede comprender mejor determinados términos y reconocerlos después en documentos, publicaciones, estudios, trabajo y otros contextos de la vida diaria.'
        ],
        '85': [
            'En internet, desde una computadora o un celular, existe una enorme cantidad de información: libros, noticias, redes sociales, videos y otros recursos. En el Perú, gran parte de ese contenido está disponible principalmente en español.',
            'Para muchas personas sordas, acceder a toda esa información no siempre es sencillo. La lengua de señas puede ser su primera lengua y, al mismo tiempo, algunos términos del español escrito pueden resultar difíciles de comprender. Esa diferencia puede convertirse en una barrera de acceso a la información.',
            'LSPedia nació para ayudar a reducir esa barrera. Es un diccionario visual disponible en la web que presenta palabras, significados y ejemplos mediante videos con apoyo en Lengua de Señas Peruana.',
            'Los videos se complementan con ilustraciones que ayudan a representar las ideas de forma clara. El objetivo es facilitar la comprensión y ampliar progresivamente el vocabulario y el conocimiento.',
            'LSPedia está disponible para que más personas sordas puedan comprender palabras útiles y acceder con mayor autonomía a información de distintos ámbitos.'
        ],
        '185': [
            'Crear y mantener LSPedia implica diseñar y mejorar la web, adaptarla a computadoras y celulares, grabar videos, editarlos y preparar nuevos contenidos. Es un proyecto con muchas tareas y también con costos de mantenimiento.',
            'Actualmente, el proyecto se financia con recursos propios. No recibe financiamiento de una organización ni del gobierno.',
            'LSPedia puede seguir creciendo con apoyo voluntario. Hay varias formas de colaborar:'
        ],
        '396': [
            'Gracias por tu apoyo. Cada aporte permite que LSPedia siga avanzando como una herramienta orientada a la accesibilidad, la inclusión y el aprendizaje de las personas sordas.'
        ]
    };

    const LISTA_ES = [
        'Sugerir una nueva palabra. Si encuentras un término que falta en el diccionario —por ejemplo, una palabra usada en el trabajo, un instituto o la universidad— puedes enviarlo mediante el formulario de sugerencias. Después de revisarlo, puede prepararse su interpretación y añadirse un nuevo video.',
        'Compartir ideas o aportar vocabulario. Puedes enviar propuestas para mejorar LSPedia. Si eres una persona sorda, también puedes grabar un video y ofrecerlo como aporte al vocabulario. LSPedia es un proyecto gratuito, por lo que estas colaboraciones son voluntarias.',
        'Compartir tu experiencia. Si eres una persona sorda, intérprete, o formas parte de un instituto, universidad, asociación o de la comunidad sorda, tu experiencia puede aportar información valiosa para mejorar el proyecto.',
        'Apoyo económico, de manera opcional. Mantener la web y producir nuevos videos requiere recursos. Quien desee colaborar voluntariamente puede comunicarse de forma privada mediante el WhatsApp indicado en la página.',
        'Interpretación y traducción. Si necesitas interpretar o traducir un documento a lengua de señas, o requieres apoyo de interpretación para otro proyecto, puedes coordinar los detalles directamente. También puede evaluarse apoyo por videollamada cuando una persona sorda necesita comunicarse en un servicio y no dispone de intérprete.'
    ];

    function idiomaActual(){
        if(window.LSPediaIdioma && typeof window.LSPediaIdioma.obtener === 'function'){
            return window.LSPediaIdioma.obtener();
        }
        try { return localStorage.getItem('lspedia_idioma_v1') === 'en' ? 'en' : 'es'; }
        catch(_e){ return 'es'; }
    }

    function aplicarTextoEspanol(){
        if(idiomaActual() !== 'es') return;
        const seccion = document.getElementById('seccionNosotros');
        if(!seccion) return;

        seccion.querySelectorAll('.nosotros-titulo-clicable[data-tiempo-nosotros]').forEach(function(titulo){
            const tiempo = String(titulo.dataset.tiempoNosotros || '');
            if(TITULOS_ES[tiempo]) titulo.textContent = TITULOS_ES[tiempo];
        });

        seccion.querySelectorAll('.nosotros-bloque-clicable[data-tiempo-nosotros]').forEach(function(bloque){
            const tiempo = String(bloque.dataset.tiempoNosotros || '');
            const textos = BLOQUES_ES[tiempo] || [];
            bloque.querySelectorAll(':scope > p').forEach(function(parrafo, indice){
                if(textos[indice]) parrafo.textContent = textos[indice];
            });
            if(tiempo === '185'){
                bloque.querySelectorAll(':scope > ul > li').forEach(function(item, indice){
                    if(LISTA_ES[indice]) item.textContent = LISTA_ES[indice];
                });
            }
        });
    }

    function inyectarEstilos(){
        if(document.getElementById('lspedia-nosotros-premium-estilos')) return;
        const style = document.createElement('style');
        style.id = 'lspedia-nosotros-premium-estilos';
        style.textContent = `
            #seccionNosotros .nosotros-contenido{
                color:#334155;
                font-family:"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
                font-size:16px;
                line-height:1.75;
                text-rendering:optimizeLegibility;
                -webkit-font-smoothing:antialiased;
            }
            #seccionNosotros .nosotros-titulo-clicable{
                position:relative;
                margin:30px 0 12px;
                padding:0 0 0 15px;
                border-left:3px solid #2f80ed;
                color:#102a43;
                font-family:"Poppins","Segoe UI",sans-serif;
                font-size:clamp(1.08rem,2vw,1.28rem);
                font-weight:700;
                line-height:1.35;
                letter-spacing:-.018em;
                text-wrap:balance;
            }
            #seccionNosotros .nosotros-bloque-clicable{
                margin:0 0 18px;
                padding:clamp(18px,2.6vw,26px);
                border:1px solid #e4ebf3;
                border-radius:18px;
                background:linear-gradient(180deg,#ffffff 0%,#fbfdff 100%);
                box-shadow:0 10px 30px rgba(15,39,66,.055);
                color:#344054;
                font-size:1rem;
                line-height:1.78;
                letter-spacing:.002em;
            }
            #seccionNosotros .nosotros-bloque-clicable p{
                max-width:76ch;
                margin:0 0 1rem;
                text-wrap:pretty;
            }
            #seccionNosotros .nosotros-bloque-clicable p:last-child{margin-bottom:0;}
            #seccionNosotros .nosotros-bloque-clicable ul{
                list-style:none;
                counter-reset:lspedia-nosotros-item;
                margin:1.2rem 0 0;
                padding:0;
                display:grid;
                gap:12px;
            }
            #seccionNosotros .nosotros-bloque-clicable li{
                counter-increment:lspedia-nosotros-item;
                position:relative;
                margin:0;
                padding:14px 16px 14px 54px;
                border:1px solid #e7edf5;
                border-radius:14px;
                background:#fff;
                color:#344054;
                line-height:1.68;
                box-shadow:0 3px 12px rgba(15,39,66,.035);
                text-wrap:pretty;
            }
            #seccionNosotros .nosotros-bloque-clicable li::before{
                content:counter(lspedia-nosotros-item, decimal-leading-zero);
                position:absolute;
                left:14px;
                top:14px;
                display:grid;
                place-items:center;
                width:28px;
                height:28px;
                border-radius:9px;
                background:#eef5ff;
                color:#1769d2;
                font-family:"Poppins","Segoe UI",sans-serif;
                font-size:.72rem;
                font-weight:800;
                letter-spacing:.02em;
            }
            #seccionNosotros .nosotros-bloque-activo{
                border-color:#cfe0f5;
                box-shadow:0 12px 34px rgba(28,91,166,.09);
            }
            #seccionNosotros .nosotros-apoyo-titulo{
                font-family:"Poppins","Segoe UI",sans-serif;
                font-weight:700;
                letter-spacing:-.012em;
            }
            #seccionNosotros .nosotros-apoyo-desc{
                font-family:"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
                line-height:1.55;
            }
            @media(max-width:767.98px){
                #seccionNosotros .nosotros-contenido{font-size:15.5px;line-height:1.7;}
                #seccionNosotros .nosotros-titulo-clicable{margin-top:24px;padding-left:12px;}
                #seccionNosotros .nosotros-bloque-clicable{padding:17px 15px;border-radius:16px;}
                #seccionNosotros .nosotros-bloque-clicable li{padding:13px 13px 13px 49px;}
                #seccionNosotros .nosotros-bloque-clicable li::before{left:12px;top:13px;}
            }
            @media(prefers-reduced-motion:reduce){
                #seccionNosotros *{scroll-behavior:auto!important;}
            }
        `;
        document.head.appendChild(style);
    }

    function iniciar(){
        inyectarEstilos();
        aplicarTextoEspanol();
        document.addEventListener('lspedia:idiomaCambiado', function(evento){
            const idioma = evento && evento.detail ? evento.detail.idioma : idiomaActual();
            if(idioma === 'es') requestAnimationFrame(aplicarTextoEspanol);
        });
    }

    window.LSPediaNosotrosPremium = { aplicar: aplicarTextoEspanol };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once:true });
    else iniciar();
})();
