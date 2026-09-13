/* LSPedia — traducción ES/EN de la sección "Sobre Nosotros".
   Complementa js/i18n.js sin modificar la lógica del video ni los saltos
   por tiempo: solo cambia los textos visibles y los restaura al volver a ES. */
(function(){
    'use strict';

    const TRADUCCIONES = {
        titulos: {
            '0': '⚠️ An important point',
            '85': '❓ What is LSPedia?',
            '185': '🌱 A project that grows thanks to your support',
            '396': '💌 Your ideas, opinions, advice, and any other form of help or support are very welcome'
        },
        bloques: {
            '0': [
                'Some people might think that LSPedia is trying to take advantage of the Deaf community through cultural appropriation and then use that to teach signs to hearing people.',
                '❌ That is not true at all. Why? We know that the Deaf community has the right to teach its own language: sign language. We know Deaf people whose work is to help other Deaf people: some work as interpreters 🧏, others as language models, and others as teachers who give classes because they have been trained and prepared for that — and we applaud that 👏.',
                'LSPedia is not an enemy; on the contrary, it seeks to help 🤝. We know that much of the available information is spoken in Spanish. To help Deaf people, a hearing person who knows Spanish and sign language can contribute by interpreting and making those videos available 🎥.',
                'When a Deaf person watches the videos, they receive real help and can understand the information. Later, when they see information on the internet or in publications and come across those words again, they will already be able to understand them. That can be very useful in their work and in many other activities 💼.'
            ],
            '85': [
                'On the internet, on your computer 💻 or your phone 📱, you can find a huge amount of information: books 📚, news 📰, social media, Facebook, WhatsApp, YouTube, and much more. In Peru, most of that information is in spoken Spanish.',
                'Let me ask you: is it easy for a Deaf person to access all that information? The truth is, no 🚫. A Deaf person may use sign language as their first language, while much of that information is spoken, and they may also see many written words that are difficult to understand. This can become like a wall 🧱 that blocks accessibility. It is a real problem.',
                'That is why LSPedia was created. ✨ What is it? It is a dictionary 📖 that you can access through a web link 🔗. You open it and find a visual website. There you can see the meaning of words with examples, presented in videos 🎬 and sign language. You can learn from them, and it can feel like discovering something new 💡.',
                'Those videos are accompanied by illustrations 🖼️ that help you imagine the idea and understand it better. It is practical support that can help your personal progress by increasing your knowledge 📈.',
                'This is available so that any Deaf person can learn new and useful words, making the kinds of information mentioned at the beginning more accessible to you. ✅'
            ],
            '185': [
                'Creating LSPedia involves many kinds of work: designing the website for computers and phones 🖥️📱, recording videos, and editing them 🎞️. It is a large project with many different tasks, and that also involves expenses 💸.',
                'How is it being funded? Personally, with my own resources 👤. Is an organization or the government providing money? No. Maybe in the future, perhaps.',
                'LSPedia does need support. Would you like to help? 🙌 Thank you very much. How can you do it? In several ways. Here are five 👇'
            ],
            '396': [
                'Thank you for your support 🙏. Because of it, LSPedia keeps moving forward, helping promote inclusion and learning for Deaf people. 🤟💙'
            ]
        },
        lista185: [
            '1️⃣ Suggest a new word: on the website you will find the word dictionary. If you notice that a word is missing — perhaps at work, at an institute, or at university a teacher mentioned a word you do not understand — you can suggest it with the button on the left ⬅️. A form 📝 will open where you enter your name, identify yourself (Deaf, hearing, or interpreter), and write the word. After you send it, the word can be interpreted and a new video can be added. 📤',
            '💭 2- Share ideas or record vocabulary: using that same button, you can leave an idea or suggestion for improving LSPedia. If you are Deaf, you can also record yourself at home 🏠 and send the video as a contribution to the vocabulary. Remember that LSPedia is a free project, so collaboration is voluntary 💛 (payment cannot be offered for it 🚫💰).',
            '🗣️ 3- Share your experience: if you are Deaf, an interpreter, or represent an institute, university, or association, or if you have contact with the Deaf community, your experience can be very helpful. Share it with us.',
            '💬 4- Financial support (optional): maintaining the website and recording and editing videos cost money. If you would like to help, you can do so voluntarily by writing privately to the WhatsApp number shown on the website.',
            '🧏‍♂️ 5- Interpreting and translation: if you have a document that you would like interpreted or translated into sign language, or another project where interpretation support is needed, you can coordinate the details directly. Also, if you are Deaf and there is no interpreter available at a hospital 🏥 or bank 🏦, support may be provided by video call 📹.'
        ],
        apoyo: {
            'Sugerir palabra': 'Suggest a word',
            '¿Falta un término? Envíanos tu propuesta.': 'Is a term missing? Send us your suggestion.',
            'Enviar una idea': 'Send an idea',
            'Comparte sugerencias para mejorar LSPedia.': 'Share suggestions to improve LSPedia.',
            'Apoyar LSPedia': 'Support LSPedia',
            'Ayuda a mantener el proyecto gratuito y en crecimiento.': 'Help keep the project free and growing.',
            'Contratar un intérprete': 'Hire an interpreter',
            'Solicita servicios de interpretación en LSP.': 'Request Peruvian Sign Language interpreting services.'
        }
    };

    const originales = new WeakMap();

    function guardarOriginal(el){
        if(el && !originales.has(el)) originales.set(el, el.textContent);
    }

    function ponerTexto(el, texto){
        if(!el) return;
        guardarOriginal(el);
        el.textContent = texto;
    }

    function restaurar(el){
        if(el && originales.has(el)) el.textContent = originales.get(el);
    }

    function aplicarSobreNosotros(idioma){
        const seccion = document.getElementById('seccionNosotros');
        if(!seccion) return;

        const ingles = idioma === 'en';

        seccion.querySelectorAll('.nosotros-titulo-clicable[data-tiempo-nosotros]').forEach(titulo => {
            const tiempo = String(titulo.dataset.tiempoNosotros || '');
            if(ingles && TRADUCCIONES.titulos[tiempo]) ponerTexto(titulo, TRADUCCIONES.titulos[tiempo]);
            else restaurar(titulo);
        });

        seccion.querySelectorAll('.nosotros-bloque-clicable[data-tiempo-nosotros]').forEach(bloque => {
            const tiempo = String(bloque.dataset.tiempoNosotros || '');
            const textos = TRADUCCIONES.bloques[tiempo] || [];
            bloque.querySelectorAll(':scope > p').forEach((p, indice) => {
                if(ingles && textos[indice]) ponerTexto(p, textos[indice]);
                else restaurar(p);
            });

            if(tiempo === '185'){
                bloque.querySelectorAll(':scope > ul > li').forEach((li, indice) => {
                    if(ingles && TRADUCCIONES.lista185[indice]) ponerTexto(li, TRADUCCIONES.lista185[indice]);
                    else restaurar(li);
                });
            }
        });

        seccion.querySelectorAll('#nosotrosApoyoRow .nosotros-apoyo-titulo, #nosotrosApoyoRow .nosotros-apoyo-desc').forEach(el => {
            guardarOriginal(el);
            const original = originales.get(el);
            const traducido = TRADUCCIONES.apoyo[original];
            if(ingles && traducido) el.textContent = traducido;
            else el.textContent = original;
        });
    }

    function idiomaActual(){
        if(window.LSPediaIdioma && typeof window.LSPediaIdioma.obtener === 'function'){
            return window.LSPediaIdioma.obtener();
        }
        try {
            return localStorage.getItem('lspedia_idioma_v1') === 'en' ? 'en' : 'es';
        } catch(_e){
            return 'es';
        }
    }

    function iniciar(){
        aplicarSobreNosotros(idiomaActual());
        document.addEventListener('lspedia:idiomaCambiado', evento => {
            const idioma = evento && evento.detail && evento.detail.idioma
                ? evento.detail.idioma
                : idiomaActual();
            aplicarSobreNosotros(idioma);
        });

        // i18n.js vuelve a recorrer la interfaz después de algunos clics.
        // Reaplicamos nuestro texto al final del mismo ciclo para que el
        // contenido largo de Sobre Nosotros permanezca en el idioma elegido.
        document.addEventListener('click', () => {
            setTimeout(() => aplicarSobreNosotros(idiomaActual()), 0);
        }, true);
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    else iniciar();
})();
