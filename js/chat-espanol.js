(() => {
"use strict";

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "lspedia_chat_espanol_v1";
const levels = [
  {id:1, icon:"👋", name:"Mensajes cortos", desc:"Saludar, avisar y responder con frases sencillas."},
  {id:2, icon:"🛒", name:"Vida diaria", desc:"Compras, transporte, vecinos y situaciones cotidianas."},
  {id:3, icon:"🧭", name:"Pedir y explicar", desc:"Preguntar, pedir ayuda y explicar lo que necesitas."},
  {id:4, icon:"🎓", name:"Estudio y trabajo", desc:"Mensajes más formales, coordinaciones y explicaciones."},
  {id:5, icon:"💬", name:"Conversación completa", desc:"Conversaciones largas con detalles, causas y acuerdos."}
];

const scenarios = [
  {
    id:"casa-mama", level:1, avatar:"👩", name:"Mamá", situation:"Avisar que ya vas a casa", place:"Familia", duration:"3–4 min",
    goal:"Practica respuestas breves, claras y amables.", closing:"Perfecto. Te espero. Cuídate al venir. ❤️",
    turns:[
      {prompt:"Hola. ¿Ya saliste?", model:"Sí, mamá. Ya salí y estoy en camino.", alternatives:["Sí, ya salí. Estoy yendo a casa.","Sí, mamá. Ya voy para la casa."], keywords:["sal","camino","voy"], why:"Para avisar dónde estás, usa una idea completa: qué haces + hacia dónde vas."},
      {prompt:"¿En qué parte estás ahora?", model:"Estoy cerca del paradero principal.", alternatives:["Estoy en el paradero principal.","Estoy cerca del paradero, esperando el bus."], keywords:["paradero","cerca","bus"], why:"Con “estar” puedes indicar tu ubicación: Estoy + lugar."},
      {prompt:"¿Ya pasó el bus?", model:"Todavía no. Estoy esperando el bus.", alternatives:["Aún no pasa. Sigo esperando.","No todavía. Estoy esperando."], keywords:["esper","todavia","aun","bus"], why:"“Todavía no” y “aún no” sirven para decir que algo no ha sucedido."},
      {prompt:"Está bien. ¿Quieres que guarde tu comida?", model:"Sí, por favor. Guárdame un poco.", alternatives:["Sí, por favor. Voy a comer cuando llegue.","Sí, gracias. Guárdame mi comida."], keywords:["si","favor","guard","gracias"], why:"En una petición, “por favor” hace el mensaje más amable."},
      {prompt:"¿Más o menos a qué hora llegas?", model:"Creo que llegaré en unos veinte minutos.", alternatives:["Llegaré aproximadamente en veinte minutos.","En unos veinte minutos estaré en casa."], keywords:["minuto","lleg","veinte"], why:"Para una hora aproximada puedes usar “creo que”, “aproximadamente” o “en unos…”."},
      {prompt:"Listo. Avísame cuando estés cerca.", model:"De acuerdo, te aviso cuando esté cerca.", alternatives:["Sí, te aviso cuando llegue cerca.","Está bien. Te escribo cuando esté por llegar."], keywords:["aviso","cerca","lleg"], why:"“Cuando esté” usa subjuntivo porque habla de una situación futura."}
    ]
  },
  {
    id:"amigo-plaza", level:1, avatar:"🧑", name:"Diego", situation:"Coordinar para encontrarse", place:"Amigos", duration:"3–4 min",
    goal:"Practica hora, lugar y confirmaciones.", closing:"Buenazo. Entonces nos vemos ahí. 👋",
    turns:[
      {prompt:"Hola, ¿puedes salir esta tarde?", model:"Sí, puedo salir esta tarde.", alternatives:["Sí, estoy libre esta tarde.","Sí, hoy en la tarde puedo."], keywords:["si","tarde","puedo"], why:"Una respuesta clara confirma primero y luego agrega el momento."},
      {prompt:"¿Nos encontramos a las cinco?", model:"Sí, a las cinco está bien.", alternatives:["Sí, nos vemos a las cinco.","De acuerdo, a las cinco puedo."], keywords:["cinco","bien","vemos"], why:"Para confirmar una hora, repítela. Así evitas confusiones."},
      {prompt:"¿Dónde prefieres encontrarnos?", model:"Podemos encontrarnos en la entrada de la plaza.", alternatives:["En la entrada de la plaza está bien.","Prefiero la entrada principal de la plaza."], keywords:["entrada","plaza"], why:"Usa “en” para indicar el lugar donde se encontrarán."},
      {prompt:"Yo voy a llegar caminando. ¿Tú cómo vas?", model:"Yo iré en bus.", alternatives:["Voy a ir en bus.","Iré en bus hasta el centro."], keywords:["bus","ire","voy"], why:"“Iré” expresa una acción futura de manera breve."},
      {prompt:"Si llego antes, te escribo.", model:"Perfecto. Yo también te aviso cuando llegue.", alternatives:["Está bien. Te aviso cuando esté cerca.","Perfecto, nos escribimos cuando lleguemos."], keywords:["aviso","lleg","perfecto"], why:"“Cuando llegue” es natural al hablar de una acción futura."},
      {prompt:"¿Llevo algo para tomar?", model:"Sí, si puedes lleva una botella de agua.", alternatives:["Sí, por favor. Lleva agua.","Una botella de agua estaría bien, gracias."], keywords:["agua","botella","gracias","favor"], why:"Una petición amable puede incluir “si puedes” o “por favor”."}
    ]
  },
  {
    id:"bodega-pan", level:1, avatar:"👩", name:"Rosa", situation:"Comprar en una bodega", place:"Compras", duration:"3–4 min",
    goal:"Practica saludos, cantidades y cortesía.", closing:"Gracias. Que tenga una buena tarde. 🙂",
    turns:[
      {prompt:"Buenas tardes. ¿Qué va a llevar?", model:"Buenas tardes. Quisiera dos panes y una botella de agua, por favor.", alternatives:["Buenas tardes. Deme dos panes y una botella de agua, por favor.","Quiero dos panes y una botella de agua, por favor."], keywords:["pan","agua","favor"], why:"“Quisiera” es una forma amable de pedir algo en una tienda."},
      {prompt:"Claro. ¿Algo más?", model:"Sí, también quisiera una leche.", alternatives:["Sí, también una leche, por favor.","Sí. Agrégueme una leche, por favor."], keywords:["leche","tambien"], why:"“También” ayuda a añadir otro producto a la compra."},
      {prompt:"¿La leche grande o pequeña?", model:"La pequeña, por favor.", alternatives:["Una pequeña, por favor.","Quiero la leche pequeña."], keywords:["peque"], why:"Cuando la pregunta ya da el contexto, puedes responder de forma breve pero completa."},
      {prompt:"Son ocho soles con cincuenta.", model:"Está bien. Voy a pagar en efectivo.", alternatives:["De acuerdo. Pago en efectivo.","Está bien, le pago en efectivo."], keywords:["efectivo","pago"], why:"“Voy a pagar en…” indica claramente la forma de pago."},
      {prompt:"¿Tiene sencillo?", model:"Sí, tengo diez soles.", alternatives:["Sí, tengo un billete de diez soles.","Sí, aquí tengo diez soles."], keywords:["diez","soles","billete"], why:"En Perú, “sencillo” suele referirse a dinero para dar vuelto."},
      {prompt:"Aquí tiene su vuelto y su compra.", model:"Muchas gracias.", alternatives:["Gracias. Que tenga buena tarde.","Muchas gracias por atenderme."], keywords:["gracias"], why:"Cerrar una compra con un agradecimiento es natural y cortés."}
    ]
  },
  {
    id:"bus-centro", level:2, avatar:"🚌", name:"Cobrador", situation:"Viajar en bus al centro", place:"Transporte", duration:"4–5 min",
    goal:"Practica preguntas de ruta, pasaje y paradero.", closing:"Ya. Yo te aviso cuando lleguemos al paradero. 👍",
    turns:[
      {prompt:"Sube nomás. ¿A dónde vas?", model:"Voy al centro. ¿Este bus pasa por la plaza?", alternatives:["Voy al centro. ¿Pasa por la plaza principal?","Quiero ir al centro. ¿Este bus me deja cerca de la plaza?"], keywords:["centro","plaza","pasa"], why:"En una pregunta escribe los signos ¿ ? y explica primero tu destino."},
      {prompt:"Sí, pasa por la plaza. El pasaje es dos soles.", model:"Está bien. Aquí tiene dos soles.", alternatives:["De acuerdo, aquí tiene.","Perfecto. Le pago dos soles."], keywords:["dos","soles","aqui","pago"], why:"Una respuesta breve funciona porque el contexto ya está claro."},
      {prompt:"¿Vas a bajar en la plaza o más adelante?", model:"Voy a bajar en la plaza, por favor.", alternatives:["En la plaza, por favor.","Bajo en la plaza principal."], keywords:["plaza","bajar"], why:"“Voy a bajar en…” indica el lugar exacto donde deseas descender."},
      {prompt:"Hay bastante tráfico hoy.", model:"Sí, parece que vamos a demorar un poco.", alternatives:["Sí, hay bastante tráfico.","Sí, probablemente lleguemos un poco tarde."], keywords:["trafico","demor","tarde"], why:"“Parece que” sirve para expresar una observación sin asegurarla totalmente."},
      {prompt:"¿Tienes apuro?", model:"Un poco. Tengo una cita a las cuatro.", alternatives:["Sí, un poco. Debo llegar antes de las cuatro.","Tengo una cita a las cuatro, pero todavía tengo tiempo."], keywords:["cita","cuatro","tiempo","apuro"], why:"Explica la razón con una segunda oración corta."},
      {prompt:"Estamos a unas tres cuadras de la plaza.", model:"Gracias. ¿Me avisa cuando lleguemos, por favor?", alternatives:["Gracias. Avíseme cuando lleguemos, por favor.","¿Puede avisarme al llegar a la plaza?"], keywords:["avisa","avise","lleg","favor"], why:"Con una persona desconocida es natural usar “¿me avisa…?” o “¿puede avisarme…?”."},
      {prompt:"Sí, no te preocupes.", model:"Muchas gracias.", alternatives:["Gracias por avisarme.","Perfecto, gracias."], keywords:["gracias"], why:"Un agradecimiento cierra la interacción de forma amable."}
    ]
  },
  {
    id:"mercado-compras", level:2, avatar:"👩‍🌾", name:"Lucía", situation:"Comprar en el mercado", place:"Mercado", duration:"4–5 min",
    goal:"Practica precios, cantidades y decisiones.", closing:"Listo, joven. Aquí está su compra. ¡Que le vaya bien!",
    turns:[
      {prompt:"Buenos días. ¿Qué está buscando?", model:"Buenos días. Quiero comprar papa y tomate.", alternatives:["Buenos días. Busco papa y tomate.","Quisiera comprar papa y tomate."], keywords:["papa","tomate"], why:"Puedes usar “quiero”, “busco” o “quisiera”; las tres formas son naturales según el tono."},
      {prompt:"La papa está a cuatro soles el kilo. ¿Cuánto desea?", model:"Deme dos kilos, por favor.", alternatives:["Quisiera dos kilos, por favor.","Voy a llevar dos kilos."], keywords:["dos","kilo"], why:"Para pedir una cantidad, usa número + unidad: dos kilos."},
      {prompt:"¿Y de tomate cuánto le pongo?", model:"Póngame un kilo de tomate.", alternatives:["Un kilo de tomate, por favor.","También voy a llevar un kilo de tomate."], keywords:["kilo","tomate"], why:"“Póngame…” es una forma común y cortés de comprar en un mercado."},
      {prompt:"¿Algo más? Tengo cebolla fresca.", model:"No, gracias. Con eso está bien.", alternatives:["No, muchas gracias. Eso es todo.","Por ahora no, gracias."], keywords:["no","gracias","todo","bien"], why:"Para rechazar amablemente una oferta, agrega “gracias”."},
      {prompt:"Todo sale doce soles.", model:"¿Puedo pagar con tarjeta?", alternatives:["¿Acepta tarjeta?","¿Se puede pagar con tarjeta?"], keywords:["tarjeta","pagar"], why:"En una pregunta directa recuerda usar ¿ al inicio y ? al final."},
      {prompt:"Solo efectivo o transferencia.", model:"Entonces pagaré por transferencia.", alternatives:["Está bien. Haré una transferencia.","De acuerdo, pago por transferencia."], keywords:["transferencia","pago"], why:"“Entonces” conecta la información recibida con tu decisión."},
      {prompt:"Ya llegó el pago. ¿Desea bolsa?", model:"Sí, una bolsa, por favor.", alternatives:["Sí, por favor.","Sí, necesito una bolsa."], keywords:["bolsa","favor"], why:"Una respuesta breve es suficiente cuando la pregunta es concreta."}
    ]
  },
  {
    id:"vecina-paquete", level:2, avatar:"👩‍🦱", name:"Ana", situation:"Coordinar con una vecina", place:"Vecindario", duration:"4–5 min",
    goal:"Practica avisos, favores y agradecimientos.", closing:"No hay problema. Cuando llegues, me escribes. 😊",
    turns:[
      {prompt:"Hola. Dejaron un paquete para ti en mi casa.", model:"Hola, Ana. Muchas gracias por recibirlo.", alternatives:["Gracias, Ana, por guardar mi paquete.","Hola. Gracias por recibir el paquete."], keywords:["gracias","paquete","recib"], why:"Agradece primero cuando alguien te hace un favor."},
      {prompt:"¿Estás cerca?", model:"Todavía no. Estoy en el trabajo.", alternatives:["Aún no. Sigo en el trabajo.","No, todavía estoy trabajando."], keywords:["trabajo","todavia","aun"], why:"“Todavía” o “aún” indican que una situación continúa."},
      {prompt:"¿A qué hora llegas?", model:"Creo que llegaré cerca de las siete.", alternatives:["Llegaré aproximadamente a las siete.","Estaré por la casa a eso de las siete."], keywords:["siete","lleg"], why:"“Cerca de”, “aproximadamente” y “a eso de” sirven para horas aproximadas."},
      {prompt:"A esa hora estaré en casa.", model:"Perfecto. Paso a recogerlo cuando llegue.", alternatives:["Perfecto. Cuando llegue, paso por tu casa.","Está bien. Lo recojo al llegar."], keywords:["reco","lleg","paso"], why:"Evita repetir demasiado: “lo” puede reemplazar “el paquete” cuando ya está claro."},
      {prompt:"Si quieres, también puedo dejarlo con tu mamá.", model:"Gracias, pero prefiero recogerlo yo.", alternatives:["Gracias. Mejor paso yo a recogerlo.","Te agradezco, pero yo lo recojo."], keywords:["gracias","prefiero","reco"], why:"“Gracias, pero…” permite rechazar una opción con cortesía."},
      {prompt:"Está bien. Te lo guardo.", model:"Muchas gracias por la ayuda.", alternatives:["Gracias, Ana. Me ayudas mucho.","Te agradezco mucho."], keywords:["gracias","ayuda","agrade"], why:"Cerrar con un agradecimiento mantiene un tono amable."}
    ]
  },
  {
    id:"salud-cita", level:3, avatar:"🏥", name:"Dra. Vega", situation:"Atenderse en el hospital por un malestar", place:"Hospital", duration:"5–6 min",
    goal:"Practica describir síntomas y responder preguntas.", closing:"Muy bien. Sigue las indicaciones y vuelve si no mejoras. Que te recuperes pronto.",
    turns:[
      {prompt:"Buenos días. Cuénteme, ¿qué le pasa?", model:"Buenos días. Me duele la garganta desde ayer.", alternatives:["Tengo dolor de garganta desde ayer.","Desde ayer me duele bastante la garganta."], keywords:["garganta","ayer","duele","dolor"], why:"Para explicar un síntoma incluye qué te duele y desde cuándo."},
      {prompt:"¿Ha tenido fiebre?", model:"Sí, anoche tuve un poco de fiebre.", alternatives:["Sí, tuve fiebre anoche.","Anoche tuve fiebre, pero hoy estoy mejor."], keywords:["fiebre","anoche","si"], why:"Usa pasado (“tuve”) para un síntoma que ocurrió anoche."},
      {prompt:"¿Tiene tos?", model:"Sí, tengo tos, sobre todo por la noche.", alternatives:["Tengo un poco de tos en la noche.","Sí, la tos empeora por la noche."], keywords:["tos","noche"], why:"“Sobre todo” ayuda a destacar el momento en que el síntoma es más fuerte."},
      {prompt:"¿Está tomando algún medicamento?", model:"No, todavía no he tomado ningún medicamento.", alternatives:["No, aún no he tomado nada.","No estoy tomando medicamentos."], keywords:["no","medic","tom"], why:"“Todavía no he tomado…” expresa que hasta este momento no lo has hecho."},
      {prompt:"¿Es alérgico a algún medicamento?", model:"No que yo sepa.", alternatives:["No, no tengo alergias conocidas.","Hasta donde sé, no soy alérgico a medicamentos."], keywords:["no","alerg"], why:"“No que yo sepa” es una forma natural cuando no conoces ninguna alergia."},
      {prompt:"Voy a revisarlo. Necesito que abra la boca.", model:"De acuerdo.", alternatives:["Está bien, doctora.","Claro."], keywords:["acuerdo","bien","claro"], why:"Cuando recibes una indicación sencilla, una confirmación breve es suficiente."},
      {prompt:"Parece una infección leve. Le voy a indicar tratamiento.", model:"Entiendo. ¿Cada cuántas horas debo tomarlo?", alternatives:["De acuerdo. ¿Con qué frecuencia debo tomar el medicamento?","¿Cuántas veces al día debo tomarlo?"], keywords:["horas","tom","veces","frecuencia"], why:"Pedir la frecuencia evita errores al seguir un tratamiento."},
      {prompt:"Cada ocho horas, después de comer.", model:"Muchas gracias, doctora. Seguiré las indicaciones.", alternatives:["Gracias. Voy a seguir el tratamiento como me indicó.","Muchas gracias por la explicación."], keywords:["gracias","indic","tratamiento"], why:"Repetir que seguirás las indicaciones confirma que entendiste."}
    ]
  },
  {
    id:"banco-dni", level:3, avatar:"🏦", name:"Asesor del banco", situation:"Revisar datos en el banco", place:"Banco", duration:"5–6 min",
    goal:"Practica confirmar datos, responder sí/no cuando corresponde y pedir una corrección si hace falta.", closing:"Muy bien. La revisión terminó. Guarde su constancia si la necesita. Que tenga buen día.",
    turns:[
      {prompt:"Buenos días. ¿En qué puedo ayudarlo?",model:"Buenos días. Quiero revisar mis datos personales.",alternatives:["Buenos días. Quisiera verificar que mis datos estén correctos.","Necesito revisar la información de mi cuenta."],keywords:["revis","datos","informacion"],why:"Explica de forma directa qué quieres revisar."},
      {prompt:"Claro. ¿Tiene su DNI?",model:"Sí, aquí está mi DNI.",alternatives:["Sí, lo tengo aquí.","Claro, aquí tiene mi DNI."],keywords:["si","dni","aqui"],why:"Si la pregunta es directa, “Sí” puede bastar; puedes agregar el documento para dar más información."},
      {prompt:"Gracias. ¿Cambió su dirección o su número de teléfono?",model:"No, mis datos siguen iguales.",alternatives:["No, no cambió ninguno.","Sí, cambió mi dirección.","Sí, cambió mi número de teléfono."],keywords:["no","direccion","telefono","cambio"],why:"Responde según tu situación. “No” es suficiente si nada cambió."},
      {prompt:"Entendido. ¿Desea revisar que la dirección registrada esté correcta?",model:"Sí, quiero verificarla.",alternatives:["Sí, por favor.","No, no es necesario."],keywords:["si","no","verific"],why:"En una pregunta de confirmación puedes responder brevemente."},
      {prompt:"¿La dirección registrada está correcta?",model:"Sí, está correcta.",alternatives:["Sí.","No, necesito corregirla."],keywords:["si","no","correct"],why:"“Sí” o “No” es natural cuando solo debes confirmar un dato."},
      {prompt:"¿Desea revisar también su número de teléfono?",model:"Sí, por favor.",alternatives:["Sí.","No, gracias."],keywords:["si","no","telefono"],why:"No necesitas una frase larga cuando la elección es simple."},
      {prompt:"¿El número registrado está correcto?",model:"Sí, está correcto.",alternatives:["Sí.","No, necesito cambiarlo."],keywords:["si","no","correct"],why:"Una respuesta breve puede ser totalmente correcta por contexto."},
      {prompt:"Perfecto. La revisión quedó lista. ¿Necesita una constancia?",model:"No, gracias.",alternatives:["Sí, por favor.","No es necesario, gracias."],keywords:["si","no","constancia","gracias"],why:"Al final puedes aceptar o rechazar la constancia con una respuesta corta y cortés."}
    ]
  },
  {
    id:"colegio-profesora", level:4, avatar:"👩‍🏫", name:"Profesora Elena", situation:"Coordinar una tarea", place:"Colegio", duration:"5–6 min",
    goal:"Practica preguntas, explicaciones y mensajes respetuosos.", closing:"Perfecto. Gracias por avisar y organizarte con tiempo. Nos vemos mañana.",
    turns:[
      {prompt:"Hola. ¿Ya revisaste las indicaciones del trabajo?", model:"Sí, profesora. Ya las revisé, pero tengo una duda.", alternatives:["Sí, ya leí las indicaciones. Quisiera hacerle una pregunta.","Sí, profesora, pero hay una parte que no entiendo."], keywords:["si","duda","pregunta","entiendo"], why:"En un mensaje respetuoso puedes confirmar y luego explicar tu dificultad."},
      {prompt:"Claro. ¿Qué parte no entiendes?", model:"No entiendo si el trabajo debe hacerse individualmente o en grupo.", alternatives:["Quisiera saber si el trabajo es individual o grupal.","Tengo duda sobre si debemos trabajar solos o en grupo."], keywords:["individual","grupo","solos"], why:"Usa “si” sin tilde cuando introduce dos posibilidades: si es individual o en grupo."},
      {prompt:"Se hace en grupos de tres personas.", model:"Entendido. ¿Podemos elegir a nuestros compañeros?", alternatives:["De acuerdo. ¿Nosotros formamos los grupos?","Gracias. ¿Podemos escoger con quién trabajar?"], keywords:["podemos","compan","grupo","eleg"], why:"Una pregunta clara incluye exactamente la información que necesitas confirmar."},
      {prompt:"Sí, ustedes forman sus grupos.", model:"Perfecto. Ya tengo dos compañeros con quienes trabajar.", alternatives:["Perfecto, ya completamos un grupo de tres.","Muy bien. Ya somos tres personas en mi grupo."], keywords:["dos","tres","grupo","compan"], why:"“Con quienes” conecta a las personas con la acción de trabajar."},
      {prompt:"¿Ya decidieron el tema?", model:"Sí. Vamos a trabajar sobre el cuidado del agua.", alternatives:["Sí, elegimos el tema del cuidado del agua.","Nuestro tema será el cuidado del agua."], keywords:["agua","tema","cuidado"], why:"Para un plan futuro puedes usar “vamos a trabajar” o “nuestro tema será…”."},
      {prompt:"Bien. Recuerden incluir una conclusión.", model:"De acuerdo. Incluiremos una conclusión al final.", alternatives:["Sí, profesora. La pondremos al final.","Entendido. Vamos a agregar una conclusión."], keywords:["conclusion","final","agregar"], why:"Reformular la indicación demuestra que la entendiste."},
      {prompt:"¿Cuándo piensan reunirse?", model:"Nos reuniremos mañana después de clases.", alternatives:["Mañana después de clases nos reuniremos.","Hemos quedado en reunirnos mañana al salir."], keywords:["manana","clases","reun"], why:"Para planes futuros, “nos reuniremos” comunica un acuerdo ya definido."},
      {prompt:"Muy bien. Si tienen otra duda, me escriben.", model:"Muchas gracias, profesora. Le escribiremos si necesitamos ayuda.", alternatives:["Gracias, profesora. Le avisaremos si surge otra duda.","Muchas gracias por la orientación."], keywords:["gracias","ayuda","duda","escrib"], why:"Un cierre formal puede agradecer y confirmar qué harán si necesitan apoyo."}
    ]
  },
  {
    id:"trabajo-informe", level:4, avatar:"👨‍💻", name:"Carlos", situation:"Coordinar un informe de trabajo", place:"Trabajo", duration:"5–6 min",
    goal:"Practica mensajes profesionales y acuerdos claros.", closing:"Excelente. Quedamos así entonces. Gracias por mantenerme informado.",
    turns:[
      {prompt:"Hola. ¿Cómo vas con el informe de ventas?", model:"Hola, Carlos. Ya avancé bastante, pero todavía me falta revisar los últimos datos.", alternatives:["Hola. El informe está avanzado, aunque aún debo revisar algunos datos.","Voy bien. Solo me falta revisar la información final."], keywords:["informe","revis","datos","falta"], why:"En trabajo es útil informar avance + lo que todavía falta."},
      {prompt:"¿Crees que estará listo hoy?", model:"Sí, creo que podré terminarlo antes de las cinco.", alternatives:["Sí. Espero terminarlo antes de las cinco.","Creo que sí; lo tendré listo esta tarde."], keywords:["cinco","termin","listo","tarde"], why:"“Creo que podré…” comunica una estimación sin prometer algo imposible."},
      {prompt:"Necesito enviarlo a gerencia a las cinco y media.", model:"Entiendo. Voy a priorizar la revisión para enviártelo a tiempo.", alternatives:["De acuerdo. Lo revisaré primero para entregarlo a tiempo.","Entiendo la urgencia. Te lo enviaré antes de esa hora."], keywords:["tiempo","revis","enviar","urgencia"], why:"En un contexto profesional, confirma que entendiste la prioridad."},
      {prompt:"¿Te falta información de algún área?", model:"Sí, me falta el dato de gastos de logística.", alternatives:["Solo falta la información de gastos de logística.","Necesito el dato final del área de logística."], keywords:["logistica","gastos","dato"], why:"Identifica exactamente qué información falta para que la otra persona pueda ayudarte."},
      {prompt:"Yo puedo pedirlo ahora.", model:"Gracias. Si me lo envías pronto, podré cerrar el informe.", alternatives:["Perfecto, gracias. Con ese dato termino el informe.","Muchas gracias. Apenas llegue ese dato, termino la revisión."], keywords:["gracias","dato","informe","termin"], why:"“Si + presente, futuro” sirve para explicar una condición real: si llega, podré terminar."},
      {prompt:"Ya lo solicité. Me dijeron que lo mandan en diez minutos.", model:"Perfecto. Mientras tanto revisaré las demás cifras.", alternatives:["Gracias. Voy a avanzar con la revisión mientras llega.","Perfecto, seguiré revisando el resto."], keywords:["revis","mientras","resto","cifras"], why:"“Mientras tanto” conecta dos acciones que ocurren durante el mismo periodo."},
      {prompt:"¿Quieres que revise el documento antes de enviarlo?", model:"Sí, por favor. Me ayudaría que revises las conclusiones.", alternatives:["Sí, gracias. ¿Puedes revisar especialmente las conclusiones?","Por favor, revisa las conclusiones cuando te lo envíe."], keywords:["conclus","revis","favor"], why:"Una petición profesional funciona mejor si especifica qué parte revisar."},
      {prompt:"Claro. Envíamelo apenas termines.", model:"De acuerdo. Te lo enviaré apenas esté listo.", alternatives:["Perfecto. Te escribo y te lo envío cuando termine.","Está bien. Apenas lo finalice, te lo mando."], keywords:["envio","listo","term","apenas"], why:"“Apenas esté listo” expresa que una acción ocurrirá inmediatamente después de otra."}
    ]
  },
  {
    id:"municipalidad-tramite", level:5, avatar:"🏛️", name:"Orientadora", situation:"Realizar un trámite municipal", place:"Trámites", duration:"7–8 min",
    goal:"Practica una conversación formal larga con preguntas y aclaraciones.", closing:"Muy bien. Con eso su solicitud queda presentada. Revise su correo para recibir la respuesta.",
    turns:[
      {prompt:"Buenos días. ¿Qué trámite desea realizar?", model:"Buenos días. Quiero solicitar una constancia de domicilio.", alternatives:["Buenos días. Necesito tramitar una constancia de domicilio.","Quisiera solicitar una constancia de domicilio."], keywords:["constancia","domicilio","solic"], why:"Empieza indicando claramente el nombre del trámite que necesitas."},
      {prompt:"¿Es la primera vez que realiza esta solicitud?", model:"Sí, es la primera vez.", alternatives:["Sí, nunca he hecho este trámite antes.","Sí. Es mi primera solicitud."], keywords:["primera","si"], why:"Una respuesta directa basta cuando la pregunta es de confirmación."},
      {prompt:"Necesita su DNI y un recibo de servicio donde figure su dirección.", model:"Tengo mi DNI y un recibo de luz. ¿Ese recibo sirve?", alternatives:["Traje mi DNI y un recibo de luz. ¿Es suficiente?","Tengo ambos documentos. El recibo es de luz, ¿está bien?"], keywords:["dni","recibo","luz","sirve"], why:"Cuando no estás seguro, menciona lo que tienes y pregunta si es válido."},
      {prompt:"Sí, el recibo de luz sirve si es reciente.", model:"Perfecto. El recibo es del mes pasado.", alternatives:["Sí, es reciente; corresponde al mes pasado.","Está bien. Este recibo es del mes anterior."], keywords:["mes","pasado","reciente"], why:"Aporta el dato que confirma que cumples el requisito."},
      {prompt:"Muy bien. También debe llenar este formulario.", model:"De acuerdo. ¿Debo completar todos los campos?", alternatives:["Está bien. ¿Tengo que llenar todo el formulario?","De acuerdo. ¿Hay algún campo que pueda dejar vacío?"], keywords:["campos","formulario","complet","llen"], why:"Pregunta antes de dejar información incompleta en un documento."},
      {prompt:"Complete sus datos y la dirección. El espacio de observaciones es opcional.", model:"Entendido. Entonces dejaré vacías las observaciones si no tengo nada que agregar.", alternatives:["De acuerdo. Si no tengo observaciones, no escribiré nada allí.","Perfecto. Completaré solo los campos obligatorios."], keywords:["observ","vaci","oblig"], why:"Repetir la instrucción con tus palabras confirma que la entendiste."},
      {prompt:"Correcto. ¿La constancia la necesita para hoy?", model:"No necesariamente, pero quisiera saber cuánto demora el trámite.", alternatives:["No es urgente. ¿Cuánto tiempo demora?","Puedo esperar. ¿En cuántos días entregan la constancia?"], keywords:["demora","dias","tiempo","cuanto"], why:"“¿Cuánto demora…?” es una pregunta natural para conocer el plazo."},
      {prompt:"Normalmente demora tres días hábiles.", model:"Está bien. ¿Me avisarán cuando esté lista?", alternatives:["De acuerdo. ¿Recibiré algún aviso cuando termine?","Perfecto. ¿Cómo sabré que ya puedo recogerla?"], keywords:["avis","lista","recib"], why:"Pregunta también cómo recibirás la confirmación, no solo el plazo."},
      {prompt:"Sí, enviaremos un mensaje al correo que registre.", model:"Entonces voy a escribir mi correo con cuidado para que esté correcto.", alternatives:["Perfecto. Verificaré bien mi correo antes de entregar el formulario.","De acuerdo. Me aseguraré de registrar correctamente mi correo."], keywords:["correo","correct","verific","cuidado"], why:"Explica la acción que tomarás para evitar un error en tus datos."},
      {prompt:"Revise todo y luego entrégueme los documentos.", model:"Ya revisé los datos. Aquí tiene el formulario, mi DNI y el recibo.", alternatives:["Listo. Aquí están todos los documentos.","Ya verifiqué la información. Le entrego el formulario y los documentos."], keywords:["formulario","dni","recibo","document"], why:"Al entregar documentos, enuméralos para confirmar que no falta ninguno."}
    ]
  },
  {
    id:"amigos-salida", level:5, avatar:"👥", name:"Grupo de amigos", situation:"Organizar una salida por chat", place:"Amigos", duration:"7–8 min",
    goal:"Practica una conversación natural con propuestas, razones y acuerdos.", closing:"¡Listo! Entonces sábado a las cuatro en la plaza. Nos vemos. 🙌",
    turns:[
      {prompt:"Diego: ¿Qué hacemos este fin de semana?", model:"Podríamos salir el sábado por la tarde.", alternatives:["¿Qué tal si salimos el sábado en la tarde?","Propongo que nos reunamos el sábado."], keywords:["sabado","tarde","salir","reun"], why:"“Podríamos…” permite hacer una propuesta sin imponerla."},
      {prompt:"María: El sábado me parece bien. ¿A dónde vamos?", model:"Podemos ir al centro y luego tomar algo.", alternatives:["Podríamos encontrarnos en el centro y después ir a una cafetería.","Vamos al centro y vemos dónde tomar algo."], keywords:["centro","tomar","cafeter"], why:"Usa “luego” o “después” para ordenar dos actividades."},
      {prompt:"Diego: ¿A qué hora les queda bien?", model:"A mí me queda bien a las cuatro de la tarde.", alternatives:["Yo puedo a las cuatro.","Las cuatro de la tarde me parece una buena hora."], keywords:["cuatro","tarde"], why:"“Me queda bien” es una expresión natural para aceptar una hora."},
      {prompt:"María: Yo salgo de trabajar a las tres y media.", model:"Entonces a las cuatro está bien para que llegues con tiempo.", alternatives:["Perfecto. Nos vemos a las cuatro para que puedas llegar tranquila.","Entonces mantenemos las cuatro; así tienes tiempo de llegar."], keywords:["cuatro","tiempo","entonces"], why:"“Para que” explica la finalidad o razón de una decisión."},
      {prompt:"Diego: ¿Nos encontramos en la plaza?", model:"Sí, en la entrada principal de la plaza.", alternatives:["Sí. Mejor en la entrada principal.","De acuerdo, nos encontramos en la entrada de la plaza."], keywords:["entrada","plaza"], why:"Especificar el punto exacto evita confusiones."},
      {prompt:"María: Puede que llueva. ¿Llevamos paraguas?", model:"Sí, sería mejor llevar paraguas por si llueve.", alternatives:["Sí, llevemos paraguas por si acaso.","Buena idea. Es mejor llevar paraguas."], keywords:["paraguas","llue","mejor"], why:"“Por si…” se usa para prepararse ante una posibilidad."},
      {prompt:"Diego: También podemos ir a un lugar cerrado si empieza a llover.", model:"Sí, podemos decidirlo cuando estemos allá.", alternatives:["De acuerdo. Si llueve, buscamos un lugar cerrado.","Sí, vemos qué hacemos según el clima."], keywords:["llueve","cerrado","decid","clima"], why:"Una condición con “si” permite planear una alternativa."},
      {prompt:"María: ¿Alguien más va a ir?", model:"Voy a preguntarle a José si quiere acompañarnos.", alternatives:["Le escribiré a José para invitarlo.","Puedo preguntarle a José si también quiere ir."], keywords:["jose","pregunt","invitar","acompan"], why:"“Si quiere acompañarnos” expresa una invitación indirecta."},
      {prompt:"Diego: Avísanos qué te responde.", model:"Claro. Apenas me responda, les aviso por el grupo.", alternatives:["Sí. Les escribo cuando José responda.","De acuerdo, les aviso en cuanto tenga su respuesta."], keywords:["aviso","grupo","respon"], why:"“Apenas” o “en cuanto” indican que harás algo inmediatamente después."},
      {prompt:"María: Entonces ya tenemos hora y lugar.", model:"Sí. Sábado a las cuatro, en la entrada principal de la plaza.", alternatives:["Correcto: nos vemos el sábado a las cuatro en la plaza.","Sí, queda confirmado para el sábado a las cuatro."], keywords:["sabado","cuatro","plaza","confirm"], why:"Al final de una coordinación, resume día, hora y lugar."}
    ]
  },
  {
    id:"farmacia-receta", level:3, avatar:"💊", name:"Farmacéutica", situation:"Comprar con una receta", place:"Salud", duration:"5–6 min",
    goal:"Practica explicar lo que necesitas, confirmar información y preguntar con cortesía.", closing:"Muy bien. Aquí tiene todo y su comprobante. Que se mejore pronto.",
    turns:[
      {prompt:"Buenas tardes. ¿En qué puedo ayudarlo?", model:"Buenas tardes. Quiero comprar los medicamentos de esta receta.", alternatives:["Buenas tardes. Tengo esta receta y necesito los medicamentos indicados.","Quisiera comprar lo que aparece en esta receta."], keywords:["receta","medic"], why:"Menciona desde el inicio que tienes una receta y cuál es tu objetivo."},
      {prompt:"Claro. ¿La receta es para usted?", model:"Sí, es para mí.", alternatives:["Sí, la receta es mía.","Sí, estos medicamentos son para mí."], keywords:["si","mi"], why:"Una pregunta de confirmación puede responderse de forma breve y directa."},
      {prompt:"Uno de los medicamentos tiene dos presentaciones. ¿Le indicaron tabletas o jarabe?", model:"Me indicaron tabletas.", alternatives:["En la receta dice tabletas.","Debo llevar la presentación en tabletas."], keywords:["tabletas"], why:"Cuando hay opciones, menciona exactamente la presentación indicada."},
      {prompt:"Perfecto. ¿Necesita que le explique cómo leer la indicación de la caja?", model:"Sí, por favor. Quiero asegurarme de entenderla bien.", alternatives:["Sí, agradecería que me la explique.","Sí, por favor. Quiero revisar la indicación."], keywords:["si","favor","explic","indic"], why:"Si algo no está claro, pedir una explicación es mejor que asumir."},
      {prompt:"Aquí dice que debe seguir lo indicado por su profesional de salud y revisar el horario de la receta.", model:"Entiendo. Voy a seguir exactamente lo que indica la receta.", alternatives:["De acuerdo. Seguiré las indicaciones de la receta.","Entendido. Revisaré bien el horario antes de tomarlo."], keywords:["indic","receta","horario"], why:"Repetir la instrucción con tus palabras ayuda a confirmar que la comprendiste."},
      {prompt:"¿Desea todos los productos de la receta?", model:"Sí, quisiera llevar todos, por favor.", alternatives:["Sí, voy a llevar todo lo indicado.","Sí, deme todos los productos de la receta, por favor."], keywords:["todos","receta","favor"], why:"“Quisiera” y “por favor” mantienen un tono amable al comprar."},
      {prompt:"El total es treinta y seis soles. ¿Cómo va a pagar?", model:"Voy a pagar con tarjeta.", alternatives:["Con tarjeta, por favor.","Pagaré con tarjeta."], keywords:["tarjeta","pagar"], why:"Para indicar el medio de pago puedes usar “voy a pagar con…”."},
      {prompt:"Listo. ¿Necesita una bolsa?", model:"Sí, por favor. Muchas gracias.", alternatives:["Sí, una bolsa, por favor.","Sí. Gracias por la atención."], keywords:["bolsa","gracias","favor"], why:"Puedes responder la pregunta y agradecer en el mismo mensaje."}
    ]
  },
  {
    id:"entrevista-trabajo", level:4, avatar:"👩‍💼", name:"Sra. Ramírez", situation:"Coordinar una entrevista de trabajo", place:"Trabajo", duration:"5–6 min",
    goal:"Practica mensajes formales, disponibilidad y confirmaciones.", closing:"Perfecto. Queda confirmada su entrevista. Lo esperamos el martes. Éxitos.",
    turns:[
      {prompt:"Buenos días. Le escribo por su postulación. ¿Tiene unos minutos?", model:"Buenos días. Sí, claro. Muchas gracias por comunicarse conmigo.", alternatives:["Buenos días. Sí, tengo disponibilidad. Gracias por contactarme.","Buenos días. Claro, puedo conversar ahora."], keywords:["buenos","si","gracias","dispon"], why:"En un contexto laboral, saluda y confirma tu disponibilidad con un tono cordial."},
      {prompt:"Queremos invitarlo a una entrevista presencial.", model:"Muchas gracias por la invitación. ¿Qué día sería la entrevista?", alternatives:["Gracias. ¿Para qué fecha está programada?","Con gusto. ¿Podría indicarme el día de la entrevista?"], keywords:["gracias","dia","fecha","entrevista"], why:"Después de aceptar, pregunta por el dato que necesitas para organizarte."},
      {prompt:"Podría ser el martes a las diez de la mañana.", model:"El martes a las diez me queda bien.", alternatives:["Sí, tengo disponibilidad el martes a las diez.","De acuerdo, puedo asistir a esa hora."], keywords:["martes","diez","bien","asist"], why:"Repite el día y la hora al confirmar una cita importante."},
      {prompt:"La oficina queda en la avenida Central 450.", model:"Entendido. ¿Debo preguntar por alguna persona al llegar?", alternatives:["Gracias. ¿Con quién debo anunciarme al llegar?","De acuerdo. ¿A quién debo indicar que vengo a ver?"], keywords:["quien","persona","lleg"], why:"Pregunta por la persona de contacto para evitar confusiones al llegar."},
      {prompt:"Pregunte por mí, la señora Ramírez.", model:"Perfecto, señora Ramírez. Lo tendré en cuenta.", alternatives:["De acuerdo. Preguntaré por usted al llegar.","Perfecto, gracias por indicármelo."], keywords:["ramirez","perfecto","gracias"], why:"Confirmar el nombre demuestra que registraste correctamente la información."},
      {prompt:"Traiga su DNI y una copia de su currículum.", model:"De acuerdo. Llevaré mi DNI y una copia de mi currículum.", alternatives:["Entendido. Prepararé ambos documentos.","Está bien. Llevaré los documentos indicados."], keywords:["dni","curriculum","document"], why:"Repetir los documentos permite verificar que no olvidarás ninguno."},
      {prompt:"¿Tiene alguna consulta sobre la entrevista?", model:"Sí. ¿Aproximadamente cuánto tiempo durará?", alternatives:["Quisiera saber cuánto dura aproximadamente la entrevista.","Sí. ¿Podría indicarme la duración aproximada?"], keywords:["cuanto","tiempo","dur"], why:"“Aproximadamente” es útil cuando sabes que la duración puede variar."},
      {prompt:"Entre treinta y cuarenta minutos.", model:"Entendido. Muchas gracias por la información. Nos vemos el martes.", alternatives:["Perfecto, gracias. Estaré allí el martes a las diez.","Muchas gracias. Queda confirmado para el martes."], keywords:["gracias","martes","confirm"], why:"Cierra resumiendo el acuerdo principal y agradeciendo."}
    ]
  },
  {
    id:"viaje-terminal", level:5, avatar:"🧳", name:"Agente de terminal", situation:"Comprar un pasaje interprovincial", place:"Viaje", duration:"7–8 min",
    goal:"Practica una conversación larga con horarios, alternativas, equipaje y confirmación final.", closing:"Su compra quedó registrada. Llegue al terminal con anticipación y tenga su DNI a la mano. Buen viaje.",
    turns:[
      {prompt:"Buenos días. ¿A qué ciudad desea viajar?", model:"Buenos días. Quiero viajar a Arequipa.", alternatives:["Buenos días. Necesito un pasaje para Arequipa.","Quisiera viajar a Arequipa."], keywords:["arequipa","viaj","pasaje"], why:"Empieza indicando claramente tu destino."},
      {prompt:"¿Para qué día necesita el pasaje?", model:"Para este viernes, por favor.", alternatives:["Quisiera viajar este viernes.","Necesito el pasaje para el viernes."], keywords:["viernes"], why:"En una compra de pasaje, el día es uno de los datos esenciales."},
      {prompt:"Tenemos salidas a las ocho de la mañana y a las nueve de la noche.", model:"Prefiero la salida de las nueve de la noche.", alternatives:["Quisiera viajar a las nueve de la noche.","Me conviene más el bus de las nueve de la noche."], keywords:["nueve","noche"], why:"“Prefiero” permite elegir claramente entre dos alternativas."},
      {prompt:"Está bien. ¿Viaja solo?", model:"Sí, voy a viajar solo.", alternatives:["Sí, el pasaje es solo para mí.","Sí, viajo solo."], keywords:["solo","si"], why:"Una confirmación breve es suficiente cuando la pregunta es concreta."},
      {prompt:"¿Desea asiento en la parte delantera o en la parte posterior?", model:"Si es posible, quisiera un asiento en la parte delantera.", alternatives:["Prefiero un asiento adelante, por favor.","Quisiera sentarme en la parte delantera."], keywords:["delantera","adelante","asiento"], why:"“Si es posible” comunica una preferencia sin exigirla."},
      {prompt:"Hay un asiento disponible adelante. ¿Lleva equipaje para bodega?", model:"Sí, llevo una maleta mediana.", alternatives:["Sí, tengo una maleta para guardar en bodega.","Llevo una maleta mediana como equipaje."], keywords:["maleta","equipaje","bodega"], why:"Indica el tipo o tamaño de equipaje para recibir la información correcta."},
      {prompt:"La maleta está incluida. El equipaje de mano puede ir con usted.", model:"Perfecto. También llevo una mochila pequeña.", alternatives:["Entiendo. Mi equipaje de mano será una mochila.","Perfecto, entonces llevaré mi mochila conmigo."], keywords:["mochila","mano","perfecto"], why:"Agregar el dato de tu mochila confirma cómo organizarás el equipaje."},
      {prompt:"Necesito su nombre completo y DNI para emitir el pasaje.", model:"Claro. Mi nombre es Luis Pérez y mi DNI es 12345678.", alternatives:["De acuerdo. Soy Luis Pérez, DNI 12345678.","Claro, le doy mis datos: Luis Pérez, DNI 12345678."], keywords:["luis","perez","dni","12345678"], why:"En un trámite de viaje, entrega los datos solicitados de forma ordenada."},
      {prompt:"Gracias. El total es ciento veinte soles. ¿Desea pagar ahora?", model:"Sí, voy a pagar ahora con tarjeta.", alternatives:["Sí, pagaré con tarjeta.","Sí, por favor. Haré el pago ahora."], keywords:["si","pagar","tarjeta","ahora"], why:"Confirma tanto el momento del pago como el medio que usarás."},
      {prompt:"Pago aprobado. El embarque empieza treinta minutos antes de la salida.", model:"Entendido. Entonces debo estar en el terminal antes de las ocho y media.", alternatives:["De acuerdo. Llegaré al terminal con suficiente anticipación.","Entiendo. Estaré allí por lo menos treinta minutos antes."], keywords:["terminal","antes","ocho","treinta"], why:"Calcular y repetir la hora de llegada demuestra que entendiste la indicación."}
    ]
  },
  {
    id:"tarea-companero", level:1, avatar:"📝", name:"Andrea", situation:"Hacer una tarea con un compañero", place:"Tareas", duration:"3–4 min",
    goal:"Practica preguntar, repartir una tarea y confirmar qué hará cada persona.", closing:"Perfecto. Entonces cada uno hace su parte y mañana juntamos todo. 👍",
    turns:[
      {prompt:"Hola. ¿Ya viste la tarea que dejó la profesora?",model:"Hola, Andrea. Sí, ya vi la tarea.",alternatives:["Sí, ya la revisé.","Hola. Sí, ya sé qué tenemos que hacer."],keywords:["si","tarea","vi","revis"],why:"Primero confirma que conoces la tarea."},
      {prompt:"Tenemos que hacerla entre los dos. ¿Cómo nos organizamos?",model:"Podemos dividir la tarea en dos partes.",alternatives:["Hagamos una parte cada uno.","Podemos repartir el trabajo."],keywords:["dividir","partes","repart"],why:"Para organizarse usa verbos como dividir, repartir o hacer."},
      {prompt:"Está bien. ¿Qué parte quieres hacer tú?",model:"Yo puedo buscar la información.",alternatives:["Prefiero buscar la información.","Yo me encargo de investigar."],keywords:["buscar","informacion","investig"],why:"“Yo puedo…” o “me encargo de…” sirven para asumir una tarea."},
      {prompt:"Entonces yo escribo las respuestas.",model:"Perfecto. Después juntamos las dos partes.",alternatives:["Está bien. Luego unimos todo.","De acuerdo. Después revisamos las dos partes."],keywords:["despues","junt","partes","revis"],why:"“Después” ayuda a ordenar lo que harán primero y lo que harán luego."},
      {prompt:"¿Cuándo terminamos?",model:"Podemos terminar mañana por la tarde.",alternatives:["Mañana en la tarde estaría bien.","Propongo terminar mañana."],keywords:["mañana","tarde","termin"],why:"Una tarea necesita una fecha clara para terminar."},
      {prompt:"¿Te envío mi parte por el grupo?",model:"Sí, envíamela por el grupo, por favor.",alternatives:["Sí, mándamela por el grupo.","Sí, así puedo revisarla."],keywords:["si","grupo","envia","revis"],why:"En una petición breve, “por favor” mantiene un tono amable."},
      {prompt:"Listo. Te la mando cuando termine.",model:"Gracias. Yo también te enviaré mi parte cuando esté lista.",alternatives:["Perfecto. Yo haré lo mismo.","Gracias. Te envío mi parte al terminar."],keywords:["gracias","envio","parte","termin"],why:"Confirma tu propio compromiso para cerrar la coordinación."}
    ]
  },
  {
    id:"mascota-vecino", level:1, avatar:"🐶", name:"Mario", situation:"Pedir ayuda para cuidar una mascota", place:"Vecindario", duration:"3–4 min",
    goal:"Practica pedir un favor y explicar instrucciones simples.", closing:"Listo, yo me encargo. Escríbeme si necesitas algo más. 🐾",
    turns:[
      {prompt:"Hola, vecino. ¿Todo bien?",model:"Hola, Mario. Sí, todo bien. Quería pedirte un favor.",alternatives:["Hola. Sí, gracias. ¿Puedo pedirte un favor?","Todo bien. Necesito pedirte una ayuda."],keywords:["favor","ayuda"],why:"Para pedir ayuda, primero puedes avisar que quieres pedir un favor."},
      {prompt:"Claro, dime.",model:"Mañana saldré temprano. ¿Puedes darle comida a mi perro?",alternatives:["¿Puedes alimentar a mi perro mañana?","Mañana no estaré. ¿Podrías darle comida a mi perro?"],keywords:["manana","perro","comida"],why:"Explica cuándo necesitas ayuda y qué debe hacer la otra persona."},
      {prompt:"Sí. ¿A qué hora come?",model:"Come a las ocho de la mañana.",alternatives:["A las ocho de la mañana.","Normalmente come a las ocho."],keywords:["ocho","mañana","come"],why:"Para una instrucción, indica una hora concreta."},
      {prompt:"¿Dónde está su comida?",model:"Está en la cocina, al lado de la refrigeradora.",alternatives:["La comida está en la cocina.","Está junto a la refrigeradora."],keywords:["cocina","refrigeradora"],why:"Usa “en”, “al lado de” o “junto a” para indicar ubicación."},
      {prompt:"¿Le doy también agua?",model:"Sí, por favor. Cambia el agua de su plato.",alternatives:["Sí, gracias. Ponle agua limpia.","Sí, también necesita agua."],keywords:["agua","favor","plato"],why:"Una instrucción clara usa un verbo de acción: cambia, pon, dale."},
      {prompt:"Entendido. No te preocupes.",model:"Muchas gracias, Mario. Me ayudas mucho.",alternatives:["Gracias por ayudarme.","Te agradezco mucho el favor."],keywords:["gracias","ayud","favor"],why:"Agradecer cierra bien una petición de ayuda."}
    ]
  },
  {
    id:"delivery-almuerzo", level:2, avatar:"🥡", name:"Restaurante", situation:"Hacer un pedido por delivery", place:"Delivery", duration:"4–5 min",
    goal:"Practica elegir comida, dar dirección y confirmar un pedido.", closing:"Pedido confirmado. Te avisaremos cuando el repartidor salga del restaurante. 🛵",
    turns:[
      {prompt:"Hola. Gracias por escribirnos. ¿Qué desea pedir?",model:"Hola. Quisiera un pollo a la plancha con arroz.",alternatives:["Quiero un pollo a la plancha con arroz, por favor.","Buenas tardes. Deseo pedir un pollo a la plancha."],keywords:["pollo","arroz"],why:"Empieza diciendo claramente qué deseas pedir."},
      {prompt:"¿Desea ensalada o papas como acompañamiento?",model:"Prefiero ensalada, por favor.",alternatives:["Quisiera ensalada.","Ensalada está bien, gracias."],keywords:["ensalada","prefiero"],why:"“Prefiero” sirve para elegir entre opciones."},
      {prompt:"¿Alguna bebida?",model:"Sí, una limonada mediana.",alternatives:["Una limonada, por favor.","Sí, agregue una limonada mediana."],keywords:["limonada"],why:"Indica producto y tamaño cuando haya opciones."},
      {prompt:"¿A qué dirección enviamos el pedido?",model:"Envíenlo a la avenida Grau 320.",alternatives:["Mi dirección es avenida Grau 320.","El pedido es para la avenida Grau 320."],keywords:["grau","320","direccion"],why:"En delivery, una dirección completa evita errores."},
      {prompt:"El tiempo aproximado es cuarenta minutos.",model:"Está bien. ¿Me avisan cuando el repartidor salga?",alternatives:["Perfecto. Avísenme cuando salga el pedido.","De acuerdo. ¿Recibiré un aviso?"],keywords:["avisa","repartidor","salga"],why:"Puedes preguntar cómo recibirás una actualización del pedido."},
      {prompt:"Sí. ¿Pagará con efectivo, tarjeta o Yape?",model:"Voy a pagar con Yape.",alternatives:["Pagaré por Yape.","Con Yape, por favor."],keywords:["yape","pagar"],why:"Indica el medio de pago de forma directa."},
      {prompt:"Perfecto. ¿Desea algo más?",model:"No, gracias. Eso es todo.",alternatives:["No, muchas gracias.","No. El pedido está completo."],keywords:["no","gracias","todo"],why:"Para cerrar un pedido, confirma que no necesitas nada más."}
    ]
  },
  {
    id:"partido-barrio", level:2, avatar:"⚽", name:"Equipo del barrio", situation:"Organizar un partido", place:"Deporte", duration:"4–5 min",
    goal:"Practica horarios, roles, objetos y cambios de plan.", closing:"¡Listo! Quedamos para el domingo. Nos vemos en la cancha. ⚽",
    turns:[
      {prompt:"Estamos organizando un partido el domingo. ¿Te apuntas?",model:"Sí, quiero jugar.",alternatives:["Sí, cuenten conmigo.","Claro, puedo jugar el domingo."],keywords:["si","jugar","domingo"],why:"Puedes aceptar con “quiero”, “puedo” o “cuenten conmigo”."},
      {prompt:"Buenazo. ¿Prefieres jugar de defensa o adelante?",model:"Prefiero jugar de defensa.",alternatives:["Me gusta más jugar de defensa.","Puedo jugar de defensa."],keywords:["defensa","prefiero"],why:"Usa “prefiero” para expresar una elección."},
      {prompt:"Empezamos a las nueve de la mañana.",model:"Perfecto. Llegaré un poco antes.",alternatives:["Está bien. Estaré allí antes de las nueve.","De acuerdo, llegaré temprano."],keywords:["nueve","antes","temprano"],why:"Llegar “antes” o “temprano” expresa anticipación."},
      {prompt:"¿Puedes llevar una pelota?",model:"Sí, puedo llevar una pelota.",alternatives:["Sí, yo llevo la pelota.","Claro, llevaré una."],keywords:["si","pelota","llevar"],why:"Confirma el objeto que te comprometes a llevar."},
      {prompt:"Parece que hará bastante sol.",model:"Entonces llevaré agua y una gorra.",alternatives:["Llevaré agua porque hará calor.","Buena idea. Llevaré algo para el sol."],keywords:["agua","gorra","sol"],why:"“Entonces” conecta una situación con una decisión."},
      {prompt:"Si alguien falta, quizá cambiemos los equipos.",model:"No hay problema. Podemos organizarnos allá.",alternatives:["Está bien, vemos los equipos al llegar.","De acuerdo. Nos acomodamos según cuántos seamos."],keywords:["problema","equipos","lleg"],why:"En un cambio de plan, muestra flexibilidad y propone qué hacer."},
      {prompt:"Perfecto. Te agrego al grupo.",model:"Gracias. Estaré atento a los mensajes.",alternatives:["Gracias, revisaré el grupo.","Perfecto. Avísenme si cambia algo."],keywords:["gracias","mensajes","avisa"],why:"Un grupo de chat sirve para seguir cambios; puedes decir que estarás atento."}
    ]
  },
  {
    id:"internet-soporte", level:3, avatar:"📶", name:"Soporte técnico", situation:"Reportar una falla de internet", place:"Tecnología", duration:"5–6 min",
    goal:"Practica describir un problema, frecuencia y pasos que ya intentaste.", closing:"Registré el reporte. Si la conexión vuelve a fallar, responde a este chat con el número de caso.",
    turns:[
      {prompt:"Hola. Soy soporte técnico. ¿Qué problema presenta su servicio?",model:"Hola. Mi internet se desconecta varias veces al día.",alternatives:["La conexión se corta varias veces.","Tengo problemas porque el internet se desconecta."],keywords:["internet","desconecta","veces"],why:"Describe qué ocurre y con qué frecuencia."},
      {prompt:"¿Desde cuándo sucede?",model:"Desde ayer por la noche.",alternatives:["Empezó anoche.","El problema comenzó ayer."],keywords:["ayer","anoche","empez"],why:"“Desde” indica el momento en que empezó un problema."},
      {prompt:"¿Las luces del módem cambian cuando se corta?",model:"Sí, una luz se pone roja.",alternatives:["Sí, la luz de internet cambia a rojo.","Sí, veo una luz roja cuando falla."],keywords:["luz","roja"],why:"Describe lo que observas; eso ayuda a identificar la falla."},
      {prompt:"¿Ya reinició el módem?",model:"Sí, lo reinicié dos veces, pero el problema continúa.",alternatives:["Sí, ya lo reinicié y sigue igual.","Lo reinicié, pero todavía se desconecta."],keywords:["reinici","pero","continua"],why:"“Pero” sirve para mostrar que una acción no resolvió el problema."},
      {prompt:"Voy a revisar la línea. ¿Puede esperar un momento?",model:"Sí, claro. Espero.",alternatives:["De acuerdo, espero.","Sí, no hay problema."],keywords:["si","espero"],why:"Una confirmación breve es suficiente mientras la otra persona revisa algo."},
      {prompt:"Veo una señal inestable. Haré un ajuste remoto.",model:"Entiendo. ¿Necesito hacer algo aquí?",alternatives:["De acuerdo. ¿Debo tocar el módem?","Está bien. ¿Tengo que hacer algún paso?"],keywords:["necesito","hacer","algo"],why:"Pregunta si debes realizar alguna acción de tu lado."},
      {prompt:"No por ahora. Espere dos minutos y pruebe de nuevo.",model:"Perfecto. Voy a esperar y luego probaré la conexión.",alternatives:["De acuerdo. Probaré nuevamente en dos minutos.","Entendido. Espero y vuelvo a probar."],keywords:["esper","probar","dos"],why:"Repite los pasos para confirmar que entendiste la instrucción."}
    ]
  },
  {
    id:"reniec-dni", level:3, avatar:"🪪", name:"Orientador de RENIEC", situation:"Hacer un trámite de DNI en RENIEC", place:"RENIEC", duration:"5–6 min",
    goal:"Practica explicar qué trámite necesitas, preguntar requisitos y confirmar los pasos.", closing:"Muy bien. Con esos pasos podrás continuar el trámite. Revisa tu constancia y guarda la información de seguimiento.",
    turns:[
      {prompt:"Buenos días. ¿Qué trámite desea realizar?",model:"Buenos días. Quiero renovar mi DNI.",alternatives:["Buenos días. Necesito renovar mi DNI.","Quisiera hacer la renovación de mi DNI."],keywords:["renovar","dni"],why:"En RENIEC conviene decir claramente qué trámite necesitas desde el inicio."},
      {prompt:"¿Su DNI está vencido o está por vencer?",model:"Está por vencer el próximo mes.",alternatives:["Todavía no vence, pero vence el próximo mes.","Mi DNI está cerca de vencer."],keywords:["vencer","mes"],why:"“Está por…” sirve para decir que algo sucederá pronto."},
      {prompt:"De acuerdo. Necesita seguir el procedimiento de renovación. ¿Ya realizó el pago correspondiente?",model:"Todavía no. ¿Dónde puedo realizar el pago?",alternatives:["No todavía. ¿Cómo puedo pagar?","Aún no he pagado. ¿Dónde se realiza el pago?"],keywords:["no","pago","donde"],why:"Si te falta un paso, dilo claramente y pregunta cómo realizarlo."},
      {prompt:"Puede revisar los canales de pago disponibles antes de continuar.",model:"Entiendo. Después de pagar, ¿qué debo hacer?",alternatives:["De acuerdo. ¿Cuál es el siguiente paso?","Perfecto. Cuando pague, ¿cómo continúo?"],keywords:["despues","pagar","siguiente","paso"],why:"“Después de…” ayuda a preguntar por el orden correcto de un trámite."},
      {prompt:"Luego debe continuar con el registro de la solicitud y verificar sus datos.",model:"¿Debo revisar mi dirección y mis nombres antes de confirmar?",alternatives:["¿Tengo que verificar todos mis datos?","¿Debo comprobar que mi información esté correcta?"],keywords:["revis","datos","direccion","nombres"],why:"Antes de confirmar un trámite, es útil preguntar qué información debes verificar."},
      {prompt:"Sí. Revise cuidadosamente sus datos personales.",model:"De acuerdo. Si encuentro un error, ¿puedo corregirlo antes de continuar?",alternatives:["¿Qué hago si un dato está incorrecto?","¿Puedo corregir un dato antes de confirmar la solicitud?"],keywords:["error","correg","dato"],why:"Una pregunta con “si” permite plantear una situación posible y pedir una solución."},
      {prompt:"Debe corregir cualquier dato que corresponda antes de finalizar el proceso.",model:"Entiendo. ¿Cómo sabré cuándo mi DNI esté listo?",alternatives:["¿Me avisarán cuando esté listo?","¿Cómo puedo revisar el estado del trámite?"],keywords:["listo","avis","estado","tramite"],why:"Al final de un trámite, pregunta cómo recibirás o consultarás la confirmación."},
      {prompt:"Podrá revisar el estado del trámite y seguir las indicaciones de entrega.",model:"Perfecto. Muchas gracias por explicarme los pasos.",alternatives:["Gracias. Ahora entiendo mejor el trámite.","Muchas gracias por la orientación."],keywords:["gracias","pasos","tramite"],why:"Cerrar agradeciendo y confirmando que entendiste ayuda a terminar una atención formal."}
    ]
  },
  {
    id:"universidad-proyecto", level:4, avatar:"📚", name:"Grupo de estudio", situation:"Organizar un proyecto universitario", place:"Universidad", duration:"6–7 min",
    goal:"Practica repartir tareas, justificar decisiones y acordar fechas.", closing:"Excelente. Ya tenemos tareas, fecha y forma de revisión. Avancemos y nos escribimos por el grupo.",
    turns:[
      {prompt:"Tenemos que dividir el proyecto. ¿Qué parte te gustaría hacer?",model:"Me gustaría preparar la introducción y buscar las fuentes.",alternatives:["Prefiero encargarme de la introducción.","Puedo buscar información y redactar la primera parte."],keywords:["introduccion","fuentes","informacion"],why:"Para repartir tareas, di qué parte prefieres asumir."},
      {prompt:"Bien. Yo puedo hacer el análisis.",model:"Perfecto. Entonces nos falta asignar las conclusiones.",alternatives:["Está bien. Todavía debemos decidir quién hará las conclusiones.","Perfecto. Falta la parte final."],keywords:["conclus","falta"],why:"“Entonces” ayuda a conectar lo que ya se decidió con lo que falta."},
      {prompt:"Podemos preguntarle a Lucía.",model:"Sí. Le escribiré para saber si puede encargarse.",alternatives:["De acuerdo, voy a preguntarle.","Sí, le consulto ahora."],keywords:["lucia","pregunt","escrib"],why:"Puedes expresar una acción futura para resolver una tarea pendiente."},
      {prompt:"¿Cuándo deberíamos tener el primer borrador?",model:"Propongo tenerlo listo el jueves por la noche.",alternatives:["Podemos terminar el primer borrador el jueves.","El jueves en la noche sería una buena fecha."],keywords:["jueves","borrador","noche"],why:"“Propongo” es útil para sugerir una fecha al grupo."},
      {prompt:"El jueves me sirve. ¿Cómo revisamos todo?",model:"Podemos hacer una videollamada y revisar el documento juntos.",alternatives:["Revisemos el documento por videollamada.","Podemos conectarnos y corregirlo entre todos."],keywords:["videollamada","revis","documento"],why:"Explica el medio y la acción: videollamada + revisar juntos."},
      {prompt:"¿A qué hora?",model:"A las ocho de la noche.",alternatives:["Podría ser a las ocho.","A las ocho me queda bien."],keywords:["ocho","noche"],why:"Una hora concreta facilita que todos confirmen."},
      {prompt:"Perfecto. Yo crearé el enlace.",model:"Gracias. Yo avisaré a Lucía y subiré mi avance antes de la reunión.",alternatives:["Gracias. Enviaré mi parte antes de reunirnos.","Perfecto. Le aviso a Lucía y comparto mi avance."],keywords:["lucia","avance","reunion","aviso"],why:"Resume dos acciones usando “y” para dejar claro tu compromiso."},
      {prompt:"Buen plan. Así llegamos preparados.",model:"Sí, así podremos usar la reunión para corregir y cerrar el proyecto.",alternatives:["Exacto. En la reunión podremos enfocarnos en los cambios finales.","Sí, eso nos ayudará a terminar a tiempo."],keywords:["reunion","correg","termin","tiempo"],why:"Explica el beneficio de un plan con “así podremos…” o “eso nos ayudará…”."}
    ]
  },
  {
    id:"accesibilidad-cita", level:4, avatar:"🤟", name:"Recepción", situation:"Solicitar apoyo de comunicación para una cita", place:"Accesibilidad", duration:"6–7 min",
    goal:"Practica explicar una necesidad de accesibilidad con claridad y respeto.", closing:"Queda registrada la solicitud. También anotamos que prefieres confirmación por mensaje. Gracias por avisarnos con anticipación.",
    turns:[
      {prompt:"Buenos días. ¿En qué podemos ayudarlo con su cita?",model:"Buenos días. Necesito apoyo de interpretación en lengua de señas para mi cita.",alternatives:["Quisiera solicitar un intérprete de lengua de señas.","Necesito apoyo de comunicación para poder seguir la cita."],keywords:["interpret","lengua","señas","apoyo"],why:"Explica la necesidad de accesibilidad de forma directa: qué apoyo necesitas y para qué."},
      {prompt:"Claro. ¿Para qué fecha es su cita?",model:"Mi cita es el miércoles a las diez de la mañana.",alternatives:["Es este miércoles a las diez.","La cita está programada para el miércoles a las diez."],keywords:["miercoles","diez"],why:"Indica día y hora completos para evitar confusiones."},
      {prompt:"¿La cita es presencial?",model:"Sí, será presencial en la sede del centro.",alternatives:["Sí, tengo que ir a la sede.","Sí, la atención será presencial."],keywords:["si","presencial","sede"],why:"Confirma la modalidad y, si es útil, el lugar."},
      {prompt:"Voy a registrar la solicitud. ¿Tiene alguna preferencia adicional de comunicación?",model:"Sí. Prefiero recibir las indicaciones importantes también por escrito.",alternatives:["Sí, por favor. Quisiera que la información importante esté escrita.","Me ayuda recibir las instrucciones por escrito."],keywords:["escrito","informacion","indicaciones"],why:"Puedes explicar qué forma de comunicación te ayuda más."},
      {prompt:"Entendido. Lo anotaremos.",model:"Gracias. ¿Me confirmarán si el apoyo estará disponible?",alternatives:["Muchas gracias. ¿Recibiré una confirmación?","¿Me pueden avisar cuando quede confirmado?"],keywords:["confirm","avisa","disponible"],why:"Pide una confirmación para saber si la solicitud quedó resuelta."},
      {prompt:"Sí, le enviaremos un mensaje.",model:"Perfecto. Prefiero que la confirmación sea por mensaje de texto.",alternatives:["Gracias. Un mensaje de texto está bien.","Perfecto, por favor envíenme la confirmación por escrito."],keywords:["mensaje","texto","confirm"],why:"Puedes indicar el canal de comunicación que prefieres."},
      {prompt:"De acuerdo. ¿Hay algo más que debamos saber?",model:"No, con eso es suficiente. Muchas gracias por la ayuda.",alternatives:["Eso es todo. Gracias por la atención.","No, gracias. Ya quedó claro."],keywords:["no","gracias","ayuda"],why:"Cierra confirmando que la información quedó clara y agradeciendo."}
    ]
  },
  {
    id:"hotel-reserva", level:5, avatar:"🏨", name:"Hotel Andino", situation:"Modificar una reserva de hotel", place:"Viaje", duration:"7–8 min",
    goal:"Practica explicar un cambio, comparar opciones y confirmar condiciones.", closing:"Listo. La reserva quedó modificada y enviamos la confirmación a tu correo. Te esperamos el viernes.",
    turns:[
      {prompt:"Buenas tardes. ¿En qué podemos ayudarlo?",model:"Buenas tardes. Tengo una reserva y necesito cambiar la fecha de llegada.",alternatives:["Hola. Quisiera modificar la fecha de mi reserva.","Tengo una reserva, pero necesito llegar un día después."],keywords:["reserva","cambiar","fecha","llegada"],why:"Explica primero qué reserva tienes y qué cambio necesitas."},
      {prompt:"Claro. ¿A nombre de quién está la reserva?",model:"Está a nombre de Luis Pérez.",alternatives:["La reserva está a nombre de Luis Pérez.","Mi nombre es Luis Pérez."],keywords:["luis","perez","nombre"],why:"En una gestión de reserva, da el nombre tal como fue registrado."},
      {prompt:"La reserva empieza el jueves. ¿Qué día desea llegar?",model:"Quisiera llegar el viernes por la tarde.",alternatives:["Necesito cambiar la llegada para el viernes.","Llegaré el viernes en la tarde."],keywords:["viernes","tarde","lleg"],why:"Indica el nuevo día y, si puedes, el momento aproximado."},
      {prompt:"Tenemos disponibilidad el viernes. ¿Mantiene dos noches?",model:"Sí, quisiera mantener las dos noches.",alternatives:["Sí, la cantidad de noches no cambia.","Sí, me quedaré dos noches."],keywords:["si","dos","noches"],why:"Aclara qué parte de la reserva se mantiene igual."},
      {prompt:"El cambio tiene una diferencia de veinte soles.",model:"Está bien. ¿Ese monto se paga ahora o al llegar?",alternatives:["De acuerdo. ¿Cuándo debo pagar la diferencia?","Está bien. ¿Puedo pagar los veinte soles en el hotel?"],keywords:["pagar","ahora","llegar","diferencia"],why:"Pregunta cuándo debe realizarse un pago adicional."},
      {prompt:"Puede pagarlo al llegar.",model:"Perfecto. Entonces lo pagaré durante el check-in.",alternatives:["De acuerdo, pagaré al llegar.","Perfecto. Haré el pago cuando me registre."],keywords:["pagar","llegar","check"],why:"“Entonces” conecta la información recibida con tu decisión."},
      {prompt:"¿Necesita mantener la habitación con dos camas?",model:"Sí, por favor. Viajamos dos personas y necesitamos dos camas.",alternatives:["Sí, mantenga la habitación con dos camas.","Sí. Somos dos personas y preferimos camas separadas."],keywords:["dos","camas","personas"],why:"Explica la preferencia y la razón para que la solicitud sea clara."},
      {prompt:"De acuerdo. La reserva ya está actualizada. ¿Desea que le enviemos una nueva confirmación?",model:"Sí, por favor. Envíenme la confirmación por correo.",alternatives:["Sí, quisiera recibir la reserva actualizada.","Sí, por favor. Quiero una confirmación del cambio."],keywords:["si","confirm","correo","actualiz"],why:"Después de un cambio importante, pedir una confirmación escrita ayuda a verificar la información."},
      {prompt:"Sí, la enviaremos por correo en unos minutos.",model:"Excelente. Revisaré mi correo. Muchas gracias por la ayuda.",alternatives:["Perfecto. Estaré atento al correo. Gracias.","Muchas gracias. Revisaré la confirmación cuando llegue."],keywords:["correo","gracias","revis"],why:"Cierra indicando qué harás después y agradeciendo."}
    ]
  },
  {
    id:"junta-vecinal", level:5, avatar:"🌳", name:"Grupo vecinal", situation:"Organizar una actividad para el barrio", place:"Vecindario", duration:"7–8 min",
    goal:"Practica propuestas, acuerdos, responsabilidades y solución de problemas.", closing:"Muy bien. Ya tenemos fecha, tareas y un plan alternativo. Compartiremos el resumen en el grupo para que todos puedan leerlo.",
    turns:[
      {prompt:"Queremos hacer una actividad para mejorar el parque. ¿Qué podríamos organizar?",model:"Podríamos organizar una jornada de limpieza y plantar algunas flores.",alternatives:["Propongo limpiar el parque y mejorar las áreas verdes.","Podemos hacer una actividad de limpieza con los vecinos."],keywords:["limpieza","parque","flores","organ"],why:"Una propuesta clara dice qué actividad se hará y dónde."},
      {prompt:"Me gusta. ¿Qué día sería mejor?",model:"El sábado por la mañana podría funcionar bien.",alternatives:["Propongo el sábado en la mañana.","Podríamos hacerlo el sábado temprano."],keywords:["sabado","mañana"],why:"Usa “podría” para sugerir una opción sin imponerla."},
      {prompt:"¿A qué hora empezamos?",model:"Podríamos empezar a las nueve.",alternatives:["A las nueve me parece bien.","Propongo comenzar a las nueve de la mañana."],keywords:["nueve","empez"],why:"Una hora concreta ayuda a organizar responsabilidades."},
      {prompt:"Necesitamos bolsas, guantes y herramientas.",model:"Yo puedo encargarme de conseguir bolsas y guantes.",alternatives:["Puedo llevar las bolsas y los guantes.","Yo me responsabilizo por esos materiales."],keywords:["bolsas","guantes","encarg"],why:"“Me encargo de…” sirve para asumir una responsabilidad."},
      {prompt:"Perfecto. ¿Quién puede avisar a los demás vecinos?",model:"Puedo preparar un mensaje y enviarlo al grupo del barrio.",alternatives:["Yo puedo escribir el aviso para el grupo.","Me encargo de comunicar la actividad a los vecinos."],keywords:["mensaje","grupo","vecinos","aviso"],why:"Explica el medio de comunicación y a quién va dirigido."},
      {prompt:"¿Qué información debe tener el mensaje?",model:"Debe incluir el día, la hora, el lugar y lo que cada persona puede llevar.",alternatives:["Hay que poner fecha, hora y materiales necesarios.","El aviso debe explicar cuándo, dónde y qué necesitamos."],keywords:["dia","hora","lugar","llevar"],why:"Un aviso útil responde preguntas básicas: cuándo, dónde y qué se necesita."},
      {prompt:"¿Y si llueve ese día?",model:"Si llueve, podemos mover la actividad al domingo.",alternatives:["Podemos tener el domingo como fecha alternativa.","Si hay lluvia, avisamos que se cambia para el día siguiente."],keywords:["llueve","domingo","cambiar"],why:"Usa “si” para presentar una condición y una solución."},
      {prompt:"Buena idea. ¿Cómo confirmamos el cambio?",model:"Lo confirmamos por el grupo y pedimos que todos respondan que leyeron el mensaje.",alternatives:["Enviaremos un mensaje al grupo y pediremos confirmación.","Avisamos por escrito para que todos sepan el nuevo plan."],keywords:["grupo","mensaje","confirm","escrito"],why:"En una coordinación grupal, conviene indicar cómo se confirmará la información."},
      {prompt:"Perfecto. Creo que ya tenemos un buen plan.",model:"Sí. Voy a escribir un resumen con las tareas de cada persona.",alternatives:["Sí, haré un resumen para que todos sepan qué deben hacer.","De acuerdo. Compartiré las responsabilidades por escrito."],keywords:["resumen","tareas","personas","escrito"],why:"Un resumen final ayuda a que un acuerdo largo quede claro para todos."}
    ]
  }
];

const state = {
  level:1, scenario:null, turn:0, score:0, possible:0, wildcardUsed:0,
  startedAt:0, sending:false, runToken:0, userMessages:0,
  detour:null, detoursUsed:0, adaptiveSeen:[], closingOverride:"", memory:{}, progress:loadProgress()
};

function loadProgress(){
  try{
    const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
    return {
      completed:Array.isArray(v.completed)?v.completed:[],
      best:v.best&&typeof v.best==="object"?v.best:{},
      lastLevel:Number(v.lastLevel)||1
    };
  }catch(_){return {completed:[],best:{},lastLevel:1}}
}
function saveProgress(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.progress))}catch(_){}
}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function normalize(s){
  return String(s||"").trim().toLocaleLowerCase("es-PE")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[¿?¡!.,;:()"']/g," ").replace(/\s+/g," ").trim();
}
function levenshtein(a,b){
  a=normalize(a); b=normalize(b);
  if(!a.length)return b.length;if(!b.length)return a.length;
  const prev=Array.from({length:b.length+1},(_,i)=>i),cur=new Array(b.length+1);
  for(let i=1;i<=a.length;i++){
    cur[0]=i;
    for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    for(let j=0;j<=b.length;j++)prev[j]=cur[j];
  }
  return prev[b.length];
}
function similarity(a,b){
  const aa=normalize(a),bb=normalize(b),m=Math.max(aa.length,bb.length);
  return m?1-levenshtein(aa,bb)/m:1;
}
function words(s){return normalize(s).split(" ").filter(Boolean)}
function contextualizeTurn(sc,index,turn){
  if(!sc||!turn)return turn;
  if(sc.id==="bus-centro" && index===5 && state.memory.busStop==="farther"){
    return {
      prompt:"Ya pasamos la plaza. ¿Quieres que te avise cuando estemos cerca de tu paradero?",
      model:"Sí, por favor. Avísame cuando estemos cerca.",
      alternatives:["Sí, avísame por favor.","No, gracias. Yo estaré atento."],
      keywords:["si","no","avisa","cerca","paradero"],
      why:"Si cambiaste el lugar donde bajarás, la conversación también debe cambiar. Aquí puedes aceptar o rechazar la ayuda."
    };
  }
  return turn;
}
function currentTurn(){
  if(state.detour)return state.detour;
  const base=state.scenario?.turns[state.turn]||null;
  return contextualizeTurn(state.scenario,state.turn,base);
}
function nowTime(){
  const d=new Date(); return d.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit",hour12:false});
}
function stripAccents(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function escapeHTML(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function sentenceCase(s){
  s=String(s||"").trim().replace(/\s+/g," ").replace(/\s+([,.!?;:])/g,"$1");
  return s?s.charAt(0).toLocaleUpperCase("es-PE")+s.slice(1):s;
}
function accentsFromModel(user,model){
  const map=new Map();
  (String(model).match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)||[]).forEach(w=>{
    const key=stripAccents(w).toLocaleLowerCase("es-PE");
    if(w!==stripAccents(w)) map.set(key,w.toLocaleLowerCase("es-PE"));
  });
  return String(user).replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g,w=>{
    const key=stripAccents(w).toLocaleLowerCase("es-PE");
    if(!map.has(key))return w;
    const repl=map.get(key);
    return /^[A-ZÁÉÍÓÚÜÑ]/.test(w)?repl.charAt(0).toLocaleUpperCase("es-PE")+repl.slice(1):repl;
  });
}
function mechanicalCorrection(user,model){
  let s=sentenceCase(accentsFromModel(user,model));
  if(!s)return s;
  const modelTrim=String(model).trim();
  const isQuestion=modelTrim.startsWith("¿")||modelTrim.endsWith("?");
  const isExclamation=modelTrim.startsWith("¡")||modelTrim.endsWith("!");
  if(isQuestion){
    if(!s.startsWith("¿"))s="¿"+s.replace(/^\?/,"");
    if(!s.endsWith("?"))s=s.replace(/[.!]+$/,"")+"?";
  }else if(isExclamation){
    if(!s.startsWith("¡"))s="¡"+s.replace(/^!/,"");
    if(!s.endsWith("!"))s=s.replace(/[.?]+$/,"")+"!";
  }else if(!/[.!?]$/.test(s)){
    s+=".";
  }
  return s;
}

const CONNECTORS = ["porque","pero","aunque","entonces","por eso","para que","si","cuando","mientras","también","tambien","y"];
const TIME_PATTERNS = [
  /\b(?:hoy|ayer|mañana|manana|esta tarde|esta noche|esta mañana|esta manana|por la mañana|por la manana|por la tarde|por la noche)\b/i,
  /\b(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/i,
  /\ba las?\s+(?:\d{1,2}|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)(?:\s+y\s+(?:media|cuarto))?(?:\s+de la\s+(?:mañana|manana|tarde|noche))?/i
];
function firstMatch(text,patterns){
  for(const re of patterns){const m=String(text).match(re);if(m)return m[0]}
  return "";
}
function detectConnector(text){
  const n=" "+normalize(text)+" ";
  return CONNECTORS.find(x=>n.includes(" "+normalize(x)+" "))||"";
}
function extractDetails(text){
  const raw=String(text||"").trim(), n=normalize(raw);
  const time=firstMatch(raw,TIME_PATTERNS);
  const transport=(n.match(/\b(bus|taxi|moto|carro|auto|bicicleta|caminando|a pie|combi)\b/)||[])[1]||"";
  const payment=(n.match(/\b(tarjeta|efectivo|transferencia|yape|plin)\b/)||[])[1]||"";
  const feeling=(n.match(/\b(cansad[oa]|nervios[oa]|feliz|content[oa]|preocupad[oa]|tranquil[oa]|apurad[oa]|enfermo|enferma)\b/)||[])[1]||"";
  const reasonMatch=raw.match(/\bporque\s+([^.!?]{3,70})/i);
  const reason=reasonMatch?reasonMatch[1].trim():"";
  return {time,transport,payment,feeling,reason,yes:/^(si|sí)\b/i.test(raw),no:/^no\b/i.test(raw)};
}
const TOPIC_STOPWORDS=new Set(("hola gracias favor si no que como para por con sin una uno unos unas este esta esto ese esa mi tu su me te le lo la los las " +
"del al de el en y o pero porque entonces muy mas más ya aun aún todavía todavia aqui aquí alli allí bien claro perfecto acuerdo " +
"quiero quisiera puedo podria podría voy vamos tengo tiene hay hacer hizo ser estar es son soy estoy").split(/\s+/).map(normalize));
function salientWord(text){
  const ws=(String(text).match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)||[]).filter(w=>w.length>=4&&!TOPIC_STOPWORDS.has(normalize(w))&&!VERB_HINTS.has(normalize(w)));
  return ws.length?ws[ws.length-1]:"";
}
function adaptiveAcknowledgement(user,turn,semantic){
  if(semantic?.valid && semantic.ack)return semantic.ack;
  const d=extractDetails(user);
  if(d.reason)return "Entiendo; dices que "+d.reason.replace(/[.!?]+$/,"")+".";
  if(d.time)return "Perfecto, tomo en cuenta "+d.time+".";
  if(d.transport)return (d.transport==="caminando"||d.transport==="a pie")?"Ah, irás "+d.transport+".":"Ah, irás en "+d.transport+".";
  if(d.payment)return "De acuerdo, prefieres pagar con "+d.payment+".";
  if(d.feeling)return "Entiendo, te sientes "+d.feeling+".";
  const topic=salientWord(user);
  if(topic && !state.adaptiveSeen.includes(normalize(topic))){
    state.adaptiveSeen.push(normalize(topic));
    if(state.adaptiveSeen.length>6)state.adaptiveSeen.shift();
    return "Entiendo. Mencionas “"+topic+"”.";
  }
  if(d.yes)return "Perfecto.";
  if(d.no)return "Entiendo.";
  return "Te entiendo.";
}
function scenarioDomain(sc){
  const p=normalize(sc?.place||"");
  if(/salud|farmacia|hospital/.test(p))return "health";
  if(/trabajo/.test(p))return "work";
  if(/colegio|universidad|estudio|tareas/.test(p))return "study";
  if(/transporte|viaje/.test(p))return "transport";
  if(/mercado|compras|tienda|delivery/.test(p))return "shopping";
  if(/tramite|banco|municip|accesibilidad|vivienda|reniec/.test(p))return "admin";
  if(/familia|amigos|vecindario|social|deporte/.test(p))return "social";
  if(/tecnologia|internet/.test(p))return "tech";
  return "daily";
}
function buildAdaptiveDetour(user,sc,sourceIndex){
  if(!sc||state.detoursUsed>=2||sourceIndex<0)return null;
  if(sourceIndex!==1 && sourceIndex!==4 && sourceIndex!==7)return null;
  const d=extractDetails(user), domain=scenarioDomain(sc);
  const base={adaptive:true,alternatives:[],keywords:[],why:""};
  if(domain==="health")return Object.assign(base,{prompt:"Quiero entender mejor eso. ¿Ese malestar empezó hoy o ya venía de antes?",model:"Empezó ayer y hoy todavía lo siento.",alternatives:["Empezó hoy en la mañana.","Ya lo tenía desde ayer."],keywords:["empez","hoy","ayer","antes"],why:"Para explicar un síntoma, agrega cuándo empezó y si continúa."});
  if(domain==="work"||domain==="study")return Object.assign(base,{prompt:"Eso me da una idea más clara. ¿Qué parte te parece más importante o más difícil?",model:"La parte más difícil es organizar toda la información.",alternatives:["Lo más importante es terminar a tiempo.","Me cuesta un poco explicar las ideas con claridad."],keywords:["dificil","importante","organ","tiempo","clar"],why:"Explicar qué parte cuesta ayuda a continuar una conversación de estudio o trabajo."});
  if(domain==="transport"){
    if(d.time)return Object.assign(base,{prompt:"Ya que mencionaste "+d.time+", ¿por qué te conviene ese horario?",model:"Porque a esa hora tengo más tiempo y puedo llegar tranquilo.",alternatives:["Porque salgo del trabajo antes.","Porque así evito llegar tarde."],keywords:["porque","tiempo","trabajo","tarde"],why:"Usa “porque” para explicar la razón de una elección."});
    return Object.assign(base,{prompt:"¿Qué es lo que más te importa en este viaje: llegar rápido, gastar menos o ir más cómodo?",model:"Prefiero llegar a tiempo, aunque el viaje cueste un poco más.",alternatives:["Prefiero gastar menos.","Para mí es más importante viajar cómodo."],keywords:["prefiero","tiempo","menos","comodo","rapido"],why:"“Prefiero…” ayuda a expresar una elección y después puedes explicar por qué."});
  }
  if(domain==="shopping"){
    if(d.payment)return Object.assign(base,{prompt:"¿Sueles pagar con "+d.payment+" o hoy lo elegiste por alguna razón?",model:"Hoy lo elegí porque es más práctico.",alternatives:["Casi siempre pago así.","Normalmente pago en efectivo, pero hoy prefiero esto."],keywords:["porque","pago","normalmente","practico"],why:"Puedes explicar una costumbre con “normalmente” o una razón con “porque”."});
    return Object.assign(base,{prompt:"Además de lo que ya pediste, ¿hay algo que cambiarías de tu compra?",model:"Sí, prefiero llevar una cantidad más pequeña.",alternatives:["No, así está bien.","Cambiaría un producto por otro más económico."],keywords:["prefiero","cambiar","bien","pequena","econom"],why:"Practica preferencias con “prefiero” y cambios con “cambiaría”."});
  }
  if(domain==="admin")return Object.assign(base,{prompt:"Antes de seguir, ¿ya tienes todos los documentos o todavía te falta alguno?",model:"Tengo casi todo, pero todavía me falta una copia.",alternatives:["Sí, ya tengo todos los documentos.","Me falta un documento y debo conseguirlo."],keywords:["document","falta","todos","copia"],why:"“Me falta…” sirve para decir qué requisito todavía no tienes."});
  if(domain==="tech")return Object.assign(base,{prompt:"¿Ese problema ocurre siempre o solo en algunos momentos?",model:"Ocurre varias veces al día, sobre todo por la noche.",alternatives:["Solo ocurre a veces.","Me pasa casi siempre cuando uso esa función."],keywords:["siempre","veces","noche","cuando"],why:"Las expresiones de frecuencia ayudan a describir un problema con precisión."});
  if(domain==="social"){
    if(d.time)return Object.assign(base,{prompt:"¿Por qué te conviene "+d.time+"?",model:"Porque antes tengo otras cosas que hacer.",alternatives:["Porque a esa hora ya estoy libre.","Porque así todos pueden llegar con tiempo."],keywords:["porque","hora","tiempo","libre"],why:"Una conversación real suele continuar preguntando la razón de una hora o plan."});
    const topic=salientWord(user);
    return Object.assign(base,{prompt:topic?"Mencionaste “"+topic+"”. ¿Qué te gustaría que pase con eso?":"Y tú, ¿qué prefieres que pase en ese plan?",model:"Prefiero que sea tranquilo y que podamos conversar.",alternatives:["Prefiero algo sencillo.","Me gustaría que todos podamos participar."],keywords:["prefiero","gustaria","tranquilo","particip"],why:"“Prefiero…” y “me gustaría…” ayudan a expresar gustos con claridad."});
  }
  const topic=salientWord(user);
  return Object.assign(base,{prompt:topic?"Cuéntame un poco más sobre “"+topic+"”.":"Cuéntame un detalle más de lo que acabas de decir.",model:"Lo más importante para mí es que todo salga bien.",alternatives:["Hay un detalle que todavía quiero confirmar.","También quiero explicar una cosa más."],keywords:["importante","detalle","tambien","explicar"],why:"Agregar un detalle ayuda a pasar de respuestas cortas a una conversación más natural."});
}


const VERB_HINTS = new Set(("soy eres es somos son estoy estas está estamos estan voy vas va vamos van fui fue fueron iré ire " +
"tengo tienes tiene tenemos tuve quiero quieres quiere quisiera necesito necesitas debe debo podemos puedo podré podre " +
"llego llegas llega llegaré llegare salgo salí sali espero aviso avisa compro compra llevo pagar pago prefiero " +
"acepto recibí recibi reviso revisé revise termino terminé termine estudio estudia trabajo trabaja escribo escribe " +
"envío envio envia pregunto pregunta agradezco entiendo explico explica reuniremos vemos veré vere quedo queda firmo firmar " +
"seguiré seguire haré hare hago hacemos elijo elegí elegi tomo tomé tome duele viajaré viajare viajo recogeré recogere").split(/\s+/));

function findVerbWord(text){
  const list=String(text).match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)||[];
  return list.find(w=>VERB_HINTS.has(normalize(w)))||"";
}
function removePiece(text,piece){
  if(!piece)return text;
  const source=String(text), low=source.toLocaleLowerCase("es-PE"), needle=String(piece).toLocaleLowerCase("es-PE");
  const i=low.indexOf(needle);
  return i<0?source:source.slice(0,i)+" "+source.slice(i+piece.length);
}
function mapSentenceParts(text){
  const original=String(text||"").trim();
  if(!original)return [];
  const connector=detectConnector(original);
  const time=firstMatch(original,TIME_PATTERNS);
  const verb=findVerbWord(original);
  let who="YO (implícito)";
  if(verb){
    const low=normalize(original), v=normalize(verb), idx=low.indexOf(v);
    const before=original.slice(0,Math.max(0,idx)).replace(/[¿¡,.!?]+/g," ").trim();
    if(before && before.length<=32 && !(time||"").toLocaleLowerCase("es-PE").startsWith(before.toLocaleLowerCase("es-PE"))) who=before;
  }
  let rest=original;
  if(who!=="YO (implícito)")rest=removePiece(rest,who);
  rest=removePiece(rest,verb);rest=removePiece(rest,time);rest=removePiece(rest,connector);
  rest=rest.replace(/[¿¡,.!?;:]+/g," ").replace(/\s+/g," ").trim();
  const parts=[];
  parts.push({role:"who",label:"QUIÉN",text:who});
  if(verb)parts.push({role:"action",label:"ACCIÓN",text:verb});
  if(rest)parts.push({role:"what",label:"QUÉ / DÓNDE",text:rest.length>52?rest.slice(0,49)+"…":rest});
  if(time)parts.push({role:"time",label:"CUÁNDO",text:time});
  if(connector)parts.push({role:"link",label:"CONECTOR",text:connector});
  return parts;
}
function sentenceMapHTML(text){
  const parts=mapSentenceParts(text);
  if(!parts.length)return "";
  return '<div class="sentence-map">'+parts.map(p=>'<span class="map-part map-'+p.role+'"><small>'+escapeHTML(p.label)+'</small>'+escapeHTML(p.text)+'</span>').join("")+'</div>';
}
function structureHint(text){
  const roles=mapSentenceParts(text).map(p=>p.label);
  return roles.length?"Guía: "+roles.join(" + "):"Escribe una idea completa.";
}

function questionKind(prompt){
  const raw=String(prompt||""), n=normalize(raw);
  if(/todos? los documentos|documentos.*falta|falta.*documentos/.test(n)) return "completeness";
  if(/cambio.*direccion.*(?:telefono|numero)|cambiaron.*direccion.*(?:telefono|numero)/.test(n)) return "changes";
  if(/(?:direccion|datos|telefono|numero).*(?:correct|igual)/.test(n)) return "confirm-data";
  if(/\?/.test(raw) && (n.includes(" o ") || (n.includes(",") && /\bo\b/.test(n)))) return "choice";
  if(/\?/.test(raw) && /(?:tiene|tienes|puede|puedes|desea|quieres|quiere|ya|es|esta|viaja|necesita|acepta|prefiere|lleva|hay|debo|podemos|pagara|pagará|viaja solo)/.test(n)) return "yesno";
  return "open";
}

const CHOICE_STOPWORDS=new Set(("que cual cuales es son lo la los las el un una unos unas de del al a en por para con sin " +
"te le se me tu su mi y o si no mas más muy este esta esto ese esa donde cuando como cuanto cuanta desea quieres quiere " +
"prefieres prefiere vas va ir viajar bajar parte algo tambien también").split(/\s+/).map(normalize));

function choiceContentWords(text){
  return words(text).filter(w=>w.length>=3&&!CHOICE_STOPWORDS.has(w));
}
function inferChoiceNatural(prompt,user){
  const p=normalize(prompt), u=normalize(user), raw=String(user).trim();
  if(/mas adelante|adelante/.test(u) && /bajar/.test(p)) return "Voy a bajar más adelante.";
  if(/plaza/.test(u) && /bajar/.test(p)) return "Voy a bajar en la plaza.";
  if(/comod/.test(u) && /importa|prefier/.test(p)) return "Prefiero ir más cómodo.";
  if(/rapid/.test(u) && /importa|prefier/.test(p)) return "Prefiero llegar rápido.";
  if(/gastar menos|econom|barat|menos/.test(u) && /importa|prefier/.test(p)) return "Prefiero gastar menos.";
  if(/delantera/.test(u) && /asiento|parte/.test(p)) return "Prefiero un asiento en la parte delantera.";
  if(/posterior|atras|atrás/.test(u) && /asiento|parte/.test(p)) return "Prefiero un asiento en la parte posterior.";
  if(/defensa/.test(u) && /jugar/.test(p)) return "Prefiero jugar de defensa.";
  if(/adelante/.test(u) && /jugar/.test(p)) return "Prefiero jugar adelante.";
  if(/tableta/.test(u)) return "Me indicaron tabletas.";
  if(/jarabe/.test(u)) return "Me indicaron jarabe.";
  if(/ensalada/.test(u)) return "Prefiero ensalada, por favor.";
  if(/papa/.test(u) && /acompan/.test(p)) return "Prefiero papas, por favor.";
  if(/efectivo/.test(u) && /pagar/.test(p)) return "Voy a pagar en efectivo.";
  if(/tarjeta/.test(u) && /pagar/.test(p)) return "Voy a pagar con tarjeta.";
  if(/yape/.test(u) && /pagar/.test(p)) return "Voy a pagar con Yape.";
  if(/plin/.test(u) && /pagar/.test(p)) return "Voy a pagar con Plin.";
  if(/transferencia/.test(u) && /pagar/.test(p)) return "Voy a pagar por transferencia.";
  if(/grande/.test(u)) return "Prefiero la grande.";
  if(/pequen|pequeñ/.test(u)) return "Prefiero la pequeña.";
  const clean=sentenceCase(raw);
  return /[.!?]$/.test(clean)?clean:clean+".";
}
function inferChoiceAck(prompt,user,natural){
  const p=normalize(prompt), u=normalize(user);
  if(/mas adelante|adelante/.test(u) && /bajar/.test(p)) return "Entiendo, vas a bajar más adelante.";
  if(/plaza/.test(u) && /bajar/.test(p)) return "Entiendo, vas a bajar en la plaza.";
  if(/comod/.test(u)) return "Entiendo, para ti es más importante ir cómodo.";
  if(/rapid/.test(u)) return "Entiendo, para ti es más importante llegar rápido.";
  if(/gastar menos|econom|barat|menos/.test(u)) return "Entiendo, prefieres gastar menos.";
  if(/tarjeta|efectivo|yape|plin|transferencia/.test(u)) return "Perfecto, elegiste esa forma de pago.";
  return "Entiendo, elegiste “"+String(user).trim()+"”.";
}
function semanticChoiceAnswer(user,turn){
  const prompt=String(turn?.prompt||""), raw=String(user||"").trim();
  if(questionKind(prompt)!=="choice"||!raw)return null;
  const pWords=new Set(choiceContentWords(prompt));
  const uWords=choiceContentWords(raw);
  const overlap=uWords.filter(w=>pWords.has(w) || [...pWords].some(p=>p.includes(w)||w.includes(p)));
  if(!overlap.length)return null;
  const natural=inferChoiceNatural(prompt,raw);
  return {
    valid:true,type:"choice",choice:normalize(raw),natural,
    ack:inferChoiceAck(prompt,raw,natural),
    why:"Elegiste una de las opciones de la pregunta. Tu respuesta breve es válida; la frase completa es solo una forma de practicar español."
  };
}
function semanticDirectAnswer(user,turn){
  const raw=String(user||"").trim(), n=normalize(raw), kind=questionKind(turn?.prompt||"");
  const yes=/^(si|sí|claro|correcto|de acuerdo|esta bien|está bien|por supuesto)\b/.test(raw.toLocaleLowerCase("es-PE"));
  const no=/^(no|ninguno|ninguna|nada)\b/.test(n);
  const choice=semanticChoiceAnswer(raw,turn);
  if(choice)return choice;
  if(kind==="completeness"){
    if(/tengo todo|ya tengo todo|tengo todos|todos los documentos|no me falta nada|no falta nada/.test(n)){
      return {valid:true,type:"complete",natural:"Tengo todos los documentos.",ack:"Perfecto, ya tienes todos los documentos.",why:"La pregunta era si te faltaba algún documento. “Tengo todo” responde directamente y es suficiente."};
    }
    if(/me falta|todavia.*falta|aun.*falta|no tengo todo|falta un|falta una/.test(n)){
      return {valid:true,type:"missing",natural:sentenceCase(raw),ack:"Entiendo, todavía te falta algo.",why:"Tu respuesta indica claramente que todavía falta un requisito."};
    }
  }
  if(kind==="changes"){
    if(no||/no cambio|no cambió|siguen igual|todo igual|ningun cambio|ningún cambio/.test(n)){
      return {valid:true,type:"no-change",natural:"No, mis datos siguen iguales.",ack:"Entiendo, entonces esos datos siguen iguales.",why:"Como preguntaron si hubo cambios, “No” es una respuesta válida. La frase completa es opcional."};
    }
    if(/direccion/.test(n)&&/(telefono|numero|celular)/.test(n)){
      return {valid:true,type:"both-change",natural:sentenceCase(raw),ack:"Entiendo, cambiaron ambos datos.",why:"Mencionaste los dos datos que cambiaron."};
    }
    if(/direccion/.test(n)){
      return {valid:true,type:"address-change",natural:sentenceCase(raw),ack:"Entiendo, cambió tu dirección.",why:"La respuesta identifica exactamente qué dato cambió."};
    }
    if(/telefono|numero|celular/.test(n)){
      return {valid:true,type:"phone-change",natural:sentenceCase(raw),ack:"Entiendo, cambió tu número de teléfono.",why:"La respuesta identifica exactamente qué dato cambió."};
    }
  }
  if(kind==="confirm-data" && (yes||no)){
    return {valid:true,type:yes?"yes":"no",natural:yes?"Sí, está correcto.":"No, necesito corregirlo.",ack:yes?"Perfecto, ese dato está correcto.":"Entiendo, entonces hay que corregir ese dato.",why:"En una pregunta de confirmación, “Sí” o “No” puede ser suficiente."};
  }
  if(kind==="yesno" && (yes||no)){
    return {valid:true,type:yes?"yes":"no",natural:yes?"Sí.":"No.",ack:yes?"Perfecto.":"Entiendo.",why:"Esta es una pregunta de sí o no. Una respuesta breve puede ser natural y suficiente."};
  }
  return {valid:false,type:"",natural:"",ack:"",why:""};
}

const COMMON_ACCENTS = new Map([
  ["tambien","también"],["todavia","todavía"],["manana","mañana"],["sabado","sábado"],
  ["miercoles","miércoles"],["telefono","teléfono"],["direccion","dirección"],["informacion","información"],
  ["numero","número"],["rapido","rápido"],["comodo","cómodo"],["facil","fácil"],["dificil","difícil"],
  ["despues","después"],["aqui","aquí"],["alla","allá"],["proximo","próximo"],["medico","médico"],
  ["farmacia","farmacia"],["tramite","trámite"],["curriculum","currículum"],["también","también"]
]);

const ARTICLE_FIXES = [
  [/\bvoy banco\b/gi,"voy al banco"],[/\bestoy banco\b/gi,"estoy en el banco"],
  [/\bvoy hospital\b/gi,"voy al hospital"],[/\bestoy hospital\b/gi,"estoy en el hospital"],
  [/\bvoy mercado\b/gi,"voy al mercado"],[/\bestoy mercado\b/gi,"estoy en el mercado"],
  [/\bvoy universidad\b/gi,"voy a la universidad"],[/\bestoy universidad\b/gi,"estoy en la universidad"],
  [/\ba banco\b/gi,"al banco"],[/\ben banco\b/gi,"en el banco"],
  [/\ba hospital\b/gi,"al hospital"],[/\ben hospital\b/gi,"en el hospital"],
  [/\ba mercado\b/gi,"al mercado"],[/\ben mercado\b/gi,"en el mercado"],
  [/\ba centro\b/gi,"al centro"],[/\ben centro\b/gi,"en el centro"],
  [/\ba universidad\b/gi,"a la universidad"],[/\ben universidad\b/gi,"en la universidad"],
  [/\ba farmacia\b/gi,"a la farmacia"],[/\ben farmacia\b/gi,"en la farmacia"],
  [/\ba plaza\b/gi,"a la plaza"],[/\ben plaza\b/gi,"en la plaza"],
  [/\ba oficina\b/gi,"a la oficina"],[/\ben oficina\b/gi,"en la oficina"],
  [/\ba escuela\b/gi,"a la escuela"],[/\ben escuela\b/gi,"en la escuela"],
  [/\bel direccion\b/gi,"la dirección"],[/\bel tarea\b/gi,"la tarea"],[/\bla documento\b/gi,"el documento"],
  [/\bel cita\b/gi,"la cita"],[/\bla pago\b/gi,"el pago"],[/\bel pregunta\b/gi,"la pregunta"],
  [/\bun informacion\b/gi,"la información"],[/\buna problema\b/gi,"un problema"]
];

const TENSE_MAP_TO_FUTURE = new Map([
  ["fui","iré"],["llegué","llegaré"],["llegue","llegaré"],["salí","saldré"],["sali","saldré"],
  ["pagué","pagaré"],["pague","pagaré"],["hice","haré"],["terminé","terminaré"],["termine","terminaré"],
  ["envié","enviaré"],["envie","enviaré"],["revisé","revisaré"],["revise","revisaré"],
  ["compré","compraré"],["compre","compraré"],["estuve","estaré"],["tuve","tendré"]
]);
const TENSE_MAP_TO_PAST = new Map([
  ["iré","fui"],["ire","fui"],["llegaré","llegué"],["llegare","llegué"],["saldré","salí"],["saldre","salí"],
  ["pagaré","pagué"],["pagare","pagué"],["haré","hice"],["hare","hice"],["terminaré","terminé"],["terminare","terminé"],
  ["enviaré","envié"],["enviare","envié"],["revisaré","revisé"],["revisare","revisé"],["estaré","estuve"],["estare","estuve"]
]);

function restoreWordCase(original,replacement){
  if(!original)return replacement;
  if(original===original.toLocaleUpperCase("es-PE"))return replacement.toLocaleUpperCase("es-PE");
  if(original[0]===original[0].toLocaleUpperCase("es-PE"))return replacement[0].toLocaleUpperCase("es-PE")+replacement.slice(1);
  return replacement;
}
function applyCommonAccents(text){
  let changed=false;
  const out=String(text).replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g,w=>{
    const key=normalize(w);
    if(!COMMON_ACCENTS.has(key))return w;
    const repl=restoreWordCase(w,COMMON_ACCENTS.get(key));
    if(repl!==w)changed=true;
    return repl;
  });
  return {text:out,changed};
}
function fixQuestionWords(text){
  let s=String(text), changed=false;
  const looksQuestion=s.trim().endsWith("?")||s.trim().startsWith("¿");
  if(!looksQuestion)return {text:s,changed:false};
  const pairs=[["que","qué"],["como","cómo"],["cuando","cuándo"],["donde","dónde"],["cual","cuál"],["cuanto","cuánto"],["cuanta","cuánta"]];
  pairs.forEach(([plain,accent])=>{
    const re=new RegExp("(^|[¿\\s])"+plain+"(?=\\s)","i");
    if(re.test(s)){s=s.replace(re,(m,p1)=>p1+accent);changed=true}
  });
  return {text:s,changed};
}
function expectedTense(turn){
  const p=normalize(turn?.prompt||""), m=normalize(turn?.model||"");
  if(/ayer|anoche|la semana pasada|el mes pasado|desde cuando|desde cuándo|que paso|qué pasó|que hiciste|qué hiciste|tuvo|empezo|empezó|reinicio|reinició/.test(p))return "past";
  if(/manana|mañana|proximo|próximo|despues|después|luego|mas tarde|más tarde|cuando llegues|cuando estes|cuando estés|que haras|qué harás|vas a|va a|piensas|planeas|a que hora llegas|a qué hora llegas|cuando llegas|cuándo llegas|cuando terminan|cuándo terminan|cuando terminamos|cuándo terminamos/.test(p))return "future";
  if(/manana|mañana|proximo|próximo|esta tarde|esta noche/.test(m))return "future";
  if(/\b(?:ire|llegare|pagare|hare|estare|podre|terminare|enviare|revisare|viajare|saldre|tendre)\b/.test(m))return "future";
  if(/\b(?:fui|tuve|hice|sali|llegue|pague|termine|envie|revise|estuve|empezo)\b/.test(m))return "past";
  return "present";
}
function detectedTense(text){
  const n=normalize(text);
  if(/\b(?:fui|fue|tuve|hice|dije|sali|llegue|pague|compre|empezo|reinicie|revise|termine|trabaje|estuve|estaba|tenia|queria)\b/.test(n))return "past";
  if(/\bvoy a\b|\bvamos a\b|\b(?:ire|llegare|pagare|hare|estare|podre|terminare|enviare|revisare|viajare|saldre|tendre)\b/.test(n))return "future";
  return "present";
}
function transformTense(text,target){
  const map=target==="future"?TENSE_MAP_TO_FUTURE:target==="past"?TENSE_MAP_TO_PAST:null;
  if(!map)return {text:String(text),changed:false};
  let changed=false;
  const out=String(text).replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g,w=>{
    const key=w.toLocaleLowerCase("es-PE");
    const plain=stripAccents(key);
    let repl=map.get(key)||map.get(plain);
    if(!repl)return w;
    changed=true;return restoreWordCase(w,repl);
  });
  return {text:out,changed};
}
function fixArticles(text){
  let s=String(text),changed=false;
  ARTICLE_FIXES.forEach(([re,repl])=>{
    if(re.test(s)){re.lastIndex=0;s=s.replace(re,repl);changed=true}else re.lastIndex=0;
  });
  return {text:s,changed};
}
function expectedConnector(turn,user){
  const p=normalize(turn?.prompt||""), u=normalize(user);
  if(detectConnector(user))return "";
  if(/por que|por qué|razon|motivo/.test(p))return "porque";
  if(/que haras despues|qué harás después|despues|después|siguiente paso|luego/.test(p)&&words(user).length>=3)return "después";
  if(/algo mas|algo más|tambien|también/.test(p)&&words(user).length>=3)return "también";
  if(/que paso despues|qué pasó después/.test(p))return "después";
  if(/pero|aunque/.test(normalize(turn?.model||""))&&words(user).length>=6)return "pero";
  return "";
}
function addConnectorToIdea(text,connector,turn){
  let s=String(text).trim();
  if(!connector||!s)return {text:s,changed:false};
  const p=normalize(turn?.prompt||"");
  if(connector==="porque" && /por que|por qué|razon|motivo/.test(p)){
    const lower=s.charAt(0).toLocaleLowerCase("es-PE")+s.slice(1);
    return {text:"Porque "+lower.replace(/[.!?]+$/,"")+".",changed:true};
  }
  if(connector==="después" && !normalize(s).startsWith("despues")){
    return {text:"Después, "+s.charAt(0).toLocaleLowerCase("es-PE")+s.slice(1),changed:true};
  }
  if(connector==="también" && !normalize(s).startsWith("tambien")){
    return {text:"También "+s.charAt(0).toLocaleLowerCase("es-PE")+s.slice(1),changed:true};
  }
  return {text:s,changed:false};
}
function smartPunctuation(text,turn){
  let s=sentenceCase(text),changed=s!==String(text).trim();
  const alreadyQuestion=s.trim().endsWith("?")||s.trim().startsWith("¿");
  const userAsks=alreadyQuestion||/^(qué|cuándo|dónde|cuál|cuánto|cuánta|cómo|puedo|podría|debo|tengo que|hay|acepta|se puede)\b/i.test(s);
  if(userAsks){
    if(!s.startsWith("¿")){s="¿"+s.replace(/^\?/,"");changed=true}
    if(!s.endsWith("?")){s=s.replace(/[.!]+$/,"")+"?";changed=true}
  }else if(!/[.!?]$/.test(s)){s+=".";changed=true}
  const q=fixQuestionWords(s);return {text:q.text,changed:changed||q.changed};
}
function grammarCoach(user,turn,semantic){
  const notes=[];
  const rawUser=String(user||"").trim();
  const keepUserDetail=semantic?.valid && words(rawUser).length>2 && semantic.type!=="choice";
  let improved=keepUserDetail ? rawUser : (semantic?.valid && semantic.natural ? semantic.natural : rawUser);
  const original=improved;

  // “si” afirmativo al inicio lleva tilde; no se cambia el “si” condicional.
  const initialSiConditional=/^si\b[^,]{1,50},/i.test(improved);
  if(/^si\b/i.test(improved) && !initialSiConditional){
    improved=improved.replace(/^si\b/i,m=>m[0]===m[0].toUpperCase()?"SÍ":m[0][0]===m[0][0].toUpperCase()?"Sí":"sí");
    notes.push({kind:"orthography",icon:"🔤",label:"Ortografía",text:"“Sí” lleva tilde cuando significa afirmación."});
  }

  const accents=applyCommonAccents(improved);
  improved=accents.text;
  if(accents.changed)notes.push({kind:"orthography",icon:"🔤",label:"Ortografía",text:"Corregí una tilde o escritura frecuente."});

  const articles=fixArticles(improved);
  improved=articles.text;
  if(articles.changed)notes.push({kind:"article",icon:"🧩",label:"Artículo",text:"Ajusté el artículo o la unión de preposición + artículo: por ejemplo, “al banco” o “en el hospital”."});

  const expected=expectedTense(turn),actual=detectedTense(improved);
  if((expected==="future"&&actual==="past")||(expected==="past"&&actual==="future")){
    const tenseFix=transformTense(improved,expected);
    if(tenseFix.changed){
      improved=tenseFix.text;
      notes.push({kind:"tense",icon:"⏱️",label:"Tiempo verbal",text:expected==="future"?"La pregunta mira al futuro; cambié el verbo para hablar de lo que harás.":"La pregunta mira al pasado; cambié el verbo para contar lo que ya ocurrió."});
    }
  }else if(expected==="future"&&actual==="present"&&/\b(?:mañana|manana|próximo|proximo)\b/.test(normalize(turn?.prompt||""))){
    notes.push({kind:"tense",icon:"⏱️",label:"Tiempo verbal",text:"La pregunta habla del futuro. Tu forma puede ser válida en conversación, pero también puedes usar futuro: “iré”, “llegaré”, “haré”…"});
  }

  const connector=expectedConnector(turn,improved);
  const conn=addConnectorToIdea(improved,connector,turn);
  improved=conn.text;
  if(conn.changed)notes.push({kind:"connector",icon:"🔗",label:"Conector",text:"Añadí “"+connector+"” para unir la respuesta con la intención de la pregunta."});

  if(!detectConnector(improved) && /,[^,]{2,45}$/.test(improved) && (improved.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)||[]).length>=5){
    improved=improved.replace(/,\s*([^,]+)$/," y $1");
    notes.push({kind:"connector",icon:"🔗",label:"Conector",text:"Usé “y” para unir dos ideas relacionadas en una sola oración."});
  }

  const punct=smartPunctuation(improved,turn);
  improved=punct.text;
  if(punct.changed && !notes.some(n=>n.kind==="orthography"))notes.push({kind:"orthography",icon:"✍️",label:"Escritura",text:"Ajusté mayúscula y puntuación para que la frase quede completa."});

  const changed=normalize(improved)!==normalize(original)||improved.trim()!==original.trim();
  return {improved,changed,notes,expectedTense:expected,actualTense:actual};
}

function spellingTips(user,model,semantic){
  const tips=[], raw=String(user||"").trim(), m=String(model||"").trim();
  if(raw && /^[a-záéíóúüñ]/.test(raw))tips.push("Empieza la oración con mayúscula.");
  const modelQuestion=m.startsWith("¿")||m.endsWith("?");
  if(modelQuestion && raw.endsWith("?") && !raw.startsWith("¿"))tips.push("En español, una pregunta también lleva ¿ al inicio.");
  if(!/[.!?]$/.test(raw) && raw.split(/\s+/).length>3)tips.push("Puedes cerrar la idea con punto.");
  const modelWords=m.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)||[];
  const userWords=raw.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)||[];
  const userPlain=new Set(userWords.map(w=>normalize(w)));
  const accentFix=modelWords.find(w=>w!==stripAccents(w) && userPlain.has(normalize(w)) && !userWords.some(u=>u.toLocaleLowerCase("es-PE")===w.toLocaleLowerCase("es-PE")));
  if(accentFix)tips.push('Mira la tilde en “'+accentFix+'”.');
  if(!semantic?.valid && words(raw).length<=2 && words(m).length>=6)tips.push("La idea es muy corta para esta pregunta: agrega un dato importante.");
  const conn=detectConnector(m);
  if(!semantic?.valid && conn && !detectConnector(raw) && words(raw).length>=4)tips.push('Puedes unir mejor las ideas con “'+conn+'”.');
  return tips.slice(0,2);
}

function evaluate(user,turn,usedWildcard=false){
  const variants=[turn.model,...(turn.alternatives||[])];
  let sim=0;
  variants.forEach(v=>sim=Math.max(sim,similarity(user,v)));
  const n=normalize(user);
  const keys=(turn.keywords||[]).map(normalize);
  const matches=keys.filter(k=>k&&n.includes(k)).length;
  const keyRatio=keys.length?matches/Math.min(keys.length,3):0;
  const semantic=semanticDirectAnswer(user,turn);
  const coach=grammarCoach(user,turn,semantic);
  let grade="improve";
  const userWordCount=words(user).length;
  if(semantic.valid)grade="excellent";
  else if(sim>=.86)grade="excellent";
  else if(sim>=.52||keyRatio>=.50||(userWordCount>=5&&matches>=1))grade="good";
  const corrected=coach.improved||mechanicalCorrection(user,turn.model);
  const mechanicalChanged=corrected.trim()!==String(user).trim();
  const points=usedWildcard?1:(grade==="excellent"?2:grade==="good"?2:1);
  return {grade,sim,keyRatio,corrected,mechanicalChanged,points,matches,userWordCount,semantic,coach};
}
function shuffle(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

function renderHome(){
  state.level=clamp(state.progress.lastLevel||1,1,5);
  $("levelGrid").innerHTML=levels.map(l=>`
    <button class="level-card ${l.id===state.level?"active":""}" data-level="${l.id}" type="button">
      <span class="level-no">Nivel ${l.id}</span><span class="level-icon">${l.icon}</span>
      <strong>${l.name}</strong><small>${l.desc}</small>
    </button>`).join("");
  $("levelGrid").querySelectorAll(".level-card").forEach(b=>b.addEventListener("click",()=>{
    state.level=Number(b.dataset.level);state.progress.lastLevel=state.level;saveProgress();
    renderHome();
    setTimeout(()=>$("scenarioSection").scrollIntoView({behavior:"smooth",block:"start"}),50);
  }));
  renderScenarios();
  $("homeProgress").textContent=`${state.progress.completed.length} completadas`;
}
function renderScenarios(){
  const level=levels.find(l=>l.id===state.level);
  $("scenarioTitle").textContent=level.name;
  $("levelBadge").textContent="Nivel "+state.level;
  const list=scenarios.filter(s=>s.level===state.level);
  $("scenarioGrid").innerHTML=list.map(s=>{
    const done=state.progress.completed.includes(s.id);
    const best=state.progress.best[s.id];
    return `<button class="scenario-card" type="button" data-id="${s.id}">
      <span class="sc-avatar">${s.avatar}</span>
      <span class="sc-main"><strong>${escapeHTML(s.name)}</strong><span>${escapeHTML(s.situation)}</span>
        <span class="sc-meta"><i>${escapeHTML(s.place)}</i><i>${escapeHTML(s.duration)}</i>${done?`<i class="sc-done">✓ ${best||0}%</i>`:""}</span>
      </span>
    </button>`;
  }).join("");
  $("scenarioGrid").querySelectorAll(".scenario-card").forEach(b=>b.addEventListener("click",()=>startScenario(b.dataset.id)));
}

function startScenario(id){
  const sc=scenarios.find(s=>s.id===id); if(!sc)return;
  state.runToken++;
  const token=state.runToken;
  state.scenario=sc;state.turn=0;state.score=0;state.possible=0;state.wildcardUsed=0;state.startedAt=Date.now();state.sending=false;
  state.userMessages=0;state.detour=null;state.detoursUsed=0;state.adaptiveSeen=[];state.closingOverride="";state.memory={};
  $("screenHome").classList.add("hidden");$("screenChat").classList.remove("hidden");
  $("contactAvatar").textContent=sc.avatar;$("contactName").textContent=sc.name;
  $("contactStatus").textContent="Tutor inteligente · práctica simulada";
  $("lessonSituation").textContent=sc.place+" · "+sc.situation;
  $("messages").innerHTML='<div class="day-chip">Hoy · práctica de escritura</div>';
  closeWildcard();updateChatHud();setInputEnabled(false);
  showTypingThen(()=>{addMessage("them",sc.turns[0].prompt);setInputEnabled(true);$("messageInput").focus();},520,token);
}
function addMessage(side,text){
  const row=document.createElement("div");row.className="msg-row "+side;
  row.innerHTML=`<div class="msg-bubble">${escapeHTML(text)}<span class="msg-time">${nowTime()}${side==="me"?'<span class="msg-check">✓✓</span>':""}</span></div>`;
  $("messages").appendChild(row);scrollBottom();
}
function addCorrection(result,turn,usedWildcard,userText){
  const note=document.createElement("div");
  const semantic=result.semantic||{valid:false};
  const coach=result.coach||grammarCoach(userText,turn,semantic);
  note.className="ai-note "+(result.grade==="improve"?"improve":"good")+(semantic.valid?" concise":"");

  let title="";
  if(usedWildcard) title="🃏 Aprende de esta respuesta";
  else if(semantic.valid) title="✅ Tu respuesta funciona";
  else if(result.grade==="excellent") title="✨ Muy bien";
  else if(result.grade==="good") title="✨ Se entiende bien";
  else title="✍️ Mejoremos tu mensaje";

  const same=String(coach.improved||"").trim()===String(userText).trim();
  const intro=same
    ? "Tu mensaje ya está bien para esta situación."
    : "Mejoré tu misma idea sin cambiar lo que quisiste decir.";

  const grammarNotes=(coach.notes||[]).map(n=>
    '<div class="grammar-note grammar-'+escapeHTML(n.kind)+'"><span class="grammar-note-icon">'+escapeHTML(n.icon)+'</span><div><b>'+escapeHTML(n.label)+'</b><span>'+escapeHTML(n.text)+'</span></div></div>'
  ).join("");

  note.innerHTML=
    '<div class="ai-note-head">'+escapeHTML(title)+'</div>'+
    '<div class="coach-intro">'+escapeHTML(intro)+'</div>'+
    '<div class="coach-compare">'+
      '<div class="coach-line coach-original"><small>TÚ ESCRIBISTE</small><span>'+escapeHTML(userText)+'</span></div>'+
      (!same?'<div class="coach-arrow">↓</div><div class="coach-line coach-improved"><small>VERSIÓN MEJORADA</small><span>'+escapeHTML(coach.improved)+'</span></div>':"")+
    '</div>'+
    (words(coach.improved).length>1?sentenceMapHTML(coach.improved):"")+
    (grammarNotes?'<div class="grammar-notes">'+grammarNotes+'</div>':"")+
    (!grammarNotes&&semantic.valid?'<div class="correction-item"><span>✅</span><span>'+escapeHTML(semantic.why||"La respuesta es adecuada para la pregunta.")+'</span></div>':"")+
    (words(coach.improved).length>1?'<div class="ai-note-focus"><span>🎨</span><span>Azul: quién · rojo: acción · verde: qué/dónde · morado: cuándo · amarillo: conector.</span></div>':"");
  $("messages").appendChild(note);scrollBottom();
}
function showTypingThen(fn,delay=650,token=state.runToken){
  const row=document.createElement("div");row.className="msg-row them";row.dataset.typing="1";
  row.innerHTML='<div class="typing-msg"><i></i><i></i><i></i></div>';
  $("messages").appendChild(row);scrollBottom();
  setTimeout(()=>{
    row.remove();
    if(token!==state.runToken)return;
    fn&&fn();
  },delay);
}
function scrollBottom(){requestAnimationFrame(()=>$("messages").scrollTo({top:$("messages").scrollHeight,behavior:"smooth"}))}
function updateChatHud(){
  const total=state.scenario?.turns.length||1;
  $("turnCounter").textContent=state.detour?"↪ extra":`${Math.min(state.turn+1,total)}/${total}`;
  $("lessonProgress").style.width=`${Math.min(state.turn,total)/total*100}%`;
  $("lessonScore").textContent=`✍️ ${state.score}`;
  const t=currentTurn();
  $("smartTipText").textContent=t?structureHint(t.model):"Conversación completada.";
}
function autoGrow(){
  const el=$("messageInput");el.style.height="auto";el.style.height=Math.min(el.scrollHeight,118)+"px";
}
function setInputEnabled(enabled){
  $("messageInput").disabled=!enabled;$("btnSend").disabled=!enabled;state.sending=!enabled;
}

function rememberSemanticContext(sc,turn,semantic){
  if(!sc||!turn||!semantic?.valid)return;
  const p=normalize(turn.prompt||""), choice=semantic.choice||"";
  if(sc.id==="bus-centro"){
    if(/bajar.*plaza.*adelante/.test(p)){
      if(/adelante/.test(choice))state.memory.busStop="farther";
      else if(/plaza/.test(choice))state.memory.busStop="plaza";
    }
    if(/mas te importa|más te importa/.test(p)){
      if(/comod/.test(choice))state.memory.travelPriority="comfort";
      else if(/rapid/.test(choice))state.memory.travelPriority="fast";
      else if(/menos|econom|barat/.test(choice))state.memory.travelPriority="cheap";
    }
  }
}

function applyContextualFlow(sc,sourceIndex,semantic){
  if(!sc||!semantic?.valid)return null;

  // Bodega: si no pide nada más, no preguntar por el tamaño de un producto no pedido.
  if(sc.id==="bodega-pan" && sourceIndex===1 && semantic.type==="no"){
    return {nextTurn:3};
  }

  // Bus: si eligió bajar más adelante y luego no necesita aviso, cerrar sin contradecirlo.
  if(sc.id==="bus-centro" && sourceIndex===5 && state.memory.busStop==="farther" && semantic.type==="no"){
    return {
      nextTurn:sc.turns.length,
      closing:"Está bien. Entonces sigue atento a tu paradero. Que tengas buen viaje."
    };
  }

  // RENIEC: si el pago ya está hecho, saltar la explicación de canales de pago.
  if(sc.id==="reniec-dni" && sourceIndex===2 && semantic.type==="yes"){
    return {nextTurn:4};
  }

  // Entrevista: si no tiene consultas, cerrar sin inventar una pregunta.
  if(sc.id==="entrevista-trabajo" && sourceIndex===6 && semantic.type==="no"){
    return {
      nextTurn:sc.turns.length,
      closing:"Perfecto. Entonces queda confirmada la entrevista para el martes. Muchas gracias y éxitos."
    };
  }

  // Terminal: si decide no pagar aún, no afirmar después que el pago fue aprobado.
  if(sc.id==="viaje-terminal" && sourceIndex===8 && semantic.type==="no"){
    return {
      nextTurn:sc.turns.length,
      closing:"De acuerdo. El pasaje todavía no queda emitido hasta completar el pago. Puedes continuar cuando estés listo."
    };
  }

  return null;
}

function sendMessage(text,usedWildcard=false){
  const turn=currentTurn();
  const wasDetour=!!state.detour;
  const sourceIndex=state.turn;
  const token=state.runToken;
  text=String(text||"").trim();
  if(!turn||!text||state.sending)return;
  closeWildcard();
  $("messageInput").dataset.lastSent=text;
  addMessage("me",text);
  $("messageInput").value="";autoGrow();setInputEnabled(false);

  const result=evaluate(text,turn,usedWildcard);
  rememberSemanticContext(state.scenario,turn,result.semantic);
  state.score+=result.points;state.possible+=2;state.userMessages++;
  if(usedWildcard)state.wildcardUsed++;

  setTimeout(()=>{if(token===state.runToken)addCorrection(result,turn,usedWildcard,text)},220);

  if(wasDetour)state.detour=null;
  else {
    state.turn++;
    const flow=applyContextualFlow(state.scenario,sourceIndex,result.semantic);
    if(flow){
      if(Number.isInteger(flow.nextTurn))state.turn=flow.nextTurn;
      if(flow.closing)state.closingOverride=flow.closing;
    }
  }
  updateChatHud();

  setTimeout(()=>{
    if(token!==state.runToken||!state.scenario)return;
    const ack=adaptiveAcknowledgement(text,turn,result.semantic);

    // Después de una respuesta principal, el chat puede tomar un detalle del usuario
    // y abrir una pequeña rama antes de volver al objetivo de la situación.
    if(!wasDetour && state.turn<state.scenario.turns.length){
      const branch=result.semantic?.valid && result.userWordCount<=4 ? null : buildAdaptiveDetour(text,state.scenario,sourceIndex);
      if(branch){
        state.detour=branch;state.detoursUsed++;updateChatHud();
        showTypingThen(()=>{
          addMessage("them",ack+" "+branch.prompt);
          setInputEnabled(true);updateChatHud();$("messageInput").focus();
        },650,token);
        return;
      }
    }

    if(state.turn>=state.scenario.turns.length && !state.detour){
      showTypingThen(()=>{
        addMessage("them",ack+" "+(state.closingOverride||state.scenario.closing));
        $("lessonProgress").style.width="100%";
        setTimeout(()=>{if(token===state.runToken)finishScenario()},850);
      },520,token);
    }else{
      const next=currentTurn();
      showTypingThen(()=>{
        addMessage("them",ack+" "+next.prompt);
        setInputEnabled(true);updateChatHud();$("messageInput").focus();
      },620,token);
    }
  },780);
}
function openWildcard(){
  const turn=currentTurn();if(!turn||state.sending)return;
  const opts=shuffle([turn.model,...(turn.alternatives||[])]).slice(0,3);
  $("wildcardOptions").innerHTML=opts.map(o=>`<button class="wildcard-option" type="button">${escapeHTML(o)}</button>`).join("");
  $("wildcardOptions").querySelectorAll("button").forEach((b,i)=>b.addEventListener("click",()=>sendMessage(opts[i],true)));
  $("wildcardPanel").classList.remove("hidden");
}
function closeWildcard(){$("wildcardPanel").classList.add("hidden")}
function finishScenario(){
  setInputEnabled(false);
  const percent=Math.round(state.score/Math.max(1,state.possible)*100);
  if(!state.progress.completed.includes(state.scenario.id))state.progress.completed.push(state.scenario.id);
  state.progress.best[state.scenario.id]=Math.max(Number(state.progress.best[state.scenario.id])||0,percent);
  saveProgress();
  const mins=Math.max(1,Math.round((Date.now()-state.startedAt)/60000));
  showModal("🏆","Conversación completada",`
    <div class="result-score">${percent}%</div>
    <p>Terminaste una conversación completa de <strong>${escapeHTML(state.scenario.situation)}</strong>.</p>
    <div class="result-grid">
      <div class="result-box"><strong>${state.userMessages}</strong><span>mensajes tuyos</span></div>
      <div class="result-box"><strong>${state.wildcardUsed}</strong><span>comodines</span></div>
      <div class="result-box"><strong>${mins} min</strong><span>práctica</span></div>
    </div>
    <p><strong>Objetivo:</strong> ${escapeHTML(state.scenario.goal)}</p>
  `,[
    {label:"Otra conversación",cls:"modal-primary",action:()=>backHome(true)},
    {label:"Repetir",cls:"modal-secondary",action:()=>startScenario(state.scenario.id)}
  ]);
}
function backHome(close=true){
  state.runToken++;
  if(close)hideModal();
  closeWildcard();state.scenario=null;
  $("screenChat").classList.add("hidden");$("screenHome").classList.remove("hidden");
  setInputEnabled(true);renderHome();
}
function showHelp(){
  showModal("💬","Cómo se juega",`
    <p><strong>Chat en Español</strong> es una práctica visual de conversación para aprender a escribir mejor en español del Perú.</p>
    <p>La persona del chat es una <strong>simulación educativa</strong>. Puedes escribir con tus propias palabras: no necesitas copiar una frase exacta.</p>
    <p>Después de enviar, el tutor revisa claridad, palabras importantes, acentos y puntuación. Si tu idea es válida, la reconoce; si puede mejorar, te muestra una forma más natural.</p>
    <p><strong>La conversación puede cambiar según lo que escribas.</strong> Si mencionas una hora, un medio de transporte, una razón, una forma de pago, un problema o un tema nuevo, el interlocutor puede tomar ese detalle y preguntarte algo relacionado antes de continuar.</p>
    <p>🎨 <strong>Guía de colores:</strong> azul = quién, rojo = acción/verbo, verde = qué o dónde, morado = cuándo y amarillo = conector. El texto acompaña siempre al color para que la guía no dependa solo de distinguir colores.</p>
    <p>🃏 <strong>Comodín:</strong> abre tres respuestas posibles cuando no sabes qué escribir. Todas están redactadas para que puedas aprender de ellas.</p>
    <p>La información importante siempre aparece por escrito y no necesitas escuchar audio para jugar.</p>
  `,[{label:"Entendido",cls:"modal-primary",action:hideModal}]);
}
function showScenarioInfo(){
  if(!state.scenario)return;
  showModal(state.scenario.avatar,state.scenario.name,`
    <p><strong>Situación:</strong> ${escapeHTML(state.scenario.situation)}</p>
    <p><strong>Nivel:</strong> ${state.scenario.level} · ${escapeHTML(levels.find(l=>l.id===state.scenario.level).name)}</p>
    <p><strong>Objetivo:</strong> ${escapeHTML(state.scenario.goal)}</p>
    <p><strong>Duración aproximada:</strong> ${escapeHTML(state.scenario.duration)}</p>
    <p>Esta es una simulación educativa; no estás enviando mensajes a una persona real.</p>
  `,[
    {label:"Seguir conversando",cls:"modal-primary",action:hideModal},
    {label:"Salir de la conversación",cls:"modal-secondary",action:()=>backHome(true)}
  ]);
}
function showModal(icon,title,html,actions=[]){
  $("modalIcon").textContent=icon;$("modalTitle").textContent=title;$("modalBody").innerHTML=html;
  $("modalActions").innerHTML="";
  actions.forEach(a=>{const b=document.createElement("button");b.type="button";b.textContent=a.label;b.className=a.cls||"modal-primary";b.addEventListener("click",a.action);$("modalActions").appendChild(b)});
  $("modal").classList.remove("hidden");
}
function hideModal(){$("modal").classList.add("hidden")}
function toast(msg){
  $("toast").textContent=msg;$("toast").classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>$("toast").classList.remove("show"),1700);
}
function backToLspedia(){
  const fallback="../?vista=herramientas-jugar";
  try{
    if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1)history.back();
    else location.href=fallback;
  }catch(_){location.href=fallback}
}

$("btnBackLspedia").addEventListener("click",backToLspedia);
$("btnHelp").addEventListener("click",showHelp);
$("btnChatBack").addEventListener("click",()=>backHome(false));
$("btnChatMenu").addEventListener("click",showScenarioInfo);
$("btnWildcard").addEventListener("click",openWildcard);
$("btnCloseWildcard").addEventListener("click",closeWildcard);
$("btnSend").addEventListener("click",()=>sendMessage($("messageInput").value,false));
$("messageInput").addEventListener("input",autoGrow);
$("messageInput").addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage($("messageInput").value,false)}
});
$("modalClose").addEventListener("click",hideModal);
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))hideModal()});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.scenario)setTimeout(scrollBottom,80)});
window.addEventListener("pageshow",()=>{if(state.scenario)setTimeout(scrollBottom,80)});

renderHome();
})();