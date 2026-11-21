/* Situaciones reales y talleres visuales de español escrito en LSPedia (3 niveles, 35 chats). */
(function(root){
"use strict";
const data = {
  "levels": [
    {
      "id": 1,
      "icon": "🌱",
      "name": "Primeras conversaciones",
      "desc": "Mensajes cotidianos, ser/estar/tener, preposiciones y frases claras."
    },
    {
      "id": 2,
      "icon": "🔗",
      "name": "Conectar y explicar",
      "desc": "Conectores (porque, pero, aunque, entonces), conjugaciones y gestiones."
    },
    {
      "id": 3,
      "icon": "💬",
      "name": "Conversación real",
      "desc": "Charlas completas de estudio, trabajo, viajes, opiniones y acuerdos."
    }
  ],
  "scenarios": [
    {
      "id": "taller-ser-estar-tener",
      "level": 1,
      "avatar": "🙋",
      "name": "Grupo del taller",
      "situation": "Usar bien: ser, estar y tener",
      "place": "Verbos · Ser/Estar/Tener",
      "duration": "5–6 min",
      "goal": "Diferencia cuándo usar ser (quién eres), estar (dónde y cómo estás) y tener (edad, sensaciones y planes).",
      "closing": "¡Muy bien! Usaste ser, estar y tener con mucha claridad. ¡Bienvenido al taller! 👋",
      "turns": [
        {
          "prompt": "¡Hola! Bienvenido al taller de lectura. ¿Puedes presentarte y decir de dónde eres?",
          "model": "Hola a todos. Soy Luis, soy de Trujillo y soy estudiante.",
          "alternatives": [
            "Hola. Mi nombre es Ana y soy de Cajamarca.",
            "Buenas tardes. Soy Carlos, soy diseñador y vivo en Lima."
          ],
          "options": [
            {
              "label": "Con «soy» (identidad)",
              "text": "Hola a todos. Soy Luis, soy de Trujillo y soy estudiante."
            },
            {
              "label": "Nombre + origen",
              "text": "Hola. Mi nombre es Ana y soy de Cajamarca."
            },
            {
              "label": "Profesión + lugar",
              "text": "Buenas tardes. Soy Carlos, soy diseñador y vivo en Lima."
            }
          ],
          "keywords": [
            "soy",
            "nombre",
            "estudiante",
            "lima",
            "trujillo",
            "cajamarca"
          ],
          "why": "Usamos «ser» (soy) para nombre, origen y profesión.",
          "focus": {
            "type": "verbo",
            "badge": "🧩 Verbo: Ser (soy)",
            "rule": "Usa «soy» para tu nombre, ciudad de origen o actividad.",
            "highlight": [
              "soy",
              "es"
            ]
          }
        },
        {
          "prompt": "¡Mucho gusto! ¿Cuántos años tienes y qué te gusta hacer?",
          "model": "Tengo 22 años y me gusta practicar deportes.",
          "alternatives": [
            "Tengo 25 años y tengo muchas ganas de mejorar mi español.",
            "Tengo 19 años; además, me gusta leer libros ilustrados."
          ],
          "options": [
            {
              "label": "Edad con «tengo»",
              "text": "Tengo 22 años y me gusta practicar deportes."
            },
            {
              "label": "«Tengo» + objetivo",
              "text": "Tengo 25 años y tengo muchas ganas de mejorar mi español."
            },
            {
              "label": "«Tengo» + «además»",
              "text": "Tengo 19 años; además, me gusta leer libros ilustrados."
            }
          ],
          "keywords": [
            "tengo",
            "anos",
            "gusta"
          ],
          "why": "En español la edad siempre usa «tener»: «Tengo 22 años» (nunca «soy 22 años»).",
          "focus": {
            "type": "verbo",
            "badge": "🧩 Verbo: Tener (edad)",
            "rule": "Usa «tengo ___ años» para decir tu edad.",
            "highlight": [
              "tengo",
              "años"
            ]
          }
        },
        {
          "prompt": "¿Cómo te sientes hoy y desde dónde te conectas?",
          "model": "Hoy estoy muy contento y estoy conectado desde mi casa.",
          "alternatives": [
            "Estoy un poco cansado, pero estoy feliz de participar.",
            "Estoy bien y estoy en la biblioteca de mi universidad."
          ],
          "options": [
            {
              "label": "Estado + lugar (estoy)",
              "text": "Hoy estoy muy contento y estoy conectado desde mi casa."
            },
            {
              "label": "«Estoy» + «, pero»",
              "text": "Estoy un poco cansado, pero estoy feliz de participar."
            },
            {
              "label": "Ubicación con «estoy en»",
              "text": "Estoy bien y estoy en la biblioteca de mi universidad."
            }
          ],
          "keywords": [
            "estoy",
            "casa",
            "contento",
            "bien",
            "cansado"
          ],
          "why": "Usamos «estar» (estoy) para emociones temporales y para indicar dónde te encuentras.",
          "focus": {
            "type": "verbo",
            "badge": "🧩 Verbo: Estar (estoy)",
            "rule": "Usa «estoy» para cómo te sientes y dónde estás (no «soy»).",
            "highlight": [
              "estoy"
            ]
          },
          "reactions": {
            "contrast": "Qué bueno que igual te animaste a entrar hoy.",
            "reason": "Qué gusto saber que te sientes cómodo."
          }
        },
        {
          "prompt": "Hacemos una pausa de diez minutos. ¿Tienes hambre, sed o alguna duda antes de seguir?",
          "model": "Tengo un poco de sed, pero no tengo ninguna duda.",
          "alternatives": [
            "Tengo hambre, así que voy a comer algo rápido.",
            "No tengo hambre, pero sí tengo una duda sobre el ejercicio."
          ],
          "options": [
            {
              "label": "Sensación: «tengo sed»",
              "text": "Tengo un poco de sed, pero no tengo ninguna duda."
            },
            {
              "label": "«Tengo hambre» + «así que»",
              "text": "Tengo hambre, así que voy a comer algo rápido."
            },
            {
              "label": "«Tengo una duda»",
              "text": "No tengo hambre, pero sí tengo una duda sobre el ejercicio."
            }
          ],
          "keywords": [
            "tengo",
            "sed",
            "hambre",
            "duda"
          ],
          "why": "Sensaciones físicas y dudas usan «tener»: tengo hambre, tengo sed, tengo frío, tengo una duda.",
          "focus": {
            "type": "verbo",
            "badge": "🧩 Verbo: Tener (sensaciones)",
            "rule": "Usa «tengo hambre / sed / frío / una duda» (no «estoy hambre»).",
            "highlight": [
              "tengo",
              "sed",
              "hambre",
              "duda"
            ]
          },
          "reactions": {
            "yes": "Aprovecha estos diez minutos para recargar energías.",
            "contrast": "Perfecto, cualquier duda la vemos al volver."
          }
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "taller-preposiciones-concordancia",
      "level": 1,
      "avatar": "📍",
      "name": "Daniel",
      "situation": "Preposiciones (al, del, en) y concordancia",
      "place": "Preposiciones · Género",
      "duration": "6–7 min",
      "goal": "Practica usar al, del, a la, en el y concordar artículos y plurales (la casa, el problema, dos kilos).",
      "closing": "¡Excelente! Usaste muy bien las preposiciones y la concordancia de género y número. 👍",
      "turns": [
        {
          "prompt": "Hola. ¿A dónde vas ahora? Necesito pasarte unos documentos.",
          "model": "Hola, Daniel. Ahora voy al centro y luego voy a la universidad.",
          "alternatives": [
            "Estoy yendo al trabajo, pero puedo pasar por la plaza.",
            "Ahora voy a casa porque tengo que recoger una carpeta."
          ],
          "options": [
            {
              "label": "«al» y «a la»",
              "text": "Hola, Daniel. Ahora voy al centro y luego voy a la universidad."
            },
            {
              "label": "«al trabajo»",
              "text": "Estoy yendo al trabajo, pero puedo pasar por la plaza."
            },
            {
              "label": "«a casa»",
              "text": "Ahora voy a casa porque tengo que recoger una carpeta."
            }
          ],
          "keywords": [
            "al",
            "a la",
            "casa",
            "centro",
            "trabajo",
            "universidad"
          ],
          "why": "«A + el» siempre se une en «al» (voy al centro, al trabajo). Con femenino se usa «a la» (a la plaza).",
          "focus": {
            "type": "preposicion",
            "badge": "📍 Preposición: al / a la / a casa",
            "rule": "Usa «al» (a + el) para lugares masculinos y «a la» para femeninos.",
            "highlight": [
              "al",
              "a la",
              "a casa"
            ]
          }
        },
        {
          "prompt": "¿Por qué zona estás exactamente para encontrarnos?",
          "model": "Estoy en el paradero, muy cerca del parque principal.",
          "alternatives": [
            "Estoy en la esquina de la avenida, frente al banco.",
            "Ahora estoy en el mercado, al lado de la farmacia."
          ],
          "options": [
            {
              "label": "«en el» y «del»",
              "text": "Estoy en el paradero, muy cerca del parque principal."
            },
            {
              "label": "«en la» y «al»",
              "text": "Estoy en la esquina de la avenida, frente al banco."
            },
            {
              "label": "«al lado de la»",
              "text": "Ahora estoy en el mercado, al lado de la farmacia."
            }
          ],
          "keywords": [
            "en el",
            "en la",
            "del",
            "paradero",
            "parque",
            "banco"
          ],
          "why": "«De + el» se contrae en «del» (cerca del parque). Para ubicación usa «en el» o «en la».",
          "focus": {
            "type": "preposicion",
            "badge": "📍 Preposición: en el / en la / del",
            "rule": "Usa «en el / en la» para ubicación y «del» (de + el) para referencias.",
            "highlight": [
              "en el",
              "en la",
              "del",
              "al lado de"
            ]
          }
        },
        {
          "prompt": "¿Cuántas copias del documento necesitas y de qué color la carpeta?",
          "model": "Necesito tres copias del documento y una carpeta azul.",
          "alternatives": [
            "Tráeme dos copias y un folder verde, por favor.",
            "Solo necesito cuatro hojas y la carpeta roja."
          ],
          "options": [
            {
              "label": "Plural + femenino",
              "text": "Necesito tres copias del documento y una carpeta azul."
            },
            {
              "label": "«dos copias» + «un»",
              "text": "Tráeme dos copias y un folder verde, por favor."
            },
            {
              "label": "«cuatro hojas» + «la»",
              "text": "Solo necesito cuatro hojas y la carpeta roja."
            }
          ],
          "keywords": [
            "copias",
            "carpeta",
            "hojas",
            "documento",
            "tres",
            "dos"
          ],
          "why": "Con números mayores a 1 el sustantivo va en plural (tres copias, cuatro hojas) y el artículo concuerda en género (una carpeta, un folder).",
          "focus": {
            "type": "concordancia",
            "badge": "🧩 Concordancia: género y plural",
            "rule": "Cuida el artículo (un/una, el/la) y el plural con cantidades (tres copias).",
            "highlight": [
              "tres copias",
              "dos copias",
              "cuatro hojas",
              "una carpeta",
              "la carpeta",
              "un folder"
            ]
          }
        },
        {
          "prompt": "Hubo un pequeño problema con la impresora. ¿Puedes venir conmigo a la librería del frente?",
          "model": "Sí, voy contigo a la librería para resolver el problema rápido.",
          "alternatives": [
            "Claro, vamos juntos al local del frente para imprimir las hojas.",
            "No hay problema. Te espero en la puerta de la librería."
          ],
          "options": [
            {
              "label": "«contigo» + «el problema»",
              "text": "Sí, voy contigo a la librería para resolver el problema rápido."
            },
            {
              "label": "«al local del frente»",
              "text": "Claro, vamos juntos al local del frente para imprimir las hojas."
            },
            {
              "label": "«en la puerta de la»",
              "text": "No hay problema. Te espero en la puerta de la librería."
            }
          ],
          "keywords": [
            "contigo",
            "problema",
            "libreria",
            "al",
            "del"
          ],
          "why": "Recuerda: «el problema» es masculino (no «la problema») y «con + ti» se escribe «contigo».",
          "focus": {
            "type": "concordancia",
            "badge": "🧩 «El problema» y «contigo»",
            "rule": "Usa «el problema» (masculino) y «contigo» (no «con ti»).",
            "highlight": [
              "contigo",
              "el problema",
              "a la",
              "al",
              "del"
            ]
          }
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "emergencia-clinica",
      "level": 1,
      "tone": "formal",
      "avatar": "🚑",
      "name": "Recepción de clínica",
      "situation": "Pedir atención médica y comunicación escrita",
      "place": "Salud · Comunidad sorda",
      "duration": "4–5 min",
      "goal": "Practica avisar que eres persona sorda, explicar un malestar con «tengo/estoy» y pedir indicaciones por escrito.",
      "closing": "Listo. Ya anotamos que prefiere comunicación escrita y pasamos su ficha al médico. Tome asiento, por favor.",
      "turns": [
        {
          "prompt": "Buenas tardes. Bienvenido a la clínica. ¿En qué puedo ayudarle?",
          "model": "Buenas tardes. Soy persona sorda y prefiero comunicarme por escrito. Necesito atención médica.",
          "alternatives": [
            "Hola. Soy sordo y necesito ver a un médico. Por favor, escríbame aquí.",
            "Buenas tardes. Necesito una consulta médica y prefiero leer las indicaciones por escrito."
          ],
          "options": [
            {
              "label": "🪪 Presentarme + «por escrito»",
              "text": "Buenas tardes. Soy persona sorda y prefiero comunicarme por escrito. Necesito atención médica."
            },
            {
              "label": "💬 Directo y claro",
              "text": "Hola. Soy sordo y necesito ver a un médico. Por favor, escríbame aquí."
            },
            {
              "label": "🤝 Formal",
              "text": "Buenas tardes. Necesito una consulta médica y prefiero leer las indicaciones por escrito."
            }
          ],
          "keywords": [
            "sord",
            "escrito",
            "medico",
            "atencion",
            "consulta"
          ],
          "why": "Usa «soy» para presentarte y di claramente que prefieres comunicación escrita.",
          "focus": {
            "type": "verbo",
            "badge": "🪪 Presentarse con «soy»",
            "formula": "🪪 Soy persona sorda  +  ✍️ prefiero por escrito",
            "rule": "Usa «soy» para presentarte y explica cómo prefieres comunicarte.",
            "highlight": [
              "soy",
              "por escrito",
              "prefiero"
            ]
          },
          "reactions": {
            "reason": "Con mucho gusto, nos comunicamos todo por escrito.",
            "yes": "Claro que sí, aquí escribimos todo con calma."
          }
        },
        {
          "prompt": "Con mucho gusto, nos comunicamos por escrito. ¿Qué molestia tiene hoy?",
          "model": "Tengo dolor de estómago desde la mañana y estoy un poco mareado.",
          "alternatives": [
            "Tengo fiebre y dolor de cabeza desde anoche.",
            "Me duele mucho la espalda y tengo dificultad para caminar."
          ],
          "options": [
            {
              "label": "🧩 «Tengo» + «estoy»",
              "text": "Tengo dolor de estómago desde la mañana y estoy un poco mareado."
            },
            {
              "label": "⏪ Con «desde anoche»",
              "text": "Tengo fiebre y dolor de cabeza desde anoche."
            },
            {
              "label": "📍 Dolor + dificultad",
              "text": "Me duele mucho la espalda y tengo dificultad para caminar."
            }
          ],
          "keywords": [
            "tengo",
            "dolor",
            "fiebre",
            "estoy",
            "desde"
          ],
          "why": "Para síntomas usamos «tengo dolor / fiebre» y «estoy mareado / cansado».",
          "focus": {
            "type": "verbo",
            "badge": "🧩 Tengo (síntoma) · Estoy (estado)",
            "formula": "🤒 tengo + dolor/fiebre  ·  😵 estoy + mareado",
            "rule": "Usa «tengo» para dolor o fiebre, y «estoy» para cómo te sientes.",
            "highlight": [
              "tengo",
              "estoy",
              "desde"
            ]
          }
        },
        {
          "prompt": "Entendido. ¿Tiene su DNI a la mano para registrar su ingreso?",
          "model": "Sí, aquí está mi DNI. ¿Cuánto tiempo tengo que esperar?",
          "alternatives": [
            "Sí, aquí tiene mi DNI. Por favor, avíseme por mensaje cuando sea mi turno.",
            "Sí, lo tengo aquí. ¿Me puede avisar tocándome el hombro o por pantalla?"
          ],
          "options": [
            {
              "label": "❓ DNI + preguntar tiempo",
              "text": "Sí, aquí está mi DNI. ¿Cuánto tiempo tengo que esperar?"
            },
            {
              "label": "📱 Pedir aviso por mensaje",
              "text": "Sí, aquí tiene mi DNI. Por favor, avíseme por mensaje cuando sea mi turno."
            },
            {
              "label": "👀 Pedir aviso visual",
              "text": "Sí, lo tengo aquí. ¿Me puede avisar por pantalla o viniendo a llamarme?"
            }
          ],
          "keywords": [
            "dni",
            "esperar",
            "turno",
            "avis",
            "pantalla"
          ],
          "why": "En una clínica conviene pedir cómo te avisarán cuando llegue tu turno.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta y aviso visual",
            "formula": "✅ Sí, aquí está  +  ❓ ¿Cómo me avisa?",
            "rule": "Entrega el dato y pregunta cómo te avisarán sin usar solo llamado por voz.",
            "highlight": [
              "aquí está",
              "cuánto",
              "avíseme",
              "puede"
            ]
          }
        },
        {
          "prompt": "La espera es de unos quince minutos. Yo mismo iré a llamarle cuando el médico esté listo.",
          "model": "Muchas gracias. Estaré sentado cerca de la puerta para que me vea rápido.",
          "alternatives": [
            "Perfecto, gracias por la atención. Estaré atento en la sala de espera.",
            "Muchas gracias. Por favor, avise al médico que prefiero indicaciones por escrito."
          ],
          "options": [
            {
              "label": "🏁 Con «para que»",
              "text": "Muchas gracias. Estaré sentado cerca de la puerta para que me vea rápido."
            },
            {
              "label": "📍 Con «en la sala»",
              "text": "Perfecto, gracias por la atención. Estaré atento en la sala de espera."
            },
            {
              "label": "✍️ Recordatorio útil",
              "text": "Muchas gracias. Por favor, avise al médico que prefiero indicaciones por escrito."
            }
          ],
          "keywords": [
            "gracias",
            "puerta",
            "sala",
            "escrito",
            "para que"
          ],
          "why": "Indicar dónde estarás sentado ayuda a que te ubiquen fácil.",
          "focus": {
            "type": "conector",
            "badge": "🏁 Finalidad: para que",
            "formula": "📍 Estaré cerca  +  🏁 para que  +  me vea",
            "rule": "Agradece y confirma dónde estarás esperando.",
            "highlight": [
              "gracias",
              "estaré",
              "para que",
              "por escrito"
            ]
          }
        }
      ]
    },
    {
      "id": "casa-mama",
      "level": 1,
      "avatar": "👩",
      "name": "Mamá",
      "situation": "Avisar que ya vas a casa",
      "place": "Familia",
      "duration": "3–4 min",
      "goal": "Practica respuestas breves, claras y amables.",
      "closing": "Perfecto. Te espero. Cuídate al venir. ❤️",
      "turns": [
        {
          "prompt": "Hola. ¿Ya saliste?",
          "model": "Sí, mamá. Ya salí y estoy en camino.",
          "alternatives": [
            "Sí, ya salí. Estoy yendo a casa.",
            "Sí, mamá. Ya voy para la casa."
          ],
          "keywords": [
            "sal",
            "camino",
            "voy"
          ],
          "why": "Para avisar dónde estás, usa una idea completa: qué haces + hacia dónde vas.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Pasado",
            "rule": "Para avisar dónde estás, usa una idea completa: qué haces + hacia dónde vas.",
            "highlight": [
              "tuve",
              "salí",
              "fui",
              "hice",
              "compré",
              "elegimos",
              "revisé",
              "reinicié"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, mamá. Ya salí y estoy en camino."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, ya salí. Estoy yendo a casa."
            },
            {
              "label": "Alternativa",
              "text": "Sí, mamá. Ya voy para la casa."
            }
          ],
          "reactions": {
            "no": "Avísame apenas salgas, hijo, no te demores mucho.",
            "reason": "Gracias por avisarme, ven con cuidado."
          }
        },
        {
          "prompt": "¿En qué parte estás ahora?",
          "model": "Estoy cerca del paradero principal.",
          "alternatives": [
            "Estoy en el paradero principal.",
            "Estoy cerca del paradero, esperando el bus."
          ],
          "keywords": [
            "paradero",
            "cerca",
            "bus"
          ],
          "why": "Con “estar” puedes indicar tu ubicación: Estoy + lugar.",
          "focus": {
            "type": "verbo",
            "badge": "🧩 Verbo: Estar",
            "rule": "Con “estar” puedes indicar tu ubicación: Estoy + lugar.",
            "highlight": [
              "estoy",
              "estamos",
              "en el",
              "en la",
              "cerca del"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Estoy cerca del paradero principal."
            },
            {
              "label": "Otra forma natural",
              "text": "Estoy en el paradero principal."
            },
            {
              "label": "Alternativa",
              "text": "Estoy cerca del paradero, esperando el bus."
            }
          ]
        },
        {
          "prompt": "¿Ya pasó el bus?",
          "model": "Todavía no. Estoy esperando el bus.",
          "alternatives": [
            "Aún no pasa. Sigo esperando.",
            "No todavía. Estoy esperando."
          ],
          "keywords": [
            "esper",
            "todavia",
            "aun",
            "bus"
          ],
          "why": "“Todavía no” y “aún no” sirven para decir que algo no ha sucedido.",
          "focus": {
            "type": "conector",
            "badge": "⏱️ Tiempo: todavía no",
            "rule": "“Todavía no” y “aún no” sirven para decir que algo no ha sucedido.",
            "highlight": [
              "todavía no"
            ]
          },
          "options": [
            {
              "label": "Con «todavía no»",
              "text": "Todavía no. Estoy esperando el bus."
            },
            {
              "label": "Con «aún no»",
              "text": "Aún no pasa. Sigo esperando."
            },
            {
              "label": "Alternativa",
              "text": "No todavía. Estoy esperando."
            }
          ],
          "reactions": {
            "no": "Paciencia nomás, a esta hora los buses demoran un poco.",
            "yes": "¡Qué bueno que ya subiste!"
          }
        },
        {
          "prompt": "Está bien. ¿Quieres que guarde tu comida?",
          "model": "Sí, por favor. Guárdame un poco.",
          "alternatives": [
            "Sí, por favor. Voy a comer cuando llegue.",
            "Sí, gracias. Guárdame mi comida."
          ],
          "keywords": [
            "si",
            "favor",
            "guard",
            "gracias"
          ],
          "why": "En una petición, “por favor” hace el mensaje más amable.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "En una petición, “por favor” hace el mensaje más amable.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, por favor. Guárdame un poco."
            },
            {
              "label": "En futuro",
              "text": "Sí, por favor. Voy a comer cuando llegue."
            },
            {
              "label": "Alternativa",
              "text": "Sí, gracias. Guárdame mi comida."
            }
          ]
        },
        {
          "prompt": "¿Más o menos a qué hora llegas?",
          "model": "Creo que llegaré en unos veinte minutos.",
          "alternatives": [
            "Llegaré aproximadamente en veinte minutos.",
            "En unos veinte minutos estaré en casa."
          ],
          "keywords": [
            "minuto",
            "lleg",
            "veinte"
          ],
          "why": "Para una hora aproximada puedes usar “creo que”, “aproximadamente” o “en unos…”.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Para una hora aproximada puedes usar “creo que”, “aproximadamente” o “en unos…”.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Creo que llegaré en unos veinte minutos."
            },
            {
              "label": "En futuro",
              "text": "Llegaré aproximadamente en veinte minutos."
            },
            {
              "label": "En futuro",
              "text": "En unos veinte minutos estaré en casa."
            }
          ]
        },
        {
          "prompt": "Listo. Avísame cuando estés cerca.",
          "model": "De acuerdo, te aviso cuando esté cerca.",
          "alternatives": [
            "Sí, te aviso cuando llegue cerca.",
            "Está bien. Te escribo cuando esté por llegar."
          ],
          "keywords": [
            "aviso",
            "cerca",
            "lleg"
          ],
          "why": "“Cuando esté” usa subjuntivo porque habla de una situación futura.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "“Cuando esté” usa subjuntivo porque habla de una situación futura.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "De acuerdo, te aviso cuando esté cerca."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, te aviso cuando llegue cerca."
            },
            {
              "label": "Alternativa",
              "text": "Está bien. Te escribo cuando esté por llegar."
            }
          ]
        }
      ],
      "tone": "cercano"
    },
    {
      "id": "amigo-plaza",
      "level": 1,
      "avatar": "🧑",
      "name": "Diego",
      "situation": "Coordinar para encontrarse",
      "place": "Amigos",
      "duration": "3–4 min",
      "goal": "Practica hora, lugar y confirmaciones.",
      "closing": "Buenazo. Entonces nos vemos ahí. 👋",
      "turns": [
        {
          "prompt": "Hola, ¿puedes salir esta tarde?",
          "model": "Sí, puedo salir esta tarde.",
          "alternatives": [
            "Sí, estoy libre esta tarde.",
            "Sí, hoy en la tarde puedo."
          ],
          "keywords": [
            "si",
            "tarde",
            "puedo"
          ],
          "why": "Una respuesta clara confirma primero y luego agrega el momento.",
          "focus": {
            "type": "verbo",
            "badge": "🧩 Verbo: Estar",
            "rule": "Una respuesta clara confirma primero y luego agrega el momento.",
            "highlight": [
              "estoy",
              "estamos",
              "en el",
              "en la",
              "cerca del"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, puedo salir esta tarde."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, estoy libre esta tarde."
            },
            {
              "label": "Alternativa",
              "text": "Sí, hoy en la tarde puedo."
            }
          ],
          "reactions": {
            "no": "Uy, qué pena. Podemos dejarlo para otro día si prefieres.",
            "contrast": "No hay problema, acomodamos la hora."
          }
        },
        {
          "prompt": "¿Nos encontramos a las cinco?",
          "model": "Sí, a las cinco está bien.",
          "alternatives": [
            "Sí, nos vemos a las cinco.",
            "De acuerdo, a las cinco puedo."
          ],
          "keywords": [
            "cinco",
            "bien",
            "vemos"
          ],
          "why": "Para confirmar una hora, repítela. Así evitas confusiones.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Para confirmar una hora, repítela. Así evitas confusiones.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, a las cinco está bien."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, nos vemos a las cinco."
            },
            {
              "label": "Alternativa",
              "text": "De acuerdo, a las cinco puedo."
            }
          ]
        },
        {
          "prompt": "¿Dónde prefieres encontrarnos?",
          "model": "Podemos encontrarnos en la entrada de la plaza.",
          "alternatives": [
            "En la entrada de la plaza está bien.",
            "Prefiero la entrada principal de la plaza."
          ],
          "keywords": [
            "entrada",
            "plaza"
          ],
          "why": "Usa “en” para indicar el lugar donde se encontrarán.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Usa “en” para indicar el lugar donde se encontrarán.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Podemos encontrarnos en la entrada de la plaza."
            },
            {
              "label": "Otra forma natural",
              "text": "En la entrada de la plaza está bien."
            },
            {
              "label": "Preferencia",
              "text": "Prefiero la entrada principal de la plaza."
            }
          ]
        },
        {
          "prompt": "Yo voy a llegar caminando. ¿Tú cómo vas?",
          "model": "Yo iré en bus.",
          "alternatives": [
            "Voy a ir en bus.",
            "Iré en bus hasta el centro."
          ],
          "keywords": [
            "bus",
            "ire",
            "voy"
          ],
          "why": "“Iré” expresa una acción futura de manera breve.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "“Iré” expresa una acción futura de manera breve.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Yo iré en bus."
            },
            {
              "label": "En futuro",
              "text": "Voy a ir en bus."
            },
            {
              "label": "En futuro",
              "text": "Iré en bus hasta el centro."
            }
          ]
        },
        {
          "prompt": "Si llego antes, te escribo.",
          "model": "Perfecto. Yo también te aviso cuando llegue.",
          "alternatives": [
            "Está bien. Te aviso cuando esté cerca.",
            "Perfecto, nos escribimos cuando lleguemos."
          ],
          "keywords": [
            "aviso",
            "lleg",
            "perfecto"
          ],
          "why": "“Cuando llegue” es natural al hablar de una acción futura.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "“Cuando llegue” es natural al hablar de una acción futura.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Perfecto. Yo también te aviso cuando llegue."
            },
            {
              "label": "Otra forma natural",
              "text": "Está bien. Te aviso cuando esté cerca."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto, nos escribimos cuando lleguemos."
            }
          ]
        },
        {
          "prompt": "¿Llevo algo para tomar?",
          "model": "Sí, si puedes lleva una botella de agua.",
          "alternatives": [
            "Sí, por favor. Lleva agua.",
            "Una botella de agua estaría bien, gracias."
          ],
          "keywords": [
            "agua",
            "botella",
            "gracias",
            "favor"
          ],
          "why": "Una petición amable puede incluir “si puedes” o “por favor”.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "Una petición amable puede incluir “si puedes” o “por favor”.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, si puedes lleva una botella de agua."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, por favor. Lleva agua."
            },
            {
              "label": "Alternativa",
              "text": "Una botella de agua estaría bien, gracias."
            }
          ]
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "bodega-pan",
      "level": 1,
      "avatar": "👩",
      "name": "Rosa",
      "situation": "Comprar en una bodega",
      "place": "Compras",
      "duration": "3–4 min",
      "goal": "Practica saludos, cantidades y cortesía.",
      "closing": "Gracias. Que tenga una buena tarde. 🙂",
      "turns": [
        {
          "prompt": "Buenas tardes. ¿Qué va a llevar?",
          "model": "Buenas tardes. Quisiera dos panes y una botella de agua, por favor.",
          "alternatives": [
            "Buenas tardes. Deme dos panes y una botella de agua, por favor.",
            "Quiero dos panes y una botella de agua, por favor."
          ],
          "keywords": [
            "pan",
            "agua",
            "favor"
          ],
          "why": "“Quisiera” es una forma amable de pedir algo en una tienda.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "“Quisiera” es una forma amable de pedir algo en una tienda.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Más formal (quisiera)",
              "text": "Buenas tardes. Quisiera dos panes y una botella de agua, por favor."
            },
            {
              "label": "Otra forma natural",
              "text": "Buenas tardes. Deme dos panes y una botella de agua, por favor."
            },
            {
              "label": "Alternativa",
              "text": "Quiero dos panes y una botella de agua, por favor."
            }
          ]
        },
        {
          "prompt": "Claro. ¿Algo más?",
          "model": "Sí, también quisiera una leche.",
          "alternatives": [
            "Sí, también una leche, por favor.",
            "Sí. Agrégueme una leche, por favor."
          ],
          "keywords": [
            "leche",
            "tambien"
          ],
          "why": "“También” ayuda a añadir otro producto a la compra.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "“También” ayuda a añadir otro producto a la compra.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Más formal (quisiera)",
              "text": "Sí, también quisiera una leche."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, también una leche, por favor."
            },
            {
              "label": "Alternativa",
              "text": "Sí. Agrégueme una leche, por favor."
            }
          ]
        },
        {
          "prompt": "¿La leche grande o pequeña?",
          "model": "La pequeña, por favor.",
          "alternatives": [
            "Una pequeña, por favor.",
            "Quiero la leche pequeña."
          ],
          "keywords": [
            "peque"
          ],
          "why": "Cuando la pregunta ya da el contexto, puedes responder de forma breve pero completa.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Cuando la pregunta ya da el contexto, puedes responder de forma breve pero completa.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "La pequeña, por favor."
            },
            {
              "label": "Otra forma natural",
              "text": "Una pequeña, por favor."
            },
            {
              "label": "Alternativa",
              "text": "Quiero la leche pequeña."
            }
          ]
        },
        {
          "prompt": "Son ocho soles con cincuenta.",
          "model": "Está bien. Voy a pagar en efectivo.",
          "alternatives": [
            "De acuerdo. Pago en efectivo.",
            "Está bien, le pago en efectivo."
          ],
          "keywords": [
            "efectivo",
            "pago"
          ],
          "why": "“Voy a pagar en…” indica claramente la forma de pago.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "“Voy a pagar en…” indica claramente la forma de pago.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Está bien. Voy a pagar en efectivo."
            },
            {
              "label": "Otra forma natural",
              "text": "De acuerdo. Pago en efectivo."
            },
            {
              "label": "Alternativa",
              "text": "Está bien, le pago en efectivo."
            }
          ]
        },
        {
          "prompt": "¿Tiene sencillo?",
          "model": "Sí, tengo diez soles.",
          "alternatives": [
            "Sí, tengo un billete de diez soles.",
            "Sí, aquí tengo diez soles."
          ],
          "keywords": [
            "diez",
            "soles",
            "billete"
          ],
          "why": "En Perú, “sencillo” suele referirse a dinero para dar vuelto.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "En Perú, “sencillo” suele referirse a dinero para dar vuelto.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, tengo diez soles."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, tengo un billete de diez soles."
            },
            {
              "label": "Alternativa",
              "text": "Sí, aquí tengo diez soles."
            }
          ]
        },
        {
          "prompt": "Aquí tiene su vuelto y su compra.",
          "model": "Muchas gracias.",
          "alternatives": [
            "Gracias. Que tenga buena tarde.",
            "Muchas gracias por atenderme."
          ],
          "keywords": [
            "gracias"
          ],
          "why": "Cerrar una compra con un agradecimiento es natural y cortés.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Cerrar una compra con un agradecimiento es natural y cortés.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Muchas gracias."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias. Que tenga buena tarde."
            },
            {
              "label": "Alternativa",
              "text": "Muchas gracias por atenderme."
            }
          ]
        }
      ],
      "tone": "cordial"
    },
    {
      "id": "tarea-companero",
      "level": 1,
      "avatar": "📝",
      "name": "Andrea",
      "situation": "Hacer una tarea con un compañero",
      "place": "Tareas",
      "duration": "3–4 min",
      "goal": "Practica preguntar, repartir una tarea y confirmar qué hará cada persona.",
      "closing": "Perfecto. Entonces cada uno hace su parte y mañana juntamos todo. 👍",
      "turns": [
        {
          "prompt": "Hola. ¿Ya viste la tarea que dejó la profesora?",
          "model": "Hola, Andrea. Sí, ya vi la tarea.",
          "alternatives": [
            "Sí, ya la revisé.",
            "Hola. Sí, ya sé qué tenemos que hacer."
          ],
          "keywords": [
            "si",
            "tarea",
            "vi",
            "revis"
          ],
          "why": "Primero confirma que conoces la tarea.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Pasado",
            "rule": "Primero confirma que conoces la tarea.",
            "highlight": [
              "tuve",
              "salí",
              "fui",
              "hice",
              "compré",
              "elegimos",
              "revisé",
              "reinicié"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Hola, Andrea. Sí, ya vi la tarea."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, ya la revisé."
            },
            {
              "label": "Alternativa",
              "text": "Hola. Sí, ya sé qué tenemos que hacer."
            }
          ]
        },
        {
          "prompt": "Tenemos que hacerla entre los dos. ¿Cómo nos organizamos?",
          "model": "Podemos dividir la tarea en dos partes.",
          "alternatives": [
            "Hagamos una parte cada uno.",
            "Podemos repartir el trabajo."
          ],
          "keywords": [
            "dividir",
            "partes",
            "repart"
          ],
          "why": "Para organizarse usa verbos como dividir, repartir o hacer.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Para organizarse usa verbos como dividir, repartir o hacer.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Podemos dividir la tarea en dos partes."
            },
            {
              "label": "Otra forma natural",
              "text": "Hagamos una parte cada uno."
            },
            {
              "label": "Alternativa",
              "text": "Podemos repartir el trabajo."
            }
          ]
        },
        {
          "prompt": "Está bien. ¿Qué parte quieres hacer tú?",
          "model": "Yo puedo buscar la información.",
          "alternatives": [
            "Prefiero buscar la información.",
            "Yo me encargo de investigar."
          ],
          "keywords": [
            "buscar",
            "informacion",
            "investig"
          ],
          "why": "“Yo puedo…” o “me encargo de…” sirven para asumir una tarea.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "“Yo puedo…” o “me encargo de…” sirven para asumir una tarea.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Yo puedo buscar la información."
            },
            {
              "label": "Preferencia",
              "text": "Prefiero buscar la información."
            },
            {
              "label": "Alternativa",
              "text": "Yo me encargo de investigar."
            }
          ]
        },
        {
          "prompt": "Entonces yo escribo las respuestas.",
          "model": "Perfecto. Después juntamos las dos partes.",
          "alternatives": [
            "Está bien. Luego unimos todo.",
            "De acuerdo. Después revisamos las dos partes."
          ],
          "keywords": [
            "despues",
            "junt",
            "partes",
            "revis"
          ],
          "why": "“Después” ayuda a ordenar lo que harán primero y lo que harán luego.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: después",
            "rule": "“Después” ayuda a ordenar lo que harán primero y lo que harán luego.",
            "highlight": [
              "después",
              "luego",
              "primero"
            ]
          },
          "options": [
            {
              "label": "Con «después»",
              "text": "Perfecto. Después juntamos las dos partes."
            },
            {
              "label": "Con «luego»",
              "text": "Está bien. Luego unimos todo."
            },
            {
              "label": "Con «después»",
              "text": "De acuerdo. Después revisamos las dos partes."
            }
          ]
        },
        {
          "prompt": "¿Cuándo terminamos?",
          "model": "Podemos terminar mañana por la tarde.",
          "alternatives": [
            "Mañana en la tarde estaría bien.",
            "Propongo terminar mañana."
          ],
          "keywords": [
            "mañana",
            "tarde",
            "termin"
          ],
          "why": "Una tarea necesita una fecha clara para terminar.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Una tarea necesita una fecha clara para terminar.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Podemos terminar mañana por la tarde."
            },
            {
              "label": "Otra forma natural",
              "text": "Mañana en la tarde estaría bien."
            },
            {
              "label": "Alternativa",
              "text": "Propongo terminar mañana."
            }
          ]
        },
        {
          "prompt": "¿Te envío mi parte por el grupo?",
          "model": "Sí, envíamela por el grupo, por favor.",
          "alternatives": [
            "Sí, mándamela por el grupo.",
            "Sí, así puedo revisarla."
          ],
          "keywords": [
            "si",
            "grupo",
            "envia",
            "revis"
          ],
          "why": "En una petición breve, “por favor” mantiene un tono amable.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "En una petición breve, “por favor” mantiene un tono amable.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, envíamela por el grupo, por favor."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, mándamela por el grupo."
            },
            {
              "label": "Alternativa",
              "text": "Sí, así puedo revisarla."
            }
          ]
        },
        {
          "prompt": "Listo. Te la mando cuando termine.",
          "model": "Gracias. Yo también te enviaré mi parte cuando esté lista.",
          "alternatives": [
            "Perfecto. Yo haré lo mismo.",
            "Gracias. Te envío mi parte al terminar."
          ],
          "keywords": [
            "gracias",
            "envio",
            "parte",
            "termin"
          ],
          "why": "Confirma tu propio compromiso para cerrar la coordinación.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Confirma tu propio compromiso para cerrar la coordinación.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Gracias. Yo también te enviaré mi parte cuando esté lista."
            },
            {
              "label": "Otra forma natural",
              "text": "Perfecto. Yo haré lo mismo."
            },
            {
              "label": "Alternativa",
              "text": "Gracias. Te envío mi parte al terminar."
            }
          ]
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "mascota-vecino",
      "level": 1,
      "avatar": "🐶",
      "name": "Mario",
      "situation": "Pedir ayuda para cuidar una mascota",
      "place": "Vecindario",
      "duration": "3–4 min",
      "goal": "Practica pedir un favor y explicar instrucciones simples.",
      "closing": "Listo, yo me encargo. Escríbeme si necesitas algo más. 🐾",
      "turns": [
        {
          "prompt": "Hola, vecino. ¿Todo bien?",
          "model": "Hola, Mario. Sí, todo bien. Quería pedirte un favor.",
          "alternatives": [
            "Hola. Sí, gracias. ¿Puedo pedirte un favor?",
            "Todo bien. Necesito pedirte una ayuda."
          ],
          "keywords": [
            "favor",
            "ayuda"
          ],
          "why": "Para pedir ayuda, primero puedes avisar que quieres pedir un favor.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Para pedir ayuda, primero puedes avisar que quieres pedir un favor.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Hola, Mario. Sí, todo bien. Quería pedirte un favor."
            },
            {
              "label": "Hacer pregunta",
              "text": "Hola. Sí, gracias. ¿Puedo pedirte un favor?"
            },
            {
              "label": "Alternativa",
              "text": "Todo bien. Necesito pedirte una ayuda."
            }
          ]
        },
        {
          "prompt": "Claro, dime.",
          "model": "Mañana saldré temprano. ¿Puedes darle comida a mi perro?",
          "alternatives": [
            "¿Puedes alimentar a mi perro mañana?",
            "Mañana no estaré. ¿Podrías darle comida a mi perro?"
          ],
          "keywords": [
            "manana",
            "perro",
            "comida"
          ],
          "why": "Explica cuándo necesitas ayuda y qué debe hacer la otra persona.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Explica cuándo necesitas ayuda y qué debe hacer la otra persona.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Mañana saldré temprano. ¿Puedes darle comida a mi perro?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Puedes alimentar a mi perro mañana?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Mañana no estaré. ¿Podrías darle comida a mi perro?"
            }
          ]
        },
        {
          "prompt": "Sí. ¿A qué hora come?",
          "model": "Come a las ocho de la mañana.",
          "alternatives": [
            "A las ocho de la mañana.",
            "Normalmente come a las ocho."
          ],
          "keywords": [
            "ocho",
            "mañana",
            "come"
          ],
          "why": "Para una instrucción, indica una hora concreta.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Para una instrucción, indica una hora concreta.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Come a las ocho de la mañana."
            },
            {
              "label": "Otra forma natural",
              "text": "A las ocho de la mañana."
            },
            {
              "label": "Alternativa",
              "text": "Normalmente come a las ocho."
            }
          ]
        },
        {
          "prompt": "¿Dónde está su comida?",
          "model": "Está en la cocina, al lado de la refrigeradora.",
          "alternatives": [
            "La comida está en la cocina.",
            "Está junto a la refrigeradora."
          ],
          "keywords": [
            "cocina",
            "refrigeradora"
          ],
          "why": "Usa “en”, “al lado de” o “junto a” para indicar ubicación.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Usa “en”, “al lado de” o “junto a” para indicar ubicación.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Está en la cocina, al lado de la refrigeradora."
            },
            {
              "label": "Otra forma natural",
              "text": "La comida está en la cocina."
            },
            {
              "label": "Alternativa",
              "text": "Está junto a la refrigeradora."
            }
          ]
        },
        {
          "prompt": "¿Le doy también agua?",
          "model": "Sí, por favor. Cambia el agua de su plato.",
          "alternatives": [
            "Sí, gracias. Ponle agua limpia.",
            "Sí, también necesita agua."
          ],
          "keywords": [
            "agua",
            "favor",
            "plato"
          ],
          "why": "Una instrucción clara usa un verbo de acción: cambia, pon, dale.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Una instrucción clara usa un verbo de acción: cambia, pon, dale.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, por favor. Cambia el agua de su plato."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, gracias. Ponle agua limpia."
            },
            {
              "label": "Alternativa",
              "text": "Sí, también necesita agua."
            }
          ]
        },
        {
          "prompt": "Entendido. No te preocupes.",
          "model": "Muchas gracias, Mario. Me ayudas mucho.",
          "alternatives": [
            "Gracias por ayudarme.",
            "Te agradezco mucho el favor."
          ],
          "keywords": [
            "gracias",
            "ayud",
            "favor"
          ],
          "why": "Agradecer cierra bien una petición de ayuda.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Agradecer cierra bien una petición de ayuda.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Muchas gracias, Mario. Me ayudas mucho."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias por ayudarme."
            },
            {
              "label": "Alternativa",
              "text": "Te agradezco mucho el favor."
            }
          ]
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "bus-centro",
      "level": 1,
      "avatar": "🚌",
      "name": "Cobrador",
      "situation": "Viajar en bus al centro",
      "place": "Transporte",
      "duration": "4–5 min",
      "goal": "Practica preguntas de ruta, pasaje y paradero.",
      "closing": "Ya. Yo te aviso cuando lleguemos al paradero. 👍",
      "turns": [
        {
          "prompt": "Sube nomás. ¿A dónde vas?",
          "model": "Voy al centro. ¿Este bus pasa por la plaza?",
          "alternatives": [
            "Voy al centro. ¿Pasa por la plaza principal?",
            "Quiero ir al centro. ¿Este bus me deja cerca de la plaza?"
          ],
          "keywords": [
            "centro",
            "plaza",
            "pasa"
          ],
          "why": "En una pregunta escribe los signos ¿ ? y explica primero tu destino.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "En una pregunta escribe los signos ¿ ? y explica primero tu destino.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Voy al centro. ¿Este bus pasa por la plaza?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Voy al centro. ¿Pasa por la plaza principal?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Quiero ir al centro. ¿Este bus me deja cerca de la plaza?"
            }
          ]
        },
        {
          "prompt": "Sí, pasa por la plaza. El pasaje es dos soles.",
          "model": "Está bien. Aquí tiene dos soles.",
          "alternatives": [
            "De acuerdo, aquí tiene.",
            "Perfecto. Le pago dos soles."
          ],
          "keywords": [
            "dos",
            "soles",
            "aqui",
            "pago"
          ],
          "why": "Una respuesta breve funciona porque el contexto ya está claro.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Una respuesta breve funciona porque el contexto ya está claro.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Está bien. Aquí tiene dos soles."
            },
            {
              "label": "Otra forma natural",
              "text": "De acuerdo, aquí tiene."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto. Le pago dos soles."
            }
          ]
        },
        {
          "prompt": "¿Vas a bajar en la plaza o más adelante?",
          "model": "Voy a bajar en la plaza, por favor.",
          "alternatives": [
            "En la plaza, por favor.",
            "Bajo en la plaza principal."
          ],
          "keywords": [
            "plaza",
            "bajar"
          ],
          "why": "“Voy a bajar en…” indica el lugar exacto donde deseas descender.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "“Voy a bajar en…” indica el lugar exacto donde deseas descender.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Voy a bajar en la plaza, por favor."
            },
            {
              "label": "Otra forma natural",
              "text": "En la plaza, por favor."
            },
            {
              "label": "Alternativa",
              "text": "Bajo en la plaza principal."
            }
          ]
        },
        {
          "prompt": "Hay bastante tráfico hoy.",
          "model": "Sí, parece que vamos a demorar un poco.",
          "alternatives": [
            "Sí, hay bastante tráfico.",
            "Sí, probablemente lleguemos un poco tarde."
          ],
          "keywords": [
            "trafico",
            "demor",
            "tarde"
          ],
          "why": "“Parece que” sirve para expresar una observación sin asegurarla totalmente.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "“Parece que” sirve para expresar una observación sin asegurarla totalmente.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, parece que vamos a demorar un poco."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, hay bastante tráfico."
            },
            {
              "label": "Alternativa",
              "text": "Sí, probablemente lleguemos un poco tarde."
            }
          ]
        },
        {
          "prompt": "¿Tienes apuro?",
          "model": "Un poco. Tengo una cita a las cuatro.",
          "alternatives": [
            "Sí, un poco. Debo llegar antes de las cuatro.",
            "Tengo una cita a las cuatro, pero todavía tengo tiempo."
          ],
          "keywords": [
            "cita",
            "cuatro",
            "tiempo",
            "apuro"
          ],
          "why": "Explica la razón con una segunda oración corta.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "Explica la razón con una segunda oración corta.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Un poco. Tengo una cita a las cuatro."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, un poco. Debo llegar antes de las cuatro."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "Tengo una cita a las cuatro, pero todavía tengo tiempo."
            }
          ]
        },
        {
          "prompt": "Estamos a unas tres cuadras de la plaza.",
          "model": "Gracias. ¿Me avisa cuando lleguemos, por favor?",
          "alternatives": [
            "Gracias. Avíseme cuando lleguemos, por favor.",
            "¿Puede avisarme al llegar a la plaza?"
          ],
          "keywords": [
            "avisa",
            "avise",
            "lleg",
            "favor"
          ],
          "why": "Con una persona desconocida es natural usar “¿me avisa…?” o “¿puede avisarme…?”.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Con una persona desconocida es natural usar “¿me avisa…?” o “¿puede avisarme…?”.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Gracias. ¿Me avisa cuando lleguemos, por favor?"
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias. Avíseme cuando lleguemos, por favor."
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Puede avisarme al llegar a la plaza?"
            }
          ]
        },
        {
          "prompt": "Sí, no te preocupes.",
          "model": "Muchas gracias.",
          "alternatives": [
            "Gracias por avisarme.",
            "Perfecto, gracias."
          ],
          "keywords": [
            "gracias"
          ],
          "why": "Un agradecimiento cierra la interacción de forma amable.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Un agradecimiento cierra la interacción de forma amable.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Muchas gracias."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias por avisarme."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto, gracias."
            }
          ]
        }
      ],
      "tone": "cordial"
    },
    {
      "id": "mercado-compras",
      "level": 1,
      "avatar": "👩‍🌾",
      "name": "Lucía",
      "situation": "Comprar en el mercado",
      "place": "Mercado",
      "duration": "4–5 min",
      "goal": "Practica precios, cantidades y decisiones.",
      "closing": "Listo, joven. Aquí está su compra. ¡Que le vaya bien!",
      "turns": [
        {
          "prompt": "Buenos días. ¿Qué está buscando?",
          "model": "Buenos días. Quiero comprar papa y tomate.",
          "alternatives": [
            "Buenos días. Busco papa y tomate.",
            "Quisiera comprar papa y tomate."
          ],
          "keywords": [
            "papa",
            "tomate"
          ],
          "why": "Puedes usar “quiero”, “busco” o “quisiera”; las tres formas son naturales según el tono.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Puedes usar “quiero”, “busco” o “quisiera”; las tres formas son naturales según el tono.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenos días. Quiero comprar papa y tomate."
            },
            {
              "label": "Otra forma natural",
              "text": "Buenos días. Busco papa y tomate."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera comprar papa y tomate."
            }
          ]
        },
        {
          "prompt": "La papa está a cuatro soles el kilo. ¿Cuánto desea?",
          "model": "Deme dos kilos, por favor.",
          "alternatives": [
            "Quisiera dos kilos, por favor.",
            "Voy a llevar dos kilos."
          ],
          "keywords": [
            "dos",
            "kilo"
          ],
          "why": "Para pedir una cantidad, usa número + unidad: dos kilos.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Para pedir una cantidad, usa número + unidad: dos kilos.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Deme dos kilos, por favor."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera dos kilos, por favor."
            },
            {
              "label": "En futuro",
              "text": "Voy a llevar dos kilos."
            }
          ]
        },
        {
          "prompt": "¿Y de tomate cuánto le pongo?",
          "model": "Póngame un kilo de tomate.",
          "alternatives": [
            "Un kilo de tomate, por favor.",
            "También voy a llevar un kilo de tomate."
          ],
          "keywords": [
            "kilo",
            "tomate"
          ],
          "why": "“Póngame…” es una forma común y cortés de comprar en un mercado.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "“Póngame…” es una forma común y cortés de comprar en un mercado.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Póngame un kilo de tomate."
            },
            {
              "label": "Otra forma natural",
              "text": "Un kilo de tomate, por favor."
            },
            {
              "label": "En futuro",
              "text": "También voy a llevar un kilo de tomate."
            }
          ]
        },
        {
          "prompt": "¿Algo más? Tengo cebolla fresca.",
          "model": "No, gracias. Con eso está bien.",
          "alternatives": [
            "No, muchas gracias. Eso es todo.",
            "Por ahora no, gracias."
          ],
          "keywords": [
            "no",
            "gracias",
            "todo",
            "bien"
          ],
          "why": "Para rechazar amablemente una oferta, agrega “gracias”.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Para rechazar amablemente una oferta, agrega “gracias”.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "No, gracias. Con eso está bien."
            },
            {
              "label": "Otra forma natural",
              "text": "No, muchas gracias. Eso es todo."
            },
            {
              "label": "Alternativa",
              "text": "Por ahora no, gracias."
            }
          ]
        },
        {
          "prompt": "Todo sale doce soles.",
          "model": "¿Puedo pagar con tarjeta?",
          "alternatives": [
            "¿Acepta tarjeta?",
            "¿Se puede pagar con tarjeta?"
          ],
          "keywords": [
            "tarjeta",
            "pagar"
          ],
          "why": "En una pregunta directa recuerda usar ¿ al inicio y ? al final.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "En una pregunta directa recuerda usar ¿ al inicio y ? al final.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "¿Puedo pagar con tarjeta?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Acepta tarjeta?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Se puede pagar con tarjeta?"
            }
          ]
        },
        {
          "prompt": "Solo efectivo o transferencia.",
          "model": "Entonces pagaré por transferencia.",
          "alternatives": [
            "Está bien. Haré una transferencia.",
            "De acuerdo, pago por transferencia."
          ],
          "keywords": [
            "transferencia",
            "pago"
          ],
          "why": "“Entonces” conecta la información recibida con tu decisión.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: entonces",
            "rule": "“Entonces” conecta la información recibida con tu decisión.",
            "highlight": [
              "entonces",
              "por eso",
              "así que"
            ]
          },
          "options": [
            {
              "label": "Con «entonces»",
              "text": "Entonces pagaré por transferencia."
            },
            {
              "label": "Otra forma natural",
              "text": "Está bien. Haré una transferencia."
            },
            {
              "label": "Alternativa",
              "text": "De acuerdo, pago por transferencia."
            }
          ]
        },
        {
          "prompt": "Ya llegó el pago. ¿Desea bolsa?",
          "model": "Sí, una bolsa, por favor.",
          "alternatives": [
            "Sí, por favor.",
            "Sí, necesito una bolsa."
          ],
          "keywords": [
            "bolsa",
            "favor"
          ],
          "why": "Una respuesta breve es suficiente cuando la pregunta es concreta.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Una respuesta breve es suficiente cuando la pregunta es concreta.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, una bolsa, por favor."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, por favor."
            },
            {
              "label": "Alternativa",
              "text": "Sí, necesito una bolsa."
            }
          ]
        }
      ],
      "tone": "cordial"
    },
    {
      "id": "vecina-paquete",
      "level": 1,
      "avatar": "👩‍🦱",
      "name": "Ana",
      "situation": "Coordinar con una vecina",
      "place": "Vecindario",
      "duration": "4–5 min",
      "goal": "Practica avisos, favores y agradecimientos.",
      "closing": "No hay problema. Cuando llegues, me escribes. 😊",
      "turns": [
        {
          "prompt": "Hola. Dejaron un paquete para ti en mi casa.",
          "model": "Hola, Ana. Muchas gracias por recibirlo.",
          "alternatives": [
            "Gracias, Ana, por guardar mi paquete.",
            "Hola. Gracias por recibir el paquete."
          ],
          "keywords": [
            "gracias",
            "paquete",
            "recib"
          ],
          "why": "Agradece primero cuando alguien te hace un favor.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Agradece primero cuando alguien te hace un favor.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Hola, Ana. Muchas gracias por recibirlo."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias, Ana, por guardar mi paquete."
            },
            {
              "label": "Alternativa",
              "text": "Hola. Gracias por recibir el paquete."
            }
          ]
        },
        {
          "prompt": "¿Estás cerca?",
          "model": "Todavía no. Estoy en el trabajo.",
          "alternatives": [
            "Aún no. Sigo en el trabajo.",
            "No, todavía estoy trabajando."
          ],
          "keywords": [
            "trabajo",
            "todavia",
            "aun"
          ],
          "why": "“Todavía” o “aún” indican que una situación continúa.",
          "focus": {
            "type": "conector",
            "badge": "⏱️ Tiempo: todavía no",
            "rule": "“Todavía” o “aún” indican que una situación continúa.",
            "highlight": [
              "todavía no"
            ]
          },
          "options": [
            {
              "label": "Con «todavía no»",
              "text": "Todavía no. Estoy en el trabajo."
            },
            {
              "label": "Con «aún no»",
              "text": "Aún no. Sigo en el trabajo."
            },
            {
              "label": "Alternativa",
              "text": "No, todavía estoy trabajando."
            }
          ]
        },
        {
          "prompt": "¿A qué hora llegas?",
          "model": "Creo que llegaré cerca de las siete.",
          "alternatives": [
            "Llegaré aproximadamente a las siete.",
            "Estaré por la casa a eso de las siete."
          ],
          "keywords": [
            "siete",
            "lleg"
          ],
          "why": "“Cerca de”, “aproximadamente” y “a eso de” sirven para horas aproximadas.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "“Cerca de”, “aproximadamente” y “a eso de” sirven para horas aproximadas.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Creo que llegaré cerca de las siete."
            },
            {
              "label": "En futuro",
              "text": "Llegaré aproximadamente a las siete."
            },
            {
              "label": "En futuro",
              "text": "Estaré por la casa a eso de las siete."
            }
          ]
        },
        {
          "prompt": "A esa hora estaré en casa.",
          "model": "Perfecto. Paso a recogerlo cuando llegue.",
          "alternatives": [
            "Perfecto. Cuando llegue, paso por tu casa.",
            "Está bien. Lo recojo al llegar."
          ],
          "keywords": [
            "reco",
            "lleg",
            "paso"
          ],
          "why": "Evita repetir demasiado: “lo” puede reemplazar “el paquete” cuando ya está claro.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Evita repetir demasiado: “lo” puede reemplazar “el paquete” cuando ya está claro.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Perfecto. Paso a recogerlo cuando llegue."
            },
            {
              "label": "Otra forma natural",
              "text": "Perfecto. Cuando llegue, paso por tu casa."
            },
            {
              "label": "Alternativa",
              "text": "Está bien. Lo recojo al llegar."
            }
          ]
        },
        {
          "prompt": "Si quieres, también puedo dejarlo con tu mamá.",
          "model": "Gracias, pero prefiero recogerlo yo.",
          "alternatives": [
            "Gracias. Mejor paso yo a recogerlo.",
            "Te agradezco, pero yo lo recojo."
          ],
          "keywords": [
            "gracias",
            "prefiero",
            "reco"
          ],
          "why": "“Gracias, pero…” permite rechazar una opción con cortesía.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "“Gracias, pero…” permite rechazar una opción con cortesía.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Con «pero» (contraste)",
              "text": "Gracias, pero prefiero recogerlo yo."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias. Mejor paso yo a recogerlo."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "Te agradezco, pero yo lo recojo."
            }
          ]
        },
        {
          "prompt": "Está bien. Te lo guardo.",
          "model": "Muchas gracias por la ayuda.",
          "alternatives": [
            "Gracias, Ana. Me ayudas mucho.",
            "Te agradezco mucho."
          ],
          "keywords": [
            "gracias",
            "ayuda",
            "agrade"
          ],
          "why": "Cerrar con un agradecimiento mantiene un tono amable.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Cerrar con un agradecimiento mantiene un tono amable.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Muchas gracias por la ayuda."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias, Ana. Me ayudas mucho."
            },
            {
              "label": "Alternativa",
              "text": "Te agradezco mucho."
            }
          ]
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "delivery-almuerzo",
      "level": 1,
      "avatar": "🥡",
      "name": "Restaurante",
      "situation": "Hacer un pedido por delivery",
      "place": "Delivery",
      "duration": "4–5 min",
      "goal": "Practica elegir comida, dar dirección y confirmar un pedido.",
      "closing": "Pedido confirmado. Te avisaremos cuando el repartidor salga del restaurante. 🛵",
      "turns": [
        {
          "prompt": "Hola. Gracias por escribirnos. ¿Qué desea pedir?",
          "model": "Hola. Quisiera un pollo a la plancha con arroz.",
          "alternatives": [
            "Quiero un pollo a la plancha con arroz, por favor.",
            "Buenas tardes. Deseo pedir un pollo a la plancha."
          ],
          "keywords": [
            "pollo",
            "arroz"
          ],
          "why": "Empieza diciendo claramente qué deseas pedir.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Empieza diciendo claramente qué deseas pedir.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Más formal (quisiera)",
              "text": "Hola. Quisiera un pollo a la plancha con arroz."
            },
            {
              "label": "Otra forma natural",
              "text": "Quiero un pollo a la plancha con arroz, por favor."
            },
            {
              "label": "Alternativa",
              "text": "Buenas tardes. Deseo pedir un pollo a la plancha."
            }
          ]
        },
        {
          "prompt": "¿Desea ensalada o papas como acompañamiento?",
          "model": "Prefiero ensalada, por favor.",
          "alternatives": [
            "Quisiera ensalada.",
            "Ensalada está bien, gracias."
          ],
          "keywords": [
            "ensalada",
            "prefiero"
          ],
          "why": "“Prefiero” sirve para elegir entre opciones.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "“Prefiero” sirve para elegir entre opciones.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Preferencia",
              "text": "Prefiero ensalada, por favor."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera ensalada."
            },
            {
              "label": "Alternativa",
              "text": "Ensalada está bien, gracias."
            }
          ]
        },
        {
          "prompt": "¿Alguna bebida?",
          "model": "Sí, una limonada mediana.",
          "alternatives": [
            "Una limonada, por favor.",
            "Sí, agregue una limonada mediana."
          ],
          "keywords": [
            "limonada"
          ],
          "why": "Indica producto y tamaño cuando haya opciones.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Indica producto y tamaño cuando haya opciones.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, una limonada mediana."
            },
            {
              "label": "Otra forma natural",
              "text": "Una limonada, por favor."
            },
            {
              "label": "Alternativa",
              "text": "Sí, agregue una limonada mediana."
            }
          ]
        },
        {
          "prompt": "¿A qué dirección enviamos el pedido?",
          "model": "Envíenlo a la avenida Grau 320.",
          "alternatives": [
            "Mi dirección es avenida Grau 320.",
            "El pedido es para la avenida Grau 320."
          ],
          "keywords": [
            "grau",
            "320",
            "direccion"
          ],
          "why": "En delivery, una dirección completa evita errores.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "En delivery, una dirección completa evita errores.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Envíenlo a la avenida Grau 320."
            },
            {
              "label": "Otra forma natural",
              "text": "Mi dirección es avenida Grau 320."
            },
            {
              "label": "Alternativa",
              "text": "El pedido es para la avenida Grau 320."
            }
          ]
        },
        {
          "prompt": "El tiempo aproximado es cuarenta minutos.",
          "model": "Está bien. ¿Me avisan cuando el repartidor salga?",
          "alternatives": [
            "Perfecto. Avísenme cuando salga el pedido.",
            "De acuerdo. ¿Recibiré un aviso?"
          ],
          "keywords": [
            "avisa",
            "repartidor",
            "salga"
          ],
          "why": "Puedes preguntar cómo recibirás una actualización del pedido.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Puedes preguntar cómo recibirás una actualización del pedido.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Está bien. ¿Me avisan cuando el repartidor salga?"
            },
            {
              "label": "Otra forma natural",
              "text": "Perfecto. Avísenme cuando salga el pedido."
            },
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. ¿Recibiré un aviso?"
            }
          ]
        },
        {
          "prompt": "Sí. ¿Pagará con efectivo, tarjeta o Yape?",
          "model": "Voy a pagar con Yape.",
          "alternatives": [
            "Pagaré por Yape.",
            "Con Yape, por favor."
          ],
          "keywords": [
            "yape",
            "pagar"
          ],
          "why": "Indica el medio de pago de forma directa.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Indica el medio de pago de forma directa.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Voy a pagar con Yape."
            },
            {
              "label": "En futuro",
              "text": "Pagaré por Yape."
            },
            {
              "label": "Alternativa",
              "text": "Con Yape, por favor."
            }
          ]
        },
        {
          "prompt": "Perfecto. ¿Desea algo más?",
          "model": "No, gracias. Eso es todo.",
          "alternatives": [
            "No, muchas gracias.",
            "No. El pedido está completo."
          ],
          "keywords": [
            "no",
            "gracias",
            "todo"
          ],
          "why": "Para cerrar un pedido, confirma que no necesitas nada más.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Para cerrar un pedido, confirma que no necesitas nada más.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "No, gracias. Eso es todo."
            },
            {
              "label": "Otra forma natural",
              "text": "No, muchas gracias."
            },
            {
              "label": "Alternativa",
              "text": "No. El pedido está completo."
            }
          ]
        }
      ],
      "tone": "cordial"
    },
    {
      "id": "partido-barrio",
      "level": 1,
      "avatar": "⚽",
      "name": "Equipo del barrio",
      "situation": "Organizar un partido",
      "place": "Deporte",
      "duration": "4–5 min",
      "goal": "Practica horarios, roles, objetos y cambios de plan.",
      "closing": "¡Listo! Quedamos para el domingo. Nos vemos en la cancha. ⚽",
      "turns": [
        {
          "prompt": "Estamos organizando un partido el domingo. ¿Te apuntas?",
          "model": "Sí, quiero jugar.",
          "alternatives": [
            "Sí, cuenten conmigo.",
            "Claro, puedo jugar el domingo."
          ],
          "keywords": [
            "si",
            "jugar",
            "domingo"
          ],
          "why": "Puedes aceptar con “quiero”, “puedo” o “cuenten conmigo”.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Puedes aceptar con “quiero”, “puedo” o “cuenten conmigo”.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, quiero jugar."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, cuenten conmigo."
            },
            {
              "label": "Alternativa",
              "text": "Claro, puedo jugar el domingo."
            }
          ]
        },
        {
          "prompt": "Buenazo. ¿Prefieres jugar de defensa o adelante?",
          "model": "Prefiero jugar de defensa.",
          "alternatives": [
            "Me gusta más jugar de defensa.",
            "Puedo jugar de defensa."
          ],
          "keywords": [
            "defensa",
            "prefiero"
          ],
          "why": "Usa “prefiero” para expresar una elección.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Usa “prefiero” para expresar una elección.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Preferencia",
              "text": "Prefiero jugar de defensa."
            },
            {
              "label": "Otra forma natural",
              "text": "Me gusta más jugar de defensa."
            },
            {
              "label": "Alternativa",
              "text": "Puedo jugar de defensa."
            }
          ]
        },
        {
          "prompt": "Empezamos a las nueve de la mañana.",
          "model": "Perfecto. Llegaré un poco antes.",
          "alternatives": [
            "Está bien. Estaré allí antes de las nueve.",
            "De acuerdo, llegaré temprano."
          ],
          "keywords": [
            "nueve",
            "antes",
            "temprano"
          ],
          "why": "Llegar “antes” o “temprano” expresa anticipación.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Llegar “antes” o “temprano” expresa anticipación.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Perfecto. Llegaré un poco antes."
            },
            {
              "label": "En futuro",
              "text": "Está bien. Estaré allí antes de las nueve."
            },
            {
              "label": "En futuro",
              "text": "De acuerdo, llegaré temprano."
            }
          ]
        },
        {
          "prompt": "¿Puedes llevar una pelota?",
          "model": "Sí, puedo llevar una pelota.",
          "alternatives": [
            "Sí, yo llevo la pelota.",
            "Claro, llevaré una."
          ],
          "keywords": [
            "si",
            "pelota",
            "llevar"
          ],
          "why": "Confirma el objeto que te comprometes a llevar.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Confirma el objeto que te comprometes a llevar.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, puedo llevar una pelota."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, yo llevo la pelota."
            },
            {
              "label": "En futuro",
              "text": "Claro, llevaré una."
            }
          ]
        },
        {
          "prompt": "Parece que hará bastante sol.",
          "model": "Entonces llevaré agua y una gorra.",
          "alternatives": [
            "Llevaré agua porque hará calor.",
            "Buena idea. Llevaré algo para el sol."
          ],
          "keywords": [
            "agua",
            "gorra",
            "sol"
          ],
          "why": "“Entonces” conecta una situación con una decisión.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: porque",
            "rule": "“Entonces” conecta una situación con una decisión.",
            "highlight": [
              "porque",
              "ya que",
              "por eso"
            ]
          },
          "options": [
            {
              "label": "Con «entonces»",
              "text": "Entonces llevaré agua y una gorra."
            },
            {
              "label": "Con «porque» (causa)",
              "text": "Llevaré agua porque hará calor."
            },
            {
              "label": "En futuro",
              "text": "Buena idea. Llevaré algo para el sol."
            }
          ]
        },
        {
          "prompt": "Si alguien falta, quizá cambiemos los equipos.",
          "model": "No hay problema. Podemos organizarnos allá.",
          "alternatives": [
            "Está bien, vemos los equipos al llegar.",
            "De acuerdo. Nos acomodamos según cuántos seamos."
          ],
          "keywords": [
            "problema",
            "equipos",
            "lleg"
          ],
          "why": "En un cambio de plan, muestra flexibilidad y propone qué hacer.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "En un cambio de plan, muestra flexibilidad y propone qué hacer.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "No hay problema. Podemos organizarnos allá."
            },
            {
              "label": "Otra forma natural",
              "text": "Está bien, vemos los equipos al llegar."
            },
            {
              "label": "Alternativa",
              "text": "De acuerdo. Nos acomodamos según cuántos seamos."
            }
          ]
        },
        {
          "prompt": "Perfecto. Te agrego al grupo.",
          "model": "Gracias. Estaré atento a los mensajes.",
          "alternatives": [
            "Gracias, revisaré el grupo.",
            "Perfecto. Avísenme si cambia algo."
          ],
          "keywords": [
            "gracias",
            "mensajes",
            "avisa"
          ],
          "why": "Un grupo de chat sirve para seguir cambios; puedes decir que estarás atento.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "Un grupo de chat sirve para seguir cambios; puedes decir que estarás atento.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Gracias. Estaré atento a los mensajes."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias, revisaré el grupo."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto. Avísenme si cambia algo."
            }
          ]
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "taller-conectores-causa",
      "level": 2,
      "avatar": "🔗",
      "name": "Elena (Trabajo)",
      "situation": "Conectores: porque, por eso, entonces",
      "place": "Conectores · Causa",
      "duration": "6–7 min",
      "goal": "Aprende a unir causas y consecuencias usando porque, por eso, ya que, entonces y así que.",
      "closing": "¡Excelente! Explicaste motivos y consecuencias con conectores muy claros. Nos vemos a las 3:30. 🙌",
      "turns": [
        {
          "prompt": "Hola. La reunión empieza a las 3:00. ¿Vas a llegar a tiempo o necesitas avisar algún retraso?",
          "model": "Hola, Elena. Llegaré un poco tarde porque hay mucho tráfico en la avenida.",
          "alternatives": [
            "Hola. Me voy a demorar unos minutos ya que el bus recién pasó.",
            "Sí, llegaré a tiempo porque salí temprano de mi casa."
          ],
          "options": [
            {
              "label": "Causa con «porque»",
              "text": "Hola, Elena. Llegaré un poco tarde porque hay mucho tráfico en la avenida."
            },
            {
              "label": "Causa con «ya que»",
              "text": "Hola. Me voy a demorar unos minutos ya que el bus recién pasó."
            },
            {
              "label": "A tiempo con «porque»",
              "text": "Sí, llegaré a tiempo porque salí temprano de mi casa."
            }
          ],
          "keywords": [
            "porque",
            "ya que",
            "tarde",
            "trafico",
            "tiempo"
          ],
          "why": "Usa «porque» (junto y sin tilde) o «ya que» para explicar el motivo de lo que pasa.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: porque / ya que",
            "rule": "Une tu idea con la razón usando «porque» o «ya que».",
            "highlight": [
              "porque",
              "ya que"
            ]
          },
          "reactions": {
            "yes": "¡Qué buena noticia! Me alegra que vengas con tiempo.",
            "reason": "Gracias por avisarme el motivo con anticipación.",
            "contrast": "Entiendo el imprevisto, no te preocupes."
          }
        },
        {
          "prompt": "Entiendo. ¿A qué hora crees que llegarás? Así reorganizo el orden de la reunión.",
          "model": "El tráfico está lento; por eso, llegaré aproximadamente a las 3:20.",
          "alternatives": [
            "Todavía me faltan cuatro cuadras, así que estaré allí a las 3:20.",
            "Ya estoy cerca, entonces llegaré en diez minutos."
          ],
          "options": [
            {
              "label": "Consecuencia: «por eso»",
              "text": "El tráfico está lento; por eso, llegaré aproximadamente a las 3:20."
            },
            {
              "label": "Consecuencia: «así que»",
              "text": "Todavía me faltan cuatro cuadras, así que estaré allí a las 3:20."
            },
            {
              "label": "Consecuencia: «entonces»",
              "text": "Ya estoy cerca, entonces llegaré en diez minutos."
            }
          ],
          "keywords": [
            "por eso",
            "asi que",
            "entonces",
            "llegare",
            "minutos"
          ],
          "why": "«Por eso», «así que» y «entonces» presentan el resultado o consecuencia de una situación.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: por eso / así que",
            "rule": "Explica la consecuencia usando «por eso», «así que» o «entonces».",
            "highlight": [
              "por eso",
              "así que",
              "entonces"
            ]
          },
          "reactions": {
            "reason": "Perfecto, así ya calculo el tiempo exacto.",
            "uncertain": "No pasa nada, avísame cuando estés a dos cuadras."
          }
        },
        {
          "prompt": "Perfecto. Podemos empezar con el tema de Luis mientras llegas. ¿Tienes lista tu presentación?",
          "model": "Sí, ya terminé mi presentación porque la preparé ayer por la noche.",
          "alternatives": [
            "Sí, la tengo lista, así que puedo exponer apenas llegue.",
            "Ya la terminé; por eso, te la acabo de enviar por correo."
          ],
          "options": [
            {
              "label": "Con «porque» + pasado",
              "text": "Sí, ya terminé mi presentación porque la preparé ayer por la noche."
            },
            {
              "label": "Con «así que»",
              "text": "Sí, la tengo lista, así que puedo exponer apenas llegue."
            },
            {
              "label": "Con «por eso»",
              "text": "Ya la terminé; por eso, te la acabo de enviar por correo."
            }
          ],
          "keywords": [
            "presentacion",
            "porque",
            "por eso",
            "asi que",
            "lista"
          ],
          "why": "Combina un verbo en pasado («terminé», «preparé») con un conector de causa o consecuencia.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: porque / por eso",
            "rule": "Confirma si está lista y añade la causa o consecuencia.",
            "highlight": [
              "porque",
              "por eso",
              "así que",
              "terminé",
              "preparé"
            ]
          }
        },
        {
          "prompt": "Excelente, ya recibí el archivo. ¿Necesitas que imprima copias para el equipo?",
          "model": "Sí, por favor, porque así todos podrán leer los cuadros con calma.",
          "alternatives": [
            "No es necesario, ya que todos tienen el archivo en su computadora.",
            "Sí, imprime cinco copias para que cada persona tenga una."
          ],
          "options": [
            {
              "label": "Motivo con «porque»",
              "text": "Sí, por favor, porque así todos podrán leer los cuadros con calma."
            },
            {
              "label": "Motivo con «ya que»",
              "text": "No es necesario, ya que todos tienen el archivo en su computadora."
            },
            {
              "label": "Finalidad con «para que»",
              "text": "Sí, imprime cinco copias para que cada persona tenga una."
            }
          ],
          "keywords": [
            "copias",
            "porque",
            "ya que",
            "para que",
            "archivo"
          ],
          "why": "«Para que» expresa la finalidad (el objetivo) de lo que pides.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: para que / porque",
            "rule": "Explica el objetivo o motivo usando «para que», «porque» o «ya que».",
            "highlight": [
              "para que",
              "porque",
              "ya que"
            ]
          }
        },
        {
          "prompt": "Listo, ya las tengo impresas. ¿Te reservo también un espacio cerca de la pantalla?",
          "model": "Sí, gracias, porque desde allí puedo ver mejor los textos y diapositivas.",
          "alternatives": [
            "Sí, por favor, para que pueda leer bien todo lo que proyecten.",
            "Gracias, Elena. Eso me ayuda mucho, así que te lo agradezco."
          ],
          "options": [
            {
              "label": "Razón con «porque»",
              "text": "Sí, gracias, porque desde allí puedo ver mejor los textos y diapositivas."
            },
            {
              "label": "Objetivo con «para que»",
              "text": "Sí, por favor, para que pueda leer bien todo lo que proyecten."
            },
            {
              "label": "Resultado con «así que»",
              "text": "Gracias, Elena. Eso me ayuda mucho, así que te lo agradezco."
            }
          ],
          "keywords": [
            "gracias",
            "porque",
            "para que",
            "pantalla",
            "ver"
          ],
          "why": "Unir tu agradecimiento con «porque» hace tu mensaje claro y natural.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: porque / para que",
            "rule": "Responde agradeciendo y explica por qué te sirve.",
            "highlight": [
              "porque",
              "para que",
              "así que"
            ]
          }
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "taller-conectores-contraste",
      "level": 2,
      "avatar": "⚖️",
      "name": "Mateo",
      "situation": "Conectores: pero, aunque, sin embargo",
      "place": "Conectores · Contraste",
      "duration": "6–7 min",
      "goal": "Aprende a contrastar ideas, poner condiciones y negociar con pero, aunque, sin embargo y en cambio.",
      "closing": "¡Buen trato! Supiste expresar tus ideas y negociar usando conectores de contraste. Nos vemos el sábado.",
      "turns": [
        {
          "prompt": "Hola. ¿Vamos al cine este viernes por la noche?",
          "model": "Me gustaría ir, pero el viernes salgo tarde del trabajo.",
          "alternatives": [
            "Quiero ir; sin embargo, este viernes tengo un compromiso familiar.",
            "Aunque estoy un poco cansado, sí puedo ir el viernes."
          ],
          "options": [
            {
              "label": "Contraste: «, pero»",
              "text": "Me gustaría ir, pero el viernes salgo tarde del trabajo."
            },
            {
              "label": "Formal: «sin embargo»",
              "text": "Quiero ir; sin embargo, este viernes tengo un compromiso familiar."
            },
            {
              "label": "Concesión: «aunque»",
              "text": "Aunque estoy un poco cansado, sí puedo ir el viernes."
            }
          ],
          "keywords": [
            "pero",
            "aunque",
            "sin embargo",
            "viernes",
            "cine"
          ],
          "why": "Usa «, pero» para unir una idea positiva con una dificultad. Recuerda la coma antes de «pero».",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero / aunque / sin embargo",
            "rule": "Une dos ideas opuestas usando «, pero», «aunque» o «sin embargo».",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "reactions": {
            "yes": "¡Buenazo! Qué alegría que puedas.",
            "no": "Uy, qué pena, pero entiendo perfectamente.",
            "contrast": "Claro, el trabajo a veces nos complica la noche."
          }
        },
        {
          "prompt": "Entiendo. ¿Y qué te parece el sábado por la tarde? Podemos ver una película con subtítulos.",
          "model": "El sábado me queda mucho mejor, aunque prefiero ir a las cinco.",
          "alternatives": [
            "Sí, el sábado puedo, pero aseguremos que la función tenga subtítulos en español.",
            "El viernes no puedo; en cambio, el sábado estoy libre toda la tarde."
          ],
          "options": [
            {
              "label": "Con «aunque»",
              "text": "El sábado me queda mucho mejor, aunque prefiero ir a las cinco."
            },
            {
              "label": "Con «, pero»",
              "text": "Sí, el sábado puedo, pero aseguremos que la función tenga subtítulos en español."
            },
            {
              "label": "Con «en cambio»",
              "text": "El viernes no puedo; en cambio, el sábado estoy libre toda la tarde."
            }
          ],
          "keywords": [
            "sabado",
            "aunque",
            "pero",
            "en cambio",
            "subtitulos"
          ],
          "why": "«En cambio» sirve para comparar dos opciones distintas (viernes vs. sábado).",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: aunque / en cambio",
            "rule": "Acepta o ajusta el plan usando «aunque», «, pero» o «en cambio».",
            "highlight": [
              "aunque",
              "pero",
              "en cambio"
            ]
          },
          "reactions": {
            "contrast": "Me parece súper justo adaptarlo así.",
            "yes": "¡Genial! El sábado vamos más tranquilos."
          }
        },
        {
          "prompt": "Hay dos películas subtituladas: una de acción y una comedia. ¿Cuál prefieres?",
          "model": "Me gustan las comedias, pero hoy prefiero ver la de acción.",
          "alternatives": [
            "Aunque la de acción parece buena, prefiero la comedia para reír un rato.",
            "La de acción dura mucho; en cambio, la comedia es más corta."
          ],
          "options": [
            {
              "label": "Con «, pero»",
              "text": "Me gustan las comedias, pero hoy prefiero ver la de acción."
            },
            {
              "label": "Con «aunque»",
              "text": "Aunque la de acción parece buena, prefiero la comedia para reír un rato."
            },
            {
              "label": "Con «en cambio»",
              "text": "La de acción dura mucho; en cambio, la comedia es más corta."
            }
          ],
          "keywords": [
            "pero",
            "aunque",
            "en cambio",
            "accion",
            "comedia"
          ],
          "why": "Comparar dos opciones con «aunque» o «, pero» hace tus opiniones más completas.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero / aunque / en cambio",
            "rule": "Compara las dos películas usando un conector de contraste.",
            "highlight": [
              "pero",
              "aunque",
              "en cambio"
            ]
          },
          "reactions": {
            "contrast": "Tienes buen punto, cada género tiene lo suyo."
          }
        },
        {
          "prompt": "Buena elección. ¿Compramos las entradas por internet o en la boletería?",
          "model": "Es mejor comprarlas por internet, aunque cobren un poco más, para evitar filas.",
          "alternatives": [
            "En boletería es más barato; sin embargo, por internet aseguramos buenos asientos.",
            "Prefiero comprarlas por internet, pero revisemos primero el horario."
          ],
          "options": [
            {
              "label": "Con «aunque»",
              "text": "Es mejor comprarlas por internet, aunque cobren un poco más, para evitar filas."
            },
            {
              "label": "Con «sin embargo»",
              "text": "En boletería es más barato; sin embargo, por internet aseguramos buenos asientos."
            },
            {
              "label": "Con «, pero»",
              "text": "Prefiero comprarlas por internet, pero revisemos primero el horario."
            }
          ],
          "keywords": [
            "internet",
            "boleteria",
            "aunque",
            "sin embargo",
            "pero"
          ],
          "why": "«Sin embargo» expresa lo mismo que «pero» con un tono más cuidado; nunca uses «pero sin embargo» juntos.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: sin embargo / aunque",
            "rule": "Elige cómo comprar y contrasta ventaja y desventaja.",
            "highlight": [
              "sin embargo",
              "aunque",
              "pero"
            ]
          }
        },
        {
          "prompt": "Después del cine, ¿quieres cenar algo cerca del centro comercial?",
          "model": "Sí, me parece genial, pero no me quedaré hasta muy tarde.",
          "alternatives": [
            "Aunque no tengo mucha hambre, sí te acompaño a tomar algo.",
            "Me encantaría; sin embargo, tengo que regresar temprano a casa."
          ],
          "options": [
            {
              "label": "Con «, pero»",
              "text": "Sí, me parece genial, pero no me quedaré hasta muy tarde."
            },
            {
              "label": "Con «aunque»",
              "text": "Aunque no tengo mucha hambre, sí te acompaño a tomar algo."
            },
            {
              "label": "Con «sin embargo»",
              "text": "Me encantaría; sin embargo, tengo que regresar temprano a casa."
            }
          ],
          "keywords": [
            "cenar",
            "pero",
            "aunque",
            "sin embargo",
            "tarde"
          ],
          "why": "Puedes aceptar o rechazar suavemente poniendo un límite con «pero» o «sin embargo».",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero / sin embargo",
            "rule": "Responde al plan poniendo una condición o límite con un conector.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          }
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "taller-conjugaciones-tiempos",
      "level": 2,
      "avatar": "⏱️",
      "name": "Camila",
      "situation": "Conjugaciones: pasado, presente y futuro",
      "place": "Verbos · Tiempos",
      "duration": "6–7 min",
      "goal": "Practica cambiar el verbo según el tiempo (ayer fui/hice, hoy estoy/hago, mañana iré/haré) sin dejarlo en infinitivo.",
      "closing": "¡Genial! Cambiaste muy bien los verbos entre pasado, presente y futuro. Seguimos en contacto. 😊",
      "turns": [
        {
          "prompt": "Hola, primo. ¿Qué hiciste ayer por la tarde?",
          "model": "Hola, Camila. Ayer fui al mercado y compré frutas para la semana.",
          "alternatives": [
            "Ayer estudié en mi casa y luego hice mis tareas.",
            "Ayer trabajé todo el día, pero en la noche descansé."
          ],
          "options": [
            {
              "label": "Pasado: fui / compré",
              "text": "Hola, Camila. Ayer fui al mercado y compré frutas para la semana."
            },
            {
              "label": "Pasado: estudié / hice",
              "text": "Ayer estudié en mi casa y luego hice mis tareas."
            },
            {
              "label": "Pasado + «pero»",
              "text": "Ayer trabajé todo el día, pero en la noche descansé."
            }
          ],
          "keywords": [
            "ayer",
            "fui",
            "compre",
            "estudie",
            "hice",
            "trabaje"
          ],
          "why": "Con «ayer» el verbo va en pasado: fui (no «ir»), compré (no «comprar»), hice (no «hacer»).",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Pasado (yo)",
            "rule": "Con «ayer» conjuga el verbo en pasado: fui, hice, compré, estudié, trabajé.",
            "highlight": [
              "fui",
              "compré",
              "estudié",
              "hice",
              "trabajé",
              "descansé"
            ]
          },
          "reactions": {
            "reason": "¡Qué bien aprovechado el día!",
            "contrast": "Lo bueno es que pudiste descansar un rato."
          }
        },
        {
          "prompt": "¡Qué productivo! ¿Y qué estás haciendo ahora?",
          "model": "Ahora estoy en casa y practico mi escritura en español.",
          "alternatives": [
            "En este momento trabajo en mi computadora y tomo un café.",
            "Ahora descanso un poco porque hace mucho calor."
          ],
          "options": [
            {
              "label": "Presente: estoy / practico",
              "text": "Ahora estoy en casa y practico mi escritura en español."
            },
            {
              "label": "Presente: trabajo / tomo",
              "text": "En este momento trabajo en mi computadora y tomo un café."
            },
            {
              "label": "Presente + «porque»",
              "text": "Ahora descanso un poco porque hace mucho calor."
            }
          ],
          "keywords": [
            "ahora",
            "estoy",
            "practico",
            "trabajo",
            "descanso"
          ],
          "why": "Para lo que ocurre hoy o ahora usamos presente: estoy, practico, trabajo, descanso.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Presente (yo)",
            "rule": "Con «ahora» usa presente: estoy, trabajo, estudio, practico.",
            "highlight": [
              "estoy",
              "practico",
              "trabajo",
              "tomo",
              "descanso"
            ]
          }
        },
        {
          "prompt": "Qué bien. ¿Y tus hermanos qué hacen hoy?",
          "model": "Ellos trabajan en la mañana y estudian por la tarde.",
          "alternatives": [
            "Ellos están en casa porque hoy tienen día libre.",
            "Nosotros vamos a almorzar juntos en una hora."
          ],
          "options": [
            {
              "label": "Ellos: trabajan / estudian",
              "text": "Ellos trabajan en la mañana y estudian por la tarde."
            },
            {
              "label": "Ellos: están / tienen",
              "text": "Ellos están en casa porque hoy tienen día libre."
            },
            {
              "label": "Nosotros: vamos",
              "text": "Nosotros vamos a almorzar juntos en una hora."
            }
          ],
          "keywords": [
            "ellos",
            "nosotros",
            "trabajan",
            "estan",
            "tienen",
            "vamos"
          ],
          "why": "Con «ellos/ellas» los verbos suelen terminar en «-n» (trabajan, estudian, están, tienen).",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Persona: Ellos / Nosotros",
            "rule": "Adapta el verbo a la persona: ellos trabajan/están, nosotros vamos/tenemos.",
            "highlight": [
              "trabajan",
              "estudian",
              "están",
              "tienen",
              "vamos"
            ]
          }
        },
        {
          "prompt": "¿Qué planes tienes para mañana?",
          "model": "Mañana iré al centro y compraré un cuaderno nuevo.",
          "alternatives": [
            "Mañana voy a visitar a mi tía y luego volveré temprano.",
            "Mañana tendré una reunión importante en la oficina."
          ],
          "options": [
            {
              "label": "Futuro: iré / compraré",
              "text": "Mañana iré al centro y compraré un cuaderno nuevo."
            },
            {
              "label": "«Voy a + verbo»",
              "text": "Mañana voy a visitar a mi tía y luego volveré temprano."
            },
            {
              "label": "Futuro: tendré",
              "text": "Mañana tendré una reunión importante en la oficina."
            }
          ],
          "keywords": [
            "manana",
            "ire",
            "comprare",
            "voy a",
            "tendre"
          ],
          "why": "Con «mañana» usa futuro («iré», «compraré», «tendré») o «voy a + verbo».",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro (yo)",
            "rule": "Con «mañana» conjuga en futuro: iré, haré, compraré, tendré o voy a + verbo.",
            "highlight": [
              "iré",
              "compraré",
              "voy a",
              "volveré",
              "tendré"
            ]
          },
          "reactions": {
            "reason": "Suena a un día bien organizado."
          }
        },
        {
          "prompt": "Si vas al centro mañana, ¿nos vemos para tomar algo?",
          "model": "Sí, claro. Cuando termine mis trámites, te escribiré para encontrarnos.",
          "alternatives": [
            "Me encantaría, pero primero tengo que terminar un trabajo.",
            "Sí, nos encontraremos a las cinco en la plaza."
          ],
          "options": [
            {
              "label": "Futuro: te escribiré",
              "text": "Sí, claro. Cuando termine mis trámites, te escribiré para encontrarnos."
            },
            {
              "label": "Con «, pero»",
              "text": "Me encantaría, pero primero tengo que terminar un trabajo."
            },
            {
              "label": "Nosotros: encontraremos",
              "text": "Sí, nos encontraremos a las cinco en la plaza."
            }
          ],
          "keywords": [
            "escribire",
            "encontraremos",
            "termine",
            "pero"
          ],
          "why": "«Te escribiré» y «nos encontraremos» expresan acuerdos futuros con precisión.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Futuro y acuerdo",
            "rule": "Confirma el plan usando un verbo en futuro.",
            "highlight": [
              "escribiré",
              "encontraremos",
              "termine"
            ]
          }
        }
      ],
      "tone": "cercano"
    },
    {
      "id": "trabajo-comunicacion-escrita",
      "level": 2,
      "tone": "cordial",
      "avatar": "💼",
      "name": "Patricia (Jefa)",
      "situation": "Pedir subtítulos y mensajes escritos en el trabajo",
      "place": "Trabajo · Accesibilidad",
      "duration": "6–7 min",
      "goal": "Practica explicar con claridad por qué prefieres mensajes de texto y subtítulos usando porque, para que, pero y además.",
      "closing": "Totalmente de acuerdo. Desde hoy enviaremos textos en vez de audios y activaremos subtítulos en todas las reuniones. Gracias por decirlo.",
      "turns": [
        {
          "prompt": "Hola. Acabo de enviar un audio largo al grupo del trabajo con las tareas de esta semana. ¿Lo pudiste escuchar?",
          "model": "Hola, Patricia. No puedo escuchar los audios porque soy persona sorda. ¿Me puedes escribir un resumen, por favor?",
          "alternatives": [
            "Hola, Patricia. Como soy sordo no puedo oír los audios; por eso, necesito los acuerdos por texto.",
            "Hola. Prefiero recibir las indicaciones escritas porque así las comprendo sin perder detalles."
          ],
          "options": [
            {
              "label": "💡 Motivo: «porque»",
              "text": "Hola, Patricia. No puedo escuchar los audios porque soy persona sorda. ¿Me puedes escribir un resumen, por favor?"
            },
            {
              "label": "🎯 Consecuencia: «por eso»",
              "text": "Hola, Patricia. Como soy sordo no puedo oír los audios; por eso, necesito los acuerdos por texto."
            },
            {
              "label": "✍️ Pedir texto claro",
              "text": "Hola. Prefiero recibir las indicaciones escritas porque así las comprendo sin perder detalles."
            }
          ],
          "keywords": [
            "porque",
            "por eso",
            "sord",
            "escrito",
            "texto",
            "resumen"
          ],
          "why": "Usa «porque» o «por eso» para explicar tu necesidad laboral con seguridad y cortesía.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: porque / por eso",
            "formula": "✋ No puedo oír audios  +  💡 porque / 🎯 por eso  +  ✍️ texto",
            "rule": "Explica el motivo con «porque» o el resultado con «por eso».",
            "highlight": [
              "porque",
              "por eso"
            ]
          },
          "reactions": {
            "reason": "¡Mil disculpas! Tienes toda la razón, debí escribirlo."
          }
        },
        {
          "prompt": "Tienes toda la razón, disculpa. Ahora mismo escribo los puntos en el grupo. Mañana tenemos videollamada a las 10:00, ¿cómo la hacemos más accesible para ti?",
          "model": "Gracias, Patricia. Podemos activar los subtítulos automáticos y, además, compartir la agenda escrita antes.",
          "alternatives": [
            "Sería genial activar los subtítulos para que pueda seguir la reunión en tiempo real.",
            "Podemos usar subtítulos, pero también ayuda que hablen uno a la vez y escriban las fechas en el chat."
          ],
          "options": [
            {
              "label": "➕ Sumar: «además»",
              "text": "Gracias, Patricia. Podemos activar los subtítulos automáticos y, además, compartir la agenda escrita antes."
            },
            {
              "label": "🏁 Objetivo: «para que»",
              "text": "Sería genial activar los subtítulos para que pueda seguir la reunión en tiempo real."
            },
            {
              "label": "⚖️ Detalle: «, pero»",
              "text": "Podemos usar subtítulos, pero también ayuda que hablen uno a la vez y escriban las fechas en el chat."
            }
          ],
          "keywords": [
            "subtitulos",
            "ademas",
            "para que",
            "pero",
            "chat",
            "agenda"
          ],
          "why": "Combinar «además» o «para que» permite proponer soluciones concretas en equipo.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: además / para que",
            "formula": "💬 Subtítulos  +  ➕ además / 🏁 para que  +  apoyo",
            "rule": "Propón una solución práctica usando «además», «para que» o «, pero».",
            "highlight": [
              "además",
              "para que",
              "pero"
            ]
          }
        },
        {
          "prompt": "Excelente idea. A veces el equipo habla rápido en las llamadas. ¿Qué prefieres hacer si algo no se entiende en los subtítulos?",
          "model": "Si algo no queda claro, escribiré en el chat de la reunión para que puedan repetirlo.",
          "alternatives": [
            "Aunque los subtítulos ayudan mucho, a veces fallan; por eso, prefiero confirmar las decisiones por escrito al final.",
            "Levantaré la mano en pantalla y escribiré mi pregunta en el chat."
          ],
          "options": [
            {
              "label": "🔗 Condición: «Si… para que»",
              "text": "Si algo no queda claro, escribiré en el chat de la reunión para que puedan repetirlo."
            },
            {
              "label": "🔄 Con «aunque» + «por eso»",
              "text": "Aunque los subtítulos ayudan mucho, a veces fallan; por eso, prefiero confirmar las decisiones por escrito al final."
            },
            {
              "label": "⏩ Futuro claro",
              "text": "Levantaré la mano en pantalla y escribiré mi pregunta en el chat."
            }
          ],
          "keywords": [
            "chat",
            "escribire",
            "para que",
            "aunque",
            "por eso",
            "si"
          ],
          "why": "Usar «si…» + futuro («escribiré») deja un acuerdo claro antes de la reunión.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si… / aunque",
            "formula": "❓ Si pasa X  →  ⏩ escribiré  +  🏁 para que…",
            "rule": "Acuerda qué harás usando «si…» o «aunque…».",
            "highlight": [
              "si",
              "aunque",
              "por eso",
              "para que",
              "escribiré"
            ]
          }
        },
        {
          "prompt": "Perfecto. ¿Te parece bien si también resumimos los acuerdos en un documento compartido al terminar?",
          "model": "Sí, me parece excelente porque así todo el equipo tiene la misma información.",
          "alternatives": [
            "Sí, por favor. Eso nos ayudará a todos, entonces nadie olvidará sus tareas.",
            "¡Claro! Además, puedo revisar el documento con calma después de la reunión."
          ],
          "options": [
            {
              "label": "💡 Con «porque»",
              "text": "Sí, me parece excelente porque así todo el equipo tiene la misma información."
            },
            {
              "label": "➡️ Con «entonces»",
              "text": "Sí, por favor. Eso nos ayudará a todos, entonces nadie olvidará sus tareas."
            },
            {
              "label": "➕ Con «además»",
              "text": "¡Claro! Además, puedo revisar el documento con calma después de la reunión."
            }
          ],
          "keywords": [
            "si",
            "porque",
            "entonces",
            "ademas",
            "documento"
          ],
          "why": "Cerrar confirmando el beneficio refuerza el trabajo en equipo.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Cierre con conector",
            "formula": "👍 Sí  +  💡 porque / ➡️ entonces / ➕ además",
            "rule": "Confirma el acuerdo y explica el beneficio con un conector.",
            "highlight": [
              "porque",
              "entonces",
              "además"
            ]
          }
        }
      ]
    },
    {
      "id": "interprete-coordinacion",
      "level": 2,
      "tone": "amigable",
      "avatar": "🤟",
      "name": "Valeria (Intérprete LSP)",
      "situation": "Coordinar una interpretación en LSP",
      "place": "Accesibilidad · LSP",
      "duration": "5–6 min",
      "goal": "Practica coordinar fecha, lugar, tema y envío de materiales usando futuro, preposiciones (al, del, en el) y conectores.",
      "closing": "¡Listo! Ya lo anoté en mi agenda. Llegaré 15 minutos antes para saludarnos y coordinar detalles. 👋",
      "turns": [
        {
          "prompt": "Hola. Vi tu mensaje sobre el servicio de interpretación en LSP. ¿Para qué actividad y qué día lo necesitas?",
          "model": "Hola, Valeria. Necesito interpretación para una charla en el auditorio este jueves a las cuatro.",
          "alternatives": [
            "Hola. El próximo jueves tendré una reunión importante en el trabajo y necesito apoyo en LSP.",
            "Hola, Valeria. Quiero coordinar una interpretación para el jueves porque voy a exponer un proyecto."
          ],
          "options": [
            {
              "label": "📍 Lugar: «en el»",
              "text": "Hola, Valeria. Necesito interpretación para una charla en el auditorio este jueves a las cuatro."
            },
            {
              "label": "⏩ Futuro: «tendré»",
              "text": "Hola. El próximo jueves tendré una reunión importante en el trabajo y necesito apoyo en LSP."
            },
            {
              "label": "💡 Motivo: «porque»",
              "text": "Hola, Valeria. Quiero coordinar una interpretación para el jueves porque voy a exponer un proyecto."
            }
          ],
          "keywords": [
            "jueves",
            "charla",
            "reunion",
            "proyecto",
            "en el",
            "porque"
          ],
          "why": "Da el tipo de actividad, el día y la hora en una sola idea ordenada.",
          "focus": {
            "type": "preposicion",
            "badge": "📍 Actividad + Día + Lugar",
            "formula": "🤟 Necesito para…  +  📅 día  +  📍 en el / en la",
            "rule": "Indica actividad, fecha y lugar usando «para» y «en el / en la».",
            "highlight": [
              "para",
              "en el",
              "tendré",
              "porque"
            ]
          }
        },
        {
          "prompt": "Tengo disponibilidad el jueves a las cuatro. ¿Cuánto tiempo durará aproximadamente la actividad?",
          "model": "Durará aproximadamente una hora y media, pero quizá haya preguntas al final.",
          "alternatives": [
            "Creo que terminará a las cinco y media; por eso, reservemos dos horas por si acaso.",
            "Será de cuatro a cinco y media, aunque prefiero llegar un poco antes."
          ],
          "options": [
            {
              "label": "⚖️ Con «, pero»",
              "text": "Durará aproximadamente una hora y media, pero quizá haya preguntas al final."
            },
            {
              "label": "🎯 Con «por eso»",
              "text": "Creo que terminará a las cinco y media; por eso, reservemos dos horas por si acaso."
            },
            {
              "label": "🔄 Con «aunque»",
              "text": "Será de cuatro a cinco y media, aunque prefiero llegar un poco antes."
            }
          ],
          "keywords": [
            "hora",
            "pero",
            "por eso",
            "aunque",
            "durara"
          ],
          "why": "Usa futuro («durará», «será», «terminará») para estimar la duración.",
          "focus": {
            "type": "verbo",
            "badge": "⏩ Futuro + Conector",
            "formula": "⏩ Durará / Será  +  ⚖️ , pero / 🎯 por eso",
            "rule": "Indica la duración en futuro y añade un detalle con conector.",
            "highlight": [
              "durará",
              "terminará",
              "será",
              "pero",
              "por eso",
              "aunque"
            ]
          }
        },
        {
          "prompt": "Perfecto. ¿Me puedes enviar el tema o las diapositivas antes para preparar el vocabulario?",
          "model": "Sí, claro. Mañana te enviaré las diapositivas para que puedas revisar los términos técnicos.",
          "alternatives": [
            "Sí, hoy por la noche te mando el documento; además, te pasaré una lista de palabras clave.",
            "Todavía no tengo las diapositivas finales, pero te enviaré el resumen hoy mismo."
          ],
          "options": [
            {
              "label": "⏩ «enviaré» + «para que»",
              "text": "Sí, claro. Mañana te enviaré las diapositivas para que puedas revisar los términos técnicos."
            },
            {
              "label": "➕ Con «además»",
              "text": "Sí, hoy por la noche te mando el documento; además, te pasaré una lista de palabras clave."
            },
            {
              "label": "⚖️ Con «, pero»",
              "text": "Todavía no tengo las diapositivas finales, pero te enviaré el resumen hoy mismo."
            }
          ],
          "keywords": [
            "diapositivas",
            "enviare",
            "para que",
            "ademas",
            "pero"
          ],
          "why": "«Para que puedas revisar» explica el propósito del envío.",
          "focus": {
            "type": "conector",
            "badge": "🏁 Objetivo: para que",
            "formula": "⏩ Te enviaré  +  🏁 para que  +  puedas revisar",
            "rule": "Confirma cuándo enviarás el material y para qué.",
            "highlight": [
              "enviaré",
              "para que",
              "además",
              "pero"
            ]
          }
        },
        {
          "prompt": "Genial, eso ayuda muchísimo. ¿Nos encontramos en la entrada del local antes de empezar?",
          "model": "Sí, nos vemos en la puerta del auditorio a las tres y cuarenta y cinco.",
          "alternatives": [
            "De acuerdo, te espero cerca del ingreso principal para entrar juntos.",
            "Perfecto. Cuando llegue al local, te escribiré un mensaje."
          ],
          "options": [
            {
              "label": "📍 Contracción «del»",
              "text": "Sí, nos vemos en la puerta del auditorio a las tres y cuarenta y cinco."
            },
            {
              "label": "📍 «cerca del»",
              "text": "De acuerdo, te espero cerca del ingreso principal para entrar juntos."
            },
            {
              "label": "📍 Contracción «al»",
              "text": "Perfecto. Cuando llegue al local, te escribiré un mensaje."
            }
          ],
          "keywords": [
            "del",
            "al",
            "puerta",
            "local",
            "auditorio"
          ],
          "why": "Recuerda: «de + el» = «del» (puerta del auditorio) y «a + el» = «al» (al local).",
          "focus": {
            "type": "preposicion",
            "badge": "📍 Uniones: al / del",
            "formula": "de + el = del  ·  a + el = al",
            "rule": "Confirma el punto de encuentro usando «del» o «al».",
            "highlight": [
              "del",
              "al",
              "escribiré"
            ]
          }
        }
      ]
    },
    {
      "id": "salud-cita",
      "level": 2,
      "avatar": "🏥",
      "name": "Consulta de salud (simulada)",
      "situation": "Explicar un malestar y pedir indicaciones escritas",
      "place": "Hospital",
      "duration": "5–6 min",
      "goal": "Practica describir síntomas y responder preguntas.",
      "closing": "Terminamos la práctica de escritura. En una consulta real, el profesional te indicará qué hacer.",
      "turns": [
        {
          "prompt": "Buenos días. Cuénteme, ¿qué le pasa?",
          "model": "Buenos días. Me duele la garganta desde ayer.",
          "alternatives": [
            "Tengo dolor de garganta desde ayer.",
            "Desde ayer me duele bastante la garganta."
          ],
          "keywords": [
            "garganta",
            "ayer",
            "duele",
            "dolor"
          ],
          "why": "Para explicar un síntoma incluye qué te duele y desde cuándo.",
          "focus": {
            "type": "conector",
            "badge": "📍 Tiempo: desde",
            "rule": "Para explicar un síntoma incluye qué te duele y desde cuándo.",
            "highlight": [
              "desde"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenos días. Me duele la garganta desde ayer."
            },
            {
              "label": "Otra forma natural",
              "text": "Tengo dolor de garganta desde ayer."
            },
            {
              "label": "Alternativa",
              "text": "Desde ayer me duele bastante la garganta."
            }
          ]
        },
        {
          "prompt": "¿Ha tenido fiebre?",
          "model": "Sí, anoche tuve un poco de fiebre.",
          "alternatives": [
            "Sí, tuve fiebre anoche.",
            "Anoche tuve fiebre, pero hoy estoy mejor."
          ],
          "keywords": [
            "fiebre",
            "anoche",
            "si"
          ],
          "why": "Usa pasado (“tuve”) para un síntoma que ocurrió anoche.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "Usa pasado (“tuve”) para un síntoma que ocurrió anoche.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, anoche tuve un poco de fiebre."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, tuve fiebre anoche."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "Anoche tuve fiebre, pero hoy estoy mejor."
            }
          ]
        },
        {
          "prompt": "¿Tiene tos?",
          "model": "Sí, tengo tos, sobre todo por la noche.",
          "alternatives": [
            "Tengo un poco de tos en la noche.",
            "Sí, la tos empeora por la noche."
          ],
          "keywords": [
            "tos",
            "noche"
          ],
          "why": "“Sobre todo” ayuda a destacar el momento en que el síntoma es más fuerte.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "“Sobre todo” ayuda a destacar el momento en que el síntoma es más fuerte.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, tengo tos, sobre todo por la noche."
            },
            {
              "label": "Otra forma natural",
              "text": "Tengo un poco de tos en la noche."
            },
            {
              "label": "Alternativa",
              "text": "Sí, la tos empeora por la noche."
            }
          ]
        },
        {
          "prompt": "¿Está tomando algún medicamento?",
          "model": "No, todavía no he tomado ningún medicamento.",
          "alternatives": [
            "No, aún no he tomado nada.",
            "No estoy tomando medicamentos."
          ],
          "keywords": [
            "no",
            "medic",
            "tom"
          ],
          "why": "“Todavía no he tomado…” expresa que hasta este momento no lo has hecho.",
          "focus": {
            "type": "conector",
            "badge": "⏱️ Tiempo: todavía no",
            "rule": "“Todavía no he tomado…” expresa que hasta este momento no lo has hecho.",
            "highlight": [
              "todavía no"
            ]
          },
          "options": [
            {
              "label": "Con «todavía no»",
              "text": "No, todavía no he tomado ningún medicamento."
            },
            {
              "label": "Con «aún no»",
              "text": "No, aún no he tomado nada."
            },
            {
              "label": "Alternativa",
              "text": "No estoy tomando medicamentos."
            }
          ]
        },
        {
          "prompt": "¿Es alérgico a algún medicamento?",
          "model": "No que yo sepa.",
          "alternatives": [
            "No, no tengo alergias conocidas.",
            "Hasta donde sé, no soy alérgico a medicamentos."
          ],
          "keywords": [
            "no",
            "alerg"
          ],
          "why": "“No que yo sepa” es una forma natural cuando no conoces ninguna alergia.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "“No que yo sepa” es una forma natural cuando no conoces ninguna alergia.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "No que yo sepa."
            },
            {
              "label": "Otra forma natural",
              "text": "No, no tengo alergias conocidas."
            },
            {
              "label": "Alternativa",
              "text": "Hasta donde sé, no soy alérgico a medicamentos."
            }
          ]
        },
        {
          "prompt": "Voy a revisarlo. Necesito que abra la boca.",
          "model": "De acuerdo.",
          "alternatives": [
            "Está bien, doctora.",
            "Claro."
          ],
          "keywords": [
            "acuerdo",
            "bien",
            "claro"
          ],
          "why": "Cuando recibes una indicación sencilla, una confirmación breve es suficiente.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Cuando recibes una indicación sencilla, una confirmación breve es suficiente.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "De acuerdo."
            },
            {
              "label": "Otra forma natural",
              "text": "Está bien, doctora."
            },
            {
              "label": "Alternativa",
              "text": "Claro."
            }
          ]
        },
        {
          "prompt": "En esta práctica, pide que las indicaciones de la consulta te las entreguen por escrito.",
          "model": "¿Puede darme las indicaciones por escrito, por favor?",
          "alternatives": [
            "Quisiera leer las indicaciones para comprenderlas mejor.",
            "Por favor, escriba las indicaciones de la consulta."
          ],
          "keywords": [
            "escrito",
            "indicaciones"
          ],
          "why": "Puedes pedir información por escrito para revisarla con calma.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Puedes pedir información por escrito para revisarla con calma.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "¿Puede darme las indicaciones por escrito, por favor?"
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera leer las indicaciones para comprenderlas mejor."
            },
            {
              "label": "Alternativa",
              "text": "Por favor, escriba las indicaciones de la consulta."
            }
          ]
        },
        {
          "prompt": "Antes de terminar, ¿cómo pedirías que aclaren una indicación que no entiendes?",
          "model": "Disculpe, no entendí esa indicación. ¿Puede explicarla de otra manera?",
          "alternatives": [
            "Tengo una duda. ¿Podría explicármela por escrito?",
            "¿Puede darme un ejemplo para entender mejor?"
          ],
          "keywords": [
            "explicar",
            "entendi",
            "duda"
          ],
          "why": "Pedir una aclaración te ayuda a comprender; no necesitas fingir que entendiste.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Pedir una aclaración te ayuda a comprender; no necesitas fingir que entendiste.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Disculpe, no entendí esa indicación. ¿Puede explicarla de otra manera?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Tengo una duda. ¿Podría explicármela por escrito?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Puede darme un ejemplo para entender mejor?"
            }
          ]
        }
      ],
      "tone": "formal"
    },
    {
      "id": "farmacia-receta",
      "level": 2,
      "avatar": "💊",
      "name": "Farmacéutica",
      "situation": "Comprar con una receta",
      "place": "Salud",
      "duration": "5–6 min",
      "goal": "Practica explicar lo que necesitas, confirmar información y preguntar con cortesía.",
      "closing": "Muy bien. Aquí tiene todo y su comprobante. Que se mejore pronto.",
      "turns": [
        {
          "prompt": "Buenas tardes. ¿En qué puedo ayudarlo?",
          "model": "Buenas tardes. Quiero comprar los medicamentos de esta receta.",
          "alternatives": [
            "Buenas tardes. Tengo esta receta y necesito los medicamentos indicados.",
            "Quisiera comprar lo que aparece en esta receta."
          ],
          "keywords": [
            "receta",
            "medic"
          ],
          "why": "Menciona desde el inicio que tienes una receta y cuál es tu objetivo.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Menciona desde el inicio que tienes una receta y cuál es tu objetivo.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenas tardes. Quiero comprar los medicamentos de esta receta."
            },
            {
              "label": "Otra forma natural",
              "text": "Buenas tardes. Tengo esta receta y necesito los medicamentos indicados."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera comprar lo que aparece en esta receta."
            }
          ]
        },
        {
          "prompt": "Claro. ¿La receta es para usted?",
          "model": "Sí, es para mí.",
          "alternatives": [
            "Sí, la receta es mía.",
            "Sí, estos medicamentos son para mí."
          ],
          "keywords": [
            "si",
            "mi"
          ],
          "why": "Una pregunta de confirmación puede responderse de forma breve y directa.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Una pregunta de confirmación puede responderse de forma breve y directa.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, es para mí."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, la receta es mía."
            },
            {
              "label": "Alternativa",
              "text": "Sí, estos medicamentos son para mí."
            }
          ]
        },
        {
          "prompt": "Uno de los medicamentos tiene dos presentaciones. ¿Le indicaron tabletas o jarabe?",
          "model": "Me indicaron tabletas.",
          "alternatives": [
            "En la receta dice tabletas.",
            "Debo llevar la presentación en tabletas."
          ],
          "keywords": [
            "tabletas"
          ],
          "why": "Cuando hay opciones, menciona exactamente la presentación indicada.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Cuando hay opciones, menciona exactamente la presentación indicada.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Me indicaron tabletas."
            },
            {
              "label": "Otra forma natural",
              "text": "En la receta dice tabletas."
            },
            {
              "label": "Alternativa",
              "text": "Debo llevar la presentación en tabletas."
            }
          ]
        },
        {
          "prompt": "Perfecto. ¿Necesita que le explique cómo leer la indicación de la caja?",
          "model": "Sí, por favor. Quiero asegurarme de entenderla bien.",
          "alternatives": [
            "Sí, agradecería que me la explique.",
            "Sí, por favor. Quiero revisar la indicación."
          ],
          "keywords": [
            "si",
            "favor",
            "explic",
            "indic"
          ],
          "why": "Si algo no está claro, pedir una explicación es mejor que asumir.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Si algo no está claro, pedir una explicación es mejor que asumir.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, por favor. Quiero asegurarme de entenderla bien."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, agradecería que me la explique."
            },
            {
              "label": "Alternativa",
              "text": "Sí, por favor. Quiero revisar la indicación."
            }
          ]
        },
        {
          "prompt": "Aquí dice que debe seguir lo indicado por su profesional de salud y revisar el horario de la receta.",
          "model": "Entiendo. Voy a seguir exactamente lo que indica la receta.",
          "alternatives": [
            "De acuerdo. Seguiré las indicaciones de la receta.",
            "Entendido. Revisaré bien el horario antes de tomarlo."
          ],
          "keywords": [
            "indic",
            "receta",
            "horario"
          ],
          "why": "Repetir la instrucción con tus palabras ayuda a confirmar que la comprendiste.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Repetir la instrucción con tus palabras ayuda a confirmar que la comprendiste.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Entiendo. Voy a seguir exactamente lo que indica la receta."
            },
            {
              "label": "Otra forma natural",
              "text": "De acuerdo. Seguiré las indicaciones de la receta."
            },
            {
              "label": "Alternativa",
              "text": "Entendido. Revisaré bien el horario antes de tomarlo."
            }
          ]
        },
        {
          "prompt": "¿Desea todos los productos de la receta?",
          "model": "Sí, quisiera llevar todos, por favor.",
          "alternatives": [
            "Sí, voy a llevar todo lo indicado.",
            "Sí, deme todos los productos de la receta, por favor."
          ],
          "keywords": [
            "todos",
            "receta",
            "favor"
          ],
          "why": "“Quisiera” y “por favor” mantienen un tono amable al comprar.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "“Quisiera” y “por favor” mantienen un tono amable al comprar.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Más formal (quisiera)",
              "text": "Sí, quisiera llevar todos, por favor."
            },
            {
              "label": "En futuro",
              "text": "Sí, voy a llevar todo lo indicado."
            },
            {
              "label": "Alternativa",
              "text": "Sí, deme todos los productos de la receta, por favor."
            }
          ]
        },
        {
          "prompt": "El total es treinta y seis soles. ¿Cómo va a pagar?",
          "model": "Voy a pagar con tarjeta.",
          "alternatives": [
            "Con tarjeta, por favor.",
            "Pagaré con tarjeta."
          ],
          "keywords": [
            "tarjeta",
            "pagar"
          ],
          "why": "Para indicar el medio de pago puedes usar “voy a pagar con…”.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Para indicar el medio de pago puedes usar “voy a pagar con…”.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Voy a pagar con tarjeta."
            },
            {
              "label": "Otra forma natural",
              "text": "Con tarjeta, por favor."
            },
            {
              "label": "En futuro",
              "text": "Pagaré con tarjeta."
            }
          ]
        },
        {
          "prompt": "Listo. ¿Necesita una bolsa?",
          "model": "Sí, por favor. Muchas gracias.",
          "alternatives": [
            "Sí, una bolsa, por favor.",
            "Sí. Gracias por la atención."
          ],
          "keywords": [
            "bolsa",
            "gracias",
            "favor"
          ],
          "why": "Puedes responder la pregunta y agradecer en el mismo mensaje.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Puedes responder la pregunta y agradecer en el mismo mensaje.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, por favor. Muchas gracias."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, una bolsa, por favor."
            },
            {
              "label": "Alternativa",
              "text": "Sí. Gracias por la atención."
            }
          ]
        }
      ],
      "tone": "cordial"
    },
    {
      "id": "banco-dni",
      "level": 2,
      "avatar": "🏦",
      "name": "Asesor del banco",
      "situation": "Revisar datos en el banco",
      "place": "Banco",
      "duration": "5–6 min",
      "goal": "Practica confirmar datos, responder sí/no cuando corresponde y pedir una corrección si hace falta.",
      "closing": "Muy bien. La revisión terminó. Guarde su constancia si la necesita. Que tenga buen día.",
      "turns": [
        {
          "prompt": "Buenos días. ¿En qué puedo ayudarlo?",
          "model": "Buenos días. Quiero revisar mis datos personales.",
          "alternatives": [
            "Buenos días. Quisiera verificar que mis datos estén correctos.",
            "Necesito revisar la información de mi cuenta."
          ],
          "keywords": [
            "revis",
            "datos",
            "informacion"
          ],
          "why": "Explica de forma directa qué quieres revisar.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Explica de forma directa qué quieres revisar.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenos días. Quiero revisar mis datos personales."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Buenos días. Quisiera verificar que mis datos estén correctos."
            },
            {
              "label": "Alternativa",
              "text": "Necesito revisar la información de mi cuenta."
            }
          ]
        },
        {
          "prompt": "Claro. ¿Tiene su DNI?",
          "model": "Sí, aquí está mi DNI.",
          "alternatives": [
            "Sí, lo tengo aquí.",
            "Claro, aquí tiene mi DNI."
          ],
          "keywords": [
            "si",
            "dni",
            "aqui"
          ],
          "why": "Si la pregunta es directa, “Sí” puede bastar; puedes agregar el documento para dar más información.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Si la pregunta es directa, “Sí” puede bastar; puedes agregar el documento para dar más información.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, aquí está mi DNI."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, lo tengo aquí."
            },
            {
              "label": "Alternativa",
              "text": "Claro, aquí tiene mi DNI."
            }
          ]
        },
        {
          "prompt": "Gracias. ¿Cambió su dirección o su número de teléfono?",
          "model": "No, mis datos siguen iguales.",
          "alternatives": [
            "No, no cambió ninguno.",
            "Sí, cambió mi dirección.",
            "Sí, cambió mi número de teléfono."
          ],
          "keywords": [
            "no",
            "direccion",
            "telefono",
            "cambio"
          ],
          "why": "Responde según tu situación. “No” es suficiente si nada cambió.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Responde según tu situación. “No” es suficiente si nada cambió.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "No, mis datos siguen iguales."
            },
            {
              "label": "Otra forma natural",
              "text": "No, no cambió ninguno."
            },
            {
              "label": "Alternativa",
              "text": "Sí, cambió mi dirección."
            }
          ]
        },
        {
          "prompt": "Entendido. ¿Desea revisar que la dirección registrada esté correcta?",
          "model": "Sí, quiero verificarla.",
          "alternatives": [
            "Sí, por favor.",
            "No, no es necesario."
          ],
          "keywords": [
            "si",
            "no",
            "verific"
          ],
          "why": "En una pregunta de confirmación puedes responder brevemente.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "En una pregunta de confirmación puedes responder brevemente.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, quiero verificarla."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, por favor."
            },
            {
              "label": "Alternativa",
              "text": "No, no es necesario."
            }
          ]
        },
        {
          "prompt": "¿La dirección registrada está correcta?",
          "model": "Sí, está correcta.",
          "alternatives": [
            "Sí.",
            "No, necesito corregirla."
          ],
          "keywords": [
            "si",
            "no",
            "correct"
          ],
          "why": "“Sí” o “No” es natural cuando solo debes confirmar un dato.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "“Sí” o “No” es natural cuando solo debes confirmar un dato.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, está correcta."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí."
            },
            {
              "label": "Alternativa",
              "text": "No, necesito corregirla."
            }
          ]
        },
        {
          "prompt": "¿Desea revisar también su número de teléfono?",
          "model": "Sí, por favor.",
          "alternatives": [
            "Sí.",
            "No, gracias."
          ],
          "keywords": [
            "si",
            "no",
            "telefono"
          ],
          "why": "No necesitas una frase larga cuando la elección es simple.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "No necesitas una frase larga cuando la elección es simple.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, por favor."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí."
            },
            {
              "label": "Alternativa",
              "text": "No, gracias."
            }
          ]
        },
        {
          "prompt": "¿El número registrado está correcto?",
          "model": "Sí, está correcto.",
          "alternatives": [
            "Sí.",
            "No, necesito cambiarlo."
          ],
          "keywords": [
            "si",
            "no",
            "correct"
          ],
          "why": "Una respuesta breve puede ser totalmente correcta por contexto.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Una respuesta breve puede ser totalmente correcta por contexto.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, está correcto."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí."
            },
            {
              "label": "Alternativa",
              "text": "No, necesito cambiarlo."
            }
          ]
        },
        {
          "prompt": "Perfecto. La revisión quedó lista. ¿Necesita una constancia?",
          "model": "No, gracias.",
          "alternatives": [
            "Sí, por favor.",
            "No es necesario, gracias."
          ],
          "keywords": [
            "si",
            "no",
            "constancia",
            "gracias"
          ],
          "why": "Al final puedes aceptar o rechazar la constancia con una respuesta corta y cortés.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Al final puedes aceptar o rechazar la constancia con una respuesta corta y cortés.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "No, gracias."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, por favor."
            },
            {
              "label": "Alternativa",
              "text": "No es necesario, gracias."
            }
          ]
        }
      ],
      "tone": "formal"
    },
    {
      "id": "internet-soporte",
      "level": 2,
      "avatar": "📶",
      "name": "Soporte técnico",
      "situation": "Reportar una falla de internet",
      "place": "Tecnología",
      "duration": "5–6 min",
      "goal": "Practica describir un problema, frecuencia y pasos que ya intentaste.",
      "closing": "Registré el reporte. Si la conexión vuelve a fallar, responde a este chat con el número de caso.",
      "turns": [
        {
          "prompt": "Hola. Soy soporte técnico. ¿Qué problema presenta su servicio?",
          "model": "Hola. Mi internet se desconecta varias veces al día.",
          "alternatives": [
            "La conexión se corta varias veces.",
            "Tengo problemas porque el internet se desconecta."
          ],
          "keywords": [
            "internet",
            "desconecta",
            "veces"
          ],
          "why": "Describe qué ocurre y con qué frecuencia.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: porque",
            "rule": "Describe qué ocurre y con qué frecuencia.",
            "highlight": [
              "porque",
              "ya que",
              "por eso"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Hola. Mi internet se desconecta varias veces al día."
            },
            {
              "label": "Otra forma natural",
              "text": "La conexión se corta varias veces."
            },
            {
              "label": "Con «porque» (causa)",
              "text": "Tengo problemas porque el internet se desconecta."
            }
          ]
        },
        {
          "prompt": "¿Desde cuándo sucede?",
          "model": "Desde ayer por la noche.",
          "alternatives": [
            "Empezó anoche.",
            "El problema comenzó ayer."
          ],
          "keywords": [
            "ayer",
            "anoche",
            "empez"
          ],
          "why": "“Desde” indica el momento en que empezó un problema.",
          "focus": {
            "type": "conector",
            "badge": "📍 Tiempo: desde",
            "rule": "“Desde” indica el momento en que empezó un problema.",
            "highlight": [
              "desde"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Desde ayer por la noche."
            },
            {
              "label": "Otra forma natural",
              "text": "Empezó anoche."
            },
            {
              "label": "Alternativa",
              "text": "El problema comenzó ayer."
            }
          ]
        },
        {
          "prompt": "¿Las luces del módem cambian cuando se corta?",
          "model": "Sí, una luz se pone roja.",
          "alternatives": [
            "Sí, la luz de internet cambia a rojo.",
            "Sí, veo una luz roja cuando falla."
          ],
          "keywords": [
            "luz",
            "roja"
          ],
          "why": "Describe lo que observas; eso ayuda a identificar la falla.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Describe lo que observas; eso ayuda a identificar la falla.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, una luz se pone roja."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, la luz de internet cambia a rojo."
            },
            {
              "label": "Alternativa",
              "text": "Sí, veo una luz roja cuando falla."
            }
          ]
        },
        {
          "prompt": "¿Ya reinició el módem?",
          "model": "Sí, lo reinicié dos veces, pero el problema continúa.",
          "alternatives": [
            "Sí, ya lo reinicié y sigue igual.",
            "Lo reinicié, pero todavía se desconecta."
          ],
          "keywords": [
            "reinici",
            "pero",
            "continua"
          ],
          "why": "“Pero” sirve para mostrar que una acción no resolvió el problema.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "“Pero” sirve para mostrar que una acción no resolvió el problema.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Con «pero» (contraste)",
              "text": "Sí, lo reinicié dos veces, pero el problema continúa."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, ya lo reinicié y sigue igual."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "Lo reinicié, pero todavía se desconecta."
            }
          ]
        },
        {
          "prompt": "Voy a revisar la línea. ¿Puede esperar un momento?",
          "model": "Sí, claro. Espero.",
          "alternatives": [
            "De acuerdo, espero.",
            "Sí, no hay problema."
          ],
          "keywords": [
            "si",
            "espero"
          ],
          "why": "Una confirmación breve es suficiente mientras la otra persona revisa algo.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "Una confirmación breve es suficiente mientras la otra persona revisa algo.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Con «pero» (contraste)",
              "text": "Sí, claro. Espero."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "De acuerdo, espero."
            },
            {
              "label": "Alternativa",
              "text": "Sí, no hay problema."
            }
          ]
        },
        {
          "prompt": "Veo una señal inestable. Haré un ajuste remoto.",
          "model": "Entiendo. ¿Necesito hacer algo aquí?",
          "alternatives": [
            "De acuerdo. ¿Debo tocar el módem?",
            "Está bien. ¿Tengo que hacer algún paso?"
          ],
          "keywords": [
            "necesito",
            "hacer",
            "algo"
          ],
          "why": "Pregunta si debes realizar alguna acción de tu lado.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Pregunta si debes realizar alguna acción de tu lado.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Entiendo. ¿Necesito hacer algo aquí?"
            },
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. ¿Debo tocar el módem?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Está bien. ¿Tengo que hacer algún paso?"
            }
          ]
        },
        {
          "prompt": "No por ahora. Espere dos minutos y pruebe de nuevo.",
          "model": "Perfecto. Voy a esperar y luego probaré la conexión.",
          "alternatives": [
            "De acuerdo. Probaré nuevamente en dos minutos.",
            "Entendido. Espero y vuelvo a probar."
          ],
          "keywords": [
            "esper",
            "probar",
            "dos"
          ],
          "why": "Repite los pasos para confirmar que entendiste la instrucción.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "Repite los pasos para confirmar que entendiste la instrucción.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Con «luego»",
              "text": "Perfecto. Voy a esperar y luego probaré la conexión."
            },
            {
              "label": "Otra forma natural",
              "text": "De acuerdo. Probaré nuevamente en dos minutos."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "Entendido. Espero y vuelvo a probar."
            }
          ]
        }
      ],
      "tone": "cordial"
    },
    {
      "id": "reniec-dni",
      "level": 2,
      "avatar": "🪪",
      "name": "Orientador de RENIEC",
      "situation": "Hacer un trámite de DNI en RENIEC",
      "place": "RENIEC",
      "duration": "5–6 min",
      "goal": "Practica explicar qué trámite necesitas, preguntar requisitos y confirmar los pasos.",
      "closing": "Muy bien. Con esos pasos podrás continuar el trámite. Revisa tu constancia y guarda la información de seguimiento.",
      "turns": [
        {
          "prompt": "Buenos días. ¿Qué trámite desea realizar?",
          "model": "Buenos días. Quiero renovar mi DNI.",
          "alternatives": [
            "Buenos días. Necesito renovar mi DNI.",
            "Quisiera hacer la renovación de mi DNI."
          ],
          "keywords": [
            "renovar",
            "dni"
          ],
          "why": "En RENIEC conviene decir claramente qué trámite necesitas desde el inicio.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "En RENIEC conviene decir claramente qué trámite necesitas desde el inicio.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenos días. Quiero renovar mi DNI."
            },
            {
              "label": "Otra forma natural",
              "text": "Buenos días. Necesito renovar mi DNI."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera hacer la renovación de mi DNI."
            }
          ]
        },
        {
          "prompt": "¿Su DNI está vencido o está por vencer?",
          "model": "Está por vencer el próximo mes.",
          "alternatives": [
            "Todavía no vence, pero vence el próximo mes.",
            "Mi DNI está cerca de vencer."
          ],
          "keywords": [
            "vencer",
            "mes"
          ],
          "why": "“Está por…” sirve para decir que algo sucederá pronto.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "“Está por…” sirve para decir que algo sucederá pronto.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Está por vencer el próximo mes."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "Todavía no vence, pero vence el próximo mes."
            },
            {
              "label": "Alternativa",
              "text": "Mi DNI está cerca de vencer."
            }
          ]
        },
        {
          "prompt": "De acuerdo. Necesita seguir el procedimiento de renovación. ¿Ya realizó el pago correspondiente?",
          "model": "Todavía no. ¿Dónde puedo realizar el pago?",
          "alternatives": [
            "No todavía. ¿Cómo puedo pagar?",
            "Aún no he pagado. ¿Dónde se realiza el pago?"
          ],
          "keywords": [
            "no",
            "pago",
            "donde"
          ],
          "why": "Si te falta un paso, dilo claramente y pregunta cómo realizarlo.",
          "focus": {
            "type": "conector",
            "badge": "⏱️ Tiempo: todavía no",
            "rule": "Si te falta un paso, dilo claramente y pregunta cómo realizarlo.",
            "highlight": [
              "todavía no"
            ]
          },
          "options": [
            {
              "label": "Con «todavía no»",
              "text": "Todavía no. ¿Dónde puedo realizar el pago?"
            },
            {
              "label": "Hacer pregunta",
              "text": "No todavía. ¿Cómo puedo pagar?"
            },
            {
              "label": "Con «aún no»",
              "text": "Aún no he pagado. ¿Dónde se realiza el pago?"
            }
          ]
        },
        {
          "prompt": "Puede revisar los canales de pago disponibles antes de continuar.",
          "model": "Entiendo. Después de pagar, ¿qué debo hacer?",
          "alternatives": [
            "De acuerdo. ¿Cuál es el siguiente paso?",
            "Perfecto. Cuando pague, ¿cómo continúo?"
          ],
          "keywords": [
            "despues",
            "pagar",
            "siguiente",
            "paso"
          ],
          "why": "“Después de…” ayuda a preguntar por el orden correcto de un trámite.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: después",
            "rule": "“Después de…” ayuda a preguntar por el orden correcto de un trámite.",
            "highlight": [
              "después",
              "luego",
              "primero"
            ]
          },
          "options": [
            {
              "label": "Con «después»",
              "text": "Entiendo. Después de pagar, ¿qué debo hacer?"
            },
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. ¿Cuál es el siguiente paso?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Perfecto. Cuando pague, ¿cómo continúo?"
            }
          ]
        },
        {
          "prompt": "Luego debe continuar con el registro de la solicitud y verificar sus datos.",
          "model": "¿Debo revisar mi dirección y mis nombres antes de confirmar?",
          "alternatives": [
            "¿Tengo que verificar todos mis datos?",
            "¿Debo comprobar que mi información esté correcta?"
          ],
          "keywords": [
            "revis",
            "datos",
            "direccion",
            "nombres"
          ],
          "why": "Antes de confirmar un trámite, es útil preguntar qué información debes verificar.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Antes de confirmar un trámite, es útil preguntar qué información debes verificar.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "¿Debo revisar mi dirección y mis nombres antes de confirmar?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Tengo que verificar todos mis datos?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Debo comprobar que mi información esté correcta?"
            }
          ]
        },
        {
          "prompt": "Sí. Revise cuidadosamente sus datos personales.",
          "model": "De acuerdo. Si encuentro un error, ¿puedo corregirlo antes de continuar?",
          "alternatives": [
            "¿Qué hago si un dato está incorrecto?",
            "¿Puedo corregir un dato antes de confirmar la solicitud?"
          ],
          "keywords": [
            "error",
            "correg",
            "dato"
          ],
          "why": "Una pregunta con “si” permite plantear una situación posible y pedir una solución.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "Una pregunta con “si” permite plantear una situación posible y pedir una solución.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. Si encuentro un error, ¿puedo corregirlo antes de continuar?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Qué hago si un dato está incorrecto?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Puedo corregir un dato antes de confirmar la solicitud?"
            }
          ]
        },
        {
          "prompt": "Debe corregir cualquier dato que corresponda antes de finalizar el proceso.",
          "model": "Entiendo. ¿Cómo sabré cuándo mi DNI esté listo?",
          "alternatives": [
            "¿Me avisarán cuando esté listo?",
            "¿Cómo puedo revisar el estado del trámite?"
          ],
          "keywords": [
            "listo",
            "avis",
            "estado",
            "tramite"
          ],
          "why": "Al final de un trámite, pregunta cómo recibirás o consultarás la confirmación.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Al final de un trámite, pregunta cómo recibirás o consultarás la confirmación.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Entiendo. ¿Cómo sabré cuándo mi DNI esté listo?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Me avisarán cuando esté listo?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Cómo puedo revisar el estado del trámite?"
            }
          ]
        },
        {
          "prompt": "Podrá revisar el estado del trámite y seguir las indicaciones de entrega.",
          "model": "Perfecto. Muchas gracias por explicarme los pasos.",
          "alternatives": [
            "Gracias. Ahora entiendo mejor el trámite.",
            "Muchas gracias por la orientación."
          ],
          "keywords": [
            "gracias",
            "pasos",
            "tramite"
          ],
          "why": "Cerrar agradeciendo y confirmando que entendiste ayuda a terminar una atención formal.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Cerrar agradeciendo y confirmando que entendiste ayuda a terminar una atención formal.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Perfecto. Muchas gracias por explicarme los pasos."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias. Ahora entiendo mejor el trámite."
            },
            {
              "label": "Alternativa",
              "text": "Muchas gracias por la orientación."
            }
          ]
        }
      ],
      "tone": "formal"
    },
    {
      "id": "accesibilidad-cita",
      "level": 2,
      "avatar": "🤟",
      "name": "Recepción",
      "situation": "Solicitar apoyo de comunicación para una cita",
      "place": "Accesibilidad",
      "duration": "6–7 min",
      "goal": "Practica explicar una necesidad de accesibilidad con claridad y respeto.",
      "closing": "Queda registrada la solicitud. También anotamos que prefieres confirmación por mensaje. Gracias por avisarnos con anticipación.",
      "turns": [
        {
          "prompt": "Buenos días. ¿En qué podemos ayudarlo con su cita?",
          "model": "Buenos días. Necesito apoyo de interpretación en lengua de señas para mi cita.",
          "alternatives": [
            "Quisiera solicitar un intérprete de lengua de señas.",
            "Necesito apoyo de comunicación para poder seguir la cita."
          ],
          "keywords": [
            "interpret",
            "lengua",
            "señas",
            "apoyo"
          ],
          "why": "Explica la necesidad de accesibilidad de forma directa: qué apoyo necesitas y para qué.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Explica la necesidad de accesibilidad de forma directa: qué apoyo necesitas y para qué.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenos días. Necesito apoyo de interpretación en lengua de señas para mi cita."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera solicitar un intérprete de lengua de señas."
            },
            {
              "label": "Alternativa",
              "text": "Necesito apoyo de comunicación para poder seguir la cita."
            }
          ]
        },
        {
          "prompt": "Claro. ¿Para qué fecha es su cita?",
          "model": "Mi cita es el miércoles a las diez de la mañana.",
          "alternatives": [
            "Es este miércoles a las diez.",
            "La cita está programada para el miércoles a las diez."
          ],
          "keywords": [
            "miercoles",
            "diez"
          ],
          "why": "Indica día y hora completos para evitar confusiones.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Indica día y hora completos para evitar confusiones.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Mi cita es el miércoles a las diez de la mañana."
            },
            {
              "label": "Otra forma natural",
              "text": "Es este miércoles a las diez."
            },
            {
              "label": "Alternativa",
              "text": "La cita está programada para el miércoles a las diez."
            }
          ]
        },
        {
          "prompt": "¿La cita es presencial?",
          "model": "Sí, será presencial en la sede del centro.",
          "alternatives": [
            "Sí, tengo que ir a la sede.",
            "Sí, la atención será presencial."
          ],
          "keywords": [
            "si",
            "presencial",
            "sede"
          ],
          "why": "Confirma la modalidad y, si es útil, el lugar.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Confirma la modalidad y, si es útil, el lugar.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, será presencial en la sede del centro."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, tengo que ir a la sede."
            },
            {
              "label": "Alternativa",
              "text": "Sí, la atención será presencial."
            }
          ]
        },
        {
          "prompt": "Voy a registrar la solicitud. ¿Tiene alguna preferencia adicional de comunicación?",
          "model": "Sí. Prefiero recibir las indicaciones importantes también por escrito.",
          "alternatives": [
            "Sí, por favor. Quisiera que la información importante esté escrita.",
            "Me ayuda recibir las instrucciones por escrito."
          ],
          "keywords": [
            "escrito",
            "informacion",
            "indicaciones"
          ],
          "why": "Puedes explicar qué forma de comunicación te ayuda más.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Puedes explicar qué forma de comunicación te ayuda más.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Preferencia",
              "text": "Sí. Prefiero recibir las indicaciones importantes también por escrito."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Sí, por favor. Quisiera que la información importante esté escrita."
            },
            {
              "label": "Alternativa",
              "text": "Me ayuda recibir las instrucciones por escrito."
            }
          ]
        },
        {
          "prompt": "Entendido. Lo anotaremos.",
          "model": "Gracias. ¿Me confirmarán si el apoyo estará disponible?",
          "alternatives": [
            "Muchas gracias. ¿Recibiré una confirmación?",
            "¿Me pueden avisar cuando quede confirmado?"
          ],
          "keywords": [
            "confirm",
            "avisa",
            "disponible"
          ],
          "why": "Pide una confirmación para saber si la solicitud quedó resuelta.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "Pide una confirmación para saber si la solicitud quedó resuelta.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Gracias. ¿Me confirmarán si el apoyo estará disponible?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Muchas gracias. ¿Recibiré una confirmación?"
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Me pueden avisar cuando quede confirmado?"
            }
          ]
        },
        {
          "prompt": "Sí, le enviaremos un mensaje.",
          "model": "Perfecto. Prefiero que la confirmación sea por mensaje de texto.",
          "alternatives": [
            "Gracias. Un mensaje de texto está bien.",
            "Perfecto, por favor envíenme la confirmación por escrito."
          ],
          "keywords": [
            "mensaje",
            "texto",
            "confirm"
          ],
          "why": "Puedes indicar el canal de comunicación que prefieres.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Puedes indicar el canal de comunicación que prefieres.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Preferencia",
              "text": "Perfecto. Prefiero que la confirmación sea por mensaje de texto."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias. Un mensaje de texto está bien."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto, por favor envíenme la confirmación por escrito."
            }
          ]
        },
        {
          "prompt": "De acuerdo. ¿Hay algo más que debamos saber?",
          "model": "No, con eso es suficiente. Muchas gracias por la ayuda.",
          "alternatives": [
            "Eso es todo. Gracias por la atención.",
            "No, gracias. Ya quedó claro."
          ],
          "keywords": [
            "no",
            "gracias",
            "ayuda"
          ],
          "why": "Cierra confirmando que la información quedó clara y agradeciendo.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Cierra confirmando que la información quedó clara y agradeciendo.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "No, con eso es suficiente. Muchas gracias por la ayuda."
            },
            {
              "label": "Otra forma natural",
              "text": "Eso es todo. Gracias por la atención."
            },
            {
              "label": "Alternativa",
              "text": "No, gracias. Ya quedó claro."
            }
          ]
        }
      ],
      "tone": "formal"
    },
    {
      "id": "taller-conectores-orden",
      "level": 3,
      "avatar": "🧩",
      "name": "Sofía",
      "situation": "Conectores: primero, luego, además, finalmente",
      "place": "Conectores · Orden",
      "duration": "6–7 min",
      "goal": "Aprende a ordenar pasos y sumar ideas usando primero, luego, después, además y finalmente.",
      "closing": "¡Qué claro lo explicaste! Con esos conectores se entiende cada paso en orden. 🌟",
      "turns": [
        {
          "prompt": "Hola. Quiero aprender a usar LSPedia desde mi celular. ¿Qué debo hacer primero?",
          "model": "Primero, abre el navegador y entra a la página de LSPedia.",
          "alternatives": [
            "Primero debes entrar a lspedia.site y elegir la sección de Vocabulario.",
            "Primero busca LSPedia en Google y luego guarda la página en tu inicio."
          ],
          "options": [
            {
              "label": "Inicio: «Primero, …»",
              "text": "Primero, abre el navegador y entra a la página de LSPedia."
            },
            {
              "label": "Paso 1 + acción",
              "text": "Primero debes entrar a lspedia.site y elegir la sección de Vocabulario."
            },
            {
              "label": "«Primero… y luego…»",
              "text": "Primero busca LSPedia en Google y luego guarda la página en tu inicio."
            }
          ],
          "keywords": [
            "primero",
            "luego",
            "pagina",
            "lspedia"
          ],
          "why": "«Primero» señala el paso inicial de una explicación ordenada.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: primero",
            "rule": "Empieza tu explicación con «Primero, …» para marcar el paso 1.",
            "highlight": [
              "primero",
              "luego"
            ]
          }
        },
        {
          "prompt": "Ya entré a la página. ¿Cómo busco una seña en el diccionario?",
          "model": "Luego, toca la pestaña Diccionario y escribe la palabra en el buscador.",
          "alternatives": [
            "Después de entrar, ve al Diccionario y elige una categoría.",
            "Luego escribe la palabra que buscas y toca el botón de la lupa."
          ],
          "options": [
            {
              "label": "Siguiente: «Luego, …»",
              "text": "Luego, toca la pestaña Diccionario y escribe la palabra en el buscador."
            },
            {
              "label": "Con «Después de…»",
              "text": "Después de entrar, ve al Diccionario y elige una categoría."
            },
            {
              "label": "Secuencia clara",
              "text": "Luego escribe la palabra que buscas y toca el botón de la lupa."
            }
          ],
          "keywords": [
            "luego",
            "despues",
            "diccionario",
            "palabra"
          ],
          "why": "«Luego» y «después» conectan el primer paso con el siguiente.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: luego / después",
            "rule": "Indica el segundo paso usando «Luego» o «Después».",
            "highlight": [
              "luego",
              "después"
            ]
          }
        },
        {
          "prompt": "¡Qué práctico! ¿Qué otras herramientas tiene la web además del diccionario?",
          "model": "Además del diccionario, tiene libros digitales y un chat para practicar español.",
          "alternatives": [
            "Tiene una sección de Vocabulario; además, puedes practicar con juegos.",
            "Además, en Recursos encuentras libros digitales y herramientas gratuitas."
          ],
          "options": [
            {
              "label": "Sumar: «Además de…»",
              "text": "Además del diccionario, tiene libros digitales y un chat para practicar español."
            },
            {
              "label": "Sumar: «; además,»",
              "text": "Tiene una sección de Vocabulario; además, puedes practicar con juegos."
            },
            {
              "label": "Al inicio: «Además,»",
              "text": "Además, en Recursos encuentras libros digitales y herramientas gratuitas."
            }
          ],
          "keywords": [
            "ademas",
            "libros",
            "chat",
            "recursos"
          ],
          "why": "«Además» (con tilde) sirve para añadir información nueva a lo que ya dijiste.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: además",
            "rule": "Agrega información extra usando «además».",
            "highlight": [
              "además"
            ]
          }
        },
        {
          "prompt": "Me encantó. ¿Cómo me recomiendas organizar mi práctica cada día?",
          "model": "Primero revisa cinco señas, luego lee una página de un libro y, finalmente, practica en el chat.",
          "alternatives": [
            "Primero practica diez minutos de vocabulario; después, escribe un chat corto.",
            "Puedes practicar un poco cada tarde y, finalmente, repasar lo que aprendiste."
          ],
          "options": [
            {
              "label": "3 pasos completos",
              "text": "Primero revisa cinco señas, luego lee una página de un libro y, finalmente, practica en el chat."
            },
            {
              "label": "«Primero… después…»",
              "text": "Primero practica diez minutos de vocabulario; después, escribe un chat corto."
            },
            {
              "label": "Cierre: «finalmente»",
              "text": "Puedes practicar un poco cada tarde y, finalmente, repasar lo que aprendiste."
            }
          ],
          "keywords": [
            "primero",
            "luego",
            "despues",
            "finalmente"
          ],
          "why": "Usar «primero… luego… finalmente…» estructura cualquier explicación larga con claridad.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Secuencia: primero / luego / finalmente",
            "rule": "Ordena tu consejo usando «primero», «luego» y «finalmente».",
            "highlight": [
              "primero",
              "luego",
              "después",
              "finalmente"
            ]
          }
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "whatsapp-malentendido",
      "level": 3,
      "tone": "amigable",
      "avatar": "💬",
      "name": "Gabriel",
      "situation": "Aclarar un malentendido por WhatsApp",
      "place": "Amigos · Mensajes",
      "duration": "6–7 min",
      "goal": "Practica explicar qué quisiste decir, contrastar ideas y resolver un malentendido con respeto usando pasado, pero, aunque y sin embargo.",
      "closing": "¡Qué alivio aclararlo! A veces por chat el texto se lee distinto. Todo súper bien entre nosotros. 🤝",
      "turns": [
        {
          "prompt": "Oye, ayer leí tu mensaje corto que decía «No voy» y pensé que estabas molesto conmigo. ¿Pasó algo?",
          "model": "Hola, Gabriel. No estoy molesto contigo, pero ayer escribí muy rápido porque estaba ocupado.",
          "alternatives": [
            "Disculpa si sonó serio. No pasó nada malo; sin embargo, no pude explicar bien porque estaba en el bus.",
            "No, para nada. Quise escribir más largo, pero me quedé sin batería."
          ],
          "options": [
            {
              "label": "⚖️ «, pero» + «porque»",
              "text": "Hola, Gabriel. No estoy molesto contigo, pero ayer escribí muy rápido porque estaba ocupado."
            },
            {
              "label": "🔗 Con «sin embargo»",
              "text": "Disculpa si sonó serio. No pasó nada malo; sin embargo, no pude explicar bien porque estaba en el bus."
            },
            {
              "label": "⏪ Pasado: «quise» + «pero»",
              "text": "No, para nada. Quise escribir más largo, pero me quedé sin batería."
            }
          ],
          "keywords": [
            "molesto",
            "contigo",
            "pero",
            "porque",
            "sin embargo",
            "quise"
          ],
          "why": "Por chat los mensajes cortos pueden malinterpretarse; usa «, pero» y «porque» para aclarar con calma.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Aclarar: pero / porque",
            "formula": "😊 No estoy molesto  +  ⚖️ , pero  +  💡 porque…",
            "rule": "Tranquiliza a tu amigo y explica qué pasó usando «, pero» y «porque».",
            "highlight": [
              "contigo",
              "pero",
              "porque",
              "sin embargo",
              "escribí",
              "quise"
            ]
          },
          "reactions": {
            "reason": "¡Ah! Ahora entiendo, qué bueno que me lo explicas.",
            "contrast": "Claro, por texto a veces uno se imagina cosas."
          }
        },
        {
          "prompt": "¡Qué alivio! Entonces no estás molesto. ¿Por qué no pudiste venir a la reunión ayer?",
          "model": "No pude ir porque tuve que ayudar a mi familia con un trámite urgente.",
          "alternatives": [
            "Aunque tenía muchas ganas de ir, al final salí muy tarde del trabajo.",
            "Fui al médico por la tarde; por eso, ya no llegué a tiempo."
          ],
          "options": [
            {
              "label": "⏪ Pasado + «porque»",
              "text": "No pude ir porque tuve que ayudar a mi familia con un trámite urgente."
            },
            {
              "label": "🔄 Con «aunque» + pasado",
              "text": "Aunque tenía muchas ganas de ir, al final salí muy tarde del trabajo."
            },
            {
              "label": "🎯 Pasado + «por eso»",
              "text": "Fui al médico por la tarde; por eso, ya no llegué a tiempo."
            }
          ],
          "keywords": [
            "pude",
            "tuve",
            "sali",
            "fui",
            "porque",
            "aunque",
            "por eso"
          ],
          "why": "Combina verbos en pasado («pude», «tuve», «salí», «fui») con un conector de causa o contraste.",
          "focus": {
            "type": "verbo",
            "badge": "⏪ Pasado + Conector",
            "formula": "⏪ pude / tuve / salí  +  💡 porque / 🔄 aunque",
            "rule": "Cuenta lo que pasó ayer en pasado y une la razón.",
            "highlight": [
              "pude",
              "tuve",
              "salí",
              "fui",
              "porque",
              "aunque",
              "por eso"
            ]
          }
        },
        {
          "prompt": "Entiendo totalmente. A veces por WhatsApp uno lee un mensaje muy corto y se confunde.",
          "model": "Sí, tienes razón. De ahora en adelante intentaré escribir un poco más claro para evitar confusiones.",
          "alternatives": [
            "Es verdad; además, cuando esté apurado te mandaré un emoji o un mensaje breve explicando que luego te escribo.",
            "Exacto. Aunque prefiero mensajes cortos, sé que agregar un «por qué» ayuda mucho."
          ],
          "options": [
            {
              "label": "⏩ Propuesta en futuro",
              "text": "Sí, tienes razón. De ahora en adelante intentaré escribir un poco más claro para evitar confusiones."
            },
            {
              "label": "➕ Con «además»",
              "text": "Es verdad; además, cuando esté apurado te avisaré que luego te escribo con calma."
            },
            {
              "label": "🔄 Con «aunque»",
              "text": "Exacto. Aunque prefiero mensajes cortos, sé que agregar una razón ayuda mucho."
            }
          ],
          "keywords": [
            "razon",
            "ademas",
            "aunque",
            "claro",
            "avisare"
          ],
          "why": "Expresar un acuerdo a futuro mejora la comunicación por chat.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Acuerdo: además / aunque",
            "formula": "🤝 Tienes razón  +  ➕ además / 🔄 aunque  +  acuerdo",
            "rule": "Coincide con tu amigo y propón cómo evitar confusiones.",
            "highlight": [
              "además",
              "aunque",
              "intentaré",
              "avisaré"
            ]
          }
        },
        {
          "prompt": "¡Trato hecho! ¿Nos vemos este domingo para ponernos al día?",
          "model": "Sí, claro. Primero tengo un almuerzo familiar, pero después de las cuatro estoy libre.",
          "alternatives": [
            "¡Genial! El domingo puedo por la tarde, entonces nos encontramos en la cafetería.",
            "Sí, voy contigo el domingo; además, te cuento las novedades de mi trabajo."
          ],
          "options": [
            {
              "label": "🔢 «Primero… , pero después…»",
              "text": "Sí, claro. Primero tengo un almuerzo familiar, pero después de las cuatro estoy libre."
            },
            {
              "label": "➡️ Con «entonces»",
              "text": "¡Genial! El domingo puedo por la tarde, entonces nos encontramos en la cafetería."
            },
            {
              "label": "➕ «contigo» + «además»",
              "text": "Sí, voy contigo el domingo; además, te cuento las novedades de mi trabajo."
            }
          ],
          "keywords": [
            "domingo",
            "primero",
            "pero",
            "entonces",
            "ademas",
            "contigo"
          ],
          "why": "Une dos conectores en una misma respuesta natural («primero…, pero después…»).",
          "focus": {
            "type": "conector",
            "badge": "🔗 Doble conector natural",
            "formula": "1️⃣ Primero…  +  ⚖️ , pero después…",
            "rule": "Acepta el plan y organiza tu horario usando conectores.",
            "highlight": [
              "primero",
              "pero",
              "después",
              "entonces",
              "además",
              "contigo"
            ]
          }
        }
      ]
    },
    {
      "id": "amigos-salida",
      "level": 3,
      "avatar": "👥",
      "name": "Grupo de amigos",
      "situation": "Organizar una salida por chat",
      "place": "Amigos",
      "duration": "7–8 min",
      "goal": "Practica una conversación natural con propuestas, razones y acuerdos.",
      "closing": "¡Listo! Entonces sábado a las cuatro en la plaza. Nos vemos. 🙌",
      "turns": [
        {
          "prompt": "Diego: ¿Qué hacemos este fin de semana?",
          "model": "Podríamos salir el sábado por la tarde.",
          "alternatives": [
            "¿Qué tal si salimos el sábado en la tarde?",
            "Propongo que nos reunamos el sábado."
          ],
          "keywords": [
            "sabado",
            "tarde",
            "salir",
            "reun"
          ],
          "why": "“Podríamos…” permite hacer una propuesta sin imponerla.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "“Podríamos…” permite hacer una propuesta sin imponerla.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Podríamos salir el sábado por la tarde."
            },
            {
              "label": "Hacer pregunta",
              "text": "¿Qué tal si salimos el sábado en la tarde?"
            },
            {
              "label": "Alternativa",
              "text": "Propongo que nos reunamos el sábado."
            }
          ]
        },
        {
          "prompt": "María: El sábado me parece bien. ¿A dónde vamos?",
          "model": "Podemos ir al centro y luego tomar algo.",
          "alternatives": [
            "Podríamos encontrarnos en el centro y después ir a una cafetería.",
            "Vamos al centro y vemos dónde tomar algo."
          ],
          "keywords": [
            "centro",
            "tomar",
            "cafeter"
          ],
          "why": "Usa “luego” o “después” para ordenar dos actividades.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: después",
            "rule": "Usa “luego” o “después” para ordenar dos actividades.",
            "highlight": [
              "después",
              "luego",
              "primero"
            ]
          },
          "options": [
            {
              "label": "Con «luego»",
              "text": "Podemos ir al centro y luego tomar algo."
            },
            {
              "label": "Con «después»",
              "text": "Podríamos encontrarnos en el centro y después ir a una cafetería."
            },
            {
              "label": "Alternativa",
              "text": "Vamos al centro y vemos dónde tomar algo."
            }
          ]
        },
        {
          "prompt": "Diego: ¿A qué hora les queda bien?",
          "model": "A mí me queda bien a las cuatro de la tarde.",
          "alternatives": [
            "Yo puedo a las cuatro.",
            "Las cuatro de la tarde me parece una buena hora."
          ],
          "keywords": [
            "cuatro",
            "tarde"
          ],
          "why": "“Me queda bien” es una expresión natural para aceptar una hora.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "“Me queda bien” es una expresión natural para aceptar una hora.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "A mí me queda bien a las cuatro de la tarde."
            },
            {
              "label": "Otra forma natural",
              "text": "Yo puedo a las cuatro."
            },
            {
              "label": "Alternativa",
              "text": "Las cuatro de la tarde me parece una buena hora."
            }
          ]
        },
        {
          "prompt": "María: Yo salgo de trabajar a las tres y media.",
          "model": "Entonces a las cuatro está bien para que llegues con tiempo.",
          "alternatives": [
            "Perfecto. Nos vemos a las cuatro para que puedas llegar tranquila.",
            "Entonces mantenemos las cuatro; así tienes tiempo de llegar."
          ],
          "keywords": [
            "cuatro",
            "tiempo",
            "entonces"
          ],
          "why": "“Para que” explica la finalidad o razón de una decisión.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: entonces",
            "rule": "“Para que” explica la finalidad o razón de una decisión.",
            "highlight": [
              "entonces",
              "por eso",
              "así que"
            ]
          },
          "options": [
            {
              "label": "Con «entonces»",
              "text": "Entonces a las cuatro está bien para que llegues con tiempo."
            },
            {
              "label": "Con «para que»",
              "text": "Perfecto. Nos vemos a las cuatro para que puedas llegar tranquila."
            },
            {
              "label": "Con «entonces»",
              "text": "Entonces mantenemos las cuatro; así tienes tiempo de llegar."
            }
          ]
        },
        {
          "prompt": "Diego: ¿Nos encontramos en la plaza?",
          "model": "Sí, en la entrada principal de la plaza.",
          "alternatives": [
            "Sí. Mejor en la entrada principal.",
            "De acuerdo, nos encontramos en la entrada de la plaza."
          ],
          "keywords": [
            "entrada",
            "plaza"
          ],
          "why": "Especificar el punto exacto evita confusiones.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Especificar el punto exacto evita confusiones.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, en la entrada principal de la plaza."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí. Mejor en la entrada principal."
            },
            {
              "label": "Alternativa",
              "text": "De acuerdo, nos encontramos en la entrada de la plaza."
            }
          ]
        },
        {
          "prompt": "María: Puede que llueva. ¿Llevamos paraguas?",
          "model": "Sí, sería mejor llevar paraguas por si llueve.",
          "alternatives": [
            "Sí, llevemos paraguas por si acaso.",
            "Buena idea. Es mejor llevar paraguas."
          ],
          "keywords": [
            "paraguas",
            "llue",
            "mejor"
          ],
          "why": "“Por si…” se usa para prepararse ante una posibilidad.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "“Por si…” se usa para prepararse ante una posibilidad.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, sería mejor llevar paraguas por si llueve."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, llevemos paraguas por si acaso."
            },
            {
              "label": "Alternativa",
              "text": "Buena idea. Es mejor llevar paraguas."
            }
          ]
        },
        {
          "prompt": "Diego: También podemos ir a un lugar cerrado si empieza a llover.",
          "model": "Sí, podemos decidirlo cuando estemos allá.",
          "alternatives": [
            "De acuerdo. Si llueve, buscamos un lugar cerrado.",
            "Sí, vemos qué hacemos según el clima."
          ],
          "keywords": [
            "llueve",
            "cerrado",
            "decid",
            "clima"
          ],
          "why": "Una condición con “si” permite planear una alternativa.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "Una condición con “si” permite planear una alternativa.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, podemos decidirlo cuando estemos allá."
            },
            {
              "label": "Otra forma natural",
              "text": "De acuerdo. Si llueve, buscamos un lugar cerrado."
            },
            {
              "label": "Alternativa",
              "text": "Sí, vemos qué hacemos según el clima."
            }
          ]
        },
        {
          "prompt": "María: ¿Alguien más va a ir?",
          "model": "Voy a preguntarle a José si quiere acompañarnos.",
          "alternatives": [
            "Le escribiré a José para invitarlo.",
            "Puedo preguntarle a José si también quiere ir."
          ],
          "keywords": [
            "jose",
            "pregunt",
            "invitar",
            "acompan"
          ],
          "why": "“Si quiere acompañarnos” expresa una invitación indirecta.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "“Si quiere acompañarnos” expresa una invitación indirecta.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Voy a preguntarle a José si quiere acompañarnos."
            },
            {
              "label": "Otra forma natural",
              "text": "Le escribiré a José para invitarlo."
            },
            {
              "label": "Alternativa",
              "text": "Puedo preguntarle a José si también quiere ir."
            }
          ]
        },
        {
          "prompt": "Diego: Avísanos qué te responde.",
          "model": "Claro. Apenas me responda, les aviso por el grupo.",
          "alternatives": [
            "Sí. Les escribo cuando José responda.",
            "De acuerdo, les aviso en cuanto tenga su respuesta."
          ],
          "keywords": [
            "aviso",
            "grupo",
            "respon"
          ],
          "why": "“Apenas” o “en cuanto” indican que harás algo inmediatamente después.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: apenas",
            "rule": "“Apenas” o “en cuanto” indican que harás algo inmediatamente después.",
            "highlight": [
              "apenas"
            ]
          },
          "options": [
            {
              "label": "Con «apenas»",
              "text": "Claro. Apenas me responda, les aviso por el grupo."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí. Les escribo cuando José responda."
            },
            {
              "label": "Alternativa",
              "text": "De acuerdo, les aviso en cuanto tenga su respuesta."
            }
          ]
        },
        {
          "prompt": "María: Entonces ya tenemos hora y lugar.",
          "model": "Sí. Sábado a las cuatro, en la entrada principal de la plaza.",
          "alternatives": [
            "Correcto: nos vemos el sábado a las cuatro en la plaza.",
            "Sí, queda confirmado para el sábado a las cuatro."
          ],
          "keywords": [
            "sabado",
            "cuatro",
            "plaza",
            "confirm"
          ],
          "why": "Al final de una coordinación, resume día, hora y lugar.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Al final de una coordinación, resume día, hora y lugar.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí. Sábado a las cuatro, en la entrada principal de la plaza."
            },
            {
              "label": "Otra forma natural",
              "text": "Correcto: nos vemos el sábado a las cuatro en la plaza."
            },
            {
              "label": "Alternativa",
              "text": "Sí, queda confirmado para el sábado a las cuatro."
            }
          ]
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "colegio-profesora",
      "level": 3,
      "avatar": "👩‍🏫",
      "name": "Profesora Elena",
      "situation": "Coordinar una tarea",
      "place": "Colegio",
      "duration": "5–6 min",
      "goal": "Practica preguntas, explicaciones y mensajes respetuosos.",
      "closing": "Perfecto. Gracias por avisar y organizarte con tiempo. Nos vemos mañana.",
      "turns": [
        {
          "prompt": "Hola. ¿Ya revisaste las indicaciones del trabajo?",
          "model": "Sí, profesora. Ya las revisé, pero tengo una duda.",
          "alternatives": [
            "Sí, ya leí las indicaciones. Quisiera hacerle una pregunta.",
            "Sí, profesora, pero hay una parte que no entiendo."
          ],
          "keywords": [
            "si",
            "duda",
            "pregunta",
            "entiendo"
          ],
          "why": "En un mensaje respetuoso puedes confirmar y luego explicar tu dificultad.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "En un mensaje respetuoso puedes confirmar y luego explicar tu dificultad.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Con «pero» (contraste)",
              "text": "Sí, profesora. Ya las revisé, pero tengo una duda."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Sí, ya leí las indicaciones. Quisiera hacerle una pregunta."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "Sí, profesora, pero hay una parte que no entiendo."
            }
          ]
        },
        {
          "prompt": "Claro. ¿Qué parte no entiendes?",
          "model": "No entiendo si el trabajo debe hacerse individualmente o en grupo.",
          "alternatives": [
            "Quisiera saber si el trabajo es individual o grupal.",
            "Tengo duda sobre si debemos trabajar solos o en grupo."
          ],
          "keywords": [
            "individual",
            "grupo",
            "solos"
          ],
          "why": "Usa “si” sin tilde cuando introduce dos posibilidades: si es individual o en grupo.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "Usa “si” sin tilde cuando introduce dos posibilidades: si es individual o en grupo.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "No entiendo si el trabajo debe hacerse individualmente o en grupo."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera saber si el trabajo es individual o grupal."
            },
            {
              "label": "Alternativa",
              "text": "Tengo duda sobre si debemos trabajar solos o en grupo."
            }
          ]
        },
        {
          "prompt": "Se hace en grupos de tres personas.",
          "model": "Entendido. ¿Podemos elegir a nuestros compañeros?",
          "alternatives": [
            "De acuerdo. ¿Nosotros formamos los grupos?",
            "Gracias. ¿Podemos escoger con quién trabajar?"
          ],
          "keywords": [
            "podemos",
            "compan",
            "grupo",
            "eleg"
          ],
          "why": "Una pregunta clara incluye exactamente la información que necesitas confirmar.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Una pregunta clara incluye exactamente la información que necesitas confirmar.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Entendido. ¿Podemos elegir a nuestros compañeros?"
            },
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. ¿Nosotros formamos los grupos?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Gracias. ¿Podemos escoger con quién trabajar?"
            }
          ]
        },
        {
          "prompt": "Sí, ustedes forman sus grupos.",
          "model": "Perfecto. Ya tengo dos compañeros con quienes trabajar.",
          "alternatives": [
            "Perfecto, ya completamos un grupo de tres.",
            "Muy bien. Ya somos tres personas en mi grupo."
          ],
          "keywords": [
            "dos",
            "tres",
            "grupo",
            "compan"
          ],
          "why": "“Con quienes” conecta a las personas con la acción de trabajar.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "“Con quienes” conecta a las personas con la acción de trabajar.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Perfecto. Ya tengo dos compañeros con quienes trabajar."
            },
            {
              "label": "Otra forma natural",
              "text": "Perfecto, ya completamos un grupo de tres."
            },
            {
              "label": "Alternativa",
              "text": "Muy bien. Ya somos tres personas en mi grupo."
            }
          ]
        },
        {
          "prompt": "¿Ya decidieron el tema?",
          "model": "Sí. Vamos a trabajar sobre el cuidado del agua.",
          "alternatives": [
            "Sí, elegimos el tema del cuidado del agua.",
            "Nuestro tema será el cuidado del agua."
          ],
          "keywords": [
            "agua",
            "tema",
            "cuidado"
          ],
          "why": "Para un plan futuro puedes usar “vamos a trabajar” o “nuestro tema será…”.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Para un plan futuro puedes usar “vamos a trabajar” o “nuestro tema será…”.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí. Vamos a trabajar sobre el cuidado del agua."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, elegimos el tema del cuidado del agua."
            },
            {
              "label": "Alternativa",
              "text": "Nuestro tema será el cuidado del agua."
            }
          ]
        },
        {
          "prompt": "Bien. Recuerden incluir una conclusión.",
          "model": "De acuerdo. Incluiremos una conclusión al final.",
          "alternatives": [
            "Sí, profesora. La pondremos al final.",
            "Entendido. Vamos a agregar una conclusión."
          ],
          "keywords": [
            "conclusion",
            "final",
            "agregar"
          ],
          "why": "Reformular la indicación demuestra que la entendiste.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Reformular la indicación demuestra que la entendiste.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "De acuerdo. Incluiremos una conclusión al final."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, profesora. La pondremos al final."
            },
            {
              "label": "Alternativa",
              "text": "Entendido. Vamos a agregar una conclusión."
            }
          ]
        },
        {
          "prompt": "¿Cuándo piensan reunirse?",
          "model": "Nos reuniremos mañana después de clases.",
          "alternatives": [
            "Mañana después de clases nos reuniremos.",
            "Hemos quedado en reunirnos mañana al salir."
          ],
          "keywords": [
            "manana",
            "clases",
            "reun"
          ],
          "why": "Para planes futuros, “nos reuniremos” comunica un acuerdo ya definido.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: después",
            "rule": "Para planes futuros, “nos reuniremos” comunica un acuerdo ya definido.",
            "highlight": [
              "después",
              "luego",
              "primero"
            ]
          },
          "options": [
            {
              "label": "Con «después»",
              "text": "Nos reuniremos mañana después de clases."
            },
            {
              "label": "Con «después»",
              "text": "Mañana después de clases nos reuniremos."
            },
            {
              "label": "Alternativa",
              "text": "Hemos quedado en reunirnos mañana al salir."
            }
          ]
        },
        {
          "prompt": "Muy bien. Si tienen otra duda, me escriben.",
          "model": "Muchas gracias, profesora. Le escribiremos si necesitamos ayuda.",
          "alternatives": [
            "Gracias, profesora. Le avisaremos si surge otra duda.",
            "Muchas gracias por la orientación."
          ],
          "keywords": [
            "gracias",
            "ayuda",
            "duda",
            "escrib"
          ],
          "why": "Un cierre formal puede agradecer y confirmar qué harán si necesitan apoyo.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "Un cierre formal puede agradecer y confirmar qué harán si necesitan apoyo.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Muchas gracias, profesora. Le escribiremos si necesitamos ayuda."
            },
            {
              "label": "Otra forma natural",
              "text": "Gracias, profesora. Le avisaremos si surge otra duda."
            },
            {
              "label": "Alternativa",
              "text": "Muchas gracias por la orientación."
            }
          ]
        }
      ],
      "tone": "formal"
    },
    {
      "id": "trabajo-informe",
      "level": 3,
      "avatar": "👨‍💻",
      "name": "Carlos",
      "situation": "Coordinar un informe de trabajo",
      "place": "Trabajo",
      "duration": "5–6 min",
      "goal": "Practica mensajes profesionales y acuerdos claros.",
      "closing": "Excelente. Quedamos así entonces. Gracias por mantenerme informado.",
      "turns": [
        {
          "prompt": "Hola. ¿Cómo vas con el informe de ventas?",
          "model": "Hola, Carlos. Ya avancé bastante, pero todavía me falta revisar los últimos datos.",
          "alternatives": [
            "Hola. El informe está avanzado, aunque aún debo revisar algunos datos.",
            "Voy bien. Solo me falta revisar la información final."
          ],
          "keywords": [
            "informe",
            "revis",
            "datos",
            "falta"
          ],
          "why": "En trabajo es útil informar avance + lo que todavía falta.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "En trabajo es útil informar avance + lo que todavía falta.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Con «pero» (contraste)",
              "text": "Hola, Carlos. Ya avancé bastante, pero todavía me falta revisar los últimos datos."
            },
            {
              "label": "Con «aunque»",
              "text": "Hola. El informe está avanzado, aunque aún debo revisar algunos datos."
            },
            {
              "label": "Alternativa",
              "text": "Voy bien. Solo me falta revisar la información final."
            }
          ]
        },
        {
          "prompt": "¿Crees que estará listo hoy?",
          "model": "Sí, creo que podré terminarlo antes de las cinco.",
          "alternatives": [
            "Sí. Espero terminarlo antes de las cinco.",
            "Creo que sí; lo tendré listo esta tarde."
          ],
          "keywords": [
            "cinco",
            "termin",
            "listo",
            "tarde"
          ],
          "why": "“Creo que podré…” comunica una estimación sin prometer algo imposible.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "“Creo que podré…” comunica una estimación sin prometer algo imposible.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, creo que podré terminarlo antes de las cinco."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "Sí. Espero terminarlo antes de las cinco."
            },
            {
              "label": "Alternativa",
              "text": "Creo que sí; lo tendré listo esta tarde."
            }
          ]
        },
        {
          "prompt": "Necesito enviarlo a gerencia a las cinco y media.",
          "model": "Entiendo. Voy a priorizar la revisión para enviártelo a tiempo.",
          "alternatives": [
            "De acuerdo. Lo revisaré primero para entregarlo a tiempo.",
            "Entiendo la urgencia. Te lo enviaré antes de esa hora."
          ],
          "keywords": [
            "tiempo",
            "revis",
            "enviar",
            "urgencia"
          ],
          "why": "En un contexto profesional, confirma que entendiste la prioridad.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "En un contexto profesional, confirma que entendiste la prioridad.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Entiendo. Voy a priorizar la revisión para enviártelo a tiempo."
            },
            {
              "label": "Otra forma natural",
              "text": "De acuerdo. Lo revisaré primero para entregarlo a tiempo."
            },
            {
              "label": "En futuro",
              "text": "Entiendo la urgencia. Te lo enviaré antes de esa hora."
            }
          ]
        },
        {
          "prompt": "¿Te falta información de algún área?",
          "model": "Sí, me falta el dato de gastos de logística.",
          "alternatives": [
            "Solo falta la información de gastos de logística.",
            "Necesito el dato final del área de logística."
          ],
          "keywords": [
            "logistica",
            "gastos",
            "dato"
          ],
          "why": "Identifica exactamente qué información falta para que la otra persona pueda ayudarte.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Identifica exactamente qué información falta para que la otra persona pueda ayudarte.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, me falta el dato de gastos de logística."
            },
            {
              "label": "Otra forma natural",
              "text": "Solo falta la información de gastos de logística."
            },
            {
              "label": "Alternativa",
              "text": "Necesito el dato final del área de logística."
            }
          ]
        },
        {
          "prompt": "Yo puedo pedirlo ahora.",
          "model": "Gracias. Si me lo envías pronto, podré cerrar el informe.",
          "alternatives": [
            "Perfecto, gracias. Con ese dato termino el informe.",
            "Muchas gracias. Apenas llegue ese dato, termino la revisión."
          ],
          "keywords": [
            "gracias",
            "dato",
            "informe",
            "termin"
          ],
          "why": "“Si + presente, futuro” sirve para explicar una condición real: si llega, podré terminar.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: apenas",
            "rule": "“Si + presente, futuro” sirve para explicar una condición real: si llega, podré terminar.",
            "highlight": [
              "apenas"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Gracias. Si me lo envías pronto, podré cerrar el informe."
            },
            {
              "label": "Otra forma natural",
              "text": "Perfecto, gracias. Con ese dato termino el informe."
            },
            {
              "label": "Con «apenas»",
              "text": "Muchas gracias. Apenas llegue ese dato, termino la revisión."
            }
          ]
        },
        {
          "prompt": "Ya lo solicité. Me dijeron que lo mandan en diez minutos.",
          "model": "Perfecto. Mientras tanto revisaré las demás cifras.",
          "alternatives": [
            "Gracias. Voy a avanzar con la revisión mientras llega.",
            "Perfecto, seguiré revisando el resto."
          ],
          "keywords": [
            "revis",
            "mientras",
            "resto",
            "cifras"
          ],
          "why": "“Mientras tanto” conecta dos acciones que ocurren durante el mismo periodo.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: mientras tanto",
            "rule": "“Mientras tanto” conecta dos acciones que ocurren durante el mismo periodo.",
            "highlight": [
              "mientras tanto"
            ]
          },
          "options": [
            {
              "label": "Con «mientras tanto»",
              "text": "Perfecto. Mientras tanto revisaré las demás cifras."
            },
            {
              "label": "En futuro",
              "text": "Gracias. Voy a avanzar con la revisión mientras llega."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto, seguiré revisando el resto."
            }
          ]
        },
        {
          "prompt": "¿Quieres que revise el documento antes de enviarlo?",
          "model": "Sí, por favor. Me ayudaría que revises las conclusiones.",
          "alternatives": [
            "Sí, gracias. ¿Puedes revisar especialmente las conclusiones?",
            "Por favor, revisa las conclusiones cuando te lo envíe."
          ],
          "keywords": [
            "conclus",
            "revis",
            "favor"
          ],
          "why": "Una petición profesional funciona mejor si especifica qué parte revisar.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Una petición profesional funciona mejor si especifica qué parte revisar.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, por favor. Me ayudaría que revises las conclusiones."
            },
            {
              "label": "Hacer pregunta",
              "text": "Sí, gracias. ¿Puedes revisar especialmente las conclusiones?"
            },
            {
              "label": "Alternativa",
              "text": "Por favor, revisa las conclusiones cuando te lo envíe."
            }
          ]
        },
        {
          "prompt": "Claro. Envíamelo apenas termines.",
          "model": "De acuerdo. Te lo enviaré apenas esté listo.",
          "alternatives": [
            "Perfecto. Te escribo y te lo envío cuando termine.",
            "Está bien. Apenas lo finalice, te lo mando."
          ],
          "keywords": [
            "envio",
            "listo",
            "term",
            "apenas"
          ],
          "why": "“Apenas esté listo” expresa que una acción ocurrirá inmediatamente después de otra.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: apenas",
            "rule": "“Apenas esté listo” expresa que una acción ocurrirá inmediatamente después de otra.",
            "highlight": [
              "apenas"
            ]
          },
          "options": [
            {
              "label": "Con «apenas»",
              "text": "De acuerdo. Te lo enviaré apenas esté listo."
            },
            {
              "label": "Otra forma natural",
              "text": "Perfecto. Te escribo y te lo envío cuando termine."
            },
            {
              "label": "Con «apenas»",
              "text": "Está bien. Apenas lo finalice, te lo mando."
            }
          ]
        }
      ],
      "tone": "cordial"
    },
    {
      "id": "entrevista-trabajo",
      "level": 3,
      "avatar": "👩‍💼",
      "name": "Sra. Ramírez",
      "situation": "Coordinar una entrevista de trabajo",
      "place": "Trabajo",
      "duration": "5–6 min",
      "goal": "Practica mensajes formales, disponibilidad y confirmaciones.",
      "closing": "Perfecto. Queda confirmada su entrevista. Lo esperamos el martes. Éxitos.",
      "turns": [
        {
          "prompt": "Buenos días. Le escribo por su postulación. ¿Tiene unos minutos?",
          "model": "Buenos días. Sí, claro. Muchas gracias por comunicarse conmigo.",
          "alternatives": [
            "Buenos días. Sí, tengo disponibilidad. Gracias por contactarme.",
            "Buenos días. Claro, puedo conversar ahora."
          ],
          "keywords": [
            "buenos",
            "si",
            "gracias",
            "dispon"
          ],
          "why": "En un contexto laboral, saluda y confirma tu disponibilidad con un tono cordial.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "En un contexto laboral, saluda y confirma tu disponibilidad con un tono cordial.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenos días. Sí, claro. Muchas gracias por comunicarse conmigo."
            },
            {
              "label": "Otra forma natural",
              "text": "Buenos días. Sí, tengo disponibilidad. Gracias por contactarme."
            },
            {
              "label": "Alternativa",
              "text": "Buenos días. Claro, puedo conversar ahora."
            }
          ]
        },
        {
          "prompt": "Queremos invitarlo a una entrevista presencial.",
          "model": "Muchas gracias por la invitación. ¿Qué día sería la entrevista?",
          "alternatives": [
            "Gracias. ¿Para qué fecha está programada?",
            "Con gusto. ¿Podría indicarme el día de la entrevista?"
          ],
          "keywords": [
            "gracias",
            "dia",
            "fecha",
            "entrevista"
          ],
          "why": "Después de aceptar, pregunta por el dato que necesitas para organizarte.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Después de aceptar, pregunta por el dato que necesitas para organizarte.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Muchas gracias por la invitación. ¿Qué día sería la entrevista?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Gracias. ¿Para qué fecha está programada?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Con gusto. ¿Podría indicarme el día de la entrevista?"
            }
          ]
        },
        {
          "prompt": "Podría ser el martes a las diez de la mañana.",
          "model": "El martes a las diez me queda bien.",
          "alternatives": [
            "Sí, tengo disponibilidad el martes a las diez.",
            "De acuerdo, puedo asistir a esa hora."
          ],
          "keywords": [
            "martes",
            "diez",
            "bien",
            "asist"
          ],
          "why": "Repite el día y la hora al confirmar una cita importante.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Repite el día y la hora al confirmar una cita importante.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "El martes a las diez me queda bien."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, tengo disponibilidad el martes a las diez."
            },
            {
              "label": "Alternativa",
              "text": "De acuerdo, puedo asistir a esa hora."
            }
          ]
        },
        {
          "prompt": "La oficina queda en la avenida Central 450.",
          "model": "Entendido. ¿Debo preguntar por alguna persona al llegar?",
          "alternatives": [
            "Gracias. ¿Con quién debo anunciarme al llegar?",
            "De acuerdo. ¿A quién debo indicar que vengo a ver?"
          ],
          "keywords": [
            "quien",
            "persona",
            "lleg"
          ],
          "why": "Pregunta por la persona de contacto para evitar confusiones al llegar.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Pregunta por la persona de contacto para evitar confusiones al llegar.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Entendido. ¿Debo preguntar por alguna persona al llegar?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Gracias. ¿Con quién debo anunciarme al llegar?"
            },
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. ¿A quién debo indicar que vengo a ver?"
            }
          ]
        },
        {
          "prompt": "Pregunte por mí, la señora Ramírez.",
          "model": "Perfecto, señora Ramírez. Lo tendré en cuenta.",
          "alternatives": [
            "De acuerdo. Preguntaré por usted al llegar.",
            "Perfecto, gracias por indicármelo."
          ],
          "keywords": [
            "ramirez",
            "perfecto",
            "gracias"
          ],
          "why": "Confirmar el nombre demuestra que registraste correctamente la información.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Confirmar el nombre demuestra que registraste correctamente la información.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Perfecto, señora Ramírez. Lo tendré en cuenta."
            },
            {
              "label": "Otra forma natural",
              "text": "De acuerdo. Preguntaré por usted al llegar."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto, gracias por indicármelo."
            }
          ]
        },
        {
          "prompt": "Traiga su DNI y una copia de su currículum.",
          "model": "De acuerdo. Llevaré mi DNI y una copia de mi currículum.",
          "alternatives": [
            "Entendido. Prepararé ambos documentos.",
            "Está bien. Llevaré los documentos indicados."
          ],
          "keywords": [
            "dni",
            "curriculum",
            "document"
          ],
          "why": "Repetir los documentos permite verificar que no olvidarás ninguno.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Repetir los documentos permite verificar que no olvidarás ninguno.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "De acuerdo. Llevaré mi DNI y una copia de mi currículum."
            },
            {
              "label": "Otra forma natural",
              "text": "Entendido. Prepararé ambos documentos."
            },
            {
              "label": "En futuro",
              "text": "Está bien. Llevaré los documentos indicados."
            }
          ]
        },
        {
          "prompt": "¿Tiene alguna consulta sobre la entrevista?",
          "model": "Sí. ¿Aproximadamente cuánto tiempo durará?",
          "alternatives": [
            "Quisiera saber cuánto dura aproximadamente la entrevista.",
            "Sí. ¿Podría indicarme la duración aproximada?"
          ],
          "keywords": [
            "cuanto",
            "tiempo",
            "dur"
          ],
          "why": "“Aproximadamente” es útil cuando sabes que la duración puede variar.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "“Aproximadamente” es útil cuando sabes que la duración puede variar.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Sí. ¿Aproximadamente cuánto tiempo durará?"
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera saber cuánto dura aproximadamente la entrevista."
            },
            {
              "label": "Hacer pregunta",
              "text": "Sí. ¿Podría indicarme la duración aproximada?"
            }
          ]
        },
        {
          "prompt": "Entre treinta y cuarenta minutos.",
          "model": "Entendido. Muchas gracias por la información. Nos vemos el martes.",
          "alternatives": [
            "Perfecto, gracias. Estaré allí el martes a las diez.",
            "Muchas gracias. Queda confirmado para el martes."
          ],
          "keywords": [
            "gracias",
            "martes",
            "confirm"
          ],
          "why": "Cierra resumiendo el acuerdo principal y agradeciendo.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Cierra resumiendo el acuerdo principal y agradeciendo.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Entendido. Muchas gracias por la información. Nos vemos el martes."
            },
            {
              "label": "En futuro",
              "text": "Perfecto, gracias. Estaré allí el martes a las diez."
            },
            {
              "label": "Alternativa",
              "text": "Muchas gracias. Queda confirmado para el martes."
            }
          ]
        }
      ],
      "tone": "formal"
    },
    {
      "id": "universidad-proyecto",
      "level": 3,
      "avatar": "📚",
      "name": "Grupo de estudio",
      "situation": "Organizar un proyecto universitario",
      "place": "Universidad",
      "duration": "6–7 min",
      "goal": "Practica repartir tareas, justificar decisiones y acordar fechas.",
      "closing": "Excelente. Ya tenemos tareas, fecha y forma de revisión. Avancemos y nos escribimos por el grupo.",
      "turns": [
        {
          "prompt": "Tenemos que dividir el proyecto. ¿Qué parte te gustaría hacer?",
          "model": "Me gustaría preparar la introducción y buscar las fuentes.",
          "alternatives": [
            "Prefiero encargarme de la introducción.",
            "Puedo buscar información y redactar la primera parte."
          ],
          "keywords": [
            "introduccion",
            "fuentes",
            "informacion"
          ],
          "why": "Para repartir tareas, di qué parte prefieres asumir.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Para repartir tareas, di qué parte prefieres asumir.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Me gustaría preparar la introducción y buscar las fuentes."
            },
            {
              "label": "Preferencia",
              "text": "Prefiero encargarme de la introducción."
            },
            {
              "label": "Alternativa",
              "text": "Puedo buscar información y redactar la primera parte."
            }
          ]
        },
        {
          "prompt": "Bien. Yo puedo hacer el análisis.",
          "model": "Perfecto. Entonces nos falta asignar las conclusiones.",
          "alternatives": [
            "Está bien. Todavía debemos decidir quién hará las conclusiones.",
            "Perfecto. Falta la parte final."
          ],
          "keywords": [
            "conclus",
            "falta"
          ],
          "why": "“Entonces” ayuda a conectar lo que ya se decidió con lo que falta.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: entonces",
            "rule": "“Entonces” ayuda a conectar lo que ya se decidió con lo que falta.",
            "highlight": [
              "entonces",
              "por eso",
              "así que"
            ]
          },
          "options": [
            {
              "label": "Con «entonces»",
              "text": "Perfecto. Entonces nos falta asignar las conclusiones."
            },
            {
              "label": "Otra forma natural",
              "text": "Está bien. Todavía debemos decidir quién hará las conclusiones."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto. Falta la parte final."
            }
          ]
        },
        {
          "prompt": "Podemos preguntarle a Lucía.",
          "model": "Sí. Le escribiré para saber si puede encargarse.",
          "alternatives": [
            "De acuerdo, voy a preguntarle.",
            "Sí, le consulto ahora."
          ],
          "keywords": [
            "lucia",
            "pregunt",
            "escrib"
          ],
          "why": "Puedes expresar una acción futura para resolver una tarea pendiente.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "Puedes expresar una acción futura para resolver una tarea pendiente.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí. Le escribiré para saber si puede encargarse."
            },
            {
              "label": "En futuro",
              "text": "De acuerdo, voy a preguntarle."
            },
            {
              "label": "Alternativa",
              "text": "Sí, le consulto ahora."
            }
          ]
        },
        {
          "prompt": "¿Cuándo deberíamos tener el primer borrador?",
          "model": "Propongo tenerlo listo el jueves por la noche.",
          "alternatives": [
            "Podemos terminar el primer borrador el jueves.",
            "El jueves en la noche sería una buena fecha."
          ],
          "keywords": [
            "jueves",
            "borrador",
            "noche"
          ],
          "why": "“Propongo” es útil para sugerir una fecha al grupo.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "“Propongo” es útil para sugerir una fecha al grupo.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Propongo tenerlo listo el jueves por la noche."
            },
            {
              "label": "Otra forma natural",
              "text": "Podemos terminar el primer borrador el jueves."
            },
            {
              "label": "Alternativa",
              "text": "El jueves en la noche sería una buena fecha."
            }
          ]
        },
        {
          "prompt": "El jueves me sirve. ¿Cómo revisamos todo?",
          "model": "Podemos hacer una videollamada y revisar el documento juntos.",
          "alternatives": [
            "Revisemos el documento por videollamada.",
            "Podemos conectarnos y corregirlo entre todos."
          ],
          "keywords": [
            "videollamada",
            "revis",
            "documento"
          ],
          "why": "Explica el medio y la acción: videollamada + revisar juntos.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Explica el medio y la acción: videollamada + revisar juntos.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Podemos hacer una videollamada y revisar el documento juntos."
            },
            {
              "label": "Otra forma natural",
              "text": "Revisemos el documento por videollamada."
            },
            {
              "label": "Alternativa",
              "text": "Podemos conectarnos y corregirlo entre todos."
            }
          ]
        },
        {
          "prompt": "¿A qué hora?",
          "model": "A las ocho de la noche.",
          "alternatives": [
            "Podría ser a las ocho.",
            "A las ocho me queda bien."
          ],
          "keywords": [
            "ocho",
            "noche"
          ],
          "why": "Una hora concreta facilita que todos confirmen.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Una hora concreta facilita que todos confirmen.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "A las ocho de la noche."
            },
            {
              "label": "Otra forma natural",
              "text": "Podría ser a las ocho."
            },
            {
              "label": "Alternativa",
              "text": "A las ocho me queda bien."
            }
          ]
        },
        {
          "prompt": "Perfecto. Yo crearé el enlace.",
          "model": "Gracias. Yo avisaré a Lucía y subiré mi avance antes de la reunión.",
          "alternatives": [
            "Gracias. Enviaré mi parte antes de reunirnos.",
            "Perfecto. Le aviso a Lucía y comparto mi avance."
          ],
          "keywords": [
            "lucia",
            "avance",
            "reunion",
            "aviso"
          ],
          "why": "Resume dos acciones usando “y” para dejar claro tu compromiso.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Resume dos acciones usando “y” para dejar claro tu compromiso.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Gracias. Yo avisaré a Lucía y subiré mi avance antes de la reunión."
            },
            {
              "label": "En futuro",
              "text": "Gracias. Enviaré mi parte antes de reunirnos."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto. Le aviso a Lucía y comparto mi avance."
            }
          ]
        },
        {
          "prompt": "Buen plan. Así llegamos preparados.",
          "model": "Sí, así podremos usar la reunión para corregir y cerrar el proyecto.",
          "alternatives": [
            "Exacto. En la reunión podremos enfocarnos en los cambios finales.",
            "Sí, eso nos ayudará a terminar a tiempo."
          ],
          "keywords": [
            "reunion",
            "correg",
            "termin",
            "tiempo"
          ],
          "why": "Explica el beneficio de un plan con “así podremos…” o “eso nos ayudará…”.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Explica el beneficio de un plan con “así podremos…” o “eso nos ayudará…”.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, así podremos usar la reunión para corregir y cerrar el proyecto."
            },
            {
              "label": "Otra forma natural",
              "text": "Exacto. En la reunión podremos enfocarnos en los cambios finales."
            },
            {
              "label": "Alternativa",
              "text": "Sí, eso nos ayudará a terminar a tiempo."
            }
          ]
        }
      ],
      "tone": "amigable"
    },
    {
      "id": "viaje-terminal",
      "level": 3,
      "avatar": "🧳",
      "name": "Agente de terminal",
      "situation": "Comprar un pasaje interprovincial",
      "place": "Viaje",
      "duration": "7–8 min",
      "goal": "Practica una conversación larga con horarios, alternativas, equipaje y confirmación final.",
      "closing": "Su compra quedó registrada. Llegue al terminal con anticipación y tenga su DNI a la mano. Buen viaje.",
      "turns": [
        {
          "prompt": "Buenos días. ¿A qué ciudad desea viajar?",
          "model": "Buenos días. Quiero viajar a Arequipa.",
          "alternatives": [
            "Buenos días. Necesito un pasaje para Arequipa.",
            "Quisiera viajar a Arequipa."
          ],
          "keywords": [
            "arequipa",
            "viaj",
            "pasaje"
          ],
          "why": "Empieza indicando claramente tu destino.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Empieza indicando claramente tu destino.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenos días. Quiero viajar a Arequipa."
            },
            {
              "label": "Otra forma natural",
              "text": "Buenos días. Necesito un pasaje para Arequipa."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera viajar a Arequipa."
            }
          ]
        },
        {
          "prompt": "¿Para qué día necesita el pasaje?",
          "model": "Para este viernes, por favor.",
          "alternatives": [
            "Quisiera viajar este viernes.",
            "Necesito el pasaje para el viernes."
          ],
          "keywords": [
            "viernes"
          ],
          "why": "En una compra de pasaje, el día es uno de los datos esenciales.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "En una compra de pasaje, el día es uno de los datos esenciales.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Para este viernes, por favor."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera viajar este viernes."
            },
            {
              "label": "Alternativa",
              "text": "Necesito el pasaje para el viernes."
            }
          ]
        },
        {
          "prompt": "Tenemos salidas a las ocho de la mañana y a las nueve de la noche.",
          "model": "Prefiero la salida de las nueve de la noche.",
          "alternatives": [
            "Quisiera viajar a las nueve de la noche.",
            "Me conviene más el bus de las nueve de la noche."
          ],
          "keywords": [
            "nueve",
            "noche"
          ],
          "why": "“Prefiero” permite elegir claramente entre dos alternativas.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "“Prefiero” permite elegir claramente entre dos alternativas.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Preferencia",
              "text": "Prefiero la salida de las nueve de la noche."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera viajar a las nueve de la noche."
            },
            {
              "label": "Alternativa",
              "text": "Me conviene más el bus de las nueve de la noche."
            }
          ]
        },
        {
          "prompt": "Está bien. ¿Viaja solo?",
          "model": "Sí, voy a viajar solo.",
          "alternatives": [
            "Sí, el pasaje es solo para mí.",
            "Sí, viajo solo."
          ],
          "keywords": [
            "solo",
            "si"
          ],
          "why": "Una confirmación breve es suficiente cuando la pregunta es concreta.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Una confirmación breve es suficiente cuando la pregunta es concreta.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Sí, voy a viajar solo."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, el pasaje es solo para mí."
            },
            {
              "label": "Alternativa",
              "text": "Sí, viajo solo."
            }
          ]
        },
        {
          "prompt": "¿Desea asiento en la parte delantera o en la parte posterior?",
          "model": "Si es posible, quisiera un asiento en la parte delantera.",
          "alternatives": [
            "Prefiero un asiento adelante, por favor.",
            "Quisiera sentarme en la parte delantera."
          ],
          "keywords": [
            "delantera",
            "adelante",
            "asiento"
          ],
          "why": "“Si es posible” comunica una preferencia sin exigirla.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "“Si es posible” comunica una preferencia sin exigirla.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Más formal (quisiera)",
              "text": "Si es posible, quisiera un asiento en la parte delantera."
            },
            {
              "label": "Preferencia",
              "text": "Prefiero un asiento adelante, por favor."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera sentarme en la parte delantera."
            }
          ]
        },
        {
          "prompt": "Hay un asiento disponible adelante. ¿Lleva equipaje para bodega?",
          "model": "Sí, llevo una maleta mediana.",
          "alternatives": [
            "Sí, tengo una maleta para guardar en bodega.",
            "Llevo una maleta mediana como equipaje."
          ],
          "keywords": [
            "maleta",
            "equipaje",
            "bodega"
          ],
          "why": "Indica el tipo o tamaño de equipaje para recibir la información correcta.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Indica el tipo o tamaño de equipaje para recibir la información correcta.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, llevo una maleta mediana."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, tengo una maleta para guardar en bodega."
            },
            {
              "label": "Alternativa",
              "text": "Llevo una maleta mediana como equipaje."
            }
          ]
        },
        {
          "prompt": "La maleta está incluida. El equipaje de mano puede ir con usted.",
          "model": "Perfecto. También llevo una mochila pequeña.",
          "alternatives": [
            "Entiendo. Mi equipaje de mano será una mochila.",
            "Perfecto, entonces llevaré mi mochila conmigo."
          ],
          "keywords": [
            "mochila",
            "mano",
            "perfecto"
          ],
          "why": "Agregar el dato de tu mochila confirma cómo organizarás el equipaje.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: entonces",
            "rule": "Agregar el dato de tu mochila confirma cómo organizarás el equipaje.",
            "highlight": [
              "entonces",
              "por eso",
              "así que"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Perfecto. También llevo una mochila pequeña."
            },
            {
              "label": "Otra forma natural",
              "text": "Entiendo. Mi equipaje de mano será una mochila."
            },
            {
              "label": "Con «entonces»",
              "text": "Perfecto, entonces llevaré mi mochila conmigo."
            }
          ]
        },
        {
          "prompt": "Necesito su nombre completo y DNI para emitir el pasaje.",
          "model": "Claro. Mi nombre es Luis Pérez y mi DNI es 12345678.",
          "alternatives": [
            "De acuerdo. Soy Luis Pérez, DNI 12345678.",
            "Claro, le doy mis datos: Luis Pérez, DNI 12345678."
          ],
          "keywords": [
            "luis",
            "perez",
            "dni",
            "12345678"
          ],
          "why": "En un trámite de viaje, entrega los datos solicitados de forma ordenada.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "En un trámite de viaje, entrega los datos solicitados de forma ordenada.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Claro. Mi nombre es Luis Pérez y mi DNI es 12345678."
            },
            {
              "label": "Otra forma natural",
              "text": "De acuerdo. Soy Luis Pérez, DNI 12345678."
            },
            {
              "label": "Alternativa",
              "text": "Claro, le doy mis datos: Luis Pérez, DNI 12345678."
            }
          ]
        },
        {
          "prompt": "Gracias. El total es ciento veinte soles. ¿Desea pagar ahora?",
          "model": "Sí, voy a pagar ahora con tarjeta.",
          "alternatives": [
            "Sí, pagaré con tarjeta.",
            "Sí, por favor. Haré el pago ahora."
          ],
          "keywords": [
            "si",
            "pagar",
            "tarjeta",
            "ahora"
          ],
          "why": "Confirma tanto el momento del pago como el medio que usarás.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Confirma tanto el momento del pago como el medio que usarás.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Sí, voy a pagar ahora con tarjeta."
            },
            {
              "label": "En futuro",
              "text": "Sí, pagaré con tarjeta."
            },
            {
              "label": "Alternativa",
              "text": "Sí, por favor. Haré el pago ahora."
            }
          ]
        },
        {
          "prompt": "Pago aprobado. El embarque empieza treinta minutos antes de la salida.",
          "model": "Entendido. Entonces debo estar en el terminal antes de las ocho y media.",
          "alternatives": [
            "De acuerdo. Llegaré al terminal con suficiente anticipación.",
            "Entiendo. Estaré allí por lo menos treinta minutos antes."
          ],
          "keywords": [
            "terminal",
            "antes",
            "ocho",
            "treinta"
          ],
          "why": "Calcular y repetir la hora de llegada demuestra que entendiste la indicación.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: entonces",
            "rule": "Calcular y repetir la hora de llegada demuestra que entendiste la indicación.",
            "highlight": [
              "entonces",
              "por eso",
              "así que"
            ]
          },
          "options": [
            {
              "label": "Con «entonces»",
              "text": "Entendido. Entonces debo estar en el terminal antes de las ocho y media."
            },
            {
              "label": "En futuro",
              "text": "De acuerdo. Llegaré al terminal con suficiente anticipación."
            },
            {
              "label": "En futuro",
              "text": "Entiendo. Estaré allí por lo menos treinta minutos antes."
            }
          ]
        }
      ],
      "tone": "cordial"
    },
    {
      "id": "hotel-reserva",
      "level": 3,
      "avatar": "🏨",
      "name": "Hotel Andino",
      "situation": "Modificar una reserva de hotel",
      "place": "Viaje",
      "duration": "7–8 min",
      "goal": "Practica explicar un cambio, comparar opciones y confirmar condiciones.",
      "closing": "Listo. La reserva quedó modificada y enviamos la confirmación a tu correo. Te esperamos el viernes.",
      "turns": [
        {
          "prompt": "Buenas tardes. ¿En qué podemos ayudarlo?",
          "model": "Buenas tardes. Tengo una reserva y necesito cambiar la fecha de llegada.",
          "alternatives": [
            "Hola. Quisiera modificar la fecha de mi reserva.",
            "Tengo una reserva, pero necesito llegar un día después."
          ],
          "keywords": [
            "reserva",
            "cambiar",
            "fecha",
            "llegada"
          ],
          "why": "Explica primero qué reserva tienes y qué cambio necesitas.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "Explica primero qué reserva tienes y qué cambio necesitas.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenas tardes. Tengo una reserva y necesito cambiar la fecha de llegada."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Hola. Quisiera modificar la fecha de mi reserva."
            },
            {
              "label": "Con «pero» (contraste)",
              "text": "Tengo una reserva, pero necesito llegar un día después."
            }
          ]
        },
        {
          "prompt": "Claro. ¿A nombre de quién está la reserva?",
          "model": "Está a nombre de Luis Pérez.",
          "alternatives": [
            "La reserva está a nombre de Luis Pérez.",
            "Mi nombre es Luis Pérez."
          ],
          "keywords": [
            "luis",
            "perez",
            "nombre"
          ],
          "why": "En una gestión de reserva, da el nombre tal como fue registrado.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "En una gestión de reserva, da el nombre tal como fue registrado.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Está a nombre de Luis Pérez."
            },
            {
              "label": "Otra forma natural",
              "text": "La reserva está a nombre de Luis Pérez."
            },
            {
              "label": "Alternativa",
              "text": "Mi nombre es Luis Pérez."
            }
          ]
        },
        {
          "prompt": "La reserva empieza el jueves. ¿Qué día desea llegar?",
          "model": "Quisiera llegar el viernes por la tarde.",
          "alternatives": [
            "Necesito cambiar la llegada para el viernes.",
            "Llegaré el viernes en la tarde."
          ],
          "keywords": [
            "viernes",
            "tarde",
            "lleg"
          ],
          "why": "Indica el nuevo día y, si puedes, el momento aproximado.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Indica el nuevo día y, si puedes, el momento aproximado.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera llegar el viernes por la tarde."
            },
            {
              "label": "Otra forma natural",
              "text": "Necesito cambiar la llegada para el viernes."
            },
            {
              "label": "En futuro",
              "text": "Llegaré el viernes en la tarde."
            }
          ]
        },
        {
          "prompt": "Tenemos disponibilidad el viernes. ¿Mantiene dos noches?",
          "model": "Sí, quisiera mantener las dos noches.",
          "alternatives": [
            "Sí, la cantidad de noches no cambia.",
            "Sí, me quedaré dos noches."
          ],
          "keywords": [
            "si",
            "dos",
            "noches"
          ],
          "why": "Aclara qué parte de la reserva se mantiene igual.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Aclara qué parte de la reserva se mantiene igual.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Más formal (quisiera)",
              "text": "Sí, quisiera mantener las dos noches."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, la cantidad de noches no cambia."
            },
            {
              "label": "Alternativa",
              "text": "Sí, me quedaré dos noches."
            }
          ]
        },
        {
          "prompt": "El cambio tiene una diferencia de veinte soles.",
          "model": "Está bien. ¿Ese monto se paga ahora o al llegar?",
          "alternatives": [
            "De acuerdo. ¿Cuándo debo pagar la diferencia?",
            "Está bien. ¿Puedo pagar los veinte soles en el hotel?"
          ],
          "keywords": [
            "pagar",
            "ahora",
            "llegar",
            "diferencia"
          ],
          "why": "Pregunta cuándo debe realizarse un pago adicional.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Pregunta cuándo debe realizarse un pago adicional.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Está bien. ¿Ese monto se paga ahora o al llegar?"
            },
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. ¿Cuándo debo pagar la diferencia?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Está bien. ¿Puedo pagar los veinte soles en el hotel?"
            }
          ]
        },
        {
          "prompt": "Puede pagarlo al llegar.",
          "model": "Perfecto. Entonces lo pagaré durante el check-in.",
          "alternatives": [
            "De acuerdo, pagaré al llegar.",
            "Perfecto. Haré el pago cuando me registre."
          ],
          "keywords": [
            "pagar",
            "llegar",
            "check"
          ],
          "why": "“Entonces” conecta la información recibida con tu decisión.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: entonces",
            "rule": "“Entonces” conecta la información recibida con tu decisión.",
            "highlight": [
              "entonces",
              "por eso",
              "así que"
            ]
          },
          "options": [
            {
              "label": "Con «entonces»",
              "text": "Perfecto. Entonces lo pagaré durante el check-in."
            },
            {
              "label": "En futuro",
              "text": "De acuerdo, pagaré al llegar."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto. Haré el pago cuando me registre."
            }
          ]
        },
        {
          "prompt": "¿Necesita mantener la habitación con dos camas?",
          "model": "Sí, por favor. Viajamos dos personas y necesitamos dos camas.",
          "alternatives": [
            "Sí, mantenga la habitación con dos camas.",
            "Sí. Somos dos personas y preferimos camas separadas."
          ],
          "keywords": [
            "dos",
            "camas",
            "personas"
          ],
          "why": "Explica la preferencia y la razón para que la solicitud sea clara.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Explica la preferencia y la razón para que la solicitud sea clara.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, por favor. Viajamos dos personas y necesitamos dos camas."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, mantenga la habitación con dos camas."
            },
            {
              "label": "Alternativa",
              "text": "Sí. Somos dos personas y preferimos camas separadas."
            }
          ]
        },
        {
          "prompt": "De acuerdo. La reserva ya está actualizada. ¿Desea que le enviemos una nueva confirmación?",
          "model": "Sí, por favor. Envíenme la confirmación por correo.",
          "alternatives": [
            "Sí, quisiera recibir la reserva actualizada.",
            "Sí, por favor. Quiero una confirmación del cambio."
          ],
          "keywords": [
            "si",
            "confirm",
            "correo",
            "actualiz"
          ],
          "why": "Después de un cambio importante, pedir una confirmación escrita ayuda a verificar la información.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Después de un cambio importante, pedir una confirmación escrita ayuda a verificar la información.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, por favor. Envíenme la confirmación por correo."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Sí, quisiera recibir la reserva actualizada."
            },
            {
              "label": "Alternativa",
              "text": "Sí, por favor. Quiero una confirmación del cambio."
            }
          ]
        },
        {
          "prompt": "Sí, la enviaremos por correo en unos minutos.",
          "model": "Excelente. Revisaré mi correo. Muchas gracias por la ayuda.",
          "alternatives": [
            "Perfecto. Estaré atento al correo. Gracias.",
            "Muchas gracias. Revisaré la confirmación cuando llegue."
          ],
          "keywords": [
            "correo",
            "gracias",
            "revis"
          ],
          "why": "Cierra indicando qué harás después y agradeciendo.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Futuro",
            "rule": "Cierra indicando qué harás después y agradeciendo.",
            "highlight": [
              "iré",
              "llegaré",
              "estaré",
              "pagaré",
              "enviaré",
              "revisaré",
              "llevaré",
              "voy a",
              "vamos a",
              "nos reuniremos"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Excelente. Revisaré mi correo. Muchas gracias por la ayuda."
            },
            {
              "label": "En futuro",
              "text": "Perfecto. Estaré atento al correo. Gracias."
            },
            {
              "label": "Alternativa",
              "text": "Muchas gracias. Revisaré la confirmación cuando llegue."
            }
          ]
        }
      ],
      "tone": "formal"
    },
    {
      "id": "municipalidad-tramite",
      "level": 3,
      "avatar": "🏛️",
      "name": "Orientadora",
      "situation": "Realizar un trámite municipal",
      "place": "Trámites",
      "duration": "7–8 min",
      "goal": "Practica una conversación formal larga con preguntas y aclaraciones.",
      "closing": "Muy bien. Con eso su solicitud queda presentada. Revise su correo para recibir la respuesta.",
      "turns": [
        {
          "prompt": "Buenos días. ¿Qué trámite desea realizar?",
          "model": "Buenos días. Quiero solicitar una constancia de domicilio.",
          "alternatives": [
            "Buenos días. Necesito tramitar una constancia de domicilio.",
            "Quisiera solicitar una constancia de domicilio."
          ],
          "keywords": [
            "constancia",
            "domicilio",
            "solic"
          ],
          "why": "Empieza indicando claramente el nombre del trámite que necesitas.",
          "focus": {
            "type": "cortesia",
            "badge": "🤝 Cortesía y petición",
            "rule": "Empieza indicando claramente el nombre del trámite que necesitas.",
            "highlight": [
              "quisiera",
              "por favor",
              "prefiero",
              "me gustaría",
              "gracias"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Buenos días. Quiero solicitar una constancia de domicilio."
            },
            {
              "label": "Otra forma natural",
              "text": "Buenos días. Necesito tramitar una constancia de domicilio."
            },
            {
              "label": "Más formal (quisiera)",
              "text": "Quisiera solicitar una constancia de domicilio."
            }
          ]
        },
        {
          "prompt": "¿Es la primera vez que realiza esta solicitud?",
          "model": "Sí, es la primera vez.",
          "alternatives": [
            "Sí, nunca he hecho este trámite antes.",
            "Sí. Es mi primera solicitud."
          ],
          "keywords": [
            "primera",
            "si"
          ],
          "why": "Una respuesta directa basta cuando la pregunta es de confirmación.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Una respuesta directa basta cuando la pregunta es de confirmación.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Sí, es la primera vez."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, nunca he hecho este trámite antes."
            },
            {
              "label": "Alternativa",
              "text": "Sí. Es mi primera solicitud."
            }
          ]
        },
        {
          "prompt": "Necesita su DNI y un recibo de servicio donde figure su dirección.",
          "model": "Tengo mi DNI y un recibo de luz. ¿Ese recibo sirve?",
          "alternatives": [
            "Traje mi DNI y un recibo de luz. ¿Es suficiente?",
            "Tengo ambos documentos. El recibo es de luz, ¿está bien?"
          ],
          "keywords": [
            "dni",
            "recibo",
            "luz",
            "sirve"
          ],
          "why": "Cuando no estás seguro, menciona lo que tienes y pregunta si es válido.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Cuando no estás seguro, menciona lo que tienes y pregunta si es válido.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Tengo mi DNI y un recibo de luz. ¿Ese recibo sirve?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Traje mi DNI y un recibo de luz. ¿Es suficiente?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Tengo ambos documentos. El recibo es de luz, ¿está bien?"
            }
          ]
        },
        {
          "prompt": "Sí, el recibo de luz sirve si es reciente.",
          "model": "Perfecto. El recibo es del mes pasado.",
          "alternatives": [
            "Sí, es reciente; corresponde al mes pasado.",
            "Está bien. Este recibo es del mes anterior."
          ],
          "keywords": [
            "mes",
            "pasado",
            "reciente"
          ],
          "why": "Aporta el dato que confirma que cumples el requisito.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Aporta el dato que confirma que cumples el requisito.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Perfecto. El recibo es del mes pasado."
            },
            {
              "label": "Otra forma natural",
              "text": "Sí, es reciente; corresponde al mes pasado."
            },
            {
              "label": "Alternativa",
              "text": "Está bien. Este recibo es del mes anterior."
            }
          ]
        },
        {
          "prompt": "Muy bien. También debe llenar este formulario.",
          "model": "De acuerdo. ¿Debo completar todos los campos?",
          "alternatives": [
            "Está bien. ¿Tengo que llenar todo el formulario?",
            "De acuerdo. ¿Hay algún campo que pueda dejar vacío?"
          ],
          "keywords": [
            "campos",
            "formulario",
            "complet",
            "llen"
          ],
          "why": "Pregunta antes de dejar información incompleta en un documento.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Pregunta antes de dejar información incompleta en un documento.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. ¿Debo completar todos los campos?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Está bien. ¿Tengo que llenar todo el formulario?"
            },
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. ¿Hay algún campo que pueda dejar vacío?"
            }
          ]
        },
        {
          "prompt": "Complete sus datos y la dirección. El espacio de observaciones es opcional.",
          "model": "Entendido. Entonces dejaré vacías las observaciones si no tengo nada que agregar.",
          "alternatives": [
            "De acuerdo. Si no tengo observaciones, no escribiré nada allí.",
            "Perfecto. Completaré solo los campos obligatorios."
          ],
          "keywords": [
            "observ",
            "vaci",
            "oblig"
          ],
          "why": "Repetir la instrucción con tus palabras confirma que la entendiste.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: entonces",
            "rule": "Repetir la instrucción con tus palabras confirma que la entendiste.",
            "highlight": [
              "entonces",
              "por eso",
              "así que"
            ]
          },
          "options": [
            {
              "label": "Con «entonces»",
              "text": "Entendido. Entonces dejaré vacías las observaciones si no tengo nada que agregar."
            },
            {
              "label": "Otra forma natural",
              "text": "De acuerdo. Si no tengo observaciones, no escribiré nada allí."
            },
            {
              "label": "Alternativa",
              "text": "Perfecto. Completaré solo los campos obligatorios."
            }
          ]
        },
        {
          "prompt": "Correcto. ¿La constancia la necesita para hoy?",
          "model": "No necesariamente, pero quisiera saber cuánto demora el trámite.",
          "alternatives": [
            "No es urgente. ¿Cuánto tiempo demora?",
            "Puedo esperar. ¿En cuántos días entregan la constancia?"
          ],
          "keywords": [
            "demora",
            "dias",
            "tiempo",
            "cuanto"
          ],
          "why": "“¿Cuánto demora…?” es una pregunta natural para conocer el plazo.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: pero",
            "rule": "“¿Cuánto demora…?” es una pregunta natural para conocer el plazo.",
            "highlight": [
              "pero",
              "aunque",
              "sin embargo"
            ]
          },
          "options": [
            {
              "label": "Con «pero» (contraste)",
              "text": "No necesariamente, pero quisiera saber cuánto demora el trámite."
            },
            {
              "label": "Hacer pregunta",
              "text": "No es urgente. ¿Cuánto tiempo demora?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Puedo esperar. ¿En cuántos días entregan la constancia?"
            }
          ]
        },
        {
          "prompt": "Normalmente demora tres días hábiles.",
          "model": "Está bien. ¿Me avisarán cuando esté lista?",
          "alternatives": [
            "De acuerdo. ¿Recibiré algún aviso cuando termine?",
            "Perfecto. ¿Cómo sabré que ya puedo recogerla?"
          ],
          "keywords": [
            "avis",
            "lista",
            "recib"
          ],
          "why": "Pregunta también cómo recibirás la confirmación, no solo el plazo.",
          "focus": {
            "type": "pregunta",
            "badge": "❓ Pregunta directa",
            "rule": "Pregunta también cómo recibirás la confirmación, no solo el plazo.",
            "highlight": [
              "¿",
              "?",
              "puedo",
              "puede",
              "podría",
              "cuándo",
              "dónde",
              "cuánto",
              "qué"
            ]
          },
          "options": [
            {
              "label": "Hacer pregunta",
              "text": "Está bien. ¿Me avisarán cuando esté lista?"
            },
            {
              "label": "Hacer pregunta",
              "text": "De acuerdo. ¿Recibiré algún aviso cuando termine?"
            },
            {
              "label": "Hacer pregunta",
              "text": "Perfecto. ¿Cómo sabré que ya puedo recogerla?"
            }
          ]
        },
        {
          "prompt": "Sí, enviaremos un mensaje al correo que registre.",
          "model": "Entonces voy a escribir mi correo con cuidado para que esté correcto.",
          "alternatives": [
            "Perfecto. Verificaré bien mi correo antes de entregar el formulario.",
            "De acuerdo. Me aseguraré de registrar correctamente mi correo."
          ],
          "keywords": [
            "correo",
            "correct",
            "verific",
            "cuidado"
          ],
          "why": "Explica la acción que tomarás para evitar un error en tus datos.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: entonces",
            "rule": "Explica la acción que tomarás para evitar un error en tus datos.",
            "highlight": [
              "entonces",
              "por eso",
              "así que"
            ]
          },
          "options": [
            {
              "label": "Con «entonces»",
              "text": "Entonces voy a escribir mi correo con cuidado para que esté correcto."
            },
            {
              "label": "Otra forma natural",
              "text": "Perfecto. Verificaré bien mi correo antes de entregar el formulario."
            },
            {
              "label": "Alternativa",
              "text": "De acuerdo. Me aseguraré de registrar correctamente mi correo."
            }
          ]
        },
        {
          "prompt": "Revise todo y luego entrégueme los documentos.",
          "model": "Ya revisé los datos. Aquí tiene el formulario, mi DNI y el recibo.",
          "alternatives": [
            "Listo. Aquí están todos los documentos.",
            "Ya verifiqué la información. Le entrego el formulario y los documentos."
          ],
          "keywords": [
            "formulario",
            "dni",
            "recibo",
            "document"
          ],
          "why": "Al entregar documentos, enuméralos para confirmar que no falta ninguno.",
          "focus": {
            "type": "verbo",
            "badge": "⏱️ Conjugación: Pasado",
            "rule": "Al entregar documentos, enuméralos para confirmar que no falta ninguno.",
            "highlight": [
              "tuve",
              "salí",
              "fui",
              "hice",
              "compré",
              "elegimos",
              "revisé",
              "reinicié"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Ya revisé los datos. Aquí tiene el formulario, mi DNI y el recibo."
            },
            {
              "label": "Otra forma natural",
              "text": "Listo. Aquí están todos los documentos."
            },
            {
              "label": "Alternativa",
              "text": "Ya verifiqué la información. Le entrego el formulario y los documentos."
            }
          ]
        }
      ],
      "tone": "formal"
    },
    {
      "id": "junta-vecinal",
      "level": 3,
      "avatar": "🌳",
      "name": "Grupo vecinal",
      "situation": "Organizar una actividad para el barrio",
      "place": "Vecindario",
      "duration": "7–8 min",
      "goal": "Practica propuestas, acuerdos, responsabilidades y solución de problemas.",
      "closing": "Muy bien. Ya tenemos fecha, tareas y un plan alternativo. Compartiremos el resumen en el grupo para que todos puedan leerlo.",
      "turns": [
        {
          "prompt": "Queremos hacer una actividad para mejorar el parque. ¿Qué podríamos organizar?",
          "model": "Podríamos organizar una jornada de limpieza y plantar algunas flores.",
          "alternatives": [
            "Propongo limpiar el parque y mejorar las áreas verdes.",
            "Podemos hacer una actividad de limpieza con los vecinos."
          ],
          "keywords": [
            "limpieza",
            "parque",
            "flores",
            "organ"
          ],
          "why": "Una propuesta clara dice qué actividad se hará y dónde.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Una propuesta clara dice qué actividad se hará y dónde.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Podríamos organizar una jornada de limpieza y plantar algunas flores."
            },
            {
              "label": "Otra forma natural",
              "text": "Propongo limpiar el parque y mejorar las áreas verdes."
            },
            {
              "label": "Alternativa",
              "text": "Podemos hacer una actividad de limpieza con los vecinos."
            }
          ]
        },
        {
          "prompt": "Me gusta. ¿Qué día sería mejor?",
          "model": "El sábado por la mañana podría funcionar bien.",
          "alternatives": [
            "Propongo el sábado en la mañana.",
            "Podríamos hacerlo el sábado temprano."
          ],
          "keywords": [
            "sabado",
            "mañana"
          ],
          "why": "Usa “podría” para sugerir una opción sin imponerla.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Usa “podría” para sugerir una opción sin imponerla.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "El sábado por la mañana podría funcionar bien."
            },
            {
              "label": "Otra forma natural",
              "text": "Propongo el sábado en la mañana."
            },
            {
              "label": "Alternativa",
              "text": "Podríamos hacerlo el sábado temprano."
            }
          ]
        },
        {
          "prompt": "¿A qué hora empezamos?",
          "model": "Podríamos empezar a las nueve.",
          "alternatives": [
            "A las nueve me parece bien.",
            "Propongo comenzar a las nueve de la mañana."
          ],
          "keywords": [
            "nueve",
            "empez"
          ],
          "why": "Una hora concreta ayuda a organizar responsabilidades.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Una hora concreta ayuda a organizar responsabilidades.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Podríamos empezar a las nueve."
            },
            {
              "label": "Otra forma natural",
              "text": "A las nueve me parece bien."
            },
            {
              "label": "Alternativa",
              "text": "Propongo comenzar a las nueve de la mañana."
            }
          ]
        },
        {
          "prompt": "Necesitamos bolsas, guantes y herramientas.",
          "model": "Yo puedo encargarme de conseguir bolsas y guantes.",
          "alternatives": [
            "Puedo llevar las bolsas y los guantes.",
            "Yo me responsabilizo por esos materiales."
          ],
          "keywords": [
            "bolsas",
            "guantes",
            "encarg"
          ],
          "why": "“Me encargo de…” sirve para asumir una responsabilidad.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: por eso",
            "rule": "“Me encargo de…” sirve para asumir una responsabilidad.",
            "highlight": [
              "por eso"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Yo puedo encargarme de conseguir bolsas y guantes."
            },
            {
              "label": "Otra forma natural",
              "text": "Puedo llevar las bolsas y los guantes."
            },
            {
              "label": "Con «por eso»",
              "text": "Yo me responsabilizo por esos materiales."
            }
          ]
        },
        {
          "prompt": "Perfecto. ¿Quién puede avisar a los demás vecinos?",
          "model": "Puedo preparar un mensaje y enviarlo al grupo del barrio.",
          "alternatives": [
            "Yo puedo escribir el aviso para el grupo.",
            "Me encargo de comunicar la actividad a los vecinos."
          ],
          "keywords": [
            "mensaje",
            "grupo",
            "vecinos",
            "aviso"
          ],
          "why": "Explica el medio de comunicación y a quién va dirigido.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Explica el medio de comunicación y a quién va dirigido.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Puedo preparar un mensaje y enviarlo al grupo del barrio."
            },
            {
              "label": "Otra forma natural",
              "text": "Yo puedo escribir el aviso para el grupo."
            },
            {
              "label": "Alternativa",
              "text": "Me encargo de comunicar la actividad a los vecinos."
            }
          ]
        },
        {
          "prompt": "¿Qué información debe tener el mensaje?",
          "model": "Debe incluir el día, la hora, el lugar y lo que cada persona puede llevar.",
          "alternatives": [
            "Hay que poner fecha, hora y materiales necesarios.",
            "El aviso debe explicar cuándo, dónde y qué necesitamos."
          ],
          "keywords": [
            "dia",
            "hora",
            "lugar",
            "llevar"
          ],
          "why": "Un aviso útil responde preguntas básicas: cuándo, dónde y qué se necesita.",
          "focus": {
            "type": "oracion",
            "badge": "✍️ Oración completa",
            "rule": "Un aviso útil responde preguntas básicas: cuándo, dónde y qué se necesita.",
            "highlight": []
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Debe incluir el día, la hora, el lugar y lo que cada persona puede llevar."
            },
            {
              "label": "Otra forma natural",
              "text": "Hay que poner fecha, hora y materiales necesarios."
            },
            {
              "label": "Alternativa",
              "text": "El aviso debe explicar cuándo, dónde y qué necesitamos."
            }
          ]
        },
        {
          "prompt": "¿Y si llueve ese día?",
          "model": "Si llueve, podemos mover la actividad al domingo.",
          "alternatives": [
            "Podemos tener el domingo como fecha alternativa.",
            "Si hay lluvia, avisamos que se cambia para el día siguiente."
          ],
          "keywords": [
            "llueve",
            "domingo",
            "cambiar"
          ],
          "why": "Usa “si” para presentar una condición y una solución.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Condición: si…",
            "rule": "Usa “si” para presentar una condición y una solución.",
            "highlight": [
              "si"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Si llueve, podemos mover la actividad al domingo."
            },
            {
              "label": "Otra forma natural",
              "text": "Podemos tener el domingo como fecha alternativa."
            },
            {
              "label": "Alternativa",
              "text": "Si hay lluvia, avisamos que se cambia para el día siguiente."
            }
          ]
        },
        {
          "prompt": "Buena idea. ¿Cómo confirmamos el cambio?",
          "model": "Lo confirmamos por el grupo y pedimos que todos respondan que leyeron el mensaje.",
          "alternatives": [
            "Enviaremos un mensaje al grupo y pediremos confirmación.",
            "Avisamos por escrito para que todos sepan el nuevo plan."
          ],
          "keywords": [
            "grupo",
            "mensaje",
            "confirm",
            "escrito"
          ],
          "why": "En una coordinación grupal, conviene indicar cómo se confirmará la información.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: para que",
            "rule": "En una coordinación grupal, conviene indicar cómo se confirmará la información.",
            "highlight": [
              "para que"
            ]
          },
          "options": [
            {
              "label": "Respuesta completa",
              "text": "Lo confirmamos por el grupo y pedimos que todos respondan que leyeron el mensaje."
            },
            {
              "label": "Otra forma natural",
              "text": "Enviaremos un mensaje al grupo y pediremos confirmación."
            },
            {
              "label": "Con «para que»",
              "text": "Avisamos por escrito para que todos sepan el nuevo plan."
            }
          ]
        },
        {
          "prompt": "Perfecto. Creo que ya tenemos un buen plan.",
          "model": "Sí. Voy a escribir un resumen con las tareas de cada persona.",
          "alternatives": [
            "Sí, haré un resumen para que todos sepan qué deben hacer.",
            "De acuerdo. Compartiré las responsabilidades por escrito."
          ],
          "keywords": [
            "resumen",
            "tareas",
            "personas",
            "escrito"
          ],
          "why": "Un resumen final ayuda a que un acuerdo largo quede claro para todos.",
          "focus": {
            "type": "conector",
            "badge": "🔗 Conector: para que",
            "rule": "Un resumen final ayuda a que un acuerdo largo quede claro para todos.",
            "highlight": [
              "para que"
            ]
          },
          "options": [
            {
              "label": "En futuro",
              "text": "Sí. Voy a escribir un resumen con las tareas de cada persona."
            },
            {
              "label": "Con «para que»",
              "text": "Sí, haré un resumen para que todos sepan qué deben hacer."
            },
            {
              "label": "Alternativa",
              "text": "De acuerdo. Compartiré las responsabilidades por escrito."
            }
          ]
        }
      ],
      "tone": "amigable"
    }
  ]
};
if(typeof module === "object" && module.exports) module.exports=data;
else root.LSPChatData=data;
})(typeof globalThis !== "undefined" ? globalThis : this);
