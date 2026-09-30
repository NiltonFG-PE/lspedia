/* LSPedia — traducción ES/EN de la sección "Sobre Nosotros".
   Complementa js/i18n.js sin modificar la lógica del video ni los saltos
   por tiempo: solo cambia los textos visibles y los restaura al volver a ES. */
(function(){
    'use strict';

    const TRADUCCIONES = {
        titulos: {
            '0': 'An important point',
            '85': 'What is LSPedia?',
            '185': 'A project that grows with support',
            '396': 'Your ideas and contributions are welcome'
        },
        bloques: {
            '0': [
                'Some people may think that LSPedia is trying to appropriate the work of the Deaf community or teach signs to hearing people. That is not the purpose of the project.',
                'We recognize that the Deaf community has the right to teach its own language. We also value the work of Deaf people who participate as language models, teachers, and in other roles connected with sign language.',
                'LSPedia aims to support accessibility. Much of the information available in Peru is expressed in Spanish. A hearing person who knows Spanish and sign language can contribute through interpreting and the production of accessible content.',
                'When a Deaf person accesses these videos, they can better understand certain terms and recognize them later in documents, publications, studies, work, and other everyday contexts.'
            ],
            '85': [
                'The internet offers a vast amount of information through computers and phones: books, news, social media, videos, and many other resources. In Peru, much of this content is available primarily in Spanish.',
                'For many Deaf people, accessing all that information is not always simple. Sign language may be their first language, while some terms in written Spanish can be difficult to understand. That difference can become a barrier to accessing information.',
                'LSPedia was created to help reduce that barrier. It is a visual dictionary available on the web that presents words, meanings, and examples through videos supported by Peruvian Sign Language.',
                'The videos are complemented by illustrations that help represent ideas clearly. The goal is to make concepts easier to understand and progressively expand vocabulary and knowledge.',
                'LSPedia is available so that more Deaf people can understand useful words and access information from different areas with greater independence.'
            ],
            '185': [
                'Creating and maintaining LSPedia involves designing and improving the website, adapting it for computers and phones, recording videos, editing them, and preparing new content. It is a project with many tasks and ongoing maintenance costs.',
                'The project is currently funded with personal resources. It does not receive funding from an organization or from the government.',
                'LSPedia can continue to grow with voluntary support. There are several ways to contribute:'
            ],
            '396': [
                'Thank you for your support. Every contribution helps LSPedia continue to grow as a resource focused on accessibility, inclusion, and learning for Deaf people.'
            ]
        },
        lista185: [
            'Suggest a new word. If you find a term that is missing from the dictionary — for example, a word used at work, at an institute, or at university — you can send it through the suggestion form. After review, its interpretation can be prepared and a new video may be added.',
            'Share ideas or contribute vocabulary. You can send proposals for improving LSPedia. If you are Deaf, you can also record a video and offer it as a contribution to the vocabulary. LSPedia is a free project, so these contributions are voluntary.',
            'Share your experience. If you are Deaf, an interpreter, or part of an institute, university, association, or the Deaf community, your experience can provide valuable information for improving the project.',
            'Financial support, on an optional basis. Maintaining the website and producing new videos requires resources. Anyone who wishes to contribute voluntarily can get in touch privately through the WhatsApp number shown on the website.',
            'Interpreting and translation. If you need a document interpreted or translated into sign language, or require interpreting support for another project, the details can be coordinated directly. Video-call support may also be considered when a Deaf person needs to communicate in a service and no interpreter is available.'
        ],
        apoyo: {
            'Sugerir palabra': 'Suggest a word',
            '¿Falta un término? Envíanos tu propuesta.': 'Is a term missing? Send us your suggestion.',
            'Enviar una idea': 'Send an idea',
            'Comparte sugerencias para mejorar LSPedia.': 'Share suggestions for improving LSPedia.',
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
        if(el && originales.has(el)) originales.get(el) !== undefined && (el.textContent = originales.get(el));
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

        document.addEventListener('click', () => {
            setTimeout(() => aplicarSobreNosotros(idiomaActual()), 0);
        }, true);
    }

    function cargarPresentacionPremium(){
        if(window.LSPediaNosotrosPremium){
            iniciar();
            return;
        }
        const existente = document.querySelector('script[data-lspedia-nosotros-premium]');
        if(existente){
            existente.addEventListener('load', iniciar, { once:true });
            return;
        }
        const script = document.createElement('script');
        script.src = 'js/nosotros-premium.js?v=20260930-1';
        script.async = false;
        script.dataset.lspediaNosotrosPremium = '1';
        script.onload = iniciar;
        script.onerror = iniciar;
        document.head.appendChild(script);
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cargarPresentacionPremium, { once: true });
    else cargarPresentacionPremium();
})();
